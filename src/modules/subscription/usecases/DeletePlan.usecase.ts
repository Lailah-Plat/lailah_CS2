import { ISubscriptionRepository } from '../subscription.repository.js';

export class DeletePlanUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(id: string | number): Promise<number> {
    if (!id) {
      throw new Error('معرّف الباقة مطلوب للحذف');
    }

    let deletedCount = 0;
    if (!isNaN(Number(id))) {
      const success = await this.subscriptionRepository.deletePlanById(Number(id));
      deletedCount = success ? 1 : 0;
    } else {
      const success = await this.subscriptionRepository.deletePlanByName(String(id));
      deletedCount = success ? 1 : 0;
    }

    return deletedCount;
  }
}
