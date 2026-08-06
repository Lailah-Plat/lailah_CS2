import { ISubscriptionRepository } from '../subscription.repository.js';
import { ProviderSubscription } from '../../../models/SubscriptionModels.js';

export class GetAllSubscriptionsUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(): Promise<ProviderSubscription[]> {
    return this.subscriptionRepository.findAllSubscriptions();
  }
}
