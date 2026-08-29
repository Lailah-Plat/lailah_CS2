import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Sparkles, Search, Table, List, LayoutGrid, Eye, 
  Plus, Power, Trash2, Layers, Star, Edit, ShieldCheck, ShieldAlert, 
  X, CheckCircle2, Ban, AlertTriangle, Lock, Archive, RotateCcw,
  Truck, Package, Crown
} from 'lucide-react';
import { ExternalBlockManagerModal } from './ExternalBlockManagerModal';
import { ItemQrCodeButton } from './common/ItemQrCodeModal';
import { LogisticsOperationsCenter } from './logistics/LogisticsOperationsCenter';
import { getActiveProviderCapabilities } from '../utils/capabilityEngine';

interface ServicesManagementProps {
  userRole: string;
  currentProviderName: string;
  currentProviderId?: string;
  currentUserName: string;
  providerSubscription: any;
  providers: any[];
  regions: any[];
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  halls?: any[];
  setHalls?: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setEditingItem: (item: any) => void;
  setServiceForm: (form: any) => void;
  setIsServiceModalOpen: (isOpen: boolean) => void;
  setViewingService: (item: any) => void;
  setIsServiceViewModalOpen: (isOpen: boolean) => void;
  setDeleteData: (item: any) => void;
  formatCurrency: (val: number) => string;
  hideHeader?: boolean;
  handleRestoreService?: (id: any) => void;
  supportServiceRequests?: any[];
  setSupportServiceRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  providerStaffList?: any[];
  setProviderStaffList?: React.Dispatch<React.SetStateAction<any[]>>;
  bookings?: any[];
  setActiveTab?: (tab: string) => void;
  handleBuyStaffSlot?: (count: number) => void;
}

export default function ServicesManagement({
  userRole,
  currentProviderName,
  currentProviderId = '',
  currentUserName,
  providerSubscription,
  providers = [],
  regions = [],
  services = [],
  setServices,
  halls = [],
  setHalls = () => {},
  showNotification,
  setEditingItem,
  setServiceForm,
  setIsServiceModalOpen,
  setViewingService,
  setIsServiceViewModalOpen,
  setDeleteData,
  formatCurrency,
  hideHeader = false,
  handleRestoreService,
  supportServiceRequests = [],
  setSupportServiceRequests,
  providerStaffList = [],
  setProviderStaffList,
  bookings = [],
  setActiveTab,
  handleBuyStaffSlot
}: ServicesManagementProps) {
  // Domain subtabs: services catalog vs logistics center
  const [activeServicesSubTab, setActiveServicesSubTab] = useState<'catalog' | 'logistics'>(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('subtab') === 'logistics' || urlParams.get('tab') === 'logistics') {
        return 'logistics';
      }
    } catch (e) {}
    return 'catalog';
  });

  // Services Filters (Migrated to be fully encapsulated inside ServicesManagement)
  const [servicesSearchQuery, setServicesSearchQuery] = useState('');
  const [servicesFilterRegion, setServicesFilterRegion] = useState('');
  const [servicesFilterProvider, setServicesFilterProvider] = useState('');
  const [servicesFilterStatus, setServicesFilterStatus] = useState('');
  const [servicesSortBy, setServicesSortBy] = useState('newest');
  const [servicesCurrentPage, setServicesCurrentPage] = useState(1);
  const [servicesViewMode, setServicesViewMode] = useState<'grid' | 'table' | 'list'>('table');

  // Modal State for External Blocking & Capacity
  const [isExternalBlockModalOpen, setIsExternalBlockModalOpen] = useState(false);
  const [selectedBlockTargetId, setSelectedBlockTargetId] = useState<string | number | undefined>(undefined);

  const capabilities = useMemo(() => getActiveProviderCapabilities(), [providerSubscription]);
  const hasOperationsCapability = userRole === 'admin' || capabilities.hasOperationsDashboard;

  const baseServices = useMemo(() => {
    if (userRole === 'provider') {
      return (services || []).filter((s: any) => 
        (s.providerId && String(s.providerId) === String(currentProviderId)) || 
        (!s.providerId && s.provider === currentProviderName)
      );
    }
    return services || [];
  }, [services, userRole, currentProviderId, currentProviderName]);

  // Filter list
  let filteredServices = baseServices.filter((s: any) => {
    const matchSearch = !servicesSearchQuery || 
                        (s.name || '').toLowerCase().includes(servicesSearchQuery.toLowerCase()) || 
                        (s.provider || '').toLowerCase().includes(servicesSearchQuery.toLowerCase()) || 
                        (s.description || '').toLowerCase().includes(servicesSearchQuery.toLowerCase()) ||
                        (s.cities || '').toLowerCase().includes(servicesSearchQuery.toLowerCase());
    const matchRegion = !servicesFilterRegion || (s.regions || '').includes(servicesFilterRegion);
    const matchProvider = !servicesFilterProvider || s.provider === servicesFilterProvider;
    
    let matchStatus = true;
    if (servicesFilterStatus === 'مؤرشفة') {
      matchStatus = Boolean(s.isArchived) || s.serviceStatus === 'مؤرشفة' || s.adminStatus === 'مؤرشفة';
    } else if (servicesFilterStatus === 'نشط') {
      matchStatus = !s.isArchived && (s.serviceStatus === 'نشط' || s.serviceStatus === 'active');
    } else if (servicesFilterStatus === 'متوقف') {
      matchStatus = !s.isArchived && (s.serviceStatus === 'متوقف' || s.serviceStatus === 'معطل');
    } else if (servicesFilterStatus === 'محجوزة كاملة') {
      matchStatus = !s.isArchived && s.serviceStatus === 'محجوزة كاملة';
    } else if (!servicesFilterStatus) {
      matchStatus = true;
    }
    
    return matchSearch && matchRegion && matchProvider && matchStatus;
  });

  // Sort
  if (servicesSortBy === "priceDesc") {
    filteredServices.sort((a: any, b: any) => parseFloat(b.price) - parseFloat(a.price));
  } else if (servicesSortBy === "priceAsc") {
    filteredServices.sort((a: any, b: any) => parseFloat(a.price) - parseFloat(b.price));
  } else if (servicesSortBy === "rating") {
    filteredServices.sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0));
  } else {
    filteredServices.sort((a: any, b: any) => (b.id || 0) - (a.id || 0));
  }

  // Paginate
  const servicesPerPage = 6;
  const servicesTotalPages = Math.ceil(filteredServices.length / servicesPerPage) || 1;
  const activePage = Math.min(servicesCurrentPage, servicesTotalPages);
  const paginated = filteredServices.slice((activePage - 1) * servicesPerPage, activePage * servicesPerPage);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-right font-sans" dir="rtl">
      {/* Header Widget */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {!hideHeader ? (
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span>✨</span>
              <span>إدارة سوق الخدمات المساندة والعمليات اللوجستية المتنوعة</span>
            </h2>
            <p className="text-slate-500 mt-1 text-xs">
              اعتماد باقات الضيافة، التوثيق، الإضاءة وتنسيق التوريد والعمليات الميدانية
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-lg font-black text-slate-800">باقات الخدمات المساندة الحالية</h3>
            <p className="text-slate-400 text-xs mt-0.5">الباقات والعروض المتاحة والمثبتة لعملائك</p>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setSelectedBlockTargetId(undefined);
              setIsExternalBlockModalOpen(true);
            }}
            className="px-4 py-3 rounded-2xl bg-purple-900 hover:bg-purple-950 text-purple-100 font-extrabold text-xs flex items-center gap-2 border border-purple-700/50 shadow-md transition-all active:scale-95 cursor-pointer"
            title="تقفيل المواعيد وضبط الطاقة التشغيلية للخدمات المساندة"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>تقفيل المواعيد وطاقة الخدمة 🔒</span>
          </button>

          <button 
            type="button"
            onClick={() => {
              if (userRole === 'provider') {
                const myServicesCount = baseServices.length;
                const servicesLimit = providerSubscription?.servicesLimit;
                if (servicesLimit !== undefined && servicesLimit !== null && servicesLimit !== '' && servicesLimit !== 'unlimited') {
                  const additionalServices = Number(providerSubscription?.additionalServices || 0);
                  const effectiveServicesLimit = Number(servicesLimit) + additionalServices;
                  if (myServicesCount >= effectiveServicesLimit) {
                    showNotification('error', `لقد وصلت للحد الأقصى لعدد الخدمات المسموح بها في باقتك الحالية مع الميزات الإضافية (${effectiveServicesLimit} خدمة). يُرجى ترقية الباقة أو شراء ميزات إضافية.`);
                    return;
                  }
                }
              }
              setEditingItem(null);
              setServiceForm({
                name: '', description: '', provider: userRole === 'provider' ? currentProviderName : '',
                providerId: userRole === 'provider' ? currentProviderId : '',
                quantity: '', price: 0,
                regions: '', cities: '', terms: '',
                serviceStatus: 'نشط', adminStatus: 'فعالة',
                cancellationPeriod: '', images: [], hostName: currentUserName,
                unit: 'مرة واحدة', unitPrice: 0
              });
              setIsServiceModalOpen(true);
            }} 
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-2xl shadow-lg shadow-amber-500/30 transition-all hover:scale-105 duration-200 cursor-pointer text-xs"
          >
            <Plus className="w-5 h-5" />
            <span>إضافة خدمة جديدة</span>
          </button>
        </div>
      </div>

      {/* Sub-Navigation: Services Catalog vs Logistics Center */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl w-fit border border-slate-200/80">
        <button
          type="button"
          onClick={() => setActiveServicesSubTab('catalog')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeServicesSubTab === 'catalog'
              ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4 text-purple-600" />
          <span>دليل وباقات الخدمات المساندة</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveServicesSubTab('logistics')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
            activeServicesSubTab === 'logistics'
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>مركز العمليات اللوجستية 🚚</span>
          {!hasOperationsCapability ? (
            <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-600" />
              <span>مغلق</span>
            </span>
          ) : (
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black ${
              activeServicesSubTab === 'logistics' ? 'bg-white/20 text-white' : 'bg-purple-100 text-purple-700'
            }`}>
              جديد
            </span>
          )}
        </button>
      </div>

      {activeServicesSubTab === 'logistics' ? (
        !hasOperationsCapability ? (
          <div className="bg-white rounded-3xl p-8 lg:p-12 border border-slate-200 shadow-xl text-center max-w-4xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-400">
            <div className="relative inline-flex items-center justify-center">
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-purple-900 via-indigo-800 to-slate-900 flex items-center justify-center text-amber-400 shadow-2xl shadow-purple-900/30 ring-8 ring-purple-100">
                <Lock className="w-12 h-12" />
              </div>
              <span className="absolute -top-2 -right-2 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black text-xs rounded-full shadow-md flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                ميزة متقدمة
              </span>
            </div>

            <div className="space-y-3 max-w-2xl mx-auto">
              <h2 className="text-2xl lg:text-3xl font-black text-slate-900">
                ميزة "مركز العمليات اللوجستية الميدانية للخدمات" مقفلة 🔒
              </h2>
              <p className="text-slate-600 text-xs lg:text-sm leading-relaxed">
                هذه الميزة غير مفعلة في باقتك الحالية. يوفر مركز اللوجستيات نظاماً متكاملاً لإدارة الحركة الميدانية لخدماتك، ومتابعة المراحل الست، وجدولة الفرق الميدانية، ومحاضر تسليم العُهد الإلكترونية.
              </p>
            </div>

            {/* Feature capabilities preview */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-right">
              <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
                <div className="flex items-center gap-2 text-purple-700 font-black text-xs">
                  <Layers className="w-4 h-4" />
                  <span>مسار المراحل الست الحي</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  متابعة فورية للمهام من التجهيز، الانطلاق، فحص الموقع، اكتمال الجاهزية، وحتى التشغيل والإخلاء.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
                <div className="flex items-center gap-2 text-indigo-700 font-black text-xs">
                  <Building2 className="w-4 h-4" />
                  <span>مناوبات الكوادر والتوزيع الميداني</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  توزيع المشرفين والفنيين والصبابين على الفعاليات ومتابعة الحضور الميداني بالرمز والبطاقات الذكية.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
                <div className="flex items-center gap-2 text-amber-700 font-black text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>محاضر العُهد وتوثيق التالف</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  محاضر استلام وتسليم المعدات رقمياً وتوثيق التلفيات والتكاليف والجهة المسؤولة بضمان وشفافية.
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('PROVIDER_SUBSCRIPTION_ACTIVE_SUBTAB', 'addons');
                  localStorage.setItem('PROVIDER_SUBSCRIPTION_HIGHLIGHT_ADDON', 'logistics_operations');
                  window.dispatchEvent(new CustomEvent('changeProviderSubTab', { detail: 'addons' }));
                  if (setActiveTab) {
                    setActiveTab('subscriptions');
                  }
                }}
                className="w-full sm:w-auto px-8 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs shadow-xl shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Crown className="w-4 h-4 text-slate-950" />
                <span>ترقية الباقة أو شراء ميزة العمليات اللوجستية</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveServicesSubTab('catalog')}
                className="w-full sm:w-auto px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all active:scale-95 cursor-pointer"
              >
                <span>العودة إلى دليل الخدمات</span>
              </button>
            </div>
          </div>
        ) : (
          <LogisticsOperationsCenter
            userRole={userRole}
            currentProviderName={currentProviderName}
            currentProviderId={currentProviderId}
            currentUserName={currentUserName}
            providerSubscription={providerSubscription}
            supportServiceRequests={supportServiceRequests}
            setSupportServiceRequests={setSupportServiceRequests}
            providerStaffList={providerStaffList}
            setProviderStaffList={setProviderStaffList}
            bookings={bookings}
            showNotification={showNotification}
            formatCurrency={formatCurrency}
            setActiveTab={setActiveTab}
            handleBuyStaffSlot={handleBuyStaffSlot}
          />
        )
      ) : (
        <>
          {/* Stats dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400">إجمالي الخدمات المتاحة</span>
            <span className="block text-2xl font-extrabold text-slate-800">{baseServices.length}</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400 font-sans">الخدمات النشطة</span>
            <span className="block text-2xl font-extrabold text-emerald-600">{baseServices.filter(s => s.serviceStatus === 'نشط').length}</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400">خدمات متوقفة / محجوزة</span>
            <span className="block text-2xl font-extrabold text-amber-600">{baseServices.filter(s => s.serviceStatus !== 'نشط').length}</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
            <Ban className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="block text-xs font-bold text-slate-400">الخدمات المحظورة إدارياً</span>
            <span className="block text-2xl font-extrabold text-rose-600">{baseServices.filter(s => s.adminStatus === 'محظورة').length}</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters Panel */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="ابحث باسم الخدمة، المزود، أو الوصف..."
              value={servicesSearchQuery}
              onChange={e => { setServicesSearchQuery(e.target.value); setServicesCurrentPage(1); }}
              className="w-full pr-10 pl-4 py-3 rounded-xl border border-slate-200 focus:border-purple-500 bg-slate-50/50 outline-none transition-all placeholder:text-slate-400 font-sans text-xs"
            />
            <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
          </div>

          {/* Select Region */}
          <div className="w-full lg:w-48">
            <select
              value={servicesFilterRegion}
              onChange={e => { setServicesFilterRegion(e.target.value); setServicesCurrentPage(1); }}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 bg-white outline-none transition-all text-xs"
            >
              <option value="">كل المناطق</option>
              {Array.from(new Set((services || []).map(s => s.regions).filter(Boolean))).map((r: any, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Select Provider */}
          {userRole === 'admin' && (
            <div className="w-full lg:w-56">
              <select
                value={servicesFilterProvider}
                onChange={e => { setServicesFilterProvider(e.target.value); setServicesCurrentPage(1); }}
                className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 bg-white outline-none transition-all text-xs"
              >
                <option value="">كل مزودي الخدمة</option>
                {providers.map((p: any) => (
                  <option key={p.id} value={p.name}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Select Status */}
          <div className="w-full lg:w-40">
            <select
              value={servicesFilterStatus}
              onChange={e => { setServicesFilterStatus(e.target.value); setServicesCurrentPage(1); }}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 bg-white outline-none transition-all text-xs"
            >
              <option value="">كل الحالات</option>
              <option value="نشط">نشط</option>
              <option value="متوقف">متوقف</option>
              <option value="محجوزة كاملة">محجوزة كاملة</option>
              <option value="مؤرشفة">📦 مؤرشفة (خارج العرض)</option>
            </select>
          </div>

          {/* Sorting */}
          <div className="w-full lg:w-44">
            <select
              value={servicesSortBy}
              onChange={e => { setServicesSortBy(e.target.value); setServicesCurrentPage(1); }}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 bg-white outline-none transition-all text-xs"
            >
              <option value="newest">الأحدث تسجيلاً</option>
              <option value="priceAsc">السعر: من الأقل</option>
              <option value="priceDesc">السعر: من الأعلى</option>
              <option value="rating">التقييم الأعلى</option>
            </select>
          </div>

          {/* View Mode Toggle Controls */}
          <div className="flex items-center gap-1 bg-slate-100 p-1.5 rounded-xl shrink-0">
            <button
              type="button"
              onClick={() => setServicesViewMode('table')}
              className={`p-2 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${servicesViewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="عرض جدولي"
            >
              <Table className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setServicesViewMode('list')}
              className={`p-2 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${servicesViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="عرض قائمة"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setServicesViewMode('grid')}
              className={`p-2 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${servicesViewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              title="عرض شبكي"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Services List / Cards */}
      {paginated.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 flex flex-col items-center justify-center">
          <Layers className="w-16 h-16 text-slate-300 mb-4 animate-bounce" />
          <h4 className="text-lg font-bold text-slate-700">لا توجد خدمات مطابقة للفحص</h4>
          <p className="text-sm text-slate-400 mt-2">يرجى تعديل خيارات البحث أو الفلترة أو إضافة خدمة إضافية جديدة للمنصة.</p>
        </div>
      ) : (
        <>
          {servicesViewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginated.map((service: any) => {
                const imgUrl = service.images && service.images.length > 0 
                  ? (service.images[0].preview || (typeof service.images[0] === 'string' ? service.images[0] : '')) 
                  : '';
                return (
                  <div key={service.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group h-full">
                    {/* Image / Stats */}
                    <div className="relative h-44 bg-slate-900 overflow-hidden text-right">
                      {imgUrl ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={imgUrl} 
                          alt={service.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                          <Layers className="w-12 h-12 text-slate-300 mb-2" />
                          <span className="text-xs">لا تتوفر صورة توضيحية</span>
                        </div>
                      )}
                      
                      {/* Price Tag */}
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                        {formatCurrency(service.price)}
                      </div>

                      {/* Status Badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
                        {service.isArchived || service.serviceStatus === 'مؤرشفة' ? (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900/90 text-amber-400 backdrop-blur-xs flex items-center gap-1 border border-amber-400/30">
                            <Archive className="w-3 h-3 text-amber-400" />
                            مؤرشفة
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${service.serviceStatus === 'نشط' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                            {service.serviceStatus}
                          </span>
                        )}
                        {service.adminStatus === 'محظورة' && (
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-600 text-white animate-pulse">
                            محظورة إدارياً
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2 text-right">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-purple-600 transition-colors">{service.name}</h4>
                          <div className="shrink-0 flex items-center text-amber-500 gap-0.5" dir="ltr">
                            <Star className="w-4 h-4 fill-amber-500" />
                            <span className="text-xs font-bold">{service.rating || '5.0'}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[2.5rem]">{service.description || 'لم يتم إضافة وصف لهذه الخدمة الخاصة بالمنصة.'}</p>
                        
                        <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-2 text-[11px] text-slate-500 justify-start">
                          <span className="bg-slate-50 px-2 py-1 rounded-md">المزود: <strong className="text-slate-700">{service.provider}</strong></span>
                          {service.regions && <span className="bg-slate-50 px-2 py-1 rounded-md">المناطق: <strong className="text-slate-700">{service.regions}</strong></span>}
                          {service.cancellationPeriod !== undefined && service.cancellationPeriod !== "" && (
                            <span className="bg-amber-50 text-amber-800 px-2 py-1 rounded-md">سماح إلغاء: {service.cancellationPeriod} يوم</span>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 shrink-0">
                        <ItemQrCodeButton
                          item={{ id: service.id, name: service.name, type: 'service', provider: service.provider, image: service.images?.[0] }}
                          variant="badge"
                        />
                        <button
                          onClick={() => {
                            setViewingService(service);
                            setIsServiceViewModalOpen(true);
                          }}
                          className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold p-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-slate-100 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                          تفاصيل
                        </button>

                        {service.isArchived || service.serviceStatus === 'مؤرشفة' ? (
                          <button
                            onClick={() => {
                              if (handleRestoreService) {
                                handleRestoreService(service.id);
                              } else {
                                setServices(prev => prev.map(s => s.id === service.id ? { ...s, isArchived: false, serviceStatus: 'نشط', adminStatus: 'معتمد' } : s));
                                showNotification('success', '♻️ تم استعادة الخدمة من الأرشيف بنجاح.');
                              }
                            }}
                            className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold p-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer shadow-xs"
                            title="استعادة الخدمة من الأرشيف"
                          >
                            <RotateCcw className="w-4 h-4" />
                            استعادة
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingItem(service);
                              setServiceForm({
                                name: service.name || '', description: service.description || '', provider: service.provider || '',
                                providerId: service.providerId || '',
                                quantity: service.quantity || '', price: service.price || 0,
                                regions: service.regions || '', cities: service.cities || '', terms: service.terms || '',
                                serviceStatus: service.serviceStatus || 'نشط', adminStatus: service.adminStatus || 'فعالة',
                                cancellationPeriod: service.cancellationPeriod || '',
                                images: service.images || [], hostName: service.hostName || currentUserName,
                                unit: service.unit || 'مرة واحدة',
                                unitPrice: service.unitPrice || service.price || 0
                              });
                              setIsServiceModalOpen(true);
                            }}
                            className="flex-1 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold p-2 rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors border border-purple-100 cursor-pointer"
                          >
                            <Edit className="w-4 h-4" />
                            تعديل
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setDeleteData({
                              id: service.id,
                              name: service.name,
                              type: 'services'
                            });
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-600 p-2 rounded-xl text-xs flex items-center justify-center transition-colors border border-red-100 cursor-pointer"
                          title="حذف أو أرشفة الخدمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {servicesViewMode === 'table' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm overflow-x-auto text-right">
              <table className="w-full text-right border-collapse min-w-[700px]">
                <thead>
                  <tr className="bg-slate-50 text-slate-700 text-xs font-extrabold border-b border-slate-200">
                    <th className="p-4 w-20 text-right">الصورة</th>
                    <th className="p-4 text-right">اسم الخدمة</th>
                    <th className="p-4 text-right">المزود</th>
                    <th className="p-4 text-right">المناطق</th>
                    <th className="p-4 text-right">السعر</th>
                    <th className="p-4 text-right">حالة الخدمة</th>
                    <th className="p-4 text-right">الحالة الإدارية</th>
                    <th className="p-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs whitespace-nowrap">
                  {paginated.map((service: any) => {
                    const imgUrl = service.images && service.images.length > 0 
                      ? (service.images[0].preview || (typeof service.images[0] === 'string' ? service.images[0] : '')) 
                      : '';
                    return (
                      <tr key={service.id} className="hover:bg-slate-50/50 transition-colors text-right">
                        <td className="p-4 text-right">
                          <div className="w-12 h-10 rounded-lg overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                            {imgUrl ? (
                              <img referrerPolicy="no-referrer" src={imgUrl} alt={service.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-400">
                                <Layers className="w-4 h-4" />
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 font-black text-slate-800 text-right">
                          <div className="space-y-0.5">
                            <span className="block text-sm">{service.name}</span>
                            <span className="block text-[10px] text-slate-400 font-medium line-clamp-1 max-w-[200px]">{service.description}</span>
                          </div>
                        </td>
                        <td className="p-4 text-slate-600 font-bold text-right">{service.provider}</td>
                        <td className="p-4 text-slate-500 font-medium text-right">{service.regions || 'باقي المناطق'}</td>
                        <td className="p-4 font-black text-slate-900 font-mono text-sm text-right">{formatCurrency(service.price)}</td>
                        <td className="p-4 text-right">
                          {service.isArchived || service.serviceStatus === 'مؤرشفة' ? (
                            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-slate-900 text-amber-400 border border-amber-400/30 flex items-center gap-1.5 w-fit">
                              <Archive className="w-3.5 h-3.5 text-amber-400" />
                              <span>مؤرشفة</span>
                            </span>
                          ) : (
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 w-fit ${service.serviceStatus === 'نشط' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${service.serviceStatus === 'نشط' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                              <span>{service.serviceStatus}</span>
                            </span>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold flex items-center gap-1.5 w-fit ${service.adminStatus === 'فعالة' ? 'bg-sky-50 text-sky-800 border border-sky-200' : 'bg-red-50 text-red-800 border border-red-200 animate-pulse'}`}>
                            {service.adminStatus === 'فعالة' ? <ShieldCheck className="w-3.5 h-3.5 text-sky-600" /> : <ShieldAlert className="w-3.5 h-3.5 text-red-600" />}
                            <span>{service.adminStatus || 'فعالة'}</span>
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center justify-center gap-1.5 animate-none">
                            <ItemQrCodeButton
                              item={{ id: service.id, name: service.name, type: 'service', provider: service.provider, image: service.images?.[0] }}
                              variant="table"
                            />
                            <button
                              onClick={() => {
                                setViewingService(service);
                                setIsServiceViewModalOpen(true);
                              }}
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-500/10 rounded-xl transition-all border border-slate-100 hover:border-blue-200 cursor-pointer shadow-xs"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            
                            {service.isArchived || service.serviceStatus === 'مؤرشفة' ? (
                              <button
                                onClick={() => {
                                  if (handleRestoreService) {
                                    handleRestoreService(service.id);
                                  } else {
                                    setServices(prev => prev.map(s => s.id === service.id ? { ...s, isArchived: false, serviceStatus: 'نشط', adminStatus: 'معتمد' } : s));
                                    showNotification('success', '♻️ تم استعادة الخدمة من الأرشيف بنجاح.');
                                  }
                                }}
                                className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all border border-emerald-200 hover:border-emerald-300 cursor-pointer shadow-xs"
                                title="استعادة الخدمة"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingItem(service);
                                  setServiceForm({
                                    name: service.name || '', description: service.description || '', provider: service.provider || '',
                                    providerId: service.providerId || '',
                                    quantity: service.quantity || '', price: service.price || 0,
                                    regions: service.regions || '', cities: service.cities || '', terms: service.terms || '',
                                    serviceStatus: service.serviceStatus || 'نشط', adminStatus: service.adminStatus || 'فعالة',
                                    cancellationPeriod: service.cancellationPeriod || '',
                                    images: service.images || [], hostName: service.hostName || currentUserName,
                                    unit: service.unit || 'مرة واحدة',
                                    unitPrice: service.unitPrice || service.price || 0
                                  });
                                  setIsServiceModalOpen(true);
                                }}
                                className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-all border border-slate-100 hover:border-amber-200 cursor-pointer shadow-xs"
                                title="تعديل الخدمة"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setDeleteData({
                                  id: service.id,
                                  name: service.name,
                                  type: 'services'
                                });
                              }}
                              className="p-2 text-slate-500 hover:text-red-650 hover:bg-red-50 rounded-xl transition-all border border-slate-100 hover:border-red-200 cursor-pointer shadow-xs"
                              title="حذف أو أرشفة الخدمة"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {servicesViewMode === 'list' && (
            <div className="space-y-4">
              {paginated.map((service: any) => {
                const imgUrl = service.images && service.images.length > 0 
                  ? (service.images[0].preview || (typeof service.images[0] === 'string' ? service.images[0] : '')) 
                  : '';
                return (
                  <div key={service.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 p-4 group text-right">
                    {/* Horizontal Image */}
                    <div className="relative w-full md:w-56 h-36 bg-slate-900 rounded-xl overflow-hidden shrink-0">
                      {imgUrl ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={imgUrl} 
                          alt={service.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                          <Layers className="w-10 h-10 text-slate-300 mb-1" />
                          <span className="text-[10px]">لا تتوفر صورة توضيحية</span>
                        </div>
                      )}
                      
                      {/* Status Check badge */}
                      <div className="absolute top-2 right-2">
                        {service.isArchived || service.serviceStatus === 'مؤرشفة' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-slate-900/90 text-amber-400 backdrop-blur-xs flex items-center gap-1 border border-amber-400/30">
                            <Archive className="w-2.5 h-2.5 text-amber-400" />
                            مؤرشفة
                          </span>
                        ) : (
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${service.serviceStatus === 'نشط' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
                            {service.serviceStatus}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Horizontal details */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5 text-right">
                        <div className="flex justify-between items-start gap-4">
                          <h4 className="font-extrabold text-slate-800 text-base group-hover:text-purple-650 transition-colors">{service.name}</h4>
                          <span className="text-sm font-black text-purple-700 font-mono">{formatCurrency(service.price)}</span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed h-[2.5rem]">{service.description || 'لم يتم إضافة وصف الخدمة بعد.'}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 justify-start">
                          <span className="bg-slate-100 px-2 py-0.5 rounded-md">المزود: <strong className="text-slate-700 font-bold">{service.provider}</strong></span>
                          {service.regions && <span className="bg-slate-100 px-2 py-0.5 rounded-md">المناطق: <strong className="text-slate-700 font-bold">{service.regions}</strong></span>}
                          {service.cancellationPeriod !== undefined && service.cancellationPeriod !== "" && (
                            <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded-md">سماح إلغاء: {service.cancellationPeriod} يوم</span>
                          )}
                        </div>
                      </div>

                      {/* Control options */}
                      <div className="flex items-center gap-2 pt-2.5 border-t border-slate-100 justify-start">
                        <button
                          onClick={() => {
                            setViewingService(service);
                            setIsServiceViewModalOpen(true);
                          }}
                          className="px-4 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors border border-slate-200 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                          <span>تفاصيل</span>
                        </button>
                        
                        {service.isArchived || service.serviceStatus === 'مؤرشفة' ? (
                          <button
                            onClick={() => {
                              if (handleRestoreService) {
                                handleRestoreService(service.id);
                              } else {
                                setServices(prev => prev.map(s => s.id === service.id ? { ...s, isArchived: false, serviceStatus: 'نشط', adminStatus: 'معتمد' } : s));
                                showNotification('success', '♻️ تم استعادة الخدمة من الأرشيف بنجاح.');
                              }
                            }}
                            className="px-4 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors border border-emerald-200 cursor-pointer shadow-xs"
                            title="استعادة الخدمة"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>استعادة الخدمة</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingItem(service);
                              setServiceForm({
                                name: service.name || '', description: service.description || '', provider: service.provider || '',
                                providerId: service.providerId || '',
                                quantity: service.quantity || '', price: service.price || 0,
                                regions: service.regions || '', cities: service.cities || '', terms: service.terms || '',
                                serviceStatus: service.serviceStatus || 'نشط', adminStatus: service.adminStatus || 'فعالة',
                                cancellationPeriod: service.cancellationPeriod || '',
                                images: service.images || [], hostName: service.hostName || currentUserName,
                                unit: service.unit || 'مرة واحدة',
                                unitPrice: service.unitPrice || service.price || 0
                              });
                              setIsServiceModalOpen(true);
                            }}
                            className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs flex items-center gap-1 transition-colors border border-purple-100 cursor-pointer"
                          >
                            <Edit className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setDeleteData({
                              id: service.id,
                              name: service.name,
                              type: 'services'
                            });
                          }}
                          className="bg-red-50 hover:bg-red-100 text-red-650 p-2 rounded-lg text-xs flex items-center justify-center transition-colors border border-red-100 cursor-pointer"
                          title="حذف أو أرشفة الخدمة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination Controls */}
          {servicesTotalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={activePage === 1}
                onClick={() => setServicesCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-xs cursor-pointer"
              >
                السابق
              </button>
              <div className="flex gap-1">
                {Array.from({ length: servicesTotalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setServicesCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all cursor-pointer ${page === activePage ? 'bg-purple-600 text-white shadow-sm' : 'border border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
              <button
                disabled={activePage === servicesTotalPages}
                onClick={() => setServicesCurrentPage(p => Math.min(servicesTotalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:hover:bg-transparent text-xs cursor-pointer"
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}
      </>
      )}

      {/* External Blocking and Capacity Manager Modal */}
      {isExternalBlockModalOpen && (
        <ExternalBlockManagerModal
          userRole={userRole}
          currentProviderName={currentProviderName}
          halls={halls}
          setHalls={setHalls}
          services={services}
          setServices={setServices}
          showNotification={showNotification}
          onClose={() => setIsExternalBlockModalOpen(false)}
          defaultEntityType="service"
          defaultEntityId={selectedBlockTargetId}
        />
      )}
    </div>
  );
}
