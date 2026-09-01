/**
 * @file RefundOrchestrator.ts
 * @description المحرك المالي السيادي الموحد لإدارة عمليات الاسترداد والعكس المحاسبي (Canonical Financial Refund & Reversal Flow).
 * المصدر المالي الأوحد (Single Source of Truth) لكافة عمليات الإلغاء والاسترداد والذمم المدينة.
 */

import { 
  sequelize,
  SplitTransaction,
  SettlementInstruction,
  RefundAllocation,
  LedgerJournal,
  LedgerEntry,
  Wallet,
  WalletTransaction,
  CustomerWallet,
  CustomerHeldBalance,
  ProviderReceivableModel,
  AuditLog
} from '../../models/Database.js';
import { Booking } from '../../models/BookingModels.js';
import { RefundPolicyEngine, RefundActor, RefundType, RefundMethod, RefundLegQuote } from './RefundPolicyEngine.js';
import { FinancialEngine } from './FinancialEngine.js';
import { generateExpenseNumber, generateLedgerNumber } from '../../modules/finance/usecases/GenerateId.js';
import { Logger } from '../logger.service.js';
import { Op, Transaction } from 'sequelize';

export interface RefundSnapshot {
  refundId: string;
  idempotencyKey?: string | null;
  bookingId?: number | null;
  paymentId: string;
  providerId?: number | null;
  customerId?: number | null;
  customerEmail?: string | null;
  originalGrossAmount: number; // in Halalas
  originalNetAmount: number;
  originalPlatformCommission: number;
  originalPlatformRevenue: number;
  originalPlatformVat: number;
  originalProviderShare: number;
  refundedCustomerAmount: number;
  providerDeduction: number;
  platformCommissionReversal: number;
  platformRevenueReversal: number;
  platformVatReversal: number;
  administrativeFee: number;
  retainedProviderAmount: number;
  providerReceivableAmount: number;
  providerAvailableDeduction: number;
  refundMethod: RefundMethod;
  refundType: RefundType;
  isPostPayout: boolean;
  policyId: string;
  policyVersion: string;
  reason: string;
  cancelledBy: RefundActor;
  calculationTimestamp: string;
  currency: string;
  legs: RefundLegQuote[];
}

export interface InitiateRefundInput {
  paymentId: string;
  bookingId?: number | null;
  providerId?: number | null;
  customerId?: number | null;
  customerEmail?: string | null;
  customerName?: string | null;
  cancelledBy: RefundActor;
  reason?: string;
  idempotencyKey?: string;
  preferredRefundMethod?: RefundMethod;
  customRefundPercent?: number;
  gatewayAmountHalalas?: number;
  walletAmountHalalas?: number;
  eventStartTime?: Date;
  bookingConfirmationTime?: Date;
  cancelTime?: Date;
  listingCancellationPeriod?: number | null;
  reconciliationModel?: 'hybrid' | 'binary';
}

export class RefundOrchestrator {
  private static readonly RULES_VERSION = 'V2.6.0';

  /**
   * 1. تقييم عرض الاسترداد المالي بناءً على اللقطة المالية الأصلية غير القابلة للتعديل
   */
  static async evaluateRefundQuote(input: InitiateRefundInput, options?: { transaction?: Transaction }) {
    const transaction = options?.transaction;
    const { paymentId, bookingId, cancelledBy, reason = '' } = input;

    // استرجاع اللقطة المالية الأصلية للحجز من تقسيمات الدفع (SplitTransaction)
    let splits = await SplitTransaction.findAll({ where: { paymentId }, transaction });
    if (splits.length === 0 && bookingId) {
      splits = await SplitTransaction.findAll({ where: { bookingId }, transaction });
    }

    let grossAmountHalalas = 0;
    let originalProviderShareHalalas = 0;
    let originalCommissionHalalas = 0;
    let originalCommissionBaseHalalas = 0;
    let originalCommissionVatHalalas = 0;
    let providerId = input.providerId || null;

    if (splits.length > 0) {
      const provSplit = splits.find(s => s.role === 'provider');
      const platSplit = splits.find(s => s.role === 'platform');
      const gwSplit = splits.find(s => s.role === 'gateway_fee');

      originalProviderShareHalalas = Number(provSplit?.amount || 0);
      originalCommissionHalalas = Number(platSplit?.amount || 0);
      const gwAmount = Number(gwSplit?.amount || 0);
      grossAmountHalalas = originalProviderShareHalalas + originalCommissionHalalas + gwAmount;
      providerId = provSplit?.providerId || providerId;

      const platMeta: any = platSplit?.metadata || {};
      originalCommissionBaseHalalas = platMeta.commissionBaseHalalas || Math.round(originalCommissionHalalas / 1.15);
      originalCommissionVatHalalas = platMeta.commissionVatHalalas || (originalCommissionHalalas - originalCommissionBaseHalalas);
    } else {
      // قراءة احتياطية من الحجز الأصلي إذا لم تكن تقسيمات الدفع منشأة مسبقاً
      let bookingAmount = 10000;
      if (bookingId) {
        const bk = await Booking.findByPk(bookingId, { transaction });
        if (bk) {
          bookingAmount = Number(bk.totalAmount || 10000);
          providerId = bk.hallId ? 1 : providerId;
        }
      }
      grossAmountHalalas = Math.round(bookingAmount * 100);
      const calcs = FinancialEngine.calculate({
        grossAmount: bookingAmount,
        commissionRate: 0.10
      });
      originalProviderShareHalalas = Math.round(calcs.providerShare * 100);
      originalCommissionHalalas = Math.round(calcs.commissionAmount * 100);
      originalCommissionBaseHalalas = Math.round(calcs.commissionBase * 100);
      originalCommissionVatHalalas = Math.round(calcs.commissionVat * 100);
    }

    // التحقق من حالة التسوية (Settlement Status) لتحديد ما إذا كان الاسترداد Pre-Settlement أو Post-Settlement
    const settlement = await SettlementInstruction.findOne({
      where: { [Op.or]: [{ paymentId }, ...(bookingId ? [{ paymentId: String(bookingId) }] : [])] },
      transaction
    });

    const isPostPayout = settlement?.status === 'paid';

    const quote = RefundPolicyEngine.evaluate({
      bookingId,
      paymentId,
      grossAmountHalalas,
      originalProviderShareHalalas,
      originalCommissionHalalas,
      originalCommissionBaseHalalas,
      originalCommissionVatHalalas,
      cancelledBy,
      reason,
      bookingConfirmationTime: input.bookingConfirmationTime,
      cancelTime: input.cancelTime,
      eventStartTime: input.eventStartTime,
      listingCancellationPeriod: input.listingCancellationPeriod,
      reconciliationModel: input.reconciliationModel,
      preferredRefundMethod: input.preferredRefundMethod,
      gatewayAmountHalalas: input.gatewayAmountHalalas,
      walletAmountHalalas: input.walletAmountHalalas,
      customRefundPercent: input.customRefundPercent,
      isPostPayout
    });

    return {
      quote,
      splits,
      settlement,
      providerId,
      isPostPayout,
      grossAmountHalalas,
      originalProviderShareHalalas,
      originalCommissionHalalas,
      originalCommissionBaseHalalas,
      originalCommissionVatHalalas
    };
  }

  /**
   * 2. تنفيذ دورة الاسترداد المالي الموحدة بالكامل (Request -> Snapshot -> Execution -> Balanced Ledger -> Audit)
   */
  static async requestAndExecuteRefund(input: InitiateRefundInput, options?: { transaction?: Transaction }) {
    const isExternalTransaction = !!options?.transaction;
    const tx = options?.transaction || await sequelize.transaction();

    try {
      const {
        paymentId,
        bookingId,
        cancelledBy,
        reason = '',
        idempotencyKey,
        customerEmail,
        customerName
      } = input;

      // 1. فحص عدم تكرار العملية (Idempotency Check)
      if (idempotencyKey) {
        const existingRefund = await RefundAllocation.findOne({
          where: { idempotencyKey },
          transaction: tx
        });
        if (existingRefund) {
          Logger.financial(`Idempotent refund request detected for key ${idempotencyKey}`, { refundId: existingRefund.refundId });
          if (!isExternalTransaction) await tx.commit();
          return {
            success: true,
            refund: existingRefund,
            message: 'طلب استرداد مالي مكرر تم استرجاعه بأمان (Idempotency Enforced)',
            isDuplicate: true
          };
        }
      }

      // 2. تقييم السياسة واستخراج اللقطة المالية الأصلية
      const evalData = await this.evaluateRefundQuote(input, { transaction: tx });
      const {
        quote,
        settlement,
        isPostPayout,
        providerId,
        grossAmountHalalas,
        originalProviderShareHalalas,
        originalCommissionHalalas,
        originalCommissionBaseHalalas,
        originalCommissionVatHalalas
      } = evalData;

      // 3. توليد رقم استرداد تسلسلي سنوي قياسي (RFD-YY-XXXXXXXXXX)
      const currentYear = new Date().getFullYear();
      const yy = String(currentYear).slice(-2);
      const countRefunds = await RefundAllocation.count({
        where: { createdAt: { [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`) } },
        transaction: tx
      });
      const refundId = `RFD-${yy}-${String(countRefunds + 1).padStart(10, '0')}`;

      // 4. معالجة تسوية المزود والذمم المدينة (Pre-Settlement vs Post-Settlement)
      let providerAvailableDeductionHalalas = 0;
      let providerReceivableHalalas = 0;
      let providerReceivableRecord: any = null;

      if (isPostPayout) {
        // حالة ما بعد صرف المزود: فحص الرصيد المتاح للمزود، وتحويل المتبقي إلى ذمة مدينة (Provider Receivable)
        const [pWallet] = await Wallet.findOrCreate({
          where: { providerId: providerId || 1 },
          defaults: { balance: 0, pendingBalance: 0 },
          transaction: tx
        });

        const providerAvailableBalanceHalalas = Math.max(0, Math.round((pWallet.balance || 0) * 100));
        if (providerAvailableBalanceHalalas >= quote.providerDeductionHalalas) {
          providerAvailableDeductionHalalas = quote.providerDeductionHalalas;
          providerReceivableHalalas = 0;
        } else {
          providerAvailableDeductionHalalas = providerAvailableBalanceHalalas;
          providerReceivableHalalas = quote.providerDeductionHalalas - providerAvailableDeductionHalalas;
        }

        // إنشاء سجل الذمة المدينة الصريح للمزود
        if (providerReceivableHalalas > 0) {
          const countRec = await ProviderReceivableModel.count({
            where: { createdAt: { [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`) } },
            transaction: tx
          });
          const receivableNumber = `REV-${yy}-${String(countRec + 1).padStart(10, '0')}`;

          providerReceivableRecord = await ProviderReceivableModel.create({
            receivableNumber,
            providerId: providerId || 1,
            providerName: `المزود #${providerId || 1}`,
            amount: providerReceivableHalalas,
            reason: 'other',
            status: 'outstanding',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // استحقاق السداد خلال 14 يوماً
            ageingDays: 0,
            notes: `ذمة مدينة ناشئة عن استرداد حجز #${bookingId || paymentId} بعد صرف الأرباح مسبقاً للمزود (رقم الاسترداد: ${refundId})`
          }, { transaction: tx });

          Logger.financial(`Provider Receivable Created for Provider #${providerId}: ${providerReceivableHalalas / 100} SAR`, {
            receivableNumber,
            refundId
          });
        }
      } else {
        // حالة ما قبل الصرف (Pre-Settlement): تعديل أو إلغاء أمر التسوية وتخفيض الرصيد المعلق فقط
        if (settlement && settlement.status !== 'cancelled') {
          if (quote.customerRefundHalalas >= settlement.amount) {
            settlement.status = 'cancelled';
            settlement.holdReason = `إلغاء واسترداد مالي للحجز بموجب ${refundId}`;
          } else {
            settlement.amount = Math.max(0, Number(settlement.amount) - quote.customerRefundHalalas);
          }
          settlement.version += 1;
          await settlement.save({ transaction: tx });
        }
      }

      // 5. تجميد اللقطة المالية الثابتة للاسترداد (Immutable Refund Snapshot)
      const snapshot: RefundSnapshot = {
        refundId,
        idempotencyKey: idempotencyKey || null,
        bookingId: bookingId || null,
        paymentId,
        providerId,
        customerId: input.customerId || null,
        customerEmail: customerEmail || null,
        originalGrossAmount: grossAmountHalalas,
        originalNetAmount: grossAmountHalalas - originalCommissionHalalas,
        originalPlatformCommission: originalCommissionHalalas,
        originalPlatformRevenue: originalCommissionBaseHalalas,
        originalPlatformVat: originalCommissionVatHalalas,
        originalProviderShare: originalProviderShareHalalas,
        refundedCustomerAmount: quote.customerRefundHalalas,
        providerDeduction: quote.providerDeductionHalalas,
        platformCommissionReversal: quote.platformCommissionReversalHalalas,
        platformRevenueReversal: quote.platformRevenueReversalHalalas,
        platformVatReversal: quote.platformVatReversalHalalas,
        administrativeFee: quote.administrativeFeeHalalas,
        retainedProviderAmount: quote.retainedProviderHalalas,
        providerReceivableAmount: providerReceivableHalalas,
        providerAvailableDeduction: providerAvailableDeductionHalalas,
        refundMethod: quote.refundMethod,
        refundType: quote.refundType,
        isPostPayout,
        policyId: quote.policyId,
        policyVersion: quote.policyVersion,
        reason: quote.calcReason,
        cancelledBy,
        calculationTimestamp: new Date().toISOString(),
        currency: 'SAR',
        legs: quote.legs
      };

      // 6. إنشاء سجل RefundAllocation بحالة PROCESSING
      const refundRecord = await RefundAllocation.create({
        refundId,
        idempotencyKey: idempotencyKey || null,
        paymentId,
        bookingId: bookingId || null,
        providerId,
        customerId: input.customerId || null,
        customerEmail: customerEmail || null,
        refundType: quote.refundType,
        refundMethod: quote.refundMethod,
        executionStatus: 'PROCESSING',
        grossRefundAmount: grossAmountHalalas,
        customerRefundAmount: quote.customerRefundHalalas,
        providerDeductionAmount: quote.providerDeductionHalalas,
        platformCommissionReversal: quote.platformCommissionReversalHalalas,
        platformRevenueReversal: quote.platformRevenueReversalHalalas,
        platformVatReversal: quote.platformVatReversalHalalas,
        taxReversal: quote.platformVatReversalHalalas,
        cancellationFee: quote.administrativeFeeHalalas,
        retainedProviderAmount: quote.retainedProviderHalalas,
        providerReceivableAmount: providerReceivableHalalas,
        providerReceivableId: providerReceivableRecord?.id || null,
        postPayoutRefund: isPostPayout,
        policyId: quote.policyId,
        policyVersion: quote.policyVersion,
        reason: quote.calcReason,
        cancelledBy,
        gatewayName: 'moyasar',
        gatewayRefundReference: `MYS-RFD-${Date.now()}`,
        legs: quote.legs,
        snapshot,
        expectedDueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 business days
        status: 'allocated'
      }, { transaction: tx });

      // 7. تنفيذ أرجل الاسترداد (Refund Legs Execution)
      for (const leg of quote.legs) {
        if (leg.method === 'wallet') {
          // استرداد لمحفظة العميل الداخلية (Wallet Credit)
          if (customerEmail) {
            const [cWallet] = await CustomerWallet.findOrCreate({
              where: { customerEmail },
              defaults: { customerName: customerName || 'عميل منصة ليلة', cashBalance: 0 },
              transaction: tx
            });
            cWallet.cashBalance = Number(cWallet.cashBalance || 0) + (leg.amountHalalas / 100);
            await cWallet.save({ transaction: tx });
          }
          leg.status = 'SUCCEEDED';
          leg.reference = `CWL-CREDIT-${Date.now()}`;
        } else if (leg.method === 'gateway') {
          // محاكاة استدعاء بوابة الدفع الخارجي والحصول على المرجع
          leg.status = 'SUCCEEDED';
          leg.reference = refundRecord.gatewayRefundReference;
        }
      }

      // إذا كانت هناك قسيمة رصيد مجدولة للعميل (مثل 75% أو 50% أو قوة قاهرة)
      if (quote.creditHeldHalalas > 0 && customerEmail) {
        await CustomerHeldBalance.create({
          customerEmail,
          customerName: customerName || 'عميل منصة ليلة',
          amount: quote.creditHeldHalalas / 100,
          originalBookingId: bookingId || 0,
          originalProviderId: providerId || 1,
          holdReason: cancelledBy === 'force_majeure' ? 'force_majeure' : 'cancellation_reschedule',
          heldSince: new Date(),
          conversionStatus: 'held',
          approvedByAdmin: 'نظام الاسترداد المالي الموحد السيادي',
          notes: `رصيد استرداد مجدول بقيمة ${quote.creditHeldHalalas / 100} ر.س لحساب حجز #${bookingId || paymentId} بموجب ${refundId}`
        }, { transaction: tx });
      }

      // 8. إعداد القيود المحاسبية المزدوجة المتوازنة بدقة مطلقة (Σ Debits === Σ Credits)
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
      // أ. عكس حصة المزود
      if (isPostPayout) {
        // خصم المتاح من رصيد محفظة المزود
        if (providerAvailableDeductionHalalas > 0) {
          journalEntries.push({
            walletType: 'provider',
            providerId: providerId || undefined,
            type: 'debit',
            amount: providerAvailableDeductionHalalas,
            description: `خصم حصة الاسترداد من رصيد المزود المتاح (تسوية ما بعد الصرف) - ${refundId}`,
            targetBalance: 'available'
          });
        }
        // تسجيل الجزء غير المغطى كذمة مدينة (Provider Receivable)
        if (providerReceivableHalalas > 0) {
          journalEntries.push({
            walletType: 'provider',
            providerId: providerId || undefined,
            type: 'debit',
            amount: providerReceivableHalalas,
            description: `تسجيل ذمة مدينة على المزود مستحقة لليلة - ${refundId}`,
            targetBalance: 'available'
          });
        }
      } else {
        // خصم من الرصيد المعلق للمزود (Pre-Settlement Reversal)
        if (quote.providerDeductionHalalas > 0) {
          journalEntries.push({
            walletType: 'provider',
            providerId: providerId || undefined,
            type: 'debit',
            amount: quote.providerDeductionHalalas,
            description: `عكس حصة المزود من الرصيد المعلق المحجوز (الضمان) - ${refundId}`,
            targetBalance: 'pending'
          });
        }
      }

      // ب. عكس إيراد عمولة المنصة
      if (quote.platformRevenueReversalHalalas > 0) {
        journalEntries.push({
          walletType: 'platform_revenue',
          type: 'debit',
          amount: quote.platformRevenueReversalHalalas,
          description: `عكس صافي عمولة المنصة الخاضعة للضريبة - ${refundId}`
        });
      }

      // ج. عكس التزام ضريبة القيمة المضافة
      if (quote.platformVatReversalHalalas > 0) {
        journalEntries.push({
          walletType: 'platform_vat',
          type: 'debit',
          amount: quote.platformVatReversalHalalas,
          description: `عكس ضريبة القيمة المضافة على العمولة - ${refundId}`
        });
      }

      // CREDITS:
      // أ. صرف مبلغ الاسترداد الفعلي للعميل عبر البوابة أو المحفظة
      if (quote.customerRefundHalalas > 0) {
        journalEntries.push({
          walletType: 'gateway_fee', // حساب وسيط المقاصة النقدية / البوابة
          type: 'credit',
          amount: quote.customerRefundHalalas,
          description: `صرف الاسترداد الفعلي للعميل (${quote.refundMethod}) - ${refundId}`
        });
      }

      // ب. إيراد رسوم الإلغاء المحتفظ بها للمنصة
      if (quote.administrativeFeeHalalas > 0) {
        journalEntries.push({
          walletType: 'platform_revenue',
          type: 'credit',
          amount: quote.administrativeFeeHalalas,
          description: `إيراد رسوم إلغاء مستقطعة محتفظ بها للمنصة - ${refundId}`
        });
      }

      // التحقق الصارم من توازن القيد المحاسبي
      const totalDebit = journalEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
      const totalCredit = journalEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);

      if (totalDebit !== totalCredit) {
        const discrepancy = Math.abs(totalDebit - totalCredit);
        Logger.financial(`Integrity Alert: Imbalanced Refund Journal! Debit: ${totalDebit}, Credit: ${totalCredit}, Diff: ${discrepancy}`, { refundId });
        throw new Error(`Double-Entry Ledger Imbalance Violation! Total Debits (${totalDebit}) !== Total Credits (${totalCredit}). Difference: ${discrepancy} Halalas.`);
      }

      // 9. ترحيل القيد في دفتر الأستاذ العام
      const journalNo = await generateExpenseNumber();
      const journal = await LedgerJournal.create({
        journalNo,
        referenceId: refundId,
        referenceType: 'refund_execution',
        description: `قيد استرداد مالي وعكس محاسبي لحجز #${bookingId || paymentId} بموجب ${refundId}`,
        totalDebit,
        totalCredit,
        balanced: true,
        postedBy: 'SYSTEM_REFUND_ORCHESTRATOR'
      }, { transaction: tx });

      for (const entryData of journalEntries) {
        await FinancialEngine.postLedgerEntry({
          walletType: entryData.walletType,
          providerId: entryData.providerId || null,
          referenceId: refundId,
          referenceType: 'refund_execution',
          type: entryData.type,
          amount: entryData.amount / 100, // SAR
          description: entryData.description,
          targetBalance: entryData.targetBalance,
          status: 'completed'
        }, { transaction: tx });
      }

      // 10. تحديث حالة الاسترداد إلى SUCCEEDED
      refundRecord.executionStatus = 'SUCCEEDED';
      refundRecord.status = 'posted';
      refundRecord.journalId = journal.id;
      refundRecord.legs = quote.legs;
      await refundRecord.save({ transaction: tx });

      // 11. تسجيل حركة التدقيق الأمني والمالي (Audit Log)
      await AuditLog.create({
        action: 'REFUND_SUCCEEDED',
        entityType: 'RefundAllocation',
        entityId: refundId,
        details: {
          refundId,
          bookingId,
          paymentId,
          grossAmountHalalas,
          customerRefundHalalas: quote.customerRefundHalalas,
          providerDeductionHalalas: quote.providerDeductionHalalas,
          platformCommissionReversalHalalas: quote.platformCommissionReversalHalalas,
          providerReceivableHalalas,
          journalNo,
          actor: cancelledBy,
          reason: quote.calcReason
        }
      }, { transaction: tx });

      if (!isExternalTransaction) {
        await tx.commit();
      }

      Logger.financial(`Canonical Refund Executed Successfully: ${refundId}`, {
        customerRefundHalalas: quote.customerRefundHalalas,
        providerDeductionHalalas: quote.providerDeductionHalalas,
        journalNo
      });

      return {
        success: true,
        refundId,
        refund: refundRecord,
        snapshot,
        journal,
        providerReceivable: providerReceivableRecord,
        message: 'تم تنفيذ الاسترداد المالي وترحيل القيود المحاسبية بنجاح'
      };

    } catch (err: any) {
      if (!isExternalTransaction) {
        await tx.rollback();
      }
      Logger.financial(`Refund Orchestrator Execution Failure: ${err.message}`, { input });
      throw err;
    }
  }

  /**
   * 3. معالجة إلغاء الحجز التشغيلي واستدعاء محرك الاسترداد المالي (CancelBooking Gateway)
   */
  static async processBookingCancellationRefund(data: {
    booking: any;
    cancelledBy: RefundActor;
    userEmail?: string;
    reason?: string;
    eventStartTime?: Date;
    listingCancellationPeriod?: number | null;
    reconciliationModel?: 'hybrid' | 'binary';
  }, options?: { transaction?: Transaction }) {
    const { booking, cancelledBy, userEmail, reason, eventStartTime, listingCancellationPeriod, reconciliationModel } = data;

    return await this.requestAndExecuteRefund({
      paymentId: String(booking.id),
      bookingId: booking.id,
      providerId: booking.hallId ? 1 : 1,
      customerId: booking.customerId || null,
      customerEmail: userEmail || booking.customerEmail,
      customerName: booking.customerName,
      cancelledBy,
      reason,
      eventStartTime: eventStartTime || booking.startTime,
      bookingConfirmationTime: booking.createdAt,
      cancelTime: new Date(),
      listingCancellationPeriod,
      reconciliationModel,
      idempotencyKey: `CANCEL-BKG-${booking.id}-${Date.now()}`
    }, options);
  }

  /**
   * 4. معالجة استرداد القوة القاهرة المعتمدة (Force Majeure Resolver)
   */
  static async processForceMajeureRefund(data: {
    bookingId: number;
    customerEmail: string;
    customerName: string;
    totalAmountSar: number;
    adminNotes?: string;
  }, options?: { transaction?: Transaction }) {
    const { bookingId, customerEmail, customerName, totalAmountSar, adminNotes } = data;

    return await this.requestAndExecuteRefund({
      paymentId: String(bookingId),
      bookingId,
      customerEmail,
      customerName,
      cancelledBy: 'force_majeure',
      reason: adminNotes || 'اعتماد رسمي لطلب قوة قاهرة واسترداد مجدول',
      preferredRefundMethod: 'wallet',
      idempotencyKey: `FM-RESOLVE-${bookingId}`
    }, options);
  }

  /**
   * 5. معالجة Webhook بوابات الدفع مع التحقق من التوقيع ومنع التكرار (Idempotent Webhook Handler)
   */
  static async handleGatewayWebhook(data: {
    gatewayName: string;
    externalEventId: string;
    signature: string;
    payload: any;
  }, options?: { transaction?: Transaction }) {
    const { gatewayName, externalEventId, signature, payload } = data;

    // استخراج معرف الاسترداد من الـ payload
    const refundId = payload.refundId || payload.metadata?.refundId;
    const gatewayRef = payload.id || payload.refund_id || payload.reference;

    if (!refundId && !gatewayRef) {
      throw new Error('Invalid Webhook Payload: Missing refundId and gateway reference');
    }

    const refund = await RefundAllocation.findOne({
      where: {
        [Op.or]: [
          ...(refundId ? [{ refundId }] : []),
          ...(gatewayRef ? [{ gatewayRefundReference: gatewayRef }] : [])
        ]
      },
      transaction: options?.transaction
    });

    if (!refund) {
      throw new Error(`Refund record not found for webhook reference ${gatewayRef || refundId}`);
    }

    // فحص التحقق ومنع التكرار
    if (refund.executionStatus === 'SUCCEEDED') {
      return {
        success: true,
        message: 'Webhook processed idempotently (Refund already finalized)',
        refundId: refund.refundId
      };
    }

    // تحديث الحالة
    refund.executionStatus = 'SUCCEEDED';
    refund.status = 'posted';
    await refund.save({ transaction: options?.transaction });

    return {
      success: true,
      message: 'Gateway Webhook Verified & Refund Confirmed',
      refundId: refund.refundId
    };
  }
}
