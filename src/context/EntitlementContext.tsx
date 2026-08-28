import React, { createContext, useContext, useMemo } from 'react';
import { getActiveProviderCapabilities, ProviderCapabilities } from '../utils/capabilityEngine';
import { useAppState } from '../hooks/useAppState';

export interface EntitlementContextType {
  capabilities: ProviderCapabilities;
  hasCapability: (capabilityKey: keyof ProviderCapabilities) => boolean;
  canAccessTab: (tabId: string) => boolean;
  getModuleEntitlementStatus: (moduleId: string) => {
    isEntitled: boolean;
    requiredFeature?: string;
    isUpgradeAvailable: boolean;
  };
}

const EntitlementContext = createContext<EntitlementContextType | undefined>(undefined);

export const EntitlementProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const state = useAppState();

  const capabilities = useMemo(() => {
    return getActiveProviderCapabilities();
  }, [state.providerSubscription, (state as any).currentUser]);

  const hasCapability = (capabilityKey: keyof ProviderCapabilities): boolean => {
    const val = capabilities[capabilityKey];
    return typeof val === 'boolean' ? val : true;
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
    hasCapability,
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
      hasCapability: (key: keyof ProviderCapabilities) => (typeof caps[key] === 'boolean' ? (caps[key] as boolean) : true),
      canAccessTab: () => true,
      getModuleEntitlementStatus: (moduleId: string) => ({ isEntitled: true, isUpgradeAvailable: false }),
    };
  }
  return context;
};
