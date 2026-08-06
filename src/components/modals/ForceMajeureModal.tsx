import React from 'react';
import { X } from 'lucide-react';

interface ForceMajeureModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedBooking: any;
  forceMajeureReason: string;
  setForceMajeureReason: (reason: string) => void;
  forceMajeureDocuments: string[];
  setForceMajeureDocuments: (docs: string[]) => void;
  formatBookingId: (id: number | string) => string;
  formatCurrency: (value: number) => string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  bookings: any[];
  setBookings: (bookings: any[]) => void;
  fetchForceMajeureRequests?: () => void;
}

export const ForceMajeureModal: React.FC<ForceMajeureModalProps> = ({
  isOpen,
  onClose,
  selectedBooking,
  forceMajeureReason,
  setForceMajeureReason,
  forceMajeureDocuments,
  setForceMajeureDocuments,
  formatBookingId,
  formatCurrency,
  showNotification,
  bookings,
  setBookings,
  fetchForceMajeureRequests
}) => {
  if (!isOpen || !selectedBooking) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-xl flex flex-col shadow-2xl relative overflow-hidden" dir="rtl">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-red-50/50 rounded-t-3xl shrink-0">
          <h3 className="text-lg font-black text-red-700 flex items-center gap-2">
            <span className="w-2.5 h-6 bg-red-600 rounded-full"></span>
            تقديم طلب إلغاء طارئ (بروتوكول الظروف القاهرة)
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 p-2 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4 overflow-y-auto max-h-[70vh]">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 text-xs text-slate-600 space-y-1.5">
            <div><span className="font-bold text-slate-500">رقم الحجز:</span> <span className="font-mono font-bold text-slate-800">{formatBookingId(selectedBooking.id)}</span></div>
            <div><span className="font-bold text-slate-500">العميل:</span> <span className="font-bold text-slate-800">{selectedBooking.customer || selectedBooking.customerName}</span></div>
            <div><span className="font-bold text-slate-500">تاريخ الفعالية:</span> <span className="font-bold text-slate-800">{selectedBooking.date || selectedBooking.startDate}</span></div>
            <div><span className="font-bold text-slate-500">القاعة / المنشأة:</span> <span className="font-bold text-slate-800">{selectedBooking.hall || selectedBooking.itemName}</span></div>
            <div><span className="font-bold text-slate-500">المبلغ الإجمالي الكلي:</span> <span className="font-black text-red-600">{formatCurrency(selectedBooking.amount)}</span></div>
          </div>

          <div className="space-y-1.5 animate-in fade-in duration-200">
            <div className="bg-red-50 border-r-4 border-red-600 p-3.5 rounded-xl text-red-700 text-right leading-relaxed text-xs shadow-sm font-bold">
              تنبيه: هذا الخيار يتطلب وثائق رسمية واقعية وصحيحة، وأي وثائق غير واقعية وصحيحة تعرض صاحبها للملاحقة القانونية، ولا يستخدم إلا في الظروف القاهرة حسب ما هو موضح في الشروط والأحكام.
            </div>
            <label className="block text-xs font-black text-slate-700 pt-2">توضيح أسباب القوة القاهرة أو الحالة الطارئة بالتفصيل *</label>
            <textarea
              required
              value={forceMajeureReason}
              onChange={(e) => setForceMajeureReason(e.target.value)}
              placeholder="فضلاً اذكر الأسباب الجوهرية والظروف الحتمية الطارئة لطلب الإلغاء والاستثناء..."
              className="w-full p-4 rounded-xl border border-slate-200 focus:border-red-500 outline-none min-h-[120px] text-sm"
            ></textarea>
            <p className="text-[10px] text-slate-400 leading-relaxed">بموجب المادة 4 من بروتوكول ليلة، يلتزم الشريك والمنصة بالتحقق والبت الفوري في كافة المستندات المرفقة وتوجيه الاستردادات العادلة.</p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">المستندات والوثائق الثبوتية الداعمة (اختياري)</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="رابط أو اسم المستند الداعم (مثال: تقرير_طبي_رسمي.pdf)"
                id="input-fm-doc-url"
                className="flex-1 px-4 py-2 text-xs rounded-xl border border-slate-250 outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const input = e.currentTarget as HTMLInputElement;
                    if (input.value.trim()) {
                      setForceMajeureDocuments([...forceMajeureDocuments, input.value.trim()]);
                      input.value = '';
                    }
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  const input = document.getElementById('input-fm-doc-url') as HTMLInputElement;
                  if (input && input.value.trim()) {
                    setForceMajeureDocuments([...forceMajeureDocuments, input.value.trim()]);
                    input.value = '';
                  }
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl text-xs font-bold cursor-pointer"
              >
                إرفاق
              </button>
            </div>
            {forceMajeureDocuments.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {forceMajeureDocuments.map((doc, idx) => (
                  <span key={idx} className="bg-red-50 border border-red-200 text-red-700 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                    <span>📎 {doc}</span>
                    <button type="button" onClick={() => setForceMajeureDocuments(forceMajeureDocuments.filter((_, i) => i !== idx))} className="text-red-500 hover:text-red-700 font-extrabold ml-1 font-mono">×</button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-slate-100 bg-slate-50 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            إلغاء الأمر
          </button>
          <button
            type="button"
            disabled={!forceMajeureReason.trim()}
            onClick={async () => {
              if (!forceMajeureReason.trim()) return;
              try {
                const res = await fetch('/api/bookings/force-majeure', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    bookingId: selectedBooking.id,
                    reason: forceMajeureReason,
                    documents: forceMajeureDocuments
                  })
                });
                
                if (res.ok) {
                  showNotification('success', 'تم تقديم طلب الإلغاء والظروف القاهرة بنجاح وجار التدقيق الإداري من الإدارة المالية!');
                  onClose();
                  // Update booking status locally
                  setBookings(bookings.map((bk: any) => 
                    bk.id === selectedBooking.id ? { ...bk, status: 'انتظار' } : bk
                  ));
                  // Refresh the force majeure list
                  if (typeof fetchForceMajeureRequests === 'function') {
                    fetchForceMajeureRequests();
                  }
                } else {
                  const data = await res.json();
                  showNotification('error', data.error || 'فشل إرسال طلب القوة القاهرة.');
                }
              } catch (err: any) {
                showNotification('error', 'عذراً! خطأ في الاتصال بالخادم: ' + err.message);
              }
            }}
            className={`bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-2 rounded-xl text-xs shrink-0 cursor-pointer shadow-md transition-all flex items-center gap-2 ${!forceMajeureReason.trim() ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            📝 إرسال طلب الإلغاء الطارئ
          </button>
        </div>
      </div>
    </div>
  );
};
