import React from 'react';
import { HallsServicesUnifiedPage } from '../HallsServicesUnifiedPage';

interface HallsUnifiedSectionProps {
  userRole: string;
  currentProviderName: string;
  currentUserName: string;
  providerSubscription: any;
  providers: any[];
  regions: any[];
  halls: any[];
  setHalls: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  activeTab: string;
  renderLockScreen?: (featureName: string, tabKey: string) => React.ReactNode;
  renderHalls?: (hideHeader?: boolean) => React.ReactNode;
}

export const HallsUnifiedSection: React.FC<HallsUnifiedSectionProps> = (props) => {
  return <HallsServicesUnifiedPage {...props} />;
};
