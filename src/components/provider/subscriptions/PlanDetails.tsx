import React from 'react';
import { 
  Sparkles, 
  Check, 
  Crown, 
  Percent, 
  ShieldCheck 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface PlanDetailsProps {
  providerPlan: 'starter' | 'pro';
  onUpgrade?: (plan: 'starter' | 'pro') => void;
}

export const PlanDetails: React.FC<PlanDetailsProps> = ({
  providerPlan,
  onUpgrade,
}) => {
  const isPro = providerPlan === 'pro';

  return (
    <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-md space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Crown className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-black text-amber-400">
            {isPro ? 'الباقة الملكية الاحترافية (Pro ERP)' : 'الباقة المبتدئة (Starter)'}
          </span>
        </div>
        <span className="px-3 py-1 bg-amber-400 text-slate-900 text-[10px] font-black rounded-full">
          نشطة وسارية
        </span>
      </div>

      <div className="space-y-1">
        <h3 className="text-lg font-black">
          {isPro ? 'نظام تشغيل وإدارة القاعات المتكامل' : 'نظام إدارة القاعات الأساسي'}
        </h3>
        <p className="text-xs text-indigo-100 max-w-xl">
          {isPro
            ? 'تتيح لك الباقة الاحترافية نسبة عمولة سيادية منخفضة 8%، محرك التسعير الديناميكي، تجميع الباقات، وإدارة متعددة الفروع.'
            : 'تتيح لك الباقة المبتدئة إدارة فرع واحد و3 مستخدمين مع نسبة عمولة 12%.'}
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3 border-t border-indigo-800/80 text-xs">
        <div>
          <span className="text-[10px] text-indigo-300 block">نسبة عمولة المنصة</span>
          <span className="font-mono font-black text-amber-400 text-sm">{isPro ? '8%' : '12%'}</span>
        </div>
        <div>
          <span className="text-[10px] text-indigo-300 block">الفروع المتاحة</span>
          <span className="font-bold">{isPro ? '2 فروع' : 'فرع واحد'}</span>
        </div>
        <div>
          <span className="text-[10px] text-indigo-300 block">محرك الأسعار الديناميكي</span>
          <span className="font-bold text-emerald-400">{isPro ? 'مفعل وشامل' : 'إضافي منفصل'}</span>
        </div>
        <div>
          <span className="text-[10px] text-indigo-300 block">الاشتراك الشهري</span>
          <span className="font-mono font-bold">{isPro ? formatCurrency(499) : formatCurrency(199)} / شهر</span>
        </div>
      </div>
    </div>
  );
};
