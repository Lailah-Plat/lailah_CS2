import React, { useState } from 'react';
import { 
  Megaphone, Target, Wallet, FileText, Percent, Share2, ShieldCheck, Plus, Check, CheckCircle2, X, Zap,
  Sparkles, Crown, Users, RefreshCw, Camera, Wand2
} from 'lucide-react';
import { 
  AgencyMarketingView, 
  ProviderMarketingWizard, 
  PromotionsManagement, 
  AdRequestProviderWizard, 
  AdRequestsTable 
} from './MarketingComponents';
import { InternalAdsManagement } from './InternalAdsManagement';
import { AffiliateMarketingTab } from './AffiliateMarketingTab';
import { AffiliateReferralDashboard } from './AffiliateReferralDashboard';
import { LPASManager } from './lpas/LPASManager';
import { GlobalPeakSeasonalPricingSection } from './admin/GlobalPeakSeasonalPricingSection';
import { AIMarketingStudio } from './growth/AIMarketingStudio';
import { InfluencerNetworkTab } from './growth/InfluencerNetworkTab';
import { AmbassadorProgramTab } from './growth/AmbassadorProgramTab';
import { SmartAutomationRetargetingTab } from './growth/SmartAutomationRetargetingTab';

interface MarketingManagementProps {
  userRole: string;
  canSwitchToAgency: boolean;
  currentProviderName: string;
  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  adRequests: any[];
  setAdRequests: React.Dispatch<React.SetStateAction<any[]>>;
  internalAds: any[];
  setInternalAds: React.Dispatch<React.SetStateAction<any[]>>;
  promotions: any[];
  setPromotions: React.Dispatch<React.SetStateAction<any[]>>;
  halls: any[];
  services: any[];
  providers: any[];
  currentUser: any;
  activeMarketingSubTab: string;
  setActiveMarketingSubTab: (v: any) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setAdminUsersSection: (v: string) => void;
}

export function MarketingManagement(props: MarketingManagementProps & { marketingCommissionPercentage?: number }) {
  const {
    userRole,
    canSwitchToAgency,
    currentProviderName,
    campaigns,
    setCampaigns,
    adRequests,
    setAdRequests,
    internalAds,
    setInternalAds,
    promotions,
    setPromotions,
    halls,
    services,
    providers,
    currentUser,
    activeMarketingSubTab,
    setActiveMarketingSubTab,
    showNotification,
    setAdminUsersSection,
    marketingCommissionPercentage = 20
  } = props;

  const commissionPct = marketingCommissionPercentage || 20;

  const tabsForMarketing = [
    { id: 'request_campaign', label: 'طلب حملة جديدة', icon: Megaphone, color: 'hover:text-amber-600 hover:border-amber-500' },
    ...((userRole === 'admin' || canSwitchToAgency) ? [
      { id: 'agency_campaigns', label: 'إدارة الحملات (لوحة الوكالة)', icon: Target, color: 'hover:text-purple-600 hover:border-purple-500' }
    ] : []),
    { id: 'request_ad', label: 'طلب إعلان', icon: Wallet, color: 'hover:text-blue-600 hover:border-blue-500' },
    ...(userRole === 'admin' ? [
      { id: 'manage_ads', label: 'إدارة الإعلانات', icon: FileText, color: 'hover:text-rose-600 hover:border-rose-500' }
    ] : []),
    { id: 'promotions_tab', label: 'طلبات العروض والخصومات', icon: Percent, color: 'hover:text-emerald-600 hover:border-emerald-555' },
    ...(userRole === 'admin' ? [
      { id: 'peak_pricing', label: '⚡ أسعار الذروة والمواسم والمحاكاة', icon: Zap, color: 'hover:text-amber-600 hover:border-amber-500' }
    ] : []),
    ...(userRole === 'admin' ? [
      { id: 'admin_grants', label: 'الحملات المجانية والمنح الإدارية (Grants)', icon: ShieldCheck, color: 'hover:text-amber-600 hover:border-amber-500' }
    ] : []),
    { id: 'affiliate_codes', label: 'أكواد التسويق بالإحالة والعمولات', icon: Share2, color: 'hover:text-amber-600 hover:border-amber-500' },
    { id: 'ai_marketing_studio', label: 'استوديو المحتوى والتسويق الذكي (AI Studio) 🪄', icon: Sparkles, color: 'hover:text-indigo-600 hover:border-indigo-500' },
    { id: 'influencers_network', label: 'شبكة المؤثرين وصناع المحتوى 📸', icon: Camera, color: 'hover:text-purple-600 hover:border-purple-500' },
    { id: 'ambassadors_program', label: 'برنامج سفراء ليلة والمكافآت 👑', icon: Crown, color: 'hover:text-amber-600 hover:border-amber-500' },
    { id: 'smart_retargeting', label: 'أتمتة الرسائل واستعادة الحجوزات 🔄', icon: RefreshCw, color: 'hover:text-emerald-600 hover:border-emerald-500' },
    { id: 'lpas_pages', label: 'محرك صفحات الهبوط (LPAS) 🎯', icon: Target, color: 'hover:text-amber-600 hover:border-amber-500' },
    ...(userRole === 'provider' ? [
      { id: 'my_requests', label: 'متابعة طلباتي', icon: FileText, color: 'hover:text-emerald-600 hover:border-emerald-500' }
    ] : [])
  ];

  return (
    <div id="marketing-management-wrapper" className="space-y-6">
      <div className="flex flex-col gap-2 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-32 bg-amber-500/10 blur-2xl pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/30">
                مركز النمو والتسويق الرقمي (Growth & Marketing Center)
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30">
                عزل محاسبي ووظيفي كامل ✅
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight">مركز النمو والتسويق (Growth & Marketing Center)</h1>
            <p className="text-slate-300 text-xs mt-1 max-w-3xl leading-relaxed">
              منظومة متكاملة لزيادة مبيعات المنشآت وحجوزات القاعات والخدمات عبر ثلاثة منتجات مستقلة وظيفياً ومحاسبياً: الحملات التسويقية المُدارة من الوكالات، العروض الترويجية والكوبونات، والإعلانات المباشرة داخل صفحات منصة ليلة.
            </p>
          </div>
        </div>

        {/* 3 Product Pillars Metric Highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
          {/* Pillar 1: Agency Campaigns */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-extrabold flex items-center gap-1.5 text-amber-400">
                <Megaphone className="w-4 h-4" /> 1. الحملات التسويقية المُدارة
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-mono font-bold">
                عمولة {commissionPct}% على الأتعاب فقط ({commissionPct * 100} BPS)
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">الحملات النشطة / المجهزة:</p>
                <p className="text-xl font-black text-white font-mono">{campaigns.filter((c: any) => c.status === 'نشطة' || c.status === 'نشط').length} حملة</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold">عمولة المنصة الصافية:</p>
                <p className="text-sm font-extrabold text-amber-300 font-mono">
                  {(campaigns.reduce((sum: number, c: any) => sum + ((c.agencyFee || 0) * (commissionPct / 100)), 0)).toLocaleString()} ر.س
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 2: Promotions & Coupons */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-extrabold flex items-center gap-1.5 text-emerald-400">
                <Percent className="w-4 h-4" /> 2. العروض الترويجية والكوبونات
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-mono font-bold">
                قواعد خصم + سياسات عمولة
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">العروض والكوبونات المفعلة:</p>
                <p className="text-xl font-black text-white font-mono">{promotions.filter((p: any) => p.status === 'active' || p.status === 'نشط').length} عرض</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold">احتساب العمولة:</p>
                <p className="text-xs font-bold text-emerald-300 font-sans">
                  بعد الخصم / قبل الخصم
                </p>
              </div>
            </div>
          </div>

          {/* Pillar 3: Internal Paid Ads */}
          <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 space-y-2">
            <div className="flex justify-between items-center text-xs text-slate-300">
              <span className="font-extrabold flex items-center gap-1.5 text-blue-400">
                <Wallet className="w-4 h-4" /> 3. الإعلانات الداخلية المباشرة
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full font-mono font-bold">
                4 مواقف + 4 مراحل اعتماد
              </span>
            </div>
            <div className="flex justify-between items-baseline pt-1">
              <div>
                <p className="text-[10px] text-slate-400 font-bold">البانرات والظهور النشط:</p>
                <p className="text-xl font-black text-white font-mono">{internalAds.filter((a: any) => a.status === 'نشط').length} إعلان</p>
              </div>
              <div className="text-left">
                <p className="text-[10px] text-slate-400 font-bold">إجمالي الإنطباعات:</p>
                <p className="text-sm font-extrabold text-blue-300 font-mono">
                  {(internalAds.reduce((sum: number, a: any) => sum + (a.views || 0), 0)).toLocaleString()} مشاهدة
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar flex items-center gap-1">
        {tabsForMarketing.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMarketingSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveMarketingSubTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap outline-none cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]'
                  : `text-slate-500 bg-transparent ${tab.color}`
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-amber-400' : 'text-slate-400'}`} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content rendering */}
      <div className="transition-all duration-300">
        {activeMarketingSubTab === 'request_campaign' && (
          <ProviderMarketingWizard 
            onSubmit={async (wizardData: any) => {
              try {
                const totalAmount = (wizardData.adBudget || 0) + (wizardData.agencyFee || 0);
                const response = await fetch('/api/marketing/pay-campaign', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': userRole,
                    'x-user-id': String(currentUser?.id || '1')
                  },
                  body: JSON.stringify({
                    title: wizardData.title || 'حملة تسويقية جديدة',
                    goalMetric: wizardData.goalMetric,
                    targetAudience: wizardData.targetAudience,
                    coreMessage: wizardData.coreMessage,
                    channel: wizardData.channel,
                    offer: wizardData.offer,
                    followUpMethod: wizardData.followUpMethod,
                    startDate: wizardData.startDate || new Date().toISOString().split('T')[0],
                    endDate: wizardData.endDate || '',
                    adBudget: wizardData.adBudget || 0,
                    agencyFee: wizardData.agencyFee || 0,
                    payWithWallet: !!wizardData.payWithWallet,
                    providerId: currentUser?.id || 1,
                    agencyId: 'agency-1' // default agency ID
                  })
                });

                if (!response.ok) {
                  const errData = await response.json();
                  throw new Error(errData.error || 'حدث خطأ أثناء معالجة الطلب والدفع');
                }

                const savedCamp = await response.json();
                
                // Add the new campaign to the list
                const formattedCamp = {
                  ...savedCamp,
                  id: savedCamp.id || Date.now(),
                  title: savedCamp.title || wizardData.title,
                  type: savedCamp.channel || wizardData.channel || 'قنوات متعددة',
                  targetAudience: savedCamp.targetAudience || wizardData.targetAudience,
                  budget: totalAmount,
                  spent: 0,
                  reach: 0,
                  clicks: 0,
                  conversions: 0,
                  status: 'نشطة',
                  startDate: savedCamp.startDate || wizardData.startDate,
                  endDate: savedCamp.endDate || wizardData.endDate,
                  content: savedCamp.coreMessage || wizardData.coreMessage,
                  providerName: currentProviderName || 'قاعة ليلة',
                  adBudget: wizardData.adBudget || 0,
                  agencyFee: wizardData.agencyFee || 0,
                  agencyNetProfit: (wizardData.agencyFee || 0) * 0.85, 
                  workflowStatus: savedCamp.workflowStatus || 'تحت التجهيز'
                };

                setCampaigns((prev: any[]) => [formattedCamp, ...prev]);
                showNotification('success', wizardData.payWithWallet 
                  ? 'تم تمويل وإطلاق الحملة التسويقية بنجاح خصماً من محفظتك الذكية!' 
                  : 'تم تقديم وإعتماد طلب الحملة بنجاح!');
                
                if (userRole === 'admin' || canSwitchToAgency) {
                  setActiveMarketingSubTab('agency_campaigns');
                } else {
                  setActiveMarketingSubTab('my_requests');
                }
              } catch (error: any) {
                showNotification('error', error.message || 'فشلت عملية الدفع لتمويل الحملة');
              }
            }}
          />
        )}

        {activeMarketingSubTab === 'agency_campaigns' && (userRole === 'admin' || canSwitchToAgency) && (
          <AgencyMarketingView 
            campaigns={campaigns} 
            setCampaigns={setCampaigns} 
            setActiveTab={setAdminUsersSection}
          />
        )}

        {activeMarketingSubTab === 'request_ad' && (userRole === 'admin' || userRole === 'provider') && (
          <div className="space-y-6">
            <AdRequestProviderWizard 
              onSubmit={(formData: any) => {
                const newAd = {
                  id: Date.now() % 10000,
                  providerName: currentProviderName || formData.advertiserName || 'قاعة ليلة',
                  advertiserName: formData.advertiserName,
                  advertiserPhone: formData.advertiserPhone,
                  advertiserEmail: formData.advertiserEmail,
                  adType: formData.adType,
                  adLocation: formData.adLocation,
                  adBudget: formData.adBudget,
                  startDate: formData.startDate,
                  status: 'قيد المراجعة'
                };
                setAdRequests([newAd, ...adRequests]);
                showNotification('success', 'تم تقديم طلب الإعلان بنجاح وجارٍ مراجعته من الإدارة.');
                if (userRole === 'provider') {
                  setActiveMarketingSubTab('my_requests');
                }
              }}
              currentUserData={currentUser}
            />
            <AdRequestsTable 
              requests={userRole === 'admin' ? adRequests : adRequests.filter((r: any) => r.providerName === currentProviderName)} 
              userRole={userRole}
              onStatusChange={(requestId: number, newStatus: 'نشطة' | 'ملغية' | 'قيد المراجعة', requestData: any) => {
                setAdRequests(prev => prev.map(req => {
                  if (req.id === requestId) {
                    return { ...req, status: newStatus };
                  }
                  return req;
                }));
                
                if (newStatus === 'نشطة') {
                  const defaultEndDate = new Date(requestData.startDate || new Date());
                  defaultEndDate.setDate(defaultEndDate.getDate() + 30);
                  const formattedEnd = requestData.endDate || defaultEndDate.toISOString().split('T')[0];
                  
                  const newActiveAd = {
                    id: Date.now() % 100000,
                    name: requestData.title || `عرض ${requestData.providerName || requestData.advertiserName || 'إعلان داخلي'}`,
                    location: requestData.adLocation || 'أعلى الصفحة الرئيسية',
                    type: requestData.adType || 'صورة (بنر)',
                    status: 'نشط',
                    views: 0,
                    clicks: 0,
                    revenue: requestData.adBudget || 1000,
                    startDate: requestData.startDate || new Date().toISOString().split('T')[0],
                    endDate: formattedEnd,
                    providerName: requestData.providerName || requestData.advertiserName || 'قاعة ليلة'
                  };
                  setInternalAds(prev => [newActiveAd, ...prev]);
                  showNotification('success', `تم تأكيد استلام الدفع وتنشيط الإعلان بنجاح! وتم توجيهه إلى المنصة وتثبيته في: ${requestData.adLocation}`);
                } else if (newStatus === 'ملغية') {
                  showNotification('info', 'تم إلغاء طلب الإعلان الداخلي بنجاح وصرف النظر عنه.');
                }
              }}
            />
          </div>
        )}

        {activeMarketingSubTab === 'manage_ads' && userRole === 'admin' && (
          <InternalAdsManagement 
            internalAds={internalAds} 
            setInternalAds={setInternalAds} 
          />
        )}

        {activeMarketingSubTab === 'promotions_tab' && (
          <PromotionsManagement 
            promotions={promotions}
            setPromotions={setPromotions}
            halls={halls}
            services={services}
            userRole={userRole}
            providerName={currentProviderName}
            providers={providers}
            showNotification={showNotification}
          />
        )}

        {activeMarketingSubTab === 'peak_pricing' && userRole === 'admin' && (
          <GlobalPeakSeasonalPricingSection
            halls={halls}
            showNotification={showNotification}
          />
        )}

        {activeMarketingSubTab === 'admin_grants' && userRole === 'admin' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6 text-right font-sans" dir="rtl">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100">
              <div>
                <span className="bg-amber-500/20 text-amber-800 text-[10px] font-black px-3 py-1 rounded-full border border-amber-400/30">
                  مسار مستقل: AdministrativeMarketingGrant 🛡️
                </span>
                <h3 className="text-lg font-black text-slate-800 mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-600" />
                  إدارة الحملات والمنح التسويقية المجانية للمزودين (Dual Approval Grants)
                </h3>
                <p className="text-xs text-slate-500 font-bold mt-1">
                  مسار سيادي لمنح المزودين المتميزين أو الجدد حملات تسويقية مجانية برقم سجل موثق (GRT-26-XXXXXXXXXX) وتكفل منصة ليلة بتغطية ميزانية البث وأتعاب الوكالة.
                </p>
              </div>
            </div>

            {/* Grants List & Form */}
            <AdministrativeGrantsManager 
              providers={providers}
              campaigns={campaigns}
              setCampaigns={setCampaigns}
              showNotification={showNotification}
            />
          </div>
        )}

        {activeMarketingSubTab === 'affiliate_codes' && (
          <AffiliateReferralDashboard
            showNotification={showNotification}
          />
        )}

        {activeMarketingSubTab === 'ai_marketing_studio' && (
          <AIMarketingStudio
            halls={halls}
            services={services}
            providers={providers}
            currentUser={currentUser}
            showNotification={showNotification}
          />
        )}

        {activeMarketingSubTab === 'influencers_network' && (
          <InfluencerNetworkTab
            halls={halls}
            services={services}
            providers={providers}
            currentUser={currentUser}
            showNotification={showNotification}
          />
        )}

        {activeMarketingSubTab === 'ambassadors_program' && (
          <AmbassadorProgramTab
            currentUser={currentUser}
            showNotification={showNotification}
          />
        )}

        {activeMarketingSubTab === 'smart_retargeting' && (
          <SmartAutomationRetargetingTab
            currentUser={currentUser}
            showNotification={showNotification}
          />
        )}

        {activeMarketingSubTab === 'lpas_pages' && (
          <LPASManager
            onSelectPageToRegister={(context) => {
              showNotification('info', `تم اختيار القالب بسياق تسجيل: ${context?.providerType || 'عام'}`);
            }}
          />
        )}

        {activeMarketingSubTab === 'my_requests' && userRole === 'provider' && (() => {
          const myCampaigns = campaigns.filter((c: any) => c.providerName === currentProviderName);
          const myAdRequests = adRequests.filter((r: any) => r.providerName === currentProviderName);

          return (
            <div className="space-y-8 animate-in fade-in duration-300">
              {/* Stats Header */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-indigo-500 transition-all">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Megaphone className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">طلبات الحملات التسويقية</p>
                    <h3 className="text-xl font-black text-slate-800">{myCampaigns.length} حملة تسويقية</h3>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:border-blue-500 transition-all">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 font-bold">طلبات الإعلانات الفردية</p>
                    <h3 className="text-xl font-black text-slate-800">{myAdRequests.length} إعلان ممول</h3>
                  </div>
                </div>
              </div>

              {/* Campaigns requested */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-base">
                    📋 طلبات الحملات التسويقية الخاصة بك
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">تتبع حالة الحملات المعقودة والمطلوبة من طرف الوكالة والجهة المشرفة.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-4 font-bold">معرف الحملة</th>
                        <th className="p-4 font-bold">عنوان الحملة والمقصد</th>
                        <th className="p-4 font-bold">قناة البث</th>
                        <th className="p-4 font-bold">ميزانية الإطلاق</th>
                        <th className="p-4 font-bold">تاريخ البدء</th>
                        <th className="p-4 font-bold">حالة التجهيز</th>
                        <th className="p-4 font-bold">حالة التشغيل</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-705">
                      {myCampaigns.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="text-center p-8 text-slate-400 font-bold">لا توجد طلبات حملات تسويقية حالياً.</td>
                        </tr>
                      ) : (
                        myCampaigns.map((c: any) => (
                          <tr key={c.id} className="hover:bg-slate-50/35 transition-colors">
                            <td className="p-4 font-mono text-slate-400">#{c.id}</td>
                            <td className="p-4 font-bold text-slate-800">
                              {c.title}
                              {c.content && <p className="text-[10px] text-slate-400 font-normal mt-1">{c.content}</p>}
                            </td>
                            <td className="p-4 font-semibold text-indigo-600">{c.type || 'تغطية متكاملة'}</td>
                            <td className="p-4 font-mono font-bold text-slate-800">{(c.budget || 0).toLocaleString()} ر.س</td>
                            <td className="p-4 font-mono text-slate-500">{c.startDate || '-'}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold ${
                                c.workflowStatus === 'جاهز للبث' ? 'bg-green-50 text-green-700 border border-green-150' :
                                c.workflowStatus === 'نشط قيد الاستهداف' ? 'bg-blue-50 text-blue-700 border border-blue-150' :
                                'bg-amber-50 text-amber-700 border border-amber-150'
                              }`}>
                                {c.workflowStatus || 'تحت التجهيز'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-bold ${
                                c.status === 'نشطة' ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {c.status || 'متوقفة'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Ads requested */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-50 bg-slate-55 bg-slate-50/50">
                  <h3 className="font-bold text-slate-800 text-base">
                    📣 طلبات الإعلان الفردية الخاصة بك (إعلان ممول داخل المنصة)
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1">طلبات المساحات الإعلانية التي قمت برفعها للتنسيق ومثولها في الواجهة الرئيسية للمنصة.</p>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                      <tr>
                        <th className="p-4 font-bold">رقم الطلب</th>
                        <th className="p-4 font-bold">موقع ومساحة الإعلان</th>
                        <th className="p-4 font-bold">نوع التصميم المفرغ</th>
                        <th className="p-4 font-bold">ميزانية الإعلان</th>
                        <th className="p-4 font-bold">تاريخ البداية</th>
                        <th className="p-4 font-bold">الحالة التشغيلية والبت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-slate-705">
                      {myAdRequests.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-slate-400 font-bold">لا توجد طلبات إعلان داخلي حالياً.</td>
                        </tr>
                      ) : (
                        myAdRequests.map((r: any) => (
                          <tr key={r.id} className="hover:bg-slate-50/35 transition-colors">
                            <td className="p-4 font-mono text-slate-400">#{r.id}</td>
                            <td className="p-4 font-bold text-slate-800">{r.adLocation || 'أعلى الصفحة الرئيسية'}</td>
                            <td className="p-4 text-indigo-500 font-semibold">{r.adType || 'صورة (بنر)'}</td>
                            <td className="p-4 font-mono font-bold text-slate-800">{r.adBudget ? `${r.adBudget.toLocaleString()} ر.س` : '-'}</td>
                            <td className="p-4 font-mono text-slate-500">{r.startDate || '-'}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                r.status === 'مدفوع' || r.status === 'نشطة' || r.status === 'نشط' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                r.status === 'مرفوض' ? 'bg-red-50 text-red-700 border border-red-200' :
                                'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  r.status === 'مدفوع' || r.status === 'نشطة' || r.status === 'نشط' ? 'bg-emerald-500 animate-pulse' :
                                  r.status === 'مرفوض' ? 'bg-red-500' : 'bg-amber-500'
                                }`} />
                                {r.status || 'قيد المراجعة'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
}

function AdministrativeGrantsManager({ providers = [], campaigns = [], setCampaigns, showNotification }: any) {
  const [grants, setGrants] = useState<any[]>([
    {
      id: 1,
      grantNumber: 'GRT-26-0000000001',
      srvNumber: 'SRV-26-0000000088',
      providerName: 'قاعة ليلة الشرق',
      grantReason: 'منحة تشجيعية بمناسبة الانضمام للمنصة والتميز الميداني',
      grantedBudget: 5000,
      agencyFeeCovered: 1000,
      budgetSource: 'ميزانية المنح التسويقية والنمو - منصة ليلة',
      costCenter: 'مركز كلفة النمو السيادي',
      financialImpact: 'تتكفل ليلة بـ 100% من المصروفات',
      creatorEmployeeName: 'أحمد علي (أخصائي التسويق)',
      approvingManagerName: 'سارة خالد (مدير النمو والتسويق)',
      status: 'Approved',
      startDate: '2026-08-01',
      endDate: '2026-08-31',
      auditLog: '2026-08-01: تم إنشاء المنحة بواسطة أحمد علي\n2026-08-01: تم اعتماد المنحة بواسطة سارة خالد وتوليد حملة CMP-26-0000000088'
    }
  ]);

  const [showGrantModal, setShowGrantModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('');
  const [grantReason, setGrantReason] = useState('');
  const [grantedBudget, setGrantedBudget] = useState(3000);
  const [agencyFeeCovered, setAgencyFeeCovered] = useState(600);
  const [budgetSource, setBudgetSource] = useState('ميزانية المنح التسويقية والنمو - منصة ليلة');
  const [costCenter, setCostCenter] = useState('مركز كلفة التسويق والنمو السيادي');
  const [financialImpact, setFinancialImpact] = useState('تحمل منصة ليلة 100% من الميزانية وأتعاب الوكالة');
  const [creatorEmployeeName, setCreatorEmployeeName] = useState('موظف النمو والتسويق');
  const [approvingManagerName, setApprovingManagerName] = useState('مدير قطاع النمو والعمليات');

  // Handle Create Grant
  const handleCreateGrant = () => {
    if (!selectedProvider || !grantReason) {
      showNotification('warning', 'يرجى تحديد المزود المستفيد وسبب المنحة التسويقية.');
      return;
    }

    const year = '26';
    const randSeq = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const grantNumber = `GRT-${year}-${randSeq}`;
    const srvNumber = `SRV-${year}-${randSeq}`;

    const newGrant = {
      id: Date.now(),
      grantNumber,
      srvNumber,
      providerName: selectedProvider,
      grantReason,
      grantedBudget: Number(grantedBudget) || 0,
      agencyFeeCovered: Number(agencyFeeCovered) || 0,
      budgetSource,
      costCenter,
      financialImpact,
      creatorEmployeeName,
      approvingManagerName,
      status: 'PendingManagerApproval',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      auditLog: `${new Date().toISOString().split('T')[0]}: تم تسجيل طلب المنحة بواسطة ${creatorEmployeeName} وفي انتظار اعتماد المدير (${approvingManagerName}).`
    };

    setGrants([newGrant, ...grants]);
    setShowGrantModal(false);
    setSelectedProvider('');
    setGrantReason('');
    showNotification('success', `تم تسجيل طلب المنحة الإدارية (${grantNumber}) بنجاح وتحويله للمدير المخول بالاعتماد.`);
  };

  // Handle Approve Grant by Manager
  const handleApproveGrant = (grant: any) => {
    const year = '26';
    const randSeq = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const campaignId = `CMP-${year}-${randSeq}`;

    const updatedGrants = grants.map(g => {
      if (g.id === grant.id) {
        return {
          ...g,
          status: 'Approved',
          campaignId,
          auditLog: `${g.auditLog}\n${new Date().toISOString().split('T')[0]}: تم اعتماد المنحة رسمياً بواسطة ${g.approvingManagerName} وإطلاق الحملة (${campaignId}).`
        };
      }
      return g;
    });

    setGrants(updatedGrants);

    // Automatically create an active campaign
    const newCamp = {
      id: campaignId,
      srvNumber: grant.srvNumber,
      grantNumber: grant.grantNumber,
      isAdministrativeGrant: true,
      title: `[منحة مجانية] ${grant.grantReason.slice(0, 30)}... - ${grant.providerName}`,
      providerName: grant.providerName,
      provider: grant.providerName,
      adBudget: grant.grantedBudget,
      agencyFee: grant.agencyFeeCovered,
      agencyNetProfit: grant.agencyFeeCovered * 0.85,
      budget: grant.grantedBudget + grant.agencyFeeCovered,
      spent: 0,
      status: 'نشطة',
      paymentStatus: 'منحة مجانية (مغطاة بالكامل من ليلة)',
      createdAt: new Date().toISOString().split('T')[0],
      workflowStatus: 'جاهز للبث'
    };

    if (setCampaigns) {
      setCampaigns((prev: any[]) => [newCamp, ...prev]);
    }

    showNotification('success', `تمت الموافقة المزدوجة واعتماد المنحة (${grant.grantNumber}) وإطلاق الحملة الممنوحة (${campaignId}) للمزود!`);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Metric summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200">
          <p className="text-xs font-bold text-amber-800">إجمالي المنح الإدارية المسجلة</p>
          <p className="text-2xl font-black text-amber-950 font-mono mt-1">{grants.length} منحة</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200">
          <p className="text-xs font-bold text-emerald-800">الميزانيات الممنوحة المعتمدة</p>
          <p className="text-2xl font-black text-emerald-950 font-mono mt-1">
            {grants.filter(g => g.status === 'Approved').reduce((s, g) => s + g.grantedBudget + g.agencyFeeCovered, 0).toLocaleString()} ر.س
          </p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-200">
          <p className="text-xs font-bold text-indigo-800">طلبات قيد اعتماد المدير (Dual Approval)</p>
          <p className="text-2xl font-black text-indigo-950 font-mono mt-1">
            {grants.filter(g => g.status === 'PendingManagerApproval').length} طلب معلق
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h4 className="text-sm font-black text-slate-800">سجل المنح الإدارية والحملات الممنوحة:</h4>
        <button
          onClick={() => setShowGrantModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md hover:from-amber-600 hover:to-amber-700 flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" />
          إنشاء منحة تسويقية جديدة للمزود (AdministrativeGrant)
        </button>
      </div>

      {/* Grants Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200">
            <tr>
              <th className="p-3">رقم المنحة والخدمة</th>
              <th className="p-3">المزود المستفيد</th>
              <th className="p-3">سبب المنحة</th>
              <th className="p-3">الميزانية والأتعاب</th>
              <th className="p-3">مصدر الميزانية ومركز التكلفة</th>
              <th className="p-3">المُنشئ والمدير المعتمد</th>
              <th className="p-3 text-center">الحالة والإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-sans">
            {grants.map(grant => (
              <tr key={grant.id} className="hover:bg-slate-50 transition-colors">
                <td className="p-3">
                  <p className="font-mono font-bold text-amber-800">{grant.grantNumber}</p>
                  <p className="text-[10px] font-mono text-slate-400">{grant.srvNumber}</p>
                </td>
                <td className="p-3 font-bold text-slate-800">{grant.providerName}</td>
                <td className="p-3 text-slate-600 max-w-xs">{grant.grantReason}</td>
                <td className="p-3">
                  <p className="font-bold text-emerald-700 font-mono">بث: {grant.grantedBudget?.toLocaleString()} ر.س</p>
                  <p className="text-[10px] text-purple-700 font-mono">أتعاب: {grant.agencyFeeCovered?.toLocaleString()} ر.س</p>
                </td>
                <td className="p-3 text-[11px]">
                  <p className="font-medium text-slate-700">{grant.budgetSource}</p>
                  <p className="text-slate-400 font-mono">{grant.costCenter}</p>
                </td>
                <td className="p-3 text-[11px]">
                  <p className="text-slate-600">منشئ: <span className="font-bold">{grant.creatorEmployeeName}</span></p>
                  <p className="text-slate-600">اعتماد: <span className="font-bold text-amber-800">{grant.approvingManagerName}</span></p>
                </td>
                <td className="p-3 text-center">
                  {grant.status === 'PendingManagerApproval' ? (
                    <button
                      onClick={() => handleApproveGrant(grant)}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-lg text-[10px] cursor-pointer shadow-sm transition-all flex items-center gap-1 mx-auto"
                    >
                      <Check className="w-3.5 h-3.5" />
                      اعتماد المدير وإطلاق الحملة
                    </button>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      معتمدة ومُطلقة ({grant.campaignId || 'CMP'})
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grant Creation Modal */}
      {showGrantModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-right font-sans" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                نموذج منحة تسويقية إدارية مجانية (AdministrativeMarketingGrant)
              </h3>
              <button onClick={() => setShowGrantModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">المزود المستفيد</label>
                <select
                  value={selectedProvider}
                  onChange={e => setSelectedProvider(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none"
                >
                  <option value="">اختر المزود المستفيد...</option>
                  {providers.map((p: any) => (
                    <option key={p.id || p.name} value={p.name || p.providerName}>{p.name || p.providerName}</option>
                  ))}
                  <option value="قاعة ليلة الشرق">قاعة ليلة الشرق</option>
                  <option value="قاعة ليلة الرياض">قاعة ليلة الرياض</option>
                  <option value="مزود الخدمة المتميز">مزود الخدمة المتميز</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">سبب المنحة والمناسبة</label>
                <input
                  type="text"
                  placeholder="مثال: منحة تشجيعية للتميز في عدد الحجوزات"
                  value={grantReason}
                  onChange={e => setGrantReason(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">ميزانية البث الممنوحة (ر.س)</label>
                <input
                  type="number"
                  value={grantedBudget}
                  onChange={e => setGrantedBudget(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">أتعاب الوكالة المغطاة بواسطة ليلة (ر.س)</label>
                <input
                  type="number"
                  value={agencyFeeCovered}
                  onChange={e => setAgencyFeeCovered(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">مصدر ميزانية المنحة</label>
                <input
                  type="text"
                  value={budgetSource}
                  onChange={e => setBudgetSource(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">مركز التكلفة المحاسبي</label>
                <input
                  type="text"
                  value={costCenter}
                  onChange={e => setCostCenter(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الموظف المنشئ للطلب</label>
                <input
                  type="text"
                  value={creatorEmployeeName}
                  onChange={e => setCreatorEmployeeName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">المدير المخول بالاعتماد (Dual Approver)</label>
                <input
                  type="text"
                  value={approvingManagerName}
                  onChange={e => setApprovingManagerName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowGrantModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleCreateGrant}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                حفظ ورفع المنحة لاعتماد المدير
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
