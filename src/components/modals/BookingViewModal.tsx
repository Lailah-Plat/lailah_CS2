import React from 'react';
import { X, Wallet, Clock, FileText } from 'lucide-react';
import { formatCurrency, getStatusColor } from '../../data/dashboardConstants';
import { formatBookingId } from '../../utils/idUtils';
import { AdBanner } from '../AdBanner';

interface BookingViewModalProps {
  isOpen: boolean;
  booking: any;
  onClose: () => void;
  onPrintInvoice: (booking: any) => void;
}

export const BookingViewModal: React.FC<BookingViewModalProps> = ({
  isOpen,
  booking,
  onClose,
  onPrintInvoice
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl relative border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-3xl">
          <h3 className="text-xl font-bold text-slate-850 dark:text-amber-50 flex items-center gap-2">
            <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
            تفاصيل الحجز <span className="font-mono">{formatBookingId(booking.id)}</span>
          </h3>
          <button 
            onClick={onClose} 
            className="bg-white dark:bg-slate-850 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-150 dark:border-slate-800 shadow-sm p-2 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">اسم القاعة/الخدمة</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.hall || booking.itemName}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">نوع الحجز</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.type || 'غير محدد'}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">تاريخ البداية</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.startDate || booking.date}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">تاريخ النهاية</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.endDate || booking.date}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">فترة الحجز</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.period || 'غير محدد'}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">عدد الضيوف</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.guests || 0}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">اسم العميل</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.customer}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">رقم الجوال</span>
              <span className="font-bold text-slate-800 dark:text-slate-200" dir="ltr">{booking.phone || 'غير محدد'}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">حالة الحجز</span>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold border inline-block ${getStatusColor(booking.status)}`}>{booking.status}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
              <span className="text-xs text-slate-500 block mb-1">حالة الدفع (الاستحقاق)</span>
              <span className={`px-2 py-1 rounded-md text-[10px] font-bold border inline-block ${getStatusColor(booking.paymentStatus)}`}>{booking.paymentStatus}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
              <span className="text-xs text-slate-500 block mb-1">الخدمات الإضافية</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{booking.extraServices || 'لا يوجد'}</span>
            </div>
            <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
              <span className="text-xs text-slate-500 block mb-1">ملاحظات</span>
              <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{booking.notes || 'لا يوجد'}</span>
            </div>
            
            {/* Financial Breakdown Section */}
            <div className="sm:col-span-2 bg-indigo-50/50 dark:bg-indigo-950/20 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-900/50 mt-2 space-y-4">
              <h4 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 text-sm mb-2">
                <Wallet className="w-4 h-4" /> تفاصيل الدفع والتدفق المالي
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block font-bold">إجمالي مبلغ الحجز</span>
                  <span className="font-black text-slate-800 dark:text-amber-50 text-lg">{formatCurrency(booking.amount)}</span>
                </div>
                <div className="space-y-1 text-left" dir="ltr">
                  <span className="text-[10px] text-indigo-600 dark:text-indigo-300 block font-bold text-right">حالة الدفعة</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    booking.paymentStatus === 'مدفوع' ? 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/50' : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/50'
                  }`}>
                    {booking.paymentStatus === 'جزئي' ? 'مسدد جزئياً (عربون)' : booking.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Partial payment details if applicable */}
              {(booking.paymentStatus === 'جزئي' || (booking.downPaymentAmount > 0)) && (
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-indigo-200/50 dark:border-indigo-900/50">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block">المبلغ المقدم (العربون)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(booking.downPaymentAmount || (booking.amount * 0.3))}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 block">المبلغ المتبقي</span>
                    <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(booking.remainingAmount || (booking.amount * 0.7))}</span>
                  </div>
                  <div className="col-span-2 bg-amber-100/50 dark:bg-amber-950/30 p-2 rounded-lg flex items-center gap-2 border border-amber-200 dark:border-amber-900/50">
                    <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                    <span className="text-[10px] text-amber-800 dark:text-amber-200 font-bold">
                      يجب سداد المتبقي قبل {booking.paymentDeadline || '3 أيام من تاريخ الحجز'} وإلا يُعتبر الحجز ملغياً والمقدم غير مسترد.
                    </span>
                  </div>
                </div>
              )}

              {/* Applied Promotion Snapshot details if present */}
              {booking.appliedPromotionSnapshot && (
                <div className="bg-emerald-50/80 dark:bg-emerald-950/30 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                    <span className="flex items-center gap-1.5 font-sans">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      الكوبون والعرض الترويجي المطبق (عقد مجمد في الحجز)
                    </span>
                    <span className="font-mono bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-emerald-300 font-black text-emerald-700">
                      {booking.appliedPromotionSnapshot.couponCode || 'PROMO'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t border-emerald-200/60 dark:border-emerald-900/60 font-sans">
                    <div>
                      <span className="text-slate-500 block text-[10px]">قيمة الخصم المقتطعة للعميل</span>
                      <span className="font-black text-emerald-700 dark:text-emerald-300">
                        -{formatCurrency(booking.appliedPromotionSnapshot.calculatedDiscountAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">سياسة عمولة المنصة المعتمدة</span>
                      <span className={`text-[10px] font-black px-1.5 py-0.5 rounded ${
                        booking.appliedPromotionSnapshot.commissionPolicy === 'CommissionOnDiscountedPrice'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {booking.appliedPromotionSnapshot.commissionPolicy === 'CommissionOnDiscountedPrice'
                          ? 'العمولة بعد الخصم (مشاركة المنصة)'
                          : 'العمولة قبل الخصم (تحمل المزود)'}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">عمولة المنصة المحسوبة</span>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        {formatCurrency(booking.appliedPromotionSnapshot.platformCommissionAmount)}
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block text-[10px]">صافي مستحق المزود بعد السياسة</span>
                      <span className="font-mono font-black text-emerald-800 dark:text-emerald-200">
                        {formatCurrency(booking.appliedPromotionSnapshot.providerEntitlementAmount)}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-indigo-100 dark:border-indigo-900/50 flex justify-between items-center bg-white/50 dark:bg-slate-900/50 p-3 rounded-xl border border-white dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-500 block">صافي استحقاق المزود</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">
                    {booking.appliedPromotionSnapshot 
                      ? formatCurrency(booking.appliedPromotionSnapshot.providerEntitlementAmount)
                      : formatCurrency(booking.amount * 0.9)}
                  </span>
                </div>
                <div className="text-left">
                  <span className="text-[10px] text-slate-500 block text-right">عمولة المنصة (شاملة الضريبة)</span>
                  <span className="font-bold text-blue-600 dark:text-indigo-400">
                    {booking.appliedPromotionSnapshot
                      ? formatCurrency(booking.appliedPromotionSnapshot.platformCommissionAmount)
                      : formatCurrency(booking.amount * 0.1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Ad Banner - أسفل تفاصيل الحجز */}
            <div className="sm:col-span-2 pt-2">
              <AdBanner 
                placement="أسفل تفاصيل الحجز" 
                layout="card" 
                className="w-full border border-slate-200/80 dark:border-slate-800 shadow-sm" 
              />
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-b-3xl flex justify-end gap-3 shrink-0 print:hidden">
          <button 
            onClick={() => onPrintInvoice(booking)} 
            className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 transition-colors flex items-center gap-2"
          >
            <FileText className="w-4 h-4"/> إصدار فاتورة
          </button>
          <button 
            onClick={onClose} 
            className="px-6 py-2.5 rounded-xl font-bold bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-850 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
