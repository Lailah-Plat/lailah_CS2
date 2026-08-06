import { useState, useEffect } from 'react';
import { fetchWithRetry } from '../services/apiService';

interface UseAppSubscriptionsParams {
  setProviders: React.Dispatch<React.SetStateAction<any[]>>;
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setDbProviderSubscriptions: React.Dispatch<React.SetStateAction<any[]>>;
  setSubscriptionsState: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export function useAppSubscriptions({
  setProviders,
  setSystemUsers,
  setDbProviderSubscriptions,
  setSubscriptionsState,
  showNotification
}: UseAppSubscriptionsParams) {
  const [selectedProviderForUpgrade, setSelectedProviderForUpgrade] = useState<any | null>(null);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [allSubscriptionPlans, setAllSubscriptionPlans] = useState<any[]>([]);
  const [activeTabUpgrade, setActiveTabUpgrade] = useState<'plan' | 'override'>('plan');
  
  const [upgradeSelectedPlan, setUpgradeSelectedPlan] = useState('');
  const [upgradePricePaid, setUpgradePricePaid] = useState<number>(0);
  const [upgradeDurationMonths, setUpgradeDurationMonths] = useState<string>('3');
  const [upgradeCustomEndDate, setUpgradeCustomEndDate] = useState<string>('');
  const [upgradeNotes, setUpgradeNotes] = useState<string>('');
  
  const [overrideFeatureKey, setOverrideFeatureKey] = useState('max_halls');
  const [overrideFeatureName, setOverrideFeatureName] = useState('ميزة قاعة إضافية وزيادة السعة لعدد القاعات المتاحة');
  const [overrideType, setOverrideType] = useState('increment');
  const [overrideValue, setOverrideValue] = useState('1');
  const [overrideExpiresAt, setOverrideExpiresAt] = useState<string>('');
  const [overrideNotes, setOverrideNotes] = useState<string>('');

  const [upgradeBulkProviderIds, setUpgradeBulkProviderIds] = useState<any[]>([]);
  const [providerActiveSubscription, setProviderActiveSubscription] = useState<any | null>(null);
  const [providerActiveOverrides, setProviderActiveOverrides] = useState<any[]>([]);
  const [isFetchingSubDetails, setIsFetchingSubDetails] = useState(false);

  const fetchSubscriptionPlans = async () => {
    try {
      const data = await fetchWithRetry('/api/subscriptions/plans');
      if (data && data.success && data.plans) {
        setAllSubscriptionPlans(data.plans || []);
        
        setSubscriptionsState((prev: any[]) => {
          const merged = [...(prev || [])];
          data.plans.forEach((dbPlan: any) => {
            const localIndex = merged.findIndex((s: any) => s.name === dbPlan.name || String(s.id) === String(dbPlan.id));
            
            let parsedFeaturesObj = {};
            try { 
              parsedFeaturesObj = typeof dbPlan.features === 'string' 
                ? JSON.parse(dbPlan.features) 
                : (dbPlan.features || {}); 
            } catch(e){}
            
            const mappedPlan = {
              id: dbPlan.id,
              name: dbPlan.name,
              revenue: localIndex !== -1 ? (merged[localIndex].revenue || 0) : 0,
              priceMonthly: localIndex !== -1 ? merged[localIndex].priceMonthly : (dbPlan.price || 199),
              priceYearly: localIndex !== -1 ? merged[localIndex].priceYearly : ((dbPlan.price || 199) * 10),
              features: dbPlan.description || (localIndex !== -1 ? merged[localIndex].features : ''),
              status: localIndex !== -1 ? merged[localIndex].status : 'مفعل',
              isPopular: localIndex !== -1 ? merged[localIndex].isPopular : false,
              discount: localIndex !== -1 ? merged[localIndex].discount : 15,
              usersCount: localIndex !== -1 ? merged[localIndex].usersCount : 0,
              commissionRate: localIndex !== -1 ? merged[localIndex].commissionRate : 10,
              isHidden: Boolean(dbPlan.isHidden),
              ...parsedFeaturesObj
            };

            if (localIndex !== -1) {
              merged[localIndex] = {
                ...merged[localIndex],
                ...mappedPlan,
                status: merged[localIndex].status,
                revenue: merged[localIndex].revenue,
                usersCount: merged[localIndex].usersCount,
                isHidden: Boolean(dbPlan.isHidden)
              };
            } else {
              merged.push(mappedPlan);
            }
          });
          
          const dbPlanNames = (data.plans || []).map((p: any) => p.name.trim().toLowerCase());
          const dbPlanIds = (data.plans || []).map((p: any) => String(p.id));

          // Keep only the plans that are returned from DB, or custom local-only templates
          let filteredMerged = merged.filter((item: any) => {
            if (!item || !item.name) return false;
            const nameLower = item.name.trim().toLowerCase();
            const idStr = String(item.id).trim().toLowerCase();

            const isDefaultOrDbPlan = !isNaN(Number(item.id)) || 
              ['basic', 'business', 'pro', 'الباقة الأساسية', 'باقة الأعمال', 'الباقة الاحترافية'].some(k => 
                nameLower.includes(k.toLowerCase()) || idStr.toLowerCase() === k.toLowerCase()
              );

            if (isDefaultOrDbPlan) {
              return dbPlanNames.includes(nameLower) || dbPlanIds.includes(idStr);
            }
            return true;
          });
          
          // Deduplicate merged array by name
          const uniqueMap = new Map();
          filteredMerged.forEach((item: any) => {
            if (item && item.name) {
              const key = item.name.trim();
              const existing = uniqueMap.get(key);
              if (!existing || (!isNaN(Number(item.id)) && isNaN(Number(existing.id)))) {
                uniqueMap.set(key, item);
              }
            }
          });
          const deduplicated = Array.from(uniqueMap.values());
          
          localStorage.setItem('app_subscriptions', JSON.stringify(deduplicated));
          return deduplicated;
        });
      }
    } catch (err) {
      console.warn("Could not fetch subscription plans from backend, using local fallback:", err);
      // Fallback to offline/stored plans or defaults
      const localPlans = localStorage.getItem('app_subscriptions');
      let defaultPlans = [
        { id: 1, name: 'الباقة الأساسية', priceMonthly: 99, priceYearly: 990, features: 'الباقة المبدئية لإدارة قاعة واحدة', status: 'مفعل' },
        { id: 2, name: 'باقة الأعمال', priceMonthly: 299, priceYearly: 2990, features: 'باقة متقدمة لإدارة قاعتين مع نظام المبيعات', status: 'مفعل', isPopular: true },
        { id: 3, name: 'الباقة الاحترافية', priceMonthly: 599, priceYearly: 5990, features: 'باقة غير محدودة تشمل كافة الميزات المتقدمة', status: 'مفعل' }
      ];
      if (localPlans) {
        try {
          const parsed = JSON.parse(localPlans);
          if (Array.isArray(parsed) && parsed.length > 0) {
            defaultPlans = parsed;
          }
        } catch (e) {}
      }
      setAllSubscriptionPlans(defaultPlans);
      setSubscriptionsState(defaultPlans);
    }
  };

  const fetchProviderSubscriptionDetails = async (provId: number) => {
    setIsFetchingSubDetails(true);
    try {
      const res = await fetch(`/api/subscriptions/provider/${provId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setProviderActiveSubscription(data.subscription || null);
          setProviderActiveOverrides(data.overrides || []);
        }
      }
    } catch (err) {
      console.error("Error loading provider sub details:", err);
    } finally {
      setIsFetchingSubDetails(false);
    }
  };

  const handleApplySubscriptionUpgrade = async () => {
    if (upgradeBulkProviderIds.length === 0) {
      alert('يجب تحديد مزود خدمة واحد على الأقل من القائمة لتعديله.');
      return;
    }
    if (!upgradeSelectedPlan) {
      alert('الرجاء اختيار الباقة المراد الترقية إليها بشكل صحيح.');
      return;
    }

    try {
      const res = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerIds: upgradeBulkProviderIds,
          planName: upgradeSelectedPlan,
          pricePaid: upgradePricePaid,
          durationMonths: upgradeDurationMonths,
          customEndDate: upgradeCustomEndDate || null,
          notes: upgradeNotes || 'ترقية باقات مخصصة مفرودة يدوياً من الإدارة العامة للمنصة'
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'تم تحديث وترقية اشتراكات الشركاء المحددين بنجاح.');
        setIsUpgradeModalOpen(false);

        const isYearly = upgradeDurationMonths === '12';
        let endDateStr = upgradeCustomEndDate || null;
        if (!endDateStr && upgradeDurationMonths && upgradeDurationMonths !== 'custom') {
          const months = Number(upgradeDurationMonths);
          const d = new Date();
          d.setMonth(d.getMonth() + months);
          endDateStr = d.toISOString();
        }

        const newSubObj = {
          id: 'custom',
          packageName: upgradeSelectedPlan,
          packageName_display: upgradeSelectedPlan,
          billingCycle: isYearly ? 'yearly' : 'monthly',
          price: upgradePricePaid || 0,
          status: 'active',
          startDate: new Date().toISOString(),
          endDate: endDateStr || '2029-12-30',
          hallsLimit: 'unlimited',
          servicesLimit: 'unlimited',
          staffSeatsLimit: 'unlimited',
          includesAdvancedProviderDashboard: true,
          includesFullManagement: true,
          includesInventory: true,
          includesSuppliers: true,
          canExportFinancials: true,
          hasSupport: true,
          includesDynamicPricing: true,
          includesFinancialForecast: true,
          includesPartialPayment: true,
          includesGrowthCharts: true,
          includesAdvancedStats: true,
          includesLogisticsPortal: true,
          addons: ['inventory', 'suppliers', 'invoice_export', 'support', 'dynamic_pricing']
        };

        // Update local providers state and providersData in localStorage
        const savedStr = localStorage.getItem('providersData');
        let provList: any[] = [];
        try {
          provList = savedStr ? JSON.parse(savedStr) : [];
        } catch (e) {}

        const upgradedProviderObjs: any[] = [];
        setProviders((prev: any[]) => {
          const baseList = provList.length > 0 ? provList : prev;
          const updatedProvList = baseList.map((prov: any) => {
            const isMatch = upgradeBulkProviderIds.some((targetId: any) => 
              targetId === prov.id || targetId === prov.dbId || targetId === prov.email || (prov.name && targetId === prov.name)
            );
            if (isMatch) {
              upgradedProviderObjs.push(prov);
              return {
                ...prov,
                packageName: upgradeSelectedPlan,
                packageName_display: upgradeSelectedPlan,
                packageDuration: isYearly ? 'yearly' : 'monthly',
                subscriptionStatus: 'نشط',
                expiryDate: endDateStr || prov.expiryDate || '2029-12-30'
              };
            }
            return prov;
          });

          try {
            localStorage.setItem('providersData', JSON.stringify(updatedProvList));
          } catch (e) {}

          return updatedProvList;
        });

        upgradeBulkProviderIds.forEach((idVal: any) => {
          localStorage.setItem(`provider_subscription_${idVal}`, JSON.stringify(newSubObj));
        });

        upgradedProviderObjs.forEach((prov: any) => {
          if (prov.name) {
            localStorage.setItem(`provider_subscription_${prov.name}`, JSON.stringify(newSubObj));
          }
          if (prov.email) {
            localStorage.setItem(`provider_subscription_${prov.email}`, JSON.stringify(newSubObj));
          }
          if (prov.id) {
            localStorage.setItem(`provider_subscription_${prov.id}`, JSON.stringify(newSubObj));
          }
        });

        localStorage.setItem('provider_subscription', JSON.stringify(newSubObj));

        const currentUserStr = localStorage.getItem('currentUser');
        if (currentUserStr) {
          try {
            const u = JSON.parse(currentUserStr);
            const isCurrentMatched = upgradeBulkProviderIds.some((targetId: any) => 
              targetId === u.id || targetId === u.dbId || targetId === u.email || (u.name && targetId === u.name)
            ) || upgradedProviderObjs.some((prov: any) => 
              (u.email && prov.email && u.email.toLowerCase() === prov.email.toLowerCase()) ||
              (u.name && prov.name && u.name === prov.name)
            );

            if (isCurrentMatched) {
              u.packageName = upgradeSelectedPlan;
              u.planName = upgradeSelectedPlan;
              u.packageDuration = isYearly ? 'yearly' : 'monthly';
              localStorage.setItem('currentUser', JSON.stringify(u));
              localStorage.setItem('provider_subscription', JSON.stringify(newSubObj));
            }
          } catch (e) {}
        }

        // Reload page data or users accounts to reflect in the main UI list!
        const resUsers = await fetch('/api/users');
        if (resUsers.ok) {
          const uData = await resUsers.json();
          if (uData.success) {
            setSystemUsers(uData.verified || []);
          }
        }

        // Also reload dynamic subscriptions!
        const resSubs = await fetch('/api/subscriptions/all');
        if (resSubs.ok) {
          const sText = await resSubs.text();
          let sData;
          try {
            sData = JSON.parse(sText);
          } catch(e) {}
          if (sData && sData.success) {
            setDbProviderSubscriptions(sData.subscriptions || []);
          }
        }

        // Dispatch trigger to update system subscription state reactively
        window.dispatchEvent(new Event('subscriptionUpdated'));
        window.dispatchEvent(new Event('currentUserUpdated'));
        window.dispatchEvent(new Event('providersUpdated'));
        window.dispatchEvent(new Event('usersUpdated'));
        window.dispatchEvent(new Event('settingsUpdated'));
        window.dispatchEvent(new Event('storage'));
      } else {
        alert(data.error || 'حدث خطأ ما أثناء ترقية باقات الشركاء.');
      }
    } catch (err) {
      console.error(err);
      alert('حدث خطأ بالاتصال الخارجي بالخادم المالي');
    }
  };

  const handleApplyFeatureOverride = async () => {
    if (upgradeBulkProviderIds.length === 0) {
      alert('يجب تحديد شريك/مزود خدمة واحد على الأقل لتفعيل الاستثناء.');
      return;
    }
    if (!overrideFeatureKey) {
      alert('يرجى تحديد مفتاح الصلاحية المراد تجاوزها.');
      return;
    }

    try {
      const res = await fetch('/api/subscriptions/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerIds: upgradeBulkProviderIds,
          featureKey: overrideFeatureKey,
          featureName: overrideFeatureName,
          overrideType,
          value: overrideValue,
          customExpiresAt: overrideExpiresAt || null,
          notes: overrideNotes || 'تفعيل استثناء ميزة مخصصة لمزود الخدمة يدوياً'
        })
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'تم منح الشركاء المحددين مزايا الصلاحيات والاستثناءات اليدوية بنجاح.');
        setIsUpgradeModalOpen(false);

        // Also reload dynamic subscriptions!
        const resSubs = await fetch('/api/subscriptions/all');
        if (resSubs.ok) {
          const sText = await resSubs.text();
          let sData;
          try {
            sData = JSON.parse(sText);
          } catch(e) {}
          if (sData && sData.success) {
            setDbProviderSubscriptions(sData.subscriptions || []);
          }
        }

        window.dispatchEvent(new Event('subscriptionUpdated'));
        window.dispatchEvent(new Event('settingsUpdated'));
      } else {
        alert(data.error || 'فشل منح الميزة الاستثنائية للشركاء.');
      }
    } catch (err) {
      console.error(err);
      alert('خطأ بالخادم عند تطبيق استثناءات الميزات.');
    }
  };

  const handleDeleteOverride = async (provId: number, fKey: string) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء هذا الاستثناء واستعادة القيود التلقائية للباقة الأساسية؟')) return;
    try {
      const res = await fetch('/api/subscriptions/override/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: provId, featureKey: fKey })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'تم حذف وإلغاء صلاحية الميزة المخصصة بنجاح واسترداد قيود الباقة الافتراضية.');
        if (selectedProviderForUpgrade && selectedProviderForUpgrade.isDbUser) {
          fetchProviderSubscriptionDetails(selectedProviderForUpgrade.dbId);
        }
      } else {
        alert(data.error || 'فشل إلغاء استثناء الميزة.');
      }
    } catch (err) {
      console.error(err);
      alert('خطأ بالاتصال بالخادم للاستثناءات.');
    }
  };

  useEffect(() => {
    fetchSubscriptionPlans();
  }, []);

  return {
    selectedProviderForUpgrade,
    setSelectedProviderForUpgrade,
    isUpgradeModalOpen,
    setIsUpgradeModalOpen,
    allSubscriptionPlans,
    setAllSubscriptionPlans,
    activeTabUpgrade,
    setActiveTabUpgrade,
    upgradeSelectedPlan,
    setUpgradeSelectedPlan,
    upgradePricePaid,
    setUpgradePricePaid,
    upgradeDurationMonths,
    setUpgradeDurationMonths,
    upgradeCustomEndDate,
    setUpgradeCustomEndDate,
    upgradeNotes,
    setUpgradeNotes,
    overrideFeatureKey,
    setOverrideFeatureKey,
    overrideFeatureName,
    setOverrideFeatureName,
    overrideType,
    setOverrideType,
    overrideValue,
    setOverrideValue,
    overrideExpiresAt,
    setOverrideExpiresAt,
    overrideNotes,
    setOverrideNotes,
    upgradeBulkProviderIds,
    setUpgradeBulkProviderIds,
    providerActiveSubscription,
    setProviderActiveSubscription,
    providerActiveOverrides,
    setProviderActiveOverrides,
    isFetchingSubDetails,
    setIsFetchingSubDetails,
    fetchSubscriptionPlans,
    fetchProviderSubscriptionDetails,
    handleApplySubscriptionUpgrade,
    handleApplyFeatureOverride,
    handleDeleteOverride
  };
}
