import React, { useState } from 'react';
import { 
  CheckCircle2, Clock, Calendar, AlertCircle, Printer, RefreshCw, 
  FileText, ShieldCheck, UserCheck, Layers, Activity, Users, MapPin, Sparkles, X, Check
} from 'lucide-react';
import { convertDigits } from '../utils/digitConverter';
import { formatBookingId } from '../utils/idUtils';

interface BookingOperationsManagerProps {
  booking: any;
  halls?: any[];
  userRole: string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onUpdateBooking: (updatedBooking: any) => void;
  onClose: () => void;
}

const EXECUTION_STAGES = [
  { id: 'confirmed', label: 'تأكيد الحجز والدفع', icon: CheckCircle2, desc: 'تم استلام الدفعة أو تأكيد الحجز المبدئي' },
  { id: 'prep', label: 'تجهيز القاعة والخدمات', icon: Layers, desc: 'تنسيق الضيافة، الصوتيات، والديكور' },
  { id: 'inspection', label: 'الفحص الفني والجاهزية', icon: ShieldCheck, desc: 'معاينة القاعة والأجهزة قبل بدء الحدث' },
  { id: 'in_progress', label: 'جاري تنفيذ المناسبة', icon: Activity, desc: 'استقبال الضيوف وتشغيل المناسبة الميدانية' },
  { id: 'completed', label: 'إكتمال المناسبة والتسوية', icon: UserCheck, desc: 'انتهاء الحدث واعتماد تسوية المستحقات' }
];

export const BookingOperationsManager: React.FC<BookingOperationsManagerProps> = ({
  booking,
  halls = [],
  userRole,
  showNotification,
  onUpdateBooking,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'stages' | 'reschedule' | 'work_order'>('stages');
  
  // Execution Stage State
  const [currentStage, setCurrentStage] = useState<string>(booking?.executionStage || 'confirmed');
  const [stageNote, setStageNote] = useState<string>('');
  const [stageHistory, setStageHistory] = useState<any[]>(booking?.stageHistory || [
    {
      stage: 'confirmed',
      label: 'تأكيد الحجز والدفع',
      updatedAt: booking?.date || new Date().toISOString().split('T')[0],
      updatedBy: 'نظام المنصة الآلي',
      note: 'تم تأكيد الحجز رسمياً'
    }
  ]);

  // Reschedule State
  const [newDate, setNewDate] = useState<string>(booking?.startDate || booking?.date || '');
  const [newPeriod, setNewPeriod] = useState<string>(booking?.period || 'مسائية');
  const [rescheduleReason, setRescheduleReason] = useState<string>('');
  const [isCheckingSlot, setIsCheckingSlot] = useState<boolean>(false);
  const [slotCheckResult, setSlotCheckResult] = useState<{ available: boolean; message: string } | null>(null);

  // Handle stage change
  const handleUpdateStage = (stageId: string) => {
    const stageObj = EXECUTION_STAGES.find(s => s.id === stageId);
    if (!stageObj) return;

    const newLog = {
      stage: stageId,
      label: stageObj.label,
      updatedAt: new Date().toLocaleString('ar-SA'),
      updatedBy: userRole === 'admin' ? 'الإدارة العامة' : 'مزود الخدمة',
      note: stageNote || 'تحديث مرحلة التشغيل والجاهزية'
    };

    const updatedHistory = [newLog, ...stageHistory];
    setCurrentStage(stageId);
    setStageHistory(updatedHistory);
    setStageNote('');

    const updatedBooking = {
      ...booking,
      executionStage: stageId,
      stageHistory: updatedHistory,
      status: stageId === 'completed' ? 'مكتمل' : booking.status
    };

    onUpdateBooking(updatedBooking);
    showNotification('success', `تم تحديث مرحلة التشغيل إلى: ${stageObj.label}`);
  };

  // Check Slot Availability
  const handleVerifySlot = () => {
    setIsCheckingSlot(true);
    setSlotCheckResult(null);

    setTimeout(() => {
      setIsCheckingSlot(false);
      // Check if target hall has another booking on newDate & newPeriod
      const targetHallId = booking.hallId;
      const isConflict = halls.some((h: any) => {
        if (h.id === targetHallId && h.bookedDates) {
          return h.bookedDates.includes(newDate);
        }
        return false;
      });

      if (isConflict) {
        setSlotCheckResult({
          available: false,
          message: '⚠️ القاعة محجوزة بالفعل في هذا التاريخ المحدد! يرجى اختيار تاريخ آخر.'
        });
      } else {
        setSlotCheckResult({
          available: true,
          message: '✅ التاريخ متاح للتعديل وإعادة الجدولة بدون تعارض.'
        });
      }
    }, 600);
  };

  // Apply Reschedule
  const handleApplyReschedule = () => {
    if (!newDate) {
      showNotification('error', 'يرجى اختيار التاريخ الجديد الحجز.');
      return;
    }
    if (slotCheckResult && !slotCheckResult.available) {
      showNotification('error', 'لا يمكن الجدولة في تاريخ مشغولة بالفعل.');
      return;
    }

    const updatedBooking = {
      ...booking,
      startDate: newDate,
      endDate: newDate,
      date: newDate,
      period: newPeriod,
      rescheduleLog: [
        ...(booking.rescheduleLog || []),
        {
          oldDate: booking.startDate || booking.date,
          newDate,
          oldPeriod: booking.period,
          newPeriod,
          reason: rescheduleReason,
          updatedAt: new Date().toLocaleString('ar-SA'),
          by: userRole
        }
      ]
    };

    onUpdateBooking(updatedBooking);
    showNotification('success', `تمت إعادة جدولة الحجز بنجاح إلى تاريخ ${newDate} (${newPeriod})`);
    setRescheduleReason('');
  };

  const formattedBkgId = formatBookingId(booking?.id || '001');

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative border border-slate-100 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-900 rounded-2xl shadow-sm">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900">
                  لوحة التحكم التشغيلية للحجز
                </h3>
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-2.5 py-0.5 rounded-full font-mono">
                  {formattedBkgId}
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-0.5">
                {booking?.hall || booking?.itemName || 'قاعة المناسبات'} • {booking?.customer || 'العميل'}
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-6 pt-3 gap-6 font-bold text-xs overflow-x-auto scrollbar-none">
          <button
            type="button"
            onClick={() => setActiveTab('stages')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'stages'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>مراحل الجاهزية والتنفيذ</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('reschedule')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'reschedule'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>إعادة الجدولة والتغيير</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('store_addons' as any)}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === ('store_addons' as any)
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-600" />
            <span>مستلزمات المتجر وإثبات التجهيز 🛒</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('work_order')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'work_order'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            <Printer className="w-4 h-4" />
            <span>أمر التشغيل الفني (Work Order)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

          {/* TAB 1: EXECUTION STAGES */}
          {activeTab === 'stages' && (
            <div className="space-y-6">
              
              {/* Stepper Display */}
              <div className="bg-slate-50/70 p-5 rounded-2xl border border-slate-200/80">
                <h4 className="text-xs font-black text-slate-700 mb-4 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>خط السير التشغيلي للحجز والخدمات المساندة</span>
                </h4>

                <div className="space-y-3">
                  {EXECUTION_STAGES.map((stg, idx) => {
                    const isPassed = EXECUTION_STAGES.findIndex(s => s.id === currentStage) >= idx;
                    const isCurrent = currentStage === stg.id;
                    const Icon = stg.icon;

                    return (
                      <div 
                        key={stg.id}
                        onClick={() => handleUpdateStage(stg.id)}
                        className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isCurrent 
                            ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-sm'
                            : isPassed 
                              ? 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
                              : 'bg-white border-slate-200/60 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 ${
                            isCurrent ? 'bg-amber-500 shadow-sm' : isPassed ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-xs text-slate-900">{stg.label}</span>
                              {isCurrent && (
                                <span className="bg-amber-500 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded-full">
                                  المرحلة الحالية ⚡
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 mt-0.5">{stg.desc}</p>
                          </div>
                        </div>

                        <button 
                          type="button"
                          className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all ${
                            isCurrent 
                              ? 'bg-amber-500 text-slate-900' 
                              : isPassed 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                          }`}
                        >
                          {isCurrent ? 'نشطة الان' : isPassed ? 'تم الانتهاء' : 'الانتقال لهذه المرحلة'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Note input for stage */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="text-xs font-bold text-slate-700 block">
                  إضافة ملاحظة تشغيلية للتصديق في سجل الحجز:
                </label>
                <textarea
                  rows={2}
                  value={stageNote}
                  onChange={(e) => setStageNote(e.target.value)}
                  placeholder="مثال: تم الاطمئنان على أجهزة التكييف والضيافة والتأكد من جاهزية طاقم العمل..."
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Stage History Log */}
              <div className="space-y-3">
                <h5 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <span>سجل التحديثات التشغيلية للحجز</span>
                </h5>

                <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
                  {stageHistory.map((log: any, idx: number) => (
                    <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/60 flex justify-between items-center text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-800">{log.label}</span>
                          <span className="text-[10px] text-slate-400">بواسطة: {log.updatedBy}</span>
                        </div>
                        {log.note && <p className="text-[11px] text-slate-600 mt-1">{log.note}</p>}
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.updatedAt}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: RESCHEDULING & MODIFICATION */}
          {activeTab === 'reschedule' && (
            <div className="space-y-6">
              
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-amber-900 text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                  <span>ضوابط إعادة الجدولة والتعديل الآمن:</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  يتيح هذا المركز تقديم أو تأخير تاريخ الحجز مع الاحتفاظ بالرقم التسلسلي الأصلي (<span className="font-mono font-bold">{formattedBkgId}</span>) والفاتورة الضريبية الصادرة، مع التحقق التلقائي من عدم وجود تعارض مع حجوزات القاعة الأخرى.
                </p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">تاريخ الحجز القديم</label>
                    <input 
                      type="text" 
                      disabled 
                      value={booking?.startDate || booking?.date || 'غير محدد'} 
                      className="w-full bg-slate-200/70 text-slate-600 text-xs p-2.5 rounded-xl font-bold cursor-not-allowed"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">التاريخ الجديد المطلوب</label>
                    <input 
                      type="date" 
                      value={newDate} 
                      onChange={(e) => { setNewDate(e.target.value); setSlotCheckResult(null); }}
                      className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">فترة الحجز</label>
                    <select
                      value={newPeriod}
                      onChange={(e) => { setNewPeriod(e.target.value); setSlotCheckResult(null); }}
                      className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      <option value="صباحية">صباحية (08:00 ص - 02:00 م)</option>
                      <option value="مسائية">مسائية (04:00 م - 02:00 ص)</option>
                      <option value="يوم كامل">يوم كامل (24 ساعة)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleVerifySlot}
                      disabled={isCheckingSlot}
                      className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold p-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
                    >
                      {isCheckingSlot ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                      <span>التحقق آلياً من توفر التوقيت</span>
                    </button>
                  </div>
                </div>

                {slotCheckResult && (
                  <div className={`p-3 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                    slotCheckResult.available 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-rose-50 text-rose-800 border-rose-200'
                  }`}>
                    {slotCheckResult.available ? <Check className="w-4 h-4 text-emerald-600" /> : <X className="w-4 h-4 text-rose-600" />}
                    <span>{slotCheckResult.message}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">سبب التعديل أو إعادة الجدولة</label>
                  <input 
                    type="text"
                    value={rescheduleReason}
                    onChange={(e) => setRescheduleReason(e.target.value)}
                    placeholder="مثال: بناءً على طلب العميل نظراً لتغيير مواعيد السفر..."
                    className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleApplyReschedule}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-black p-3 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد تاريخ الحجز الجديد وتحديث السجل</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 3: STORE ADDONS & PREPARATION PROOF FOR REFUND */}
          {activeTab === ('store_addons' as any) && (
            <div className="space-y-5">
              <div className="bg-amber-50/70 p-4 rounded-2xl border border-amber-200/80 text-xs text-amber-900 space-y-2">
                <div className="flex items-center gap-2 font-black">
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                  <span>إدارة مستلزمات المتجر المصغر وضوابط الاسترداد والتجهيز الفعلي</span>
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  لحماية حقوق المزود والعميل: تُسترد المستلزمات العامة بالكامل عند الإلغاء، بينما تُشترط موافقة الإدارة وإرفاق <strong>إثبات التجهيز الفعلي</strong> (فواتير شراء، صور التجهيز، أو العقود المباشرة) لخصم أو عدم استرداد قيمة المنتجات الاستهلاكية والتجهيزية المخصصة (ذبائح، بوفيهات، ورود).
                </p>
              </div>

              {/* Current Addons List */}
              <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                <h5 className="font-black text-xs text-slate-800 flex items-center justify-between">
                  <span>الأصناف والمستلزمات المطلوبة لهذا الحجز:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {booking?.storeProducts?.length ? `${booking.storeProducts.length} أصناف` : 'لا توجد مستلزمات متجر بعد'}
                  </span>
                </h5>

                {booking?.storeProducts && booking.storeProducts.length > 0 ? (
                  <div className="divide-y divide-slate-100">
                    {booking.storeProducts.map((p: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 block">{p.name || p.title}</span>
                          <span className="text-[10px] text-slate-500">الكمية: {p.quantity || 1} • {p.unit || 'قطعة'}</span>
                        </div>
                        <div className="text-left">
                          <span className="font-black text-amber-600 block">{((p.price || 0) * (p.quantity || 1)).toLocaleString()} ر.س</span>
                          <span className="text-[9px] text-emerald-600 font-bold">شامل 15% ضريبة</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-slate-50 rounded-xl text-center text-slate-400 text-xs">
                    لم يقم العميل بطلب مستلزمات متجر إضافية حتى الآن.
                  </div>
                )}
              </div>

              {/* Proof of Preparation Submission Section */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 space-y-3">
                <h5 className="font-black text-xs text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-600" />
                  <span>توثيق حالة التجهيز الفعلي (Proof of Preparation):</span>
                </h5>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  في حال إلغاء الحجز من طرف العميل أو نزاع استرداد، قم برفع إثبات بدء التجهيز الفعلي لاعتماده من الإدارة:
                </p>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-700 block">وصف وتفاصيل التجهيز الفعلي:</label>
                  <textarea
                    rows={3}
                    placeholder="مثال: تم شراء المواد الغذائية وتجهيز الزهور وتوقيع عقد الذبائح بتاريخ..."
                    defaultValue={booking?.preparationProofNote || ''}
                    id="prep-proof-note"
                    className="w-full p-2.5 text-xs bg-white border border-slate-200 rounded-xl focus:border-amber-500 outline-none"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] font-bold text-slate-600">
                    حالة توثيق التجهيز: {booking?.isPreparationStarted ? '✅ موثق (جاري التجهيز)' : '⏳ لم يُسجل بعد'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const noteInput = document.getElementById('prep-proof-note') as HTMLTextAreaElement;
                      const noteVal = noteInput ? noteInput.value : '';
                      const updated = {
                        ...booking,
                        isPreparationStarted: true,
                        preparationProofNote: noteVal,
                        preparationProofDate: new Date().toISOString()
                      };
                      onUpdateBooking(updated);
                      showNotification('success', 'تم حفظ وتوثيق إثبات التجهيز الفعلي بنجاح!');
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-xs cursor-pointer active:scale-95 transition-all"
                  >
                    حفظ وتوثيق التجهيز الفعلي
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: WORK ORDER PRINTING */}
          {activeTab === 'work_order' && (
            <div className="space-y-6">
              
              <div className="p-6 bg-slate-900 text-white rounded-3xl space-y-6 print:p-0 print:bg-white print:text-black">
                
                {/* Header Work Order */}
                <div className="flex justify-between items-start border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                      منصة ليلة للمناسبات • أمر تشغيل ميداني
                    </span>
                    <h3 className="text-xl font-black mt-1">أمر تشغيل القاعة والخدمات المساندة</h3>
                    <p className="text-slate-400 text-xs mt-0.5">WORK ORDER OPERATIONAL SHEET</p>
                  </div>

                  <div className="text-left font-mono" dir="ltr">
                    <span className="text-amber-400 font-bold text-sm block">{formattedBkgId}</span>
                    <span className="text-slate-400 text-[10px] block">{new Date().toLocaleDateString('en-US')}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] mb-0.5">القاعة / المنشأة:</span>
                    <span className="font-extrabold text-amber-300 text-sm">{booking?.hall || booking?.itemName}</span>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] mb-0.5">اسم العميل:</span>
                    <span className="font-extrabold text-white text-sm">{booking?.customer} ({booking?.phone || 'لا يوجد'})</span>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] mb-0.5">تاريخ المناسبة والتوقيت:</span>
                    <span className="font-bold text-white">{booking?.startDate || booking?.date} ({booking?.period || 'مسائية'})</span>
                  </div>

                  <div className="bg-slate-800/80 p-3.5 rounded-2xl border border-slate-700/60">
                    <span className="text-slate-400 block text-[10px] mb-0.5">عدد الضيوف المتوقع:</span>
                    <span className="font-bold text-emerald-400">{booking?.guests || 0} ضيف</span>
                  </div>
                </div>

                {/* Addons Checklist */}
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700/50 space-y-2">
                  <h5 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                    <Layers className="w-4 h-4" />
                    <span>الخدمات المساندة والتجهيزات الميدانية المطلوبة:</span>
                  </h5>
                  <p className="text-slate-300 text-xs font-sans whitespace-pre-wrap">
                    {booking?.extraServices || booking?.notes || '• تجهيز الضيافة العربية القياسية الصوتيات والإضاءة العامة.'}
                  </p>
                </div>

                {/* Verification Signatures */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-800 text-[11px] text-slate-400">
                  <div className="space-y-6">
                    <p>توقيع واعتماد مشرف التشغيل بالقاعة:</p>
                    <div className="h-8 border-b border-dashed border-slate-700 w-3/4"></div>
                  </div>
                  <div className="space-y-6">
                    <p>توقيع العميل عند الاستلام:</p>
                    <div className="h-8 border-b border-dashed border-slate-700 w-3/4"></div>
                  </div>
                </div>

              </div>

              {/* Print Trigger */}
              <button
                type="button"
                onClick={() => window.print()}
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold p-3 rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة أو تصدير أمر التشغيل الفني (PDF / Print)</span>
              </button>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
