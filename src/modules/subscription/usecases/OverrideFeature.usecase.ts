import { ISubscriptionRepository } from '../subscription.repository.js';
import { ProviderFeatureOverride } from '../../../models/SubscriptionModels.js';
import { effectiveEntitlementService } from '../../../services/entitlement/effectiveEntitlementService.js';
import { normalizeFeatureKey } from '../../../services/entitlement/featureRegistry.js';

export interface OverrideFeatureInput {
  providerIds: any[];
  featureKey: string;
  featureName: string;
  overrideType?: string;
  value: string | number | boolean;
  customExpiresAt?: string;
  notes?: string;
  actor?: string;
  reason?: string;
  isGranted?: boolean;
}

export class OverrideFeatureUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(input: OverrideFeatureInput): Promise<ProviderFeatureOverride[]> {
    const { providerIds, featureKey, featureName, overrideType, value, customExpiresAt, notes, actor, reason, isGranted } = input;

    if (!providerIds || !Array.isArray(providerIds) || providerIds.length === 0) {
      throw new Error('يجب اختيار مزود خدمة واحد على الأقل.');
    }

    if (!featureKey) {
      throw new Error('يجب تحديد الميزة المطلوبة ومفتاحها البرمجي.');
    }

    const normKey = normalizeFeatureKey(featureKey);
    const expiresAt = customExpiresAt ? new Date(customExpiresAt) : null;
    const results: ProviderFeatureOverride[] = [];

    for (const pid of providerIds) {
      const user = await this.subscriptionRepository.findUserById(Number(pid));
      if (!user) continue;

      // Delete existing override for the same feature to avoid duplicates
      await this.subscriptionRepository.deleteOverride(user.id, normKey);

      const grantFlag = isGranted !== undefined ? isGranted : (value === 'true' || value === true || value === 1 || String(value) !== 'false');

      // Create new custom override
      const override = await this.subscriptionRepository.createOverride({
        providerId: user.id,
        providerEmail: user.email,
        featureKey: normKey,
        featureName: featureName || normKey,
        overrideType: overrideType || 'grant',
        value: String(value),
        isGranted: grantFlag,
        expiresAt,
        notes: notes || 'ميزة إضافية مخصصة ممنوحة يدوياً من الإدارة',
        grantedBy: actor || 'Admin',
        reason: reason || notes || 'استثناء أو منح إداري مخصص'
      });

      // Invalidate cache and log audit event
      effectiveEntitlementService.invalidateProviderCache(user.id);
      await effectiveEntitlementService.logAuditEvent({
        providerId: user.id,
        providerEmail: user.email,
        eventType: 'FEATURE_OVERRIDE_APPLIED',
        featureKey: normKey,
        source: 'OVERRIDE',
        actor: actor || 'Admin',
        reason: reason || notes || `تطبيق استثناء لميزة ${featureName || normKey}`,
        newValue: String(value),
        metadata: {
          overrideType,
          expiresAt: expiresAt ? expiresAt.toISOString() : null
        }
      });

      results.push(override);
    }

    return results;
  }
}

