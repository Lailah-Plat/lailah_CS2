/**
 * @file CommissionService.ts
 * @description خدمة احتساب عمولة المنصة المقتطعة ديناميكياً من قيمة الحجز والخدمات لشركاء منصة "ليلة".
 * تتضمن الفصل المحاسبي الصارم بين:
 * 1. عمولة منصة ليلة (Platform Commission - 0% افتراضياً لمبيعات المتجر المصغر)
 * 2. ضريبة القيمة المضافة على المنتجات (Product Tax - 15% VAT مستقلة)
 * 3. رسوم بوابات الدفع والمعالجة (Payment Processing Fees)
 */

import { TaxService } from "./TaxService.js";

export type LineItemType = 'hall' | 'service' | 'addon' | 'mini_store_product' | 'fee' | 'discount' | 'other';

export interface BookingLineItemInput {
  id?: string;
  name: string;
  type: LineItemType;
  grossAmount: number; // 15% VAT inclusive price
  quantity?: number;
  providerId?: string | number;
  customCommissionRate?: number; // Optional override per item
}

export interface CalculatedLineItemResult {
  id?: string;
  name: string;
  type: LineItemType;
  grossAmount: number;
  taxableBase: number;
  taxAmount: number;
  commissionEligible: boolean;
  commissionRate: number;
  commissionAmount: number;
  commissionBase: number;
  commissionVat: number;
  providerReceivable: number;
  policyNotes: string;
}

export interface BookingFinancialBreakdownResult {
  totalGrossAmount: number;
  totalTaxableBase: number;
  totalTaxAmount: number;
  commissionableBase: number;
  nonCommissionableBase: number;
  totalPlatformCommission: number;
  totalCommissionBase: number;
  totalCommissionVat: number;
  totalProviderReceivable: number;
  lineItems: CalculatedLineItemResult[];
  miniStoreGrossSales: number;
  miniStorePlatformCommission: number;
  miniStoreTaxes: number;
  miniStoreProviderReceivable: number;
  isMiniStoreExempt: boolean;
  policyVersion: string;
}

/**
 * فئة حساب وإدارة عمولات المنصة والمستحقات المترتبة
 */
export class CommissionService {
  /** نسبة العمولة الافتراضية لمنصة "ليلة" (10%) */
  public static readonly DEFAULT_COMMISSION_RATE = 0.10;
  public static readonly POLICY_VERSION = "V1.0.0";

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
    
    const providerDue = Math.max(0, totalIncludingVat - commissionTotal);

    return {
      baseAmount,
      commissionBase,
      commissionVat,
      commissionTotal,
      providerDue,
    };
  }

  /**
   * احتساب التحليل المالي المفصل لعناصر الحجز (Line Items)
   * يطبق الإعفاء الصارم لمبيعات المتجر المصغر (Mini Store Sales = 0% Commission)
   * مع استمرار احتساب الضريبة المستقلة (15% VAT).
   */
  static calculateLineItems(
    items: BookingLineItemInput[],
    providerCommissionRate = this.DEFAULT_COMMISSION_RATE,
    miniStoreApplyCommission = false,
    miniStoreCommissionRate = 0.0
  ): BookingFinancialBreakdownResult {
    let totalGrossAmount = 0;
    let totalTaxableBase = 0;
    let totalTaxAmount = 0;
    let commissionableBase = 0;
    let nonCommissionableBase = 0;
    let totalPlatformCommission = 0;
    let totalCommissionBase = 0;
    let totalCommissionVat = 0;
    let totalProviderReceivable = 0;

    let miniStoreGrossSales = 0;
    let miniStorePlatformCommission = 0;
    let miniStoreTaxes = 0;
    let miniStoreProviderReceivable = 0;

    const calculatedItems: CalculatedLineItemResult[] = items.map((item) => {
      const qty = item.quantity && item.quantity > 0 ? item.quantity : 1;
      const itemGross = (Number(item.grossAmount) || 0) * qty;
      const itemBase = TaxService.calculateBaseAmount(itemGross);
      const itemTax = itemGross - itemBase;

      let isEligible = true;
      let effectiveRate = item.customCommissionRate !== undefined ? item.customCommissionRate : providerCommissionRate;
      let notes = 'خاضع لعمولة المنصة حسب باقة المزود';

      if (item.type === 'mini_store_product') {
        if (!miniStoreApplyCommission) {
          // Commission Exemption Rule
          isEligible = false;
          effectiveRate = 0;
          notes = 'مبيعات المتجر المصغر: معفاة افتراضياً من عمولة منصة ليلة (0%)';
        } else {
          isEligible = true;
          effectiveRate = miniStoreCommissionRate;
          notes = `مبيعات المتجر المصغر: خاضعة للعمولة بنسبة ${(effectiveRate * 100).toFixed(1)}%`;
        }
      } else if (item.type === 'discount') {
        isEligible = false;
        effectiveRate = 0;
        notes = 'خصم ترويجي';
      }

      const itemCommTotal = isEligible ? itemGross * effectiveRate : 0;
      const itemCommBase = isEligible ? TaxService.calculateBaseAmount(itemCommTotal) : 0;
      const itemCommVat = isEligible ? (itemCommTotal - itemCommBase) : 0;
      const itemProviderShare = Math.max(0, itemGross - itemCommTotal);

      // Accumulations
      totalGrossAmount += itemGross;
      totalTaxableBase += itemBase;
      totalTaxAmount += itemTax;

      if (isEligible) {
        commissionableBase += itemGross;
        totalPlatformCommission += itemCommTotal;
        totalCommissionBase += itemCommBase;
        totalCommissionVat += itemCommVat;
      } else {
        nonCommissionableBase += itemGross;
      }

      totalProviderReceivable += itemProviderShare;

      if (item.type === 'mini_store_product') {
        miniStoreGrossSales += itemGross;
        miniStorePlatformCommission += itemCommTotal;
        miniStoreTaxes += itemTax;
        miniStoreProviderReceivable += itemProviderShare;
      }

      return {
        id: item.id,
        name: item.name,
        type: item.type,
        grossAmount: Math.round(itemGross * 100) / 100,
        taxableBase: Math.round(itemBase * 100) / 100,
        taxAmount: Math.round(itemTax * 100) / 100,
        commissionEligible: isEligible,
        commissionRate: effectiveRate,
        commissionAmount: Math.round(itemCommTotal * 100) / 100,
        commissionBase: Math.round(itemCommBase * 100) / 100,
        commissionVat: Math.round(itemCommVat * 100) / 100,
        providerReceivable: Math.round(itemProviderShare * 100) / 100,
        policyNotes: notes
      };
    });

    return {
      totalGrossAmount: Math.round(totalGrossAmount * 100) / 100,
      totalTaxableBase: Math.round(totalTaxableBase * 100) / 100,
      totalTaxAmount: Math.round(totalTaxAmount * 100) / 100,
      commissionableBase: Math.round(commissionableBase * 100) / 100,
      nonCommissionableBase: Math.round(nonCommissionableBase * 100) / 100,
      totalPlatformCommission: Math.round(totalPlatformCommission * 100) / 100,
      totalCommissionBase: Math.round(totalCommissionBase * 100) / 100,
      totalCommissionVat: Math.round(totalCommissionVat * 100) / 100,
      totalProviderReceivable: Math.round(totalProviderReceivable * 100) / 100,
      lineItems: calculatedItems,
      miniStoreGrossSales: Math.round(miniStoreGrossSales * 100) / 100,
      miniStorePlatformCommission: Math.round(miniStorePlatformCommission * 100) / 100,
      miniStoreTaxes: Math.round(miniStoreTaxes * 100) / 100,
      miniStoreProviderReceivable: Math.round(miniStoreProviderReceivable * 100) / 100,
      isMiniStoreExempt: !miniStoreApplyCommission,
      policyVersion: this.POLICY_VERSION
    };
  }
}
