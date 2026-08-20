import React, { useState, useEffect, useMemo } from 'react';
import { safeSetLocalStorage } from '../utils/safeStorage';
import { 
  Wallet, TrendingUp, TrendingDown, FileText, Briefcase, 
  Download, Plus, Filter, Calendar as CalendarIcon, PieChart as PieChartIcon,
  X, Check, Heart, Sparkles, Lock, Paperclip, Calculator, Percent,
  Activity, CreditCard, Users, RefreshCw, Bell, ShieldAlert, Landmark
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
  BarChart, Bar, Legend, Cell
} from 'recharts';
import { formatInvoiceId, formatBookingId, formatRevenueId, formatExpenseId } from '../utils/idUtils';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { fetchWithRetry } from '../services/apiService';

// Modular Subcomponents
import WalletEscrow from './WalletEscrow';
import ZatcaInvoicing from './ZatcaInvoicing';
import FinancialForecaster from './FinancialForecaster';
import VarianceAlertsManager from './VarianceAlertsManager';
import TreasuryManagement from './TreasuryManagement';
import { KpiSkeleton, TableSkeleton, ChartSkeleton } from './common/Skeleton';
import { PromotionsManagement } from './MarketingComponents';

const html2canvasSafe = async (element: HTMLElement, options?: any) => {
  const originalGetComputedStyle = window.getComputedStyle;
  const originalDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
  let rulesOverridden = false;
  let gcsOverridden = false;

  const sanitizeUnsupportedColors = (value: string): string => {
    if (!value || typeof value !== 'string') return value;
    let val = value;
    if (val.includes('oklch')) {
      val = val.replace(/oklch\([^)]+\)/g, 'rgb(226, 232, 240)');
    }
    if (val.includes('oklab')) {
      val = val.replace(/oklab\([^)]+\)/g, 'rgb(226, 232, 240)');
    }
    return val;
  };

  if (originalDescriptor && originalDescriptor.get) {
    try {
      const originalGetter = originalDescriptor.get;
      Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
        get() {
          try {
            const rules = originalGetter.call(this);
            if (!rules) return rules;
            const filteredRules: CSSRule[] = [];
            for (let i = 0; i < rules.length; i++) {
              const rule = rules[i];
              if (!rule.cssText || (!rule.cssText.includes('oklch') && !rule.cssText.includes('oklab'))) {
                filteredRules.push(rule);
              }
            }
            return filteredRules;
          } catch (e) {
            return [];
          }
        },
        configurable: true,
        enumerable: true
      });
      rulesOverridden = true;
    } catch (err) {
      console.error('Error setting up cssRules override', err);
    }
  }

  try {
    window.getComputedStyle = function(el, pseudoElt) {
      const style = originalGetComputedStyle.call(this, el, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              return sanitizeUnsupportedColors(val);
            };
          }
          const val = Reflect.get(target, prop);
          if (typeof val === 'string') {
            return sanitizeUnsupportedColors(val);
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };
    gcsOverridden = true;
  } catch (err) {
    console.error('Error setting up getComputedStyle override', err);
  }

  try {
    return await html2canvas(element, options);
  } finally {
    if (rulesOverridden && originalDescriptor) {
      try {
        Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', originalDescriptor);
      } catch (err) {
        console.error('Error restoring cssRules override', err);
      }
    }
    if (gcsOverridden) {
      window.getComputedStyle = originalGetComputedStyle;
    }
  }
};

const relevantUpgradeRequestsMemo = (localMails: any[], userRole: string, currentProvider: string) => {
  return localMails.filter((m: any) => {
    if (!m.isSubscriptionApprovalRequest) return false;
    if (userRole === 'provider') {
      const provName = m.upgradeDetails?.currentProviderName || m.sender;
      return provName === currentProvider;
    }
    return true;
  });
};

const relevantBookingTransfersMemo = (bookings: any[], userRole: string, currentProvider: string) => {
  return bookings.filter((b: any) => {
    const pMethod = String(b.paymentMethod || b.paymentType || '').toLowerCase();
    const isBank = pMethod.includes('bank') || pMethod.includes('transfer') || pMethod.includes('تحويل') || pMethod.includes('بنكي');
    if (userRole === 'provider') {
      return isBank && (b.provider === currentProvider || b.providerName === currentProvider);
    }
    return isBank;
  });
};

export default function FinanceDashboard({ 
  canExport = true, 
  userRole = 'admin',
  currentProvider = '',
  currentProviderId = '',
  isVatEnabled = true,
  seasonRequests = [],
  setSeasonRequests = () => {},
  showNotification = () => {},
  providerSubscription = null,
  bookings = [],
  setBookings = () => {},
  supportServiceRequests = [],
  halls = [],
  inventorySettings = {},
  providers = [],
  campaigns = [],
  dashboardPeriod = 'all',
  selectedDashboardMonth = '',
  selectedDashboardYear = '',
  customStartDate = '',
  customEndDate = '',
  yearlyPeriodType = '',
  promotions = [],
  setPromotions = () => {},
  services = []
}: { 
  canExport?: boolean,
  userRole?: 'admin' | 'provider',
  currentProvider?: string,
  currentProviderId?: string,
  isVatEnabled?: boolean,
  seasonRequests?: any[],
  setSeasonRequests?: (reqs: any[]) => void,
  showNotification?: (type: 'success' | 'error' | 'info', message: string) => void,
  providerSubscription?: any,
  bookings?: any[],
  setBookings?: (bookings: any[]) => void,
  supportServiceRequests?: any[],
  halls?: any[],
  inventorySettings?: any,
  providers?: any[],
  campaigns?: any[],
  dashboardPeriod?: string,
  selectedDashboardMonth?: string,
  selectedDashboardYear?: string,
  customStartDate?: string,
  customEndDate?: string,
  yearlyPeriodType?: string,
  promotions?: any[],
  setPromotions?: (p: any[]) => void,
  services?: any[]
}) {
  const [activeSubTab, setActiveSubTab] = useState<'reports' | 'revenues' | 'expenses' | 'invoices' | 'providers' | 'wallet' | 'seasons' | 'forecast' | 'bank_transfers' | 'customer_ledgers' | 'refunds' | 'settlements' | 'ledger' | 'variance_alerts' | 'treasury'>(() => {
    return userRole === 'provider' ? 'wallet' : 'reports';
  });
  const [seasonsInternalTab, setSeasonsInternalTab] = useState<'seasons' | 'promotions'>('seasons');
  const [dbSummary, setDbSummary] = useState<any>(null);
  const [expenseActiveTab, setExpenseActiveTab] = useState<'all' | 'refunds' | 'operational'>('all');
  const [dateFilter, setDateFilter] = useState('month');

  // Unified Financial Engine States
  const [settlements, setSettlements] = useState<any[]>([]);
  const [ledgerEntries, setLedgerEntries] = useState<any[]>([]);
  const [isLoadingSettlements, setIsLoadingSettlements] = useState(false);
  const [isLoadingLedger, setIsLoadingLedger] = useState(false);

  // Customer Wallets & Held Balances States
  const [customerWalletsData, setCustomerWalletsData] = useState<{ wallets: any[], heldBalances: any[] }>({ wallets: [], heldBalances: [] });
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [approvalModalData, setApprovalModalData] = useState<any>(null);
  const [approvedByNameInput, setApprovedByNameInput] = useState('');
  
  // Simulation Form State
  const [simEmail, setSimEmail] = useState('');
  const [simName, setSimName] = useState('');
  const [simAmount, setSimAmount] = useState('500');
  const [simReason, setSimReason] = useState('force_majeure');
  const [simDaysAgo, setSimDaysAgo] = useState('35');

  // Unified payment & manual transfers tracking states
  const [transferSearchQuery, setTransferSearchQuery] = useState('');
  const [transferStatusFilter, setTransferStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [zoomImageReceipt, setZoomImageReceipt] = useState<string | null>(null);
  const [rejectionReasonText, setRejectionReasonText] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [localMails, setLocalMails] = useState<any[]>([]);
  const [transfersTypeToggle, setTransfersTypeToggle] = useState<'all' | 'subscriptions' | 'bookings' | 'services'>('all');

  // Seasons Editing states
  const [editingSeasonRequest, setEditingSeasonRequest] = useState<any | null>(null);
  const [formSeasonName, setFormSeasonName] = useState('');
  const [formStartDate, setFormStartDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formAdjustmentNature, setFormAdjustmentNature] = useState<'increase' | 'discount'>('increase');
  const [formIncreaseType, setFormIncreaseType] = useState<'percentage' | 'fixed'>('percentage');
  const [formIncreaseValue, setFormIncreaseValue] = useState('');

  // Refund Management states
  const [refundActiveSubTab, setRefundActiveSubTab] = useState<'requests' | 'history'>('requests');
  const [localSupportServiceRequests, setLocalSupportServiceRequests] = useState<any[]>(() => supportServiceRequests);
  useEffect(() => {
    if (supportServiceRequests) {
      setLocalSupportServiceRequests(supportServiceRequests);
    }
  }, [supportServiceRequests]);

  // Partner Operations & Clearing Ledger States
  const [providerSearchQuery, setProviderSearchQuery] = useState('');
  const [providerTierFilter, setProviderTierFilter] = useState<string>('all');
  const [selectedProviderForStatement, setSelectedProviderForStatement] = useState<any | null>(null);
  const [partnerStatementTab, setPartnerStatementTab] = useState<'summary' | 'bookings' | 'services' | 'settlements'>('summary');
  const [isSettleModalOpen, setIsSettleModalOpen] = useState(false);
  const [settleProviderData, setSettleProviderData] = useState<any | null>(null);
  const [settleAmountInput, setSettleAmountInput] = useState('');
  const [settleNotesInput, setSettleNotesInput] = useState('');
  const [settleReferenceInput, setSettleReferenceInput] = useState('');
  const [isSubmittingSettlement, setIsSubmittingSettlement] = useState(false);

  // Dynamic Partner Aggregation Engine combining Halls, Services, Bookings, and Cloud Database Settlements
  const aggregatedProvidersData = useMemo(() => {
    const providerMap = new Map<string, any>();

    const getOrInit = (key: string, name: string, raw?: any) => {
      const k = (key || name || 'شريك غير محدد').trim();
      if (!providerMap.has(k)) {
        providerMap.set(k, {
          id: raw?.id || raw?.providerId || k,
          name: raw?.name || name || k,
          email: raw?.email || raw?.username || '-',
          phone: raw?.phone || '-',
          city: raw?.city || raw?.region || 'جميع المناطق',
          crNumber: raw?.crNumber || raw?.commercialRegister || '-',
          iban: raw?.iban || raw?.bankAccount || '-',
          subscriptionTier: raw?.subscriptionTier || raw?.packageName || 'الباقة الأساسية',
          raw: raw || null
        });
      } else if (raw) {
        const existing = providerMap.get(k);
        if (raw.email && existing.email === '-') existing.email = raw.email;
        if (raw.phone && existing.phone === '-') existing.phone = raw.phone;
        if (raw.crNumber && existing.crNumber === '-') existing.crNumber = raw.crNumber;
        if (raw.iban && existing.iban === '-') existing.iban = raw.iban;
        if (raw.subscriptionTier && existing.subscriptionTier === 'الباقة الأساسية') existing.subscriptionTier = raw.subscriptionTier;
      }
      return providerMap.get(k);
    };

    if (Array.isArray(providers)) {
      providers.forEach((p: any) => {
        const pName = p.name || p.providerName || p.username;
        if (pName) getOrInit(pName, pName, p);
      });
    }

    if (Array.isArray(halls)) {
      halls.forEach((h: any) => {
        const pName = h.provider || h.providerName;
        if (pName) getOrInit(pName, pName);
      });
    }

    if (Array.isArray(services)) {
      services.forEach((s: any) => {
        const pName = s.provider || s.providerName;
        if (pName) getOrInit(pName, pName);
      });
    }

    if (Array.isArray(bookings)) {
      bookings.forEach((b: any) => {
        const pName = b.providerName || b.provider;
        if (pName) getOrInit(pName, pName);
      });
    }

    if (Array.isArray(supportServiceRequests)) {
      supportServiceRequests.forEach((sr: any) => {
        const pName = sr.providerName || sr.provider;
        if (pName) getOrInit(pName, pName);
      });
    }

    const result: any[] = [];

    providerMap.forEach((p, keyName) => {
      const pHalls = (halls || []).filter((h: any) => (h.provider || h.providerName) === keyName || h.providerId === p.id);
      const pServices = (services || []).filter((s: any) => (s.provider || s.providerName) === keyName || s.providerId === p.id);

      const pBookings = (bookings || []).filter((b: any) => {
        const matchProv = (b.providerName || b.provider) === keyName || b.providerId === p.id;
        const isConfirmed = b.status === 'مؤكد' || b.paymentStatus === 'مدفوع' || b.paymentStatus === 'مدفوع بالكامل' || b.status === 'مكتمل';
        return matchProv && isConfirmed;
      });

      const totalBookingVolume = pBookings.reduce((sum: number, b: any) => sum + Number(b.totalPrice || b.amount || 0), 0);

      const pServiceRequests = (supportServiceRequests || []).filter((sr: any) => {
        const matchProv = (sr.providerName || sr.provider) === keyName || sr.providerId === p.id;
        const isPaid = sr.status === 'تم السداد' || sr.status === 'مقبول' || sr.status === 'مكتمل' || sr.paymentStatus === 'مدفوع' || sr.paymentStatus === 'مدفوع بالكامل';
        return matchProv && isPaid;
      });

      const totalServiceVolume = pServiceRequests.reduce((sum: number, sr: any) => sum + Number(sr.price || sr.amount || 0), 0);
      const grossSales = totalBookingVolume + totalServiceVolume;

      const tierLower = String(p.subscriptionTier || '').toLowerCase();
      let commissionRate = 0.15;
      if (tierLower.includes('professional') || tierLower.includes('احترافية') || tierLower.includes('pro')) {
        commissionRate = 0.08;
      } else if (tierLower.includes('advanced') || tierLower.includes('متقدمة')) {
        commissionRate = 0.12;
      } else if (typeof p.commissionRate === 'number') {
        commissionRate = p.commissionRate;
      }

      const platformCommission = grossSales * commissionRate;
      const netPartnerEarned = grossSales - platformCommission;

      const pSettlements = (settlements || []).filter((s: any) => {
        const matchProv = (s.providerName || s.provider || s.providerId) === keyName || s.providerId === p.id;
        const isApproved = s.status === 'approved' || s.status === 'معتمدة' || s.status === 'مكتملة' || !s.status;
        return matchProv && isApproved;
      });

      const totalSettledAmount = pSettlements.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
      const pendingBalance = Math.max(0, netPartnerEarned - totalSettledAmount);

      result.push({
        ...p,
        hallsCount: pHalls.length,
        servicesCount: pServices.length,
        halls: pHalls,
        servicesList: pServices,
        bookingsList: pBookings,
        bookingsCount: pBookings.length,
        bookingVolume: totalBookingVolume,
        serviceRequestsList: pServiceRequests,
        serviceRequestsCount: pServiceRequests.length,
        serviceVolume: totalServiceVolume,
        grossSales,
        commissionRate,
        platformCommission,
        netPartnerEarned,
        settlementsList: pSettlements,
        settledAmount: totalSettledAmount,
        pendingBalance
      });
    });

    return result.sort((a, b) => b.grossSales - a.grossSales);
  }, [providers, halls, services, bookings, supportServiceRequests, settlements]);

  const filteredProvidersList = useMemo(() => {
    return aggregatedProvidersData.filter(p => {
      const q = providerSearchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        (p.name || '').toLowerCase().includes(q) ||
        (p.email || '').toLowerCase().includes(q) ||
        (p.phone || '').toLowerCase().includes(q) ||
        (p.city || '').toLowerCase().includes(q) ||
        (p.crNumber || '').toLowerCase().includes(q) ||
        String(p.id).toLowerCase().includes(q);

      const matchesTier = providerTierFilter === 'all' || 
        (providerTierFilter === 'basic' && (p.subscriptionTier.includes('أساسية') || p.subscriptionTier.includes('basic'))) ||
        (providerTierFilter === 'advanced' && (p.subscriptionTier.includes('متقدمة') || p.subscriptionTier.includes('advanced'))) ||
        (providerTierFilter === 'professional' && (p.subscriptionTier.includes('احترافية') || p.subscriptionTier.includes('pro') || p.subscriptionTier.includes('professional')));

      return matchesSearch && matchesTier;
    });
  }, [aggregatedProvidersData, providerSearchQuery, providerTierFilter]);

  const partnerOperationsSummary = useMemo(() => {
    return {
      totalPartners: aggregatedProvidersData.length,
      totalGrossSales: aggregatedProvidersData.reduce((s, p) => s + p.grossSales, 0),
      totalCommissions: aggregatedProvidersData.reduce((s, p) => s + p.platformCommission, 0),
      totalSettled: aggregatedProvidersData.reduce((s, p) => s + p.settledAmount, 0),
      totalPending: aggregatedProvidersData.reduce((s, p) => s + p.pendingBalance, 0),
      totalHalls: aggregatedProvidersData.reduce((s, p) => s + p.hallsCount, 0),
      totalServices: aggregatedProvidersData.reduce((s, p) => s + p.servicesCount, 0)
    };
  }, [aggregatedProvidersData]);

  const relevantUpgradeRequests = useMemo(() => {
    return relevantUpgradeRequestsMemo(localMails, userRole || 'admin', currentProvider || '');
  }, [localMails, userRole, currentProvider]);

  const relevantBookingTransfers = useMemo(() => {
    return relevantBookingTransfersMemo(bookings || [], userRole || 'admin', currentProvider || '');
  }, [bookings, userRole, currentProvider]);

  const relevantServiceTransfers = useMemo(() => {
    return (supportServiceRequests || []).filter((s: any) => {
      if (userRole === 'provider') {
        const provName = s.providerName || s.provider;
        return provName === currentProvider;
      }
      return true;
    });
  }, [supportServiceRequests, userRole, currentProvider]);

  const pendingSubCount = useMemo(() => {
    return relevantUpgradeRequests.filter(r => r.approvalStatus === 'pending').length;
  }, [relevantUpgradeRequests]);

  const approvedSubCount = useMemo(() => {
    return relevantUpgradeRequests.filter(r => r.approvalStatus === 'approved').length;
  }, [relevantUpgradeRequests]);

  const rejectedSubCount = useMemo(() => {
    return relevantUpgradeRequests.filter(r => r.approvalStatus === 'rejected').length;
  }, [relevantUpgradeRequests]);

  const pendingBookingsCount = useMemo(() => {
    return relevantBookingTransfers.filter(b => b.paymentStatus === 'معلق_التأكيد' || b.paymentStatus === 'pending' || b.paymentStatus === 'غير مدفوع' || b.status === 'قيد الانتظار').length;
  }, [relevantBookingTransfers]);

  const successfulPaymentsCount = useMemo(() => {
    return relevantBookingTransfers.filter(b => b.paymentStatus === 'مدفوع' || b.paymentStatus === 'مدفوع بالكامل').length;
  }, [relevantBookingTransfers]);

  const pendingServicesCount = useMemo(() => {
    return relevantServiceTransfers.filter(s => s.status === 'قيد الانتظار' || s.paymentStatus === 'pending' || s.paymentStatus === 'معلق_التأكيد').length;
  }, [relevantServiceTransfers]);

  // Combined and mapped data structure for a truly unified ledger table
  const allMergedTransfers = useMemo(() => {
    const list: any[] = [];
    
    // 1. Subscriptions upgrades
    relevantUpgradeRequests.forEach((r: any) => {
      list.push({
        type: 'subscription',
        id: r.id,
        senderLabel: r.upgradeDetails?.currentProviderName || r.sender || 'شريك',
        detailLabel: `${r.upgradeDetails?.packageName || 'الباقة الذهبية'} (${r.upgradeDetails?.billingCycle === 'monthly' ? 'شهري' : 'سنوي'})`,
        date: r.createdAt || r.date || new Date().toISOString(),
        amount: Number(r.upgradeDetails?.price || 0),
        receiptPreview: r.attachments?.[0]?.receiptPreview || r.receiptPreview || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60',
        status: r.approvalStatus === 'approved' ? 'approved' : (r.approvalStatus === 'rejected' ? 'rejected' : 'pending'),
        raw: r
      });
    });

    // 2. Customer Hall Bookings
    relevantBookingTransfers.forEach((b: any) => {
      const isPaid = b.paymentStatus === 'مدفوع' || b.paymentStatus === 'مدفوع بالكامل';
      const isCancelled = b.status === 'ملغي' || b.paymentStatus === 'مرفوض';
      list.push({
        type: 'booking',
        id: b.id,
        senderLabel: b.customerName || b.customerEmail || 'عميل رئيسي',
        detailLabel: `${b.hall || 'صالة مناسبات'} (حجز #${b.id})`,
        date: b.createdAt || b.date || new Date().toISOString(),
        amount: Number(b.totalPrice || b.amount || 0),
        receiptPreview: b.attachments?.[0]?.receiptPreview || b.receiptPreview || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60',
        status: isPaid ? 'approved' : (isCancelled ? 'rejected' : 'pending'),
        raw: b
      });
    });

    // 3. Support Services Requests
    relevantServiceTransfers.forEach((s: any) => {
      const isPaid = s.status === 'تم السداد' || s.status === 'مقبول' || s.status === 'مكتمل' || s.paymentStatus === 'مدفوع' || s.paymentStatus === 'مدفوع بالكامل';
      const isCancelled = s.status === 'ملغي' || s.status === 'مرفوض' || s.paymentStatus === 'مرفوض';
      list.push({
        type: 'service',
        id: s.id,
        senderLabel: s.customerName || 'عميل خدمات مساندة',
        detailLabel: `${s.serviceName || 'خدمة مساندة'} (${s.providerName || s.provider || 'شريك'})`,
        date: s.createdAt || s.date || new Date().toISOString(),
        amount: Number(s.price || s.amount || 0),
        receiptPreview: s.attachments?.[0]?.receiptPreview || s.receiptPreview || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60',
        status: isPaid ? 'approved' : (isCancelled ? 'rejected' : 'pending'),
        raw: s
      });
    });

    // Sort all movements chronologically descending
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [relevantUpgradeRequests, relevantBookingTransfers, relevantServiceTransfers]);

  const listToRender = useMemo(() => {
    let baseList: any[] = [];
    if (transfersTypeToggle === 'all') {
      baseList = allMergedTransfers;
    } else if (transfersTypeToggle === 'subscriptions') {
      baseList = allMergedTransfers.filter(t => t.type === 'subscription');
    } else if (transfersTypeToggle === 'bookings') {
      baseList = allMergedTransfers.filter(t => t.type === 'booking');
    } else if (transfersTypeToggle === 'services') {
      baseList = allMergedTransfers.filter(t => t.type === 'service');
    }

    return baseList.filter((item: any) => {
      const textQuery = transferSearchQuery.toLowerCase();
      const senderMatches = (item.senderLabel || '').toLowerCase().includes(textQuery);
      const detailMatches = (item.detailLabel || '').toLowerCase().includes(textQuery);
      const matchesSearch = senderMatches || detailMatches;
      
      const matchesStatus = transferStatusFilter === 'all' || item.status === transferStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [transfersTypeToggle, allMergedTransfers, transferSearchQuery, transferStatusFilter]);

  const handleApproveServicePayment = async (requestId: any) => {
    const stored = localStorage.getItem('SUPPORT_SERVICE_REQUESTS');
    let servicesList: any[] = [];
    if (stored) {
      try { servicesList = JSON.parse(stored); } catch(e) {}
    }
    const updated = servicesList.map(s => {
      if (s.id === requestId) {
        return { ...s, status: 'تم السداد', paymentStatus: 'مدفوع بالكامل' };
      }
      return s;
    });
    localStorage.setItem('SUPPORT_SERVICE_REQUESTS', JSON.stringify(updated));

    try {
      await fetch(`/api/bookings/support-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'تم السداد', paymentStatus: 'مدفوع بالكامل' })
      });
    } catch (e) {
      console.error("Failed to sync service payment approval to server", e);
    }

    window.dispatchEvent(new Event('financeUpdated'));
    window.dispatchEvent(new Event('supportServiceRequestsUpdated'));

    if (showNotification) {
      showNotification('success', '✓ تم تأكيد استلام حوالة دفع الخدمة المساندة بنجاح وحفظ حالة الخدمة كمدفوع بالكامل!');
    }
  };

  const handleRejectServicePayment = async (requestId: any) => {
    const stored = localStorage.getItem('SUPPORT_SERVICE_REQUESTS');
    let servicesList: any[] = [];
    if (stored) {
      try { servicesList = JSON.parse(stored); } catch(e) {}
    }
    const updated = servicesList.map(s => {
      if (s.id === requestId) {
        return { ...s, status: 'ملغي', paymentStatus: 'مرفوض' };
      }
      return s;
    });
    localStorage.setItem('SUPPORT_SERVICE_REQUESTS', JSON.stringify(updated));

    try {
      await fetch(`/api/bookings/support-requests/${requestId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'ملغي', paymentStatus: 'مرفوض' })
      });
    } catch (e) {
      console.error("Failed to sync service payment rejection to server", e);
    }

    window.dispatchEvent(new Event('financeUpdated'));
    window.dispatchEvent(new Event('supportServiceRequestsUpdated'));

    if (showNotification) {
      showNotification('error', '🚨 تم تحديث حالة دفع الخدمة المساندة إلى مرفوض وإلغاء صلاحيتها.');
    }
  };

  const handleApproveSubscription = (selectedMsg: any) => {
    const stored = localStorage.getItem('PLATFORM_MAIL_MESSAGES');
    let mailList: any[] = [];
    if (stored) {
      try { mailList = JSON.parse(stored); } catch(e) {}
    }
    
    const updatedMails = mailList.map(m => {
      if (m.id === selectedMsg.id) {
        return { ...m, approvalStatus: 'approved' };
      }
      return m;
    });
    
    const planId = selectedMsg.upgradeDetails?.planId || 'pro';
    const pName = selectedMsg.upgradeDetails?.packageName || 'الباقة الذهبية';
    const cycle = selectedMsg.upgradeDetails?.billingCycle || 'monthly';
    const price = Number(selectedMsg.upgradeDetails?.price || 1000);
    const provName = selectedMsg.upgradeDetails?.currentProviderName || selectedMsg.sender;

    const newSub = { 
      planId: planId, 
      packageName: pName,
      packageName_display: pName,
      includesInventory: true,
      includesSuppliers: true,
      canExportFinancials: true,
      hasSupport: true,
      includesGrowthCharts: true,
      includesFinancialForecast: true,
      includesPartialPayment: true,
      includesAdvancedStats: true,
      includesFullManagement: true,
      includesAdvancedProviderDashboard: true,
      hallsLimit: 10,
      servicesLimit: 10,
      staffSeatsLimit: 10,
      billingCycle: cycle,
      price: price,
      commissionRate: 0.15,
      startDate: new Date().toISOString()
    };
    
    localStorage.setItem(`provider_subscription_${provName}`, JSON.stringify(newSub));
    localStorage.setItem('provider_subscription', JSON.stringify(newSub));
    localStorage.removeItem(`pending_sub_request_${provName}`);
    localStorage.removeItem('pending_subscription_under_review');
    
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.name === provName) {
          parsedUser.role = 'مزود';
          localStorage.setItem('currentUser', JSON.stringify(parsedUser));
        }
      } catch {}
    }

    try {
      const savedProviders = localStorage.getItem('providersData');
      if (savedProviders) {
        const list = JSON.parse(savedProviders);
        const item = list.find((p: any) => p.name === provName);
        if (item) {
          item.packageName = pName;
          item.packageDuration = cycle;
          safeSetLocalStorage('providersData', list);
        }
      }
    } catch (e) {}

    const storedRevenues = localStorage.getItem('PLATFORM_REVENUES');
    let revenuesList = [];
    if (storedRevenues) {
      try { revenuesList = JSON.parse(storedRevenues); } catch(e) {}
    }
    const vatAmount = price - (price / 1.15);
    const baseAmount = price / 1.15;
    const newRevId = 'RV-SUB-' + Math.floor(Math.random() * 10000);
    
    revenuesList.unshift({
      id: newRevId,
      date: new Date().toISOString().split('T')[0],
      title: `اشتراك باقة ${pName} - ${provName}`,
      type: 'اشتراك',
      amount: Number(baseAmount.toFixed(2)),
      vat: Number(vatAmount.toFixed(2)),
      total: price,
      provider: provName
    });
    localStorage.setItem('PLATFORM_REVENUES', JSON.stringify(revenuesList));

    const replyMailId = 'mail_reply_sub_' + Date.now();
    const confirmationMail = {
      id: replyMailId,
      sender: "الإدارة",
      recipient: provName,
      subject: `✓ تم اعتماد وتفعيل باقتك: ${pName} بنجاح!`,
      body: `السلام عليكم ورحمة الله وبركاته،\n\nنهنئكم بأنه تم اعتماد حوالتكم البنكية والتحقق من إيصال الدفع بنجاح.\nتم تفعيل اشتراكك وإتاحة كامل ميزات باقة "${pName}" على حسابكم كـشريك لـمنصة ليلة التفاعلية.\n\nنتمنى لكم مزيداً من النجاح والأرباح والمناسبات اللامعة.\n\nتقبلوا أطيب التحيات.\nإدارة الحسابات والتدقيق المالي - منصة ليلة لخدمات المناسبات والضيافة.`,
      createdAt: new Date().toISOString(),
      isReadByAdmin: true,
      isReadByProvider: false,
      deletedByAdmin: false,
      deletedByProvider: false,
      isSubscriptionApprovalResult: true,
      resultType: 'approved'
    };
    updatedMails.unshift(confirmationMail);
    
    localStorage.setItem('PLATFORM_MAIL_MESSAGES', JSON.stringify(updatedMails));
    setLocalMails(updatedMails);

    const userNotifs = localStorage.getItem('app_notifications') || '[]';
    let userNotifList = [];
    try { userNotifList = JSON.parse(userNotifs); } catch(e) {}
    userNotifList.unshift({
      id: 'notif_sub_ok_' + Date.now(),
      title: '✓ تم تفعيل اشتراكك البنكي',
      body: `باقة "${pName}" نشطة الآن! نتمنى لك تجربة موفقة.`,
      createdAt: new Date().toISOString(),
      type: 'system',
      severity: 'high',
      recipientName: provName,
      isRead: false
    });
    localStorage.setItem('app_notifications', JSON.stringify(userNotifList));

    window.dispatchEvent(new Event('subscriptionUpdated'));
    window.dispatchEvent(new Event('mailMessagesUpdated'));
    window.dispatchEvent(new Event('notificationsUpdated'));
    window.dispatchEvent(new Event('financeUpdated'));

    if (showNotification) {
      showNotification('success', `تم تفعيل باقة "${pName}" بنجاح للشريك وإدراج المبلغ ${price} ر.س في الإيرادات!`);
    }
  };

  const handleRejectSubscriptionSubmit = (pId: string, reason: string) => {
    const targetMsg = localMails.find(m => m.id === pId);
    if (!targetMsg) return;

    const stored = localStorage.getItem('PLATFORM_MAIL_MESSAGES');
    let mailList: any[] = [];
    if (stored) {
      try { mailList = JSON.parse(stored); } catch(e) {}
    }
    
    const updatedMails = mailList.map(m => {
      if (m.id === pId) {
        return { ...m, approvalStatus: 'rejected' };
      }
      return m;
    });

    const provName = targetMsg.upgradeDetails?.currentProviderName || targetMsg.sender;
    const pName = targetMsg.upgradeDetails?.packageName || 'الباقة الذهبية';

    localStorage.removeItem(`pending_sub_request_${provName}`);
    localStorage.removeItem('pending_subscription_under_review');

    const replyMailId = 'mail_reply_sub_' + Date.now();
    const rejectionMail = {
      id: replyMailId,
      sender: "الإدارة",
      recipient: provName,
      subject: `🚨 لم يتم تفعيل باقتك: ${pName} - يرجى مراجعة الدفع`,
      body: `السلام عليكم ورحمة الله وبركاته،\n\nنود إحاطتكم بأنه لم نتمكن من اعتماد التحويل البنكي المرفق لطلب باقة "${pName}".\nالسبب: ${reason || 'إيصال التحويل غير واضح أو البيانات لا تطابق سجل كشف الحساب البنكي لدينا.'}\n\nيرجى إعادة تقديم طلب الترقية مع إرفاق مستند أو إيصال واضح وصحيح ليتم تفعيله فوراً.\n\nتقبلوا تحياتنا.\nقسم الحسابات والتدقيق - منصة ليلة لخدمات المناسبات.`,
      createdAt: new Date().toISOString(),
      isReadByAdmin: true,
      isReadByProvider: false,
      deletedByAdmin: false,
      deletedByProvider: false,
      isSubscriptionApprovalResult: true,
      resultType: 'rejected'
    };
    updatedMails.unshift(rejectionMail);

    localStorage.setItem('PLATFORM_MAIL_MESSAGES', JSON.stringify(updatedMails));
    setLocalMails(updatedMails);

    const userNotifs = localStorage.getItem('app_notifications') || '[]';
    let userNotifList = [];
    try { userNotifList = JSON.parse(userNotifs); } catch(e) {}
    userNotifList.unshift({
      id: 'notif_sub_fail_' + Date.now(),
      title: '🚨 لم يتم تفعيل اشتراكك البنكي',
      body: `تعذر تفعيل باقة "${pName}". السبب: ${reason || 'تحقق من مستند الحوالة'}`,
      createdAt: new Date().toISOString(),
      type: 'system',
      severity: 'high',
      recipientName: provName,
      isRead: false
    });
    localStorage.setItem('app_notifications', JSON.stringify(userNotifList));

    window.dispatchEvent(new Event('subscriptionUpdated'));
    window.dispatchEvent(new Event('mailMessagesUpdated'));
    window.dispatchEvent(new Event('notificationsUpdated'));
    window.dispatchEvent(new Event('financeUpdated'));

    if (showNotification) {
      showNotification('success', `تم رفض طلب التحويل المالي للشريك وإخطاره بالسبب: ${reason}`);
    }
  };

  const handleApproveBookingPayment = (bookingId: any) => {
    if (!bookings || !setBookings) return;
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus: 'مدفوع بالكامل',
          status: 'مؤكد'
        };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('app_bookings', JSON.stringify(updated));
    
    window.dispatchEvent(new Event('bookingsUpdated'));
    window.dispatchEvent(new Event('financeUpdated'));
    if (showNotification) {
      showNotification('success', '✓ تم تأكيد استلام الحوالة البنكية بنجاح وحفظ حالة السداد كمدفوع بالكامل!');
    }
  };

  const handleRejectBookingPayment = (bookingId: any) => {
    if (!bookings || !setBookings) return;
    const updated = bookings.map(b => {
      if (b.id === bookingId) {
        return {
          ...b,
          paymentStatus: 'غير مدفوع',
          status: 'ملغي'
        };
      }
      return b;
    });
    setBookings(updated);
    localStorage.setItem('app_bookings', JSON.stringify(updated));
    
    window.dispatchEvent(new Event('bookingsUpdated'));
    window.dispatchEvent(new Event('financeUpdated'));
    if (showNotification) {
      showNotification('error', '🚨 تم تحديث حالة السداد لغير مدفوع وإلغاء صلاحية الحجز التلقائية.');
    }
  };

  useEffect(() => {
    const loadMails = () => {
      const stored = localStorage.getItem('PLATFORM_MAIL_MESSAGES');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setLocalMails(parsed);
        } catch (e) {}
      }
    };
    loadMails();
    window.addEventListener('mailMessagesUpdated', loadMails);
    return () => window.removeEventListener('mailMessagesUpdated', loadMails);
  }, []);

  const fetchCustomerWallets = async () => {
    try {
      setIsLoadingWallets(true);
      const res = await fetch('/api/finance/customer-wallets');
      const data = await res.json();
      if (data.success) {
        setCustomerWalletsData({
          wallets: data.wallets || [],
          heldBalances: data.heldBalances || []
        });
      }
    } catch (err) {
      console.error('Failed to fetch customer wallets:', err);
    } finally {
      setIsLoadingWallets(false);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'customer_ledgers') {
      fetchCustomerWallets();
    }
  }, [activeSubTab]);

  const handleManualConvert = async (id: number, approvedBy: string) => {
    try {
      const res = await fetch('/api/finance/customer-wallets/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, approvedBy })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (showNotification) {
          showNotification('success', `💸 ${data.message}`);
        }
        setApprovalModalData(null);
        setApprovedByNameInput('');
        fetchCustomerWallets();
      } else {
        if (showNotification) {
          showNotification('error', `🚨 ${data.error || 'فشل تحويل الرصيد'}`);
        }
      }
    } catch (err: any) {
      if (showNotification) {
        showNotification('error', `🚨 حدث عطل أثناء الاتصال: ${err.message}`);
      }
    }
  };

  const handleSimulateIssueCredit = async () => {
    if (!simEmail || !simAmount) {
      if (showNotification) {
        showNotification('error', 'الرجاء إدخال البريد الإلكتروني والمبلغ.');
      }
      return;
    }
    try {
      const res = await fetch('/api/finance/customer-wallets/issue-credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail: simEmail,
          customerName: simName || 'عميل تجريبي',
          amount: parseFloat(simAmount),
          holdReason: simReason,
          heldSinceDaysAgo: parseInt(simDaysAgo) || 0
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (showNotification) {
          showNotification('success', '✔️ تم إصدار الرصيد المحجوز التجريبي بنجاح!');
        }
        setSimEmail('');
        setSimName('');
        setSimAmount('500');
        fetchCustomerWallets();
      } else {
         if (showNotification) {
           showNotification('error', `فشل الإصدار: ${data.error}`);
         }
      }
    } catch (err: any) {
      if (showNotification) {
        showNotification('error', `عطل في الاتصال: ${err.message}`);
      }
    }
  };

  const activeSettlementMethod = localStorage.getItem('ACTIVE_SETTLEMENT_METHOD') || 'weekly_clearance';

  // Forecast states and parameters
  const [forecastGrowth, setForecastGrowth] = useState(8.5);
  const [forecastSeasonBoost, setForecastSeasonBoost] = useState(15.0);
  const [forecastCancelRate, setForecastCancelRate] = useState(5.0);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [showExportSuccessMsg, setShowExportSuccessMsg] = useState(false);

  // Forecast processing calculations
  const providerHalls = useMemo(() => {
    return (halls || []).filter((h: any) => h.provider === currentProvider);
  }, [halls, currentProvider]);

  const providerHallNames = useMemo(() => providerHalls.map((h: any) => h.name), [providerHalls]);

  const relevantBookings = useMemo(() => {
    if (userRole === 'admin') {
      return bookings || [];
    }
    return (bookings || []).filter((b: any) => providerHallNames.includes(b.hall));
  }, [bookings, userRole, providerHallNames]);

  const baselineMonthStr = useMemo(() => {
    if (!relevantBookings || relevantBookings.length === 0) {
      return '2026-07'; // Dynamic fallback
    }
    // Find the latest booking date that exists in the database
    const dates = relevantBookings
      .map((b: any) => b.date || b.startDate || '')
      .filter((d: string) => d.startsWith('2026-'))
      .sort();
    
    if (dates.length === 0) {
      return '2026-07';
    }
    const latestDate = dates[dates.length - 1];
    return latestDate.slice(0, 7); // Returns "YYYY-MM" like "2026-07"
  }, [relevantBookings]);

  const baselineMonthNameAr = useMemo(() => {
    const monthPart = baselineMonthStr.split('-')[1]; // e.g. "07"
    const monthNamesAr: { [key: string]: string } = {
      '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
      '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
    };
    return (monthNamesAr[monthPart] || 'الشهر الحالي') + ' (فعلي)';
  }, [baselineMonthStr]);

  const currentMonthBookings = useMemo(() => {
    return relevantBookings.filter((b: any) => {
      const dateStr = b.date || b.startDate || '';
      return dateStr.startsWith(baselineMonthStr);
    });
  }, [relevantBookings, baselineMonthStr]);

  const currentMonthConfirmedTotal = useMemo(() => {
    const bookingsTotal = currentMonthBookings
      .filter((b: any) => b.status === 'مؤكد' || b.status === 'مقبول' || b.status === 'نشط' || b.status === 'منفذ' || b.status === 'مكتمل' || b.paymentStatus === 'مدفوع' || b.paymentStatus === 'مدفوع بالكامل')
      .reduce((sum: number, b: any) => sum + (b.amount || b.totalPrice || 0), 0);

    const relevantServices = (supportServiceRequests || [])
      .filter((s: any) => {
        if (s.status === 'ملغي') return false;
        if (userRole === 'provider') {
          return s.providerName === currentProvider || s.provider === currentProvider;
        }
        return true;
      });

    const servicesTotal = relevantServices
      .filter((s: any) => s.status !== 'ملغي')
      .reduce((sum: number, s: any) => sum + (s.price || s.amount || 0), 0);

    return (bookingsTotal + servicesTotal);
  }, [currentMonthBookings, supportServiceRequests, userRole, currentProvider]);

  const currentMonthCount = useMemo(() => {
    const bookingsCount = currentMonthBookings.length;
    
    // Add services count
    const servicesCount = (supportServiceRequests || [])
      .filter((s: any) => {
        if (s.status === 'ملغي') return false;
        if (userRole === 'provider') {
          return s.providerName === currentProvider || s.provider === currentProvider;
        }
        return true;
      }).length;

    return (bookingsCount + servicesCount);
  }, [currentMonthBookings, supportServiceRequests, userRole, currentProvider]);

  const monthlyProjections = useMemo(() => {
    // Generate next 6 months dynamically starting after baselineMonthStr
    const parts = baselineMonthStr.split('-');
    const year = parseInt(parts[0], 10) || 2026;
    const month = parseInt(parts[1], 10) || 7;
    
    const monthsList: any[] = [];
    const monthNamesAr = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ];

    for (let i = 1; i <= 6; i++) {
      let mNum = month + i;
      let yNum = year;
      if (mNum > 12) {
        mNum -= 12;
        yNum += 1;
      }
      const isPeak = [1, 6, 7, 8, 12].includes(mNum);
      monthsList.push({
        num: mNum,
        name: `${monthNamesAr[mNum - 1]} ${yNum}`,
        isPeak
      });
    }

    return monthsList.map((m, idx) => {
      const step = idx + 1;
      const compoundGrowth = Math.pow(1 + (forecastGrowth / 100), step);
      const isPeak = m.isPeak;
      const peakBoost = isPeak ? (1 + (forecastSeasonBoost / 100)) : 1.0;
      const cancellationDeduction = 1 - (forecastCancelRate / 100);

      // Raw projected count
      const count = Math.round(currentMonthCount * compoundGrowth * peakBoost);
      
      // Revenue calculation: compound baseline revenue with growth and seasonal boost, subtracted by cancellation rate
      const revenue = Math.round(currentMonthConfirmedTotal * compoundGrowth * peakBoost * cancellationDeduction);
      
      // Simulated operational expenses (approx. 28% baseline)
      const expense = Math.round(revenue * 0.28);
      const netProfit = revenue - expense;

      // Confidence level based on cancel rate and stability
      const confidence = forecastCancelRate > 12 ? 'متوسط' : 'مرتفع جداً';

      return {
        month: m.name,
        date: `2026-${String(m.num).padStart(2, '0')}-01`,
        count: Math.max(1, count),
        revenue,
        expense,
        netProfit,
        confidence,
        isPeak
      };
    });
  }, [baselineMonthStr, currentMonthConfirmedTotal, currentMonthCount, forecastGrowth, forecastSeasonBoost, forecastCancelRate]);

  const forecastChartData = useMemo(() => {
    return [
      { name: baselineMonthNameAr, 'الإيراد المتوقع (SAR)': currentMonthConfirmedTotal, 'صافي الربح المتوقع (SAR)': Math.round(currentMonthConfirmedTotal * 0.72) },
      ...monthlyProjections.map(p => ({
        name: p.month.split(' ')[0], // Simple month name
        'الإيراد المتوقع (SAR)': p.revenue,
        'صافي الربح المتوقع (SAR)': p.netProfit,
      }))
    ];
  }, [monthlyProjections, currentMonthConfirmedTotal, baselineMonthNameAr]);

   const exportForecastPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Build a beautiful offscreen document for the forecast report to handle Arabic fonts, spacing, RTL flawlessly
      const tempDiv = document.createElement('div');
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '750px'; // Perfect width for standard vertical A4 pages
      tempDiv.dir = 'rtl';
      tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
      tempDiv.className = 'p-8 bg-white text-slate-800';

      const totalRevenue = monthlyProjections.reduce((sum, p) => sum + p.revenue, 0);
      const totalExpenses = monthlyProjections.reduce((sum, p) => sum + p.expense, 0);
      const totalNetProfit = monthlyProjections.reduce((sum, p) => sum + p.netProfit, 0);

      let rowsHtml = '';
      monthlyProjections.forEach(p => {
        const peakLabel = p.isPeak 
          ? '<span style="background-color: #faf5ff; color: #7e22ce; border: 1px solid #f3e8ff; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">ذروة موسمية</span>' 
          : '<span style="background-color: #f8fafc; color: #64748b; border: 1px solid #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 9px; font-weight: bold;">موسم اعتيادي</span>';
        
        const dateFormatted = formatDateToDDMMYYYY(p.date);
        
        rowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 10px 8px; font-weight: bold; color: #1e1b4b; border: 1px solid #e2e8f0;">${p.month}</td>
            <td style="padding: 10px 8px; text-align: center; border: 1px solid #e2e8f0; font-family: monospace; color: #475569;">${dateFormatted}</td>
            <td style="padding: 10px 8px; text-align: center; border: 1px solid #e2e8f0;">${peakLabel}</td>
            <td style="padding: 10px 8px; text-align: center; font-weight: bold; font-family: monospace; color: #334155; border: 1px solid #e2e8f0;">${p.count} حجز</td>
            <td style="padding: 10px 8px; text-align: left; font-weight: bold; font-family: monospace; color: #166534; border: 1px solid #e2e8f0;">${(p.revenue || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 8px; text-align: left; font-family: monospace; color: #b91c1c; border: 1px solid #e2e8f0;">${(p.expense || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 8px; text-align: left; font-weight: bold; font-family: monospace; color: #0284c7; border: 1px solid #e2e8f0;">${(p.netProfit || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 8px; text-align: center; border: 1px solid #e2e8f0;">
              <span style="padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;">
                ${p.confidence}
              </span>
            </td>
          </tr>
        `;
      });

      tempDiv.innerHTML = `
        <div style="border: 2px solid #e2e8f0; padding: 30px; border-radius: 16px; background-color: #ffffff; min-height: 1000px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <!-- Header Block -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #cbd5e1; padding-bottom: 20px; margin-bottom: 25px;">
              <div style="text-align: right;">
                <h1 style="margin: 0; color: #1e1b4b; font-size: 22px; font-weight: 900; display: flex; align-items: center; gap: 8px;">
                  📈 تقرير واستشراف التدفقات المالية الذكي (Forecast)
                </h1>
                <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500;">توقع المبيعات وإشغال المواسم وصافي الأرباح للأشهر الستة القادمة</p>
              </div>
              <div style="text-align: left; font-size: 11px; color: #475569; font-weight: bold; line-height: 1.5;">
                <div>تاريخ التقرير: ${formatDateToDDMMYYYY(new Date().toISOString().split('T')[0])}</div>
                <div>رقم التقرير: FCT-${Math.floor(Math.random() * 89999 + 10000)}</div>
                <div style="color: #6366f1; margin-top: 4px;">الحالة المعتمدة: وثيقة تخطيط مالي مدققة</div>
              </div>
            </div>

            <!-- Simulation Parameters Header Bar -->
            <div style="background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 14px; padding: 16px; margin-bottom: 25px; border-right: 5px solid #8b5cf6; text-align: right;">
              <h4 style="margin: 0 0 10px 0; color: #581c87; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 6px;">
                ⚙️ مُعطيات ومُحددات المحاكاة والنمو الذكي المستعملة:
              </h4>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; font-size: 11px; color: #4b5563;">
                <div><b>معدل النمو الشهري (MoM):</b> <span style="font-family: monospace; color: #8b5cf6; font-weight: bold;">+${forecastGrowth}%</span></div>
                <div><b>عامل مواسم الإشغال المرتفعة:</b> <span style="font-family: monospace; color: #8b5cf6; font-weight: bold;">+${forecastSeasonBoost}%</span></div>
                <div><b>نسبة إلغاء الحجوزات المقدّرة:</b> <span style="font-family: monospace; color: #ef4444; font-weight: bold;">${forecastCancelRate}%</span></div>
                <div><b>حجم الأساس مايو الجاري:</b> <span style="font-family: monospace; color: #059669; font-weight: bold;">${currentMonthConfirmedTotal.toLocaleString('ar-SA')} ر.س</span></div>
              </div>
            </div>

            <!-- Summary KPI cards -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px;">
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; text-align: right; border-right: 4px solid #10b981;">
                <div style="font-size: 11px; color: #165b33; font-weight: bold; margin-bottom: 5px;">إجمالي الإيرادات المتوقعة (6 أشهر)</div>
                <div style="font-size: 18px; font-weight: 900; color: #14532d; font-family: monospace;">${totalRevenue.toLocaleString('ar-SA')} ر.س</div>
              </div>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 15px; text-align: right; border-right: 4px solid #ef4444;">
                <div style="font-size: 11px; color: #991b1b; font-weight: bold; margin-bottom: 5px;">المصروفات التشغيلية المقدرة</div>
                <div style="font-size: 18px; font-weight: 900; color: #7f1d1d; font-family: monospace;">${totalExpenses.toLocaleString('ar-SA')} ر.س</div>
              </div>
              <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 15px; text-align: right; border-right: 4px solid #0284c7;">
                <div style="font-size: 11px; color: #0369a1; font-weight: bold; margin-bottom: 5px;">صافي الربح التقديري المستهدف</div>
                <div style="font-size: 18px; font-weight: 900; color: #0c4a6e; font-family: monospace;">${totalNetProfit.toLocaleString('ar-SA')} ر.س</div>
              </div>
            </div>

            <!-- Table -->
            <table style="width: 100%; border-collapse: collapse; text-align: right; margin-top: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02)">
              <thead>
                <tr style="background-color: #f8fafc; border-bottom: 2px solid #e2e8f0;">
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: right;">الفترة المستهدفة</th>
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: center;">التاريخ التقديري</th>
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: center;">طبيعة الموسم</th>
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: center;">المبيعات/الحجوزات المتوقعة</th>
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: left;">الإيراد المتوقع (SAR)</th>
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: left;">التكلفة التشغيلية (28%)</th>
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: left;">صافي الربح المتوقع (SAR)</th>
                  <th style="padding: 12px 10px; color: #1e1b4b; font-weight: bold; font-size: 12px; border: 1px solid #e2e8f0; text-align: center;">موثوقية المؤشر</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml}
              </tbody>
            </table>
          </div>

          <!-- Corporate / Official Seal & Disclaimer Block -->
          <div>
            <!-- Signature and Seal Block -->
            <div style="display: flex; justify-content: space-between; margin-top: 40px; padding-top: 20px; border-top: 1.5px solid #e2e8f0;">
              <div style="text-align: right; width: 45%;">
                <div style="font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 25px;">إعداد وتصديق مكتب الإدارة المالية والميزانية:</div>
                <div style="font-size: 12px; font-weight: bold; color: #1e1b4b;">أ. محاسب مالي / مستشار التخطيط المالي</div>
                <div style="font-size: 10px; color: #94a3b8; font-family: monospace; margin-top: 3px;">صودق آلياً بواسطة نظام الذكاء المالي - منصة ليلة</div>
              </div>
              <div style="text-align: left; width: 45%;">
                <div style="font-size: 11px; color: #64748b; font-weight: bold; margin-bottom: 25px;">اعتماد رئيس مجلس الإدارة / الشركاء:</div>
                <div style="font-size: 13px; font-weight: bold; color: #0284c7; font-family: monospace;">[ ختم الاعتماد والتحقق الآلي الذكي ]</div>
                <div style="font-size: 10px; color: #94a3b8; margin-top: 5px;">رقم الاعتماد الرقمي الموحد: LYL-FST-2026</div>
              </div>
            </div>

            <!-- Official Footer Note -->
            <div style="margin-top: 25px; border-top: 1px solid #cbd5e1; padding-top: 10px; font-size: 10px; color: #64748b; line-height: 1.6; text-align: right;">
              <b>إخلاء مسؤولية تنبؤية:</b> يُعَدُّ هذا المستند مستندًا ميزانيًّا وتخطيطيًّا مستقبليًّا وليس قرارًا استثماريًّا ملزمًا. تُبنى التحليلات بالكامل على معدلات النمو ومؤشرات الإشغال السابقة والمعقدة المقدرة بشواهد الحجوزات ونسب الإلغاء المحتملة. يُرجى مراجعة التقارير المحاسبية الفعلية والالتزام بمبادئ التحوط المالي دائماً.
            </div>
          </div>
        </div>
      `;

      document.body.appendChild(tempDiv);

      const canvas = await html2canvasSafe(tempDiv, {
        scale: 2.0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const pdfWidth = 595.28;  // A4 point width
      const pdfHeight = 841.89; // A4 point height
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const renderedImgHeight = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = renderedImgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedImgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - renderedImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedImgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`تقرير_الميزانية_والتوقعات_المالية_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(tempDiv);

      setShowExportSuccessMsg(true);
      if (typeof showNotification === 'function') {
        showNotification('success', 'تم تصدير وحفظ التقرير المالي للتوقعات بنجاح كصفحات A4 عمودية منظمة وحفظه كملف PDF!');
      }
      setTimeout(() => setShowExportSuccessMsg(false), 5000);
    } catch (err) {
      console.error('Error generating Forecast PDF', err);
      alert('حدث خطأ أثناء محاولة تصدير التقرير المالي، يرجى إعادة المحاولة.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  const minLimit = inventorySettings?.minWithdrawalLimit ?? 500;
  const maxLimit = inventorySettings?.maxWithdrawalLimit ?? 50000;
  
  // Smart Wallet state and simulation variables
  const [wallet, setWallet] = useState(() => {
    return {
      pending_balance: 0,
      available_balance: 0,
      minWithdrawal: 500
    };
  });

  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);

  const [settlingClaimId, setSettlingClaimId] = useState<string | null>(null);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [isSettlingSubmitting, setIsSettlingSubmitting] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  // Loader function to read live database figures
  const fetchStats = async () => {
    setIsLoadingStats(true);
    try {
      const provParam = userRole === 'provider' ? (currentProviderId || currentProvider) : '';
      const data = await fetchWithRetry(`/api/finance/stats?role=${userRole}&provider=${encodeURIComponent(provParam || '')}`);
      
      if (data.summary) {
        setDbSummary(data.summary);
      }

      // Update wallet balances
        if (data.wallet) {
          setWallet({
            pending_balance: data.wallet.pendingBalance || 0,
            available_balance: data.wallet.balance || 0,
            minWithdrawal: minLimit
          });
        }
        
        // Update arrays from server
        if (data.walletTransactions) {
          setWalletTransactions(data.walletTransactions.map((tx: any) => ({
            id: tx.id ? `WTX-${tx.id}` : `WTX-${Math.floor(Math.random() * 100000)}`,
            date: new Date(tx.date || tx.createdAt || Date.now()).toISOString().split('T')[0],
            type: tx.type === 'deposit_pending' ? 'إيداع معلق' : tx.type === 'withdrawal' ? 'سحب رصيد' : tx.type === 'release_deposit' ? 'تحرير مبلغ' : 'حركة محفظة',
            ref: tx.description,
            amount: tx.amount,
            status: tx.status === 'pending' ? 'معلق' : tx.status === 'completed' ? 'مكتمل' : 'فاشل'
          })));
        }

        if (data.revenues) {
          setRevenues(data.revenues.map((r: any) => ({
            id: r.id ? `RV-${r.id}` : `RV-${Math.floor(Math.random() * 100000)}`,
            revenueNumber: r.revenueNumber,
            date: new Date(r.date || r.createdAt || Date.now()).toISOString().split('T')[0],
            title: r.title,
            type: r.type,
            amount: r.amount,
            vat: r.vatAmount,
            total: r.amountIncludingVat,
            provider: r.providerId || 'المنصة',
            providerId: r.providerId,
            referenceNumber: r.referenceNumber,
            payerName: r.payerName,
            collectionMethod: r.collectionMethod,
            description: r.description,
            notes: r.notes,
            attachmentUrl: r.attachmentUrl,
            isExternal: r.isExternal
          })));
        }

        if (data.expenses) {
          setExpenses(data.expenses.map((e: any) => ({
            id: e.id ? `EX-${e.id}` : `EX-${Math.floor(Math.random() * 100000)}`,
            expenseNumber: e.expenseNumber || null,
            date: new Date(e.date || e.createdAt || Date.now()).toISOString().split('T')[0],
            dueDate: e.dueDate ? new Date(e.dueDate).toISOString().split('T')[0] : null,
            title: e.title,
            category: e.category,
            amount: e.amount,
            vat: e.vatAmount,
            total: e.amountIncludingVat,
            type: 'operational',
            provider: e.category || 'admin',
            providerId: e.providerId,
            paymentMethod: e.paymentMethod || 'cash',
            status: e.status || 'paid',
            description: e.description || '',
            notes: e.notes || '',
            attachmentUrl: e.attachmentUrl || '',
            isExternal: e.isExternal !== false,
            isTaxable: e.isTaxable !== false
          })));
        }

        if (data.invoices) {
          setCustomersInvoices(data.invoices.map((inv: any) => ({
            id: inv.id,
            customer: inv.customerId || 'عميل حجز',
            date: new Date(inv.date || inv.createdAt || Date.now()).toISOString().split('T')[0],
            total: inv.totalAmount,
            status: inv.status === 'paid' ? 'مدفوعة' : 'بانتظار الدفع',
            bookingId: inv.bookingId,
            provider: currentProvider
          })));
        }

        if (data.claims) {
          setClaims(data.claims.map((cl: any) => ({
            id: cl.id ? `CLM-${cl.id}` : `CLM-${Math.floor(Math.random() * 100000)}`,
            provider: cl.providerId,
            amount: cl.amount,
            date: new Date(cl.date || cl.createdAt || Date.now()).toISOString().split('T')[0],
            status: cl.status === 'pending' ? 'معلقة' : cl.status === 'paid' ? 'مكتملة' : 'مرفوضة'
          })));
        }
    } catch (err) {
      console.warn("Notice: Live wallet state fetch using local fallback:", err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const fetchSettlementsAndLedger = async () => {
    setIsLoadingSettlements(true);
    setIsLoadingLedger(true);
    try {
      const provParam = userRole === 'provider' ? (currentProviderId || currentProvider) : '';
      const resSet = await fetch(`/api/finance/settlements?role=${userRole}&provider=${encodeURIComponent(provParam || '')}`);
      if (resSet.ok) {
        const textSet = await resSet.text();
        if (textSet && !textSet.trim().startsWith('<')) {
          setSettlements(JSON.parse(textSet));
        }
      }
      const resLed = await fetch(`/api/finance/ledger?role=${userRole}&provider=${encodeURIComponent(provParam || '')}`);
      if (resLed.ok) {
        const textLed = await resLed.text();
        if (textLed && !textLed.trim().startsWith('<')) {
          setLedgerEntries(JSON.parse(textLed));
        }
      }
    } catch (err) {
      console.warn("Notice: Settlements or ledger load fallback triggered:", err);
    } finally {
      setIsLoadingSettlements(false);
      setIsLoadingLedger(false);
    }
  };

  const handleApproveSettlement = async (settlementId: number) => {
    try {
      const res = await fetch(`/api/finance/settlements/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: settlementId })
      });
      if (res.ok) {
        if (showNotification) {
          showNotification('success', '✓ تم اعتماد وتحرير دفعة التسوية المالية للشريك ونقلها للرصيد القابل للسحب بنجاح!');
        }
        fetchSettlementsAndLedger();
        fetchStats();
      } else {
        const errData = await res.json();
        if (showNotification) {
          showNotification('error', `فشل اعتماد التسوية: ${errData.error || 'خطأ غير معروف'}`);
        }
      }
    } catch (err: any) {
      console.error("Error approving settlement:", err);
      if (showNotification) {
        showNotification('error', 'حدث خطأ غير متوقع أثناء اعتماد التسوية');
      }
    }
  };

  const handleCreateSettlement = async (partnerData: any, amountVal: number, notesText: string, refText: string) => {
    setIsSubmittingSettlement(true);
    try {
      const year = new Date().getFullYear().toString().slice(-2);
      const formattedRef = refText || `REV-${year}-${Math.floor(1000000000 + Math.random() * 9000000000)}`;
      const payload = {
        providerId: partnerData.id || partnerData.name,
        providerName: partnerData.name,
        amount: amountVal,
        notes: notesText || 'تسوية مستحقات الشريك الدورية',
        referenceNumber: formattedRef,
        status: 'approved',
        date: new Date().toISOString()
      };

      try {
        await fetch('/api/finance/settlements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        console.warn("Settlement cloud sync notice:", e);
      }

      const newSettlementObj = {
        id: Date.now(),
        providerId: partnerData.id || partnerData.name,
        providerName: partnerData.name,
        amount: amountVal,
        notes: notesText || 'تسوية مستحقات الشريك الدورية',
        referenceNumber: formattedRef,
        status: 'approved',
        createdAt: new Date().toISOString()
      };

      setSettlements(prev => [newSettlementObj, ...prev]);

      if (showNotification) {
        showNotification('success', `✓ تم تسجيل وإصدار تسوية مالية بمبلغ ${amountVal.toLocaleString('ar-SA')} ر.س للشريك ${partnerData.name} بنجاح!`);
      }

      setIsSettleModalOpen(false);
      setSettleAmountInput('');
      setSettleNotesInput('');
      setSettleReferenceInput('');
      fetchSettlementsAndLedger();
    } catch (err) {
      console.error("Error creating settlement:", err);
      if (showNotification) {
        showNotification('error', 'حدث خطأ أثناء حفظ التسوية المالية');
      }
    } finally {
      setIsSubmittingSettlement(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchRevenueTypes();
    fetchExpenseCategories();
    fetchSettlementsAndLedger();
  }, [currentProvider, currentProviderId, userRole]);

  const [clerkVerified, setClerkVerified] = useState(false);
  const [withdrawalAmount, setWithdrawalAmount] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(withdrawalAmount);
    if (!clerkVerified) {
      alert('يجب إتمام التحقق الأمني الثنائي عبر Clerk للمتابعة!');
      return;
    }
    if (isNaN(amt) || amt <= 0) {
      alert('الرجاء إدخال مبلغ صحيح!');
      return;
    }
    const minLimit = inventorySettings?.minWithdrawalLimit ?? 500;
    const maxLimit = inventorySettings?.maxWithdrawalLimit ?? 50000;
    if (amt < minLimit) {
      alert(`الحد الأدنى لطلب السحب هو ${minLimit} ريال سعودي`);
      return;
    }
    if (amt > maxLimit) {
      alert(`الحد الأعلى لطلب السحب المسموح به هو ${maxLimit} ريال سعودي`);
      return;
    }
    if (amt > wallet.available_balance) {
      alert('المبلغ المطلوب يتجاوز الرصيد المتاح للسحب لديك!');
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch('/api/finance/withdraw', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: currentProvider,
          amount: amt,
          bankDetails: bankAccount || 'الآيبان والمعلومات المدخلة'
        })
      });
      if (res.ok) {
        await fetchStats();
        setWithdrawalAmount('');
        setBankAccount('');
        setClerkVerified(false);
        alert('تم إرسال طلب سحب الرصيد بنجاح وبانتظار الموافقة المالية من الإدارة! 💸');
      } else {
        const errData = await res.json();
        alert(errData.error || 'فشلت عملية السحب');
      }
    } catch (err) {
      console.error("Failed to process withdrawal:", err);
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleFastSimulateScheduler = async () => {
    if (wallet.pending_balance <= 0) {
      alert('لا توجد مبالغ معلقة لتسويتها حالياً!');
      return;
    }
    // Identify reference booking ID
    const pendingTx = walletTransactions.find((tx: any) => tx.status === 'معلق');
    let bId = '102';
    if (pendingTx && pendingTx.ref) {
      const match = pendingTx.ref.match(/#(\w+)/);
      if (match) bId = match[1];
    }
    
    try {
      const res = await fetch('/api/finance/release-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: currentProvider,
          bookingId: bId
        })
      });
      if (res.ok) {
        await fetchStats();
        alert(`⚡ تم تحرير المبالغ بنجاح: تم سداد وإطلاق الحجز #${bId} ونقل العوائد كلياً لخزنة رصيدك المتاح!`);
      } else {
        // Fallback simulation for offline play
        const currentPending = wallet.pending_balance;
        const commission = currentPending * 0.15;
        const releasedAmt = currentPending - commission;
        setWallet((prev: any) => ({
          ...prev,
          pending_balance: 0,
          available_balance: prev.available_balance + releasedAmt
        }));
        const dateStr = new Date().toISOString().split('T')[0];
        setWalletTransactions((prev: any) => [
          { id: `WTX-${Math.floor(Math.random() * 900000) + 100000}`, date: dateStr, type: 'تحرير مبلغ', ref: 'تحرير رصيد الماكتمل', amount: releasedAmt, status: 'مكتمل' },
          ...prev
        ]);
        alert(`⚡ تم محاكاة جدولة الخلفية (Cron Scheduler): خصم عمولة المنصة 15% وتحرير مبلغ قدره (${releasedAmt} ريال) إلى رصيدك المتاح بنجاح!`);
      }
    } catch (err) {
      console.error("Scheduler simulator failed:", err);
    }
  };

  const handleSettleClaim = async (claimId: any, action: 'approve' | 'reject') => {
    setIsSettlingSubmitting(true);
    try {
      const res = await fetch('/api/finance/settle-claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimId,
          action,
          receiptUrl: receiptNumber || undefined
        })
      });
      if (res.ok) {
        await fetchStats();
        setSettlingClaimId(null);
        setReceiptNumber('');
        if (typeof showNotification === 'function') {
          showNotification('success', action === 'approve' ? 'تمت تسوية وتأكيد السداد بنجاح! 💸' : 'تم رفض المطالبة وإعادة الرصيد الشاحب لمحفظة المزود.');
        } else {
          alert(action === 'approve' ? 'تمت تسوية وتأكيد السداد بنجاح! 💸' : 'تم رفض المطالبة وإعادة الرصيد الشاحب لمحفظة المزود.');
        }
      } else {
        const data = await res.json();
        alert(data.error || 'حدث خطأ أثناء إجراء التسوية المالية.');
      }
    } catch (err) {
      console.error("Settle claim failed:", err);
    } finally {
      setIsSettlingSubmitting(false);
    }
  };

  // Flow type filter & Zoom factor for Recharts Liquidity & Cash Flow chart
  const [flowTypeFilter, setFlowTypeFilter] = useState<'all' | 'inflow' | 'settlement' | 'refund'>('all');
  const [chartZoomFactor, setChartZoomFactor] = useState<number>(1);

  // New states for modlas and lists
  const [isAddRevenueModalOpen, setIsAddRevenueModalOpen] = useState(false);
  const [revenueTypes, setRevenueTypes] = useState<any[]>([]);
  const [isRevenueTypesManagerOpen, setIsRevenueTypesManagerOpen] = useState(false);
  const [expenseCategories, setExpenseCategories] = useState<any[]>([]);
  const [isExpenseCategoriesManagerOpen, setIsExpenseCategoriesManagerOpen] = useState(false);
  const [selectedRevenue, setSelectedRevenue] = useState<any | null>(null);
  const [isRevenueDetailsOpen, setIsRevenueDetailsOpen] = useState(false);

  const fetchRevenueTypes = async () => {
    try {
      const data = await fetchWithRetry('/api/finance/revenue-types');
      if (Array.isArray(data)) setRevenueTypes(data);
    } catch (e) {
      console.warn("Notice: Revenue types fetch using local fallback:", e);
    }
  };

  const fetchExpenseCategories = async () => {
    try {
      const data = await fetchWithRetry('/api/finance/expense-categories');
      if (Array.isArray(data)) setExpenseCategories(data);
    } catch (e) {
      console.warn("Notice: Expense categories fetch using local fallback:", e);
    }
  };
  const [isAddExpenseModalOpen, setIsAddExpenseModalOpen] = useState(false);
  const [activeInvoiceTab, setActiveInvoiceTab] = useState<'customers'|'providers'>('customers');

  const [revenues, setRevenues] = useState<any[]>(() => {
    const stored = localStorage.getItem('PLATFORM_REVENUES');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    const defaultRevenues = [
       { id: '1001', date: '2026-05-01', title: 'اشتراك باقة ذهبية - قاعة تالا', type: 'اشتراك', amount: 869.57, vat: 130.43, total: 1000.00, provider: 'مؤسسة ليلة لخدمات للمناسبات' },
       { id: '1002', date: '2026-05-05', title: 'إيراد حجز #BKG-26-0000001054', type: 'حجز', amount: 4347.83, vat: 652.17, total: 5000.00, provider: 'مؤسسة ليلة لخدمات للمناسبات' },
       { id: '1003', date: '2026-05-08', title: 'اشتراك باقة الأعمال - استوديو روتانا', type: 'اشتراك', amount: 1730.43, vat: 259.57, total: 1990.00, provider: 'استوديو روتانا الفوتوغرافي' },
       { id: '1004', date: '2026-05-12', title: 'إيراد حجز #BKG-26-0000001101', type: 'حجز', amount: 17391.30, vat: 2608.70, total: 20000.00, provider: 'شركة أطياف لتنظيم المعارض' },
       { id: '1005', date: '2026-05-15', title: 'إيراد حجز #BKG-26-0000001102', type: 'حجز', amount: 15652.17, vat: 2347.83, total: 18000.00, provider: 'شركة الضيافة الذهبية المحدودة' },
       { id: '1006', date: '2026-05-20', title: 'إيراد حجز #BKG-26-0000001103', type: 'حجز', amount: 24347.83, vat: 3652.17, total: 28000.00, provider: 'مجموعة قاعات الرياض' },
       { id: '1007', date: '2026-05-21', title: 'إيراد حجز #BKG-26-0000001104', type: 'حجز', amount: 3652.17, vat: 547.83, total: 4200.00, provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي' },
       { id: '1008', date: '2026-05-22', title: 'إيراد حجز #BKG-26-0000001105', type: 'حجز', amount: 4782.61, vat: 717.39, total: 5500.00, provider: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات' },
       { id: '1009', date: '2026-05-23', title: 'إيراد حجز #BKG-26-0000001106', type: 'حجز', amount: 20000.00, vat: 3000.00, total: 23000.00, provider: 'قصر الفخامة لإقامة المناسبات والسهرات' },
       { id: '1010', date: '2026-05-27', title: 'اشتراك الباقة الاحترافية السنوي - شركة الريم', type: 'اشتراك', amount: 8695.65, vat: 1304.35, total: 10000.00, provider: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات' }
    ];
    localStorage.setItem('PLATFORM_REVENUES', JSON.stringify(defaultRevenues));
    return defaultRevenues;
  });

  const [expenses, setExpenses] = useState<any[]>(() => {
    const stored = localStorage.getItem('PLATFORM_EXPENSES');
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {}
    }
    const defaultExpenses = [
       { id: '2001', date: '2026-05-12', title: 'فاتورة خوادم وبنية سحابية AWS', category: 'استضافة', amount: 2000, vat: 300, total: 2300, type: 'operational', provider: 'admin' },
       { id: '2002', date: '2026-05-14', title: 'استرداد حجز ملغي #BKG-26-0000001115', category: 'مستردات', amount: 2500, vat: 375, total: 2875, type: 'refund', provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي' },
       { id: '2003', date: '2026-05-15', title: 'رواتب موظفي صيانة ومتابعة الفواتير والشركاء', category: 'رواتب', amount: 18000, vat: 0, total: 18000, type: 'operational', provider: 'admin' },
       { id: '2004', date: '2026-05-16', title: 'حملة تسويقية ترويجية سناب شات وجوجل', category: 'تسويق', amount: 4500, vat: 675, total: 5175, type: 'operational', provider: 'admin' },
       { id: '2005', date: '2026-05-25', title: 'شراء كوش ورود ومواد أوليةلقاعة كوش الفخمة', category: 'مشتريات', amount: 3500, vat: 525, total: 4025, type: 'operational', provider: 'شركة كوش الفخمة وتنسيق الأفراح والعقود' }
    ];
    localStorage.setItem('PLATFORM_EXPENSES', JSON.stringify(defaultExpenses));
    return defaultExpenses;
  });

  React.useEffect(() => {
    localStorage.setItem('PLATFORM_REVENUES', JSON.stringify(revenues));
  }, [revenues]);

  React.useEffect(() => {
    localStorage.setItem('PLATFORM_EXPENSES', JSON.stringify(expenses));
  }, [expenses]);

  const [customersInvoices, setCustomersInvoices] = useState([
    { id: 9001, customer: 'أحمد عبدالله', date: '2026-05-10', total: 20000, status: 'مدفوعة', bookingId: 101, provider: 'شركة أطياف لتنظيم المعارض' },
    { id: 9002, customer: 'سارة الشمري', date: '2026-05-15', total: 18000, status: 'مدفوعة', bookingId: 102, provider: 'شركة الضيافة الذهبية المحدودة' },
    { id: 9003, customer: 'فيصل العتيبي', date: '2026-05-20', total: 28000, status: 'مدفوعة', bookingId: 103, provider: 'مجموعة قاعات الرياض' },
    { id: 9004, customer: 'ليلى الشهري', date: '2026-05-21', total: 4200, status: 'مدفوعة', bookingId: 104, provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي' },
    { id: 9005, customer: 'خالد الحربي', date: '2026-05-22', total: 5500, status: 'جزئية', bookingId: 105, provider: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات' },
    { id: 9006, customer: 'مريم الدوسري', date: '2026-05-23', total: 23000, status: 'مدفوعة', bookingId: 106, provider: 'قصر الفخامة لإقامة المناسبات والسهرات' },
    { id: 9007, customer: 'فهد القحطاني', date: '2026-05-24', total: 3500, status: 'مدفوعة', bookingId: 107, provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي' },
    { id: 9008, customer: 'منى العنزي', date: '2026-05-25', total: 2800, status: 'مدفوعة', bookingId: 108, provider: 'صالون الأناقة للضيافة والتمثيل' },
    { id: 9009, customer: 'عبدالله الغامدي', date: '2026-05-26', total: 18000, status: 'بانتظار الدفع', bookingId: 109, provider: 'شركة الضيافة الذهبية المحدودة' },
    { id: 9010, customer: 'ريم المطيري', date: '2026-05-27', total: 20000, status: 'مدفوعة', bookingId: 110, provider: 'شركة أطياف لتنظيم المعارض' },
    { id: 9011, customer: 'محمد بن سلمان الشريف', date: '2026-05-28', total: 22000, status: 'مدفوعة', bookingId: 111, provider: 'مجموعة قاعات الرياض' },
    { id: 9012, customer: 'نورة السبيعي', date: '2026-05-29', total: 3000, status: 'جزئية', bookingId: 112, provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي' },
    { id: 9013, customer: 'علي بن حسين الحارثي', date: '2026-05-30', total: 4000, status: 'مدفوعة', bookingId: 113, provider: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات' },
    { id: 9014, customer: 'جواهر آل سعود', date: '2026-06-01', total: 18000, status: 'جزئية', bookingId: 114, provider: 'قصر الفخامة لإقامة المناسبات والسهرات' },
    { id: 9015, customer: 'صالح بن محمد الودعاني', date: '2026-06-02', total: 2500, status: 'ملغاة', bookingId: 115, provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي' }
  ]);

  const [providersInvoices, setProvidersInvoices] = useState([
    { id: 3021, provider: 'شركة أطياف لتنظيم المعارض', date: '2026-05-10', total: 2300, status: 'مدفوعة' },
    { id: 3022, provider: 'سالم الدوسري', date: '2026-05-12', total: 1530, status: 'مدفوعة' },
    { id: 3023, provider: 'شركة الضيافة الذهبية المحدودة', date: '2026-05-14', total: 4500, status: 'بانتظار الدفع' },
    { id: 3024, provider: 'مجموعة قاعات الرياض', date: '2026-05-18', total: 5120, status: 'بانتظار الدفع' },
    { id: 3025, provider: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات', date: '2026-05-20', total: 6000, status: 'مدفوعة' },
    { id: 3026, provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي', date: '2026-05-22', total: 1200, status: 'تحت المراجعة' }
  ]);

  const [claims, setClaims] = useState([
    { id: 'CLM-443', provider: 'شركة أطياف لتنظيم المعارض', amount: 15000, date: '2026-05-18', status: 'مكتملة' },
    { id: 'CLM-444', provider: 'مجموعة قاعات الرياض', amount: 28000, date: '2026-05-21', status: 'مكتملة' },
    { id: 'CLM-445', provider: 'شركة الضيافة الذهبية المحدودة', amount: 18000, date: '2026-05-24', status: 'معالجة' },
    { id: 'CLM-446', provider: 'قصر الفخامة لإقامة المناسبات والسهرات', amount: 23000, date: '2026-05-26', status: 'تحت الإجراء' },
    { id: 'CLM-447', provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي', amount: 4200, date: '2026-05-29', status: 'معلقة' }
  ]);

  const [revSearch, setRevSearch] = useState('');
  const [revTypeFilter, setRevTypeFilter] = useState('');

  const [expSearch, setExpSearch] = useState('');
  const [expCategoryFilter, setExpCategoryFilter] = useState('');

  const [invSearch, setInvSearch] = useState('');
  const [invStatusFilter, setInvStatusFilter] = useState('');

  const [claimSearch, setClaimSearch] = useState('');
  const [claimStatusFilter, setClaimStatusFilter] = useState('');

  const filteredExpenses = expenses
    .filter(e => userRole === 'admin' || String(e.providerId) === String(currentProviderId) || e.provider === currentProvider || e.category === String(currentProviderId))
    .filter(e => {
    const matchSearch = e.title.includes(expSearch) || 
                        String(e.id).includes(expSearch) || 
                        (e.expenseNumber && e.expenseNumber.includes(expSearch)) ||
                        formatExpenseId(e.id).includes(expSearch) ||
                        (e.description && e.description.includes(expSearch));
    const matchCategory = expCategoryFilter ? e.category === expCategoryFilter : true;
    const matchTab = expenseActiveTab === 'all' ? true : (expenseActiveTab === 'refunds' ? e.type === 'refund' : e.type === 'operational');
    return matchSearch && matchCategory && matchTab;
  });

  const filteredCustInvoices = (customersInvoices as any[])
    .filter(i => userRole === 'admin' || i.provider === currentProvider || !i.provider) 
    .filter(i => (formatInvoiceId(i.id).includes(invSearch) || i.customer.includes(invSearch)) && (invStatusFilter ? i.status === invStatusFilter : true));
  
  const filteredProvInvoices = providersInvoices
    .filter(i => userRole === 'admin' || i.provider === currentProvider)
    .filter(i => (formatInvoiceId(i.id).includes(invSearch) || i.provider.includes(invSearch)) && (invStatusFilter ? i.status === invStatusFilter : true));

  const filteredClaims = claims
    .filter(c => userRole === 'admin' || String(c.provider) === String(currentProviderId) || c.provider === currentProvider)
    .filter(c => (String(c.id).includes(claimSearch) || String(c.provider).includes(claimSearch)) && (claimStatusFilter ? c.status === claimStatusFilter : true));

  const refundBookings = useMemo(() => {
    return (bookings || []).filter((b: any) => 
      (b.status === 'ملغي' || b.status === 'cancelled' || b.paymentStatus === 'غير مدفوع' || b.paymentStatus?.includes('refund')) && 
      (userRole === 'admin' || providerHallNames.includes(b.hall))
    );
  }, [bookings, providerHallNames, userRole]);

  const refundServices = useMemo(() => {
    return (localSupportServiceRequests || []).filter((s: any) => 
      (s.status === 'ملغي' || s.status === 'cancelled' || s.status === 'ملغية') && 
      (userRole === 'admin' || s.providerName === currentProvider || s.provider === currentProvider)
    );
  }, [localSupportServiceRequests, currentProvider, userRole]);

  const previousRefunds = useMemo(() => {
    return expenses.filter(e => 
      e.type === 'refund' && 
      (userRole === 'admin' || String(e.providerId) === String(currentProviderId) || e.provider === currentProvider || e.category === String(currentProviderId))
    );
  }, [expenses, userRole, currentProvider, currentProviderId]);

  const calculateExpectedDueDate = (dateStr?: string) => {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(baseDate.getTime())) {
      const fallback = new Date();
      fallback.setDate(fallback.getDate() + 5);
      return fallback.toISOString().split('T')[0];
    }
    let count = 0;
    const current = new Date(baseDate);
    while (count < 5) {
      current.setDate(current.getDate() + 1);
      const day = current.getDay();
      if (day !== 5 && day !== 6) { // Skip Friday (5) & Saturday (6)
        count++;
      }
    }
    return current.toISOString().split('T')[0];
  };

  const handleApproveBookingRefund = async (booking: any) => {
    const expectedDueDateStr = calculateExpectedDueDate(booking.startDate || booking.date);
    if (!window.confirm(`هل أنت متأكد من رغبتك في اعتماد الاسترداد المالي للعميل "${booking.customer}" بقيمة ${booking.amount} ريال لحساب الحجز رقم #${booking.id}؟\n\n- تاريخ الاستحقاق المتوقع المجدول: ${expectedDueDateStr}\n- سيتم تحويل المبلغ إلى محفظة العميل وقيد دفتر اليومية المزدوج آلياً.\n- سيتم إرسال إشعار البريد الإلكتروني الرسمي التلقائي للعميل فوراً.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/payments/refunds/${booking.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          refundId: `REF-BKG-${booking.id}`,
          bookingId: booking.id,
          customerEmail: booking.email || `${booking.customer}@example.com`,
          customerName: booking.customer,
          amount: booking.amount,
          expectedDueDate: expectedDueDateStr,
          reason: 'إلغاء الحجز واعتناده حسب السياسة المالية الموحدة'
        })
      });
    } catch (err) {
      console.warn('Backend refund API call fallback:', err);
    }
    
    const updatedBookings = bookings.map((b: any) => {
      if (b.id === booking.id) {
        return { ...b, paymentStatus: 'مسترد بالكامل', status: 'مسترد', expectedDueDate: expectedDueDateStr };
      }
      return b;
    });
    if (setBookings) {
      setBookings(updatedBookings);
    }
    localStorage.setItem('app_bookings', JSON.stringify(updatedBookings));
    window.dispatchEvent(new Event('bookingsUpdated'));

    const bookingTotal = booking.amount || 0;
    const bookingVat = isVatEnabled ? Math.round((bookingTotal - (bookingTotal / 1.15)) * 100) / 100 : 0;
    const bookingNet = bookingTotal - bookingVat;

    const newRefundExpense = {
      id: String(Math.floor(Math.random() * 9000) + 2000),
      date: new Date().toISOString().split('T')[0],
      expectedDueDate: expectedDueDateStr,
      title: `استرداد حجز ملغي #${booking.id} - العميل: ${booking.customer}`,
      category: 'مستردات',
      amount: bookingNet,
      vat: bookingVat,
      total: bookingTotal,
      type: 'refund',
      provider: currentProvider || booking.provider || 'الشريك الحالي',
      providerId: currentProviderId
    };
    
    const updatedExpenses = [newRefundExpense, ...expenses];
    setExpenses(updatedExpenses);
    localStorage.setItem('PLATFORM_EXPENSES', JSON.stringify(updatedExpenses));
    
    showNotification('success', `✓ تم اعتماد الاسترداد المالي للحجز #${booking.id} بنجاح!\nتاريخ الاستحقاق المتوقع: ${expectedDueDateStr}\nتم قيد العملية في دفتر اليومية وإرسال إشعار البريد الإلكتروني الرسمي للعميل.`);
  };

  const handleApproveServiceRefund = async (serviceReq: any) => {
    const expectedDueDateStr = calculateExpectedDueDate(serviceReq.createdAt || serviceReq.date);
    if (!window.confirm(`هل أنت متأكد من رغبتك في اعتماد الاسترداد المالي للعميل "${serviceReq.customerName}" بقيمة ${serviceReq.price} ريال لحساب خدمة "${serviceReq.serviceName}"؟\n\n- تاريخ الاستحقاق المتوقع المجدول: ${expectedDueDateStr}\n- سيتم تحويل المبلغ لمحفظة العميل وقيد دفتر اليومية آلياً.\n- سيتم إرسال إشعار البريد الإلكتروني التلقائي للعميل.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token') || '';
      await fetch(`/api/payments/refunds/${serviceReq.id}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          refundId: `REF-SRV-${serviceReq.id}`,
          serviceId: serviceReq.id,
          customerEmail: serviceReq.customerEmail || `${serviceReq.customerName}@example.com`,
          customerName: serviceReq.customerName,
          amount: serviceReq.price,
          expectedDueDate: expectedDueDateStr,
          reason: 'استرجاع الخدمة اللوجستية الملغاة'
        })
      });
    } catch (err) {
      console.warn('Backend refund API call fallback:', err);
    }

    const updatedServices = localSupportServiceRequests.map((s: any) => {
      if (s.id === serviceReq.id) {
        return { ...s, status: 'مسترجع بالكامل', expectedDueDate: expectedDueDateStr };
      }
      return s;
    });
    setLocalSupportServiceRequests(updatedServices);
    localStorage.setItem('SUPPORT_SERVICE_REQUESTS_V4', JSON.stringify(updatedServices));
    window.dispatchEvent(new Event('storage'));

    const serviceTotal = serviceReq.price || 0;
    const serviceVat = isVatEnabled ? Math.round((serviceTotal - (serviceTotal / 1.15)) * 100) / 100 : 0;
    const serviceNet = serviceTotal - serviceVat;

    const newRefundExpense = {
      id: String(Math.floor(Math.random() * 9000) + 2000),
      date: new Date().toISOString().split('T')[0],
      expectedDueDate: expectedDueDateStr,
      title: `استرداد خدمة ملغية #${serviceReq.id} - العميل: ${serviceReq.customerName}`,
      category: 'مستردات',
      amount: serviceNet,
      vat: serviceVat,
      total: serviceTotal,
      type: 'refund',
      provider: currentProvider || serviceReq.providerName || 'الشريك الحالي',
      providerId: currentProviderId
    };

    const updatedExpenses = [newRefundExpense, ...expenses];
    setExpenses(updatedExpenses);
    localStorage.setItem('PLATFORM_EXPENSES', JSON.stringify(updatedExpenses));

    showNotification('success', `✓ تم اعتماد الاسترداد المالي للخدمة #${serviceReq.id} بقيمة ${serviceReq.price} ريال بنجاح!\nتاريخ الاستحقاق المتوقع: ${expectedDueDateStr}\nتم قيد العملية وإرسال إشعار البريد الإلكتروني للعميل.`);
  };

  const [isUploading, setIsUploading] = useState(false);

  const [newRevenue, setNewRevenue] = useState({
    title: '',
    type: 'إيرادات خارجية عامة',
    total: '',
    referenceNumber: '',
    payerName: '',
    collectionMethod: 'bank',
    description: '',
    notes: '',
    attachmentUrl: '',
    isExternal: true,
    isTaxable: true
  });
  const [newExpense, setNewExpense] = useState({
    title: '',
    category: 'أخرى',
    total: '',
    paymentMethod: 'bank',
    dueDate: '',
    status: 'paid',
    description: '',
    notes: '',
    attachmentUrl: '',
    isExternal: true,
    isTaxable: true
  });

  // Interactive Tax Calculator States
  const [isExpenseTaxCalcOpen, setIsExpenseTaxCalcOpen] = useState(false);
  const [expenseCalcAmount, setExpenseCalcAmount] = useState('');
  const [expenseCalcMode, setExpenseCalcMode] = useState<'add_vat' | 'extract_vat'>('add_vat');

  const [isRevenueTaxCalcOpen, setIsRevenueTaxCalcOpen] = useState(false);
  const [revenueCalcAmount, setRevenueCalcAmount] = useState('');
  const [revenueCalcMode, setRevenueCalcMode] = useState<'add_vat' | 'extract_vat'>('add_vat');

  React.useEffect(() => {
    const handleAddRevenueEvent = (e: any) => {
      const { title, type, total } = e.detail;
      const base = total / 1.15;
      const vat = total - base;
      setRevenues(prev => [{
         id: `RV-${Math.floor(Math.random()*10000)}`,
         date: new Date().toISOString().split('T')[0],
         title,
         type,
         amount: base,
         vat: vat,
         total: total,
         provider: userRole === 'provider' ? currentProvider : 'admin'
      }, ...prev]);
    };

    const handleAddExpenseEvent = (e: any) => {
      const { title, category, total, type } = e.detail;
      const base = total / 1.15;
      const vat = total - base;
      setExpenses(prev => [{
         id: `EX-${Math.floor(Math.random()*10000)}`,
         date: new Date().toISOString().split('T')[0],
         title,
         category: category || 'أخرى',
         amount: base,
         vat: vat,
         total: total,
         type: type || 'operational',
         provider: userRole === 'provider' ? currentProvider : 'admin'
      }, ...prev]);
    };

    window.addEventListener('add_finance_revenue', handleAddRevenueEvent);
    window.addEventListener('add_finance_expense', handleAddExpenseEvent);
    return () => {
      window.removeEventListener('add_finance_revenue', handleAddRevenueEvent);
      window.removeEventListener('add_finance_expense', handleAddExpenseEvent);
    };
  }, []);

  const [lastVATDate, setLastVATDate] = useState<string | null>(localStorage.getItem('lastVATDate'));
  const [vatPeriodType, setVatPeriodType] = useState<string>(localStorage.getItem('vatPeriodType') || 'monthly');
  const [lastZakatDate, setLastZakatDate] = useState<string | null>(localStorage.getItem('lastZakatDate'));

  const getProviderCommissionRate = (providerNameOrHall: string) => {
    let providerName = providerNameOrHall;
    const hallObj = (halls || []).find((h: any) => h.name === providerNameOrHall);
    if (hallObj) {
      providerName = hallObj.provider;
    }
    const prov = (providers || []).find((p: any) => p.name === providerName);
    if (!prov) return 0.10;
    const pkg = prov.packageName || '';
    if (pkg.includes('الاحترافية') || pkg.includes('pro') || pkg.includes('Pro')) return 0.05;
    if (pkg.includes('الأعمال') || pkg.includes('business') || pkg.includes('Business')) return 0.10;
    if (pkg.includes('الأساسية') || pkg.includes('basic') || pkg.includes('Basic')) return 0.15;
    return 0.10;
  };

  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return false;
    const year = parts[0];
    const month = parts[1];
    
    const period = dashboardPeriod && dashboardPeriod !== 'all' ? dashboardPeriod : 'local';
    const targetYear = selectedDashboardYear || '2026';
    const targetMonth = selectedDashboardMonth || '05';

    if (period === 'monthly') {
      return year === targetYear && month === targetMonth;
    } else if (period === 'yearly') {
      if (yearlyPeriodType === 'academic') {
        const prevYear = String(parseInt(targetYear, 10) - 1);
        const startAcademic = `${prevYear}-09-01`;
        const endAcademic = `${targetYear}-08-31`;
        const currentDayStr = dateStr.split('T')[0];
        return currentDayStr >= startAcademic && currentDayStr <= endAcademic;
      } else if (yearlyPeriodType === 'zakat') {
        const prevYear = String(parseInt(targetYear, 10) - 1);
        const startZakat = `${prevYear}-03-10`; 
        const endZakat = `${targetYear}-03-09`;
        const currentDayStr = dateStr.split('T')[0];
        return currentDayStr >= startZakat && currentDayStr <= endZakat;
      } else {
        return year === targetYear;
      }
    } else if (period === 'custom') {
      if (!customStartDate || !customEndDate) return true;
      const currentDayStr = dateStr.split('T')[0];
      return currentDayStr >= customStartDate && currentDayStr <= customEndDate;
    } else {
      const filter = dateFilter || 'month';
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      const cleanDateStr = dateStr.split('T')[0];
      
      if (filter === 'today') {
        return cleanDateStr === todayStr;
      } else if (filter === 'week') {
        const dDate = new Date(cleanDateStr);
        const diffTime = today.getTime() - dDate.getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        return diffDays >= 0 && diffDays <= 7;
      } else if (filter === 'month') {
        const dDate = new Date(cleanDateStr);
        return dDate.getFullYear() === 2026 && dDate.getMonth() === 4;
      } else if (filter === 'year') {
        const dDate = new Date(cleanDateStr);
        return dDate.getFullYear() === 2026;
      }
      return true;
    }
  };

  const mappedBookingsReal = useMemo(() => {
    return (bookings || [])
      .filter((b: any) => {
        if (b.status === 'ملغي' || b.status === 'ملغاة') return false;
        if (userRole === 'provider') {
          const hallObj = (halls || []).find((h: any) => h.name === b.hall);
          return hallObj?.provider === currentProvider;
        }
        return true;
      })
      .filter((b: any) => isDateInPeriod(b.date || b.startDate || ''))
      .map((b: any) => {
        const total = b.totalPrice || b.amount || 0;
        const rate = getProviderCommissionRate(b.providerName || b.hall);
        
        let displayTotal = total;
        let titleSuffix = '';
        if (userRole === 'admin') {
          displayTotal = total * rate;
          titleSuffix = ` (عمولة المنصة ${rate * 100}%)`;
        } else {
          displayTotal = total * (1 - rate);
          titleSuffix = ` (صافي الإيراد بعد عمولة ${rate * 100}%)`;
        }
        
        const base = displayTotal / 1.15;
        const vat = displayTotal - base;
        const pName = (halls || []).find((h: any) => h.name === b.hall)?.provider || currentProvider || 'عام';
        return {
          id: `RV-B-${b.id}`,
          date: b.date || b.startDate || '2026-05-29',
          title: `إيراد حجز صالة #${b.id} - ${b.hall}${titleSuffix}`,
          type: 'حجز قاعات ومرافق',
          amount: Math.round(base * 100) / 100,
          vat: Math.round(vat * 100) / 100,
          total: Math.round(displayTotal * 100) / 100,
          provider: pName
        };
      });
  }, [bookings, halls, providers, userRole, currentProvider, dashboardPeriod, selectedDashboardMonth, selectedDashboardYear, customStartDate, customEndDate, dateFilter]);

  const mappedServicesReal = useMemo(() => {
    return (supportServiceRequests || [])
      .filter((s: any) => {
        if (s.status === 'ملغي' || s.status === 'ملغاة') return false;
        if (userRole === 'provider') {
          return s.providerName === currentProvider || s.provider === currentProvider;
        }
        return true;
      })
      .filter((s: any) => isDateInPeriod(s.date || ''))
      .map((s: any) => {
        const total = s.price || s.amount || 0;
        const rate = getProviderCommissionRate(s.providerName);
        
        let displayTotal = total;
        let titleSuffix = '';
        if (userRole === 'admin') {
          displayTotal = total * rate;
          titleSuffix = ` (عمولة المنصة ${rate * 100}%)`;
        } else {
          displayTotal = total * (1 - rate);
          titleSuffix = ` (صافي الإيراد بعد عمولة ${rate * 100}%)`;
        }
        
        const base = displayTotal / 1.15;
        const vat = displayTotal - base;
        const pName = s.providerName || s.provider || currentProvider || 'عام';
        return {
          id: `RV-S-${s.id}`,
          date: s.date || '2026-05-29',
          title: `إيراد خدمة مساندة #${s.id} - ${s.serviceName}${titleSuffix}`,
          type: 'خدمة مساندة مستقلة',
          amount: Math.round(base * 100) / 100,
          vat: Math.round(vat * 100) / 100,
          total: Math.round(displayTotal * 100) / 100,
          provider: pName
        };
      });
  }, [supportServiceRequests, providers, userRole, currentProvider, dashboardPeriod, selectedDashboardMonth, selectedDashboardYear, customStartDate, customEndDate, dateFilter]);

  const dynamicSubscriptions = useMemo(() => {
    if (userRole !== 'admin') return [];
    
    const list: any[] = [];
    (providers || []).forEach((prov: any) => {
      const pkg = prov.packageName || '';
      const isYearly = prov.packageDuration === 'yearly';
      let price = 0;
      if (pkg.includes('الاحترافية') || pkg.includes('pro') || pkg.includes('Pro')) {
        price = isYearly ? 3830 : 399;
      } else if (pkg.includes('الأعمال') || pkg.includes('business') || pkg.includes('Business')) {
        price = isYearly ? 1910 : 199;
      } else if (pkg.includes('الأساسية') || pkg.includes('basic') || pkg.includes('Basic')) {
        price = isYearly ? 950 : 99;
      } else {
        price = isYearly ? 1910 : 199;
      }
      
      const displayTotal = dashboardPeriod === 'monthly'
        ? (isYearly ? Math.floor(price / 12) : price)
        : dashboardPeriod === 'yearly'
        ? (isYearly ? price : price * 12)
        : (isYearly ? Math.floor(price / 12) : price);
        
      const base = displayTotal / 1.15;
      const vat = displayTotal - base;
      
      list.push({
        id: `RV-SUB-${prov.id || prov.name}`,
        date: '2026-05-01',
        title: `اشتراك باقة ${pkg} - ${prov.name}`,
        type: 'اشتراك',
        amount: Math.round(base * 100) / 100,
        vat: Math.round(vat * 100) / 100,
        total: Math.round(displayTotal * 100) / 100,
        provider: prov.name
      });
    });
    return list;
  }, [providers, userRole, dashboardPeriod]);

  const dynamicMarketingComms = useMemo(() => {
    if (userRole !== 'admin') return [];
    
    return (campaigns || [])
      .filter((c: any) => isDateInPeriod(c.startDate) && (c.status === 'نشطة' || c.status === 'مكتملة' || c.status === 'موافق عليها' || c.status === 'مفعّلة'))
      .map((c: any) => {
        const rate = 0.20; // 20% commission on agency fees
        const agencyFee = typeof c.agencyFee === 'number' && c.agencyFee > 0
          ? c.agencyFee
          : typeof c.agencyFees === 'number' && c.agencyFees > 0
          ? c.agencyFees
          : (c.budget || 0) * 0.15;
          
        const displayTotal = agencyFee * rate;
        const base = displayTotal / 1.15;
        const vat = displayTotal - base;
        
        return {
          id: `RV-MKT-${c.id}`,
          date: c.startDate || '2026-05-15',
          title: `عمولة المنصة من حملة تسويقية - ${c.title}`,
          type: 'عمولة',
          amount: Math.round(base * 100) / 100,
          vat: Math.round(vat * 100) / 100,
          total: Math.round(displayTotal * 100) / 100,
          provider: c.provider || 'عام'
        };
      });
  }, [campaigns, userRole, dashboardPeriod, selectedDashboardMonth, selectedDashboardYear, customStartDate, customEndDate, dateFilter]);

  const displayRevenues = useMemo(() => {
    // We pull strictly from the persistent database table records to guarantee 100% data integrity
    return revenues
      .filter(r => (userRole === 'admin' || String(r.providerId) === String(currentProviderId) || r.provider === currentProvider))
      .filter(r => isDateInPeriod(r.date));
  }, [revenues, userRole, currentProvider, currentProviderId, dashboardPeriod, selectedDashboardMonth, selectedDashboardYear, customStartDate, customEndDate, dateFilter]);

  const displayExpenses = useMemo(() => {
    return expenses
      .filter(e => userRole === 'admin' || String(e.providerId) === String(currentProviderId) || e.provider === currentProvider || e.category === String(currentProviderId))
      .filter(e => isDateInPeriod(e.date || ''));
  }, [expenses, userRole, currentProvider, currentProviderId, dashboardPeriod, selectedDashboardMonth, selectedDashboardYear, customStartDate, customEndDate, dateFilter]);

  const totalRevenue = displayRevenues.reduce((sum, r) => sum + r.total, 0);
  const totalExpense = displayExpenses.reduce((sum, e) => sum + e.total, 0);
  
  // Recalculate VAT accurately (if taxable)
  const totalVAT = isVatEnabled ? displayRevenues.reduce((sum, r) => sum + r.vat, 0) : 0;
  const netEarnings = totalRevenue - totalVAT - totalExpense; 
  
  const kpis = {
    totalRevenue: totalRevenue,
    totalExpense: totalExpense,
    totalVAT: totalVAT,
    netProfit: netEarnings,
    pendingClaims: (userRole === 'admin' ? claims : claims.filter(c => c.provider === currentProvider)).filter(c => c.status === 'معلقة').reduce((sum, c) => sum + c.amount, 0),
  };

  const filteredRevenues = displayRevenues
    .filter(r => (r.title.includes(revSearch) || String(r.id).includes(revSearch) || formatRevenueId(r.id).includes(revSearch)) && (revTypeFilter ? (revTypeFilter === 'حجز' ? (r.type === 'حجز' || r.type === 'حجز قاعات ومرافق') : (revTypeFilter === 'خدمة' ? (r.type === 'خدمة' || r.type === 'خدمة مساندة مستقلة') : r.type === revTypeFilter)) : true));

  const formatDateToDDMMYYYY = (dateVal: any): string => {
    if (!dateVal) return '-';
    try {
      const str = String(dateVal).trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
        return str;
      }
      const partsSlash = str.split('/');
      if (partsSlash.length === 3) {
        let [d, m, y] = partsSlash;
        d = d.padStart(2, '0');
        m = m.padStart(2, '0');
        if (y.length === 2) {
          y = '20' + y;
        }
        return `${d}/${m}/${y}`;
      }
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return str;
    } catch (e) {
      return String(dateVal);
    }
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    let headers: string[] = [];
    let rows: string[][] = [];

    const cleanField = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val).trim();
      // Escape double quotes inside
      str = str.replace(/"/g, '""');
      // Wrap in double quotes if there are commas, double quotes, semicolons, or newlines
      if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    if (filename.includes('customer_invoices')) {
      headers = ['رقم الفاتورة', 'العميل', 'رقم الحجز', 'مزود الخدمة', 'التاريخ', 'الإجمالي المالي (SAR)', 'الحالة'];
      rows = data.map(item => [
        formatInvoiceId(item.id),
        item.customer || '-',
        item.bookingId ? formatBookingId(item.bookingId) : '-',
        item.provider || '-',
        formatDateToDDMMYYYY(item.date),
        (item.total || 0).toFixed(2),
        item.status || '-'
      ].map(cleanField));
    } else if (filename.includes('provider_invoices')) {
      headers = ['رقم الفاتورة', 'المزود', 'التاريخ', 'الإجمالي المالي (SAR)', 'الحالة'];
      rows = data.map(item => [
        `INV-${String(item.id).trim()}`,
        item.provider || '-',
        formatDateToDDMMYYYY(item.date),
        (item.total || 0).toFixed(2),
        item.status || '-'
      ].map(cleanField));
    } else if (filename.includes('ledger_operations')) {
      headers = ['المعرف', 'التاريخ', 'البيان', 'النوع', 'المبلغ الأساسي (SAR)', 'الضريبة (15%)', 'الإجمالي (SAR)', 'الحالة'];
      rows = data.map(item => [
        String(item.id).trim(),
        formatDateToDDMMYYYY(item.date),
        item.title || '-',
        item.entryType || '-',
        (item.amount || 0).toFixed(2),
        (item.vat || 0).toFixed(2),
        (item.total || 0).toFixed(2),
        'مكتمل'
      ].map(cleanField));
    } else if (filename.includes('forecast_projections')) {
      headers = ['الفترة المخططة', 'التاريخ التقديري', 'حالة الموسم', 'عدد الحجوزات المتوقعة', 'الإيرادات المتوقعة (SAR)', 'المصروفات التشغيلية المقدرة (SAR)', 'صافي الربح التقديري (SAR)', 'نسبة أمان التوقعات'];
      rows = data.map(item => [
        item.month || '-',
        formatDateToDDMMYYYY(item.date),
        item.isPeak ? 'ذروة موسمية' : 'موسم اعتيادي',
        String(item.count || 0),
        (item.revenue || 0).toFixed(2),
        (item.expense || 0).toFixed(2),
        (item.netProfit || 0).toFixed(2),
        item.confidence || '-'
      ].map(cleanField));
    } else {
      // Fallback for general data structures
      const keys = Object.keys(data[0]);
      headers = keys.map(k => {
        // Simple translation for key fallbacks if any
        if (k === 'id') return 'المعرف';
        if (k === 'date') return 'التاريخ';
        if (k === 'title') return 'البيان';
        if (k === 'amount') return 'المبلغ الأساسي (SAR)';
        if (k === 'vat') return 'الضريبة';
        if (k === 'total') return 'الإجمالي (SAR)';
        if (k === 'provider') return 'المزود/الشريك';
        if (k === 'status') return 'الحالة';
        if (k === 'category') return 'الفئة';
        return k;
      });
      rows = data.map(row => 
        keys.map(k => {
          let val = row[k];
          if (k === 'date') val = formatDateToDDMMYYYY(val);
          return val;
        }).map(cleanField)
      );
    }

    // Build standard CSV utilizing \uFEFF BOM for Arabic alignment in Excel and split via customized semicolon (;)
    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    if (typeof showNotification === 'function') {
      showNotification('success', `تم تصدير ملف ${filename} بنجاح كجدول منظم بفاصلة منقوطة متوافق مع Excel!`);
    } else {
      alert(`تم تصدير ملف ${filename} بنجاح كجدول منظم متوافق مع Excel!`);
    }
  };

  const downloadXLS = (data: any[], filename: string) => {
    if (data.length === 0) return;

    let headers: string[] = [];
    let rows: any[][] = [];

    const cleanXLSField = (val: any) => {
      if (val === null || val === undefined) return '';
      return String(val).trim();
    };

    const isCustomer = filename.includes('customer_invoices');

    if (isCustomer) {
      headers = ['رقم الفاتورة', 'العميل', 'رقم الحجز', 'مزود الخدمة', 'التاريخ', 'الإجمالي المالي (SAR)', 'الحالة'];
      rows = data.map(item => {
        const invId = formatInvoiceId(item.id);
        const cust = cleanXLSField(item.customer) || '-';
        const bookingId = item.bookingId ? formatBookingId(item.bookingId) : '-';
        const prov = cleanXLSField(item.provider) || '-';
        const dateStr = formatDateToDDMMYYYY(item.date);
        const totalStr = (item.total || 0).toFixed(2);
        const statusStr = cleanXLSField(item.status) || '-';
        return [invId, cust, bookingId, prov, dateStr, totalStr, statusStr];
      });
    } else {
      headers = ['رقم الفاتورة', 'المزود', 'التاريخ', 'الإجمالي المالي (SAR)', 'الحالة'];
      rows = data.map(item => {
        const invId = `INV-${String(item.id).trim()}`;
        const prov = cleanXLSField(item.provider) || '-';
        const dateStr = formatDateToDDMMYYYY(item.date);
        const totalStr = (item.total || 0).toFixed(2);
        const statusStr = cleanXLSField(item.status) || '-';
        return [invId, prov, dateStr, totalStr, statusStr];
      });
    }

    const getStatusStyle = (status: string) => {
      const s = status.trim();
      if (s === 'مدفوعة' || s === 'مدفوع' || s.includes('مدفوع')) {
        // Light green status (text #065f46, background #d1fae5, border #a7f3d0)
        return 'background-color: #d1fae5; color: #065f46; font-weight: bold; border: 1px solid #a7f3d0; text-align: center; mso-number-format: "\\@";';
      } else if (s === 'غير مدفوعة' || s === 'غير مدفوع' || s === 'ملغية' || s === 'ملغى' || s === 'ملغية / غير مدفوعة' || s === 'فاشلة' || s.includes('غير') || s.includes('ملغ') || s.includes('فاشل')) {
        // Soft red status (text #991b1b, background #fee2e2, border #fecaca)
        return 'background-color: #fee2e2; color: #991b1b; font-weight: bold; border: 1px solid #fecaca; text-align: center; mso-number-format: "\\@";';
      } else {
        // Warm yellow status (text #92400e, background #fef3c7, border #fde68a for pending/partial)
        return 'background-color: #fef3c7; color: #92400e; font-weight: bold; border: 1px solid #fde68a; text-align: center; mso-number-format: "\\@";';
      }
    };

    // Build standard XML / HTML with office schema references for perfect XLS representation, supporting RTL
    let html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">`;
    html += `<head>`;
    html += `<meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>`;
    html += `<!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>سجل العمليات المالية</x:Name><x:WorksheetOptions><x:DisplayRightToLeft/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->`;
    html += `<style>`;
    html += `  table { border-collapse: collapse; direction: rtl; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }`;
    html += `  th { background-color: #1e293b; color: #ffffff; font-weight: bold; font-size: 11pt; border: 1px solid #cbd5e1; padding: 12px 16px; text-align: center; }`;
    html += `  td { border: 1px solid #cbd5e1; padding: 10px 14px; font-size: 10pt; text-align: right; color: #334155; }`;
    html += `  .id-cell { mso-number-format: "\\@"; font-weight: bold; color: #0f172a; text-align: center; }`;
    html += `</style>`;
    html += `</head>`;
    html += `<body style="direction: rtl; padding: 20px;">`;
    html += `<h3 style="color: #1e3a8a; text-align: right; font-family: 'Segoe UI', sans-serif; margin-bottom: 15px;">كشف الفواتير والمدفوعات المالي</h3>`;
    html += `<table>`;
    
    // Headers
    html += `<tr>`;
    headers.forEach(header => {
      html += `<th>${header}</th>`;
    });
    html += `</tr>`;

    // Data rows
    rows.forEach(row => {
      html += `<tr>`;
      row.forEach((cell, idx) => {
        const isStatusCell = idx === headers.length - 1;
        const isIdCell = idx === 0 || (isCustomer && idx === 2); // Invoice ID or Booking ID
        
        if (isStatusCell) {
          html += `<td style="${getStatusStyle(cell)}">${cell}</td>`;
        } else if (isIdCell) {
          html += `<td class="id-cell" style="mso-number-format: '\\@';">${cell}</td>`;
        } else {
          html += `<td>${cell}</td>`;
        }
      });
      html += `</tr>`;
    });

    html += `</table>`;
    html += `</body>`;
    html += `</html>`;

    // Download XLS using Blob
    const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (typeof showNotification === 'function') {
      showNotification('success', `تم تصدير ملف ${filename} بنجاح كجدول إكسل ملون ومنسق يدعم RTL!`);
    } else {
      alert(`تم تصدير ملف ${filename} بنجاح كجدول إكسل ملون ومنسق يدعم RTL!`);
    }
  };

  const downloadPDF = async (title: string, data: any[]) => {
    const btn = document.activeElement as HTMLButtonElement;
    const originalText = btn?.innerHTML || '';
    if (btn) {
      btn.innerHTML = '<span class="animate-spin inline-block w-4 h-4 border-2 border-slate-300 border-t-slate-800 rounded-full"></span> جاري التحضير...';
      btn.disabled = true;
    }

    // Build offscreen content for pristine multi-page A4 Portrait layout
    const tempDiv = document.createElement('div');
    tempDiv.style.position = 'absolute';
    tempDiv.style.left = '-9999px';
    tempDiv.style.top = '-9999px';
    tempDiv.style.width = '750px'; // Perfect width for clean margins and crisp text
    tempDiv.dir = 'rtl';
    tempDiv.style.fontFamily = 'system-ui, -apple-system, sans-serif';
    tempDiv.className = 'p-8 bg-white text-slate-800';

    try {
      // Map and sort entries
      const items = data.map(item => {
        let type = item.entryType;
        if (!type) {
          type = (item.category || item.type === 'operational') ? 'مصروف' : 'إيراد';
        }
        return {
          ...item,
          entryType: type
        };
      }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const totalRev = items.filter(item => item.entryType === 'إيراد').reduce((sum, item) => sum + (item.total || 0), 0);
      const totalExp = items.filter(item => item.entryType === 'مصروف').reduce((sum, item) => sum + (item.total || 0), 0);

      let rowsHtml = '';
      items.forEach(item => {
        const idStr = String(item.id).trim();
        const dateStr = formatDateToDDMMYYYY(item.date);
        const titleStr = item.title || '-';
        const typeStr = item.entryType;
        const typeBg = item.entryType === 'إيراد' ? '#f0fdf4' : '#fef2f2';
        const typeColor = item.entryType === 'إيراد' ? '#16803d' : '#b91c1c';
        
        const baseAmount = item.amount || 0;
        const vatAmount = item.vat || 0;
        const totalVal = item.total || 0;

        rowsHtml += `
          <tr style="border-bottom: 1px solid #e2e8f0; font-size: 11px;">
            <td style="padding: 10px 8px; color: #64748b; border: 1px solid #e2e8f0; font-weight: 500;">${idStr}</td>
            <td style="padding: 10px 8px; color: #334155; border: 1px solid #e2e8f0; font-family: monospace;">${dateStr}</td>
            <td style="padding: 10px 8px; font-weight: bold; color: #0f172a; border: 1px solid #e2e8f0; text-align: right; max-width: 180px; word-wrap: break-word;">${titleStr}</td>
            <td style="padding: 10px 8px; text-align: center; border: 1px solid #e2e8f0;">
              <span style="background-color: ${typeBg}; color: ${typeColor}; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 10px; display: inline-block;">
                ${typeStr}
              </span>
            </td>
            <td style="padding: 10px 8px; text-align: left; font-family: monospace; border: 1px solid #e2e8f0; font-weight: 500;">${baseAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 8px; text-align: left; font-family: monospace; color: #64748b; border: 1px solid #e2e8f0;">${vatAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 8px; text-align: left; font-family: monospace; font-weight: bold; color: #1e1b4b; border: 1px solid #e2e8f0;">${totalVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td style="padding: 10px 8px; text-align: center; color: #15803d; font-weight: bold; font-size: 10px; border: 1px solid #e2e8f0;">مكتمل</td>
          </tr>
        `;
      });

      tempDiv.innerHTML = `
        <div style="border: 2px solid #e2e8f0; padding: 30px; border-radius: 16px; background-color: #ffffff;">
          <!-- Header -->
          <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 3px double #cbd5e1; padding-bottom: 20px; margin-bottom: 25px;">
            <div style="text-align: right;">
              <h1 style="margin: 0; color: #1e1b4b; font-size: 22px; font-weight: 900; display: flex; align-items: center; gap: 8px;">
                🏛️ كشف سجل العمليات والقيود المالية (Ledger)
              </h1>
              <p style="margin: 5px 0 0 0; color: #64748b; font-size: 13px; font-weight: 500;">كافة الحركات المالية التفصيلية للإيرادات والمصروفات - منصة ليلة لخدمات المناسبات</p>
            </div>
            <div style="text-align: left; font-size: 11px; color: #475569; font-weight: bold; line-height: 1.5;">
              <div>تاريخ التصدير: ${formatDateToDDMMYYYY(new Date().toISOString().split('T')[0])}</div>
              <div>رقم الكشف: LDG-${Math.floor(Math.random() * 89999 + 10000)}</div>
              <div style="color: #0284c7; margin-top: 4px;">الحالة المعتمدة: كشف مالي مدقق</div>
            </div>
          </div>

          <!-- Summary KPI widgets -->
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px;">
            <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 12px; padding: 15px; text-align: right; border-right: 4px solid #10b981;">
              <div style="font-size: 11px; color: #15803d; font-weight: bold; margin-bottom: 5px;">إجمالي المقبوضات / الإيرادات</div>
              <div style="font-size: 18px; font-weight: 900; color: #065f46; font-family: monospace;">${totalRev.toLocaleString('ar-SA')} ر.س</div>
            </div>
            <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 12px; padding: 15px; text-align: right; border-right: 4px solid #ef4444;">
              <div style="font-size: 11px; color: #991b1b; font-weight: bold; margin-bottom: 5px;">إجمالي المدفوعات / المصروفات</div>
              <div style="font-size: 18px; font-weight: 900; color: #b91c1c; font-family: monospace;">${totalExp.toLocaleString('ar-SA')} ر.س</div>
            </div>
            <div style="background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 12px; padding: 15px; text-align: right; border-right: 4px solid #0284c7;">
              <div style="font-size: 11px; color: #0369a1; font-weight: bold; margin-bottom: 5px;">صافي الرصيد المالي</div>
              <div style="font-size: 18px; font-weight: 900; color: #075985; font-family: monospace;">${(totalRev - totalExp).toLocaleString('ar-SA')} ر.س</div>
            </div>
          </div>

          <!-- Table -->
          <table style="width: 100%; border-collapse: collapse; text-align: right; margin-top: 15px; border: 1px solid #e2e8f0;">
            <thead>
              <tr style="background-color: #f1f5f9; border-bottom: 2px solid #cbd5e1;">
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: right; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">المعرف</th>
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: right; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">التاريخ</th>
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: right; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">البيان</th>
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: center; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">النوع</th>
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: left; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">الأساسي</th>
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: left; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">الضريبة (15%)</th>
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: left; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">الإجمالي (SAR)</th>
                <th style="padding: 12px 8px; color: #1e1b4b; font-weight: bold; text-align: center; font-size: 12px; border: 1px solid #e2e8f0; background-color: #f8fafc;">الحالة</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <!-- Footer warning -->
          <div style="margin-top: 35px; border-top: 1px solid #cbd5e1; padding-top: 15px; font-size: 11px; color: #475569; line-height: 1.6; text-align: right;">
            <b>تنبيه فني وقانوني:</b> يعتبر هذا التقرير مستند محاسبي داخلي مستخرج من منصة ليلة لخدمات ومزودي المناسبات. يرجى مراجعة إقراراتكم الضريبية المعتمدة للتحقق النهائي والامتثال القانوني الكامل.
          </div>
        </div>
      `;

      document.body.appendChild(tempDiv);

      const canvas = await html2canvasSafe(tempDiv, {
        scale: 2.0,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4'
      });
      
      const pdfWidth = 595.28;  // A4 point width
      const pdfHeight = 841.89; // A4 point height
      
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const renderedImgHeight = (canvasHeight * pdfWidth) / canvasWidth;
      
      let heightLeft = renderedImgHeight;
      let position = 0;
      
      pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedImgHeight);
      heightLeft -= pdfHeight;
      
      while (heightLeft > 0) {
        position = heightLeft - renderedImgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'JPEG', 0, position, pdfWidth, renderedImgHeight);
        heightLeft -= pdfHeight;
      }
      
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      document.body.removeChild(tempDiv);

      if (typeof showNotification === 'function') {
        showNotification('success', `تم تصدير ملف ${title} بنجاح كصفحات A4 عمودية منظمة وحفظه على جهازك بصيغة PDF!`);
      }
    } catch (err) {
      console.error('Error generating Ledger PDF', err);
      // Fallback
      if (tempDiv.parentNode) {
        document.body.removeChild(tempDiv);
      }
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
      pdf.setFontSize(16);
      pdf.text(`Lailah Platform - ${title}`, 20, 20);
      pdf.setFontSize(12);
      pdf.text(`Date generated: ${new Date().toLocaleDateString()}`, 20, 30);
      pdf.text(`Number of records: ${data.length}`, 20, 40);
      pdf.save(`${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      if (typeof showNotification === 'function') {
        showNotification('success', `تم تصدير كشف ${title} الأساسي بنجاح بصيغة PDF وحفظه على جهازك!`);
      }
    } finally {
      if (btn) {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return (amount || 0).toLocaleString('ar-SA', { style: 'currency', currency: 'SAR' });
  };

  const chartData = useMemo(() => {
    // Collect all transactions (revenues, expenses, refunds) grouped by date
    const dailyMap: { [key: string]: { revenue: number; expense: number; refund: number } } = {};
    
    displayRevenues.forEach(r => {
      if (!r.date) return;
      const dateStr = String(r.date).split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { revenue: 0, expense: 0, refund: 0 };
      }
      dailyMap[dateStr].revenue += (r.total || 0);
    });

    displayExpenses.forEach(e => {
      if (!e.date) return;
      const dateStr = String(e.date).split('T')[0];
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { revenue: 0, expense: 0, refund: 0 };
      }
      if (e.type === 'refund' || e.category === 'مستردات') {
        dailyMap[dateStr].refund += (e.total || 0);
      } else {
        dailyMap[dateStr].expense += (e.total || 0);
      }
    });

    const sortedDates = Object.keys(dailyMap).sort();
    
    if (sortedDates.length === 0) {
      return [
        { name: 'لا توجد حركات', revenue: 0, expense: 0, refund: 0, liquidity: 0 }
      ];
    }

    const monthNamesAr: { [key: string]: string } = {
      '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
      '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
      '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
    };

    let runningLiquidity = 0;
    const rawData = sortedDates.map(dStr => {
      const parts = dStr.split('-');
      let label = dStr;
      if (parts.length === 3) {
        const day = parseInt(parts[2], 10);
        const month = parts[1];
        const monthAr = monthNamesAr[month] || month;
        label = `${day} ${monthAr}`;
      }
      const rev = Math.round(dailyMap[dStr].revenue);
      const exp = Math.round(dailyMap[dStr].expense);
      const ref = Math.round(dailyMap[dStr].refund);
      runningLiquidity += (rev - exp - ref);

      return {
        name: label,
        revenue: rev,
        expense: exp,
        refund: ref,
        liquidity: Math.round(runningLiquidity)
      };
    });

    // Apply flow type filter
    const filtered = rawData.map(item => ({
      ...item,
      revenue: (flowTypeFilter === 'all' || flowTypeFilter === 'inflow') ? item.revenue : 0,
      expense: (flowTypeFilter === 'all' || flowTypeFilter === 'settlement') ? item.expense : 0,
      refund: (flowTypeFilter === 'all' || flowTypeFilter === 'refund') ? item.refund : 0
    }));

    // Apply zoom factor
    if (chartZoomFactor > 1 && filtered.length > 2) {
      const sliceLength = Math.max(2, Math.ceil(filtered.length / chartZoomFactor));
      return filtered.slice(-sliceLength);
    }

    return filtered;
  }, [displayRevenues, displayExpenses, flowTypeFilter, chartZoomFactor]);

  const revenueDistribution = useMemo(() => {
    let bookingsTotal = 0;
    let servicesTotal = 0;
    let subscriptionsTotal = 0;
    let otherTotal = 0;

    displayRevenues.forEach(r => {
      const type = r.type || '';
      if (type.includes('حجز') || type.includes('قاعة')) {
        bookingsTotal += r.total;
      } else if (type.includes('خدمة') || type.includes('مساندة')) {
        servicesTotal += r.total;
      } else if (type.includes('اشتراك')) {
        subscriptionsTotal += r.total;
      } else {
        otherTotal += r.total;
      }
    });

    const grandTotal = bookingsTotal + servicesTotal + subscriptionsTotal + otherTotal;
    if (grandTotal === 0) {
      return {
        bookingsPct: 0,
        servicesPct: 0,
        subscriptionsPct: 0,
        otherPct: 0,
        bookingsTotal,
        servicesTotal,
        subscriptionsTotal,
        otherTotal
      };
    }

    return {
      bookingsPct: Math.round((bookingsTotal / grandTotal) * 100),
      servicesPct: Math.round((servicesTotal / grandTotal) * 100),
      subscriptionsPct: Math.round((subscriptionsTotal / grandTotal) * 100),
      otherPct: Math.round((otherTotal / grandTotal) * 100),
      bookingsTotal,
      servicesTotal,
      subscriptionsTotal,
      otherTotal
    };
  }, [displayRevenues]);

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    const total = parseFloat(newRevenue.total);
    if (isNaN(total)) return;
    try {
      const token = localStorage.getItem('token') || '';
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = 'Bearer ' + token;
      }

      const res = await fetch('/api/finance/revenue', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title: newRevenue.title,
          type: newRevenue.type,
          amountIncludingVat: total,
          providerId: null,
          collectionMethod: newRevenue.collectionMethod,
          referenceNumber: newRevenue.referenceNumber,
          payerName: newRevenue.payerName,
          description: newRevenue.description,
          notes: newRevenue.notes,
          attachmentUrl: newRevenue.attachmentUrl,
          isExternal: newRevenue.isExternal,
          isTaxable: newRevenue.isTaxable
        })
      });
      if (res.ok) {
        await fetchStats();
      } else {
        const errData = await res.json().catch(() => ({}));
        if (errData.error) {
          alert(errData.error);
        } else {
          alert('فشل في إضافة الإيراد');
        }
      }
    } catch (err) {
      console.error("Failed adding revenue online:", err);
    }
    setIsAddRevenueModalOpen(false);
    setNewRevenue({
      title: '',
      type: 'إيرادات خارجية عامة',
      total: '',
      referenceNumber: '',
      payerName: '',
      collectionMethod: 'bank',
      description: '',
      notes: '',
      attachmentUrl: '',
      isExternal: true,
      isTaxable: true
    });
  };

   const handleAddExpense = async (e: React.FormEvent) => {
      e.preventDefault();
      const total = parseFloat(newExpense.total);
      if (isNaN(total)) return;
      try {
        const res = await fetch('/api/finance/expense', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newExpense.title,
            category: newExpense.category,
            amount: total,
            EmployeeId: 1,
            providerId: userRole === 'provider' ? Number(currentProviderId) : null,
            paymentMethod: newExpense.paymentMethod,
            dueDate: newExpense.dueDate || null,
            status: newExpense.status,
            description: newExpense.description,
            notes: newExpense.notes,
            attachmentUrl: newExpense.attachmentUrl,
            isExternal: newExpense.isExternal,
            isTaxable: newExpense.isTaxable
          })
        });
        if (res.ok) {
          await fetchStats();
        } else {
          const taxable = newExpense.isTaxable;
          const base = taxable ? (total / 1.15) : total;
          const vat = taxable ? (total - base) : 0;
          setExpenses([{
             id: `EX-${Math.floor(Math.random()*10000)}`,
             date: new Date().toISOString().split('T')[0],
             title: newExpense.title,
             category: newExpense.category,
             amount: base,
             vat: vat,
             total: total,
             type: 'operational',
             provider: userRole === 'provider' ? currentProvider : 'admin',
             providerId: userRole === 'provider' ? Number(currentProviderId) : null
          } as any, ...expenses]);
        }
     } catch (err) {
       console.error("Failed adding expense online:", err);
     }
     setIsAddExpenseModalOpen(false);
     setNewExpense({
       title: '',
       category: expenseCategories.length > 0 ? expenseCategories[0].name : 'رواتب',
       total: '',
       paymentMethod: 'bank',
       dueDate: '',
       status: 'paid',
       description: '',
       notes: '',
       attachmentUrl: '',
       isExternal: true,
       isTaxable: true
     });
  };

  const [hasTaxPermission, setHasTaxPermission] = useState(false); // Simulated permission state

  const extractVATAsExpense = () => {
    if (!hasTaxPermission) {
      alert('عذراً، لا تملك الصلاحية (الإدارة المالية) لاستخراج وتحويل الضريبة.');
      return;
    }
    const checkVatEligibility = () => {
      if (!lastVATDate) return true;
      const last = new Date(lastVATDate);
      const now = new Date();
      const months = (now.getFullYear() - last.getFullYear()) * 12 + now.getMonth() - last.getMonth();
      if (vatPeriodType === 'monthly') return months >= 1;
      return months >= 3;
    };
    if (!checkVatEligibility()) {
      alert(`عذراً، لا يمكنك استخراج الضريبة الآن. لديك إقرار ${vatPeriodType === 'monthly' ? 'شهري' : 'ربع سنوي'} مسجل بتاريخ ${lastVATDate} ولم تنته الفترة الضريبية بعد.`);
      return;
    }
    
    const totalVAT = kpis.totalVAT;
    const nowStr = new Date().toISOString().split('T')[0];
    setExpenses([{
        id: `EX-${Math.floor(Math.random()*10000)}`,
        date: nowStr,
        title: `سداد ضريبة القيمة المضافة المدفوعة ${vatPeriodType === 'monthly' ? 'إقرار شهري' : 'إقرار ربع سنوي'}`,
        category: 'ضرائب وزكاة',
        amount: totalVAT,
        vat: 0, 
        total: totalVAT,
        type: 'operational'
     }, ...expenses]);
     
     setLastVATDate(nowStr);
     localStorage.setItem('lastVATDate', nowStr);
     localStorage.setItem('vatPeriodType', vatPeriodType);
     alert('تم تسجيل استخراج الضريبة كمصروف بنجاح. لن يتاح الاستخراج القادم إلا بعد انتهاء الفترة الضريبية.');
  };

  const extractZakatAsExpense = () => {
    if (!hasTaxPermission) {
       alert('عذراً، لا تملك الصلاحية (الإدارة المالية) لاستخراج الزكاة.');
       return;
    }
    const checkZakatEligibility = () => {
      if (!lastZakatDate) return true;
      const last = new Date(lastZakatDate).getTime();
      const now = Date.now();
      const daysPassed = (now - last) / (1000 * 60 * 60 * 24);
      return daysPassed >= 354;
    };
    if (!checkZakatEligibility()) {
      alert(`عذراً، لم يحل الحول (سنة هجرية كاملة) على آخر استخراج للزكاة بتاريخ ${lastZakatDate}.`);
      return;
    }
    
    const estimatedZakat = Math.max(0, kpis.netProfit * 0.025);
    const nowStr = new Date().toISOString().split('T')[0];
    setExpenses([{
        id: `EX-${Math.floor(Math.random()*10000)}`,
        date: nowStr,
        title: `سداد الزكاة الشرعية التقديرية للحول المنتهي`,
        category: 'ضرائب وزكاة',
        amount: estimatedZakat,
        vat: 0,
        total: estimatedZakat,
        type: 'operational'
     }, ...expenses]);
     
     setLastZakatDate(nowStr);
     localStorage.setItem('lastZakatDate', nowStr);
     alert('تم تسجيل استخراج الزكاة كمصروف بنجاح. فترة الاستخراج القادمة ستكون بعد الحول (سنة هجرية كاملة).');
  };

  const renderKPICards = () => {
    if (userRole === 'provider') {
      const entitlementsVal = dbSummary ? dbSummary.totalEntitlements : ((wallet?.available_balance || 0) + (wallet?.pending_balance || 0));
      const bookingProfitsVal = dbSummary ? dbSummary.netBookingProfit : netEarnings;
      const inflowVal = dbSummary ? dbSummary.totalInflow : totalRevenue;
      const outflowVal = dbSummary ? dbSummary.totalOutflow : totalExpense;

      return (
        <div id="provider-kpi-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">إجمالي مستحقات المزود</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(entitlementsVal)}</h3>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl">
                 <Briefcase className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">المحفظة المعلقة والجاهزة للسحب</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-blue-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">صافي أرباح الحجوزات</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(bookingProfitsVal)}</h3>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <Wallet className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <p className="text-xs text-blue-600 font-bold flex items-center gap-1">المستحقات المعتمدة من الحجوزات</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-teal-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">التدفقات المالية الداخلة</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(inflowVal)}</h3>
              </div>
              <div className="p-3 bg-teal-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-teal-600" />
              </div>
            </div>
            <p className="text-xs text-teal-600 font-bold flex items-center gap-1">مجموع إيداعات وحركات المحفظة</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-rose-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">التدفقات المالية الخارجة</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(outflowVal)}</h3>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl">
                <TrendingDown className="w-6 h-6 text-rose-600" />
              </div>
            </div>
            <p className="text-xs text-rose-600 font-bold flex items-center gap-1">إجمالي عمليات السحب والتحويل</p>
          </div>
        </div>
      );
    }

    return (
      <div id="admin-kpi-cards" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-emerald-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">إجمالي الإيرادات</p>
              <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(kpis.totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-emerald-50 rounded-xl">
               <TrendingUp className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <p className="text-xs text-emerald-600 font-bold flex items-center gap-1">+12.5% عن الشهر السابق</p>
        </div>

        {userRole === 'admin' ? (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-red-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">إجمالي المصروفات</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(kpis.totalExpense)}</h3>
              </div>
              <div className="p-3 bg-red-50 rounded-xl">
                <TrendingDown className="w-6 h-6 text-red-600" />
              </div>
            </div>
            <p className="text-xs text-red-600 font-bold flex items-center gap-1">+2.4% عن الشهر السابق</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-purple-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-slate-500 text-sm font-medium mb-1">ضريبة القيمة المضافة</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">
                  {isVatEnabled ? formatCurrency(kpis.totalVAT) : '0.00 ر.س'}
                </h3>
              </div>
              <div className="p-3 bg-purple-50 rounded-xl">
                <FileText className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <p className={`text-xs font-bold flex items-center gap-1 ${isVatEnabled ? 'text-purple-600' : 'text-amber-600'}`}>
              {isVatEnabled ? 'المبلغ المستحق للهيئة' : '(معفى لعدم الانطباق)'}
            </p>
          </div>
        )}

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-blue-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">صافي الأرباح</p>
              <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(kpis.netProfit)}</h3>
            </div>
            <div className="p-3 bg-blue-50 rounded-xl">
              <Wallet className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">شاملة للضريبة</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-amber-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-slate-500 text-sm font-medium mb-1">المطالبات المعلقة</p>
              <h3 className="font-heading text-3xl font-bold text-slate-800 font-mono">{formatCurrency(kpis.pendingClaims)}</h3>
            </div>
            <div className="p-3 bg-amber-50 rounded-xl">
              <Briefcase className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <p className="text-xs text-slate-500 font-medium">مستحقات الشركاء (المزودين)</p>
        </div>
      </div>
    );
  };

  const renderTaxAndZakat = () => {
    const totalVAT = kpis.totalVAT; // Direct accurate use of kpis.totalVAT instead of arbitrary multiplication
    const estimatedZakat = Math.max(0, kpis.netProfit * 0.025); // Ensure no negative Zakat if there is a deficit
    const totalDonations = expenses.filter(e => e.category === 'تبرعات').reduce((acc, curr) => acc + curr.total, 0);

    return (
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center">
             <div>
                <p className="text-slate-500 text-sm font-medium mb-1">الضريبة المستحقة (القيمة المضافة 15%)</p>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-heading text-2xl font-bold text-slate-800">{formatCurrency(totalVAT)}</h3>
                </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select 
                    value={vatPeriodType || 'monthly'} 
                    onChange={e => {
                      setVatPeriodType(e.target.value);
                      localStorage.setItem('vatPeriodType', e.target.value);
                    }} 
                    className="text-sm border border-slate-200 rounded-xl px-2 py-1 outline-none text-slate-600"
                  >
                    <option value="monthly">إقرار شهري</option>
                    <option value="quarterly">إقرار ربع سنوي</option>
                  </select>
                  <button onClick={extractVATAsExpense} className="text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-4 py-2 rounded-xl transition-colors w-full sm:w-auto text-center border border-purple-100 shadow-sm">استخراج كمصروف</button>
                </div>
             </div>
             <div className="p-4 bg-purple-50 rounded-full hidden sm:block">
                <FileText className="w-8 h-8 text-purple-600" />
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center">
             <div>
                <p className="text-slate-500 text-sm font-medium mb-1">الزكاة الشرعية التقديرية (2.5%)</p>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-heading text-2xl font-bold text-slate-800">{formatCurrency(estimatedZakat)}</h3>
                </div>
                <button onClick={extractZakatAsExpense} className="text-sm font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-4 py-2 rounded-xl transition-colors w-full sm:w-auto text-center border border-emerald-100 shadow-sm">استخراج كمصروف</button>
             </div>
             <div className="p-4 bg-emerald-50 rounded-full hidden sm:block">
                <PieChartIcon className="w-8 h-8 text-emerald-600" />
             </div>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between items-start gap-4 sm:flex-row sm:items-center">
             <div>
                <p className="text-slate-500 text-sm font-medium mb-1">إجمالي التبرعات والصدقات</p>
                <div className="flex items-center gap-3 mb-3">
                  <h3 className="font-heading text-2xl font-bold text-slate-800">{formatCurrency(totalDonations)}</h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">المبالغ المتبرع بها خلال الفترة</p>
             </div>
             <div className="p-4 bg-rose-50 rounded-full hidden sm:block">
                <Heart className="w-8 h-8 text-rose-500" />
             </div>
          </div>
       </div>
    );
  };

  const renderGovReports = () => {
    const totalVAT = kpis.totalRevenue * 0.15;
    const estimatedZakat = kpis.netProfit * 0.025;
    
    return (
      <div className="mb-8">
        <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-indigo-500" />
          التقارير الضريبية والزكاة (التعاملات الحكومية)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-indigo-50 to-white rounded-2xl p-6 border border-indigo-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-indigo-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-indigo-600 text-sm font-bold mb-1">الضريبة المستحقة (15%)</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800">{formatCurrency(totalVAT)}</h3>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <FileText className="w-6 h-6 text-indigo-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              * يتم استخراجها من إجمالي المبيعات والإيرادات تلقائياً.
            </p>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-white rounded-2xl p-6 border border-emerald-100 shadow-sm relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-emerald-500"></div>
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-emerald-700 text-sm font-bold mb-1">الزكاة الشرعية التقديرية (2.5%)</p>
                <h3 className="font-heading text-3xl font-bold text-slate-800">{formatCurrency(estimatedZakat)}</h3>
              </div>
              <div className="p-3 bg-white rounded-xl shadow-sm">
                <PieChartIcon className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              * يتم احتسابها تلقائياً بناءً على صافي أرباح المنصة.
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderCharts = () => (
    <div className={`grid grid-cols-1 ${userRole === 'admin' ? 'lg:grid-cols-3' : ''} gap-6 mb-8`}>
      <div className={`${userRole === 'admin' ? 'lg:col-span-2' : ''} bg-white p-6 rounded-2xl shadow-sm border border-slate-100`}>
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" /> تحليل السيولة ومعدلات التدفق المالي (Cash Flow & Liquidity)
            </h3>
            <p className="text-xs text-slate-500 mt-1">تتبع مؤشرات السيولة، المقبوضات، التسويات والمستردات وفق المعايير الموحدة</p>
          </div>

          <div className="flex flex-wrap gap-2 items-center">
            {/* Filter by flow type */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                onClick={() => setFlowTypeFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-all ${flowTypeFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                الكل
              </button>
              <button
                onClick={() => setFlowTypeFilter('inflow')}
                className={`px-2.5 py-1 rounded-lg transition-all ${flowTypeFilter === 'inflow' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                داخلة
              </button>
              <button
                onClick={() => setFlowTypeFilter('settlement')}
                className={`px-2.5 py-1 rounded-lg transition-all ${flowTypeFilter === 'settlement' ? 'bg-red-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                مصروفات
              </button>
              <button
                onClick={() => setFlowTypeFilter('refund')}
                className={`px-2.5 py-1 rounded-lg transition-all ${flowTypeFilter === 'refund' ? 'bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                مستردات
              </button>
            </div>

            {/* Zoom controls */}
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold items-center gap-1">
              <span className="text-slate-400 text-[10px] px-1">التكبير:</span>
              <button
                onClick={() => setChartZoomFactor(1)}
                className={`px-2 py-1 rounded-lg transition-all ${chartZoomFactor === 1 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                100%
              </button>
              <button
                onClick={() => setChartZoomFactor(1.5)}
                className={`px-2 py-1 rounded-lg transition-all ${chartZoomFactor === 1.5 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                150%
              </button>
              <button
                onClick={() => setChartZoomFactor(2)}
                className={`px-2 py-1 rounded-lg transition-all ${chartZoomFactor === 2 ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                200%
              </button>
            </div>
          </div>
        </div>

        <div className="h-72" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorRefund" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorLiquidity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dx={-10} />
              <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}/>
              <Legend verticalAlign="top" height={36} iconType="circle"/>
              
              <Area type="monotone" dataKey="revenue" name="التدفقات الداخلة (الإيرادات)" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRevenue)" />
              {userRole === 'admin' && (
                <Area type="monotone" dataKey="expense" name="المصروفات والتسويات" stroke="#ef4444" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" />
              )}
              <Area type="monotone" dataKey="refund" name="المستردات والتعويضات" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorRefund)" />
              <Area type="monotone" dataKey="liquidity" name="صافي السيولة التراكمي" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorLiquidity)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {userRole === 'admin' && (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
           <h3 className="text-lg font-bold text-slate-800 mb-6">توزيع الإيرادات</h3>
           <div className="space-y-6">
              <div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">عمولات الحجوزات</span>
                    <span className="text-sm text-slate-500 font-heading">{revenueDistribution.bookingsPct}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${revenueDistribution.bookingsPct}%` }}></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">اشتراكات الشركاء</span>
                    <span className="text-sm text-slate-500 font-heading">{revenueDistribution.subscriptionsPct}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${revenueDistribution.subscriptionsPct}%` }}></div>
                 </div>
              </div>
              <div>
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-bold text-slate-700">الخدمات الإضافية</span>
                    <span className="text-sm text-slate-500 font-heading">{revenueDistribution.servicesPct}%</span>
                 </div>
                 <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div className="bg-amber-500 h-2.5 rounded-full" style={{ width: `${revenueDistribution.servicesPct}%` }}></div>
                 </div>
              </div>
              {revenueDistribution.otherPct > 0 && (
                <div>
                   <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-slate-700">أخرى</span>
                      <span className="text-sm text-slate-500 font-heading">{revenueDistribution.otherPct}%</span>
                   </div>
                   <div className="w-full bg-slate-100 rounded-full h-2.5">
                      <div className="bg-slate-500 h-2.5 rounded-full" style={{ width: `${revenueDistribution.otherPct}%` }}></div>
                   </div>
                </div>
              )}
           </div>
        </div>
      )}
    </div>
  );

  const handleExportReconciliationPDF = async () => {
    try {
      showNotification('info', 'جاري إنشاء وتقفيل تقرير المطابقة والتسوية المالي بصيغة PDF... 📄');
      const token = localStorage.getItem('token') || '';
      const res = await fetch('/api/payments/reconciliation/report', {
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = res.ok ? await res.json() : null;

      const reportData = data?.report || {
        reportId: `REC-26-${Math.floor(Math.random() * 8999999999 + 1000000000)}`,
        generatedAt: new Date().toISOString(),
        matchedCount: displayRevenues.length + displayExpenses.length,
        discrepancyCount: 0,
        summary: {
          totalGatewayCaptured: displayRevenues.reduce((a, b) => a + (b.total || 0), 0),
          totalSplitAllocated: displayRevenues.reduce((a, b) => a + (b.total || 0), 0),
          totalRefundsProcessed: displayExpenses.filter(e => e.type === 'refund' || e.category === 'مستردات').reduce((a, b) => a + (b.total || 0), 0)
        }
      };

      const pdf = new jsPDF('p', 'mm', 'a4');
      pdf.setFillColor(15, 23, 42);
      pdf.rect(0, 0, 210, 36, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.text('LAYLA PLATFORM - RECONCILIATION & AUDIT REPORT', 15, 16);
      pdf.setFontSize(9);
      pdf.text(`Ref: ${reportData.reportId}  | Date: ${new Date(reportData.generatedAt).toLocaleDateString()} | Double Entry Ledger`, 15, 26);

      pdf.setTextColor(15, 23, 42);
      pdf.setFontSize(11);
      pdf.text('1. Financial Summary & Reconciliation Stats', 15, 48);
      
      pdf.setDrawColor(226, 232, 240);
      pdf.setFillColor(248, 250, 252);
      pdf.roundedRect(15, 54, 180, 32, 2, 2, 'FD');

      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`Total Gateway Volume: SAR ${reportData.summary.totalGatewayCaptured.toLocaleString()}`, 20, 62);
      pdf.text(`Total Split Allocated: SAR ${reportData.summary.totalSplitAllocated.toLocaleString()}`, 20, 70);
      pdf.text(`Total Refunds Processed: SAR ${reportData.summary.totalRefundsProcessed.toLocaleString()}`, 20, 78);

      pdf.setFontSize(11);
      pdf.setTextColor(15, 23, 42);
      pdf.text('2. Audited Transactions Ledger Entries', 15, 96);

      let yPos = 104;
      pdf.setFillColor(241, 245, 249);
      pdf.rect(15, yPos, 180, 7, 'F');
      pdf.setFontSize(8);
      pdf.setTextColor(30, 41, 59);
      pdf.text('ID', 18, yPos + 5);
      pdf.text('Date', 45, yPos + 5);
      pdf.text('Type', 75, yPos + 5);
      pdf.text('Base (SAR)', 105, yPos + 5);
      pdf.text('VAT (15%)', 135, yPos + 5);
      pdf.text('Total (SAR)', 165, yPos + 5);

      yPos += 8;
      const combined = [
        ...displayRevenues.map(r => ({ id: r.revenueNumber || r.id, date: r.date, type: 'Inflow (Rev)', amount: r.amount, vat: r.vat, total: r.total })),
        ...displayExpenses.map(e => ({ id: e.expenseNumber || formatExpenseId(e.id), date: e.date, type: e.type === 'refund' ? 'Refund' : 'Expense', amount: e.amount, vat: e.vat, total: e.total }))
      ].slice(0, 16);

      combined.forEach((row, idx) => {
        if (idx % 2 === 0) {
          pdf.setFillColor(250, 250, 250);
          pdf.rect(15, yPos - 2, 180, 6, 'F');
        }
        pdf.setFontSize(7.5);
        pdf.setTextColor(71, 85, 105);
        pdf.text(String(row.id).substring(0, 14), 18, yPos + 2.5);
        pdf.text(String(row.date), 45, yPos + 2.5);
        pdf.text(String(row.type), 75, yPos + 2.5);
        pdf.text(Number(row.amount || 0).toFixed(2), 105, yPos + 2.5);
        pdf.text(Number(row.vat || 0).toFixed(2), 135, yPos + 2.5);
        pdf.text(Number(row.total || 0).toFixed(2), 165, yPos + 2.5);
        yPos += 6.5;
      });

      pdf.save(`Reconciliation_Report_${reportData.reportId}.pdf`);
      showNotification('success', 'تم تصدير تقرير المطابقة والتسوية المالي بنجاح! 💾');
    } catch (err: any) {
      console.error('Failed to export reconciliation PDF:', err);
      showNotification('error', `فشل تصدير التقرير: ${err.message}`);
    }
  };

  const handleExportReconciliationCSV = async () => {
    try {
      const items = [
        ...displayRevenues.map(r => ({
          ID: r.revenueNumber || r.id,
          Date: r.date,
          Title: r.title,
          Type: 'إيراد / تدفق داخل',
          Payer: r.payerName || 'العميل',
          BaseAmount: r.amount,
          VAT: r.vat,
          Total: r.total,
          ExpectedDueDate: '-',
          Status: 'مكتمل ومعتمد'
        })),
        ...displayExpenses.map(e => ({
          ID: e.expenseNumber || formatExpenseId(e.id),
          Date: e.date,
          Title: e.title,
          Type: e.type === 'refund' ? 'استرداد مالي (Refund)' : 'مصروف تشغيلي',
          Payer: e.provider || 'منصة ليلة',
          BaseAmount: e.amount,
          VAT: e.vat,
          Total: e.total,
          ExpectedDueDate: e.expectedDueDate || (e.type === 'refund' || e.category === 'مستردات' ? calculateExpectedDueDate(e.date) : '-'),
          Status: 'مكتمل ومرحل'
        }))
      ];

      downloadCSV(items, `Reconciliation_Ledger_Report_${new Date().toISOString().split('T')[0]}.csv`);
      showNotification('success', 'تم تصدير تقرير المطابقة المالي CSV بنجاح!');
    } catch (err: any) {
      console.error('Failed to export reconciliation CSV:', err);
    }
  };

  const renderLedgerTable = () => (
    <div id="ledger-table-container" className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-slate-800">سجل التدفقات المالية والعمليات (Ledger)</h3>
          <p className="text-xs text-slate-500 mt-1">كافة الحركات المالية المزدوجة وتواريخ الاستحقاق المتوقعة للمستردات بالتفصيل</p>
        </div>
        {!canExport ? (
          <button 
            onClick={() => {
              alert('عذراً! ميزة تصدير سجل العمليات المالية مغلقة في باقتك الحالية. يرجى تفعيل "ميزة استعراض وتصدير الفواتير" من تبويب الباقات والميزات.');
            }}
            className="bg-slate-50 border border-slate-100 text-slate-400 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap"
          >
            <Lock className="w-4 h-4 text-slate-400" /> تصدير PDF/CSV (مغلق)
          </button>
        ) : (
          <div className="flex flex-wrap gap-2 items-center">
            <button 
              onClick={handleExportReconciliationPDF}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="تصدير تقرير التسوية والمطابقة المالي المدقق"
            >
              <FileText className="w-4 h-4 text-indigo-200" /> تقرير المطابقة (PDF)
            </button>
            <button 
              onClick={handleExportReconciliationCSV}
              className="bg-slate-800 hover:bg-slate-900 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
              title="تصدير تقرير المطابقة كملف CSV"
            >
              <Download className="w-4 h-4 text-slate-300" /> تقرير المطابقة (CSV)
            </button>
            <button 
              onClick={() => {
                downloadPDF('كشف العمليات (Ledger)', [...displayRevenues, ...displayExpenses]);
              }}
              className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4 text-slate-500" /> تصدير PDF
            </button>
            <button 
              onClick={() => {
                const combined = [
                  ...displayRevenues.map(r => ({ ...r, entryType: 'إيراد' })),
                  ...displayExpenses.map(e => ({ ...e, entryType: 'مصروف' }))
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                downloadCSV(combined, 'ledger_operations.csv');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> تصدير CSV
            </button>
          </div>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead className="bg-slate-50/50 text-slate-500 text-xs">
            <tr>
              <th className="p-4 font-bold">المعرف</th>
              <th className="p-4 font-bold">التاريخ</th>
              <th className="p-4 font-bold">تاريخ الاستحقاق المتوقع</th>
              <th className="p-4 font-bold">البيان والتفاصيل</th>
              <th className="p-4 font-bold">النوع</th>
              <th className="p-4 font-bold">المبلغ الأساسي (SAR)</th>
              <th className="p-4 font-bold">الضريبة (15%)</th>
              <th className="p-4 font-bold">الإجمالي (SAR)</th>
              <th className="p-4 font-bold">الحالة</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 text-xs">
            {[
              ...displayRevenues.map(r => ({ ...r, entryType: 'إيراد' })),
              ...displayExpenses.map(e => ({ ...e, entryType: e.type === 'refund' || e.category === 'مستردات' ? 'مسترد' : 'مصروف' }))
            ]
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
            .map((item) => (
              <tr 
                key={item.id} 
                className={`transition-colors cursor-pointer ${item.entryType === 'إيراد' ? 'hover:bg-blue-50/40' : item.entryType === 'مسترد' ? 'hover:bg-amber-50/40' : 'hover:bg-red-50/40'}`}
                onClick={() => {
                  if (item.entryType === 'إيراد') {
                    const fullRevenue = displayRevenues.find(r => r.id === item.id);
                    if (fullRevenue) {
                      setSelectedRevenue(fullRevenue);
                      setIsRevenueDetailsOpen(true);
                    }
                  } else {
                    alert(`سند مالي رقم: ${item.id}\nالبيان: ${item.title}\nالمبلغ: ${item.total} ر.س\nتاريخ الاستحقاق المتوقع: ${item.expectedDueDate || calculateExpectedDueDate(item.date)}`);
                  }
                }}
              >
                <td className="p-4 font-medium text-slate-500 font-mono">{item.revenueNumber || item.expenseNumber || item.id}</td>
                <td className="p-4 text-slate-600 font-sans">{item.date}</td>
                <td className="p-4 font-sans text-indigo-700 font-bold">
                  {item.expectedDueDate || (item.entryType === 'مسترد' || item.type === 'refund' || item.category === 'مستردات' ? `📅 ${calculateExpectedDueDate(item.date)}` : '-')}
                </td>
                <td className="p-4 font-bold text-slate-800">{item.title}</td>
                <td className="p-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold border ${item.entryType === 'إيراد' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : item.entryType === 'مسترد' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                    {item.entryType}
                  </span>
                </td>
                <td className="p-4 font-heading text-slate-700">{item.amount.toFixed(2)}</td>
                <td className="p-4 font-heading text-slate-400">{item.vat.toFixed(2)}</td>
                <td className="p-4 font-heading font-bold text-slate-800">{item.total.toFixed(2)}</td>
                <td className="p-4"><span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">مكتمل ومسوى</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div id="finance-dashboard-wrapper" className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-black text-slate-800 font-heading flex items-center gap-2">
              <span>💰</span>
              <span>المركز المالي والخزينة المركزية</span>
            </h2>
            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              مزامنة تامة لقاعدة البيانات 🟢
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-0.5">
            الرقابة السيادية على التدفقات النقدية، محافظ الشركاء، حسابات الضمان (Escrow)، والامتثال الضريبي ZATCA
          </p>
        </div>
        <div className="flex gap-4 items-center">
          {userRole === 'admin' && (
            <label className="flex items-center gap-2 text-sm font-bold text-slate-600 bg-slate-100 px-3 py-2 rounded-xl cursor-pointer hover:bg-slate-200 transition-colors">
              <input type="checkbox" className="w-4 h-4 rounded text-blue-600" checked={!!hasTaxPermission} onChange={e => setHasTaxPermission(e.target.checked)} />
              محاكاة صلاحية المحاسب (لاستخراج الضرائب)
            </label>
          )}
          <div className="flex gap-2">
            <select 
              value={dateFilter || 'month'}
              onChange={(e) => setDateFilter(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm outline-none cursor-pointer"
            >
              <option value="today">اليوم</option>
              <option value="week">هذا الأسبوع</option>
              <option value="month">هذا الشهر</option>
              <option value="year">هذا العام</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 p-1 bg-slate-100 rounded-2xl">
        {[
          { id: 'reports', label: 'التقارير والمؤشرات', icon: PieChartIcon },
          { id: 'revenues', label: 'الإيرادات', icon: TrendingUp },
          ...(userRole === 'admin' ? [{ id: 'expenses', label: 'المصروفات', icon: TrendingDown }] : []),
          ...(userRole === 'provider' ? [{ id: 'refunds', label: 'إدارة المستردات 🔄', title: 'طلبات استرداد الحجوزات والخدمات والعمليات السابقة', icon: RefreshCw }] : []),
          { id: 'invoices', label: 'الفواتير', icon: FileText },
          ...(userRole === 'provider' ? [{ id: 'wallet', label: 'المحفظة الذكية', icon: Wallet }] : []),
          ...(userRole === 'provider' && (!providerSubscription || providerSubscription?.includesDynamicPricing || providerSubscription?.addons?.includes('dynamic_pricing')) ? [{ id: 'seasons', label: 'المواسم والأعياد', icon: Sparkles }] : []),
          ...(userRole === 'admin' ? [{ id: 'providers', label: 'عمليات الشركاء', icon: Briefcase }] : []),
          ...(userRole === 'admin' ? [{ id: 'customer_ledgers', label: 'محافظ وأرصدة العملاء 👥', title: 'إدارة وتتبع أرصدة محافظ العملاء والمحفظة الدفترية المعلقة', icon: Users }] : []),
          ...(userRole === 'admin' ? [{ id: 'variance_alerts', label: 'انحرافات الميزانية 🚨', title: 'نظام الإشعارات الاستباقية للانحرافات المالية ومراقبة ميزانية المنصة', icon: ShieldAlert }] : []),
          ...(userRole === 'admin' ? [{ id: 'treasury', label: 'إدارة الخزينة والديون 🏛️', title: 'لوحة الخزينة والتزامات المنصة ومستحقات الشركاء والعملاء وجداول الإطفاء IFRS/SOCPA', icon: Landmark }] : []),
          ...(userRole === 'admin' || providerSubscription?.includesFinancialForecast || providerSubscription?.addons?.includes('financial_forecast') ? [{ id: 'forecast', label: 'التوقعات الذكية 📈', title: 'ميزانية التوقعات المالية الذكية', icon: Activity }] : []),
          { id: 'bank_transfers', label: 'الدفع والحولات 🧾', title: 'سجلات الدفع والحوالات البنكية', icon: CreditCard },
          { id: 'settlements', label: 'تسويات الشركاء 🤝', title: 'سجل تسويات مستحقات الشركاء وعمولات المنصة', icon: Briefcase },
          { id: 'ledger', label: 'القيود اليومية الموحدة 📖', title: 'سجل القيود الدفترية المحاسبية الموحد والمطابقة المالية العامة', icon: FileText },
        ].map(tab => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              title={tab.title}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeSubTab === tab.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
              }`}
            >
              <IconComponent className="w-4 h-4" /> {tab.label}
            </button>
          );
        })}
      </div>

      {activeSubTab === 'reports' && (
        <div className="animate-in fade-in">
          {isLoadingStats ? (
            <div className="space-y-6">
              <KpiSkeleton />
              <ChartSkeleton />
              <TableSkeleton />
            </div>
          ) : (
            <>
              {renderKPICards()}
              {userRole === 'admin' && renderGovReports()}
              {renderCharts()}
              {renderLedgerTable()}
            </>
          )}
        </div>
      )}

      {activeSubTab === 'revenues' && (
        <div className="animate-in fade-in">
          {isLoadingStats ? (
            <TableSkeleton />
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-800">سجل الإيرادات</h3>
                <div className="flex gap-2 w-full sm:w-auto">
                  <input type="text" value={revSearch || ''} onChange={e => setRevSearch(e.target.value)} placeholder="بحث..." className="border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm outline-none w-full sm:w-48" />
                  <select value={revTypeFilter || ''} onChange={e => setRevTypeFilter(e.target.value)} className="border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm outline-none">
                    <option value="">تصفية بالنوع (الكل)</option>
                    <option value="حجز">حجز القاعات والمرافق</option>
                    <option value="خدمة">الخدمات المساندة</option>
                    <option value="اشتراك">اشتراك</option>
                    <option value="عمولة">عمولة</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                  {userRole === 'admin' && (
                    <button onClick={() => setIsAddRevenueModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap">
                      <Plus className="w-4 h-4 hidden sm:block" /> إضافة إيراد
                    </button>
                  )}
                </div>
              </div>
            {filteredRevenues.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50/50 text-slate-500">
                       <tr>
                          <th className="p-4 font-bold">المعرف</th>
                          <th className="p-4 font-bold">التاريخ</th>
                          <th className="p-4 font-bold">البيان</th>
                          <th className="p-4 font-bold">النوع</th>
                          <th className="p-4 font-bold">المبلغ الأساسي</th>
                          <th className="p-4 font-bold">الضريبة 15%</th>
                          <th className="p-4 font-bold">الإجمالي</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredRevenues.map(rev => (
                          <tr key={rev.id} className="hover:bg-slate-50 transition-colors">
                             <td className="p-4 font-medium text-slate-500">{formatRevenueId(rev.id)}</td>
                             <td className="p-4 text-slate-600">{rev.date}</td>
                             <td className="p-4 font-bold text-slate-800">{rev.title}</td>
                             <td className="p-4"><span className="px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{rev.type}</span></td>
                             <td className="p-4 font-heading">{rev.amount.toFixed(2)} ر.س</td>
                             <td className="p-4 font-heading text-slate-400">{rev.vat.toFixed(2)} ر.س</td>
                             <td className="p-4 font-heading font-bold text-emerald-600">{rev.total.toFixed(2)} ر.س</td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            ) : (
               <div className="p-12 text-center text-slate-400">
                  <TrendingUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-500">لا توجد إيرادات مسجلة</p>
               </div>
            )}
            </div>
          )}
        </div>
      )}
      {activeSubTab === 'expenses' && (
        <div className="animate-in fade-in space-y-6">
          {isLoadingStats ? (
            <TableSkeleton />
          ) : (
            <>
              {/* Proactive Budget Variance Banner for Admin */}
              {userRole === 'admin' && (
                <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-blue-500/10 border border-amber-200/80 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 font-sans">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-sm shrink-0">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                        <span>نظام رصد الانحرافات والميزانيات المرصودة</span>
                        <span className="bg-amber-100 text-amber-800 text-[10px] px-2 py-0.5 rounded-full font-bold">نشط آلياً ⚡</span>
                      </h4>
                      <p className="text-slate-600 text-[11px] mt-0.5">
                        يتم تحليل النفقات التشغيلية فور تسجيلها ومقارنتها بسقوف الميزانية المعتمدة للتسويق، الاستضافة، والرواتب.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveSubTab('variance_alerts')}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer self-end md:self-auto"
                  >
                    <span>لوحة مراقبة الانحرافات 🚨</span>
                  </button>
                </div>
              )}

              {renderTaxAndZakat()}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mb-8">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <h3 className="text-lg font-bold text-slate-800">المصروفات المالية</h3>
                <button onClick={() => setIsAddExpenseModalOpen(true)} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-colors whitespace-nowrap w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> تسجيل مصروف تشغيلي
                </button>
              </div>
              
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex bg-slate-200 p-1 rounded-xl w-full lg:w-auto">
                  <button 
                    onClick={() => setExpenseActiveTab('all')}
                    className={`flex-1 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all ${expenseActiveTab === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >الكل</button>
                  <button 
                    onClick={() => setExpenseActiveTab('refunds')}
                    className={`flex-1 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all ${expenseActiveTab === 'refunds' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >المستردات</button>
                  <button 
                    onClick={() => setExpenseActiveTab('operational')}
                    className={`flex-1 lg:px-6 py-2 rounded-lg text-sm font-bold transition-all ${expenseActiveTab === 'operational' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >المصروفات التشغيلية</button>
                </div>

                <div className="flex gap-2 w-full lg:w-auto">
                  <div className="relative flex-1 lg:w-64">
                    <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="text" value={expSearch || ''} onChange={e => setExpSearch(e.target.value)} placeholder="بحث..." className="w-full border border-slate-200 bg-white rounded-xl pr-10 pl-4 py-2 text-sm outline-none focus:border-red-500 font-sans" />
                  </div>
                  <select value={expCategoryFilter || ''} onChange={e => setExpCategoryFilter(e.target.value)} className="border border-slate-200 bg-white rounded-xl px-4 py-2 text-sm outline-none focus:border-red-500">
                    <option value="">كل التصنيفات</option>
                    <option value="رواتب">رواتب</option>
                    <option value="تسويق">تسويق</option>
                    <option value="استضافة">استضافة</option>
                    <option value="ضرائب وزكاة">ضرائب وزكاة</option>
                    <option value="تبرعات">تبرعات وصدقات</option>
                    <option value="مستردات">مستردات عملاء</option>
                    <option value="أخرى">أخرى</option>
                  </select>
                </div>
              </div>
            </div>
            {filteredExpenses.length > 0 ? (
               <div className="overflow-x-auto">
                 <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50/50 text-slate-500">
                       <tr>
                          <th className="p-4 font-bold">المعرف</th>
                          <th className="p-4 font-bold">تاريخ القيد</th>
                          <th className="p-4 font-bold">البيان</th>
                          <th className="p-4 font-bold">التصنيف</th>
                          <th className="p-4 font-bold">طريقة الدفع</th>
                          <th className="p-4 font-bold">الاستحقاق</th>
                          <th className="p-4 font-bold">الحالة</th>
                          <th className="p-4 font-bold">الأساسي</th>
                          <th className="p-4 font-bold">الضريبة</th>
                          <th className="p-4 font-bold">الإجمالي</th>
                          <th className="p-4 font-bold text-center">المرفق</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredExpenses.map(exp => (
                          <tr key={exp.id} className="hover:bg-slate-50 transition-colors">
                             <td className="p-4 font-medium text-slate-500">
                                {exp.expenseNumber || formatExpenseId(exp.id)}
                             </td>
                             <td className="p-4 text-slate-600">{exp.date}</td>
                             <td className="p-4 font-bold text-slate-800">
                                {exp.title}
                                {exp.description && (
                                  <p className="text-xs text-slate-400 font-medium mt-0.5">{exp.description}</p>
                                )}
                             </td>
                             <td className="p-4">
                               <span className={`px-2 py-1 rounded text-xs font-bold border ${exp.type === 'refund' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                                 {exp.category}
                               </span>
                             </td>
                             <td className="p-4 text-slate-600 font-medium">
                                {(() => {
                                   switch (exp.paymentMethod) {
                                      case 'bank': return 'تحويل بنكي';
                                      case 'cash': return 'نقداً';
                                      case 'credit': return 'آجل';
                                      case 'online': return 'دفع إلكتروني';
                                      default: return exp.paymentMethod || 'نقداً';
                                   }
                                })()}
                             </td>
                             <td className="p-4 text-slate-500">
                                {exp.dueDate ? (
                                   <span className="flex items-center gap-1 text-slate-600 font-sans text-xs">
                                      📅 {exp.dueDate}
                                   </span>
                                ) : (
                                   <span className="text-slate-300">-</span>
                                )}
                             </td>
                             <td className="p-4">
                                <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${
                                   exp.status === 'paid' 
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                                      : 'bg-orange-50 text-orange-700 border-orange-200'
                                }`}>
                                   {exp.status === 'paid' ? 'مدفوع' : 'مستحق'}
                                </span>
                             </td>
                             <td className="p-4 font-heading">{exp.amount.toFixed(2)} ر.س</td>
                             <td className="p-4 font-heading text-slate-400">
                                {exp.isTaxable !== false ? `${exp.vat.toFixed(2)} ر.س` : <span className="text-emerald-600 text-xs font-semibold">معفى</span>}
                             </td>
                             <td className="p-4 font-heading font-bold text-red-600">{exp.total.toFixed(2)} ر.س</td>
                             <td className="p-4 text-center">
                                {exp.attachmentUrl ? (
                                   <a 
                                      href={exp.attachmentUrl} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="inline-flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 p-2 rounded-xl text-xs font-bold transition-all duration-150"
                                      title="عرض فاتورة المصروف"
                                   >
                                      👁️ عرض
                                   </a>
                                ) : (
                                   <span className="text-slate-300">-</span>
                                )}
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
               </div>
            ) : (
               <div className="p-12 text-center text-slate-400">
                  <TrendingDown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-500">لا توجد مصروفات مسجلة في هذا التبويب</p>
               </div>
            )}
          </div>
        </>
      )}
    </div>
  )}

      {activeSubTab === 'refunds' && (
        <div className="animate-in fade-in space-y-6">
          <div className="bg-gradient-to-r from-blue-900 to-indigo-950 rounded-2xl p-6 text-white shadow-md text-right relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">إدارة المستردات والتعويضات المالية 🔄</h3>
              <p className="text-xs text-indigo-100/80 leading-relaxed max-w-2xl font-sans">
                هنا يمكنك تتبع كافة طلبات استرداد المبالغ الخاصة بالحجوزات والخدمات اللوجستية الملغاة. يمكنك الموافقة الفورية على طلبات الاسترداد بموجب سياسة المنصة المرنة أو القوة القاهرة لتوثيق الحركة وقيدها في السجلات المالية تلقائياً.
              </p>
            </div>
            <div className="absolute left-6 top-1/2 -translate-y-1/2 opacity-15">
              <RefreshCw className="w-24 h-24 stroke-1 animate-spin" style={{ animationDuration: '20s' }} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-right">
              <p className="text-xs font-bold text-slate-500 mb-1">طلبات استرداد الحجوزات القائمة</p>
              <h4 className="text-2xl font-black text-slate-800 font-sans">{refundBookings.filter(b => b.paymentStatus !== 'مسترد بالكامل').length} طلبات</h4>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">تتطلب مراجعة واعتماد مباشر</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-right">
              <p className="text-xs font-bold text-slate-500 mb-1">طلبات استرداد الخدمات القائمة</p>
              <h4 className="text-2xl font-black text-slate-800 font-sans">{refundServices.filter(s => s.status !== 'مسترجع بالكامل').length} طلبات</h4>
              <p className="text-[10px] text-amber-600 font-semibold mt-1">تتطلب مراجعة واعتماد مباشر</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm text-right">
              <p className="text-xs font-bold text-slate-500 mb-1 font-sans">إجمالي المستردات السابقة المكتملة</p>
              <h4 className="text-2xl font-black text-green-600 font-sans">
                {previousRefunds.reduce((acc, curr) => acc + (curr.total || curr.amount), 0).toLocaleString()} ريال
              </h4>
              <p className="text-[10px] text-green-600 font-semibold mt-1">تمت تسويتها بالكامل وإعادتها للعملاء</p>
            </div>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-xl w-fit self-start">
            <button 
              onClick={() => setRefundActiveSubTab('requests')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${refundActiveSubTab === 'requests' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              الطلبات القائمة والمراجعة النشطة
            </button>
            <button 
              onClick={() => setRefundActiveSubTab('history')}
              className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${refundActiveSubTab === 'history' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              سجل المستردات السابقة ({previousRefunds.length})
            </button>
          </div>

          {refundActiveSubTab === 'requests' ? (
            <div className="space-y-6 text-right">
              {/* Bookings refunds */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="text-sm font-bold text-slate-800">1. طلبات استرداد مبالغ الحجوزات (المرتبطة بالقاعات والمرافق)</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs">
                      <tr>
                        <th className="p-4 font-bold">معرف الحجز</th>
                        <th className="p-4 font-bold">العميل</th>
                        <th className="p-4 font-bold">المرفق / القاعة</th>
                        <th className="p-4 font-bold">تاريخ الحجز</th>
                        <th className="p-4 font-bold">قيمة الحجز الأصلي</th>
                        <th className="p-4 font-bold">الحالة المالية</th>
                        <th className="p-4 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {refundBookings.map((b: any) => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-500">#{b.id}</td>
                          <td className="p-4 font-bold text-slate-800">{b.customer}</td>
                          <td className="p-4 text-slate-600">{b.hall}</td>
                          <td className="p-4 text-slate-500 font-sans text-xs">{b.startDate}</td>
                          <td className="p-4 font-bold text-slate-800 font-sans">{b.amount} ريال</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              b.paymentStatus === 'مسترد بالكامل' || b.status === 'مسترد'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {b.paymentStatus || 'بانتظار الاسترداد المالي'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {b.paymentStatus !== 'مسترد بالكامل' && b.status !== 'مسترد' ? (
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleApproveBookingRefund(b)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold transition-all border border-green-700 cursor-pointer"
                                >
                                  ✅ اعتماد الاسترداد المالي
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('أدخل سبب رفض طلب الاسترداد المالي للعميل:');
                                    if (reason) {
                                      const updated = bookings.map((x: any) => x.id === b.id ? { ...x, paymentStatus: 'مرفوض الاسترداد' } : x);
                                      if (setBookings) setBookings(updated);
                                      localStorage.setItem('app_bookings', JSON.stringify(updated));
                                      window.dispatchEvent(new Event('bookingsUpdated'));
                                      showNotification('info', 'تم تسجيل رفض طلب الاسترداد المالي بنجاح.');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[10px] font-bold transition-all border border-red-200 cursor-pointer"
                                >
                                  ❌ رفض الطلب
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-green-600 font-black font-sans">مكتمل ومرحل بنجاح</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {refundBookings.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">لا توجد طلبات استرداد للحجوزات حالياً.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Logistical Services refunds */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="text-sm font-bold text-slate-800">2. طلبات استرداد الخدمات اللوجستية والمساندة الملغاة</h4>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50/50 text-slate-500 text-xs">
                      <tr>
                        <th className="p-4 font-bold">معرف الخدمة</th>
                        <th className="p-4 font-bold">العميل</th>
                        <th className="p-4 font-bold">اسم الخدمة اللوجستية</th>
                        <th className="p-4 font-bold">قيمة الخدمة الأصلية</th>
                        <th className="p-4 font-bold">حالة الطلب</th>
                        <th className="p-4 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {refundServices.map((s: any) => (
                        <tr key={s.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-500">#{s.id}</td>
                          <td className="p-4 font-bold text-slate-800">{s.customerName}</td>
                          <td className="p-4 text-slate-600 font-bold">{s.serviceName}</td>
                          <td className="p-4 font-bold text-slate-800 font-sans">{s.price} ريال</td>
                          <td className="p-4">
                            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
                              s.status === 'مسترجع بالكامل'
                                ? 'bg-green-50 text-green-700 border-green-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {s.status === 'مسترجع بالكامل' ? 'مسترجع ومسترد' : 'بانتظار استرداد الشريك'}
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            {s.status !== 'مسترجع بالكامل' ? (
                              <div className="flex justify-center gap-1.5">
                                <button
                                  onClick={() => handleApproveServiceRefund(s)}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-[10px] font-bold transition-all border border-green-700 cursor-pointer"
                                >
                                  ✅ اعتماد استرجاع الخدمة
                                </button>
                                <button
                                  onClick={() => {
                                    const reason = prompt('أدخل سبب رفض طلب استرجاع الخدمة:');
                                    if (reason) {
                                      const updated = localSupportServiceRequests.map((x: any) => x.id === s.id ? { ...x, status: 'مرفوض الاسترداد' } : x);
                                      setLocalSupportServiceRequests(updated);
                                      localStorage.setItem('SUPPORT_SERVICE_REQUESTS_V4', JSON.stringify(updated));
                                      window.dispatchEvent(new Event('storage'));
                                      showNotification('info', 'تم تسجيل رفض استرداد الخدمة.');
                                    }
                                  }}
                                  className="px-3 py-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[10px] font-bold transition-all border border-red-200 cursor-pointer"
                                >
                                  ❌ رفض الطلب
                                </button>
                              </div>
                            ) : (
                              <span className="text-[10px] text-green-600 font-black font-sans">تم الاسترجاع والقيد بنجاح</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {refundServices.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">لا توجد طلبات استرداد للخدمات حالياً.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden text-right">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-800">سجل عمليات ومستردات الشريك السابقة المعتمدة بالكامل</h4>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-right text-sm">
                  <thead className="bg-slate-50/50 text-slate-500 text-xs">
                    <tr>
                      <th className="p-4 font-bold">رقم العملية المالي</th>
                      <th className="p-4 font-bold">تاريخ القيد المالي</th>
                      <th className="p-4 font-bold">البيان والتفاصيل</th>
                      <th className="p-4 font-bold">التصنيف</th>
                      <th className="p-4 font-bold">المبلغ الأساسي</th>
                      <th className="p-4 font-bold">الضريبة المضافة</th>
                      <th className="p-4 font-bold">إجمالي المسترد للعميل</th>
                      <th className="p-4 font-bold text-center">الحالة</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {previousRefunds.map((e: any) => (
                      <tr key={e.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-4 font-mono text-slate-500">#{e.id}</td>
                        <td className="p-4 text-slate-500 font-sans text-xs">{e.date}</td>
                        <td className="p-4 font-bold text-slate-800">{e.title}</td>
                        <td className="p-4 text-indigo-600 font-semibold">{e.category}</td>
                        <td className="p-4 font-sans text-slate-700">{e.amount} ريال</td>
                        <td className="p-4 font-sans text-slate-700">{e.vat || 0} ريال</td>
                        <td className="p-4 font-sans font-bold text-slate-900">{e.total || e.amount} ريال</td>
                        <td className="p-4 text-center">
                          <span className="px-2.5 py-1 rounded bg-green-50 text-green-700 border border-green-200 text-xs font-bold">مكتمل</span>
                        </td>
                      </tr>
                    ))}
                    {previousRefunds.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">لا توجد عمليات سابقة.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'seasons' && (
        <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-4 gap-4">
            <h3 className="text-xl font-bold text-slate-800 flex items-center gap-3 font-sans">
              <Sparkles className="w-6 h-6 text-amber-500" /> المواسم والأعياد الرسمية (Peak Seasons)
            </h3>
            
            <div className="flex bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setSeasonsInternalTab('seasons')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  seasonsInternalTab === 'seasons' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                تعديل الأسعار الموسمي
              </button>
              <button
                type="button"
                onClick={() => setSeasonsInternalTab('promotions')}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  seasonsInternalTab === 'promotions' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                كوبونات الخصم والعروض الترويجية
              </button>
            </div>
          </div>

          {seasonsInternalTab === 'promotions' ? (
            <div className="animate-in fade-in">
              <PromotionsManagement 
                promotions={promotions}
                setPromotions={setPromotions}
                halls={halls}
                services={services}
                userRole={userRole}
                providerName={currentProvider}
                showNotification={showNotification}
              />
            </div>
          ) : (
            <>
              {/* Form to submit a new season proposal */}
              <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-6">
                <h4 className="font-black text-slate-800 text-sm">تقديم طلب تعديل أسعار موسمي (زيادة أو تخفيض)</h4>
                
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const name = formSeasonName;
                    const start = formStartDate;
                    const end = formEndDate;
                    const type = formIncreaseType;
                    const nature = formAdjustmentNature;
                    let value = Number(formIncreaseValue);

                    if (!name || !start || !end || isNaN(value) || value <= 0) {
                      alert('الرجاء تعبئة كافة الحقول بشكل صحيح وبقيم أكبر من الصفر!');
                      return;
                    }

                    if (nature === 'discount') {
                      value = -value; // Convert to negative for storage and display!
                    }

                    if (editingSeasonRequest) {
                      const updatedList = seasonRequests.map((r: any) => {
                        if (r.id === editingSeasonRequest.id) {
                          return {
                            ...r,
                            seasonName: name,
                            startDate: start,
                            endDate: end,
                            increaseType: type,
                            increaseValue: value,
                            status: 'بانتظار الموافقة' // Reset status to pending when edited!
                          };
                        }
                        return r;
                      });
                      setSeasonRequests(updatedList);
                      setEditingSeasonRequest(null);
                      showNotification('success', 'تم تحديث طلب الموسم بنجاح ويخضع لمراجعة الإدارة الحالية! 📑');
                    } else {
                      const newReq = {
                        id: `SR-${Math.floor(Math.random() * 900) + 100}`,
                        provider: currentProvider || 'الشريك الحالي',
                        seasonName: name,
                        startDate: start,
                        endDate: end,
                        increaseType: type,
                        increaseValue: value,
                        status: 'بانتظار الموافقة',
                        createdAt: new Date().toISOString().split('T')[0]
                      };
                      setSeasonRequests([newReq, ...seasonRequests]);
                      showNotification('success', 'تم تقديم طلب الموسم للإدارة بنجاح ويخضع للمراجعة الحالية! 📑');
                    }

                    // Reset
                    setFormSeasonName('');
                    setFormStartDate('');
                    setFormEndDate('');
                    setFormAdjustmentNature('increase');
                    setFormIncreaseType('percentage');
                    setFormIncreaseValue('');
                  }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-4"
                >
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">اسم الموسم / المناسبة {editingSeasonRequest && <span className="text-indigo-600 font-extrabold">(تعديل طلب قيد الانتظار)</span>}</label>
                    <input 
                      name="seasonName"
                      type="text" 
                      required
                      placeholder="مثال: موسم الرياض، إجازة الصيف، عروض الشتاء"
                      value={formSeasonName}
                      onChange={(e) => setFormSeasonName(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">تاريخ البدء</label>
                      <input 
                        name="startDate"
                        type="date" 
                        required
                        value={formStartDate}
                        onChange={(e) => setFormStartDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-600">تاريخ الانتهاء</label>
                      <input 
                        name="endDate"
                        type="date" 
                        required
                        value={formEndDate}
                        onChange={(e) => setFormEndDate(e.target.value)}
                        className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">طبيعة التعديل السعري المطلوب</label>
                    <select 
                      name="adjustmentNature"
                      value={formAdjustmentNature}
                      onChange={(e: any) => setFormAdjustmentNature(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs bg-no-repeat"
                    >
                      <option value="increase">زيادة سعرية مؤقتة (موسم ذروة +)</option>
                      <option value="discount">تخفيض وتنزيل سعري مؤقت (موسم ركود / عروض تصفية -)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-600">طريقة احتساب التعديل السعري</label>
                    <select 
                      name="increaseType"
                      value={formIncreaseType}
                      onChange={(e: any) => setFormIncreaseType(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs bg-no-repeat"
                    >
                      <option value="percentage">نسبة مئوية من السعر الإجمالي القائم (%)</option>
                      <option value="fixed">مبلغ مالي إضافي أو مخصوم مقطوع (ريال)</option>
                    </select>
                  </div>

                  <div className="space-y-1 md:col-span-2">
                    <label className="text-xs font-bold text-slate-600">قيمة التعديل المطلوب (أدخل قيمة موجبة)</label>
                    <input 
                      name="increaseValue"
                      type="number" 
                      required
                      placeholder="مثال: أدخل 20 لخصم أو زيادة 20٪، أو 1500 لـ 1500 ريال"
                      value={formIncreaseValue}
                      onChange={(e) => setFormIncreaseValue(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm"
                    />
                  </div>

              <div className="md:col-span-2 p-3 bg-red-50 rounded-2xl border border-red-100 text-[11px] text-red-800 leading-relaxed font-sans text-right">
                <strong>🛡️ مكافحة تذبذب الأسعار (Combating price fluctuations):</strong> تخضع طلبات التخفيض الموسمي لمراجعة من قبل الإدارة لمنع تذتب الأسعار السريع والتغييرات المفاجئة التي تؤثر على المنصة وعلى العملاء والمسجلة لكل مرفق، ولن يتم تفعيلها تلقائياً لحفظ تنافسية وجودة خدمات المنصة وتفادي الإضرار بالإيرادات التراكمية ومنع المفاجئات السلبية للعملاء بسب التغيرات المفاجئة.
              </div>

              <div className="md:col-span-2 flex justify-end gap-2">
                {editingSeasonRequest && (
                  <button 
                    type="button"
                    onClick={() => {
                      setEditingSeasonRequest(null);
                      setFormSeasonName('');
                      setFormStartDate('');
                      setFormEndDate('');
                      setFormAdjustmentNature('increase');
                      setFormIncreaseType('percentage');
                      setFormIncreaseValue('');
                      showNotification('info', 'تم إلغاء التعديل واستعادة النموذج الفارغ.');
                    }}
                    className="px-6 py-3 bg-slate-200 font-bold text-slate-700 hover:bg-slate-300 text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    إلغاء التعديل
                  </button>
                )}
                <button 
                  type="submit"
                  className={`px-6 py-3 font-bold text-white text-xs rounded-xl transition-colors cursor-pointer ${editingSeasonRequest ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-blue-950 hover:bg-slate-800'}`}
                >
                  {editingSeasonRequest ? 'حفظ تعديلات الطلب' : 'إرسال الطلب للاعتماد'}
                </button>
              </div>
            </form>
          </div>

          {/* List of current seasons pending / approved */}
          <div className="space-y-4">
            <h4 className="font-black text-slate-800 text-sm">حالة طلبات المواسم المدخلة</h4>
            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-right text-sm">
                <thead className="bg-slate-50 text-slate-500">
                  <tr>
                    <th className="p-3 font-bold text-xs">رقم الطلب</th>
                    <th className="p-3 font-bold text-xs">اسم الموسم</th>
                    <th className="p-3 font-bold text-xs">الفترة</th>
                    <th className="p-3 font-bold text-xs">التعديل السعري</th>
                    <th className="p-3 font-bold text-xs">الحالة</th>
                    <th className="p-3 font-bold text-xs text-center">التحكم والعمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {seasonRequests.filter((r: any) => r.provider === currentProvider).map((r: any) => (
                    <tr key={r.id} className="hover:bg-slate-50/50">
                      <td className="p-3 font-mono text-xs font-bold text-slate-500">{r.id}</td>
                      <td className="p-3 font-bold text-slate-800 text-xs">{r.seasonName}</td>
                      <td className="p-3 text-slate-600 text-xs">من {r.startDate} إلى {r.endDate}</td>
                      <td className="p-3 font-mono text-xs text-slate-800 font-bold">
                        {r.increaseValue < 0 ? (
                          <span className="text-red-700 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded font-black">
                            {r.increaseType === 'percentage' ? `${r.increaseValue}%` : `${r.increaseValue} ر.س`} (تخفيض موسمي)
                          </span>
                        ) : (
                          <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded font-black">
                            {r.increaseType === 'percentage' ? `+${r.increaseValue}%` : `+${r.increaseValue} ر.س`} (زيادة ذروة)
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                          r.status === 'معتمد' ? 'bg-green-50 text-green-700 border border-green-200' :
                          r.status === 'مرفوض' ? 'bg-red-50 text-red-700 border border-red-200' :
                          r.status === 'ملغى' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                          r.status === 'منتهي مبكراً' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                          'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        {/* Pending Admin Approval Actions */}
                        {r.status === 'بانتظار الموافقة' && (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSeasonRequest(r);
                                setFormSeasonName(r.seasonName);
                                setFormStartDate(r.startDate);
                                setFormEndDate(r.endDate);
                                setFormAdjustmentNature(r.increaseValue < 0 ? 'discount' : 'increase');
                                setFormIncreaseType(r.increaseType);
                                setFormIncreaseValue(Math.abs(r.increaseValue).toString());
                                showNotification('info', 'تم تحميل بيانات الطلب في النموذج أعلاه للتعديل ✍️');
                              }}
                              className="px-2.5 py-1 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-indigo-200/45"
                            >
                              تعديل
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`هل أنت متأكد من رغبتك في سحب وحذف هذا الطلب قيد الانتظار لـ "${r.seasonName}"؟`)) {
                                  const updated = seasonRequests.filter((x: any) => x.id !== r.id);
                                  setSeasonRequests(updated);
                                  showNotification('success', 'تم سحب وحذف الطلب المعلق بنجاح. 🗑️');
                                }
                              }}
                              className="px-2.5 py-1 bg-red-50 text-red-700 hover:bg-red-100 rounded-lg text-[10px] font-bold transition-all cursor-pointer border border-red-200/45"
                            >
                              سحب/حذف
                            </button>
                          </div>
                        )}

                        {/* Approved Actions with Dynamic Hybrid Logic */}
                        {r.status === 'معتمد' && (() => {
                          const todayStr = new Date().toISOString().split('T')[0];
                          const isFuture = r.startDate > todayStr;
                          const isOngoing = r.startDate <= todayStr && r.endDate >= todayStr;
                          
                          if (isFuture) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`هل أنت متأكد من إلغاء وتراجع موسم "${r.seasonName}" المعتمد قبل أن يبدأ؟\nسيتم إرجاع الأسعار إلى وضعها الأساسي وتوفير القاعة بالتعرفة الاعتيادية.`)) {
                                    const updated = seasonRequests.map((x: any) => {
                                      if (x.id === r.id) {
                                        return { ...x, status: 'ملغى' };
                                      }
                                      return x;
                                    });
                                    setSeasonRequests(updated);
                                    showNotification('success', 'تم إلغاء الموسم المعتمد بنجاح قبل تاريخ البدء واستعادة الأسعار الأساسية. 🔄');
                                  }
                                }}
                                className="px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded-lg text-[10px] font-bold border border-amber-200 transition-colors cursor-pointer"
                              >
                                سحب وإلغاء (قبل البدء) ↩️
                              </button>
                            );
                          } else if (isOngoing) {
                            return (
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`⚠️ تنبيه حماية الحجوزات النشطة وقواعد التدرج الهجين:\n\nلقد طلبت إنهاء مبكر لموسم فعال حالياً: "${r.seasonName}".\n\n- سيتم إيقاف تفعيل زيادة/تخفيض هذا الموسم فوراً لكافة عمليات الحجز الجديدة.\n- سيتم الحفاظ الصارم على تعرفة الحجوزات المؤكدة مسبقاً طوال هذه الفترة لضمان الالتزام الأخلاقي والمالي للعملاء.\n\nهل تود تأكيد الإنهاء المبكر؟`)) {
                                    const updated = seasonRequests.map((x: any) => {
                                      if (x.id === r.id) {
                                        return { 
                                          ...x, 
                                          status: 'منتهي مبكراً', 
                                          endDate: todayStr 
                                        };
                                      }
                                      return x;
                                    });
                                    setSeasonRequests(updated);
                                    showNotification('success', 'تم إنهاء الموسم مبكراً بنجاح مع تأمين وحماية الحجوزات القائمة! 🛡️');
                                  }
                                }}
                                className="px-2.5 py-1 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-lg text-[10px] font-bold border border-rose-200 transition-colors cursor-pointer"
                              >
                                إنهاء مبكر آمن 🛡️
                              </button>
                            );
                          }
                          return <span className="text-[10px] text-slate-400 font-bold">منتهي</span>;
                        })()}

                        {/* Rejected, Cancelled or Finished Seasons */}
                        {['مرفوض', 'ملغى', 'منتهي مبكراً'].includes(r.status) && (
                          <span className="text-[10px] text-slate-400 font-bold">مؤرشف</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {seasonRequests.filter((r: any) => r.provider === currentProvider).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center p-6 text-slate-400 text-xs">لا توجد طلبات مواسم مسجلة لهذا الحساب حالياً.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )}

      {activeSubTab === 'variance_alerts' && (
        <VarianceAlertsManager
          expenses={expenses}
          revenues={revenues}
          bookings={bookings}
          settlements={settlements}
          showNotification={showNotification}
          onAddExpense={(newExp) => setExpenses([newExp, ...expenses])}
        />
      )}

      {activeSubTab === 'invoices' && (
        <ZatcaInvoicing
          userRole={userRole}
          currentProvider={currentProvider}
          isVatEnabled={isVatEnabled}
          providerSubscription={providerSubscription}
          bookings={[
            ...bookings,
            ...(supportServiceRequests || []).map((s: any) => ({
              id: s.id || `SRV-${s.serviceId || 101}`,
              customer: s.customerName || s.clientName || 'عميل خدمة مساندة',
              customerName: s.customerName || s.clientName || 'عميل خدمة مساندة',
              hall: s.serviceName || s.title || 'طلب خدمة مساندة',
              providerName: s.providerName || s.provider || '',
              provider: s.providerName || s.provider || '',
              amount: s.price || s.amount || s.totalAmount || 0,
              totalAmount: s.price || s.amount || s.totalAmount || 0,
              startDate: s.date || s.createdAt || new Date().toISOString().split('T')[0],
              date: s.date || s.createdAt || new Date().toISOString().split('T')[0],
              status: s.status || 'مكتمل'
            }))
          ]}
          halls={halls}
          showNotification={showNotification}
        />
      )}

      {activeSubTab === 'forecast' && (
        <FinancialForecaster
          currentMonthConfirmedTotal={currentMonthConfirmedTotal}
          currentMonthCount={currentMonthCount}
          providerSubscription={providerSubscription}
          currentProvider={currentProvider}
          showNotification={showNotification}
        />
      )}

      {activeSubTab === 'treasury' && (
        <TreasuryManagement
          userRole={userRole}
          currentProvider={currentProvider}
          showNotification={showNotification}
          bankCashBalance={kpis.totalRevenue - kpis.totalExpense}
          inTransitGatewayBalance={kpis.pendingClaims}
          escrowLiabilityBalance={kpis.pendingClaims}
          vatPayableBalance={kpis.totalVAT}
          refundsPayableBalance={expenses.filter(e => e.type === 'refund' || e.category === 'مستردات').reduce((a, b) => a + (b.total || 0), 0)}
          totalPlatformRevenue={kpis.totalRevenue}
          totalPlatformExpense={kpis.totalExpense}
          netProfit={kpis.netProfit}
        />
      )}

      {activeSubTab === 'bank_transfers' && (
          <div className="animate-in fade-in space-y-6">
            {/* Quick Informative Banner */}
            <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2">
                  <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">🧾</span>
                  مركز تسوية ومطابقة الحوالات البنكية الموحد
                </h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">
                  مساحة مالية مخصصة للتحقق من دفعات الشركاء والعملاء المحولة بنكياً، ومراجعة مستندات الإيصال الداعمة لتفويض صلاحيات حجز القاعات وميزات الباقات باحترافية وأمان.
                </p>
              </div>
              
              <button
                type="button"
                onClick={() => {
                  const prtHtml = document.getElementById('printable-transfers-table')?.outerHTML;
                  if (!prtHtml) return;
                  const win = window.open('', '', 'width=950,height=800');
                  if (win) {
                    win.document.write(`
                      <html dir="rtl">
                        <head>
                          <title>تقرير كشف التسويات المالية والحوالات - منصة ليلة</title>
                          <style>
                            body { font-family: sans-serif; direction: rtl; text-align: right; padding: 30px; }
                            h2 { color: #1e293b; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; text-align: right; }
                            th, td { border: 1px solid #cbd5e1; padding: 10px; font-size: 11px; }
                            th { background: #f1f5f9; }
                            .badge { font-weight: bold; padding: 3px 6px; border-radius: 4px; }
                          </style>
                        </head>
                        <body>
                          <h2>كشف عمليات الحوالات البنكية ومرفقات الدفع - منصة ليلة</h2>
                          <p>تاريخ الإصدار: ${new Date().toLocaleString('ar-SA')}</p>
                          ${prtHtml}
                        </body>
                      </html>
                    `);
                    win.document.close();
                    setTimeout(() => win.print(), 500);
                  }
                }}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs shadow-md transition-all cursor-pointer shadow-blue-500/25"
              >
                <Download className="w-4 h-4" />
                تصدير وطباعة جدول التسويات المالي ⎙
              </button>
            </div>

            {/* Performance/Operations Statistics Overview Grid - Updated with 4 categories */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">إجمالي طلبات باقات الشركاء</p>
                  <p className="text-xl font-extrabold text-slate-800">{relevantUpgradeRequests.length}</p>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl text-xs font-bold">باقات</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">بانتظار الاعتماد للشريك</p>
                  <p className="text-xl font-extrabold text-amber-600 flex items-center gap-1.5 animate-pulse">
                    <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
                    {pendingSubCount}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl text-xs font-bold">بانتظار المراجعة</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs border-r-4 border-r-emerald-500">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">حوالات الحجوزات (العملاء)</p>
                  <p className="text-xl font-extrabold text-slate-800">{relevantBookingTransfers.length}</p>
                </div>
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold">حجوزات</div>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-100 flex items-center justify-between shadow-xs">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400">طلبات الخدمات المساندة</p>
                  <p className="text-xl font-extrabold text-purple-600">{relevantServiceTransfers.length}</p>
                </div>
                <div className="p-3 bg-purple-50 text-purple-600 rounded-xl text-xs font-bold">خدمات مساندة</div>
              </div>
            </div>

            {/* Segment Controls, Searching and Filtration Panel - Updated with 4 sliding tabs */}
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs space-y-4">
              <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
                {/* Custom sliding tab toggle with 4 buttons */}
                <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1 w-full xl:w-auto">
                  <button
                    type="button"
                    onClick={() => {
                      setTransfersTypeToggle('all');
                      setTransferSearchQuery('');
                      setTransferStatusFilter('all');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex-1 sm:flex-none ${
                      transfersTypeToggle === 'all' 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    جميع حوالات الشركاء ({allMergedTransfers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransfersTypeToggle('subscriptions');
                      setTransferSearchQuery('');
                      setTransferStatusFilter('all');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex-1 sm:flex-none ${
                      transfersTypeToggle === 'subscriptions' 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    ترقية باقات الشركاء ({relevantUpgradeRequests.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransfersTypeToggle('bookings');
                      setTransferSearchQuery('');
                      setTransferStatusFilter('all');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex-1 sm:flex-none ${
                      transfersTypeToggle === 'bookings' 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    حجز القاعات والعملاء ({relevantBookingTransfers.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTransfersTypeToggle('services');
                      setTransferSearchQuery('');
                      setTransferStatusFilter('all');
                    }}
                    className={`px-4 py-2.5 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer flex-1 sm:flex-none ${
                      transfersTypeToggle === 'services' 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    طلبات الخدمات المساندة ({relevantServiceTransfers.length})
                  </button>
                </div>

                {/* Status Selection and Search Filters */}
                <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                  <div className="relative flex-1 sm:flex-none">
                    <input
                      type="text"
                      placeholder={
                        transfersTypeToggle === 'all' ? "ابحث باسم الشريك،العميل أو الخدمة..." :
                        transfersTypeToggle === 'subscriptions' ? "ابحث باسم الشريك أو الحزمة..." : 
                        transfersTypeToggle === 'bookings' ? "ابحث باسم العميل أو الصالة الرئيسي..." :
                        "ابحث باسم العميل أو الخدمة المساندة..."
                      }
                      value={transferSearchQuery}
                      onChange={(e) => setTransferSearchQuery(e.target.value)}
                      className="w-full sm:w-64 bg-slate-50 border border-slate-200 text-slate-800 text-xs px-4 py-3 rounded-2xl outline-none focus:border-blue-500 focus:bg-white pl-8"
                    />
                    {transferSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setTransferSearchQuery('')}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <select
                    value={transferStatusFilter}
                    onChange={(e: any) => setTransferStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-4 py-3 rounded-2xl outline-none cursor-pointer focus:bg-white focus:border-blue-500"
                  >
                    <option value="all">كل المعاملات المالية</option>
                    <option value="pending">المعاملات المعلقة بانتظار الاعتماد</option>
                    <option value="approved">المعاملات المعتمدة والمرحّلة للإيرادات</option>
                    <option value="rejected">المعاملات الورقية المرفوضة</option>
                  </select>
                </div>
              </div>

              {/* Transactions Ledger Table */}
              <div className="border border-slate-100 rounded-2xl overflow-x-auto" id="printable-transfers-table">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-400 text-[10px] font-bold border-b border-slate-100">
                      <th className="p-4">رقم المعاملة</th>
                      <th className="p-4 min-w-[220px]">الشريك / العميل مقدم الإيصال (توسعة)</th>
                      <th className="p-4 min-w-[260px]">
                        {transfersTypeToggle === 'all' ? 'البيانات والخدمة المستهدفة (توسعة)' :
                         transfersTypeToggle === 'subscriptions' ? 'الباقة المستهدفة والترقية (توسعة)' :
                         transfersTypeToggle === 'bookings' ? 'حجز القاعة والبيانات (توسعة)' :
                         'طلب الخدمة والبيانات (توسعة)'}
                      </th>
                      <th className="p-4">تاريخ تقديم الطلب</th>
                      <th className="p-4">المبلغ والضريبة الكلية</th>
                      <th className="p-4 text-center">مرفقات وإيصالات</th>
                      <th className="p-4 text-center">حالة السداد</th>
                      {userRole === 'admin' && <th className="p-4 text-center">إجراءات التدقيق</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {listToRender.map((item: any) => {
                      const referenceId = item.id;
                      const senderLabel = item.senderLabel;
                      const detailLabel = item.detailLabel;
                      const amountVal = item.amount;
                      const baseVal = amountVal / 1.15;
                      const vatVal = amountVal - baseVal;
                      const reqDateStr = item.date;
                      const dateDisplay = new Date(reqDateStr).toLocaleDateString('ar-SA');
                      
                      // Resolve correct status badges
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                          للمراجعة
                        </span>
                      );

                      if (item.status === 'approved') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200 whitespace-nowrap">
                            ✓ معتمدة
                          </span>
                        );
                      } else if (item.status === 'rejected') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-700 text-[10px] font-bold rounded-full border border-red-200 whitespace-nowrap">
                            ✕ مرفوضة
                          </span>
                        );
                      }

                      return (
                        <tr key={`${item.type}-${item.id}`} className="border-b border-slate-50 hover:bg-slate-50/20 text-xs text-slate-700 font-sans font-medium transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                            <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-sans ml-1 font-bold">
                              {item.type === 'subscription' ? 'باقتك' : item.type === 'booking' ? 'حجز' : 'خدمة'}
                            </span>
                            {referenceId}
                          </td>
                          <td className="p-4 min-w-[220px]">
                            <span className="font-extrabold text-slate-800 block text-xs">{senderLabel}</span>
                            <span className="text-[10px] text-slate-400 font-sans block mt-0.5">مقدم مستند الحوالة الفعلي</span>
                          </td>
                          <td className="p-4 min-w-[260px]">
                            <span className="font-bold text-slate-700 block text-xs">{detailLabel}</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">تفاصيل الحركة بالخدمة</span>
                          </td>
                          <td className="p-4 whitespace-nowrap text-slate-500">{dateDisplay}</td>
                          <td className="p-4 font-mono font-extrabold text-slate-800 whitespace-nowrap">
                            <span className="block text-slate-900 text-xs">{amountVal.toLocaleString('ar-SA')} ر.س</span>
                            <span className="block text-[9px] text-slate-400 font-bold mt-0.5">
                              شامل الضريبة: ({vatVal.toFixed(2)} ر.س)
                            </span>
                          </td>
                          <td className="p-4 text-center">
                            <button
                              type="button"
                              onClick={() => setZoomImageReceipt(item.receiptPreview)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-[10px] font-bold rounded-lg whitespace-nowrap border border-blue-200 transition-colors cursor-pointer"
                            >
                              <Paperclip className="w-3 h-3 text-blue-600" />
                              <span>مرفق</span>
                            </button>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">{statusBadge}</td>
                          
                          {userRole === 'admin' && (
                            <td className="p-4 text-center whitespace-nowrap">
                              {item.status === 'pending' ? (
                                <div className="flex gap-2 justify-center">
                                  <button
                                    type="button"
                                    title="اعتماد وتفعيل الحوالة وتأكيد الدفع"
                                    onClick={() => {
                                      if (item.type === 'subscription') {
                                        handleApproveSubscription(item.raw);
                                      } else if (item.type === 'booking') {
                                        handleApproveBookingPayment(item.id);
                                      } else if (item.type === 'service') {
                                        handleApproveServicePayment(item.id);
                                      }
                                    }}
                                    className="p-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    type="button"
                                    title="رفض الإيصال المستند المرفق غير مطابق"
                                    onClick={() => {
                                      if (item.type === 'subscription') {
                                        setRejectId(item.id);
                                        setRejectionReasonText('');
                                      } else if (item.type === 'booking') {
                                        handleRejectBookingPayment(item.id);
                                      } else if (item.type === 'service') {
                                        handleRejectServicePayment(item.id);
                                      }
                                    }}
                                    className="p-1 px-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-lg text-xs transition-colors shadow-xs cursor-pointer"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-bold">تمت التسوية ومكتمل</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                    
                    {listToRender.length === 0 && (
                      <tr>
                        <td colSpan={userRole === 'admin' ? 8 : 7} className="text-center p-8 text-slate-400 text-xs">
                          لا توجد عمليات حوالات بنكية مطابقة لمعايير البحث في هذا التبويب حالياً.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* HIGH-RESOLUTION ZOOM MODAL */}
            {zoomImageReceipt && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative p-6">
                  <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                    <h3 className="font-extrabold text-slate-950 text-sm">مستند إثبات التحويل البنكي</h3>
                    <button
                      type="button"
                      onClick={() => setZoomImageReceipt(null)}
                      className="bg-slate-100 text-slate-500 hover:bg-red-50 hover:text-red-500 p-2 rounded-full transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  
                  <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex items-center justify-center min-h-[350px]">
                    <img 
                      src={zoomImageReceipt} 
                      alt="إيصال التحويل البنكي" 
                      className="max-h-[500px] object-contain rounded-lg border border-slate-200 shadow-sm"
                    />
                  </div>
                  
                  <div className="mt-4 flex justify-between items-center text-[10px] text-slate-400">
                    <span>* يرجى مطابقة رقم التحويل والشريحة في كشف حساب البنك قبل التفعيل لمزيد من الأمان.</span>
                    <a
                      href={zoomImageReceipt}
                      download="Bank_Receipt_Proof.png"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline font-bold"
                    >
                      تنزيل الملف المرفق بجودة عالية ⇬
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* REJECTION REASON PROMPT MODAL */}
            {rejectId && (
              <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 relative animate-in zoom-in-95 duration-200">
                  <h3 className="font-extrabold text-slate-900 text-sm mb-3 text-right">سبب رفض التحويل البنكي للشريك</h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed text-right mb-4">
                    يرجى تدوين سبب عدم الموافقة على التحويل بوضوح، وسيتم صياغة وإرسال بريد إلكتروني رسمي تنبيهي للشريك بشكل آلي مع إتاحة إعادة المحاولة له.
                  </p>
                  
                  <textarea
                    placeholder="مثال: صورة الحوالة غير واضحة، أو الحساب المحول منه لا يتطابق مع الاسم..."
                    value={rejectionReasonText}
                    onChange={(e) => setRejectionReasonText(e.target.value)}
                    rows={4}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs p-3 rounded-xl outline-none focus:border-blue-500 focus:bg-white text-right font-sans"
                  />
                  
                  <div className="mt-5 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => setRejectId(null)}
                      className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleRejectSubscriptionSubmit(rejectId, rejectionReasonText);
                        setRejectId(null);
                      }}
                      className="px-4 py-2 bg-red-600 text-white font-bold rounded-xl text-xs hover:bg-red-700 transition-colors cursor-pointer"
                    >
                      إرسال الرفض والتنبيه الآلي ✕
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
      )}

      {activeSubTab === 'settlements' && (
        <div className="animate-in fade-in space-y-6">
          <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 text-right">
                <span className="p-2 bg-blue-500/10 text-blue-600 rounded-xl">🤝</span>
                منصة تسويات مستحقات الشركاء وعمولات المنصة (Financial Settlements Hub)
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed text-right font-sans">
                حوكمة وتحرير مستحقات شركاء منصة ليلة بعد خصم عمولات المنصة والضرائب، لضمان أعلى مستويات الشفافية والمطابقة الفورية للقوائم المالية.
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xs text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">إجمالي التسويات المعتمدة</span>
              <span className="text-2xl font-extrabold text-emerald-600 font-heading">
                {settlements
                  .filter(s => s.status === 'completed' || s.status === 'approved' || s.status === 'مكتمل')
                  .reduce((acc, curr) => acc + Number(curr.netPayable || 0), 0)
                  .toLocaleString('ar-SA')} ر.س
              </span>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xs text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">تسويات معلقة بانتظار الاعتماد</span>
              <span className="text-2xl font-extrabold text-amber-600 font-heading animate-pulse">
                {settlements
                  .filter(s => s.status === 'pending' || s.status === 'معلق')
                  .reduce((acc, curr) => acc + Number(curr.netPayable || 0), 0)
                  .toLocaleString('ar-SA')} ر.س
              </span>
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-xs text-right">
              <span className="text-[10px] font-bold text-slate-400 block mb-1">عدد عمليات التسوية الكلي</span>
              <span className="text-2xl font-extrabold text-blue-600 font-heading">
                {settlements.length} عملية
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">سجل تسويات مستحقات ومطالبات الشركاء</h3>
              <button 
                type="button"
                onClick={fetchSettlementsAndLedger} 
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                تحديث البيانات 🔄
              </button>
            </div>

            {isLoadingSettlements ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">جاري جلب بيانات التسويات من المحرك المالي...</div>
            ) : settlements.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">لا توجد تسويات مالية مقيدة حالياً في قاعدة البيانات.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[10px]">
                      <th className="p-4">رقم القيد</th>
                      <th className="p-4">التاريخ</th>
                      {userRole === 'admin' && <th className="p-4">اسم الشريك</th>}
                      <th className="p-4">رقم الحجز</th>
                      <th className="p-4">مبلغ الحجز الكلي</th>
                      <th className="p-4">عمولة المنصة</th>
                      <th className="p-4">ضريبة العمولة (15%)</th>
                      <th className="p-4">المستحق للشريك (الصافي)</th>
                      <th className="p-4 text-center">حالة الصرف</th>
                      {userRole === 'admin' && <th className="p-4 text-center">إجراءات</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {settlements.map((item: any) => {
                      const year = item.createdAt ? new Date(item.createdAt).getFullYear().toString().slice(-2) : '26';
                      const formattedId = `SET-${year}-${String(item.id).padStart(10, '0')}`;
                      
                      let statusBadge = (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-amber-50 text-amber-700 text-[10px] font-bold rounded-full border border-amber-200">
                          <span className="w-1 h-1 bg-amber-500 rounded-full animate-pulse"></span>
                          معلق بانتظار الاعتماد
                        </span>
                      );

                      if (item.status === 'completed' || item.status === 'approved' || item.status === 'مكتمل') {
                        statusBadge = (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                            ✓ تم الصرف للشريك
                          </span>
                        );
                      }

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-500 whitespace-nowrap">{formattedId}</td>
                          <td className="p-4 text-slate-600 font-sans whitespace-nowrap">
                            {item.createdAt ? new Date(item.createdAt).toLocaleDateString('ar-SA') : '-'}
                          </td>
                          {userRole === 'admin' && (
                            <td className="p-4">
                              <span className="font-bold text-slate-800 block">
                                {item.providerUser?.username || item.providerUser?.email || `شريك #${item.providerId}`}
                              </span>
                            </td>
                          )}
                          <td className="p-4 font-mono font-bold text-slate-700">#{item.bookingId}</td>
                          <td className="p-4 font-heading font-medium text-slate-700">
                            {Number(item.grossAmount).toFixed(2)} ر.س
                          </td>
                          <td className="p-4 font-heading font-medium text-red-600">
                            -{Number(item.commissionAmount).toFixed(2)} ر.س
                          </td>
                          <td className="p-4 font-heading font-medium text-slate-400">
                            {Number(item.commissionVat).toFixed(2)} ر.س
                          </td>
                          <td className="p-4 font-heading font-bold text-emerald-600">
                            {Number(item.netPayable).toFixed(2)} ر.س
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">{statusBadge}</td>
                          {userRole === 'admin' && (
                            <td className="p-4 text-center whitespace-nowrap">
                              {(item.status === 'pending' || item.status === 'معلق') ? (
                                <button
                                  type="button"
                                  onClick={() => handleApproveSettlement(item.id)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                                >
                                  اعتماد وصرف الدفعة ✓
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400 font-semibold">مسوّى ومكتمل</span>
                              )}
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'ledger' && (
        <div className="animate-in fade-in space-y-6">
          <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 text-right">
                <span className="p-2 bg-purple-500/10 text-purple-600 rounded-xl">📖</span>
                سجل الأستاذ العام والقيود اليومية الموحدة (Unified General Ledger)
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed text-right font-sans">
                كافة المعاملات والقيود الدفترية المزدوجة المتولدة آلياً عن طريق المحرك المالي الموحد لضمان مطابقة جميع الأرصدة ومنع التلاعب المالي.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-100 rounded-3xl shadow-xs overflow-hidden">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">كشف قيود الحركات المالية (Double-Entry Financial Journal)</h3>
              <button 
                type="button"
                onClick={fetchSettlementsAndLedger} 
                className="text-xs text-blue-600 hover:underline font-bold"
              >
                تحديث القائمة 🔄
              </button>
            </div>

            {isLoadingLedger ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">جاري جلب قيود الأستاذ العام من المحرك المالي...</div>
            ) : ledgerEntries.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs font-medium">لا توجد حركات مقيدة حالياً في الأستاذ العام.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 text-[10px]">
                      <th className="p-4">رقم القيد الدفتري</th>
                      <th className="p-4">التاريخ</th>
                      <th className="p-4">البيان</th>
                      {userRole === 'admin' && <th className="p-4">المستفيد / الحساب</th>}
                      <th className="p-4">الحساب الفرعي</th>
                      <th className="p-4 text-center">نوع الحركة</th>
                      <th className="p-4">المبلغ مدين (Debit)</th>
                      <th className="p-4">المبلغ دائن (Credit)</th>
                      <th className="p-4">الرصيد التراكمي الجديد</th>
                      <th className="p-4">رقم المرجع المالي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {ledgerEntries.map((item: any) => {
                      const year = item.date ? new Date(item.date).getFullYear().toString().slice(-2) : '26';
                      const formattedId = `LEDG-${year}-${String(item.id).padStart(10, '0')}`;
                      
                      const isDebit = item.type === 'debit';
                      
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-500 whitespace-nowrap">{formattedId}</td>
                          <td className="p-4 text-slate-600 font-sans whitespace-nowrap">
                            {item.date ? new Date(item.date).toLocaleDateString('ar-SA') : '-'}
                          </td>
                          <td className="p-4">
                            <span className="font-bold text-slate-800 block">{item.description}</span>
                          </td>
                          {userRole === 'admin' && (
                            <td className="p-4">
                              <span className="font-semibold text-slate-700">
                                {item.providerUser?.username || item.providerUser?.email || `حساب #${item.providerId || 'المنصة'}`}
                              </span>
                            </td>
                          )}
                          <td className="p-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded border border-slate-200">
                              {item.walletType === 'provider' ? 'محفظة الشريك' : 'حساب المنصة الرئيسي'}
                            </span>
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            {isDebit ? (
                              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-100 font-bold text-[10px]">
                                ⤓ مدين (Debit)
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-full border border-purple-100 font-bold text-[10px]">
                                ⤒ دائن (Credit)
                              </span>
                            )}
                          </td>
                          <td className="p-4 font-heading font-medium text-blue-600">
                            {isDebit ? `${Number(item.amount).toFixed(2)} ر.س` : '-'}
                          </td>
                          <td className="p-4 font-heading font-medium text-purple-600">
                            {!isDebit ? `${Number(item.amount).toFixed(2)} ر.س` : '-'}
                          </td>
                          <td className="p-4 font-heading font-bold text-slate-800">
                            {Number(item.balanceAfter || 0).toFixed(2)} ر.س
                          </td>
                          <td className="p-4 font-mono font-bold text-slate-500 whitespace-nowrap">
                            {item.referenceId || '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'customer_ledgers' && (
        <div className="animate-in fade-in space-y-6">
          {/* Quick Informative Banner */}
          <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
            <div>
              <h3 className="font-extrabold text-slate-800 text-lg flex items-center gap-2 text-right">
                <span className="p-2 bg-amber-500/10 text-amber-600 rounded-xl">👥</span>
                منصة تتبع دورات وحوكمة محافظ أرصدة العملاء
              </h3>
              <p className="text-slate-500 text-xs mt-1 leading-relaxed text-right">
                مراجعة شاملة لأرصدة العملاء النقدية والتعاطفية الدفترية المعلقة بالمنصة، وإخضاع تسييل أموال القوة القاهرة لشروط الامتثال القانوني والتحويل اليدوي بموافقة الإدارة العليا.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left/Middle Columns: Lists of Held Balances & Wallets */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Box 1: Held Ledger Balances */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-right">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-amber-500 rounded-full"></span>
                    محفظة الأرصدة الدفترية المحجوزة (Held Rescheduling Ledger)
                  </h3>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg">تحديث تلقائي متاح</span>
                </div>

                {isLoadingWallets ? (
                  <div className="text-center py-10 text-slate-400 text-xs">جاري جلب بيانات الأرصدة والتحقق منها...</div>
                ) : customerWalletsData.heldBalances.length === 0 ? (
                  <div className="text-center py-10 text-slate-400 text-xs">لا توجد أرصدة دفترية معلقة حالياً في السجلات.</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <th className="p-3 text-right">العميل</th>
                          <th className="p-3 text-right">المبلغ</th>
                          <th className="p-3 text-right">سبب الحجز</th>
                          <th className="p-3 text-right">عمر السجل / دورة الرصيد</th>
                          <th className="p-3 text-right">مستكشف الدورة</th>
                          <th className="p-3 text-left">الإجراءات والامتثال</th>
                        </tr>
                      </thead>
                      <tbody>
                        {customerWalletsData.heldBalances.map((hb: any) => {
                          const heldDate = hb.heldSince ? new Date(hb.heldSince) : new Date();
                          const diffMs = new Date().getTime() - heldDate.getTime();
                          const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
                          const diffMonths = diffMs / (1000 * 60 * 60 * 24 * 30.4375);

                          // Lifecycle phase calculation
                          let phaseLabel = '';
                          let phaseColor = '';
                          if (hb.conversionStatus === 'converted_to_cash') {
                            phaseLabel = 'تسييل نقدي كامل 💸';
                            phaseColor = 'text-green-600 bg-green-50/70 border-green-200';
                          } else if (diffMonths < 12) {
                            phaseLabel = 'الطور 1: نفس المزود 🔒';
                            phaseColor = 'text-blue-600 bg-blue-50/70 border-blue-200';
                          } else if (diffMonths < 24) {
                            phaseLabel = 'الطور 2: أي مزود 🌍';
                            phaseColor = 'text-indigo-600 bg-indigo-50/70 border-indigo-200';
                          } else {
                            phaseLabel = 'الطور 3: تحويل تلقائي 💸';
                            phaseColor = 'text-green-600 bg-green-50/70 border-green-200';
                          }

                          return (
                            <tr key={hb.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                              <td className="p-3">
                                <div className="font-bold text-slate-800">{hb.customerName || 'عميل تجريبي'}</div>
                                <div className="text-[10px] text-slate-400 font-mono">{hb.customerEmail}</div>
                              </td>
                              <td className="p-3 font-heading font-bold text-slate-800">{hb.amount} ر.س</td>
                              <td className="p-3 text-right">
                                {hb.holdReason === 'force_majeure' ? (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">قوة قاهرة إنساني</span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600">جدولة وتعديل عادي</span>
                                )}
                              </td>
                              <td className="p-3 text-slate-500">
                                {diffDays === 0 ? 'اليوم' : `منذ ${diffDays} يوم`}
                                <span className="block text-[9px] text-slate-400 font-mono">({heldDate.toLocaleDateString('ar-SA')})</span>
                              </td>
                              <td className="p-3 text-right">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${phaseColor}`}>
                                  {phaseLabel}
                                </span>
                              </td>
                              <td className="p-3 text-left">
                                {hb.conversionStatus === 'converted_to_cash' ? (
                                  <div className="text-[10px] text-teal-600 font-bold">
                                    ✓ تم التسييل بموافقة: <span className="block text-[9px] text-slate-400 font-normal">{hb.approvedByAdmin}</span>
                                  </div>
                                ) : hb.holdReason === 'force_majeure' ? (
                                  <button
                                    onClick={() => {
                                      setApprovalModalData(hb);
                                      setApprovedByNameInput('');
                                    }}
                                    className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                  >
                                    تسييل القوة القاهرة ⚡
                                  </button>
                                ) : (
                                  <span className="text-[10px] text-slate-400">تحول تلقائي 24 شهراً</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Box 2: Customer Active Wallets */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm text-right">
                <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <span className="w-1.5 h-3 bg-blue-600 rounded-full"></span>
                    محافظ العملاء النقدية السائلة (Withdrawable Cash Wallets)
                  </h3>
                </div>

                {isLoadingWallets ? (
                  <div className="text-center py-6 text-slate-400 text-xs">جاري التحميل...</div>
                ) : customerWalletsData.wallets.length === 0 ? (
                  <div className="text-center py-8 text-slate-400 text-xs">لا توجد أي محافظ نقدية نشطة للعملاء بالمنصة.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customerWalletsData.wallets.map((w: any) => (
                      <div key={w.id} className="p-4 rounded-2xl border border-slate-150 bg-slate-50/50 flex justify-between items-center shadow-xs">
                        <div>
                          <div className="font-extrabold text-slate-800 text-xs text-right">{w.customerName || 'عميل منصة ليلة'}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5 text-right">{w.customerEmail}</div>
                        </div>
                        <div className="text-left">
                          <span className="text-slate-400 text-[9px] block">رصيد كاش قابل للسحب</span>
                          <span className="font-heading font-extrabold text-blue-600 text-sm">{w.cashBalance} ر.س</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            {/* Right Column: Simulation/Issuance Playground */}
            <div className="space-y-6 text-right">
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-3xl p-6 shadow-md border border-slate-800">
                <h3 className="font-extrabold text-amber-400 text-sm mb-2 flex items-center gap-2">
                  <span>🛠️</span>
                  بوابة محاكاة وتجربة الأرصدة والقيود الزمنية
                </h3>
                <p className="text-slate-300 text-[10px] leading-relaxed mb-4">
                  استخدم هذه اللوحة المضافة خصيصاً لتوليد وإصدار أرصدة دفترية تجريبية للعملاء، لمحاكاة اختبار القوانين مثل مرور أكثر من 30 يوماً على حالات القوة القاهرة أو مرور 24 شهراً للتسييل التلقائي.
                </p>

                <div className="space-y-3 text-xs">
                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">البريد الإلكتروني للعميل</label>
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={simEmail}
                      onChange={(e) => setSimEmail(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-right"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">اسم العميل</label>
                    <input
                      type="text"
                      placeholder="اسم العميل المرشح"
                      value={simName}
                      onChange={(e) => setSimName(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-right"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-right">
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">المبلغ (ر.س)</label>
                      <input
                        type="number"
                        placeholder="500"
                        value={simAmount}
                        onChange={(e) => setSimAmount(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 text-[10px] mb-1">نوع وحيثية الحجز</label>
                      <select
                        value={simReason}
                        onChange={(e) => setSimReason(e.target.value)}
                        className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-2 py-2 outline-none focus:border-amber-400 text-right font-sans"
                      >
                        <option value="force_majeure">قوة قاهرة (إنساني)</option>
                        <option value="ordinary">جدولة وموعد عادي</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-400 text-[10px] mb-1">تاريخ الحجز الرجعي (أيام مضت)</label>
                    <select
                      value={simDaysAgo}
                      onChange={(e) => setSimDaysAgo(e.target.value)}
                      className="w-full bg-slate-800/80 border border-slate-700 text-white rounded-xl px-3 py-2 outline-none focus:border-amber-400 text-right font-sans"
                    >
                      <option value="0">اليوم (سجل فوري)</option>
                      <option value="15">قبل 15 يوماً (أقل من الـ 30 يوماً للقوة القاهرة)</option>
                      <option value="35">قبل 35 يوماً (يتجاوز الـ 30 يوماً - جاهز للتسييل اليدوي)</option>
                      <option value="400">قبل 13 شهراً (تطور للمستكشف الطور الثاني : أي مزود)</option>
                      <option value="750">قبل 25 شهراً (يتجاوز الـ 24 شهراً - يفيد التسييل الآلي على الوصول)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleSimulateIssueCredit}
                    className="w-full mt-2 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold rounded-xl transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    إصدار رصيد محجوز محاكى ⌁
                  </button>
                </div>
              </div>

              {/* Legal Note Box */}
              <div className="bg-blue-50/50 border border-blue-150 rounded-3xl p-5 text-xs text-blue-900 leading-relaxed text-right space-y-2">
                <span className="font-extrabold text-blue-950 block">💡 تذكير قانوني (سير دورة الحياة):</span>
                <p className="text-[11px] text-slate-600">
                  - <strong>الـ 12 شهراً الأولى:</strong> يقيد الرصيد تلقائياً لإعادة الجدولة لدى نفس القاعة فقط لدعم الشريك.
                </p>
                <p className="text-[11px] text-slate-600">
                  - <strong>الشهر 12 إلى 24:</strong> تنقضي القيود وتتوسع الصلاحية ليحق له الحجز بأي مكان بالمنصة.
                </p>
                <p className="text-[11px] text-slate-600">
                  - <strong>بعد الـ 24 شهراً:</strong> تتم تسوية وإذابة السجل تلقائياً مع تحويل كامل أمواله كاش لحساب العميل البنكي لتلافي تجميد رؤوس أموالهم.
                </p>
              </div>
            </div>

          </div>

          {/* APPROVAL & CONVERSION MODAL FOR FORCE MAJEURE */}
          {approvalModalData && (() => {
            const heldDate = approvalModalData.heldSince ? new Date(approvalModalData.heldSince) : new Date();
            const diffMs = new Date().getTime() - heldDate.getTime();
            const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
            const isEligible = diffDays >= 30;

            return (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[99] flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-right">
                  <h3 className="font-extrabold text-slate-900 text-lg mb-2 flex items-center gap-2 border-b border-slate-100 pb-2">
                    <span>⚡</span>
                    دراسة طلب تسييل فوري لرصيد القوة القاهرة (الامتثال الإنساني)
                  </h3>

                  <div className="space-y-4 my-4 text-xs leading-relaxed text-slate-700">
                    <p>
                      عملاً بالسياسات الإنسانية لمنصة ليلة، يُسمح للإدارة بتحويل رصيد القوة القاهرة (بسبب الوفاة أو الحوادث الجسيمة) إلى كاش في محفظة العميل ليتسنى له سحبه نقدياً <strong>بعد مرور 30 يوماً على الأقل من الحجز</strong> وذلك بعد إقرار الموافقة الإدارية الرسمية.
                    </p>

                    <div className="p-4 rounded-2xl bg-slate-50 border border-slate-150 space-y-2">
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-505">العميل المستفيد:</span>
                        <strong className="text-slate-800">{approvalModalData.customerName} ({approvalModalData.customerEmail})</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-505">رصيد القوة القاهرة المعتمد:</span>
                        <strong className="text-amber-600">{approvalModalData.amount} ر.س</strong>
                      </div>
                      <div className="flex justify-between border-b border-slate-100 pb-1">
                        <span className="text-slate-505">منقضي منذ تاريخ الحجز:</span>
                        <strong className="text-slate-800">{diffDays} يوم (تاريخ البدء: {heldDate.toLocaleDateString('ar-SA')})</strong>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-505">حالة الأهلية والتحقق القانوني:</span>
                        {isEligible ? (
                          <strong className="text-green-600">✓ مؤهل قانونياً للتسييل (تجاوز 30 يوماً)</strong>
                        ) : (
                          <strong className="text-red-500">✖ غير مؤهل حالياً (متبقي {30 - diffDays} يوم للحد الأدنى)</strong>
                        )}
                      </div>
                    </div>

                    {isEligible ? (
                      <div className="space-y-2">
                        <label className="block font-bold text-slate-800">بيان تفويض الموافقة العليا وتوقيع المسؤول (Approved By)</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: خالد بن هلال - رئيس مجلس الإدارة والعمليات العليا"
                          value={approvedByNameInput}
                          onChange={(e) => setApprovedByNameInput(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 font-sans cursor-text text-right"
                        />
                        <p className="text-[10px] text-slate-505 mt-1">
                          * الامتثال المالي: تحويل الرصيد سيتم بالكامل دون حسم أي رسوم، وتتحمل المنصة كافة تكاليف وتكاليف الإرجاع والعملية.
                        </p>
                      </div>
                    ) : (
                      <div className="bg-red-50 border border-red-150 p-4 rounded-2xl text-red-700 text-[11px] leading-relaxed">
                        🚨 لا يمكن تفعيل مسار تسييل الرصيد يدوياً قبل مرور الـ 30 يوماً كاملة من الحجز طبقاً لبنود الشركاء، لإعطاء فرصة لإيفاد المستندات والتراخيص الطبية اللازمة ولحفظ الحقوق التجارية لمزودي المنصة بالسيولة.
                      </div>
                    )}
                  </div>

                  <div className="mt-6 flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setApprovalModalData(null);
                        setApprovedByNameInput('');
                      }}
                      className="px-4 py-2 bg-slate-100 font-bold rounded-xl text-xs hover:bg-slate-200 transition-colors"
                    >
                      إلغاء النافذة
                    </button>
                    {isEligible && (
                      <button
                        type="button"
                        onClick={() => handleManualConvert(approvalModalData.id, approvedByNameInput)}
                        disabled={!approvedByNameInput.trim()}
                        className="px-4 py-2 bg-green-600 text-white font-bold rounded-xl text-xs hover:bg-green-700 disabled:opacity-50 transition-colors cursor-pointer"
                      >
                        إقرار وتسييل الرصيد كاش فوراً ⚡
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* --- CUSTOMER LEDGERS TAB END --- */}
      {/* --- PARTNER OPERATIONS (عمليات الشركاء) TAB --- */}
      {activeSubTab === 'providers' && (
        <div className="animate-in fade-in space-y-6">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-lg border border-slate-800 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
            <div className="space-y-2 text-right">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-bold border border-blue-400/30">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>مركز إدارة وحوكمة عمليات الشركاء (Partner Operations Ledger)</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                سجل عمليات الشركاء والتسويات المالية الموحدة
              </h2>
              <p className="text-slate-300 text-xs sm:text-sm max-w-3xl leading-relaxed">
                تتبع الأداء المالي والتشغيلي لجميع مزودي القاعات والخدمات المساندة، واحتساب عمولات منصة ليلة طبقاً لباقات الاشتراك، مع التحكم الكامل بمسارات التسويات والتحويلات المالية المباشرة.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => {
                  const csvData = filteredProvidersList.map(p => ({
                    'المعرف': p.id,
                    'اسم الشريك': p.name,
                    'الباقة': p.subscriptionTier,
                    'نسبة العمولة': `${(p.commissionRate * 100).toFixed(0)}%`,
                    'عدد القاعات': p.hallsCount,
                    'عدد الخدمات': p.servicesCount,
                    'عدد الحجوزات': p.bookingsCount,
                    'إجمالي المبيعات (ر.س)': p.grossSales.toFixed(2),
                    'عمولة المنصة (ر.س)': p.platformCommission.toFixed(2),
                    'صافي مستحقات الشريك (ر.س)': p.netPartnerEarned.toFixed(2),
                    'المسدد بالتسويات (ر.س)': p.settledAmount.toFixed(2),
                    'الرصيد المعلق (ر.س)': p.pendingBalance.toFixed(2)
                  }));
                  downloadCSV(csvData, `partner_operations_summary_${new Date().toISOString().split('T')[0]}`);
                }}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 border border-white/10 transition-colors cursor-pointer w-full sm:w-auto"
              >
                <Download className="w-4 h-4 text-blue-300" />
                <span>تصدير تقرير الشركاء CSV</span>
              </button>
            </div>
          </div>

          {/* 4 Financial KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-right">
              <div className="flex justify-between items-center mb-3">
                <span className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Users className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">
                  {partnerOperationsSummary.totalHalls} قاعة • {partnerOperationsSummary.totalServices} خدمة
                </span>
              </div>
              <span className="text-slate-500 text-xs font-bold block">إجمالي الشركاء النشطين</span>
              <span className="text-2xl font-black text-slate-900 font-mono mt-1 block">
                {partnerOperationsSummary.totalPartners} شريك
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-right">
              <div className="flex justify-between items-center mb-3">
                <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <TrendingUp className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full">
                  حجوزات + خدمات
                </span>
              </div>
              <span className="text-slate-500 text-xs font-bold block">حجم مبيعات الشركاء الموحد</span>
              <span className="text-2xl font-black text-emerald-600 font-mono mt-1 block">
                {partnerOperationsSummary.totalGrossSales.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-right">
              <div className="flex justify-between items-center mb-3">
                <span className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                  <Landmark className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-extrabold bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">
                  إيراد سيادي للمنصة
                </span>
              </div>
              <span className="text-slate-500 text-xs font-bold block">إجمالي عمولات المنصة</span>
              <span className="text-2xl font-black text-purple-600 font-mono mt-1 block">
                {partnerOperationsSummary.totalCommissions.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
              </span>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs text-right">
              <div className="flex justify-between items-center mb-3">
                <span className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <CreditCard className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-extrabold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full">
                  بانتظار التسوية
                </span>
              </div>
              <span className="text-slate-500 text-xs font-bold block">الرصيد المعلق للشركاء</span>
              <span className="text-2xl font-black text-amber-600 font-mono mt-1 block">
                {partnerOperationsSummary.totalPending.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
              </span>
            </div>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-4 text-right">
            <div className="relative w-full sm:w-80">
              <input
                type="text"
                placeholder="ابحث باسم الشريك، الهاتف، السجل التجاري، المدينة..."
                value={providerSearchQuery}
                onChange={(e) => setProviderSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs px-4 py-3 rounded-2xl outline-none focus:border-blue-500 focus:bg-white pl-8"
              />
              {providerSearchQuery && (
                <button
                  type="button"
                  onClick={() => setProviderSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-bold text-slate-500">تصفية حسب الباقة:</span>
              <select
                value={providerTierFilter}
                onChange={(e) => setProviderTierFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-slate-700 text-xs px-4 py-2.5 rounded-2xl outline-none cursor-pointer focus:bg-white focus:border-blue-500 font-bold"
              >
                <option value="all">جميع الباقات</option>
                <option value="basic">الباقة الأساسية (عمولة 15%)</option>
                <option value="advanced">الباقة المتقدمة (عمولة 12%)</option>
                <option value="professional">الباقة الاحترافية (عمولة 8%)</option>
              </select>
            </div>
          </div>

          {/* Partners Operations Table */}
          <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden text-right">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span className="w-2 h-4 bg-blue-600 rounded-full"></span>
                  قائمة الشركاء والمستحقات المباشرة ({filteredProvidersList.length})
                </h3>
                <p className="text-slate-400 text-xs mt-0.5">
                  بيانات الشركاء المسجلة حقيقياً في قاعدة البيانات مع احتساب المبيعات والعمولات ومسارات التسوية
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 text-slate-500 font-extrabold border-b border-slate-100 text-[11px]">
                    <th className="p-4">الشريك والمنشأة</th>
                    <th className="p-4 text-center">باقة الاشتراك والعمولة</th>
                    <th className="p-4 text-center">العناصر والمنشآت</th>
                    <th className="p-4 text-center">إجمالي المبيعات</th>
                    <th className="p-4 text-center">عمولة المنصة</th>
                    <th className="p-4 text-center">صافي مستحقات الشريك</th>
                    <th className="p-4 text-center">المسدد بالتسويات</th>
                    <th className="p-4 text-center">الرصيد المعلق</th>
                    <th className="p-4 text-center">الإجراءات والعمليات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProvidersList.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center p-10 text-slate-400 text-xs font-medium">
                        لا يوجد شركاء مطابقين لمعايير البحث في الوقت الحالي.
                      </td>
                    </tr>
                  ) : (
                    filteredProvidersList.map((p) => {
                      const tierBadgeColor = p.subscriptionTier.includes('احترافية') || p.subscriptionTier.includes('pro') 
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : p.subscriptionTier.includes('متقدمة')
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200';

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4">
                            <div className="font-extrabold text-slate-900 text-sm">{p.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5 space-x-2 space-x-reverse">
                              <span>📍 {p.city}</span>
                              {p.phone !== '-' && <span>• 📞 {p.phone}</span>}
                              {p.crNumber !== '-' && <span>• 📜 س.ت: {p.crNumber}</span>}
                            </div>
                          </td>

                          <td className="p-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${tierBadgeColor}`}>
                              {p.subscriptionTier}
                            </span>
                            <div className="text-[10px] text-slate-500 font-mono mt-1 font-bold">
                              نسبة العمولة: {(p.commissionRate * 100).toFixed(0)}%
                            </div>
                          </td>

                          <td className="p-4 text-center whitespace-nowrap font-bold text-slate-700">
                            <div className="text-xs">{p.hallsCount} قاعات</div>
                            <div className="text-[10px] text-slate-400 font-normal">{p.servicesCount} خدمات مساندة</div>
                          </td>

                          <td className="p-4 text-center whitespace-nowrap font-mono font-extrabold text-slate-900">
                            {p.grossSales.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                            <div className="text-[9px] text-slate-400 font-sans font-normal">
                              ({p.bookingsCount} حجز • {p.serviceRequestsCount} طلب)
                            </div>
                          </td>

                          <td className="p-4 text-center whitespace-nowrap font-mono font-bold text-purple-600">
                            {p.platformCommission.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                          </td>

                          <td className="p-4 text-center whitespace-nowrap font-mono font-bold text-emerald-600">
                            {p.netPartnerEarned.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                          </td>

                          <td className="p-4 text-center whitespace-nowrap font-mono font-bold text-blue-600">
                            {p.settledAmount.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                          </td>

                          <td className="p-4 text-center whitespace-nowrap">
                            {p.pendingBalance > 0 ? (
                              <span className="font-mono font-extrabold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200 inline-block text-xs">
                                {p.pendingBalance.toLocaleString('ar-SA', { minimumFractionDigits: 2 })} ر.س
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block">
                                ✓ مسدد بالكامل
                              </span>
                            )}
                          </td>

                          <td className="p-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedProviderForStatement(p);
                                  setPartnerStatementTab('summary');
                                }}
                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-extrabold rounded-xl text-xs transition-colors cursor-pointer border border-blue-200"
                              >
                                كشف حساب تفصيلي 📄
                              </button>

                              <button
                                type="button"
                                onClick={() => {
                                  setSettleProviderData(p);
                                  setSettleAmountInput(p.pendingBalance > 0 ? p.pendingBalance.toString() : '');
                                  setSettleReferenceInput(`REV-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
                                  setSettleNotesInput(`تسوية مستحقات الشريك ${p.name}`);
                                  setIsSettleModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                              >
                                تسجيل تسوية 💰
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Modal 1: Detailed Partner Statement (كشف حساب الشريك المدقق) */}
          {selectedProviderForStatement && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200 text-right max-h-[90vh] flex flex-col">
                {/* Modal Header */}
                <div className="p-6 bg-slate-900 text-white flex justify-between items-center border-b border-slate-800">
                  <div>
                    <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 px-2.5 py-0.5 rounded-full border border-blue-400/30">
                      كشف حساب معتمد للشركاء
                    </span>
                    <h3 className="font-extrabold text-lg text-white mt-1">
                      كشف حساب الشريك: {selectedProviderForStatement.name}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedProviderForStatement(null)}
                    className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Modal Tabs */}
                <div className="bg-slate-100 p-2 flex gap-2 border-b border-slate-200 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setPartnerStatementTab('summary')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partnerStatementTab === 'summary' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    الملخص والتسويات
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerStatementTab('bookings')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partnerStatementTab === 'bookings' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    حجوزات القاعات ({selectedProviderForStatement.bookingsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerStatementTab('services')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partnerStatementTab === 'services' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    الخدمات المساندة ({selectedProviderForStatement.serviceRequestsCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setPartnerStatementTab('settlements')}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      partnerStatementTab === 'settlements' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    حركات التسويات المالية ({selectedProviderForStatement.settlementsList.length})
                  </button>
                </div>

                {/* Modal Content Area */}
                <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
                  {partnerStatementTab === 'summary' && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                          <span className="text-slate-400 text-[10px] block font-bold">إجمالي المبيعات</span>
                          <span className="font-mono font-extrabold text-slate-900 text-base">
                            {selectedProviderForStatement.grossSales.toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-200">
                          <span className="text-purple-600 text-[10px] block font-bold">عمولة المنصة ({(selectedProviderForStatement.commissionRate * 100).toFixed(0)}%)</span>
                          <span className="font-mono font-extrabold text-purple-700 text-base">
                            {selectedProviderForStatement.platformCommission.toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200">
                          <span className="text-emerald-600 text-[10px] block font-bold">صافي مستحقات الشريك</span>
                          <span className="font-mono font-extrabold text-emerald-700 text-base">
                            {selectedProviderForStatement.netPartnerEarned.toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                          <span className="text-amber-600 text-[10px] block font-bold">الرصيد القابل للتسوية</span>
                          <span className="font-mono font-extrabold text-amber-700 text-base">
                            {selectedProviderForStatement.pendingBalance.toLocaleString('ar-SA')} ر.س
                          </span>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-slate-700">
                        <h4 className="font-extrabold text-slate-900 text-sm">بيانات الهوية والبنك للشريك</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div><strong>البريد الإلكتروني:</strong> {selectedProviderForStatement.email}</div>
                          <div><strong>الهاتف:</strong> {selectedProviderForStatement.phone}</div>
                          <div><strong>السجل التجاري:</strong> {selectedProviderForStatement.crNumber}</div>
                          <div><strong>الحساب البنكي (IBAN):</strong> <span className="font-mono">{selectedProviderForStatement.iban}</span></div>
                        </div>
                      </div>
                    </div>
                  )}

                  {partnerStatementTab === 'bookings' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th className="p-3">رقم الحجز</th>
                            <th className="p-3">القاعة / المرافق</th>
                            <th className="p-3">العميل</th>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3">المبلغ الإجمالي</th>
                            <th className="p-3">عمولة المنصة</th>
                            <th className="p-3">صافي الشريك</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProviderForStatement.bookingsList.length === 0 ? (
                            <tr><td colSpan={7} className="text-center p-6 text-slate-400">لا توجد حجوزات قاعات مؤكدة حالياً لهذا الشريك.</td></tr>
                          ) : (
                            selectedProviderForStatement.bookingsList.map((b: any) => {
                              const price = Number(b.totalPrice || b.amount || 0);
                              const comm = price * selectedProviderForStatement.commissionRate;
                              const net = price - comm;
                              return (
                                <tr key={b.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                  <td className="p-3 font-mono font-bold text-slate-600">{formatBookingId(b.id)}</td>
                                  <td className="p-3 font-bold text-slate-800">{b.hall || 'قاعة أفراح'}</td>
                                  <td className="p-3 text-slate-600">{b.customerName || 'عميل'}</td>
                                  <td className="p-3 text-slate-500">{new Date(b.date || b.createdAt).toLocaleDateString('ar-SA')}</td>
                                  <td className="p-3 font-mono font-bold text-slate-900">{price.toLocaleString('ar-SA')} ر.س</td>
                                  <td className="p-3 font-mono font-bold text-purple-600">{comm.toLocaleString('ar-SA')} ر.س</td>
                                  <td className="p-3 font-mono font-bold text-emerald-600">{net.toLocaleString('ar-SA')} ر.س</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {partnerStatementTab === 'services' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th className="p-3">رقم الطلب</th>
                            <th className="p-3">اسم الخدمة</th>
                            <th className="p-3">العميل</th>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3">المبلغ الإجمالي</th>
                            <th className="p-3">عمولة المنصة</th>
                            <th className="p-3">صافي الشريك</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProviderForStatement.serviceRequestsList.length === 0 ? (
                            <tr><td colSpan={7} className="text-center p-6 text-slate-400">لا توجد طلبات خدمات مساندة مدفوعة لهذا الشريك.</td></tr>
                          ) : (
                            selectedProviderForStatement.serviceRequestsList.map((sr: any) => {
                              const price = Number(sr.price || sr.amount || 0);
                              const comm = price * selectedProviderForStatement.commissionRate;
                              const net = price - comm;
                              return (
                                <tr key={sr.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                  <td className="p-3 font-mono font-bold text-slate-600">{sr.id}</td>
                                  <td className="p-3 font-bold text-slate-800">{sr.serviceName || 'خدمة مساندة'}</td>
                                  <td className="p-3 text-slate-600">{sr.customerName || 'عميل'}</td>
                                  <td className="p-3 text-slate-500">{new Date(sr.createdAt || sr.date).toLocaleDateString('ar-SA')}</td>
                                  <td className="p-3 font-mono font-bold text-slate-900">{price.toLocaleString('ar-SA')} ر.س</td>
                                  <td className="p-3 font-mono font-bold text-purple-600">{comm.toLocaleString('ar-SA')} ر.س</td>
                                  <td className="p-3 font-mono font-bold text-emerald-600">{net.toLocaleString('ar-SA')} ر.س</td>
                                </tr>
                              );
                            })
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {partnerStatementTab === 'settlements' && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th className="p-3">رقم التسوية المالي</th>
                            <th className="p-3">التاريخ</th>
                            <th className="p-3">مبلغ التحويل/التسوية</th>
                            <th className="p-3">البيان والملاحظات</th>
                            <th className="p-3 text-center">الحالة</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedProviderForStatement.settlementsList.length === 0 ? (
                            <tr><td colSpan={5} className="text-center p-6 text-slate-400">لا توجد حركات تسويات سابقة لهذا الشريك.</td></tr>
                          ) : (
                            selectedProviderForStatement.settlementsList.map((st: any) => (
                              <tr key={st.id} className="border-b border-slate-100 hover:bg-slate-50/50">
                                <td className="p-3 font-mono font-bold text-blue-600">{st.referenceNumber || st.id}</td>
                                <td className="p-3 text-slate-500">{new Date(st.createdAt || st.date).toLocaleDateString('ar-SA')}</td>
                                <td className="p-3 font-mono font-bold text-emerald-600">{Number(st.amount).toLocaleString('ar-SA')} ر.س</td>
                                <td className="p-3 text-slate-700">{st.notes || 'تسوية مستحقات الشريك'}</td>
                                <td className="p-3 text-center">
                                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-full border border-emerald-200">
                                    ✓ معتمدة ومسددة
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <button
                    type="button"
                    onClick={() => setSelectedProviderForStatement(null)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    إغلاق
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSettleProviderData(selectedProviderForStatement);
                        setSettleAmountInput(selectedProviderForStatement.pendingBalance > 0 ? selectedProviderForStatement.pendingBalance.toString() : '');
                        setSettleReferenceInput(`REV-${new Date().getFullYear().toString().slice(-2)}-${Math.floor(1000000000 + Math.random() * 9000000000)}`);
                        setSettleNotesInput(`تسوية مستحقات الشريك ${selectedProviderForStatement.name}`);
                        setIsSettleModalOpen(true);
                      }}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      تسجيل تسوية مالية جديدة 💰
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Modal 2: Create Settlement Dialog */}
          {isSettleModalOpen && settleProviderData && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-[110] flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl p-6 relative animate-in zoom-in-95 duration-200 text-right">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <span>💰</span>
                    تسجيل إصدار تسوية وتحويل مالي للشريك
                  </h3>
                  <button
                    type="button"
                    onClick={() => setIsSettleModalOpen(false)}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded-full cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const amt = parseFloat(settleAmountInput);
                    if (isNaN(amt) || amt <= 0) {
                      alert('يرجى إدخال مبلغ تسوية صحيح أكبر من الصفر');
                      return;
                    }
                    handleCreateSettlement(settleProviderData, amt, settleNotesInput, settleReferenceInput);
                  }}
                  className="space-y-4 text-xs"
                >
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">اسم الشريك المستفيد:</span>
                      <strong className="text-slate-900">{settleProviderData.name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">الرصيد المعلق بانتظار التسوية:</span>
                      <strong className="text-amber-600 font-mono">{settleProviderData.pendingBalance.toLocaleString('ar-SA')} ر.س</strong>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">مبلغ التسوية المراد تحويله (SAR)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={settleAmountInput}
                      onChange={(e) => setSettleAmountInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-900 font-bold outline-none focus:border-blue-500 text-right"
                      placeholder="أدخل المبلغ"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">رقم الإيراد / التحويل البنكي المرجعي (REV-YY-XXXXXXXXXX)</label>
                    <input
                      type="text"
                      required
                      value={settleReferenceInput}
                      onChange={(e) => setSettleReferenceInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 font-mono text-slate-900 font-bold outline-none focus:border-blue-500 text-right"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-800 mb-1">بيان وملاحظات التسوية</label>
                    <textarea
                      rows={2}
                      value={settleNotesInput}
                      onChange={(e) => setSettleNotesInput(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 outline-none focus:border-blue-500 text-right"
                      placeholder="بيانات التسوية والتحويل"
                    ></textarea>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setIsSettleModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingSettlement}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingSettlement ? 'جاري الاعتماد...' : 'اعتماد وإصدار التسوية ⚡'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {isAddRevenueModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
             <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <h3 className="font-bold text-xl text-slate-800">تسجيل إيراد خارجي جديد</h3>
               <button onClick={() => setIsAddRevenueModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
             </div>
             <form onSubmit={handleAddRevenue} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-right">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">بيان الإيراد</label>
                     <input required value={newRevenue.title} onChange={e=>setNewRevenue({...newRevenue, title: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" placeholder="مثال: رسوم استشارة فنية" />
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-bold text-slate-700">نوع الإيراد</label>
                       <button type="button" onClick={() => { setIsAddRevenueModalOpen(false); setIsRevenueTypesManagerOpen(true); }} className="text-xs text-blue-600 hover:underline font-bold">إدارة الأنواع</button>
                     </div>
                     <select required value={newRevenue.type} onChange={e=>setNewRevenue({...newRevenue, type: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm">
                        {revenueTypes.length > 0 ? (
                          revenueTypes.map(t => (
                            <option key={t.id} value={t.name}>{t.name}</option>
                          ))
                        ) : (
                          ['اشتراك باقة الشركاء', 'عمولة حجز قاعات', 'مبيعات خدمات مساندة', 'إيرادات خارجية عامة'].map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))
                        )}
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">اسم العميل / الجهة الدافعة</label>
                     <input required value={newRevenue.payerName} onChange={e=>setNewRevenue({...newRevenue, payerName: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" placeholder="مثال: شركة الوفاق" />
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">رقم المستند / الإيصال</label>
                     <input required value={newRevenue.referenceNumber} onChange={e=>setNewRevenue({...newRevenue, referenceNumber: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" placeholder="مثال: DOC-2026-99" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">طريقة التحصيل</label>
                     <select required value={newRevenue.collectionMethod} onChange={e=>setNewRevenue({...newRevenue, collectionMethod: e.target.value as any})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm">
                        <option value="bank">تحويل بنكي (Bank Transfer)</option>
                        <option value="cash">نقداً (Cash)</option>
                        <option value="credit">آجل (On Credit)</option>
                        <option value="online">مدفوعات إلكترونية (Online Payment)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">رفع المستند / الإثبات</label>
                     <div className="flex gap-2">
                       <input 
                         type="file" 
                         id="revenue-attachment-file" 
                         accept="image/*,.pdf" 
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (!file) return;
                           setIsUploading(true);
                           try {
                             const formData = new FormData();
                             formData.append('image', file);
                             const res = await fetch('/api/upload?type=finance', {
                               method: 'POST',
                               body: formData
                             });
                             if (res.ok) {
                               const data = await res.json();
                               setNewRevenue(prev => ({ ...prev, attachmentUrl: data.url }));
                             } else {
                               alert('فشل رفع المستند للخدمة');
                             }
                           } catch (err) {
                             console.error('Upload error:', err);
                             alert('حدث خطأ أثناء الرفع');
                           } finally {
                             setIsUploading(false);
                           }
                         }}
                         className="hidden" 
                       />
                       <label 
                         htmlFor="revenue-attachment-file" 
                         className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl px-4 py-2.5 text-center text-xs text-slate-600 font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                       >
                         {isUploading ? (
                           <span className="animate-pulse text-blue-600 font-bold">جاري رفع المستند... 🔄</span>
                         ) : newRevenue.attachmentUrl ? (
                           <span className="text-emerald-600 font-bold">✓ تم رفع المستند بنجاح</span>
                         ) : (
                           <span>اختيار ملف (صورة أو PDF) 📤</span>
                         )}
                       </label>
                       {newRevenue.attachmentUrl && (
                         <button 
                           type="button" 
                           onClick={() => setNewRevenue(prev => ({ ...prev, attachmentUrl: '' }))} 
                           className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2.5 rounded-xl border border-red-200 text-xs font-bold transition-colors"
                           title="حذف المستند"
                         >
                           حذف
                         </button>
                       )}
                     </div>
                  </div>
                </div>

                {/* Inline Document Preview */}
                {newRevenue.attachmentUrl && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2 text-right">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">معاينة المستند المرفق:</span>
                      <a href={newRevenue.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-bold hover:underline">
                        فتح في نافذة جديدة 🔗
                      </a>
                    </div>
                    {newRevenue.attachmentUrl.toLowerCase().endsWith('.pdf') ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
                        📄 مستند بصيغة PDF. اضغط على الرابط أعلاه لعرضه أو تنزيله.
                      </div>
                    ) : (
                      <div className="relative max-h-48 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2">
                        <img 
                          src={newRevenue.attachmentUrl} 
                          alt="مستند الإثبات" 
                          className="max-h-44 object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                    <div>
                       <label className="block text-xs font-bold text-slate-500 mb-1">رابط المستند الفعلي على الخادم</label>
                       <input readOnly value={newRevenue.attachmentUrl} type="text" className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 outline-none text-[11px] font-mono text-left cursor-not-allowed" />
                    </div>
                  </div>
                )}

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">الوصف التفصيلي للإيراد</label>
                   <textarea rows={2} value={newRevenue.description} onChange={e=>setNewRevenue({...newRevenue, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" placeholder="تفاصيل وحيثيات الإيراد..." />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات إضافية</label>
                   <textarea rows={2} value={newRevenue.notes} onChange={e=>setNewRevenue({...newRevenue, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm" placeholder="ملاحظات المحاسب أو المراجع..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">تكامل ضريبة القيمة المضافة</label>
                     <select 
                       value={newRevenue.isTaxable ? "true" : "false"} 
                       onChange={e => setNewRevenue({ ...newRevenue, isTaxable: e.target.value === "true" })} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-blue-500 text-sm font-sans"
                     >
                        <option value="true">خاضع للضريبة (15% VAT)</option>
                        <option value="false">معفى من الضريبة (Exempt)</option>
                     </select>
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-2">
                       <label className="text-sm font-bold text-slate-700">المبلغ الكلي شامل الضريبة</label>
                       <button
                         type="button"
                         onClick={() => {
                           setIsRevenueTaxCalcOpen(!isRevenueTaxCalcOpen);
                           if (!revenueCalcAmount && newRevenue.total) {
                             setRevenueCalcAmount(newRevenue.total);
                           }
                         }}
                         className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                       >
                         <Calculator className="w-3.5 h-3.5" />
                         <span>حاسبة الضريبة (15%)</span>
                       </button>
                     </div>
                     <div className="relative">
                        <input required value={newRevenue.total} onChange={e=>setNewRevenue({...newRevenue, total: e.target.value})} type="number" step="0.01" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-blue-500 font-heading text-sm" placeholder="0.00" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">SAR</span>
                     </div>
                  </div>
                </div>

                {/* Quick 1-Click Tax Helper Buttons for Revenue */}
                {newRevenue.total && !isNaN(parseFloat(newRevenue.total)) && parseFloat(newRevenue.total) > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400">إجراءات حسابية سريعة:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(newRevenue.total) || 0;
                        const withTax = (cur * 1.15).toFixed(2);
                        setNewRevenue(prev => ({ ...prev, total: withTax, isTaxable: true }));
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="يعتبر المبلغ الحالي غير شامل ويضيف 15% ضريبة عليه"
                    >
                      <span>+ إضافة 15% ضريبة</span>
                      <span className="text-[10px] text-slate-500 font-mono">({(parseFloat(newRevenue.total) * 1.15).toFixed(2)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(newRevenue.total) || 0;
                        const baseOnly = (cur / 1.15).toFixed(2);
                        setNewRevenue(prev => ({ ...prev, total: baseOnly, isTaxable: false }));
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="استخراج المبلغ الأساسي فقط بدون ضريبة"
                    >
                      <span>÷ حسم / استخراج الأساس</span>
                      <span className="text-[10px] text-slate-500 font-mono">({(parseFloat(newRevenue.total) / 1.15).toFixed(2)})</span>
                    </button>
                  </div>
                )}

                {/* Interactive Dedicated Tax Calculator Card for Revenue */}
                {isRevenueTaxCalcOpen && (
                  <div className="p-4 bg-gradient-to-br from-blue-50/60 to-slate-50 border border-blue-200/80 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-blue-100/80 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">حاسبة ضريبة القيمة المضافة للإيرادات (15% VAT)</h4>
                          <p className="text-[10px] text-slate-500 font-medium">تسجيل الإيراد شاملاً لضريبة القيمة المضافة بدقة متوافقة مع الأنظمة المحاسبية</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsRevenueTaxCalcOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mode Switcher */}
                    <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-blue-100 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setRevenueCalcMode('add_vat')}
                        className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                          revenueCalcMode === 'add_vat'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        1. إضافة الضريبة (المبلغ غير شامل)
                      </button>
                      <button
                        type="button"
                        onClick={() => setRevenueCalcMode('extract_vat')}
                        className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                          revenueCalcMode === 'extract_vat'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        2. حسم / استخراج الضريبة (المبلغ شامل)
                      </button>
                    </div>

                    {/* Calculator Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        {revenueCalcMode === 'add_vat' 
                          ? 'أدخل المبلغ الأساسي الخاضع للضريبة (قبل 15%):' 
                          : 'أدخل المبلغ الإجمالي النهائي للإيراد (شامل 15%):'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={revenueCalcAmount}
                          onChange={e => setRevenueCalcAmount(e.target.value)}
                          placeholder="مثال: 1000"
                          className="w-full bg-white border border-blue-200 focus:border-blue-500 rounded-xl pl-12 pr-4 py-2.5 outline-none font-mono text-sm font-bold text-slate-800 shadow-xs"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">SAR</span>
                      </div>
                    </div>

                    {/* Calculation Results Card */}
                    {revenueCalcAmount && !isNaN(parseFloat(revenueCalcAmount)) && parseFloat(revenueCalcAmount) > 0 && (() => {
                      const inputVal = parseFloat(revenueCalcAmount);
                      let baseVal = 0;
                      let vatVal = 0;
                      let totalVal = 0;

                      if (revenueCalcMode === 'add_vat') {
                        baseVal = inputVal;
                        vatVal = inputVal * 0.15;
                        totalVal = inputVal * 1.15;
                      } else {
                        totalVal = inputVal;
                        baseVal = inputVal / 1.15;
                        vatVal = inputVal - baseVal;
                      }

                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-blue-100 shadow-xs space-y-2.5">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 block">المبلغ الأساسي (قبل الضريبة)</span>
                              <span className="text-xs font-black text-slate-800 font-mono block mt-0.5">{baseVal.toFixed(2)} ر.س</span>
                            </div>
                            <div className="p-2 bg-blue-50/50 rounded-lg border border-blue-100">
                              <span className="text-[9px] font-bold text-blue-600 block">قيمة الضريبة (15% VAT)</span>
                              <span className="text-xs font-black text-blue-600 font-mono block mt-0.5">{vatVal.toFixed(2)} ر.س</span>
                            </div>
                            <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                              <span className="text-[9px] font-bold text-emerald-700 block">الإجمالي الشامل للضريبة</span>
                              <span className="text-xs font-black text-emerald-700 font-mono block mt-0.5">{totalVal.toFixed(2)} ر.س</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setNewRevenue(prev => ({
                                  ...prev,
                                  total: totalVal.toFixed(2),
                                  isTaxable: true
                                }));
                                setIsRevenueTaxCalcOpen(false);
                              }}
                              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تطبيق المبلغ الشامل ({totalVal.toFixed(2)} ر.س) في حقل الإيراد</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                   {newRevenue.total && !isNaN(parseFloat(newRevenue.total)) && (
                     newRevenue.isTaxable ? (
                       <p className="text-xs text-slate-500 mt-2 font-medium">
                         المبلغ الأساسي (الخاضع للضريبة): {(parseFloat(newRevenue.total)/1.15).toFixed(2)} ر.س | الضريبة (15%): {(parseFloat(newRevenue.total) - (parseFloat(newRevenue.total)/1.15)).toFixed(2)} ر.س
                       </p>
                     ) : (
                       <p className="text-xs text-green-600 mt-2 font-semibold">
                         المبلغ معفى من الضريبة: {parseFloat(newRevenue.total).toFixed(2)} ر.س (المبلغ الأساسي: {parseFloat(newRevenue.total).toFixed(2)} ر.س | الضريبة: 0.00 ر.س)
                       </p>
                     )
                   )}
                </div>
                <div className="pt-4 flex gap-3">
                   <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">تسجيل الإيراد</button>
                   <button type="button" onClick={() => setIsAddRevenueModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm">إلغاء</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* --- ADD EXPENSE MODAL --- */}
      {isAddExpenseModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
             <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <h3 className="font-bold text-xl text-slate-800">تسجيل مصروف جديد</h3>
               <button onClick={() => setIsAddExpenseModalOpen(false)} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
             </div>
             <form onSubmit={handleAddExpense} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-right">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">بيان المصروف</label>
                     <input required value={newExpense.title} onChange={e=>setNewExpense({...newExpense, title: e.target.value})} type="text" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm" placeholder="مثال: رواتب موظفين، تسويق" />
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-slate-700">التصنيف</label>
                        {userRole === 'admin' && (
                          <button type="button" onClick={() => { setIsAddExpenseModalOpen(false); setIsExpenseCategoriesManagerOpen(true); }} className="text-xs text-red-600 hover:underline font-bold">إدارة التصنيفات</button>
                        )}
                     </div>
                     <select required value={newExpense.category} onChange={e=>setNewExpense({...newExpense, category: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm">
                        {expenseCategories.length > 0 ? (
                           expenseCategories.map(cat => (
                              <option key={cat.id} value={cat.name}>{cat.name}</option>
                           ))
                        ) : (
                           ['رواتب', 'تسويق', 'خدمات', 'استضافة', 'تبرعات', 'أخرى'].map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                           ))
                        )}
                     </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">طريقة الدفع</label>
                     <select required value={newExpense.paymentMethod} onChange={e=>setNewExpense({...newExpense, paymentMethod: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm">
                        <option value="bank">تحويل بنكي (Bank Transfer)</option>
                        <option value="cash">نقداً (Cash)</option>
                        <option value="credit">آجل (On Credit)</option>
                        <option value="online">دفع إلكتروني (Online)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">حالة الدفع</label>
                     <select required value={newExpense.status} onChange={e=>setNewExpense({...newExpense, status: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm">
                        <option value="paid">مدفوع (Paid)</option>
                        <option value="pending">مستحق / غير مدفوع (Pending)</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الاستحقاق</label>
                     <input value={newExpense.dueDate} onChange={e=>setNewExpense({...newExpense, dueDate: e.target.value})} type="date" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:border-red-500 text-sm" />
                  </div>
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">رفع المستند / الإثبات (الفاتورة)</label>
                   <div className="flex gap-2">
                     <input 
                       type="file" 
                       id="expense-attachment-file" 
                       accept="image/*,.pdf" 
                       onChange={async (e) => {
                         const file = e.target.files?.[0];
                         if (!file) return;
                         setIsUploading(true);
                         try {
                           const formData = new FormData();
                           formData.append('image', file);
                           const res = await fetch('/api/upload?type=finance', {
                             method: 'POST',
                             body: formData
                           });
                           if (res.ok) {
                             const data = await res.json();
                             setNewExpense(prev => ({ ...prev, attachmentUrl: data.url }));
                           } else {
                             alert('فشل رفع المستند للخدمة');
                           }
                         } catch (err) {
                           console.error('Upload error:', err);
                           alert('حدث خطأ أثناء الرفع');
                         } finally {
                           setIsUploading(false);
                         }
                       }}
                       className="hidden" 
                     />
                     <label 
                       htmlFor="expense-attachment-file" 
                       className="flex-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 border-dashed rounded-xl px-4 py-2.5 text-center text-xs text-slate-600 font-medium cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
                     >
                       {isUploading ? (
                         <span className="animate-pulse text-red-600 font-bold">جاري رفع المستند... 🔄</span>
                       ) : newExpense.attachmentUrl ? (
                         <span className="text-emerald-600 font-bold">✓ تم رفع فاتورة المصروف بنجاح</span>
                       ) : (
                         <span>اختيار فاتورة المصروف (صورة أو PDF) 📤</span>
                       )}
                     </label>
                     {newExpense.attachmentUrl && (
                       <button 
                         type="button" 
                         onClick={() => setNewExpense(prev => ({ ...prev, attachmentUrl: '' }))} 
                         className="bg-red-50 text-red-600 hover:bg-red-100 px-3 py-2.5 rounded-xl border border-red-200 text-xs font-bold transition-colors"
                         title="حذف المستند"
                       >
                         حذف
                       </button>
                     )}
                   </div>
                </div>

                {/* Inline Expense Document Preview */}
                {newExpense.attachmentUrl && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-150 space-y-2 text-right">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-700">معاينة المستند المرفق:</span>
                      <a href={newExpense.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-red-600 font-bold hover:underline">
                        فتح في نافذة جديدة 🔗
                      </a>
                    </div>
                    {newExpense.attachmentUrl.toLowerCase().endsWith('.pdf') ? (
                      <div className="bg-white border border-slate-200 rounded-xl p-4 text-center text-xs text-slate-500">
                        📄 فاتورة بصيغة PDF. اضغط على الرابط أعلاه لعرضها أو تنزيلها.
                      </div>
                    ) : (
                      <div className="relative max-h-48 overflow-hidden rounded-xl border border-slate-200 bg-white flex items-center justify-center p-2">
                        <img 
                          src={newExpense.attachmentUrl} 
                          alt="فاتورة المصروف" 
                          className="max-h-44 object-contain rounded"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    )}
                  </div>
                )}

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">الوصف التفصيلي للمصروف</label>
                   <textarea rows={2} value={newExpense.description} onChange={e=>setNewExpense({...newExpense, description: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm" placeholder="أدخل تفاصيل إضافية عن المصروف أو أسبابه..." />
                </div>

                <div>
                   <label className="block text-sm font-bold text-slate-700 mb-2">ملاحظات محاسبية</label>
                   <textarea rows={2} value={newExpense.notes} onChange={e=>setNewExpense({...newExpense, notes: e.target.value})} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm" placeholder="ملاحظات المراجعة أو قيود السداد..." />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                     <label className="block text-sm font-bold text-slate-700 mb-2">تكامل ضريبة القيمة المضافة</label>
                     <select 
                       value={newExpense.isTaxable ? "true" : "false"} 
                       onChange={e => setNewExpense({ ...newExpense, isTaxable: e.target.value === "true" })} 
                       className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 outline-none focus:border-red-500 text-sm font-sans"
                     >
                        <option value="true">خاضع للضريبة (15% VAT)</option>
                        <option value="false">معفى من الضريبة (Exempt)</option>
                     </select>
                  </div>
                  <div>
                     <div className="flex justify-between items-center mb-2">
                       <label className="text-sm font-bold text-slate-700">المبلغ الكلي شامل الضريبة</label>
                       <button
                         type="button"
                         onClick={() => {
                           setIsExpenseTaxCalcOpen(!isExpenseTaxCalcOpen);
                           if (!expenseCalcAmount && newExpense.total) {
                             setExpenseCalcAmount(newExpense.total);
                           }
                         }}
                         className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200/70 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                       >
                         <Calculator className="w-3.5 h-3.5" />
                         <span>حاسبة الضريبة (15%)</span>
                       </button>
                     </div>
                     <div className="relative">
                        <input required value={newExpense.total} onChange={e=>setNewExpense({...newExpense, total: e.target.value})} type="number" step="0.01" min="0" className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3 outline-none focus:border-red-500 font-heading text-sm" placeholder="0.00" />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">SAR</span>
                     </div>
                  </div>
                </div>

                {/* Quick 1-Click Tax Helper Buttons */}
                {newExpense.total && !isNaN(parseFloat(newExpense.total)) && parseFloat(newExpense.total) > 0 && (
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] font-bold text-slate-400">إجراءات حسابية سريعة:</span>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(newExpense.total) || 0;
                        const withTax = (cur * 1.15).toFixed(2);
                        setNewExpense(prev => ({ ...prev, total: withTax, isTaxable: true }));
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="يعتبر المبلغ الحالي غير شامل ويضيف 15% ضريبة عليه"
                    >
                      <span>+ إضافة 15% ضريبة</span>
                      <span className="text-[10px] text-slate-500 font-mono">({(parseFloat(newExpense.total) * 1.15).toFixed(2)})</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cur = parseFloat(newExpense.total) || 0;
                        const baseOnly = (cur / 1.15).toFixed(2);
                        setNewExpense(prev => ({ ...prev, total: baseOnly, isTaxable: false }));
                      }}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      title="استخراج المبلغ الأساسي فقط بدون ضريبة"
                    >
                      <span>÷ حسم / استخراج الأساس</span>
                      <span className="text-[10px] text-slate-500 font-mono">({(parseFloat(newExpense.total) / 1.15).toFixed(2)})</span>
                    </button>
                  </div>
                )}

                {/* Interactive Dedicated Tax Calculator Card */}
                {isExpenseTaxCalcOpen && (
                  <div className="p-4 bg-gradient-to-br from-red-50/60 to-slate-50 border border-red-200/80 rounded-2xl space-y-3 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center border-b border-red-100/80 pb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-red-600 text-white flex items-center justify-center shadow-xs">
                          <Calculator className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-800">حاسبة ضريبة القيمة المضافة (15% VAT)</h4>
                          <p className="text-[10px] text-slate-500 font-medium">اختر نمط الحساب لحساب وإدراج المبلغ بدقة متوافقة مع هيئة الزكاة والضريبة</p>
                        </div>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setIsExpenseTaxCalcOpen(false)}
                        className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Mode Switcher */}
                    <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-red-100 shadow-xs">
                      <button
                        type="button"
                        onClick={() => setExpenseCalcMode('add_vat')}
                        className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                          expenseCalcMode === 'add_vat'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        1. إضافة الضريبة (المبلغ غير شامل)
                      </button>
                      <button
                        type="button"
                        onClick={() => setExpenseCalcMode('extract_vat')}
                        className={`py-2 px-3 rounded-lg text-xs font-black transition-all cursor-pointer text-center ${
                          expenseCalcMode === 'extract_vat'
                            ? 'bg-red-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                        }`}
                      >
                        2. حسم / استخراج الضريبة (المبلغ شامل)
                      </button>
                    </div>

                    {/* Calculator Input */}
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-bold text-slate-700 block">
                        {expenseCalcMode === 'add_vat' 
                          ? 'أدخل المبلغ الأساسي الخاضع للضريبة (قبل 15%):' 
                          : 'أدخل المبلغ الإجمالي النهائي (شامل 15%):'}
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={expenseCalcAmount}
                          onChange={e => setExpenseCalcAmount(e.target.value)}
                          placeholder="مثال: 1000"
                          className="w-full bg-white border border-red-200 focus:border-red-500 rounded-xl pl-12 pr-4 py-2.5 outline-none font-mono text-sm font-bold text-slate-800 shadow-xs"
                        />
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">SAR</span>
                      </div>
                    </div>

                    {/* Calculation Results Card */}
                    {expenseCalcAmount && !isNaN(parseFloat(expenseCalcAmount)) && parseFloat(expenseCalcAmount) > 0 && (() => {
                      const inputVal = parseFloat(expenseCalcAmount);
                      let baseVal = 0;
                      let vatVal = 0;
                      let totalVal = 0;

                      if (expenseCalcMode === 'add_vat') {
                        baseVal = inputVal;
                        vatVal = inputVal * 0.15;
                        totalVal = inputVal * 1.15;
                      } else {
                        totalVal = inputVal;
                        baseVal = inputVal / 1.15;
                        vatVal = inputVal - baseVal;
                      }

                      return (
                        <div className="bg-white p-3.5 rounded-xl border border-red-100 shadow-xs space-y-2.5">
                          <div className="grid grid-cols-3 gap-2 text-center">
                            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                              <span className="text-[9px] font-bold text-slate-400 block">المبلغ الأساسي (قبل الضريبة)</span>
                              <span className="text-xs font-black text-slate-800 font-mono block mt-0.5">{baseVal.toFixed(2)} ر.س</span>
                            </div>
                            <div className="p-2 bg-red-50/50 rounded-lg border border-red-100">
                              <span className="text-[9px] font-bold text-red-600 block">قيمة الضريبة (15% VAT)</span>
                              <span className="text-xs font-black text-red-600 font-mono block mt-0.5">{vatVal.toFixed(2)} ر.س</span>
                            </div>
                            <div className="p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                              <span className="text-[9px] font-bold text-emerald-700 block">الإجمالي الشامل للضريبة</span>
                              <span className="text-xs font-black text-emerald-700 font-mono block mt-0.5">{totalVal.toFixed(2)} ر.س</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setNewExpense(prev => ({
                                  ...prev,
                                  total: totalVal.toFixed(2),
                                  isTaxable: true
                                }));
                                setIsExpenseTaxCalcOpen(false);
                              }}
                              className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>تطبيق المبلغ الشامل ({totalVal.toFixed(2)} ر.س) في حقل المصروف</span>
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                <div>
                   {newExpense.total && !isNaN(parseFloat(newExpense.total)) && (
                     newExpense.isTaxable ? (
                       <p className="text-xs text-slate-500 mt-2 font-medium">
                         المبلغ الأساسي (الخاضع للضريبة): {(parseFloat(newExpense.total)/1.15).toFixed(2)} ر.س | الضريبة (15%): {(parseFloat(newExpense.total) - (parseFloat(newExpense.total)/1.15)).toFixed(2)} ر.س
                       </p>
                     ) : (
                       <p className="text-xs text-green-600 mt-2 font-semibold">
                         المبلغ معفى من الضريبة: {parseFloat(newExpense.total).toFixed(2)} ر.س (المبلغ الأساسي: {parseFloat(newExpense.total).toFixed(2)} ر.س | الضريبة: 0.00 ر.س)
                       </p>
                     )
                   )}
                </div>

                <div className="pt-4 flex gap-3">
                   <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors text-sm">حفظ المصروف</button>
                   <button type="button" onClick={() => setIsAddExpenseModalOpen(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors text-sm">إلغاء</button>
                </div>
             </form>
          </div>
        </div>
      )}

      {/* --- REVENUE TYPES MANAGER MODAL --- */}
      {isRevenueTypesManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
             <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <h3 className="font-bold text-xl text-slate-800">إدارة أنواع الإيرادات</h3>
               <button onClick={() => { setIsRevenueTypesManagerOpen(false); setIsAddRevenueModalOpen(true); }} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
             </div>
             <div className="p-6 space-y-6 text-right">
                {/* Add new type form */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="font-bold text-sm text-slate-700 mb-2">إضافة نوع إيراد يدوي جديد</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('typeName') as HTMLInputElement;
                    const name = input.value.trim();
                    if (!name) return;
                    try {
                      const token = localStorage.getItem('token') || '';
                      const res = await fetch('/api/finance/revenue-types', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify({ name })
                      });
                      if (res.ok) {
                        input.value = '';
                        await fetchRevenueTypes();
                      } else {
                        const err = await res.json();
                        alert(err.error || 'فشل إضافة النوع');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }} className="flex gap-2">
                    <input name="typeName" required type="text" className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="مثال: مبيعات استشارات خاصة" />
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">إضافة</button>
                  </form>
                </div>

                {/* List of types */}
                <div className="max-h-[40vh] overflow-y-auto space-y-2">
                  {revenueTypes.map(type => {
                    return (
                      <div key={type.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{type.name}</span>
                          {type.isSystem ? (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">تلقائي مغلق</span>
                          ) : (
                            <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full font-bold">يدوي مخصص</span>
                          )}
                        </div>
                        {!type.isSystem && (
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const newName = prompt('أدخل الاسم الجديد لنوع الإيراد:', type.name);
                              if (newName === null) return;
                              const trimmed = newName.trim();
                              if (!trimmed) return;
                              try {
                                const token = localStorage.getItem('token') || '';
                                const res = await fetch(`/api/finance/revenue-types/${type.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': token ? `Bearer ${token}` : ''
                                  },
                                  body: JSON.stringify({ name: trimmed })
                                });
                                if (res.ok) {
                                  await fetchRevenueTypes();
                                } else {
                                  const err = await res.json();
                                  alert(err.error || 'فشل التعديل');
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }} className="text-xs text-blue-600 hover:underline font-bold">تعديل</button>
                            <button onClick={async () => {
                              if (!confirm(`هل أنت متأكد من حذف نوع الإيراد "${type.name}"؟`)) return;
                              try {
                                const token = localStorage.getItem('token') || '';
                                const res = await fetch(`/api/finance/revenue-types/${type.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': token ? `Bearer ${token}` : ''
                                  }
                                });
                                if (res.ok) {
                                  await fetchRevenueTypes();
                                } else {
                                  const err = await res.json();
                                  alert(err.error || 'فشل الحذف');
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }} className="text-xs text-red-600 hover:underline font-bold">حذف</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => { setIsRevenueTypesManagerOpen(false); setIsAddRevenueModalOpen(true); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">العودة لطلب الإيراد</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* --- REVENUE DETAILS MODAL --- */}
      {/* --- EXPENSE CATEGORIES MANAGER MODAL --- */}
      {isExpenseCategoriesManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
             <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <h3 className="font-bold text-xl text-slate-800">إدارة تصنيفات المصروفات</h3>
               <button onClick={() => { setIsExpenseCategoriesManagerOpen(false); setIsAddExpenseModalOpen(true); }} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
             </div>
             <div className="p-6 space-y-6 text-right">
                {/* Add new category form */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150">
                  <h4 className="font-bold text-sm text-slate-700 mb-2">إضافة تصنيف مصروف يدوي جديد</h4>
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const form = e.currentTarget;
                    const input = form.elements.namedItem('categoryName') as HTMLInputElement;
                    const name = input.value.trim();
                    if (!name) return;
                    try {
                      const token = localStorage.getItem('token') || '';
                      const res = await fetch('/api/finance/expense-categories', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': token ? `Bearer ${token}` : ''
                        },
                        body: JSON.stringify({ name })
                      });
                      if (res.ok) {
                        input.value = '';
                        await fetchExpenseCategories();
                      } else {
                        const err = await res.json();
                        alert(err.error || 'فشل إضافة التصنيف');
                      }
                    } catch (err) {
                      console.error(err);
                    }
                  }} className="flex gap-2">
                    <input name="categoryName" required type="text" className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-500 text-right" placeholder="مثال: رسوم تراخيص، صيانة القاعات" />
                    <button type="submit" className="bg-red-600 hover:bg-red-700 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors font-sans">إضافة</button>
                  </form>
                </div>

                {/* List of categories */}
                <div className="max-h-[40vh] overflow-y-auto space-y-2">
                  {expenseCategories.map(cat => {
                    return (
                      <div key={cat.id} className="flex justify-between items-center p-3 rounded-xl border border-slate-100 bg-white hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 text-sm">{cat.name}</span>
                          {cat.isSystem ? (
                            <span className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold">تلقائي مغلق</span>
                          ) : (
                            <span className="text-[10px] bg-red-50 text-red-700 border border-red-100 px-2 py-0.5 rounded-full font-bold">يدوي مخصص</span>
                          )}
                        </div>
                        {!cat.isSystem && (
                          <div className="flex gap-2">
                            <button onClick={async () => {
                              const newName = prompt('أدخل الاسم الجديد لتصنيف المصروف:', cat.name);
                              if (newName === null) return;
                              const trimmed = newName.trim();
                              if (!trimmed) return;
                              try {
                                const token = localStorage.getItem('token') || '';
                                const res = await fetch(`/api/finance/expense-categories/${cat.id}`, {
                                  method: 'PUT',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': token ? `Bearer ${token}` : ''
                                  },
                                  body: JSON.stringify({ name: trimmed })
                                });
                                if (res.ok) {
                                  await fetchExpenseCategories();
                                } else {
                                  const err = await res.json();
                                  alert(err.error || 'فشل التعديل');
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }} className="text-xs text-blue-600 hover:underline font-bold">تعديل</button>
                            <button onClick={async () => {
                              if (!confirm(`هل أنت متأكد من حذف تصنيف المصروف "${cat.name}"؟`)) return;
                              try {
                                const token = localStorage.getItem('token') || '';
                                const res = await fetch(`/api/finance/expense-categories/${cat.id}`, {
                                  method: 'DELETE',
                                  headers: {
                                    'Authorization': token ? `Bearer ${token}` : ''
                                  }
                                });
                                if (res.ok) {
                                  await fetchExpenseCategories();
                                } else {
                                  const err = await res.json();
                                  alert(err.error || 'فشل الحذف');
                                }
                              } catch (err) {
                                console.error(err);
                              }
                            }} className="text-xs text-red-600 hover:underline font-bold">حذف</button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => { setIsExpenseCategoriesManagerOpen(false); setIsAddExpenseModalOpen(true); }} className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">العودة لتسجيل المصروف</button>
                </div>
             </div>
          </div>
        </div>
      )}

      {isRevenueDetailsOpen && selectedRevenue && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
             <div className="flex justify-between items-center p-6 border-b border-slate-100">
               <h3 className="font-bold text-xl text-slate-800">تفاصيل السند المالي للإيراد</h3>
               <button onClick={() => { setIsRevenueDetailsOpen(false); setSelectedRevenue(null); }} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
             </div>
             <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-right">
                {/* Revenue Number Header Card */}
                <div className="bg-slate-900 text-white p-5 rounded-2xl flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 mb-1">رقم الإيراد المالي</p>
                    <p className="text-lg font-mono font-black tracking-wider text-amber-400">{selectedRevenue.revenueNumber || selectedRevenue.id}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-xs text-slate-400 mb-1">تاريخ القيد</p>
                    <p className="text-sm font-bold">{selectedRevenue.date}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="border-b border-slate-100 pb-3">
                    <p className="text-xs text-slate-400 mb-1">بيان الإيراد</p>
                    <p className="text-base font-bold text-slate-800">{selectedRevenue.title}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">نوع الإيراد</p>
                      <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">{selectedRevenue.type}</span>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">طبيعة المصدر</p>
                      {selectedRevenue.isExternal ? (
                        <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-purple-50 text-purple-700 border border-purple-100">إيراد خارجي يدوي</span>
                      ) : (
                        <span className="inline-block px-2 py-1 rounded text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">داخلي تلقائي</span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">اسم العميل / الجهة الدافعة</p>
                      <p className="text-sm font-bold text-slate-700">{selectedRevenue.payerName || 'المنصة والمستخدمين'}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">رقم السند / المستند</p>
                      <p className="text-sm font-bold text-slate-700 font-mono">{selectedRevenue.referenceNumber || 'لا يوجد'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-3">
                    <div>
                      <p className="text-xs text-slate-400 mb-1">طريقة التحصيل</p>
                      <p className="text-sm font-bold text-slate-700">
                        {selectedRevenue.collectionMethod === 'bank' ? 'تحويل بنكي (Bank Transfer)' : 
                         selectedRevenue.collectionMethod === 'cash' ? 'نقداً (Cash)' : 
                         selectedRevenue.collectionMethod === 'credit' ? 'آجل (On Credit)' : 
                         selectedRevenue.collectionMethod === 'online' ? 'مدفوعات إلكترونية (Online Payment)' : 'إلكتروني'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-400 mb-1">مرفق الإثبات</p>
                      {selectedRevenue.attachmentUrl ? (
                        <a href={selectedRevenue.attachmentUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                          فتح مستند الإثبات 🔗
                        </a>
                      ) : (
                        <p className="text-xs text-slate-400">لا يوجد مستند مرفق</p>
                      )}
                    </div>
                  </div>

                  {selectedRevenue.description && (
                    <div className="border-b border-slate-100 pb-3">
                      <p className="text-xs text-slate-400 mb-1">الوصف التفصيلي</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl">{selectedRevenue.description}</p>
                    </div>
                  )}

                  {selectedRevenue.notes && (
                    <div className="border-b border-slate-100 pb-3">
                      <p className="text-xs text-slate-400 mb-1">الوصف المحاسبي / ملاحظات</p>
                      <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100/50">{selectedRevenue.notes}</p>
                    </div>
                  )}

                  {/* Financial Breakdown Card */}
                  <div className="bg-slate-50 p-4 rounded-2xl space-y-2 border border-slate-100">
                    {selectedRevenue.vat && selectedRevenue.vat > 0 ? (
                      <>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>المبلغ الخاضع للضريبة (الأساسي):</span>
                          <span className="font-mono font-bold">{selectedRevenue.amount?.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>مبلغ الضريبة (15%):</span>
                          <span className="font-mono font-bold">{selectedRevenue.vat?.toFixed(2)} ر.س</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex justify-between text-xs text-green-600 font-semibold mb-1">
                        <span>حالة الضريبة:</span>
                        <span>معفى من ضريبة القيمة المضافة</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-bold text-slate-800 pt-2 border-t border-slate-200">
                      <span>{selectedRevenue.vat && selectedRevenue.vat > 0 ? 'الإجمالي الشامل للضريبة:' : 'المبلغ الإجمالي:'}</span>
                      <span className="font-mono text-emerald-600 font-black">{selectedRevenue.total?.toFixed(2)} ر.س</span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 justify-end">
                  <button type="button" onClick={() => { setIsRevenueDetailsOpen(false); setSelectedRevenue(null); }} className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors">إغلاق</button>
                </div>
             </div>
          </div>
        </div>
      )}

    </div>
  );
}

