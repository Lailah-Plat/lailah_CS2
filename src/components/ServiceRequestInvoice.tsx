import React, { useState, useEffect } from 'react';
import { X, Receipt } from 'lucide-react';
import { formatInvoiceId, formatServiceRequestId } from '../utils/idUtils';
import BookingInvoice from './BookingInvoice';

interface ServiceRequestInvoiceProps {
  request: any;
  isOpen: boolean;
  onClose: () => void;
}

export default function ServiceRequestInvoice({ request, isOpen, onClose }: ServiceRequestInvoiceProps) {
  const [platformData, setPlatformData] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { platformName: 'منصة ليلة', logoUrl: null, taxNumber: '310123456700003' };
  });
  const [isExempt, setIsExempt] = useState(false);

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('PLATFORM_DATA');
        if (stored) setPlatformData(JSON.parse(stored));
      } catch(e) {}

      // Check provider exemption
      const savedProviders = localStorage.getItem('providersData');
      if (savedProviders && request) {
        const providers = JSON.parse(savedProviders);
        const provider = providers.find((p: any) => p.name === request.providerName);
        if (provider) {
          setIsExempt(provider.isVatEnabled === false);
        }
      }
    };
    handleUpdate();
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, [request]);

  if (!isOpen || !request) return null;

  const vatRate = isExempt ? 0 : 0.15;
  const price = request.price || 0;
  const subtotalValue = price / (1 + vatRate);
  const vatValue = price - subtotalValue;

  const invoiceItems = [
    {
      name: `${request.serviceName} - تنفيذ الخدمة بتاريخ ${request.date}`,
      quantity: request.quantity || 1,
      price: subtotalValue,
      total: price
    }
  ];

  const invoicePlatformData = {
    siteNameArabic: platformData.platformName || 'منصة ليلة للافراح',
    siteNameEnglish: platformData.platformEnName || platformData.platformNameEn || 'Laylah Platform',
    logoUrl: platformData.logoUrl || '',
    taxNumber: platformData.taxNumber || '310459827300003',
    crNumber: platformData.crNumber || '1010672945',
    address: platformData.address || 'الرياض، المملكة العربية السعودية',
    phones: platformData.phones || '920000000'
  };

  const invoiceId = formatInvoiceId(request.id);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="bg-slate-900/40 absolute inset-0" onClick={onClose} />
      <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative z-10 border border-slate-100 animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3" dir="rtl">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-sm md:text-base font-sans">الفاتورة الضريبية الموحدة لطلب الخدمة #{formatServiceRequestId(request.id)}</span>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Container for unified invoice */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
          <BookingInvoice
            bookingId={`SRV-${request.id}`}
            issueDate={request.date}
            providerName={request.providerName}
            providerAddress="الرياض، المملكة العربية السعودية"
            providerVatNo="300582910400003"
            customerName={request.customerName || 'عميل منصة ليلة'}
            customerPhone={request.customerPhone || '05XXXXXXXX'}
            customerEmail={request.customerEmail || 'client@example.com'}
            customerRegion="منطقة الرياض"
            customerAddressDetail="حي الياسمين، الرياض"
            customerVatNo=""
            checkInDate={request.date}
            checkOutDate={request.date}
            duration={request.period || 'مساءً'}
            items={invoiceItems}
            subtotal={subtotalValue}
            vatAmount={vatValue}
            grandTotal={price}
            paymentMethod="بطاقة ائتمانية / مدى"
            status={request.paymentStatus === 'مدفوع' ? 'paid' : 'pending'}
            isExempt={isExempt}
            platformData={invoicePlatformData}
            hideControlPanel={true}
            fixedLogoSize={true}
            guests={180}
            initialInvoiceType="service"
          />
        </div>

      </div>
    </div>
  );
}
