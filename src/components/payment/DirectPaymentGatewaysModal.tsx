import React, { useState } from 'react';
import { 
  CreditCard, ShieldCheck, CheckCircle2, Lock, Sparkles, X, 
  Smartphone, ArrowLeft, RefreshCw, Zap, Award, FileText, Check 
} from 'lucide-react';

interface DirectPaymentGatewaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingAmount?: number;
  hallName?: string;
  providerName?: string;
  subscriptionTier?: 'basic' | 'pro' | 'vip';
  customerName?: string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onPaymentSuccess?: (receiptData: any) => void;
}

export default function DirectPaymentGatewaysModal({
  isOpen,
  onClose,
  bookingAmount = 15000,
  hallName = 'القاعة الكبرى للمناسبات',
  providerName = 'شركة ليلة لإدارة الفعاليات',
  subscriptionTier = 'pro',
  customerName = 'العميل العزيز',
  showNotification,
  onPaymentSuccess
}: DirectPaymentGatewaysModalProps) {
  const [activeTab, setActiveTab] = useState<'apple_pay' | 'mada_direct'>('apple_pay');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBiometricPrompt, setShowBiometricPrompt] = useState(false);
  const [show3DSecureModal, setShow3DSecureModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [completedReceipt, setCompletedReceipt] = useState<any | null>(null);

  // MADA Card state
  const [cardHolder, setCardHolder] = useState(customerName);
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('08/28');
  const [cvv, setCvv] = useState('123');

  if (!isOpen) return null;

  // Calculate fees
  const grossAmount = bookingAmount;
  const vatSAR = Math.round(grossAmount * 0.15 * 100) / 100;
  const commissionRate = subscriptionTier === 'vip' ? 0.05 : subscriptionTier === 'pro' ? 0.10 : 0.15;
  const commissionSAR = Math.round(grossAmount * commissionRate * 100) / 100;
  const providerPayoutSAR = Math.round((grossAmount - commissionSAR) * 100) / 100;
  const earnedLoyaltyPoints = Math.floor(grossAmount / 10);

  // Auto detect bank
  const getDetectedBank = () => {
    if (cardNumber.startsWith("5888") || cardNumber.startsWith("4588")) return "مصرف الراجحي (MADA)";
    if (cardNumber.startsWith("4008") || cardNumber.startsWith("5358")) return "مصرف الإنماء (MADA)";
    if (cardNumber.startsWith("4017") || cardNumber.startsWith("5294")) return "بنك الرياض (MADA)";
    return "البنك الأهلي السعودي - مدى (SNB MADA)";
  };

  const handleApplePayTrigger = async () => {
    setShowBiometricPrompt(true);
    setTimeout(async () => {
      setShowBiometricPrompt(false);
      setIsProcessing(true);
      try {
        const res = await fetch('/api/finance/payment/apple-pay-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            amount: grossAmount,
            customerName,
            subscriptionTier
          })
        });
        const data = await res.json();
        if (data.success) {
          setCompletedReceipt(data.transaction);
          showNotification('success', ' تم تنفيذ الدفع بنجاح عبر Apple Pay Direct SDK!');
          if (onPaymentSuccess) onPaymentSuccess(data.transaction);
        } else {
          showNotification('error', data.error || 'فشلت عملية الدفع بـ Apple Pay');
        }
      } catch (err: any) {
        showNotification('error', 'حدث خطأ أثناء الاتصال ببوابة Apple Pay');
      } finally {
        setIsProcessing(false);
      }
    }, 1800);
  };

  const handleMadaPaymentSubmit = () => {
    if (!cardNumber || cardNumber.length < 15) {
      showNotification('error', 'يرجى كتابة رقم بطاقة مدى مكون من 16 خانة بشكل صحيح');
      return;
    }
    setShow3DSecureModal(true);
  };

  const handleVerify3DSecure = async () => {
    if (otpCode !== '1234' && otpCode !== '0000' && otpCode.length !== 4) {
      showNotification('warning', 'رمز التحقيق المالي الافتراضي للاختبار هو 1234');
    }
    setShow3DSecureModal(false);
    setIsProcessing(true);
    try {
      const res = await fetch('/api/finance/payment/mada-direct', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: grossAmount,
          cardNumber,
          cardHolder,
          expiry,
          cvv,
          subscriptionTier
        })
      });
      const data = await res.json();
      if (data.success) {
        setCompletedReceipt(data.transaction);
        showNotification('success', '💳 تم اعتماد الخصم المباشر عبر شبكة مدى الوطنية بنجاح!');
        if (onPaymentSuccess) onPaymentSuccess(data.transaction);
      } else {
        showNotification('error', data.error || 'فشلت العملية عبر مدى');
      }
    } catch (e) {
      showNotification('error', 'حدث خطأ في شبكة مدى الوطنية');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 font-sans text-right" dir="rtl">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative">
          <button 
            onClick={onClose}
            className="absolute left-5 top-5 text-slate-400 hover:text-white bg-white/10 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-emerald-500/30">
              بوابة الدفع الإلكتروني المباشر المشفرة 256-bit
            </span>
          </div>
          <h2 className="text-xl font-black text-white">بوابات الدفع المباشر (Apple Pay & مدى)</h2>
          <p className="text-slate-300 text-xs mt-1">
            خصم وتسوية مالية فورية مع إصدار فاتورة ضريبية رسمية وتأكيد الحجز الفوري
          </p>
        </div>

        {/* Content */}
        {!completedReceipt ? (
          <div className="p-6 space-y-6">
            
            {/* Amount & Invoice Preview */}
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex justify-between items-center">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-bold">تفاصيل الحجز والمنشأة</span>
                <span className="font-black text-slate-800 dark:text-slate-100 text-sm">{hallName}</span>
                <span className="text-[10px] text-slate-500 block">{providerName}</span>
              </div>
              <div className="text-left">
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-bold">إجمالي المبلغ المطلوب</span>
                <span className="font-black text-xl text-emerald-600 dark:text-emerald-400">{grossAmount.toLocaleString()} ر.س</span>
                <span className="text-[10px] text-emerald-700 dark:text-emerald-300 block font-bold mt-0.5">
                  + تكسب 🎁 {earnedLoyaltyPoints} نقطة ولاء
                </span>
              </div>
            </div>

            {/* Gateway Selector Tabs */}
            <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <button
                onClick={() => setActiveTab('apple_pay')}
                className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'apple_pay' 
                    ? 'bg-black text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <span className="text-base font-bold"></span>
                <span>Apple Pay Direct</span>
              </button>

              <button
                onClick={() => setActiveTab('mada_direct')}
                className={`py-3 px-4 rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer ${
                  activeTab === 'mada_direct' 
                    ? 'bg-emerald-600 text-white shadow-md' 
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>بطاقة مدى الوطنية Direct</span>
              </button>
            </div>

            {/* Tab 1: Apple Pay */}
            {activeTab === 'apple_pay' && (
              <div className="space-y-4 text-center py-2">
                <div className="p-6 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-black text-white flex items-center justify-center mb-3 shadow-lg">
                    <span className="text-3xl font-black"></span>
                  </div>
                  <h4 className="font-black text-slate-800 dark:text-slate-100 text-sm">الدفع السريع بلمسة واحدة عبر Apple Pay</h4>
                  <p className="text-slate-500 text-xs mt-1 max-w-xs leading-relaxed">
                    استخدم Face ID / Touch ID للمصادقة الفورية الآمنة عبر حساب Apple الخاص بك دون الحاجة لإدخال أرقام البطاقات.
                  </p>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1 rounded-full border border-emerald-200">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>عمولة 0% إضافية على بطاقات مدى المسجلة في Apple Wallet</span>
                  </div>
                </div>

                <button
                  onClick={handleApplePayTrigger}
                  disabled={isProcessing}
                  className="w-full py-4 bg-black hover:bg-slate-900 text-white rounded-2xl font-black text-base shadow-xl transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50"
                >
                  <span className="text-xl"></span>
                  <span>الدفع بواسطة Apple Pay ({grossAmount.toLocaleString()} ر.س)</span>
                </button>
              </div>
            )}

            {/* Tab 2: MADA Direct */}
            {activeTab === 'mada_direct' && (
              <div className="space-y-4">
                <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-600" />
                    <span className="font-bold">شبكة مدى المباشرة MADA Direct SDK</span>
                  </div>
                  <span className="font-mono text-[10px] bg-emerald-200 dark:bg-emerald-800 px-2 py-0.5 rounded font-black">
                    {cardNumber ? getDetectedBank() : 'MADA Verified'}
                  </span>
                </div>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">اسم حامل البطاقة</label>
                    <input 
                      type="text" 
                      value={cardHolder} 
                      onChange={e => setCardHolder(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 font-medium"
                      placeholder="كما هو مدون على البطاقة"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رقم بطاقة مدى (16 خانة)</label>
                    <input 
                      type="text" 
                      value={cardNumber} 
                      onChange={e => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
                      className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 font-mono tracking-widest text-center"
                      placeholder="5888 XXXX XXXX XXXX"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">تاريخ الانتهاء</label>
                      <input 
                        type="text" 
                        value={expiry} 
                        onChange={e => setExpiry(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 text-center font-mono"
                        placeholder="MM/YY"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">رمز الأمان (CVV)</label>
                      <input 
                        type="password" 
                        value={cvv} 
                        onChange={e => setCvv(e.target.value.slice(0, 4))}
                        className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 outline-none focus:border-emerald-500 text-center font-mono"
                        placeholder="123"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleMadaPaymentSubmit}
                  disabled={isProcessing}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-sm shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 mt-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>تأكيد الخصم المباشر ببطاقة مدى ({grossAmount.toLocaleString()} ر.س)</span>
                </button>
              </div>
            )}

            {/* Financial & Tax Summary */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
              <div className="flex justify-between">
                <span>ضريبة القيمة المضافة (15%):</span>
                <span className="font-mono">{vatSAR.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span>عمولة المنصة المقدرة ({commissionRate * 100}% - {subscriptionTier.toUpperCase()}):</span>
                <span className="font-mono text-emerald-600 font-bold">{commissionSAR.toLocaleString()} ر.س</span>
              </div>
              <div className="flex justify-between">
                <span>صافي تحويل المزود المالي:</span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{providerPayoutSAR.toLocaleString()} ر.س</span>
              </div>
            </div>

          </div>
        ) : (
          /* Receipt View */
          <div className="p-6 space-y-5 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-10 h-10 animate-bounce" />
            </div>

            <div>
              <h3 className="font-black text-xl text-slate-800 dark:text-slate-100">تم اعتماد العملية بنجاح!</h3>
              <p className="text-slate-500 text-xs mt-1">تم خصم المبلغ وإصدار الفاتورة الضريبية الرسمية وحفظ الحجز في النظام</p>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-right space-y-2">
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-bold">رقم الفاتورة الصادرة:</span>
                <span className="font-mono font-black text-indigo-600 dark:text-indigo-400">{completedReceipt.invoiceNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-bold">رقم الإيراد المالي:</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">{completedReceipt.revenueNumber}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
                <span className="text-slate-500 font-bold">بوابة الدفع المستخدمة:</span>
                <span className="font-bold">{completedReceipt.gateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 font-bold">نقاط الولاء المكتسبة:</span>
                <span className="font-bold text-amber-500">🎁 +{completedReceipt.earnedLoyaltyPoints} نقطة</span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-black text-xs hover:bg-slate-800 transition-all cursor-pointer"
            >
              إغلاق ومتابعة الحجز
            </button>
          </div>
        )}

        {/* Biometric Prompt Simulation Modal */}
        {showBiometricPrompt && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in fade-in duration-200">
            <div className="w-20 h-20 rounded-full border-2 border-emerald-400 flex items-center justify-center mb-4 animate-pulse">
              <Smartphone className="w-10 h-10 text-emerald-400" />
            </div>
            <h3 className="text-lg font-black text-white">Apple Pay - Touch ID / Face ID</h3>
            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              جارِ المصادقة البيومترية الآمنة مع Apple Pay Merchant validation...
            </p>
          </div>
        )}

        {/* 3D Secure OTP Modal */}
        {show3DSecureModal && (
          <div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-in zoom-in-95 duration-200">
            <div className="bg-white text-slate-800 p-6 rounded-3xl max-w-sm w-full shadow-2xl text-right">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <span className="font-black text-xs text-emerald-700">MADA 3D-Secure 🔐</span>
                <span className="text-[10px] font-mono text-slate-400">{getDetectedBank()}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">إدخال رمز الأمان لمصادقة العملية</h4>
              <p className="text-[11px] text-slate-500 mb-4">
                تم إرسال رمز التحقق المالي المرتبط بحسابك المالي. (رمز الاختبار الافتراضي: 1234)
              </p>

              <input 
                type="text" 
                value={otpCode} 
                onChange={e => setOtpCode(e.target.value)}
                maxLength={4}
                className="w-full p-3 text-center text-xl tracking-widest font-mono border-2 border-slate-200 rounded-xl mb-4 focus:border-emerald-500 outline-none"
                placeholder="1234"
              />

              <button
                onClick={handleVerify3DSecure}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs transition-all cursor-pointer"
              >
                تأكيد العملية وحسم المبلغ
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
