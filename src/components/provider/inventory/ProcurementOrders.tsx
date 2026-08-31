import React from 'react';
import { 
  Truck, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  DollarSign, 
  RotateCw 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface ProcurementOrdersProps {
  orders?: any[];
}

export const ProcurementOrders: React.FC<ProcurementOrdersProps> = ({
  orders = [
    { id: 'PO-2026-081', supplier: 'شركة التجهيزات الفندقية العالمية', itemsCount: 4, total: 6800, date: '2026-08-27', status: 'في الطريق' },
    { id: 'PO-2026-080', supplier: 'مصنع المنسوجات الذهبية', itemsCount: 2, total: 4200, date: '2026-08-24', status: 'مستلم ومطابق' },
    { id: 'PO-2026-079', supplier: 'مؤسسة العود الملكي', itemsCount: 1, total: 2500, date: '2026-08-20', status: 'مستلم ومطابق' },
  ],
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Truck className="w-4 h-4 text-indigo-600" />
            <span>أوامر الشراء والتوريد اللوجستي ({orders.length})</span>
          </h4>
          <p className="text-[10px] text-slate-400">متابعة شحنات التوريد من الموردين المعتمدين</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="p-3 font-black">رقم أمر الشراء</th>
              <th className="p-3 font-black">المورّد المعتمد</th>
              <th className="p-3 font-black">عدد الأصناف</th>
              <th className="p-3 font-black">المبلغ الإجمالي</th>
              <th className="p-3 font-black">التاريخ</th>
              <th className="p-3 font-black text-center">حالة التوريد</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {orders.map((po) => (
              <tr key={po.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{po.id}</td>
                <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{po.supplier}</td>
                <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{po.itemsCount} أصناف</td>
                <td className="p-3 font-mono font-black text-indigo-600 dark:text-indigo-400">{formatCurrency(po.total)}</td>
                <td className="p-3 font-mono text-slate-400 text-[11px]">{po.date}</td>
                <td className="p-3 text-center">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                    po.status === 'مستلم ومطابق'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300'
                  }`}>
                    {po.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
