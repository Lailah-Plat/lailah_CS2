/**
 * @file LPASResolverService.ts
 * @description Smart Dynamic Resolver & SEO Engine for Lailah LPAS.
 * Resolves static & dynamic Landing Pages for any combination of City × Category × ProviderType,
 * generates Schema.org JSON-LD structured data, canonical URLs, and dynamic Sitemap XML.
 */

import { LPASLandingPage, LPASPageType } from '../types/lpas';
import { getLPASPages } from '../data/lpasData';

export interface LPASCityMeta {
  id: string;
  nameAr: string;
  regionAr: string;
  popularDistricts: string[];
}

export interface LPASCategoryMeta {
  id: string;
  nameAr: string;
  descriptionAr: string;
  iconName: string;
  providerType: 'VENUE' | 'SERVICE_PROVIDER';
}

export const SUPPORTED_LPAS_CITIES: Record<string, LPASCityMeta> = {
  'riyadh': {
    id: 'riyadh',
    nameAr: 'الرياض',
    regionAr: 'منطقة الرياض',
    popularDistricts: ['شمال الرياض', 'الياسمين', 'الصحافة', 'الملقا', 'الدرعية', 'الخرج']
  },
  'jeddah': {
    id: 'jeddah',
    nameAr: 'جدة',
    regionAr: 'منطقة مكة المكرمة',
    popularDistricts: ['الشاطئ', 'الأبحر الشمالية', 'الزهراء', 'الخالدية', 'الصفا']
  },
  'dammam': {
    id: 'dammam',
    nameAr: 'الدمام',
    regionAr: 'المنطقة الشرقية',
    popularDistricts: ['الشاطئ الشرقي', 'حي الفيصلية', 'حي الضباب', 'حي النزهة']
  },
  'khobar': {
    id: 'khobar',
    nameAr: 'الخبر',
    regionAr: 'المنطقة الشرقية',
    popularDistricts: ['الحزام الذهبي', 'الكرنيش', 'العزيزية', 'الروابي']
  },
  'dhahran': {
    id: 'dhahran',
    nameAr: 'الظهران',
    regionAr: 'المنطقة الشرقية',
    popularDistricts: ['حي الدوحة', 'حي الجامعة', 'حي الجلوية']
  },
  'makkah': {
    id: 'makkah',
    nameAr: 'مكة المكرمة',
    regionAr: 'منطقة مكة المكرمة',
    popularDistricts: ['العزيزية', 'الشوقية', 'العوالي', 'النوارية']
  },
  'madinah': {
    id: 'madinah',
    nameAr: 'المدينة المنورة',
    regionAr: 'منطقة المدينة المنورة',
    popularDistricts: ['الحزام العربي', 'العزيزية', 'سيد الشهداء']
  },
  'qassim': {
    id: 'qassim',
    nameAr: 'القصيم',
    regionAr: 'منطقة القصيم',
    popularDistricts: ['بريدة', 'عنيزة', 'الرس']
  }
};

export const SUPPORTED_LPAS_CATEGORIES: Record<string, LPASCategoryMeta> = {
  'venue': {
    id: 'venue',
    nameAr: 'قاعات واستراحات الأفراح والمناسبات',
    descriptionAr: 'قصور الأفراح، قاعات الفنادق، الاستراحات، والمنتجعات المخصصة للاحتفالات.',
    iconName: 'Building2',
    providerType: 'VENUE'
  },
  'catering': {
    id: 'catering',
    nameAr: 'الضيافة والقهوة والبوفيهات',
    descriptionAr: 'بوفيهات مفتوحة، صواني حلى، طواقم صبابين وقهوجية، وقهوة سعودية أصيلة.',
    iconName: 'Utensils',
    providerType: 'SERVICE_PROVIDER'
  },
  'photography': {
    id: 'photography',
    nameAr: 'التصوير والتوثيق المباشر',
    descriptionAr: 'تصوير فوتوغرافي وسينمائي، طائرات درون، وألبومات حرارية للأعراس والمناسبات.',
    iconName: 'Camera',
    providerType: 'SERVICE_PROVIDER'
  },
  'flowers': {
    id: 'flowers',
    nameAr: 'تنسيق الورود والأزهار',
    descriptionAr: 'تنسيق طاولات القاعات، بياضات الممر، باقات العروس، ومدخل القصر.',
    iconName: 'Sparkles',
    providerType: 'SERVICE_PROVIDER'
  },
  'decor': {
    id: 'decor',
    nameAr: 'تجهيز الكوش والديكور',
    descriptionAr: 'تصميم وتنفيذ كوشة العروس، خلفيات الإضاءة، والديكورات العصرية والشيرازي.',
    iconName: 'Crown',
    providerType: 'SERVICE_PROVIDER'
  },
  'sound-light': {
    id: 'sound-light',
    nameAr: 'الصوتيات والإضاءة والمسارح',
    descriptionAr: 'أنظمة صوتية هيدروليكية، إضاءات ليزر ومتحركة، وشاشات عرض LED.',
    iconName: 'Megaphone',
    providerType: 'SERVICE_PROVIDER'
  },
  'rentals': {
    id: 'rentals',
    nameAr: 'تأجير المستلزمات والطاولات والكراسي',
    descriptionAr: 'تأجير طاولات استقبل، كراسي نابليون وشفافة، وخيام وأدوات ضيافة.',
    iconName: 'Grid',
    providerType: 'SERVICE_PROVIDER'
  },
  'event-planning': {
    id: 'event-planning',
    nameAr: 'تنظيم وإدارة المناسبات والمعارض',
    descriptionAr: 'تنسيق وإشراف ميداني شامل لضمان نجاح الزواجات والمؤتمرات.',
    iconName: 'ShieldCheck',
    providerType: 'SERVICE_PROVIDER'
  }
};

/**
 * Main Resolver: Tries stored pages first, then dynamically generates tailored templates.
 */
export function resolveLPASPage(slugOrId: string): LPASLandingPage {
  const allPages = getLPASPages();
  const exactMatch = allPages.find(p => p.slug === slugOrId || p.id === slugOrId);

  if (exactMatch) {
    return exactMatch;
  }

  // Parse pattern from slug
  const normalizedSlug = slugOrId.toLowerCase().trim();
  let detectedCity: LPASCityMeta | undefined;
  let detectedCategory: LPASCategoryMeta | undefined;

  // Find matching city in slug
  Object.keys(SUPPORTED_LPAS_CITIES).forEach(cityKey => {
    if (normalizedSlug.includes(cityKey)) {
      detectedCity = SUPPORTED_LPAS_CITIES[cityKey];
    }
  });

  // Find matching category in slug
  Object.keys(SUPPORTED_LPAS_CATEGORIES).forEach(catKey => {
    if (normalizedSlug.includes(catKey)) {
      detectedCategory = SUPPORTED_LPAS_CATEGORIES[catKey];
    }
  });

  // Dynamic Generator for City x Category or City or Category
  if (detectedCity || detectedCategory) {
    const cityName = detectedCity ? detectedCity.nameAr : 'كافة مدن المملكة';
    const categoryName = detectedCategory ? detectedCategory.nameAr : 'خدمات المناسبات والأفراح';
    const providerType = detectedCategory ? detectedCategory.providerType : (normalizedSlug.includes('venue') ? 'VENUE' : 'SERVICE_PROVIDER');

    const generatedPage: LPASLandingPage = {
      id: `lpas-dynamic-${normalizedSlug}`,
      slug: normalizedSlug,
      pageType: (detectedCity && detectedCategory) ? 'COMBINED_TARGETED' : detectedCity ? 'GEOGRAPHIC_TARGETED' : 'CATEGORY_TARGETED',
      title: `انضم كمزود لـ ${categoryName} في ${cityName} على منصة ليلة`,
      subtitle: `منظومة استقطاب ونمو الشركاء المخصصة لـ ${categoryName} - ${cityName}`,
      badgeText: `📍 تغطية مستهدفة • ${cityName}`,
      heroHeadline: `وصل خدمات ${categoryName} الخاصة بك إلى آلاف العملاء في ${cityName}`,
      heroSubheadline: `اعرض أعمالك وباقاتك في منصة ليلة، استقبال الحجوزات والعربين المباشرة، وحقق أعلى نسبة إشغال لخدماتك في ${cityName}.`,
      heroImageUrl: providerType === 'VENUE' 
        ? 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80'
        : 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
      
      targetProviderType: providerType,
      targetCityId: detectedCity ? (detectedCity.id as any) : 'all',
      targetCityNameAr: cityName,
      targetCategoryId: detectedCategory ? (detectedCategory.id as any) : 'all',
      targetCategoryNameAr: categoryName,

      seoTitle: `انضم كمزود ${categoryName} في ${cityName} - منصة ليلة`,
      seoDescription: `سجل نشاطك في ${categoryName} بمدينة ${cityName} واستقبل طلبات الحجز والعربون المؤكد مباشرة عبر منصة ليلة.`,
      keywords: [categoryName, cityName, 'منصة ليلة', 'حجز مناسبات', 'تسجيل مزود'],

      benefits: [
        {
          id: 'dyn_b1',
          iconName: 'TrendingUp',
          title: `زيادة المبيعات والوصول الفوري في ${cityName}`,
          description: `ربط نشاطك بالعملاء النشطين الذين يبحثون حالياً عن ${categoryName} في ${cityName}.`,
          highlightText: `نمو المبيعات بـ ${cityName}`
        },
        {
          id: 'dyn_b2',
          iconName: 'CalendarCheck',
          title: 'تقويم حي وتأكيد حجز بدون تعارض',
          description: 'جدولة الحجوزات والتوفر ومنع أي تداخل زمني تلقائياً.',
          highlightText: 'تقويم ذكي حي'
        },
        {
          id: 'dyn_b3',
          iconName: 'ShieldCheck',
          title: 'تحصيل آمن للعربون والمدفوعات',
          description: 'استلام العربون آلياً لحجز التاريخ وتوفير سندات وإيصالات رسمية.',
          highlightText: 'عربين مؤكدة 100%'
        }
      ],

      processSteps: [
        {
          stepNumber: 1,
          title: 'أدخل بيانات النشاط والباقات',
          description: `حدد أسعار ${categoryName} وصور الأعمال المتاحة في ${cityName}.`,
          iconName: 'UserPlus'
        },
        {
          stepNumber: 2,
          title: 'مراجعة واعتماد الحساب',
          description: 'التحقق السريع من البيانات لتنشيط ظهورك في محرك البحث.',
          iconName: 'BadgeCheck'
        },
        {
          stepNumber: 3,
          title: 'استقبل الحجوزات والعرابين',
          description: 'وصول الطلبات المؤكدة مباشرة مع تفاصيل العميل والموعد.',
          iconName: 'Sparkles'
        }
      ],

      keyFeatures: [
        {
          title: `تخصيص كامل لخدمات ${categoryName}`,
          description: `لوحة تحكم مرنة تتيح لك تخصيص الأسعار حسب مواسم الزواجات والمناسبات في ${cityName}.`,
          badgeText: 'تأقلم ذكي',
          iconName: 'Sliders'
        }
      ],

      testimonials: [
        {
          id: 'dyn_t1',
          providerName: 'أحد شركاء النجاح المعتمدين',
          businessName: `مركز ${categoryName}`,
          city: cityName,
          quote: `الانضمام لـ ليلة منحنا استقراراً في الحجوزات وزيادة ملحوظة في الإقبال بمدينة ${cityName}.`,
          rating: 5,
          highlightTag: 'شريك معتمد'
        }
      ],

      faqItems: [
        {
          question: `كيف أضمن وصول طلبات ${categoryName} في ${cityName}؟`,
          answer: `تظهر خدماتك للعملاء عند تصفح خريطة وقوائم ${cityName}، وتصلك التنبيهات الفورية فور الحجز.`
        }
      ],

      primaryCTATtext: `أضف خدماتك في ${cityName} الآن`,
      primaryCTASubtitle: 'التسجيل بسيط ومباشر بدون رسوم تأسيس',
      secondaryCTATtext: 'استكشف شروط المزايا والاشتراكات',

      isActive: true,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0]
    };

    return generatedPage;
  }

  // Fallback to General Parent Landing Page
  return allPages[0];
}

/**
 * Generates Schema.org JSON-LD Structured Data for high Google ranking
 */
export function generateSchemaOrgJSONLD(page: LPASLandingPage) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": page.title,
    "description": page.seoDescription,
    "provider": {
      "@type": "Organization",
      "name": "منصة ليلة للمناسبات (Lailah Platform)",
      "url": "https://lailah.sa",
      "logo": "https://lailah.sa/logo.png"
    },
    "areaServed": {
      "@type": "AdministrativeArea",
      "name": page.targetCityNameAr || "المملكة العربية السعودية"
    },
    "category": page.targetCategoryNameAr || "خدمات وقاعات المناسبات",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "SAR",
      "availability": "https://schema.org/InStock"
    }
  };
}

/**
 * Dynamic Sitemap Generator
 */
export function generateLPASSitemapXML(): string {
  const basePages = getLPASPages();
  const cities = Object.keys(SUPPORTED_LPAS_CITIES);
  const categories = Object.keys(SUPPORTED_LPAS_CATEGORIES);

  const urls: string[] = [];

  // Static defined pages
  basePages.forEach(p => {
    urls.push(`
    <url>
      <loc>https://lailah.sa?lpas_page=${p.slug}</loc>
      <lastmod>${p.updatedAt || '2026-08-10'}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${p.pageType === 'ACQUISITION_GENERAL' ? '1.0' : '0.8'}</priority>
    </url>`);
  });

  // Dynamic Combinations (City x Category)
  cities.forEach(city => {
    categories.forEach(cat => {
      urls.push(`
    <url>
      <loc>https://lailah.sa?lpas_page=${cat}-${city}</loc>
      <lastmod>2026-08-10</lastmod>
      <changefreq>monthly</changefreq>
      <priority>0.7</priority>
    </url>`);
    });
  });

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemapindex.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;
}
