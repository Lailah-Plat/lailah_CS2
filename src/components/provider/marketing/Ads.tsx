import React from 'react';
import { 
  Megaphone, 
  Sparkles, 
  Plus, 
  ArrowUpRight, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface AdsProps {
  adRequests: any[];
  onRequestAd?: () => void;
}

export const Ads: React.FC<AdsProps> = ({
  adRequests = [],
  onRequestAd,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span>الإعلانات المميزة والبنرات الترويجية ({adRequests.length})</span>
          </h3>
          <p className="text-[11px] text-slate-500">طلبات الترويج المميز في الصفحة الرئيسية والتطبيق</p>
        </div>

        {onRequestAd && (
          <button
            onClick={onRequestAd}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>طلب بنر إعلاني</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {adRequests.map((ad, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                {ad.position || 'بنر رئيسي أعلى التطبيق'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{ad.duration || 'أسبوعان'}</span>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{ad.title || 'إعلان صيف 2026 المميز'}</h4>
              <p className="text-[10px] text-slate-500 mt-1">{ad.description || 'ظهور حصري في الصفحة الأولى للمستخدمين في الرياض.'}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
