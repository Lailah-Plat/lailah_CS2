import React from 'react';
import { 
  Percent, 
  Tag, 
  Sparkles, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ShieldCheck 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface PromotionsProps {
  promotions: any[];
  onNewPromotion?: () => void;
}

export const Promotions: React.FC<PromotionsProps> = ({
  promotions = [],
  onNewPromotion,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Tag className="w-4 h-4 text-amber-600" />
            <span>كوبونات الخصم والعروض المعتمدة ({promotions.length})</span>
          </h3>
          <p className="text-[11px] text-slate-500">العروض الترويجية المعتمدة وفق قواعد الحفاظ على عمولة المنصة</p>
        </div>

        {onNewPromotion && (
          <button
            onClick={onNewPromotion}
            className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إنشاء كوبون جديد</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {promotions.map((promo, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-black px-2.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-100 dark:border-amber-900">
                {promo.code || 'LAILAH2026'}
              </span>
              <span className="text-[10px] font-bold text-emerald-600">معتمد ونشط</span>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-300">قيمة الخصم:</span>
              <span className="font-black text-indigo-600">{promo.discount || '15%'}</span>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>تاريخ الانتهاء: {promo.expiry || '2026-12-31'}</span>
              <span>مرات الاستخدام: {promo.usesCount || 12}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
