import React from 'react';
import { formatCurrency } from '../../../utils/helpers';

interface ProviderSubscriptionCenterProps {
  providerPlan: 'starter' | 'pro';
  setProviderPlan: (plan: 'starter' | 'pro') => void;
  hasDynamicPricingAccess: boolean;
  setPurchasedDynamicPricingAddon: (val: boolean) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderSubscriptionCenter({
  providerPlan,
  setProviderPlan,
  hasDynamicPricingAccess,
  setPurchasedDynamicPricingAddon,
  showNotification,
}: ProviderSubscriptionCenterProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">MEMBERSHIP & SUBSCRIPTION</span>
          <h3 className="text-sm font-black text-slate-800">اشتراك المنشأة وباقة تشغيل ERP</h3>
        </div>

        <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl relative overflow-hidden text-right space-y-3">
          <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
          <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">الخطة النشطة</span>
          {providerPlan === 'pro' ? (
            <>
              <h4 className="text-base font-black">الباقة الاحترافية الملكية (Layla Pro ERP)</h4>
              <p className="text-xs text-indigo-100 leading-relaxed max-w-2xl">
                تمنحك الباقة الاحترافية الملكية صلاحيات تشغيل ٢ فرع، و١٠ موظفين، ونظام محرك الأسعار الديناميكي، وميزة تجميع الباقات الجاهزة مع اقتطاع عمولة تشغيلية قدرها <strong className="text-yellow-400">8%</strong> فقط عن كل عملية حجز ناجحة عبر المنصة.
              </p>
            </>
          ) : (
            <>
              <h4 className="text-base font-black">الباقة المبتدئة (Lailah Starter)</h4>
              <p className="text-xs text-indigo-100 leading-relaxed max-w-2xl">
                تمنحك الباقة المبتدئة صلاحيات تشغيل فرع واحد، و٣ موظفين، والكتالوج الأساسي. <strong className="text-yellow-300">لا تشتمل</strong> على نظام محرك الأسعار الديناميكي أو تجميع الباقات الجاهزة، مع عمولة تشغيلية قدرها <strong className="text-yellow-400">12%</strong> لكل حجز. يمكنك الترقية الآن أو شراء الميزة الإضافية بشكل منفصل.
              </p>
            </>
          )}

          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-indigo-800 text-xs">
            <div>
              <span className="text-indigo-200 block text-[10px]">تاريخ انتهاء الفترة</span>
              <span className="font-mono font-bold">٢٠٢٧-٠١-٠١</span>
            </div>
            <div>
              <span className="text-indigo-200 block text-[10px]">مستوى العمولة</span>
              <span className="font-mono font-bold">{providerPlan === 'pro' ? '8% ثابتة' : '12% أساسية'}</span>
            </div>
            <div>
              <span className="text-indigo-200 block text-[10px]">سعر الاشتراك الشهري</span>
              <span className="font-mono font-bold">{providerPlan === 'pro' ? '499 ر.س / شهر' : '199 ر.س / شهر'}</span>
            </div>
          </div>

          <div className="pt-2 flex gap-2">
            {providerPlan === 'starter' ? (
              <button
                type="button"
                onClick={() => {
                  setProviderPlan('pro');
                  showNotification('success', 'تهانينا! تم ترقية اشتراكك للباقة الاحترافية الملكية Layla Pro ERP بنجاح، وتم تفعيل كافة ميزات الذكاء التشغيلي.');
                }}
                className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
              >
                الترقية الآن إلى الباقة الاحترافية الملكية (499 ر.س/شهر)
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setProviderPlan('starter');
                  showNotification('info', 'تم التبديل إلى الباقة المبتدئة Lailah Starter بنجاح لتجربة واختبار الميزات المقفلة.');
                }}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                تراجع إلى الباقة المبتدئة (للاختبار والمحاكاة)
              </button>
            )}
          </div>
        </div>

        {/* Bought feature tokens */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-slate-800">شراء ميزات إضافية وتوسيع النظام (ERP Addons)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:border-indigo-200 transition-all">
              <button
                onClick={() => showNotification('success', 'تم شراء وترقية كود التثبيت! ستظهر القاعة كأول نتيجة بحث في مدينتك لمدة ٣٠ يوماً.')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
              >
                شراء بـ 500 ر.س
              </button>
              <div className="text-right">
                <span className="text-xs font-black text-slate-800 block">ترقية الظهور وتثبيت البحث (Featured Booster)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">تثبيت القاعة في أعلى نتائج البحث للعملاء بمدينتك.</span>
              </div>
            </div>

            <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:border-indigo-200 transition-all">
              <button
                onClick={() => showNotification('success', 'تم ترقية الباقة لفرع إضافي! يمكنك الآن إنشاء فرع ثالث في ملف الكوادر.')}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
              >
                شراء بـ 199 ر.س
              </button>
              <div className="text-right">
                <span className="text-xs font-black text-slate-800 block">ترخيص فرع إضافي بالنظام (Extra Branch Slot)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">إضافة وترخيص فرع تشغيلي ثالث بكامل إعداداته.</span>
              </div>
            </div>

            <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:border-indigo-200 transition-all">
              {hasDynamicPricingAccess ? (
                <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-200 shrink-0">
                  مفعل ونشط
                </span>
              ) : (
                <button
                  onClick={() => {
                    setPurchasedDynamicPricingAddon(true);
                    showNotification('success', 'تم شراء وتفعيل ملحق محرك التسعير الديناميكي والذكاء التشغيلي بنجاح!');
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0"
                >
                  شراء بـ 299 ر.س
                </button>
              )}
              <div className="text-right">
                <span className="text-xs font-black text-slate-800 block">ملحق التسعير الديناميكي (Dynamic Pricing)</span>
                <span className="text-[10px] text-slate-400 block mt-0.5">تفعيل قواعد تعديل الأسعار للمواسم والكميات لخدماتك.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Unified invoice table with compliant ID: INV-YYXXXXXXXXXX */}
        <div className="pt-4 border-t border-slate-50 space-y-3">
          <h4 className="text-xs font-black text-slate-800">فواتير اشتراكات النظام المالي ERP (قالب الفاتورة الضريبية)</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                <tr>
                  <th className="p-3 font-black">رقم الفاتورة الضريبية</th>
                  <th className="p-3 font-black">البيان والتفاصيل</th>
                  <th className="p-3 font-black">المبلغ الكلي</th>
                  <th className="p-3 font-black">ضريبة VAT 15%</th>
                  <th className="p-3 font-black text-center">حالة السداد</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 font-sans">
                <tr>
                  <td className="p-3 font-mono font-black text-indigo-600">INV-260000000001</td>
                  <td className="p-3 text-slate-800">اشتراك منصة ليلة ERP - الباقة الاحترافية (شهر يوليو)</td>
                  <td className="p-3 font-mono text-slate-800 font-bold">{formatCurrency(499)}</td>
                  <td className="p-3 font-mono text-slate-500">{formatCurrency(74.85)}</td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">
                      مسددة بالكامل
                    </span>
                  </td>
                </tr>
                <tr>
                  <td className="p-3 font-mono font-black text-indigo-600">INV-260000000002</td>
                  <td className="p-3 text-slate-800">شراء كود ترويج وتثبيت البحث لشهر أغسطس</td>
                  <td className="p-3 font-mono text-slate-800 font-bold">{formatCurrency(500)}</td>
                  <td className="p-3 font-mono text-slate-500">{formatCurrency(75)}</td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">
                      مسددة بالكامل
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
