import React from 'react';
import { FloorPlanVisualizer } from '../FloorPlanVisualizer';

interface FloorPlanBuilderProps {
  halls?: any[];
  bookings?: any[];
  currentProviderName?: string;
  providerSubscription?: any;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const FloorPlanBuilder: React.FC<FloorPlanBuilderProps> = (props) => {
  return <FloorPlanVisualizer {...props} />;
};
