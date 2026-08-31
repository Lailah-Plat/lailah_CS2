import React from 'react';
import { ProviderReports } from './ProviderReports';

interface ProviderAnalyticsProps {
  currentProviderName: string;
}

export const ProviderAnalytics: React.FC<ProviderAnalyticsProps> = ({
  currentProviderName,
}) => {
  return (
    <div className="space-y-6">
      <ProviderReports currentProviderName={currentProviderName} />
    </div>
  );
};

export default ProviderAnalytics;
