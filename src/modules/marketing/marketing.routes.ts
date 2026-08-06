import express from 'express';
import { MarketingController } from './marketing.controller.js';

const router = express.Router();
const controller = new MarketingController();

// Mock RBAC Middleware
const checkRole = (roles: string[]) => (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userRole = (req.headers['x-user-role'] as string) || 'provider';
  if (!roles.includes(userRole)) {
    return res.status(403).json({ error: 'Access Denied' });
  }
  next();
};

// Campaigns
router.get('/campaigns', checkRole(['provider', 'agency', 'admin']), controller.getCampaigns);
router.put('/campaigns/:id/workflow', checkRole(['provider', 'agency', 'admin']), controller.updateCampaignWorkflow);
router.post('/pay-campaign', checkRole(['provider', 'admin']), controller.payCampaign);
router.post('/register-expense', checkRole(['agency', 'admin']), controller.registerExpense);

// Favorites Count and Retargeting
router.get('/favorites-count/:hallId', checkRole(['provider', 'admin']), controller.getFavoritesCount);
router.post('/retarget-favorites', checkRole(['provider', 'admin']), controller.retargetFavorites);

export default router;
