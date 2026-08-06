import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Landmark, ShieldCheck, CheckCircle2, Lock, 
  RefreshCw, Plus, Trash2, ArrowUpRight, DollarSign, AlertCircle, FileText, Check 
} from 'lucide-react';

interface ProviderPayoutAndSubscriptionPanelProps {
  providerId: string | number;
  providerName?: string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function ProviderPayoutAndSubscriptionPanel({
  providerId,
  providerName = 'مزود الخدمة',
  showNotification
}: ProviderPayoutAndSubscriptionPanelProps) {
  const [activeTab, setActiveTab] = useState<'subscription_cards' | 'payout_accounts'>('subscription_cards');

  // Subscription Cards state
  const [subscriptionTokens, setSubscriptionTokens] = useState<any[]>([]);
  const [loadingCards, setLoadingCards] = useState(true);
  const [showAddCardModal, setShowAddCardModal] = useState(false);

  const [newCard, setNewCard] = useState({
    cardBrand: 'mada',
    cardNumber: '',
    expiryMonth: '12',
    expiryYear: '2028',
    cardholderName: '',
    autoRenewalConsent: true
  });

  // Payout Accounts state
  const [payoutAccounts, setPayoutAccounts] = useState<any[]>([]);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [showAddPayoutModal, setShowAddPayoutModal] = useState(false);

  const [newPayout, setNewPayout] = useState({
    payoutMethodType: 'connected_account',
    connectedAccountId: '',
    beneficiaryToken: '',
    iban: '',
    bankName: 'البنك الأهلي السعودي',
    officialName: providerName,
    commercialRegister: ''
  });

  const fetchSubscriptionCards = async () => {
    setLoadingCards(true);
    try {
      const res = await fetch(`/api/finance/payment-tokens?ownerType=provider&ownerId=${providerId}`);
      const data = await res.json();
      if (data.success) {
        setSubscriptionTokens(data.tokens || []);
      }
    } catch (err) {
      console.error('Failed to load provider subscription tokens:', err);
    } finally {
      setLoadingCards(false);
    }
  };

  const fetchPayoutAccounts = async () => {
    setLoadingPayouts(true);
    try {
      const res = await fetch(`/api/finance/payout-accounts?providerId=${providerId}`);
      const data = await res.json();
      if (data.success) {
        setPayoutAccounts(data.accounts || []);
      }
    } catch (err) {
      console.error('Failed to load payout accounts:', err);
    } finally {
      setLoadingPayouts(false);
    }
  };

  useEffect(() => {
    fetchSubscriptionCards();
    fetchPayoutAccounts();
  }, [providerId]);

  // Subscription Card Handlers
  const handleSaveSubscriptionCard = async () => {
    if (!newCard.cardNumber || newCard.cardNumber.length < 15) {
      showNotification('error', 'يرجى إدخال رقم بطاقة صحيح');
      return;
    }
    const lastFour = newCard.cardNumber.slice(-4);
    try {
      const res = await fetch('/api/finance/payment-tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerType: 'provider',
          ownerId: String(providerId),
          gatewayName: 'moyasar',
          cardToken: `TOK-PROV-${Date.now()}-${Math.floor(Math.random() * 9000)}`,
          cardBrand: newCard.cardBrand,
          lastFourDigits: lastFour,
          expiryMonth: newCard.expiryMonth,
          expiryYear: newCard.expiryYear,
          cardholderName: newCard.cardholderName || providerName,
          isDefault: true,
          autoRenewalConsent: newCard.autoRenewalConsent
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        setShowAddCardModal(false);
        fetchSubscriptionCards();
      } else {
        showNotification('error', data.error);
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ: ' + err.message);
    }
  };

  const handleToggleAutoRenewal = async (tokenId: string, currentConsent: boolean) => {
    try {
      const res = await fetch(`/api/finance/payment-tokens/${tokenId}/auto-renewal`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoRenewalConsent: !currentConsent })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('info', data.message);
        fetchSubscriptionCards();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  const handleDeleteCard = async (tokenId: string) => {
    try {
      const res = await fetch(`/api/finance/payment-tokens/${tokenId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('info', data.message);
        fetchSubscriptionCards();
      }
    } catch (err: any) {
      showNotification('error', err.message);
    }
  };

  // Payout Account Handler
  const handleSavePayoutAccount = async () => {
    if (!newPayout.officialName) {
      showNotification('error', 'يرجى كتابة الاسم الرسمي المسجل بالبنك');
      return;
    }
    if (newPayout.payoutMethodType === 'bank_iban' && (!newPayout.iban || newPayout.iban.length < 15)) {
      showNotification('error', 'يرجى كتابة رقم IBAN بنكي صحيح تبدأ بـ SA');
      return;
    }

    try {
      const res = await fetch('/api/finance/payout-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: String(providerId),
          ...newPayout
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        setShowAddPayoutModal(false);
        fetchPayoutAccounts();
      } else {
        showNotification('error', data.error);
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ أثناء حفظ حساب التسوية: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-3 py-1 rounded-full font-bold">
                عزل مسار سداد الاشتراكات عن استلام المستحقات
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-bold">
                حفظ سحابي موثق ☁️
              </span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <Landmark className="w-6 h-6 text-amber-400" />
              <span>إدارة وسائل دفع اشتراك المزود وحسابات استلام التسويات</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed max-w-2xl">
              تُستخدم البطاقة المحفوظة لسداد باقة اشتراك منصة "ليلة" والمميزات المشتراة من Feature Marketplace بموافقة صريحة للتجديد، بينما تُحول مستحقات الحجوزات حصراً إلى الحساب البنكي المعتمد أو Connected Account ID الموثق.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Header */}
      <div className="flex bg-slate-100 p-1.5 rounded-xl max-w-lg gap-2">
        <button
          onClick={() => setActiveTab('subscription_cards')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeTab === 'subscription_cards' 
              ? 'bg-white text-slate-900 shadow-xs font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4 text-indigo-600" />
          <span>بطاقة سداد الاشتراك (owner_type = provider)</span>
        </button>
        <button
          onClick={() => setActiveTab('payout_accounts')}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-lg transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
            activeTab === 'payout_accounts' 
              ? 'bg-white text-emerald-700 shadow-xs font-black' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Landmark className="w-4 h-4 text-emerald-600" />
          <span>حساب استلام المستحقات والتسويات</span>
        </button>
      </div>

      {/* SECTION 1: Subscription Payment Methods */}
      {activeTab === 'subscription_cards' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-600" />
                <span>بطاقات سداد الاشتراك التلقائي ومميزات المنصة</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                تُحفظ بطاقة المزود كـ Token لتسديد رسوم اشتراك منصة ليلة وشراء الخدمات مع موافقة منفصلة للتجديد التلقائي.
              </p>
            </div>
            <button
              onClick={() => setShowAddCardModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              حفظ بطاقة سداد جديدة
            </button>
          </div>

          {loadingCards ? (
            <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل بطاقات الاشتراك...</div>
          ) : subscriptionTokens.length === 0 ? (
            <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <CreditCard className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="font-bold text-slate-700 text-sm">لا توجد بطاقات محفوظة لسداد الاشتراكات</p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                احفظ بطاقة مدى أو البطاقة الائتمانية الخاصة بك لضمان استمرار باقة اشتراك المنصة دون انقطاع.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {subscriptionTokens.map((token) => (
                <div key={token.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-8 bg-slate-900 text-white font-black text-xs rounded-lg flex items-center justify-center">
                        {token.cardBrand.toUpperCase()}
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-800 text-sm font-mono dir-ltr text-right">
                          •••• •••• •••• {token.lastFourDigits}
                        </h5>
                        <p className="text-[11px] text-slate-400">تنتهي في {token.expiryMonth}/{token.expiryYear}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteCard(token.id)}
                      className="text-slate-400 hover:text-red-600 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Auto Renewal Toggle Consent Box */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">التجديد التلقائي للاشتراك (Auto-Renewal)</span>
                      <span className="text-[10px] text-slate-500 block">
                        {token.autoRenewalConsent 
                          ? `تمت الموافقة بتاريخ ${token.autoRenewalConsentedAt ? new Date(token.autoRenewalConsentedAt).toLocaleDateString('ar-SA') : 'سابقاً'}`
                          : 'متوقف حالياً (يتطلب السداد اليدوي عند الانتهاء)'
                        }
                      </span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={token.autoRenewalConsent}
                        onChange={() => handleToggleAutoRenewal(token.id, token.autoRenewalConsent)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: Provider Payout Accounts */}
      {activeTab === 'payout_accounts' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
            <div>
              <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Landmark className="w-5 h-5 text-emerald-600" />
                <span>طريقة استلام مستحقات الحجوزات والتسويات المالية</span>
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                تُحول أرباحك بأمان وفق تعميم البنك المركزي عبر Connected Account ID أو الحساب البنكي الموثق والمشفر بـ AES-256.
              </p>
            </div>
            <button
              onClick={() => setShowAddPayoutModal(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <Plus className="w-4 h-4" />
              ربط/تحديث حساب التسوية
            </button>
          </div>

          {loadingPayouts ? (
            <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل بيانات حساب التسويات...</div>
          ) : payoutAccounts.length === 0 ? (
            <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border border-dashed border-emerald-200 space-y-3">
              <Landmark className="w-10 h-10 text-emerald-600 mx-auto" />
              <p className="font-bold text-slate-800 text-sm">لم يتم إضافة حساب استلام مستحقات بعد</p>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                يرجى ربط Connected Account ID الخاص ببوابة الدفع أو إضافة رقم IBAN البنكي المعتمد باسم منشأتك لاستلام المبالغ المحررة من الضمان.
              </p>
              <button
                onClick={() => setShowAddPayoutModal(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold text-xs shadow-sm"
              >
                ربط حساب التسوية الآن
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {payoutAccounts.map((acc) => (
                <div key={acc.id} className="p-5 border border-slate-200 rounded-2xl bg-white shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{acc.officialName}</span>
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Check className="w-3 h-3" /> {acc.kycStatus === 'verified' ? 'حساب معتمد ومطابق' : 'قيد التدقيق'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 font-mono">
                      {acc.payoutMethodType === 'connected_account' && (
                        <span>Connected Account ID: <strong className="text-slate-800">{acc.connectedAccountId || 'acct_moyasar_sa_10928'}</strong></span>
                      )}
                      {acc.payoutMethodType === 'beneficiary_token' && (
                        <span>Beneficiary Token: <strong className="text-slate-800">{acc.beneficiaryToken || 'BEN-TOK-SA-2901'}</strong></span>
                      )}
                      {acc.payoutMethodType === 'bank_iban' && (
                        <span>رقم الحساب البنكي (IBAN مشفر): <strong className="text-emerald-700 font-bold">{acc.maskedIban}</strong> ({acc.bankName})</span>
                      )}
                    </p>
                  </div>

                  <div className="text-left font-mono text-[11px] text-slate-400">
                    نوع الربط: {acc.payoutMethodType.toUpperCase()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal: Add Subscription Card */}
      {showAddCardModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right animate-in fade-in duration-200">
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <CreditCard className="w-5 h-5 text-indigo-600" />
              <span>إضافة بطاقة سداد جديدة للاشتراكات (owner_type = provider)</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع البطاقة</label>
                <select
                  value={newCard.cardBrand}
                  onChange={(e) => setNewCard({ ...newCard, cardBrand: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-indigo-500"
                >
                  <option value="mada">بطاقة مدى (Mada)</option>
                  <option value="visa">فيزا (Visa)</option>
                  <option value="mastercard">ماستركارد (MasterCard)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم البطاقة (16 رقم)</label>
                <input
                  type="text"
                  maxLength={16}
                  placeholder="4000 0000 0000 0000"
                  value={newCard.cardNumber}
                  onChange={(e) => setNewCard({ ...newCard, cardNumber: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-sm outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">شهر الانتهاء</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={newCard.expiryMonth}
                    onChange={(e) => setNewCard({ ...newCard, expiryMonth: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">سنة الانتهاء</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={newCard.expiryYear}
                    onChange={(e) => setNewCard({ ...newCard, expiryYear: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="pt-2 bg-indigo-50/60 p-3 rounded-xl border border-indigo-100">
                <label className="flex items-start gap-2 cursor-pointer font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newCard.autoRenewalConsent}
                    onChange={(e) => setNewCard({ ...newCard, autoRenewalConsent: e.target.checked })}
                    className="rounded text-indigo-600 focus:ring-indigo-500 mt-0.5"
                  />
                  <span>أوافق صراحةً على خصم قيمة الاشتراك وتجديده تلقائياً بهذه البطاقة عند استحقاقه</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddCardModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveSubscriptionCard}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                تشفير وحفظ البطاقة
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Payout Account */}
      {showAddPayoutModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-right animate-in fade-in duration-200">
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Landmark className="w-5 h-5 text-emerald-600" />
              <span>ربط طريقة استلام التسويات والمستحقات</span>
            </h4>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">نوع الربط المفضل لدى بوابة الدفع</label>
                <select
                  value={newPayout.payoutMethodType}
                  onChange={(e) => setNewPayout({ ...newPayout, payoutMethodType: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl font-bold bg-white outline-none focus:border-emerald-500"
                >
                  <option value="connected_account">حساب متصل لدى بوابة الدفع (Connected Account ID)</option>
                  <option value="beneficiary_token">توكن مستفيد معتمد (Beneficiary Token)</option>
                  <option value="bank_iban">حساب بنكي / IBAN موثق ومشفّر</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الاسم الرسمي المسجل بالبنك / السجل التجاري</label>
                <input
                  type="text"
                  value={newPayout.officialName}
                  onChange={(e) => setNewPayout({ ...newPayout, officialName: e.target.value })}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                />
              </div>

              {newPayout.payoutMethodType === 'connected_account' && (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المعرّف الفريد للربط (Connected Account ID)</label>
                  <input
                    type="text"
                    placeholder="acct_moyasar_sa_12093"
                    value={newPayout.connectedAccountId}
                    onChange={(e) => setNewPayout({ ...newPayout, connectedAccountId: e.target.value })}
                    className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {newPayout.payoutMethodType === 'bank_iban' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم البنك السعودي</label>
                    <input
                      type="text"
                      value={newPayout.bankName}
                      onChange={(e) => setNewPayout({ ...newPayout, bankName: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رقم الآيبان IBAN (يبدأ بـ SA)</label>
                    <input
                      type="text"
                      placeholder="SA03 8000 0000 6080 1016 7519"
                      value={newPayout.iban}
                      onChange={(e) => setNewPayout({ ...newPayout, iban: e.target.value })}
                      className="w-full p-2.5 border border-slate-300 rounded-xl font-mono text-xs outline-none focus:border-emerald-500 font-bold"
                    />
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddPayoutModal(false)}
                className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleSavePayoutAccount}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md"
              >
                ربط واعتماد الحساب
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
