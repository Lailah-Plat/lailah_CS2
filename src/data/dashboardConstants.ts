import React from 'react';
import {
  LayoutDashboard,
  CalendarDays,
  Building2,
  Package,
  CreditCard,
  Wallet,
  Megaphone,
  Users,
  Briefcase,
  UserCog,
  HeadphonesIcon,
  MessageCircle,
  Settings,
  Star,
  UserCircle,
  Activity,
  FileText,
  ClipboardList,
  Users2,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Share2,
  Cpu,
} from 'lucide-react';
import { Hall, Promotion } from '../types';

export type TabId =
  | 'overview'
  | 'cockpit'
  | 'bookings'
  | 'halls'
  | 'services'
  | 'subscriptions'
  | 'finance'
  | 'marketing'
  | 'users'
  | 'customers'
  | 'providers'
  | 'staff'
  | 'support'
  | 'messages'
  | 'settings'
  | 'reviews'
  | 'provider_profile'
  | 'staff_profile'
  | 'inventory'
  | 'suppliers'
  | 'provider_staff'
  | 'diagnostics'
  | 'unified_invoice'
  | 'financial_settings'
  | 'activity_log'
  | 'roadmap_phases'
  | 'urgent_alerts'
  | 'feature_adoption'
  | 'affiliate_referrals'
  | 'system_health'
  | 'technical_diagnostics'
  | 'lpas_studio';

export interface TabList {
  id: TabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

export const TABS: TabList[] = [
  { id: 'overview', label: 'مركز القيادة والعمليات', icon: LayoutDashboard },
  { id: 'cockpit', label: 'مركز القيادة والعمليات الموحد', icon: Activity },
  { id: 'urgent_alerts', label: 'الإنذارات العاجلة 🚨', icon: AlertTriangle },
  { id: 'bookings', label: 'مركز الحجوزات والطلبات', icon: CalendarDays },
  { id: 'halls', label: 'إدارة الأماكن والقاعات', icon: Building2 },
  { id: 'services', label: 'مركز الخدمات واللوجستيات', icon: Package },
  { id: 'inventory', label: 'إدارة الأصول والمخزون', icon: ClipboardList },
  { id: 'suppliers', label: 'إدارة الموردين والإمداد', icon: Users },
  { id: 'subscriptions', label: 'مركز الباقات والاشتراكات', icon: CreditCard },
  { id: 'finance', label: 'المركز المالي والخزينة', icon: Wallet },
  { id: 'financial_settings', label: 'الإعدادات المالية والرقابة', icon: Wallet },
  { id: 'marketing', label: 'مركز النمو والتسويق (LPAS)', icon: Megaphone },
  { id: 'lpas_studio', label: 'محرك صفحات الهبوط (LPAS) 🎯', icon: Sparkles },
  { id: 'feature_adoption', label: 'تحليلات استخدام المزايا 📈', icon: Sparkles },
  { id: 'users', label: 'إدارة المستخدمين والكوتا', icon: Users },
  { id: 'customers', label: 'إدارة العملاء والولاء', icon: Users },
  { id: 'providers', label: 'إدارة طلبات الشركاء', icon: Briefcase },
  { id: 'staff', label: 'مركز الكوادر والصلاحيات', icon: UserCog },
  { id: 'provider_staff', label: 'إدارة العاملين والصلاحيات', icon: Users2 },
  { id: 'support', label: 'مركز الدعم والمساندة', icon: HeadphonesIcon },
  { id: 'reviews', label: 'مركز الجودة والتقييمات', icon: Star },
  { id: 'messages', label: 'مركز المراسلة والبريد', icon: MessageCircle },
  { id: 'technical_diagnostics', label: 'التشخيصات والاختبارات الفنية 🛡️', icon: Cpu },
  { id: 'settings', label: 'الإعدادات والربط السيادي', icon: Settings },
  { id: 'roadmap_phases', label: 'خارطة الطريق والإطلاق المرحلي', icon: ShieldCheck },
  { id: 'provider_profile', label: 'إدارة بياناتي', icon: UserCircle },
  { id: 'staff_profile', label: 'إدارة بياناتي', icon: UserCircle },
  { id: 'activity_log', label: 'سجل النشاط', icon: ClipboardList },
];

export const sectionTabsMap: Record<string, { label: string, key: string }[]> = {
  'الفحص والاختبارات الذاتية': [
    { label: 'لوحة فحص تفاعلية متكاملة (E2E Tester Tab)', key: 'e2e_tester_tab' },
    { label: 'لوحة فحص تفاعلية متكاملة للخدمات', key: 'e2e_services_tester_tab' }
  ],
  'الرئيسية': [
    { label: 'مؤشرات الأداء والتحليلات', key: 'overview_kpis_tab' },
    { label: 'العمليات والإجراءات التنفيذية', key: 'performance_charts_tab' },
  ],
  'إدارة الحجوزات': [
    { label: 'تبويب قائمة وجدول الحجوزات', key: 'bookings_table_tab' },
    { label: 'تبويب التقويم التفاعلي والتواريخ', key: 'interactive_calendar_tab' },
    { label: 'تبويب طلبات الخدمات المساندة والجديدة', key: 'extra_services_requests_tab' },
  ],
  'إدارة القاعات': [
    { label: 'تبويب دليل وقائمة كافة القاعات', key: 'halls_directory_tab' },
    { label: 'تبويب تصنيفات القاعات ومرفقاتها المتنوعة', key: 'categories_facilities_tab' },
  ],
  'إدارة الخدمات': [
    { label: 'تبويب الخدمات الأساسية والمكملة', key: 'core_services_tab' },
    { label: 'تبويب عقود وجهات مزودي الخدمات الخارجية', key: 'external_providers_tab' },
  ],
  'إدارة المخزون': [
    { label: 'تبويب دليل المواد والأصول التشغيلية', key: 'inventory_items_assets_tab' },
    { label: 'تبويب حركة العهد وسجلات التلف المالي', key: 'inventory_audit_losses_tab' },
  ],
  'إدارة الموردين': [
    { label: 'تبويب دليل عقود وإدارات الموردين', key: 'suppliers_directory_tab' },
    { label: 'تبويب المدفوعات والمعاملات والطلبات المستحقة', key: 'suppliers_orders_payments_tab' },
  ],
  'إدارة الباقات': [
    { label: 'تبويب العروض الترويجية والخصومات الموسمية', key: 'discounts_promotions_tab' },
    { label: 'تبويب الباقات المدفوعة والاشتراكات السنوية', key: 'paid_packages_subs_tab' },
  ],
  'الإدارة المالية': [
    { label: 'تبويب حركة الحسابات الدائنة والمدينة', key: 'ar_ap_cashflow_tab' },
    { label: 'تبويب الفواتير الصادرة وسندات الصرف والقبض', key: 'invoices_receipts_vouchers_tab' },
  ],
  'التسويق والإعلانات': [
    { label: 'تبويب إدارة الإعلانات والحملات التسويقية', key: 'active_marketing_campaigns_tab' },
    { label: 'تبويب طلبات تمكين الإعلانات للشركاء', key: 'partners_ad_campaign_requests_tab' },
  ],
  'إدارة المستخدمين': [
    { label: 'تبويب حسابات مدراء النظام والمسؤولين الكاملة', key: 'full_system_admins_accounts_tab' },
    { label: 'تبويب حسابات موظفي تشغيل المنصة', key: 'operation_staff_accounts_tab' },
  ],
  'إدارة العملاء والولاء': [
    { label: 'تبويب قائمة وبيانات المشتركين والعملاء', key: 'customers_info_profiles_tab' },
    { label: 'تبويب برامج ونقاط الولاء وبطاقات النقاط', key: 'loyalty_club_rewards_tab' },
  ],
  'إدارة الشركاء': [
    { label: 'تبويب دليل ونشاط الشركاء والملاك', key: 'active_partners_landlords_tab' },
    { label: 'تبويب طلبات التسجيل والانضمام والمستندات', key: 'new_partners_sign_requests_tab' },
  ],
  'الموظفين والصلاحيات': [
    { label: 'تبويب إدارة موظفي الموارد البشرية بالمنصة', key: 'hr_employees_admin_tab' },
    { label: 'تبويب مصفوفة الصلاحيات والرتب الكاملة', key: 'general_permissions_matrix_tab' },
  ],
  'إدارة العاملين والصلاحيات': [
    { label: 'تبويب موظفي الشركاء ومزودي الخدمات', key: 'provider_employees_list_tab' },
    { label: 'تبويب مصفوفة صلاحيات عاملي الفروع الخارجيين', key: 'provider_employees_permissions_tab' },
  ],
  'الدعم الفني': [
    { label: 'تبويب تذاكر الدعم الفني ومتابعة المشكلات', key: 'support_tickets_dashboard_tab' },
    { label: 'تبويب المحادثات الحية والمساعدة الفورية المباشرة', key: 'live_sessions_chat_tab' },
  ],
  'التقييمات والآراء': [
    { label: 'تبويب مراجعات وتقييمات العملاء المنشورة', key: 'customer_published_reviews_tab' },
    { label: 'تبويب إحصائيات رضا العملاء الإجمالي للخدمات', key: 'reviews_satisfaction_analytics_tab' },
  ],
  'إدارة الرسائل': [
    { label: 'تبويب صندوق المراسلات الداخلي والرسائل', key: 'internal_mailbox_inbox_tab' },
    { label: 'تبويب المحادثات والرسائل المباشرة للفواتير', key: 'billing_chat_inquiries_tab' },
  ],
  'الإعدادات': [
    { label: 'تبويب أمن النظام وسياسات الـ OTP وحماية الحسابات', key: 'security_rules_settings_tab' },
    { label: 'تبويب تكامل بوابات الدفع ولينكات الرسائل', key: 'payment_apis_sms_settings_tab' },
  ],
  'إدارة بياناتي': [
    { label: 'تبويب تعديل بيانات الملف والنشاط التجاري', key: 'profile_info_editing_tab' },
  ]
};

export {
  initialHalls,
  getDynamicInitialBookings,
  initialBookings,
  getDynamicInitialSupportRequests,
  initialSupportRequests,
  initialPromotions,
  initialServices,
  CURRENT_PROVIDER,
  initialProviders,
  initialCustomers,
  initialCampaigns,
  initialRegions,
  initialStaff,
  roles,
  formatCurrency,
  getStatusColor,
  mockChats,
  mockMessages
} from './mockData';
