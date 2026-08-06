/**
 * @file capabilityEngine.ts
 * @description محرك تقييم صلاحيات وقدرات المزودين بناءً على باقات الاشتراك لمنصة "ليلة".
 * يتحكم هذا المحرك في إتاحة المميزات والحدود القصوى للقاعات والموظفين والخدمات حسب نوع باقة الاشتراك الفعالة.
 */

/**
 * واجهة قدرات وصلاحيات الشريك/المزود
 */
export interface ProviderCapabilities {
  /** إمكانية الوصول للوحة التشغيل والأعمال المتقدمة */
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
  
  // المستوى الأول: الباقة الأساسية (Basic Provider)
  if (
    norm === 'basic' ||
    norm === 'الباقة الأساسية' ||
    norm === 'الباقةالأساسية' ||
    norm === 'الباقة الاساسية' ||
    (norm.includes('أساسية') && !norm.includes('متقدمة') && !norm.includes('أعمال') && !norm.includes('احترافية')) || 
    (norm.includes('اساسيه') && !norm.includes('متقدمة') && !norm.includes('أعمال') && !norm.includes('احترافية'))
  ) {
    return {
      hasAdvancedPortal: false,
      hasEmployeeManagement: false,
      hasBranchManagement: false,
      hasAdvancedReports: false,
      hasMarketing: false,
      hasAnalytics: false,
      hasInventory: false,
      hasSuppliers: false,
      hasOperationsDashboard: false,
      hallsLimit: 1,
      servicesLimit: 5,
      staffSeatsLimit: 0,
      showProviderToCustomers: false,
    };
  }
  
  // المستوى الثاني: باقة الأعمال / المتقدمة (Business / Advanced Provider)
  if (
    norm.includes('business') || 
    norm.includes('الأعمال') || 
    norm.includes('الاعمال') || 
    norm === 'business' ||
    norm.includes('المتقدمة') ||
    norm.includes('المتقدمه')
  ) {
    return {
      hasAdvancedPortal: true,
      hasEmployeeManagement: true,
      hasBranchManagement: true,
      hasAdvancedReports: true,
      hasMarketing: true,
      hasAnalytics: false,
      hasInventory: true,
      hasSuppliers: true,
      hasOperationsDashboard: false,
      hallsLimit: 3,
      servicesLimit: 15,
      staffSeatsLimit: 5,
      showProviderToCustomers: true,
    };
  }

  // المستوى الثالث: الباقة الاحترافية الشاملة (Pro / VIP / Unlimited)
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
      if (pkg) {
        return getPlanCapabilities(pkg);
      }
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

