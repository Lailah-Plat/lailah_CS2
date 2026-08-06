import React, { useState, useMemo } from 'react';
import { 
  Building2, Landmark, DollarSign, ShieldCheck, AlertTriangle, CheckCircle2, 
  Clock, ArrowUpRight, ArrowDownRight, Calendar, Plus, FileText, ChevronRight,
  TrendingUp, TrendingDown, Percent, CreditCard, RefreshCw, Filter, Layers,
  Bell, AlertCircle, PieChart, Activity
} from 'lucide-react';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { CorporateLiability, ProviderReceivable, ClientReceivable, AmortizationInstallment } from '../types';

interface TreasuryManagementProps {
  userRole?: 'admin' | 'provider';
  currentProvider?: string;
  showNotification?: (type: 'success' | 'error' | 'info', message: string) => void;
  bankCashBalance?: number; // In SAR
  inTransitGatewayBalance?: number; // In SAR
  escrowLiabilityBalance?: number; // In SAR
  vatPayableBalance?: number; // In SAR
  refundsPayableBalance?: number; // In SAR
}

// Initial pre-seeded mock dataset for Saudi SAR corporate liabilities (SOCPA / IFRS compliant)
const INITIAL_LIABILITIES: CorporateLiability[] = [
  {
    id: 'fac-1',
    facilityNumber: 'EXP-26-0000000101',
    type: 'murabaha',
    creditorName: 'مصرف الراجحي - تمويل مرابحة توسع المنصة',
    principalAmount: 500000,
    profitRate: 4.5,
    profitAmount: 22500,
    totalRepaymentAmount: 522500,
    repaidAmount: 174166.68,
    remainingAmount: 348333.32,
    termMonths: 12,
    startDate: '2026-01-01',
    dueDate: '2026-12-31',
    monthlyPayment: 43541.67,
    status: 'active',
    installments: [
      { installmentNo: 1, dueDate: '2026-01-31', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'paid', paidAt: '2026-01-28', paymentReference: 'EXP-26-0000000012' },
      { installmentNo: 2, dueDate: '2026-02-28', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'paid', paidAt: '2026-02-25', paymentReference: 'EXP-26-0000000028' },
      { installmentNo: 3, dueDate: '2026-03-31', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'paid', paidAt: '2026-03-29', paymentReference: 'EXP-26-0000000045' },
      { installmentNo: 4, dueDate: '2026-04-30', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'paid', paidAt: '2026-04-28', paymentReference: 'EXP-26-0000000061' },
      { installmentNo: 5, dueDate: '2026-05-31', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
      { installmentNo: 6, dueDate: '2026-06-30', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
      { installmentNo: 7, dueDate: '2026-07-31', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
      { installmentNo: 8, dueDate: '2026-08-31', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
      { installmentNo: 9, dueDate: '2026-09-30', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
      { installmentNo: 10, dueDate: '2026-10-31', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
      { installmentNo: 11, dueDate: '2026-11-30', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
      { installmentNo: 12, dueDate: '2026-12-31', principalPart: 41666.67, profitPart: 1875, totalPart: 43541.67, status: 'pending' },
    ],
    notes: 'تمويل مرابحة معتمد للتحول الرقمي وتحديث البنية التحتية',
    createdAt: '2026-01-01'
  },
  {
    id: 'fac-2',
    facilityNumber: 'EXP-26-0000000102',
    type: 'end_of_service',
    creditorName: 'مخصص مكافأة نهاية الخدمة والالتزامات العمالية',
    principalAmount: 185000,
    profitRate: 0,
    profitAmount: 0,
    totalRepaymentAmount: 185000,
    repaidAmount: 0,
    remainingAmount: 185000,
    termMonths: 24,
    startDate: '2026-01-01',
    dueDate: '2027-12-31',
    monthlyPayment: 7708.33,
    status: 'active',
    installments: [],
    notes: 'التزام قانوني تراكمي لصالح الكادر الوظيفي للمنصة',
    createdAt: '2026-01-01'
  }
];

const INITIAL_PROVIDER_RECEIVABLES: ProviderReceivable[] = [
  {
    id: 'pr-1',
    receivableNumber: 'REV-26-0000000201',
    providerId: 101,
    providerName: 'شركة قاعات القصر الملكي',
    amount: 15000,
    reason: 'unpaid_subscription',
    status: 'outstanding',
    dueDate: '2026-07-15',
    ageingDays: 22,
    notes: 'اشتراك الباقة الاحترافية السنوي المعلق',
    createdAt: '2026-07-01'
  },
  {
    id: 'pr-2',
    receivableNumber: 'REV-26-0000000202',
    providerId: 104,
    providerName: 'مؤسسة الضيافة الكبرى',
    amount: 8500,
    reason: 'offline_booking_commission',
    status: 'outstanding',
    dueDate: '2026-06-10',
    ageingDays: 57,
    notes: 'عمولة حجز مباشر أوفلاين معتمد بالمنشأة',
    createdAt: '2026-06-01'
  }
];

const INITIAL_CLIENT_RECEIVABLES: ClientReceivable[] = [
  {
    id: 'cr-1',
    receivableNumber: 'REV-26-0000000301',
    bookingId: 'BKG-26-0000000088',
    customerId: 501,
    customerName: 'عبدالرحمن الشهري',
    amount: 12000,
    paymentType: 'pay_on_arrival',
    status: 'outstanding',
    dueDate: '2026-08-15',
    ageingDays: 0,
    notes: 'متبقي حجز قاعة المهرجان عند الوصول',
    createdAt: '2026-08-01'
  }
];

export default function TreasuryManagement({
  userRole = 'admin',
  currentProvider = '',
  showNotification,
  bankCashBalance = 1250000,
  inTransitGatewayBalance = 185000,
  escrowLiabilityBalance = 620000,
  vatPayableBalance = 45000,
  refundsPayableBalance = 15000
}: TreasuryManagementProps) {

  // State Management
  const [liabilities, setLiabilities] = useState<CorporateLiability[]>(() => {
    try {
      const saved = localStorage.getItem('layla_treasury_liabilities');
      return saved ? JSON.parse(saved) : INITIAL_LIABILITIES;
    } catch {
      return INITIAL_LIABILITIES;
    }
  });

  const [providerReceivables, setProviderReceivables] = useState<ProviderReceivable[]>(() => {
    try {
      const saved = localStorage.getItem('layla_treasury_provider_receivables');
      return saved ? JSON.parse(saved) : INITIAL_PROVIDER_RECEIVABLES;
    } catch {
      return INITIAL_PROVIDER_RECEIVABLES;
    }
  });

  const [clientReceivables, setClientReceivables] = useState<ClientReceivable[]>(() => {
    try {
      const saved = localStorage.getItem('layla_treasury_client_receivables');
      return saved ? JSON.parse(saved) : INITIAL_CLIENT_RECEIVABLES;
    } catch {
      return INITIAL_CLIENT_RECEIVABLES;
    }
  });

  // UI Modal Controls
  const [activeTab, setActiveTab] = useState<'overview' | 'liabilities' | 'receivables' | 'ageing' | 'calculator'>('overview');
  const [showAddLiabilityModal, setShowAddLiabilityModal] = useState(false);
  const [showAddReceivableModal, setShowAddReceivableModal] = useState(false);
  const [selectedLiabilityForSchedule, setSelectedLiabilityForSchedule] = useState<CorporateLiability | null>(null);

  // New Liability Form State
  const [facilityType, setFacilityType] = useState<'bank_facility' | 'murabaha' | 'end_of_service' | 'operational_debt' | 'external_loan'>('murabaha');
  const [creditorName, setCreditorName] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [profitRate, setProfitRate] = useState('4.5');
  const [termMonths, setTermMonths] = useState('12');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');

  // New Receivable Form State
  const [receivableType, setReceivableType] = useState<'provider' | 'client'>('provider');
  const [partyName, setPartyName] = useState('');
  const [receivableAmount, setReceivableAmount] = useState('');
  const [receivableReason, setReceivableReason] = useState('unpaid_subscription');
  const [receivableDueDate, setReceivableDueDate] = useState('');

  // Persist state updates
  const saveLiabilities = (updated: CorporateLiability[]) => {
    setLiabilities(updated);
    safeSetLocalStorage('layla_treasury_liabilities', JSON.stringify(updated));
  };

  const saveProviderReceivables = (updated: ProviderReceivable[]) => {
    setProviderReceivables(updated);
    safeSetLocalStorage('layla_treasury_provider_receivables', JSON.stringify(updated));
  };

  const saveClientReceivables = (updated: ClientReceivable[]) => {
    setClientReceivables(updated);
    safeSetLocalStorage('layla_treasury_client_receivables', JSON.stringify(updated));
  };

  // -------------------------------------------------------------
  // SOCPA / IFRS Balance Sheet & Financial Calculations
  // -------------------------------------------------------------
  const totalProviderReceivables = useMemo(() => {
    return providerReceivables
      .filter(r => r.status === 'outstanding' || r.status === 'partially_paid')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [providerReceivables]);

  const totalClientReceivables = useMemo(() => {
    return clientReceivables
      .filter(r => r.status === 'outstanding')
      .reduce((acc, curr) => acc + curr.amount, 0);
  }, [clientReceivables]);

  // Total Assets (SOCPA Classification)
  const totalAssets = useMemo(() => {
    return bankCashBalance + inTransitGatewayBalance + totalProviderReceivables + totalClientReceivables;
  }, [bankCashBalance, inTransitGatewayBalance, totalProviderReceivables, totalClientReceivables]);

  // Total Corporate Debt Liabilities
  const totalCorporateLiabilities = useMemo(() => {
    return liabilities
      .filter(l => l.status === 'active' || l.status === 'grace_period')
      .reduce((acc, curr) => acc + curr.remainingAmount, 0);
  }, [liabilities]);

  // Total Liabilities (SOCPA Classification)
  const totalLiabilities = useMemo(() => {
    return escrowLiabilityBalance + vatPayableBalance + refundsPayableBalance + totalCorporateLiabilities;
  }, [escrowLiabilityBalance, vatPayableBalance, refundsPayableBalance, totalCorporateLiabilities]);

  // Net Equity / Capital Cushion
  const netEquity = useMemo(() => {
    return totalAssets - totalLiabilities;
  }, [totalAssets, totalLiabilities]);

  // Net Debt = Corporate Debt Facilities - Available Liquid Cash
  const netDebt = useMemo(() => {
    return Math.max(0, totalCorporateLiabilities - bankCashBalance);
  }, [totalCorporateLiabilities, bankCashBalance]);

  // Financial Health Metrics & Exact Thresholds
  const debtToEquityRatio = useMemo(() => {
    if (netEquity <= 0) return 999;
    return Number((totalLiabilities / netEquity).toFixed(2));
  }, [totalLiabilities, netEquity]);

  // DSCR (Debt Service Coverage Ratio) = Annual NOI / Annual Debt Service
  const monthlyDebtService = useMemo(() => {
    return liabilities
      .filter(l => l.status === 'active')
      .reduce((acc, curr) => acc + curr.monthlyPayment, 0);
  }, [liabilities]);

  const dscrRatio = useMemo(() => {
    const annualDebtService = monthlyDebtService * 12;
    if (annualDebtService <= 0) return 99;
    const annualNOI = 1450000; // Estimated platform net operating income
    return Number((annualNOI / annualDebtService).toFixed(2));
  }, [monthlyDebtService]);

  // Quick Ratio = (Cash + Gateway In-Transit) / Current Liabilities
  const quickRatio = useMemo(() => {
    const currentLiabilities = escrowLiabilityBalance + vatPayableBalance + refundsPayableBalance + (monthlyDebtService * 12);
    if (currentLiabilities <= 0) return 99;
    return Number(((bankCashBalance + inTransitGatewayBalance) / currentLiabilities).toFixed(2));
  }, [bankCashBalance, inTransitGatewayBalance, escrowLiabilityBalance, vatPayableBalance, refundsPayableBalance, monthlyDebtService]);

  // Net Operating Runway (Months)
  const netRunwayMonths = useMemo(() => {
    const estimatedMonthlyOpEx = 95000; // SAR/month platform expenses
    if (estimatedMonthlyOpEx <= 0) return 99;
    return Number((bankCashBalance / estimatedMonthlyOpEx).toFixed(1));
  }, [bankCashBalance]);

  // Escrow Coverage Ratio (Client Money Segregation Guarantee)
  const escrowCoverageRatio = useMemo(() => {
    if (escrowLiabilityBalance <= 0) return 100;
    // Assuming dedicated escrow cash account equals bankCashBalance or a segregated portion
    const dedicatedEscrowCash = bankCashBalance >= escrowLiabilityBalance ? escrowLiabilityBalance : bankCashBalance;
    return Number(((dedicatedEscrowCash / escrowLiabilityBalance) * 100).toFixed(1));
  }, [bankCashBalance, escrowLiabilityBalance]);

  // -------------------------------------------------------------
  // Add Facility & Amortization Calculator Engine
  // -------------------------------------------------------------
  const handleAddFacility = (e: React.FormEvent) => {
    e.preventDefault();
    const principal = parseFloat(principalAmount);
    const rate = parseFloat(profitRate) || 0;
    const months = parseInt(termMonths, 10) || 12;

    if (isNaN(principal) || principal <= 0) {
      if (showNotification) showNotification('error', 'يرجى إدخال مبلغ أصل التمويل بشكل صحيح');
      return;
    }

    const profitTotal = Number(((principal * (rate / 100) * (months / 12))).toFixed(2));
    const totalRepay = Number((principal + profitTotal).toFixed(2));
    const monthlyPay = Number((totalRepay / months).toFixed(2));

    // Generate Amortization Schedule
    const installmentsArr: AmortizationInstallment[] = [];
    let startD = new Date(startDate);

    for (let i = 1; i <= months; i++) {
      startD.setMonth(startD.getMonth() + 1);
      const dueDateStr = startD.toISOString().split('T')[0];
      const pPart = Number((principal / months).toFixed(2));
      const profPart = Number((profitTotal / months).toFixed(2));

      installmentsArr.push({
        installmentNo: i,
        dueDate: dueDateStr,
        principalPart: pPart,
        profitPart: profPart,
        totalPart: monthlyPay,
        status: 'pending'
      });
    }

    // Auto Serial Number EXP-26-0000000XXX
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const nextSeq = (liabilities.length + 101).toString().padStart(10, '0');
    const facilityNo = `EXP-${currentYearShort}-${nextSeq}`;

    const newLiability: CorporateLiability = {
      id: `fac-${Date.now()}`,
      facilityNumber: facilityNo,
      type: facilityType,
      creditorName: creditorName || 'جهة تمويل رسمية',
      principalAmount: principal,
      profitRate: rate,
      profitAmount: profitTotal,
      totalRepaymentAmount: totalRepay,
      repaidAmount: 0,
      remainingAmount: totalRepay,
      termMonths: months,
      startDate,
      dueDate: installmentsArr[installmentsArr.length - 1]?.dueDate || startDate,
      monthlyPayment: monthlyPay,
      status: 'active',
      installments: installmentsArr,
      notes,
      createdAt: new Date().toISOString()
    };

    saveLiabilities([newLiability, ...liabilities]);
    setShowAddLiabilityModal(false);
    resetLiabilityForm();
    if (showNotification) showNotification('success', `تم تسجيل التسهيل المالي برقم ${facilityNo} وجدولة الأقساط بنجاح`);
  };

  const resetLiabilityForm = () => {
    setCreditorName('');
    setPrincipalAmount('');
    setProfitRate('4.5');
    setTermMonths('12');
    setNotes('');
  };

  // Record Installment Repayment & Update Ledger Balance
  const handlePayInstallment = (liabilityId: string | number, installmentNo: number) => {
    const updated = liabilities.map(fac => {
      if (fac.id === liabilityId) {
        const updatedInstallments = fac.installments.map(inst => {
          if (inst.installmentNo === installmentNo && inst.status === 'pending') {
            const currentYearShort = new Date().getFullYear().toString().slice(-2);
            const refNo = `EXP-${currentYearShort}-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
            return {
              ...inst,
              status: 'paid' as const,
              paidAt: new Date().toISOString().split('T')[0],
              paymentReference: refNo
            };
          }
          return inst;
        });

        const repaidSum = updatedInstallments
          .filter(i => i.status === 'paid')
          .reduce((acc, curr) => acc + curr.totalPart, 0);

        const remaining = Math.max(0, fac.totalRepaymentAmount - repaidSum);
        const isFullySettled = remaining <= 0;

        return {
          ...fac,
          repaidAmount: Number(repaidSum.toFixed(2)),
          remainingAmount: Number(remaining.toFixed(2)),
          status: isFullySettled ? ('settled' as const) : fac.status,
          installments: updatedInstallments
        };
      }
      return fac;
    });

    saveLiabilities(updated);
    if (selectedLiabilityForSchedule) {
      const refreshed = updated.find(l => l.id === liabilityId);
      if (refreshed) setSelectedLiabilityForSchedule(refreshed);
    }
    if (showNotification) showNotification('success', 'تم توثيق سداد القسط وتحديث دفتر الأستاذ العام وسداد التسهيل');
  };

  // Add Receivables
  const handleAddReceivable = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(receivableAmount);
    if (isNaN(amt) || amt <= 0 || !partyName) {
      if (showNotification) showNotification('error', 'يرجى إكمال بيانات المستحق والجهة بشكل صحيح');
      return;
    }

    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const seq = Math.floor(1000000000 + Math.random() * 9000000000);
    const recNo = `REV-${currentYearShort}-${seq}`;

    if (receivableType === 'provider') {
      const newRec: ProviderReceivable = {
        id: `pr-${Date.now()}`,
        receivableNumber: recNo,
        providerId: Math.floor(Math.random() * 800) + 100,
        providerName: partyName,
        amount: amt,
        reason: receivableReason as any,
        status: 'outstanding',
        dueDate: receivableDueDate || new Date().toISOString().split('T')[0],
        ageingDays: 0,
        notes,
        createdAt: new Date().toISOString()
      };
      saveProviderReceivables([newRec, ...providerReceivables]);
    } else {
      const newClientRec: ClientReceivable = {
        id: `cr-${Date.now()}`,
        receivableNumber: recNo,
        customerId: Math.floor(Math.random() * 800) + 500,
        customerName: partyName,
        amount: amt,
        paymentType: 'pay_on_arrival',
        status: 'outstanding',
        dueDate: receivableDueDate || new Date().toISOString().split('T')[0],
        ageingDays: 0,
        notes,
        createdAt: new Date().toISOString()
      };
      saveClientReceivables([newClientRec, ...clientReceivables]);
    }

    setShowAddReceivableModal(false);
    setPartyName('');
    setReceivableAmount('');
    if (showNotification) showNotification('success', `تم تسجيل الذمة المالية برقم ${recNo}`);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-800/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600/30 rounded-xl border border-indigo-400/30 text-indigo-300">
                <Landmark className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                  مركز الخزينة والديون والتسهيلات المالية
                  <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                    IFRS / SOCPA Compliant
                  </span>
                </h2>
                <p className="text-indigo-200/80 text-sm mt-1">
                  إدارة سيولة الخزينة، جدولة أصول التمويل بالمرابحة، وتتبع الالتزامات والذمم وفق معايير المحاسبة السعودية
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddLiabilityModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 shadow-lg shadow-indigo-900/30"
            >
              <Plus className="w-4 h-4" />
              إضافة تسهيل/قرض تمويل
            </button>
            <button
              onClick={() => setShowAddReceivableModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-medium transition flex items-center gap-2 border border-slate-700"
            >
              <Plus className="w-4 h-4 text-emerald-400" />
              إصدار مطالبة ذمة مالية
            </button>
          </div>
        </div>

        {/* Quick Ticker Highlights */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-indigo-800/40">
          <div className="bg-slate-800/50 p-3 rounded-xl border border-indigo-900/50">
            <span className="text-xs text-indigo-300">النقد المتاح بالبنك</span>
            <div className="text-lg font-bold text-emerald-400 mt-1">{bankCashBalance.toLocaleString('ar-SA')} ر.س</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-indigo-900/50">
            <span className="text-xs text-indigo-300">تسويات البوابات قيد الترنزيت</span>
            <div className="text-lg font-bold text-amber-300 mt-1">{inTransitGatewayBalance.toLocaleString('ar-SA')} ر.س</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-indigo-900/50">
            <span className="text-xs text-indigo-300">أمانات الشركاء (Escrow)</span>
            <div className="text-lg font-bold text-indigo-300 mt-1">{escrowLiabilityBalance.toLocaleString('ar-SA')} ر.س</div>
          </div>
          <div className="bg-slate-800/50 p-3 rounded-xl border border-indigo-900/50">
            <span className="text-xs text-indigo-300">إجمالي التسهيلات والديون</span>
            <div className="text-lg font-bold text-rose-300 mt-1">{totalCorporateLiabilities.toLocaleString('ar-SA')} ر.س</div>
          </div>
        </div>
      </div>

      {/* Internal Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          مؤشرات الصحة والسيولة المالية
        </button>
        <button
          onClick={() => setActiveTab('liabilities')}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'liabilities'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          التسهيلات والديون المجدولة ({liabilities.length})
        </button>
        <button
          onClick={() => setActiveTab('receivables')}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'receivables'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          مستحقات وذمم المنصة ({providerReceivables.length + clientReceivables.length})
        </button>
        <button
          onClick={() => setActiveTab('ageing')}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'ageing'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          تحليل تقادم الديون (Ageing 30/60/90)
        </button>
      </div>

      {/* TAB 1: OVERVIEW & HEALTH METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          
          {/* 6 Key Financial Health Threshold Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            
            {/* KPI 1: D/E Ratio */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">نسبة الدين إلى الملكية</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{debtToEquityRatio}</h4>
                </div>
                <div className={`p-2.5 rounded-xl ${debtToEquityRatio < 1.5 ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40' : 'bg-amber-50 text-amber-600'}`}>
                  <Percent className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">النطاق الآمن: أقل من 1.50</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${debtToEquityRatio < 1.5 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                  {debtToEquityRatio < 1.5 ? 'ممتاز (آمن)' : 'تنبيه ارتقاع الدين'}
                </span>
              </div>
            </div>

            {/* KPI 2: DSCR Ratio */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">نسبة تغطية خدمة الدين (DSCR)</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{dscrRatio}x</h4>
                </div>
                <div className={`p-2.5 rounded-xl ${dscrRatio >= 1.25 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">الحد الأدنى المطلوب: أعلى من 1.25</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${dscrRatio >= 1.25 ? 'text-emerald-600 bg-emerald-50' : 'text-rose-600 bg-rose-50'}`}>
                  {dscrRatio >= 1.25 ? 'قدرة عالية على السداد' : 'انخفاض التغطية'}
                </span>
              </div>
            </div>

            {/* KPI 3: Quick Ratio */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">نسبة السيولة السريعة (Quick Ratio)</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{quickRatio}</h4>
                </div>
                <div className={`p-2.5 rounded-xl ${quickRatio >= 1.0 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">المعيار المطلوب: أعلى من 1.00</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${quickRatio >= 1.0 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                  {quickRatio >= 1.0 ? 'سيولة فورية كافية' : 'تنبيه سيولة'}
                </span>
              </div>
            </div>

            {/* KPI 4: Net Operating Runway */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">هامش السيولة التشغيلية (Runway)</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{netRunwayMonths} شهر</h4>
                </div>
                <div className={`p-2.5 rounded-xl ${netRunwayMonths >= 6 ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">الحد الآمن: 6 أشهر فأكثر</span>
                <span className={`font-semibold px-2 py-0.5 rounded ${netRunwayMonths >= 6 ? 'text-emerald-600 bg-emerald-50' : 'text-amber-600 bg-amber-50'}`}>
                  {netRunwayMonths >= 6 ? 'استقرار تشغيلي طويل' : 'تغطية منخفضة'}
                </span>
              </div>
            </div>

            {/* KPI 5: Escrow Coverage Ratio (Client Money Segregation) */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm border-r-4 border-r-indigo-600">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">مؤشر أمان محفظة الضمان (Escrow)</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{escrowCoverageRatio}%</h4>
                </div>
                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-xl">
                  <ShieldCheck className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">شرط ساما والربط التنظيمي: 100%</span>
                <span className="font-semibold px-2 py-0.5 rounded text-emerald-600 bg-emerald-50">
                  فصل كامل لأموال الشركاء
                </span>
              </div>
            </div>

            {/* KPI 6: Net Debt */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">صافي الدين (Net Debt)</span>
                  <h4 className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1">{netDebt.toLocaleString('ar-SA')} ر.س</h4>
                </div>
                <div className="p-2.5 bg-slate-100 text-slate-700 rounded-xl">
                  <PieChart className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-3 text-xs flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-slate-500">التسهيلات - النقد المتاح</span>
                <span className="font-semibold px-2 py-0.5 rounded text-indigo-600 bg-indigo-50">
                  مغطى بالنقدية
                </span>
              </div>
            </div>

          </div>

          {/* SOCPA / IFRS Assets & Liabilities Balance Sheet Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* ASSETS COLUMN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">الموجودات والأصول (Assets)</h3>
                </div>
                <span className="text-sm font-black text-emerald-600">{totalAssets.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">النقد وما في حكمه (Liquid Bank Cash)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{bankCashBalance.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">تسويات البوابات قيد الترنزيت (In Transit - 24-72h)</span>
                  <span className="font-bold text-amber-600">{inTransitGatewayBalance.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">مستحقات وذمم المزودين (Provider Receivables)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{totalProviderReceivables.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">ذمم العملاء الآجلة (Client Receivables)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{totalClientReceivables.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>
            </div>

            {/* LIABILITIES COLUMN */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">الالتزامات والخصوم (Liabilities)</h3>
                </div>
                <span className="text-sm font-black text-rose-600">{totalLiabilities.toLocaleString('ar-SA')} ر.س</span>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">أمانات الشركاء المعلقة (Escrow Liability)</span>
                  <span className="font-bold text-indigo-600">{escrowLiabilityBalance.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">أمانات ضريبة القيمة المضافة (VAT Payable)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{vatPayableBalance.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">التزامات الاسترداد للعملاء (Refunds Payable)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{refundsPayableBalance.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <span className="text-sm text-slate-600 dark:text-slate-300">التسهيلات والقروض المجدولة (Corporate Debt)</span>
                  <span className="font-bold text-rose-600">{totalCorporateLiabilities.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>
            </div>

          </div>

          {/* Balance Cushion Footer Banner */}
          <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-2xl p-5 border border-indigo-200 dark:border-indigo-800 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-indigo-600 text-white rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-200">صافي رأس المال العامل وهامش الأمان (Net Capital Cushion)</h4>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 mt-0.5">
                  فارق الأصول المحققة مقابل الخصوم والتسهيلات وفق القوائم المالية المعتمدة
                </p>
              </div>
            </div>
            <div className="text-xl font-black text-indigo-900 dark:text-indigo-100 bg-white dark:bg-indigo-900/60 px-5 py-2.5 rounded-xl border border-indigo-200 dark:border-indigo-700">
              +{netEquity.toLocaleString('ar-SA')} ر.س
            </div>
          </div>

        </div>
      )}

      {/* TAB 2: CORPORATE LIABILITIES & AMORTIZATION CALCULATOR */}
      {activeTab === 'liabilities' && (
        <div className="space-y-6">
          
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">سجل التسهيلات المالي والديون المجدولة</h3>
              <p className="text-xs text-slate-500 mt-0.5">جدولة أقساط المرابحة والتمويل البنكي والتزامات نهاية الخدمة</p>
            </div>
            <button
              onClick={() => setShowAddLiabilityModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              إضافة تمويل جديد
            </button>
          </div>

          {/* Liabilities Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800 text-xs">
                <tr>
                  <th className="p-4">رقم التسهيل/المرجع</th>
                  <th className="p-4">جهة التمويل / الدائن</th>
                  <th className="p-4">أصل التمويل</th>
                  <th className="p-4">معدل المرابحة</th>
                  <th className="p-4">القسط الشهري</th>
                  <th className="p-4">المسدد</th>
                  <th className="p-4">المتبقي</th>
                  <th className="p-4">الحالة</th>
                  <th className="p-4 text-left">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {liabilities.map((fac) => (
                  <tr key={fac.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="p-4 font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                      {fac.facilityNumber}
                    </td>
                    <td className="p-4 font-medium text-slate-800 dark:text-slate-200">
                      {fac.creditorName}
                    </td>
                    <td className="p-4 text-slate-700 dark:text-slate-300">
                      {fac.principalAmount.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="p-4 font-semibold text-amber-600">
                      %{fac.profitRate}
                    </td>
                    <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                      {fac.monthlyPayment.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="p-4 text-emerald-600 font-semibold">
                      {fac.repaidAmount.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="p-4 font-bold text-rose-600">
                      {fac.remainingAmount.toLocaleString('ar-SA')} ر.س
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        fac.status === 'active' ? 'bg-indigo-50 text-indigo-600 border border-indigo-200' :
                        fac.status === 'settled' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {fac.status === 'active' ? 'نشط ومجدول' : fac.status === 'settled' ? 'مسدد بالكامل' : fac.status}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <button
                        onClick={() => setSelectedLiabilityForSchedule(fac)}
                        className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                      >
                        جدول الإطفاء ({fac.installments.length})
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: RECEIVABLES */}
      {activeTab === 'receivables' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Provider Receivables */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-indigo-600" />
                  مستحقات وذمم الشركاء والمزودين
                </h4>
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
                  {totalProviderReceivables.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="space-y-2">
                {providerReceivables.map(pr => (
                  <div key={pr.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{pr.providerName}</div>
                      <div className="text-slate-400 font-mono mt-0.5">{pr.receivableNumber} - {pr.notes}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-slate-800 dark:text-slate-100">{pr.amount.toLocaleString('ar-SA')} ر.س</div>
                      <span className="text-amber-600 font-semibold">{pr.ageingDays} يوم متأخر</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client Receivables */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  ذمم العملاء الآجلة (الدفع عند الوصول)
                </h4>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                  {totalClientReceivables.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="space-y-2">
                {clientReceivables.map(cr => (
                  <div key={cr.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">{cr.customerName}</div>
                      <div className="text-slate-400 font-mono mt-0.5">{cr.receivableNumber} - {cr.notes}</div>
                    </div>
                    <div className="text-left">
                      <div className="font-black text-slate-800 dark:text-slate-100">{cr.amount.toLocaleString('ar-SA')} ر.س</div>
                      <span className="text-emerald-600 font-semibold">استحقاق عند الوصول</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* TAB 4: AGEING ANALYSIS (30/60/90) */}
      {activeTab === 'ageing' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">تحليل تقادم الديون والذمم (Ageing Buckets)</h3>
            <p className="text-xs text-slate-500 mb-6">تصنيف الذمم المالية المستحقة للمنصة حسب فترات التأخير لمعالجة التحصيل ومخصص الديون التعثرة</p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Bucket 1: 0-30 Days */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20">
                <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300">0 - 30 يوم (حال/جاري)</span>
                <div className="text-xl font-black text-emerald-900 dark:text-emerald-100 mt-2">12,000 ر.س</div>
                <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">1 ذمة قائمة</p>
              </div>

              {/* Bucket 2: 31-60 Days */}
              <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
                <span className="text-xs font-bold text-amber-700 dark:text-amber-300">31 - 60 يوم (تأخير طفيف)</span>
                <div className="text-xl font-black text-amber-900 dark:text-amber-100 mt-2">8,500 ر.س</div>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">1 مطالبة عمولة</p>
              </div>

              {/* Bucket 3: 61-90 Days */}
              <div className="p-4 rounded-xl border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20">
                <span className="text-xs font-bold text-orange-700 dark:text-orange-300">61 - 90 يوم (يحتاج متابعة)</span>
                <div className="text-xl font-black text-orange-900 dark:text-orange-100 mt-2">15,000 ر.س</div>
                <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">تأكيدات المتابعة</p>
              </div>

              {/* Bucket 4: +90 Days */}
              <div className="p-4 rounded-xl border border-rose-200 bg-rose-50/50 dark:bg-rose-950/20">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-300">+90 يوم (تعثر/مشكوك فيه)</span>
                <div className="text-xl font-black text-rose-900 dark:text-rose-100 mt-2">0 ر.س</div>
                <p className="text-xs text-rose-600 dark:text-rose-400 mt-1">مخصص ديون معدومة 0%</p>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD FACILITY / AMORTIZATION CALCULATOR */}
      {showAddLiabilityModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-5">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                <Landmark className="w-5 h-5 text-indigo-600" />
                إضافة تسهيل تمويلي / مرابحة جديد
              </h3>
              <button onClick={() => setShowAddLiabilityModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleAddFacility} className="space-y-4 text-xs">
              
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نوع التسهيل التمويلي</label>
                <select
                  value={facilityType}
                  onChange={(e: any) => setFacilityType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                >
                  <option value="murabaha">تمويل مرابحة إسلامية (Murabaha)</option>
                  <option value="bank_facility">تسهيلات بنكية سريعة (Bank Facility)</option>
                  <option value="end_of_service">مخصص مكافأة نهاية الخدمة (End of Service)</option>
                  <option value="operational_debt">قروض وتشغيل ديون منصة (Operational Debt)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">جهة التمويل / الدائن</label>
                <input
                  type="text"
                  placeholder="مثال: مصرف الراجحي / البنك الأهلي"
                  value={creditorName}
                  onChange={e => setCreditorName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">أصل التمويل (ر.س)</label>
                  <input
                    type="number"
                    placeholder="500000"
                    value={principalAmount}
                    onChange={e => setPrincipalAmount(e.target.value)}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">نسبة الربح سنوي (%)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={profitRate}
                    onChange={e => setProfitRate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">مدة السداد (أشهر)</label>
                  <input
                    type="number"
                    value={termMonths}
                    onChange={e => setTermMonths(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">ملاحظات والتفاصيل</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="ملاحظات العقد والشرط الجزائي إن وجد..."
                  rows={2}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddLiabilityModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl font-semibold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-500 transition"
                >
                  احتساب وجدولة التمويل
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD RECEIVABLE */}
      {showAddReceivableModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-800 dark:text-slate-100 text-base">إصدار مطالبة ذمة مالية جديدة</h3>
              <button onClick={() => setShowAddReceivableModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleAddReceivable} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">نوع الذمة المالية</label>
                <select
                  value={receivableType}
                  onChange={(e: any) => setReceivableType(e.target.value)}
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                >
                  <option value="provider">مستحق على مزود / شريك (Provider Receivable)</option>
                  <option value="client">ذمة مستحقة على عميل (Client Receivable)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold mb-1">اسم الطرف المستحق عليه</label>
                <input
                  type="text"
                  placeholder="اسم القاعة / الشريك / العميل"
                  value={partyName}
                  onChange={e => setPartyName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold mb-1">المبلغ المطلوب (ر.س)</label>
                <input
                  type="number"
                  placeholder="1000"
                  value={receivableAmount}
                  onChange={e => setReceivableAmount(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border bg-slate-50 dark:bg-slate-800 font-bold"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddReceivableModal(false)} className="px-4 py-2 bg-slate-100 rounded-xl">إلغاء</button>
                <button type="submit" className="px-5 py-2 bg-indigo-600 text-white rounded-xl">تسجيل الذمة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DRAWER / MODAL: AMORTIZATION SCHEDULE DETAILS */}
      {selectedLiabilityForSchedule && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-right space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg">
                  جدول إطفاء السداد (Amortization Schedule)
                </h3>
                <p className="text-xs text-slate-500">{selectedLiabilityForSchedule.creditorName} ({selectedLiabilityForSchedule.facilityNumber})</p>
              </div>
              <button onClick={() => setSelectedLiabilityForSchedule(null)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <div className="grid grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-slate-400">إجمالي التمويل:</span>
                <div className="font-bold text-slate-800 dark:text-slate-100">{selectedLiabilityForSchedule.totalRepaymentAmount.toLocaleString('ar-SA')} ر.س</div>
              </div>
              <div>
                <span className="text-slate-400">إجمالي المسدد:</span>
                <div className="font-bold text-emerald-600">{selectedLiabilityForSchedule.repaidAmount.toLocaleString('ar-SA')} ر.س</div>
              </div>
              <div>
                <span className="text-slate-400">المتبقي المطلوب:</span>
                <div className="font-bold text-rose-600">{selectedLiabilityForSchedule.remainingAmount.toLocaleString('ar-SA')} ر.س</div>
              </div>
            </div>

            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100 dark:bg-slate-800 text-slate-500 font-semibold">
                <tr>
                  <th className="p-3">رقم القسط</th>
                  <th className="p-3">تاريخ الاستحقاق</th>
                  <th className="p-3">جزء الأصل</th>
                  <th className="p-3">جزء المرابحة</th>
                  <th className="p-3">إجمالي القسط</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3 text-left">الإجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {selectedLiabilityForSchedule.installments.map((inst) => (
                  <tr key={inst.installmentNo} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="p-3 font-bold">{inst.installmentNo}</td>
                    <td className="p-3 font-mono">{inst.dueDate}</td>
                    <td className="p-3">{inst.principalPart.toLocaleString('ar-SA')} ر.س</td>
                    <td className="p-3 text-amber-600">{inst.profitPart.toLocaleString('ar-SA')} ر.س</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-100">{inst.totalPart.toLocaleString('ar-SA')} ر.s</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                        inst.status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {inst.status === 'paid' ? 'مسدد' : 'مستحق/قيد الانتظار'}
                      </span>
                    </td>
                    <td className="p-3 text-left">
                      {inst.status === 'pending' ? (
                        <button
                          onClick={() => handlePayInstallment(selectedLiabilityForSchedule.id, inst.installmentNo)}
                          className="px-3 py-1 bg-emerald-600 text-white rounded text-[10px] font-semibold hover:bg-emerald-500"
                        >
                          توثيق سداد القسط
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-mono">{inst.paymentReference}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  );
}
