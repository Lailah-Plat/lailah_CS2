import React, { useState, useEffect } from 'react';
import { downloadEContractAuditBundle } from '../utils/contractAuditBundle';
import {
  ShieldCheck,
  FileText,
  Share2,
  TrendingUp,
  Sliders,
  CheckCircle,
  XCircle,
  Clock,
  Key,
  Hash,
  Send,
  Download,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  Lock,
  DollarSign,
  UserCheck,
  Eye,
  Layers
} from 'lucide-react';

interface FeatureFlag {
  id: number;
  key: string;
  nameArabic: string;
  nameEnglish: string;
  description: string;
  isEnabled: boolean;
  environment: string;
  allowedTiers: string;
}

interface Contract {
  id: number;
  contractNumber: string;
  targetType: string;
  customerName: string;
  customerNationalIdPhone: string;
  providerName: string;
  contractTitleArabic: string;
  totalAmount: number;
  commissionAmount: number;
  status: string;
  documentHash: string;
  signedAt: string | null;
  otpPhoneMasked: string | null;
  createdAt: string;
}

interface Promoter {
  id: number;
  promoterId: string;
  name: string;
  email: string;
  promoterCode: string;
  trackingUrl: string;
  defaultCommissionValue: number;
  status: string;
  totalEarned: number;
  totalPaidOut: number;
}

interface Attribution {
  id: number;
  attributionCode: string;
  promoterCode: string;
  customerName: string;
  bookingReference: string;
  orderAmount: number;
  calculatedCommission: number;
  status: string;
  createdAt: string;
}

interface Recommendation {
  id: number;
  entityId: string;
  entityType: string;
  currentPrice: number;
  recommendedPrice: number;
  deltaPercent: number;
  confidenceLevel: number;
  reasonArabic: string;
  status: string;
}

interface DomainEvent {
  id: number;
  eventType: string;
  entityType: string;
  entityId: string;
  actorRole: string;
  payload: string;
  hashProof: string;
  createdAt: string;
}

export const PhasesExecutionPortal: React.FC<{ userRole?: string; providerId?: string }> = ({
  userRole = 'admin',
  providerId = 'PROV-1'
}) => {
  const [activeTab, setActiveTab] = useState<'flags' | 'contracts' | 'affiliates' | 'pricing' | 'audit'>('flags');
  const [loading, setLoading] = useState(false);

  // States
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [auditEvents, setAuditEvents] = useState<DomainEvent[]>([]);

  // Draft Contract State
  const [showContractModal, setShowContractModal] = useState(false);
  const [otpInput, setOtpInput] = useState('');
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);

  // Promoter Register Form State
  const [promoterName, setPromoterName] = useState('');
  const [promoterEmail, setPromoterEmail] = useState('');
  const [promoterPhone, setPromoterPhone] = useState('');
  const [promoterIban, setPromoterIban] = useState('');

  // Pricing Bounds Form State
  const [minPrice, setMinPrice] = useState(1000);
  const [maxPrice, setMaxPrice] = useState(12000);
  const [maxDailyChange, setMaxDailyChange] = useState(15);
  const [autopilot, setAutopilot] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'flags') {
        const res = await fetch('/api/phases/feature-flags');
        const data = await res.json();
        if (data.success) setFlags(data.flags);
      } else if (activeTab === 'contracts') {
        const res = await fetch('/api/phases/contracts');
        const data = await res.json();
        if (data.success) setContracts(data.contracts);
      } else if (activeTab === 'affiliates') {
        const resP = await fetch('/api/phases/affiliates/promoters');
        const dataP = await resP.json();
        if (dataP.success) setPromoters(dataP.promoters);

        const resA = await fetch('/api/phases/affiliates/attributions');
        const dataA = await resA.json();
        if (dataA.success) setAttributions(dataA.attributions);
      } else if (activeTab === 'pricing') {
        const res = await fetch(`/api/phases/pricing/recommendations/${providerId}`);
        const data = await res.json();
        if (data.success) setRecommendations(data.recommendations);
      } else if (activeTab === 'audit') {
        const res = await fetch('/api/phases/domain-events');
        const data = await res.json();
        if (data.success) setAuditEvents(data.events);
      }
    } catch (e) {
      console.warn('Could not fetch phase data, maintaining local fallback state:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFlag = async (key: string, currentVal: boolean) => {
    try {
      const res = await fetch('/api/phases/feature-flags/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, isEnabled: !currentVal })
      });
      const data = await res.json();
      if (data.success) {
        setFlags(flags.map(f => (f.key === key ? { ...f, isEnabled: !currentVal } : f)));
      }
    } catch (e) {
      console.error('Error toggling flag:', e);
    }
  };

  const handleDraftContract = async () => {
    try {
      const res = await fetch('/api/phases/contracts/draft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: 'CUST-1002',
          customerName: 'محمد عبد الله العتيبي',
          customerNationalIdPhone: '0501234567',
          providerId,
          providerName: 'مجموعة القاعات الفاخرة',
          totalAmount: 8500,
          commissionAmount: 850
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
        alert('تم إنشاء مسودة العقد الإلكتروني وتوليد البصمة الرقمية SHA-256 بنجاح!');
      }
    } catch (e) {
      console.error('Error drafting contract:', e);
    }
  };

  const handleSignContractOtp = async () => {
    if (!selectedContract) return;
    try {
      const res = await fetch('/api/phases/contracts/sign-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contractId: selectedContract.id,
          otpCode: otpInput,
          phone: '0501234567'
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('✅ تم توقيع العقد وإصدار شهادة الإثبات الرقمي بنجاح!');
        setShowContractModal(false);
        setOtpInput('');
        fetchData();
      } else {
        alert(data.error || 'فشل في توثيق التوقيع');
      }
    } catch (e) {
      console.error('Sign contract error:', e);
    }
  };

  const handleRegisterPromoter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/phases/affiliates/promoter/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoterId: `PROM-${Date.now().toString().slice(-4)}`,
          name: promoterName,
          email: promoterEmail,
          phone: promoterPhone,
          iban: promoterIban
        })
      });
      const data = await res.json();
      if (data.success) {
        alert('تم تسجيل المسوق وإنشاء رابط التتبع المخصص بنجاح!');
        setPromoterName('');
        setPromoterEmail('');
        setPromoterPhone('');
        setPromoterIban('');
        fetchData();
      }
    } catch (e) {
      console.error('Register promoter error:', e);
    }
  };

  const handleAdvanceAttribution = async (attributionId: number, currentStage: string) => {
    const stageMap: Record<string, string> = {
      tracked: 'pending',
      pending: 'earned',
      earned: 'payable',
      payable: 'paid'
    };
    const nextStage = stageMap[currentStage];
    if (!nextStage) return;

    try {
      const res = await fetch('/api/phases/affiliates/advance-stage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attributionId, nextStage })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Advance attribution error:', e);
    }
  };

  const handleGenerateRecommendation = async () => {
    try {
      const res = await fetch('/api/phases/pricing/recommendations/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entityId: 'HALL-8801',
          entityType: 'hall',
          providerId,
          currentPrice: 4500,
          occupancyRate: 85
        })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Generate recommendation error:', e);
    }
  };

  const handlePricingAction = async (recommendationId: number, action: 'accept' | 'reject') => {
    try {
      const res = await fetch('/api/phases/pricing/recommendations/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recommendationId, action })
      });
      const data = await res.json();
      if (data.success) {
        fetchData();
      }
    } catch (e) {
      console.error('Pricing action error:', e);
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-900 min-h-screen text-slate-800 dark:text-slate-100 p-4 md:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> الإطلاق المرحلي الآمن
            </span>
            <span className="text-xs text-slate-500 font-mono">P0 - P4 Roadmap</span>
          </div>
          <h1 className="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
            بوابة تنفيذ وترخيص خدمات منصة ليلة (Roadmap Execution Portal)
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            إدارة مفاتيح التحكم التشغيلية، العقود الإلكترونية الموثقة، برامج التسويق بالعمولة، ومحرك التسعير الديناميكي.
          </p>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-sm font-medium transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث البيانات
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex overflow-x-auto gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
        <button
          onClick={() => setActiveTab('flags')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'flags'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Sliders className="w-4 h-4" />
          مفاتيح التحكم (Feature Flags)
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'contracts'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          العقود الإلكترونية (المرحلة 4)
        </button>

        <button
          onClick={() => setActiveTab('affiliates')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'affiliates'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Share2 className="w-4 h-4" />
          التسويق بالعمولة والإحالات (المرحلة 5)
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          التسعير الديناميكي الذكي (المرحلة 2)
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition whitespace-nowrap ${
            activeTab === 'audit'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
          }`}
        >
          <Layers className="w-4 h-4" />
          سجل التدقيق والأحداث (Domain Audit)
        </button>
      </div>

      {/* TAB 1: FEATURE FLAGS */}
      {activeTab === 'flags' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">مفاتيح تفعيل الميزات التدريجية (Feature Flags & Entitlements)</h2>
              <p className="text-xs text-slate-500">
                تسمح للتحكم البرمجي بتشغيل أو إيقاف الميزات الحساسة قبل الإطلاق العام
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {flags.map(flag => (
              <div
                key={flag.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 flex justify-between items-start gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-700 dark:text-slate-300">
                      {flag.key}
                    </span>
                    <span className="text-xs text-emerald-600 font-medium">[{flag.environment}]</span>
                  </div>
                  <h3 className="font-bold text-sm mt-1">{flag.nameArabic}</h3>
                  <p className="text-xs text-slate-500 mt-1">{flag.description}</p>
                </div>

                <button
                  onClick={() => handleToggleFlag(flag.key, flag.isEnabled)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    flag.isEnabled
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 hover:bg-emerald-200'
                      : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 hover:bg-slate-300'
                  }`}
                >
                  {flag.isEnabled ? <CheckCircle className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                  {flag.isEnabled ? 'مفعلة' : 'معطلة'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: ELECTRONIC CONTRACTS */}
      {activeTab === 'contracts' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h2 className="text-lg font-bold">منظومة العقود الإلكترونية الموحدة (E-Contracts Engine)</h2>
              <p className="text-xs text-slate-500">
                إصدار وتوثيق عقود القاعات والخدمات المساندة ببصمة رقمية SHA-256 ورمز OTP
              </p>
            </div>

            <button
              onClick={handleDraftContract}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              إنشاء مسودة عقد تجريبية
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                <tr>
                  <th className="p-3 rounded-r-xl">رقم العقد الموحد</th>
                  <th className="p-3">العميل</th>
                  <th className="p-3">المزود</th>
                  <th className="p-3">المبلغ الإجمالي</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">بصمة المستند SHA-256</th>
                  <th className="p-3 rounded-l-xl">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {contracts.map(contract => (
                  <tr key={contract.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition">
                    <td className="p-3 font-mono text-xs font-bold text-emerald-600">{contract.contractNumber}</td>
                    <td className="p-3 font-medium">{contract.customerName}</td>
                    <td className="p-3">{contract.providerName}</td>
                    <td className="p-3 font-bold">{contract.totalAmount.toLocaleString()} ر.س</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          contract.status === 'executed'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300'
                        }`}
                      >
                        {contract.status === 'executed' ? 'ناقذ وموثق' : 'مسودة بانتظار التوقيع'}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[10px] text-slate-500 max-w-[140px] truncate">
                      {contract.documentHash}
                    </td>
                    <td className="p-3">
                      {contract.status === 'draft' ? (
                        <button
                          onClick={() => {
                            setSelectedContract(contract);
                            setShowContractModal(true);
                          }}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium flex items-center gap-1"
                        >
                          <Lock className="w-3 h-3" /> توقيع بـ OTP
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => alert(`شهادة الإثبات الرقمي بالعقد الموحد:\nرقم العقد: ${contract.contractNumber}\nتاريخ التوقيع: ${contract.signedAt}\nالهاتف الموثق: ${contract.otpPhoneMasked}\nبصمة المستند SHA-256: ${contract.documentHash}`)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-slate-200"
                          >
                            <Eye className="w-3 h-3" /> الشهادة
                          </button>
                          <button
                            onClick={() => downloadEContractAuditBundle(contract)}
                            className="px-2.5 py-1 bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-lg text-xs font-medium flex items-center gap-1 hover:bg-emerald-200"
                            title="تصدير حزمة الإثبات الرقمي الموثقة قانونياً (Audit Package)"
                          >
                            <Download className="w-3 h-3" /> حزمة الإثبات
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AFFILIATE MARKETING */}
      {activeTab === 'affiliates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Register Promoter */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Share2 className="w-5 h-5 text-emerald-600" />
              تسجيل مسوق عمولة جديد
            </h2>

            <form onSubmit={handleRegisterPromoter} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">الاسم الكامل</label>
                <input
                  type="text"
                  required
                  value={promoterName}
                  onChange={e => setPromoterName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  placeholder="مثال: خالد المسوق"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">البريد الإلكتروني</label>
                <input
                  type="email"
                  required
                  value={promoterEmail}
                  onChange={e => setPromoterEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  placeholder="promoter@example.com"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">رقم الجوال</label>
                <input
                  type="text"
                  required
                  value={promoterPhone}
                  onChange={e => setPromoterPhone(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                  placeholder="0501234567"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-600 dark:text-slate-400 block mb-1">رقم الحساب البنكي (IBAN)</label>
                <input
                  type="text"
                  value={promoterIban}
                  onChange={e => setPromoterIban(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm font-mono"
                  placeholder="SA0000000000000000000000"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition"
              >
                توليد رابط الإحالة وتفعيل الحساب
              </button>
            </form>
          </div>

          {/* Promoters & Attributions */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <h2 className="text-lg font-bold">سجل المسوقين المعتمدين</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {promoters.map(p => (
                  <div key={p.id} className="p-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50/50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-sm">{p.name}</span>
                      <span className="font-mono text-xs text-emerald-600 font-bold">{p.promoterCode}</span>
                    </div>
                    <div className="text-xs text-slate-500 mt-1">الرابط: {p.trackingUrl}</div>
                    <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-200 dark:border-slate-700 text-xs">
                      <span>إجمالي العمولات: <strong className="text-emerald-600">{p.totalEarned} ر.س</strong></span>
                      <span className="text-slate-500">تم صرف: {p.totalPaidOut} ر.س</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
              <h2 className="text-lg font-bold">دورة حياة العمولات (Tracked ➔ Pending ➔ Earned ➔ Payable ➔ Paid)</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs">
                    <tr>
                      <th className="p-3">رمز الإسناد</th>
                      <th className="p-3">المسوق</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3">قيمة الحجز</th>
                      <th className="p-3">العمولة</th>
                      <th className="p-3">مرحلة المستحق</th>
                      <th className="p-3">التحكم</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {attributions.map(attr => (
                      <tr key={attr.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                        <td className="p-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">{attr.attributionCode}</td>
                        <td className="p-3 font-mono text-xs">{attr.promoterCode}</td>
                        <td className="p-3">{attr.customerName}</td>
                        <td className="p-3">{attr.orderAmount} ر.س</td>
                        <td className="p-3 font-bold text-emerald-600">{attr.calculatedCommission} ر.س</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">
                            {attr.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3">
                          {attr.status !== 'paid' && (
                            <button
                              onClick={() => handleAdvanceAttribution(attr.id, attr.status)}
                              className="px-2.5 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded text-xs font-medium"
                            >
                              ترقية المرحلة ➔
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: AI DYNAMIC PRICING */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold">محرك التسعير الديناميكي وتوصيات الإشغال (Dynamic Pricing Engine)</h2>
              <p className="text-xs text-slate-500">
                يقترح تعديل الأسعار بناءً على حدود القاعة ونسبة الإشغال دون التعديل المباشر إلا بعد الموافقة
              </p>
            </div>

            <button
              onClick={handleGenerateRecommendation}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              توليد توصية أسعار ذكية الآن
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map(rec => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50 space-y-3"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-500 font-mono">Entity: {rec.entityId}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                    نسبة الثقة: {rec.confidenceLevel}%
                  </span>
                </div>

                <div className="flex items-baseline gap-3">
                  <span className="text-xl font-bold text-slate-400 line-through">{rec.currentPrice} ر.س</span>
                  <span className="text-2xl font-black text-emerald-600">{rec.recommendedPrice} ر.س</span>
                  <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    +{rec.deltaPercent}%
                  </span>
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                  {rec.reasonArabic}
                </p>

                {rec.status === 'pending' ? (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => handlePricingAction(rec.id, 'accept')}
                      className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition"
                    >
                      قبول السعر المقترح
                    </button>
                    <button
                      onClick={() => handlePricingAction(rec.id, 'reject')}
                      className="px-4 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition"
                    >
                      رفض
                    </button>
                  </div>
                ) : (
                  <div className="text-xs font-bold text-emerald-600 flex items-center gap-1 pt-2">
                    <CheckCircle className="w-4 h-4" /> تم الاعتماد وتحديث جدول الأسعار المعتمد
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: AUDIT EVENTS */}
      {activeTab === 'audit' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-700 space-y-4">
          <h2 className="text-lg font-bold">سجل أحداث المنصة السيادية (Domain Events & Cryptographic Audit)</h2>
          <div className="space-y-2">
            {auditEvents.map(event => (
              <div
                key={event.id}
                className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col md:flex-row justify-between items-start md:items-center gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-emerald-600 font-mono">{event.eventType}</span>
                    <span className="text-slate-400">[{event.entityType}: {event.entityId}]</span>
                  </div>
                  <div className="text-slate-500 font-mono mt-1 text-[11px] max-w-2xl truncate">{event.payload}</div>
                </div>
                <div className="text-left font-mono text-[10px] text-slate-400">
                  {new Date(event.createdAt).toLocaleString('ar-SA')}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SIGN CONTRACT MODAL */}
      {showContractModal && selectedContract && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 border border-slate-200 dark:border-slate-700 shadow-2xl">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-lg">توقيع العقد الإلكتروني الموحد</h3>
              <button onClick={() => setShowContractModal(false)} className="text-slate-400 hover:text-slate-600">
                ✕
              </button>
            </div>

            <div className="text-xs space-y-2 text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900 p-3 rounded-xl">
              <div><strong>رقم العقد:</strong> {selectedContract.contractNumber}</div>
              <div><strong>الطرف الأول (المزود):</strong> {selectedContract.providerName}</div>
              <div><strong>الطرف الثاني (العميل):</strong> {selectedContract.customerName}</div>
              <div><strong>القيمة الإجمالية:</strong> {selectedContract.totalAmount} ر.س</div>
              <div><strong>البصمة الرقمية (SHA-256):</strong> <span className="font-mono text-[10px] block break-all text-slate-500">{selectedContract.documentHash}</span></div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">أدخل رمز التحقق (OTP) المرسي للجوال</label>
              <input
                type="text"
                value={otpInput}
                onChange={e => setOtpInput(e.target.value)}
                placeholder="123456"
                className="w-full text-center tracking-widest text-lg font-mono px-3 py-2 border rounded-xl"
              />
              <p className="text-[11px] text-slate-400 mt-1">للتجربة: ادخل أي رمز مكون من 6 أرقام (مثال: 123456)</p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSignContractOtp}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm transition"
              >
                اعتماد التوقيع وإصدار الشهادة
              </button>
              <button
                onClick={() => setShowContractModal(false)}
                className="px-4 py-2.5 bg-slate-200 text-slate-700 rounded-xl text-sm font-medium"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
