import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/helpers';
import ProviderPayoutAndSubscriptionPanel from '../../payment/ProviderPayoutAndSubscriptionPanel';

interface ProviderFinanceCenterProps {
  currentProviderName: string;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderFinanceCenter({
  currentProviderName,
  showNotification,
}: ProviderFinanceCenterProps) {
  const [withdrawingAmount, setWithdrawingAmount] = useState('');
  const [withdrawIban, setWithdrawIban] = useState('');
  const [withdrawHolder, setWithdrawHolder] = useState('');
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`provider_withdrawals_${currentProviderName}`);
      return stored
        ? JSON.parse(stored)
        : [
            { id: 'W-01', amount: 15000, iban: 'SA1234567890123456789012', status: 'مقبول', date: '2026-06-15' },
            { id: 'W-02', amount: 8000, iban: 'SA1234567890123456789012', status: 'مقبول', date: '2026-07-02' },
          ];
    } catch {
      return [];
    }
  });

  const saveWithdrawalRequests = (newRequests: any[]) => {
    setWithdrawalRequests(newRequests);
    try {
      localStorage.setItem(`provider_withdrawals_${currentProviderName}`, JSON.stringify(newRequests));
    } catch {}
  };

  const handleCreateSettlement = () => {
    if (!withdrawingAmount || !withdrawIban || !withdrawHolder) {
      showNotification('warning', 'يرجى تعبئة كافة تفاصيل طلب التحويل المالي.');
      return;
    }
    const amt = parseFloat(withdrawingAmount);
    if (amt > 15000) {
      showNotification('error', 'المبلغ المطلوب يتجاوز الرصيد المتاح للسحب حالياً.');
      return;
    }
    const newIdNum = withdrawalRequests.length + 1;
    const newReq = {
      id: `REV-26-${String(newIdNum).padStart(10, '0')}`,
      amount: amt,
      iban: withdrawIban,
      status: 'مقبول',
      date: new Date().toISOString().split('T')[0],
    };
    saveWithdrawalRequests([newReq, ...withdrawalRequests]);
    setWithdrawingAmount('');
    setWithdrawIban('');
    setWithdrawHolder('');
    showNotification('success', `تم تسجيل طلب التسوية البنكية بالرقم المالي ${newReq.id} وتحويله للمراجعة الفورية!`);
  };

  return (
    <div className="space-y-6">
      {/* Ledger summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm text-right space-y-1">
          <span className="text-[10px] font-bold text-slate-300">رصيد المحفظة الإجمالي (الضمان)</span>
          <p className="text-2xl font-black font-mono mt-1">{formatCurrency(25000)}</p>
          <span className="text-[9px] text-indigo-300 block">يشمل الحجوزات قيد التنفيذ والضمان</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-right space-y-1">
          <span className="text-[10px] font-bold text-slate-400">الرصيد المتاح للسحب الفوري</span>
          <p className="text-2xl font-black font-mono mt-1 text-emerald-600">{formatCurrency(15000)}</p>
          <span className="text-[9px] text-slate-400 block">جاهز للتحويل للآيبان البنكي</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-right space-y-1">
          <span className="text-[10px] font-bold text-slate-400">العمولات المستحقة للمنصة</span>
          <p className="text-2xl font-black font-mono mt-1 text-purple-600">{formatCurrency(2000)}</p>
          <span className="text-[9px] text-slate-400 block">تقتطع تلقائياً بنسبة عمولة ثابتة 8%</span>
        </div>
      </div>

      {/* Settlement Request Form */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <h3 className="text-sm font-black text-slate-800">طلب تسوية مالية وتحويل بنكي للحساب</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block">المبلغ المراد سحبه بالريال (SAR)</label>
            <input
              type="number"
              placeholder="مثال: 5000"
              value={withdrawingAmount}
              onChange={(e) => setWithdrawingAmount(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs text-right font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block">رقم الحساب البنكي (IBAN)</label>
            <input
              type="text"
              placeholder="SAxxxxxxxxxxxxxxxxxxxx"
              value={withdrawIban}
              onChange={(e) => setWithdrawIban(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs text-right font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-black text-slate-500 block">اسم صاحب الحساب البنكي</label>
            <input
              type="text"
              placeholder="الاسم الثلاثي المسجل بالبنك"
              value={withdrawHolder}
              onChange={(e) => setWithdrawHolder(e.target.value)}
              className="w-full p-2 border border-slate-200 rounded-xl text-xs text-right"
            />
          </div>
        </div>

        <button
          onClick={handleCreateSettlement}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
        >
          تأكيد وإرسال طلب التسوية والمقاصة
        </button>
      </div>

      {/* Withdrawal ledger */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <h3 className="text-sm font-black text-slate-800">سجل طلبات التحويل والتسويات المالية السابقة</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3 font-black">رقم التسوية (REV/EXP)</th>
                <th className="p-3 font-black">مبلغ التحويل</th>
                <th className="p-3 font-black">الحساب البنكي</th>
                <th className="p-3 font-black">تاريخ الطلب</th>
                <th className="p-3 font-black text-center">حالة الطلب</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans">
              {withdrawalRequests.map((req: any, idx: number) => {
                const formattedRevId = req.id && req.id.startsWith('REV') ? req.id : `REV-26-000000000${idx + 1}`;
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-indigo-600">{formattedRevId}</td>
                    <td className="p-3 font-mono text-slate-800 font-black">{formatCurrency(req.amount)}</td>
                    <td className="p-3 font-mono text-slate-500 truncate max-w-xs">{req.iban}</td>
                    <td className="p-3 font-mono text-slate-500">{req.date}</td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">
                        {req.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Provider Payout Account & Subscription Payment Panel */}
      <div className="pt-4 border-t border-slate-100">
        <ProviderPayoutAndSubscriptionPanel
          providerId="prov-101"
          providerName={currentProviderName}
          showNotification={showNotification}
        />
      </div>
    </div>
  );
}
