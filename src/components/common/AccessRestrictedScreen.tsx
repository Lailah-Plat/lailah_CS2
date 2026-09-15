import React from 'react';
import { ShieldAlert, Home, LogIn, ArrowRight, Building2, Receipt } from 'lucide-react';
import { getCurrentUser } from '../../utils/permissionUtils';

interface AccessRestrictedScreenProps {
  type: 'dashboard' | 'operations';
  title?: string;
  message?: string;
  onOpenLogin?: () => void;
}

export const AccessRestrictedScreen: React.FC<AccessRestrictedScreenProps> = ({
  type,
  title,
  message,
  onOpenLogin
}) => {
  const currentUser = getCurrentUser();
  const isOperations = type === 'operations';

  const defaultTitle = isOperations
    ? 'منطقة سيادية مقيدة - مركز العمليات والاستثناءات'
    : 'منطقة سيادية مقيدة - لوحة تحكم الإدارة العامة';

  const defaultMessage = isOperations
    ? 'هذا المسار مخصص للإدارة المركزية وفريق العمليات المعتمد فقط. لا يمتلك حسابك الحالي الصلاحيات التشغيلية اللازمة للوصول إلى مركز العمليات ومعالجة الاستثناءات.'
    : 'هذا المسار مخصص لإدارة المنصة والموظفين المصرح لهم فقط. تم حظر الدخول تطبيقاً لقواعد العزل الصارم للبيانات.';

  const roleLabel = currentUser?.role || 'زائر غير مسجل';
  const isProvider = currentUser?.role?.toLowerCase().includes('provider') || currentUser?.role?.toLowerCase().includes('مزود');
  const isCustomer = currentUser?.role?.toLowerCase().includes('customer') || currentUser?.role?.toLowerCase().includes('عميل');

  return (
    <div className="min-h-[85vh] bg-slate-900/95 flex items-center justify-center p-4 sm:p-6 font-sans select-none" dir="rtl">
      <div className="max-w-xl w-full bg-slate-950/90 border border-slate-800 rounded-3xl p-6 sm:p-10 shadow-2xl relative overflow-hidden backdrop-blur-md text-center">
        {/* Ambient background glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Sovereign Security Shield Icon */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-b from-red-500/20 to-red-950/40 border border-red-500/30 flex items-center justify-center mb-6 shadow-inner shadow-red-500/20">
          <ShieldAlert className="w-10 h-10 sm:w-12 sm:h-12 text-red-400 animate-pulse" />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-red-600 rounded-full border-2 border-slate-950 flex items-center justify-center text-[11px] font-black text-white">
            ✕
          </div>
        </div>

        {/* Security Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-red-950/70 border border-red-800/80 text-red-300 text-xs font-black mb-4">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
          <span>قيد أمني سيادي (Access Restricted - 403)</span>
        </div>

        {/* Title */}
        <h1 className="text-xl sm:text-2xl font-black text-white mb-3 tracking-tight">
          {title || defaultTitle}
        </h1>

        {/* Explanation */}
        <p className="text-sm text-slate-400 mb-6 leading-relaxed max-w-md mx-auto">
          {message || defaultMessage}
        </p>

        {/* User context card */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 mb-8 text-right flex items-center justify-between gap-3">
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-slate-400">الحساب الحالي قيد الفحص:</p>
            <p className="text-xs font-black text-slate-200">{currentUser?.name || currentUser?.email || 'غير مسجل دخول'}</p>
            <p className="text-[10px] text-slate-500 font-mono">{currentUser?.email || 'لا يوجد بريد إلكتروني مرتبط'}</p>
          </div>
          <div className="shrink-0 text-left">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 text-[11px] font-bold">
              الرتبة: {roleLabel}
            </span>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            onClick={() => { window.location.href = '/'; }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-all border border-slate-700 active:scale-95 cursor-pointer"
          >
            <Home className="w-4 h-4 text-slate-300" />
            <span>العودة للرئيسية</span>
          </button>

          {isProvider && (
            <button
              onClick={() => { window.location.href = '/provider-dashboard'; }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>لوحة تحكم المزود</span>
            </button>
          )}

          {isCustomer && (
            <button
              onClick={() => { window.location.href = '/bookings'; }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Receipt className="w-4 h-4" />
              <span>حجوزاتي وطلباتي</span>
            </button>
          )}

          <button
            onClick={() => {
              if (onOpenLogin) {
                onOpenLogin();
              } else {
                localStorage.removeItem('IS_AUTHENTICATED');
                window.location.href = '/';
              }
            }}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-red-900/30 active:scale-95 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول بحساب مصرح</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AccessRestrictedScreen;
