import React from 'react';
import { MarketingManagement } from '../MarketingManagement';

interface MarketingSectionProps {
  userRole: string;
  canSwitchToAgency: boolean;
  currentProviderName: string;
  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  adRequests: any[];
  setAdRequests: React.Dispatch<React.SetStateAction<any[]>>;
  internalAds: any[];
  setInternalAds: React.Dispatch<React.SetStateAction<any[]>>;
  promotions: any[];
  setPromotions: React.Dispatch<React.SetStateAction<any[]>>;
  halls: any[];
  services: any[];
  providers: any[];
  currentUser: any;
  activeMarketingSubTab: any;
  setActiveMarketingSubTab: any;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setAdminUsersSection: (val: any) => void;
}

export const MarketingSection: React.FC<MarketingSectionProps> = (props) => {
  return <MarketingManagement {...props} />;
};
