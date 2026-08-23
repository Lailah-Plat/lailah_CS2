import React, { useState, useMemo } from 'react';
import { Building2, Layers, Info, ShoppingBag } from 'lucide-react';
import HallsManagement from './HallsManagement';
import ServicesManagement from './ServicesManagement';
import { VenueProductsStoreTab } from './VenueProductsStoreTab';

interface HallsServicesUnifiedPageProps {
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
  activeTab: string;
  setEditingItem?: (item: any) => void;
  setServiceForm?: (form: any) => void;
  setIsServiceModalOpen?: (isOpen: boolean) => void;
  setViewingService?: (item: any) => void;
  setIsServiceViewModalOpen?: (isOpen: boolean) => void;
  setDeleteData?: (item: any) => void;
  formatCurrency?: (val: number) => string;
  renderLockScreen?: (featureName: string, featureId: string) => React.ReactNode;
  renderHalls?: () => React.ReactNode;
}

export function HallsServicesUnifiedPage({
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
  setEditingItem = () => {},
  setServiceForm = () => {},
  setIsServiceModalOpen = () => {},
  setViewingService = () => {},
  setIsServiceViewModalOpen = () => {},
  setDeleteData = () => {},
  formatCurrency = (val: number) => `${val} ر.س`,
  renderLockScreen,
  renderHalls
}: HallsServicesUnifiedPageProps) {
  const [selectedDomainTab, setSelectedDomainTab] = useState<'halls' | 'services' | 'store'>(
    activeTab === 'services' ? 'services' : activeTab === 'store' ? 'store' : 'halls'
  );

  // Strict isolation scoped halls for current provider
  const scopedHalls = useMemo(() => {
    if (userRole === 'provider') {
      return (halls || []).filter((h: any) => {
        const hProviderName = (h.providerName || h.provider || '').trim().toLowerCase();
        const hProviderId = h.providerId ? String(h.providerId) : '';
        const curName = (currentProviderName || '').trim().toLowerCase();
        const curId = currentProviderId ? String(currentProviderId) : '';
        return (
          (curName && hProviderName === curName) ||
          (curId && hProviderId === curId)
        );
      });
    }
    return halls || [];
  }, [halls, userRole, currentProviderName, currentProviderId]);

  // Strict isolation scoped services for current provider
  const scopedServices = useMemo(() => {
    if (userRole === 'provider') {
      return (services || []).filter((s: any) => {
        const sProviderName = (s.providerName || s.provider || '').trim().toLowerCase();
        const sProviderId = s.providerId ? String(s.providerId) : '';
        const curName = (currentProviderName || '').trim().toLowerCase();
        const curId = currentProviderId ? String(currentProviderId) : '';
        return (
          (curName && sProviderName === curName) ||
          (curId && sProviderId === curId)
        );
      });
    }
    return services || [];
  }, [services, userRole, currentProviderName, currentProviderId]);

  // Compute total store products count across scoped halls only
  const totalStoreProductsCount = useMemo(() => {
    let count = 0;
    scopedHalls.forEach(hall => {
      const storageKey = `hall_store_products_${hall.id}`;
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            count += parsed.length;
            return;
          }
        } catch (e) {}
      }
      if (hall.productsList && Array.isArray(hall.productsList)) {
        count += hall.productsList.length;
      } else {
        count += 8; // default standard presets count per hall
      }
    });
    return count;
  }, [scopedHalls]);

  const defaultRenderLockScreen = (featureName: string, featureId: string) => {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center space-y-4">
        <div className="p-4 bg-amber-50 rounded-full text-amber-500">
          <Building2 className="w-10 h-10" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">ميزة مقفلة: {featureName}</h3>
        <p className="text-slate-500 text-sm max-w-md font-medium">
          عذراً، هذه الخاصية ({featureId}) تتطلب اشتراكاً في باقة متقدمة أو تفعيل الصلاحيات الكاملة للحساب. الرجاء ترقية الاشتراك للمتابعة.
        </p>
      </div>
    );
  };

  const finalRenderLockScreen = renderLockScreen || defaultRenderLockScreen;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-right font-sans" dir="rtl">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-6 min-h-[70vh]">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
              <span className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-600 shrink-0">
                <Building2 className="w-6 h-6 animate-pulse" />
              </span>
              مركز إدارة المنشآت والخدمات والمتجر المصغر
            </h1>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              إدارة المساحات والمنشآت، الباقات والخدمات المساندة التخصصية، والمواد والوحدات الاستهلاكية المجهزة
            </p>
          </div>
        </div>

        {/* 3D Unified Domain Navigation Bar */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-white p-1 rounded-xl border border-slate-200/80 w-full shadow-2xs">
            {/* Tab 1: Halls */}
            <button
              type="button"
              onClick={() => setSelectedDomainTab('halls')}
              className={`py-2.5 px-3.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedDomainTab === 'halls' 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              <span className="truncate">القاعات والمنشآت ({scopedHalls.length})</span>
            </button>

            {/* Tab 2: Services */}
            <button
              type="button"
              onClick={() => setSelectedDomainTab('services')}
              className={`py-2.5 px-3.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedDomainTab === 'services' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">الخدمات المساندة ({scopedServices.length})</span>
            </button>

            {/* Tab 3: Mini Products Store */}
            <button
              type="button"
              onClick={() => setSelectedDomainTab('store')}
              className={`py-2.5 px-3.5 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedDomainTab === 'store' 
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span className="truncate">متجر المنتجات المصغر ({totalStoreProductsCount})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 px-2 shrink-0">
            <Info className="w-4 h-4 text-amber-600 shrink-0" />
            <span>هيكلية ثلاثية الأبعاد: منشآت ومساحات، خدمات مساندة مستقلة، ومستلزمات متجر مصغر</span>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2 animate-in fade-in duration-300">
          {selectedDomainTab === 'halls' ? (
            <HallsManagement
              userRole={userRole}
              currentProviderName={currentProviderName}
              currentProviderId={currentProviderId}
              currentUserName={currentUserName}
              providerSubscription={providerSubscription}
              providers={providers}
              regions={regions}
              halls={scopedHalls}
              setHalls={setHalls}
              services={scopedServices}
              setServices={setServices}
              showNotification={showNotification}
              activeTab="halls"
            />
          ) : selectedDomainTab === 'services' ? (
            userRole === 'provider' && !providerSubscription?.includesFullManagement ? (
              <>{finalRenderLockScreen('الإدارة الشاملة للحجوزات والخدمات', 'services')}</>
            ) : (
              <ServicesManagement
                userRole={userRole}
                currentProviderName={currentProviderName}
                currentProviderId={currentProviderId}
                currentUserName={currentUserName}
                providerSubscription={providerSubscription}
                providers={providers}
                regions={regions}
                services={scopedServices}
                setServices={setServices}
                halls={scopedHalls}
                setHalls={setHalls}
                showNotification={showNotification}
                setEditingItem={setEditingItem}
                setServiceForm={setServiceForm}
                setIsServiceModalOpen={setIsServiceModalOpen}
                setViewingService={setViewingService}
                setIsServiceViewModalOpen={setIsServiceViewModalOpen}
                setDeleteData={setDeleteData}
                formatCurrency={formatCurrency}
                hideHeader={true}
              />
            )
          ) : (
            <VenueProductsStoreTab
              userRole={userRole}
              currentProviderName={currentProviderName}
              currentProviderId={currentProviderId}
              halls={scopedHalls}
              setHalls={setHalls}
              showNotification={showNotification}
              formatCurrency={formatCurrency}
            />
          )}
        </div>
      </div>
    </div>
  );
}

