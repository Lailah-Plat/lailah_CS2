import React from 'react';
import { X, PackageSearch } from 'lucide-react';
import { formatBookingId, formatServiceRequestId } from '../utils/idUtils';

interface SupportRequestForm {
  bookingId: string | number;
  userId: string;
  customerName: string;
  providerName: string;
  serviceName: string;
  price: number;
  date: string;
  status: string;
}

interface SupportRequestModalsProps {
  isSupportRequestModalOpen: boolean;
  isSupportRequestViewModalOpen: boolean;
  editingItem: any;
  viewingSupportRequest: any;
  supportRequestForm: SupportRequestForm;
  setSupportRequestForm: React.Dispatch<React.SetStateAction<SupportRequestForm>>;
  setIsSupportRequestModalOpen: (open: boolean) => void;
  setIsSupportRequestViewModalOpen: (open: boolean) => void;
  bookings: any[];
  supportServiceRequests: any[];
  setSupportServiceRequests: React.Dispatch<React.SetStateAction<any[]>>;
  setViewingBooking: (booking: any) => void;
  setIsBookingViewModalOpen: (open: boolean) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  formatCurrency: (amount: number) => string;
}

export function SupportRequestModals({
  isSupportRequestModalOpen,
  isSupportRequestViewModalOpen,
  editingItem,
  viewingSupportRequest,
  supportRequestForm,
  setSupportRequestForm,
  setIsSupportRequestModalOpen,
  setIsSupportRequestViewModalOpen,
  bookings,
  supportServiceRequests,
  setSupportServiceRequests,
  setViewingBooking,
  setIsBookingViewModalOpen,
  showNotification,
  formatCurrency
}: SupportRequestModalsProps) {

  if (!isSupportRequestModalOpen && !isSupportRequestViewModalOpen) return null;

  return (
    <>
      {/* Support Service Request Modal */}
      {isSupportRequestModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                  {editingItem ? 'تعديل طلب خدمة مساندة' : 'إضافة طلب خدمة مساندة جديد'}
                </h3>
                <button
                  type="button"
                  onClick={() => setSupportRequestForm({
                    bookingId: "",
                    userId: "",
                    customerName: "سليمان بن فهد العجلان",
                    providerName: "مجموعة زهرة الربيع لتوريد الورد والضيافة",
                    serviceName: "تنسيق ممرات وتجهيز كوشة VIP رويال",
                    price: 4500,
                    date: "2026-07-01",
                    status: "قيد الانتظار"
                  })}
                  className="text-xs bg-indigo-50 border border-indigo-100 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer animate-pulse-subtle"
                  title="تعبئة تلقائية للنموذج لسهولة الاختبار والتجربة"
                >
                  ⚡ ملء تلقائي للتجربة
                </button>
              </div>
              <button onClick={() => setIsSupportRequestModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">رقم الحجز المرتبط <span className="text-slate-400 font-normal text-xs">(اختياري للخدمات المستقلة)</span></label>
                  <select 
                    className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" 
                    value={supportRequestForm.bookingId || ''} 
                    onChange={e => {
                      const val = e.target.value;
                      if (!val) {
                        setSupportRequestForm({
                          ...supportRequestForm, 
                          bookingId: '',
                          customerName: ''
                        });
                        return;
                      }
                      const bid = parseInt(val);
                      const b = bookings.find(bk => bk.id === bid);
                      setSupportRequestForm({
                        ...supportRequestForm, 
                        bookingId: bid, 
                        customerName: b ? b.customer : '' 
                      });
                    }}
                  >
                    <option value="">بدون ارتباط (خدمة مستقلة)</option>
                    {bookings.map(b => (
                      <option key={b.id} value={b.id}>حجز #{b.id} - {b.customer}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">اسم العميل</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 outline-none" value={supportRequestForm.customerName || ''} readOnly placeholder="عرض تلقائي..." />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">اسم المزود <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" value={supportRequestForm.providerName || ''} onChange={e => setSupportRequestForm({...supportRequestForm, providerName: e.target.value})} placeholder="مثال: مطعم النخبة" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">الخدمة المطلوبة <span className="text-red-500">*</span></label>
                <input type="text" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" value={supportRequestForm.serviceName || ''} onChange={e => setSupportRequestForm({...supportRequestForm, serviceName: e.target.value})} placeholder="مثال: ذبايح وبوفيه" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">المبلغ الإجمالي <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type="number" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 pl-12 font-bold" value={supportRequestForm.price ?? 0} onChange={e => setSupportRequestForm({...supportRequestForm, price: parseFloat(e.target.value) || 0})} />
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">ر.س</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-bold text-slate-700">تاريخ الطلب</label>
                  <input type="date" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500" value={supportRequestForm.date || ''} onChange={e => setSupportRequestForm({...supportRequestForm, date: e.target.value})} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-bold text-slate-700">حالة الطلب</label>
                <select className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 font-bold" value={supportRequestForm.status || ''} onChange={e => setSupportRequestForm({...supportRequestForm, status: e.target.value})}>
                  <option value="قيد الانتظار">قيد الانتظار</option>
                  <option value="تم القبول">تم القبول</option>
                  <option value="جاري التنفيذ">جاري التنفيذ</option>
                  <option value="مكتمل">مكتمل</option>
                  <option value="ملغي">ملغي</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 shrink-0">
              <button onClick={() => setIsSupportRequestModalOpen(false)} className="px-6 py-2.5 rounded-xl font-bold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors">إلغاء</button>
              <button 
                onClick={() => {
                  if (editingItem) {
                    if (supportRequestForm.status === 'ملغي' && editingItem.status !== 'ملغي' && supportRequestForm.price > 0) {
                      window.dispatchEvent(new CustomEvent('add_finance_expense', {
                        detail: {
                          title: `استرداد تلقائي لخدمة ملغية #${editingItem.id} - ${supportRequestForm.customerName}`,
                          category: 'مستردات',
                          total: supportRequestForm.price,
                          type: 'refund'
                        }
                      }));
                      showNotification('info', 'تم تسجيل استرداد مالي للخدمة الملغية في المصروفات');
                    }
                    const updated = { ...supportRequestForm, id: editingItem.id };
                    setSupportServiceRequests(supportServiceRequests.map(r => r.id === editingItem.id ? updated : r));
                    
                    fetch(`/api/bookings/support-requests/${editingItem.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(supportRequestForm)
                    })
                    .then(res => res.json())
                    .then(savedRequest => {
                      setSupportServiceRequests(supportServiceRequests.map(r => r.id === editingItem.id ? savedRequest : r));
                      showNotification('success', 'تم تعديل الطلب وحفظه في قاعدة البيانات الخارجية بنجاح.');
                    })
                    .catch(e => {
                      console.error('Failed to update support request in DB:', e);
                    });
                  } else {
                    fetch('/api/bookings/support-requests', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(supportRequestForm)
                    })
                    .then(res => res.json())
                    .then(savedRequest => {
                      setSupportServiceRequests([savedRequest, ...supportServiceRequests]);
                      showNotification('success', 'تم إضافة الطلب وحفظه في قاعدة البيانات الخارجية بنجاح.');
                    })
                    .catch(e => {
                      console.error('Failed to create support request in DB:', e);
                      setSupportServiceRequests([{...supportRequestForm, id: Math.floor(Math.random() * 9000) + 1000}, ...supportServiceRequests]);
                    });
                  }
                  setIsSupportRequestModalOpen(false);
                }} 
                className="px-6 py-2.5 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 text-white transition-colors cursor-pointer"
              >
                {editingItem ? 'حفظ التعديلات' : 'إضافة الطلب'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Support Service Request View Modal */}
      {isSupportRequestViewModalOpen && viewingSupportRequest && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-6 bg-indigo-500 rounded-full"></span>
                تفاصيل طلب الخدمة <span className="font-mono">{formatServiceRequestId(viewingSupportRequest.id)}</span>
              </h3>
              <button onClick={() => setIsSupportRequestViewModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">رقم الحجز</span>
                  {viewingSupportRequest.bookingId && viewingSupportRequest.bookingId !== '-' && String(viewingSupportRequest.bookingId) !== '0' ? (
                    <span className="text-blue-600 font-mono font-bold hover:underline cursor-pointer" onClick={() => {
                        const associatedBooking = bookings.find(b => b.id === viewingSupportRequest.bookingId);
                        if (associatedBooking) {
                          setIsSupportRequestViewModalOpen(false);
                          setTimeout(() => {
                            setViewingBooking(associatedBooking);
                            setIsBookingViewModalOpen(true);
                          }, 100);
                        } else {
                          showNotification('error', 'تفاصيل هذا الحجز غير متوفرة أو تم حذفه');
                        }
                    }}>{formatBookingId(viewingSupportRequest.bookingId)}</span>
                  ) : (
                    <span className="text-slate-500 font-bold bg-slate-100 px-2 py-1 rounded-md text-sm block w-max mt-1">خدمة مستقلة</span>
                  )}
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">الحالة</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border inline-block ${
                    viewingSupportRequest.status === 'مكتمل' ? 'bg-green-50 text-green-700 border-green-100' :
                    viewingSupportRequest.status === 'جاري التنفيذ' || viewingSupportRequest.status === 'قيد التنفيذ' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                    viewingSupportRequest.status === 'تم القبول' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                    viewingSupportRequest.status === 'ملغي' ? 'bg-red-50 text-red-700 border-red-100' :
                    'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                    {viewingSupportRequest.status}
                  </span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">العميل</span>
                  <span className="text-slate-700 font-bold">{viewingSupportRequest.customerName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">المزود</span>
                  <span className="text-slate-700 font-bold">{viewingSupportRequest.providerName}</span>
                </div>
                <div className="col-span-2 space-y-1 pt-2 border-t border-slate-50">
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">الخدمة</span>
                  <span className="text-slate-900 font-bold text-lg">{viewingSupportRequest.serviceName}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">المبلغ</span>
                  <span className="text-emerald-600 font-bold text-xl">{formatCurrency(viewingSupportRequest.price)}</span>
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-slate-400 block font-bold uppercase tracking-wider">التاريخ</span>
                  <span className="text-slate-600 font-medium">{viewingSupportRequest.date}</span>
                </div>
              </div>
              
              <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-4">
                <div className="p-2 bg-white rounded-xl shadow-sm border border-indigo-200">
                  <PackageSearch className="w-5 h-5 text-indigo-500" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 mb-1">ملاحظة النظام</h4>
                  <p className="text-xs text-indigo-700 leading-relaxed">
                    هذا الطلب مرتبط بالحجز {formatBookingId(viewingSupportRequest.bookingId)}. سيتم احتساب التكاليف بشكل منفصل ضمن تقارير الخدمات المساندة.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-center">
              <button onClick={() => setIsSupportRequestViewModalOpen(false)} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-slate-200">إغلاق النافذة</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
