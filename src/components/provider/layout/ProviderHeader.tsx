import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  Sliders, 
  Clock, 
  Bell, 
  LogOut, 
  CheckCircle2, 
  ArrowUpRight 
} from 'lucide-react';

interface ProviderHeaderProps {
  currentProviderName: string;
  profileBusinessName?: string;
  profileLogo?: string;
  providerPlan?: string;
  liveNotificationsCount?: number;
  onOpenNotifications?: () => void;
  onOpenWizard?: () => void;
  onQuickAction?: (actionId: string) => void;
}

export const ProviderHeader: React.FC<ProviderHeaderProps> = ({
  currentProviderName,
  profileBusinessName,
  profileLogo,
  providerPlan = 'الباقة المتقدمة',
  liveNotificationsCount = 0,
  onOpenNotifications,
  onOpenWizard,
  onQuickAction,
}) => {
  const displayName = profileBusinessName || currentProviderName || 'منشأة الشريك';

  return (
    <header className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-4 md:p-5 shadow-xs transition-all mb-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: Brand Identity & Active Profile */}
        <div className="flex items-center gap-3.5">
          <div className="relative">
            {profileLogo ? (
              <img
                src={profileLogo}
                alt={displayName}
                className="w-12 h-12 rounded-2xl object-cover border border-slate-200 dark:border-slate-700 shadow-xs"
              />
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white flex items-center justify-center font-black text-lg shadow-sm">
                <Building2 className="w-6 h-6" />
              </div>
            )}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" title="نشط ومتصل" />
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base md:text-lg font-black text-slate-900 dark:text-slate-100">
                {displayName}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900">
                <ShieldCheck className="w-3 h-3 text-indigo-600" />
                <span>مزود معتمد</span>
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
                <Sparkles className="w-3 h-3 text-amber-600" />
                <span>{providerPlan}</span>
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 font-medium">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>نظام التشغيل الميداني النشط (Lailah Workspace)</span>
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Pills & Tools */}
        <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
          {onOpenWizard && (
            <button
              onClick={onOpenWizard}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-black rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-100 dark:border-indigo-800 shadow-xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>معالج التهيئة</span>
            </button>
          )}

          {onOpenNotifications && (
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-200 dark:border-slate-700"
              title="الإشعارات والرسائل"
            >
              <Bell className="w-4 h-4" />
              {liveNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-600 text-white rounded-full text-[9px] font-black flex items-center justify-center animate-pulse">
                  {liveNotificationsCount}
                </span>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
