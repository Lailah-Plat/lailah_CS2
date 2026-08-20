import React, { useState, useMemo } from 'react';
import { 
  Zap, TrendingUp, Sliders, DollarSign, Calendar, Building2, 
  MapPin, CheckCircle2, AlertTriangle, Play, RefreshCw, Download, 
  BarChart3, PieChart as PieChartIcon, ShieldCheck, Sparkles, Filter, Percent, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, ComposedChart, BarChart, Bar, Line, XAxis, YAxis, 
  CartesianGrid, Tooltip as RechartsTooltip, Legend 
} from 'recharts';

interface GlobalPeakSeasonalPricingSectionProps {
  halls?: any[];
  bookings?: any[];
  showNotification?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  syncAndLoadHallsAndServices?: () => Promise<any>;
}

export function GlobalPeakSeasonalPricingSection({
  halls = [],
  bookings = [],
  showNotification,
  syncAndLoadHallsAndServices,
}: GlobalPeakSeasonalPricingSectionProps) {
  // Season Preset Rules State
  const [seasonalRules, setSeasonalRules] = useState<any[]>([
    {
      id: 'SEASON-01',
      title: 'موسم الأفراح والمناسبات الصيفية (Peak Wedding Season)',
      scope: 'all',
      scopeLabel: 'جميع القاعات بالمنظومة',
      multiplier: 20, // +20%
      type: 'percentage',
      startDate: '2026-06-01',
      endDate: '2026-08-31',
      active: true,
      description: 'زيادة موحدة بنسبة 20% لكافة القاعات طوال فترة الذروة الصيفية'
    },
    {
      id: 'SEASON-02',
      title: 'عطلات نهاية الأسبوع (Weekend Peak - الخميس والجمعة)',
      scope: 'all',
      scopeLabel: 'جميع القاعات بالمنظومة',
      multiplier: 15, // +15%
      type: 'percentage',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      active: true,
      description: 'رسوم ذروة إضافية بنسبة 15% على الحجوزات اليومية في نهاية الأسبوع'
    },
    {
      id: 'SEASON-03',
      title: 'موسم الأعياد والإجازات الرسمية (Eid & Official Holidays)',
      scope: 'all',
      scopeLabel: 'جميع القاعات بالمنظومة',
      multiplier: 25, // +25%
      type: 'percentage',
      startDate: '2026-03-15',
      endDate: '2026-04-10',
      active: true,
      description: 'تسعير استثنائي للمواسم الكبرى والدينية'
    },
    {
      id: 'SEASON-04',
      title: 'موسم اليوم الوطني والتأسيس (National Events Season)',
      scope: 'riyadh_jeddah',
      scopeLabel: 'قاعات الرياض وجدة والشرقية',
      multiplier: 10, // +10%
      type: 'percentage',
      startDate: '2026-09-20',
      endDate: '2026-09-25',
      active: false,
      description: 'تعديل السعر للفعاليات الوطنية والاحتفالات الكبرى'
    }
  ]);

  // Simulation Controls State
  const [simSelectedScope, setSimSelectedScope] = useState<string>('all');
  const [simMultiplierPercentage, setSimMultiplierPercentage] = useState<number>(20); // +20%
  const [simDemandElasticity, setSimDemandElasticity] = useState<number>(0); // 0% impact on volume (-5%, 0%, +5%)
  const [simSeasonDays, setSimSeasonDays] = useState<number>(30); // 30 days
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationRunCount, setSimulationRunCount] = useState<number>(1);
  const [lastAppliedTimestamp, setLastAppliedTimestamp] = useState<string | null>(null);

  // Filter halls based on simulation scope
  const targetHalls = useMemo(() => {
    if (!halls || halls.length === 0) return [];
    if (simSelectedScope === 'all') return halls;
    if (simSelectedScope === 'riyadh') return halls.filter(h => (h.city || h.region || '').includes('الرياض'));
    if (simSelectedScope === 'jeddah') return halls.filter(h => (h.city || h.region || '').includes('جدة'));
    if (simSelectedScope === 'eastern') return halls.filter(h => (h.city || h.region || '').includes('الشرقية') || (h.city || h.region || '').includes('الدمام'));
    return halls;
  }, [halls, simSelectedScope]);

  // Baseline Financial Calculations from real data or calculated fallback
  const baselineStats = useMemo(() => {
    const list = targetHalls.length > 0 ? targetHalls : [
      { id: '1', name: 'قاعة تالا الكبرى', price: 15000, city: 'الرياض' },
      { id: '2', name: 'قصر الفخامة للمؤتمرات', price: 35000, city: 'جدة' },
      { id: '3', name: 'قاعة الماس والياقوت', price: 18000, city: 'الدمام' },
      { id: '4', name: 'قاعة الأسطورة المتميزة', price: 22000, city: 'الرياض' },
      { id: '5', name: 'قصر الملكة للمناسبات', price: 28000, city: 'مكة المكرمة' }
    ];

    const totalHallsCount = list.length;
    const avgBasePrice = Math.round(list.reduce((sum, h) => sum + Number(h.price || h.basePrice || 15000), 0) / totalHallsCount);
    
    // Estimate baseline monthly bookings for target scope (e.g. 2.5 bookings per hall per month)
    const estimatedBookingsCount = Math.max(10, Math.round(totalHallsCount * 2.5));
    const currentGrossRevenue = estimatedBookingsCount * avgBasePrice;
    const currentPlatformCommission = Math.round(currentGrossRevenue * 0.15); // 15% platform commission
    const currentProviderNet = currentGrossRevenue - currentPlatformCommission;

    return {
      totalHallsCount,
      avgBasePrice,
      estimatedBookingsCount,
      currentGrossRevenue,
      currentPlatformCommission,
      currentProviderNet,
      list
    };
  }, [targetHalls]);

  // Simulated Financial Calculations
  const simulationResults = useMemo(() => {
    const multiplierRatio = 1 + (simMultiplierPercentage / 100);
    const elasticityRatio = 1 + (simDemandElasticity / 100);

    const simulatedAvgPrice = Math.round(baselineStats.avgBasePrice * multiplierRatio);
    const simulatedBookingsCount = Math.max(1, Math.round(baselineStats.estimatedBookingsCount * elasticityRatio));
    const simulatedGrossRevenue = Math.round(simulatedBookingsCount * simulatedAvgPrice);
    
    const grossRevenueDelta = simulatedGrossRevenue - baselineStats.currentGrossRevenue;
    const percentageRevenueGrowth = baselineStats.currentGrossRevenue > 0 
      ? Number(((grossRevenueDelta / baselineStats.currentGrossRevenue) * 100).toFixed(1))
      : 0;

    const simulatedPlatformCommission = Math.round(simulatedGrossRevenue * 0.15);
    const platformCommissionDelta = simulatedPlatformCommission - baselineStats.currentPlatformCommission;

    const simulatedProviderNet = simulatedGrossRevenue - simulatedPlatformCommission;
    const providerNetDelta = simulatedProviderNet - baselineStats.currentProviderNet;

    // Financial Scenarios Data for Charts
    const chartScenarios = [
      {
        scenario: 'الوضع الحالي',
        'إجمالي الإيرادات': baselineStats.currentGrossRevenue,
        'عمولة المنصة (15%)': baselineStats.currentPlatformCommission,
        'صافي أرباح المزودين': baselineStats.currentProviderNet,
      },
      {
        scenario: 'محاكاة تحفظية (-5% طلب)',
        'إجمالي الإيرادات': Math.round(simulatedGrossRevenue * 0.95),
        'عمولة المنصة (15%)': Math.round(simulatedPlatformCommission * 0.95),
        'صافي أرباح المزودين': Math.round(simulatedProviderNet * 0.95),
      },
      {
        scenario: 'المحاكاة المستهدفة',
        'إجمالي الإيرادات': simulatedGrossRevenue,
        'عمولة المنصة (15%)': simulatedPlatformCommission,
        'صافي أرباح المزودين': simulatedProviderNet,
      },
      {
        scenario: 'محاكاة متفائلة (+10% طلب)',
        'إجمالي الإيرادات': Math.round(simulatedGrossRevenue * 1.10),
        'عمولة المنصة (15%)': Math.round(simulatedPlatformCommission * 1.10),
        'صافي أرباح المزودين': Math.round(simulatedProviderNet * 1.10),
      }
    ];

    return {
      simulatedAvgPrice,
      simulatedBookingsCount,
      simulatedGrossRevenue,
      grossRevenueDelta,
      percentageRevenueGrowth,
      simulatedPlatformCommission,
      platformCommissionDelta,
      simulatedProviderNet,
      providerNetDelta,
      chartScenarios
    };
  }, [baselineStats, simMultiplierPercentage, simDemandElasticity]);

  const handleRunSimulation = () => {
    setIsSimulating(true);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulationRunCount(prev => prev + 1);
      if (showNotification) {
        showNotification('info', `📊 تم تشغيل المحاكاة المالية بنجاح (نموذج رقم #${simulationRunCount}) - الأثر المتوقع: +${simulationResults.grossRevenueDelta.toLocaleString()} ر.س (+${simulationResults.percentageRevenueGrowth}%)`);
      }
    }, 450);
  };

  const handleApplyGlobalPricingPolicy = () => {
    try {
      const policyPayload = {
        appliedAt: new Date().toISOString(),
        appliedBy: 'Super Admin',
        scope: simSelectedScope,
        multiplierPercentage: simMultiplierPercentage,
        activeRulesCount: seasonalRules.filter(r => r.active).length,
        simulatedGrossRevenueDelta: simulationResults.grossRevenueDelta,
      };

      localStorage.setItem('LAILAH_GLOBAL_PEAK_PRICING_POLICY', JSON.stringify(policyPayload));
      setLastAppliedTimestamp(new Date().toLocaleTimeString('ar-SA'));

      if (syncAndLoadHallsAndServices) {
        syncAndLoadHallsAndServices();
      }

      if (showNotification) {
        showNotification('success', `⚡ تم اعتماد وتطبيق سياسة أسعار الذروة والمواسم الموحدة بنجاح على ${baselineStats.totalHallsCount} قاعة! (+${simMultiplierPercentage}%)`);
      }
    } catch (err) {
      if (showNotification) {
        showNotification('error', 'فشل تطبيق سياسة الأسعار، يرجى المحاولة مرة أخرى.');
      }
    }
  };

  const handleToggleRule = (ruleId: string) => {
    setSeasonalRules(prev => prev.map(r => r.id === ruleId ? { ...r, active: !r.active } : r));
    if (showNotification) {
      showNotification('info', 'تم تحديث حالة تفعيل القاعدة الموسمية.');
    }
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-950 p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-xs font-black mb-3">
              <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
              <span>إدارة أسعار الذروة والمواسم الموحدة والسيادة التسعيرية</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              تعديلات أسعار الذروة والمواسم والمحاكاة المالية ⚡
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-3xl leading-relaxed">
              تتيح لمشرفي النظام التحكم المباشر في تعديلات أسعار الذروة والمواسم الموحدة لكافة القاعات على مستوى المملكة، مع ميزة المحاكاة المالية الشاملة لاحتساب الأثر المتوقع على الإيرادات وعمولات المنصة قبل التفعيل.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleApplyGlobalPricingPolicy}
              className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl font-black text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer border border-amber-400/40"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>تطبيق التعديل الموحد على القاعات</span>
            </button>
          </div>
        </div>

        {lastAppliedTimestamp && (
          <div className="mt-4 pt-4 border-t border-amber-500/20 flex items-center gap-2 text-xs text-amber-300/90 font-bold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>آخر سياسة موحدة تم تطبيقها واعتصامها في السحابة: {lastAppliedTimestamp}</span>
          </div>
        )}
      </div>

      {/* 2. Simulation Engine Controls & Live Metric Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Simulation Interactive Controls Box */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Sliders className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-base">معدلات المحاكاة والتسعير</h3>
                <p className="text-xs text-slate-500">ضبط المعايير لاختبار السيناريوهات المتوقعة</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold">
              نموذج #{simulationRunCount}
            </span>
          </div>

          {/* Scope Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">نطاق القاعات المستهدفة:</label>
            <select
              value={simSelectedScope}
              onChange={(e) => setSimSelectedScope(e.target.value)}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="all">🌐 جميع القاعات بالمملكة ({baselineStats.totalHallsCount} قاعة)</option>
              <option value="riyadh">📍 قاعات منطقة الرياض فقط</option>
              <option value="jeddah">📍 قاعات منطقة مكة وجدة فقط</option>
              <option value="eastern">📍 قاعات المنطقة الشرقية فقط</option>
            </select>
          </div>

          {/* Multiplier Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">نسبة تعديل سعر الذروة (+%):</span>
              <span className="text-amber-600 font-black text-sm">+{simMultiplierPercentage}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="5"
              value={simMultiplierPercentage}
              onChange={(e) => setSimMultiplierPercentage(Number(e.target.value))}
              className="w-full accent-amber-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-sans">
              <span>0% (عادي)</span>
              <span>+15% (نهاية الأسبوع)</span>
              <span>+30% (الأعياد)</span>
              <span>+50% (ذروة قصوى)</span>
            </div>
          </div>

          {/* Demand Elasticity Slider */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-700">مرونة الطلب المتوقعة (حجم الحجوزات):</span>
              <span className={`font-black text-xs ${simDemandElasticity < 0 ? 'text-rose-600' : simDemandElasticity > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                {simDemandElasticity > 0 ? `+${simDemandElasticity}%` : `${simDemandElasticity}%`}
              </span>
            </div>
            <select
              value={simDemandElasticity}
              onChange={(e) => setSimDemandElasticity(Number(e.target.value))}
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:border-amber-500 transition-all cursor-pointer"
            >
              <option value="-10">متحفظ شديد (-10% انخفاض طفيف في إقبال الحجوزات)</option>
              <option value="-5">متحفظ عادي (-5% انخفاض في حجم الحجوزات)</option>
              <option value="0">محايد ومتزن (0% ثبات حجم الطلب الحالي)</option>
              <option value="5">متفائل (+5% زيادة إقبال الموسم والرغبة)</option>
            </select>
          </div>

          {/* Days selector */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">مدة الموسم / الفترة الحسابية:</label>
            <div className="grid grid-cols-3 gap-2">
              {[15, 30, 60].map((days) => (
                <button
                  key={days}
                  onClick={() => setSimSeasonDays(days)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border cursor-pointer ${simSeasonDays === days ? 'bg-amber-500 text-slate-950 border-amber-500 font-black' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'}`}
                >
                  {days} يوماً
                </button>
              ))}
            </div>
          </div>

          {/* Action to re-run simulation */}
          <button
            onClick={handleRunSimulation}
            disabled={isSimulating}
            className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-black text-xs sm:text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 text-amber-400 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'جاري محاكاة الأثر المالي...' : 'إعادة تشغيل المحاكاة المالية'}</span>
          </button>
        </div>

        {/* Live Simulated Impact Metrics */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card 1: Gross Revenue Impact */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-5 rounded-3xl border border-emerald-500/30 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-emerald-300 font-bold mb-2">
                <span>إجمالي الإيرادات المتوقعة REV</span>
                <TrendingUp className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-sans dir-ltr text-right">
                {simulationResults.simulatedGrossRevenue.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">الزيادة عن الوضع الحالي:</span>
              <span className="font-black text-emerald-400 font-sans">
                +{simulationResults.grossRevenueDelta.toLocaleString()} ر.س (+{simulationResults.percentageRevenueGrowth}%)
              </span>
            </div>
          </div>

          {/* Card 2: Platform Commission Impact */}
          <div className="bg-gradient-to-br from-amber-900 to-slate-900 p-5 rounded-3xl border border-amber-500/30 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-amber-300 font-bold mb-2">
                <span>صافي عمولات المنصة السيادية (15%)</span>
                <DollarSign className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-sans dir-ltr text-right">
                {simulationResults.simulatedPlatformCommission.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-amber-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">أثر النمو على دخل المنصة:</span>
              <span className="font-black text-amber-400 font-sans">
                +{simulationResults.platformCommissionDelta.toLocaleString()} ر.س
              </span>
            </div>
          </div>

          {/* Card 3: Provider Net Payout Impact */}
          <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-5 rounded-3xl border border-indigo-500/30 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-indigo-300 font-bold mb-2">
                <span>صافي مستحقات مزودي القاعات</span>
                <Building2 className="w-4 h-4 text-indigo-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white font-sans dir-ltr text-right">
                {simulationResults.simulatedProviderNet.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs">
              <span className="text-slate-300">زيادة أرباح الشركاء والمزودين:</span>
              <span className="font-black text-indigo-300 font-sans">
                +{simulationResults.providerNetDelta.toLocaleString()} ر.س
              </span>
            </div>
          </div>

          {/* Card 4: Avg Price per Booking */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 p-5 rounded-3xl border border-slate-800 text-white shadow-md flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-bold mb-2">
                <span>متوسط سعر الحجز للقاعة بالذروة</span>
                <BarChart3 className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-400 font-sans dir-ltr text-right">
                {simulationResults.simulatedAvgPrice.toLocaleString()} <span className="text-xs font-normal text-slate-300">ر.س</span>
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">السعر الأساسي العادي:</span>
              <span className="font-bold text-slate-300 font-sans">
                {baselineStats.avgBasePrice.toLocaleString()} ر.س
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Recharts Visual Chart: Scenario Comparison */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">مخطط مقارنة سيناريوهات الأثر المالي قبل وبعد تعديل أسعار الذروة</h3>
              <p className="text-xs text-slate-500">يعرض تحليل التدفقات المالية بين الوضع الحالي والمحاكاة المستهدفة والمتفائلة</p>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={simulationResults.chartScenarios} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="scenario" tick={{ fontSize: 11, fill: '#64748b', fontWeight: 'bold' }} />
              <YAxis tick={{ fontSize: 10, fill: '#64748b' }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <RechartsTooltip 
                formatter={(value: any) => [`${Number(value).toLocaleString()} ر.س`, '']}
                contentStyle={{ borderRadius: '16px', backgroundColor: '#0f172a', color: '#fff', border: 'none', fontSize: '12px' }}
              />
              <Legend wrapperStyle={{ paddingTop: '10px', fontSize: '12px', fontWeight: 'bold' }} />
              <Bar dataKey="إجمالي الإيرادات" fill="#10b981" radius={[8, 8, 0, 0]} name="إجمالي الإيرادات REV" />
              <Bar dataKey="صافي أرباح المزودين" fill="#6366f1" radius={[8, 8, 0, 0]} name="أرباح المزودين" />
              <Bar dataKey="عمولة المنصة (15%)" fill="#f59e0b" radius={[8, 8, 0, 0]} name="عمولة المنصة" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Seasonal Rules Management Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">القواعد والسياسات الموسمية الموحدة المسجلة بالنظام</h3>
              <p className="text-xs text-slate-500">يمكنك تفعيل أو تعطيل أي موسم موحد وتعديل معامل الذروة الخاص به</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                <th className="p-3.5 rounded-r-xl">اسم الموسم / القاعدة</th>
                <th className="p-3.5">النطاق المستهدف</th>
                <th className="p-3.5">معامل تعديل الذروة</th>
                <th className="p-3.5">الفترة الزمنية</th>
                <th className="p-3.5">حالة التفعيل</th>
                <th className="p-3.5 rounded-l-xl text-center">التحكم</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
              {seasonalRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3.5">
                    <div className="font-black text-slate-900">{rule.title}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{rule.description}</div>
                  </td>
                  <td className="p-3.5">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-[11px]">
                      <MapPin className="w-3 h-3 text-amber-500" />
                      {rule.scopeLabel}
                    </span>
                  </td>
                  <td className="p-3.5 font-sans">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 font-black border border-amber-200">
                      +{rule.multiplier}%
                    </span>
                  </td>
                  <td className="p-3.5 font-sans dir-ltr text-right text-slate-500">
                    {rule.startDate} ── {rule.endDate}
                  </td>
                  <td className="p-3.5">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black ${rule.active ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                      <span className={`w-2 h-2 rounded-full ${rule.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {rule.active ? 'نشطة ومطبقة' : 'معطلة مؤقتاً'}
                    </span>
                  </td>
                  <td className="p-3.5 text-center">
                    <button
                      onClick={() => handleToggleRule(rule.id)}
                      className={`px-3 py-1.5 rounded-xl font-black text-xs transition-all cursor-pointer border ${rule.active ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100' : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'}`}
                    >
                      {rule.active ? 'تجميد القاعدة' : 'تفعيل الموسم'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Sample Halls Simulated Impact Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 text-base">عينة حية لأثر تسعير الذروة على أسعار القاعات الفعلية بالمنظومة</h3>
              <p className="text-xs text-slate-500">تُظهر المقارنة بين السعر الأساسي الحالي وسعر الذروة بعد تطبيق الزيادة الموحدة (+{simMultiplierPercentage}%)</p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 font-black border-b border-slate-200">
                <th className="p-3.5 rounded-r-xl">اسم القاعة</th>
                <th className="p-3.5">المدينة</th>
                <th className="p-3.5">السعر الأساسي الحالي</th>
                <th className="p-3.5">سعر الذروة المعدل</th>
                <th className="p-3.5">فارق السعر (+ر.س)</th>
                <th className="p-3.5 rounded-l-xl text-center">حالة الجاهزية</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold text-slate-800">
              {baselineStats.list.slice(0, 5).map((hall: any, idx: number) => {
                const baseP = Number(hall.price || hall.basePrice || 15000);
                const peakP = Math.round(baseP * (1 + simMultiplierPercentage / 100));
                const diffP = peakP - baseP;

                return (
                  <tr key={hall.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-black text-slate-900">{hall.name || hall.title || `قاعة مناسبات #${idx + 1}`}</td>
                    <td className="p-3.5 text-slate-600">{hall.city || hall.region || 'الرياض'}</td>
                    <td className="p-3.5 font-sans">{baseP.toLocaleString()} ر.س</td>
                    <td className="p-3.5 font-sans font-black text-amber-600">{peakP.toLocaleString()} ر.س</td>
                    <td className="p-3.5 font-sans font-bold text-emerald-600">+{diffP.toLocaleString()} ر.س</td>
                    <td className="p-3.5 text-center">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        جاهزة للتطبيق السحابي
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
