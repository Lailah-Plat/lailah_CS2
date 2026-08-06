import { ISubscriptionRepository } from '../subscription.repository.js';

export class DeleteFeatureOverrideUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(providerId: number, featureKey: string): Promise<boolean> {
    if (!providerId || !featureKey) {
      throw new Error('بيانات غير مكتملة لحذف الميزة الإضافية.');
    }
    return this.subscriptionRepository.deleteOverride(providerId, featureKey);
  }
}
