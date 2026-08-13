/**
 * @file capabilityEngine.ts
 * @description محرك تقييم صلاحيات وقدرات المزودين بناءً على باقات الاشتراك لمنصة "ليلة".
 * يتحكم هذا المحرك في إتاحة المميزات والحدود القصوى للقاعات والموظفين والخدمات حسب نوع باقة الاشتراك الفعالة.
 */

/**
 * واجهة قدرات وصلاحيات الشريك/المزود
 */
export interface ProviderCapabilities {
  /** إمكانية الوصول للوحة التشغيل والأعمال المتقدمة في مساحة عمل المزود الموحدة */
  hasAdvancedPortal: boolean;        
  /** إمكانية إدارة الموظفين والمقرات والصلاحيات */
  hasEmployeeManagement: boolean;    
  /** إمكانية إدارة الفروع والمقرات المتعددة */
  hasBranchManagement: boolean;      
  /** إمكانية عرض واستخراج التقارير والتحليلات المالية المتقدمة */
  hasAdvancedReports: boolean;       
  /** إمكانية إنشاء وإدارة الحملات التسويقية والترويجية */
  hasMarketing: boolean;             
  /** إمكانية الوصول لتحليلات النمو والتوقعات المالية الذكية */
  hasAnalytics: boolean;             
  /** إمكانية إدارة المخزون والمستودعات */
  hasInventory: boolean;             
  /** إمكانية إدارة الموردين والمشتريات */
  hasSuppliers: boolean;             
  /** إمكانية تشغيل العمليات اللوجستية المتقدمة وإدارة السيولة */
  hasOperationsDashboard: boolean;   
  /** ميزة استعراض وتصدير الفواتير */
  hasInvoices: boolean;
  /** ميزة الدعم الفني المباشر */
  hasSupport: boolean;
  /** ميزة الرسومات التفاعلية والنمو */
  hasGrowthCharts: boolean;
  /** ميزة ميزانية التوقعات المالية الذكية */
  hasSmartFinancialForecast: boolean;
  /** ميزة نظام الدفع الجزئي (العربون) */
  hasDepositSystem: boolean;
  /** ميزة لوحة الإحصائيات المتقدمة */
  hasAdvancedAnalytics: boolean;
  /** ميزة الإدارة الشاملة للحجوزات والخدمات */
  hasComprehensiveManagement: boolean;
  /** ميزة مساحة تشغيل الأعمال المتقدمة في مساحة عمل المزود الموحدة */
  hasBOSWorkspace: boolean;
  /** الحد الأقصى للقاعات والمنشآت المسموح بإضافتها */
  hallsLimit: number | 'unlimited';   
  /** الحد الأقصى للخدمات المساندة المسموح بإضافتها */
  servicesLimit: number | 'unlimited';
  /** الحد الأقصى لمقاعد الموظفين المسموح بها */
  staffSeatsLimit: number | 'unlimited'; 
  /** إمكانية التحكم بإظهار بيانات الموفر للعملاء */
  showProviderToCustomers: boolean;  
}

/**
 * تقييم وإرجاع القدرات والصلاحيات المتاحة لباقة محددة باسمها أو معرفها.
 * @param planNameOrId اسم الباقة أو معرف الاشتراك
 * @returns كائن ProviderCapabilities المحتوي على كافة الحدود والصلاحيات
 */
export function getPlanCapabilities(planNameOrId: string): ProviderCapabilities {
  const norm = (planNameOrId || '').toLowerCase().trim();
  
  // توفير جميع إمكانيات ومميزات BOS Workspace في لوحة المزود الموحدة لجميع الباقات
  return {
    hasAdvancedPortal: true,
    hasEmployeeManagement: true,
    hasBranchManagement: true,
    hasAdvancedReports: true,
    hasMarketing: true,
    hasAnalytics: true,
    hasInventory: true,
    hasSuppliers: true,
    hasOperationsDashboard: true,
    hasInvoices: true,
    hasSupport: true,
    hasGrowthCharts: true,
    hasSmartFinancialForecast: true,
    hasDepositSystem: true,
    hasAdvancedAnalytics: true,
    hasComprehensiveManagement: true,
    hasBOSWorkspace: true,
    hallsLimit: 'unlimited',
    servicesLimit: 'unlimited',
    staffSeatsLimit: 'unlimited',
    showProviderToCustomers: true,
  };
}

/**
 * استخراج قدرات وصلاحيات المزود النشط الحالي من التخزين المحلي (localStorage)
 * @returns ProviderCapabilities قدرات المزود الحالي
 */
export function getActiveProviderCapabilities(): ProviderCapabilities {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) {
      return getPlanCapabilities('basic'); // التخلف عن الباقة الأساسية في حال عدم تسجيل الدخول
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
      const baseCaps = getPlanCapabilities(pkg || 'basic');
      
      // دمج الميزات الفردية المستقلة المشتراة كإضافات مع قدرات الباقة الأساسية
      return {
        ...baseCaps,
        hasInventory: parsed.hasInventory !== undefined ? !!parsed.hasInventory : (parsed.includesInventory !== undefined ? !!parsed.includesInventory : baseCaps.hasInventory),
        hasSuppliers: parsed.hasSuppliers !== undefined ? !!parsed.hasSuppliers : (parsed.includesSuppliers !== undefined ? !!parsed.includesSuppliers : baseCaps.hasSuppliers),
        hasInvoices: parsed.hasInvoices !== undefined ? !!parsed.hasInvoices : baseCaps.hasInvoices,
        hasSupport: parsed.hasSupport !== undefined ? !!parsed.hasSupport : baseCaps.hasSupport,
        hasGrowthCharts: parsed.hasGrowthCharts !== undefined ? !!parsed.hasGrowthCharts : baseCaps.hasGrowthCharts,
        hasSmartFinancialForecast: parsed.hasSmartFinancialForecast !== undefined ? !!parsed.hasSmartFinancialForecast : baseCaps.hasSmartFinancialForecast,
        hasDepositSystem: parsed.hasDepositSystem !== undefined ? !!parsed.hasDepositSystem : baseCaps.hasDepositSystem,
        hasAdvancedAnalytics: parsed.hasAdvancedAnalytics !== undefined ? !!parsed.hasAdvancedAnalytics : baseCaps.hasAdvancedAnalytics,
        hasComprehensiveManagement: parsed.hasComprehensiveManagement !== undefined ? !!parsed.hasComprehensiveManagement : baseCaps.hasComprehensiveManagement,
        hasBOSWorkspace: parsed.hasBOSWorkspace !== undefined ? !!parsed.hasBOSWorkspace : (parsed.hasOperationsDashboard !== undefined ? !!parsed.hasOperationsDashboard : baseCaps.hasBOSWorkspace),
        hasAdvancedPortal: parsed.hasBOSWorkspace || parsed.hasAdvancedPortal !== undefined ? (!!parsed.hasBOSWorkspace || !!parsed.hasAdvancedPortal) : baseCaps.hasAdvancedPortal,
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
  return getPlanCapabilities('business'); // خيار افتراضي قياسي للشركاء
}

