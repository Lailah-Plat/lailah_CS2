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
          isEntitled: capabilities.hasEmployeeManagement,
          requiredFeature: 'إدارة الموظفين والعاملين والصلاحيات',
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
          requiredFeature: 'نظام إدارة العمليات واللوجستيات المتقدمة',
          isUpgradeAvailable: true,
        };
      case 'analytics':
        return {
          isEntitled: capabilities.hasAnalytics || capabilities.hasAdvancedAnalytics,
          requiredFeature: 'التحليلات المالية والتوقعات المتقدمة',
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
