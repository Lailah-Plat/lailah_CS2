import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Play, 
  CheckCheck, 
  XCircle, 
  RotateCcw,
  Sparkles,
  AlertCircle
} from 'lucide-react';

export type OrderLifecycleStatus = 
  | 'pending'      // جديد / بانتظار موافقة المزود
  | 'approved'     // تمت موافقة المزود / بانتظار استكمال دفع العميل
  | 'confirmed'    // مؤكد (تم الدفع والتحقق)
  | 'preparing'    // جاري التجهيز والتحضير
  | 'in_progress'  // جاري التنفيذ والبدء الميداني
  | 'completed'    // مكتمل ومنجز
  | 'rejected'     // مرفوض من المزود
  | 'cancelled';   // ملغي

interface OrderLifecycleStepperProps {
  status: string;
  className?: string;
  compact?: boolean;
}

const STEPS = [
  { id: 'pending', label: 'بانتظار الموافقة', desc: 'طلب جديد لدى المزود' },
  { id: 'approved', label: 'معتمد (بانتظار الدفع)', desc: 'وافق المزود - دفع العميل' },
  { id: 'confirmed', label: 'مؤكد ومدفوع', desc: 'تم استلام الدفعة' },
  { id: 'preparing', label: 'جاري التجهيز', desc: 'إعداد اللوجستيات والقاعة' },
  { id: 'in_progress', label: 'جاري التنفيذ', desc: 'بدء المناسبة فعلياً' },
  { id: 'completed', label: 'مكتمل ومنجز', desc: 'انتهاء الفعالية بنجاح' }
];

export const normalizeOrderStatus = (rawStatus: string): OrderLifecycleStatus => {
  const s = String(rawStatus || '').toLowerCase().trim();
  if (['pending', 'جديد', 'قيد الانتظار', 'انتظار', 'بانتظار الموافقة'].includes(s)) return 'pending';
  if (['approved', 'تمت الموافقة', 'معتمد', 'تم القبول'].includes(s)) return 'approved';
  if (['confirmed', 'مؤكد', 'مدفوع'].includes(s)) return 'confirmed';
  if (['preparing', 'جاري التجهيز', 'قيد التجهيز', 'تجهيز'].includes(s)) return 'preparing';
  if (['in_progress', 'جاري التنفيذ', 'قيد التنفيذ', 'منفذ'].includes(s)) return 'in_progress';
  if (['completed', 'مكتمل', 'منجز', 'تم بنجاح'].includes(s)) return 'completed';
  if (['rejected', 'مرفوض', 'تم الرفض'].includes(s)) return 'rejected';
  if (['cancelled', 'ملغي', 'ملغية', 'مسترجع'].includes(s)) return 'cancelled';
  return 'pending';
};

export const getOrderStatusInfo = (rawStatus: string) => {
  const norm = normalizeOrderStatus(rawStatus);
  switch (norm) {
    case 'pending':
      return {
        label: 'جديد (بانتظار موافقة المزود)',
        badgeLabel: 'جديد',
        color: 'text-amber-700',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock,
        stepIndex: 0
      };
    case 'approved':
      return {
        label: 'معتمد (بانتظار دفع العميل)',
        badgeLabel: 'معتمد',
        color: 'text-sky-700',
        bg: 'bg-sky-50',
        border: 'border-sky-200',
        dot: 'bg-sky-500',
        icon: CheckCircle2,
        stepIndex: 1
      };
    case 'confirmed':
      return {
        label: 'مؤكد (تم سداد الدفعة)',
        badgeLabel: 'مؤكد',
        color: 'text-indigo-700',
        bg: 'bg-indigo-50',
        border: 'border-indigo-200',
        dot: 'bg-indigo-500',
        icon: Sparkles,
        stepIndex: 2
      };
    case 'preparing':
      return {
        label: 'جاري التجهيز والتحضير',
        badgeLabel: 'جاري التجهيز',
        color: 'text-purple-700',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        dot: 'bg-purple-500',
        icon: Clock,
        stepIndex: 3
      };
    case 'in_progress':
      return {
        label: 'جاري التنفيذ والبدء الميداني',
        badgeLabel: 'جاري التنفيذ',
        color: 'text-blue-700',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        dot: 'bg-blue-500',
        icon: Play,
        stepIndex: 4
      };
    case 'completed':
      return {
        label: 'مكتمل ومنجز بنجاح',
        badgeLabel: 'مكتمل',
        color: 'text-emerald-700',
        bg: 'bg-emerald-50',
        border: 'border-emerald-200',
        dot: 'bg-emerald-500',
        icon: CheckCheck,
        stepIndex: 5
      };
    case 'rejected':
      return {
        label: 'مرفوض من المزود',
        badgeLabel: 'مرفوض',
        color: 'text-rose-700',
        bg: 'bg-rose-50',
        border: 'border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle,
        stepIndex: -1
      };
    case 'cancelled':
      return {
        label: 'ملغي ومسترجع',
        badgeLabel: 'ملغي',
        color: 'text-slate-700',
        bg: 'bg-slate-100',
        border: 'border-slate-300',
        dot: 'bg-slate-400',
        icon: RotateCcw,
        stepIndex: -1
      };
  }
};

export const OrderLifecycleStepper: React.FC<OrderLifecycleStepperProps> = ({
  status,
  className = '',
  compact = false
}) => {
  const norm = normalizeOrderStatus(status);
  const statusInfo = getOrderStatusInfo(norm);

  if (norm === 'rejected' || norm === 'cancelled') {
    return (
      <div className={`p-4 rounded-2xl border ${statusInfo.bg} ${statusInfo.border} flex items-center gap-3 ${className}`} dir="rtl">
        <statusInfo.icon className={`w-6 h-6 ${statusInfo.color} shrink-0`} />
        <div>
          <h4 className={`text-sm font-black ${statusInfo.color}`}>
            حالة الطلب: {statusInfo.label}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {norm === 'rejected' 
              ? 'تم رفض الطلب من قبل المزود لعدم توفر الإمكانية أو تعارض المواعيد.' 
              : 'تم إلغاء الطلب من المنصة أو العميل وفق سياسة الإلغاء والاسترداد المعتمدة.'}
          </p>
        </div>
      </div>
    );
  }

  const currentStepIdx = statusInfo.stepIndex;

  return (
    <div className={`w-full bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-xs space-y-4 ${className}`} dir="rtl">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${statusInfo.dot} animate-pulse`}></span>
          <span className="text-xs font-bold text-slate-500">مسار ومراحل دورة حياة الطلب:</span>
          <span className={`text-xs font-black px-2.5 py-0.5 rounded-lg border ${statusInfo.bg} ${statusInfo.border} ${statusInfo.color}`}>
            {statusInfo.label}
          </span>
        </div>
        <span className="text-[11px] font-mono font-bold text-slate-400">
          المرحلة {currentStepIdx + 1} من 6
        </span>
      </div>

      {/* Stepper Progress Visual Bar */}
      <div className="relative pt-2 pb-1">
        <div className="hidden sm:grid grid-cols-6 gap-2 relative z-10">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step.id} className="flex flex-col items-center text-center space-y-1.5">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-xs ${
                    isDone
                      ? 'bg-emerald-600 text-white shadow-emerald-600/20'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 shadow-indigo-600/20 scale-110'
                      : 'bg-slate-100 text-slate-400 border border-slate-200'
                  }`}
                >
                  {isDone ? <CheckCheck className="w-4 h-4" /> : idx + 1}
                </div>
                <span className={`text-[11px] font-bold leading-tight ${isCurrent ? 'text-indigo-900 dark:text-indigo-200' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
                {!compact && (
                  <span className="text-[9px] text-slate-400 leading-tight hidden lg:block">
                    {step.desc}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Mobile Horizontal scrollable / mini view */}
        <div className="sm:hidden flex items-center justify-between gap-1 overflow-x-auto pb-1">
          {STEPS.map((step, idx) => {
            const isDone = idx < currentStepIdx;
            const isCurrent = idx === currentStepIdx;
            return (
              <div key={step.id} className="flex-1 flex flex-col items-center text-center min-w-[50px]">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isDone
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-100'
                      : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {isDone ? '✓' : idx + 1}
                </div>
                <span className={`text-[9px] font-bold mt-1 line-clamp-1 ${isCurrent ? 'text-indigo-900 font-black' : isDone ? 'text-slate-700' : 'text-slate-400'}`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
