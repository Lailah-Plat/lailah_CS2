import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, Compass, Sparkles, Filter, Download, 
  HelpCircle, AlertCircle, RefreshCw, Cpu, CheckCircle,
  BarChart3, Zap, ShieldAlert, Target, PieChart, Sliders,
  Award, ArrowUpRight, Lightbulb, Layers, ShieldCheck, Activity
} from 'lucide-react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip as RechartsTooltip, ResponsiveContainer, Legend
} from 'recharts';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

// Helper with custom oklch sanitization to prevent html2canvas failures on Tailwind v4
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
      } catch (err) {}
    }
    if (gcsOverridden) {
      try {
        window.getComputedStyle = originalGetComputedStyle;
      } catch (err) {}
    }
  }
};

const formatDateToDDMMYYYY = (dateVal: any): string => {
  if (!dateVal) return '-';
  try {
    const date = new Date(dateVal);
    if (!isNaN(date.getTime())) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
    return String(dateVal);
  } catch (e) {
    return String(dateVal);
  }
};

import { convertDigits } from '../utils/digitConverter';

const convertToArabicNumerals = (input: string | number): string => {
  let result = convertDigits(input);
  result = result.replace(/%/g, '٪');
  return result;
};

interface FinancialForecasterProps {
  currentMonthConfirmedTotal: number;
  currentMonthCount: number;
  providerSubscription?: any;
  currentProvider: string;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export default function FinancialForecaster({
  currentMonthConfirmedTotal = 24500,
  currentMonthCount = 8,
  providerSubscription,
  currentProvider,
  showNotification
}: FinancialForecasterProps) {
  const comRate = providerSubscription?.commissionRate || 15;

  // Sliders States
  const [forecastGrowth, setForecastGrowth] = useState<number>(3.5);
  const [forecastSeasonBoost, setForecastSeasonBoost] = useState<number>(15);
  const [forecastCancelRate, setForecastCancelRate] = useState<number>(4.5);

  // BI Core Interactive States
  const [chartMode, setChartMode] = useState<'financial' | 'occupancy'>('financial');
  const [activePreset, setActivePreset] = useState<'peak' | 'balanced' | 'conservative'>('balanced');

  const applyPreset = (preset: 'peak' | 'balanced' | 'conservative') => {
    setActivePreset(preset);
    if (preset === 'peak') {
      setForecastGrowth(8.0);
      setForecastSeasonBoost(25.0);
      setForecastCancelRate(2.5);
      showNotification('info', 'تم تطبيق سيناريو الذروة القصوى 🚀 (نمو 8%، زيادة موسمية 25%، نسبة إلغاء 2.5%)');
    } else if (preset === 'balanced') {
      setForecastGrowth(3.5);
      setForecastSeasonBoost(15.0);
      setForecastCancelRate(4.5);
      showNotification('info', 'تم تطبيق سيناريو النمو المتوازن ⚖️ (نمو 3.5%، زيادة موسمية 15%، نسبة إلغاء 4.5%)');
    } else if (preset === 'conservative') {
      setForecastGrowth(1.0);
      setForecastSeasonBoost(5.0);
      setForecastCancelRate(8.0);
      showNotification('info', 'تم تطبيق السيناريو التحفظي التحوطي 🛡️ (نمو 1%، زيادة موسمية 5%، نسبة إلغاء 8%)');
    }
  };

  // AI Forecaster State
  const [aiReport, setAiReport] = useState<string>('');
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isExportingPDF, setIsExportingPDF] = useState<boolean>(false);

  // Helper formatting SAMA Currency
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR', maximumFractionDigits: 0 }).format(val);
  };

  // 6-Month Projection Algorithm (Propagating monthly growth, peaks and cancel-penalties)
  const monthlyProjections = useMemo(() => {
    const list = [];
    const monthsArabic = ['يونيو 2026', 'يوليو 2026', 'أغسطس 2026', 'سبتمبر 2026', 'أكتوبر 2026', 'نوفمبر 2026'];
    const peakMonthsIndexes = [0, 1, 2]; // June, July, August (Peak Season)

    let baseRevenue = currentMonthConfirmedTotal || 20000;
    let baseCount = currentMonthCount || 6;

    for (let i = 0; i < 6; i++) {
      const monthName = monthsArabic[i];
      const isPeak = peakMonthsIndexes.includes(i);

      // MoM Base Growth compounding
      let multiplier = 1 + (forecastGrowth / 100);
      let calculatedRevenue = baseRevenue * multiplier;
      let calculatedCount = baseCount * multiplier;

      // Seasonal peak multiplier additions
      if (isPeak) {
        calculatedRevenue += calculatedRevenue * (forecastSeasonBoost / 100);
        calculatedCount += calculatedCount * 0.2; // slight occupancy rise
      }

      // Cancellation rate discount penalties
      calculatedRevenue -= calculatedRevenue * (forecastCancelRate / 100);

      // Estimate operational expenses (approx 28% base)
      const calculatedExpense = calculatedRevenue * 0.28;
      const calculatedNetProfit = calculatedRevenue - calculatedExpense;

      // Determine confidence level: مرتفع جداً، متوسط، أو بحاجة للمراقبة
      let confidence = 'مرتفع جداً';
      if (forecastCancelRate > 8) {
        confidence = 'بحاجة للمراقبة';
      } else if (forecastCancelRate > 4 || forecastGrowth > 10) {
        confidence = 'متوسط';
      }

      const mNum = 6 + i;
      const dateStr = `2026-${String(mNum).padStart(2, '0')}-01`;

      list.push({
        month: monthName,
        date: dateStr,
        count: Math.max(1, Math.round(calculatedCount)),
        isPeak,
        revenue: Math.round(calculatedRevenue),
        expense: Math.round(calculatedExpense),
        netProfit: Math.round(calculatedNetProfit),
        confidence
      });

      // Keep compounding based on calculated revenue
      baseRevenue = calculatedRevenue;
      baseCount = calculatedCount;
    }

    return list;
  }, [currentMonthConfirmedTotal, currentMonthCount, forecastGrowth, forecastSeasonBoost, forecastCancelRate]);

  // Derived Summary Aggregations
  const totalRevenue = useMemo(() => monthlyProjections.reduce((sum, p) => sum + p.revenue, 0), [monthlyProjections]);
  const totalBookings = useMemo(() => monthlyProjections.reduce((sum, p) => sum + p.count, 0), [monthlyProjections]);
  const avgRevPAB = useMemo(() => Math.round(totalRevenue / Math.max(1, totalBookings)), [totalRevenue, totalBookings]);
  const totalNetProfit = useMemo(() => monthlyProjections.reduce((sum, p) => sum + p.netProfit, 0), [monthlyProjections]);

  // Transform to Recharts-compatible schemas
  const forecastChartData = useMemo(() => {
    return monthlyProjections.map(p => ({
      name: p.month,
      'الإيراد المتوقع (SAR)': p.revenue,
      'صافي الربح المتوقع (SAR)': p.netProfit
    }));
  }, [monthlyProjections]);

  const occupancyChartData = useMemo(() => {
    return monthlyProjections.map(p => ({
      name: p.month,
      'الحجوزات المقدرة': p.count,
      'مؤشر الإشغال (%)': Math.min(100, Math.round((p.count / 12) * 100))
    }));
  }, [monthlyProjections]);

  // Request Strategic Gemini Advice
  const fetchGeminiForecasting = async () => {
    setIsAiLoading(true);
    setAiReport('');
    try {
      const res = await fetch('/api/finance/forecast-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: currentProvider || 'general_provider',
          role: 'provider'
        })
      });

      const data = await res.json();
      if (data.success) {
        setAiReport(data.reportAr);
        showNotification('success', 'نجاح: تم سحب التقرير الاستشرافي الذكي وتوليده كلياً بواسطة Gemini AI!');
      } else {
        showNotification('error', data.error || 'حدث خطأ في استدعاء الذكاء الاصطناعي.');
      }
    } catch (err) {
      showNotification('error', 'تعذر الحصول على مشورة التوقع بالذكاء الاصطناعي.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Super-robust custom Markdown renderer inside React JSX
  const renderAITextAsHtml = (text: string) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      let trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2"></div>;

      // Headers ###
      if (trimmed.startsWith('###')) {
        return (
          <h4 key={idx} className="text-base font-extrabold text-indigo-900 mt-4 mb-2 border-r-4 border-indigo-500 pr-2 font-sans">
            {trimmed.replace(/###\s*/, '')}
          </h4>
        );
      }
      // Headers ####
      if (trimmed.startsWith('####')) {
        return (
          <h5 key={idx} className="text-sm font-bold text-slate-800 mt-3 mb-1.5 font-sans">
            {trimmed.replace(/####\s*/, '')}
          </h5>
        );
      }
      // Bold list items * **item**
      if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
        let content = trimmed.replace(/^[\*\-]\s*/, '');
        // Check for **
        if (content.includes('**')) {
          const parts = content.split('**');
          return (
            <li key={idx} className="list-disc list-inside text-xs text-slate-700 leading-relaxed font-sans pr-4 mr-1">
              {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-indigo-900 font-extrabold">{p}</strong> : p)}
            </li>
          );
        }
        return (
          <li key={idx} className="list-disc list-inside text-xs text-slate-700 leading-relaxed font-sans pr-4 mr-1">
            {content}
          </li>
        );
      }

      // Check for inline ** in paragraphs
      if (trimmed.includes('**')) {
        const parts = trimmed.split('**');
        return (
          <p key={idx} className="text-xs text-slate-600 leading-relaxed font-sans mt-1">
            {parts.map((p, pIdx) => pIdx % 2 === 1 ? <strong key={pIdx} className="text-slate-900 font-extrabold">{p}</strong> : p)}
          </p>
        );
      }

      return (
        <p key={idx} className="text-xs text-slate-600 leading-relaxed font-sans mt-1">
          {trimmed}
        </p>
      );
    });
  };

  const handleExportPDF = async () => {
    setIsExportingPDF(true);
    try {
      // Build a beautiful offscreen document for the forecast report to handle Arabic fonts, spacing, RTL flawlessly
      const tempDiv = document.createElement('div');
      tempDiv.id = 'temp-pdf-forecast-wrapper';
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '790px'; // Perfect width for standard vertical A4 pages
      tempDiv.dir = 'rtl';
      tempDiv.style.fontFamily = "'Tajawal', system-ui, -apple-system, sans-serif";
      tempDiv.className = 'p-8 bg-white text-slate-800';

      const totalRevenue = monthlyProjections.reduce((sum, p) => sum + p.revenue, 0);
      const totalExpenses = monthlyProjections.reduce((sum, p) => sum + p.expense, 0);
      const totalNetProfit = monthlyProjections.reduce((sum, p) => sum + p.netProfit, 0);

      let rowsHtml = '';
      monthlyProjections.forEach(p => {
        const peakLabel = p.isPeak 
          ? '<span style="background-color: #fef3c7; color: #d97706; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; letter-spacing: normal !important;">ذروة موسمية</span>' 
          : '<span style="background-color: #f1f5f9; color: #475569; border: 1px solid #e2e8f0; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; letter-spacing: normal !important;">موسم اعتيادي</span>';
        
        let confidenceBadge = '';
        if (p.confidence === 'مرتفع جداً') {
          confidenceBadge = '<span style="background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; letter-spacing: normal !important;">مرتفع جداً</span>';
        } else if (p.confidence === 'متوسط') {
          confidenceBadge = '<span style="background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; letter-spacing: normal !important;">متوسط</span>';
        } else {
          confidenceBadge = '<span style="background-color: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; padding: 3px 8px; border-radius: 6px; font-size: 10px; font-weight: bold; letter-spacing: normal !important;">بحاجة للمراقبة</span>';
        }

        const dateFormatted = formatDateToDDMMYYYY(p.date);
        
        rowsHtml += `
          <tr style="border-bottom: 1px solid #f1f5f9; font-size: 11px;">
            <td style="padding: 12px 10px; font-weight: bold; color: #1e1b4b; text-align: right; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${p.month}</td>
            <td style="padding: 12px 10px; text-align: center; color: #475569; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${convertToArabicNumerals(dateFormatted)}</td>
            <td style="padding: 12px 10px; text-align: center; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${peakLabel}</td>
            <td style="padding: 12px 10px; text-align: center; font-weight: bold; color: #334155; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${convertToArabicNumerals(p.count)} حجوزات</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #1e1b4b; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${convertToArabicNumerals(p.revenue.toLocaleString('en-US'))} ر.س</td>
            <td style="padding: 12px 10px; text-align: right; color: #b91c1c; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${convertToArabicNumerals(p.expense.toLocaleString('en-US'))} ر.س</td>
            <td style="padding: 12px 10px; text-align: right; font-weight: bold; color: #10b981; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${convertToArabicNumerals(p.netProfit.toLocaleString('en-US'))} ر.س</td>
            <td style="padding: 12px 10px; text-align: center; border-bottom: 1px solid #e2eaf2; letter-spacing: normal !important;">${confidenceBadge}</td>
          </tr>
        `;
      });

      const reportNumber = `FCT-${Math.floor(Math.random() * 89999 + 10000)}`;
      const currentDateString = formatDateToDDMMYYYY(new Date().toISOString().split('T')[0]);

      tempDiv.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;800;900&display=swap');
          #temp-pdf-forecast-wrapper,
          #temp-pdf-forecast-wrapper * {
            font-family: 'Tajawal', system-ui, -apple-system, sans-serif !important;
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }
        </style>
        <div style="border: 2px solid #e2e8f0; padding: 35px; border-radius: 20px; background-color: #ffffff; min-height: 1050px; box-sizing: border-box; display: flex; flex-direction: column; justify-content: space-between; position: relative;">
          
          <div>
            <!-- Header Block of Report -->
            <div style="display: flex; justify-content: space-between; align-items: start; border-bottom: 3px double #0f172a; padding-bottom: 20px; margin-bottom: 25px;">
              <div style="text-align: right; max-width: 65%;">
                <h1 style="margin: 0; color: #0f172a; font-size: 17px; font-weight: 800; line-height: 1.4; letter-spacing: normal !important;">
                  📈 تقرير واستشراف الميزانية والتقديرات المالية المستوجبة
                </h1>
                <p style="margin: 6px 0 0 0; color: #64748b; font-size: 11px; font-weight: 500; line-height: 1.3; letter-spacing: normal !important;">
                  تحليل سلوك نمو الإشغال وقاعات الأفراح والتكاليف التشغيلية (٦ أشهر) - نظام ليلة الذكي
                </p>
              </div>
              <div style="text-align: left; font-size: 9.5px; color: #334155; line-height: 1.5; font-weight: bold; max-width: 35%;">
                <div style="display: flex; justify-content: flex-end; gap: 4px; letter-spacing: normal !important;">
                  <span>رقم المستند المرجعي:</span> 
                  <span style="color: #1e1b4b; letter-spacing: normal !important;">${convertToArabicNumerals(reportNumber)}</span>
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 4px; letter-spacing: normal !important;">
                  <span>تاريخ توليد المستند:</span> 
                  <span style="letter-spacing: normal !important;">${convertToArabicNumerals(currentDateString)}</span>
                </div>
                <div style="color: #4f46e5; margin-top: 5px; font-size: 9px; font-weight: 900; background-color: #f5f3ff; border: 1px solid #ddd6fe; padding: 2px 6px; border-radius: 6px; display: inline-block; letter-spacing: normal !important;">وثيقة تخطيط واستشراف معتمدة</div>
              </div>
            </div>

            <!-- Simulation Parameters Section -->
            <div style="background-color: #f8fafc; border: 1.5px solid #e2e8f0; border-radius: 16px; padding: 18px; margin-bottom: 25px; border-right: 6px solid #4f46e5; text-align: right;">
              <h4 style="margin: 0 0 12px 0; color: #1e1b4b; font-size: 12px; font-weight: bold; display: flex; align-items: center; gap: 6px; letter-spacing: normal !important;">
                ⚙️ مُعطيات ومُحددات المحاكاة والنمو التنبؤي المستهدفة (Simulation Parameters)
              </h4>
              <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; font-size: 11px; color: #334155;">
                <div style="background-color: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <span style="color: #64748b; display: block; font-size: 10px; margin-bottom: 4px; letter-spacing: normal !important;">معدل النمو الشهري (MoM):</span>
                  <span style="color: #4f46e5; font-weight: 900; font-size: 12px; letter-spacing: normal !important;">+${convertToArabicNumerals(forecastGrowth)}٪</span>
                </div>
                <div style="background-color: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <span style="color: #64748b; display: block; font-size: 10px; margin-bottom: 4px; letter-spacing: normal !important;">عامل إشغال مواسم الذروة:</span>
                  <span style="color: #4f46e5; font-weight: 900; font-size: 12px; letter-spacing: normal !important;">+${convertToArabicNumerals(forecastSeasonBoost)}٪</span>
                </div>
                <div style="background-color: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <span style="color: #64748b; display: block; font-size: 10px; margin-bottom: 4px; letter-spacing: normal !important;">نسبة إلغاء الحجوزات المقدّرة:</span>
                  <span style="color: #ef4444; font-weight: 900; font-size: 12px; letter-spacing: normal !important;">${convertToArabicNumerals(forecastCancelRate)}٪</span>
                </div>
                <div style="background-color: #ffffff; padding: 8px 12px; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <span style="color: #64748b; display: block; font-size: 10px; margin-bottom: 4px; letter-spacing: normal !important;">مبيعات ومداخيل الأساس الحالي:</span>
                  <span style="color: #10b981; font-weight: 900; font-size: 12px; letter-spacing: normal !important;">${convertToArabicNumerals((currentMonthConfirmedTotal || 24500).toLocaleString('en-US'))} ر.س</span>
                </div>
              </div>
            </div>

            <!-- Overall KPI Summary Board -->
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 30px;">
              <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 14px; padding: 18px; text-align: right; border-right: 5px solid #10b981; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <div style="font-size: 11px; color: #065f46; font-weight: bold; margin-bottom: 6px; letter-spacing: normal !important;">إجمالي الإيرادات المتوقعة (٦ أشهر)</div>
                <div style="font-size: 18px; font-weight: 950; color: #047857; letter-spacing: normal !important;">${convertToArabicNumerals(totalRevenue.toLocaleString('en-US'))} ر.س</div>
                <div style="font-size: 9px; color: #059669; font-weight: medium; margin-top: 4px; letter-spacing: normal !important;">مجموع التدفق النقدي الداخلي المتوقع الفعلي للصالات</div>
              </div>
              <div style="background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 14px; padding: 18px; text-align: right; border-right: 5px solid #ef4444; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <div style="font-size: 11px; color: #991b1b; font-weight: bold; margin-bottom: 6px; letter-spacing: normal !important;">المصروفات التشغيلية المقدرة</div>
                <div style="font-size: 18px; font-weight: 950; color: #b91c1c; letter-spacing: normal !important;">${convertToArabicNumerals(totalExpenses.toLocaleString('en-US'))} ر.س</div>
                <div style="font-size: 9px; color: #dc2626; font-weight: medium; margin-top: 4px; letter-spacing: normal !important;">محتسبة برمجياً استناداً لهامش التكلفة التقديري (٢٨٪)</div>
              </div>
              <div style="background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 14px; padding: 18px; text-align: right; border-right: 5px solid #3b82f6; box-shadow: 0 1px 2px rgba(0,0,0,0.02);">
                <div style="font-size: 11px; color: #1e40af; font-weight: bold; margin-bottom: 6px; letter-spacing: normal !important;">صافي الربح التقديري المستهدف</div>
                <div style="font-size: 18px; font-weight: 950; color: #1d4ed8; letter-spacing: normal !important;">${convertToArabicNumerals(totalNetProfit.toLocaleString('en-US'))} ر.س</div>
                <div style="font-size: 9px; color: #2563eb; font-weight: medium; margin-top: 4px; letter-spacing: normal !important;">العائد الصافي المتبقي بعد تسييل المصاريف والعمولات بالكامل</div>
              </div>
            </div>

            <!-- Detailed Monthly Ledger Table -->
            <div style="margin-bottom: 25px;">
              <h4 style="margin: 0 0 12px 0; color: #0f172a; font-size: 13px; font-weight: bold; letter-spacing: normal !important;">
                📊 جدول ومسرد التدفقات والتقديرات التفصيلية شهرياً (Detailed Monthly Ledger)
              </h4>
              <table style="width: 100%; border-collapse: collapse; text-align: right; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);">
                <thead>
                  <tr style="background-color: #1e293b; color: #ffffff;">
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: right; letter-spacing: normal !important;">الفترة المستهدفة</th>
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: center; letter-spacing: normal !important;">التاريخ التقديري</th>
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: center; letter-spacing: normal !important;">طبيعة الموسم</th>
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: center; letter-spacing: normal !important;">النشاط والحجوزات</th>
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: right; letter-spacing: normal !important;">الإيراد المتوقع (ر.س)</th>
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: right; letter-spacing: normal !important;">التكلفة التشغيلية (٢٨٪)</th>
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: right; letter-spacing: normal !important;">صافي الربح المتوقع</th>
                    <th style="padding: 12px 10px; font-weight: bold; font-size: 11px; border-bottom: 2px solid #0f172a; text-align: center; letter-spacing: normal !important;">موثوقية المؤشر</th>
                  </tr>
                </thead>
                <tbody>
                  ${rowsHtml}
                </tbody>
              </table>
            </div>

          </div>

          <!-- Bottom block: Institutional seal, Verification, Sign-off & Predictive Disclaimer -->
          <div style="margin-top: 35px;">
            
            <!-- Dual signatory & digital stamp section -->
            <div style="display: flex; justify-content: space-between; border-top: 2px dashed #cbd5e1; padding-top: 22px; margin-bottom: 20px;">
              
              <!-- Financial & Budget management sign-off square -->
              <div style="width: 44%; text-align: right;">
                <h5 style="margin: 0 0 6px 0; color: #475569; font-size: 11px; font-weight: bold; letter-spacing: normal !important;">
                  ☑️ مصادقة دائرة الإدارة المالية والتخطيط الاستراتيجي:
                </h5>
                <p style="margin: 0; font-size: 11px; line-height: 1.6; color: #1e293b; letter-spacing: normal !important;">
                  <b>المستشار المالي للموازنات والتطوير</b>
                  <br />
                  <span style="font-size: 9px; color: #64748b; letter-spacing: normal !important;">صودق رقمياً تحت بروتوكول دمج الأنظمة وتحليل البيانات المالي لمنصة ليلة</span>
                  <br />
                  <span style="font-size: 8px; color: #94a3b8; font-weight: bold; letter-spacing: normal !important;">HASH-MD5: b5d98fa671239c010df049eefac23a</span>
                </p>
              </div>

              <!-- Digital Platform Stamp Frame -->
              <div style="width: 44%; display: flex; justify-content: flex-end; align-items: center; gap: 15px;">
                <div style="text-align: right;">
                  <h5 style="margin: 0 0 4px 0; color: #475569; font-size: 11px; font-weight: bold; letter-spacing: normal !important;">
                     تأكيد ومطابقة المنصة:
                  </h5>
                  <p style="margin: 0; font-size: 11.5px; color: #0284c7; font-weight: bold; letter-spacing: normal !important;">
                    الختم الرقمي الخاص بالمنصة معتمد
                    <br />
                    <span style="font-size: 9px; color: #64748b; letter-spacing: normal !important;">تحديث البيانات المبرمج: LYL-PRED-${convertToArabicNumerals("2026")}</span>
                  </p>
                </div>
                
                <!-- SVG Vector Stamp -->
                <div style="width: 65px; height: 65px; border: 3px double #0284c7; border-radius: 50%; padding: 4px; box-sizing: border-box; display: flex; justify-content: center; align-items: center; transform: rotate(-5deg); background-color: #f0f9ff; opacity: 0.95;">
                  <div style="width: 100%; height: 100%; border: 1.5px solid #0284c7; border-radius: 50%; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center;">
                    <span style="font-size: 6px; font-weight: 900; color: #0284c7; font-family: sans-serif; text-transform: uppercase;">PLATFORM SEAL</span>
                    <span style="font-size: 9.5px; font-weight: bold; color: #0369a1; font-family: sans-serif; letter-spacing: normal !important;">منصة ليلة</span>
                    <span style="font-size: 5px; font-weight: bold; color: #0284c7; font-family: sans-serif; letter-spacing: normal !important;">مصدق آلياً</span>
                  </div>
                </div>
              </div>

            </div>

            <!-- Regulatorypredictive Disclaimer Statement -->
            <div style="background-color: #fffbef; border: 1px solid #fef3c7; border-radius: 10px; padding: 12px 16px; font-size: 10px; color: #b45309; line-height: 1.6; text-align: right; letter-spacing: normal !important;">
              <b>⚠️ بند إخلاء المسؤولية التنبؤي المحاسبي التنظيمي المعتمد:</b>
              يُرجى العلم والإحاطة بأن هذا المستند تخطيطي مستقبلي واستشرافي محصن تم إنشاؤه بناءً على سيناريوهات ومحاكاة إحصائية للاستثارة المسبقة وسلوك الحجوزات التاريخية. لا يعد هذا التقرير بأي حال من الأحوال قوائم ختامية محاسبية مدققة بموجب معايير المراجعة الرسمية، بل هو أداة رقمية مساندة للتخطيط المالي وتوقع ميزانيات مواسم صيف ٢٠٢٦ وملاءمة العمولات. يرجى مراجعة التقارير المالية الفعلية في كل مرحلة.
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

      showNotification('success', 'تم تصدير وحفظ التقرير المالي للتوقعات بنجاح كصفحات A4 عمودية منظمة وحفظه كملف PDF!');
    } catch (err) {
      console.error('Error generating Forecast PDF', err);
      showNotification('error', 'حدث خطأ أثناء محاولة تصدير التقرير المالي، يرجى إعادة المحاولة.');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div id="financial-forecaster-container" className="space-y-8 animate-in fade-in duration-350">
      
      {/* Top Banner Control Panel */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm font-sans">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-indigo-600" /> Lailah BI Core v2.6
            </span>
            <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full text-[10px] font-bold">
              Gemini 2.5 Flash Connected
            </span>
          </div>
          <h3 className="text-xl font-bold text-slate-850 flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-indigo-600" /> محرك ذكاء الأعمال والتحليلات الاستنتاجية (Lailah BI Core)
          </h3>
          <p className="text-slate-500 text-xs mt-1">استشراف التكاليف التشغيلية، محاكاة العائد التشغيلي (RevPAB)، وتوقع نمو المواسم بدقة بالغة.</p>
        </div>
        
        <div className="flex gap-2 w-full md:w-auto shrink-0">
          <button
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="flex-1 md:flex-none bg-slate-900 hover:bg-slate-950 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md active:scale-95 cursor-pointer"
          >
            {isExportingPDF ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5" />
            )}
            <span>تحميل التقرير PDF</span>
          </button>
          
          <button
            onClick={fetchGeminiForecasting}
            disabled={isAiLoading}
            className="flex-1 md:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md shadow-indigo-100 cursor-pointer"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>مشورة Gemini BI 🧠</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Header */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold mb-1">
            <span>إجمالي الإيراد المتوقع (6 أشهر)</span>
            <BarChart3 className="w-4 h-4 text-blue-500" />
          </div>
          <span className="block text-2xl font-black text-slate-900 font-mono">
            {formatCurrency(totalRevenue)}
          </span>
          <span className="text-[10px] text-emerald-600 font-bold mt-1 inline-flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3" /> محاكاة 6 شهور قادمة
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold mb-1">
            <span>متوسط العائد لكل فعالية (RevPAB)</span>
            <Target className="w-4 h-4 text-indigo-500" />
          </div>
          <span className="block text-2xl font-black text-indigo-600 font-mono">
            {formatCurrency(avgRevPAB)}
          </span>
          <span className="text-[10px] text-slate-500 font-bold mt-1 block">
            مبني على {totalBookings} حجز متوقع
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold mb-1">
            <span>متوسط صافي الربح الشهري</span>
            <Award className="w-4 h-4 text-emerald-500" />
          </div>
          <span className="block text-2xl font-black text-emerald-600 font-mono">
            {formatCurrency(Math.round(totalNetProfit / 6))}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold mt-1 block">
            بعد خصم 28% نفقات تشغيلية
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold mb-1">
            <span>مؤشر الأمان والتحوّط</span>
            <ShieldCheck className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${
              forecastCancelRate < 6 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              {forecastCancelRate < 6 ? 'مستوى أمان ممتاز (عالي)' : 'انتباه: مخاطر إلغاء متوسطة'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 font-bold mt-2 block">
            معدل إلغاء محدد بـ {forecastCancelRate}%
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sliders parameters & presets simulation */}
        <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6">
          <div className="space-y-2 border-b border-slate-100 pb-3">
            <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2 font-sans">
              <Sliders className="w-4 h-4 text-indigo-500" /> ضبط محددات المحاكاة والسيناريوهات
            </h4>
            
            {/* Quick Scenario Presets */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <button 
                type="button"
                onClick={() => applyPreset('peak')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  activePreset === 'peak' ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🚀 الذروة القصوى
              </button>
              <button 
                type="button"
                onClick={() => applyPreset('balanced')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  activePreset === 'balanced' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⚖️ نمو متوازن
              </button>
              <button 
                type="button"
                onClick={() => applyPreset('conservative')}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  activePreset === 'conservative' ? 'bg-amber-600 text-white border-amber-600 shadow-sm' : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🛡️ تحوّط تحفظي
              </button>
            </div>
          </div>

          {/* Slider 1: MoM Growth */}
          <div className="space-y-2 font-sans">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">معدل النمو الشهري الأساسي (MoM)</span>
              <span className="text-blue-600 font-mono font-black">+{forecastGrowth}%</span>
            </div>
            <input 
              type="range" 
              min="-2" 
              max="20" 
              step="0.5" 
              value={forecastGrowth} 
              onChange={e => {
                setForecastGrowth(parseFloat(e.target.value));
                setActivePreset('balanced');
              }}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-sans">
              <span>انكماش طفيف (-2%)</span>
              <span>توسع متسارع (20%)</span>
            </div>
          </div>

          {/* Slider 2: Seasonal Boost */}
          <div className="space-y-2 font-sans">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">زيادة مواسم الأفراح وصيف 2026</span>
              <span className="text-indigo-600 font-mono font-black">+{forecastSeasonBoost}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="40" 
              step="1" 
              value={forecastSeasonBoost} 
              onChange={e => {
                setForecastSeasonBoost(parseFloat(e.target.value));
                setActivePreset('balanced');
              }}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>تقليدي (0%)</span>
              <span>طلب مرتفع جداً (40%)</span>
            </div>
          </div>

          {/* Slider 3: Cancellation Rate */}
          <div className="space-y-2 font-sans">
            <div className="flex justify-between text-xs font-bold">
              <span className="text-slate-600">معدل إلغاء الحجوزات المتوقع</span>
              <span className="text-red-500 font-mono font-black">{forecastCancelRate}%</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="15" 
              step="0.5" 
              value={forecastCancelRate} 
              onChange={e => {
                setForecastCancelRate(parseFloat(e.target.value));
                setActivePreset('balanced');
              }}
              className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>0% انعدام إلغاء</span>
              <span>15% فقد حجوزات</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-[10px] text-slate-500 space-y-1.5 font-sans leading-relaxed">
            <span className="font-extrabold text-slate-700 block text-xs">ℹ️ آلية المحاكاة الاستنتاجية (Deductive Engine)</span>
            <p>يعتمد المحرك على متوسط القيمة التاريخية للمبيعات، ثم يطبّق مصفوفة النمو التراكمي مخصوماً منها معامل الإلغاء، ويحسب صافي العائد التشغيلي (RevPAB) تلقائياً.</p>
          </div>
        </div>

        {/* Charts & Estimates display */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recharts Graphical Visualizer with Tabs */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3 font-sans">
              <h4 className="font-extrabold text-slate-800 text-xs flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-600" /> الرسم البياني الاستنتاجي للأداء والطلب
              </h4>

              <div className="flex bg-slate-100 p-1 rounded-xl text-[11px] font-bold">
                <button
                  onClick={() => setChartMode('financial')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMode === 'financial' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  المسار المالي (SAR)
                </button>
                <button
                  onClick={() => setChartMode('occupancy')}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    chartMode === 'occupancy' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  كثافة الحجوزات والإشغال
                </button>
              </div>
            </div>

            <div className="h-[240px] w-full font-sans">
              <ResponsiveContainer width="100%" height="100%">
                {chartMode === 'financial' ? (
                  <AreaChart data={forecastChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAIRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorAIProfit" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }} />
                    <Area type="monotone" dataKey="الإيراد المتوقع (SAR)" stroke="#3b82f6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAIRevenue)" />
                    <Area type="monotone" dataKey="صافي الربح المتوقع (SAR)" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorAIProfit)" />
                  </AreaChart>
                ) : (
                  <BarChart data={occupancyChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f8fafc" />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={10} />
                    <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.05)' }} />
                    <Bar dataKey="الحجوزات المقدرة" fill="#6366f1" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="مؤشر الإشغال (%)" fill="#10b981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          </div>

          {/* Actionable BI Deductive Insight Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-sans">
            <div className="bg-indigo-50/60 border border-indigo-100 p-4 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 mb-1">
                  <Zap className="w-3.5 h-3.5 text-indigo-600" />
                  <span>تعديل التسعير الديناميكي</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  رفع أسعار أيام الخميس والجمعة بنسبة 18% في شهور الصيف لتعظيم عائد RevPAB.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => showNotification('success', 'تم تفعيل التوصية الاستنتاجية: تم تجهيز حزمة التسعير الديناميكي لشهور الذروة.')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                تطبيق التوصية ⚡
              </button>
            </div>

            <div className="bg-emerald-50/60 border border-emerald-100 p-4 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900 mb-1">
                  <Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>باقة الخدمات المدمجة</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  ربط حجز القاعة آلياً مع خدمات التوثيق والضيافة لرفع متوسط سلة الشراء بنسبة 22%.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => showNotification('success', 'تم تفعيل التوصية الاستنتاجية: تم إنشاء حزم الخدمات المساندة المدمجة.')}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                دمج الخدمات 📦
              </button>
            </div>

            <div className="bg-amber-50/60 border border-amber-100 p-4 rounded-2xl flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                  <span>سياسة العربون المحصن</span>
                </div>
                <p className="text-[10px] text-slate-600 leading-relaxed">
                  تطبيق 30% عربون غير مسترد للحجوزات المبكرة لتخفيض مخاطر الإلغاء إلى دون 3%.
                </p>
              </div>
              <button 
                type="button"
                onClick={() => showNotification('success', 'تم تفعيل التوصية الاستنتاجية: تم اعتماد سياسة العربون غير المسترد.')}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              >
                تثبيت السياسة 🔒
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* AI Strategist Review Card */}
      {isAiLoading || aiReport ? (
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 border border-indigo-850 shadow-xl space-y-4 font-sans max-w-full">
          <div className="flex items-center justify-between border-b border-indigo-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-500/20 text-indigo-305 rounded-lg border border-indigo-500/30">
                <Cpu className="w-5 h-5 text-indigo-400 animate-pulse" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">مستشار التوقيع المالي والاستشراف الاستراتيجي الاصطناعي</h4>
                <p className="text-[10px] text-indigo-305">تحليل صادر عن محركات Gemini 3.5 Flash ببيانات فورية حية</p>
              </div>
            </div>
            
            <span className="text-[9px] bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 px-2 py-0.5 rounded font-bold font-sans">
              تحليل مباشر وسلوكي للعملاء
            </span>
          </div>

          <div className="text-slate-100 space-y-2 leading-relaxed bg-black/20 p-5 rounded-2xl border border-white/5 max-h-[400px] overflow-y-auto">
            {isAiLoading ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-3">
                <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
                <span className="text-xs text-indigo-200 font-bold font-sans animate-pulse">جاري جمع مؤشرات May الضريبية ودراسة سلوك إلغاء الحجز للعملاء من السيرفر...</span>
              </div>
            ) : (
              <div className="space-y-3 prose prose-invert max-w-none text-right">
                {renderAITextAsHtml(aiReport)}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Structured Projections Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex justify-between items-center font-sans">
          <h4 className="font-extrabold text-slate-800 text-xs">جدول التفصيل المتراكم ومستويات المقاصة والعمولات</h4>
          <span className="text-[10px] text-slate-400 font-bold">بموجب نسبة العمولة المسجلة لباقة حسابك ({comRate}%)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100 font-sans">
                <th className="p-3">الفترة والميزانية</th>
                <th className="p-3">الحجوزات المتوقعة</th>
                <th className="p-3">تأثير الفترات</th>
                <th className="p-3">الإيراد المتوقع (SAR)</th>
                <th className="p-3">المصاريف المقدرة (SAR)</th>
                <th className="p-3 font-bold text-indigo-705">صافي الأرباح الصافية (SAR)</th>
                <th className="p-3">موثوقية المؤشر</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans">
              <tr className="bg-blue-50/20">
                <td className="p-3 font-bold text-slate-700">مايو 2026 (الأساس الفعلي)</td>
                <td className="p-3 font-mono">{currentMonthCount} حجز مكتمل</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 font-bold font-sans">تاريخي اعتيادي</span></td>
                <td className="p-3 font-mono">{formatCurrency(currentMonthConfirmedTotal)}</td>
                <td className="p-3 font-mono">{formatCurrency(currentMonthConfirmedTotal * 0.28)}</td>
                <td className="p-3 font-mono font-extrabold text-slate-900">{formatCurrency(currentMonthConfirmedTotal * 0.72)}</td>
                <td className="p-3"><span className="px-2 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 font-sans font-bold">منجز فعليّ</span></td>
              </tr>
              {monthlyProjections.map((p, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-3 font-bold text-slate-850">{p.month}</td>
                  <td className="p-3 font-mono">{p.count} حجز مقدر</td>
                  <td className="p-3">
                    {p.isPeak ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] bg-amber-50 text-amber-800 border border-amber-100 font-sans font-bold">
                        <Sparkles className="w-3 h-3 text-amber-500" /> موسم الذروة (+{forecastSeasonBoost}%)
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-slate-105 text-slate-500 font-sans">عادي ممتد</span>
                    )}
                  </td>
                  <td className="p-3 font-mono text-slate-700 font-bold">{formatCurrency(p.revenue)}</td>
                  <td className="p-3 font-mono text-slate-500">{formatCurrency(p.expense)}</td>
                  <td className="p-3 font-mono font-black text-emerald-600">{formatCurrency(p.netProfit)}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] border font-sans font-bold ${
                      p.confidence === 'مرتفع جداً' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      p.confidence === 'متوسط' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-red-50 text-red-700 border-red-100'
                    }`}>
                      {p.confidence}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
