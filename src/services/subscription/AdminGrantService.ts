/**
 * @file AdminGrantService.ts
 * @description Centralized Service for Admin Grants, Promotional Entitlements,
 * Temporary Upgrades, Numeric Limit Increases, and Billing Discounts for Lailah Platform.
 * 
 * Strict Invariants:
 * 1. Base Plan Definitions are NEVER mutated to grant individual provider privileges.
 * 2. Mandatory Reason on all Admin Grants and Revocations.
 * 3. Temporary Upgrades elevate effective entitlements non-destructively; on expiry,
 *    entitlements are recalculated from current active sources.
 * 4. Numeric Grants add quantity to effective limits; on expiry, if used > limit,
 *    no data is deleted; provider is placed in OVER_LIMIT state.
 * 5. Complete RBAC enforcement and Immutable Audit Trail.
 */

import { Op } from 'sequelize';
import { sequelize } from '../../models/dbInstance.js';
import {
  ProviderAdminGrant,
  SubscriptionPlan,
  ProviderSubscription,
  EntitlementAuditLog,
  AdminGrantType,
  AdminGrantStatus,
  migrateSubscriptionTables
} from '../../models/SubscriptionModels.js';
import { User } from '../../models/UserModels.js';
import {
  FEATURE_REGISTRY,
  normalizeFeatureKey,
  FeatureKey
} from '../entitlement/featureRegistry.js';
import { EffectiveEntitlementService } from '../entitlement/effectiveEntitlementService.js';

export interface ActorContext {
  actorId?: number;
  actorName: string;
  role: string;
  permissions?: string[];
}

export interface CreateSubscriptionGrantInput {
  providerId: number;
  grantType: 'FREE_SUBSCRIPTION' | 'PLAN' | 'TEMPORARY_UPGRADE';
  planId?: number;
  planName?: string;
  durationMonths?: number; // 3, 6, 12, or custom
  startsAt?: Date;
  expiresAt?: Date | null;
  reason: string;
  internalNotes?: string;
  campaignId?: string;
  approvedBy?: string;
  financialImpact?: number;
}

export interface CreateFeatureGrantInput {
  providerId: number;
  grantType?: 'FEATURE' | 'PROMOTIONAL_ENTITLEMENT' | 'LIMIT_INCREASE';
  featureKey: string;
  featureName?: string;
  quantity?: number;
  value?: string;
  durationMonths?: number;
  durationDays?: number;
  startsAt?: Date;
  expiresAt?: Date | null;
  reason: string;
  internalNotes?: string;
  campaignId?: string;
  approvedBy?: string;
  financialImpact?: number;
}

export interface CreateDiscountGrantInput {
  providerId: number;
  grantType: 'PERCENTAGE_DISCOUNT' | 'FIXED_DISCOUNT';
  discountValue: number; // e.g. 20 (for 20%) or 100 (for 100 SAR)
  durationMonths?: number;
  startsAt?: Date;
  expiresAt?: Date | null;
  reason: string;
  internalNotes?: string;
  campaignId?: string;
  approvedBy?: string;
  listPrice?: number;
}

export interface CreateBulkGrantInput {
  providerIds: number[];
  grantType: AdminGrantType;
  planId?: number;
  planName?: string;
  featureKey?: string;
  featureName?: string;
  quantity?: number;
  value?: string;
  durationMonths?: number;
  durationDays?: number;
  startsAt?: Date;
  expiresAt?: Date | null;
  reason: string;
  internalNotes?: string;
  campaignId?: string;
  approvedBy?: string;
  financialImpactPerProvider?: number;
}

export interface RevokeGrantInput {
  reason: string;
  internalNotes?: string;
}

export class AdminGrantService {
  private static instance: AdminGrantService;
  private entitlementService: EffectiveEntitlementService;
  private providerLocks: Map<number, Promise<void>> = new Map();

  private constructor() {
    this.entitlementService = EffectiveEntitlementService.getInstance();
  }

  public static getInstance(): AdminGrantService {
    if (!AdminGrantService.instance) {
      AdminGrantService.instance = new AdminGrantService();
    }
    return AdminGrantService.instance;
  }

  /**
   * Concurrency helper to run exclusive mutation per provider
   */
  private async runExclusive<T>(providerId: number, action: () => Promise<T>): Promise<T> {
    const currentLock = this.providerLocks.get(providerId) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.providerLocks.set(providerId, currentLock.then(() => nextLock));

    try {
      await currentLock;
      return await action();
    } finally {
      releaseLock!();
      if (this.providerLocks.get(providerId) === nextLock) {
        this.providerLocks.delete(providerId);
      }
    }
  }

  /**
   * RBAC Permission Validator
   */
  public checkPermission(actor: ActorContext, requiredPermission: string): void {
    if (!actor) {
      throw new Error('UNAUTHORIZED: No actor context provided');
    }

    const isAdmin = actor.role === 'Admin' || actor.role === 'SuperAdmin' || actor.role === 'مدير' || actor.role === 'مسؤول';
    if (!isAdmin) {
      // Check explicit permissions array if available
      const hasExplicit = actor.permissions && actor.permissions.includes(requiredPermission);
      if (!hasExplicit) {
        throw new Error(`FORBIDDEN: User ${actor.actorName} lacks required permission: ${requiredPermission}`);
      }
    }
  }

  /**
   * 1. Grant Free Subscription, Plan, or Temporary Upgrade
   */
  public async grantSubscription(
    input: CreateSubscriptionGrantInput,
    actor: ActorContext
  ): Promise<ProviderAdminGrant> {
    this.checkPermission(actor, 'subscription.grant');

    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error('VALIDATION_ERROR: A clear mandatory reason is required for all admin grants');
    }

    const providerId = Number(input.providerId);
    if (!providerId || isNaN(providerId)) {
      throw new Error('VALIDATION_ERROR: Valid providerId is required');
    }

    // Resolve target plan
    let plan: SubscriptionPlan | null = null;
    if (input.planId) {
      plan = await SubscriptionPlan.findByPk(input.planId);
    }
    if (!plan && input.planName) {
      plan = await SubscriptionPlan.findOne({ where: { name: input.planName } });
    }

    if (!plan) {
      // Default to Pro if not specified
      plan = await SubscriptionPlan.findOne({ where: { name: 'الباقة الاحترافية' } });
    }

    const resolvedPlanName = plan?.name || input.planName || 'الباقة الاحترافية';
    const planPrice = Number(plan?.price || 0);

    return await this.runExclusive(providerId, async () => {
      const now = input.startsAt ? new Date(input.startsAt) : new Date();
      let expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

      if (!expiresAt && input.durationMonths) {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + Number(input.durationMonths));
      }

      // Calculate financial impact
      const months = input.durationMonths || (expiresAt ? Math.max(1, Math.round((expiresAt.getTime() - now.getTime()) / (30 * 24 * 3600 * 1000))) : 1);
      const listPrice = planPrice * months;
      const chargedAmount = 0; // Free grant
      const discountAmount = listPrice;
      const grantValue = input.financialImpact !== undefined ? Number(input.financialImpact) : listPrice;

      const grant = await sequelize.transaction(async (transaction) => {
        const newGrant = await ProviderAdminGrant.create({
          providerId,
          grantType: input.grantType,
          planId: plan?.id || null,
          planName: resolvedPlanName,
          featureKey: 'subscription_plan_access',
          featureName: resolvedPlanName,
          quantity: 1,
          value: 'true',
          startsAt: now,
          expiresAt,
          status: 'ACTIVE',
          reason: input.reason.trim(),
          internalNotes: input.internalNotes || '',
          grantedBy: actor.actorName,
          approvedBy: input.approvedBy || (actor.role === 'Admin' ? actor.actorName : null),
          campaignId: input.campaignId || null,
          financialImpact: grantValue,
          listPrice,
          chargedAmount,
          discountAmount,
          grantValue,
          currency: 'SAR',
          targetScope: 'SINGLE',
          metadata: JSON.stringify({
            planId: plan?.id,
            planName: resolvedPlanName,
            durationMonths: input.durationMonths,
            grantType: input.grantType
          })
        }, { transaction });

        // Record Audit Log
        const eventType = input.grantType === 'TEMPORARY_UPGRADE' 
          ? 'TEMPORARY_UPGRADE_STARTED' 
          : 'ADMIN_GRANT_CREATED';

        await this.entitlementService.logAuditEvent({
          providerId,
          eventType,
          source: input.grantType === 'TEMPORARY_UPGRADE' ? 'TEMPORARY_UPGRADE' : 'ADMIN_GRANT',
          actor: actor.actorName,
          reason: input.reason.trim(),
          newValue: resolvedPlanName,
          financialImpact: grantValue,
          metadata: {
            grantId: newGrant.id,
            grantType: input.grantType,
            planName: resolvedPlanName,
            startsAt: now.toISOString(),
            expiresAt: expiresAt ? expiresAt.toISOString() : null,
            durationMonths: input.durationMonths
          },
          transaction
        });

        return newGrant;
      });

      // Invalidate provider cache
      this.entitlementService.invalidateProviderCache(providerId);

      return grant;
    });
  }

  /**
   * 2. Grant Specific Feature, Promotional Entitlement, or Numeric Limit Increase
   */
  public async grantFeature(
    input: CreateFeatureGrantInput,
    actor: ActorContext
  ): Promise<ProviderAdminGrant> {
    this.checkPermission(actor, 'feature.grant');

    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error('VALIDATION_ERROR: A clear mandatory reason is required for all admin grants');
    }

    const providerId = Number(input.providerId);
    if (!providerId || isNaN(providerId)) {
      throw new Error('VALIDATION_ERROR: Valid providerId is required');
    }

    const normKey = normalizeFeatureKey(input.featureKey);
    const def = FEATURE_REGISTRY[normKey];
    const resolvedFeatureName = input.featureName || def?.nameAr || normKey;
    const isLimit = input.grantType === 'LIMIT_INCREASE' || def?.type === 'numeric_limit';
    const grantType: AdminGrantType = input.grantType || (isLimit ? 'LIMIT_INCREASE' : 'FEATURE');
    const quantity = Math.max(1, Number(input.quantity) || 1);
    const value = input.value || (isLimit ? String(quantity) : 'true');

    return await this.runExclusive(providerId, async () => {
      const now = input.startsAt ? new Date(input.startsAt) : new Date();
      let expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

      if (!expiresAt) {
        if (input.durationMonths) {
          expiresAt = new Date(now);
          expiresAt.setMonth(expiresAt.getMonth() + Number(input.durationMonths));
        } else if (input.durationDays) {
          expiresAt = new Date(now);
          expiresAt.setDate(expiresAt.getDate() + Number(input.durationDays));
        }
      }

      // Check if duplicate active boolean grant already exists
      if (grantType === 'FEATURE' || grantType === 'PROMOTIONAL_ENTITLEMENT') {
        const existing = await ProviderAdminGrant.findOne({
          where: {
            providerId,
            featureKey: normKey,
            status: 'ACTIVE',
            [Op.or]: [
              { expiresAt: null },
              { expiresAt: { [Op.gt]: now } }
            ]
          }
        });

        if (existing) {
          // Extend existing grant if new expiresAt is longer
          if (expiresAt && (!existing.expiresAt || expiresAt > existing.expiresAt)) {
            existing.expiresAt = expiresAt;
            existing.reason = input.reason.trim();
            existing.grantedBy = actor.actorName;
            await existing.save();
            this.entitlementService.invalidateProviderCache(providerId);
            return existing;
          }
          return existing;
        }
      }

      const listPrice = input.financialImpact !== undefined ? Number(input.financialImpact) : (isLimit ? quantity * 50 : 100);
      const chargedAmount = 0;
      const discountAmount = listPrice;
      const grantValue = listPrice;

      const grant = await sequelize.transaction(async (transaction) => {
        const newGrant = await ProviderAdminGrant.create({
          providerId,
          grantType,
          planId: null,
          planName: null,
          featureKey: normKey,
          featureName: resolvedFeatureName,
          quantity,
          value,
          startsAt: now,
          expiresAt,
          status: 'ACTIVE',
          reason: input.reason.trim(),
          internalNotes: input.internalNotes || '',
          grantedBy: actor.actorName,
          approvedBy: input.approvedBy || (actor.role === 'Admin' ? actor.actorName : null),
          campaignId: input.campaignId || null,
          financialImpact: grantValue,
          listPrice,
          chargedAmount,
          discountAmount,
          grantValue,
          currency: 'SAR',
          targetScope: 'SINGLE',
          metadata: JSON.stringify({
            featureKey: normKey,
            featureName: resolvedFeatureName,
            quantity,
            grantType
          })
        }, { transaction });

        const eventType = grantType === 'PROMOTIONAL_ENTITLEMENT'
          ? 'PROMOTION_APPLIED'
          : 'ADMIN_GRANT_CREATED';

        await this.entitlementService.logAuditEvent({
          providerId,
          eventType,
          featureKey: normKey,
          source: grantType === 'PROMOTIONAL_ENTITLEMENT' ? 'PROMOTION' : 'ADMIN_GRANT',
          actor: actor.actorName,
          reason: input.reason.trim(),
          newValue: value,
          financialImpact: grantValue,
          metadata: {
            grantId: newGrant.id,
            featureKey: normKey,
            quantity,
            grantType,
            expiresAt: expiresAt ? expiresAt.toISOString() : null
          },
          transaction
        });

        return newGrant;
      });

      this.entitlementService.invalidateProviderCache(providerId);

      return grant;
    });
  }

  /**
   * 3. Grant Percentage or Fixed Discount
   */
  public async grantDiscount(
    input: CreateDiscountGrantInput,
    actor: ActorContext
  ): Promise<ProviderAdminGrant> {
    this.checkPermission(actor, 'discount.grant');

    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error('VALIDATION_ERROR: A clear mandatory reason is required for all discount grants');
    }

    const providerId = Number(input.providerId);
    if (!providerId || isNaN(providerId)) {
      throw new Error('VALIDATION_ERROR: Valid providerId is required');
    }

    const discountVal = Number(input.discountValue);
    if (isNaN(discountVal) || discountVal <= 0) {
      throw new Error('VALIDATION_ERROR: Discount value must be greater than 0');
    }

    if (input.grantType === 'PERCENTAGE_DISCOUNT' && discountVal > 100) {
      throw new Error('VALIDATION_ERROR: Percentage discount cannot exceed 100%');
    }

    return await this.runExclusive(providerId, async () => {
      const now = input.startsAt ? new Date(input.startsAt) : new Date();
      let expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;

      if (!expiresAt && input.durationMonths) {
        expiresAt = new Date(now);
        expiresAt.setMonth(expiresAt.getMonth() + Number(input.durationMonths));
      }

      const valueStr = input.grantType === 'PERCENTAGE_DISCOUNT' ? `${discountVal}%` : `${discountVal} SAR`;
      const listPrice = input.listPrice || 399; // Default reference Pro plan list price
      const discountAmount = input.grantType === 'PERCENTAGE_DISCOUNT' 
        ? (listPrice * (discountVal / 100))
        : Math.min(listPrice, discountVal);
      const chargedAmount = Math.max(0, listPrice - discountAmount);
      const grantValue = discountAmount;

      const grant = await sequelize.transaction(async (transaction) => {
        const newGrant = await ProviderAdminGrant.create({
          providerId,
          grantType: input.grantType,
          planId: null,
          planName: null,
          featureKey: 'billing_discount',
          featureName: `خصم ${valueStr}`,
          quantity: 1,
          value: valueStr,
          startsAt: now,
          expiresAt,
          status: 'ACTIVE',
          reason: input.reason.trim(),
          internalNotes: input.internalNotes || '',
          grantedBy: actor.actorName,
          approvedBy: input.approvedBy || (actor.role === 'Admin' ? actor.actorName : null),
          campaignId: input.campaignId || null,
          financialImpact: grantValue,
          listPrice,
          chargedAmount,
          discountAmount,
          grantValue,
          currency: 'SAR',
          targetScope: 'SINGLE',
          metadata: JSON.stringify({
            grantType: input.grantType,
            discountValue: discountVal,
            valueStr
          })
        }, { transaction });

        await this.entitlementService.logAuditEvent({
          providerId,
          eventType: 'DISCOUNT_GRANTED',
          source: 'ADMIN_GRANT',
          actor: actor.actorName,
          reason: input.reason.trim(),
          newValue: valueStr,
          financialImpact: grantValue,
          metadata: {
            grantId: newGrant.id,
            discountValue: discountVal,
            grantType: input.grantType,
            expiresAt: expiresAt ? expiresAt.toISOString() : null
          },
          transaction
        });

        return newGrant;
      });

      this.entitlementService.invalidateProviderCache(providerId);

      return grant;
    });
  }

  /**
   * 4. Create Bulk Grant (Produces distinct auditable records for every targeted provider)
   */
  public async createBulkGrant(
    input: CreateBulkGrantInput,
    actor: ActorContext
  ): Promise<{ batchId: string; createdCount: number; grants: ProviderAdminGrant[] }> {
    this.checkPermission(actor, 'bulk_grant.create');

    if (!input.providerIds || !Array.isArray(input.providerIds) || input.providerIds.length === 0) {
      throw new Error('VALIDATION_ERROR: providerIds array is required for bulk grant');
    }

    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error('VALIDATION_ERROR: A clear mandatory reason is required for bulk grants');
    }

    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const randomHex = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const batchId = `BULK-${yearSuffix}-${randomHex}`;

    const createdGrants: ProviderAdminGrant[] = [];

    for (const pId of input.providerIds) {
      const providerId = Number(pId);
      if (!providerId || isNaN(providerId)) continue;

      if (input.grantType === 'FREE_SUBSCRIPTION' || input.grantType === 'PLAN' || input.grantType === 'TEMPORARY_UPGRADE') {
        const g = await this.grantSubscription({
          providerId,
          grantType: input.grantType,
          planId: input.planId,
          planName: input.planName,
          durationMonths: input.durationMonths,
          startsAt: input.startsAt,
          expiresAt: input.expiresAt,
          reason: `[${batchId}] ${input.reason.trim()}`,
          internalNotes: input.internalNotes,
          campaignId: input.campaignId,
          approvedBy: input.approvedBy,
          financialImpact: input.financialImpactPerProvider
        }, actor);
        g.bulkBatchId = batchId;
        g.targetScope = 'BULK';
        await g.save();
        createdGrants.push(g);
      } else if (input.grantType === 'PERCENTAGE_DISCOUNT' || input.grantType === 'FIXED_DISCOUNT') {
        const discountVal = Number(input.value?.replace(/[^0-9.]/g, '') || 20);
        const g = await this.grantDiscount({
          providerId,
          grantType: input.grantType,
          discountValue: discountVal,
          durationMonths: input.durationMonths,
          startsAt: input.startsAt,
          expiresAt: input.expiresAt,
          reason: `[${batchId}] ${input.reason.trim()}`,
          internalNotes: input.internalNotes,
          campaignId: input.campaignId,
          approvedBy: input.approvedBy
        }, actor);
        g.bulkBatchId = batchId;
        g.targetScope = 'BULK';
        await g.save();
        createdGrants.push(g);
      } else {
        const fGrantType: 'FEATURE' | 'LIMIT_INCREASE' | 'PROMOTIONAL_ENTITLEMENT' = 
          (input.grantType === 'LIMIT_INCREASE' || input.grantType === 'numeric_limit' || input.grantType === 'numeric_increment')
            ? 'LIMIT_INCREASE'
            : (input.grantType === 'PROMOTIONAL_ENTITLEMENT' ? 'PROMOTIONAL_ENTITLEMENT' : 'FEATURE');

        const g = await this.grantFeature({
          providerId,
          grantType: fGrantType,
          featureKey: input.featureKey || 'inventory_management',
          featureName: input.featureName,
          quantity: input.quantity,
          value: input.value,
          durationMonths: input.durationMonths,
          durationDays: input.durationDays,
          startsAt: input.startsAt,
          expiresAt: input.expiresAt,
          reason: `[${batchId}] ${input.reason.trim()}`,
          internalNotes: input.internalNotes,
          campaignId: input.campaignId,
          approvedBy: input.approvedBy,
          financialImpact: input.financialImpactPerProvider
        }, actor);
        g.bulkBatchId = batchId;
        g.targetScope = 'BULK';
        await g.save();
        createdGrants.push(g);
      }
    }

    // Record bulk audit log
    await this.entitlementService.logAuditEvent({
      providerId: 0, // 0 signifies platform-level / bulk action
      eventType: 'BULK_GRANT_CREATED',
      source: 'ADMIN_GRANT',
      actor: actor.actorName,
      reason: input.reason.trim(),
      financialImpact: (input.financialImpactPerProvider || 0) * createdGrants.length,
      metadata: {
        batchId,
        providerCount: createdGrants.length,
        grantType: input.grantType,
        providerIds: input.providerIds
      }
    });

    return {
      batchId,
      createdCount: createdGrants.length,
      grants: createdGrants
    };
  }

  /**
   * 5. Revoke Grant Non-Destructively
   * Mandatory: reason, revokedBy, revokedAt. Record is NEVER deleted.
   */
  public async revokeGrant(
    grantId: number,
    input: RevokeGrantInput,
    actor: ActorContext
  ): Promise<ProviderAdminGrant> {
    this.checkPermission(actor, 'grant.revoke');

    if (!input.reason || input.reason.trim().length === 0) {
      throw new Error('VALIDATION_ERROR: Mandatory reason is required to revoke an admin grant');
    }

    const grant = await ProviderAdminGrant.findByPk(grantId);
    if (!grant) {
      throw new Error(`NOT_FOUND: Admin grant with ID ${grantId} does not exist`);
    }

    const providerId = grant.providerId;

    return await this.runExclusive(providerId, async () => {
      const revokedGrant = await sequelize.transaction(async (transaction) => {
        const fresh = await ProviderAdminGrant.findByPk(grantId, { transaction });
        if (!fresh) throw new Error('Grant not found');

        const oldStatus = fresh.status;
        fresh.status = 'REVOKED';
        fresh.revokedAt = new Date();
        fresh.revokedBy = actor.actorName;
        fresh.internalNotes = fresh.internalNotes 
          ? `${fresh.internalNotes} | Revoke reason: ${input.reason.trim()}`
          : `Revoke reason: ${input.reason.trim()}`;
        fresh.version = (fresh.version || 1) + 1;

        await fresh.save({ transaction });

        await this.entitlementService.logAuditEvent({
          providerId,
          eventType: 'ADMIN_GRANT_REVOKED',
          featureKey: fresh.featureKey || null,
          source: 'ADMIN_GRANT',
          actor: actor.actorName,
          reason: input.reason.trim(),
          oldValue: oldStatus,
          newValue: 'REVOKED',
          financialImpact: 0,
          metadata: {
            grantId: fresh.id,
            grantType: fresh.grantType,
            featureKey: fresh.featureKey,
            planName: fresh.planName,
            revokedAt: fresh.revokedAt.toISOString()
          },
          transaction
        });

        return fresh;
      });

      // Invalidate cache and recalculate effective entitlements immediately
      this.entitlementService.invalidateProviderCache(providerId);

      return revokedGrant;
    });
  }

  /**
   * 6. Periodic Expiration Processor
   * Checks for expired grants and safely transitions status to EXPIRED.
   * Invariant: Never deletes provider data; limits revert to standard non-destructively.
   */
  public async processExpiredGrants(): Promise<{ expiredCount: number; processedIds: number[] }> {
    const now = new Date();
    const expiredGrants = await ProviderAdminGrant.findAll({
      where: {
        status: { [Op.in]: ['ACTIVE', 'active'] },
        expiresAt: {
          [Op.ne]: null,
          [Op.lte]: now
        }
      }
    });

    const processedIds: number[] = [];

    for (const grant of expiredGrants) {
      await this.runExclusive(grant.providerId, async () => {
        await sequelize.transaction(async (transaction) => {
          const fresh = await ProviderAdminGrant.findByPk(grant.id, { transaction });
          if (!fresh || (fresh.status !== 'ACTIVE' && fresh.status !== 'active')) return;

          fresh.status = 'EXPIRED';
          fresh.version = (fresh.version || 1) + 1;
          await fresh.save({ transaction });

          let eventType: any = 'ADMIN_GRANT_EXPIRED';
          if (fresh.grantType === 'TEMPORARY_UPGRADE') {
            eventType = 'TEMPORARY_UPGRADE_ENDED';
          } else if (fresh.grantType === 'PERCENTAGE_DISCOUNT' || fresh.grantType === 'FIXED_DISCOUNT') {
            eventType = 'DISCOUNT_EXPIRED';
          }

          await this.entitlementService.logAuditEvent({
            providerId: fresh.providerId,
            eventType,
            featureKey: fresh.featureKey || null,
            source: 'ADMIN_GRANT',
            actor: 'SystemCron',
            reason: 'Grant reached scheduled expiry date',
            oldValue: 'ACTIVE',
            newValue: 'EXPIRED',
            financialImpact: 0,
            metadata: {
              grantId: fresh.id,
              grantType: fresh.grantType,
              planName: fresh.planName,
              featureKey: fresh.featureKey,
              expiredAt: now.toISOString()
            },
            transaction
          });

          processedIds.push(fresh.id);
        });

        this.entitlementService.invalidateProviderCache(grant.providerId);
      });
    }

    return {
      expiredCount: processedIds.length,
      processedIds
    };
  }

  /**
   * List grants for a provider or all grants (for admin console)
   */
  public async listGrants(filter: {
    providerId?: number;
    status?: string;
    grantType?: string;
    campaignId?: string;
  } = {}): Promise<ProviderAdminGrant[]> {
    const where: any = {};
    if (filter.providerId) where.providerId = filter.providerId;
    if (filter.status) where.status = filter.status;
    if (filter.grantType) where.grantType = filter.grantType;
    if (filter.campaignId) where.campaignId = filter.campaignId;

    return await ProviderAdminGrant.findAll({
      where,
      order: [['id', 'DESC']]
    });
  }

  /**
   * Helper alias for creating feature or subscription grants
   */
  public async createGrant(input: {
    providerId: number;
    featureKey?: string;
    planId?: number;
    planName?: string;
    grantType?: 'FEATURE' | 'FREE_SUBSCRIPTION' | 'PLAN' | 'TEMPORARY_UPGRADE' | 'LIMIT_INCREASE' | 'PROMOTIONAL_ENTITLEMENT';
    durationMonths?: number;
    durationDays?: number;
    startsAt?: Date;
    expiresAt?: Date | null;
    reason: string;
    actor?: string;
  }): Promise<ProviderAdminGrant> {
    const actorContext: ActorContext = {
      actorName: input.actor || 'Admin',
      role: 'Admin'
    };

    if (input.grantType === 'FREE_SUBSCRIPTION' || input.grantType === 'PLAN' || input.grantType === 'TEMPORARY_UPGRADE') {
      return await this.grantSubscription({
        providerId: input.providerId,
        grantType: input.grantType,
        planId: input.planId,
        planName: input.planName,
        durationMonths: input.durationMonths,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        reason: input.reason
      }, actorContext);
    } else {
      return await this.grantFeature({
        providerId: input.providerId,
        featureKey: input.featureKey || 'dynamic_surge_pricing',
        grantType: (input.grantType as any) || 'FEATURE',
        durationMonths: input.durationMonths,
        durationDays: input.durationDays,
        startsAt: input.startsAt,
        expiresAt: input.expiresAt,
        reason: input.reason
      }, actorContext);
    }
  }

  /**
   * Helper alias for revoking a grant with default admin context
   */
  public async revokeGrantSimple(grantId: number, reason: string, actor: string = 'Admin'): Promise<ProviderAdminGrant> {
    return await this.revokeGrant(grantId, { reason }, { actorName: actor, role: 'Admin' });
  }
}

export const adminGrantService = AdminGrantService.getInstance();

