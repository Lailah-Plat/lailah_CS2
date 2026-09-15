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

// GET active subscription and overrides for a provider (legacy/basic format)
router.get('/provider/:providerId', controller.getProviderSubscription);

// GET Effective Entitlements (Single Source of Truth)
router.get('/provider/:providerId/entitlements', controller.getEffectiveEntitlements);
router.get('/me/entitlements', controller.getEffectiveEntitlements);

// GET Centralized Feature Registry
router.get('/entitlements/feature-registry', controller.getFeatureRegistry);

// GET Entitlement Audit Logs
router.get('/audit-logs', controller.getAuditLogs);

// Admin Grants & Promotional Entitlements Endpoints (P1.5)
router.get('/grants', controller.listAdminGrants);
router.post('/grant', controller.createAdminGrant);
router.post('/grant/subscription', controller.grantSubscription);
router.post('/grant/discount', controller.grantDiscount);
router.post('/grant/bulk', controller.createBulkGrant);
router.post('/grant/revoke', controller.revokeAdminGrant);
router.post('/grants/process-expired', controller.processExpiredGrants);

// Feature Marketplace Add-on Lifecycle Endpoints
router.post('/addon/request-purchase', controller.requestAddonPurchase);
router.post('/addon/activate', controller.activateAddon);
router.post('/addon/activate-verified', controller.activateAddon);
router.post('/addon/renew', controller.renewAddon);
router.post('/addon/expire', controller.expireAddon);
router.post('/addon/cancel', controller.cancelAddon);
router.post('/addon/refund', controller.refundAddon);
router.post('/addon/revoke', controller.revokeAddon);

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

// Unified Subscription Lifecycle State Machine Endpoints
router.post('/lifecycle/create', controller.createSubscriptionLifecycle);
router.post('/lifecycle/upgrade', controller.upgradeSubscriptionLifecycle);
router.post('/lifecycle/downgrade', controller.downgradeSubscriptionLifecycle);
router.post('/lifecycle/renew', controller.renewSubscriptionLifecycle);
router.post('/lifecycle/grace', controller.startGracePeriodLifecycle);
router.post('/lifecycle/expire', controller.expireSubscriptionLifecycle);
router.post('/lifecycle/cancel', controller.cancelSubscriptionLifecycle);
router.post('/lifecycle/payment-failed', controller.paymentFailureLifecycle);

// P1.6 — Financial Quotes & Billing Integrity Endpoints
router.post('/quote/subscription', controller.generateSubscriptionQuote);
router.post('/quote/addon', controller.generateAddonQuote);
router.get('/quote/:quoteId', controller.getQuote);
router.post('/activate-with-payment', controller.activateSubscriptionWithPayment);
router.post('/reconcile', controller.runReconciliation);
router.get('/test-integrity', controller.runIntegrityTests);
router.post('/test-integrity', controller.runIntegrityTests);

export default router;

