import express from 'express';
import { SubscriptionController } from './subscription.controller.js';

const router = express.Router();
const controller = new SubscriptionController();

// GET all subscription plans
router.get('/plans', controller.getPlans);

// POST Create or edit a subscription plan
router.post('/plans', controller.createOrEditPlan);

// DELETE a subscription plan
router.delete('/plans/:id', controller.deletePlan);

// GET active subscription and overrides for a provider
router.get('/provider/:providerId', controller.getProviderSubscription);

// GET all overrides
router.get('/overrides', controller.getAllOverrides);

// GET all active subscriptions
router.get('/all', controller.getAllSubscriptions);

// POST Manual subscription upgrade
router.post('/upgrade', controller.upgradeSubscription);

// POST custom feature override
router.post('/override', controller.overrideFeature);

// POST Delete feature override
router.post('/override/delete', controller.deleteFeatureOverride);

export default router;
