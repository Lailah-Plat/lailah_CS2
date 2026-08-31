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

export { generateExpenseNumber };
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
        { walletType: 'provider', providerId, type: 'credit', amount: providerShareHalalas, description: 'حصة المزود المعلقة (الضمان المحجوز)', targetBalance: 'pending', status: 'pending' },
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
      targetBalance?: 'available' | 'pending';
      status?: 'pending' | 'completed' | 'failed';
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
        description: entryData.description,
        targetBalance: entryData.targetBalance,
        status: entryData.status || 'completed'
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
   * Single Source of Truth for all refund calculations and executions.
   */
  static async calculateAndAllocateRefund(input: RefundQuoteInput, options?: any) {
    const transaction = options?.transaction;
    const { paymentId, refundAmountHalalas, reason, cancelledBy } = input;
    let cancellationFeeHalalas = input.cancellationFeeHalalas || 0;

    let splits = await SplitTransaction.findAll({ where: { paymentId }, transaction });
    if (splits.length === 0 && !isNaN(Number(paymentId))) {
      splits = await SplitTransaction.findAll({ where: { bookingId: Number(paymentId) }, transaction });
    }

    const providerSplit = splits.find(s => s.role === 'provider');
    const platformSplit = splits.find(s => s.role === 'platform');

    const settlement = await SettlementInstruction.findOne({ 
      where: { [Op.or]: [{ paymentId }, { splitTransactionId: providerSplit?.id || 0 }] }, 
      transaction 
    });

    const isPostPayout = settlement?.status === 'paid';
    const isSplitHeld = providerSplit?.status === 'held';

    let customerRefundHalalas = Math.max(0, refundAmountHalalas - cancellationFeeHalalas);
    let providerDeductionHalalas = 0;
    let platformReversalHalalas = 0;
    let platformVatReversalHalalas = 0;
    let platformRevenueReversalHalalas = 0;

    const commRate = platformSplit?.percentage || 0.10;

    if (cancelledBy === 'provider') {
      // 1. Provider fault: Provider bears full gross refund to customer. Platform retains commission.
      providerDeductionHalalas = refundAmountHalalas;
      customerRefundHalalas = refundAmountHalalas;
      cancellationFeeHalalas = 0;
      platformReversalHalalas = 0;
      platformRevenueReversalHalalas = 0;
      platformVatReversalHalalas = 0;
    } else if (cancelledBy === 'customer') {
      // 2. Customer cancellation: Deduct cancellation fee if applicable.
      // Platform reverses commission proportionally on the gross refunded amount.
      platformReversalHalalas = Math.round(refundAmountHalalas * commRate);
      platformVatReversalHalalas = Math.round(platformReversalHalalas * (15 / 115));
      platformRevenueReversalHalalas = platformReversalHalalas - platformVatReversalHalalas;
      providerDeductionHalalas = refundAmountHalalas - platformReversalHalalas;
    } else {
      // 3. Force Majeure or Admin cancellation: Full unpenalized refund.
      customerRefundHalalas = refundAmountHalalas;
      cancellationFeeHalalas = 0;
      platformReversalHalalas = Math.round(refundAmountHalalas * commRate);
      platformVatReversalHalalas = Math.round(platformReversalHalalas * (15 / 115));
      platformRevenueReversalHalalas = platformReversalHalalas - platformVatReversalHalalas;
      providerDeductionHalalas = refundAmountHalalas - platformReversalHalalas;
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

    // Prepare strictly balanced Double-Entry Journal Entries (Total Debits === Total Credits)
    const journalEntries: Array<{
      walletType: 'provider' | 'platform_revenue' | 'platform_vat' | 'gateway_fee';
      providerId?: number | null;
      type: 'debit' | 'credit';
      amount: number; // In Halalas
      description: string;
      targetBalance?: 'available' | 'pending';
      status?: 'pending' | 'completed' | 'failed';
    }> = [];

    // DEBITS:
    // 1. Provider Share Reversal (Debit from provider's pending or available balance)
    if (providerDeductionHalalas > 0) {
      journalEntries.push({
        walletType: 'provider',
        providerId: providerSplit?.providerId || undefined,
        type: 'debit',
        amount: providerDeductionHalalas,
        description: isSplitHeld ? 'خصم حصة المزود من الرصيد المعلق المحجوز (الضمان)' : 'خصم حصة المزود المستردة (التزام مالي/ذمم)',
        targetBalance: isSplitHeld ? 'pending' : 'available'
      });
    }

    // 2. Platform Net Revenue Reversal (Debit to reduce earned revenue)
    if (platformRevenueReversalHalalas > 0) {
      journalEntries.push({
        walletType: 'platform_revenue',
        type: 'debit',
        amount: platformRevenueReversalHalalas,
        description: 'عكس صافي عمولة المنصة الخاضعة للضريبة'
      });
    }

    // 3. Platform VAT Reversal (Debit to reduce VAT liability)
    if (platformVatReversalHalalas > 0) {
      journalEntries.push({
        walletType: 'platform_vat',
        type: 'debit',
        amount: platformVatReversalHalalas,
        description: 'عكس ضريبة القيمة المضافة المحصلة'
      });
    }

    // CREDITS:
    // 1. Bank / Gateway Clearing Cash Outflow (Credit to gateway clearing / bank account for customer remittance)
    if (customerRefundHalalas > 0) {
      journalEntries.push({
        walletType: 'gateway_fee',
        type: 'credit',
        amount: customerRefundHalalas,
        description: 'صرف مبلغ الاسترداد الفعلي للعميل عبر البوابة / الحساب البنكي'
      });
    }

    // 2. Cancellation Fee Retained by Platform (Credit to platform revenue if customer cancellation fee applied)
    if (cancellationFeeHalalas > 0) {
      journalEntries.push({
        walletType: 'platform_revenue',
        type: 'credit',
        amount: cancellationFeeHalalas,
        description: 'إيراد رسوم إلغاء مستقطعة من مبلغ الاسترداد'
      });
    }

    // Post Double-Entry Reversal Journal with strict balance verification
    await this.postDoubleEntryJournal({
      journalNo: await generateExpenseNumber(),
      referenceId: refundId,
      referenceType: 'refund_execution',
      description: `قيد استرداد حجز #${splits[0]?.bookingId || paymentId} (${reason})`,
      entries: journalEntries
    }, { transaction });

    if (providerSplit) {
      providerSplit.status = isSplitHeld ? 'reversed' : 'refunded';
      await providerSplit.save({ transaction });
    }

    allocation.status = 'posted';
    await allocation.save({ transaction });

    return {
      refundId,
      allocation,
      isPostPayout,
      customerRefundSar: customerRefundHalalas / 100,
      providerDeductionSar: providerDeductionHalalas / 100
    };
  }

  /**
   * 5. Release Held Provider Escrow Funds after Event Completion
   */
  static async releaseHeldProviderFunds(bookingId: number, options?: any) {
    const transaction = options?.transaction;

    const splits = await SplitTransaction.findAll({
      where: { bookingId, role: 'provider', status: 'held' },
      transaction
    });

    if (splits.length === 0) {
      return { releasedCount: 0, message: 'لا توجد مستحقات معلقة محجوزة لهذا الحجز.' };
    }

    let totalReleasedHalalas = 0;

    for (const split of splits) {
      if (!split.providerId) continue;

      const providerId = split.providerId;
      const amountHalalas = split.amount;
      const amountSar = amountHalalas / 100;

      // 1. Move from pendingBalance to available balance in provider wallet
      const [wallet] = await Wallet.findOrCreate({
        where: { providerId },
        defaults: { balance: 0, pendingBalance: 0 },
        transaction
      });

      wallet.pendingBalance = (wallet.pendingBalance || 0) - amountSar;
      wallet.balance = (wallet.balance || 0) + amountSar;
      await wallet.save({ transaction });

      // 2. Update Split Transaction status
      split.status = 'available';
      await split.save({ transaction });

      // 3. Update corresponding Settlement Instruction
      const settlement = await SettlementInstruction.findOne({
        where: { splitTransactionId: split.id },
        transaction
      });
      if (settlement && settlement.status === 'pending_eligibility') {
        settlement.status = 'scheduled';
        await settlement.save({ transaction });
      }

      // 4. Record Double-Entry Journal for Escrow Release
      await this.postDoubleEntryJournal({
        journalNo: await generateRevenueNumber(),
        referenceId: `REL-BKG-${bookingId}`,
        referenceType: 'escrow_release',
        description: `تحرير الضمان المحجوز لحساب حجز مكتمل رقم #${bookingId}`,
        entries: [
          { walletType: 'provider', providerId, type: 'debit', amount: amountHalalas, description: 'خصم من الرصيد المعلق بعد اكتمال المناسبة', targetBalance: 'pending' },
          { walletType: 'provider', providerId, type: 'credit', amount: amountHalalas, description: 'إضافة للرصيد المتاح للسحب بعد اكتمال المناسبة', targetBalance: 'available' }
        ]
      }, { transaction });

      totalReleasedHalalas += amountHalalas;
    }

    Logger.financial(`Released held escrow for booking #${bookingId}`, { 
      bookingId, 
      amount: totalReleasedHalalas / 100, 
      currency: 'SAR' 
    });

    return {
      releasedCount: splits.length,
      totalReleasedSar: totalReleasedHalalas / 100
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
