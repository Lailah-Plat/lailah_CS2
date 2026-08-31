import React, { useState } from 'react';
import { InventoryList } from './InventoryList';
import { StockAlerts } from './StockAlerts';
import { ProcurementOrders } from './ProcurementOrders';
import { AutoStockProcurement } from '../AutoStockProcurement';

interface ProviderInventoryProps {
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ProviderInventory: React.FC<ProviderInventoryProps> = ({
  showNotification,
}) => {
  return (
    <div className="space-y-6">
      <StockAlerts
        onTriggerProcurement={(sku) => {
          showNotification?.('success', `تم إصدار أمر الشراء التلقائي للصنف ${sku} بنجاح!`);
        }}
      />
      <InventoryList
        onRestock={(id) => {
          showNotification?.('info', `تم فتح مسودة أمر الشراء للصنف ${id}`);
        }}
      />
      <ProcurementOrders />
      <AutoStockProcurement />
    </div>
  );
};

export default ProviderInventory;
