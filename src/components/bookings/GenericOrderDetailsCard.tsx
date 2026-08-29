import React from 'react';
import { 
  Building2, 
  Sparkles, 
  Calendar, 
  Clock, 
  User, 
  Phone, 
  MessageSquare, 
  DollarSign, 
  ShieldCheck, 
  FileText,
  AlertCircle
} from 'lucide-react';
import { OrderLifecycleStepper, OrderLifecycleStatus, normalizeOrderStatus } from './OrderLifecycleStepper';
import { OrderCountdownTimer } from './OrderCountdownTimer';

export interface OrderItemFinancials {
  grossAmount: number; // المبلغ الإجمالي شامل 15% VAT
  taxableAmount: number; // المبلغ الخاضع للضريبة = gross / 1.15
  vatAmount: number; // قيمة الضريبة 15%
  commissionRate: number; // نسبة عمولة المنصة % حسب الباقة
  commissionAmount: number; // مبلغ العمولة المستقطع
  providerNetAmount: number; // صافي مستحقات المزود
}

export const calculateOrderFinancials = (
  totalAmount: number, 
  commissionPercentage: number = 10
): OrderItemFinancials => {
  const grossAmount = Math.max(0, Number(totalAmount) || 0);
  const taxableAmount = Math.round((grossAmount / 1.15) * 100) / 100;
  const vatAmount = Math.round((grossAmount - taxableAmount) * 100) / 100;
  const commissionRate = commissionPercentage;
  const commissionAmount = Math.round(((taxableAmount * commissionRate) / 100) * 100) / 100;
  const providerNetAmount = Math.round((grossAmount - commissionAmount) * 100) / 100;

  return {
    grossAmount,
    taxableAmount,
    vatAmount,
    commissionRate,
    commissionAmount,
    providerNetAmount
  };
};

export interface GenericOrderDetailsProps {
  orderType: 'hall' | 'service';
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  itemTitle: string; // اسم القاعة أو اسم الخدمة
  categoryOrHallType?: string;
  bookingDate?: string;
  periodOrTime?: string;
  guestsCount?: number;
  notes?: string;
  extraServices?: string;
  status: string;
  createdAt?: string;
  totalAmount: number;
  commissionRate?: number;
  subscriptionTier?: string; // الباقة الأساسية / المتقدمة / الاحترافية
  onOpenChat?: () => void;
  onStatusChange?: (nextStatus: OrderLifecycleStatus) => void;
}

export const GenericOrderDetailsCard: React.FC<GenericOrderDetailsProps> = ({
  orderType,
  orderNumber,
  customerName,
  customerPhone,
  itemTitle,
  categoryOrHallType,
  bookingDate,
  periodOrTime,
  guestsCount,
  notes,
  extraServices,
  status,
  createdAt,
  totalAmount,
  commissionRate = 10,
  subscriptionTier = 'باقة احترافية (العمولة 10%)',
  onOpenChat,
  onStatusChange
}) => {
  const financials = calculateOrderFinancials(totalAmount, commissionRate);
  const normStatus = normalizeOrderStatus(status);

  return (
    <div className="space-y-6" dir="rtl">
      {/* 1. Top Header Info & Stepper */}
      <div className="bg-slate-50 dark:bg-slate-800/40 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 shadow-2xs">
              {orderNumber}
            </span>
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md ${orderType === 'hall' ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>
              {orderType === 'hall' ? 'حجز قاعة ومكان' : 'طلب خدمة مساندة'}
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
            {orderType === 'hall' ? <Building2 className="w-5 h-5 text-amber-600" /> : <Sparkles className="w-5 h-5 text-indigo-600" />}
            {itemTitle}
          </h3>
        </div>

        {/* Countdown Timer for pending */}
        {normStatus === 'pending' && (
          <OrderCountdownTimer createdAt={createdAt} deadlineHours={24} />
        )}
      </div>

      {/* 2. Interactive Stepper Bar */}
      <OrderLifecycleStepper status={status} />

      {/* 3. Customer & Booking Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Customer Box */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <User className="w-4 h-4 text-slate-500" />
              بيانات العميل صاحب الطلب
            </span>
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                محادثة فورية
              </button>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">اسم العميل:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{customerName || 'عميل مسجل'}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">رقم الجوال:</span>
              <span className="font-mono font-bold text-slate-800 dark:text-slate-200" dir="ltr">{customerPhone || '05XXXXXXXX'}</span>
            </div>
          </div>
        </div>

        {/* Schedule & Event Details Box */}
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-500" />
              تفاصيل التوقيت والمناسبة
            </span>
            {categoryOrHallType && (
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                {categoryOrHallType}
              </span>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-medium">تاريخ المناسبة:</span>
              <span className="font-bold text-slate-800 dark:text-slate-200">{bookingDate || 'غير محدد'}</span>
            </div>
            {periodOrTime && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">الفترة / التوقيت:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{periodOrTime}</span>
              </div>
            )}
            {guestsCount !== undefined && guestsCount > 0 && (
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 font-medium">عدد الضيوف المتوقع:</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{guestsCount} شخص</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Extra Services & Notes */}
      {(extraServices || notes) && (
        <div className="bg-slate-50/60 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 space-y-3">
          {extraServices && (
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">الخدمات الإضافية الملحقة:</span>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {extraServices}
              </p>
            </div>
          )}
          {notes && (
            <div>
              <span className="text-xs font-bold text-slate-500 block mb-1">ملاحظات واشتراطات العميل:</span>
              <p className="text-xs text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                {notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 5. Sovereign & Transparent Financial Breakdown */}
      <div className="bg-gradient-to-br from-indigo-50/50 to-slate-50 dark:from-slate-800/60 dark:to-slate-900 p-5 rounded-2xl border border-indigo-100 dark:border-slate-700 space-y-4">
        <div className="flex justify-between items-center border-b border-indigo-100/70 dark:border-slate-700 pb-3">
          <div className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-indigo-600" />
            <h4 className="text-sm font-black text-slate-900 dark:text-white">
              البيان واللقطة المالية المثبتة للطلب (15% VAT)
            </h4>
          </div>
          <span className="text-[11px] font-bold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 px-2 py-0.5 rounded-md">
            {subscriptionTier}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          {/* Gross Amount */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">الإجمالي الشامل (15% VAT)</span>
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {financials.grossAmount.toLocaleString('en-US')} ر.س
            </span>
          </div>

          {/* Taxable Amount */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">المبلغ الخاضع للضريبة</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {financials.taxableAmount.toLocaleString('en-US')} ر.س
            </span>
          </div>

          {/* VAT 15% */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 block mb-1">ضريبة القيمة المضافة 15%</span>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300">
              {financials.vatAmount.toLocaleString('en-US')} ر.س
            </span>
          </div>

          {/* Platform Commission */}
          <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-rose-500 block mb-1">عمولة المنصة ({financials.commissionRate}%)</span>
            <span className="text-sm font-black text-rose-600">
              -{financials.commissionAmount.toLocaleString('en-US')} ر.س
            </span>
          </div>
        </div>

        {/* Net Profit to Provider */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-3.5 rounded-xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <div>
              <span className="text-xs font-black text-emerald-900 dark:text-emerald-300 block">
                صافي مستحقات المزود المعتمدة
              </span>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400">
                يتم إيداعها بالمحفظة فور اكتمال تنفيذ المناسبة بنجاح
              </span>
            </div>
          </div>
          <div className="text-left font-black text-lg text-emerald-700 dark:text-emerald-400">
            {financials.providerNetAmount.toLocaleString('en-US')} ر.س
          </div>
        </div>
      </div>
    </div>
  );
};
