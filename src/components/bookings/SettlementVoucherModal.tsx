import React from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Building2, 
  Sparkles, 
  ShieldCheck, 
  CheckCircle2, 
  FileText,
  Calendar,
  DollarSign
} from 'lucide-react';
import { calculateOrderFinancials } from './GenericOrderDetailsCard';

interface SettlementVoucherModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderNumber: string;
  orderType: 'hall' | 'service';
  itemTitle: string;
  providerName: string;
  customerName: string;
  bookingDate?: string;
  totalAmount: number;
  commissionRate?: number;
  settlementDate?: string;
  status?: string;
}

export const SettlementVoucherModal: React.FC<SettlementVoucherModalProps> = ({
  isOpen,
  onClose,
  orderNumber,
  orderType,
  itemTitle,
  providerName,
  customerName,
  bookingDate,
  totalAmount,
  commissionRate = 10,
  settlementDate = new Date().toISOString().split('T')[0],
  status = 'مكتمل'
}) => {
  if (!isOpen) return null;

  const financials = calculateOrderFinancials(totalAmount, commissionRate);
  const voucherNumber = `STL-${orderNumber.replace(/[^0-9]/g, '').slice(-8) || '26000001'}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs print:p-0 print:bg-white" dir="rtl">
      <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[95vh] overflow-hidden print:max-h-none print:shadow-none print:border-none">
        
        {/* Header Actions (Hidden when printing) */}
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/80 dark:bg-slate-800/40 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <h3 className="text-sm font-black text-slate-900 dark:text-white">
              إشعار التسوية المالية وسند الصرف المبدئي
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة السند / PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Voucher Body */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 text-slate-800 dark:text-slate-200 print:overflow-visible">
          {/* Top Brand & Title */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                منصة ليلة للمناسبات
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                إشعار تسوية ومستحقات مالية معتمدة للشركاء
              </p>
            </div>
            <div className="text-left font-mono">
              <span className="text-xs text-slate-400 block">رقم السند المرجعي</span>
              <span className="text-sm font-black text-slate-900 dark:text-white">{voucherNumber}</span>
              <span className="text-[11px] text-slate-500 block mt-1">تاريخ الإصدار: {settlementDate}</span>
            </div>
          </div>

          {/* Reference Info Card */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
            <div>
              <span className="text-slate-400 block font-semibold mb-1">المزود / الشريك المستفيد</span>
              <span className="font-black text-sm text-slate-800 dark:text-slate-200">{providerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-1">رقم الطلب / الحجز</span>
              <span className="font-mono font-bold text-sm text-slate-800 dark:text-slate-200">{orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-1">اسم العميل</span>
              <span className="font-bold text-sm text-slate-800 dark:text-slate-200">{customerName}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-1">البيان / المحجوز</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{itemTitle}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-1">تاريخ المناسبة</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{bookingDate || 'المحدد'}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-semibold mb-1">حالة الطلب</span>
              <span className="inline-flex items-center gap-1 font-bold text-emerald-600">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {status}
              </span>
            </div>
          </div>

          {/* Financial Breakdown Table */}
          <div className="space-y-3">
            <h4 className="text-xs font-black text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              جدول المحاسبة والاحتساب المالي
            </h4>
            <div className="rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-black">
                  <tr>
                    <th className="p-3">البند المالي</th>
                    <th className="p-3 text-center">النسبة / المعامل</th>
                    <th className="p-3 text-left">المبلغ (ر.س)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  <tr>
                    <td className="p-3 font-semibold">إجمالي قيمة الحجز الشاملة (Gross Amount)</td>
                    <td className="p-3 text-center font-mono">100%</td>
                    <td className="p-3 text-left font-mono font-bold">{financials.grossAmount.toLocaleString('en-US')} ر.س</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-500">المبلغ الخاضع للضريبة المستخرج (Taxable)</td>
                    <td className="p-3 text-center font-mono text-slate-500">100% / 1.15</td>
                    <td className="p-3 text-left font-mono text-slate-500">{financials.taxableAmount.toLocaleString('en-US')} ر.س</td>
                  </tr>
                  <tr>
                    <td className="p-3 text-slate-500">ضريبة القيمة المضافة المستخرجة (VAT)</td>
                    <td className="p-3 text-center font-mono text-slate-500">15%</td>
                    <td className="p-3 text-left font-mono text-slate-500">{financials.vatAmount.toLocaleString('en-US')} ر.س</td>
                  </tr>
                  <tr className="bg-rose-50/40 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300">
                    <td className="p-3 font-bold">عمولة المنصة السيادية المقتطعة</td>
                    <td className="p-3 text-center font-mono font-bold">%{financials.commissionRate}</td>
                    <td className="p-3 text-left font-mono font-black">-{financials.commissionAmount.toLocaleString('en-US')} ر.س</td>
                  </tr>
                  <tr className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-black text-sm">
                    <td className="p-3.5">صافي مستحقات المزود المستحقة للصرف</td>
                    <td className="p-3.5 text-center font-mono text-xs">Net Payout</td>
                    <td className="p-3.5 text-left font-mono text-base font-black text-emerald-600 dark:text-emerald-400">
                      {financials.providerNetAmount.toLocaleString('en-US')} ر.س
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Legal Note & Seal */}
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-end text-xs text-slate-500">
            <div className="space-y-1">
              <p>• هذا المستند يعتبر إشعار تسوية محاسبي صادر آلياً من منصة ليلة لخدمات المناسبات.</p>
              <p>• تُحوّل المستحقات الصافية إلى الحساب البنكي المعتمد (IBAN) للمزود فور جاهزية دورة الدفع.</p>
            </div>
            <div className="text-center p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
              <ShieldCheck className="w-6 h-6 text-indigo-600 mx-auto mb-1" />
              <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">معتمد من الإدارة المالية</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
