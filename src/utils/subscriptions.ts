/**
 * @file subscriptions.ts
 * @description وحدة إدارة باقات اشتراكات المزودين والنسب المقتطعة لمنصة "ليلة".
 * توفر إعدادات الباقات القياسية (الأساسية، الأعمال، الاحترافية)، حدود القاعات، الميزات المتاحة، ونسب العمولات الديناميكية.
 */

/**
 * باقات الاشتراكات الافتراضية لمنصة "ليلة" مع توضيح نسبة العمولة المقتطعة لكل باقة
 */
export const DEFAULT_SUBSCRIPTIONS = [
  { id: 'basic', name: 'الباقة الأساسية', revenue: 5000, priceMonthly: 99, priceYearly: 950, features: 'نظام حجوزات مبسط\nدعم فني عبر التذاكر فقط\nتقارير شهرية', status: 'مفعل', isPopular: false, discount: 0, usersCount: 45, commissionRate: 15, includesInventory: false, includesSuppliers: false, includesMiniProductsStore: false, includesWhatsAppCampaignAlerts: false, hallsLimit: '1', servicesLimit: '5', canExportFinancials: false, hasSupport: false, staffSeatsLimit: '0', includesGrowthCharts: false, includesFinancialForecast: false, includesPartialPayment: false, includesAdvancedStats: false, includesFullManagement: false, includesAdvancedProviderDashboard: false, includesLogisticsPortal: false },
  { id: 'business', name: 'باقة الأعمال', revenue: 20000, priceMonthly: 199, priceYearly: 1910, features: 'نظام حجوزات متقدم\nدعم فني مباشر VIP (محادثة فورية)\nتقارير متقدمة\nالربط ببوابات الدفع\nميزة لوحة الإحصائيات المتقدمة\nميزة الإدارة الشاملة للحجوزات والخدمات\nتفعيل ميزة لوحة مزود الخدمة المتقدمة\nتفعيل إشعارات رسائل واتس أب في الحملات التسويقية', status: 'مفعل', isPopular: true, discount: 15, usersCount: 120, commissionRate: 10, includesInventory: true, includesSuppliers: true, includesMiniProductsStore: false, includesWhatsAppCampaignAlerts: true, hallsLimit: '3', servicesLimit: '15', canExportFinancials: true, hasSupport: true, staffSeatsLimit: '5', includesGrowthCharts: false, includesFinancialForecast: false, includesPartialPayment: false, includesAdvancedStats: true, includesFullManagement: true, includesAdvancedProviderDashboard: true, includesLogisticsPortal: false },
  { id: 'pro', name: 'الباقة الاحترافية', revenue: 12000, priceMonthly: 399, priceYearly: 3830, features: 'نظام إدارة متكامل\nدعم فني مباشر VIP (محادثة فورية)\nوصول لبيانات العملاء\nأولوية في الظهور\nميزة متجر المنتجات والمستلزمات المصغر\nميزة لوحة الإحصائيات المتقدمة\nميزة الإدارة الشاملة للحجوزات والخدمات\nتفعيل ميزة لوحة مزود الخدمة المتقدمة\nبوابة الطلبات اللوجستية وإدارة السيولة المتقدمة\nتفعيل إشعارات رسائل واتس أب في الحملات التسويقية', status: 'مفعل', isPopular: false, discount: 20, usersCount: 30, commissionRate: 5, includesInventory: true, includesSuppliers: true, includesMiniProductsStore: true, includesWhatsAppCampaignAlerts: true, hallsLimit: '', servicesLimit: '', canExportFinancials: true, hasSupport: true, staffSeatsLimit: '', includesGrowthCharts: true, includesFinancialForecast: true, includesPartialPayment: true, includesAdvancedStats: true, includesFullManagement: true, includesAdvancedProviderDashboard: true, includesLogisticsPortal: true }
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
      if (Array.isArray(parsed)) {
        const uniqueMap = new Map();
        parsed.forEach((item: any) => {
          if (item && item.name) {
            const key = item.name.trim();
            const existing = uniqueMap.get(key);
            
            // ضمان ضبط خاصية متجر المنتجات والمستلزمات إذا لم تكن محددة
            if (item.includesMiniProductsStore === undefined) {
              if (item.id === 'pro' || (item.name && item.name.includes('الاحترافية')) || (item.features && item.features.includes('متجر'))) {
                item.includesMiniProductsStore = true;
              } else {
                item.includesMiniProductsStore = false;
              }
            }

            // ضمان ضبط خاصية إشعارات رسائل واتساب في الحملات التسويقية
            if (item.includesWhatsAppCampaignAlerts === undefined) {
              if (item.id === 'pro' || item.id === 'business' || (item.name && (item.name.includes('الاحترافية') || item.name.includes('الأعمال'))) || (item.features && item.features.includes('واتس'))) {
                item.includesWhatsAppCampaignAlerts = true;
              } else {
                item.includesWhatsAppCampaignAlerts = false;
              }
            }

            // إعطاء الأولوية للخطط المتزامنة مع قاعدة البيانات
            if (!existing || (!isNaN(Number(item.id)) && isNaN(Number(existing.id)))) {
              uniqueMap.set(key, item);
            }
          }
        });
        return Array.from(uniqueMap.values());
      }
      return parsed;
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

