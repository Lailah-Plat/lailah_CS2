import React from 'react';
import { 
  Check, 
  X, 
  Clock, 
  Truck, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';

interface BookingActionsProps {
  booking: any;
  onUpdateStatus: (bookingId: string, newStatus: string) => void;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const BookingActions: React.FC<BookingActionsProps> = ({
  booking,
  onUpdateStatus,
  showNotification,
}) => {
  const currentStatus = booking.status || 'معتمد';

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      {currentStatus !== 'مؤكد' && currentStatus !== 'معتمد' && (
        <button
          onClick={() => {
            onUpdateStatus(booking.id, 'معتمد');
            if (showNotification) showNotification('success', `تم اعتماد الحجز ${booking.id} بنجاح`);
          }}
          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-emerald-200 dark:border-emerald-800"
        >
          <Check className="w-3 h-3" />
          <span>اعتماد الحجز</span>
        </button>
      )}

      {currentStatus !== 'جارٍ التجهيز' && (
        <button
          onClick={() => {
            onUpdateStatus(booking.id, 'جارٍ التجهيز');
            if (showNotification) showNotification('info', `تم تحويل الحجز ${booking.id} إلى مرحلة التجهيز الميداني`);
          }}
          className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-indigo-200 dark:border-indigo-800"
        >
          <Truck className="w-3 h-3" />
          <span>بدء التجهيز</span>
        </button>
      )}

      {currentStatus !== 'منجز ومكتمل' && (
        <button
          onClick={() => {
            onUpdateStatus(booking.id, 'منجز ومكتمل');
            if (showNotification) showNotification('success', `تم إنجاز الحجز ${booking.id} وتحويله للتصفية المالية`);
          }}
          className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer border border-purple-200 dark:border-purple-800"
        >
          <CheckCircle2 className="w-3 h-3" />
          <span>إنجاز الحدث</span>
        </button>
      )}
    </div>
  );
};
