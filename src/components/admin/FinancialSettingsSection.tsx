import React, { useState } from 'react';
import { 
  ShieldCheck, Cpu, FileText, Lock, Landmark, CreditCard, 
  Eye, EyeOff, Copy, Check, Zap, ExternalLink, Key, Info, Sliders, Settings,
  ShieldAlert, Coins, RefreshCw, AlertTriangle, CheckCircle2, Building2,
  Users, ClipboardList, Database, Store, SlidersHorizontal
} from 'lucide-react';
import PaymentTokensAuditPanel from './PaymentTokensAuditPanel';
import PaymentGatewayLimitsPanel from './PaymentGatewayLimitsPanel';
import { DiagnosticsDashboard } from '../DiagnosticsDashboard';
import UnifiedInvoiceTab from '../UnifiedInvoiceTab';
import SensitiveDataApprovalsPanel from './SensitiveDataApprovalsPanel';

interface FinancialSettingsSectionProps {
  showNotification?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  initialSubTab?: 'tokens_audit' | 'gateways' | 'general_settings' | 'financial_taxes' | 'sensitive_approvals' | 'thresholds' | 'diagnostics' | 'unified_invoice';
  bookings?: any[];
  halls?: any[];
  providers?: any[];
  platformData?: any;
  [key: string]: any;
}

const SettingInput = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  description, 
  suffix, 
  prefix, 
  dir 
}: { 
  label: string, 
  type?: string, 
  value?: string | number, 
  onChange?: (e: any) => void, 
  placeholder?: string, 
  description?: string, 
  suffix?: string, 
  prefix?: string, 
  dir?: string 
}) => (
  <div className="text-right" dir="rtl">
    <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
    <div className="relative flex items-center">
       {prefix && <span className="absolute right-3.5 text-slate-400 text-xs sm:text-sm font-sans">{prefix}</span>}
       <input 
          type={type} 
          value={value ?? ''}
          onChange={onChange}
          placeholder={placeholder} 
          className={`w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none transition-all text-left ${prefix ? 'pr-10' : ''} ${suffix ? 'pl-10' : ''} text-sm`} 
          dir={dir || (type === 'number' || type === 'email' ? 'ltr' : 'auto')} 
       />
       {suffix && <span className="absolute left-3.5 text-slate-400 text-xs sm:text-sm font-sans">{suffix}</span>}
    </div>
    {description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>}
  </div>
);

export function FinancialSettingsSection(props: FinancialSettingsSectionProps) {
  const [subTab, setSubTab] = useState<
    'tokens_audit' | 'gateways' | 'general_settings' | 'financial_taxes' | 'sensitive_approvals' | 'thresholds' | 'diagnostics' | 'unified_invoice'
  >(props.initialSubTab || 'tokens_audit');

  // Financial & Taxes State
  const [financialTaxesSubTab, setFinancialTaxesSubTab] = useState<'taxes' | 'splitting'>('taxes');
  const [currency, setCurrency] = useState<string>(() => {
    return props.financialSettingsState?.currency || 'SAR';
  });
  const [platformTaxNumber, setPlatformTaxNumber] = useState<string>(() => {
    return props.financialSettingsState?.platformTaxNumber || '310123456700003';
  });
  const [vatPercentage, setVatPercentage] = useState<number>(() => {
    return props.financialSettingsState?.vatPercentage ?? 15;
  });
  const [maxConfirmationPeriod, setMaxConfirmationPeriod] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('MAX_CONFIRMATION_PERIOD')) || '48 ساعة';
  });
  const [enablePartialPayment, setEnablePartialPayment] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('ENABLE_PARTIAL_PAYMENT') === 'true' : false;
  });
  const [partialPaymentDepositPercentage, setPartialPaymentDepositPercentage] = useState<number>(() => {
    const val = typeof window !== 'undefined' ? localStorage.getItem('PARTIAL_PAYMENT_DEPOSIT_PERCENTAGE') : null;
    return val ? parseInt(val) || 20 : 20;
  });
  const [marketingCommissionPercentage, setMarketingCommissionPercentage] = useState<number>(() => {
    const val = typeof window !== 'undefined' ? localStorage.getItem('MARKETING_COMMISSION_PERCENTAGE') : null;
    return val ? parseInt(val) || 15 : 15;
  });
  const [storeCommissionEnabled, setStoreCommissionEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' ? localStorage.getItem('STORE_COMMISSION_ENABLED') === 'true' : false;
  });
  const [storeCommissionRate, setStoreCommissionRate] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('STORE_COMMISSION_RATE')) || '5';
  });
  const [activeSettlementMethod, setActiveSettlementMethod] = useState<'deposit_only' | 'split_payments' | 'weekly_clearance'>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('SETTLEMENT_METHOD') as any) || 'deposit_only';
  });
  const [settlementPendingActivation, setSettlementPendingActivation] = useState<string | null>(null);
  const [applyOnlyToNewReservations, setApplyOnlyToNewReservations] = useState<boolean>(false);
  const [pendingTransactionsCount, setPendingTransactionsCount] = useState<number>(3);
  const [generatedSettlementReport, setGeneratedSettlementReport] = useState<any>(null);

  // Local state for gateway API keys and settings
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookTestGateway, setWebhookTestGateway] = useState<string | null>(null);
  const [webhookTestLogs, setWebhookTestLogs] = useState<string[]>([]);

  const [integrationKeys, setIntegrationKeys] = useState<any>(props.integrationKeys || {
    encryptionKey: 'AES-256-SECRET-KEY-SAMA-VAULT-2026',
    moyasarSecret: '',
    moyasarPublishable: '',
    hyperpayEntity: '',
    hyperpayAccessToken: '',
    paytabsProfile: '',
    paytabsServer: '',
    geideaMerchant: '',
    geideaPublic: '',
    geideaSecret: '',
    tabbySecret: '',
    tabbyPublic: '',
    tamaraToken: '',
    tamaraNotificationToken: ''
  });

  const [enabledGateways, setEnabledGateways] = useState<Record<string, boolean>>(props.enabledGateways || {
    moyasar: true,
    hyperpay: true,
    paytabs: false,
    geidea: false,
    tabby_api: true,
    tamara_api: true
  });

  const [paymentSettings, setPaymentSettings] = useState<Record<string, boolean>>(props.paymentSettings || {
    mada: true,
    creditMax: true,
    apple: true,
    stc: true,
    google_pay: true,
    tabby: true,
    tamara: true,
    bank_transfer: true
  });

  const [financialSettingsState, setFinancialSettingsState] = useState<any>(props.financialSettingsState || {
    bankAccounts: `البنك الأهلي السعودي (SNB)\nIBAN: SA0310000001234567890101\nاسم الحساب: شركة ليلة لإدارة الفعاليات`,
    minWithdraw: 500,
    refundPeriod: 48,
    drawProcessingPeriod: 3,
    refundReconciliationModel: 'hybrid'
  });

  const [enableForceMajeureProtocol, setEnableForceMajeureProtocol] = useState<boolean>(true);
  const [forceMajeureWindowDays, setForceMajeureWindowDays] = useState<number>(7);

  const notify = props.showNotification || (() => {});

  const handleToggleGateway = (key: string) => {
    setEnabledGateways((prev: any) => {
      const updated = { ...prev, [key]: !prev[key] };
      notify('info', `تم ${updated[key] ? 'تفعيل' : 'تعطيل'} بوابة ${key} بنجاح`);
      return updated;
    });
  };

  const handleTogglePaymentSetting = (key: string) => {
    setPaymentSettings((prev: any) => {
      const updated = { ...prev, [key]: !prev[key] };
      notify('info', `تم ${updated[key] ? 'تفعيل' : 'تعطيل'} خيار الدفع بنجاح`);
      return updated;
    });
  };

  const handleCheckout = (gatewayKey: string) => {
    notify('info', `جاري فتح محاكاة الربط المباشر لبوابة: ${gatewayKey}`);
  };

  const handleTriggerBackgroundUtility = () => {
    notify('info', 'جاري تشغيل محاكاة بروتوكول تصفية الحسابات وتوليد التقرير الختامي...');
    setTimeout(() => {
      setGeneratedSettlementReport({
        timestamp: new Date().toISOString(),
        status: 'مكتمل ومعتمد بنجاح',
        totalOutstandingAmount: 48500,
        platformCommissionCleared: 7275,
        clearedToProviders: 41225,
        transactionsCleared: [
          { id: 'TX-101', customer: 'عبدالله السعيد', provider: 'مؤسسة أضواء الرياض', hall: 'قاعة الأسطورة الكبرى', total: 25000 },
          { id: 'TX-102', customer: 'نورة الشمري', provider: 'شركة ليالي الشرق', hall: 'قاعة القصر الملكي', total: 18500 },
          { id: 'TX-103', customer: 'فيصل المطيري', provider: 'مؤسسة الإضاءة الحديثة', hall: 'شاليهات الريم', total: 5000 }
        ]
      });
      setPendingTransactionsCount(0);
      notify('success', 'تمت تصفية وتوليد تقرير التسوية المالية بنجاح!');
    }, 1000);
  };

  const activePendingBookings = (props.bookings || []).filter(
    (b: any) => b.paymentStatus === 'جزئي' || b.paymentStatus === 'معلق' || b.status === 'قيد الانتظار'
  ).slice(0, 5);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <Lock className="w-3 h-3 text-amber-400" /> قسم الإدارة المالي السيادي (Admin Financial Center)
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-bold">
                محمية ومشفرة بمعايير SAMA & PCI-DSS
              </span>
            </div>
            <h2 className="text-2xl font-black text-white flex items-center gap-2">
              <Landmark className="w-7 h-7 text-amber-400" />
              <span>الإعدادات والرقابة المالية (Financial Settings & Compliance)</span>
            </h2>
            <p className="text-xs text-slate-300 mt-2 leading-relaxed max-w-3xl">
              قسم شامل وموحد للإدارة العليا للرقابة على توكنات بطاقات الدفع، بوابات الدفع الإلكتروني، الإعدادات المالية والضريبية، اعتماد تعديلات البيانات الحساسة للمستخدمين والأرشيف، سقوف SAMA، وإصدار الفواتير الضريبية الموحدة.
            </p>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="flex flex-wrap bg-slate-950/80 p-1.5 rounded-xl gap-2 mt-6 border border-slate-800/80">
          <button
            onClick={() => setSubTab('financial_taxes')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'financial_taxes'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Coins className="w-4 h-4 text-slate-950" />
            <span>المالية والضريبية</span>
          </button>

          <button
            onClick={() => setSubTab('sensitive_approvals')}
            className={`flex-1 min-w-[170px] py-2.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'sensitive_approvals'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            <span>اعتماد التعديلات الحساسة والأرشيف</span>
          </button>

          <button
            onClick={() => setSubTab('tokens_audit')}
            className={`flex-1 min-w-[150px] py-2.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'tokens_audit'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>تدقيق توكنات البطاقات والتسويات</span>
          </button>

          <button
            onClick={() => setSubTab('gateways')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'gateways'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CreditCard className="w-4 h-4" />
            <span>بوابات الدفع الإلكتروني</span>
          </button>

          <button
            onClick={() => setSubTab('general_settings')}
            className={`flex-1 min-w-[150px] py-2.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'general_settings'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>إعدادات الدفع العامة والتسويات</span>
          </button>

          <button
            onClick={() => setSubTab('thresholds')}
            className={`flex-1 min-w-[130px] py-2.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'thresholds'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>سقوف البوابات (SAMA)</span>
          </button>

          <button
            onClick={() => setSubTab('unified_invoice')}
            className={`flex-1 min-w-[140px] py-2.5 px-3 text-xs font-black rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              subTab === 'unified_invoice'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>الفاتورة الضريبية الموحدة</span>
          </button>
        </div>
      </div>

      {/* Active SubTab Render */}
      <div className="mt-4">
        {/* 1. المالية والضريبية */}
        {subTab === 'financial_taxes' && (
          <div className="space-y-8 animate-in fade-in duration-300 text-right" dir="rtl">
            {/* تبويبات فرعية للقسم المالي والضريبي */}
            <div className="flex bg-slate-100 p-1 rounded-2xl max-w-lg gap-1 border border-slate-200">
              <button
                onClick={() => setFinancialTaxesSubTab('taxes')}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center ${
                  financialTaxesSubTab === 'taxes' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                الضرائب والرسوم العامة
              </button>
              <button
                onClick={() => setFinancialTaxesSubTab('splitting')}
                className={`flex-1 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${
                  financialTaxesSubTab === 'splitting' ? 'bg-amber-500 text-slate-900 shadow-sm font-extrabold' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                }`}
              >
                <span>التسوية وتقسيم المدفوعات</span>
                <span className="bg-slate-900/10 text-[9px] px-1 py-0.5 rounded-md font-extrabold uppercase animate-pulse">مُحدث</span>
              </button>
            </div>

            {financialTaxesSubTab === 'taxes' && (
              <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">الإعدادات المالية والضريبية السيادية</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 text-right">العملة الأساسية للمنصة</label>
                      <select 
                        value={currency}
                        onChange={e => {
                          setCurrency(e.target.value);
                          notify('info', `تم تغيير العملة الأساسية إلى ${e.target.value}`);
                        }}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-right"
                      >
                        <option value="SAR">ريال سعودي (SAR)</option>
                        <option value="AED">درهم إماراتي (AED)</option>
                        <option value="USD">دولار أمريكي (USD)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 text-right">الرقم الضريبي للمنصة (VAT ID)</label>
                      <input 
                        type="text" 
                        value={platformTaxNumber}
                        onChange={e => setPlatformTaxNumber(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono text-left" 
                        dir="ltr" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 text-right">نسبة ضريبة القيمة المضافة (VAT) %</label>
                      <input 
                        type="number" 
                        value={vatPercentage}
                        onChange={e => setVatPercentage(parseFloat(e.target.value) || 0)}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left whitespace-nowrap" 
                        dir="ltr" 
                      />
                    </div>
                    <div className="flex flex-col justify-center mt-2 text-right">
                       <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl space-y-1">
                        <div className="flex items-center gap-2 justify-end">
                           <span className="block text-sm font-bold text-amber-950">الأسعار المسجلة شاملة الضريبة نهائياً (شامل 15% VAT)</span>
                           <input 
                             type="checkbox" 
                             checked={true}
                             disabled={true}
                             className="w-4 h-4 text-amber-600 rounded border-amber-300 cursor-not-allowed" 
                           />
                        </div>
                        <p className="text-[11px] text-amber-800 leading-relaxed font-sans">
                          قاعدة مالية سيادية: الأسعار المعروضة شاملة لضريبة القيمة المضافة. يُحظر مضاعفة الضريبة أو إضافتها مرة أخرى عند بوابة الدفع. المنصة مسؤولة فقط عن ضريبتها وزكاتها على العمولة المقتطعة، بينما يتحمل المزود التزاماته الضريبية والتسجيل بمفرده.
                        </p>
                       </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 text-right">أقصى مدة لتأكيد الحجز</label>
                      <select 
                        value={maxConfirmationPeriod}
                        onChange={(e) => {
                          setMaxConfirmationPeriod(e.target.value);
                          localStorage.setItem('MAX_CONFIRMATION_PERIOD', e.target.value);
                          notify('info', `تم تعديل أقصى مدة لتأكيد الحجز إلى ${e.target.value}`);
                        }}
                        className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-right"
                      >
                        <option value="24 ساعة">24 ساعة</option>
                        <option value="48 ساعة">48 ساعة</option>
                        <option value="72 ساعة">72 ساعة</option>
                        <option value="5 أيام">5 أيام</option>
                        <option value="7 أيام">7 أيام</option>
                        <option value="10 أيام">10 أيام</option>
                        <option value="15 يوم">15 يوم</option>
                        <option value="مفتوح">مفتوح (لا توجد مدة محددة)</option>
                      </select>
                      <p className="text-[10px] text-slate-500 mt-1">تؤدي هذه المدة إلى إلغاء الحجز آلياً إذا لم يتم تأكيده من المزود.</p>
                    </div>

                     <div className="flex flex-col justify-center text-right">
                        <label className={`flex items-start gap-3 p-3 bg-white border rounded-xl shadow-sm transition-all justify-end ${activeSettlementMethod === 'deposit_only' ? 'border-amber-200 cursor-pointer' : 'border-slate-200 bg-slate-50/50 cursor-not-allowed opacity-85'}`}>
                         <div className="text-right">
                            <span className={`block text-sm font-bold ${activeSettlementMethod === 'deposit_only' ? 'text-amber-900' : 'text-slate-500'}`}>تفعيل نظام الدفع الجزئي (تجزئة المبالغ)</span>
                            {activeSettlementMethod === 'deposit_only' ? (
                              <span className="block text-xs text-amber-600 mt-1">عند التفعيل، يمكن للعميل دفع (عربون مقدم) والمتبقي لاحقاً حسب سياسة المزود.</span>
                            ) : (
                              <span className="block text-xs text-slate-500 mt-1 leading-relaxed">
                                ⚠️ مقفل تلقائياً؛ لأن طريقة التسوية الحالية هي <strong>{activeSettlementMethod === 'split_payments' ? 'التقسيم الفوري (Split)' : 'المقاصة الأسبوعية'}</strong>، والتي تشترط تحصيل وسداد الفاتورة بنسبة <strong>100%</strong> مقدماً.
                              </span>
                            )}
                         </div>
                         <input 
                           type="checkbox" 
                           checked={enablePartialPayment} 
                           disabled={activeSettlementMethod !== 'deposit_only'}
                           onChange={(e) => {
                             setEnablePartialPayment(e.target.checked);
                             localStorage.setItem('ENABLE_PARTIAL_PAYMENT', e.target.checked.toString());
                             notify('info', `تم ${e.target.checked ? 'تفعيل' : 'تعطيل'} نظام الدفع الجزئي`);
                           }}
                           className={`w-5 h-5 rounded border-slate-300 ${activeSettlementMethod === 'deposit_only' ? 'text-amber-500 focus:ring-amber-500' : 'text-slate-450 focus:ring-slate-300 bg-slate-100'} mt-0.5`} 
                         />
                       </label>

                       {enablePartialPayment && activeSettlementMethod === 'deposit_only' && (
                         <div className="mt-4 p-4 bg-amber-50/30 border border-amber-100 rounded-xl space-y-3">
                           <label className="block text-sm font-semibold text-slate-700">نسبة العربون الجزئي المطلوب تحصيله مقدماً (%)</label>
                           <div className="relative">
                             <input 
                               type="number" 
                               value={partialPaymentDepositPercentage} 
                               onChange={(e) => {
                                 const val = parseInt(e.target.value) || 0;
                                 setPartialPaymentDepositPercentage(val);
                                 localStorage.setItem('PARTIAL_PAYMENT_DEPOSIT_PERCENTAGE', val.toString());
                               }}
                               onBlur={() => {
                                 if (partialPaymentDepositPercentage < marketingCommissionPercentage) {
                                   setPartialPaymentDepositPercentage(marketingCommissionPercentage);
                                   localStorage.setItem('PARTIAL_PAYMENT_DEPOSIT_PERCENTAGE', marketingCommissionPercentage.toString());
                                 }
                               }}
                               className={`w-full p-3 pl-8 rounded-xl border ${partialPaymentDepositPercentage < marketingCommissionPercentage ? 'border-red-300 focus:border-red-500' : 'border-slate-200 focus:border-amber-500'} outline-none font-mono text-left bg-white`} 
                               dir="ltr" 
                               min="0"
                               max="100"
                             />
                             <span className="absolute left-3 top-3.5 text-slate-400 font-mono">%</span>
                           </div>
                           <p className="text-[10px] text-slate-500">يجب ألا تقل هذه النسبة عن نسبة عمولة المنصة الحالية لضمان حماية تدفقات الأرباح والعمولات الخاصة بالمنصة.</p>
                           
                           {partialPaymentDepositPercentage < marketingCommissionPercentage && (
                             <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-xs text-red-600 flex items-start gap-2">
                               <span>⚠️</span>
                               <p className="leading-relaxed font-semibold">تنبيه حماية الأرباح: لا يمكن تعيين نسبة عربون أقل من نسبة عمولة المنصة الحالية البالغة {marketingCommissionPercentage}% لضمان تغطية العمولات وتجنب العجز المالي المحاسبي.</p>
                             </div>
                           )}
                         </div>
                       )}
                     </div>
                  </div>
                </div>

                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">التسويق وعمولات الوكالات</h3>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                     <div>
                       <label className="block text-sm font-medium text-slate-700 mb-1">نسبة المنصة المقتطعة من أتعاب التسويق (%)</label>
                       <input 
                         type="number" 
                         value={marketingCommissionPercentage} 
                         onChange={(e) => {
                           const val = parseInt(e.target.value) || 0;
                           setMarketingCommissionPercentage(val);
                           localStorage.setItem('MARKETING_COMMISSION_PERCENTAGE', val.toString());
                         }}
                         className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono text-left bg-white" 
                         dir="ltr" 
                       />
                       <p className="text-xs text-slate-500 mt-2">يتم خصم هذه النسبة كعمولة للمنصة من (أتعاب وكالة التسويق) المدفوعة من المزود، ولا يتم المساس بميزانية الإعلانات.</p>
                     </div>
                   </div>
                </div>

                {/* حوكمة وعمولة متجر المنتجات والمستلزمات المصغر للقاعات */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2 mb-4">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Store className="w-5 h-5 text-amber-500" />
                      <span>حوكمة وعمولة متجر مستلزمات القاعات (Mini Store Commission)</span>
                    </h3>
                    <span className="text-xs font-black px-3 py-1 bg-amber-100 text-amber-900 border border-amber-200 rounded-full self-start sm:self-auto">
                      {storeCommissionEnabled ? `العمولة مفعلة: ${storeCommissionRate}%` : 'معفاة حالياً من العمولة (0%)'}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 space-y-5">
                    <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl text-amber-950 text-xs space-y-2">
                      <div className="font-extrabold flex items-center gap-1.5 text-amber-900">
                        <ShieldCheck className="w-4 h-4 text-amber-600" />
                        <span>السياسة التجارية والرقابة السيادية:</span>
                      </div>
                      <p className="leading-relaxed text-slate-600 text-[11px]">
                        افتراضياً، تعفى مبيعات متجر المنتجات والمستلزمات المصغر للقاعات من عمولة المنصة (<strong>عمولة 0%</strong>) كحافز تشغيلي وتجاري للشركاء، مع شمولية ضريبة القيمة المضافة 15% دائماً ضمن الأسعار المعروضة للمستهلك.
                        يمكن للإدارة العليا تفعيل نسبة اقتطاع مستقبلية بمرونة هنا وتحديد النسبة المستهدفة لكافة مبيعات مستلزمات القاعات.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-5 rounded-2xl border border-slate-200 items-start">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-extrabold text-slate-800 text-sm block">تفعيل اقتطاع عمولة المنصة على مبيعات المتجر</span>
                            <span className="text-[11px] text-slate-400">تطبيق نسبة اقتطاع عند شراء مستلزمات المكان عبر المنصة</span>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={storeCommissionEnabled}
                              onChange={(e) => {
                                const enabled = e.target.checked;
                                setStoreCommissionEnabled(enabled);
                                localStorage.setItem('STORE_COMMISSION_ENABLED', enabled ? 'true' : 'false');
                                notify('info', enabled 
                                  ? `تم تفعيل عمولة متجر المستلزمات بنسبة ${storeCommissionRate}%` 
                                  : 'تم إعفاء متجر المستلزمات من العمولة (0%)');
                              }}
                              className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                          </label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="block text-sm font-bold text-slate-750">نسبة العمولة المقتطعة (%)</label>
                        <div className="relative">
                          <input
                            type="number"
                            min="0"
                            max="50"
                            step="0.5"
                            disabled={!storeCommissionEnabled}
                            value={storeCommissionRate}
                            onChange={(e) => {
                              const val = e.target.value;
                              setStoreCommissionRate(val);
                              localStorage.setItem('STORE_COMMISSION_RATE', val || '0');
                            }}
                            className={`w-full p-3 rounded-xl border font-mono text-left outline-none ${
                              storeCommissionEnabled 
                                ? 'bg-white border-slate-200 focus:border-amber-500 text-slate-900 font-bold' 
                                : 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                            dir="ltr"
                            placeholder="5"
                          />
                          <span className="absolute left-3 top-3.5 text-slate-400 font-mono font-bold">%</span>
                        </div>
                        <p className="text-[10px] text-slate-500 leading-relaxed">
                          * يتم اقتطاع هذه النسبة من صافي مبيعات المتجر لصالح المنصة وتحويل المتبقي لحساب المزود عند تفعيل الخيار.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {financialTaxesSubTab === 'splitting' && (
              <div className="space-y-8 animate-in fade-in duration-300">
                {/* تنبيه مالي للمعاملات المعلقة */}
                {pendingTransactionsCount > 0 && (
                  <div className="bg-red-50 border border-red-200 text-red-900 rounded-2xl p-5 flex flex-col md:flex-row-reverse md:items-center justify-between gap-4 font-sans text-right">
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <span className="text-2xl mt-0.5 animate-bounce">⚠️</span>
                      <div>
                        <p className="font-bold text-sm text-red-800 sm:text-base">تنبيه مالي إداري: يوجد معاملات وقيود معلقة للشركاء!</p>
                        <p className="text-xs text-red-750 mt-1 sm:text-sm leading-relaxed">
                          رصد نظام المطابقة والتدقيق بالمنصة عدد <strong className="text-sm font-mono underline">{pendingTransactionsCount}</strong> حجوزات نشطة لا تزال بمرحلة الدفع الجزئي أو بانتظار التأشير المالي النهائي.
                          يُنصح قانونياً بتشغيل بروتوكول تصفية الحسابات (تسوية القيود) وتوليد التقرير الختامي قبل ترحيل سياسة الدفع.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleTriggerBackgroundUtility}
                      className="bg-red-600 hover:bg-red-700 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0 self-start md:self-center cursor-pointer"
                    >
                      <span>تسوية وتصفية القيود الحالية ⚙️</span>
                    </button>
                  </div>
                )}

                {/* مستند تقرير التسوية النهائي المولد */}
                {generatedSettlementReport && (
                  <div className="bg-emerald-50/70 border border-emerald-200 text-slate-800 rounded-3xl p-6 font-sans text-right animate-in fade-in duration-300 shadow-sm" dir="rtl">
                    <div className="flex flex-col sm:flex-row-reverse sm:items-center justify-between border-b border-emerald-150 pb-3 mb-4 gap-2">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className="text-xl">📋</span>
                        <div>
                          <h4 className="font-bold text-sm sm:text-base text-emerald-950">تقرير التسوية المالية النهائي وتصفية القيود</h4>
                          <span className="text-[10px] text-slate-500 block mt-0.5">تم التوليد في: {new Date(generatedSettlementReport.timestamp).toLocaleString('ar-SA')}</span>
                        </div>
                      </div>
                      <span className="text-[11px] bg-emerald-200 text-emerald-800 px-3 py-1 rounded-xl font-bold self-start">
                        {generatedSettlementReport.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5 text-xs">
                      <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
                        <span className="text-slate-500 block">إجمالي أموال المعاملات المصفاة:</span>
                        <strong className="text-base sm:text-lg text-slate-800 mt-1 block font-mono">{generatedSettlementReport.totalOutstandingAmount?.toLocaleString()} ريال</strong>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm font-sans">
                        <span className="text-slate-500 block">عمولة المنصة المقتطعة (15%):</span>
                        <strong className="text-base sm:text-lg text-amber-600 mt-1 block font-mono">{generatedSettlementReport.platformCommissionCleared?.toLocaleString()} ريال</strong>
                      </div>
                      <div className="bg-white p-3 rounded-2xl border border-emerald-100 shadow-sm">
                        <span className="text-slate-500 block">الصافي المودع بالشركاء (IBAN):</span>
                        <strong className="text-base sm:text-lg text-emerald-700 mt-1 block font-mono">{generatedSettlementReport.clearedToProviders?.toLocaleString()} ريال</strong>
                      </div>
                    </div>

                    <span className="block text-xs font-bold text-slate-700 mb-2">📊 تفاصيل تصفية قيود العقود المتأثرة:</span>
                    <div className="bg-white border text-xs text-slate-700 rounded-2xl overflow-hidden shadow-sm max-h-[160px] overflow-y-auto">
                      <div className="bg-slate-50 px-3 py-2 text-slate-500 font-bold border-b grid grid-cols-3">
                        <span>المستفيد الرئيسي</span>
                        <span>القاعة / الشاليه</span>
                        <span>الرصيد المصفى والمسوى</span>
                      </div>
                      {generatedSettlementReport.transactionsCleared?.map((tx: any) => (
                        <div key={tx.id} className="px-3 py-2.5 border-b grid grid-cols-3 last:border-0 hover:bg-slate-50/50">
                          <div>
                            <span className="font-bold text-slate-800 block">{tx.customer}</span>
                            <span className="text-[10px] text-slate-400 block">المزود: {tx.provider}</span>
                          </div>
                          <span className="self-center font-medium text-slate-600">{tx.hall}</span>
                          <span className="font-bold text-emerald-700 self-center font-mono">{tx.total?.toLocaleString()} ريال</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-2 justify-between items-center text-xs">
                      <span className="text-slate-500 text-[11px]">✓ تم تصفير القيود المعلقة بالشركاء وتحديث كبينة الدفع بنجاح.</span>
                      <button
                        onClick={() => {
                          setGeneratedSettlementReport(null);
                          setPendingTransactionsCount(3);
                        }}
                        className="text-[11px] text-slate-500 hover:text-slate-700 font-bold underline cursor-pointer"
                      >
                        إعادة تفعيل ومحاكاة القيود المعلقة مجدداً
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 text-right space-y-3" dir="rtl">
                  <h4 className="font-bold text-slate-800 text-base">استراتيجيات التسوية وتدفقات السيولة 🧭</h4>
                  <p className="text-xs text-slate-500 leading-relaxed font-sans">
                    تحتاج المنصة للتحكم في كيفية إدارة الأموال المدفوعة من العملاء، وتوزيع الحصص والعمولات بين المنصة والشركاء بشكل رقمي موثوق. يقدم النظام ثلاثة مستويات تختار بينها لتحديد سياسة التدفق المالي:
                  </p>
                </div>

                {/* بطاقات تحديد السياسة المالية النشطة */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right" dir="rtl">
                  <div 
                    onClick={() => setSettlementPendingActivation('deposit_only')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${activeSettlementMethod === 'deposit_only' ? 'border-amber-500 bg-amber-50/20' : 'border-slate-200 hover:border-slate-350 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-row-reverse">
                      <span className="text-2xl">💰</span>
                      {activeSettlementMethod === 'deposit_only' && <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black">نشط ومفعل</span>}
                    </div>
                    <h5 className="font-extrabold text-slate-800 text-sm">العربون المقسم والتحصيل الإلكتروني اللاحق</h5>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">تحصيل عربون الحجز المقدم لتأمين وحجز القاعة والخدمات، مع تحصيل المبلغ كسيولة لاحقة يدوياً أو مركزياً.</p>
                  </div>

                  <div 
                    onClick={() => setSettlementPendingActivation('split_payments')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${activeSettlementMethod === 'split_payments' ? 'border-amber-500 bg-amber-50/20' : 'border-slate-200 hover:border-slate-350 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-row-reverse">
                      <span className="text-2xl">⚡</span>
                      {activeSettlementMethod === 'split_payments' && <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black">نشط ومفعل</span>}
                    </div>
                    <h5 className="font-extrabold text-slate-800 text-sm">التسوية والتقسيم الفوري (Split Payments)</h5>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">تكامل مباشر عبر بوابات الدفع لصب مبالغ الشركاء وعمولات المنصة تلقائياً فورياً مع كل عملية سداد بنجاح.</p>
                  </div>

                  <div 
                    onClick={() => setSettlementPendingActivation('weekly_clearance')}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer relative overflow-hidden ${activeSettlementMethod === 'weekly_clearance' ? 'border-amber-500 bg-amber-50/20' : 'border-slate-200 hover:border-slate-350 bg-white'}`}
                  >
                    <div className="flex items-center justify-between mb-3 flex-row-reverse">
                      <span className="text-2xl">📅</span>
                      {activeSettlementMethod === 'weekly_clearance' && <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded text-[9px] font-black">نشط ومفعل</span>}
                    </div>
                    <h5 className="font-extrabold text-slate-800 text-sm">التحصيل المركزي والمقاصة الأسبوعية</h5>
                    <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">تحصيل وحجز كامل أموال العمليات بنسبة 100% في محفظة ليلة، مع بث مقاصة أسبوعية مجمعة للشركاء بشكل دوري.</p>
                  </div>
                </div>

                {/* نافذة التأكيد المنبثقة لتغيير طريقة التسوية */}
                {settlementPendingActivation !== null && (
                  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200 text-right font-sans" dir="rtl">
                      <div className="flex items-center gap-3 mb-4 border-b pb-3 border-slate-100 justify-end">
                        <div className="text-right">
                          <h3 className="text-base sm:text-lg font-bold text-slate-900">تغيير بروتوكول وطريقة التسوية المالية</h3>
                          <p className="text-xs text-slate-500 mt-0.5">يرجى تأكيد رغبتك في تعديل سياسة سير الأموال بالمنصة</p>
                        </div>
                        <span className="p-3 bg-amber-100 text-amber-700 rounded-2xl text-xl">⚠️</span>
                      </div>

                      <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl border border-slate-150 mb-4">
                        {settlementPendingActivation === 'deposit_only' && (
                          <p>
                            أنت بصدد الانتقال إلى <strong>نموذج العربون المقسم والتحصيل الإلكتروني اللاحق</strong>. <br />
                            في هذا النظام القانوني، ستقوم بوابة الدفع بتحصيل (العربون) لتأمين الحجز على المنصة بشرط ألا يقل عن 20% وألا يقل عن نسبة عمولة المنصة المعتمدة. كما أن تحصيل وترحيل باقي قيمة الفاتورة المترصدة ملتزم بـ <strong>التحصيل المركزي الآمن عبر المنصة</strong> لحماية حقوق كافة الأطراف.
                          </p>
                        )}
                        {settlementPendingActivation === 'split_payments' && (
                          <p>
                            أنت بصدد الانتقال إلى <strong>التقسيم الفوري التلقائي (Split Payments)</strong>. <br />
                            هذا نموذج يتطلب إدخال مفاتيح الإنتاج السرية والربط عبر بوابة الدفع المعتمدة (HyperPay أو Stripe Connect). يتم تقسيم وصب عمولة المنصة وأرباح الشركاء آلياً مع كل عملية بنجاح.
                          </p>
                        )}
                        {settlementPendingActivation === 'weekly_clearance' && (
                          <p>
                            أنت بصدد الانتقال إلى <strong>التحصيل المركزي والمقاصة الأسبوعية</strong>. <br />
                            في هذا النموذج، يدفع العميل 100% من قيمة الخدمة فورياً على المنصة، ثم تجميد الأموال كأرصدة معلقة لضمان حقوق كافة الأطراف وإجراء مقاصة بنكية مجمعة للشركاء أسبوعياً.
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                        <button
                          type="button"
                          onClick={() => setSettlementPendingActivation(null)}
                          className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700 bg-slate-100 rounded-xl"
                        >
                          إلغاء الإجراء
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveSettlementMethod(settlementPendingActivation as any);
                            localStorage.setItem('SETTLEMENT_METHOD', settlementPendingActivation);
                            handleTriggerBackgroundUtility();
                            notify('success', 'تم تبديل سياسة التسوية بنجاح وتوليد تقرير تصفية الحسابات آلياً.');
                            setSettlementPendingActivation(null);
                          }}
                          className="px-4 py-2 text-xs font-bold text-slate-900 bg-amber-500 hover:bg-amber-600 rounded-xl text-center"
                        >
                          تأكيد وحفظ السياسة الجديدة
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 2. اعتماد التعديلات الحساسة والأرشيف */}
        {subTab === 'sensitive_approvals' && (
          <SensitiveDataApprovalsPanel showNotification={notify} />
        )}

        {/* 3. تدقيق توكنات البطاقات والتسويات */}
        {subTab === 'tokens_audit' && (
          <PaymentTokensAuditPanel showNotification={notify} />
        )}

        {/* 4. سقوف البوابات SAMA */}
        {subTab === 'thresholds' && (
          <PaymentGatewayLimitsPanel showNotification={notify} />
        )}

        {/* 5. إعدادات الدفع العامة والتسويات */}
        {subTab === 'general_settings' && (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-8 text-right font-sans" dir="rtl">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-right">طرق الدفع المتاحة للعملاء</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8 text-right">
                 {[
                    { key: 'mada', name: 'مدى (Mada)' },
                    { key: 'creditMax', name: 'فيزا/ماستركارد (Visa/MC)' },
                    { key: 'apple', name: 'Apple Pay' },
                    { key: 'stc', name: 'STC Pay' },
                    { key: 'google_pay', name: 'Google Pay' },
                    { key: 'tabby', name: 'تابي (Tabby)' },
                    { key: 'tamara', name: 'تمارا (Tamara)' },
                    { key: 'bank_transfer', name: 'تحويل بنكي' }
                 ].map((gateway, i) => (
                    <div key={i} className={`border p-4 rounded-xl flex items-center justify-between transition-colors ${paymentSettings[gateway.key] ? 'border-amber-200 bg-amber-50/30' : 'border-slate-200 bg-white hover:border-amber-300'}`}>
                       <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" checked={paymentSettings[gateway.key] || false} onChange={() => handleTogglePaymentSetting(gateway.key)} className="sr-only peer" />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                       </label>
                       <span className="font-bold text-slate-700">{gateway.name}</span>
                    </div>
                 ))}
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-right">التحويل البنكي (للتحصيل اليدوي)</h3>
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl mb-8 space-y-4 text-right">
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">الحسابات البنكية للمؤسسة (تظهر كخيارات عند الدفع بطريقة التحويل)</label>
                    <textarea 
                       value={financialSettingsState.bankAccounts} 
                       onChange={e => setFinancialSettingsState((prev: any) => ({...prev, bankAccounts: e.target.value}))}
                       className="w-full p-4 rounded-xl border border-slate-200 focus:border-amber-500 outline-none min-h-[120px] font-mono text-left whitespace-pre-wrap bg-white" 
                       dir="ltr"
                    ></textarea>
                 </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-right">التسويات المالية للمزودين</h3>
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-4 mb-8 text-right">
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SettingInput label="الحد الأدنى للسحب (للمزودين)" 
                       type="number" 
                       value={financialSettingsState.minWithdraw} 
                       onChange={e => setFinancialSettingsState((prev: any) => ({...prev, minWithdraw: parseFloat(e.target.value) || 0}))}
                       suffix="ريال" />
                    <SettingInput label="مهلة الاسترداد" 
                       type="number" 
                       value={financialSettingsState.refundPeriod} 
                       onChange={e => setFinancialSettingsState((prev: any) => ({...prev, refundPeriod: parseInt(e.target.value) || 0}))}
                       suffix="ساعة" />
                    <SettingInput label="مدة معالجة السحب" 
                       type="number" 
                       value={financialSettingsState.drawProcessingPeriod} 
                       onChange={e => setFinancialSettingsState((prev: any) => ({...prev, drawProcessingPeriod: parseInt(e.target.value) || 0}))}
                       suffix="أيام عمل" />
                 </div>
              </div>

              <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 text-right">إعدادات الاسترداد المالي وإلغاء الحجوزات</h3>
              <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl space-y-6 text-right">
                  <div className="mb-2">
                    <label className="block text-sm font-bold text-slate-700 mb-3 block text-right">نموذج تسوية الاسترداد الملغي مع مهلة القاعات المحددة (Reconciliation Target Model)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFinancialSettingsState((prev: any) => ({ ...prev, refundReconciliationModel: 'hybrid' }))}
                        className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 ${financialSettingsState.refundReconciliationModel === 'hybrid' ? 'border-amber-500 bg-amber-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                      >
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 text-sm">🔄</span>
                          <span className="font-bold text-slate-800 text-sm">النموذج الهجين (Hybrid Model) - افتراضي</span>
                        </div>
                        <span className="text-xs text-slate-500 leading-relaxed">تكون مهلة القاعة الخاصة هي المقياس الحاسم لاسترداد الـ (100٪)، وتتدرج سياسة المنصة بنظام التخفيض التعاطفي ورصيد الجدولة (75٪ / 50٪ / 0٪) تدريجياً أسفلها، مع ترجيح كفة العميل وفارق التوقيت.</span>
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setFinancialSettingsState((prev: any) => ({ ...prev, refundReconciliationModel: 'binary' }))}
                        className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 ${financialSettingsState.refundReconciliationModel === 'binary' ? 'border-amber-500 bg-amber-50/20 shadow-xs' : 'border-slate-200 hover:border-slate-300 bg-white'}`}
                      >
                        <div className="flex items-center gap-2 flex-row-reverse">
                          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-650 text-sm">⚖️</span>
                          <span className="font-bold text-slate-800 text-sm">النموذج الثنائي القائم (Binary Model)</span>
                        </div>
                        <span className="text-xs text-slate-500 leading-relaxed">تُمنح الحماية القاطعة: استرداد كامل بنسبة (100٪) كاش قبل انقضاء المهلة المحددة للقاعة، ولا استرجاع للعميل بعد تجاوز المهلة (0٪)، ويطبق المتدرج للمنشآت دون مهلة خاصة.</span>
                      </button>
                    </div>
                  </div>

                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">سياسة الاسترداد وإلغاء الحجوزات (تطبق آلياً)</label>
                    <textarea defaultValue="- يتم استرداد كامل المبلغ في حال الإلغاء قبل 14 يوم من الموعد أو أكثر.
- يتم خصم 50% كرسوم إدارية في حال الإلغاء قبل 7 أيام إلى 13 يوم.
- لا يوجد استرداد للمبالغ في حال الإلغاء قبل الموعد بـ 3 أيام أو أقل." className="w-full p-4 rounded-xl border border-slate-200 focus:border-amber-500 outline-none min-h-[145px] text-right bg-white" dir="rtl"></textarea>
                 </div>

                 {/* Force Majeure Protocol Configuration Controls */}
                 <div className="border-t border-slate-200 pt-6 mt-6 space-y-4 text-right">
                    <div className="flex items-center justify-between flex-row-reverse">
                      <div className="text-right">
                        <h4 className="font-bold text-slate-800 text-sm">بروتوكول الظروف القاهرة (Force Majeure Protocol)</h4>
                        <p className="text-xs text-slate-500">تفعيل أو تعطيل تقديم طلبات الظروف القاهرة ورفع المستندات للحالات الطارئة.</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setEnableForceMajeureProtocol(!enableForceMajeureProtocol);
                        }}
                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          enableForceMajeureProtocol ? 'bg-amber-500' : 'bg-slate-200'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                            enableForceMajeureProtocol ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {enableForceMajeureProtocol && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 bg-amber-50/20 p-4 rounded-xl border border-amber-500/20">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-2">إظهار زر تقديم الطلب للعميل (عدد أيام قبل المناسبة)</label>
                          <div className="relative rounded-lg shadow-xs flex items-center">
                            <input
                              type="number"
                              value={forceMajeureWindowDays}
                              onChange={e => {
                                setForceMajeureWindowDays(parseInt(e.target.value) || 0);
                              }}
                              className="w-full text-left pl-3 pr-24 py-2 rounded-lg border border-slate-200 outline-none focus:border-amber-500 text-sm bg-white"
                              min="1"
                            />
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <span className="text-slate-500 text-xs text-right">أيام قبل الحفلة</span>
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">يظهر زر تقديم طلب الإلغاء الطارئ للعملاء فقط ضمن هذه الفترة المحددة قبل موعد المناسبة بحد أقصى.</p>
                        </div>
                      </div>
                    )}
                 </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. بوابات الدفع الإلكتروني */}
        {subTab === 'gateways' && (
          <div className="space-y-6 text-right font-sans" dir="rtl">
            {/* Server-Side Encryption Key Section */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 border border-slate-800 p-6 rounded-2xl shadow-lg text-white">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
                    <Lock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white">مفتاح التشفير الأساسي (ENCRYPTION_KEY)</h3>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-extrabold px-2.5 py-0.5 rounded-full">
                        نشط دائمًا على الخادم 🛡️
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                      يتولى هذا المفتاح تشفير البيانات الحساسة على مستوى الخادم بصورة دائمة كالسجلات والهويات وتوكنات الدفع المشفرة بغض النظر عن حالة تفعيل أي بوابة فردية.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                <div className="md:col-span-3 text-xs font-bold text-slate-300">
                  قيمة مفتاح التشفير:
                </div>
                <div className="md:col-span-9 relative">
                  <input
                    type={showEncryptionKey ? "text" : "password"}
                    value={integrationKeys.encryptionKey || ''}
                    onChange={e => setIntegrationKeys((prev: any) => ({...prev, encryptionKey: e.target.value}))}
                    placeholder="أدخل مفتاح التشفير الأساسي (ENCRYPTION_KEY)..."
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700/80 rounded-xl text-amber-300 font-mono text-sm text-left focus:border-amber-500 outline-none"
                    dir="ltr"
                  />
                  <button
                    type="button"
                    onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                  >
                    {showEncryptionKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Unified Webhook Card */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-6 shadow-sm space-y-5 text-right">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 font-bold text-lg">⚡</span>
                    <h3 className="text-lg font-bold text-slate-850">رابط الـ Webhook العام الموحد لبوابات الدفع</h3>
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-0.5 rounded-full border border-indigo-200">
                      Unified IPN Callback
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    رابط موحد يربط كافة بوابات الدفع بالخادم لتلقي ومعالجة كافة إشعارات الدفع والاسترداد آلياً وفورياً.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const url = `${typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-rbp67wafz7bw2tlpws5nwl-833968944423.europe-west2.run.app'}/api/payments/webhook`;
                    navigator.clipboard.writeText(url);
                    setCopiedWebhook(true);
                    notify('success', 'تم نسخ رابط الـ Webhook العام الموحد لبوابات الدفع بنجاح! 📋');
                    setTimeout(() => setCopiedWebhook(false), 3000);
                  }}
                  className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer ${
                    copiedWebhook ? 'bg-emerald-600 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {copiedWebhook ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedWebhook ? 'تم نسخ الرابط بنجاح ✅' : 'نسخ رابط الـ Webhook العام'}</span>
                </button>
              </div>

              {/* URL Input Box */}
              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between gap-3 dir-ltr">
                <span className="font-mono text-xs text-indigo-900 font-bold break-all text-left dir-ltr select-all">
                  {`${typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-rbp67wafz7bw2tlpws5nwl-833968944423.europe-west2.run.app'}/api/payments/webhook`}
                </span>
                <span className="text-[10px] bg-slate-200 text-slate-700 font-bold px-2 py-1 rounded shrink-0">
                  POST Callback
                </span>
              </div>

              {/* Instructions */}
              <div className="bg-indigo-50/40 border border-indigo-100 p-4 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-indigo-950 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                  <span>طريقة الاستخدام والتضمين في لوحات تحكم التجار لمزودي الخدمات المالية:</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-700">
                  <div className="bg-white p-3 rounded-lg border border-indigo-100/80">
                    <span className="font-bold text-indigo-800 block mb-1">1. التوجه للإعدادات:</span>
                    سجل الدخول إلى لوحة التاجر لدى المورد المالي (ميسر، هايبرباي، بيتابس، جيديا، تابي، تمارا) وانتقل إلى قسم (الإعدادات/Webhooks).
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100/80">
                    <span className="font-bold text-indigo-800 block mb-1">2. إدراج الرابط:</span>
                    قم بلصق رابط الـ Webhook الموحد أعلاه في حقل (Webhook Event Listener URL / IPN Endpoint).
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-indigo-100/80">
                    <span className="font-bold text-indigo-800 block mb-1">3. تفعيل الأحداث الفورية:</span>
                    حدد أحداث الدفع الناجح (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">payment.paid</code>)، الاسترداد (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">refund.created</code>)، وفشل الدفع.
                  </div>
                </div>
              </div>

              {/* Test Buttons */}
              <div className="pt-2 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 mb-3 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>الأزرار السريعة ونماذج تجربة الـ Webhook المباشرة للبوابات:</span>
                  </span>
                  <span className="text-[11px] text-slate-400 font-normal">اضغط على أي بوابة لاختبار إشعار الـ Webhook مباشرة</span>
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                  {[
                    { title: 'مُيسر (Moyasar)', key: 'moyasar', icon: '⚡' },
                    { title: 'هايبر باي (HyperPay)', key: 'hyperpay', icon: '💳' },
                    { title: 'بي تابس (PayTabs)', key: 'paytabs', icon: '🌐' },
                    { title: 'جيديا (Geidea)', key: 'geidea', icon: '🏛️' },
                    { title: 'تابي (Tabby)', key: 'tabby_api', icon: '🛍️' },
                    { title: 'تمارا (Tamara)', key: 'tamara_api', icon: '🎁' }
                  ].map((gw) => (
                    <button
                      key={gw.key}
                      type="button"
                      onClick={() => {
                        setWebhookTestGateway(gw.key);
                        setWebhookTestLogs([
                          `[READY] Webhook test endpoint primed for gateway: ${gw.title}`,
                          `Target URL: ${typeof window !== 'undefined' ? window.location.origin : ''}/api/payments/webhook/${gw.key}`
                        ]);
                        notify('info', `تم تجهيز اختبار Webhook للبوابة: ${gw.title}`);
                      }}
                      className="p-2.5 bg-slate-50 hover:bg-amber-50/50 border border-slate-200 hover:border-amber-400 rounded-xl transition-all cursor-pointer text-right group flex flex-col items-center justify-center gap-1"
                    >
                      <span className="text-base group-hover:scale-110 transition-transform">{gw.icon}</span>
                      <span className="text-[11px] font-bold text-slate-800 text-center">{gw.title}</span>
                      <span className="text-[9px] text-amber-700 bg-amber-100/60 font-bold px-1.5 py-0.5 rounded-md mt-0.5">
                        اختبار Webhook
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Independent Payment Gateways Cards */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-500" />
                  <span>إعدادات بوابات الدفع الإلكترونية ومفاتيح الـ API المستقلة</span>
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-500 font-bold">البوابات المفعلة:</span>
                  <span className="text-xs bg-emerald-100 text-emerald-800 font-extrabold px-2 py-0.5 rounded-full">
                    {Object.values(enabledGateways).filter(Boolean).length} / 6
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {[
                  { 
                    title: 'مُيسر (Moyasar)', 
                    key: 'moyasar', 
                    desc: 'دعم بطاقات مدى المحلية، فيزا، ماستركارد، و Apple Pay بأعلى نسبة قبول في السعودية',
                    badges: ['مدى', 'Visa', 'MasterCard', 'Apple Pay'],
                    fields: [
                      { label: 'مفتاح ميسر السري (MOYASAR_SECRET_KEY)', apiKey: 'moyasarSecret', placeholder: 'sk_test_...', type: 'password', hint: 'مطلوب للمصادقة وتنفيذ السحب والاسترداد' },
                      { label: 'المفتاح العام لميسر (MOYASAR_PUBLISHABLE_KEY)', apiKey: 'moyasarPublishable', placeholder: 'pk_test_...', type: 'text', hint: 'المفتاح العام المستخدم في النموذج المباشر بالواجهة الأمامية' }
                    ]
                  },
                  { 
                    title: 'هايبر باي (HyperPay)', 
                    key: 'hyperpay', 
                    desc: 'بوابة دفع عالمية بخيارات مرنة وتسويات فورية وتكامل شامل مع الشبكات السعودية والدولية',
                    badges: ['مدى', 'Visa', 'MasterCard', 'Apple Pay', 'STC Pay'],
                    fields: [
                      { label: 'معرف كيان هايبرباي (HYPERPAY_ENTITY_ID)', apiKey: 'hyperpayEntity', placeholder: '8a829417...', type: 'text', hint: 'معرف الكيان المالي المخصص لحساب التاجر' },
                      { label: 'رمز الوصول / المفتاح السري (HYPERPAY_ACCESS_TOKEN)', apiKey: 'hyperpayAccessToken', placeholder: 'OGE4Mjk0MTc...', type: 'password', hint: 'رمز الوصول الآمن لخادم هايبرباي' }
                    ]
                  },
                  { 
                    title: 'بي تابس (PayTabs)', 
                    key: 'paytabs', 
                    desc: 'حلول ذكية للمدفوعات عبر الإنترنت مع دعم العملات المتعددة والروابط السريعة',
                    badges: ['مدى', 'Visa', 'MasterCard', 'Amex'],
                    fields: [
                      { label: 'معرف ملف بيتابس (PAYTABS_PROFILE_ID)', apiKey: 'paytabsProfile', placeholder: '123456', type: 'text', hint: 'Profile ID الخاص بحساب المنصة في بيتابس' },
                      { label: 'مفتاح خادم بيتابس (PAYTABS_SERVER_KEY)', apiKey: 'paytabsServer', placeholder: 'S2J...-...', type: 'password', hint: 'Server Key لتأكيد المعاملات وتلقي إشعارات IPN' }
                    ]
                  },
                  { 
                    title: 'جيديا (Geidea)', 
                    key: 'geidea', 
                    desc: 'أكبر مزود تقنية مالية في السعودية مع تقنيات قبول البطاقات وApple Pay والتحصيل الفوري',
                    badges: ['مدى', 'Visa', 'MasterCard', 'Apple Pay', 'STC Pay'],
                    fields: [
                      { label: 'معرف تاجر جيديا (GEIDEA_MERCHANT_ID)', apiKey: 'geideaMerchant', placeholder: '100293012', type: 'text', hint: 'Merchant ID المسجل في بوابة جيديا' },
                      { label: 'المفتاح العام لجيديا (GEIDEA_PUBLIC_KEY)', apiKey: 'geideaPublic', placeholder: 'a28b9c...', type: 'text', hint: 'Public API Key المخصص للمتصفح' },
                      { label: 'المفتاح السري لجيديا (GEIDEA_SECRET_KEY)', apiKey: 'geideaSecret', placeholder: 's_89123...', type: 'password', hint: 'Secret API Key المخصص لمعالجة الخادم' }
                    ]
                  },
                  { 
                    title: 'تابي (Tabby)', 
                    key: 'tabby_api', 
                    desc: 'ربط بوابة التقسيط المرن تابي لدفع الأقساط الشهرية (اشتر الآن وادفع لاحقاً على 4 دفعات)',
                    badges: ['تقسيط 4 دفعات', 'BNPL (تابي)'],
                    fields: [
                      { label: 'مفتاح تابي السري (TABBY_SECRET_KEY)', apiKey: 'tabbySecret', placeholder: 'pk_test_...', type: 'password', hint: 'Secret Key للمصادقة وإنشاء جلسات التقسيط' },
                      { label: 'المفتاح العام لتابي (TABBY_PUBLIC_KEY)', apiKey: 'tabbyPublic', placeholder: 'pk_live_...', type: 'text', hint: 'Public Key لربط عنصر تابي في صفحة الدفع' }
                    ]
                  },
                  { 
                    title: 'تمارا (Tamara)', 
                    key: 'tamara_api', 
                    desc: 'ربط بوابة التقسيط المرن تمارا لدفع الأقساط الشهرية بدون فوائد أو رسوم خفية',
                    badges: ['قسمها على 4', 'BNPL (تمارا)'],
                    fields: [
                      { label: 'رمز API لتمارا (TAMARA_API_TOKEN)', apiKey: 'tamaraToken', placeholder: 'tm_live_...', type: 'password', hint: 'API Bearer Token المعتمد لإنشاء طلبات تمارا' },
                      { label: 'رمز إشعارات تمارا (TAMARA_NOTIFICATION_TOKEN)', apiKey: 'tamaraNotificationToken', placeholder: 'nt_90123...', type: 'password', hint: 'Notification Token للتحقق من صحة توقيع الإشعارات' }
                    ]
                  }
                ].map((pg) => {
                  const isEnabled = enabledGateways[pg.key] || false;
                  return (
                    <div 
                      key={pg.key} 
                      className={`border-2 rounded-2xl transition-all overflow-hidden ${
                        isEnabled ? 'border-emerald-500/80 bg-white shadow-md' : 'border-slate-200 bg-slate-50/60 opacity-90'
                      }`}
                    >
                      <div className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="space-y-1.5 text-right flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-base font-bold text-slate-850">{pg.title}</h4>
                            {isEnabled ? (
                              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                البوابة متصلة ونشطة
                              </span>
                            ) : (
                              <span className="text-[10px] bg-slate-200 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
                                البوابة معطلة
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500">{pg.desc}</p>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {pg.badges.map((b, idx) => (
                              <span key={idx} className="text-[9px] bg-slate-100 text-slate-700 font-medium px-2 py-0.5 rounded border border-slate-200">
                                {b}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 flex-row-reverse sm:flex-row">
                          <button 
                            type="button"
                            onClick={() => handleCheckout(pg.key)} 
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300/80 text-xs font-extrabold rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>تجربة الربط</span>
                          </button>

                          <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
                            <span className="text-xs font-bold text-slate-700">{isEnabled ? 'تفعيل البوابة' : 'البوابة تعطيل'}</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={isEnabled} 
                                onChange={() => handleToggleGateway(pg.key)} 
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                          </div>
                        </div>
                      </div>

                      {isEnabled && (
                        <div className="border-t border-emerald-100 bg-emerald-50/20 p-5 space-y-4 animate-in fade-in duration-300">
                          <div className="flex items-center justify-between">
                            <h5 className="text-xs font-bold text-emerald-950 flex items-center gap-1.5">
                              <Key className="w-4 h-4 text-emerald-600" />
                              <span>مفاتيح ومصادقات API المخصصة لبوابة ({pg.title}):</span>
                            </h5>
                            <span className="text-[10px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                              تلقائية الحفظ ومحمية
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {pg.fields.map((f, fIdx) => (
                              <div key={fIdx} className="space-y-1">
                                <label className="block text-xs font-bold text-slate-700 text-right">
                                  {f.label}
                                </label>
                                <input
                                  type={f.type}
                                  value={integrationKeys[f.apiKey] || ''}
                                  onChange={e => {
                                    const val = e.target.value;
                                    setIntegrationKeys((prev: any) => ({
                                      ...prev,
                                      [f.apiKey]: val
                                    }));
                                  }}
                                  placeholder={f.placeholder}
                                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-emerald-500 outline-none font-mono text-xs text-left bg-white transition-all shadow-2xs"
                                  dir="ltr"
                                />
                                {f.hint && (
                                  <p className="text-[10px] text-slate-400 mt-0.5 text-right">{f.hint}</p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* الفاتورة الضريبية الموحدة */}
        {subTab === 'unified_invoice' && (
          <UnifiedInvoiceTab
            bookings={props.bookings || []}
            halls={props.halls || []}
            providers={props.providers || []}
            platformData={props.platformData}
          />
        )}
      </div>
    </div>
  );
}

export default FinancialSettingsSection;
