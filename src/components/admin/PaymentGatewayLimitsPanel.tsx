import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, CreditCard, Landmark, AlertTriangle, Save, RefreshCw, 
  Lock, ArrowUpRight, CheckCircle2, Sliders, DollarSign, Activity, FileText
} from 'lucide-react';

interface PaymentGatewayLimitsPanelProps {
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export default function PaymentGatewayLimitsPanel({ showNotification }: PaymentGatewayLimitsPanelProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [thresholds, setThresholds] = useState({
    cardMaxPerTransaction: 100000,
    madaMaxPerTransaction: 200000,
    visaMaxPerTransaction: 150000,
    dailyMerchantLimit: 500000,
    manualReviewThreshold: 50000,
    bankTransferRequiredThreshold: 100000,
    dataRetentionDays: 365,
    gateways: {
      moyasar: { name: 'ميسر (Moyasar)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'low' },
      paytabs: { name: 'بي تابس (PayTabs)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'medium' },
      hyperpay: { name: 'هايبر باي (HyperPay)', enabled: true, maxTransaction: 150000, dailyLimit: 1000000, riskLevel: 'low' },
      geidea: { name: 'جاليري جيديا (Geidea)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'medium' },
      tap: { name: 'تاب للمدفوعات (Tap)', enabled: true, maxTransaction: 50000, dailyLimit: 250000, riskLevel: 'medium' },
      checkout: { name: 'شيك أوت (Checkout.com)', enabled: true, maxTransaction: 100000, dailyLimit: 500000, riskLevel: 'medium' }
    }
  });

  const fetchThresholds = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/finance/payment-thresholds');
      const data = await res.json();
      if (data.success && data.thresholds) {
        setThresholds(prev => ({
          ...prev,
          ...data.thresholds,
          gateways: { ...prev.gateways, ...(data.thresholds.gateways || {}) }
        }));
      }
    } catch (err) {
      console.error('Failed to load payment thresholds:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThresholds();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/finance/payment-thresholds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ thresholds })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'تم حفظ حدود وقواعد بوابات الدفع بنجاح في قاعدة البيانات السحابية 🟢');
      } else {
        showNotification('error', data.error || 'فشل حفظ الإعدادات');
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ أثناء الحفظ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const updateGatewayField = (gatewayKey: string, field: string, val: any) => {
    setThresholds(prev => ({
      ...prev,
      gateways: {
        ...prev.gateways,
        [gatewayKey]: {
          ...(prev.gateways as any)[gatewayKey],
          [field]: val
        }
      }
    }));
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500 font-bold">جاري تحميل إعدادات حدود بوابات الدفع من السحابة...</div>;
  }

  return (
    <div className="space-y-8 text-right font-sans" dir="rtl">
      {/* Top Banner & Info */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-850 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] px-3 py-1 rounded-full font-bold">
                ضوابط ساما SAMA & إدارة المخاطر
              </span>
              <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] px-3 py-1 rounded-full font-bold">
                حفظ سحابي مباشر ☁️
              </span>
            </div>
            <h3 className="text-xl font-black text-white flex items-center gap-2">
              <CreditCard className="w-6 h-6 text-amber-500 animate-pulse" />
              <span>لوحة تهيئة حدود وسقوف بوابات الدفع وقواعد المخاطر</span>
            </h3>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-3xl">
              تتيح البنوك السعودية عبر تعميم SAMA رفع حد عمليات بطاقات مدى إلى 200,000 ريال والبطاقات الائتمانية حتى 150,000 ريال بناءً على تقييم المخاطر، كما تتيح هذه اللوحة ضبط السقوف التلقائية لإبراز التحويل البنكي المباشر والمراجعة الأمنية للمبالغ العالية.
            </p>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-extrabold text-xs transition-all shadow-lg shrink-0"
          >
            <Save className="w-4 h-4" />
            {saving ? 'جاري الحفظ...' : 'حفظ التغييرات في السحابة'}
          </button>
        </div>
      </div>

      {/* SAMA & Transaction Limits Grid */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center border border-amber-200">
              <Sliders className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">سقوف العمليات بحسب وسيلة الدفع وضوابط SAMA</h4>
              <p className="text-xs text-slate-500">تطبيق الحدود القصوى المتاحة ديناميكياً لتوجيه العميل بأنسب طريقة دفع</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Mada Limit */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600" />
                حد بطاقة (مدى Mada) للمعاملة
              </span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">ساما: حتى 200k</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={thresholds.madaMaxPerTransaction}
                onChange={(e) => setThresholds({ ...thresholds, madaMaxPerTransaction: Number(e.target.value) || 0 })}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-800 outline-none focus:border-amber-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ريال</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              وفق تعميم SAMA، يمكن رفع حد الشراء لبطاقات مدى يومياً حتى 200,000 ريال بناءً على طلب العميل.
            </p>
          </div>

          {/* Visa/MC Limit */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-indigo-600" />
                حد بطاقات فيزا/ماستركارد
              </span>
              <span className="text-[10px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold">حسب حد البطاقة</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={thresholds.visaMaxPerTransaction}
                onChange={(e) => setThresholds({ ...thresholds, visaMaxPerTransaction: Number(e.target.value) || 0 })}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-800 outline-none focus:border-amber-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ريال</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              تعتمد فيزا الائتمانية على الحد الائتماني للبطاقة واجتياز نظام 3D Secure.
            </p>
          </div>

          {/* General Card Ceiling */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-600" />
                السقف العام لعملية البطاقة الواحدة
              </span>
              <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">توجيه ذكي</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={thresholds.cardMaxPerTransaction}
                onChange={(e) => setThresholds({ ...thresholds, cardMaxPerTransaction: Number(e.target.value) || 0 })}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-800 outline-none focus:border-amber-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ريال</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              الحد الافتراضي للمحاولات الفردية قبل المراجعة أو توجيه العميل للتحويل/التقسيط.
            </p>
          </div>

          {/* Daily Merchant Limit */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-blue-600" />
                الحد اليومي التراكمي لحساب التاجر
              </span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded-md font-bold">عقد التاجر</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={thresholds.dailyMerchantLimit}
                onChange={(e) => setThresholds({ ...thresholds, dailyMerchantLimit: Number(e.target.value) || 0 })}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-800 outline-none focus:border-amber-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ريال</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              إجمالي مبيعات منصة ليلة المسموح بها عبر بوابات الإلكترونية خلال 24 ساعة.
            </p>
          </div>

          {/* Manual Review Threshold */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                سقف الفحص الأمني والمراجعة اليدوية
              </span>
              <span className="text-[10px] bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md font-bold">مكافحة الاحتيال</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={thresholds.manualReviewThreshold}
                onChange={(e) => setThresholds({ ...thresholds, manualReviewThreshold: Number(e.target.value) || 0 })}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-800 outline-none focus:border-amber-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ريال</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              المعاملات التي تتجاوز هذا المبلغ تخضع للتحقق الإضافي (AML/Risk Review).
            </p>
          </div>

          {/* Bank Transfer Threshold */}
          <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <Landmark className="w-4 h-4 text-teal-600" />
                سقف إبراز التحويل البنكي المباشر
              </span>
              <span className="text-[10px] bg-teal-100 text-teal-800 px-2 py-0.5 rounded-md font-bold">حجوزات القاعات الضخمة</span>
            </div>
            <div className="relative">
              <input
                type="number"
                value={thresholds.bankTransferRequiredThreshold}
                onChange={(e) => setThresholds({ ...thresholds, bankTransferRequiredThreshold: Number(e.target.value) || 0 })}
                className="w-full p-3 bg-white border border-slate-300 rounded-xl font-mono font-bold text-sm text-slate-800 outline-none focus:border-amber-500"
              />
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">ريال</span>
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              للحجوزات الضخمة (مثل 100,000 ريال فأكثر)، يتم تلقائياً تفعيل خيار التحويل البنكي المباشر بدلاً من قصر الدفع على بطاقات الائتمان.
            </p>
          </div>
        </div>
      </div>

      {/* Gateway Capabilities & Limits Matrix Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h4 className="font-bold text-slate-800 text-base">مصفوفة حدود وسقوف المزودين وبوابات الدفع المسجلة</h4>
            <p className="text-xs text-slate-500">ضبط الحد الأقصى للمعاملة الواحدة والحد اليومي ومستوى المخاطرة لكل بوابة محددة في العقد</p>
          </div>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
              <tr>
                <th className="p-3">اسم بوابة الدفع</th>
                <th className="p-3">حالة التفعيل</th>
                <th className="p-3">حد المعاملة الواحدة (ريال)</th>
                <th className="p-3">الحد اليومي المسموح (ريال)</th>
                <th className="p-3">مستوى المخاطرة (Risk Profile)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {Object.entries(thresholds.gateways || {}).map(([key, gw]: [string, any]) => (
                <tr key={key} className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-slate-800">
                    {gw.name || key}
                  </td>
                  <td className="p-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={gw.enabled ?? true}
                        onChange={(e) => updateGatewayField(key, 'enabled', e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                    </label>
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={gw.maxTransaction || 100000}
                      onChange={(e) => updateGatewayField(key, 'maxTransaction', Number(e.target.value) || 0)}
                      className="w-32 p-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="p-3">
                    <input
                      type="number"
                      value={gw.dailyLimit || 500000}
                      onChange={(e) => updateGatewayField(key, 'dailyLimit', Number(e.target.value) || 0)}
                      className="w-36 p-1.5 border border-slate-300 rounded-lg text-xs font-mono font-bold outline-none focus:border-amber-500"
                    />
                  </td>
                  <td className="p-3">
                    <select
                      value={gw.riskLevel || 'low'}
                      onChange={(e) => updateGatewayField(key, 'riskLevel', e.target.value)}
                      className="p-1.5 border border-slate-300 rounded-lg text-xs font-bold outline-none bg-white"
                    >
                      <option value="low">منخفض (Low Risk)</option>
                      <option value="medium">متوسط (Medium Risk)</option>
                      <option value="high">مرتفع (High Risk Review)</option>
                    </select>
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
