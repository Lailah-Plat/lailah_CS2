import React, { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { useTheme } from './context/ThemeContext';
import { useTranslation, TRANSLATIONS } from './utils/translation';
import { motion, AnimatePresence } from 'motion/react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { RoleGuard } from './components/RoleGuard';
import { SecuritySecretTab } from './components/SecuritySecretTab';
import { BookingServicesSelector } from './components/BookingServicesSelector';
import { AgencyMarketingView, ProviderMarketingWizard, PromotionsManagement, AdRequestProviderWizard, AdRequestsTable } from './components/MarketingComponents';
import { InternalAdsManagement } from './components/InternalAdsManagement';
import { AdsManagement } from './components/AdsManagement';
import { SubscriptionFlow } from './pages/SubscriptionPage';
import { ProviderSubscriptionTabbed } from './components/ProviderSubscriptionTabbed';
import { DashboardActionPanel } from './components/DashboardActionPanel';
import { HallsServicesUnifiedPage } from './components/HallsServicesUnifiedPage';
import { CampaignModals } from './components/CampaignModals';
import { CustomerModals } from './components/CustomerModals';
import { ProviderModals } from './components/ProviderModals';
import { ClientHallsView } from './components/ClientHallsView';
import { CustomersManagement } from './components/CustomersManagement';
import { ProvidersManagement } from './components/ProvidersManagement';
import { PartnerRequestsManagement } from './components/admin/PartnerRequestsManagement';
import { AdminUsersManagement } from './components/AdminUsersManagement';
import { UsersManagementMain } from './components/UsersManagementMain';
import { MarketingManagement } from './components/MarketingManagement';
import { LPASManager } from './components/lpas/LPASManager';
import { LPASPageRenderer } from './components/lpas/LPASPageRenderer';
import { resolveLPASPage } from './services/LPASResolverService';
import { BookingsManagement } from './components/BookingsManagement';
import { ReviewsManagement } from './components/ReviewsManagement';
import { AdminHeaderNotificationBell } from './components/AdminHeaderNotificationBell';
import { Toaster } from 'react-hot-toast';
import { UnifiedPartnerCockpit } from './components/provider/cockpit/UnifiedPartnerCockpit';
import { PopupAdModal } from './components/PopupAdModal';

// Resilient dynamic code splitting helper with fallback retry
function safeLazy<T extends React.ComponentType<any>>(
  importFn: () => Promise<any>,
  exportName?: string
) {
  return lazy(async () => {
    try {
      const module = await importFn();
      if (exportName && module[exportName]) {
        return { default: module[exportName] };
      }
      if (module.default) {
        return { default: module.default };
      }
      return { default: module as unknown as T };
    } catch (err) {
      console.warn(`⚠️ Dynamic import retry for ${exportName || 'module'}:`, err);
      await new Promise((r) => setTimeout(r, 400));
      const module = await importFn();
      if (exportName && module[exportName]) {
        return { default: module[exportName] };
      }
      return { default: module.default || (module as unknown as T) };
    }
  });
}

// Direct component imports for stability
import FinanceDashboard from './components/FinanceDashboard';
import { InventoryDashboard } from './components/InventoryDashboard';
import { SuppliersDashboard } from './components/SuppliersDashboard';
import { AdminCalendar } from './components/AdminCalendar';
import { BookingCalendar } from './components/BookingCalendar';
import HallsManagement from './components/HallsManagement';
import { AdminDashboard } from './components/admin/AdminDashboard';
import ServicesManagement from './components/ServicesManagement';
import ProviderStaffManagement from './components/ProviderStaffManagement';
import { SupportManagement } from './components/SupportManagement';
import { SettingsManagement } from './components/SettingsManagement';
import { PhasesExecutionPortal } from './components/PhasesExecutionPortal';
import { SupportSection } from './components/admin/SupportSection';
import { ReviewsSection } from './components/admin/ReviewsSection';
import { MarketingSection } from './components/admin/MarketingSection';
import { HallsUnifiedSection } from './components/dashboard/HallsUnifiedSection';
import { CustomersSection } from './components/admin/CustomersSection';
import { BookingsSection } from './components/dashboard/BookingsSection';
import { FinanceSection } from './components/admin/FinanceSection';
import { FinancialSettingsSection } from './components/admin/FinancialSettingsSection';
import { ProvidersSection } from './components/admin/ProvidersSection';
import { SettingsSection } from './components/admin/SettingsSection';
import { UnifiedAppModals } from './components/modals/UnifiedAppModals';
import { BookingAndHallModals } from './components/modals/BookingAndHallModals';
import { SubscriptionModals } from './components/modals/SubscriptionModals';
import { DeleteConfirmationModal } from './components/modals/DeleteConfirmationModal';
import { PledgeDetailsModal } from './components/modals/PledgeDetailsModal';
import { ProviderProfileComponent } from './components/ProviderProfileComponent';
import { StaffProfilePage } from './components/StaffProfilePage';
import { SettingToggle, SettingInput, SettingInputState } from './components/dashboard/DashboardSettingsInputs';
import { MessagesSection } from './components/dashboard/MessagesSection';
import { SubscriptionsSection } from './components/dashboard/SubscriptionsSection';
import { useCalendar } from './context/CalendarContext';
import { AppProvider } from './context/AppContext';
import { apiService } from './services/apiService';
import { useAppInventorySync } from './hooks/useAppInventorySync';
import { useAppSubscriptions } from './hooks/useAppSubscriptions';
import { formatSmartDate, getFullDateInfo, formatDateWithHijri } from './utils/dateUtils';
import { convertDigits, getDigitStyle, setDigitStyle } from './utils/digitConverter';
import { formatBookingId, formatServiceRequestId, formatInvoiceId } from './utils/idUtils';
import { renderPriceWithTax, renderStars } from './utils/layoutUtils';
import { getSubscriptions, saveSubscriptions } from './utils/subscriptions';
import { getDiscounts, saveDiscounts, isDiscountApplicable, calculateDiscountAmount } from './utils/discounts';
import { loadDynamicRegions } from './utils/dataLoaders';
import { DiscountsManagement } from './components/admin/DiscountsManagement';
import { UrgentAlertsDashboard } from './components/UrgentAlertsDashboard';
import { FeatureAdoptionAnalytics } from './components/FeatureAdoptionAnalytics';
import { AffiliateReferralDashboard } from './components/AffiliateReferralDashboard';
import { SystemDiagnosticsHealth } from './components/SystemDiagnosticsHealth';
import { TechnicalDiagnosticsHub } from './components/TechnicalDiagnosticsHub';
import { getServices, saveServices, providers as mockProviders, getPartnerLevel as getLevelFromMock, getPartnerLevelThresholds, Hall, getStoredHalls, saveStoredHalls } from './data/mockData';
import BookingInvoice from './components/BookingInvoice';
import UnifiedInvoiceTab from './components/UnifiedInvoiceTab';
import Editor from 'react-simple-wysiwyg';
import PlatformInfoSettings from './components/admin/PlatformInfoSettings';
import DataStoreSettingsTab from './components/DataStoreSettingsTab';
import StaffCalendar from './components/admin/StaffCalendar';
import StaffManagement from './components/admin/StaffManagement';
import { PlatformUserModal } from './components/admin/PlatformUserModal';
import ErrorBoundary from './components/common/ErrorBoundary';
import { DiagnosticsDashboard } from './components/DiagnosticsDashboard';
import IbanInput from './components/common/IbanInput';
import GoogleMapsModal from './components/common/GoogleMapsModal';
import { NationalIdInput, CrNumberInput, TaxNumberInput, PhoneInput, PasswordValidationInputs } from './components/common/ValidationInputs';
import { sanitizeIban } from './utils/validations';
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
  Settings,
  Plus,
  Pencil,
  Edit,
  Trash2,
  Lock,
  Download,
  FileSpreadsheet,
  FileDown,
  X,
  PlusCircle,
  Sparkles,
  TrendingUp,
  Shield,
  Activity,
  Database,
  CheckCircle2,
  Info,
  Clock,
  FileText,
  AlertCircle,
  Menu,
  Check,
  Calendar,
  MapPin,
  UploadCloud,
  Eye,
  Settings2,
  Power,
  Search,
  Filter,
  Star,
  History,
  Save,
  Key,
  Timer,
  Server,
  Terminal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  ShieldAlert,
  CreditCard as CreditCardIcon,
  Users2,
  BadgePercent,
  ThumbsUp,
  Target,
  MessageSquare,
  User,
  UserCircle,
  Share2,
  Printer,
  ScrollText,
  Bell,
  Mail,
  Inbox,
  MessageCircle,
  MoreVertical,
  Paperclip,
  Send,
  Phone,
  ToggleRight,
  ToggleLeft,
  Upload,
  AlertTriangle,
  Ban,
  Headset,
  FilterX,
  RefreshCw,
  Crown,
  CheckSquare,
  ClipboardList,
  Layers,
  Coins,
  Landmark,
  ArrowRightLeft,
  CalendarCheck2,
  Box,
  PackageSearch,
  ExternalLink,
  Percent,
  LayoutGrid,
  List,
  Table,
  LogOut,
  PiggyBank,
  HeartHandshake,
  QrCode,
  Scan,
  Globe,
  Sun,
  Moon,
  Home,
  Columns,
  AlignCenter,
  Grid,
  Sliders
} from 'lucide-react';

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, LineChart, Line, PieChart, Pie, Cell, ComposedChart
} from 'recharts';

import { Promotion } from './types';
import {
  TABS,
  sectionTabsMap,
  initialHalls,
  initialBookings,
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
  mockMessages,
  initialSupportRequests,
  getDynamicInitialBookings,
  getDynamicInitialSupportRequests,
  TabId,
  TabList
} from './data/dashboardConstants';

// --- Layout & Styling Helpers (Moved to src/utils/layoutUtils.tsx) ---

import { ServiceModalForm } from './components/modals/ServiceModalForm';
import { ServiceViewModal } from './components/modals/ServiceViewModal';













import { useAppState } from './hooks/useAppState';

export default function App() {
  const state = useAppState();
  const {
    activeTab,
    setActiveTab,
    userRole,
    theme,
    toggleTheme,
    toggleLanguage
  } = state;

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');

  const [searchParams] = useSearchParams();

  const [publicLpasSlug, setPublicLpasSlug] = useState<string | null>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('lpas_page') || params.get('lpas_slug') || params.get('landing_page') || null;
  });

  useEffect(() => {
    const slug = searchParams.get('lpas_page') || searchParams.get('lpas_slug') || searchParams.get('landing_page') || null;
    if (slug !== publicLpasSlug) {
      setPublicLpasSlug(slug);
    }
  }, [searchParams]);

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

  // Custom luxury system alerts state (overrides standard block alerts)
  const [customAlert, setCustomAlert] = useState<{
    isOpen: boolean;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
  } | null>(null);

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      let type: 'success' | 'error' | 'warning' | 'info' = 'info';
      if (
        message.includes('بنجاح') ||
        message.includes('🟢') ||
        message.includes('🎉') ||
        message.includes('مقبول') ||
        message.includes('معتمد')
      ) {
        type = 'success';
      } else if (
        message.includes('فشل') ||
        message.includes('خطأ') ||
        message.includes('🔴') ||
        message.includes('⚠️') ||
        message.includes('تنبيه') ||
        message.includes('حظر')
      ) {
        type = 'error';
      } else if (
        message.includes('الرجاء') ||
        message.includes('يجب') ||
        message.includes('تأكد')
      ) {
        type = 'warning';
      }
      
      setCustomAlert({
        isOpen: true,
        message,
        type
      });
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const navigate = useNavigate();
  useEffect(() => {
    if (userRole === 'provider') {
      navigate('/provider-dashboard', { replace: true });
    }
  }, [userRole, navigate]);

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
      case 'provider':
      case 'providers':
        if (anyState.handleDeleteProvider) anyState.handleDeleteProvider(id);
        break;
      case 'platform_users':
        if (anyState.handleDeletePlatformUser) {
          anyState.handleDeletePlatformUser(id, (state.deleteData as any).isPending);
        }
        break;
      default:
        console.warn('Unknown delete type:', type);
    }
    state.setDeleteData(null);
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

  // Filter visible tabs based on user's active role
  const visibleTabs = useMemo(() => {
    if (userRole === 'admin') {
      return TABS.filter(tab => 
        ['overview', 'cockpit', 'urgent_alerts', 'bookings', 'halls', 'services', 'inventory', 'suppliers', 'subscriptions', 'finance', 'financial_settings', 'technical_diagnostics', 'marketing', 'feature_adoption', 'users', 'customers', 'providers', 'staff', 'support', 'reviews', 'messages', 'settings', 'staff_profile', 'roadmap_phases'].includes(tab.id)
      );
    }
    if (userRole === 'agency') {
      return TABS.filter(tab => 
        ['overview', 'marketing', 'messages'].includes(tab.id)
      );
    }
    return TABS.filter(tab => 
      ['overview', 'cockpit', 'bookings', 'halls', 'services', 'inventory', 'suppliers', 'subscriptions', 'finance', 'marketing', 'support', 'reviews', 'provider_profile', 'provider_staff'].includes(tab.id)
    );
  }, [userRole]);

  // Dynamic content renderer
  const renderContent = () => {
    const anyState = state as any;

    // Strict Access Control: Redirect non-admins trying to access forbidden admin tabs
    if (userRole !== 'admin' && (activeTab === 'financial_settings' || activeTab === 'unified_invoice' || activeTab === 'diagnostics' || activeTab === 'technical_diagnostics' || activeTab === 'system_health' || activeTab === 'settings' || activeTab === 'users' || activeTab === 'staff' || activeTab === 'roadmap_phases')) {
      setTimeout(() => {
        setActiveTab('overview');
      }, 0);
      return <LoadingSpinner />;
    }

    switch (activeTab) {
      case 'overview':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <AdminDashboard {...anyState} activeSection={activeSection} setActiveSection={setActiveSection} />
          </Suspense>
        );

      case 'cockpit':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <UnifiedPartnerCockpit
              currentProviderName={state.currentProviderName || state.currentUser?.name || 'شركة القاعات المتميزة'}
              currentUserName={state.currentUser?.name || 'مدير المنشأة'}
              myBookings={state.bookings || []}
              mySupportRequests={state.supportServiceRequests || []}
              halls={state.halls || []}
              providerSubscription={state.providerSubscription}
              showNotification={state.showNotification || (() => {})}
              onUpdateBookingStage={(id, stage) => {
                if (state.setBookings) {
                  state.setBookings((prev: any[]) => prev.map(b => b.id === id ? { ...b, stage } : b));
                }
              }}
            />
          </Suspense>
        );

      case 'urgent_alerts':
        return <UrgentAlertsDashboard showNotification={state.showNotification} setActiveTab={(tab: any) => setActiveTab(tab)} bookings={state.bookings} supportServiceRequests={state.supportServiceRequests} />;

      case 'feature_adoption':
        return <FeatureAdoptionAnalytics showNotification={state.showNotification} />;

      case 'affiliate_referrals':
        return (
          <MarketingManagement
            {...anyState}
            activeMarketingSubTab="affiliate_codes"
            setActiveMarketingSubTab={state.setActiveMarketingSubTab}
          />
        );

      case 'lpas_studio':
        return (
          <LPASManager
            onBackToDashboard={() => setActiveTab('overview')}
            onSelectPageToRegister={(context) => {
              setActiveTab('providers');
              if (state.showNotification) {
                state.showNotification('info', `تم توجيه التسجيل بسياق: ${context?.providerType || 'عام'}`);
              }
            }}
          />
        );

      case 'technical_diagnostics':
      case 'system_health':
      case 'diagnostics':
        return (
          <TechnicalDiagnosticsHub
            initialTab={activeTab === 'system_health' ? 'system_health' : 'self_diagnostics'}
            halls={state.halls}
            bookings={state.bookings}
            services={state.services}
            supportServiceRequests={state.supportServiceRequests}
            setBookings={state.setBookings}
            setSupportServiceRequests={state.setSupportServiceRequests}
            showNotification={state.showNotification}
          />
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
        return userRole === 'admin' ? (
          <SubscriptionsSection {...anyState} />
        ) : (
          <ProviderSubscriptionTabbed {...anyState} />
        );

      case 'finance':
        return <FinanceSection {...anyState} />;

      case 'financial_settings':
        return <FinancialSettingsSection {...anyState} />;

      case 'unified_invoice':
        return <FinancialSettingsSection {...anyState} initialSubTab="unified_invoice" />;

      case 'marketing':
        if (userRole === 'admin') {
          return <MarketingSection {...anyState} />;
        } else if (userRole === 'agency') {
          return (
            <div className="space-y-6">
              <AgencyMarketingView {...anyState} />
              <PromotionsManagement {...anyState} />
            </div>
          );
        } else {
          return (
            <div className="space-y-6">
              <PromotionsManagement {...anyState} />
              <ProviderMarketingWizard {...anyState} />
              <AdRequestProviderWizard {...anyState} />
            </div>
          );
        }

      case 'users':
        const renderSubSection = () => {
          switch (state.adminUsersSection) {
            case 'users':
              return <AdminUsersManagement {...anyState} />;
            case 'customers':
              return <CustomersSection {...anyState} mode="users_only" />;
            case 'providers':
              return <ProvidersManagement {...anyState} mode="management_only" />;
            case 'provider_staff':
              return (
                <Suspense fallback={<LoadingSpinner />}>
                  <ProviderStaffManagement {...anyState} formatCurrency={formatCurrency} />
                </Suspense>
              );
            default:
              return <AdminUsersManagement {...anyState} />;
          }
        };
        return (
          <UsersManagementMain {...anyState}>
            {renderSubSection()}
          </UsersManagementMain>
        );

      case 'customers':
        return <CustomersSection {...anyState} mode="loyalty_only" />;

      case 'providers':
        return <ProvidersManagement {...anyState} mode="requests_only" />;

      case 'staff':
        return <StaffManagement {...anyState} roles={roles} sectionTabsMap={sectionTabsMap} formatCurrency={formatCurrency} />;

      case 'provider_staff':
        return (
          <Suspense fallback={<LoadingSpinner />}>
            <ProviderStaffManagement {...anyState} formatCurrency={formatCurrency} />
          </Suspense>
        );

      case 'support':
        return userRole === 'admin' ? (
          <Suspense fallback={<LoadingSpinner />}>
            <SupportManagement {...anyState} />
          </Suspense>
        ) : (
          <SupportSection {...anyState} />
        );

      case 'reviews':
        return <ReviewsSection {...anyState} />;

      case 'messages':
        return <MessagesSection {...anyState} />;

      case 'settings':
        return <SettingsSection {...anyState} />;

      case 'roadmap_phases':
        return <PhasesExecutionPortal userRole={userRole} providerId={state.currentProviderId || 'PROV-1'} />;

      case 'provider_profile':
        return <ProviderProfileComponent {...anyState} />;

      case 'staff_profile':
        return (
          <StaffProfilePage
            currentUser={state.currentUser}
            setCurrentUser={state.setCurrentUser}
            staffList={state.staffList}
            setStaffList={state.setStaffList}
            showNotification={state.showNotification}
          />
        );

      default:
        return (
          <div className="text-center py-12">
            <p className="text-slate-500 font-bold">القسم المطلوب غير متوفر حالياً.</p>
          </div>
        );
    }
  };

  const activeTabLabel = useMemo(() => {
    if (activeTab === 'overview') {
      return userRole === 'admin' ? 'مركز القيادة والعمليات' : 'مركز الأعمال والإجراءات';
    }
    if (activeTab === 'cockpit') {
      return userRole === 'admin' ? 'مركز القيادة والعمليات الموحد' : 'مركز الأعمال والإجراءات الموحد';
    }
    return TABS.find(t => t.id === activeTab)?.label || 'لوحة التحكم';
  }, [activeTab, userRole]);

  if (publicLpasSlug) {
    const lpasPage = resolveLPASPage(publicLpasSlug);
    return (
      <AppProvider value={state}>
        <LPASPageRenderer
          page={lpasPage}
          onNavigateToRegistration={(context) => {
            setPublicLpasSlug(null);
            setActiveTab('providers');
            if (state.showNotification) {
              state.showNotification('info', `تم توجيه التسجيل بسياق: ${context?.providerType || 'عام'}`);
            }
          }}
          onViewOtherPages={() => {
            setPublicLpasSlug(null);
            setActiveTab('lpas_studio');
          }}
        />
      </AppProvider>
    );
  }

  return (
    <AppProvider value={state}>
      <div className={`flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden ${userRole === 'admin' ? 'admin-workspace' : ''}`} dir="rtl">
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
                <span className="text-[10px] text-slate-400">لوحة الإدارة التشغيلية</span>
              </div>
            </div>
            <button lg-hidden="true" onClick={() => setIsMobileMenuOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 lg:hidden">
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
                  {state.currentUser?.name || "مستخدم النظام"}
                </span>
                <span className="text-[9px] font-medium text-amber-400 mt-1 uppercase tracking-wider">
                  {userRole === 'admin' ? 'مدير النظام 🛡️' : userRole === 'provider' ? 'مزود خدمة 💼' : 'شريك المنصة ✨'}
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
          <nav className="flex-grow overflow-y-auto px-4 py-2 space-y-4 scrollbar-thin scrollbar-thumb-slate-800">
            {userRole === 'admin' ? (
              [
                {
                  title: 'مركز التشغيل والعمليات',
                  tabs: ['overview', 'urgent_alerts', 'bookings', 'support', 'messages']
                },
                {
                  title: 'السوق والخدمات',
                  tabs: ['halls', 'services', 'inventory', 'suppliers', 'providers']
                },
                {
                  title: 'المركز المالي والرقابة',
                  tabs: ['finance', 'financial_settings', 'subscriptions']
                },
                {
                  title: 'العملاء والتسويق',
                  tabs: ['customers', 'marketing', 'feature_adoption', 'reviews']
                },
                {
                  title: 'إدارة النظام والتقنية',
                  tabs: ['users', 'staff', 'settings', 'technical_diagnostics', 'roadmap_phases']
                },
                {
                  title: 'إدارة بياناتي',
                  tabs: ['staff_profile']
                }
              ].map((domain, dIdx) => {
                const domainTabs = visibleTabs.filter(t => domain.tabs.includes(t.id));
                if (domainTabs.length === 0) return null;
                return (
                  <div key={dIdx} className="space-y-1">
                    <div className="px-4 py-1.5 text-[10px] font-black text-amber-500 bg-slate-900/60 rounded-lg mx-2 tracking-wider">
                      {domain.title}
                    </div>
                    {domainTabs.map(tab => {
                      const Icon = tab.icon;
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsMobileMenuOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-4 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 text-right ${
                            isActive
                              ? 'bg-gradient-to-l from-amber-500/20 to-orange-500/10 text-amber-400 border-r-4 border-amber-500 shadow-md font-black'
                              : 'text-slate-300 hover:bg-slate-900/40 hover:text-white'
                          }`}
                        >
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                          <span className="truncate">{tab.label}</span>
                        </button>
                      );
                    })}
                  </div>
                );
              })
            ) : (
              <div className="space-y-1">
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
                      className={`w-full flex items-center gap-3 px-4 py-3 text-xs font-bold rounded-xl transition-all duration-200 text-right ${
                        isActive
                          ? 'bg-gradient-to-l from-amber-500/20 to-orange-500/10 text-amber-400 border-r-4 border-amber-500 shadow-md'
                          : 'text-slate-300 hover:bg-slate-900/40 hover:text-white'
                      }`}
                    >
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
                      <span className="truncate">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
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
              onClick={() => { window.location.href = '/'; }}
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
                  <span>لوحة تحكم النظام</span>
                  <span>/</span>
                  <span className="text-amber-500 font-bold">{activeTabLabel}</span>
                </div>
              </div>
            </div>

            {/* Left: Quick Actions & Operational Bell Notification Bar */}
            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex items-center gap-1 bg-slate-50 dark:bg-slate-900/60 border border-slate-250/60 dark:border-slate-800 px-3 py-1.5 rounded-full text-[10px] font-black text-slate-500 dark:text-slate-400 shadow-sm select-none">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>النظام متصل وبكامل كفاءته</span>
              </div>

              {/* Top Navigation Button for Urgent Operational & Financial Alerts */}
              {userRole === 'admin' && (
                <button
                  onClick={() => setActiveTab('urgent_alerts')}
                  className={`px-3 py-1.5 rounded-2xl transition-all duration-200 text-right flex items-center gap-2 border cursor-pointer ${
                    activeTab === 'urgent_alerts'
                      ? 'bg-red-950/90 text-red-100 border-red-500 shadow-lg ring-2 ring-red-500/50 font-black'
                      : 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-900/60 hover:from-red-900 text-red-200 border-red-800/80 hover:border-red-500'
                  }`}
                  title="الإنذارات التشغيلية والمالية العاجلة"
                >
                  <span className="p-1 bg-red-500/20 text-red-400 rounded-xl animate-pulse text-sm leading-none">
                    🚨
                  </span>
                  <div className="flex flex-col text-right">
                    <div className="text-xs font-black text-red-200 flex items-center gap-1.5">
                      الإنذارات العاجلة
                      <span className="px-1.5 py-0.2 bg-red-600 text-white text-[9px] rounded-full font-black animate-bounce">3</span>
                    </div>
                    <div className="text-[9px] text-red-300/80 font-medium hidden md:block">المركزي للإنذارات والنزاعات</div>
                  </div>
                </button>
              )}

              {/* Top Navigation Bell Bar for Operational Alerts */}
              <AdminHeaderNotificationBell
                userRole={userRole}
                setActiveTab={setActiveTab}
                theme={theme}
                toggleTheme={toggleTheme}
              />
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

      {/* 1. Global Toaster for react-hot-toast */}
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          className: 'font-sans font-semibold text-xs text-slate-100',
          style: {
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(8px)',
            color: '#f8fafc',
            border: '1px solid rgba(245, 158, 11, 0.25)',
            borderRadius: '16px',
            padding: '14px 20px',
            fontSize: '13px',
            fontWeight: '600',
            boxShadow: '0 10px 40px -10px rgba(0, 0, 0, 0.5), 0 0 15px rgba(245, 158, 11, 0.08)',
            direction: 'rtl',
            maxWidth: '450px',
            width: '100%',
          },
          success: {
            iconTheme: {
              primary: '#f59e0b', // Luxury amber/gold
              secondary: '#0f172a',
            },
          },
          error: {
            iconTheme: {
              primary: '#ef4444',
              secondary: '#0f172a',
            },
          },
        }}
      />

      {/* Global Client Popup Ad Modal */}
      <PopupAdModal />

      {/* 2. Custom floating state.notification for App state triggers */}
      <AnimatePresence>
        {state.notification && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', damping: 20, stiffness: 320 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-[99999] max-w-md w-full px-4"
          >
            <div className="bg-[#0B1220]/95 backdrop-blur-md border border-amber-500/25 rounded-2xl p-4 shadow-[0_12px_45px_rgba(0,0,0,0.6),0_0_25px_rgba(245,158,11,0.12)] flex items-start gap-4 relative overflow-hidden text-right" dir="rtl">
              {/* Top ambient gold bar */}
              <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />
              
              {/* Dynamic Icon Section */}
              <div className="shrink-0 mt-0.5">
                {state.notification.type === 'success' ? (
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-emerald-500 shadow-inner">
                    <CheckCircle2 className="w-5.5 h-5.5 animate-pulse" />
                  </div>
                ) : state.notification.type === 'error' ? (
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-500 shadow-inner">
                    <AlertCircle className="w-5.5 h-5.5 animate-bounce" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-amber-500 shadow-inner">
                    <Info className="w-5.5 h-5.5" />
                  </div>
                )}
              </div>

              {/* Text Description */}
              <div className="flex-grow pt-0.5">
                <div className="text-[9px] uppercase tracking-widest font-black text-amber-500 mb-0.5">
                  {state.notification.type === 'success' ? 'إنجاز العملية بنجاح' : state.notification.type === 'error' ? 'تنبيه إداري' : 'إشعار المنصة'}
                </div>
                <p className="text-slate-100 text-[13px] leading-relaxed font-bold font-sans">
                  {state.notification.message}
                </p>
              </div>

              {/* Small close button */}
              <button 
                onClick={() => { /* Auto-dismissed */ }} 
                className="text-slate-500 hover:text-slate-300 p-0.5 transition-colors shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>

              {/* Shrinking bottom gold bar */}
              <div className="absolute bottom-0 right-0 h-[3px] bg-gradient-to-l from-amber-500 to-amber-300 animate-toast-progress" style={{ width: '100%', transformOrigin: 'right' }} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 3. Luxury Window Alert Overrider Modal (Intercepts all traditional alert() calls) */}
      <AnimatePresence>
        {customAlert && customAlert.isOpen && (
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            {/* Backdrop Blur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setCustomAlert(null)}
              className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md overflow-hidden bg-gradient-to-b from-[#0D1527] to-[#070B14] border border-amber-500/25 rounded-3xl p-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(245,158,11,0.15)] z-10"
              dir="rtl"
            >
              {/* Luxury gold grid backdrop lines overlay */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:14px_24px]" />
              
              {/* Ambient Glow */}
              <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-24 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

              {/* Status Icon & Ring */}
              <div className="relative mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-5">
                {customAlert.type === 'success' ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-emerald-500/15 border border-emerald-500/30 animate-ping opacity-75" />
                    <div className="relative w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-500">
                      <Check className="w-7 h-7" />
                    </div>
                  </>
                ) : customAlert.type === 'error' ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-red-500/15 border border-red-500/30 animate-pulse" />
                    <div className="relative w-14 h-14 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500">
                      <AlertTriangle className="w-7 h-7 animate-bounce" />
                    </div>
                  </>
                ) : customAlert.type === 'warning' ? (
                  <>
                    <span className="absolute inset-0 rounded-full bg-amber-500/15 border border-amber-500/30 animate-pulse" />
                    <div className="relative w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                      <AlertCircle className="w-7 h-7" />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="relative w-14 h-14 rounded-full bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                      <Info className="w-7 h-7" />
                    </div>
                  </>
                )}
              </div>

              {/* Header Title */}
              <h3 className="text-lg font-black bg-gradient-to-r from-amber-400 via-amber-200 to-amber-300 bg-clip-text text-transparent mb-3 tracking-wide">
                {customAlert.type === 'success' ? 'تأكيد واعتماد الإجراء' :
                 customAlert.type === 'error' ? 'تنبيه من النظام' :
                 customAlert.type === 'warning' ? 'مراجعة مطلوبة' : 'إشعار تشغيلي'}
              </h3>

              {/* Message text */}
              <div className="text-slate-300 text-sm leading-relaxed px-2 mb-6 font-medium font-sans select-text">
                {customAlert.message}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 relative z-10">
                <button
                  onClick={() => setCustomAlert(null)}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm tracking-wide shadow-[0_4px_20px_rgba(245,158,11,0.25)] hover:shadow-[0_4px_25px_rgba(245,158,11,0.35)] transition-all transform active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4 text-slate-950 stroke-[3]" />
                  <span>موافق، استمرار</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes toastProgress {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        .animate-toast-progress {
          animation: toastProgress 5000ms linear forwards;
        }
      `}</style>
    </AppProvider>
  );
}

const LoadingSpinner = () => (
  <div className="flex flex-col items-center justify-center p-12 space-y-4">
    <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
    <span className="text-sm font-medium text-slate-500">جاري تحميل البيانات...</span>
  </div>
);
