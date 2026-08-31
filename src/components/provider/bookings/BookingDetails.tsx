import React from 'react';
import { 
  CheckSquare, 
  Calendar, 
  Clock, 
  Users, 
  Wallet, 
  MapPin, 
  FileText, 
  ShieldCheck, 
  X, 
  Printer 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface BookingDetailsProps {
  booking: any;
  isOpen: boolean;
  onClose: () => void;
  onPrintInvoice?: (booking: any) => void;
}

export const BookingDetails: React.FC<BookingDetailsProps> = ({
  booking,
  isOpen,
  onClose,
  onPrintInvoice,
}) => {
  if (!isOpen || !booking) return null;

  const bookingSerial = booking.id && booking.id.startsWith('BKG-')
    ? booking.id
    : `BKG-26-${String(booking.id || 1).replace(/\D/g, '').padStart(10, '0')}`;

  const invoiceNumber = `INV-26${String(booking.id || 1).replace(/\D/g, '').padStart(10, '0')}`;
  const totalAmount = Number(booking.amount || booking.price || 15000);
  const taxableAmount = totalAmount / 1.15;
  const vatAmount = totalAmount - taxableAmount;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">تفاصيل الحجز الميداني</h3>
                <span className="font-mono text-[11px] font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {bookingSerial}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-mono">الرقم الضريبي للفاتورة: {invoiceNumber}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Booking Card Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">العميل</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block mt-0.5">
              {booking.customer || booking.customerName || 'عميل منصة ليلة'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">القاعة</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 truncate block mt-0.5">
              {booking.hall || 'القاعة الملكية'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">تاريخ المناسبة</span>
            <span className="text-xs font-black text-slate-800 dark:text-slate-100 block mt-0.5 font-mono">
              {booking.date || '2026-08-30'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block">الحالة</span>
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {booking.status || 'مؤكد ومعتمد'}
            </span>
          </div>
        </div>

        {/* Financial Breakdown (15% VAT Inclusive) */}
        <div className="p-4 bg-indigo-50/40 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900 rounded-2xl space-y-2 text-xs">
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>المبلغ الخاضع للضريبة:</span>
            <span className="font-mono font-bold">{formatCurrency(taxableAmount)}</span>
          </div>
          <div className="flex items-center justify-between text-slate-600 dark:text-slate-300">
            <span>ضريبة القيمة المضافة (15% شاملة):</span>
            <span className="font-mono font-bold">{formatCurrency(vatAmount)}</span>
          </div>
          <div className="flex items-center justify-between font-black text-indigo-950 dark:text-indigo-200 pt-2 border-t border-indigo-100 dark:border-indigo-900">
            <span>الإجمالي النهائي المستحق:</span>
            <span className="text-sm font-mono text-indigo-600 dark:text-indigo-400 font-extrabold">
              {formatCurrency(totalAmount)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            <span>محمي بلقطة التسعير المثبتة وسند الضمان</span>
          </div>

          <div className="flex items-center gap-2">
            {onPrintInvoice && (
              <button
                onClick={() => onPrintInvoice(booking)}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>طباعة السند والفاتورة</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
            >
              إغلاق
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
