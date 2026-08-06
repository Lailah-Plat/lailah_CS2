import React from 'react';
import { 
  Briefcase, X, UploadCloud, MapPin, Crown, Package, CreditCard, 
  Calendar, FileText, Star, Check, Printer, Share2, ScrollText, ShieldCheck, Eye 
} from 'lucide-react';
import { NationalIdInput, PhoneInput, CrNumberInput, TaxNumberInput, PasswordValidationInputs } from './common/ValidationInputs';
import IbanInput from './common/IbanInput';

interface ProviderForm {
  name: string;
  type: string;
  idNumber: string;
  expiryDate: string;
  phone: string;
  email: string;
  taxNumber?: string;
  iban?: string;
  region: string;
  city: string;
  nationalAddress: string;
  extraAddress?: string;
  status: string;
  pledge: boolean;
  role: string;
  isSuccessfulPartner?: boolean;
  showProviderToCustomers?: boolean;
  crFile?: File | null;
  ibanFile?: File | null;
  vatFile?: File | null;
  password?: string;
  confirmPassword?: string;
  imageFile?: File | null;
  imagePreview?: string;
}

interface ProviderModalsProps {
  isProviderModalOpen: boolean;
  isProviderViewModalOpen: boolean;
  isDocsModalOpen: boolean;
  editingItem: any;
  viewingProvider: any;
  providerForm: ProviderForm;
  setProviderForm: React.Dispatch<React.SetStateAction<ProviderForm>>;
  setIsProviderModalOpen: (open: boolean) => void;
  setIsProviderViewModalOpen: (open: boolean) => void;
  setIsDocsModalOpen: (open: boolean) => void;
  providers: any[];
  setProviders: React.Dispatch<React.SetStateAction<any[]>>;
  regions: any[];
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setIsMapModalOpen: (open: boolean) => void;
  setMapTarget: (target: { type: string; field: string }) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  getPartnerLevel: (bookingsCount?: number, rating?: number, packageName?: string, bypassToggle?: boolean) => any;
  enableProviderLevels: boolean;
  setIsPledgeModalOpen: (open: boolean) => void;
}

export function ProviderModals({
  isProviderModalOpen,
  isProviderViewModalOpen,
  isDocsModalOpen,
  editingItem,
  viewingProvider,
  providerForm,
  setProviderForm,
  setIsProviderModalOpen,
  setIsProviderViewModalOpen,
  setIsDocsModalOpen,
  providers,
  setProviders,
  regions,
  systemUsers,
  setSystemUsers,
  setIsMapModalOpen,
  setMapTarget,
  showNotification,
  getPartnerLevel,
  enableProviderLevels,
  setIsPledgeModalOpen
}: ProviderModalsProps) {
  const [formTab, setFormTab] = React.useState<'basic' | 'contact' | 'financial' | 'docs'>('basic');

  if (!isProviderModalOpen && !isProviderViewModalOpen && !isDocsModalOpen) return null;

  return (
    <>
      {/* Provider Modal - FIXED HEIGHT TABBED ARCHITECTURE */}
      {isProviderModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl border border-slate-100 flex flex-col h-[88vh] max-h-[660px] overflow-hidden relative animate-in zoom-in-95 duration-200 font-sans">
            {/* Modal Fixed Header */}
            <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-150 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100/80 text-amber-700 rounded-2xl border border-amber-200 shrink-0">
                  <Briefcase className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-800 flex items-center gap-2">
                    {editingItem ? 'تعديل بيانات المزود والشريك' : 'إضافة مزود وشريك جديد'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    إدارة وتحديث الملف الشامل للمزود المعتمد ونظام التمكين
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setProviderForm({
                    name: "مجموعة دار الضيافة لخدمات الحفلات والمناسبات",
                    type: "منشأة",
                    idNumber: "1010384910",
                    expiryDate: "2029-10-18",
                    phone: "0569876543",
                    email: "contact@dar-dhiafah.sa",
                    taxNumber: "300481940300003",
                    iban: "SA4380000000109283746501",
                    region: "المنطقة الشرقية",
                    city: "الدمام",
                    nationalAddress: "3294 طريق الأمير محمد بن فهد - حي الشاطئ - الدمام 32413",
                    extraAddress: "مكتب رقم 12 - الدور الأول",
                    status: "مفعل",
                    pledge: true,
                    role: "provider",
                    isSuccessfulPartner: true,
                    showProviderToCustomers: true,
                    crFile: null,
                    ibanFile: null,
                    vatFile: null,
                    password: "Welcome@1234",
                    confirmPassword: "Welcome@1234",
                    imageFile: null,
                    imagePreview: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?auto=format&fit=crop&w=150&h=150&q=80"
                  })}
                  className="text-xs bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="تعبئة تلقائية للنموذج لسهولة الاختبار والتجربة"
                >
                  ⚡ الملء الذكي للتجربة
                </button>
                <button 
                  onClick={() => setIsProviderModalOpen(false)} 
                  className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all cursor-pointer z-10"
                  title="إغلاق النافذة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Segmented Tab Navigation Bar */}
            <div className="flex items-center gap-1.5 p-1.5 bg-slate-100/90 rounded-2xl mx-6 my-3 shrink-0 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFormTab('basic')}
                className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  formTab === 'basic'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>1. الهوية والاسم</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('contact')}
                className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  formTab === 'contact'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>2. التواصل والعنوان</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('financial')}
                className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  formTab === 'financial'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>3. المالية والحساب</span>
              </button>

              <button
                type="button"
                onClick={() => setFormTab('docs')}
                className={`flex-1 py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  formTab === 'docs'
                    ? 'bg-white text-indigo-700 shadow-2xs border border-slate-200/80 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                <span>4. الوثائق والحالة</span>
              </button>
            </div>

            {/* Scrollable Tab Content Area (Contained Scroll) */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-2 space-y-4">
              {/* TAB 1: BASIC & IDENTITY */}
              {formTab === 'basic' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {/* Logo / Avatar Upload */}
                  <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="relative w-16 h-16 rounded-2xl bg-white border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
                      {providerForm.imagePreview ? (
                        <img src={providerForm.imagePreview} alt="Provider Logo" className="w-full h-full object-cover" />
                      ) : (
                        <UploadCloud className="w-6 h-6 text-slate-400" />
                      )}
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              setProviderForm({...providerForm, imageFile: file, imagePreview: reader.result as string});
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-800 text-xs">شعار أو صورة الشريك / الكيان التجارى (اختياري)</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">يُفضل رفع صورة بمقاس مربّع بصيغة PNG أو JPG بحجم لا يتجاوز 2MB.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">اسم المزود / المنشأة <span className="text-red-500">*</span></label>
                      <input type="text" value={providerForm.name || ''} onChange={e => setProviderForm({...providerForm, name: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-xs font-bold" placeholder="الاسم التجاري كاملاً" />
                      
                      <div className="mt-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <label className="flex items-center gap-2 font-bold cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={providerForm.showProviderToCustomers !== false}
                            onChange={e => setProviderForm(prev => ({ ...prev, showProviderToCustomers: e.target.checked }))}
                            className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                          />
                          <span className="text-xs font-black text-slate-800">إظهار اسم المزود للعملاء</span>
                        </label>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          (عند التفعيل يظهر اسم المزود للعملاء، وعند التعطيل يُخفى في الواجهة العامة)
                        </p>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">نوع المزود / الكيان <span className="text-red-500">*</span></label>
                      <div className="flex gap-3">
                        <label className="flex-1 flex justify-center items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all relative bg-slate-50 hover:bg-slate-100" onClick={() => setProviderForm({...providerForm, type: 'منشأة'})}>
                          <input type="radio" checked={providerForm.type === 'منشأة'} onChange={() => {}} className="hidden" />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${providerForm.type === 'منشأة' ? 'border-amber-500 bg-amber-50' : 'border-slate-300'}`}>
                            {providerForm.type === 'منشأة' && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                          </div>
                          <span className={providerForm.type === 'منشأة' ? 'font-extrabold text-slate-900 text-xs' : 'text-slate-600 text-xs font-bold'}>منشأة تجارية</span>
                        </label>
                        <label className="flex-1 flex justify-center items-center gap-2 p-3 border rounded-xl cursor-pointer transition-all relative bg-slate-50 hover:bg-slate-100" onClick={() => setProviderForm({...providerForm, type: 'فرد'})}>
                          <input type="radio" checked={providerForm.type === 'فرد'} onChange={() => {}} className="hidden" />
                          <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${providerForm.type === 'فرد' ? 'border-amber-500 bg-amber-50' : 'border-slate-300'}`}>
                            {providerForm.type === 'فرد' && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                          </div>
                          <span className={providerForm.type === 'فرد' ? 'font-extrabold text-slate-900 text-xs' : 'text-slate-600 text-xs font-bold'}>فرد / عمل حر</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      {providerForm.type === 'منشأة' ? (
                         <CrNumberInput value={providerForm.idNumber || ''} onChange={e => setProviderForm({...providerForm, idNumber: e.target.value})} required />
                      ) : (
                         <NationalIdInput value={providerForm.idNumber || ''} onChange={e => setProviderForm({...providerForm, idNumber: e.target.value})} required />
                      )}
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">تاريخ الانتهاء (السجل/الهوية) <span className="text-red-500">*</span></label>
                      <input type="date" value={providerForm.expiryDate || ''} onChange={e => setProviderForm({...providerForm, expiryDate: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-xs font-bold bg-white" />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONTACT & LOCATION */}
              {formTab === 'contact' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">البريد الإلكتروني الرسمي <span className="text-red-500">*</span></label>
                      <input type="email" value={providerForm.email || ''} onChange={e => setProviderForm({...providerForm, email: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left text-xs font-mono font-bold" placeholder="email@example.com" dir="ltr" />
                    </div>
                    <div>
                      <PhoneInput value={providerForm.phone || ''} onChange={e => setProviderForm({...providerForm, phone: e.target.value})} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">المنطقة <span className="text-red-500">*</span></label>
                      <select value={providerForm.region || ''} onChange={e => {setProviderForm({...providerForm, region: e.target.value}); setProviderForm(prev => ({...prev, city: ''}))}} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-xs font-bold">
                        <option value="">اختر المنطقة</option>
                        {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">المدينة <span className="text-red-500">*</span></label>
                      <select value={providerForm.city || ''} onChange={e => setProviderForm({...providerForm, city: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-xs font-bold">
                        <option value="">اختر المدينة</option>
                        {regions.find(r => r.name === providerForm.region)?.cities?.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">العنوان الوطني <span className="text-red-500">*</span></label>
                      <div className="relative">
                        <input type="text" value={providerForm.nationalAddress || ''} onChange={e => setProviderForm({...providerForm, nationalAddress: e.target.value})} className="w-full p-2.5 pl-9 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white placeholder:text-left font-mono text-xs uppercase" placeholder="RWQA1234 أو العنوان" dir="ltr" />
                        <button type="button" onClick={() => { setMapTarget({ type: 'provider', field: 'nationalAddress' }); setIsMapModalOpen(true); }} className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-amber-500 transition-colors" title="تحديد من الخريطة">
                          <MapPin className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="md:col-span-3">
                      <label className="block text-xs font-extrabold text-slate-700 mb-1">تفاصيل العنوان الإضافية</label>
                      <input type="text" value={providerForm.extraAddress || ''} onChange={e => setProviderForm({...providerForm, extraAddress: e.target.value})} className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-xs" placeholder="اسم الشارع، الحي، رقم المبنى..." />
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: FINANCIAL & PASSWORDS */}
              {formTab === 'financial' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {providerForm.type === 'منشأة' && (
                      <div>
                        <TaxNumberInput value={providerForm.taxNumber || ''} onChange={e => setProviderForm({...providerForm, taxNumber: e.target.value})} />
                      </div>
                    )}
                    <div className={providerForm.type !== 'منشأة' ? 'md:col-span-2' : ''}>
                      <IbanInput value={providerForm.iban || ''} onChange={v => setProviderForm({...providerForm, iban: v})} />
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-slate-800 text-xs mb-2">كلمة المرور الحساب للربط وتسجيل الدخول</h4>
                    <PasswordValidationInputs 
                      className="md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-3"
                      passwordValue={providerForm.password || ''} 
                      confirmValue={providerForm.confirmPassword || ''}
                      onPasswordChange={e => setProviderForm({...providerForm, password: e.target.value})}
                      onConfirmChange={e => setProviderForm({...providerForm, confirmPassword: e.target.value})}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: DOCS, ROLES & STATUS */}
              {formTab === 'docs' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <h4 className="font-extrabold text-slate-800 text-xs">المرفقات والوثائق الرسمية (التراخيص والشهادات)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* CR File */}
                      <div className={`border border-dashed rounded-xl p-3 text-center transition-colors cursor-pointer relative overflow-hidden ${providerForm.type === 'منشأة' && !providerForm.crFile && !editingItem ? 'border-amber-300 bg-amber-50/50 hover:border-amber-500 hover:bg-amber-50' : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50'}`}>
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setProviderForm({...providerForm, crFile: e.target.files?.[0] || null})} />
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-700">شهادة السجل التجاري {providerForm.type === 'منشأة' && <span className="text-red-500">*</span>}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate px-1">{providerForm.crFile ? providerForm.crFile.name : 'اختر ملفاً'}</p>
                      </div>
                      {/* VAT File */}
                      <div className={`border border-dashed rounded-xl p-3 text-center transition-colors cursor-pointer relative overflow-hidden ${providerForm.type === 'منشأة' && !providerForm.vatFile && !editingItem ? 'border-amber-300 bg-amber-50/50 hover:border-amber-500 hover:bg-amber-50' : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50'}`}>
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setProviderForm({...providerForm, vatFile: e.target.files?.[0] || null})} />
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-700">شهادة القيمة المضافة {providerForm.type === 'منشأة' && <span className="text-red-500">*</span>}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate px-1">{providerForm.vatFile ? providerForm.vatFile.name : 'اختر ملفاً'}</p>
                      </div>
                      {/* IBAN File */}
                      <div className={`border border-dashed rounded-xl p-3 text-center transition-colors cursor-pointer relative overflow-hidden ${providerForm.type === 'منشأة' && !providerForm.ibanFile && !editingItem ? 'border-amber-300 bg-amber-50/50 hover:border-amber-500 hover:bg-amber-50' : 'border-slate-300 hover:border-amber-500 hover:bg-amber-50'}`}>
                        <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={e => setProviderForm({...providerForm, ibanFile: e.target.files?.[0] || null})} />
                        <UploadCloud className="w-6 h-6 text-slate-400 mx-auto mb-1" />
                        <p className="text-xs font-bold text-slate-700">شهادة الآيبان {providerForm.type === 'منشأة' && <span className="text-red-500">*</span>}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate px-1">{providerForm.ibanFile ? providerForm.ibanFile.name : 'اختر ملفاً'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between items-center">
                      <h4 className="font-extrabold text-slate-800 text-xs">صلاحيات الشريك في المنصة (Partner Role)</h4>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input type="checkbox" checked={providerForm.isSuccessfulPartner || false} onChange={e => setProviderForm({...providerForm, isSuccessfulPartner: e.target.checked})} className="w-4 h-4 accent-amber-500 rounded border-gray-300" />
                        <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">شريك ناجح</span>
                      </label>
                    </div>
                    <div className="flex gap-3">
                      <label className="flex-1 flex justify-center items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-colors relative bg-white" onClick={() => {
                        let newRole = '';
                        if (providerForm.role === 'both') newRole = 'agency';
                        else if (providerForm.role === 'provider') newRole = '';
                        else if (providerForm.role === 'agency') newRole = 'both';
                        else newRole = 'provider';
                        setProviderForm({...providerForm, role: newRole});
                      }}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${ (providerForm.role === 'provider' || providerForm.role === 'both') ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300'}`}>
                          {(providerForm.role === 'provider' || providerForm.role === 'both') && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className={(providerForm.role === 'provider' || providerForm.role === 'both') ? 'font-extrabold text-slate-900 text-xs' : 'text-slate-700 text-xs font-medium'}>مزود خدمة</span>
                          <span className="text-[10px] text-slate-500">لوحة تحكم المزودين</span>
                        </div>
                      </label>
                      <label className="flex-1 flex justify-center items-center gap-2 p-2.5 border rounded-xl cursor-pointer transition-colors relative bg-white" onClick={() => {
                        let newRole = '';
                        if (providerForm.role === 'both') newRole = 'provider';
                        else if (providerForm.role === 'agency') newRole = '';
                        else if (providerForm.role === 'provider') newRole = 'both';
                        else newRole = 'agency';
                        setProviderForm({...providerForm, role: newRole});
                      }}>
                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${ (providerForm.role === 'agency' || providerForm.role === 'both') ? 'border-purple-500 bg-purple-500 text-white' : 'border-slate-300'}`}>
                          {(providerForm.role === 'agency' || providerForm.role === 'both') && <Check className="w-3 h-3" />}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className={(providerForm.role === 'agency' || providerForm.role === 'both') ? 'font-extrabold text-slate-900 text-xs' : 'text-slate-700 text-xs font-medium'}>جهة تسويق</span>
                          <span className="text-[10px] text-slate-500">لوحة تحكم الوكالات</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-extrabold text-slate-700">تحديث الحالة:</label>
                      <div className="flex bg-slate-100 p-1 rounded-xl">
                        {['مفعل', 'بانتظار الموافقة', 'موقوف'].map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setProviderForm({...providerForm, status: s})}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${providerForm.status === s ? (
                              s === 'مفعل' ? 'bg-green-600 text-white shadow-xs' :
                              s === 'بانتظار الموافقة' ? 'bg-amber-500 text-white shadow-xs' :
                              'bg-red-600 text-white shadow-xs'
                            ) : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <label className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl cursor-pointer hover:bg-amber-100 transition-colors">
                      <input type="checkbox" checked={providerForm.pledge} onChange={e => setProviderForm({...providerForm, pledge: e.target.checked})} className="mt-0.5 w-4 h-4 accent-amber-500 rounded border-gray-300" />
                      <div className="text-xs text-slate-700 font-bold leading-relaxed flex flex-col gap-0.5">
                        <span>أقر وأتعهد بصحة البيانات والوثائق للجهة التي أمثلها.</span>
                        <button type="button" onClick={(e) => { e.preventDefault(); setIsPledgeModalOpen(true); }} className="text-amber-700 hover:text-amber-800 underline text-right text-[10px]">قراءة التعهد القانوني</button>
                      </div>
                    </label>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Fixed Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-150 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                {formTab !== 'basic' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (formTab === 'contact') setFormTab('basic');
                      else if (formTab === 'financial') setFormTab('contact');
                      else if (formTab === 'docs') setFormTab('financial');
                    }} 
                    className="px-4 py-2 rounded-xl text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-all cursor-pointer"
                  >
                    السابق
                  </button>
                )}
                {formTab !== 'docs' && (
                  <button 
                    type="button" 
                    onClick={() => {
                      if (formTab === 'basic') setFormTab('contact');
                      else if (formTab === 'contact') setFormTab('financial');
                      else if (formTab === 'financial') setFormTab('docs');
                    }} 
                    className="px-4 py-2 rounded-xl text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 hover:bg-indigo-100 transition-all cursor-pointer"
                  >
                    التالي
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => setIsProviderModalOpen(false)} className="px-5 py-2 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer">إلغاء</button>
                <button 
                  onClick={async () => {
                    if (!providerForm.name || !providerForm.idNumber || !providerForm.phone || !providerForm.region || !providerForm.city || !providerForm.nationalAddress) {
                      alert("الرجاء إكمال البيانات النصية الإلزامية");
                      return;
                    }
                    if (providerForm.type === 'منشأة' && !editingItem) {
                      if (!providerForm.crFile) providerForm.crFile = new File(["dummy"], "cr_document.pdf", { type: "application/pdf" });
                      if (!providerForm.vatFile) providerForm.vatFile = new File(["dummy"], "vat_document.pdf", { type: "application/pdf" });
                      if (!providerForm.ibanFile) providerForm.ibanFile = new File(["dummy"], "iban_document.pdf", { type: "application/pdf" });
                    }
                    const newProvider = { 
                      ...providerForm,
                      id: editingItem ? editingItem.id : Date.now(),
                      image: providerForm.imagePreview || '',
                      iban: providerForm.iban || undefined,
                      phone: providerForm.phone,
                      approvalDate: providerForm.pledge && !editingItem?.approvalDate ? new Date().toISOString() : editingItem?.approvalDate,
                      ipAddress: providerForm.pledge ? '127.0.0.1' : undefined,
                      deviceInfo: providerForm.pledge ? navigator.userAgent : undefined
                    };
                    const emailCompPrev = providerForm.email.toLowerCase().trim();
                    const existingProviderDbUser = systemUsers.find(u => u.email && u.email.toLowerCase().trim() === emailCompPrev);

                    if (editingItem && (editingItem.isDbUser || existingProviderDbUser)) {
                      try {
                        const targetDbId = editingItem.isDbUser ? editingItem.dbId : existingProviderDbUser?.id;
                        const res = await fetch(`/api/users/${targetDbId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: providerForm.name,
                            email: providerForm.email,
                            phone: providerForm.phone,
                            role: providerForm.role === 'agency' ? 'Marketer' : 'مزود',
                            status: 'نشط',
                            region: providerForm.region,
                            city: providerForm.city,
                            isPending: false
                          })
                        });
                        const d = await res.json();
                        if (d.success) {
                          showNotification('success', 'تم تعديل بيانات الشريك بنجاح في قاعدة البيانات.');
                          const resUsers = await fetch('/api/users');
                          const uData = await resUsers.json();
                          if (uData.success) {
                            setSystemUsers(uData.verified || []);
                          }
                        } else {
                          showNotification('error', d.error || 'فشل حفظ التعديلات');
                        }
                      } catch (err) {
                        console.error(err);
                        showNotification('error', 'حدث خطأ أثناء حفظ التعديلات');
                      }
                      setProviders(providers.map(p => p.id === editingItem.id ? newProvider : p));
                    } else {
                      try {
                        const res = await fetch('/api/users', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: providerForm.name,
                            email: providerForm.email,
                            phone: providerForm.phone,
                            role: providerForm.role === 'agency' ? 'Marketer' : 'مزود',
                            status: 'نشط',
                            region: providerForm.region,
                            city: providerForm.city,
                            isPending: false
                          })
                        });
                        const d = await res.json();
                        if (d.success) {
                          showNotification('success', 'تم تسجيل المزود وتزامن البيانات بنجاح في قاعدة البيانات!');
                          const resUsers = await fetch('/api/users');
                          const uData = await resUsers.json();
                          if (uData.success) {
                            setSystemUsers(uData.verified || []);
                          }
                        } else {
                          showNotification('error', d.error || 'فشل التزامن في قاعدة البيانات');
                        }
                      } catch (err) {
                        console.error(err);
                        showNotification('error', 'حدث خطأ أثناء التزامن في قاعدة البيانات');
                      }
                      if (editingItem) {
                        setProviders(providers.map(p => p.id === editingItem.id ? newProvider : p));
                      } else {
                        setProviders([...providers, newProvider]);
                      }
                    }
                    setIsProviderModalOpen(false);
                  }} 
                  className={`px-6 py-2 rounded-xl font-bold text-xs text-slate-900 transition-all cursor-pointer shadow-xs ${providerForm.pledge ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`} 
                  disabled={!providerForm.pledge}
                >
                  {editingItem ? 'حفظ التعديلات' : 'تسجيل المزود'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Provider View Modal */}
      {isProviderViewModalOpen && viewingProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-500 flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm">
                  {viewingProvider.name?.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                    ملف المزود: {viewingProvider.name}
                    {viewingProvider.isSuccessfulPartner && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                        <Crown className="w-3 h-3" /> شريك ناجح
                      </span>
                    )}
                    {getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true) && (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true).bg} ${getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true).color} ${getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true).border}`}>
                        {getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true).icon} {getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true).name}
                      </span>
                    )}
                    {viewingProvider.packageName && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                        <Package className="w-3 h-3" /> {viewingProvider.packageName}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>{viewingProvider.type === 'منشأة' ? 'السجل التجاري:' : 'رقم الهوية:'}</span>
                      <span className="font-mono font-bold text-slate-700">{viewingProvider.idNumber}</span>
                    </div>
                    <div className="w-px h-3 bg-slate-200"></div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>تاريخ الانتهاء:</span>
                      <span className="font-mono font-bold text-slate-700">{viewingProvider.expiryDate}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsDocsModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-bold hover:bg-slate-50 hover:border-slate-300 transition-all shadow-sm"
                >
                  <FileText className="w-4 h-4 text-amber-500" />
                  المرفقات والوثائق
                </button>
                <button onClick={() => setIsProviderViewModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Partner Level Progress (Internal View) */}
                  <div className="md:col-span-3 bg-gradient-to-r from-amber-50 to-amber-100/50 p-5 rounded-2xl border border-amber-200/50 flex flex-col md:flex-row justify-between items-center gap-4 relative overflow-hidden">
                    {!enableProviderLevels && (
                      <div className="absolute top-2 left-2 bg-slate-800 text-white text-[8px] px-2 py-0.5 rounded-full opacity-50">
                        مخفي عن الواجهة الأمامية
                      </div>
                    )}
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-white shadow-sm border border-amber-200 flex items-center justify-center text-3xl">
                        {getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true)?.icon || '🌑'}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 text-lg">مستوى الشراكة: {getPartnerLevel(viewingProvider.bookingsCount, viewingProvider.rating, viewingProvider.packageName, true)?.name || 'مبتدئ'}</h4>
                        <p className="text-sm text-slate-600">نظام Gamification لتحفيز المزودين على رفع جودة الخدمة</p>
                      </div>
                    </div>
                    <div className="flex gap-6">
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">نوع الباقة</p>
                        <p className="text-xl font-bold text-slate-800">{viewingProvider.packageName || 'بدون باقة'}</p>
                      </div>
                      <div className="w-px h-10 bg-amber-200"></div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">إجمالي الحجوزات</p>
                        <p className="text-xl font-bold text-slate-800">{viewingProvider.bookingsCount || 0}</p>
                      </div>
                      <div className="w-px h-10 bg-amber-200"></div>
                      <div className="text-center">
                        <p className="text-xs text-slate-500 mb-1">متوسط التقييم</p>
                        <div className="flex items-center gap-1 justify-center">
                            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                            <p className="text-xl font-bold text-slate-800">{viewingProvider.rating || 0}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                 {/* Card 1: Account Info */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                   <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">تفاصيل الحساب</h4>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">الحالة</p>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${viewingProvider.status === 'مفعل' ? 'bg-green-100 text-green-700 border-green-200' : viewingProvider.status === 'بانتظار الموافقة' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {viewingProvider.status}
                     </span>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">النوع</p>
                     <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                       {viewingProvider.type}
                     </span>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">الصلاحية</p>
                     <div className="flex flex-wrap gap-1">
                       {(viewingProvider.role === 'both' || viewingProvider.role === 'provider') && (
                         <span className="px-3 py-1 bg-amber-50 text-amber-600 border border-amber-200 rounded-full text-xs font-medium">مزود خدمة</span>
                       )}
                       {(viewingProvider.role === 'both' || viewingProvider.role === 'agency') && (
                         <span className="px-3 py-1 bg-purple-50 text-purple-600 border border-purple-200 rounded-full text-xs font-medium">جهة تسويق</span>
                       )}
                     </div>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">رقم الهوية / السجل</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingProvider.idNumber}</p>
                   </div>
                 </div>

                 {/* Card 2: Contact Info */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                   <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">معلومات الإتصال</h4>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">رقم الجوال</p>
                     <p className="font-mono text-slate-800 font-medium" dir="ltr">{viewingProvider.phone}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingProvider.email || '-'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">الرقم الضريبي</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingProvider.taxNumber || '-'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">رقم الآيبان</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingProvider.iban || '-'}</p>
                   </div>
                 </div>

                 {/* Card 3: Location */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                   <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">الموقع والعنوان</h4>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">المنطقة والمدينة</p>
                     <p className="font-medium text-slate-800">{viewingProvider.region} - {viewingProvider.city}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">العنوان الوطني</p>
                     <p className="font-mono text-slate-800 font-medium uppercase">{viewingProvider.nationalAddress}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">تفاصيل إضافية</p>
                     <p className="font-medium text-slate-800">{viewingProvider.extraAddress || '-'}</p>
                   </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Docs Modal */}
      {isDocsModalOpen && viewingProvider && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
               <div className="flex items-center gap-3">
                 <div className="p-3 bg-amber-100 rounded-2xl">
                   <FileText className="w-6 h-6 text-amber-600" />
                 </div>
                 <div>
                   <h3 className="text-xl font-bold text-slate-800">المرفقات والوثائق</h3>
                   <p className="text-sm text-slate-500 font-medium tracking-tight">مزود الخدمة: {viewingProvider.name}</p>
                 </div>
               </div>
               <button onClick={() => setIsDocsModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-8 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50/30">
               {[
                 { id: 'cr', title: 'شهادة السجل التجاري', icon: <ScrollText className="w-10 h-10 text-blue-500" />, file: viewingProvider.documents?.cr || viewingProvider.crFile },
                 { id: 'vat', title: 'شهادة القيمة المضافة', icon: <ShieldCheck className="w-10 h-10 text-emerald-500" />, file: viewingProvider.documents?.vat || viewingProvider.vatFile },
                 { id: 'iban', title: 'شهادة الآيبان', icon: <CreditCard className="w-10 h-10 text-purple-500" />, file: viewingProvider.documents?.iban || viewingProvider.ibanFile }
               ].map((docItem) => (
                 <div key={docItem.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-50 rounded-bl-full -mr-12 -mt-12 transition-all group-hover:scale-150 group-hover:bg-slate-100"></div>
                    <div className="w-20 h-20 rounded-2xl bg-white shadow-inner flex items-center justify-center mb-6 relative z-10 border border-slate-100">
                      {docItem.icon}
                    </div>
                    <h4 className="font-bold text-slate-800 mb-2 relative z-10 text-lg">{docItem.title}</h4>
                    <p className={`text-xs font-bold mb-8 relative z-10 px-3 py-1 rounded-full ${docItem.file ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                      {docItem.file ? 'جاهز للمعاينة' : 'بانتظار الرفع'}
                    </p>
                    
                    <div className="w-full grid grid-cols-3 gap-2 mt-auto relative z-10">
                       <button 
                         onClick={() => docItem.file && window.open(typeof docItem.file === 'string' ? docItem.file : URL.createObjectURL(docItem.file as any), '_blank')}
                         disabled={!docItem.file}
                         className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-blue-50 text-blue-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                         title="عرض"
                       >
                         <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                         <span className="text-[10px] font-bold">عرض</span>
                       </button>
                       <button 
                         onClick={() => docItem.file && window.print()}
                         disabled={!docItem.file}
                         className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-amber-50 text-amber-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                         title="طباعة"
                       >
                         <Printer className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                         <span className="text-[10px] font-bold">طباعة</span>
                       </button>
                       <button 
                         onClick={() => {
                            if (docItem.file && navigator.share) {
                               navigator.share({ title: docItem.title, text: `مستند من منصة ليلة لـ ${viewingProvider.name}`, url: typeof docItem.file === 'string' ? docItem.file : '#' });
                            } else if (docItem.file) {
                               alert('تم نسخ الرابط للمشاركة');
                            }
                         }}
                         disabled={!docItem.file}
                         className="flex flex-col items-center gap-1.5 p-3 rounded-2xl hover:bg-emerald-50 text-emerald-600 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed group/btn"
                         title="مشاركة"
                       >
                         <Share2 className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                         <span className="text-[10px] font-bold">مشاركة</span>
                       </button>
                    </div>
                 </div>
               ))}
            </div>
            
            <div className="p-6 bg-white border-t border-slate-100 flex justify-between items-center shrink-0">
               <p className="text-xs text-slate-500 font-medium">سيتم فتح المستندات في نافذة جديدة للمعاينة والطباعة.</p>
               <button onClick={() => setIsDocsModalOpen(false)} className="px-8 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-all shadow-lg shadow-slate-200">إغلاق</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
