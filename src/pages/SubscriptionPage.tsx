import React, { useState } from 'react';
import { safeSetLocalStorage } from '../utils/safeStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdBanner } from '../components/AdBanner';
import { Check, CheckCircle2, Upload, CreditCard, Wallet, FileText, ArrowRight, ArrowLeft, Loader2, Landmark, Settings, Sliders, AlignCenter, Columns, Grid } from 'lucide-react';
import { Link } from 'react-router-dom';

import { getSubscriptions } from '../utils/subscriptions';

const paymentOptions = [
  { id: 'mada', name: 'بطاقة مدى', icon: CreditCard },
  { id: 'creditCard', name: 'البطاقة الائتمانية', icon: CreditCard },
  { id: 'applePay', name: 'Apple Pay', icon: Wallet },
  { id: 'googlePay', name: 'Google Pay', icon: Wallet },
  { id: 'stcPay', name: 'STC Pay', icon: Wallet },
  { id: 'tabby', name: 'تابي (دفع آجل)', icon: FileText },
  { id: 'tamara', name: 'تمارا (دفع آجل)', icon: FileText },
  { id: 'bankTransfer', name: 'تحويل بنكي', icon: Landmark },
];

export function SubscriptionFlow({ 
  embedded = false, 
  title = 'ترقية أو تجديد الاشتراك',
  packages: propPackages,
  onSuccess
}: { 
  embedded?: boolean, 
  title?: string,
  packages?: any[],
  onSuccess?: (sub: any) => void
}) {
  const rawList = propPackages || getSubscriptions();
  const packages = rawList.filter((p: any) => 
    p.status === 'مفعل' && 
    !p.isHidden && 
    p.id !== 'hidden' && 
    p.name !== 'باقة مخفية ترويجية مخصصة' && 
    !(p.name || '').includes('مخفية')
  );
  const [currentStep, setCurrentStep] = useState(1);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [selectedPackage, setSelectedPackage] = useState<any>(null);

  const [enabledPayments] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      mada: true,
      creditMax: true,
      apple: true,
      stc: true,
      google_pay: false,
      tabby: true,
      tamara: true,
      bank_transfer: true,
    };
  });

  const settingsKeyMap: Record<string, string> = {
    'mada': 'mada',
    'creditCard': 'creditMax',
    'applePay': 'apple',
    'stcPay': 'stc',
    'googlePay': 'google_pay',
    'tabby': 'tabby',
    'tamara': 'tamara',
    'bankTransfer': 'bank_transfer',
  };

  const activeOptions = paymentOptions.filter(opt => enabledPayments[settingsKeyMap[opt.id] || opt.id]);

  const [paymentMethod, setPaymentMethod] = useState<string>(() => {
    return activeOptions.length > 0 ? activeOptions[0].id : 'creditCard';
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [referenceNumber, setReferenceNumber] = useState('');

  // System control states for layout
  const [colCount, setColCount] = useState<number>(() => {
    return Number(localStorage.getItem('sub_grid_columns') || '3');
  });
  const [spacing, setSpacing] = useState<string>(() => {
    return localStorage.getItem('sub_grid_spacing') || 'gap-6';
  });
  const [alignCenter, setAlignCenter] = useState<boolean>(() => {
    return localStorage.getItem('sub_grid_align_center') !== 'false';
  });

  React.useEffect(() => {
    const handleSettingsUpdate = () => {
      setColCount(Number(localStorage.getItem('sub_grid_columns') || '3'));
      setSpacing(localStorage.getItem('sub_grid_spacing') || 'gap-6');
      setAlignCenter(localStorage.getItem('sub_grid_align_center') !== 'false');
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);

  const getCardWidthClass = (cols: number) => {
    if (cols === 1) return 'w-full max-w-[500px]';
    if (cols === 2) return 'w-full md:w-[calc(50%-12px)] max-w-[480px]';
    if (cols === 3) return 'w-full md:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] max-w-[380px]';
    return 'w-full sm:w-[calc(50%-12px)] lg:w-[calc(33.333%-16px)] xl:w-[calc(25%-18px)] max-w-[320px]';
  };

  // Form states for validation
  const [bankName, setBankName] = useState('');
  const [iban, setIban] = useState('');
  const [commercialRecord, setCommercialRecord] = useState('');

  const [cardNumber, setCardNumber] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [receiptFile, setReceiptFile] = useState<File | null>(null);

  React.useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.bankName) setBankName(parsed.bankName);
        if (parsed.iban) setIban(parsed.iban);
        if (parsed.commercialRecord) setCommercialRecord(parsed.commercialRecord);
      } catch (e) {}
    }
  }, []);

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleSelectPackage = (pkg: any) => {
    setSelectedPackage(pkg);
    setCurrentStep(2);
  };

  const calculateTotal = () => {
    if (!selectedPackage) return { subtotal: 0, vat: 0, total: 0 };
    const subtotal = billingCycle === 'monthly' ? selectedPackage.priceMonthly : selectedPackage.priceYearly;
    const vat = parseFloat((subtotal * 0.15).toFixed(2));
    const total = parseFloat((subtotal + vat).toFixed(2));
    return { subtotal, vat, total };
  };

  const isValidStep3 = () => {
    // Provider specific fields are required for any subscription package upgrade
    if (!bankName.trim() || !iban.trim() || !commercialRecord.trim()) {
      return false;
    }

    if (paymentMethod === 'creditCard' || paymentMethod === 'mada') {
        return cardNumber.length >= 16 && cardName.trim().length > 0 && expiry.length >= 4 && cvv.length >= 3;
    }
    if (paymentMethod === 'bankTransfer') {
        return receiptFile !== null;
    }
    return true; // Wallet or BNPL
  };

  const handleProcessPayment = () => {
    if (!isValidStep3()) return;
    
    setIsProcessing(true);
    
    const proceedWithPayment = (receiptDataUrl = '') => {
        setIsProcessing(false);
        setReferenceNumber('SUB-' + Math.floor(Math.random() * 1000000));
        
        const storedUser = localStorage.getItem('currentUser');
        let currentProviderName = '';
        let currentUserId = '';
        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            currentProviderName = parsedUser.name || 'مزود جديد';
            currentUserId = parsedUser.id || '';
          } catch {}
        }

        const { subtotal, vat, total } = calculateTotal();

        if (paymentMethod === 'bankTransfer') {
          // Create bank transfer pending request in Messages/Mail
          const storedMails = localStorage.getItem('PLATFORM_MAIL_MESSAGES');
          let mails = [];
          if (storedMails) {
            try { mails = JSON.parse(storedMails); } catch(e) {}
          }

          const mailId = 'mail_sub_req_' + Date.now();
          const receiptName = receiptFile ? receiptFile.name : 'إيصال_تحويل_بنكي.png';
          
          const newMail = {
            id: mailId,
            sender: currentProviderName || 'شريك جديد',
            recipient: 'الإدارة',
            subject: `🚨 طلب موافقة وتفعيل باقة اشتراك: ${selectedPackage.name} (${billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'})`,
            body: `السلام عليكم ورحمة الله وبركاته،\n\nنود إفادتكم بتقديم طلب ترقية باقة الاشتراك الخاصة بنا إلى "${selectedPackage.name}".\nلقد قمنا بتحويل رسوم الاشتراك المطلوبة وأرفقنا إيصال التحويل البنكي للمراجعة والتدقيق المالي الفوري.\n\nتفاصيل طلب الترقية:\n- الشريك مقدم الطلب: ${currentProviderName || 'شريك جديد'}\n- الباقة المطلوبة: ${selectedPackage.name}\n- الدورة المالية للاشتراك: ${billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}\n- المبلغ المحول: ${total} ر.س\n\nالرجاء التحقق من كشوف الحساب السريعة للبنك والموافقة لتفعيل صلاحيات الباقة فوراً.\n\nوتقبلوا وافر الاحترام والتقدير.\nمقدم الطلب: ${currentProviderName || 'شريك جديد'}`,
            createdAt: new Date().toISOString(),
            attachments: [
              { name: receiptName, size: '1.2 MB', type: 'png', isBankReceipt: true, receiptPreview: receiptDataUrl || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60' }
            ],
            isReadByAdmin: false,
            isReadByProvider: true,
            deletedByAdmin: false,
            deletedByProvider: false,
            isSubscriptionApprovalRequest: true,
            approvalStatus: 'pending',
            upgradeDetails: {
              planId: selectedPackage.id,
              packageName: selectedPackage.name,
              billingCycle: billingCycle,
              price: total,
              rawPrice: subtotal,
              vatPrice: vat,
              currentProviderName: currentProviderName || 'شريك جديد',
              providerId: currentUserId
            }
          };

          mails.unshift(newMail);
          localStorage.setItem('PLATFORM_MAIL_MESSAGES', JSON.stringify(mails));

          // Directly sync to central database configurations endpoint so it is saved to the Cloud
          fetch('/api/system/configs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: 'PLATFORM_MAIL_MESSAGES', value: mails })
          }).then(res => res.json()).then(data => {
            console.log("Successfully synced subscription request mail to database:", data);
          }).catch(err => {
            console.error("Failed to sync subscription request mail to database:", err);
          });

          // Save pending state in localStorage for current provider
          localStorage.setItem(`pending_sub_request_${currentProviderName}`, JSON.stringify(newMail.upgradeDetails));
          localStorage.setItem('pending_subscription_under_review', 'true');

          // Create notification for admin
          const storedNotifs = localStorage.getItem('app_notifications') || '[]';
          let notificationsList = [];
          try { notificationsList = JSON.parse(storedNotifs); } catch(e) {}
          notificationsList.unshift({
            id: 'notif_sub_' + Date.now(),
            title: '🚨 طلب ترقية باقة جديد (حوالة بنكية)',
            body: `قدم الشريك "${currentProviderName}" طلب ترقية باقة إلى "${selectedPackage.name}". يرجى تلمس إيصال التحويل المرفق بالبريد للموافقة أو الرفض.`,
            createdAt: new Date().toISOString(),
            type: 'mail',
            severity: 'high',
            recipientRole: 'admin',
            isRead: false
          });
          localStorage.setItem('app_notifications', JSON.stringify(notificationsList));
          
          window.dispatchEvent(new Event('notificationsUpdated'));
          window.dispatchEvent(new Event('mailMessagesUpdated'));
          window.dispatchEvent(new Event('subscriptionUpdated'));

          // Transition to Step 4 indicating review
          setCurrentStep(4);
          return;
        }

        // Automated credit card/mada/etc immediately activated
        const newSub = { 
          planId: selectedPackage.id, 
          packageName: selectedPackage.name,
          packageName_display: selectedPackage.name,
          includesInventory: selectedPackage.includesInventory,
          includesSuppliers: selectedPackage.includesSuppliers,
          canExportFinancials: selectedPackage.canExportFinancials,
          hasSupport: selectedPackage.hasSupport,
          includesGrowthCharts: selectedPackage.includesGrowthCharts,
          includesFinancialForecast: selectedPackage.includesFinancialForecast,
          includesPartialPayment: selectedPackage.includesPartialPayment,
          includesAdvancedStats: selectedPackage.includesAdvancedStats,
          includesFullManagement: selectedPackage.includesFullManagement,
          includesAdvancedProviderDashboard: selectedPackage.includesAdvancedProviderDashboard,
          includesMiniProductsStore: selectedPackage.includesMiniProductsStore ?? (selectedPackage.id === 'pro' || selectedPackage.name?.includes('الاحترافية') || false),
          includesWhatsAppCampaignAlerts: selectedPackage.includesWhatsAppCampaignAlerts ?? (selectedPackage.id === 'pro' || selectedPackage.id === 'business' || selectedPackage.name?.includes('الاحترافية') || selectedPackage.name?.includes('الأعمال') || false),
          hallsLimit: selectedPackage.hallsLimit,
          servicesLimit: selectedPackage.servicesLimit,
          staffSeatsLimit: selectedPackage.staffSeatsLimit,
          billingCycle: billingCycle,
          price: billingCycle === 'monthly' ? selectedPackage.priceMonthly : selectedPackage.priceYearly,
          commissionRate: selectedPackage.commissionRate,
          startDate: new Date().toISOString()
        };

        if (storedUser) {
          try {
            const parsedUser = JSON.parse(storedUser);
            parsedUser.role = 'مزود';
            parsedUser.packageName = selectedPackage.name;
            parsedUser.bankName = bankName;
            parsedUser.iban = iban;
            parsedUser.commercialRecord = commercialRecord;
            localStorage.setItem('currentUser', JSON.stringify(parsedUser));
            if (parsedUser.name) {
              localStorage.setItem(`provider_subscription_${parsedUser.name}`, JSON.stringify(newSub));
            }

            if (parsedUser.email) {
              fetch('/api/auth/update-role', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: parsedUser.email, role: 'مزود' })
              }).catch(e => console.warn('DB role sync failed:', e));

              // Save legal provider particulars in DB as well
              fetch('/api/users/complete-profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: parsedUser.email,
                  bankName,
                  iban,
                  commercialRecord
                })
              }).then(res => res.json()).then(resData => {
                console.log('Complete Profile DB sync success:', resData);
              }).catch(e => console.warn('DB profile fields sync failed:', e));
            }

            if (parsedUser.id) {
              fetch('/api/subscriptions/upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  providerIds: [Number(parsedUser.id)],
                  planName: selectedPackage.name,
                  pricePaid: billingCycle === 'monthly' ? selectedPackage.priceMonthly : selectedPackage.priceYearly,
                  durationMonths: billingCycle === 'monthly' ? 1 : 12,
                  notes: `ترقية ذاتية للمزود من صفحة الباقات`
                })
              }).catch(e => console.warn('DB subscription upgrade failed:', e));
            }
          } catch {}
        }
        
        const specificKey = currentProviderName ? `provider_subscription_${currentProviderName}` : 'provider_subscription';
        localStorage.setItem(specificKey, JSON.stringify(newSub));
        localStorage.setItem('provider_subscription', JSON.stringify(newSub));

        try {
          const savedProviders = localStorage.getItem('providersData');
          if (savedProviders && currentProviderName) {
            const list = JSON.parse(savedProviders);
            const item = list.find((p: any) => p.name === currentProviderName);
            if (item) {
              item.packageName = selectedPackage.name;
              item.packageDuration = billingCycle;
              safeSetLocalStorage('providersData', list);
            }
          }
        } catch (e) {}

        window.dispatchEvent(new Event('subscriptionUpdated'));
        window.dispatchEvent(new Event('currentUserUpdated'));

        if (onSuccess) onSuccess(newSub);
        setCurrentStep(4);
    };

    if (paymentMethod === 'bankTransfer' && receiptFile) {
      const reader = new FileReader();
      reader.onload = () => {
        proceedWithPayment(reader.result as string);
      };
      reader.onerror = () => {
        proceedWithPayment('');
      };
      reader.readAsDataURL(receiptFile);
    } else {
      setTimeout(() => proceedWithPayment(''), 1500);
    }
  };

  const { subtotal, vat, total } = calculateTotal();

  let paymentButtonText = "ادفع بطريقة آمنة";
  if (paymentMethod === 'creditCard') paymentButtonText = `ادفع ${total} ر.س بالبطاقة واشترك`;
  if (paymentMethod === 'mada') paymentButtonText = `ادفع ${total} ر.س بمدى واشترك`;
  if (paymentMethod === 'bankTransfer') paymentButtonText = `تأكيد التحويل`;
  if (paymentMethod === 'tabby') paymentButtonText = `المتابعة مع تابي`;
  if (paymentMethod === 'tamara') paymentButtonText = `المتابعة مع تمارا`;
  if (paymentMethod === 'applePay') paymentButtonText = `الدفع عبر Apple Pay`;
  if (paymentMethod === 'googlePay') paymentButtonText = `الدفع عبر Google Pay`;
  if (paymentMethod === 'stcPay') paymentButtonText = `الدفع عبر STC Pay`;

  return (
      <div className={`flex-grow flex flex-col items-center w-full px-4 sm:px-6 ${embedded ? 'py-4' : 'py-12'}`} dir="rtl">
        {/* Stepper Header */}
        {currentStep < 4 && (
          <div className="w-full max-w-6xl mb-12">
            <h1 className="text-3xl font-bold text-center text-gray-900 mb-8">{title}</h1>
            <div className="flex items-center justify-between relative before:absolute before:inset-0 before:top-1/2 before:-translate-y-1/2 before:h-0.5 before:bg-gray-200 before:z-0">
               {[1, 2, 3].map((step) => (
                  <div key={step} className="relative z-10 flex flex-col items-center">
                     <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold border-2 transition-colors duration-300 ${
                         currentStep === step ? 'bg-blue-900 border-blue-900 text-white' : 
                         currentStep > step ? 'bg-blue-900 border-blue-900 text-white' : 'bg-white border-gray-300 text-gray-400'
                     }`}>
                         {currentStep > step ? <Check className="w-5 h-5" /> : step}
                     </div>
                     <span className={`text-sm mt-2 font-medium ${currentStep >= step ? 'text-gray-900' : 'text-gray-400'}`}>
                         {step === 1 ? 'اختيار الباقة' : step === 2 ? 'ملخص الطلب' : 'إتمام الدفع'}
                     </span>
                  </div>
               ))}
               {/* Active Line Fill */}
               <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-blue-900 z-0 transition-all duration-300" style={{
                   width: currentStep === 1 ? '0%' : currentStep === 2 ? '50%' : '100%',
                   right: 0
               }} />
            </div>
          </div>
        )}

        {/* --- Step 1: Package Selection --- */}
        {currentStep === 1 && (
            <div className="w-full max-w-7xl animate-in fade-in duration-500">
                <div className="flex justify-center items-center mb-10 gap-3">
                    <span className={`font-medium ${billingCycle === 'monthly' ? 'text-gray-900' : 'text-gray-500'}`}>شهري</span>
                    <button 
                       type="button"
                       onClick={() => setBillingCycle(b => b === 'monthly' ? 'yearly' : 'monthly')}
                       className="relative w-16 h-8 bg-gray-200 rounded-full cursor-pointer transition-colors focus:outline-none"
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-transform duration-300 shadow-sm ${billingCycle === 'yearly' ? 'left-1' : 'right-1'}`}></div>
                    </button>
                    <span className={`font-medium flex items-center gap-2 ${billingCycle === 'yearly' ? 'text-gray-900' : 'text-gray-500'}`}>
                        سنوي
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold border border-gray-200">خصم 20%</span>
                    </span>
                </div>



                {/* الحاوية المتناسقة والمضادة لأشرطة التمرير */}
                <div 
                    className={`w-full ${
                        alignCenter 
                            ? 'flex flex-row flex-wrap justify-center' 
                            : `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${colCount}`
                    } ${spacing}`}
                >
                    {packages.map((pkg: any) => (
                        <div 
                            key={pkg.id} 
                            className={`flex flex-col bg-white rounded-2xl relative transition-all duration-300 hover:shadow-lg ${
                                pkg.isPopular ? 'border-2 border-blue-900 shadow-md' : 'border border-gray-200 shadow-sm'
                            } p-6 ${alignCenter ? getCardWidthClass(colCount) : 'w-full'}`}
                        >
                            {pkg.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-900 text-white text-xs font-bold px-4 py-1 rounded-full whitespace-nowrap">
                                    الأكثر طلباً
                                </div>
                            )}
                            
                            {Math.round(100 - (pkg.priceYearly / (pkg.priceMonthly * 12)) * 100) > 0 && (
                                <div className="absolute -top-4 -left-4 bg-red-600 text-white px-5 py-3 rounded-2xl font-black text-2xl shadow-[0_10px_20px_rgba(220,38,38,0.3)] z-20 border-4 border-white transform -rotate-12 flex flex-col items-center leading-none">
                                    <span className="text-sm uppercase tracking-tighter opacity-80 mb-1">توفير</span>
                                    {Math.round(100 - (pkg.priceYearly / (pkg.priceMonthly * 12)) * 100)}%
                                </div>
                            )}

                            <h3 className="text-xl font-bold text-gray-900 mb-2">{pkg.name}</h3>
                            <div className="mb-6 flex items-baseline gap-1">
                                <span className="text-4xl font-bold text-gray-900">
                                    {billingCycle === 'monthly' ? pkg.priceMonthly : pkg.priceYearly}
                                </span>
                                <span className="text-gray-500 font-medium pb-1">ر.س / {billingCycle === 'monthly' ? 'شهر' : 'سنة'}</span>
                            </div>
                            
                            <ul className="space-y-4 mb-8 flex-grow">
                                {(typeof (pkg.features || '') === 'string' ? (pkg.features || '').split('\n') : (pkg.features || [])).map((feature: string, i: number) => (
                                    <li key={i} className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                        <span className="text-gray-600 text-sm leading-relaxed">{feature}</span>
                                    </li>
                                ))}
                                {pkg.hallsLimit !== undefined && pkg.hallsLimit !== null && (pkg.hallsLimit === '' || pkg.hallsLimit === 'unlimited' ? true : Number(pkg.hallsLimit) > 0) && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">
                                            {pkg.hallsLimit === '' || pkg.hallsLimit === 'unlimited' ? 'عدد غير محدود من القاعات' : `إضافة حتى ${pkg.hallsLimit} قاعات`}
                                        </span>
                                    </li>
                                )}
                                {pkg.servicesLimit !== undefined && pkg.servicesLimit !== null && (pkg.servicesLimit === '' || pkg.servicesLimit === 'unlimited' ? true : Number(pkg.servicesLimit) > 0) && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">
                                            {pkg.servicesLimit === '' || pkg.servicesLimit === 'unlimited' ? 'عدد غير محدود من الخدمات المساندة' : `إضافة حتى ${pkg.servicesLimit} خدمات مساندة`}
                                        </span>
                                    </li>
                                )}
                                {pkg.staffSeatsLimit !== undefined && pkg.staffSeatsLimit !== null && pkg.staffSeatsLimit !== '0' && pkg.staffSeatsLimit !== 0 && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-950 font-medium text-sm">
                                            عدد تراخيص الموظفين للكادر: {pkg.staffSeatsLimit === '' || pkg.staffSeatsLimit === 'unlimited' ? 'لا محدود ♾️' : `${pkg.staffSeatsLimit} مقاعد`}
                                        </span>
                                    </li>
                                )}
                                {pkg.includesInventory && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">يشمل نظام إدارة المخزون</span>
                                    </li>
                                )}
                                {pkg.includesSuppliers && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">يشمل نظام إدارة الموردين</span>
                                    </li>
                                )}
                                {pkg.canExportFinancials && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">يشمل ميزة استعراض وتصدير الفواتير</span>
                                    </li>
                                )}
                                {pkg.hasSupport && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">يشمل نظام الدعم الفني والمحادثة المباشرة</span>
                                    </li>
                                )}
                                {pkg.includesGrowthCharts && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">يشمل ميزة الرسومات التفاعلية والنمو</span>
                                    </li>
                                )}
                                {pkg.includesFinancialForecast && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm">يشمل ميزة ميزانية التوقعات المالية الذكية</span>
                                    </li>
                                )}
                                {pkg.includesPartialPayment && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm text-amber-600">يشمل ميزة نظام الدفع الجزئي (العربون)</span>
                                    </li>
                                )}
                                {pkg.includesMiniProductsStore && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm font-bold text-emerald-700">يشمل ميزة متجر المنتجات والمستلزمات المصغر</span>
                                    </li>
                                )}
                                {pkg.includesWhatsAppCampaignAlerts && (
                                    <li className="flex items-start gap-3 text-right">
                                        <Check className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                        <span className="text-gray-900 font-medium text-sm font-bold text-emerald-700">تفعيل إشعارات رسائل واتس أب في الحملات التسويقية</span>
                                    </li>
                                )}
                            </ul>

                            <button
                                type="button"
                                onClick={() => handleSelectPackage(pkg)}
                                className={`w-full py-3 rounded-xl font-bold transition-colors ${pkg.isPopular ? 'bg-blue-900 hover:bg-blue-800 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-900'}`}
                            >
                                اختر الباقة
                            </button>
                        </div>
                    ))}
                </div>

                {/* Promotional / Partner Ad Banner */}
                <div className="mt-12 max-w-4xl mx-auto w-full">
                    <AdBanner placement="صفحة باقات الاشتراك للمزودين" layout="card" className="w-full shadow-sm" />
                </div>
            </div>
        )}

        {/* --- Step 2 & 3: Checkout and Payment --- */}
        {(currentStep === 2 || currentStep === 3) && selectedPackage && (
            <div className="w-full max-w-5xl flex flex-col lg:flex-row gap-8 animate-in fade-in duration-500">
                
                {/* Main Content (Left/Right side depending on layout) */}
                <div className="flex-grow space-y-8 order-2 lg:order-1 border border-gray-200 bg-white p-6 sm:p-8 rounded-2xl shadow-sm">
                    {currentStep === 2 ? (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">اختيار طريقة الدفع</h2>
                                <button type="button" onClick={() => setCurrentStep(1)} className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1">
                                    <ArrowRight className="w-4 h-4" /> رجوع
                                </button>
                            </div>
                            
                            {/* التزام بقرارات الإدارة لبوابات الدفع الفعالة */}
                            {(() => {
                                let enabled: Record<string, boolean> = {
                                  moyasar: true,
                                  hyperpay: false,
                                  paytabs: false,
                                  geidea: false,
                                  tabby_api: true,
                                  tamara_api: true
                                };
                                try {
                                  const stored = localStorage.getItem('ADMIN_ENABLED_GATEWAYS');
                                  if (stored) enabled = JSON.parse(stored);
                                } catch (e) {}

                                const gatewaysList = [
                                  { title: 'مُيسر (Moyasar)', key: 'moyasar' },
                                  { title: 'هايبر باي (HyperPay)', key: 'hyperpay' },
                                  { title: 'بي تابس (PayTabs)', key: 'paytabs' },
                                  { title: 'جيديا (Geidea)', key: 'geidea' },
                                  { title: 'تابي (Tabby)', key: 'tabby_api' },
                                  { title: 'تمارا (Tamara)', key: 'tamara_api' }
                                ];
                                
                                const activeOnes = gatewaysList.filter(g => enabled[g.key]);
                                
                                // Determine active gateway for current selection
                                let activeGWKey = 'moyasar';
                                if (paymentMethod === 'tabby') {
                                  activeGWKey = 'tabby_api';
                                } else if (paymentMethod === 'tamara') {
                                  activeGWKey = 'tamara_api';
                                } else if (paymentMethod !== 'bankTransfer') {
                                  const standardKeys = ['moyasar', 'hyperpay', 'paytabs', 'geidea'];
                                  activeGWKey = standardKeys.find(k => enabled[k]) || localStorage.getItem('ADMIN_ACTIVE_GATEWAY') || 'moyasar';
                                }

                                const activeGWName = gatewaysList.find(g => g.key === activeGWKey)?.title || 'مُيسر (Moyasar)';

                                return (
                                    <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-4 mb-4 text-xs text-amber-900 space-y-2">
                                        <div className="flex items-center justify-between flex-wrap gap-2">
                                            <div className="flex items-center gap-2">
                                                <span className="flex h-2 w-2 relative">
                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                                </span>
                                                <span className="font-bold text-slate-800">بوابات الدفع النشطة بالمنصة:</span>
                                            </div>
                                            <div className="flex flex-wrap gap-1">
                                                {activeOnes.map(g => (
                                                    <span key={g.key} className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200">{g.title}</span>
                                                ))}
                                            </div>
                                        </div>
                                        {paymentMethod !== 'bankTransfer' && (
                                            <div className="pt-2 border-t border-amber-200/50 flex justify-between items-center text-slate-705">
                                                <span className="font-medium">سيتم معالجة عملية الدفع هذه عبر بوابة:</span>
                                                <span className="bg-amber-100/80 px-2 py-0.5 rounded font-black text-[11px] text-amber-900 border border-amber-200">{activeGWName}</span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                            
                            <div className="space-y-3">
                                {activeOptions.map(option => (
                                    <label key={option.id} className={`flex items-center p-4 border rounded-xl cursor-pointer transition-colors ${paymentMethod === option.id ? 'border-amber-500 bg-amber-50/10' : 'border-gray-200 hover:border-gray-300'}`}>
                                        <div className="relative flex items-center justify-center w-5 h-5 ml-4">
                                            <input 
                                                type="radio" 
                                                name="paymentMethod" 
                                                value={option.id}
                                                checked={paymentMethod === option.id}
                                                onChange={() => setPaymentMethod(option.id)}
                                                className="opacity-0 absolute inset-0 cursor-pointer"
                                            />
                                            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === option.id ? 'border-amber-500' : 'border-gray-300'}`}>
                                                {paymentMethod === option.id && <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>}
                                            </div>
                                        </div>
                                        <option.icon className={`w-6 h-6 ml-3 ${paymentMethod === option.id ? 'text-amber-500' : 'text-gray-400'}`} />
                                        <span className={`font-medium ${paymentMethod === option.id ? 'text-gray-900 font-bold' : 'text-gray-600'}`}>{option.name}</span>
                                    </label>
                                ))}
                            </div>

                            <button type="button" onClick={() => setCurrentStep(3)} className="w-full mt-8 bg-blue-900 hover:bg-blue-800 text-white font-bold py-4 rounded-xl transition-colors">
                                المتابعة لإدخال البيانات
                            </button>
                        </>
                    ) : (
                        <>
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold text-gray-900">تفاصيل الدفع ومقدم الخدمة</h2>
                                <button type="button" disabled={isProcessing} onClick={() => setCurrentStep(2)} className="text-sm font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 disabled:opacity-50">
                                    <ArrowRight className="w-4 h-4" /> رجوع
                                </button>
                            </div>

                            {/* بيانات مستلم الحوالات ومزود الخدمة */}
                            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 mb-8 space-y-4">
                                <h3 className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2">بيانات مزود الخدمة القانونية والمصرفية (مطلوبة لتفعيل الأرباح وترقيتك كشريك)</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">اسم البنك <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="مثال: مصرف الراجحي" 
                                            value={bankName}
                                            onChange={e => setBankName(e.target.value)}
                                            className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:border-amber-500 outline-none bg-white font-medium shadow-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">رقم الآيبان (IBAN) <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="SA..." 
                                            value={iban}
                                            onChange={e => setIban(e.target.value)}
                                            className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:border-amber-500 outline-none bg-white font-mono font-medium shadow-sm text-left"
                                            dir="ltr"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-1.5">رقم السجل التجاري <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            required
                                            placeholder="مكون من 10 خانات" 
                                            value={commercialRecord}
                                            onChange={e => setCommercialRecord(e.target.value)}
                                            className="w-full text-xs p-3 border border-gray-200 rounded-xl focus:border-amber-500 outline-none bg-white font-medium shadow-sm text-center font-mono"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="mb-8">
                                {paymentMethod === 'creditCard' && (
                                    <div className="space-y-4 animate-in fade-in duration-300">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">رقم البطاقة</label>
                                            <div className="relative">
                                                <input 
                                                   type="text" 
                                                   placeholder="0000 0000 0000 0000"
                                                   value={cardNumber}
                                                   onChange={e => setCardNumber(formatCardNumber(e.target.value))}
                                                   maxLength={19}
                                                   className="w-full p-3 pl-10 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-left font-mono" 
                                                   dir="ltr"
                                                />
                                                <CreditCard className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">اسم حامل البطاقة</label>
                                            <input 
                                              type="text" 
                                              value={cardName}
                                              onChange={e => setCardName(e.target.value)}
                                              placeholder="الاسم كما هو على البطاقة" 
                                              className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900" 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">تاريخ الانتهاء</label>
                                                <input 
                                                  type="text" 
                                                  placeholder="MM/YY" 
                                                  value={expiry}
                                                  onChange={e => setExpiry(e.target.value)}
                                                  maxLength={5}
                                                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-left font-mono" 
                                                  dir="ltr"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">رمز التحقق (CVV)</label>
                                                <input 
                                                  type="text" 
                                                  placeholder="123" 
                                                  value={cvv}
                                                  onChange={e => setCvv(e.target.value)}
                                                  maxLength={4}
                                                  className="w-full p-3 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-900 focus:ring-1 focus:ring-blue-900 text-left font-mono" 
                                                  dir="ltr"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {(paymentMethod === 'applePay' || paymentMethod === 'googlePay' || paymentMethod === 'stcPay') && (
                                    <div className="flex flex-col items-center justify-center p-8 border border-gray-100 rounded-xl bg-gray-50 text-center animate-in fade-in duration-300">
                                        <Wallet className="w-16 h-16 text-gray-400 mb-4" />
                                        <p className="text-gray-600 mb-6 font-medium">سيتم فتح نافذة الدفع المباشر عبر المحفظة الرقمية بأمان وبدون رسوم إضافية.</p>
                                        <div className={`w-full max-w-sm h-14 rounded-xl flex items-center justify-center cursor-pointer transition-opacity hover:opacity-90 ${paymentMethod === 'applePay' ? 'bg-black text-white' : paymentMethod === 'googlePay' ? 'bg-white border border-gray-300 text-gray-800' : 'bg-[#4F008C] text-white'}`}>
                                            <span className="font-bold">{paymentButtonText}</span>
                                        </div>
                                    </div>
                                )}

                                {(paymentMethod === 'tabby' || paymentMethod === 'tamara') && (
                                    <div className="p-6 border border-gray-100 rounded-xl bg-gray-50 flex flex-col items-center text-center animate-in fade-in duration-300">
                                        <div className="bg-white p-4 rounded-xl shadow-sm mb-4 border border-gray-100 flex items-center justify-center w-20 h-20">
                                            <span className="font-black text-xl tracking-tighter" style={{ color: paymentMethod === 'tabby' ? '#3EEDAE' : '#F68B75' }}>
                                              {paymentMethod === 'tabby' ? 'tabby' : 'tamara'}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-gray-900 mb-2">قسّم فاتورتك على 4 دفعات ميسرة</h3>
                                        <p className="text-sm text-gray-600 mb-6 max-w-sm">
                                            عند الضغط على المتابعة، سيتم إعادة توجيهك بأمان لصفحة الدفع الخاصة بـ {paymentMethod === 'tabby' ? 'تابي' : 'تمارا'} لإكمال طلبك.
                                        </p>
                                        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden flex">
                                            <div className="bg-gray-400 h-full w-1/4 mb-1 border-r border-white"></div>
                                            <div className="bg-gray-300 h-full w-1/4 border-r border-white"></div>
                                            <div className="bg-gray-200 h-full w-1/4 border-r border-white"></div>
                                            <div className="bg-gray-100 h-full w-1/4"></div>
                                        </div>
                                        <div className="w-full flex justify-between text-xs text-gray-500 mt-2 font-medium">
                                            <span>اليوم</span>
                                            <span>شهر 1</span>
                                            <span>شهر 2</span>
                                            <span>شهر 3</span>
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'bankTransfer' && (
                                    <div className="space-y-6 animate-in fade-in duration-300">
                                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                                            <h4 className="font-bold text-gray-900 mb-4 text-sm">بيانات الحساب البنكي</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                                <div>
                                                    <span className="block text-gray-500 mb-1">اسم البنك</span>
                                                    <span className="font-bold text-gray-800">مصرف الراجحي</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-500 mb-1">اسم الحساب</span>
                                                    <span className="font-bold text-gray-800">مؤسسة المنصة لتقنية المعلومات</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-500 mb-1">رقم الحساب</span>
                                                    <span className="font-bold text-gray-800 font-mono">123456789012345</span>
                                                </div>
                                                <div>
                                                    <span className="block text-gray-500 mb-1">رقم الآيبان (IBAN)</span>
                                                    <span className="font-bold text-gray-800 font-mono text-left" dir="ltr">SA 12 8000 0000 1234 5678 9012</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">إيصال التحويل</label>
                                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                    <Upload className="w-8 h-8 text-gray-400 mb-2" />
                                                    <p className="text-sm text-gray-500 font-medium">اضغط لرفع صورة إيصال التحويل</p>
                                                    {receiptFile && <p className="text-xs text-blue-600 font-bold mt-2">{receiptFile.name}</p>}
                                                </div>
                                                <input type="file" className="hidden" accept="image/*,.pdf" onChange={e => setReceiptFile(e.target.files?.[0] || null)} />
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <button 
                               type="button"
                               onClick={handleProcessPayment} 
                               disabled={!isValidStep3() || isProcessing}
                               className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${
                                 !isValidStep3() ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 
                                 isProcessing ? 'bg-blue-900/80 text-white cursor-wait' : 'bg-blue-900 hover:bg-blue-800 text-white shadow-md hover:shadow-lg'
                               }`}
                            >
                                <div className="flex items-center justify-center gap-2">
                                  {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                                  {isProcessing ? 'جاري المعالجة...' : paymentButtonText}
                                </div>
                            </button>
                        </>
                    )}
                </div>

                {/* Summary Sidebar (Right side inherently since flex-row and order-1 is left) */}
                <div className="w-full lg:w-96 order-1 lg:order-2 shrink-0">
                    <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 sticky top-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-200 pb-4">ملخص الطلب</h3>
                        
                        <div className="space-y-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="font-bold text-gray-800">{selectedPackage.name}</div>
                                    <div className="text-sm text-gray-500 mt-1">
                                        دورة الفوترة: {billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
                                    </div>
                                </div>
                                <div className="font-bold text-gray-900">
                                    {subtotal} ر.س
                                </div>
                            </div>
                            
                            <div className="flex justify-between text-sm text-gray-600 border-t border-gray-200 pt-4">
                                <span>القيمة الأساسية</span>
                                <span>{subtotal} ر.س</span>
                            </div>
                            <div className="flex justify-between text-sm text-gray-600">
                                <span>ضريبة القيمة المضافة (15%)</span>
                                <span>{vat} ر.س</span>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4 flex justify-between items-end">
                            <span className="font-bold text-gray-900">الإجمالي النهائي</span>
                            <div className="text-right">
                                <span className="text-2xl font-bold text-gray-900">{total}</span>
                                <span className="text-sm text-gray-500 mr-1">ر.س</span>
                            </div>
                        </div>
                        
                        <div className="mt-8 bg-white border border-gray-200 rounded-lg p-3 text-xs text-gray-500 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                            جميع الأسعار تشمل ضريبة القيمة المضافة. يمكنك الإلغاء في أي وقت.
                        </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- Step 4: Success Screen --- */}
        {currentStep === 4 && (
            <div className="w-full max-w-lg bg-white rounded-3xl border border-gray-100 shadow-xl p-10 text-center animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
                <h1 className="text-3xl font-black text-gray-900 mb-4">تم الاشتراك بنجاح</h1>
                <p className="text-gray-600 text-lg mb-8">
                    مرحباً بك في <span className="font-bold text-blue-900">{selectedPackage?.name}</span>، شكراً لثقتكم بنا.
                </p>
                
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-8">
                    <div className="text-sm text-gray-500 mb-1">الرقم المرجعي للعملية</div>
                    <div className="font-mono font-bold text-gray-800 text-lg tracking-widest">{referenceNumber}</div>
                </div>

                {!embedded ? (
                  <Link to="/dashboard" className="inline-flex justify-center w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-bold transition-colors">
                      العودة للوحة التحكم
                  </Link>
                ) : (
                  <button type="button" onClick={() => window.location.reload()} className="inline-flex justify-center w-full bg-blue-900 hover:bg-blue-800 text-white py-4 rounded-xl font-bold transition-colors">
                      العودة للوحة التحكم
                  </button>
                )}
            </div>
        )}
      </div>
  );
}

export default function SubscriptionPage() {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans flex flex-col">
      <Header />
      <SubscriptionFlow />
      <Footer />
    </div>
  );
}
