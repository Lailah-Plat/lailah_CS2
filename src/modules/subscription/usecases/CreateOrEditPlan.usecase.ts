import { ISubscriptionRepository } from '../subscription.repository.js';
import { SubscriptionPlan } from '../../../models/SubscriptionModels.js';

export class CreateOrEditPlanUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(data: any): Promise<SubscriptionPlan> {
    const { name } = data;
    if (!name) {
      throw new Error('اسم الباقة مطلوب.');
    }

    const existingPlan = await this.subscriptionRepository.findPlanByName(name);
    if (existingPlan) {
      return this.subscriptionRepository.updatePlan(existingPlan, data);
    } else {
      return this.subscriptionRepository.createPlan(data);
    }
  }
}
