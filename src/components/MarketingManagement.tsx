import React from 'react';
import { 
  Megaphone, Target, Wallet, FileText, Percent 
} from 'lucide-react';
import { 
  AgencyMarketingView, 
  ProviderMarketingWizard, 
  PromotionsManagement, 
  AdRequestProviderWizard, 
  AdRequestsTable 
} from './MarketingComponents';
import { InternalAdsManagement } from './InternalAdsManagement';

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

export function MarketingManagement({
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
  setAdminUsersSection
}: MarketingManagementProps) {

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
    ...(userRole === 'provider' ? [
      { id: 'my_requests', label: 'متابعة طلباتي', icon: FileText, color: 'hover:text-emerald-600 hover:border-emerald-500' }
    ] : [])
  ];

  return (
    <div id="marketing-management-wrapper" className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-black text-slate-800">التسويق والإعلانات</h1>
        <p className="text-slate-500 text-sm">إدارة الحملات التسويقية، العروض الترويجية، والإعلانات الداخلية للمنشآت.</p>
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
