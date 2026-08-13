/**
 * @file lpas.ts
 * @description Lailah Provider Acquisition & Landing Page System (LPAS) Type Definitions.
 * Defines the schema for dynamic landing pages, templates, geographic targeting, category targeting,
 * UTM attribution context, and registration routing.
 */

export type LPASPageType = 
  | 'ACQUISITION_GENERAL'       // الصفحة الأم العامة لاكتساب المزودين
  | 'ACQUISITION_VENUES'        // صفحة اكتساب القاعات والاستراحات
  | 'ACQUISITION_SERVICES'      // الصفحة الأم لمزودي الخدمات المساندة
  | 'CATEGORY_TARGETED'         // صفحة هبوط فئة خدمة محددة (ضيافة، تصوير، ورد، إلخ)
  | 'GEOGRAPHIC_TARGETED'       // صفحة هبوط مدينة محددة (الرياض، جدة، الشرقية)
  | 'COMBINED_TARGETED'         // صفحة هبوط مركبة (مدينة × فئة أو مدينة × قاعات)
  | 'SEASONAL_CAMPAIGN';        // صفحة حملة موسمية أو إعلانية مؤقتة

export interface LPASValueBenefit {
  id: string;
  iconName: string;
  title: string;
  description: string;
  highlightText?: string;
}

export interface LPASProcessStep {
  stepNumber: number;
  title: string;
  description: string;
  iconName: string;
}

export interface LPASFeature {
  title: string;
  description: string;
  badgeText?: string;
  iconName: string;
}

export interface LPASTestimonial {
  id: string;
  providerName: string;
  businessName: string;
  city: string;
  avatarUrl?: string;
  quote: string;
  rating: number;
  highlightTag: string;
}

export interface LPASFAQItem {
  question: string;
  answer: string;
  category?: string;
}

export interface LPASAttributionContext {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  utmContent?: string;
  utmTerm?: string;
  landingPageId: string;
  campaignId?: string;
  targetProviderType: 'VENUE' | 'SERVICE_PROVIDER' | 'ALL';
  targetCategory?: string;
  targetCity?: string;
  referrerUrl?: string;
  timestamp: number;
}

export interface LPASLandingPage {
  id: string;
  slug: string; // E.g., 'venues-riyadh', 'catering-jeddah', 'wedding-season'
  pageType: LPASPageType;
  title: string;
  subtitle: string;
  badgeText?: string;
  heroHeadline: string;
  heroSubheadline: string;
  heroImageUrl: string;
  
  // Targeting metadata
  targetCityId?: 'riyadh' | 'jeddah' | 'dammam' | 'khobar' | 'all';
  targetCityNameAr?: string;
  targetCategoryId?: 'venue' | 'catering' | 'flowers' | 'photography' | 'sound-light' | 'rentals' | 'hospitality' | 'decor' | 'all';
  targetCategoryNameAr?: string;
  targetProviderType: 'VENUE' | 'SERVICE_PROVIDER' | 'ALL';

  // SEO & Social Sharing
  seoTitle: string;
  seoDescription: string;
  keywords: string[];

  // Page Content Sections
  benefits: LPASValueBenefit[];
  processSteps: LPASProcessStep[];
  keyFeatures: LPASFeature[];
  testimonials: LPASTestimonial[];
  faqItems: LPASFAQItem[];

  // Primary & Secondary CTAs
  primaryCTATtext: string;
  primaryCTASubtitle?: string;
  secondaryCTATtext?: string;

  // Status & Campaign details
  isActive: boolean;
  campaignCode?: string;
  createdAt: string;
  updatedAt: string;
}
