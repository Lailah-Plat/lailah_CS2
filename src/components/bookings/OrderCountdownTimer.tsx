import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface OrderCountdownTimerProps {
  createdAt?: string;
  deadlineHours?: number; // e.g. 24 or 48 hours
  onExpire?: () => void;
  className?: string;
}

export const OrderCountdownTimer: React.FC<OrderCountdownTimerProps> = ({
  createdAt,
  deadlineHours = 24,
  onExpire,
  className = ''
}) => {
  const [timeLeft, setTimeLeft] = useState<{
    hours: number;
    minutes: number;
    seconds: number;
    isExpired: boolean;
    percentage: number;
  }>({ hours: 0, minutes: 0, seconds: 0, isExpired: false, percentage: 100 });

  useEffect(() => {
    const calculateTime = () => {
      if (!createdAt) {
        // Fallback: assume order created 4 hours ago for demo
        const demoCreation = Date.now() - 4 * 60 * 60 * 1000;
        const totalDuration = deadlineHours * 60 * 60 * 1000;
        const expiryTime = demoCreation + totalDuration;
        const diff = expiryTime - Date.now();

        if (diff <= 0) {
          setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true, percentage: 0 });
          return;
        }

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        const percentage = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

        setTimeLeft({ hours, minutes, seconds, isExpired: false, percentage });
        return;
      }

      const createdTime = new Date(createdAt).getTime();
      const totalDuration = deadlineHours * 60 * 60 * 1000;
      const expiryTime = createdTime + totalDuration;
      const diff = expiryTime - Date.now();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0, isExpired: true, percentage: 0 });
        if (onExpire) onExpire();
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      const percentage = Math.max(0, Math.min(100, (diff / totalDuration) * 100));

      setTimeLeft({ hours, minutes, seconds, isExpired: false, percentage });
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [createdAt, deadlineHours, onExpire]);

  if (timeLeft.isExpired) {
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
        <span>انتهت مهلة القبول</span>
      </div>
    );
  }

  const isUrgent = timeLeft.hours < 4;

  return (
    <div
      className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-xl text-xs font-bold border transition-all ${
        isUrgent
          ? 'bg-amber-500/10 border-amber-500/30 text-amber-900 animate-pulse'
          : 'bg-indigo-50/80 border-indigo-200/80 text-indigo-900'
      } ${className}`}
      title={`المهلة المحددة للموافقة من الإدارة: ${deadlineHours} ساعة`}
    >
      <Clock className={`w-3.5 h-3.5 shrink-0 ${isUrgent ? 'text-amber-600' : 'text-indigo-600'}`} />
      <div className="flex items-center gap-1 font-mono font-black" dir="ltr">
        <span>{String(timeLeft.hours).padStart(2, '0')}</span>:
        <span>{String(timeLeft.minutes).padStart(2, '0')}</span>:
        <span>{String(timeLeft.seconds).padStart(2, '0')}</span>
      </div>
      <span className="text-[10px] font-sans font-extrabold text-slate-500">متبقية للموافقة</span>
    </div>
  );
};
