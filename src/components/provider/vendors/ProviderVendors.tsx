import React from 'react';
import { VendorList } from './VendorList';
import { VendorContracts } from './VendorContracts';

interface ProviderVendorsProps {
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ProviderVendors: React.FC<ProviderVendorsProps> = ({
  showNotification,
}) => {
  return (
    <div className="space-y-6">
      <VendorList
        onAddVendor={() => {
          showNotification?.('info', 'تم فتح نموذج تسجيل مورد جديد');
        }}
      />
      <VendorContracts />
    </div>
  );
};

export default ProviderVendors;
