import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from '../utils/translation';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';

// Lucide Icons
import {
  X,
  User,
  LogOut,
  Sun,
  Moon,
  Globe,
  Menu,
  Lock,
  Bell,
  Check,
  Trash,
  MessageSquare,
  Mail,
  Crown,
  ArrowUpRight,
  Building2,
  Calendar,
  MessageCircle,
  Sparkles,
  HelpCircle,
  Briefcase
} from 'lucide-react';

// Dashboard Components
import { ProviderSubscriptionTabbed } from '../components/ProviderSubscriptionTabbed';
import { HallsUnifiedSection } from '../components/dashboard/HallsUnifiedSection';
import { BookingsSection } from '../components/dashboard/BookingsSection';
import { ProviderProfileComponent } from '../components/ProviderProfileComponent';
import { MessagesSection } from '../components/dashboard/MessagesSection';
import { SettingsSection } from '../components/admin/SettingsSection';
import { SupportSection } from '../components/admin/SupportSection';
import { ReviewsSection } from '../components/admin/ReviewsSection';
import UnifiedInvoiceTab from '../components/UnifiedInvoiceTab';
import { ProviderActivityLogSection } from '../components/provider/ProviderActivityLogSection';
import { ProviderMarketingWizard, AdRequestProviderWizard } from '../components/MarketingComponents';

// Direct component imports for stability
import { ProviderDashboard } from '../components/provider/ProviderDashboard';
import FinanceDashboard from '../components/FinanceDashboard';
import { InventoryDashboard } from '../components/InventoryDashboard';
import { SuppliersDashboard } from '../components/SuppliersDashboard';
import ServicesManagement from '../components/ServicesManagement';
import ProviderStaffManagement from '../components/ProviderStaffManagement';

// Modals & General components
import { UnifiedAppModals } from '../components/modals/UnifiedAppModals';
import { BookingAndHallModals } from '../components/modals/BookingAndHallModals';
import { SubscriptionModals } from '../components/modals/SubscriptionModals';
import { DeleteConfirmationModal } from '../components/modals/DeleteConfirmationModal';
import { PledgeDetailsModal } from '../components/modals/PledgeDetailsModal';
import ErrorBoundary from '../components/common/ErrorBoundary';

import { useAppState } from '../hooks/useAppState';
import { getActiveProviderCapabilities } from '../utils/capabilityEngine';
import { AppProvider } from '../context/AppContext';
import { TABS, sectionTabsMap, roles } from '../data/dashboardConstants';
import { formatBookingId } from '../utils/idUtils';

// Loading Spinner for lazy-loaded components
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="relative w-12 h-12">
      <div className="absolute top-0 left-0 w-full h-full border-4 border-amber-500/20 rounded-full"></div>
      <div className="absolute top-0 left-0 w-full h-full border-4 border-t-amber-500 rounded-full animate-spin"></div>
    </div>
  </div>
);

export default function ProviderDashboardPage() {
  const state = useAppState();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Force role to provider inside this dedicated view
  const userRole = 'provider';
  const { toggleLanguage } = state;

  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const profileContainerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (profileContainerRef.current && !profileContainerRef.current.contains(event.target as Node)) {
        setIsProfileDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("IS_AUTHENTICATED");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    window.location.href = '/';
  };

  const currentProviderName = state.currentProviderName || localStorage.getItem('currentProviderName') || 'قاعة اللؤلؤة';
  
  const providerNotifications = useMemo(() => {
    return (state.notifications || []).filter(n => {
      if (n.recipientRole === 'all') return true;
      if (n.recipientRole === 'provider') {
        return !n.recipientName || n.recipientName === currentProviderName;
      }
      return false;
    });
  }, [state.notifications, currentProviderName]);

  const unreadCount = useMemo(() => {
    return providerNotifications.filter(n => !n.isRead).length;
  }, [providerNotifications]);

  const unreadMessagesCount = useMemo(() => {
    const chats = state.serviceChats || [];
    const provNameLower = (currentProviderName || '').trim().toLowerCase();
    const matchesProvider = (pName: string) => {
      const lower = (pName || '').trim().toLowerCase();
      return lower === provNameLower || lower.includes(provNameLower) || provNameLower.includes(lower);
    };
    return chats
      .filter((c: any) => matchesProvider(c.providerName))
      .reduce((sum: number, c: any) => sum + (c.unread || 0), 0);
  }, [currentProviderName, state.serviceChats]);

  const handleMarkAllAsRead = () => {
    if (state.setNotifications) {
      state.setNotifications(prev => 
        prev.map(n => {
          if (n.recipientRole === 'provider' && (!n.recipientName || n.recipientName === currentProviderName)) {
            return { ...n, isRead: true };
          }
          return n;
        })
      );
    }
  };

  const handleToggleRead = (id: string) => {
    if (state.setNotifications) {
      state.setNotifications(prev =>
        prev.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n)
      );
    }
  };

  const handleDeleteNotification = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (state.setNotifications) {
      state.setNotifications(prev => prev.filter(n => n.id !== id));
    }
  };

  useEffect(() => {
    if (activeTab === 'settings' || activeTab === 'unified_invoice') {
      setActiveTab('overview');
    }
  }, [activeTab]);

  // Dynamic Delete Dispatcher
  const handleDelete = () => {
    if (!state.deleteData) return;
    const { type, id } = state.deleteData;
    const anyState = state as any;
    switch (type) {
      case 'hall':
      case 'halls':
        if (anyState.handleDeleteHall) anyState.handleDeleteHall(id);
        break;
      case 'service':
      case 'services':
        if (anyState.handleDeleteService) anyState.handleDeleteService(id);
        break;
      case 'customer':
      case 'customers':
        if (anyState.handleDeleteCustomer) anyState.handleDeleteCustomer(id);
        break;
      case 'campaign':
      case 'campaigns':
        if (anyState.handleDeleteCampaign) anyState.handleDeleteCampaign(id);
        break;
      case 'staff':
      case 'staffs':
        if (anyState.handleDeleteStaff) anyState.handleDeleteStaff(id);
        break;
      case 'provider_staff':
        if (anyState.handleDeleteProviderStaff) anyState.handleDeleteProviderStaff(id);
        break;
      case 'subscription':
      case 'subscriptions':
        if (anyState.handleDeleteSubscription) anyState.handleDeleteSubscription(id);
        break;
      case 'region':
      case 'regions':
        if (anyState.handleDeleteRegion) anyState.handleDeleteRegion(id);
        break;
      case 'city':
      case 'cities':
        if (anyState.handleDeleteCity) anyState.handleDeleteCity((state.deleteData as any).regionId, (state.deleteData as any).cityIndex);
        break;
      case 'extra_service':
      case 'extra_services':
        if (anyState.handleDeleteExtraService) anyState.handleDeleteExtraService(id as any);
        break;
      default:
        console.warn('Unknown delete type:', type);
    }
    if (state.setDeleteData) state.setDeleteData(null);
  };

  // Google Maps Confirmation Handler
  const handleMapConfirm = (address: string, location?: { lat: number; lng: number }, extra?: { region: string; city: string }) => {
    if (!state.mapTarget) return;
    const { type } = state.mapTarget;
    if (type === 'staff') {
      if (state.setStaffForm) state.setStaffForm((prev: any) => ({ ...prev, nationalAddress: address }));
    } else if (type === 'customer') {
      if (state.setCustomerForm) state.setCustomerForm((prev: any) => ({ ...prev, nationalAddress: address }));
    } else if (type === 'provider') {
      if (state.setProviderForm) state.setProviderForm((prev: any) => ({ ...prev, nationalAddress: address }));
    } else if (type === 'hall') {
      if (state.setHallForm) state.setHallForm((prev: any) => ({ ...prev, nationalAddress: address }));
    }
    if (state.setIsMapModalOpen) state.setIsMapModalOpen(false);
  };

  const capabilities = useMemo(() => {
    return getActiveProviderCapabilities();
  }, [state.providerSubscription]);

  // Filter visible tabs for Provider view based on dynamic package features
  const visibleTabs = useMemo(() => {
    if (!capabilities.hasAdvancedPortal) {
      // Basic Provider (Level 1: Provider Gateway)
      const basicAllowedIds = [
        'overview',
        'subscriptions',
        'provider_profile',
        'support'
      ];
      return TABS.filter(tab => basicAllowedIds.includes(tab.id));
    }

    const sub = state.providerSubscription || {};
    
    // Always allowed provider tabs
    const allowedIds = [
      'overview',
      'bookings',
      'halls',
      'services',
      'finance',
      'subscriptions',
      'reviews',
      'messages',
      'provider_profile',
      'activity_log',
      'marketing',
      'provider_staff'
    ];

    // inventory: Hide if includesInventory is false
    if (sub.includesInventory !== false) {
      allowedIds.push('inventory');
    }

    // suppliers: Hide if includesSuppliers is false
    if (sub.includesSuppliers !== false) {
      allowedIds.push('suppliers');
    }

    // support: Show only if hasSupport === true
    if (sub.hasSupport === true) {
      allowedIds.push('support');
    }

    return TABS.filter(tab => allowedIds.includes(tab.id));
  }, [state.providerSubscription, capabilities]);

  const formatCurrency = (amount: number) => {
    return typeof amount === 'number' ? `${amount.toLocaleString('ar-SA')} ر.س` : (amount || '');
  };

  const renderContent = () => {
    const anyState = state as any;

    // Safety check for subscription-restricted tabs
    const isAllowed = visibleTabs.some(t => t.id === activeTab);
    if (!isAllowed) {
      return (
        <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300 font-sans mt-12" dir="rtl">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto text-amber-500">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">قسم غير مدرج في باقتك الحالية</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              عذراً، هذا القسم غير مدرج في باقتك الحالية. يرجى ترقية اشتراكك للوصول إليه والاستفادة من كافة المزايا المتقدمة لتسهيل عملياتك.
            </p>
          </div>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-bold rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 text-sm flex items-center justify-center gap-2"
          >
            <span>ترقية باقة الاشتراك الآن</span>
            <span>←</span>
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
        if (!capabilities.hasAdvancedPortal) {
          return (
            <div className="space-y-8 p-6 lg:p-8 max-w-5xl mx-auto overflow-y-auto h-full scrollbar-none font-sans" dir="rtl">
              {/* Header Card */}
              <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-850 rounded-3xl p-6 lg:p-8 text-right shadow-2xl">
                <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
                <div className="absolute bottom-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl translate-x-12 translate-y-12"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-3">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-400 text-xs font-black rounded-full border border-amber-500/25">
                      <Briefcase className="w-3.5 h-3.5" />
                      <span>بوابة الشريك الأساسية | Provider Gateway</span>
                    </span>
                    <h1 className="text-2xl lg:text-3xl font-black text-white">أهلاً بك، {currentProviderName} 👋</h1>
                    <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
                      تتم إدارة عملياتك، وقاعاتك، وخدماتك، وحجوزاتك بالكامل وبشكل مدمج ومباشر من خلال بوابات واجهة العميل المخصصة لتسهيل تجربة الاستخدام.
                    </p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('subscriptions')}
                    className="shrink-0 px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-black text-xs rounded-2xl shadow-lg hover:shadow-amber-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 border border-amber-400/20 cursor-pointer"
                  >
                    <Crown className="w-4 h-4 text-amber-200 fill-amber-200" />
                    <span>ترقية الاشتراك لنظام BOS الكامل</span>
                  </button>
                </div>
              </div>

              {/* Four Main Portal Links Grid */}
              <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  <span>بوابات التشغيل السريع المتاحة لك</span>
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Portal 1: Halls and Services */}
                  <div className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/30 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-all">
                        <Building2 className="w-6 h-6" />
                      </div>
                      <a 
                        href="/halls-services-portal" 
                        className="text-slate-400 group-hover:text-amber-500 transition-colors"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </a>
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-amber-500 transition-colors">إدارة القاعات والخدمات</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      إضافة وتحديث قاعات الأفراح والمناسبات الخاصة بك، وتقديم العروض وباقات الخدمات المساندة المصاحبة.
                    </p>
                    <a 
                      href="/halls-services-portal" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 group-hover:underline"
                    >
                      <span>الانتقال للبوابة الآن</span>
                      <span>←</span>
                    </a>
                  </div>

                  {/* Portal 2: Bookings and Orders */}
                  <div className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-950/30 rounded-xl flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-all">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <a 
                        href="/logistics-portal" 
                        className="text-slate-400 group-hover:text-indigo-500 transition-colors"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </a>
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-indigo-500 transition-colors">إدارة الحجوزات والطلبات</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      متابعة عقود الحجوزات، والتحقق من التواريخ، وتنسيق العمليات اللوجستية وتلقي الدفعات المالية والعربين من عملائك.
                    </p>
                    <a 
                      href="/logistics-portal" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:underline"
                    >
                      <span>الانتقال للبوابة الآن</span>
                      <span>←</span>
                    </a>
                  </div>

                  {/* Portal 3: Messaging */}
                  <div className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-all">
                        <MessageCircle className="w-6 h-6" />
                      </div>
                      <a 
                        href="/provider-messages" 
                        className="text-slate-400 group-hover:text-emerald-500 transition-colors"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </a>
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-emerald-500 transition-colors">المحادثات والدردشة الفورية</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      التواصل الفوري والدردشة المباشرة مع عملائك للاستجابة السريعة لاستفساراتهم وتأكيد رغباتهم التشغيلية لضمان نجاح الحفل.
                    </p>
                    <a 
                      href="/provider-messages" 
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 group-hover:underline"
                    >
                      <span>الانتقال للبوابة الآن</span>
                      <span>←</span>
                    </a>
                  </div>

                  {/* Portal 4: Support */}
                  <div className="group relative bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl p-6 hover:shadow-xl transition-all duration-300">
                    <div className="flex justify-between items-start mb-4">
                      <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/30 rounded-xl flex items-center justify-center text-rose-500 group-hover:scale-110 transition-all">
                        <HelpCircle className="w-6 h-6" />
                      </div>
                      <button 
                        onClick={() => setActiveTab('support')}
                        className="text-slate-400 group-hover:text-rose-500 transition-colors cursor-pointer"
                      >
                        <ArrowUpRight className="w-5 h-5" />
                      </button>
                    </div>
                    <h3 className="text-base font-black text-slate-800 dark:text-slate-100 mb-1.5 group-hover:text-rose-500 transition-colors">الدعم والمساعدة الفنية</h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-4">
                      طلب المساعدة من إدارة المنصة ورفع تذاكر الدعم لحل أي مشاكل تقنية تواجهها في المنصة بكفاءة وسرعة عالية.
                    </p>
                    <button 
                      onClick={() => setActiveTab('support')}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 group-hover:underline text-right cursor-pointer"
                    >
                      <span>الانتقال للبوابة الآن</span>
                      <span>←</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Luxury BOS Pitch Card */}
              <div className="bg-gradient-to-br from-amber-500/10 via-amber-600/5 to-transparent border border-amber-500/20 rounded-3xl p-6 lg:p-8 space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
                    <Crown className="w-5 h-5 fill-amber-500" />
                  </div>
                  <div>
                    <h2 className="text-base font-black text-slate-800 dark:text-slate-100">باقي خطوة لامتلاك نظام تشغيل الأعمال الكامل (Provider BOS) 👑</h2>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">رؤية كاملة لأدق تفاصيل نشاطك الاستثماري ونموه.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50 flex items-start gap-3">
                    <span className="text-base">📊</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-0.5">مركز التحليلات والتوقعات الذكية</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">رسوم بيانية متكاملة للأرباح، معدل الإشغال، والنمو السنوي والموسمي ونسب الحجوزات الملغاة والمؤكدة.</p>
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50 flex items-start gap-3">
                    <span className="text-base">👥</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-0.5">إدارة الموظفين والمهام (Multi-Seat)</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">إضافة حسابات خاصة بموظفيك وإعطاؤهم صلاحيات تشغيلية مخصصة ومحدودة لمنع التداخل وتسريب البيانات.</p>
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50 flex items-start gap-3">
                    <span className="text-base">🏦</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-0.5">المركز المالي وإدارة السيولة والمستودعات</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">تتبع الإيرادات، المصروفات، الأرباح الصافية، والتحكم بمخازن الأثاث والتجهيزات وإدارة شؤون الموردين والمشتريات.</p>
                    </div>
                  </div>

                  <div className="bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100/50 dark:border-slate-800/50 flex items-start gap-3">
                    <span className="text-base">🏢</span>
                    <div>
                      <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 mb-0.5">إدارة الفروع والمقرات المتعددة</h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">أضف وتحكم في عدة قاعات أو فروع تابعة لنفس المؤسسة تحت مظلة إدارة مركزية موحدة فائقة السلاسة.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    onClick={() => setActiveTab('subscriptions')}
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-black text-xs rounded-xl shadow-md transition-all active:scale-95 cursor-pointer"
                  >
                    عرض خطط الاشتراك والترقية الآن
                  </button>
                </div>
              </div>
            </div>
          );
        }
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProviderDashboard {...anyState} activeSection={activeSection} setActiveSection={setActiveSection} />
          </Suspense>
        );

      case 'finance':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <FinanceDashboard 
              {...anyState} 
              userRole="provider" 
              currentProvider={currentProviderName} 
              currentProviderId={state.currentProviderId} 
            />
          </Suspense>
        );

      case 'bookings':
        return <BookingsSection {...anyState} />;

      case 'halls':
        return <HallsUnifiedSection {...anyState} />;

      case 'services':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ServicesManagement {...anyState} formatCurrency={formatCurrency} />
          </Suspense>
        );

      case 'inventory':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <InventoryDashboard {...anyState} />
          </Suspense>
        );

      case 'suppliers':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <SuppliersDashboard />
          </Suspense>
        );

      case 'subscriptions':
        return <ProviderSubscriptionTabbed {...anyState} />;

      case 'unified_invoice':
        return (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300 font-sans mt-12" dir="rtl">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <Lock className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">غير مصرح بالوصول</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                عذراً، هذا القسم مخصص لمدير المنصة فقط ولا يمكن لمزودي الخدمات الوصول إليه.
              </p>
            </div>
          </div>
        );

      case 'marketing':
        return (
          <div className="space-y-6">
            <ProviderMarketingWizard {...anyState} />
            <AdRequestProviderWizard {...anyState} />
          </div>
        );

      case 'provider_staff':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProviderStaffManagement {...anyState} formatCurrency={formatCurrency} />
          </Suspense>
        );

      case 'support':
        return <SupportSection {...anyState} />;

      case 'reviews':
        return <ReviewsSection {...anyState} />;

      case 'messages':
        return <MessagesSection {...anyState} />;

      case 'provider_profile':
        return <ProviderProfileComponent {...anyState} />;

      case 'activity_log':
        return <ProviderActivityLogSection {...anyState} />;

      case 'settings':
        return (
          <div className="bg-white dark:bg-slate-900 p-12 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300 font-sans mt-12" dir="rtl">
            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-950/30 rounded-full flex items-center justify-center mx-auto text-rose-500">
              <Lock className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">غير مصرح بالوصول</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
                عذراً، هذا القسم مخصص لمدير المنصة فقط ولا يمكن لمزودي الخدمات الوصول إليه.
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-950 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl max-w-lg mx-auto mt-12">
            <span className="text-4xl mb-4">🚧</span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">قسم قيد التطوير</h3>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">
              هذه الميزة غير مفعلة مؤقتاً للترقية أو يجري العمل على تطويرها.
            </p>
          </div>
        );
    }
  };

  const activeTabLabel = useMemo(() => {
    return TABS.find(t => t.id === activeTab)?.label || 'لوحة التحكم';
  }, [activeTab]);

  return (
    <AppProvider value={state}>
      <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden" dir="rtl">
        {/* Mobile menu backdrop */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-30 lg:hidden"
            />
          )}
        </AnimatePresence>

        {/* Sidebar Container */}
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-64 bg-slate-950 text-slate-100 border-l border-slate-800/60 flex flex-col transition-transform duration-300 transform lg:translate-x-0 lg:static lg:h-full ${
            isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Sidebar Brand Logo */}
          <div className="p-6 border-b border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center overflow-hidden ring-1 ring-slate-800 shadow-md">
                {state.platformData?.logoUrl ? (
                  <img src={state.platformData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-full h-full bg-amber-500 rounded-xl flex items-center justify-center font-black text-2xl text-blue-950">
                    ل
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black tracking-wide bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">منصة ليلة</span>
                <span className="text-[10px] text-slate-400">لوحة التحكم للمزودين</span>
              </div>
            </div>
            <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Profile Info Card */}
          <div ref={profileContainerRef} className="relative mx-4 my-3 z-50">
            <button
              onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
              className="w-full p-4 bg-slate-900/60 border border-slate-800/60 rounded-2xl flex items-center gap-3 hover:bg-slate-900/95 hover:border-amber-500/40 transition-all text-right cursor-pointer"
            >
              <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden ring-2 ring-amber-500/80 shrink-0">
                <User className="w-6 h-6 text-slate-400" />
              </div>
              <div className="flex flex-col min-w-0 flex-grow">
                <span className="text-xs font-black truncate text-slate-100 font-sans">
                  {state.currentProviderName || 'مزود الخدمة'}
                </span>
                <span className="text-[9px] font-medium text-amber-400 mt-1 uppercase tracking-wider">
                  مزود خدمة 💼
                </span>
              </div>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isProfileDropdownOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 left-0 mt-1.5 bg-slate-900 border border-slate-850 rounded-xl shadow-2xl z-50 overflow-hidden font-sans"
                >
                  <button
                    onClick={() => {
                      setIsProfileDropdownOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-black text-red-400 hover:bg-red-500/10 transition-all text-right cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>تسجيل الخروج</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sidebar Scrollable Links */}
          <nav className="flex-grow overflow-y-auto px-4 py-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-800">
            {visibleTabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-200 text-right ${
                    isActive
                      ? 'bg-gradient-to-l from-amber-500/20 to-orange-500/10 text-amber-400 border-r-4 border-amber-500 shadow-md'
                      : 'text-slate-300 hover:bg-slate-900/40 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                    <span className="truncate">{tab.label}</span>
                  </div>
                  {tab.id === 'messages' && unreadMessagesCount > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse shrink-0">
                      {unreadMessagesCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer Controls */}
          <div className="p-4 border-t border-slate-800/60 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={toggleTheme}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 text-[10px] font-bold transition-all"
              >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
                <span>المظهر</span>
              </button>
              <button
                onClick={toggleLanguage}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 text-[10px] font-bold transition-all"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>EN / ع</span>
              </button>
            </div>
            <button
              onClick={() => { navigate('/'); }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 rounded-xl text-red-400 text-xs font-black transition-all"
            >
              <LogOut className="w-4 h-4" />
              <span>العودة للرئيسية</span>
            </button>
          </div>
        </aside>

        {/* Main Workspace Frame */}
        <main className="flex-grow flex flex-col overflow-hidden h-full">
          {/* Top Header Bar */}
          <header className="h-[76px] bg-white dark:bg-slate-950 border-b border-slate-200/80 dark:border-slate-800/50 px-6 flex items-center justify-between shrink-0">
            {/* Right: Toggle Button & Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-900 lg:hidden transition-all flex items-center justify-center shrink-0"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 lg:hidden">
                <div className="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center overflow-hidden ring-1 ring-slate-800/80 shadow-sm shrink-0">
                  {state.platformData?.logoUrl ? (
                    <img src={state.platformData.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full bg-amber-500 rounded-lg flex items-center justify-center font-black text-sm text-blue-950">
                      ل
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col">
                <h2 className="text-base font-black text-slate-900 dark:text-slate-100 tracking-tight">{activeTabLabel}</h2>
                <div className="text-[10px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
                  <span>لوحة تحكم مزود الخدمة المستقلة</span>
                  <span>/</span>
                  <span className="text-amber-500 font-bold">{activeTabLabel}</span>
                </div>
              </div>
            </div>

             {/* Left: Quick Actions */}
            <div className="flex items-center gap-3 text-right">
              {/* Notification Bell with Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="relative p-2.5 rounded-full bg-slate-50 dark:bg-slate-900/60 border border-slate-200/50 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-all shadow-sm flex items-center justify-center cursor-pointer"
                  title="التنبيهات والرسائل"
                >
                  <Bell className="w-[18px] h-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-950 animate-pulse">
                      {unreadCount}
                    </span>
                  )}
                </button>

                <AnimatePresence>
                  {isNotificationsOpen && (
                    <>
                      {/* Invisible backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsNotificationsOpen(false)}
                      />
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute left-0 mt-3 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xl z-50 overflow-hidden text-right font-sans"
                        dir="rtl"
                      >
                        {/* Dropdown Header */}
                        <div className="p-4 bg-slate-50/80 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">التنبيهات والرسائل الواردة</h4>
                          </div>
                          {unreadCount > 0 && (
                            <button
                              onClick={handleMarkAllAsRead}
                              className="text-[10px] font-bold text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-all"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تحديد الكل كمقروء</span>
                            </button>
                          )}
                        </div>

                        {/* Dropdown Items List */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-[350px] overflow-y-auto">
                          {providerNotifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                              <Bell className="w-9 h-9 text-slate-200 dark:text-slate-800 mb-2" />
                              <p className="text-xs font-bold text-slate-700 dark:text-slate-300">صندوق التنبيهات فارغ</p>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">لا توجد لديك رسائل أو تنبيهات معلقة حالياً.</span>
                            </div>
                          ) : (
                            providerNotifications.map((notif: any) => (
                              <div
                                key={notif.id}
                                onClick={() => handleToggleRead(notif.id)}
                                className={`p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all cursor-pointer flex gap-3 ${!notif.isRead ? "bg-amber-500/[0.03] dark:bg-amber-500/[0.01]" : "opacity-75"}`}
                              >
                                <div className="mt-1.5 shrink-0">
                                  <span className={`w-2 h-2 rounded-full block ${!notif.isRead ? "bg-amber-500 animate-pulse" : "bg-slate-200 dark:bg-slate-700"}`} />
                                </div>
                                <div className="flex-grow space-y-1">
                                  <div className="flex justify-between items-baseline gap-2">
                                    <h5 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                                      {notif.type === 'message' && <MessageSquare className="w-3.5 h-3.5 text-amber-500" />}
                                      {notif.type === 'mail' && <Mail className="w-3.5 h-3.5 text-blue-500 dark:text-blue-400" />}
                                      {notif.title}
                                    </h5>
                                    <span className="text-[9px] text-slate-400 font-bold shrink-0">{notif.time || "الآن"}</span>
                                  </div>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{notif.body}</p>
                                  <div className="flex justify-end pt-1">
                                    <button
                                      onClick={(e) => handleDeleteNotification(notif.id, e)}
                                      className="p-1 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all"
                                      title="حذف التنبيه"
                                    >
                                      <Trash className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              <div className="hidden sm:flex items-center gap-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-250/60 dark:border-slate-800 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 shadow-sm select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>بوابة مزود الخدمة متصلة</span>
              </div>
            </div>
          </header>

          {/* Scrollable Work Panel */}
          <section className="flex-grow overflow-y-auto p-6 md:p-8 bg-slate-50 dark:bg-slate-900/40">
            <ErrorBoundary>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.2 }}
                  className="min-h-full"
                >
                  {renderContent()}
                </motion.div>
              </AnimatePresence>
            </ErrorBoundary>
          </section>
        </main>
      </div>

      {/* Global Application Modals - Spreading complete state securely */}
      <UnifiedAppModals
        {...state}
        formatCurrency={formatCurrency}
        handleDelete={handleDelete}
        handleMapConfirm={handleMapConfirm}
      />
      <BookingAndHallModals
        {...state}
        formatCurrency={formatCurrency}
        formatBookingId={formatBookingId}
      />
    </AppProvider>
  );
}
