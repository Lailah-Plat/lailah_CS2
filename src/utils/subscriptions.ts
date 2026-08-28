/**
 * @file subscriptions.ts
 * @description وحدة إدارة باقات اشتراكات المزودين والنسب المقتطعة لمنصة "ليلة".
 * توفر إعدادات الباقات القياسية (الأساسية، الأعمال، الاحترافية)، حدود القاعات، الميزات المتاحة، ونسب العمولات الديناميكية.
 */

/**
 * @file subscriptions.ts
 * @description وحدة إدارة باقات اشتراكات المزودين والنسب المقتطعة لمنصة "ليلة".
 * توفر إعدادات الباقات القياسية (الأساسية، الأعمال، الاحترافية)، حدود القاعات، الميزات المتاحة (19 ميزة)، ونسب العمولات الديناميكية.
 */

/**
 * باقات الاشتراكات الافتراضية لمنصة "ليلة" مع توضيح نسبة العمولة المقتطعة وكافة الميزات الـ 27 المعتمدة
 */
export const DEFAULT_SUBSCRIPTIONS = [
  {
    id: 'basic',
    name: 'الباقة الأساسية',
    revenue: 5000,
    priceMonthly: 99,
    priceYearly: 950,
    features: 'نظام حجوزات مبسط وتسوية سريعة\nدعم فني عبر التذاكر فقط\nتقارير شهرية',
    status: 'مفعل',
    isPopular: false,
    planBadgeText: '',
    discount: 0,
    usersCount: 45,
    // 🔢 الحقول الرقمية وحدود السعة الأربعة
    commissionRate: 15,
    hallsLimit: '1',
    servicesLimit: '5',
    staffSeatsLimit: '0',
    // ☑️ مربعات الاختيار لميزات الباقة (21 ميزة معتمدة ومسلسلة)
    // 1️⃣ المالية والتسعير
    includesWeekendPricing: false,
    includesDynamicSurgePricing: false,
    includesPartialPayment: false,
    canExportFinancials: false,
    includesAdvancedExport: false,
    includesGrowthCharts: false,
    includesInteractiveCharts: false,
    includesFinancialForecast: false,
    includesCashflowForecasting: false,
    closedBundlesOnly: true,
    includesHybridHallMarketplace: false,
    openMarketplaceServices: false,
    includesVendorNetworkIntegration: false,
    // 2️⃣ العمليات واللوجستيات
    includesFullManagement: false,
    includesFloorPlan360: false,
    includesSixStages: false,
    includesLogisticsPortal: false,
    includesInventory: false,
    includesSuppliers: false,
    includesCalendarSync: false,
    // 3️⃣ CRM والدعم والشركاء
    includesDedicatedCRM: false,
    includesClientMessagingHub: true,
    hasLiveChatVIP: false,
    includesLiveChatSupport: false,
    hasDedicatedAccountManager: false,
    includesDedicatedAccountManager: false,
    // 4️⃣ التسويق والمتاجر
    includesMarketingAgency: false,
    includesMiniProductsStore: false,
    // سمات إضافية وتوافقية
    hasSupport: false,
    includesAdvancedStats: false,
    includesWhatsAppCampaignAlerts: false,
    isHidden: false,
  },
  {
    id: 'business',
    name: 'باقة الأعمال',
    revenue: 20000,
    priceMonthly: 199,
    priceYearly: 1910,
    features: 'نظام حجوزات متقدم\nميزة نظام دورات الحياة المتقدمة (المراحل الست)\nدعم فني مباشر VIP (محادثة فورية)\nتقارير متقدمة\nالربط ببوابات الدفع\nميزة الإدارة الشاملة للحجوزات والخدمات\nميزة تسعير عطلة نهاية الأسبوع (الويكند)\nمزامنة التقويم السحابي (Google / Apple)\nسجل إدارة علاقات العملاء والولاء\nمخطط القاعة 360°',
    status: 'مفعل',
    isPopular: true,
    planBadgeText: 'الأكثر طلباً ⭐',
    discount: 15,
    usersCount: 120,
    // 🔢 الحقول الرقمية وحدود السعة الأربعة
    commissionRate: 10,
    hallsLimit: '3',
    servicesLimit: '15',
    staffSeatsLimit: '5',
    // ☑️ مربعات الاختيار لميزات الباقة (21 ميزة معتمدة ومسلسلة)
    // 1️⃣ المالية والتسعير
    includesWeekendPricing: true,
    includesDynamicSurgePricing: false,
    includesPartialPayment: false,
    canExportFinancials: true,
    includesAdvancedExport: true,
    includesGrowthCharts: false,
    includesInteractiveCharts: false,
    includesFinancialForecast: false,
    includesCashflowForecasting: false,
    closedBundlesOnly: false,
    includesHybridHallMarketplace: true,
    openMarketplaceServices: true,
    includesVendorNetworkIntegration: true,
    // 2️⃣ العمليات واللوجستيات
    includesFullManagement: true,
    includesFloorPlan360: true,
    includesSixStages: true,
    includesLogisticsPortal: false,
    includesInventory: true,
    includesSuppliers: true,
    includesCalendarSync: true,
    // 3️⃣ CRM والدعم والشركاء
    includesDedicatedCRM: true,
    includesClientMessagingHub: true,
    hasLiveChatVIP: true,
    includesLiveChatSupport: true,
    hasDedicatedAccountManager: false,
    includesDedicatedAccountManager: false,
    // 4️⃣ التسويق والمتاجر
    includesMarketingAgency: false,
    includesMiniProductsStore: false,
    // سمات إضافية وتوافقية
    hasSupport: true,
    includesAdvancedStats: true,
    includesWhatsAppCampaignAlerts: true,
    isHidden: false,
  },
  {
    id: 'pro',
    name: 'الباقة الاحترافية',
    revenue: 12000,
    priceMonthly: 399,
    priceYearly: 3830,
    features: 'نظام إدارة متكامل شامل كافة الصلاحيات\nنظام دورات الحياة المتقدمة (المراحل الست)\nدعم فني مباشر VIP (محادثة فورية)\nتعيين مدير حساب وإدارة الشريك المخصص\nمحرك التسعير الديناميكي وزيادة الذروة الذكي\nبوابة العمليات اللوجستية الميدانية\nمزامنة التقويم السحابي وسجل CRM المتطور\nوكالة التسويق والحملات الترويجية المدارة\nالرسومات البيانية التفاعلية وميزانية التوقعات المالية\nحزمة مخطط القاعة والميدان 360°',
    status: 'مفعل',
    isPopular: false,
    planBadgeText: 'الخيار الأفضل للمؤسسات 💎',
    discount: 20,
    usersCount: 30,
    // 🔢 الحقول الرقمية وحدود السعة الأربعة
    commissionRate: 5,
    hallsLimit: '',
    servicesLimit: '',
    staffSeatsLimit: '',
    // ☑️ مربعات الاختيار لميزات الباقة (21 ميزة معتمدة ومسلسلة)
    // 1️⃣ المالية والتسعير
    includesWeekendPricing: true,
    includesDynamicSurgePricing: true,
    includesPartialPayment: true,
    canExportFinancials: true,
    includesAdvancedExport: true,
    includesGrowthCharts: true,
    includesInteractiveCharts: true,
    includesFinancialForecast: true,
    includesCashflowForecasting: true,
    closedBundlesOnly: false,
    includesHybridHallMarketplace: true,
    openMarketplaceServices: true,
    includesVendorNetworkIntegration: true,
    // 2️⃣ العمليات واللوجستيات
    includesFullManagement: true,
    includesFloorPlan360: true,
    includesSixStages: true,
    includesLogisticsPortal: true,
    includesInventory: true,
    includesSuppliers: true,
    includesCalendarSync: true,
    // 3️⃣ CRM والدعم والشركاء
    includesDedicatedCRM: true,
    includesClientMessagingHub: true,
    hasLiveChatVIP: true,
    includesLiveChatSupport: true,
    hasDedicatedAccountManager: true,
    includesDedicatedAccountManager: true,
    // 4️⃣ التسويق والمتاجر
    includesMarketingAgency: true,
    includesMiniProductsStore: true,
    // سمات إضافية وتوافقية
    hasSupport: true,
    includesAdvancedStats: true,
    includesWhatsAppCampaignAlerts: true,
    isHidden: false,
  }
];

/**
 * جلب باقات الاشتراكات المحفوظة محلياً أو المعتمدة افتراضياً في النظام
 * @returns قائمة باقات الاشتراكات المنقحة والمحدثة
 */
export function getSubscriptions() {
  const data = localStorage.getItem('app_subscriptions');
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const uniqueMap = new Map();
        parsed.forEach((item: any) => {
          if (item && item.name) {
            const key = item.name.trim();
            const existing = uniqueMap.get(key);
            
            // إعطاء الأولوية للخطط المتزامنة مع قاعدة البيانات
            if (!existing || (!isNaN(Number(item.id)) && isNaN(Number(existing.id)))) {
              uniqueMap.set(key, item);
            }
          }
        });
        return Array.from(uniqueMap.values());
      }
    } catch (e) {
      console.error("خطأ في قراءة باقات الاشتراكات من التخزين:", e);
    }
  }
  return DEFAULT_SUBSCRIPTIONS;
}

/**
 * حفظ باقات الاشتراكات المحدثة في التخزين المحلي
 * @param subscriptions قائمة الباقات
 */
export function saveSubscriptions(subscriptions: any[]) {
  localStorage.setItem('app_subscriptions', JSON.stringify(subscriptions));
}

