import React from 'react';
import { X } from 'lucide-react';
import BookingInvoice from '../BookingInvoice';

interface InvoiceModalProps {
  invoiceBookingToPrint: any;
  setInvoiceBookingToPrint: (booking: any) => void;
  bookings: any[];
  halls: any[];
  providers: any[];
  platformData: any;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  invoiceBookingToPrint,
  setInvoiceBookingToPrint,
  bookings,
  halls,
  providers,
  platformData,
}) => {
  if (!invoiceBookingToPrint) return null;

  const isSupportRequest = 'serviceName' in invoiceBookingToPrint;
  const associatedBooking = isSupportRequest 
    ? bookings.find((b: any) => b.id === invoiceBookingToPrint.bookingId) 
    : null;
  const bookingHallObj = !isSupportRequest 
    ? halls.find(h => h.name === invoiceBookingToPrint.hall) 
    : null;
  const providerOfBooking = providers.find(
    (p: any) => p.name === (isSupportRequest 
      ? invoiceBookingToPrint.providerName 
      : (bookingHallObj?.provider || invoiceBookingToPrint.providerName))
  );
  const invoiceVatEnabled = providerOfBooking?.isVatEnabled ?? true;
  const vatRate = invoiceVatEnabled ? 0.15 : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50/50 rounded-t-3xl shrink-0 print:hidden">
          <h3 className="text-xl font-bold text-slate-800">تفاصيل الفاتورة</h3>
          <button 
            onClick={() => setInvoiceBookingToPrint(null)} 
            className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto w-full max-w-[100%]">
          <BookingInvoice 
            bookingId={invoiceBookingToPrint.id.toString()}
            issueDate={invoiceBookingToPrint.date}
            providerName={isSupportRequest ? invoiceBookingToPrint.providerName : (invoiceBookingToPrint.hall || invoiceBookingToPrint.type)}
            providerAddress={!isSupportRequest ? (invoiceBookingToPrint.hallRegion || "غير محدد") : "غير محدد"}
            providerVatNo={invoiceVatEnabled ? (providerOfBooking?.taxNumber || "300000000000003") : ""}
            customerName={isSupportRequest ? invoiceBookingToPrint.customerName : invoiceBookingToPrint.customer}
            customerPhone={isSupportRequest ? (associatedBooking?.phone || "غير محدد") : (invoiceBookingToPrint.phone || "غير محدد")}
            customerEmail={isSupportRequest ? (associatedBooking?.email || "غير محدد") : (invoiceBookingToPrint.email || "غير محدد")}
            customerRegion={invoiceBookingToPrint.customerRegion || invoiceBookingToPrint.city || invoiceBookingToPrint.region || "منطقة الرياض"}
            customerAddressDetail={invoiceBookingToPrint.customerAddress || invoiceBookingToPrint.address || "المملكة العربية السعودية، الرياض"}
            customerVatNo={invoiceBookingToPrint.customerVatNo || invoiceBookingToPrint.vatNo || ""}
            checkInDate={!isSupportRequest ? (invoiceBookingToPrint.startDate || invoiceBookingToPrint.date) : undefined}
            checkOutDate={!isSupportRequest ? (invoiceBookingToPrint.endDate || invoiceBookingToPrint.date) : undefined}
            duration={!isSupportRequest ? invoiceBookingToPrint.period : undefined}
            items={[
              { 
                name: isSupportRequest ? invoiceBookingToPrint.serviceName : `حجز ${invoiceBookingToPrint.hall || invoiceBookingToPrint.type}`, 
                quantity: 1, 
                price: isSupportRequest ? (invoiceBookingToPrint.price / (1+vatRate)) : (invoiceBookingToPrint.basePrice || invoiceBookingToPrint.amount) / (1+vatRate), 
                total: isSupportRequest ? (invoiceBookingToPrint.price / (1+vatRate)) : (invoiceBookingToPrint.basePrice || invoiceBookingToPrint.amount) / (1+vatRate)
              },
              ...(!isSupportRequest && invoiceBookingToPrint.extraServices && invoiceBookingToPrint.extraServices !== 'لا يوجد' ? [{ 
                name: 'خدمات إضافية', 
                quantity: 1, 
                price: (invoiceBookingToPrint.extraPrice || 0) / (1+vatRate), 
                total: (invoiceBookingToPrint.extraPrice || 0) / (1+vatRate) 
              }] : [])
            ]}
            subtotal={(isSupportRequest ? invoiceBookingToPrint.price : invoiceBookingToPrint.amount) / (1 + vatRate)}
            vatAmount={(isSupportRequest ? invoiceBookingToPrint.price : invoiceBookingToPrint.amount) - ((isSupportRequest ? invoiceBookingToPrint.price : invoiceBookingToPrint.amount) / (1 + vatRate))}
            grandTotal={isSupportRequest ? invoiceBookingToPrint.price : invoiceBookingToPrint.amount}
            isExempt={!invoiceVatEnabled}
            paymentMethod="تحويل بنكي"
            status={isSupportRequest ? (invoiceBookingToPrint.status === 'مكتمل' ? 'paid' : 'pending') : (invoiceBookingToPrint.paymentStatus === 'مدفوع' ? 'paid' : 'pending')}
            platformData={platformData}
            allBookings={bookings}
          />
        </div>
      </div>
    </div>
  );
};
