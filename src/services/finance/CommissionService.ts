/**
 * @file CommissionService.ts
 * @description خدمة احتساب عمولة المنصة المقتطعة ديناميكياً من قيمة الحجز الإجمالية لخدمات الشركاء والمزودين لمنصة "ليلة".
 */

import { TaxService } from "./TaxService.js";

/**
 * فئة حساب وإدارة عمولات المنصة والمستحقات المترتبة
 */
export class CommissionService {
  /** نسبة العمولة الافتراضية لمنصة "ليلة" (10%) */
  private static readonly DEFAULT_COMMISSION_RATE = 0.10;

  /**
   * احتساب تفاصيل عمولة المنصة وضريبة القيمة المضافة وصافي مستحقات المزود
   * @param totalIncludingVat المبلغ الإجمالي شامل ضريبة القيمة المضافة (15%)
   * @param commissionRate نسبة العمولة المحددة وفق باقة اشتراك المزود
   * @returns تفاصيل عمولة المنصة والمستحق الصافي للمزود
   */
  static calculateCommission(
    totalIncludingVat: number,
    commissionRate = this.DEFAULT_COMMISSION_RATE
  ) {
    const baseAmount = TaxService.calculateBaseAmount(totalIncludingVat);
    
    const commissionBase = baseAmount * commissionRate;
    const commissionVat = TaxService.calculateVatFromBase(commissionBase);
    const commissionTotal = commissionBase + commissionVat;
    
    const providerDue = totalIncludingVat - commissionTotal;

    return {
      baseAmount,
      commissionBase,
      commissionVat,
      commissionTotal,
      providerDue,
    };
  }
}

