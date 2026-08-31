import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Percent, 
  FileSpreadsheet, 
  Download, 
  PieChart 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface FinancialReportsProps {
  currentProviderName?: string;
  commissionRate?: number;
}

export const FinancialReports: React.FC<FinancialReportsProps> = ({
  currentProviderName = 'المنشأة',
  commissionRate = 8,
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-indigo-600" />
            <span>التقارير المالية والضريبية الشاملة (VAT 15%)</span>
          </h4>
          <p className="text-[10px] text-slate-400">حسابات الضريبة والعمولة المقتطعة بحسب باقة الاشتراك</p>
        </div>

        <button className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 hover:bg-slate-200 transition-all cursor-pointer">
          <Download className="w-3.5 h-3.5" />
          <span>تصدير Excel</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400">نسبة عمولة المنصة المعتمدة للباقة</span>
          <p className="text-xl font-black font-mono text-indigo-600 dark:text-indigo-400">{commissionRate}%</p>
          <span className="text-[9px] text-slate-400">محددة وفق باقة اشتراك المنشأة</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400">إجمالي الضريبة المستخرجة (15% VAT)</span>
          <p className="text-xl font-black font-mono text-slate-800 dark:text-slate-200">{formatCurrency(37108)}</p>
          <span className="text-[9px] text-slate-400">مستخرجة من المبالغ الشاملة</span>
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1">
          <span className="text-[10px] font-bold text-slate-400">صافي الأرباح المحققة للمنشأة</span>
          <p className="text-xl font-black font-mono text-emerald-600 dark:text-emerald-400">{formatCurrency(247392)}</p>
          <span className="text-[9px] text-emerald-500">جاهزة للتسوية والتحويل البنكي</span>
        </div>
      </div>
    </div>
  );
};
