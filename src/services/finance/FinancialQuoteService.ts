/**
 * @file FinancialQuoteService.ts
 * @description Unified Financial Quote Engine for Subscriptions and Feature Marketplace Add-ons.
 * 
 * Enforces Backend Authority over pricing, taxes (15% VAT), discounts, and expiration.
 * Prevents Frontend price manipulation, stale quotes, cross-provider quote re-use,
 * and premature or unverified activations.
 */

import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../models/dbInstance.js';
import {
  FinancialQuote,
  SubscriptionPlan,
  ProviderAdminGrant,
  ProviderSubscription
} from '../../models/SubscriptionModels.js';
import { TaxService } from './TaxService.js';
import { FEATURE_REGISTRY, normalizeFeatureKey } from '../entitlement/featureRegistry.js';
import { effectiveEntitlementService } from '../entitlement/effectiveEntitlementService.js';

export interface CreateSubscriptionQuoteInput {
  providerId: number;
  providerEmail?: string;
  planId?: number;
  planName?: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  actor?: string;
  metadata?: Record<string, any>;
}

export interface CreateAddonQuoteInput {
  providerId: number;
  providerEmail?: string;
  featureKey: string;
  quantity?: number;
  billingCycle?: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
  actor?: string;
  metadata?: Record<string, any>;
}

export interface QuoteValidationResult {
  valid: boolean;
  quote?: FinancialQuote;
  errorCode?: 'NOT_FOUND' | 'FORBIDDEN' | 'EXPIRED' | 'ALREADY_CONSUMED' | 'CANCELLED';
  message?: string;
}

export class FinancialQuoteService {
  private static instance: FinancialQuoteService;
  private static readonly QUOTE_VALIDITY_MINUTES = 30; // 30 minutes expiration window

  public static getInstance(): FinancialQuoteService {
    if (!FinancialQuoteService.instance) {
      FinancialQuoteService.instance = new FinancialQuoteService();
    }
    return FinancialQuoteService.instance;
  }

  /**
   * Generates a unique serial quote number (e.g. QUO-26-0000000001)
   */
  private async generateQuoteNumber(): Promise<string> {
    const currentYear = new Date().getFullYear();
    const yy = String(currentYear).slice(-2);
    
    try {
      const countThisYear = await FinancialQuote.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
          }
        }
      });
      const seq = countThisYear + 1;
      const paddedSeq = String(seq).padStart(10, '0');
      return `QUO-${yy}-${paddedSeq}`;
    } catch {
      return `QUO-${yy}-${Date.now()}`;
    }
  }

  /**
   * 1. Issue a unified, backend-calculated FinancialQuote for Subscriptions
   */
  public async createSubscriptionQuote(input: CreateSubscriptionQuoteInput): Promise<FinancialQuote> {
    const plan = await this.resolvePlan(input.planId, input.planName);
    if (!plan) {
      throw new Error(`تعذر العثور على باقة الاشتراك المطلوبة.`);
    }

    const billingCycle = input.billingCycle || 'MONTHLY';
    let baseAmount = Number(plan.price || 0);

    // Apply multiplier if annual
    if (billingCycle === 'ANNUAL') {
      baseAmount = baseAmount * 12; // Or 10 months if promo, default 12
    }

    // Check for active discounts or approved grants for this provider
    const now = new Date();
    const activeGrant = await ProviderAdminGrant.findOne({
      where: {
        providerId: input.providerId,
        status: 'ACTIVE',
        grantType: { [Op.in]: ['DISCOUNT', 'FREE_SUBSCRIPTION', 'TEMPORARY_UPGRADE'] },
        startsAt: { [Op.lte]: now },
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gte]: now } }
        ]
      },
      order: [['id', 'DESC']]
    });

    let discountAmount = 0;
    let discountRate: number | null = null;
    let discountSource: 'ADMIN_GRANT' | 'PROMO' | 'COUPON' | 'NONE' = 'NONE';
    let grantId: number | null = null;

    if (activeGrant) {
      grantId = activeGrant.id;
      discountSource = 'ADMIN_GRANT';

      if (activeGrant.grantType === 'FREE_SUBSCRIPTION') {
        discountAmount = baseAmount;
        discountRate = 1.0;
      } else if (
        activeGrant.grantType === 'PERCENTAGE_DISCOUNT' ||
        activeGrant.grantType === 'FIXED_DISCOUNT' ||
        (activeGrant.grantType as string) === 'DISCOUNT'
      ) {
        if (activeGrant.discountAmount && Number(activeGrant.discountAmount) > 0) {
          discountAmount = Math.min(baseAmount, Number(activeGrant.discountAmount));
        } else if (activeGrant.grantValue && Number(activeGrant.grantValue) > 0) {
          // Assume percentage if <= 100
          if (Number(activeGrant.grantValue) <= 1.0) {
            discountRate = Number(activeGrant.grantValue);
            discountAmount = Math.round((baseAmount * discountRate) * 100) / 100;
          } else if (Number(activeGrant.grantValue) <= 100) {
            discountRate = Number(activeGrant.grantValue) / 100;
            discountAmount = Math.round((baseAmount * discountRate) * 100) / 100;
          } else {
            discountAmount = Math.min(baseAmount, Number(activeGrant.grantValue));
          }
        }
      }
    }

    const finalPayableTotal = Math.max(0, Math.round((baseAmount - discountAmount) * 100) / 100);
    const netAmountBeforeTax = Math.round(TaxService.calculateBaseAmount(finalPayableTotal) * 100) / 100;
    const taxAmount = Math.round((finalPayableTotal - netAmountBeforeTax) * 100) / 100;
    const quoteNumber = await this.generateQuoteNumber();
    const expiresAt = new Date(Date.now() + FinancialQuoteService.QUOTE_VALIDITY_MINUTES * 60 * 1000);

    const quote = await FinancialQuote.create({
      quoteId: quoteNumber,
      providerId: input.providerId,
      providerEmail: input.providerEmail || '',
      itemType: 'SUBSCRIPTION',
      planId: plan.id,
      planName: plan.name,
      featureKey: null,
      featureName: null,
      quantity: 1,
      billingCycle,
      baseAmount,
      discountAmount,
      discountRate,
      discountSource,
      grantId,
      netAmountBeforeTax,
      taxRate: 0.15,
      taxAmount,
      totalAmount: finalPayableTotal,
      currency: 'SAR',
      status: 'ISSUED',
      issuedAt: now,
      expiresAt,
      metadata: JSON.stringify({
        ...(input.metadata || {}),
        planId: plan.id,
        planName: plan.name,
        actor: input.actor || 'System'
      })
    });

    // Audit logs
    await effectiveEntitlementService.logAuditEvent({
      providerId: input.providerId,
      eventType: 'FINANCIAL_QUOTE_CREATED',
      source: 'PLAN',
      actor: input.actor || `Provider#${input.providerId}`,
      reason: `إصدار عرض سعر مالي معتمد لاشتراك باقة [${plan.name}]`,
      newValue: `Quote ${quote.quoteId}: Total ${finalPayableTotal} SAR (Base: ${baseAmount}, Discount: ${discountAmount}, Tax: ${taxAmount})`,
      financialImpact: finalPayableTotal,
      metadata: {
        quoteId: quote.quoteId,
        planId: plan.id,
        baseAmount,
        discountAmount,
        taxAmount,
        totalAmount: finalPayableTotal,
        expiresAt
      }
    });

    if (discountAmount > 0) {
      await effectiveEntitlementService.logAuditEvent({
        providerId: input.providerId,
        eventType: 'DISCOUNT_APPLIED',
        source: 'ADMIN_GRANT',
        actor: input.actor || 'System',
        reason: `تطبيق خصم مالي بقيمة ${discountAmount} SAR من المنحة #${grantId}`,
        financialImpact: -discountAmount,
        metadata: { quoteId: quote.quoteId, grantId, discountAmount, discountRate }
      });
    }

    await effectiveEntitlementService.logAuditEvent({
      providerId: input.providerId,
      eventType: 'TAX_CALCULATED',
      source: 'SYSTEM',
      actor: 'TaxService',
      reason: `احتساب ضريبة القيمة المضافة 15% بقيمة ${taxAmount} SAR`,
      financialImpact: taxAmount,
      metadata: { quoteId: quote.quoteId, taxableBase: netAmountBeforeTax, taxRate: 0.15, taxAmount }
    });

    return quote;
  }

  /**
   * 2. Issue a unified, backend-calculated FinancialQuote for Feature Marketplace Add-ons
   */
  public async createAddonQuote(input: CreateAddonQuoteInput): Promise<FinancialQuote> {
    const normKey = normalizeFeatureKey(input.featureKey);
    const def = FEATURE_REGISTRY[normKey];
    if (!def) {
      throw new Error(`الميزة المطلوبة [${input.featureKey}] غير معرفة في سجل القدرات.`);
    }

    const quantity = Math.max(1, input.quantity || 1);
    const unitPrice = def.baseAddonPriceMonthly || 0;
    const billingCycle = input.billingCycle || 'MONTHLY';
    let baseAmount = unitPrice * quantity;

    if (billingCycle === 'ANNUAL') {
      baseAmount = baseAmount * 12;
    }

    // Check for active discounts
    const now = new Date();
    const activeGrant = await ProviderAdminGrant.findOne({
      where: {
        providerId: input.providerId,
        status: 'ACTIVE',
        grantType: { [Op.in]: ['DISCOUNT', 'FREE_FEATURE'] },
        featureKey: normKey,
        startsAt: { [Op.lte]: now },
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gte]: now } }
        ]
      },
      order: [['id', 'DESC']]
    });

    let discountAmount = 0;
    let discountRate: number | null = null;
    let discountSource: 'ADMIN_GRANT' | 'PROMO' | 'COUPON' | 'NONE' = 'NONE';
    let grantId: number | null = null;

    if (activeGrant) {
      grantId = activeGrant.id;
      discountSource = 'ADMIN_GRANT';

      if (
        activeGrant.grantType === 'FEATURE' ||
        (activeGrant.grantType as string) === 'FREE_FEATURE'
      ) {
        discountAmount = baseAmount;
        discountRate = 1.0;
      } else if (
        activeGrant.grantType === 'PERCENTAGE_DISCOUNT' ||
        activeGrant.grantType === 'FIXED_DISCOUNT' ||
        (activeGrant.grantType as string) === 'DISCOUNT'
      ) {
        if (activeGrant.discountAmount && Number(activeGrant.discountAmount) > 0) {
          discountAmount = Math.min(baseAmount, Number(activeGrant.discountAmount));
        } else if (activeGrant.grantValue && Number(activeGrant.grantValue) > 0) {
          if (Number(activeGrant.grantValue) <= 1.0) {
            discountRate = Number(activeGrant.grantValue);
            discountAmount = Math.round((baseAmount * discountRate) * 100) / 100;
          } else if (Number(activeGrant.grantValue) <= 100) {
            discountRate = Number(activeGrant.grantValue) / 100;
            discountAmount = Math.round((baseAmount * discountRate) * 100) / 100;
          } else {
            discountAmount = Math.min(baseAmount, Number(activeGrant.grantValue));
          }
        }
      }
    }

    const finalPayableTotal = Math.max(0, Math.round((baseAmount - discountAmount) * 100) / 100);
    const netAmountBeforeTax = Math.round(TaxService.calculateBaseAmount(finalPayableTotal) * 100) / 100;
    const taxAmount = Math.round((finalPayableTotal - netAmountBeforeTax) * 100) / 100;
    const quoteNumber = await this.generateQuoteNumber();
    const expiresAt = new Date(Date.now() + FinancialQuoteService.QUOTE_VALIDITY_MINUTES * 60 * 1000);

    const quote = await FinancialQuote.create({
      quoteId: quoteNumber,
      providerId: input.providerId,
      providerEmail: input.providerEmail || '',
      itemType: 'ADDON',
      planId: null,
      planName: null,
      featureKey: normKey,
      featureName: def.nameAr || normKey,
      quantity,
      billingCycle,
      baseAmount,
      discountAmount,
      discountRate,
      discountSource,
      grantId,
      netAmountBeforeTax,
      taxRate: 0.15,
      taxAmount,
      totalAmount: finalPayableTotal,
      currency: 'SAR',
      status: 'ISSUED',
      issuedAt: now,
      expiresAt,
      metadata: JSON.stringify({
        ...(input.metadata || {}),
        featureKey: normKey,
        unitPrice,
        quantity,
        actor: input.actor || 'System'
      })
    });

    // Audit logs
    await effectiveEntitlementService.logAuditEvent({
      providerId: input.providerId,
      eventType: 'FINANCIAL_QUOTE_CREATED',
      source: 'ADDON',
      actor: input.actor || `Provider#${input.providerId}`,
      reason: `إصدار عرض سعر مالي لإضافة ميزة [${def.nameAr}]`,
      newValue: `Quote ${quote.quoteId}: Total ${finalPayableTotal} SAR`,
      financialImpact: finalPayableTotal,
      metadata: {
        quoteId: quote.quoteId,
        featureKey: normKey,
        quantity,
        unitPrice,
        baseAmount,
        discountAmount,
        taxAmount,
        totalAmount: finalPayableTotal
      }
    });

    return quote;
  }

  /**
   * 3. Validate a quote against ownership, expiration, and status
   */
  public async validateQuote(quoteId: string, providerId: number): Promise<FinancialQuote> {
    const quote = await FinancialQuote.findOne({ where: { quoteId } });
    if (!quote) {
      throw new Error(`عرض السعر المالي [${quoteId}] غير موجود.`);
    }

    // Strict multi-tenancy check
    if (quote.providerId !== providerId) {
      throw new Error(`غير مصرح: عرض السعر المالي يخص مزوداً آخر ولا يمكن استخدامه.`);
    }

    if (quote.status === 'CONSUMED') {
      throw new Error(`عرض السعر المالي [${quoteId}] تم استخدامه مسبقاً (Already Consumed).`);
    }

    if (quote.status === 'CANCELLED') {
      throw new Error(`عرض السعر المالي [${quoteId}] ملغي.`);
    }

    // Check expiration
    const now = new Date();
    if (quote.expiresAt < now) {
      quote.status = 'EXPIRED';
      await quote.save();
      throw new Error(`انتهت صلاحية عرض السعر المالي [${quoteId}]. يرجى طلب عرض سعر جديد.`);
    }

    return quote;
  }

  /**
   * 4. Idempotently consume a FinancialQuote upon verified payment
   */
  public async consumeQuote(
    quoteId: string,
    paymentDetails: {
      paymentId?: string;
      verifiedEventId?: string;
      actor?: string;
      transaction?: Transaction;
    }
  ): Promise<FinancialQuote> {
    const quote = await FinancialQuote.findOne({
      where: { quoteId },
      transaction: paymentDetails.transaction
    });

    if (!quote) {
      throw new Error(`عرض السعر [${quoteId}] غير موجود.`);
    }

    if (quote.status === 'CONSUMED') {
      return quote; // Idempotent return
    }

    quote.status = 'CONSUMED';
    quote.consumedAt = new Date();
    if (paymentDetails.paymentId) quote.paymentId = paymentDetails.paymentId;
    if (paymentDetails.verifiedEventId) quote.verifiedEventId = paymentDetails.verifiedEventId;

    await quote.save({ transaction: paymentDetails.transaction });

    // Log audit event
    await effectiveEntitlementService.logAuditEvent({
      providerId: quote.providerId,
      eventType: 'FINANCIAL_QUOTE_CONSUMED',
      source: quote.itemType === 'SUBSCRIPTION' ? 'PLAN' : 'ADDON',
      actor: paymentDetails.actor || 'System',
      reason: `استهلاك عرض السعر المالي #${quote.quoteId} بعد التحقق من الدفع`,
      oldValue: 'ISSUED',
      newValue: 'CONSUMED',
      financialImpact: Number(quote.totalAmount),
      metadata: {
        quoteId: quote.quoteId,
        paymentId: quote.paymentId,
        verifiedEventId: quote.verifiedEventId
      },
      transaction: paymentDetails.transaction
    });

    return quote;
  }

  /**
   * Get a quote by quoteId
   */
  public async getQuote(quoteId: string): Promise<FinancialQuote | null> {
    return await FinancialQuote.findOne({ where: { quoteId } });
  }

  /**
   * Helper: Resolves subscription plan by PK or Name
   */
  private async resolvePlan(planId?: number, planName?: string): Promise<SubscriptionPlan | null> {
    if (planId) {
      const p = await SubscriptionPlan.findByPk(planId);
      if (p) return p;
    }
    if (planName) {
      const p = await SubscriptionPlan.findOne({ where: { name: planName } });
      if (p) return p;
    }
    return null;
  }
}

export const financialQuoteService = FinancialQuoteService.getInstance();
