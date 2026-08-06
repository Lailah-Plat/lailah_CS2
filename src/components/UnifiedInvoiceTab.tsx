import React, { useState } from 'react';
import BookingInvoice from './BookingInvoice';
import { formatBookingId } from '../utils/idUtils';

interface UnifiedInvoiceTabProps {
  bookings: any[];
  halls: any[];
  providers: any[];
  platformData: any;
}

export default function UnifiedInvoiceTab({
  bookings = [],
  halls = [],
  providers = [],
  platformData
}: UnifiedInvoiceTabProps) {
  const [selectedBookingId, setSelectedBookingId] = useState<string>('default');

  const activeBooking = bookings.find((b: any) => b.id.toString() === selectedBookingId) || {
    id: '04918',
    date: '2026-06-25',
    hall: 'قاعة ليلة الذهبية',
    hallRegion: 'الرياض، المملكة العربية السعودية',
    customer: 'عبدالرحمن العتيبي',
    phone: '+966 50 123 4567',
    email: 'alotaibi@example.com',
    amount: 15000,
    period: 'مساءً (4:00 م - 12:00 ص)',
    startDate: '2026-06-25',
    endDate: '2026-06-25',
    basePrice: 15000,
    extraServices: 'لا يوجد',
    paymentStatus: 'مدفوع'
  };

  const isSupportRequest = 'serviceName' in activeBooking;
  const associatedBooking = isSupportRequest ? bookings.find((b: any) => b.id === activeBooking.bookingId) : null;
  const bookingHallObj = !isSupportRequest ? halls.find(h => h.name === activeBooking.hall) : null;
  const providerOfBooking = providers.find((p: any) => p.name === (isSupportRequest ? activeBooking.providerName : (bookingHallObj?.provider || activeBooking.providerName)));
  const invoiceVatEnabled = providerOfBooking?.isVatEnabled ?? true;
  const vatRate = invoiceVatEnabled ? 0.15 : 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 text-right" dir="rtl">
      {/* Selector card */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 font-sans">مستند الفاتورة الضريبية الموحدة</h2>
          <p className="text-xs text-slate-500 mt-1">اختر أي حجز أو معاملة من القائمة أدناه لعرض وتخصيص الفاتورة الضريبية الموحدة المتوافقة مع هيئة الزكاة والضريبة والجمارك (ZATCA).</p>
        </div>
        <div className="flex gap-2 items-center w-full md:w-auto">
          <span className="text-xs font-bold text-slate-600 whitespace-nowrap">اختر الحجز للفوترة:</span>
          <select
            value={selectedBookingId}
            onChange={(e) => setSelectedBookingId(e.target.value)}
            className="bg-white border border-slate-200 text-slate-700 px-4 py-2.5 rounded-xl text-xs font-bold shadow-sm outline-none cursor-pointer w-full md:w-64"
          >
            <option value="default">✨ نموذج فاتورة تفاعلي افتراضي</option>
            {bookings.map((b: any) => (
              <option key={b.id} value={b.id.toString()}>
                {formatBookingId(b.id)} - {b.customer || b.customerName || 'عميل'} ({b.hall || b.itemName || 'قاعة'})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Invoice representation */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <BookingInvoice 
          bookingId={activeBooking.id.toString()}
          issueDate={activeBooking.date || activeBooking.startDate}
          providerName={isSupportRequest ? activeBooking.providerName : (activeBooking.hall || activeBooking.type)}
          providerAddress={!isSupportRequest ? (activeBooking.hallRegion || "الرياض، السعودية") : "الرياض، السعودية"}
          providerVatNo={invoiceVatEnabled ? (providerOfBooking?.taxNumber || "300000000000003") : ""}
          customerName={isSupportRequest ? activeBooking.customerName : activeBooking.customer}
          customerPhone={isSupportRequest ? (associatedBooking?.phone || "غير محدد") : (activeBooking.phone || "غير محدد")}
          customerEmail={isSupportRequest ? (associatedBooking?.email || "غير محدد") : (activeBooking.email || "غير محدد")}
          customerRegion={activeBooking.customerRegion || activeBooking.city || activeBooking.region || "منطقة الرياض"}
          customerAddressDetail={activeBooking.customerAddress || activeBooking.address || "المملكة العربية السعودية، الرياض"}
          customerVatNo={activeBooking.customerVatNo || activeBooking.vatNo || ""}
          checkInDate={!isSupportRequest ? (activeBooking.startDate || activeBooking.date) : undefined}
          checkOutDate={!isSupportRequest ? (activeBooking.endDate || activeBooking.date) : undefined}
          duration={!isSupportRequest ? activeBooking.period : undefined}
          items={[
             { 
               name: isSupportRequest ? activeBooking.serviceName : `حجز ${activeBooking.hall || activeBooking.type}`, 
               quantity: 1, 
               price: isSupportRequest ? (activeBooking.price / (1+vatRate)) : (activeBooking.basePrice || activeBooking.amount) / (1+vatRate), 
               total: isSupportRequest ? (activeBooking.price / (1+vatRate)) : (activeBooking.basePrice || activeBooking.amount) / (1+vatRate)
             },
             ...(!isSupportRequest && activeBooking.extraServices && activeBooking.extraServices !== 'لا يوجد' ? [{ 
               name: 'خدمات إضافية', 
               quantity: 1, 
               price: (activeBooking.extraPrice || 0) / (1+vatRate), 
               total: (activeBooking.extraPrice || 0) / (1+vatRate) 
             }] : [])
          ]}
          subtotal={(isSupportRequest ? activeBooking.price : activeBooking.amount) / (1 + vatRate)}
          vatAmount={(isSupportRequest ? activeBooking.price : activeBooking.amount) - ((isSupportRequest ? activeBooking.price : activeBooking.amount) / (1 + vatRate))}
          grandTotal={isSupportRequest ? activeBooking.price : activeBooking.amount}
          isExempt={!invoiceVatEnabled}
          paymentMethod="تحويل بنكي"
          status={isSupportRequest ? (activeBooking.status === 'مكتمل' ? 'paid' : 'pending') : (activeBooking.paymentStatus === 'مدفوع' ? 'paid' : 'pending')}
          platformData={platformData}
          allBookings={bookings}
        />
      </div>
    </div>
  );
}
