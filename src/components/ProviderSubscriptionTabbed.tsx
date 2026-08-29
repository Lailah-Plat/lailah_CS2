import React, { useState, useEffect, useMemo } from 'react';
import { 
  Crown, 
  TrendingUp, 
  Sparkles, 
  Box, 
  Users2, 
  FileText, 
  Headset, 
  Coins, 
  Layers, 
  PackageSearch, 
  CreditCard, 
  X, 
  Landmark, 
  Upload,
  LayoutGrid,
  List,
  Table,
  Percent,
  Wallet,
  ShoppingBag,
  Calendar,
  Zap,
  RefreshCw,
  MessageSquare
} from 'lucide-react';
import { SubscriptionFlow } from '../pages/SubscriptionPage';
import { entitlementService } from '../services/entitlementService';

interface ProviderSubscriptionTabbedProps {
  providerSubscription: any;
  setProviderSubscription: (val: any) => void;
  subscriptions: any[];
  additionalFeatures: any[];
  purchasedStaffSlots: number;
  setPurchasedStaffSlots: (val: number) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', msg: string) => void;
  currentProviderName: string;
  providerStaffList: any[];
  adminActiveGateway: string;
  initialSubTab?: 'current' | 'upgrade' | 'addons';
}

export const ProviderSubscriptionTabbed: React.FC<ProviderSubscriptionTabbedProps> = ({
  providerSubscription,
  setProviderSubscription,
  subscriptions,
  additionalFeatures,
  purchasedStaffSlots,
  setPurchasedStaffSlots,
  showNotification,
  currentProviderName,
  providerStaffList,
  adminActiveGateway,
  initialSubTab
}) => {
  const [providerSubTab, setProviderSubTab] = useState<'current' | 'upgrade' | 'addons'>(() => {
    if (initialSubTab) return initialSubTab;
    try {
      const stored = localStorage.getItem('PROVIDER_SUBSCRIPTION_ACTIVE_SUBTAB');
      if (stored === 'upgrade' || stored === 'addons' || stored === 'current') {
        localStorage.removeItem('PROVIDER_SUBSCRIPTION_ACTIVE_SUBTAB');
        return stored;
      }
    } catch (e) {}
    return 'current';
  });

  useEffect(() => {
    const handleSubTabChange = (e: any) => {
      const target = e.detail;
      if (target === 'current' || target === 'upgrade' || target === 'addons') {
        setProviderSubTab(target);
      }
    };
    window.addEventListener('changeProviderSubTab', handleSubTabChange);
    return () => {
      window.removeEventListener('changeProviderSubTab', handleSubTabChange);
    };
  }, []);

  useEffect(() => {
    try {
      const highlight = localStorage.getItem('PROVIDER_SUBSCRIPTION_HIGHLIGHT_ADDON');
      if (highlight === 'provider_staff') {
        localStorage.removeItem('PROVIDER_SUBSCRIPTION_HIGHLIGHT_ADDON');
        setProviderSubTab('addons');
        setProviderSelectedStaffSlots(prev => (prev === 0 ? 1 : prev));
      } else if (highlight === 'logistics_operations') {
        localStorage.removeItem('PROVIDER_SUBSCRIPTION_HIGHLIGHT_ADDON');
        setProviderSubTab('addons');
      }
    } catch (e) {}
  }, []);

  const [addonViewFormat, setAddonViewFormat] = useState<'grid' | 'list' | 'table'>('grid');
  
  // Selection states for add-on quantities / toggles
  const [providerSelectedHalls, setProviderSelectedHalls] = useState(0);
  const [providerSelectedServices, setProviderSelectedServices] = useState(0);
  const [providerSelectedStaffSlots, setProviderSelectedStaffSlots] = useState(0);
  const [providerSelectedHallBundles, setProviderSelectedHallBundles] = useState(0);
  const [selectedAddonFeatureIds, setSelectedAddonFeatureIds] = useState<string[]>([]);

  const [providerAddonCycles, setProviderAddonCycles] = useState<Record<string, 'monthly' | 'yearly'>>({});
  const [isAddonCheckoutOpen, setIsAddonCheckoutOpen] = useState(false);
  const [isProcessingAddonPayment, setIsProcessingAddonPayment] = useState(false);

  const paymentSettings = useMemo(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    return {
      mada: true,
      creditMax: true,
      apple: true,
      stc: true,
      google_pay: false,
      tabby: true,
      tamara: true,
      bank_transfer: true,
    };
  }, []);

  const enabledAddonMethods = useMemo(() => {
    const list = [
      { key: 'mada', name: 'مدى (Mada)', icon: CreditCard, colorClass: 'text-amber-500', type: 'mada' },
      { key: 'creditMax', name: 'فيزا / ماستركارد', icon: CreditCard, colorClass: 'text-amber-500', type: 'creditMax' },
      { key: 'apple', name: 'Apple Pay ', icon: CreditCard, colorClass: 'text-slate-900', type: 'apple' },
      { key: 'stc', name: 'STC Pay', icon: Wallet, colorClass: 'text-emerald-500', type: 'stc' },
      { key: 'google_pay', name: 'Google Pay', icon: Wallet, colorClass: 'text-[11px] font-bold text-slate-900', type: 'google_pay' },
      { key: 'tabby', name: 'تابي (Tabby)', icon: Percent, colorClass: 'text-teal-555', type: 'tabby' },
      { key: 'tamara', name: 'تمارا (Tamara)', icon: Percent, colorClass: 'text-amber-600', type: 'tamara' },
      { key: 'bank_transfer', name: 'حوالة بنكية / إيداع', icon: Landmark, colorClass: 'text-amber-650', type: 'transfer' },
    ];
    return list.filter(m => paymentSettings[m.key as keyof typeof paymentSettings]);
  }, [paymentSettings]);

  const [addonPaymentMethod, setAddonPaymentMethod] = useState(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      const parsed = stored ? JSON.parse(stored) : null;
      const settings = parsed || {
        mada: true,
        creditMax: true,
        apple: true,
        stc: true,
        google_pay: false,
        tabby: true,
        tamara: true,
        bank_transfer: true,
      };
      if (settings.mada) return 'mada';
      if (settings.creditMax) return 'creditMax';
      if (settings.apple) return 'apple';
      if (settings.stc) return 'stc';
      if (settings.google_pay) return 'google_pay';
      if (settings.tabby) return 'tabby';
      if (settings.tamara) return 'tamara';
      if (settings.bank_transfer) return 'transfer';
    } catch (e) {
      console.error(e);
    }
    return 'mada';
  });

  const activePackageName = providerSubscription?.packageName_display || providerSubscription?.packageName || 'الباقة المكنونة المتقدمة';
  const billingCycleText = providerSubscription?.billingCycle === 'yearly' ? 'فوترة سنوية' : 'فوترة شهرية';
  const hallsCapacity = providerSubscription?.hallsLimit === 'unlimited' ? 'غير محدود ♾️' : providerSubscription?.hallsLimit || 'غير محدود';
  const servicesCapacity = providerSubscription?.servicesLimit === 'unlimited' ? 'غير محدود ♾️' : providerSubscription?.servicesLimit || 'غير محدود';

  // Calculate staff limits
  const isCorporatePackage = providerSubscription?.packageName === 'باقة الشركات والمؤسسات' || 
                              providerSubscription?.packageName_display?.includes('المؤسسات') || 
                              providerSubscription?.packageName_display?.includes('الشركات');
  const isBasicPackage = providerSubscription?.packageName === 'الباقة الأساسية' || providerSubscription?.id === 'basic';
  const rawSeatsLimit = isBasicPackage ? '0' : providerSubscription?.staffSeatsLimit;
  const isUnlimitedSeats = rawSeatsLimit === '' || rawSeatsLimit === undefined || rawSeatsLimit === null || String(rawSeatsLimit).trim() === '' || String(rawSeatsLimit).toLowerCase() === 'unlimited';
  const baseStaffLimit = isUnlimitedSeats ? 999999 : (rawSeatsLimit === '0' || rawSeatsLimit === 0 ? 0 : (parseInt(String(rawSeatsLimit), 10) || (isCorporatePackage ? 15 : 3)));

  const bonusStaffSlots = useMemo(() => {
    try {
      const stored = localStorage.getItem(`PROVIDER_BONUS_STAFF_SLOTS_${currentProviderName}`);
      return stored ? parseInt(stored, 10) : 0;
    } catch { return 0; }
  }, [currentProviderName]);

  const totalSlots = baseStaffLimit + (providerSubscription?.purchasedStaffSlots || purchasedStaffSlots) + bonusStaffSlots;
  const myStaff = useMemo(() => providerStaffList.filter(s => s.providerName === currentProviderName), [providerStaffList, currentProviderName]);
  const usedSlots = myStaff.length;
  const remainingSlots = Math.max(0, totalSlots - usedSlots);

  // Helper getters for addon cycles and prices
  const getAddonBillingCycle = (id: string) => {
    return providerAddonCycles[id] || 'monthly';
  };

  const isFeatSelected = (id: string): boolean => {
    return selectedAddonFeatureIds.includes(id);
  };

  const toggleFeatSelection = (id: string) => {
    setSelectedAddonFeatureIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const getAddonCost = (id: string) => {
    const feat = additionalFeatures.find((f: any) => f.id === id);
    if (!feat) return 0;
    const isYearly = getAddonBillingCycle(id) === 'yearly';
    return isYearly ? feat.priceYearly : feat.priceMonthly;
  };

  const isAddonActive = (featId: string) => {
    if (!providerSubscription) return false;
    if (featId === 'mini_products_store') {
      return (
        entitlementService.isEntitled(currentProviderName, 'mini_products_store') ||
        !!providerSubscription.includesMiniStore ||
        !!providerSubscription.hasMiniStore ||
        !!providerSubscription.addons?.includes('mini_products_store') ||
        !!providerSubscription.addons?.includes('mini_store') ||
        !!providerSubscription.addons?.includes('venue_products_store')
      );
    }
    if (featId === 'inventory') {
      return !!providerSubscription.includesInventory || !!providerSubscription.addons?.includes('inventory');
    }
    if (featId === 'suppliers') {
      return !!providerSubscription.includesSuppliers || !!providerSubscription.addons?.includes('suppliers');
    }
    if (featId === 'invoice_export') {
      return !!providerSubscription.canExportFinancials || !!providerSubscription.addons?.includes('invoice_export');
    }
    if (featId === 'support') {
      return !!providerSubscription.hasSupport || !!providerSubscription.addons?.includes('support');
    }
    if (featId === 'weekend_pricing') {
      return !!providerSubscription.includesWeekendPricing || !!providerSubscription.addons?.includes('weekend_pricing') || providerSubscription.id === 'pro' || providerSubscription.id === 'business' || !!providerSubscription.includesDynamicPricing || !!providerSubscription.addons?.includes('dynamic_pricing');
    }
    if (featId === 'dynamic_surge_pricing') {
      return !!providerSubscription.includesDynamicSurgePricing || !!providerSubscription.addons?.includes('dynamic_surge_pricing') || providerSubscription.id === 'pro' || !!providerSubscription.includesDynamicPricing || !!providerSubscription.addons?.includes('dynamic_pricing');
    }
    if (featId === 'financial_forecast') {
      return !!providerSubscription.includesFinancialForecast || !!providerSubscription.addons?.includes('financial_forecast');
    }
    if (featId === 'partial_payment') {
      return !!providerSubscription.includesPartialPayment || !!providerSubscription.addons?.includes('partial_payment');
    }
    if (featId === 'whatsapp_campaign_alerts') {
      return !!providerSubscription.includesWhatsAppCampaignAlerts || !!providerSubscription.addons?.includes('whatsapp_campaign_alerts') || providerSubscription.id === 'pro';
    }
    if (featId === 'six_stages_lifecycle') {
      return !!providerSubscription.includesSixStages || !!providerSubscription.addons?.includes('six_stages_lifecycle') || providerSubscription.id === 'pro' || providerSubscription.id === 'business';
    }
    if (featId === 'provider_staff') {
      return (providerSubscription.purchasedStaffSlots || 0) > 0 || !!providerSubscription.addons?.includes('provider_staff');
    }
    if (featId === 'halls') {
      return (providerSubscription.additionalHalls || 0) > 0;
    }
    if (featId === 'services') {
      return (providerSubscription.additionalServices || 0) > 0;
    }
    return !!providerSubscription.addons?.includes(featId);
  };

  // Checkout Calculations
  const checkoutSummary = useMemo(() => {
    let baseTotal = 0;
    let totalDiscount = 0;

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
    if (providerSelectedHallBundles > 0) {
      const cost = getAddonCost('hall_bundles') * providerSelectedHallBundles;
      const feat = additionalFeatures.find(f => f.id === 'hall_bundles');
      const discPercent = feat ? feat.discount || 0 : 0;
      baseTotal += cost;
      totalDiscount += cost * (discPercent / 100);
    }
    
    selectedAddonFeatureIds.forEach((id) => {
      const cost = getAddonCost(id);
      const feat = additionalFeatures.find(f => f.id === id);
      const discPercent = feat ? feat.discount || 0 : 0;
      baseTotal += cost;
      totalDiscount += cost * (discPercent / 100);
    });

    const vatAmount = (baseTotal - totalDiscount) * 0.15;
    const finalTotal = baseTotal - totalDiscount + vatAmount;

    return { baseTotal, totalDiscount, vatAmount, finalTotal };
  }, [
    providerSelectedHalls, 
    providerSelectedServices, 
    providerSelectedStaffSlots,
    providerSelectedHallBundles,
    selectedAddonFeatureIds,
    providerAddonCycles,
    additionalFeatures
  ]);

  const hasYearly = additionalFeatures.some(f => getAddonBillingCycle(f.id) === 'yearly');
  const invoiceCycleLabel = hasYearly ? 'دورة' : 'شهر';

  const handleConfirmPayment = () => {
    setIsAddonCheckoutOpen(false);
    setIsProcessingAddonPayment(true);
    
    setTimeout(() => {
      setIsProcessingAddonPayment(false);
      
      const newAddons = [...(providerSubscription.addons || [])];
      
      selectedAddonFeatureIds.forEach(id => {
        if (!newAddons.includes(id)) {
          newAddons.push(id);
        }
        if (id === 'mini_products_store') {
          const miniStoreCycle = getAddonBillingCycle('mini_products_store');
          entitlementService.activateAddon(
            currentProviderName || 'unknown',
            'mini_products_store',
            {
              cycle: miniStoreCycle,
              source: 'checkout',
              note: `تفعيل ميزة متجر المنتجات والمستلزمات المصغر عبر بوابة الدفع (${miniStoreCycle === 'yearly' ? 'سنوي' : 'شهري'})`
            }
          );
        }
      });

      if (providerSelectedStaffSlots > 0 && !newAddons.includes('provider_staff')) {
        newAddons.push('provider_staff');
      }
      if (providerSelectedHallBundles > 0 && !newAddons.includes('hall_bundles')) {
        newAddons.push('hall_bundles');
      }
      
      const finalHalls = Number(providerSubscription.additionalHalls || 0) + providerSelectedHalls;
      const finalServices = Number(providerSubscription.additionalServices || 0) + providerSelectedServices;
      const finalStaffSlots = Number(providerSubscription.purchasedStaffSlots || 0) + providerSelectedStaffSlots;
      const finalHallBundles = Number(providerSubscription.additionalHallBundles || 0) + providerSelectedHallBundles;
      
      const updated = {
        ...providerSubscription,
        additionalHalls: finalHalls,
        additionalServices: finalServices,
        purchasedStaffSlots: finalStaffSlots,
        additionalHallBundles: finalHallBundles,
        includesInventory: providerSubscription.includesInventory || selectedAddonFeatureIds.includes('inventory'),
        includesSuppliers: providerSubscription.includesSuppliers || selectedAddonFeatureIds.includes('suppliers'),
        canExportFinancials: providerSubscription.canExportFinancials || selectedAddonFeatureIds.includes('invoice_export'),
        hasSupport: providerSubscription.hasSupport || selectedAddonFeatureIds.includes('support'),
        includesWeekendPricing: providerSubscription.includesWeekendPricing || selectedAddonFeatureIds.includes('weekend_pricing'),
        includesDynamicSurgePricing: providerSubscription.includesDynamicSurgePricing || selectedAddonFeatureIds.includes('dynamic_surge_pricing'),
        includesFinancialForecast: providerSubscription.includesFinancialForecast || selectedAddonFeatureIds.includes('financial_forecast'),
        includesPartialPayment: providerSubscription.includesPartialPayment || selectedAddonFeatureIds.includes('partial_payment'),
        includesMiniStore: providerSubscription.includesMiniStore || selectedAddonFeatureIds.includes('mini_products_store'),
        includesWhatsAppCampaignAlerts: providerSubscription.includesWhatsAppCampaignAlerts || selectedAddonFeatureIds.includes('whatsapp_campaign_alerts'),
        includesSixStages: providerSubscription.includesSixStages || selectedAddonFeatureIds.includes('six_stages_lifecycle'),
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
      setProviderSelectedHallBundles(0);
      setSelectedAddonFeatureIds([]);
      
      showNotification('success', 'تهانينا! تم تفعيل وتوثيق الميزات التنافسية الإضافية بنجاح في نظام الشريك المباشر.');
      
      // Dispatch sync events
      window.dispatchEvent(new Event('subscriptionUpdated'));
      window.dispatchEvent(new CustomEvent('chat-system-status-changed'));
    }, 1800);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-right" dir="rtl">
      {/* Header Panel */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-slate-150 pb-5">
        <div>
          <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <span className="p-2.5 bg-amber-500/10 rounded-2xl text-amber-600 border border-amber-500/10">
              <Crown className="w-6 h-6 animate-pulse text-amber-500" />
            </span>
            مركز إدارة باقات الاشتراكات وسوق الميزات الإضافية والقدرات التشغيلية
          </h2>
          <p className="text-slate-500 mt-2 text-xs leading-relaxed max-w-2xl font-sans">
            ضبط مستويات العضوية، نسب العمولات، وتسعير القدرات والمزايا الإضافية
          </p>
        </div>

        {/* Quick status bar */}
        <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 p-3 rounded-2xl self-start md:self-auto min-w-[220px]">
          <div className="px-3 border-l border-slate-200">
            <span className="text-[10px] text-slate-400 block font-bold font-sans">باقة الحساب الحالية:</span>
            <span className="text-xs font-extrabold text-indigo-950 font-sans">{activePackageName}</span>
          </div>
          <div className="px-3">
            <span className="text-[10px] text-slate-400 block font-bold font-sans">حالة الترخيص:</span>
            <span className="text-xs font-black text-green-600 flex items-center gap-1.5 font-sans">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
              نشط ومفعّل
            </span>
          </div>
        </div>
      </div>

      {/* Modern Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 pb-px gap-2 sm:gap-4 scrollbar-none">
        <button
          onClick={() => setProviderSubTab('current')}
          className={`pb-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            providerSubTab === 'current'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Crown className="w-4 h-4 text-amber-500" />
          الباقة النشطة الحالية والحلول المفعلة
        </button>
        <button
          onClick={() => setProviderSubTab('upgrade')}
          className={`pb-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            providerSubTab === 'upgrade'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-500" />
          ترقية وتغيير الباقة العامة 📈
        </button>
        <button
          onClick={() => setProviderSubTab('addons')}
          className={`pb-3.5 px-4 text-xs sm:text-sm font-black border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            providerSubTab === 'addons'
              ? 'border-amber-500 text-amber-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-4 h-4 text-orange-500" />
          تبويب الترقيات والميزات الإضافية 💎
        </button>
      </div>

      {/* Tab 1: Current active specs */}
      {providerSubTab === 'current' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Card left */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 text-white p-6 rounded-3xl border border-slate-800/80 shadow-xl space-y-5">
            <div className="border-b border-indigo-900/40 pb-4">
              <span className="bg-amber-500/10 text-amber-500 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-500/20 font-sans">
                تفاصيل وثيقة الاشتراك النشط
              </span>
              <h3 className="text-lg font-black text-amber-500 mt-3">{activePackageName}</h3>
              <p className="text-slate-400 text-[10px] mt-1 font-sans">
                وثيقة التفعيل المالي: <span className="font-mono text-amber-400">#SUB-LA-{(providerSubscription?.id || '99231')}</span>
              </p>
            </div>

            <div className="space-y-3 text-xs leading-normal">
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/40">
                <span className="text-slate-300">حالة التفعيل:</span>
                <span className="flex items-center gap-1.5 text-green-400 font-extrabold font-sans">
                  <span className="w-2 h-2 rounded-full bg-green-505 bg-green-500 animate-pulse"></span>
                  نشط ومعتمد ✓
                </span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/40">
                <span className="text-slate-300">معدل الفوترة:</span>
                <span className="text-white font-extrabold font-sans">{billingCycleText}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/40">
                <span className="text-slate-300">سعة القاعات المشمولة:</span>
                <span className="text-amber-400 font-extrabold font-sans">{hallsCapacity}</span>
              </div>

              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-850/40">
                <span className="text-slate-300">سعة الخدمات المرافقة المشمولة:</span>
                <span className="text-amber-400 font-extrabold font-sans">{servicesCapacity}</span>
              </div>

              {/* Staff seats slots check */}
              <div className="bg-slate-950/50 p-3.5 rounded-xl border border-slate-850/40 space-y-2">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-slate-300">مقاعد موظفي شريك المنصة (كوتا):</span>
                  <span className="text-amber-400 font-extrabold font-mono text-xs">{usedSlots} / {totalSlots} مقعد</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(100, (usedSlots / totalSlots) * 105)}%` }} 
                  />
                </div>
                <p className="text-[10px] text-slate-400 leading-normal font-sans">
                  لديك {remainingSlots} كوتا إضافية شاغرة متبقية لإضافة موظفين جدد.
                </p>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-2xl p-3.5 text-[11px] leading-relaxed text-slate-300">
              ✔️ <span className="font-extrabold text-amber-500">حكمة الترخيص:</span> تمنح الميزات المشمولة والمخطط المالي طابع التميز وتوطيد أعمال القاعات. قم بترقية باقتك لأبعاد أعمّ وأوسع في أي وقت.
            </div>
          </div>

          {/* Right features summary */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-100 pb-3 mb-4">
                <h3 className="text-base font-bold text-slate-900">مختصر الميزات التنافسية النشطة بحسابكم الداخلي ⚙️</h3>
                <p className="text-slate-500 text-xs mt-1 font-sans">الاستعراض المفصل للميزات والحلول المصرفية النشطة على حسابك:</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {additionalFeatures.filter((feat: any) => feat.isVisible !== false || isAddonActive(feat.id)).map((feat) => {
                  const isActive = isAddonActive(feat.id);
                  let iconColor = "bg-slate-100 text-slate-450";
                  let IconComponent = Box;
                  if (feat.id === 'mini_products_store') { IconComponent = ShoppingBag; iconColor = isActive ? "bg-emerald-100 text-emerald-600 animate-pulse" : iconColor; }
                  else if (feat.id === 'inventory') { IconComponent = Box; iconColor = isActive ? "bg-indigo-100 text-indigo-600 animate-pulse" : iconColor; }
                  else if (feat.id === 'suppliers') { IconComponent = Users2; iconColor = isActive ? "bg-amber-100 text-amber-600" : iconColor; }
                  else if (feat.id === 'invoice_export') { IconComponent = FileText; iconColor = isActive ? "bg-blue-100 text-blue-600" : iconColor; }
                  else if (feat.id === 'support') { IconComponent = Headset; iconColor = isActive ? "bg-teal-100 text-teal-600" : iconColor; }
                  else if (feat.id === 'weekend_pricing') { IconComponent = Calendar; iconColor = isActive ? "bg-amber-100 text-amber-600" : iconColor; }
                  else if (feat.id === 'dynamic_surge_pricing') { IconComponent = Zap; iconColor = isActive ? "bg-purple-100 text-purple-600 animate-pulse" : iconColor; }
                  else if (feat.id === 'financial_forecast') { IconComponent = TrendingUp; iconColor = isActive ? "bg-amber-100 text-amber-600 animate-pulse" : iconColor; }
                  else if (feat.id === 'partial_payment') { IconComponent = Percent; iconColor = isActive ? "bg-cyan-100 text-cyan-600" : iconColor; }
                  else if (feat.id === 'whatsapp_campaign_alerts') { IconComponent = MessageSquare; iconColor = isActive ? "bg-green-100 text-green-600" : iconColor; }
                  else if (feat.id === 'six_stages_lifecycle') { IconComponent = RefreshCw; iconColor = isActive ? "bg-blue-100 text-blue-600 animate-pulse" : iconColor; }
                  else if (feat.id === 'provider_staff') { IconComponent = Users2; iconColor = isActive ? "bg-purple-100 text-purple-600" : iconColor; }
                  else if (feat.id === 'halls') { IconComponent = Layers; iconColor = isActive ? "bg-sky-100 text-sky-600" : iconColor; }
                  else if (feat.id === 'services') { IconComponent = Sparkles; iconColor = isActive ? "bg-rose-100 text-rose-600" : iconColor; }

                  return (
                    <div key={feat.id} className={`p-4 rounded-2xl border transition-all flex items-start gap-3.5 ${isActive ? 'bg-emerald-50/20 border-emerald-100' : 'bg-slate-50/50 border-slate-150 opacity-60'}`}>
                      <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${iconColor}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm font-sans flex items-center gap-2">
                          {feat.name}
                          {isActive ? (
                            <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded-full font-sans">
                              نشطة مفعّلة ✓
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-500 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                              متاحة للطلب
                            </span>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{feat.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Upgrade global package */}
      {providerSubTab === 'upgrade' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="border-b border-slate-100 pb-3.5 mb-4">
            <h3 className="text-lg font-black text-slate-900">ترقية باقة الشراكة الشاملة 🚀</h3>
            <p className="text-slate-500 text-xs mt-1 leading-relaxed font-sans max-w-2xl">
              تصفح مستويات الاشتراك التي تقدمها ليلة للشركاء، واختر الخصائص التي تمنحك إبرازاً وثباتاً أكبر لمؤسستك وسدد الرسوم الفارق فوراً وبطريقة آمنة تماماً.
            </p>
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
            onSuccess={(updatedSub) => {
              setProviderSubscription(updatedSub);
              const subKey = currentProviderName ? `provider_subscription_${currentProviderName}` : 'provider_subscription';
              localStorage.setItem(subKey, JSON.stringify(updatedSub));
              if (updatedSub.purchasedStaffSlots !== undefined) {
                setPurchasedStaffSlots(updatedSub.purchasedStaffSlots);
                localStorage.setItem('PROVIDER_PURCHASED_STAFF_SLOTS', updatedSub.purchasedStaffSlots.toString());
              }
              showNotification('success', `تم تفويض وثيقة الترخيص الجديدة بنجاح إلى "${updatedSub.packageName_display || updatedSub.packageName}"!`);
              setProviderSubTab('current');
            }} 
          />
        </div>
      )}

      {/* Tab 3: Supplementary features / Add-ons activation */}
      {providerSubTab === 'addons' && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Addons Grid/List/Table */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <div className="border-b border-slate-100 pb-4 mb-4 flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                <div>
                  <h3 className="text-base font-bold text-indigo-950">تفعيل وتنشيط الميزات الإضافية ⚖️</h3>
                  <p className="text-slate-500 text-[11px] font-sans">مجموعة الموارد التنافسية المتقدمة لإنعاش الكفاءة التشغيلية لمؤسستك على منصة ليلة.</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
                  <span className="text-slate-400 text-[10px] font-bold font-sans">العرض:</span>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => setAddonViewFormat('grid')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        addonViewFormat === 'grid'
                          ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" /> شبكي
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddonViewFormat('list')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        addonViewFormat === 'list'
                          ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      <List className="w-3.5 h-3.5" /> قائمة
                    </button>
                    <button
                      type="button"
                      onClick={() => setAddonViewFormat('table')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                        addonViewFormat === 'table'
                          ? 'bg-amber-500 text-slate-900 shadow-sm font-black'
                          : 'text-slate-500 hover:text-slate-850'
                      }`}
                    >
                      <Table className="w-3.5 h-3.5" /> جدولي
                    </button>
                  </div>
                </div>
              </div>

              {/* GRID VIEW */}
              {addonViewFormat === 'grid' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {additionalFeatures.filter((feat: any) => feat.isVisible !== false || isAddonActive(feat.id)).map((feat) => {
                    const isServiceAddon = feat.id === 'services';
                    const isHallsAddon = feat.id === 'halls';
                    const isStaffAddon = feat.id === 'provider_staff';
                    const isHallBundlesAddon = feat.id === 'hall_bundles';
                    const isCheckable = !isServiceAddon && !isHallsAddon && !isStaffAddon && !isHallBundlesAddon;

                    const isAddonYearly = getAddonBillingCycle(feat.id) === 'yearly';
                    const currentCost = isAddonYearly ? feat.priceYearly : feat.priceMonthly;
                    const finalCostAfterDisc = currentCost * (1 - (feat.discount || 0) / 100);

                    const isAlreadyActive = isAddonActive(feat.id);

                    return (
                      <div key={feat.id} className={`bg-slate-50 p-4 rounded-2xl border transition-all hover:shadow-sm flex flex-col justify-between relative overflow-hidden ${isAlreadyActive ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'}`}>
                        {feat.discount > 0 && !isAlreadyActive && (
                          <span className="absolute top-0 left-0 bg-red-500 text-white font-black text-[9px] px-2.5 py-0.5 rounded-br-xl select-none font-mono">
                            خصم {feat.discount}%
                          </span>
                        )}

                        <div className="mt-2 space-y-1">
                          <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm flex items-center gap-1.5 flex-wrap">
                            <span className={`w-2 h-2 rounded-full ${isAlreadyActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-350'}`}></span>
                            {feat.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{feat.description}</p>
                        </div>

                        {/* Billing Cycle Choice */}
                        <div className="mt-3 flex items-center justify-between bg-slate-100 p-1.5 rounded-xl border border-slate-200/50">
                          <span className="text-[10px] text-slate-400 font-bold pr-1">دورة الفوترة:</span>
                          <div className="flex bg-slate-200/50 p-0.5 rounded-lg text-[9px] font-bold">
                            <button
                              type="button"
                              disabled={isAlreadyActive}
                              onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'monthly' }))}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                !isAddonYearly
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : 'text-slate-500'
                              } ${isAlreadyActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              شهرياً
                            </button>
                            <button
                              type="button"
                              disabled={isAlreadyActive}
                              onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'yearly' }))}
                              className={`px-2 py-0.5 rounded-md transition-all ${
                                isAddonYearly
                                  ? 'bg-amber-400 text-slate-950 font-black'
                                  : 'text-slate-500'
                              } ${isAlreadyActive ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              سنوياً
                            </button>
                          </div>
                        </div>

                        {/* Costs controls */}
                        <div className="mt-3 border-t border-slate-200/50 pt-2 flex items-center justify-between">
                          <div className="text-right">
                            <span className="text-[10px] text-slate-400 block line-through">
                              {feat.discount > 0 && !isAlreadyActive ? `${currentCost} ر.س` : ''}
                            </span>
                            <span className="text-xs sm:text-sm font-black text-slate-900">
                              {isAlreadyActive ? 'نشط بالاشتراك' : `${finalCostAfterDisc.toFixed(2)} ر.س`}
                              {!isAlreadyActive && <span className="text-[10px] text-slate-400 font-normal"> / {isAddonYearly ? 'سنوياً' : 'شهرياً'}</span>}
                            </span>
                          </div>

                          <div>
                            {isHallsAddon && (
                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 font-mono text-xs">
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedHalls(prev => Math.max(0, prev - 1))}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-450 hover:bg-amber-450 hover:bg-amber-500 text-slate-800"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-slate-900 w-5 text-center">{providerSelectedHalls}</span>
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedHalls(prev => prev + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                >
                                  +
                                </button>
                              </div>
                            )}

                            {isServiceAddon && (
                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 font-mono text-xs">
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedServices(prev => Math.max(0, prev - 1))}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-slate-900 w-5 text-center">{providerSelectedServices}</span>
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedServices(prev => prev + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                >
                                  +
                                </button>
                              </div>
                            )}

                             {isStaffAddon && (
                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 font-mono text-xs">
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedStaffSlots(prev => Math.max(0, prev - 1))}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-slate-900 w-5 text-center">{providerSelectedStaffSlots}</span>
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedStaffSlots(prev => prev + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                >
                                  +
                                </button>
                              </div>
                            )}

                            {isHallBundlesAddon && (
                              <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 font-mono text-xs">
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedHallBundles(prev => Math.max(0, prev - 1))}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                >
                                  -
                                </button>
                                <span className="font-extrabold text-slate-900 w-5 text-center">{providerSelectedHallBundles}</span>
                                <button
                                  type="button"
                                  onClick={() => setProviderSelectedHallBundles(prev => prev + 1)}
                                  className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                >
                                  +
                                </button>
                              </div>
                            )}

                            {isCheckable && (
                              isAlreadyActive ? (
                                <button
                                  type="button"
                                  disabled
                                  className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold cursor-not-allowed"
                                >
                                  نشط بالباقة ✓
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => toggleFeatSelection(feat.id)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                    isFeatSelected(feat.id)
                                      ? 'bg-amber-500 text-slate-950 shadow-sm'
                                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                  }`}
                                >
                                  {isFeatSelected(feat.id) ? 'تم الاختيار ✓' : 'تفعيل الميزة +'}
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

                  {/* LIST VIEW */}
                  {addonViewFormat === 'list' && (
                    <div className="space-y-3">
                      {additionalFeatures.filter((feat: any) => feat.isVisible !== false || isAddonActive(feat.id)).map((feat) => {
                        const isServiceAddon = feat.id === 'services';
                        const isHallsAddon = feat.id === 'halls';
                        const isStaffAddon = feat.id === 'provider_staff';
                        const isCheckable = !isServiceAddon && !isHallsAddon && !isStaffAddon;

                        const isAddonYearly = getAddonBillingCycle(feat.id) === 'yearly';
                        const currentCost = isAddonYearly ? feat.priceYearly : feat.priceMonthly;
                        const finalCostAfterDisc = currentCost * (1 - (feat.discount || 0) / 100);

                        const isAlreadyActive = isAddonActive(feat.id);

                        return (
                          <div key={feat.id} className={`bg-slate-50 p-4 rounded-2xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden ${isAlreadyActive ? 'border-emerald-250 bg-emerald-50/10' : 'border-slate-200'}`}>
                            {feat.discount > 0 && !isAlreadyActive && (
                              <span className="absolute top-0 left-0 bg-red-500 text-white font-bold text-[8px] px-2.5 py-0.5 rounded-br-lg select-none">
                                خصم {feat.discount}%
                              </span>
                            )}

                            <div className="flex items-start gap-2.5 flex-1">
                              <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isAlreadyActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`}></span>
                              <div className="space-y-2">
                                <div>
                                  <h4 className="font-extrabold text-slate-905 text-slate-900 text-sm">{feat.name}</h4>
                                  <p className="text-[11px] text-slate-500 font-sans leading-relaxed">{feat.description}</p>
                                </div>

                                <div className="flex items-center gap-2 bg-slate-150 p-1 rounded-lg border border-slate-200/40 w-fit">
                                  <span className="text-[9px] text-slate-400 font-bold px-1 font-sans">دورة الاشتراك:</span>
                                  <div className="flex bg-slate-200 p-0.5 rounded text-[8px] font-bold">
                                    <button
                                      type="button"
                                      disabled={isAlreadyActive}
                                      onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'monthly' }))}
                                      className={`px-1.5 py-0.5 rounded transition-all ${
                                        !isAddonYearly ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'
                                      }`}
                                    >
                                      شهري
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isAlreadyActive}
                                      onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'yearly' }))}
                                      className={`px-1.5 py-0.5 rounded transition-all ${
                                        isAddonYearly ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'
                                      }`}
                                    >
                                      سنوي
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 border-slate-200 pt-3 md:pt-0 shrink-0">
                              <div className="text-right">
                                <span className="text-[9px] text-slate-400 block line-through">
                                  {feat.discount > 0 && !isAlreadyActive ? `${currentCost} ر.س` : ''}
                                </span>
                                <span className="text-xs sm:text-sm font-black text-slate-900 block">
                                  {isAlreadyActive ? 'نشط بالاشتراك' : `${finalCostAfterDisc.toFixed(2)} ر.س`}
                                </span>
                                {!isAlreadyActive && <span className="text-[9px] text-slate-400 block font-normal"> / {isAddonYearly ? 'سنوياً' : 'شهرياً'}</span>}
                              </div>

                              <div className="flex items-center">
                                {isHallsAddon && (
                                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 font-mono text-xs shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => setProviderSelectedHalls(prev => Math.max(0, prev - 1))}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                    >
                                      -
                                    </button>
                                    <span className="font-extrabold text-slate-90 w-4 text-center">{providerSelectedHalls}</span>
                                    <button
                                      type="button"
                                      onClick={() => setProviderSelectedHalls(prev => prev + 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {isServiceAddon && (
                                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 font-mono text-xs shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => setProviderSelectedServices(prev => Math.max(0, prev - 1))}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                    >
                                      -
                                    </button>
                                    <span className="font-extrabold text-slate-90 w-4 text-center">{providerSelectedServices}</span>
                                    <button
                                      type="button"
                                      onClick={() => setProviderSelectedServices(prev => prev + 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {isStaffAddon && (
                                  <div className="flex items-center gap-1 bg-white rounded-lg p-1 border border-slate-200 font-mono text-xs shadow-sm">
                                    <button
                                      type="button"
                                      onClick={() => setProviderSelectedStaffSlots(prev => Math.max(0, prev - 1))}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                    >
                                      -
                                    </button>
                                    <span className="font-extrabold text-slate-90 w-4 text-center">{providerSelectedStaffSlots}</span>
                                    <button
                                      type="button"
                                      onClick={() => setProviderSelectedStaffSlots(prev => prev + 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-slate-100 hover:bg-amber-500 text-slate-800"
                                    >
                                      +
                                    </button>
                                  </div>
                                )}

                                {isCheckable && (
                                  isAlreadyActive ? (
                                    <button
                                      type="button"
                                      disabled
                                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-black cursor-not-allowed shadow-inner"
                                    >
                                      نشط بالباقة ✓
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => toggleFeatSelection(feat.id)}
                                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                                        isFeatSelected(feat.id)
                                          ? 'bg-amber-500 text-slate-950 shadow-sm'
                                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                                      }`}
                                    >
                                      {isFeatSelected(feat.id) ? 'تم الاختيار ✓' : 'تفعيل الميزة +'}
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

                  {/* TABLE VIEW */}
                  {addonViewFormat === 'table' && (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/10">
                      <table className="w-full border-collapse text-right text-xs" dir="rtl">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-200 text-slate-600 font-bold">
                            <th className="py-3 px-4 text-xs font-black font-sans">اسم الميزة والوصف الفني</th>
                            <th className="py-3 px-4 text-xs font-black text-center font-sans">دورة الاشتراك</th>
                            <th className="py-3 px-4 text-xs font-black text-center font-sans">خصم منصة ليلة</th>
                            <th className="py-3 px-4 text-xs font-black font-sans">الرسوم المستحقة</th>
                            <th className="py-3 px-4 text-xs font-black text-center font-sans">تنسيق التنشيط</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-150">
                          {additionalFeatures.filter((feat: any) => feat.isVisible !== false || isAddonActive(feat.id)).map((feat) => {
                            const isServiceAddon = feat.id === 'services';
                            const isHallsAddon = feat.id === 'halls';
                            const isStaffAddon = feat.id === 'provider_staff';
                            const isCheckable = !isServiceAddon && !isHallsAddon && !isStaffAddon;

                            const isAddonYearly = getAddonBillingCycle(feat.id) === 'yearly';
                            const currentCost = isAddonYearly ? feat.priceYearly : feat.priceMonthly;
                            const finalCostAfterDisc = currentCost * (1 - (feat.discount || 0) / 100);

                            const isAlreadyActive = isAddonActive(feat.id);

                            return (
                              <tr key={feat.id} className="hover:bg-slate-100/30 transition-colors">
                                <td className="py-3.5 px-4 font-sans">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full shrink-0 ${isAlreadyActive ? 'bg-emerald-500' : 'bg-slate-300'}`}></span>
                                    <div>
                                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm font-sans">{feat.name}</h4>
                                      <p className="text-[10px] text-slate-400 font-normal leading-relaxed font-sans max-w-sm">{feat.description}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="inline-flex bg-slate-150 p-0.5 rounded text-[9px] font-mono shadow-inner">
                                    <button
                                      type="button"
                                      disabled={isAlreadyActive}
                                      onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'monthly' }))}
                                      className={`px-1.5 py-0.5 rounded transition-all ${!isAddonYearly ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'}`}
                                    >
                                      شهري
                                    </button>
                                    <button
                                      type="button"
                                      disabled={isAlreadyActive}
                                      onClick={() => setProviderAddonCycles(prev => ({ ...prev, [feat.id]: 'yearly' }))}
                                      className={`px-1.5 py-0.5 rounded transition-all ${isAddonYearly ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500'}`}
                                    >
                                      سنوي
                                    </button>
                                  </div>
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  {feat.discount > 0 ? (
                                    <span className="bg-red-50 text-red-600 font-black text-[9px] px-2 py-0.5 rounded">خصم {feat.discount}%</span>
                                  ) : (
                                    <span className="text-slate-400">-</span>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 font-mono font-sans font-bold">
                                  {isAlreadyActive ? (
                                    <span className="text-emerald-700 text-[11px]">مشمول ونشط</span>
                                  ) : (
                                    <div>
                                      <span className="text-slate-904 block text-[12px]">{finalCostAfterDisc.toFixed(2)} ر.س</span>
                                      <span className="text-[9px] text-slate-400 block font-normal"> / {isAddonYearly ? 'سنوي' : 'شهري'}</span>
                                    </div>
                                  )}
                                </td>
                                <td className="py-3.5 px-4 text-center">
                                  <div className="flex justify-center">
                                    {isHallsAddon && (
                                      <div className="flex items-center gap-1 bg-white rounded p-1 border border-slate-200 shadow-sm font-mono text-xs">
                                        <button type="button" onClick={() => setProviderSelectedHalls(prev => Math.max(0, prev - 1))} className="w-5 h-5 flex items-center justify-center bg-slate-150 rounded">-</button>
                                        <span className="w-4 text-center">{providerSelectedHalls}</span>
                                        <button type="button" onClick={() => setProviderSelectedHalls(prev => prev + 1)} className="w-5 h-5 flex items-center justify-center bg-slate-150 rounded">+</button>
                                      </div>
                                    )}

                                    {isServiceAddon && (
                                      <div className="flex items-center gap-1 bg-white rounded p-1 border border-slate-200 shadow-sm font-mono text-xs">
                                        <button type="button" onClick={() => setProviderSelectedServices(prev => Math.max(0, prev - 1))} className="w-5 h-5 flex items-center justify-center bg-slate-150 rounded">-</button>
                                        <span className="w-4 text-center">{providerSelectedServices}</span>
                                        <button type="button" onClick={() => setProviderSelectedServices(prev => prev + 1)} className="w-5 h-5 flex items-center justify-center bg-slate-150 rounded">+</button>
                                      </div>
                                    )}

                                    {isStaffAddon && (
                                      <div className="flex items-center gap-1 bg-white rounded p-1 border border-slate-200 shadow-sm font-mono text-xs">
                                        <button type="button" onClick={() => setProviderSelectedStaffSlots(prev => Math.max(0, prev - 1))} className="w-5 h-5 flex items-center justify-center bg-slate-150 rounded">-</button>
                                        <span className="w-4 text-center font-bold text-amber-500">{providerSelectedStaffSlots}</span>
                                        <button type="button" onClick={() => setProviderSelectedStaffSlots(prev => prev + 1)} className="w-5 h-5 flex items-center justify-center bg-slate-150 rounded">+</button>
                                      </div>
                                    )}

                                    {isCheckable && (
                                      isAlreadyActive ? (
                                        <span className="text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">مفعّل بنجاح ✓</span>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => toggleFeatSelection(feat.id)}
                                          className={`px-3 py-1 rounded-xl text-[10px] font-black transition-all cursor-pointer ${
                                            isFeatSelected(feat.id)
                                              ? 'bg-amber-500 text-slate-950 font-black'
                                              : 'bg-white border text-slate-500 hover:bg-slate-50'
                                          }`}
                                        >
                                          {isFeatSelected(feat.id) ? 'محدد ✓' : 'تفعيل +'}
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

              {/* Sidebar review */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 text-white sticky top-6 space-y-4 shadow-lg">
                <div className="border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                    <h3 className="text-sm font-black text-white">تفاصيل فاتورة ترقية ميزات الشريك</h3>
                  </div>
                  <p className="text-slate-400 text-[10px] font-sans leading-normal mt-1">
                    تتم فوترة ميزات الشركاء كأقساط دورية تلحق بدورتك المالية الحالية.
                  </p>
                </div>

                <div className="min-h-[120px] space-y-2">
                  {providerSelectedHalls === 0 &&
                  providerSelectedServices === 0 &&
                  providerSelectedStaffSlots === 0 &&
                  providerSelectedHallBundles === 0 &&
                  selectedAddonFeatureIds.length === 0 ? (
                    <div className="flex flex-col items-center justify-center text-center text-slate-500 h-[120px] border border-dashed border-slate-800 bg-slate-950/20 rounded-2xl p-4">
                      <PackageSearch className="w-7 h-7 text-slate-600 mb-1" />
                      <p className="text-[11px] text-slate-400">لم تدرج ميزات للفوترة بعد.</p>
                      <p className="text-[9px] text-slate-600 font-sans mt-0.5">اختر تفعيل ميزات الشراكة باليمين للمتابعة.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-800 space-y-2 text-xs text-slate-350">
                      {providerSelectedHalls > 0 && (
                        <div className="flex justify-between items-center pt-2">
                          <span>إضافة قاعات زفاف (+{providerSelectedHalls}) <span className="text-[9px] text-slate-500">({getAddonBillingCycle('halls') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                          <span className="font-mono text-white font-bold font-sans">{(getAddonCost('halls') * providerSelectedHalls).toFixed(2)} ر.س</span>
                        </div>
                      )}
                      {providerSelectedServices > 0 && (
                        <div className="flex justify-between items-center pt-2">
                          <span>إضافة خدمات مساندة (+{providerSelectedServices}) <span className="text-[9px] text-slate-500">({getAddonBillingCycle('services') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                          <span className="font-mono text-white font-bold font-sans">{(getAddonCost('services') * providerSelectedServices).toFixed(2)} ر.س</span>
                        </div>
                      )}
                      {providerSelectedStaffSlots > 0 && (
                        <div className="flex justify-between items-center pt-2 font-bold text-amber-400">
                          <span>مقاعد موظفين إضافية (+{providerSelectedStaffSlots}) <span className="text-[9px] text-slate-500">({getAddonBillingCycle('provider_staff') === 'yearly' ? 'سنوي' : 'شهري'})</span></span>
                          <span className="font-mono text-amber-400 font-bold font-sans">{(getAddonCost('provider_staff') * providerSelectedStaffSlots).toFixed(2)} ر.س</span>
                        </div>
                      )}
                      {providerSelectedHallBundles > 0 && (
                        <div className="flex justify-between items-center pt-2 font-bold text-violet-400">
                          <span>زيادة باقات القاعة المسموحة (+{providerSelectedHallBundles}) <span className="text-[9px] text-slate-550">({getAddonBillingCycle('hall_bundles') === 'yearly' ? 'سنوياً' : 'شهرياً'})</span></span>
                          <span className="font-mono text-violet-400 font-bold font-sans">{(getAddonCost('hall_bundles') * providerSelectedHallBundles).toFixed(2)} ر.س</span>
                        </div>
                      )}
                      {selectedAddonFeatureIds.map((featId) => {
                        const feat = additionalFeatures.find((f: any) => f.id === featId);
                        if (!feat) return null;
                        const cycle = getAddonBillingCycle(featId);
                        const cost = getAddonCost(featId);
                        return (
                          <div key={featId} className="flex justify-between items-center pt-2 font-bold text-amber-400">
                            <span>{feat.name} <span className="text-[9px] text-slate-400">({cycle === 'yearly' ? 'سنوياً' : 'شهرياً'})</span></span>
                            <span className="font-mono text-amber-400 font-bold font-sans">{cost.toFixed(2)} ر.س</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Subtotal calculation */}
                {(providerSelectedHalls > 0 || providerSelectedServices > 0 || providerSelectedStaffSlots > 0 || providerSelectedHallBundles > 0 || selectedAddonFeatureIds.length > 0) && (
                  <div className="space-y-2 pt-3 border-t border-slate-800 text-xs font-bold leading-normal">
                    <div className="flex justify-between text-slate-400">
                      <span>إجمالي رسوم الميزات:</span>
                      <span className="font-mono">{checkoutSummary.baseTotal.toFixed(2)} ر.س</span>
                    </div>
                    {checkoutSummary.totalDiscount > 0 && (
                      <div className="flex justify-between text-red-400 font-bold">
                        <span>الخصومات البرمجية:</span>
                        <span className="font-mono">-{checkoutSummary.totalDiscount.toFixed(2)} ر.س</span>
                      </div>
                    )}
                    <div className="flex justify-between text-slate-400">
                      <span>ضريبة الخدمة المضافة (15%):</span>
                      <span className="font-mono">{checkoutSummary.vatAmount.toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-amber-500 border-t border-slate-800/55 pt-3">
                      <span>الإجمالي النهائي المطلوب:</span>
                      <span className="font-mono">{checkoutSummary.finalTotal.toFixed(2)} ر.س / {invoiceCycleLabel}</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddonCheckoutOpen(true)}
                      className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer mt-4"
                    >
                      <CreditCard className="w-5 h-5 text-slate-950" /> سداد وتفعيل الصلاحيات
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Addon Billing Checkout Modal */}
          {isAddonCheckoutOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-w-lg w-full text-right" dir="rtl animate-in fade-in duration-300">
                <div className="bg-slate-950 p-6 text-white relative">
                  <button onClick={() => setIsAddonCheckoutOpen(false)} className="absolute top-4 left-4 p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-bold">بوابة سداد وتفعيل ميزات شريك ليلة</h3>
                  <p className="text-slate-400 text-[10px] mt-1 font-sans">سداد مباشر آمن وتوثيق فوري لإسناد الحق الإداري.</p>
                </div>

                <div className="p-6 space-y-5">
                  <div className="bg-slate-50 p-4 border border-slate-150 rounded-2xl flex justify-between items-center">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-bold font-sans">المستحق الإجمالي شامل الضريبة المضافة:</span>
                      <h4 className="text-lg font-black text-slate-950 mt-1 font-mono">{checkoutSummary.finalTotal.toFixed(2)} <span className="text-xs font-normal">ر.س / {invoiceCycleLabel}</span></h4>
                    </div>
                    <span className="bg-emerald-50 text-emerald-850 border border-emerald-100 px-3 py-1.5 rounded-xl font-bold text-xs">اتصال آمن 🔒</span>
                  </div>

                  <div className="space-y-1 bg-amber-50/50 border border-amber-200/50 rounded-2xl p-3.5 text-xs text-slate-700 leading-normal">
                    <span className="font-black text-amber-900 flex items-center gap-1">🛡️ بوابة معالجة السحوبات والخصومات الفورية المعتمدة:</span>
                    <p className="text-[11px] text-slate-650 mt-1 font-sans">
                      يتم ترحيل هذه الدفعة المالية الموثقة مباشرة عبر بوابة: <span className="font-extrabold text-amber-800">{adminActiveGateway || 'مُيسر Moyasar API'}</span>.
                    </p>
                  </div>

                  {/* Payment method */}
                  <div className="space-y-1.5 animate-in fade-in duration-300">
                    <label className="text-[11px] font-bold text-slate-600 block">حدد أسلوب الدفع الفوري لشركاء ليلة:</label>
                    {enabledAddonMethods.length === 0 ? (
                      <div className="p-4 bg-rose-50 border border-rose-100 text-rose-800 text-center rounded-2xl text-xs font-bold leading-normal">
                        ⚠️ نعتذر منكم، لا توجد أي طرق دفع مفعلة حالياً من قبل الإدارة العامة للمنصة. يرجى مراجعة الإدارة.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                        {enabledAddonMethods.map((m) => {
                          const isSelected = addonPaymentMethod === m.key || (m.key === 'bank_transfer' && addonPaymentMethod === 'transfer') || (m.key === 'creditMax' && addonPaymentMethod === 'creditCard') || (m.key === 'mada' && addonPaymentMethod === 'creditCard');
                          const IconComponent = m.icon;
                          return (
                            <button
                              key={m.key}
                              type="button"
                              onClick={() => {
                                if (m.key === 'bank_transfer') {
                                  setAddonPaymentMethod('transfer');
                                } else if (m.key === 'creditMax' || m.key === 'mada') {
                                  setAddonPaymentMethod('creditCard');
                                } else {
                                  setAddonPaymentMethod(m.key);
                                }
                              }}
                              className={`p-2.5 rounded-2xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer text-center ${
                                isSelected
                                  ? 'border-amber-500 bg-amber-50/30 text-slate-950 font-black shadow-sm scale-[1.01]'
                                  : 'border-slate-200 text-slate-400 bg-white hover:text-slate-600 hover:bg-slate-50/40'
                              }`}
                            >
                              {m.key === 'apple' ? (
                                <span className={`font-sans font-black text-xs ${isSelected ? 'text-slate-950' : m.colorClass}`}> Pay</span>
                              ) : m.key === 'google_pay' ? (
                                <span className={`font-sans font-black text-[10px] ${isSelected ? 'text-slate-950' : m.colorClass}`}>G Pay</span>
                              ) : (
                                <>
                                  <IconComponent className={`w-4 h-4 ${isSelected ? 'text-amber-550' : m.colorClass}`} />
                                  <span className="text-[10px] font-bold leading-none">{m.name}</span>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {['creditCard', 'mada', 'creditMax'].includes(addonPaymentMethod) ? (
                    <div className="space-y-3.5 animate-in fade-in duration-200 text-right">
                      <div>
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">رقم بطاقة السداد:</label>
                        <input type="text" placeholder="XXXX XXXX XXXX XXXX" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-left font-mono font-bold text-xs" defaultValue="4222 9812 3341 0056" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">تاريخ الانتهاء المالي:</label>
                          <input type="text" placeholder="MM/YY" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono text-xs" defaultValue="11/29" />
                        </div>
                        <div>
                          <label className="text-[10px] text-slate-500 font-bold block mb-1">الرمز السري المزدوج:</label>
                          <input type="password" placeholder="***" className="w-full px-4 py-2.5 bg-slate-50 rounded-xl border border-slate-200 text-center font-mono text-xs" defaultValue="111" />
                        </div>
                      </div>
                    </div>
                  ) : ['apple', 'google_pay'].includes(addonPaymentMethod) ? (
                    <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center text-xs animate-in fade-in duration-200">
                      <div className="w-12 h-12 bg-black text-white rounded-full flex items-center justify-center mx-auto text-base font-black">
                        {addonPaymentMethod === 'apple' ? '' : 'G'}
                      </div>
                      <p className="font-bold text-slate-800 mt-2">
                        {addonPaymentMethod === 'apple' ? 'الدفع السريع بنقرة واحدة عبر Apple Pay' : 'الدفع السريع بنقرة واحدة عبر Google Pay'}
                      </p>
                      <p className="text-[11px] text-slate-400">سيتم مصادقة البصمة أو التعرف على الوجه لتأكيد الدفع فوراً.</p>
                    </div>
                  ) : ['stc'].includes(addonPaymentMethod) ? (
                    <div className="space-y-3 bg-emerald-50/10 p-4 rounded-2xl border border-emerald-500/10 text-right text-xs animate-in fade-in duration-200">
                      <p className="font-bold text-emerald-800 mb-2">الدفع عبر محفظة STC Pay الرقمية:</p>
                      <div className="space-y-1">
                        <label className="text-[10px] text-slate-500 font-bold block mb-1">رقم الجوال المسجل بالخدمة:</label>
                        <input type="text" placeholder="05XXXXXXXX" className="w-full px-4 py-2 bg-white rounded-xl border border-slate-200 text-left font-mono font-bold text-xs" defaultValue="0551234567" />
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">ستتلقى رمز فوري مكون من 4 أرقام لتفويض الدفع بنجاح.</p>
                    </div>
                  ) : ['tabby', 'tamara'].includes(addonPaymentMethod) ? (
                    <div className="space-y-3 bg-amber-50/20 p-4 rounded-2xl border border-amber-500/10 text-right text-xs animate-in fade-in duration-200 leading-relaxed">
                      <p className="font-extrabold text-amber-900 mb-1">
                        قسّم فاتورتك على دفعات ميسرة بدون فوائد عبر {addonPaymentMethod === 'tabby' ? 'تابي (Tabby)' : 'تمارا (Tamara)'}:
                      </p>
                      <div className="grid grid-cols-4 gap-2 text-center pt-2">
                        <div className="bg-white p-2 rounded-xl border border-amber-500/20 shadow-sm animate-pulse">
                          <span className="block font-sans font-black text-slate-800 text-[11px]">{(checkoutSummary.finalTotal / 4).toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">اليوم</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="block font-sans font-bold text-slate-550 text-[11px]">{(checkoutSummary.finalTotal / 4).toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">الشهر 1</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="block font-sans font-bold text-slate-550 text-[11px]">{(checkoutSummary.finalTotal / 4).toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">الشهر 2</span>
                        </div>
                        <div className="bg-slate-50 p-2 rounded-xl border border-slate-100">
                          <span className="block font-sans font-bold text-slate-550 text-[11px]">{(checkoutSummary.finalTotal / 4).toFixed(2)}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">الشهر 3</span>
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-2">✓ بدون فوائد أو رسوم مخفية. يطلب التحقق بالهوية الوطنية.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5 bg-amber-50/30 p-4 rounded-2xl border border-amber-500/10 text-xs text-slate-700 animate-in fade-in duration-200 leading-normal font-sans">
                      <p className="font-extrabold text-amber-900">حول القيمة المالية إلى qنوات لليلتنا للأعراس وبوابة الدعم الأهلي:</p>
                      <div className="space-y-1.5 text-[11px] text-slate-650 font-sans">
                        <p>اسم البنك: <span className="font-bold text-slate-900">البنك الأهلي السعودي (SNB)</span></p>
                        <p>اسم صاحب الحساب الحسابي: <span className="font-bold text-slate-900">بوابة مؤسسة منصة ليلة لجدولة الأعراس</span></p>
                        <p>رقم الحساب الجاري: <span className="font-bold text-slate-900 font-mono">1002340056789122</span></p>
                        <p>الآيبان الدولي: <span className="font-bold text-slate-900 font-mono text-[10px]">SA80 3000 0010 0234 0056 7891 22</span></p>
                      </div>

                      <div className="pt-2">
                        <label className="text-[10px] font-bold text-slate-500 block mb-1">أرفق مستند أو كشف إثبات التحويل البنكي:</label>
                        <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-inner">
                          <Upload className="w-5 h-5 text-amber-600 shrink-0" />
                          <span className="text-[10px] text-slate-700 font-bold font-sans">TransferReceipt_LailaPartner.pdf (مرفق ومعايّن)</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleConfirmPayment}
                      className="flex-1 bg-amber-550 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black py-3 rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                    >
                      تأكيد السداد والترقية الفورية
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddonCheckoutOpen(false)}
                      className="px-5 py-3 rounded-2xl border border-slate-200 text-slate-500 hover:bg-slate-50 font-semibold cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Loading overlay */}
          {isProcessingAddonPayment && (
            <div className="fixed inset-0 z-[60] bg-slate-955 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center text-white text-right" dir="rtl animate-in fade-in duration-200">
              <div className="w-12 h-12 border-4 border-amber-550 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
              <p className="font-extrabold text-lg animate-pulse text-white">جاري توثيق عملية تفويض الرسوم والخصم بالشبكة المصرفية...</p>
              <p className="text-slate-450 text-slate-400 text-xs mt-2 font-sans">برجاء عدم إغلاق هذه الصفحة ريثما تقوم المنصة بمزامنة الترقيات الجديدة كلياً.</p>
            </div>
          )}
        </div>
      );
    };
