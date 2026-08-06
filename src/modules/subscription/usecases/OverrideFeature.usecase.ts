import { ISubscriptionRepository } from '../subscription.repository.js';
import { ProviderFeatureOverride } from '../../../models/SubscriptionModels.js';

export interface OverrideFeatureInput {
  providerIds: any[];
  featureKey: string;
  featureName: string;
  overrideType?: string;
  value: string | number | boolean;
  customExpiresAt?: string;
  notes?: string;
}

export class OverrideFeatureUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(input: OverrideFeatureInput): Promise<ProviderFeatureOverride[]> {
    const { providerIds, featureKey, featureName, overrideType, value, customExpiresAt, notes } = input;

    if (!providerIds || !Array.isArray(providerIds) || providerIds.length === 0) {
      throw new Error('يجب اختيار مزود خدمة واحد على الأقل.');
    }

    if (!featureKey || !featureName) {
      throw new Error('يجب تحديد الميزة المطلوبة ومفتاحها البرمجي.');
    }

    const expiresAt = customExpiresAt ? new Date(customExpiresAt) : null;
    const results: ProviderFeatureOverride[] = [];

    for (const pid of providerIds) {
      const user = await this.subscriptionRepository.findUserById(Number(pid));
      if (!user) continue;

      // Delete existing override for the same feature to avoid duplicates
      await this.subscriptionRepository.deleteOverride(user.id, featureKey);

      // Create new custom override
      const override = await this.subscriptionRepository.createOverride({
        providerId: user.id,
        providerEmail: user.email,
        featureKey,
        featureName,
        overrideType: overrideType || 'grant',
        value: String(value),
        expiresAt,
        notes: notes || 'ميزة إضافية مخصصة ممنوحة يدوياً من الإدارة'
      });

      results.push(override);
    }

    return results;
  }
}
