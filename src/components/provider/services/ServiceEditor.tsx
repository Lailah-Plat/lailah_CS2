import React, { useState } from 'react';
import { 
  Inbox, 
  Sparkles, 
  Save, 
  X, 
  Info, 
  DollarSign, 
  Tag 
} from 'lucide-react';

interface ServiceEditorProps {
  initialService?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (serviceData: any) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ServiceEditor: React.FC<ServiceEditorProps> = ({
  initialService,
  isOpen,
  onClose,
  onSave,
  showNotification,
}) => {
  const [formData, setFormData] = useState({
    id: initialService?.id || `srv-${Date.now()}`,
    name: initialService?.name || '',
    category: initialService?.category || 'ضيافة وتقديم',
    price: initialService?.price || '2500',
    description: initialService?.description || '',
    duration: initialService?.duration || '4 ساعات',
    capacity: initialService?.capacity || 'غير محدد',
    status: initialService?.status || 'pending',
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showNotification('error', 'يرجى إدخال اسم الخدمة');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-purple-50 dark:bg-purple-950 text-purple-600 rounded-xl">
              <Inbox className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {initialService ? 'تعديل بيانات الخدمة' : 'إضافة خدمة مساندة جديدة'}
              </h3>
              <p className="text-[11px] text-slate-500">التصنيف، التسعير، والتفاصيل التشغيلية</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">اسم الخدمة *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="مثال: بوفيه ضيافة ملكي VIP"
              className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">تصنيف الخدمة</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              >
                <option value="ضيافة وتقديم">ضيافة وتقديم</option>
                <option value="تصوير وتوثيق">تصوير وتوثيق</option>
                <option value="صوتيات وإضاءة">صوتيات وإضاءة</option>
                <option value="كوش وتنسيق ورود">كوش وتنسيق ورود</option>
                <option value="أمن واستقبال VIP">أمن واستقبال VIP</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">السعر (شامل الضريبة 15%) *</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="2500"
                className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">وصف الخدمة وشروط التنفيذ</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب شرحاً تفصيلياً لما تتضمنه هذه الخدمة..."
              className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900 rounded-2xl flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200 text-xs">
            <Info className="w-4 h-4 shrink-0 text-indigo-600" />
            <span>تخضع الخدمات المساندة المضافة حديثاً لقواعد منع الازدواجية والموافقة الإدارية.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-black text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>حفظ الخدمة</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
