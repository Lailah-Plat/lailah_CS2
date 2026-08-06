import { useApp } from '../context/AppContext';

export const TRANSLATIONS: Record<'ar' | 'en', Record<string, string>> = {
  ar: {
    // Sidebar Tabs
    'overview': 'لوحة الإحصائيات',
    'cockpit': 'لوحة الإجراءات والإحصائيات',
    'bookings': 'إدارة الحجوزات',
    'halls': 'إدارة القاعات والخدمات ✨',
    'services': 'إدارة الخدمات',
    'inventory': 'إدارة المخزون',
    'suppliers': 'إدارة الموردين',
    'subscriptions': 'إدارة الباقات والاشتراكات',
    'finance': 'الإدارة المالية',
    'unified_invoice': 'الفاتورة الضريبية الموحدة',
    'marketing': 'التسويق والإعلانات',
    'users': 'إدارة المستخدمين',
    'customers': 'إدارة العملاء والولاء',
    'providers': 'طلبات الشركاء',
    'staff': 'الموظفين والصلاحيات',
    'provider_staff': 'إدارة العاملين والصلاحيات',
    'support': 'الدعم الفني والشكاوى',
    'reviews': 'التقييمات والآراء',
    'messages': 'إدارة الرسائل',
    'diagnostics': 'الفحص والاختبارات الذاتية',
    'settings': 'إعدادات النظام',
    'provider_profile': 'إدارة بياناتي',

    // Global Header & Common Actions
    'logout': 'تسجيل الخروج والعودة للرئيسية',
    'search': 'بحث...',
    'searchPlaceholder': 'ابحث في الحقول المتاحة...',
    'add': 'إضافة جديد',
    'edit': 'تعديل',
    'delete': 'حذف',
    'save': 'حفظ التغييرات',
    'cancel': 'إلغاء',
    'confirm': 'تأكيد',
    'actions': 'الإجراءات',
    'status': 'الحالة',
    'date': 'التاريخ',
    'filter': 'تصفية',
    'all': 'الكل',
    'export': 'تصدير التقرير',
    'import': 'استيراد البيانات',
    'loading': 'جاري التحميل...',
    'noData': 'لا توجد بيانات متاحة حالياً',

    // General Metrics & KPIs
    'kpi_total_revenue': 'إجمالي الإيرادات',
    'kpi_total_expenses': 'إجمالي المصروفات',
    'kpi_net_profit': 'صافي الأرباح التشغيلية',
    'kpi_bookings_count': 'إجمالي الحجوزات المعتمدة',
    'kpi_new_customers': 'العملاء الجدد والولاء',
    'kpi_utilization_rate': 'معدل إشغال المرافق',
    'sar': 'ريال سعودي',

    // Financial Module
    'fin_revenue_chart': 'الإيرادات والتدفق المالي',
    'fin_expense_chart': 'المصروفات والمشتريات',
    'fin_recent_transactions': 'الحركات المالية الأخيرة',
    'fin_add_revenue': 'تسجيل إيراد مالي جديد',
    'fin_add_expense': 'تسجيل مصروف مالي جديد',
    'fin_amount': 'المبلغ',
    'fin_category': 'التصنيف',
    'fin_reference': 'رقم المرجع',
    'fin_payment_method': 'طريقة الدفع',

    // Language Toggle
    'langName': 'English',
    'themeMode': 'مظهر لوحة التحكم',
    'welcome': 'أهلاً بك بكامل الصلاحيات',
    'unauthorized': 'غير مصرح لك بالدخول لهذه الصفحة'
  },
  en: {
    // Sidebar Tabs
    'overview': 'Statistical Dashboard',
    'cockpit': 'Operations Cockpit',
    'bookings': 'Bookings Management',
    'halls': 'Halls & Services ✨',
    'services': 'Services Directory',
    'inventory': 'Inventory Tracking',
    'suppliers': 'Supplier Contracts',
    'subscriptions': 'Subscriptions & Packages',
    'finance': 'Financial Ledger',
    'unified_invoice': 'Unified Tax Invoice',
    'marketing': 'Marketing & Campaigns',
    'users': 'User Accounts',
    'customers': 'Loyalty & Customers',
    'providers': 'Partner Applications',
    'staff': 'Platform Employees',
    'provider_staff': 'Staff & Roles',
    'support': 'Support Tickets & Help',
    'reviews': 'Ratings & Reviews',
    'messages': 'Mail & Messaging Inbox',
    'diagnostics': 'Self-Diagnostics & Diagnostics',
    'settings': 'System Configurations',
    'provider_profile': 'My Business Profile',

    // Global Header & Common Actions
    'logout': 'Log Out & Return Home',
    'search': 'Search...',
    'searchPlaceholder': 'Search dynamic records...',
    'add': 'Add New Entry',
    'edit': 'Edit',
    'delete': 'Delete',
    'save': 'Save Changes',
    'cancel': 'Cancel',
    'confirm': 'Confirm',
    'actions': 'Actions',
    'status': 'Status',
    'date': 'Date',
    'filter': 'Filter',
    'all': 'All',
    'export': 'Export Report',
    'import': 'Import Data',
    'loading': 'Loading database...',
    'noData': 'No records found matching criteria',

    // General Metrics & KPIs
    'kpi_total_revenue': 'Total Cash Inflow',
    'kpi_total_expenses': 'Total Expenses',
    'kpi_net_profit': 'Net Operating Profit',
    'kpi_bookings_count': 'Total Confirmed Bookings',
    'kpi_new_customers': 'New Customer Registrations',
    'kpi_utilization_rate': 'Asset Utilization Rate',
    'sar': 'SAR',

    // Financial Module
    'fin_revenue_chart': 'Revenue & Inflows Trend',
    'fin_expense_chart': 'Operating & Vendor Expenses',
    'fin_recent_transactions': 'Recent Accounting Ledger Entries',
    'fin_add_revenue': 'Record New Revenue Entry',
    'fin_add_expense': 'Record New Expense Entry',
    'fin_amount': 'Amount (SAR)',
    'fin_category': 'Category Type',
    'fin_reference': 'Reference Ref',
    'fin_payment_method': 'Gateway Channel',

    // Language Toggle
    'langName': 'العربية',
    'themeMode': 'Control Panel Theme',
    'welcome': 'Welcome with Full Credentials',
    'unauthorized': 'You are unauthorized to access this view'
  }
};

export const useTranslation = () => {
  const context = useApp();
  const lang = (context && context.language) || 'ar';
  
  const t = (key: string, fallback?: string): string => {
    const translationsForLang = TRANSLATIONS[lang as 'ar' | 'en'];
    if (translationsForLang && key in translationsForLang) {
      return translationsForLang[key];
    }
    return fallback !== undefined ? fallback : key;
  };

  return { t, language: lang, dir: lang === 'ar' ? 'rtl' : 'ltr' };
};
