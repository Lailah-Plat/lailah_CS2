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
  Briefcase,
  Activity,
  CheckSquare,
  Inbox,
  Boxes,
  Truck,
  Wallet,
  Award,
  Megaphone,
  Star,
  ShieldAlert,
  Users,
  FileSpreadsheet
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
import { ProviderGrowthCenter } from '../components/provider/ProviderGrowthCenter';

// Direct component imports for stability
import { ProviderDashboard } from '../components/provider/ProviderDashboard';
import { UnifiedPartnerCockpit } from '../components/provider/cockpit/UnifiedPartnerCockpit';
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
import { AppProvider } from '../context/AppContext';
import { getActiveProviderCapabilities } from '../utils/capabilityEngine';
import { EntitlementProvider, useEntitlements } from '../context/EntitlementContext';
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

export function ProviderDashboardContent() {
  const state = useAppState();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { canAccessTab, getModuleEntitlementStatus, capabilities } = useEntitlements();

  // Force role to provider inside this dedicated view
  const userRole = 'provider';
  const { toggleLanguage } = state;

  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'overview';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [activeSection, setActiveSection] = useState('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  useEffect(() => {
    const urlTab = searchParams.get('tab');
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab);
    }
  }, [searchParams]);

  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    setSearchParams({ tab: newTab });
  };

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

  // Categorized Sidebar Groups for Provider Dashboard
  const categorizedSidebarGroups = useMemo(() => {
    return [
      {
        title: '⚡ العمليات والقيادة',
        items: [
          { id: 'overview', label: 'مركز القيادة والعمليات الموحد', icon: Activity },
          { id: 'bookings', label: 'إدارة الحجوزات والطلبات', icon: CheckSquare },
        ]
      },
      {
        title: '🏢 إدارة المنشأة والخدمات',
        items: [
          { id: 'halls', label: 'إدارة القاعات والكتالوج', icon: Building2 },
          { id: 'services', label: 'الخدمات المساندة والمستقلة', icon: Inbox },
          { id: 'inventory', label: 'إدارة المخزون الميداني', icon: Boxes },
          { id: 'suppliers', label: 'إدارة الموردين والتوريد', icon: Truck },
        ]
      },
      {
        title: '💰 المركز المالي والأداء',
        items: [
          { id: 'finance', label: 'المركز المالي وحساب الضمان', icon: Wallet },
          { id: 'subscriptions', label: 'باقات الاشتراك والعمولة', icon: Award },
          { id: 'marketing', label: 'التقييمات والتسويق والنمو', icon: Megaphone },
          { id: 'reviews', label: 'تقييمات وآراء العملاء', icon: Star },
        ]
      },
      {
        title: '💬 التواصل والدعم',
        items: [
          { id: 'messages', label: 'الرسائل والدردشة المباشرة', icon: MessageSquare },
          { id: 'support', label: 'الدعم الفني وتذاكر المساعدة', icon: ShieldAlert },
          { id: 'provider_profile', label: 'بيانات المنشأة والهوية', icon: User },
          { id: 'provider_staff', label: 'إدارة الكوادر والموظفين', icon: Users },
          { id: 'activity_log', label: 'التقارير الشاملة وسجل النشاط', icon: FileSpreadsheet },
        ]
      }
    ];
  }, []);

  const formatCurrency = (amount: number) => {
    return typeof amount === 'number' ? `${amount.toLocaleString('ar-SA')} ر.س` : (amount || '');
  };

  const renderContent = () => {
    const anyState = state as any;

    // Entitlement check for modular tabs
    const isEntitled = canAccessTab(activeTab);
    if (!isEntitled) {
      const status = getModuleEntitlementStatus(activeTab);
      return (
        <div className="bg-white dark:bg-slate-900 p-10 md:p-14 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-xl max-w-xl mx-auto text-center space-y-6 animate-in zoom-in-95 duration-300 font-sans mt-8" dir="rtl">
          <div className="w-20 h-20 bg-amber-50 dark:bg-amber-950/30 rounded-3xl flex items-center justify-center mx-auto text-amber-500 shadow-inner">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-amber-500/10 text-amber-500 font-black text-xs rounded-full">
              وحدة نمطية متقدمة ✨
            </span>
            <h3 className="text-xl font-black text-slate-800 dark:text-slate-100">
              {(status as any).requiredFeature || 'قسم يتطلب ترقية الباقة'}
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              هذه الوحدة النمطية متوفرة في باقات الاشتراك المتقدمة أو عبر تفعيل الحزمة الإضافية. ترقية اشتراكك تمنحك الوصول الفوري واستغلال كافة الإمكانيات لتطوير أعمالك.
            </p>
          </div>
          <div className="pt-2">
            <button
              onClick={() => handleTabChange('subscriptions')}
              className="w-full py-4 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 text-sm flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <Crown className="w-5 h-5 text-slate-950" />
              <span>ترقية باقة الاشتراك وتفعيل الميزة</span>
            </button>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'overview':
      case 'cockpit':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <UnifiedPartnerCockpit
              currentProviderName={currentProviderName}
              currentUserName={state.currentUser?.name || 'مدير المنشأة'}
              myBookings={state.bookings || []}
              mySupportRequests={state.supportServiceRequests || []}
              halls={state.halls || []}
              showNotification={state.showNotification || (() => {})}
              onUpdateBookingStage={(id, stage) => {
                if (state.setBookings) {
                  state.setBookings((prev: any[]) => prev.map(b => b.id === id ? { ...b, stage } : b));
                }
              }}
              onOpenChat={() => {
                handleTabChange('messages');
              }}
            />
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
          <ProviderGrowthCenter
            currentProviderName={currentProviderName}
            campaigns={state.campaigns}
            setCampaigns={state.setCampaigns}
            adRequests={state.adRequests}
            setAdRequests={state.setAdRequests}
            promotions={state.promotions}
            setPromotions={state.setPromotions}
            halls={state.halls}
            services={state.services}
            showNotification={state.showNotification || ((t: string, m: string) => console.log(t, m))}
          />
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

          {/* Sidebar Scrollable Links Grouped */}
          <nav className="flex-grow overflow-y-auto px-3 py-2 space-y-5 scrollbar-thin scrollbar-thumb-slate-800">
            {categorizedSidebarGroups.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 pb-1 text-[11px] font-black text-amber-400/90 tracking-wide uppercase flex items-center justify-between border-b border-slate-800/60 mb-1.5">
                  <span>{group.title}</span>
                </div>
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id || (activeTab === 'cockpit' && item.id === 'overview');
                  const isEntitled = canAccessTab(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        handleTabChange(item.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between gap-3 px-3 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 text-right cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-l from-amber-500/25 via-amber-500/15 to-transparent text-amber-300 border-r-4 border-amber-500 shadow-lg font-black'
                          : 'text-slate-300 hover:bg-slate-900/60 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {!isEntitled && (
                          <span className="p-1 rounded-md bg-amber-500/10 text-amber-400/80 text-[10px]" title="ميزة متقدمة تتطلب ترقية الباقة">
                            <Lock className="w-3 h-3" />
                          </span>
                        )}
                        {item.id === 'messages' && unreadMessagesCount > 0 && (
                          <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                            {unreadMessagesCount}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ))}
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

export default function ProviderDashboardPage() {
  return (
    <EntitlementProvider>
      <ProviderDashboardContent />
    </EntitlementProvider>
  );
}
