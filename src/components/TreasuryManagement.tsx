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
  totalPlatformRevenue?: number;
  totalPlatformExpense?: number;
  netProfit?: number;
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
  refundsPayableBalance = 15000,
  totalPlatformRevenue = 0,
  totalPlatformExpense = 0,
  netProfit = 0
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
  const [activeTab, setActiveTab] = useState<'overview' | 'liabilities' | 'receivables' | 'ageing' | 'sama_rules'>('overview');
  const [showAddLiabilityModal, setShowAddLiabilityModal] = useState(false);
  const [showAddReceivableModal, setShowAddReceivableModal] = useState(false);
  const [selectedLiabilityForSchedule, setSelectedLiabilityForSchedule] = useState<CorporateLiability | null>(null);

  // SAMA Early Settlement & Rescheduling State
  const [selectedLiabilityForSettlement, setSelectedLiabilityForSettlement] = useState<CorporateLiability | null>(null);
  const [settlementMode, setSettlementMode] = useState<'full' | 'partial' | 'reschedule'>('full');
  const [thirdPartyFees, setThirdPartyFees] = useState<string>('0');
  const [partialMultiples, setPartialMultiples] = useState<number>(1);
  const [partialStrategy, setPartialStrategy] = useState<'reduce_payment' | 'shorten_tenure'>('reduce_payment');
  const [rescheduleNewTermMonths, setRescheduleNewTermMonths] = useState<string>('12');
  const [rescheduleNewRate, setRescheduleNewRate] = useState<string>('3.5');
  const [rescheduleGraceMonths, setRescheduleGraceMonths] = useState<string>('0');
  const [settlementNotes, setSettlementNotes] = useState<string>('');

  // SAMA Settlement Certificate View Modal
  const [viewCertificateLiability, setViewCertificateLiability] = useState<CorporateLiability | null>(null);

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
    const annualNOI = netProfit > 0 
      ? (netProfit * 12) 
      : (totalPlatformRevenue > 0 ? (totalPlatformRevenue - totalPlatformExpense) * 12 : 1450000);
    return Number((Math.max(1, annualNOI) / annualDebtService).toFixed(2));
  }, [monthlyDebtService, netProfit, totalPlatformRevenue, totalPlatformExpense]);

  // Quick Ratio = (Cash + Gateway In-Transit) / Current Liabilities
  const quickRatio = useMemo(() => {
    const currentLiabilities = escrowLiabilityBalance + vatPayableBalance + refundsPayableBalance + (monthlyDebtService * 12);
    if (currentLiabilities <= 0) return 99;
    return Number(((bankCashBalance + inTransitGatewayBalance) / currentLiabilities).toFixed(2));
  }, [bankCashBalance, inTransitGatewayBalance, escrowLiabilityBalance, vatPayableBalance, refundsPayableBalance, monthlyDebtService]);

  // Net Operating Runway (Months)
  const netRunwayMonths = useMemo(() => {
    const monthlyOpEx = totalPlatformExpense > 0 ? totalPlatformExpense : 95000;
    if (monthlyOpEx <= 0) return 99;
    return Number((bankCashBalance / monthlyOpEx).toFixed(1));
  }, [bankCashBalance, totalPlatformExpense]);

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

  // -------------------------------------------------------------
  // SAMA Early Settlement & Rescheduling Engine Execution Handlers
  // -------------------------------------------------------------

  // 1. SAMA Full Early Settlement Handler
  const handleExecuteFullEarlySettlement = (liability: CorporateLiability) => {
    const pendingInsts = liability.installments.filter(i => i.status === 'pending');
    const outstandingPrincipal = pendingInsts.reduce((a, b) => a + b.principalPart, 0);
    const remainingProfit = pendingInsts.reduce((a, b) => a + b.profitPart, 0);

    // SAMA Rule: Reinvestment compensation capped at max 3 months profit
    const compMonths = Math.min(pendingInsts.length, 3);
    const reinvestmentCompFee = pendingInsts.slice(0, compMonths).reduce((a, b) => a + b.profitPart, 0);
    const tpFees = parseFloat(thirdPartyFees) || 0;

    const waivedProfit = remainingProfit - reinvestmentCompFee;
    const netSettledAmount = Number((outstandingPrincipal + reinvestmentCompFee + tpFees).toFixed(2));
    const savingsAmount = Number((liability.remainingAmount - netSettledAmount).toFixed(2));

    // Generate AGENTS.md compliant serial numbers
    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const seq10 = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const invNo = `INV-${currentYearShort}${seq10}`; // INV-YYXXXXXXXXXX (No hyphen after YY)
    const revNo = `REV-${currentYearShort}-${seq10}`; // REV-YY-XXXXXXXXXX
    const expNo = `EXP-${currentYearShort}-${seq10}`; // EXP-YY-XXXXXXXXXX

    // Mark remaining installments as paid with early settlement note
    const updatedInstallments: AmortizationInstallment[] = liability.installments.map(inst => {
      if (inst.status === 'pending') {
        return {
          ...inst,
          status: 'paid' as const,
          paidAt: new Date().toISOString().split('T')[0],
          paymentReference: `${expNo}-SAMA-SETTLED`
        };
      }
      return inst;
    });

    const settlementDetails = {
      settlementDate: new Date().toISOString().split('T')[0],
      waivedProfit: Number(waivedProfit.toFixed(2)),
      compensationFee: Number(reinvestmentCompFee.toFixed(2)),
      thirdPartyFees: tpFees,
      netSettledAmount,
      savingsAmount,
      settlementInvoiceNo: invNo,
      revenueNo: revNo,
      expenseNo: expNo,
      notes: settlementNotes || 'تم السداد المبكر الكامل وإسقاط كلفة الأجل المتبقية وفق المادة 11 من ضوابط ساما'
    };

    const updatedLiabilities = liabilities.map(l => {
      if (l.id === liability.id) {
        return {
          ...l,
          repaidAmount: l.totalRepaymentAmount,
          remainingAmount: 0,
          status: 'early_settled' as const,
          installments: updatedInstallments,
          earlySettlementDetails: settlementDetails
        };
      }
      return l;
    });

    saveLiabilities(updatedLiabilities);
    setSelectedLiabilityForSettlement(null);
    const updatedObj = updatedLiabilities.find(l => l.id === liability.id);
    if (updatedObj) setViewCertificateLiability(updatedObj);

    if (showNotification) {
      showNotification(
        'success',
        `تم تنفيذ السداد المبكر الكامل بنجاح وفق ضوابط ساما! تم إبراء ${waivedProfit.toLocaleString('ar-SA')} ر.س أرباح وتحقيق وفر قدره ${savingsAmount.toLocaleString('ar-SA')} ر.س (مرجع الفاتورة: ${invNo})`
      );
    }
  };

  // 2. SAMA Partial Early Settlement Handler
  const handleExecutePartialEarlySettlement = (liability: CorporateLiability) => {
    const monthlyAmt = liability.monthlyPayment;
    const partialAmt = Number((partialMultiples * monthlyAmt).toFixed(2));

    if (partialAmt <= 0 || partialAmt >= liability.remainingAmount) {
      if (showNotification) showNotification('error', 'مبلغ السداد الجزئي يجب أن يكون أقل من باقي أصل الدين وأكبر من قسط واحد');
      return;
    }

    const currentYearShort = new Date().getFullYear().toString().slice(-2);
    const seq10 = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    const expNo = `EXP-${currentYearShort}-${seq10}`;

    // Mark paid installments equal to partialMultiples
    let countToMark = partialMultiples;
    const updatedInstallments = liability.installments.map(inst => {
      if (inst.status === 'pending' && countToMark > 0) {
        countToMark--;
        return {
          ...inst,
          status: 'paid' as const,
          paidAt: new Date().toISOString().split('T')[0],
          paymentReference: `${expNo}-PARTIAL`
        };
      }
      return inst;
    });

    const newRepaidSum = updatedInstallments
      .filter(i => i.status === 'paid')
      .reduce((a, b) => a + b.totalPart, 0);

    const newRemainingAmount = Math.max(0, liability.totalRepaymentAmount - newRepaidSum);

    const updatedLiabilities = liabilities.map(l => {
      if (l.id === liability.id) {
        return {
          ...l,
          repaidAmount: Number(newRepaidSum.toFixed(2)),
          remainingAmount: Number(newRemainingAmount.toFixed(2)),
          installments: updatedInstallments,
          notes: `${l.notes || ''} [تم سداد جزئي بمبلغ ${partialAmt} ر.س يعادل ${partialMultiples} قسط وفق المادة 11 ضوابط ساما]`
        };
      }
      return l;
    });

    saveLiabilities(updatedLiabilities);
    setSelectedLiabilityForSettlement(null);
    if (showNotification) {
      showNotification(
        'success',
        `تم تسجيل وتوثيق السداد الجزئي بمبلغ ${partialAmt.toLocaleString('ar-SA')} ر.س (${partialMultiples} أقساط) آلياً وفق ضوابط ساما`
      );
    }
  };

  // 3. Debt Rescheduling Handler
  const handleExecuteRescheduling = (liability: CorporateLiability) => {
    const newTerm = parseInt(rescheduleNewTermMonths, 10) || liability.termMonths;
    const newRate = parseFloat(rescheduleNewRate) || liability.profitRate;

    const remainingPrincipal = liability.remainingAmount;
    const profitTotal = Number(((remainingPrincipal * (newRate / 100) * (newTerm / 12))).toFixed(2));
    const newTotalRepayment = Number((remainingPrincipal + profitTotal).toFixed(2));
    const newMonthlyPayment = Number((newTotalRepayment / newTerm).toFixed(2));

    const newInstallments: AmortizationInstallment[] = [];
    let currD = new Date();
    for (let i = 1; i <= newTerm; i++) {
      currD.setMonth(currD.getMonth() + 1);
      const dueDateStr = currD.toISOString().split('T')[0];
      newInstallments.push({
        installmentNo: i,
        dueDate: dueDateStr,
        principalPart: Number((remainingPrincipal / newTerm).toFixed(2)),
        profitPart: Number((profitTotal / newTerm).toFixed(2)),
        totalPart: newMonthlyPayment,
        status: 'pending'
      });
    }

    const updatedLiabilities = liabilities.map(l => {
      if (l.id === liability.id) {
        return {
          ...l,
          principalAmount: remainingPrincipal,
          profitRate: newRate,
          profitAmount: profitTotal,
          totalRepaymentAmount: newTotalRepayment,
          monthlyPayment: newMonthlyPayment,
          termMonths: newTerm,
          installments: newInstallments,
          notes: `${l.notes || ''} [تمت إعادة جدولة الدين على ${newTerm} شهراً وبنسبة مرابحة ${newRate}%]`
        };
      }
      return l;
    });

    saveLiabilities(updatedLiabilities);
    setSelectedLiabilityForSettlement(null);
    if (showNotification) {
      showNotification(
        'success',
        `تمت إعادة الجدولة وتعديل القسط إلى ${newMonthlyPayment.toLocaleString('ar-SA')} ر.س/شهرياً بنجاح`
      );
    }
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
        <button
          onClick={() => setActiveTab('sama_rules')}
          className={`pb-3 px-4 text-sm font-medium transition border-b-2 flex items-center gap-2 ${
            activeTab === 'sama_rules'
              ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          ضوابط السداد المبكر (SAMA Rulebook 🏛️)
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
                        fac.status === 'early_settled' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold' :
                        fac.status === 'settled' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {fac.status === 'active' ? 'نشط ومجدول' : fac.status === 'early_settled' ? 'سداد مبكر (ساما SAMA)' : fac.status === 'settled' ? 'مسدد بالكامل' : fac.status}
                      </span>
                    </td>
                    <td className="p-4 text-left">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setSelectedLiabilityForSchedule(fac)}
                          className="px-2.5 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg text-xs font-semibold transition"
                        >
                          جدول الإطفاء ({fac.installments.length})
                        </button>
                        {fac.status === 'active' && (
                          <button
                            onClick={() => {
                              setSelectedLiabilityForSettlement(fac);
                              setSettlementMode('full');
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            سداد مبكر / جدولة
                          </button>
                        )}
                        {(fac.status === 'early_settled' || fac.earlySettlementDetails) && (
                          <button
                            onClick={() => setViewCertificateLiability(fac)}
                            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            شهادة المخالصة
                          </button>
                        )}
                      </div>
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

      {/* TAB 5: SAMA RULEBOOK & EARLY SETTLEMENT ENGINE */}
      {activeTab === 'sama_rules' && (
        <div className="space-y-6">
          
          {/* Top SAMA Banner */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 p-6 rounded-2xl text-white shadow-xl border border-emerald-800/40">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-emerald-300">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-2">
                    ضوابط البنك المركزي السعودي (SAMA) للسداد المبكر وإعادة الجدولة
                    <span className="text-xs font-mono px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30">
                      Rulebook Article 11
                    </span>
                  </h3>
                  <p className="text-slate-300 text-xs mt-1">
                    المعايير والأنظمة المعتمدة لتعجيل سداد التسهيلات البنكية والمرابحات وإسقاط كلفة الأجل المؤجلة
                  </p>
                </div>
              </div>
              <a
                href="https://rulebook.sama.gov.sa/ar/%D8%A3%D8%B3%D8%A6%D9%84%D8%A9-%D9%85%D8%AA%D9%83%D8%B1%D8%B1%D8%A9"
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-lg"
              >
                الدليل التنظيمي الرسمي لساما (SAMA Rulebook)
                <ArrowUpRight className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* SAMA Rulebook Articles Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* Article 1: Full Early Settlement & Waiver */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 flex items-center justify-center font-mono">03</div>
                <h4>السداد المبكر الكامل وإسقاط فوائد/مرابحة المدة المتبقية</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "يجوز للمستفيد تعجيل سداد كامل الرصيد المتبقي من مبلغ التمويل، في أي وقت، دون تحميله كلفة الأجل عن المدة الباقية، ولكن يتم تعويض جهة التمويل عن كلفة إعادة الاستثمار بما لا يتجاوز كلفة الأجل للأشهر الثلاثة التالية للسداد بالإضافة إلى ما تدفعه جهة التمويل لطرف ثالث بسبب عقد التمويل."
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>يتم تطبيق معادلة خصم أرباح المرابحة تلقائياً في محرك الخزينة مع حصر التعويض بـ 3 أشهر فقط.</span>
              </div>
            </div>

            {/* Article 2: Partial Early Settlement & Multiples */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 flex items-center justify-center font-mono">04</div>
                <h4>السداد المبكر الجزئي بمضاعفات القسط الشهري</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "لا يوجد في أنظمة التمويل ولوائحها التنفيذية ما يمنع السداد المبكر لجزء من المبلغ المتبقي من التمويل. وأوجبت ضوابط التمويل الاستهلاكي المحدثة في الفقرة الأولى من المادة الحادية عشرة جهة التمويل قبول أي سداد بموجب عقد التمويل قبل تاريخ استحقاقها كسداد جزئي بما يعادل قسط واحد أو مضاعفاته."
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-indigo-500" />
                <span>إمكانية اختيار خفض قيمة القسط الشهري أو تقليص مدة وعدد أشهر العقد عند السداد الجزئي.</span>
              </div>
            </div>

            {/* Article 3: Lockout Period Rules */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center font-mono">05</div>
                <h4>ضوابط فترة حظر السداد المبكر (الحد الأقصى سنتين)</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "يجوز أن ينص عقد التمويل العقاري على فترة يحظر فيها السداد المبكر، بشرط ألا تتجاوز مدة الحظر سنتين من تاريخ إبرام عقد التمويل العقاري. كما ينطبق ذلك على الإيجار التمويلي إذا كان محل العقد عقاراً."
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>لا يوجد أي فترة حظر للتسهيلات التجارية والتمويل الاستهلاكي العام، ويتاح السداد فوراً.</span>
              </div>
            </div>

            {/* Article 4: Mandatory Acceptance */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
                <div className="w-7 h-7 rounded-lg bg-purple-50 dark:bg-purple-950/40 flex items-center justify-center font-mono">06</div>
                <h4>إلزامية قبول الطلب وحظر الرفض من جهة التمويل</h4>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                "لا يجوز لجهة التمويل رفض السداد المبكر للمبلغ المتبقي من التمويل في حالة طلب المستفيد ذلك، ولكن يجوز أن ينص عقد التمويل العقاري على فترة يحظر فيها السداد المبكر بحيث لا تتجاوز هذه الفترة سنتين من تاريخ إبرام عقد التمويل."
              </p>
              <div className="text-[11px] text-slate-500 flex items-center gap-2 pt-1">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>حق نظامي ملزم لجميع المؤسسات المالية والمصارف المرخصة بالمملكة.</span>
              </div>
            </div>

          </div>

          {/* SAMA Test Bench Launcher */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h4 className="font-bold text-slate-800 dark:text-slate-100 text-base mb-2">
              تشغيل محرك السداد المبكر التفاعلي للتسهيلات الحالية
            </h4>
            <p className="text-xs text-slate-500 mb-4">
              اختر أي تمويل نشط لاحتساب أرباح المرابحة الملغاة وصافي المبلغ المطلوب تعجيل سداده وفق ضوابط ساما
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {liabilities.filter(l => l.status === 'active').map(fac => (
                <div key={fac.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center">
                  <div>
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-sm">{fac.creditorName}</div>
                    <div className="text-xs text-indigo-600 font-mono mt-0.5">{fac.facilityNumber}</div>
                    <div className="text-xs text-slate-500 mt-1">المتبقي: {fac.remainingAmount.toLocaleString('ar-SA')} ر.س ({fac.installments.filter(i => i.status === 'pending').length} أقساط)</div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedLiabilityForSettlement(fac);
                      setSettlementMode('full');
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    احسب السداد المبكر
                  </button>
                </div>
              ))}
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

      {/* SAMA EARLY SETTLEMENT & RESCHEDULING ENGINE MODAL */}
      {selectedLiabilityForSettlement && (() => {
        const fac = selectedLiabilityForSettlement;
        const pendingInsts = fac.installments.filter(i => i.status === 'pending');
        const outstandingPrincipal = pendingInsts.reduce((a, b) => a + b.principalPart, 0);
        const remainingProfit = pendingInsts.reduce((a, b) => a + b.profitPart, 0);

        // SAMA Capped Compensation for Reinvestment (Max 3 Months Profit)
        const compMonths = Math.min(pendingInsts.length, 3);
        const reinvestmentCompFee = pendingInsts.slice(0, compMonths).reduce((a, b) => a + b.profitPart, 0);
        const tpFees = parseFloat(thirdPartyFees) || 0;

        const waivedProfit = remainingProfit - reinvestmentCompFee;
        const netSettledAmount = Number((outstandingPrincipal + reinvestmentCompFee + tpFees).toFixed(2));
        const savingsAmount = Number((fac.remainingAmount - netSettledAmount).toFixed(2));

        return (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-4xl p-6 shadow-2xl border border-emerald-500/30 text-right space-y-5 max-h-[92vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
                      حاسبة ومحرك السداد المبكر وفق ضوابط (SAMA)
                      <span className="text-xs font-mono bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300">
                        مادة 11 - ساما
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500">
                      جهة التمويل: {fac.creditorName} | المرجع: <span className="font-mono text-indigo-600 dark:text-indigo-400 font-bold">{fac.facilityNumber}</span>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedLiabilityForSettlement(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
                >
                  ✕
                </button>
              </div>

              {/* Mode Selection Tabs */}
              <div className="grid grid-cols-3 gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl text-xs font-bold">
                <button
                  onClick={() => setSettlementMode('full')}
                  className={`py-2 rounded-lg transition ${settlementMode === 'full' ? 'bg-emerald-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  سداد مبكر كامل (إسقاط كلفة الأجل)
                </button>
                <button
                  onClick={() => setSettlementMode('partial')}
                  className={`py-2 rounded-lg transition ${settlementMode === 'partial' ? 'bg-indigo-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  سداد مبكر جزئي (مضاعفات القسط)
                </button>
                <button
                  onClick={() => setSettlementMode('reschedule')}
                  className={`py-2 rounded-lg transition ${settlementMode === 'reschedule' ? 'bg-amber-600 text-white shadow' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                >
                  إعادة جدولة الدين
                </button>
              </div>

              {/* MODE 1: FULL EARLY SETTLEMENT */}
              {settlementMode === 'full' && (
                <div className="space-y-4">
                  {/* Calculation Breakdown Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-slate-400">أصل الدين المتبقي (Principal):</span>
                      <div className="text-base font-black text-slate-800 dark:text-slate-100 mt-1">
                        {outstandingPrincipal.toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>

                    <div className="bg-rose-50 dark:bg-rose-950/30 p-3 rounded-xl border border-rose-200 dark:border-rose-900">
                      <span className="text-rose-600 dark:text-rose-400 font-semibold">إجمالي المرابحة المتبقية:</span>
                      <div className="text-base font-black text-rose-700 dark:text-rose-300 mt-1">
                        {remainingProfit.toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>

                    <div className="bg-emerald-50 dark:bg-emerald-950/30 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800">
                      <span className="text-emerald-700 dark:text-emerald-300 font-semibold">الأرباح المعفاة (الإسقاط آلياً):</span>
                      <div className="text-base font-black text-emerald-800 dark:text-emerald-200 mt-1">
                        {waivedProfit.toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 p-3 rounded-xl border border-amber-200 dark:border-amber-800">
                      <span className="text-amber-700 dark:text-amber-300 font-semibold">تعويض الاستثمار (سقف 3 أشهر):</span>
                      <div className="text-base font-black text-amber-800 dark:text-amber-200 mt-1">
                        {reinvestmentCompFee.toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>
                  </div>

                  {/* Inputs for Third Party Fees */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        رسوم الطرف الثالث الفعلية (إن وجدت - مثل التقييم أو التسجيل):
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={thirdPartyFees}
                        onChange={e => setThirdPartyFees(e.target.value)}
                        placeholder="0"
                        className="w-full p-2.5 rounded-lg border bg-white dark:bg-slate-900 font-bold"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">مصاريف حقيقية تدفع لطرف ثالث بسبب عقد التمويل وفق نظام ساما.</p>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        ملاحظات والتزامات السداد النهائي:
                      </label>
                      <input
                        type="text"
                        value={settlementNotes}
                        onChange={e => setSettlementNotes(e.target.value)}
                        placeholder="مثال: تم إقرار السداد المبكر بموجب موافقة اللجنة المالية"
                        className="w-full p-2.5 rounded-lg border bg-white dark:bg-slate-900"
                      />
                    </div>
                  </div>

                  {/* Net Summary Bar */}
                  <div className="bg-gradient-to-r from-emerald-900 to-slate-900 p-5 rounded-xl text-white flex justify-between items-center shadow-lg">
                    <div>
                      <span className="text-xs text-emerald-300 font-bold">إجمالي المبلغ النهائي المستحق للسداد المبكر الكامل:</span>
                      <div className="text-2xl font-black text-emerald-400 mt-0.5">
                        {netSettledAmount.toLocaleString('ar-SA')} ر.س
                      </div>
                      <span className="text-xs text-slate-300 mt-1 block">
                        وفر مالي محقق للمنصة: <strong className="text-emerald-300">+{savingsAmount.toLocaleString('ar-SA')} ر.س</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => handleExecuteFullEarlySettlement(fac)}
                      className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl text-sm transition shadow-lg flex items-center gap-2"
                    >
                      <ShieldCheck className="w-5 h-5" />
                      اعتماد السداد المبكر الكامل وإصدار القيد
                    </button>
                  </div>
                </div>
              )}

              {/* MODE 2: PARTIAL EARLY SETTLEMENT */}
              {settlementMode === 'partial' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-indigo-50 dark:bg-indigo-950/40 p-4 rounded-xl border border-indigo-200 dark:border-indigo-800">
                    <h4 className="font-bold text-indigo-900 dark:text-indigo-200 text-sm mb-1">
                      المادة 11 (الفقرة 1): قبول السداد الجزئي بمضاعفات القسط الشهري
                    </h4>
                    <p className="text-indigo-700 dark:text-indigo-300 text-xs">
                      قيمة القسط الشهري الحالية: <strong className="font-mono text-base">{fac.monthlyPayment.toLocaleString('ar-SA')} ر.س</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        عدد الأقساط المراد تعجيل سدادها فوراً:
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={pendingInsts.length - 1}
                        value={partialMultiples}
                        onChange={e => setPartialMultiples(Math.max(1, parseInt(e.target.value, 10) || 1))}
                        className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold text-base text-indigo-600"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        إجمالي المبلغ الجزئي المسدد الآن:
                      </label>
                      <div className="p-2.5 rounded-lg border bg-emerald-50 dark:bg-emerald-950/40 font-black text-base text-emerald-600">
                        {(partialMultiples * fac.monthlyPayment).toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecutePartialEarlySettlement(fac)}
                    className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    توثيق السداد الجزئي بمبلغ {(partialMultiples * fac.monthlyPayment).toLocaleString('ar-SA')} ر.س
                  </button>
                </div>
              )}

              {/* MODE 3: DEBT RESCHEDULING */}
              {settlementMode === 'reschedule' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-xl border border-amber-200 dark:border-amber-800">
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 text-sm mb-1">
                      إعادة جدولة الدين وتمديد فترة الاستحقاق
                    </h4>
                    <p className="text-amber-700 dark:text-amber-300 text-xs">
                      أصل الدين المتبقي لإعادة الجدولة: <strong className="font-mono text-base">{fac.remainingAmount.toLocaleString('ar-SA')} ر.س</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">مدة التمويل الجديدة (بالأشهر):</label>
                      <input
                        type="number"
                        value={rescheduleNewTermMonths}
                        onChange={e => setRescheduleNewTermMonths(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">نسبة المرابحة المعدلة (%):</label>
                      <input
                        type="number"
                        step="0.1"
                        value={rescheduleNewRate}
                        onChange={e => setRescheduleNewRate(e.target.value)}
                        className="w-full p-2.5 rounded-lg border bg-slate-50 dark:bg-slate-800 font-bold"
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => handleExecuteRescheduling(fac)}
                    className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm transition shadow flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-5 h-5" />
                    اعتماد وإعادة جدولة الدين آلياً
                  </button>
                </div>
              )}

            </div>
          </div>
        );
      })()}

      {/* SAMA OFFICIAL CLEARANCE & DISCHARGE CERTIFICATE MODAL */}
      {viewCertificateLiability && (() => {
        const fac = viewCertificateLiability;
        const det = fac.earlySettlementDetails;

        return (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white text-slate-900 rounded-2xl w-full max-w-3xl p-8 shadow-2xl border border-slate-300 text-right space-y-6 max-h-[95vh] overflow-y-auto">
              
              {/* Header Certificate Title */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
                <div>
                  <span className="text-xs font-mono text-emerald-700 font-black tracking-widest uppercase block">
                    المملكة العربية السعودية | البنك المركزي السعودي SAMA Rulebook
                  </span>
                  <h2 className="text-2xl font-black text-slate-900 mt-1">
                    شهادة مخالصة وإبراء ذمة وسداد مبكر معتمدة
                  </h2>
                  <p className="text-xs text-slate-600 mt-0.5">
                    وفق المادة 11 من ضوابط التمويل وقواعد الإفصاح والشفافية المالية
                  </p>
                </div>

                <button
                  onClick={() => setViewCertificateLiability(null)}
                  className="text-slate-400 hover:text-slate-700 font-bold text-xl print:hidden"
                >
                  ✕
                </button>
              </div>

              {/* Official Badges & References Grid */}
              <div className="grid grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">رقم فاتورة التسوية:</span>
                  <strong className="font-mono text-slate-900 font-bold">{det?.settlementInvoiceNo || 'INV-260000000001'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">مرجع الإيراد المالي:</span>
                  <strong className="font-mono text-slate-900 font-bold">{det?.revenueNo || 'REV-26-0000000001'}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">مرجع المصروف المالي:</span>
                  <strong className="font-mono text-slate-900 font-bold">{det?.expenseNo || 'EXP-26-0000000001'}</strong>
                </div>
              </div>

              {/* Certificate Body Text */}
              <div className="space-y-3 text-xs leading-relaxed text-slate-800">
                <p>
                  تشهد منصة <strong>ليلة (LAYLA PLATFORM)</strong> بموجب هذه الشهادة الصادرة آلياً بأنه قد تم السداد المبكر الكامل لكافة الالتزامات والتسهيلات المالية الخاصة بعقد التمويل المشار إليه أدناه، وتم إسقاط وتخليص كافة أرباح المرابحة المؤجلة للفترة المتبقية وفق ضوابط البنك المركزي السعودي (SAMA).
                </p>

                <div className="bg-emerald-50/80 p-4 rounded-xl border border-emerald-200 grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-slate-500">جهة التمويل / الدائن:</span>
                    <div className="font-bold text-slate-900 text-sm">{fac.creditorName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">رقم التسهيل/المرجع:</span>
                    <div className="font-mono font-bold text-indigo-700 text-sm">{fac.facilityNumber}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">أصل أصل الدين التمويلي:</span>
                    <div className="font-bold text-slate-900">{fac.principalAmount.toLocaleString('ar-SA')} ر.س</div>
                  </div>
                  <div>
                    <span className="text-slate-500">تاريخ السداد المبكر:</span>
                    <div className="font-mono font-bold text-slate-900">{det?.settlementDate || new Date().toISOString().split('T')[0]}</div>
                  </div>
                </div>

                {/* Financial Discharge Table */}
                <table className="w-full border-collapse border border-slate-300 text-xs">
                  <thead className="bg-slate-100">
                    <tr>
                      <th className="border border-slate-300 p-2 text-right">البيان المحاسبي</th>
                      <th className="border border-slate-300 p-2 text-left">القيمة (ر.س)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="border border-slate-300 p-2">أرباح المرابحة الملغاة والمعفاة (Waived Profit)</td>
                      <td className="border border-slate-300 p-2 text-left font-bold text-emerald-700">-{det?.waivedProfit.toLocaleString('ar-SA')} ر.س</td>
                    </tr>
                    <tr>
                      <td className="border border-slate-300 p-2">تعويض كلفة إعادة الاستثمار (سقف 3 أشهر SAMA)</td>
                      <td className="border border-slate-300 p-2 text-left font-mono">+{det?.compensationFee.toLocaleString('ar-SA')} ر.س</td>
                    </tr>
                    <tr className="bg-slate-50 font-black text-sm">
                      <td className="border border-slate-300 p-2">صافي المبلغ المسدد بالتسوية النهائية</td>
                      <td className="border border-slate-300 p-2 text-left text-indigo-900">{det?.netSettledAmount.toLocaleString('ar-SA')} ر.س</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Stamp and Actions */}
              <div className="pt-4 border-t border-slate-200 flex justify-between items-center print:hidden">
                <div className="flex items-center gap-2 text-xs text-emerald-700 font-bold">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>وثيقة رسمية مصادق عليها ومبرأة الذمة بالكامل</span>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-5 py-2.5 bg-slate-900 text-white font-bold rounded-xl text-xs hover:bg-slate-800 transition flex items-center gap-1.5"
                  >
                    طباعة شهادة المخالصة
                  </button>
                  <button
                    onClick={() => setViewCertificateLiability(null)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition"
                  >
                    إغلاق
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
}
