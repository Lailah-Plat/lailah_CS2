import { Request, Response } from 'express';
import { SequelizeMarketingRepository } from './marketing.repository.js';
import { GetCampaignsUseCase } from './usecases/GetCampaigns.usecase.js';
import { UpdateCampaignWorkflowUseCase } from './usecases/UpdateCampaignWorkflow.usecase.js';
import { PayCampaignUseCase } from './usecases/PayCampaign.usecase.js';
import { RegisterExpenseUseCase } from './usecases/RegisterExpense.usecase.js';
import { GetFavoritesCountUseCase } from './usecases/GetFavoritesCount.usecase.js';
import { RetargetFavoritesUseCase } from './usecases/RetargetFavorites.usecase.js';

export class MarketingController {
  private marketingRepository = new SequelizeMarketingRepository();
  private getCampaignsUseCase = new GetCampaignsUseCase(this.marketingRepository);
  private updateCampaignWorkflowUseCase = new UpdateCampaignWorkflowUseCase(this.marketingRepository);
  private payCampaignUseCase = new PayCampaignUseCase(this.marketingRepository);
  private registerExpenseUseCase = new RegisterExpenseUseCase(this.marketingRepository);
  private getFavoritesCountUseCase = new GetFavoritesCountUseCase(this.marketingRepository);
  private retargetFavoritesUseCase = new RetargetFavoritesUseCase(this.marketingRepository);

  getCampaigns = async (req: Request, res: Response) => {
    try {
      const role = (req.headers['x-user-role'] as string) || 'provider';
      const userId = (req.headers['x-user-id'] as string) || '';
      const result = await this.getCampaignsUseCase.execute(role, userId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  updateCampaignWorkflow = async (req: Request, res: Response) => {
    try {
      const { workflowStatus } = req.body;
      const result = await this.updateCampaignWorkflowUseCase.execute(req.params.id, workflowStatus);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  payCampaign = async (req: Request, res: Response) => {
    try {
      const result = await this.payCampaignUseCase.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  };

  registerExpense = async (req: Request, res: Response) => {
    try {
      const result = await this.registerExpenseUseCase.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(400).json({ error: String(error) });
    }
  };

  getFavoritesCount = async (req: Request, res: Response) => {
    try {
      const { hallId } = req.params;
      const count = await this.getFavoritesCountUseCase.execute(Number(hallId));
      res.json({ count });
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };

  retargetFavorites = async (req: Request, res: Response) => {
    try {
      const result = await this.retargetFavoritesUseCase.execute(req.body);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: String(error) });
    }
  };
}
