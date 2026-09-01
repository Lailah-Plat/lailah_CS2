import React from 'react';
import { 
  Package, 
  X, 
  Check, 
  ShoppingBag, 
  MessageSquare, 
  Headphones, 
  UserCheck, 
  FileSpreadsheet, 
  TrendingUp, 
  LineChart, 
  Coins, 
  BarChart3, 
  Briefcase, 
  Layers, 
  Truck, 
  CalendarDays, 
  Zap, 
  Repeat, 
  Compass, 
  Store, 
  Lock, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';

interface SubscriptionModalsProps {
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  isSubscriptionViewModalOpen: boolean;
  setIsSubscriptionViewModalOpen: (open: boolean) => void;
  editingItem: any;
  subscriptionForm: any;
  setSubscriptionForm: (form: any) => void;
  viewingSubscription: any;
  subscriptions: any[];
  setSubscriptions: (subs: any[]) => void;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  fetchSubscriptionPlans: () => void;
}

export const SubscriptionModals: React.FC<SubscriptionModalsProps> = ({
  isSubscriptionModalOpen,
  setIsSubscriptionModalOpen,
  isSubscriptionViewModalOpen,
  setIsSubscriptionViewModalOpen,
  editingItem,
  subscriptionForm,
  setSubscriptionForm,
  viewingSubscription,
  subscriptions,
  setSubscriptions,
  showNotification,
  fetchSubscriptionPlans
}) => {
  if (!isSubscriptionModalOpen && !isSubscriptionViewModalOpen) return null;

  return (
    <>
      {/* Subscription Modal */}
      {isSubscriptionModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[92vh] relative border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400">
                  <Package className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingItem ? `تعديل باقة: ${subscriptionForm.name || ''}` : 'إنشاء باقة اشتراك جديدة'}
                  </h3>
                  <p className="text-xs text-slate-300">
                    تحديد الرسوم، النسب، السعات، والميزات الـ 19 المعتمدة للباقة
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsSubscriptionModalOpen(false)} 
                className="bg-slate-800/80 hover:bg-red-500 text-slate-300 hover:text-white border border-slate-700 p-2 rounded-full transition-all"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6 text-right">
              {/* 1. البيانات الأساسية والأسعار */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Coins className="w-4 h-4 text-amber-500" />
                  البيانات الأساسية والأسعار ونسبة العمولة
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم الباقة <span className="text-red-500">*</span></label>
                  <input 
                    type="text" 
                    value={subscriptionForm.name || ''} 
                    onChange={e => setSubscriptionForm({...subscriptionForm, name: e.target.value})} 
                    className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none" 
                    placeholder="مثال: باقة الأعمال المتقدمة"
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">السعر الشهري (ر.س) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={subscriptionForm.priceMonthly ?? ''} 
                      onChange={e => {
                        const monthly = Number(e.target.value);
                        const yearly = subscriptionForm.priceYearly;
                        let discount = 0;
                        if (monthly > 0 && yearly > 0) {
                          discount = Math.round(100 - (yearly / (monthly * 12)) * 100);
                        }
                        setSubscriptionForm({...subscriptionForm, priceMonthly: monthly, discount: discount});
                      }} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">السعر السنوي (ر.س) <span className="text-red-500">*</span></label>
                    <input 
                      type="number" 
                      value={subscriptionForm.priceYearly ?? ''} 
                      onChange={e => {
                        const yearly = Number(e.target.value);
                        const monthly = subscriptionForm.priceMonthly;
                        let discount = 0;
                        if (monthly > 0 && yearly > 0) {
                          discount = Math.round(100 - (yearly / (monthly * 12)) * 100);
                        }
                        setSubscriptionForm({...subscriptionForm, priceYearly: yearly, discount: discount});
                      }} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">نسبة التخفيض السنوي المحسوبة (%)</label>
                    <input 
                      type="number" 
                      value={subscriptionForm.discount ?? 0} 
                      readOnly 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 bg-slate-100 text-slate-600 outline-none cursor-not-allowed font-bold" 
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      نسبة عمولة المنصة (%) <span className="text-red-500">*</span>
                      <span className="text-[10px] text-slate-500 font-normal mr-1">(نسبة الاقتطاع السيادية من الحجوزات والطلبات الناجحة)</span>
                    </label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={subscriptionForm.commissionRate ?? 10} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, commissionRate: Number(e.target.value)})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-amber-300 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none font-black text-amber-900 bg-amber-50/40" 
                      placeholder="10" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">حالة الباقة</label>
                    <select 
                      value={subscriptionForm.status || 'مفعل'} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, status: e.target.value})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-bold"
                    >
                      <option value="مفعل">مفعل (نشط ومتاح)</option>
                      <option value="معطل">معطل (موقوف مؤقتاً)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* 2. الحقول الرقمية لحدود السعة (Capacity Limits) */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                <h4 className="text-sm font-black text-slate-800 flex items-center gap-2 border-b border-slate-200 pb-2">
                  <Layers className="w-4 h-4 text-blue-500" />
                  حدود السعة والأعداد القصوى للمزود (اترك الحقل فارغاً لعدد غير محدود)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأقصى للقاعات</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={subscriptionForm.hallsLimit ?? ''} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, hallsLimit: e.target.value})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none" 
                      placeholder="غير محدود" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">الحد الأقصى للخدمات المساندة</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={subscriptionForm.servicesLimit ?? ''} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, servicesLimit: e.target.value})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none" 
                      placeholder="غير محدود" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">عدد تراخيص الموظفين المستقلة</label>
                    <input 
                      type="number" 
                      min="0" 
                      value={subscriptionForm.staffSeatsLimit ?? ''} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, staffSeatsLimit: e.target.value})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none" 
                      placeholder="غير محدود" 
                    />
                  </div>
                </div>
              </div>

              {/* 2. الحقول الرقمية الأساسية والحدود التشغيلية (الحقول من #1 إلى #4) */}
              <div className="bg-gradient-to-r from-amber-500/10 via-amber-50 to-transparent p-4 rounded-xl border border-amber-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-amber-600" />
                    أولاً: الحقول الرقمية الأساسية والحدود التشغيلية (القيم والسعات)
                  </span>
                  <span className="text-[10px] bg-amber-200 text-amber-900 font-black px-2 py-0.5 rounded-full">الحقول 1 - 4</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      1. نسبة عمولة المنصة (%) <span className="text-rose-500">*</span>
                    </label>
                    <input 
                      type="number" 
                      min="0"
                      max="100"
                      step="0.5"
                      value={subscriptionForm.commissionRate ?? 10} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, commissionRate: Number(e.target.value)})} 
                      className="w-full p-2.5 text-sm font-black rounded-xl border border-amber-300 bg-white focus:border-amber-500 outline-none text-amber-950" 
                      placeholder="10" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      2. حد القاعات والمنشآت
                    </label>
                    <input 
                      type="text" 
                      value={subscriptionForm.hallsLimit ?? ''} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, hallsLimit: e.target.value})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white" 
                      placeholder="غير محدود" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      3. حد الخدمات المساندة
                    </label>
                    <input 
                      type="text" 
                      value={subscriptionForm.servicesLimit ?? ''} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, servicesLimit: e.target.value})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white" 
                      placeholder="غير محدود" 
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      4. تراخيص مقاعد الموظفين
                    </label>
                    <input 
                      type="text" 
                      value={subscriptionForm.staffSeatsLimit ?? ''} 
                      onChange={e => setSubscriptionForm({...subscriptionForm, staffSeatsLimit: e.target.value})} 
                      className="w-full p-2.5 text-sm rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white" 
                      placeholder="غير محدود" 
                    />
                  </div>
                </div>
              </div>

              {/* 3. مصفوفة الميزات والقدرات الـ 21 المعتمدة (مرقمة تسلسلياً من #5 إلى #25) */}
              <div className="space-y-4">
                <h4 className="text-sm font-black text-slate-900 flex items-center justify-between border-b pb-2">
                  <span className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    ثانياً: مربعات الاختيار لميزات الباقة المعتمدة (21 ميزة مسلسلة)
                  </span>
                  <span className="text-[11px] bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded-full font-bold">الميزات #5 إلى #25</span>
                </h4>

                {/* 1️⃣ مجموعة الرقابة المالية ومحركات التسعير والتوليف الذكي (الميزات #5 إلى #12) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-black text-slate-700 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <Coins className="w-4 h-4" />
                      1️⃣ مجموعة الرقابة المالية ومحركات التسعير والتوليف الذكي
                    </span>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded">الميزات 5 - 12</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {/* 5 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesWeekendPricing || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesWeekendPricing: e.target.checked})} 
                        className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">5. تسعير عطلات نهاية الأسبوع والمواسم (الويكند)</span>
                        <span className="text-[10px] text-slate-500">تمكين الشريك من فرض تسعير مخصص لأيام نهاية الأسبوع والمواسم</span>
                      </div>
                    </label>

                    {/* 6 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesDynamicSurgePricing || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesDynamicSurgePricing: e.target.checked})} 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-indigo-950 block">6. محرك التسعير الديناميكي الذكي وزيادة الذروة الآلية</span>
                        <span className="text-[10px] text-slate-500">تطبيق خوارزميات الذروة لرفع الأسعار بناءً على نسب الإشغال والطلب</span>
                      </div>
                    </label>

                    {/* 7 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesPartialPayment || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesPartialPayment: e.target.checked})} 
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-amber-900 block">7. صلاحية تفعيل حجز العربون والدفع المرحلي للعملاء</span>
                        <span className="text-[10px] text-slate-500">إتاحة خيار دفع العربون وجدولة المتبقي للعملاء عند الحجز</span>
                      </div>
                    </label>

                    {/* 8 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.canExportFinancials || subscriptionForm.includesAdvancedExport || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          canExportFinancials: e.target.checked,
                          includesAdvancedExport: e.target.checked
                        })} 
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">8. استعراض وتصدير التقارير المتقدمة والفواتير وكشوفات الحساب</span>
                        <span className="text-[10px] text-slate-500">تصدير PDF/Excel/CSV لتقارير المركز المالي والفواتير والإيرادات</span>
                      </div>
                    </label>

                    {/* 9 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesGrowthCharts || subscriptionForm.includesInteractiveCharts || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          includesGrowthCharts: e.target.checked,
                          includesInteractiveCharts: e.target.checked
                        })} 
                        className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">9. الرسومات البيانية التفاعلية ومؤشرات النمو</span>
                        <span className="text-[10px] text-slate-500">رسومات بيانية تفاعلية لحجم الإيرادات والنمو ومعدلات الأداء</span>
                      </div>
                    </label>

                    {/* 10 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesFinancialForecast || subscriptionForm.includesCashflowForecasting || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          includesFinancialForecast: e.target.checked,
                          includesCashflowForecasting: e.target.checked
                        })} 
                        className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">10. ميزانية التوقعات المالية والتدفقات النقدية الذكية</span>
                        <span className="text-[10px] text-slate-500">محاكاة التدفقات النقدية المستقبلية والتنبؤ الذكي بحجم الإيراد</span>
                      </div>
                    </label>

                    {/* 11 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 bg-indigo-50/30">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.closedBundlesOnly || subscriptionForm.includesHybridHallMarketplace || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          closedBundlesOnly: e.target.checked,
                          includesHybridHallMarketplace: e.target.checked
                        })} 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-indigo-900 block">11. باقات القاعات المغلقة وسوق الإضافات الهجين</span>
                        <span className="text-[10px] text-slate-500">حظر تداخل الخدمات الخارجية مع خدمات القاعة الداخلية وضمان أسبقية البيع</span>
                      </div>
                    </label>

                    {/* 12 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 bg-indigo-50/30">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.openMarketplaceServices || subscriptionForm.includesVendorNetworkIntegration || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          openMarketplaceServices: e.target.checked,
                          includesVendorNetworkIntegration: e.target.checked
                        })} 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-indigo-900 block">12. باقات الخدمات الشاملة وشبكة تكامل الموردين الخارجيين</span>
                        <span className="text-[10px] text-slate-500">إتاحة الربط مع سوق الخدمات المفتوح واقتراح خدمات تكميلية لعملاء الفعاليات</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 2️⃣ مجموعة العمليات الميدانية وهندسة القاعات واللوجستيات (الميزات #13 إلى #19) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-black text-slate-700 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-1.5 text-blue-700">
                      <Package className="w-4 h-4" />
                      2️⃣ مجموعة العمليات الميدانية وهندسة القاعات واللوجستيات
                    </span>
                    <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2 py-0.5 rounded">الميزات 13 - 19</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {/* 13 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesFullManagement || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesFullManagement: e.target.checked})} 
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">13. الإدارة الشاملة المشتركة للقاعات والخدمات المساندة</span>
                        <span className="text-[10px] text-slate-500">إدارة القاعات والخدمات المساندة معاً في لوحة تشغيلية واحدة موحدة</span>
                      </div>
                    </label>

                    {/* 14 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesFloorPlan360 || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesFloorPlan360: e.target.checked})} 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">14. حزمة مخطط القاعة والميدان المتكامل (Floor Plan 360°)</span>
                        <span className="text-[10px] text-slate-500">رسم وتوزيع الطاولات، محاكي السعة 360°، وحاسبة التوزيع الذكي</span>
                      </div>
                    </label>

                    {/* 15 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesSixStages || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesSixStages: e.target.checked})} 
                        className="w-4 h-4 text-cyan-600 rounded border-slate-300 focus:ring-cyan-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">15. نظام دورات الحياة والتشغيل المتقدم (المراحل الست)</span>
                        <span className="text-[10px] text-slate-500">تتبع مراحل الحجز من الطلب حتى التنفيذ والإغلاق والتقييم الميداني</span>
                      </div>
                    </label>

                    {/* 16 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesLogisticsPortal || subscriptionForm.includesLogisticsOperations || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          includesLogisticsPortal: e.target.checked,
                          includesLogisticsOperations: e.target.checked
                        })} 
                        className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">16. مركز العمليات اللوجستية الميدانية للخدمات</span>
                        <span className="text-[10px] text-slate-500">تتبع فرق التوريد والشحن الميداني والسيارات والتجهيز في الفعالية</span>
                      </div>
                    </label>

                    {/* 17 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesInventory || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesInventory: e.target.checked})} 
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">17. نظام إدارة المخزون والمستودعات</span>
                        <span className="text-[10px] text-slate-500">تتبع كميات الأصول، التالف، تنبيهات النواقص وجرد المستودع</span>
                      </div>
                    </label>

                    {/* 18 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesSuppliers || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesSuppliers: e.target.checked})} 
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">18. نظام الموردين والمشتريات والمدفوعات الآجلة</span>
                        <span className="text-[10px] text-slate-500">دليل الموردين، أوامر التوريد ومتابعة الفواتير والمدفوعات الآجلة</span>
                      </div>
                    </label>

                    {/* 19 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 md:col-span-2 bg-blue-50/40">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesCalendarSync || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesCalendarSync: e.target.checked})} 
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-blue-950 block">19. مزامنة التقويم السحابي الخارجي (Google / Apple Calendar)</span>
                        <span className="text-[10px] text-slate-500">مزامنة مواعيد الحجوزات آلياً مع تقاويم الهواتف والبريد الإلكتروني للشركاء</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 3️⃣ مجموعة إدارة علاقات العملاء والدعم الفني والشركاء (الميزات #20 إلى #23) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-black text-slate-700 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-1.5 text-purple-700">
                      <Headphones className="w-4 h-4" />
                      3️⃣ مجموعة إدارة علاقات العملاء والدعم الفني والشركاء
                    </span>
                    <span className="text-[10px] bg-purple-50 text-purple-800 font-bold px-2 py-0.5 rounded">الميزات 20 - 23</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {/* 20 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesDedicatedCRM || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesDedicatedCRM: e.target.checked})} 
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">20. سجل إدارة علاقات عملاء المزود وقوائم الولاء (CRM)</span>
                        <span className="text-[10px] text-slate-500">سجل العملاء الخاص بالمزود، تفضيلاتهم، وسجل حجوزاتهم السابقة</span>
                      </div>
                    </label>

                    {/* 21 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesClientMessagingHub || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesClientMessagingHub: e.target.checked})} 
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 block">21. نظام خدمة عملاء المزود واستقبال المحادثات والاستفسارات</span>
                        <span className="text-[10px] text-slate-500">استقبال استفسارات العملاء والرد الفوري على طلبات التعديل والتخصيص</span>
                      </div>
                    </label>

                    {/* 22 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.hasLiveChatVIP || subscriptionForm.includesLiveChatSupport || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          hasLiveChatVIP: e.target.checked,
                          includesLiveChatSupport: e.target.checked
                        })} 
                        className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-indigo-900 block">22. قناة المحادثة الفورية والدعم الفني المباشر (Live Chat Support)</span>
                        <span className="text-[10px] text-slate-500">دعم مباشر على مدار الساعة عبر الشات الحي المباشر للأولويات العالية</span>
                      </div>
                    </label>

                    {/* 23 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.hasDedicatedAccountManager || subscriptionForm.includesDedicatedAccountManager || false} 
                        onChange={e => setSubscriptionForm({
                          ...subscriptionForm, 
                          hasDedicatedAccountManager: e.target.checked,
                          includesDedicatedAccountManager: e.target.checked
                        })} 
                        className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-purple-900 block">23. تعيين مدير حساب الشريك (Dedicated Account Manager)</span>
                        <span className="text-[10px] text-slate-500">تخصيص مدير حساب تنفيذي لمتابعة التوسعات وتحسين أداء أعمال المزود</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 4️⃣ مجموعة التسويق والترويج والمتاجر (الميزات #24 إلى #26) */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-black text-slate-700 flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className="flex items-center gap-1.5 text-rose-700">
                      <ShoppingBag className="w-4 h-4" />
                      4️⃣ مجموعة التسويق والترويج والمتاجر
                    </span>
                    <span className="text-[10px] bg-rose-50 text-rose-800 font-bold px-2 py-0.5 rounded">الميزات 24 - 26</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 text-xs">
                    {/* 24 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesMarketingAgency || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesMarketingAgency: e.target.checked})} 
                        className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-rose-950 block">24. خدمات وكالة التسويق والحملات الترويجية المدارة</span>
                        <span className="text-[10px] text-slate-500">إدارة الحملات الإعلانية الممولة من فريق تسويق منصة ليلة لزيادة الحجوزات</span>
                      </div>
                    </label>

                    {/* 25 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesMiniProductsStore || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesMiniProductsStore: e.target.checked})} 
                        className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-emerald-950 block">25. متجر المنتجات والمستلزمات المصغر للمزود</span>
                        <span className="text-[10px] text-slate-500">عرض وبيع مستلزمات الحفلات والمنتجات الفورية المرافقة لحجوزات المكان</span>
                      </div>
                    </label>

                    {/* 26 */}
                    <label className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 cursor-pointer border border-transparent hover:border-slate-200 md:col-span-2 bg-amber-50/50">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.includesPostBookingAddons || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, includesPostBookingAddons: e.target.checked})} 
                        className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500 mt-0.5" 
                      />
                      <div>
                        <span className="font-bold text-amber-950 block">26. الطلبات اللاحقة لمتجر المستلزمات (Post-Booking Addons)</span>
                        <span className="text-[10px] text-slate-500">تمكين العميل من إضافة مستلزمات ومنتجات جديدة للحجز المؤكد لاحقاً وفق المهلة المحددة للمنشأة</span>
                      </div>
                    </label>
                  </div>
                </div>

                {/* 🏷️ ثالثاً: حقول تمييز وعرض الباقة التسويقية (#27 إلى #28) */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                  <div className="text-xs font-black text-slate-800 flex items-center justify-between border-b border-slate-200 pb-2">
                    <span className="flex items-center gap-1.5 text-amber-800">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      ثالثاً: حقول تمييز وعرض الباقة التسويقية
                    </span>
                    <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded">الحقول 27 - 28</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* 27 */}
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 cursor-pointer hover:border-amber-400">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.isPopular || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, isPopular: e.target.checked})} 
                        className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500" 
                      />
                      <div>
                        <span className="font-bold text-slate-900 block">27. تمييز كـ "الباقة الأكثر طلباً"</span>
                        <span className="text-[10px] text-slate-500">إبراز الباقة بشارة ملونة وبارزة في واجهة مقارنة الباقات</span>
                      </div>
                    </label>

                    {/* 28 */}
                    <div className="p-2.5 rounded-xl bg-white border border-slate-200">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        28. نص شارة التمييز التسويقية المخصصة
                      </label>
                      <input 
                        type="text" 
                        value={subscriptionForm.planBadgeText || ''} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, planBadgeText: e.target.value})} 
                        className="w-full p-2 text-xs rounded-lg border border-slate-200 focus:border-amber-500 outline-none" 
                        placeholder="مثال: الأكثر طلباً ⭐ أو الخيار الأفضل للمؤسسات 💎" 
                      />
                    </div>
                  </div>

                  <div className="pt-2">
                    <label className="flex items-center gap-2.5 p-2.5 rounded-xl bg-rose-50/60 border border-rose-200 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={subscriptionForm.isHidden || false} 
                        onChange={e => setSubscriptionForm({...subscriptionForm, isHidden: e.target.checked})} 
                        className="w-4 h-4 text-rose-600 rounded border-rose-300 focus:ring-rose-500" 
                      />
                      <span className="font-bold text-rose-800">🔒 باقة مخفية ترويجية مخصصة (للعروض الخاصة والترقيات اليدوية غير المعروضة للعامة)</span>
                    </label>
                  </div>
                </div>

                {/* نص المميزات */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص المميزات الإضافية الظاهرة للمزود (كل ميزة في سطر)</label>
                  <textarea 
                    value={subscriptionForm.features || ''} 
                    onChange={e => setSubscriptionForm({...subscriptionForm, features: e.target.value})} 
                    className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:border-amber-500 outline-none min-h-[90px]" 
                    placeholder="مثال: لوحة تحكم متقدمة&#10;أولوية في الظهور..."
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>التعديل لا يؤثر على المعاملات أو العقود أو الحجوزات المعتمدة والمؤكدة السابقة</span>
              </div>
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsSubscriptionModalOpen(false)} 
                  className="px-4 py-2.5 text-xs font-bold rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
                >
                  إلغاء
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    if (!subscriptionForm.name) {
                      showNotification('error', "الرجاء إدخال اسم الباقة.");
                      return;
                    }
                    if (subscriptionForm.priceMonthly <= 0) {
                      showNotification('error', "الرجاء إدخال سعر شهري صحيح.");
                      return;
                    }
                    
                    const newSubscription = {
                      ...subscriptionForm,
                      id: editingItem ? editingItem.id : ('plan_' + Date.now()),
                      revenue: editingItem ? editingItem.revenue : 0,
                      usersCount: editingItem ? editingItem.usersCount : 0,
                      discount: Math.round(100 - (Number(subscriptionForm.priceYearly) / (Number(subscriptionForm.priceMonthly) * 12)) * 100) || 0
                    };

                    // Sync with Relational Database Table for the manual upgrade select-box
                    fetch('/api/subscriptions/plans', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        name: newSubscription.name,
                        price: newSubscription.priceMonthly || newSubscription.priceYearly,
                        description: `باقة بقيمة ${newSubscription.priceMonthly} ريال شهرياً / ${newSubscription.priceYearly} ريال سنوياً لـ ${newSubscription.name}`,
                        features: {
                          max_halls: newSubscription.hallsLimit ? Number(newSubscription.hallsLimit) : 99,
                          inventory_management: newSubscription.includesInventory,
                          weekend_pricing: !!newSubscription.includesWeekendPricing,
                          dynamic_surge_pricing: !!newSubscription.includesDynamicSurgePricing,
                          marketing_analytics: newSubscription.hasSupport,
                          ...newSubscription
                        },
                        isHidden: Boolean(newSubscription.isHidden)
                      })
                    })
                    .then(r => r.json())
                    .then(d => {
                      if (d.success) {
                        fetchSubscriptionPlans();
                      }
                    })
                    .catch(err => console.error("Error syncing sub plan to DB:", err));

                    if (editingItem) {
                      const updated = subscriptions.map((s: any) => s.id === editingItem.id ? newSubscription : s);
                      setSubscriptions(updated);
                      localStorage.setItem('app_subscriptions', JSON.stringify(updated));
                      showNotification('success', 'تم تحديث مصفوفة الباقة بنجاح');
                    } else {
                      const updated = [newSubscription, ...subscriptions];
                      setSubscriptions(updated);
                      localStorage.setItem('app_subscriptions', JSON.stringify(updated));
                      showNotification('success', 'تم إضافة الباقة الجديدة بالمصفوفة المعتمدة بنجاح');
                    }
                    setIsSubscriptionModalOpen(false);
                  }} 
                  className="px-5 py-2.5 text-xs font-black rounded-xl bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors shadow-sm cursor-pointer"
                >
                  {editingItem ? 'حفظ التعديلات' : 'إضافة الباقة'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Subscription View Modal */}
      {isSubscriptionViewModalOpen && viewingSubscription && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative border border-slate-200">
            <div className="bg-gradient-to-r from-slate-900 to-indigo-950 p-5 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-amber-400" />
                <h3 className="text-base font-black text-white">
                  تفاصيل باقة: {viewingSubscription.name} 
                  {viewingSubscription.isPopular && <span className="text-[10px] bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full font-black mr-2">الأكثر طلباً</span>}
                </h3>
              </div>
              <button 
                onClick={() => setIsSubscriptionViewModalOpen(false)} 
                className="bg-slate-800 text-slate-300 hover:text-white p-1.5 rounded-full transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-right">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 border-b border-slate-100 pb-4">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">السعر الشهري</span>
                  <span className="text-sm font-black text-slate-900">{viewingSubscription.priceMonthly} ر.س</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <span className="text-[10px] text-slate-500 block">السعر السنوي</span>
                  <span className="text-sm font-black text-slate-900">{viewingSubscription.priceYearly} ر.س</span>
                </div>
                <div className="bg-amber-50 p-3 rounded-xl border border-amber-200">
                  <span className="text-[10px] text-amber-800 block font-bold">عمولة المنصة</span>
                  <span className="text-sm font-black text-amber-950">{viewingSubscription.commissionRate ?? 10}%</span>
                </div>
              </div>

              {/* سعة الباقة */}
              <div className="bg-slate-50 p-3 rounded-xl space-y-1.5 text-xs text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">حد القاعات:</span>
                  <span className="font-bold">{viewingSubscription.hallsLimit || 'غير محدود'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">حد الخدمات:</span>
                  <span className="font-bold">{viewingSubscription.servicesLimit || 'غير محدود'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">تراخيص الموظفين:</span>
                  <span className="font-bold">{viewingSubscription.staffSeatsLimit || 'غير محدود'}</span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-slate-800 block mb-2">مميزات الباقة المفعلة:</span>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  {viewingSubscription.features && viewingSubscription.features.split('\n').map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-700 bg-slate-50 p-2 rounded-lg">
                      <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
