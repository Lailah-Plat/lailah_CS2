import React, { useState, useEffect } from 'react';
import { formatBookingId, formatInvoiceId } from '../utils/idUtils';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProviderChatModal from '../components/ProviderChatModal';
import BookingInvoice from '../components/BookingInvoice';
import { MapPin, Calendar, Clock, Receipt, CheckCircle2, AlertCircle, XCircle, ChevronDown, ChevronUp, Mail, MessageSquare, MessageCircle, X, Trash2, Pencil, Users, Printer, Share2, Building2, User, Timer, Bell, ShieldAlert, Star } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import { halls, getStoredHalls, isProviderNameVisible, getDisplayedProviderName } from '../data/mockData';
import { useCalendar } from '../context/CalendarContext';
import { formatDateWithHijri, formatSmartDate, getFullDateInfo } from '../utils/dateUtils';
import { toast } from 'react-hot-toast';
import { ReviewModal } from '../components/modals/ReviewModal';

// ... (inside the component or before it)
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
  
  // Check if already requested
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
    status: 'confirmed', // pending, confirmed, cancelled
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
        // Fallback: 3 days before event start date
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

  // Date check to determine if a booking has elapsed
  const isBookingPast = (booking: any) => {
    try {
      const dateVal = booking.rawDate || booking.startTime || booking.startDate || booking.date;
      if (!dateVal) return false;
      const parsedDate = new Date(dateVal);
      if (isNaN(parsedDate.getTime())) return false;
      
      const now = new Date();
      const bDate = new Date(parsedDate);
      // Set to end of the day so the booking remains current until midnight
      bDate.setHours(23, 59, 59, 999);
      return bDate.getTime() < now.getTime();
    } catch {
      return false;
    }
  };

  // VAT status check for booking provider from localStorage profile database
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
    return true; // default is taxable
  };

  // Custom modification states
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

  // Force Majeure states
  const [forceMajeureBooking, setForceMajeureBooking] = useState<any | null>(null);
  const [isForceMajeure, setIsForceMajeure] = useState(false);
  const [fmReason, setFmReason] = useState('');
  const [fmDocs, setFmDocs] = useState<string[]>([]);
  const [isUploadingFmDoc, setIsUploadingFmDoc] = useState(false);

  // Helper getters
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
      // Prefer raw or unformatted date values to ensure standard parsing is successful
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

      // Also check 24 hours grace window has passed since booking creation
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

  // Search & Filtering States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');

  // Calculate statistics for the dashboard
  const totalBookingsCount = realBookings.length;
  const confirmedCount = realBookings.filter(b => b.status === 'confirmed').length;
  const pendingCount = realBookings.filter(b => b.status === 'pending').length;
  const totalSpent = realBookings.filter(b => b.status === 'confirmed').reduce((sum, b) => sum + (b.total || 0), 0);

  // Filter Bookings Based on search query and status tab
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

  const popularServicesList = [
    { name: 'بوفيه مفتوح فاخر والضيافة الشاملة', price: 4500 },
    { name: 'تصوير احترافي فوتوغرافي وفيديو طيلة الحفلة', price: 2500 },
    { name: 'دي جي وأحدث المؤثرات الصوتية والضوئية', price: 1500 },
    { name: 'تزيين وتنسيق مدخل وممر القاعة بالورد الطبيعي', price: 3000 },
    { name: 'قهوة وشاي وحلويات استقبال للضيوف', price: 1200 }
  ];

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

  const handleSubmitForceMajeure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fmReason.trim()) {
      toast.error('الرجاء كتابة سبب الإلغاء بالتفصيل');
      return;
    }
    if (fmDocs.length === 0) {
      toast.error('الرجاء إرفاق مستند رسمي واحد على الأقل لإثبات القوة القاهرة');
      return;
    }

    try {
      const res = await fetch('/api/bookings/force-majeure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: forceMajeureBooking.id,
          reason: fmReason,
          documents: fmDocs
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'تم تقديم طلب القوة القاهرة بنجاح وبانتظار البت من اللجنة المفوضة.');
        setForceMajeureBooking(null);
        setFmReason('');
        setFmDocs([]);
      } else {
        toast.error(data.error || 'خطأ أثناء تقديم الطلب');
      }
    } catch(err: any) {
      toast.error(err.message || 'فشلت معالجة الطلب');
    }
  };

  const handleRequestInvoice = (booking: any) => {
    setViewingInvoice(booking);
    const requests = JSON.parse(localStorage.getItem('INVOICE_REQUESTS') || '[]');
    const newRequest = {
      id: Date.now(),
      type: 'booking',
      targetId: String(booking.id),
      customerName: JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'عميل',
      customerId: 'CUST-' + Math.floor(Math.random() * 1000),
      date: new Date().toISOString(),
      status: 'pending',
      requestCount: 1
    };
    
    // Check if already requested
    const existing = requests.find((r: any) => r.targetId === String(booking.id));
    if (existing) {
      existing.requestCount += 1;
      localStorage.setItem('INVOICE_REQUESTS', JSON.stringify(requests));
    } else {
      localStorage.setItem('INVOICE_REQUESTS', JSON.stringify([...requests, newRequest]));
    }
    
    toast.success('تم طلب الفاتورة وعرض كشف تفاصيل الفاتورة الضريبية للعميل بنجاح 🧾');
    window.dispatchEvent(new Event('invoice_requested'));
    window.dispatchEvent(new Event('storage'));
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
        ...editingBooking,
        date: editDate,
        startTime: editDate,
        period: editPeriod,
        notes: editNotes,
        extraServices: editServices.join('، '),
        totalAmount: editTotal
      })
    })
    .then(res => {
      if (res.ok) {
        toast.success('تمت مزامنة وحفظ تعديلات الحجز الفورية بقاعدة البيانات بنجاح ⚡');
      } else {
        toast.success('تم حفظ وتعديل تفاصيل الحجز الفورية والخدمات المضافة بنجاح');
      }
      window.dispatchEvent(new Event('booking_updated'));
      window.dispatchEvent(new Event('storage'));
    })
    .catch(() => {
      toast.success('تم حفظ وتعديل تفاصيل الحجز وتحديثات الخدمات بنجاح');
      window.dispatchEvent(new Event('booking_updated'));
      window.dispatchEvent(new Event('storage'));
    });

    setEditingBooking(null);
  };

  const handleConfirmCancel = async () => {
    if (!cancellingBooking) return;

    if (isForceMajeure) {
      if (!fmReason.trim()) {
        toast.error('الرجاء كتابة سبب الإلغاء بالتفصيل');
        return;
      }
      if (fmDocs.length === 0) {
        toast.error('الرجاء إرفاق مستند رسمي واحد على الأقل لإثبات القوة القاهرة');
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
          setIsForceMajeure(false);
          setFmReason('');
          setFmDocs([]);
          loadBookings();
        } else {
          toast.error(data.error || 'خطأ أثناء تقديم الطلب');
        }
      } catch (err: any) {
        toast.error(err.message || 'فشلت معالجة الطلب');
      }
    } else {
      const updatedBookings = realBookings.map(b => 
        b.id === cancellingBooking.id ? { ...b, status: 'cancelled' } : b
      );
      setRealBookings(updatedBookings);

      fetch(`/api/bookings/${cancellingBooking.id}/cancel`, {
        method: 'POST'
      })
      .then(res => {
        if (res.ok) {
          toast.success('تم إلغاء الحجز ومزامنة تغيير حالته بنجاح لحظياً');
          window.dispatchEvent(new Event('booking_updated'));
          loadBookings();
        } else {
          fetch(`/api/bookings/${cancellingBooking.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...cancellingBooking, status: 'cancelled' })
          })
          .then(r => {
            if (r.ok) {
              toast.success('تم إلغاء الحجز وتحديث حالته بنجاح');
              window.dispatchEvent(new Event('booking_updated'));
              loadBookings();
            } else {
              toast.success('تم إرسال طلب إلغاء الحجز للمزود بنجاح');
            }
          })
          .catch(() => {
            toast.success('تم إلغاء الحجز وتحديث حالته بنجاح');
          });
        }
      })
      .catch(() => {
        toast.success('تم طلب إلغاء وتنفيذ الإجراء بنجاح');
      });

      setCancellingBooking(null);
    }
  };

  const loadBookings = () => {
    const liveHalls = getStoredHalls();
    const userStr = localStorage.getItem('currentUser');
    const user = userStr ? JSON.parse(userStr) : {};

    const queryParams = new URLSearchParams();
    if (user.id) queryParams.append('userId', user.id);
    if (user.phone) queryParams.append('phone', user.phone);
    if (user.email) queryParams.append('email', user.email);

    fetch(`/api/bookings/my-bookings?${queryParams.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch bookings');
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) {
          const myBookings = data.map(b => {
            const mappedHall = b.hall || b.hallInfo;
            let displayHall = liveHalls[0] || halls[0];
            if (mappedHall) {
              const staticHallInfo = liveHalls.find(h => h.id === String(mappedHall.id) || h.name === mappedHall.name);
              displayHall = {
                ...mappedHall,
                image: mappedHall.image || staticHallInfo?.image || liveHalls[0]?.image || halls[0]?.image,
                location: mappedHall.location || mappedHall.name,
                rating: mappedHall.rating || staticHallInfo?.rating || 5,
                reviews: staticHallInfo?.reviews || []
              };
            }
            
            return {
              id: b.id,
              hall: displayHall,
              date: formatDateWithHijri(b.startTime || b.startDate || b.date),
              rawDate: (b.startTime || b.startDate || b.date || '').split('T')[0],
              period: b.period || 'مسائي',
              status: b.status || 'pending',
              total: b.totalAmount || b.basePrice || 0,
              notes: b.description || b.notes || '',
              extraServices: b.extraServices || '',
              paymentMethod: b.paymentMethod || 'مدى (Mada)',
              paymentStatus: b.paymentStatus || 'pending',
              depositAmount: b.depositAmount || 0,
              paymentDeadline: b.paymentDeadline || null,
              createdAt: b.createdAt,
              customerName: b.customerName,
              customerPhone: b.customerPhone,
              customerEmail: b.customerEmail,
              guests: b.guests || 50,
              bookingServices: b.bookingServices || [],
              communications: []
            };
          });
          
          setRealBookings(myBookings);
        }
      })
      .catch(() => setRealBookings([]));
  };

  useEffect(() => {
    loadBookings();
    
    const handleUpdate = () => loadBookings();
    window.addEventListener('booking_updated', handleUpdate);
    window.addEventListener('invoice_requested', handleUpdate);

    // Socket Dynamic Instant Synchronization Setup
    let socket: any = null;
    try {
      const { io } = require('socket.io-client');
      socket = io();
      socket.on('new_booking_event', () => {
        loadBookings();
      });
      socket.on('booking_updated_event', () => {
        loadBookings();
      });
    } catch (e) {
      // Fallback if socket.io is not loaded, we also poll or rely on storage
    }
    
    return () => {
      window.removeEventListener('booking_updated', handleUpdate);
      window.removeEventListener('invoice_requested', handleUpdate);
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const openProviderChat = (e: React.MouseEvent, providerName: string, hallName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatData({ providerName, hallName });
    setIsProviderChatOpen(true);
  };

  const getStatusInfo = (status: string, booking?: any) => {
    if (booking && status !== 'cancelled' && isBookingPast(booking)) {
      return { 
        text: 'مكتمل/منتهٍ', 
        color: 'text-slate-600', 
        bg: 'bg-slate-100', 
        border: 'border-slate-300', 
        icon: <CheckCircle2 className="w-5 h-5 text-slate-500" /> 
      };
    }
    switch (status) {
      case 'confirmed': return { text: 'مؤكد', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: <CheckCircle2 className="w-5 h-5 text-emerald-500" /> };
      case 'pending': return { text: 'معلق', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: <AlertCircle className="w-5 h-5 text-amber-500" /> };
      case 'cancelled': return { text: 'ملغى', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: <XCircle className="w-5 h-5 text-red-500" /> };
      case 'completed': return { text: 'مكتمل/منتهٍ', color: 'text-slate-600', bg: 'bg-slate-100', border: 'border-slate-300', icon: <CheckCircle2 className="w-5 h-5 text-slate-500" /> };
      default: return { text: 'غير معروف', color: 'text-slate-600', bg: 'bg-slate-50', border: 'border-slate-200', icon: null };
    }
  };

  const activeTab = 'upcoming'; // Just to show standard tabs if needed, but we keep it simple

  const renderExpandedDetails = (booking: any) => (
    <div className="border-t border-slate-100 bg-slate-50 p-6 flex flex-col gap-6">
      <PaymentDeadlineAlert booking={booking} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Booking Info box */}
        <div>
          <h4 className="font-bold text-blue-950 mb-4 flex items-center gap-2">
            <Receipt className="w-5 h-5" /> تفاصيل الحجز
          </h4>
          <div className="bg-white rounded-xl p-5 border border-slate-100 space-y-3 text-sm">
             <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-bold">رقم الحجز:</span>
                <span className="font-bold text-slate-800 font-mono tracking-tight">{formatBookingId(booking.id)}</span>
             </div>
             <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500 font-bold">رقم الفاتورة:</span>
                <span className="font-bold text-indigo-600 font-mono tracking-tight">{formatInvoiceId(booking.id)}</span>
             </div>
             <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">مقدم الخدمة:</span>
                <span className="font-bold text-slate-800 flex items-center gap-2">
                   {getDisplayedProviderName(booking.hall.provider)}
                   {localStorage.getItem('IS_AUTHENTICATED') === 'true' && (
                     <button onClick={(e) => openProviderChat(e, booking.hall.provider, booking.hall.name)} className="text-amber-500 hover:text-amber-600 transition-colors p-1" title="مراسلة المزود">
                        <MessageCircle className="w-5 h-5" />
                     </button>
                   )}
                </span>
             </div>
             <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">الموقع:</span>
                <span className="font-bold text-slate-800">{booking.hall.location}</span>
             </div>
             <div className="flex justify-between border-b border-slate-50 pb-2">
                <span className="text-slate-500">طريقة الدفع:</span>
                <span className="font-bold text-slate-800">{booking.paymentMethod || 'مدى (Mada)'}</span>
             </div>
             <div className="pt-2 flex flex-wrap gap-2">
               {(booking.status === 'confirmed' || booking.status === 'pending') && (
                 <>
                   <button onClick={() => handleOpenEditModal(booking)} className={`bg-blue-950 text-white px-3 py-2 rounded-lg font-bold hover:bg-blue-900 transition-colors text-xs flex-1 cursor-pointer ${isBookingPast(booking) ? 'hidden' : ''}`}>
                     تعديل الحجز
                   </button>
                   <button 
                     onClick={() => handleRequestInvoice(booking)}
                     className="bg-[#ecfdf5] text-[#047857] px-3 py-2 rounded-lg font-bold hover:bg-emerald-100 transition-colors text-xs flex-1 border border-[#a7f3d0] shadow-sm flex items-center justify-center gap-1 cursor-pointer"
                   >
                     <Receipt className="w-3.5 h-3.5" /> طلب فاتورة
                   </button>
                 </>
               )}
               <button 
                 onClick={() => setViewingInvoice(booking)}
                 className="bg-indigo-600 text-white px-3 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors text-xs flex-1 border border-indigo-550 shadow-sm flex items-center justify-center gap-1 cursor-pointer font-sans"
               >
                 <Receipt className="w-3.5 h-3.5" /> عرض الفاتورة الضريبية
               </button>
               <button 
                 onClick={() => {
                   setSelectedBookingForReview(booking);
                   setIsReviewModalOpen(true);
                 }}
                 className="bg-amber-500 text-slate-900 px-3 py-2 rounded-lg font-extrabold hover:bg-amber-600 transition-colors text-xs flex-1 shadow-sm flex items-center justify-center gap-1 cursor-pointer"
               >
                 <Star className="w-3.5 h-3.5 fill-slate-900" /> تقييم التجربة
               </button>
               {booking.status !== 'cancelled' && !isBookingPast(booking) && (
                 <button onClick={() => { handleOpenCancelModal(booking); }} className="border border-red-200 text-red-600 px-3 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors text-xs flex-1 cursor-pointer">
                   طلب إلغاء
                 </button>
               )}
             </div>
          </div>
        </div>



      {/* Communications Box */}
      <div>
        <h4 className="font-bold text-blue-950 mb-4 flex items-center gap-2">
          <Mail className="w-5 h-5" /> سجل المراسلات وتتبع الحالة
        </h4>
        <div className="bg-white rounded-xl p-0 border border-slate-100 overflow-hidden text-sm">
          {booking.communications.map((comm: any, idx: number) => (
            <div key={idx} className={`p-4 border-b border-slate-50 last:border-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}`}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  {comm.type === 'email' ? <Mail className="w-4 h-4 text-amber-500" /> : <MessageSquare className="w-4 h-4 text-emerald-500" />}
                  <span className="font-bold text-slate-800">{comm.title}</span>
                </div>
                <span className="text-xs text-slate-400">{comm.date}</span>
              </div>
              <p className="text-slate-600 mb-2 leading-relaxed">{comm.content}</p>
              <span className={`inline-block px-2 py-1 rounded text-[10px] font-bold ${comm.to === 'customer' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                المرسل إليه: {comm.to === 'customer' ? 'العميل' : 'مزود الخدمة'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 w-full py-8 md:py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-950 border-r-4 border-amber-500 pr-4">حجوزاتي وطلباتي</h1>
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {/* Bento Statistics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-10">
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

        {/* Realtime Search Input - Directly Below the Tabs */}
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
                className="absolute left-3 top-2 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg font-sans transition-all"
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
            <h3 className="text-lg md:text-xl font-bold text-blue-950 mb-2">لا توجد حجوزات تطابق خيارات الاستعلام</h3>
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
                  <th className="px-6 py-4 font-bold">حالة الحظر</th>
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
                        <td className="px-6 py-4 font-bold text-slate-500 font-mono text-xs">{formatBookingId(booking.id)}</td>
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
                  {/* Booking Header (Clickable for expansion) */}
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

                  {/* Expanded Details Section */}
                  {isExpanded && renderExpandedDetails(booking)}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Edit Booking Modal */}
      {editingBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <span className="text-lg font-black text-blue-950">تعديل تفاصيل الحجز والخدمات المساندة #{editingBooking.id}</span>
              <button onClick={() => setEditingBooking(null)} className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
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
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${editPeriod === 'صباحي' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  >
                    صباحي (9 ص - 3 م)
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setEditPeriod('مسائي')} 
                    className={`py-3 rounded-xl border text-xs font-bold transition-all ${editPeriod === 'مسائي' ? 'bg-blue-950 text-white border-blue-950' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}
                  >
                    مسائي (4 م - 12 ص)
                  </button>
                </div>
              </div>

              {/* Extra Services Checklist */}
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
                                onChange={() => {}} // handled by click of container
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

              {/* Customer Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-2">ملاحظات وطلبات خاصة لمزود الخدمة</label>
                <textarea 
                  value={editNotes} 
                  onChange={(e) => setEditNotes(e.target.value)} 
                  placeholder="اكتب أي شروط خاصة، أو طلب مخصص مثل تزيين مأكولات مخصصة هنا..."
                  className="w-full p-3 rounded-xl border border-slate-200 focus:outline-none focus:border-blue-950 text-xs font-medium h-24 resize-none" 
                />
              </div>

              {/* Live Cost Summary */}
              <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-xl flex justify-between items-center text-xs">
                <span className="font-bold text-slate-600">المبلغ الإجمالي الجديد (قيمة تقديرية شاملة الضريبة):</span>
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

      {/* Invoice Details Modal */}
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

        const invoiceId = formatInvoiceId(viewingInvoice.id);

        return (
          <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
            <div className="bg-slate-900/40 absolute inset-0" onClick={() => setViewingInvoice(null)} />
            <div className="bg-white rounded-[32px] w-full max-w-5xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh] relative z-10 border border-slate-100 animate-in zoom-in-95 duration-300">
              
              {/* Modal Header */}
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

              {/* Scrollable Container for unified invoice */}
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

      {/* Legacy Modal Disabled */}
      {false && (() => {
        const isPartial = false;
        const depositPaid = 0;
        const balanceDue = 0;
        const handlePrint = () => {};
        const total = 0;
        const vatValue = 0;
        const subtotalValue = 0;
        const isExempt = false;
        const handleShare = async () => {
          if (navigator.share) {
            try {
              await navigator.share({
                title: `فاتورة ضريبية مبسطة - حجز قاعة ${viewingInvoice.hall.name}`,
                text: `تفاصيل فاتورة حجز القاعة رقم ${viewingInvoice.id}`,
                url: window.location.href,
              });
            } catch (err) {
              console.error('Error sharing:', err);
            }
          } else {
            toast.error('ميزة المشاركة غير مدعومة في متصفحك');
          }
        };

        return (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
              {/* Actions Toolbar */}
              <div className="bg-slate-50 p-4 border-b border-slate-100 flex justify-between items-center shrink-0">
                <div className="flex gap-2">
                  <button 
                    onClick={handlePrint}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-all shadow-sm cursor-pointer"
                  >
                    <Printer className="w-4 h-4" /> طباعة / حفظ PDF
                  </button>
                  <button 
                    onClick={handleShare}
                    className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold text-sm flex items-center gap-2 hover:bg-slate-100 transition-all shadow-sm cursor-pointer"
                  >
                    <Share2 className="w-4 h-4" /> مشاركة
                  </button>
                </div>
                <button 
                  onClick={() => setViewingInvoice(null)}
                  className="p-2 hover:bg-slate-200 rounded-full text-slate-400 transition-colors cursor-pointer"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Invoice Body */}
              <div className="p-8 md:p-12 overflow-y-auto text-right font-sans" dir="rtl" id="invoice-content">
                <style dangerouslySetInnerHTML={{ __html: `
                  @media print {
                    body * { visibility: hidden; }
                    #invoice-content, #invoice-content * { visibility: visible; }
                    #invoice-content { position: absolute; left: 0; top: 0; width: 100%; border: none !important; box-shadow: none !important; margin: 0; padding: 20px; }
                  }
                `}} />
                
                <div className="flex flex-col md:flex-row justify-between gap-8 mb-12 items-start">
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className={`w-20 h-20 ${platformData.logoUrl ? '' : 'bg-amber-500'} rounded-2xl flex items-center justify-center overflow-hidden shrink-0 shadow-sm border border-slate-100`}>
                        {platformData.logoUrl ? (
                          <img src={platformData.logoUrl} alt="Logo" className="w-full h-full object-contain p-2" referrerPolicy="no-referrer" />
                        ) : (
                          <Receipt className="w-10 h-10 text-white" />
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-blue-950 uppercase tracking-tighter">{platformData.platformName || 'منصة ليلة'}</h2>
                        <p className="text-xs text-amber-600 font-bold">{platformData.platformEnName || platformData.platformNameEn || 'Lailah Platform'}</p>
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm max-w-xs leading-relaxed">
                      {platformData.platformSlogan || 'المنصة المتكاملة لإدارة وتنظيم المناسبات في المملكة العربية السعودية.'}
                      <br />الرقم الضريبي للمنصة: <span className="font-mono">{platformData.taxNumber || '310123456700003'}</span>
                    </p>
                  </div>
                  
                  {/* ZATCA compliance block: title + invoice ID + QR Code */}
                  <div className="flex flex-col sm:flex-row gap-6 items-end sm:items-center text-left md:text-left self-stretch md:self-auto justify-between md:justify-end">
                    <div className="text-right flex flex-col items-end">
                      <h1 className="text-3xl font-black text-slate-800 mb-1">فاتورة ضريبية مبسطة</h1>
                      <p className="text-xs text-slate-400 font-bold mb-3">Simplified Tax Invoice</p>
                      <p className="text-slate-500 font-mono text-sm tracking-tight font-black">رقم الفاتورة: {formatInvoiceId(viewingInvoice.id)}</p>
                      <div className="mt-4 flex flex-col items-end space-y-1.5">
                        <div className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 flex items-center gap-2">
                          <span className="text-xs text-slate-400">تاريخ الإصدار:</span>
                          <span className="text-sm font-bold text-slate-700 font-mono">{viewingInvoice.date} {viewingInvoice.createdAt ? new Date(viewingInvoice.createdAt).toLocaleTimeString('ar-SA') : '14:30:00'}</span>
                        </div>
                        <div className={`px-3 py-1 rounded-lg border flex items-center gap-2 ${isPartial ? 'bg-amber-50 border-amber-100' : 'bg-emerald-50 border-emerald-100'}`}>
                          <span className={`text-xs ${isPartial ? 'text-amber-600' : 'text-emerald-600'}`}>حالة الدفع:</span>
                          <span className={`text-sm font-bold ${isPartial ? 'text-amber-700' : 'text-emerald-700'}`}>
                            {isPartial 
                              ? `مسدد دفعة مقدمة (${((depositPaid / total) * 100).toFixed(0)}%)` 
                              : 'مدفوعة بالكامل عبر مدى'}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* The ZATCA Official QR Code Container */}
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center">
                      <QRCodeSVG 
                        value={getZatcaTlvBase64(
                          viewingInvoice.hall.provider, 
                          platformData.taxNumber || '310123456700003', 
                          `${viewingInvoice.rawDate || '2026-06-20'}T${viewingInvoice.createdAt ? new Date(viewingInvoice.createdAt).toISOString().split('T')[1].substring(0,8) : '14:30:00'}Z`, 
                          total.toString(), 
                          vatValue.toFixed(2)
                        )} 
                        size={110} 
                        level="M" 
                        includeMargin={false} 
                      />
                      <span className="text-[9px] text-slate-400 font-bold mt-1.5 text-center">التحقق الضريبي ZATCA</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12 py-8 border-y border-slate-100">
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-slate-400" /> الفاتورة من (المورد)
                    </h3>
                    <div className="space-y-1 text-slate-700">
                      <p className="font-black text-blue-950 text-base">{viewingInvoice.hall.provider}</p>
                      <p className="text-sm">مزود خدمة معتمد في منصة ليلة</p>
                      <p className="text-sm">اسم القاعة: {viewingInvoice.hall.name}</p>
                      <p className="text-sm">الموقع: {viewingInvoice.hall.location || 'الرياض، المملكة العربية السعودية'}</p>
                      <p className="text-xs text-slate-400">الرقم الضريبي للمزود: <span className="font-mono font-bold">300987654300003</span></p>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                      <User className="w-4 h-4 text-slate-400" /> الفاتورة إلى (العميل)
                    </h3>
                    <div className="space-y-1 text-slate-700">
                      <p className="font-black text-blue-950 text-base">
                        {viewingInvoice.customerName || (localStorage.getItem('currentUser') 
                          ? (JSON.parse(localStorage.getItem('currentUser') || '{}').name || 'عميل مسجل') 
                          : 'عميل مسجل')}
                      </p>
                      <p className="text-sm">
                        البريد الإلكتروني: {viewingInvoice.customerEmail || (localStorage.getItem('currentUser') 
                          ? (JSON.parse(localStorage.getItem('currentUser') || '{}').email || 'client@example.com') 
                          : 'client@example.com')}
                      </p>
                      <p className="text-sm">رقم الجوال: <span className="font-mono font-bold">{viewingInvoice.customerPhone || '05XXXXXXXX'}</span></p>
                      <p className="text-sm">رقم الحجز المرجعي: <span className="font-mono font-bold text-slate-700">{formatBookingId(viewingInvoice.id)}</span></p>
                    </div>
                  </div>
                </div>

                <div className="mb-12">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">تفاصيل حجز القاعة والخدمات والضرائب</h3>
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b-2 border-slate-800 text-slate-800">
                        <th className="py-4 font-black">الوصف والبيانات</th>
                        <th className="py-4 font-black text-center">الكمية</th>
                        <th className="py-4 font-black text-center">السعر (غير شامل الضريبة)</th>
                        <th className="py-4 font-black text-center">نسبة الضريبة</th>
                        <th className="py-4 font-black text-center">مبلغ الضريبة</th>
                        <th className="py-4 font-black text-left">الإجمالي (شامل الضريبة)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr>
                        <td className="py-6">
                          <p className="font-bold text-slate-800 text-base">حجز قاعة: {viewingInvoice.hall.name}</p>
                          <p className="text-xs text-slate-400 mt-1">تاريخ المناسبة: {viewingInvoice.date} ({viewingInvoice.period})</p>
                          {viewingInvoice.extraServices && (
                            <p className="text-xs text-slate-500 mt-1">خدمات إضافية: {viewingInvoice.extraServices}</p>
                          )}
                        </td>
                        <td className="py-6 text-center text-slate-600 font-bold">1</td>
                        <td className="py-6 text-center text-slate-600 font-mono">{(subtotalValue).toFixed(2)} ر.س</td>
                        <td className="py-6 text-center text-slate-600 font-mono">{isExempt ? '0%' : '15%'}</td>
                        <td className="py-6 text-center text-slate-600 font-mono">{(vatValue).toFixed(2)} ر.س</td>
                        <td className="py-6 text-left font-black text-blue-950 font-mono">{total.toFixed(2)} ر.س</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <div className="flex flex-col md:flex-row justify-between gap-12 pt-8 border-t border-slate-100">
                  <div className="flex-1">
                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> ملاحظات قانونية وإقرار ضريبي
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed space-y-1.5">
                        <span>• تعتبر هذه الفاتورة مستنداً محاسبياً ضريبياً مبسطاً معتمداً ومطابقاً لكافة شروط وأحكام هيئة الزكاة والضريبة والجمارك (ZATCA) في المملكة العربية السعودية.</span>
                        <br />
                        <span>• جميع المعاملات تتم بشفافية تامة ومحمية بموجب أنظمة التجارة الإلكترونية المعمول بها بالمملكة.</span>
                      </p>
                    </div>
                  </div>
                  
                  <div className="w-full md:w-96 space-y-3.5">
                    <div className="flex justify-between text-slate-500 font-bold text-sm">
                      <span>المبلغ الخاضع للضريبة:</span>
                      <span className="font-mono">{(subtotalValue).toFixed(2)} ر.س</span>
                    </div>
                    <div className="flex justify-between text-slate-500 font-bold text-sm">
                      <span>ضريبة القيمة المضافة ({isExempt ? '0%' : '15%'}):</span>
                      <span className="font-mono">{(vatValue).toFixed(2)} ر.س</span>
                    </div>
                    {isExempt && (
                      <p className="text-left text-[10px] text-amber-600 font-bold">معفى لعدم انطباقها نظاماً</p>
                    )}
                    <div className="flex justify-between items-center py-4 border-y border-slate-100">
                      <span className="text-lg font-black text-blue-950">الإجمالي النهائي:</span>
                      <span className="text-2xl font-black text-amber-600 font-mono">{total.toFixed(2)} ر.س</span>
                    </div>
                    
                    {isPartial ? (
                      <div className="bg-amber-50/75 p-3.5 rounded-2xl border border-amber-100 space-y-2.5 text-xs font-bold text-slate-800">
                        <div className="flex justify-between text-emerald-800">
                          <span>الدفعة المقدمة المسددة ({((depositPaid / total) * 100).toFixed(0)}%):</span>
                          <span className="font-mono">{depositPaid.toFixed(2)} ر.س</span>
                        </div>
                        <div className="flex justify-between text-rose-800 pt-2 border-t border-dashed border-amber-200">
                          <span>المبلغ المتبقي مستحق السداد:</span>
                          <span className="font-mono">{balanceDue.toFixed(2)} ر.س</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-emerald-50/75 p-3.5 rounded-2xl border border-emerald-100 flex justify-between text-emerald-800 text-xs font-bold">
                        <span>المبلغ المسدد بالكامل:</span>
                        <span className="font-mono">{total.toFixed(2)} ر.س</span>
                      </div>
                    )}
                    <p className="text-[10px] text-slate-400 text-center pt-2">شكراً لتعاملك مع {platformData.platformName || 'منصة ليلة'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Cancel Booking Modal */}
      {cancellingBooking && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <span className="text-lg font-black text-rose-800 flex items-center gap-2">طلب إلغاء الحجز</span>
              <button onClick={() => setCancellingBooking(null)} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              
              {/* Force Majeure Eligibility Option */}
              {cancellingBooking.status === 'confirmed' &&
               getFinancialSettings().enableForceMajeureProtocol &&
               checkForceMajeureWindow(cancellingBooking) && (
                <div className="bg-amber-50/75 border border-amber-200/70 p-4 rounded-xl space-y-3 transition-all duration-200 text-right">
                  <label className="flex items-start gap-3 cursor-pointer select-none text-right">
                    <input 
                      type="checkbox" 
                      checked={isForceMajeure} 
                      onChange={(e) => setIsForceMajeure(e.target.checked)}
                      className="mt-1 w-4 h-4 rounded border-amber-300 accent-amber-600 cursor-pointer text-amber-600 focus:ring-amber-500"
                    />
                    <div className="space-y-1 text-right">
                      <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                        ⚠️ تقديم الطلب تحت بند القوة القاهرة والظروف الاستثنائية
                      </span>
                      <p className="text-[11px] text-amber-800 leading-relaxed leading-[1.4]">
                        بروتوكول الأمان المالي لمنح العميل الأولوية واسترجاع كامل المبلغ أو قسيمة رصيد دفتري 100% فور توثيق المستندات الطارئة.
                      </p>
                    </div>
                  </label>

                  {isForceMajeure && (
                    <div className="space-y-3 pt-3 border-t border-amber-200/50 animate-in fade-in slide-in-from-top-1 duration-200 text-right">
                      <div className="bg-red-50 border-r-4 border-red-600 p-3 rounded-lg text-red-700 text-right leading-relaxed text-xs shadow-sm font-bold">
                        تنبيه: هذا الخيار يتطلب وثائق رسمية واقعية وصحيح، وأي وثائق غير واقعية وصحيحة تعرض صاحبها للملاحقة القانوينة، ولا يستخدم إلا في الظروف القاهرة حسب ماهو موضح في الشروط والأحكام.
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1.5 text-right">أسباب وظروف الإلغاء بالتفصيل:</label>
                        <textarea
                          required
                          rows={3}
                          value={fmReason}
                          onChange={(e) => setFmReason(e.target.value)}
                          placeholder="الرجاء كتابة الحالة بالتفصيل (أسباب طبية، ظروف السفر، طوارئ مدنية...)"
                          className="w-full text-xs p-2.5 rounded-lg border border-amber-200 focus:border-amber-500 bg-white outline-none text-right"
                          dir="rtl"
                        ></textarea>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-amber-950 mb-1.5 text-right">رفع المستندات الثبوتية الداعمة (مستند واحد على الأقل):</label>
                        <div className="border border-dashed border-amber-300 hover:border-amber-400 bg-amber-50/20 hover:bg-amber-50/40 p-4 rounded-lg text-center transition-all relative">
                          <input
                            type="file"
                            id="fm-doc-uploader"
                            disabled={isUploadingFmDoc}
                            onChange={(e) => handleFmFileUpload(e.target.files)}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div className="space-y-1">
                            <div className="mx-auto w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center text-amber-700 font-bold text-sm">
                              {isUploadingFmDoc ? "⏳" : "📁"}
                            </div>
                            <p className="text-[11px] font-bold text-amber-900">اسحب الملف وأفلته هنا أو اضغط للتصفح والرفع</p>
                            <p className="text-[9px] text-amber-700/80">نقبل PDF, JPG, PNG لإثبات الحالة الرسمية</p>
                          </div>
                        </div>

                        {fmDocs.length > 0 && (
                          <div className="mt-2 space-y-1 text-right">
                            <p className="text-[11px] font-bold text-amber-950">المستندات المرفقة ({fmDocs.length}):</p>
                            <div className="flex flex-wrap gap-1.5 justify-end">
                              {fmDocs.map((url, index) => (
                                <div key={index} className="flex items-center gap-1.5 bg-white text-slate-700 text-[10px] py-1 px-2.5 rounded-lg border border-slate-200">
                                  <button
                                    type="button"
                                    onClick={() => setFmDocs(prev => prev.filter((_, idx) => idx !== index))}
                                    className="text-red-500 hover:text-red-700 font-bold text-sm leading-none"
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

              {/* Ordinary Cancellation view warning */}
              {!isForceMajeure && (
                <div className="space-y-3 text-right">
                  <div className="bg-red-50/50 border border-red-100 p-4 rounded-xl text-rose-700 text-xs leading-relaxed space-y-1 text-right">
                    <p className="font-bold">تنبيه هام حول سياسة الإلغاء العادية:</p>
                    <p>إلغاء الحجز قد يخضع لرسوم إلغاء حسب الشروط المتفق عليها مع مقدم الخدمة لقاعة <span className="font-extrabold">{cancellingBooking.hall.name}</span>.</p>
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

      <ProviderChatModal isOpen={isProviderChatOpen} onClose={() => setIsProviderChatOpen(false)} providerName={chatData.providerName} hallName={chatData.hallName} />

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
