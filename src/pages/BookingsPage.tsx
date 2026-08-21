import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { formatBookingId, formatServiceRequestId, formatInvoiceId } from '../utils/idUtils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProviderChatModal from '../components/ProviderChatModal';
import BookingInvoice from '../components/BookingInvoice';
import ServiceRequestInvoice from '../components/ServiceRequestInvoice';
import { 
  MapPin, Calendar, Clock, Receipt, CheckCircle2, AlertCircle, XCircle, 
  ChevronDown, ChevronUp, Mail, MessageSquare, MessageCircle, X, Trash2, 
  Pencil, Users, Printer, Share2, Building2, User, Timer, Bell, ShieldAlert, 
  Star, Sparkles, Filter, PackageSearch, Search
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import { halls, getStoredHalls, isProviderNameVisible, getDisplayedProviderName } from '../data/mockData';
import { useCalendar } from '../context/CalendarContext';
import { formatDateWithHijri, formatSmartDate, getFullDateInfo } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import { ReviewModal } from '../components/modals/ReviewModal';
import { AdBanner } from '../components/AdBanner';

// Helper for invoice request (Bookings)
const handleRequestInvoice = (bookingId: string) => {
  const requests = JSON.parse(localStorage.getItem('INVOICE_REQUESTS') || '[]');
  const newRequest = {
    id: Date.now(),
    type: 'booking',
    targetId: bookingId,
    customerName: JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'عميل',
    customerId: 'CUST-' + Math.floor(Math.random() * 1000),
    date: new Date().toISOString(),
    status: 'pending',
    requestCount: 1
  };
  
  const existing = requests.find((r: any) => r.targetId === bookingId);
  if (existing) {
    existing.requestCount += 1;
    localStorage.setItem('INVOICE_REQUESTS', JSON.stringify(requests));
  } else {
    localStorage.setItem('INVOICE_REQUESTS', JSON.stringify([...requests, newRequest]));
  }
  
  toast.success('تم إرسال طلب الفاتورة لمزود الخدمة بنجاح');
  window.dispatchEvent(new Event('invoice_requested'));
};

// Helper for invoice request (Service Requests)
const handleRequestServiceInvoice = (requestId: string | number) => {
  const requests = JSON.parse(localStorage.getItem('INVOICE_REQUESTS') || '[]');
  const newRequest = {
    id: Date.now(),
    type: 'service',
    targetId: requestId,
    customerName: JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'عميل',
    customerId: 'CUST-' + Math.floor(Math.random() * 1000),
    date: new Date().toISOString(),
    status: 'pending',
    requestCount: 1
  };
  
  const existing = requests.find((r: any) => r.targetId === requestId && r.type === 'service');
  if (existing) {
    existing.requestCount += 1;
    localStorage.setItem('INVOICE_REQUESTS', JSON.stringify(requests));
  } else {
    localStorage.setItem('INVOICE_REQUESTS', JSON.stringify([...requests, newRequest]));
  }
  
  toast.success('تم إرسال طلب فاتورة الخدمة بنجاح');
  window.dispatchEvent(new Event('invoice_requested'));
};

// ZATCA TLV Base64 Generator for Simplified Tax Invoices
const getZatcaTlvBase64 = (sellerName: string, vatNumber: string, timestamp: string, total: string, vatTotal: string): string => {
  const toUtf8Array = (str: string) => {
    const utf8: number[] = [];
    for (let i = 0; i < str.length; i++) {
      let charcode = str.charCodeAt(i);
      if (charcode < 0x80) utf8.push(charcode);
      else if (charcode < 0x800) {
        utf8.push(0xc0 | (charcode >> 6), 0x80 | (charcode & 0x3f));
      } else if (charcode < 0xd800 || charcode >= 0xe000) {
        utf8.push(
          0xe0 | (charcode >> 12),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        );
      } else {
        i++;
        charcode = 0x10000 + (((charcode & 0x3ff) << 10) | (str.charCodeAt(i) & 0x3ff));
        utf8.push(
          0xf0 | (charcode >> 18),
          0x80 | ((charcode >> 12) & 0x3f),
          0x80 | ((charcode >> 6) & 0x3f),
          0x80 | (charcode & 0x3f)
        );
      }
    }
    return new Uint8Array(utf8);
  };

  const getTlvForTag = (tag: number, valueStr: string) => {
    const valueBytes = toUtf8Array(valueStr);
    const len = valueBytes.length;
    const tlv = new Uint8Array(2 + len);
    tlv[0] = tag;
    tlv[1] = len;
    tlv.set(valueBytes, 2);
    return tlv;
  };

  try {
    const tlv1 = getTlvForTag(1, sellerName);
    const tlv2 = getTlvForTag(2, vatNumber);
    const tlv3 = getTlvForTag(3, timestamp);
    const tlv4 = getTlvForTag(4, total);
    const tlv5 = getTlvForTag(5, vatTotal);

    const totalLen = tlv1.length + tlv2.length + tlv3.length + tlv4.length + tlv5.length;
    const combined = new Uint8Array(totalLen);
    let offset = 0;
    [tlv1, tlv2, tlv3, tlv4, tlv5].forEach(arr => {
      combined.set(arr, offset);
      offset += arr.length;
    });

    let binary = '';
    const len = combined.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(combined[i]);
    }
    return window.btoa(binary);
  } catch (e) {
    console.error("ZATCA TLV Generation Error:", e);
    return "";
  }
};

// Mock Bookings (used as fallback)
const fallbackMockBookings = [
  {
    id: 81,
    hall: halls[0],
    date: '20 يونيو 2026',
    rawDate: '2026-06-20',
    createdAt: '2026-06-10T12:00:00Z',
    period: 'مسائي',
    status: 'confirmed',
    total: 18500,
    communications: [
      { type: 'email', to: 'customer', title: 'تم تأكيد حجزك!', date: '10 يونيو 2026', content: 'نشكرك على ثقتك، تم تأكيد حجزك بنجاح لقاعة اللؤلؤة. بانتظارك في الموعد المحدد.' },
      { type: 'sms', to: 'provider', title: 'حجز جديد مؤكد', date: '10 يونيو 2026', content: 'لديك حجز جديد مؤكد ليوم 20 يونيو، الدفع تم بنجاح.' },
    ]
  },
  {
    id: 42,
    hall: halls[1],
    date: '15 يونيو 2026',
    rawDate: '2026-06-15',
    createdAt: '2026-06-05T12:00:00Z',
    period: 'صباحي',
    status: 'pending',
    total: 12000,
    communications: [
      { type: 'email', to: 'customer', title: 'تأكيد استلام طلب الحجز', date: '5 يونيو 2026', content: 'تم استلام طلب الحجز بنجاح، جاري مراجعة الطلب والموافقة عليه من قبل مزود الخدمة.' }
    ]
  },
  {
    id: 118,
    hall: halls[2],
    date: '20 ديسمبر 2024',
    rawDate: '2024-12-20',
    createdAt: '2024-11-10T12:00:00Z',
    period: 'مسائي',
    status: 'cancelled',
    total: 8000,
    communications: [
      { type: 'email', to: 'customer', title: 'تم إلغاء الحجز', date: '10 نوفمبر 2024', content: 'تم إلغاء الحجز بناءً على طلبكم.' }
    ]
  }
];

const PaymentDeadlineAlert = ({ booking }: { booking: any }) => {
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; text: string; isUrgent: boolean; isPast: boolean } | null>(null);

  useEffect(() => {
    const calculateTime = () => {
      const bookingDate = booking.startTime || booking.rawDate;
      if (!bookingDate) return;
      
      const eventTime = new Date(bookingDate).getTime();
      let deadlineTime: number;
      
      if (booking.paymentDeadline) {
        deadlineTime = new Date(booking.paymentDeadline).getTime();
      } else {
        deadlineTime = eventTime - (3 * 24 * 60 * 60 * 1000);
      }
      
      const now = new Date().getTime();
      const diffMs = deadlineTime - now;
      
      if (diffMs <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, text: 'منتهي', isUrgent: true, isPast: true });
        return;
      }
      
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const isUrgent = days <= 5;
      
      setTimeLeft({
        days,
        hours,
        minutes,
        text: `${days} يوم و ${hours} ساعة`,
        isUrgent,
        isPast: false
      });
    };
    
    calculateTime();
    const interval = setInterval(calculateTime, 60000);
    return () => clearInterval(interval);
  }, [booking]);

  const hasRemainingPayment = booking.status !== 'cancelled' && 
                               booking.status !== 'completed' && 
                               booking.paymentStatus !== 'paid_full' && 
                               booking.paymentStatus !== 'paid' && 
                               booking.paymentStatus !== 'مدفوعة بالكامل';

  if (!hasRemainingPayment || !timeLeft) return null;

  return (
    <div className={`p-4 md:p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all duration-300 w-full mb-4 ${
      timeLeft.isUrgent 
        ? 'bg-rose-50 border-rose-100 text-rose-950 shadow-sm shadow-rose-100/30' 
        : 'bg-amber-50 border-amber-100 text-amber-950 shadow-sm shadow-amber-100/30'
    }`}>
      <div className="flex items-start gap-3.5">
        {timeLeft.isUrgent ? (
          <div className="bg-rose-600 text-white p-2.5 rounded-xl shrink-0 shadow-md shadow-rose-200">
            <ShieldAlert className="w-5 h-5 animate-bounce" />
          </div>
        ) : (
          <div className="bg-amber-500 text-slate-900 p-2.5 rounded-xl shrink-0 shadow-md shadow-amber-200">
            <Bell className="w-5 h-5 animate-pulse" />
          </div>
        )}
        <div className="text-right">
          <h5 className="font-black text-sm md:text-base flex items-center gap-2">
            {timeLeft.isUrgent ? 'تنبيه عاجل: اقتراب موعد سداد الدفعة المتبقية!' : 'تنبيه دفع: يرجى سداد الدفعة المتبقية'}
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${timeLeft.isUrgent ? 'bg-rose-200 text-rose-800' : 'bg-amber-200 text-amber-800'}`}>
              {timeLeft.isUrgent ? 'عاجل جداً' : 'تذكير'}
            </span>
          </h5>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            وفقاً لقواعد الضوابط المالية وحماية المستهلك المعتمدة، يجب سداد القيمة المتبقية من الحجز قبل الموعد النهائي المحدد لتفادي الإلغاء التلقائي.
          </p>
        </div>
      </div>
      
      <div className={`px-4 py-2.5 rounded-xl border flex items-center gap-2 text-xs font-black shrink-0 ${
        timeLeft.isUrgent 
          ? 'bg-rose-600 text-white border-rose-700 shadow-md' 
          : 'bg-amber-500 text-slate-900 border-amber-650 shadow-md'
      }`}>
        <Timer className="w-4 h-4" />
        <span>الوقت المتبقي للسداد:</span>
        <span className="font-mono tracking-tight text-sm">
          {timeLeft.isPast ? 'انتهت المهلة' : `${timeLeft.days} يَوْم و ${timeLeft.hours} سَاعَة`}
        </span>
      </div>
    </div>
  );
};

export default function BookingsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTabParam = searchParams.get('tab');
  const [mainTab, setMainTab] = useState<'halls' | 'services'>(
    initialTabParam === 'services' ? 'services' : 'halls'
  );

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'services') {
      setMainTab('services');
    } else if (tab === 'halls' || tab === 'venue-bookings') {
      setMainTab('halls');
    }
  }, [searchParams]);

  const handleMainTabChange = (tab: 'halls' | 'services') => {
    setMainTab(tab);
    setSearchParams({ tab });
  };

  // ----------------------------------------------------
  // HALL BOOKINGS STATE & LOGIC
  // ----------------------------------------------------
  const [expandedBooking, setExpandedBooking] = useState<string | number | null>(null);
  const { calendarType } = useCalendar();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [realBookings, setRealBookings] = useState<any[]>([]);
  const [selectedDetailBooking, setSelectedDetailBooking] = useState<any | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<any | null>(null);

  const handleModalSubmitReview = async (reviewData: {
    targetType: 'hall' | 'service' | 'provider';
    targetId: number | string;
    targetName: string;
    providerName?: string;
    customerName?: string;
    rating: number;
    comment: string;
  }) => {
    try {
      const stored = localStorage.getItem('allReviews');
      const allReviewsList = stored ? JSON.parse(stored) : [];
      const userObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
      const newRev = {
        id: `rev-${Date.now()}`,
        targetType: reviewData.targetType,
        targetId: reviewData.targetId,
        targetName: reviewData.targetName,
        providerName: reviewData.providerName || selectedBookingForReview?.hall?.provider || '',
        customerName: reviewData.customerName || userObj?.name || userObj?.email || 'عميل منصة ليلة',
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date().toISOString().split('T')[0],
        status: 'published'
      };
      const updatedList = [newRev, ...allReviewsList];
      localStorage.setItem('allReviews', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage'));
      toast.success('تم تسليم وتقييم التجربة بنجاح! شكراً لمشاركتك.');
      return true;
    } catch {
      toast.error('حدث خطأ أثناء حفظ التقييم');
      return false;
    }
  };
  
  const [isProviderChatOpen, setIsProviderChatOpen] = useState(false);
  const [chatData, setChatData] = useState({ providerName: '', hallName: '' });

  const isBookingPast = (booking: any) => {
    try {
      const dateVal = booking.rawDate || booking.startTime || booking.startDate || booking.date;
      if (!dateVal) return false;
      const parsedDate = new Date(dateVal);
      if (isNaN(parsedDate.getTime())) return false;
      
      const now = new Date();
      const bDate = new Date(parsedDate);
      bDate.setHours(23, 59, 59, 999);
      return bDate.getTime() < now.getTime();
    } catch {
      return false;
    }
  };

  const getProviderVatStatus = (providerName: string): boolean => {
    try {
      const listStr = localStorage.getItem('providersData');
      if (listStr) {
        const list = JSON.parse(listStr);
        if (Array.isArray(list)) {
          const found = list.find((p: any) => p.name === providerName);
          if (found) {
            return found.isVatEnabled ?? true;
          }
        }
      }
    } catch (err) {
      console.warn('Error fetching provider VAT status:', err);
    }
    return true;
  };

  const [editingBooking, setEditingBooking] = useState<any | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editPeriod, setEditPeriod] = useState('مسائي');
  const [editNotes, setEditNotes] = useState('');
  const [editServices, setEditServices] = useState<string[]>([]);
  const [editTotal, setEditTotal] = useState(0);
  const [cancellingBooking, setCancellingBooking] = useState<any | null>(null);
  const [viewingInvoice, setViewingInvoice] = useState<any | null>(null);
  const [platformData, setPlatformData] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { platformName: 'منصة ليلة', logoUrl: null, taxNumber: '310123456700003' };
  });

  useEffect(() => {
    const handleUpdate = () => {
      try {
        const stored = localStorage.getItem('PLATFORM_DATA');
        if (stored) setPlatformData(JSON.parse(stored));
      } catch(e) {}
    };
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => window.removeEventListener('settingsUpdated', handleUpdate);
  }, []);

  const [forceMajeureBooking, setForceMajeureBooking] = useState<any | null>(null);
  const [isForceMajeure, setIsForceMajeure] = useState(false);
  const [fmReason, setFmReason] = useState('');
  const [fmDocs, setFmDocs] = useState<string[]>([]);
  const [isUploadingFmDoc, setIsUploadingFmDoc] = useState(false);

  const getFinancialSettings = () => {
    try {
      const stored = localStorage.getItem('SYSTEM_FINANCIAL_SETTINGS');
      return stored ? JSON.parse(stored) : { enableForceMajeureProtocol: true, forceMajeureWindowDays: 7 };
    } catch {
      return { enableForceMajeureProtocol: true, forceMajeureWindowDays: 7 };
    }
  };

  const checkForceMajeureWindow = (booking: any) => {
    try {
      if (!booking) return false;
      const dateVal = booking.rawDate || booking.startTime || booking.startDate || booking.date;
      if (!dateVal) return false;

      const parsedDate = new Date(dateVal);
      if (isNaN(parsedDate.getTime())) return false;

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      parsedDate.setHours(0, 0, 0, 0);

      const diffTime = parsedDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const settings = getFinancialSettings();
      const windowDays = settings.forceMajeureWindowDays ?? 7;

      const withinWindow = diffDays <= windowDays && diffDays >= 0;

      let graceLapsed = true;
      if (booking.createdAt) {
        const createdTime = new Date(booking.createdAt).getTime();
        const hrsSinceCreation = (new Date().getTime() - createdTime) / (1000 * 60 * 60);
        graceLapsed = hrsSinceCreation >= 24;
      }

      return withinWindow && graceLapsed;
    } catch {
      return false;
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  const totalBookingsCount = realBookings.length;
  const confirmedCount = realBookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = realBookings.filter(b => b.status === 'pending').length;
  const totalSpent = realBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total || 0), 0);

  const filteredBookings = realBookings.filter(booking => {
    const hallName = booking.hall?.name || '';
    const hallCity = booking.hall?.city || '';
    const notesStr = booking.notes || '';
    const dateStr = booking.date || '';
    
    const matchesSearch = 
      hallName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      hallCity.toLowerCase().includes(searchQuery.toLowerCase()) || 
      dateStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notesStr.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesStatus = selectedStatusFilter === 'all' || booking.status === selectedStatusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleOpenEditModal = (booking: any) => {
    setEditingBooking(booking);
    setEditDate(booking.rawDate || '');
    setEditPeriod(booking.period || 'مسائي');
    setEditNotes(booking.notes || '');
    const servicesList = booking.extraServices 
      ? String(booking.extraServices).split(/[،,]/).map(s => s.trim()).filter(Boolean)
      : [];
    setEditServices(servicesList);
    setEditTotal(booking.total || 0);
  };

  const handleServiceToggle = (srvName: string, srvPrice: number) => {
    setEditServices(prev => {
      const isSelected = prev.some(s => s.trim().toLowerCase() === srvName.trim().toLowerCase());
      if (isSelected) {
        setEditTotal(t => Math.max(0, t - srvPrice));
        return prev.filter(s => s.trim().toLowerCase() !== srvName.trim().toLowerCase());
      } else {
        setEditTotal(t => t + srvPrice);
        return [...prev, srvName];
      }
    });
  };

  const handleOpenCancelModal = (booking: any) => {
    setCancellingBooking(booking);
    setIsForceMajeure(false);
    setFmReason('');
    setFmDocs([]);
  };

  const handleFmFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setIsUploadingFmDoc(true);

    try {
      const file = files[0];
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        const data = await res.json();
        if (data.url) {
          setFmDocs(prev => [...prev, data.url]);
          toast.success('تم رفع المستند الثبوتي بنجاح');
        } else {
          toast.error('لم يتم استلام رابط الملف من السيرفر');
        }
      } else {
        toast.error('فشل رفع المستند الثبوتي');
      }
    } catch(err: any) {
      toast.error(err.message || 'خطأ أثناء الرفع');
    } finally {
      setIsUploadingFmDoc(false);
    }
  };

  const handleRequestBookingInvoiceView = (booking: any) => {
    setViewingInvoice(booking);
    handleRequestInvoice(String(booking.id));
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const updatedBookings = realBookings.map(b => 
      b.id === editingBooking.id ? { 
        ...b, 
        date: formatDateWithHijri(editDate), 
        rawDate: editDate,
        period: editPeriod,
        notes: editNotes,
        extraServices: editServices.join('، '),
        total: editTotal
      } : b
    );
    setRealBookings(updatedBookings);

    fetch(`/api/bookings/${editingBooking.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date: formatDateWithHijri(editDate),
        rawDate: editDate,
        period: editPeriod,
        notes: editNotes,
        extraServices: editServices.join('، '),
        total: editTotal
      })
    }).catch(err => console.warn('Sync booking edit failed:', err));

    localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
    window.dispatchEvent(new Event('storage'));
    toast.success('تم حفظ وتحديث بيانات الحجز والخدمات المساندة بنجاح ✨');
    setEditingBooking(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;

    if (isForceMajeure) {
      if (!fmReason.trim()) {
        toast.error('الرجاء كتابة سبب الإلغاء بدقة لتسجيل طلب القوة القاهرة');
        return;
      }
      if (fmDocs.length === 0) {
        toast.error('الرجاء إرفاق مستند رسمي واحد على الأقل يثبت القوة القاهرة');
        return;
      }

      try {
        const res = await fetch('/api/bookings/force-majeure', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookingId: cancellingBooking.id,
            reason: fmReason,
            documents: fmDocs
          })
        });

        const data = await res.json();
        if (res.ok) {
          toast.success(data.message || 'تم تقديم طلب القوة القاهرة بنجاح وبانتظار البت من اللجنة المفوضة.');
          setCancellingBooking(null);
          setFmReason('');
          setFmDocs([]);
        } else {
          toast.error(data.error || 'خطأ أثناء تقديم الطلب');
        }
      } catch(err: any) {
        toast.error(err.message || 'فشلت معالجة الطلب');
      }
      return;
    }

    const updatedBookings = realBookings.map(b => 
      b.id === cancellingBooking.id ? { ...b, status: 'cancelled' } : b
    );
    setRealBookings(updatedBookings);

    fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    }).catch(err => console.warn('Sync cancel failed:', err));

    localStorage.setItem('userBookings', JSON.stringify(updatedBookings));
    window.dispatchEvent(new Event('storage'));
    toast.error('تم إلغاء الحجز وتحديث حالته بنجاح');
    setCancellingBooking(null);
  };

  useEffect(() => {
    const fetchBookings = async () => {
      let finalBookings: any[] = [];
      const userStr = localStorage.getItem('currentUser');
      let activeUserId = 'USER-123';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          activeUserId = user.id || user.uid || 'USER-123';
        } catch(e) {}
      }

      try {
        const res = await fetch('/api/bookings');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped = data.map((item: any) => ({
              id: item.id,
              userId: item.userId || activeUserId,
              hall: item.hall || {
                id: item.hallId || 1,
                name: item.hallName || 'قاعة الأحلام والمناسبات',
                image: item.hallImage || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&q=80',
                location: item.location || 'الرياض، حي الياسمين',
                city: item.city || 'الرياض',
                capacity: item.capacity || '100-300 شخص',
                price: item.total || item.price || 15000,
                rating: 4.8,
                provider: item.providerName || 'شركة القاعات الملكية'
              },
              date: item.date || formatDateWithHijri(item.rawDate || new Date().toISOString().split('T')[0]),
              rawDate: item.rawDate || new Date().toISOString().split('T')[0],
              createdAt: item.createdAt || new Date().toISOString(),
              period: item.period || 'مسائي',
              status: item.status || 'confirmed',
              total: item.total || 15000,
              extraServices: item.extraServices || '',
              notes: item.notes || '',
              paymentDeadline: item.paymentDeadline || null,
              paymentStatus: item.paymentStatus || 'paid_full',
              communications: item.communications || [
                { type: 'email', to: 'customer', title: 'تأكيد الحجز والدفع الفوري', date: 'اليوم', content: 'تم استلام وتأكيد حجزكم بنجاح عبر منصة ليلة.' }
              ]
            }));
            finalBookings = mapped;
          }
        }
      } catch (e) {
        console.warn('API Bookings fetch failed, checking local storage...');
      }

      const storedUserBookings = localStorage.getItem('userBookings');
      if (storedUserBookings) {
        try {
          const parsed = JSON.parse(storedUserBookings);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const existingIds = new Set(finalBookings.map(b => String(b.id)));
            parsed.forEach((b: any) => {
              if (!existingIds.has(String(b.id))) {
                finalBookings.unshift(b);
              }
            });
          }
        } catch (e) {}
      }

      if (finalBookings.length === 0) {
        finalBookings = fallbackMockBookings.map(b => ({ ...b, userId: activeUserId }));
      }

      finalBookings = finalBookings.filter(b => b.userId === activeUserId);
      setRealBookings(finalBookings);
    };

    fetchBookings();

    const handleStorageChange = () => fetchBookings();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('bookings_updated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('bookings_updated', handleStorageChange);
    };
  }, []);

  // ----------------------------------------------------
  // SERVICE REQUESTS STATE & LOGIC
  // ----------------------------------------------------
  const [serviceRequests, setServiceRequests] = useState<any[]>([]);
  const [serviceActiveTab, setServiceActiveTab] = useState<'all' | 'confirmed' | 'pending' | 'cancelled_or_rejected'>('all');
  const [serviceSearchQuery, setServiceSearchQuery] = useState('');
  const [serviceStatusFilter, setServiceStatusFilter] = useState<string[]>([]);
  const [serviceSortOrder, setServiceSortOrder] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
  const [isServiceFilterMenuOpen, setIsServiceFilterMenuOpen] = useState(false);
  const [expandedServiceRequest, setExpandedServiceRequest] = useState<number | string | null>(null);
  const [isServiceInvoiceOpen, setIsServiceInvoiceOpen] = useState(false);
  const [viewingRequestForInvoice, setViewingRequestForInvoice] = useState<any>(null);

  useEffect(() => {
    const loadRequests = () => {
      const saved = localStorage.getItem('SUPPORT_SERVICE_REQUESTS');
      const userStr = localStorage.getItem('currentUser');
      if (saved) {
        let filtered = JSON.parse(saved);
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            const userId = user.id || user.uid || 'USER-123';
            filtered = filtered.filter((req: any) => req.userId === userId);
          } catch (e) {}
        }
        setServiceRequests(filtered);
      }
    };

    loadRequests();

    window.addEventListener('storage', loadRequests);
    window.addEventListener('service-requests-updated', loadRequests);

    return () => {
      window.removeEventListener('storage', loadRequests);
      window.removeEventListener('service-requests-updated', loadRequests);
    };
  }, []);

  const confirmedStatuses = ['جاري التنفيذ', 'قيد التنفيذ', 'مؤكد', 'مكتمل', 'مجدول', 'تم القبول', 'تمت الموافقة', 'موافق', 'مقبول'];
  const pendingStatuses = ['قيد الانتظار', 'جديد', 'انتظار', 'قيد المراجعة', 'بانتظار الموافقة', 'جاري المراجعة'];
  const cancelledStatuses = ['ملغى', 'مرفوض', 'ملغي', 'مسترجع'];

  const confirmedServiceCount = useMemo(() => {
    return serviceRequests.filter(req => confirmedStatuses.includes(req.status)).length;
  }, [serviceRequests]);

  const pendingServiceCount = useMemo(() => {
    return serviceRequests.filter(req => pendingStatuses.includes(req.status)).length;
  }, [serviceRequests]);

  const cancelledServiceCount = useMemo(() => {
    return serviceRequests.filter(req => cancelledStatuses.includes(req.status)).length;
  }, [serviceRequests]);

  const totalServiceValue = useMemo(() => {
    return serviceRequests
      .filter(req => confirmedStatuses.includes(req.status))
      .reduce((sum, req) => sum + (Number(req.price) || 0), 0);
  }, [serviceRequests]);

  const allServiceCount = serviceRequests.length;

  const getServiceStatusInfo = (status: string) => {
    if (['مكتمل'].includes(status)) {
      return { text: 'مؤكد/مكتمل', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> };
    }
    if (['جاري التنفيذ', 'قيد التنفيذ'].includes(status)) {
      return { text: 'مؤكد / جاري العمل', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <Clock className="w-5 h-5 text-blue-500" /> };
    }
    if (confirmedStatuses.includes(status)) {
      return { text: 'مقبول / مؤكد', color: 'text-teal-600', bg: 'bg-teal-50', border: 'border-teal-200', icon: <CheckCircle2 className="w-5 h-5 text-teal-500" /> };
    }
    if (pendingStatuses.includes(status)) {
      return { text: 'قيد الانتظار / المراجعة', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertCircle className="w-5 h-5 text-amber-500" /> };
    }
    if (cancelledStatuses.includes(status)) {
      return { text: 'ملغى أو مرفوض', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle className="w-5 h-5 text-red-500" /> };
    }
    return { text: status, color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: null };
  };

  const filteredServiceRequests = useMemo(() => {
    let result = [...serviceRequests];

    if (serviceActiveTab === 'confirmed') {
      result = result.filter(req => confirmedStatuses.includes(req.status));
    } else if (serviceActiveTab === 'pending') {
      result = result.filter(req => pendingStatuses.includes(req.status));
    } else if (serviceActiveTab === 'cancelled_or_rejected') {
      result = result.filter(req => cancelledStatuses.includes(req.status));
    }

    if (serviceSearchQuery) {
      const q = serviceSearchQuery.toLowerCase();
      result = result.filter(req => 
        (req.serviceName && req.serviceName.toLowerCase().includes(q)) || 
        (req.providerName && req.providerName.toLowerCase().includes(q)) ||
        (req.id && req.id.toString().includes(q)) ||
        (req.bookingId && req.bookingId.toString().includes(q))
      );
    }

    if (serviceStatusFilter.length > 0) {
      result = result.filter(req => serviceStatusFilter.includes(req.status));
    }

    result.sort((a, b) => {
      if (serviceSortOrder === 'newest') return b.id - a.id;
      if (serviceSortOrder === 'oldest') return a.id - b.id;
      if (serviceSortOrder === 'price-high') return (b.price || 0) - (a.price || 0);
      if (serviceSortOrder === 'price-low') return (a.price || 0) - (b.price || 0);
      return 0;
    });

    return result;
  }, [serviceRequests, serviceSearchQuery, serviceStatusFilter, serviceSortOrder, serviceActiveTab]);

  const toggleServiceStatusFilter = (status: string) => {
    setServiceStatusFilter(prev => 
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const openProviderChat = (e: React.MouseEvent, providerName: string, serviceName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatData({ providerName, hallName: serviceName });
    setIsProviderChatOpen(true);
  };

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'confirmed':
        return { text: 'مؤكد ورسمي', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> };
      case 'pending':
        return { text: 'قيد التجهيز والمراجعة', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <Clock className="w-3.5 h-3.5 text-amber-500 animate-pulse" /> };
      case 'cancelled':
        return { text: 'ملغى ومسترجع', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle className="w-3.5 h-3.5 text-red-500" /> };
      default:
        return { text: 'جديد', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: <AlertCircle className="w-3.5 h-3.5 text-blue-500" /> };
    }
  };

  // Render Expanded Hall Booking Details
  const renderExpandedDetails = (booking: any) => (
    <div className="border-t border-slate-100 bg-slate-50/50 p-4 md:p-6 space-y-6 text-right" dir="rtl">
      
      <PaymentDeadlineAlert booking={booking} />

      <div className="bg-white p-4 md:p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-bold">مزود الخدمة والشريك</p>
            <p className="text-sm font-extrabold text-blue-950 flex items-center gap-1.5 mt-0.5">
              {getDisplayedProviderName(booking.hall)}
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium">موثوق ✅</span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button 
            onClick={(e) => openProviderChat(e, booking.hall?.provider || 'مزود القاعة', booking.hall?.name || 'القاعة')}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4 text-amber-400" />
            <span>محادثة المزود</span>
          </button>

          <button 
            onClick={() => handleRequestBookingInvoiceView(booking)}
            className="flex-1 sm:flex-initial px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-blue-950 text-xs font-extrabold transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>عرض الفاتورة الضريبية</span>
          </button>

          {booking.status !== 'cancelled' && (
            <button 
              onClick={() => handleOpenEditModal(booking)}
              className="px-3 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>تعديل الحجز</span>
            </button>
          )}

          {booking.status !== 'cancelled' && (
            <button 
              onClick={() => handleOpenCancelModal(booking)}
              className="px-3 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>إلغاء</span>
            </button>
          )}

          {isBookingPast(booking) && booking.status === 'confirmed' && (
            <button 
              onClick={() => {
                setSelectedBookingForReview(booking);
                setIsReviewModalOpen(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-blue-950 text-xs font-extrabold transition-all shadow-md flex items-center justify-center gap-1.5"
            >
              <Star className="w-4 h-4 text-blue-950 fill-blue-950" />
              <span>تقييم التجربة</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h4 className="font-bold text-blue-950 mb-3 flex items-center gap-2 text-sm">
            <Receipt className="w-4 h-4 text-amber-500" /> تفاصيل الحجز
          </h4>
          <div className="bg-white rounded-xl p-4 border border-slate-100 space-y-2.5 text-xs">
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">رقم الحجز:</span>
              <span className="font-bold text-slate-800 font-mono">#{formatBookingId(booking.id)}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">المكان:</span>
              <span className="font-bold text-slate-800">{booking.hall?.name}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">التاريخ المحجوز:</span>
              <span className="font-bold text-slate-800">{booking.date}</span>
            </div>
            <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">الفترة:</span>
              <span className="font-bold text-amber-600">{booking.period}</span>
            </div>
            {booking.extraServices && (
              <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">الخدمات الإضافية:</span>
                <span className="font-bold text-indigo-700">{booking.extraServices}</span>
              </div>
            )}
            <div className="flex justify-between pt-1">
              <span className="text-slate-500 font-bold">الإجمالي المعتمد:</span>
              <span className="font-extrabold text-amber-500 text-sm">{booking.total?.toLocaleString()} ر.س</span>
            </div>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-blue-950 mb-3 flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-blue-500" /> سجل المراسلات والتحديثات
          </h4>
          <div className="bg-white rounded-xl p-3 border border-slate-100 space-y-2 text-xs max-h-48 overflow-y-auto">
            {booking.communications && booking.communications.map((comm: any, idx: number) => (
              <div key={idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100/60">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    {comm.type === 'email' ? <Mail className="w-3.5 h-3.5 text-amber-500" /> : <MessageSquare className="w-3.5 h-3.5 text-emerald-500" />}
                    {comm.title}
                  </span>
                  <span className="text-[10px] text-slate-400">{comm.date}</span>
                </div>
                <p className="text-slate-600 leading-relaxed text-[11px]">{comm.content}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Render Service Request Expanded Details
  const renderServiceExpandedDetails = (request: any) => (
    <div className="border-t border-slate-100 bg-slate-50 p-6 grid grid-cols-1 md:grid-cols-2 gap-8 text-right" dir="rtl">
      <div>
        <h4 className="font-bold text-blue-950 mb-4 flex items-center gap-2">
          <Receipt className="w-5 h-5 text-amber-500" /> معلومات الخدمة والطلب
        </h4>
        <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-3 text-sm shadow-sm">
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-bold">رقم الطلب:</span>
              <span className="font-bold text-slate-800 font-mono tracking-tight">{formatServiceRequestId(request.id)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500 font-bold">رقم الفاتورة:</span>
              <span className="font-bold text-indigo-600 font-mono tracking-tight">{formatInvoiceId(request.id)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">مزود الخدمة:</span>
              <span className="font-bold text-slate-800 flex items-center gap-2">
                 {request.providerName}
                 <button onClick={(e) => openProviderChat(e, request.providerName, request.serviceName)} className="text-blue-600 hover:text-blue-700 transition-colors p-1 cursor-pointer">
                    <MessageCircle className="w-5 h-5" />
                 </button>
              </span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">اسم الخدمة:</span>
              <span className="font-bold text-slate-800">{request.serviceName}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">التاريخ المجدول:</span>
              <span className="font-bold text-slate-800">{formatDateWithHijri(request.date)}</span>
           </div>
           <div className="flex justify-between border-b border-slate-50 pb-2">
              <span className="text-slate-500">الكمية/العدد:</span>
              <span className="font-bold text-slate-800">{request.quantity || 1}</span>
           </div>
           <div className="flex justify-between">
              <span className="text-slate-500">طريقة الدفع:</span>
              <span className="font-bold text-slate-800">{request.paymentMethod === 'bank_transfer' ? 'تحويل بنكي' : 'بطاقة / Apple Pay'}</span>
           </div>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-blue-950 mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" /> الحالة والمتابعة
        </h4>
        <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-4 shadow-sm">
           <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${getServiceStatusInfo(request.status).bg}`}>
                 {getServiceStatusInfo(request.status).icon}
              </div>
              <div>
                <p className="text-xs text-slate-500 mb-1">حالة الطلب الحالية:</p>
                <p className={`font-bold ${getServiceStatusInfo(request.status).color}`}>{getServiceStatusInfo(request.status).text}</p>
              </div>
           </div>
           
           <div className="pt-4 border-t border-slate-50 space-y-2">
              <p className="text-xs text-slate-400 leading-relaxed">
                * يمكنك التواصل المباشر مع مزود الخدمة لأي استفسارات إضافية حول طلبك.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                 <button 
                  onClick={() => {
                    setViewingRequestForInvoice(request);
                    setIsServiceInvoiceOpen(true);
                  }}
                  className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                 >
                    عرض الفاتورة
                 </button>
                 {request.status === 'مكتمل' && (
                   <button 
                    onClick={() => handleRequestServiceInvoice(request.id)}
                    className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-sm cursor-pointer"
                   >
                      طلب فاتورة
                   </button>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 w-full py-8 md:py-12">
        
        {/* Main Header */}
        <div className="flex flex-col gap-2 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-blue-950 border-r-4 border-amber-500 pr-4">
                حجوزات وطلبات المناسبات
              </h1>
              <p className="text-slate-500 pr-5 mt-1 text-xs md:text-sm font-medium">
                إدارة مخصصة وشاملة لحجوزات القاعات والأماكن وطلبات الخدمات المساندة لمناسباتك
              </p>
            </div>
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>

          {/* Main Top Navigation Segmented Switcher Tabs */}
          <div className="mt-6 bg-white p-2 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={() => handleMainTabChange('halls')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-black text-sm md:text-base transition-all cursor-pointer ${
                mainTab === 'halls'
                  ? 'bg-blue-950 text-white shadow-md shadow-blue-950/20 scale-[1.01]'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className={`w-5 h-5 ${mainTab === 'halls' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>حجوزات الأماكن والقاعات</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                mainTab === 'halls' ? 'bg-amber-400 text-blue-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {totalBookingsCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleMainTabChange('services')}
              className={`flex-1 flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-black text-sm md:text-base transition-all cursor-pointer ${
                mainTab === 'services'
                  ? 'bg-blue-950 text-white shadow-md shadow-blue-950/20 scale-[1.01]'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Sparkles className={`w-5 h-5 ${mainTab === 'services' ? 'text-amber-400' : 'text-slate-400'}`} />
              <span>طلبات الخدمات المساندة</span>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                mainTab === 'services' ? 'bg-amber-400 text-blue-950' : 'bg-slate-200 text-slate-700'
              }`}>
                {serviceRequests.length}
              </span>
            </button>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* TAB 1: HALL & VENUE BOOKINGS */}
        {/* ------------------------------------------------------------------ */}
        {mainTab === 'halls' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            
            {/* Bento Statistics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-2">
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="p-3 bg-blue-50 text-blue-950 rounded-xl">
                  <Calendar className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">إجمالي الحجوزات</p>
                  <p className="text-2xl font-black text-blue-950 mt-0.5">{totalBookingsCount}</p>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">حجوزات مؤكدة</p>
                  <p className="text-2xl font-black text-emerald-600 mt-0.5">{confirmedCount}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">قيد المراجعة والطلب</p>
                  <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingCount}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">إجمالي الاستثمار</p>
                  <p className="text-xl md:text-2xl font-black text-indigo-600 mt-0.5">{totalSpent.toLocaleString()} ر.س</p>
                </div>
              </div>
            </div>

            {/* Segmented Filter Tabs */}
            <div className="bg-white p-3 rounded-2xl border border-slate-150 shadow-sm mb-4 flex flex-wrap gap-3 items-center">
              <span className="text-xs text-slate-400 font-bold px-3 hidden sm:inline">تصفية حسب الحالة:</span>
              <div className="flex flex-wrap gap-2 flex-grow sm:flex-grow-0 w-full sm:w-auto">
                {[
                  { value: 'all', label: 'الكل', count: realBookings.length },
                  { value: 'confirmed', label: 'مؤكدة', count: realBookings.filter(b => b.status === 'confirmed').length },
                  { value: 'pending', label: 'معلقة', count: realBookings.filter(b => b.status === 'pending').length },
                  { value: 'cancelled', label: 'ملغاة', count: realBookings.filter(b => b.status === 'cancelled').length }
                ].map(tab => (
                  <button
                    key={tab.value}
                    type="button"
                    onClick={() => setSelectedStatusFilter(tab.value)}
                    className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                      selectedStatusFilter === tab.value
                        ? 'bg-blue-950 text-white border-blue-950 shadow-md transform scale-[1.01]'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span>{tab.label}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] md:text-[10px] font-bold ${selectedStatusFilter === tab.value ? 'bg-amber-500 text-blue-950' : 'bg-slate-100 text-slate-500'}`}>
                      {tab.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Realtime Search Input */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm mb-6">
              <div className="relative w-full">
                <span className="absolute right-4 top-3 text-slate-400 text-base">🔍</span>
                <input
                  type="text"
                  placeholder="ابحث باسم القاعة، المدينة، التاريخ، البنود، الملاحظات..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-11 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all bg-slate-50 text-slate-700 font-sans text-xs md:text-sm shadow-inner"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute left-3 top-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-sans transition-all cursor-pointer"
                  >
                    مسح البحث
                  </button>
                )}
              </div>
            </div>

            {/* Main List & Table Body */}
            {filteredBookings.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-100 p-12 md:p-16 text-center shadow-sm animate-in fade-in duration-200">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Calendar className="w-8 h-8 md:w-10 md:h-10 text-slate-400" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-2">لا توجد حجوزات قاعات تطابق خيارات الاستعلام</h3>
                <p className="text-slate-500 text-xs md:text-sm max-w-sm mx-auto mb-6 leading-relaxed">
                  يرجى تعديل مصطلح البحث الخاص بك أو اختيار تبويب تصفية آخر لاستعراض حجزك.
                </p>
                {(searchQuery || selectedStatusFilter !== 'all') && (
                  <button
                    type="button"
                    onClick={() => { setSearchQuery(''); setSelectedStatusFilter('all'); }}
                    className="bg-amber-500 hover:bg-amber-600 text-blue-950 font-bold px-5 py-2.5 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                  >
                    إعادة ضبط خيارات التصفية
                  </button>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
                <table className="w-full text-right text-sm text-slate-600 min-w-[700px]">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">رقم الحجز</th>
                      <th className="px-6 py-4 font-bold">المكان</th>
                      <th className="px-6 py-4 font-bold">التاريخ والوقت</th>
                      <th className="px-6 py-4 font-bold">الحالة</th>
                      <th className="px-6 py-4 font-bold">القيمة الكلية</th>
                      <th className="px-6 py-4 font-bold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map(booking => {
                      const statusInfo = getStatusInfo(booking.status);
                      const isExpanded = expandedBooking === booking.id;
                      return (
                        <React.Fragment key={booking.id}>
                          <tr 
                            className="border-b border-slate-50 hover:bg-slate-50/50 cursor-pointer transition-colors" 
                            onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                          >
                            <td className="px-6 py-4 font-bold text-slate-500 font-mono text-xs">#{formatBookingId(booking.id)}</td>
                            <td className="px-6 py-4 font-bold text-blue-950">
                              <div className="flex items-center gap-3">
                                <img src={booking.hall?.image} alt={booking.hall?.name} className="w-10 h-10 rounded-lg object-cover border border-slate-100" />
                                <div className="flex flex-col">
                                  <span className="text-sm">{booking.hall?.name}</span>
                                  <span className="text-[10px] text-slate-400 font-normal">{booking.hall?.city}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 text-xs">{booking.date} - <span className="font-bold text-amber-600">{booking.period}</span></td>
                            <td className="px-6 py-4">
                              <div className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1 border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                {statusInfo.icon} {statusInfo.text}
                              </div>
                            </td>
                            <td className="px-6 py-4 font-black text-amber-500 font-sans text-sm">{booking.total?.toLocaleString()} ر.س</td>
                            <td className="px-6 py-4 text-center">
                              <button className="text-slate-400 hover:text-amber-500 transition-all flex items-center justify-center gap-1 font-bold text-xs mx-auto">
                                التفاصيل
                                <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>
                            </td>
                          </tr>
                          {isExpanded && (
                            <tr>
                              <td colSpan={6} className="p-0 border-b border-slate-100 bg-slate-50/40">
                                {renderExpandedDetails(booking)}
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={viewMode === 'list' ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 gap-6"}>
                {filteredBookings.map(booking => {
                  const statusInfo = getStatusInfo(booking.status);
                  const isExpanded = expandedBooking === booking.id;

                  return (
                    <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden transition-all hover:border-slate-200">
                      <div 
                        className={`p-4 md:p-6 flex ${viewMode === 'list' ? 'flex-col md:flex-row' : 'flex-col'} justify-between gap-4 md:gap-6 cursor-pointer hover:bg-slate-50 transition-colors`}
                        onClick={() => setExpandedBooking(isExpanded ? null : booking.id)}
                      >
                        <div className={`flex items-center gap-4 md:gap-6 ${viewMode === 'list' ? 'w-full md:w-auto' : 'w-full'}`}>
                          <div className="w-20 h-20 md:w-24 md:h-24 rounded-xl overflow-hidden flex-shrink-0 border border-slate-100">
                            <img src={booking.hall?.image} alt={booking.hall?.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-slate-500 font-mono tracking-tight">#{formatBookingId(booking.id)}</span>
                              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                {statusInfo.text}
                              </div>
                            </div>
                            <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-1.5 truncate">{booking.hall?.name}</h3>
                            <p className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5 text-slate-400" /> {booking.date}</span>
                              <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-slate-400" /> {booking.period}</span>
                            </p>
                          </div>
                        </div>

                        <div className={`w-full ${viewMode === 'list' ? 'md:w-auto md:flex-col md:items-end' : 'flex-row items-center border-t border-slate-100 pt-4 mt-2'} flex justify-between items-center md:justify-center gap-2`}>
                          <div className={viewMode === 'list' ? "text-right" : ""}>
                            <p className="text-[10px] text-slate-400 font-bold mb-0.5">القيمة الكلية</p>
                            <p className="text-lg md:text-xl font-black text-amber-500 font-sans">{booking.total?.toLocaleString()} ر.س</p>
                          </div>
                          <button className="text-slate-400 hover:text-amber-500 transition-all flex items-center gap-1 font-bold text-xs mt-auto">
                            التفاصيل والمراسلات
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                      </div>

                      {isExpanded && renderExpandedDetails(booking)}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Ad Banner - أسفل تفاصيل الحجز */}
            <div className="pt-6">
              <AdBanner 
                placement="أسفل تفاصيل الحجز" 
                layout="card" 
                className="w-full shadow-sm hover:shadow-md transition-shadow" 
              />
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* TAB 2: SERVICE REQUESTS */}
        {/* ------------------------------------------------------------------ */}
        {mainTab === 'services' && (
          <div className="animate-in fade-in duration-300 space-y-6">

            {/* Bento Statistics Grid for Service Requests */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-2">
              <div 
                onClick={() => setServiceActiveTab('all')}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group"
              >
                <div className="p-3 bg-blue-50 text-blue-950 rounded-xl group-hover:scale-105 transition-transform">
                  <PackageSearch className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">إجمالي طلبات الخدمات</p>
                  <p className="text-2xl font-black text-blue-950 mt-0.5">{allServiceCount}</p>
                </div>
              </div>
              
              <div 
                onClick={() => setServiceActiveTab('confirmed')}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group"
              >
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:scale-105 transition-transform">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">مؤكدة وقيد التنفيذ</p>
                  <p className="text-2xl font-black text-emerald-600 mt-0.5">{confirmedServiceCount}</p>
                </div>
              </div>

              <div 
                onClick={() => setServiceActiveTab('pending')}
                className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md cursor-pointer group"
              >
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:scale-105 transition-transform">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">قيد الانتظار والمراجعة</p>
                  <p className="text-2xl font-black text-amber-600 mt-0.5">{pendingServiceCount}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-4 transition-all hover:shadow-md">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                  <Receipt className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 font-bold">إجمالي قيمة الخدمات المنفذة</p>
                  <p className="text-xl md:text-2xl font-black text-indigo-600 mt-0.5">{totalServiceValue.toLocaleString()} ر.س</p>
                </div>
              </div>
            </div>

            {/* Service Filter Toolbar & Subtabs */}
            <div className="bg-white rounded-2xl border border-slate-150 p-2 shadow-sm flex flex-wrap gap-2 items-center justify-between">
              <div className="flex flex-wrap gap-2 flex-grow">
                <button
                  onClick={() => setServiceActiveTab('all')}
                  className={`flex-1 min-w-[100px] sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    serviceActiveTab === 'all'
                      ? 'bg-slate-900 text-white shadow-md'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span>الكل</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    serviceActiveTab === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {allServiceCount}
                  </span>
                </button>

                <button
                  onClick={() => setServiceActiveTab('confirmed')}
                  className={`flex-1 min-w-[130px] sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    serviceActiveTab === 'confirmed'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'text-slate-600 hover:text-emerald-600 hover:bg-emerald-50/50'
                  }`}
                >
                  <CheckCircle2 className={`w-3.5 h-3.5 ${serviceActiveTab === 'confirmed' ? 'text-white' : 'text-emerald-500'}`} />
                  <span>الطلبات المؤكدة</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    serviceActiveTab === 'confirmed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {confirmedServiceCount}
                  </span>
                </button>

                <button
                  onClick={() => setServiceActiveTab('pending')}
                  className={`flex-1 min-w-[130px] sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    serviceActiveTab === 'pending'
                      ? 'bg-amber-500 text-white shadow-md'
                      : 'text-slate-600 hover:text-amber-600 hover:bg-amber-50/50'
                  }`}
                >
                  <AlertCircle className={`w-3.5 h-3.5 ${serviceActiveTab === 'pending' ? 'text-white' : 'text-amber-500'}`} />
                  <span>قيد الانتظار</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    serviceActiveTab === 'pending' ? 'bg-white/20 text-white' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {pendingServiceCount}
                  </span>
                </button>

                <button
                  onClick={() => setServiceActiveTab('cancelled_or_rejected')}
                  className={`flex-1 min-w-[130px] sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                    serviceActiveTab === 'cancelled_or_rejected'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'text-slate-600 hover:text-red-650 hover:bg-red-50/50'
                  }`}
                >
                  <XCircle className={`w-3.5 h-3.5 ${serviceActiveTab === 'cancelled_or_rejected' ? 'text-white' : 'text-red-500'}`} />
                  <span>الملغاة أو المرفوضة</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    serviceActiveTab === 'cancelled_or_rejected' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-700'
                  }`}>
                    {cancelledServiceCount}
                  </span>
                </button>
              </div>

              {/* Filter Button */}
              <div className="relative shrink-0">
                <button 
                  onClick={() => setIsServiceFilterMenuOpen(!isServiceFilterMenuOpen)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${isServiceFilterMenuOpen || serviceStatusFilter.length > 0 ? 'bg-amber-50 border-amber-200 text-amber-600' : 'bg-white border-slate-200 text-slate-500'}`}
                >
                  <Filter className="w-4 h-4" />
                </button>

                {isServiceFilterMenuOpen && (
                  <div className="absolute left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="font-bold text-blue-950 text-sm">تصفية نتائج الخدمات</h3>
                      <button onClick={() => { setServiceStatusFilter([]); setServiceSearchQuery(''); }} className="text-xs text-blue-600 hover:underline cursor-pointer">إعادة ضبط</button>
                    </div>
                    
                    <div className="space-y-4 text-right" dir="rtl">
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">حالة الطلب</p>
                        <div className="flex flex-wrap gap-2">
                          {['قيد الانتظار', 'قيد التنفيذ', 'مكتمل', 'ملغى'].map(status => (
                            <button 
                              key={status}
                              onClick={() => toggleServiceStatusFilter(status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${serviceStatusFilter.includes(status) ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'}`}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      <div>
                        <p className="text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">الترتيب</p>
                        <select 
                          value={serviceSortOrder}
                          onChange={(e) => setServiceSortOrder(e.target.value as any)}
                          className="w-full bg-slate-50 border border-slate-100 rounded-lg px-3 py-2 text-xs text-slate-700 outline-none focus:border-amber-500"
                        >
                          <option value="newest">الأحدث أولاً</option>
                          <option value="oldest">الأقدم أولاً</option>
                          <option value="price-high">السعر: من الأعلى</option>
                          <option value="price-low">السعر: من الأقل</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Service Search Bar */}
            <div className="bg-white p-4 rounded-2xl border border-slate-150 shadow-sm">
              <div className="relative w-full">
                <span className="absolute right-4 top-3 text-slate-400 text-base">🔍</span>
                <input
                  type="text"
                  placeholder="ابحث برقم الطلب، اسم الخدمة، اسم مزود الخدمة..."
                  value={serviceSearchQuery}
                  onChange={(e) => setServiceSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-11 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all bg-slate-50 text-slate-700 font-sans text-xs md:text-sm shadow-inner"
                />
                {serviceSearchQuery && (
                  <button 
                    type="button"
                    onClick={() => setServiceSearchQuery('')}
                    className="absolute left-3 top-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-sans transition-all cursor-pointer"
                  >
                    مسح البحث
                  </button>
                )}
              </div>
            </div>

            {/* Service Request Items Rendering */}
            {filteredServiceRequests.length > 0 ? (
              viewMode === 'table' ? (
                <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
                  <table className="w-full text-right text-sm text-slate-600">
                    <thead className="bg-slate-50 border-b border-slate-100 text-slate-800 text-sm">
                      <tr>
                        <th className="px-6 py-4 font-bold">رقم الطلب</th>
                        <th className="px-6 py-4 font-bold">الخدمة</th>
                        <th className="px-6 py-4 font-bold">المزود</th>
                        <th className="px-6 py-4 font-bold">التاريخ</th>
                        <th className="px-6 py-4 font-bold">الحالة</th>
                        <th className="px-6 py-4 font-bold">إجمالي المبلغ</th>
                        <th className="px-6 py-4 font-bold text-center">إجراء</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {filteredServiceRequests.map(request => {
                        const statusInfo = getServiceStatusInfo(request.status);
                        const isExpanded = expandedServiceRequest === request.id;
                        return (
                          <React.Fragment key={request.id}>
                            <tr 
                              className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                              onClick={() => setExpandedServiceRequest(isExpanded ? null : request.id)}
                            >
                              <td className="px-6 py-4 font-mono text-xs text-slate-400">{formatServiceRequestId(request.id)}</td>
                              <td className="px-6 py-4 font-bold text-blue-950">{request.serviceName}</td>
                              <td className="px-6 py-4">{request.providerName}</td>
                              <td className="px-6 py-4">{formatDateWithHijri(request.date)}</td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                  {statusInfo.text}
                                </span>
                              </td>
                              <td className="px-6 py-4 font-bold text-amber-500">{request.price} ر.س</td>
                              <td className="px-6 py-4 text-center">
                                <ChevronDown className={`w-5 h-5 mx-auto text-slate-300 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                              </td>
                            </tr>
                            {isExpanded && (
                              <tr>
                                <td colSpan={7} className="p-0 border-b border-slate-100">
                                  {renderServiceExpandedDetails(request)}
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredServiceRequests.map(request => {
                    const statusInfo = getServiceStatusInfo(request.status);
                    const isExpanded = expandedServiceRequest === request.id;
                    return (
                      <div key={request.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-5 flex-grow">
                          <div className="flex justify-between items-start mb-4">
                            <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                              {statusInfo.text}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400">{formatServiceRequestId(request.id)}</span>
                          </div>
                          <h3 className="text-lg font-bold text-blue-950 mb-1">{request.serviceName}</h3>
                          <p className="text-xs text-slate-500 mb-4 flex items-center gap-1">
                            <User className="w-3 h-3" /> بواسطة: {request.providerName}
                          </p>
                          <div className="space-y-2 text-sm text-slate-600 mb-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4 text-slate-400" /> 
                              <span className="text-xs">{formatDateWithHijri(request.date)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Receipt className="w-4 h-4 text-slate-400" /> 
                              <span className="font-bold text-amber-500">{request.price} ر.س</span>
                            </div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setExpandedServiceRequest(isExpanded ? null : request.id)}
                          className="w-full bg-slate-50 border-t border-slate-100 py-3 text-sm font-bold text-blue-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                        >
                          عرض التفاصيل
                          <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                        {isExpanded && renderServiceExpandedDetails(request)}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredServiceRequests.map(request => {
                    const statusInfo = getServiceStatusInfo(request.status);
                    const isExpanded = expandedServiceRequest === request.id;
                    return (
                      <div key={request.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden animate-in fade-in slide-in-from-right-4 duration-300">
                        <div 
                          className="p-5 flex flex-col md:flex-row justify-between items-center gap-6 cursor-pointer hover:bg-slate-50 transition-colors"
                          onClick={() => setExpandedServiceRequest(isExpanded ? null : request.id)}
                        >
                          <div className="flex items-center gap-4 w-full md:w-auto">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                              <PackageSearch className="w-6 h-6 text-blue-600" />
                            </div>
                            <div>
                              <h3 className="font-bold text-blue-950">{request.serviceName}</h3>
                              <p className="text-xs text-slate-500">من: {request.providerName}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 w-full md:w-auto flex-grow px-0 md:px-8">
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">التاريخ</p>
                              <p className="text-xs font-bold text-slate-700">{request.date}</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">الحالة</p>
                              <div className={`px-2 py-0.5 rounded-full text-[10px] font-bold inline-block border ${statusInfo.bg} ${statusInfo.color} ${statusInfo.border}`}>
                                {statusInfo.text}
                              </div>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">المبلغ</p>
                              <p className="text-xs font-bold text-amber-500">{request.price} ر.س</p>
                            </div>
                            <div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">رقم الطلب</p>
                              <p className="text-xs font-mono text-slate-500">{formatServiceRequestId(request.id)}</p>
                            </div>
                          </div>

                          <button className="p-2 text-slate-300 hover:text-amber-500 transition-colors md:block hidden cursor-pointer">
                            <ChevronDown className={`w-6 h-6 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          </button>
                        </div>
                        {isExpanded && renderServiceExpandedDetails(request)}
                      </div>
                    );
                  })}
                </div>
              )
            ) : (
              <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 py-16 md:py-24 text-center">
                <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-slate-100">
                  <PackageSearch className="w-8 h-8 md:w-10 md:h-10 text-slate-300" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-blue-950 mb-2">لا توجد طلبات خدمات حالية</h2>
                <p className="text-slate-500 max-w-sm mx-auto mb-6 text-xs md:text-sm">لم تقم بطلب أي خدمات مساندة حتى الآن. استكشف خدماتنا المميزة لتبدأ!</p>
                <Link to="/services" className="inline-flex items-center gap-2 bg-blue-950 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-900 transition-all shadow-lg hover:shadow-blue-900/20 text-xs md:text-sm active:scale-95">
                   استكشف خدمات المناسبات
                </Link>
              </div>
            )}

          </div>
        )}

      </main>

      {/* ------------------------------------------------------------------ */}
      {/* MODALS & OVERLAYS */}
      {/* ------------------------------------------------------------------ */}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-lg font-black text-blue-950">تعديل تفاصيل الحجز والخدمات المساندة #{editingBooking.id}</span>
              <button onClick={() => setEditingBooking(null)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveEdit} className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">تاريخ الحجز المفضل</label>
                <input 
                  type="date" 
                  value={editDate} 
                  onChange={(e) => setEditDate(e.target.value)} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-950 text-sm font-medium" 
                  required 
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">فترة الحجز</label>
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    type="button" 
                    onClick={() => setEditPeriod('صباحي')} 
                    className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${editPeriod === 'صباحي' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  >
                    صباحي (9 ص - 3 م)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditPeriod('مسائي')} 
                    className={`py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${editPeriod === 'مسائي' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  >
                    مسائي (4 م - 12 ص)
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-3">
                  الخدمات الإضافية والخيارات المخصصة لقاعة: {editingBooking?.hall?.name || 'القاعة'} 🌟
                </label>
                <div className="space-y-2.5 max-h-56 overflow-y-auto p-1 border border-slate-100 rounded-xl" dir="rtl">
                  {(() => {
                    const hallExtraServices = (editingBooking?.hall?.extraServicesList && editingBooking.hall.extraServicesList.length > 0)
                      ? editingBooking.hall.extraServicesList
                      : [
                          { id: '1', name: 'تنسيق ورد طبيعي فاخر للكوشة والممر', desc: 'تزيين وتنسيق مدخل وممر القاعة بالورد الطبيعي المنعش والفاخر حسب رغبتكم', price: 3500 },
                          { id: '2', name: 'تصوير احترافي فوتوغرافي وفيديو طيلة الحفلة', desc: 'تغطية احترافية كاملة للحفلة مع ألبوم صور خاص متميز وفيديو عالي الدقة 4K', price: 2500 },
                          { id: '3', name: 'بوفيه مفتوح فاخر والضيافة الشاملة', desc: 'بوفيه مأكولات عربية وعالمية فاخرة ومشروبات استقبال متكاملة لجميع الضيوف', price: 4500 },
                          { id: '4', name: 'دي جي وأحدث المؤثرات الصوتية والضوئية', desc: 'أنظمة دي جي متطورة مع تحكم متكامل في الإضاءة التفاعلية والليزر طوال مدة الحفلة', price: 1500 },
                          { id: '5', name: 'قهوة وشاي وحلويات استقبال للضيوف', desc: 'ضيافة عربية أصيلة مع مشرفي خدمة وقهوجية متخصصين للرجال والنساء', price: 1200 }
                        ];

                    return hallExtraServices.map((srv: any, idx: number) => {
                      const isChecked = editServices.some(s => s.trim().toLowerCase() === srv.name.trim().toLowerCase());
                      return (
                        <div 
                          key={idx} 
                          onClick={() => handleServiceToggle(srv.name, srv.price)}
                          className={`p-3.5 rounded-xl border transition-all flex items-start justify-between cursor-pointer gap-2 ${isChecked ? 'bg-indigo-50/50 border-indigo-600 text-indigo-950 shadow-sm' : 'bg-white border-slate-200 hover:bg-slate-50'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="pt-0.5">
                              <input 
                                type="checkbox" 
                                checked={isChecked} 
                                onChange={() => {}}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 transition-all" 
                              />
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-xs font-bold text-slate-800">{srv.name}</span>
                              {srv.desc && <span className="text-[10px] text-slate-400 mt-1 leading-relaxed font-normal">{srv.desc}</span>}
                            </div>
                          </div>
                          <span className="text-xs font-black text-amber-600 whitespace-nowrap shrink-0 pr-1">+{srv.price} ر.س</span>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">ملاحظات وطلبات خاصة لمزود الخدمة</label>
                <textarea 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)} 
                  placeholder="اكتب أي شروط خاصة، أو طلب مخصص مثل تزيين مأكولات مخصصة هنا..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-950 text-xs font-medium h-24 resize-none" 
                />
              </div>

              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">المبلغ الإجمالي الجديد (شامل الضريبة):</span>
                <span className="font-extrabold text-amber-600 text-sm">{editTotal} ر.س</span>
              </div>

              <div className="pt-2 flex gap-3">
                <button type="submit" className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all shadow-sm text-xs cursor-pointer">
                  حفظ التعديلات الفورية
                </button>
                <button type="button" onClick={() => setEditingBooking(null)} className="flex-1 py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer">
                  إلغاء التعديل
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Booking Invoice Details Modal */}
      {viewingInvoice && (() => {
        const isExempt = !getProviderVatStatus(viewingInvoice.hall.provider);
        const vatRate = isExempt ? 0 : 0.15;
        const total = viewingInvoice.total || 0;
        const subtotalValue = total / (1 + vatRate);
        const vatValue = total - subtotalValue;

        const invoiceItems = [
          {
            name: `حجز قاعة: ${viewingInvoice.hall.name} - تاريخ المناسبة: ${viewingInvoice.date} (${viewingInvoice.period})${viewingInvoice.extraServices ? ` - خدمات إضافية: ${viewingInvoice.extraServices}` : ''}`,
            quantity: 1,
            price: subtotalValue,
            total: total
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

        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="bg-slate-900/40 absolute inset-0" onClick={() => setViewingInvoice(null)} />
            <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative z-10 border border-slate-100 animate-in zoom-in-95 duration-300">
              
              <div className="bg-slate-900 text-white px-6 py-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3" dir="rtl">
                  <Receipt className="w-5 h-5 text-amber-500" />
                  <span className="font-bold text-sm md:text-base font-sans">الفاتورة الضريبية الموحدة لطلب الحجز #{formatBookingId(viewingInvoice.id)}</span>
                </div>
                <button 
                  onClick={() => setViewingInvoice(null)}
                  className="p-1.5 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
                  title="إغلاق النافذة"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-8 bg-slate-50/50">
                <BookingInvoice
                  bookingId={viewingInvoice.id}
                  issueDate={viewingInvoice.createdAt ? new Date(viewingInvoice.createdAt).toLocaleDateString('ar-SA') : viewingInvoice.date}
                  providerName={viewingInvoice.hall.provider}
                  providerAddress={viewingInvoice.hall.location || 'الرياض، المملكة العربية السعودية'}
                  providerVatNo={viewingInvoice.providerVatNo || '300582910400003'}
                  customerName={viewingInvoice.customerName || JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'عميل منصة ليلة'}
                  customerPhone={viewingInvoice.customerPhone || '+966 50 123 4567'}
                  customerEmail={viewingInvoice.customerEmail || 'customer@example.com'}
                  customerRegion={viewingInvoice.customerRegion || 'منطقة الرياض'}
                  customerAddressDetail={viewingInvoice.customerAddressDetail || 'حي الياسمين، الرياض'}
                  customerVatNo={viewingInvoice.customerVatNo || ''}
                  checkInDate={viewingInvoice.date}
                  checkOutDate={viewingInvoice.date}
                  duration={viewingInvoice.period}
                  items={invoiceItems}
                  subtotal={subtotalValue}
                  vatAmount={vatValue}
                  grandTotal={total}
                  paymentMethod={viewingInvoice.paymentMethod || 'بطاقة ائتمانية / مدى'}
                  status={viewingInvoice.paymentStatus === 'paid_full' || viewingInvoice.paymentStatus === 'paid' ? 'paid' : 'pending'}
                  isExempt={isExempt}
                  platformData={invoicePlatformData}
                  hideControlPanel={true}
                  fixedLogoSize={true}
                  guests={viewingInvoice.guestCount || 180}
                />
              </div>

            </div>
          </div>
        );
      })()}

      {/* Cancellation Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-2 text-rose-600 font-extrabold text-base">
                <Trash2 className="w-5 h-5" />
                <span>طلب إلغاء الحجز #{cancellingBooking.id}</span>
              </div>
              <button onClick={() => setCancellingBooking(null)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              
              {/* Force Majeure Option check */}
              {getFinancialSettings().enableForceMajeureProtocol && checkForceMajeureWindow(cancellingBooking) && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 space-y-3">
                  <div className="flex items-start gap-3">
                    <input 
                      type="checkbox" 
                      id="fmCheck"
                      checked={isForceMajeure}
                      onChange={(e) => setIsForceMajeure(e.target.checked)}
                      className="mt-1 rounded text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <label htmlFor="fmCheck" className="text-xs font-bold text-amber-950 cursor-pointer leading-relaxed">
                      تقديم طلب إلغاء استثنائي بداعي (القوة القاهرة) 🛡️
                    </label>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed pr-7">
                    بناءً على الضوابط المعتمدة لحماية المستهلك والشركاء، يمكنك تقديم مستند ثبوتي رسمي (مثل تقرير طبي أو حدث طارئ مثبت) ليتم دراسته من قبل لجنة المنصة المستقلة للبت في الإعفاء المالي.
                  </p>

                  {isForceMajeure && (
                    <div className="pt-2 space-y-3 pr-7 border-t border-amber-200/60">
                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">سبب طلب القوة القاهرة بالتفصيل *</label>
                        <textarea 
                          value={fmReason}
                          onChange={(e) => setFmReason(e.target.value)}
                          placeholder="اشرح الظرف القاهر وتاريخ وقوعه بالتفصيل..."
                          className="w-full p-2.5 rounded-lg border border-amber-300 text-xs focus:outline-none focus:border-amber-600 bg-white"
                          rows={3}
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-amber-900 mb-1">المستندات الرسمية الثبوتية الداعمة *</label>
                        <input 
                          type="file" 
                          onChange={(e) => handleFmFileUpload(e.target.files)}
                          className="text-xs text-slate-600"
                          accept="image/*,application/pdf"
                        />
                        {isUploadingFmDoc && <p className="text-[10px] text-amber-700 font-bold mt-1">جاري رفع المستند...</p>}

                        {fmDocs.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-[10px] font-bold text-slate-500">المستندات المرفوعة:</p>
                            <div className="flex flex-wrap gap-2">
                              {fmDocs.map((doc, index) => (
                                <div key={index} className="flex items-center gap-1.5 px-2 py-1 rounded bg-amber-100 border border-amber-300 text-[10px] text-amber-900">
                                  <button
                                    type="button"
                                    onClick={() => setFmDocs(prev => prev.filter((_, idx) => idx !== index))}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm leading-none cursor-pointer"
                                  >
                                    ×
                                  </button>
                                  <span className="font-mono truncate max-w-[150px]">مستند #{index + 1}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Ordinary Cancellation warning */}
              {!isForceMajeure && (
                <div className="space-y-3 text-right">
                  <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl text-rose-700 text-xs leading-relaxed space-y-1 text-right">
                    <p className="font-bold">تنبيه هام حول سياسة الإلغاء العادية:</p>
                    <p>إلغاء الحجز قد يخضع لرسوم إلغاء حسب الشروط المتفق عليها مع مقدم الخدمة لقاعة <span className="font-extrabold">{cancellingBooking.hall?.name || 'القاعة'}</span>.</p>
                  </div>
                  <p className="text-slate-600 text-sm leading-relaxed text-right">
                    هل أنت متأكد من رغبتك في طلب إلغاء الحجز رقم <span className="font-bold font-mono text-slate-800">#{cancellingBooking.id}</span>؟ لا يمكن التراجع عن هذا الإجراء بعد التأكيد.
                  </p>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button 
                  onClick={handleConfirmCancel} 
                  disabled={isUploadingFmDoc}
                  className={`flex-grow py-3 px-4 font-bold rounded-xl transition-all shadow-sm text-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
                    isForceMajeure 
                      ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                      : 'bg-rose-600 hover:bg-rose-700 text-white'
                  }`}
                >
                  {isForceMajeure ? (
                    <>⚠️ تأكيد وإرسال طلب القوة القاهرة</>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" /> تأكيد إلغاء الحجز العادي
                    </>
                  )}
                </button>
                <button 
                  onClick={() => setCancellingBooking(null)} 
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all text-xs cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Provider Chat Modal */}
      <ProviderChatModal 
        isOpen={isProviderChatOpen} 
        onClose={() => setIsProviderChatOpen(false)} 
        providerName={chatData.providerName} 
        hallName={chatData.hallName} 
      />

      {/* Service Request Invoice Modal */}
      <ServiceRequestInvoice 
        isOpen={isServiceInvoiceOpen} 
        onClose={() => setIsServiceInvoiceOpen(false)} 
        request={viewingRequestForInvoice} 
      />

      {/* Review Modal */}
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetType={selectedBookingForReview?.serviceName ? "service" : "hall"}
        allowedTargetTypes={selectedBookingForReview?.serviceName ? ["service", "provider"] : ["hall", "provider"]}
        targetId={selectedBookingForReview?.hall?.id || selectedBookingForReview?.id}
        targetName={selectedBookingForReview?.hall?.name || selectedBookingForReview?.serviceName || 'حجز منصة ليلة'}
        providerName={selectedBookingForReview?.hall?.provider || selectedBookingForReview?.provider}
        onSubmitReview={handleModalSubmitReview}
      />

      <Footer />
    </div>
  );
}
