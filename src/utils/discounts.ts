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

