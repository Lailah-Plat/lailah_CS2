import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Sparkles, Search, Filter, Table, List, LayoutGrid, Eye, 
  Settings2, RefreshCw, Pencil, Plus, Power, Trash2, Layers, Star, 
  Edit, ShieldCheck, ShieldAlert, BadgePercent, X, MapPin, UploadCloud, 
  ScrollText, Landmark, Info, Coins, HelpCircle, Camera, Archive, RotateCcw,
  ShoppingBag
} from 'lucide-react';
import Editor from 'react-simple-wysiwyg';
import { AddServiceModal } from './AddServiceModal';
import { ExternalBlockManagerModal } from './ExternalBlockManagerModal';
import { MediaStandardsGuideModal, MediaStandardsGuideTrigger } from './MediaStandardsGuideModal';
import { VenueStoreManagerModal } from './modals/VenueStoreManagerModal';
import GoogleMapsModal from './common/GoogleMapsModal';
import { CrNumberInput, TaxNumberInput, PhoneInput } from './common/ValidationInputs';
import { getFullDateInfo } from '../utils/dateUtils';
import { saveStoredHalls } from '../data/mockData';
import { HallOccupancyProgressBar } from './HallCardAddons';
import { ItemQrCodeButton } from './common/ItemQrCodeModal';

interface HallsManagementProps {
  userRole: string;
  currentProviderName: string;
  currentProviderId?: string;
  currentUserName: string;
  providerSubscription: any;
  providers: any[];
  regions: any[];
  halls: any[];
  setHalls: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  activeTab: 'halls' | 'services';
  handleRestoreHall?: (id: any) => void;
  setDeleteData?: (data: any) => void;
}

export default function HallsManagement({
  userRole,
  currentProviderName,
  currentProviderId = '',
  currentUserName,
  providerSubscription,
  providers,
  regions,
  halls,
  setHalls,
  services,
  setServices,
  showNotification,
  activeTab,
  handleRestoreHall,
  setDeleteData
}: HallsManagementProps) {
  // Navigation sub-tab
  const [hallsAndServicesSubTab, setHallsAndServicesSubTab] = useState<'halls' | 'services'>('halls');

  useEffect(() => {
    setHallsAndServicesSubTab(activeTab);
  }, [activeTab]);

  // Hall Filters
  const [hallsSearchQuery, setHallsSearchQuery] = useState('');
  const [hallsFilterRegion, setHallsFilterRegion] = useState('');
  const [hallsFilterCity, setHallsFilterCity] = useState('');
  const [hallsFilterProvider, setHallsFilterProvider] = useState('');
  const [hallsFilterCategory, setHallsFilterCategory] = useState('');
  const [hallsFilterStatus, setHallsFilterStatus] = useState('');
  const [hallsSortBy, setHallsSortBy] = useState('newest');
  const [hallsCurrentPage, setHallsCurrentPage] = useState(1);
  const [hallsViewMode, setHallsViewMode] = useState<'table' | 'list' | 'grid'>(() => {
    return (localStorage.getItem('pref_halls_view_mode') as 'table' | 'list' | 'grid') || 'table';
  });
  const [hallsPageSize, setHallsPageSize] = useState<number>(10);

  // Services Filters
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesFilterRegion, setServicesFilterRegion] = useState('');
  const [servicesFilterProvider, setServicesFilterProvider] = useState('');
  const [servicesFilterStatus, setServicesFilterStatus] = useState('');
  const [servicesSortBy, setServicesSortBy] = useState('newest');
  const [servicesCurrentPage, setServicesCurrentPage] = useState(1);
  const [servicesViewMode, setServicesViewMode] = useState<'grid' | 'table' | 'list'>(() => {
    return (localStorage.getItem('pref_services_view_mode') as 'grid' | 'table' | 'list') || 'table';
  });

  // Modals & Forms
  const [isHallModalOpen, setIsHallModalOpen] = useState(false);
  const [hallModalStep, setHallModalStep] = useState(1);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [activeServiceTab, setActiveServiceTab] = useState<'basic' | 'pricing' | 'packages' | 'terms_images'>('basic');
  const [isImageUploading, setIsImageUploading] = useState(false);
  const [isUploadingHallImages, setIsUploadingHallImages] = useState(false);
  const [uploadingDocSlot, setUploadingDocSlot] = useState<string | null>(null);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
  const [isExternalBlockModalOpen, setIsExternalBlockModalOpen] = useState(false);
  const [isMediaGuideOpen, setIsMediaGuideOpen] = useState(false);
  const [mediaGuideTab, setMediaGuideTab] = useState<'guide' | 'inspector' | 'camera_setup'>('guide');
  const [selectedBlockTargetId, setSelectedBlockTargetId] = useState<string | number | undefined>(undefined);
  const [selectedBlockTargetType, setSelectedBlockTargetType] = useState<'hall' | 'service'>('hall');

  const [viewingHall, setViewingHall] = useState<any>(null);
  const [isHallViewModalOpen, setIsHallViewModalOpen] = useState(false);
  const [managingHall, setManagingHall] = useState<any>(null);
  const [isHallServicesModalOpen, setIsHallServicesModalOpen] = useState(false);
  const [isVenueStoreModalOpen, setIsVenueStoreModalOpen] = useState(false);
  const [storeModalHall, setStoreModalHall] = useState<any>(null);
  const [isServiceViewModalOpen, setIsServiceViewModalOpen] = useState(false);
  const [viewingService, setViewingService] = useState<any>(null);

  const [editingItem, setEditingItem] = useState<any>(null);

  // Dynamic categories from central settings
  const [hallCategories, setHallCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_hallCategories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['قاعة أفراح', 'استراحة قسم', 'استراحة قسمين', 'شاليه', 'منتجع', 'متنزه', 'مخيم', 'قاعة اجتماع', 'أخرى'];
  });

  const [serviceCategories, setServiceCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_serviceCategories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['ضيافة', 'تصوير', 'دي جي', 'بوفيه مفتوح', 'تنسيق ورد', 'عشاء وحفلات', 'تنظيم حشود'];
  });

  useEffect(() => {
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

  // Extra service inline states inside Hall Modal
  const [extraServiceName, setExtraServiceName] = useState('');
  const [extraServiceDesc, setExtraServiceDesc] = useState('');
  const [extraServiceQuantity, setExtraServiceQuantity] = useState<number | ''>(1);
  const [extraServicePrice, setExtraServicePrice] = useState<number | ''>(0);
  const [editingExtraServiceId, setEditingExtraServiceId] = useState<string | null>(null);

  // Maps coordinates states
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);
  const [mapTarget, setMapTarget] = useState<{ type: string; field: string } | null>(null);

  const [hallForm, setHallForm] = useState<any>({
    name: '', category: 'قاعة أفراح', description: '', providerType: 'منشأة',
    showProvider: true,
    crNumber: '', crExpiryDate: '', phone: '', email: '', taxNumber: '',
    region: '', city: '', nationalAddress: '', extraAddress: '', capacity: '',
    nightPrice: 0, morningPrice: 0, fullDayPrice: 0, 
    status: userRole === 'admin' ? 'approved' : 'pending',
    activationStatus: userRole === 'admin' ? 'مفعل' : 'موقوف',
    bookingStatus: 'متاحة', facilities: '', rules: '', contractTerms: '',
    pledge: false, images: [], image: '', features: [], location: '',
    extraServicesList: [], cancellationPeriod: '', security_deposit_amount: 1000,
    weekendMultiplierType: 'percentage', weekend_morning_margin: 0,
    weekend_night_margin: 0, weekend_fullDay_margin: 0, paymentMethods: [],
    facilityType: 'منشأة تجارية', taxExempt: false,
    crImage: '', ibanImage: '', taxCertificateImage: '',
    zakatCertificateImage: '', tourismLicenseImage: '', providerId: null
  });

  const [serviceForm, setServiceForm] = useState<any>({
    name: '', description: '', provider: '', providerId: null, showProviderToCustomers: false, quantity: '', price: 0,
    regions: '', cities: '', terms: '', serviceStatus: 'متاحة', 
    status: userRole === 'admin' ? 'approved' : 'pending',
    adminStatus: userRole === 'admin' ? 'approved' : 'pending',
    activationStatus: userRole === 'admin' ? 'مفعل' : 'موقوف',
    cancellationPeriod: '', images: [], hostName: '', unit: 'مرة واحدة',
    unitPrice: 0,
    taxonomyType: 'rental',
    packages: [],
    addons: [],
    classification: ''
  });

  // States for Hall Bundles management in Step 3
  const [showBundleForm, setShowBundleForm] = useState(false);
  const [bundleInputName, setBundleInputName] = useState('');
  const [bundleInputInclusions, setBundleInputInclusions] = useState('');
  const [bundleInputVisible, setBundleInputVisible] = useState(true);
  const [bundleInputMorningPrice, setBundleInputMorningPrice] = useState<number | ''>('');
  const [bundleInputNightPrice, setBundleInputNightPrice] = useState<number | ''>('');
  const [bundleInputFullDayPrice, setBundleInputFullDayPrice] = useState<number | ''>('');
  const [editingBundleId, setEditingBundleId] = useState<string | null>(null);

  // Local currency formatter
  const formatCurrency = (val: number) => `${val.toLocaleString('ar-SA')} ر.س`;

  // Fetch / Sync handler on Tab Entry
  useEffect(() => {
    if (isServiceModalOpen) {
      setActiveServiceTab('basic');
    }
  }, [isServiceModalOpen]);

  // Handling map location selection confirmed
  const handleMapConfirm = (address: string, location?: { lat: number; lng: number }, extra?: { region: string; city: string }) => {
    if (!mapTarget) return;
    if (mapTarget.type === 'hall') {
      setHallForm((prev: any) => ({ 
        ...prev, 
        [mapTarget.field]: address,
        ...(extra && extra.region && extra.city ? { region: extra.region, city: extra.city } : {})
      }));
    }
    setIsMapModalOpen(false);
    setMapTarget(null);
  };

  const handleAddOrUpdateExtraService = () => {
    if (!extraServiceName.trim()) {
      alert("الرجاء إدخال اسم الخدمة");
      return;
    }
    const priceNum = Number(extraServicePrice) || 0;
    const qtyNum = Number(extraServiceQuantity) || 1;
    const list = hallForm.extraServicesList || [];

    if (editingExtraServiceId) {
      const updatedList = list.map((s: any) =>
        String(s.id) === String(editingExtraServiceId)
          ? { ...s, name: extraServiceName, desc: extraServiceDesc, description: extraServiceDesc, quantity: qtyNum, price: priceNum }
          : s
      );
      setHallForm({ ...hallForm, extraServicesList: updatedList });
      setEditingExtraServiceId(null);
    } else {
      const newService = {
        id: Date.now().toString(),
        name: extraServiceName,
        desc: extraServiceDesc,
        description: extraServiceDesc,
        quantity: qtyNum,
        price: priceNum
      };
      setHallForm({ ...hallForm, extraServicesList: [...list, newService] });
    }
    setExtraServiceName('');
    setExtraServiceDesc('');
    setExtraServiceQuantity(1);
    setExtraServicePrice(0);
  };

  // Hall status toggle
  const toggleHallStatus = async (h: any) => {
    const isCurrentlyActive = h.status === "مفعل" || h.status === "active";
    const newStatus = isCurrentlyActive ? "inactive" : "active";
    const updated = halls.map((hall: any) =>
      hall.id === h.id ? { ...hall, status: newStatus } : hall
    );
    setHalls(updated);

    try {
      const res = await fetch(`/api/bookings/halls/${h.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...h, status: newStatus })
      });
      if (!res.ok) throw new Error("Failed to update status.");
      const savedHall = await res.json();
      setHalls(prev => prev.map((hall: any) => hall.id === h.id ? { ...hall, ...savedHall } : hall));
      showNotification("success", `تم ${newStatus === "active" ? "تفعيل" : "إيقاف"} المنشأة أو المرفق بنجاح!`);
    } catch (err: any) {
      console.error(err);
      setHalls(halls);
      showNotification("error", "خطأ في الاتصال بالخادم لتحديث حالة المنشأة.");
    }
  };

  // Hall Delete action
  const handleHallDelete = async (id: number) => {
    const targetHall = halls.find(h => h.id === id);
    if (setDeleteData) {
      setDeleteData({
        id,
        name: targetHall?.name || 'القاعة',
        type: 'hall'
      });
      return;
    }

    if (!confirm(`هل أنت متأكد من رغبتك في حذف أو أرشفة "${targetHall?.name || 'القاعة'}"؟`)) return;
    try {
      const res = await fetch(`/api/bookings/halls/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setHalls(prev => prev.filter(h => h.id !== id));
        showNotification('success', 'تم تنفيذ الإجراء بنجاح.');
      } else {
        showNotification('error', 'فشل تنفيذ الإجراء.');
      }
    } catch {
      showNotification('error', 'حدث خطأ أثناء الاتصال بالخادم.');
    }
  };

  const handleHallRestore = (id: number) => {
    if (handleRestoreHall) {
      handleRestoreHall(id);
      return;
    }
    setHalls(prev => prev.map(h => {
      if (h.id === id) {
        return {
          ...h,
          isArchived: false,
          archivedAt: undefined,
          status: 'approved',
          activationStatus: 'مفعل'
        };
      }
      return h;
    }));
    showNotification('success', '♻️ تم استعادة القاعة من الأرشيف وإعادة تفعيلها بنجاح.');
  };

  // Service Delete action
  const handleServiceDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من رغبتك في حذف هذه الخدمة؟")) return;
    try {
      const res = await fetch(`/api/bookings/services/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setServices(prev => prev.filter(s => s.id !== id));
        showNotification('success', 'تم حذف الخدمة المساندة بنجاح.');
      } else {
        showNotification('error', 'فشل حذف الخدمة.');
      }
    } catch {
      showNotification('error', 'حدث خطأ أثناء الاتصال بالخادم لحذف الخدمة.');
    }
  };

  // Render Stars Helper
  const renderStars = (rating = 4.5, count = 0) => (
    <div className="flex items-center gap-1">
      <div className="flex items-center text-amber-450 gap-0.5">
        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
        <span className="text-xs font-black font-mono text-slate-700">{Number(rating).toFixed(1)}</span>
      </div>
      {count > 0 && <span className="text-[10px] text-slate-400 font-sans">({count})</span>}
    </div>
  );

  // Filtered lists computation
  const filteredHalls = useMemo(() => {
    return halls.filter(h => {
      const matchSearch = !hallsSearchQuery || 
        (h.name || '').toLowerCase().includes(hallsSearchQuery.toLowerCase()) || 
        (h.provider || '').toLowerCase().includes(hallsSearchQuery.toLowerCase()) || 
        (h.city || '').toLowerCase().includes(hallsSearchQuery.toLowerCase()) || 
        (h.facilities || '').toLowerCase().includes(hallsSearchQuery.toLowerCase());
      
      const matchRegion = !hallsFilterRegion || h.region === hallsFilterRegion;
      const matchCity = !hallsFilterCity || h.city === hallsFilterCity;
      const matchProvider = !hallsFilterProvider || h.provider === hallsFilterProvider;
      const matchCategory = !hallsFilterCategory || h.category === hallsFilterCategory;
      
      let matchStatus = true;
      if (hallsFilterStatus === 'مؤرشفة') {
        matchStatus = Boolean(h.isArchived) || h.status === 'مؤرشفة';
      } else if (hallsFilterStatus === 'مفعل') {
        matchStatus = !h.isArchived && (h.activationStatus || 'مفعل') === 'مفعل' && (h.status === 'approved' || h.status === 'مفعل');
      } else if (hallsFilterStatus === 'موقوف') {
        matchStatus = !h.isArchived && (h.activationStatus === 'موقوف' || h.status === 'blocked' || h.status === 'معطل');
      } else if (hallsFilterStatus === 'بانتظار الموافقة') {
        matchStatus = !h.isArchived && (h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.adminApprovalStatus === 'pending');
      } else if (!hallsFilterStatus) {
        // By default, if no specific status selected, show non-archived unless searched
        matchStatus = true;
      }

      return matchSearch && matchRegion && matchCity && matchProvider && matchCategory && matchStatus;
    }).sort((a, b) => {
      if (hallsSortBy === 'price_asc') return (a.nightPrice || a.price || 0) - (b.nightPrice || b.price || 0);
      if (hallsSortBy === 'price_desc') return (b.nightPrice || b.price || 0) - (a.nightPrice || a.price || 0);
      if (hallsSortBy === 'capacity_desc') return (b.capacity || 0) - (a.capacity || 0);
      return b.id - a.id; // newest
    });
  }, [halls, hallsSearchQuery, hallsFilterRegion, hallsFilterCity, hallsFilterProvider, hallsFilterCategory, hallsFilterStatus, hallsSortBy]);

  const filteredServices = useMemo(() => {
    return services.filter(s => {
      const matchSearch = !servicesSearchQuery || 
        (s.name || '').toLowerCase().includes(servicesSearchQuery.toLowerCase()) || 
        (s.provider || '').toLowerCase().includes(servicesSearchQuery.toLowerCase()) || 
        (s.description || '').toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
        (s.cities || '').toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
        (s.classification || s.category || '').toLowerCase().includes(servicesSearchQuery.toLowerCase());

      const matchRegion = !servicesFilterRegion || (s.regions || '').includes(servicesFilterRegion);
      const matchProvider = !servicesFilterProvider || s.provider === servicesFilterProvider;
      const matchStatus = !servicesFilterStatus || s.serviceStatus === servicesFilterStatus;

      return matchSearch && matchRegion && matchProvider && matchStatus;
    }).sort((a, b) => {
      if (servicesSortBy === 'price_asc') return (a.price || 0) - (b.price || 0);
      if (servicesSortBy === 'price_desc') return (b.price || 0) - (a.price || 0);
      return b.id - a.id; // newest
    });
  }, [services, servicesSearchQuery, servicesFilterRegion, servicesFilterProvider, servicesFilterStatus, servicesSortBy]);

  // Pagination chunk slice
  const paginatedHalls = useMemo(() => {
    const startIndex = (hallsCurrentPage - 1) * hallsPageSize;
    return filteredHalls.slice(startIndex, startIndex + hallsPageSize);
  }, [filteredHalls, hallsCurrentPage, hallsPageSize]);

  const paginatedServices = useMemo(() => {
    const startIndex = (servicesCurrentPage - 1) * 10;
    return filteredServices.slice(startIndex, startIndex + 10);
  }, [filteredServices, servicesCurrentPage]);

  const hallsTotalPages = Math.ceil(filteredHalls.length / hallsPageSize);
  const servicesTotalPages = Math.ceil(filteredServices.length / 10);

  const maxBundlesLimit = useMemo(() => {
    const pkg = providerSubscription?.packageName || providerSubscription?.packageName_display || 'الباقة المتقدمة';
    let baseLimit = 3;
    if (pkg.includes('الأساسية') || pkg.includes('Basic')) {
      baseLimit = 2;
    } else if (pkg.includes('المتقدمة')) {
      baseLimit = 5;
    } else if (pkg.includes('الشركات') || pkg.includes('المؤسسات') || pkg.includes('VIP')) {
      baseLimit = 10;
    }
    const purchased = Number(providerSubscription?.additionalHallBundles || 0);
    return baseLimit + purchased;
  }, [providerSubscription]);

  const currentBundles = useMemo(() => {
    if (hallForm.bundlesList && Array.isArray(hallForm.bundlesList) && hallForm.bundlesList.length > 0) {
      return hallForm.bundlesList;
    }
    if (hallForm.pricingModel === 'bundle') {
      return [
        {
          id: 'default',
          name: hallForm.bundleName || 'باقة الفخامة المتكاملة',
          inclusions: hallForm.bundleInclusions || '',
          isVisible: true
        }
      ];
    }
    return [];
  }, [hallForm.bundlesList, hallForm.bundleName, hallForm.bundleInclusions, hallForm.pricingModel]);

  return (
    <div className="space-y-6" dir="rtl">
      <div className="space-y-5">
        {/* Info Notice Banner for Halls */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-3.5 flex items-start gap-3">
          <Info className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950 leading-relaxed">
            <strong className="font-black text-amber-900 block mb-0.5">قسم المنشآت والخدمات الداخلية المباشرة:</strong>
            يضم القاعات والشاليهات والخدمات المساندة التي يقدمها المزود مباشرة داخل القاعة. الخدمات الإضافية المضافة هنا تمنع آلياً ظهور أي خدمات خارجية مستقلة منافسة من نفس الفئة أثناء حجز العميل لهذه القاعة (تطبيق قاعدة عدم الازدواجية).
          </div>
        </div>
          {/* Halls Action Bar */}
          <div className="flex flex-col lg:flex-row justify-between items-stretch gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-150">
            <div className="flex-1 relative">
              <Search className="absolute right-4 top-3 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="ابحث باسم القاعة، المورد، المدينة أو المعالم والخدمات المشمولة..."
                className="w-full pr-12 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 hover:border-slate-300 outline-none text-xs transition-colors bg-slate-50/20"
                value={hallsSearchQuery}
                onChange={(e) => { setHallsSearchQuery(e.target.value); setHallsCurrentPage(1); }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none focus:border-amber-500 font-medium cursor-pointer"
                value={hallsSortBy}
                onChange={(e) => setHallsSortBy(e.target.value)}
              >
                <option value="newest">الترتيب حسب: الأحدث</option>
                <option value="price_asc">السعر: من الأقل إلى الأعلى</option>
                <option value="price_desc">السعر: من الأعلى إلى الأقل</option>
                <option value="capacity_desc">الاستيعاب: تنازلياً</option>
              </select>

              <button
                type="button"
                onClick={() => {
                  setMediaGuideTab('guide');
                  setIsMediaGuideOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-950 text-emerald-300 font-extrabold text-xs flex items-center gap-2 border border-emerald-500/40 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="دليل معايير واشتراطات تصوير ورفع الوسائط والصور (16:9)"
              >
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>دليل تصوير ورفع الوسائط 📷</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setSelectedBlockTargetType('hall');
                  setSelectedBlockTargetId(undefined);
                  setIsExternalBlockModalOpen(true);
                }}
                className="px-4 py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-purple-100 font-extrabold text-xs flex items-center gap-2 border border-purple-700/50 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="تقفيل الأيام للحجوزات الخارجية، المزامنة، والصيانة"
              >
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>تقفيل المواعيد والتزامن 🔒</span>
              </button>

              <button
                onClick={() => {
                  setEditingItem(null);
                  setHallForm({
                    name: '', category: 'قاعة أفراح', description: '', providerType: 'منشأة',
                    showProvider: true,
                    crNumber: '', crExpiryDate: '', phone: '', email: '', taxNumber: '',
                    region: '', city: '', nationalAddress: '', extraAddress: '', capacity: '',
                    nightPrice: 0, morningPrice: 0, fullDayPrice: 0, 
                    status: userRole === 'admin' ? 'approved' : 'pending',
                    activationStatus: userRole === 'admin' ? 'مفعل' : 'موقوف',
                    bookingStatus: 'متاح', facilities: '', rules: '', contractTerms: '',
                    pledge: false, images: [], image: '', features: [], location: '',
                    extraServicesList: [], cancellationPeriod: '', security_deposit_amount: 1000,
                    weekendMultiplierType: 'percentage', weekend_morning_margin: 0,
                    weekend_night_margin: 0, weekend_fullDay_margin: 0, paymentMethods: [],
                    bundlesList: []
                  });
                  setHallModalStep(1);
                  setIsHallModalOpen(true);
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-l from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 transition-all active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> إضافة صالة أو مرفق جديد
              </button>
            </div>
          </div>

          {/* Quick Filters */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-3">
            <select
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
              value={hallsFilterRegion}
              onChange={(e) => { setHallsFilterRegion(e.target.value); setHallsFilterCity(''); }}
            >
              <option value="">كل المناطق</option>
              {regions.map((r) => <option value={r.name} key={r.id}>{r.name}</option>)}
            </select>
            <select
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
              value={hallsFilterCity}
              onChange={(e) => setHallsFilterCity(e.target.value)}
              disabled={!hallsFilterRegion}
            >
              <option value="">كل المدن</option>
              {regions.find((r) => r.name === hallsFilterRegion)?.cities.map((c: string) => (
                <option value={c} key={c}>{c}</option>
              ))}
            </select>
            <select
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
              value={hallsFilterCategory}
              onChange={(e) => setHallsFilterCategory(e.target.value)}
            >
              <option value="">كل التصنيفات</option>
              {hallCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
              value={hallsFilterStatus}
              onChange={(e) => setHallsFilterStatus(e.target.value)}
            >
              <option value="">كل الحالات</option>
              <option value="مفعل">مفعل</option>
              <option value="موقوف">موقوف</option>
              <option value="بانتظار الموافقة">بانتظار الموافقة</option>
              <option value="مؤرشفة">📦 مؤرشفة (خارج العرض)</option>
            </select>
            <button
              onClick={() => {
                setHallsSearchQuery('');
                setHallsFilterRegion('');
                setHallsFilterCity('');
                setHallsFilterProvider('');
                setHallsFilterCategory('');
                setHallsFilterStatus('');
                setHallsSortBy('newest');
              }}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors flex items-center justify-center gap-1.5 font-bold"
            >
              <Filter className="w-4 h-4" /> مسح التصفية
            </button>
          </div>

          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <span className="font-bold text-slate-500">عرض {filteredHalls.length} منشأة مكتشفة</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400">طريقة العرض:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {(['table', 'list', 'grid'] as const).map(mode => (
                  <button
                    key={mode}
                    onClick={() => { 
                      setHallsViewMode(mode); 
                      setHallsCurrentPage(1); 
                      localStorage.setItem('pref_halls_view_mode', mode);
                    }}
                    className={`p-1.5 rounded-lg text-xs transition-all ${hallsViewMode === mode ? 'bg-white shadow-xs text-amber-600' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    {mode === 'table' ? <Table className="w-3.5 h-3.5" /> : mode === 'list' ? <List className="w-3.5 h-3.5" /> : <LayoutGrid className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Table Mode */}
          {hallsViewMode === 'table' && (
            <div className="bg-white rounded-2xl shadow-xs border border-slate-150 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs whitespace-nowrap">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-150">
                    <tr>
                      <th className="p-4 mr-2">اسم المنشأة</th>
                      <th className="p-4">التصنيف</th>
                      <th className="p-4">التقييم</th>
                      <th className="p-4">المزود</th>
                      <th className="p-4">المدينة</th>
                      <th className="p-4">الاستيعاب</th>
                      <th className="p-4">الحالة</th>
                      <th className="p-4">حالة الحجز</th>
                      <th className="p-4 text-center">الإجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {paginatedHalls.map((h: any) => (
                      <tr key={h.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-bold">
                          <div className="font-black text-slate-800">{h.name}</div>
                          <div className="flex gap-1 mt-1">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              h.pricingModel === 'bundle' ? 'bg-amber-100 text-amber-800 border border-amber-205' : 'bg-blue-50 text-blue-800 border border-blue-105'
                            }`}>
                              {h.pricingModel === 'bundle' ? 'النمط أ: باقة مغلقة' : 'النمط ب: أساسي + اختيارية'}
                            </span>
                            {h.enableExternalMarket && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-850 border border-violet-200">
                                النمط ج: سوق الشركاء m-c
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 border border-slate-200">{h.category}</span>
                        </td>
                        <td className="p-4">{renderStars(h.rating, h.reviewsCount)}</td>
                        <td className="p-4 text-slate-500 font-mono">{h.provider}</td>
                        <td className="p-4 text-slate-600">{h.city}</td>
                        <td className="p-4 text-slate-700">{h.capacity ? `${h.capacity} شخص` : 'غير محدد'}</td>
                        <td className="p-4">
                          {(() => {
                            const isHallActive = (h.status === 'approved' || h.status === 'مفعل' || h.status === 'active') && (h.activationStatus || 'مفعل') === 'مفعل';
                            const isHallPending = h.status === 'pending' || h.status === 'بانتظار الموافقة';
                            const isHallBlocked = h.status === 'blocked' || h.status === 'مرفوض';

                            if (isHallActive) {
                                return (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-green-50 text-green-700 border border-green-100">
                                    مفعلة مقبول
                                  </span>
                                );
                            } else if (isHallPending) {
                                return (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-50 text-amber-700 border border-amber-100">
                                    بانتظار الاعتماد
                                  </span>
                                );
                            } else if (isHallBlocked) {
                                return (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-rose-50 text-rose-700 border border-rose-100">
                                    مرفوضة / محظورة
                                  </span>
                                );
                            } else {
                                return (
                                  <span className="px-2 py-0.5 rounded-full text-[10px] bg-slate-50 text-slate-700 border border-slate-100">
                                    موقوفة مؤقتاً
                                  </span>
                                );
                            }
                          })()}
                        </td>
                        <td className="p-4 text-xs">
                          <span className={`px-2 py-0.5 rounded-xl text-[10px] font-bold ${(!h.bookingStatus || h.bookingStatus === 'متاح') ? 'bg-emerald-50 text-emerald-700' : h.bookingStatus === 'صيانة' ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}>
                            {h.bookingStatus || 'متاح'}
                          </span>
                        </td>
                        <td className="p-4 flex gap-1.5 items-center justify-center">
                          <ItemQrCodeButton
                            item={{ id: h.id, name: h.name, type: 'hall', provider: h.provider, city: h.city, image: h.images?.[0] }}
                            variant="table"
                          />
                          <button
                            onClick={() => { setViewingHall(h); setIsHallViewModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 border border-transparent hover:border-blue-100 rounded-lg transition-colors cursor-pointer"
                            title="عرض التفاصيل العميقة"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => { setStoreModalHall(h); setIsVenueStoreModalOpen(true); }}
                            className="p-1.5 text-amber-800 bg-amber-100/80 hover:bg-amber-200/90 border border-amber-300 rounded-lg transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10px]"
                            title="إدارة متجر المستلزمات والمنتجات المصغر 🛍️"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-700" />
                            <span className="hidden xl:inline">المتجر 🛍️</span>
                          </button>
                          <button
                            onClick={() => { setManagingHall(h); setIsHallServicesModalOpen(true); }}
                            className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-100 rounded-lg transition-colors cursor-pointer"
                            title="إدارة وتوريد الخدمات"
                          >
                            <Settings2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const nextStatus: Record<string, string> = { "متاح": "صيانة", "صيانة": "موقوفة", "موقوفة": "متاح" };
                              const currentStatus = h.bookingStatus || "متاح";
                              const newStatus = nextStatus[currentStatus] || "متاح";
                              setHalls(prev => prev.map(hall => hall.id === h.id ? { ...hall, bookingStatus: newStatus } : hall));
                            }}
                            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 rounded-lg transition-colors cursor-pointer"
                            title="تدوير حالة الحجز"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              const resolvedProv = providers?.find(p => Number(p.id || p.dbId) === Number(h.providerId));
                              const resolvedProviderName = resolvedProv ? resolvedProv.name : (h.provider || 'غير محدد');
                              const resolvedProviderId = h.providerId || (resolvedProv ? Number(resolvedProv.id || resolvedProv.dbId) : null);

                              setEditingItem(h);
                              setHallForm({
                                ...h,
                                provider: resolvedProviderName,
                                providerId: resolvedProviderId,
                                showProvider: h.showProvider !== false,
                                images: h.images || [],
                                extraServicesList: h.extraServicesList || [],
                                cancellationPeriod: h.cancellationPeriod || '',
                                facilityType: h.facilityType || 'منشأة تجارية',
                                taxExempt: h.taxExempt ?? false,
                                crImage: h.crImage || '',
                                ibanImage: h.ibanImage || '',
                                taxCertificateImage: h.taxCertificateImage || '',
                                zakatCertificateImage: h.zakatCertificateImage || '',
                                tourismLicenseImage: h.tourismLicenseImage || '',
                                paymentMethods: h.paymentMethods || [],
                                bookingStatus: h.bookingStatus || 'متاحة',
                                bundlesList: h.bundlesList || (h.pricingModel === 'bundle' ? [{ id: 'default', name: h.bundleName || 'باقة الفخامة المتكاملة', inclusions: h.bundleInclusions || '', isVisible: true }] : [])
                              });
                              setHallModalStep(1);
                              setIsHallModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 rounded-lg transition-colors cursor-pointer"
                            title="تعديل ملف القاعة"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => toggleHallStatus(h)}
                            className={`p-1.5 rounded-lg border border-transparent transition-colors cursor-pointer ${h.status === 'مفعل' || h.status === 'active' ? 'text-green-600 hover:bg-green-50 hover:border-green-100' : 'text-slate-400 hover:bg-slate-100 hover:border-slate-200'}`}
                            title="تبديل التشغيل والتعطيل"
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleHallDelete(h.id)}
                            className="p-1.5 text-slate-400 hover:text-red-650 hover:bg-red-50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer"
                            title="شطب وحذف"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Grid and List Modes */}
          {hallsViewMode !== 'table' && (
            <div className={hallsViewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5' : 'space-y-4'}>
              {paginatedHalls.map((h: any) => {
                const coverImg = h.images && h.images.length > 0 ? (typeof h.images[0] === 'string' ? h.images[0] : h.images[0]?.preview) : h.image || '';
                return (
                  <div key={h.id} className={`bg-white rounded-2xl border border-slate-150 overflow-hidden shadow-xs hover:shadow-md transition-all flex ${hallsViewMode === 'list' ? 'flex-col md:flex-row p-4 gap-4' : 'flex-col'}`}>
                    <div className={`relative bg-slate-900 overflow-hidden ${hallsViewMode === 'list' ? 'h-36 w-full md:w-56 rounded-xl' : 'h-48'}`}>
                      {coverImg ? (
                        <img src={coverImg} referrerPolicy="no-referrer" alt={h.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-50">
                          <Building2 className="w-10 h-10 text-slate-300" />
                          <span className="text-[10px] mt-1 text-slate-400">لا تتوافر صورة غلاف</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-2 py-0.5 rounded-lg text-[10px] font-bold">
                        {h.category}
                      </div>
                    </div>
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-extrabold text-slate-805 text-sm line-clamp-1">{h.name}</h4>
                          {renderStars(h.rating, h.reviewsCount)}
                        </div>
                        <HallOccupancyProgressBar hall={h} />
                        <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">{h.description || 'لا يوجد وصف متاح.'}</p>
                        <div className="mt-2.5 flex flex-wrap gap-1 text-[10px] text-slate-500">
                          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">المدينة: {h.city}</span>
                          <span className="bg-slate-50 px-2 py-0.5 rounded border border-slate-200">الاستيعاب: {h.capacity || 0} شخص</span>
                          <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-100 font-bold">المساء: {formatCurrency(h.nightPrice || h.price || 0)}</span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                            h.pricingModel === 'bundle' ? 'bg-amber-100 text-amber-850 border border-amber-200' : 'bg-blue-50 text-blue-800 border border-blue-105'
                          }`}>
                            {h.pricingModel === 'bundle' ? 'النمط أ: باقة مغلقة' : 'النمط ب: أساسي + اختيارية'}
                          </span>
                          {h.enableExternalMarket && (
                            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-100 text-violet-850 border border-violet-200">
                              النمط ج: سوق الشركاء m-c
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="pt-2.5 border-t border-slate-100 flex items-center gap-1.5 justify-end">
                        <ItemQrCodeButton
                          item={{ id: h.id, name: h.name, type: 'hall', provider: h.provider, city: h.city, image: h.images?.[0] }}
                          variant="badge"
                        />
                        <button
                          onClick={() => { setStoreModalHall(h); setIsVenueStoreModalOpen(true); }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors flex items-center gap-1 cursor-pointer"
                          title="إدارة وتخصيص المتجر المصغر 🛍️"
                        >
                          <ShoppingBag className="w-3 h-3 text-amber-600" /> المتجر 🛍️
                        </button>
                        <button
                          onClick={() => { setViewingHall(h); setIsHallViewModalOpen(true); }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3 text-blue-500" /> تفاصيل
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(h);
                            setHallForm({
                              ...h,
                              images: h.images || [],
                              extraServicesList: h.extraServicesList || [],
                              bundlesList: h.bundlesList || (h.pricingModel === 'bundle' ? [{ id: 'default', name: h.bundleName || 'باقة الفخامة المتكاملة', inclusions: h.bundleInclusions || '', isVisible: true }] : [])
                            });
                            setHallModalStep(1);
                            setIsHallModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 rounded-lg text-[10px] font-bold bg-purple-55 hover:bg-purple-50 text-purple-700 border border-purple-100 transition-colors flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> تعديل
                        </button>
                        <button
                          onClick={() => handleHallDelete(h.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-650 hover:bg-red-100 border border-red-100 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Hall Pagination */}
          {hallsTotalPages > 1 && (
            <div className="flex justify-center items-center gap-1 mt-6">
              <button
                disabled={hallsCurrentPage === 1}
                onClick={() => setHallsCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs disabled:opacity-40"
              >
                السابق
              </button>
              {Array.from({ length: hallsTotalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setHallsCurrentPage(page)}
                  className={`w-8 h-8 rounded-lg text-xs font-bold ${page === hallsCurrentPage ? 'bg-amber-500 text-white shadow-xs' : 'border border-slate-200 hover:bg-slate-100 bg-white'}`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={hallsCurrentPage === hallsTotalPages}
                onClick={() => setHallsCurrentPage(p => Math.min(hallsTotalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs disabled:opacity-40"
              >
                التالي
              </button>
            </div>
          )}
        </div>

      {/* ==================================== MODALS ==================================== */}

      {/* Google Maps Coordinates Selection modal */}
      {isMapModalOpen && (
        <GoogleMapsModal
          isOpen={isMapModalOpen}
          onClose={() => { setIsMapModalOpen(false); setMapTarget(null); }}
          onConfirm={handleMapConfirm}
          initialAddress={mapTarget?.type === 'hall' ? hallForm.nationalAddress : ''}
        />
      )}

      {/* Hall Details View Modal */}
      {isHallViewModalOpen && viewingHall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative animate-in zoom-in-95 duration-200">
            <div className="absolute left-4 top-4 flex items-center gap-2">
              <ItemQrCodeButton
                item={{ id: viewingHall.id, name: viewingHall.name, type: 'hall', provider: viewingHall.provider, city: viewingHall.city, image: viewingHall.images?.[0] }}
                variant="default"
              />
              <button onClick={() => { setViewingHall(null); setIsHallViewModalOpen(false); }} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <h3 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500 animate-pulse" /> تفاصيل المنشأة أو المرفق: <span className="text-amber-600">{viewingHall.name}</span>
            </h3>
            <div className="mt-4 space-y-4 text-xs text-slate-700 leading-relaxed font-semibold">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-450 block mb-1">الهاست / المزود المسؤول:</span>
                  <strong>{viewingHall.hostName || 'منصة ليلة'}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-450 block mb-1">البريد الإلكتروني للإشعارات والتنسيق:</span>
                  <strong className="font-mono">{viewingHall.email || 'info@layla.com'}</strong>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2">
                <h5 className="text-[11px] font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 mb-2">الوصف التعريفي للعملاء</h5>
                <p className="text-slate-650 text-[11px]">{viewingHall.description || 'لا يوجد تفاصيل إضافية.'}</p>
              </div>
              <div className="grid grid-cols-3 gap-3 bg-amber-50/25 p-3 rounded-xl border border-amber-50">
                <div>
                  <span className="text-[10px] text-slate-500 block">سعر الفترة الصباحية:</span>
                  <strong className="text-amber-700 text-sm font-mono">{formatCurrency(viewingHall.morningPrice || 0)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">سعر الفترة المسائية:</span>
                  <strong className="text-amber-700 text-sm font-mono">{formatCurrency(viewingHall.nightPrice || 0)}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 block">سعر اليوم الكامل:</span>
                  <strong className="text-amber-700 text-sm font-mono">{formatCurrency(viewingHall.fullDayPrice || 0)}</strong>
                </div>
              </div>

              {/* Pricing Section Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2.5">
                <h5 className="text-[11px] font-extrabold text-slate-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
                  <span>أنماط التسعير وعقود الخدمات المفعلة</span>
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black ${
                    viewingHall.pricingModel === 'bundle' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {viewingHall.pricingModel === 'bundle' ? 'النمط أ (الباقة المغلقة)' : 'النمط ب (أساسي + اختيارية)'}
                  </span>
                </h5>
                {viewingHall.pricingModel === 'bundle' ? (
                  <div className="space-y-2">
                    {viewingHall.bundlesList && Array.isArray(viewingHall.bundlesList) && viewingHall.bundlesList.length > 0 ? (
                      <div className="space-y-2 pt-1">
                        <p className="text-[10px] font-bold text-amber-900">الباقات النشطة المتوفرة بالصالة:</p>
                        <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto pl-1">
                          {viewingHall.bundlesList.map((bnd: any, bIdx: number) => (
                            <div key={bnd.id || bIdx} className="p-2 border border-slate-200 bg-white rounded-lg space-y-0.5 text-[10px]">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-slate-800 font-sans">{bIdx + 1}. {bnd.name}</span>
                                {bnd.isVisible === false && <span className="text-[8px] bg-slate-100 text-slate-500 px-1 rounded font-bold">مخفية</span>}
                              </div>
                              <p className="text-slate-500"><strong className="text-amber-700">المشمولات:</strong> {bnd.inclusions}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-[11px] text-slate-800">
                          <strong>اسم الباقة:</strong> {viewingHall.bundleName || 'باقة الفخامة المتكاملة'}
                        </p>
                        <p className="text-[11px] text-slate-600">
                          <strong>محتوى الباقة والمشتملات:</strong> {viewingHall.bundleInclusions || 'لا يوجد تفاصيل.'}
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-500">
                    يتم حجز المساحة فارغة بحدها الأدنى، مع إتاحة سحب الخدمات الإضافية الاختيارية الفردية للعملاء ليتصاعد السعر الإجمالي بمرونة تامة.
                  </p>
                )}

                {/* Open Market Pattern C status */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500">سوق الخدمات المفتوح (النمط ج):</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-black ${
                    viewingHall.enableExternalMarket ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'
                  }`}>
                    {viewingHall.enableExternalMarket ? '✓ مفعّل للشركاء الخارجيين' : '✕ غير مفعّل'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hall Supporting Services Management Modal */}
      {isHallServicesModalOpen && managingHall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col relative animate-in zoom-in-95 duration-200">
            <div className="p-4 bg-gradient-to-r from-purple-50 to-slate-50 border-b border-slate-150 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-purple-650" />
                <div>
                  <h3 className="text-sm font-black text-slate-800">إدارة الخدمات الإضافية التكميلية (صالة {managingHall.name})</h3>
                  <p className="text-[10px] text-slate-400">تخصيص وإطلاق خدمات وتكليفات مرئية مخصصة للعملاء أثناء حجز هذه القاعة</p>
                </div>
              </div>
              <button onClick={() => { setManagingHall(null); setIsHallServicesModalOpen(false); }} className="p-1.5 hover:bg-slate-150 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <div className="flex justify-between items-center mb-4">
                <span className="text-xs font-bold text-slate-500">مجموع الخدمات المدرجة: {(managingHall.extraServicesList || []).length} خدمات</span>
                <button
                  onClick={() => setIsAddServiceModalOpen(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> إضافة خدمة جديدة الآن
                </button>
              </div>

              {(managingHall.extraServicesList || []).length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-150 border-dashed">
                  <Layers className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-400 mt-2 font-bold">لا يوجد أي خدمات إضافية نشطة لهذه القاعة حتى الآن.</p>
                </div>
              ) : (
                <div className="bg-white border border-slate-150 rounded-xl overflow-hidden shadow-xs">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 border-b border-slate-150 text-slate-650 font-bold">
                      <tr>
                        <th className="p-3">اسم الخدمة</th>
                        <th className="p-3">تفاصيل الخدمة ومميزاتها</th>
                        <th className="p-3">العدد المتاح</th>
                        <th className="p-3">التسعير</th>
                        <th className="p-3 text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {(managingHall.extraServicesList || []).map((serv: any) => (
                        <tr key={serv.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3 font-bold text-slate-805">{serv.name}</td>
                          <td className="p-3 text-slate-450 truncate max-w-[200px]">{serv.description || serv.desc || 'لا يوجد تفاصيل.'}</td>
                          <td className="p-3 font-mono text-slate-700">{serv.quantity || serv.qty || 'غير محدود'}</td>
                          <td className="p-3 text-purple-700 font-bold font-mono">{formatCurrency(serv.price || 0)}</td>
                          <td className="p-3 flex justify-center items-center gap-1.5">
                            <button
                              onClick={() => {
                                setEditingItem(serv);
                                setIsAddServiceModalOpen(true);
                              }}
                              className="p-1 text-slate-400 hover:text-amber-600 rounded cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                if (!confirm("شطب الخدمة وإلغاء إدراجها؟")) return;
                                const updatedServices = (managingHall.extraServicesList || []).filter((x: any) => x.id !== serv.id);
                                const targetHall = halls.find((h: any) => h.id === managingHall.id) || managingHall;
                                const updatedHall = {
                                  ...targetHall,
                                  extraServicesList: updatedServices,
                                  extraServices: updatedServices,
                                  services: updatedServices
                                };
                                const updatedHalls = halls.map((hall: any) =>
                                  hall.id === managingHall.id ? updatedHall : hall
                                );
                                setHalls(updatedHalls);
                                setManagingHall(updatedHall);
                                saveStoredHalls(updatedHalls);

                                try {
                                  await fetch(`/api/bookings/halls/${managingHall.id}`, {
                                    method: "PUT",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify(updatedHall)
                                  });
                                } catch (e) {
                                  console.error("Failed to delete service on cloud backend:", e);
                                }
                                showNotification("success", "تم شطب الخدمة الإضافية وتحديث قاعدة البيانات السحابية بنجاح!");
                              }}
                              className="p-1 text-slate-400 hover:text-red-500 rounded cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
          {isAddServiceModalOpen && (
            <AddServiceModal
              isOpen={isAddServiceModalOpen}
              onClose={() => { setIsAddServiceModalOpen(false); setEditingItem(null); }}
              hallId={managingHall.id}
              hallName={managingHall.name}
              editingItem={editingItem}
              onSave={async (serviceData) => {
                const existingList = managingHall.extraServicesList || [];
                let updatedList;
                if (editingItem) {
                  updatedList = existingList.map((x: any) => x.id === serviceData.id ? { ...x, ...serviceData } : x);
                } else {
                  updatedList = [...existingList, { ...serviceData, id: Date.now().toString() }];
                }

                // 1. Update hall local state & localStorage
                const targetHall = halls.find((h: any) => h.id === managingHall.id) || managingHall;
                const updatedHall = {
                  ...targetHall,
                  extraServicesList: updatedList,
                  extraServices: updatedList,
                  services: updatedList
                };
                const updatedHalls = halls.map((hall: any) =>
                  hall.id === managingHall.id ? updatedHall : hall
                );
                setHalls(updatedHalls);
                setManagingHall(updatedHall);
                saveStoredHalls(updatedHalls);

                // 2. Persist hall extra services to cloud database API
                try {
                  await fetch(`/api/bookings/halls/${managingHall.id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedHall)
                  });
                } catch (e) {
                  console.error("Failed to persist hall extra services to cloud API:", e);
                }

                // 3. Sync to Standalone Services Marketplace if requested
                if (serviceData.syncToMarketplace !== false) {
                  try {
                    const standalonePayload = {
                      name: serviceData.name,
                      description: serviceData.description || serviceData.desc || '',
                      price: Number(serviceData.price) || 0,
                      quantity: serviceData.quantity ? Number(serviceData.quantity) : null,
                      provider: managingHall.provider || currentProviderName || 'مزود الخدمة',
                      providerId: managingHall.providerId || currentProviderId || null,
                      classification: 'خدمة مساندة إضافية',
                      category: 'خدمات إضافية',
                      serviceStatus: 'نشط',
                      approvalStatus: 'approved',
                      hallId: managingHall.id,
                      hallName: managingHall.name
                    };

                    const res = await fetch('/api/bookings/services', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(standalonePayload)
                    });
                    if (res.ok) {
                      const createdService = await res.json();
                      setServices(prev => [createdService, ...prev.filter((s: any) => s.id !== createdService.id)]);
                    }
                  } catch (e) {
                    console.error("Failed to sync standalone service:", e);
                  }
                }

                setIsAddServiceModalOpen(false);
                setEditingItem(null);
                showNotification("success", "تم حفظ وتثبيت الخدمة الإضافية في قاعدة البيانات وسجل القاعة بنجاح!");
              }}
            />
          )}
        </div>
      )}

      {/* Service Details View Modal */}
      {isServiceViewModalOpen && viewingService && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-205">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 relative animate-in zoom-in-95 duration-200">
            <button onClick={() => { setViewingService(null); setIsServiceViewModalOpen(false); }} className="absolute left-4 top-4 p-1.5 hover:bg-slate-150 rounded-full text-slate-405">
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-base font-black text-slate-800 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600 animate-bounce" /> تفاصيل ومزايا الخدمة: <span className="text-purple-700">{viewingService.name}</span>
            </h3>
            <div className="mt-4 space-y-4 text-xs font-semibold text-slate-705 leading-relaxed">
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-450 block">المورد المعتمد:</span>
                  <strong>{viewingService.provider}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-450 block">نوع السداد:</span>
                  <strong>{viewingService.unit || 'مرة واحدة'}</strong>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-450 block">تصنيف الخدمة:</span>
                  <strong>{viewingService.classification || viewingService.category || 'ضيافة'}</strong>
                </div>
              </div>
              <div className="bg-purple-50/20 p-4 rounded-xl border border-purple-100/50 text-[11px]">
                <h5 className="font-extrabold text-purple-800 mb-1">الشروط والأحكام الخاصة بالخدمة</h5>
                <p className="text-slate-650 whitespace-pre-line">{viewingService.terms || 'لا يوجد شروط خاصة مضافة لهذه الخدمة.'}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <span className="text-[10px] text-slate-400 block mb-1">وصف شامل للخدمة والمزايا</span>
                <p className="text-[11px] leading-relaxed text-slate-600">{viewingService.description || 'لا يوجد وصف.'}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hall Modal Form (Multi-Step) */}
      {isHallModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] relative" dir="rtl">
            <div className="bg-gradient-to-r from-amber-50 to-slate-50 p-4 border-b border-slate-150 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 text-slate-900 rounded-xl flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {editingItem ? `تعديل القاعة أو المرفق: ${editingItem.name}` : 'تدشير صالة أفراح أو مرفق تكميلي جديد'}
                  </h3>
                  <p className="text-[9px] text-slate-400">يرجى اتباع خطوت التسجيل لإتمام المزامنة الفورية مع الخادم بنجاح</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMediaGuideOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition-all cursor-pointer border border-emerald-400/30 active:scale-95 shrink-0"
                  title="فتح دليل واشتراطات الوسائط والمعايير الأفقية (16:9)"
                >
                  <Camera className="w-4 h-4 text-emerald-100" />
                  <span>📷 دليل وااشتراطات الوسائط (16:9)</span>
                </button>
                <button type="button" onClick={() => setIsHallModalOpen(false)} className="p-1.5 hover:bg-slate-150 rounded-full text-slate-400">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-150 flex items-center justify-around text-xs font-bold text-slate-400 shrink-0 select-none">
              <span className={hallModalStep === 1 ? 'text-amber-600' : ''}>١. معلومات التواصل والمزود</span>
              <span>←</span>
              <span className={hallModalStep === 2 ? 'text-amber-600' : ''}>٢. الموقع الجغرافي والعنوان</span>
              <span>←</span>
              <span className={hallModalStep === 3 ? 'text-amber-600' : ''}>٣. الاستيعاب والتسعير والتدرج</span>
              <span>←</span>
              <span className={hallModalStep === 4 ? 'text-amber-600' : ''}>٤. المعالم الإضافية والخدمة</span>
              <span>←</span>
              <span className={hallModalStep === 5 ? 'text-amber-600' : ''}>٥. الألبوم والاعتماد النهائي</span>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs font-semibold text-slate-700 leading-relaxed max-h-[55vh]">
              {/* Step 1: Provider Details */}
              {hallModalStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  
                  {/* Provider Association Controls */}
                  {userRole === 'admin' ? (
                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-150 space-y-2">
                      <label className="block font-bold text-slate-800">
                        {editingItem ? 'المزود المرتبط بالقاعة (تعديل)' : 'اختيار الشريك المزود للمرفق '} <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={hallForm.providerId || ''}
                        onChange={(e) => {
                          const pId = e.target.value ? Number(e.target.value) : null;
                          const foundProv = providers?.find(p => Number(p.id || p.dbId) === Number(pId));
                          setHallForm({
                            ...hallForm,
                            providerId: pId,
                            provider: foundProv ? foundProv.name : '',
                            phone: foundProv ? (foundProv.phone || '') : '',
                            email: foundProv ? (foundProv.email || '') : ''
                          });
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none font-bold text-slate-700 bg-white focus:border-amber-500"
                      >
                        <option value="">-- اختر مزود الخدمة المالك للمرفق --</option>
                        {providers?.map((p: any) => (
                          <option key={p.id} value={p.id}>
                            {p.name} {p.phone ? `(${p.phone})` : ''}
                          </option>
                        ))}
                      </select>
                      <p className="text-[10px] text-slate-400">يرتبط هذا المرفق برقم المزود الفريد وتدار فواتيره وحجوزاته من خلاله.</p>
                    </div>
                  ) : (
                    editingItem && (
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-150">
                        <span className="block text-[10px] text-slate-400">المزود المالك للمرفق</span>
                        <span className="text-xs font-black text-slate-800">{hallForm.provider}</span>
                      </div>
                    )
                  )}

                  {/* Toggle: Show Provider Name to Customers */}
                  <div className="pt-1 pb-2">
                    <label className="flex items-center gap-2 font-bold cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={hallForm.showProvider !== false}
                        onChange={e => setHallForm({ ...hallForm, showProvider: e.target.checked })}
                        className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                      />
                      <span className="text-xs font-black text-slate-755">إظهار اسم المزود للعملاء</span>
                    </label>
                    <p className="text-[10px] text-slate-400 mt-1">
                      (عند التفعيل يسمح بإظهار اسم المزود للعملاء في واجهة العميل، وعند التعطيل يمنع إظهار اسم المزود للعملاء في واجهة العميل)
                    </p>
                  </div>

                  {/* Name and basic details */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold">اسم المنشأة أو المرفق <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={hallForm.name || ''}
                        onChange={e => setHallForm({ ...hallForm, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-slate-800 font-bold focus:border-amber-500 bg-slate-50/10 focus:bg-white"
                        placeholder="قاعة ليلة التاج الحالم..."
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">تصنيف المنشأة الأساسي <span className="text-red-500">*</span></label>
                      <select
                        value={hallForm.category || 'قاعة أفراح'}
                        onChange={e => setHallForm({ ...hallForm, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-slate-700 font-bold focus:border-amber-500 bg-white"
                      >
                        {hallCategories.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contact Info (Administrative, Private) */}
                  <div className="grid grid-cols-2 gap-4 bg-amber-500/5 p-3.5 rounded-xl border border-amber-500/10">
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="font-bold">جوال للتواصل (خاص بالإدارة) <span className="text-red-500">*</span></label>
                        <span className="text-[9px] text-slate-400">لا يظهر للعملاء</span>
                      </div>
                      <input
                        type="text"
                        maxLength={10}
                        value={hallForm.phone || ''}
                        onChange={e => {
                          const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                          setHallForm({ ...hallForm, phone: val });
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none font-bold focus:border-amber-500 bg-white text-left font-mono"
                        placeholder="05xxxxxxxx"
                        dir="ltr"
                      />
                      {hallForm.phone && hallForm.phone.length < 10 && (
                        <p className="text-[10px] text-orange-500 font-bold mt-1">يجب أن يتكون رقم الجوال من 10 أرقام (متبقي {10 - hallForm.phone.length})</p>
                      )}
                    </div>

                    <div>
                      <label className="block mb-1 font-bold">البريد الإلكتروني للتواصل</label>
                      <input
                        type="email"
                        value={hallForm.email || ''}
                        onChange={e => setHallForm({ ...hallForm, email: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white"
                        placeholder="contact@provider.com"
                      />
                      {hallForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(hallForm.email) && (
                        <p className="text-[10px] text-red-500 font-bold mt-1">يرجى كتابة بريد إلكتروني بصيغة صحيحة ⚠️</p>
                      )}
                    </div>
                  </div>

                  {/* Facility Type Classification */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold">النوع (نوع المرفق) <span className="text-red-500">*</span></label>
                      <select
                        value={hallForm.facilityType || 'منشأة تجارية'}
                        onChange={e => setHallForm({ ...hallForm, facilityType: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none font-bold text-slate-800 bg-white focus:border-amber-500"
                      >
                        <option value="منشأة تجارية">منشأة تجارية</option>
                        <option value="فرد">فرد</option>
                      </select>
                    </div>
                  </div>

                  {/* Commercial Facility Fields */}
                  {hallForm.facilityType === 'منشأة تجارية' && (
                    <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-150">
                      <div>
                        <label className="block mb-1 font-bold">رقم السجل التجاري <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          maxLength={10}
                          value={hallForm.crNumber || ''}
                          onChange={e => {
                            const val = e.target.value.replace(/\D/g, '').substring(0, 10);
                            setHallForm({ ...hallForm, crNumber: val });
                          }}
                          className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white font-mono text-left"
                          placeholder="رقم السجل من 10 خانات"
                          dir="ltr"
                        />
                        {hallForm.crNumber && hallForm.crNumber.length < 10 && (
                          <p className="text-[10px] text-orange-500 font-bold mt-1">يجب أن يتكون السجل من 10 أرقام (متبقي {10 - hallForm.crNumber.length})</p>
                        )}
                      </div>

                      <div>
                        <label className="block mb-1 font-bold">تاريخ انتهاء السجل التجاري <span className="text-red-500">*</span></label>
                        <input
                          type="date"
                          value={hallForm.crExpiryDate || ''}
                          onChange={e => setHallForm({ ...hallForm, crExpiryDate: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white font-mono"
                        />
                        {hallForm.crExpiryDate && (
                          <div className="mt-1 flex flex-col gap-0.5">
                            <span className="text-[10px] text-amber-600 font-extrabold">الموافق بالهجري: {getFullDateInfo(new Date(hallForm.crExpiryDate)).hijri.full}</span>
                            {new Date(hallForm.crExpiryDate) < new Date() && (
                              <span className="text-[10px] text-red-500 font-bold">⚠️ تنبيه: تاريخ السجل منتهي! لا يسمح باعتماد المرفق بسجل منتهي.</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Narrative details */}
                  <div>
                    <label className="block mb-1 font-bold">نبذة تعريفية للمرفق ووصف للعملاء بليونة</label>
                    <textarea
                      value={hallForm.description || ''}
                      onChange={e => setHallForm({ ...hallForm, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none h-24 font-normal"
                      placeholder="صف فخامة الصالة ومواصفاتها لجذب العملاء..."
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Location Map Coordinates */}
              {hallModalStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold">المنطقة <span className="text-red-500">*</span></label>
                      <select
                        value={hallForm.region || ''}
                        onChange={e => setHallForm({ ...hallForm, region: e.target.value, city: '' })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                      >
                        <option value="">اختر المنطقة</option>
                        {regions.map(r => <option value={r.name} key={r.id}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">المدينة المستهدفة <span className="text-red-500">*</span></label>
                      <select
                        value={hallForm.city || ''}
                        onChange={e => setHallForm({ ...hallForm, city: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                        disabled={!hallForm.region}
                      >
                        <option value="">اختر المدينة</option>
                        {regions.find(r => r.name === hallForm.region)?.cities.map((city: string) => (
                          <option value={city} key={city}>{city}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-bold">تفاصيل العنوان الوطني / الرابط الإحداثي الفوري</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={hallForm.nationalAddress || ''}
                        onChange={e => setHallForm({ ...hallForm, nationalAddress: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                        placeholder="العنوان الوطني الفعلي..."
                      />
                      <button
                        type="button"
                        onClick={() => { setMapTarget({ type: 'hall', field: 'nationalAddress' }); setIsMapModalOpen(true); }}
                        className="px-4 py-2 bg-slate-900 border border-slate-900 text-white hover:bg-slate-800 rounded-xl transition-colors shrink-0 text-[11px] font-black cursor-pointer flex items-center gap-1.5"
                      >
                        <MapPin className="w-4 h-4 text-emerald-450 animate-bounce" /> الخارطة التفاعلية
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block mb-1 font-bold">تفصيل العنوان وصعوبة الوصول (معالم مميزة للجذب)</label>
                    <textarea
                      value={hallForm.extraAddress || ''}
                      onChange={e => setHallForm({ ...hallForm, extraAddress: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none h-20 font-normal focus:border-amber-500 bg-white"
                      placeholder="امتداد شارع الملك فهد، خلف بنك الرياض وخلف فندق الهوليداي إن..."
                    />
                  </div>
                </div>
              )}

              {/* Step 3: Pricing and Weekend Multiplier */}
              {hallModalStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 font-bold">سعة الاستيعاب (شخص) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={hallForm.capacity || ''}
                        onChange={e => setHallForm({ ...hallForm, capacity: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200"
                        placeholder="مثال: 500 شخص"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">فترة استرجاع العميل (يوم) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={hallForm.cancellationPeriod ?? ''}
                        onChange={e => setHallForm({ ...hallForm, cancellationPeriod: e.target.value })}
                        className="w-full p-2 rounded-lg border border-slate-200"
                        placeholder="مثال: 15 يوم"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">مبلغ التأمين المسترد (ر.س) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={hallForm.security_deposit_amount ?? 1000}
                        onChange={e => setHallForm({ ...hallForm, security_deposit_amount: Number(e.target.value) })}
                        className="w-full p-2 rounded-lg border border-slate-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                    <div>
                      <label className="block mb-1 font-bold">التأجير: الفترة الصباحية</label>
                      <input
                        type="number"
                        value={hallForm.morningPrice ?? 0}
                        onChange={e => setHallForm({ ...hallForm, morningPrice: Number(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg border border-slate-250 font-bold font-mono text-amber-750"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">التأجير: الفترة المسائية</label>
                      <input
                        type="number"
                        value={hallForm.nightPrice ?? 0}
                        onChange={e => setHallForm({ ...hallForm, nightPrice: Number(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg border border-slate-250 font-bold font-mono text-amber-750"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">التأجير: اليوم بالكامل</label>
                      <input
                        type="number"
                        value={hallForm.fullDayPrice ?? 0}
                        onChange={e => setHallForm({ ...hallForm, fullDayPrice: Number(e.target.value) || 0 })}
                        className="w-full p-2 rounded-lg border border-slate-250 font-bold font-mono text-amber-750"
                      />
                    </div>
                  </div>

                  <div className="bg-amber-500/5 p-4 rounded-xl border border-amber-500/20 space-y-3">
                    <h5 className="font-extrabold text-amber-800 text-[11px]">مقياس معامل تسعير عطلة نهاية الأسبوع (الويكند)</h5>
                    <div className="grid grid-cols-4 gap-3">
                      <div>
                        <label className="block mb-1 font-bold text-[10px]">نوع الزيادة</label>
                        <select
                          value={hallForm.weekendMultiplierType || 'percentage'}
                          onChange={e => setHallForm({ ...hallForm, weekendMultiplierType: e.target.value })}
                          className="w-full p-2 rounded border border-slate-200 text-[10px] h-9 bg-white"
                        >
                          <option value="percentage">نسبة مئوية (%)</option>
                          <option value="fixed">مبلغ ثابت (ر.س)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 font-bold text-[10px]">الزيادة الصباحية</label>
                        <input
                          type="number"
                          value={hallForm.weekend_morning_margin ?? 0}
                          onChange={e => setHallForm({ ...hallForm, weekend_morning_margin: Number(e.target.value) })}
                          className="w-full p-2 rounded border border-slate-200 font-mono text-[10px] h-9 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold text-[10px]">الزيادة المسائية</label>
                        <input
                          type="number"
                          value={hallForm.weekend_night_margin ?? 0}
                          onChange={e => setHallForm({ ...hallForm, weekend_night_margin: Number(e.target.value) })}
                          className="w-full p-2 rounded border border-slate-200 font-mono text-[10px] h-9 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block mb-1 font-bold text-[10px]">زيادة اليوم الهامشي</label>
                        <input
                          type="number"
                          value={hallForm.weekend_fullDay_margin ?? 0}
                          onChange={e => setHallForm({ ...hallForm, weekend_fullDay_margin: Number(e.target.value) })}
                          className="w-full p-2 rounded border border-slate-200 font-mono text-[10px] h-9 bg-white"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Division line for pricing models */}
                  <div className="border-t border-slate-150 my-4 pt-4">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-3">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      أنماط التسعير وتوليف خدمات المنصة والتكامل المالي
                    </h4>

                    {/* Radio Grid representing Mode A, Mode B, and Mode C */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 font-sans">
                      {/* Pricing Mode A - Packages */}
                      <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${hallForm.bookingType === 'packages' || hallForm.pricingModel === 'bundle' ? 'border-amber-500 bg-amber-500/[0.02]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="bookingType"
                            value="packages"
                            checked={hallForm.bookingType === 'packages' || hallForm.pricingModel === 'bundle'}
                            onChange={() => setHallForm({ 
                              ...hallForm, 
                              bookingType: 'packages', 
                              pricingModel: 'bundle', 
                              bundleName: hallForm.bundleName || 'باقة الفخامة المتكاملة' 
                            })}
                            className="mt-1 text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">🎁 الباقات الشاملة والمغلقة</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Packages-Based</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-550 mt-2 leading-relaxed font-medium">
                          تقديم القاعة كحزمة مغلقة مع خدمات مدمجة (عشاء، كوشة، تصوير، ورود) بسعر موحد مخفض.
                        </p>
                      </label>

                      {/* Pricing Mode B - A La Carte */}
                      <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${hallForm.bookingType === 'alacarte' || (hallForm.pricingModel === 'alacarte' && hallForm.bookingType !== 'venueonly') ? 'border-amber-500 bg-amber-500/[0.02]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="bookingType"
                            value="alacarte"
                            checked={hallForm.bookingType === 'alacarte' || (hallForm.pricingModel === 'alacarte' && hallForm.bookingType !== 'venueonly')}
                            onChange={() => setHallForm({ 
                              ...hallForm, 
                              bookingType: 'alacarte', 
                              pricingModel: 'alacarte' 
                            })}
                            className="mt-1 text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">🛒 الخدمات المنفردة الاختيارية</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">A La Carte</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-550 mt-2 leading-relaxed font-medium">
                          حجز القاعة بسعرها الأساسي فقط، مع إتاحة إضافة خدمات تابعة للمزود بشكل اختياري.
                        </p>
                      </label>

                      {/* Pricing Mode C - Venue Only */}
                      <label className={`p-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col justify-between ${hallForm.bookingType === 'venueonly' || hallForm.pricingModel === 'venueonly' ? 'border-amber-500 bg-amber-500/[0.02]' : 'border-slate-200 bg-white hover:border-slate-300'}`}>
                        <div className="flex items-start gap-2">
                          <input
                            type="radio"
                            name="bookingType"
                            value="venueonly"
                            checked={hallForm.bookingType === 'venueonly' || hallForm.pricingModel === 'venueonly'}
                            onChange={() => setHallForm({ 
                              ...hallForm, 
                              bookingType: 'venueonly', 
                              pricingModel: 'venueonly' 
                            })}
                            className="mt-1 text-amber-500 focus:ring-amber-500"
                          />
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs block">🏰 حجز القاعة المجردة فقط</span>
                            <span className="text-[10px] text-slate-400 mt-0.5 block">Venue Only</span>
                          </div>
                        </div>
                        <p className="text-[10px] text-slate-550 mt-2 leading-relaxed font-medium">
                          حجز مكان القاعة الجغرافي فقط دون إمكانية اختيار أي خدمات داخلية إضافية من المزود.
                        </p>
                      </label>
                    </div>

                    {/* Conditional Fields for Pricing Mode A (Packages) */}
                    {(hallForm.pricingModel === 'bundle' || hallForm.bookingType === 'packages') && (
                      <div className="p-4 bg-amber-500/5 rounded-xl border border-amber-500/20 space-y-4 mb-4 animate-in slide-in-from-top-2 duration-200">
                        <div className="flex justify-between items-center pb-2 border-b border-amber-500/10">
                          <div>
                            <h4 className="font-extrabold text-amber-950 text-xs flex items-center gap-1">
                              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                              مستودع الباقات المغلقة والجاهزة (Style A)
                            </h4>
                            <p className="text-[10px] text-amber-800">
                              الحد المتاح لحسابك الحالي: <span className="font-mono text-amber-900 font-extrabold">{maxBundlesLimit} باقات</span> (مستخدم منها: <span className="font-mono text-amber-900 font-extrabold">{currentBundles.length}</span>)
                            </p>
                          </div>
                          {currentBundles.length < maxBundlesLimit && !showBundleForm && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingBundleId(null);
                                setBundleInputName('');
                                setBundleInputInclusions('');
                                setBundleInputVisible(true);
                                setBundleInputMorningPrice('');
                                setBundleInputNightPrice('');
                                setBundleInputFullDayPrice('');
                                setShowBundleForm(true);
                              }}
                              className="bg-amber-650 hover:bg-amber-700 text-amber-950 hover:text-white bg-amber-550 border border-amber-500/30 text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" /> إضافة باقة جديدة
                            </button>
                          )}
                        </div>

                        {/* Live Multi-bundle list */}
                        <div className="grid grid-cols-1 gap-2.5">
                          {currentBundles.map((bnd, bIndex) => (
                            <div key={bnd.id || bIndex} className={`bg-white p-3 rounded-xl border-2 transition-all flex justify-between items-start ${bnd.isVisible ? 'border-amber-500/20 bg-amber-500/[0.01]' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
                              <div className="space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="w-1.5 h-1.5 rounded bg-amber-500"></span>
                                  <p className="font-black text-slate-800 text-[11px]">{bnd.name}</p>
                                  {!bnd.isVisible && <span className="text-[8px] bg-slate-200 text-slate-650 px-1 py-0.2 rounded font-bold">مخفية</span>}
                                </div>
                                <p className="text-[10px] text-slate-650 font-medium pl-3">
                                  <span className="text-amber-700 font-bold text-[9px]">المكونات:</span> {bnd.inclusions || 'لا توجد خدمات مضافة بعد'}
                                </p>
                                {(bnd.morningPrice || bnd.nightPrice || bnd.fullDayPrice) ? (
                                  <div className="flex gap-2.5 text-[9px] text-slate-500 font-mono pl-3 pt-1">
                                    {bnd.morningPrice ? <span>صباحي: <span className="font-bold text-slate-700">{bnd.morningPrice} ر.س</span></span> : null}
                                    {bnd.nightPrice ? <span>مسائي: <span className="font-bold text-slate-700">{bnd.nightPrice} ر.س</span></span> : null}
                                    {bnd.fullDayPrice ? <span>كامل اليوم: <span className="font-bold text-slate-700">{bnd.fullDayPrice} ر.س</span></span> : null}
                                  </div>
                                ) : null}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingBundleId(bnd.id || String(bIndex));
                                    setBundleInputName(bnd.name);
                                    setBundleInputInclusions(bnd.inclusions || '');
                                    setBundleInputVisible(bnd.isVisible !== false);
                                    setBundleInputMorningPrice(bnd.morningPrice || '');
                                    setBundleInputNightPrice(bnd.nightPrice || bnd.price || '');
                                    setBundleInputFullDayPrice(bnd.fullDayPrice || '');
                                    setShowBundleForm(true);
                                  }}
                                  className="text-amber-700 hover:text-amber-800 p-1 rounded hover:bg-amber-500/10 text-[10px] font-bold cursor-pointer"
                                >
                                  <Edit className="w-3 h-3 inline" /> تعديل
                                </button>
                                <button
                                  type="button"
                                  disabled={currentBundles.length <= 1}
                                  onClick={() => {
                                    const filtered = currentBundles.filter((_, idx) => idx !== bIndex);
                                    const newForm = { ...hallForm, bundlesList: filtered };
                                    if (filtered.length > 0) {
                                      newForm.bundleName = filtered[0].name;
                                      newForm.bundleInclusions = filtered[0].inclusions;
                                    } else {
                                      newForm.bundleName = '';
                                      newForm.bundleInclusions = '';
                                    }
                                    setHallForm(newForm);
                                  }}
                                  className="text-red-650 hover:text-red-700 p-1 rounded hover:bg-red-500/10 text-[10px] font-bold disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <Trash2 className="w-3 h-3 inline" /> حذف
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Upgrade callout if they hit the limit */}
                        {currentBundles.length >= maxBundlesLimit && (
                          <div className="bg-amber-100/60 p-2.5 rounded-xl border border-amber-200/50 flex items-center justify-between text-[10px]">
                            <span className="font-extrabold text-amber-900">
                              ⚠️ لقد استنفدت الحد المتاح لباقات الشراكة الحالية ({maxBundlesLimit} باقات).
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                showNotification('info', 'يمكنك التوجه لعلامة تبويب الاشتراكات وشراء حزمة الباقات الإضافية للمتابعة.');
                              }}
                              className="bg-amber-250 hover:bg-amber-300 text-amber-950 font-extrabold px-2.5 py-1 rounded-lg text-[9px] cursor-pointer"
                            >
                              شراء المزيد +
                            </button>
                          </div>
                        )}

                        {/* Dynamic bundle form builder */}
                        {showBundleForm && (
                          <div className="p-3 bg-white rounded-xl border-2 border-dashed border-amber-500/30 space-y-3 relative">
                            <h5 className="font-black text-slate-800 text-[10px] border-b pb-1">
                              {editingBundleId ? 'تعديل بيانات الباقة الجاهزة' : 'إدراج باقة شاملة جديدة'}
                            </h5>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                              <div>
                                <label className="block mb-1 text-slate-700 font-bold text-[9px]">اسم الباقة <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  value={bundleInputName}
                                  onChange={e => setBundleInputName(e.target.value)}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:border-amber-500 outline-none font-bold"
                                  placeholder="الباقة الذهبية، الباقة الملكية المتكاملة..."
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-slate-700 font-bold text-[9px]">الخدمات والشمولات بالباقة <span className="text-red-500">*</span></label>
                                <input
                                  type="text"
                                  value={bundleInputInclusions}
                                  onChange={e => setBundleInputInclusions(e.target.value)}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:border-amber-500 outline-none"
                                  placeholder="عشاء فاخر، تصوير فيديو وصور، تنسيق كوشة..."
                                />
                              </div>
                            </div>

                            {/* Package dynamic period prices */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-amber-500/[0.02] p-2 rounded-lg border border-slate-100">
                              <div>
                                <label className="block mb-1 text-slate-700 font-bold text-[9px]">السعر الصباحي للباقة (ر.س)</label>
                                <input
                                  type="number"
                                  value={bundleInputMorningPrice}
                                  onChange={e => setBundleInputMorningPrice(e.target.value ? Number(e.target.value) : '')}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:border-amber-500 outline-none font-mono"
                                  placeholder="مثال: 5000"
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-slate-700 font-bold text-[9px]">السعر المسائي للباقة (ر.س) <span className="text-red-500">*</span></label>
                                <input
                                  type="number"
                                  value={bundleInputNightPrice}
                                  onChange={e => setBundleInputNightPrice(e.target.value ? Number(e.target.value) : '')}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:border-amber-500 outline-none font-mono font-bold"
                                  placeholder="مثال: 12000"
                                />
                              </div>
                              <div>
                                <label className="block mb-1 text-slate-700 font-bold text-[9px]">سعر اليوم الكامل للباقة (ر.س)</label>
                                <input
                                  type="number"
                                  value={bundleInputFullDayPrice}
                                  onChange={e => setBundleInputFullDayPrice(e.target.value ? Number(e.target.value) : '')}
                                  className="w-full p-2 border border-slate-200 rounded-lg text-[10px] focus:border-amber-500 outline-none font-mono"
                                  placeholder="مثال: 15000"
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                id="bundleInputVisible"
                                checked={bundleInputVisible}
                                onChange={e => setBundleInputVisible(e.target.checked)}
                                className="w-3 h-3 text-amber-500 focus:ring-amber-500 rounded border-slate-300 cursor-pointer"
                              />
                              <label htmlFor="bundleInputVisible" className="text-slate-800 font-bold text-[9px] cursor-pointer block select-none">
                                إتاحة وتفعيل هذه الباقة للعملاء مباشرة على واجهة العرض الأساسية
                              </label>
                            </div>

                            <div className="flex justify-end gap-1.5 pt-1">
                              <button
                                type="button"
                                onClick={() => setShowBundleForm(false)}
                                className="px-2.5 py-1 text-slate-650 hover:bg-slate-100 rounded-lg text-[9px] font-bold cursor-pointer"
                              >
                                إلغاء
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (!bundleInputName.trim() || !bundleInputInclusions.trim()) {
                                    showNotification('error', 'الرجاء إدخال اسم الباقة ومكوناتها للحفظ.');
                                    return;
                                  }
                                  if (!bundleInputNightPrice) {
                                    showNotification('error', 'يرجى إدخال السعر المسائي كحد أدنى لتسعير هذه الباقة.');
                                    return;
                                  }
                                  let updatedList = [...currentBundles];
                                  const packageData = {
                                    id: editingBundleId || 'bundle_' + Date.now(),
                                    name: bundleInputName.trim(),
                                    inclusions: bundleInputInclusions.trim(),
                                    desc: bundleInputInclusions.trim(),
                                    isVisible: bundleInputVisible,
                                    morningPrice: bundleInputMorningPrice ? Number(bundleInputMorningPrice) : undefined,
                                    nightPrice: bundleInputNightPrice ? Number(bundleInputNightPrice) : undefined,
                                    fullDayPrice: bundleInputFullDayPrice ? Number(bundleInputFullDayPrice) : undefined,
                                    price: Number(bundleInputNightPrice || bundleInputFullDayPrice || 0)
                                  };

                                  if (editingBundleId) {
                                    const targetIdx = updatedList.findIndex((item) => item.id === editingBundleId);
                                    if (targetIdx !== -1) {
                                      updatedList[targetIdx] = packageData;
                                    } else {
                                      const fallbackIdx = Number(editingBundleId);
                                      if (!isNaN(fallbackIdx) && fallbackIdx >= 0 && fallbackIdx < updatedList.length) {
                                        updatedList[fallbackIdx] = packageData;
                                      }
                                    }
                                  } else {
                                    updatedList.push(packageData);
                                  }

                                  const newForm = {
                                    ...hallForm,
                                    bundlesList: updatedList,
                                    bundleName: updatedList[0]?.name || '',
                                    bundleInclusions: updatedList[0]?.inclusions || ''
                                  };

                                  setHallForm(newForm);
                                  setShowBundleForm(false);
                                }}
                                className="px-3 py-1 bg-amber-600 text-white hover:bg-amber-700 rounded-lg text-[9px] font-bold cursor-pointer"
                              >
                                {editingBundleId ? 'تعديل وحفظ' : 'إضافة وتثبيت بالصالة'}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Interactive advisory warning */}
                        <div className="bg-amber-500/10 p-2 text-[10px] text-amber-900 border border-amber-500/10 leading-relaxed font-bold flex items-start gap-1.5 rounded-lg">
                          <span className="shrink-0 font-bold text-amber-700 text-xs">⚠️ تنبيه ذكي وتدفق مالي:</span>
                          <p>
                            يرجى الانتباه إلى أن السعر الإجمالي لهذه الباقة المغلقة هو السعر المحدد للفترة بالأسفل (صباحي/مسائي/يوم كامل) لضمان منع أي تشتيت للعميل ولتدفق مالي سليم.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Mode C check - Mixed partners */}
                    <div className="p-3 bg-violet-50/70 rounded-xl border border-violet-150 flex items-start gap-2.5">
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          id="enableExternalMarket"
                          checked={hallForm.enableExternalMarket || false}
                          onChange={e => setHallForm({ ...hallForm, enableExternalMarket: e.target.checked })}
                          className="w-3.5 h-3.5 text-violet-600 rounded border-slate-300 focus:ring-violet-500 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-0.5">
                        <label htmlFor="enableExternalMarket" className="font-extrabold text-violet-950 text-[11px] cursor-pointer block select-none">
                          تفعيل سوق الخدمات المفتوح لشركاء المنصة الخارجيين (الموردين)
                        </label>
                        <p className="text-[10px] text-violet-700 leading-relaxed">
                          عند التفعيل، يتحول الحجز تلقائياً إلى حجز هجين ذكي (النمط ج) يسحب خدمات مساندة مباشرة من سوق شركاء المنصة (مأكولات، زفة، تصميم، استقبال) برابط مالي متقدم وتلقائي.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Pricing Integration, Tax & Operations Header */}
                  <div className="border-t border-slate-150 pt-4 mt-6">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 mb-4">
                      <Landmark className="w-4 h-4 text-amber-500" />
                      الضرائب، خيارات الدفع والجاهزية للحجوزات
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Section A: Tax Registration */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-slate-800 text-xs">زر تبديل الإعفاء للتصريح الضريبي</span>
                            <p className="text-[10px] text-slate-400">تفعيل الإعفاء يلغي وجوب إضافة الرقم الضريبي في الفواتير لحساب المرفق.</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              const nextExempt = !hallForm.taxExempt;
                              setHallForm({
                                ...hallForm,
                                taxExempt: nextExempt,
                                taxNumber: nextExempt ? '' : (hallForm.taxNumber || '')
                              });
                            }}
                            className={`w-11 h-6 rounded-full transition-all relative ${hallForm.taxExempt ? 'bg-emerald-500' : 'bg-slate-350'}`}
                          >
                            <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${hallForm.taxExempt ? 'right-5.5' : 'right-0.5'}`} />
                          </button>
                        </div>

                        {!hallForm.taxExempt ? (
                          <div className="space-y-1">
                            <label className="block text-[11px] font-bold text-slate-700">
                              رقم تسجيل ضريبة القيمة المضافة <span className="text-red-500">*</span>
                            </label>
                            <input
                              type="text"
                              maxLength={15}
                              value={hallForm.taxNumber || ''}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '').substring(0, 15);
                                setHallForm({ ...hallForm, taxNumber: val });
                              }}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-mono text-left outline-none focus:border-amber-500 text-xs font-bold"
                              placeholder="3xxxxxxxxxxxxxx"
                              dir="ltr"
                            />
                            {hallForm.taxNumber && (
                              <div className="space-y-0.5 mt-1">
                                {hallForm.taxNumber.length < 15 && (
                                  <p className="text-[10px] text-orange-500 font-extrabold">الرقم الضريبي يجب أن يكون 15 خانة كاملة (الحالي {hallForm.taxNumber.length})</p>
                                )}
                                {!hallForm.taxNumber.startsWith('3') && (
                                  <p className="text-[10px] text-red-500 font-extrabold">يجب أن يبدأ الرقم الضريبي بالرقم (3) كشرط أساسي بهيئات الزكاة ⚠️</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between text-[11px] text-emerald-850">
                            <span className="font-extrabold">مرفق معفى من الضرائب رسمياً</span>
                            <span className="text-[10px] text-emerald-700">لا يتطلب رقم ضريبي</span>
                          </div>
                        )}
                      </div>

                      {/* Section B: Predefined Payment Methods */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3">
                        <label className="block font-bold text-xs text-slate-800">طرق الدفع والتعميد المعتمدة للمرفق</label>
                        <p className="text-[10px] text-slate-400">حسب المحدد مسبقاً من الإدارة في قنوات تسوية الحسابات المعتمدة:</p>
                        
                        <div className="space-y-2">
                          {[
                            { id: 'online_full', name: 'كامل المبلغ إلكترونياً (مدى، فيزا، Apple Pay) فوراً' },
                            { id: 'deposit_active', name: 'دفع عربون تأكيدي للباقة والباقي بمقر القاعة' },
                            { id: 'bank_transfer', name: 'الدفع بالتحويل البنكي المباشر المعتمد للإدارة' },
                            { id: 'tabby_tamara', name: 'تقسيط مرن (تابي وتمارا لخدمات التمويل المالي)' }
                          ].map((payOpt) => {
                            const currentMethods = hallForm.paymentMethods || [];
                            const isChecked = currentMethods.includes(payOpt.id);
                            return (
                              <label key={payOpt.id} className="flex items-center gap-2 cursor-pointer select-none text-[10px]">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => {
                                    const nextMethods = isChecked 
                                      ? currentMethods.filter((x: string) => x !== payOpt.id) 
                                      : [...currentMethods, payOpt.id];
                                    setHallForm({ ...hallForm, paymentMethods: nextMethods });
                                  }}
                                  className="w-3.5 h-3.5 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                                />
                                <span className="font-extrabold text-slate-705">{payOpt.name}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Section C: Enterprise Administrative Status & Availability Selector */}
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Administrative Operational Control */}
                        <div>
                          <label className="block mb-1 font-bold text-xs text-slate-800">حالة تشغيل المرفق الإدارية (الإدارة فقط)</label>
                          {userRole === 'admin' ? (
                            <select
                              value={hallForm.activationStatus || 'مفعل'}
                              onChange={e => setHallForm({ ...hallForm, activationStatus: e.target.value })}
                              className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs"
                            >
                              <option value="مفعل">مفعلة (تظهر فورياً للعملاء ويسمح بالحجز)</option>
                              <option value="موقوف">موقوفة إدارياً (مخفية كلياً من واجهة البحث والتعليق)</option>
                            </select>
                          ) : (
                            <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-250 flex items-center justify-between">
                              <span className="font-bold text-slate-700 text-xs">
                                {(hallForm.activationStatus || 'مفعل') === 'موقوف' ? '🛑 موقوفة كلياً بقرار إداري مركزي' : '✅ مفعلة من الإدارة المركزية'}
                              </span>
                              <span className="text-[9px] text-slate-450 font-black">إشعار إداري مغلق</span>
                            </div>
                          )}
                          <p className="text-[10px] text-slate-400 mt-1">المرفق الإداري غير مفعل يوقف ظهوره وجميع معاملاته للمستهلك النهائي.</p>
                        </div>

                        {/* 2. Provider Availability Reservation Status */}
                        <div>
                          <label className="block mb-1 font-bold text-xs text-slate-800">حالة جاهزية الحجز الفوري (المزود)</label>
                          <select
                            value={hallForm.bookingStatus || 'متاحة'}
                            onChange={e => setHallForm({ ...hallForm, bookingStatus: e.target.value })}
                            className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold text-slate-800 text-xs"
                          >
                            <option value="متاحة">متاحة (جاهزة كلياً لاستقبال الحجوزات الفورية)</option>
                            <option value="صيانة">تحت الصيانة (تظهر للعملاء مع إشعار صيانة ومقفل الحجز)</option>
                            <option value="معطلة">معطلة تماماً (مخفية بالكامل ولا تظهر للجمهور)</option>
                          </select>
                          <p className="text-[10px] text-slate-400 mt-1">تتيح لك إدارة فترات التجهيز والصيانة الطارئة للأصول والمنشآت بحرية.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Features and Extra Services */}
              {hallModalStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Mini-Store Management Card in Step 4 */}
                  <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 p-4 rounded-2xl border border-amber-300/80 shadow-2xs space-y-2.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold shadow-xs">
                          <ShoppingBag className="w-5 h-5" />
                        </div>
                        <div>
                          <h5 className="text-xs font-black text-slate-900">متجر المستلزمات والمنتجات المصغر للقاعة 🛍️</h5>
                          <p className="text-[10px] text-slate-500">تخصيص مستلزمات الضيافة، المشروبات، الأثاث، والمخزون المعروض للعملاء أثناء حجز هذه القاعة</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setStoreModalHall(editingItem || hallForm);
                          setIsVenueStoreModalOpen(true);
                        }}
                        className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95 border border-amber-400"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>إدارة وتخصيص المتجر المصغر 🛍️</span>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold text-xs text-slate-800">باقة الخدمات الإضافية التكميلية المدرجة للقاعة</label>
                    <div className="grid grid-cols-4 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <input
                        type="text"
                        placeholder="اسم الخدمة..."
                        value={extraServiceName}
                        onChange={e => setExtraServiceName(e.target.value)}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                      />
                      <input
                        type="number"
                        placeholder="الكمية المتاحة..."
                        value={extraServiceQuantity}
                        onChange={e => setExtraServiceQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                      />
                      <input
                        type="number"
                        placeholder="السعر (ر.س)..."
                        value={extraServicePrice}
                        onChange={e => setExtraServicePrice(e.target.value === '' ? '' : Number(e.target.value))}
                        className="p-2.5 rounded-lg border border-slate-200 bg-white text-xs font-bold"
                      />
                      <button
                        type="button"
                        onClick={handleAddOrUpdateExtraService}
                        className="py-2 rounded-xl bg-purple-600 text-white font-extrabold cursor-pointer text-xs"
                      >
                        {editingExtraServiceId ? 'تعديل الخدمة' : 'أضف لقائمتنا'}
                      </button>
                    </div>

                    <div className="mt-2 text-[10px] space-y-1">
                      {(hallForm.extraServicesList || []).map((s: any) => (
                        <div key={s.id} className="flex justify-between items-center bg-slate-100 p-2 rounded">
                          <span className="font-bold text-slate-700">{s.name} - العدد: {s.quantity} - السعر: {formatCurrency(s.price)}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setHallForm({
                                ...hallForm,
                                extraServicesList: (hallForm.extraServicesList || []).filter((x: any) => x.id !== s.id)
                              });
                            }}
                            className="text-red-500 font-extrabold"
                          >
                            شطب
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Amenities (facilities), House Rules, and Contract terms */}
                  <div className="border-t border-slate-150 pt-4 mt-6 space-y-4">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-purple-600" />
                      مرافق المنشأة، الضوابط والضمانات التعاقدية
                    </h4>

                    {/* Facilities (Amenities) input */}
                    <div>
                      <label className="block mb-1 font-bold text-xs text-slate-800">
                        قائمة المرافق والمكونات الأساسية المتوفرة (مفصولة بـ "،" أو "،") <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={hallForm.facilities || ''}
                        onChange={e => setHallForm({ ...hallForm, facilities: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold"
                        placeholder="مثال: مواقف سيارات واسعة، جلسات خارجية فاخرة، مطبخ متكامل، جناح للعروسين، أجهزة ليزر وإضاءة"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">المكونات تمنح العميل فرصة معرفة الأصول المتاحة بالصالة مباشرة عند التصفح.</p>
                    </div>

                    {/* House Rules & Contract Terms side-by-side textareas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block font-bold text-xs text-slate-800">
                          قواعد وضوابط المكان المقررة (سطر واحد لكل قاعدة) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={hallForm.rules || ''}
                          onChange={e => setHallForm({ ...hallForm, rules: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-normal text-xs h-32 leading-relaxed"
                          placeholder="اكتب كل قاعدة سلوكية في سطر مستقل:&#10;- يمنع منعاً باتاً التدخين داخل قاعات الجلوس&#10;- يمنع تشغيل الألعاب النارية&#10;- يرجى الالتزام بالحد الأقصى للعدد"
                        />
                        <p className="text-[9px] text-slate-450">تظهر بشكل تعداد نقطي أنيق للعميل قبل شروعه في الحجز.</p>
                      </div>

                      <div className="space-y-1">
                        <label className="block font-bold text-xs text-slate-800">
                          شروط وأحكام العقد والضمان الإيجاري (سطر واحد لكل شرط) <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={hallForm.contractTerms || ''}
                          onChange={e => setHallForm({ ...hallForm, contractTerms: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-normal text-xs h-32 leading-relaxed"
                          placeholder="اكتب كل شرط قانوني في سطر مستقل:&#10;- عربون تأكيد الحجز لا يسترد نهائياً في حال الإلغاء&#10;- يتحمل الشريك أي أضرار ناجمة عن سوء الاستخدام&#10;- دفع إجمالي المستحقات قبل المناسبة بسبعة أيام"
                        />
                        <p className="text-[9px] text-slate-450 font-semibold">بمثابة الضمانة القانونية المبرمة في شاشات الدفع بين الطرفين.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Album Upload & Submit */}
              {hallModalStep === 5 && (
                <div className="space-y-6 animate-in fade-in duration-150 text-xs text-slate-700">
                  
                  {/* Division 1: Official Documents Upload (docs upload path) */}
                  <div className="space-y-3.5 bg-slate-50/70 p-4 rounded-xl border border-slate-150">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b">
                      <ScrollText className="w-4 h-4 text-emerald-600" />
                      الوثائق الثبوتية والاعتماد المالي والرقابي
                    </h4>
                    <p className="text-[10px] text-slate-400">يرجى رفع صور أو نسخ واضحة من المستندات الثبوتية التالية لتوثيق الحساب (بامتداد PNG, JPG, WEBP):</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {[
                        { id: 'crImage', label: 'شهادة السجل التجاري', required: hallForm.facilityType === 'منشأة تجارية' },
                        { id: 'taxCertificateImage', label: 'شهادة ضريبة القيمة المضافة', required: !hallForm.taxExempt },
                        { id: 'ibanImage', label: 'شهادة رقم الحساب البنكي (IBAN)', required: false },
                        { id: 'zakatCertificateImage', label: 'شهادة الزكاة والدخل', required: false },
                        { id: 'tourismLicenseImage', label: 'ترخيص وزارة السياحة', required: false }
                      ].map((doc) => {
                        const isUploaded = !!hallForm[doc.id];
                        const isUploadingThis = uploadingDocSlot === doc.id;

                        return (
                          <div key={doc.id} className="p-3 bg-white rounded-xl border border-slate-200 shadow-sm space-y-2 flex flex-col justify-between">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="font-extrabold text-slate-800 text-[11px] block">{doc.label}</span>
                                <span className={`text-[9px] font-bold ${doc.required ? 'text-red-500 bg-red-50 px-1 rounded' : 'text-slate-400 bg-slate-100 px-1 rounded'}`}>
                                  {doc.required ? 'إلزامي ومطلوب للتفعيل *' : 'اختياري / تكميلي'}
                                </span>
                              </div>
                              {isUploaded && (
                                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-extrabold px-1.5 py-0.5 rounded border border-emerald-100">
                                  ✓ جاهز وموثق
                                </span>
                              )}
                            </div>

                            <div className="mt-2 text-center relative border border-dashed rounded-lg p-2.5 bg-slate-50/50 hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                              {isUploadingThis ? (
                                <div className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" /> جاري التحميل والضغط...
                                </div>
                              ) : (
                                <>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        const fd = new FormData();
                                        fd.append('image', file);
                                        fd.append('type', 'docs'); // save in docsimg public directory
                                        setUploadingDocSlot(doc.id);
                                        try {
                                          const res = await fetch('/api/upload', { method: 'POST', body: fd });
                                          if (res.ok) {
                                            const data = await res.json();
                                            if (data.success) {
                                              setHallForm((p: any) => ({ ...p, [doc.id]: data.url }));
                                              showNotification('success', `تم حفظ وتأصيل ${doc.label} بنجاح.`);
                                            } else {
                                              alert(`فشل التوثيق: ${data.error || 'تنسيق غير مدعوم'}`);
                                            }
                                          } else {
                                            alert("فشل رفع الملف لخطأ بالخادم.");
                                          }
                                        } catch {
                                          alert("تعذر الاتصال بخادم المعالجة للتنزيل.");
                                        } finally {
                                          setUploadingDocSlot(null);
                                        }
                                      }
                                    }}
                                  />
                                  <UploadCloud className="w-4 h-4 text-slate-400" />
                                  <span className="text-[10px] font-bold text-slate-650 cursor-pointer">
                                    {isUploaded ? 'تغيير أو استبدال المستند' : 'اختر صورة لتوثيقها بالسلك'}
                                  </span>
                                </>
                              )}
                            </div>

                            {isUploaded && (
                              <div className="flex gap-1.5 mt-2 justify-end">
                                <a
                                  href={hallForm[doc.id]}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-black text-[9px] flex items-center gap-1"
                                >
                                  👁️ معاينة الرابط
                                </a>
                                <button
                                  type="button"
                                  onClick={() => setHallForm({ ...hallForm, [doc.id]: '' })}
                                  className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded text-[9px]"
                                >
                                  إزالة الملف
                                </button>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Division 2: Main Customer-Facing Photo Gallery Album */}
                  <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-150">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 pb-2 border-b">
                      <Plus className="w-4 h-4 text-amber-500" />
                      ألبوم صور المعرض التسويقي للعملاء
                    </h4>
                    <p className="text-[10px] text-slate-400">هذه الصور هي التي يراها المستهلك النهائي في نتائج تصفح القاعة، يرجى اختيار صور تسويقية ممتازة:</p>

                    <div className="border-2 border-dashed border-amber-250 p-6 text-center rounded-xl bg-amber-500/5 hover:bg-amber-500/10 cursor-pointer relative">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,image/jpg"
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          setIsUploadingHallImages(true);
                          try {
                            const uploaded = [];
                            for (const file of files) {
                              if (file.size > 500 * 1024) {
                                alert(`الصورة (${file.name}) تتجاوز الحد الأقصى المسموح به (500KB). يرجى ضغط الصورة وإعادة الرفع.`);
                                continue;
                              }
                              const fd = new FormData();
                              fd.append('image', file);
                              const res = await fetch('/api/upload', { method: 'POST', body: fd });
                              if (res.ok) {
                                const dat = await res.json();
                                if (dat.success) uploaded.push(dat.url);
                              }
                            }
                            setHallForm((prev: any) => ({
                              ...prev,
                              images: [...(prev.images || []), ...uploaded]
                            }));
                          } catch {
                            alert("حدث خلل أثناء تهيئة بعض صور الألبوم.");
                          } finally {
                            setIsUploadingHallImages(false);
                          }
                        }}
                      />
                      <UploadCloud className="w-8 h-8 text-amber-550 mx-auto animate-pulse" />
                      <p className="font-bold text-slate-800 text-xs mt-1">توليف وتدشين ألبوم صور القاعة</p>
                      <p className="text-[10px] text-slate-400 mt-1">تستطيع تحديد عدة صور معاً (PNG, JPG, WEBP) بحد أقصى 500KB للواحدة (أبعاد 960x540 إلى 1280x720)</p>
                    </div>

                    <div className="flex flex-wrap gap-2 justify-center mt-3">
                      {(hallForm.images || []).map((imgUrl: string, idx: number) => (
                        <div key={idx} className="relative w-16 h-12 rounded overflow-hidden border border-slate-200 group">
                          <img src={imgUrl} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setHallForm({ ...hallForm, images: hallForm.images.filter((_: any, i: any) => i !== idx) })}
                            className="absolute top-0 right-0 p-1 bg-red-600 text-white rounded-full text-[8px] leading-none"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Division 3: Legal Affirmation Checklist Pledge */}
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200/60 mt-4 space-y-3">
                    <div className="flex items-start gap-2.5">
                      <input
                        type="checkbox"
                        id="acceptPledge"
                        checked={hallForm.pledge || false}
                        onChange={e => setHallForm({ ...hallForm, pledge: e.target.checked })}
                        className="w-4 h-4 mt-0.5 text-red-600 rounded border-red-305 focus:ring-red-500 cursor-pointer shrink-0"
                      />
                      <label htmlFor="acceptPledge" className="text-[11px] text-red-950 font-extrabold leading-relaxed cursor-pointer select-none">
                        التعهد القانوني والمسؤولية المالية: <span className="text-red-600">*</span>
                        <span className="block mt-1 font-normal text-red-800">
                          "أتعهد أنا وأقر بصفتي الشريك المالك والمخول نظاماً من قبل مرفق الضيافة والمناسبات المذكور أعلاه بصحة ودقة كافة مستندات السجل التجاري، الأرقام الضريبية، الفواتير، أسعار الباقات، وأرقام الحسابات البنكية المرفقة. وأتحمل المسؤولية الجنائية والمدنية والنظامية الكاملة أمام الهيئة العامة للزكاة والضريبة والجمارك والجهات الحكومية والرقابية في المملكة العربية السعودية وأمام إدارة المنصة في حال ثبت تزوير أو عدم مطابقة أي من هذه البيانات."
                        </span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Hall Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={() => setIsHallModalOpen(false)}
                className="px-4 py-2 hover:bg-slate-200 transition-colors rounded-xl"
              >
                إلغاء تماماً
              </button>

              <div className="flex gap-2">
                {hallModalStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setHallModalStep(p => p - 1)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl"
                  >
                    السابق
                  </button>
                )}

                {hallModalStep < 5 ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (hallModalStep === 1 && !hallForm.name) {
                        alert("يرجى تسمية القاعة أولاً");
                        return;
                      }
                      if (hallModalStep === 2 && (!hallForm.region || !hallForm.city)) {
                        alert("يرجى تحديد المنطقة والمدينة");
                        return;
                      }
                      setHallModalStep(p => p + 1);
                    }}
                    className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl"
                  >
                    التالي
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!hallForm.pledge) {
                        alert("يلزم الإقرار والتعهد لتمرير المعالجة");
                        return;
                      }
                      const payload = {
                        ...hallForm,
                        bookingType: hallForm.bookingType || (hallForm.pricingModel === 'bundle' ? 'packages' : hallForm.pricingModel === 'venueonly' ? 'venueonly' : 'alacarte'),
                        packagesList: hallForm.packagesList || hallForm.bundlesList || [],
                        capacity: Number(hallForm.capacity) || 0,
                        nightPrice: Number(hallForm.nightPrice) || 0,
                        morningPrice: Number(hallForm.morningPrice) || 0,
                        fullDayPrice: Number(hallForm.fullDayPrice) || 0,
                        price: Number(hallForm.nightPrice || hallForm.fullDayPrice || 0),
                        rating: Number(hallForm.rating) || 4.5,
                        reviewsCount: Number(hallForm.reviewsCount) || 0,
                        cancellationPeriod: Number(hallForm.cancellationPeriod) || null,
                        hostName: hallForm.hostName || currentUserName,
                        provider: hallForm.provider || currentProviderName || 'شركة أطياف لتنظيم المعارض'
                      };

                      try {
                        let savedHall;
                        if (editingItem) {
                          const isAlreadyApproved = editingItem.status === 'approved' || editingItem.status === 'نشط' || editingItem.status === 'مفعل' || editingItem.approved;
                          
                          if (userRole !== 'admin' && isAlreadyApproved) {
                            // Generate diff for modified fields
                            const pendingChanges: Record<string, { label: string; oldVal: any; newVal: any }> = {};
                            if (editingItem.name !== payload.name) pendingChanges['name'] = { label: 'اسم المنشأة', oldVal: editingItem.name, newVal: payload.name };
                            if (Number(editingItem.nightPrice) !== Number(payload.nightPrice)) pendingChanges['nightPrice'] = { label: 'السعر للفترة المسائية', oldVal: `${editingItem.nightPrice || 0} ر.س`, newVal: `${payload.nightPrice || 0} ر.س` };
                            if (Number(editingItem.morningPrice) !== Number(payload.morningPrice)) pendingChanges['morningPrice'] = { label: 'السعر للفترة الصباحية', oldVal: `${editingItem.morningPrice || 0} ر.س`, newVal: `${payload.morningPrice || 0} ر.س` };
                            if (Number(editingItem.capacity) !== Number(payload.capacity)) pendingChanges['capacity'] = { label: 'السعة الاستيعابية للضيوف', oldVal: `${editingItem.capacity || 0} شخص`, newVal: `${payload.capacity || 0} شخص` };
                            if (editingItem.facilities !== payload.facilities) pendingChanges['facilities'] = { label: 'المرافق والتجهيزات', oldVal: editingItem.facilities || 'لا يوجد', newVal: payload.facilities || 'تعديل جديد' };

                            const payloadWithPending = {
                              ...editingItem,
                              status: 'pending_modification',
                              hasPendingEdits: true,
                              pendingChanges: Object.keys(pendingChanges).length > 0 ? pendingChanges : { general: { label: 'تعديلات عامة', oldVal: 'البيانات المعتمدة', newVal: 'بيانات جديدة' } },
                              pendingPayload: payload
                            };

                            setHalls(prev => {
                              const updated = prev.map(x => String(x.id) === String(editingItem.id) ? payloadWithPending : x);
                              saveStoredHalls(updated);
                              return updated;
                            });
                            showNotification("info", "تم رفع تعديلات القاعة للإدارة بانتظار الاعتماد! تظل القاعة منشورة ببياناتها السابقة حتى نيل الاعتماد.");
                          } else {
                            const res = await fetch(`/api/bookings/halls/${editingItem.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(payload)
                            });
                            if (!res.ok) throw new Error("Faulty update on server");
                            savedHall = await res.json();
                            setHalls(prev => {
                              const updated = prev.map(x => x.id === editingItem.id ? { ...x, ...savedHall } : x);
                              saveStoredHalls(updated);
                              return updated;
                            });
                            showNotification("success", "تم تعديل وحفظ بيانات القاعة بنجاح!");
                          }
                        } else {
                          const newPayload = {
                            ...payload,
                            status: userRole === 'admin' ? 'approved' : 'pending',
                            approved: userRole === 'admin'
                          };
                          const res = await fetch("/api/bookings/halls", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(newPayload)
                          });
                          if (!res.ok) throw new Error("Faulty post on server");
                          savedHall = await res.json();
                          setHalls(prev => {
                            const updated = [{ ...newPayload, ...savedHall }, ...prev];
                            saveStoredHalls(updated);
                            return updated;
                          });
                          if (userRole === 'admin') {
                            showNotification("success", "تم إضافة القاعة الجديدة بنجاح فوري!");
                          } else {
                            showNotification("info", "تم تقديم طلب إضافة القاعة بانتظار مراجعة واعتماد الإدارة (Rule 6).");
                          }
                        }
                        setIsHallModalOpen(false);
                      } catch {
                        showNotification("error", "حدث خطأ أثناء رصد وحفظ القاعة بالمتجر.");
                      }
                    }}
                    className="px-6 py-2 bg-gradient-to-l from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-extrabold rounded-xl shadow cursor-pointer"
                  >
                    رسم وترحيل منجز نهائياً ✨
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Service Modal Form (Multi-Step popup) */}
      {isServiceModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-250 flex flex-col max-h-[85vh]" dir="rtl">
            <div className="bg-gradient-to-r from-purple-50 to-slate-50 p-4 border-b border-slate-150 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center">
                  <Settings2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {editingItem ? 'تعديل الخدمة المساندة' : 'إيداع خدمة مساندة عامة جديدة'}
                  </h3>
                </div>
              </div>
              <button onClick={() => setIsServiceModalOpen(false)} className="p-1.5 hover:bg-slate-150 rounded-full text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-5 bg-slate-50/50 border-b border-slate-150 flex justify-around text-xs font-bold text-slate-400 shrink-0 select-none py-2.5">
              <button type="button" onClick={() => setActiveServiceTab('basic')} className={activeServiceTab === 'basic' ? 'text-purple-600' : ''}>١. بيانات الخدمة الأساسية</button>
              <span>←</span>
              <button type="button" onClick={() => { if (serviceForm.name) setActiveServiceTab('pricing'); }} className={activeServiceTab === 'pricing' ? 'text-purple-600' : ''}>٢. التسعير ونطاق الفعالية</button>
              <span>←</span>
              <button type="button" onClick={() => { if (serviceForm.name) setActiveServiceTab('packages'); }} className={activeServiceTab === 'packages' ? 'text-purple-600' : ''}>٣. أنماط الباقات والزيادات</button>
              <span>←</span>
              <button type="button" onClick={() => { if (serviceForm.name) setActiveServiceTab('terms_images'); }} className={activeServiceTab === 'terms_images' ? 'text-purple-600' : ''}>٤. الأحكام وألبوم الصور للخدمة</button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs font-semibold text-slate-705 leading-relaxed max-h-[50vh]">
              {activeServiceTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1">اسم الخدمة العامة <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        value={serviceForm.name}
                        onChange={e => setServiceForm({ ...serviceForm, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:border-purple-500 bg-white"
                        placeholder="مثال: التصوير الفوتوغرافي الفاخر للعرائس"
                      />
                    </div>
                    {userRole === 'admin' ? (
                      <div>
                        {editingItem ? (
                          <div>
                            <label className="block mb-1 font-bold text-slate-700">المزود المرتبط بالخدمة</label>
                            <input
                              type="text"
                              value={serviceForm.provider || ''}
                              disabled
                              className="w-full p-2.5 rounded-xl border border-slate-205 bg-slate-100 font-bold text-slate-500 cursor-not-allowed"
                            />
                            <p className="text-[10px] text-slate-400 mt-1">رقم المزود الفريد: {serviceForm.providerId || 'غير محدد'}</p>
                          </div>
                        ) : (
                          <div>
                            <label className="block mb-1 font-bold text-slate-700">المزود المعتمد <span className="text-red-500">*</span></label>
                            <select
                              value={serviceForm.providerId || ''}
                              onChange={e => {
                                const selectedId = Number(e.target.value);
                                const prov = providers.find(p => Number(p.dbId || p.id) === selectedId);
                                if (prov) {
                                  setServiceForm({
                                    ...serviceForm,
                                    providerId: Number(prov.dbId || prov.id),
                                    provider: prov.name
                                  });
                                } else {
                                  setServiceForm({
                                    ...serviceForm,
                                    providerId: null,
                                    provider: ''
                                  });
                                }
                              }}
                              className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:border-purple-500 bg-white"
                            >
                              <option value="">-- اختر المزود للخدمة --</option>
                              {providers.map(p => (
                                <option key={p.id} value={p.dbId || p.id}>
                                  {p.name} (رقم المزود: {p.dbId || p.id})
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                        
                        <div className="mt-4">
                          <label className="flex items-center gap-2 font-bold select-none cursor-pointer text-slate-705">
                            <input
                              type="checkbox"
                              checked={serviceForm.showProviderToCustomers || false}
                              onChange={e => setServiceForm({ ...serviceForm, showProviderToCustomers: e.target.checked })}
                              className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer"
                            />
                            <span>إظهار اسم المزود للعملاء</span>
                          </label>
                          <p className="text-[10px] text-slate-400 mt-1">عند التفعيل يسمح بإظهار اسم مزود الخدمة للعملاء في واجهة العميل.</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col justify-center bg-slate-50 p-3 rounded-xl border border-slate-150 text-slate-500 text-xs italic">
                        يرتبط هذا العرض بكيان مزود الخدمة تلقائياً بنظام الصلاحيات.
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block mb-1 font-bold text-slate-700">تصنيف الخدمة المستقلة <span className="text-red-500">*</span></label>
                      <select
                        value={serviceForm.classification || ''}
                        onChange={e => setServiceForm({ ...serviceForm, classification: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold focus:border-purple-500 bg-white"
                      >
                        <option value="">-- اختر التصنيف اللوجستي --</option>
                        {serviceCategories.map((cat: string) => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1">شرح ووصف الخدمة للجمهور</label>
                    <textarea
                      value={serviceForm.description}
                      onChange={e => setServiceForm({ ...serviceForm, description: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-normal h-24"
                      placeholder="صف عناصر هذه الخدمة وتوريدها للعملاء بالتفصيل..."
                    />
                  </div>
                </div>
              )}

              {activeServiceTab === 'pricing' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block mb-1 font-bold">السعر الأساسي للخدمة (ر.س) <span className="text-red-500">*</span></label>
                      <input
                        type="number"
                        value={serviceForm.price || 0}
                        onChange={e => setServiceForm({ ...serviceForm, price: Number(e.target.value) || 0 })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 font-bold font-mono text-purple-750 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1">نوع الوحدة المسعرة</label>
                      <select
                        value={serviceForm.unit || 'مرة واحدة'}
                        onChange={e => setServiceForm({ ...serviceForm, unit: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 outline-none"
                      >
                        <option value="مرة واحدة">تدفع لمرة واحدة في الحجز</option>
                        <option value="بالساعة">ساعة تكميلية فردية</option>
                        <option value="بالفرد">مسافر أو فرد واحد</option>
                      </select>
                    </div>
                    <div>
                      <label className="block mb-1 font-bold">نطاق سماح الإلغاء (يوم)</label>
                      <input
                        type="number"
                        value={serviceForm.cancellationPeriod || ''}
                        onChange={e => setServiceForm({ ...serviceForm, cancellationPeriod: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                        placeholder="مثال: 5 أيام"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">المدن المخدومة (إلزامي كـ الرياض، مكة..) <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={serviceForm.cities || ''}
                      onChange={e => setServiceForm({ ...serviceForm, cities: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold placeholder-slate-350"
                      placeholder="مثال: الرياض، جدة، الدمام، مكة المكرمة"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">يُشترط كتابة المدن المخدومة ويفصل بينها بفاصلة لربط تغطية العملاء.</p>
                  </div>

                  <div>
                    <label className="block mb-1 font-bold">اختر مناطق التغطية النشطة للخدمة</label>
                    <div className="flex flex-wrap gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                      {regions.map(r => {
                        const isSelected = (serviceForm.regions || '').includes(r.name);
                        return (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              const current = (serviceForm.regions || '').split('، ').filter(Boolean);
                              if (isSelected) {
                                setServiceForm({ ...serviceForm, regions: current.filter((x: string) => x !== r.name).join('، ') });
                              } else {
                                setServiceForm({ ...serviceForm, regions: [...current, r.name].join('، ') });
                              }
                            }}
                            className={`px-3 py-1.5 rounded-lg border text-center transition-all ${isSelected ? 'bg-purple-600 border-purple-600 text-white shadow-xs' : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-705'}`}
                          >
                            {r.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                   <div className="grid grid-cols-2 gap-4 pt-2">
                    {userRole === 'admin' ? (
                      <div>
                        <label className="block mb-1 font-bold text-slate-700">حالة الخدمة الإدارية <span className="text-red-500">*</span></label>
                        <select
                          value={serviceForm.activationStatus || 'مفعل'}
                          onChange={e => setServiceForm({ ...serviceForm, activationStatus: e.target.value })}
                          className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                        >
                          <option value="مفعل">فعالة (تظهر للعملاء ويمكن الحجز عليها)</option>
                          <option value="موقوف">موقوفة (لا تظهر للعملاء ولا يسمح بالحجز عليها)</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block mb-1 font-bold text-slate-400">الحالة الإدارية للموافقة</label>
                        <div className="p-2.5 rounded-xl border border-slate-200 bg-slate-100 font-extrabold text-slate-500">
                          {(() => {
                            const isSvcActive = (serviceForm.status === 'approved' || serviceForm.adminStatus === 'approved' || serviceForm.adminStatus === 'فعالة') && (serviceForm.activationStatus || 'مفعل') === 'مفعل';
                            const isSvcBlocked = serviceForm.status === 'blocked' || serviceForm.adminStatus === 'محظورة' || serviceForm.adminStatus === 'blocked';
                            const isSvcPending = serviceForm.status === 'pending' || serviceForm.adminStatus === 'pending';
                            
                            if (isSvcActive) return '✅ معتمدة وفعالة إدارياً';
                            if (isSvcBlocked) return '❌ مرفوضة / محظورة إدارياً';
                            if (isSvcPending) return '⏳ بانتظار الاعتماد والمراجعة';
                            return '🛑 معتمدة وموقوفة مؤقتاً';
                          })()}
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block mb-1 font-bold text-slate-700">حالة حجز الخدمة <span className="text-red-500">*</span></label>
                      <select
                        value={serviceForm.serviceStatus || 'متاحة'}
                        onChange={e => setServiceForm({ ...serviceForm, serviceStatus: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-bold"
                      >
                        <option value="متاحة">متاحة (تظهر للعملاء ويمكن الحجز والطلب عليها)</option>
                        <option value="غير متوفرة">غير متوفرة حالياً (تظهر وعليها شارة 'غير متوفر حالياً' ولا يمكن طلبها)</option>
                        <option value="معطلة">معطلة (مخفية للعملاء ولا يمكن الحجز عليها)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {activeServiceTab === 'packages' && (
                <div className="space-y-6 animate-in fade-in duration-150" dir="rtl">
                  {/* Taxonomy Section */}
                  <div className="bg-gradient-to-l from-slate-50 to-purple-50/35 p-4 rounded-2xl border border-slate-150 space-y-3">
                    <label className="block text-xs font-black text-slate-850">نوع وتصنيف الخدمة الاستراتيجي (Service Taxonomy)</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <button
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, taxonomyType: 'rental' })}
                        className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-24 ${serviceForm.taxonomyType === 'rental' ? 'bg-white border-purple-600 ring-2 ring-purple-100 shadow-sm' : 'bg-white/60 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <span className="font-extrabold text-purple-700 text-xs text-right">تأجير موارد ومقدمي ضيافة</span>
                        <span className="text-[10px] text-slate-450 mt-1 font-normal leading-normal text-right">للضيافة (قهوجية)، التصوير بجميع كاميراته، الكوش والكراسي</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, taxonomyType: 'sales' })}
                        className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-24 ${serviceForm.taxonomyType === 'sales' ? 'bg-white border-purple-600 ring-2 ring-purple-100 shadow-sm' : 'bg-white/60 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <span className="font-extrabold text-purple-700 text-xs text-right">منتجات استهلاكية مباعة للعميل</span>
                        <span className="text-[10px] text-slate-450 mt-1 font-normal leading-normal text-right">لضيافة الحلويات والموالح، عبوات المياه، العصائر والقهوة</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setServiceForm({ ...serviceForm, taxonomyType: 'dynamic' })}
                        className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-24 ${serviceForm.taxonomyType === 'dynamic' ? 'bg-white border-purple-600 ring-2 ring-purple-100 shadow-sm' : 'bg-white/60 border-slate-200 hover:bg-slate-50'}`}
                      >
                        <span className="font-extrabold text-purple-700 text-xs text-right">نطاق عمل متغير حسب الحجم والعدد</span>
                        <span className="text-[10px] text-slate-450 mt-1 font-normal leading-normal text-right">لتنسيق الكوش والزهور بالمتر، بوفيهات مفتوحة يتم احتسابها بعدد الأشخاص</span>
                      </button>
                    </div>
                  </div>

                  {/* Packages Section */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">باقات الخدمة المتعددة (Service Packages)</h4>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">يمكنك توفير باقات متعددة لهذه الخدمة بأسعار ومميزات متدرجة</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 items-end">
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-bold">اسم الباقة</label>
                        <input
                          id="pkg-input-name"
                          type="text"
                          placeholder="مثال: الباقة الاحترافية للتصوير"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] text-slate-500 mb-1 font-bold">مشتملات الباقة</label>
                        <input
                          id="pkg-input-desc"
                          type="text"
                          placeholder="مثال: مصور فوتوغرافي ومصور فيديو"
                          className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                        />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold">السعر (ر.س)</label>
                          <input
                            id="pkg-input-price"
                            type="number"
                            placeholder="3200"
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nameEl = document.getElementById('pkg-input-name') as HTMLInputElement;
                            const descEl = document.getElementById('pkg-input-desc') as HTMLInputElement;
                            const priceEl = document.getElementById('pkg-input-price') as HTMLInputElement;
                            if (nameEl && descEl && priceEl) {
                              const name = nameEl.value.trim();
                              const desc = descEl.value.trim();
                              const price = Number(priceEl.value) || 0;
                              if (!name || isNaN(price)) {
                                alert("يرجى إدخال اسم باقة وسعر صالحين");
                                return;
                              }
                              const updatedPackages = [...(serviceForm.packages || []), { id: 'pkg_' + Date.now(), name, description: desc, price }];
                              setServiceForm({ ...serviceForm, packages: updatedPackages });
                              nameEl.value = '';
                              descEl.value = '';
                              priceEl.value = '';
                            }
                          }}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-lg font-bold shrink-0 self-end text-xs"
                        >
                          إضافة الباقة
                        </button>
                      </div>
                    </div>

                    {(!serviceForm.packages || serviceForm.packages.length === 0) ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50/50 rounded-xl">لا توجد باقات مدخلة حتى الآن. سيتم توفير الخدمة بسعرها الرئيسي فقط.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 overflow-hidden border border-slate-150 rounded-xl bg-slate-50/25">
                        {serviceForm.packages.map((pkg: any, idx: number) => (
                          <div key={pkg.id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-800 text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-md ml-2">{pkg.name}</span>
                              <span className="text-slate-500 text-[11px] font-medium block md:inline-block md:mt-0 mt-1">{pkg.description}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <strong className="text-purple-700 font-mono font-bold">{formatCurrency(pkg.price)}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = serviceForm.packages.filter((p: any) => p.id !== pkg.id);
                                  setServiceForm({ ...serviceForm, packages: updated });
                                }}
                                className="p-1 hover:text-red-650 hover:bg-red-50 rounded-lg text-slate-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Addons Section */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-4">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">الزيادات والخدمات الاختيارية (Upgrades & Add-ons)</h4>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5">بناء ميزات اختيارية تسمح للعميل بطلب زيادة تفصيلية بالطلب المالي</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150 items-end">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold">اسم الخدمة الإضافية</label>
                          <input
                            id="addon-input-name"
                            type="text"
                            placeholder="مثال: تصوير طائرة درون"
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold">وصف وتفاصيل الإضافة</label>
                          <input
                            id="addon-input-desc"
                            type="text"
                            placeholder="مثال: تصوير جوي بدقة 4K"
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] text-slate-500 mb-1 font-bold">السعر الإضافي (ر.س)</label>
                          <input
                            id="addon-input-price"
                            type="number"
                            placeholder="500"
                            className="w-full p-2 rounded-lg border border-slate-200 bg-white font-mono font-bold"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nameEl = document.getElementById('addon-input-name') as HTMLInputElement;
                            const descEl = document.getElementById('addon-input-desc') as HTMLInputElement;
                            const priceEl = document.getElementById('addon-input-price') as HTMLInputElement;
                            if (nameEl && descEl && priceEl) {
                              const name = nameEl.value.trim();
                              const desc = descEl.value.trim();
                              const price = Number(priceEl.value) || 0;
                              if (!name || isNaN(price)) {
                                alert("يرجى إدخال اسم خدمة إضافية وسعر صالحين");
                                return;
                              }
                              const updatedAddons = [...(serviceForm.addons || []), { id: 'addon_' + Date.now(), name, description: desc, price }];
                              setServiceForm({ ...serviceForm, addons: updatedAddons });
                              nameEl.value = '';
                              descEl.value = '';
                              priceEl.value = '';
                            }
                          }}
                          className="px-3 py-2 bg-purple-600 hover:bg-purple-750 text-white rounded-lg font-bold shrink-0 self-end text-xs"
                        >
                          إضافة الملحق
                        </button>
                      </div>
                    </div>

                    {(!serviceForm.addons || serviceForm.addons.length === 0) ? (
                      <p className="text-[10px] text-slate-400 italic text-center py-2 bg-slate-50/50 rounded-xl">لا توجد ملحقات إضافية مسجلة لهذه الخدمة.</p>
                    ) : (
                      <div className="divide-y divide-slate-100 overflow-hidden border border-slate-150 rounded-xl bg-slate-50/25">
                        {serviceForm.addons.map((addon: any, idx: number) => (
                          <div key={addon.id || idx} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50 transition-colors">
                            <div className="space-y-0.5">
                              <span className="font-extrabold text-slate-850 text-xs bg-slate-150 text-slate-705 border border-slate-200 px-2 py-0.5 rounded-md ml-2">{addon.name}</span>
                              <span className="text-slate-500 text-[11px] font-medium block md:inline-block md:mt-0 mt-1">{addon.description}</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <strong className="text-emerald-700 font-mono font-bold">+{formatCurrency(addon.price)}</strong>
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = serviceForm.addons.filter((a: any) => a.id !== addon.id);
                                  setServiceForm({ ...serviceForm, addons: updated });
                                }}
                                className="p-1 hover:text-red-650 hover:bg-red-50 rounded-lg text-slate-400"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeServiceTab === 'terms_images' && (
                <div className="space-y-4 animate-in fade-in duration-150" dir="rtl">
                  <div>
                    <label className="block mb-1 font-bold text-slate-700">شروط وأحكام الخدمة (شرط واحد في كل سطر) <span className="text-red-500">*</span></label>
                    <textarea
                      value={serviceForm.terms || ''}
                      onChange={e => setServiceForm({ ...serviceForm, terms: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 font-normal h-24 bg-white"
                      placeholder="أدخل شروط تقديم الخدمة مع وضع كل شرط في سطر مستقل..."
                    />
                    <p className="text-[10px] text-slate-405 mt-0.5">يُفضل صياغة الشروط بوضوح لتظهر في نموذج التفاصيل للعميل.</p>
                  </div>

                  <div className="space-y-2 mt-4">
                    <label className="block font-bold text-slate-700">ألبوم صور الخدمة (الحد الأقصى 10 صور) <span className="text-red-500">*</span></label>
                    <div className="border border-dashed border-slate-300 hover:border-purple-500 rounded-2xl p-6 text-center transition-colors cursor-pointer bg-slate-50 relative">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/jpeg,image/png,image/webp,image/jpg" 
                        className="absolute inset-0 opacity-0 cursor-pointer" 
                        onChange={async (e) => {
                          const files = Array.from(e.target.files || []) as File[];
                          if (((serviceForm.images || []).length + files.length) > 10) {
                            alert('عذراً، الحد الأقصى المسموح به لألبوم صور الخدمة هو 10 صور فقط.');
                            return;
                          }
                          setIsImageUploading(true);
                          try {
                            const uploadedList = [];
                            for (const file of files) {
                              if (file.size > 500 * 1024) {
                                alert(`صورة الخدمة (${file.name}) تتجاوز الحد الأقصى المسموح به (500KB). يرجى ضغط الصورة وإعادة الرفع.`);
                                continue;
                              }
                              const formData = new FormData();
                              formData.append('image', file);
                              const res = await fetch('/api/upload?type=services', {
                                method: 'POST',
                                body: formData
                              });
                              if (res.ok) {
                                const data = await res.json();
                                if (data.success) {
                                  uploadedList.push(data.url);
                                }
                              }
                            }
                            if (uploadedList.length > 0) {
                              setServiceForm({
                                ...serviceForm,
                                images: [...(serviceForm.images || []), ...uploadedList]
                              });
                            }
                          } catch (err) {
                            console.error('Upload fail:', err);
                            alert('حدث خطأ أثناء رفع الصور للخادم.');
                          } finally {
                            setIsImageUploading(false);
                          }
                        }} 
                      />
                      <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-1.5" />
                      <p className="text-xs font-bold text-slate-750">اسحب صور الخدمة هنا أو انقر للاختيار من جهازك</p>
                      <p className="text-[10px] text-slate-400 mt-1">يتم الرفع الفوري للملفات إلى الخادم في مجلد public/images/services/</p>
                    </div>

                    {isImageUploading && (
                      <p className="text-xs text-purple-600 animate-pulse text-center">جاري رفع ومعالجة الصور الآن...</p>
                    )}

                    {(serviceForm.images || []).length > 0 && (
                      <div className="grid grid-cols-5 gap-3 mt-4">
                        {(serviceForm.images || []).map((imgUrl: string, idx: number) => (
                          <div key={idx} className="relative aspect-square bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                            <button 
                              type="button"
                              onClick={() => setServiceForm({ ...serviceForm, images: (serviceForm.images || []).filter((_: any, i: number) => i !== idx) })}
                              className="absolute top-1 left-1 bg-red-500 hover:bg-red-650 text-white rounded-full p-1 shadow transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
              <button type="button" onClick={() => setIsServiceModalOpen(false)} className="px-4 py-2 hover:bg-slate-200 rounded-xl">إلغاء</button>
              <div className="flex gap-2">
                {activeServiceTab === 'pricing' && (
                  <button type="button" onClick={() => setActiveServiceTab('basic')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl">السابق</button>
                )}
                {activeServiceTab === 'packages' && (
                  <button type="button" onClick={() => setActiveServiceTab('pricing')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl">السابق</button>
                )}
                {activeServiceTab === 'terms_images' && (
                  <button type="button" onClick={() => setActiveServiceTab('packages')} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl">السابق</button>
                )}
                {activeServiceTab === 'basic' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!serviceForm.name) {
                        alert("اسم الخدمة العامة مطلوب");
                        return;
                      }
                      if (!serviceForm.classification) {
                        alert("يرجى اختيار تصنيف الخدمة اللوجستية المستقلة");
                        return;
                      }
                      if (userRole === 'admin' && !editingItem && !serviceForm.providerId) {
                        alert("يرجى اختيار المزود المعتمد للخدمة");
                        return;
                      }
                      setActiveServiceTab('pricing');
                    }}
                    className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none"
                  >
                    التالي
                  </button>
                )}
                {activeServiceTab === 'pricing' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!serviceForm.cities || !serviceForm.cities.trim()) {
                        alert("المدن المخدومة إجبارية للمرور للتالي (يرجى كتابتها مفصولة بفاصلة)");
                        return;
                      }
                      setActiveServiceTab('packages');
                    }}
                    className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none"
                  >
                    التالي
                  </button>
                )}
                {activeServiceTab === 'packages' && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveServiceTab('terms_images');
                    }}
                    className="px-5 py-2 bg-purple-600 text-white rounded-xl hover:bg-purple-700 focus:outline-none"
                  >
                    التالي
                  </button>
                )}
                {activeServiceTab === 'terms_images' && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!serviceForm.terms || !serviceForm.terms.trim()) {
                        alert("شروط الخدمة إجبارية لحفظ وتفعيل الإيداع البنكي للعملاء.");
                        return;
                      }

                      let activeProvider = serviceForm.provider || currentProviderName;
                      let activeProviderId = serviceForm.providerId ? String(serviceForm.providerId) : '';

                      if (userRole !== 'admin') {
                        activeProvider = currentProviderName;
                        const currentProv = providers.find(p => p.name === currentProviderName);
                        activeProviderId = currentProv ? String(currentProv.dbId || currentProv.id) : String(currentProviderId || '1');
                      } else {
                        if (!activeProviderId) {
                          activeProviderId = '1';
                        }
                      }

                      const payload = {
                        ...serviceForm,
                        provider: activeProvider,
                        providerId: activeProviderId,
                        price: Number(serviceForm.price) || 0,
                        cancellationPeriod: Number(serviceForm.cancellationPeriod) || null,
                        hostName: serviceForm.hostName || currentUserName,
                        image: (serviceForm.images && serviceForm.images.length > 0) ? serviceForm.images[0] : ''
                      };

                      try {
                        let savedService;
                        if (editingItem) {
                          const res = await fetch(`/api/bookings/services/${editingItem.id}`, {
                            method: "PUT",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                          });
                          if (!res.ok) throw new Error("Failed to edit");
                          savedService = await res.json();
                          setServices(prev => prev.map(s => s.id === editingItem.id ? { ...s, ...savedService } : s));
                          showNotification("success", "تم تعديل وحفظ بيانات الخدمة بنجاح!");
                        } else {
                          const res = await fetch("/api/bookings/services", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify(payload)
                          });
                          if (!res.ok) throw new Error("Failed to save");
                          savedService = await res.json();
                          setServices(prev => [savedService, ...prev]);
                          showNotification("success", "تم إيداع الخدمة بنجاح مباشر!");
                        }
                        setIsServiceModalOpen(false);
                      } catch {
                        showNotification("error", "فشل رصد وتخزين بيانات الخدمة.");
                      }
                    }}
                    className="px-6 py-2 bg-purple-600 text-white font-extrabold rounded-xl hover:bg-purple-700 focus:outline-none animate-bounce"
                  >
                    إيداع الخدمة ومزامنتها ✨
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* External Block Manager Modal */}
      {isExternalBlockModalOpen && (
        <ExternalBlockManagerModal
          userRole={userRole}
          currentProviderName={currentProviderName}
          halls={halls}
          setHalls={setHalls}
          services={services}
          setServices={setServices}
          showNotification={showNotification}
          defaultEntityId={selectedBlockTargetId}
          defaultEntityType={selectedBlockTargetType}
          onClose={() => setIsExternalBlockModalOpen(false)}
        />
      )}

      {/* Media Standards Guide Modal */}
      <MediaStandardsGuideModal
        isOpen={isMediaGuideOpen}
        onClose={() => setIsMediaGuideOpen(false)}
        defaultTab={mediaGuideTab}
      />

      {/* Venue Store Manager Modal */}
      <VenueStoreManagerModal
        isOpen={isVenueStoreModalOpen}
        onClose={() => setIsVenueStoreModalOpen(false)}
        hall={storeModalHall}
        onSaveProducts={(hallId, updatedProducts) => {
          setHalls(prev => prev.map(hall => {
            if (hall.id === hallId) {
              return { ...hall, productsList: updatedProducts };
            }
            return hall;
          }));
        }}
        showNotification={showNotification}
      />
    </div>
  );
}
