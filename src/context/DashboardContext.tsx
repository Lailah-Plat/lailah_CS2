import React, { createContext, useContext, useState, useMemo } from 'react';
import { Hall, Booking, User, Campaign } from '../types';

export interface DashboardContextType {
  currentUser: any;
  setCurrentUser: React.Dispatch<React.SetStateAction<any>>;
  isAuthenticated: boolean;
  setIsAuthenticated: React.Dispatch<React.SetStateAction<boolean>>;
  userRole: 'admin' | 'provider';
  setUserRole: React.Dispatch<React.SetStateAction<'admin' | 'provider'>>;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  halls: Hall[];
  setHalls: React.Dispatch<React.SetStateAction<Hall[]>>;
  bookings: Booking[];
  setBookings: React.Dispatch<React.SetStateAction<Booking[]>>;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  providers: any[];
  setProviders: React.Dispatch<React.SetStateAction<any[]>>;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  campaigns: Campaign[];
  setCampaigns: React.Dispatch<React.SetStateAction<Campaign[]>>;
  supportServiceRequests: any[];
  setSupportServiceRequests: React.Dispatch<React.SetStateAction<any[]>>;
  language: 'ar' | 'en';
  setLanguage: React.Dispatch<React.SetStateAction<'ar' | 'en'>>;
  dbHealthStatus: 'connected' | 'fallback' | 'checking';
  setDbHealthStatus: React.Dispatch<React.SetStateAction<'connected' | 'fallback' | 'checking'>>;
  dbLastSyncTime: string;
  setDbLastSyncTime: React.Dispatch<React.SetStateAction<string>>;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: React.ReactNode; initialValues?: Partial<DashboardContextType> }> = ({ children, initialValues }) => {
  const [currentUser, setCurrentUser] = useState<any>(initialValues?.currentUser ?? null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(initialValues?.isAuthenticated ?? false);
  const [userRole, setUserRole] = useState<'admin' | 'provider'>(initialValues?.userRole ?? 'provider');
  const [activeTab, setActiveTab] = useState<string>(initialValues?.activeTab ?? 'overview');
  const [halls, setHalls] = useState<Hall[]>(initialValues?.halls ?? []);
  const [bookings, setBookings] = useState<Booking[]>(initialValues?.bookings ?? []);
  const [services, setServices] = useState<any[]>(initialValues?.services ?? []);
  const [providers, setProviders] = useState<any[]>(initialValues?.providers ?? []);
  const [customers, setCustomers] = useState<any[]>(initialValues?.customers ?? []);
  const [campaigns, setCampaigns] = useState<Campaign[]>(initialValues?.campaigns ?? []);
  const [supportServiceRequests, setSupportServiceRequests] = useState<any[]>(initialValues?.supportServiceRequests ?? []);
  const [language, setLanguage] = useState<'ar' | 'en'>(initialValues?.language ?? 'ar');
  const [dbHealthStatus, setDbHealthStatus] = useState<'connected' | 'fallback' | 'checking'>(initialValues?.dbHealthStatus ?? 'checking');
  const [dbLastSyncTime, setDbLastSyncTime] = useState<string>(initialValues?.dbLastSyncTime ?? '');

  const contextValue = useMemo<DashboardContextType>(() => ({
    currentUser,
    setCurrentUser,
    isAuthenticated,
    setIsAuthenticated,
    userRole,
    setUserRole,
    activeTab,
    setActiveTab,
    halls,
    setHalls,
    bookings,
    setBookings,
    services,
    setServices,
    providers,
    setProviders,
    customers,
    setCustomers,
    campaigns,
    setCampaigns,
    supportServiceRequests,
    setSupportServiceRequests,
    language,
    setLanguage,
    dbHealthStatus,
    setDbHealthStatus,
    dbLastSyncTime,
    setDbLastSyncTime,
  }), [
    currentUser,
    isAuthenticated,
    userRole,
    activeTab,
    halls,
    bookings,
    services,
    providers,
    customers,
    campaigns,
    supportServiceRequests,
    language,
    dbHealthStatus,
    dbLastSyncTime,
  ]);

  return (
    <DashboardContext.Provider value={contextValue}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
