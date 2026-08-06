import { IMarketingRepository } from '../marketing.repository.js';

export class RegisterExpenseUseCase {
  constructor(private marketingRepository: IMarketingRepository) {}

  async execute(data: any) {
    const { campaignId, amount, note, category } = data;
    if (!campaignId || !amount) {
      throw new Error('رقم الحملة والمبلغ مطلوبان.');
    }
    return this.marketingRepository.registerCampaignExpense(Number(campaignId), Number(amount), note, category);
  }
}
