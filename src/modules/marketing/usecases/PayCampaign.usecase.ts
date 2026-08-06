import { IMarketingRepository } from '../marketing.repository.js';
import { WalletTransaction } from '../../../models/Database.js';

export class PayCampaignUseCase {
  constructor(private marketingRepository: IMarketingRepository) {}

  async execute(data: any) {
    const { providerId, agencyId, adBudget, agencyFee, payWithWallet, title } = data;
    
    const adBudgetNum = Number(adBudget || 0);
    const agencyFeeNum = Number(agencyFee || 0);

    if (adBudgetNum < 0 || agencyFeeNum < 0) {
      throw new Error('Budgets cannot be negative');
    }
    
    const totalAmount = adBudgetNum + agencyFeeNum;

    if (payWithWallet) {
      const wallet = await this.marketingRepository.findWalletByProvider(Number(providerId));
      if (!wallet || wallet.balance < totalAmount) {
        throw new Error('عذراً، رصيد المحفظة الذكية غير كافٍ لتمويل هذه الحملة!');
      }

      wallet.balance -= totalAmount;
      await wallet.save();

      await WalletTransaction.create({
        providerId: Number(providerId),
        type: 'commission_charge',
        description: `تمويل حملة تسويقية: ${title || 'حملة جديدة'}`,
        amount: -totalAmount,
        status: 'completed',
        date: new Date()
      });
    }

    const campaign = await this.marketingRepository.createCampaign(Number(providerId), agencyId || 'agency-1', {
      ...data,
      status: 'active',
      workflowStatus: 'In Progress'
    });

    return campaign;
  }
}
