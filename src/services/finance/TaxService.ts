/**
 * @file TaxService.ts
 * @description خدمة احتساب ضريبة القيمة المضافة (VAT) المعتمدة بالسعودية (15%) وفصل المبلغ الأساسي عن الضريبة لمنصة "ليلة".
 */

export class TaxService {
  /** نسبة ضريبة القيمة المضافة الافتراضية بالسعودية (15%) */
  private static readonly DEFAULT_VAT_RATE = 0.15;

  /**
   * احتساب المبلغ الأساسي (قبل الضريبة) من إجمالي شامل الضريبة
   * @param totalIncludingVat المبلغ الإجمالي شامل الضريبة
   * @param vatRate نسبة الضريبة
   * @returns المبلغ الأساسي قبل الضريبة
   */
  static calculateBaseAmount(totalIncludingVat: number, vatRate = this.DEFAULT_VAT_RATE): number {
    return totalIncludingVat / (1 + vatRate);
  }

  /**
   * احتساب قيمة الضريبة من إجمالي شامل الضريبة
   * @param totalIncludingVat المبلغ الإجمالي شامل الضريبة
   * @param vatRate نسبة الضريبة
   * @returns مقدار ضريبة القيمة المضافة
   */
  static calculateVatFromTotal(totalIncludingVat: number, vatRate = this.DEFAULT_VAT_RATE): number {
    const base = this.calculateBaseAmount(totalIncludingVat, vatRate);
    return totalIncludingVat - base;
  }

  /**
   * احتساب ضريبة القيمة المضافة من المبلغ الأساسي
   * @param baseAmount المبلغ الأساسي الخالي من الضريبة
   * @param vatRate نسبة الضريبة
   * @returns مقدار الضريبة المحسوبة
   */
  static calculateVatFromBase(baseAmount: number, vatRate = this.DEFAULT_VAT_RATE): number {
    return baseAmount * vatRate;
  }
}

