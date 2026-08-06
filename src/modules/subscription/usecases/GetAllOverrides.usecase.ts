import { ISubscriptionRepository } from '../subscription.repository.js';
import { ProviderFeatureOverride } from '../../../models/SubscriptionModels.js';

export class GetAllOverridesUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(): Promise<ProviderFeatureOverride[]> {
    return this.subscriptionRepository.findAllOverrides();
  }
}
