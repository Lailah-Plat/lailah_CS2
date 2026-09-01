import React, { useState, useMemo, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { formatBookingId, formatServiceRequestId } from '../utils/idUtils';
import { AdBanner } from './AdBanner';
import { 
  Printer, 
  Download, 
  Image as ImageIcon, 
  Share2, 
  Link as LinkIcon, 
  Copy, 
  MessageSquare, 
  Sparkles, 
  Check, 
  AlertTriangle, 
  Calendar, 
  Users, 
  Clock, 
  ShieldCheck, 
  Mail, 
  Phone, 
  MapPin, 
  Hash, 
  Sliders,
  FileText,
  CreditCard,
  Building,
  Info
} from 'lucide-react';

const html2canvasSafe = async (element: HTMLElement, options?: any) => {
  const originalGetComputedStyle = window.getComputedStyle;
  const originalDescriptor = Object.getOwnPropertyDescriptor(CSSStyleSheet.prototype, 'cssRules');
  let rulesOverridden = false;
  let gcsOverridden = false;
  
  const sanitizeUnsupportedColors = (value: string): string => {
    if (!value || typeof value !== 'string') return value;
    let val = value;
    if (val.includes('oklch')) {
      val = val.replace(/oklch\([^)]+\)/g, 'rgb(226, 232, 240)');
    }
    if (val.includes('oklab')) {
      val = val.replace(/oklab\([^)]+\)/g, 'rgb(226, 232, 240)');
    }
    return val;
  };

  if (originalDescriptor && originalDescriptor.get) {
    try {
      const originalGetter = originalDescriptor.get;
      Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', {
        get() {
          try {
            const rules = originalGetter.call(this);
            if (!rules) return rules;
            const filteredRules: CSSRule[] = [];
            for (let i = 0; i < rules.length; i++) {
              const rule = rules[i];
              if (!rule.cssText || (!rule.cssText.includes('oklch') && !rule.cssText.includes('oklab'))) {
                filteredRules.push(rule);
              }
            }
            return filteredRules;
          } catch (e) {
            return [];
          }
        },
        configurable: true,
        enumerable: true
      });
      rulesOverridden = true;
    } catch (err) {
      console.error('Error setting up cssRules override', err);
    }
  }

  try {
    window.getComputedStyle = function(el, pseudoElt) {
      const style = originalGetComputedStyle.call(this, el, pseudoElt);
      return new Proxy(style, {
        get(target, prop) {
          if (prop === 'getPropertyValue') {
            return function(propertyName: string) {
              const val = target.getPropertyValue(propertyName);
              return sanitizeUnsupportedColors(val);
            };
          }
          const val = Reflect.get(target, prop);
          if (typeof val === 'string') {
            return sanitizeUnsupportedColors(val);
          }
          if (typeof val === 'function') {
            return val.bind(target);
          }
          return val;
        }
      });
    };
    gcsOverridden = true;
  } catch (err) {
    console.error('Error setting up getComputedStyle override', err);
  }

  try {
    return await html2canvas(element, options);
  } finally {
    if (rulesOverridden && originalDescriptor) {
      try {
        Object.defineProperty(CSSStyleSheet.prototype, 'cssRules', originalDescriptor);
      } catch (err) {
        console.error('Error restoring cssRules override', err);
      }
    }
    if (gcsOverridden) {
      window.getComputedStyle = originalGetComputedStyle;
    }
  }
};

interface InvoiceProps {
  bookingId: string;
  issueDate: string;
  providerName: string;
  providerAddress: string;
  providerVatNo: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerRegion?: string;
  customerAddressDetail?: string;
  customerVatNo?: string;
  checkInDate?: string;
  checkOutDate?: string;
  duration?: string;
  items: Array<{ name: string; quantity: number; price: number; total: number }>;
  subtotal: number;
  vatAmount: number;
  grandTotal: number;
  paymentMethod: string;
  status: 'paid' | 'pending' | 'cancelled' | string;
  isExempt?: boolean;
  platformData?: {
    siteNameArabic: string;
    siteNameEnglish: string;
    logoUrl: string;
    taxNumber: string;
    crNumber: string;
    address: string;
    phones: string;
  };
  allBookings?: any[];
  hideControlPanel?: boolean;
  fixedLogoSize?: boolean;
  guests?: number;
  initialInvoiceType?: 'hall' | 'service';
}

export default function BookingInvoice(props: InvoiceProps) {
  // -------------------------------------------------------------
  // Dynamic Playground State for Interactive Customer Previews
  // -------------------------------------------------------------
  const [invoiceType, setInvoiceType] = useState<'hall' | 'service'>(
    props.initialInvoiceType || (props.checkInDate ? 'hall' : 'service')
  );
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'pending' | 'cancelled'>(
    props.status === 'paid' ? 'paid' : props.status === 'cancelled' ? 'cancelled' : 'pending'
  );
  const [isVatExempt, setIsVatExempt] = useState<boolean>(props.isExempt || false);
  const [paymentMethod, setPaymentMethod] = useState<string>(
    props.paymentMethod || 'التقسيم الفوري Split'
  );
  const [isThermalView, setIsThermalView] = useState<boolean>(false);
  const [guestCount, setGuestCount] = useState<number>(props.guests || 180);
  const [directOrderName, setDirectOrderName] = useState<string>('خدمة ضيافة واستقبال فاخرة (VIP Catering & Host)');
  const [logoWidth, setLogoWidth] = useState<number>(props.fixedLogoSize ? 124 : 123.62);

  // Provider editable details
  const [providerName, setProviderName] = useState<string>(props.providerName || 'قاعة ليلة رويال للافراح');
  const [providerAddress, setProviderAddress] = useState<string>(props.providerAddress || 'المنطقة الوسطى، الرياض');
  const [providerVatNo, setProviderVatNo] = useState<string>(props.providerVatNo || '300582910400003');

  // Customer editable details
  const [customerName, setCustomerName] = useState<string>(props.customerName || 'عبد الله بن محمد العتيبي');
  const [customerPhone, setCustomerPhone] = useState<string>(props.customerPhone || '+966 50 123 4567');
  const [customerEmail, setCustomerEmail] = useState<string>(props.customerEmail || 'abdullah@example.com');
  const [customerRegion, setCustomerRegion] = useState<string>(props.customerRegion || 'منطقة الرياض');
  const [customerAddressDetail, setCustomerAddressDetail] = useState<string>(props.customerAddressDetail || 'حي الياسمين، شارع العليا، الرياض، السعودية');
  const [customerVatNo, setCustomerVatNo] = useState<string>(props.customerVatNo || '');
  const [showPartiesEditor, setShowPartiesEditor] = useState<boolean>(false);
  const [printDateTime, setPrintDateTime] = useState<string>('');

  useEffect(() => {
    const updatePrintTime = () => {
      const now = new Date();
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      setPrintDateTime(`${y}-${m}-${d} ${hh}:${mm}:${ss}`);
    };
    updatePrintTime();
  }, []);

  // Synchronize with external prop updates (e.g. from the Unified Invoice selector)
  useEffect(() => {
    setProviderName(props.providerName || 'قاعة ليلة رويال للافراح');
    setProviderAddress(props.providerAddress || 'المنطقة الوسطى، الرياض');
    setProviderVatNo(props.providerVatNo || '300582910400003');
    setCustomerName(props.customerName || 'عبد الله بن محمد العتيبي');
    setCustomerPhone(props.customerPhone || '+966 50 123 4567');
    setCustomerEmail(props.customerEmail || 'abdullah@example.com');
    setCustomerRegion(props.customerRegion || 'منطقة الرياض');
    setCustomerAddressDetail(props.customerAddressDetail || 'حي الياسمين، شارع العليا، الرياض، السعودية');
    setCustomerVatNo(props.customerVatNo || '');
    setInvoiceType(props.checkInDate ? 'hall' : 'service');
    setPaymentStatus(props.status === 'paid' ? 'paid' : props.status === 'cancelled' ? 'cancelled' : 'pending');
    setIsVatExempt(props.isExempt || false);
    setPaymentMethod(props.paymentMethod || 'التقسيم الفوري Split');
    if (props.guests !== undefined) {
      setGuestCount(props.guests);
    }
    if (props.fixedLogoSize) {
      setLogoWidth(124);
    }
  }, [
    props.providerName,
    props.providerAddress,
    props.providerVatNo,
    props.customerName,
    props.customerPhone,
    props.customerEmail,
    props.customerRegion,
    props.customerAddressDetail,
    props.customerVatNo,
    props.checkInDate,
    props.status,
    props.isExempt,
    props.paymentMethod,
    props.guests,
    props.fixedLogoSize
  ]);
  
  // Notification Feedback
  const [showToast, setShowToast] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  // Extract Invoice Year suffix dynamically for INV-YYXXXXXXX
  const invoiceYearSuffix = useMemo(() => {
    try {
      if (props.issueDate) {
        // Convert any Arabic numerals to English numerals
        const cleanDateStr = String(props.issueDate).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632));
        const parts = cleanDateStr.split(/[-/.]/);
        
        // Look for a 4-digit part (e.g. 2026)
        const yearPart = parts.find(p => p.trim().length === 4);
        if (yearPart) {
          return yearPart.trim().substring(2);
        }

        const parsedDate = new Date(cleanDateStr);
        if (!isNaN(parsedDate.getTime())) {
          return String(parsedDate.getFullYear()).substring(2);
        }
      }
    } catch (e) {}
    return String(new Date().getFullYear()).substring(2);
  }, [props.issueDate]);

  // Serialized invoice ID formatting (INV-YYXXXXXXX)
  const formattedInvoiceId = useMemo(() => {
    let sequenceNumber = 1;
    const currentIdStr = String(props.bookingId || '');

    if (props.allBookings && props.allBookings.length > 0) {
      // Helper to extract year suffix from a booking record
      const getBookingYearSuffix = (b: any): string => {
        const dateStr = b.date || b.startDate || b.issueDate || '';
        try {
          const cleanStr = String(dateStr).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632));
          const parts = cleanStr.split(/[-/.]/);
          const yearPart = parts.find((p: string) => p.trim().length === 4);
          if (yearPart) {
            return yearPart.trim().substring(2);
          }
          const parsed = new Date(cleanStr);
          if (!isNaN(parsed.getTime())) {
            return String(parsed.getFullYear()).substring(2);
          }
        } catch (e) {}
        return invoiceYearSuffix;
      };

      // Filter other bookings to find those belonging to the same calendar year
      const sameYearBookings = props.allBookings.filter((b: any) => {
        return getBookingYearSuffix(b) === invoiceYearSuffix;
      });

      // Sort same-year bookings sequentially by date and then by numeric ID
      const sortedBookings = [...sameYearBookings].sort((a: any, b: any) => {
        const dateA = new Date(a.date || a.startDate || 0).getTime();
        const dateB = new Date(b.date || b.startDate || 0).getTime();
        if (dateA !== dateB) return dateA - dateB;
        const idA = parseInt(String(a.id || '').replace(/[^0-9]/g, '')) || 0;
        const idB = parseInt(String(b.id || '').replace(/[^0-9]/g, '')) || 0;
        return idA - idB;
      });

      // Find the index of the current booking in the sorted yearly sequence
      const foundIndex = sortedBookings.findIndex((b: any) => String(b.id) === currentIdStr);
      if (foundIndex !== -1) {
        sequenceNumber = foundIndex + 1;
      } else {
        const cleanId = String(props.bookingId).replace(/[^0-9]/g, '');
        sequenceNumber = parseInt(cleanId) || 1;
      }
    } else {
      const cleanId = String(props.bookingId).replace(/[^0-9]/g, '');
      sequenceNumber = parseInt(cleanId) || 1;
    }

    const paddedSeq = String(sequenceNumber).padStart(10, '0');
    return `INV-${invoiceYearSuffix}${paddedSeq}`;
  }, [props.bookingId, props.allBookings, invoiceYearSuffix]);

  // Unified Booking/Service ID conforming to AGENTS.md rules
  const formattedBookingOrServiceId = useMemo(() => {
    const cleanId = String(props.bookingId).replace(/\D/g, '') || '1';
    if (invoiceType === 'hall') {
      return formatBookingId(cleanId);
    } else {
      return formatServiceRequestId(cleanId);
    }
  }, [props.bookingId, invoiceType]);

  // Dynamic Hijri Date based on Gregorian Issue Date using native Intl API
  const hijriDate = useMemo(() => {
    try {
      if (!props.issueDate) return '';
      // Clean Arabic digits back to standard for Date parser
      const cleanDateStr = String(props.issueDate).replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 1632));
      const parts = cleanDateStr.split(/[-/.]/);
      let parsedDate = new Date(cleanDateStr);

      if (isNaN(parsedDate.getTime()) && parts.length === 3) {
        if (parts[0].length === 4) {
          parsedDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        } else {
          // Assume DD-MM-YYYY format
          parsedDate = new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
        }
      }

      const finalDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(finalDate);
    } catch (e) {
      return new Intl.DateTimeFormat('ar-SA-u-ca-islamic', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    }
  }, [props.issueDate]);

  // Reference code (ZATCA / Platform tracking)
  const formattedReferenceId = useMemo(() => {
    const cleanId = String(props.bookingId).replace(/[^0-9]/g, '');
    return `REF-2026-${String(cleanId || '9240').padStart(5, '0')}`;
  }, [props.bookingId]);

  // Financial calculations based on options selected in play area
  const vatRate = isVatExempt ? 0 : 0.15;

  const currentItems = useMemo(() => {
    // If testing Service type
    if (invoiceType === 'service') {
      const basePrice = 2800;
      return [
        { name: directOrderName, quantity: 1, price: basePrice, total: basePrice },
        { name: 'ترقية نظام الإضاءة ليزر وبخار ملون', quantity: 1, price: 450, total: 450 }
      ];
    }
    
    // Default Hall type with potential extras
    const originalFirstPrice = props.items?.[0]?.price || 12000;
    return [
      { 
        name: `حجز ${providerName || 'قاعة ليلة الذهبية'} - باقة التميز المتكاملة`, 
        quantity: 1, 
        price: originalFirstPrice, 
        total: originalFirstPrice 
      },
      { name: 'خدمة كوشة ملكية وتصميم مخصص للستائر والورد', quantity: 1, price: 1800, total: 1800 },
      { name: 'ترقية باقة الضيافة (شوكولاتة فاخرة وعصائر طازجة)', quantity: 1, price: 1200, total: 1200 }
    ];
  }, [invoiceType, directOrderName, props.items, providerName, vatRate]);

  const financialSummary = useMemo(() => {
    // Prices registered in the platform are fully inclusive of VAT (15%). No double tax added on top.
    const grandTotal = currentItems.reduce((acc, item) => acc + item.total, 0);
    const subtotal = isVatExempt ? grandTotal : (grandTotal / (1 + vatRate));
    const vatAmount = grandTotal - subtotal;
    return {
      subtotal,
      vatAmount,
      grandTotal
    };
  }, [currentItems, vatRate, isVatExempt]);

  // Export handlers
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    try {
      const element = document.getElementById('tax-invoice-canvas');
      if (!element) return;
      
      triggerToast('جاري إنشاء وتحميل ملف PDF الفاتورة...');
      
      const canvas = await html2canvasSafe(element, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: isThermalView ? [80, (canvas.height * 80) / canvas.width] : 'a4'
      });
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`laylah-invoice-${formattedInvoiceId}.pdf`);
      triggerToast('تم تحميل الفاتورة بصيغة PDF بنجاح!');
    } catch (err) {
      console.error('Error generating PDF', err);
      triggerToast('فشل في استخراج PDF. يرجى المحاولة لاحقاً.');
    }
  };

  const handleDownloadImage = async () => {
    try {
      const element = document.getElementById('tax-invoice-canvas');
      if (!element) return;
      
      triggerToast('جاري توليد الصورة الموحدة للمستند...');
      
      const canvas = await html2canvasSafe(element, { scale: 2, useCORS: true });
      const link = document.createElement('a');
      link.download = `laylah-invoice-${formattedInvoiceId}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      triggerToast('تم تحميل صورة الفاتورة بنجاح!');
    } catch (err) {
      console.error('Error generating Image', err);
      triggerToast('فشل استخراج الصورة.');
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const text = `فاتورة ضريبية مبسطة صادرة من منصة ليلة برقم: ${formattedInvoiceId} بمبلغ ${financialSummary.grandTotal.toFixed(2)} ر.س. للتحقق: ${shareUrl}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'الفاتورة الضريبية الموحدة - ليلة',
          text: text,
          url: shareUrl,
        });
        triggerToast('تمت مشاركة الفاتورة بنجاح!');
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      // Fallback copy to clipboard
      try {
        await navigator.clipboard.writeText(text);
        triggerToast('تم نسخ تفاصيل الفاتورة ورابط التحقق إلى الحافظة!');
      } catch (err) {
        triggerToast('ميزة المشاركة المباشرة غير مدعومة.');
      }
    }
  };

  return (
    <div className="w-full text-right" dir="rtl">
      {/* Toast Alert */}
      {showToast && (
        <div className="fixed bottom-6 left-6 z-[100] bg-slate-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 animate-in slide-in-from-bottom duration-300">
          <div className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping"></div>
          <span className="text-sm font-semibold font-sans">{toastMessage}</span>
        </div>
      )}

      {/* -------------------------------------------------------------
          PLAYGROUND CONTROLLER PANEL OR SECURE CLIENT TOOLBAR (Hidden in Print)
         ------------------------------------------------------------- */}
      {props.hideControlPanel ? (
        <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl border border-slate-800/80 print:hidden transition-all duration-300 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 text-amber-500 mb-1">
                <FileText className="w-5 h-5 animate-pulse" />
                <span className="text-xs font-black uppercase tracking-widest font-mono">Laylah Secure Invoice Client</span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 tracking-tight">
                الفاتورة الضريبية الموحدة لطلبكم
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                يمكنكم استعراض الفاتورة الضريبية الموحدة المتوافقة مع متطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) وطباعتها أو حفظها.
              </p>
            </div>

            {/* Print, Save PDF, Save Image, Share, and Thermal/A4 Toggle */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Select Format Toggle */}
              <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
                <button 
                  onClick={() => setIsThermalView(false)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${!isThermalView ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  طراز A4
                </button>
                <button 
                  onClick={() => setIsThermalView(true)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${isThermalView ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
                >
                  حراري 80mm
                </button>
              </div>

              <button 
                onClick={handlePrint} 
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl flex items-center gap-2 text-xs font-black transition-all shadow-lg active:scale-95"
              >
                <Printer className="w-4 h-4" /> طباعة الفاتورة 🖨️
              </button>
              <button 
                onClick={handleDownloadPdf} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border border-slate-700/60 active:scale-95"
              >
                <Download className="w-4 h-4" /> حفظ PDF
              </button>
              <button 
                onClick={handleDownloadImage} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border border-slate-700/60 active:scale-95"
              >
                <ImageIcon className="w-4 h-4" /> حفظ صورة
              </button>
              <button 
                onClick={handleShare} 
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border border-slate-700/60 active:scale-95"
              >
                <Share2 className="w-4 h-4" /> مشاركة الفاتورة
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-950 text-slate-100 rounded-3xl p-6 md:p-8 mb-8 shadow-2xl border border-slate-800/80 print:hidden transition-all duration-300 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 mb-6">
          <div>
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Sparkles className="w-5 h-5 animate-pulse" />
              <span className="text-xs font-black uppercase tracking-widest font-mono">Laylah Executive Components</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              لوحة التحكم التفاعلية بالفاتورة الضريبية
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              خصّص بيانات الفاتورة والحالة الضريبية ونوع الحجز لمشاهدة الاستجابة البصرية الذكية والتصميم المتكامل فورياً.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-mono border border-slate-700/60 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-500" /> Playground v1.2
            </span>
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 text-xs">
          
          {/* Col 1: Booking Type */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">نوع الحجز / الطلب</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setInvoiceType('hall')}
                className={`py-2 rounded-lg font-bold transition-all ${invoiceType === 'hall' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                قاعة / مرفق
              </button>
              <button 
                onClick={() => setInvoiceType('service')}
                className={`py-2 rounded-lg font-bold transition-all ${invoiceType === 'service' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
              >
                خدمة مساندة
              </button>
            </div>
          </div>

          {/* Col 2: Payment Status */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">حالة دفع الفاتورة</label>
            <select 
              value={paymentStatus}
              onChange={(e) => setPaymentStatus(e.target.value as any)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 font-bold focus:outline-none focus:border-amber-500"
            >
              <option value="paid">✅ مدفوعة (Paid)</option>
              <option value="pending">⏳ بانتظار الدفع (Pending)</option>
              <option value="cancelled">❌ ملغاة (Cancelled)</option>
            </select>
          </div>

          {/* Col 3: Tax Status */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">النظام الضريبي للمزود</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setIsVatExempt(false)}
                className={`py-2 rounded-lg font-bold transition-all ${!isVatExempt ? 'bg-slate-800 text-white border border-slate-700/60' : 'text-slate-400 hover:text-white'}`}
              >
                خاضع 15%
              </button>
              <button 
                onClick={() => setIsVatExempt(true)}
                className={`py-2 rounded-lg font-bold transition-all ${isVatExempt ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' : 'text-slate-400 hover:text-white'}`}
              >
                معفى نظاماً
              </button>
            </div>
          </div>

          {/* Col 4: Payment Method */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">طريقة الدفع المعتمدة</label>
            <select 
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 font-bold focus:outline-none focus:border-amber-500 font-sans"
            >
              <option value="التقسيم الفوري Split">⚡ تقسيم فوري (Split Payment)</option>
              <option value="تحويل بنكي مباشر">🏛️ تحويل بنكي مباشر (Wire Transfer)</option>
              <option value="بطاقة ائتمانية / مدى">💳 بطاقة ائتمانية / مدى (Credit Card)</option>
            </select>
          </div>

          {/* Col 5: Layout Format */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">شكل الفاتورة والطباعة</label>
            <div className="grid grid-cols-2 gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button 
                onClick={() => setIsThermalView(false)}
                className={`py-2 rounded-lg font-bold transition-all ${!isThermalView ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                طراز A4
              </button>
              <button 
                onClick={() => setIsThermalView(true)}
                className={`py-2 rounded-lg font-bold transition-all ${isThermalView ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                حراري 80mm
              </button>
            </div>
          </div>

        </div>

        {/* Secondary Inputs for Deep Testing */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-6 border-t border-slate-800/60 text-xs">
          {invoiceType === 'hall' ? (
            <div className="space-y-2">
              <label className="block text-slate-300 font-bold">تعديل لوجستيات الحجز: عدد الضيوف المدعوين</label>
              <div className="flex items-center gap-3">
                <input 
                  type="range" 
                  min="50" 
                  max="1000" 
                  step="10"
                  value={guestCount} 
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
                />
                <span className="font-mono bg-slate-800 px-3 py-1 rounded-lg text-amber-500 font-bold shrink-0">{guestCount} ضيف</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <label className="block text-slate-300 font-bold">اسم ونوع الخدمة المساندة المخصصة للطلب</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <select
                  onChange={(e) => {
                    if (e.target.value !== 'custom') {
                      setDirectOrderName(e.target.value);
                    }
                  }}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-sans font-medium text-xs w-full"
                  value={directOrderName}
                >
                  <option value="خدمة ضيافة واستقبال فاخرة (VIP Catering & Host)">ضيافة فاخرة (VIP Catering)</option>
                  <option value="زفات مخصصة وشعر وترحيب (Premium Zaffat)">زفات مخصصة وشعر (Zaffat)</option>
                  <option value="تصميم وتزيين كوشة وقاعة (Aesthetic Decoration & Design)">تصميم وتزيين (Design & Decor)</option>
                  <option value="استقبال وتنظيم وإدارة الحفل (Event Reception & Organization)">استقبال وتنظيم (Reception)</option>
                  <option value="custom">أخرى / كتابة يدوية...</option>
                </select>
                <input 
                  type="text" 
                  value={directOrderName}
                  onChange={(e) => setDirectOrderName(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-sans font-medium text-xs w-full"
                  placeholder="مثال: خدمة ضيافة، زفة، تصميم، استقبال..."
                />
              </div>
            </div>
          )}

          {/* Logo Size Control Column */}
          <div className="space-y-2">
            <label className="block text-slate-300 font-bold">تعديل حجم الشعار في الفاتورة الموحدة</label>
            <div className="flex items-center gap-3">
              <input 
                type="range" 
                id="logo-size-slider"
                min="61.81" 
                max="247.24" 
                step="0.01"
                value={logoWidth} 
                onChange={(e) => setLogoWidth(Number(e.target.value))}
                className="w-full accent-amber-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
              <span className="font-mono bg-slate-800 px-3 py-1 rounded-lg text-amber-500 font-bold shrink-0">
                {logoWidth.toFixed(2)} × {Number(logoWidth * 1.29428895).toFixed(2)} px
              </span>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center justify-end gap-3 self-end md:col-span-1">
            <button 
              onClick={handlePrint} 
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl flex items-center gap-2 text-xs font-black transition-all shadow-lg active:scale-95"
            >
              <Printer className="w-4 h-4" /> إصدار وطباعة الفاتورة 🖨️
            </button>
            <button 
              onClick={handleDownloadPdf} 
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border border-slate-700/60 active:scale-95"
            >
              <Download className="w-4 h-4" /> حفظ PDF
            </button>
            <button 
              onClick={handleDownloadImage} 
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border border-slate-700/60 active:scale-95"
            >
              <ImageIcon className="w-4 h-4" /> حفظ صورة
            </button>
            <button 
              onClick={handleShare} 
              className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl flex items-center gap-2 text-xs font-bold transition-all border border-slate-700/60 active:scale-95"
            >
              <Share2 className="w-4 h-4" /> مشاركة الفاتورة
            </button>
          </div>
        </div>

        {/* Parties and Taxes detailed editor */}
        <div className="mt-6 pt-6 border-t border-slate-800/60 text-xs">
          <button 
            onClick={() => setShowPartiesEditor(!showPartiesEditor)}
            className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-2 transition-colors mb-2"
          >
            <Sliders className="w-4 h-4 text-amber-500" />
            <span>{showPartiesEditor ? 'إخفاء محرر بيانات الأطراف والضرائب التفصيلي 🔼' : 'عرض وتعديل بيانات الأطراف والضرائب تفصيلياً 🔽'}</span>
          </button>

          {showPartiesEditor && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-900/40 p-5 rounded-2xl border border-slate-800/80 mt-4 animate-in fade-in duration-300">
              
              {/* Provider Editor Column */}
              <div className="space-y-3">
                <h4 className="text-white font-bold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-amber-500" /> بيانات مزود الخدمة (المُصدّر)
                </h4>
                <div className="space-y-2">
                  <label className="block text-slate-400">اسم المزود أو القاعة</label>
                  <input 
                    type="text" 
                    value={providerName} 
                    onChange={(e) => setProviderName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400">المدينة / المنطقة</label>
                  <input 
                    type="text" 
                    value={providerAddress} 
                    onChange={(e) => setProviderAddress(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400">الرقم الضريبي المستقل لمزود الخدمة</label>
                  <input 
                    type="text" 
                    value={providerVatNo} 
                    onChange={(e) => setProviderVatNo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Customer Editor Column */}
              <div className="space-y-3">
                <h4 className="text-white font-bold border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5 text-amber-500" /> بيانات العميل (المُفوتر إليه)
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">اسم العميل</label>
                    <input 
                      type="text" 
                      value={customerName} 
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">رقم الهاتف الجوال</label>
                    <input 
                      type="text" 
                      value={customerPhone} 
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400">البريد الإلكتروني المربوط بالحجز</label>
                  <input 
                    type="email" 
                    value={customerEmail} 
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">المنطقة / العنوان العام</label>
                    <input 
                      type="text" 
                      value={customerRegion} 
                      onChange={(e) => setCustomerRegion(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-slate-400 text-[10px]">الرقم الضريبي (إن وجد)</label>
                    <input 
                      type="text" 
                      value={customerVatNo} 
                      onChange={(e) => setCustomerVatNo(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-mono"
                      placeholder="مثال: 310000000000003"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="block text-slate-400">العنوان التفصيلي</label>
                  <input 
                    type="text" 
                    value={customerAddressDetail} 
                    onChange={(e) => setCustomerAddressDetail(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-amber-500 font-sans"
                  />
                </div>
              </div>

            </div>
          )}
        </div>
      </div>
      )}

      {/* -------------------------------------------------------------
          MAIN TAX INVOICE DOCUMENT CANVAS
         ------------------------------------------------------------- */}
      <div 
        id="tax-invoice-canvas"
        className={`bg-white mx-auto text-slate-900 select-none shadow-xl border border-slate-200/80 transition-all duration-300 relative 
          ${isThermalView 
            ? 'w-[80mm] min-w-[80mm] p-4 text-xs font-sans text-black border-t-8 border-slate-900 leading-relaxed' 
            : 'w-full max-w-4xl p-8 md:p-14 border-t-[14px] border-slate-950 rounded-3xl'
          }
        `}
      >
        {/* Printable/Silent CSS overrides injected dynamically */}
        <style dangerouslySetInnerHTML={{__html: `
          #tax-invoice-canvas, #tax-invoice-canvas * {
            letter-spacing: normal !important;
            word-spacing: normal !important;
          }
          @media print {
            body {
              background: white !important;
              color: black !important;
              visibility: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            .print\\:hidden {
              display: none !important;
            }
            #tax-invoice-canvas {
              visibility: visible !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-w: 100% !important;
              margin: 0 !important;
              padding: 20px !important;
              border: none !important;
              box-shadow: none !important;
            }
            #tax-invoice-canvas * {
              visibility: visible !important;
            }
          }
        `}} />

        {/* ----------------- HEADER SECTION ----------------- */}
        <div className={`border-b border-slate-100 pb-6 mb-8 flex flex-col ${isThermalView ? 'items-center text-center gap-4' : 'md:flex-row md:items-start justify-between'} gap-6`}>
          
          {/* Right Side: Issuer (Platform) Corporate Details */}
          <div className={`${isThermalView ? 'w-full flex flex-col items-center' : 'w-full md:w-[35%]'} text-right`}>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight">
              {props.platformData?.siteNameArabic || 'ليلة للخدمات والفعاليات'}
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 font-mono">
              {props.platformData?.siteNameEnglish || 'LAYLAH FOR EVENT SERVICES'}
            </p>
            
            <div className="mt-3 space-y-1 text-xs text-slate-500 font-sans">
              <p className="flex items-center justify-center md:justify-start gap-1.5">
                <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                <span>{props.platformData?.address || 'المملكة العربية السعودية، الرياض، طريق الملك فهد'}</span>
              </p>
              <p className="flex items-center justify-center md:justify-start gap-1.5">
                <Hash className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-700">السجل التجاري:</span> 
                <span className="font-mono">{props.platformData?.crNumber || '1010672945'}</span>
              </p>
              <p className="flex items-center justify-center md:justify-start gap-1.5">
                <ShieldCheck className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-bold text-slate-700">الرقم الضريبي الموحد للمنصة:</span> 
                <span className="font-mono text-slate-850">{props.platformData?.taxNumber || '310459827300003'}</span>
              </p>
              <p className="flex items-center justify-center md:justify-start gap-1.5">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span>الهاتف:</span> 
                <span className="font-mono">{props.platformData?.phones || '920000000'}</span>
              </p>
            </div>
          </div>

          {/* Center: Brand Signature Identity (Logo) */}
          <div className={`${isThermalView ? 'order-first' : 'w-full md:w-[25%] flex flex-col items-center justify-center'} self-center`}>
            {props.platformData?.logoUrl ? (
              <img 
                src={props.platformData.logoUrl} 
                alt="Logo" 
                className={`${isThermalView ? 'h-14' : ''} object-contain`} 
                style={isThermalView ? {} : (props.fixedLogoSize ? { width: '124px', height: '160px' } : { width: `${logoWidth}px`, height: `${logoWidth * 1.29428895}px` })}
              />
            ) : (
              <div 
                className="flex flex-col items-center transition-transform duration-200"
                style={isThermalView ? {} : (props.fixedLogoSize ? { transform: 'scale(1.0)', transformOrigin: 'center' } : { transform: `scale(${logoWidth / 123.62})`, transformOrigin: 'center' })}
              >
                <div className="w-16 h-16 bg-slate-900 text-amber-500 rounded-2xl flex items-center justify-center font-black text-2xl shadow-md border border-slate-800">
                  ل
                </div>
                <span className="text-xl font-black text-slate-900 tracking-tighter mt-2 font-sans">
                  ليلة <span className="text-amber-500">Laylah</span>
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
                  Premium Events
                </span>
              </div>
            )}
          </div>

          {/* Left Side: Invoice Metas & Title */}
          <div className={`${isThermalView ? 'w-full flex flex-col items-center' : 'w-full md:w-[35%] text-left'} flex flex-col`}>
            <div className={`${isThermalView ? 'text-center' : 'text-left md:items-end'} flex flex-col gap-0.5`}>
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight flex items-center justify-center md:justify-end gap-1">
                فاتورة ضريبية موحدة
              </h1>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest font-mono">
                Unified Tax Invoice
              </p>
            </div>

            <div className="mt-4 space-y-1.5 text-xs text-slate-500 font-sans">
              <div className={`flex justify-between ${isThermalView ? 'w-full px-2' : 'md:justify-end'} gap-3`}>
                <span className="text-slate-400 font-bold">رقم الفاتورة:</span>
                <span className="font-bold text-slate-800 font-mono tracking-tight">{formattedInvoiceId}</span>
              </div>
              <div className={`flex justify-between ${isThermalView ? 'w-full px-2' : 'md:justify-end'} gap-3`}>
                <span className="text-slate-400 font-bold">تاريخ الإصدار:</span>
                <span className="font-bold text-slate-800 font-mono">{props.issueDate || '2026-06-25'}</span>
              </div>
              <div className={`flex justify-between ${isThermalView ? 'w-full px-2' : 'md:justify-end'} gap-3`}>
                <span className="text-slate-400 font-bold">التاريخ الهجري:</span>
                <span className="font-bold text-slate-800 font-sans">{hijriDate}</span>
              </div>
              <div className={`flex justify-between ${isThermalView ? 'w-full px-2' : 'md:justify-end'} gap-3`}>
                <span className="text-slate-400 font-bold">
                  {invoiceType === 'hall' ? 'رقم حجز القاعة المرجعي:' : 'رقم طلب الخدمة المرجعي:'}
                </span>
                <span className="font-bold text-slate-800 font-mono text-[11px]">{formattedBookingOrServiceId}</span>
              </div>
            </div>

            {/* Paid Badge status */}
            <div className={`mt-4 flex ${isThermalView ? 'justify-center' : 'md:justify-end'}`}>
              <span className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold border transition-all duration-300
                ${paymentStatus === 'paid' 
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-700' 
                  : paymentStatus === 'pending' 
                    ? 'border-amber-200 bg-amber-50 text-amber-700 animate-pulse' 
                    : 'border-red-200 bg-red-50 text-red-700'
                }
              `}>
                <span className={`w-1.5 h-1.5 rounded-full ${paymentStatus === 'paid' ? 'bg-emerald-500' : paymentStatus === 'pending' ? 'bg-amber-500' : 'bg-red-500'}`}></span>
                {paymentStatus === 'paid' ? 'مدفوعة بالكامل' : paymentStatus === 'pending' ? 'بانتظار الدفع' : 'ملغاة'}
              </span>
            </div>
          </div>

        </div>

        {/* ----------------- TRANSACTION PARTIES SECTION ----------------- */}
        <div className="mb-8">
          <div className="border border-slate-150 rounded-2xl overflow-hidden shadow-sm bg-white grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100">
            
            {/* The Provider (المُصدّر) */}
            <div className="p-6 bg-slate-50/40">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-slate-900/10 flex items-center justify-center">
                  <Building className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">بيانات جهة التعاقد والمصدر (Provider)</h3>
              </div>
              
              <p className="font-black text-slate-800 text-base leading-tight mb-1">
                {providerName}
              </p>
              <p className="text-slate-500 text-xs">
                {providerAddress}
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400">الرقم الضريبي المستقل لمزود الخدمة:</span>
                  <span className="font-mono font-bold text-slate-800">
                    {providerVatNo || '300582910400003'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المدينة / المنطقة:</span>
                  <span className="text-slate-600 font-bold">{providerAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">التوثيق القانوني:</span>
                  <span className="text-slate-600 font-bold">مصدّر معتمد إلكترونياً</span>
                </div>
              </div>
            </div>

            {/* The Customer (المُفوتر إليه) */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-lg bg-slate-900/10 flex items-center justify-center">
                  <Mail className="w-3.5 h-3.5 text-slate-700" />
                </div>
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-wider">بيانات العميل (المُفوتر إليه - Customer)</h3>
              </div>

              <p className="font-black text-slate-800 text-base leading-tight mb-1">
                {customerName}
              </p>
              <p className="text-slate-500 text-xs flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                <span className="font-mono">{customerPhone}</span>
              </p>
              
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-1.5 text-xs text-slate-500 font-sans">
                <div className="flex justify-between">
                  <span className="text-slate-400">البريد الإلكتروني المربوط بالحجز:</span>
                  <span className="font-mono text-slate-700">{customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المنطقة / العنوان العام:</span>
                  <span className="text-slate-700 font-bold">{customerRegion}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">العنوان التفصيلي:</span>
                  <span className="text-slate-700 font-medium">{customerAddressDetail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الرقم الضريبي (إن وجد):</span>
                  <span className="font-mono text-slate-700 font-bold">{customerVatNo || 'غير مسجل ضريبياً'}</span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ----------------- DYNAMIC LOGISTICAL OVERVIEW ----------------- */}
        <div className="mb-8">
          {invoiceType === 'hall' ? (
            /* Hall reservation details bar */
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Calendar className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider">تفاصيل حجز القاعة والخدمات اللوجستية</h3>
              </div>

              <div className={`grid ${isThermalView ? 'grid-cols-2 gap-4' : 'grid-cols-2 md:grid-cols-5 gap-6'} text-xs font-sans`}>
                <div>
                  <p className="text-slate-400 font-bold text-[10px] mb-1">رقم الحجز الموحد</p>
                  <p className="font-mono font-bold text-white text-sm">{formattedBookingOrServiceId}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[10px] mb-1">تاريخ المناسبة (الدخول)</p>
                  <p className="font-mono font-bold text-white text-sm">{props.checkInDate || '2026-06-25'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[10px] mb-1">موعد المغادرة (الخروج)</p>
                  <p className="font-mono font-bold text-white text-sm">{props.checkOutDate || '2026-06-26'}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[10px] mb-1">مدة الحجز الفعلي</p>
                  <p className="font-bold text-white text-sm">{props.duration || 'يوم كامل (24 ساعة)'}</p>
                </div>
                <div className={isThermalView ? 'col-span-2' : ''}>
                  <p className="text-slate-400 font-bold text-[10px] mb-1">عدد الضيوف والمدعوين</p>
                  <p className="font-mono font-bold text-amber-400 text-sm flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{guestCount} ضيف</span>
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Support service direct request details bar */
            <div className="bg-slate-900 text-slate-100 rounded-2xl p-5 shadow-sm border border-slate-800 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-xl pointer-events-none"></div>

              <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-black text-amber-500 uppercase tracking-wider">تفاصيل طلب الخدمة المساندة المباشرة</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                <div>
                  <p className="text-slate-400 font-bold text-[10px] mb-1">رقم طلب الخدمة الموحد</p>
                  <p className="font-mono font-bold text-amber-400 text-sm">{formattedBookingOrServiceId}</p>
                </div>
                <div>
                  <p className="text-slate-400 font-bold text-[10px] mb-1">اسم وتصنيف الخدمة المساندة</p>
                  <p className="font-bold text-white text-sm">{directOrderName}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ----------------- ITEMIZED FINANCIAL TABLE ----------------- */}
        <div className="mb-8 border border-slate-150 rounded-2xl overflow-hidden shadow-sm bg-white">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-150 text-slate-700 text-xs font-bold font-sans">
                <th className="py-4 px-5 text-right font-black">الوصف والبيان للخدمة / Item & Description</th>
                <th className="py-4 px-4 text-center font-black w-24">الكمية / Qty</th>
                <th className="py-4 px-4 text-center font-black w-32">السعر الإفرادي / Unit Price</th>
                <th className="py-4 px-5 text-left font-black w-36">الإجمالي الفرعي / Line Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-800">
              {currentItems.map((item, index) => (
                <tr key={index} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-5">
                    <p className="font-bold text-slate-900 font-sans">{item.name}</p>
                    <p className="text-[10px] text-slate-400 mt-1 font-mono uppercase tracking-wider">
                      ITEM-{index + 101} | SYSTEM RECORDED
                    </p>
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-bold text-slate-700">
                    {item.quantity}
                  </td>
                  <td className="py-4 px-4 text-center font-mono font-semibold text-slate-600">
                    {item.price.toFixed(2)} ر.س
                  </td>
                  <td className="py-4 px-5 text-left font-mono font-bold text-slate-900">
                    {item.total.toFixed(2)} ر.س
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ----------------- FINANCIAL SUMMARY & ZATCA QR ----------------- */}
        <div className="mb-8 bg-slate-50/70 border border-slate-150 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          
          {/* ZATCA Compliant QR Verification */}
          <div className={`${isThermalView ? 'w-full flex flex-col items-center' : 'w-full md:w-1/3 flex flex-col items-center md:items-start'} shrink-0`}>
            <div className="p-3 bg-white border border-slate-150 rounded-2xl shadow-sm flex flex-col items-center">
              <QRCodeSVG 
                value={`https://laylah.com/verify/invoice/${props.bookingId || 'bk-demo-9938'}`} 
                size={isThermalView ? 110 : 130}
                level="H"
                includeMargin={false}
              />
              <span className="text-[9px] text-slate-400 font-mono font-bold mt-2 tracking-tight uppercase">
                ZATCA TLV COMPLIANT QR
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2 text-center md:text-right leading-snug font-sans font-medium">
              تحقق ضريبي مشفر (ZATCA TLV) مدمج تلقائياً لحماية ومصداقية الفواتير.
            </p>
          </div>

          {/* Subtotal & Totals breakdown */}
          <div className="w-full md:w-1/2 space-y-3 font-sans text-xs">
            <div className="flex justify-between text-slate-600 px-2">
              <span>الإجمالي الفرعي (بدون الضريبة) <span className="text-[10px] text-slate-400 uppercase font-mono">Subtotal</span></span>
              <span className="font-mono font-bold text-slate-900">{financialSummary.subtotal.toFixed(2)} ر.س</span>
            </div>
            
            <div className="flex justify-between text-slate-600 px-2 items-center">
              <span>
                ضريبة القيمة المضافة ({isVatExempt ? '0%' : '15%'}) 
                <span className="text-[10px] text-slate-400 uppercase font-mono mr-1">VAT</span>
              </span>
              <span className="font-mono font-bold text-slate-900">{financialSummary.vatAmount.toFixed(2)} ر.س</span>
            </div>

            {/* VAT Exempt Orange Notice (استثناء ضريبي ذكي) */}
            {isVatExempt && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-[11px] text-amber-800 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">معفى لعدم انطباق نظام ضريبة القيمة المضافة</p>
                  <p className="text-[10px] text-amber-700 mt-0.5 leading-relaxed">
                    هذا المزود مسجل كمؤسسة معفاة رسمياً لعدم بلوغ الحد الإلزامي لتطبيق الضريبة بموجب لوائح هيئة الزكاة والضريبة والجمارك.
                  </p>
                </div>
              </div>
            )}

            <div className="border-t border-slate-900/10 pt-3 mt-3">
              <div className="flex justify-between items-baseline px-2">
                <span className="font-black text-slate-900 text-sm">
                  الإجمالي النهائي المشمول <span className="text-[10px] text-slate-400 uppercase font-mono block">Grand Total</span>
                </span>
                <div className="text-left">
                  <span className="text-2xl text-slate-950 font-black font-mono tracking-tighter block">
                    {financialSummary.grandTotal.toFixed(2)} ر.س
                  </span>
                  <span className="text-[10px] text-slate-400 block font-sans">
                    {isVatExempt ? 'صافي القيمة المستحقة' : 'شامل ضريبة القيمة المضافة 15%'}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* ----------------- PAYMENT & FOOTER LEGAL POLICY SECTION ----------------- */}
        <div className="border-t border-slate-100 pt-6 mt-8 font-sans">
          
          <div className={`grid grid-cols-1 ${isThermalView ? 'gap-4' : 'md:grid-cols-3 gap-6'} text-xs text-slate-500 pb-6 border-b border-slate-100`}>
            <div>
              <p className="font-black text-slate-800 mb-1">طريقة وسداد الدفع</p>
              <p className="font-semibold text-slate-600 flex items-center gap-1 bg-slate-100 px-3 py-1.5 rounded-lg w-fit">
                <CreditCard className="w-3.5 h-3.5 text-slate-500" />
                <span>{paymentMethod}</span>
              </p>
            </div>
            <div>
              <p className="font-black text-slate-800 mb-1">تاريخ ووقت طباعة الفاتورة</p>
              <p className="font-mono text-slate-600">
                {printDateTime || '2026-06-25 01:55:54'}
              </p>
            </div>
            <div>
              <p className="font-black text-slate-800 mb-1">جهة الإشراف الضامنة</p>
              <p className="font-bold text-amber-600 flex items-center gap-1">
                <span>🛡️ منصة ليلة للوساطة والضمان</span>
              </p>
            </div>
          </div>

          {/* Cancellation Policy Disclaimer (حاشية قانونية لسياسة الإلغاء والتعديل) */}
          <div className="mt-6">
            <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>سياسة الإلغاء والتعديل وفترات السداد الإلزامية</span>
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
              تخضع الحجوزات المسجلة عبر منصة ليلة لضوابط تنظيمية صارمة. يرجى العلم بأن جميع الحجوزات 
              <span className="font-black text-slate-800"> غير قابلة للاسترداد أو التعديل </span>
              في حال تم إلغاؤها خلال فترة تقل عن <span className="font-bold text-slate-800 font-mono">72 ساعة</span> من وقت بدء المناسبة المحجوزة. يعود ذلك للالتزام والتعاقد الفوري مع مزودي الخدمات، تكاليف التجهيز اللوجستي المسبق، وتأمين المواد التشغيلية وحجز تواريخ القاعات بما يحول دون إعادة جدولة الخدمة. نقدّر تفهمكم لضمان استمرارية الجودة وحماية حقوق والتزامات الأطراف كافة.
            </p>
          </div>

          {/* Thank you Note */}
          <div className="text-center mt-10 pt-4">
            <p className="text-base font-black text-slate-800 tracking-tight">
              شكراً لثقتكم واختياركم منصة ليلة!
            </p>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mt-0.5">
              THANK YOU FOR PARTNERING WITH LAYLAH
            </p>
          </div>

        </div>

      </div>

      {/* Post-Booking / Complementary Services Ad Banner */}
      <div className="print:hidden mt-8 max-w-4xl mx-auto w-full">
        <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent p-4 rounded-2xl border border-amber-200 mb-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-bold text-lg shadow-sm">
              🎁
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">خدمات وعروض مقترحة لمناسبتك القادمة</h4>
              <p className="text-xs text-slate-500">استكمل متطلبات مناسبتك مع شركائنا المعتمدين بأسعار تفضيلية لعملاء ليلة</p>
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-3 py-1 rounded-full">
            عروض حصرية
          </span>
        </div>
        <AdBanner placement="أسفل الفاتورة وتأكيد الحجز" layout="card" className="w-full" />
      </div>
    </div>
  );
}
