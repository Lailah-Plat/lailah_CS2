import React, { useState } from 'react';
import { 
  Building2, 
  Camera, 
  MapPin, 
  Users, 
  Sparkles, 
  Save, 
  X, 
  UploadCloud, 
  AlertTriangle, 
  CheckCircle2, 
  Info 
} from 'lucide-react';

interface HallEditorProps {
  initialHall?: any;
  isOpen: boolean;
  onClose: () => void;
  onSave: (hallData: any) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const HallEditor: React.FC<HallEditorProps> = ({
  initialHall,
  isOpen,
  onClose,
  onSave,
  showNotification,
}) => {
  const [formData, setFormData] = useState({
    id: initialHall?.id || `hall-${Date.now()}`,
    name: initialHall?.name || '',
    type: initialHall?.type || 'قصر أفراح',
    capacity: initialHall?.capacity || '400',
    basePrice: initialHall?.basePrice || initialHall?.price || '15000',
    city: initialHall?.city || 'الرياض',
    district: initialHall?.district || 'الملقا',
    address: initialHall?.address || '',
    description: initialHall?.description || '',
    image: initialHall?.image || '',
    features: initialHall?.features || {
      ac: true,
      stage: true,
      soundSystem: true,
      brideRoom: true,
      parking: true,
    },
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      showNotification('error', 'يرجى إدخال اسم القاعة');
      return;
    }
    onSave(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-slate-100">
                {initialHall ? 'تعديل بيانات القاعة' : 'إضافة قاعة جديدة'}
              </h3>
              <p className="text-[11px] text-slate-500">المواصفات، السعة الاستيعابية، والتسعير</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">اسم القاعة *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="مثال: قاعة الأسطورة الملكية"
                className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">السعة القصوى (أفراد) *</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="400"
                className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">السعر الأساسي (شامل الضريبة) *</label>
              <input
                type="number"
                required
                value={formData.basePrice}
                onChange={(e) => setFormData({ ...formData, basePrice: e.target.value })}
                placeholder="15000"
                className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">المدينة</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="الرياض"
                className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-700 dark:text-slate-300">الحي</label>
              <input
                type="text"
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                placeholder="الملقا"
                className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">رابط أو مسار الصورة الرئيسية (نسبة 16:9)</label>
            <input
              type="text"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              placeholder="https://images.unsplash.com/..."
              className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black text-slate-700 dark:text-slate-300">الوصف والمرافق المتاحة</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="اكتب وصفاً تفصيلياً للقاعة وتجهيزاتها الخاصة..."
              className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-2xl flex items-center gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
            <Info className="w-4 h-4 shrink-0 text-amber-600" />
            <span>ملاحظة: تخضع القاعات الجديدة للاعتماد الإداري المسبق قبل ظهورها العام للعملاء.</span>
          </div>

          {/* Footer Actions */}
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
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Save className="w-4 h-4" />
              <span>حفظ واعتماد البيانات</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
