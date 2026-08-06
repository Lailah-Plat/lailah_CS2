import React from 'react';
import FinanceDashboard from '../FinanceDashboard';
import { useApp } from '../../context/AppContext';

export const FinanceSection: React.FC<any> = (props) => {
  const appState = useApp();
  const {
    providers,
    currentProviderName,
    currentProviderId,
    isAdminUser,
    providerSubscription,
    userRole,
    seasonRequests,
    setSeasonRequests,
    showNotification,
    bookings,
    setBookings,
    supportServiceRequests,
    halls,
    inventorySettings,
    campaigns,
    dashboardPeriod,
    selectedDashboardMonth,
    selectedDashboardYear,
    customStartDate,
    customEndDate,
    yearlyPeriodType,
  } = { ...appState, ...props };

  const currentProvObj = React.useMemo(() => {
    return (providers || []).find((p: any) => p.name === currentProviderName);
  }, [providers, currentProviderName]);

  const isVatEnabled = currentProvObj?.isVatEnabled ?? true;
  const canExport = isAdminUser || providerSubscription?.canExportFinancials || providerSubscription?.addons?.includes('invoice_export');

  return (
    <div id="finance_section_container">
      <FinanceDashboard 
        canExport={canExport} 
        userRole={userRole as any} 
        currentProvider={currentProviderName} 
        currentProviderId={currentProviderId}
        isVatEnabled={isVatEnabled} 
        seasonRequests={seasonRequests}
        setSeasonRequests={setSeasonRequests}
        showNotification={showNotification}
        providerSubscription={providerSubscription}
        bookings={bookings}
        setBookings={setBookings}
        supportServiceRequests={supportServiceRequests}
        halls={halls}
        inventorySettings={inventorySettings}
        providers={providers}
        campaigns={campaigns}
        dashboardPeriod={dashboardPeriod}
        selectedDashboardMonth={selectedDashboardMonth}
        selectedDashboardYear={selectedDashboardYear}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        yearlyPeriodType={yearlyPeriodType}
      />
    </div>
  );
};
export default FinanceSection;
