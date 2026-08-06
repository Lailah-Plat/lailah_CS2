import { ISubscriptionRepository } from '../subscription.repository.js';
import { ProviderSubscription, ProviderFeatureOverride } from '../../../models/SubscriptionModels.js';

export interface ProviderSubscriptionResult {
  subscription: ProviderSubscription | null;
  overrides: ProviderFeatureOverride[];
}

export class GetProviderSubscriptionUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(providerId: number): Promise<ProviderSubscriptionResult> {
    if (!providerId) {
      throw new Error('معرّف مزود الخدمة مطلوب');
    }

    const subscription = await this.subscriptionRepository.findActiveSubscriptionByProviderId(providerId);
    const overrides = await this.subscriptionRepository.findOverridesByProviderId(providerId);

    return {
      subscription,
      overrides
    };
  }
}
