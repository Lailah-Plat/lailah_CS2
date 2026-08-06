import React, { useState } from 'react';
import { Building2, Layers, Info } from 'lucide-react';
import HallsManagement from './HallsManagement';
import ServicesManagement from './ServicesManagement';

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
  const [selectedDomainTab, setSelectedDomainTab] = useState<'halls' | 'services'>(
    activeTab === 'services' ? 'services' : 'halls'
  );

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
              إدارة القاعات والخدمات المساندة ✨
            </h1>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed">
              {userRole === 'provider' 
                ? `بوابة مزود الخدمة لإدارة القاعات والمنشآت وتفعيل باقات الخدمات المساندة المخصصة لمؤسسة: ${currentProviderName}` 
                : 'البوابة الإدارية المركزية لمراقبة وتعديل وتفعيل قاعات الشركاء والخدمات النشطة بالمنصة'}
            </p>
          </div>
        </div>

        {/* Clean Domain Separation Tab Switcher */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50 p-2.5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="flex bg-white p-1 rounded-xl border border-slate-200/80 max-w-xl w-full shadow-2xs">
            <button
              type="button"
              onClick={() => setSelectedDomainTab('halls')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedDomainTab === 'halls' 
                  ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-4 h-4" />
              <span>إدارة المنشآت والقاعات والخدمات المباشرة ({halls.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedDomainTab('services')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                selectedDomainTab === 'services' 
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>دليل الخدمات المساندة المستقلة ({services.length})</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 font-medium flex items-center gap-2 px-2">
            <Info className="w-4 h-4 text-purple-600 shrink-0" />
            <span>عزل برميجي كامل للمجالات: خدمات القاعة المباشرة مقابل دليل الماركت بليس المستقل (Rule 5 & 6)</span>
          </div>
        </div>

        {/* Tab Content Display */}
        <div className="pt-2 animate-in fade-in duration-300">
          {selectedDomainTab === 'halls' ? (
            <HallsManagement
              userRole={userRole}
              currentProviderName={currentProviderName}
              currentUserName={currentUserName}
              providerSubscription={providerSubscription}
              providers={providers}
              regions={regions}
              halls={halls}
              setHalls={setHalls}
              services={services}
              setServices={setServices}
              showNotification={showNotification}
              activeTab="halls"
            />
          ) : (
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
                services={services}
                setServices={setServices}
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
          )}
        </div>
      </div>
    </div>
  );
}

