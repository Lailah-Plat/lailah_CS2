import { ISubscriptionRepository } from '../subscription.repository.js';
import { SubscriptionPlan } from '../../../models/SubscriptionModels.js';

export class GetPlansUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(): Promise<SubscriptionPlan[]> {
    return this.subscriptionRepository.findAllPlans();
  }
}
