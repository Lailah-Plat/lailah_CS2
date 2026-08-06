import React from 'react';
import { CustomersManagement } from '../CustomersManagement';

interface CustomersSectionProps {
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  customersSearchQuery: string;
  setCustomersSearchQuery: (query: string) => void;
  customersFilterStatus: string;
  setCustomersFilterStatus: (status: string) => void;
  setIsCustomerModalOpen: (open: boolean) => void;
  setCustomerForm: (form: any) => void;
  setEditingItem: (item: any) => void;
  setDeleteData: (data: any) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  loyaltyCustomSettings?: any;
  setLoyaltyCustomSettings?: (settings: any) => void;
  mode?: 'users_only' | 'loyalty_only';
}

export const CustomersSection: React.FC<CustomersSectionProps> = ({ mode, ...props }) => {
  return <CustomersManagement mode={mode} {...props} />;
};
