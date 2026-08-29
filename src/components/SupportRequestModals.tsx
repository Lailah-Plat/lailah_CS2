import React, { useState } from 'react';
import { X, PackageSearch, MessageSquare, FileCheck } from 'lucide-react';
import { formatBookingId, formatServiceRequestId } from '../utils/idUtils';
import { OrderLifecycleStepper, OrderLifecycleStatus } from './bookings/OrderLifecycleStepper';
import { OrderActionBar } from './bookings/OrderActionBar';
import { OrderChatModal } from './bookings/OrderChatModal';
import { SettlementVoucherModal } from './bookings/SettlementVoucherModal';
import { calculateOrderFinancials } from './bookings/GenericOrderDetailsCard';

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
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isVoucherOpen, setIsVoucherOpen] = useState(false);

  if (!isSupportRequestModalOpen && !isSupportRequestViewModalOpen) return null;

  const totalAmount = Number(viewingSupportRequest?.price) || 0;
  const commissionRate = viewingSupportRequest?.commissionRate || 10;
  const financials = calculateOrderFinancials(totalAmount, commissionRate);
  const orderNum = viewingSupportRequest ? formatServiceRequestId(viewingSupportRequest.id) : '';

  const handleSupportRequestStatusChange = (nextStatus: OrderLifecycleStatus) => {
    if (!viewingSupportRequest) return;
    const updated = { ...viewingSupportRequest, status: nextStatus };
    setSupportServiceRequests(supportServiceRequests.map(r => r.id === viewingSupportRequest.id ? updated : r));
    showNotification('success', `تم تحديث حالة طلب الخدمة إلى: ${nextStatus}`);
  };

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
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[92vh]">
            <div className="bg-slate-50 p-5 sm:p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2.5 h-6 bg-indigo-500 rounded-full"></span>
                تفاصيل طلب الخدمة <span className="font-mono text-indigo-600">{orderNum}</span>
              </h3>
              <button onClick={() => setIsSupportRequestViewModalOpen(false)} className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">
              {/* Stepper */}
              <OrderLifecycleStepper status={viewingSupportRequest.status || 'قيد الانتظار'} />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block font-bold">رقم الحجز المرتبط</span>
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
                    <span className="text-slate-500 font-bold bg-white px-2 py-0.5 rounded text-xs block w-max mt-0.5">خدمة مساندة مستقلة</span>
                  )}
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block font-bold">تاريخ الطلب</span>
                  <span className="text-slate-700 font-bold font-mono text-sm">{viewingSupportRequest.date}</span>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block font-bold">العميل صاحب الطلب</span>
                  <span className="text-slate-800 font-bold text-sm">{viewingSupportRequest.customerName}</span>
                </div>

                <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="text-xs text-slate-400 block font-bold">مزود الخدمة</span>
                  <span className="text-slate-800 font-bold text-sm">{viewingSupportRequest.providerName}</span>
                </div>

                <div className="col-span-2 space-y-1 bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100">
                  <span className="text-xs text-indigo-500 block font-bold">الخدمة المطلوبة</span>
                  <span className="text-slate-900 font-bold text-base">{viewingSupportRequest.serviceName}</span>
                </div>
              </div>

              {/* Transparent Financial Snapshot */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-slate-50 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex justify-between items-center border-b border-indigo-100 pb-2">
                  <span className="text-xs font-black text-indigo-900">اللقطة المالية للطلب (15% VAT)</span>
                  <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded">عمولة المنصة: {financials.commissionRate}%</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">الإجمالي الشامل</span>
                    <span className="text-xs font-black text-slate-800">{formatCurrency(financials.grossAmount)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">المبلغ الخاضع للضريبة</span>
                    <span className="text-xs font-bold text-slate-700">{formatCurrency(financials.taxableAmount)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-slate-400 block">ضريبة 15% VAT</span>
                    <span className="text-xs font-bold text-slate-700">{formatCurrency(financials.vatAmount)}</span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-100">
                    <span className="text-[10px] text-emerald-600 block font-bold">صافي المزود</span>
                    <span className="text-xs font-black text-emerald-600">{formatCurrency(financials.providerNetAmount)}</span>
                  </div>
                </div>
              </div>

              {viewingSupportRequest.bookingId && viewingSupportRequest.bookingId !== '-' && (
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 flex items-start gap-3">
                  <PackageSearch className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 leading-relaxed font-medium">
                    هذا الطلب ملحق بالحجز رقم {formatBookingId(viewingSupportRequest.bookingId)}. يتم احتساب التسويات تلقائياً في دورة التحصيل.
                  </p>
                </div>
              )}
            </div>

            {/* Action Bar */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
              <div className="w-full">
                <OrderActionBar
                  status={viewingSupportRequest.status || 'قيد الانتظار'}
                  orderNumber={orderNum}
                  orderType="service"
                  onStatusChange={handleSupportRequestStatusChange}
                  onOpenChat={() => setIsChatOpen(true)}
                  onPrintVoucher={() => setIsVoucherOpen(true)}
                  hasSettlementVoucherCapability={true}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Order Chat Modal */}
      {isChatOpen && viewingSupportRequest && (
        <OrderChatModal
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          orderNumber={orderNum}
          orderType="service"
          itemTitle={viewingSupportRequest.serviceName}
          customerName={viewingSupportRequest.customerName}
          bookingDate={viewingSupportRequest.date}
          totalAmount={totalAmount}
          status={viewingSupportRequest.status || 'قيد الانتظار'}
        />
      )}

      {/* Financial Settlement Voucher Modal */}
      {isVoucherOpen && viewingSupportRequest && (
        <SettlementVoucherModal
          isOpen={isVoucherOpen}
          onClose={() => setIsVoucherOpen(false)}
          orderNumber={orderNum}
          orderType="service"
          itemTitle={viewingSupportRequest.serviceName}
          providerName={viewingSupportRequest.providerName}
          customerName={viewingSupportRequest.customerName}
          bookingDate={viewingSupportRequest.date}
          totalAmount={totalAmount}
          commissionRate={commissionRate}
          status={viewingSupportRequest.status}
        />
      )}
    </>
  );
}
