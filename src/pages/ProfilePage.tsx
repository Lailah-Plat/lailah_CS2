import React, { useState, useEffect } from 'react';
import { safeSetLocalStorage } from '../utils/safeStorage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { User, Mail, Phone, MapPin, Briefcase, Camera, ShieldAlert, Trash2, X, AlertTriangle, Save, Edit3, Map, CheckCircle2, Zap, Check, CreditCard, ArrowUpRight, Lock, Star, ShieldCheck, RefreshCw, Clock } from 'lucide-react';
import { PhoneInput, NationalIdInput, TaxNumberInput } from '../components/common/ValidationInputs';
import IbanInput from '../components/common/IbanInput';
import GoogleMapsModal from '../components/common/GoogleMapsModal';
import { getSubscriptions } from '../utils/subscriptions';

const saudiRegions = [
  'الرياض', 'مكة المكرمة', 'المدينة المنورة', 'القصيم', 'الشرقية', 
  'عسير', 'تبوك', 'حائل', 'الحدود الشمالية', 'جازان', 'نجران', 'الباحة', 'الجوف'
];

export default function ProfilePage() {
  const [user, setUser] = useState({
    name: 'مستخدم النظام',
    idNumber: '',
    idExpiryDate: '',
    email: '',
    phone: '',
    role: 'عميل', // موظف، مزود، عميل
    region: '',
    city: '',
    nationalAddress: '',
    extraAddress: '',
    taxNumber: '',
    iban: '',
    bio: '',
    imagePreview: 'https://i.pravatar.cc/150?img=11',
    image: '',
    avatar: '',
    avatarUrl: '',
    dbId: undefined as number | undefined,
    id: undefined as number | undefined,
    pledge: false
  });
  
  const [isEditing, setIsEditing] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    idNumber: string;
    idExpiryDate: string;
    email: string;
    phone: string;
    role: string;
    region: string;
    city: string;
    nationalAddress: string;
    extraAddress: string;
    taxNumber: string;
    iban: string;
    bio: string;
    imagePreview: string;
    image: string;
    avatar: string;
    avatarUrl: string;
    dbId: number | undefined;
    id: number | undefined;
    pledge: boolean;
  }>(user);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [allowAccountDeletion, setAllowAccountDeletion] = useState(() => localStorage.getItem('ALLOW_ACCOUNT_DELETION') === 'true');
  const [notification, setNotification] = useState<{show: boolean, type: 'success'|'error', message: string}>({show: false, type: 'success', message: ''});

  // Subscription management states
  const [subscription, setSubscription] = useState<any>(null);
  const [availablePackages, setAvailablePackages] = useState<any[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedUpgradePackage, setSelectedUpgradePackage] = useState<any>(null);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('creditMax');

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [transferImage, setTransferImage] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // States for dynamic payment options
  const [stcNumber, setStcNumber] = useState('');
  const [stcOtp, setStcOtp] = useState('');
  const [stcStep, setStcStep] = useState(1);
  const [agreedInstallments, setAgreedInstallments] = useState(false);
  const [enabledPayments, setEnabledPayments] = useState<Record<string, boolean>>({
    mada: true,
    creditMax: true,
    apple: true,
    stc: true,
    google_pay: false,
    tabby: true,
    tamara: true,
    bank_transfer: true,
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      if (stored) {
        const parsed = JSON.parse(stored);
        setEnabledPayments(parsed);
        // Find first enabled method
        const activeKeys = Object.keys(parsed).filter(k => parsed[k]);
        if (activeKeys.length > 0) {
          // Map to correct name
          setPaymentMethod(activeKeys[0]);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [checkoutModalOpen]);

  const showNotification = (type: 'success'|'error', message: string) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification(prev => ({ ...prev, show: false })), 5000);
  };

  React.useEffect(() => {
    const handleStorageChange = () => {
      setAllowAccountDeletion(localStorage.getItem('ALLOW_ACCOUNT_DELETION') === 'true');
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('currentUser');
    let currentUserName = '';
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const userImg = parsed.imagePreview || parsed.image || parsed.avatarUrl || parsed.avatar || 'https://i.pravatar.cc/150?img=11';
        // Spread defaults to handle missing fields in stored data
        const merged = {
          name: 'مستخدم النظام',
          idNumber: '',
          idExpiryDate: '',
          email: '',
          phone: '',
          role: 'عميل',
          region: '',
          city: '',
          nationalAddress: '',
          extraAddress: '',
          taxNumber: '',
          iban: '',
          bio: '',
          pledge: false,
          ...parsed,
          imagePreview: userImg,
          image: userImg,
          avatar: userImg,
          avatarUrl: userImg
        };
        setUser(merged);
        setForm(merged);
        currentUserName = merged.name;
      } catch(e) {
        console.error("Failed to parse user data");
      }
    }

    // Load available packages from utils & cache
    const allSubs = getSubscriptions().filter((p: any) => 
      p.status === 'مفعل' && 
      !p.isHidden && 
      p.id !== 'hidden' && 
      p.name !== 'باقة مخفية ترويجية مخصصة' && 
      !(p.name || '').includes('مخفية')
    );
    setAvailablePackages(allSubs);

    const syncSubscriptionInfo = () => {
      const currentSavedUser = localStorage.getItem('currentUser');
      let nameStr = currentUserName || '';
      let emailStr = '';
      let userPkgStr = '';
      if (currentSavedUser) {
        try {
          const u = JSON.parse(currentSavedUser);
          if (u.name) nameStr = u.name;
          if (u.email) emailStr = u.email.toLowerCase();
          if (u.packageName || u.planName) userPkgStr = u.packageName || u.planName;
        } catch(e) {}
      }

      let provPkgStr = '';
      let provDuration = 'monthly';
      try {
        const savedProv = localStorage.getItem('providersData');
        if (savedProv) {
          const list = JSON.parse(savedProv);
          const match = list.find((p: any) => 
            (nameStr && p.name === nameStr) || 
            (emailStr && p.email && p.email.toLowerCase() === emailStr)
          );
          if (match) {
            provPkgStr = match.packageName || match.packageName_display || '';
            provDuration = match.packageDuration || 'monthly';
          }
        }
      } catch(e) {}

      const activePkgName = provPkgStr || userPkgStr;

      const keysToTry = [
        nameStr ? `provider_subscription_${nameStr}` : null,
        emailStr ? `provider_subscription_${emailStr}` : null,
        'provider_subscription'
      ].filter(Boolean) as string[];

      let storedSubObj: any = null;
      for (const k of keysToTry) {
        const raw = localStorage.getItem(k);
        if (raw) {
          try {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.packageName) {
              storedSubObj = parsed;
              break;
            }
          } catch(e) {}
        }
      }

      const effectivePkgName = (storedSubObj && storedSubObj.packageName) ? storedSubObj.packageName : (activePkgName || 'الباقة الأساسية');

      const allPlans = getSubscriptions();
      const matchedPlan = allPlans.find((sub: any) => sub.name === effectivePkgName) || 
                          allPlans.find((sub: any) => sub.name.includes(effectivePkgName)) || 
                          allPlans[0];

      const fullSub = {
        ...storedSubObj,
        id: matchedPlan ? matchedPlan.id : 'basic',
        packageName: matchedPlan ? matchedPlan.name : effectivePkgName,
        packageName_display: matchedPlan ? matchedPlan.name : effectivePkgName,
        billingCycle: storedSubObj?.billingCycle || provDuration || 'monthly',
        price: storedSubObj?.price || matchedPlan?.priceMonthly || matchedPlan?.price || 99,
        hallsLimit: matchedPlan?.hallsLimit || '1',
        servicesLimit: matchedPlan?.servicesLimit || '5',
        staffSeatsLimit: matchedPlan?.staffSeatsLimit || '0',
        includesInventory: matchedPlan ? matchedPlan.includesInventory : true,
        includesSuppliers: matchedPlan ? matchedPlan.includesSuppliers : true,
        canExportFinancials: matchedPlan ? matchedPlan.canExportFinancials : true,
        hasSupport: matchedPlan ? matchedPlan.hasSupport : true,
        includesAdvancedProviderDashboard: matchedPlan ? matchedPlan.includesAdvancedProviderDashboard : true,
        includesFullManagement: matchedPlan ? matchedPlan.includesFullManagement : true,
        includesAdvancedStats: matchedPlan ? matchedPlan.includesAdvancedStats : true,
        includesGrowthCharts: matchedPlan ? matchedPlan.includesGrowthCharts : true,
        includesFinancialForecast: matchedPlan ? matchedPlan.includesFinancialForecast : true,
        includesPartialPayment: matchedPlan ? matchedPlan.includesPartialPayment : true,
        addons: storedSubObj?.addons || ['inventory', 'suppliers', 'invoice_export', 'support']
      };

      setSubscription(fullSub);
    };

    syncSubscriptionInfo();

    window.addEventListener('subscriptionUpdated', syncSubscriptionInfo);
    window.addEventListener('currentUserUpdated', syncSubscriptionInfo);
    window.addEventListener('providersUpdated', syncSubscriptionInfo);
    window.addEventListener('storage', syncSubscriptionInfo);

    return () => {
      window.removeEventListener('subscriptionUpdated', syncSubscriptionInfo);
      window.removeEventListener('currentUserUpdated', syncSubscriptionInfo);
      window.removeEventListener('providersUpdated', syncSubscriptionInfo);
      window.removeEventListener('storage', syncSubscriptionInfo);
    };
  }, []);

  // Synchronize profile data and image on mount and during events from `/api/users` REST API
  useEffect(() => {
    const fetchFreshProfileFromAPI = async () => {
      try {
        const saved = localStorage.getItem('currentUser');
        if (!saved) return;
        const parsed = JSON.parse(saved);
        const email = (parsed.email || '').toLowerCase();
        if (!email) return;

        const res = await fetch('/api/users');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.verified)) {
            const dbUser = data.verified.find((u: any) => (u.email || '').toLowerCase() === email);
            if (dbUser) {
              const freshImg = dbUser.image || dbUser.avatarUrl || dbUser.avatar;
              setUser(prev => ({
                ...prev,
                name: dbUser.name || prev.name,
                phone: dbUser.phone || prev.phone,
                region: dbUser.region || prev.region,
                city: dbUser.city || prev.city,
                iban: dbUser.iban || prev.iban,
                nationalAddress: dbUser.addressDetails || prev.nationalAddress,
                idNumber: dbUser.commercialRecord || prev.idNumber,
                imagePreview: freshImg || prev.imagePreview,
                image: freshImg || prev.image,
                avatar: freshImg || prev.avatar,
                avatarUrl: freshImg || prev.avatarUrl,
                dbId: dbUser.id,
                id: dbUser.id
              }));
              setForm(prev => ({
                ...prev,
                name: dbUser.name || prev.name,
                phone: dbUser.phone || prev.phone,
                region: dbUser.region || prev.region,
                city: dbUser.city || prev.city,
                iban: dbUser.iban || prev.iban,
                nationalAddress: dbUser.addressDetails || prev.nationalAddress,
                idNumber: dbUser.commercialRecord || prev.idNumber,
                imagePreview: freshImg || prev.imagePreview,
                image: freshImg || prev.image,
                avatar: freshImg || prev.avatar,
                avatarUrl: freshImg || prev.avatarUrl,
                dbId: dbUser.id,
                id: dbUser.id
              }));
            }
          }
        }
      } catch (err) {
        console.warn("Failed to synchronize active database profile info:", err);
      }
    };

    fetchFreshProfileFromAPI();
    window.addEventListener('currentUserUpdated', fetchFreshProfileFromAPI);
    window.addEventListener('usersUpdated', fetchFreshProfileFromAPI);
    return () => {
      window.removeEventListener('currentUserUpdated', fetchFreshProfileFromAPI);
      window.removeEventListener('usersUpdated', fetchFreshProfileFromAPI);
    };
  }, []);

  const handleSave = () => {
    // Validate
    if (!form.name || !form.idNumber || !form.idExpiryDate || !form.email || !form.phone || !form.region || !form.city || !form.nationalAddress || !form.iban) {
      showNotification('error', 'يرجى تعبئة جميع الحقول الإلزامية (الاسم، رقم الهوية/السجل، تاريخ الانتهاء، البريد، الجوال، المنطقة، المدينة، العنوان الوطني، رقم الآيبان).');
      return;
    }

    if (form.idNumber.length !== 10) {
      showNotification('error', 'رقم الهوية أو السجل يجب أن يتكون من 10 أرقام.');
      return;
    }

    const expiry = new Date(form.idExpiryDate);
    const minExpiry = new Date();
    minExpiry.setDate(minExpiry.getDate() + 30);
    if (expiry < minExpiry) {
        showNotification('error', 'تاريخ انتهاء الهوية/السجل يجب أن يكون بعد 30 يوماً من التاريخ الحالي على الأقل.');
        return;
    }

    if (!form.pledge) {
      showNotification('error', 'يرجى التعهد بصحة المعلومات للمتابعة.');
      return;
    }
    setUser(form);
    localStorage.setItem('currentUser', JSON.stringify(form));

    // Save to the active database API PUT /api/users/:id
    const targetId = form.dbId || form.id;
    if (targetId) {
      fetch(`/api/users/${targetId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          region: form.region,
          city: form.city,
          addressDetails: form.nationalAddress,
          iban: form.iban,
          commercialRecord: form.idNumber,
          avatarUrl: form.avatarUrl || form.image || form.imagePreview
        })
      })
      .then(res => res.json())
      .then(data => {
        console.log("Profile updated successfully in active database:", data);
        window.dispatchEvent(new Event('currentUserUpdated'));
        window.dispatchEvent(new Event('usersUpdated'));
      })
      .catch(err => {
        console.error("Error updating profile in database:", err);
      });
    }

    setIsEditing(false);
    showNotification('success', 'تم حفظ التعديلات بنجاح وتم مزامنتها مع قاعدة البيانات.');
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show instant compression or local preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm(prev => ({ ...prev, imagePreview: reader.result as string }));
      };
      reader.readAsDataURL(file);

      // Upload file directly to our physical server under public/AvatarCustomers
      const formData = new FormData();
      formData.append('image', file);

      try {
        const response = await fetch('/api/upload?type=avatar', {
          method: 'POST',
          body: formData,
        });
        const data = await response.json();
        if (data.success && data.url) {
          // Upload succeeded and we got the real physical URL from the server!
          setForm(prev => ({
            ...prev,
            imagePreview: data.url,
            image: data.url,
            avatar: data.url,
            avatarUrl: data.url
          }));
          
          setUser(prev => ({
            ...prev,
            imagePreview: data.url,
            image: data.url,
            avatar: data.url,
            avatarUrl: data.url
          }));

          // Sync into current logged in user (currentUser) session
          const savedStr = localStorage.getItem('currentUser');
          if (savedStr) {
            try {
              const parsed = JSON.parse(savedStr);
              const updatedUserObj = {
                ...parsed,
                imagePreview: data.url,
                image: data.url,
                avatar: data.url,
                avatarUrl: data.url
              };
              localStorage.setItem('currentUser', JSON.stringify(updatedUserObj));
              
              // Persist to user REST api so it is saved in SQLite database
              if (parsed.dbId || parsed.id) {
                const targetId = parsed.dbId || parsed.id;
                await fetch(`/api/users/${targetId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ 
                    imagePreview: data.url,
                    image: data.url,
                    avatar: data.url,
                    avatarUrl: data.url
                  })
                });
              }
            } catch(e) {
              console.error("Error synchronizing profile image upload:", e);
            }
          }

          // Trigger update events instantly to keep headers/user lists completely in sync!
          window.dispatchEvent(new Event('storage'));
          window.dispatchEvent(new Event('currentUserUpdated'));
          window.dispatchEvent(new Event('usersUpdated'));

          showNotification('success', 'تم رفع الصورة الشخصية بنجاح وحفظها في مجلد /AvatarCustomers بالخادم.');
        } else {
          showNotification('error', data.error || 'فشل رفع الصورة إلى الخادم.');
        }
      } catch (err: any) {
        console.error("Upload error:", err);
        showNotification('error', 'حدث خطأ غير متوقع أثناء الاتصال بالخادم لرفع الصورة.');
      }
    }
  };

  const handleDeleteRequest = () => {
    setIsDeleteModalOpen(false);
    showNotification('success', 'تم إرسال طلب حذف الحساب للإدارة للموافقة. يرجى العلم بأنه عند الموافقة سيتم إنهاء تفعيل الحساب ولا يتم استرجاع مبالغ الاشتراك.');
    // In a real app we'd call an API here.
  };

  const handleUpgradePayment = () => {
    if (paymentMethod === 'bank_transfer' && !transferImage) {
      showNotification('error', 'يرجى إرفاق إيصال التحويل البنكي للمتابعة.');
      return;
    }
    if (paymentMethod === 'creditMax' || paymentMethod === 'mada') {
      if (!cardNumber || !cardHolder || !cardExpiry || !cardCvv) {
        showNotification('error', 'يرجى إدخال كامل بيانات الدفع الآمن للبطاقة.');
        return;
      }
    }
    if (paymentMethod === 'stc') {
      if (stcStep === 1) {
        if (!stcNumber) {
          showNotification('error', 'يرجى إدخال رقم الجوال المسجل في STC Pay الخاص بك.');
          return;
        }
        setIsProcessingPayment(true);
        setTimeout(() => {
          setIsProcessingPayment(false);
          setStcStep(2);
          showNotification('success', 'تم إرسال الرمز التعريفي OTP إلى هاتف STC Pay بنجاح.');
        }, 1200);
        return;
      } else {
        if (!stcOtp) {
          showNotification('error', 'يرجى إدخال رمز التحقق المؤلف من 4 أرقام.');
          return;
        }
      }
    }
    if ((paymentMethod === 'tabby' || paymentMethod === 'tamara') && !agreedInstallments) {
      showNotification('error', 'يرجى الموافقة أولاً على شروط تسييل وخصم الأقساط.');
      return;
    }

    if (paymentMethod === 'bank_transfer') {
      setIsProcessingPayment(true);
      setTimeout(() => {
        setIsProcessingPayment(false);
        setPaymentSuccess(true);
        
        // Add pending mail message
        const storedMails = localStorage.getItem('PLATFORM_MAIL_MESSAGES');
        let mails = [];
        if (storedMails) {
          try { mails = JSON.parse(storedMails); } catch(e) {}
        }

        const currentProviderName = user.name || 'شريك مسجل';
        const mailId = 'mail_sub_req_' + Date.now();
        const price = billingCycle === 'monthly' ? selectedUpgradePackage.priceMonthly : selectedUpgradePackage.priceYearly;
        
        const newMail = {
          id: mailId,
          sender: currentProviderName,
          recipient: 'الإدارة',
          subject: `🚨 طلب موافقة وتفعيل باقة اشتراك: ${selectedUpgradePackage.name} (${billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'})`,
          body: `السلام عليكم ورحمة الله وبركاته،\n\nيود شريك منصة "ليلة" - الحاصل على حساب باسم "${currentProviderName}" - رفع إفادة تحويل بنكي لتبويب الترقية إلى الباقة الجديدة: "${selectedUpgradePackage.name}".\n\nتفاصيل الطلب:\n- اسم الشريك: ${currentProviderName}\n- الباقة المطلوبة: ${selectedUpgradePackage.name}\n- الدورة المالية للاشتراك: ${billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}\n- قيمة التحويل: ${price} ر.س\n\nمرفق أسفله إيصال التحويل البنكي المعتمد للتدقيق والموافقة التلقائية لفتح الصلاحيات.\n\nوتقبلوا وافر الشكر والتقدير.\nمقدم الطلب: ${currentProviderName}`,
          createdAt: new Date().toISOString(),
          attachments: [
            { name: 'إيصال_تحويل_شريك.png', size: '1.4 MB', type: 'png', isBankReceipt: true, receiptPreview: transferImage || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60' }
          ],
          isReadByAdmin: false,
          isReadByProvider: true,
          deletedByAdmin: false,
          deletedByProvider: false,
          isSubscriptionApprovalRequest: true,
          approvalStatus: 'pending',
          upgradeDetails: {
            planId: selectedUpgradePackage.id,
            packageName: selectedUpgradePackage.name,
            billingCycle: billingCycle,
            price: price,
            rawPrice: price / 1.15,
            vatPrice: price - (price / 1.15),
            currentProviderName: currentProviderName,
            providerId: (user as any).id || ''
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
          console.log("Successfully synced upgrade request mail to database:", data);
        }).catch(err => {
          console.error("Failed to sync upgrade request mail to database:", err);
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
          body: `قدم الشريك "${currentProviderName}" طلب ترقية باقة إلى "${selectedUpgradePackage.name}". يرجى تلمس إيصال التحويل المرفق بالبريد للموافقة أو الرفض.`,
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
        
        showNotification('success', 'تم إرسال طلب الاشتراك مع إيصال التحويل للإدارة بنجاح. سنعلمك مباشرة فور التدقيق والموافقة.');
      }, 2000);
      return;
    }

    setIsProcessingPayment(true);
    setTimeout(() => {
      setIsProcessingPayment(false);
      setPaymentSuccess(true);

      const upgradedSub = {
        id: selectedUpgradePackage.id,
        packageName: selectedUpgradePackage.name,
        packageName_display: selectedUpgradePackage.name,
        billingCycle: billingCycle,
        price: billingCycle === 'monthly' ? selectedUpgradePackage.priceMonthly : selectedUpgradePackage.priceYearly,
        hallsLimit: selectedUpgradePackage.hallsLimit,
        servicesLimit: selectedUpgradePackage.servicesLimit,
        staffSeatsLimit: selectedUpgradePackage.staffSeatsLimit || '0',
        includesInventory: !!selectedUpgradePackage.includesInventory,
        includesSuppliers: !!selectedUpgradePackage.includesSuppliers,
        canExportFinancials: !!selectedUpgradePackage.canExportFinancials,
        hasSupport: !!selectedUpgradePackage.hasSupport,
        includesAdvancedProviderDashboard: !!selectedUpgradePackage.includesAdvancedProviderDashboard,
        includesFullManagement: !!selectedUpgradePackage.includesFullManagement,
        includesAdvancedStats: !!selectedUpgradePackage.includesAdvancedStats,
        includesGrowthCharts: !!selectedUpgradePackage.includesGrowthCharts,
        includesFinancialForecast: !!selectedUpgradePackage.includesFinancialForecast,
        includesPartialPayment: !!selectedUpgradePackage.includesPartialPayment,
        addons: selectedUpgradePackage.id === 'pro'
          ? ['inventory', 'suppliers', 'invoice_export', 'support', 'dynamic_pricing']
          : selectedUpgradePackage.id === 'business'
          ? ['inventory', 'suppliers', 'invoice_export', 'support']
          : [],
        startDate: new Date().toISOString()
      };

      const subKey = user.name ? `provider_subscription_${user.name}` : 'provider_subscription';
      localStorage.setItem(subKey, JSON.stringify(upgradedSub));
      localStorage.setItem('provider_subscription', JSON.stringify(upgradedSub));
      setSubscription(upgradedSub);

      // Sync to providersData as well immediately
      try {
        const savedProviders = localStorage.getItem('providersData');
        if (savedProviders && user.name) {
          const list = JSON.parse(savedProviders);
          const item = list.find((p: any) => p.name === user.name);
          if (item) {
            item.packageName = selectedUpgradePackage.name;
            item.packageDuration = billingCycle;
            safeSetLocalStorage('providersData', list);
          }
        }
      } catch (e) {}

      // Sync upgraded subscription to DB via endpoint
      if (user && (user as any).id) {
        fetch('/api/subscriptions/upgrade', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            providerIds: [Number((user as any).id)],
            planName: selectedUpgradePackage.name,
            pricePaid: billingCycle === 'monthly' ? selectedUpgradePackage.priceMonthly : selectedUpgradePackage.priceYearly,
            durationMonths: billingCycle === 'monthly' ? 1 : 12,
            notes: `ترقية ذاتية للمزود من الملف الشخصي`
          })
        }).catch(e => console.warn('DB subscription upgrade failed:', e));
      }

      // Dispatch trigger to update system subscription state reactively
      window.dispatchEvent(new Event('subscriptionUpdated'));

      // Trigger a visual notification
      showNotification('success', `تم ترقية اشتراكك بنجاح إلى "${selectedUpgradePackage.name}" (${billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}).`);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-5xl mx-auto px-4 md:px-6 w-full py-12">
        <div className="flex justify-between items-end border-b pb-6 mb-8 mt-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-800">الملف الشخصي</h1>
            <p className="text-slate-500 mt-2">إدارة بيانات حسابك الشخصية وإعدادات الأمان</p>
          </div>
          {!isEditing && (
            <button 
              onClick={() => { setForm(user); setIsEditing(true); }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-colors flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" /> تعديل البيانات
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Right Column (Avatar & Active Sub) */}
          <div className="lg:col-span-1 space-y-6">
            {/* Avatar Area */}
            <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col items-center text-center w-full">
              <div className={`relative w-40 h-40 rounded-full border-4 border-slate-50 shadow-md overflow-hidden mb-4 ${isEditing && 'group cursor-pointer'}`}>
                <img 
                  src={isEditing ? (form.imagePreview || form.image || form.avatarUrl || form.avatar) : (user.imagePreview || user.image || user.avatarUrl || user.avatar)} 
                  alt="User Avatar" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    (e.target as HTMLElement).setAttribute('src', 'https://i.pravatar.cc/150?img=11');
                  }}
                />
                {isEditing && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-8 h-8 text-white" />
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                  </div>
                )}
              </div>
              
              <h2 className="text-xl font-bold text-slate-800">
                {isEditing ? form.name || 'الاسم...' : user.name}
              </h2>
              <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium text-sm">
                  <ShieldAlert className="w-4 h-4" />
                  {isEditing ? form.role : user.role}
              </div>
            </div>

            {/* Active Subscription Details Card on the Right Column */}
            {(user.role === 'provider' || user.role === 'Provider' || user.role === 'مزود' || user.role === 'Marketer' || user.role === 'agency') && subscription && (
              <div id="subscription-management-sidebar-card" className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 space-y-6 text-right">
                {(() => {
                  const pendingRequestStr = localStorage.getItem(`pending_sub_request_${user.name}`);
                  const pendingRequest = pendingRequestStr ? JSON.parse(pendingRequestStr) : null;
                  if (pendingRequest) {
                    return (
                      <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 space-y-2 animate-in fade-in duration-300">
                        <div className="flex items-center gap-1.5 font-bold">
                          <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                          <span>طلب ترقية معلق قيد المراجعة</span>
                        </div>
                        <p className="leading-relaxed">
                          لقد قدمت طلب ترقية إلى الباقة <strong className="text-amber-950">"{pendingRequest.packageName}"</strong> ({pendingRequest.billingCycle === 'monthly' ? 'شهرياً' : 'سنوياً'}) عبر تحويل بنكي بقيمة <strong>{pendingRequest.price} ر.س</strong>.
                        </p>
                        <div className="border-t border-amber-100 pt-2 text-[10px] text-slate-500 font-semibold leading-relaxed">
                          الحالة: بانتظار الموافقة والتدقيق المالي من الإدارة. سيتم إخطارك فور التفعيل.
                        </div>
                      </div>
                    );
                  }
                  return null;
                })()}

                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="text-base font-bold text-slate-850 flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" /> باقة الاشتراك النشطة
                  </h3>
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> نشط
                  </span>
                </div>

                {/* Sub info */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 relative overflow-hidden space-y-4">
                  <div className="absolute top-0 left-0 bg-blue-600 text-white text-[9px] px-2.5 py-0.5 rounded-br-2xl font-bold">
                    {subscription.billingCycle === 'yearly' ? 'فوترة سنوية' : 'فوترة شهرية'}
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-medium">الباقة الحالية</p>
                    <h4 className="text-lg font-black text-slate-800 mt-1 flex items-center gap-1.5 justify-start">
                      {subscription.packageName || 'الباقة المتقدمة'}
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                    </h4>
                    <div className="flex items-baseline gap-1 mt-1.5">
                      <span className="text-lg font-bold text-slate-700">{subscription.price || 0}</span>
                      <span className="text-[10px] text-slate-400">ر.س / {subscription.billingCycle === 'yearly' ? 'سنة' : 'شهر'}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />
                      تاريخ التفعيل: {subscription.startDate ? new Date(subscription.startDate).toLocaleDateString('ar-SA') : 'تاريخ التسجيل'}
                    </p>
                  </div>

                  {/* Limits table */}
                  <div className="space-y-2 bg-white p-3 rounded-xl border border-slate-100 text-[11px]">
                    <h5 className="text-[10px] font-bold text-slate-500 border-b pb-1 mb-1.5">حدود وموارد الباقة</h5>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">صالات العرض المتاحة:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {subscription.hallsLimit === 'unlimited' || !subscription.hallsLimit ? 'بلا حدود' : `${subscription.hallsLimit} قاعات`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">الخدمات المتاحة:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {subscription.servicesLimit === 'unlimited' || !subscription.servicesLimit ? 'بلا حدود' : `${subscription.servicesLimit} خدمات`}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 font-medium">حسابات الموظفين:</span>
                      <span className="font-bold text-slate-800 font-mono">
                        {subscription.staffSeatsLimit === 'unlimited' || !subscription.staffSeatsLimit || subscription.staffSeatsLimit === '' ? 'بلا حدود' : `${subscription.staffSeatsLimit} مقاعد`}
                      </span>
                    </div>
                  </div>

                  {/* Active features */}
                  <div className="border-t border-slate-205/60 pt-3">
                    <p className="text-[11px] font-bold text-slate-400 mb-2">المميزات المفعلة في الباقة:</p>
                    <div className="space-y-2 text-[11px]">
                      {subscription.includesAdvancedProviderDashboard ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>لوحة مزود الخدمة المتقدمة (مفعلة)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-red-100 shrink-0" />
                          <span>لوحة مزود الخدمة المتقدمة (غير مفعلة)</span>
                        </div>
                      )}
                      {subscription.includesFullManagement ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>إدارة الحجوزات والخدمات الشاملة (مفعلة)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-red-100 shrink-0" />
                          <span>إدارة الحجوزات والخدمات الشاملة (غير مفعلة)</span>
                        </div>
                      )}
                      {subscription.includesInventory ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>نظام مبيعات وإدارة مستودعات (مفعل)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-red-100 shrink-0" />
                          <span>نظام مبيعات وإدارة مستودعات (غير مفعل)</span>
                        </div>
                      )}
                      {subscription.includesSuppliers ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>نظام علاقات وسجلات الموردين (مفعل)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-red-100 shrink-0" />
                          <span>نظام علاقات وسجلات الموردين (غير مفعل)</span>
                        </div>
                      )}
                      {subscription.canExportFinancials ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>تصدير الفواتير والتقرير المالي (مفعل)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-red-100 shrink-0" />
                          <span>تصدير الفواتير والتقرير المالي (غير متاح)</span>
                        </div>
                      )}
                      {subscription.hasSupport ? (
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>دعم فني مباشر VIP ومحادثة ومتابعة</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <X className="w-3.5 h-3.5 text-red-100 shrink-0" />
                          <span>دعم فني مباشر VIP (غير متاح)</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Details Form Area */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
                <User className="w-5 h-5 text-amber-500" /> المعلومات الأساسية
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">الاسم الكامل <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={isEditing ? (form.name || '') : (user.name || '')} 
                    onChange={e => setForm({...form, name: e.target.value})}
                    disabled={true}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none bg-slate-100 transition-all font-medium cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">لا يمكن تغيير الاسم يدوياً. يرجى التواصل مع الإدارة للتعديل.</p>
                </div>
                
                <div className="md:col-span-1">
                  <NationalIdInput 
                    value={isEditing ? form.idNumber : user.idNumber} 
                    onChange={e => setForm({...form, idNumber: e.target.value})} 
                    label="رقم الهوية / السجل التجاري"
                    required 
                    disabled={!isEditing}
                  />
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">تاريخ انتهاء الهوية/السجل <span className="text-red-500">*</span></label>
                  <input 
                    type="date"
                    value={isEditing ? form.idExpiryDate : user.idExpiryDate}
                    onChange={e => setForm({...form, idExpiryDate: e.target.value})}
                    disabled={!isEditing}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input 
                      type="email" 
                      dir="ltr"
                      value={isEditing ? (form.email || '') : (user.email || '')} 
                      onChange={e => setForm({...form, email: e.target.value})}
                      disabled={!isEditing}
                      className="w-full pl-3 pr-10 py-3 text-left rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all"
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <PhoneInput 
                    value={isEditing ? (form.phone || '') : (user.phone || '')} 
                    onChange={e => setForm({...form, phone: e.target.value})}
                    disabled={!isEditing}
                    required
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">المنطقة <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <select
                      value={isEditing ? (form.region || '') : (user.region || '')}
                      onChange={e => setForm({...form, region: e.target.value})}
                      disabled={!isEditing}
                      className="w-full p-3 pr-10 appearance-none rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all bg-white"
                    >
                      <option value="">اختر المنطقة</option>
                      {saudiRegions.map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">المدينة <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={isEditing ? (form.city || '') : (user.city || '')} 
                    onChange={e => setForm({...form, city: e.target.value})}
                    disabled={!isEditing}
                    placeholder="مثال: الرياض"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">العنوان الوطني <span className="text-red-500">*</span></label>
                  <div className="relative">
                     <input 
                       type="text" 
                       value={isEditing ? (form.nationalAddress || '') : (user.nationalAddress || '')} 
                       onChange={e => setForm({...form, nationalAddress: e.target.value})}
                       disabled={!isEditing}
                       placeholder="مثال: 1234 الحي، الرمز البريدي"
                       className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all font-mono"
                     />
                     {isEditing && (
                       <button
                         type="button"
                         onClick={() => setIsMapOpen(true)}
                         className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-amber-600 bg-amber-50 rounded-lg hover:bg-amber-100 transition-colors"
                         title="تحديد على الخريطة"
                       >
                         <Map className="w-5 h-5" />
                       </button>
                     )}
                     {!isEditing && (
                       <Map className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                     )}
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-medium text-slate-700 mb-2">تفاصيل عنوان إضافية</label>
                  <input 
                    type="text" 
                    value={isEditing ? (form.extraAddress || '') : (user.extraAddress || '')} 
                    onChange={e => setForm({...form, extraAddress: e.target.value})}
                    disabled={!isEditing}
                    placeholder="الشارع، المنزل، المعلم الأقرب"
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all"
                  />
                </div>

                {user.role === 'مزود' && (
                  <div className="md:col-span-2">
                    <TaxNumberInput 
                      value={isEditing ? (form.taxNumber || '') : (user.taxNumber || '')}
                      onChange={e => setForm({...form, taxNumber: e.target.value})}
                      disabled={!isEditing}
                    />
                  </div>
                )}

                <div className="md:col-span-2">
                   {isEditing ? (
                     <IbanInput 
                       value={form.iban || ''} 
                       onChange={val => setForm({...form, iban: val})} 
                     />
                   ) : (
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-2">رقم الآيبان (IBAN) <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         value={user.iban || ''} 
                         disabled 
                         dir="ltr"
                         className="w-full p-3 rounded-xl border border-slate-200 outline-none disabled:bg-slate-50 disabled:text-slate-500 text-left font-mono"
                       />
                     </div>
                   )}
                </div>

                <div className="md:col-span-2">
                  <label className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-slate-100 transition-colors">
                    <input 
                      type="checkbox" 
                      checked={!!(isEditing ? form.pledge : user.pledge)}
                      onChange={e => setForm({...form, pledge: e.target.checked})}
                      disabled={!isEditing}
                      className="w-5 h-5 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-sm font-medium text-slate-700">أتعهد بصحة جميع المعلومات المدخلة في الملف الشخصي وأتحمل المسؤولية القانونية حيال ذلك. <span className="text-red-500">*</span></span>
                  </label>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">نبذة</label>
                  <div className="relative">
                    <Briefcase className="absolute right-3 top-4 w-5 h-5 text-slate-400" />
                    <textarea 
                      value={isEditing ? (form.bio || '') : (user.bio || '')} 
                      onChange={e => setForm({...form, bio: e.target.value})}
                      disabled={!isEditing}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none disabled:bg-slate-50 transition-all h-24 resize-none"
                    />
                  </div>
                </div>
              </div>
              
              {isEditing && (
                <div className="mt-8 flex gap-3">
                  <button 
                    onClick={handleSave}
                    disabled={
                      !form.email || 
                      !form.phone || 
                      !form.region || 
                      !form.city || 
                      !form.nationalAddress || 
                      !form.pledge
                    }
                    className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none disabled:cursor-not-allowed text-slate-900 rounded-xl font-bold transition-colors flex items-center gap-2 shadow-lg shadow-amber-500/20"
                  >
                    <Save className="w-5 h-5" /> حفظ التعديلات
                  </button>
                  <button 
                    onClick={() => { setForm(user); setIsEditing(false); }}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-colors"
                  >
                    إلغاء
                  </button>
                </div>
              )}
            </div>

            {/* PLATFORM SUBSCRIPTION SECTION FOR PROVIDERS */}
            {(user.role === 'provider' || user.role === 'Provider' || user.role === 'مزود' || user.role === 'Marketer' || user.role === 'agency') && subscription && (
              <div id="subscription-management-card" className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 space-y-8">
                {/* Upgrade Packages Zone */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                    <div>
                      <h4 className="text-lg font-black text-slate-800">ترقية الباقة لفتح ميزات متكاملة</h4>
                      <p className="text-xs text-slate-400 mt-1">اختر الباقة المناسبة لحجم أعمالك لمضاعفة جودة إدارتك وتجربتك</p>
                    </div>

                    {/* Billing Cycle Switcher */}
                    <div className="inline-flex bg-slate-150 p-1 rounded-xl w-fit border border-slate-200 self-end">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('monthly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          billingCycle === 'monthly'
                            ? 'bg-amber-500 text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        شهرياً
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('yearly')}
                        className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          billingCycle === 'yearly'
                            ? 'bg-amber-500 text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-amber-600'
                        }`}
                      >
                        سنوياً
                        <span className="bg-red-500 text-[9px] text-white px-1.5 py-0.5 rounded-full font-black animate-pulse">
                          وفر 15%
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Standard Available Packages Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {availablePackages.map((pkg) => {
                      const isCurrent = subscription.id === pkg.id;
                      const price = billingCycle === 'monthly' ? pkg.priceMonthly : pkg.priceYearly;
                      const featuresList = (pkg.features || '').split('\n').filter(Boolean);

                      return (
                        <div
                          key={pkg.id}
                          className={`bg-white rounded-2xl p-5 border transition-all relative flex flex-col justify-between ${
                            isCurrent
                              ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-emerald-50/10'
                              : pkg.isPopular
                              ? 'border-blue-300 shadow-md ring-2 ring-blue-500/5'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          {pkg.isPopular && (
                            <div className="absolute -top-3 right-4 bg-blue-600 text-white text-[9px] px-2.5 py-1 rounded-full font-bold">
                              الأكثر مبيعاً 🔥
                            </div>
                          )}
                          {isCurrent && (
                            <div className="absolute -top-3 right-4 bg-emerald-500 text-white text-[9px] px-2.5 py-1 rounded-full font-bold">
                              باقـتك الحالية ⭐
                            </div>
                          )}

                          <div className="space-y-4">
                            <div>
                              <h5 className="font-extrabold text-slate-800 flex items-center gap-1 text-base">
                                {pkg.name}
                              </h5>
                              <div className="flex items-baseline gap-1 mt-1.5">
                                <span className="text-2xl font-black text-slate-800">{price}</span>
                                <span className="text-[10px] text-slate-400">ر.س / {billingCycle === 'yearly' ? 'سنة' : 'شهر'}</span>
                              </div>
                            </div>

                            <ul className="space-y-2 text-xs border-t border-slate-100 pt-3 flex-grow">
                              {featuresList.map((feat: string, i: number) => (
                                <li key={i} className="flex items-start gap-1.5 text-slate-600">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                                  <span>{feat}</span>
                                </li>
                              ))}
                              {pkg.hallsLimit && (
                                <li className="flex items-center gap-1.5 text-slate-600">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>عدد القاعات: {pkg.hallsLimit}</span>
                                </li>
                              )}
                              {pkg.servicesLimit && (
                                <li className="flex items-center gap-1.5 text-slate-600 font-semibold text-slate-700">
                                  <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                  <span>عدد الخدمات: {pkg.servicesLimit}</span>
                                </li>
                              )}
                            </ul>
                          </div>

                          <div className="mt-5">
                            {isCurrent ? (
                              <button
                                disabled
                                className="w-full py-2 bg-emerald-50/60 text-emerald-700 border border-emerald-200 text-xs rounded-xl font-bold cursor-not-allowed flex items-center justify-center gap-1"
                              >
                                باقتك المفعّلة حالياً
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setSelectedUpgradePackage(pkg);
                                  setPaymentMethod('creditCard');
                                  setCardNumber('');
                                  setCardHolder('');
                                  setCardExpiry('');
                                  setCardCvv('');
                                  setTransferImage(null);
                                  setPaymentSuccess(false);
                                  setIsProcessingPayment(false);
                                  setCheckoutModalOpen(true);
                                }}
                                className={`w-full py-2.5 text-xs rounded-xl font-bold transition-all flex items-center justify-center gap-1 ${
                                  pkg.isPopular
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/10'
                                    : 'bg-slate-800 hover:bg-slate-900 text-white'
                                }`}
                              >
                                <ArrowUpRight className="w-4 h-4" /> ترقية واشتراك فوري
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Danger Zone */}
            {allowAccountDeletion && (
              <div className="bg-red-50 rounded-3xl p-8 border border-red-100">
                <h3 className="text-lg font-bold text-red-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" /> منطقة الخطر
                </h3>
                <p className="text-red-600/80 mb-6 text-sm">
                  طلب حذف الحساب سيخضع للمراجعة من قبل الإدارة. يرجى العلم بأنه لا يمكن التراجع عن عملية الحذف عند الموافقة عليها، وأنه لا يتم استرجاع أي مبالغ اشتراك مدفوعة مسبقاً.
                </p>
                <button 
                  onClick={() => setIsDeleteModalOpen(true)}
                  className="px-6 py-2.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl font-bold transition-colors flex items-center gap-2"
                >
                  <Trash2 className="w-5 h-5" /> طلب حذف الحساب
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />

      {/* Delete Account Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative">
            <div className="p-6 border-b border-slate-100 bg-red-50 text-red-700 flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" /> تأكيد طلب حذف الحساب
              </h3>
              <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <p className="text-slate-600 leading-relaxed mb-6">
                هل أنت متأكد من رغبتك في إرسال طلب لحذف حسابك نهائياً؟ 
                <br/><br/>
                <span className="font-bold text-red-600">تنبيه هام:</span> يحتاج هذا الطلب لموافقة الإدارة. وعند الموافقة، سيتم حذف بياناتك ولا يتم استرجاع مبالغ الاشتراك المدفوعة.
              </p>
              <div className="flex gap-3 justify-end mt-4">
                <button 
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  تراجع
                </button>
                <button 
                  onClick={handleDeleteRequest}
                  className="px-6 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition-colors"
                >
                  نعم، أرسل الطلب
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Google Maps Modal */}
      <GoogleMapsModal
        isOpen={isMapOpen}
        onClose={() => setIsMapOpen(false)}
        initialAddress={form.nationalAddress}
        onConfirm={(address, location, extra) => {
          setForm(prev => ({ 
            ...prev, 
            nationalAddress: address,
            ...(extra && extra.region && extra.city ? { region: extra.region, city: extra.city } : {})
          }));
          setIsMapOpen(false);
        }}
      />

      {/* CHECKOUT UPGRADE MODAL */}
      {checkoutModalOpen && selectedUpgradePackage && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl relative my-8 overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-150 bg-gradient-to-r from-amber-50 to-orange-50 flex justify-between items-center">
              <div>
                <span className="text-amber-600 font-extrabold text-[10px] tracking-wider uppercase flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 animate-bounce" /> ترقية آمنة فورية
                </span>
                <h3 className="text-lg font-black text-slate-850 mt-1">
                  ترقية الاشتراك إلى {selectedUpgradePackage.name}
                </h3>
              </div>
              <button 
                onClick={() => setCheckoutModalOpen(false)} 
                disabled={isProcessingPayment}
                className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 p-2 rounded-full transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {paymentSuccess ? (
              /* Success screen */
              <div className="p-8 text-center flex flex-col items-center justify-center space-y-6 py-12 text-slate-850">
                <div className="w-20 h-20 bg-emerald-50 rounded-full border border-emerald-100 flex items-center justify-center text-emerald-500 shadow-xl shadow-emerald-500/10 animate-bounce">
                  <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-2xl font-black text-slate-800">تمت ترقية الباقة وتفعيل الميزات بنجاح!</h4>
                  <p className="text-slate-500 text-xs max-w-md mx-auto leading-relaxed">
                    لقد تمت معالجة عملية الترقية والدفع الآمن بنجاح إلى <strong className="text-amber-600">"{selectedUpgradePackage.name}"</strong>. ميزاتك وصلاحياتك الموسعة متاحة لك الآن.
                  </p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 w-full max-w-md text-right space-y-4">
                  <div className="flex justify-between items-center text-xs border-b pb-2">
                    <span className="text-slate-400 font-medium">الباقة الجديدة</span>
                    <span className="font-extrabold text-slate-800">{selectedUpgradePackage.name}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs border-b pb-2">
                    <span className="text-slate-400 font-medium">طريقة الدفع</span>
                    <span className="font-bold text-slate-800">
                      {paymentMethod === 'creditMax' ? 'بطاقة ائتمانية (مدفوعة)' : 
                       paymentMethod === 'mada' ? 'بطاقة مدى (مدفوعة)' : 
                       paymentMethod === 'apple' ? 'Apple Pay (مدفوع فوراً)' : 
                       paymentMethod === 'stc' ? 'STC Pay (مدفوع فوراً)' : 
                       paymentMethod === 'google_pay' ? 'Google Pay (مدفوع فوراً)' : 
                       paymentMethod === 'tabby' ? 'تقسيط تابي' : 
                       paymentMethod === 'tamara' ? 'تقسيط تمارا' : 
                       paymentMethod === 'bank_transfer' ? 'تحويل بنكي (قيد المراجعة الفورية)' : 'أخرى'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400 font-medium">معدل الفوترة الأوتوماتيكي</span>
                    <span className="font-bold text-slate-800">{billingCycle === 'yearly' ? 'سنوي' : 'شهري'}</span>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center w-full max-w-md pt-4">
                  <button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                      // Force reload SPA state to unlock navigation links & new dashboards immediately
                      window.location.reload();
                    }}
                    className="flex-grow px-6 py-3 bg-slate-900 hover:bg-slate-850 text-white font-bold text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-4 h-4" /> دخول لوحة التحكم المتقدمة الآن
                  </button>
                  <button
                    onClick={() => {
                      setCheckoutModalOpen(false);
                    }}
                    className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-sm rounded-xl transition-all cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            ) : (
              /* Checkout form screen */
              <div className="p-6 space-y-6 text-slate-850">
                
                {/* Invoice summary */}
                <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-right grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-slate-400">باقة الترقية المختارة</p>
                    <h4 className="font-extrabold text-slate-800 text-base mt-0.5">{selectedUpgradePackage.name}</h4>
                    <p className="text-[10px] text-slate-440 mt-1">الدورة: {billingCycle === 'yearly' ? 'سنوية - خصم متضمن' : 'شهرية'}</p>
                  </div>
                  <div className="md:border-r border-slate-200 md:pr-4 space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">السعر الأساسي:</span>
                      <span className="font-bold text-slate-700">
                        {billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">المبلغ الأساسي للترقية (قبل الضريبة):</span>
                      <span className="font-bold text-slate-700">
                        {(((billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly)) / 1.15).toFixed(2)} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">ضريبة القيمة المضافة (15% VAT):</span>
                      <span className="font-bold text-slate-700">
                        {((billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly) - ((billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly) / 1.15)).toFixed(2)} ر.س
                      </span>
                    </div>
                    <div className="flex justify-between border-t pt-1.5 font-bold text-slate-900 text-sm">
                      <span>الإجمالي الكلي المطلوب (شامل الضريبة):</span>
                      <span className="text-amber-600 font-mono">
                        {(billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly).toFixed(2)} ر.س
                      </span>
                    </div>
                  </div>
                </div>

                {/* Secure checkout info */}
                <div className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-800 border border-emerald-100 rounded-xl text-[11px] font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>بوابة دفع آمنة مشفرة متوافقة مع معايير PCI-DSS.</span>
                </div>

                {/* Payment Methods */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-3">اختر طريقة دفع آمنة</label>
                  <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 gap-2">
                    {[
                      { key: 'creditMax', label: 'بطاقة ائتمانية', icon: <CreditCard className="w-4 h-4 text-amber-500" /> },
                      { key: 'mada', label: 'بطاقة مدى', icon: <span className="w-5 h-4 flex items-center justify-center font-black bg-blue-600 text-white rounded-[4px] text-[7px] tracking-tight shrink-0">mada</span> },
                      { key: 'apple', label: 'Apple Pay', icon: <span className="text-black font-extrabold text-xs font-sans tracking-tight shrink-0"> Pay</span> },
                      { key: 'stc', label: 'STC Pay', icon: <span className="text-purple-650 font-black text-[9px] font-sans shrink-0">stc pay</span> },
                      { key: 'google_pay', label: 'Google Pay', icon: <span className="text-slate-800 font-extrabold text-[9px] font-sans shrink-0">G Pay</span> },
                      { key: 'tabby', label: 'تابي (Tabby)', icon: <span className="text-emerald-500 font-black text-[9px] font-sans shrink-0 inline-block px-1 border border-emerald-300 rounded bg-emerald-50">tabby</span> },
                      { key: 'tamara', label: 'تمارا (Tamara)', icon: <span className="text-amber-500 font-black text-[9px] font-sans shrink-0 inline-block px-1 border border-amber-300 rounded bg-amber-50">tamara</span> },
                      { key: 'bank_transfer', label: 'تحويل بنكي', icon: <Briefcase className="w-4 h-4 text-purple-500" /> },
                    ].filter(opt => enabledPayments[opt.key]).map((opt) => (
                      <button
                        key={opt.key}
                        type="button"
                        onClick={() => {
                          setPaymentMethod(opt.key);
                          if (opt.key === 'stc') {
                            setStcStep(1);
                          }
                        }}
                        className={`p-2.5 rounded-xl border font-bold text-[11px] flex flex-col items-center gap-1.5 justify-center transition-all cursor-pointer ${
                          paymentMethod === opt.key
                            ? 'border-amber-500 bg-amber-50/20 text-slate-900 shadow-sm'
                            : 'border-slate-200 text-slate-500 hover:border-slate-350 bg-white'
                        }`}
                      >
                        {opt.icon}
                        <span className="truncate max-w-full text-[10px]">{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Payment Fields conditional based on selection */}
                {paymentMethod === 'bank_transfer' && (
                  /* Bank transfer details */
                  <div className="bg-purple-50/30 border border-purple-150 p-5 rounded-2xl text-right text-xs space-y-4">
                    <p className="font-extrabold text-purple-900">الرجاء التحويل إلى حساب الشركة المعتمد وتحميل إيصال التحويل:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <span className="text-slate-400">البنك المستلم:</span>
                        <p className="font-bold text-slate-700 mt-0.5">البنك الأهلي السعودي (SNB)</p>
                      </div>
                      <div>
                        <span className="text-slate-400">اسم الحساب:</span>
                        <p className="font-bold text-slate-700 mt-0.5">شركة تنظيم الفعاليات والمناسبات المحدودة</p>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-400">رقم الآيبان (IBAN):</span>
                        <p className="font-bold text-slate-800 mt-0.5 text-left font-mono" dir="ltr">SA 80 1000 0000 1234 5678 9012</p>
                      </div>
                    </div>
                    
                    {/* File Upload drag & drop */}
                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-600 mb-2">إرفاق إيصال التحويل البنكي <span className="text-red-500">*</span></label>
                      <div className="border-2 border-dashed border-slate-200 hover:border-purple-350 rounded-xl p-4 bg-white text-center cursor-pointer transition-all relative">
                        {transferImage ? (
                          <div className="relative inline-block">
                            <img src={transferImage} alt="Receipt Preview" className="h-20 object-contain rounded-md" />
                            <button
                              type="button"
                              onClick={() => setTransferImage(null)}
                              className="absolute -top-2 -left-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="space-y-1">
                            <Briefcase className="w-7 h-7 mx-auto text-slate-400" />
                            <p className="text-xs text-slate-500">اسحب وأفلت صورة الإيصال هنا أو اضغط للاختيار</p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onloadend = () => {
                                    setTransferImage(reader.result as string);
                                  };
                                  reader.readAsDataURL(file);
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {(paymentMethod === 'creditMax' || paymentMethod === 'mada') && (
                  /* Cards fields */
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">رقم البطاقة {paymentMethod === 'mada' ? 'مدى' : 'الائتمانية'}</label>
                      <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          maxLength={19}
                          value={cardNumber}
                          onChange={(e) => {
                            const value = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
                            const matches = value.match(/\d{4,16}/g);
                            const match = (matches && matches[0]) || '';
                            const parts = [];
                            for (let i = 0, len = match.length; i < len; i += 4) {
                              parts.push(match.substring(i, i + 4));
                            }
                            if (parts.length > 0) {
                              setCardNumber(parts.join(' '));
                            } else {
                              setCardNumber(value);
                            }
                          }}
                          placeholder={paymentMethod === 'mada' ? '9660 1234 5678 9010' : '4000 1234 5678 9010'}
                          className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-left font-mono text-xs"
                        />
                      </div>
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
                        <span>نوع وتاريخ الانتهاء</span>
                        <span className="text-[10px] text-slate-400">MM / YY</span>
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="12/28"
                        value={cardExpiry}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) {
                            setCardExpiry(`${val.slice(0, 2)}/${val.slice(2, 4)}`);
                          } else {
                            setCardExpiry(val);
                          }
                        }}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-center font-mono text-xs"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5 flex justify-between">
                        <span>الرمز السري للتحقق</span>
                        <span className="text-[10px] text-slate-400 font-mono">CVV</span>
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-center font-mono text-xs"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">اسم حامل البطاقة الكامل</label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        placeholder="SAMI AL GHAMDI"
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500 uppercase font-mono text-xs"
                      />
                    </div>
                  </div>
                )}

                {paymentMethod === 'apple' && (
                  /* Apple Pay simulation */
                  <div className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4">
                    <p className="text-slate-600 text-xs font-medium text-center">قم بالدفع الآمن بلمسة واحدة باستخدام Apple Pay:</p>
                    <button
                      type="button"
                      onClick={handleUpgradePayment}
                      className="w-full max-w-sm bg-black hover:bg-zinc-900 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span className="text-lg font-semibold font-sans tracking-tight"> Pay</span>
                      <span className="text-xs">دفع آمن بلمسة واحدة</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>مشفر ومعتمد بالكامل عبر نظام Apple Secure Element</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'google_pay' && (
                  /* Google Pay simulation */
                  <div className="flex flex-col items-center justify-center p-6 border border-slate-100 rounded-2xl bg-slate-50 space-y-4">
                    <p className="text-slate-600 text-xs font-medium text-center">ادفع بسهولة وأمان عبر Google Pay:</p>
                    <button
                      type="button"
                      onClick={handleUpgradePayment}
                      className="w-full max-w-sm bg-slate-900 hover:bg-slate-800 text-white py-3 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      <span className="text-sm font-bold font-sans">Google Pay</span>
                      <span className="text-xs">شراء بلمسة واحدة</span>
                    </button>
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                      <Lock className="w-3.5 h-3.5" />
                      <span>حماية متطورة ورموز افتراضية مشفرة</span>
                    </div>
                  </div>
                )}

                {paymentMethod === 'stc' && (
                  /* STC Pay simulation */
                  <div className="bg-purple-50/20 border border-purple-100 p-5 rounded-2xl text-right space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-purple-650 font-black text-sm">stc pay</span>
                      <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-1 rounded-full font-bold">دفع مباشر آمن</span>
                    </div>

                    {stcStep === 1 ? (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">رقم جوال STC Pay <span className="text-red-500">*</span></label>
                        <div className="relative">
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400" dir="ltr">+966</span>
                          <input
                            type="text"
                            maxLength={9}
                            value={stcNumber}
                            onChange={(e) => setStcNumber(e.target.value.replace(/\D/g, ''))}
                            placeholder="5xxxxxxxx"
                            className="w-full pr-14 pl-3 py-2.5 rounded-xl border border-slate-200 outline-none focus:border-purple-500 text-left font-mono text-xs"
                          />
                        </div>
                        <p className="text-[10px] text-slate-400">ستتلقى رمز تحقق OTP مؤقت على جهازك لتأكيد خصم قيمة الاشتراك.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <label className="block text-xs font-bold text-slate-700">أدخل رمز التحقق (OTP) المرسل للموبايل <span className="text-red-500">*</span></label>
                        <input
                          type="text"
                          maxLength={4}
                          value={stcOtp}
                          onChange={(e) => setStcOtp(e.target.value.replace(/\D/g, ''))}
                          placeholder="••••"
                          className="w-full py-2.5 rounded-xl border border-purple-300 outline-none focus:ring-2 focus:ring-purple-200 text-center font-mono text-base tracking-widest"
                        />
                        <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-400">لم يصلك الرمز؟</span>
                          <button type="button" onClick={() => { setStcOtp(''); showNotification('success', 'تم إعادة إرسال رمز OTP!'); }} className="text-purple-600 font-bold hover:underline">إعادة الإرسال</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {(paymentMethod === 'tabby' || paymentMethod === 'tamara') && (
                  /* Installments split simulation */
                  <div className="p-5 border rounded-2xl bg-slate-50 text-right space-y-4">
                    <div className="flex justify-between items-center">
                      <span className={`font-black text-base uppercase ${paymentMethod === 'tabby' ? 'text-emerald-500' : 'text-amber-500'}`}>{paymentMethod}</span>
                      <span className="text-[10px] font-bold text-slate-500">تقسيط فوري وميسر (0% فوائد)</span>
                    </div>

                    <div className="bg-white border rounded-xl p-4 divide-y divide-slate-100 text-xs">
                      <div className="pb-3 flex justify-between items-center">
                        <span className="font-medium text-slate-500">مجموع الفاتورة الإجمالي الشامل للضريبة:</span>
                        <span className="font-bold text-slate-800 font-mono">
                          {(billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly).toFixed(2)} ر.س
                        </span>
                      </div>
                      <div className="py-3 flex justify-between items-center">
                        <span className="font-medium text-slate-500">القسط الشهري لـ {paymentMethod === 'tabby' ? '4 أشهر' : '3 أشهر'}:</span>
                        <span className="font-black text-amber-600 text-sm font-mono">
                          {((billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly) / (paymentMethod === 'tabby' ? 4 : 3)).toFixed(2)} ر.س / شهرياً
                        </span>
                      </div>
                      <div className="pt-3 text-[10px] text-slate-400 leading-relaxed">
                        دورة السداد الأولى مستحقة الآن فوراً، والأقساط المتبقية تُستحق شهرياً عبر تطبيق {paymentMethod === 'tabby' ? 'تابي' : 'تمارا'}. لا توجد أي مصاريف إضافية أو فوائد مخفية.
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 pt-1 text-xs cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={agreedInstallments}
                        onChange={(e) => setAgreedInstallments(e.target.checked)}
                        className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                      />
                      <span className="text-slate-600 font-bold leading-normal">
                        أوافق على الالتزام الكامل بجدولة سداد الأقساط الشهرية تماشياً مع الشروط الائتمانية والأحكام لـ {paymentMethod === 'tabby' ? 'تابي' : 'تمارا'}.
                      </span>
                    </label>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-4 flex gap-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCheckoutModalOpen(false)}
                    disabled={isProcessingPayment}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    تراجع وإلغاء
                  </button>

                  <button
                    type="button"
                    onClick={handleUpgradePayment}
                    disabled={isProcessingPayment}
                    className="flex-grow py-2.5 bg-slate-900 hover:bg-slate-850 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center justify-center gap-1.5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {isProcessingPayment ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>جاري التحقق ومعالجة الدفع الآمن...</span>
                      </>
                    ) : (
                      <>
                        <Lock className="w-3.5 h-3.5" />
                        <span>
                          دفع {(billingCycle === 'yearly' ? selectedUpgradePackage.priceYearly : selectedUpgradePackage.priceMonthly).toFixed(2)} ر.س وإتمام الترقية فورياً
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification.show && (
        <div className={`fixed bottom-6 left-6 z-50 animate-in slide-in-from-bottom-5 fade-in duration-300 max-w-sm w-full p-4 rounded-2xl shadow-xl flex items-start gap-4 ${
          notification.type === 'error' ? 'bg-red-50 text-red-800 border border-red-100' : 'bg-emerald-50 text-emerald-800 border border-emerald-100'
        }`}>
          {notification.type === 'error' ? (
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
          )}
          <div className="flex-grow">
            <h4 className="font-bold mb-1">{notification.type === 'error' ? 'تنبيه' : 'نجاح'}</h4>
            <p className="text-sm opacity-90 leading-relaxed">{notification.message}</p>
          </div>
          <button onClick={() => setNotification(prev => ({...prev, show: false}))} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-4 h-4" />
              </button>
        </div>
      )}
    </div>
  );
}

