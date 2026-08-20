import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, Zap, Sparkles, Percent, Calendar, 
  Check, Plus, Sliders, AlertCircle, ArrowUpRight, Tag
} from 'lucide-react';

interface DynamicSurgePricingEngineProps {
  halls?: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const DynamicSurgePricingEngine: React.FC<DynamicSurgePricingEngineProps> = ({
  halls = [],
  showNotification
}) => {
  const [activeRules, setActiveRules] = useState<Record<string, boolean>>({
    weekend_surge: true,
    summer_wedding: true,
    midweek_discount: false,
  });

  const [customRules, setCustomRules] = useState<any[]>([
    { id: 'rule-1', name: 'موسم الأعياد واليوم الوطني', multiplier: '+40%', applyTo: 'جميع القاعات', active: true },
    { id: 'rule-2', name: 'حجوزات الشتاء المبكرة', multiplier: '-10%', applyTo: 'القاعات المفتوحة', active: false }
  ]);

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleVal, setNewRuleVal] = useState('+25%');
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);

  const toggleRule = (ruleKey: string, ruleName: string) => {
    setActiveRules(prev => {
      const nextVal = !prev[ruleKey];
      showNotification(
        nextVal ? 'success' : 'info',
        nextVal 
          ? `تم تفعيل قاعدة التسعير الديناميكي: (${ruleName}) بنجاح.` 
          : `تم تعليق أداة التسعير: (${ruleName}).`
      );
      return { ...prev, [ruleKey]: nextVal };
    });
  };

  const handleApplySurgeNow = (ruleTitle: string, percentageStr: string) => {
    showNotification('success', `⚡ تم تطبيق قاعدة التسعير الديناميكي (${ruleTitle} ${percentageStr}) فورياً على أسعار القاعات والخدمات المجدولة.`);
  };

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    const newRule = {
      id: `rule-${Date.now()}`,
      name: newRuleName,
      multiplier: newRuleVal,
      applyTo: 'جميع القاعات والخدمات',
      active: true
    };

    setCustomRules(prev => [...prev, newRule]);
    setNewRuleName('');
    setShowAddRuleModal(false);
    showNotification('success', `تم إضافة قاعدة التسعير الجديدة (${newRuleName}) وتطبيقها بنجاح.`);
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-rose-600 uppercase tracking-wider">Dynamic Surge Pricing Engine</span>
            <span className="text-[10px] bg-rose-50 text-rose-800 border border-rose-200 px-2 py-0.5 rounded-full font-bold">ذكاء تسعيري حسي</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">محرك التسعير الديناميكي وزيادة الذروة</h3>
        </div>

        <button
          onClick={() => setShowAddRuleModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Plus className="w-4 h-4" /> إنشاء قاعدة تسعير مخصصة
        </button>
      </div>

      {/* AI Smart Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        
        {/* Recommendation 1: Weekend Surge */}
        <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl border border-indigo-900 shadow-sm space-y-3 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
              ذروة إشغال (92%) 🔥
            </span>
            <Zap className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <h4 className="text-sm font-black text-white">زيادة نهاية الأسبوع (الخميس والجمعة)</h4>
            <p className="text-xs text-indigo-200 mt-1 font-medium">
              توصية بالرفع بنسبة <span className="text-amber-400 font-black">+35%</span> لارتفاع نسبة الطلب التاريخية.
            </p>
          </div>

          <div className="pt-2 border-t border-indigo-800/60 flex justify-between items-center">
            <span className="text-[11px] text-slate-300 font-mono font-bold">+35% زيادة مفترضة</span>
            <button
              onClick={() => handleApplySurgeNow('زيادة نهاية الأسبوع', '+35%')}
              className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
            >
              تطبيق بنقرة واحدة
            </button>
          </div>
        </div>

        {/* Recommendation 2: Summer / Wedding Season */}
        <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-800 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-emerald-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
              موسم الأعراس والصيف 💍
            </span>
            <Sparkles className="w-5 h-5 text-emerald-400" />
          </div>

          <div>
            <h4 className="text-sm font-black text-white">تعديل أسعار الأعراس الصيفية</h4>
            <p className="text-xs text-indigo-200 mt-1 font-medium">
              توصية بالرفع بنسبة <span className="text-emerald-400 font-black">+20%</span> لتنشيط باقات الضيافة والتصوير.
            </p>
          </div>

          <div className="pt-2 border-t border-indigo-800/60 flex justify-between items-center">
            <span className="text-[11px] text-slate-300 font-mono font-bold">+20% موسم الأعراس</span>
            <button
              onClick={() => handleApplySurgeNow('موسم الأعراس الصيفية', '+20%')}
              className="px-3 py-1.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
            >
              تطبيق بنقرة واحدة
            </button>
          </div>
        </div>

        {/* Recommendation 3: Midweek Discount */}
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700 shadow-sm space-y-3">
          <div className="flex justify-between items-start">
            <span className="text-[10px] bg-sky-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full">
              تنشيط منتصف الأسبوع ⚡
            </span>
            <Percent className="w-5 h-5 text-sky-400" />
          </div>

          <div>
            <h4 className="text-sm font-black text-white">خصم منتصف الأسبوع (الأحد - الثلاثاء)</h4>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              عرض ترويجي بتخفيض <span className="text-sky-400 font-black">-15%</span> لرفع نسبة ملء القاعات الأسبوعية.
            </p>
          </div>

          <div className="pt-2 border-t border-slate-700 flex justify-between items-center">
            <span className="text-[11px] text-slate-300 font-mono font-bold">-15% خصم ترويجي</span>
            <button
              onClick={() => handleApplySurgeNow('خصم منتصف الأسبوع', '-15%')}
              className="px-3 py-1.5 bg-sky-400 hover:bg-sky-300 text-slate-950 text-xs font-black rounded-xl transition-all cursor-pointer shadow-sm"
            >
              تطبيق بنقرة واحدة
            </button>
          </div>
        </div>

      </div>

      {/* Active Rules List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-700 uppercase tracking-wider">القواعد المفعلة والمخصصة:</h4>
        
        <div className="divide-y divide-slate-100 bg-slate-50 p-4 rounded-2xl border border-slate-200">
          {customRules.map((cr) => (
            <div key={cr.id} className="py-3 flex justify-between items-center text-xs font-bold">
              <div className="flex items-center gap-3">
                <span className="p-2 bg-white rounded-xl border border-slate-200 font-mono text-rose-600 font-black">
                  {cr.multiplier}
                </span>
                <div>
                  <span className="text-slate-900 font-black block">{cr.name}</span>
                  <span className="text-slate-400 font-medium text-[11px]">ينطبق على: {cr.applyTo}</span>
                </div>
              </div>

              <button
                onClick={() => handleApplySurgeNow(cr.name, cr.multiplier)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                تطبيق آلي
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Modal for creating custom rule */}
      {showAddRuleModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="text-base font-black text-slate-900">إضافة قاعدة تسعير مخصصة جديدة</h3>
            
            <form onSubmit={handleCreateRule} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">اسم الموسم أو المفهوم:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: موسم احتفالات التخرج"
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1">نسبة التعديل أو الزيادة:</label>
                <select
                  value={newRuleVal}
                  onChange={(e) => setNewRuleVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-rose-500"
                >
                  <option value="+15%">زيادة +15%</option>
                  <option value="+25%">زيادة +25% (مواسم الذروة)</option>
                  <option value="+35%">زيادة +35% (أعياد ومناسبات كبرى)</option>
                  <option value="-10%">تخفيض -10% (خصم مبكر)</option>
                  <option value="-20%">تخفيض -20% (عروض ترويجية)</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-rose-600 text-white rounded-xl text-xs font-black hover:bg-rose-700 transition-all cursor-pointer"
                >
                  حفظ القاعدة وتفعيلها
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
