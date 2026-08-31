import React from 'react';
import { 
  FileText, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  CheckCircle2, 
  DollarSign 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface VendorContractsProps {
  contracts?: any[];
}

export const VendorContracts: React.FC<VendorContractsProps> = ({
  contracts = [
    { id: 'CNT-2026-01', vendorName: 'شركة التجهيزات الفندقية العالمية', title: 'عقد توريد وصيانة أنظمة الصوت والإضاءة', period: '2026-01-01 إلى 2026-12-31', amount: 36000, status: 'نشط وساري' },
    { id: 'CNT-2026-02', vendorName: 'مصنع المنسوجات الذهبية', title: 'عقد غسيل وكي وتوريد المفارش الملكية', period: '2026-03-01 إلى 2027-02-28', amount: 18000, status: 'نشط وساري' },
  ],
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>عقود التوريد والخدمات اللوجستية السارية ({contracts.length})</span>
          </h4>
          <p className="text-[10px] text-slate-400">اتفاقيات مستوى الخدمة (SLA) وشروط الدفع</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contracts.map((cnt) => (
          <div
            key={cnt.id}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400">{cnt.id}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {cnt.status}
              </span>
            </div>

            <div>
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{cnt.title}</h5>
              <span className="text-[10px] text-slate-500 font-bold block mt-0.5">{cnt.vendorName}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
              <span className="text-slate-400 text-[10px]">{cnt.period}</span>
              <span className="font-mono text-indigo-600 dark:text-indigo-400 font-black">{formatCurrency(cnt.amount)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
