import React from 'react';
import { UnifiedPricingRevenueEngine } from '../../finance/UnifiedPricingRevenueEngine';

interface DynamicSurgePricingEngineProps {
  halls?: any[];
  services?: any[];
  providerSubscription?: any;
  userRole?: string;
  currentProviderName?: string;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onUpdateHall?: (hallId: string | number, updatedFields: any) => void;
}

export const DynamicSurgePricingEngine: React.FC<DynamicSurgePricingEngineProps> = ({
  halls = [],
  services = [],
  providerSubscription,
  userRole = 'provider',
  currentProviderName = '',
  showNotification,
  onUpdateHall
}) => {
  return (
    <UnifiedPricingRevenueEngine
      halls={halls}
      services={services}
      providerSubscription={providerSubscription}
      userRole={userRole}
      currentProviderName={currentProviderName}
      showNotification={showNotification}
      onUpdateHall={onUpdateHall}
    />
  );
};
