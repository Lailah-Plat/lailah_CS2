import React from 'react';
import { ProvidersManagement } from '../ProvidersManagement';
import { useApp } from '../../context/AppContext';

export const ProvidersSection: React.FC<any> = (props) => {
  const appState = useApp();
  const {
    providers,
    setProviders,
    dbProviderSubscriptions,
    systemUsers,
    setSystemUsers,
    setIsLevelThresholdsModalOpen,
    setSelectedProviderForUpgrade,
    setUpgradeBulkProviderIds,
    setProviderActiveSubscription,
    setProviderActiveOverrides,
    setUpgradeSelectedPlan,
    setUpgradePricePaid,
    setUpgradeDurationMonths,
    setUpgradeCustomEndDate,
    setUpgradeNotes,
    setIsUpgradeModalOpen,
    setEditingItem,
    setProviderForm,
    setIsProviderModalOpen,
    adminProvidersSubTab,
    setAdminProvidersSubTab,
    seasonRequests,
    setSeasonRequests,
    getPartnerLevel,
    setViewingProvider,
    setIsProviderViewModalOpen,
    fetchProviderSubscriptionDetails,
    showNotification,
    setDeleteData,
    inventorySettings,
    handleUpdateInventorySettings,
    setSelectedSeasonRequestForModal,
    mode,
  } = { ...appState, ...props };

  return (
    <div id="providers_section_container">
      <ProvidersManagement
        mode={mode}
        providers={providers}
        setProviders={setProviders}
        dbProviderSubscriptions={dbProviderSubscriptions}
        systemUsers={systemUsers}
        setSystemUsers={setSystemUsers}
        setIsLevelThresholdsModalOpen={setIsLevelThresholdsModalOpen}
        setSelectedProviderForUpgrade={setSelectedProviderForUpgrade}
        setUpgradeBulkProviderIds={setUpgradeBulkProviderIds}
        setProviderActiveSubscription={setProviderActiveSubscription}
        setProviderActiveOverrides={setProviderActiveOverrides}
        setUpgradeSelectedPlan={setUpgradeSelectedPlan}
        setUpgradePricePaid={setUpgradePricePaid}
        setUpgradeDurationMonths={setUpgradeDurationMonths as any}
        setUpgradeCustomEndDate={setUpgradeCustomEndDate}
        setUpgradeNotes={setUpgradeNotes}
        setIsUpgradeModalOpen={setIsUpgradeModalOpen}
        setEditingItem={setEditingItem}
        setProviderForm={setProviderForm}
        setIsProviderModalOpen={setIsProviderModalOpen}
        adminProvidersSubTab={adminProvidersSubTab as any}
        setAdminProvidersSubTab={setAdminProvidersSubTab as any}
        halls={appState.halls}
        setHalls={appState.setHalls}
        services={appState.services}
        setServices={appState.setServices}
        seasonRequests={seasonRequests}
        setSeasonRequests={setSeasonRequests}
        getPartnerLevel={getPartnerLevel}
        setViewingProvider={setViewingProvider}
        setIsProviderViewModalOpen={setIsProviderViewModalOpen}
        fetchProviderSubscriptionDetails={fetchProviderSubscriptionDetails}
        showNotification={showNotification}
        setDeleteData={setDeleteData}
        inventorySettings={inventorySettings}
        handleUpdateInventorySettings={handleUpdateInventorySettings}
        setSelectedSeasonRequestForModal={setSelectedSeasonRequestForModal}
      />
    </div>
  );
};
export default ProvidersSection;
