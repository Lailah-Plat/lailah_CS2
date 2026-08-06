import React, { useState } from 'react';
import { 
  Lock, Sparkles, Power, Pencil, Trash2, PlusCircle, Plus, Search, Users, 
  CheckCircle2, CreditCard as CreditCardIcon, Wallet, Percent, Landmark, 
  ShieldCheck, ShieldAlert, X, RefreshCw, Settings, Key, Shield, Info
} from 'lucide-react';
import { PhoneInput } from './common/ValidationInputs';

interface ProviderStaffManagementProps {
  userRole: string;
  currentProviderName: string;
  currentUserName: string;
  providerSubscription: any;
  setProviderSubscription: React.Dispatch<React.SetStateAction<any>>;
  providers: any[];
  halls: any[];
  services: any[];
  providerStaffList: any[];
  setProviderStaffList: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  formatCurrency: (val: number) => string;
  setActiveTab: (tab: string) => void;
  additionalFeatures?: any[];
  purchasedStaffSlots?: number;
  handleBuyStaffSlot: (count: number) => void;
  paymentSettings?: any;
  adminActiveGateway?: string;
}

export default function ProviderStaffManagement({
  userRole,
  currentProviderName,
  currentUserName,
  providerSubscription,
  setProviderSubscription,
  providers = [],
  halls = [],
  services = [],
  providerStaffList = [],
  setProviderStaffList,
  showNotification,
  formatCurrency,
  setActiveTab,
  additionalFeatures = [
    { id: 'provider_staff', priceMonthly: 50, priceYearly: 500 }
  ],
  purchasedStaffSlots = 0,
  handleBuyStaffSlot,
  paymentSettings = {},
  adminActiveGateway = 'moyasar'
}: ProviderStaffManagementProps) {
  // Provider team filtering states
  const [searchProviderStaffQuery, setSearchProviderStaffQuery] = useState('');
  const [filterProviderStaffRole, setFilterProviderStaffRole] = useState('');
  const [filterProviderStaffStatus, setFilterProviderStaffStatus] = useState('');

  // Admin team filtering states
  const [adminProviderStaffSearchQuery, setAdminProviderStaffSearchQuery] = useState('');
  const [adminProviderStaffFilterProvider, setAdminProviderStaffFilterProvider] = useState('');
  const [adminProviderStaffFilterRole, setAdminProviderStaffFilterRole] = useState('');
  const [adminProviderStaffFilterStatus, setAdminProviderStaffFilterStatus] = useState('');

  // Form states and popup triggers
  const [isProviderStaffModalOpen, setIsProviderStaffModalOpen] = useState(false);
  const [editingProviderStaff, setEditingProviderStaff] = useState<any>(null);
  const [providerStaffForm, setProviderStaffForm] = useState<any>({
    name: '',
    phone: '',
    email: '',
    role: 'مشرف قاعة الحفلات',
    status: 'نشط',
    monthlyCost: 50,
    billingCycle: 'monthly',
    permissions: {
      bookings: false,
      halls: false,
      services: false,
      marketing: false,
      messages: false,
      finance: false,
      specificHalls: [],
      specificServices: []
    }
  });

  // Purchased seats triggers
  const [isBuyStaffSlotsModalOpen, setIsBuyStaffSlotsModalOpen] = useState(false);
  const [buyStaffSlotsCountInput, setBuyStaffSlotsCountInput] = useState(1);
  const [isProcessingStaffPayment, setIsProcessingStaffPayment] = useState(false);
  const [paymentFinishedSuccess, setPaymentFinishedSuccess] = useState(false);
  const [staffPaymentForm, setStaffPaymentForm] = useState<any>({
    cardName: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvv: '',
    paymentMethod: 'credit_card'
  });

  // STC & Bank details
  const [stcPhoneInput, setStcPhoneInput] = useState('');
  const [stcOtpRequested, setStcOtpRequested] = useState(false);
  const [stcOtpInput, setStcOtpInput] = useState('');
  const [bankSenderName, setBankSenderName] = useState('');

  // Quota bonus support (Admin)
  const [selectedQuotaProvider, setSelectedQuotaProvider] = useState('');
  const [quotaBonusInput, setQuotaBonusInput] = useState<number | ''>('');
  const [bonusSlotsTrigger, setBonusSlotsTrigger] = useState(0);

  // Admin Editing state
  const [adminEditingStaff, setAdminEditingStaff] = useState<any>(null);
  const [isAdminEditingStaffModalOpen, setIsAdminEditingStaffModalOpen] = useState(false);
  const [adminEditingStaffForm, setAdminEditingStaffForm] = useState<any>({
    name: '',
    role: 'مشرف قاعة الحفلات',
    phone: '',
    email: '',
    status: 'نشط',
    permissions: {
      bookings: false,
      halls: false,
      services: false,
      marketing: false,
      messages: false,
      finance: false
    }
  });

  const staffAddonFeature = additionalFeatures.find(f => f.id === 'provider_staff');
  const staffPriceMonthly = staffAddonFeature ? staffAddonFeature.priceMonthly : 50;
  const staffPriceYearly = staffAddonFeature ? staffAddonFeature.priceYearly : 500;

  // Limits calculation
  const isCorporatePackage = providerSubscription?.packageName === 'باقة الشركات والمؤسسات' || 
                              providerSubscription?.packageName_display?.includes('المؤسسات') || 
                              providerSubscription?.packageName_display?.includes('الشركات');
  
  const isBasicPackage = providerSubscription?.packageName === 'الباقة الأساسية' || providerSubscription?.id === 'basic';
  const rawSeatsLimit = isBasicPackage ? '0' : providerSubscription?.staffSeatsLimit;
  const isUnlimitedSeats = rawSeatsLimit === '' || rawSeatsLimit === undefined || rawSeatsLimit === null || String(rawSeatsLimit).trim() === '' || String(rawSeatsLimit).toLowerCase() === 'unlimited';
  const baseStaffLimit = isUnlimitedSeats ? 999999 : (rawSeatsLimit === '0' || rawSeatsLimit === 0 ? 0 : (parseInt(String(rawSeatsLimit), 10) || (isCorporatePackage ? 15 : 3)));
  
  const bonusStaffSlots = (() => {
    try {
      const stored = localStorage.getItem(`PROVIDER_BONUS_STAFF_SLOTS_${currentProviderName}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch { return 0; }
  })();
  const actualPurchasedStaffSlots = Number(providerSubscription?.purchasedStaffSlots ?? purchasedStaffSlots ?? 0);
  const totalSlots = baseStaffLimit + actualPurchasedStaffSlots + bonusStaffSlots;

  // Render Client/Partner view
  const renderProviderStaffView = () => {
    if (totalSlots === 0) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500 text-right font-sans" dir="rtl">
          <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
            <Lock className="w-8 h-8 text-amber-500 animate-bounce" />
          </div>
          <h3 className="text-xl font-extrabold text-slate-800 mb-2 font-sans">هذه الميزة غير مفعلة في باقتك الحالية</h3>
          <p className="text-slate-500 text-xs max-w-sm mb-6 leading-relaxed font-semibold">
            إن ميزة نظام إدارة العاملين وصلاحيات الفريق تدرج ضمن الميزات المتقدمة وتتطلب الترقية للباقة الأعلى، أو الاشتراك فيها كميزة إضافية بشكل منفرد.
          </p>
          <button
            onClick={() => setActiveTab('subscriptions')}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105 text-xs font-sans cursor-pointer"
          >
            <Sparkles className="w-5 h-5 text-slate-900" />
            ترقية الباقة أو تفعيل المحتوى الآن
          </button>
        </div>
      );
    }

    // Filter staff belonging to the current provider only
    const myStaff = providerStaffList.filter(s => s.providerName === currentProviderName);
    const usedSlots = myStaff.length;
    const remainingSlots = Math.max(0, totalSlots - usedSlots);

    // Filter staff by search/role/status
    const filtered = myStaff.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchProviderStaffQuery.toLowerCase()) || 
                          (s.email || '').toLowerCase().includes(searchProviderStaffQuery.toLowerCase()) ||
                          s.phone.includes(searchProviderStaffQuery);
      const matchRole = filterProviderStaffRole ? s.role === filterProviderStaffRole : true;
      const matchStatus = filterProviderStaffStatus ? s.status === filterProviderStaffStatus : true;
      return matchSearch && matchRole && matchStatus;
    });

    // Obtain provider's specific halls & services
    const myHalls = halls.filter(h => h.provider === currentProviderName);
    const myServices = services.filter(s => s.provider === currentProviderName);

    const openAddStaffModal = () => {
      setEditingProviderStaff(null);
      setProviderStaffForm({
        name: '',
        phone: '',
        email: '',
        role: 'مشرف قاعة الحفلات',
        status: 'نشط',
        monthlyCost: staffPriceMonthly,
        billingCycle: 'monthly',
        permissions: {
          bookings: false,
          halls: false,
          services: false,
          marketing: false,
          messages: false,
          finance: false,
          specificHalls: [],
          specificServices: []
        }
      });
      setIsProviderStaffModalOpen(true);
    };

    const openEditStaffModal = (worker: any) => {
      setEditingProviderStaff(worker);
      setProviderStaffForm({
        name: worker.name,
        phone: worker.phone,
        email: worker.email,
        role: worker.role,
        status: worker.status,
        monthlyCost: worker.monthlyCost || 50,
        billingCycle: worker.billingCycle || 'monthly',
        permissions: {
          bookings: worker.permissions?.bookings || false,
          halls: worker.permissions?.halls || false,
          services: worker.permissions?.services || false,
          marketing: worker.permissions?.marketing || false,
          messages: worker.permissions?.messages || false,
          finance: worker.permissions?.finance || false,
          specificHalls: worker.permissions?.specificHalls || [],
          specificServices: worker.permissions?.specificServices || []
        }
      });
      setIsProviderStaffModalOpen(true);
    };

    const handleSaveStaffForm = (e: React.FormEvent) => {
      e.preventDefault();
      if (!providerStaffForm.name.trim() || !providerStaffForm.role.trim() || !providerStaffForm.phone.trim()) {
        showNotification('error', 'يرجى تعبئة كافة الحقول الأساسية المطلوبة.');
        return;
      }

      let cleanPhone = providerStaffForm.phone.trim().replace(/[\s\(\)\-\+]/g, '');
      while (cleanPhone.startsWith('966966')) {
        cleanPhone = cleanPhone.replace(/^966966/, '966');
      }
      if (cleanPhone.startsWith('05')) {
        cleanPhone = '966' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
        cleanPhone = '966' + cleanPhone;
      }
      if (!cleanPhone.startsWith('9665') || cleanPhone.length !== 12) {
        showNotification('error', 'يرجى إدخال رقم جوال سعودي صحيح يتكون من 10 أرقام ويبدأ بـ 05 (مثال: 05XXXXXXXX)');
        return;
      }

      const cycle = providerStaffForm.billingCycle || 'monthly';
      
      if (editingProviderStaff) {
        // Edit Mode
        const updated = providerStaffList.map(s => {
          if (s.id === editingProviderStaff.id) {
            return {
              ...s,
              name: providerStaffForm.name,
              phone: providerStaffForm.phone,
              email: providerStaffForm.email,
              role: providerStaffForm.role,
              status: providerStaffForm.status,
              billingCycle: cycle,
              monthlyCost: cycle === 'yearly' ? 500 : 50,
              permissions: { ...providerStaffForm.permissions }
            };
          }
          return s;
        });
        setProviderStaffList(updated);
        showNotification('success', `تم تعديل بيانات الموظف (${providerStaffForm.name}) وصلاحياته بنجاح.`);
      } else {
        // Add Mode - check limit first
        if (usedSlots >= totalSlots) {
          showNotification('error', `لقد استهلكت جميع المقاعد المتاحة (${totalSlots} مقاعد). يرجى شراء مقاعد إضافية لزيادتها والقدرة على إضافة الموظفين.`);
          return;
        }

        const newWorker = {
          id: Date.now(),
          name: providerStaffForm.name,
          phone: providerStaffForm.phone,
          email: providerStaffForm.email || `${Date.now()}@lailah.com`,
          role: providerStaffForm.role,
          providerName: currentProviderName,
          status: providerStaffForm.status,
          joinedAt: new Date().toISOString().split('T')[0],
          monthlyCost: cycle === 'yearly' ? 500 : 50,
          billingCycle: cycle,
          permissions: { ...providerStaffForm.permissions }
        };

        setProviderStaffList([newWorker, ...providerStaffList]);
        showNotification('success', `تم تعيين الموظف الجديد (${providerStaffForm.name}) وبانتظار تفعيله للنظام بنجاح.`);
      }
      setIsProviderStaffModalOpen(false);
    };

    const handleDeleteStaff = (id: number, name: string) => {
      // In standalone form, we trigger setProviderStaffList filtered directly or trigger a parent delete callback
      const answer = window.confirm(`هل أنت متأكد من حذف الموظف (${name}) بشكل كامل؟`);
      if (answer) {
        setProviderStaffList(providerStaffList.filter(s => s.id !== id));
        showNotification('success', `تم حذف الموظف (${name}) وإخلاء المقعد.`);
      }
    };

    return (
      <div className="space-y-6 text-right font-sans" dir="rtl">
        {/* Top Header Card */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-amber-950 p-6 sm:p-8 rounded-3xl text-white shadow-xl relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full filter blur-3xl -translate-x-12 -translate-y-12"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div className="space-y-2">
              <span className="bg-amber-500/20 text-amber-400 text-xs font-bold px-3 py-1 rounded-full border border-amber-500/30">
                ⭐ ميزة لوحة الشركاء الذكية
              </span>
              <h2 className="text-3xl font-black mt-1 leading-tight">نظام إدارة العاملين وصلاحيات الفريق</h2>
              <p className="text-slate-300 text-xs max-w-xl leading-relaxed">
                قم ببناء هيكلك الإداري وتعيين الأدوار والمشرفين لقاعاتك وخدماتك. يمكنك التحكم بصلاحيات معينة لضمان سرية البيانات وكفاءة العمل التشغيلي.
              </p>
            </div>

            {/* Quick Pricing Specs & Slots Widget */}
            <div className="bg-white/10 backdrop-blur-md border border-white/10 p-5 rounded-2xl w-full md:w-80 space-y-3">
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <span className="text-xs text-slate-300">الباقة الحالية للشركة</span>
                <span className="text-xs font-bold text-amber-400">
                  {providerSubscription?.packageName || 'الباقة الحالية'} ({isUnlimitedSeats ? 'مقاعد غير محدودة ♾️' : `${baseStaffLimit} مقاعد`})
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-300 text-xs">مشغولة / إجمالي المقاعد:</span>
                <span className="font-mono font-bold text-lg text-white">
                  {usedSlots} <span className="text-xs text-slate-400">من</span> {isUnlimitedSeats ? 'غير محدود ♾️' : totalSlots}
                </span>
              </div>
              {bonusStaffSlots > 0 && !isUnlimitedSeats && (
                <div className="text-[10px] bg-amber-500/20 text-amber-400 font-bold px-2 py-1 rounded border border-amber-500/20 text-center leading-tight">
                  تم منحك +{bonusStaffSlots} مقاعد بونص إضافية مجاناً من قِبَل المنصة
                </div>
              )}
              {/* Progress bar */}
              <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-amber-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${isUnlimitedSeats ? Math.min(100, (usedSlots / 30) * 100) : Math.min(100, (usedSlots / totalSlots) * 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-slate-400">
                <span>المقاعد الشاغرة: {isUnlimitedSeats ? 'مفتوح ♾️' : `${remainingSlots} مقعد`}</span>
                <span>تكلفة المقعد الإضافي: {staffPriceMonthly} ر.س / شهرياً</span>
              </div>
            </div>
          </div>
        </div>

        {/* Subscription Seats Management Panel */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          <div className="space-y-1.5">
            <h3 className="font-extrabold text-slate-800 text-base">ترقية الطاقة الاستيعابية لإدارة العاملين</h3>
            <p className="text-slate-500 text-xs max-w-2xl leading-relaxed">
              تتيح لك المنصة شراء مقاعد إضافية مستقلة لإضافة المزيد من موظفيك بفريق الدعم أو التنظيم. يتم الفوترة تلقائياً ضمن فاتورة اشتراك المنصة الموحد.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <button 
              onClick={() => {
                setBuyStaffSlotsCountInput(1);
                setPaymentFinishedSuccess(false);
                setIsProcessingStaffPayment(false);
                setStaffPaymentForm({
                  cardName: '',
                  cardNumber: '',
                  cardExpiry: '',
                  cardCvv: '',
                  paymentMethod: 'credit_card'
                });
                setIsBuyStaffSlotsModalOpen(true);
              }}
              className="px-5 py-3 bg-amber-500 text-slate-950 font-black text-xs rounded-xl hover:bg-amber-600 active:scale-95 transition-all flex items-center gap-2 font-sans cursor-pointer"
              id="provider-buy-extra-staff-slots-trigger"
            >
              <PlusCircle className="w-4 h-4 text-slate-950" />
              شراء مقاعد إضافية ({staffPriceMonthly} ر.س / شهري للمقعد)
            </button>
            <button 
              onClick={() => {
                setActiveTab('subscriptions');
                showNotification('info', 'تم نقلك للباقات؛ اختر (باقة الشركات والمؤسسات) أو أي باقة تليق بك وأتمم إجراءات سداد الاشتراك لتفعيلها.');
              }}
              className="px-5 py-3 bg-slate-900 text-white font-extrabold text-xs rounded-xl hover:bg-slate-800 transition-all font-sans cursor-pointer"
            >
              الترقية لباقة الشركات والمؤسسات
            </button>
          </div>
        </div>

        {/* Filters and Search Tools */}
        <div className="bg-white p-4 rounded-3xl border border-slate-150/80 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute right-3.5 top-3.5 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="البحث بالاسم، البريد الإلكتروني أو الجوال..." 
              value={searchProviderStaffQuery}
              onChange={e => setSearchProviderStaffQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
            <select 
              value={filterProviderStaffRole}
              onChange={e => setFilterProviderStaffRole(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none cursor-pointer"
            >
              <option value="">جميع المسميات الوظيفية</option>
              <option value="مشرف قاعة الحفلات">مشرف قاعة</option>
              <option value="مدير تسويق ومنسق خدمات الشركاء">مدير تسويق خدمات</option>
              <option value="منسق حجوزات مبيعات">منسق مبيعات</option>
              <option value="فريق الدعم والعمليات">دعم تشغيلي</option>
            </select>

            <select 
              value={filterProviderStaffStatus}
              onChange={e => setFilterProviderStaffStatus(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none cursor-pointer"
            >
              <option value="">جميع الحالات</option>
              <option value="نشط">نشط (فعال)</option>
              <option value="موقوف">موقوف مؤقتاً</option>
            </select>

            <button 
              onClick={openAddStaffModal}
              disabled={usedSlots >= totalSlots}
              className={`px-4 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 shadow-sm transition-all text-slate-950 ${
                usedSlots >= totalSlots 
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                  : 'bg-amber-400 hover:bg-amber-500 hover:shadow-md cursor-pointer'
              }`}
            >
              <Plus className="w-4 h-4" />
              إضافة عامل جديد
            </button>
          </div>
        </div>

        {/* Staff Card View Grid */}
        {filtered.length === 0 ? (
          <div className="bg-white border border-slate-100 rounded-3xl p-16 text-center space-y-3">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto text-slate-300">
              <Users className="w-8 h-8" />
            </div>
            <h4 className="font-bold text-slate-700 text-base">لا يوجد عاملين لعرضهم حالياً</h4>
            <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
              {searchProviderStaffQuery || filterProviderStaffRole || filterProviderStaffStatus
                ? 'لا توجد نتائج مطابقة لخيارات الفرز الحالية. يرجى تجربة كلمات بحث أخرى.'
                : 'ابدأ بإضافة موظفك الأول وتحديد الصلاحيات المخصصة له على القاعات والخدمات الآن.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((worker, idx) => {
              const countActivePerms = Object.values(worker.permissions || {}).filter(val => val === true).length;
              const hasSpecificHalls = worker.permissions?.specificHalls?.length > 0;
              const hasSpecificServices = worker.permissions?.specificServices?.length > 0;

              return (
                <div 
                  key={`worker-card-${worker.id}-${idx}`} 
                  className={`bg-white rounded-3xl border transition-all duration-300 relative group overflow-hidden ${
                    worker.status === 'موقوف' 
                      ? 'border-red-100 opacity-85 shadow-sm' 
                      : 'border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200'
                  }`}
                >
                  {/* Decorative Border Line */}
                  <div className={`h-1.5 w-full ${worker.status === 'موقوف' ? 'bg-red-500' : 'bg-amber-500'}`}></div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-slate-700 select-none ${
                          worker.status === 'موقوف' ? 'bg-red-50' : 'bg-slate-100'
                        }`}>
                          {(worker.name || 'م').split(' ').map((n: string) => n[0]).join('')}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-sm group-hover:text-amber-650 transition-colors">{worker.name}</h4>
                          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full mt-1 inline-block">
                            {worker.role}
                          </span>
                        </div>
                      </div>

                      {/* Power/Status Toggle Switch */}
                      <button 
                        onClick={() => {
                          const updated = providerStaffList.map(s => {
                            if (s.id === worker.id) {
                              const newStatus = s.status === 'نشط' ? 'موقوف' : 'نشط';
                              showNotification('success', `تغيرت حالة حساب الموظف المساعد (${worker.name}) بنجاح.`);
                              return { ...s, status: newStatus };
                            }
                            return s;
                          });
                          setProviderStaffList(updated);
                        }}
                        className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                          worker.status === 'نشط' 
                            ? 'bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100' 
                            : 'bg-red-50 text-red-650 border-red-100 hover:bg-red-100'
                        }`}
                        title={worker.status === 'نشط' ? "تعطيل مؤقت للمستخدم" : "تنشيط فوري للمستخدم"}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Contact Details */}
                    <div className="space-y-1 text-xs text-slate-500 border-y border-slate-55 py-3">
                      <div className="flex justify-between">
                        <span>رقم الجوال:</span>
                        <span className="font-mono text-slate-700 font-bold">{worker.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>البريد الإلكتروني:</span>
                        <span className="text-slate-700 truncate max-w-[150px] font-medium">{worker.email}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>تاريخ التعيين:</span>
                        <span className="font-mono text-slate-700">{worker.joinedAt}</span>
                      </div>
                    </div>

                    {/* Cost indicator */}
                    <div className="flex justify-between items-center text-[10px] bg-slate-50 px-3 py-1.5 rounded-xl">
                      <span className="text-slate-500">معدل التكلفة الاشتراكية:</span>
                      <span className="font-bold text-slate-700">{worker.monthlyCost} ر.س / {worker.billingCycle === 'yearly' ? 'سنوي' : 'شهري'}</span>
                    </div>

                    {/* Permissions list Summary */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span>صلاحيات وتراخيص النظام الممنوحة:</span>
                        <span className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono font-bold">{countActivePerms} أقسام</span>
                      </div>

                      <div className="flex flex-wrap gap-1">
                        {worker.permissions?.bookings && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">جدول الحجوزات</span>}
                        {worker.permissions?.halls && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">تعديل القاعات</span>}
                        {worker.permissions?.services && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">الخدمات المساندة</span>}
                        {worker.permissions?.marketing && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">التسويق والعروض</span>}
                        {worker.permissions?.messages && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">صندوق المراسلات</span>}
                        {worker.permissions?.finance && <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md">التقارير المالية</span>}
                        {countActivePerms === 0 && <span className="text-[10px] text-slate-400 italic">بدون صلاحيات صفحات</span>}
                      </div>

                      {/* Selected Resource Scopes */}
                      <div className="space-y-1.5 pt-1">
                        <div className="text-[9px] text-slate-400">نطاق الموارد المرتبطة بالموظف:</div>
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">ربط القاعات والمباني:</span>
                            <span className="font-semibold text-slate-750">
                              {hasSpecificHalls 
                                ? `${worker.permissions.specificHalls.length} قاعات مخصصة` 
                                : 'كل قاعات المنشأة'}
                            </span>
                          </div>
                          {hasSpecificHalls && (
                            <div className="flex flex-wrap gap-0.5 justify-start">
                              {worker.permissions.specificHalls.map((hid: number) => {
                                const matchedH = myHalls.find(h => h.id === hid);
                                return matchedH ? (
                                  <span key={hid} className="bg-slate-100 text-[9px] text-slate-650 px-1 py-0.5 rounded">{matchedH.name}</span>
                                ) : null;
                              })}
                            </div>
                          )}

                          <div className="flex justify-between text-[10px]">
                            <span className="text-slate-500">إشراف الخدمات المساندة:</span>
                            <span className="font-semibold text-slate-750">
                              {hasSpecificServices 
                                ? `${worker.permissions.specificServices.length} خدمات مخصصة` 
                                : 'كل خدمات المنشأة'}
                            </span>
                          </div>
                          {hasSpecificServices && (
                            <div className="flex flex-wrap gap-0.5 justify-start">
                              {worker.permissions.specificServices.map((sid: number) => {
                                const matchedS = myServices.find(s => s.id === sid);
                                return matchedS ? (
                                  <span key={sid} className="bg-slate-100 text-[9px] text-slate-650 px-1 py-0.5 rounded">{matchedS.name}</span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions bar */}
                    <div className="flex gap-2 pt-3 border-t border-slate-100">
                      <button 
                        onClick={() => openEditStaffModal(worker)}
                        className="flex-1 py-2 text-center text-xs font-black bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl transition-all border border-slate-150 flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        تعديل الصلاحيات
                      </button>
                      <button 
                        onClick={() => handleDeleteStaff(worker.id, worker.name)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-all border border-red-100 cursor-pointer"
                        title="حذف وحظر الموظف من المنشأة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Worker Add/Edit Form Modal */}
        {isProviderStaffModalOpen && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-2xl border border-slate-100 shadow-2xl relative overflow-hidden my-8 select-none">
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-extrabold text-base">{editingProviderStaff ? `تعديل صلاحيات العمل لـ (${editingProviderStaff.name})` : 'تعيين وإضافة موظف مساعد جديد'}</h3>
                  <p className="text-slate-400 text-[10px] mt-0.5">منح الصلاحيات بمرونة وقيد القوانين بحسب الأقسام وموارد القاعات.</p>
                </div>
                <button 
                  onClick={() => setIsProviderStaffModalOpen(false)}
                  className="text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveStaffForm} className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-right">
                {/* Employee Profile Inputs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">اسم الموظف أو العامل المساعد *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="الاسم الرباعي..." 
                      value={providerStaffForm.name || ''}
                      onChange={e => setProviderStaffForm({ ...providerStaffForm, name: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <PhoneInput 
                      label="رقم جوال تفعيل الوثائق والـ OTP" 
                      required
                      value={providerStaffForm.phone || ''}
                      onChange={e => setProviderStaffForm({ ...providerStaffForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">البريد الإلكتروني المهني</label>
                    <input 
                      type="email" 
                      placeholder="employee@lailah.com" 
                      value={providerStaffForm.email || ''}
                      onChange={e => setProviderStaffForm({ ...providerStaffForm, email: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs text-left font-mono focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">المسمى الوظيفي والمسؤولية *</label>
                    <select 
                      value={providerStaffForm.role || ''}
                      onChange={e => setProviderStaffForm({ ...providerStaffForm, role: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none cursor-pointer focus:border-amber-500 transition-colors"
                    >
                      <option value="مشرف قاعة الحفلات">مشرف قاعة</option>
                      <option value="مدير تسويق ومنسق خدمات الشركاء">مدير تسويق خدمات</option>
                      <option value="منسق حجوزات مبيعات">منسق مبيعات</option>
                      <option value="فريق الدعم والعمليات">دعم تشغيلي ومتابعة</option>
                    </select>
                  </div>
                </div>

                {/* Billing Cycle config */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h5 className="font-bold text-xs text-slate-700">دورة الفوترة والاشتراك لهذا المقعد</h5>
                    <p className="text-[10px] text-slate-400">تعتمد الفوترة للمقاعد الإضافية على التعديلات الدورية شهرياً أو سنوياً.</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      type="button" 
                      onClick={() => setProviderStaffForm({ ...providerStaffForm, billingCycle: 'monthly', monthlyCost: staffPriceMonthly })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        (providerStaffForm.billingCycle || 'monthly') === 'monthly'
                          ? 'bg-amber-500 text-slate-950 border-amber-400' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      شهري ({staffPriceMonthly} ر.س)
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setProviderStaffForm({ ...providerStaffForm, billingCycle: 'yearly', monthlyCost: staffPriceYearly })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer ${
                        providerStaffForm.billingCycle === 'yearly'
                          ? 'bg-amber-500 text-slate-950 border-amber-400' 
                          : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      سنوي ({staffPriceYearly} ر.س)
                    </button>
                  </div>
                </div>

                {/* Section-Specific Tab Permissions */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1">
                    <Shield className="w-4 h-4 text-amber-500" />
                    تراخيص دخول أقسام لوحة الشريك (Dashboard Tabs)
                  </h4>
                  <p className="text-[10px] text-slate-400">حدد الأقسام التي يُسمح للموظف باستعراض كشوفاتها أو إدارتها تماماً:</p>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-2xl">
                    {[
                      { key: 'bookings', label: 'إدارة الحجوزات والمواعيد' },
                      { key: 'halls', label: 'تعديل وتهيئة القاعات' },
                      { key: 'services', label: 'الخدمات المساندة والمكملة' },
                      { key: 'marketing', label: 'التسويق والحملات والإعلانات' },
                      { key: 'messages', label: 'قراءة وإرسال رسائل البريد' },
                      { key: 'finance', label: 'استعراض البيانات والتقارير المالية' },
                    ].map((tabInfo) => {
                      const isChecked = !!providerStaffForm.permissions?.[tabInfo.key];
                      return (
                        <label 
                          key={tabInfo.key} 
                          className={`flex items-center gap-2.5 p-2 bg-white rounded-xl border cursor-pointer select-none transition-all ${
                            isChecked 
                              ? 'border-amber-400 bg-amber-50/10 shadow-sm' 
                              : 'border-slate-200 hover:bg-slate-100/50'
                          }`}
                        >
                          <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={e => {
                              const updatedPerms = { ...providerStaffForm.permissions };
                              updatedPerms[tabInfo.key] = e.target.checked;
                              setProviderStaffForm({ ...providerStaffForm, permissions: updatedPerms });
                            }}
                            className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                          />
                          <span className="text-xs text-slate-700 font-bold">{tabInfo.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Specific Halls Control */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-xs text-slate-800">صلاحيات إدارة قاعات ومنشآت محددة للموظف</h4>
                    <span className="text-[10px] text-slate-450 font-sans">فارغ يعني "لوحة شمولية لكل القاعات"</span>
                  </div>
                  {myHalls.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">لا يوجد قاعات مهيأة لديك حالياً لإقران موظف بها.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-start">
                      {myHalls.map((h) => {
                        const currentSelects = providerStaffForm.permissions?.specificHalls || [];
                        const isSelected = currentSelects.includes(h.id);
                        return (
                          <button
                            type="button"
                            key={h.id}
                            onClick={() => {
                              let nextSelects = [...currentSelects];
                              if (isSelected) {
                                nextSelects = nextSelects.filter(id => id !== h.id);
                              } else {
                                nextSelects.push(h.id);
                              }
                              setProviderStaffForm({
                                ...providerStaffForm,
                                permissions: {
                                  ...providerStaffForm.permissions,
                                  specificHalls: nextSelects
                                }
                              });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-amber-100 text-amber-800 border-amber-400' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{h.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Specific Auxiliary Services Control */}
                <div className="space-y-2 border-t border-slate-100 pt-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-extrabold text-xs text-slate-800">صلاحيات إدارة خدمات مساندة محددة للموظف</h4>
                    <span className="text-[10px] text-slate-400">فارغ يعني "إشراف شامل على جميع الخدمات"</span>
                  </div>
                  {myServices.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic">لا يوجد خدمات مساندة مسجلة لتخصيص مشرفين عليها.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 justify-start">
                      {myServices.map((s) => {
                        const currentSelects = providerStaffForm.permissions?.specificServices || [];
                        const isSelected = currentSelects.includes(s.id);
                        return (
                          <button
                            type="button"
                            key={s.id}
                            onClick={() => {
                              let nextSelects = [...currentSelects];
                              if (isSelected) {
                                nextSelects = nextSelects.filter(id => id !== s.id);
                              } else {
                                nextSelects.push(s.id);
                              }
                              setProviderStaffForm({
                                ...providerStaffForm,
                                permissions: {
                                  ...providerStaffForm.permissions,
                                  specificServices: nextSelects
                                }
                              });
                            }}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isSelected 
                                ? 'bg-amber-100 text-amber-800 border-amber-400' 
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {isSelected ? '✓ ' : ''}{s.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer buttons */}
                <div className="flex gap-2.5 pt-4 border-t border-slate-100 justify-end">
                  <button 
                    type="button" 
                    onClick={() => setIsProviderStaffModalOpen(false)}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
                  >
                    إلغاء التراجع
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer"
                  >
                    {editingProviderStaff ? 'حفظ وتطبيق الخطة التراخيصية' : 'تعيين وإصدار دعوة عمل'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Render Administrator (Platform) View
  const renderAdminProviderStaffForAdminView = () => {
    // Unique list of provider names to let admins filter by provider
    const allProvidersWithStaff = Array.from(new Set(providerStaffList.map(s => s.providerName))).filter(Boolean);

    // Filters logic using dedicated admin filtering states
    const filteredForAdmin = providerStaffList.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(adminProviderStaffSearchQuery.toLowerCase()) || 
                          (s.email || '').toLowerCase().includes(adminProviderStaffSearchQuery.toLowerCase()) ||
                          s.phone.includes(adminProviderStaffSearchQuery);
      
      const matchRole = adminProviderStaffFilterRole ? s.role === adminProviderStaffFilterRole : true;
      const matchProvider = adminProviderStaffFilterProvider ? s.providerName === adminProviderStaffFilterProvider : true;
      const matchStatus = adminProviderStaffFilterStatus ? s.status === adminProviderStaffFilterStatus : true;
      
      return matchSearch && matchRole && matchProvider && matchStatus;
    });

    // Advanced Stats for Platform Managers
    const totalStaffCount = providerStaffList.length;
    const activeStaffCount = providerStaffList.filter(s => s.status === 'نشط').length;
    const blockedStaffCount = providerStaffList.filter(s => s.status !== 'نشط').length;
    
    // Calculate how many bonus slots are set for the selected quota provider
    const currentBonusSlots = selectedQuotaProvider ? (() => {
      try {
        const stored = localStorage.getItem(`PROVIDER_BONUS_STAFF_SLOTS_${selectedQuotaProvider}`);
        return stored ? parseInt(stored, 10) : 0;
      } catch { return 0; }
    })() : 0;

    const handleSaveQuotaBonus = (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedQuotaProvider) {
        showNotification('error', 'يرجى تحديد الشريك أو مزود الخدمة أولاً.');
        return;
      }
      const bonusVal = quotaBonusInput === '' ? 0 : Number(quotaBonusInput);
      if (bonusVal < 0) {
        showNotification('error', 'لا يمكن تعيين قيمة سالبة لمقاعد البونص.');
        return;
      }
      
      localStorage.setItem(`PROVIDER_BONUS_STAFF_SLOTS_${selectedQuotaProvider}`, bonusVal.toString());
      setBonusSlotsTrigger(prev => prev + 1);
      showNotification('success', `تم تحديث وتخصيص ${bonusVal} مقاعد إضافية (بونص) استثنائية مجانية لحساب الشريك (${selectedQuotaProvider}) بنجاح.`);
      setQuotaBonusInput('');
    };

    const handleOpenAdminEditModal = (worker: any) => {
      setAdminEditingStaff(worker);
      setAdminEditingStaffForm({
        name: worker.name,
        role: worker.role,
        phone: worker.phone,
        email: worker.email,
        status: worker.status,
        permissions: {
          bookings: worker.permissions?.bookings || false,
          halls: worker.permissions?.halls || false,
          services: worker.permissions?.services || false,
          marketing: worker.permissions?.marketing || false,
          messages: worker.permissions?.messages || false,
          finance: worker.permissions?.finance || false
        }
      });
      setIsAdminEditingStaffModalOpen(true);
    };

    const handleSaveAdminEditStaffForm = (e: React.FormEvent) => {
      e.preventDefault();
      if (!adminEditingStaff) return;
      if (!adminEditingStaffForm.name.trim() || !adminEditingStaffForm.role.trim() || !adminEditingStaffForm.phone.trim()) {
        showNotification('error', 'الرجاء ملء الاسم، الدور، ورقم الجوال للموظف.');
        return;
      }

      let cleanPhone = adminEditingStaffForm.phone.trim().replace(/[\s\(\)\-\+]/g, '');
      while (cleanPhone.startsWith('966966')) {
        cleanPhone = cleanPhone.replace(/^966966/, '966');
      }
      if (cleanPhone.startsWith('05')) {
        cleanPhone = '966' + cleanPhone.substring(1);
      } else if (cleanPhone.startsWith('5') && cleanPhone.length === 9) {
        cleanPhone = '966' + cleanPhone;
      }
      if (!cleanPhone.startsWith('9665') || cleanPhone.length !== 12) {
        showNotification('error', 'يرجى إدخال رقم جوال سعودي صحيح يتكون من 10 أرقام ويبدأ بـ 05 (مثال: 05XXXXXXXX)');
        return;
      }

      const updated = providerStaffList.map(s => {
        if (s.id === adminEditingStaff.id) {
          return {
            ...s,
            name: adminEditingStaffForm.name,
            role: adminEditingStaffForm.role,
            phone: adminEditingStaffForm.phone,
            email: adminEditingStaffForm.email,
            status: adminEditingStaffForm.status,
            permissions: { ...adminEditingStaffForm.permissions }
          };
        }
        return s;
      });

      setProviderStaffList(updated);
      setIsAdminEditingStaffModalOpen(false);
      setAdminEditingStaff(null);
      showNotification('success', `تم حفظ وتعديل صلاحيات وبيانات الموظف التابع للشريك (${adminEditingStaffForm.name}) بنجاح.`);
    };

    return (
      <div className="space-y-6 text-right font-sans" dir="rtl">
        {/* Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-800 p-6 rounded-3xl text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-amber-500" />
              إدارة شؤون موظفي وعاملي الشركاء (لوحات التحكم الخارجية)
            </h2>
            <p className="text-slate-400 text-xs leading-relaxed max-w-2xl">
              أنت تستعرض لوحة تحكم الإشراف العام لمدراء المنصة. يمنحك هذا القسم القدرة المطلقة على تعديل مسميات وصلاحيات العاملين، حظر الحسابات، وصرف مقاعد ترخيص استثنائية مجانية للشركاء.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-bold">إجمالي الموظفين</span>
              <span className="text-lg font-black font-mono text-amber-500">{totalStaffCount}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-bold">نشط فَعَال</span>
              <span className="text-lg font-black font-mono text-emerald-400">{activeStaffCount}</span>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-4 py-2 rounded-2xl text-center">
              <span className="text-[10px] text-slate-400 block font-bold">موقوف / محظور</span>
              <span className="text-lg font-black font-mono text-rose-400">{blockedStaffCount}</span>
            </div>
          </div>
        </div>

        {/* Quota Management & exceptional allocation widget */}
        <div className="bg-gradient-to-br from-amber-50/40 to-orange-50/20 p-5 rounded-3xl border border-amber-200/60 shadow-sm space-y-4">
          <div className="flex items-center gap-2 border-b border-amber-200/40 pb-3">
            <div className="p-1.5 bg-amber-500 text-slate-950 rounded-xl">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-800">منح وتغيير مقاعد تراخيص العاملين يدويًا (التحكم في سعة الكوتا بالبونص)</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">يمكنك دعم الشركاء بمنحهم مساحات ومقاعد إشراف إضافية مجانًا دون مطالبتهم بالترقية التشغيلية للباقات.</p>
            </div>
          </div>

          <form onSubmit={handleSaveQuotaBonus} className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1 space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">اختر الشريك أو مزود الخدمة المستهدف:</label>
              <select 
                value={selectedQuotaProvider}
                onChange={e => {
                  setSelectedQuotaProvider(e.target.value);
                  setQuotaBonusInput('');
                }}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none cursor-pointer focus:border-amber-500 font-medium"
              >
                <option value="">-- اختر الشريك من القائمة --</option>
                {providers.map(p => (
                  <option key={p.id} value={p.name}>{p.name} (معرّف: {p.id})</option>
                ))}
              </select>
            </div>

            {selectedQuotaProvider && (
              <div className="px-4 py-2 bg-white rounded-xl border border-amber-200/50 text-slate-700 text-xs font-bold leading-tight space-y-1">
                <div>الحالة الحالية لمقاعد بونص الشريك:</div>
                <div className="text-amber-700 font-mono text-sm leading-none flex items-center gap-1.5 pt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>+{currentBonusSlots} مقاعد بونص مخصصة</span>
                </div>
              </div>
            )}

            <div className="w-full md:w-60 space-y-1">
              <label className="block text-[11px] font-bold text-slate-600">عدد مقاعد البونص الاستثنائية الجديدة:</label>
              <input 
                type="number" 
                min="0"
                max="50"
                placeholder="مثال: 5" 
                value={quotaBonusInput}
                onChange={e => setQuotaBonusInput(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none text-center font-mono focus:border-amber-500"
              />
            </div>

            <button 
              type="submit"
              className="px-5 py-3 bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm w-full md:w-auto shrink-0"
            >
              حفظ وتطبيق الكوتا
            </button>
          </form>
        </div>

        {/* Administration Filters bar */}
        <div className="bg-white p-4 rounded-3xl border border-slate-150/80 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute right-3.5 top-3.5 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="البحث باسم موظف الشريك، هاتفه أو بريده..." 
              value={adminProviderStaffSearchQuery}
              onChange={e => setAdminProviderStaffSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors bg-slate-50/50"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-end">
            <select 
              value={adminProviderStaffFilterProvider}
              onChange={e => setAdminProviderStaffFilterProvider(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none cursor-pointer"
            >
              <option value="">جميع الشركاء والملاك</option>
              {allProvidersWithStaff.map((pName) => (
                <option key={pName} value={pName}>{pName}</option>
              ))}
            </select>

            <select 
              value={adminProviderStaffFilterRole}
              onChange={e => setAdminProviderStaffFilterRole(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none cursor-pointer"
            >
              <option value="">جميع المسميات والوظائف</option>
              <option value="مشرف قاعة الحفلات">مشرف قاعة</option>
              <option value="مدير تسويق ومنسق خدمات الشركاء">مدير تسويق</option>
              <option value="منسق حجوزات مبيعات">منسق مبيعات</option>
              <option value="فريق الدعم والعمليات">دعم تشغيلي</option>
            </select>

            <select 
              value={adminProviderStaffFilterStatus}
              onChange={e => setAdminProviderStaffFilterStatus(e.target.value)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none cursor-pointer"
            >
              <option value="">جميع الحالات</option>
              <option value="نشط">فعّال</option>
              <option value="موقوف">موقوف</option>
            </select>
          </div>
        </div>

        {/* Admin overview table */}
        <div className="bg-white rounded-3xl border border-slate-100/90 shadow-sm overflow-hidden text-right leading-relaxed">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 uppercase border-b border-slate-100 font-bold">
                  <th className="p-4 text-right">اسم الموظف / الدور</th>
                  <th className="p-4 text-right">الشريك (المزود المالك)</th>
                  <th className="p-4 font-mono text-center">رقم الجوال والبريد</th>
                  <th className="p-4 text-center">تفصيل أقسام وصلاحيات الموظف</th>
                  <th className="p-4 text-center font-mono">تاريخ الربط</th>
                  <th className="p-4 text-center">تكلفة الاشتراك</th>
                  <th className="p-4 text-center">حالة الحساب</th>
                  <th className="p-4 text-center">التحكم الفني والإشرافي</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredForAdmin.map((s, idx) => {
                  const activePermsKeys = Object.keys(s.permissions || {}).filter(key => s.permissions[key] === true);
                  
                  const permLabels: Record<string, string> = {
                    bookings: 'الحجوزات',
                    halls: 'القاعات',
                    services: 'الخدمات',
                    marketing: 'التسويق',
                    messages: 'الرسائل',
                    finance: 'المالية'
                  };

                  return (
                    <tr key={`prov-staff-${s.id}-${idx}`} className="hover:bg-amber-50/10 transition-colors">
                      <td className="p-4 text-right">
                        <div className="font-extrabold text-slate-800">{s.name}</div>
                        <div className="text-[10px] text-slate-400 pt-0.5">{s.role}</div>
                      </td>
                      <td className="p-4 font-bold text-slate-700 text-right">
                        🏢 {s.providerName}
                      </td>
                      <td className="p-4 font-mono text-center text-slate-650">
                        <div>{s.phone}</div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs">{s.email}</div>
                      </td>
                      <td className="p-4 text-center">
                        {activePermsKeys.length > 0 ? (
                          <div className="flex flex-wrap gap-1 justify-center max-w-xs mx-auto">
                            {activePermsKeys.map(key => (
                              <span key={key} className="bg-slate-100 text-slate-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                {permLabels[key] || key}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px] italic">بلا صلاحيات</span>
                        )}
                      </td>
                      <td className="p-4 text-center text-slate-500 font-mono">
                        {s.joinedAt}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-750 font-mono">
                        {s.monthlyCost} ر.س / {s.billingCycle === 'yearly' ? 'سنوي' : 'شهري'}
                      </td>
                      <td className="p-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold ${
                          s.status === 'نشط' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-rose-100 text-rose-800'
                        }`}>
                          {s.status === 'نشط' ? '🟢 فعال ونشط' : '🔴 موقوف بالكامل'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex justify-center gap-1">
                          <button
                            onClick={() => handleOpenAdminEditModal(s)}
                            className="p-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg cursor-pointer flex items-center gap-1 shrink-0 font-bold"
                            title="تعديل مباشر والتصريح بالصلاحيات"
                          >
                            <Settings className="w-3.5 h-3.5" />
                            <span>تعديل</span>
                          </button>

                          <button 
                            onClick={() => {
                              const updated = providerStaffList.map(item => {
                                if (item.id === s.id) {
                                  const newStatus = item.status === 'نشط' ? 'موقوف' : 'نشط';
                                  return { ...item, status: newStatus };
                                }
                                return item;
                              });
                              setProviderStaffList(updated);
                              showNotification('info', `تم تبديل حالة حساب موظف الشريك بنجاح لمساعدة العميل.`);
                            }}
                            className={`p-1.5 rounded-lg border text-[11px] font-bold leading-none cursor-pointer shrink-0 ${
                              s.status === 'نشط'
                                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            }`}
                            title={s.status === 'نشط' ? 'حظر الموظف' : 'تنشيط يدوي'}
                          >
                            {s.status === 'نشط' ? 'حظر' : 'تنشيط'}
                          </button>

                          <button 
                            onClick={() => {
                              const answer = window.confirm(`هل أنت متأكد من حذف الموظف (${s.name}) نهائياً من المنصة؟`);
                              if (answer) {
                                setProviderStaffList(providerStaffList.filter(item => item.id !== s.id));
                                showNotification('success', 'تم حذف حساب الموظف المساعد بالشريك نهائياً.');
                              }
                            }}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-150 rounded-lg cursor-pointer"
                            title="حذف نهائي"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredForAdmin.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-16 text-center text-slate-400 font-bold">
                      لا يوجد موظفي شركاء يتطابقون مع خيارات الفرز الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Administration Worker Direct Edit Modal */}
        {isAdminEditingStaffModalOpen && adminEditingStaff && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-right">
              <div className="bg-slate-900 px-6 py-4 flex justify-between items-center text-white">
                <div>
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    تعديل حساب موظف الشريك وتفويض الصلاحيات الإدارية
                  </h3>
                  <p className="text-[10px] text-slate-300">أنت تقوم بتعديل وصيانة بيانات العامل نيابة عن مزود الخدمة ({adminEditingStaff.providerName})</p>
                </div>
                <button 
                  onClick={() => setIsAdminEditingStaffModalOpen(false)} 
                  className="p-2 text-slate-400 hover:text-white rounded-xl transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveAdminEditStaffForm} className="p-6 space-y-5 text-right">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">اسم الموظف الثنائي/الكامل <span className="text-red-500">*</span></label>
                    <input 
                      type="text" 
                      required
                      value={adminEditingStaffForm.name}
                      onChange={e => setAdminEditingStaffForm({...adminEditingStaffForm, name: e.target.value})}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-xs bg-slate-50/50"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">المسمى والوصف الوظيفي للموظف <span className="text-red-500">*</span></label>
                    <select 
                      value={adminEditingStaffForm.role}
                      onChange={e => setAdminEditingStaffForm({...adminEditingStaffForm, role: e.target.value})}
                      className="w-full p-2.5 rounded-xl border border-slate-200 bg-white outline-none focus:border-indigo-500 text-xs cursor-pointer"
                    >
                      <option value="مشرف قاعة الحفلات">مشرف قاعة مستقلة</option>
                      <option value="مدير تسويق ومنسق خدمات الشركاء">مدير تسويق ومنسق المبيعات</option>
                      <option value="منسق حجوزات مبيعات">منسق مبيعات وحجوزات عملاء</option>
                      <option value="فريق الدعم والعمليات">دعم تشغيلي وإشراف ميداني</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <PhoneInput 
                      label="رقم جوال تفعيل النظام" 
                      required
                      value={adminEditingStaffForm.phone || ''}
                      onChange={e => setAdminEditingStaffForm({ ...adminEditingStaffForm, phone: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-bold text-slate-700">البريد الإلكتروني المهني:</label>
                    <input 
                      type="email" 
                      value={adminEditingStaffForm.email}
                      onChange={e => setAdminEditingStaffForm({...adminEditingStaffForm, email: e.target.value})}
                      className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-indigo-500 text-xs bg-slate-50/50 font-mono text-left"
                    />
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-150 space-y-2">
                  <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-200 pb-1.5">
                    <Key className="w-3.5 h-3.5 text-indigo-600" />
                    <span>تخويل صلاحيات لوحة التحكم للشريك (صلاحيات التشغيل الفرعية)</span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                    {[
                      { key: 'bookings', label: 'إدارة وجدول الحجوزات والمواعيد' },
                      { key: 'halls', label: 'إدارة وتحديث القاعات والمناطق' },
                      { key: 'services', label: 'إدارة الخدمات الإضافية والطلبات المساندة' },
                      { key: 'marketing', label: 'إدارة التسويق والخصومات والعروض الترويجية' },
                      { key: 'messages', label: 'البريد، المحادثات المباشرة ورسائل الإدارة' },
                      { key: 'finance', label: 'المستحقات، التقارير والتحليل المالي' }
                    ].map((perm) => (
                      <label key={perm.key} className="flex items-start gap-2 bg-white p-2.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors cursor-pointer select-none">
                        <input 
                          type="checkbox"
                          checked={!!adminEditingStaffForm.permissions[perm.key]}
                          onChange={e => setAdminEditingStaffForm({
                            ...adminEditingStaffForm,
                            permissions: {
                              ...adminEditingStaffForm.permissions,
                              [perm.key]: e.target.checked
                            }
                          })}
                          className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                        />
                        <div className="text-[10px] leading-tight text-slate-700 font-bold">
                          {perm.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center border-t border-slate-100 pt-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-slate-600">حالة نشاط الحساب بالنظام:</span>
                    <button 
                      type="button"
                      onClick={() => setAdminEditingStaffForm({
                        ...adminEditingStaffForm,
                        status: adminEditingStaffForm.status === 'نشط' ? 'موقوف' : 'نشط'
                      })}
                      className={`px-3 py-1.5 rounded-xl font-bold text-[10px] transition-all border cursor-pointer ${
                        adminEditingStaffForm.status === 'نشط' 
                          ? 'bg-emerald-50 border-emerald-250 text-emerald-800' 
                          : 'bg-rose-50 border-rose-250 text-rose-800'
                      }`}
                    >
                      {adminEditingStaffForm.status === 'نشط' ? '🟢 فعال ونشط' : '🔴 موقوف ومعطل'}
                    </button>
                  </div>

                  <div className="flex gap-2">
                    <button 
                      type="button"
                      onClick={() => setIsAdminEditingStaffModalOpen(false)}
                      className="px-4 py-2 bg-slate-105 hover:bg-slate-250 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
                    >
                      إلغاء الأمر
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition-all font-sans"
                    >
                      تحديث وحفظ التغييرات
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {userRole === 'admin' ? renderAdminProviderStaffForAdminView() : renderProviderStaffView()}

      {/* Buy Staff Slots Modal (Custom fast checkout) */}
      {isBuyStaffSlotsModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto" id="buy-staff-slots-modal-container">
          <div className="bg-white rounded-3xl w-full max-w-lg border border-slate-100 shadow-2xl relative overflow-hidden transition-all duration-300" id="buy-staff-slots-modal-card">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 text-white px-6 py-4 flex justify-between items-center" id="buy-staff-slots-modal-header">
              <div>
                <h3 className="font-extrabold text-base flex items-center gap-1.5" id="buy-staff-slots-modal-title">
                  <CreditCardIcon className="w-5 h-5 text-amber-400" />
                  شراء مقاعد إضافية للموظفين
                </h3>
                <p className="text-slate-300 text-xs mt-0.5" id="buy-staff-slots-modal-subtitle">توسيع مساحة فريق العمل للرد الفوري والتنظيم الفعال</p>
              </div>
              <button 
                onClick={() => setIsBuyStaffSlotsModalOpen(false)}
                className="text-slate-400 hover:text-white bg-white/10 p-2 rounded-xl transition-colors shrink-0 cursor-pointer"
                id="buy-staff-slots-modal-close-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentFinishedSuccess ? (
              /* Success View */
              <div className="p-8 text-center space-y-6 animate-in zoom-in-95 duration-200" id="buy-staff-slots-modal-success">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm" id="buy-staff-slots-success-icon-wrapper">
                  <CheckCircle2 className="w-10 h-10 animate-bounce" />
                </div>
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800 text-lg" id="buy-staff-slots-success-heading">تمت العملية بنجاح! 🎉</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed" id="buy-staff-slots-success-desc">
                    تم شراء <span className="font-bold text-slate-800 font-sans">{buyStaffSlotsCountInput}</span> مقعد موظف إضافي مفعليين بالكامل ومجهزين فوراً.
                  </p>
                </div>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs space-y-2 text-right" id="buy-staff-slots-success-receipt">
                  <div className="flex justify-between font-medium font-sans">
                    <span className="text-slate-500">مجموع المقاعد الجديدة:</span>
                    <span className="font-black text-slate-800 font-sans">{totalSlots + buyStaffSlotsCountInput} مقعد</span>
                  </div>
                  <div className="flex justify-between font-medium font-sans">
                    <span className="text-slate-500">تكلفة الترقية الإضافية:</span>
                    <span className="font-black text-amber-500 font-sans">{buyStaffSlotsCountInput * staffPriceMonthly} ر.س / شهرياً</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsBuyStaffSlotsModalOpen(false)}
                  className="w-full py-3 bg-slate-900 text-white hover:bg-slate-800 transition-colors font-extrabold text-xs rounded-xl cursor-pointer"
                  id="buy-staff-slots-success-back-btn"
                >
                  العودة لإدارة الموظفين
                </button>
              </div>
            ) : (
              /* Payment and Choice Form View */
              <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-right" id="buy-staff-slots-modal-body">
                {/* Selector counter */}
                <div className="bg-amber-50/20 border border-amber-101 rounded-2xl p-4" id="buy-staff-slots-counter-wrapper">
                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <h4 className="text-xs font-bold text-slate-850 text-right" id="buy-staff-slots-counter-title">اختر عدد المقاعد الإضافية:</h4>
                      <p className="text-[10px] text-slate-500 mt-0.5 font-sans" id="buy-staff-slots-counter-price-info">سعر المقعد الواحد: {staffPriceMonthly} ر.س / شهرياً</p>
                    </div>
                    
                    <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-xl p-1 shadow-sm" id="buy-staff-slots-counter-controls">
                      <button
                        type="button"
                        disabled={buyStaffSlotsCountInput <= 1}
                        onClick={() => setBuyStaffSlotsCountInput(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center disabled:opacity-50 transition-colors cursor-pointer text-sm"
                        id="buy-staff-slots-counter-minus"
                      >
                        -
                      </button>
                      <span className="font-black text-slate-800 font-sans px-2 min-w-8 text-center text-sm" id="buy-staff-slots-counter-val">{buyStaffSlotsCountInput}</span>
                      <button
                        type="button"
                        onClick={() => setBuyStaffSlotsCountInput(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 font-bold flex items-center justify-center transition-colors cursor-pointer text-sm"
                        id="buy-staff-slots-counter-plus"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-amber-200 pt-3 flex justify-between items-center whitespace-nowrap" id="buy-staff-slots-counter-total-section">
                    <span className="text-xs font-bold text-slate-600">القيمة الإجمالية شهرياً:</span>
                    <span className="font-extrabold text-amber-600 font-sans text-base" id="buy-staff-slots-counter-total-val">{buyStaffSlotsCountInput * staffPriceMonthly} ر.س</span>
                  </div>
                </div>

                {/* التزام بقرارات الإدارة لبوابات الدفع الفعالة */}
                {(() => {
                  const activeGWNames: Record<string, string> = {
                    moyasar: 'مُيسر (Moyasar)',
                    hyperpay: 'هايبر باي (HyperPay)',
                    paytabs: 'بي تابس (PayTabs)',
                    geidea: 'جيديا (Geidea)',
                    tabby_api: 'تابي (Tabby)',
                    tamara_api: 'تمارا (Tamara)'
                  };
                  const activeGWName = activeGWNames[adminActiveGateway] || 'مُيسر (Moyasar)';
                  return (
                    <div className="bg-amber-50/45 border border-amber-200/50 rounded-2xl p-3 text-xs space-y-1 text-slate-700" id="buy-staff-slots-gateway-alert">
                      <div className="font-bold text-amber-900 flex items-center gap-1">🛡️ بوابة الدفع النشطة للمنصة:</div>
                      <div className="text-[11px] text-slate-600 leading-relaxed text-right">
                        يتم معالجة المدفوعات آلياً وبشكل حركي ذكي ومباشر عبر البوابة الرسمية المعتمدة من الإدارة: <span className="font-black text-amber-800">{activeGWName}</span>.
                      </div>
                    </div>
                  );
                })()}

                {/* Payment Method Selector */}
                {(() => {
                  const madaEnabled = paymentSettings ? !!paymentSettings.mada : true;
                  const creditMaxEnabled = paymentSettings ? !!paymentSettings.creditMax : true;
                  
                  const enabledMethods = [
                    { key: 'mada', name: 'مدى (Mada)', icon: CreditCardIcon, isCard: true, enabled: madaEnabled },
                    { key: 'creditMax', name: 'فيزا/ماستركارد', icon: CreditCardIcon, isCard: true, enabled: creditMaxEnabled },
                    { key: 'apple', name: 'Apple Pay', icon: null, isApple: true, enabled: paymentSettings ? !!paymentSettings.apple : false },
                    { key: 'stc', name: 'STC Pay', icon: Wallet, isStc: true, enabled: paymentSettings ? !!paymentSettings.stc : false },
                    { key: 'google_pay', name: 'Google Pay', icon: Wallet, isGoogle: true, enabled: paymentSettings ? !!paymentSettings.google_pay : false },
                    { key: 'tabby', name: 'تابي (Tabby)', icon: Percent, isTabby: true, enabled: paymentSettings ? !!paymentSettings.tabby : false },
                    { key: 'tamara', name: 'تمارا (Tamara)', icon: Percent, isTamara: true, enabled: paymentSettings ? !!paymentSettings.tamara : false },
                    { key: 'bank_transfer', name: 'تحويل بنكي', icon: Landmark, isBank: true, enabled: paymentSettings ? !!paymentSettings.bank_transfer : true }
                  ].filter(m => m.enabled);

                  const currentMethodKey = enabledMethods.some(m => m.key === staffPaymentForm.paymentMethod)
                    ? staffPaymentForm.paymentMethod
                    : (enabledMethods[0]?.key || 'mada');

                  if (enabledMethods.length === 0) {
                    return (
                      <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-center rounded-2xl text-xs font-bold leading-relaxed">
                        ⚠️ نعتذر منكم، لا توجد أي طرق دفع مفعلة حالياً من قبل الإدارة العامة للمنصة. يرجى مراجعة الدعم الفني.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="space-y-2 text-right" id="buy-staff-slots-payment-selector">
                        <label className="text-xs font-bold text-slate-600 block">طريقة استكمال الدفع السريع:</label>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                          {enabledMethods.map((m) => {
                            const IconComponent = m.icon;
                            const isSelected = currentMethodKey === m.key;
                            return (
                              <button
                                key={m.key}
                                type="button"
                                onClick={() => setStaffPaymentForm(prev => ({ ...prev, paymentMethod: m.key }))}
                                className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all text-center cursor-pointer ${
                                  isSelected
                                    ? 'border-amber-500 bg-amber-500/5 text-slate-900 font-bold shadow-sm'
                                    : 'border-slate-100 text-slate-600 hover:bg-slate-50/70 bg-white'
                                }`}
                                id={`buy-staff-slots-payment-${m.key}`}
                              >
                                {m.key === 'apple' ? (
                                  <span className="font-sans font-black text-xs text-slate-800 select-none"> Pay</span>
                                ) : m.key === 'google_pay' ? (
                                  <span className="font-sans font-black text-[11px] text-slate-900 select-none">Google Pay</span>
                                ) : (
                                  <>
                                    {IconComponent && <IconComponent className={`w-3.5 h-3.5 ${isSelected ? 'text-amber-500' : 'text-slate-400'}`} />}
                                    <span className="text-[10px] font-bold text-slate-800 leading-none">{m.name}</span>
                                  </>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {/* Rendering corresponding payment content */}
                      {(currentMethodKey === 'mada' || currentMethodKey === 'creditMax') && (
                        <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in duration-200 text-right" id="buy-staff-slots-cc-form">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 block">اسم صاحب البطاقة *</label>
                            <input
                              type="text"
                              required
                              placeholder="الاسم كما يظهر على البطاقة..."
                              value={staffPaymentForm.cardName}
                              onChange={e => setStaffPaymentForm(prev => ({ ...prev, cardName: e.target.value }))}
                              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors"
                              id="buy-staff-slots-cc-name"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 block">رقم البطاقة (16 رقم) *</label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                maxLength={19}
                                placeholder="4000 1234 5678 9010"
                                value={staffPaymentForm.cardNumber}
                                onChange={e => {
                                  const v = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                                  const matches = v.match(/\d{4,16}/g);
                                  const match = (matches && matches[0]) || '';
                                  const parts = [];
                                  for (let i = 0, len = match.length; i < len; i += 4) {
                                    parts.push(match.substring(i, i + 4));
                                  }
                                  const formatted = parts.length > 0 ? parts.join(' ') : v;
                                  setStaffPaymentForm(prev => ({ ...prev, cardNumber: formatted }));
                                }}
                                className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors font-mono tracking-wider text-right"
                                id="buy-staff-slots-cc-number"
                              />
                              <CreditCardIcon className="absolute right-3.5 top-3.5 text-slate-400 w-4 h-4" />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">تاريخ الإنتهاء *</label>
                              <input
                                type="text"
                                required
                                placeholder="MM/YY"
                                maxLength={5}
                                value={staffPaymentForm.cardExpiry}
                                onChange={e => {
                                  let v = e.target.value.replace(/[^0-9]/g, '');
                                  if (v.length >= 2) {
                                    v = v.substring(0, 2) + '/' + v.substring(2, 4);
                                  }
                                  setStaffPaymentForm(prev => ({ ...prev, cardExpiry: v }));
                                }}
                                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors font-mono text-center text-sm"
                                id="buy-staff-slots-cc-expiry"
                              />
                            </div>
                            
                            <div className="space-y-1">
                              <label className="text-xs font-bold text-slate-600 block">رمز التحقق (CVV) *</label>
                              <input
                                type="password"
                                required
                                maxLength={3}
                                placeholder="•••"
                                value={staffPaymentForm.cardCvv}
                                onChange={e => {
                                  const v = e.target.value.replace(/[^0-9]/g, '');
                                  setStaffPaymentForm(prev => ({ ...prev, cardCvv: v }));
                                }}
                                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors font-mono text-center text-sm tracking-wider"
                                id="buy-staff-slots-cc-cvv"
                              />
                            </div>
                          </div>

                          <div className="flex gap-2.5 pt-4 border-t border-slate-100 justify-end" id="buy-staff-slots-cc-footer">
                            <button 
                              type="button" 
                              onClick={() => setIsBuyStaffSlotsModalOpen(false)}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
                              id="buy-staff-slots-cc-cancel"
                            >
                              إلغاء التراجع
                            </button>
                            <button 
                              type="button" 
                              disabled={isProcessingStaffPayment}
                              onClick={() => {
                                if (!staffPaymentForm.cardName.trim() || !staffPaymentForm.cardNumber.trim() || !staffPaymentForm.cardExpiry.trim() || !staffPaymentForm.cardCvv.trim()) {
                                  showNotification('error', 'يرجى إكمال بيانات البطاقة الائتمانية لإتمام تسوية الدفع.');
                                  return;
                                }
                                if (staffPaymentForm.cardNumber.replace(/\s/g, '').length < 15) {
                                  showNotification('error', 'يرجى إدخال رقم بطاقة ائتمان صحيح ومكون من 15 أو 16 خانة.');
                                  return;
                                }
                                setIsProcessingStaffPayment(true);
                                setTimeout(() => {
                                  handleBuyStaffSlot(buyStaffSlotsCountInput);
                                  setIsProcessingStaffPayment(false);
                                  setPaymentFinishedSuccess(true);
                                }, 1500);
                              }}
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                              id="buy-staff-slots-cc-submit"
                            >
                              {isProcessingStaffPayment ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                  جاري معالجة الدفع...
                                </>
                              ) : (
                                <>
                                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                                  تأكيد الدفع والترقية فورياً
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {(currentMethodKey === 'apple' || currentMethodKey === 'google_pay') && (
                        <div className="bg-slate-50 rounded-2xl p-6 text-center space-y-3" id="buy-staff-slots-wallet-content">
                          <div className="font-sans font-bold text-slate-700 text-xs text-center">
                            {currentMethodKey === 'apple' 
                              ? 'انقر لمتابعة الدفع السريع والمعرّف على جهازك عبر Apple Pay'
                              : 'انقر للبدء السريع بالدفع المعرف على جوالك/متصفحك عبر Google Pay'}
                          </div>
                          <button
                            type="button"
                            disabled={isProcessingStaffPayment}
                            onClick={() => {
                              setIsProcessingStaffPayment(true);
                              setTimeout(() => {
                                handleBuyStaffSlot(buyStaffSlotsCountInput);
                                setIsProcessingStaffPayment(false);
                                setPaymentFinishedSuccess(true);
                              }, 1500);
                            }}
                            className="w-full py-4 bg-slate-955 text-white hover:bg-black rounded-2xl text-sm font-extrabold flex justify-center items-center gap-2 transition-all hover:scale-[1.01] active:scale-95 cursor-pointer shadow-md"
                            id="buy-staff-slots-wallet-btn"
                          >
                            {isProcessingStaffPayment ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                                  جاري فحص المصادقة البيومترية الآمنة...
                                </>
                              ) : (
                                <>
                                  <span className="font-sans font-bold text-sm">
                                    {currentMethodKey === 'apple' ? ' Pay الدفع بـ' : 'G Pay الدفع بـ'}
                                  </span>
                                </>
                              )}
                          </button>
                        </div>
                      )}

                      {currentMethodKey === 'stc' && (
                        <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in duration-200 text-right" id="buy-staff-slots-stc-form">
                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 block">رقم الجوال المسجل في STC Pay *</label>
                            <div className="relative">
                              <input
                                type="text"
                                required
                                placeholder="05xxxxxxxx"
                                maxLength={10}
                                value={stcPhoneInput}
                                onChange={e => {
                                  const clean = e.target.value.replace(/[^0-9]/g, '');
                                  setStcPhoneInput(clean);
                                }}
                                className="w-full p-2.5 pr-10 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors font-mono tracking-wider text-left bg-slate-50/50"
                              />
                              <Wallet className="absolute right-3.5 top-3.5 text-slate-400 w-4 h-4" />
                            </div>
                          </div>

                          {stcOtpRequested ? (
                            <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                              <label className="text-xs font-bold text-slate-600 block">رمز التحقق OTP (تم إرساله في رسالة نصية) *</label>
                              <input
                                type="text"
                                required
                                maxLength={4}
                                placeholder="••••"
                                value={stcOtpInput}
                                onChange={e => setStcOtpInput(e.target.value.replace(/[^0-9]/g, ''))}
                                className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors font-mono text-center tracking-widest text-base bg-slate-50/50"
                              />
                              <p className="text-[10px] text-emerald-600 mt-1">كود تجريبي للتأكيد: 1234</p>
                            </div>
                          ) : null}

                          <div className="flex gap-2.5 pt-4 border-t border-slate-100 justify-end">
                            <button 
                              type="button" 
                              onClick={() => {
                                setIsBuyStaffSlotsModalOpen(false);
                                setStcOtpRequested(false);
                              }}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
                            >
                              إلغاء
                            </button>
                            
                            {!stcOtpRequested ? (
                              <button 
                                type="button" 
                                disabled={isProcessingStaffPayment}
                                onClick={() => {
                                  if (!stcPhoneInput.trim() || stcPhoneInput.length < 9) {
                                    showNotification('error', 'يرجى إدخال رقم هاتف STC Pay بشكل صحيح.');
                                    return;
                                  }
                                  setIsProcessingStaffPayment(true);
                                  setTimeout(() => {
                                    setStcOtpRequested(true);
                                    setIsProcessingStaffPayment(false);
                                    showNotification('success', 'تم إرسال كود التحقق OTP إلى جوالك بنجاح.');
                                  }, 1000);
                                }}
                                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                              >
                                {isProcessingStaffPayment ? 'جاري التحقق...' : 'طلب رمز التحقق OTP'}
                              </button>
                            ) : (
                              <button 
                                type="button" 
                                disabled={isProcessingStaffPayment}
                                onClick={() => {
                                  if (!stcOtpInput.trim() || stcOtpInput.length < 4) {
                                    showNotification('error', 'يرجى إدخال كود التحقق المكون من 4 أرقام.');
                                    return;
                                  }
                                  setIsProcessingStaffPayment(true);
                                  setTimeout(() => {
                                    handleBuyStaffSlot(buyStaffSlotsCountInput);
                                    setIsProcessingStaffPayment(false);
                                    setPaymentFinishedSuccess(true);
                                    setStcOtpRequested(false);
                                    setStcOtpInput('');
                                  }, 1500);
                                }}
                                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                              >
                                {isProcessingStaffPayment ? 'جاري تأكيد الكود...' : 'تأكيد الدفع بـ STC Pay'}
                              </button>
                            )}
                          </div>
                        </div>
                      )}

                      {(currentMethodKey === 'tabby' || currentMethodKey === 'tamara') && (
                        <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in duration-200 text-right" id="buy-staff-slots-bnpl">
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-right space-y-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 justify-start">
                              <Percent className="w-4 h-4 text-amber-500" />
                              <span>خيار التقسيط المرن على 4 دفعات ميسرة بدون أي فوائد إضافية:</span>
                            </div>
                            <div className="grid grid-cols-4 gap-2 text-center text-[10px] text-slate-500 font-sans">
                              <div className="bg-white border rounded-lg p-2 font-sans font-bold">
                                <span className="block text-slate-400">اليوم</span>
                                <span className="text-slate-800 text-xs font-black">{(buyStaffSlotsCountInput * staffPriceMonthly / 4).toFixed(2)} ر.س</span>
                              </div>
                              <div className="bg-white border rounded-lg p-2 font-sans font-bold">
                                <span className="block text-slate-400">الشهر القادم</span>
                                <span className="text-slate-800 text-xs font-black text-slate-850">{(buyStaffSlotsCountInput * staffPriceMonthly / 4).toFixed(2)} ر.س</span>
                              </div>
                              <div className="bg-white border rounded-lg p-2 font-sans font-bold">
                                <span className="block text-slate-400">بعد شهرين</span>
                                <span className="text-slate-800 text-xs font-black text-slate-850">{(buyStaffSlotsCountInput * staffPriceMonthly / 4).toFixed(2)} ر.s</span>
                              </div>
                              <div className="bg-white border rounded-lg p-2 font-sans font-bold">
                                <span className="block text-slate-400">بعد 3 أشهر</span>
                                <span className="text-slate-800 text-xs font-black text-slate-850">{(buyStaffSlotsCountInput * staffPriceMonthly / 4).toFixed(2)} ر.س</span>
                              </div>
                            </div>
                            <p className="text-[10px] text-slate-400 italic font-medium leading-none">سيتم ربطك بالشركة المحددة لإكمال الدفعة الأولى بضغطة واحدة وتوثيق الهوية.</p>
                          </div>

                          <div className="flex gap-2.5 pt-4 justify-end">
                            <button 
                              type="button" 
                              onClick={() => setIsBuyStaffSlotsModalOpen(false)}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
                            >
                              إلغاء
                            </button>
                            <button 
                              type="button" 
                              disabled={isProcessingStaffPayment}
                              onClick={() => {
                                setIsProcessingStaffPayment(true);
                                setTimeout(() => {
                                  handleBuyStaffSlot(buyStaffSlotsCountInput);
                                  setIsProcessingStaffPayment(false);
                                  setPaymentFinishedSuccess(true);
                                }, 1500);
                              }}
                              className={`px-5 py-2.5 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer ${
                                currentMethodKey === 'tabby' 
                                  ? 'bg-[#141414] text-[#A6FF35] hover:opacity-90' 
                                  : 'bg-[#FF5D2B] text-white hover:opacity-90'
                              }`}
                            >
                              {isProcessingStaffPayment ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  جاري التحويل الآمن وإكمال الطلب...
                                </>
                              ) : (
                                <>
                                  شراء مقاعد بالتقسيط عبر {currentMethodKey === 'tabby' ? 'تابي (Tabby)' : 'تمارا (Tamara)'}
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {currentMethodKey === 'bank_transfer' && (
                        <div className="space-y-4 border-t border-slate-100 pt-4 animate-in fade-in duration-200 text-right" id="buy-staff-slots-bank">
                          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-right space-y-3">
                            <div className="text-xs font-bold text-slate-800 flex items-center justify-between">
                              <span>التحويل للحساب البنكي المعتمد للمنصة:</span>
                              <span className="text-[10px] bg-slate-200/50 text-slate-600 font-sans px-2 py-0.5 rounded-full">معالجة يدوية</span>
                            </div>
                            <div className="space-y-2 text-xs leading-relaxed text-slate-700 bg-white p-3 rounded-xl border">
                              <div>
                                <span className="text-slate-400 block text-[10px]">البنك الرسمي للمنصّة</span>
                                <span className="font-extrabold text-slate-800">بنك الراجحي (Al Rajhi Bank)</span>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">اسم الحساب والآيبان (IBAN)</span>
                                <code className="font-mono text-[11px] font-bold text-slate-800 select-all block bg-slate-50 p-1.5 rounded text-left">
                                  SA82800000001020304050607
                                </code>
                              </div>
                              <div>
                                <span className="text-slate-400 block text-[10px]">المبلغ المطلوب حركياً بالكامل</span>
                                <span className="font-sans font-black text-amber-600 text-sm">{buyStaffSlotsCountInput * staffPriceMonthly} ر.س</span>
                              </div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 block">اسم المرسل صاحب الحساب المحول منه *</label>
                            <input
                              type="text"
                              required
                              placeholder="الاسم الثلاثي للمحوّل..."
                              value={bankSenderName}
                              onChange={e => setBankSenderName(e.target.value)}
                              className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 transition-colors bg-slate-50/50"
                            />
                          </div>

                          <div className="flex gap-2.5 pt-4 justify-end">
                            <button 
                              type="button" 
                              onClick={() => {
                                setIsBuyStaffSlotsModalOpen(false);
                                setBankSenderName('');
                              }}
                              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl cursor-pointer"
                            >
                              إلغاء
                            </button>
                            <button 
                              type="button" 
                              disabled={isProcessingStaffPayment}
                              onClick={() => {
                                if (!bankSenderName.trim()) {
                                  showNotification('error', 'يرجى كتابة اسم صاحب الحساب البنكي المحوّل منه.');
                                  return;
                                }
                                setIsProcessingStaffPayment(true);
                                setTimeout(() => {
                                  handleBuyStaffSlot(buyStaffSlotsCountInput);
                                  setIsProcessingStaffPayment(false);
                                  setPaymentFinishedSuccess(true);
                                  setBankSenderName('');
                                }, 1500);
                              }}
                              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center gap-2 cursor-pointer"
                            >
                              {isProcessingStaffPayment ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                                  جاري تأكيد الإيداع اليدوي...
                                </>
                              ) : (
                                <>تأكيد التحويل البنكي</>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
