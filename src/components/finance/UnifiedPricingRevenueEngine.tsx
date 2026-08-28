import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Zap, Sparkles, Percent, Calendar, 
  Check, Plus, Sliders, AlertCircle, ArrowUpRight, Tag, ShieldAlert, 
  Lock, Info, CheckCircle2, RefreshCw, Calculator, Building2, 
  Layers, ChevronRight, ShieldCheck, Flame, Moon, Sun, Clock,
  SlidersHorizontal, DollarSign, Award, ArrowRight
} from 'lucide-react';

interface UnifiedPricingRevenueEngineProps {
  halls?: any[];
  services?: any[];
  providerSubscription?: any;
  userRole?: 'admin' | 'provider' | string;
  currentProviderName?: string;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onUpdateHall?: (hallId: string | number, updatedFields: any) => void;
}

export const UnifiedPricingRevenueEngine: React.FC<UnifiedPricingRevenueEngineProps> = ({
  halls = [],
  services = [],
  providerSubscription,
  userRole = 'provider',
  currentProviderName = '',
  showNotification,
  onUpdateHall
}) => {
  const isAdmin = userRole === 'admin';

  // 1. Sovereign Settings from Admin (Synchronized via LocalStorage & Events)
  const [isSovereignFreeze, setIsSovereignFreeze] = useState<boolean>(() => {
    return typeof window !== 'undefined' && localStorage.getItem('SOVEREIGN_SURGE_FREEZE_ACTIVE') === 'true';
  });
  const [sovereignFreezeReason, setSovereignFreezeReason] = useState<string>(() => {
    return (typeof window !== 'undefined' && localStorage.getItem('SOVEREIGN_SURGE_FREEZE_REASON')) || 'مناسبة وطنية رسمية';
  });
  const [sovereignMaxSurgeCap, setSovereignMaxSurgeCap] = useState<number>(() => {
    const val = typeof window !== 'undefined' ? localStorage.getItem('SOVEREIGN_MAX_SURGE_CAP') : null;
    return val ? parseInt(val) || 40 : 40;
  });
  const [sovereignOccupancyThreshold, setSovereignOccupancyThreshold] = useState<number>(() => {
    const val = typeof window !== 'undefined' ? localStorage.getItem('SOVEREIGN_OCCUPANCY_THRESHOLD') : null;
    return val ? parseInt(val) || 80 : 80;
  });

  // Listen for admin sovereign controls updates
  useEffect(() => {
    const handleSync = () => {
      setIsSovereignFreeze(localStorage.getItem('SOVEREIGN_SURGE_FREEZE_ACTIVE') === 'true');
      setSovereignFreezeReason(localStorage.getItem('SOVEREIGN_SURGE_FREEZE_REASON') || 'مناسبة وطنية رسمية');
      setSovereignMaxSurgeCap(parseInt(localStorage.getItem('SOVEREIGN_MAX_SURGE_CAP') || '40') || 40);
      setSovereignOccupancyThreshold(parseInt(localStorage.getItem('SOVEREIGN_OCCUPANCY_THRESHOLD') || '80') || 80);
    };

    window.addEventListener('storage', handleSync);
    window.addEventListener('sovereignControlsUpdated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('sovereignControlsUpdated', handleSync);
    };
  }, []);

  // 2. Independent Feature Entitlements Check
  const hasWeekendPricing = useMemo(() => {
    if (isAdmin) return true;
    if (!providerSubscription) return true; // fallback
    return !!(
      providerSubscription.includesWeekendPricing ||
      providerSubscription.includesDynamicPricing ||
      providerSubscription.addons?.includes('weekend_pricing') ||
      providerSubscription.addons?.includes('dynamic_pricing') ||
      providerSubscription.id === 'pro' ||
      providerSubscription.id === 'business'
    );
  }, [isAdmin, providerSubscription]);

  const hasDynamicSurge = useMemo(() => {
    if (isAdmin) return true;
    if (!providerSubscription) return true; // fallback
    return !!(
      providerSubscription.includesDynamicSurgePricing ||
      providerSubscription.includesDynamicPricing ||
      providerSubscription.addons?.includes('dynamic_surge_pricing') ||
      providerSubscription.addons?.includes('dynamic_pricing') ||
      providerSubscription.id === 'pro'
    );
  }, [isAdmin, providerSubscription]);

  // 3. Navigation Tabs
  const [activeTab, setActiveTab] = useState<'weekend' | 'surge' | 'simulator' | 'sovereign'>(() => {
    if (isAdmin) return 'weekend';
    if (hasWeekendPricing) return 'weekend';
    if (hasDynamicSurge) return 'surge';
    return 'simulator';
  });

  // Filter provider halls strictly if provider
  const myHalls = useMemo(() => {
    if (isAdmin || !currentProviderName) return halls;
    return halls.filter(h => h.provider === currentProviderName || h.providerName === currentProviderName || !h.provider);
  }, [halls, isAdmin, currentProviderName]);

  // 4. Weekend Pricing Engine State
  const [weekendMarginType, setWeekendMarginType] = useState<'percentage' | 'fixed'>('percentage');
  const [weekendMorningMargin, setWeekendMorningMargin] = useState<number>(15);
  const [weekendNightMargin, setWeekendNightMargin] = useState<number>(20);
  const [weekendFullDayMargin, setWeekendFullDayMargin] = useState<number>(25);
  const [selectedWeekendDays, setSelectedWeekendDays] = useState<string[]>(['thursday', 'friday', 'saturday']);
  const [selectedHallForWeekend, setSelectedHallForWeekend] = useState<string>('all');

  // 5. Dynamic Surge Rules State
  const [activeSurgeRules, setActiveSurgeRules] = useState<Record<string, boolean>>({
    occupancy_surge: true,
    wedding_season: true,
    national_holidays: false,
    early_bird: false
  });

  const [customSurgeRules, setCustomSurgeRules] = useState<any[]>([
    { id: 'rule-1', name: 'ذروة عطلات الأعياد والمواسم الكبرى', multiplier: '+35%', applyTo: 'جميع القاعات', active: true, trigger: 'موسمي' },
    { id: 'rule-2', name: 'عتبة الإشغال المرتفع (>80%)', multiplier: `+20%`, applyTo: 'جميع القاعات والخدمات', active: true, trigger: 'إشغال تلقائي' }
  ]);

  const [showAddSurgeModal, setShowAddSurgeModal] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleVal, setNewRuleVal] = useState('+20%');

  // 6. Interactive Pricing & Revenue Simulator State
  const [simSelectedHallId, setSimSelectedHallId] = useState<string>(() => myHalls[0]?.id?.toString() || 'default');
  const [simPeriod, setSimPeriod] = useState<'morning' | 'night' | 'fullDay'>('night');
  const [simIsWeekend, setSimIsWeekend] = useState<boolean>(true);
  const [simOccupancyRate, setSimOccupancyRate] = useState<number>(85);

  const selectedHallObj = useMemo(() => {
    return myHalls.find(h => h.id?.toString() === simSelectedHallId) || myHalls[0] || {
      name: 'قاعة تجريبية نموذجية',
      nightPrice: 15000,
      morningPrice: 8000,
      fullDayPrice: 20000
    };
  }, [myHalls, simSelectedHallId]);

  // Simulation Calculations (Strict 15% VAT-Inclusive Rule)
  const simulationResults = useMemo(() => {
    let base = 0;
    if (simPeriod === 'morning') base = selectedHallObj.morningPrice || 8000;
    else if (simPeriod === 'night') base = selectedHallObj.nightPrice || 15000;
    else base = selectedHallObj.fullDayPrice || 20000;

    let weekendAdd = 0;
    if (simIsWeekend && hasWeekendPricing) {
      if (weekendMarginType === 'percentage') {
        const pct = simPeriod === 'morning' ? weekendMorningMargin : simPeriod === 'night' ? weekendNightMargin : weekendFullDayMargin;
        weekendAdd = base * (pct / 100);
      } else {
        weekendAdd = simPeriod === 'morning' ? weekendMorningMargin : simPeriod === 'night' ? weekendNightMargin : weekendFullDayMargin;
      }
    }

    let surgeMultiplierPct = 0;
    if (!isSovereignFreeze && hasDynamicSurge && simOccupancyRate >= sovereignOccupancyThreshold) {
      // Dynamic increase capped at sovereignMaxSurgeCap
      const rawIncrease = Math.min((simOccupancyRate - sovereignOccupancyThreshold + 10) * 1.5, sovereignMaxSurgeCap);
      surgeMultiplierPct = Math.min(rawIncrease, sovereignMaxSurgeCap);
    }

    const priceAfterWeekend = base + weekendAdd;
    const surgeAmount = priceAfterWeekend * (surgeMultiplierPct / 100);
    const finalGrossPrice = Math.round(priceAfterWeekend + surgeAmount);

    // 15% VAT extraction
    const taxableAmount = Math.round((finalGrossPrice / 1.15) * 100) / 100;
    const vatAmount = Math.round((finalGrossPrice - taxableAmount) * 100) / 100;

    // Commission (e.g. 10% or from subscription tier)
    const commRate = providerSubscription?.commissionRate || 10;
    const platformCommission = Math.round(taxableAmount * (commRate / 100) * 100) / 100;
    const netProvider = Math.round((taxableAmount - platformCommission) * 100) / 100;

    return {
      base,
      weekendAdd,
      surgeMultiplierPct,
      surgeAmount,
      finalGrossPrice,
      taxableAmount,
      vatAmount,
      commRate,
      platformCommission,
      netProvider
    };
  }, [
    selectedHallObj,
    simPeriod,
    simIsWeekend,
    simOccupancyRate,
    hasWeekendPricing,
    hasDynamicSurge,
    weekendMarginType,
    weekendMorningMargin,
    weekendNightMargin,
    weekendFullDayMargin,
    isSovereignFreeze,
    sovereignOccupancyThreshold,
    sovereignMaxSurgeCap,
    providerSubscription
  ]);

  // Weekend Quick-Apply Handler
  const handleApplyWeekendPricing = () => {
    if (!hasWeekendPricing) {
      showNotification('warning', '⚠️ ميزة تسعير الويكند غير مفعلة في باقتك الحالية. يمكنك ترقية الباقة أو شراؤها كميزة إضافية.');
      return;
    }

    const payload = {
      weekendMultiplierType: weekendMarginType,
      weekend_morning_margin: weekendMorningMargin,
      weekend_night_margin: weekendNightMargin,
      weekend_fullday_margin: weekendFullDayMargin,
      weekendDays: selectedWeekendDays,
      weekendEnabled: true
    };

    if (onUpdateHall) {
      if (selectedHallForWeekend === 'all') {
        myHalls.forEach(h => onUpdateHall(h.id, payload));
      } else {
        onUpdateHall(selectedHallForWeekend, payload);
      }
    }

    // Persist settings locally
    localStorage.setItem(`WEEKEND_PRICING_CONFIG_${currentProviderName || 'DEFAULT'}`, JSON.stringify(payload));
    showNotification('success', `✨ تم حفظ وتطبيق هوامش تسعير عطلة نهاية الأسبوع بنجاح على الحجوزات والطلبات الجديدة.`);
  };

  // Toggle Dynamic Surge Rule
  const toggleSurgeRule = (ruleKey: string, ruleName: string) => {
    if (isSovereignFreeze) {
      showNotification('warning', `⚠️ لا يمكن تعديل قواعد التسعير: محركات الذروة مجمدة سيادياً [السبب: ${sovereignFreezeReason}].`);
      return;
    }
    if (!hasDynamicSurge) {
      showNotification('warning', '⚠️ محرك التسعير الديناميكي غير مفعل في باقتك. يرجى الترقية للباقة الاحترافية أو شراء المحرك.');
      return;
    }

    setActiveSurgeRules(prev => {
      const nextVal = !prev[ruleKey];
      showNotification(
        nextVal ? 'success' : 'info',
        nextVal ? `تم تفعيل قاعدة الذروة: (${ruleName}) بنجاح.` : `تم تعليق قاعدة الذروة: (${ruleName}).`
      );
      return { ...prev, [ruleKey]: nextVal };
    });
  };

  // Create New Dynamic Surge Rule
  const handleCreateSurgeRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    if (isSovereignFreeze) {
      showNotification('error', `⛔ لا يمكن إنشاء قواعد جديدة: محركات الذروة مجمدة سيادياً.`);
      setShowAddSurgeModal(false);
      return;
    }

    const numVal = parseInt(newRuleVal.replace(/[^0-9]/g, '')) || 0;
    const isIncrease = newRuleVal.includes('+');
    let finalVal = newRuleVal;

    if (isIncrease && numVal > sovereignMaxSurgeCap) {
      finalVal = `+${sovereignMaxSurgeCap}%`;
      showNotification('warning', `⚠️ تم ضبط نسبة الزيادة تلقائياً للسقف السيادي الأعلى (+${sovereignMaxSurgeCap}%).`);
    }

    const newRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      multiplier: finalVal,
      applyTo: 'جميع القاعات والخدمات (الطلبات الجديدة فقط)',
      active: true,
      trigger: 'مخصص'
    };

    setCustomSurgeRules(prev => [...prev, newRule]);
    setNewRuleName('');
    setShowAddSurgeModal(false);
    showNotification('success', `تمت إضافة قاعدة الذروة الجديدة (${newRuleName} بنسبة ${finalVal}) وتطبيقها على الحجوزات والطلبات الجديدة.`);
  };

  // Admin Sovereign Updates
  const handleSaveSovereignSettings = (newThreshold: number, newCap: number, freezeActive: boolean, reason: string) => {
    localStorage.setItem('SOVEREIGN_OCCUPANCY_THRESHOLD', newThreshold.toString());
    localStorage.setItem('SOVEREIGN_MAX_SURGE_CAP', newCap.toString());
    localStorage.setItem('SOVEREIGN_SURGE_FREEZE_ACTIVE', freezeActive ? 'true' : 'false');
    localStorage.setItem('SOVEREIGN_SURGE_FREEZE_REASON', reason);

    setSovereignOccupancyThreshold(newThreshold);
    setSovereignMaxSurgeCap(newCap);
    setIsSovereignFreeze(freezeActive);
    setSovereignFreezeReason(reason);

    window.dispatchEvent(new Event('sovereignControlsUpdated'));
    showNotification('success', '🏛️ تم حفظ ونشر المعاملات والضوابط السيادية للتسعير على كامل المنصة بنجاح.');
  };

  return (
    <div className="space-y-6 dir-rtl text-right" dir="rtl">
      
      {/* 1. Sovereign Kill-Switch Banner if Active */}
      {isSovereignFreeze && (
        <div className="bg-rose-50 border-2 border-rose-300 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-950 animate-in fade-in shadow-sm">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-extrabold text-sm sm:text-base text-rose-900 flex items-center gap-2">
                تنبيه سيادي: محركات التسعير الديناميكي وزيادة الذروة مجمدة مؤقتاً
              </h4>
              <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                تم تجميد محركات الذروة بتوجيه سيادي من إدارة المنصة <strong>[السبب: {sovereignFreezeReason}]</strong> وفق المادة 4 من الشروط والأحكام. تطبق الأسعار الأساسية المعتمدة لحين رفع التجميد.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-black bg-rose-200 text-rose-900 px-3 py-1.5 rounded-xl self-start sm:self-center shrink-0">
            المادة 4: رقابة سيادية
          </span>
        </div>
      )}

      {/* 2. Main Suite Header Card */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"></div>
        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          
          <div>
            <div className="flex items-center gap-2 flex-wrap mb-2">
              <span className="p-1.5 bg-amber-400 text-slate-950 rounded-xl font-bold flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">
                Unified Revenue & Dynamic Pricing Management Suite
              </span>
              <span className="text-[10px] bg-white/10 text-slate-200 px-2.5 py-0.5 rounded-full font-bold backdrop-blur-sm border border-white/10">
                المركز المالي الشامل
              </span>
            </div>
            
            <h2 className="text-xl md:text-2xl font-black text-white">
              محرك إدارة التسعير والإيرادات الموحد
            </h2>
            <p className="text-xs text-slate-300 mt-1.5 max-w-2xl leading-relaxed">
              منظومة ذكية موحدة تدمج تسعير عطلة نهاية الأسبوع (الويكند) مع محرك زيادة الذروة ومحاكي الإيرادات مع الالتزام الصارم بثبات الحجوزات السابقة المعتمدة.
            </p>
          </div>

          {/* Quick Entitlement Badges */}
          <div className="flex flex-wrap gap-2 self-stretch lg:self-center">
            <div className={`px-3 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
              hasWeekendPricing 
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}>
              <Calendar className="w-4 h-4 text-emerald-400" />
              <span>تسعير الويكند: {hasWeekendPricing ? 'مفعل ✓' : 'غير مشمول'}</span>
            </div>

            <div className={`px-3 py-2 rounded-2xl border flex items-center gap-2 text-xs font-bold ${
              hasDynamicSurge 
                ? 'bg-indigo-950/60 border-indigo-500/40 text-indigo-300' 
                : 'bg-slate-900/80 border-slate-700 text-slate-400'
            }`}>
              <Zap className="w-4 h-4 text-amber-400" />
              <span>محرك الذروة: {hasDynamicSurge ? (isSovereignFreeze ? 'مجمد مؤقتاً ⏸️' : 'نشط ✓') : 'غير مشمول'}</span>
            </div>

            <div className="px-3 py-2 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 flex items-center gap-2 text-xs font-bold">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>عتبة الإشغال: {sovereignOccupancyThreshold}% | السقف: +{sovereignMaxSurgeCap}%</span>
            </div>
          </div>

        </div>

        {/* 3. Strict Immutability Notice Bar */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center gap-2.5 text-xs text-amber-300/90 bg-amber-950/30 px-4 py-2.5 rounded-2xl border border-amber-500/20">
          <Lock className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">
            قاعدة الأمان المالي الصارمة: أي تعديلات في الأسعار أو مضاعفات الويكند والذروة تُطبق <strong>حصرياً على الحجوزات والطلبات الجديدة أو غير المعتمدة بعد</strong>، ولا تتأثر نهائياً الحجوزات السابقة المعتمدة والمؤكدة (اللقطة المالية المثبتة).
          </span>
        </div>
      </div>

      {/* 4. Sub-Navigation Tabs */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-2 border border-slate-200">
        <button
          onClick={() => setActiveTab('weekend')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'weekend'
              ? 'bg-white text-amber-600 shadow-md scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Calendar className="w-4 h-4 text-amber-500" />
          <span>1. تسعير عطلة نهاية الأسبوع (الويكند)</span>
          {!hasWeekendPricing && <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.5 rounded-md font-bold">ترقية</span>}
        </button>

        <button
          onClick={() => setActiveTab('surge')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'surge'
              ? 'bg-white text-indigo-600 shadow-md scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Zap className="w-4 h-4 text-indigo-500" />
          <span>2. محرك التسعير الديناميكي وزيادة الذروة</span>
          {!hasDynamicSurge && <span className="bg-indigo-100 text-indigo-800 text-[10px] px-1.5 py-0.5 rounded-md font-bold">ترقية</span>}
        </button>

        <button
          onClick={() => setActiveTab('simulator')}
          className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'simulator'
              ? 'bg-white text-emerald-600 shadow-md scale-[1.01]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
          }`}
        >
          <Calculator className="w-4 h-4 text-emerald-500" />
          <span>3. محاكي وحاسبة الإيرادات التفاعلية</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('sovereign')}
            className={`flex-1 min-w-[150px] py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
              activeTab === 'sovereign'
                ? 'bg-slate-900 text-amber-400 shadow-md scale-[1.01]'
                : 'text-slate-700 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-amber-400" />
            <span>4. الرقابة السيادية ومعامل الإشغال (الإدارة)</span>
          </button>
        )}
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: WEEKEND PRICING                                                    */}
      {/* ========================================================================= */}
      {activeTab === 'weekend' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Lock Banner if not entitled */}
          {!hasWeekendPricing && (
            <div className="bg-amber-50 border-2 border-amber-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-amber-900 text-sm">
                    ميزة تسعير عطلة نهاية الأسبوع (الويكند) غير مفعلة بحسابك
                  </h4>
                  <p className="text-xs text-amber-800 mt-1">
                    يمكنك تفعيل تسعير الويكند عبر ترقية اشتراكك إلى (باقة الأعمال أو الاحترافية) أو تفعيل ميزة "تسعير الويكند" كقدرة إضافية مستقلة.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-subscription-tab', { detail: { subTab: 'upgrade' } }));
                  showNotification('info', 'جاري توجيهك لمركز ترقية الباقات والميزات الإضافية...');
                }}
                className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer shrink-0"
              >
                ترقية / شراء الميزة الآن
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  إعدادات تسعير عطلة نهاية الأسبوع (الخميس، الجمعة، السبت)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  تحديد هوامش الزيادة المخصصة لأيام نهاية الأسبوع لتطبيقها على القاعات والخدمات الجديدة.
                </p>
              </div>

              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setWeekendMarginType('percentage')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    weekendMarginType === 'percentage'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  نسبة مئوية (%)
                </button>
                <button
                  type="button"
                  onClick={() => setWeekendMarginType('fixed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    weekendMarginType === 'fixed'
                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  مبلغ إضافي مقطوع (ر.س)
                </button>
              </div>
            </div>

            {/* Weekend Days Multi-select */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                الأيام المعتمدة كعطلة نهاية الأسبوع (الويكند):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'thursday', label: 'ليالي الخميس (سهرة الويكند)' },
                  { id: 'friday', label: 'يوم وليلة الجمعة (ذروة المناسبات)' },
                  { id: 'saturday', label: 'يوم وليلة السبت (العطلة الرسمية)' }
                ].map(day => {
                  const isSelected = selectedWeekendDays.includes(day.id);
                  return (
                    <button
                      key={day.id}
                      type="button"
                      onClick={() => {
                        setSelectedWeekendDays(prev => 
                          prev.includes(day.id) 
                            ? prev.filter(d => d !== day.id) 
                            : [...prev, day.id]
                        );
                      }}
                      className={`p-3.5 rounded-2xl border text-xs font-black flex items-center justify-between transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-50/80 border-amber-400 text-amber-950 shadow-sm' 
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <span>{day.label}</span>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs ${
                        isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-200 text-transparent'
                      }`}>
                        ✓
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Margin Inputs by Period */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              
              {/* Morning Margin */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Sun className="w-4 h-4 text-amber-500" />
                  <span>الفترة الصباحية</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={weekendMorningMargin}
                    onChange={e => setWeekendMorningMargin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-black text-sm"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold">
                    {weekendMarginType === 'percentage' ? '%' : 'ر.س'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {weekendMarginType === 'percentage' ? 'تضاف نسبة % فوق السعر الصباحي' : 'يضاف مبلغ ثابت فوق السعر الصباحي'}
                </p>
              </div>

              {/* Night Margin */}
              <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-900">
                  <Moon className="w-4 h-4 text-amber-600" />
                  <span>الفترة المسائية (الأعلى طلباً)</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={weekendNightMargin}
                    onChange={e => setWeekendNightMargin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-3 rounded-xl border border-amber-300 focus:border-amber-500 outline-none text-left font-black text-sm bg-white"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-amber-600 font-bold">
                    {weekendMarginType === 'percentage' ? '%' : 'ر.س'}
                  </span>
                </div>
                <p className="text-[11px] text-amber-700">
                  {weekendMarginType === 'percentage' ? 'تضاف نسبة % فوق السعر المسائي' : 'يضاف مبلغ ثابت فوق السعر المسائي'}
                </p>
              </div>

              {/* Full Day Margin */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Clock className="w-4 h-4 text-indigo-500" />
                  <span>اليوم الكامل</span>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    value={weekendFullDayMargin}
                    onChange={e => setWeekendFullDayMargin(Math.max(0, parseInt(e.target.value) || 0))}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-black text-sm"
                  />
                  <span className="absolute left-3 top-3.5 text-xs text-slate-400 font-bold">
                    {weekendMarginType === 'percentage' ? '%' : 'ر.س'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  {weekendMarginType === 'percentage' ? 'تضاف نسبة % فوق سعر اليوم الكامل' : 'يضاف مبلغ ثابت فوق سعر اليوم الكامل'}
                </p>
              </div>

            </div>

            {/* Target Halls & Apply Action */}
            <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold text-slate-700 shrink-0">تطبيق على:</label>
                <select
                  value={selectedHallForWeekend}
                  onChange={e => setSelectedHallForWeekend(e.target.value)}
                  className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-amber-500"
                >
                  <option value="all">🌟 جميع القاعات التابعة للمنشأة</option>
                  {myHalls.map(h => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleApplyWeekendPricing}
                disabled={!hasWeekendPricing}
                className={`px-6 py-3 rounded-2xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer ${
                  hasWeekendPricing 
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 hover:scale-[1.02]' 
                    : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                }`}
              >
                <Check className="w-4 h-4" />
                <span>حفظ وتطبيق أسعار الويكند على الحجوزات الجديدة</span>
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DYNAMIC SURGE PRICING ENGINE                                       */}
      {/* ========================================================================= */}
      {activeTab === 'surge' && (
        <div className="space-y-6 animate-in fade-in">
          
          {/* Lock Banner if not entitled */}
          {!hasDynamicSurge && (
            <div className="bg-indigo-50 border-2 border-indigo-200 p-5 rounded-3xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-indigo-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-extrabold text-indigo-900 text-sm">
                    محرك التسعير الديناميكي وزيادة الذروة غير مفعل بحسابك
                  </h4>
                  <p className="text-xs text-indigo-800 mt-1">
                    يتوفر محرك الذروة الذكي حصرياً لـ (الباقة الاحترافية) أو يمكن تفعيله كقدرة إضافية مستقلة لزيادة العائدات تلقائياً في مواسم الإشغال المرتفع.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('open-subscription-tab', { detail: { subTab: 'upgrade' } }));
                  showNotification('info', 'جاري توجيهك لمركز ترقية الباقات والميزات الإضافية...');
                }}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer shrink-0"
              >
                ترقية / شراء المحرك الآن
              </button>
            </div>
          )}

          {/* Surge Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">عتبة الإشغال المعتمدة للذروة</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{sovereignOccupancyThreshold}%</h4>
                <p className="text-[10px] text-amber-600 font-bold mt-1">محددة بضوابط الإدارة العامة</p>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Flame className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">السقف الأعلى لمضاعف الذروة</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">+{sovereignMaxSurgeCap}%</h4>
                <p className="text-[10px] text-indigo-600 font-bold mt-1">حماية سيادية ضد المغالاة</p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 font-medium">حالة التجميد والتعطيل الطارئ</p>
                <h4 className={`text-lg font-black mt-1 ${isSovereignFreeze ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isSovereignFreeze ? 'مجمد مؤقتاً ⏸️' : 'جاهز ونشط بالكامل ✓'}
                </h4>
                <p className="text-[10px] text-slate-400 mt-1">المادة 4: حق الإدارة السيادي</p>
              </div>
              <div className={`p-3 rounded-2xl ${isSovereignFreeze ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                <Zap className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* Surge Rules List */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
            
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-indigo-500" />
                  قواعد الذروة والتسعير الديناميكي الذكية
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  تفعيل الخوارزميات المرتبطة بنسب الإشغال ومواسم الطلب لتعديل أسعار الحجوزات الجديدة تلقائياً.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  if (isSovereignFreeze) {
                    showNotification('warning', '⚠️ محركات الذروة مجمدة سيادياً حالياً.');
                    return;
                  }
                  if (!hasDynamicSurge) {
                    showNotification('warning', '⚠️ يجب ترقية الباقة لإنشاء قواعد تسعير ديناميكي جديدة.');
                    return;
                  }
                  setShowAddSurgeModal(true);
                }}
                disabled={isSovereignFreeze || !hasDynamicSurge}
                className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 shadow-sm ${
                  isSovereignFreeze || !hasDynamicSurge
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer'
                }`}
              >
                <Plus className="w-4 h-4" />
                <span>إضافة قاعدة ذروة مخصصة</span>
              </button>
            </div>

            {/* Automatic Standard Surge Rules */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">عتبة الإشغال المرتفع تلقائياً</span>
                    <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-bold">+20%</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    تفعيل زيادة تلقائية عندما تتجاوز نسبة إشغال القاعة {sovereignOccupancyThreshold}%.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSurgeRule('occupancy_surge', 'عتبة الإشغال المرتفع')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSurgeRules.occupancy_surge ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {activeSurgeRules.occupancy_surge ? 'مفعلة' : 'معطلة'}
                </button>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-slate-900">موسم الأعراس وحفلات الصيف</span>
                    <span className="bg-indigo-100 text-indigo-900 text-[10px] px-2 py-0.5 rounded-full font-bold">+25%</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    مضاعف الطلب العالي لفترة الصيف ومواسم الزواج في المنطقة.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSurgeRule('wedding_season', 'موسم الأعراس والصيف')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeSurgeRules.wedding_season ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {activeSurgeRules.wedding_season ? 'مفعلة' : 'معطلة'}
                </button>
              </div>

            </div>

            {/* Custom Rules List */}
            {customSurgeRules.length > 0 && (
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700">القواعد المخصصة الإضافية:</h4>
                <div className="space-y-2">
                  {customSurgeRules.map(rule => (
                    <div key={rule.id} className="p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between text-xs bg-white">
                      <div className="flex items-center gap-3">
                        <span className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                          <SlidersHorizontal className="w-4 h-4" />
                        </span>
                        <div>
                          <span className="font-bold text-slate-900">{rule.name}</span>
                          <span className="text-slate-400 text-[11px] block">{rule.applyTo}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-900 border border-amber-200 rounded-lg font-black text-xs">
                          {rule.multiplier}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setCustomSurgeRules(prev => prev.filter(r => r.id !== rule.id));
                            showNotification('info', `تم حذف قاعدة الذروة (${rule.name}).`);
                          }}
                          className="text-slate-400 hover:text-rose-500 transition-colors p-1"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: INTERACTIVE PRICING & REVENUE SIMULATOR                            */}
      {/* ========================================================================= */}
      {activeTab === 'simulator' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          
          <div className="pb-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Calculator className="w-5 h-5 text-emerald-600" />
                محاكي الإيرادات والتسعير التفاعلي (15% VAT-Inclusive)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                جرّب تأثير تسعير عطلة نهاية الأسبوع ومحرك زيادة الذروة على الأسعار النهائية والوعاء الضريبي وصافي مستحقاتك قبل الحفظ.
              </p>
            </div>
            
            <div className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold">
              معادلة الاحتساب: Gross / 1.15 = Taxable
            </div>
          </div>

          {/* Simulator Controls Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-5 rounded-2xl bg-slate-50 border border-slate-200">
            
            {/* Hall Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">القاعة المراد محاكاتها:</label>
              <select
                value={simSelectedHallId}
                onChange={e => setSimSelectedHallId(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-emerald-500"
              >
                {myHalls.map(h => (
                  <option key={h.id} value={h.id}>{h.name}</option>
                ))}
              </select>
            </div>

            {/* Period Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">الفترة الزمنية:</label>
              <select
                value={simPeriod}
                onChange={e => setSimPeriod(e.target.value as any)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold outline-none focus:border-emerald-500"
              >
                <option value="morning">الفترة الصباحية (Morning)</option>
                <option value="night">الفترة المسائية (Night - سهرة)</option>
                <option value="fullDay">اليوم الكامل (Full Day)</option>
              </select>
            </div>

            {/* Day Type Toggle */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">توقيت الحجز:</label>
              <div className="flex bg-white p-1 rounded-xl border border-slate-200 gap-1">
                <button
                  type="button"
                  onClick={() => setSimIsWeekend(false)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    !simIsWeekend ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  أيام عادية
                </button>
                <button
                  type="button"
                  onClick={() => setSimIsWeekend(true)}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    simIsWeekend ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  عطلة الويكند
                </button>
              </div>
            </div>

            {/* Occupancy Rate Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>نسبة الإشغال المتوقعة:</span>
                <span className="text-indigo-600 font-black">{simOccupancyRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={simOccupancyRate}
                onChange={e => setSimOccupancyRate(parseInt(e.target.value) || 0)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>عادية (0%)</span>
                <span>عتبة الذروة ({sovereignOccupancyThreshold}%)</span>
                <span>كاملة (100%)</span>
              </div>
            </div>

          </div>

          {/* Breakdown Results */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <p className="text-xs text-slate-500 font-medium">السعر الأساسي المعتمد</p>
              <h4 className="text-xl font-black text-slate-900 mt-1">
                {simulationResults.base.toLocaleString('ar-SA')} ر.س
              </h4>
              <p className="text-[11px] text-slate-400 mt-1">قبل أي إضافات</p>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
              <p className="text-xs text-amber-800 font-medium">إضافة الويكند (+الهامش)</p>
              <h4 className="text-xl font-black text-amber-900 mt-1">
                +{simulationResults.weekendAdd.toLocaleString('ar-SA')} ر.س
              </h4>
              <p className="text-[11px] text-amber-700 mt-1">
                {simIsWeekend ? (hasWeekendPricing ? 'مطبقة بنجاح' : 'غير مشمولة باشتراكك') : 'غير مطبقة (يوم عادي)'}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200">
              <p className="text-xs text-indigo-800 font-medium">مضاعف زيادة الذروة</p>
              <h4 className="text-xl font-black text-indigo-900 mt-1">
                +{simulationResults.surgeAmount.toLocaleString('ar-SA')} ر.س
                {simulationResults.surgeMultiplierPct > 0 && (
                  <span className="text-xs mr-1 text-indigo-600 font-bold">(+{simulationResults.surgeMultiplierPct}%)</span>
                )}
              </h4>
              <p className="text-[11px] text-indigo-700 mt-1">
                {isSovereignFreeze ? 'مجمد سيادياً' : (simOccupancyRate >= sovereignOccupancyThreshold ? 'ذروة نشطة' : 'دون عتبة الذروة')}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-300">
              <p className="text-xs text-emerald-800 font-black">السعر النهائي الشامل للضريبة (15%)</p>
              <h4 className="text-2xl font-black text-emerald-950 mt-1">
                {simulationResults.finalGrossPrice.toLocaleString('ar-SA')} ر.س
              </h4>
              <p className="text-[11px] text-emerald-700 font-bold mt-1">السعر المعروض للعميل</p>
            </div>

          </div>

          {/* Tax & Financial Settlement Breakdown Card */}
          <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4">
            <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              التفصيل المحاسبي والضريبي للعملية (Financial & Tax Settlement Breakdown):
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[11px]">المبلغ الخاضع للضريبة (Taxable):</span>
                <span className="text-base font-black text-white mt-0.5 block">
                  {simulationResults.taxableAmount.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[11px]">ضريبة القيمة المضافة 15% (VAT):</span>
                <span className="text-base font-black text-amber-400 mt-0.5 block">
                  {simulationResults.vatAmount.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="p-3 bg-white/5 rounded-xl border border-white/10">
                <span className="text-slate-400 block text-[11px]">عمولة المنصة السيادية ({simulationResults.commRate}%):</span>
                <span className="text-base font-black text-indigo-300 mt-0.5 block">
                  {simulationResults.platformCommission.toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="p-3 bg-emerald-500/20 rounded-xl border border-emerald-500/40">
                <span className="text-emerald-300 block text-[11px] font-bold">صافي مستحقات المزود (Net Payout):</span>
                <span className="text-lg font-black text-emerald-400 mt-0.5 block">
                  {simulationResults.netProvider.toLocaleString('ar-SA')} ر.س
                </span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: ADMIN SOVEREIGN CONTROLS & OCCUPANCY THRESHOLD (ADMIN ONLY)       */}
      {/* ========================================================================= */}
      {isAdmin && activeTab === 'sovereign' && (
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm space-y-6 animate-in fade-in">
          
          <div className="pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-amber-500 text-slate-950 rounded-lg font-bold">
                <ShieldCheck className="w-4 h-4" />
              </span>
              <span className="text-xs font-black text-amber-600 uppercase tracking-wider">
                Sovereign Pricing Oversight & Emergency Kill-Switch
              </span>
            </div>
            <h3 className="text-lg font-black text-slate-900 mt-1">
              الرقابة السيادية ومعامل نسبة الإشغال والتعطيل الطارئ (الإدارة العليا)
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              التحكم في المعاملات الحاكمة للسوق وحماية العملاء من المغالاة وإمكانية التجميد الفوري في الأعياد الوطنية وحالات القوة القاهرة وفق المادة 4 من الشروط والأحكام.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Occupancy Rate Threshold Control */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-black text-slate-800">
                معامل وعتبة نسبة الإشغال لتفعيل الذروة (% Occupancy Threshold):
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="50"
                  max="95"
                  value={sovereignOccupancyThreshold}
                  onChange={e => setSovereignOccupancyThreshold(parseInt(e.target.value) || 80)}
                  className="flex-1 accent-amber-500 cursor-pointer"
                />
                <span className="text-lg font-black text-slate-900 min-w-[50px] text-left">
                  {sovereignOccupancyThreshold}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                النسبة المئوية التي يجب أن تتخطاها حجوزات المنشأة قبل أن يسمح النظام بتطبيق أي زيادات سعرية ديناميكية للمحافظة على توازن السوق.
              </p>
            </div>

            {/* Max Surge Cap Control */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <label className="block text-xs font-black text-slate-800">
                السقف الأعلى لمضاعف زيادة الذروة (% Max Surge Cap):
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={sovereignMaxSurgeCap}
                  onChange={e => setSovereignMaxSurgeCap(parseInt(e.target.value) || 40)}
                  className="flex-1 accent-indigo-600 cursor-pointer"
                />
                <span className="text-lg font-black text-indigo-700 min-w-[50px] text-left">
                  +{sovereignMaxSurgeCap}%
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                الحد الأقصى المطلق للزيادة السعرية المسموح بها لأي شريك مهما بلغت نسبة الطلب، لمنع الاحتكار والمغالاة السعرية.
              </p>
            </div>

          </div>

          {/* Emergency Kill-Switch & Reason */}
          <div className={`p-6 rounded-2xl border-2 transition-all space-y-4 ${
            isSovereignFreeze ? 'bg-rose-50 border-rose-300' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className={`w-6 h-6 shrink-0 mt-0.5 ${isSovereignFreeze ? 'text-rose-600 animate-pulse' : 'text-slate-400'}`} />
                <div>
                  <h4 className="font-black text-sm text-slate-900">
                    مفتاح التجميد والتعطيل الطارئ لمحركات التسعير الديناميكي (Emergency Kill-Switch)
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    تعطيل فوري لجميع زيادات الذروة عبر المنصة وإرجاع كافة الأسعار للحد الأساسي المعتمد.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsSovereignFreeze(!isSovereignFreeze)}
                className={`px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm ${
                  isSovereignFreeze 
                    ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }`}
              >
                {isSovereignFreeze ? 'إلغاء التجميد وتفعيل الذروة' : 'تجميد وتعطيل الذروة طارئاً'}
              </button>
            </div>

            {isSovereignFreeze && (
              <div className="space-y-1.5 pt-2 border-t border-rose-200 animate-in fade-in">
                <label className="block text-xs font-bold text-rose-900">سبب التجميد السيادي (يظهر للشركاء):</label>
                <input
                  type="text"
                  value={sovereignFreezeReason}
                  onChange={e => setSovereignFreezeReason(e.target.value)}
                  placeholder="مثال: مناسبة وطنية رسمية، حالة طوارئ جوية، أو حماية المستهلكين"
                  className="w-full p-3 rounded-xl border border-rose-300 focus:border-rose-500 outline-none text-xs font-bold bg-white text-rose-950"
                />
              </div>
            )}
          </div>

          {/* Action Button */}
          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleSaveSovereignSettings(sovereignOccupancyThreshold, sovereignMaxSurgeCap, isSovereignFreeze, sovereignFreezeReason)}
              className="px-8 py-3.5 bg-slate-950 hover:bg-slate-800 text-amber-400 font-black rounded-2xl text-xs shadow-lg cursor-pointer transition-all hover:scale-105 flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>حفظ وتطبيق الضوابط السيادية فورياً</span>
            </button>
          </div>

        </div>
      )}

      {/* Add Custom Surge Rule Modal */}
      {showAddSurgeModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-600" />
                إضافة قاعدة تسعير ديناميكي جديدة
              </h4>
              <button
                onClick={() => setShowAddSurgeModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateSurgeRule} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم القاعدة / المناسبة:</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={e => setNewRuleName(e.target.value)}
                  placeholder="مثلاً: موسم فعاليات الرياض الشتوي"
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-600 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">نسبة التعديل (السقف الأعلى +{sovereignMaxSurgeCap}%):</label>
                <select
                  value={newRuleVal}
                  onChange={e => setNewRuleVal(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-200 text-xs font-bold focus:border-indigo-600 outline-none bg-white"
                >
                  <option value="+10%">+10% (زيادة خفيفة)</option>
                  <option value="+15%">+15% (زيادة متوسطة)</option>
                  <option value="+20%">+20% (زيادة عالية)</option>
                  <option value="+25%">+25% (ذروة مميزة)</option>
                  <option value="+30%">+30% (ذروة قصوى)</option>
                  <option value={`+${sovereignMaxSurgeCap}%`}>+{sovereignMaxSurgeCap}% (السقف الأعلى للنظام)</option>
                  <option value="-10%">-10% (خصم تشجيعي)</option>
                </select>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 leading-relaxed">
                📌 تنبيه: تسري هذه القاعدة فقط على الحجوزات والطلبات الجديدة ولا تؤثر على الحجوزات المؤكدة السابقة.
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSurgeModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-black bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-md cursor-pointer"
                >
                  إضافة القاعدة وتفعيلها
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
