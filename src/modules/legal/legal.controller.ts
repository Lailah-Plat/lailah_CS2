/**
 * @file legal.controller.ts
 * @description Controller for Legal & Content CMS and FAQs.
 */

import { Request, Response } from 'express';
import { legalCmsService } from '../../services/legal/legalCmsService.js';
import { bookingPolicyService } from '../../services/bookingPolicy/bookingPolicyService.js';

export class LegalController {
  /**
   * GET /api/legal/content/:documentType or GET /api/legal/documents/:documentType
   * Public / Admin: Get published legal document with capability-filtered sections
   */
  public async getPublishedDocument(req: Request, res: Response): Promise<void> {
    try {
      const { documentType } = req.params;
      const capabilitiesQuery = req.query.capabilities;
      let viewerCapabilities: string[] = [];

      if (typeof capabilitiesQuery === 'string') {
        viewerCapabilities = capabilitiesQuery.split(',').map(s => s.trim());
      } else if (Array.isArray(capabilitiesQuery)) {
        viewerCapabilities = capabilitiesQuery.map(String);
      }

      const result = await legalCmsService.getPublishedDocument({
        documentType: documentType as any,
        viewerCapabilities
      });

      if (!result.document) {
        res.status(404).json({ success: false, error: 'الوثيقة غير موجودة' });
        return;
      }

      const docData = {
        id: result.document.id,
        documentType: result.document.documentType,
        version: result.document.version,
        title: result.document.title,
        subtitle: result.document.subtitle,
        introText: result.document.introText,
        contentAr: result.document.contentAr,
        contentEn: result.document.contentEn,
        sections: result.visibleSections,
        status: result.document.status,
        publishedAt: result.document.publishedAt,
        effectiveAt: result.document.effectiveAt,
        changeSummary: result.document.changeSummary
      };

      // Support direct object return when requested by LegalCmsManager or standard { success, data }
      if (req.path.startsWith('/documents/')) {
        res.json(docData);
      } else {
        res.json({
          success: true,
          data: docData
        });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/legal/documents/:documentType/history
   * Admin: List all versions of a document
   */
  public async getDocumentHistory(req: Request, res: Response): Promise<void> {
    try {
      const { documentType } = req.params;
      const docs = await legalCmsService.listAllVersions(documentType);
      res.json(docs);
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/legal/faqs
   * Public: Get published FAQs
   */
  public async getFaqs(req: Request, res: Response): Promise<void> {
    try {
      const audience = (req.query.audience as any) || 'ALL';
      const category = req.query.category as string;
      const capabilitiesQuery = req.query.capabilities;
      let viewerCapabilities: string[] = [];

      if (typeof capabilitiesQuery === 'string') {
        viewerCapabilities = capabilitiesQuery.split(',').map(s => s.trim());
      } else if (Array.isArray(capabilitiesQuery)) {
        viewerCapabilities = capabilitiesQuery.map(String);
      }

      const items = await legalCmsService.getFaqs({
        audience,
        viewerCapabilities,
        category
      });

      res.json({
        success: true,
        data: items
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/legal/admin/documents
   * Admin: List all versions of legal documents
   */
  public async listAllDocuments(req: Request, res: Response): Promise<void> {
    try {
      const docType = req.query.documentType as string;
      const docs = await legalCmsService.listAllVersions(docType);
      res.json({ success: true, data: docs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/legal/admin/documents and POST /api/legal/documents
   * Admin: Save a draft or publish a version
   */
  public async saveDocumentVersion(req: Request, res: Response): Promise<void> {
    try {
      const {
        documentType,
        version,
        title,
        subtitle,
        introText,
        contentAr,
        contentEn,
        sections,
        status = 'published',
        changeSummary,
        effectiveAt
      } = req.body;

      if (!documentType || !title) {
        res.status(400).json({ success: false, error: 'البيانات الأساسية للوثيقة غير مكتملة' });
        return;
      }

      const user = (req as any).user || { id: 1, name: 'Admin' };

      const doc = await legalCmsService.saveDocumentVersion({
        documentType,
        version: version || 'v' + Date.now(),
        title,
        subtitle,
        introText,
        contentAr: contentAr || introText || title,
        contentEn,
        sections: sections || [],
        status,
        changeSummary: changeSummary || 'تحديث عبر لوحة تحكم الإدارة',
        effectiveAt,
        adminUser: user
      });

      if (req.path === '/documents') {
        res.json(doc);
      } else {
        res.json({ success: true, data: doc });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/legal/admin/faqs and GET /api/legal/faqs/admin
   * Admin: List all FAQs
   */
  public async listAllFaqsAdmin(req: Request, res: Response): Promise<void> {
    try {
      const faqs = await legalCmsService.listAllFaqsAdmin();
      if (req.path.startsWith('/faqs/admin')) {
        res.json(faqs);
      } else {
        res.json({ success: true, data: faqs });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/legal/admin/faqs, POST /api/legal/faqs, PUT /api/legal/faqs/:id
   * Admin: Create or update FAQ item
   */
  public async upsertFaq(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id || req.body.id;
      const { question, answer, audience, category, orderIndex, order, isPublished, isActive, requiredCapability } = req.body;

      if (!question || !answer) {
        res.status(400).json({ success: false, error: 'يرجى تقديم نص السؤال والإجابة' });
        return;
      }

      const user = (req as any).user || { id: 1, name: 'Admin' };

      const faq = await legalCmsService.upsertFaq({
        id: id ? Number(id) : undefined,
        question,
        answer,
        audience: audience || 'GENERAL',
        category: category || 'عام',
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : (order !== undefined ? Number(order) : 0),
        isPublished: isPublished !== undefined ? isPublished : (isActive !== undefined ? isActive : true),
        requiredCapability: requiredCapability || null,
        adminUser: user
      });

      if (req.path.startsWith('/faqs')) {
        res.json(faq);
      } else {
        res.json({ success: true, data: faq });
      }
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * DELETE /api/legal/admin/faqs/:id and DELETE /api/legal/faqs/:id
   * Admin: Delete FAQ item
   */
  public async deleteFaq(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await legalCmsService.deleteFaq(Number(id));
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * GET /api/legal/sovereign-policy-config
   * Admin: Get Sovereign Policy Configuration
   */
  public async getSovereignPolicyConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = await bookingPolicyService.getSovereignPolicyConfig();
      res.json({ success: true, data: config });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/legal/sovereign-policy-config
   * Admin: Update Sovereign Policy Configuration
   */
  public async updateSovereignPolicyConfig(req: Request, res: Response): Promise<void> {
    try {
      const user = (req as any).user || { id: 1, name: 'Admin' };
      const updated = await bookingPolicyService.updateSovereignPolicyConfig(req.body, user);
      res.json({ success: true, data: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * POST /api/legal/seed-defaults and POST /api/legal/admin/seed-defaults
   * Trigger default legal content & FAQs seeding
   */
  public async seedDefaults(req: Request, res: Response): Promise<void> {
    try {
      const { seedDefaultLegalContent } = await import('../../models/LegalModels.js');
      await seedDefaultLegalContent();
      res.json({ success: true, message: 'تم تهيئة المحتوى القانوني والأسئلة الشائعة بنجاح' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

export const legalController = new LegalController();
