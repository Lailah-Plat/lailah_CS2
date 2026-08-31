import React, { useState } from 'react';
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Building2, 
  ShieldCheck 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface SettlementsProps {
  currentProviderName: string;
  availableBalance?: number;
  escrowBalance?: number;
  withdrawalRequests?: any[];
  onRequestWithdrawal?: (amount: number, iban: string, holderName: string) => void;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const Settlements: React.FC<SettlementsProps> = ({
  currentProviderName,
  availableBalance = 15000,
  escrowBalance = 25000,
  withdrawalRequests = [],
  onRequestWithdrawal,
  showNotification,
}) => {
  const [amount, setAmount] = useState('');
  const [iban, setIban] = useState('SA');
  const [holderName, setHolderName] = useState('');

  const handleWithdraw = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmt = parseFloat(amount);
    if (!numAmt || numAmt <= 0) {
      showNotification?.('error', 'يرجى إدخال مبلغ تحويل صالح.');
      return;
    }
    if (numAmt > availableBalance) {
      showNotification?.('error', 'المبلغ المطلوب يتجاوز الرصيد المتاح للسحب حالياً.');
      return;
    }
    if (!iban || iban.length < 15) {
      showNotification?.('error', 'يرجى إدخال رقم الآيبان البنكي بصيغة صحيحة.');
      return;
    }

    if (onRequestWithdrawal) {
      onRequestWithdrawal(numAmt, iban, holderName);
    }
    setAmount('');
  };

  return (
    <div className="space-y-5">
      {/* Balances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-3xl shadow-sm text-right space-y-1">
          <span className="text-[10px] font-bold text-slate-300">رصيد الضمان المالي المحمي (Escrow)</span>
          <p className="text-2xl font-black font-mono mt-1">{formatCurrency(escrowBalance)}</p>
          <span className="text-[9px] text-indigo-300 block">يُصرف تلقائياً للمحفظة فور إنجاز المناسبات</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs text-right space-y-1">
          <span className="text-[10px] font-bold text-slate-500">الرصيد المتاح للتحويل البنكي الفوري</span>
          <p className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(availableBalance)}
          </p>
          <span className="text-[9px] text-slate-400 block">جاهز للإيداع في حساب الآيبان المعتمد</span>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 rounded-3xl shadow-xs text-right space-y-1">
          <span className="text-[10px] font-bold text-slate-500">إجمالي السحوبات المسواة لعام 2026</span>
          <p className="text-2xl font-black font-mono text-indigo-600 dark:text-indigo-400 mt-1">
            {formatCurrency(78500)}
          </p>
          <span className="text-[9px] text-slate-400 block">تمت مطابقتها وتسويتها بنكياً بالكامل</span>
        </div>
      </div>

      {/* New Settlement Request Form */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              <span>طلب تحويل مالي وتسوية بنكية فورية</span>
            </h4>
            <p className="text-[10px] text-slate-400">يتم إصدار رقم مالي موحد REV-26 وتحويل المبلغ لحسابك</p>
          </div>
          <span className="text-[10px] font-mono font-bold px-2.5 py-1 bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 rounded-full">
            تحويل سريع 24/7
          </span>
        </div>

        <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">مبلغ التحويل (ر.س) *</label>
            <input
              type="number"
              required
              max={availableBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="مثال: 5000"
              className="w-full text-xs font-bold p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">رقم الآيبان (IBAN) *</label>
            <input
              type="text"
              required
              value={iban}
              onChange={(e) => setIban(e.target.value)}
              placeholder="SA..."
              className="w-full text-xs font-mono font-bold p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-black text-slate-700 dark:text-slate-300">اسم المستفيد البنكي</label>
            <input
              type="text"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              placeholder={currentProviderName}
              className="w-full text-xs font-bold p-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>تأكيد وإرسال طلب التحويل</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
