import React, { useState } from 'react';
import { HallList } from './HallList';
import { HallEditor } from './HallEditor';
import { HallAvailability } from './HallAvailability';
import { ProviderHallsCatalog } from '../catalog/halls/ProviderHallsCatalog';

interface ProviderHallsProps {
  catalogHalls: any[];
  setCatalogHalls: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setIsMediaGuideOpen?: (open: boolean) => void;
  showProviderToCustomers?: boolean;
  currentProviderName?: string;
  hasDynamicPricingAccess?: boolean;
  formatCurrency?: (val: number) => string;
}

export const ProviderHalls: React.FC<ProviderHallsProps> = (props) => {
  return (
    <ProviderHallsCatalog
      catalogHalls={props.catalogHalls}
      setCatalogHalls={props.setCatalogHalls}
      showNotification={props.showNotification}
      setIsMediaGuideOpen={props.setIsMediaGuideOpen}
      showProviderToCustomers={props.showProviderToCustomers}
      currentProviderName={props.currentProviderName}
      hasDynamicPricingAccess={props.hasDynamicPricingAccess}
      formatCurrency={props.formatCurrency}
    />
  );
};

export default ProviderHalls;
