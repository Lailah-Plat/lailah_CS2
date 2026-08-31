import React, { useState } from 'react';
import { ProviderFinanceCenter } from './ProviderFinanceCenter';
import { Settlements } from './Settlements';
import { Statements } from './Statements';
import { FinancialReports } from './FinancialReports';

interface ProviderFinanceProps {
  currentProviderName: string;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const ProviderFinance: React.FC<ProviderFinanceProps> = ({
  currentProviderName,
  showNotification,
}) => {
  return (
    <ProviderFinanceCenter
      currentProviderName={currentProviderName}
      showNotification={showNotification}
    />
  );
};

export default ProviderFinance;
