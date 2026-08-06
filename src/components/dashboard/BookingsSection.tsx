import React from 'react';
import { BookingsManagement } from '../BookingsManagement';
import { LockScreen } from '../common/LockScreen';
import { useApp } from '../../context/AppContext';

export const BookingsSection: React.FC<any> = (props) => {
  const appState = useApp();
  const {
    userRole,
    isAdminUser,
    currentUser,
    currentProviderName,
    currentUserName,
    providerSubscription,
    bookings,
    setBookings,
    halls,
    services,
    providers,
    supportServiceRequests,
    enableForceMajeureProtocol,
    forceMajeureWindowDays,
    showNotification,
    updateSupportRequestStatus,
    setInvoiceBookingToPrint,
    setViewingBooking,
    setIsBookingViewModalOpen,
    setEditingItem,
    setBookingForm,
    setIsBookingModalOpen,
    setSupportRequestForm,
    setIsSupportRequestModalOpen,
    setViewingSupportRequest,
    setIsSupportRequestViewModalOpen,
    setDeleteData,
    setSelectedBookingForForceMajeure,
    setForceMajeureReason,
    setForceMajeureDocuments,
    setIsForceMajeureModalOpen,
    setActiveTab,
  } = { ...appState, ...props };

  if (userRole === 'provider' && !providerSubscription?.includesFullManagement) {
    return (
      <LockScreen 
        featureName="الإدارة الشاملة للحجوزات والخدمات" 
        onUpgradeClick={() => setActiveTab('subscriptions')} 
      />
    );
  }

  return (
    <div id="bookings_section_container">
      <BookingsManagement
        userRole={userRole}
        isAdminUser={isAdminUser}
        currentUser={currentUser}
        currentProviderName={currentProviderName}
        currentUserName={currentUserName}
        providerSubscription={providerSubscription}
        bookings={bookings}
        setBookings={setBookings}
        halls={halls}
        services={services}
        providers={providers}
        supportServiceRequests={supportServiceRequests}
        enableForceMajeureProtocol={enableForceMajeureProtocol}
        forceMajeureWindowDays={forceMajeureWindowDays}
        showNotification={showNotification}
        updateSupportRequestStatus={updateSupportRequestStatus as any}
        setInvoiceBookingToPrint={setInvoiceBookingToPrint}
        setViewingBooking={setViewingBooking}
        setIsBookingViewModalOpen={setIsBookingViewModalOpen}
        setEditingItem={setEditingItem}
        setBookingForm={setBookingForm}
        setIsBookingModalOpen={setIsBookingModalOpen}
        setSupportRequestForm={setSupportRequestForm}
        setIsSupportRequestModalOpen={setIsSupportRequestModalOpen}
        setViewingSupportRequest={setViewingSupportRequest}
        setIsSupportRequestViewModalOpen={setIsSupportRequestViewModalOpen}
        setDeleteData={setDeleteData}
        setSelectedBookingForForceMajeure={setSelectedBookingForForceMajeure}
        setForceMajeureReason={setForceMajeureReason}
        setForceMajeureDocuments={setForceMajeureDocuments}
        setIsForceMajeureModalOpen={setIsForceMajeureModalOpen}
      />
    </div>
  );
};
