/**
 * @file capabilityEngine.ts
 * @description محرك تقييم صلاحيات وقدرات المزودين بناءً على باقات الاشتراك والميزات الإضافية لمنصة "ليلة".
 * يتحكم هذا المحرك في إتاحة المميزات والحدود القصوى للقاعات والموظفين والخدمات حسب نوع باقة الاشتراك الفعالة والقدرات الإضافية المشتراة.
 */

/**
 * واجهة مصفوفة قدرات وصلاحيات الشريك/المزود المعتمدة (27 عنصراً شاملاً: 4 حقول رقمية وسعات + 21 ميزة مسلسلة عبر 4 مجموعات + 2 سمات عرض وترويج)
 */
export interface ProviderCapabilities {
  // === 🔢 أولاً: الحقول الرقمية الأساسية والحدود التشغيلية (4 حقول) ===
  /** 1. نسبة عمولة المنصة (%) المحددة للاشتراك */
  commissionRate: number;
  /** 2. الحد الأقصى للقاعات والمنشآت المسموح بإضافتها (Add-on: additional_halls) */
  hallsLimit: number | 'unlimited';   
  /** 3. الحد الأقصى للخدمات المساندة المسموح بإضافتها (Add-on: additional_services) */
  servicesLimit: number | 'unlimited';
  /** 4. الحد الأقصى لمقاعد الموظفين وتراخيص العاملين (Add-on: additional_staff) */
  staffSeatsLimit: number | 'unlimited';

  // === ☑️ ثانياً: مربعات الاختيار لميزات الباقة (21 ميزة مسلسلة من #5 إلى #25) ===

  // 1️⃣ مجموعة الرقابة المالية ومحركات التسعير والتوليف الذكي (الميزات 5 إلى 12)
  /** 5. تسعير عطلات نهاية الأسبوع والمواسم (الويكند) (Add-on: weekend_pricing) */
  hasWeekendPricing: boolean;
  /** 6. محرك التسعير الديناميكي الذكي وزيادة الذروة الآلية (Add-on: dynamic_surge_pricing) */
  hasDynamicSurgePricing: boolean;
  /** 7. صلاحية تفعيل حجز العربون والدفع المرحلي للعملاء (Add-on: partial_payment) */
  hasDepositSystem: boolean;
  /** 8. استعراض وتصدير التقارير المتقدمة والفواتير وكشوفات الحساب (Add-on: advanced_export) */
  hasInvoices: boolean;
  /** 9. الرسومات البيانية التفاعلية ومؤشرات النمو (Add-on: interactive_charts) */
  hasGrowthCharts: boolean;
  /** 10. ميزانية التوقعات المالية والتدفقات النقدية الذكية (Add-on: cashflow_forecasting) */
  hasSmartFinancialForecast: boolean;
  /** 11. باقات القاعات المغلقة وسوق الإضافات الهجين (Add-on: hybrid_hall_marketplace) */
  closedBundlesOnly: boolean;
  /** 12. باقات الخدمات الشاملة وشبكة تكامل الموردين الخارجيين (Add-on: vendor_network_integration) */
  openMarketplaceServices: boolean;

  // 2️⃣ مجموعة العمليات الميدانية وهندسة القاعات واللوجستيات (الميزات 13 إلى 19)
  /** 13. الإدارة الشاملة المشتركة للقاعات والخدمات المساندة (Add-on: full_management) */
  hasComprehensiveManagement: boolean;
  /** 14. حزمة مخطط القاعة والميدان المتكامل (Add-on: floor_plan_360) */
  hasFloorPlan360: boolean;
  /** 15. نظام دورات الحياة والتشغيل المتقدم (المراحل الست) (Add-on: advanced_lifecycle) */
  hasSixStages: boolean;
  /** 16. مركز العمليات اللوجستية الميدانية للخدمات (Add-on: logistics_operations) */
  hasOperationsDashboard: boolean;
  /** 17. نظام إدارة المخزون والمستودعات (Add-on: inventory_management) */
  hasInventory: boolean;
  /** 18. نظام الموردين والمشتريات والمدفوعات الآجلة (Add-on: suppliers_management) */
  hasSuppliers: boolean;
  /** 19. مزامنة التقويم السحابي الخارجي (Google / Apple) (Add-on: calendar_sync) */
  hasCalendarSync: boolean;

  // 3️⃣ مجموعة إدارة علاقات العملاء والدعم الفني والشركاء (الميزات 20 إلى 23)
  /** 20. سجل إدارة علاقات عملاء المزود وقوائم الولاء (Add-on: dedicated_crm) */
  hasDedicatedCRM: boolean;
  /** 21. نظام خدمة عملاء المزود واستقبال المحادثات والاستفسارات (Add-on: client_messaging_hub) */
  hasClientMessagingHub: boolean;
  /** 22. قناة المحادثة الفورية والدعم الفني المباشر (Add-on: live_chat_support) */
  hasLiveChatVIP: boolean;
  /** 23. تعيين مدير حساب الشريك (Add-on: dedicated_account_manager) */
  hasDedicatedAccountManager: boolean;

  // 4️⃣ مجموعة التسويق والترويج والمتاجر (الميزات 24 إلى 25)
  /** 24. خدمات وكالة التسويق والحملات الترويجية المدارة (Add-on: marketing_agency) */
  hasMarketingAgency: boolean;
  /** 25. متجر المنتجات والمستلزمات المصغر للمزود (Add-on: mini_products_store) */
  hasMiniStore: boolean;

  // === 🏷️ ثالثاً: حقول تمييز وعرض الباقة التسويقية (من 26 إلى 27) ===
  /** 26. تمييز كـ "الباقة الأكثر طلباً" */
  isPopular?: boolean;
  /** 27. نص شارة التمييز التسويقية المخصصة */
  planBadgeText?: string;

  // === ميزات إدارية وتشغيلية إضافية داعمة وتوافقية ===
  hasSupport?: boolean;
  hasWhatsAppAlerts?: boolean;
  hasAdvancedAnalytics?: boolean;
  hasEmployeeManagement: boolean;    
  hasBranchManagement: boolean;      
  hasAdvancedReports: boolean;       
  hasMarketing: boolean;             
  hasAnalytics: boolean;             
  showProviderToCustomers: boolean;  
  hasAdvancedPortal?: boolean;
  hasBOSWorkspace?: boolean;
}

/**
 * تقييم وإرجاع القدرات والصلاحيات المتاحة لباقة محددة باسمها أو معرفها.
 * @param planNameOrId اسم الباقة أو معرف الاشتراك
 * @returns كائن ProviderCapabilities المحتوي على كافة الحدود والصلاحيات
 */
export function getPlanCapabilities(planNameOrId: string): ProviderCapabilities {
  const norm = (planNameOrId || '').toLowerCase().trim();
  
  const isBasic = norm === 'basic' || norm.includes('الأساسية') || norm.includes('الاساسية');
  const isPro = norm === 'pro' || norm.includes('الاحترافية') || norm.includes('الشركات') || norm.includes('المؤسسات');
  const isBusiness = !isBasic && !isPro;

  if (isBasic) {
    return {
      commissionRate: 15,
      hallsLimit: 1,
      servicesLimit: 5,
      staffSeatsLimit: 0,
      hasWeekendPricing: false,
      hasDynamicSurgePricing: false,
      hasDepositSystem: false,
      hasInvoices: false,
      hasGrowthCharts: false,
      hasSmartFinancialForecast: false,
      closedBundlesOnly: true,
      openMarketplaceServices: false,
      hasComprehensiveManagement: false,
      hasFloorPlan360: false,
      hasSixStages: false,
      hasOperationsDashboard: false,
      hasInventory: false,
      hasSuppliers: false,
      hasCalendarSync: false,
      hasDedicatedCRM: false,
      hasClientMessagingHub: true,
      hasLiveChatVIP: false,
      hasDedicatedAccountManager: false,
      hasMarketingAgency: false,
      hasMiniStore: false,
      isPopular: false,
      planBadgeText: '',
      hasSupport: false,
      hasWhatsAppAlerts: false,
      hasAdvancedAnalytics: false,
      hasEmployeeManagement: false,
      hasBranchManagement: false,
      hasAdvancedReports: false,
      hasMarketing: false,
      hasAnalytics: false,
      hasBOSWorkspace: false,
      showProviderToCustomers: true,
    };
  }

  if (isBusiness) {
    return {
      commissionRate: 10,
      hallsLimit: 3,
      servicesLimit: 15,
      staffSeatsLimit: 5,
      hasWeekendPricing: true,
      hasDynamicSurgePricing: false,
      hasDepositSystem: false,
      hasInvoices: true,
      hasGrowthCharts: false,
      hasSmartFinancialForecast: false,
      closedBundlesOnly: false,
      openMarketplaceServices: true,
      hasComprehensiveManagement: true,
      hasFloorPlan360: true,
      hasSixStages: true,
      hasOperationsDashboard: false,
      hasInventory: true,
      hasSuppliers: true,
      hasCalendarSync: true,
      hasDedicatedCRM: true,
      hasClientMessagingHub: true,
      hasLiveChatVIP: true,
      hasDedicatedAccountManager: false,
      hasMarketingAgency: false,
      hasMiniStore: false,
      isPopular: true,
      planBadgeText: 'الأكثر طلباً ⭐',
      hasSupport: true,
      hasWhatsAppAlerts: true,
      hasAdvancedAnalytics: true,
      hasEmployeeManagement: true,
      hasBranchManagement: true,
      hasAdvancedReports: true,
      hasMarketing: true,
      hasAnalytics: true,
      hasBOSWorkspace: true,
      showProviderToCustomers: true,
    };
  }

  // الباقة الاحترافية (Pro Plan) - كامل الصلاحيات والقدرات
  return {
    commissionRate: 5,
    hallsLimit: 'unlimited',
    servicesLimit: 'unlimited',
    staffSeatsLimit: 'unlimited',
    hasWeekendPricing: true,
    hasDynamicSurgePricing: true,
    hasDepositSystem: true,
    hasInvoices: true,
    hasGrowthCharts: true,
    hasSmartFinancialForecast: true,
    closedBundlesOnly: false,
    openMarketplaceServices: true,
    hasComprehensiveManagement: true,
    hasFloorPlan360: true,
    hasSixStages: true,
    hasOperationsDashboard: true,
    hasInventory: true,
    hasSuppliers: true,
    hasCalendarSync: true,
    hasDedicatedCRM: true,
    hasClientMessagingHub: true,
    hasLiveChatVIP: true,
    hasDedicatedAccountManager: true,
    hasMarketingAgency: true,
    hasMiniStore: true,
    isPopular: false,
    planBadgeText: 'الخيار الأفضل للمؤسسات 💎',
    hasSupport: true,
    hasWhatsAppAlerts: true,
    hasAdvancedAnalytics: true,
    hasEmployeeManagement: true,
    hasBranchManagement: true,
    hasAdvancedReports: true,
    hasMarketing: true,
    hasAnalytics: true,
    hasBOSWorkspace: true,
    showProviderToCustomers: true,
  };
}

/**
 * استخراج قدرات وصلاحيات المزود النشط الحالي من التخزين المحلي (localStorage)
 * يدمج صلاحيات باقة الاشتراك مع أي ميزات إضافية مشتراة (Add-ons).
 * @returns ProviderCapabilities قدرات المزود الحالي
 */
export function getActiveProviderCapabilities(): ProviderCapabilities {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      return getPlanCapabilities('business');
    }
    const user = JSON.parse(userStr);
    
    // الإدارة العليا تمتلك جميع القدرات والصلاحيات بصورة مطلقة
    const role = (user.role || '').toLowerCase();
    if (role.includes('admin') || role.includes('مدير') || role.includes('مشرف')) {
      return getPlanCapabilities('pro');
    }

    const providerName = user.name || '';
    const currentProviderName = localStorage.getItem('currentProviderName') || '';

    // قائمة المفاتيح المحتملة المخزن فيها اشتراك المزود
    const keysToTry = [
      providerName ? `provider_subscription_${providerName}` : null,
      currentProviderName ? `provider_subscription_${currentProviderName}` : null,
      user.providerName ? `provider_subscription_${user.providerName}` : null,
      'provider_subscription'
    ].filter(Boolean) as string[];

    let storedSub: string | null = null;
    for (const key of keysToTry) {
      const val = localStorage.getItem(key);
      if (val) {
        storedSub = val;
        break;
      }
    }

    // إذا وجد سجل اشتراك مخزن
    if (storedSub) {
      const parsed = JSON.parse(storedSub);
      const pkg = parsed.packageName || parsed.packageName_display || parsed.planName || parsed.id;
      const baseCaps = getPlanCapabilities(pkg || 'business');
      const addons = Array.isArray(parsed.addons) ? parsed.addons : [];
      
      // دمج الميزات الفردية المستقلة المشتراة كإضافات مع قدرات الباقة الأساسية
      return {
        ...baseCaps,
        commissionRate: parsed.commissionRate !== undefined ? Number(parsed.commissionRate) : baseCaps.commissionRate,
        hallsLimit: parsed.hallsLimit !== undefined ? (parsed.hallsLimit === 'unlimited' || parsed.hallsLimit === '' ? 'unlimited' : (Number(parsed.hallsLimit) + Number(parsed.additionalHalls || 0))) : baseCaps.hallsLimit,
        servicesLimit: parsed.servicesLimit !== undefined ? (parsed.servicesLimit === 'unlimited' || parsed.servicesLimit === '' ? 'unlimited' : (Number(parsed.servicesLimit) + Number(parsed.additionalServices || 0))) : baseCaps.servicesLimit,
        staffSeatsLimit: parsed.staffSeatsLimit !== undefined ? (parsed.staffSeatsLimit === 'unlimited' || parsed.staffSeatsLimit === '' ? 'unlimited' : (Number(parsed.staffSeatsLimit) + Number(parsed.purchasedStaffSlots || 0))) : baseCaps.staffSeatsLimit,

        // 1️⃣ مجموعة الرقابة المالية ومحركات التسعير والتوليف الذكي
        hasWeekendPricing: parsed.includesWeekendPricing ?? (addons.includes('weekend_pricing') ? true : baseCaps.hasWeekendPricing),
        hasDynamicSurgePricing: parsed.includesDynamicSurgePricing ?? (addons.includes('dynamic_surge_pricing') ? true : baseCaps.hasDynamicSurgePricing),
        hasDepositSystem: parsed.includesPartialPayment ?? (addons.includes('partial_payment') ? true : baseCaps.hasDepositSystem),
        hasInvoices: parsed.canExportFinancials ?? parsed.includesAdvancedExport ?? (addons.includes('advanced_export') || addons.includes('invoice_export') ? true : baseCaps.hasInvoices),
        hasGrowthCharts: parsed.includesGrowthCharts ?? parsed.includesInteractiveCharts ?? (addons.includes('interactive_charts') || addons.includes('growth_charts') ? true : baseCaps.hasGrowthCharts),
        hasSmartFinancialForecast: parsed.includesFinancialForecast ?? parsed.includesCashflowForecasting ?? (addons.includes('cashflow_forecasting') || addons.includes('financial_forecast') ? true : baseCaps.hasSmartFinancialForecast),
        closedBundlesOnly: parsed.closedBundlesOnly !== undefined ? !!parsed.closedBundlesOnly : (addons.includes('hybrid_hall_marketplace') ? false : baseCaps.closedBundlesOnly),
        openMarketplaceServices: parsed.openMarketplaceServices !== undefined ? !!parsed.openMarketplaceServices : (addons.includes('vendor_network_integration') ? true : baseCaps.openMarketplaceServices),

        // 2️⃣ مجموعة العمليات الميدانية وهندسة القاعات واللوجستيات
        hasComprehensiveManagement: parsed.includesFullManagement ?? (addons.includes('full_management') ? true : baseCaps.hasComprehensiveManagement),
        hasFloorPlan360: parsed.includesFloorPlan360 ?? (addons.includes('floor_plan_360') ? true : baseCaps.hasFloorPlan360),
        hasSixStages: parsed.includesSixStages ?? (addons.includes('advanced_lifecycle') || addons.includes('six_stages_lifecycle') ? true : baseCaps.hasSixStages),
        hasOperationsDashboard: parsed.includesLogisticsPortal ?? (addons.includes('logistics_operations') || addons.includes('logistics_portal') ? true : baseCaps.hasOperationsDashboard),
        hasInventory: parsed.includesInventory ?? (addons.includes('inventory_management') || addons.includes('inventory') ? true : baseCaps.hasInventory),
        hasSuppliers: parsed.includesSuppliers ?? (addons.includes('suppliers_management') || addons.includes('suppliers') ? true : baseCaps.hasSuppliers),
        hasCalendarSync: parsed.includesCalendarSync ?? (addons.includes('calendar_sync') ? true : baseCaps.hasCalendarSync),

        // 3️⃣ مجموعة إدارة علاقات العملاء والدعم الفني والشركاء
        hasDedicatedCRM: parsed.includesDedicatedCRM ?? (addons.includes('dedicated_crm') ? true : baseCaps.hasDedicatedCRM),
        hasClientMessagingHub: parsed.includesClientMessagingHub ?? (addons.includes('client_messaging_hub') ? true : baseCaps.hasClientMessagingHub),
        hasLiveChatVIP: parsed.hasLiveChatVIP ?? parsed.includesLiveChatVIP ?? parsed.includesLiveChatSupport ?? (addons.includes('live_chat_support') || addons.includes('live_chat_vip') ? true : baseCaps.hasLiveChatVIP),
        hasDedicatedAccountManager: parsed.hasDedicatedAccountManager ?? parsed.includesDedicatedAccountManager ?? (addons.includes('dedicated_account_manager') ? true : baseCaps.hasDedicatedAccountManager),

        // 4️⃣ مجموعة التسويق والترويج والمتاجر
        hasMarketingAgency: parsed.includesMarketingAgency ?? (addons.includes('marketing_agency') ? true : baseCaps.hasMarketingAgency),
        hasMiniStore: parsed.includesMiniProductsStore ?? parsed.includesMiniStore ?? (addons.includes('mini_products_store') ? true : baseCaps.hasMiniStore),

        // سمات العرض
        isPopular: parsed.isPopular ?? baseCaps.isPopular,
        planBadgeText: parsed.planBadgeText ?? baseCaps.planBadgeText,

        // ميزات إضافية وتوافقية
        hasSupport: parsed.hasSupport ?? (addons.includes('support') ? true : baseCaps.hasSupport),
        hasWhatsAppAlerts: parsed.includesWhatsAppCampaignAlerts ?? (addons.includes('whatsapp_campaign_alerts') ? true : baseCaps.hasWhatsAppAlerts),
        hasAdvancedAnalytics: parsed.includesAdvancedStats ?? (addons.includes('advanced_stats') ? true : baseCaps.hasAdvancedAnalytics),
        hasEmployeeManagement: baseCaps.hasEmployeeManagement || addons.includes('provider_staff') || (Number(parsed.purchasedStaffSlots || 0) > 0),
        hasBOSWorkspace: parsed.includesAdvancedProviderDashboard ?? baseCaps.hasBOSWorkspace,
      };
    }

    // الفحص المباشر في كائن المستخدم
    if (user.packageName || user.planName) {
      return getPlanCapabilities(user.packageName || user.planName);
    }
    
    // فحص احتياطي سريع لمزودين محددين
    if (providerName === 'كعب العرابي' || currentProviderName === 'كعب العرابي' || (user.email || '').toLowerCase() === 'kaab909@gmail.com') {
      return getPlanCapabilities('pro');
    }

    // فحص قائمة المزودين المسجلة في LocalStorage
    const savedProviders = localStorage.getItem('providersData');
    if (savedProviders) {
      const list = JSON.parse(savedProviders);
      const item = list.find((p: any) => p.name === providerName || p.name === currentProviderName || p.email === user.email);
      if (item && (item.packageName || item.planName)) {
        return getPlanCapabilities(item.packageName || item.planName);
      }
    }
  } catch (e) {
    console.error("Error evaluating active provider capabilities:", e);
  }
  return getPlanCapabilities('business');
}


