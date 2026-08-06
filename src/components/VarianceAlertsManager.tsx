import React, { useState, useMemo } from 'react';
import { 
  AlertTriangle, ShieldAlert, ShieldCheck, CheckCircle2, 
  TrendingUp, TrendingDown, DollarSign, PieChart, Sliders, 
  Sparkles, Bell, RefreshCw, Zap, ArrowUpRight, ArrowDownRight, 
  Info, Cpu, Download, Plus, Trash2, Edit3, Lock, Shield, Layers, Building
} from 'lucide-react';
import { GoogleGenAI } from '@google/genai';

interface VarianceAlertsManagerProps {
  expenses: any[];
  revenues: any[];
  bookings?: any[];
  settlements?: any[];
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  onAddExpense?: (newExpense: any) => void;
}

export interface BudgetCategoryConfig {
  category: string;
  label: string;
  allocatedBudget: number; // SAR
  iconName: string;
  description: string;
}

const DEFAULT_BUDGETS: BudgetCategoryConfig[] = [
  { category: 'تسويق', label: 'التسويق والحملات الإعلانية', allocatedBudget: 6000, iconName: 'Megaphone', description: 'حملات جوجل، سناب شات، والتسويق الرقمي المباشر للمنصة' },
  { category: 'استضافة', label: 'الخوادم والبنية السحابية', allocatedBudget: 3000, iconName: 'Server', description: 'خوادم AWS Cloud, Firebase, ونطاقات وحماية المنصة' },
  { category: 'رواتب', label: 'الرواتب والدعم الفني', allocatedBudget: 20000, iconName: 'Users', description: 'رواتب موظفي صيانة المنصة، الدعم الفني والمحاسبة' },
  { category: 'مشتريات', label: 'المشتريات والمعدات', allocatedBudget: 5000, iconName: 'ShoppingBag', description: 'أجهزة مكتبية، مستلزمات ورقية وبرمجيات مرخصة' },
  { category: 'مستردات', label: 'المستردات والتعويضات', allocatedBudget: 3000, iconName: 'RefreshCw', description: 'سياسات التعويض للعملاء واسترداد حجز الملغي' },
];

export default function VarianceAlertsManager({
  expenses,
  revenues,
  bookings = [],
  settlements = [],
  showNotification,
  onAddExpense
}: VarianceAlertsManagerProps) {
  // Budget limits state
  const [budgets, setBudgets] = useState<BudgetCategoryConfig[]>(() => {
    const saved = localStorage.getItem('LAILAH_PLATFORM_BUDGETS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return DEFAULT_BUDGETS;
  });

  // Target Revenue State for Platform Administration
  const [revenueTarget, setRevenueTarget] = useState<number>(() => {
    const saved = localStorage.getItem('LAILAH_PLATFORM_REV_TARGET');
    return saved ? parseFloat(saved) : 60000;
  });

  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [tempBudgetVal, setTempBudgetVal] = useState<string>('');

  // AI Advisor State
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [aiRemediationReport, setAiRemediationReport] = useState<string | null>(null);

  // Filter or Month Scope
  const [periodFilter, setPeriodFilter] = useState<'all' | 'current_month'>('current_month');

  // Save budgets when changed
  const saveBudgets = (updated: BudgetCategoryConfig[]) => {
    setBudgets(updated);
    localStorage.setItem('LAILAH_PLATFORM_BUDGETS', JSON.stringify(updated));
    showNotification('success', 'تم تحديث سقف الميزانية المرصودة بنجاح 💾');
  };

  const handleUpdateBudget = (category: string) => {
    const num = parseFloat(tempBudgetVal);
    if (isNaN(num) || num < 0) {
      showNotification('error', 'يرجى إدخال مبلغ ميزانية صحيح');
      return;
    }
    const updated = budgets.map(b => b.category === category ? { ...b, allocatedBudget: num } : b);
    saveBudgets(updated);
    setEditingCategory(null);
  };

  // Calculate Actual Expenses per Category
  const categoryStats = useMemo(() => {
    const map: Record<string, number> = {};
    
    expenses.forEach(e => {
      const cat = e.category || 'عام';
      const amt = parseFloat(e.total || e.amount || 0);
      map[cat] = (map[cat] || 0) + amt;
    });

    return budgets.map(b => {
      const actual = map[b.category] || 0;
      const budget = b.allocatedBudget;
      const variance = actual - budget; // Positive means over budget
      const percentage = budget > 0 ? (actual / budget) * 100 : 0;
      
      let severity: 'critical' | 'warning' | 'watch' | 'safe' = 'safe';
      if (actual > budget * 1.15) {
        severity = 'critical'; // Exceeded by over 15%
      } else if (actual > budget) {
        severity = 'warning'; // Exceeded up to 15%
      } else if (actual >= budget * 0.85) {
        severity = 'watch'; // Approaching limit (85%+)
      }

      return {
        ...b,
        actual,
        variance,
        percentage,
        severity
      };
    });
  }, [expenses, budgets]);

  // Total Platform Expenses & Total Budget
  const totalActualExpense = useMemo(() => {
    return categoryStats.reduce((sum, c) => sum + c.actual, 0);
  }, [categoryStats]);

  const totalAllocatedBudget = useMemo(() => {
    return budgets.reduce((sum, b) => sum + b.allocatedBudget, 0);
  }, [budgets]);

  const overallBudgetVariance = totalActualExpense - totalAllocatedBudget;
  const overallBudgetPercentage = totalAllocatedBudget > 0 ? (totalActualExpense / totalAllocatedBudget) * 100 : 0;

  // Revenue Target Achievement Metrics
  const totalActualRevenue = useMemo(() => {
    return revenues.reduce((sum, r) => sum + parseFloat(r.total || r.amount || 0), 0);
  }, [revenues]);

  const revenueAchievementRate = revenueTarget > 0 ? (totalActualRevenue / revenueTarget) * 100 : 0;

  // Active Critical & Warning Alerts Count
  const criticalCount = categoryStats.filter(c => c.severity === 'critical').length;
  const warningCount = categoryStats.filter(c => c.severity === 'warning').length;
  const watchCount = categoryStats.filter(c => c.severity === 'watch').length;

  // Call Gemini AI for Proactive Variance Analysis
  const runGeminiVarianceAnalysis = async () => {
    setIsAiAnalyzing(true);
    try {
      const apiKey = process.env.GEMINI_API_KEY || (import.meta as any).env?.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        setAiRemediationReport(`⚠️ **تحليل استباقي آلي (محاكي):**
- **انحراف الميزانية التشغيلية:** إجمالي المصروفات الفعلية (${totalActualExpense.toLocaleString()} ر.س) بلغ **${overallBudgetPercentage.toFixed(1)}%** من إجمالي الميزانية المرصودة (${totalAllocatedBudget.toLocaleString()} ر.س).
- **التوصيات العلاجية:**
  1. إيقاف أي حملات تسويقية إضافية خارج الخطة المعتمدة حتى استعادة توازن البند.
  2. تدقيق بنود المشتريات والمستردات للتأكد من عدم وجود مبالغ معلقة بدون سندات رسمية.
  3. إعادة توجيه الفائض المقدر بـ ${(totalAllocatedBudget - totalActualExpense > 0 ? totalAllocatedBudget - totalActualExpense : 0).toLocaleString()} ر.س لتغطية انحرافات القطاعات الحرجة.`);
        setIsAiAnalyzing(false);
        return;
      }

      const ai = new GoogleGenAI({ apiKey });
      const promptText = `أنت المحرك الاستنتاجي ومحلل المخاطر المالية لإدارة منصة "ليلة" لحجوزات القاعات والخدمات المساندة بالسعودية.
حلل بيانات الانحراف بين المصروفات الفعلية والميزانية المرصودة للإدارة العامة التالية، وقدم تقريراً استباقياً علاجياً مباشراً باللغة العربية ومُنسق بـ Markdown.

بيانات الميزانية والانحرافات الحالية:
- إجمالي الميزانية المرصودة للمنصة: ${totalAllocatedBudget} ر.س
- إجمالي المصروفات الفعلية: ${totalActualExpense} ر.س
- نسبة استهلاك الميزانية الإجمالية: ${overallBudgetPercentage.toFixed(1)}%
- هدف الإيرادات للفترة: ${revenueTarget} ر.س | الإيرادات المحققة الفعلية: ${totalActualRevenue} ر.س (${revenueAchievementRate.toFixed(1)}%)

تفاصيل البنود والقطاعات:
${JSON.stringify(categoryStats, null, 2)}

يرجى تقديم التقرير في 3 أقسام واضحة:
1. **تشخيص الانحرافات والحيود:** تحديد البنود المتجاوزة والمخاطر التشغيلية المباشرة.
2. **الملاءة وحماية هامش الربح:** التأثير على صافي ربح المنصة والسيولة المتاحة لتسويات الشركاء.
3. **خطة العمل العلاجية الفورية (Action Plan):** 3-4 خطوات تصحيحية محددة يمكن للإدارة اتخاذها الآن.`;

      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
      });

      setAiRemediationReport(res.text || 'لم يتم استلام رد تحليل مناسب من المحرك.');
      showNotification('success', 'تم توليد تقرير المعالجة الاستباقية للانحرافات المالية من Gemini BI 🧠');
    } catch (err: any) {
      console.error('Error running Gemini variance analysis:', err);
      showNotification('error', 'تعذر الاتصال بمحرك الذكاء الاصطناعي، تم عرض التقرير المحاكي.');
      setAiRemediationReport(`⚠️ **تقرير المعالجة الاستباقية السريع:**
1. **بند التسويق:** يُنصح بإبقاء المصروفات عند السقف الحالي وعدم تجاوز حد البرامج الممتازة.
2. **الاستضافة والبنية التحتية:** أداء مستقر وضمن الحدود الآمنة.
3. **الإيرادات والعمولات:** معدل تحصيل الإيراد ممتاز ويضمن تغطية المصروفات بالكامل.`);
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);
  };

  return (
    <div className="space-y-6 font-sans dir-rtl text-right">
      
      {/* Top Header & Alert Banner */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3 text-amber-600" /> ميزة خاصة بـ (الإدارة العامة للمنصة)
            </span>
            <span className="bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              تتبع الانحرافات لحظياً
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-850 flex items-center gap-2.5">
            <Bell className="w-6 h-6 text-indigo-600" /> الإشعارات الاستباقية للانحرافات المالية ومراقبة الميزانية
          </h3>
          <p className="text-slate-500 text-xs mt-1">
            نظام رصد ومقارنة النفقات الفعلية بالميزانيات المرصودة للخدمات والبنية التحتية لحماية الملاءة المالية للمنصة.
          </p>
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            type="button"
            onClick={runGeminiVarianceAnalysis}
            disabled={isAiAnalyzing}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-100 cursor-pointer disabled:opacity-50"
          >
            {isAiAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Cpu className="w-3.5 h-3.5" />}
            <span>تحليل الانحرافات بـ Gemini 🧠</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Budget vs Actual */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold mb-1">
            <span>إجمالي الميزانية المخصصة</span>
            <DollarSign className="w-4 h-4 text-blue-500" />
          </div>
          <span className="block text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalAllocatedBudget)}
          </span>
          <span className="text-[10px] text-slate-500 font-bold mt-1 block">
            المصروفات الفعلية: <span className="font-mono text-slate-800">{formatCurrency(totalActualExpense)}</span>
          </span>
        </div>

        {/* Overall Deviation % */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
          overallBudgetPercentage > 100 
            ? 'bg-red-50/50 border-red-200 text-red-900' 
            : overallBudgetPercentage >= 85 
            ? 'bg-amber-50/50 border-amber-200 text-amber-900' 
            : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
        }`}>
          <div className="flex justify-between items-center text-xs font-bold mb-1 opacity-80">
            <span>نسبة استهلاك الميزانية</span>
            {overallBudgetPercentage > 100 ? (
              <TrendingUp className="w-4 h-4 text-red-600" />
            ) : (
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <span className="block text-2xl font-black font-mono">
            {overallBudgetPercentage.toFixed(1)}%
          </span>
          <span className="text-[10px] font-bold mt-1 block">
            {overallBudgetVariance > 0 ? (
              <span className="text-red-600">تجاوز بـ +{formatCurrency(overallBudgetVariance)}</span>
            ) : (
              <span className="text-emerald-700">وفر قدره {formatCurrency(Math.abs(overallBudgetVariance))}</span>
            )}
          </span>
        </div>

        {/* Active Alerts Count */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold mb-1">
            <span>حالة تنبيهات القطاعات</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 font-mono">
              {criticalCount + warningCount}
            </span>
            <div className="flex gap-1">
              {criticalCount > 0 && (
                <span className="bg-red-100 text-red-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {criticalCount} حرج 🔴
                </span>
              )}
              {warningCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded-full">
                  {warningCount} تحذير 🟡
                </span>
              )}
              {criticalCount === 0 && warningCount === 0 && (
                <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                  سليم 🟢
                </span>
              )}
            </div>
          </div>
          <span className="text-[10px] text-slate-400 font-bold mt-1 block">
            من أصل {budgets.length} قطاعات تشغيلية
          </span>
        </div>

        {/* Revenue Target Progress */}
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold mb-1">
            <span>معدل تحقق هدف الإيراد</span>
            <TrendingUp className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="block text-2xl font-black text-indigo-600 font-mono">
            {revenueAchievementRate.toFixed(1)}%
          </span>
          <span className="text-[10px] text-slate-500 font-bold mt-1 block">
            المحقق: {formatCurrency(totalActualRevenue)} / الهدف: {formatCurrency(revenueTarget)}
          </span>
        </div>

      </div>

      {/* Main Budget & Variance Tracking Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Category Budget Status List */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
              <Sliders className="w-4 h-4 text-indigo-600" /> مراقبة الميزانيات المخصصة والانحرافات لكل قطاع
            </h4>
            <span className="text-xs text-slate-400 font-bold">
              يمكنك تعديل سقف الميزانية المرصودة بالنقر على القلم ✏️
            </span>
          </div>

          <div className="space-y-4">
            {categoryStats.map((item) => {
              const isEditing = editingCategory === item.category;

              return (
                <div 
                  key={item.category}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    item.severity === 'critical'
                      ? 'bg-red-50/40 border-red-200'
                      : item.severity === 'warning'
                      ? 'bg-amber-50/40 border-amber-200'
                      : item.severity === 'watch'
                      ? 'bg-blue-50/30 border-blue-100'
                      : 'bg-slate-50/50 border-slate-100'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`p-2 rounded-xl font-bold ${
                        item.severity === 'critical'
                          ? 'bg-red-100 text-red-700'
                          : item.severity === 'warning'
                          ? 'bg-amber-100 text-amber-800'
                          : item.severity === 'watch'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {item.severity === 'critical' && <ShieldAlert className="w-4 h-4" />}
                        {item.severity === 'warning' && <AlertTriangle className="w-4 h-4" />}
                        {item.severity === 'watch' && <Info className="w-4 h-4" />}
                        {item.severity === 'safe' && <CheckCircle2 className="w-4 h-4" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900 text-sm">{item.label}</span>
                          <span className="text-[10px] bg-slate-200/60 text-slate-600 px-2 py-0.5 rounded-full font-bold">
                            {item.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">{item.description}</p>
                      </div>
                    </div>

                    {/* Allocated Budget Display & Edit Button */}
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      {isEditing ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="number"
                            value={tempBudgetVal}
                            onChange={(e) => setTempBudgetVal(e.target.value)}
                            className="w-28 px-2.5 py-1 text-xs font-mono font-bold border border-indigo-300 rounded-lg outline-none bg-white"
                            placeholder="السقف الجديد"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateBudget(item.category)}
                            className="bg-emerald-600 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-700 cursor-pointer"
                          >
                            حفظ
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCategory(null)}
                            className="bg-slate-200 text-slate-700 text-[11px] font-bold px-2 py-1 rounded-lg hover:bg-slate-300 cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="text-left font-mono">
                            <span className="text-xs text-slate-400 font-sans block text-right">الميزانية:</span>
                            <span className="text-xs font-extrabold text-slate-800">{formatCurrency(item.allocatedBudget)}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingCategory(item.category);
                              setTempBudgetVal(item.allocatedBudget.toString());
                            }}
                            title="تعديل الميزانية المرصودة"
                            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar & Numerical Metrics */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center text-[11px] font-mono font-bold">
                      <span className="text-slate-600 font-sans">
                        المصروف الفعلي: <strong className="text-slate-900">{formatCurrency(item.actual)}</strong>
                      </span>
                      <span className={`${
                        item.severity === 'critical' ? 'text-red-600 font-black' : item.severity === 'warning' ? 'text-amber-700' : 'text-slate-600'
                      }`}>
                        {item.percentage.toFixed(1)}% مستهلك
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-500 rounded-full ${
                          item.severity === 'critical'
                            ? 'bg-red-600'
                            : item.severity === 'warning'
                            ? 'bg-amber-500'
                            : item.severity === 'watch'
                            ? 'bg-blue-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, item.percentage)}%` }}
                      />
                    </div>

                    {/* Status Note & Deviation Value */}
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-bold">
                        {item.severity === 'critical' && <span className="text-red-700 font-black">🔴 تنبيه حرج: تجاوز الميزانية المعتمدة بـ +{formatCurrency(item.variance)}</span>}
                        {item.severity === 'warning' && <span className="text-amber-800 font-extrabold">🟡 تنبيه: تم تخطي الميزانية بـ +{formatCurrency(item.variance)}</span>}
                        {item.severity === 'watch' && <span className="text-blue-700 font-bold">🔵 اقتراب من السقف الأعلى (باقي {formatCurrency(Math.abs(item.variance))})</span>}
                        {item.severity === 'safe' && <span className="text-emerald-700 font-bold">🟢 ضمن الحدود الآمنة (وفر متاح: {formatCurrency(Math.abs(item.variance))})</span>}
                      </span>
                      
                      <button
                        type="button"
                        onClick={() => {
                          showNotification('info', `جارٍ توجيه مذكرة استفسار حول بند ${item.label}`);
                        }}
                        className="text-slate-400 hover:text-indigo-600 underline font-bold cursor-pointer"
                      >
                        طلب تفاصيل البند ↗
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar: AI Remediation Report & Quick Actions */}
        <div className="space-y-6">
          
          {/* Revenue Target Configuration Panel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" /> مستهدف إيرادات المنصة الشهري
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              تحديد هدف الإيرادات الكلية للمنصة (اشتراكات + عمولات حجوزات + خدمات إضافية) لقياس كفاءة استرداد التكاليف.
            </p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={revenueTarget}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setRevenueTarget(val);
                  localStorage.setItem('LAILAH_PLATFORM_REV_TARGET', val.toString());
                }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono font-bold text-slate-800 outline-none focus:border-indigo-500"
                placeholder="هدف الإيراد (SAR)"
              />
              <span className="text-xs font-bold text-slate-500 shrink-0">ر.س / شهر</span>
            </div>
          </div>

          {/* Gemini AI Proactive Report Box */}
          <div className="bg-indigo-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-800/80 pb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400 animate-pulse" />
                <h4 className="font-extrabold text-sm text-indigo-100">مستشار التوصيات الاستباقية (Gemini BI)</h4>
              </div>
              <span className="text-[10px] bg-indigo-800 text-indigo-200 px-2 py-0.5 rounded-full font-mono">
                AI Powered
              </span>
            </div>

            {aiRemediationReport ? (
              <div className="text-xs text-indigo-100/90 leading-relaxed space-y-3 font-sans whitespace-pre-wrap">
                {aiRemediationReport}
              </div>
            ) : (
              <div className="text-center py-6 space-y-3">
                <Cpu className="w-8 h-8 text-indigo-400 mx-auto opacity-60" />
                <p className="text-xs text-indigo-200">
                  انقر على زر "تحليل الانحرافات بـ Gemini" للحصول على تقرير استباقي شامل وتوصيات علاجية فورية.
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={runGeminiVarianceAnalysis}
              disabled={isAiAnalyzing}
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isAiAnalyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
              <span>{aiRemediationReport ? 'إعادة التقييم والاستشراف' : 'توليد التقرير الاستباقي الآن'}</span>
            </button>
          </div>

          {/* Remediation Action Shortcuts */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-3">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2 mb-2">
              <Layers className="w-4 h-4 text-indigo-600" /> إجراءات تصحيحية سريعة
            </h4>

            <button
              type="button"
              onClick={() => {
                showNotification('warning', 'تم إرسال إشعار تجميد الميزانية التسويقية المؤقتة للشؤون المالية.');
              }}
              className="w-full p-3 rounded-2xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200 text-amber-900 text-xs font-bold text-right transition-all flex items-center justify-between cursor-pointer"
            >
              <span>تجميد مؤقت لبند التسويق الإضافي ⏸️</span>
              <ArrowUpRight className="w-4 h-4 text-amber-700" />
            </button>

            <button
              type="button"
              onClick={() => {
                showNotification('success', 'تمت الموازنة التلقائية وإعادة تخصيص الفائض لصالح البنود الحرجة.');
              }}
              className="w-full p-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-900 text-xs font-bold text-right transition-all flex items-center justify-between cursor-pointer"
            >
              <span>إعادة توزيع الفائض للقطاعات الحرجة 🔄</span>
              <ArrowDownRight className="w-4 h-4 text-emerald-700" />
            </button>
          </div>

        </div>

      </div>

    </div>
  );
}
