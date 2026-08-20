import React, { useState } from 'react';
import { 
  FileText, ShieldCheck, DollarSign, Send, CheckCircle2, 
  Clock, Lock, Download, Printer, Share2, Sparkles, AlertCircle
} from 'lucide-react';

export interface ContractMilestone {
  stage: string;
  percentage: number;
  amount: number;
  dueDate: string;
  status: 'paid' | 'pending' | 'overdue';
}

export const MilestoneContracts: React.FC = () => {
  const [contractNo] = useState('CNT-26-0000000001');
  const [bookingNo] = useState('BKG-26-0000000001');
  const [totalAmount] = useState(25000); // 25,000 SAR

  const milestones: ContractMilestone[] = [
    {
      stage: 'دفعة العربون وحجز الموعد (Deposit)',
      percentage: 25,
      amount: totalAmount * 0.25, // 6,250 SAR
      dueDate: 'فور تأكيد الحجز',
      status: 'paid'
    },
    {
      stage: 'الدفعة التشغيلية وتوريد الخدمات (Operational Milestone)',
      percentage: 50,
      amount: totalAmount * 0.50, // 12,500 SAR
      dueDate: 'قبل الحفل بـ 14 يوماً (2026-08-01)',
      status: 'paid'
    },
    {
      stage: 'دفعة التسوية النهائية وتأمين القاعة (Final Settlement & Deposit)',
      percentage: 25,
      amount: totalAmount * 0.25, // 6,250 SAR
      dueDate: 'يوم الحفل (2026-08-14)',
      status: 'pending'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <FileText className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900">العقود الرقمية الذكية ومراحل الدفع (Milestone Contracts)</h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">توليد عقود موثقة تلقائياً مع تقسيم الدفعات وروابط التذكير الرقمية</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('تم إرسال رابط العقد الإلكتروني عبر الواتساب ورسائل SMS للعميل بنجاح!')}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" /> إرسال العقد للعميل (WhatsApp)
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> طباعة العقد
          </button>
        </div>
      </div>

      {/* Contract Details Banner */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <div className="flex justify-between items-center flex-wrap gap-2 text-xs font-bold">
          <div>
            <span className="text-slate-500">رقم العقد الموحد: </span>
            <span className="font-mono font-black text-indigo-600">{contractNo}</span>
            <span className="text-slate-400 mx-2">|</span>
            <span className="text-slate-500">رقم الحجز: </span>
            <span className="font-mono font-black text-indigo-600">{bookingNo}</span>
          </div>

          <div className="text-slate-800">
            <span>إجمالي قيمة العقد: </span>
            <span className="font-mono font-black text-emerald-700 text-sm">{totalAmount.toLocaleString()} ر.س</span>
          </div>
        </div>
      </div>

      {/* Payment Milestones Breakdown */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-800">جدول مراحل الدفع المقسمة (Payment Milestones Schedule)</h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {milestones.map((m, idx) => (
            <div 
              key={idx}
              className={`p-5 rounded-2xl border transition-all text-right space-y-3 ${
                m.status === 'paid'
                  ? 'bg-emerald-50/50 border-emerald-200'
                  : 'bg-slate-50 border-slate-200 hover:border-indigo-200'
              }`}
            >
              <div className="flex justify-between items-center text-xs font-black">
                <span className="text-slate-800">{m.stage}</span>
                <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                  m.status === 'paid'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {m.status === 'paid' ? 'ملموم ومسدد ✓' : 'في الانتظار ⏳'}
                </span>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-xs text-slate-500 font-bold">المبلغ المقابل ({m.percentage}%):</span>
                <span className="text-lg font-mono font-black text-slate-900">{m.amount.toLocaleString()} ر.س</span>
              </div>

              <div className="text-[11px] font-bold text-slate-500 bg-white p-2.5 rounded-xl border border-slate-100">
                استحقاق الدفعة: <strong className="text-slate-800 font-mono">{m.dueDate}</strong>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standard Terms & Policy Preview */}
      <div className="p-4 bg-slate-900 text-white rounded-2xl text-xs space-y-2 leading-relaxed">
        <div className="flex items-center gap-2 font-black text-amber-400">
          <ShieldCheck className="w-4 h-4" />
          <span>الشروط والأحكام المعتمدة في منصة ليلة ERP:</span>
        </div>
        <p className="text-slate-300 font-bold">
          • يتم تحويل دفعة العربون مباشرة لحساب ضمان المنصة. في حال الإلغاء قبل الموعد بـ 30 يوماً يُسترد العربون كاملاً وفقاً لسياسة الإلغاء المعتمدة.
          <br />
          • تشمل قيمة العقد كافة التكاليف التشغيلية وعمولة المنصة المعتمدة حسب باقة اشتراك المزود.
        </p>
      </div>
    </div>
  );
};
