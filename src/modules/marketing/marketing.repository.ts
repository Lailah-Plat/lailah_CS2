import { MarketingCampaign, CampaignExpense, createMarketingCampaign, addCampaignExpense } from '../../models/MarketingModels.js';
import { Wallet, WalletTransaction } from '../../models/Database.js';
import { User } from '../../models/UserModels.js';
import { Favorite } from '../../models/FavoriteModels.js';
import { Hall } from '../../models/BookingModels.js';

export interface IMarketingRepository {
  getCampaigns(where: any): Promise<MarketingCampaign[]>;
  updateCampaignWorkflow(id: string, workflowStatus: string): Promise<any>;
  findWalletByProvider(providerId: number): Promise<Wallet | null>;
  createCampaign(providerId: number, agencyId: string, campaignData: any): Promise<any>;
  registerCampaignExpense(campaignId: number, amount: number, note: string, category: string): Promise<any>;
  getFavoritesCount(hallId: number): Promise<number>;
  findHallById(id: number): Promise<Hall | null>;
  findFavoritesByHallId(hallId: number): Promise<Favorite[]>;
  findUsersByIds(ids: number[]): Promise<User[]>;
}

export class SequelizeMarketingRepository implements IMarketingRepository {
  async getCampaigns(where: any): Promise<MarketingCampaign[]> {
    return MarketingCampaign.findAll({
      where,
      include: [
        CampaignExpense,
        { model: User, as: 'providerUser', attributes: ['name'] }
      ]
    });
  }

  async updateCampaignWorkflow(id: string, workflowStatus: string): Promise<any> {
    return MarketingCampaign.update({ workflowStatus }, { where: { id } });
  }

  async findWalletByProvider(providerId: number): Promise<Wallet | null> {
    return Wallet.findOne({ where: { providerId } });
  }

  async createCampaign(providerId: number, agencyId: string, campaignData: any): Promise<any> {
    return createMarketingCampaign(providerId, agencyId, campaignData);
  }

  async registerCampaignExpense(campaignId: number, amount: number, note: string, category: string): Promise<any> {
    return addCampaignExpense(campaignId, amount, note, category);
  }

  async getFavoritesCount(hallId: number): Promise<number> {
    return Favorite.count({ where: { hallId } });
  }

  async findHallById(id: number): Promise<Hall | null> {
    return Hall.findByPk(id);
  }

  async findFavoritesByHallId(hallId: number): Promise<Favorite[]> {
    return Favorite.findAll({ where: { hallId } });
  }

  async findUsersByIds(ids: number[]): Promise<User[]> {
    return User.findAll({
      where: { id: ids },
      attributes: ['id', 'email', 'name', 'phone']
    });
  }
}
