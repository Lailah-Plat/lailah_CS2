import React, { createContext, useContext } from 'react';

export interface AppContextType {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  isAuthenticated: boolean;
  userRole: 'admin' | 'provider';
  setUserRole: React.Dispatch<React.SetStateAction<'admin' | 'provider'>>;
  activeTab: string;
  setActiveTab: (tab: any) => void;
  halls: any[];
  setHalls: React.Dispatch<React.SetStateAction<any[]>>;
  bookings: any[];
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices: (services: any) => void;
  staffList: any[];
  setStaffList: React.Dispatch<React.SetStateAction<any[]>>;
  providers: any[];
  setProviders: React.Dispatch<React.SetStateAction<any[]>>;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  discounts: any[];
  setDiscounts: (discounts: any) => void;
  adminActiveGateway: string;
  setAdminActiveGateway: React.Dispatch<React.SetStateAction<string>>;
  providerStaffList: any[];
  setProviderStaffList: (val: any[]) => void;
  [key: string]: any; // for flexibility to prevent compiler issues
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ value: any; children: React.ReactNode }> = ({ value, children }) => {
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    return {} as AppContextType;
  }
  return context;
};
