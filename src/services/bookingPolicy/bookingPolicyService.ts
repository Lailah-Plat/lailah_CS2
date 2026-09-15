/**
 * @file bookingPolicyService.ts
 * @description Revised Booking & Payment Policy Engine for Lailah Platform (P1.9).
 * 
 * Implements the Revised P1.9 Architectural and Financial Rules:
 * 1. Default Policy: INSTANT_CONFIRMATION is the Platform Default Policy.
 * 2. Safe Policy: APPROVAL_BEFORE_PAYMENT is the Safest Operational/Financial Policy (always entitled).
 * 3. Unified Policy Scope: ONE policy for all Venues/Halls (`venueBookingPolicy`), ONE policy for all Independent Services (`independentServiceBookingPolicy`).
 *    NO resource-level overrides!
 * 4. Provider Response Deadline: Sovereign default (1 hour). If entitled to PROVIDER_RESPONSE_DEADLINE_CONTROL, provider can choose from [1, 3, 7, 12, 24] hours.
 * 5. Payment Deadlines & Attempt Limits: Configured per policy via PlatformConfig.
 * 6. Immutability: BookingPolicySnapshot is frozen at creation time.
 * 7. Provider Cancellation Guard: Confirmed or Paid bookings cannot be directly cancelled by the provider.
 */

import { effectiveEntitlementService } from '../entitlement/effectiveEntitlementService.js';
import { FEATURE_KEYS } from '../entitlement/featureRegistry.js';
import { ResourcePolicyAuditLog, Booking } from '../../models/BookingModels.js';
import { User, PlatformConfig } from '../../models/UserModels.js';
import { LegalDocument } from '../../models/LegalModels.js';

export type BookingPaymentPolicy = 
  | 'APPROVAL_BEFORE_PAYMENT'
  | 'PAYMENT_BEFORE_APPROVAL'
  | 'INSTANT_CONFIRMATION'
  | 'AUTHORIZE_THEN_CAPTURE';

export type PolicySource = 'PROVIDER_VENUE_POLICY' | 'PROVIDER_SERVICE_POLICY' | 'PLATFORM_DEFAULT';

export const PLATFORM_DEFAULT_POLICY: BookingPaymentPolicy = 'INSTANT_CONFIRMATION';
export const SAFE_DEFAULT_POLICY: BookingPaymentPolicy = 'APPROVAL_BEFORE_PAYMENT';
export const ALLOWED_PROVIDER_DEADLINES_HOURS = [1, 3, 7, 12, 24] as const;

export const ALL_BOOKING_PAYMENT_POLICIES: BookingPaymentPolicy[] = [
  'APPROVAL_BEFORE_PAYMENT',
  'PAYMENT_BEFORE_APPROVAL',
  'INSTANT_CONFIRMATION',
  'AUTHORIZE_THEN_CAPTURE'
];

export interface BookingPolicyMetadata {
  policy: BookingPaymentPolicy;
  nameAr: string;
  descriptionAr: string;
  isSafeDefault: boolean;
  isPlatformDefault: boolean;
  requiresMasterCapability: boolean;
  entitlementKey: string;
}

export const BOOKING_POLICY_DEFINITIONS: Record<BookingPaymentPolicy, BookingPolicyMetadata> = {
  INSTANT_CONFIRMATION: {
    policy: 'INSTANT_CONFIRMATION',
    nameAr: 'التأكيد الفوري والحجز المباشر (الافتراضي للمنصة)',
    descriptionAr: 'يتم سداد الحجز وتأكيده مباشرة وفورياً دون الحاجة لموافقة يدوية مسبقة من المزود.',
    isSafeDefault: false,
    isPlatformDefault: true,
    requiresMasterCapability: false,
    entitlementKey: FEATURE_KEYS.BOOKING_POLICY_INSTANT_CONFIRMATION
  },
  APPROVAL_BEFORE_PAYMENT: {
    policy: 'APPROVAL_BEFORE_PAYMENT',
    nameAr: 'موافقة المزود قبل الدفع (المسار الأكثر أماناً)',
    descriptionAr: 'يتم إنشاء الحجز كطلب غير مدفوع، ويمنح المزود مهلة للمراجعة والقبول، ثم يسدد العميل بعد القبول.',
    isSafeDefault: true,
    isPlatformDefault: false,
    requiresMasterCapability: false,
    entitlementKey: FEATURE_KEYS.BOOKING_POLICY_APPROVAL_BEFORE_PAYMENT
  },
  PAYMENT_BEFORE_APPROVAL: {
    policy: 'PAYMENT_BEFORE_APPROVAL',
    nameAr: 'الدفع المسبق قبل مراجعة المزود',
    descriptionAr: 'يسدد العميل المبلغ مقدماً عند إرسال الطلب، وإذا تم الرفض أو انتهت المهلة يتم إدراج العملية في دورة الاسترداد الرسمية المعتمدة.',
    isSafeDefault: false,
    isPlatformDefault: false,
    requiresMasterCapability: true,
    entitlementKey: FEATURE_KEYS.BOOKING_POLICY_PAYMENT_BEFORE_APPROVAL
  },
  AUTHORIZE_THEN_CAPTURE: {
    policy: 'AUTHORIZE_THEN_CAPTURE',
    nameAr: 'حجز المبلغ والتفويض المسبق (Hold & Capture)',
    descriptionAr: 'يتم تفويض وحجز المبلغ على بطاقة العميل ويتم الخصم الفعلي فقط عند قبول المزود للطلب.',
    isSafeDefault: false,
    isPlatformDefault: false,
    requiresMasterCapability: true,
    entitlementKey: FEATURE_KEYS.BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE
  }
};

export interface BookingPolicySnapshot {
  policy: BookingPaymentPolicy;
  policySource: PolicySource;
  resolvedAt: string;
  providerId: number;
  hallId?: number;
  serviceId?: number;
  providerResponseDeadlineHours: number | null;
  customerPaymentDeadlineHours: number;
  maxPaymentAttempts: number;
  termsVersion: string;
  entitlementVersion: number;
  entitlementsSummary: {
    hasPolicyControl: boolean;
    hasDeadlineControl: boolean;
    allowedPolicies: BookingPaymentPolicy[];
  };
  reason?: string;
}

export interface SystemSovereignPolicyConfig {
  sovereignProviderResponseDeadlineHours: number;
  customerPaymentDeadlines: Record<BookingPaymentPolicy, number>;
  maxPaymentAttempts: Record<BookingPaymentPolicy, number>;
  platformDefaultPolicy: BookingPaymentPolicy;
}

export const DEFAULT_SOVEREIGN_POLICY_CONFIG: SystemSovereignPolicyConfig = {
  sovereignProviderResponseDeadlineHours: 1,
  customerPaymentDeadlines: {
    APPROVAL_BEFORE_PAYMENT: 2,     // 2 hours after provider approval
    PAYMENT_BEFORE_APPROVAL: 1,     // 1 hour to complete initial payment
    INSTANT_CONFIRMATION: 0.5,      // 30 minutes hold
    AUTHORIZE_THEN_CAPTURE: 0.5     // 30 minutes auth hold
  },
  maxPaymentAttempts: {
    APPROVAL_BEFORE_PAYMENT: 3,
    PAYMENT_BEFORE_APPROVAL: 3,
    INSTANT_CONFIRMATION: 3,
    AUTHORIZE_THEN_CAPTURE: 3
  },
  platformDefaultPolicy: 'INSTANT_CONFIRMATION'
};

export class BookingPolicyService {
  private static instance: BookingPolicyService;

  private constructor() {}

  public static getInstance(): BookingPolicyService {
    if (!BookingPolicyService.instance) {
      BookingPolicyService.instance = new BookingPolicyService();
    }
    return BookingPolicyService.instance;
  }

  /**
   * Normalizes any input string into a valid BookingPaymentPolicy
   */
  public normalizePolicyString(input: any): BookingPaymentPolicy {
    if (!input || typeof input !== 'string') {
      return PLATFORM_DEFAULT_POLICY;
    }
    const clean = input.trim().toUpperCase();

    if (clean === 'INSTANT_CONFIRMATION' || clean === 'INSTANT' || clean === 'INSTANT_BOOKING' || clean === 'DIRECT') {
      return 'INSTANT_CONFIRMATION';
    }
    if (clean === 'APPROVAL_BEFORE_PAYMENT' || clean === 'APPROVAL_FIRST' || clean === 'SAFE_DEFAULT') {
      return 'APPROVAL_BEFORE_PAYMENT';
    }
    if (clean === 'PAYMENT_BEFORE_APPROVAL' || clean === 'PAY_FIRST' || clean === 'PAY_BEFORE_APPROVAL') {
      return 'PAYMENT_BEFORE_APPROVAL';
    }
    if (clean === 'AUTHORIZE_THEN_CAPTURE' || clean === 'PRE_AUTH' || clean === 'HOLD_AND_CAPTURE' || clean === 'AUTH_CAPTURE') {
      return 'AUTHORIZE_THEN_CAPTURE';
    }

    return PLATFORM_DEFAULT_POLICY;
  }

  /**
   * Loads the Sovereign Policy Configuration from PlatformConfig (or fallback to defaults).
   */
  public async getSovereignPolicyConfig(): Promise<SystemSovereignPolicyConfig> {
    try {
      const row = await PlatformConfig.findByPk('BOOKING_PAYMENT_POLICY_CONFIG');
      if (row && row.value) {
        const parsed = JSON.parse(row.value);
        return {
          sovereignProviderResponseDeadlineHours: Number(parsed.sovereignProviderResponseDeadlineHours) || 1,
          customerPaymentDeadlines: {
            ...DEFAULT_SOVEREIGN_POLICY_CONFIG.customerPaymentDeadlines,
            ...(parsed.customerPaymentDeadlines || {})
          },
          maxPaymentAttempts: {
            ...DEFAULT_SOVEREIGN_POLICY_CONFIG.maxPaymentAttempts,
            ...(parsed.maxPaymentAttempts || {})
          },
          platformDefaultPolicy: this.normalizePolicyString(parsed.platformDefaultPolicy || 'INSTANT_CONFIRMATION')
        };
      }
    } catch (err: any) {
      console.warn('[BookingPolicyService] Could not read sovereign policy config from DB:', err.message);
    }
    return { ...DEFAULT_SOVEREIGN_POLICY_CONFIG };
  }

  /**
   * Updates Sovereign Policy Configuration in PlatformConfig (Admin only).
   */
  public async updateSovereignPolicyConfig(
    config: Partial<SystemSovereignPolicyConfig>,
    adminUser?: { id: number; name: string }
  ): Promise<SystemSovereignPolicyConfig> {
    const current = await this.getSovereignPolicyConfig();
    const updated: SystemSovereignPolicyConfig = {
      ...current,
      ...config,
      customerPaymentDeadlines: {
        ...current.customerPaymentDeadlines,
        ...(config.customerPaymentDeadlines || {})
      },
      maxPaymentAttempts: {
        ...current.maxPaymentAttempts,
        ...(config.maxPaymentAttempts || {})
      }
    };

    await PlatformConfig.upsert({
      key: 'BOOKING_PAYMENT_POLICY_CONFIG',
      value: JSON.stringify(updated)
    });

    // Record audit
    await this.recordPolicyChangeAudit({
      providerId: 0,
      resourceType: 'admin_sovereign',
      resourceId: 0,
      resourceName: 'Sovereign Booking & Payment Policy Config',
      oldPolicy: JSON.stringify(current),
      newPolicy: JSON.stringify(updated),
      actorId: adminUser?.id || null,
      actorRole: 'admin',
      reason: 'تحديث الإعدادات السيادية لسياسات الحجز ومهل الاستجابة والمدفوعات'
    });

    return updated;
  }

  /**
   * Fetches the latest published Terms & Conditions version string (e.g. 'v2.0').
   */
  public async getLatestPublishedTermsVersion(): Promise<string> {
    try {
      const doc = await LegalDocument.findOne({
        where: { documentType: 'terms', status: 'published' },
        order: [['publishedAt', 'DESC'], ['id', 'DESC']]
      });
      if (doc && doc.version) {
        return doc.version;
      }
    } catch (e: any) {}
    return 'v2.0';
  }

  /**
   * Fetches all booking & payment policies that a specific provider is entitled to use.
   * APPROVAL_BEFORE_PAYMENT (Safe Policy) is ALWAYS included.
   * INSTANT_CONFIRMATION is included if entitled or active.
   */
  public async getAllowedBookingPolicies(providerId: number): Promise<BookingPaymentPolicy[]> {
    const allowed: BookingPaymentPolicy[] = ['APPROVAL_BEFORE_PAYMENT', 'INSTANT_CONFIRMATION'];

    if (!providerId) {
      return allowed;
    }

    try {
      const entitlements = await effectiveEntitlementService.getEffectiveEntitlements(providerId);

      const hasMasterControl = Boolean(
        entitlements.features[FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL]
      );

      // Check granular entitlements
      const canPaymentBeforeApproval = Boolean(
        entitlements.features[FEATURE_KEYS.BOOKING_POLICY_PAYMENT_BEFORE_APPROVAL] || hasMasterControl
      );
      const canInstantConfirmation = Boolean(
        entitlements.features[FEATURE_KEYS.BOOKING_POLICY_INSTANT_CONFIRMATION] !== false
      );
      const canAuthorizeThenCapture = Boolean(
        entitlements.features[FEATURE_KEYS.BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE] || hasMasterControl
      );

      if (canPaymentBeforeApproval) {
        allowed.push('PAYMENT_BEFORE_APPROVAL');
      }
      if (canInstantConfirmation && !allowed.includes('INSTANT_CONFIRMATION')) {
        allowed.push('INSTANT_CONFIRMATION');
      }
      if (canAuthorizeThenCapture) {
        allowed.push('AUTHORIZE_THEN_CAPTURE');
      }

      return Array.from(new Set(allowed));
    } catch (err: any) {
      console.error(`[BookingPolicyService] Error resolving allowed policies for provider ${providerId}:`, err.message);
      return ['APPROVAL_BEFORE_PAYMENT', 'INSTANT_CONFIRMATION'];
    }
  }

  /**
   * Checks if provider is entitled to customize their response deadline.
   */
  public async canProviderControlDeadline(providerId: number): Promise<boolean> {
    if (!providerId) return false;
    try {
      const entitlements = await effectiveEntitlementService.getEffectiveEntitlements(providerId);
      return Boolean(
        entitlements.features[FEATURE_KEYS.PROVIDER_RESPONSE_DEADLINE_CONTROL] ||
        entitlements.features[FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL]
      );
    } catch {
      return false;
    }
  }

  /**
   * Resolves the effective response deadline (in hours) for a provider.
   * - If INSTANT_CONFIRMATION: returns null (no response deadline).
   * - If other policy:
   *   - If provider has PROVIDER_RESPONSE_DEADLINE_CONTROL and valid custom value in [1, 3, 7, 12, 24], returns that.
   *   - Otherwise returns sovereign deadline (PlatformConfig, default 1 hour).
   */
  public async resolveProviderResponseDeadline(
    providerId: number,
    policy: BookingPaymentPolicy,
    sovereignConfig: SystemSovereignPolicyConfig
  ): Promise<number | null> {
    if (policy === 'INSTANT_CONFIRMATION') {
      return null;
    }

    const sovereignDeadline = sovereignConfig.sovereignProviderResponseDeadlineHours || 1;
    if (!providerId) {
      return sovereignDeadline;
    }

    try {
      const canControl = await this.canProviderControlDeadline(providerId);
      if (canControl) {
        const provider = await User.findByPk(providerId);
        const customHours = (provider as any)?.providerResponseDeadlineHours;
        if (customHours && ALLOWED_PROVIDER_DEADLINES_HOURS.includes(Number(customHours) as any)) {
          return Number(customHours);
        }
      }
    } catch (err: any) {
      console.warn(`[BookingPolicyService] Error resolving provider deadline:`, err.message);
    }

    return sovereignDeadline;
  }

  /**
   * Validates if a provider is allowed to configure or use a policy.
   */
  public async validateProviderCanUsePolicy(
    providerId: number,
    policy: string
  ): Promise<{ allowed: boolean; reason?: string; policy: BookingPaymentPolicy }> {
    const norm = this.normalizePolicyString(policy);
    if (norm === 'APPROVAL_BEFORE_PAYMENT' || norm === 'INSTANT_CONFIRMATION') {
      return { allowed: true, policy: norm };
    }

    const allowedPolicies = await this.getAllowedBookingPolicies(providerId);
    if (!allowedPolicies.includes(norm)) {
      const def = BOOKING_POLICY_DEFINITIONS[norm];
      const policyName = def?.nameAr || norm;
      return {
        allowed: false,
        policy: norm,
        reason: `حساب المزود الحالي غير مخول لاستخدام (${policyName}). يتطلب هذا الخيار تفعيل قدرة التحكم في سياسات الحجز عبر ترقية باقة الاشتراك أو شراء الميزة من متجر القدرات.`
      };
    }

    return { allowed: true, policy: norm };
  }

  /**
   * Resolves the effective booking policy for a Venue/Hall or Independent Service booking.
   * 
   * Strict Revised P1.9 Precedence:
   * 1. If Hall/Venue: checks provider.venueBookingPolicy.
   * 2. If Service: checks provider.independentServiceBookingPolicy.
   * 3. No Resource-Level override!
   * 4. Entitlement verification:
   *    - If provider is entitled to candidate policy -> candidatePolicy.
   *    - If not entitled:
   *      - Fall back to provider's single allowed policy, or PLATFORM_DEFAULT_POLICY (if entitled), or SAFE_DEFAULT_POLICY.
   * 5. Resolve provider response deadline, payment deadline, attempt limit, terms version.
   * 6. Generate immutable BookingPolicySnapshot.
   */
  public async resolveEffectiveBookingPolicy(params: {
    providerId: number;
    hallId?: number | null;
    serviceId?: number | null;
    explicitPolicy?: string | null;
    resourceType?: 'venue' | 'service';
  }): Promise<{
    policy: BookingPaymentPolicy;
    snapshot: BookingPolicySnapshot;
    effectiveSource: PolicySource;
  }> {
    const { providerId, hallId, serviceId, resourceType } = params;

    const sovereignConfig = await this.getSovereignPolicyConfig();
    const allowedPolicies = await this.getAllowedBookingPolicies(providerId);
    const hasDeadlineControl = await this.canProviderControlDeadline(providerId);
    const termsVersion = await this.getLatestPublishedTermsVersion();

    let candidatePolicy: BookingPaymentPolicy | null = null;
    let effectiveSource: PolicySource = 'PLATFORM_DEFAULT';
    let resolutionReason = 'الاعتماد على السياسة الافتراضية للمنصة';

    if (params.explicitPolicy) {
      candidatePolicy = this.normalizePolicyString(params.explicitPolicy);
      effectiveSource = 'PROVIDER_VENUE_POLICY';
      resolutionReason = 'سياسة الحجز المحددة صراحة في طلب الحجز';
    }

    // Query Provider from DB to get venueBookingPolicy or independentServiceBookingPolicy
    let providerUser: any = null;
    if (providerId) {
      try {
        providerUser = await User.findByPk(providerId);
      } catch (err: any) {
        console.warn(`[BookingPolicyService] Could not load provider ${providerId}:`, err.message);
      }
    }

    const isServiceBooking = resourceType === 'service' || Boolean(serviceId && !hallId);

    if (!candidatePolicy) {
      if (isServiceBooking) {
        // 1. Independent Service Policy
        if (providerUser?.independentServiceBookingPolicy) {
          candidatePolicy = this.normalizePolicyString(providerUser.independentServiceBookingPolicy);
          effectiveSource = 'PROVIDER_SERVICE_POLICY';
          resolutionReason = 'سياسة الخدمات المستقلة الموحدة المحددة في حساب المزود';
        } else if (providerUser?.defaultBookingPaymentPolicy) {
          candidatePolicy = this.normalizePolicyString(providerUser.defaultBookingPaymentPolicy);
          effectiveSource = 'PROVIDER_SERVICE_POLICY';
          resolutionReason = 'السياسة المعتمدة في حساب المزود';
        }
      } else {
        // 2. Venue / Hall Policy
        if (providerUser?.venueBookingPolicy) {
          candidatePolicy = this.normalizePolicyString(providerUser.venueBookingPolicy);
          effectiveSource = 'PROVIDER_VENUE_POLICY';
          resolutionReason = 'سياسة الأماكن والقاعات الموحدة المحددة في حساب المزود';
        } else if (providerUser?.defaultBookingPaymentPolicy) {
          candidatePolicy = this.normalizePolicyString(providerUser.defaultBookingPaymentPolicy);
          effectiveSource = 'PROVIDER_VENUE_POLICY';
          resolutionReason = 'السياسة المعتمدة في حساب المزود';
        }
      }
    }

    // 3. Fallback to platform default if unconfigured
    if (!candidatePolicy) {
      candidatePolicy = sovereignConfig.platformDefaultPolicy || PLATFORM_DEFAULT_POLICY;
      effectiveSource = 'PLATFORM_DEFAULT';
      resolutionReason = 'السياسة الافتراضية لمنصة ليلة';
    }

    // 4. Verify candidate policy entitlement
    let finalPolicy: BookingPaymentPolicy = candidatePolicy;
    if (!allowedPolicies.includes(candidatePolicy)) {
      console.warn(
        `[BookingPolicyService] Provider ${providerId} is NOT entitled to policy ${candidatePolicy}. Gracefully resolving fallback.`
      );
      if (allowedPolicies.includes(PLATFORM_DEFAULT_POLICY)) {
        finalPolicy = PLATFORM_DEFAULT_POLICY;
      } else if (allowedPolicies.includes(SAFE_DEFAULT_POLICY)) {
        finalPolicy = SAFE_DEFAULT_POLICY;
      } else {
        finalPolicy = allowedPolicies[0] || SAFE_DEFAULT_POLICY;
      }
      effectiveSource = 'PLATFORM_DEFAULT';
      resolutionReason = `تم الرجوع التلقائي لـ (${finalPolicy}) لعدم توفر صلاحية (${candidatePolicy}) في اشتراك المزود.`;
    }

    // 5. Calculate Response Deadline & Payment Deadline
    const responseDeadlineHours = await this.resolveProviderResponseDeadline(
      providerId,
      finalPolicy,
      sovereignConfig
    );
    const paymentDeadlineHours = sovereignConfig.customerPaymentDeadlines[finalPolicy] ?? 2;
    const maxPaymentAttempts = sovereignConfig.maxPaymentAttempts[finalPolicy] ?? 3;

    const version = effectiveEntitlementService.getProviderVersion(providerId);

    const snapshot: BookingPolicySnapshot = {
      policy: finalPolicy,
      policySource: effectiveSource,
      resolvedAt: new Date().toISOString(),
      providerId: Number(providerId),
      hallId: hallId ? Number(hallId) : undefined,
      serviceId: serviceId ? Number(serviceId) : undefined,
      providerResponseDeadlineHours: responseDeadlineHours,
      customerPaymentDeadlineHours: paymentDeadlineHours,
      maxPaymentAttempts,
      termsVersion,
      entitlementVersion: version,
      entitlementsSummary: {
        hasPolicyControl: allowedPolicies.length > 2,
        hasDeadlineControl,
        allowedPolicies
      },
      reason: resolutionReason
    };

    return {
      policy: finalPolicy,
      snapshot,
      effectiveSource
    };
  }

  /**
   * Updates a provider's unified policies (venueBookingPolicy, independentServiceBookingPolicy, response deadline).
   */
  public async updateProviderPolicySettings(params: {
    providerId: number;
    venueBookingPolicy?: string;
    independentServiceBookingPolicy?: string;
    providerResponseDeadlineHours?: number;
    actorId?: number;
    actorRole?: string;
  }): Promise<{
    success: boolean;
    venueBookingPolicy: BookingPaymentPolicy;
    independentServiceBookingPolicy: BookingPaymentPolicy;
    providerResponseDeadlineHours: number;
    error?: string;
  }> {
    const { providerId, venueBookingPolicy, independentServiceBookingPolicy, providerResponseDeadlineHours, actorId, actorRole } = params;

    const provider = await User.findByPk(providerId);
    if (!provider) {
      return {
        success: false,
        venueBookingPolicy: PLATFORM_DEFAULT_POLICY,
        independentServiceBookingPolicy: PLATFORM_DEFAULT_POLICY,
        providerResponseDeadlineHours: 1,
        error: 'المزود غير موجود'
      };
    }

    const allowedPolicies = await this.getAllowedBookingPolicies(providerId);
    const canControlDeadline = await this.canProviderControlDeadline(providerId);

    const oldVenue = (provider as any).venueBookingPolicy || PLATFORM_DEFAULT_POLICY;
    const oldService = (provider as any).independentServiceBookingPolicy || PLATFORM_DEFAULT_POLICY;
    const oldDeadline = (provider as any).providerResponseDeadlineHours || 1;

    let newVenue = oldVenue;
    let newService = oldService;
    let newDeadline = oldDeadline;

    if (venueBookingPolicy !== undefined) {
      const norm = this.normalizePolicyString(venueBookingPolicy);
      if (!allowedPolicies.includes(norm)) {
        return {
          success: false,
          venueBookingPolicy: oldVenue,
          independentServiceBookingPolicy: oldService,
          providerResponseDeadlineHours: oldDeadline,
          error: `غير مصرح للمزود باستخدام سياسة القاعات (${norm})`
        };
      }
      newVenue = norm;
    }

    if (independentServiceBookingPolicy !== undefined) {
      const norm = this.normalizePolicyString(independentServiceBookingPolicy);
      if (!allowedPolicies.includes(norm)) {
        return {
          success: false,
          venueBookingPolicy: oldVenue,
          independentServiceBookingPolicy: oldService,
          providerResponseDeadlineHours: oldDeadline,
          error: `غير مصرح للمزود باستخدام سياسة الخدمات (${norm})`
        };
      }
      newService = norm;
    }

    if (providerResponseDeadlineHours !== undefined) {
      const hoursNum = Number(providerResponseDeadlineHours);
      if (!canControlDeadline) {
        return {
          success: false,
          venueBookingPolicy: oldVenue,
          independentServiceBookingPolicy: oldService,
          providerResponseDeadlineHours: oldDeadline,
          error: 'حساب المزود غير مخول لتعديل مهلة الاستجابة. تطبق المهلة السيادية الافتراضية (ساعة واحدة).'
        };
      }
      if (!ALLOWED_PROVIDER_DEADLINES_HOURS.includes(hoursNum as any)) {
        return {
          success: false,
          venueBookingPolicy: oldVenue,
          independentServiceBookingPolicy: oldService,
          providerResponseDeadlineHours: oldDeadline,
          error: `مهلة الاستجابة غير صحيحة. الخيارات المعتمدة هي: [${ALLOWED_PROVIDER_DEADLINES_HOURS.join(', ')}] ساعة.`
        };
      }
      newDeadline = hoursNum;
    }

    // Save to provider User
    await provider.update({
      venueBookingPolicy: newVenue,
      independentServiceBookingPolicy: newService,
      defaultBookingPaymentPolicy: newVenue,
      providerResponseDeadlineHours: newDeadline
    });

    // Record Audit
    if (newVenue !== oldVenue) {
      await this.recordPolicyChangeAudit({
        providerId,
        resourceType: 'venue',
        resourceId: providerId,
        resourceName: 'Venue Booking Policy (All Venues)',
        oldPolicy: oldVenue,
        newPolicy: newVenue,
        actorId: actorId || null,
        actorRole: actorRole || 'provider',
        reason: 'تحديث سياسة حجز الأماكن والقاعات الموحدة'
      });
    }

    if (newService !== oldService) {
      await this.recordPolicyChangeAudit({
        providerId,
        resourceType: 'service',
        resourceId: providerId,
        resourceName: 'Independent Service Booking Policy (All Services)',
        oldPolicy: oldService,
        newPolicy: newService,
        actorId: actorId || null,
        actorRole: actorRole || 'provider',
        reason: 'تحديث سياسة حجز الخدمات المستقلة الموحدة'
      });
    }

    if (newDeadline !== oldDeadline) {
      await this.recordPolicyChangeAudit({
        providerId,
        resourceType: 'provider_deadline',
        resourceId: providerId,
        resourceName: 'Provider Response Deadline',
        oldPolicy: `${oldDeadline}h`,
        newPolicy: `${newDeadline}h`,
        actorId: actorId || null,
        actorRole: actorRole || 'provider',
        reason: 'تحديث مهلة استجابة المزود لمراجعة الطلبات'
      });
    }

    return {
      success: true,
      venueBookingPolicy: newVenue,
      independentServiceBookingPolicy: newService,
      providerResponseDeadlineHours: newDeadline
    };
  }

  /**
   * Strict Provider Cancellation Guard (Section D / Section 12).
   * Confirmed or Paid bookings cannot be directly cancelled by the provider.
   * Only via Support Ticket / Cancellation Request for Admin review.
   */
  public validateProviderCanDirectlyCancel(booking: any): { allowed: boolean; reason?: string } {
    if (!booking) {
      return { allowed: false, reason: 'الحجز غير موجود' };
    }

    const status = String(booking.status || '').toUpperCase();
    const paymentStatus = String(booking.paymentStatus || '').toUpperCase();

    // Check if confirmed or paid
    const isConfirmed = status === 'CONFIRMED' || status === 'مؤكد';
    const isPaid = paymentStatus === 'PAID' || paymentStatus === 'مدفوع' || paymentStatus === 'PARTIALLY_PAID';

    if (isConfirmed || isPaid) {
      return {
        allowed: false,
        reason: 'لا يملك المزود صلاحية الإلغاء المباشر لأي حجز تم تأكيده أو سداد قيمته. المسار النظامي الوحيد هو رفع تذكرة دعم / طلب إلغاء لمراجعة واعتماد إدارة المنصة.'
      };
    }

    return { allowed: true };
  }

  /**
   * Records an audit log entry for policy changes.
   */
  public async recordPolicyChangeAudit(params: {
    providerId: number;
    resourceType: 'venue' | 'service' | 'provider_deadline' | 'admin_sovereign' | 'legal_cms' | 'hall' | string;
    resourceId: number;
    resourceName?: string | null;
    oldPolicy: string;
    newPolicy: string;
    actorId?: number | null;
    actorRole?: string | null;
    entitlementSource?: string | null;
    reason?: string | null;
  }): Promise<void> {
    try {
      await ResourcePolicyAuditLog.create({
        providerId: Number(params.providerId) || 0,
        resourceType: params.resourceType,
        resourceId: Number(params.resourceId) || 0,
        resourceName: params.resourceName || null,
        oldPolicy: params.oldPolicy,
        newPolicy: params.newPolicy,
        actorId: params.actorId || null,
        actorRole: params.actorRole || 'provider',
        entitlementSource: params.entitlementSource || 'ENTITLEMENT_ENGINE',
        reason: params.reason || 'تحديث سياسة الحجز والدفع'
      });
    } catch (err: any) {
      console.warn('[BookingPolicyService] Failed to record resource policy audit log:', err.message);
    }
  }
}

export const bookingPolicyService = BookingPolicyService.getInstance();
