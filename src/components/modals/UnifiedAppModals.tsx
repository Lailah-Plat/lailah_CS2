import React from 'react';
import { CustomerModals } from '../CustomerModals';
import { CampaignModals } from '../CampaignModals';
import { SubscriptionModals } from './SubscriptionModals';
import { PlatformUserModal } from '../admin/PlatformUserModal';
import { ProviderModals } from '../ProviderModals';
import { ServiceViewModal } from './ServiceViewModal';
import { ServiceModalForm } from './ServiceModalForm';
import { DeleteConfirmationModal } from './DeleteConfirmationModal';
import { PledgeDetailsModal } from './PledgeDetailsModal';
import GoogleMapsModal from '../common/GoogleMapsModal';

interface UnifiedAppModalsProps {
  // Customer Modals Props
  isCustomerModalOpen: boolean;
  isCustomerViewModalOpen: boolean;
  editingItem: any;
  viewingCustomer: any;
  customerForm: any;
  setCustomerForm: React.Dispatch<React.SetStateAction<any>>;
  setIsCustomerModalOpen: (open: boolean) => void;
  setIsCustomerViewModalOpen: (open: boolean) => void;
  customers: any[];
  setCustomers: React.Dispatch<React.SetStateAction<any[]>>;
  regions: any[];
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  setIsMapModalOpen: (open: boolean) => void;
  setMapTarget: (target: any) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;

  // Campaign Modals Props
  isCampaignModalOpen: boolean;
  isCampaignViewModalOpen: boolean;
  viewingCampaign: any;
  campaignForm: any;
  setCampaignForm: React.Dispatch<React.SetStateAction<any>>;
  setIsCampaignModalOpen: (open: boolean) => void;
  setIsCampaignViewModalOpen: (open: boolean) => void;
  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  formatCurrency: (value: any) => string;

  // Subscription Modals Props
  isSubscriptionModalOpen: boolean;
  setIsSubscriptionModalOpen: (open: boolean) => void;
  isSubscriptionViewModalOpen: boolean;
  setIsSubscriptionViewModalOpen: (open: boolean) => void;
  subscriptionForm: any;
  setSubscriptionForm: React.Dispatch<React.SetStateAction<any>>;
  viewingSubscription: any;
  subscriptions: any[];
  setSubscriptions: React.Dispatch<React.SetStateAction<any[]>>;
  fetchSubscriptionPlans?: () => void;

  // Platform User Modal Props
  isPlatformUserModalOpen: boolean;
  setIsPlatformUserModalOpen: (open: boolean) => void;
  platformUserForm: any;
  setPlatformUserForm: React.Dispatch<React.SetStateAction<any>>;
  editingPlatformUser: any;
  handleSavePlatformUser: (e: React.FormEvent) => Promise<void>;

  // Provider Modals Props
  isProviderModalOpen: boolean;
  isProviderViewModalOpen: boolean;
  isDocsModalOpen: boolean;
  viewingProvider: any;
  providerForm: any;
  setProviderForm: React.Dispatch<React.SetStateAction<any>>;
  setIsProviderModalOpen: (open: boolean) => void;
  setIsProviderViewModalOpen: (open: boolean) => void;
  setIsDocsModalOpen: (open: boolean) => void;
  providers: any[];
  setProviders: React.Dispatch<React.SetStateAction<any[]>>;
  getPartnerLevel: (prov: any) => any;
  enableProviderLevels: boolean;
  setIsPledgeModalOpen: (open: boolean) => void;

  // Service View Modal Props
  isServiceViewModalOpen: boolean;
  setIsServiceViewModalOpen: (open: boolean) => void;
  viewingService: any;
  setEditingItem: (item: any) => void;

  // Service Modal Form Props
  isServiceModalOpen: boolean;
  setIsServiceModalOpen: (open: boolean) => void;
  serviceForm: any;
  setServiceForm: React.Dispatch<React.SetStateAction<any>>;
  activeServiceTab: any;
  setActiveServiceTab: any;
  currentUserName: string;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;

  // Delete Confirmation Modal Props
  deleteData: any;
  setDeleteData: (data: any) => void;
  handleDelete: () => void;
  bookings?: any[];
  supportServiceRequests?: any[];
  halls?: any[];

  // Pledge Details Modal Props
  isPledgeModalOpen: boolean;

  // Map Modal Props
  isMapModalOpen: boolean;
  handleMapConfirm: (address: string, location?: { lat: number; lng: number }, extra?: { region: string; city: string }) => void;
  mapTarget: any;
  staffForm: any;
  hallForm: any;
}

export const UnifiedAppModals: React.FC<UnifiedAppModalsProps> = (props) => {
  const {
    isCustomerModalOpen,
    isCustomerViewModalOpen,
    editingItem,
    viewingCustomer,
    customerForm,
    setCustomerForm,
    setIsCustomerModalOpen,
    setIsCustomerViewModalOpen,
    customers,
    setCustomers,
    regions,
    systemUsers,
    setSystemUsers,
    setIsMapModalOpen,
    setMapTarget,
    showNotification,

    isCampaignModalOpen,
    isCampaignViewModalOpen,
    viewingCampaign,
    campaignForm,
    setCampaignForm,
    setIsCampaignModalOpen,
    setIsCampaignViewModalOpen,
    campaigns,
    setCampaigns,
    formatCurrency,

    isSubscriptionModalOpen,
    setIsSubscriptionModalOpen,
    isSubscriptionViewModalOpen,
    setIsSubscriptionViewModalOpen,
    subscriptionForm,
    setSubscriptionForm,
    viewingSubscription,
    subscriptions,
    setSubscriptions,
    fetchSubscriptionPlans,

    isPlatformUserModalOpen,
    setIsPlatformUserModalOpen,
    platformUserForm,
    setPlatformUserForm,
    editingPlatformUser,
    handleSavePlatformUser,

    isProviderModalOpen,
    isProviderViewModalOpen,
    isDocsModalOpen,
    viewingProvider,
    providerForm,
    setProviderForm,
    setIsProviderModalOpen,
    setIsProviderViewModalOpen,
    setIsDocsModalOpen,
    providers,
    setProviders,
    getPartnerLevel,
    enableProviderLevels,
    setIsPledgeModalOpen,

    isServiceViewModalOpen,
    setIsServiceViewModalOpen,
    viewingService,
    setEditingItem,

    isServiceModalOpen,
    setIsServiceModalOpen,
    serviceForm,
    setServiceForm,
    activeServiceTab,
    setActiveServiceTab,
    currentUserName,
    services,
    setServices,

    deleteData,
    setDeleteData,
    handleDelete,

    isPledgeModalOpen,

    isMapModalOpen,
    handleMapConfirm,
    mapTarget,
    staffForm,
    hallForm,
  } = props;

  const initialAddress = React.useMemo(() => {
    if (!mapTarget) return '';
    if (mapTarget.type === 'staff') return staffForm?.nationalAddress || '';
    if (mapTarget.type === 'customer') return customerForm?.nationalAddress || '';
    if (mapTarget.type === 'provider') return providerForm?.nationalAddress || '';
    if (mapTarget.type === 'hall') return hallForm?.nationalAddress || '';
    return '';
  }, [mapTarget, staffForm, customerForm, providerForm, hallForm]);

  return (
    <>
      {/* Customer Modals */}
      <CustomerModals
        isCustomerModalOpen={isCustomerModalOpen}
        isCustomerViewModalOpen={isCustomerViewModalOpen}
        editingItem={editingItem}
        viewingCustomer={viewingCustomer}
        customerForm={customerForm}
        setCustomerForm={setCustomerForm}
        setIsCustomerModalOpen={setIsCustomerModalOpen}
        setIsCustomerViewModalOpen={setIsCustomerViewModalOpen}
        customers={customers}
        setCustomers={setCustomers}
        regions={regions}
        systemUsers={systemUsers}
        setSystemUsers={setSystemUsers}
        setIsMapModalOpen={setIsMapModalOpen}
        setMapTarget={setMapTarget}
        showNotification={showNotification}
      />

      {/* Marketing Campaign Modals */}
      <CampaignModals
        isCampaignModalOpen={isCampaignModalOpen}
        isCampaignViewModalOpen={isCampaignViewModalOpen}
        editingItem={editingItem}
        viewingCampaign={viewingCampaign}
        campaignForm={campaignForm}
        setCampaignForm={setCampaignForm}
        setIsCampaignModalOpen={setIsCampaignModalOpen}
        setIsCampaignViewModalOpen={setIsCampaignViewModalOpen}
        campaigns={campaigns}
        setCampaigns={setCampaigns}
        formatCurrency={formatCurrency}
      />

      {/* Subscription Modals */}
      <SubscriptionModals
        isSubscriptionModalOpen={isSubscriptionModalOpen}
        setIsSubscriptionModalOpen={setIsSubscriptionModalOpen}
        isSubscriptionViewModalOpen={isSubscriptionViewModalOpen}
        setIsSubscriptionViewModalOpen={setIsSubscriptionViewModalOpen}
        editingItem={editingItem}
        subscriptionForm={subscriptionForm}
        setSubscriptionForm={setSubscriptionForm}
        viewingSubscription={viewingSubscription}
        subscriptions={subscriptions}
        setSubscriptions={setSubscriptions}
        showNotification={showNotification}
        fetchSubscriptionPlans={fetchSubscriptionPlans}
      />

      {/* Platform User Manual Add/Edit Modal */}
      <PlatformUserModal
        isOpen={isPlatformUserModalOpen}
        onClose={() => setIsPlatformUserModalOpen(false)}
        platformUserForm={platformUserForm}
        setPlatformUserForm={setPlatformUserForm}
        editingPlatformUser={editingPlatformUser}
        regions={regions}
        handleSavePlatformUser={handleSavePlatformUser}
      />

      {/* Provider Modals */}
      <ProviderModals
        isProviderModalOpen={isProviderModalOpen}
        isProviderViewModalOpen={isProviderViewModalOpen}
        isDocsModalOpen={isDocsModalOpen}
        editingItem={editingItem}
        viewingProvider={viewingProvider}
        providerForm={providerForm}
        setProviderForm={setProviderForm}
        setIsProviderModalOpen={setIsProviderModalOpen}
        setIsProviderViewModalOpen={setIsProviderViewModalOpen}
        setIsDocsModalOpen={setIsDocsModalOpen}
        providers={providers}
        setProviders={setProviders}
        regions={regions}
        systemUsers={systemUsers}
        setSystemUsers={setSystemUsers}
        setIsMapModalOpen={setIsMapModalOpen}
        setMapTarget={setMapTarget}
        showNotification={showNotification}
        getPartnerLevel={getPartnerLevel}
        enableProviderLevels={enableProviderLevels}
        setIsPledgeModalOpen={setIsPledgeModalOpen}
      />

      {/* Service View Modal */}
      {isServiceViewModalOpen && viewingService && (
        <ServiceViewModal
          isOpen={isServiceViewModalOpen}
          onClose={() => setIsServiceViewModalOpen(false)}
          viewingService={viewingService}
          providers={providers}
          enableProviderLevels={enableProviderLevels}
          getPartnerLevel={getPartnerLevel}
          formatCurrency={formatCurrency}
          setEditingItem={setEditingItem}
        />
      )}

      {/* Service Modal Form */}
      <ServiceModalForm
        isOpen={isServiceModalOpen}
        onClose={() => setIsServiceModalOpen(false)}
        editingItem={editingItem}
        serviceForm={serviceForm}
        setServiceForm={setServiceForm}
        activeServiceTab={activeServiceTab}
        setActiveServiceTab={setActiveServiceTab}
        providers={providers}
        regions={regions}
        currentUserName={currentUserName}
        services={services}
        setServices={setServices}
        showNotification={showNotification}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        deleteData={deleteData}
        setDeleteData={setDeleteData}
        handleDelete={handleDelete}
        bookings={props.bookings}
        supportRequests={props.supportServiceRequests}
        halls={props.halls}
        services={services}
      />

      {/* Pledge Details Modal */}
      <PledgeDetailsModal
        isOpen={isPledgeModalOpen}
        onClose={() => setIsPledgeModalOpen(false)}
      />

      {/* Google Maps Modal */}
      <GoogleMapsModal 
        isOpen={isMapModalOpen} 
        onClose={() => setIsMapModalOpen(false)} 
        onConfirm={handleMapConfirm} 
        initialAddress={initialAddress}
      />
    </>
  );
};
