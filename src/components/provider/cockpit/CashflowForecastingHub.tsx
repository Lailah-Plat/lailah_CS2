import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Calendar, Wallet, BellRing, DollarSign, 
  Send, AlertCircle, CheckCircle2, Clock, ArrowUpRight, ShieldCheck
} from 'lucide-react';

interface CashflowForecastingHubProps {
  myBookings: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const CashflowForecastingHub: React.FC<CashflowForecastingHubProps> = ({
  myBookings,
  showNotification
}) => {
  // Calculate forecast for 3 months
  const monthsData = [
    { monthName: 'أغسطس 2026 (الشهر الحالي)', gross: 145000, commissionRate: 0.10, confirmedCount: 6 },
    { monthName: 'سبتمبر 2026', gross: 180000, commissionRate: 0.10, confirmedCount: 8 },
    { monthName: 'أكتوبر 2026', gross: 210000, commissionRate: 0.10, confirmedCount: 9 },
  ];

  // Installments list
  const initialInstallments = [
    { id: 'INST-01', bkgId: 'BKG-26-0000000001', clientName: 'الأستاذ فيصل الشمري', dueDate: '2026-08-18', amount: 14000, status: 'due_soon' },
    { id: 'INST-02', bkgId: 'BKG-26-0000000002', clientName: 'د. سارة الدوسري', dueDate: '2026-08-22', amount: 17500, status: 'due_soon' },
    { id: 'INST-03', bkgId: 'BKG-26-0000000003', clientName: 'مهندس خالد المطيري', dueDate: '2026-08-10', amount: 9750, status: 'overdue' },
    { id: 'INST-04', bkgId: 'BKG-26-0000000004', clientName: 'د. عبدالإله الغامدي', dueDate: '2026-08-01', amount: 22000, status: 'paid' },
  ];

  const [installments, setInstallments] = useState(initialInstallments);

  const handleSendReminder = (bkgId: string, clientName: string, amount: number) => {
    showNotification(
      'success',
      `✉️ تم إرسال تذكير سداد إلكتروني فوري وإشعار دفع للعميل (${clientName}) لدفعة الحجز (${bkgId}) بقيمة ${amount.toLocaleString()} ر.س.`
    );
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">3-Month Cashflow Forecasting</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">توقعات التدفق النقدي 90 يوماً</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">التنبؤ المالي وتوقعات الأرباح القادمة</h3>
        </div>

        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 px-3.5 py-2 rounded-2xl text-xs font-bold text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>محسوب بعد اقتطاع عمولة المنصة الديناميكية (10%)</span>
        </div>
      </div>

      {/* 3 Months Forecast Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {monthsData.map((m, i) => {
          const commission = m.gross * m.commissionRate;
          const netTakeHome = m.gross - commission;

          return (
            <motion.div 
              key={i}
              whileHover={{ y: -3 }}
              className="bg-slate-900 text-white p-5 rounded-3xl border border-slate-800 shadow-sm space-y-4"
            >
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-xs font-black text-indigo-300">{m.monthName}</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2 py-0.5 rounded-full font-bold">
                  {m.confirmedCount} مناسبات مؤكدة
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-400 font-bold block">صافي أرباح المزود المتوقعة:</span>
                <div className="flex items-baseline gap-1 mt-0.5">
                  <span className="text-2xl font-black text-emerald-400 font-mono">{netTakeHome.toLocaleString()}</span>
                  <span className="text-xs text-emerald-300 font-bold">ر.س</span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-[11px] font-bold">
                <div>
                  <span className="text-slate-400 block font-medium">الإجمالي المتوقع:</span>
                  <span className="text-white font-mono">{m.gross.toLocaleString()} ر.س</span>
                </div>
                <div className="text-left">
                  <span className="text-slate-400 block font-medium">عمولة المنصة (10%):</span>
                  <span className="text-rose-400 font-mono">-{commission.toLocaleString()} ر.س</span>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Installments Tracker Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            جدول متابعة الأقساط والدفعات المستحقة:
          </h4>
          <span className="text-[10px] text-slate-400 font-bold">التذكيرات مدعومة بالإشعارات والـ WhatsApp</span>
        </div>

        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 divide-y divide-slate-200">
          {installments.map((inst) => (
            <div key={inst.id} className="py-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-white text-indigo-600 font-mono text-xs font-black rounded-xl border border-slate-200">
                  {inst.bkgId}
                </div>
                <div>
                  <h5 className="text-sm font-black text-slate-900">{inst.clientName}</h5>
                  <p className="text-xs text-slate-400 font-medium">تاريخ الاستحقاق: <span className="font-mono">{inst.dueDate}</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-sm font-black text-slate-900 font-mono">
                  {inst.amount.toLocaleString()} ر.س
                </span>

                {/* Status Badges */}
                <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                  inst.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : inst.status === 'overdue'
                    ? 'bg-rose-100 text-rose-800 border border-rose-300 animate-pulse'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  {inst.status === 'paid' ? 'مدفوع بالكامل 🟢' : inst.status === 'overdue' ? 'متأخر السداد 🔴' : 'مستحق قريباً 🟡'}
                </span>

                {inst.status !== 'paid' && (
                  <button
                    onClick={() => handleSendReminder(inst.bkgId, inst.clientName, inst.amount)}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Send className="w-3.5 h-3.5" /> إرسال تذكير سداد فوري
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
