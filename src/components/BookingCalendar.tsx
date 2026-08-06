import React, { useState, useEffect, useRef } from 'react';
import { format, startOfWeek, addDays, getHours, startOfDay, addHours, isBefore, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, endOfWeek, subMonths, addMonths } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { getFullDateInfo, CalendarType } from '../utils/dateUtils';
import { useCalendar } from '../context/CalendarContext';
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, Move, AlertTriangle, CheckCircle, Smartphone } from 'lucide-react';

interface BookingCalendarProps {
  hallId: number;
}

export const BookingCalendar: React.FC<BookingCalendarProps> = ({ hallId }) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { calendarType, setCalendarType } = useCalendar();
  const [bookings, setBookings] = useState<{startTime: string, endTime: string}[]>([]);
  const [loading, setLoading] = useState(false);

  // States for interactive planned booking
  const [plannedStart, setPlannedStart] = useState<number>(14); // 2:00 PM (14.0)
  const [plannedEnd, setPlannedEnd] = useState<number>(18);     // 6:00 PM (18.0)
  const [dragMode, setDragMode] = useState<'start' | 'end' | 'move' | null>(null);
  const [dragStartX, setDragStartX] = useState<number>(0);
  const [dragStartHours, setDragStartHours] = useState<{ start: number; end: number }>({ start: 14, end: 18 });
  const timelineRef = useRef<HTMLDivElement>(null);

  // Time slots from 8 AM to 11 PM (for static overview reference)
  const timeSlots = Array.from({ length: 16 }, (_, i) => addHours(startOfDay(selectedDate), i + 8));

  useEffect(() => {
    fetchAvailability(selectedDate);
  }, [selectedDate, hallId]);

  const fetchAvailability = async (date: Date) => {
    setLoading(true);
    try {
      const formattedDate = format(date, 'yyyy-MM-dd');
      const res = await fetch(`/api/bookings/availability?hallId=${hallId}&date=${formattedDate}`);
      const data = await res.json();
      setBookings(data.bookings || []);
    } catch (err) {
      console.error("Failed to load bookings in calendar:", err);
    } finally {
      setLoading(false);
    }
  };

  // Convert loaded bookings to float-hour ranges from 8:00 to 23:00
  const dayBookings = bookings.map(b => {
    const sDate = new Date(b.startTime);
    const eDate = new Date(b.endTime);
    
    // Calculate fractional hours of the day
    const sHour = Math.max(8, Math.min(23, sDate.getHours() + sDate.getMinutes() / 60));
    const eHour = Math.max(8, Math.min(23, eDate.getHours() + eDate.getMinutes() / 60));
    
    return {
      startTimeStr: format(sDate, 'hh:mm a', { locale: arSA }),
      endTimeStr: format(eDate, 'hh:mm a', { locale: arSA }),
      startHour: sHour,
      endHour: eHour,
    };
  });

  // Calculate conflict
  const hasConflict = dayBookings.some(b => {
    // Condition of overlap: plannedStart < b.endHour && plannedEnd > b.startHour
    return plannedStart < b.endHour && plannedEnd > b.startHour;
  });

  const syncTentativeBooking = () => {
    const formattedDate = format(selectedDate, 'yyyy-MM-dd');
    const startStr = formatTimeFromFloat(plannedStart);
    const endStr = formatTimeFromFloat(plannedEnd);
    
    const data = {
      date: formattedDate,
      startTime: `${startStr}:00`,
      endTime: `${endStr}:00`,
      startFloat: plannedStart,
      endFloat: plannedEnd,
      hasConflict
    };
    
    localStorage.setItem('TENTATIVE_RESV', JSON.stringify(data));
    window.dispatchEvent(new Event('tentativeBookingChanged'));
  };

  // Trigger synchronize on change of date, hours or conflict state
  useEffect(() => {
    syncTentativeBooking();
  }, [selectedDate, plannedStart, plannedEnd, hasConflict, hallId]);

  const formatTimeFromFloat = (v: number) => {
    const hours = Math.floor(v);
    const mins = Math.round((v - hours) * 60);
    const hh = String(hours).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const formatAmPm = (v: number) => {
    const hours = Math.floor(v);
    const mins = Math.round((v - hours) * 60);
    const ampm = hours >= 12 ? 'م' : 'ص';
    const displayHour = hours % 12 === 0 ? 12 : hours % 12;
    const mmStr = String(mins).padStart(2, '0');
    return `${displayHour}:${mmStr} ${ampm}`;
  };

  // Pointer event handlers for modular move/resize of selected duration
  const handlePointerDown = (mode: 'start' | 'end' | 'move', e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragMode(mode);
    setDragStartX(e.clientX);
    setDragStartHours({ start: plannedStart, end: plannedEnd });
    
    if (e.currentTarget) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragMode || !timelineRef.current) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    
    // Total hours display interval is 15 hours: from 8:00 to 23:00
    const hoursPerPixel = 15 / rect.width;
    const deltaHours = deltaX * hoursPerPixel;
    
    let newStart = dragStartHours.start;
    let newEnd = dragStartHours.end;
    const minHour = 8;
    const maxHour = 23;
    const snapTo = 0.5; // step by 30 minutes for robust UX
    
    if (dragMode === 'start') {
      newStart = dragStartHours.start + deltaHours;
      newStart = Math.max(minHour, Math.min(plannedEnd - 0.5, newStart));
      newStart = Math.round(newStart / snapTo) * snapTo;
    } else if (dragMode === 'end') {
      newEnd = dragStartHours.end + deltaHours;
      newEnd = Math.max(plannedStart + 0.5, Math.min(maxHour, newEnd));
      newEnd = Math.round(newEnd / snapTo) * snapTo;
    } else if (dragMode === 'move') {
      const duration = dragStartHours.end - dragStartHours.start;
      let targetStart = dragStartHours.start + deltaHours;
      targetStart = Math.max(minHour, Math.min(maxHour - duration, targetStart));
      targetStart = Math.round(targetStart / snapTo) * snapTo;
      
      newStart = targetStart;
      newEnd = targetStart + duration;
    }
    
    setPlannedStart(newStart);
    setPlannedEnd(newEnd);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (e.currentTarget) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
    }
    setDragMode(null);
    syncTentativeBooking();
  };

  const isSlotBooked = (slotStart: Date) => {
    const slotEnd = addHours(slotStart, 1);
    return bookings.some(b => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return (slotStart < bEnd && slotEnd > bStart);
    });
  };

  const isPast = (slotStart: Date) => {
    return isBefore(slotStart, new Date());
  };

  const getDayName = (date: Date) => {
    return format(date, 'EEEE', { locale: arSA });
  };

  const dateInfo = getFullDateInfo(selectedDate);

  // Position attributes for Active Booking Card
  const activeLeft = ((plannedStart - 8) / 15) * 100;
  const activeWidth = ((plannedEnd - plannedStart) / 15) * 100;

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold text-slate-800">التقويم الذكي للتوافر</h3>
          <p className="text-sm text-slate-500 mt-1">عرض الأوقات المتاحة وتحديد مدة الحجز بالسحب والإفلات التفاعلي</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 gap-1 self-start">
          <button 
            type="button"
            onClick={() => setCalendarType('gregorian')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${calendarType === 'gregorian' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            ميلادي
          </button>
          <button 
            type="button"
            onClick={() => setCalendarType('hijri')}
            className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${calendarType === 'hijri' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-200'}`}
          >
            هجري
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Date Selection Grid */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
          <div className="flex justify-between items-center mb-4 px-2">
            <button type="button" onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="p-2 hover:bg-white rounded-xl border border-slate-200 bg-white shadow-sm transition-all">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
            <div className="text-center">
              <div className="font-extrabold text-blue-950 text-lg">
                {calendarType === 'gregorian' 
                  ? format(currentMonth, 'MMMM yyyy', { locale: arSA })
                  : getFullDateInfo(currentMonth).hijri.monthName + ' ' + getFullDateInfo(currentMonth).hijri.year
                }
              </div>
            </div>
            <button type="button" onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="p-2 hover:bg-white rounded-xl border border-slate-200 bg-white shadow-sm transition-all">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-[12px] mb-3">
            {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map(d => <div key={d} className="text-slate-400 font-bold py-2">{d}</div>)}
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-sm" key={calendarType}>
            {(() => {
              const start = startOfWeek(startOfMonth(currentMonth));
              const end = endOfWeek(endOfMonth(currentMonth));
              const days = eachDayOfInterval({ start, end });
              
              return days.map((day, idx) => {
                const isSelected = isSameDay(day, selectedDate);
                const isToday = isSameDay(day, new Date());
                const dInfo = getFullDateInfo(day);
                const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                const past = isBefore(startOfDay(day), startOfDay(new Date()));

                return (
                  <button 
                    type="button"
                    key={idx} 
                    onClick={() => setSelectedDate(day)}
                    disabled={past}
                    className={`relative py-3 rounded-xl flex flex-col items-center justify-center transition-all aspect-square border
                      ${isSelected ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30 border-amber-700 scale-105 z-10' : 
                        past ? 'bg-slate-100 text-slate-300 border-slate-100 cursor-not-allowed opacity-50' :
                        !isCurrentMonth ? 'text-slate-300 border-transparent opacity-40' :
                        isToday ? 'bg-blue-50 text-blue-700 border-blue-200 font-bold' :
                        'bg-white text-slate-700 border-slate-100 shadow-sm hover:border-amber-400 hover:bg-amber-50'}`}
                  >
                    {calendarType === 'gregorian' ? (
                      <>
                        <span className="text-lg font-extrabold leading-none">{dInfo.gregorian.day}</span>
                        <span className="text-[11px] mt-1.5 opacity-80 font-bold">{dInfo.hijri.day}</span>
                      </>
                    ) : (
                      <>
                        <span className="text-lg font-extrabold leading-none">{dInfo.hijri.day}</span>
                        <span className="text-[11px] mt-1.5 opacity-80 font-bold">{dInfo.gregorian.day}</span>
                      </>
                    )}
                  </button>
                );
              });
            })()}
          </div>
        </div>

        {/* Selected Day Availability & Resizable Timeline */}
        <div className="flex flex-col">
          <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 mb-4 font-sans">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-500 rounded-lg text-white">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div>
                <div className="text-amber-900 font-extrabold text-base">
                  {getDayName(selectedDate)}
                </div>
                <div className="flex items-center gap-4 text-xs text-amber-700/80 font-medium mt-0.5">
                  <span className="flex items-center gap-1">
                    <span className="opacity-60">ميلادي:</span> {format(selectedDate, 'd MMMM yyyy', { locale: arSA })}
                  </span>
                  <span className="w-px h-3 bg-amber-200"></span>
                  <span className="flex items-center gap-1">
                    <span className="opacity-60">هجري:</span> {dateInfo.hijri.full}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Drag-and-Resize Timeline Component */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-4 font-sans">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-extrabold text-slate-700 flex items-center gap-1">
                <span>مخطط السحب والإفلات وتعديل المدة الزمني:</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Smartphone className="w-3 h-3" /> اسحب لتغيير الحجز
                </span>
              </h4>
              <span className="text-xs text-slate-500 font-bold">8:00 ص - 11:00 م</span>
            </div>

            {/* Visual Conflict Banner */}
            {hasConflict ? (
              <div className="mb-3 flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600 animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>⚠️ تنبيه بالتعارض: المدة المحددة تتداخل مع حجز حالي للقاعة!</span>
              </div>
            ) : (
              <div className="mb-3 flex items-center gap-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-600">
                <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>الوقت المختار متاح تماماً ومطابق للجدول الخالي من التعارض.</span>
              </div>
            )}

            {/* Timeline Container */}
            <div 
              ref={timelineRef}
              className="relative h-24 bg-slate-200 rounded-xl border border-slate-300 select-none overflow-hidden"
              style={{ touchAction: 'none' }}
            >
              {/* Hour vertical gridlines */}
              {Array.from({ length: 16 }).map((_, i) => {
                const hour = 8 + i;
                const leftPos = (i / 15) * 100;
                return (
                  <div key={i} className="absolute top-0 bottom-0 border-r border-slate-300/60 z-0 flex flex-col justify-end pb-1" style={{ left: `${leftPos}%` }}>
                    <span className="text-[8px] font-bold text-slate-400 rotate-45 origin-left">{hour}:00</span>
                  </div>
                );
              })}

              {/* Draw Existing Bookings */}
              {dayBookings.map((b, idx) => {
                const left = ((b.startHour - 8) / 15) * 100;
                const width = ((b.endHour - b.startHour) / 15) * 100;
                return (
                  <div 
                    key={idx}
                    className="absolute top-0 bottom-6 bg-red-100 border-l border-r border-red-300/80 z-10 flex items-center justify-center overflow-hidden pointer-events-none"
                    style={{ left: `${left}%`, width: `${width}%`, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(239, 68, 68, 0.1) 10px, rgba(239, 68, 68, 0.1) 20px)' }}
                  >
                    <span className="text-[10px] font-bold text-red-700 bg-white/80 px-1 py-0.5 rounded shadow-sm scale-90">
                      محجوز (من {b.startTimeStr} إلى {b.endTimeStr})
                    </span>
                  </div>
                );
              })}

              {/* Draw User Drag-and-Resizable Tentative Booking Block */}
              <div 
                className={`absolute top-2 bottom-8 rounded-lg z-20 shadow-lg flex items-center justify-between transition-shadow
                  ${hasConflict ? 'bg-red-500 text-white shadow-red-500/40 ring-2 ring-red-400 ring-offset-1 pulse-warning-custom' : 'bg-amber-500 text-slate-950 shadow-amber-500/30'}`}
                style={{ left: `${activeLeft}%`, width: `${activeWidth}%` }}
              >
                {/* Left/Start resize handle */}
                <div 
                  onPointerDown={(e) => handlePointerDown('start', e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-3.5 h-full bg-slate-800/20 hover:bg-slate-800/40 cursor-ew-resize rounded-l-lg flex items-center justify-center shrink-0"
                >
                  <div className="w-1 h-4 bg-white/70 rounded-full"></div>
                </div>

                {/* Center Move Block */}
                <div 
                  onPointerDown={(e) => handlePointerDown('move', e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="flex-grow h-full flex items-center justify-center gap-1.5 cursor-move px-1 overflow-hidden"
                >
                  <Move className="w-3 h-3 text-current shrink-0 opacity-80" />
                  <span className="text-[10px] font-extrabold truncate select-none">
                    بدء: {formatAmPm(plannedStart)} | نهاية: {formatAmPm(plannedEnd)}
                  </span>
                </div>

                {/* Right/End resize handle */}
                <div 
                  onPointerDown={(e) => handlePointerDown('end', e)}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  className="w-3.5 h-full bg-slate-800/20 hover:bg-slate-800/40 cursor-ew-resize rounded-r-lg flex items-center justify-center shrink-0"
                >
                  <div className="w-1 h-4 bg-white/70 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Timeline controls help and custom sync action */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-2.5 rounded-xl border border-slate-100">
              <div className="text-xs text-slate-500 font-bold">
                أوقات الحجز المحددة: <span className="text-amber-600 font-extrabold">{formatAmPm(plannedStart)}</span> إلى <span className="text-amber-600 font-extrabold">{formatAmPm(plannedEnd)}</span>
                <span className="mx-2 bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-black">مدة {plannedEnd - plannedStart} ساعات</span>
              </div>
              <button 
                type="button"
                onClick={() => {
                  syncTentativeBooking();
                  // Dispatch visual notification in page context
                  const event = new CustomEvent('showSystemNotification', { 
                    detail: { type: 'success', message: 'تم حفظ وتنسيق تفاصيل الموعد والمدة وإرسالها لنموذج الحجز بنجاح' } 
                  });
                  window.dispatchEvent(event);
                }}
                className="px-3 py-1.5 bg-slate-900 hover:bg-amber-500 hover:text-slate-950 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5"
              >
                <span>مزامنة وتطبيق على نموذج الحجز</span>
              </button>
            </div>
          </div>

          <div className="flex-grow flex flex-col">
            <div className="flex items-center justify-between mb-3 px-1">
              <h4 className="font-bold text-xs text-slate-500">تفاصيل فترات الساعات (العرض القياسي):</h4>
            </div>

            {loading ? (
              <div className="flex-grow flex flex-col items-center justify-center py-6 bg-white rounded-2xl border border-slate-100 italic text-slate-400">
                <div className="w-8 h-8 border-4 border-slate-100 border-t-amber-500 rounded-full animate-spin mb-2 font-sans"></div>
                جاري استدعاء فترات الحجز...
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {timeSlots.map((slot, i) => {
                  const booked = isSlotBooked(slot);
                  const pastSlot = isPast(slot);
                  const sHour = slot.getHours();
                  const isWithinSelection = sHour >= plannedStart && sHour < plannedEnd;
                  
                  let slotClass = 'bg-white text-emerald-700 border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 cursor-pointer shadow-sm';
                  
                  if (booked) {
                    slotClass = 'bg-red-50 text-red-500 border-red-200 cursor-not-allowed opacity-75';
                  } else if (pastSlot) {
                    slotClass = 'bg-slate-50 text-slate-400 border-slate-200 cursor-not-allowed opacity-60';
                  } else if (isWithinSelection) {
                    slotClass = hasConflict 
                      ? 'bg-red-100 text-red-800 border-red-400 font-extrabold ring-1 ring-red-300' 
                      : 'bg-amber-100 text-amber-900 border-amber-400 font-extrabold ring-1 ring-amber-300';
                  }
                  
                  return (
                    <div 
                      key={i} 
                      onClick={() => {
                        if (!booked && !pastSlot) {
                          // Standard slot click sets a default 2 hours starting at clicked slot
                          const clickedHour = slot.getHours();
                          setPlannedStart(clickedHour);
                          setPlannedEnd(Math.min(23, clickedHour + 2));
                        }
                      }}
                      className={`p-2.5 rounded-xl border text-center transition-all duration-200 group ${slotClass}`}
                    >
                      <div className="font-extrabold text-sm mb-0.5">{format(slot, 'hh:mm', { locale: arSA })}</div>
                      <div className="text-[10px] font-bold opacity-60 mb-1.5">{format(slot, 'a', { locale: arSA })}</div>
                      <div className={`text-[9px] font-bold py-0.5 px-2 rounded-full inline-block 
                        ${booked ? 'bg-red-100 text-red-700' : 
                          pastSlot ? 'bg-slate-100 text-slate-500' : 
                          isWithinSelection ? (hasConflict ? 'bg-red-200 text-red-800' : 'bg-amber-200 text-amber-900') : 
                          'bg-emerald-100 text-emerald-700'}`}>
                        {booked ? 'محجوز' : pastSlot ? 'منتهي' : isWithinSelection ? 'محدد حالياً' : 'متاح'}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap gap-4 text-[10px] font-bold uppercase tracking-wider">
              <div className="flex gap-1.5 items-center"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/20"></span> <span className="text-slate-500">متاح</span></div>
              <div className="flex gap-1.5 items-center"><span className="w-2.5 h-2.5 rounded-full bg-red-400 shadow-sm shadow-red-500/20"></span> <span className="text-slate-500">محجوز</span></div>
              <div className="flex gap-1.5 items-center"><span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span> <span className="text-slate-500">محدد للسحب والتطبيق</span></div>
              <div className="flex gap-1.5 items-center"><span className="w-2.5 h-2.5 rounded-full bg-slate-300"></span> <span className="text-slate-500">وقت منتهي</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
