/**
 * @file featureRegistry.ts
 * @description Centralized Feature & Limit Registry for Lailah Platform.
 * 
 * Defines all boolean capabilities and numeric resource limits with their
 * default values, metadata, display names, and categories.
 * 
 * STRICT RULE: Default policy for any unassigned or unregistered feature is DENY (false / 0).
 */

export type FeatureType = 'boolean' | 'numeric_limit';

export interface FeatureDefinition {
  key: string;
  nameAr: string;
  descriptionAr: string;
  type: FeatureType;
  category: 'core' | 'operations' | 'pricing' | 'marketing' | 'financial' | 'addons' | 'support';
  unitAr?: string;
  defaultValue: boolean | number;
  isAddonAvailable: boolean;
  baseAddonPriceMonthly?: number;
}

/**
 * Standard Feature Keys
 */
export const FEATURE_KEYS = {
  // Numeric Limits
  MAX_HALLS: 'max_halls',
  MAX_SERVICES: 'max_services',
  STAFF_SEATS: 'staff_seats',
  SUB_ACCOUNTS: 'sub_accounts',
  
  // Operational & Inventory
  INVENTORY_MANAGEMENT: 'inventory_management',
  SUPPLIERS_MANAGEMENT: 'suppliers_management',
  LOGISTICS_PORTAL: 'logistics_portal',
  CLIENT_CHATS: 'client_chats',
  
  // Booking & Payment Policy Capabilities (P1.9)
  BOOKING_PAYMENT_POLICY_CONTROL: 'booking_payment_policy_control',
  BOOKING_POLICY_APPROVAL_BEFORE_PAYMENT: 'booking_policy.approval_before_payment',
  BOOKING_POLICY_PAYMENT_BEFORE_APPROVAL: 'booking_policy.payment_before_approval',
  BOOKING_POLICY_INSTANT_CONFIRMATION: 'booking_policy.instant_confirmation',
  BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE: 'booking_policy.authorize_then_capture',
  PROVIDER_RESPONSE_DEADLINE_CONTROL: 'provider_response_deadline_control',
  
  // Smart Pricing
  WEEKEND_PRICING: 'weekend_pricing',
  DYNAMIC_PRICING: 'dynamic_pricing',
  DYNAMIC_SURGE_PRICING: 'dynamic_surge_pricing',
  
  // Store & Addons
  MINI_PRODUCTS_STORE: 'mini_products_store',
  POST_BOOKING_ADDONS: 'post_booking_addons',
  
  // Financial & Reports
  CAN_EXPORT_FINANCIALS: 'can_export_financials',
  FINANCIAL_FORECAST_AI: 'financial_forecast_ai',
  PARTIAL_PAYMENT: 'partial_payment',
  ADVANCED_STATS: 'advanced_stats',
  
  // Marketing & Growth
  MARKETING_ANALYTICS: 'marketing_analytics',
  MARKETING_AGENCY: 'marketing_agency',
  DEDICATED_CRM: 'dedicated_crm',
  GROWTH_CHARTS: 'growth_charts',
  WHATSAPP_CAMPAIGN_ALERTS: 'whatsapp_campaign_alerts',
  CUSTOM_DOMAIN: 'custom_domain',
  
  // Support & SLA
  VIP_SUPPORT: 'vip_support',
  LIVE_CHAT_SUPPORT: 'live_chat_support',
  FULL_MANAGEMENT: 'full_management'
} as const;

export type FeatureKey = typeof FEATURE_KEYS[keyof typeof FEATURE_KEYS] | string;

/**
 * Complete Feature Registry Map
 */
export const FEATURE_REGISTRY: Record<string, FeatureDefinition> = {
  [FEATURE_KEYS.MAX_HALLS]: {
    key: FEATURE_KEYS.MAX_HALLS,
    nameAr: 'الحد الأقصى للقاعات والمنشآت',
    descriptionAr: 'عدد القاعات أو الفروع التي يمكن للمزود إدارتها ونشرها على المنصة',
    type: 'numeric_limit',
    category: 'core',
    unitAr: 'قاعة',
    defaultValue: 1,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 49.00
  },
  [FEATURE_KEYS.MAX_SERVICES]: {
    key: FEATURE_KEYS.MAX_SERVICES,
    nameAr: 'الحد الأقصى للخدمات المساندة',
    descriptionAr: 'عدد الخدمات والمنتجات المستقلة المسموح بإضافتها وعرضها للعملاء',
    type: 'numeric_limit',
    category: 'core',
    unitAr: 'خدمة',
    defaultValue: 5,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 29.00
  },
  [FEATURE_KEYS.STAFF_SEATS]: {
    key: FEATURE_KEYS.STAFF_SEATS,
    nameAr: 'مقاعد الموظفين وفريق العمل',
    descriptionAr: 'عدد حسابات المشرفين والموظفين بصلاحيات تشغيلية مخصصة',
    type: 'numeric_limit',
    category: 'operations',
    unitAr: 'مقعد موظف',
    defaultValue: 0,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 19.00
  },
  [FEATURE_KEYS.SUB_ACCOUNTS]: {
    key: FEATURE_KEYS.SUB_ACCOUNTS,
    nameAr: 'الحسابات الفرعية والصلاحيات',
    descriptionAr: 'إنشاء حسابات إدارية فرعية متعددة للمنشأة',
    type: 'numeric_limit',
    category: 'operations',
    unitAr: 'حساب فرعي',
    defaultValue: 0,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 25.00
  },
  [FEATURE_KEYS.INVENTORY_MANAGEMENT]: {
    key: FEATURE_KEYS.INVENTORY_MANAGEMENT,
    nameAr: 'إدارة المخزون والتوريدات',
    descriptionAr: 'نظام إدارة المستودعات، الجرد، والتنبيه التلقائي بنقص المخزون',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 69.00
  },
  [FEATURE_KEYS.SUPPLIERS_MANAGEMENT]: {
    key: FEATURE_KEYS.SUPPLIERS_MANAGEMENT,
    nameAr: 'إدارة الموردين وفواتير الشراء',
    descriptionAr: 'إدارة سجلات الموردين وفواتير المشتريات ومتابعة الحسابات',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 49.00
  },
  [FEATURE_KEYS.LOGISTICS_PORTAL]: {
    key: FEATURE_KEYS.LOGISTICS_PORTAL,
    nameAr: 'بوابة الشريك اللوجستي والمشرفين',
    descriptionAr: 'لوحة تفاعلية لإدارة الفرق الميدانية والتسليم اللوجستي',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 59.00
  },
  [FEATURE_KEYS.CLIENT_CHATS]: {
    key: FEATURE_KEYS.CLIENT_CHATS,
    nameAr: 'المحادثات المباشرة مع العملاء',
    descriptionAr: 'قناة تواصل فورية وتنبيهات صوتية للدردشة مع العملاء',
    type: 'boolean',
    category: 'operations',
    defaultValue: true,
    isAddonAvailable: false
  },
  [FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL]: {
    key: FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL,
    nameAr: 'التحكم المتقدم في سياسات الحجز والدفع',
    descriptionAr: 'تمكين تخصيص سياسات الحجز (الدفع المسبق، التأكيد الفوري، الحجز مع التفويض)',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 99.00
  },
  [FEATURE_KEYS.BOOKING_POLICY_APPROVAL_BEFORE_PAYMENT]: {
    key: FEATURE_KEYS.BOOKING_POLICY_APPROVAL_BEFORE_PAYMENT,
    nameAr: 'سياسة موافقة المزود قبل الدفع (الافتراضية)',
    descriptionAr: 'المسار الآمن والافتراضي: يتطلب موافقة المزود قبل سداد العميل',
    type: 'boolean',
    category: 'operations',
    defaultValue: true,
    isAddonAvailable: false
  },
  [FEATURE_KEYS.BOOKING_POLICY_PAYMENT_BEFORE_APPROVAL]: {
    key: FEATURE_KEYS.BOOKING_POLICY_PAYMENT_BEFORE_APPROVAL,
    nameAr: 'سياسة الدفع المسبق قبل مراجعة المزود',
    descriptionAr: 'دفع المبلغ مقدماً مع استرداد آلي كامل في حال رفض المزود',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 49.00
  },
  [FEATURE_KEYS.BOOKING_POLICY_INSTANT_CONFIRMATION]: {
    key: FEATURE_KEYS.BOOKING_POLICY_INSTANT_CONFIRMATION,
    nameAr: 'سياسة التأكيد الفوري والحجز المباشر',
    descriptionAr: 'تأكيد الحجز والدفع فوراً دون الحاجة لموافقة يدوية مسبقة من المزود',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 79.00
  },
  [FEATURE_KEYS.BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE]: {
    key: FEATURE_KEYS.BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE,
    nameAr: 'سياسة حجز المبلغ والتفويض المسبق (Hold/Capture)',
    descriptionAr: 'حجز المبلغ على بطاقة العميل ويتم الخصم الفعلي فقط عند موافقة المزود',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 69.00
  },
  [FEATURE_KEYS.PROVIDER_RESPONSE_DEADLINE_CONTROL]: {
    key: FEATURE_KEYS.PROVIDER_RESPONSE_DEADLINE_CONTROL,
    nameAr: 'التحكم في مهلة استجابة ومراجعة المزود للطلبات',
    descriptionAr: 'تمكين المزود المؤهل من تحديد مهلة مراجعة طلبات الحجز من الخيارات المعتمدة [1، 3، 7، 12، 24 ساعة]',
    type: 'boolean',
    category: 'operations',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 39.00
  },
  [FEATURE_KEYS.WEEKEND_PRICING]: {
    key: FEATURE_KEYS.WEEKEND_PRICING,
    nameAr: 'محرك تسعير عطلة نهاية الأسبوع',
    descriptionAr: 'تخصيص أسعار مرنة لأيام الويكند والخميس والجمعة والسبت',
    type: 'boolean',
    category: 'pricing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 49.00
  },
  [FEATURE_KEYS.DYNAMIC_PRICING]: {
    key: FEATURE_KEYS.DYNAMIC_PRICING,
    nameAr: 'محرك التسعير الديناميكي والذروة',
    descriptionAr: 'تعديل الأسعار الذكي بناءً على نسب الإشغال والطلب الموسمي',
    type: 'boolean',
    category: 'pricing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 99.00
  },
  [FEATURE_KEYS.DYNAMIC_SURGE_PRICING]: {
    key: FEATURE_KEYS.DYNAMIC_SURGE_PRICING,
    nameAr: 'زيادة الذروة والمواسم التلقائية',
    descriptionAr: 'تطبيق مضاعفات الذروة التلقائية في أوقات الإشغال المرتفع',
    type: 'boolean',
    category: 'pricing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 79.00
  },
  [FEATURE_KEYS.MINI_PRODUCTS_STORE]: {
    key: FEATURE_KEYS.MINI_PRODUCTS_STORE,
    nameAr: 'متجر المنتجات والمستلزمات المصغر',
    descriptionAr: 'إضافة منتجات ومستلزمات الحفلات التابعة للقاعة وطلبها أثناء الحجز',
    type: 'boolean',
    category: 'addons',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 89.00
  },
  [FEATURE_KEYS.POST_BOOKING_ADDONS]: {
    key: FEATURE_KEYS.POST_BOOKING_ADDONS,
    nameAr: 'إضافات ما بعد الحجز',
    descriptionAr: 'تمكين العميل من شراء خدمات إضافية بعد إتمام الحجز وقبل الفعالية',
    type: 'boolean',
    category: 'addons',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 49.00
  },
  [FEATURE_KEYS.CAN_EXPORT_FINANCIALS]: {
    key: FEATURE_KEYS.CAN_EXPORT_FINANCIALS,
    nameAr: 'تصدير التقارير المالية والضريبية',
    descriptionAr: 'تصدير القوائم المالية، الفواتير، وتقارير ضريبة القيمة المضافة PDF/Excel',
    type: 'boolean',
    category: 'financial',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 39.00
  },
  [FEATURE_KEYS.FINANCIAL_FORECAST_AI]: {
    key: FEATURE_KEYS.FINANCIAL_FORECAST_AI,
    nameAr: 'التوقعات المالية بالذكاء الاصطناعي',
    descriptionAr: 'محرك تنبؤ بالإيرادات والتدفقات النقدية المستقبلية عبر الذكاء الاصطناعي',
    type: 'boolean',
    category: 'financial',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 79.00
  },
  [FEATURE_KEYS.PARTIAL_PAYMENT]: {
    key: FEATURE_KEYS.PARTIAL_PAYMENT,
    nameAr: 'دعم الدفع الجزئي والعربون',
    descriptionAr: 'تمكين العملاء من دفع عربون وتقسيط المبلغ المتبقي قبل المناسبة',
    type: 'boolean',
    category: 'financial',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 49.00
  },
  [FEATURE_KEYS.ADVANCED_STATS]: {
    key: FEATURE_KEYS.ADVANCED_STATS,
    nameAr: 'الإحصائيات والتحليلات المتقدمة',
    descriptionAr: 'مؤشرات الأداء الرئيسية ومعدلات التحويل ونسب الإشغال التفصيلية',
    type: 'boolean',
    category: 'marketing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 39.00
  },
  [FEATURE_KEYS.MARKETING_ANALYTICS]: {
    key: FEATURE_KEYS.MARKETING_ANALYTICS,
    nameAr: 'تحليلات الحملات والزيارات التسويقية',
    descriptionAr: 'تتبع مصدر الزيارات وتحليل أداء الحملات الإعلانية ومعدل الشراء',
    type: 'boolean',
    category: 'marketing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 59.00
  },
  [FEATURE_KEYS.GROWTH_CHARTS]: {
    key: FEATURE_KEYS.GROWTH_CHARTS,
    nameAr: 'رسوم ومؤشرات مركز النمو',
    descriptionAr: 'رسوم بيانية بيانية متقدمة لتطور المبيعات وأداء الخدمات',
    type: 'boolean',
    category: 'marketing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 39.00
  },
  [FEATURE_KEYS.WHATSAPP_CAMPAIGN_ALERTS]: {
    key: FEATURE_KEYS.WHATSAPP_CAMPAIGN_ALERTS,
    nameAr: 'تنبيهات وإشعارات واتساب التلقائية',
    descriptionAr: 'إرسال إشعارات وتأكيدات الحجز للعملاء والمزود عبر WhatsApp',
    type: 'boolean',
    category: 'marketing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 69.00
  },
  [FEATURE_KEYS.CUSTOM_DOMAIN]: {
    key: FEATURE_KEYS.CUSTOM_DOMAIN,
    nameAr: 'نطاق مخصص للمنشأة',
    descriptionAr: 'ربط صفحة المنشأة بنطاق خاص بها',
    type: 'boolean',
    category: 'marketing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 120.00
  },
  [FEATURE_KEYS.MARKETING_AGENCY]: {
    key: FEATURE_KEYS.MARKETING_AGENCY,
    nameAr: 'خدمات وكالة التسويق وإدارة الحملات',
    descriptionAr: 'طلب وإدارة الحملات الإعلانية الممولة وإعادة الاستهداف عبر وكالة المنصة',
    type: 'boolean',
    category: 'marketing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 199.00
  },
  [FEATURE_KEYS.DEDICATED_CRM]: {
    key: FEATURE_KEYS.DEDICATED_CRM,
    nameAr: 'نظام إدارة علاقات العملاء المتقدم (CRM)',
    descriptionAr: 'تقسيم وتصنيف العملاء ومتابعة دورة حياة العميل والولاء',
    type: 'boolean',
    category: 'marketing',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 79.00
  },
  [FEATURE_KEYS.LIVE_CHAT_SUPPORT]: {
    key: FEATURE_KEYS.LIVE_CHAT_SUPPORT,
    nameAr: 'المحادثات المباشرة والدعم اللحظي',
    descriptionAr: 'قنوات الدردشة الحية والردود التلقائية مع العملاء وفريق الدعم',
    type: 'boolean',
    category: 'support',
    defaultValue: true,
    isAddonAvailable: false
  },
  [FEATURE_KEYS.VIP_SUPPORT]: {
    key: FEATURE_KEYS.VIP_SUPPORT,
    nameAr: 'الدعم الفني المخصص والمباشر (SLA)',
    descriptionAr: 'أولوية الاستجابة ومدير حساب مخصص للمنشأة',
    type: 'boolean',
    category: 'support',
    defaultValue: false,
    isAddonAvailable: true,
    baseAddonPriceMonthly: 99.00
  }
};

/**
 * Normalizes any legacy feature key or alias to standard key
 */
export function normalizeFeatureKey(key: string): string {
  if (!key) return '';
  const clean = String(key).trim();
  
  const aliases: Record<string, string> = {
    'hallsLimit': FEATURE_KEYS.MAX_HALLS,
    'maxHalls': FEATURE_KEYS.MAX_HALLS,
    'halls_limit': FEATURE_KEYS.MAX_HALLS,
    'servicesLimit': FEATURE_KEYS.MAX_SERVICES,
    'maxServices': FEATURE_KEYS.MAX_SERVICES,
    'services_limit': FEATURE_KEYS.MAX_SERVICES,
    'staffSeatsLimit': FEATURE_KEYS.STAFF_SEATS,
    'staff_seats_limit': FEATURE_KEYS.STAFF_SEATS,
    'includesInventory': FEATURE_KEYS.INVENTORY_MANAGEMENT,
    'hasInventory': FEATURE_KEYS.INVENTORY_MANAGEMENT,
    'inventory': FEATURE_KEYS.INVENTORY_MANAGEMENT,
    'inventory_management': FEATURE_KEYS.INVENTORY_MANAGEMENT,
    'includesSuppliers': FEATURE_KEYS.SUPPLIERS_MANAGEMENT,
    'suppliers': FEATURE_KEYS.SUPPLIERS_MANAGEMENT,
    'suppliers_management': FEATURE_KEYS.SUPPLIERS_MANAGEMENT,
    'includesWeekendPricing': FEATURE_KEYS.WEEKEND_PRICING,
    'hasWeekendPricing': FEATURE_KEYS.WEEKEND_PRICING,
    'weekend_pricing': FEATURE_KEYS.WEEKEND_PRICING,
    'includesDynamicPricing': FEATURE_KEYS.DYNAMIC_PRICING,
    'hasDynamicPricing': FEATURE_KEYS.DYNAMIC_PRICING,
    'dynamic_pricing': FEATURE_KEYS.DYNAMIC_PRICING,
    'includesDynamicSurgePricing': FEATURE_KEYS.DYNAMIC_SURGE_PRICING,
    'dynamicSurgePricing': FEATURE_KEYS.DYNAMIC_SURGE_PRICING,
    'dynamic_surge_pricing': FEATURE_KEYS.DYNAMIC_SURGE_PRICING,
    'surge_pricing': FEATURE_KEYS.DYNAMIC_SURGE_PRICING,
    'includesMiniProductsStore': FEATURE_KEYS.MINI_PRODUCTS_STORE,
    'includesMiniStore': FEATURE_KEYS.MINI_PRODUCTS_STORE,
    'hasMiniStore': FEATURE_KEYS.MINI_PRODUCTS_STORE,
    'mini_products_store': FEATURE_KEYS.MINI_PRODUCTS_STORE,
    'mini_store': FEATURE_KEYS.MINI_PRODUCTS_STORE,
    'in_venue_store': FEATURE_KEYS.MINI_PRODUCTS_STORE,
    'includesPostBookingAddons': FEATURE_KEYS.POST_BOOKING_ADDONS,
    'hasPostBookingAddons': FEATURE_KEYS.POST_BOOKING_ADDONS,
    'post_booking_addons': FEATURE_KEYS.POST_BOOKING_ADDONS,
    'canExportFinancials': FEATURE_KEYS.CAN_EXPORT_FINANCIALS,
    'can_export_financials': FEATURE_KEYS.CAN_EXPORT_FINANCIALS,
    'advanced_export': FEATURE_KEYS.CAN_EXPORT_FINANCIALS,
    'financial_export': FEATURE_KEYS.CAN_EXPORT_FINANCIALS,
    'includesFinancialForecast': FEATURE_KEYS.FINANCIAL_FORECAST_AI,
    'financial_forecast': FEATURE_KEYS.FINANCIAL_FORECAST_AI,
    'financial_forecast_ai': FEATURE_KEYS.FINANCIAL_FORECAST_AI,
    'cashflow_forecasting': FEATURE_KEYS.FINANCIAL_FORECAST_AI,
    'includesPartialPayment': FEATURE_KEYS.PARTIAL_PAYMENT,
    'partial_payment': FEATURE_KEYS.PARTIAL_PAYMENT,
    'marketing_agency': FEATURE_KEYS.MARKETING_AGENCY,
    'dedicated_crm': FEATURE_KEYS.DEDICATED_CRM,
    'live_chat_support': FEATURE_KEYS.LIVE_CHAT_SUPPORT,
    'client_chats': FEATURE_KEYS.CLIENT_CHATS,
    'includesAdvancedStats': FEATURE_KEYS.ADVANCED_STATS,
    'advanced_stats': FEATURE_KEYS.ADVANCED_STATS,
    'includesGrowthCharts': FEATURE_KEYS.GROWTH_CHARTS,
    'growth_charts': FEATURE_KEYS.GROWTH_CHARTS,
    'includesWhatsAppCampaignAlerts': FEATURE_KEYS.WHATSAPP_CAMPAIGN_ALERTS,
    'whatsapp_campaign_alerts': FEATURE_KEYS.WHATSAPP_CAMPAIGN_ALERTS,
    'hasSupport': FEATURE_KEYS.VIP_SUPPORT,
    'vip_support': FEATURE_KEYS.VIP_SUPPORT,
    'includesLogisticsPortal': FEATURE_KEYS.LOGISTICS_PORTAL,
    'logistics_portal': FEATURE_KEYS.LOGISTICS_PORTAL,
    
    // Booking Payment Policies aliases
    'booking_payment_policy_control': FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL,
    'bookingPaymentPolicyControl': FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL,
    'hasBookingPaymentPolicyControl': FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL,
    'booking_policy_control': FEATURE_KEYS.BOOKING_PAYMENT_POLICY_CONTROL,
    'booking_policy.approval_before_payment': FEATURE_KEYS.BOOKING_POLICY_APPROVAL_BEFORE_PAYMENT,
    'approval_before_payment': FEATURE_KEYS.BOOKING_POLICY_APPROVAL_BEFORE_PAYMENT,
    'booking_policy.payment_before_approval': FEATURE_KEYS.BOOKING_POLICY_PAYMENT_BEFORE_APPROVAL,
    'payment_before_approval': FEATURE_KEYS.BOOKING_POLICY_PAYMENT_BEFORE_APPROVAL,
    'booking_policy.instant_confirmation': FEATURE_KEYS.BOOKING_POLICY_INSTANT_CONFIRMATION,
    'instant_confirmation': FEATURE_KEYS.BOOKING_POLICY_INSTANT_CONFIRMATION,
    'booking_policy.authorize_then_capture': FEATURE_KEYS.BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE,
    'authorize_then_capture': FEATURE_KEYS.BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE,
    'hold_and_capture': FEATURE_KEYS.BOOKING_POLICY_AUTHORIZE_THEN_CAPTURE
  };

  return aliases[clean] || clean;
}

/**
 * Helper to get feature definition safely
 */
export function getFeatureDefinition(key: string): FeatureDefinition | undefined {
  const normKey = normalizeFeatureKey(key);
  return FEATURE_REGISTRY[normKey];
}
