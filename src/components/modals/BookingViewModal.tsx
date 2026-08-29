import React, { useState } from 'react';
import { X, Wallet, Clock, FileText, MessageSquare, FileCheck } from 'lucide-react';
import { formatCurrency, getStatusColor } from '../../data/dashboardConstants';
import { formatBookingId } from '../../utils/idUtils';
import { AdBanner } from '../AdBanner';
import { OrderLifecycleStepper, OrderLifecycleStatus, normalizeOrderStatus } from '../bookings/OrderLifecycleStepper';
import { OrderActionBar } from '../bookings/OrderActionBar';
import { OrderChatModal } from '../bookings/OrderChatModal';
import { SettlementVoucherModal } from '../bookings/SettlementVoucherModal';
import { calculateOrderFinancials } from '../bookings/GenericOrderDetailsCard';

interface BookingViewModalProps {
  isOpen: boolean;
  booking: any;
  onClose: () => void;
  onPrintInvoice: (booking: any) => void;
  onStatusChange?: (bookingId: number | string, newStatus: string) => void;
  userRole?: string;
  hasSettlementVoucherCapability?: boolean;
}

export const BookingViewModal: React.FC<BookingViewModalProps> = ({
  isOpen,
  booking,
  onClose,
  onPrintInvoice,
  onStatusChange,
  userRole = 'admin',
  hasSettlementVoucherCapability = true
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  if (!isOpen || !booking) return null;

  const orderNum = formatBookingId(booking.id);
  const totalAmount = Number(booking.amount) || 0;
  const commissionRate = booking.commissionRate || 10;
  const financials = calculateOrderFinancials(totalAmount, commissionRate);

  const handleActionStatusChange = (nextStatus: OrderLifecycleStatus, notes?: string) => {
    if (onStatusChange) {
      onStatusChange(booking.id, nextStatus);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl relative border border-slate-100 dark:border-slate-800 overflow-hidden">
          {/* Modal Header */}
          <div className="flex justify-between items-center p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 rounded-t-3xl">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-6 bg-indigo-500 rounded-full"></span>
              <h3 className="text-xl font-bold text-slate-850 dark:text-amber-50">
                تفاصيل الحجز <span className="font-mono text-indigo-600 dark:text-indigo-400">{orderNum}</span>
              </h3>
            </div>
            <button 
              onClick={onClose} 
              className="bg-white dark:bg-slate-850 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 border border-slate-150 dark:border-slate-800 shadow-sm p-2 rounded-full transition-all duration-200 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
            
            {/* Axis 1: Interactive Status Stepper */}
            <OrderLifecycleStepper status={booking.status || 'جديد'} />

            {/* General Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">اسم القاعة/المنشأة</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{booking.hall || booking.itemName}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">نوع الحجز</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{booking.type || 'حجز قاعة ومكان'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">تاريخ الحجز</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{booking.startDate || booking.date}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">فترة الحجز</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{booking.period || 'مسائية'}</span>
              </div>
              <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <span className="text-xs text-slate-500 block mb-1">عدد الضيوف</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{booking.guests || 0} شخص</span>
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
                <span className="text-xs text-slate-500 block mb-1">حالة الدفع</span>
                <span className={`px-2 py-1 rounded-md text-[10px] font-bold border inline-block ${getStatusColor(booking.paymentStatus)}`}>
                  {booking.paymentStatus || 'غير مدفوع'}
                </span>
              </div>

              {booking.extraServices && (
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                  <span className="text-xs text-slate-500 block mb-1">الخدمات الإضافية</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{booking.extraServices}</span>
                </div>
              )}

              {booking.notes && (
                <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-xl border border-slate-100 dark:border-slate-800 sm:col-span-2">
                  <span className="text-xs text-slate-500 block mb-1">ملاحظات العميل</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{booking.notes}</span>
                </div>
              )}
              
              {/* Sovereign Transparent Financial Breakdown */}
              <div className="sm:col-span-2 bg-gradient-to-br from-indigo-50/60 to-slate-50 dark:from-slate-800/60 dark:to-slate-900 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 space-y-4">
                <div className="flex justify-between items-center border-b border-indigo-100/70 dark:border-slate-700 pb-3">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 text-sm">
                    <Wallet className="w-4 h-4" /> اللقطة والبيان المالي الشامل (15% VAT)
                  </h4>
                  <span className="text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 px-2 py-0.5 rounded-md">
                    عمولة المنصة: {financials.commissionRate}%
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">الإجمالي الشامل (15% VAT)</span>
                    <span className="text-sm font-black text-slate-900 dark:text-white">
                      {formatCurrency(financials.grossAmount)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">المبلغ الخاضع للضريبة</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(financials.taxableAmount)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 block mb-1">ضريبة القيمة المضافة 15%</span>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
                      {formatCurrency(financials.vatAmount)}
                    </span>
                  </div>

                  <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-emerald-600 block mb-1">صافي مستحق المزود</span>
                    <span className="text-sm font-black text-emerald-600">
                      {formatCurrency(financials.providerNetAmount)}
                    </span>
                  </div>
                </div>

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
                        <span className="text-slate-500 block text-[10px]">صافي مستحق المزود بعد السياسة</span>
                        <span className="font-mono font-black text-emerald-800 dark:text-emerald-200">
                          {formatCurrency(booking.appliedPromotionSnapshot.providerEntitlementAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Ad Banner */}
              <div className="sm:col-span-2 pt-2">
                <AdBanner 
                  placement="أسفل تفاصيل الحجز" 
                  layout="card" 
                  className="w-full border border-slate-200/80 dark:border-slate-800 shadow-sm" 
                />
              </div>
            </div>
          </div>

          {/* Interactive Action Bar (Axis 2) & Footer */}
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/70 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0 print:hidden">
            <div className="w-full">
              <OrderActionBar
                status={booking.status || 'جديد'}
                orderNumber={orderNum}
                orderType="hall"
                onStatusChange={handleActionStatusChange}
                onOpenChat={() => setIsChatOpen(true)}
                onPrintVoucher={() => setIsVoucherOpen(true)}
                hasSettlementVoucherCapability={hasSettlementVoucherCapability}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Order Chat Modal */}
      {isChatOpen && (
        <OrderChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          orderNumber={orderNum}
          orderType="hall"
          itemTitle={booking.hall || booking.itemName || 'القاعة'}
          customerName={booking.customer || 'العميل'}
          customerPhone={booking.phone}
          bookingDate={booking.startDate || booking.date}
          totalAmount={totalAmount}
          status={booking.status || 'جديد'}
          completedAt={booking.completedAt}
        />
      )}

      {/* Financial Settlement Voucher Modal */}
      {isVoucherOpen && (
        <SettlementVoucherModal
          isOpen={isVoucherOpen}
          onClose={() => setIsVoucherOpen(false)}
          orderNumber={orderNum}
          orderType="hall"
          itemTitle={booking.hall || booking.itemName || 'القاعة'}
          providerName={booking.provider || 'مزود الخدمة'}
          customerName={booking.customer || 'العميل'}
          bookingDate={booking.startDate || booking.date}
          totalAmount={totalAmount}
          commissionRate={commissionRate}
          status={booking.status}
        />
      )}
    </>
  );
};
