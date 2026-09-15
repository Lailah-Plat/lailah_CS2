/**
 * @file legalCmsService.ts
 * @description Centralized Legal & Content CMS Service with Versioning, Capability-based conditional visibility, and Audit logging (P1.9).
 */

import { LegalDocument, FAQItem, LegalSectionItem, seedDefaultLegalContent } from '../../models/LegalModels.js';
import { bookingPolicyService } from '../bookingPolicy/bookingPolicyService.js';

export interface GetDocumentOptions {
  documentType: string;
  viewerCapabilities?: string[];
  includeDrafts?: boolean;
}

export function normalizeDocumentType(type: string): string {
  if (!type) return 'terms';
  const clean = type.toLowerCase().trim();
  if (clean.includes('term')) return 'terms';
  if (clean.includes('privac')) return 'privacy';
  if (clean.includes('about')) return 'about';
  if (clean.includes('faq')) return 'faq';
  return clean;
}

export class LegalCmsService {
  private static instance: LegalCmsService;

  private constructor() {
    // Ensure seeding on initialization
    seedDefaultLegalContent().catch(err => {
      console.warn('[LegalCmsService] Seed error:', err.message);
    });
  }

  public static getInstance(): LegalCmsService {
    if (!LegalCmsService.instance) {
      LegalCmsService.instance = new LegalCmsService();
    }
    return LegalCmsService.instance;
  }

  /**
   * Retrieves a legal document.
   * If viewerCapabilities is passed, filters out sections that require specific capabilities not present.
   */
  public async getPublishedDocument(options: GetDocumentOptions): Promise<{
    document: LegalDocument | null;
    visibleSections: LegalSectionItem[];
  }> {
    const normType = normalizeDocumentType(options.documentType);
    const viewerCapabilities = options.viewerCapabilities || [];

    let doc = await LegalDocument.findOne({
      where: { documentType: normType, status: 'published' },
      order: [['publishedAt', 'DESC'], ['id', 'DESC']]
    });

    if (!doc) {
      // Fallback search without lowercase
      doc = await LegalDocument.findOne({
        where: { documentType: options.documentType, status: 'published' },
        order: [['publishedAt', 'DESC'], ['id', 'DESC']]
      });
    }

    if (!doc) {
      // If not seeded yet, try seeding
      await seedDefaultLegalContent();
      doc = await LegalDocument.findOne({
        where: { documentType: normType, status: 'published' },
        order: [['publishedAt', 'DESC'], ['id', 'DESC']]
      });
    }

    if (!doc) {
      return { document: null, visibleSections: [] };
    }

    const rawSections: LegalSectionItem[] = Array.isArray(doc.sections) ? doc.sections : [];

    // Filter sections based on published flag and requiredCapability
    const visibleSections = rawSections
      .filter(sec => sec.isPublished !== false && (sec as any).isActive !== false)
      .filter(sec => {
        if (!sec.requiredCapability) return true;
        // If viewer has capability or if viewer is unrestricted (e.g. general terms)
        if (viewerCapabilities.length === 0) return true;
        return viewerCapabilities.includes(sec.requiredCapability);
      })
      .sort((a, b) => ((a.orderIndex ?? (a as any).order ?? 0) - (b.orderIndex ?? (b as any).order ?? 0)));

    return {
      document: doc,
      visibleSections
    };
  }

  /**
   * Admin: List all versions of all legal documents.
   */
  public async listAllVersions(documentType?: string): Promise<LegalDocument[]> {
    const where: any = {};
    if (documentType) {
      const normType = normalizeDocumentType(documentType);
      where.documentType = normType;
    }
    return await LegalDocument.findAll({
      where,
      order: [['updatedAt', 'DESC']]
    });
  }

  /**
   * Admin: Save a draft or publish a new version of a legal document.
   */
  public async saveDocumentVersion(params: {
    documentType: string;
    version: string;
    title: string;
    subtitle?: string;
    introText?: string;
    contentAr?: string;
    contentEn?: string;
    sections: LegalSectionItem[];
    status: 'draft' | 'published' | 'DRAFT' | 'PUBLISHED';
    changeSummary?: string;
    effectiveAt?: Date | string;
    adminUser?: { id: number; name: string };
  }): Promise<LegalDocument> {
    const {
      documentType,
      version,
      title,
      subtitle,
      introText,
      contentAr,
      contentEn,
      sections,
      status,
      changeSummary,
      effectiveAt,
      adminUser
    } = params;

    const normType = normalizeDocumentType(documentType);
    const normalizedStatus = String(status).toLowerCase() === 'published' ? 'published' : 'draft';
    const publishedAt = normalizedStatus === 'published' ? new Date() : null;

    const doc = await LegalDocument.create({
      documentType: normType,
      version: version || 'v' + Date.now(),
      title,
      subtitle: subtitle || null,
      introText: introText || null,
      contentAr: contentAr || introText || title,
      contentEn: contentEn || null,
      sections: sections || [],
      status: normalizedStatus,
      publishedAt,
      effectiveAt: effectiveAt ? new Date(effectiveAt) : new Date(),
      changedBy: adminUser ? `${adminUser.name} (ID: ${adminUser.id})` : 'Admin',
      changeSummary: changeSummary || 'تحديث عبر لوحة تحكم الإدارة'
    });

    // Record Audit
    await bookingPolicyService.recordPolicyChangeAudit({
      providerId: 0,
      resourceType: 'legal_cms',
      resourceId: doc.id,
      resourceName: `${normType.toUpperCase()} (${version})`,
      oldPolicy: 'PREVIOUS_VERSION',
      newPolicy: `${normalizedStatus.toUpperCase()}: ${version}`,
      actorId: adminUser?.id || null,
      actorRole: 'admin',
      reason: changeSummary || `تحديث ونشر وثيقة (${normType}) إصدار (${version})`
    });

    return doc;
  }

  /**
   * Retrieves FAQ items filtered by audience and capability.
   */
  public async getFaqs(params: {
    audience?: 'CUSTOMER' | 'PROVIDER' | 'GENERAL' | 'ALL';
    viewerCapabilities?: string[];
    category?: string;
  }): Promise<FAQItem[]> {
    const { audience = 'ALL', viewerCapabilities = [], category } = params;

    const where: any = { isPublished: true };

    if (audience && audience !== 'ALL') {
      where.audience = audience;
    }

    if (category) {
      where.category = category;
    }

    const items = await FAQItem.findAll({
      where,
      order: [['orderIndex', 'ASC'], ['id', 'ASC']]
    });

    return items.filter(item => {
      if (!item.requiredCapability) return true;
      if (viewerCapabilities.length === 0) return true;
      return viewerCapabilities.includes(item.requiredCapability);
    });
  }

  /**
   * Admin: List all FAQs including unpublished.
   */
  public async listAllFaqsAdmin(): Promise<FAQItem[]> {
    return await FAQItem.findAll({
      order: [['audience', 'ASC'], ['orderIndex', 'ASC']]
    });
  }

  /**
   * Admin: Create or update a FAQ item.
   */
  public async upsertFaq(data: {
    id?: number;
    question: string;
    answer: string;
    audience: 'CUSTOMER' | 'PROVIDER' | 'GENERAL';
    category?: string;
    orderIndex?: number;
    isPublished?: boolean;
    requiredCapability?: string | null;
    adminUser?: { id: number; name: string };
  }): Promise<FAQItem> {
    if (data.id) {
      const existing = await FAQItem.findByPk(data.id);
      if (existing) {
        await existing.update({
          question: data.question,
          answer: data.answer,
          audience: data.audience,
          category: data.category || existing.category,
          orderIndex: data.orderIndex ?? existing.orderIndex,
          isPublished: data.isPublished ?? existing.isPublished,
          requiredCapability: data.requiredCapability !== undefined ? data.requiredCapability : existing.requiredCapability
        });
        return existing;
      }
    }

    return await FAQItem.create({
      question: data.question,
      answer: data.answer,
      audience: data.audience || 'GENERAL',
      category: data.category || 'عام',
      orderIndex: data.orderIndex || 0,
      isPublished: data.isPublished ?? true,
      requiredCapability: data.requiredCapability || null
    });
  }

  /**
   * Admin: Delete FAQ item.
   */
  public async deleteFaq(id: number): Promise<boolean> {
    const count = await FAQItem.destroy({ where: { id } });
    return count > 0;
  }
}

export const legalCmsService = LegalCmsService.getInstance();
