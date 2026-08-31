import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface ProviderPricingEngineProps {
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderPricingEngine({ showNotification }: ProviderPricingEngineProps) {
  const [pricingRules, setPricingRules] = useState<any[]>([
    { id: 'PR-26-00000001', name: 'السعر الأساسي', type: 'base', amount: 15000, appliesTo: 'جميع الأيام', status: 'نشط' },
    { id: 'PR-26-00000002', name: 'سعر عطلة نهاية الأسبوع', type: 'weekend', amount: 18500, appliesTo: 'الخميس والجمعة', status: 'نشط' },
    { id: 'PR-26-00000003', name: 'موسم الصيف والمناسبات الكبرى', type: 'seasonal', amount: 20000, appliesTo: 'من 1 يونيو حتى 30 سبتمبر', status: 'معطل' },
    { id: 'PR-26-00000004', name: 'خصم العروض الحصرية للأيام العادية', type: 'deal', amount: 13000, appliesTo: 'أيام الإثنين والثلاثاء', status: 'نشط' },
  ]);

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState<'weekend' | 'seasonal' | 'deal'>('weekend');
  const [newRuleAmount, setNewRuleAmount] = useState('');
  const [newRuleApplies, setNewRuleApplies] = useState('');

  // Simulator state
  const [simBasePrice, setSimBasePrice] = useState('15000');
  const [simDayType, setSimDayType] = useState('weekday');
  const [simSeason, setSimSeason] = useState('normal');
  const [simDeals, setSimDeals] = useState('none');

  const handleAddRule = () => {
    if (!newRuleName || !newRuleAmount) {
      showNotification('warning', 'يرجى كتابة اسم القاعدة والمبلغ المالي.');
      return;
    }
    const newRuleIdNum = pricingRules.length + 1;
    const newRule = {
      id: `PR-26-${String(newRuleIdNum).padStart(8, '0')}`,
      name: newRuleName,
      type: newRuleType,
      amount: parseInt(newRuleAmount),
      appliesTo: newRuleApplies || 'جميع الأيام',
      status: 'نشط',
    };
    setPricingRules([...pricingRules, newRule]);
    setNewRuleName('');
    setNewRuleAmount('');
    setNewRuleApplies('');
    showNotification('success', `تم حفظ وتفعيل قاعدة التسعير الديناميكي بالرقم التسلسلي ${newRule.id}`);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">DYNAMIC PRICING ENGINE</span>
          <h3 className="text-sm font-black text-slate-800">ماتريكس محرك وحساب التسعير الذكي</h3>
        </div>

        <p className="text-xs text-slate-500 leading-relaxed">
          يدعم محرك الأسعار في منصة ليلة تعريف فئات تسعيرية مرنة (سعر الأساس، أسعار المواسم، أسعار نهاية الأسبوع للأيام المزدحمة، وأسعار عروض الأيام الهادئة). يطبق النظام السعر الأعلى تلقائياً وفقاً للتقويم المختار من العميل.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3 font-black">معرّف القاعدة</th>
                <th className="p-3 font-black">اسم فئة السعر</th>
                <th className="p-3 font-black">نوع القاعدة</th>
                <th className="p-3 font-black">القيمة التسعيرية</th>
                <th className="p-3 font-black">فترة التطبيق</th>
                <th className="p-3 font-black">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans">
              {pricingRules.map((rule) => (
                <tr key={rule.id} className="hover:bg-slate-50/50">
                  <td className="p-3 font-mono text-slate-500 font-bold">{rule.id}</td>
                  <td className="p-3 font-extrabold text-slate-800">{rule.name}</td>
                  <td className="p-3 font-bold text-slate-600">
                    {rule.type === 'base' ? 'سعر الأساس' : rule.type === 'weekend' ? 'نهاية الأسبوع' : rule.type === 'seasonal' ? 'موسمي' : 'عرض/خصم'}
                  </td>
                  <td className="p-3 font-mono text-indigo-600 font-black">{formatCurrency(rule.amount)}</td>
                  <td className="p-3 text-slate-500">{rule.appliesTo}</td>
                  <td className="p-3">
                    <button
                      onClick={() => {
                        const updated = pricingRules.map((r) =>
                          r.id === rule.id ? { ...r, status: r.status === 'نشط' ? 'معطل' : 'نشط' } : r
                        );
                        setPricingRules(updated);
                        showNotification('info', 'تم تعديل حالة تفعيل القاعدة بنجاح.');
                      }}
                      className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${
                        rule.status === 'نشط' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {rule.status}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Add Pricing Rule Form */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
          <h4 className="text-xs font-black text-indigo-700">إضافة قاعدة تسعير مخصصة جديدة</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="اسم القاعدة (مثل: تسعيرة عيد الأضحى)"
              value={newRuleName}
              onChange={(e) => setNewRuleName(e.target.value)}
              className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
            />
            <select
              value={newRuleType}
              onChange={(e) => setNewRuleType(e.target.value as any)}
              className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
            >
              <option value="weekend">سعر نهاية الأسبوع</option>
              <option value="seasonal">سعر موسمي</option>
              <option value="deal">عرض / خصم خاص</option>
            </select>
            <input
              type="number"
              placeholder="القيمة السعرية (SAR)"
              value={newRuleAmount}
              onChange={(e) => setNewRuleAmount(e.target.value)}
              className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
            />
            <input
              type="text"
              placeholder="فترة التطبيق (مثل: أيام الأعياد)"
              value={newRuleApplies}
              onChange={(e) => setNewRuleApplies(e.target.value)}
              className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
            />
          </div>
          <button
            onClick={handleAddRule}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            حفظ وتفعيل القاعدة التسعيرية في النظام
          </button>
        </div>
      </div>

      {/* Dynamic Pricing Engine Simulator */}
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <h4 className="text-xs font-black text-slate-400 font-mono">PRICING SIMULATION TOOL</h4>
        <h3 className="text-sm font-black text-slate-800">محاكي حساب التسعيرة الديناميكية الفورية للعملاء</h3>
        <p className="text-[11px] text-slate-500">
          اضبط المعايير التشغيلية أدناه لرؤية كيف يتفاعل نظام حسابات التسعير المدمج ويولد عرض السعر النهائي في ثوانٍ:
        </p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl">
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block">سعر حجز الأساس الأساسي</span>
            <input
              type="number"
              value={simBasePrice}
              onChange={(e) => setSimBasePrice(e.target.value)}
              className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-mono font-black"
            />
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block">طبيعة يوم المناسبة</span>
            <select
              value={simDayType}
              onChange={(e) => setSimDayType(e.target.value)}
              className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right"
            >
              <option value="weekday">يوم عادي في وسط الأسبوع (سعر قياسي)</option>
              <option value="weekend">يوم نهاية أسبوع (خميس/جمعة) (+٢٠٪)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block">الموسمية والطلب</span>
            <select
              value={simSeason}
              onChange={(e) => setSimSeason(e.target.value)}
              className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right"
            >
              <option value="normal">موسم عادي طبيعي</option>
              <option value="high">موسم الأعياد والصيف (+٣٠٪)</option>
            </select>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-400 block">العروض والخصومات</span>
            <select
              value={simDeals}
              onChange={(e) => setSimDeals(e.target.value)}
              className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right"
            >
              <option value="none">بدون أي خصومات إضافية</option>
              <option value="promo">خصم العضوية الحصرية (-١٠٪)</option>
            </select>
          </div>
        </div>

        <div className="bg-indigo-900 text-white p-4 rounded-2xl flex justify-between items-center">
          <div>
            <span className="text-[10px] font-bold text-indigo-200 block">العرض الناتج المقترح للعميل بالريال السعودي:</span>
            <span className="text-xs text-indigo-300">يخضع للضريبة المضافة VAT والرسوم اللوجستية</span>
          </div>
          <div className="text-left">
            <span className="text-2xl font-black font-mono text-yellow-400 block">
              {(() => {
                let price = parseFloat(simBasePrice) || 0;
                if (simDayType === 'weekend') price *= 1.2;
                if (simSeason === 'high') price *= 1.3;
                if (simDeals === 'promo') price *= 0.9;
                return Math.round(price).toLocaleString('ar-SA');
              })()}{' '}
              ر.س
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
