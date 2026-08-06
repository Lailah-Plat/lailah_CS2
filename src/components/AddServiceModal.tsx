import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Edit, Sparkles, Info, Coins, HelpCircle } from 'lucide-react';

interface AddServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  hallId: number;
  onSave: (service: any) => void;
  editingItem?: any;
  extraServicesList?: any[];
  onDeleteService?: (serviceId: any) => void;
  onEditService?: (service: any) => void;
  hallName?: string;
}

export const AddServiceModal: React.FC<AddServiceModalProps> = ({ 
  isOpen, 
  onClose, 
  hallId, 
  onSave, 
  editingItem,
  extraServicesList = [],
  onDeleteService,
  onEditService,
  hallName = 'القاعة'
}) => {
  const [form, setForm] = useState({ 
    name: editingItem?.name || '', 
    description: editingItem?.description || editingItem?.desc || '', 
    quantity: editingItem?.quantity || '', 
    price: editingItem?.price?.toString() || '' 
  });
  const [syncToMarketplace, setSyncToMarketplace] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (editingItem) {
      setForm({
        name: editingItem.name || '',
        description: editingItem.description || editingItem.desc || '',
        quantity: editingItem.quantity || '',
        price: editingItem.price?.toString() || ''
      });
      setSyncToMarketplace(editingItem.syncToMarketplace !== false);
    } else {
      setForm({ name: '', description: '', quantity: '', price: '' });
      setSyncToMarketplace(true);
    }
  }, [editingItem, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      onSave({
        ...(editingItem || {}),
        ...form,
        price: parseFloat(form.price) || 0,
        syncToMarketplace
      });
      if (!editingItem) {
        setForm({ name: '', description: '', quantity: '', price: '' });
      }
      setLoading(false);
    }, 400);
  };

  const formatCurrencyLocal = (value: any) => {
    const num = Number(value);
    if (isNaN(num)) return '0 ر.س';
    return `${num.toLocaleString('ar-SA')} ر.س`;
  };

  return (
    <div className="fixed inset-0 z-55 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] relative animate-in zoom-in-95 duration-200" dir="rtl">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-amber-500/10 to-amber-600/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-900 flex items-center justify-center font-bold shadow-md shadow-amber-500/10">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">
                {editingItem ? 'تعديل الخدمة المحددة' : 'إضافة وتوليف خدمات إضافية'}
              </h3>
              <p className="text-xs text-slate-500">
                إدارة وبناء الخدمات المخصصة لصالة <strong className="text-amber-650 font-black">{hallName}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 hover:text-slate-800 rounded-full transition-colors text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100 overflow-y-auto flex-1 p-6 gap-6">
          {/* Form Column (7 Cols) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                <Info className="w-4 h-4 text-amber-500" />
                {editingItem ? 'تعديل تفاصيل الخدمة الحالية' : 'معلومات الخدمة الجديدة'}
              </h4>
              <p className="text-[11px] text-slate-500">
                املأ البيانات لتسجيل الخدمة الإضافية وتوفيرها للعملاء لحجزها طواعية عند تأجير صالة المناسبات.
              </p>
            </div>

            <form id="add-service-form" onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">اسم الخدمة الإضافية <span className="text-rose-500">*</span></label>
                <input 
                  type="text" 
                  required 
                  value={form.name} 
                  onChange={e => setForm({...form, name: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-205 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-sans text-sm text-slate-800 transition-all font-medium" 
                  placeholder="مثال: تصوير درون احترافي، بوفيه خمس نجوم..." 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">الوصف والتفاصيل</label>
                <textarea 
                  value={form.description} 
                  onChange={e => setForm({...form, description: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-205 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none font-sans text-sm text-slate-800 transition-all" 
                  rows={3} 
                  placeholder="اكتب بإنصاف مواصفات هذه الخدمة والامتيازات التي تمنحها..."
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">الكمية المتاحة</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={form.quantity} 
                    onChange={e => setForm({...form, quantity: e.target.value})} 
                    className="w-full p-3 rounded-xl border border-slate-205 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono text-sm text-slate-850" 
                    placeholder="فارغ للكميات المفتوحة" 
                  />
                  <p className="text-[10px] text-slate-450 mt-1">الكمية القصوى المتاح تقديمها في اليوم</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">سعر الخدمة (ر.س) <span className="text-rose-500">*</span></label>
                  <div className="relative">
                    <input 
                      type="number" 
                      required 
                      min="0" 
                      step="0.01" 
                      value={form.price} 
                      onChange={e => setForm({...form, price: e.target.value})} 
                      className="w-full p-3 pl-12 rounded-xl border border-slate-205 bg-white outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 font-mono text-sm text-slate-850 font-bold" 
                      placeholder="0.00" 
                    />
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400 font-sans">
                      ر.س
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-450 mt-1">شاملة ضريبة القيمة المضافة VAT</p>
                </div>
              </div>

              {/* Sync to Marketplace Toggle Checkbox */}
              <div className="bg-purple-50 p-3.5 rounded-2xl border border-purple-200/80 transition-all hover:border-purple-300">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={syncToMarketplace} 
                    onChange={e => setSyncToMarketplace(e.target.checked)} 
                    className="w-4 h-4 mt-0.5 text-purple-600 rounded border-purple-300 focus:ring-purple-500 cursor-pointer shrink-0" 
                  />
                  <div>
                    <span className="text-xs font-black text-purple-900 block flex items-center gap-1.5">
                      <span>إدراج ونشر الخدمة في دليل الخدمات المساندة المستقلة (Marketplace)</span>
                    </span>
                    <span className="text-[10px] text-purple-700/90 block mt-1 leading-relaxed">
                      تفعيل هذا الخيار يحفظ الخدمة سحابياً ويرحلها تلقائياً إلى قاعدة البيانات للظهور في "دليل الخدمات المساندة المستقلة" بالمنصة.
                    </span>
                  </div>
                </label>
              </div>
            </form>
          </div>

          {/* List Column: Previously added services (5 Cols) */}
          <div className="lg:col-span-6 flex flex-col space-y-3 lg:pr-6">
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-700">الخدمات الإضافية المضافة للقاعة</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">عدد الخدمات المسجلة حالياً: <strong className="text-slate-700">{extraServicesList.length} خدمات</strong></p>
              </div>
              <Coins className="w-5 h-5 text-amber-500" />
            </div>

            <div className="flex-1 overflow-y-auto max-h-[320px] lg:max-h-none space-y-2 border border-slate-100 rounded-2xl p-2 bg-slate-50/20 min-h-[220px]">
              {extraServicesList.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center bg-white rounded-xl border border-dashed border-slate-200">
                  <HelpCircle className="w-8 h-8 text-slate-300 mb-2 animate-bounce" />
                  <p className="text-xs font-bold text-slate-700">لا توجد خدمات إضافية حتى الآن</p>
                  <p className="text-[10px] text-slate-450 mt-1 leading-relaxed">أضف خدمة جديدة عبر النموذج على اليمين لتظهر كخدمة إضافية متاحة لهذه القاعة.</p>
                </div>
              ) : (
                extraServicesList.map((service: any) => (
                  <div 
                    key={service.id} 
                    className="p-3.5 bg-white border border-slate-200 rounded-2xl flex items-center justify-between gap-3 shadow-sm hover:border-amber-200 transition-all hover:shadow-md"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <h5 className="text-xs font-extrabold text-slate-850 truncate font-sans">{service.name}</h5>
                      </div>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{service.desc || service.description || 'لا يوجد وصف متاح'}</p>
                      
                      <div className="flex gap-2 items-center mt-1.5">
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-md">
                          {formatCurrencyLocal(service.price)}
                        </span>
                        {service.quantity && (
                          <span className="text-[9px] font-semibold text-slate-550 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md font-sans">
                            الكمية: {service.quantity}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {onEditService && (
                        <button 
                          type="button"
                          onClick={() => onEditService(service)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-amber-600 transition-colors"
                          title="تعديل الخدمة"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {onDeleteService && (
                        <button 
                          type="button"
                          onClick={() => onDeleteService(service.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
                          title="حذف الخدمة"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex justify-end gap-3 rounded-b-3xl">
          <button 
            type="button" 
            onClick={onClose} 
            className="px-6 py-3 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
          >
            إغلاق النافذة
          </button>
          <button 
            type="submit" 
            form="add-service-form" 
            disabled={loading} 
            className="px-6 py-3 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-900 transition-colors shadow-lg shadow-amber-500/10 hover:scale-[1.02] active:scale-95 duration-150 flex items-center gap-2"
          >
            {loading ? (
              <span>جاري الحفظ...</span>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>{editingItem ? 'حفظ التغييرات' : 'إضافة الخدمة'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
