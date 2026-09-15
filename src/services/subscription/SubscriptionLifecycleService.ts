import { Op } from 'sequelize';
import { sequelize } from '../../models/dbInstance.js';
import {
  ProviderSubscription,
  SubscriptionPlan,
  EntitlementAuditLog,
  SubscriptionLifecycleStatus,
  SubscriptionPaymentStatus,
  FinancialQuote
} from '../../models/SubscriptionModels.js';
import { SubscriptionStateMachine } from './subscriptionStateMachine.js';
import { effectiveEntitlementService } from '../entitlement/effectiveEntitlementService.js';
import { addonLifecycleService } from './AddonLifecycleService.js';
import { financialQuoteService } from '../finance/FinancialQuoteService.js';
import { VerifiedPaymentEvent } from '../../models/Database.js';

export interface CreateSubscriptionInput {
  providerId: number;
  providerEmail: string;
  planId?: number;
  planName?: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  pricePaid?: number;
  quoteId?: string;
  isCustom?: boolean;
  actor?: string;
  reason?: string;
  requestId?: string;
}

export interface ActivateSubscriptionWithPaymentInput {
  providerId: number;
  providerEmail?: string;
  planId?: number;
  planName?: string;
  billingCycle?: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  quoteId?: string;
  paymentId?: string;
  verifiedEventId?: string;
  idempotencyKey?: string;
  actor?: string;
  reason?: string;
  requestId?: string;
  isUpgrade?: boolean;
}

export interface UpgradeSubscriptionInput {
  providerId: number;
  targetPlanId?: number;
  targetPlanName?: string;
  timing?: 'immediate' | 'end_of_cycle';
  pricePaid?: number;
  actor?: string;
  reason?: string;
  requestId?: string;
}

export interface DowngradeSubscriptionInput {
  providerId: number;
  targetPlanId?: number;
  targetPlanName?: string;
  timing?: 'immediate' | 'end_of_cycle';
  actor?: string;
  reason?: string;
  requestId?: string;
}

export interface RenewSubscriptionInput {
  providerId: number;
  durationMonths?: number;
  amountPaid?: number;
  transactionId?: string;
  actor?: string;
  reason?: string;
  requestId?: string;
}

export interface CancelSubscriptionInput {
  providerId: number;
  immediate?: boolean;
  reason?: string;
  actor?: string;
  requestId?: string;
}

export interface GracePeriodInput {
  providerId: number;
  graceDays?: number;
  reason?: string;
  actor?: string;
  requestId?: string;
}

export interface PaymentFailureInput {
  providerId: number;
  reason?: string;
  transactionId?: string;
  actor?: string;
  requestId?: string;
}

/**
 * Unified Lifecycle Service for Provider Subscriptions.
 * Orchestrates all state transitions, billing periods, audits, and concurrency safety.
 */
export class SubscriptionLifecycleService {
  private static instance: SubscriptionLifecycleService;

  // In-memory mutex locks per providerId to guarantee serial execution and prevent race conditions
  private providerLocks: Map<number, Promise<any>> = new Map();

  public static getInstance(): SubscriptionLifecycleService {
    if (!SubscriptionLifecycleService.instance) {
      SubscriptionLifecycleService.instance = new SubscriptionLifecycleService();
    }
    return SubscriptionLifecycleService.instance;
  }

  /**
   * Run an asynchronous task exclusively for a specific provider
   */
  private async runExclusive<T>(providerId: number, task: () => Promise<T>): Promise<T> {
    const existingLock = this.providerLocks.get(providerId) || Promise.resolve();
    let release: () => void = () => {};
    const newLock = new Promise<void>((resolve) => {
      release = resolve;
    });

    this.providerLocks.set(
      providerId,
      existingLock.then(() => newLock).catch(() => newLock)
    );

    await existingLock.catch(() => {});
    try {
      return await task();
    } finally {
      release();
      if (this.providerLocks.get(providerId) === newLock) {
        this.providerLocks.delete(providerId);
      }
    }
  }

  /**
   * Finds or resolves a subscription plan by ID or Name
   */
  private async resolvePlan(planId?: number, planName?: string): Promise<SubscriptionPlan | null> {
    if (planId) {
      const plan = await SubscriptionPlan.findByPk(planId);
      if (plan) return plan;
    }
    if (planName) {
      const plan = await SubscriptionPlan.findOne({ where: { name: planName } });
      if (plan) return plan;
    }
    return null;
  }

  /**
   * Create or initialize a subscription in DRAFT or PENDING_PAYMENT or ACTIVE
   */
  public async createSubscription(input: CreateSubscriptionInput): Promise<ProviderSubscription> {
    return await this.runExclusive(input.providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const plan = await this.resolvePlan(input.planId, input.planName);
        const resolvedPlanName = plan ? plan.name : (input.planName || 'الباقة الأساسية');
        const resolvedPrice = input.pricePaid !== undefined ? input.pricePaid : (plan ? Number(plan.price) : 0);

        // Check if provider already has an active or pending subscription
        let existing = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + (input.billingCycle === 'ANNUAL' ? 12 : 1));

        let sub: ProviderSubscription;
        if (existing && !SubscriptionStateMachine.isExpiredOrCancelled(existing.subscriptionStatus)) {
          // If already active, upgrade or update
          existing.planId = plan ? plan.id : existing.planId;
          existing.planName = resolvedPlanName;
          existing.pricePaid = resolvedPrice;
          existing.subscriptionStatus = existing.subscriptionStatus || 'ACTIVE';
          existing.paymentStatus = existing.paymentStatus || (resolvedPrice > 0 ? 'PAID' : 'WAIVED');
          existing.status = 'active';
          existing.version = (existing.version || 1) + 1;
          await existing.save({ transaction });
          sub = existing;
        } else {
          // Create new record
          sub = await ProviderSubscription.create({
            providerId: input.providerId,
            providerEmail: input.providerEmail,
            planName: resolvedPlanName,
            planId: plan ? plan.id : null,
            pricePaid: resolvedPrice,
            status: 'active',
            subscriptionStatus: 'ACTIVE',
            paymentStatus: resolvedPrice > 0 ? 'PAID' : 'WAIVED',
            billingCycle: input.billingCycle || 'MONTHLY',
            startDate,
            endDate,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
            nextBillingDate: endDate,
            isCustom: Boolean(input.isCustom),
            notes: input.reason || 'اشتراك جديد',
            autoRenew: true,
            version: 1
          }, { transaction });
        }

        // Audit Log
        await EntitlementAuditLog.create({
          providerId: input.providerId,
          providerEmail: input.providerEmail,
          eventType: 'SUBSCRIPTION_CREATED',
          featureKey: null,
          source: 'PLAN',
          actor: input.actor || 'System',
          reason: input.reason || `إنشاء اشتراك جديد في ${resolvedPlanName}`,
          oldValue: null,
          newValue: resolvedPlanName,
          financialImpact: resolvedPrice,
          metadata: JSON.stringify({
            planId: plan?.id,
            planName: resolvedPlanName,
            billingCycle: input.billingCycle || 'MONTHLY',
            requestId: input.requestId || null,
            subscriptionId: sub.id
          })
        }, { transaction });

        await transaction.commit();

        // Invalidate Entitlements Cache
        effectiveEntitlementService.invalidateProviderCache(input.providerId);

        return sub;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Upgrade provider subscription (Immediate or Scheduled at cycle end)
   */
  public async upgradeSubscription(input: UpgradeSubscriptionInput): Promise<{
    subscription: ProviderSubscription;
    effectiveImmediately: boolean;
    scheduledDate?: Date | null;
  }> {
    return await this.runExclusive(input.providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const targetPlan = await this.resolvePlan(input.targetPlanId, input.targetPlanName);
        if (!targetPlan) {
          throw new Error('الباقة المطلوبة للترقية غير موجودة في سجل الخطط');
        }

        const sub = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        if (!sub) {
          throw new Error('لا يوجد اشتراك حالي للمزود للقيام بعملية الترقية');
        }

        const previousPlanName = sub.planName;
        const isImmediate = (input.timing || 'immediate') === 'immediate';

        if (isImmediate) {
          // Validate state transition
          const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'ACTIVE');
          if (!check.valid) {
            throw new Error(check.error);
          }

          // Apply immediate upgrade
          sub.planId = targetPlan.id;
          sub.planName = targetPlan.name;
          if (input.pricePaid !== undefined) {
            sub.pricePaid = input.pricePaid;
          }
          sub.subscriptionStatus = 'ACTIVE';
          sub.status = 'active';
          sub.paymentStatus = 'PAID';
          sub.scheduledPlanId = null;
          sub.scheduledPlanName = null;
          sub.scheduledChangeType = null;
          sub.scheduledChangeDate = null;
          sub.version = (sub.version || 1) + 1;

          await sub.save({ transaction });

          // Audit Log
          await EntitlementAuditLog.create({
            providerId: input.providerId,
            providerEmail: sub.providerEmail,
            eventType: 'SUBSCRIPTION_UPGRADED',
            featureKey: null,
            source: 'PLAN',
            actor: input.actor || 'Provider',
            reason: input.reason || `ترقية فورية من ${previousPlanName} إلى ${targetPlan.name}`,
            oldValue: previousPlanName,
            newValue: targetPlan.name,
            financialImpact: input.pricePaid || Number(targetPlan.price),
            metadata: JSON.stringify({
              previousPlan: previousPlanName,
              newPlan: targetPlan.name,
              timing: 'immediate',
              requestId: input.requestId || null,
              subscriptionId: sub.id
            })
          }, { transaction });

          await transaction.commit();

          // Check if any active boolean add-ons are now covered in the upgraded plan
          try {
            const featuresObj = typeof targetPlan.features === 'string' ? JSON.parse(targetPlan.features) : targetPlan.features;
            await addonLifecycleService.handlePlanUpgrade(input.providerId, featuresObj || {});
          } catch (e) {
            console.warn('[SubscriptionLifecycleService] Error in handlePlanUpgrade hook:', e);
          }

          // Invalidate cache immediately
          effectiveEntitlementService.invalidateProviderCache(input.providerId);

          return {
            subscription: sub,
            effectiveImmediately: true
          };
        } else {
          // Schedule upgrade at end of cycle
          const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'UPGRADE_SCHEDULED');
          if (!check.valid) {
            throw new Error(check.error);
          }

          const changeDate = sub.currentPeriodEnd || sub.endDate || new Date();
          sub.subscriptionStatus = 'UPGRADE_SCHEDULED';
          sub.scheduledPlanId = targetPlan.id;
          sub.scheduledPlanName = targetPlan.name;
          sub.scheduledChangeType = 'UPGRADE';
          sub.scheduledChangeDate = changeDate;
          sub.version = (sub.version || 1) + 1;

          await sub.save({ transaction });

          // Audit Log
          await EntitlementAuditLog.create({
            providerId: input.providerId,
            providerEmail: sub.providerEmail,
            eventType: 'SUBSCRIPTION_UPGRADED',
            featureKey: null,
            source: 'PLAN',
            actor: input.actor || 'Provider',
            reason: input.reason || `جدولة ترقية من ${previousPlanName} إلى ${targetPlan.name} في نهاية الدورة`,
            oldValue: previousPlanName,
            newValue: targetPlan.name,
            financialImpact: 0,
            metadata: JSON.stringify({
              previousPlan: previousPlanName,
              newPlan: targetPlan.name,
              timing: 'end_of_cycle',
              scheduledDate: changeDate.toISOString(),
              requestId: input.requestId || null,
              subscriptionId: sub.id
            })
          }, { transaction });

          await transaction.commit();

          return {
            subscription: sub,
            effectiveImmediately: false,
            scheduledDate: changeDate
          };
        }
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Downgrade provider subscription (Immediate or Scheduled at cycle end)
   * Non-destructive: Does NOT delete data. If usage > new limit, status becomes OVER_LIMIT.
   */
  public async downgradeSubscription(input: DowngradeSubscriptionInput): Promise<{
    subscription: ProviderSubscription;
    effectiveImmediately: boolean;
    scheduledDate?: Date | null;
  }> {
    return await this.runExclusive(input.providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const targetPlan = await this.resolvePlan(input.targetPlanId, input.targetPlanName);
        if (!targetPlan) {
          throw new Error('الباقة المطلوبة لتخفيض الاشتراك غير موجودة');
        }

        const sub = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        if (!sub) {
          throw new Error('لا يوجد اشتراك حالي للمزود للقيام بعملية تخفيض الباقة');
        }

        const previousPlanName = sub.planName;
        const isImmediate = (input.timing || 'immediate') === 'immediate';

        if (isImmediate) {
          // Validate transition
          const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'ACTIVE');
          if (!check.valid) {
            throw new Error(check.error);
          }

          // Apply immediate non-destructive downgrade
          sub.planId = targetPlan.id;
          sub.planName = targetPlan.name;
          sub.pricePaid = Number(targetPlan.price);
          sub.subscriptionStatus = 'ACTIVE';
          sub.status = 'active';
          sub.scheduledPlanId = null;
          sub.scheduledPlanName = null;
          sub.scheduledChangeType = null;
          sub.scheduledChangeDate = null;
          sub.version = (sub.version || 1) + 1;

          await sub.save({ transaction });

          // Audit Log
          await EntitlementAuditLog.create({
            providerId: input.providerId,
            providerEmail: sub.providerEmail,
            eventType: 'SUBSCRIPTION_DOWNGRADED',
            featureKey: null,
            source: 'PLAN',
            actor: input.actor || 'Provider',
            reason: input.reason || `تخفيض فوري غير مدمر للباقة من ${previousPlanName} إلى ${targetPlan.name}`,
            oldValue: previousPlanName,
            newValue: targetPlan.name,
            financialImpact: Number(targetPlan.price),
            metadata: JSON.stringify({
              previousPlan: previousPlanName,
              newPlan: targetPlan.name,
              timing: 'immediate',
              requestId: input.requestId || null,
              subscriptionId: sub.id
            })
          }, { transaction });

          await transaction.commit();

          // Invalidate cache immediately so new limits and OVER_LIMIT flags apply
          effectiveEntitlementService.invalidateProviderCache(input.providerId);

          return {
            subscription: sub,
            effectiveImmediately: true
          };
        } else {
          // Schedule downgrade at end of cycle
          const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'DOWNGRADE_SCHEDULED');
          if (!check.valid) {
            throw new Error(check.error);
          }

          const changeDate = sub.currentPeriodEnd || sub.endDate || new Date();
          sub.subscriptionStatus = 'DOWNGRADE_SCHEDULED';
          sub.scheduledPlanId = targetPlan.id;
          sub.scheduledPlanName = targetPlan.name;
          sub.scheduledChangeType = 'DOWNGRADE';
          sub.scheduledChangeDate = changeDate;
          sub.version = (sub.version || 1) + 1;

          await sub.save({ transaction });

          // Audit Log
          await EntitlementAuditLog.create({
            providerId: input.providerId,
            providerEmail: sub.providerEmail,
            eventType: 'SUBSCRIPTION_DOWNGRADED',
            featureKey: null,
            source: 'PLAN',
            actor: input.actor || 'Provider',
            reason: input.reason || `جدولة تخفيض الباقة من ${previousPlanName} إلى ${targetPlan.name} في نهاية الدورة`,
            oldValue: previousPlanName,
            newValue: targetPlan.name,
            financialImpact: 0,
            metadata: JSON.stringify({
              previousPlan: previousPlanName,
              newPlan: targetPlan.name,
              timing: 'end_of_cycle',
              scheduledDate: changeDate.toISOString(),
              requestId: input.requestId || null,
              subscriptionId: sub.id
            })
          }, { transaction });

          await transaction.commit();

          return {
            subscription: sub,
            effectiveImmediately: false,
            scheduledDate: changeDate
          };
        }
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Renew provider subscription.
   * Prevents duplicate active periods and seamless applies scheduled upgrades/downgrades.
   */
  public async renewSubscription(input: RenewSubscriptionInput): Promise<ProviderSubscription> {
    return await this.runExclusive(input.providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const sub = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        if (!sub) {
          throw new Error('لا يوجد اشتراك لتجديده');
        }

        // Validate state transition
        const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'ACTIVE');
        if (!check.valid) {
          throw new Error(check.error);
        }

        const previousPeriodEnd = sub.currentPeriodEnd || sub.endDate || new Date();
        const durationMonths = input.durationMonths || (sub.billingCycle === 'ANNUAL' ? 12 : 1);

        // New period dates starting from previous end date or today
        const now = new Date();
        const startBase = previousPeriodEnd > now ? previousPeriodEnd : now;
        const newStart = new Date(startBase);
        const newEnd = new Date(startBase);
        newEnd.setMonth(newEnd.getMonth() + durationMonths);

        // Check if there was a scheduled plan upgrade or downgrade to apply upon renewal
        let finalPlanName = sub.planName;
        let finalPlanId = sub.planId;
        if (sub.scheduledPlanId || sub.scheduledPlanName) {
          const scheduledPlan = await this.resolvePlan(sub.scheduledPlanId || undefined, sub.scheduledPlanName || undefined);
          if (scheduledPlan) {
            finalPlanId = scheduledPlan.id;
            finalPlanName = scheduledPlan.name;
          }
        }

        const previousStatus = sub.subscriptionStatus;
        sub.planId = finalPlanId;
        sub.planName = finalPlanName;
        sub.subscriptionStatus = 'ACTIVE';
        sub.status = 'active';
        sub.paymentStatus = 'PAID';
        sub.currentPeriodStart = newStart;
        sub.currentPeriodEnd = newEnd;
        sub.endDate = newEnd;
        sub.nextBillingDate = newEnd;
        sub.gracePeriodEnd = null;
        sub.scheduledPlanId = null;
        sub.scheduledPlanName = null;
        sub.scheduledChangeType = null;
        sub.scheduledChangeDate = null;
        sub.version = (sub.version || 1) + 1;

        if (input.amountPaid !== undefined) {
          sub.pricePaid = input.amountPaid;
        }

        await sub.save({ transaction });

        // Audit Log
        await EntitlementAuditLog.create({
          providerId: input.providerId,
          providerEmail: sub.providerEmail,
          eventType: 'SUBSCRIPTION_RENEWED',
          featureKey: null,
          source: 'PLAN',
          actor: input.actor || 'System',
          reason: input.reason || `تجديد الاشتراك بنجاح حتى ${newEnd.toISOString().split('T')[0]}`,
          oldValue: previousStatus,
          newValue: 'ACTIVE',
          financialImpact: input.amountPaid || sub.pricePaid || 0,
          metadata: JSON.stringify({
            periodStart: newStart.toISOString(),
            periodEnd: newEnd.toISOString(),
            transactionId: input.transactionId || null,
            requestId: input.requestId || null,
            subscriptionId: sub.id
          })
        }, { transaction });

        await transaction.commit();

        // Invalidate cache
        effectiveEntitlementService.invalidateProviderCache(input.providerId);

        return sub;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Enters Grace Period for provider subscription (e.g. renewal payment pending/failed)
   */
  public async startGracePeriod(input: GracePeriodInput): Promise<ProviderSubscription> {
    return await this.runExclusive(input.providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const sub = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        if (!sub) {
          throw new Error('لا يوجد اشتراك لتفعيل فترة السماح');
        }

        const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'GRACE_PERIOD');
        if (!check.valid) {
          throw new Error(check.error);
        }

        const graceDays = input.graceDays || 7;
        const graceEnd = new Date();
        graceEnd.setDate(graceEnd.getDate() + graceDays);

        const previousStatus = sub.subscriptionStatus;
        sub.subscriptionStatus = 'GRACE_PERIOD';
        sub.status = 'active'; // Still granted operational access during grace period
        sub.paymentStatus = 'OVERDUE';
        sub.gracePeriodEnd = graceEnd;
        sub.version = (sub.version || 1) + 1;

        await sub.save({ transaction });

        // Audit Log
        await EntitlementAuditLog.create({
          providerId: input.providerId,
          providerEmail: sub.providerEmail,
          eventType: 'SUBSCRIPTION_GRACE_STARTED',
          featureKey: null,
          source: 'PLAN',
          actor: input.actor || 'System',
          reason: input.reason || `بدء مهلة سماح لمدة ${graceDays} أيام حتى ${graceEnd.toISOString().split('T')[0]}`,
          oldValue: previousStatus,
          newValue: 'GRACE_PERIOD',
          financialImpact: 0,
          metadata: JSON.stringify({
            graceDays,
            graceEnd: graceEnd.toISOString(),
            requestId: input.requestId || null,
            subscriptionId: sub.id
          })
        }, { transaction });

        await transaction.commit();

        // Invalidate cache
        effectiveEntitlementService.invalidateProviderCache(input.providerId);

        return sub;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Expire subscription.
   * Restricts new listings, but preserves past resources, independent add-ons, and allows payout withdrawals.
   */
  public async expireSubscription(providerId: number, reason: string = 'انتهاء فترة الاشتراك ومهلة السماح'): Promise<ProviderSubscription> {
    return await this.runExclusive(providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const sub = await ProviderSubscription.findOne({
          where: { providerId },
          order: [['id', 'DESC']],
          transaction
        });

        if (!sub) {
          throw new Error('لا يوجد اشتراك لإنهائه');
        }

        const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'EXPIRED');
        if (!check.valid) {
          throw new Error(check.error);
        }

        const previousStatus = sub.subscriptionStatus;
        sub.subscriptionStatus = 'EXPIRED';
        sub.status = 'expired';
        sub.version = (sub.version || 1) + 1;

        await sub.save({ transaction });

        // Audit Log
        await EntitlementAuditLog.create({
          providerId,
          providerEmail: sub.providerEmail,
          eventType: 'SUBSCRIPTION_EXPIRED',
          featureKey: null,
          source: 'PLAN',
          actor: 'System',
          reason,
          oldValue: previousStatus,
          newValue: 'EXPIRED',
          financialImpact: 0,
          metadata: JSON.stringify({
            reason,
            subscriptionId: sub.id
          })
        }, { transaction });

        await transaction.commit();

        // Invalidate cache
        effectiveEntitlementService.invalidateProviderCache(providerId);

        return sub;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Cancel subscription (Immediate or at period end)
   */
  public async cancelSubscription(input: CancelSubscriptionInput): Promise<ProviderSubscription> {
    return await this.runExclusive(input.providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const sub = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        if (!sub) {
          throw new Error('لا يوجد اشتراك لإلغائه');
        }

        const isImmediate = input.immediate ?? false;
        const previousStatus = sub.subscriptionStatus;

        if (isImmediate) {
          const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'CANCELLED');
          if (!check.valid) {
            throw new Error(check.error);
          }

          sub.subscriptionStatus = 'CANCELLED';
          sub.status = SubscriptionStateMachine.mapToLegacyStatus('CANCELLED');
          sub.autoRenew = false;
          sub.cancelledAt = new Date();
          sub.cancellationReason = input.reason || 'إلغاء الاشتراك الفوري بناءً على طلب العميل';
          sub.version = (sub.version || 1) + 1;
        } else {
          // Cancel auto-renew at period end
          sub.autoRenew = false;
          sub.cancellationReason = input.reason || 'إلغاء التجديد التلقائي في نهاية الدورة الحالية';
          sub.version = (sub.version || 1) + 1;
        }

        await sub.save({ transaction });

        // Audit Log
        await EntitlementAuditLog.create({
          providerId: input.providerId,
          providerEmail: sub.providerEmail,
          eventType: 'SUBSCRIPTION_CANCELLED',
          featureKey: null,
          source: 'PLAN',
          actor: input.actor || 'Provider',
          reason: input.reason || (isImmediate ? 'إلغاء فوري للاشتراك' : 'إلغاء التجديد التلقائي في نهاية الدورة'),
          oldValue: previousStatus,
          newValue: isImmediate ? 'CANCELLED' : previousStatus,
          financialImpact: 0,
          metadata: JSON.stringify({
            immediate: isImmediate,
            cancelledAt: isImmediate ? new Date().toISOString() : null,
            requestId: input.requestId || null,
            subscriptionId: sub.id
          })
        }, { transaction });

        await transaction.commit();

        // Invalidate cache
        effectiveEntitlementService.invalidateProviderCache(input.providerId);

        return sub;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Records a payment failure event during renewal or checkout
   */
  public async recordPaymentFailure(input: PaymentFailureInput): Promise<ProviderSubscription> {
    return await this.runExclusive(input.providerId, async () => {
      const transaction = await sequelize.transaction();
      try {
        const sub = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        if (!sub) {
          throw new Error('لا يوجد اشتراك لتسجيل فشل الدفع له');
        }

        const previousStatus = sub.subscriptionStatus;
        const check = SubscriptionStateMachine.validateTransition(sub.subscriptionStatus, 'PAYMENT_FAILED');
        if (check.valid) {
          sub.subscriptionStatus = 'PAYMENT_FAILED';
        }
        sub.paymentStatus = 'FAILED';
        sub.version = (sub.version || 1) + 1;

        await sub.save({ transaction });

        // Audit Log
        await EntitlementAuditLog.create({
          providerId: input.providerId,
          providerEmail: sub.providerEmail,
          eventType: 'SUBSCRIPTION_PAYMENT_FAILED',
          featureKey: null,
          source: 'PLAN',
          actor: input.actor || 'PaymentGateway',
          reason: input.reason || 'فشل معالجة عملية الدفع لتجديد الاشتراك',
          oldValue: previousStatus,
          newValue: sub.subscriptionStatus,
          financialImpact: 0,
          metadata: JSON.stringify({
            transactionId: input.transactionId || null,
            reason: input.reason,
            requestId: input.requestId || null,
            subscriptionId: sub.id
          })
        }, { transaction });

        await transaction.commit();

        return sub;
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Generates a validated FinancialQuote for subscribing to or upgrading a plan
   */
  public async generateSubscriptionQuote(input: {
    providerId: number;
    providerEmail?: string;
    planId?: number;
    planName?: string;
    billingCycle?: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
    actor?: string;
  }): Promise<FinancialQuote> {
    return await financialQuoteService.createSubscriptionQuote(input);
  }

  /**
   * Verified Payment & Subscription Activation
   * Gated strictly by Verified Payment Event or Approved Free Grant (amount = 0).
   * Enforces backend quote authority and idempotency.
   */
  public async activateSubscriptionWithPayment(input: ActivateSubscriptionWithPaymentInput): Promise<{
    success: boolean;
    subscription: ProviderSubscription;
    quote: FinancialQuote;
    message: string;
  }> {
    return await this.runExclusive(input.providerId, async () => {
      // 1. Resolve or Validate FinancialQuote (Backend Authority)
      let quote: FinancialQuote | null = null;
      if (input.quoteId) {
        quote = await FinancialQuote.findOne({ where: { quoteId: input.quoteId } });
        if (!quote) {
          throw new Error(`عرض السعر المالي [${input.quoteId}] غير موجود.`);
        }
        if (quote.providerId !== input.providerId) {
          throw new Error(`غير مصرح: عرض السعر المالي يخص مزوداً آخر ولا يمكن استخدامه.`);
        }
        if (quote.status === 'CONSUMED') {
          // Check for idempotency: if the subscription is already active with this payment or quote
          const existingSub = await ProviderSubscription.findOne({
            where: {
              providerId: input.providerId,
              [Op.or]: [
                { paymentId: input.paymentId || 'NONE' },
                { paymentId: quote.quoteId }
              ]
            },
            order: [['id', 'DESC']]
          });

          if (existingSub && existingSub.subscriptionStatus === 'ACTIVE') {
            return {
              success: true,
              subscription: existingSub,
              quote,
              message: 'تمت معالجة تفعيل الاشتراك مسبقاً بنجاح (معاملة مكررة متطابقة - Idempotent).'
            };
          }

          throw new Error(`عرض السعر المالي [${input.quoteId}] تم استخدامه مسبقاً (Already Consumed).`);
        }
        if (quote.status === 'CANCELLED') {
          throw new Error(`عرض السعر المالي [${input.quoteId}] ملغي.`);
        }
        if (quote.expiresAt < new Date()) {
          quote.status = 'EXPIRED';
          await quote.save();
          throw new Error(`انتهت صلاحية عرض السعر المالي [${input.quoteId}]. يرجى طلب عرض سعر جديد.`);
        }
      } else {
        quote = await financialQuoteService.createSubscriptionQuote({
          providerId: input.providerId,
          providerEmail: input.providerEmail,
          planId: input.planId,
          planName: input.planName,
          billingCycle: input.billingCycle,
          actor: input.actor
        });
      }

      const totalAmount = Number(quote.totalAmount || 0);

      // 2. Strict Payment Verification Check
      if (totalAmount > 0) {
        if (!input.paymentId && !input.verifiedEventId) {
          throw new Error('لا يمكن تفعيل الاشتراك المدفوع بدون إشعار دفع موثق (Verified Payment Required).');
        }

        if (input.verifiedEventId) {
          const verifiedEvent = await VerifiedPaymentEvent.findByPk(input.verifiedEventId);
          if (verifiedEvent) {
            const paidGross = (verifiedEvent.amountHalalas || 0) / 100;
            if (paidGross > 0 && Math.abs(paidGross - totalAmount) > 0.05) {
              throw new Error(`عدم تطابق في المبلغ المدفوع (${paidGross} SAR) مع قيمة عرض السعر المعتمد (${totalAmount} SAR).`);
            }
          }
        }
      }

      const transaction = await sequelize.transaction();
      try {
        // 3. Consume Financial Quote idempotently
        await financialQuoteService.consumeQuote(quote.quoteId, {
          paymentId: input.paymentId || (totalAmount === 0 ? 'FREE_GRANT' : undefined),
          verifiedEventId: input.verifiedEventId,
          actor: input.actor,
          transaction
        });

        // 4. Update or Create Provider Subscription
        const plan = await this.resolvePlan(quote.planId || undefined, quote.planName || undefined);
        const resolvedPlanName = plan ? plan.name : (quote.planName || 'الباقة الأساسية');

        let sub = await ProviderSubscription.findOne({
          where: { providerId: input.providerId },
          order: [['id', 'DESC']],
          transaction
        });

        const startDate = new Date();
        const durationMonths = quote.billingCycle === 'ANNUAL' ? 12 : 1;
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + durationMonths);

        const previousPlanName = sub?.planName || null;
        const isUpgrade = Boolean(input.isUpgrade || (sub && sub.planName !== resolvedPlanName));
        const subBillingCycle = (quote.billingCycle === 'ANNUAL' ? 'ANNUAL' : (quote.billingCycle === 'CUSTOM' ? 'CUSTOM' : 'MONTHLY')) as 'MONTHLY' | 'ANNUAL' | 'CUSTOM';

        if (sub) {
          sub.planId = plan ? plan.id : sub.planId;
          sub.planName = resolvedPlanName;
          sub.pricePaid = totalAmount;
          sub.subscriptionStatus = 'ACTIVE';
          sub.status = 'active';
          sub.paymentStatus = totalAmount > 0 ? 'PAID' : 'WAIVED';
          sub.paymentId = input.paymentId || quote.quoteId;
          sub.billingCycle = subBillingCycle;
          sub.currentPeriodStart = startDate;
          sub.currentPeriodEnd = endDate;
          sub.endDate = endDate;
          sub.nextBillingDate = endDate;
          sub.gracePeriodEnd = null;
          sub.scheduledPlanId = null;
          sub.scheduledPlanName = null;
          sub.scheduledChangeType = null;
          sub.scheduledChangeDate = null;
          sub.version = (sub.version || 1) + 1;
          await sub.save({ transaction });
        } else {
          sub = await ProviderSubscription.create({
            providerId: input.providerId,
            providerEmail: input.providerEmail || quote.providerEmail || '',
            planName: resolvedPlanName,
            planId: plan ? plan.id : null,
            pricePaid: totalAmount,
            status: 'active',
            subscriptionStatus: 'ACTIVE',
            paymentStatus: totalAmount > 0 ? 'PAID' : 'WAIVED',
            paymentId: input.paymentId || quote.quoteId,
            billingCycle: subBillingCycle,
            startDate,
            endDate,
            currentPeriodStart: startDate,
            currentPeriodEnd: endDate,
            nextBillingDate: endDate,
            isCustom: false,
            notes: input.reason || (totalAmount === 0 ? 'تفعيل اشتراك مجاني معتمد' : 'تفعيل اشتراك بعد التحقق من الدفع'),
            autoRenew: true,
            version: 1
          }, { transaction });
        }

        // 5. Emit Audit Events
        await effectiveEntitlementService.logAuditEvent({
          providerId: input.providerId,
          providerEmail: input.providerEmail || sub.providerEmail,
          eventType: 'SUBSCRIPTION_PAYMENT_VERIFIED',
          source: 'PLAN',
          actor: input.actor || 'PaymentGateway',
          reason: totalAmount > 0 
            ? `التحقق من سداد رسوم الاشتراك (${totalAmount} SAR) للباقة ${resolvedPlanName}`
            : `تأكيد تفعيل اشتراك مجاني معتمد (${resolvedPlanName})`,
          oldValue: previousPlanName,
          newValue: resolvedPlanName,
          financialImpact: totalAmount,
          metadata: {
            quoteId: quote.quoteId,
            planId: plan?.id,
            planName: resolvedPlanName,
            paymentId: input.paymentId,
            verifiedEventId: input.verifiedEventId,
            totalAmount,
            taxAmount: quote.taxAmount,
            isUpgrade
          },
          transaction
        });

        await effectiveEntitlementService.logAuditEvent({
          providerId: input.providerId,
          providerEmail: input.providerEmail || sub.providerEmail,
          eventType: isUpgrade ? 'SUBSCRIPTION_UPGRADED' : 'SUBSCRIPTION_ACTIVATED',
          source: 'PLAN',
          actor: input.actor || 'System',
          reason: isUpgrade 
            ? `ترقية الاشتراك إلى ${resolvedPlanName}`
            : `تفعيل الاشتراك في ${resolvedPlanName}`,
          oldValue: previousPlanName,
          newValue: resolvedPlanName,
          financialImpact: totalAmount,
          metadata: {
            subscriptionId: sub.id,
            quoteId: quote.quoteId,
            billingCycle: quote.billingCycle
          },
          transaction
        });

        await transaction.commit();

        // 6. Handle plan upgrade feature inclusions if needed
        if (isUpgrade && plan && plan.features) {
          try {
            const featuresObj = typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features;
            await addonLifecycleService.handlePlanUpgrade(input.providerId, featuresObj || {});
          } catch (e) {
            console.warn('[SubscriptionLifecycleService] Error in handlePlanUpgrade hook:', e);
          }
        }

        // 7. Invalidate Entitlements Cache
        effectiveEntitlementService.invalidateProviderCache(input.providerId);

        return {
          success: true,
          subscription: sub,
          quote,
          message: totalAmount === 0 
            ? 'تم تفعيل الاشتراك المجاني المعتمد بنجاح.'
            : 'تم التحقق من عملية الدفع وتفعيل الاشتراك بنجاح.'
        };
      } catch (err) {
        await transaction.rollback();
        throw err;
      }
    });
  }

  /**
   * Get active or latest subscription for provider
   */
  public async getProviderSubscription(providerId: number): Promise<ProviderSubscription | null> {
    return await ProviderSubscription.findOne({
      where: { providerId },
      order: [['id', 'DESC']]
    });
  }
}

export const subscriptionLifecycleService = SubscriptionLifecycleService.getInstance();
