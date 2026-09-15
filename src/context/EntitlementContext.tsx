import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { getActiveProviderCapabilities, ProviderCapabilities } from '../utils/capabilityEngine';
import { useAppState } from '../hooks/useAppState';

export interface BackendEffectiveEntitlementItem {
  key: string;
  type: 'boolean' | 'numeric_limit';
  enabled: boolean;
  value: any;
  source: 'PLAN' | 'ADDON' | 'ADMIN_GRANT' | 'PROMO' | 'OVERRIDE' | 'DEFAULT_DENY';
  expiresAt: string | null;
  limit?: number | 'unlimited';
  planValue?: any;
}

export interface BackendEffectiveEntitlementsResponse {
  providerId: number;
  planId: string;
  planName: string;
  subscriptionStatus: string;
  calculatedAt: string;
  entitlements: Record<string, BackendEffectiveEntitlementItem>;
  summary: {
    totalEnabled: number;
    activeAddonsCount: number;
    activeGrantsCount: number;
    activeOverridesCount: number;
  };
}

export interface EntitlementContextType {
  capabilities: ProviderCapabilities;
  effectiveEntitlements: BackendEffectiveEntitlementsResponse | null;
  isLoading: boolean;
  refreshEntitlements: () => Promise<void>;
  hasCapability: (capabilityKey: keyof ProviderCapabilities) => boolean;
  isFeatureAllowed: (featureKey: string) => boolean;
  getLimit: (limitKey: string) => number | 'unlimited';
  canAccessTab: (tabId: string) => boolean;
  getModuleEntitlementStatus: (moduleId: string) => {
    isEntitled: boolean;
    requiredFeature?: string;
    isUpgradeAvailable: boolean;
    source?: string;
    expiresAt?: string | null;
  };
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined);

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useAppState();
  const [effectiveBackend, setEffectiveBackend] = useState<BackendEffectiveEntitlementsResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const localCapabilities = useMemo(() => {
    return getActiveProviderCapabilities();
  }, [state.providerSubscription, (state as any).currentUser]);

  // Fetch from backend authority (Single Source of Truth)
  const fetchBackendEntitlements = useCallback(async () => {
    try {
      const currentUser = (state as any)?.currentUser || (localStorage.getItem('currentUser') ? JSON.parse(localStorage.getItem('currentUser')!) : null);
      const providerId = (state as any)?.currentProviderId || currentUser?.providerId || currentUser?.id;
      
      setIsLoading(true);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (providerId) {
        headers['x-provider-id'] = String(providerId);
      }
      if (currentUser?.id) {
        headers['x-user-id'] = String(currentUser.id);
      }

      // Read Authority: Query /me/entitlements or /provider/:providerId/entitlements as fallback
      const endpoint = providerId ? `/api/subscriptions/me/entitlements?providerId=${providerId}` : `/api/subscriptions/me/entitlements`;
      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.entitlements) {
          setEffectiveBackend(data.entitlements);
        }
      }
    } catch (err) {
      console.warn('Could not load backend entitlements, falling back to cached state:', err);
    } finally {
      setIsLoading(false);
    }
  }, [(state as any)?.currentProviderId, (state as any)?.currentUser]);

  useEffect(() => {
    fetchBackendEntitlements();
  }, [fetchBackendEntitlements, state.providerSubscription]);

  // Merge local capabilities with backend authority if available
  const capabilities: ProviderCapabilities = useMemo(() => {
    if (!effectiveBackend || !effectiveBackend.entitlements) {
      return localCapabilities;
    }
    const ents = effectiveBackend.entitlements;
    return {
      ...localCapabilities,
      commissionRate: localCapabilities.commissionRate,
      hallsLimit: ents.max_halls ? ents.max_halls.limit ?? ents.max_halls.value : localCapabilities.hallsLimit,
      servicesLimit: ents.max_services ? ents.max_services.limit ?? ents.max_services.value : localCapabilities.servicesLimit,
      staffSeatsLimit: ents.staff_seats ? ents.staff_seats.limit ?? ents.staff_seats.value : localCapabilities.staffSeatsLimit,
      hasWeekendPricing: ents.weekend_pricing ? ents.weekend_pricing.enabled : localCapabilities.hasWeekendPricing,
      hasDynamicSurgePricing: ents.dynamic_surge_pricing ? ents.dynamic_surge_pricing.enabled : localCapabilities.hasDynamicSurgePricing,
      hasDepositSystem: ents.partial_payment ? ents.partial_payment.enabled : localCapabilities.hasDepositSystem,
      hasInvoices: ents.advanced_export ? ents.advanced_export.enabled : localCapabilities.hasInvoices,
      hasGrowthCharts: ents.interactive_charts ? ents.interactive_charts.enabled : localCapabilities.hasGrowthCharts,
      hasSmartFinancialForecast: ents.cashflow_forecasting ? ents.cashflow_forecasting.enabled : localCapabilities.hasSmartFinancialForecast,
      hasComprehensiveManagement: ents.full_management ? ents.full_management.enabled : localCapabilities.hasComprehensiveManagement,
      hasFloorPlan360: ents.floor_plan_360 ? ents.floor_plan_360.enabled : localCapabilities.hasFloorPlan360,
      hasSixStages: ents.advanced_lifecycle ? ents.advanced_lifecycle.enabled : localCapabilities.hasSixStages,
      hasOperationsDashboard: ents.logistics_operations ? ents.logistics_operations.enabled : localCapabilities.hasOperationsDashboard,
      hasInventory: ents.inventory_management ? ents.inventory_management.enabled : localCapabilities.hasInventory,
      hasSuppliers: ents.suppliers_management ? ents.suppliers_management.enabled : localCapabilities.hasSuppliers,
      hasCalendarSync: ents.calendar_sync ? ents.calendar_sync.enabled : localCapabilities.hasCalendarSync,
      hasDedicatedCRM: ents.dedicated_crm ? ents.dedicated_crm.enabled : localCapabilities.hasDedicatedCRM,
      hasClientMessagingHub: ents.client_messaging_hub ? ents.client_messaging_hub.enabled : localCapabilities.hasClientMessagingHub,
      hasLiveChatVIP: ents.live_chat_support ? ents.live_chat_support.enabled : localCapabilities.hasLiveChatVIP,
      hasDedicatedAccountManager: ents.dedicated_account_manager ? ents.dedicated_account_manager.enabled : localCapabilities.hasDedicatedAccountManager,
      hasMarketingAgency: ents.marketing_agency ? ents.marketing_agency.enabled : localCapabilities.hasMarketingAgency,
      hasMiniStore: ents.mini_products_store ? ents.mini_products_store.enabled : localCapabilities.hasMiniStore,
      hasEmployeeManagement: ents.staff_seats ? (ents.staff_seats.limit === 'unlimited' || Number(ents.staff_seats.limit) > 0) : localCapabilities.hasEmployeeManagement,
    };
  }, [localCapabilities, effectiveBackend]);

  const hasCapability = (capabilityKey: keyof ProviderCapabilities): boolean => {
    const val = capabilities[capabilityKey];
    return typeof val === 'boolean' ? val : true;
  };

  const isFeatureAllowed = (featureKey: string): boolean => {
    if (effectiveBackend && effectiveBackend.entitlements && effectiveBackend.entitlements[featureKey]) {
      return Boolean(effectiveBackend.entitlements[featureKey].enabled);
    }
    // Fallback to local capability mapping
    return true;
  };

  const getLimit = (limitKey: string): number | 'unlimited' => {
    if (effectiveBackend && effectiveBackend.entitlements && effectiveBackend.entitlements[limitKey]) {
      const ent = effectiveBackend.entitlements[limitKey];
      return ent.limit ?? ent.value ?? 'unlimited';
    }
    if (limitKey === 'max_halls') return capabilities.hallsLimit;
    if (limitKey === 'max_services') return capabilities.servicesLimit;
    if (limitKey === 'staff_seats') return capabilities.staffSeatsLimit;
    return 'unlimited';
  };

  const getModuleEntitlementStatus = (moduleId: string) => {
    switch (moduleId) {
      case 'inventory':
        return {
          isEntitled: capabilities.hasInventory,
          requiredFeature: 'إدارة المخزون والمستودعات',
          isUpgradeAvailable: true,
        };
      case 'suppliers':
        return {
          isEntitled: capabilities.hasSuppliers,
          requiredFeature: 'إدارة الموردين والمشتريات',
          isUpgradeAvailable: true,
        };
      case 'provider_staff':
      case 'staff':
        return {
          isEntitled: capabilities.hasEmployeeManagement || (capabilities.staffSeatsLimit === 'unlimited' || (typeof capabilities.staffSeatsLimit === 'number' && capabilities.staffSeatsLimit > 0)),
          requiredFeature: 'إدارة الموظفين والعاملين وتراخيص المقاعد',
          isUpgradeAvailable: true,
        };
      case 'marketing':
        return {
          isEntitled: capabilities.hasMarketing,
          requiredFeature: 'مركز النمو والتسويق والإعلانات',
          isUpgradeAvailable: true,
        };
      case 'operations':
      case 'logistics':
        return {
          isEntitled: capabilities.hasOperationsDashboard || capabilities.hasAdvancedPortal,
          requiredFeature: 'بوابة الطلبات اللوجستية وإدارة السيولة المتقدمة',
          isUpgradeAvailable: true,
        };
      case 'analytics':
        return {
          isEntitled: capabilities.hasAnalytics || capabilities.hasAdvancedAnalytics,
          requiredFeature: 'لوحة الإحصائيات المتقدمة',
          isUpgradeAvailable: true,
        };
      case 'growth_charts':
        return {
          isEntitled: capabilities.hasGrowthCharts,
          requiredFeature: 'الرسومات التفاعلية والنمو',
          isUpgradeAvailable: true,
        };
      case 'financial_forecast':
        return {
          isEntitled: capabilities.hasSmartFinancialForecast,
          requiredFeature: 'ميزانية التوقعات المالية الذكية',
          isUpgradeAvailable: true,
        };
      case 'weekend_pricing':
        return {
          isEntitled: capabilities.hasWeekendPricing,
          requiredFeature: 'تسعير عطلة نهاية الأسبوع (الويكند)',
          isUpgradeAvailable: true,
        };
      case 'dynamic_surge':
      case 'dynamic_surge_pricing':
        return {
          isEntitled: capabilities.hasDynamicSurgePricing,
          requiredFeature: 'محرك التسعير الديناميكي وزيادة الذروة الذكي',
          isUpgradeAvailable: true,
        };
      case 'six_stages':
        return {
          isEntitled: capabilities.hasSixStages,
          requiredFeature: 'نظام دورات الحياة المتقدمة (المراحل الست)',
          isUpgradeAvailable: true,
        };
      case 'mini_store':
      case 'mini_products_store':
        return {
          isEntitled: capabilities.hasMiniStore,
          requiredFeature: 'متجر المنتجات والمستلزمات المصغر',
          isUpgradeAvailable: true,
        };
      case 'whatsapp_campaigns':
      case 'whatsapp_campaign_alerts':
        return {
          isEntitled: capabilities.hasWhatsAppAlerts,
          requiredFeature: 'إشعارات رسائل واتس أب في الحملات التسويقية',
          isUpgradeAvailable: true,
        };
      case 'dedicated_account_manager':
        return {
          isEntitled: capabilities.hasDedicatedAccountManager,
          requiredFeature: 'مدير حساب وإدارة العملاء',
          isUpgradeAvailable: true,
        };
      case 'live_chat_vip':
        return {
          isEntitled: capabilities.hasLiveChatVIP,
          requiredFeature: 'قناة المحادثة الفورية والدعم الفني المباشر (Live Chat & Instant Support)',
          isUpgradeAvailable: true,
        };
      case 'partial_payment':
      case 'deposit_system':
        return {
          isEntitled: capabilities.hasDepositSystem,
          requiredFeature: 'نظام الدفع الجزئي (العربون)',
          isUpgradeAvailable: true,
        };
      case 'invoices_export':
      case 'financial_export':
        return {
          isEntitled: capabilities.hasInvoices,
          requiredFeature: 'استعراض وتصدير الفواتير والتقارير المالية',
          isUpgradeAvailable: true,
        };
      case 'floor_plan':
      case 'floorplan':
      case 'floor_plan_360':
        return {
          isEntitled: capabilities.hasFloorPlan360 !== false,
          requiredFeature: 'مخطط القاعة وتوزيع الطاولات الميداني 360° وحاسبة السعة ومعايير التوزيع',
          isUpgradeAvailable: true,
        };
      default:
        return { isEntitled: true, isUpgradeAvailable: false };
    }
  };

  const canAccessTab = (tabId: string): boolean => {
    // Core always accessible tabs
    const coreTabs = [
      'overview',
      'cockpit',
      'bookings',
      'halls',
      'services',
      'subscriptions',
      'finance',
      'messages',
      'reviews',
      'support',
      'provider_profile',
      'activity_log',
    ];

    if (coreTabs.includes(tabId)) return true;

    // Advanced modular tabs
    const entitlement = getModuleEntitlementStatus(tabId);
    return entitlement.isEntitled;
  };

  const value = {
    capabilities,
    effectiveEntitlements: effectiveBackend,
    isLoading,
    refreshEntitlements: fetchBackendEntitlements,
    hasCapability,
    isFeatureAllowed,
    getLimit,
    canAccessTab,
    getModuleEntitlementStatus,
  };

  return <EntitlementContext.Provider value={value}>{children}</EntitlementContext.Provider>;
};

export const useEntitlements = () => {
  const context = useContext(EntitlementContext);
  if (!context) {
    // Fallback if rendered outside provider
    const caps = getActiveProviderCapabilities();
    return {
      capabilities: caps,
      effectiveEntitlements: null,
      isLoading: false,
      refreshEntitlements: async () => {},
      hasCapability: (key: keyof ProviderCapabilities) => (typeof caps[key] === 'boolean' ? (caps[key] as boolean) : true),
      isFeatureAllowed: () => true,
      getLimit: () => 'unlimited' as const,
      canAccessTab: () => true,
      getModuleEntitlementStatus: (moduleId: string) => ({ isEntitled: true, isUpgradeAvailable: false }),
    };
  }
  return context;
};

