/**
 * @file RefundPolicyEngine.ts
 * @description محرك تقييم سياسات الإلغاء والاسترداد المالي السيادي لمنصة ليلة.
 * يفصل تماماً بين التقييم التجاري والقانوني لسياسة الإلغاء وبين التنفيذ المالي والمحاسبي.
 * لا يقوم بأي تعديل على قواعد البيانات أو أرصدة المحافظ مباشرة.
 */

export type RefundActor = 'customer' | 'provider' | 'admin' | 'force_majeure';

export type RefundType =
  | 'FULL_REFUND'
  | 'PARTIAL_REFUND'
  | 'NO_REFUND'
  | 'WALLET_REFUND'
  | 'GATEWAY_REFUND'
  | 'MIXED_REFUND'
  | 'PRE_SETTLEMENT_REFUND'
  | 'POST_SETTLEMENT_REFUND'
  | 'PROVIDER_FAULT_REFUND'
  | 'CUSTOMER_CANCELLATION_REFUND'
  | 'ADMIN_OVERRIDE_REFUND'
  | 'FORCE_MAJEURE_REFUND';

export type RefundMethod = 'gateway' | 'wallet' | 'mixed';

export interface RefundLegQuote {
  legId: string;
  method: 'gateway' | 'wallet';
  amountHalalas: number;
  status: 'PENDING' | 'PROCESSING' | 'SUCCEEDED' | 'FAILED';
  reference?: string | null;
}

export interface RefundPolicyEvaluationInput {
  bookingId?: number | null;
  paymentId: string;
  grossAmountHalalas: number;
  originalProviderShareHalalas?: number;
  originalCommissionHalalas?: number;
  originalCommissionBaseHalalas?: number;
  originalCommissionVatHalalas?: number;
  commissionRate?: number;
  cancelledBy: RefundActor;
  reason?: string;
  bookingConfirmationTime?: Date;
  cancelTime?: Date;
  eventStartTime?: Date;
  listingCancellationPeriod?: number | null;
  reconciliationModel?: 'hybrid' | 'binary';
  preferredRefundMethod?: RefundMethod;
  gatewayAmountHalalas?: number;
  walletAmountHalalas?: number;
  customRefundPercent?: number;
  isPostPayout?: boolean;
}

export interface RefundPolicyEvaluationResult {
  policyId: string;
  policyVersion: string;
  refundType: RefundType;
  refundMethod: RefundMethod;
  grossAmountHalalas: number;
  customerRefundHalalas: number;
  creditHeldHalalas: number;
  providerDeductionHalalas: number;
  retainedProviderHalalas: number;
  platformCommissionReversalHalalas: number;
  platformRevenueReversalHalalas: number;
  platformVatReversalHalalas: number;
  administrativeFeeHalalas: number;
  providerReceivableHalalas: number;
  calcReason: string;
  legs: RefundLegQuote[];
}

export class RefundPolicyEngine {
  public static readonly POLICY_ID = 'POL_CANONICAL_REFUND_V2';
  public static readonly POLICY_VERSION = 'V2.6.0';
  private static readonly VAT_RATE = 0.15;

  /**
   * تقييم سياسة الإلغاء وحساب استحقاقات الاسترداد الرياضية بدقة دون المساس بالبيانات
   */
  static evaluate(input: RefundPolicyEvaluationInput): RefundPolicyEvaluationResult {
    const {
      grossAmountHalalas,
      cancelledBy,
      reason = '',
      bookingConfirmationTime = new Date(),
      cancelTime = new Date(),
      eventStartTime,
      listingCancellationPeriod = null,
      reconciliationModel = 'hybrid',
      preferredRefundMethod = 'gateway',
      customRefundPercent,
      isPostPayout = false
    } = input;

    const commRate = input.commissionRate || 0.10;
    const originalCommissionHalalas = input.originalCommissionHalalas !== undefined
      ? input.originalCommissionHalalas
      : Math.round(grossAmountHalalas * commRate);

    const originalProviderShareHalalas = input.originalProviderShareHalalas !== undefined
      ? input.originalProviderShareHalalas
      : grossAmountHalalas - originalCommissionHalalas;

    let cashPercent = 0;
    let creditPercent = 0;
    let calcReason = reason || 'إلغاء حجز';
    let refundType: RefundType = 'FULL_REFUND';

    // 1. تقييم السياسة بحسب المبادر بالإلغاء والظروف
    if (cancelledBy === 'provider') {
      // إلغاء بخطأ من المزود: استرداد كامل للعميل 100%، ويتحمل المزود كامل المبلغ مع احتفاظ المنصة بعمولتها
      cashPercent = 100;
      creditPercent = 0;
      refundType = 'PROVIDER_FAULT_REFUND';
      calcReason = 'إلغاء من طرف مزود الخدمة (تحمل المزود لكامل مبلغ الاسترداد وحفظ حق المنصة والعميل)';
    } else if (cancelledBy === 'admin') {
      // إلغاء إداري سيادي مع استرداد كامل
      cashPercent = customRefundPercent !== undefined ? customRefundPercent : 100;
      creditPercent = 0;
      refundType = 'ADMIN_OVERRIDE_REFUND';
      calcReason = reason || 'إلغاء واسترداد معتمد بقرار إداري سيادي';
    } else if (cancelledBy === 'force_majeure') {
      // قوة قاهرة معتمدة رسمياً: استرداد كامل أو قسيمة مجدولة دون أي خصم رسوم
      cashPercent = preferredRefundMethod === 'gateway' ? 100 : 0;
      creditPercent = preferredRefundMethod === 'wallet' ? 100 : (customRefundPercent !== undefined ? customRefundPercent : 0);
      if (cashPercent === 0 && creditPercent === 0) cashPercent = 100;
      refundType = 'FORCE_MAJEURE_REFUND';
      calcReason = 'ظروف قاهرة معتمدة وموثقة رسمياً (استرداد كامل دون تحميل رسوم)';
    } else {
      // إلغاء من طرف العميل (Customer Cancellation)
      refundType = 'CUSTOMER_CANCELLATION_REFUND';

      if (customRefundPercent !== undefined) {
        cashPercent = customRefundPercent;
        creditPercent = 0;
        calcReason = `نسبة استرداد مخصصة معتمدة: ${customRefundPercent}%`;
      } else if (eventStartTime) {
        const diffMs = new Date(eventStartTime).getTime() - new Date(cancelTime).getTime();
        const daysRemaining = diffMs / (1000 * 60 * 60 * 24);

        const diffConfirmationMs = new Date(cancelTime).getTime() - new Date(bookingConfirmationTime).getTime();
        const confirmedHoursAgo = diffConfirmationMs / (1000 * 60 * 60);

        const timeToEventFromBookingMs = new Date(eventStartTime).getTime() - new Date(bookingConfirmationTime).getTime();
        const hoursToEventFromBooking = timeToEventFromBookingMs / (1000 * 60 * 60);

        const isGraceWindowEligible = confirmedHoursAgo <= 24 && hoursToEventFromBooking >= 72;

        if (isGraceWindowEligible) {
          cashPercent = 100;
          creditPercent = 0;
          calcReason = 'نافذة سماح الـ 24 ساعة للإلغاء بعد تأكيد الحجز (استرداد نقدي كامل 100٪)';
        } else {
          const effectiveListingPeriod = (listingCancellationPeriod !== null && listingCancellationPeriod >= 0)
            ? listingCancellationPeriod
            : 14;

          if (reconciliationModel === 'binary') {
            if (listingCancellationPeriod !== null) {
              if (daysRemaining >= listingCancellationPeriod) {
                cashPercent = 100;
                creditPercent = 0;
                calcReason = `الإلغاء قبل مهلة إلغاء القاعة (${listingCancellationPeriod} يوم) - استرداد كامل 100٪`;
              } else {
                cashPercent = 0;
                creditPercent = 0;
                calcReason = `الإلغاء بعد انقضاء مهلة القاعة (${listingCancellationPeriod} يوم) - لا يوجد استرداد`;
              }
            } else {
              if (daysRemaining >= 15) {
                cashPercent = 100;
                creditPercent = 0;
                calcReason = 'سياسة المنصة العامة: متبقي أكثر من 15 يوماً (استرداد كاش 100٪)';
              } else if (daysRemaining >= 7) {
                cashPercent = 0;
                creditPercent = 75;
                calcReason = 'سياسة المنصة العامة: متبقي 7 - 14 يوماً (رصيد محفظة مجدول 75٪)';
              } else if (daysRemaining >= 4) {
                cashPercent = 0;
                creditPercent = 50;
                calcReason = 'سياسة المنصة العامة: متبقي 4 - 6 أيام (رصيد محفظة مجدول 50٪)';
              } else {
                cashPercent = 0;
                creditPercent = 0;
                calcReason = 'سياسة المنصة العامة: متبقي أقل من 3 أيام (لا يوجد استرداد 0٪)';
              }
            }
          } else {
            // Hybrid Reconciliation Model
            if (daysRemaining >= effectiveListingPeriod) {
              cashPercent = 100;
              creditPercent = 0;
              calcReason = `قبل المهلة المحددة للقاعة (${effectiveListingPeriod} يوم) - استرداد كلي 100٪`;
            } else {
              if (daysRemaining >= 15) {
                cashPercent = 100;
                creditPercent = 0;
                calcReason = 'النموذج الهجين: متبقي أكثر من 15 يوماً على الموعد (استرداد كامل 100٪)';
              } else if (daysRemaining >= 7) {
                cashPercent = 0;
                creditPercent = 75;
                calcReason = 'النموذج الهجين: متبقي 7 - 14 يوماً (رصيد جدولة 75٪)';
              } else if (daysRemaining >= 4) {
                cashPercent = 0;
                creditPercent = 50;
                calcReason = 'النموذج الهجين: متبقي 4 - 6 أيام (رصيد جدولة 50٪)';
              } else {
                cashPercent = 0;
                creditPercent = 0;
                calcReason = 'النموذج الهجين: متبقي أقل من 3 أيام على الموعد (لا يوجد استرداد 0٪)';
              }
            }
          }
        }
      } else {
        cashPercent = 100;
        creditPercent = 0;
        calcReason = 'استرداد كامل افتراضي لعدم وجود تاريخ مناسبة محدد';
      }
    }

    // 2. الحسابات الرقمية للمبالغ بالهللات
    const customerRefundHalalas = Math.round((grossAmountHalalas * cashPercent) / 100);
    const creditHeldHalalas = Math.round((grossAmountHalalas * creditPercent) / 100);
    const administrativeFeeHalalas = grossAmountHalalas - customerRefundHalalas - creditHeldHalalas;

    let providerDeductionHalalas = 0;
    let retainedProviderHalalas = 0;
    let platformCommissionReversalHalalas = 0;
    let platformRevenueReversalHalalas = 0;
    let platformVatReversalHalalas = 0;

    if (cancelledBy === 'provider') {
      // المزود يتحمل كامل الـ gross المنصرف للعميل
      providerDeductionHalalas = customerRefundHalalas;
      retainedProviderHalalas = 0;
      platformCommissionReversalHalalas = 0;
      platformRevenueReversalHalalas = 0;
      platformVatReversalHalalas = 0;
    } else if (customerRefundHalalas === grossAmountHalalas) {
      // استرداد كامل: عكس عمولة المنصة وحصة المزود بنسبة 100%
      platformCommissionReversalHalalas = originalCommissionHalalas;
      platformRevenueReversalHalalas = Math.round(platformCommissionReversalHalalas / (1 + this.VAT_RATE));
      platformVatReversalHalalas = platformCommissionReversalHalalas - platformRevenueReversalHalalas;
      providerDeductionHalalas = grossAmountHalalas - platformCommissionReversalHalalas;
      retainedProviderHalalas = 0;
    } else if (customerRefundHalalas === 0 && creditHeldHalalas === 0) {
      // لا استرداد: يحتفظ المزود بحصته والمنصة بعمولتها كاملة
      providerDeductionHalalas = 0;
      retainedProviderHalalas = originalProviderShareHalalas;
      platformCommissionReversalHalalas = 0;
      platformRevenueReversalHalalas = 0;
      platformVatReversalHalalas = 0;
      refundType = 'NO_REFUND';
    } else {
      // استرداد جزئي (Partial Refund): عكس نسبي متوازن
      const ratio = grossAmountHalalas > 0 ? (customerRefundHalalas / grossAmountHalalas) : 0;
      platformCommissionReversalHalalas = Math.round(originalCommissionHalalas * ratio);
      platformRevenueReversalHalalas = Math.round(platformCommissionReversalHalalas / (1 + this.VAT_RATE));
      platformVatReversalHalalas = platformCommissionReversalHalalas - platformRevenueReversalHalalas;
      providerDeductionHalalas = customerRefundHalalas - platformCommissionReversalHalalas;
      retainedProviderHalalas = Math.max(0, originalProviderShareHalalas - providerDeductionHalalas);
      refundType = 'PARTIAL_REFUND';
    }

    if (isPostPayout) {
      refundType = 'POST_SETTLEMENT_REFUND';
    } else if (refundType !== 'PROVIDER_FAULT_REFUND' && refundType !== 'FORCE_MAJEURE_REFUND' && refundType !== 'ADMIN_OVERRIDE_REFUND') {
      if (customerRefundHalalas === grossAmountHalalas) {
        refundType = 'FULL_REFUND';
      }
    }

    // 3. تحديد أرجل وطريقة الاسترداد (Refund Legs)
    let refundMethod: RefundMethod = preferredRefundMethod;
    const legs: RefundLegQuote[] = [];

    if (preferredRefundMethod === 'mixed' && input.gatewayAmountHalalas !== undefined && input.walletAmountHalalas !== undefined) {
      refundMethod = 'mixed';
      refundType = 'MIXED_REFUND';
      if (input.gatewayAmountHalalas > 0) {
        legs.push({
          legId: `LEG-GW-${Date.now()}-1`,
          method: 'gateway',
          amountHalalas: input.gatewayAmountHalalas,
          status: 'PENDING'
        });
      }
      if (input.walletAmountHalalas > 0) {
        legs.push({
          legId: `LEG-WL-${Date.now()}-2`,
          method: 'wallet',
          amountHalalas: input.walletAmountHalalas,
          status: 'PENDING'
        });
      }
    } else if (creditHeldHalalas > 0 && customerRefundHalalas === 0) {
      refundMethod = 'wallet';
      refundType = 'WALLET_REFUND';
      legs.push({
        legId: `LEG-WL-${Date.now()}-1`,
        method: 'wallet',
        amountHalalas: creditHeldHalalas,
        status: 'PENDING'
      });
    } else if (preferredRefundMethod === 'wallet') {
      refundMethod = 'wallet';
      refundType = 'WALLET_REFUND';
      legs.push({
        legId: `LEG-WL-${Date.now()}-1`,
        method: 'wallet',
        amountHalalas: customerRefundHalalas,
        status: 'PENDING'
      });
    } else {
      refundMethod = 'gateway';
      if (refundType !== 'NO_REFUND' && customerRefundHalalas > 0) {
        legs.push({
          legId: `LEG-GW-${Date.now()}-1`,
          method: 'gateway',
          amountHalalas: customerRefundHalalas,
          status: 'PENDING'
        });
      }
    }

    return {
      policyId: this.POLICY_ID,
      policyVersion: this.POLICY_VERSION,
      refundType,
      refundMethod,
      grossAmountHalalas,
      customerRefundHalalas,
      creditHeldHalalas,
      providerDeductionHalalas,
      retainedProviderHalalas,
      platformCommissionReversalHalalas,
      platformRevenueReversalHalalas,
      platformVatReversalHalalas,
      administrativeFeeHalalas,
      providerReceivableHalalas: 0, // Will be computed at orchestration time based on settlement & available wallet
      calcReason,
      legs
    };
  }
}
