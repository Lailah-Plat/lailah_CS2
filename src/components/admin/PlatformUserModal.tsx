import React from 'react';
import { X } from 'lucide-react';

interface PlatformUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformUserForm: {
    name: string;
    email: string;
    phone: string;
    role: string;
    status: string;
    otp_code?: string;
    isPending: boolean;
    region?: string;
    city?: string;
  };
  setPlatformUserForm: (form: any) => void;
  editingPlatformUser: any;
  regions: any[];
  handleSavePlatformUser: (e: React.FormEvent) => void;
}

export const PlatformUserModal: React.FC<PlatformUserModalProps> = ({
  isOpen,
  onClose,
  platformUserForm,
  setPlatformUserForm,
  editingPlatformUser,
  regions,
  handleSavePlatformUser
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative border border-slate-100">
        <div className="bg-indigo-950 p-6 text-white flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-lg font-black flex items-center gap-2">
              <span className="p-1 px-2.5 bg-amber-500 text-slate-950 rounded-lg text-xs font-black">الدعم الإداري</span>
              {editingPlatformUser ? 'تعديل بيانات الحساب وحل مشكلة التسجيل والـ OTP' : 'إضافة مستخدم يدوي جديد للمنصة'}
            </h3>
            <p className="text-[10px] text-indigo-200 mt-1">تعديل وصيانة الحسابات الناقصة أو التي تواجه مشاكل في كود التحقق ومزامنة حالتها فوراً</p>
          </div>
          <button type="button" onClick={onClose} className="text-indigo-200 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSavePlatformUser} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1 space-y-5">
            {/* Field: Full Name */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">الاسم الكامل <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                autoComplete="name"
                value={platformUserForm.name}
                onChange={e => setPlatformUserForm({ ...platformUserForm, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs"
                placeholder="مثال: كعب بن ماجد"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field: Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={platformUserForm.email}
                  onChange={e => setPlatformUserForm({ ...platformUserForm, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs text-left"
                  placeholder="kaab@example.com"
                  dir="ltr"
                />
              </div>

              {/* Field: Phone */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">رقم الجوال</label>
                <input
                  type="tel"
                  autoComplete="tel"
                  value={platformUserForm.phone || ''}
                  onChange={e => setPlatformUserForm({ ...platformUserForm, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs text-left"
                  placeholder="05xxxxxxx"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field: Role */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">الدور الوظيفي / الصلاحية <span className="text-red-500">*</span></label>
                <select
                  value={platformUserForm.role}
                  onChange={e => setPlatformUserForm({ ...platformUserForm, role: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs bg-white"
                >
                  <option value="عميل">عميل (مستأجر)</option>
                  <option value="مزود">مزود خدمة (حساب تجاري)</option>
                  <option value="أدمن">مسؤول النظام (أدمن)</option>
                </select>
              </div>

              {/* Field: Status */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">حالة الحساب <span className="text-red-500">*</span></label>
                <select
                  value={platformUserForm.status}
                  onChange={e => setPlatformUserForm({ ...platformUserForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs bg-white"
                >
                  <option value="نشط">نشط وفوري الدخول</option>
                  <option value="موقف">موقف ومحجوب مؤقتاً</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field: OTP Code */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">رمز التحقق الأخير (OTP)</label>
                <input
                  type="text"
                  value={platformUserForm.otp_code || ''}
                  onChange={e => setPlatformUserForm({ ...platformUserForm, otp_code: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs text-left font-mono"
                  placeholder="مثال: 4892"
                />
              </div>

              {/* Field: Is Pending Checkbox */}
              <div className="flex items-center pt-6">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={platformUserForm.isPending}
                    onChange={e => setPlatformUserForm({ ...platformUserForm, isPending: e.target.checked })}
                    className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500"
                  />
                  <span className="text-xs font-bold text-slate-700">بانتظار استكمال التحقق / معلّق التسجيل</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Field: Region */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">المنطقة الجغرافية</label>
                <select
                  value={platformUserForm.region || ''}
                  onChange={e => {
                    const newRegion = e.target.value;
                    setPlatformUserForm({ ...platformUserForm, region: newRegion, city: '' });
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs bg-white"
                >
                  <option value="">اختر المنطقة</option>
                  {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
              </div>

              {/* Field: City */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 align-right text-right">المدينة</label>
                <select
                  value={platformUserForm.city || ''}
                  onChange={e => setPlatformUserForm({ ...platformUserForm, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-xs bg-white"
                >
                  <option value="">اختر المدينة</option>
                  {regions.find(r => r.name === platformUserForm.region)?.cities?.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Form Footer */}
          <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-100 transition-colors"
            >
              إلغاء الإجراء
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all shadow-md shadow-amber-500/10"
            >
              {editingPlatformUser ? 'حفظ وحقن التعديلات' : 'إنشاء وتسكين الحساب'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
