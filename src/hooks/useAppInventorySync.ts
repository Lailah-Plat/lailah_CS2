import { useEffect } from 'react';

interface UseAppInventorySyncParams {
  services: any[];
  bookings: any[];
  supportServiceRequests: any[];
  inventory: any[];
  setInventory: React.Dispatch<React.SetStateAction<any[]>>;
  setServicesState: React.Dispatch<React.SetStateAction<any[]>>;
  currentProviderName: string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  syncLockRef: React.MutableRefObject<boolean>;
  saveServices: (services: any[]) => void;
}

export function useAppInventorySync({
  services,
  bookings,
  supportServiceRequests,
  inventory,
  setInventory,
  setServicesState,
  currentProviderName,
  showNotification,
  syncLockRef,
  saveServices
}: UseAppInventorySyncParams) {
  // Sync services to inventory (Forward Sync)
  useEffect(() => {
    if (syncLockRef.current) return;
    if (services) {
      syncLockRef.current = true;
      let hasChanges = false;
      
      setInventory(prev => {
        const updated = [...prev];
        
        services.forEach((service: any) => {
          const sku = `SVC-${service.id}`;
          
          // 1. Calculate reserved quantities from confirmed bookings where this service was selected
          const bookingReserved = (bookings || []).filter((b: any) => b.status === 'مؤكد' && b.selectedServices)
            .reduce((sum: number, b: any) => {
              const matchedService = b.selectedServices.find((s: any) => s.serviceId === service.id);
              return sum + (matchedService ? parseInt(matchedService.quantity || 1, 10) : 0);
            }, 0);

          // 2. Calculate reserved quantities from confirmed support service requests
          const activeRequests = (supportServiceRequests || []).filter((req: any) => {
            const reqNameMatches = req.serviceName === service.name;
            const reqProvMatches = req.providerName === service.provider;
            const isConfirmed = req.status === 'تم القبول' || req.status === 'جاري التنفيذ' || req.status === 'مكتمل';
            return reqNameMatches && reqProvMatches && isConfirmed;
          });
          const totalRequestReserved = activeRequests.reduce((sum: number, req: any) => sum + (parseInt(req.quantity, 10) || 1), 0);
          
          const totalReserved = bookingReserved + totalRequestReserved;
          const maxServiceQty = parseInt(service.quantity || service.quantityLimit, 10) || 0;
          const serviceQty = Math.max(0, maxServiceQty - totalReserved);
          
          const serviceName = `${service.name} (${service.provider})`;
          const serviceCost = Number(service.price) || 0;
          const serviceSupplier = service.provider || '';
          
          const index = updated.findIndex(item => item.sku === sku);
          if (index === -1) {
            updated.push({
              id: Date.now() + Math.random(),
              name: serviceName,
              sku: sku,
              currentStock: serviceQty,
              reorderLevel: 5,
              supplier: serviceSupplier,
              cost: serviceCost,
              lastUpdated: new Date().toISOString().split('T')[0]
            });
            hasChanges = true;
          } else {
            const existing = updated[index];
            const existingCost = Number(existing.cost) || 0;
            const existingStock = Number(existing.currentStock) || 0;
            if (
              existingStock !== serviceQty ||
              Math.abs(existingCost - serviceCost) > 0.01 ||
              existing.name !== serviceName ||
              existing.supplier !== serviceSupplier
            ) {
              updated[index] = {
                ...existing,
                name: serviceName,
                currentStock: serviceQty,
                cost: serviceCost,
                supplier: serviceSupplier,
                lastUpdated: new Date().toISOString().split('T')[0]
              };
              hasChanges = true;
            }
          }
        });
        
        return hasChanges ? updated : prev;
      });
      
      const timer = setTimeout(() => {
        syncLockRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [services, supportServiceRequests, bookings]);

  // Low Inventory alert notification for provider
  useEffect(() => {
    if (inventory && inventory.length > 0 && currentProviderName) {
      const lowStockItems = inventory.filter(item => {
        const isMatchedProvider = item.supplier === currentProviderName;
        const isLow = item.currentStock <= item.reorderLevel && item.currentStock > 0;
        return isMatchedProvider && isLow;
      });
      
      if (lowStockItems.length > 0) {
        try {
          const notifiedSKUs = JSON.parse(localStorage.getItem('NOTIFIED_LOW_STOCK') || '[]');
          
          // Reset items that are now above the threshold (restocked)
          const remainingNotified = notifiedSKUs.filter((sku: string) => {
            const item = inventory.find(i => i.sku === sku);
            return item ? (item.currentStock <= item.reorderLevel) : false;
          });
          
          const newSKUs = lowStockItems.map(i => i.sku).filter(sku => !remainingNotified.includes(sku));
          
          if (newSKUs.length > 0) {
            newSKUs.forEach(sku => {
              const matchedItem = lowStockItems.find(i => i.sku === sku);
              if (matchedItem) {
                showNotification('error', `⚠️ تنبيه مخزون منخفض: الصنف [${matchedItem.name}] انخفض عن الحد الأدنى المحدد وهو (${matchedItem.reorderLevel}) المتبقي الحالي: ${matchedItem.currentStock}`);
              }
            });
            localStorage.setItem('NOTIFIED_LOW_STOCK', JSON.stringify([...remainingNotified, ...newSKUs]));
          } else if (remainingNotified.length !== notifiedSKUs.length) {
            localStorage.setItem('NOTIFIED_LOW_STOCK', JSON.stringify(remainingNotified));
          }
        } catch { /* ignore */ }
      }
    }
  }, [inventory, currentProviderName]);

  // Sync inventory back to services (Backward Sync) - Refactored to prevent infinite loops
  useEffect(() => {
    if (syncLockRef.current) return;
    if (inventory && services && supportServiceRequests) {
      syncLockRef.current = true;
      let hasChanges = false;
      const updatedServices = services.map((service: any) => {
        const item = inventory.find(i => i.sku === `SVC-${service.id}`);
        if (item) {
          // 1. Calculate reserved quantities from confirmed bookings where this service was selected
          const bookingReserved = (bookings || []).filter((b: any) => b.status === 'مؤكد' && b.selectedServices)
            .reduce((sum: number, b: any) => {
              const matchedService = b.selectedServices.find((s: any) => s.serviceId === service.id);
              return sum + (matchedService ? parseInt(matchedService.quantity || 1, 10) : 0);
            }, 0);

          // 2. Calculate reserved quantities from confirmed support service requests
          const activeRequests = (supportServiceRequests || []).filter((req: any) => {
            const reqNameMatches = req.serviceName === service.name;
            const reqProvMatches = req.providerName === service.provider;
            const isConfirmed = req.status === 'تم القبول' || req.status === 'جاري التنفيذ' || req.status === 'مكتمل';
            return reqNameMatches && reqProvMatches && isConfirmed;
          });
          const totalRequestReserved = activeRequests.reduce((sum: number, req: any) => sum + (parseInt(req.quantity, 10) || 1), 0);
          
          const totalReserved = bookingReserved + totalRequestReserved;
          
          const maxServiceQty = parseInt(service.quantity || service.quantityLimit, 10) || 0;
          const expectedStock = Math.max(0, maxServiceQty - totalReserved);
          const currentStockVal = item.currentStock || 0;
          
          const isStockMismatched = currentStockVal !== expectedStock;
          const itemCost = Number(item.cost) || 0;
          const servicePrice = Number(service.price) || 0;
          const isPriceMismatched = Math.abs(servicePrice - itemCost) > 0.01;

          if (isStockMismatched || isPriceMismatched) {
            // Determine the new base service quantity/limit
            const baseStockVal = Math.max(0, currentStockVal + totalReserved);
            const itemStockStr = baseStockVal === 0 ? '' : String(baseStockVal);
            
            // Only update if there is a real change to be applied
            if (String(service.quantity || '') !== itemStockStr || Math.abs(servicePrice - itemCost) > 0.01) {
              hasChanges = true;
              return {
                ...service,
                quantity: itemStockStr,
                quantityLimit: itemStockStr,
                price: itemCost,
              };
            }
          }
        }
        return service;
      });
      
      if (hasChanges) {
        setServicesState(updatedServices);
        saveServices(updatedServices);
      }
      const timer = setTimeout(() => {
        syncLockRef.current = false;
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [inventory, supportServiceRequests, bookings]);
}
