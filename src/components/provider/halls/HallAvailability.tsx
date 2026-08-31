import React, { useState } from 'react';
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Sparkles, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

interface HallAvailabilityProps {
  hallId?: string;
  hallName?: string;
  onUpdateSlot?: (date: string, period: 'morning' | 'evening', status: 'available' | 'booked' | 'blocked') => void;
}

export const HallAvailability: React.FC<HallAvailabilityProps> = ({
  hallId,
  hallName = 'القاعة الرئيسية',
  onUpdateSlot,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('أغسطس 2026');

  const days = Array.from({ length: 14 }, (_, i) => {
    const dayNum = i + 1;
    const isWeekend = i % 7 === 4 || i % 7 === 5; // Thu / Fri
    const isBookedMorning = i % 3 === 0;
    const isBookedEvening = i % 2 === 0;

    return {
      date: `2026-08-${String(dayNum).padStart(2, '0')}`,
      dayName: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'][i % 7],
      dayNum,
      isWeekend,
      morning: isBookedMorning ? 'booked' : 'available',
      evening: isBookedEvening ? 'booked' : 'available',
    };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>جدول إتاحة الفترات: {hallName}</span>
          </h3>
          <p className="text-[10px] text-slate-400">الفترات الصباحية والمسائية ومضاعفات نهاية الأسبوع</p>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-200">
          <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">{selectedMonth}</span>
        </div>
      </div>

      {/* Grid of days */}
      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2.5">
        {days.map((d, idx) => (
          <div
            key={idx}
            className={`p-3 rounded-2xl border flex flex-col justify-between space-y-2 text-center transition-all ${
              d.isWeekend
                ? 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-900'
                : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-800'
            }`}
          >
            <div>
              <span className="text-[10px] font-bold text-slate-400 block">{d.dayName}</span>
              <span className="text-sm font-black text-slate-800 dark:text-slate-100">{d.dayNum}</span>
              {d.isWeekend && (
                <span className="text-[8px] font-black text-indigo-600 block">ويكند</span>
              )}
            </div>

            <div className="space-y-1 text-[9px] font-bold">
              <div className={`p-1 rounded-lg flex items-center justify-between ${
                d.morning === 'booked' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                <span>صباح</span>
                <span>{d.morning === 'booked' ? 'محجوز' : 'متاح'}</span>
              </div>

              <div className={`p-1 rounded-lg flex items-center justify-between ${
                d.evening === 'booked' ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
              }`}>
                <span>مساء</span>
                <span>{d.evening === 'booked' ? 'محجوز' : 'متاح'}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
