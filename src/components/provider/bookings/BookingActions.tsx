import React, { useState } from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Truck, 
  CheckCircle2, 
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface BookingActionsProps {
  booking: any;
  onUpdateStatus?: (bookingId: string, newStatus: string) => void;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const BookingActions: React.FC<BookingActionsProps> = ({
  booking,
  onUpdateStatus,
  showNotification,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const currentStatus = booking.status || 'معتمد';
  const isPending = ['pending', 'PENDING_APPROVAL', 'جديد', 'انتظار', 'قيد الانتظار'].includes(currentStatus);
  const isApproved = ['approved', 'PROVIDER_ACCEPTED', 'AWAITING_PAYMENT', 'معتمد', 'معتمد - بانتظار السداد', 'بانتظار السداد'].includes(currentStatus);
  const isConfirmed = ['confirmed', 'PAID', 'مؤكد'].includes(currentStatus);

  const handleAccept = async () => {
    setLoadingAction('accept');
    try {
      const res = await fetch(`/api/bookings/${booking.id}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ actorRole: 'provider' })
      });
      const data = await res.json();
      if (res.ok) {
        if (showNotification) showNotification('success', data.message || 'تم قبول واعتماد الحجز بنجاح!');
        if (onUpdateStatus) onUpdateStatus(booking.id, data.booking?.status || 'approved');
        window.dispatchEvent(new Event('booking_updated'));
      } else {
        if (showNotification) showNotification('error', data.error || 'فشل قبول الحجز');
      }
    } catch (err: any) {
      if (showNotification) showNotification('error', err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async () => {
    setLoadingAction('reject');
    try {
      const res = await fetch(`/api/bookings/${booking.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rejectionReason: rejectReason || 'اعتذار المزود عن قبول الحجز في هذا التوقيت',
          actorRole: 'provider'
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (showNotification) showNotification('info', data.message || 'تم تسجيل الاعتذار عن الحجز بنجاح.');
        if (onUpdateStatus) onUpdateStatus(booking.id, 'rejected');
        setIsRejectModalOpen(false);
        setRejectReason('');
        window.dispatchEvent(new Event('booking_updated'));
      } else {
        if (showNotification) showNotification('error', data.error || 'فشل رفض الحجز');
      }
    } catch (err: any) {
      if (showNotification) showNotification('error', err.message || 'خطأ في الاتصال بالخادم');
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {isPending && (
        <>
          <button
            onClick={handleAccept}
            disabled={loadingAction !== null}
            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            title="الموافقة على طلب الحجز وتأكيد الجاهزية"
          >
            {loadingAction === 'accept' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
            <span>قبول واعتماد</span>
          </button>

          <button
            onClick={() => setIsRejectModalOpen(true)}
            disabled={loadingAction !== null}
            className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:text-rose-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-rose-200 dark:border-rose-800"
            title="الاعتذار عن قبول الحجز"
          >
            <X className="w-3 h-3" />
            <span>اعتذار / رفض</span>
          </button>
        </>
      )}

      {(isApproved || isConfirmed) && currentStatus !== 'جارٍ التجهيز' && currentStatus !== 'preparing' && (
        <button
          onClick={() => {
            if (onUpdateStatus) onUpdateStatus(booking.id, 'جارٍ التجهيز');
            if (showNotification) showNotification('info', `تم تحويل الحجز ${booking.id} إلى مرحلة التجهيز الميداني`);
          }}
          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
        >
          <Truck className="w-3 h-3" />
          <span>بدء التجهيز</span>
        </button>
      )}

      {(isApproved || isConfirmed || currentStatus === 'جارٍ التجهيز' || currentStatus === 'preparing') && currentStatus !== 'منجز ومكتمل' && currentStatus !== 'completed' && (
        <button
          onClick={() => {
            if (onUpdateStatus) onUpdateStatus(booking.id, 'منجز ومكتمل');
            if (showNotification) showNotification('success', `تم إنجاز الحجز ${booking.id} وتحويله للتصفية المالية`);
          }}
          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-purple-200 dark:border-purple-800"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>إنجاز الحدث</span>
        </button>
      )}

      {/* Reject Modal */}
      {isRejectModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 text-right" dir="rtl">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 w-full max-w-md shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
              <h4 className="text-sm font-black text-rose-600 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                <span>الاعتذار عن طلب الحجز</span>
              </h4>
              <button 
                onClick={() => setIsRejectModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              يرجى توضيح سبب الاعتذار للعميل (سيتم إشعار العميل وإلغاء حجز التاريخ دون فرض أي رسوم):
            </p>

            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="مثال: القاعة غير متاحة لأعمال صيانة دورية مجدولة، أو تعارض في التجهيزات اللوجستية..."
              className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-100 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              rows={3}
            />

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsRejectModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                تراجع
              </button>
              <button
                onClick={handleReject}
                disabled={loadingAction === 'reject'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl transition-all shadow-md shadow-rose-600/20 flex items-center gap-1.5"
              >
                {loadingAction === 'reject' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                <span>تأكيد الاعتذار والرفض</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
