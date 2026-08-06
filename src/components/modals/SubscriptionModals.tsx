import React from 'react';
import { Package, X, Check } from 'lucide-react';

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
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-500" />
                {editingItem ? 'تعديل باقة' : 'إضافة باقة جديدة'}
              </h3>
              <button 
                onClick={() => setIsSubscriptionModalOpen(false)} 
                className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">اسم الباقة <span className="text-red-500">*</span></label>
                  <input type="text" value={subscriptionForm.name || ''} onChange={e => setSubscriptionForm({...subscriptionForm, name: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">السعر الشهري (ر.س) <span className="text-red-500">*</span></label>
                    <input type="number" value={subscriptionForm.priceMonthly} onChange={e => {
                      const monthly = Number(e.target.value);
                      const yearly = subscriptionForm.priceYearly;
                      let discount = 0;
                      if (monthly > 0 && yearly > 0) {
                        discount = Math.round(100 - (yearly / (monthly * 12)) * 100);
                      }
                      setSubscriptionForm({...subscriptionForm, priceMonthly: monthly, discount: discount});
                    }} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">السعر السنوي (ر.س) <span className="text-red-500">*</span></label>
                    <input type="number" value={subscriptionForm.priceYearly} onChange={e => {
                      const yearly = Number(e.target.value);
                      const monthly = subscriptionForm.priceMonthly;
                      let discount = 0;
                      if (monthly > 0 && yearly > 0) {
                        discount = Math.round(100 - (yearly / (monthly * 12)) * 100);
                      }
                      setSubscriptionForm({...subscriptionForm, priceYearly: yearly, discount: discount});
                    }} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نسبة عمولة المنصة (%) <span className="text-red-500">*</span></label>
                    <input type="number" value={subscriptionForm.commissionRate || 0} onChange={e => setSubscriptionForm({...subscriptionForm, commissionRate: Number(e.target.value)})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="مثلاً: 10" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">نسبة التخفيض المحسوبة (%)</label>
                    <input type="number" value={subscriptionForm.discount} readOnly className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحالة</label>
                    <select value={subscriptionForm.status || ''} onChange={e => setSubscriptionForm({...subscriptionForm, status: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white">
                      <option value="مفعل">مفعل</option>
                      <option value="معطل">معطل</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأقصى للقاعات (فارغ يعنى غير محدود)</label>
                    <input type="number" min="0" value={subscriptionForm.hallsLimit ?? ''} onChange={e => setSubscriptionForm({...subscriptionForm, hallsLimit: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="غير محدود" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">الحد الأقصى للخدمات المساندة (فارغ يعنى غير محدود)</label>
                    <input type="number" min="0" value={subscriptionForm.servicesLimit ?? ''} onChange={e => setSubscriptionForm({...subscriptionForm, servicesLimit: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="غير محدود" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">عدد تراخيص الموظفين المستقلة للمزود (اترك فارغاً لعدد غير محدود)</label>
                    <input type="number" min="0" value={subscriptionForm.staffSeatsLimit ?? ''} onChange={e => setSubscriptionForm({...subscriptionForm, staffSeatsLimit: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="غير محدود" />
                  </div>
                </div>

                <div className="flex flex-col gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.isPopular} onChange={e => setSubscriptionForm({...subscriptionForm, isPopular: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-700">تمييز كـ "الأكثر طلباً"</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.includesInventory || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesInventory: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-700">تفعيل خيار "إدارة المخزون" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.includesSuppliers || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesSuppliers: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-700">تفعيل خيار "إدارة الموردين" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.canExportFinancials || false} onChange={e => setSubscriptionForm({...subscriptionForm, canExportFinancials: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-700">تفعيل ميزة "استعراض وتصدير الفواتير" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.hasSupport || false} onChange={e => setSubscriptionForm({...subscriptionForm, hasSupport: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-700">تفعيل ميزة "الدعم الفني" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.includesGrowthCharts || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesGrowthCharts: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-700">تفعيل ميزة "الرسومات التفاعلية والنمو" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.includesFinancialForecast || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesFinancialForecast: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-slate-700">تفعيل ميزة "ميزانية التوقعات المالية الذكية" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={subscriptionForm.includesPartialPayment || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesPartialPayment: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-medium text-amber-600 font-bold">تفعيل ميزة "نظام الدفع الجزئي (العربون)" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer border-t border-dashed border-slate-100 pt-2">
                    <input type="checkbox" checked={subscriptionForm.includesAdvancedStats || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesAdvancedStats: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-bold text-slate-800">تفعيل خيار "ميزة لوحة الإحصائيات المتقدمة" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input type="checkbox" checked={subscriptionForm.includesFullManagement || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesFullManagement: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-bold text-slate-800">تفعيل خيار "ميزة الإدارة الشاملة للحجوزات والخدمات" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-dashed border-slate-100 mt-1">
                    <input type="checkbox" checked={subscriptionForm.includesAdvancedProviderDashboard || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesAdvancedProviderDashboard: e.target.checked})} className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" />
                    <span className="text-sm font-bold text-slate-800 font-semibold text-amber-600">تفعيل ميزة "لوحة مزود الخدمة المتقدمة" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-dashed border-slate-100 mt-1">
                    <input type="checkbox" checked={subscriptionForm.includesLogisticsPortal || false} onChange={e => setSubscriptionForm({...subscriptionForm, includesLogisticsPortal: e.target.checked})} className="w-5 h-5 text-emerald-500 rounded border-emerald-300 focus:ring-emerald-500" />
                    <span className="text-sm font-black text-emerald-700">تفعيل ميزة "بوابة الطلبات اللوجستية وإدارة السيولة المتقدمة" في هذه الباقة</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer pt-2 border-t border-dashed border-red-200 mt-2 bg-red-50/50 p-2.5 rounded-lg border border-red-100">
                    <input type="checkbox" checked={subscriptionForm.isHidden || false} onChange={e => setSubscriptionForm({...subscriptionForm, isHidden: e.target.checked})} className="w-5 h-5 text-rose-600 rounded border-rose-300 focus:ring-rose-500" />
                    <span className="text-sm font-extrabold text-rose-700 flex items-center gap-1.5">🔒 باقة مخفية ترويجية مخصصة (تُستخدم فقط لعروض الترقية الخاصة وتغيب عن عيون الشركاء العاديين)</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">المميزات (كل ميزة في سطر)</label>
                  <textarea value={subscriptionForm.features || ''} onChange={e => setSubscriptionForm({...subscriptionForm, features: e.target.value})} className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none min-h-[120px]" placeholder="مثال: خصائص متقدمة..."></textarea>
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end shrink-0 gap-3">
              <button type="button" onClick={() => setIsSubscriptionModalOpen(false)} className="px-6 py-3 rounded-xl font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors">إلغاء</button>
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
                  let featuresStr = subscriptionForm.features || '';
                  if (subscriptionForm.includesAdvancedStats && !featuresStr.includes('ميزة لوحة الإحصائيات المتقدمة')) {
                    featuresStr = featuresStr ? featuresStr + '\nميزة لوحة الإحصائيات المتقدمة' : 'ميزة لوحة الإحصائيات المتقدمة';
                  }
                  if (subscriptionForm.includesFullManagement && !featuresStr.includes('ميزة الإدارة الشاملة للحجوزات والخدمات')) {
                    featuresStr = featuresStr ? featuresStr + '\nميزة الإدارة الشاملة للحجوزات والخدمات' : 'ميزة الإدارة الشاملة للحجوزات والخدمات';
                  }
                  if (subscriptionForm.includesAdvancedProviderDashboard && !featuresStr.includes('تفعيل ميزة لوحة مزود الخدمة المتقدمة')) {
                    featuresStr = featuresStr ? featuresStr + '\nتفعيل ميزة لوحة مزود الخدمة المتقدمة' : 'تفعيل ميزة لوحة مزود الخدمة المتقدمة';
                  }
                  if (subscriptionForm.includesLogisticsPortal && !featuresStr.includes('بوابة الطلبات اللوجستية وإدارة السيولة المتقدمة')) {
                    featuresStr = featuresStr ? featuresStr + '\nبوابة الطلبات اللوجستية وإدارة السيولة المتقدمة' : 'بوابة الطلبات اللوجستية وإدارة السيولة المتقدمة';
                  }
                  const newSubscription = {
                    ...subscriptionForm,
                    features: featuresStr,
                    id: editingItem ? editingItem.id : Date.now(),
                    revenue: editingItem ? editingItem.revenue : 0,
                    usersCount: editingItem ? editingItem.usersCount : 0,
                    discount: Math.round(100 - (subscriptionForm.priceYearly / (subscriptionForm.priceMonthly * 12)) * 100) || 0
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
                        dynamic_pricing: newSubscription.includesSuppliers,
                        marketing_analytics: newSubscription.hasSupport,
                        ...newSubscription
                      },
                      isHidden: Boolean(newSubscription.isHidden)
                    })
                  })
                  .then(r => r.json())
                  .then(d => {
                    if (d.success) {
                      fetchSubscriptionPlans(); // refresh manual upgrades list in other modal!
                    }
                  })
                  .catch(err => console.error("Error syncing sub plan to DB:", err));

                  if (editingItem) {
                    setSubscriptions(subscriptions.map((s: any) => s.id === editingItem.id ? newSubscription : s));
                    showNotification('success', 'تم تحديث الباقة بنجاح');
                  } else {
                    setSubscriptions([newSubscription, ...subscriptions]);
                    showNotification('success', 'تم إضافة الباقة الجديدة بنجاح');
                  }
                  setIsSubscriptionModalOpen(false);
                }} 
                className="px-6 py-3 rounded-xl font-bold bg-amber-500 text-slate-900 hover:bg-amber-600 transition-colors shadow-lg shadow-amber-500/30"
              >
                {editingItem ? 'حفظ التعديلات' : 'إضافة الباقة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Subscription View Modal */}
      {isSubscriptionViewModalOpen && viewingSubscription && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh] relative">
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-center shrink-0">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Package className="w-6 h-6 text-amber-500" />
                باقة: {viewingSubscription.name} {viewingSubscription.isPopular && <span className="text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-bold mr-2">مميزة</span>}
              </h3>
              <button 
                onClick={() => setIsSubscriptionViewModalOpen(false)} 
                className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-2 gap-4 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-xs text-slate-400 block">السعر الشهري</span>
                  <span className="text-lg font-bold text-slate-800">{viewingSubscription.priceMonthly} ر.س</span>
                </div>
                <div>
                  <span className="text-xs text-slate-400 block">السعر السنوي</span>
                  <span className="text-lg font-bold text-slate-800">{viewingSubscription.priceYearly} ر.س</span>
                </div>
              </div>

              <div>
                <span className="text-xs text-slate-400 block mb-2">مميزات الباقة</span>
                <div className="space-y-2">
                  {viewingSubscription.features && viewingSubscription.features.split('\n').map((feature: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-slate-600">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0" />
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
