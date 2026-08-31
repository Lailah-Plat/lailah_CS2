import React, { useState } from 'react';

interface ProviderAvailabilityEngineProps {
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderAvailabilityEngine({ showNotification }: ProviderAvailabilityEngineProps) {
  const [availabilityWorkingHours, setAvailabilityWorkingHours] = useState('02:00 م - 02:00 ص');
  const [availabilityBlackoutDates, setAvailabilityBlackoutDates] = useState<string[]>(['2026-08-15', '2026-08-16']);
  const [availabilityCapacityLimit, setAvailabilityCapacityLimit] = useState(500);
  const [newBlackoutDate, setNewBlackoutDate] = useState('');

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">AVAILABILITY & LOCKOUT ENGINE</span>
          <h3 className="text-sm font-black text-slate-800">محرك الجدولة التلقائية وإتاحة الحجوزات</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 block">ساعات استقبال وتجهيز المناسبات (المنشأة)</label>
              <input
                type="text"
                value={availabilityWorkingHours}
                onChange={(e) => setAvailabilityWorkingHours(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-right font-bold"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 block">الحد الأقصى اليومي للمدعوين والسلامة</label>
              <input
                type="number"
                value={availabilityCapacityLimit}
                onChange={(e) => setAvailabilityCapacityLimit(parseInt(e.target.value) || 0)}
                className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-right font-mono font-bold"
              />
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <span className="text-xs font-black text-slate-800 block mb-2">أيام الصيانة الدورية المعتمدة بالنظام</span>
              <div className="space-y-2">
                {['الأحد من كل أسبوع', 'أيام الأعياد الرسمية'].map((day, i) => (
                  <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-100">
                    <span>{day}</span>
                    <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">صيانة مجدولة</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Blackout dates management */}
        <div className="pt-4 border-t border-slate-50 space-y-3">
          <h4 className="text-xs font-black text-slate-800">تواريخ الحظر والتعطيل الاستثنائي (Blackout Dates)</h4>
          <p className="text-[11px] text-slate-400">أي تاريخ يتم حظره أدناه، لن يتمكن العملاء نهائياً من تحديده في تقويم الحجز بالواجهة العامة.</p>

          <div className="flex flex-wrap gap-2">
            {availabilityBlackoutDates.map((date, index) => (
              <div key={index} className="bg-red-50 text-red-800 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2">
                <button
                  onClick={() => {
                    setAvailabilityBlackoutDates(availabilityBlackoutDates.filter((d) => d !== date));
                    showNotification('info', `تم إلغاء الحظر وتفعيل الإتاحة للتاريخ ${date}`);
                  }}
                  className="text-red-500 hover:text-red-800 font-bold"
                >
                  ✕
                </button>
                <span>{date}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl w-fit">
            <input
              type="date"
              value={newBlackoutDate}
              onChange={(e) => setNewBlackoutDate(e.target.value)}
              className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
            />
            <button
              onClick={() => {
                if (!newBlackoutDate) {
                  showNotification('warning', 'يرجى تحديد التاريخ المراد تعطيله.');
                  return;
                }
                if (availabilityBlackoutDates.includes(newBlackoutDate)) {
                  showNotification('warning', 'هذا التاريخ معطل بالفعل في النظام.');
                  return;
                }
                setAvailabilityBlackoutDates([...availabilityBlackoutDates, newBlackoutDate]);
                setNewBlackoutDate('');
                showNotification('success', 'تم تعطيل التاريخ وحظره بنجاح من تقويمات الحجز.');
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer"
            >
              تعطيل تاريخ الحجز المختار
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
