import React from 'react';
import { 
  Megaphone, 
  TrendingUp, 
  Sparkles, 
  Calendar, 
  Plus, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface CampaignsProps {
  campaigns: any[];
  onNewCampaign?: () => void;
}

export const Campaigns: React.FC<CampaignsProps> = ({
  campaigns = [],
  onNewCampaign,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Megaphone className="w-4 h-4 text-fuchsia-600" />
            <span>الحملات الإعلانية النشطة ({campaigns.length})</span>
          </h3>
          <p className="text-[11px] text-slate-500">حملات الترويج الموجهة لزيادة الحجوزات والمبيعات</p>
        </div>

        {onNewCampaign && (
          <button
            onClick={onNewCampaign}
            className="px-3.5 py-2 bg-fuchsia-600 hover:bg-fuchsia-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إطلاق حملة جديدة</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {campaigns.map((camp, idx) => (
          <div
            key={idx}
            className="p-4 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl space-y-3 shadow-xs hover:shadow-md transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-fuchsia-50 dark:bg-fuchsia-950 text-fuchsia-700 dark:text-fuchsia-300 border border-fuchsia-100 dark:border-fuchsia-900">
                {camp.type || 'حملة موسمية'}
              </span>
              <span className="text-[10px] font-bold text-slate-400">{camp.date || 'نشط'}</span>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{camp.title || 'حملة عروض الصيف الذهبية'}</h4>
              <p className="text-[10px] text-slate-500 mt-1">{camp.description || 'خصم 10% على جميع حجوزات أيام الأسبوع.'}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold">
              <span className="text-slate-400">العائد المحقق:</span>
              <span className="font-mono text-emerald-600 font-black">{formatCurrency(camp.revenue || 42000)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
