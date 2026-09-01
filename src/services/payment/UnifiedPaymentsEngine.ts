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
import { RefundOrchestrator } from '../finance/RefundOrchestrator.js';

export interface CreatePaymentSnapshotInput {
  paymentId: string;
  bookingId: number;
  providerId: number;
  grossAmountHalalas: number; // e.g., 100000 Halalas = 1000.00 SAR
  commissionRate: number; // e.g. 0.10
  gatewayFeeRate?: number;
  gatewayFlatFeeHalalas?: number;
  verifiedEventId?: string | null;
  gatewayEventId?: string | null;
  externalPaymentReference?: string | null;
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
   * 1. Immutable Financial Capture Core Execution
   * Creates immutable SplitTransaction records, double-entry journals, and settlement instructions
   * strictly bound to VerifiedPaymentEvent, GatewayEvent, and ExternalPaymentReference.
   */
  static async executeImmutableCapture(input: CreatePaymentSnapshotInput, options?: any) {
    const transaction = options?.transaction;
    const { 
      paymentId, 
      bookingId, 
      providerId, 
      grossAmountHalalas, 
      commissionRate, 
      gatewayFeeRate = 0.02, 
      gatewayFlatFeeHalalas = 100,
      verifiedEventId = null,
      gatewayEventId = null,
      externalPaymentReference = null
    } = input;

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

    // Create SplitTransaction Snapshots bound to verifiedEventId
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
        verifiedEventId,
        gatewayEventId,
        externalPaymentReference,
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
        ruleVersion: this.RULES_VERSION,
        verifiedEventId,
        gatewayEventId,
        externalPaymentReference
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
        ruleVersion: this.RULES_VERSION,
        verifiedEventId,
        gatewayEventId,
        externalPaymentReference
      }, { transaction })
    ]);

    // Create Double-Entry Journal (ADR-002 & Section 4.3)
    await this.postDoubleEntryJournal({
      journalNo: await generateRevenueNumber(),
      referenceId: paymentId,
      referenceType: 'payment_capture',
      description: `تحصيل مبلغ حجز #${bookingId} وتثبيت اللقطة المالية`,
      verifiedEventId,
      gatewayEventId,
      externalPaymentReference,
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
      holdReason: beneficiary.kycStatus === 'active' ? null : 'بانتظار اكتمال توثيق KYB والآيبان للمزود',
      verifiedEventId,
      gatewayEventId,
      externalPaymentReference
    }, { transaction });

    Logger.financial(`Payment captured & snapshot created for payment #${paymentId}`, {
      grossAmountHalalas,
      providerShareHalalas,
      instructionNo,
      verifiedEventId
    });

    return {
      splits,
      settlementInstruction: settlementInst
    };
  }

  /**
   * Capture Payment & Freeze Immutable Transaction Snapshot (ADR-004)
   * Protected execution pipeline delegating to executeImmutableCapture.
   */
  static async processPaymentCapture(input: CreatePaymentSnapshotInput, options?: any) {
    return await this.executeImmutableCapture(input, options);
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
    verifiedEventId?: string | null;
    gatewayEventId?: string | null;
    externalPaymentReference?: string | null;
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
      postedBy: 'SYSTEM_FINANCIAL_ENGINE',
      verifiedEventId: data.verifiedEventId || null,
      gatewayEventId: data.gatewayEventId || null,
      externalPaymentReference: data.externalPaymentReference || null
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
    targetStatus: 'scheduled' | 'on_hold' | 'release_requested' | 'processing' | 'paid' | 'cancelled' | 'reversed' | 'manual_review',
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

    const { SettlementStateMachine } = await import('../payout/SettlementStateMachine.js');
    const updated = await SettlementStateMachine.transition(
      inst,
      targetStatus as any,
      {
        actor: options?.actor || 'SYSTEM_PAYMENT_ENGINE',
        reason,
        payoutId: inst.payoutId
      },
      { transaction }
    );

    Logger.financial(`Settlement instruction #${instructionNo} updated to ${targetStatus}`, { reason });

    return updated;
  }

  /**
   * 4. Decoupled Refund Calculator & Allocation Engine (ADR-005 & Canonical Flow)
   * Delegates directly to the Sovereign Canonical Refund Orchestrator.
   */
  static async calculateAndAllocateRefund(input: RefundQuoteInput, options?: any) {
    const { paymentId, refundAmountHalalas, reason, cancelledBy } = input;
    const cancellationFeeHalalas = input.cancellationFeeHalalas || 0;

    const result = await RefundOrchestrator.requestAndExecuteRefund({
      paymentId,
      bookingId: !isNaN(Number(paymentId)) ? Number(paymentId) : undefined,
      cancelledBy,
      reason,
      customRefundPercent: undefined,
      gatewayAmountHalalas: Math.max(0, refundAmountHalalas - cancellationFeeHalalas),
      preferredRefundMethod: 'gateway',
      idempotencyKey: `REFUND-${paymentId}-${Date.now()}`
    }, options);

    return {
      refundId: result.refundId,
      allocation: result.refund,
      snapshot: result.snapshot,
      journal: result.journal,
      isPostPayout: result.snapshot.isPostPayout,
      customerRefundSar: result.snapshot.refundedCustomerAmount / 100,
      providerDeductionSar: result.snapshot.providerDeduction / 100
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
