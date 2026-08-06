import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Lock, Download, FileSpreadsheet, FileDown, 
  Printer, Eye, Pencil, Trash2, FilterX, FileText, CheckCircle2, XCircle, Clock,
  Table, LayoutGrid, Activity, Layers, ShieldCheck, Sparkles, RefreshCw
} from 'lucide-react';
import { AdminCalendar } from './AdminCalendar';
import { BookingOperationsManager } from './BookingOperationsManager';
import { formatSmartDate, getFullDateInfo } from '../utils/dateUtils';
import { convertDigits } from '../utils/digitConverter';
import { formatBookingId, formatServiceRequestId } from '../utils/idUtils';

interface BookingsManagementProps {
  userRole: string;
  isAdminUser: boolean;
  currentUser: any;
  currentProviderName: string;
  currentUserName: string;
  providerSubscription: any;
  bookings: any[];
  setBookings: (bookings: any[]) => void;
  halls: any[];
  services: any[];
  providers: any[];
  supportServiceRequests: any[];
  enableForceMajeureProtocol: boolean;
  forceMajeureWindowDays: number;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  updateSupportRequestStatus: (id: number, newStatus: string) => void;

  // Modals / global action trigger props:
  setInvoiceBookingToPrint: (bookingOrRequest: any) => void;
  setViewingBooking: (booking: any) => void;
  setIsBookingViewModalOpen: (isOpen: boolean) => void;
  setEditingItem: (item: any) => void;
  setBookingForm: (form: any) => void;
  setIsBookingModalOpen: (isOpen: boolean) => void;
  setSupportRequestForm: (form: any) => void;
  setIsSupportRequestModalOpen: (isOpen: boolean) => void;
  setViewingSupportRequest: (request: any) => void;
  setIsSupportRequestViewModalOpen: (isOpen: boolean) => void;
  setDeleteData: (deleteData: { id: number; type: string; name: string }) => void;
  setSelectedBookingForForceMajeure: (booking: any) => void;
  setForceMajeureReason: (reason: string) => void;
  setForceMajeureDocuments: (docs: any[]) => void;
  setIsForceMajeureModalOpen: (isOpen: boolean) => void;
}

const formatCurrency = (amount: number) => {
  return convertDigits((amount || 0).toLocaleString('en-US') + ' ر.س');
};

const renderPriceWithTax = (amount: number, isVatEnabled: boolean, className: string = "font-bold text-slate-800") => {
  return (
    <div className="flex flex-col items-start leading-tight">
      <span className={className}>{formatCurrency(amount)}</span>
      <span className={`text-[9px] font-bold ${isVatEnabled ? 'text-emerald-600' : 'text-amber-600'}`}>
        {isVatEnabled ? 'شامل الضريبة' : 'لا يوجد ضريبة (معفى)'}
      </span>
    </div>
  );
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'مؤكد': case 'مدفوع': case 'نشط': case 'مفعل': return 'bg-green-100 text-green-700 border-green-200';
    case 'انتظار': case 'جزئي': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'ملغي': case 'غير مدفوع': case 'متوقف': case 'موقوف': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

const renderBookingStatusBadge = (b: any) => {
  let label = '';
  let colorClass = '';
  let IconComponent = Clock;

  if (b.status === 'مؤكد') {
    label = 'مؤكد';
    colorClass = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50';
    IconComponent = CheckCircle2;
  } else if (b.status === 'ملغي' || b.paymentStatus === 'مسترجع') {
    label = 'ملغي';
    colorClass = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/30 dark:text-rose-400 dark:border-rose-800/50';
    IconComponent = XCircle;
  } else {
    label = 'بانتظار الدفع';
    colorClass = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800/50';
    IconComponent = Clock;
  }

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border leading-none shrink-0 select-none align-middle transform hover:scale-105 transition-all duration-200 shadow-sm bg-opacity-70 dark:bg-opacity-20 border-opacity-50 text-right" dir="rtl" style={{ contentVisibility: 'auto' }}>
      <IconComponent className="w-3 h-3 shrink-0" />
      <span>{label}</span>
    </span>
  );
};

export const BookingsManagement: React.FC<BookingsManagementProps> = ({
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
  setIsForceMajeureModalOpen
}) => {
  // Localized UI state variables
  const [bookingActiveTab, setBookingActiveTab] = useState<'bookings' | 'supportRequests'>('bookings');
  const [bookingsViewMode, setBookingsViewMode] = useState<'table' | 'grid'>(() => {
    return (localStorage.getItem('pref_bookings_view_mode') as 'table' | 'grid') || 'table';
  });
  const [bookingSearchQuery, setBookingSearchQuery] = useState('');
  const [bookingFilterStatus, setBookingFilterStatus] = useState('');
  const [bookingFilterPaymentStatus, setBookingFilterPaymentStatus] = useState('');
  const [bookingFilterDateFrom, setBookingFilterDateFrom] = useState('');
  const [bookingFilterDateTo, setBookingFilterDateTo] = useState('');
  const [bookingSortBy, setBookingSortBy] = useState('newest');
  const [supportServiceSearchQuery, setSupportServiceSearchQuery] = useState('');
  const [supportServiceFilterStatus, setSupportServiceFilterStatus] = useState('');
  const [showAdminCalendar, setShowAdminCalendar] = useState(false);
  const [selectedBookingForOperations, setSelectedBookingForOperations] = useState<any>(null);

  const isProviderTab = userRole === 'provider';
  const canExport = isAdminUser || providerSubscription?.canExportFinancials || providerSubscription?.addons?.includes('invoice_export');

  const isEligibleForForceMajeureButton = (booking: any) => {
    if (!enableForceMajeureProtocol) return false;
    if (['ملغي', 'ملغية', 'مسترجع'].includes(booking.status)) return false;
    const dateStr = booking.startDate || booking.date;
    if (!dateStr) return false;
    try {
      const bDate = new Date(dateStr);
      if (isNaN(bDate.getTime())) return false;
      const today = new Date();
      bDate.setHours(0, 0, 0, 0);
      today.setHours(0, 0, 0, 0);
      const diffTime = bDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= forceMajeureWindowDays;
    } catch (err) {
      return false;
    }
  };

  const exportBookingsToCSV = (onlyFiltered: boolean) => {
    if (!canExport) {
      alert('عذراً! ميزة تصدير الحجوزات بصيغة CSV غير مفعلة في باقتك الحالية. يرجى تفعيل "ميزة استعراض وتصدير الفواتير" من تبويب الباقات والميزات لتفعيلها.');
      return;
    }
    
    const targetBookings = onlyFiltered ? filteredBookings : (isProviderTab ? bookings.filter((b: any) => {
      const myItemNames = [...halls, ...services].filter(item => item.provider === currentProviderName).map(item => item.name);
      return myItemNames.includes(b.hall);
    }) : bookings);

    if (targetBookings.length === 0) {
      showNotification('info', 'لا توجد حجوزات لتصديرها');
      return;
    }

    const headers = [
      'رقم الحجز',
      'العميل',
      'رقم الجوال',
      'القاعة أو المنشأة',
      'الفترة',
      'تاريخ الحجز',
      'حالة الحجز',
      'حالة الدفع',
      'عدد الحضور',
      'الخدمات الإضافية',
      'القيمة الأساسية الحسابية (SAR)',
      'قيمة ضريبة القيمة المضافة 15% (SAR)',
      'الإجمالي شامل الضريبة (SAR)',
      'الملاحظات'
    ];

    const formatDateToDDMMYYYY = (dateVal: any): string => {
      if (!dateVal) return '-';
      try {
        const str = String(dateVal).trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
          return str;
        }
        const partsSlash = str.split('/');
        if (partsSlash.length === 3) {
          let [d, m, y] = partsSlash;
          d = d.padStart(2, '0');
          m = m.padStart(2, '0');
          if (y.length === 2) {
            y = '20' + y;
          }
          return `${d}/${m}/${y}`;
        }
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return str;
      } catch (e) {
        return String(dateVal);
      }
    };

    const cleanCSVField = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val).trim();
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = targetBookings.map((b: any) => {
      const totalAmount = b.amount || 0;
      const bPrice = b.basePrice || (totalAmount / 1.15);
      const vatVal = totalAmount - bPrice;
      
      return [
        formatBookingId(b.id),
        b.customer || '-',
        convertDigits(b.phone || '-'),
        b.hall || '-',
        b.period || '-',
        convertDigits(formatDateToDDMMYYYY(b.startDate || b.date)),
        b.status || '-',
        b.paymentStatus || '-',
        convertDigits(b.guests || 0),
        b.extraServices || 'لا يوجد',
        convertDigits(bPrice.toFixed(2)),
        convertDigits(vatVal.toFixed(2)),
        convertDigits(totalAmount.toFixed(2)),
        b.notes || '-'
      ].map(cleanCSVField);
    });

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تصدير_كشف_الحجوزات_${onlyFiltered ? 'محدد_بناء_على_حالة' : 'الكامل'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('success', 'تم تصدير كشف الحجوزات بنجاح بصيغة CSV منظم متوافق تماماً مع Excel!');
  };

  const exportBookingsToPDF = async (onlyFiltered: boolean) => {
     if (!canExport) {
       alert('عذراً! ميزة تصدير الحجوزات بصيغة PDF غير مفعلة في باقتك الحالية. يرجى تفعيل "ميزة استعراض وتصدير الفواتير" من تبويب الباقات والميزات لتفعيلها.');
       return;
     }

     showNotification('info', 'جاري التواصل مع الخادم لتوليد التقرير المالي الشامل للحجوزات بصيغة PDF المعتمدة...');

     try {
       const response = await fetch('/api/finance/generate-pdf', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({
           reportType: 'booking',
           userEmail: currentUser?.email || '',
           userRole: userRole,
           canExport: canExport
         })
       });

       const data = await response.json();
       if (response.ok && data.success) {
         const link = document.createElement('a');
         link.href = data.pdfDataUri;
         link.download = data.filename;
         document.body.appendChild(link);
         link.click();
         document.body.removeChild(link);
         showNotification('success', 'تم ترحيل وتجهيز تقرير كشف الحجوزات بصيغة PDF المعتمدة من الخادم بنجاح المالي!');
       } else {
         alert(data.error || 'عذراً! فشل جلب وصدور تقرير الـ PDF من الخادم، يرجى التحقق من اشتراكك.');
       }
     } catch (err: any) {
       console.error(err);
       showNotification('error', 'خطأ أثناء الاتصال بالخادم لإصدار ملف الـ PDF: ' + err.message);
     }
  };

  const exportSupportRequestsToCSV = (onlyFiltered: boolean) => {
    if (!canExport) {
      alert('عذراً! ميزة تصدير طلبات الخدمات المساندة بصيغة CSV غير مفعلة في باقتك الحالية. يرجى تفعيل "ميزة استعراض وتصفية العمليات" من تبويب الباقات والميزات لتفعيلها.');
      return;
    }
    
    const targetRequests = onlyFiltered ? filteredRequests : (userRole === 'provider' ? supportServiceRequests.filter(r => r.providerName === currentProviderName) : supportServiceRequests);

    if (targetRequests.length === 0) {
      showNotification('info', 'لا توجد طلبات خدمات لتصديرها');
      return;
    }

    const headers = [
      'رقم الطلب',
      'رقم الحجز المرتبط',
      'اسم العميل',
      'اسم الخدمة',
      'تاريخ الطلب',
      'حالة الطلب',
      'مزود الخدمة',
      'القيمة الأساسية الحسابية (SAR)',
      'قيمة ضريبة القيمة المضافة 15% (SAR)',
      'الإجمالي المالي (SAR)'
    ];

    const formatDateToDDMMYYYY = (dateVal: any): string => {
      if (!dateVal) return '-';
      try {
        const str = String(dateVal).trim();
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) {
          return str;
        }
        const partsSlash = str.split('/');
        if (partsSlash.length === 3) {
          let [d, m, y] = partsSlash;
          d = d.padStart(2, '0');
          m = m.padStart(2, '0');
          if (y.length === 2) {
            y = '20' + y;
          }
          return `${d}/${m}/${y}`;
        }
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return str;
      } catch (e) {
        return String(dateVal);
      }
    };

    const cleanCSVField = (val: any) => {
      if (val === null || val === undefined) return '';
      let str = String(val).trim();
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    };

    const rows = targetRequests.map((r: any) => {
      const totalAmount = r.price || 0;
      const bPrice = totalAmount / 1.15;
      const vatVal = totalAmount - bPrice;

      return [
        formatServiceRequestId(r.id),
        r.bookingId && r.bookingId !== '-' && String(r.bookingId) !== '0' ? formatBookingId(r.bookingId) : 'طلب مستقل',
        r.customerName || '-',
        r.serviceName || '-',
        formatDateToDDMMYYYY(r.date),
        r.status || '-',
        r.providerName || '-',
        bPrice.toFixed(2),
        vatVal.toFixed(2),
        totalAmount.toFixed(2)
      ].map(cleanCSVField);
    });

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `تصدير_طلبات_الخدمات_${onlyFiltered ? 'محدد_بناء_على_حالة' : 'الكامل'}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showNotification('success', 'تم تصدير كشف طلبات الخدمات المساندة بنجاح بصيغة CSV منظم متوافق تماماً مع Excel!');
  };

  const exportSupportRequestsToPDF = async (onlyFiltered: boolean) => {
    if (!canExport) {
      alert('عذراً! ميزة تصدير طلبات الخدمات المساندة بصيغة PDF غير مفعلة في باقتك الحالية. يرجى تفعيل "ميزة استعراض وتصدير الفواتير" من تبويب الباقات والميزات لتفعيلها.');
      return;
    }

    showNotification('info', 'جاري معالجة وتوليد التقرير المالي المعتمد بصيغة PDF من خادم نظام ليلة التشغيلي...');

    try {
      const response = await fetch('/api/finance/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportType: 'finance',
          userEmail: currentUser?.email || '',
          userRole: userRole,
          canExport: canExport
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        const link = document.createElement('a');
        link.href = data.pdfDataUri;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        showNotification('success', 'تم تنزيل وحفظ التقرير المالي العام بصيغة PDF الرسمية المعتمدة بنجاح!');
      } else {
        alert(data.error || 'عذراً! فشل جلب وصدور تقرير الـ PDF من الخادم، يرجى التحقق من اشتراكك.');
      }
    } catch (err: any) {
      console.error(err);
      showNotification('error', 'عطل أثناء طلب التقرير المالي من الخادم: ' + err.message);
    }
  };

  // Filter bookings based on role and provider name
  const filteredBookings = bookings.filter((b: any) => {
    if (isProviderTab) {
      const myItemNames = [...halls, ...services].filter(item => item.provider === currentProviderName).map(item => item.name);
      if (!myItemNames.includes(b.hall)) return false;
    }
    const matchSearch = (b.customer || '').includes(bookingSearchQuery) || (b.hall || '').includes(bookingSearchQuery);
    const matchStatus = bookingFilterStatus ? b.status === bookingFilterStatus : true;
    const matchPaymentStatus = bookingFilterPaymentStatus ? b.paymentStatus === bookingFilterPaymentStatus : true;
    const matchDateFrom = bookingFilterDateFrom ? new Date(b.date) >= new Date(bookingFilterDateFrom) : true;
    const matchDateTo = bookingFilterDateTo ? new Date(b.date) <= new Date(bookingFilterDateTo) : true;
    return matchSearch && matchStatus && matchPaymentStatus && matchDateFrom && matchDateTo;
  });

  // Filter Support Requests for Provider
  const filteredRequests = supportServiceRequests.filter(r => {
    if (isProviderTab && r.providerName !== currentProviderName) return false;
    const matchSearch = (r.customerName || '').includes(supportServiceSearchQuery) || (r.serviceName || '').includes(supportServiceSearchQuery);
    const matchStatus = supportServiceFilterStatus ? r.status === supportServiceFilterStatus : true;
    return matchSearch && matchStatus;
  });

  if (bookingSortBy === 'priceDesc') {
    filteredBookings.sort((a: any, b: any) => b.amount - a.amount);
  } else if (bookingSortBy === 'priceAsc') {
    filteredBookings.sort((a: any, b: any) => a.amount - b.amount);
  } else if (bookingSortBy === 'oldest') {
    filteredBookings.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } else { // newest (by default)
    filteredBookings.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  const renderSupportRequestsContent = () => {
    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* أدوات تصدير الخدمات المساندة */}
        <div className="relative overflow-hidden bg-gradient-to-l from-indigo-50/50 to-slate-100/50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="bg-indigo-600/10 p-2 rounded-xl text-indigo-600">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-800">تصدير تقارير وتفاصيل الخدمات المساندة</h4>
                <p className="text-[11px] text-slate-500">يتضمن تفاصيل أسماء الخدمات الإضافية المطلوبة، والضرائب (15%)، والمجمعات المحصلة.</p>
              </div>
            </div>
            
            {!canExport && (
              <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                <Lock className="w-3.5 h-3.5" /> ميزة تصدير كشوف الفواتير مغلقة
              </span>
            )}
          </div>

          {!canExport ? (
            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-slate-600 leading-relaxed">
              عذراً! ميزة تصدير كشوفات طلبات الخدمات غير مفعلة في اشتراكك المالي الحالي. 
              يرجى تفعيل <span className="text-amber-700 font-bold">"ميزة استعراض وتصدير الفواتير"</span> من تبويب الباقات والميزات لتتمكن من تحميل الكشوفات والتقارير بصيغ Excel و PDF.
            </div>
          ) : (
            <div className="flex flex-wrap gap-2 pt-1 font-sans">
              <button 
                onClick={() => exportSupportRequestsToCSV(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> تصدير جميع طلبات الخدمات (CSV)
              </button>
              <button 
                onClick={() => exportSupportRequestsToCSV(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <Filter className="w-4 h-4 text-indigo-600" /> تصدير طلبات حسب تصفية الحالة (CSV)
              </button>
              <button 
                onClick={() => exportSupportRequestsToPDF(false)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <FileDown className="w-4 h-4 text-red-500" /> تحميل التقرير العام (PDF)
              </button>
              <button 
                onClick={() => exportSupportRequestsToPDF(true)}
                className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-indigo-500" /> طباعة تقرير تصفية الحالة (PDF)
              </button>
            </div>
          )}
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="بحث بالعميل أو الخدمة..." 
              className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" 
              value={supportServiceSearchQuery} 
              onChange={e => setSupportServiceSearchQuery(e.target.value)} 
            />
          </div>
          <select 
            className="p-3 rounded-xl border border-slate-200 bg-white outline-none min-w-[150px]" 
            value={supportServiceFilterStatus} 
            onChange={e => setSupportServiceFilterStatus(e.target.value)}
          >
            <option value="">كل الحالات</option>
            <option value="قيد الانتظار">قيد الانتظار</option>
            <option value="قيد التنفيذ">قيد التنفيذ</option>
            <option value="مكتمل">مكتمل</option>
            <option value="ملغي">ملغي</option>
          </select>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-right" id="IndependentLogistics_RequestsTable">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                <tr>
                    <th className="p-4 font-medium text-xs">رقم الطلب</th>
                    <th className="p-4 font-medium text-xs">رقم الحجز</th>
                    <th className="p-4 font-medium text-xs">العميل</th>
                    <th className="p-4 font-medium text-xs">الخدمة</th>
                    <th className="p-4 font-medium text-xs">التاريخ</th>
                    <th className="p-4 font-medium text-xs">المبلغ</th>
                    <th className="p-4 font-medium text-xs">الاستحقاق</th>
                    <th className="p-4 font-medium text-xs">الحالة</th>
                    <th className="p-4 font-medium text-xs">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredRequests.map((r: any) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-mono text-sm font-bold text-slate-700">{formatServiceRequestId(r.id)}</td>
                    <td className="p-4 font-mono text-sm">
                      {r.bookingId && r.bookingId !== '-' && String(r.bookingId) !== '0' ? (
                        <span className="text-blue-600 hover:underline cursor-pointer font-bold" onClick={() => {
                          const associatedBooking = bookings.find(b => b.id === r.bookingId);
                          if (associatedBooking) {
                            setViewingBooking(associatedBooking);
                            setIsBookingViewModalOpen(true);
                          } else {
                            showNotification('error', 'تفاصيل هذا الحجز غير متوفرة أو تم حذفه');
                          }
                        }}> {formatBookingId(r.bookingId)} </span>
                      ) : (
                        <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md text-xs font-medium">خدمة مستقلة</span>
                      )}
                    </td>
                    <td className="p-4 font-medium">{r.customerName}</td>
                    <td className="p-4">{r.serviceName}</td>
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-700">{formatSmartDate(r.date, 'gregorian')}</span>
                        <span className="text-[11px] text-amber-600 font-extrabold">{getFullDateInfo(new Date(r.date)).hijri.full}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const prov = providers.find(p => p.name === r.providerName);
                        return renderPriceWithTax(r.price, prov?.isVatEnabled ?? true, "font-bold text-emerald-600");
                      })()}
                    </td>
                    <td className="p-4">
                      {(() => {
                        const status = r.paymentStatus || (r.price > 4000 ? 'جزئي' : r.price > 0 ? 'مدفوع بالكامل' : 'غير مدفوع');
                        const isPaid = status === 'مدفوع بالكامل' || status === 'مدفوع';
                        const isPartial = status === 'جزئي';
                        return (
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black rounded-lg border ${
                            isPaid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            isPartial ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            {status}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <select
                        value={r.status}
                        onChange={(e) => {
                          updateSupportRequestStatus(r.id, e.target.value);
                          showNotification('success', 'تم تحديث حالة الطلب بنجاح');
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-bold border outline-none cursor-pointer appearance-none text-center ${
                          r.status === 'مكتمل' ? 'bg-green-100 text-green-700 border-green-200' :
                          r.status === 'جاري التنفيذ' || r.status === 'قيد التنفيذ' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                          r.status === 'تم القبول' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                          r.status === 'ملغي' ? 'bg-red-100 text-red-700 border-red-200' :
                          'bg-amber-100 text-amber-700 border-amber-200'
                        }`}
                      >
                        <option value="قيد الانتظار">قيد الانتظار</option>
                        <option value="تم القبول">تم القبول</option>
                        <option value="جاري التنفيذ">جاري التنفيذ</option>
                        <option value="مكتمل">مكتمل</option>
                        <option value="ملغي">ملغي</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => {
                            setViewingSupportRequest(r);
                            setIsSupportRequestViewModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:bg-slate-50 rounded-xl transition-colors" 
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setInvoiceBookingToPrint(r)} 
                          className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors" 
                          title="إصدار فاتورة"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {userRole === 'admin' && (
                          <>
                            <button 
                              onClick={() => {
                                setEditingItem(r);
                                setSupportRequestForm({
                                  bookingId: r.bookingId,
                                  userId: r.userId || '',
                                  customerName: r.customerName,
                                  providerName: r.providerName,
                                  serviceName: r.serviceName,
                                  date: r.date,
                                  status: r.status,
                                  price: r.price
                                });
                                setIsSupportRequestModalOpen(true);
                              }}
                              className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" 
                              title="تعديل"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteData({ id: r.id, type: 'support_requests', name: `طلب خدمة #${r.id}` });
                              }}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" 
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRequests.length === 0 && (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-slate-500">لا توجد طلبات مطابقة للبحث</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile/Tablet Responsive Cards for Services Support Requests */}
          <div className="lg:hidden block divide-y divide-slate-100">
            {filteredRequests.map((r: any) => (
              <div key={r.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-slate-800 font-mono text-sm">{formatServiceRequestId(r.id)}</span>
                  <div className="flex gap-1.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${r.status === 'مكتمل' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                      {r.status}
                    </span>
                    {(() => {
                      const payStatus = r.paymentStatus || (r.price > 4000 ? 'جزئي' : r.price > 0 ? 'مدفوع بالكامل' : 'غير مدفوع');
                      return (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${payStatus === 'مدفوع بالكامل' || payStatus === 'مدفوع' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                          {payStatus}
                        </span>
                      );
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600 leading-relaxed">
                  <div>
                    <span className="text-slate-400">العميل:</span> <span className="font-semibold text-slate-800">{r.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">الخدمة:</span> <span className="font-semibold text-slate-800">{r.serviceName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">تاريخ الطلب:</span> <span className="font-semibold text-slate-800 font-mono">{formatSmartDate(r.date, 'gregorian')}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">المبلغ:</span> <span className="font-black text-rose-600">{r.price} ر.س</span>
                  </div>
                  <div>
                    <span className="text-slate-400">الربط بالحجز:</span>{' '}
                    {r.bookingId && r.bookingId !== '-' && String(r.bookingId) !== '0' ? (
                      <span className="text-blue-600 hover:underline cursor-pointer font-extrabold" onClick={() => {
                        const associatedBooking = bookings.find(b => b.id === r.bookingId);
                        if (associatedBooking) {
                          setViewingBooking(associatedBooking);
                          setIsBookingViewModalOpen(true);
                        } else {
                          showNotification('error', 'تفاصيل هذا الحجز غير متوفرة أو تم حذفه');
                        }
                      }}>{formatBookingId(r.bookingId)}</span>
                    ) : (
                      <span className="text-slate-400 font-medium">خدمة مستقلة</span>
                    )}
                  </div>
                </div>
                <div className="pt-2.5 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                  <div className="flex gap-1.5 items-center">
                    <select
                      value={r.status}
                      onChange={(e) => {
                        updateSupportRequestStatus(r.id, e.target.value);
                        showNotification('success', 'تم تحديث حالة الطلب بنجاح');
                      }}
                      className="text-[10px] font-bold py-1 px-2 border rounded-lg focus:outline-none bg-slate-50 cursor-pointer"
                    >
                      <option value="قيد الانتظار">قيد الانتظار</option>
                      <option value="تم القبول">تم القبول</option>
                      <option value="جاري التنفيذ">جاري التنفيذ</option>
                      <option value="مكتمل">مكتمل</option>
                      <option value="ملغي">ملغي</option>
                    </select>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setViewingSupportRequest(r); setIsSupportRequestViewModalOpen(true); }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100" title="عرض التفاصيل">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button onClick={() => setInvoiceBookingToPrint(r)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-slate-100" title="إصدار فاتورة">
                      <FileText className="w-4 h-4" />
                    </button>
                    {userRole === 'admin' && (
                      <>
                        <button 
                          onClick={() => {
                            setEditingItem(r);
                            setSupportRequestForm({
                              bookingId: r.bookingId,
                              userId: r.userId || '',
                              customerName: r.customerName,
                              providerName: r.providerName,
                              serviceName: r.serviceName,
                              date: r.date,
                              status: r.status,
                              price: r.price
                            });
                            setIsSupportRequestModalOpen(true);
                          }}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100" 
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setDeleteData({ id: r.id, type: 'support_requests', name: `طلب خدمة #${r.id}` });
                          }}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-slate-100" 
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {filteredRequests.length === 0 && (
              <div className="p-8 text-center text-slate-500 text-sm">لا توجد طلبات مطابقة للبحث</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">
          {userRole === 'admin' ? 'إدارة الحجوزات والخدمات' : 'إدارة الحجوزات'}
        </h2>
        {bookingActiveTab === 'bookings' ? (
          userRole === 'admin' && (
            <button 
              onClick={() => { setEditingItem(null); setBookingForm({
                customer: '', phone: '', itemName: '', type: 'حجز قاعة',
                startDate: '', endDate: '', period: 'مسائية', guests: 0,
                status: 'جديد', paymentStatus: 'غير مدفوع', basePrice: 0, extraPrice: 0, amount: 0,
                extraServices: '', notes: '', hallId: 0, selectedServices: [] as any[]
              } as any); setIsBookingModalOpen(true); }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" /> حجز جديد
            </button>
          )
        ) : (
          userRole === 'admin' && (
            <button 
              onClick={() => { 
                setEditingItem(null); 
                setSupportRequestForm({
                  bookingId: '',
                  userId: '',
                  customerName: '',
                  providerName: '',
                  serviceName: '',
                  date: new Date().toISOString().split('T')[0],
                  status: 'قيد الانتظار',
                  price: 0
                }); 
                setIsSupportRequestModalOpen(true); 
              }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-indigo-500/30 transition-all hover:scale-105"
            >
              <Plus className="w-5 h-5" /> طلب خدمة جديد
            </button>
          )
        )}
      </div>

      <div className="flex gap-4 border-b border-slate-200 font-bold">
        <button 
          onClick={() => setBookingActiveTab('bookings')}
          className={`pb-4 px-2 font-bold text-sm transition-all relative ${bookingActiveTab === 'bookings' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          قائمة الحجوزات
          {bookingActiveTab === 'bookings' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full"></div>}
        </button>
        <button 
          onClick={() => setBookingActiveTab('supportRequests')}
          className={`pb-4 px-2 font-bold text-sm transition-all relative ${bookingActiveTab === 'supportRequests' ? 'text-amber-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          طلبات الخدمات المساندة
          {bookingActiveTab === 'supportRequests' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500 rounded-t-full"></div>}
        </button>
      </div>

      {bookingActiveTab === 'bookings' ? (
        <>
          {/* Operational KPIs Readiness Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-500 block">إجمالي الحجوزات النشطة</span>
                <span className="text-xl font-black text-slate-900 mt-0.5 block">{bookings.filter((b: any) => b.status !== 'ملغي').length} حجز</span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Layers className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-500 block">الجاهزية التشغيلية للمناسبات</span>
                <span className="text-xl font-black text-emerald-600 mt-0.5 block">
                  {Math.round((bookings.filter((b: any) => b.status === 'منفذ' || b.executionStage === 'completed').length / (bookings.length || 1)) * 100)}%
                </span>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-500 block">حجوزات قادمة هذا الأسبوع</span>
                <span className="text-xl font-black text-indigo-600 mt-0.5 block">
                  {bookings.filter((b: any) => b.status === 'مؤكد' || b.status === 'جديد').length} حجز
                </span>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                <Clock className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div>
                <span className="text-[11px] font-extrabold text-slate-500 block">مستحقات بانتظار التحصيل/التسوية</span>
                <span className="text-xl font-black text-amber-600 mt-0.5 block">
                  {formatCurrency(bookings.filter((b: any) => b.paymentStatus !== 'مدفوع').reduce((acc: number, curr: any) => acc + (curr.amount || 0), 0))}
                </span>
              </div>
              <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                <Activity className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* أدوات التصدير - مرتبطة بميزة استعراض وتصدير الفواتير */}
          <div className="relative overflow-hidden bg-gradient-to-l from-slate-50 to-slate-100/50 p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex items-center gap-2.5">
                <div className="bg-amber-500/10 p-2 rounded-xl text-amber-600">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-800">تصدير كشوف الحجوزات التفصيلية (الضريبة والخدمات الإضافية)</h4>
                  <p className="text-[11px] text-slate-500">يتضمن الأسعار الأساسية، الضريبة المضافة (15%)، والخدمات المساندة الإضافية لكل حجز.</p>
                </div>
              </div>
              
              {!canExport && (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0">
                  <Lock className="w-3.5 h-3.5" /> ميزة تصدير كشوف الفواتير مغلقة
                </span>
              )}
            </div>

            {!canExport ? (
              <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-xl text-xs text-slate-600 leading-relaxed">
                عذراً! ميزة تصدير التقارير والحجوزات غير مفعلة في اشتراكك المالي الحالي. 
                يرجى تفعيل <span className="text-amber-700 font-bold">"ميزة استعراض وتصدير الفواتير"</span> من تبويب الباقات والميزات لتتمكن من تحميل كشوف الحجوزات بصيغ Excel الضريبية و PDF بنقرة واحدة.
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 pt-1">
                <button 
                  onClick={() => exportBookingsToCSV(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" /> تصدير جميع الحجوزات (CSV/Excel)
                </button>
                <button 
                  onClick={() => exportBookingsToCSV(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <Filter className="w-4 h-4 text-blue-600" /> تصدير المفلترة حسب الحالة (CSV)
                </button>
                <button 
                  onClick={() => exportBookingsToPDF(false)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <FileDown className="w-4 h-4 text-red-500" /> تحميل التقرير الشامل (PDF)
                </button>
                <button 
                  onClick={() => exportBookingsToPDF(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm shrink-0 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-indigo-500" /> طباعة المفلترة حسب الحالة (PDF)
                </button>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input type="text" placeholder="بحث بالعميل أو القاعة..." className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" value={bookingSearchQuery} onChange={e => setBookingSearchQuery(e.target.value)} />
            </div>
            <select className="p-3 rounded-xl border border-slate-200 bg-white outline-none min-w-[150px]" value={bookingFilterStatus || ''} onChange={e => setBookingFilterStatus(e.target.value)}>
              <option value="">حالة الحجز</option>
              <option value="مؤكد">مؤكد</option>
              <option value="انتظار">انتظار</option>
              <option value="ملغي">ملغي</option>
            </select>
            <select className="p-3 rounded-xl border border-slate-200 bg-white outline-none min-w-[150px]" value={bookingFilterPaymentStatus || ''} onChange={e => setBookingFilterPaymentStatus(e.target.value)}>
              <option value="">حالة الدفع</option>
              <option value="مدفوع">مدفوع</option>
              <option value="جزئي">جزئي</option>
              <option value="غير مدفوع">غير مدفوع</option>
            </select>
            <div className="flex gap-2 items-center">
              <input type="date" className="p-3 rounded-xl border border-slate-200 outline-none" value={bookingFilterDateFrom || ''} onChange={e => setBookingFilterDateFrom(e.target.value)} placeholder="من تاريخ" />
              <span className="text-slate-400">-</span>
              <input type="date" className="p-3 rounded-xl border border-slate-200 outline-none" value={bookingFilterDateTo || ''} onChange={e => setBookingFilterDateTo(e.target.value)} placeholder="إلى تاريخ" />
            </div>
            <select className="p-3 rounded-xl border border-slate-200 bg-white outline-none min-w-[150px]" value={bookingSortBy} onChange={e => setBookingSortBy(e.target.value)}>
              <option value="newest">ترتيب: الأحدث</option>
              <option value="oldest">ترتيب: الأقدم</option>
              <option value="priceDesc">السعر: الأعلى</option>
              <option value="priceAsc">السعر: الأقل</option>
            </select>
            <button
              className="p-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors shrink-0"
              onClick={() => {
                setBookingSearchQuery("");
                setBookingFilterStatus("");
                setBookingFilterPaymentStatus("");
                setBookingFilterDateFrom("");
                setBookingFilterDateTo("");
                setBookingSortBy("newest");
              }}
              title="مسح التصفية"
            >
              <FilterX className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
            <button
              onClick={() => setShowAdminCalendar(!showAdminCalendar)}
              className="w-full flex justify-between items-center p-4 bg-slate-50 hover:bg-slate-100 transition-colors font-bold text-slate-800"
            >
              <span>تقويم الحجوزات (الإدارة)</span>
              <span className="text-slate-500">{showAdminCalendar ? "▲ إخفاء التقويم" : "▼ عرض التقويم"}</span>
            </button>
            {showAdminCalendar && (
              <div className="p-4 border-t border-slate-100">
                <AdminCalendar bookings={bookings} halls={halls} />
              </div>
            )}
          </div>

          <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 text-xs mb-4">
            <span className="font-bold text-slate-500">عرض {filteredBookings.length} حجز مكتشف</span>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-slate-400">طريقة العرض:</span>
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                {(['table', 'grid'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setBookingsViewMode(mode);
                      localStorage.setItem('pref_bookings_view_mode', mode);
                    }}
                    className={`p-1.5 rounded-lg text-xs transition-all flex items-center gap-1 cursor-pointer ${bookingsViewMode === mode ? 'bg-white shadow text-purple-700 font-bold font-sans' : 'text-slate-400 hover:text-slate-700'}`}
                  >
                    {mode === 'table' ? (
                      <>
                        <Table className="w-3.5 h-3.5" />
                        <span>جدول</span>
                      </>
                    ) : (
                      <>
                        <LayoutGrid className="w-3.5 h-3.5" />
                        <span>بطاقات</span>
                      </>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            {bookingsViewMode === 'table' ? (
              <div className="overflow-x-auto">
                <table className="w-full text-right animate-in fade-in">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                    <tr>
                      <th className="p-4 font-medium">رقم الحجز</th>
                      <th className="p-4 font-medium">العميل</th>
                      <th className="p-4 font-medium">القاعة</th>
                      <th className="p-4 font-medium">التاريخ</th>
                      <th className="p-4 font-medium">المبلغ</th>
                      <th className="p-4 font-medium">حالة الحجز</th>
                      <th className="p-4 font-medium">الاستحقاق</th>
                      <th className="p-4 font-medium">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredBookings.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-4 font-medium text-slate-700 font-mono text-sm border-l-2 border-transparent group-hover:border-purple-500">
                          {formatBookingId(b.id)}
                        </td>
                        <td className="p-4 font-semibold text-slate-700">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1.5">
                            <span>{b.customer}</span>
                            {renderBookingStatusBadge(b)}
                          </div>
                        </td>
                        <td className="p-4">{b.hall}</td>
                        <td className="p-4">
                          <div className="flex flex-col">
                            <span>{b.date}</span>
                            <span className="text-xs text-slate-400">
                              {(() => {
                                try {
                                  const d = new Date(b.date);
                                  if (!isNaN(d.getTime())) {
                                    return new Intl.DateTimeFormat("ar-SA-u-ca-islamic", { day: "numeric", month: "long", year: "numeric" }).format(d);
                                  }
                                } catch (e) {
                                  console.error(e);
                                }
                                return "تاريخ غير صالح";
                              })()}
                            </span>
                          </div>
                        </td>
                        <td className="p-4 font-bold">{formatCurrency(b.amount)}</td>
                        <td className="p-4">
                          <select
                            value={b.status}
                            onChange={(e) => setBookings(bookings.map((bk: any) => bk.id === b.id ? { ...bk, status: e.target.value } : bk))}
                            className={`px-3 py-1 rounded-full text-xs font-medium border outline-none cursor-pointer appearance-none text-center ${getStatusColor(b.status)}`}
                          >
                            <option value="جديد">جديد</option>
                            <option value="انتظار">انتظار</option>
                            <option value="مؤكد flex items-center gap-1">مؤكد</option>
                            <option value="منفذ">منفذ</option>
                            <option value="ملغي">ملغي</option>
                          </select>
                        </td>
                        <td className="p-4">
                          <select
                            value={b.paymentStatus}
                            onChange={(e) => setBookings(bookings.map((bk: any) => bk.id === b.id ? { ...bk, paymentStatus: e.target.value } : bk))}
                            className={`px-3 py-1 rounded-full text-xs font-medium border outline-none cursor-pointer appearance-none text-center ${getStatusColor(b.paymentStatus)}`}
                          >
                            <option value="مدفوع">مدفوع</option>
                            <option value="جزئي">جزئي</option>
                            <option value="غير مدفوع">غير مدفوع</option>
                            <option value="مسترجع">مسترجع</option>
                          </select>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button onClick={() => setSelectedBookingForOperations(b)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-3 py-1 rounded-xl text-[11px] font-black transition-all shadow-sm flex items-center gap-1 shrink-0 cursor-pointer" title="لوحة التحكم التشغيلية للحجز وإعادة الجدولة">
                            <Activity className="w-3.5 h-3.5" />
                            <span>تشغيل ⚡</span>
                          </button>
                          <button onClick={() => { setViewingBooking(b); setIsBookingViewModalOpen(true); }} className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors" title="عرض التفاصيل">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => { setEditingItem(b); setBookingForm(b); setIsBookingModalOpen(true); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-xl transition-colors" title="تعديل">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setInvoiceBookingToPrint(b)} className="p-2 text-amber-500 hover:bg-amber-50 rounded-xl transition-colors" title="إصدار فاتورة">
                            <FileText className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteData({ id: b.id, type: "bookings", name: `حجز #${b.id}` })} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition-colors" title="حذف">
                            <Trash2 className="w-4 h-4" />
                          </button>
                          {isEligibleForForceMajeureButton(b) && (
                            <button
                              id={`btn-apply-force-majeure-${b.id}`}
                              onClick={() => {
                                setSelectedBookingForForceMajeure(b);
                                setForceMajeureReason('');
                                setForceMajeureDocuments([]);
                                setIsForceMajeureModalOpen(true);
                              }}
                              className="bg-red-50 hover:bg-red-100 text-red-600 px-3 py-1.5 rounded-lg text-[11px] font-black tracking-wide border border-red-200 transition-colors flex items-center gap-1 shrink-0"
                              title="تقديم طلب إلغاء طارئ"
                            >
                              <span>⚠️ إلغاء طارئ</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredBookings.length === 0 && (
                      <tr>
                        <td colSpan={8} className="p-8 text-center text-slate-500">لا توجد حجوزات مطابقة للبحث</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-slate-50/50 animate-in fade-in">
                {filteredBookings.map((b: any) => (
                  <div key={b.id} className="p-5 space-y-4 bg-white hover:bg-slate-50/50 transition-all rounded-2xl border border-slate-150 shadow-xs hover:shadow-md flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-blue-950 font-mono text-sm bg-slate-100 px-2 py-1 rounded-lg">{formatBookingId(b.id)}</span>
                        <div className="flex gap-1.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(b.status)}`}>
                            {b.status}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(b.paymentStatus)}`}>
                            {b.paymentStatus}
                          </span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs text-slate-600 leading-relaxed pt-2">
                        <div>
                          <span className="text-slate-400 block text-[10px]">العميل:</span>{" "}
                          <span className="font-extrabold text-slate-800 flex flex-col gap-1 items-start mt-1">
                            <span>{b.customer}</span>
                            {renderBookingStatusBadge(b)}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">القاعة:</span>
                          <span className="font-extrabold text-slate-800 block mt-1">{b.hall}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">التاريخ:</span>
                          <span className="font-bold text-slate-800 font-mono block mt-1">{b.date}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">المبلغ الإجمالي:</span>
                          <span className="font-black text-rose-600 block mt-1 text-sm">{formatCurrency(b.amount)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-slate-100 flex flex-wrap justify-between items-center gap-2">
                      <div className="flex gap-1.5 items-center">
                        <select
                          value={b.status}
                          onChange={(e) => setBookings(bookings.map((bk: any) => bk.id === b.id ? { ...bk, status: e.target.value } : bk))}
                          className={`text-[10px] font-bold py-1 px-1.5 border rounded-lg focus:outline-none bg-slate-50 cursor-pointer ${getStatusColor(b.status)}`}
                        >
                          <option value="جديد">جديد</option>
                          <option value="انتظار">انتظار</option>
                          <option value="مؤكد @">مؤكد</option>
                          <option value="منفذ">منفذ</option>
                          <option value="ملغي">ملغي</option>
                        </select>
                        <select
                          value={b.paymentStatus}
                          onChange={(e) => setBookings(bookings.map((bk: any) => bk.id === b.id ? { ...bk, paymentStatus: e.target.value } : bk))}
                          className={`text-[10px] font-bold py-1 px-1.5 border rounded-lg focus:outline-none bg-slate-50 cursor-pointer ${getStatusColor(b.paymentStatus)}`}
                        >
                          <option value="مدفوع">مدفوع</option>
                          <option value="جزئي">جزئي</option>
                          <option value="غير مدفوع">غير مدفوع</option>
                          <option value="مسترجع">مسترجع</option>
                        </select>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        <button onClick={() => setSelectedBookingForOperations(b)} className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-2.5 py-1 rounded-lg text-[10px] font-black transition-all shadow-sm flex items-center gap-1 shrink-0 cursor-pointer" title="لوحة التحكم التشغيلية للحجز وإعادة الجدولة">
                          <Activity className="w-3.5 h-3.5" />
                          <span>تشغيل ⚡</span>
                        </button>
                        <button onClick={() => { setViewingBooking(b); setIsBookingViewModalOpen(true); }} className="p-1.5 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors border border-slate-100" title="عرض التفاصيل">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => { setEditingItem(b); setBookingForm(b); setIsBookingModalOpen(true); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors border border-slate-100" title="تعديل">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => setInvoiceBookingToPrint(b)} className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors border border-slate-100" title="إصدار فاتورة">
                          <FileText className="w-4 h-4" />
                        </button>
                        <button onClick={() => setDeleteData({ id: b.id, type: "bookings", name: `حجز #${b.id}` })} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-slate-100" title="حذف">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        {isEligibleForForceMajeureButton(b) && (
                          <button
                            id={`btn-apply-force-majeure-mobile-${b.id}`}
                            onClick={() => {
                              setSelectedBookingForForceMajeure(b);
                              setForceMajeureReason('');
                              setForceMajeureDocuments([]);
                              setIsForceMajeureModalOpen(true);
                            }}
                            className="bg-red-50 hover:bg-red-100 text-red-600 px-2 py-1 rounded-lg text-[10px] font-black border border-red-200 transition-colors flex items-center gap-1 shrink-0"
                            title="تقديم طلب إلغاء طارئ"
                          >
                            <span>⚠️ إلغاء طارئ</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {filteredBookings.length === 0 && (
                  <div className="col-span-full p-8 text-center text-slate-500">لا توجد حجوزات مطابقة للبحث</div>
                )}
              </div>
            )}
          </div>
        </>
      ) : (
        renderSupportRequestsContent()
      )}

      {/* Booking Operations Manager Modal */}
      {selectedBookingForOperations && (
        <BookingOperationsManager
          booking={selectedBookingForOperations}
          halls={halls}
          userRole={userRole}
          showNotification={showNotification}
          onUpdateBooking={(updatedBk) => {
            setBookings(bookings.map((b: any) => b.id === updatedBk.id ? updatedBk : b));
            setSelectedBookingForOperations(updatedBk);
          }}
          onClose={() => setSelectedBookingForOperations(null)}
        />
      )}
    </div>
  );
};
