import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Play, 
  CheckCheck, 
  RotateCcw, 
  MessageSquare, 
  Printer, 
  AlertCircle,
  FileCheck,
  Sparkles,
  Send
} from 'lucide-react';
import { OrderLifecycleStatus, normalizeOrderStatus } from './OrderLifecycleStepper';

interface OrderActionBarProps {
  status: string;
  orderNumber: string;
  orderType: 'hall' | 'service';
  onStatusChange: (nextStatus: OrderLifecycleStatus, notes?: string) => void;
  onOpenChat?: () => void;
  onPrintVoucher?: () => void;
  hasSettlementVoucherCapability?: boolean; // حسب باقة الاشتراك
}

export const OrderActionBar: React.FC<OrderActionBarProps> = ({
  status,
  orderNumber,
  orderType,
  onStatusChange,
  onOpenChat,
  onPrintVoucher,
  hasSettlementVoucherCapability = true
}) => {
  const normStatus = normalizeOrderStatus(status);
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);

  const handleAction = async (nextStatus: OrderLifecycleStatus) => {
    setIsActionLoading(true);
    try {
      await onStatusChange(nextStatus);
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) return;
    setIsActionLoading(true);
    try {
      await onStatusChange('rejected', rejectReason);
      setIsRejecting(false);
      setRejectReason('');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 sm:p-5 rounded-2xl border-t sm:border border-slate-200 dark:border-slate-800 shadow-xl" dir="rtl">
      {isRejecting ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>تأكيد رفض الطلب ({orderNumber})</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="اكتب سبب الرفض للعميل (مثال: عدم توفر القاعة بهذا اليوم)..."
              className="flex-1 px-3.5 py-2 text-sm rounded-xl border border-rose-300 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/20 text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="button"
              onClick={handleConfirmReject}
              disabled={!rejectReason.trim() || isActionLoading}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer"
            >
              تأكيد الرفض
            </button>
            <button
              type="button"
              onClick={() => setIsRejecting(false)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              تراجع
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left Actions: Chat & Print Voucher */}
          <div className="flex items-center gap-2">
            {onOpenChat && (
              <button
                type="button"
                onClick={onOpenChat}
                className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-indigo-600" />
                <span>شات الطلب</span>
              </button>
            )}

            {normStatus === 'completed' && hasSettlementVoucherCapability && onPrintVoucher && (
              <button
                type="button"
                onClick={onPrintVoucher}
                className="px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200 dark:border-indigo-800"
              >
                <FileCheck className="w-4 h-4 text-indigo-600" />
                <span>إشعار التسوية المالية</span>
              </button>
            )}
          </div>

          {/* Right Main Workflow Action Buttons */}
          <div className="flex items-center gap-2">
            {/* 1. Pending -> Accept or Reject */}
            {normStatus === 'pending' && (
              <>
                <button
                  type="button"
                  onClick={() => setIsRejecting(true)}
                  disabled={isActionLoading}
                  className="px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 border border-rose-200 dark:border-rose-900 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                  <span>رفض الطلب</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleAction('approved')}
                  disabled={isActionLoading}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>قبول واعتماد الطلب</span>
                </button>
              </>
            )}

            {/* 2. Approved -> Waiting for customer payment */}
            {normStatus === 'approved' && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-sky-700 dark:text-sky-300 font-bold bg-sky-50 dark:bg-sky-950/50 px-3 py-2 rounded-xl border border-sky-200 dark:border-sky-800">
                  تم قبول الطلب وبانتظار سداد العميل لتأكيده
                </span>
                <button
                  type="button"
                  onClick={() => handleAction('confirmed')}
                  disabled={isActionLoading}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                  title="تأكيد الدفع واستلام القيمة"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>تأكيد استلام الدفعة</span>
                </button>
              </div>
            )}

            {/* 3. Confirmed -> Start Preparing */}
            {normStatus === 'confirmed' && (
              <button
                type="button"
                onClick={() => handleAction('preparing')}
                disabled={isActionLoading}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-purple-600/20 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>بدء تجهيز وتحضير القاعة / الخدمة</span>
              </button>
            )}

            {/* 4. Preparing -> Start In-Progress */}
            {normStatus === 'preparing' && (
              <button
                type="button"
                onClick={() => handleAction('in_progress')}
                disabled={isActionLoading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                <Play className="w-4 h-4" />
                <span>بدء التنفيذ والفعالية</span>
              </button>
            )}

            {/* 5. In-Progress -> Complete */}
            {normStatus === 'in_progress' && (
              <button
                type="button"
                onClick={() => handleAction('completed')}
                disabled={isActionLoading}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>تأكيد اكتمال وإنجاز المناسبة</span>
              </button>
            )}

            {/* 6. Completed or Rejected / Cancelled */}
            {(normStatus === 'completed' || normStatus === 'rejected' || normStatus === 'cancelled') && (
              <div className="text-xs font-bold text-slate-500 px-3 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl">
                {normStatus === 'completed' ? 'الطلب مكتمل ومنجز ومغلق' : 'الطلب منتهي ومؤرشف'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
