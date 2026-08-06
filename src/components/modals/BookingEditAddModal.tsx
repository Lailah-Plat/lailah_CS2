import React, { useState, useEffect } from 'react';
import { X, Users, Settings, CreditCard, CalendarDays, Sparkles, Wallet } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PhoneInput } from '../common/ValidationInputs';
import { BookingServicesSelector } from '../BookingServicesSelector';
import { BookingCalendar } from '../BookingCalendar';
import { formatCurrency } from '../../data/dashboardConstants';

interface BookingEditAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingItem: any;
  bookingForm: any;
  setBookingForm: React.Dispatch<React.SetStateAction<any>>;
  halls: any[];
  bookings: any[];
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const BookingEditAddModal: React.FC<BookingEditAddModalProps> = ({
  isOpen,
  onClose,
  editingItem,
  bookingForm,
  setBookingForm,
  halls,
  bookings,
  setBookings,
  showNotification
}) => {
  const [activeBookingTab, setActiveBookingTab] = useState<'info' | 'details' | 'financial' | 'calendar'>('info');

  // Reset tab to info when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveBookingTab('info');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 rounded-t-3xl shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="text-lg font-bold text-slate-850 dark:text-amber-50 flex items-center gap-2 font-sans">
              <span className="w-2.5 h-6 bg-amber-500 rounded-full"></span>
              {editingItem ? 'تعديل بيانات الحجز' : 'إضافة حجز جديد بالصالة'}
            </h3>
            <button
              type="button"
              onClick={() => setBookingForm({
                customer: "عبدالرحمن بن عبدالله السديري",
                phone: "053" + Math.floor(1000000 + Math.random() * 9000000),
                type: "حجز قاعة",
                startDate: "2026-06-25",
                endDate: "2026-06-26",
                period: "مسائية",
                guests: 400,
                status: "مؤكد",
                paymentStatus: "مدفوع",
                notes: "تجهيز مدخل كبار الشخصيات مع كوشة وإضافة ضيافة القهوة الملكية.",
                amount: 15000,
                itemName: "قاعة اللؤلؤة الملكية",
                hallId: 1,
                basePrice: 12000,
                extraPrice: 3000,
                extraServices: "",
                selectedServices: []
              })}
              className="text-[10px] bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-150 dark:border-indigo-900/50 hover:bg-indigo-100 dark:hover:bg-indigo-950/45 text-indigo-750 dark:text-indigo-300 px-2.5 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
              title="تعبئة تلقائية للنموذج لسهولة الاختبار والتجربة"
            >
              ⚡ ملء تلقائي تجريبي
            </button>
          </div>
          <button 
            onClick={onClose} 
            className="absolute top-4 left-4 z-[60] bg-white dark:bg-slate-850 text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 dark:border-slate-850 shadow-sm p-2 rounded-full transition-all duration-200"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Elegant Tab Headers */}
        <div className="bg-slate-50/80 dark:bg-slate-950/20 px-6 py-2 border-b border-slate-150 dark:border-slate-800 flex gap-2 shrink-0 overflow-x-auto custom-scrollbar" dir="rtl">
          {[
            { id: 'info', label: 'العميل والمرفق', icon: Users },
            { id: 'details', label: 'الخدمات والتوقيت', icon: Settings },
            { id: 'financial', label: 'المالية والتشغيل', icon: CreditCard },
            { id: 'calendar', label: 'جدول الحجوزات', icon: CalendarDays }
          ].map((tab) => {
            const IconComponent = tab.icon;
            const isActive = activeBookingTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveBookingTab(tab.id as any)}
                className={`flex items-center gap-2 py-2 px-3.5 text-xs font-bold rounded-xl transition-all border shrink-0 cursor-pointer ${
                  isActive 
                    ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-sm shadow-amber-500/25 font-black scale-102' 
                    : 'bg-white dark:bg-slate-850 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50/50'
                }`}
              >
                <IconComponent className="w-3.5 h-3.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="p-6 overflow-hidden flex-1 flex flex-col min-h-0 bg-white dark:bg-slate-900" dir="rtl">
          <AnimatePresence mode="wait">
            {activeBookingTab === 'info' && (
              <motion.div
                key="tab-info"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">اسم العميل <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      autoComplete="name" 
                      placeholder="الاسـم الكامل للمواطن أو العميل"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all duration-200 bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 font-medium font-sans dark:text-slate-200" 
                      value={bookingForm.customer || ''} 
                      onChange={e => setBookingForm({...bookingForm, customer: e.target.value})} 
                    />
                  </div>
                  <div>
                    <PhoneInput value={bookingForm.phone || ''} onChange={e => setBookingForm({...bookingForm, phone: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">نوع الحجز</label>
                    <select 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer font-bold text-slate-700 dark:text-slate-300 font-sans" 
                      value={bookingForm.type || ''} 
                      onChange={e => setBookingForm({...bookingForm, type: e.target.value})}
                    >
                      <option value="حجز قاعة">🏰 حجز قاعة احتفالات / اجتماعات</option>
                      <option value="حجز خدمة">🛠️ حجز خدمة مساندة منفصلة</option>
                      <option value="باقة">🎁 باقة متكاملة منسقة</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">القاعة المطلوبة <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer font-bold text-slate-700 dark:text-slate-300 font-sans" 
                      value={bookingForm.hallId || 0} 
                      onChange={e => {
                        const id = Number(e.target.value);
                        const hall = halls.find(h => h.id === id);
                        setBookingForm({
                          ...bookingForm, 
                          hallId: id, 
                          itemName: hall ? hall.name : '',
                          selectedServices: [],
                          basePrice: (hall as any)?.fullDayPrice || 0,
                          amount: ((hall as any)?.fullDayPrice || 0) + bookingForm.extraPrice
                        });
                      }}
                    >
                      <option value={0}>اختر القاعة المعنية بالطلب...</option>
                      {halls.map(h => <option key={h.id} value={h.id}>🏢 {h.name} - ({h.city || 'الرياض'})</option>)}
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-amber-50/40 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/50 flex items-start gap-3 mt-2">
                  <Sparkles className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200 font-sans">حجز ديناميكي ذكي</h4>
                    <p className="text-[10px] text-amber-700 dark:text-amber-300 leading-normal mt-0.5 font-sans">
                      يقوم النظام بتحديث متوسط تسعيرة الليلة تلقائياً كقيمة حجز أساسية وفقاً لاختيارك المرفق أعلاه، لتتمكن لاحقاً من توليف وطرح الخدمات الإضافية المخصصة للضيف بيسر متناهي وبدون شاشات معقدة.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeBookingTab === 'details' && (
              <motion.div
                key="tab-details"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1"
              >
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">فترة الحجز اليومية</label>
                    <select 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer text-slate-700 dark:text-slate-300 font-bold font-sans" 
                      value={bookingForm.period || ''} 
                      onChange={e => setBookingForm({...bookingForm, period: e.target.value})}
                    >
                      <option value="صباحية">🌅 الفترة الصباحية (8:00 ص - 3:00 م)</option>
                      <option value="مسائية">🌃 الفترة المسائية (4:00 م - 2:00 ص)</option>
                      <option value="كاملة">🕒 hجز يوم كامل (كامل الأوقات)</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">عدد الضيوف المتوقع</label>
                    <input 
                      type="number" 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 font-sans dark:text-slate-200" 
                      value={bookingForm.guests ?? 0} 
                      min="0" 
                      onChange={e => setBookingForm({...bookingForm, guests: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">تاريخ البداية <span className="text-red-500">*</span></label>
                    <input 
                      type="date" 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 font-bold text-slate-700 dark:text-slate-300 font-sans" 
                      value={bookingForm.startDate || ''} 
                      onChange={e => setBookingForm({...bookingForm, startDate: e.target.value})} 
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">تاريخ النهاية</label>
                    <input 
                      type="date" 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 font-bold text-slate-700 dark:text-slate-300 font-sans" 
                      value={bookingForm.endDate || ''} 
                      onChange={e => setBookingForm({...bookingForm, endDate: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Additional Services Component select */}
                <div className="border border-slate-100 dark:border-slate-800 rounded-2xl p-4 bg-slate-50/40 dark:bg-slate-850/30">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                    سلة الخدمات الإضافية للتسجيل والتحكم بالتسعير
                  </h4>
                  <BookingServicesSelector 
                    hallId={bookingForm.hallId} 
                    selectedServices={bookingForm.selectedServices || []} 
                    onChange={(newServices) => {
                      const extra = newServices.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
                      setBookingForm({
                        ...bookingForm,
                        selectedServices: newServices,
                        extraPrice: extra,
                        amount: bookingForm.basePrice + extra
                      });
                    }} 
                  />
                </div>
              </motion.div>
            )}

            {activeBookingTab === 'financial' && (
              <motion.div
                key="tab-financial"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="space-y-4 flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">حالة الحجز الحالية</label>
                    <select 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer text-slate-700 dark:text-slate-300 font-bold font-sans" 
                      value={bookingForm.status || ''} 
                      onChange={e => setBookingForm({...bookingForm, status: e.target.value})}
                    >
                      <option value="جديد">🆕 جديد / قيد الانتظار</option>
                      <option value="انتظار">🕰️ في قائمة انتظار الشركاء</option>
                      <option value="مؤكد">✅ مؤكد من الإدارة</option>
                      <option value="منفذ">🏆 منفذ وتاريخه انتهى</option>
                      <option value="ملغي">❌ ملغي بالاتفاقية</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">حالة الدفع (الاستحقاق القانوني)</label>
                    <select 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 cursor-pointer text-slate-700 dark:text-slate-300 font-bold font-sans" 
                      value={bookingForm.paymentStatus || ''} 
                      onChange={e => setBookingForm({...bookingForm, paymentStatus: e.target.value})}
                    >
                      <option value="مدفوع">💵 تم السداد بالكامل</option>
                      <option value="جزئي">💳 مدفوع جزئياً (عربون تأكيد)</option>
                      <option value="غير مدفوع">⚠️ غير مدفوع / مستحق السداد</option>
                      <option value="مسترجع">🔄 مسترجع للضيف لتسوية المديونية</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">شرح ووصف الخدمات الإضافية</label>
                    <input 
                      type="text" 
                      placeholder="مثال: بوفيه فاخر، ديكورات خاصة بمدخل كبار الشخصيات..." 
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 font-sans dark:text-slate-205" 
                      value={bookingForm.extraServices || ''} 
                      onChange={e => setBookingForm({...bookingForm, extraServices: e.target.value})} 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 dark:text-slate-400 mb-1.5 font-sans">ملاحظات إشرافية خاصة بالحجز</label>
                    <input 
                      type="text" 
                      placeholder="تعليمات خاصة بالتسليم والاستباقية في الترتيب والمشرف المعني"
                      className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-slate-50/30 dark:bg-slate-850 hover:bg-white dark:hover:bg-slate-800 transition-all duration-200 font-sans dark:text-slate-205" 
                      value={bookingForm.notes || ''} 
                      onChange={e => setBookingForm({...bookingForm, notes: e.target.value})} 
                    />
                  </div>
                </div>

                {/* Premium Pricing Summary Card */}
                <div className="bg-slate-50 dark:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl p-4 mt-2">
                  <h4 className="text-xs font-extrabold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-1.5 font-sans">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    الملف المالي الاستحقاقي المتوازن للمعارض والمناسبات
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1 font-sans">السعر الأساسي</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          className="w-full text-xs font-extrabold text-slate-800 dark:text-slate-200 outline-none bg-transparent font-sans" 
                          value={bookingForm.basePrice ?? 0} 
                          min="0" 
                          onChange={e => setBookingForm({...bookingForm, basePrice: parseFloat(e.target.value) || 0, amount: (parseFloat(e.target.value) || 0) + bookingForm.extraPrice})} 
                        />
                        <span className="text-[10px] text-slate-500 font-bold font-sans">ريال</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-150 dark:border-slate-800 shadow-sm">
                      <span className="text-[10px] text-slate-400 font-bold block mb-1 font-sans">الخدمات المضافة</span>
                      <div className="flex items-center gap-1">
                        <input 
                          type="number" 
                          className="w-full text-xs font-extrabold text-slate-800 dark:text-slate-200 outline-none bg-transparent font-sans" 
                          value={bookingForm.extraPrice ?? 0} 
                          min="0" 
                          onChange={e => setBookingForm({...bookingForm, extraPrice: parseFloat(e.target.value) || 0, amount: bookingForm.basePrice + (parseFloat(e.target.value) || 0)})} 
                        />
                        <span className="text-[10px] text-slate-500 font-bold font-sans">ريال</span>
                      </div>
                    </div>
                    <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-300 dark:border-amber-900/50 shadow-sm flex flex-col justify-center">
                      <span className="text-[10px] text-amber-900 dark:text-amber-200 font-black block mb-0.5 font-sans">المبلغ الإجمالي</span>
                      <span className="text-xs font-black text-amber-950 dark:text-amber-150 block font-sans">{formatCurrency(bookingForm.amount ?? 0)}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeBookingTab === 'calendar' && (
              <motion.div
                key="tab-calendar"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="flex-1 min-h-0 flex flex-col overflow-hidden"
              >
                <div className="flex items-center gap-2 border-r-4 border-amber-500 pr-3 py-0.5 shrink-0 mb-3">
                  <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-sans">تفقد جدول حجوزات القاعة لمطابقتها للجدول الزمني المخطط للعملاء</span>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-950/20 p-2 rounded-2xl border border-slate-150 dark:border-slate-800">
                  <BookingCalendar hallId={bookingForm.hallId || 1} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Stepper Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-150 dark:border-slate-800 rounded-b-3xl flex justify-between items-center shrink-0" dir="rtl">
          <div className="flex gap-2">
            <button 
              type="button"
              onClick={onClose} 
              className="px-4 py-2 text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl transition-all font-sans cursor-pointer"
            >
              إلغاء الإجراء
            </button>
            {activeBookingTab !== 'info' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeBookingTab === 'calendar') setActiveBookingTab('financial');
                  else if (activeBookingTab === 'financial') setActiveBookingTab('details');
                  else if (activeBookingTab === 'details') setActiveBookingTab('info');
                }}
                className="px-4 py-2 text-xs font-bold bg-white dark:bg-slate-850 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 rounded-xl transition-all font-sans cursor-pointer"
              >
                السابق
              </button>
            )}
          </div>

          <div className="flex gap-2">
            {activeBookingTab !== 'calendar' && (
              <button 
                type="button"
                onClick={() => {
                  if (activeBookingTab === 'info') {
                    if (!bookingForm.customer || !bookingForm.phone) {
                      showNotification('error', 'يرجى تعبئة اسم العميل ورقم هاتفه للبدء والتحول التلقائي للمرحلة القادمة');
                      return;
                    }
                    setActiveBookingTab('details');
                  }
                  else if (activeBookingTab === 'details') {
                    if (!bookingForm.startDate) {
                      showNotification('error', 'يرجى تحديد تاريخ بداية الحجز كعنصر تداولي أساسي للمرفق');
                      return;
                    }
                    setActiveBookingTab('financial');
                  }
                  else if (activeBookingTab === 'financial') setActiveBookingTab('calendar');
                }}
                className="px-4 py-2 text-xs font-bold bg-amber-50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950/45 border border-amber-200/50 dark:border-amber-900/50 rounded-xl transition-all font-sans cursor-pointer"
              >
                التالي
              </button>
            )}

            <button 
              onClick={() => {
                if (editingItem) {
                  if (bookingForm.status === 'ملغي' && editingItem.status !== 'ملغي' && bookingForm.paymentStatus === 'مدفوع') {
                    window.dispatchEvent(new CustomEvent('add_finance_expense', {
                      detail: {
                        title: `استرداد تلقائي لحجز ملغي #${editingItem.id} - ${bookingForm.customer}`,
                        category: 'مستردات',
                        total: bookingForm.amount,
                        type: 'refund'
                      }
                    }));
                    showNotification('info', 'تم تسجيل استرداد مالي للحجز الملغي في المصروفات');
                  }
                  // Keep local immediately for fast UI response, then sync to DB
                  setBookings(bookings.map(b => b.id === editingItem.id ? {...bookingForm, id: editingItem.id} : b));
                  
                  const mappedBody = {
                    customerName: bookingForm.customer,
                    customerPhone: bookingForm.phone,
                    startTime: new Date(`${bookingForm.startDate}T16:00:00`),
                    endTime: new Date(`${bookingForm.endDate || bookingForm.startDate}T23:59:00`),
                    guests: Number(bookingForm.guests || 100),
                    totalAmount: Number(bookingForm.amount || 15000),
                    status: bookingForm.status === 'جديد' ? 'pending' : (bookingForm.status === 'مؤكد' ? 'confirmed' : (bookingForm.status === 'ملغي' ? 'cancelled' : 'completed')),
                    paymentStatus: bookingForm.paymentStatus
                  };
                  fetch(`/api/bookings/${editingItem.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mappedBody)
                  })
                  .then(res => res.json())
                  .then(() => {
                    showNotification('success', 'تم تعديل الحجز وحفظه في قاعدة البيانات الخارجية بنجاح.');
                  })
                  .catch(err => {
                    console.error('Failed to save edit to DB:', err);
                    showNotification('error', 'حدث خطأ أثناء تعديل الحجز بقاعدة البيانات الخارجية.');
                  });
                } else {
                  const mappedBody = {
                    customerName: bookingForm.customer,
                    customerPhone: bookingForm.phone,
                    hallId: Number(bookingForm.hallId || 1),
                    startTime: new Date(`${bookingForm.startDate}T16:00:00`),
                    endTime: new Date(`${bookingForm.endDate || bookingForm.startDate}T23:59:00`),
                    guests: Number(bookingForm.guests || 100),
                    services: []
                  };
                  
                  fetch('/api/bookings/create', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(mappedBody)
                  })
                  .then(res => {
                    if (!res.ok) {
                      return res.json().then(e => { throw new Error(e.error || 'Failed to create booking'); });
                    }
                    return res.json();
                  })
                  .then(savedBooking => {
                    const newBooking = {
                      ...bookingForm,
                      id: savedBooking.id,
                      date: bookingForm.startDate
                    };
                    setBookings([newBooking, ...bookings]);
                    showNotification('success', 'تم إضافة الحجز وحفظه في قاعدة البيانات الخارجية بنجاح.');
                  })
                  .catch(err => {
                    console.error('Failed to create in DB:', err);
                    showNotification('error', 'تم إضافة الحجز محلياً فقط لتعذر الاتصال بقاعدة البيانات.');
                    setBookings([{...bookingForm, id: Math.floor(Math.random() * 1000) + 200, date: bookingForm.startDate}, ...bookings]);
                  });
                }
                onClose();
              }} 
              className={`px-5 py-2 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-colors cursor-pointer shadow-md shadow-amber-500/10 font-sans ${
                (!bookingForm.customer || !bookingForm.phone || !bookingForm.itemName || !bookingForm.startDate) ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!bookingForm.customer || !bookingForm.phone || !bookingForm.itemName || !bookingForm.startDate}
            >
              {editingItem ? 'حفظ وتثبيت التعديلات' : 'تأكيد وإدراج الحجز'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
