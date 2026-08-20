import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, Clock, FileText, ChevronRight, ShieldCheck, 
  Sparkles, AlertCircle, ArrowRight, Printer, RefreshCw, Send,
  UserCheck, Calendar, DollarSign, Lock, Download, Award,
  CheckSquare, Square, ClipboardCheck, Star, BadgeCheck,
  Building2, Truck, MessageSquareOff, Receipt, Wallet,
  FileCheck, ShieldAlert, Check, ChevronDown, Eye
} from 'lucide-react';
import { useApp } from '../../../context/AppContext';
import { useTheme } from '../../../context/ThemeContext';

interface SmartBookingLifecycleManagerProps {
  myBookings: any[];
  onUpdateBookingStage?: (bookingId: string, newStage: number) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  currentProviderName: string;
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
  currentProviderName
}) => {
  const { providers } = useApp();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

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

  // Subscription Tier & Commission Rate (Rule #8)
  const providerCommissionRate = useMemo(() => {
    const tier = currentProviderObj?.subscriptionTier || currentProviderObj?.tier || 'advanced';
    if (tier === 'basic') return 0.15; // 15%
    if (tier === 'pro' || tier === 'professional') return 0.05; // 5%
    return 0.07; // 7% for Advanced (النموذج المتقدم)
  }, [currentProviderObj]);

  const providerTierLabel = useMemo(() => {
    const tier = currentProviderObj?.subscriptionTier || currentProviderObj?.tier || 'advanced';
    if (tier === 'basic') return 'الباقة الأساسية (عمولة 15%)';
    if (tier === 'pro' || tier === 'professional') return 'الباقة الاحترافية Pro (عمولة 5%)';
    return 'الباقة المتقدمة (عمولة 7%)';
  }, [currentProviderObj]);

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
    // Default initial state: first 4 tasks checked if already at stage 6
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
    const bkg = activeBookings.find((b: any) => b.id === bookingId);
    
    if (targetLevel === 6) {
      showNotification('info', `انتقل الحجز (${bookingId}) إلى المرحلة 6: جاهزية الإغلاق والمصفوفة الثمانية.`);
    } else {
      showNotification('info', `تم تحديث الحجز (${bookingId}) إلى المرحلة ${targetLevel}: ${stageObj?.title}`);
    }
  };

  // Final Release Action (Escrow Release & Wallet Payout)
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
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6" dir="rtl">
      
      {/* Top Header & Search/Filter Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-wider">Stage 6 Settlement & Operational Engine</span>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full font-bold">
              المصفوفة الثمانية التفاعلية ({filteredBookings.length} حجز)
            </span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">مدير دورة حياة الحجز ومسار الجاهزية والتسوية</h3>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            تتبع مستقل للحجوزات ومصفوفة بنود الجاهزية الثمانية (3 مسارات تكاملية) لإغلاق الحجز وتصفية الأرباح
          </p>
        </div>

        {/* Filter & Search Bar */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث برقم الحجز، القاعة، أو العميل..."
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full sm:w-60"
          />

          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            <option value="all">كل المراحل (1 - 6)</option>
            {STAGES.map(s => (
              <option key={s.level} value={s.level}>مرحلة {s.level}: {s.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sequential Independent Booking Cards Stack */}
      {filteredBookings.length === 0 ? (
        <div className="p-12 text-center bg-slate-50 rounded-3xl border border-dashed border-slate-200">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h4 className="text-sm font-black text-slate-700">لا توجد حجوزات مطابقة لمعايير البحث والفلترة</h4>
          <p className="text-xs text-slate-500 mt-1">يمكنك تغيير معايير البحث أو اختيار "كل المراحل" لاستعراض الحجوزات.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredBookings.map((bkg: any) => {
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
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all p-5 sm:p-6 space-y-5"
              >
                {/* 1. Card Top Bar & Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs bg-slate-900 text-amber-400 font-black px-3 py-1 rounded-xl font-mono tracking-wide shadow-sm">
                        {bkg.id}
                      </span>
                      <h4 className="text-base font-black text-slate-900">{bkg.customerName}</h4>
                      <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${
                        isService 
                          ? 'bg-purple-50 text-purple-700 border-purple-200' 
                          : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      }`}>
                        {isService ? '🚚 طلب خدمة مساندة' : '🏢 حجز قاعة ومنشأة'}
                      </span>
                      {payoutSettled && (
                        <span className="text-[10px] bg-emerald-500 text-white font-black px-2.5 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                          <Check className="w-3 h-3" /> تم الإغلاق والتسوية
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500 font-medium flex-wrap">
                      <span>المنشأة/الخدمة: <strong className="text-slate-800">{bkg.hallName}</strong></span>
                      <span>•</span>
                      <span>موعد المناسبة: <strong className="text-slate-800 font-mono">{bkg.date}</strong></span>
                      <span>•</span>
                      <span>تأمين الأضرار: <strong className="text-amber-700 font-mono">{depositAmount.toLocaleString()} ر.س</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 font-bold block">إجمالي الحجز:</span>
                      <span className="text-base font-black text-emerald-600 font-mono">
                        {grossPrice.toLocaleString()} ر.س
                      </span>
                    </div>

                    <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-center border border-slate-200/80">
                      <span className="text-[9px] text-slate-500 block font-bold">نسبة التقدم</span>
                      <span className="text-sm font-black text-indigo-600 font-mono">
                        {currentStageObj.percent}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Horizontal Linear 6-Stage Stepper Line */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 flex items-center gap-2">
                      <span>مسار الجاهزية والتنفيذ:</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                        مرحلة {currentStageLevel} من 6: {currentStageObj.title}
                      </span>
                    </span>

                    {currentStageLevel < 6 && (
                      <button
                        onClick={() => advanceStage(bkg.id, Math.min(currentStageLevel + 1, 6))}
                        className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black rounded-xl transition-all flex items-center gap-1.5 shadow-sm cursor-pointer active:scale-95"
                      >
                        <span>ترقية للمرحلة التالية</span>
                        <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                      </button>
                    )}
                  </div>

                  {/* Connecting Line & Interactive Nodes */}
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 overflow-x-auto scrollbar-thin">
                    <div className="min-w-[820px] relative">
                      
                      {/* Background Progress Track */}
                      <div className="absolute top-5 right-8 left-8 h-1 bg-slate-200 rounded-full z-0">
                        <div 
                          className="h-full bg-gradient-to-l from-indigo-600 via-indigo-500 to-emerald-500 rounded-full transition-all duration-500"
                          style={{ width: `${((currentStageLevel - 1) / 5) * 100}%` }}
                        />
                      </div>

                      {/* Step Nodes */}
                      <div className="grid grid-cols-6 gap-2 relative z-10">
                        {STAGES.map((st) => {
                          const isDone = st.level < currentStageLevel;
                          const isCurrent = st.level === currentStageLevel;

                          return (
                            <div
                              key={st.level}
                              onClick={() => advanceStage(bkg.id, st.level)}
                              className={`flex flex-col items-center text-center p-2.5 rounded-xl transition-all cursor-pointer group ${
                                isCurrent
                                  ? 'bg-white border-2 border-indigo-600 shadow-md scale-105'
                                  : isDone
                                  ? 'bg-emerald-50/70 border border-emerald-200 hover:bg-emerald-100/60'
                                  : 'bg-white/80 border border-slate-200 opacity-60 hover:opacity-100'
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all mb-1.5 shadow-sm ${
                                isCurrent
                                  ? 'bg-indigo-600 text-white ring-4 ring-indigo-200 animate-pulse'
                                  : isDone
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {isDone ? (
                                  <CheckCircle2 className="w-4 h-4 text-white" />
                                ) : (
                                  <span>{st.level}</span>
                                )}
                              </div>

                              <span className={`text-[11px] font-black leading-tight ${
                                isCurrent ? 'text-indigo-950' : isDone ? 'text-emerald-950' : 'text-slate-800'
                              }`}>
                                {st.title}
                              </span>

                              <span className={`text-[9px] font-mono font-bold mt-1 px-1.5 py-0.2 rounded-full ${
                                isCurrent ? 'bg-indigo-100 text-indigo-700' : isDone ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {st.percent}%
                              </span>

                              <p className="text-[10px] text-slate-500 font-medium mt-1 leading-snug line-clamp-2">
                                {st.desc}
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. Stage 6: The 8-Pillar Operational & Settlement Engine */}
                {currentStageLevel === 6 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-3xl p-5 sm:p-6 space-y-5 border shadow-lg transition-colors ${
                      isDark
                        ? 'bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-500/30 shadow-indigo-950/40'
                        : 'bg-gradient-to-b from-slate-50 via-indigo-50/50 to-slate-50 text-slate-900 border-indigo-200/80 shadow-indigo-100/50'
                    }`}
                  >
                    {/* Top Engine Banner */}
                    <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b ${
                      isDark ? 'border-white/10' : 'border-indigo-100'
                    }`}>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`p-1.5 rounded-xl font-bold ${
                            isDark ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-600 text-white shadow-xs'
                          }`}>
                            <Sparkles className="w-4 h-4" />
                          </span>
                          <span className={`text-xs font-black uppercase tracking-wide ${
                            isDark ? 'text-emerald-400' : 'text-emerald-700'
                          }`}>
                            المرحلة 6: مصفوفة الجاهزية التشغيلية والتسوية المالية (8 البنود)
                          </span>
                          <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-bold ${
                            isDark 
                              ? 'bg-white/10 border-white/20 text-indigo-200' 
                              : 'bg-indigo-100/80 border-indigo-200 text-indigo-800'
                          }`}>
                            {providerTierLabel}
                          </span>
                        </div>
                        <h4 className={`text-base font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          محرك فحص الجاهزية، فك الضمان، والفوترة الإلكترونية للحجز ({bkg.id})
                        </h4>
                      </div>

                      {/* Readiness Meter */}
                      <div className={`flex items-center gap-3 px-4 py-2 rounded-2xl border ${
                        isDark 
                          ? 'bg-white/10 border-white/15' 
                          : 'bg-white border-indigo-100 shadow-xs'
                      }`}>
                        <div className="text-right">
                          <span className={`text-[10px] block font-bold ${isDark ? 'text-indigo-200' : 'text-slate-500'}`}>
                            مؤشر الجاهزية الثماني
                          </span>
                          <span className={`text-xs font-bold font-mono ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {checkedCount} من {totalTasks} بنود مكتملة
                          </span>
                        </div>
                        <div className={`w-12 h-12 rounded-full border-2 flex items-center justify-center font-black text-sm font-mono ${
                          isDark 
                            ? 'border-emerald-400 text-emerald-300 bg-emerald-950/40' 
                            : 'border-emerald-500 text-emerald-700 bg-emerald-50'
                        }`}>
                          {readinessPercent}%
                        </div>
                      </div>
                    </div>

                    {/* Checklist Header & Quick Action */}
                    <div className={`p-3 rounded-2xl border space-y-2.5 ${
                      isDark 
                        ? 'bg-black/20 border-white/10' 
                        : 'bg-indigo-100/40 border-indigo-100'
                    }`}>
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <ClipboardCheck className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className={`text-xs font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            مصفوفة بنود الجاهزية الثمانية (الميداني، المالي، والأرشفة):
                          </span>
                          <span className={`text-[10px] border px-2 py-0.5 rounded-full font-bold ${
                            isDark 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                            {checkedCount} / {totalTasks} مكتملة ({readinessPercent}%)
                          </span>
                        </div>

                        <button
                          onClick={() => selectAllTasks(bkg.id)}
                          className={`text-xs px-3 py-1.5 rounded-xl transition-all font-bold cursor-pointer flex items-center gap-1.5 ${
                            isDark 
                              ? 'bg-white/10 hover:bg-white/20 text-indigo-200 hover:text-white border border-white/10' 
                              : 'bg-white hover:bg-slate-50 text-indigo-700 hover:text-indigo-900 border border-indigo-200 shadow-2xs'
                          }`}
                        >
                          <CheckCircle2 className={`w-3.5 h-3.5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          تحديد الكل كمكتمل (Fast Pass)
                        </button>
                      </div>

                      {/* Animated Progress Bar for 8-Pillar Selection */}
                      <div className="space-y-1">
                        <div className={`w-full h-2 rounded-full overflow-hidden border ${
                          isDark ? 'bg-slate-900/80 border-white/10' : 'bg-white/80 border-indigo-200/60 shadow-inner'
                        }`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${readinessPercent}%` }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className={`h-full rounded-full ${
                              readinessPercent === 100
                                ? isDark ? 'bg-emerald-400' : 'bg-emerald-500'
                                : readinessPercent >= 50
                                  ? isDark ? 'bg-indigo-400' : 'bg-indigo-600'
                                  : isDark ? 'bg-amber-400' : 'bg-amber-500'
                            }`}
                          />
                        </div>
                        <div className="flex justify-between items-center text-[10px] font-bold">
                          <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>
                            {checkedCount === totalTasks 
                              ? 'تم استيفاء كافة المتطلبات الميدانية والمالية والأرشفة بنجاح' 
                              : `متبقي ${totalTasks - checkedCount} بنود لاعتماد الإغلاق المحاسبي النهائي`}
                          </span>
                          <span className={`font-mono ${
                            readinessPercent === 100 
                              ? isDark ? 'text-emerald-300' : 'text-emerald-700' 
                              : isDark ? 'text-indigo-300' : 'text-indigo-700'
                          }`}>
                            {readinessPercent}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Interactive 8-Pillar Task Grid (All 8 items together) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {STAGE_6_TASKS.map((task) => {
                        const isChecked = checkedTasks.includes(task.id);

                        return (
                          <div
                            key={task.id}
                            onClick={() => toggleTask(bkg.id, task.id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none flex items-start gap-3 ${
                              isDark
                                ? isChecked
                                  ? 'bg-emerald-950/40 border-emerald-500/50 text-white shadow-xs'
                                  : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/25 hover:bg-white/10'
                                : isChecked
                                  ? 'bg-emerald-50/90 border-emerald-300 text-slate-900 shadow-xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/20 shadow-2xs'
                            }`}
                          >
                            <div className="mt-1 shrink-0">
                              {isChecked ? (
                                <div className={`w-5 h-5 rounded-lg flex items-center justify-center font-bold shadow-sm ${
                                  isDark ? 'bg-emerald-500 text-slate-950' : 'bg-emerald-600 text-white'
                                }`}>
                                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                                </div>
                              ) : (
                                <div className={`w-5 h-5 rounded-lg border-2 ${
                                  isDark ? 'border-slate-400/60 bg-white/5' : 'border-slate-300 bg-slate-50'
                                }`} />
                              )}
                            </div>

                            <div className="flex-1 space-y-1">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className={`text-xs font-black ${
                                  isDark 
                                    ? isChecked ? 'text-emerald-300' : 'text-white'
                                    : isChecked ? 'text-emerald-900' : 'text-slate-900'
                                }`}>
                                  {task.title}
                                </h5>
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                  task.category === 'operational' 
                                    ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' : 'bg-blue-50 text-blue-700 border-blue-200' :
                                  task.category === 'financial' 
                                    ? isDark ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                  isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
                                }`}>
                                  {task.badge}
                                </span>
                              </div>
                              <p className={`text-[11px] leading-relaxed font-normal ${
                                isDark ? 'text-slate-300/80' : 'text-slate-600'
                              }`}>
                                {task.desc}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Financial Accounting Breakdown & Codes */}
                    <div className={`rounded-2xl p-4 border space-y-3 ${
                      isDark 
                        ? 'bg-black/40 border-white/10' 
                        : 'bg-white border-indigo-100 shadow-xs'
                    }`}>
                      <div className={`flex items-center justify-between border-b pb-2.5 ${
                        isDark ? 'border-white/10' : 'border-slate-100'
                      }`}>
                        <span className={`text-xs font-black flex items-center gap-1.5 ${
                          isDark ? 'text-amber-400' : 'text-amber-700'
                        }`}>
                          <Receipt className="w-4 h-4" /> القيود المحاسبية والتسوية المالية السيادية:
                        </span>
                        <span className={`text-[10px] font-mono font-bold ${
                          isDark ? 'text-indigo-300' : 'text-indigo-700'
                        }`}>
                          عمولة المنصة: {(providerCommissionRate * 100).toFixed(0)}% + VAT 15%
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                        <div className={`p-2.5 rounded-xl border ${
                          isDark ? 'bg-white/5 border-white/5' : 'bg-slate-50 border-slate-200/70'
                        }`}>
                          <span className={`text-[10px] block font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            قيمة الحجز الإجمالي
                          </span>
                          <span className={`text-xs font-black font-mono mt-0.5 block ${isDark ? 'text-white' : 'text-slate-900'}`}>
                            {grossPrice.toLocaleString()} ر.س
                          </span>
                        </div>

                        <div className={`p-2.5 rounded-xl border ${
                          isDark ? 'bg-white/5 border-white/5' : 'bg-rose-50/70 border-rose-100'
                        }`}>
                          <span className={`text-[10px] block font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
                            عمولة المنصة والضريبة
                          </span>
                          <span className={`text-xs font-black font-mono mt-0.5 block ${isDark ? 'text-rose-400' : 'text-rose-700'}`}>
                            -{(commissionAmount + vatOnCommission).toLocaleString()} ر.س
                          </span>
                          <span className={`text-[8px] block font-mono ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            قيد: {revId}
                          </span>
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
                            {netPayout.toLocaleString()} ر.س
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
          })}
        </div>
      )}
    </div>
  );
};

