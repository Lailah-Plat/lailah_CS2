import { 
  sequelize,
  SplitTransaction,
  SettlementInstruction,
  Beneficiary,
  RefundAllocation,
  LedgerJournal,
  LedgerEntry,
  GatewayEvent,
  ReconciliationRun,
  ReconciliationItem,
  GatewayCapability,
  Wallet,
  WalletTransaction
} from '../../models/Database.js';
import { FinancialEngine, FinancialSnapshotData } from '../finance/FinancialEngine.js';
import { generateRevenueNumber, generateExpenseNumber, generateInvoiceNumber, getYearSuffix } from '../../modules/finance/usecases/GenerateId.js';
import { Logger } from '../logger.service.js';
import { Op } from 'sequelize';

export interface CreatePaymentSnapshotInput {
  paymentId: string;
  bookingId: number;
  providerId: number;
  grossAmountHalalas: number; // e.g., 100000 Halalas = 1000.00 SAR
  commissionRate: number; // e.g. 0.10
  gatewayFeeRate?: number;
  gatewayFlatFeeHalalas?: number;
}

export interface RefundQuoteInput {
  paymentId: string;
  refundAmountHalalas: number;
  reason: string;
  cancelledBy: 'customer' | 'provider' | 'admin' | 'force_majeure';
  cancellationFeeHalalas?: number;
}

export class UnifiedPaymentsEngine {
  private static readonly DEFAULT_VAT_RATE = 0.15;
  private static readonly RULES_VERSION = 'V2.5.0';

  /**
   * 1. Capture Payment & Freeze Immutable Transaction Snapshot (ADR-004)
   * Converts SAR to Halalas and creates immutable SplitTransaction records.
   */
  static async processPaymentCapture(input: CreatePaymentSnapshotInput, options?: any) {
    const transaction = options?.transaction;
    const { paymentId, bookingId, providerId, grossAmountHalalas, commissionRate, gatewayFeeRate = 0.02, gatewayFlatFeeHalalas = 100 } = input;

    const grossSar = grossAmountHalalas / 100;
    const calcs = FinancialEngine.calculate({
      grossAmount: grossSar,
      commissionRate,
      gatewayFeeRate,
      gatewayFlatFee: gatewayFlatFeeHalalas / 100
    });

    const gatewayFeeHalalas = Math.round(calcs.gatewayFee * 100);
    const commissionAmountHalalas = Math.round(calcs.commissionAmount * 100);
    const commissionBaseHalalas = Math.round(calcs.commissionBase * 100);
    const commissionVatHalalas = Math.round(calcs.commissionVat * 100);
    const providerShareHalalas = Math.round(calcs.providerShare * 100);

    // Create SplitTransaction Snapshots
    const splits = await Promise.all([
      // Platform Commission Share
      SplitTransaction.create({
        paymentId,
        bookingId,
        providerId: null,
        role: 'platform',
        type: 'percentage',
        amount: commissionAmountHalalas,
        percentage: commissionRate,
        status: 'available',
        refundable: true,
        feeSource: 'platform',
        ruleVersion: this.RULES_VERSION,
        metadata: { commissionBaseHalalas, commissionVatHalalas }
      }, { transaction }),

      // Provider Share
      SplitTransaction.create({
        paymentId,
        bookingId,
        providerId,
        role: 'provider',
        type: 'percentage',
        amount: providerShareHalalas,
        percentage: (calcs.providerShare / grossSar),
        status: 'held', // Pending event completion
        refundable: true,
        feeSource: 'provider',
        ruleVersion: this.RULES_VERSION
      }, { transaction }),

      // Gateway Fee
      SplitTransaction.create({
        paymentId,
        bookingId,
        providerId: null,
        role: 'gateway_fee',
        type: 'fixed',
        amount: gatewayFeeHalalas,
        percentage: null,
        status: 'paid',
        refundable: false,
        feeSource: 'gateway',
        ruleVersion: this.RULES_VERSION
      }, { transaction })
    ]);

    // Create Double-Entry Journal (ADR-002 & Section 4.3)
    await this.postDoubleEntryJournal({
      journalNo: await generateRevenueNumber(),
      referenceId: paymentId,
      referenceType: 'payment_capture',
      description: `تحصيل مبلغ حجز #${bookingId} وتثبيت اللقطة المالية`,
      entries: [
        { walletType: 'gateway_fee', type: 'debit', amount: grossAmountHalalas, description: 'تحصيل إجمالي عبر بوابة الدفع' },
        { walletType: 'provider', providerId, type: 'credit', amount: providerShareHalalas, description: 'حصة المزود المعلقة' },
        { walletType: 'platform_revenue', type: 'credit', amount: commissionBaseHalalas, description: 'صافي عمولة المنصة المكتسبة' },
        { walletType: 'platform_vat', type: 'credit', amount: commissionVatHalalas, description: 'ضريبة القيمة المضافة المحصلة' },
        { walletType: 'gateway_fee', type: 'credit', amount: gatewayFeeHalalas, description: 'مصروفات اقتطاع البوابة' }
      ]
    }, { transaction });

    // Ensure Beneficiary Record Exists
    let beneficiary = await Beneficiary.findOne({ where: { providerId }, transaction });
    if (!beneficiary) {
      beneficiary = await Beneficiary.create({
        providerId,
        officialName: `المزود #${providerId}`,
        commercialRegister: '1010000000',
        iban: 'SA0000000000000000000000',
        bankName: 'البنك الأهلي السعودي',
        kycStatus: 'pending_kyc'
      }, { transaction });
    }

    // Schedule Deferred Settlement Instruction (ADR-003 & Section 5.2)
    const providerSplit = splits.find(s => s.role === 'provider');
    const eligibleAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours post-event default

    const currentYear = new Date().getFullYear();
    const countThisYear = await SettlementInstruction.count({
      where: { createdAt: { [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`) } },
      transaction
    });
    const instructionNo = `SRV-${String(currentYear).slice(-2)}-${String(countThisYear + 1).padStart(10, '0')}`;

    const settlementInst = await SettlementInstruction.create({
      paymentId,
      providerId,
      beneficiaryId: beneficiary.id,
      splitTransactionId: providerSplit?.id || null,
      instructionNo,
      amount: providerShareHalalas,
      currency: 'SAR',
      eligibleAt,
      status: beneficiary.kycStatus === 'active' ? 'pending_eligibility' : 'on_hold',
      holdReason: beneficiary.kycStatus === 'active' ? null : 'بانتظار اكتمال توثيق KYB والآيبان للمزود'
    }, { transaction });

    Logger.financial(`Payment captured & snapshot created for payment #${paymentId}`, {
      grossAmountHalalas,
      providerShareHalalas,
      instructionNo
    });

    return {
      splits,
      settlementInstruction: settlementInst
    };
  }

  /**
   * 2. Double-Entry Journal Posting with Strict Balance Validation (Section 4.3)
   * Enforces sum(Debits) === sum(Credits).
   */
  static async postDoubleEntryJournal(data: {
    journalNo: string;
    referenceId: string;
    referenceType: string;
    description: string;
    entries: Array<{
      walletType: 'provider' | 'platform_revenue' | 'platform_vat' | 'gateway_fee';
      providerId?: number | null;
      type: 'debit' | 'credit';
      amount: number; // In Halalas
      description: string;
    }>;
  }, options?: any) {
    const transaction = options?.transaction;

    const totalDebit = data.entries.filter(e => e.type === 'debit').reduce((sum, e) => sum + Number(e.amount), 0);
    const totalCredit = data.entries.filter(e => e.type === 'credit').reduce((sum, e) => sum + Number(e.amount), 0);

    // Strict Double-Entry Balance Verification
    if (totalDebit !== totalCredit) {
      throw new Error(`Double-Entry Ledger Imbalance Violation! Total Debits (${totalDebit}) !== Total Credits (${totalCredit})`);
    }

    const journal = await LedgerJournal.create({
      journalNo: data.journalNo,
      referenceId: data.referenceId,
      referenceType: data.referenceType,
      description: data.description,
      totalDebit,
      totalCredit,
      balanced: true,
      postedBy: 'SYSTEM_FINANCIAL_ENGINE'
    }, { transaction });

    for (const entryData of data.entries) {
      await FinancialEngine.postLedgerEntry({
        walletType: entryData.walletType,
        providerId: entryData.providerId || null,
        referenceId: data.referenceId,
        referenceType: data.referenceType,
        type: entryData.type,
        amount: entryData.amount / 100, // Convert to SAR for compatibility ledger table
        description: entryData.description
      }, { transaction });
    }

    return journal;
  }

  /**
   * 3. Settlement Instruction State Machine Management (Section 5.2)
   */
  static async updateSettlementStatus(
    instructionNo: string,
    targetStatus: 'scheduled' | 'on_hold' | 'release_requested' | 'processing' | 'paid' | 'cancelled' | 'reversed',
    reason?: string,
    options?: any
  ) {
    const transaction = options?.transaction;

    const inst = await SettlementInstruction.findOne({
      where: { instructionNo },
      transaction
    });

    if (!inst) {
      throw new Error(`Settlement instruction #${instructionNo} not found.`);
    }

    // State Machine Transitions Validation
    const validTransitions: Record<string, string[]> = {
      'draft': ['pending_eligibility', 'cancelled'],
      'pending_eligibility': ['scheduled', 'on_hold', 'cancelled'],
      'scheduled': ['on_hold', 'release_requested', 'cancelled'],
      'on_hold': ['pending_eligibility', 'scheduled', 'cancelled'],
      'release_requested': ['processing', 'on_hold', 'cancelled'],
      'processing': ['paid', 'failed', 'on_hold'],
      'paid': ['reversed', 'partially_reversed'],
      'failed': ['scheduled', 'on_hold', 'cancelled']
    };

    const allowed = validTransitions[inst.status] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`Invalid Settlement State Transition from '${inst.status}' to '${targetStatus}'. Allowed: ${allowed.join(', ')}`);
    }

    inst.status = targetStatus;
    if (targetStatus === 'on_hold') {
      inst.holdReason = reason || 'تعليق إداري مالي مؤقت';
    } else if (targetStatus === 'paid') {
      inst.paidAt = new Date();
    } else if (targetStatus === 'release_requested') {
      inst.releasedAt = new Date();
    }

    inst.version += 1;
    await inst.save({ transaction });

    Logger.financial(`Settlement instruction #${instructionNo} updated to ${targetStatus}`, { reason });

    return inst;
  }

  /**
   * 4. Decoupled Refund Calculator & Allocation Engine (ADR-005 & Section 6)
   */
  static async calculateAndAllocateRefund(input: RefundQuoteInput, options?: any) {
    const transaction = options?.transaction;
    const { paymentId, refundAmountHalalas, reason, cancelledBy, cancellationFeeHalalas = 0 } = input;

    const splits = await SplitTransaction.findAll({ where: { paymentId }, transaction });
    const providerSplit = splits.find(s => s.role === 'provider');
    const platformSplit = splits.find(s => s.role === 'platform');

    const settlement = await SettlementInstruction.findOne({ where: { paymentId }, transaction });

    const isPostPayout = settlement?.status === 'paid';

    let customerRefundHalalas = Math.max(0, refundAmountHalalas - cancellationFeeHalalas);
    let providerDeductionHalalas = 0;
    let platformReversalHalalas = 0;

    if (cancelledBy === 'provider') {
      // Provider fault: Provider bears full refund + platform fee
      providerDeductionHalalas = refundAmountHalalas;
      customerRefundHalalas = refundAmountHalalas;
      platformReversalHalalas = 0; // Platform retains commission
    } else if (cancelledBy === 'customer') {
      // Customer cancellation: Deduct cancellation fee
      providerDeductionHalalas = customerRefundHalalas;
      platformReversalHalalas = Math.round(customerRefundHalalas * 0.10);
    } else {
      // Force Majeure or Admin: Full refund
      customerRefundHalalas = refundAmountHalalas;
      providerDeductionHalalas = providerSplit ? Math.min(refundAmountHalalas, providerSplit.amount) : 0;
      platformReversalHalalas = platformSplit ? Math.min(refundAmountHalalas, platformSplit.amount) : 0;
    }

    const currentYear = new Date().getFullYear();
    const countRefunds = await RefundAllocation.count({
      where: { createdAt: { [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`) } },
      transaction
    });
    const refundId = `RFD-${String(currentYear).slice(-2)}-${String(countRefunds + 1).padStart(10, '0')}`;

    const allocation = await RefundAllocation.create({
      refundId,
      paymentId,
      bookingId: splits[0]?.bookingId || 0,
      providerId: providerSplit?.providerId || null,
      grossRefundAmount: refundAmountHalalas,
      customerRefundAmount: customerRefundHalalas,
      providerDeductionAmount: providerDeductionHalalas,
      platformCommissionReversal: platformReversalHalalas,
      cancellationFee: cancellationFeeHalalas,
      postPayoutRefund: isPostPayout,
      expectedDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 business days expected settlement due date
      status: 'allocated'
    }, { transaction });

    // Handle Settlement Instruction adjustment if pre-payout
    if (settlement && !isPostPayout && settlement.status !== 'cancelled') {
      if (customerRefundHalalas >= settlement.amount) {
        settlement.status = 'cancelled';
        settlement.holdReason = 'إلغاء واسترداد كامل للحجز';
      } else {
        settlement.amount -= customerRefundHalalas;
      }
      await settlement.save({ transaction });
    }

    // Post Ledger Reversal Journal
    await this.postDoubleEntryJournal({
      journalNo: await generateExpenseNumber(),
      referenceId: refundId,
      referenceType: 'refund_execution',
      description: `استرداد حجز #${splits[0]?.bookingId} (${reason})`,
      entries: [
        { walletType: 'gateway_fee', type: 'debit', amount: customerRefundHalalas, description: 'مبلغ الاسترداد الموجه للعميل' },
        { walletType: 'provider', providerId: providerSplit?.providerId || undefined, type: 'debit', amount: providerDeductionHalalas, description: 'خصم حصة المزود المردودة' },
        { walletType: 'platform_revenue', type: 'debit', amount: platformReversalHalalas, description: 'عكس جزء من عمولة المنصة' },
        { walletType: 'gateway_fee', type: 'credit', amount: customerRefundHalalas, description: 'إعادة تخصيص المقاصة البنكية' }
      ]
    }, { transaction });

    allocation.status = 'posted';
    await allocation.save({ transaction });

    return {
      refundId,
      allocation,
      isPostPayout
    };
  }

  /**
   * 5. Continuous Multi-tier Automated Reconciliation (Section 9.2)
   */
  static async runReconciliation(gatewayName: string, startDate: Date, endDate: Date) {
    const currentYear = new Date().getFullYear();
    const count = await ReconciliationRun.count();
    const runNo = `REC-${String(currentYear).slice(-2)}-${String(count + 1).padStart(10, '0')}`;

    const run = await ReconciliationRun.create({
      runNo,
      gatewayName,
      startDate,
      endDate,
      status: 'completed'
    });

    const events = await GatewayEvent.findAll({
      where: {
        gatewayName,
        receivedAt: { [Op.between]: [startDate, endDate] }
      }
    });

    let matched = 0;
    let discrepancies = 0;

    for (const evt of events) {
      const payload: any = evt.payload;
      const paymentId = payload.payment_id || payload.id || payload.merchant_reference;

      if (!paymentId) continue;

      const splits = await SplitTransaction.findAll({ where: { paymentId } });
      if (splits.length > 0) {
        matched++;
      } else {
        discrepancies++;
        await ReconciliationItem.create({
          runId: run.id,
          paymentId: String(paymentId),
          gatewayReference: evt.externalEventId,
          expectedAmount: Number(payload.amount || 0),
          actualAmount: 0,
          difference: Number(payload.amount || 0),
          reason: 'حدث بوابة مسجل بدون سجل تقسيم مالي داخلي مطابق',
          status: 'open'
        });
      }
    }

    run.totalTransactions = events.length;
    run.matchedCount = matched;
    run.discrepancyCount = discrepancies;
    run.status = discrepancies > 0 ? 'has_discrepancies' : 'completed';
    await run.save();

    return run;
  }
}
