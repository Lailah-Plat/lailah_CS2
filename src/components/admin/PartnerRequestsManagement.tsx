import React from 'react';
import { Sparkles, Check, X, Settings2, TrendingDown } from 'lucide-react';
import { PromotionsManagement } from '../MarketingComponents';

interface PartnerRequestsManagementProps {
  seasonRequests: any[];
  setSeasonRequests: React.Dispatch<React.SetStateAction<any[]>>;
  activeProvidersSubTab: 'seasons' | 'promotions' | 'force_majeure';
  setActiveProvidersSubTab: (tab: 'seasons' | 'promotions' | 'force_majeure') => void;
  inventorySettings: any;
  handleUpdateInventorySettings: (settings: { priceChangeLockPeriod: number }) => void;
  selectedSeasonRequestForModal: any;
  setSelectedSeasonRequestForModal: (req: any) => void;
  promotions: any[];
  setPromotions: React.Dispatch<React.SetStateAction<any[]>>;
  halls: any[];
  services: any[];
  currentProviderName: string;
  setActiveTab: (tab: any) => void;
  forceMajeureRequests: any[];
  fetchForceMajeureRequests: () => void;
  financialSettingsState: any;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
}

export const PartnerRequestsManagement: React.FC<PartnerRequestsManagementProps> = ({
  seasonRequests,
  setSeasonRequests,
  activeProvidersSubTab,
  setActiveProvidersSubTab,
  inventorySettings,
  handleUpdateInventorySettings,
  selectedSeasonRequestForModal,
  setSelectedSeasonRequestForModal,
  promotions,
  setPromotions,
  halls,
  services,
  currentProviderName,
  setActiveTab,
  forceMajeureRequests,
  fetchForceMajeureRequests,
  financialSettingsState,
  showNotification,
  setBookings,
}) => {
  const pendingCount = seasonRequests.filter((r: any) => r.status === 'بانتظار الموافقة').length;
  const approvedCount = seasonRequests.filter((r: any) => r.status === 'معتمد').length;
  const totalCount = seasonRequests.length;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header with Title and Dashboard counters */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white/80 backdrop-blur p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-indigo-600 animate-pulse" />
            طلبات الشركاء والمواسم وحظر التعديلات
          </h2>
          <p className="text-slate-500 text-xs mt-1">
            مراجعة أسعار الذروة الموسمية والتحكم في مهلة حظر تذبذب وتغيير الأسعار الشديد للشركاء
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
            <div>
              <span className="text-[10px] text-amber-800 font-bold block">بانتظار البت</span>
              <span className="text-sm font-black text-amber-900 font-mono">{pendingCount} طلب</span>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-100 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <div>
              <span className="text-[10px] text-emerald-800 font-bold block">معتمد</span>
              <span className="text-sm font-black text-emerald-900 font-mono">{approvedCount} طلب</span>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 px-4 py-2.5 rounded-2xl flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">إجمالي المعاملات</span>
              <span className="text-sm font-black text-slate-700 font-mono">{totalCount} طلب</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtabs switcher */}
      <div className="bg-white p-2 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto no-scrollbar flex items-center gap-1">
        <button
          onClick={() => setActiveProvidersSubTab('seasons')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap outline-none cursor-pointer ${
            activeProvidersSubTab === 'seasons'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]'
              : 'text-slate-500 bg-transparent hover:text-slate-800 animate-none'
          }`}
        >
          📋 طلبات أسعار المواسم وضوابط الحظر
        </button>
        <button
          onClick={() => setActiveProvidersSubTab('promotions')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap outline-none cursor-pointer ${
            activeProvidersSubTab === 'promotions'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]'
              : 'text-slate-500 bg-transparent hover:text-slate-800 animate-none'
          }`}
        >
          🏷️ العروض والخصومات المعتمدة للشركاء
        </button>
        <button
          onClick={() => {
            setActiveProvidersSubTab('force_majeure');
            fetchForceMajeureRequests();
          }}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-black transition-all whitespace-nowrap outline-none cursor-pointer ${
            activeProvidersSubTab === 'force_majeure'
              ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/10 scale-[1.02]'
              : 'text-slate-500 bg-transparent hover:text-slate-800 animate-none'
          }`}
        >
          ⚠️ طابور القوة القاهرة الإستثنائي
        </button>
      </div>

      {activeProvidersSubTab === 'seasons' && (
        <>
          {/* Locks Control Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 text-right">
                <Settings2 className="w-5 h-5 text-indigo-500" />
                التحكم بفترات حظر وضوابط تعديل الأسعار
              </h3>
              <p className="text-slate-500 text-xs mt-1 text-right">يمنع هذا الضابط الشركاء من التلاعب بالأسعار وإدخال تذبذبات متكررة تعبث بقوانين المنافسة العادلة بالمنصة.</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <label className="text-xs font-bold text-slate-600">مهلة حظر التعديل المتكرر:</label>
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 font-mono">
                <input 
                  type="number" 
                  value={inventorySettings.priceChangeLockPeriod || 7}
                  onChange={(e) => handleUpdateInventorySettings({ priceChangeLockPeriod: Number(e.target.value) || 0 })}
                  className="w-12 bg-transparent text-center font-bold text-slate-800 border-none outline-none text-xs text-right"
                />
                <span className="text-xs text-slate-500">أيام</span>
              </div>
            </div>
          </div>

          {/* Season Proposals Approval Queue */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden text-right" dir="rtl">
            <div className="p-6 border-b border-slate-50 bg-slate-50/30">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                صندوق طلبات واعتماد تسعيرات الذروة الموسمية
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">طلبات مقدمة من الشركاء لاعتماد تغيير هامش الأسعار لفترات الأعياد والمواسم القومية.</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="p-4 font-bold text-xs">رقم الطلب</th>
                    <th className="p-4 font-bold text-xs">الشريك (المزود)</th>
                    <th className="p-4 font-bold text-xs">الموسم / المناسبة</th>
                    <th className="p-4 font-bold text-xs">الفترة الزمنية</th>
                    <th className="p-4 font-bold text-xs">فارق السعر التكميلي</th>
                    <th className="p-4 font-bold text-xs">الحالة الحالية</th>
                    <th className="p-4 font-bold text-xs text-center">الإجراءات والبت الإداري</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {seasonRequests.map((req: any) => (
                    <tr key={req.id} className="hover:bg-slate-50/30 transition-colors">
                      <td className="p-4">
                        <button 
                          onClick={() => setSelectedSeasonRequestForModal(req)}
                          className="font-mono text-xs font-bold text-indigo-600 hover:text-indigo-800 hover:underline bg-indigo-50/50 hover:bg-indigo-50 px-2 py-1 rounded transition-all cursor-pointer"
                          title="عرض تفاصيل الطلب"
                          id={`btn-season-req-${req.id}`}
                        >
                          {req.id}
                        </button>
                      </td>
                      <td className="p-4 font-bold text-slate-800 text-xs">{req.provider}</td>
                      <td className="p-4 text-xs font-bold text-slate-700">{req.seasonName}</td>
                      <td className="p-4 text-xs text-slate-500 font-mono">من {req.startDate} إلى {req.endDate}</td>
                      <td className="p-4 font-mono text-xs font-bold text-right">
                        {req.increaseValue < 0 ? (
                          <span className="text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded">
                            {req.increaseType === 'percentage' ? `${req.increaseValue}%` : `${req.increaseValue} ر.س`} (تخفيض موسمي)
                          </span>
                        ) : (
                          <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded">
                            {req.increaseType === 'percentage' ? `+${req.increaseValue}%` : `+${req.increaseValue} ر.س`} (زيادة ذروة)
                          </span>
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                          req.status === 'معتمد' ? 'bg-green-50 text-green-700 border border-green-200' :
                          req.status === 'مرفوض' ? 'bg-red-50 text-red-700 border border-red-200' :
                          req.status === 'ملغى' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          req.status === 'منتهي مبكراً' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2 justify-center items-center">
                          {req.status === 'بانتظار الموافقة' ? (
                            <>
                              <button 
                                onClick={() => {
                                  setSeasonRequests(seasonRequests.map((r: any) => r.id === req.id ? {...r, status: 'معتمد'} : r));
                                  alert(`تم اعتماد التسعيرة الخاصة بـ "${req.seasonName}" للملف بنجاح! 🟢`);
                                }}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" /> اعتماد الطلب
                              </button>
                              <button 
                                onClick={() => {
                                  setSeasonRequests(seasonRequests.map((r: any) => r.id === req.id ? {...r, status: 'مرفوض'} : r));
                                  alert(`تم رفض وتجميد طلب التسعيرة الموسمية لـ "${req.seasonName}". 🔴`);
                                }}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 border border-red-100 cursor-pointer"
                              >
                                <X className="w-3.5 h-3.5" /> رفض الطلب
                              </button>
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">تم البت بالطلب مسبقاً</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {seasonRequests.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center p-8 text-slate-400 text-xs">لا توجد طلبات معلقة بالمواسم حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeProvidersSubTab === 'promotions' && (
        <PromotionsManagement 
          promotions={promotions}
          setPromotions={setPromotions}
          halls={halls}
          services={services}
          userRole="admin"
          providerName={currentProviderName}
          onOpenAdCampaignWizard={() => setActiveTab('marketing')}
        />
      )}

      {activeProvidersSubTab === 'force_majeure' && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right" dir="rtl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-amber-500/5 p-4 rounded-xl border border-amber-500/15 gap-4 text-right">
            <div>
              <h3 className="text-lg font-bold text-amber-850 flex items-center gap-2 justify-end">
                <span>⚠️</span> طابور الظروف القاهرة وحالات الإلغاء الطارئ للشركاء
              </h3>
              <p className="text-xs text-amber-700 mt-1">
                يقوم هذا القسم بإدراج تذاكر وطلبات الإلغاء الاستثنائية التي يتقدم بها العملاء بعد فوات فترة الإلغاء المجاني بداعي الظروف الخارجة عن الإرادة. يتوجب على لجنة الحوكمة اتخاذ قرار الرد والاعتماد خلال 24 ساعة كحد أقصى وفقاً لبنود عقد الاستخدام.
              </p>
            </div>
            <button
              onClick={fetchForceMajeureRequests}
              className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer whitespace-nowrap shrink-0 self-start sm:self-center"
            >
              🔄 تحديث القائمة
            </button>
          </div>

          {forceMajeureRequests.length === 0 ? (
            <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
              <p className="text-slate-500 text-sm">لا توجد أي طلبات ظروف قاهرة قيد الانتظار حالياً.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {forceMajeureRequests.map((req) => {
                let docUrls: string[] = [];
                try {
                  docUrls = JSON.parse(req.documents);
                } catch(e) {
                  if (req.documents) {
                    docUrls = [req.documents];
                  }
                }

                return (
                  <div
                    key={req.id}
                    id={`force-majeure-card-${req.id}`}
                    className={`p-6 rounded-2xl border transition-all text-right ${
                      req.status === 'pending'
                        ? 'border-amber-300 bg-amber-50/10 shadow-xs'
                        : req.status === 'approved'
                        ? 'border-emerald-250 bg-emerald-50/10'
                        : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between justify-items-start gap-4">
                      <div className="space-y-2 flex-grow">
                        <div className="flex items-center gap-2 flex-wrap justify-start">
                          <span className="text-xs font-bold bg-slate-800 text-white px-2 py-0.5 rounded-sm">طلب #{req.id}</span>
                          <span className="text-xs text-slate-500 font-mono">تم الرفع بتاريخ: {req.createdAt ? new Date(req.createdAt).toLocaleString('ar-SA') : 'تاريخ غير معروف'}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                            req.status === 'pending'
                              ? 'bg-amber-100 text-amber-800'
                              : req.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {req.status === 'pending' ? 'قيد المراجعة' : req.status === 'approved' ? 'مقبول استثنائياً' : 'مرفوض'}
                          </span>
                        </div>

                        <div className="text-sm font-bold text-slate-800 pt-1">
                          اسم الحساب: {req.customerName} | رقم الهاتف: {req.customerPhone} | البريد الإلكتروني: {req.customerEmail}
                        </div>

                        <div className="text-sm text-slate-750 leading-relaxed bg-white p-3 rounded-lg border border-slate-100 mt-2 text-right">
                          <span className="font-bold text-slate-800 block mb-1 text-xs">السبب والشرح المرفق للظروف القاهرة:</span>
                          {req.reason}
                        </div>

                        {docUrls && docUrls.length > 0 && (
                          <div className="pt-2 text-right">
                            <span className="text-xs font-bold text-slate-700 block mb-2">المستندات الثبوتية الحساسة المرفقة ({docUrls.length}):</span>
                            <div className="flex flex-wrap gap-2 justify-start">
                              {docUrls.map((url, index) => (
                                <a
                                  key={index}
                                  href={url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs bg-slate-100 text-slate-700 hover:text-amber-600 px-3 py-1.5 rounded-lg border border-slate-200 flex items-center gap-1 transition-all font-mono"
                                >
                                  📄 مستند ثبوتي #{index + 1}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {req.status !== 'pending' && (
                          <div className="mt-4 p-3 bg-slate-100/50 rounded-xl border border-slate-200/50 text-xs text-slate-600 text-right">
                            <span className="font-bold text-slate-800 block mb-1">ملاحظات وقرار اللجنة:</span>
                            {req.adminNotes || 'بدون ملاحظات إضافية.'}
                            <div className="mt-2 flex flex-wrap gap-4 text-[11px] text-slate-500 justify-start">
                              <span>مبلغ الاسترداد المعتمد: {req.amountRefunded} {financialSettingsState.currency || 'SAR'}</span>
                              <span>طريقة التعويض: {req.refundType === 'credit_held' ? 'محفظة ائتمانية مؤجلة (قسيمة)' : req.refundType === 'cash' ? 'استرداد كاش فوري' : 'بدون تعويض'}</span>
                              {req.resolvedAt && <span>تاريخ القرار: {new Date(req.resolvedAt).toLocaleString('ar-SA')}</span>}
                            </div>
                          </div>
                        )}
                      </div>

                      {req.status === 'pending' && (
                        <div className="flex flex-col gap-3 min-w-[280px] bg-slate-50 p-4 rounded-xl border border-slate-200 text-right">
                          <label className="text-xs font-bold text-slate-700">قرار ومبرر قبول/رفض الطلب:</label>
                          <textarea
                            id={`admin-notes-${req.id}`}
                            placeholder="اكتب مبررات وملاحظات اللجنة هنا بالتفصيل (سترسل للعميل)..."
                            className="w-full text-xs p-2 rounded-lg border border-slate-200 focus:border-amber-500 outline-none h-[80px] bg-white text-right"
                          ></textarea>
                          <div className="flex gap-2">
                            <button
                              id={`btn-approve-fm-${req.id}`}
                              onClick={async () => {
                                const noteEl = document.getElementById(`admin-notes-${req.id}`) as HTMLTextAreaElement;
                                const notes = noteEl ? noteEl.value : '';
                                if (!notes.trim()) {
                                  showNotification('error', 'يجب إدخال مبررات وملاحظات اللجنة المعتمدة قبل قبول الطلب');
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/bookings/force-majeure/${req.id}/resolve`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'approved', adminNotes: notes })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    showNotification('success', 'تم قبول الطلب واعتماده وإصدار القسيمة الائتمانية للعميل بنجاح');
                                    fetchForceMajeureRequests();
                                    // Trigger updating general bookings list
                                    fetch('/api/bookings')
                                      .then(r => r.json())
                                      .then(bks => {
                                        if (Array.isArray(bks)) setBookings(bks);
                                      });
                                  } else {
                                    showNotification('error', data.error || 'فشلت معالجة القرار');
                                  }
                                } catch(e: any) {
                                  showNotification('error', e.message);
                                }
                              }}
                              className="flex-grow bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              ✔ موافقة وإصدار قسيمة رصيد
                            </button>
                            <button
                              id={`btn-reject-fm-${req.id}`}
                              onClick={async () => {
                                const noteEl = document.getElementById(`admin-notes-${req.id}`) as HTMLTextAreaElement;
                                const notes = noteEl ? noteEl.value : '';
                                if (!notes.trim()) {
                                  showNotification('error', 'يجب إدخال مبررات وملاحظات اللجنة المعتمدة قبل رفض الطلب');
                                  return;
                                }
                                try {
                                  const res = await fetch(`/api/bookings/force-majeure/${req.id}/resolve`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ status: 'rejected', adminNotes: notes })
                                  });
                                  const data = await res.json();
                                  if (data.success) {
                                    showNotification('success', 'تم رفض الطلب بنجاح وتحديث تذكرة العميل');
                                    fetchForceMajeureRequests();
                                  } else {
                                    showNotification('error', data.error || 'فشلت المعالجة');
                                  }
                                } catch(e: any) {
                                  showNotification('error', e.message);
                                }
                              }}
                              className="px-3 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-2 rounded-lg transition-colors cursor-pointer text-center"
                            >
                              ✖ رفض
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Season Request Details Modal */}
      {selectedSeasonRequestForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 text-right" id="season-req-details-modal" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-lg overflow-hidden border border-slate-100 shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-800 text-base" id="season-modal-title">تفاصيل طلب تسعير الذروة الموسمية</h3>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">رقم المعاملة: {selectedSeasonRequestForModal.id}</p>
              </div>
              <button 
                onClick={() => setSelectedSeasonRequestForModal(null)}
                className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-all cursor-pointer"
                id="close-season-modal-x"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">اسم الشريك (المزود)</span>
                  <span className="text-slate-800 font-bold break-words">{selectedSeasonRequestForModal.provider}</span>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">الموسم / المناسبة</span>
                  <span className="text-slate-800 font-bold break-words">{selectedSeasonRequestForModal.seasonName}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">تاريخ البدء</span>
                  <span className="text-slate-800 font-bold font-mono">{selectedSeasonRequestForModal.startDate}</span>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">تاريخ الانتهاء</span>
                  <span className="text-slate-800 font-bold font-mono">{selectedSeasonRequestForModal.endDate}</span>
                </div>
              </div>

              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">
                    {selectedSeasonRequestForModal.increaseValue < 0 ? 'تخفيض فارق السعر الموسمي' : 'زيادة فارق السعر التكميلي'}
                  </span>
                  <span className={`text-sm font-black font-mono ${selectedSeasonRequestForModal.increaseValue < 0 ? 'text-red-600' : 'text-indigo-700'}`}>
                    {selectedSeasonRequestForModal.increaseValue < 0 
                      ? `${selectedSeasonRequestForModal.increaseValue}${selectedSeasonRequestForModal.increaseType === 'percentage' ? '%' : ' ريال سعودي'} (تخفيض موسمي)`
                      : `+ ${selectedSeasonRequestForModal.increaseValue}${selectedSeasonRequestForModal.increaseType === 'percentage' ? '%' : ' ريال سعودي'} (زيادة ذروة)`
                    }
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl ${selectedSeasonRequestForModal.increaseValue < 0 ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'}`}>
                  {selectedSeasonRequestForModal.increaseValue < 0 ? (
                    <TrendingDown className="w-5 h-5" />
                  ) : (
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">تاريخ تقديم الطلب</span>
                  <span className="text-slate-600 font-medium font-mono">{selectedSeasonRequestForModal.createdAt || 'غير محدد'}</span>
                </div>
                <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">الحالة الحالية للطلب</span>
                  <span className={`inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-black ${
                    selectedSeasonRequestForModal.status === 'معتمد' ? 'bg-green-100 text-green-700 border border-green-200' :
                    selectedSeasonRequestForModal.status === 'مرفوض' ? 'bg-red-100 text-red-700 border border-red-200' :
                    'bg-amber-100 text-amber-700 border border-amber-200'
                  }`}>
                    {selectedSeasonRequestForModal.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-wrap gap-2 justify-end">
              <button
                onClick={() => setSelectedSeasonRequestForModal(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl transition-all cursor-pointer"
                id="btn-close-season-modal"
              >
                إغلاق
              </button>

              {selectedSeasonRequestForModal.status === 'بانتظار الموافقة' && (
                <>
                  <button
                    onClick={() => {
                      setSeasonRequests(seasonRequests.map((r: any) => r.id === selectedSeasonRequestForModal.id ? {...r, status: 'معتمد'} : r));
                      alert(`تم اعتماد التسعيرة الخاصة بـ "${selectedSeasonRequestForModal.seasonName}" للملف بنجاح! 🟢`);
                      setSelectedSeasonRequestForModal(null);
                    }}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-green-100 cursor-pointer"
                    id="btn-approve-season-modal"
                  >
                    <Check className="w-4 h-4" /> اعتماد الطلب
                  </button>
                  <button
                    onClick={() => {
                      setSeasonRequests(seasonRequests.map((r: any) => r.id === selectedSeasonRequestForModal.id ? {...r, status: 'مرفوض'} : r));
                      alert(`تم رفض وتجميد طلب التسعيرة الموسمية لـ "${selectedSeasonRequestForModal.seasonName}". 🔴`);
                      setSelectedSeasonRequestForModal(null);
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-red-100 cursor-pointer"
                    id="btn-reject-season-modal"
                  >
                    <X className="w-4 h-4" /> رفض الطلب
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
