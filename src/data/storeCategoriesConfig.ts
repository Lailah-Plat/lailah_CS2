// Shared Store Categories Manager & Synchronization Helper
// Synchronizes categories dynamically across Admin Sovereign Controls, VenueProductsStoreTab,
// VenueStoreManagerModal, and VenueProductsStoreModal in real-time.

export interface DynamicStoreCategory {
  key: string;
  label: string;
  defaultVal?: number;
  iconName?: string;
}

export const INITIAL_DEFAULT_STORE_CATEGORIES: DynamicStoreCategory[] = [
  { key: 'beverages', label: 'المشروبات والمياه', defaultVal: 5, iconName: 'Wine' },
  { key: 'hospitality', label: 'الإعاشة والضيافة', defaultVal: 10, iconName: 'Utensils' },
  { key: 'sweets', label: 'الحلويات والموالح', defaultVal: 8, iconName: 'Sparkles' },
  { key: 'flowers', label: 'الورود والتنسيقات', defaultVal: 7, iconName: 'Sparkles' },
  { key: 'lighting_sound', label: 'الإضاءات والأجهزة الصوتية', defaultVal: 6, iconName: 'Sparkles' },
  { key: 'furniture', label: 'الأثاث والديكور الإضافي', defaultVal: 8, iconName: 'Armchair' },
  { key: 'perfumes', label: 'العطور والمباخر الملكية', defaultVal: 6, iconName: 'Sparkles' },
  { key: 'logistics', label: 'الخدمات اللوجستية والعمالة', defaultVal: 5, iconName: 'Users' },
  { key: 'general', label: 'أصناف عامة', defaultVal: 5, iconName: 'Package' },
  { key: 'other', label: 'مستلزمات عامة أخرى', defaultVal: 5, iconName: 'Layers' }
];

export function getStoredCategories(): DynamicStoreCategory[] {
  if (typeof window === 'undefined') return INITIAL_DEFAULT_STORE_CATEGORIES;
  try {
    const raw = localStorage.getItem('STORE_DYNAMIC_CATEGORIES_LIST');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to load store dynamic categories:', e);
  }
  return INITIAL_DEFAULT_STORE_CATEGORIES;
}

export function saveStoredCategories(categories: DynamicStoreCategory[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('STORE_DYNAMIC_CATEGORIES_LIST', JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent('storeCategoriesUpdated', { detail: categories }));
  } catch (e) {
    console.error('Failed to save store dynamic categories:', e);
  }
}

export function getStoredCategoryRates(): Record<string, number> {
  if (typeof window === 'undefined') {
    return INITIAL_DEFAULT_STORE_CATEGORIES.reduce((acc, cat) => {
      acc[cat.key] = cat.defaultVal ?? 5;
      return acc;
    }, {} as Record<string, number>);
  }

  try {
    const raw = localStorage.getItem('STORE_CATEGORY_COMMISSION_RATES');
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {}

  const defaultRates: Record<string, number> = {};
  INITIAL_DEFAULT_STORE_CATEGORIES.forEach(cat => {
    defaultRates[cat.key] = cat.defaultVal ?? 5;
  });
  return defaultRates;
}

export function saveStoredCategoryRates(rates: Record<string, number>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('STORE_CATEGORY_COMMISSION_RATES', JSON.stringify(rates));
    window.dispatchEvent(new CustomEvent('storeCategoriesUpdated'));
  } catch (e) {}
}

// -------------------------------------------------------------
// POST-BOOKING ADDONS & DEADLINE GOVERNANCE (الطلبات اللاحقة والمهل الذكية)
// -------------------------------------------------------------

export interface PostBookingDeadlineOption {
  value: number; // in days
  label: string;
  category: 'short' | 'medium' | 'long';
}

export const POST_BOOKING_DEADLINE_OPTIONS: PostBookingDeadlineOption[] = [
  // المدى القريب (استراحات / شاليهات / مناسبات سريعة)
  { value: 1, label: 'يوم واحد (24 ساعة)', category: 'short' },
  { value: 2, label: 'يومان (48 ساعة)', category: 'short' },
  { value: 3, label: '3 أيام قبل المناسبة', category: 'short' },
  { value: 5, label: '5 أيام قبل المناسبة', category: 'short' },

  // المدى المتوسط (قاعات متوسطة / مناسبات مجدولة)
  { value: 7, label: 'أسبوع (7 أيام)', category: 'medium' },
  { value: 10, label: '10 أيام قبل المناسبة', category: 'medium' },
  { value: 15, label: '15 يوماً قبل المناسبة', category: 'medium' },
  { value: 21, label: '21 يوماً (3 أسابيع)', category: 'medium' },
  { value: 30, label: 'شهر (30 يوماً)', category: 'medium' },

  // المدى البعيد (قصور أفراح كبرى / تجهيزات لوجستية ضخمة)
  { value: 45, label: '45 يوماً قبل المناسبة', category: 'long' },
  { value: 60, label: '60 يوماً (شهران)', category: 'long' },
  { value: 90, label: '90 يوماً (3 أشهر)', category: 'long' }
];

export interface SovereignPostBookingConfig {
  enabled: boolean; // Master Sovereign switch
  allowProviderCustomization?: boolean; // Whether providers can adjust deadlines
  defaultDeadlineDays?: number;
}

export interface ProviderVenuePostBookingSetting {
  venueId: string;
  enabled: boolean;
  deadlineDays: number;
  autoCloseOnDeadline: boolean;
  proofRequiredForPerishableRefund: boolean;
}

export function getSovereignPostBookingConfig(): SovereignPostBookingConfig {
  if (typeof window === 'undefined') {
    return { enabled: true };
  }
  try {
    const raw = localStorage.getItem('SOVEREIGN_POST_BOOKING_STORE_CONFIG');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return { enabled: true };
}

export function saveSovereignPostBookingConfig(config: SovereignPostBookingConfig) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem('SOVEREIGN_POST_BOOKING_STORE_CONFIG', JSON.stringify(config));
    window.dispatchEvent(new CustomEvent('postBookingConfigUpdated', { detail: config }));
  } catch (e) {}
}

export function getProviderVenuePostBookingSettings(): Record<string, ProviderVenuePostBookingSetting> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem('PROVIDER_VENUE_POST_BOOKING_SETTINGS');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

export function saveProviderVenuePostBookingSetting(setting: ProviderVenuePostBookingSetting) {
  if (typeof window === 'undefined') return;
  try {
    const current = getProviderVenuePostBookingSettings();
    current[setting.venueId] = setting;
    localStorage.setItem('PROVIDER_VENUE_POST_BOOKING_SETTINGS', JSON.stringify(current));
    window.dispatchEvent(new CustomEvent('postBookingConfigUpdated', { detail: current }));
  } catch (e) {}
}

export function checkBookingPostOrderEligibility(
  eventDateStr: string,
  venueId?: string
): { 
  isAllowed: boolean; 
  daysRemaining: number; 
  deadlineDays: number; 
  reason?: string; 
  formattedDeadlineDate?: string;
  isPerishableProofRequired: boolean;
} {
  const sovereign = getSovereignPostBookingConfig();
  if (!sovereign.enabled) {
    return {
      isAllowed: false,
      daysRemaining: 0,
      deadlineDays: 0,
      reason: 'الطلبات اللاحقة لمتجر المستلزمات معطلة بتوجيه سيادي عام من إدارة المنصة',
      isPerishableProofRequired: true
    };
  }

  const providerSettings = getProviderVenuePostBookingSettings();
  const venueSetting = venueId ? providerSettings[venueId] : null;

  // Default is disabled for any venue unless explicitly enabled by the provider
  const isVenueEnabled = venueSetting ? venueSetting.enabled : false;
  const deadlineDays = venueSetting && venueSetting.deadlineDays ? venueSetting.deadlineDays : 3;
  const isPerishableProofRequired = venueSetting ? venueSetting.proofRequiredForPerishableRefund : true;

  if (!isVenueEnabled) {
    return {
      isAllowed: false,
      daysRemaining: 0,
      deadlineDays,
      reason: 'المزود لم يقم بتفعيل استقبال الطلبات اللاحقة لهذا المكان في الوقت الحالي',
      isPerishableProofRequired
    };
  }

  // Calculate days difference
  try {
    const eventDate = new Date(eventDateStr);
    const today = new Date();
    // Reset time to start of day
    eventDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = eventDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const deadlineDate = new Date(eventDate.getTime() - (deadlineDays * 24 * 60 * 60 * 1000));
    const formattedDeadlineDate = deadlineDate.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    if (diffDays < deadlineDays) {
      return {
        isAllowed: false,
        daysRemaining: Math.max(0, diffDays),
        deadlineDays,
        formattedDeadlineDate,
        reason: `تم إغلاق استقبال الطلبات الإضافية لهذا الحجز لانتهاء المهلة المحددة (${deadlineDays} يوم قبل المناسبة) لضمان اكتمال التجهيزات اللوجستية`,
        isPerishableProofRequired
      };
    }

    return {
      isAllowed: true,
      daysRemaining: diffDays,
      deadlineDays,
      formattedDeadlineDate,
      isPerishableProofRequired
    };
  } catch (e) {
    return {
      isAllowed: true,
      daysRemaining: 30,
      deadlineDays,
      isPerishableProofRequired
    };
  }
}

