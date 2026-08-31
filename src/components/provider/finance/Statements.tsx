import React from 'react';
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  CheckCircle2, 
  Clock, 
  Calendar 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface StatementsProps {
  transactions?: any[];
}

export const Statements: React.FC<StatementsProps> = ({
  transactions = [
    { id: 'REV-26-0000000012', type: 'revenue', description: 'دفعة حجز قاعة الأسطورة الكبرى', amount: 15000, date: '2026-08-28', status: 'مكتمل' },
    { id: 'REV-26-0000000011', type: 'revenue', description: 'طلب خدمة ضيافة ملكية VIP', amount: 3500, date: '2026-08-25', status: 'مكتمل' },
    { id: 'EXP-26-0000000004', type: 'expense', description: 'تحويل تسوية بنكية للحساب الجاري', amount: -12000, date: '2026-08-20', status: 'مسوى' },
    { id: 'REV-26-0000000010', type: 'revenue', description: 'دفعة حجز القصر الذهبي', amount: 18000, date: '2026-08-15', status: 'مكتمل' },
  ],
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-4 h-4 text-indigo-600" />
            <span>كشف الحساب المالي والعمليات (REV-26 / EXP-26)</span>
          </h4>
          <p className="text-[10px] text-slate-400">سجل متكامل للإيرادات والمصروفات والمسحوبات البنكية</p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="p-3 font-black">الرقم المالي الموحد</th>
              <th className="p-3 font-black">نوع الحركة والبيان</th>
              <th className="p-3 font-black">المبلغ (شامل الضريبة)</th>
              <th className="p-3 font-black">التاريخ</th>
              <th className="p-3 font-black text-center">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {transactions.map((tx, idx) => {
              const isIncome = tx.amount > 0;
              return (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {tx.id}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1 rounded-lg ${isIncome ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {isIncome ? <ArrowDownRight className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      </div>
                      <span className="font-bold text-slate-800 dark:text-slate-200">{tx.description}</span>
                    </div>
                  </td>
                  <td className="p-3 font-mono font-black">
                    <span className={isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}>
                      {isIncome ? `+${formatCurrency(tx.amount)}` : formatCurrency(tx.amount)}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-400 text-[11px]">{tx.date}</td>
                  <td className="p-3 text-center">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900">
                      {tx.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
