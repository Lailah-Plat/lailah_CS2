import React from 'react';
import { InvoiceModal } from './InvoiceModal';
import { BookingViewModal } from './BookingViewModal';
import { ForceMajeureModal } from './ForceMajeureModal';
import { BookingEditAddModal } from './BookingEditAddModal';
import { SupportRequestModals } from '../SupportRequestModals';
import { AddServiceModal } from '../AddServiceModal';
import { HallStepperModal } from './HallStepperModal';

interface BookingAndHallModalsProps {
  // Invoice Modal Props
  invoiceBookingToPrint: any;
  setInvoiceBookingToPrint: (booking: any) => void;
  bookings: any[];
  halls: any[];
  providers: any[];
  platformData: any;

  // Booking View Modal Props
  isBookingViewModalOpen: boolean;
  setIsBookingViewModalOpen: (open: boolean) => void;
  viewingBooking: any;
  setViewingBooking: (booking: any) => void;

  // Force Majeure Modal Props
  isForceMajeureModalOpen: boolean;
  setIsForceMajeureModalOpen: (open: boolean) => void;
  selectedBookingForForceMajeure: any;
  forceMajeureReason: string;
  setForceMajeureReason: (reason: string) => void;
  forceMajeureDocuments: any[];
  setForceMajeureDocuments: (docs: any[]) => void;
  formatBookingId: (id: any) => string;
  formatCurrency: (value: any) => string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  fetchForceMajeureRequests: () => void;

  // Booking Edit/Add Modal Props
  isBookingModalOpen: boolean;
  setIsBookingModalOpen: (open: boolean) => void;
  editingItem: any;
  setEditingItem: (item: any) => void;
  bookingForm: any;
  setBookingForm: React.Dispatch<React.SetStateAction<any>>;

  // Support Request Modals Props
  isSupportRequestModalOpen: boolean;
  isSupportRequestViewModalOpen: boolean;
  viewingSupportRequest: any;
  supportRequestForm: any;
  setSupportRequestForm: React.Dispatch<React.SetStateAction<any>>;
  setIsSupportRequestModalOpen: (open: boolean) => void;
  setIsSupportRequestViewModalOpen: (open: boolean) => void;
  supportServiceRequests: any[];
  setSupportServiceRequests: React.Dispatch<React.SetStateAction<any[]>>;

  // Add Service Modal Props
  managingHall: any;
  setManagingHall: React.Dispatch<React.SetStateAction<any>>;
  isAddServiceModalOpen: boolean;
  setIsAddServiceModalOpen: (open: boolean) => void;

  // Hall Modal Props
  isHallModalOpen: boolean;
  setIsHallModalOpen: (open: boolean) => void;
  hallForm: any;
  setHallForm: React.Dispatch<React.SetStateAction<any>>;
  hallModalStep: number;
  setHallModalStep: (step: number) => void;
  userRole: string;
  currentProviderName: string;
  currentUserName: string;
  regions: any[];
  providerSubscription: any;
  inventorySettings: any;
  setHalls: React.Dispatch<React.SetStateAction<any[]>>;
  setMapTarget: (target: any) => void;
  setIsMapModalOpen: (open: boolean) => void;
}

export const BookingAndHallModals: React.FC<BookingAndHallModalsProps> = ({
  invoiceBookingToPrint,
  setInvoiceBookingToPrint,
  bookings,
  halls,
  providers,
  platformData,
  isBookingViewModalOpen,
  setIsBookingViewModalOpen,
  viewingBooking,
  setViewingBooking,
  isForceMajeureModalOpen,
  setIsForceMajeureModalOpen,
  selectedBookingForForceMajeure,
  forceMajeureReason,
  setForceMajeureReason,
  forceMajeureDocuments,
  setForceMajeureDocuments,
  formatBookingId,
  formatCurrency,
  showNotification,
  setBookings,
  fetchForceMajeureRequests,
  isBookingModalOpen,
  setIsBookingModalOpen,
  editingItem,
  setEditingItem,
  bookingForm,
  setBookingForm,
  isSupportRequestModalOpen,
  isSupportRequestViewModalOpen,
  viewingSupportRequest,
  supportRequestForm,
  setSupportRequestForm,
  setIsSupportRequestModalOpen,
  setIsSupportRequestViewModalOpen,
  supportServiceRequests,
  setSupportServiceRequests,
  managingHall,
  setManagingHall,
  isAddServiceModalOpen,
  setIsAddServiceModalOpen,
  isHallModalOpen,
  setIsHallModalOpen,
  hallForm,
  setHallForm,
  hallModalStep,
  setHallModalStep,
  userRole,
  currentProviderName,
  currentUserName,
  regions,
  providerSubscription,
  inventorySettings,
  setHalls,
  setMapTarget,
  setIsMapModalOpen
}) => {
  return (
    <>
      {/* Invoice Modal */}
      <InvoiceModal
        invoiceBookingToPrint={invoiceBookingToPrint}
        setInvoiceBookingToPrint={setInvoiceBookingToPrint}
        bookings={bookings}
        halls={halls}
        providers={providers}
        platformData={platformData}
      />

      {/* Booking View Modal */}
      <BookingViewModal
        isOpen={isBookingViewModalOpen}
        booking={viewingBooking}
        onClose={() => setIsBookingViewModalOpen(false)}
        onPrintInvoice={(booking) => setInvoiceBookingToPrint(booking)}
      />

      {/* Dynamic Force Majeure Submit Modal */}
      <ForceMajeureModal
        isOpen={isForceMajeureModalOpen}
        onClose={() => setIsForceMajeureModalOpen(false)}
        selectedBooking={selectedBookingForForceMajeure}
        forceMajeureReason={forceMajeureReason}
        setForceMajeureReason={setForceMajeureReason}
        forceMajeureDocuments={forceMajeureDocuments}
        setForceMajeureDocuments={setForceMajeureDocuments}
        formatBookingId={formatBookingId}
        formatCurrency={formatCurrency}
        showNotification={showNotification}
        bookings={bookings}
        setBookings={setBookings}
        fetchForceMajeureRequests={fetchForceMajeureRequests}
      />

      {/* Booking Edit/Add Modal */}
      <BookingEditAddModal
        isOpen={isBookingModalOpen}
        onClose={() => setIsBookingModalOpen(false)}
        editingItem={editingItem}
        bookingForm={bookingForm}
        setBookingForm={setBookingForm}
        halls={halls}
        bookings={bookings}
        setBookings={setBookings}
        showNotification={showNotification}
      />

      {/* Support Service Request Modals */}
      <SupportRequestModals
        isSupportRequestModalOpen={isSupportRequestModalOpen}
        isSupportRequestViewModalOpen={isSupportRequestViewModalOpen}
        editingItem={editingItem}
        viewingSupportRequest={viewingSupportRequest}
        supportRequestForm={supportRequestForm}
        setSupportRequestForm={setSupportRequestForm}
        setIsSupportRequestModalOpen={setIsSupportRequestModalOpen}
        setIsSupportRequestViewModalOpen={setIsSupportRequestViewModalOpen}
        bookings={bookings}
        supportServiceRequests={supportServiceRequests}
        setSupportServiceRequests={setSupportServiceRequests}
        setViewingBooking={setViewingBooking}
        setIsBookingViewModalOpen={setIsBookingViewModalOpen}
        showNotification={showNotification}
        formatCurrency={formatCurrency}
      />

      {/* Add/Edit Service Modal for Hall */}
      {managingHall && (
        <AddServiceModal 
          isOpen={isAddServiceModalOpen} 
          onClose={() => { setIsAddServiceModalOpen(false); setEditingItem(null); }} 
          hallId={managingHall.id}
          editingItem={editingItem}
          hallName={managingHall.name}
          extraServicesList={managingHall.extraServicesList || []}
          onEditService={(service: any) => {
            setEditingItem(service);
          }}
          onDeleteService={(serviceId: any) => {
            const updatedHalls = halls.map((hall: any) => {
              if (String(hall.id) === String(managingHall.id)) {
                return {
                  ...hall,
                  extraServicesList: (hall.extraServicesList || []).filter((s: any) => String(s.id) !== String(serviceId))
                };
              }
              return hall;
            });
            setHalls(updatedHalls);
            
            setManagingHall((prev: any) => {
              if (!prev || String(prev.id) !== String(managingHall.id)) return prev;
              return {
                ...prev,
                extraServicesList: (prev.extraServicesList || []).filter((s: any) => String(s.id) !== String(serviceId))
              };
            });
            
            showNotification('success', 'تمت إزالة الخدمة بنجاح');
          }}
          onSave={(updatedService: any) => {
            const serviceId = updatedService.id || String(Date.now());
            const newService = {
              id: serviceId,
              name: updatedService.name,
              desc: updatedService.description || updatedService.desc || '',
              description: updatedService.description || updatedService.desc || '',
              quantity: updatedService.quantity || '',
              price: Number(updatedService.price) || 0
            };

            const updatedHalls = halls.map((hall: any) => {
              if (String(hall.id) === String(managingHall.id)) {
                let list = hall.extraServicesList || [];
                if (editingItem) {
                  list = list.map((s: any) => String(s.id) === String(editingItem.id) ? newService : s);
                } else {
                  list = [...list, newService];
                }
                return { ...hall, extraServicesList: list };
              }
              return hall;
            });

            setHalls(updatedHalls);
            
            setManagingHall((prev: any) => {
              if (!prev || String(prev.id) !== String(managingHall.id)) return prev;
              let list = prev.extraServicesList || [];
              if (editingItem) {
                list = list.map((s: any) => String(s.id) === String(editingItem.id) ? newService : s);
              } else {
                list = [...list, newService];
              }
              return { ...prev, extraServicesList: list };
            });

            showNotification('success', editingItem ? 'تم تحديث الخدمة بنجاح' : 'تم إضافة الخدمة الإضافية بنجاح');
            setEditingItem(null);
          }} 
        />
      )}

      {/* Hall Modal */}
      <HallStepperModal
        isOpen={isHallModalOpen}
        onClose={() => setIsHallModalOpen(false)}
        editingItem={editingItem}
        hallForm={hallForm}
        setHallForm={setHallForm}
        hallModalStep={hallModalStep}
        setHallModalStep={setHallModalStep}
        userRole={userRole}
        currentProviderName={currentProviderName}
        currentUserName={currentUserName}
        providers={providers}
        regions={regions}
        providerSubscription={providerSubscription}
        inventorySettings={inventorySettings}
        setHalls={setHalls}
        halls={halls}
        showNotification={showNotification}
        setMapTarget={setMapTarget}
        setIsMapModalOpen={setIsMapModalOpen}
      />
    </>
  );
};
