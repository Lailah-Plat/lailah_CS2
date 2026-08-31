import { Router } from 'express';
import { FinanceController } from './finance.controller.js';
import { PaymentThresholdsController } from './paymentThresholds.controller.js';
import { PaymentTokensController } from './paymentTokens.controller.js';

const router = Router();
const controller = new FinanceController();
const paymentThresholdsController = new PaymentThresholdsController();
const paymentTokensController = new PaymentTokensController();

// Saved Payment Tokens for Customers & Providers
router.get('/payment-tokens', (req, res) => paymentTokensController.getTokens(req, res));
router.post('/payment-tokens', (req, res) => paymentTokensController.saveToken(req, res));
router.put('/payment-tokens/:tokenId/default', (req, res) => paymentTokensController.setDefaultToken(req, res));
router.put('/payment-tokens/:tokenId/auto-renewal', (req, res) => paymentTokensController.toggleAutoRenewal(req, res));
router.delete('/payment-tokens/:tokenId', (req, res) => paymentTokensController.deleteToken(req, res));
router.post('/payment-tokens/one-click-pay', (req, res) => paymentTokensController.processOneClickPayment(req, res));

// Provider Payout Accounts (Connected Account, Beneficiary Token, Bank IBAN)
router.get('/payout-accounts', (req, res) => paymentTokensController.getPayoutAccounts(req, res));
router.post('/payout-accounts', (req, res) => paymentTokensController.savePayoutAccount(req, res));

// Core financial statistics and isolation queries
router.get('/stats', controller.getStats);

// Payment Gateway Thresholds & SAMA Limits
router.get('/payment-thresholds', (req, res) => paymentThresholdsController.getThresholds(req, res));
router.post('/payment-thresholds', (req, res) => paymentThresholdsController.saveThresholds(req, res));

// Operational transaction endpoints
router.post('/expense', controller.addExpense);
router.post('/revenue', controller.addRevenue);

// Custom platform categories configuration
router.get('/revenue-types', controller.getRevenueTypes);
router.post('/revenue-types', controller.createRevenueType);
router.put('/revenue-types/:id', controller.updateRevenueType);
router.delete('/revenue-types/:id', controller.deleteRevenueType);

router.get('/expense-categories', controller.getExpenseCategories);
router.post('/expense-categories', controller.createExpenseCategory);
router.put('/expense-categories/:id', controller.updateExpenseCategory);
router.delete('/expense-categories/:id', controller.deleteExpenseCategory);

// Escrow settlement and payout workflows
router.post('/complete-booking', controller.completeBooking);
router.post('/withdraw', controller.withdraw);
router.post('/settle-claim', controller.settleClaim);
router.post('/release-funds', controller.releaseFunds);
router.post('/trigger-cron', controller.triggerCron);
router.post('/process-payout', controller.processPayout);
router.post('/payout-webhook', controller.handlePayoutWebhook);

// Unified ledger and settlements
router.get('/settlements', controller.getSettlements);
router.post('/settlements/approve', controller.approveSettlement);
router.get('/ledger', controller.getLedgerEntries);

// AI & Document export systems
router.post('/forecast-ai', controller.forecastAI);
router.post('/generate-pdf', controller.generatePDF);

// Customer wallet management
router.get('/customer-wallets', controller.getCustomerWallets);
router.post('/customer-wallets/convert', controller.convertForceMajeureBalance);
router.post('/customer-wallets/issue-credit', controller.issueCredit);

export default router;
