/**
 * @file legal.routes.ts
 * @description Express routes for Legal CMS and Sovereign Policy Config.
 */

import { Router } from 'express';
import { legalController } from './legal.controller.js';

export const legalRouter = Router();

// Public endpoints
legalRouter.get('/content/:documentType', (req, res) => legalController.getPublishedDocument(req, res));
legalRouter.get('/faqs', (req, res) => legalController.getFaqs(req, res));

// Direct Document endpoints (Admin / CMS Manager)
legalRouter.get('/documents/:documentType/history', (req, res) => legalController.getDocumentHistory(req, res));
legalRouter.get('/documents/:documentType', (req, res) => legalController.getPublishedDocument(req, res));
legalRouter.post('/documents', (req, res) => legalController.saveDocumentVersion(req, res));

// Direct FAQ endpoints (Admin / CMS Manager)
legalRouter.get('/faqs/admin', (req, res) => legalController.listAllFaqsAdmin(req, res));
legalRouter.post('/faqs', (req, res) => legalController.upsertFaq(req, res));
legalRouter.put('/faqs/:id', (req, res) => legalController.upsertFaq(req, res));
legalRouter.delete('/faqs/:id', (req, res) => legalController.deleteFaq(req, res));

// Admin prefixed endpoints (Compatibility)
legalRouter.get('/admin/documents', (req, res) => legalController.listAllDocuments(req, res));
legalRouter.post('/admin/documents', (req, res) => legalController.saveDocumentVersion(req, res));
legalRouter.get('/admin/faqs', (req, res) => legalController.listAllFaqsAdmin(req, res));
legalRouter.post('/admin/faqs', (req, res) => legalController.upsertFaq(req, res));
legalRouter.delete('/admin/faqs/:id', (req, res) => legalController.deleteFaq(req, res));

// Sovereign Policy Config (Admin)
legalRouter.get('/sovereign-policy-config', (req, res) => legalController.getSovereignPolicyConfig(req, res));
legalRouter.post('/sovereign-policy-config', (req, res) => legalController.updateSovereignPolicyConfig(req, res));

// Seed & Reset Defaults (Admin & System Setup)
legalRouter.post('/seed-defaults', (req, res) => legalController.seedDefaults(req, res));
legalRouter.post('/admin/seed-defaults', (req, res) => legalController.seedDefaults(req, res));
