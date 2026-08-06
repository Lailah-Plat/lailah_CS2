import React, { useState } from 'react';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { useCalendar } from '../context/CalendarContext';
import { getFullDateInfo } from '../utils/dateUtils';

interface AdminCalendarProps {
  bookings: any[];
  halls?: any[];
}

export const AdminCalendar: React.FC<AdminCalendarProps> = ({ bookings, halls = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const { calendarType } = useCalendar();

  // Generate current week dates
  const startDate = startOfWeek(currentDate, { weekStartsOn: 0 }); // Sunday
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Time slots (e.g., 8 AM to 11 PM) -> 8 to 23
  const timeSlots = Array.from({ length: 16 }, (_, i) => i + 8);

  const getBookingForSlot = (date: Date, hour: number) => {
    const formattedSlotDate = format(date, 'yyyy-MM-dd');

    // 1. Check Platform Bookings
    const foundBooking = bookings.find(b => {
      const bDate = new Date(b.startDate || b.date);
      if (!isSameDay(bDate, date)) return false;

      let startHour = 8;
      let endHour = 22;
      if (b.period === 'صباحية') {
        startHour = 8;
        endHour = 14;
      } else if (b.period === 'مسائية') {
        startHour = 16;
        endHour = 22;
      }

      return hour >= startHour && hour < endHour;
    });

    if (foundBooking) return { ...foundBooking, isExternal: false };

    // 2. Check External Blocked Dates in Halls
    for (const h of halls) {
      if (h.blockedDatesList && Array.isArray(h.blockedDatesList)) {
        const extBlock = h.blockedDatesList.find((blk: any) => 
          blk.status === 'active' && 
          formattedSlotDate >= blk.startDate && 
          formattedSlotDate <= (blk.endDate || blk.startDate)
        );

        if (extBlock) {
          let startHour = 8;
          let endHour = 22;
          if (extBlock.period === 'صباحية') {
            startHour = 8;
            endHour = 14;
          } else if (extBlock.period === 'مسائية') {
            startHour = 16;
            endHour = 22;
          }

          if (hour >= startHour && hour < endHour) {
            return {
              id: extBlock.id,
              customer: 'حجز مباشر خارجي',
              hall: extBlock.entityName,
              period: extBlock.period,
              status: extBlock.blockType === 'external_booking' ? 'حجز خارجي' : 'إغلاق صيانة',
              isExternal: true,
              blockType: extBlock.blockType,
              reason: extBlock.reason
            };
          }
        }
      }
    }

    return null;
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
      <div className="flex justify-between items-center mb-6 min-w-[800px]">
        <div>
          <h3 className="text-xl font-bold text-slate-800">تقويم الحجوزات (الإدارة)</h3>
          <p className="text-sm text-slate-500 mt-1">تتبع مواعيد الحجوزات والفترات</p>
        </div>
        <div className="flex gap-4 items-center">
          <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors">الأسبوع السابق</button>
          <div className="flex flex-col items-center">
            {calendarType === 'gregorian' ? (
              <>
                <span className="font-bold text-slate-800" dir="ltr">{format(startDate, 'yyyy-MM-dd')} / {format(addDays(startDate, 6), 'yyyy-MM-dd')}</span>
                <span className="text-xs text-amber-600 font-medium">{getFullDateInfo(startDate).hijri.full} - {getFullDateInfo(addDays(startDate, 6)).hijri.full}</span>
              </>
            ) : (
              <>
                <span className="font-bold text-amber-600 tracking-tight" dir="rtl">{getFullDateInfo(startDate).hijri.full} / {getFullDateInfo(addDays(startDate, 6)).hijri.full}</span>
                <span className="text-xs text-slate-500 font-medium" dir="ltr">{format(startDate, 'yyyy-MM-dd')} - {format(addDays(startDate, 6), 'yyyy-MM-dd')}</span>
              </>
            )}
          </div>
          <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="px-4 py-2 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium text-slate-700 transition-colors">الأسبوع القادم</button>
        </div>
      </div>

      <div className="min-w-[800px] border border-slate-200 rounded-xl overflow-hidden">
        {/* Header (Days) */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <div className="w-20 border-r border-slate-200 p-3 text-center text-sm font-bold text-slate-500 shrink-0 flex items-center justify-center">
            الوقت
          </div>
          {weekDays.map(day => (
            <div key={day.toString()} className={`flex-1 border-r border-slate-200 p-3 text-center ${isSameDay(day, new Date()) ? 'bg-amber-50/50' : ''}`}>
              <div className="font-bold text-slate-800">{format(day, 'EEEE', { locale: arSA })}</div>
              {calendarType === 'gregorian' ? (
                <>
                  <div className="text-xs text-slate-500 mt-1" dir="ltr">{format(day, 'yyyy/MM/dd')}</div>
                  <div className="text-xs text-amber-600 font-medium mt-1">{getFullDateInfo(day).hijri.day} {getFullDateInfo(day).hijri.monthName}</div>
                </>
              ) : (
                <>
                  <div className="text-xs text-amber-600 font-bold mt-1">{getFullDateInfo(day).hijri.day} {getFullDateInfo(day).hijri.monthName}</div>
                  <div className="text-xs text-slate-400 mt-1" dir="ltr">{format(day, 'yyyy/MM/dd')}</div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Body (Time slots x Days) */}
        <div className="h-[500px] overflow-y-auto custom-scrollbar">
          {timeSlots.map(hour => (
            <div key={hour} className="flex border-b border-slate-100">
              <div className="w-20 border-r border-slate-200 p-2 text-center text-xs font-bold text-slate-400 shrink-0 flex items-center justify-center">
                {format(new Date().setHours(hour, 0, 0, 0), 'hh:mm a', { locale: arSA })}
              </div>
              {weekDays.map(day => {
                const booking = getBookingForSlot(day, hour);
                const isStartOfBooking = booking && (!getBookingForSlot(day, hour - 1) || getBookingForSlot(day, hour - 1)?.id !== booking.id);

                return (
                  <div key={day.toString()} className={`flex-1 border-r border-slate-100 p-1 min-h-[60px] ${booking ? (booking.isExternal ? 'bg-purple-50/40' : 'bg-amber-50/30') : 'hover:bg-slate-50'} transition-colors relative group`}>
                    {booking && isStartOfBooking && (
                      booking.isExternal ? (
                        <div className="bg-purple-900 text-purple-100 border border-purple-700 rounded-lg p-2 absolute inset-x-1 z-10 overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ minHeight: '100px' }}>
                          <div className="text-xs font-black text-amber-300 truncate mb-1 flex items-center gap-1">
                            <span>🔒 حجز خارجي (مستثنى)</span>
                          </div>
                          <div className="text-[11px] text-purple-200 truncate font-bold">القاعة: {booking.hall}</div>
                          <div className="text-[10px] text-purple-300 mt-1 flex items-center gap-1 flex-wrap">
                            <span className="bg-purple-800 px-1.5 py-0.5 rounded font-mono">{booking.period}</span>
                            <span className="bg-purple-800/80 px-1.5 py-0.5 rounded text-[9px] font-bold text-amber-200">عمولة: 0%</span>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-amber-100 border border-amber-200 rounded-lg p-2 absolute inset-x-1 z-10 overflow-hidden shadow-sm hover:shadow-md transition-shadow" style={{ minHeight: '100px' }}>
                          <div className="text-xs font-bold text-amber-800 truncate mb-1">العميل: {booking.customer}</div>
                          <div className="text-[11px] text-amber-700 truncate font-medium">القاعة: {booking.hall}</div>
                          <div className="text-[10px] text-amber-600 mt-1 flex items-center gap-1">
                            <span className="bg-amber-200/50 px-1 py-0.5 rounded">{booking.period}</span>
                            <span className="bg-amber-200/50 px-1 py-0.5 rounded text-[10px]">{booking.status}</span>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
