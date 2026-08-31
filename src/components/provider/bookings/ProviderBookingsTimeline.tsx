import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/helpers';

interface ProviderBookingsTimelineProps {
  myBookings: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderBookingsTimeline({
  myBookings,
  showNotification,
}: ProviderBookingsTimelineProps) {
  const [selectedBkgIdForTimeline, setSelectedBkgIdForTimeline] = useState<string>('');

  const STEPS = [
    { key: 'draft', label: '١. مسودة' },
    { key: 'pending_payment', label: '٢. دفع معلق' },
    { key: 'confirmed', label: '٣. معتمد' },
    { key: 'preparing', label: '٤. تجهيز' },
    { key: 'completed', label: '٥. منجز' },
    { key: 'settled', label: '٦. مصفي' },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">TIMELINE BOOKING TRACKER</span>
          <h3 className="text-sm font-black text-slate-800">لوحة تتبع دورة حياة الحجوزات (الجدول الزمني التفاعلي)</h3>
        </div>

        <p className="text-xs text-slate-500">
          انقر على أي حجز أدناه لتغيير حالته اللوجستية الفورية وتتبع مؤشر التقدم التفاعلي (Timeline) لمراحل حجز قاعات الأفراح.
        </p>

        <div className="space-y-4">
          {myBookings.map((b) => {
            const isExpanded = selectedBkgIdForTimeline === b.id;
            const currentStatus = b.status || b.paymentStatus || 'مؤكد';
            return (
              <div key={b.id} className="border border-slate-100 rounded-2xl p-4 space-y-3 hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => setSelectedBkgIdForTimeline(isExpanded ? '' : b.id)}>
                  <div className="text-left">
                    <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded font-mono block mb-1">
                      {b.id && b.id.startsWith('BKG-') ? b.id : `BKG-26-${String(b.id || b.index || 1).replace(/\D/g, '').padStart(10, '0')}`}
                    </span>
                    <span className="text-xs font-mono font-black text-indigo-600 block">{formatCurrency(b.amount || b.price)}</span>
                  </div>
                  <div className="text-right">
                    <h4 className="text-xs font-black text-slate-800">حجز القاعة للعميل: {b.customer || b.customerName || 'عميل منصة ليلة'}</h4>
                    <span className="text-[10px] text-slate-400 block mt-0.5">التاريخ المستهدف: {b.date} | قاعة: {b.hall}</span>
                  </div>
                </div>

                {/* Timeline Stepper */}
                <div className="grid grid-cols-6 gap-1 pt-3 text-center border-t border-slate-50 text-[9px] font-black">
                  {STEPS.map((step, i) => {
                    const isActive = currentStatus.toLowerCase().includes(step.key) || (step.key === 'confirmed' && currentStatus === 'مؤكد');
                    return (
                      <div key={i} className={`p-1.5 rounded-lg border ${isActive ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {step.label}
                      </div>
                    );
                  })}
                </div>

                {isExpanded && (
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3 mt-2 animate-fadeIn">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-500">تحديث الحالة اللوجستية يدوياً:</span>
                      <select
                        value={currentStatus}
                        onChange={(e) => {
                          const newStatus = e.target.value;
                          b.status = newStatus;
                          b.paymentStatus = newStatus === 'مؤكد' ? 'مدفوع' : newStatus;
                          showNotification('success', `تم تحديث حالة الحجز رقم ${b.id || 'المختار'} بنجاح إلى: ${newStatus}`);
                          setSelectedBkgIdForTimeline('');
                        }}
                        className="p-1.5 border border-slate-200 bg-white rounded-lg text-[11px]"
                      >
                        <option value="draft">١. مسودة (Draft)</option>
                        <option value="pending_payment">٢. دفع معلق (Pending Payment)</option>
                        <option value="مؤكد">٣. معتمد ومؤكد (Confirmed)</option>
                        <option value="preparing">٤. قيد التجهيز اللوجستي (Preparing)</option>
                        <option value="completed">٥. منتهي ومكتمل الحفل (Completed)</option>
                        <option value="settled">٦. تمت تصفية الأرباح (Settled)</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
