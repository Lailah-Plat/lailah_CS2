import React, { useState } from 'react';
import {
  ShieldAlert,
  UserCircle,
  Shield,
  Save,
  User,
  Key,
  ScrollText,
  Settings,
  MapPin,
  Wallet,
  Upload,
  ExternalLink,
  AlertCircle,
  X,
} from 'lucide-react';
import { PhoneInput } from './common/ValidationInputs';
import IbanInput from './common/IbanInput';
import GoogleMapsModal from './common/GoogleMapsModal';
import { sanitizeIban } from '../utils/validations';
import { getDigitStyle, setDigitStyle } from '../utils/digitConverter';

interface ProviderProfileComponentProps {
  providers: any[];
  setProviders: (providers: any[]) => void;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  currentProviderName: string;
  seasonRequests: any[];
  setSeasonRequests: (requests: any[]) => void;
  providerSubscription: any;
  inventorySettings: any;
  activeSettlementMethod: string;
  userRole: string;
}

export const ProviderProfileComponent = ({
  providers,
  setProviders,
  showNotification,
  currentProviderName,
  seasonRequests,
  setSeasonRequests,
  providerSubscription,
  inventorySettings,
  activeSettlementMethod,
  userRole,
}: ProviderProfileComponentProps) => {
  const currentProviderData = providers.find((p: any) => p.name === currentProviderName);
  const [localProfile, setLocalProfile] = useState(currentProviderData);
  const [activeSection, setActiveSection] = useState<'profile' | 'security' | 'documents' | 'settings'>('profile');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocType, setNewDocType] = useState('رخصة البلدية');
  const [newDocFile, setNewDocFile] = useState<any>(null);

  const platformSettlementMethod = activeSettlementMethod || localStorage.getItem('ACTIVE_SETTLEMENT_METHOD') || 'deposit_only';
  const isPlatformDepositModeActive = platformSettlementMethod === 'deposit_only';
  const isPartialPaymentAllowed = isPlatformDepositModeActive && (
    !!providerSubscription?.includesPartialPayment || 
    !!providerSubscription?.addons?.includes('partial_payment')
  );

  if (userRole === 'admin' || !currentProviderName) {
    return (
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-300" dir="rtl">
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto border border-amber-100 shadow-inner">
          <ShieldAlert className="w-8 h-8 text-amber-500" />
        </div>
        <h3 className="text-xl font-black text-slate-800">هذا القسم مخصص لمزودي الخدمة</h3>
        <p className="text-slate-500 text-sm leading-relaxed font-medium">
          مرحباً بك يا مدير النظام! حسابك الحالي بصفة "المدير العام (Admin)" لخدمة ليلة لترشيد الحفلات والمناسبات. 
          نظراً لأن حسابك يحتوي على صلاحيات إدارية عليا وإشرافية على كافة المنشآت والمزودين، فليس لديك ملف شريك منفرد هنا.
        </p>
        <p className="text-slate-400 text-xs leading-relaxed font-semibold">
          يمكنك إدارة قائمة الشركاء المسجلين وتفاصيلهم وتراخيصهم وعمولاتهم بالكامل من خلال الذهاب إلى تبويب <strong>"الشركاء والطلب"</strong> أو من خلال إعدادات النظام.
        </p>
      </div>
    );
  }

  if (!localProfile) return <div className="p-8 text-center text-slate-500">جاري تحميل البيانات...</div>;

  const handleSave = () => {
    // Get minimum allowed down payment percentage based on platform config and subscription
    const getPlatformCommissionRate = () => {
      try {
        const stored = localStorage.getItem('SETTLEMENT_CONFIGURATION');
        if (stored) {
          const config = JSON.parse(stored);
          if (config && typeof config.splitCommission === 'number') {
            return config.splitCommission;
          }
        }
      } catch {}
      return providerSubscription?.commissionRate || 10;
    };

    const commRate = getPlatformCommissionRate();
    const gatewayFeeRate = 2.5; // رسوم بوابة الدفع الإلكتروني
    const escrowMarginRate = 2.5; // هامش الضمان والاستردادات
    const minAllowed = Math.max(20, commRate + gatewayFeeRate + escrowMarginRate);

    if (isPlatformDepositModeActive && localProfile.isPartialPaymentEnabled) {
      if (!isPartialPaymentAllowed) {
        showNotification(
          'error', 
          'خطأ: لا يمكنك تفعيل الدفع الجزئي لأن ميزة "نظام الدفع الجزئي (العربون)" ليست مفعلة أو مرخصة ضمن باقة اشتراكك الحالية.'
        );
        return;
      }
      const pct = localProfile.downPaymentPercentage || 0;
      if (pct < minAllowed) {
        showNotification(
          'error', 
          `خطأ: يجب ألا تقل نسبة العربون المطلوب عن ${minAllowed}% (عمولة المنصة ${commRate}% + رسوم بوابة الدفع ${gatewayFeeRate}% + هامش الضمان ${escrowMarginRate}%)`
        );
        return;
      }
      if (pct > 80) {
        showNotification('error', 'خطأ: لا يمكن أن تزيد نسبة العربون المطلوب عن 80%');
        return;
      }
    }

    const SENSITIVE_KEYS = [
      'cr', 'commercialRecord', 'vatNumber', 'vatRecord', 'iban', 'bankName', 
      'nationalId', 'phone', 'email', 'name', 'officialName', 'nationalAddress', 
      'addressDetails', 'providerType', 'crFile', 'vatFile', 'ibanFile'
    ];

    const sensitiveChanges: Record<string, any> = {};
    const currentValues: Record<string, any> = {};
    let hasSensitiveChanges = false;

    SENSITIVE_KEYS.forEach((key) => {
      if (localProfile[key] !== undefined && localProfile[key] !== currentProviderData[key]) {
        sensitiveChanges[key] = localProfile[key];
        currentValues[key] = currentProviderData[key] || '';
        hasSensitiveChanges = true;
      }
    });

    if (hasSensitiveChanges) {
      fetch('/api/users/profile-update-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: localProfile.id,
          userName: localProfile.name || currentProviderName,
          userEmail: localProfile.email || '',
          userRole: 'provider',
          requestedChanges: sensitiveChanges,
          currentValues
        })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          showNotification('info', 'تم رفع طلب تعديل البيانات الحساسة (السجل/الأيبان/الهوية/الاسم...) إلى إدارة المنصة للاعتماد ⏳');
        }
      })
      .catch(err => console.error('Failed sensitive update submission:', err));
    }

    const updatedProfile = {
      ...localProfile,
      isPartialPaymentEnabled: isPartialPaymentAllowed ? (localProfile.isPartialPaymentEnabled ?? false) : false
    };

    setProviders(providers.map((p: any) => p.id === localProfile.id ? updatedProfile : p));
    if (!hasSensitiveChanges) {
      showNotification('success', 'تم تحديث بيانات ملفك الشخصي بنجاح 🟢');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-slate-100 rounded-3xl border-2 border-amber-500 flex items-center justify-center overflow-hidden shrink-0 shadow-lg">
            <UserCircle className="w-16 h-16 text-slate-400" />
          </div>
          <div>
            <h2 className="text-3xl font-black text-slate-800">{localProfile.name}</h2>
            <p className="text-slate-500 flex items-center gap-2 mt-1">
              <Shield className="w-4 h-4 text-emerald-500" />
              حساب مزود خدمة {localProfile.status === 'مفعل' ? 'نشط ومعتمد' : 'بانتظار المراجعة'}
            </p>
            <div className="flex gap-2 mt-3">
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg border border-amber-100">
                {localProfile.packageName || 'الباقة الأساسية'}
              </span>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg border border-emerald-100">
                {localProfile.bookingsCount}+ حجز مكتمل
              </span>
            </div>
          </div>
        </div>
        <button 
          onClick={handleSave}
          className="px-8 py-3 bg-amber-500 text-slate-900 font-bold rounded-2xl hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 flex items-center gap-2"
        >
          <Save className="w-5 h-5" /> حفظ التغييرات
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Tabs */}
        <div className="md:col-span-1 space-y-2">
          <button 
            onClick={() => setActiveSection('profile')}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold transition-all ${activeSection === 'profile' ? 'bg-blue-950 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5" /> البيانات الأساسية
            </div>
          </button>
          <button 
            onClick={() => setActiveSection('security')}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold transition-all ${activeSection === 'security' ? 'bg-blue-950 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <Key className="w-5 h-5" /> الأمان وكلمة المرور
            </div>
          </button>
          <button 
            onClick={() => setActiveSection('documents')}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold transition-all ${activeSection === 'documents' ? 'bg-blue-950 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <ScrollText className="w-5 h-5" /> الوثائق والمستندات
            </div>
          </button>
          <button 
            onClick={() => setActiveSection('settings')}
            className={`w-full flex items-center justify-between px-4 py-4 rounded-2xl font-bold transition-all ${activeSection === 'settings' ? 'bg-blue-950 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-100'}`}
          >
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5" /> الإعدادات
            </div>
          </button>
        </div>

        {/* Content Area */}
        <div className="md:col-span-3 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          {activeSection === 'profile' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <UserCircle className="w-6 h-6 text-amber-500" /> تعديل البيانات العامة
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">اسم المنشأة / المزود</label>
                    <input 
                      type="text" 
                      value={localProfile.name || ''}
                      onChange={(e) => setLocalProfile({...localProfile, name: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none transition-all"
                    />
                    
                    {/* Toggle: Show Provider Name to Customers */}
                    <div className="mt-2 pl-1">
                      <label className="flex items-center gap-2 font-bold cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={localProfile.showProviderToCustomers !== false}
                          onChange={e => setLocalProfile({...localProfile, showProviderToCustomers: e.target.checked})}
                          className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-xs font-black text-slate-700">إظهار اسم المزود للعملاء</span>
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                        (عند التفعيل يسمح بإظهار اسم المزود للعملاء في واجهة العميل، وعند التعطيل يمنع إظهار اسم المزود للعملاء في واجهة العميل)
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">نوع النشاط</label>
                    <select 
                      value={localProfile.type || ''}
                      onChange={(e) => setLocalProfile({...localProfile, type: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none"
                    >
                      <option value="منشأة">منشأة تجارية</option>
                      <option value="فرد">عمل حر (فرد)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">البريد الإلكتروني</label>
                    <input 
                      type="email" 
                      value={localProfile.email || ''}
                      onChange={(e) => setLocalProfile({...localProfile, email: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none font-mono"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <PhoneInput 
                      value={localProfile.phone || ''}
                      onChange={(e: any) => setLocalProfile({...localProfile, phone: e.target.value})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-emerald-500" /> بيانات الموقع والعنوان
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">المنطقة</label>
                    <input 
                      type="text" 
                      value={localProfile.region || ''}
                      onChange={(e) => setLocalProfile({...localProfile, region: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">المدينة</label>
                    <input 
                      type="text" 
                      value={localProfile.city || ''}
                      onChange={(e) => setLocalProfile({...localProfile, city: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">العنوان الوطني</label>
                    <input 
                      type="text" 
                      value={localProfile.nationalAddress || ''}
                      onChange={(e) => setLocalProfile({...localProfile, nationalAddress: e.target.value})}
                      className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none"
                      placeholder="مثال: 1234 رمز 5678"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-slate-100">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                  <Wallet className="w-6 h-6 text-blue-500" /> المعلومات المالية
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">رقم السجل التجاري / الهوية</label>
                    <input 
                      type="text" 
                      value={localProfile.idNumber}
                      readOnly
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-600 px-1">رقم الآيبان (IBAN)</label>
                    <IbanInput 
                      value={localProfile.iban}
                      onChange={(val: string) => setLocalProfile({...localProfile, iban: sanitizeIban(val)})}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'security' && (
            <div className="max-w-2xl mx-auto py-12">
              <div className="text-center mb-12">
                 <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                   <Key className="w-10 h-10" />
                 </div>
                 <h3 className="text-2xl font-bold text-slate-800">تحديث أمان الحساب</h3>
                 <p className="text-slate-500 mt-2">ننصح بتغيير كلمة المرور بشكل دوري لضمان حماية بياناتك</p>
              </div>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1 font-mono">كلمة المرور الحالية</label>
                  <input 
                    type="password" 
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1 font-mono">كلمة المرور الجديدة</label>
                  <input 
                    type="password" 
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-600 px-1 font-mono">تأكيد كلمة المرور الجديدة</label>
                  <input 
                    type="password" 
                    className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none"
                    placeholder="••••••••••••"
                  />
                </div>
                <button className="w-full py-4 bg-blue-950 text-white font-bold rounded-2xl hover:bg-blue-900 transition-all shadow-lg flex items-center justify-center gap-2">
                  تحديث كلمة المرور
                </button>
              </div>
            </div>
          )}

          {activeSection === 'documents' && (
            <div className="space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                  <ScrollText className="w-6 h-6 text-amber-500" /> الوثائق والمستندات القانونية
                </h3>
                <button 
                  onClick={() => {
                    setNewDocName('رخصة البلدية');
                    setNewDocType('رخصة البلدية');
                    setNewDocFile(null);
                    setIsUploadModalOpen(true);
                  }}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 text-sm font-bold rounded-xl transition-all flex items-center gap-2 shadow-sm"
                >
                  <Upload className="w-4 h-4" /> رفع مستند جديد
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(localProfile.documents || []).map((doc: any, i: number) => (
                  <div key={i} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between group hover:bg-white hover:border-amber-500/50 transition-all cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors">
                        <ScrollText className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{doc.name}</p>
                        <p className="text-xs text-slate-500">تم الرفع في: {doc.uploadDate}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors" title="استعراض">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
                
                {/* Active Upload Slot for Zakat */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between group hover:bg-white hover:border-amber-500/50 transition-all cursor-pointer relative overflow-hidden">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-100 shadow-sm text-slate-400 group-hover:text-amber-500 transition-colors">
                      <ScrollText className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">شهادة الزكاة والدخل</p>
                      <p className="text-xs text-slate-500">
                        {localProfile.documents?.find((d: any) => d.name === 'شهادة الزكاة والدخل') 
                          ? `تم الرفع في: ${localProfile.documents.find((d: any) => d.name === 'شهادة الزكاة والدخل').uploadDate}` 
                          : 'اضغط للرفع'}
                      </p>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*,.pdf"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const newDoc = {
                          name: 'شهادة الزكاة والدخل',
                          uploadDate: new Date().toLocaleDateString('ar-SA'),
                          file: file.name
                        };
                        const updatedDocs = [
                          ...(localProfile.documents || []).filter((d: any) => d.name !== 'شهادة الزكاة والدخل'),
                          newDoc
                        ];
                        setLocalProfile({...localProfile, documents: updatedDocs});
                        showNotification('success', 'تم رفع شهادة الزكاة والدخل بنجاح');
                      }
                    }}
                  />
                  <div className="flex items-center gap-2">
                    <button className="p-2 text-slate-400 group-hover:text-amber-500 transition-colors">
                      <Upload className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 mt-8">
                 <div className="flex gap-4">
                   <AlertCircle className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                   <div className="space-y-1">
                     <h4 className="font-bold text-amber-700">ملاحظة أمنية</h4>
                     <p className="text-sm text-amber-600/80 leading-relaxed">
                       المستندات المرفوعة يتم تشفيرها وتخزينها بأمان. الوصول لهذه الملفات مقتصر فقط على فريق المراجعة في إدارة النظام ولأغراض التحقق النظامي.
                     </p>
                   </div>
                 </div>
              </div>

              {/* Upload Document Modal */}
              {isUploadModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4">
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setIsUploadModalOpen(false)}></div>
                  <div className="relative bg-white rounded-3xl max-w-lg w-full p-6 md:p-8 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-xl font-bold text-slate-800">رفع مستند جديد</h4>
                      <button 
                        onClick={() => setIsUploadModalOpen(false)}
                        className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Document Type Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 block px-1">نوع المستند</label>
                        <select 
                          value={newDocType}
                          onChange={(e) => {
                            setNewDocType(e.target.value);
                            if (e.target.value !== 'أخرى') {
                              setNewDocName(e.target.value);
                            } else {
                              setNewDocName('');
                            }
                          }}
                          className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-sm"
                        >
                          <option value="رخصة البلدية">رخصة البلدية</option>
                          <option value="السجل التجاري">السجل التجاري</option>
                          <option value="عقد تأسيس المنشأة">عقد تأسيس المنشأة</option>
                          <option value="شهادة تسجيل ضريبة القيمة المضافة">شهادة تسجيل ضريبة القيمة المضافة</option>
                          <option value="شهادة الزكاة والدخل">شهادة الزكاة والدخل</option>
                          <option value="شهادة الآيبان">شهادة الآيبان</option>
                          <option value="أخرى">نوع آخر (قم بالتسمية)</option>
                        </select>
                      </div>

                      {/* Custom Title if 'أخرى' is selected */}
                      {newDocType === 'أخرى' && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-200">
                          <label className="text-sm font-bold text-slate-600 block px-1">اسم المستند</label>
                          <input 
                            type="text" 
                            placeholder="مثال: رخصة تنظيم الفعاليات"
                            value={newDocName}
                            onChange={(e) => setNewDocName(e.target.value)}
                            className="w-full p-3.5 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none text-sm"
                          />
                        </div>
                      )}

                      {/* Custom Drag & Drop / Click Upload Component */}
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 block px-1">ملف المستند</label>
                        <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-8 hover:border-amber-500 transition-colors flex flex-col items-center justify-center gap-3 bg-slate-50/50 group">
                          <input 
                            type="file" 
                            accept="image/*,.pdf"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) setNewDocFile(f);
                            }}
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                          />
                          <div className="w-12 h-12 bg-white rounded-xl border border-slate-100 flex items-center justify-center text-slate-400 group-hover:text-amber-500 shadow-sm transition-colors">
                            <Upload className="w-6 h-6" />
                          </div>
                          {newDocFile ? (
                            <div className="text-center">
                              <p className="font-bold text-emerald-600 text-sm">{newDocFile.name}</p>
                              <p className="text-xs text-slate-400 mt-1">حجم الملف: {(newDocFile.size / 1024).toFixed(1)} KB</p>
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="font-bold text-slate-700 text-sm">اسحب الملف هنا أو انقر للتصفح</p>
                              <p className="text-xs text-slate-400 mt-1">يدعم PDF وصور الـ JPG والـ PNG بحد أقصى 5MB</p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4 pt-4 border-t border-slate-100">
                        <button 
                          onClick={() => {
                            const nameToUse = newDocType === 'أخرى' ? newDocName : newDocType;
                            if (!nameToUse.trim()) {
                              showNotification('error', 'الرجاء إدخال اسم المستند أولاً');
                              return;
                            }
                            if (!newDocFile) {
                              showNotification('error', 'الرجاء اختيار ملف المستند أولاً');
                              return;
                            }

                            const newDoc = {
                              name: nameToUse,
                              uploadDate: new Date().toLocaleDateString('ar-SA'),
                              file: newDocFile.name
                            };
                            const updatedDocs = [
                              ...(localProfile.documents || []).filter((d: any) => d.name !== nameToUse),
                              newDoc
                            ];
                            const updatedProfile = { ...localProfile, documents: updatedDocs };
                            setLocalProfile(updatedProfile);
                            // Persist to provider list
                            setProviders(providers.map((p: any) => p.id === updatedProfile.id ? updatedProfile : p));
                            
                            showNotification('success', `تم رفع مستند "${nameToUse}" بنجاح وجارٍ مراجعته`);
                            setIsUploadModalOpen(false);
                          }}
                          className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 font-bold rounded-xl transition-all text-sm"
                        >
                          تأكيد الرفع والمستند
                        </button>
                        <button 
                          onClick={() => setIsUploadModalOpen(false)}
                          className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl transition-all text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSection === 'settings' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
              <div>
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3 border-b border-slate-100 pb-4">
                  <Settings className="w-6 h-6 text-amber-500" /> إعدادات النظام والضريبة والأرقام المعتمدة
                </h3>
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                  
                  {/* لغة الأرقام المعتمدة للمزود */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm gap-4">
                    <div>
                      <p className="font-black text-slate-800 text-lg">لغة الأرقام المعتمدة في التطبيق</p>
                      <p className="text-slate-500 text-sm mt-1">تحديد طراز ونظام عرض الأرقام في جميع الواجهات والتقارير المالية والملفات المصدرة</p>
                    </div>
                    <div className="w-full sm:w-auto shrink-0">
                      <select 
                        value={getDigitStyle()} 
                        onChange={(e) => {
                          const selectedStyle = e.target.value as 'western' | 'eastern';
                          setDigitStyle(selectedStyle);
                        }}
                        className="p-3 rounded-xl border border-slate-200 outline-none bg-white text-sm font-bold text-slate-700 min-w-[240px]"
                      >
                        <option value="eastern">١- الأرقام المشرقية (الهندية): (١، ٢، ٣، ٤، ٩)</option>
                        <option value="western">٢- الأرقام الغربية (الإنجليزية): (1, 2, 3, 6)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <div>
                      <p className="font-black text-slate-800 text-lg">ضريبة القيمة المضافة (VAT)</p>
                      <p className="text-slate-500 text-sm mt-1">تفعيل أو تعطيل احتساب الضريبة في الفواتير والطلبات</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {!(localProfile.isVatEnabled ?? true) && (
                        <span className="text-amber-600 font-bold text-sm bg-amber-50 px-3 py-1 rounded-lg border border-amber-100 animate-pulse">
                          معفى لعدم انطباقها نظاما
                        </span>
                      )}
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={localProfile.isVatEnabled ?? true}
                          onChange={(e) => setLocalProfile({...localProfile, isVatEnabled: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                      تنبيه: الأفراد والمنشآت الصغيرة التي لا يتجاوز دخلها السنوي الحد الإلزامي تظل معفاة من ضريبة القيمة المضافة. يرجى التأكد من اختيار الإعداد الصحيح لتجنب أي مخالفات نظامية.
                    </p>
                  </div>

                  {/* New Financial Flow Settings for Provider */}
                  <div className="pt-6">
                    <h4 className="font-black text-slate-800 mb-4 flex items-center gap-2">
                       <Wallet className="w-5 h-5 text-indigo-500" /> تفضيلات الدفع الجزئي (العربون)
                    </h4>

                    {!isPlatformDepositModeActive && (
                      <div className="mb-6 p-4 bg-amber-50 rounded-2xl border border-amber-200 text-right flex items-start gap-3">
                        <span className="text-xl">⚠️</span>
                        <div className="text-xs text-amber-900 leading-relaxed font-sans">
                          <strong>تنبيه الإدارة المالية:</strong> نظام الدفع الجزئي (العربون) مقيد ومغلق حالياً من قِبل إدارة المنصة. المنصة تعمل حالياً بنظام تسوية يستوجب تحصيل ودفع كامل قيمة الفاتورة بنسبة <strong>100%</strong> مقدماً (عبر {platformSettlementMethod === 'split_payments' ? 'التقسيم الفوري Split' : 'المقاصة الأسبوعية'}). لا يمكنك تفعيل الدفع الجزئي أو تعديل الخصائص إلى حين قيام الإدارة بالتحول لنموذج العربون المقسم.
                        </div>
                      </div>
                    )}

                    {isPlatformDepositModeActive && !isPartialPaymentAllowed && (
                      <div className="mb-6 p-4 bg-red-50 rounded-2xl border border-red-200 text-right flex items-start gap-3">
                        <span className="text-xl">🔒</span>
                        <div className="text-xs text-red-900 leading-relaxed font-sans">
                          <strong>ميزة مقيدة:</strong> نظام الدفع الجزئي (العربون) غير متوفر لملفك الشخصي لأن ميزة "نظام الدفع الجزئي (العربون)" ليست جزءاً من باقة اشتراكك الحالية ولم يتم تفعيلها كإضافة إضافية. يرجى ترقية الباقة أو تفعيلها عبر تبويب "الترقيات والميزات الإضافية" لتتمكن من تنشيط هذا الخيار لعملائك.
                        </div>
                      </div>
                    )}

                    <div className={`flex items-center justify-between p-6 rounded-2xl border border-slate-100 shadow-sm mb-6 transition-all ${isPartialPaymentAllowed ? 'bg-white' : 'bg-slate-50 border-dashed opacity-80 cursor-not-allowed'}`}>
                      <div>
                        <p className={`font-black text-lg ${isPartialPaymentAllowed ? 'text-slate-800' : 'text-slate-400'}`}>تفعيل نظام الدفع الجزئي</p>
                        <p className="text-slate-500 text-sm mt-1">السماح للعملاء بدفع عربون مقدم والمتبقي لاحقاً (بشرط تفعيله من الإدارة)</p>
                      </div>
                      <label className={`relative inline-flex items-center ${isPartialPaymentAllowed ? 'cursor-pointer' : 'cursor-not-allowed'}`}>
                        <input 
                          type="checkbox" 
                          disabled={!isPartialPaymentAllowed}
                          checked={isPartialPaymentAllowed && (localProfile.isPartialPaymentEnabled ?? false)}
                          onChange={(e) => setLocalProfile({...localProfile, isPartialPaymentEnabled: e.target.checked})}
                          className="sr-only peer" 
                        />
                        <div className={`w-14 h-7 rounded-full peer peer-focus:outline-none after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${isPartialPaymentAllowed ? 'bg-slate-200 peer-checked:bg-emerald-500 peer-checked:after:-translate-x-full peer-checked:after:border-white' : 'bg-slate-100 peer-checked:bg-emerald-250 cursor-not-allowed disabled:opacity-55'}`}></div>
                      </label>
                    </div>

                    <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm transition-opacity ${(!isPartialPaymentAllowed || !(localProfile.isPartialPaymentEnabled ?? false)) ? 'opacity-40 pointer-events-none' : ''}`}>
                      <div className="space-y-2 md:col-span-2 bg-slate-50/50 p-4 rounded-xl border border-slate-100 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                        <div className="text-right">
                          <label className="text-sm font-bold text-slate-800">بروتوكول احتساب مهلة سداد المتبقي</label>
                          <p className="text-[11px] text-slate-500 mt-1 font-sans">اختر المنهجية القانونية لتحديد الموعد النهائي لتحصيل باقي قيمة الحجز إلكترونياً</p>
                        </div>
                        <div className="flex bg-slate-200 p-1 rounded-xl border border-slate-250 shrink-0">
                          <button
                            type="button"
                            onClick={() => setLocalProfile({...localProfile, remainingPaymentDeadlineType: 'before_booking'})}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${(!localProfile.remainingPaymentDeadlineType || localProfile.remainingPaymentDeadlineType === 'before_booking') ? 'bg-amber-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            قبل موعد الحجز
                          </button>
                          <button
                            type="button"
                            onClick={() => setLocalProfile({...localProfile, remainingPaymentDeadlineType: 'within_days'})}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${(localProfile.remainingPaymentDeadlineType === 'within_days') ? 'bg-amber-500 text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                          >
                            خلال فترة من الحجز
                          </button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 px-1 flex items-center justify-between">
                          <span className="flex items-center gap-1.5">
                            <span>نسبة العربون المطلوب (%)</span>
                            <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-extrabold font-sans">تغطية العمولات وبوابات الدفع</span>
                          </span>
                          <span className="text-xs font-mono text-amber-700 font-bold">
                            حد أدنى مطلوب: {Math.max(20, (providerSubscription?.commissionRate || 10) + 5)}%
                          </span>
                        </label>
                        <input 
                          type="number" 
                          placeholder="مثال: 30"
                          min={Math.max(20, (providerSubscription?.commissionRate || 10) + 5)}
                          value={localProfile.downPaymentPercentage || ''}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setLocalProfile({...localProfile, downPaymentPercentage: val});
                          }}
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none font-mono"
                        />
                        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-3 text-xs text-amber-900 space-y-1.5 mt-2">
                          <div className="flex items-center gap-1.5 font-bold text-amber-950">
                            <span className="text-sm">⚠️</span>
                            <span>تنبيه إلزامي للمزود بشأن تحديد الحد الأدنى للعربون:</span>
                          </div>
                          <p className="text-[11px] leading-relaxed text-amber-800">
                            نسبة العربون المحددة يجب ألا تقل عن <strong>الحد الأدنى المطلوب ({Math.max(20, (providerSubscription?.commissionRate || 10) + 5)}%)</strong>، وهو إجمالي محتسب يغطي:
                            <strong> عمولة المنصة ({providerSubscription?.commissionRate || 10}%)</strong> + 
                            <strong> رسوم معالجة بوابات الدفع (2.5%)</strong> + 
                            <strong> هامش الضمان والاستردادات (2.5%)</strong>.
                          </p>
                          <p className="text-[10px] text-amber-700/90 italic font-medium">
                            * هذه الموازنة تضمن عدم تحميل المنصة أو المزود لأي مستحقات مكشوفة أو التزامات مالية غير ملزمة بها عند معالجة الحجوزات.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-600 px-1">
                          {localProfile.remainingPaymentDeadlineType === 'within_days' ? 'مهلة دفع المتبقي بعد تأكيد الطلب' : 'موعد دفع المتبقي قبل الحجز'}
                        </label>
                        <select 
                          value={localProfile.remainingBalanceDeadline || '3 أيام'}
                          onChange={(e) => setLocalProfile({...localProfile, remainingBalanceDeadline: e.target.value})}
                          className="w-full p-4 rounded-2xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-sans text-xs sm:text-sm"
                        >
                          <option value="24 ساعة">24 ساعة</option>
                          <option value="3 أيام">3 أيام (72 ساعة)</option>
                          <option value="5 أيام">5 أيام</option>
                          <option value="7 أيام">7 أيام (أسبوع كامل)</option>
                          <option value="10 أيام">10 أيام</option>
                          <option value="15 يوم">15 يوم (نصف شهر)</option>
                          <option value="30 يوم">30 يوم (شهر كامل)</option>
                        </select>
                        <p className="text-[10px] text-slate-400 leading-relaxed">
                          {localProfile.remainingPaymentDeadlineType === 'within_days' 
                            ? 'يلتزم العميل بسداد باقي المبلغ إلكترونياً للمنصة خلال هذه المهلة من تاريخ قبول الإدارة/المزود للحجز لتلافي سحب المقعد.' 
                            : 'يتوجب على العميل تصفية وسداد المتبقي إلكترونياً بالموقع قبل هذا الموعد من تاريخ بدء الخدمة، أو يلغى الحجز تلقائياً.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
