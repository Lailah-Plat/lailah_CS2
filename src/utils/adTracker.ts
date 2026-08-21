/**
 * محرك تتبع وتنسيق الإعلانات الداخلية ونظام المطابقة المزدوجة (Placement Alias Mapping)
 * لمنصة ليلة للأفراح والمناسبات
 */

import { apiService } from '../services/apiService';

export interface InternalAdItem {
  id: number | string;
  name?: string;
  title?: string;
  location?: string;
  placement?: string;
  type?: string;
  status: string;
  views?: number;
  clicks?: number;
  revenue?: number;
  startDate?: string;
  endDate?: string;
  providerName?: string;
  advertiser?: string;
  content?: string;
  linkUrl?: string;
  imageUrl?: string;
  image?: string;
  isInternal?: boolean;
}

/**
 * خريطة المطابقة المزدوجة الشاملة لجميع المسميات الفنية والوصفية للمواقع الإعلانية
 */
export const PLACEMENT_ALIAS_DICTIONARY: Record<string, string[]> = {
  // 1. الشريط العلوي - يمين
  'top_right': [
    'شريط الإعلانات العلوي - يمين',
    'الإعلان العلوي الأول - الأيمن',
    'top_right',
    'top-right',
    'top_ad_1',
    'upper_right',
    'الإعلان العلوي 1'
  ],
  // 2. الشريط العلوي - وسط
  'top_center': [
    'شريط الإعلانات العلوي - وسط',
    'الإعلان العلوي الثاني - الأوسط',
    'top_center',
    'top-center',
    'top_ad_2',
    'upper_center',
    'الإعلان العلوي 2'
  ],
  // 3. الشريط العلوي - يسار
  'top_left': [
    'شريط الإعلانات العلوي - يسار',
    'الإعلان العلوي الثالث - الأيسر',
    'top_left',
    'top-left',
    'top_ad_3',
    'upper_left',
    'الإعلان العلوي 3'
  ],

  // 4. الشريط السفلي - يمين
  'bottom_right': [
    'شريط الإعلانات السفلي - يمين',
    'الإعلان السفلي الأول - الأيمن',
    'bottom_right',
    'bottom-right',
    'bottom_ad_1',
    'lower_right',
    'الإعلان السفلي 1'
  ],
  // 5. الشريط السفلي - وسط
  'bottom_center': [
    'شريط الإعلانات السفلي - وسط',
    'الإعلان السفلي الثاني - الأوسط',
    'bottom_center',
    'bottom-center',
    'bottom_ad_2',
    'lower_center',
    'الإعلان السفلي 2'
  ],
  // 6. الشريط السفلي - يسار
  'bottom_left': [
    'شريط الإعلانات السفلي - يسار',
    'الإعلان السفلي الثالث - الأيسر',
    'bottom_left',
    'bottom-left',
    'bottom_ad_3',
    'lower_left',
    'الإعلان السفلي 3'
  ],

  // 7. أعلى الصفحة الرئيسية / شريط الإعلان العلوي
  'hero_top': [
    'أعلى الصفحة الرئيسية',
    'شريط الإعلان العلوي',
    'hero_banner',
    'top_banner',
    'header_banner',
    'home_top',
    'شريط الإعلان الرئيسي'
  ],

  // 8. شريط جانبي في قائمة الخدمات
  'services_sidebar': [
    'شريط جانبي في قائمة الخدمات',
    'شريط جانبي (خدمات)',
    'قائمة الخدمات',
    'services_sidebar',
    'sidebar_services',
    'services-sidebar',
    'جانب الخدمات'
  ],

  // 9. أسفل تفاصيل الحجز
  'booking_details_bottom': [
    'أسفل تفاصيل الحجز',
    'تفاصيل الحجز',
    'أسفل الحجز',
    'booking_details_bottom',
    'booking_footer',
    'booking-details-bottom',
    'أسفل تفاصيل الحجز والمنشأة'
  ],

  // 10. نافذة منبثقة (Popup)
  'popup_modal': [
    'نافذة منبثقة (Popup)',
    'نافذة منبثقة',
    'نافذة منبثقة (عامة)',
    'popup',
    'modal_popup',
    'popup-modal',
    'Popup'
  ],

  // 11. نتائج البحث واستكشاف القاعات
  'explore_results': [
    'نتائج البحث (صفحة استكشاف)',
    'صفحة استكشاف',
    'نتائج البحث',
    'explore_results',
    'search_results',
    'استكشاف القاعات'
  ],

  // 12. بين بطاقات القاعات في صفحة الاستكشاف (In-feed Native Ad)
  'in_feed_explore': [
    'بين بطاقات القاعات في صفحة الاستكشاف',
    'بطاقة قاعة مميزة',
    'إعلان بين القاعات',
    'explore_in_feed',
    'in_feed_explore',
    'in-feed-explore',
    'in_feed_halls'
  ],

  // 13. أسفل الفاتورة وتأكيد الحجز (Post-Booking & Invoices)
  'post_booking_invoice': [
    'أسفل الفاتورة وتأكيد الحجز',
    'تأكيد الحجز والفاتورة',
    'خدمات ما بعد الحجز',
    'post_booking_invoice',
    'booking_success_ad',
    'invoice_footer_ad',
    'invoice_bottom'
  ],

  // 14. في شريط الهيدر الإعلاني المصغر (Top Announcement Bar)
  'top_announcement_bar': [
    'شريط الهيدر الإعلاني المصغر',
    'شريط الإعلانات العاجلة (الهيدر)',
    'شريط الإعلان المصغر',
    'top_announcement_bar',
    'announcement_bar',
    'header_bar',
    'top_bar_announcement'
  ],

  // 15. في صفحة باقات الاشتراك للمزودين (Subscription Page)
  'subscription_page': [
    'صفحة باقات الاشتراك للمزودين',
    'باقات الاشتراك',
    'إعلانات المزودين والاشتراكات',
    'subscription_page',
    'provider_subscriptions',
    'subscription_banner'
  ],

  // 16. في صفحة خريطة استكشاف الأماكن والقاعات التفاعلية المباشرة (Map Page)
  'map_explorer': [
    'صفحة خريطة استكشاف الأماكن والقاعات',
    'أسفل خريطة القاعات',
    'خريطة الاستكشاف',
    'map_explorer',
    'map_page_ad',
    'map_bottom_ad'
  ],

  // 17. في صفحة حاسبة ميزانية المناسبة الذكية والتخطيط التفاعلي (Budget Planner)
  'budget_planner': [
    'صفحة حاسبة ميزانية المناسبة',
    'حاسبة الميزانية الذكية',
    'أسفل حاسبة الميزانية',
    'budget_planner',
    'budget_page_ad',
    'budget_bottom_card'
  ],

  // 18. في صفحة التقويم الذكي (Smart Calendar Page)
  'smart_calendar': [
    'صفحة التقويم الذكي',
    'تحت شريط تصفية التقويم',
    'التقويم الذكي',
    'smart_calendar',
    'calendar_page_ad',
    'calendar_filter_ad'
  ]
};

/**
 * دالة استخراج المطابقات المزدوجة لأي مدخل فني أو وصفي
 */
export function getPlacementAliases(placement: string): string[] {
  if (!placement) return [];
  const normalized = placement.trim().toLowerCase();

  // Search through alias dictionary
  for (const [, aliases] of Object.entries(PLACEMENT_ALIAS_DICTIONARY)) {
    const isMatched = aliases.some(alias => 
      alias.toLowerCase() === normalized || 
      alias.trim() === placement.trim()
    );
    if (isMatched) {
      return aliases;
    }
  }

  // Fallback if not found in dictionary
  return [placement];
}

/**
 * دالة للتحقق مما إذا كان موقع الإعلان يتطابق مع الموقع المطلوب
 */
export function matchAdPlacement(adPlacementOrLocation: string | undefined, targetPlacement: string): boolean {
  if (!adPlacementOrLocation || !targetPlacement) return false;
  const targetAliases = getPlacementAliases(targetPlacement).map(a => a.toLowerCase().trim());
  const adAliases = getPlacementAliases(adPlacementOrLocation).map(a => a.toLowerCase().trim());

  // Check direct overlap
  return targetAliases.some(alias => adAliases.includes(alias)) || 
         targetAliases.includes(adPlacementOrLocation.toLowerCase().trim());
}

// Debounce timer for server database sync
let dbSyncTimer: any = null;

/**
 * مزامنة الإعلانات مع الخادم وقاعدة البيانات
 */
async function syncAdsToDatabase(updatedInternalAds: any[]) {
  if (dbSyncTimer) clearTimeout(dbSyncTimer);
  dbSyncTimer = setTimeout(async () => {
    try {
      await apiService.saveSystemConfigs({
        key: 'internal_ads',
        value: updatedInternalAds
      });
    } catch (err) {
      console.warn('⚠️ تعذر المزامنة الفورية مع خادم الإعلانات (سيتم الاعتماد على التخزين المحلي):', err);
    }
  }, 400);
}

/**
 * تسجيل مشاهدة إعلان وتحديث العداد في التخزين المحلي وقاعدة البيانات فورياً
 */
export function recordAdView(adId: number | string, isInternal: boolean = true) {
  try {
    let updatedAd: any = null;

    if (isInternal) {
      const stored = localStorage.getItem('internal_ads');
      if (stored) {
        const list: any[] = JSON.parse(stored);
        const updatedList = list.map(item => {
          if (String(item.id) === String(adId)) {
            const nextViews = (item.views || 0) + 1;
            updatedAd = { ...item, views: nextViews };
            return updatedAd;
          }
          return item;
        });

        localStorage.setItem('internal_ads', JSON.stringify(updatedList));
        syncAdsToDatabase(updatedList);
      }
    } else {
      const globalStored = localStorage.getItem('GLOBAL_ADS');
      if (globalStored) {
        const list: any[] = JSON.parse(globalStored);
        const updatedList = list.map(item => {
          if (String(item.id) === String(adId)) {
            const nextViews = (item.views || 0) + 1;
            updatedAd = { ...item, views: nextViews };
            return updatedAd;
          }
          return item;
        });
        localStorage.setItem('GLOBAL_ADS', JSON.stringify(updatedList));
      }
    }

    // بث حدث التحديث اللحظي لجميع مكونات النظام
    window.dispatchEvent(new CustomEvent('layla_internal_ads_updated', {
      detail: { adId, type: 'view', updatedAd }
    }));
  } catch (err) {
    console.error('Error recording ad view:', err);
  }
}

/**
 * تسجيل نقرة على إعلان وتحديث العداد في التخزين المحلي وقاعدة البيانات فورياً
 */
export function recordAdClick(adId: number | string, isInternal: boolean = true) {
  try {
    let updatedAd: any = null;

    if (isInternal) {
      const stored = localStorage.getItem('internal_ads');
      if (stored) {
        const list: any[] = JSON.parse(stored);
        const updatedList = list.map(item => {
          if (String(item.id) === String(adId)) {
            const nextClicks = (item.clicks || 0) + 1;
            updatedAd = { ...item, clicks: nextClicks };
            return updatedAd;
          }
          return item;
        });

        localStorage.setItem('internal_ads', JSON.stringify(updatedList));
        syncAdsToDatabase(updatedList);
      }
    } else {
      const globalStored = localStorage.getItem('GLOBAL_ADS');
      if (globalStored) {
        const list: any[] = JSON.parse(globalStored);
        const updatedList = list.map(item => {
          if (String(item.id) === String(adId)) {
            const nextClicks = (item.clicks || 0) + 1;
            updatedAd = { ...item, clicks: nextClicks };
            return updatedAd;
          }
          return item;
        });
        localStorage.setItem('GLOBAL_ADS', JSON.stringify(updatedList));
      }
    }

    // بث حدث التحديث اللحظي لجميع مكونات النظام
    window.dispatchEvent(new CustomEvent('layla_internal_ads_updated', {
      detail: { adId, type: 'click', updatedAd }
    }));
  } catch (err) {
    console.error('Error recording ad click:', err);
  }
}
