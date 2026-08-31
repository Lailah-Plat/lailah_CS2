import React from 'react';
import { 
  TrendingUp, 
  Activity, 
  Wallet, 
  Calendar, 
  ArrowUpRight, 
  CheckCircle2, 
  Users2, 
  Sparkles 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface OverviewKPIsProps {
  totalRevenue?: number;
  activeBookingsCount?: number;
  occupancyRate?: number;
  customerSatisfaction?: number;
  pendingRequestsCount?: number;
  onNavigateTab?: (tab: string) => void;
}

export const OverviewKPIs: React.FC<OverviewKPIsProps> = ({
  totalRevenue = 284500,
  activeBookingsCount = 14,
  occupancyRate = 78,
  customerSatisfaction = 4.9,
  pendingRequestsCount = 3,
  onNavigateTab,
}) => {
  const kpis = [
    {
      id: 'rev',
      label: 'إجمالي التدفقات والحجوزات',
      value: formatCurrency(totalRevenue),
      subtext: '+18.4% مقارنة بالشهر السابق',
      icon: Wallet,
      color: 'from-emerald-500/10 to-emerald-500/5 text-emerald-600 border-emerald-100',
      actionTab: 'finance',
    },
    {
      id: 'bkg',
      label: 'الحجوزات المؤكدة والنشطة',
      value: `${activeBookingsCount} حجز`,
      subtext: '4 مناسبات خلال هذا الأسبوع',
      icon: Calendar,
      color: 'from-indigo-500/10 to-indigo-500/5 text-indigo-600 border-indigo-100',
      actionTab: 'bookings',
    },
    {
      id: 'occ',
      label: 'معدل إشغال القاعات والخدمات',
      value: `${occupancyRate}%`,
      subtext: 'أيام نهاية الأسبوع (الويكند) محجوزة',
      icon: Activity,
      color: 'from-purple-500/10 to-purple-500/5 text-purple-600 border-purple-100',
      actionTab: 'catalog',
    },
    {
      id: 'sat',
      label: 'مؤشر الجودة وتقييم الضيوف',
      value: `${customerSatisfaction} / 5.0`,
      subtext: 'بناءً على 128 تقييم موثق',
      icon: Sparkles,
      color: 'from-amber-500/10 to-amber-500/5 text-amber-600 border-amber-100',
      actionTab: 'quality',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            onClick={() => onNavigateTab && onNavigateTab(kpi.actionTab)}
            className={`p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                {kpi.label}
              </span>
              <div className={`p-2 rounded-2xl bg-gradient-to-br ${kpi.color} group-hover:scale-105 transition-transform`}>
                <Icon className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="text-xl font-black text-slate-900 dark:text-slate-100 mb-1">
                {kpi.value}
              </div>
              <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-500 inline" />
                <span>{kpi.subtext}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
