/**
 * @file discounts.ts
 * @description محرك وعروض الخصومات والكوبونات الترويجية لمنصة "ليلة".
 * يوفر إدارة العروض، التحقق من صلاحيتها حسب التواريخ وأحداث التفعيل، وحساب قيم الخصم المقتطعة.
 */

/**
 * واجهة عرض الخصم أو الكوبون الترويجي
 */
export interface DiscountOffer {
  /** المعرف الفريد للخصم */
  id: string;
  /** كود الخصم الترويجي (مثال: WELCOME50) */
  code: string;
  /** اسم العرض الموضح للعملاء والشركاء */
  name: string;
  /** نوع الخصم: نسبة مئوية، مبلغ ثابت، أو رصيد إضافي */
  type: 'percentage' | 'fixed' | 'bonus_balance';
  /** قيمة الخصم (مثال: 10 لنسبة 10% أو 50 لمبلغ 50 ريال) */
  value: number;
  /** حدث التفعيل المسبب للخصم */
  triggerType: 
    | 'on_registration' 
    | 'on_subscription' 
    | 'on_hall_booking' 
    | 'on_service_request' 
    | 'on_hall_booking_promo' 
    | 'on_service_request_promo';
  /** تاريخ بداية سريان العرض */
  startDate: string; // YYYY-MM-DD
  /** تاريخ نهاية سريان العرض */
  endDate: string; // YYYY-MM-DD
  /** حالة الخصم (نشط / غير نشط) */
  status: 'active' | 'inactive';
  /** عدد مرات استخدام العرض */
  usageCount: number;
  /** إجمالي المبالغ المخصومة والموفرة للعملاء */
  totalSavings: number;
}

/** العروض والخصومات الافتراضية للنظام */
export const DEFAULT_DISCOUNTS: DiscountOffer[] = [
  {
    id: 'disc-reg',
    code: 'WELCOME50',
    name: 'خصم الترحيب للعملاء الجدد',
    type: 'fixed',
    value: 50,
    triggerType: 'on_registration',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    usageCount: 12,
    totalSavings: 600,
  },
  {
    id: 'disc-sub',
    code: 'PARTNER15',
    name: 'عرض ترقية باقات الشركاء',
    type: 'percentage',
    value: 15,
    triggerType: 'on_subscription',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'active',
    usageCount: 8,
    totalSavings: 1440,
  },
  {
    id: 'disc-hall',
    code: 'HALL20',
    name: 'خصم حجز قاعات الاجتماعات',
    type: 'percentage',
    value: 20,
    triggerType: 'on_hall_booking',
    startDate: '2026-05-01',
    endDate: '2026-06-30',
    status: 'active',
    usageCount: 15,
    totalSavings: 1800,
  },
  {
    id: 'disc-service',
    code: 'EXTRA10',
    name: 'خصم خدمات الدعم والمساندة',
    type: 'fixed',
    value: 30,
    triggerType: 'on_service_request',
    startDate: '2026-05-15',
    endDate: '2026-07-15',
    status: 'active',
    usageCount: 22,
    totalSavings: 660,
  },
  {
    id: 'disc-hall-promo',
    code: 'PROMO-HALL',
    name: 'فترة ترويجية لحجز قاعات ومساحات العمل',
    type: 'percentage',
    value: 25,
    triggerType: 'on_hall_booking_promo',
    startDate: '2026-05-20',
    endDate: '2026-05-25',
    status: 'active',
    usageCount: 4,
    totalSavings: 450,
  },
  {
    id: 'disc-service-promo',
    code: 'PROMO-SVC',
    name: 'فترة ترويجية للخدمات المساندة الإضافية',
    type: 'percentage',
    value: 10,
    triggerType: 'on_service_request_promo',
    startDate: '2026-05-20',
    endDate: '2026-05-25',
    status: 'active',
    usageCount: 3,
    totalSavings: 90,
  }
];

/**
 * جلب جميع العروض والخصومات من التخزين المحلي أو العودة للقيم الافتراضية
 */
export function getDiscounts(): DiscountOffer[] {
  const data = localStorage.getItem('platform_discounts');
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error('Error parsing discounts:', e);
    }
  }
  return DEFAULT_DISCOUNTS;
}

/**
 * حفظ قائمة الخصومات في التخزين المحلي
 * @param discounts قائمة الخصومات الحديثة
 */
export function saveDiscounts(discounts: DiscountOffer[]) {
  localStorage.setItem('platform_discounts', JSON.stringify(discounts));
}

/**
 * التحقق من مدى صلاحية وانطباق الخصم بناءً على حدث التفعيل والتواريخ
 * @param discount عرض الخصم المراد فحصه
 * @param trigger نوع حدث التفعيل المسبب للطلب
 * @param currentDateStr التاريخ الحالي بالصيغة YYYY-MM-DD
 * @returns boolean هل الخصم قابل للتطبيق
 */
export function isDiscountApplicable(discount: DiscountOffer, trigger: DiscountOffer['triggerType'], currentDateStr: string = '2026-05-20'): boolean {
  if (discount.status !== 'active') return false;
  if (discount.triggerType !== trigger) return false;
  
  // مقارنة التواريخ للتأكد من وقوع التاريخ الحالي ضمن النطاق الزمني للعرض
  const current = new Date(currentDateStr);
  const start = new Date(discount.startDate);
  const end = new Date(discount.endDate);
  
  return current >= start && current <= end;
}

/**
 * احتساب قيمة الخصم المستحقة بناءً على السعر الأصلي ونوع الخصم
 * @param discount عرض الخصم
 * @param originalPrice السعر الأصلي قبل الخصم
 * @returns مقدار الخصم بالريال السعودي
 */
export function calculateDiscountAmount(discount: DiscountOffer, originalPrice: number): number {
  if (discount.type === 'percentage') {
    return (originalPrice * discount.value) / 100;
  } else if (discount.type === 'fixed') {
    return Math.min(discount.value, originalPrice);
  } else if (discount.type === 'bonus_balance') {
    // خصم مباشر من المبلغ الإجمالي
    return discount.value;
  }
  return 0;
}

/**
 * القواعد والحدود الرقابية والمالية الصارمة للمنصة
 */
export interface FinancialPromoComplianceRule {
  maxDiscountPercentage: number; // السقف الأقصى لنسبة الخصم المئوية (مثال: 50%)
  maxFixedDiscountAmount: number; // السقف الأقصى للخصم الثابت (مثال: 5000 ر.س)
  maxFixedDiscountRatio: number; // السقف النسبي الأقصى للخصم الثابت من قيمة الحجز (مثال: 50%)
  minNetPriceMarginPercentage: number; // الحد الأدنى لهامش السعر الصافي بعد الخصم (مثال: 40%)
  minEarlyBirdDays: number; // الحد الأدنى لأيام الحجز المبكر (مثال: 3 أيام)
  maxActivePromosPerProvider: number; // الحد الأقصى للعروض المتزامنة النشطة للمزود (مثال: 8 عروض)
}

export const DEFAULT_FINANCIAL_COMPLIANCE_RULES: FinancialPromoComplianceRule = {
  maxDiscountPercentage: 50,
  maxFixedDiscountAmount: 5000,
  maxFixedDiscountRatio: 50,
  minNetPriceMarginPercentage: 40,
  minEarlyBirdDays: 3,
  maxActivePromosPerProvider: 8,
};

export const STORAGE_KEY_FINANCIAL_RULES = 'lailah_financial_compliance_rules';

export function getFinancialComplianceRules(): FinancialPromoComplianceRule {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_FINANCIAL_RULES);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...DEFAULT_FINANCIAL_COMPLIANCE_RULES, ...parsed };
    }
  } catch (e) {
    console.error('Error reading financial compliance rules:', e);
  }
  return DEFAULT_FINANCIAL_COMPLIANCE_RULES;
}

export function saveFinancialComplianceRules(rules: FinancialPromoComplianceRule): void {
  try {
    localStorage.setItem(STORAGE_KEY_FINANCIAL_RULES, JSON.stringify(rules));
  } catch (e) {
    console.error('Error saving financial compliance rules:', e);
  }
}

export function resetFinancialComplianceRules(): FinancialPromoComplianceRule {
  try {
    localStorage.removeItem(STORAGE_KEY_FINANCIAL_RULES);
  } catch (e) {
    console.error('Error resetting financial compliance rules:', e);
  }
  return DEFAULT_FINANCIAL_COMPLIANCE_RULES;
}

/**
 * نتيجة فحص التوافق المالي للعرض الترويجي
 */
export interface FinancialComplianceEvaluation {
  isCompliant: boolean;
  status: 'compliant' | 'warning' | 'violation';
  score: number; // 0 - 100
  title: string;
  reasons: string[];
  warnings: string[];
  calculatedMarginPercentage?: number;
  maxAllowedDiscount: number;
  maxAllowedDiscountForPrice?: number;
  requiredMinBookingValue?: number;
  appliedRules?: FinancialPromoComplianceRule;
}

/**
 * دالة ذكية لفحص وتقييم توافق العرض الترويجي مع القواعد المالية والرقابية للمنصة
 * تطبق معادلة السقف النسبي المزدوج (Dynamic Proportional Cap) واشتراط الحد الأدنى للحجز
 */
export function evaluatePromoFinancialCompliance(params: {
  promotionPattern: string;
  type: 'percentage' | 'fixed' | 'free_service';
  value: number;
  commissionPolicy: 'CommissionOnDiscountedPrice' | 'CommissionOnOriginalPrice';
  applyTo?: 'halls' | 'services';
  targetCount?: number;
  samplePrice?: number;
  earlyBirdDays?: number;
  hasAdCampaign?: boolean;
  minBookingValueCondition?: number;
  customRules?: FinancialPromoComplianceRule;
}): FinancialComplianceEvaluation {
  const reasons: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  const rules = params.customRules || getFinancialComplianceRules();
  const samplePrice = params.samplePrice && params.samplePrice > 0 ? params.samplePrice : (params.applyTo === 'services' ? 800 : 8000);

  let calculatedDiscount = 0;
  let maxAllowedDiscountForPrice = rules.maxFixedDiscountAmount;
  let requiredMinBookingValue = 0;

  if (params.type === 'percentage') {
    calculatedDiscount = (samplePrice * params.value) / 100;
    maxAllowedDiscountForPrice = rules.maxDiscountPercentage;

    if (params.value > rules.maxDiscountPercentage) {
      reasons.push(`نسبة الخصم (${params.value}%) تتجاوز السقف الرقابي الأعلى المسموح به في المركز المالي (${rules.maxDiscountPercentage}%).`);
      score -= 50;
    } else if (params.value > 35) {
      warnings.push(`نسبة الخصم (${params.value}%) مرتفعة وتتطلب مراقبة تأثيرها على هامش الربح التشغيلي.`);
      score -= 15;
    }
  } else if (params.type === 'fixed') {
    calculatedDiscount = Math.min(params.value, samplePrice);
    
    // معادلة السقف النسبي المزدوج: الخصم لا يتجاوز النسبة القصوى المسموحة من متوسط سعر العنصر
    const ratioCap = rules.maxFixedDiscountRatio || rules.maxDiscountPercentage || 50;
    maxAllowedDiscountForPrice = Math.min(
      rules.maxFixedDiscountAmount,
      Math.round((samplePrice * ratioCap) / 100)
    );

    // الحد الأدنى المحاسبي المطلوب لقيمة الحجز ليكون هذا الخصم متوافقاً
    requiredMinBookingValue = Math.ceil(params.value / (ratioCap / 100));

    // فحص السقف المالي المطلق
    if (params.value > rules.maxFixedDiscountAmount) {
      reasons.push(`قيمة الخصم الثابتة (${params.value.toLocaleString('ar-SA')} ر.س) تتجاوز السقف المالي المطلق المعتمد للمنصة (${rules.maxFixedDiscountAmount.toLocaleString('ar-SA')} ر.س).`);
      score -= 50;
    }

    // فحص السقف النسبي المزدوج مع مراعاة شرط الحد الأدنى لقيمة الحجز
    const hasSufficientMinBookingCondition = params.minBookingValueCondition && params.minBookingValueCondition >= requiredMinBookingValue;

    if (!hasSufficientMinBookingCondition && params.value > maxAllowedDiscountForPrice) {
      const fixedRatio = samplePrice > 0 ? ((params.value / samplePrice) * 100).toFixed(0) : '100';
      reasons.push(
        `الخصم الثابت (${params.value.toLocaleString('ar-SA')} ر.س) يعادل (${fixedRatio}%) من متوسط السعر (${samplePrice.toLocaleString('ar-SA')} ر.س) ويتجاوز السقف النسبي المسموح (${ratioCap}% = ${maxAllowedDiscountForPrice.toLocaleString('ar-SA')} ر.س). لتفعيل هذا الخصم، يجب تحديد شرط حد أدنى للحجز لا يقل عن (${requiredMinBookingValue.toLocaleString('ar-SA')} ر.س).`
      );
      score -= 40;
    } else if (hasSufficientMinBookingCondition && params.value <= rules.maxFixedDiscountAmount) {
      warnings.push(`الخصم الثابت محمي بشرط حد أدنى لقيمة الحجز (${params.minBookingValueCondition?.toLocaleString('ar-SA')} ر.س) لضمان الربحية.`);
    }
  } else if (params.type === 'free_service') {
    warnings.push('العرض يمنح خدمة مجانية إضافية: يُرجى التأكد من توفر الطاقة التشغيلية وتغطية التكلفة.');
    score -= 5;
  }

  // حساب هامش السعر الصافي المتبقي بعد الخصم
  const netPrice = Math.max(0, samplePrice - calculatedDiscount);
  const netMarginPct = samplePrice > 0 ? Math.round((netPrice / samplePrice) * 100) : 100;

  if (netMarginPct < rules.minNetPriceMarginPercentage) {
    reasons.push(`صافي الهامش المالي بعد الخصم (${netMarginPct}%) يقل عن الحد الأدنى للربحية المعتمد (${rules.minNetPriceMarginPercentage}%).`);
    score -= 40;
  }

  // فحص سياسة العمولة
  if (params.commissionPolicy === 'CommissionOnDiscountedPrice' && params.value > 30) {
    warnings.push('سياسة اقتطاع العمولة بعد الخصم مع نسبة تخفيض عالية تتطلب موافقة مالية خاصة من الإدارة.');
    score -= 10;
  }

  // فحص الحجز المبكر
  if (params.promotionPattern === 'early_bird' && params.earlyBirdDays !== undefined) {
    if (params.earlyBirdDays < rules.minEarlyBirdDays) {
      reasons.push(`عدد أيام الحجز المبكر (${params.earlyBirdDays} يوم) أقل من الحد الأدنى الرقابي (${rules.minEarlyBirdDays} أيام).`);
      score -= 30;
    }
  }

  const isCompliant = reasons.length === 0;
  const status: 'compliant' | 'warning' | 'violation' = !isCompliant 
    ? 'violation' 
    : warnings.length > 0 
    ? 'warning' 
    : 'compliant';

  const title = status === 'compliant'
    ? 'متوافق تماماً مع القواعد والمعادلات الرقابية للمركز المالي'
    : status === 'warning'
    ? 'متوافق مع تنبيهات وتوجيهات مالية للمراجعة'
    : 'منتهك للسقوف والمعادلات المالية والرقابية الصارمة';

  return {
    isCompliant,
    status,
    score: Math.max(0, score),
    title,
    reasons,
    warnings,
    calculatedMarginPercentage: netMarginPct,
    maxAllowedDiscount: rules.maxDiscountPercentage,
    maxAllowedDiscountForPrice,
    requiredMinBookingValue,
    appliedRules: rules
  };
}


