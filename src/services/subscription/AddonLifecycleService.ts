/**
 * @file AddonLifecycleService.ts
 * @description Unified Orchestration Engine for Feature Marketplace Add-on Subscriptions.
 * 
 * Enforces verified payment gating, state transitions, concurrency locking,
 * non-destructive lifecycles, and entitlement cache invalidation.
 */

import { Op, Transaction } from 'sequelize';
import { sequelize } from '../../models/dbInstance.js';
import {
  ProviderAddon,
  AddonLifecycleStatus,
  ProviderSubscription,
  SubscriptionPlan,
  FinancialQuote
} from '../../models/SubscriptionModels.js';
import { AddonStateMachine } from './addonStateMachine.js';
import { effectiveEntitlementService } from '../entitlement/effectiveEntitlementService.js';
import { FEATURE_REGISTRY, normalizeFeatureKey } from '../entitlement/featureRegistry.js';
import { financialQuoteService } from '../finance/FinancialQuoteService.js';

export interface PurchaseAddonRequest {
  providerId: number;
  providerEmail?: string;
  featureKey: string;
  quantity?: number;
  billingCycle?: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
  unitPrice?: number;
  quoteId?: string;
  source?: 'MARKETPLACE' | 'ADMIN_MANUAL' | 'PROMOTION' | 'BUNDLE';
  notes?: string;
}

export interface ActivateAddonInput {
  providerId: number;
  providerEmail?: string;
  featureKey: string;
  addonId?: number;
  quoteId?: string;
  paymentId?: string;
  transactionId?: string;
  verifiedEventId?: string;
  amountPaid?: number;
  verifiedBy?: string;
  actor?: string;
  durationMonths?: number;
  notes?: string;
}

export interface RenewAddonInput {
  addonId: number;
  paymentId: string;
  transactionId?: string;
  amountPaid?: number;
  durationMonths?: number;
  actor?: string;
  reason?: string;
}

export interface CancelAddonInput {
  addonId: number;
  immediate?: boolean;
  reason?: string;
  actor?: string;
}

export interface RefundAddonInput {
  addonId: number;
  refundAmount?: number;
  reason: string;
  actor?: string;
}

export interface RevokeAddonInput {
  addonId: number;
  reason: string;
  actor?: string;
}

export class AddonLifecycleService {
  private static instance: AddonLifecycleService;
  private locks: Map<string, Promise<any>> = new Map();

  private constructor() {}

  static getInstance(): AddonLifecycleService {
    if (!AddonLifecycleService.instance) {
      AddonLifecycleService.instance = new AddonLifecycleService();
    }
    return AddonLifecycleService.instance;
  }

  /**
   * Acquire mutex lock on provider/feature key to serialize concurrent lifecycle mutations
   */
  private async runExclusive<T>(lockKey: string, fn: () => Promise<T>): Promise<T> {
    while (this.locks.has(lockKey)) {
      await this.locks.get(lockKey);
    }

    let releaseLock: () => void;
    const lockPromise = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });

    this.locks.set(lockKey, lockPromise);

    try {
      return await fn();
    } finally {
      this.locks.delete(lockKey);
      releaseLock!();
    }
  }

  /**
   * 1. Request Purchase for Feature Addon
   * Checks registry validity, prevents duplicate charges if feature is already included in base plan,
   * creates or updates addon record in PENDING_PAYMENT or DRAFT.
   */
  async requestPurchase(input: PurchaseAddonRequest): Promise<{
    success: boolean;
    addon: ProviderAddon;
    isRedundant?: boolean;
    message: string;
  }> {
    const normKey = normalizeFeatureKey(input.featureKey);
    const lockKey = `addon_purchase:${input.providerId}:${normKey}`;

    return this.runExclusive(lockKey, async () => {
      const def = FEATURE_REGISTRY[normKey];
      if (!def) {
        throw new Error(`الميزة المطلوبة [${input.featureKey}] غير مسجلة في سجل قدرات المنصة.`);
      }

      const quantity = Math.max(1, input.quantity || 1);
      const isNumeric = def.type === 'numeric_limit';
      const baseUnitPrice = input.unitPrice ?? (def.baseAddonPriceMonthly || 0);
      const totalPrice = baseUnitPrice * quantity;
      const billingCycle = input.billingCycle || 'MONTHLY';

      // 1. Check if the active base plan already includes this feature (Boolean only)
      let isRedundant = false;
      const activeSubscription = await ProviderSubscription.findOne({
        where: {
          providerId: input.providerId,
          subscriptionStatus: { [Op.in]: ['ACTIVE', 'RENEWAL_DUE', 'GRACE_PERIOD', 'UPGRADE_SCHEDULED'] }
        },
        order: [['id', 'DESC']]
      });

      if (activeSubscription && !isNumeric) {
        const plan = await SubscriptionPlan.findByPk(activeSubscription.planId);
        if (plan && plan.features) {
          try {
            const features = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
            if (features[normKey] === true || features[normKey] === 'true' || features[normKey] === 1) {
              isRedundant = true;
            }
          } catch {
            // ignore json parse
          }
        }
      }

      // 2. Check for existing active add-ons to prevent duplicate active records
      const existingAddon = await ProviderAddon.findOne({
        where: {
          providerId: input.providerId,
          featureKey: normKey,
          addonStatus: { [Op.in]: ['ACTIVE', 'RENEWAL_DUE', 'GRACE_PERIOD', 'PENDING_PAYMENT', 'PAYMENT_PROCESSING'] }
        },
        order: [['id', 'DESC']]
      });

      let addon: ProviderAddon;

      await sequelize.transaction(async (transaction) => {
        if (existingAddon && !isNumeric && AddonStateMachine.hasActiveEntitlement(existingAddon.addonStatus)) {
          // Boolean add-on is already active! Do not create duplicate row.
          addon = existingAddon;
          return;
        }

        if (existingAddon && (existingAddon.addonStatus === 'PENDING_PAYMENT' || existingAddon.addonStatus === 'DRAFT')) {
          // Reuse pending record and update quantity/price
          existingAddon.quantity = quantity;
          existingAddon.unitPrice = baseUnitPrice;
          existingAddon.pricePaid = totalPrice;
          existingAddon.billingCycle = billingCycle;
          existingAddon.source = input.source || 'MARKETPLACE';
          existingAddon.notes = input.notes || existingAddon.notes;
          existingAddon.version = (existingAddon.version || 1) + 1;
          await existingAddon.save({ transaction });
          addon = existingAddon;
        } else {
          // Create new record
          addon = await ProviderAddon.create({
            providerId: input.providerId,
            providerEmail: input.providerEmail || activeSubscription?.providerEmail || '',
            featureKey: normKey,
            featureName: def.nameAr || normKey,
            addonType: isNumeric ? 'numeric_limit' : 'boolean',
            quantity,
            unitPrice: baseUnitPrice,
            pricePaid: totalPrice,
            currency: 'SAR',
            billingCycle,
            status: 'active',
            addonStatus: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING',
            source: input.source || 'MARKETPLACE',
            purchaseDate: new Date(),
            startsAt: new Date(),
            expiresAt: null,
            notes: input.notes || `طلب شراء ميزة ${def.nameAr}`,
            version: 1
          }, { transaction });
        }

        // Log audit event
        await effectiveEntitlementService.logAuditEvent({
          providerId: input.providerId,
          eventType: 'ADDON_PURCHASE_REQUESTED',
          featureKey: normKey,
          source: 'ADDON',
          actor: input.providerEmail || `Provider#${input.providerId}`,
          reason: `طلب شراء إضافة ${def.nameAr} (الكمية: ${quantity})`,
          newValue: `PENDING_PAYMENT (Amount: ${totalPrice} SAR)`,
          financialImpact: totalPrice,
          metadata: {
            addonId: addon.id,
            quantity,
            unitPrice: baseUnitPrice,
            billingCycle,
            isRedundant
          },
          transaction
        });
      });

      return {
        success: true,
        addon: addon!,
        isRedundant,
        message: isRedundant
          ? 'تنبيه: هذه الميزة مشمولة مسبقاً في باقتك الحالية، لن يتم احتساب أي استحقاق مكرر.'
          : 'تم إنشاء طلب شراء الميزة بنجاح وبانتظار تأكيد الدفع.'
      };
    });
  }

  /**
   * Generates a validated FinancialQuote for an addon purchase
   */
  async generateAddonQuote(input: {
    providerId: number;
    providerEmail?: string;
    featureKey: string;
    quantity?: number;
    billingCycle?: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME';
    actor?: string;
  }): Promise<FinancialQuote> {
    return await financialQuoteService.createAddonQuote(input);
  }

  /**
   * 2. Verified Payment & Addon Activation
   * Feature activation strictly requires a verified payment event or free grant.
   */
  async activateAddonWithPayment(input: ActivateAddonInput): Promise<{
    success: boolean;
    addon: ProviderAddon;
    quote?: FinancialQuote;
    message: string;
  }> {
    const normKey = normalizeFeatureKey(input.featureKey);
    const lockKey = `addon_activate:${input.providerId}:${normKey}`;

    return this.runExclusive(lockKey, async () => {
      // 1. Quote validation if provided
      let quote: FinancialQuote | null = null;
      if (input.quoteId) {
        quote = await financialQuoteService.validateQuote(input.quoteId, input.providerId);
      }

      const totalExpected = quote ? Number(quote.totalAmount) : (input.amountPaid ?? 0);

      if (totalExpected > 0 && !input.paymentId) {
        throw new Error('لا يمكن تفعيل الميزة الإضافية بدون معرّف دفع موثق (Verified Payment Required).');
      }

      let addon: ProviderAddon | null = null;

      await sequelize.transaction(async (transaction) => {
        // Consume quote if present
        if (quote) {
          await financialQuoteService.consumeQuote(quote.quoteId, {
            paymentId: input.paymentId || (totalExpected === 0 ? 'FREE_GRANT' : undefined),
            actor: input.verifiedBy,
            transaction
          });
        }

        if (input.addonId) {
          addon = await ProviderAddon.findByPk(input.addonId, { transaction });
        } else {
          addon = await ProviderAddon.findOne({
            where: {
              providerId: input.providerId,
              featureKey: normKey,
              addonStatus: { [Op.in]: ['PENDING_PAYMENT', 'PAYMENT_PROCESSING', 'DRAFT', 'EXPIRED', 'PAYMENT_FAILED'] }
            },
            order: [['id', 'DESC']],
            transaction
          });
        }

        const def = FEATURE_REGISTRY[normKey];
        const isNumeric = def?.type === 'numeric_limit';
        const now = new Date();
        const duration = input.durationMonths || (addon?.billingCycle === 'YEARLY' ? 12 : 1);

        let expiresAt: Date | null = null;
        if (addon?.billingCycle !== 'ONE_TIME') {
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + duration);
        }

        const finalPricePaid = quote ? Number(quote.totalAmount) : (input.amountPaid ?? addon?.pricePaid ?? 0);

        if (finalPricePaid > 0 && (!input.paymentId || input.paymentId.trim() === '')) {
          throw new Error('لا يمكن تفعيل الميزة الإضافية بدون معرّف دفع موثق (Verified Payment Required).');
        }

        if (addon) {
          const transitionCheck = AddonStateMachine.validateTransition(addon.addonStatus, 'ACTIVE');
          if (!transitionCheck.valid) {
            throw new Error(transitionCheck.reason);
          }

          addon.addonStatus = 'ACTIVE';
          addon.status = 'active';
          addon.paymentStatus = finalPricePaid > 0 ? 'PAID' : 'WAIVED';
          addon.paymentId = input.paymentId || (quote ? quote.quoteId : 'WAIVED');
          addon.transactionId = input.transactionId || input.paymentId || (quote ? quote.quoteId : undefined);
          addon.pricePaid = finalPricePaid;
          addon.startsAt = now;
          addon.expiresAt = expiresAt;
          addon.currentPeriodStart = now;
          addon.currentPeriodEnd = expiresAt;
          addon.gracePeriodEnd = null;
          addon.nextBillingDate = expiresAt;
          addon.notes = input.notes || addon.notes;
          addon.version = (addon.version || 1) + 1;
          await addon.save({ transaction });
        } else {
          // Direct verified activation
          addon = await ProviderAddon.create({
            providerId: input.providerId,
            featureKey: normKey,
            featureName: def?.nameAr || normKey,
            addonType: isNumeric ? 'numeric_limit' : 'boolean',
            quantity: 1,
            unitPrice: quote ? Number(quote.baseAmount) : (input.amountPaid || def?.baseAddonPriceMonthly || 0),
            pricePaid: finalPricePaid,
            currency: 'SAR',
            billingCycle: quote?.billingCycle || 'MONTHLY',
            status: 'active',
            addonStatus: 'ACTIVE',
            paymentStatus: finalPricePaid > 0 ? 'PAID' : 'WAIVED',
            paymentId: input.paymentId || (quote ? quote.quoteId : 'WAIVED'),
            transactionId: input.transactionId || input.paymentId || (quote ? quote.quoteId : undefined),
            purchaseDate: now,
            startsAt: now,
            expiresAt,
            currentPeriodStart: now,
            currentPeriodEnd: expiresAt,
            nextBillingDate: expiresAt,
            source: 'MARKETPLACE',
            notes: input.notes || `تفعيل مباشر وموثق لميزة ${def?.nameAr || normKey}`,
            version: 1
          }, { transaction });
        }

        // Log payment verified audit event
        await effectiveEntitlementService.logAuditEvent({
          providerId: input.providerId,
          eventType: 'ADDON_PAYMENT_VERIFIED',
          featureKey: normKey,
          source: 'ADDON',
          actor: input.verifiedBy || `GatewayVerifier`,
          reason: finalPricePaid > 0
            ? `توثيق سداد قيمة الميزة الإضافية (PaymentId: ${input.paymentId})`
            : `تأكيد تفعيل ميزة إضافية مجانية معتمدة`,
          newValue: `PAID (${addon.pricePaid} SAR)`,
          financialImpact: Number(addon.pricePaid || 0),
          metadata: {
            addonId: addon.id,
            quoteId: quote?.quoteId,
            paymentId: input.paymentId,
            transactionId: input.transactionId
          },
          transaction
        });

        // Log addon activated audit event
        await effectiveEntitlementService.logAuditEvent({
          providerId: input.providerId,
          eventType: 'ADDON_ACTIVATED',
          featureKey: normKey,
          source: 'ADDON',
          actor: input.verifiedBy || `System`,
          reason: `تفعيل الميزة الإضافية بعد التحقق من السداد بنجاح`,
          oldValue: 'PENDING_PAYMENT',
          newValue: 'ACTIVE',
          financialImpact: Number(addon.pricePaid || 0),
          metadata: {
            addonId: addon.id,
            quoteId: quote?.quoteId,
            quantity: addon.quantity,
            startsAt: addon.startsAt,
            expiresAt: addon.expiresAt
          },
          transaction
        });
      });

      // Invalidate Entitlement Cache for provider
      effectiveEntitlementService.invalidateProviderCache(input.providerId);

      return {
        success: true,
        addon: addon!,
        quote: quote || undefined,
        message: 'تم التحقق من الدفع وتفعيل الميزة الإضافية وتحديث الاستحقاقات بنجاح.'
      };
    });
  }

  /**
   * 3. Renew Addon Subscription
   * Extends existing record without creating duplicate conflicting rows.
   */
  async renewAddon(input: RenewAddonInput): Promise<{
    success: boolean;
    addon: ProviderAddon;
    message: string;
  }> {
    if (!input.paymentId) {
      throw new Error('التجديد يتطلب معرّف دفع موثق.');
    }

    const addon = await ProviderAddon.findByPk(input.addonId);
    if (!addon) {
      throw new Error(`سجل الميزة الإضافية [#${input.addonId}] غير موجود.`);
    }

    const lockKey = `addon_renew:${addon.providerId}:${addon.featureKey}`;

    return this.runExclusive(lockKey, async () => {
      await sequelize.transaction(async (transaction) => {
        const freshAddon = await ProviderAddon.findByPk(input.addonId, { transaction });
        if (!freshAddon) throw new Error('تعذر العثور على الميزة الإضافية.');

        const transitionCheck = AddonStateMachine.validateTransition(freshAddon.addonStatus, 'ACTIVE');
        if (!transitionCheck.valid && freshAddon.addonStatus !== 'ACTIVE') {
          throw new Error(transitionCheck.reason);
        }

        const duration = input.durationMonths || (freshAddon.billingCycle === 'YEARLY' ? 12 : 1);
        const now = new Date();
        
        // Extend from current expiresAt if in the future, otherwise from now
        const baseDate = freshAddon.expiresAt && new Date(freshAddon.expiresAt) > now
          ? new Date(freshAddon.expiresAt)
          : now;

        const newExpiresAt = new Date(baseDate);
        newExpiresAt.setMonth(newExpiresAt.getMonth() + duration);

        freshAddon.addonStatus = 'ACTIVE';
        freshAddon.status = 'active';
        freshAddon.paymentStatus = 'PAID';
        freshAddon.paymentId = input.paymentId;
        freshAddon.transactionId = input.transactionId || input.paymentId;
        freshAddon.currentPeriodStart = now;
        freshAddon.currentPeriodEnd = newExpiresAt;
        freshAddon.expiresAt = newExpiresAt;
        freshAddon.gracePeriodEnd = null;
        freshAddon.nextBillingDate = newExpiresAt;
        freshAddon.version = (freshAddon.version || 1) + 1;

        await freshAddon.save({ transaction });

        // Log audit event
        await effectiveEntitlementService.logAuditEvent({
          providerId: freshAddon.providerId,
          eventType: 'ADDON_RENEWED',
          featureKey: freshAddon.featureKey,
          source: 'ADDON',
          actor: input.actor || 'Provider',
          reason: input.reason || `تجديد اشتراك الميزة الإضافية بنجاح`,
          oldValue: 'RENEWAL_DUE',
          newValue: `ACTIVE (Extended until ${newExpiresAt.toISOString()})`,
          financialImpact: input.amountPaid || Number(freshAddon.pricePaid || 0),
          metadata: {
            addonId: freshAddon.id,
            paymentId: input.paymentId,
            newExpiresAt
          },
          transaction
        });
      });

      effectiveEntitlementService.invalidateProviderCache(addon.providerId);

      const updated = await ProviderAddon.findByPk(addon.id);
      return {
        success: true,
        addon: updated!,
        message: 'تم تجديد الميزة الإضافية وتمديد فترة الصلاحية بنجاح.'
      };
    });
  }

  /**
   * 4. Expire Addon
   * Non-destructive: Invalidates entitlement cache, updates status to EXPIRED,
   * without deleting any existing data created during active period.
   */
  async expireAddon(addonId: number, reason?: string, actor?: string): Promise<{
    success: boolean;
    addon: ProviderAddon;
    message: string;
  }> {
    const addon = await ProviderAddon.findByPk(addonId);
    if (!addon) throw new Error(`الميزة الإضافية [#${addonId}] غير موجودة.`);

    const lockKey = `addon_expire:${addon.providerId}:${addon.featureKey}`;

    return this.runExclusive(lockKey, async () => {
      await sequelize.transaction(async (transaction) => {
        const freshAddon = await ProviderAddon.findByPk(addonId, { transaction });
        if (!freshAddon) return;

        const previousStatus = freshAddon.addonStatus;
        freshAddon.addonStatus = 'EXPIRED';
        freshAddon.status = 'expired';
        freshAddon.version = (freshAddon.version || 1) + 1;
        await freshAddon.save({ transaction });

        // Log audit event
        await effectiveEntitlementService.logAuditEvent({
          providerId: freshAddon.providerId,
          eventType: 'ADDON_EXPIRED',
          featureKey: freshAddon.featureKey,
          source: 'ADDON',
          actor: actor || 'SystemScheduler',
          reason: reason || 'انتهاء فترة صلاحية الميزة الإضافية دون تجديد',
          oldValue: previousStatus,
          newValue: 'EXPIRED',
          financialImpact: 0,
          metadata: {
            addonId: freshAddon.id,
            expiredAt: new Date()
          },
          transaction
        });
      });

      effectiveEntitlementService.invalidateProviderCache(addon.providerId);
      const updated = await ProviderAddon.findByPk(addonId);

      return {
        success: true,
        addon: updated!,
        message: 'تم إنهاء صلاحية الميزة الإضافية وإعادة حساب الاستحقاقات بشكل آمن وغير مدمر.'
      };
    });
  }

  /**
   * 5. Cancel Addon
   * Supports immediate cancellation or cancel_at_end_of_cycle policy.
   */
  async cancelAddon(input: CancelAddonInput): Promise<{
    success: boolean;
    addon: ProviderAddon;
    message: string;
  }> {
    const addon = await ProviderAddon.findByPk(input.addonId);
    if (!addon) throw new Error(`الميزة الإضافية [#${input.addonId}] غير موجودة.`);

    const lockKey = `addon_cancel:${addon.providerId}:${addon.featureKey}`;

    return this.runExclusive(lockKey, async () => {
      await sequelize.transaction(async (transaction) => {
        const freshAddon = await ProviderAddon.findByPk(input.addonId, { transaction });
        if (!freshAddon) return;

        const isImmediate = input.immediate ?? false;

        if (isImmediate) {
          freshAddon.addonStatus = 'CANCELLED';
          freshAddon.status = 'cancelled';
          freshAddon.cancelledAt = new Date();
          freshAddon.cancellationReason = input.reason || 'إلغاء فوري بناءً على رغبة المزود';
          freshAddon.autoRenew = false;
        } else {
          freshAddon.cancelAtPeriodEnd = true;
          freshAddon.autoRenew = false;
          freshAddon.cancellationReason = input.reason || 'إلغاء التجديد التلقائي عند نهاية الدورة';
        }

        freshAddon.version = (freshAddon.version || 1) + 1;
        await freshAddon.save({ transaction });

        // Log audit event
        await effectiveEntitlementService.logAuditEvent({
          providerId: freshAddon.providerId,
          eventType: 'ADDON_CANCELLED',
          featureKey: freshAddon.featureKey,
          source: 'ADDON',
          actor: input.actor || 'Provider',
          reason: input.reason || (isImmediate ? 'إلغاء فوري للميزة الإضافية' : 'إلغاء التجديد التلقائي'),
          oldValue: 'ACTIVE',
          newValue: isImmediate ? 'CANCELLED' : 'CANCEL_AT_PERIOD_END',
          financialImpact: 0,
          metadata: {
            addonId: freshAddon.id,
            isImmediate,
            cancelAtPeriodEnd: freshAddon.cancelAtPeriodEnd
          },
          transaction
        });
      });

      effectiveEntitlementService.invalidateProviderCache(addon.providerId);
      const updated = await ProviderAddon.findByPk(addon.id);

      return {
        success: true,
        addon: updated!,
        message: input.immediate
          ? 'تم إلغاء الميزة الإضافية فورياً وإيقاف الاستحقاق.'
          : 'تم جدولة إلغاء الميزة عند نهاية الفترة الحالية بنجاح.'
      };
    });
  }

  /**
   * 6. Refund Addon
   * Revokes entitlement immediately according to refund policy.
   */
  async refundAddon(input: RefundAddonInput): Promise<{
    success: boolean;
    addon: ProviderAddon;
    message: string;
  }> {
    const addon = await ProviderAddon.findByPk(input.addonId);
    if (!addon) throw new Error(`الميزة الإضافية [#${input.addonId}] غير موجودة.`);

    const lockKey = `addon_refund:${addon.providerId}:${addon.featureKey}`;

    return this.runExclusive(lockKey, async () => {
      await sequelize.transaction(async (transaction) => {
        const freshAddon = await ProviderAddon.findByPk(input.addonId, { transaction });
        if (!freshAddon) return;

        const previousStatus = freshAddon.addonStatus;
        freshAddon.addonStatus = 'REFUNDED';
        freshAddon.status = 'cancelled';
        freshAddon.paymentStatus = 'REFUNDED';
        freshAddon.refundedAt = new Date();
        freshAddon.refundReason = input.reason;
        freshAddon.refundAmount = input.refundAmount ?? freshAddon.pricePaid;
        freshAddon.autoRenew = false;
        freshAddon.version = (freshAddon.version || 1) + 1;

        await freshAddon.save({ transaction });

        // Log refund audit event
        await effectiveEntitlementService.logAuditEvent({
          providerId: freshAddon.providerId,
          eventType: 'ADDON_REFUNDED',
          featureKey: freshAddon.featureKey,
          source: 'ADDON',
          actor: input.actor || 'Admin',
          reason: input.reason,
          oldValue: previousStatus,
          newValue: 'REFUNDED',
          financialImpact: -(freshAddon.refundAmount || 0),
          metadata: {
            addonId: freshAddon.id,
            refundAmount: freshAddon.refundAmount
          },
          transaction
        });

        // Log revocation event
        await effectiveEntitlementService.logAuditEvent({
          providerId: freshAddon.providerId,
          eventType: 'ADDON_REVOKED',
          featureKey: freshAddon.featureKey,
          source: 'ADDON',
          actor: input.actor || 'System',
          reason: `سحب الاستحقاق بسبب استرداد المبلغ (${input.reason})`,
          oldValue: previousStatus,
          newValue: 'REVOKED',
          financialImpact: 0,
          metadata: {
            addonId: freshAddon.id
          },
          transaction
        });
      });

      effectiveEntitlementService.invalidateProviderCache(addon.providerId);
      const updated = await ProviderAddon.findByPk(addon.id);

      return {
        success: true,
        addon: updated!,
        message: 'تم استرداد مبلغ الميزة الإضافية وسحب الاستحقاق فورياً.'
      };
    });
  }

  /**
   * 7. Revoke Addon Administratively
   */
  async revokeAddon(input: RevokeAddonInput): Promise<{
    success: boolean;
    addon: ProviderAddon;
    message: string;
  }> {
    const addon = await ProviderAddon.findByPk(input.addonId);
    if (!addon) throw new Error(`الميزة الإضافية [#${input.addonId}] غير موجودة.`);

    const lockKey = `addon_revoke:${addon.providerId}:${addon.featureKey}`;

    return this.runExclusive(lockKey, async () => {
      await sequelize.transaction(async (transaction) => {
        const freshAddon = await ProviderAddon.findByPk(input.addonId, { transaction });
        if (!freshAddon) return;

        freshAddon.addonStatus = 'REVOKED';
        freshAddon.status = 'cancelled';
        freshAddon.autoRenew = false;
        freshAddon.notes = `${freshAddon.notes} | تم السحب: ${input.reason}`;
        freshAddon.version = (freshAddon.version || 1) + 1;
        await freshAddon.save({ transaction });

        await effectiveEntitlementService.logAuditEvent({
          providerId: freshAddon.providerId,
          eventType: 'ADDON_REVOKED',
          featureKey: freshAddon.featureKey,
          source: 'ADDON',
          actor: input.actor || 'Admin',
          reason: input.reason,
          oldValue: 'ACTIVE',
          newValue: 'REVOKED',
          financialImpact: 0,
          metadata: {
            addonId: freshAddon.id
          },
          transaction
        });
      });

      effectiveEntitlementService.invalidateProviderCache(addon.providerId);
      const updated = await ProviderAddon.findByPk(addon.id);

      return {
        success: true,
        addon: updated!,
        message: 'تم سحب الميزة الإضافية بنجاح.'
      };
    });
  }

  /**
   * 8. Grace Period Transition for Addons
   */
  async startGracePeriod(addonId: number, graceDays = 7): Promise<ProviderAddon> {
    const addon = await ProviderAddon.findByPk(addonId);
    if (!addon) throw new Error('الميزة الإضافية غير موجودة.');

    const lockKey = `addon_grace:${addon.providerId}:${addon.featureKey}`;

    return this.runExclusive(lockKey, async () => {
      await sequelize.transaction(async (transaction) => {
        const freshAddon = await ProviderAddon.findByPk(addonId, { transaction });
        if (!freshAddon) return;

        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + graceDays);

        freshAddon.addonStatus = 'GRACE_PERIOD';
        freshAddon.paymentStatus = 'OVERDUE';
        freshAddon.gracePeriodEnd = graceEnd;
        freshAddon.version = (freshAddon.version || 1) + 1;
        await freshAddon.save({ transaction });
      });

      effectiveEntitlementService.invalidateProviderCache(addon.providerId);
      const updated = await ProviderAddon.findByPk(addonId);
      return updated!;
    });
  }

  /**
   * 9. Record Payment Failure on Addon
   */
  async recordPaymentFailure(addonId: number, reason: string): Promise<ProviderAddon> {
    const addon = await ProviderAddon.findByPk(addonId);
    if (!addon) throw new Error('الميزة الإضافية غير موجودة.');

    const lockKey = `addon_payment_failed:${addon.providerId}:${addon.featureKey}`;

    return this.runExclusive(lockKey, async () => {
      await sequelize.transaction(async (transaction) => {
        const freshAddon = await ProviderAddon.findByPk(addonId, { transaction });
        if (!freshAddon) return;

        freshAddon.addonStatus = 'PAYMENT_FAILED';
        freshAddon.paymentStatus = 'FAILED';
        freshAddon.notes = `${freshAddon.notes} | فشل السداد: ${reason}`;
        freshAddon.version = (freshAddon.version || 1) + 1;
        await freshAddon.save({ transaction });
      });

      effectiveEntitlementService.invalidateProviderCache(addon.providerId);
      const updated = await ProviderAddon.findByPk(addonId);
      return updated!;
    });
  }

  /**
   * 10. Upgrade/Downgrade Plan Handlers
   * When a provider upgrades their plan:
   * - Boolean features already provided in the new higher plan don't create double charges or double entitlements.
   * When a provider downgrades their plan:
   * - Active standalone add-ons remain ACTIVE and valid until their respective expiresAt dates.
   */
  async handlePlanUpgrade(providerId: number, newPlanFeatures: Record<string, any>): Promise<void> {
    const activeAddons = await ProviderAddon.findAll({
      where: {
        providerId,
        addonStatus: { [Op.in]: ['ACTIVE', 'RENEWAL_DUE', 'GRACE_PERIOD'] },
        addonType: 'boolean'
      }
    });

    for (const addon of activeAddons) {
      const normKey = normalizeFeatureKey(addon.featureKey);
      if (newPlanFeatures[normKey] === true || newPlanFeatures[normKey] === 'true' || newPlanFeatures[normKey] === 1) {
        // Feature is now natively provided by the upgraded base plan!
        // Pause auto-renew to prevent double-charging on the next billing cycle
        addon.autoRenew = false;
        addon.notes = `${addon.notes} | تم إيقاف التجديد التلقائي للإضافة لأن الميزة أصبحت مشمولة تلقائياً في الباقة الجديدة`;
        await addon.save();
      }
    }
  }

  async handlePlanDowngrade(providerId: number): Promise<void> {
    // Active add-ons continue to be honored and retained until expiresAt
    // Entitlements will resolve base plan + active add-ons smoothly
    effectiveEntitlementService.invalidateProviderCache(providerId);
  }
}

export const addonLifecycleService = AddonLifecycleService.getInstance();
