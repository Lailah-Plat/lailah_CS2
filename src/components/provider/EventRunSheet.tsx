import React, { useState } from 'react';
import { 
  Clock, CheckCircle2, AlertCircle, PlayCircle, User, ShieldCheck, 
  Flame, Sparkles, Send, Printer, Plus, Check, ChevronDown, CheckSquare, Zap, MapPin
} from 'lucide-react';

export interface RunSheetItem {
  id: string;
  timeOffset: string; // e.g. "-06:00" or "04:00 PM"
  stageTitle: string;
  description: string;
  assignedRole: string;
  assignedSupervisor: string;
  status: 'pending' | 'in_progress' | 'completed';
  completedAt?: string;
  completedBy?: string;
  notes?: string;
}

export interface EventRunSheetProps {
  bookings?: any[];
  selectedBookingId?: string;
  onStatusChange?: (itemId: string, newStatus: 'pending' | 'in_progress' | 'completed') => void;
}

export const EventRunSheet: React.FC<EventRunSheetProps> = ({
  bookings = [],
  selectedBookingId
}) => {
  const [activeBookingId, setActiveBookingId] = useState<string>(
    selectedBookingId || (bookings[0]?.id || 'BKG-26-0000000001')
  );

  const activeBooking = bookings.find(b => b.id === activeBookingId) || {
    id: activeBookingId,
    hallName: 'القاعة الكبرى الفاخرة - فرع الرياض',
    customerName: 'عبدالله بن عبدالعزيز الدوسري',
    date: '2026-08-14',
    timeSlot: '04:00 PM - 02:00 AM',
    package: 'الباقة الملكية المتكاملة',
    guestsCount: 350
  };

  const [items, setItems] = useState<RunSheetItem[]>([
    {
      id: 'rs-1',
      timeOffset: '-06:00 (10:00 AM)',
      stageTitle: 'فحص التكييف المركزي وإضاءة القاعة الرئيسية',
      description: 'تشغيل أجهزة التكييف على درجة 20° مئوية واختبار المفاتيح الكهربائية الرئيسية.',
      assignedRole: 'مشرف الصيانة والتكييف',
      assignedSupervisor: 'مهندس أحمد العتيبي',
      status: 'completed',
      completedAt: '10:15 AM',
      completedBy: 'أحمد العتيبي'
    },
    {
      id: 'rs-2',
      timeOffset: '-04:00 (12:00 PM)',
      stageTitle: 'جاهزية المسرح وتنسيق الكوشة والزهور',
      description: 'استلام أعمال منسق الزهور وتجربة الإضاءة المسرحية الموجهة (Spotlights).',
      assignedRole: 'مشرف الديكور والمسرح',
      assignedSupervisor: 'خالد السبيعي',
      status: 'completed',
      completedAt: '12:30 PM',
      completedBy: 'خالد السبيعي'
    },
    {
      id: 'rs-3',
      timeOffset: '-02:00 (02:00 PM)',
      stageTitle: 'اختبار الأنظمة الصوتية والشاشات الجدارية',
      description: 'معايرة المكبرات الصوتية والشاشة العملاقة وخلوها من الضوضاء والتشويش.',
      assignedRole: 'مهندس الصوتيات والبصريات',
      assignedSupervisor: 'فهد المطيري',
      status: 'in_progress',
      notes: 'جاري معايرة اللاقط اللاسلكي الثاني'
    },
    {
      id: 'rs-4',
      timeOffset: '-01:00 (03:00 PM)',
      stageTitle: 'تجهيز طاولات كبار الشخصيات (VIP) وترتيب الأواني',
      description: 'فرز أدوات الضيافة الفاخرة والتأكد من ترتيب المقاعد حسب المخطط المعتمد.',
      assignedRole: 'رئيس فريق الضيافة',
      assignedSupervisor: 'سلمان الزهراني',
      status: 'pending'
    },
    {
      id: 'rs-5',
      timeOffset: '00:00 (04:00 PM)',
      stageTitle: 'افتتاح مدخل الاستقبال وبوابة الحضور',
      description: 'تواجد أطقم الاستقبال والمسح الرقمي لتذاكر الضيوف عبر ماسح QR Code.',
      assignedRole: 'مشرفة الاستقبال والأمن',
      assignedSupervisor: 'نورة الشمري',
      status: 'pending'
    },
    {
      id: 'rs-6',
      timeOffset: '+03:00 (07:00 PM)',
      stageTitle: 'جاهزية بوفيه العشاء الفاخر والمشروبات الساخنة',
      description: 'بدء تسخين سخانات البوفيه المباشر وتجهيز طاقم تقديم القهوة السعودية والعود.',
      assignedRole: 'مدير الضيافة والبوفيه',
      assignedSupervisor: 'محمد الشهري',
      status: 'pending'
    },
    {
      id: 'rs-7',
      timeOffset: '+08:00 (12:00 AM)',
      stageTitle: 'مغادرة الضيوف وبدء جولة الفحص الختامية',
      description: 'تأمين المفقودات ومراجعة سلامة القاعة مع ممثل العميل والتوقيع على نموذج الإغلاق.',
      assignedRole: 'مدير العمليات الميدانية',
      assignedSupervisor: 'سعود القحطاني',
      status: 'pending'
    }
  ]);

  const toggleStatus = (id: string) => {
    setItems(prev => prev.map(item => {
      if (item.id === id) {
        const nextStatus = item.status === 'completed' ? 'pending' : item.status === 'in_progress' ? 'completed' : 'in_progress';
        return {
          ...item,
          status: nextStatus,
          completedAt: nextStatus === 'completed' ? new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : undefined,
          completedBy: nextStatus === 'completed' ? 'المشرف الميداني' : undefined
        };
      }
      return item;
    }));
  };

  const completedCount = items.filter(i => i.status === 'completed').length;
  const progressPercent = Math.round((completedCount / items.length) * 100);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" dir="rtl">
      {/* Header & Booking Selector */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Clock className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-slate-900">جدول تشغيل المناسبة المباشر (Live Run-Sheet & Timeline)</h3>
              <p className="text-xs text-slate-500 font-bold mt-0.5">خطة تشغيلية دقيقة دقيقة بدقيقة تبدأ قبل الحفل بـ 6 ساعات وحتى التسليم النهائي</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <select
              value={activeBookingId}
              onChange={(e) => setActiveBookingId(e.target.value)}
              className="w-full text-xs font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-2xl p-3 pr-8 focus:outline-none focus:border-indigo-500 appearance-none"
            >
              {bookings.length > 0 ? (
                bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    {b.id} - {b.hallName || b.hall || 'القاعة الكبرى'} ({b.customerName || 'العميل'})
                  </option>
                ))
              ) : (
                <option value="BKG-26-0000000001">BKG-26-0000000001 - القاعة الكبرى (عبدالله الدوسري)</option>
              )}
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute left-3 top-3.5 pointer-events-none" />
          </div>

          <button
            onClick={() => window.print()}
            className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
          >
            <Printer className="w-4 h-4" /> طباعة الخطة
          </button>
        </div>
      </div>

      {/* Progress Bar & Summary Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-5 rounded-2xl space-y-3 relative overflow-hidden shadow-sm">
        <div className="flex justify-between items-center flex-wrap gap-2 text-xs font-bold relative z-10">
          <div className="flex items-center gap-2">
            <span className="font-mono bg-indigo-500/30 text-indigo-300 px-2.5 py-1 rounded-xl border border-indigo-400/30 font-black">
              {activeBooking.id}
            </span>
            <span className="text-white font-extrabold">{activeBooking.hallName}</span>
            <span className="text-slate-400">|</span>
            <span className="text-indigo-200">العميل: {activeBooking.customerName}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-slate-300">نسبة الإنجاز التشغيلي:</span>
            <span className="font-mono text-emerald-400 font-black text-sm">{progressPercent}%</span>
          </div>
        </div>

        {/* Bar */}
        <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden p-0.5 border border-white/10 relative z-10">
          <div 
            className="bg-gradient-to-r from-emerald-400 to-indigo-400 h-full rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="flex justify-between items-center text-[11px] text-slate-300 font-bold relative z-10">
          <span>عدد المهام المكتملة: <strong className="text-emerald-400">{completedCount}</strong> من أصل {items.length}</span>
          <span>توقيت الحفل: <strong className="text-indigo-300 font-mono">{activeBooking.timeSlot}</strong></span>
        </div>
      </div>

      {/* Timeline Steps */}
      <div className="space-y-3 relative before:absolute before:right-6 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-200">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`relative pr-12 p-4 rounded-2xl border transition-all text-right ${
              item.status === 'completed'
                ? 'bg-emerald-50/50 border-emerald-200'
                : item.status === 'in_progress'
                  ? 'bg-amber-50/60 border-amber-300 ring-2 ring-amber-200/50'
                  : 'bg-slate-50/60 border-slate-200 hover:border-indigo-200'
            }`}
          >
            {/* Status Dot Button */}
            <button
              onClick={() => toggleStatus(item.id)}
              className={`absolute right-3 top-4 w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs transition-all cursor-pointer z-10 shadow-xs ${
                item.status === 'completed'
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-100'
                  : item.status === 'in_progress'
                    ? 'bg-amber-500 text-white ring-4 ring-amber-100 animate-pulse'
                    : 'bg-white text-slate-400 border border-slate-300 hover:border-indigo-500'
              }`}
              title="اضغط لتغيير حالة المهمة"
            >
              {item.status === 'completed' ? (
                <Check className="w-4 h-4 stroke-[3]" />
              ) : item.status === 'in_progress' ? (
                <PlayCircle className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </button>

            <div className="flex flex-col md:flex-row justify-between md:items-center gap-2 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black px-2.5 py-1 rounded-xl bg-slate-900 text-white">
                  {item.timeOffset}
                </span>
                <h4 className="text-xs font-black text-slate-900">{item.stageTitle}</h4>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-xl bg-white border border-slate-200 text-slate-600">
                  <User className="w-3 h-3 inline ml-1 text-indigo-500" />
                  {item.assignedSupervisor} ({item.assignedRole})
                </span>

                <span className={`text-[10px] font-black px-2.5 py-1 rounded-xl border ${
                  item.status === 'completed'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : item.status === 'in_progress'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : 'bg-slate-200 text-slate-700 border-slate-300'
                }`}>
                  {item.status === 'completed' ? 'تم الإنجاز ✓' : item.status === 'in_progress' ? 'قيد التنفيذ الميداني ⚡' : 'مجدول ⏳'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 font-bold mt-2 leading-relaxed">{item.description}</p>

            {item.notes && (
              <p className="text-[11px] text-amber-800 bg-amber-100/60 p-2 rounded-xl mt-2 font-bold border border-amber-200/60">
                📌 ملاحظة ميدانية: {item.notes}
              </p>
            )}

            {item.completedAt && (
              <span className="block text-[10px] text-emerald-700 font-bold mt-2 text-left">
                تم اعتماد الإنجاز الساعة {item.completedAt} بواسطة {item.completedBy}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
