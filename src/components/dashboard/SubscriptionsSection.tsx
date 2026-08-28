import React, { useState, useEffect, useRef } from 'react';
import { 
  Crown, Box, Users2, FileText, Headset, Coins, Layers, LayoutGrid, List, Table, 
  PackageSearch, CreditCard, Landmark, Upload, Plus, Package, Users, Wallet, Search, 
  Eye, Pencil, Power, Trash2, X
} from 'lucide-react';
import { SubscriptionFlow } from '../../pages/SubscriptionPage';
import { ProviderSubscriptionTabbed } from '../ProviderSubscriptionTabbed';
import { DiscountsManagement } from '../admin/DiscountsManagement';

export const SubscriptionsSection = (props: any) => {
  const {
    userRole,
    currentProviderName,
    providerSubscription,
    getAddonCost,
    getAddonBillingCycle,
    addonViewFormat,
    setAddonViewFormat,
    providerAddonCycles,
    setProviderAddonCycles,
    providerSelectedHalls,
    setProviderSelectedHalls,
    providerSelectedServices,
    setProviderSelectedServices,
    providerSelectedStaffSlots,
    setProviderSelectedStaffSlots,
    providerSelectedInventory,
    setProviderSelectedInventory,
    providerSelectedSuppliers,
    setProviderSelectedSuppliers,
    providerSelectedInvoiceExport,
    setProviderSelectedInvoiceExport,
    providerSelectedSupport,
    setProviderSelectedSupport,
    isAddonCheckoutOpen,
    setIsAddonCheckoutOpen,
    addonPaymentMethod,
    setAddonPaymentMethod,
    isProcessingAddonPayment,
    setIsProcessingAddonPayment,
    setProviderSubscription,
    purchasedStaffSlots,
    setPurchasedStaffSlots,
    showNotification,
    editingItem,
    setEditingItem,
    subscriptionForm,
    setSubscriptionForm,
    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
    adminSubscriptionsTab,
    setAdminSubscriptionsTab,
    subscriptionsSearchQuery,
    setSubscriptionsSearchQuery,
    subscriptionsFilterStatus,
    setSubscriptionsFilterStatus,
    subscriptions,
    setSubscriptions,
    viewingSubscription,
    setViewingSubscription,
    isSubscriptionViewModalOpen,
    setIsSubscriptionViewModalOpen,
    deleteData,
    setDeleteData,
    additionalFeatures,
    setAdditionalFeatures,
    editingAddon,
    setEditingAddon,
    addonForm,
    setAddonForm,
    isAddonModalOpen,
    setIsAddonModalOpen,
    allSubscriptionPlans,
    dbProviderSubscriptions,
    setDbProviderSubscriptions,
    dbHalls,
    dbServices,
    dbStaff,
    halls,
    services,
    staffList,
    formatSmartDate,
    providerStaffList,
    adminActiveGateway,
    discounts,
    setDiscounts,
    formatCurrency
  } = props;

  // The original renderSubscriptions inner function body converted to a component
  if (userRole === "provider") {
      return (
        <ProviderSubscriptionTabbed
          providerSubscription={providerSubscription}
          setProviderSubscription={setProviderSubscription}
          subscriptions={subscriptions}
          additionalFeatures={additionalFeatures}
          purchasedStaffSlots={purchasedStaffSlots}
          setPurchasedStaffSlots={setPurchasedStaffSlots}
          showNotification={showNotification}
          currentProviderName={currentProviderName}
          providerStaffList={providerStaffList}
          adminActiveGateway={adminActiveGateway}
        />
      );
    }

    if ((userRole as string) === "provider_dead_code") {
      const activePackageName = providerSubscription?.packageName_display || providerSubscription?.packageName || 'الباقة المتقدمة';
      const billingCycleText = providerSubscription?.billingCycle === 'yearly' ? 'فوترة سنوية' : 'فوترة شهرية';
      const hallsCapacity = providerSubscription?.hallsLimit === 'unlimited' ? 'غير محدود ♾️' : providerSubscription?.hallsLimit || 'غير محدود';
      const servicesCapacity = providerSubscription?.servicesLimit === 'unlimited' ? 'غير محدود ♾️' : providerSubscription?.servicesLimit || 'غير محدود';
      
      return (
        <div className="space-y-6 animate-in fade-in duration-500 text-right" dir="rtl">
          {/* header */}
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <span className="p-2 bg-amber-500/10 rounded-xl text-amber-600">
                <Crown className="w-6 h-6 animate-pulse" />
              </span>
              إدارة الباقات والاشتراكات لشركاء المنصة 👑
            </h2>
            <p className="text-slate-500 mt-2 text-sm leading-relaxed font-sans">
              هنا يمكنك الاطلاع على تفاصيل وميزات باقتك النشطة حالياً وصلاحيات حسابك الممنوحة من قبل الإدارة.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col - Subscription Details Card */}
            <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-slate-850 shadow-xl space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/20">
                  تفاصيل الاشتراك النشط
                </span>
                <h3 className="text-xl font-bold text-amber-500 mt-3">{activePackageName}</h3>
                <p className="text-slate-400 text-xs mt-1">رقم معرف الاشتراك الفني: <span className="font-mono text-amber-400">#{providerSubscription?.id || '99231'}</span></p>
              </div>

              <div className="space-y-4 text-xs font-medium">
                <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                  <span className="text-slate-400">حالة الباقة الحالية:</span>
                  <span className="flex items-center gap-1.5 text-green-400 font-bold">
                    <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
                    نشط ومفعل ✓
                  </span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                  <span className="text-slate-400">دورة الفوترة المالية:</span>
                  <span className="text-white font-bold">{billingCycleText}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                  <span className="text-slate-400">طاقة استيعاب القاعات:</span>
                  <span className="text-amber-500 font-bold">{hallsCapacity}</span>
                </div>

                <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-2xl border border-slate-800/40">
                  <span className="text-slate-400">طاقة استيعاب الخدمات:</span>
                  <span className="text-amber-500 font-bold">{servicesCapacity}</span>
                </div>
              </div>

              <div className="pt-2">
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl p-4 text-[11px] leading-relaxed">
                  📢 <span className="font-bold text-amber-500">ملاحظة للشركاء:</span> تتم إدارة ترقية الباقات أو تعديل الامتيازات والصلاحيات الحصرية للتعديل والتحكم كلياً بمراجعة وتنسيق مباشر لطلب الشركاء عبر قسم الدعم الفني.
                </div>
              </div>
            </div>

            {/* Right Cols - Subscription Features Grid */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 pb-4 mb-5">
                  <h3 className="text-lg font-bold text-slate-800">
                    قائمة ميزات وصلاحيات اشتراكك المعتمد ⚙️
                  </h3>
                  <p className="text-slate-500 text-xs mt-1">
                    الأدوات والحلول التكنولوجية التنافسية المتاحة كلياً في نظامك في باقة {activePackageName}:
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Feature 1 - Inventory */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-indigo-100 text-indigo-600 rounded-xl shrink-0 mt-0.5">
                      <Box className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-xs sm:text-sm">نظام إدارة المخزون والمستودعات الفورية</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans">
                        تتبع وتوريد السلع وكميات الأدوات والمستلزمات في صالات وأجنحة الزفاف.
                      </p>
                      <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono font-mono">
                        مشمول ونشط ✓
                      </span>
                    </div>
                  </div>

                  {/* Feature 2 - Suppliers */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-amber-100 text-amber-600 rounded-xl shrink-0 mt-0.5">
                      <Users2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-xs sm:text-sm font-sans">نظام إدارة الموردين والطلبيات</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans font-sans">
                        تسجيل الموردين المعتمدين، ربط طلبات الشراء، تتبع دفعات التوريد.
                      </p>
                      <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono font-mono animate-none">
                        مشمول ونشط ✓
                      </span>
                    </div>
                  </div>

                  {/* Feature 3 - Invoices */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-blue-100 text-blue-600 rounded-xl shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-xs sm:text-sm font-sans font-sans">تصدير التقارير والفواتير المالية والمزامنة</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans font-sans">
                        مراجعة التقارير المحاسبية التفصيلية وتصدير كشوفات الفواتير إلى جدول Excel أو PDF للمطابقة المالية السهلة والمستعجلة.
                      </p>
                      <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono font-mono">
                        مشمول ونشط ✓
                      </span>
                    </div>
                  </div>

                  {/* Feature 4 - Headset / Support */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-teal-100 text-teal-600 rounded-xl shrink-0 mt-0.5">
                      <Headset className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-xs sm:text-sm font-sans font-sans">ميزة الدعم الفني والمحادثة المباشرة للشركاء</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans font-sans">
                        تواصل عاجل بأولوية قصوى لحل كافة الاستفسارات المالية والتقنية من قبل مشرفي المنصة على مدار الساعة.
                      </p>
                      <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono font-mono">
                        مشمول ونشط ✓
                      </span>
                    </div>
                  </div>

                  {/* Feature 5 - Dynamic Pricing */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-orange-100 text-orange-600 rounded-xl shrink-0 mt-0.5">
                      <Coins className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-xs sm:text-sm font-sans font-sans">دراسة ومحرك التسعير الديناميكي الذكي للشركاء</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans">
                        تطبيق قواعد الأسعار التغييرية والموسمية الذكية لرفع نسبة الإيرادات ومعدل حجز القاعات والتفاعل.
                      </p>
                      <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono font-mono">
                        مشمول ونشط ✓
                      </span>
                    </div>
                  </div>

                  {/* Feature 6 - Advanced Halls Capacity */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-start gap-4">
                    <div className="p-2.5 bg-purple-100 text-purple-600 rounded-xl shrink-0 mt-0.5">
                      <Layers className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-850 text-xs sm:text-sm font-sans font-sans">طاقة استيعاب لامتناهية لإدارة وتوزيع الصالات والخدمات</h4>
                      <p className="text-[11px] text-slate-500 mt-1 leading-relaxed font-sans">
                        حرية تامة في تخطيط وعرض وإظهار القاعات والأقسام والخدمات التابعة لمشروعكم لتسهيل جذب وتنسيق العملاء.
                      </p>
                      <span className="inline-block mt-2 bg-green-100 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded-full font-mono font-mono">
                        مشمول ونشط ✓
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );

      if (false) {
      let baseTotal = 0;
      let totalDiscount = 0;

      // Calculate totals
      if (providerSelectedHalls > 0) {
        const cost = getAddonCost('halls') * providerSelectedHalls;
        const feat = additionalFeatures.find(f => f.id === 'halls');
        const discPercent = feat ? feat.discount || 0 : 0;
        baseTotal += cost;
        totalDiscount += cost * (discPercent / 100);
      }
      if (providerSelectedServices > 0) {
        const cost = getAddonCost('services') * providerSelectedServices;
        const feat = additionalFeatures.find(f => f.id === 'services');
        const discPercent = feat ? feat.discount || 0 : 0;
        baseTotal += cost;
        totalDiscount += cost * (discPercent / 100);
      }
      if (providerSelectedStaffSlots > 0) {
        const cost = getAddonCost('provider_staff') * providerSelectedStaffSlots;
        const feat = additionalFeatures.find(f => f.id === 'provider_staff');
        const discPercent = feat ? feat.discount || 0 : 0;
        baseTotal += cost;
        totalDiscount += cost * (discPercent / 100);
      }
      ['inventory', 'suppliers', 'invoice_export', 'support'].forEach((id) => {
        const isSelected = 
          (id === 'inventory' && providerSelectedInventory) ||
          (id === 'suppliers' && providerSelectedSuppliers) ||
          (id === 'invoice_export' && providerSelectedInvoiceExport) ||
          (id === 'support' && providerSelectedSupport);
        if (isSelected) {
          const cost = getAddonCost(id);
          const feat = additionalFeatures.find(f => f.id === id);
          const discPercent = feat ? feat.discount || 0 : 0;
          baseTotal += cost;
          totalDiscount += cost * (discPercent / 100);
        }
      });

      const vatAmount = (baseTotal - totalDiscount) * 0.15;
      const finalTotal = baseTotal - totalDiscount + vatAmount;
      const hasYearly = additionalFeatures.some(f => getAddonBillingCycle(f.id) === 'yearly');
      const invoiceCycleLabel = hasYearly ? 'دورة' : 'شهر';

      return (
        <div className="space-y-6 animate-in fade-in duration-500">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm overflow-hidden bg-white">
            <div className="border-b border-slate-100 pb-4 mb-4">
              <h2 className="text-xl font-bold text-slate-800">إدارة الباقة والاشتراك الحالي</h2>
              <p className="text-slate-500 text-xs mt-1 font-sans">باقة مجمعة، يمكنك تصفح الباقات والتعديل مباشرة من هنا:</p>
            </div>
            <SubscriptionFlow 
              embedded={true} 
              packages={subscriptions.filter((s: any) => 
                s.status === 'مفعل' && 
                !s.isHidden && 
                s.id !== 'hidden' && 
                s.name !== 'باقة مخفية ترويجية مخصصة' && 
                !(s.name || '').includes('مخفية')
              )} 
              onSuccess={setProviderSubscription} 
            />
          </div>


          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
            {/* Left: Interactive Additional Features */}
            <div className="xl:col-span-2 space-y-6">
              {/* Card: تفعيل الميزات الإضافية بمقابل مالي */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm bg-white">
                <div className="border-b border-slate-100 pb-5 mb-5 flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <h3 className="text-lg font-black text-slate-800">تفعيل الميزات الإضافية بمقابل مالي</h3>
                    <p className="text-slate-500 text-xs mt-1">تتيح لك الإدارة الترقية السلسة والمستقلة لأي ميزة من الصلاحيات الإضافية على الباقة الحالية وبنفس دورة اشتراكك.</p>
                  </div>

                  <div className="flex items-center gap-2 self-start md:self-auto">
                    <span className="text-slate-400 text-xs font-bold leading-none">تنسيق العرض:</span>
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
                      <button
                        type="button"
                        onClick={() => setAddonViewFormat('grid')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          addonViewFormat === 'grid'
                            ? 'bg-amber-500 text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <LayoutGrid className="w-3.5 h-3.5" /> شبكي
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddonViewFormat('list')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          addonViewFormat === 'list'
                            ? 'bg-amber-500 text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <List className="w-3.5 h-3.5" /> قائمة
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddonViewFormat('table')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                          addonViewFormat === 'table'
                            ? 'bg-amber-500 text-slate-900 shadow-sm'
                            : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <Table className="w-3.5 h-3.5" /> جدولي
                      </button>
                    </div>
                  </div>
                </div>

                {/* Conditional views layout */}
                {addonViewFormat === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {additionalFeatures.map((feat) => {
                      const isServiceAddon = feat.id === 'services';
                      const isHallsAddon = feat.id === 'halls';
                      const isStaffAddon = feat.id === 'provider_staff';
                      const isCheckable = !isServiceAddon && !isHallsAddon && !isStaffAddon;

                      // Pricing specific to billing cycle
                      const isAddonYearly = getAddonBillingCycle(feat.id) === 'yearly';
                      const currentCost = isAddonYearly ? feat.priceYearly : feat.priceMonthly;
                      const finalCostAfterDisc = currentCost * (1 - (feat.discount || 0) / 100);

                      // Check if already subscribed
                      const isAlreadySubscribedBoolean = !isHallsAddon && !isServiceAddon && !isStaffAddon && (
                        providerSubscription?.addons?.includes(feat.id) ||
                        (feat.id === 'inventory' && !!providerSubscription?.includesInventory) ||
                        (feat.id === 'suppliers' && !!providerSubscription?.includesSuppliers) ||
                        (feat.id === 'invoice_export' && !!providerSubscription?.canExportFinancials) ||
                        (feat.id === 'support' && !!providerSubscription?.hasSupport)
                      );
                      const currentActiveQty = isHallsAddon 
                        ? (providerSubscription?.additionalHalls || 0) 
                        : isServiceAddon 
                          ? (providerSubscription?.additionalServices || 0) 
                          : isStaffAddon 
                            ? (providerSubscription?.purchasedStaffSlots || 0) 
                            : 0;

                      return (
                        <div key={feat.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 transition-all hover:shadow-md flex flex-col justify-between relative overflow-hidden group">
                          {feat.discount > 0 && (
                            <span className="absolute top-0 left-0 bg-red-500 text-white font-black text-[10px] px-2.5 py-1 rounded-br-xl select-none">
                              خصم {feat.discount}%
                            </span>
                          )}

                          <div className="mt-2">
                            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                              {isCheckable && (
                                <span className={`w-2 h-2 rounded-full ${isAlreadySubscribedBoolean ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                              )}
                              {feat.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed min-h-[32px]">{feat.description}</p>
                          </div>

                          {/* Billing Cycle Selector for Each Addon */}
                          <div className="mt-3 flex items-center justify-between gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/40">
                            <span className="text-[10px] text-slate-500 font-bold pr-1">دورة الاشتراك:</span>
                            <div className="flex bg-slate-200/50 p-0.5 rounded-lg text-[9px] font-bold">
                              <button
                                type="button"
                                disabled={isAlreadySubscribedBoolean}
                                onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'monthly' }))}
                                className={`px-2 py-1 rounded-md transition-all ${
                                  !isAddonYearly
                                    ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                                    : 'text-slate-500 hover:text-slate-800'
                                } ${isAlreadySubscribedBoolean ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                شهرياً
                              </button>
                              <button
                                type="button"
                                disabled={isAlreadySubscribedBoolean}
                                onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'yearly' }))}
                                className={`px-2 py-1 rounded-md transition-all ${
                                  isAddonYearly
                                    ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                                    : 'text-slate-500 hover:text-slate-800'
                                } ${isAlreadySubscribedBoolean ? 'opacity-50 cursor-not-allowed' : ''}`}
                              >
                                سنوياً
                              </button>
                            </div>
                          </div>

                          {/* Cost detail */}
                          <div className="mt-3 border-t border-slate-200/50 pt-2 flex items-center justify-between">
                            <div>
                              <span className="text-xs text-slate-400 block line-through">
                                {feat.discount > 0 && !isAlreadySubscribedBoolean ? `${currentCost} ر.س` : ''}
                              </span>
                              <span className="text-sm font-black text-slate-800">
                                {isAlreadySubscribedBoolean ? 'مشمول في الاشتراك' : `${finalCostAfterDisc.toFixed(2)} ر.س`}
                                {!isAlreadySubscribedBoolean && <span className="text-[10px] text-slate-400 font-normal font-sans"> / {isAddonYearly ? 'سنوياً' : 'شهرياً'}</span>}
                              </span>
                            </div>

                            {/* Control */}
                            <div>
                              {isHallsAddon && (
                                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200 font-mono font-sans font-sans">
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedHalls(prev => Math.max(0, prev - 1))}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-800 text-sm w-6 text-center">{providerSelectedHalls}</span>
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedHalls(prev => prev + 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {isServiceAddon && (
                                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200 font-mono font-sans font-sans">
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedServices(prev => Math.max(0, prev - 1))}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-800 text-sm w-6 text-center">{providerSelectedServices}</span>
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedServices(prev => prev + 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {isStaffAddon && (
                                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200 font-mono font-sans">
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedStaffSlots(prev => Math.max(0, prev - 1))}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg cursor-pointer"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-800 text-sm w-6 text-center">{providerSelectedStaffSlots}</span>
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedStaffSlots(prev => prev + 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg cursor-pointer"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {isCheckable && (
                                isAlreadySubscribedBoolean ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg text-xs font-black cursor-not-allowed select-none"
                                    title="مفعلة بالباقة أو مشترك بها مسبقاً"
                                  >
                                    تم الاختيار ✓
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (feat.id === 'inventory') setProviderSelectedInventory(!providerSelectedInventory);
                                      if (feat.id === 'suppliers') setProviderSelectedSuppliers(!providerSelectedSuppliers);
                                      if (feat.id === 'invoice_export') setProviderSelectedInvoiceExport(!providerSelectedInvoiceExport);
                                      if (feat.id === 'support') setProviderSelectedSupport(!providerSelectedSupport);
                                    }}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      (feat.id === 'inventory' && providerSelectedInventory) ||
                                      (feat.id === 'suppliers' && providerSelectedSuppliers) ||
                                      (feat.id === 'invoice_export' && providerSelectedInvoiceExport) ||
                                      (feat.id === 'support' && providerSelectedSupport)
                                        ? 'bg-amber-500 text-slate-900 shadow-sm border-amber-400'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {(feat.id === 'inventory' && providerSelectedInventory) ||
                                    (feat.id === 'suppliers' && providerSelectedSuppliers) ||
                                    (feat.id === 'invoice_export' && providerSelectedInvoiceExport) ||
                                    (feat.id === 'support' && providerSelectedSupport)
                                      ? 'تم الاختيار ✓'
                                      : 'تفعيل الميزة +'}
                                  </button>
                                )
                              )}
                            </div>
                          </div>

                          {currentActiveQty > 0 && (
                            <div className="absolute bottom-2 right-2 flex items-center gap-1">
                              <span className="text-[10px] text-slate-800 opacity-60 font-medium font-sans">النشط: +{currentActiveQty} {feat.unit || 'ميزات'}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {addonViewFormat === 'list' && (
                  <div className="space-y-3">
                    {additionalFeatures.map((feat) => {
                      const isServiceAddon = feat.id === 'services';
                      const isHallsAddon = feat.id === 'halls';
                      const isStaffAddon = feat.id === 'provider_staff';
                      const isCheckable = !isServiceAddon && !isHallsAddon && !isStaffAddon;

                      // Pricing specific to billing cycle
                      const isAddonYearly = getAddonBillingCycle(feat.id) === 'yearly';
                      const currentCost = isAddonYearly ? feat.priceYearly : feat.priceMonthly;
                      const finalCostAfterDisc = currentCost * (1 - (feat.discount || 0) / 100);

                      // Check if already subscribed
                      const isAlreadySubscribedBoolean = !isHallsAddon && !isServiceAddon && !isStaffAddon && (
                        providerSubscription?.addons?.includes(feat.id) ||
                        (feat.id === 'inventory' && !!providerSubscription?.includesInventory) ||
                        (feat.id === 'suppliers' && !!providerSubscription?.includesSuppliers) ||
                        (feat.id === 'invoice_export' && !!providerSubscription?.canExportFinancials) ||
                        (feat.id === 'support' && !!providerSubscription?.hasSupport)
                      );
                      const currentActiveQty = isHallsAddon 
                        ? (providerSubscription?.additionalHalls || 0) 
                        : isServiceAddon 
                          ? (providerSubscription?.additionalServices || 0) 
                          : isStaffAddon 
                            ? (providerSubscription?.purchasedStaffSlots || 0) 
                            : 0;

                      return (
                        <div key={feat.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 transition-all hover:shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden font-sans">
                          {feat.discount > 0 && (
                            <span className="absolute top-0 left-0 bg-red-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-br-lg select-none">
                              خصم {feat.discount}%
                            </span>
                          )}

                          <div className="flex items-start gap-3 flex-1">
                            <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isAlreadySubscribedBoolean || currentActiveQty > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                            <div className="space-y-2">
                              <div>
                                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2 flex-wrap text-sans">
                                  {feat.name}
                                  {currentActiveQty > 0 && (
                                    <span className="bg-amber-50 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded border border-amber-200/40">النشط حالياً: +{currentActiveQty}</span>
                                  )}
                                </h4>
                                <p className="text-[11px] text-slate-500 mt-1 lines-clamp-2 leading-relaxed font-sans">{feat.description}</p>
                              </div>

                              {/* Billing Cycle Selector for List View */}
                              <div className="flex items-center gap-2 bg-slate-100/80 p-1 rounded-xl border border-slate-200/40 w-fit">
                                <span className="text-[10px] text-slate-500 font-bold px-1 font-sans">نوع الاشتراك:</span>
                                <div className="flex bg-slate-200/60 p-0.5 rounded-lg text-[9px] font-bold">
                                  <button
                                    type="button"
                                    disabled={isAlreadySubscribedBoolean}
                                    onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'monthly' }))}
                                    className={`px-2 py-1 rounded-md transition-all ${
                                      !isAddonYearly
                                        ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                                        : 'text-slate-500 hover:text-slate-800'
                                    } ${isAlreadySubscribedBoolean ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    شهرياً
                                  </button>
                                  <button
                                    type="button"
                                    disabled={isAlreadySubscribedBoolean}
                                    onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'yearly' }))}
                                    className={`px-2 py-1 rounded-md transition-all ${
                                      isAddonYearly
                                        ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                                        : 'text-slate-500 hover:text-slate-800'
                                    } ${isAlreadySubscribedBoolean ? 'opacity-50 cursor-not-allowed' : ''}`}
                                  >
                                    سنوياً
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center justify-between md:justify-end gap-6 border-t md:border-t-0 border-slate-200/50 pt-3 md:pt-0">
                            <div className="text-right">
                              <span className="text-xs text-slate-400 block line-through">
                                {feat.discount > 0 && !isAlreadySubscribedBoolean ? `${currentCost} ر.س` : ''}
                              </span>
                              <span className="text-sm font-black text-slate-800">
                                {isAlreadySubscribedBoolean ? 'مشمول في الاشتراك' : `${finalCostAfterDisc.toFixed(2)} ر.س`}
                                {!isAlreadySubscribedBoolean && <span className="text-[10px] text-slate-400 font-normal"> / {isAddonYearly ? 'سنوياً' : 'شهرياً'}</span>}
                              </span>
                            </div>

                            <div className="flex items-center">
                              {isHallsAddon && (
                                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200 font-mono">
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedHalls(prev => Math.max(0, prev - 1))}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-800 text-sm w-6 text-center">{providerSelectedHalls}</span>
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedHalls(prev => prev + 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {isServiceAddon && (
                                <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm border border-slate-200 font-mono">
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedServices(prev => Math.max(0, prev - 1))}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg"
                                  >
                                    -
                                  </button>
                                  <span className="font-bold text-slate-800 text-sm w-6 text-center">{providerSelectedServices}</span>
                                  <button
                                    type="button"
                                    onClick={() => setProviderSelectedServices(prev => prev + 1)}
                                    className="w-7 h-7 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-lg"
                                  >
                                    +
                                  </button>
                                </div>
                              )}

                              {isCheckable && (
                                isAlreadySubscribedBoolean ? (
                                  <button
                                    type="button"
                                    disabled
                                    className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3.5 py-1.5 rounded-lg text-xs font-black cursor-not-allowed select-none"
                                    title="مفعلة بالباقة أو مشترك بها مسبقاً"
                                  >
                                    تم الاختيار ✓
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (feat.id === 'inventory') setProviderSelectedInventory(!providerSelectedInventory);
                                      if (feat.id === 'suppliers') setProviderSelectedSuppliers(!providerSelectedSuppliers);
                                      if (feat.id === 'invoice_export') setProviderSelectedInvoiceExport(!providerSelectedInvoiceExport);
                                      if (feat.id === 'support') setProviderSelectedSupport(!providerSelectedSupport);
                                    }}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                      (feat.id === 'inventory' && providerSelectedInventory) ||
                                      (feat.id === 'suppliers' && providerSelectedSuppliers) ||
                                      (feat.id === 'invoice_export' && providerSelectedInvoiceExport) ||
                                      (feat.id === 'support' && providerSelectedSupport)
                                        ? 'bg-amber-500 text-slate-900 shadow-sm border-amber-400'
                                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                  >
                                    {(feat.id === 'inventory' && providerSelectedInventory) ||
                                    (feat.id === 'suppliers' && providerSelectedSuppliers) ||
                                    (feat.id === 'invoice_export' && providerSelectedInvoiceExport) ||
                                    (feat.id === 'support' && providerSelectedSupport)
                                      ? 'تم الاختيار ✓'
                                      : 'تفعيل الميزة +'}
                                  </button>
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {addonViewFormat === 'table' && (
                  <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50">
                    <table className="w-full border-collapse text-right text-xs" dir="rtl">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600 font-bold border-b border-slate-200/50">
                          <th className="py-3.5 px-4 text-xs font-black">الميزة والوصف</th>
                          <th className="py-3.5 px-4 text-xs font-black text-center">نوع الاشتراك</th>
                          <th className="py-3.5 px-4 text-xs font-black text-center">الخصم</th>
                          <th className="py-3.5 px-4 text-xs font-black">قيمة الرسوم</th>
                          <th className="py-3.5 px-4 text-xs font-black text-center">التحكم والتفعيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200/60">
                        {additionalFeatures.map((feat) => {
                          const isServiceAddon = feat.id === 'services';
                          const isHallsAddon = feat.id === 'halls';
                          const isCheckable = !isServiceAddon && !isHallsAddon;

                          // Pricing specific to billing cycle
                          const isAddonYearly = getAddonBillingCycle(feat.id) === 'yearly';
                          const currentCost = isAddonYearly ? feat.priceYearly : feat.priceMonthly;
                          const finalCostAfterDisc = currentCost * (1 - (feat.discount || 0) / 100);

                           // Check if already subscribed
                           const isAlreadySubscribedBoolean = !isHallsAddon && !isServiceAddon && (
                             providerSubscription?.addons?.includes(feat.id) ||
                             (feat.id === 'inventory' && !!providerSubscription?.includesInventory) ||
                             (feat.id === 'suppliers' && !!providerSubscription?.includesSuppliers) ||
                             (feat.id === 'invoice_export' && !!providerSubscription?.canExportFinancials) ||
                             (feat.id === 'support' && !!providerSubscription?.hasSupport)
                           );
                           const currentActiveQty = isHallsAddon ? (providerSubscription?.additionalHalls || 0) : isServiceAddon ? (providerSubscription?.additionalServices || 0) : 0;

                           return (
                             <tr key={feat.id} className="hover:bg-slate-100/50 transition-colors">
                               <td className="py-4 px-4">
                                 <div className="flex items-center gap-2">
                                   <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isAlreadySubscribedBoolean || currentActiveQty > 0 ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                   <div>
                                     <h4 className="font-bold text-slate-800 text-sm flex items-center gap-1.5 flex-wrap">
                                       {feat.name}
                                       {currentActiveQty > 0 && (
                                         <span className="text-[10px] bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded font-black border border-amber-200/30">النشط: +{currentActiveQty}</span>
                                       )}
                                     </h4>
                                     <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed max-w-sm">{feat.description}</p>
                                   </div>
                                 </div>
                               </td>
                               <td className="py-4 px-4 text-center">
                                 <div className="inline-flex bg-slate-200/60 p-0.5 rounded-lg text-[10px]">
                                   <button
                                     type="button"
                                     disabled={isAlreadySubscribedBoolean}
                                     onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'monthly' }))}
                                     className={`px-2 py-1 rounded transition-all ${
                                       !isAddonYearly
                                         ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                                         : 'text-slate-500 hover:text-slate-1000'
                                     } ${isAlreadySubscribedBoolean ? 'opacity-50 cursor-not-allowed' : ''}`}
                                   >
                                     شهري
                                   </button>
                                   <button
                                     type="button"
                                     disabled={isAlreadySubscribedBoolean}
                                     onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'yearly' }))}
                                     className={`px-2 py-1 rounded transition-all ${
                                       isAddonYearly
                                         ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                                         : 'text-slate-500 hover:text-slate-1000'
                                     } ${isAlreadySubscribedBoolean ? 'opacity-50 cursor-not-allowed' : ''}`}
                                   >
                                     سنوي
                                   </button>
                                 </div>
                               </td>
                               <td className="py-4 px-4 text-center">
                                 {feat.discount > 0 ? (
                                   <span className="bg-red-50 text-red-600 font-black px-2 py-0.5 rounded-lg text-[10px] border border-red-200/20">
                                     خصم {feat.discount}%
                                   </span>
                                 ) : (
                                   <span className="text-slate-400">-</span>
                                 )}
                               </td>
                               <td className="py-4 px-4">
                                 <div className="font-mono">
                                   {feat.discount > 0 && !isAlreadySubscribedBoolean && (
                                     <span className="text-[10px] text-slate-400 line-through block leading-none mb-1">
                                       {currentCost.toFixed(2)} ر.س
                                     </span>
                                   )}
                                   <span className="text-xs font-black text-slate-800 block">
                                     {isAlreadySubscribedBoolean ? 'مشمول في الاشتراك' : `${finalCostAfterDisc.toFixed(2)} ر.س`}
                                   </span>
                                   {!isAlreadySubscribedBoolean && <span className="text-[9px] text-slate-400 block mt-0.5">/ {isAddonYearly ? 'سنوياً' : 'شهرياً'}</span>}
                                 </div>
                               </td>
                               <td className="py-4 px-4 text-center">
                                 <div className="flex justify-center">
                                   {isHallsAddon && (
                                     <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-slate-200 shadow-sm font-mono">
                                       <button
                                         type="button"
                                         onClick={() => setProviderSelectedHalls(prev => Math.max(0, prev - 1))}
                                         className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-sm"
                                       >
                                         -
                                       </button>
                                       <span className="font-bold text-slate-800 text-xs w-5 text-center">{providerSelectedHalls}</span>
                                       <button
                                         type="button"
                                         onClick={() => setProviderSelectedHalls(prev => prev + 1)}
                                         className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-sm"
                                       >
                                         +
                                       </button>
                                     </div>
                                   )}

                                   {isServiceAddon && (
                                     <div className="flex items-center gap-1.5 bg-white rounded-lg p-1 border border-slate-200 shadow-sm font-mono">
                                       <button
                                         type="button"
                                         onClick={() => setProviderSelectedServices(prev => Math.max(0, prev - 1))}
                                         className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-sm"
                                       >
                                         -
                                       </button>
                                       <span className="font-bold text-slate-800 text-xs w-5 text-center">{providerSelectedServices}</span>
                                       <button
                                         type="button"
                                         onClick={() => setProviderSelectedServices(prev => prev + 1)}
                                         className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-400 text-slate-800 hover:text-slate-900 transition-colors font-bold text-sm"
                                       >
                                         +
                                       </button>
                                     </div>
                                   )}

                                   {isCheckable && (
                                     isAlreadySubscribedBoolean ? (
                                       <button
                                         type="button"
                                         disabled
                                         className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-lg text-[10px] font-black cursor-not-allowed select-none"
                                         title="مفعلة بالباقة أو مشترك بها مسبقاً"
                                       >
                                         تم الاختيار ✓
                                       </button>
                                     ) : (
                                       <button
                                         type="button"
                                         onClick={() => {
                                           if (feat.id === 'inventory') setProviderSelectedInventory(!providerSelectedInventory);
                                           if (feat.id === 'suppliers') setProviderSelectedSuppliers(!providerSelectedSuppliers);
                                           if (feat.id === 'invoice_export') setProviderSelectedInvoiceExport(!providerSelectedInvoiceExport);
                                           if (feat.id === 'support') setProviderSelectedSupport(!providerSelectedSupport);
                                         }}
                                         className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                                           (feat.id === 'inventory' && providerSelectedInventory) ||
                                           (feat.id === 'suppliers' && providerSelectedSuppliers) ||
                                           (feat.id === 'invoice_export' && providerSelectedInvoiceExport) ||
                                           (feat.id === 'support' && providerSelectedSupport)
                                             ? 'bg-amber-500 text-slate-900 shadow-sm border-amber-400'
                                             : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                                         }`}
                                       >
                                         {(feat.id === 'inventory' && providerSelectedInventory) ||
                                         (feat.id === 'suppliers' && providerSelectedSuppliers) ||
                                         (feat.id === 'invoice_export' && providerSelectedInvoiceExport) ||
                                         (feat.id === 'support' && providerSelectedSupport)
                                           ? 'تم الاختيار ✓'
                                           : 'تفعيل +'}
                                       </button>
                                     )
                                   )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Interactive Checkout Box */}
            <div className="bg-slate-900 text-white rounded-3xl border border-slate-800 shadow-xl p-6 sticky top-6 space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></div>
                  <h3 className="text-base font-bold">فاتورة ترقية الميزات الإضافية</h3>
                </div>
                <p className="text-slate-400 text-xs mt-1">تتم جدولة الرسوم لتتوافق مع دورتك المالية الحالية.</p>
              </div>

              {/* Items selected */}
              <div className="space-y-3 min-h-[140px]">
                {providerSelectedHalls === 0 &&
                 providerSelectedServices === 0 &&
                 providerSelectedStaffSlots === 0 &&
                 !providerSelectedInventory &&
                 !providerSelectedSuppliers &&
                 !providerSelectedInvoiceExport &&
                 !providerSelectedSupport ? (
                  <div className="flex flex-col items-center justify-center text-center text-slate-500 h-[140px] border border-dashed border-slate-800 rounded-2xl p-4 bg-slate-950/20">
                    <PackageSearch className="w-8 h-8 text-slate-600 mb-2" />
                    <p className="text-xs">لم تقم باختيار أي ميزة إضافية بعد.</p>
                    <p className="text-[10px] text-slate-600 mt-1 font-sans">اختر من القائمة في اليمين للمتابعة والدفع.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800 space-y-2">
                    {providerSelectedHalls > 0 && (
                      <div className="flex justify-between items-center text-xs pt-2">
                        <span>إضافة قاعة زفاف ({providerSelectedHalls} إضافي) <span className="text-[10px] text-slate-400 font-sans">({getAddonBillingCycle('halls') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                        <span className="font-mono text-slate-300">{(getAddonCost('halls') * providerSelectedHalls).toFixed(2)} ر.س</span>
                      </div>
                    )}
                    {providerSelectedServices > 0 && (
                      <div className="flex justify-between items-center text-xs pt-2">
                        <span>إضافة خدمة مساندة ({providerSelectedServices} إضافي) <span className="text-[10px] text-slate-400 font-sans">({getAddonBillingCycle('services') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                        <span className="font-mono text-slate-300">{(getAddonCost('services') * providerSelectedServices).toFixed(2)} ر.س</span>
                      </div>
                    )}
                    {providerSelectedStaffSlots > 0 && (
                      <div className="flex justify-between items-center text-xs pt-2">
                        <span>شراء مقاعد إضافية للموظفين ({providerSelectedStaffSlots} مقعد) <span className="text-[10px] text-slate-400 font-sans">({getAddonBillingCycle('provider_staff') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                        <span className="font-mono text-slate-300">{(getAddonCost('provider_staff') * providerSelectedStaffSlots).toFixed(2)} ر.س</span>
                      </div>
                    )}
                    {providerSelectedInventory && (
                      <div className="flex justify-between items-center text-xs pt-2">
                        <span>ميزة إدارة المخزون والمستودعات <span className="text-[10px] text-slate-400 font-sans">({getAddonBillingCycle('inventory') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                        <span className="font-mono text-slate-300">{(getAddonCost('inventory')).toFixed(2)} ر.س</span>
                      </div>
                    )}
                    {providerSelectedSuppliers && (
                      <div className="flex justify-between items-center text-xs pt-2">
                        <span>ميزة إدارة الموردين <span className="text-[10px] text-slate-400 font-sans">({getAddonBillingCycle('suppliers') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                        <span className="font-mono text-slate-300">{(getAddonCost('suppliers')).toFixed(2)} ر.س</span>
                      </div>
                    )}
                    {providerSelectedInvoiceExport && (
                      <div className="flex justify-between items-center text-xs pt-2">
                        <span>تصدير واستعراض الفواتير <span className="text-[10px] text-slate-400 font-sans">({getAddonBillingCycle('invoice_export') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                        <span className="font-mono text-slate-300">{(getAddonCost('invoice_export')).toFixed(2)} ر.س</span>
                      </div>
                    )}
                    {providerSelectedSupport && (
                      <div className="flex justify-between items-center text-xs pt-2">
                        <span>ميزة الدعم الفني والمحادثة المباشرة <span className="text-[10px] text-slate-400 font-sans">({getAddonBillingCycle('support') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                        <span className="font-mono text-slate-300">{(getAddonCost('support')).toFixed(2)} ر.س</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Price Calculations */}
              {(providerSelectedHalls > 0 || providerSelectedServices > 0 || providerSelectedStaffSlots > 0 || providerSelectedInventory || providerSelectedSuppliers || providerSelectedInvoiceExport || providerSelectedSupport) && (
                <div className="space-y-2 border-t border-slate-800 pt-4 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>الإجمالي الفرعي للميزات:</span>
                    <span className="font-mono">{baseTotal.toFixed(2)} ر.س</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-red-400">
                      <span>الخصومات الممنوحة:</span>
                      <span className="font-mono">-{totalDiscount.toFixed(2)} ر.س</span>
                    </div>
                  )}
                  <div className="flex justify-between text-slate-400">
                    <span>ضريبة القيمة المضافة (15%):</span>
                    <span className="font-mono">{vatAmount.toFixed(2)} ر.س</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-amber-500 border-t border-slate-800 pt-3">
                    <span>إجمالي الرسوم الإضافية:</span>
                    <span className="font-mono">{finalTotal.toFixed(2)} ر.س / {invoiceCycleLabel}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsAddonCheckoutOpen(true)}
                    className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all mt-4 hover:scale-[1.02]"
                  >
                    <CreditCard className="w-5 h-5" /> دفع وتفعيل الصلاحيات
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Checkout Modal for Provider Add-ons */}
          {isAddonCheckoutOpen && (
            <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-lg w-full text-right" dir="rtl">
                <div className="bg-slate-950 p-6 text-white relative">
                  <button onClick={() => setIsAddonCheckoutOpen(false)} className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-xl font-bold">بوابة سداد رسوم الميزات الإضافية</h3>
                  <p className="text-slate-400 text-xs mt-1">تفعيل مباشر وآمن لصلاحيات النظام.</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Total summary */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <span className="text-xs text-slate-400">إجمالي رسوم الترقية شاملة القيمة المضافة</span>
                      <h4 className="text-2xl font-black text-slate-800 mt-1">{finalTotal.toFixed(2)} <span className="text-xs font-normal font-sans">ر.س / {invoiceCycleLabel}</span></h4>
                    </div>
                    <span className="text-xs bg-amber-100 text-amber-700 font-black px-3 py-1.5 rounded-xl">أمان فائق 🔒</span>
                  </div>

                  {/* التزام بقرارات الإدارة لبوابات الدفع الفعالة */}
                  {(() => {
                    const activeGWNames: Record<string, string> = {
                      moyasar: 'مُيسر (Moyasar)',
                      hyperpay: 'هايبر باي (HyperPay)',
                      paytabs: 'بي تابس (PayTabs)',
                      geidea: 'جيديا (Geidea)',
                      tabby_api: 'تابي (Tabby)',
                      tamara_api: 'تمارا (Tamara)'
                    };
                    const activeGWName = activeGWNames[adminActiveGateway] || 'مُيسر (Moyasar)';
                    return (
                      <div className="bg-amber-50/45 border border-amber-200/50 rounded-2xl p-3 text-xs space-y-1 text-slate-700">
                        <div className="font-bold text-amber-900 flex items-center gap-1">🛡️ معالجة الاشتراك عبر البوابة المعتمدة:</div>
                        <div className="text-[11px] text-slate-600 leading-relaxed">
                          يتم توجيه وتصديق كافة عمليات السداد آلياً لترقية صلاحيات وميزات الحساب عبر: <span className="font-extrabold text-amber-800">{activeGWName}</span>.
                        </div>
                      </div>
                    );
                  })()}

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-600">طريقة الدفع للميزات:</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setAddonPaymentMethod('creditCard')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                          addonPaymentMethod === 'creditCard'
                            ? 'border-amber-500 bg-amber-50/40 text-slate-900'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <CreditCard className="w-6 h-6" />
                        <span className="text-xs font-black">مدار / البطاقة الائتمانية</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAddonPaymentMethod('transfer')}
                        className={`p-3 rounded-2xl border flex flex-col items-center gap-2 transition-all ${
                          addonPaymentMethod === 'transfer'
                            ? 'border-amber-500 bg-amber-50/40 text-slate-900'
                            : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                      >
                        <Landmark className="w-6 h-6" />
                        <span className="text-xs font-black">تحويل بنكي / إيداع</span>
                      </button>
                    </div>
                  </div>

                  {addonPaymentMethod === 'creditCard' ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-bold text-slate-500 block mb-1">رقم بطاقة الدفع (مدى، فيزا، ماستركارد):</label>
                        <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left" defaultValue="4222 3456 2111 8765" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs font-bold text-slate-500 block mb-1">تاريخ الصلاحية:</label>
                          <input type="text" placeholder="MM/YY" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-center" defaultValue="09/29" />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-slate-500 block mb-1">الرمز السري (CVV):</label>
                          <input type="password" placeholder="***" className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-center" defaultValue="888" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 bg-amber-50/50 p-4 rounded-2xl border border-amber-500/10 text-xs text-slate-700">
                      <p className="font-bold text-amber-800">يرجى تحويل رسوم الاشتراك لقنواتنا المصرفية التالية:</p>
                      <p>اسم البنك: <span className="font-bold">البنك الأهلي السعودي (SNB)</span></p>
                      <p>اسم الحساب: <span className="font-bold">شركة ليلة لخدمات تخطيط الأعراس والمؤتمرات</span></p>
                      <p>رقم الحساب الجاري: <span className="font-bold font-mono">1002340056789122</span></p>
                      <p>الآيبان الدولي: <span className="font-bold font-mono text-[11px]">SA80 3000 0010 0234 0056 7891 22</span></p>
                      
                      <div className="pt-2">
                        <label className="text-xs font-bold text-slate-500 block mb-1">إرفاق إيصال التحويل المصرفي:</label>
                        <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-slate-200">
                          <Upload className="w-5 h-5 text-amber-500 shrink-0" />
                          <span className="text-[11px] text-slate-500 font-medium">Receipt_121.pdf (تم تحميله بنجاح)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddonCheckoutOpen(false);
                        setIsProcessingAddonPayment(true);
                        
                        setTimeout(() => {
                          setIsProcessingAddonPayment(false);
                          
                          const newAddons = [...(providerSubscription.addons || [])];
                          if (providerSelectedInventory && !newAddons.includes('inventory')) newAddons.push('inventory');
                          if (providerSelectedSuppliers && !newAddons.includes('suppliers')) newAddons.push('suppliers');
                          if (providerSelectedInvoiceExport && !newAddons.includes('invoice_export')) newAddons.push('invoice_export');
                          if (providerSelectedSupport && !newAddons.includes('support')) newAddons.push('support');
                          if (providerSelectedStaffSlots > 0 && !newAddons.includes('provider_staff')) newAddons.push('provider_staff');
                          
                          const finalHalls = Number(providerSubscription.additionalHalls || 0) + providerSelectedHalls;
                          const finalServices = Number(providerSubscription.additionalServices || 0) + providerSelectedServices;
                          const finalStaffSlots = Number(providerSubscription.purchasedStaffSlots || 0) + providerSelectedStaffSlots;
                          
                          const updated = {
                            ...providerSubscription,
                            additionalHalls: finalHalls,
                            additionalServices: finalServices,
                            purchasedStaffSlots: finalStaffSlots,
                            addons: newAddons
                          };
                          
                          setProviderSubscription(updated);
                          const subKey = currentProviderName ? `provider_subscription_${currentProviderName}` : 'provider_subscription';
                          localStorage.setItem(subKey, JSON.stringify(updated));
                          setPurchasedStaffSlots(finalStaffSlots);
                          localStorage.setItem('PROVIDER_PURCHASED_STAFF_SLOTS', finalStaffSlots.toString());
                          
                          // Reset selections
                          setProviderSelectedHalls(0);
                          setProviderSelectedServices(0);
                          setProviderSelectedStaffSlots(0);
                          setProviderSelectedInventory(false);
                          setProviderSelectedSuppliers(false);
                          setProviderSelectedInvoiceExport(false);
                          setProviderSelectedSupport(false);
                          
                          showNotification('success', 'تم تنشيط الميزات الإضافية المختارة بنجاح وإضافتها إلى صلاحيات باقتك!');
                        }, 1500);
                      }}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold py-3 rounded-2xl transition-all shadow-lg shadow-amber-500/10"
                    >
                      تأكيد السداد والترقية الفورية
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddonCheckoutOpen(false)}
                      className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Loading Overlay */}
          {isProcessingAddonPayment && (
            <div className="fixed inset-0 z-[60] bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white" dir="rtl">
              <div className="w-16 h-16 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-bold text-lg animate-pulse">جاري سداد إجمالي رسوم الصلاحيات بالبوابة...</p>
              <p className="text-slate-400 text-xs mt-1">برجاء عدم إغلاق هذه الصفحة لتلقي التوكن البنكي وتفويض الصلاحيات.</p>
            </div>
          )}
        </div>
      );
    }
  }

    let filteredSubscriptions = subscriptions.filter(s => {
      const matchSearch = s.name.includes(subscriptionsSearchQuery);
      const matchStatus = subscriptionsFilterStatus ? s.status === subscriptionsFilterStatus : true;
      return matchSearch && matchStatus;
    });

    const totalRevenue = subscriptions.reduce((sum, s) => sum + (s.revenue || 0), 0);
    const activePackages = subscriptions.filter(s => s.status === 'مفعل').length;
    const totalUsers = subscriptions.reduce((sum, s) => sum + (s.usersCount || 0), 0);

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
              <span>💳</span>
              <span>مركز إدارة باقات الاشتراكات وسوق الميزات الإضافية والقدرات التشغيلية</span>
            </h2>
            <p className="text-slate-500 text-xs mt-1">
              ضبط مستويات العضوية، نسب العمولات، وتسعير القدرات والمزايا الإضافية
            </p>
          </div>
          {adminSubscriptionsTab === 'packages' && (
            <button 
              onClick={() => { 
                setEditingItem(null); 
                setSubscriptionForm({ name: '', priceMonthly: 0, priceYearly: 0, features: '', status: 'مفعل', isPopular: false, discount: 0, commissionRate: 0, includesInventory: false, includesSuppliers: false, canExportFinancials: false, hasSupport: false, hallsLimit: '', servicesLimit: '', staffSeatsLimit: '', includesGrowthCharts: false, includesFinancialForecast: false, includesPartialPayment: false, includesAdvancedStats: false, includesFullManagement: false, includesLogisticsPortal: false, isHidden: false }); 
                setIsSubscriptionModalOpen(true); 
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" /> إضافة باقة جديدة
            </button>
          )}
        </div>

        {/* Tab switch navigation */}
        <div className="flex border-b border-slate-100 gap-4">
          <button
            onClick={() => setAdminSubscriptionsTab('packages')}
            className={`pb-3 px-4 text-sm font-bold transition-all relative ${
              adminSubscriptionsTab === 'packages'
                ? 'text-amber-600 font-black'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            الباقات الأساسية
            {adminSubscriptionsTab === 'packages' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setAdminSubscriptionsTab('addons')}
            className={`pb-3 px-4 text-sm font-bold transition-all relative ${
              adminSubscriptionsTab === 'addons'
                ? 'text-amber-600 font-black'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            الميزات الإضافية للشركاء
            {adminSubscriptionsTab === 'addons' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"></div>
            )}
          </button>
          <button
            onClick={() => setAdminSubscriptionsTab('discounts')}
            className={`pb-3 px-4 text-sm font-bold transition-all relative ${
              adminSubscriptionsTab === 'discounts'
                ? 'text-amber-600 font-black'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            الخصومات وعروض المنصة
            {adminSubscriptionsTab === 'discounts' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-full"></div>
            )}
          </button>
        </div>

        {adminSubscriptionsTab === 'packages' ? (
          <>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-amber-500 transition-colors">
             <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0"><Package className="w-6 h-6" /></div>
             <div><p className="text-sm text-slate-500 font-medium">الباقات المفعلة</p><h3 className="text-2xl font-bold text-slate-800">{activePackages}</h3></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-blue-500 transition-colors">
             <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0"><Users className="w-6 h-6" /></div>
             <div><p className="text-sm text-slate-500 font-medium">المشتركين النشطين</p><h3 className="text-2xl font-bold text-slate-800">{totalUsers}</h3></div>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-green-500 transition-colors">
             <div className="w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center shrink-0"><Wallet className="w-6 h-6" /></div>
             <div><p className="text-sm text-slate-500 font-medium">إجمالي الإيرادات</p><h3 className="text-2xl font-bold text-slate-800">{formatCurrency(totalRevenue)}</h3></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="بحث باسم الباقة..." className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" value={subscriptionsSearchQuery} onChange={e => setSubscriptionsSearchQuery(e.target.value)} />
            </div>
            <select className="p-3 rounded-xl border border-slate-200 bg-white min-w-[200px] outline-none" value={subscriptionsFilterStatus || ''} onChange={e => setSubscriptionsFilterStatus(e.target.value)}>
              <option value="">كل الحالات</option>
              <option value="مفعل">مفعل</option>
              <option value="معطل">معطل</option>
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                  <th className="p-4 font-medium">اسم الباقة</th>
                  <th className="p-4 font-medium">السعر الشهري</th>
                  <th className="p-4 font-medium">السعر السنوي</th>
                  <th className="p-4 font-medium">المشتركين</th>
                  <th className="p-4 font-medium">الإيرادات</th>
                  <th className="p-4 font-medium">العمولة (%)</th>
                  <th className="p-4 font-medium">التخفيض</th>
                  <th className="p-4 font-medium">الحالة</th>
                  <th className="p-4 font-medium">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredSubscriptions.map((s: any, idx) => (
                  <tr key={`sub-row-${s.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className={`flex flex-col gap-1 me-2 border-l border-slate-100 pl-2 ${(subscriptionsSearchQuery || subscriptionsFilterStatus) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                          <button 
                            onClick={() => {
                              if (subscriptionsSearchQuery || subscriptionsFilterStatus) return;
                              const index = subscriptions.findIndex((sub: any) => sub.id === s.id);
                              if (index > 0) {
                                const newSubs = [...subscriptions];
                                [newSubs[index - 1], newSubs[index]] = [newSubs[index], newSubs[index - 1]];
                                setSubscriptions(newSubs);
                              }
                            }}
                            disabled={!!(subscriptionsSearchQuery || subscriptionsFilterStatus)}
                            className={`p-1 rounded text-slate-400 transition-colors ${subscriptions.findIndex((sub: any) => sub.id === s.id) === 0 || subscriptionsSearchQuery || subscriptionsFilterStatus ? 'opacity-30 cursor-not-allowed' : 'hover:text-slate-800 hover:bg-slate-100'}`}
                            title={subscriptionsSearchQuery || subscriptionsFilterStatus ? "قم بإلغاء البحث والفلترة لترتيب الباقات" : "تحريك لأعلى ⬆️"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                          </button>
                          <button 
                            onClick={() => {
                              if (subscriptionsSearchQuery || subscriptionsFilterStatus) return;
                              const index = subscriptions.findIndex((sub: any) => sub.id === s.id);
                              if (index < subscriptions.length - 1) {
                                const newSubs = [...subscriptions];
                                [newSubs[index], newSubs[index + 1]] = [newSubs[index + 1], newSubs[index]];
                                setSubscriptions(newSubs);
                              }
                            }}
                            disabled={!!(subscriptionsSearchQuery || subscriptionsFilterStatus)}
                            className={`p-1 rounded text-slate-400 transition-colors ${subscriptions.findIndex((sub: any) => sub.id === s.id) === subscriptions.length - 1 || subscriptionsSearchQuery || subscriptionsFilterStatus ? 'opacity-30 cursor-not-allowed' : 'hover:text-slate-800 hover:bg-slate-100'}`}
                            title={subscriptionsSearchQuery || subscriptionsFilterStatus ? "قم بإلغاء البحث والفلترة لترتيب الباقات" : "تحريك لأسفل ⬇️"}
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                        </div>
                        <span className="font-bold text-slate-800">{s.name}</span>
                        {s.isPopular && <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">مميزة</span>}
                        {s.isHidden && <span className="bg-rose-100 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold flex items-center gap-1">🔒 باقة مخفية ترويجية</span>}
                      </div>
                    </td>
                    <td className="p-4 font-bold text-slate-700">{s.priceMonthly} ر.س</td>
                    <td className="p-4 font-bold text-slate-700">{s.priceYearly} ر.س</td>
                    <td className="p-4 text-slate-600">{s.usersCount || 0}</td>
                    <td className="p-4 font-bold text-green-600">{formatCurrency(s.revenue || 0)}</td>
                    <td className="p-4 font-bold text-amber-600">{s.commissionRate || 10}%</td>
                    <td className="p-4 text-slate-600">{Math.round(100 - (s.priceYearly / (s.priceMonthly * 12)) * 100) > 0 ? `${Math.round(100 - (s.priceYearly / (s.priceMonthly * 12)) * 100)}%` : '-'}</td>
                    <td className="p-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${s.status === 'مفعل' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="p-4 flex gap-2 items-center">
                      <button onClick={() => { setViewingSubscription(s); setIsSubscriptionViewModalOpen(true); }} className="p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 rounded-xl transition-colors" title="عرض التفاصيل">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => { setEditingItem(s); setSubscriptionForm({...s}); setIsSubscriptionModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="تعديل">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => {
                          const newStatus = s.status === 'مفعل' ? 'معطل' : 'مفعل';
                          setSubscriptions(subscriptions.map((sub: any) => sub.id === s.id ? {...sub, status: newStatus} : sub));
                        }}
                        className={`p-2 rounded-xl transition-colors ${s.status === 'مفعل' ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`} title={s.status === 'مفعل' ? 'تعطيل' : 'تفعيل'}
                      >
                        <Power className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteData({ id: s.id, type: 'subscription', name: s.name })} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="حذف">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
          </>
        ) : adminSubscriptionsTab === 'addons' ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Overview / Banner */}
            <div className="bg-gradient-to-r from-amber-500/5 to-transparent p-6 rounded-2xl border border-amber-500/10">
              <h3 className="text-base font-bold text-amber-900">إدارة وتسعير الميزات المخصصة للشركاء</h3>
              <p className="text-slate-600 text-xs mt-2 leading-relaxed">
                تسمح هذه الواجهة للإدارة بتعديل الرسوم الفردية والخصومات الممنوحة على الخدمات والحدود الإضافية المستقلة عن الاشتراكات والخصائص المجتمعة المدمجة مع الباقات مجانًا.
                يستطيع الشركاء شراء وتنشيط هذه الصلاحيات فورياً من خلال كبائن الاشتراك لديهم.
              </p>
            </div>

            {/* Add-ons List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {additionalFeatures.map((feat) => (
                <div key={feat.id} className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between shadow-sm relative overflow-hidden transition-all hover:border-amber-500/65 hover:shadow-md bg-white">
                  {feat.discount > 0 && (
                    <span className="absolute top-0 left-0 bg-red-400 text-white font-bold text-[10px] px-3 py-1 rounded-br-2xl select-none">
                      خصم {feat.discount}%
                    </span>
                  )}
                  <div className="mt-2">
                    <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                      {feat.name}
                    </h4>
                    <p className="text-slate-500 text-xs mt-1 leading-relaxed min-h-[36px]">{feat.description}</p>
                  </div>

                  <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-2">
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>السعر شهرياً:</span>
                      <span className="font-bold text-slate-800 font-mono">{feat.priceMonthly.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                      <span>السعر سنوياً:</span>
                      <span className="font-bold text-slate-800 font-mono">{feat.priceYearly.toFixed(2)} ر.س</span>
                    </div>
                    {feat.unit && (
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>وحدة القياس الممنوحة:</span>
                        <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">{feat.unit} إضافية</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-500">الحالة للمزودين:</span>
                      <button
                        onClick={() => {
                          const updated = additionalFeatures.map(f => 
                            f.id === feat.id 
                              ? { ...f, isVisible: f.isVisible === false ? true : false } 
                              : f
                          );
                          setAdditionalFeatures(updated);
                          showNotification('success', `تم ${feat.isVisible === false ? 'إظهار' : 'إخفاء'} ميزة "${feat.name}" للمزودين بنجاح!`);
                        }}
                        className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${feat.isVisible !== false ? 'bg-emerald-500' : 'bg-slate-300'}`}
                      >
                        <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${feat.isVisible !== false ? 'translate-x-[20px]' : 'translate-x-0'}`} />
                      </button>
                      <span className={`text-[10px] sm:text-xs font-bold ${feat.isVisible !== false ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {feat.isVisible !== false ? 'معروضة' : 'مخفية'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setEditingAddon(feat);
                        setAddonForm({
                          id: feat.id,
                          name: feat.name,
                          description: feat.description,
                          priceMonthly: feat.priceMonthly,
                          priceYearly: feat.priceYearly,
                          discount: feat.discount || 0,
                          isVisible: feat.isVisible !== false
                        });
                        setIsAddonModalOpen(true);
                      }}
                      className="bg-slate-50 hover:bg-amber-400 hover:text-slate-900 text-slate-600 font-bold text-xs px-3 py-1.5 rounded-xl transition-all flex items-center gap-1 border border-slate-100"
                    >
                      <Pencil className="w-3 h-3" /> تعديل الرسوم
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DiscountsManagement
            discounts={discounts}
            onSaveDiscounts={setDiscounts}
            showNotification={showNotification}
          />
        )}

        {/* Modal: Editing Add-on Pricing */}
        {isAddonModalOpen && editingAddon && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-md w-full text-right bg-white" dir="rtl">
              <div className="bg-slate-950 p-6 text-white relative">
                <button
                  onClick={() => setIsAddonModalOpen(false)}
                  className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-bold">تعديل تسعير الميزة الإضافية</h3>
                <p className="text-slate-400 text-xs mt-1">{editingAddon.name}</p>
              </div>

              <div className="p-6 space-y-4 text-xs">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">السعر شهرياً (ر.س):</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono text-left text-xs"
                    value={addonForm.priceMonthly}
                    onChange={(e) => setAddonForm(prev => ({ ...prev, priceMonthly: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">السعر سنوياً (ر.س):</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono text-left text-xs"
                    value={addonForm.priceYearly}
                    onChange={(e) => setAddonForm(prev => ({ ...prev, priceYearly: parseFloat(e.target.value) || 0 }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">نسبة الخصم الممنوح (%):</label>
                  <input
                    type="number"
                    max="100"
                    min="0"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono text-left text-xs"
                    value={addonForm.discount}
                    onChange={(e) => setAddonForm(prev => ({ ...prev, discount: Math.min(100, Math.max(0, parseInt(e.target.value) || 0)) }))}
                  />
                </div>

                <div className="flex items-center justify-between bg-slate-50 p-3 rounded-2xl border border-slate-200">
                  <div className="space-y-0.5">
                    <label className="text-xs font-bold text-slate-700 block text-right">عرض الميزة للمزودين:</label>
                    <p className="text-[10px] text-slate-400 font-sans text-right leading-relaxed">تعطيل هذا الخيار سيخفي الميزة تماماً من قائمة لوحة تحكم المزودين.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAddonForm(prev => ({ ...prev, isVisible: !prev.isVisible }))}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${addonForm.isVisible ? 'bg-emerald-500' : 'bg-slate-300'}`}
                  >
                    <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${addonForm.isVisible ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      const updated = additionalFeatures.map(f => 
                        f.id === editingAddon.id 
                          ? { ...f, priceMonthly: addonForm.priceMonthly, priceYearly: addonForm.priceYearly, discount: addonForm.discount, isVisible: addonForm.isVisible } 
                          : f
                      );
                      setAdditionalFeatures(updated);
                      setIsAddonModalOpen(false);
                      showNotification('success', `تم تحديث ميزة "${editingAddon.name}" وحفظها بالنظام!`);
                    }}
                    className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold py-3 rounded-2xl transition-all shadow-lg text-xs cursor-pointer"
                  >
                    حفظ التعديلات
                  </button>
                  <button
                    onClick={() => setIsAddonModalOpen(false)}
                    className="px-6 py-3 rounded-2xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  
};
