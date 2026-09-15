/**
 * @file effectiveEntitlementService.ts
 * @description Centralized Backend Effective Entitlement Engine for Lailah Platform.
 * 
 * Single Source of Truth for all Provider Capabilities, Addons, Admin Grants,
 * Numeric Resource Limits, Downgrade Policies, and Audit Logging.
 * 
 * STRICT RULE: Default policy = DENY.
 * PRECEDENCE:
 * 1. OVERRIDE
 * 2. TEMPORARY_UPGRADE
 * 3. PROMOTION
 * 4. ADMIN_GRANT
 * 5. ADDON
 * 6. PLAN
 * 7. DEFAULT_DENY
 */

import { Op } from 'sequelize';
import {
  SubscriptionPlan,
  ProviderSubscription,
  ProviderFeatureOverride,
  ProviderAddon,
  ProviderAdminGrant,
  EntitlementAuditLog,
  EntitlementAuditEventType,
  migrateSubscriptionTables,
  SubscriptionLifecycleStatus,
  SubscriptionPaymentStatus
} from '../../models/SubscriptionModels.js';
import { Hall, Service } from '../../models/BookingModels.js';
import { User } from '../../models/UserModels.js';
import {
  FEATURE_KEYS,
  FEATURE_REGISTRY,
  FeatureKey,
  normalizeFeatureKey,
  getFeatureDefinition
} from './featureRegistry.js';
import { SubscriptionStateMachine } from '../subscription/subscriptionStateMachine.js';

export type LimitStatus = 'WITHIN_LIMIT' | 'AT_LIMIT' | 'OVER_LIMIT' | 'UNLIMITED';

export interface LimitDetails {
  key: string;
  nameAr: string;
  limit: number | null; // null represents unlimited
  used: number;
  remaining: number | null;
  status: LimitStatus;
  unitAr: string;
  source: string;
}

export interface EffectiveFeatureResolution {
  key: string;
  nameAr: string;
  enabled: boolean;
  source: 'PLAN' | 'ADDON' | 'ADMIN_GRANT' | 'PROMOTION' | 'TEMPORARY_UPGRADE' | 'OVERRIDE' | 'DEFAULT_DENY';
  expiresAt: string | null;
  category: string;
  reason?: string;
  notes?: string;
}

export interface ProviderEffectiveEntitlements {
  providerId: number;
  providerEmail?: string;
  activePlan: {
    id: number | null;
    name: string;
    status: string;
    subscriptionStatus: SubscriptionLifecycleStatus;
    paymentStatus: SubscriptionPaymentStatus;
    billingCycle?: string;
    startDate: string | null;
    endDate: string | null;
    gracePeriodEnd?: string | null;
    nextBillingDate?: string | null;
    scheduledPlanName?: string | null;
    isCustom: boolean;
  };
  features: Record<string, boolean>; // key -> boolean
  featureDetails: Record<string, EffectiveFeatureResolution>;
  limits: Record<string, LimitDetails>;
  activeAddons: Array<{
    id: number;
    featureKey: string;
    featureName: string;
    pricePaid: number;
    startsAt: string;
    expiresAt: string | null;
  }>;
  activeGrants: Array<{
    id: number;
    featureKey: string;
    featureName: string;
    grantType: string;
    value: string;
    reason: string;
    grantedBy: string;
    startsAt: string;
    expiresAt: string | null;
  }>;
  entitlementVersion: number;
  generatedAt: string;
}

export class EffectiveEntitlementService {
  private static instance: EffectiveEntitlementService;

  // In-memory version tracker for provider cache invalidation
  private providerVersions: Map<number, number> = new Map();
  // Short-lived cache (30 seconds)
  private cache: Map<number, { data: ProviderEffectiveEntitlements; expires: number; version: number }> = new Map();
  // Concurrency in-flight reservations per provider and limitKey
  private inFlightReservations: Map<string, number> = new Map();
  // Mutex lock queue per provider and limitKey for atomic check-and-reserve
  private lockQueues: Map<string, Promise<void>> = new Map();

  private constructor() {}

  public static getInstance(): EffectiveEntitlementService {
    if (!EffectiveEntitlementService.instance) {
      EffectiveEntitlementService.instance = new EffectiveEntitlementService();
    }
    return EffectiveEntitlementService.instance;
  }

  /**
   * Helper to execute an async action exclusively per provider and limitKey
   */
  private async runExclusive<T>(key: string, action: () => Promise<T>): Promise<T> {
    const currentLock = this.lockQueues.get(key) || Promise.resolve();
    let releaseLock: () => void;
    const nextLock = new Promise<void>((resolve) => {
      releaseLock = resolve;
    });
    this.lockQueues.set(key, currentLock.then(() => nextLock));

    try {
      await currentLock;
      return await action();
    } finally {
      releaseLock!();
      if (this.lockQueues.get(key) === nextLock) {
        this.lockQueues.delete(key);
      }
    }
  }

  /**
   * Increments provider entitlement version to invalidate cache instantly
   */
  public invalidateProviderCache(providerId: number): void {
    const currentVersion = this.providerVersions.get(providerId) || 1;
    this.providerVersions.set(providerId, currentVersion + 1);
    this.cache.delete(providerId);
  }

  public getProviderVersion(providerId: number): number {
    return this.providerVersions.get(providerId) || 1;
  }

  /**
   * Logs an entitlement audit event to database
   */
  public async logAuditEvent(event: {
    providerId: number;
    providerEmail?: string;
    eventType: EntitlementAuditEventType;
    featureKey?: string;
    source?: 'PLAN' | 'ADDON' | 'ADMIN_GRANT' | 'PROMOTION' | 'TEMPORARY_UPGRADE' | 'OVERRIDE' | 'DEFAULT_DENY' | 'SYSTEM';
    actor?: string;
    reason?: string;
    oldValue?: string;
    newValue?: string;
    financialImpact?: number;
    metadata?: Record<string, any>;
    transaction?: any;
  }): Promise<void> {
    try {
      await EntitlementAuditLog.create({
        providerId: event.providerId,
        providerEmail: event.providerEmail || '',
        eventType: event.eventType,
        featureKey: event.featureKey ? normalizeFeatureKey(event.featureKey) : null,
        source: event.source || 'SYSTEM',
        actor: event.actor || 'System',
        reason: event.reason || '',
        oldValue: event.oldValue !== undefined ? String(event.oldValue) : null,
        newValue: event.newValue !== undefined ? String(event.newValue) : null,
        financialImpact: event.financialImpact || 0,
        metadata: JSON.stringify({
          ...(event.metadata || {}),
          timestamp: new Date().toISOString()
        })
      }, event.transaction ? { transaction: event.transaction } : undefined);
    } catch (err: any) {
      console.error('[EntitlementAuditLog] Failed to record log:', err.message);
    }
  }

  /**
   * Fetches actual resource usage for a provider from the database
   */
  public async getResourceUsage(providerId: number): Promise<{
    hallsUsed: number;
    servicesUsed: number;
    staffUsed: number;
    subAccountsUsed: number;
  }> {
    try {
      const [hallsCount, servicesCount] = await Promise.all([
        Hall.count({
          where: {
            providerId: providerId
          }
        }),
        Service.count({
          where: {
            providerId: providerId
          }
        })
      ]);

      // Count staff/sub-accounts if relevant models exist, or count user employees
      let staffCount = 0;
      try {
        staffCount = await User.count({
          where: {
            // Associated staff or employees
            [Op.or]: [
              { role: 'موظف' },
              { role: 'مشرف' },
              { role: 'Employee' }
            ]
          }
        });
      } catch {
        staffCount = 0;
      }

      return {
        hallsUsed: hallsCount,
        servicesUsed: servicesCount,
        staffUsed: staffCount,
        subAccountsUsed: staffCount
      };
    } catch (err: any) {
      console.error(`[EffectiveEntitlementService] Error querying usage for provider ${providerId}:`, err.message);
      return {
        hallsUsed: 0,
        servicesUsed: 0,
        staffUsed: 0,
        subAccountsUsed: 0
      };
    }
  }

  /**
   * Computes effective entitlements by combining Base Plan, Add-ons, Admin Grants, and Overrides
   */
  public async getEffectiveEntitlements(providerId: number, bypassCache = false): Promise<ProviderEffectiveEntitlements> {
    const pId = Number(providerId);
    const now = new Date();
    const currentVersion = this.getProviderVersion(pId);

    // 1. Check cache
    if (!bypassCache) {
      const cached = this.cache.get(pId);
      if (cached && cached.expires > Date.now() && cached.version === currentVersion) {
        return cached.data;
      }
    }

    const fetchOverrides = async () => {
      try {
        return await ProviderFeatureOverride.findAll({
          where: { providerId: pId }
        });
      } catch (err: any) {
        if (err.message && err.message.includes('no such column')) {
          await migrateSubscriptionTables();
          return ProviderFeatureOverride.findAll({
            where: { providerId: pId }
          });
        }
        return [];
      }
    };

    const fetchSubscription = async () => {
      try {
        return await ProviderSubscription.findOne({
          where: { providerId: pId },
          order: [['id', 'DESC']]
        });
      } catch (err: any) {
        if (err.message && err.message.includes('no such column')) {
          await migrateSubscriptionTables();
          return await ProviderSubscription.findOne({
            where: { providerId: pId },
            order: [['id', 'DESC']]
          });
        }
        throw err;
      }
    };

    // 2. Load provider subscription, plan, overrides, addons, grants, and resource usage concurrently
    const [subscription, overrides, addons, grants, usage] = await Promise.all([
      fetchSubscription(),
      fetchOverrides(),
      ProviderAddon.findAll({
        where: {
          providerId: pId,
          [Op.or]: [
            { addonStatus: { [Op.in]: ['ACTIVE', 'RENEWAL_DUE', 'GRACE_PERIOD'] } },
            { 
              addonStatus: null,
              status: 'active'
            }
          ],
          paymentStatus: { [Op.in]: ['PAID', 'WAIVED', 'OVERDUE'] },
          startsAt: { [Op.lte]: now },
          [Op.and]: [
            {
              [Op.or]: [
                { expiresAt: null },
                { expiresAt: { [Op.gt]: now } }
              ]
            }
          ]
        }
      }).catch(() => []),
      ProviderAdminGrant.findAll({
        where: {
          providerId: pId,
          status: { [Op.in]: ['ACTIVE', 'active'] },
          startsAt: { [Op.lte]: now },
          [Op.and]: [
            {
              [Op.or]: [
                { expiresAt: null },
                { expiresAt: { [Op.gt]: now } }
              ]
            }
          ]
        }
      }).catch(() => []),
      this.getResourceUsage(pId)
    ]);

    // 3. Resolve active plan details & base plan features
    let planFeatures: Record<string, any> = {};
    const lifecycleStatus: SubscriptionLifecycleStatus = subscription?.subscriptionStatus || (subscription?.status === 'active' ? 'ACTIVE' : 'EXPIRED');
    const isPlanActive = subscription ? SubscriptionStateMachine.canAccessFullFeatures(lifecycleStatus) : false;

    // Check for Plan-level Admin Grants (TEMPORARY_UPGRADE, FREE_SUBSCRIPTION, PLAN)
    const activePlanGrant = grants.find(g => 
      ['TEMPORARY_UPGRADE', 'FREE_SUBSCRIPTION', 'PLAN'].includes(g.grantType) &&
      (g.status === 'ACTIVE' || g.status === 'active')
    );

    let activePlanInfo = {
      id: null as number | null,
      name: 'الباقة الأساسية (افتراضية)',
      status: 'active',
      subscriptionStatus: (subscription?.subscriptionStatus || 'ACTIVE') as SubscriptionLifecycleStatus,
      paymentStatus: (subscription?.paymentStatus || 'PAID') as SubscriptionPaymentStatus,
      billingCycle: subscription?.billingCycle || 'MONTHLY',
      startDate: null as string | null,
      endDate: null as string | null,
      gracePeriodEnd: null as string | null,
      nextBillingDate: null as string | null,
      scheduledPlanName: null as string | null,
      isCustom: false
    };

    let basePlanRecord: SubscriptionPlan | null = null;
    let parsedBaseFeatures: Record<string, any> = {};

    if (subscription) {
      activePlanInfo = {
        id: subscription.planId || null,
        name: subscription.planName,
        status: subscription.status,
        subscriptionStatus: lifecycleStatus,
        paymentStatus: subscription.paymentStatus || 'PAID',
        billingCycle: subscription.billingCycle || 'MONTHLY',
        startDate: subscription.startDate ? subscription.startDate.toISOString() : null,
        endDate: subscription.endDate ? subscription.endDate.toISOString() : null,
        gracePeriodEnd: subscription.gracePeriodEnd ? subscription.gracePeriodEnd.toISOString() : null,
        nextBillingDate: subscription.nextBillingDate ? subscription.nextBillingDate.toISOString() : null,
        scheduledPlanName: subscription.scheduledPlanName || null,
        isCustom: subscription.isCustom
      };

      if (isPlanActive) {
        if (subscription.planId) {
          basePlanRecord = await SubscriptionPlan.findByPk(subscription.planId);
        }
        if (!basePlanRecord && subscription.planName) {
          basePlanRecord = await SubscriptionPlan.findOne({ where: { name: subscription.planName } });
        }

        if (basePlanRecord && basePlanRecord.features) {
          try {
            parsedBaseFeatures = typeof basePlanRecord.features === 'string'
              ? JSON.parse(basePlanRecord.features)
              : basePlanRecord.features;
          } catch {
            parsedBaseFeatures = {};
          }
          planFeatures = { ...parsedBaseFeatures };
        }
      } else {
        planFeatures = {};
      }
    } else {
      const defaultPlan = await SubscriptionPlan.findOne({ where: { name: 'الباقة الأساسية' } });
      if (defaultPlan && defaultPlan.features) {
        try {
          parsedBaseFeatures = typeof defaultPlan.features === 'string'
            ? JSON.parse(defaultPlan.features)
            : defaultPlan.features;
        } catch {
          parsedBaseFeatures = {};
        }
        planFeatures = { ...parsedBaseFeatures };
      }
    }

    // Elevate plan if activePlanGrant is present
    let grantedPlanFeatures: Record<string, any> = {};
    if (activePlanGrant) {
      let grantedPlan: SubscriptionPlan | null = null;
      if (activePlanGrant.planId) {
        grantedPlan = await SubscriptionPlan.findByPk(activePlanGrant.planId);
      }
      if (!grantedPlan && activePlanGrant.planName) {
        grantedPlan = await SubscriptionPlan.findOne({ where: { name: activePlanGrant.planName } });
      }
      if (!grantedPlan) {
        grantedPlan = await SubscriptionPlan.findOne({ where: { name: 'الباقة الاحترافية' } });
      }

      if (grantedPlan && grantedPlan.features) {
        try {
          grantedPlanFeatures = typeof grantedPlan.features === 'string'
            ? JSON.parse(grantedPlan.features)
            : grantedPlan.features;
        } catch {
          grantedPlanFeatures = {};
        }

        // Merge higher granted features into planFeatures
        const basePrice = Number(basePlanRecord?.price || 0);
        const grantPrice = Number(grantedPlan.price || 0);

        // If provider has no active high paid plan or granted plan is higher/equal tier
        if (!isPlanActive || grantPrice >= basePrice) {
          const grantTypeLabel = activePlanGrant.grantType === 'TEMPORARY_UPGRADE' 
            ? 'ترقية مؤقتة' 
            : 'منحة إدارية';
          activePlanInfo.name = `${grantedPlan.name} (${grantTypeLabel})`;
          activePlanInfo.isCustom = true;
          activePlanInfo.endDate = activePlanGrant.expiresAt ? activePlanGrant.expiresAt.toISOString() : activePlanInfo.endDate;
          planFeatures = { ...planFeatures, ...grantedPlanFeatures };
        }
      }
    }

    // 4. Initialize Feature Resolution Map with Default Deny
    const featureDetails: Record<string, EffectiveFeatureResolution> = {};
    const booleanFeatures: Record<string, boolean> = {};

    // Populate all known features from Registry first
    for (const [key, def] of Object.entries(FEATURE_REGISTRY)) {
      if (def.type === 'boolean') {
        const normKey = normalizeFeatureKey(key);
        featureDetails[normKey] = {
          key: normKey,
          nameAr: def.nameAr,
          enabled: false, // Default Deny
          source: 'DEFAULT_DENY',
          expiresAt: null,
          category: def.category
        };
        booleanFeatures[normKey] = false;
      }
    }

    // 5. Layer 1: Apply Base Plan & Granted Plan Features
    for (const [planKey, planVal] of Object.entries(planFeatures)) {
      const normKey = normalizeFeatureKey(planKey);
      const def = FEATURE_REGISTRY[normKey];
      if (def && def.type === 'boolean') {
        const isEnabled = Boolean(planVal === true || planVal === 'true' || planVal === 1);
        const isFromGrant = activePlanGrant && Boolean(grantedPlanFeatures[planKey]) && !Boolean(parsedBaseFeatures[planKey]);
        const source = isEnabled 
          ? (isFromGrant 
              ? (activePlanGrant.grantType === 'TEMPORARY_UPGRADE' ? 'TEMPORARY_UPGRADE' : 'ADMIN_GRANT') 
              : 'PLAN') 
          : 'DEFAULT_DENY';

        featureDetails[normKey] = {
          key: normKey,
          nameAr: def.nameAr,
          enabled: isEnabled,
          source,
          expiresAt: isFromGrant ? (activePlanGrant?.expiresAt ? activePlanGrant.expiresAt.toISOString() : null) : activePlanInfo.endDate,
          category: def.category
        };
        booleanFeatures[normKey] = isEnabled;
      }
    }

    // 6. Layer 2: Apply Active Add-ons
    const activeAddonList: any[] = [];
    for (const addon of addons) {
      const normKey = normalizeFeatureKey(addon.featureKey);
      const def = FEATURE_REGISTRY[normKey];
      const quantity = Math.max(1, Number(addon.quantity) || 1);
      activeAddonList.push({
        id: addon.id,
        featureKey: normKey,
        featureName: addon.featureName || (def?.nameAr || normKey),
        quantity,
        pricePaid: Number(addon.pricePaid || 0),
        billingCycle: addon.billingCycle || 'MONTHLY',
        addonStatus: addon.addonStatus || 'ACTIVE',
        paymentStatus: addon.paymentStatus || 'PAID',
        startsAt: addon.startsAt ? addon.startsAt.toISOString() : new Date().toISOString(),
        expiresAt: addon.expiresAt ? addon.expiresAt.toISOString() : null
      });

      if (def && def.type === 'boolean') {
        featureDetails[normKey] = {
          key: normKey,
          nameAr: def.nameAr,
          enabled: true,
          source: 'ADDON',
          expiresAt: addon.expiresAt ? addon.expiresAt.toISOString() : null,
          category: def.category,
          notes: addon.notes
        };
        booleanFeatures[normKey] = true;
      }
    }

    // 7. Layer 3: Apply Active Admin Grants & Promotional Entitlements
    const activeGrantList: any[] = [];
    for (const grant of grants) {
      const normKey = grant.featureKey ? normalizeFeatureKey(grant.featureKey) : '';
      const def = normKey ? FEATURE_REGISTRY[normKey] : null;
      activeGrantList.push({
        id: grant.id,
        grantType: grant.grantType,
        planName: grant.planName,
        featureKey: normKey || null,
        featureName: grant.featureName || (def?.nameAr || normKey) || grant.planName || grant.grantType,
        quantity: Number(grant.quantity) || 1,
        value: grant.value,
        reason: grant.reason,
        grantedBy: grant.grantedBy,
        campaignId: grant.campaignId,
        financialImpact: Number(grant.financialImpact || 0),
        startsAt: grant.startsAt ? grant.startsAt.toISOString() : new Date().toISOString(),
        expiresAt: grant.expiresAt ? grant.expiresAt.toISOString() : null,
        status: grant.status
      });

      if (normKey && (grant.grantType === 'FEATURE' || grant.grantType === 'PROMOTIONAL_ENTITLEMENT' || grant.grantType === 'boolean' || (def && def.type === 'boolean'))) {
        const isGranted = grant.value === 'true' || grant.value === '1' || String(grant.value) === 'true';
        if (isGranted) {
          const source = grant.grantType === 'PROMOTIONAL_ENTITLEMENT' ? 'PROMOTION' : 'ADMIN_GRANT';
          featureDetails[normKey] = {
            key: normKey,
            nameAr: def ? def.nameAr : normKey,
            enabled: true,
            source,
            expiresAt: grant.expiresAt ? grant.expiresAt.toISOString() : null,
            category: def ? def.category : 'addons',
            reason: grant.reason
          };
          booleanFeatures[normKey] = true;
        }
      }
    }

    // 8. Layer 4: Apply Explicit Overrides (Highest Precedence)
    for (const override of overrides) {
      if (override.expiresAt && new Date(override.expiresAt) <= now) {
        continue;
      }
      const normKey = normalizeFeatureKey(override.featureKey);
      const def = FEATURE_REGISTRY[normKey];

      if (override.overrideType === 'grant' || (def && def.type === 'boolean')) {
        const isEnabled = Boolean(override.isGranted && (override.value === 'true' || override.value === '1' || String(override.value) === 'true'));
        featureDetails[normKey] = {
          key: normKey,
          nameAr: def ? def.nameAr : normKey,
          enabled: isEnabled,
          source: 'OVERRIDE',
          expiresAt: override.expiresAt ? override.expiresAt.toISOString() : null,
          category: def ? def.category : 'core',
          reason: override.reason,
          notes: override.notes
        };
        booleanFeatures[normKey] = isEnabled;
      }
    }

    // 9. Compute Numeric Limits (Halls, Services, Staff Seats, Sub-accounts)
    const limits: Record<string, LimitDetails> = {};

    // Helper for computing individual numeric limit
    const computeNumericLimit = (
      limitKey: string,
      currentUsage: number,
      fallbackDefault: number
    ): LimitDetails => {
      const def = FEATURE_REGISTRY[limitKey];
      let baseLimit = fallbackDefault;
      let limitSource = 'PLAN';

      // 1. Base Plan limit
      const rawPlanLimit = planFeatures[limitKey] ?? (limitKey === 'max_halls' ? planFeatures['hallsLimit'] : limitKey === 'max_services' ? planFeatures['servicesLimit'] : limitKey === 'staff_seats' ? planFeatures['staffSeatsLimit'] : planFeatures[limitKey.replace('_', '')]);
      if (rawPlanLimit !== undefined && rawPlanLimit !== null) {
        if (rawPlanLimit === 'unlimited' || rawPlanLimit === 'UNLIMITED' || rawPlanLimit === -1 || rawPlanLimit === 'infinity') {
          baseLimit = 9999;
        } else {
          const parsed = Number(rawPlanLimit);
          if (!isNaN(parsed)) {
            baseLimit = parsed;
          }
        }
      }

      // 2. Add-on increments
      for (const addon of addons) {
        if (normalizeFeatureKey(addon.featureKey) === limitKey) {
          // Addon quantity increment
          const qty = Math.max(1, Number(addon.quantity) || 1);
          baseLimit += qty;
          limitSource = 'ADDON';
        }
      }

      // 3. Admin Grants increments / replacements / promotions
      for (const grant of grants) {
        if (grant.featureKey && normalizeFeatureKey(grant.featureKey) === limitKey) {
          const qty = Number(grant.quantity) || 1;
          const val = Number(grant.value);
          const inc = (!isNaN(val) && val > 0) ? val : qty;

          if (grant.grantType === 'LIMIT_INCREASE' || grant.grantType === 'numeric_increment' || grant.grantType === 'PROMOTIONAL_ENTITLEMENT') {
            baseLimit += inc;
            limitSource = grant.grantType === 'PROMOTIONAL_ENTITLEMENT' ? 'PROMOTION' : 'ADMIN_GRANT';
          } else if (grant.grantType === 'numeric_limit' && !isNaN(val)) {
            baseLimit = Math.max(baseLimit, val);
            limitSource = 'ADMIN_GRANT';
          }
        }
      }

      // 4. Overrides
      for (const override of overrides) {
        if (override.expiresAt && new Date(override.expiresAt) <= now) continue;
        if (normalizeFeatureKey(override.featureKey) === limitKey) {
          const val = Number(override.value);
          if (!isNaN(val)) {
            if (override.overrideType === 'increment') {
              baseLimit += val;
            } else if (override.overrideType === 'replace') {
              baseLimit = val;
            }
            limitSource = 'OVERRIDE';
          }
        }
      }

      const isUnlimited = baseLimit >= 9999 || baseLimit === -1;
      const effectiveLimit = isUnlimited ? null : baseLimit;
      const remaining = isUnlimited ? null : Math.max(0, effectiveLimit! - currentUsage);

      let status: LimitStatus = 'WITHIN_LIMIT';
      if (isUnlimited) {
        status = 'UNLIMITED';
      } else if (currentUsage > effectiveLimit!) {
        status = 'OVER_LIMIT'; // Occurs on non-destructive downgrade
      } else if (currentUsage === effectiveLimit!) {
        status = 'AT_LIMIT';
      } else {
        status = 'WITHIN_LIMIT';
      }

      return {
        key: limitKey,
        nameAr: def?.nameAr || limitKey,
        limit: effectiveLimit,
        used: currentUsage,
        remaining,
        status,
        unitAr: def?.unitAr || 'وحدة',
        source: limitSource
      };
    };

    limits[FEATURE_KEYS.MAX_HALLS] = computeNumericLimit(
      FEATURE_KEYS.MAX_HALLS,
      usage.hallsUsed,
      FEATURE_REGISTRY[FEATURE_KEYS.MAX_HALLS]?.defaultValue as number || 1
    );

    limits[FEATURE_KEYS.MAX_SERVICES] = computeNumericLimit(
      FEATURE_KEYS.MAX_SERVICES,
      usage.servicesUsed,
      FEATURE_REGISTRY[FEATURE_KEYS.MAX_SERVICES]?.defaultValue as number || 5
    );

    limits[FEATURE_KEYS.STAFF_SEATS] = computeNumericLimit(
      FEATURE_KEYS.STAFF_SEATS,
      usage.staffUsed,
      FEATURE_REGISTRY[FEATURE_KEYS.STAFF_SEATS]?.defaultValue as number || 0
    );

    limits[FEATURE_KEYS.SUB_ACCOUNTS] = computeNumericLimit(
      FEATURE_KEYS.SUB_ACCOUNTS,
      usage.subAccountsUsed,
      FEATURE_REGISTRY[FEATURE_KEYS.SUB_ACCOUNTS]?.defaultValue as number || 0
    );

    const result: ProviderEffectiveEntitlements = {
      providerId: pId,
      activePlan: activePlanInfo,
      features: booleanFeatures,
      featureDetails,
      limits,
      activeAddons: activeAddonList,
      activeGrants: activeGrantList,
      entitlementVersion: currentVersion,
      generatedAt: new Date().toISOString()
    };

    // Store in cache
    this.cache.set(pId, {
      data: result,
      expires: Date.now() + 30000, // 30s cache
      version: currentVersion
    });

    return result;
  }

  /**
   * Fast check for whether a provider has access to a specific boolean feature
   */
  public async checkFeature(providerId: number, featureKey: string): Promise<{
    allowed: boolean;
    source: string;
    featureKey: string;
    details?: EffectiveFeatureResolution;
  }> {
    const normKey = normalizeFeatureKey(featureKey);
    const entitlements = await this.getEffectiveEntitlements(providerId);
    
    const details = entitlements.featureDetails[normKey];
    const allowed = Boolean(details?.enabled);

    return {
      allowed,
      source: details?.source || 'DEFAULT_DENY',
      featureKey: normKey,
      details
    };
  }

  /**
   * Check if a provider has capacity to create/consume an additional resource limit
   */
  public async checkLimit(
    providerId: number,
    limitKey: string,
    incrementNeeded: number = 1
  ): Promise<{
    allowed: boolean;
    limit: number | null;
    used: number;
    remaining: number | null;
    status: LimitStatus;
    limitKey: string;
    messageAr?: string;
  }> {
    const normKey = normalizeFeatureKey(limitKey);
    const entitlements = await this.getEffectiveEntitlements(providerId, true); // bypass cache to get fresh count
    const limitObj = entitlements.limits[normKey];

    if (!limitObj) {
      return {
        allowed: false,
        limit: 0,
        used: 0,
        remaining: 0,
        status: 'OVER_LIMIT',
        limitKey: normKey,
        messageAr: 'الحد المطلوب غير معرف في سجل النظام'
      };
    }

    if (limitObj.limit === null) {
      // Unlimited
      return {
        allowed: true,
        limit: null,
        used: limitObj.used,
        remaining: null,
        status: 'UNLIMITED',
        limitKey: normKey
      };
    }

    const projectedUsage = limitObj.used + incrementNeeded;
    const allowed = projectedUsage <= limitObj.limit;

    let messageAr = '';
    if (!allowed) {
      if (limitObj.status === 'OVER_LIMIT') {
        messageAr = `تم تجاوز الحد المسموح به (${limitObj.limit} ${limitObj.unitAr}). لديك حالياً ${limitObj.used} مسجلة. يرجى الترقية لإضافة المزيد.`;
      } else {
        messageAr = `لقد بلغت الحد الأقصى المسموح به للباقة الحالية (${limitObj.limit} ${limitObj.unitAr}). يرجى شراء باقة إضافية أو ترقية اشتراكك.`;
      }
    }

    return {
      allowed,
      limit: limitObj.limit,
      used: limitObj.used,
      remaining: limitObj.remaining,
      status: limitObj.status,
      limitKey: normKey,
      messageAr
    };
  }

  /**
   * Concurrency-safe check and slot acquisition for numeric limits.
   * Atomically verifies that (DB usage + inFlight + incrementNeeded) <= limit under race conditions.
   */
  public async acquireLimitSlot(
    providerId: number,
    limitKey: string,
    incrementNeeded: number = 1
  ): Promise<{
    allowed: boolean;
    limit: number | null;
    used: number;
    inFlight: number;
    remaining: number | null;
    status: LimitStatus;
    limitKey: string;
    messageAr?: string;
    release: () => void;
  }> {
    const normKey = normalizeFeatureKey(limitKey);
    const lockKey = `${providerId}:${normKey}`;

    return await this.runExclusive(lockKey, async () => {
      // 1. Fetch fresh entitlements from DB (bypassing cache)
      const entitlements = await this.getEffectiveEntitlements(providerId, true);
      const limitObj = entitlements.limits[normKey];

      if (!limitObj) {
        return {
          allowed: false,
          limit: 0,
          used: 0,
          inFlight: 0,
          remaining: 0,
          status: 'OVER_LIMIT' as LimitStatus,
          limitKey: normKey,
          messageAr: 'الحد المطلوب غير معرف في سجل النظام',
          release: () => {}
        };
      }

      const currentInFlight = this.inFlightReservations.get(lockKey) || 0;

      if (limitObj.limit === null) {
        // Unlimited
        this.inFlightReservations.set(lockKey, currentInFlight + incrementNeeded);
        let released = false;
        const release = () => {
          if (!released) {
            released = true;
            const updated = Math.max(0, (this.inFlightReservations.get(lockKey) || 0) - incrementNeeded);
            if (updated === 0) {
              this.inFlightReservations.delete(lockKey);
            } else {
              this.inFlightReservations.set(lockKey, updated);
            }
            this.invalidateProviderCache(providerId);
          }
        };

        return {
          allowed: true,
          limit: null,
          used: limitObj.used,
          inFlight: currentInFlight,
          remaining: null,
          status: 'UNLIMITED' as LimitStatus,
          limitKey: normKey,
          release
        };
      }

      const totalProjected = limitObj.used + currentInFlight + incrementNeeded;
      const allowed = totalProjected <= limitObj.limit;

      if (!allowed) {
        let messageAr = '';
        if (limitObj.status === 'OVER_LIMIT' || (limitObj.used + currentInFlight) >= limitObj.limit) {
          messageAr = `تم بلوغ الحد الأقصى المسموح به (${limitObj.limit} ${limitObj.unitAr}). لديك حالياً ${limitObj.used} مسجلة بالإضافة إلى العمليات قيد التنفيذ. يرجى الترقية لإضافة المزيد.`;
        } else {
          messageAr = `العدد المطلوب يتجاوز السعة المتبقية المسموح بها (${Math.max(0, limitObj.limit - (limitObj.used + currentInFlight))} ${limitObj.unitAr} متبقية).`;
        }

        return {
          allowed: false,
          limit: limitObj.limit,
          used: limitObj.used,
          inFlight: currentInFlight,
          remaining: Math.max(0, limitObj.limit - (limitObj.used + currentInFlight)),
          status: (limitObj.used + currentInFlight) >= limitObj.limit ? 'OVER_LIMIT' : limitObj.status,
          limitKey: normKey,
          messageAr,
          release: () => {}
        };
      }

      // Reserve the slot in-flight
      this.inFlightReservations.set(lockKey, currentInFlight + incrementNeeded);
      let released = false;
      const release = () => {
        if (!released) {
          released = true;
          const updated = Math.max(0, (this.inFlightReservations.get(lockKey) || 0) - incrementNeeded);
          if (updated === 0) {
            this.inFlightReservations.delete(lockKey);
          } else {
            this.inFlightReservations.set(lockKey, updated);
          }
          this.invalidateProviderCache(providerId);
        }
      };

      return {
        allowed: true,
        limit: limitObj.limit,
        used: limitObj.used,
        inFlight: currentInFlight + incrementNeeded,
        remaining: Math.max(0, limitObj.limit - totalProjected),
        status: limitObj.status,
        limitKey: normKey,
        release
      };
    });
  }
}

export const effectiveEntitlementService = EffectiveEntitlementService.getInstance();
