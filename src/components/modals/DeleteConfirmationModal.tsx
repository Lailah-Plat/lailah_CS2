import React, { useMemo } from 'react';
import { Trash2, AlertTriangle, Archive, ShieldCheck, Calendar, User, Clock, CheckCircle2, ShieldAlert, Sparkles, Megaphone, Tag } from 'lucide-react';

interface DeleteConfirmationModalProps {
  deleteData: any;
  setDeleteData: (data: any) => void;
  handleDelete: () => void;
  bookings?: any[];
  supportRequests?: any[];
  halls?: any[];
  services?: any[];
  promotions?: any[];
  campaigns?: any[];
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  deleteData,
  setDeleteData,
  handleDelete,
  bookings: propBookings,
  supportRequests: propSupportRequests,
  promotions: propPromotions,
  campaigns: propCampaigns
}) => {
  if (!deleteData) return null;

  // Retrieve active and historical bookings/requests
  const allBookings = useMemo(() => {
    if (propBookings && propBookings.length > 0) return propBookings;
    try {
      const stored = localStorage.getItem('ais_bookings_v2') || localStorage.getItem('layla_bookings');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }, [propBookings]);

  const allSupportRequests = useMemo(() => {
    if (propSupportRequests && propSupportRequests.length > 0) return propSupportRequests;
    try {
      const stored = localStorage.getItem('layla_service_requests') || localStorage.getItem('ais_service_requests_v2');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }, [propSupportRequests]);

  const allPromotions = useMemo(() => {
    if (propPromotions && propPromotions.length > 0) return propPromotions;
    try {
      const stored = localStorage.getItem('PROMOTIONS');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }, [propPromotions]);

  const allCampaigns = useMemo(() => {
    if (propCampaigns && propCampaigns.length > 0) return propCampaigns;
    try {
      const stored = localStorage.getItem('layla_campaigns');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [];
  }, [propCampaigns]);

  const isHall = deleteData.type === 'hall' || deleteData.type === 'halls';
  const isService = deleteData.type === 'service' || deleteData.type === 'services';

  // Analyze lifecycle metrics
  const analysis = useMemo(() => {
    let linkedPromos: any[] = [];
    let linkedCamps: any[] = [];

    if (isHall) {
      const related = allBookings.filter((b: any) => 
        String(b.hallId) === String(deleteData.id) || 
        (deleteData.name && (b.hall === deleteData.name || b.hallName === deleteData.name))
      );
      const active = related.filter((b: any) => !['ملغي', 'مكتمل', 'منفذ'].includes(b.status));
      const past = related.filter((b: any) => ['ملغي', 'مكتمل', 'منفذ'].includes(b.status));

      linkedPromos = allPromotions.filter((p: any) => 
        p.status === 'active' && p.targetIds && p.targetIds.map(String).includes(String(deleteData.id))
      );

      linkedCamps = allCampaigns.filter((c: any) => 
        c.status === 'active' && (c.title?.includes(deleteData.name) || c.hallId === deleteData.id)
      );

      return {
        totalCount: related.length,
        activeCount: active.length,
        pastCount: past.length,
        activeItems: active,
        isBlocked: active.length > 0,
        isArchivable: past.length > 0 && active.length === 0,
        isCleanDelete: related.length === 0,
        linkedPromos,
        linkedCamps
      };
    }

    if (isService) {
      const related = allSupportRequests.filter((r: any) => 
        String(r.serviceId) === String(deleteData.id) || 
        (deleteData.name && (r.serviceName === deleteData.name || r.name === deleteData.name))
      );
      const active = related.filter((r: any) => !['ملغي', 'مكتمل', 'تم التنفيذ'].includes(r.status));
      const past = related.filter((r: any) => ['ملغي', 'مكتمل', 'تم التنفيذ'].includes(r.status));

      linkedPromos = allPromotions.filter((p: any) => 
        p.status === 'active' && p.applyTo === 'services' && p.targetIds && p.targetIds.map(String).includes(String(deleteData.id))
      );

      return {
        totalCount: related.length,
        activeCount: active.length,
        pastCount: past.length,
        activeItems: active,
        isBlocked: active.length > 0,
        isArchivable: past.length > 0 && active.length === 0,
        isCleanDelete: related.length === 0,
        linkedPromos,
        linkedCamps: []
      };
    }

    return {
      totalCount: 0,
      activeCount: 0,
      pastCount: 0,
      activeItems: [],
      isBlocked: false,
      isArchivable: false,
      isCleanDelete: true,
      linkedPromos: [],
      linkedCamps: []
    };
  }, [deleteData, isHall, isService, allBookings, allSupportRequests, allPromotions, allCampaigns]);

  // Case 1: Blocked by active commitments
  if (analysis.isBlocked) {
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-rose-100 animate-in zoom-in-95 duration-200">
          <div className="bg-rose-50 border-b border-rose-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20 shrink-0">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black text-rose-600 bg-rose-100 px-2.5 py-0.5 rounded-md inline-block mb-1">
                حوكمة تشغيلية صارمة
              </span>
              <h3 className="text-lg font-black text-slate-900">
                حظر الإيقاف أو الحذف — التزامات قائمة
              </h3>
            </div>
          </div>

          <div className="p-6 space-y-4 text-right">
            <div className="bg-rose-50/60 border border-rose-200/70 rounded-2xl p-4">
              <p className="text-xs text-rose-950 font-bold leading-relaxed mb-2">
                لا يمكن حذف أو أرشفة <span className="text-rose-700 underline underline-offset-4">{deleteData.name}</span> حالياً لوجود <span className="text-rose-700 font-black font-mono">({analysis.activeCount})</span> حجز/طلب مستقبلي مؤكد قيد المتابعة.
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                وفق معايير حماية حقوق العملاء والالتزامات التعاقدية، يجب استكمال تنفيذ الحجوزات أو رفع طلب معالجة وإلغاء رسمي عبر إدارة المنصة أولاً.
              </p>
            </div>

            {/* Active Bookings Snippet */}
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              <span className="text-[11px] font-black text-slate-500 block">
                عينة من الالتزامات المجدولة المرتبطة:
              </span>
              {analysis.activeItems.slice(0, 3).map((item: any, idx: number) => (
                <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <span className="font-bold text-slate-800">{item.date || item.eventDate || 'موعد مجدول'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">({item.bookingNumber || item.serviceOrderNumber || `#${item.id}`})</span>
                  </div>
                  <span className="text-[10px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md">
                    {item.status || 'مؤكد'}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-50 p-5 border-t border-slate-100 flex gap-3">
            <button 
              onClick={() => setDeleteData(null)} 
              className="w-full py-3 rounded-2xl font-black bg-slate-900 text-white hover:bg-slate-800 transition-all text-xs shadow-lg shadow-slate-900/10 cursor-pointer"
            >
              فهمت ذلك — العودة للمتابعة التشغيلية
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 2: Historical Bookings Exist (Soft Delete / Smart Archival)
  if (analysis.isArchivable) {
    return (
      <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-amber-100 animate-in zoom-in-95 duration-200">
          <div className="bg-amber-50 border-b border-amber-100 p-6 flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
              <Archive className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-md inline-block mb-1">
                حماية السجل المالي والضريبي (Soft Delete)
              </span>
              <h3 className="text-lg font-black text-slate-900">
                أرشفة وإلغاء إدراج {isHall ? 'القاعة' : 'الخدمة'}
              </h3>
            </div>
          </div>

          <div className="p-6 space-y-4 text-right">
            <p className="text-xs text-slate-700 leading-relaxed">
              تحتوي <span className="font-black text-slate-900">{deleteData.name}</span> على <span className="font-mono font-black text-amber-700">({analysis.pastCount})</span> عملية وحجز تاريخي منفذ وفواتير ضريبية سابقة.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
              <span className="text-[11px] font-black text-slate-800 block mb-1">
                ماذا يحدث عند النقل للأرشيف؟
              </span>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>إخفاء فوري وتلقائي من صفحات واستعراض العملاء الجدد.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>حفظ تام لكافة الفواتير الضريبية والإقرارات المحاسبية السابقة.</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>إمكانية استعادة وتفعيل العنصر في أي وقت من تبويب «الأرشيف».</span>
              </div>
            </div>

            {/* Linked Promotions & Campaigns Interlock Badges */}
            {analysis.linkedPromos.length > 0 && (
              <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
                <Tag className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">عروض ترويجية نشطة مرتبطة:</span>
                  <span>يوجد ({analysis.linkedPromos.length}) عرض ترويجي نشط مرتبط بهذا الأصل؛ سيتم إيقافها وتعليقها تلقائياً عند الأرشفة.</span>
                </div>
              </div>
            )}

            {analysis.linkedCamps.length > 0 && (
              <div className="bg-blue-50/80 border border-blue-200/80 rounded-2xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
                <Megaphone className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block mb-0.5">حملات تسويقية نشطة:</span>
                  <span>يوجد ({analysis.linkedCamps.length}) حملة تسويقية جارية؛ سيتم إخطار وكالة التسويق بالأرشفة.</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-5 border-t border-slate-100 flex gap-3">
            <button 
              onClick={() => setDeleteData(null)} 
              className="flex-1 py-3 rounded-2xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors text-xs cursor-pointer"
            >
              إلغاء
            </button>
            <button 
              onClick={() => {
                handleDelete();
                setDeleteData(null);
              }} 
              className="flex-1 py-3 rounded-2xl font-black bg-amber-600 text-white hover:bg-amber-700 transition-all text-xs shadow-lg shadow-amber-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Archive className="w-4 h-4" />
              تأكيد الأرشفة وإلغاء الإدراج
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Clean New Record (Direct Delete)
  return (
    <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden text-center p-8 animate-in zoom-in-95 duration-200 border border-slate-100">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100">
          <Trash2 className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-black text-slate-900 mb-2">تأكيد الحذف النهائي</h3>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          هل أنت متأكد من رغبتك في حذف <span className="font-black text-slate-800">{deleteData.name}</span>؟ لم يرتبط هذا العنصر بأي عمليات سابقة وسيتم حذفه وتنظيف السجل نهائياً.
        </p>
        <div className="flex gap-3">
          <button 
            onClick={() => setDeleteData(null)} 
            className="flex-1 py-3 rounded-2xl font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors text-xs cursor-pointer"
          >
            إلغاء
          </button>
          <button 
            onClick={() => {
              handleDelete();
              setDeleteData(null);
            }} 
            className="flex-1 py-3 rounded-2xl font-black bg-rose-600 text-white hover:bg-rose-700 transition-all text-xs shadow-lg shadow-rose-600/20 cursor-pointer"
          >
            حذف نهائياً
          </button>
        </div>
      </div>
    </div>
  );
};
