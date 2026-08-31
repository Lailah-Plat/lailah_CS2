import React, { useState } from 'react';
import { ProviderBookingsTimeline } from './ProviderBookingsTimeline';
import { BookingDetails } from './BookingDetails';
import { BookingActions } from './BookingActions';

interface ProviderBookingsProps {
  myBookings: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ProviderBookings: React.FC<ProviderBookingsProps> = ({
  myBookings = [],
  showNotification,
}) => {
  return (
    <ProviderBookingsTimeline
      myBookings={myBookings}
      showNotification={showNotification}
    />
  );
};

export default ProviderBookings;
