import React, { useState } from 'react';
import { Wallet, Sparkles, Briefcase, TrendingUp, Lock, RefreshCw, CheckCircle, ArrowDownLeft, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';

interface WalletEscrowProps {
  wallet: {
    available_balance: number;
    pending_balance: number;
  };
  walletTransactions: any[];
  userRole: 'admin' | 'provider';
  currentProvider: string;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  onRefresh: () => void;
}

export default function WalletEscrow({
  wallet,
  walletTransactions,
  userRole,
  currentProvider,
  showNotification,
  onRefresh
}: WalletEscrowProps) {
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [clerkVerified, setClerkVerified] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [isCronRunning, setIsCronRunning] = useState(false);

  const minLimit = 1000;
  const maxLimit = 50000;
  const activeSettlementMethod = localStorage.getItem('ACTIVE_SETTLEMENT_METHOD') || 'weekly_clearance';

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);
  };

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawalAmount);

    if (!clerkVerified) {
      showNotification('error', 'يرجى تأكيد الرمز والمصادقة الإضافية للـ Clerk OTP أولاً لضمان الأمن!');
      return;
    }

    if (isNaN(amt) || amt <= 0) {
      showNotification('error', 'يرجى إدخال مبلغ صحيح للسحب.');
      return;
    }

    if (amt < minLimit) {
      showNotification('error', `المبلغ المطلوب أقل من الحد الأدنى للسحب (${minLimit} ر.س)`);
      return;
    }

    if (amt > maxLimit) {
      showNotification('error', `المبلغ المطلوب يتخطى الحد الأعلى المسموح للمعاملة (${maxLimit} ر.س)`);
      return;
    }

    if (amt > wallet.available_balance) {
      showNotification('error', 'المبلغ المطلوب يتجاوز الرصيد المتاح للسحب لديك!');
      return;
    }

    if (!bankAccount.trim()) {
      showNotification('error', 'يرجى تعبئة الرقم الدولي للحساب البنكي (IBAN) بصياغة صحيحة.');
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/finance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: currentProvider || 'general_provider',
          amount: amt,
          bankDetails: bankAccount
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', `تم تقديم طلب السحب بقيمة ${amt} ر.س ومصادقته بنجاح عبر Clerk وهو قيد المراجعة النقدية الآن!`);
        setWithdrawalAmount('');
        setBankAccount('');
        setClerkVerified(false);
        onRefresh();
      } else {
        showNotification('error', data.error || 'فشلت معالجة الطلب على السيرفر.');
      }
    } catch (err: any) {
      showNotification('error', 'تعذر الاتصال بالخادم لإجراء عملية السحب.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const triggerFastCronSimulation = async () => {
    setIsCronRunning(true);
    try {
      const res = await fetch('/api/finance/trigger-cron', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceAll: true })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'تم تنشيط المقاصة والجدولة الآلية للـ Cron بنجاح وتحرير معلقات الدفع!');
        onRefresh();
      } else {
        showNotification('error', data.error || 'حدث خطأ أثناء تنشيط دالة الـ Cron.');
      }
    } catch (err) {
      showNotification('error', 'فشل الاتصال بالخادم لتنشيط الـ Cron.');
    } finally {
      setIsCronRunning(false);
    }
  };

  return (
    <div id="wallet-escrow-container" className="space-y-6 animate-in fade-in duration-500">
      {/* Dynamic Settlement Method Info Banner */}
      <div className="p-5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-950 text-sm space-y-2 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div className="space-y-1">
          <h4 className="font-extrabold text-amber-900 flex items-center gap-1.5 text-base">
            <span>🏛️ سياسة تسوية المدفوعات والتدفق المالي النشطة</span>
            <span className="bg-amber-100 text-amber-900 border border-amber-200 text-[10px] px-2 py-0.5 rounded font-black font-sans uppercase">بروتوكول فعال</span>
          </h4>
          <p className="text-xs text-amber-800 leading-relaxed max-w-3xl">
            {activeSettlementMethod === 'deposit_only' ? (
              'تعتمد المنصة حالياً "نموذج العربون للتحصيل المباشر" لإطلاق المشروع ماليًا. يدفع العميل نسبة العربون المحددة (مثال: 30%) إلكترونياً عند تأكيد الحجز لتأمين الموعد، بينما يقوم بسداد المترصد المتبقي مباشرة لك كاش أو تحويل بنكي يوم الفعالية.'
            ) : activeSettlementMethod === 'split_payments' ? (
              'تعتمد المنصة حالياً نظام "التقسيم الفوري التلقائي (Automatic Split)" لتوزيع العوائد والعمولات. يتم خصم عمولة المنصة وصب الأرباح بحسابك البنكي تلقائياً عبر بوابة HyperPay Split فور تأكيد الدفع الإلكتروني بنسبة 100%.'
            ) : (
              'تعتمد المنصة حالياً "التحصيل المركزي والمقاصة الأسبوعية المنظمة". يستلم المجمع المالي 100% من دفعات العملاء، ويتم تجميدها كأرصدة معلقة لضمان تلبية الشروط، ثم تجرى تسوية مجاميع حسابات الشركاء والمقاصة البنكية مجمعة يوم الأحد.'
            )}
          </p>
        </div>
        <div className="shrink-0 flex items-center bg-white/80 border border-amber-200 px-3 py-2 rounded-xl text-xs font-bold text-slate-800 gap-1.5 self-start sm:self-center">
          <span>الوضعية:</span>
          <span className="text-amber-800 font-extrabold underline decoration-amber-500 decoration-2">
            {activeSettlementMethod === 'deposit_only' ? 'نموذج العربون' : activeSettlementMethod === 'split_payments' ? 'التقسيم التلقائي' : 'المقاصة الأسبوعية'}
          </span>
        </div>
      </div>

      {wallet.available_balance === 0 && wallet.pending_balance === 0 && walletTransactions.length === 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 p-6 rounded-2xl space-y-4 shadow-sm animate-in fade-in duration-500 mb-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-500 text-white rounded-xl shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="text-base font-extrabold text-blue-900">أولى خطواتك المالية معنا: دليلك لفهم المحفظة والحسابات 📊</h4>
              <p className="text-xs text-blue-700 leading-relaxed max-w-4xl">
                مرحباً بك كشريك جديد في منصة ليلة! يظهر رصيدك الآن بقيمة (0 ر.س) وهو الصفر المالي الفعلي للبدء الآمن والموثوق. إليك كيف يتم تسجيل الدفعات وحركة الأموال تلقائياً لتبدأ بتحقيق الأرباح:
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-2">
            <div className="bg-white/80 p-4 rounded-xl border border-blue-100/50 space-y-1 text-right">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5 font-sans">
                <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-xs font-mono">١</span>
                دفع العملاء الحقيقي
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                فور قيام عريس أو عميل بحجز قاعتك ودفع العربون/القيمة عبر مدى أو فيزا، يتم إطلاق العملية بنجاح.
              </p>
            </div>
            
            <div className="bg-white/80 p-4 rounded-xl border border-blue-100/50 space-y-1 text-right">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5 font-sans">
                <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-xs font-mono">٢</span>
                الرصيد المعلق الفوري
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                يتحول إيراد الحجز مباشرة إلى "رصيد معلق" في محفظتك فور تسديد الدفعة لحين تأمين إقامة الفعالية.
              </p>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-blue-100/50 space-y-1 text-right">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5 font-sans">
                <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-xs font-mono">٣</span>
                تصفية عمولة المنصة
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                يتم حساب وحسم عمولة المنصة المسجلة لباقة حسابك (ضريبة القيمة المضافة + عمولة التشغيل) آلياً من الخلفية.
              </p>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border border-blue-100/50 space-y-1 text-right">
              <span className="text-xs font-bold text-blue-950 flex items-center gap-1.5 font-sans">
                <span className="w-5 h-5 bg-blue-100 text-blue-800 rounded-full flex items-center justify-center font-bold text-xs font-mono">٤</span>
                تحرير رصيدك للسحب
              </span>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                بعد انتهاء الحجز ومرور 24 ساعة على المغادرة، يتحول المبلغ تلقائياً لـ "الرصيد المتاح" لتتمكن من سحبه بنقرة زر!
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-500">الرصيد المتاح للسحب</span>
            <h4 className="text-3xl font-black text-emerald-600 mt-2 font-mono">{formatCurrency(wallet.available_balance)}</h4>
            <p className="text-slate-400 text-xs mt-1 font-sans">يمكنك سحبه للحساب البنكي فوراً</p>
          </div>
          <div className="p-4 bg-emerald-50 text-emerald-500 rounded-2xl">
            <Wallet className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-500">الرصيد المعلق</span>
            <h4 className="text-3xl font-black text-amber-600 mt-2 font-mono">{formatCurrency(wallet.pending_balance)}</h4>
            <p className="text-slate-400 text-xs mt-1 font-sans">يتحرك للمتاح بعد 24 ساعة من المغادرة</p>
          </div>
          <div className="p-4 bg-amber-50 text-amber-500 rounded-2xl">
            <Briefcase className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-sm font-bold text-slate-500 font-sans">سقف وضوابط السحب</span>
            <h4 className="text-base font-black text-slate-700 mt-1 font-mono">
              الأدنى: {formatCurrency(minLimit)} <br />
              الأعلى: {formatCurrency(maxLimit)}
            </h4>
            <p className="text-slate-400 text-[10px] mt-1 font-sans">محددة عبر لوحة لضبط الاستقرار والتسويات</p>
          </div>
          <div className="p-4 bg-slate-50 text-slate-500 rounded-2xl">
            <TrendingUp className="w-8 h-8" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal request with Clerk auth */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-800 border-b border-indigo-50/50 pb-3 font-sans">طلب تسوية وسحب رصيد</h3>
          
          {/* Clerk Verification Simulator */}
          <div className="p-4 rounded-xl border border-indigo-50 bg-indigo-50/20 text-indigo-950 text-sm space-y-3">
             <h4 className="font-bold flex items-center gap-2 font-sans">🔐 أمان إضافي بواسطة Clerk</h4>
             <p className="text-xs text-slate-600 leading-relaxed font-sans">تتطلب تسييل وحركة الأموال تحققاً ثنائياً إلكترونياً لرمز الأمان عبر Clerk OTP للتأكد من هوية مالك الحساب.</p>
             <div className="flex items-center gap-2 pt-1">
               <input 
                 type="checkbox" 
                 id="clerk_ch"
                 checked={clerkVerified} 
                 onChange={e => {
                   setClerkVerified(e.target.checked);
                   if (e.target.checked) {
                     showNotification('info', '🔒 تم النجاح: تم التحقق ثنائياً من الجلسة ومصادقة المزود عبر مزود Clerk!');
                   }
                 }}
                 className="w-4 h-4 rounded border-slate-300 text-indigo-600"
               />
               <label htmlFor="clerk_ch" className="text-xs font-bold text-slate-700 cursor-pointer select-none font-sans">تأكيد مصادقة Clerk والمطابقة عبر الجوال</label>
             </div>
          </div>

          <form onSubmit={handleWithdrawalRequest} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">المبلغ المطلوب سحبه (ريال)</label>
              <input 
                 type="number" 
                 value={withdrawalAmount} 
                 onChange={e => setWithdrawalAmount(e.target.value)}
                 placeholder="مثال: 1000"
                 disabled={wallet.available_balance < minLimit}
                 className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 p-3 rounded-xl outline-none text-sm font-bold font-mono"
              />
              {wallet.available_balance < minLimit && (
                <p className="text-red-500 text-[10px] font-bold">عذراً، رصيدك المتاح الحالي أقل من الحد الأدنى للسحب ({minLimit} ريال)</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500">الحساب البنكي الدولي المستلم (IBAN)</label>
              <input 
                 type="text" 
                 value={bankAccount} 
                 onChange={e => setBankAccount(e.target.value)}
                 placeholder="SA03 9000 0000 0000 1234 5678"
                 disabled={wallet.available_balance < minLimit}
                 className="w-full bg-slate-50 border border-slate-200 focus:border-indigo-500 p-3 rounded-xl outline-none text-xs font-mono text-left"
              />
            </div>

            <button
              type="submit"
              disabled={isWithdrawing || wallet.available_balance < minLimit}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm shadow-emerald-200 disabled:opacity-50"
            >
              {isWithdrawing ? 'جاري السحب والمصادقة...' : 'إرسال طلب السحب الفوري ⚡'}
            </button>
          </form>

          {/* SAMA / SARIE Fast Settlement Simulator */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-xs font-sans">
                <ClockIcon className="w-4 h-4 text-slate-500 text-indigo-600" />
                <span>محاكي الجدولة وخادم الـ Cron للتحرير والمقاصة</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed font-sans">
                يعمل خادم المنصة الخلفي تلقائياً كل ساعة بفحص وتتبع حجوزاتك، ونقل الأرصدة المعلقة للجاهزة بعد مرور 24 ساعة من الفعالية. للتجربة الفورية وتوفير الوقت، يمكنك تفعيل دورة المقاصة فوراً بالأسفل:
              </p>
              <button
                type="button"
                onClick={triggerFastCronSimulation}
                disabled={isCronRunning}
                className="w-full mt-1.5 py-2 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 rounded-lg text-[11px] font-extrabold flex items-center justify-center gap-2 border border-indigo-100 transition-all"
              >
                {isCronRunning ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>جاري تشغيل محاكي الـ Cron...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>تفعيل دورة الـ Cron الخلفية الآن (تسريع فوري) 🚀</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Wallet Ledger / Transactions */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-50">
            <div>
              <h3 className="text-lg font-black text-slate-800 font-sans">سجل حركة المحفظة والمعاملات</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">تفاصيل العمليات المالية المودعة، المعلقة والمسحوبة</p>
            </div>
            <button 
              onClick={onRefresh}
              className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
              title="تحديث البيانات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            {walletTransactions.length === 0 ? (
              <div className="py-12 text-center text-slate-405 flex flex-col items-center justify-center space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300" />
                <span className="text-xs font-bold text-slate-400 font-sans">لا توجد عمليات مسجلة لمحفظتك حالياً.</span>
              </div>
            ) : (
              <table className="w-full text-right divide-y divide-slate-100 text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold select-none font-sans">
                    <th className="p-3 rounded-r-lg">العملية</th>
                    <th className="p-3">الوصف</th>
                    <th className="p-3">المبلغ</th>
                    <th className="p-3">الحالة</th>
                    <th className="p-3 rounded-l-lg">التاريخ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {walletTransactions.map((tx: any, idx: number) => {
                    const isPositive = tx.amount > 0;
                    return (
                      <tr key={tx.id || idx} className="hover:bg-slate-200/20 transition-all font-sans">
                        <td className="p-3 font-bold">
                          <span className={`px-2 py-1 rounded-md text-[10px] font-black ${
                            tx.type === 'deposit_pending' ? 'bg-amber-105 text-amber-800' :
                            tx.type === 'release_deposit' ? 'bg-emerald-100 text-emerald-800' :
                            tx.type === 'withdrawal' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-slate-100 text-slate-800'
                          }`}>
                            {tx.type === 'deposit_pending' ? 'معلق' :
                             tx.type === 'release_deposit' ? 'محرر ومتاح' :
                             tx.type === 'withdrawal' ? 'سحب' : tx.type}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600 leading-relaxed font-sans">{tx.description}</td>
                        <td className={`p-3 font-bold font-mono ${isPositive ? 'text-emerald-600' : 'text-slate-700'}`}>
                          {isPositive ? '+' : ''}{tx.amount.toLocaleString('ar-SA')} ر.س
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 font-bold ${
                            tx.status === 'completed' ? 'text-emerald-600' :
                            tx.status === 'pending' ? 'text-amber-500' : 'text-red-500'
                          }`}>
                            {tx.status === 'completed' ? (
                              <>
                                <CheckCircle className="w-3.5 h-3.5" />
                                <span>مكتملة</span>
                              </>
                            ) : tx.status === 'pending' ? (
                              <span>قيد المعالجة</span>
                            ) : (
                              <span>فشلت</span>
                            )}
                          </span>
                        </td>
                        <td className="p-3 text-slate-400 font-mono text-[10px]">
                          {tx.date ? new Date(tx.date).toLocaleDateString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleDateString('ar-SA')}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
