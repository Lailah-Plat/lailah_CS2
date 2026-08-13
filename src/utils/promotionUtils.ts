import { AppliedPromotionSnapshot } from '../types/index.js';

/**
 * Calculates and returns a frozen AppliedPromotionSnapshot based on the platform commission policy:
 * - CommissionOnDiscountedPrice: Platform commission is calculated from the price AFTER discount (Platform participates in discount).
 * - CommissionOnOriginalPrice: Platform commission is calculated from the price BEFORE discount (Platform does not participate in discount).
 */
export function calculateAppliedPromotionSnapshot(params: {
  promotionId?: number | string;
  couponCode?: string;
  originalPrice: number;
  discountType: 'percentage' | 'fixed' | 'free_service' | string;
  discountValue: number;
  commissionPolicy?: 'CommissionOnDiscountedPrice' | 'CommissionOnOriginalPrice';
  commissionRate?: number; // e.g. 0.10 for 10%
}): AppliedPromotionSnapshot {
  const {
    promotionId,
    couponCode,
    originalPrice,
    discountType,
    discountValue,
    commissionPolicy = 'CommissionOnDiscountedPrice',
    commissionRate = 0.10
  } = params;

  let calculatedDiscountAmount = 0;
  const numVal = Number(discountValue) || 0;

  if (discountType === 'percentage') {
    calculatedDiscountAmount = Math.round((originalPrice * numVal) / 100);
  } else if (discountType === 'fixed') {
    calculatedDiscountAmount = Math.min(originalPrice, numVal);
  }

  const discountedPrice = Math.max(0, originalPrice - calculatedDiscountAmount);

  let platformCommissionAmount = 0;
  let providerEntitlementAmount = 0;

  if (commissionPolicy === 'CommissionOnDiscountedPrice') {
    // Commission on price after discount (Layla participates in discount)
    platformCommissionAmount = Math.round(discountedPrice * commissionRate);
    providerEntitlementAmount = discountedPrice - platformCommissionAmount;
  } else {
    // Commission on price before discount (Layla does not participate in discount)
    platformCommissionAmount = Math.round(originalPrice * commissionRate);
    providerEntitlementAmount = Math.max(0, discountedPrice - platformCommissionAmount);
  }

  return {
    promotionId,
    couponCode,
    discountType,
    discountValue: numVal,
    calculatedDiscountAmount,
    originalPrice,
    discountedPrice,
    commissionPolicy,
    platformParticipatesInDiscount: commissionPolicy === 'CommissionOnDiscountedPrice',
    commissionRate,
    platformCommissionAmount,
    providerEntitlementAmount,
    appliedAt: new Date().toISOString()
  };
}
