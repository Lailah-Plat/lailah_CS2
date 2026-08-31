import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowLeft, 
  Clock, 
  Inbox, 
  ShieldCheck 
} from 'lucide-react';

interface OverviewAlertsProps {
  pendingBookingsCount?: number;
  pendingServiceOrdersCount?: number;
  missingIban?: boolean;
  onNavigateTab?: (tab: string) => void;
  onOpenWizard?: () => void;
}

export const OverviewAlerts: React.FC<OverviewAlertsProps> = ({
  pendingBookingsCount = 2,
  pendingServiceOrdersCount = 1,
  missingIban = false,
  onNavigateTab,
  onOpenWizard,
}) => {
  const alerts = [];

  if (pendingBookingsCount > 0) {
    alerts.push({
      id: 'pending-bkg',
      type: 'warning',
      title: 'حجوزات قاعات بانتظار التأكيد',
      description: `يوجد ${pendingBookingsCount} طلب حجز قاعة جديد يتطلب مراجعتك وتأكيد التوفر.`,
      icon: Clock,
      actionLabel: 'مراجعة الحجوزات',
      actionTab: 'bookings',
      color: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200',
      btnColor: 'bg-amber-600 hover:bg-amber-700 text-white',
    });
  }

  if (pendingServiceOrdersCount > 0) {
    alerts.push({
      id: 'pending-srv',
      type: 'info',
      title: 'طلبات خدمات مساندة جديدة',
      description: `يوجد ${pendingServiceOrdersCount} طلب خدمة إضافية تم تقديمه عبر العملاء.`,
      icon: Inbox,
      actionLabel: 'إدارة الطلبات',
      actionTab: 'orders',
      color: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900 text-indigo-900 dark:text-indigo-200',
      btnColor: 'bg-indigo-600 hover:bg-indigo-700 text-white',
    });
  }

  if (missingIban) {
    alerts.push({
      id: 'missing-iban',
      type: 'danger',
      title: 'تأكيد الحساب البنكي (IBAN)',
      description: 'يرجى ربط الآيبان البنكي المعتمد للمنشأة لتحويل مستحقات الضمان والمبيعات تلقائياً.',
      icon: AlertTriangle,
      actionLabel: 'إكمال البيانات',
      actionTab: 'profile',
      color: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200',
      btnColor: 'bg-rose-600 hover:bg-rose-700 text-white',
    });
  }

  if (alerts.length === 0) {
    return (
      <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl flex items-center justify-between gap-3 text-emerald-900 dark:text-emerald-200">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300 rounded-xl">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black">جميع العمليات الميدانية تسير بانسيابية تامة</div>
            <div className="text-[10px] text-emerald-700 dark:text-emerald-400">لا توجد طلبات معلقة أو تنبيهات حرجة في الوقت الراهن.</div>
          </div>
        </div>
        <span className="text-[10px] font-black px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-300 rounded-full">
          جاهزية 100%
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      {alerts.map((alert) => {
        const Icon = alert.icon;
        return (
          <div
            key={alert.id}
            className={`p-4 rounded-3xl border ${alert.color} flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs`}
          >
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2 rounded-xl bg-white/60 dark:bg-black/20 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-black">{alert.title}</div>
                <div className="text-[11px] opacity-90">{alert.description}</div>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab && onNavigateTab(alert.actionTab)}
              className={`px-3.5 py-2 rounded-xl text-xs font-black shrink-0 flex items-center gap-1.5 transition-all cursor-pointer ${alert.btnColor} shadow-xs self-end sm:self-auto`}
            >
              <span>{alert.actionLabel}</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
