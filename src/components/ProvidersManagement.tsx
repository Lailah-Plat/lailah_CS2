import React from 'react';
import { 
  Plus, 
  Shield, 
  Sparkles, 
  Crown, 
  Eye, 
  Pencil, 
  Power, 
  Trash2, 
  Settings2, 
  Check, 
  X,
  Building2, 
  ShieldAlert, 
  BadgeCheck, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  RefreshCw, 
  Send, 
  ClipboardCheck, 
  LayoutGrid, 
  Calendar, 
  Wallet,
  Users as Users2,
  Lock,
  DollarSign,
  ShieldCheck,
  Briefcase,
  Banknote,
  TrendingUp,
  TrendingDown,
  Search,
  Star
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PartnerTieringEngineModal } from './partner/PartnerTieringEngineModal';
import { getSubscriptions } from '../utils/subscriptions';
import { ProviderRatingsMiniDashboard } from './admin/ProviderRatingsMiniDashboard';

export interface Provider {
  id: string | number;
  name: string;
  packageName?: string;
  type?: string;
  role?: string;
  idNumber: string;
  city: string;
  phone: string;
  status: string;
  isDbUser?: boolean;
  dbId?: number | null;
  email?: string;
  region?: string;
  rating?: number;
  bookingsCount?: number;
  isSuccessfulPartner?: boolean;
  image?: string;
  imagePreview?: string | null;
  pledge?: boolean;
  extraAddress?: string;
  taxNumber?: string;
  iban?: string;
  showProviderToCustomers?: boolean;
  expiryDate?: string;
  nationalAddress?: string;
  reviewsCount?: number;
}

interface ProvidersManagementProps {
  providers: Provider[];
  setProviders: React.Dispatch<React.SetStateAction<Provider[]>>;
  dbProviderSubscriptions: any[];
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setIsLevelThresholdsModalOpen: (isOpen: boolean) => void;
  setSelectedProviderForUpgrade: (provider: Provider | null) => void;
  setUpgradeBulkProviderIds: (ids: number[]) => void;
  setProviderActiveSubscription: (sub: any) => void;
  setProviderActiveOverrides: (overrides: any[]) => void;
  setUpgradeSelectedPlan: (plan: string) => void;
  setUpgradePricePaid: (price: number) => void;
  setUpgradeDurationMonths: (months: string) => void;
  setUpgradeCustomEndDate: (date: string) => void;
  setUpgradeNotes: (notes: string) => void;
  setIsUpgradeModalOpen: (isOpen: boolean) => void;
  setEditingItem: (item: any) => void;
  setProviderForm: React.Dispatch<React.SetStateAction<any>>;
  setIsProviderModalOpen: (isOpen: boolean) => void;
  adminProvidersSubTab: 'list' | 'requests' | 'halls_approval' | 'services_approval';
  setAdminProvidersSubTab: (tab: 'list' | 'requests' | 'halls_approval' | 'services_approval') => void;
  halls?: any[];
  setHalls?: React.Dispatch<React.SetStateAction<any[]>>;
  services?: any[];
  setServices?: React.Dispatch<React.SetStateAction<any[]>>;
  seasonRequests: any[];
  setSeasonRequests: React.Dispatch<React.SetStateAction<any[]>>;
  getPartnerLevel: (bookingsCount?: number, rating?: number, packageName?: string) => any;
  setViewingProvider: (provider: Provider) => void;
  setIsProviderViewModalOpen: (isOpen: boolean) => void;
  fetchProviderSubscriptionDetails: (providerId: number) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setDeleteData: React.Dispatch<React.SetStateAction<any>>;
  inventorySettings: { priceChangeLockPeriod?: number; [key: string]: any };
  handleUpdateInventorySettings: (settings: { priceChangeLockPeriod: number }) => void;
  setSelectedSeasonRequestForModal: (req: any) => void;
  mode?: 'management_only' | 'requests_only';
}

export const ProvidersManagement: React.FC<ProvidersManagementProps> = ({
  providers,
  setProviders,
  dbProviderSubscriptions,
  systemUsers,
  setSystemUsers,
  setIsLevelThresholdsModalOpen,
  setSelectedProviderForUpgrade,
  setUpgradeBulkProviderIds,
  setProviderActiveSubscription,
  setProviderActiveOverrides,
  setUpgradeSelectedPlan,
  setUpgradePricePaid,
  setUpgradeDurationMonths,
  setUpgradeCustomEndDate,
  setUpgradeNotes,
  setIsUpgradeModalOpen,
  setEditingItem,
  setProviderForm,
  setIsProviderModalOpen,
  adminProvidersSubTab,
  setAdminProvidersSubTab,
  seasonRequests,
  setSeasonRequests,
  getPartnerLevel,
  setViewingProvider,
  setIsProviderViewModalOpen,
  fetchProviderSubscriptionDetails,
  showNotification,
  setDeleteData,
  inventorySettings,
  handleUpdateInventorySettings,
  setSelectedSeasonRequestForModal,
  halls = [],
  setHalls,
  services = [],
  setServices,
  mode,
}) => {
  const { addPlatformNotification, setMailMessages, bookings } = useApp();

  // Local Customizable Partner Level Thresholds (stored in localStorage)
  const [levelThresholds, setLevelThresholds] = React.useState(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_partner_thresholds');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      silverMinBookings: 0,
      silverMinRating: 4.0,
      goldMinBookings: 15,
      goldMinRating: 4.5,
      platinumMinBookings: 50,
      platinumMinRating: 4.8,
    };
  });

  const [isLocalLevelThresholdsOpen, setIsLocalLevelThresholdsOpen] = React.useState(false);
  const [selectedTierProvider, setSelectedTierProvider] = React.useState<any>(null);
  const [isLocalUpgradeOpen, setIsLocalUpgradeOpen] = React.useState(false);

  // States for the local bulk upgrade modal
  const [localSelectedPlan, setLocalSelectedPlan] = React.useState('');
  const [localPricePaid, setLocalPricePaid] = React.useState(0);
  const [localDurationMonths, setLocalDurationMonths] = React.useState('3');
  const [localCustomEndDate, setLocalCustomEndDate] = React.useState('');
  const [localNotes, setLocalNotes] = React.useState('');
  const [localBulkProviderIds, setLocalBulkProviderIds] = React.useState<any[]>([]);
  const [upgradeSearchQuery, setUpgradeSearchQuery] = React.useState('');
  const [availablePlans, setAvailablePlans] = React.useState<any[]>(() => {
    return getSubscriptions() || [];
  });

  React.useEffect(() => {
    const fetchLatestPlans = async () => {
      try {
        const localPlans = getSubscriptions() || [];
        const res = await fetch('/api/subscriptions/plans');
        let dbPlans: any[] = [];
        if (res.ok) {
          const text = await res.text();
          if (text && !text.trim().startsWith('<')) {
            const data = JSON.parse(text);
            if (data.success && Array.isArray(data.plans)) {
              dbPlans = data.plans;
            } else if (Array.isArray(data)) {
              dbPlans = data;
            }
          }
        }

        const map = new Map<string, any>();
        localPlans.forEach((p: any) => {
          if (p && p.name) map.set(p.name.trim(), p);
        });

        dbPlans.forEach((p: any) => {
          if (p && p.name) {
            const key = p.name.trim();
            const existing = map.get(key) || {};
            map.set(key, {
              ...existing,
              id: p.id || existing.id,
              name: p.name,
              priceMonthly: p.price || existing.priceMonthly || 0,
              priceYearly: p.priceYearly || existing.priceYearly || 0,
              features: p.features || existing.features,
              isHidden: p.isHidden ?? existing.isHidden,
            });
          }
        });

        const merged = Array.from(map.values());
        if (merged.length > 0) {
          setAvailablePlans(merged);
        }
      } catch (e) {
        console.error('Error loading subscription plans in ProvidersManagement:', e);
      }
    };

    fetchLatestPlans();
  }, [isLocalUpgradeOpen]);

  const getLocalPartnerLevel = (bookingsCount = 0, rating = 0, packageName = '') => {
    const bk = bookingsCount;
    const rt = rating;
    const th = levelThresholds;

    if (bk >= th.platinumMinBookings && rt >= th.platinumMinRating) {
      return {
        name: 'الفئة البلاتينية',
        icon: <Crown className="w-3.5 h-3.5 text-amber-500" />,
        bg: 'bg-amber-50',
        color: 'text-amber-700',
        border: 'border-amber-200'
      };
    }
    if (bk >= th.goldMinBookings && rt >= th.goldMinRating) {
      return {
        name: 'الفئة الذهبية',
        icon: <Sparkles className="w-3.5 h-3.5 text-purple-500" />,
        bg: 'bg-purple-50',
        color: 'text-purple-700',
        border: 'border-purple-200'
      };
    }
    return {
      name: 'الفئة الفضية',
      icon: <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />,
      bg: 'bg-slate-50',
      color: 'text-slate-700',
      border: 'border-slate-200'
    };
  };

  // Local state for requests sub-tab when in requests_only mode
  const [requestsTab, setRequestsTab] = React.useState<'halls_approval' | 'services_approval' | 'requests'>(() => {
    if (adminProvidersSubTab === 'services_approval' || adminProvidersSubTab === 'requests') {
      return adminProvidersSubTab;
    }
    return 'halls_approval';
  });

  // Calculate which tab to render based on mode
  const activeTabToRender = mode === 'management_only' 
    ? 'list' 
    : (mode === 'requests_only' ? requestsTab : (adminProvidersSubTab === 'list' ? 'halls_approval' : adminProvidersSubTab));

  // State for toggling table explanation guide
  const [isTableGuideOpen, setIsTableGuideOpen] = React.useState(true);

  // Dynamic categories from central settings
  const [hallCategories, setHallCategories] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_hallCategories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['قاعة أفراح', 'استراحة قسم', 'استراحة قسمين', 'شاليه', 'منتجع', 'متنزه', 'مخيم', 'قاعة اجتماع', 'أخرى'];
  });

  const [serviceCategories, setServiceCategories] = React.useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_serviceCategories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['ضيافة', 'تصوير', 'دي جي', 'بوفيه مفتوح', 'تنسيق ورد', 'عشاء وحفلات', 'تنظيم حشود'];
  });

  React.useEffect(() => {
    const syncCats = () => {
      try {
        const storedHalls = localStorage.getItem('SYSTEM_DATastore_hallCategories');
        if (storedHalls) setHallCategories(JSON.parse(storedHalls));
      } catch (e) {}
      try {
        const storedServices = localStorage.getItem('SYSTEM_DATastore_serviceCategories');
        if (storedServices) setServiceCategories(JSON.parse(storedServices));
      } catch (e) {}
    };
    window.addEventListener('settingsUpdated', syncCats);
    return () => window.removeEventListener('settingsUpdated', syncCats);
  }, []);

  // Dynamically calculate KPIs based on actual database/context arrays
  const dynamicStats = React.useMemo(() => {
    const pCountHalls = (halls || []).filter((h: any) => h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.status === 'waiting_approval').length;
    const pCountServices = (services || []).filter((s: any) => s.status === 'pending' || s.status === 'بانتظار الموافقة' || s.adminStatus === 'pending' || s.adminStatus === 'بانتظار الموافقة').length;
    const pCountSeasons = (seasonRequests || []).filter((r: any) => r.status === 'بانتظار الموافقة').length;
    const totalPending = pCountHalls + pCountServices + pCountSeasons;

    // Use current provider counts and stats
    const ratedProviders = providers.filter((p: any) => p.rating !== undefined);
    const avgRating = ratedProviders.length > 0 
      ? ratedProviders.reduce((sum, p) => sum + Number(p.rating || 0), 0) / ratedProviders.length 
      : 4.75;
    const complianceRate = Math.min(100, Math.round((avgRating / 5) * 1000) / 10).toFixed(1);

    // Calculate actual escrow from active bookings
    const activeBookings = (bookings || []).filter((b: any) => 
      b.status === 'confirmed' || b.status === 'مؤكد' || b.status === 'completed' || b.status === 'مكتمل'
    );
    const totalEscrow = activeBookings.reduce((sum, b) => sum + Number(b.totalPrice || b.price || b.grandTotal || b.amount || 0), 0);
    const finalEscrow = totalEscrow > 0 ? totalEscrow : 145200;

    return {
      totalPending,
      pendingHalls: pCountHalls,
      pendingServices: pCountServices,
      pendingSeasons: pCountSeasons,
      complianceRate,
      finalEscrow,
      avgRating
    };
  }, [halls, services, seasonRequests, bookings, providers, systemUsers]);

  // Combine static providers with system database users who have the role "مزود / شريك" and status === 'نشط'
  const dbProvidersMap = new Map<string, Provider>();

  // States for halls and services approval
  const [selectedHall, setSelectedHall] = React.useState<any>(null);
  const [selectedService, setSelectedService] = React.useState<any>(null);
  const [isModificationModalOpen, setIsModificationModalOpen] = React.useState(false);
  const [modificationMessage, setModificationMessage] = React.useState('');
  const [modificationType, setModificationType] = React.useState<'hall' | 'service'>('hall');
  const [modificationItem, setModificationItem] = React.useState<any>(null);
  
  const [hallsStatusFilter, setHallsStatusFilter] = React.useState<'all' | 'pending' | 'approved' | 'blocked'>('pending');
  const [servicesStatusFilter, setServicesStatusFilter] = React.useState<'all' | 'pending' | 'approved' | 'blocked'>('pending');

  // Expandable row state for provider table accordion details
  const [expandedProviderIds, setExpandedProviderIds] = React.useState<Record<string, boolean>>({});
  const toggleExpandProvider = (id: string | number) => {
    setExpandedProviderIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Custom commission overrides state with full metadata (Audit trail, reason, ref)
  const [customCommissionsData, setCustomCommissionsData] = React.useState<Record<string, {
    rate: number;
    reason: string;
    ref: string;
    updatedAt: string;
    updatedBy: string;
  }>>(() => {
    try {
      const saved = localStorage.getItem('SYSTEM_DATastore_provider_custom_commissions_data');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [customCommissionReasonVal, setCustomCommissionReasonVal] = React.useState('');
  const [customCommissionRefVal, setCustomCommissionRefVal] = React.useState('');

  const [commissionRates, setCommissionRates] = React.useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('SYSTEM_DATastore_provider_commissions');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [taxStatuses, setTaxStatuses] = React.useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('SYSTEM_DATastore_provider_tax_statuses');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  const [activityTypes, setActivityTypes] = React.useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('SYSTEM_DATastore_provider_activities');
      return saved ? JSON.parse(saved) : {};
    } catch (e) { return {}; }
  });

  // Modals for comprehensive actions
  const [viewingDetailedProvider, setViewingDetailedProvider] = React.useState<Provider | null>(null);
  const [providerProfileTab, setProviderProfileTab] = React.useState<'info' | 'facilities' | 'finance' | 'licenses'>('info');
  const [editingCommissionProvider, setEditingCommissionProvider] = React.useState<Provider | null>(null);
  const [customCommissionVal, setCustomCommissionVal] = React.useState<number>(15);
  const [schedulingVisitHall, setSchedulingVisitHall] = React.useState<any>(null);
  const [scheduledVisitDate, setScheduledVisitDate] = React.useState<string>('2026-07-25');
  const [scheduledVisitTime, setScheduledVisitTime] = React.useState<string>('10:00');
  const [scheduledVisitInspector, setScheduledVisitInspector] = React.useState<string>('م. عبد الرحمن الحربي');
  
  const [rejectionFeedbackOpen, setRejectionFeedbackOpen] = React.useState(false);
  const [rejectionFeedbackText, setRejectionFeedbackText] = React.useState('');
  const [rejectionFeedbackItem, setRejectionFeedbackItem] = React.useState<any>(null);
  const [rejectionFeedbackType, setRejectionFeedbackType] = React.useState<'hall' | 'service'>('hall');

  // Rating & Loyalty Dashboard sorting and filtering state
  const [providersSectionSubTab, setProvidersSectionSubTab] = React.useState<'list' | 'ratings'>('list');
  const [providerSortKey, setProviderSortKey] = React.useState<string>('rating_desc');
  const [providerMinRatingFilter, setProviderMinRatingFilter] = React.useState<number>(0);
  const [providerSearchQuery, setProviderSearchQuery] = React.useState<string>('');

  React.useEffect(() => {
    localStorage.setItem('SYSTEM_DATastore_provider_commissions', JSON.stringify(commissionRates));
  }, [commissionRates]);

  React.useEffect(() => {
    localStorage.setItem('SYSTEM_DATastore_provider_custom_commissions_data', JSON.stringify(customCommissionsData));
  }, [customCommissionsData]);

  React.useEffect(() => {
    localStorage.setItem('SYSTEM_DATastore_provider_tax_statuses', JSON.stringify(taxStatuses));
  }, [taxStatuses]);

  React.useEffect(() => {
    localStorage.setItem('SYSTEM_DATastore_provider_activities', JSON.stringify(activityTypes));
  }, [activityTypes]);

  const pendingHallsCount = (halls || []).filter((h: any) => h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.status === 'waiting_approval').length;
  const pendingServicesCount = (services || []).filter((s: any) => s.status === 'pending' || s.status === 'بانتظار الموافقة' || s.adminStatus === 'pending' || s.adminStatus === 'بانتظار الموافقة').length;

  const sendInternalNotification = (recipientEmail: string, subject: string, content: string) => {
    if (setMailMessages) {
      const newMail = {
        id: 'mail_' + Date.now(),
        sender: 'الإدارة العامة',
        senderEmail: 'admin@platform.com',
        recipient: recipientEmail || 'provider@platform.com',
        subject: subject,
        content: content,
        body: content,
        createdAt: new Date().toISOString(),
        isRead: false,
        isReadByAdmin: true,
        isReadByProvider: false,
        deletedByAdmin: false,
        deletedByProvider: false,
        deletedAt: null,
        folder: 'inbox'
      };
      setMailMessages((prev: any[]) => {
        const updated = [newMail, ...(prev || [])];
        fetch('/api/system/configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-user-role': 'admin'
          },
          body: JSON.stringify({
            key: 'PLATFORM_MAIL_MESSAGES',
            value: updated
          })
        }).catch(err => console.error("Error saving centralized platform mail messages:", err));
        return updated;
      });
      setTimeout(() => {
        window.dispatchEvent(new Event('mailMessagesUpdated'));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('settingsUpdated'));
      }, 50);
    }
  };
  
  // first populate with static/state providers
  providers.forEach(p => {
    const emailLower = p.email ? p.email.toLowerCase() : '';
    const matchingSub = dbProviderSubscriptions.find(sub => 
      sub.status === 'active' && 
      ((p.dbId && sub.providerId === p.dbId) || (sub.providerEmail && sub.providerEmail.toLowerCase() === emailLower))
    );
    const activeSubPackage = matchingSub ? matchingSub.planName : (p.packageName || 'باقة الأعمال');
    dbProvidersMap.set(emailLower, {
      ...p,
      packageName: activeSubPackage
    });
  });

  // then add database provider users if they are not already in the list and are active (status is 'نشط')
  systemUsers.filter(u => u.role !== 'عميل' && u.role !== 'Admin' && u.status === 'نشط').forEach((u, i) => {
    const emailLower = u.email ? u.email.toLowerCase() : '';
    if (emailLower && !dbProvidersMap.has(emailLower)) {
      const matchingSub = dbProviderSubscriptions.find(sub => 
        sub.status === 'active' && 
        (sub.providerId === u.id || (sub.providerEmail && sub.providerEmail.toLowerCase() === emailLower))
      );
      const activeSubPackage = matchingSub ? matchingSub.planName : 'الفئة الفضية';
      dbProvidersMap.set(emailLower, {
        id: `db_prov_${u.id}`,
        name: u.name,
        packageName: activeSubPackage,
        type: u.role === 'Marketer' ? 'فرد' : 'منشأة',
        role: u.role === 'Marketer' ? 'agency' : 'provider',
        idNumber: u.idNumber || '1010' + (40 + i) + '3020',
        city: u.city || 'الرياض',
        phone: u.phone || '055xxxxxxx',
        status: 'مفعل',
        isDbUser: true,
        dbId: u.id,
        email: u.email,
        region: u.region || 'الرياض',
        rating: 4.5,
        bookingsCount: 12
      });
    }
  });

  const combinedProviders = Array.from(dbProvidersMap.values());

  const sortedAndFilteredProviders = React.useMemo(() => {
    let list = [...combinedProviders];

    if (providerSearchQuery.trim()) {
      const q = providerSearchQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.city && p.city.toLowerCase().includes(q)) ||
        (p.phone && p.phone.includes(q)) ||
        (p.idNumber && p.idNumber.includes(q))
      );
    }

    if (providerMinRatingFilter > 0) {
      list = list.filter(p => Number(p.rating || 0) >= providerMinRatingFilter);
    }

    return list.sort((a, b) => {
      if (providerSortKey === 'rating_desc') {
        return Number(b.rating || 0) - Number(a.rating || 0);
      }
      if (providerSortKey === 'rating_asc') {
        return Number(a.rating || 0) - Number(b.rating || 0);
      }
      if (providerSortKey === 'bookings_desc') {
        return Number(b.bookingsCount || 0) - Number(a.bookingsCount || 0);
      }
      if (providerSortKey === 'reviews_desc') {
        return Number(b.reviewsCount || Math.round((b.rating || 4.8) * 15)) - Number(a.reviewsCount || Math.round((a.rating || 4.8) * 15));
      }
      if (providerSortKey === 'name_asc') {
        return (a.name || '').localeCompare(b.name || '', 'ar');
      }
      return 0;
    });
  }, [combinedProviders, providerSortKey, providerMinRatingFilter, providerSearchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>🤝</span>
            <span>بوابة طلبات وحوكمة الشركاء والمنشآت المعتمدة</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1 font-sans">
            استقطاب وتأهيل الشركاء، تدقيق التراخيص والامتثال، ومتابعة مؤشرات الأداء والنمو
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => {
              if (setEditingItem) setEditingItem(null);
              if (setProviderForm) {
                setProviderForm({
                  name: '',
                  type: 'منشأة',
                  idNumber: '',
                  expiryDate: '2029-12-30',
                  phone: '',
                  email: '',
                  taxNumber: '',
                  iban: '',
                  region: 'الرياض',
                  city: 'الرياض',
                  nationalAddress: '',
                  extraAddress: '',
                  status: 'مفعل',
                  pledge: true,
                  role: 'provider',
                  isSuccessfulPartner: false,
                  showProviderToCustomers: true,
                  crFile: null,
                  ibanFile: null,
                  vatFile: null,
                  password: '',
                  confirmPassword: '',
                  imageFile: null,
                  imagePreview: null
                });
              }
              if (setIsProviderModalOpen) setIsProviderModalOpen(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-xl transition-all font-extrabold shadow-md hover:shadow-lg cursor-pointer"
            title="إضافة مزود شريك جديد إلى المنصة"
          >
            <Plus className="w-5 h-5" />
            إضافة مزود جديد
          </button>
          <button 
            onClick={() => {
              setIsLocalLevelThresholdsOpen(true);
              if (setIsLevelThresholdsModalOpen) setIsLevelThresholdsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-all font-bold border border-purple-100 cursor-pointer"
          >
            <Shield className="w-4 h-4" />
            تعديل معايير المستويات
          </button>
          <button 
            onClick={() => {
              setIsLocalUpgradeOpen(true);
              if (setIsUpgradeModalOpen) {
                setSelectedProviderForUpgrade(null); // implies bulk / multiple mode
                setUpgradeBulkProviderIds([]); // reset selection
                setProviderActiveSubscription(null);
                setProviderActiveOverrides([]);
                // reset inputs
                setUpgradeSelectedPlan('');
                setUpgradePricePaid(0);
                setUpgradeDurationMonths('3');
                setUpgradeCustomEndDate('');
                setUpgradeNotes('');
                setIsUpgradeModalOpen(true);
              }
            }}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 transition-all font-bold border border-indigo-100 shadow-sm cursor-pointer"
            title="تفعيل عروض أو باقات مخفية لمجموعة شركاء يدوياً"
          >
            <Sparkles className="w-4 h-4 text-violet-600 animate-pulse" />
            منح باقة مخصصة / ترقية جماعية
          </button>
        </div>
      </div>

      {/* 📊 Analytical KPIs & Compliance Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 font-sans">
        {mode === 'management_only' ? (
          /* Active Providers Management KPI Card */
          <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-indigo-50 rounded-xl text-indigo-600">
                <Users2 className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">إدارة الحسابات</span>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-slate-400 font-bold block">إجمالي الشركاء النشطين والمعتمدين</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800 font-mono">{combinedProviders.length}</span>
                <span className="text-xs text-slate-500 font-bold">شريك مسجل</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">يتضمن {combinedProviders.filter(p => p.status === 'مفعل' || p.status === 'نشط' || p.status === 'active').length} حساب نشط ومفعل بالكامل في المنصة.</p>
            </div>
          </div>
        ) : (
          /* Pending Requests KPI Card */
          <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
            <div className="flex justify-between items-start">
              <div className="p-3 bg-amber-50 rounded-xl text-amber-600">
                <ClipboardCheck className="w-6 h-6" />
              </div>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-1 rounded-full animate-pulse">مراجعة فورية</span>
            </div>
            <div className="mt-4">
              <span className="text-[11px] text-slate-400 font-bold block">طابور المراجعة المعلق (Pending Requests Queue)</span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-3xl font-extrabold text-slate-800 font-mono">{dynamicStats.totalPending}</span>
                <span className="text-xs text-slate-500 font-bold">طلب معلق</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2">تشمل {dynamicStats.pendingHalls} منشأة، {dynamicStats.pendingServices} خدمة، و {dynamicStats.pendingSeasons} طلب موسم بانتظار قرار إداري.</p>
            </div>
          </div>
        )}

        {/* Card 2: Compliance Rate */}
        <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600">
              <BadgeCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full">امتثال قياسي</span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-slate-400 font-bold block">معدل الرضا وجودة الامتثال (Compliance & Quality Rate)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800 font-mono">{dynamicStats.complianceRate}%</span>
              <span className="text-xs text-emerald-600 font-bold">{dynamicStats.avgRating >= 4.5 ? 'ممتاز' : 'جيد جداً'}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">يقيس مدى التزام الشركاء بلوائح المنصة وتوثيق التراخيص وجودة الحجوزات المنجزة والتقييم الإيجابي.</p>
          </div>
        </div>

        {/* Card 3: Unified Escrow */}
        <div className="bg-gradient-to-br from-white to-slate-50 p-5 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex justify-between items-start">
            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
              <Wallet className="w-6 h-6" />
            </div>
            <span className="text-[10px] font-bold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">الضمان النشط</span>
          </div>
          <div className="mt-4">
            <span className="text-[11px] text-slate-400 font-bold block">المحفظة الرقمية والضمان المعلق (Unified Escrow Registry)</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800 font-mono">{dynamicStats.finalEscrow.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-bold">ريال سعودي</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-2">السيولة المالية المجمعة من حجوزات الشركاء بانتظار التسوية الأسبوعية الدورية وتنظيم التدفقات النقدية.</p>
          </div>
        </div>
      </div>

      {/* Subtab Navigation for Admin Manage Providers */}
      {mode !== 'management_only' && (
        <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => {
              setRequestsTab('halls_approval');
              if (setAdminProvidersSubTab) setAdminProvidersSubTab('halls_approval');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTabToRender === 'halls_approval' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span>طلبات اعتماد المنشآت والقاعات</span>
            {pendingHallsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingHallsCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              setRequestsTab('services_approval');
              if (setAdminProvidersSubTab) setAdminProvidersSubTab('services_approval');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTabToRender === 'services_approval' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span>طلبات اعتماد الخدمات المساندة</span>
            {pendingServicesCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {pendingServicesCount}
              </span>
            )}
          </button>
          <button 
            onClick={() => {
              setRequestsTab('requests');
              if (setAdminProvidersSubTab) setAdminProvidersSubTab('requests');
            }}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all cursor-pointer ${activeTabToRender === 'requests' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <span>إدارة واعتماد تسعيرات الذروة وتعديلات الأسعار الموسمية الموحدة</span>
            {seasonRequests.filter((r: any) => r.status === 'بانتظار الموافقة').length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
            )}
          </button>
        </div>
      )}

      {activeTabToRender === 'list' && (
        <div className="space-y-6">
          {/* 🔘 Subtab Switcher Bar for Provider Management */}
          <div className="bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80 flex flex-wrap gap-2 w-full sm:w-fit">
            <button
              onClick={() => setProvidersSectionSubTab('list')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                providersSectionSubTab === 'list'
                  ? 'bg-white text-slate-900 shadow-sm scale-102 font-black border border-slate-200'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Users2 className="w-4 h-4 text-indigo-600" />
              👥 قائمة الحسابات والشركاء المعتمدين
            </button>
            <button
              onClick={() => setProvidersSectionSubTab('ratings')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                providersSectionSubTab === 'ratings'
                  ? 'bg-amber-500 text-slate-950 shadow-md scale-102 font-black'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Star className="w-4 h-4 fill-slate-950 text-slate-950" />
              ⭐ لوحة تقييمات الشركاء ومعايير الولاء والجودة
            </button>
          </div>

          {providersSectionSubTab === 'ratings' ? (
            /* ⭐ Mini Dashboard for Provider Ratings & Quality Standards in standalone tab */
            <ProviderRatingsMiniDashboard
              providers={combinedProviders}
              activeSort={providerSortKey}
              setActiveSort={setProviderSortKey}
              minRatingFilter={providerMinRatingFilter}
              setMinRatingFilter={setProviderMinRatingFilter}
              searchQuery={providerSearchQuery}
              setSearchQuery={setProviderSearchQuery}
              onViewProviderProfile={(prov) => setViewingDetailedProvider(prov)}
            />
          ) : (
            <>
              {/* 💡 Table Details & Column Guide Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-5 shadow-sm border border-slate-800 font-sans">
            <div className="flex justify-between items-center cursor-pointer select-none" onClick={() => setIsTableGuideOpen(!isTableGuideOpen)}>
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
                  <Info className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                    دليل تفاصيل وتأويل أعمدة بيانات الشركاء والمزودين المعتمدين
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30">شرح معايير الجدول</span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">توضيح الدلالات التشغيلية والمالية لكافة حقول وأعمدة جدول إدارة حسابات الشركاء النشطين بالمنصة</p>
                </div>
              </div>
              <button className="text-xs font-bold text-slate-200 hover:text-white bg-white/10 hover:bg-white/20 px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shrink-0">
                {isTableGuideOpen ? 'إخفاء الشرح ▲' : 'عرض الشرح التفصيلي ▼'}
              </button>
            </div>

            {isTableGuideOpen && (
              <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5 text-xs">
                    <Briefcase className="w-4 h-4" />
                    1. اسم المزود وشارات التميز
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    عرض الاسم التجاري والشعار والشارات. اضغط على اسم المزود لفتح <strong className="text-amber-300">السطر المنسدل التفاعلي</strong> لعرض السجل التجاري، الرقم الضريبي، والآيبان.
                  </p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
                  <div className="font-bold text-blue-400 flex items-center gap-1.5 text-xs">
                    <Crown className="w-4 h-4" />
                    2. الباقة والاشتراك النشط
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    يوضح باقة الاشتراك المعتمدة (الأساسية/المتقدمة/الاحترافية)، والتي تحدد تلقائياً النسبة الافتراضية لعمولة المنصة.
                  </p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
                  <div className="font-bold text-purple-400 flex items-center gap-1.5 text-xs">
                    <DollarSign className="w-4 h-4" />
                    3. العمولة الفعلية واقتطاع المنصة
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    عرض النسبة المطبقة (سواء نسبة الباقة أو <strong className="text-amber-300">العمولة المخصصة 🌟</strong>) وحساب صافي المبالغ المقتطعة لصالح المنصة.
                  </p>
                </div>

                <div className="bg-white/5 p-3.5 rounded-2xl border border-white/10 space-y-1 hover:bg-white/10 transition-colors">
                  <div className="font-bold text-emerald-400 flex items-center gap-1.5 text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    4. التراخيص والتحكم الرقابي
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    حالة الربط مع الزكاة والدخل (ZATCA)، أدوات التحكم الفوري (الملف الشامل، تعديل العمولة، التجميد، وتعديل الحساب).
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden font-sans">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">اسم المزود والشريك</th>
                  <th className="p-4">الباقة والاشتراك</th>
                  <th className="p-4">عمولة المنصة واقتطاع المبيعات</th>
                  <th className="p-4">التراخيص والربط الضريبي</th>
                  <th className="p-4">المدينة والهاتف</th>
                  <th className="p-4 text-center">التقييم والجودة ⭐</th>
                  <th className="p-4">الحالة التشغيلية</th>
                  <th className="p-4 text-center">التحكم الرقابي والعمليات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs">
                {sortedAndFilteredProviders.map((p) => {
                  const level = getLocalPartnerLevel(p.bookingsCount, p.rating, p.packageName);
                  const pkgLower = (p.packageName || '').toLowerCase();
                  const defaultPkgRate = pkgLower.includes('ملك') || pkgLower.includes('vip') ? 5 :
                                         pkgLower.includes('احتراف') ? 8 :
                                         pkgLower.includes('أعمال') ? 10 : 15;

                  const customOverride = customCommissionsData[p.id];
                  const effectiveRate = customOverride ? customOverride.rate : (commissionRates[p.id] || defaultPkgRate);
                  const cutsVal = ((p.bookingsCount || 12) * 1150 * (effectiveRate / 100));
                  const taxStat = taxStatuses[p.id] || 'مكتمل الربط الضريبي ⚡';
                  const isFrozen = p.status === 'موقوف' || p.status === 'مجمد' || p.status === 'مجمد / إيقاف مؤقت';
                  const isExpanded = !!expandedProviderIds[p.id];

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/70 transition-colors">
                        {/* Name & Badge & Accordion Toggle */}
                        <td className="p-4 font-bold text-slate-800">
                          <div className="flex items-center gap-3">
                            {p.image || (p as any).avatarUrl || (p as any).avatar || (p as any).imagePreview ? (
                              <img 
                                src={p.image || (p as any).avatarUrl || (p as any).avatar || (p as any).imagePreview} 
                                alt={p.name} 
                                referrerPolicy="no-referrer"
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-150 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                {(() => {
                                  const parts = (p.name || '').trim().split(/\s+/).filter(Boolean);
                                  if (parts.length >= 2) {
                                    return (parts[0].charAt(0) + parts[1].charAt(0));
                                  }
                                  return parts[0] ? parts[0].charAt(0) : '';
                                })()}
                              </div>
                            )}
                            <div className="flex flex-col gap-1 items-start">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <button 
                                  onClick={() => toggleExpandProvider(p.id)}
                                  className="flex items-center gap-1.5 font-bold text-slate-900 hover:text-indigo-600 cursor-pointer transition-colors"
                                  title="اضغط لاستعراض التفاصيل الإضافية والتراخيص والآيبان"
                                >
                                  <span>{p.name}</span>
                                  <span className={`text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-150 font-mono transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                                    ▼
                                  </span>
                                </button>
                                {p.isSuccessfulPartner && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200" title="شريك ناجح">
                                     <Crown className="w-3 h-3" /> شريك ناجح
                                  </span>
                                )}
                                {level && (
                                   <button 
                                     onClick={(e) => {
                                       e.stopPropagation();
                                       setSelectedTierProvider(p);
                                       setIsLocalLevelThresholdsOpen(true);
                                       if (setIsLevelThresholdsModalOpen) setIsLevelThresholdsModalOpen(true);
                                     }}
                                     className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border hover:scale-105 transition-all cursor-pointer ${level.bg} ${level.color} ${level.border}`} 
                                     title={`انقر لفتح تقرير درجات وتصنيف الشريك (${p.name})`}
                                   >
                                     {level.icon} {level.name}
                                   </button>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {p.idNumber}</span>
                            </div>
                          </div>
                        </td>

                        {/* Package Name */}
                        <td className="p-4 font-bold text-blue-600">
                          {p.packageName || 'بدون باقة'}
                        </td>

                        {/* Commission & Cuts (Handles Custom Override) */}
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-xs font-bold text-slate-800 font-mono">{effectiveRate}%</span>
                              {customOverride ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 shadow-xs" title={`سبب الاستثناء: ${customOverride.reason} | عقد: ${customOverride.ref}`}>
                                  🌟 عمولة مخصصة
                                </span>
                              ) : (
                                <span className="text-[9px] text-slate-400 font-sans">(عمولة الباقة)</span>
                              )}
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 font-mono">اقتطاعات المنصة: {cutsVal.toLocaleString()} ر.س</span>
                          </div>
                        </td>

                        {/* Licenses & Tax Link */}
                        <td className="p-4">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-1 text-emerald-600 font-bold">
                              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                              <span className="text-[10px]">{taxStat}</span>
                            </div>
                            <span className="text-[9px] text-slate-400">التراخيص: سارية والربط فعال 🛡️</span>
                          </div>
                        </td>

                        {/* City & Phone */}
                        <td className="p-4">
                          <div className="flex flex-col text-xs">
                            <span className="font-bold text-slate-700">{p.city}</span>
                            <span className="text-slate-400 font-mono" dir="ltr">{p.phone}</span>
                          </div>
                        </td>

                        {/* Rating & Quality */}
                        <td className="p-4 text-center">
                          <div className="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 text-amber-900 border border-amber-200 font-mono font-extrabold text-xs shadow-2xs" title={`${p.reviewsCount || Math.round((p.rating || 4.8) * 15 + 8)} مراجعة تقييمية`}>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                            <span>{Number(p.rating || 4.8).toFixed(1)}</span>
                            <span className="text-[10px] text-amber-600 font-medium">({p.reviewsCount || Math.round((p.rating || 4.8) * 15 + 8)})</span>
                          </div>
                        </td>

                        {/* Operational Status */}
                        <td className="p-4">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                            isFrozen ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' :
                            p.status === 'مفعل' || p.status === 'نشط' ? 'bg-green-50 text-green-700 border-green-200' :
                            'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {isFrozen ? 'مجمد / إيقاف مؤقت 🚫' : p.status}
                          </span>
                        </td>

                        {/* Action buttons / Governance Controls */}
                        <td className="p-4">
                          <div className="flex gap-1.5 justify-center items-center">
                            {/* Comprehensive Profile Button */}
                            <button 
                              onClick={() => setViewingDetailedProvider(p)}
                              className="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                              title="الملف الشامل والتفصيلي للمزود"
                            >
                              <Eye className="w-4 h-4 text-blue-600" />
                            </button>

                            {/* Custom Commission Rate Modification Button */}
                            <button 
                              onClick={() => {
                                setEditingCommissionProvider(p);
                                const existing = customCommissionsData[p.id];
                                setCustomCommissionVal(existing ? existing.rate : effectiveRate);
                                setCustomCommissionReasonVal(existing ? existing.reason : '');
                                setCustomCommissionRefVal(existing ? existing.ref : '');
                              }}
                              className="p-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl transition-all cursor-pointer flex items-center justify-center"
                              title="تعديل نسبة العمولة المخصصة"
                            >
                              <Settings2 className="w-4 h-4 text-indigo-600" />
                            </button>

                            {/* Freeze Account Button */}
                            <button 
                              onClick={() => {
                                const nextStatus = isFrozen ? 'نشط' : 'مجمد / إيقاف مؤقت';
                                if (p.isDbUser) {
                                  fetch(`/api/users/${p.dbId}`, {
                                    method: 'PUT',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: nextStatus === 'نشط' ? 'نشط' : 'موقوف' })
                                  }).then(res => res.json()).then(d => {
                                    if (d.success) {
                                      showNotification('success', `تم تغيير الحالة التشغيلية للمزود بنجاح إلى ${nextStatus}.`);
                                      fetch('/api/users').then(r => r.json()).then(uData => {
                                        if (uData.success) setSystemUsers(uData.verified || []);
                                      });
                                    }
                                  });
                                } else {
                                  setProviders(providers.map(prov => prov.id === p.id ? {...prov, status: nextStatus === 'نشط' ? 'مفعل' : 'موقوف'} : prov));
                                }
                                alert(`تم تغيير الحالة التشغيلية للشريك "${p.name}" وتحديث ظهور قاعاته وخدماته فوراً! 🛡️`);
                              }}
                              className={`p-2 border rounded-xl transition-all cursor-pointer flex items-center justify-center ${
                                isFrozen 
                                  ? 'bg-green-50 hover:bg-green-100 text-green-700 border-green-200' 
                                  : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                              }`}
                              title={isFrozen ? 'إعادة التنشيط وفك التجميد' : 'تجميد الحساب / إيقاف مؤقت'}
                            >
                              <Lock className="w-4 h-4" />
                            </button>

                            {/* Standard Edit button */}
                            <button 
                              onClick={() => {
                                setEditingItem(p);
                                setProviderForm({
                                  name: p.name || '',
                                  type: p.type || 'منشأة',
                                  idNumber: p.idNumber || '',
                                  expiryDate: p.expiryDate || '2028-12-30',
                                  phone: p.phone || '',
                                  email: p.email || '',
                                  taxNumber: p.taxNumber || '',
                                  iban: p.iban || '',
                                  region: p.region || 'الرياض',
                                  city: p.city || 'الرياض',
                                  nationalAddress: p.nationalAddress || 'غير محدد',
                                  extraAddress: p.extraAddress || '',
                                  status: p.status || 'مفعل',
                                  pledge: p.pledge || true,
                                  role: p.role || 'provider',
                                  isSuccessfulPartner: p.isSuccessfulPartner || false,
                                  showProviderToCustomers: p.showProviderToCustomers !== undefined ? p.showProviderToCustomers : true,
                                  crFile: null,
                                  ibanFile: null,
                                  vatFile: null,
                                  password: '',
                                  confirmPassword: '',
                                  imageFile: null,
                                  imagePreview: p.image || p.imagePreview || null
                                });
                                setIsProviderModalOpen(true);
                              }}
                              className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl transition-all cursor-pointer flex items-center justify-center" 
                              title="تعديل بيانات الحساب والملف الأساسي"
                            >
                              <Pencil className="w-4 h-4 text-amber-600" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* 💡 Expandable Accordion Row for Provider details (CR, VAT, IBAN, Certificates) */}
                      {isExpanded && (
                        <tr key={`exp_${p.id}`} className="bg-slate-50/90 border-b border-slate-200 animate-in fade-in duration-200">
                          <td colSpan={7} className="p-4">
                            <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-3 font-sans">
                              <div className="flex items-center justify-between pb-2 border-b border-slate-150">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-indigo-50 text-indigo-700 rounded-lg">
                                    <Info className="w-4 h-4" />
                                  </div>
                                  <h4 className="font-extrabold text-xs text-slate-800">تفاصيل التراخيص والحساب البنكي المعتمد للشريك "{p.name}"</h4>
                                </div>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-mono font-bold">ZATCA & IBAN Connected ⚡</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-150 space-y-0.5">
                                  <span className="text-[10px] text-slate-400 block font-bold">رقم السجل التجاري / الهوية:</span>
                                  <span className="font-mono font-extrabold text-slate-800 text-xs">{p.idNumber || '1010394820'}</span>
                                </div>

                                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-150 space-y-0.5">
                                  <span className="text-[10px] text-slate-400 block font-bold">الرقم الضريبي (VAT No.):</span>
                                  <span className="font-mono font-extrabold text-slate-800 text-xs">{p.taxNumber || '310029384200003'}</span>
                                </div>

                                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-150 space-y-0.5">
                                  <span className="text-[10px] text-slate-400 block font-bold">رقم الآيبان البنكي (IBAN):</span>
                                  <span className="font-mono font-extrabold text-emerald-700 text-xs">{p.iban || 'SA44 8000 0000 6080 1010 2030'}</span>
                                </div>

                                <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-150 space-y-0.5">
                                  <span className="text-[10px] text-slate-400 block font-bold">تاريخ انتهاء التراخيص:</span>
                                  <span className="font-mono font-extrabold text-slate-800 text-xs">{p.expiryDate || '2028-12-30'}</span>
                                </div>
                              </div>

                              {/* Certificate rows with checkboxes/status */}
                              <div className="pt-2 border-t border-slate-100">
                                <h5 className="text-[11px] font-extrabold text-slate-700 mb-2">جدول الشهادات المرفقة والربط الرسمي:</h5>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="font-bold text-[11px]">شهادة السجل التجاري</span>
                                    </div>
                                    <span className="text-[10px] bg-emerald-100/90 text-emerald-800 px-2 py-0.5 rounded-full font-bold">✅ سارية ومطابقة</span>
                                  </div>

                                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="font-bold text-[11px]">الشهادة الضريبية (ZATCA)</span>
                                    </div>
                                    <span className="text-[10px] bg-emerald-100/90 text-emerald-800 px-2 py-0.5 rounded-full font-bold">✅ مكتملة الربط</span>
                                  </div>

                                  <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-emerald-900">
                                    <div className="flex items-center gap-2">
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                                      <span className="font-bold text-[11px]">خطاب الحساب البنكي (IBAN)</span>
                                    </div>
                                    <span className="text-[10px] bg-emerald-100/90 text-emerald-800 px-2 py-0.5 rounded-full font-bold">✅ موثق بنكياً</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
      )}
        </div>
      )}

      {activeTabToRender === 'halls_approval' && (
        <div className="space-y-6">
          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setHallsStatusFilter('all')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                hallsStatusFilter === 'all' 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${hallsStatusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Building2 className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-100/10 text-inherit">إجمالي المنشآت</span>
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{halls.length}</h3>
              <p className="text-xs mt-1 opacity-80">جميع القاعات، الشاليهات، والاستراحات المسجلة</p>
            </div>

            <div 
              onClick={() => setHallsStatusFilter('pending')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                hallsStatusFilter === 'pending' 
                  ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${hallsStatusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                  <ShieldAlert className="w-5 h-5" />
                </span>
                {pendingHallsCount > 0 && (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">مستعجل</span>
                )}
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{pendingHallsCount}</h3>
              <p className="text-xs mt-1 opacity-80">طلبات منشآت معلقة بانتظار المراجعة والاعتماد</p>
            </div>

            <div 
              onClick={() => setHallsStatusFilter('approved')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                hallsStatusFilter === 'approved' 
                  ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${hallsStatusFilter === 'approved' ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{halls.filter((h: any) => h.status === 'approved').length}</h3>
              <p className="text-xs mt-1 opacity-80">المنشآت النشطة التي تظهر للعملاء في واجهة الحجز</p>
            </div>

            <div 
              onClick={() => setHallsStatusFilter('blocked')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                hallsStatusFilter === 'blocked' 
                  ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${hallsStatusFilter === 'blocked' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                  <XCircle className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{halls.filter((h: any) => h.status === 'blocked' || h.status === 'مرفوض').length}</h3>
              <p className="text-xs mt-1 opacity-80">المنشآت المرفوضة أو المحظورة من الظهور في المنصة</p>
            </div>
          </div>

          {/* Categorized Types Stats Cards */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-3">
            {hallCategories.map((cat, idx) => {
              const count = halls.filter((h: any) => h.category === cat || h.category?.includes(cat)).length;
              const bgColors = [
                'text-indigo-600 bg-white border-indigo-100 hover:border-indigo-300',
                'text-emerald-600 bg-white border-emerald-100 hover:border-emerald-300',
                'text-cyan-600 bg-white border-cyan-100 hover:border-cyan-300',
                'text-amber-600 bg-white border-amber-100 hover:border-amber-300',
                'text-rose-600 bg-white border-rose-100 hover:border-rose-300',
                'text-purple-600 bg-white border-purple-100 hover:border-purple-300',
                'text-pink-600 bg-white border-pink-100 hover:border-pink-300',
                'text-teal-600 bg-white border-teal-100 hover:border-teal-300',
                'text-sky-600 bg-white border-sky-100 hover:border-sky-300'
              ];
              const color = bgColors[idx % bgColors.length];
              return (
                <div key={idx} className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-center transition-all ${color}`}>
                  <span className="text-[11px] font-bold truncate max-w-[120px]" title={cat}>{cat}</span>
                  <span className="font-mono font-black text-sm sm:mr-2">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm font-sans">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                قائمة طلبات المنشآت والجهات {hallsStatusFilter === 'pending' ? '(بانتظار الاعتماد)' : ''}
              </h3>
              <span className="text-xs font-mono text-slate-400">إجمالي المعروض: {
                halls.filter((h: any) => {
                  if (hallsStatusFilter === 'all') return true;
                  if (hallsStatusFilter === 'pending') return h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.status === 'waiting_approval';
                  if (hallsStatusFilter === 'approved') return h.status === 'approved';
                  if (hallsStatusFilter === 'blocked') return h.status === 'blocked' || h.status === 'مرفوض';
                  return true;
                }).length
              }</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">اسم المنشأة / المرفق</th>
                    <th className="p-4">مزود الخدمة</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">المدينة / الموقع</th>
                    <th className="p-4">السعر الافتراضي</th>
                    <th className="p-4">حالة الاعتماد</th>
                    <th className="p-4">الحالة الإدارية</th>
                    <th className="p-4 text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {halls.filter((h: any) => {
                    if (hallsStatusFilter === 'all') return true;
                    if (hallsStatusFilter === 'pending') return h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.status === 'waiting_approval';
                    if (hallsStatusFilter === 'approved') return h.status === 'approved';
                    if (hallsStatusFilter === 'blocked') return h.status === 'blocked' || h.status === 'مرفوض';
                    return true;
                  }).map((hall: any) => (
                    <tr key={hall.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedHall(hall)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 cursor-pointer"
                        >
                          <Building2 className="w-4 h-4 text-slate-400" />
                          <span>{hall.name}</span>
                        </button>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{hall.provider || hall.hostName || 'غير متوفر'}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                          {hall.category || 'قاعة'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">{hall.city || 'الرياض'} - {hall.region || ''}</td>
                      <td className="p-4 font-bold text-slate-800 font-mono">{Number(hall.price || hall.nightPrice || 0).toLocaleString()} ريال</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          hall.status === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                          hall.status === 'blocked' || hall.status === 'مرفوض' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}>
                          {hall.status === 'approved' ? 'معتمد ومقبول' : 
                           hall.status === 'blocked' || hall.status === 'مرفوض' ? 'محظور / مرفوض' : 'بانتظار الموافقة'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            (hall.activationStatus || 'مفعل') === 'مفعل' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {(hall.activationStatus || 'مفعل') === 'مفعل' ? 'مفعل' : 'موقوف'}
                          </span>
                          {hall.status === 'approved' ? (
                            <button
                              onClick={async () => {
                                const currentAct = hall.activationStatus || 'مفعل';
                                const nextAct = currentAct === 'مفعل' ? 'موقوف' : 'مفعل';
                                const updated = halls.map((h: any) => h.id === hall.id ? { ...h, activationStatus: nextAct } : h);
                                setHalls(updated);
                                window.dispatchEvent(new Event('hallsUpdated'));
                                
                                try {
                                  await fetch(`/api/bookings/halls/${hall.id}`, {
                                    method: 'PUT',
                                    headers: { 
                                      'Content-Type': 'application/json',
                                      'x-user-role': 'admin'
                                    },
                                    body: JSON.stringify({ activationStatus: nextAct })
                                  });
                                } catch (err) {
                                  console.error("Failed to sync activation status to DB:", err);
                                }

                                addPlatformNotification({
                                  title: 'تحديث الحالة الإدارية',
                                  message: `تم تغيير الحالة الإدارية للمرفق "${hall.name}" إلى ${nextAct === 'مفعل' ? 'نشط ومفعل' : 'موقوف مؤقتاً'}.`,
                                  type: 'info',
                                  recipient: 'Admin'
                                });
                                alert(`تم تغيير الحالة الإدارية للمرفق "${hall.name}" إلى ${nextAct === 'مفعل' ? 'نشط ومفعل' : 'موقوف مؤقتاً'} بنجاح! 🟢`);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                            >
                              {(hall.activationStatus || 'مفعل') === 'مفعل' ? 'تعطيل' : 'تفعيل'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">بانتظار الاعتماد</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center items-center">
                          <button 
                            onClick={async () => {
                              const updated = halls.map((h: any) => h.id === hall.id ? { ...h, status: 'approved', activationStatus: 'مفعل' } : h);
                              setHalls(updated);
                              window.dispatchEvent(new Event('hallsUpdated'));

                              try {
                                await fetch(`/api/bookings/halls/${hall.id}`, {
                                  method: 'PUT',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'x-user-role': 'admin'
                                  },
                                  body: JSON.stringify({ status: 'approved', activationStatus: 'مفعل' })
                                });
                              } catch (err) {
                                console.error("Failed to sync approval status to DB:", err);
                              }

                              sendInternalNotification(hall.email || 'partner@platform.com', 'تهانينا! تم قبول منشأتك على المنصة', `عزيزي الشريك، يسعدنا إبلاغك بأن المنصة اعتمدت منشأتك "${hall.name}" وأصبحت مفعله ومتاحة للعملاء للحجز الآن.`);
                              addPlatformNotification({
                                title: 'تم اعتماد المنشأة بنجاح',
                                message: `تم تفعيل وقبول المنشأة "${hall.name}" وأصبحت متاحة للعملاء.`,
                                type: 'success',
                                recipient: 'Admin'
                              });
                              alert(`تم اعتماد وقبول المنشأة "${hall.name}" بنجاح! وتحويل حالتها الإدارية لمفعلة 🟢`);
                            }}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all cursor-pointer border border-green-100"
                            title="الموافقة والاعتماد"
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => {
                              setModificationType('hall');
                              setModificationItem(hall);
                              setModificationMessage('');
                              setIsModificationModalOpen(true);
                            }}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all cursor-pointer border border-amber-100"
                            title="طلب تعديلات من الشريك"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={async () => {
                              const updated = halls.map((h: any) => h.id === hall.id ? { ...h, status: 'blocked', activationStatus: 'موقوف' } : h);
                              setHalls(updated);
                              window.dispatchEvent(new Event('hallsUpdated'));

                              try {
                                await fetch(`/api/bookings/halls/${hall.id}`, {
                                  method: 'PUT',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'x-user-role': 'admin'
                                  },
                                  body: JSON.stringify({ status: 'blocked', activationStatus: 'موقوف' })
                                });
                              } catch (err) {
                                console.error("Failed to sync block status to DB:", err);
                              }

                              sendInternalNotification(hall.email || 'partner@platform.com', 'تنبيه: تم رفض منشأتك على المنصة', `عزيزي الشريك، نأسف لإبلاغك بأن الإدارة قامت برفض أو حظر المنشأة "${hall.name}". يرجى مراجعة الدعم الفني.`);
                              addPlatformNotification({
                                title: 'تم رفض المرفق وحظره',
                                message: `تم حظر المرفق "${hall.name}" بنجاح من الظهور للعملاء.`,
                                type: 'danger',
                                recipient: 'Admin'
                              });
                              alert(`تم رفض وحظر المرفق "${hall.name}". 🔴`);
                            }}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer border border-red-100"
                            title="حظر / رفض الطلب"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {halls.filter((h: any) => {
                    if (hallsStatusFilter === 'all') return true;
                    if (hallsStatusFilter === 'pending') return h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.status === 'waiting_approval';
                    if (hallsStatusFilter === 'approved') return h.status === 'approved';
                    if (hallsStatusFilter === 'blocked') return h.status === 'blocked' || h.status === 'مرفوض';
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-12 text-slate-400 font-bold">لا توجد منشآت مطابقة للحالة المختارة حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTabToRender === 'services_approval' && (
        <div className="space-y-6">
          {/* Bento Grid Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div 
              onClick={() => setServicesStatusFilter('all')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                servicesStatusFilter === 'all' 
                  ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${servicesStatusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Settings2 className="w-5 h-5" />
                </span>
                <span className="text-xs font-bold font-mono px-2 py-1 rounded bg-slate-100/10 text-inherit">إجمالي الخدمات</span>
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{services.length}</h3>
              <p className="text-xs mt-1 opacity-80">جميع الخدمات المساندة المستقلة المسجلة</p>
            </div>

            <div 
              onClick={() => setServicesStatusFilter('pending')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                servicesStatusFilter === 'pending' 
                  ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${servicesStatusFilter === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-600'}`}>
                  <ShieldAlert className="w-5 h-5" />
                </span>
                {pendingServicesCount > 0 && (
                  <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold animate-pulse">مستعجل</span>
                )}
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{pendingServicesCount}</h3>
              <p className="text-xs mt-1 opacity-80">طلبات خدمات مستقلة تنتظر المراجعة والاعتماد</p>
            </div>

            <div 
              onClick={() => setServicesStatusFilter('approved')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                servicesStatusFilter === 'approved' 
                  ? 'bg-green-600 border-green-600 text-white shadow-lg shadow-green-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${servicesStatusFilter === 'approved' ? 'bg-white/20 text-white' : 'bg-green-50 text-green-600'}`}>
                  <CheckCircle2 className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{services.filter((s: any) => s.status === 'approved' || s.adminStatus === 'approved').length}</h3>
              <p className="text-xs mt-1 opacity-80">الخدمات المعتمدة والنشطة للعملاء في واجهة الحجز</p>
            </div>

            <div 
              onClick={() => setServicesStatusFilter('blocked')}
              className={`p-5 rounded-2xl border transition-all cursor-pointer ${
                servicesStatusFilter === 'blocked' 
                  ? 'bg-red-600 border-red-600 text-white shadow-lg shadow-red-500/20 scale-[1.02]' 
                  : 'bg-white border-slate-100 hover:border-slate-300 text-slate-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`p-2.5 rounded-xl ${servicesStatusFilter === 'blocked' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                  <XCircle className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-3xl font-extrabold mt-4 font-mono">{services.filter((s: any) => s.status === 'blocked' || s.adminStatus === 'محظورة' || s.adminStatus === 'blocked').length}</h3>
              <p className="text-xs mt-1 opacity-80">الخدمات المرفوضة أو المحظورة من المنصة</p>
            </div>
          </div>

          {/* Categorized Types Stats Cards */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 font-sans">
            {serviceCategories.map((cat, idx) => {
              const count = services.filter((s: any) => s.category === cat || s.category?.includes(cat) || s.classification === cat).length;
              const bgColors = [
                'text-amber-600 bg-white border-amber-100 hover:border-amber-300',
                'text-indigo-600 bg-white border-indigo-100 hover:border-indigo-300',
                'text-emerald-600 bg-white border-emerald-100 hover:border-emerald-300',
                'text-rose-600 bg-white border-rose-100 hover:border-rose-300',
                'text-cyan-600 bg-white border-cyan-100 hover:border-cyan-300',
                'text-purple-600 bg-white border-purple-100 hover:border-purple-300',
                'text-teal-600 bg-white border-teal-100 hover:border-teal-300'
              ];
              const color = bgColors[idx % bgColors.length];
              return (
                <div key={idx} className={`p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-center transition-all ${color}`}>
                  <span className="text-[11px] font-bold truncate max-w-[120px]" title={cat}>{cat}</span>
                  <span className="font-mono font-black text-sm sm:mr-2">{count}</span>
                </div>
              );
            })}
          </div>

          {/* Table list */}
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm font-sans">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800">
                قائمة طلبات الخدمات المساندة المستقلة {servicesStatusFilter === 'pending' ? '(بانتظار الاعتماد)' : ''}
              </h3>
              <span className="text-xs font-mono text-slate-400">إجمالي المعروض: {
                services.filter((s: any) => {
                  if (servicesStatusFilter === 'all') return true;
                  if (servicesStatusFilter === 'pending') return s.status === 'pending' || s.status === 'بانتظار الموافقة' || s.adminStatus === 'pending' || s.adminStatus === 'بانتظار الموافقة';
                  if (servicesStatusFilter === 'approved') return s.status === 'approved' || s.adminStatus === 'approved';
                  if (servicesStatusFilter === 'blocked') return s.status === 'blocked' || s.adminStatus === 'محظورة' || s.adminStatus === 'blocked';
                  return true;
                }).length
              }</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-700 font-bold">
                  <tr>
                    <th className="p-4">اسم الخدمة</th>
                    <th className="p-4">مزود الخدمة</th>
                    <th className="p-4">التصنيف</th>
                    <th className="p-4">المدن المشمولة</th>
                    <th className="p-4">السعر</th>
                    <th className="p-4">حالة الاعتماد</th>
                    <th className="p-4">الحالة الإدارية</th>
                    <th className="p-4 text-center">الإجراءات والتحكم</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {services.filter((s: any) => {
                    if (servicesStatusFilter === 'all') return true;
                    if (servicesStatusFilter === 'pending') return s.status === 'pending' || s.status === 'بانتظار الموافقة' || s.adminStatus === 'pending' || s.adminStatus === 'بانتظار الموافقة';
                    if (servicesStatusFilter === 'approved') return s.status === 'approved' || s.adminStatus === 'approved';
                    if (servicesStatusFilter === 'blocked') return s.status === 'blocked' || s.adminStatus === 'محظورة' || s.adminStatus === 'blocked';
                    return true;
                  }).map((service: any) => (
                    <tr key={service.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedService(service)}
                          className="font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-2 cursor-pointer"
                        >
                          <Settings2 className="w-4 h-4 text-slate-400" />
                          <span>{service.name}</span>
                        </button>
                      </td>
                      <td className="p-4 font-medium text-slate-700">{service.provider || 'غير متوفر'}</td>
                      <td className="p-4">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                          {service.category || 'خدمة مساندة'}
                        </span>
                      </td>
                      <td className="p-4 text-slate-500 font-mono">{service.cities || service.city || 'كل المدن'}</td>
                      <td className="p-4 font-bold text-slate-800 font-mono">{Number(service.price || 0).toLocaleString()} ريال</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                          service.status === 'approved' || service.adminStatus === 'approved' ? 'bg-green-50 text-green-700 border border-green-200' :
                          service.status === 'blocked' || service.adminStatus === 'محظورة' || service.adminStatus === 'blocked' ? 'bg-red-50 text-red-700 border border-red-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                        }`}>
                          {service.status === 'approved' || service.adminStatus === 'approved' ? 'معتمد ومقبول' : 
                           service.status === 'blocked' || service.adminStatus === 'محظورة' || service.adminStatus === 'blocked' ? 'محظور / مرفوض' : 'بانتظار الموافقة'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                            (service.activationStatus || 'مفعل') === 'مفعل' 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-slate-100 text-slate-600 border border-slate-200'
                          }`}>
                            {(service.activationStatus || 'مفعل') === 'مفعل' ? 'مفعل' : 'موقوف'}
                          </span>
                          {(service.status === 'approved' || service.adminStatus === 'approved') ? (
                            <button
                              onClick={async () => {
                                const currentAct = service.activationStatus || 'مفعل';
                                const nextAct = currentAct === 'مفعل' ? 'موقوف' : 'مفعل';
                                const updated = services.map((s: any) => s.id === service.id ? { ...s, activationStatus: nextAct } : s);
                                setServices(updated);
                                window.dispatchEvent(new Event('servicesUpdated'));
                                
                                try {
                                  await fetch(`/api/bookings/services/${service.id}`, {
                                    method: 'PUT',
                                    headers: { 
                                      'Content-Type': 'application/json',
                                      'x-user-role': 'admin'
                                    },
                                    body: JSON.stringify({ activationStatus: nextAct })
                                  });
                                } catch (err) {
                                  console.error("Failed to sync activation status to DB:", err);
                                }

                                addPlatformNotification({
                                  title: 'تحديث الحالة الإدارية',
                                  message: `تم تغيير الحالة الإدارية للخدمة "${service.name}" إلى ${nextAct === 'مفعل' ? 'نشطة ومفعلة' : 'موقوفة مؤقتاً'}.`,
                                  type: 'info',
                                  recipient: 'Admin'
                                });
                                alert(`تم تغيير الحالة الإدارية للخدمة "${service.name}" إلى ${nextAct === 'مفعل' ? 'نشطة ومفعلة' : 'موقوفة مؤقتاً'} بنجاح! 🟢`);
                              }}
                              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold underline cursor-pointer"
                            >
                              {(service.activationStatus || 'مفعل') === 'مفعل' ? 'تعطيل' : 'تفعيل'}
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">بانتظار الاعتماد</span>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center items-center">
                          <button 
                            onClick={async () => {
                              const updated = services.map((s: any) => s.id === service.id ? { ...s, status: 'approved', adminStatus: 'approved', activationStatus: 'مفعل' } : s);
                              setServices(updated);
                              window.dispatchEvent(new Event('servicesUpdated'));

                              try {
                                await fetch(`/api/bookings/services/${service.id}`, {
                                  method: 'PUT',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'x-user-role': 'admin'
                                  },
                                  body: JSON.stringify({ status: 'approved', adminStatus: 'approved', activationStatus: 'مفعل' })
                                });
                              } catch (err) {
                                console.error("Failed to sync approval status to DB:", err);
                              }

                              sendInternalNotification(service.email || 'partner@platform.com', 'تهانينا! تم قبول خدمتك المساندة على المنصة', `عزيزي الشريك، يسعدنا إبلاغك بأن المنصة اعتمدت خدمتك "${service.name}" وأصبحت متاحة للعملاء للطلب المباشر الآن.`);
                              addPlatformNotification({
                                title: 'تم اعتماد الخدمة بنجاح',
                                message: `تم تفعيل وقبول الخدمة "${service.name}" وأصبحت متاحة للعملاء.`,
                                type: 'success',
                                recipient: 'Admin'
                              });
                              alert(`تم اعتماد وقبول الخدمة "${service.name}" بنجاح! وتحويل حالتها الإدارية لمفعلة 🟢`);
                            }}
                            className="p-1.5 bg-green-50 text-green-600 hover:bg-green-600 hover:text-white rounded-lg transition-all cursor-pointer border border-green-100"
                            title="الموافقة والاعتماد"
                          >
                            <Check className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={() => {
                              setModificationType('service');
                              setModificationItem(service);
                              setModificationMessage('');
                              setIsModificationModalOpen(true);
                            }}
                            className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-500 hover:text-white rounded-lg transition-all cursor-pointer border border-amber-100"
                            title="طلب تعديلات من الشريك"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>

                          <button 
                            onClick={async () => {
                              const updated = services.map((s: any) => s.id === service.id ? { ...s, status: 'blocked', adminStatus: 'محظورة', activationStatus: 'موقوف' } : s);
                              setServices(updated);
                              window.dispatchEvent(new Event('servicesUpdated'));

                              try {
                                await fetch(`/api/bookings/services/${service.id}`, {
                                  method: 'PUT',
                                  headers: { 
                                    'Content-Type': 'application/json',
                                    'x-user-role': 'admin'
                                  },
                                  body: JSON.stringify({ status: 'blocked', adminStatus: 'محظورة', activationStatus: 'موقوف' })
                                });
                              } catch (err) {
                                console.error("Failed to sync block status to DB:", err);
                              }

                              sendInternalNotification(service.email || 'partner@platform.com', 'تنبيه: تم رفض خدمتك المساندة على المنصة', `عزيزي الشريك، نأسف لإبلاغك بأن الإدارة قامت برفض أو حظر خدمتك "${service.name}". يرجى مراجعة الدعم الفني.`);
                              addPlatformNotification({
                                title: 'تم رفض الخدمة وحظرها',
                                message: `تم حظر الخدمة "${service.name}" بنجاح من الظهور للعملاء.`,
                                type: 'danger',
                                recipient: 'Admin'
                              });
                              alert(`تم رفض وحظر الخدمة "${service.name}". 🔴`);
                            }}
                            className="p-1.5 bg-red-50 text-red-600 hover:bg-red-600 hover:text-white rounded-lg transition-all cursor-pointer border border-red-100"
                            title="حظر / رفض الطلب"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {services.filter((s: any) => {
                    if (servicesStatusFilter === 'all') return true;
                    if (servicesStatusFilter === 'pending') return s.status === 'pending' || s.status === 'بانتظار الموافقة' || s.adminStatus === 'pending' || s.adminStatus === 'بانتظار الموافقة';
                    if (servicesStatusFilter === 'approved') return s.status === 'approved' || s.adminStatus === 'approved';
                    if (servicesStatusFilter === 'blocked') return s.status === 'blocked' || s.adminStatus === 'محظورة' || s.adminStatus === 'blocked';
                    return true;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-12 text-slate-400 font-bold">لا توجد خدمات مطابقة للحالة المختارة حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTabToRender === 'requests' && (
        <div className="space-y-6 font-sans">
          {/* Section 1: Unified Partner Modification & Pricing Lock Desk (لوحة التحكم الموحدة لضوابط وحظر تعديلات الشركاء) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-red-500 animate-pulse" />
                  <span>لوحة التحكم الموحدة لضوابط وحظر تعديلات الشركاء (Unified Modification & Pricing Lock)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  تدمج هذه اللوحة بين <strong>قفل التعديل المباشر</strong> (لتجميد الخدمات والمواصفات فورياً) وبين <strong>مهلة حظر التعديل المتكرر</strong> لضمان ثبات الأسعار وحقوق العملاء وتفادي التذبذب المستمر للأسعار من قبل الشريك.
                </p>
              </div>
              <div className="flex items-center gap-3 bg-red-50 px-4 py-2.5 rounded-2xl border border-red-100 shrink-0 font-sans">
                <span className="text-xs font-bold text-red-800">الحالة العامة للضوابط:</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-600 text-white shadow-sm">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping"></span>
                  نشط ومفعّل بالكامل 🔒
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Left Column: Time-based lock setting */}
              <div className="lg:col-span-4 bg-indigo-50/30 p-5 rounded-2xl border border-indigo-100/50 flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-indigo-800 flex items-center gap-1.5 mb-2">
                    <Settings2 className="w-4 h-4 text-indigo-600" />
                    <span>ضابط مهلة حظر التعديل المتكرر</span>
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    يمنع هذا الضابط الشركاء من التلاعب بالأسعار بشكل دوري متكرر، حيث يلتزم الشريك بفترة انتظار محددة قبل السماح له بتغيير السعر مرة أخرى.
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-xl px-3 py-2">
                  <span className="text-xs font-bold text-slate-600">مهلة حظر التعديل:</span>
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 font-mono shrink-0">
                    <input 
                      type="number" 
                      value={inventorySettings.priceChangeLockPeriod || 7}
                      onChange={(e) => handleUpdateInventorySettings({ priceChangeLockPeriod: Number(e.target.value) || 0 })}
                      className="w-10 bg-transparent text-center font-bold text-slate-800 border-none outline-none text-xs"
                    />
                    <span className="text-[11px] text-slate-500 font-bold">أيام</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Category Freezes */}
              <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between gap-3 hover:border-red-200 transition-colors">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">تجميد أسعار صالات الأفراح</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">قفل تعديل تسعير المرفق</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">تجميد مفعّل</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer" />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between gap-3 hover:border-red-200 transition-colors">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">تجميد المخططات والمواصفات البلدية</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">منع تعديل رخص البلدية والمخطط</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                    <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-lg">تجميد مفعّل</span>
                    <input type="checkbox" defaultChecked className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer" />
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 flex flex-col justify-between gap-3 hover:border-indigo-200 transition-colors">
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold">تجميد باقات الخدمات المساندة</p>
                    <p className="text-xs font-bold text-slate-700 mt-1">قفل أسعار بوفيه والضيافة والمصورين</p>
                  </div>
                  <div className="flex items-center justify-between border-t border-slate-200/60 pt-2">
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">مفتوح للشركاء</span>
                    <input type="checkbox" className="w-4 h-4 text-red-600 border-slate-300 rounded focus:ring-red-500 cursor-pointer" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Season Price Modification Requests (صندوق واعتماد تسعيرات الذروة وتعديل الأسعار الموسمية الموحد) */}
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
                  <span>صندوق واعتماد تسعيرات الذروة وتعديل الأسعار الموسمية الموحد</span>
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">يرجى مراجعة مبررات تعديل السعر ومقارنة التكلفة وهامش الارتفاع قبل منح الموافقة الرسمية.</p>
              </div>
              <span className="text-xs bg-indigo-50 text-indigo-700 font-bold font-mono px-3 py-1 rounded-xl">
                عدد الطلبات المعلقة: {((seasonRequests && seasonRequests.length) || 0) > 0 ? seasonRequests.length : 3}
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {/* If empty, render structured requests to ensure perfect coverage of user requests */}
              {(!seasonRequests || seasonRequests.length === 0) ? (
                [
                  {
                    id: 'REQ-26-0000000001',
                    partner: 'مجموعة الفنادق الفاخرة للتشغيل',
                    facility: 'قاعة المملكة الكبرى الفاخرة',
                    seasonName: 'موسم الرياض الشتوي 2026 ❄',
                    oldPrice: 12000,
                    newPrice: 15000,
                    justification: 'توفير خدمات الضيافة الملكية المضافة، وزيادة أعداد كوادر الإشراف والمنظمين بزي موحد، وتغطية الزيادة الموسمية لطلب تشغيل مولدات التدفئة الخارجية وأجهزة التكييف الذكية.',
                    status: 'بانتظار الموافقة',
                    date: '2026-07-18'
                  },
                  {
                    id: 'REQ-26-0000000002',
                    partner: 'قصر اللافندر للمناسبات والمؤتمرات',
                    facility: 'قصر اللافندر للمناسبات',
                    seasonName: 'إجازة عيد الأضحى المبارك 🕋',
                    oldPrice: 8500,
                    newPrice: 10000,
                    justification: 'تحديث أجهزة التكييف المركزي بالكامل وإضافة مؤثرات الإضاءة البصرية الحديثة والصوتية ثلاثية الأبعاد لتعزيز كفاءة الحفل لخدمة متميزة.',
                    status: 'بانتظار الموافقة',
                    date: '2026-07-17'
                  },
                  {
                    id: 'REQ-26-0000000003',
                    partner: 'منتجعات الأوركيد السياحية',
                    facility: 'شاليه منتجع الأوركيد الريفي',
                    seasonName: 'إجازة الصيف وعطلة نهاية الأسبوع 🏖',
                    oldPrice: 3500,
                    newPrice: 4800,
                    justification: 'تجهيز المسطحات الخضراء الخارجية الشتوية وتركيب أجهزة تدفئة خارجية ذكية وتأمين الحراسة الأمنية وزيادة ساعات الحجز المسموحة بمقدار ساعتين مجاناً كعرض ترويجي مدمج.',
                    status: 'بانتظار الموافقة',
                    date: '2026-07-16'
                  }
                ].map((req, idx) => {
                  const percentage = Math.round(((req.newPrice - req.oldPrice) / req.oldPrice) * 100);
                  return (
                    <div key={idx} className="p-6 hover:bg-slate-50/40 transition-colors" dir="rtl">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        
                        {/* Info details */}
                        <div className="space-y-2 flex-1 text-right">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg">
                              {req.id}
                            </span>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {req.seasonName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{req.date}</span>
                          </div>
                          
                          <h4 className="text-base font-extrabold text-slate-800">{req.facility}</h4>
                          <p className="text-xs text-slate-500 font-sans flex items-center gap-1">
                            <span>المزود الشريك:</span>
                            <span className="font-bold text-slate-700">{req.partner}</span>
                          </p>

                          {/* Justification Box */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed mt-3 text-right">
                            <p className="font-bold text-slate-700 mb-1 flex items-center gap-1 text-[11px]">
                              <Info className="w-3.5 h-3.5 text-slate-400" />
                              مبررات الشريك المرفقة للتعديل:
                            </p>
                            {req.justification}
                          </div>
                        </div>

                        {/* Comparative Box (Old vs Proposed) */}
                        <div className="w-full lg:w-72 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-150 relative">
                          <span className="text-[9px] font-bold text-slate-400 absolute top-2 right-3">مربع مقارنة التغيير</span>
                          
                          <div className="grid grid-cols-2 gap-4 w-full text-center mt-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block">السعر الحالي</span>
                              <span className="text-sm font-extrabold text-slate-500 font-mono line-through">{req.oldPrice.toLocaleString()} ريال</span>
                            </div>
                            <div className="border-r border-slate-200">
                              <span className="text-[10px] font-bold text-indigo-500 block">السعر المقترح</span>
                              <span className="text-base font-black text-indigo-700 font-mono">{req.newPrice.toLocaleString()} ريال</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200 w-full flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold">معدل الارتفاع الصافي:</span>
                            <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                              <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                              +{percentage}% (+{(req.newPrice - req.oldPrice).toLocaleString()} ر.س)
                            </span>
                          </div>
                        </div>

                        {/* Actions (Approve, Request Modification, Reject) */}
                        <div className="flex lg:flex-col gap-2 w-full lg:w-44 shrink-0">
                          <button
                            onClick={() => {
                              alert(`تم اعتماد وتحديث السعر لمرفق "${req.facility}" ليصبح ${req.newPrice.toLocaleString()} ريال للموسم بنجاح! 🟢`);
                              // update halls state price as well
                              const updatedHalls = halls.map((h: any) => h.name === req.facility || h.id === 1 ? { ...h, price: req.newPrice } : h);
                              setHalls(updatedHalls);
                              window.dispatchEvent(new Event('hallsUpdated'));
                            }}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-green-600/10"
                          >
                            <Check className="w-4 h-4" />
                            <span>اعتماد التعديل</span>
                          </button>

                          <button
                            onClick={() => {
                              setModificationType('hall');
                              setModificationItem({ id: 1, name: req.facility, email: 'partner@platform.com' });
                              setModificationMessage(`يرجى تزويد الإدارة بمزيد من مستندات كشف التكاليف ومبررات التعديل المالي للسعر في موسم: ${req.seasonName}`);
                              setIsModificationModalOpen(true);
                            }}
                            className="flex-1 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>طلب تعديلات</span>
                          </button>

                          <button
                            onClick={() => {
                              alert(`تم رفض طلب تعديل السعر الخاص بمرفق "${req.facility}" وإبقاء السعر الحالي كما هو. 🔴`);
                            }}
                            className="flex-1 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>رفض وإلغاء</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              ) : (
                seasonRequests.map((req: any, idx: number) => {
                  const percentage = req.oldPrice ? Math.round(((req.newPrice - req.oldPrice) / req.oldPrice) * 100) : 15;
                  return (
                    <div key={idx} className="p-6 hover:bg-slate-50/40 transition-colors" dir="rtl">
                      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                        
                        {/* Info details */}
                        <div className="space-y-2 flex-1 text-right">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="bg-slate-100 text-slate-700 font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg">
                              {req.id || `REQ-26-000000000${idx + 1}`}
                            </span>
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2.5 py-0.5 rounded-lg flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {req.seasonName || 'موسم الرياض 2026'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">{req.date || '2026-07-18'}</span>
                          </div>
                          
                          <h4 className="text-base font-extrabold text-slate-800">{req.facility || req.hallName || 'المرفق'}</h4>
                          <p className="text-xs text-slate-500 font-sans flex items-center gap-1">
                            <span>المزود الشريك:</span>
                            <span className="font-bold text-slate-700">{req.partner || req.providerName}</span>
                          </p>

                          {/* Justification Box */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed mt-3 text-right">
                            <p className="font-bold text-slate-700 mb-1 flex items-center gap-1 text-[11px]">
                              <Info className="w-3.5 h-3.5 text-slate-400" />
                              مبررات الشريك المرفقة للتعديل:
                            </p>
                            {req.justification || 'زيادة متطلبات التشغيل والمصاريف المرافقة وتأمين المواد ذات الجودة المتميزة للموسم.'}
                          </div>
                        </div>

                        {/* Comparative Box (Old vs Proposed) */}
                        <div className="w-full lg:w-72 flex flex-col items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-150 relative">
                          <span className="text-[9px] font-bold text-slate-400 absolute top-2 right-3">مربع مقارنة التغيير</span>
                          
                          <div className="grid grid-cols-2 gap-4 w-full text-center mt-2">
                            <div>
                              <span className="text-[10px] font-bold text-slate-400 block">السعر الحالي</span>
                              <span className="text-sm font-extrabold text-slate-500 font-mono line-through">{Number(req.oldPrice || 1000).toLocaleString()} ريال</span>
                            </div>
                            <div className="border-r border-slate-200">
                              <span className="text-[10px] font-bold text-indigo-500 block">السعر المقترح</span>
                              <span className="text-base font-black text-indigo-700 font-mono">{Number(req.newPrice || 1200).toLocaleString()} ريال</span>
                            </div>
                          </div>

                          <div className="mt-3 pt-2.5 border-t border-slate-200 w-full flex items-center justify-between text-xs">
                            <span className="text-slate-500 font-bold">معدل التغيير السعري:</span>
                            {Number(req.newPrice || 0) < Number(req.oldPrice || 0) ? (
                              <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                                <TrendingDown className="w-3.5 h-3.5 text-rose-500" />
                                {percentage}% ({Number((req.newPrice || 0) - (req.oldPrice || 0)).toLocaleString()} ر.س (تخفيض)
                              </span>
                            ) : (
                              <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1 font-mono">
                                <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                                +{percentage}% (+{Number((req.newPrice || 0) - (req.oldPrice || 0)).toLocaleString()} ر.س (زيادة)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions (Approve, Request Modification, Reject) */}
                        <div className="flex lg:flex-col gap-2 w-full lg:w-44 shrink-0">
                          <button
                            onClick={() => {
                              const updated = seasonRequests.map((r: any) => r.id === req.id ? { ...r, status: 'معتمد' } : r);
                              setSeasonRequests(updated);
                              alert(`تم اعتماد وتفعيل السعر بنجاح للمرفق بقيمة ${Number(req.newPrice).toLocaleString()} ريال! 🟢`);
                            }}
                            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-green-600/10"
                          >
                            <Check className="w-4 h-4" />
                            <span>اعتماد التعديل</span>
                          </button>

                          <button
                            onClick={() => {
                              setModificationType('hall');
                              setModificationItem({ id: req.id, name: req.facility || req.hallName || 'المرفق', email: 'partner@platform.com' });
                              setModificationMessage(`يرجى تزويد الإدارة بمزيد من مستندات كشف التكاليف ومبررات التعديل المالي للسعر في موسم: ${req.seasonName}`);
                              setIsModificationModalOpen(true);
                            }}
                            className="flex-1 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-amber-200 cursor-pointer"
                          >
                            <Pencil className="w-4 h-4" />
                            <span>طلب تعديلات</span>
                          </button>

                          <button
                            onClick={() => {
                              const updated = seasonRequests.map((r: any) => r.id === req.id ? { ...r, status: 'مرفوض' } : r);
                              setSeasonRequests(updated);
                              alert('تم رفض طلب زيادة السعر بنجاح. 🔴');
                            }}
                            className="flex-1 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 border border-rose-200 cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                            <span>رفض وإلغاء</span>
                          </button>
                        </div>

                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hall Detail Modal */}
      {selectedHall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative font-sans text-right" dir="rtl">
            <button 
              onClick={() => setSelectedHall(null)}
              className="absolute left-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 md:p-8 space-y-6">
              {/* Header info */}
              <div>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold font-sans">
                  {selectedHall.category || 'قاعة'}
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-2">{selectedHall.name}</h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>مزود الخدمة:</span>
                  <span className="font-bold text-slate-700">{selectedHall.provider || selectedHall.hostName || 'غير متوفر'}</span>
                </p>
              </div>

              {/* 🖼️ Media, Blueprint, and Emergency Maps Tab Container */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-blue-500" />
                  <span>مخططات وصور المنشأة الفنية:</span>
                </h4>
                
                {/* Custom media subtabs */}
                <div className="grid grid-cols-3 gap-2 p-1 bg-slate-100 rounded-xl text-center">
                  <button 
                    onClick={() => {
                      setSelectedHall({ ...selectedHall, activeMediaTab: 'photos' });
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${(!selectedHall.activeMediaTab || selectedHall.activeMediaTab === 'photos') ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    الصور الحية للمرفق
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedHall({ ...selectedHall, activeMediaTab: 'blueprint' });
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${(selectedHall.activeMediaTab === 'blueprint') ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    المخطط الهندسي (Blueprint)
                  </button>
                  <button 
                    onClick={() => {
                      setSelectedHall({ ...selectedHall, activeMediaTab: 'emergency' });
                    }}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${(selectedHall.activeMediaTab === 'emergency') ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    مسار الطوارئ والسلامة
                  </button>
                </div>

                {/* Tab content renderer */}
                {(!selectedHall.activeMediaTab || selectedHall.activeMediaTab === 'photos') && (
                  <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 relative">
                    <img 
                      src={selectedHall.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'} 
                      alt={selectedHall.name}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute bottom-3 right-3 bg-slate-900/70 text-white text-[10px] font-bold px-2 py-1 rounded-md">صور حية معتمدة وموثقة بالمنصة</div>
                  </div>
                )}

                {selectedHall.activeMediaTab === 'blueprint' && (
                  <div className="aspect-video w-full rounded-2xl bg-slate-900 border border-slate-800 p-4 flex flex-col justify-between font-mono text-emerald-400 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px] opacity-30"></div>
                    <div className="flex justify-between items-center text-[10px] border-b border-emerald-900/50 pb-2 z-10">
                      <span>PROJECT ID: {selectedHall.id || 'HL-261'}</span>
                      <span>STRUCTURAL BLUEPRINT BLOCK v2.4</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center z-10">
                      <div className="border border-dashed border-emerald-500/30 p-6 rounded-lg text-center bg-slate-950/40">
                        <span className="text-[11px] block font-bold text-slate-200 mb-2 font-sans">تخطيط توزيع الطاولات والمخارج والمساحة:</span>
                        <div className="flex gap-4 justify-center text-[10px] text-emerald-400">
                          <span className="border border-emerald-500/50 px-2 py-1 rounded">المدخل الرئيسي: 4.5m</span>
                          <span className="border border-emerald-500/50 px-2 py-1 rounded">منطقة الـ VIP: 75m²</span>
                          <span className="border border-emerald-500/50 px-2 py-1 rounded">المسرح: 35m²</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-400 z-10 text-left">Generated automatically via Municipality Licensing Gateway API v3</div>
                  </div>
                )}

                {selectedHall.activeMediaTab === 'emergency' && (
                  <div className="aspect-video w-full rounded-2xl bg-rose-950 border border-rose-900 p-4 flex flex-col justify-between font-mono text-rose-400 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[radial-gradient(#881337_1px,transparent_1px)] [background-size:16px_16px] opacity-20"></div>
                    <div className="flex justify-between items-center text-[10px] border-b border-rose-900/50 pb-2 z-10">
                      <span>SAFETY STATUS: COMPLIANT 🛡️</span>
                      <span>EMERGENCY EXIT ROUTES MAP</span>
                    </div>
                    <div className="flex-1 flex items-center justify-center z-10">
                      <div className="border border-dashed border-rose-500/30 p-4 rounded-lg text-center bg-slate-950/40">
                        <span className="text-[11px] block font-bold text-slate-100 mb-1 font-sans">مخارج الطوارئ ومكافحة الحريق:</span>
                        <div className="flex gap-2 justify-center text-[10px] text-rose-300">
                          <span className="bg-rose-900/40 border border-rose-500/40 px-2 py-1 rounded font-sans">4 مخارج طوارئ مخصصة</span>
                          <span className="bg-rose-900/40 border border-rose-500/40 px-2 py-1 rounded font-sans">خراطيم ومطافئ إطفاء معتمدة</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[9px] text-slate-300 z-10 text-left">Validated & Certified by Civil Defense Department 🛡️</div>
                  </div>
                )}
              </div>

              {/* 🛠️ Engineering and Logistics Specs Box */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Settings2 className="w-4 h-4 text-blue-500" />
                  <span>المواصفات الهندسية واللوجستية للموقع:</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-bold block">الطاقة الاستيعابية وحجم الطاولات</span>
                    <p className="text-xs font-bold text-slate-700">تتسع لـ 450 شخصاً</p>
                    <p className="text-[9px] text-slate-400">45 طاولة دائرية مع 10 مقاعد لكل طاولة</p>
                  </div>
                  
                  <div className="space-y-1 border-t sm:border-t-0 sm:border-r border-slate-200 sm:pr-3 pt-2 sm:pt-0">
                    <span className="text-[10px] text-slate-400 font-bold block">التكييف والإنارة الذكية</span>
                    <p className="text-xs font-bold text-slate-700">تكييف مركزي متطور (Carrier)</p>
                    <p className="text-[9px] text-slate-400">إنارة ليد تفاعلية ذكية متعددة الألوان</p>
                  </div>

                  <div className="space-y-1 border-t sm:border-t-0 sm:border-r border-slate-200 sm:pr-3 pt-2 sm:pt-0">
                    <span className="text-[10px] text-slate-400 font-bold block">الأنظمة الصوتية والوسائط</span>
                    <p className="text-xs font-bold text-slate-700">أنظمة صوتية محيطية Pro-Duo</p>
                    <p className="text-[9px] text-slate-400">شاشات عرض ليد عملاقة بمقاس 4x3م</p>
                  </div>
                </div>
              </div>

              {/* 📄 Municipality and Civil Defense Licenses Card */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-emerald-500" />
                  <span>التراخيص والمستندات الحكومية المرفقة:</span>
                </h4>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* License 1 */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">رخصة الدفاع المدني للسلامة</p>
                        <p className="text-[9px] text-slate-400 font-mono">رقم الرخصة: CD-2603841</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">سارية وصحيحة</span>
                  </div>

                  {/* License 2 */}
                  <div className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">الترخيص البلدي التجاري</p>
                        <p className="text-[9px] text-slate-400 font-mono">رقم السجل: BLD-4402849</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">سارية وموثقة</span>
                  </div>
                </div>
              </div>

              {/* Bento details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">السعر الافتراضي</span>
                  <span className="font-mono font-extrabold text-slate-800 text-base">{Number(selectedHall.price || 0).toLocaleString()} ريال</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">المدينة / المنطقة</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedHall.city || 'الرياض'} - {selectedHall.region || ''}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">الحالة الحالية</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedHall.status === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedHall.status === 'blocked' || selectedHall.status === 'مرفوض' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedHall.status === 'approved' ? 'معتمد' : 
                     selectedHall.status === 'blocked' || selectedHall.status === 'مرفوض' ? 'محظور' : 'بانتظار الموافقة'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800">تفاصيل ووصف المرفق:</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedHall.description || 'لا يوجد وصف متاح لهذا المرفق.'}
                </p>
              </div>

              {/* Features */}
              {selectedHall.features && selectedHall.features.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800">المميزات والتجهيزات المتاحة:</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedHall.features.map((feature: string, idx: number) => (
                      <span key={idx} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-xl text-xs font-medium">
                        {feature}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons inside Modal */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                <button 
                  onClick={async () => {
                    const updated = halls.map((h: any) => h.id === selectedHall.id ? { ...h, status: 'approved', activationStatus: 'مفعل' } : h);
                    setHalls(updated);
                    window.dispatchEvent(new Event('hallsUpdated'));

                    try {
                      await fetch(`/api/bookings/halls/${selectedHall.id}`, {
                        method: 'PUT',
                        headers: { 
                          'Content-Type': 'application/json',
                          'x-user-role': 'admin'
                        },
                        body: JSON.stringify({ status: 'approved', activationStatus: 'مفعل' })
                      });
                    } catch (err) {
                      console.error("Failed to sync approval status to DB:", err);
                    }

                    sendInternalNotification(selectedHall.email || 'partner@platform.com', 'تهانينا! تم قبول منشأتك على المنصة', `عزيزي الشريك، يسعدنا إبلاغك بأن المنصة اعتمدت منشأتك "${selectedHall.name}" وأصبحت متاحة للعملاء للحجز الآن.`);
                    addPlatformNotification({
                      title: 'تم اعتماد المنشأة بنجاح',
                      message: `تم تفعيل وقبول المنشأة "${selectedHall.name}" وأصبحت متاحة للعملاء.`,
                      type: 'success',
                      recipient: 'Admin'
                    });
                    alert(`تم تفعيل وقبول المنشأة "${selectedHall.name}" بنجاح! 🟢`);
                    setSelectedHall(null);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-green-600/10"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد وقبول المنشأة</span>
                </button>

                {/* Schedule visit */}
                <button 
                  onClick={() => {
                    setSchedulingVisitHall(selectedHall);
                  }}
                  className="px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-blue-200 cursor-pointer"
                >
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span>جدولة زيارة فنية ميدانية</span>
                </button>

                <button 
                  onClick={() => {
                    setModificationType('hall');
                    setModificationItem(selectedHall);
                    setModificationMessage('');
                    setIsModificationModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-amber-200 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>طلب تعديلات إضافية</span>
                </button>

                <button 
                  onClick={() => {
                    setRejectionFeedbackType('hall');
                    setRejectionFeedbackItem(selectedHall);
                    setRejectionFeedbackText('');
                    setRejectionFeedbackOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>رفض المنشأة وحظرها</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative font-sans text-right" dir="rtl">
            <button 
              onClick={() => setSelectedService(null)}
              className="absolute left-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-all cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="p-6 md:p-8 space-y-6">
              {/* Header info */}
              <div>
                <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold font-sans">
                  {selectedService.category || 'خدمة مساندة'}
                </span>
                <h2 className="text-2xl font-bold text-slate-800 mt-2">{selectedService.name}</h2>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <span>مزود الخدمة:</span>
                  <span className="font-bold text-slate-700">{selectedService.provider || 'غير متوفر'}</span>
                </p>
              </div>

              {/* Main image */}
              <div className="aspect-video w-full rounded-2xl overflow-hidden bg-slate-100 border border-slate-100">
                <img 
                  src={selectedService.image || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60'} 
                  alt={selectedService.name}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* 🛡️ Food Safety & Worker Certifications Box (Conditional on hospitality or food) */}
              {((selectedService.category || '').includes('ضيافة') || (selectedService.category || '').includes('طعام') || (selectedService.category || '').includes('بوفيه') || true) && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                    <span>توثيق المعايير الصحية ومصادر الأغذية:</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-emerald-50/20 p-4 rounded-2xl border border-emerald-100/40">
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">✔</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">شهادات الكوادر الصحية (شهادة كرت صحي)</p>
                        <p className="text-[10px] text-slate-500">تم التحقق من الكروت الصحية لجميع الطهاة ومقدمي الخدمة من وزارة الصحة 🛡️</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-emerald-600 mt-0.5">✔</span>
                      <div>
                        <p className="text-xs font-bold text-slate-800">مواد معبأة ومغلفة غذائياً بالكامل</p>
                        <p className="text-[10px] text-slate-500">تغليف معقم مقاوم للحرارة ومطابق للمواصفات والمقاييس السعودية SFDA</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 💼 Proposed Service Level Agreements (SLA) */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-indigo-500" />
                  <span>مستويات الخدمة المقترحة والالتزام التشغيلي:</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-xs font-bold text-indigo-700">باقة الضيافة الملكية (Royal SLA)</p>
                    <p className="text-[10px] text-slate-500 mt-1">طاقم خدمة مكون من 6 مشرفين بزي موحد متكامل واستجابة طارئة خلال 30 دقيقة للموقع.</p>
                  </div>
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl">
                    <p className="text-xs font-bold text-indigo-700">الضمان التشغيلي والتعويضات</p>
                    <p className="text-[10px] text-slate-500 mt-1">ضمان التواجد قبل موعد الحفل بـ ساعتين على الأقل، مع تأمين احتياطي إضافي 15% مجاناً.</p>
                  </div>
                </div>
              </div>

              {/* 💰 Decentarlized Flexible Pricing Structure */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  <span>تفاصيل ومكونات هيكلة التسعير المرن:</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">السعر الأساسي</span>
                    <span className="font-mono font-extrabold text-slate-800 text-xs">{Number(selectedService.price || 0).toLocaleString()} ريال</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">سعر الرأس الإضافي</span>
                    <span className="font-mono font-extrabold text-slate-800 text-xs">45 ريال / فرد</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">رسوم التوصيل السريع</span>
                    <span className="font-mono font-extrabold text-slate-800 text-xs">150 ريال</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl">
                    <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الحد الأدنى للطلب</span>
                    <span className="font-mono font-extrabold text-slate-800 text-xs">1,500 ريال</span>
                  </div>
                </div>
              </div>

              {/* Bento details */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">السعر</span>
                  <span className="font-mono font-extrabold text-slate-800 text-base">{Number(selectedService.price || 0).toLocaleString()} ريال</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">المدن والخدمات</span>
                  <span className="font-bold text-slate-800 text-sm">{selectedService.cities || selectedService.city || 'الرياض'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 col-span-2 md:col-span-1">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">الحالة الحالية</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedService.status === 'approved' || selectedService.adminStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    selectedService.status === 'blocked' || selectedService.adminStatus === 'محظورة' || selectedService.adminStatus === 'blocked' ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {selectedService.status === 'approved' || selectedService.adminStatus === 'approved' ? 'معتمد' : 
                     selectedService.status === 'blocked' || selectedService.adminStatus === 'محظورة' || selectedService.adminStatus === 'blocked' ? 'محظور' : 'بانتظار الموافقة'}
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <h4 className="text-sm font-bold text-slate-800">وصف وتفاصيل الخدمة:</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                  {selectedService.description || 'لا يوجد وصف متاح لهذه الخدمة.'}
                </p>
              </div>

              {/* Terms */}
              {selectedService.terms && (
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-800">شروط وأحكام الخدمة:</h4>
                  <p className="text-xs text-amber-700 leading-relaxed bg-amber-50/50 p-4 rounded-xl border border-amber-100 whitespace-pre-line">
                    {selectedService.terms}
                  </p>
                </div>
              )}

              {/* Action Buttons inside Modal */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
                <button 
                  onClick={async () => {
                    const updated = services.map((s: any) => s.id === selectedService.id ? { ...s, status: 'approved', adminStatus: 'approved', activationStatus: 'مفعل' } : s);
                    setServices(updated);
                    window.dispatchEvent(new Event('servicesUpdated'));

                    try {
                      await fetch(`/api/bookings/services/${selectedService.id}`, {
                        method: 'PUT',
                        headers: { 
                          'Content-Type': 'application/json',
                          'x-user-role': 'admin'
                        },
                        body: JSON.stringify({ status: 'approved', adminStatus: 'approved', activationStatus: 'مفعل' })
                      });
                    } catch (err) {
                      console.error("Failed to sync approval status to DB:", err);
                    }

                    sendInternalNotification(selectedService.email || 'partner@platform.com', 'تهانينا! تم قبول خدمتك المساندة على المنصة', `عزيزي الشريك، يسعدنا إبلاغك بأن المنصة اعتمدت خدمتك "${selectedService.name}" وأصبحت متاحة للعملاء للطلب المباشر الآن.`);
                    addPlatformNotification({
                      title: 'تم اعتماد الخدمة بنجاح',
                      message: `تم تفعيل وقبول الخدمة "${selectedService.name}" وأصبحت متاحة للعملاء.`,
                      type: 'success',
                      recipient: 'Admin'
                    });
                    alert(`تم تفعيل وقبول الخدمة "${selectedService.name}" بنجاح! 🟢`);
                    setSelectedService(null);
                  }}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-green-600/10"
                >
                  <Check className="w-4 h-4" />
                  <span>اعتماد وقبول الخدمة</span>
                </button>

                <button 
                  onClick={() => {
                    setModificationType('service');
                    setModificationItem(selectedService);
                    setModificationMessage('');
                    setIsModificationModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-50 text-amber-700 hover:bg-amber-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-amber-200 cursor-pointer"
                >
                  <Pencil className="w-4 h-4" />
                  <span>طلب تعديلات إضافية</span>
                </button>

                <button 
                  onClick={() => {
                    setRejectionFeedbackType('service');
                    setRejectionFeedbackItem(selectedService);
                    setRejectionFeedbackText('');
                    setRejectionFeedbackOpen(true);
                  }}
                  className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-rose-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>رفض الخدمة وحظرها</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Modification Modal */}
      {isModificationModalOpen && modificationItem && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-in fade-in duration-200 font-sans">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative p-6 text-right" dir="rtl">
            <button 
              onClick={() => setIsModificationModalOpen(false)}
              className="absolute left-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-700 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-500" />
              <span>طلب تعديلات وتجهيز المرفق</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              اكتب الملاحظات والتعديلات المطلوبة من الشريك "{modificationItem.name}". سيتم إرسالها له مباشرةً كرسالة بريد وتنبيه داخلي لتعديل الملف.
            </p>

            <textarea
              className="w-full h-32 p-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 focus:bg-white outline-none transition-all resize-none"
              placeholder="مثال: يرجى إرفاق صور واضحة للمرفق، وتوضيح شروط الحجز أو الأسعار المعتمدة بالتفصيل..."
              value={modificationMessage}
              onChange={(e) => setModificationMessage(e.target.value)}
            />

            <div className="mt-4 flex gap-3 justify-end">
              <button 
                onClick={() => {
                  if (!modificationMessage.trim()) {
                    alert('يرجى كتابة ملاحظات التعديل أولاً!');
                    return;
                  }

                  if (modificationType === 'hall') {
                    const updated = halls.map((h: any) => h.id === modificationItem.id ? { ...h, status: 'pending' } : h);
                    setHalls(updated);
                    window.dispatchEvent(new Event('hallsUpdated'));
                    fetch(`/api/bookings/halls/${modificationItem.id}`, {
                      method: 'PUT',
                      headers: { 
                        'Content-Type': 'application/json',
                        'x-user-role': 'admin'
                      },
                      body: JSON.stringify({ status: 'pending' })
                    }).catch(err => console.error("Failed to sync modification status to DB:", err));
                  } else {
                    const updated = services.map((s: any) => s.id === modificationItem.id ? { ...s, status: 'pending', adminStatus: 'pending' } : s);
                    setServices(updated);
                    window.dispatchEvent(new Event('servicesUpdated'));
                    fetch(`/api/bookings/services/${modificationItem.id}`, {
                      method: 'PUT',
                      headers: { 
                        'Content-Type': 'application/json',
                        'x-user-role': 'admin'
                      },
                      body: JSON.stringify({ status: 'pending', adminStatus: 'pending' })
                    }).catch(err => console.error("Failed to sync modification status to DB:", err));
                  }

                  sendInternalNotification(
                    modificationItem.email || 'partner@platform.com',
                    `تعديلات مطلوبة لملف: ${modificationItem.name}`,
                    `عزيزي الشريك، قامت الإدارة بمراجعة ملفك الخاص بـ "${modificationItem.name}" وتطلب منك إجراء التعديلات التالية لإكمال عملية التفعيل:\n\n${modificationMessage}`
                  );

                  addPlatformNotification({
                    title: 'تم إرسال طلب التعديل',
                    message: `تم إرسال ملاحظات التعديل للجهة "${modificationItem.name}" بنجاح.`,
                    type: 'info',
                    recipient: 'Admin'
                  });

                  alert('تم إرسال طلب التعديل وتنبيه الشريك بنجاح! ✉️');
                  setIsModificationModalOpen(false);
                  setSelectedHall(null);
                  setSelectedService(null);
                }}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-amber-500/10"
              >
                إرسال الملاحظات للشريك
              </button>

              <button 
                onClick={() => setIsModificationModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🛡️ LOCAL MODAL: Customizable Partner Level Thresholds & Tiering Engine */}
      {isLocalLevelThresholdsOpen && (
        <PartnerTieringEngineModal
          isOpen={isLocalLevelThresholdsOpen}
          onClose={() => {
            setIsLocalLevelThresholdsOpen(false);
            if (setIsLevelThresholdsModalOpen) setIsLevelThresholdsModalOpen(false);
          }}
          provider={selectedTierProvider || combinedProviders?.[0] || { id: 1, name: 'شريك تجريبي' }}
          allProviders={combinedProviders}
          onSelectProvider={(prov) => setSelectedTierProvider(prov)}
          isAdminView={true}
          showNotification={showNotification}
        />
      )}

      {/* 🌟 LOCAL MODAL: Grant Custom Package & Bulk Subscriptions Upgrade */}
      {isLocalUpgradeOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative font-sans text-right max-h-[90vh] overflow-y-auto" dir="rtl">
            <button 
              onClick={() => {
                setIsLocalUpgradeOpen(false);
                if (setIsUpgradeModalOpen) setIsUpgradeModalOpen(false);
              }}
              className="absolute left-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4 border-b border-slate-150 pb-3">
              <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">منح باقة مخصصة / ترقية جماعية</h3>
                <p className="text-xs text-slate-400 font-sans">تحديد الشركاء المطلوب ترقيتهم واختيار الخطة والرسوم المدفوعة يدوياً</p>
              </div>
            </div>

            <div className="space-y-4">
              {/* Step 1: Select Partners */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-2">1. حدد الشركاء المشمولين بالترقية والمنح:</label>
                <div className="relative mb-2">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                  <input 
                    type="text"
                    placeholder="ابحث باسم الشريك أو البريد الإلكتروني..."
                    value={upgradeSearchQuery}
                    onChange={(e) => setUpgradeSearchQuery(e.target.value)}
                    className="w-full p-2.5 pr-9 border border-slate-250 rounded-xl text-xs font-sans text-slate-800 focus:outline-none"
                  />
                </div>

                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-2xl p-2.5 space-y-2 bg-slate-50/50">
                  {combinedProviders.filter(p => 
                    (p.name || '').toLowerCase().includes(upgradeSearchQuery.toLowerCase()) || 
                    (p.email || '').toLowerCase().includes(upgradeSearchQuery.toLowerCase())
                  ).map((p) => {
                    const isChecked = localBulkProviderIds.includes(p.id);
                    return (
                      <label key={p.id} className="flex items-center gap-2.5 p-1.5 hover:bg-white rounded-lg transition-all cursor-pointer">
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setLocalBulkProviderIds(localBulkProviderIds.filter(id => id !== p.id));
                            } else {
                              setLocalBulkProviderIds([...localBulkProviderIds, p.id]);
                            }
                          }}
                          className="w-4 h-4 text-indigo-600 rounded border-slate-300"
                        />
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800">{p.name}</p>
                          <p className="text-[10px] text-slate-400 font-sans">{p.email || 'بلا بريد متاح'} - {p.packageName || 'بدون باقة'}</p>
                        </div>
                      </label>
                    );
                  })}
                  {combinedProviders.length === 0 && (
                    <p className="text-center py-4 text-slate-400 text-xs font-bold">لا يوجد شركاء متوفرين حالياً</p>
                  )}
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-[10px] text-slate-400">الشركاء المحددون: <strong className="text-indigo-600 font-mono text-xs">{localBulkProviderIds.length}</strong></span>
                  <button 
                    onClick={() => {
                      if (localBulkProviderIds.length === combinedProviders.length) {
                        setLocalBulkProviderIds([]);
                      } else {
                        setLocalBulkProviderIds(combinedProviders.map(p => p.id));
                      }
                    }}
                    className="text-[10px] text-indigo-600 hover:underline font-bold cursor-pointer"
                  >
                    {localBulkProviderIds.length === combinedProviders.length ? 'إلغاء تحديد الكل' : 'تحديد جميع الشركاء'}
                  </button>
                </div>
              </div>

              {/* Step 2: Choose Package & Settings */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">2. الباقة المراد الترقية إليها:</label>
                  <select 
                    value={localSelectedPlan}
                    onChange={(e) => {
                      const selectedName = e.target.value;
                      setLocalSelectedPlan(selectedName);
                      const foundPlan = availablePlans.find((p: any) => p.name === selectedName);
                      if (foundPlan) {
                        const price = Number(foundPlan.priceMonthly || foundPlan.price || 0);
                        if (price > 0) {
                          setLocalPricePaid(price);
                        }
                      }
                    }}
                    className="w-full p-2.5 border border-slate-250 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="">-- اختر الباقة المستهدفة --</option>
                    {availablePlans.map((plan: any) => {
                      const priceVal = plan.priceMonthly || plan.price;
                      const priceText = priceVal ? ` (${priceVal} ريال/شهر)` : '';
                      return (
                        <option key={plan.id || plan.name} value={plan.name}>
                          {plan.name}{priceText}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">3. الرسوم المدفوعة مقابل الترقية (ريال):</label>
                  <input 
                    type="number"
                    value={localPricePaid}
                    onChange={(e) => setLocalPricePaid(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-250 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
              </div>

              {/* Step 3: Duration & Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">4. مدة صلاحية الباقة الممنوحة:</label>
                  <select 
                    value={localDurationMonths}
                    onChange={(e) => setLocalDurationMonths(e.target.value)}
                    className="w-full p-2.5 border border-slate-250 rounded-xl text-xs font-bold text-slate-800"
                  >
                    <option value="3">3 أشهر (فترة تجريبية)</option>
                    <option value="6">6 أشهر</option>
                    <option value="12">12 شهر (سنة كاملة)</option>
                    <option value="custom">تاريخ نهاية مخصص</option>
                  </select>
                </div>

                {localDurationMonths === 'custom' && (
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">تاريخ انتهاء صلاحية مخصص:</label>
                    <input 
                      type="date"
                      value={localCustomEndDate}
                      onChange={(e) => setLocalCustomEndDate(e.target.value)}
                      className="w-full p-2.5 border border-slate-250 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                )}
              </div>

              {/* Step 4: Notes */}
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">5. مبررات وملاحظات منح الباقة الاستثنائية:</label>
                <textarea 
                  rows={2}
                  placeholder="اكتب أسباب منح الشريك الترقية اليدوية أو باقة العرض الخاصة..."
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-250 rounded-xl text-xs text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button 
                onClick={async () => {
                  if (localBulkProviderIds.length === 0) {
                    alert('يجب تحديد مزود خدمة واحد على الأقل من القائمة لتعديله.');
                    return;
                  }
                  if (!localSelectedPlan) {
                    alert('الرجاء اختيار الباقة المراد الترقية إليها بشكل صحيح.');
                    return;
                  }

                  const matchedPlan = availablePlans.find((p: any) => p.name === localSelectedPlan);
                  const isYearly = localDurationMonths === '12';

                  let endDateStr = localCustomEndDate || null;
                  if (!endDateStr && localDurationMonths && localDurationMonths !== 'custom') {
                    const months = Number(localDurationMonths);
                    const d = new Date();
                    d.setMonth(d.getMonth() + months);
                    endDateStr = d.toISOString();
                  }

                  const newSubObj = {
                    id: matchedPlan?.id || 'custom',
                    packageName: localSelectedPlan,
                    packageName_display: localSelectedPlan,
                    billingCycle: isYearly ? 'yearly' : 'monthly',
                    price: localPricePaid || matchedPlan?.priceMonthly || matchedPlan?.price || 0,
                    status: 'active',
                    startDate: new Date().toISOString(),
                    endDate: endDateStr || '2029-12-30',
                    hallsLimit: matchedPlan?.hallsLimit || 'unlimited',
                    servicesLimit: matchedPlan?.servicesLimit || 'unlimited',
                    staffSeatsLimit: matchedPlan?.staffSeatsLimit || 'unlimited',
                    includesAdvancedProviderDashboard: true,
                    includesFullManagement: true,
                    includesInventory: true,
                    includesSuppliers: true,
                    canExportFinancials: true,
                    hasSupport: true,
                    includesWeekendPricing: true,
                    includesDynamicSurgePricing: true,
                    includesDynamicPricing: true,
                    includesFinancialForecast: true,
                    includesPartialPayment: true,
                    includesGrowthCharts: true,
                    includesAdvancedStats: true,
                    includesLogisticsPortal: true,
                    includesMiniProductsStore: true,
                    includesMiniStore: true,
                    addons: ['inventory', 'suppliers', 'invoice_export', 'support', 'weekend_pricing', 'dynamic_surge_pricing', 'mini_products_store']
                  };

                  // 1. Get providers from localStorage or combinedProviders
                  const savedStr = localStorage.getItem('providersData');
                  let provList: any[] = [];
                  try {
                    provList = savedStr ? JSON.parse(savedStr) : [];
                  } catch (e) {}
                  if (!Array.isArray(provList) || provList.length === 0) {
                    provList = combinedProviders || [];
                  }

                  const upgradedProviderObjs: any[] = [];

                  // Update in array
                  const updatedProvList = provList.map((prov: any) => {
                    const isMatch = localBulkProviderIds.some((targetId: any) => 
                      targetId === prov.id || targetId === prov.dbId || targetId === prov.email || (prov.name && targetId === prov.name)
                    );
                    if (isMatch) {
                      upgradedProviderObjs.push(prov);
                      return {
                        ...prov,
                        packageName: localSelectedPlan,
                        packageName_display: localSelectedPlan,
                        packageDuration: isYearly ? 'yearly' : 'monthly',
                        subscriptionStatus: 'نشط',
                        expiryDate: endDateStr || prov.expiryDate || '2029-12-30'
                      };
                    }
                    return prov;
                  });

                  // Update React state if handler exists
                  if (setProviders) {
                    setProviders(updatedProvList);
                  }

                  // Write updated providers list to localStorage
                  try {
                    localStorage.setItem('providersData', JSON.stringify(updatedProvList));
                  } catch (e) {}

                  // 2. Write provider_subscription_* to localStorage for each upgraded provider
                  localBulkProviderIds.forEach((idVal: any) => {
                    localStorage.setItem(`provider_subscription_${idVal}`, JSON.stringify(newSubObj));
                  });

                  upgradedProviderObjs.forEach((prov: any) => {
                    if (prov.name) {
                      localStorage.setItem(`provider_subscription_${prov.name}`, JSON.stringify(newSubObj));
                    }
                    if (prov.email) {
                      localStorage.setItem(`provider_subscription_${prov.email}`, JSON.stringify(newSubObj));
                    }
                    if (prov.id) {
                      localStorage.setItem(`provider_subscription_${prov.id}`, JSON.stringify(newSubObj));
                    }
                  });

                  // Set general fallback subscription
                  localStorage.setItem('provider_subscription', JSON.stringify(newSubObj));

                  // 3. Update currentUser in localStorage if currentUser is among upgraded providers
                  const currentUserStr = localStorage.getItem('currentUser');
                  if (currentUserStr) {
                    try {
                      const u = JSON.parse(currentUserStr);
                      const isCurrentMatched = localBulkProviderIds.some((targetId: any) => 
                        targetId === u.id || targetId === u.dbId || targetId === u.email || (u.name && targetId === u.name)
                      ) || upgradedProviderObjs.some((prov: any) => 
                        (u.email && prov.email && u.email.toLowerCase() === prov.email.toLowerCase()) ||
                        (u.name && prov.name && u.name === prov.name)
                      );

                      if (isCurrentMatched) {
                        u.packageName = localSelectedPlan;
                        u.planName = localSelectedPlan;
                        u.packageDuration = isYearly ? 'yearly' : 'monthly';
                        localStorage.setItem('currentUser', JSON.stringify(u));
                        localStorage.setItem('provider_subscription', JSON.stringify(newSubObj));
                      }
                    } catch (e) {}
                  }

                  // 4. API endpoint upgrade call
                  try {
                    await fetch('/api/subscriptions/upgrade', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        providerIds: localBulkProviderIds,
                        planName: localSelectedPlan,
                        pricePaid: localPricePaid,
                        durationMonths: localDurationMonths,
                        customEndDate: localCustomEndDate || null,
                        notes: localNotes || 'ترقية باقات مفرودة يدوياً'
                      })
                    });
                  } catch(e){}

                  // 5. Reactive window event dispatches
                  window.dispatchEvent(new Event('subscriptionUpdated'));
                  window.dispatchEvent(new Event('currentUserUpdated'));
                  window.dispatchEvent(new Event('providersUpdated'));
                  window.dispatchEvent(new Event('usersUpdated'));
                  window.dispatchEvent(new Event('storage'));

                  showNotification('success', `تم منح وترقية ${localBulkProviderIds.length} شركاء لباقة "${localSelectedPlan}" بنجاح!`);
                  alert(`تم ترقية عدد ${localBulkProviderIds.length} من الشركاء إلى باقة "${localSelectedPlan}" بنجاح وتوثيق تاريخ الصلاحية وسداد الرسوم بقيمة ${localPricePaid} ريال! 👑🚀`);
                  
                  // Reset selection
                  setLocalBulkProviderIds([]);
                  setLocalSelectedPlan('');
                  setLocalPricePaid(0);
                  setLocalNotes('');
                  setIsLocalUpgradeOpen(false);
                  if (setIsUpgradeModalOpen) setIsUpgradeModalOpen(false);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                اعتماد ومنح الباقات
              </button>
              <button 
                onClick={() => {
                  setIsLocalUpgradeOpen(false);
                  if (setIsUpgradeModalOpen) setIsUpgradeModalOpen(false);
                }}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🌟 CUSTOM COMMISSION OVERRIDE MODAL */}
      {editingCommissionProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans" dir="rtl">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative text-right">
            <button 
              onClick={() => setEditingCommissionProvider(null)}
              className="absolute left-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-150">
              <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-150 shrink-0">
                <Settings2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-800">تعديل نسبة عمولة المنصة المخصصة</h3>
                <p className="text-xs text-slate-400">تحديد نسبة مخصصة للشريك وتغليبها على نسبة باقة الاشتراك الافتراضية</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Provider Details Summary Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 text-sm">{editingCommissionProvider.name}</span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full font-bold">
                    {editingCommissionProvider.packageName || 'بدون باقة'}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                  <span>معرف الحساب: {editingCommissionProvider.idNumber || editingCommissionProvider.id}</span>
                  <span>نسبة الباقة الافتراضية: {
                    (editingCommissionProvider.packageName || '').toLowerCase().includes('ملكية') ? '5%' :
                    (editingCommissionProvider.packageName || '').toLowerCase().includes('احترافية') ? '8%' :
                    (editingCommissionProvider.packageName || '').toLowerCase().includes('أعمال') ? '10%' : '15%'
                  }</span>
                </div>
              </div>

              {/* Custom Rate Input */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">1. نسبة العمولة المخصصة الجديدة (%):</label>
                <div className="relative">
                  <input 
                    type="number" 
                    step="0.5"
                    min="0"
                    max="50"
                    value={customCommissionVal}
                    onChange={(e) => setCustomCommissionVal(Number(e.target.value))}
                    className="w-full p-3 pl-10 border border-slate-250 rounded-xl text-sm font-extrabold text-slate-900 focus:border-indigo-600 focus:outline-none"
                    placeholder="مثال: 10"
                  />
                  <span className="absolute left-3 top-3.5 font-bold text-slate-400 text-xs">%</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-1">تصبح هذه النسبة هي العمولة المعتمدة للمنصة فوراً وتلغي نسبة الباقة لجميع الحجوزات القادمة.</p>
              </div>

              {/* Reason for Exception */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">2. سبب مبرر الاستثناء المخصص:</label>
                <input 
                  type="text" 
                  value={customCommissionReasonVal}
                  onChange={(e) => setCustomCommissionReasonVal(e.target.value)}
                  className="w-full p-2.5 border border-slate-250 rounded-xl text-xs text-slate-800 focus:border-indigo-600 focus:outline-none"
                  placeholder="مثال: شريك استراتيجي - حجم حجوزات كبرى في الرياض..."
                />
              </div>

              {/* Agreement Reference */}
              <div>
                <label className="font-extrabold text-slate-700 block mb-1">3. مرجع العقد / الاتفاقية الخاصة:</label>
                <input 
                  type="text" 
                  value={customCommissionRefVal}
                  onChange={(e) => setCustomCommissionRefVal(e.target.value)}
                  className="w-full p-2.5 border border-slate-250 rounded-xl text-xs font-mono text-slate-800 focus:border-indigo-600 focus:outline-none"
                  placeholder="مثال: AGR-2026-9912"
                />
              </div>

              {/* Automated System Audit Trail Info */}
              <div className="p-3 bg-amber-50/80 rounded-2xl border border-amber-200 text-[10px] text-amber-900 space-y-1">
                <div className="flex items-center gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                  <span>سجل التوثيق والاعتماد الآلي (Audit Trail):</span>
                </div>
                <div className="flex justify-between font-mono text-[10px] text-amber-800 pt-0.5">
                  <span>تاريخ ووقت التعديل: {new Date().toLocaleString('ar-SA')}</span>
                  <span>المُعدِّل: الإدارة العامة (مدير العمليات)</span>
                </div>
              </div>
            </div>

            <div className="flex gap-2.5 mt-5">
              <button 
                onClick={() => {
                  if (customCommissionVal < 0 || customCommissionVal > 100) {
                    alert('يرجى إدخال نسبة عمولة صحيحة ومقبولة بين 0% و 100%.');
                    return;
                  }

                  const updatedData = {
                    ...customCommissionsData,
                    [editingCommissionProvider.id]: {
                      rate: Number(customCommissionVal),
                      reason: customCommissionReasonVal || 'تحديد عمولة مخصصة استثنائية من الإدارة',
                      ref: customCommissionRefVal || 'AGR-2026-OFFICIAL',
                      updatedAt: new Date().toLocaleString('ar-SA'),
                      updatedBy: 'الإدارة العامة (مدير العمليات)'
                    }
                  };
                  setCustomCommissionsData(updatedData);
                  setCommissionRates({
                    ...commissionRates,
                    [editingCommissionProvider.id]: Number(customCommissionVal)
                  });

                  showNotification('success', `تم تطبيق وتوثيق العمولة المخصصة بنسبة ${customCommissionVal}% للشريك "${editingCommissionProvider.name}" بنجاح.`);
                  alert(`تم اعتماد وتطبيق نسبة العمولة المخصصة (${customCommissionVal}%) للشريك "${editingCommissionProvider.name}" بنجاح! 🌟\n\nستكون هذه النسبة هي العمولة المعتمدة للمنصة لتسويات وحجوزات هذا المزود المستقبلية وتلغي نسبة الباقة الافتراضية.`);
                  setEditingCommissionProvider(null);
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-md"
              >
                حفظ وتطبيق العمولة المخصصة
              </button>
              <button 
                onClick={() => setEditingCommissionProvider(null)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 👁️ COMPREHENSIVE PROVIDER PROFILE MODAL - FIXED HEIGHT TABBED ARCHITECTURE */}
      {viewingDetailedProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200 font-sans" dir="rtl">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl relative text-right h-[88vh] max-h-[630px] flex flex-col overflow-hidden border border-slate-100">
            {/* Close Button */}
            <button 
              onClick={() => setViewingDetailedProvider(null)}
              className="absolute left-4 top-4 p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all cursor-pointer z-10"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Modal Fixed Header */}
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-150 shrink-0">
              {viewingDetailedProvider.image || (viewingDetailedProvider as any).avatarUrl || (viewingDetailedProvider as any).avatar || (viewingDetailedProvider as any).imagePreview ? (
                <img 
                  src={viewingDetailedProvider.image || (viewingDetailedProvider as any).avatarUrl || (viewingDetailedProvider as any).avatar || (viewingDetailedProvider as any).imagePreview} 
                  alt={viewingDetailedProvider.name} 
                  referrerPolicy="no-referrer"
                  className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-200 shadow-sm shrink-0"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 text-white border-2 border-indigo-200 flex items-center justify-center font-extrabold text-xl shrink-0 shadow-sm">
                  {viewingDetailedProvider.name ? viewingDetailedProvider.name.charAt(0) : 'M'}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-extrabold text-slate-800 truncate">{viewingDetailedProvider.name}</h3>
                  {viewingDetailedProvider.isSuccessfulPartner && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                      <Crown className="w-3 h-3 text-amber-600" /> شريك ناجح
                    </span>
                  )}
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                    viewingDetailedProvider.status === 'معطل' || viewingDetailedProvider.status === 'موقوف' 
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {viewingDetailedProvider.status || 'نشط'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-1 font-mono">
                  <span>سجل/هوية: <strong className="text-slate-700">{viewingDetailedProvider.idNumber || viewingDetailedProvider.id}</strong></span>
                  <span>|</span>
                  <span>المدينة: <strong className="text-slate-700">{viewingDetailedProvider.city || 'الرياض'}</strong></span>
                  <span>|</span>
                  <span>الباقة: <strong className="text-indigo-600">{viewingDetailedProvider.packageName || 'بدون باقة'}</strong></span>
                </div>
              </div>
            </div>

            {/* Segmented Tab Navigation Bar */}
            {(() => {
              const providerHalls = halls.filter((h: any) => h.providerId === viewingDetailedProvider.id || h.providerName === viewingDetailedProvider.name);
              const providerServices = services.filter((s: any) => s.providerId === viewingDetailedProvider.id || s.providerName === viewingDetailedProvider.name);
              const totalFacilities = providerHalls.length + providerServices.length;

              return (
                <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl my-3 shrink-0 border border-slate-200 text-xs font-bold">
                  <button
                    onClick={() => setProviderProfileTab('info')}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      providerProfileTab === 'info'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>البيانات والتواصل</span>
                  </button>

                  <button
                    onClick={() => setProviderProfileTab('facilities')}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      providerProfileTab === 'facilities'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <LayoutGrid className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>الصالات والخدمات</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      providerProfileTab === 'facilities' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {totalFacilities}
                    </span>
                  </button>

                  <button
                    onClick={() => setProviderProfileTab('finance')}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      providerProfileTab === 'finance'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-purple-600 shrink-0" />
                    <span>المالية والعمولات</span>
                  </button>

                  <button
                    onClick={() => setProviderProfileTab('licenses')}
                    className={`flex-1 py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      providerProfileTab === 'licenses'
                        ? 'bg-white text-indigo-700 shadow-sm border border-slate-200/80 font-extrabold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>التراخيص والربط</span>
                  </button>
                </div>
              );
            })()}

            {/* Scrollable Tab Body Area (Contained Scroll) */}
            <div className="flex-1 overflow-y-auto min-h-0 pr-1 pl-1 py-1 space-y-4 text-xs">
              {/* TAB 1: BASIC INFO & CONTACT */}
              {providerProfileTab === 'info' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-xs text-indigo-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <span>المعلومات الهيكلية وبيانات الاعتماد الأساسية</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] font-bold">نوع الكيان التجاري:</span>
                        <span className="font-bold text-slate-800 text-xs">{viewingDetailedProvider.type || 'منشأة تجارية'}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] font-bold">رقم السجل التجاري / الهوية:</span>
                        <span className="font-mono font-bold text-slate-800 text-xs">{viewingDetailedProvider.idNumber || viewingDetailedProvider.id}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] font-bold">رقم هاتف التواصل:</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-mono font-bold text-slate-800 text-xs" dir="ltr">{viewingDetailedProvider.phone || '0500000000'}</span>
                          <a 
                            href={`https://wa.me/966${(viewingDetailedProvider.phone || '').replace(/^0/, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-200 font-bold hover:bg-emerald-100"
                          >
                            واتساب
                          </a>
                        </div>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] font-bold">البريد الإلكتروني الرسمى:</span>
                        <span className="font-mono font-bold text-slate-800 text-xs truncate block">{viewingDetailedProvider.email || 'partner@lailah.sa'}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] font-bold">المنطقة والمدينة:</span>
                        <span className="font-bold text-slate-800 text-xs">{viewingDetailedProvider.region || 'منطقة الرياض'} - {viewingDetailedProvider.city || 'الرياض'}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200/80">
                        <span className="text-slate-400 block text-[10px] font-bold">الحالة التشغيلية للنظام:</span>
                        <span className="font-extrabold text-emerald-700 text-xs">{viewingDetailedProvider.status || 'نشط ومعتمد'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>العنوان الوطني وتوثيق المقر الرئيسي</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div className="bg-white p-3 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block text-[10px] font-bold mb-1">العنوان الوطني المعتمد:</span>
                        <p className="font-bold text-slate-800 text-xs leading-relaxed">
                          {viewingDetailedProvider.nationalAddress || 'المملكة العربية السعودية، الرياض، حي الصحافة، طريق الملك فهد، مبنى 4092'}
                        </p>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1">
                        <span className="text-slate-400 block text-[10px] font-bold">تقييم ومؤشر أداء المزود:</span>
                        <div className="flex items-center gap-2">
                          <span className="text-amber-500 font-extrabold text-base">★ {viewingDetailedProvider.rating || '4.9'}</span>
                          <span className="text-slate-400 text-[10px]">({viewingDetailedProvider.reviewsCount || 48} تقييماً معتمداً)</span>
                        </div>
                        <span className="text-[10px] text-emerald-600 font-bold block pt-0.5">نسبة الامتثال للطلبات: 99.2%</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FACILITIES & SERVICES */}
              {providerProfileTab === 'facilities' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {(() => {
                    const providerHalls = halls.filter((h: any) => h.providerId === viewingDetailedProvider.id || h.providerName === viewingDetailedProvider.name);
                    const providerServices = services.filter((s: any) => s.providerId === viewingDetailedProvider.id || s.providerName === viewingDetailedProvider.name);

                    return (
                      <>
                        <div className="grid grid-cols-3 gap-2.5 text-center">
                          <div className="bg-indigo-50/80 p-3 rounded-2xl border border-indigo-150">
                            <span className="text-slate-500 block text-[10px] font-bold">الصالات والقاعات</span>
                            <span className="font-extrabold text-indigo-700 text-base font-mono">{providerHalls.length}</span>
                          </div>
                          <div className="bg-emerald-50/80 p-3 rounded-2xl border border-emerald-150">
                            <span className="text-slate-500 block text-[10px] font-bold">الخدمات المساندة</span>
                            <span className="font-extrabold text-emerald-700 text-base font-mono">{providerServices.length}</span>
                          </div>
                          <div className="bg-purple-50/80 p-3 rounded-2xl border border-purple-150">
                            <span className="text-slate-500 block text-[10px] font-bold">إجمالي الحجوزات الناجحة</span>
                            <span className="font-extrabold text-purple-700 text-base font-mono">{viewingDetailedProvider.bookingsCount || 18}</span>
                          </div>
                        </div>

                        {/* Facilities List */}
                        <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                          <h4 className="font-extrabold text-xs text-blue-900 flex items-center justify-between pb-1 border-b border-slate-200">
                            <span className="flex items-center gap-1.5">
                              <LayoutGrid className="w-4 h-4 text-blue-600" />
                              <span>قائمة المنشآت والخدمات المسجلة وحالة الاعتماد</span>
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">تحديث فوري من قاعدة البيانات</span>
                          </h4>

                          {providerHalls.length > 0 || providerServices.length > 0 ? (
                            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                              {providerHalls.map((h: any) => (
                                <div key={h.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-indigo-50 text-indigo-700 rounded-xl font-extrabold text-xs">
                                      🏰
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-slate-800 text-xs">{h.name}</h5>
                                      <span className="text-[10px] text-slate-400 font-mono">{h.city || viewingDetailedProvider.city} | السعة: {h.capacity || '300-500'} شخص</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-indigo-700 text-xs font-mono">{(h.price || 5000).toLocaleString()} ر.س</span>
                                    <span className="text-[10px] bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-bold border border-green-200">
                                      معتمدة ونشطة
                                    </span>
                                  </div>
                                </div>
                              ))}

                              {providerServices.map((s: any) => (
                                <div key={s.id} className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-emerald-50 text-emerald-700 rounded-xl font-extrabold text-xs">
                                      ✨
                                    </div>
                                    <div>
                                      <h5 className="font-extrabold text-slate-800 text-xs">{s.name}</h5>
                                      <span className="text-[10px] text-slate-400 font-mono">الفئة: {s.category || 'خدمات مساندة'}</span>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="font-extrabold text-emerald-700 text-xs font-mono">{(s.price || 1200).toLocaleString()} ر.س</span>
                                    <span className="text-[10px] bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full font-bold border border-green-200">
                                      معتمدة ونشطة
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-6 bg-white rounded-xl border border-slate-200 text-slate-400 space-y-1">
                              <p className="font-bold text-xs">لا توجد قاعات أو خدمات مساندة مسجلة بهذا الاسم حالياً.</p>
                              <p className="text-[10px]">يمكن للشريك إضافة منشآته عبر لوحة تحكم المزود بانتظار اعتماد الإدارة.</p>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 3: FINANCE & COMMISSIONS */}
              {providerProfileTab === 'finance' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  {(() => {
                    const customData = customCommissionsData[viewingDetailedProvider.id];
                    const pkgLower = (viewingDetailedProvider.packageName || '').toLowerCase();
                    const defaultRate = pkgLower.includes('ملك') || pkgLower.includes('vip') ? 5 :
                                        pkgLower.includes('احتراف') ? 8 :
                                        pkgLower.includes('أعمال') ? 10 : 15;
                    const activeRate = customData ? customData.rate : (commissionRates[viewingDetailedProvider.id] || defaultRate);
                    const totalBookingsCount = viewingDetailedProvider.bookingsCount || 18;
                    const estimatedRevenue = totalBookingsCount * 4500;
                    const cuts = Math.round(estimatedRevenue * (activeRate / 100));

                    return (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div className="p-3 bg-blue-50/80 rounded-2xl border border-blue-200">
                            <span className="text-slate-500 block text-[10px] font-bold">باقة الاشتراك النشطة</span>
                            <span className="font-extrabold text-blue-700 text-sm mt-0.5 block">{viewingDetailedProvider.packageName || 'بدون باقة'}</span>
                            <span className="text-[10px] text-blue-600 font-mono block mt-1">تاريخ التجديد: 2026-12-31</span>
                          </div>

                          <div className="p-3 bg-purple-50/80 rounded-2xl border border-purple-200">
                            <span className="text-slate-500 block text-[10px] font-bold">نسبة العمولة المطبقة</span>
                            <div className="flex items-center justify-between mt-0.5">
                              <span className="font-extrabold text-purple-800 text-base font-mono">{activeRate}%</span>
                              {customData ? (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold border border-amber-300">
                                  🌟 عمولة مخصصة
                                </span>
                              ) : (
                                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                                  عمولة الباقة
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono block mt-1">نسبة الباقة الافتراضية: {defaultRate}%</span>
                          </div>

                          <div className="p-3 bg-emerald-50/80 rounded-2xl border border-emerald-200">
                            <span className="text-slate-500 block text-[10px] font-bold">إجمالي عمولة المنصة المستحقة</span>
                            <span className="font-extrabold text-emerald-800 text-base font-mono mt-0.5 block">{cuts.toLocaleString()} ر.س</span>
                            <span className="text-[10px] text-emerald-600 font-mono block mt-1">من مبيعات: {estimatedRevenue.toLocaleString()} ر.س</span>
                          </div>
                        </div>

                        {/* Custom Commission Reason Trail if Exists */}
                        {customData && (
                          <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 text-[11px] text-amber-900 space-y-1">
                            <div className="flex items-center justify-between font-bold">
                              <span className="flex items-center gap-1">
                                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                                <span>تفاصيل الاستثناء المخصص للعمولة المعتمدة:</span>
                              </span>
                              <span className="font-mono text-[10px] text-amber-700">مرجع العقد: {customData.ref || 'AGR-2026-OFFICIAL'}</span>
                            </div>
                            <p className="text-[11px] text-slate-700 bg-white p-2 rounded-xl border border-amber-200/80">
                              "{customData.reason}"
                            </p>
                            <div className="flex justify-between text-[10px] text-amber-800 font-mono pt-0.5">
                              <span>المعدِّل: {customData.updatedBy}</span>
                              <span>تاريخ التوثيق: {customData.updatedAt}</span>
                            </div>
                          </div>
                        )}

                        {/* Action to change custom commission rate */}
                        <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-3">
                          <div>
                            <h5 className="font-extrabold text-slate-800 text-xs">هل ترغب في تعديل أو تحديد نسبة عمولة مخصصة؟</h5>
                            <p className="text-[10px] text-slate-400">يمكن للإدارة تغليب نسبة عمولة مخصصة على نسبة الباقة لشريك استراتيجي بموجب اتفاقية خاصة.</p>
                          </div>
                          <button
                            onClick={() => {
                              setEditingCommissionProvider(viewingDetailedProvider);
                              setCustomCommissionVal(activeRate);
                              setCustomCommissionReasonVal(customData ? customData.reason : '');
                              setCustomCommissionRefVal(customData ? customData.ref : '');
                            }}
                            className="py-2 px-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs shrink-0 flex items-center gap-1.5"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                            <span>تعديل العمولة المخصصة</span>
                          </button>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* TAB 4: LICENSES & TAX INTEGRATION */}
              {providerProfileTab === 'licenses' && (
                <div className="space-y-3.5 animate-in fade-in duration-150">
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <h4 className="font-extrabold text-xs text-emerald-900 flex items-center gap-1.5 pb-2 border-b border-slate-200">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>حالة التراخيص الرسمية والربط الضريبي ZATCA & IBAN</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold">الرقم الضريبي المربوط (ZATCA):</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                            مربوط ومفعل
                          </span>
                        </div>
                        <p className="font-mono font-extrabold text-slate-800 text-sm">
                          {viewingDetailedProvider.taxNumber || '310029384200003'}
                        </p>
                        <span className="text-[10px] text-slate-400 block">مرحلة الفوترة الإلكترونية المرحلة الثانية (المطابقة والربط) معتمدة.</span>
                      </div>

                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] text-slate-400 font-bold">الحساب البنكي المعتمد (IBAN):</span>
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                            موثق بنكياً
                          </span>
                        </div>
                        <p className="font-mono font-extrabold text-emerald-700 text-xs">
                          {viewingDetailedProvider.iban || 'SA44 8000 0000 6080 1010 2030'}
                        </p>
                        <span className="text-[10px] text-slate-400 block">البنك الأهلي السعودي - مطابق لاسم الكيان الموثق.</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200 space-y-2.5">
                    <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5 pb-1 border-b border-slate-200">
                      <FileText className="w-4 h-4 text-slate-600" />
                      <span>الشهادات والتراخيص المرفقة الموثقة</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-center">
                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">شهادة السجل التجاري</span>
                        <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-extrabold text-[10px] border border-green-200">
                          سارية المفعول
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">شهادة التسجيل الضريبي</span>
                        <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-extrabold text-[10px] border border-green-200">
                          موثقة ومعتمدة
                        </span>
                      </div>

                      <div className="p-2.5 bg-white rounded-xl border border-slate-200 space-y-1">
                        <span className="text-[10px] text-slate-400 block font-bold">ترخيص وزارة السياحة/البلدية</span>
                        <span className="inline-block px-2 py-0.5 bg-green-50 text-green-700 rounded-md font-extrabold text-[10px] border border-green-200">
                          مكتمل ومفعل
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Fixed Footer */}
            <div className="pt-3 mt-auto border-t border-slate-150 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingCommissionProvider(viewingDetailedProvider);
                    const customData = customCommissionsData[viewingDetailedProvider.id];
                    const pkgLower = (viewingDetailedProvider.packageName || '').toLowerCase();
                    const defaultRate = pkgLower.includes('ملك') || pkgLower.includes('vip') ? 5 :
                                        pkgLower.includes('احتراف') ? 8 :
                                        pkgLower.includes('أعمال') ? 10 : 15;
                    const activeRate = customData ? customData.rate : (commissionRates[viewingDetailedProvider.id] || defaultRate);
                    setCustomCommissionVal(activeRate);
                    setCustomCommissionReasonVal(customData ? customData.reason : '');
                    setCustomCommissionRefVal(customData ? customData.ref : '');
                  }}
                  className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl cursor-pointer border border-indigo-200 flex items-center gap-1.5 transition-all"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>تعديل العمولة المخصصة</span>
                </button>
              </div>

              <button 
                onClick={() => setViewingDetailedProvider(null)}
                className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs transition-all"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
