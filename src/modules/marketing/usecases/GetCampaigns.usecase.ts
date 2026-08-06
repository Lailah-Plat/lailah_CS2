import { IMarketingRepository } from '../marketing.repository.js';

export class GetCampaignsUseCase {
  constructor(private marketingRepository: IMarketingRepository) {}

  async execute(role: string, userId: string) {
    let whereClause = {};
    if (role === 'provider') whereClause = { providerId: Number(userId) };
    if (role === 'agency') whereClause = { agencyId: userId };

    const campaigns = await this.marketingRepository.getCampaigns(whereClause);

    return campaigns.map((c: any) => {
      const plain = c.get({ plain: true });
      return {
        ...plain,
        providerName: plain.providerUser ? plain.providerUser.name : 'مزود خدمة'
      };
    });
  }
}
