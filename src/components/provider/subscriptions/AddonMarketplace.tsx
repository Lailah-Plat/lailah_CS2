import React from 'react';
import { 
  Sparkles, 
  Zap, 
  Check, 
  Layers, 
  DollarSign, 
  Plus 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface AddonMarketplaceProps {
  hasDynamicPricing: boolean;
  onPurchaseAddon?: (addonId: string) => void;
}

export const AddonMarketplace: React.FC<AddonMarketplaceProps> = ({
  hasDynamicPricing,
  onPurchaseAddon,
}) => {
  const addons = [
    {
      id: 'dynamic-pricing',
      title: 'محرك التسعير الديناميكي ومضاعفات الذروة',
      description: 'ضبط تسعيرة نهاية الأسبوع والمواسم آلياً بناءً على نسب الإشغال ونبض الطلب الميداني.',
      price: 150,
      period: 'شهرياً',
      isPurchased: hasDynamicPricing,
    },
    {
      id: 'sms-vip',
      title: 'حزمة رسائل SMS التفاعلية وتذكير الضيوف',
      description: 'إرسال باركود الدخول وتأكيدات الحجز عبر الرسائل النصية القصيرة ذات الهوية المخصصة.',
      price: 99,
      period: 'لكل 1000 رسالة',
      isPurchased: false,
    },
    {
      id: 'branch-addon',
      title: 'إضافة فرع أو قاعة إضافية لنظام ERP',
      description: 'توسيع سعة النظام لإدارة قاعة جديدة تحت نفس السجل التجاري والملف الضريبي.',
      price: 199,
      period: 'شهرياً',
      isPurchased: false,
    },
  ];

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            <span>سوق القدرات والميزات الإضافية (Capability Marketplace)</span>
          </h4>
          <p className="text-[10px] text-slate-400">تفعيل وحدات إضافية حسب احتياج قاعتك مع الحفاظ التام على قواعد العمولة</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {addons.map((addon) => (
          <div
            key={addon.id}
            className={`p-4 rounded-2xl border flex flex-col justify-between space-y-3 ${
              addon.isPurchased
                ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200">{addon.title}</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">{addon.description}</p>
            </div>

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrency(addon.price)}
                </span>
                <span className="text-[9px] text-slate-400 block">{addon.period}</span>
              </div>

              {addon.isPurchased ? (
                <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  <span>مفعل لديك</span>
                </span>
              ) : (
                <button
                  onClick={() => onPurchaseAddon && onPurchaseAddon(addon.id)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-xs"
                >
                  شراء وتفعيل
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
