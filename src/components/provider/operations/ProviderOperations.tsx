import React from 'react';
import { OperationsCenter } from '../OperationsCenter';

interface ProviderOperationsProps {
  currentProviderName: string;
  currentUserName: string;
  myBookings: any[];
  mySupportRequests: any[];
  providerSubscription?: any;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ProviderOperations: React.FC<ProviderOperationsProps> = (props) => {
  return (
    <OperationsCenter
      currentProviderName={props.currentProviderName}
      currentUserName={props.currentUserName}
      myBookings={props.myBookings}
      mySupportRequests={props.mySupportRequests}
      providerSubscription={props.providerSubscription}
      showNotification={props.showNotification}
    />
  );
};

export default ProviderOperations;
