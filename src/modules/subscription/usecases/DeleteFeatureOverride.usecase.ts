import { ISubscriptionRepository } from '../subscription.repository.js';
import { effectiveEntitlementService } from '../../../services/entitlement/effectiveEntitlementService.js';
import { normalizeFeatureKey } from '../../../services/entitlement/featureRegistry.js';

export class DeleteFeatureOverrideUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(providerId: number, featureKey: string, actor: string = 'Admin'): Promise<boolean> {
    if (!providerId || !featureKey) {
      throw new Error('بيانات غير مكتملة لحذف الميزة الإضافية.');
    }
    const normKey = normalizeFeatureKey(featureKey);
    const result = await this.subscriptionRepository.deleteOverride(providerId, normKey);

    effectiveEntitlementService.invalidateProviderCache(providerId);
    await effectiveEntitlementService.logAuditEvent({
      providerId,
      eventType: 'FEATURE_OVERRIDE_APPLIED',
      featureKey: normKey,
      source: 'OVERRIDE',
      actor,
      reason: `إلغاء أو حذف استثناء الميزة (${normKey}) والعودة لاستحقاق الباقة الافتراضية`,
      newValue: 'DELETED'
    });

    return result;
  }
}

