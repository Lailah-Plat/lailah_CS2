import React from 'react';
import { Users, X, UploadCloud, MapPin, CheckCircle2, CreditCard } from 'lucide-react';
import { NationalIdInput, PhoneInput, TaxNumberInput, PasswordValidationInputs } from './common/ValidationInputs';
import IbanInput from './common/IbanInput';
import CustomerSavedCardsModal from './payment/CustomerSavedCardsModal';

interface CustomerForm {
  name: string;
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
  points: number;
  imageFile?: File | null;
  imagePreview?: string;
  password?: string;
  confirmPassword?: string;
}

interface CustomerModalsProps {
  isCustomerModalOpen: boolean;
  isCustomerViewModalOpen: boolean;
  editingItem: any;
  viewingCustomer: any;
  customerForm: CustomerForm;
  setCustomerForm: React.Dispatch<React.SetStateAction<CustomerForm>>;
  setIsCustomerModalOpen: (open: boolean) => void;
  setIsCustomerViewModalOpen: (open: boolean) => void;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  regions: any[];
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setIsMapModalOpen: (open: boolean) => void;
  setMapTarget: (target: { type: string; field: string }) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function CustomerModals({
  isCustomerModalOpen,
  isCustomerViewModalOpen,
  editingItem,
  viewingCustomer,
  customerForm,
  setCustomerForm,
  setIsCustomerModalOpen,
  setIsCustomerViewModalOpen,
  customers,
  setCustomers,
  regions,
  systemUsers,
  setSystemUsers,
  setIsMapModalOpen,
  setMapTarget,
  showNotification
}: CustomerModalsProps) {

  if (!isCustomerModalOpen && !isCustomerViewModalOpen) return null;

  return (
    <>
      {/* Customer Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col h-[90vh] md:h-[620px] relative">
            <div className="bg-slate-50 p-4 border-b border-slate-150 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100/80 rounded-xl flex items-center justify-center text-indigo-700 shadow-sm border border-indigo-200/50">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">إضافة عميل جديد بنظام ERP الفرسان للمعارض</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">يرجى التحقق من صك المديونية وصلاحية رقم الهوية الوطنية السعودية والموقع الجغرافي للبدء</p>
                </div>
                <button 
                  type="button"
                  onClick={() => setCustomerForm({
                    name: "عبدالمحسن الشمري",
                    idNumber: "1028374829",
                    expiryDate: "2030-05-15",
                    phone: "0541234567",
                    email: "abdulrahman.sh@fursan.sa",
                    taxNumber: "310482910300003",
                    iban: "SA4380000000109283746501",
                    region: "الرياض",
                    city: "الرياض",
                    nationalAddress: "8249 طريق الملك فهد - حي الصحافة - الرياض 13321",
                    extraAddress: "شقة رقم 5",
                    status: "مفعل",
                    pledge: true,
                    points: 150,
                    imageFile: null,
                    imagePreview: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80",
                    password: "Welcome@1234",
                    confirmPassword: "Welcome@1234"
                  })}
                  className="text-xs bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-800 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer animate-pulse-subtle"
                  title="تعبئة تلقائية للنموذج لسهولة الاختبار والتجربة"
                >
                  ⚡ الملء الذكي للتجربة
                </button>
              </div>
              <button onClick={() => setIsCustomerModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-8">
              {/* Basic Info */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  البيانات الأساسية للعميل
                </h4>
                
                <div className="flex items-center gap-6 mb-6">
                  <div className="relative w-24 h-24 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                    {customerForm.imagePreview ? (
                      <img src={customerForm.imagePreview} alt="Customer Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <UploadCloud className="w-8 h-8 text-slate-400" />
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
                            setCustomerForm({...customerForm, imageFile: file, imagePreview: reader.result as string});
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </div>
                  <div>
                    <h5 className="font-medium text-slate-800">الصورة الشخصية للعميل (اختياري)</h5>
                    <p className="text-sm text-slate-500 mt-1">يُفضل أن تكون الصورة بخلفية فاتحة أو صورة شعار الشركة. الحجم الأقصى 2MB.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">اسم العميل <span className="text-red-500">*</span></label>
                    <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none hover:border-slate-300 transition-colors" value={customerForm.name || ''} onChange={e => setCustomerForm({...customerForm, name: e.target.value})} />
                  </div>
                  <div>
                    <NationalIdInput label="رقم الهوية / السجل" value={customerForm.idNumber || ''} onChange={e => setCustomerForm({...customerForm, idNumber: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">تاريخ الانتهاء <span className="text-red-500">*</span></label>
                    <input type="date" className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none hover:border-slate-300 transition-colors" value={customerForm.expiryDate || ''} onChange={e => setCustomerForm({...customerForm, expiryDate: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  معلومات الاتصال الأساسية
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <PhoneInput value={customerForm.phone || ''} onChange={e => setCustomerForm({...customerForm, phone: e.target.value})} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">البريد الإلكتروني <span className="text-red-500">*</span></label>
                    <input type="email" dir="ltr" className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-right font-mono hover:border-slate-300 transition-colors" value={customerForm.email || ''} onChange={e => setCustomerForm({...customerForm, email: e.target.value})} />
                  </div>
                </div>
              </div>

              {/* Location */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  الموقع والعنوان
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المنطقة <span className="text-red-500">*</span></label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white hover:border-slate-300 transition-colors" value={customerForm.region || ''} onChange={e => {setCustomerForm({...customerForm, region: e.target.value}); setCustomerForm(prev => ({...prev, city: ''}))}}>
                      <option value="">اختر المنطقة</option>
                      {regions.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">المدينة <span className="text-red-500">*</span></label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white hover:border-slate-300 transition-colors" 
                      value={customerForm.city || ''} 
                      onChange={e => setCustomerForm({...customerForm, city: e.target.value})}
                    >
                      <option value="">اختر المدينة</option>
                      {regions.find(r => r.name === customerForm.region)?.cities?.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">العنوان الوطني <span className="text-red-500">*</span></label>
                    <div className="relative">
                      <input type="text" className="w-full p-3 pl-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono uppercase" value={customerForm.nationalAddress || ''} onChange={e => setCustomerForm({...customerForm, nationalAddress: e.target.value})} placeholder="مثال: RWXX1234 أو العنوان الكامل" />
                      <button type="button" onClick={() => { setMapTarget({ type: 'customer', field: 'nationalAddress' }); setIsMapModalOpen(true); }} className="absolute left-3 top-1/2 -translate-y-1/2 p-1.5 bg-slate-100 hover:bg-amber-100 text-slate-400 hover:text-amber-600 rounded-lg transition-all" title="تحديد من الخريطة">
                        <MapPin className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">تفاصيل عنوان إضافية</label>
                  <input type="text" className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" value={customerForm.extraAddress || ''} onChange={e => setCustomerForm({...customerForm, extraAddress: e.target.value})} placeholder="الوصف والشارع..." />
                </div>
              </div>

              {/* Financial Optional Info */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  بيانات بنكية وضريبية (اختياري)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <TaxNumberInput label="الرقم الضريبي للمنشآت" value={customerForm.taxNumber || ''} onChange={e => setCustomerForm({...customerForm, taxNumber: e.target.value})} />
                  </div>
                  <div>
                    <IbanInput value={customerForm.iban || ''} onChange={v => setCustomerForm({...customerForm, iban: v})} />
                  </div>
                </div>
              </div>

              {/* Password Settings */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  إعدادات كلمة المرور (تسجيل الدخول)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <PasswordValidationInputs 
                    className="md:col-span-2 md:grid md:grid-cols-2 md:gap-4 flex flex-col gap-4"
                    passwordValue={customerForm.password || ''} 
                    confirmValue={customerForm.confirmPassword || ''}
                    onPasswordChange={e => setCustomerForm({...customerForm, password: e.target.value})}
                    onConfirmChange={e => setCustomerForm({...customerForm, confirmPassword: e.target.value})}
                  />
                </div>
              </div>

              {/* Loyalty and Admin settings */}
              <div>
                <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2 border-b border-slate-100 pb-2">
                  <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                  إعدادات الولاء والنظام
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">النقاط أو الرصيد</label>
                    <input type="number" className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono" value={customerForm.points ?? 0} onChange={e => setCustomerForm({...customerForm, points: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">حالة العميل</label>
                    <select className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white" value={customerForm.status || ''} onChange={e => setCustomerForm({...customerForm, status: e.target.value})}>
                      <option value="مفعل">مفعل</option>
                      <option value="موقوف">موقوف</option>
                      <option value="بانتظار الموافقة">بانتظار الموافقة</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Pledge */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 mt-6 !mb-2 flex gap-4">
                <input 
                  type="checkbox" 
                  id="customer-pledge" 
                  className="w-5 h-5 mt-1 accent-amber-500 shrink-0" 
                  checked={customerForm.pledge} 
                  onChange={e => setCustomerForm({...customerForm, pledge: e.target.checked})} 
                />
                <label htmlFor="customer-pledge" className="text-sm text-slate-700 cursor-pointer select-none">
                  <span className="font-bold block mb-1">أقر وأتعهد (إلزامي للعميل)</span>
                  أتعهد وأقر بصحة المعلومات والبيانات وأتحمل التبعات القانونية والمطالبات المالية وأي مطالبات أخرى بسبب مخالفة أنظمة المنصة.
                  {customerForm.pledge && (
                    <div className="mt-3 p-3 bg-white rounded-lg border border-slate-100 text-xs text-slate-500 font-mono flex flex-col gap-1">
                      <span>وقت الموافقة: {new Date().toLocaleString('ar-SA')}</span>
                      <span>IP Address: 192.168.1.1</span>
                      <span>طريقة الحصول: Register / API</span>
                    </div>
                  )}
                </label>
              </div>

            </div>
            
            <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between shrink-0">
              <button onClick={() => setIsCustomerModalOpen(false)} className="px-6 py-3 rounded-xl font-medium text-slate-600 hover:bg-slate-200 transition-colors">إلغاء</button>
              <div className="flex gap-3">
                <button 
                  onClick={async () => {
                    if (!customerForm.name || !customerForm.idNumber || !customerForm.expiryDate || !customerForm.phone || !customerForm.email || !customerForm.region || !customerForm.city || !customerForm.nationalAddress || !customerForm.pledge) {
                       alert("يرجى تعبئة جميع الحقول الإلزامية التي تحتوي على النجمة الحمراء، والموافقة على التعهد.");
                       return;
                    }
                    
                    const newCustomer = {
                      id: editingItem ? editingItem.id : Date.now(),
                      ...customerForm,
                      image: customerForm.imagePreview || '',
                      approvalDate: editingItem?.approvalDate || new Date().toISOString(),
                      ipAddress: editingItem?.ipAddress || '192.168.1.1',
                      acquisitionMethod: editingItem?.acquisitionMethod || 'Manual Add',
                    };
                    const emailComp = customerForm.email.toLowerCase().trim();
                    const existingDbUser = systemUsers.find(u => u.email && u.email.toLowerCase().trim() === emailComp);

                    if (editingItem && (editingItem.isDbUser || existingDbUser)) {
                      try {
                        const targetDbId = editingItem.isDbUser ? editingItem.dbId : existingDbUser?.id;
                        const res = await fetch(`/api/users/${targetDbId}`, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: customerForm.name,
                            email: customerForm.email,
                            phone: customerForm.phone,
                            role: 'عميل',
                            status: customerForm.status === 'مفعل' || customerForm.status === 'نشط' ? 'نشط' : 'موقوف',
                            region: customerForm.region,
                            city: customerForm.city,
                            isPending: false
                          })
                        });
                        const d = await res.json();
                        if (d.success) {
                          showNotification('success', 'تم تعديل بيانات العميل بنجاح في قاعدة البيانات.');
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
                      setCustomers(customers.map(c => c.id === editingItem.id ? newCustomer : c));
                    } else {
                      try {
                        const res = await fetch('/api/users', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            name: customerForm.name,
                            email: customerForm.email,
                            phone: customerForm.phone,
                            role: 'عميل',
                            status: customerForm.status === 'مفعل' || customerForm.status === 'نشط' ? 'نشط' : 'موقوف',
                            region: customerForm.region,
                            city: customerForm.city,
                            isPending: false
                          })
                        });
                        const d = await res.json();
                        if (d.success) {
                          showNotification('success', 'تم إضافة العميل الجديد وتزامن البيانات بنجاح في قاعدة البيانات!');
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
                        setCustomers(customers.map(c => c.id === editingItem.id ? newCustomer : c));
                      } else {
                        setCustomers([newCustomer, ...customers]);
                      }
                    }
                    setIsCustomerModalOpen(false);
                  }} 
                  className={`px-6 py-3 rounded-xl font-bold transition-colors shadow-lg ${customerForm.pledge ? 'bg-amber-500 text-slate-900 hover:bg-amber-600 shadow-amber-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'}`} 
                  disabled={!customerForm.pledge}
                >
                  {editingItem ? 'حفظ التعديلات' : 'إضافة العميل'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Customer View Modal */}
      {isCustomerViewModalOpen && viewingCustomer && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-4">
                {viewingCustomer.image || viewingCustomer.avatarUrl || viewingCustomer.avatar || viewingCustomer.imagePreview ? (
                  <img 
                    src={viewingCustomer.image || viewingCustomer.avatarUrl || viewingCustomer.avatar || viewingCustomer.imagePreview} 
                    alt={viewingCustomer.name} 
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" 
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-500 flex items-center justify-center font-bold text-xl border-2 border-white shadow-sm">
                    {viewingCustomer.name.charAt(0)}
                  </div>
                )}
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  ملف العميل: {viewingCustomer.name}
                </h3>
              </div>
              <button onClick={() => setIsCustomerViewModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* Card 1: ID and Status */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                   <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">تفاصيل الحساب</h4>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">الحالة</p>
                     <span className={`px-3 py-1 rounded-full text-xs font-bold border ${viewingCustomer.status === 'مفعل' ? 'bg-green-100 text-green-700 border-green-200' : viewingCustomer.status === 'بانتظار الموافقة' ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                        {viewingCustomer.status}
                     </span>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">رقم الهوية/السجل</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingCustomer.idNumber}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">تاريخ الانتهاء</p>
                     <p className="font-medium text-slate-800">{viewingCustomer.expiryDate}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">النقاط</p>
                     <p className="font-bold text-amber-500 text-xl">{viewingCustomer.points}</p>
                   </div>
                 </div>

                 {/* Card 2: Contact Info */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                   <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">معلومات الإتصال</h4>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">رقم الجوال</p>
                     <p className="font-mono text-slate-800 font-medium" dir="ltr">{viewingCustomer.phone}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">البريد الإلكتروني</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingCustomer.email}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">الرقم الضريبي</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingCustomer.taxNumber || '-'}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">رقم الآيبان</p>
                     <p className="font-mono text-slate-800 font-medium">{viewingCustomer.iban || '-'}</p>
                   </div>
                 </div>

                 {/* Card 3: Location */}
                 <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 space-y-4">
                   <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2">الموقع والعنوان</h4>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">المنقطة والمدينة</p>
                     <p className="font-medium text-slate-800">{viewingCustomer.region} - {viewingCustomer.city}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">العنوان الوطني</p>
                     <p className="font-mono text-slate-800 font-medium uppercase">{viewingCustomer.nationalAddress}</p>
                   </div>
                   <div>
                     <p className="text-xs text-slate-500 mb-1">تفاصيل إضافية</p>
                     <p className="font-medium text-slate-800">{viewingCustomer.extraAddress || '-'}</p>
                   </div>
                 </div>
              </div>

              {/* Pledge Info */}
              {viewingCustomer.pledge && (
                <div className="mt-6 bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="font-bold text-slate-700 border-b border-slate-100 pb-2 mb-4 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    بيانات تعهد العميل
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm font-mono bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div><span className="text-slate-500 inline-block w-24">وقت الموافقة:</span> <span className="font-bold text-slate-700">{new Date(viewingCustomer.approvalDate).toLocaleString('ar-SA')}</span></div>
                    <div><span className="text-slate-500 inline-block w-24">IP Address:</span> <span className="font-bold text-slate-700">{viewingCustomer.ipAddress}</span></div>
                    <div><span className="text-slate-500 inline-block w-24">طريقة الحصول:</span> <span className="font-bold text-slate-700">{viewingCustomer.acquisitionMethod || 'Manual Add'}</span></div>
                  </div>
                </div>
              )}

              {/* Customer Saved Payment Cards Section */}
              <div className="mt-6">
                <CustomerSavedCardsModal
                  customerId={String(viewingCustomer.id || '101')}
                  customerName={viewingCustomer.name}
                  bookingDetails={{
                    id: 2026101,
                    hallName: 'قاعة الأسطورة الكبرى - الرياض',
                    totalAmount: 15000,
                    remainingAmount: 5000
                  }}
                  showNotification={showNotification}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
