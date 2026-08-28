import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Clock, FileText, ChevronRight, ShieldCheck, 
  Sparkles, AlertCircle, ArrowRight, Printer, RefreshCw, Send,
  UserCheck, Calendar, DollarSign, Lock, Download, Award,
  CheckSquare, Square, ClipboardCheck, Star, BadgeCheck,
  Building2, Truck, MessageSquareOff, Receipt, Wallet,
  FileCheck, ShieldAlert, Check, ChevronDown, Eye, Zap,
  SlidersHorizontal, Unlock, ExternalLink, HelpCircle, X
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface SmartBookingLifecycleManagerProps {
  myBookings: any[];
  onUpdateBookingStage?: (bookingId: string, newStage: number) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  currentProviderName: string;
  providerSubscription?: any;
  onNavigateToSubscriptions?: () => void;
}

export interface Stage6TaskItem {
  id: 't1' | 't2' | 't3' | 't4' | 't5' | 't6' | 't7' | 't8';
  title: string;
  desc: string;
  category: 'operational' | 'financial' | 'review';
  categoryLabel: '🔵 المسار الميداني واللوجستي' | '🟢 المسار المالي والنظامي' | '🟣 مسار التقييم والأرشفة';
  requiredRole: 'supervisor' | 'financial_admin' | 'system';
  badge: string;
}

export const STAGE_6_TASKS: Stage6TaskItem[] = [
  // 1. المسار الميداني واللوجستي
  { 
    id: 't1', 
    title: 'فحص سلامة القاعة والمرافق (Facility & Assets)', 
    desc: 'معاينة فيزيائية شاملة (كنب، طاولات، ثريات، شاشات LED، مسرح، كوشة، أجنحة العروس) والتأكد من خلوها من أي تلفيات.', 
    category: 'operational',
    categoryLabel: '🔵 المسار الميداني واللوجستي',
    requiredRole: 'supervisor',
    badge: 'ميداني'
  },
  { 
    id: 't2', 
    title: 'مطابقة تسليم الخدمات المساندة (Service Delivery)', 
    desc: 'مطابقة اكتمال خدمات البوفيه، الضيافة، القهوة، التصوير، والتنظيم وتأكيد خروج الموردين ومعداتهم 100%.', 
    category: 'operational',
    categoryLabel: '🔵 المسار الميداني واللوجستي',
    requiredRole: 'supervisor',
    badge: 'لوجستي'
  },
  { 
    id: 't3', 
    title: 'تسوية المفقودات وإخلاء الطرف (Lost & Found)', 
    desc: 'تسليم الأمانات المتبقية لأصحاب الحفل، توثيق الإخلاء، وتحويل قناة الدردشة اليومية لوضع القراءة فقط (Read-Only).', 
    category: 'operational',
    categoryLabel: '🔵 المسار الميداني واللوجستي',
    requiredRole: 'supervisor',
    badge: 'إخلاء طرف'
  },
  // 2. المسار المالي والنظامي
  { 
    id: 't4', 
    title: 'فك حجز مبالغ التأمين المستردة (Security Deposit)', 
    desc: 'تحرير مبلغ التأمين ضد التلفيات وإعادته لحساب العميل وتوليد قيد سند مصروفات قياسي بصيغة EXP-26-XXXXXXXXXX.', 
    category: 'financial',
    categoryLabel: '🟢 المسار المالي والنظامي',
    requiredRole: 'financial_admin',
    badge: 'تأمين مسترد'
  },
  { 
    id: 't5', 
    title: 'احتساب عمولة المنصة وتوليد قيد الإيراد (REV)', 
    desc: 'اقتطاع عمولة المنصة التلقائية بناءً على باقة المزود وتوليد رقم قيد الإيراد السيادي REV-26-XXXXXXXXXX.', 
    category: 'financial',
    categoryLabel: '🟢 المسار المالي والنظامي',
    requiredRole: 'system',
    badge: 'إيراد سيادي'
  },
  { 
    id: 't6', 
    title: 'إصدار الفاتورة الضريبية ZATCA المعتمدة (INV)', 
    desc: 'توليد فاتورة INV-26XXXXXXXXXX المعتمدة (بدون واصلة) وتشفير رمز ZATCA Phase 2 Base64 QR Code.', 
    category: 'financial',
    categoryLabel: '🟢 المسار المالي والنظامي',
    requiredRole: 'system',
    badge: 'فاتورة ZATCA'
  },
  { 
    id: 't7', 
    title: 'تصفية حساب الضمان وتحرير الأرباح (Escrow Release)', 
    desc: 'فك حجز أموال الضمان البنكي (Escrow Vault) وتحويل صافي المستحقات فورياً للمحفظة الرقمية للمزود.', 
    category: 'financial',
    categoryLabel: '🟢 المسار المالي والنظامي',
    requiredRole: 'financial_admin',
    badge: 'تسوية المحفظة'
  },
  // 3. مسار التقييم والتجربة والأرشفة
  { 
    id: 't8', 
    title: 'إتاحة التقييم الموثوق 5★ والأرشفة الإلكترونية', 
    desc: 'إرسال رابط تقييم موثق برقم الحجز BKG-26-XXXXXXXXXX وأرشفة الحجز وتحديث إحصائيات الإشغال والإيراد.', 
    category: 'review',
    categoryLabel: '🟣 مسار التقييم والأرشفة',
    requiredRole: 'system',
    badge: 'تقييم وأرشفة'
  },
];

export const SmartBookingLifecycleManager: React.FC<SmartBookingLifecycleManagerProps> = ({
  myBookings,
  onUpdateBookingStage,
  showNotification,
  currentProviderName,
  providerSubscription,
  onNavigateToSubscriptions
}) => {
  const { providers } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const STAGES = [
    { level: 1, percent: 15, title: 'طلب مبدئي', desc: 'استلام وتدقيق البيانات' },
    { level: 2, percent: 35, title: 'معاينة القاعة', desc: 'زيارة ميدانية وتأكيد المواعيد' },
    { level: 3, percent: 60, title: 'سداد العربون والضمان', desc: 'حجز مؤكد في الضمان المالي' },
    { level: 4, percent: 80, title: 'الجاهزية اللوجستية', desc: 'إسناد الطاقم والتجهيز الميداني' },
    { level: 5, percent: 95, title: 'إقامة الفعالية مباشر', desc: 'الحفل جارٍ بتغطية شاملة' },
    { level: 6, percent: 100, title: 'إتمام وإصدار الفاتورة وتصفية الأرباح', desc: 'تسوية نهائية وإغلاق الملف' },
  ];

  // Current Provider info and Tier detection (Rule #8)
  const currentProviderObj = useMemo(() => {
    if (!providers || providers.length === 0) return null;
    return providers.find((p: any) => 
      p.name === currentProviderName || 
      p.providerName === currentProviderName ||
      p.id === currentProviderName
    );
  }, [providers, currentProviderName]);

  // Check entitlement for 6-Stage Lifecycle Mode based on subscription & add-ons
  const isSixStagesEntitled = useMemo(() => {
    // 1. Check explicit prop if passed
    if (providerSubscription) {
      if (providerSubscription.includesSixStages) return true;
      if (providerSubscription.addons?.includes('six_stages_lifecycle')) return true;
      if (providerSubscription.id === 'pro' || providerSubscription.id === 'business') return true;
    }
    // 2. Check currentProviderObj
    const tier = currentProviderObj?.subscriptionTier || currentProviderObj?.tier || '';
    if (tier === 'pro' || tier === 'business' || tier === 'professional') return true;
    if (currentProviderObj?.includesSixStages) return true;
    if (currentProviderObj?.addons?.includes('six_stages_lifecycle')) return true;
    
    // 3. Check local storage for persistent subscription
    try {
      const storedSub = localStorage.getItem(`provider_subscription_${currentProviderName}`) || localStorage.getItem('provider_subscription');
      if (storedSub) {
        const parsed = JSON.parse(storedSub);
        if (parsed.includesSixStages || parsed.addons?.includes('six_stages_lifecycle') || parsed.id === 'pro' || parsed.id === 'business') {
          return true;
        }
      }
    } catch {}

    return false;
  }, [providerSubscription, currentProviderObj, currentProviderName]);

  // Active Workflow Mode: 'direct' (Fast-Track / Express Direct Settlement) vs 'advanced' (6-Stage Full Lifecycle)
  const [workflowMode, setWorkflowMode] = useState<'direct' | 'advanced'>(() => {
    const saved = localStorage.getItem(`provider_workflow_mode_${currentProviderName}`);
    if (saved === 'advanced' && isSixStagesEntitled) return 'advanced';
    if (saved === 'direct') return 'direct';
    return isSixStagesEntitled ? 'advanced' : 'direct';
  });

  // Automatically enforce direct mode if provider is not entitled
  useEffect(() => {
    if (!isSixStagesEntitled && workflowMode === 'advanced') {
      setWorkflowMode('direct');
      localStorage.setItem(`provider_workflow_mode_${currentProviderName}`, 'direct');
    }
  }, [isSixStagesEntitled, workflowMode, currentProviderName]);

  const handleSwitchMode = (newMode: 'direct' | 'advanced') => {
    if (newMode === 'advanced' && !isSixStagesEntitled) {
      setShowUpgradeModal(true);
      showNotification('warning', '⚠️ ميزة نظام دورات الحياة المتقدمة (المراحل الست) مقفلة وتتطلب الترقية لباقة الأعمال أو الاحترافية.');
      return;
    }
    setWorkflowMode(newMode);
    localStorage.setItem(`provider_workflow_mode_${currentProviderName}`, newMode);
    if (newMode === 'direct') {
      showNotification('info', '⚡ تم تفعيل "النمط السريع المباشر" - إنجاز وتسوية فورية بدون مراحل تشغيلية.');
    } else {
      showNotification('success', '🔄 تم تفعيل "نظام المراحل الست المتقدم" - إدارة تشغيلية ولوجستية شاملة.');
    }
  };

  // Subscription Tier & Commission Rate (Rule #8)
  const providerCommissionRate = useMemo(() => {
    const tier = currentProviderObj?.subscriptionTier || currentProviderObj?.tier || (providerSubscription?.id) || 'advanced';
    if (tier === 'basic') return 0.15; // 15%
    if (tier === 'pro' || tier === 'professional') return 0.05; // 5%
    return 0.10; // 10% for Business / default
  }, [currentProviderObj, providerSubscription]);

  const providerTierLabel = useMemo(() => {
    const tier = currentProviderObj?.subscriptionTier || currentProviderObj?.tier || (providerSubscription?.id) || 'advanced';
    if (tier === 'basic') return 'الباقة الأساسية (عمولة 15%)';
    if (tier === 'pro' || tier === 'professional') return 'الباقة الاحترافية Pro (عمولة 5%)';
    return 'باقة الأعمال (عمولة 10%)';
  }, [currentProviderObj, providerSubscription]);

  // Map bookings to a manageable format with strict provider isolation
  const activeBookings = useMemo(() => {
    const list = myBookings && myBookings.length > 0 ? myBookings : [
      { id: 'BKG-26-0000000001', customerName: 'الأستاذ فيصل الشمري', hallName: 'قاعة الثريا الملكية', date: '2026-08-20', price: 28000, currentStage: 6, type: 'hall', depositAmount: 3000 },
      { id: 'BKG-26-0000000002', customerName: 'د. سارة الدوسري', hallName: 'قاعة اللؤلؤة للاحتفالات', date: '2026-08-25', price: 35000, currentStage: 3, type: 'hall', depositAmount: 4000 },
      { id: 'SRV-26-0000000001', customerName: 'مهندس خالد المطيري', hallName: 'باقة الضيافة الملكية المتكاملة', date: '2026-09-02', price: 19500, currentStage: 5, type: 'service', depositAmount: 2000 },
    ];

    return list.map((b: any, idx: number) => {
      const rawId = b.id !== undefined && b.id !== null ? String(b.id) : (b.bookingId ? String(b.bookingId) : `BKG-26-000000000${idx + 1}`);
      const isSrv = b.type === 'service' || rawId.startsWith('SRV');
      
      return {
        id: rawId,
        customerName: String(b.customerName || b.clientName || b.client || 'عميل منصة ليلة'),
        hallName: String(b.hallName || b.serviceName || b.hall || 'قاعة المناسبات الملكية'),
        date: String(b.date || b.eventDate || '2026-08-20'),
        price: Number(b.price || b.totalPrice || b.amount || 25000) || 25000,
        depositAmount: Number(b.depositAmount || 3000),
        currentStage: Math.min(6, Math.max(1, Number(b.currentStage || b.stage || 3) || 3)),
        type: isSrv ? 'service' : 'hall',
        provider: String(b.provider || b.providerName || currentProviderName || '')
      };
    });
  }, [myBookings, currentProviderName]);

  // Persistent stage levels
  const [bookingStages, setBookingStages] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem(`provider_stages_${currentProviderName}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const initial: Record<string, number> = {};
    activeBookings.forEach((b: any) => {
      initial[b.id] = b.currentStage || 3;
    });
    return initial;
  });

  // Track 8-Pillar Checked Tasks per booking
  const [stage6ChecklistMap, setStage6ChecklistMap] = useState<Record<string, string[]>>(() => {
    const saved = localStorage.getItem(`provider_stage6_8pillars_${currentProviderName}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    const initial: Record<string, string[]> = {};
    activeBookings.forEach((b: any) => {
      if (b.currentStage === 6) {
        initial[b.id] = ['t1', 't2', 't3', 't4', 't5', 't6', 't7', 't8'];
      }
    });
    return initial;
  });

  // Track finalized releases per booking (Idempotency control)
  const [releasedPayouts, setReleasedPayouts] = useState<Record<string, any>>(() => {
    const saved = localStorage.getItem(`provider_stage6_payouts_${currentProviderName}`);
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* ignore */ }
    }
    return {};
  });

  const toggleTask = (bookingId: string, taskId: string) => {
    setStage6ChecklistMap(prev => {
      const currentList = prev[bookingId] || [];
      const nextList = currentList.includes(taskId)
        ? currentList.filter(id => id !== taskId)
        : [...currentList, taskId];
      
      const updated = { ...prev, [bookingId]: nextList };
      localStorage.setItem(`provider_stage6_8pillars_${currentProviderName}`, JSON.stringify(updated));
      return updated;
    });
  };

  const selectAllTasks = (bookingId: string) => {
    setStage6ChecklistMap(prev => {
      const allIds = STAGE_6_TASKS.map(t => t.id);
      const updated = { ...prev, [bookingId]: allIds };
      localStorage.setItem(`provider_stage6_8pillars_${currentProviderName}`, JSON.stringify(updated));
      return updated;
    });
    showNotification('info', `تم اعتماد كافة بنود الجاهزية الثمانية للحجز (${bookingId}).`);
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [filterStage, setFilterStage] = useState<number | 'all'>('all');

  const filteredBookings = useMemo(() => {
    return activeBookings.filter((b: any) => {
      const stageLevel = bookingStages[b.id] || b.currentStage || 1;
      const matchStage = filterStage === 'all' || stageLevel === filterStage;
      const query = searchQuery.trim().toLowerCase();
      const matchSearch = !query || 
        String(b.id || '').toLowerCase().includes(query) ||
        String(b.customerName || '').toLowerCase().includes(query) ||
        String(b.hallName || '').toLowerCase().includes(query);
      return matchStage && matchSearch;
    });
  }, [activeBookings, bookingStages, filterStage, searchQuery]);

  // ID Generators strictly adhering to project rules (Rules #1, #2, #3, #4, #5)
  const formatInvoiceId = (idVal: any) => {
    const str = String(idVal || '');
    const cleanNum = str.replace(/\D/g, '');
    const seq = (cleanNum || '1').slice(-10).padStart(10, '0');
    return `INV-26${seq}`;
  };

  const formatRevenueId = (idVal: any) => {
    const str = String(idVal || '');
    const cleanNum = str.replace(/\D/g, '');
    const seq = (cleanNum || '1').slice(-10).padStart(10, '0');
    return `REV-26-${seq}`;
  };

  const formatExpenseId = (idVal: any) => {
    const str = String(idVal || '');
    const cleanNum = str.replace(/\D/g, '');
    const seq = (cleanNum || '1').slice(-10).padStart(10, '0');
    return `EXP-26-${seq}`;
  };

  const advanceStage = (bookingId: string, targetLevel: number) => {
    setBookingStages(prev => {
      const updated = { ...prev, [bookingId]: targetLevel };
      localStorage.setItem(`provider_stages_${currentProviderName}`, JSON.stringify(updated));
      return updated;
    });

    if (onUpdateBookingStage) {
      onUpdateBookingStage(bookingId, targetLevel);
    }

    const stageObj = STAGES.find(s => s.level === targetLevel);
    if (targetLevel === 6) {
      showNotification('info', `انتقل الحجز (${bookingId}) إلى المرحلة 6: جاهزية الإغلاق والمصفوفة الثمانية.`);
    } else {
      showNotification('info', `تم تحديث الحجز (${bookingId}) إلى المرحلة ${targetLevel}: ${stageObj?.title}`);
    }
  };

  // Direct Fast-Track Immediate Settlement Action
  const handleDirectFastTrackSettlement = (bkg: any) => {
    const grossPrice = Number(bkg.price || 25000);
    const commissionAmount = grossPrice * providerCommissionRate;
    const vatOnCommission = commissionAmount * 0.15;
    const netPayout = grossPrice - (commissionAmount + vatOnCommission);

    const invoiceId = formatInvoiceId(bkg.id);
    const revId = formatRevenueId(bkg.id);
    const expId = formatExpenseId(bkg.id);

    const record = {
      releasedAt: new Date().toISOString(),
      invoiceId,
      revId,
      expId,
      grossPrice,
      commissionRate: providerCommissionRate,
      commissionAmount,
      vatOnCommission,
      netPayout,
      depositRefunded: bkg.depositAmount || 3000,
      mode: 'direct_fast_track',
      status: 'settled_and_closed'
    };

    setReleasedPayouts(prev => {
      const updated = { ...prev, [bkg.id]: record };
      localStorage.setItem(`provider_stage6_payouts_${currentProviderName}`, JSON.stringify(updated));
      return updated;
    });

    // Mark stage 6 checked
    setBookingStages(prev => ({ ...prev, [bkg.id]: 6 }));

    showNotification('success', `⚡ تم الإغلاق المباشر بنجاح! صدرت الفاتورة (${invoiceId})، قيد الإيراد (${revId})، وتم إيداع الصافي (${netPayout.toLocaleString()} ر.س) في المحفظة.`);
  };

  // Final Release Action for 6-Stage Advanced Mode (Escrow Release & Wallet Payout)
  const handleReleasePayout = (bkg: any) => {
    const checked = stage6ChecklistMap[bkg.id] || [];
    if (checked.length < STAGE_6_TASKS.length) {
      showNotification('warning', `⚠️ لا يمكن تحرير المستحقات وتصفية الضمان قبل استيفاء جميع بنود الجاهزية الثمانية (${checked.length}/8).`);
      return;
    }

    const grossPrice = Number(bkg.price || 25000);
    const commissionAmount = grossPrice * providerCommissionRate;
    const vatOnCommission = commissionAmount * 0.15;
    const netPayout = grossPrice - (commissionAmount + vatOnCommission);

    const invoiceId = formatInvoiceId(bkg.id);
    const revId = formatRevenueId(bkg.id);
    const expId = formatExpenseId(bkg.id);

    const record = {
      releasedAt: new Date().toISOString(),
      invoiceId,
      revId,
      expId,
      grossPrice,
      commissionRate: providerCommissionRate,
      commissionAmount,
      vatOnCommission,
      netPayout,
      depositRefunded: bkg.depositAmount || 3000,
      mode: 'advanced_6_stages',
      status: 'settled_and_closed'
    };

    setReleasedPayouts(prev => {
      const updated = { ...prev, [bkg.id]: record };
      localStorage.setItem(`provider_stage6_payouts_${currentProviderName}`, JSON.stringify(updated));
      return updated;
    });

    showNotification('success', `🎉 تم اعتماد الإغلاق بنجاح! صدرت الفاتورة (${invoiceId})، قيد الإيراد (${revId})، وتم إيداع الصافي (${netPayout.toLocaleString()} ر.س) في المحفظة.`);
  };

  return (
    <div className={`rounded-3xl p-6 border shadow-sm space-y-6 ${
      isDark ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200/80 text-slate-900'
    }`} dir="rtl">
      
      {/* 1. Workflow Mode Switcher Banner (Direct Mode vs Advanced 6-Stage Mode) */}
      <div className={`p-4 sm:p-5 rounded-2xl border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 ${
        isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              نمط إدارة العمليات والتسوية المالية
            </span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold font-mono border ${
              isSixStagesEntitled 
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {isSixStagesEntitled ? 'متاح للباقة (مفعل)' : 'الباقة الأساسية (نمط سريع)'}
            </span>
          </div>
          <h4 className="text-base font-black text-white">
            {workflowMode === 'direct' ? '⚡ النمط السريع المباشر (Direct Settlement Mode)' : '🔄 نظام دورات الحياة المتقدمة (المراحل الست)'}
          </h4>
          <p className="text-xs text-indigo-200 font-medium">
            {workflowMode === 'direct' 
              ? 'مخصص للمزودين والخدمات المنفردة: إغلاق فوري وتسوية أرباح بضغطة زر واحدة دون متطلبات تشغيلية أو طواقم.' 
              : 'مخصص للمنشآت والمناسبات الكبرى: مسار تشغيلي شامل بـ 6 مراحل ومصفوفة بنود الجاهزية الثمانية وإخلاء الطرف.'}
          </p>
        </div>

        {/* Mode Toggle Pills */}
        <div className="flex items-center bg-white/10 p-1.5 rounded-2xl border border-white/10 shrink-0 w-full sm:w-auto justify-center">
          <button
            onClick={() => handleSwitchMode('direct')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              workflowMode === 'direct'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-white hover:bg-white/10'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-700" />
            <span>النمط السريع المباشر</span>
          </button>

          <button
            onClick={() => handleSwitchMode('advanced')}
            className={`px-3.5 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              workflowMode === 'advanced'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : isSixStagesEntitled
                  ? 'text-white hover:bg-white/10'
                  : 'text-slate-300 hover:bg-white/5 opacity-85'
            }`}
          >
            {!isSixStagesEntitled ? (
              <Lock className="w-3.5 h-3.5 text-amber-400" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            <span>المراحل الست المتقدمة</span>
            {!isSixStagesEntitled && (
              <span className="text-[9px] bg-amber-400/30 text-amber-300 px-1.5 py-0.2 rounded font-mono">
                ترقية
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Top Header & Search/Filter Controls */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b ${
        isDark ? 'border-slate-800' : 'border-slate-100'
      }`}>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">
              {workflowMode === 'direct' ? 'Fast-Track Direct Payout Engine' : 'Stage 6 Settlement & Operational Engine'}
            </span>
            <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
              isDark ? 'bg-indigo-900/40 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'
            }`}>
              {filteredBookings.length} حجز نشط • {providerTierLabel}
            </span>
          </div>
          <h3 className={`text-lg font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            {workflowMode === 'direct' ? 'لوحة الإنجاز والتسوية المالية المباشرة' : 'مدير دورة حياة الحجز ومسار الجاهزية والتسوية'}
          </h3>
          <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            {workflowMode === 'direct'
              ? 'إدارة مختصرة للحجوزات واعتماد مباشر لإيداع الأرباح وإصدار الفواتير ZATCA وسندات القبض والصرف فورياً.'
              : 'تتبع مستقل للحجوزات ومصفوفة بنود الجاهزية الثمانية (3 مسارات تكاملية) لإغلاق الحجز وتصفية الأرباح.'}
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الحجز، القاعة، أو العميل..."
            className={`border rounded-2xl px-3.5 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-60 ${
              isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-400' : 'bg-slate-50 border-slate-200 text-slate-900'
            }`}
          />

          {workflowMode === 'advanced' && (
            <select
              value={filterStage}
              onChange={(e) => setFilterStage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
              className={`border rounded-2xl px-3 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer ${
                isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <option value="all">كل المراحل (1 - 6)</option>
              {STAGES.map(s => (
                <option key={s.level} value={s.level}>مرحلة {s.level}: {s.title}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* 2. DIRECT FAST-TRACK VIEW (النمط السريع المباشر)              */}
      {/* ============================================================ */}
      {workflowMode === 'direct' ? (
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border border-dashed ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-3" />
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">لا توجد طلبات أو حجوزات مطابقة</h4>
              <p className="text-xs text-slate-500 mt-1">ستظهر هنا كافة حجوزاتك مع خيار الإغلاق الفوري والتسوية المباشرة.</p>
            </div>
          ) : (
            filteredBookings.map((bkg: any) => {
              const payoutSettled = releasedPayouts[bkg.id];
              const isService = bkg.type === 'service' || bkg.id.startsWith('SRV');

              // Financial Calculations
              const grossPrice = Number(bkg.price || 25000);
              const taxableAmount = grossPrice / 1.15;
              const vatAmount = grossPrice - taxableAmount;
              const commissionAmount = grossPrice * providerCommissionRate;
              const vatOnCommission = commissionAmount * 0.15;
              const netPayout = grossPrice - (commissionAmount + vatOnCommission);
              const depositAmount = bkg.depositAmount || 3000;

              const invoiceId = formatInvoiceId(bkg.id);
              const revId = formatRevenueId(bkg.id);
              const expId = formatExpenseId(bkg.id);

              return (
                <motion.div
                  key={bkg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-3xl border p-5 sm:p-6 transition-all space-y-4 ${
                    isDark 
                      ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700' 
                      : 'bg-white border-slate-200 hover:border-indigo-200 shadow-xs'
                  }`}
                >
                  {/* Top Line */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs bg-slate-900 text-amber-400 font-black px-3 py-1 rounded-xl font-mono tracking-wide">
                        {bkg.id}
                      </span>
                      <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {bkg.customerName}
                      </h4>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isService 
                          ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-300'
                      }`}>
                        {isService ? '🚚 خدمة مساندة' : '🏢 حجز قاعة'}
                      </span>
                      {payoutSettled ? (
                        <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <BadgeCheck className="w-3 h-3" /> تم الإغلاق والتسوية
                        </span>
                      ) : (
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> حجز نشط وجاهز للتسوية
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-mono text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <span>تاريخ المناسبة: <strong className="text-slate-800 dark:text-slate-200">{bkg.date}</strong></span>
                    </div>
                  </div>

                  {/* Middle Financial Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200/80'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                        إجمالي القيمة (شامل الضريبة 15%)
                      </span>
                      <span className={`text-sm font-black font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {grossPrice.toLocaleString()} ر.س
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200/80'
                    }`}>
                      <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                        عمولة المنصة السيادية ({providerCommissionRate * 100}%)
                      </span>
                      <span className={`text-sm font-black font-mono mt-0.5 block ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        -{(commissionAmount + vatOnCommission).toLocaleString(undefined, { maximumFractionDigits: 1 })} ر.س
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50/70 border-amber-200/70'
                    }`}>
                      <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 block">
                        تأمين الضمان المسترد للعميل
                      </span>
                      <span className="text-sm font-black font-mono mt-0.5 block text-amber-800 dark:text-amber-200">
                        {depositAmount.toLocaleString()} ر.س
                      </span>
                    </div>

                    <div className={`p-3 rounded-2xl border ${
                      isDark ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-emerald-50 border-emerald-200'
                    }`}>
                      <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 block">
                        صافي الأرباح المحررة بالمحفظة
                      </span>
                      <span className="text-base font-black font-mono mt-0.5 block text-emerald-800 dark:text-emerald-300">
                        {netPayout.toLocaleString(undefined, { maximumFractionDigits: 1 })} ر.س
                      </span>
                    </div>
                  </div>

                  {/* Bottom Actions */}
                  <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                    payoutSettled
                      ? isDark ? 'bg-emerald-950/40 border-emerald-800/60' : 'bg-emerald-50/70 border-emerald-200'
                      : isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    {payoutSettled ? (
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
                          <BadgeCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                              تمت التسوية المباشرة وإيداع الأرباح بالمحفظة
                            </span>
                            <span className="text-[9px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                              ZATCA Ready
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            الفاتورة: <span className="font-mono font-bold text-slate-900 dark:text-white">{invoiceId}</span> • قيد الإيراد: <span className="font-mono font-bold text-slate-900 dark:text-white">{revId}</span>
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="text-right">
                        <h5 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          إجراء الإغلاق السريع والتسوية الفورية
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          بنقرة واحدة سيتم إنشاء الفاتورة الضريبية ZATCA وقيد الإيراد وتحويل صافي المبلغ للمحفظة.
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                      {payoutSettled ? (
                        <button
                          onClick={() => showNotification('info', `جاري طباعة الفاتورة الضريبية ZATCA (${invoiceId}) وإشعار الإغلاق المالي.`)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Printer className="w-4 h-4" /> طباعة الفاتورة والإشعار
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDirectFastTrackSettlement(bkg)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-105 active:scale-95"
                        >
                          <Zap className="w-4 h-4 text-amber-300" />
                          <span>اعتماد الإنجاز والتسوية الفورية للمحفظة</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      ) : (
        /* ============================================================ */
        /* 3. ADVANCED 6-STAGE LIFECYCLE VIEW (المراحل الست المتقدمة)   */
        /* ============================================================ */
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className={`p-12 text-center rounded-3xl border border-dashed ${
              isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'
            }`}>
              <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h4 className="text-sm font-black text-slate-700 dark:text-slate-300">لا توجد حجوزات مطابقة لمعايير البحث والفلترة</h4>
              <p className="text-xs text-slate-500 mt-1">يمكنك تغيير معايير البحث أو اختيار "كل المراحل" لاستعراض الحجوزات.</p>
            </div>
          ) : (
            filteredBookings.map((bkg: any) => {
              const currentStageLevel = bookingStages[bkg.id] || bkg.currentStage || 1;
              const currentStageObj = STAGES.find(s => s.level === currentStageLevel) || STAGES[0];
              const isService = bkg.type === 'service' || bkg.id.startsWith('SRV');

              // 8-Pillar Task computations
              const checkedTasks = stage6ChecklistMap[bkg.id] || [];
              const checkedCount = checkedTasks.length;
              const totalTasks = STAGE_6_TASKS.length;
              const readinessPercent = Math.round((checkedCount / totalTasks) * 100);
              const isFullyReady = checkedCount === totalTasks;
              const payoutSettled = releasedPayouts[bkg.id];

              // Calculations
              const grossPrice = Number(bkg.price || 25000);
              const commissionAmount = grossPrice * providerCommissionRate;
              const vatOnCommission = commissionAmount * 0.15;
              const netPayout = grossPrice - (commissionAmount + vatOnCommission);
              const depositAmount = bkg.depositAmount || 3000;

              const invoiceId = formatInvoiceId(bkg.id);
              const revId = formatRevenueId(bkg.id);
              const expId = formatExpenseId(bkg.id);

              return (
                <motion.div
                  key={bkg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`rounded-3xl border shadow-sm hover:shadow-md transition-all p-5 sm:p-6 space-y-5 ${
                    isDark 
                      ? 'bg-slate-950/80 border-slate-800' 
                      : 'bg-white border-slate-200/90'
                  }`}
                >
                  {/* 1. Card Top Bar & Info */}
                  <div className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b ${
                    isDark ? 'border-slate-800' : 'border-slate-100'
                  }`}>
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs bg-slate-900 text-amber-400 font-black px-3 py-1 rounded-xl font-mono tracking-wide shadow-sm">
                          {bkg.id}
                        </span>
                        <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{bkg.customerName}</h4>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                          isService 
                            ? 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300' 
                            : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300'
                        }`}>
                          {isService ? '🚚 طلب خدمة مساندة' : '🏢 حجز قاعة ومنشأة'}
                        </span>
                        {payoutSettled && (
                          <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                            <Check className="w-3 h-3" /> تم الإغلاق والتسوية
                          </span>
                        )}
                      </div>

                      <div className={`flex items-center gap-3 text-xs font-medium flex-wrap ${
                        isDark ? 'text-slate-400' : 'text-slate-500'
                      }`}>
                        <span>المنشأة/الخدمة: <strong className={isDark ? 'text-slate-200' : 'text-slate-800'}>{bkg.hallName}</strong></span>
                        <span>•</span>
                        <span>موعد المناسبة: <strong className={`font-mono ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{bkg.date}</strong></span>
                        <span>•</span>
                        <span>تأمين الأضرار: <strong className="text-amber-600 dark:text-amber-400 font-mono">{depositAmount.toLocaleString()} ر.س</strong></span>
                      </div>
                    </div>

                    {/* Quick Stage Indicator & Actions */}
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                        currentStageLevel === 6
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300'
                      }`}>
                        المرحلة {currentStageLevel}: {currentStageObj.title} ({currentStageObj.percent}%)
                      </span>
                    </div>
                  </div>

                  {/* 2. Interactive 6 Stages Stepper Bar */}
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {STAGES.map((s) => {
                        const isCurrent = s.level === currentStageLevel;
                        const isPast = s.level < currentStageLevel;

                        return (
                          <button
                            key={s.level}
                            onClick={() => advanceStage(bkg.id, s.level)}
                            className={`p-3 rounded-2xl text-right transition-all border cursor-pointer relative overflow-hidden ${
                              isCurrent
                                ? isDark
                                  ? 'bg-indigo-950/80 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
                                  : 'bg-indigo-50/80 border-indigo-500 shadow-sm ring-2 ring-indigo-500/20'
                                : isPast
                                  ? isDark
                                    ? 'bg-emerald-950/40 border-emerald-800 text-slate-300 hover:border-emerald-700'
                                    : 'bg-emerald-50/50 border-emerald-200 text-slate-700 hover:border-emerald-300'
                                  : isDark
                                    ? 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-700'
                                    : 'bg-slate-50 border-slate-200/80 text-slate-400 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className={`text-[10px] font-mono font-black px-1.5 py-0.2 rounded-md ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white'
                                  : isPast
                                    ? 'bg-emerald-600 text-white'
                                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-200 text-slate-600'
                              }`}>
                                {s.level}
                              </span>
                              <span className="text-[10px] font-bold opacity-75">{s.percent}%</span>
                            </div>
                            <h5 className={`text-xs font-black leading-tight ${
                              isCurrent 
                                ? isDark ? 'text-indigo-300' : 'text-indigo-950' 
                                : isPast 
                                  ? isDark ? 'text-emerald-300' : 'text-emerald-900' 
                                  : isDark ? 'text-slate-400' : 'text-slate-600'
                            }`}>
                              {s.title}
                            </h5>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. Stage 6: The 8-Pillar Interactive Checklist Matrix */}
                  {currentStageLevel === 6 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className={`rounded-2xl p-5 border space-y-5 ${
                        isDark 
                          ? 'bg-slate-900/90 border-slate-800' 
                          : 'bg-indigo-50/40 border-indigo-100'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-indigo-200/50 dark:border-slate-800">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="p-1.5 bg-indigo-600 text-white rounded-xl">
                              <ClipboardCheck className="w-4 h-4" />
                            </span>
                            <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-indigo-950'}`}>
                              المصفوفة الثمانية للجاهزية التشغيلية والمالية (Stage 6)
                            </h4>
                          </div>
                          <p className={`text-xs mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            استيفاء البنود الثمانية إلزامي لتصفية حساب الضمان وإيداع صافي أرباح الحجز بالمحفظة.
                          </p>
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                          <div className="text-left">
                            <span className="text-xs font-black font-mono text-indigo-600 dark:text-indigo-400">
                              {checkedCount} / {totalTasks} بنود مكتملة ({readinessPercent}%)
                            </span>
                          </div>
                          <button
                            onClick={() => selectAllTasks(bkg.id)}
                            className="text-[11px] font-bold px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-all cursor-pointer shadow-xs"
                          >
                            اعتماد الكل (100%)
                          </button>
                        </div>
                      </div>

                      {/* 8 Tasks Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {STAGE_6_TASKS.map((task) => {
                          const isChecked = checkedTasks.includes(task.id);

                          return (
                            <div
                              key={task.id}
                              onClick={() => toggleTask(bkg.id, task.id)}
                              className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 select-none ${
                                isChecked
                                  ? isDark
                                    ? 'bg-emerald-950/30 border-emerald-500/50 text-white shadow-xs'
                                    : 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-xs'
                                  : isDark
                                    ? 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                              }`}
                            >
                              <div className="mt-0.5 shrink-0">
                                {isChecked ? (
                                  <div className="w-5 h-5 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                                    <Check className="w-3.5 h-3.5" />
                                  </div>
                                ) : (
                                  <div className={`w-5 h-5 rounded-lg border flex items-center justify-center ${
                                    isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-300 bg-slate-50'
                                  }`} />
                                )}
                              </div>

                              <div className="space-y-1 text-right flex-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className={`text-xs font-black ${
                                    isChecked 
                                      ? isDark ? 'text-emerald-300' : 'text-emerald-950' 
                                      : isDark ? 'text-slate-200' : 'text-slate-900'
                                  }`}>
                                    {task.title}
                                  </span>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                                    task.category === 'operational'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
                                      : task.category === 'financial'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                                        : 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                                  }`}>
                                    {task.badge}
                                  </span>
                                </div>
                                <p className={`text-[11px] leading-relaxed ${
                                  isChecked 
                                    ? isDark ? 'text-emerald-200/80' : 'text-emerald-800/80' 
                                    : isDark ? 'text-slate-400' : 'text-slate-500'
                                }`}>
                                  {task.desc}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Financial Settlement Breakdown Card */}
                      <div className={`p-4 rounded-2xl border ${
                        isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200/90'
                      }`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className={`text-xs font-black flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            <Receipt className="w-4 h-4 text-indigo-600" />
                            بيانات التسوية المالية النهائية وإصدار الفاتورة ZATCA
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {providerTierLabel}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className={`p-2.5 rounded-xl border ${
                            isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <span className="text-[10px] block font-bold text-slate-500">إجمالي الحجز (شامل)</span>
                            <span className={`text-xs font-black font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {grossPrice.toLocaleString()} ر.س
                            </span>
                            <span className="text-[8px] text-slate-400 block font-mono">شامل الضريبة 15%</span>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${
                            isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-100'
                          }`}>
                            <span className="text-[10px] block font-bold text-slate-500">عمولة المنصة ({providerCommissionRate * 100}%)</span>
                            <span className={`text-xs font-black font-mono mt-0.5 block ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              -{(commissionAmount + vatOnCommission).toLocaleString(undefined, { maximumFractionDigits: 1 })} ر.س
                            </span>
                            <span className="text-[8px] text-slate-400 block font-mono">قيد: {revId}</span>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${
                            isDark ? 'bg-white/5 border-white/5' : 'bg-amber-50/70 border-amber-100'
                          }`}>
                            <span className={`text-[10px] block font-bold ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                              استرداد التأمين المحرر
                            </span>
                            <span className={`text-xs font-black font-mono mt-0.5 block ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                              {depositAmount.toLocaleString()} ر.س
                            </span>
                            <span className={`text-[8px] block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              قيد: {expId}
                            </span>
                          </div>

                          <div className={`p-2.5 rounded-xl border ${
                            isDark 
                              ? 'bg-emerald-500/20 border-emerald-500/30' 
                              : 'bg-emerald-50 border-emerald-200'
                          }`}>
                            <span className={`text-[10px] block font-bold ${isDark ? 'text-emerald-300' : 'text-emerald-800'}`}>
                              الصافي المودع بالمحفظة
                            </span>
                            <span className={`text-sm font-black font-mono mt-0.5 block ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              {netPayout.toLocaleString(undefined, { maximumFractionDigits: 1 })} ر.س
                            </span>
                            <span className={`text-[8px] block font-mono ${isDark ? 'text-emerald-200' : 'text-emerald-600'}`}>
                              فاتورة: {invoiceId}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Action Execution Button / Status Card */}
                      <div className="pt-1">
                        {payoutSettled ? (
                          <div className={`border rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 ${
                            isDark 
                              ? 'bg-emerald-900/50 border-emerald-500/50' 
                              : 'bg-emerald-50 border-emerald-300 shadow-xs'
                          }`}>
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${
                                isDark ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-600 text-white'
                              }`}>
                                <BadgeCheck className="w-6 h-6" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className={`text-xs font-black ${isDark ? 'text-emerald-300' : 'text-emerald-900'}`}>
                                    تم الإغلاق النهائي وتصفية الأرباح بنجاح
                                  </span>
                                  <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono font-bold ${
                                    isDark ? 'bg-emerald-400/20 text-emerald-300' : 'bg-emerald-200 text-emerald-900'
                                  }`}>
                                    ZATCA Verified
                                  </span>
                                </div>
                                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                                  الفاتورة المعتمدة: <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{invoiceId}</span> • قيد الإيراد: <span className={`font-mono font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{revId}</span>
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => showNotification('info', `جاري طباعة الفاتورة الضريبية ZATCA (${invoiceId}) وكشف التسوية المحاسبي.`)}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-sm w-full sm:w-auto justify-center"
                              >
                                <Printer className="w-4 h-4" /> طباعة الفاتورة والإغلاق
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className={`flex flex-col sm:flex-row justify-between items-center gap-3 p-4 rounded-2xl border ${
                            isDark 
                              ? 'bg-white/5 border-white/10' 
                              : 'bg-white border-indigo-100 shadow-xs'
                          }`}>
                            <div className="text-right">
                              <h5 className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                جاهزية الإطلاق والتحويل المالي للمحفظة
                              </h5>
                              <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                                {isFullyReady 
                                  ? '✅ تم استيفاء كافة البنود الثمانية (100%). يمكنك الآن تحرير الضمان وإيداع صافي الأرباح.' 
                                  : `⚠️ يرجى استكمال باقي بنود الجاهزية (${checkedCount}/8) لتمكين زر تحرير الأرباح.`}
                              </p>
                            </div>

                            <button
                              onClick={() => handleReleasePayout(bkg)}
                              disabled={!isFullyReady}
                              className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm cursor-pointer ${
                                isFullyReady
                                  ? isDark
                                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 scale-105 active:scale-95 shadow-emerald-500/20'
                                    : 'bg-emerald-600 hover:bg-emerald-700 text-white scale-105 active:scale-95 shadow-emerald-600/20'
                                  : isDark
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700'
                                    : 'bg-slate-200 text-slate-400 cursor-not-allowed opacity-70 border border-slate-300'
                              }`}
                            >
                              <Wallet className="w-4 h-4" />
                              <span>اعتماد الإغلاق وتحرير الأرباح للمحفظة</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. UPGRADE / FEATURE MODAL                                  */}
      {/* ============================================================ */}
      <AnimatePresence>
        {showUpgradeModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`max-w-md w-full rounded-3xl p-6 border shadow-2xl space-y-5 relative ${
                isDark ? 'bg-slate-900 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-4 left-4 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="text-center space-y-2 pt-2">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 text-amber-500 border border-amber-500/30 flex items-center justify-center mx-auto">
                  <Lock className="w-7 h-7" />
                </div>
                <h4 className="text-lg font-black">ميزة نظام دورات الحياة المتقدمة (المراحل الست)</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  هذه الميزة مصممة للمنشآت والقاعات الكبرى لإدارة الفرق والعمليات الميدانية واللوجستية وقوائم تدقيق الجاهزية الثمانية.
                </p>
              </div>

              <div className={`p-4 rounded-2xl border space-y-2 text-xs ${
                isDark ? 'bg-slate-950 border-slate-800' : 'bg-amber-50/60 border-amber-200'
              }`}>
                <span className="font-black text-amber-800 dark:text-amber-300 block">ما تقدمه الميزة لمؤسستك:</span>
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 list-disc pr-4">
                  <li>تتبع الحجز عبر 6 مراحل تشغيلية مترابطة.</li>
                  <li>مصفوفة بنود الجاهزية الثمانية (المسار الميداني، المالي، والتقييم).</li>
                  <li>ربط الطواقم والمهام اللوجستية وإخلاء الطرف.</li>
                  <li>مشمولة في <strong>باقة الأعمال</strong> و<strong>الباقة الاحترافية Pro</strong> أو كقدرة إضافية مستقلة.</li>
                </ul>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowUpgradeModal(false);
                    if (onNavigateToSubscriptions) {
                      onNavigateToSubscriptions();
                    } else {
                      showNotification('info', 'يمكنك الانتقال إلى تبويب "باقات الاشتراك" للترقية أو شراء الميزة.');
                    }
                  }}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ترقية الباقة أو شراء الميزة</span>
                </button>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className={`px-4 py-3 rounded-xl text-xs font-bold border ${
                    isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600'
                  }`}
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
