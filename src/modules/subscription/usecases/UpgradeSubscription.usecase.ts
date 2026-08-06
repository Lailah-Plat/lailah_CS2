import { ISubscriptionRepository } from '../subscription.repository.js';
import { ProviderSubscription } from '../../../models/SubscriptionModels.js';

export interface UpgradeSubscriptionInput {
  providerIds: any[];
  planName: string;
  pricePaid?: number;
  durationMonths?: number | string;
  customEndDate?: string;
  notes?: string;
}

export class UpgradeSubscriptionUseCase {
  constructor(private subscriptionRepository: ISubscriptionRepository) {}

  async execute(input: UpgradeSubscriptionInput): Promise<ProviderSubscription[]> {
    const { providerIds, planName, pricePaid, durationMonths, customEndDate, notes } = input;

    if (!providerIds || !Array.isArray(providerIds) || providerIds.length === 0) {
      throw new Error('يجب اختيار مزود خدمة واحد على الأقل.');
    }

    if (!planName) {
      throw new Error('يجب تحديد الباقة المستهدفة للترقية.');
    }

    let plan = await this.subscriptionRepository.findPlanByName(planName);
    if (!plan) {
      const plans = await this.subscriptionRepository.findAllPlans();
      plan = plans.find(p => p.name.includes(planName)) || null;
    }

    const startDate = new Date();
    let endDate: Date | null = null;

    if (customEndDate && customEndDate !== 'unlimited') {
      endDate = new Date(customEndDate);
    } else if (durationMonths && Number(durationMonths) > 0) {
      endDate = new Date();
      endDate.setMonth(endDate.getMonth() + Number(durationMonths));
    }

    const price = pricePaid !== undefined ? Number(pricePaid) : Number(plan ? plan.price : 0);
    const results: ProviderSubscription[] = [];

    for (const pid of providerIds) {
      let user = await this.subscriptionRepository.findUserById(pid);
      let providerId = user ? user.id : (Number(pid) || 1);
      let providerEmail = user ? user.email : `provider_${pid}@layla.sa`;

      if (user) {
        // Deactivate any previous active subscriptions
        await this.subscriptionRepository.deactivateActiveSubscriptions(user.id);
      }

      // Create new subscription
      const sub = await this.subscriptionRepository.createSubscription({
        providerId,
        providerEmail,
        planName,
        pricePaid: price,
        status: 'active',
        startDate,
        endDate,
        isCustom: true,
        notes: notes || `ترقية إدارية يدوية إلى باقة ${planName}`
      });

      results.push(sub);
    }

    return results;
  }
}
