import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useTheme } from '../context/ThemeContext';
import { 
  ShieldAlert, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  DollarSign, 
  AlertCircle, 
  Download, 
  ChevronRight, 
  Calendar, 
  Users, 
  Layers, 
  Plus, 
  SlidersHorizontal, 
  Cpu, 
  Activity, 
  CreditCard, 
  Lock,
  ArrowUpRight,
  ArrowDownLeft,
  X,
  FileSpreadsheet,
  Check,
  Building,
  Bell,
  RefreshCw,
  Search,
  Phone,
  MessageSquare,
  Info
} from 'lucide-react';
import { formatBookingId } from '../utils/idUtils';

// Formatted Arabic dates helper
const getFormattedArabicDate = (daysOffset = 0) => {
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  return date.toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export default function LogisticsOperationsPortalPage() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    // Graceful forwarding to Unified Provider Dashboard
    navigate('/provider-dashboard?tab=inventory', { replace: true });
  }, [navigate]);
  
  // Authorization & subscription state
  const [user, setUser] = useState<any>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<string>('customer');
  const [hasSubscription, setHasSubscription] = useState<boolean>(false);
  const [subscriptionDetails, setSubscriptionDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Data State
  const [bookings, setBookings] = useState<any[]>([]);
  const [supportRequests, setSupportRequests] = useState<any[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'contracts' | 'logistics' | 'finance' | 'independentRequests'>('contracts');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const [supportServiceSearchQuery, setSupportServiceSearchQuery] = useState<string>('');
  const [supportServiceFilterStatus, setSupportServiceFilterStatus] = useState<string>('');

  // Load and sync independent support service requests
  const [supportServiceRequests, setSupportServiceRequests] = useState<any[]>(() => {
    const saved = localStorage.getItem('SUPPORT_SERVICE_REQUESTS_V4');
    return saved ? JSON.parse(saved) : [
      { id: 1, customerName: 'الأستاذ أحمد الحارثي', serviceName: 'بوفيه مفتوح فاخر والضيافة الشاملة', providerName: 'بوفيهات النخبة الملكية', price: 4500, status: 'قيد الانتظار' },
      { id: 2, customerName: 'د. سارة الهاشم', serviceName: 'تصوير احترافي فوتوغرافي وفيديو طيلة الحفلة', providerName: 'استوديو رتوش الفني', price: 2500, status: 'تم القبول' },
      { id: 3, customerName: 'المهندس رائد العتيبي', serviceName: 'دي جي وأحدث المؤثرات الصوتية والضوئية', providerName: 'مجموعة أوتار الصوتية', price: 1500, status: 'مكتمل' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('SUPPORT_SERVICE_REQUESTS_V4', JSON.stringify(supportServiceRequests));
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('booking_updated'));
  }, [supportServiceRequests]);

  useEffect(() => {
    const handleStorage = (e: StorageEvent | Event) => {
      if (e.type === 'storage' && (e as StorageEvent).key && (e as StorageEvent).key !== 'SUPPORT_SERVICE_REQUESTS_V4') return;
      const saved = localStorage.getItem('SUPPORT_SERVICE_REQUESTS_V4');
      if (saved) {
        setSupportServiceRequests(prev => {
          if (JSON.stringify(prev) !== saved) {
            return JSON.parse(saved);
          }
          return prev;
        });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString('ar-SA')} ر.س`;
  };
  
  // Urgent Logistics Creation Form state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selectedBookingForLogistics, setSelectedBookingForLogistics] = useState<string>('');
  const [logisticsForm, setLogisticsForm] = useState({
    serviceType: 'دي جي وفِرق',
    description: '',
    price: 3500,
    status: 'pending'
  });
  
  // Financial simulated actions
  const [recentEscrowNotification, setRecentEscrowNotification] = useState<string | null>(null);
  const [escrowReleasedIds, setEscrowReleasedIds] = useState<number[]>([]);
  
  // Selected Viewing Booking for Modal Detail (Strict Scrollable Free popup)
  const [selectedViewingBooking, setSelectedViewingBooking] = useState<any>(null);

  // System notification
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const triggerNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 5000);
  };

  // 1. Initial Setup: Read Auth and Subscriptions
  const checkAuthAndSub = () => {
    try {
      setIsLoading(true);
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) {
        setIsAuthenticated(false);
        setIsLoading(false);
        return;
      }
      
      const parsedUser = JSON.parse(userStr);
      setUser(parsedUser);
      setIsAuthenticated(true);
      
      // Determine role
      const email = (parsedUser.email || '').toLowerCase();
      const role = (parsedUser.role || '').toLowerCase();
      let normalizedRole = 'customer';
      
      if (role.includes('admin') || role.includes('مدير') || role.includes('مشرف')) {
        normalizedRole = 'admin';
      } else if (role.includes('provider') || role.includes('مزود') || role.includes('موظف') || role.includes('خدمة') || role.includes('شريك')) {
        normalizedRole = 'provider';
      } else if (role.includes('agency') || role.includes('تسويق')) {
        normalizedRole = 'agency';
      } else {
        normalizedRole = 'customer';
      }
      
      setUserRole(normalizedRole);
      
      // Check Subscription
      const currentUserName = parsedUser.name || parsedUser.username || '';
      const subKey = currentUserName ? `provider_subscription_${currentUserName}` : 'provider_subscription';
      const storedSub = localStorage.getItem(subKey);
      
      if (storedSub) {
        const parsedSub = JSON.parse(storedSub);
        // Valid subscription check: must be active/subbed
        setSubscriptionDetails(parsedSub);
        
        // Dynamically trace the associated subscription configuration in the system database
        let includesLogisticsPortal = parsedSub.includesLogisticsPortal === true || 
                                      parsedSub.includesLogisticsPortal === 'true' ||
                                      (parsedSub.packageName && (parsedSub.packageName.includes('الاحترافية') || parsedSub.packageName.toLowerCase().includes('pro')));
        
        try {
          const allPlansStr = localStorage.getItem('app_subscriptions');
          if (allPlansStr) {
            const allPlans = JSON.parse(allPlansStr);
            if (Array.isArray(allPlans)) {
              const currentPlanName = parsedSub.packageName || parsedSub.name || '';
              const matchedPlanObj = allPlans.find((p: any) => 
                (p.name && currentPlanName && p.name.trim() === currentPlanName.trim()) || 
                (p.id && parsedSub.id && String(p.id) === String(parsedSub.id))
              );
              if (matchedPlanObj) {
                includesLogisticsPortal = matchedPlanObj.includesLogisticsPortal === true || 
                                          matchedPlanObj.includesLogisticsPortal === 'true' ||
                                          (matchedPlanObj.name && (matchedPlanObj.name.includes('الاحترافية') || matchedPlanObj.name.toLowerCase().includes('pro')));
              }
            }
          }
        } catch (e) {
          console.error("Error matching sub plan live", e);
        }

        const hasValidPlan = includesLogisticsPortal;
        setHasSubscription(hasValidPlan);
      } else {
        // Fallback: If they are admin, they bypass the subscription restriction automatically
        if (normalizedRole === 'admin') {
          setHasSubscription(true);
        } else {
          setHasSubscription(false);
        }
      }
    } catch (e) {
      console.error("Auth verify error", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuthAndSub();
    
    // Listen for storage or custom events
    window.addEventListener('storage', checkAuthAndSub);
    return () => {
      window.removeEventListener('storage', checkAuthAndSub);
    };
  }, []);

  // 2. Fetch Data (with seamless high-reliability mock fallbacks)
  const fetchData = async () => {
    setIsRefreshing(true);
    try {
      // Fetch bookings from real backend
      const resBookings = await fetch('/api/bookings');
      let backendBookings = [];
      if (resBookings.ok) {
        backendBookings = await resBookings.json();
      }
      
      // Fetch logistics support requests from real backend
      const resSupport = await fetch('/api/bookings/support-requests');
      let backendSupport = [];
      if (resSupport.ok) {
        backendSupport = await resSupport.json();
      }

      // Generate realistic Saudi data if database registers empty records (fail-safe and fully loaded UX)
      const mappedBookings = backendBookings.length > 0 ? backendBookings : [
        {
          id: 101,
          customerName: "الأستاذ خالد السديري",
          phone: "+966 50 123 4567",
          email: "khaled@sly.sa",
          status: "confirmed",
          totalAmount: 18000,
          paidAmount: 5000,
          startTime: new Date(Date.now() + 86400000 * 3).toISOString(), // 3 days from now
          period: "مسائي",
          hall: { name: "صالة اللؤلؤة الكبرى الملكية", location: "الرياض - حي الياسمين", category: "قاعة أفراح" },
          notes: "تحتاج العائلة لتنسيق السجاد الملكي الذهبي الفاخر من البوابة الرئيسية"
        },
        {
          id: 102,
          customerName: "د. هتون الفاسي",
          phone: "+966 54 999 8811",
          email: "hatoon.f@org.sa",
          status: "pending",
          totalAmount: 12500,
          paidAmount: 3000,
          startTime: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
          period: "صباحي",
          hall: { name: "صالة أوبرا للاجتماعات والمؤتمرات", location: "جدة - الكورنيش الشمالي", category: "قاعة اجتماعات" },
          notes: "تجهيز الشاشات والترجمة الفورية للمتحدثين الدوليين"
        },
        {
          id: 103,
          customerName: "المهندس فيصل بن معمر",
          phone: "+966 53 456 7890",
          email: "f.moammar@villas.com",
          status: "confirmed",
          totalAmount: 9500,
          paidAmount: 9500,
          startTime: new Date(Date.now() - 86400000).toISOString(), // 1 day ago (completed state)
          period: "كامل اليوم",
          hall: { name: "شاليه الفخامة رويال", location: "الرياض - رماح", category: "شاليه" },
          notes: "حفل عائلي خاص بوفيه شواء ومصورة فوتوغرافية مرافقة"
        }
      ];

      const mappedSupport = backendSupport.length > 0 ? backendSupport : [
        {
          id: 201,
          bookingId: 101,
          serviceType: "بوفيه وضيافة",
          description: "توفير بوفيه عشاء مفتوح VIP متكامل لعدد 250 شخص مع طاقم تقديم متميز وعصائر فريش طوال السهرة.",
          status: "processing",
          price: 6500,
          assignedAgent: "شركة أطياف لخدمات الضيافة"
        },
        {
          id: 202,
          bookingId: 101,
          serviceType: "تصوير",
          description: "فريق تصوير سينمائي فوتوغرافي مرئي متكامل، يشمل طائرة درون خارجية وجلسة تصوير وتجهيز ألبوم فاخر.",
          status: "pending",
          price: 4500,
          assignedAgent: "المصورة الاحترافية سارة الدوسري"
        },
        {
          id: 203,
          bookingId: 102,
          serviceType: "تنسيق قاعات",
          description: "تصميم كوشة من الورد الطبيعي الأبيض والزهور الاستوائية النادرة وتزيين طاولات الضيوف الـ 15 بالشموع الطائرة.",
          status: "completed",
          price: 3200,
          assignedAgent: "مؤسسة روز لتجميل القواسم والزهور"
        },
        {
          id: 204,
          bookingId: 103,
          serviceType: "دي جي وفِرق",
          description: "تركيب عتاد الصوتيات العازل المتقدم ونظام مكبر الرنين وسماعات الغمر الصوتي ديجي مباشر على مدار 6 ساعات متواصلة.",
          status: "completed",
          price: 2500,
          assignedAgent: "فرقة الألحان الذهبية للمناسبات"
        }
      ];

      setBookings(mappedBookings);
      setSupportRequests(mappedSupport);
    } catch (e) {
      console.error("Oops! API retrieval error. Fallback with simulated high-end dataset is active.", e);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && hasSubscription) {
      fetchData();
    }
  }, [isAuthenticated, hasSubscription]);

  // Handle immediate subscription simulation (Luxury Action to let users upgrade and access in 1 click!)
  const handleInstantUpgrade = () => {
    try {
      const userStr = localStorage.getItem('currentUser');
      const parsedUser = userStr ? JSON.parse(userStr) : { name: 'شريك متميز' };
      const currentUserName = parsedUser.name || parsedUser.username || 'شريك متميز';
      const subKey = `provider_subscription_${currentUserName}`;
      
      const newSub = {
        id: 'pro',
        packageName: 'الباقة الاحترافية البلاتينية',
        packageName_display: 'الباقة الاحترافية البلاتينية (الذهبية)',
        includesAdvancedProviderDashboard: true,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 31536000000).toISOString(), // 1 year
        status: 'active',
        price: '3,500 ر.س / سنوياً'
      };
      
      localStorage.setItem(subKey, JSON.stringify(newSub));
      localStorage.setItem('provider_subscription', JSON.stringify(newSub));
      
      triggerNotification('success', '✨ تهانينا! تمت ترقية حسابكم فورياً بنجاح وجاري فتح بوابة العمليات اللوجستية الفاخرة.');
      checkAuthAndSub();
    } catch (error) {
      triggerNotification('error', 'فشل في محاكاة الترقية الفورية للباقة.');
    }
  };

  // 3. Actions on records (Approve / Reject / Change logistics status)
  const handleUpdateBookingStatus = async (id: number, newStatus: 'confirmed' | 'pending' | 'cancelled') => {
    try {
      // Optimistic state update
      setBookings(prev => prev.map(b => b.id === id ? { ...b, status: newStatus } : b));
      
      // Update on API server if the record is a real db record
      const res = await fetch(`/api/bookings/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        triggerNotification('success', `تم تحديث حالة عقد الحجز #${id} بنجاح إلى: ${newStatus === 'confirmed' ? 'مؤكد ومقبول' : newStatus === 'cancelled' ? 'ملغي' : 'قيد الانتظار'}`);
      } else {
        triggerNotification('success', `[محاكاة محلية] تم تحديث حالة العقد #${id} بنجاح.`);
      }
    } catch {
      triggerNotification('success', `[محاكاة محلية لسيناريو غير متصل] تم حفظ حالة الحجز #${id}.`);
    }
  };

  const handleUpdateSupportRequestStatus = async (id: number, newStatus: string) => {
    try {
      setSupportRequests(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s));
      
      const res = await fetch(`/api/bookings/support-requests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (res.ok) {
        triggerNotification('success', `تم إطلاق وتحديث حالة دعم العملية #${id} إلى: ${newStatus}`);
      } else {
        triggerNotification('success', `[تحديث العمليات] تم تعديل مسار الخدمة اللوجستية #${id} كـ: ${newStatus}`);
      }
    } catch {
      triggerNotification('success', `[تحديث العمليات] تم تعديل مسار الخدمة #${id} بنجاح.`);
    }
  };

  // 4. Create an urgent logistics request tied to an active booking
  const handleCreateSupportRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBookingForLogistics) {
      triggerNotification('error', 'الرجاء اختيار العقد المعني بالعمليات أولاً');
      return;
    }
    
    const newRequest = {
      bookingId: parseInt(selectedBookingForLogistics, 10),
      serviceType: logisticsForm.serviceType,
      description: logisticsForm.description || `طلب دعم عاجل من فئة ${logisticsForm.serviceType}`,
      price: parseFloat(String(logisticsForm.price)) || 1000,
      status: 'pending'
    };

    try {
      const res = await fetch('/api/bookings/support-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequest)
      });

      if (res.ok) {
        const data = await res.json();
        setSupportRequests(p => [data, ...p]);
        triggerNotification('success', '🚀 جاري إطلاق طاقم الدعم والعمليات اللوجستية، وتوجيه الإشعار للشريك المنفذ!');
      } else {
        // Fallback for simulation
        const mockNew = {
          id: Math.floor(Math.random() * 10000) + 300,
          bookingId: newRequest.bookingId,
          serviceType: newRequest.serviceType,
          description: newRequest.description,
          status: 'pending',
          price: newRequest.price,
          assignedAgent: "توجيه آلي - قيد التعيين لمزود لوجستي"
        };
        setSupportRequests(p => [mockNew, ...p]);
        triggerNotification('success', '🚀 [محاكاة العملية] تم إدراج طلبك وتوجيهه إلى قنوات الشركاء والدعم اللوجستي بنجاح!');
      }
      setIsModalOpen(false);
      setLogisticsForm({ serviceType: 'دي جي وفِرق', description: '', price: 3500, status: 'pending' });
    } catch {
      triggerNotification('error', 'فشلت معالجة الطلب اللوجستي.');
    }
  };

  // Financial Escrow Release Simulation
  const handleReleaseEscrow = async (id: number, amount: number, customerName: string) => {
    try {
      await fetch('/api/finance/release-funds', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId: 'provider_1', bookingId: id })
      });
    } catch (err) {
      console.warn("Failed to connect with finance backend for escrow release:", err);
    }

    setEscrowReleasedIds(prev => [...prev, id]);
    setRecentEscrowNotification(`تمت معالجة فك وتصفية الضمان النقدي المقدر بـ ${amount.toLocaleString('ar-SA')} ر.س لعقد العميل (${customerName}) وتم تحرير الضمان المالي ومستحقات العقد بنجاح.`);
    triggerNotification('success', `💸 جاري تحرير الضمان المالي ومستحقات العقد #${id} البالغة ${amount.toLocaleString('ar-SA')} ر.س إلى حسابك المصرفي المربوط.`);
  };

  const filteredLogistics = useMemo(() => {
    return supportRequests.filter(s => {
      // SECURITY BOUNDARY: Provider should only see their own logistics support requests!
      if (userRole === 'provider' && user?.name) {
        const providerAttr = s.providerName || s.provider || s.assignedAgent || '';
        const matchesProvider = providerAttr.toLowerCase().includes(user.name.toLowerCase()) || 
                                user.name.toLowerCase().includes(providerAttr.toLowerCase());
        if (!matchesProvider && providerAttr !== '') {
          return false;
        }
      }

      const matchSearch = 
        s.serviceType?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.assignedAgent?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.bookingId?.toString().includes(searchQuery);
      
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [supportRequests, searchQuery, statusFilter, userRole, user]);

  const filteredBookings = useMemo(() => {
    return bookings.filter(b => {
      // SECURITY BOUNDARY: Provider should only see their own bookings!
      if (userRole === 'provider' && user?.name) {
        const providerAttr = b.provider || b.providerName || b.hall?.provider || b.hall?.providerName || '';
        const isMyBooking = providerAttr.toLowerCase().includes(user.name.toLowerCase()) || 
                            user.name.toLowerCase().includes(providerAttr.toLowerCase()) ||
                            // Fallback for mock provider "قاعة ليلة العمر الفاخرة" matching "قاعة الملكية" or similar
                            (user.name.includes("ليلة العمر") && (b.hall?.name?.includes("اللؤلؤة") || b.hall?.name?.includes("الملكية")));
        if (!isMyBooking && providerAttr !== '') {
          return false;
        }
      }

      const matchSearch = 
        b.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.phone?.includes(searchQuery) ||
        (b.hall?.name && b.hall.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.id?.toString().includes(searchQuery);
      
      const matchStatus = statusFilter === 'all' || b.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [bookings, searchQuery, statusFilter, userRole, user]);

  const statsSummary = useMemo(() => {
    // SECURITY BOUNDARY: Provider should only see their own statistics!
    const currentUserName = user?.name || '';
    const isProvider = userRole === 'provider';

    const myBookings = isProvider
      ? bookings.filter(b => {
          const providerAttr = b.provider || b.providerName || b.hall?.provider || b.hall?.providerName || '';
          return providerAttr.toLowerCase().includes(currentUserName.toLowerCase()) || 
                 currentUserName.toLowerCase().includes(providerAttr.toLowerCase()) ||
                 (currentUserName.includes("ليلة العمر") && (b.hall?.name?.includes("اللؤلؤة") || b.hall?.name?.includes("الملكية"))) ||
                 providerAttr === '';
        })
      : bookings;

    const mySupportRequests = isProvider
      ? supportRequests.filter(s => {
          const providerAttr = s.providerName || s.provider || s.assignedAgent || '';
          return providerAttr.toLowerCase().includes(currentUserName.toLowerCase()) || 
                 currentUserName.toLowerCase().includes(providerAttr.toLowerCase()) ||
                 providerAttr === '';
        })
      : supportRequests;

    const mySupportServiceRequests = isProvider
      ? supportServiceRequests.filter(r => {
          const providerAttr = r.providerName || r.provider || '';
          return providerAttr.toLowerCase().includes(currentUserName.toLowerCase()) || 
                 currentUserName.toLowerCase().includes(providerAttr.toLowerCase()) ||
                 providerAttr === '';
        })
      : supportServiceRequests;

    // --- Indicator 1: Total Revenue (إجمالي الإيرادات الكلي) ---
    const totalHallsRevenue = myBookings.reduce((acc, b) => acc + (b.totalAmount || 0), 0);
    const totalServicesRevenue = mySupportServiceRequests.reduce((acc, r) => acc + (Number(r.price) || 0), 0);
    const totalRevenue = totalHallsRevenue + totalServicesRevenue;

    const totalPaid = myBookings.reduce((acc, b) => acc + (b.paidAmount || 0), 0);
    
    // --- Indicator 2: Escrow Total (الإيرادات المحتجزة - الضمان المالي) ---
    const escrowHalls = myBookings.reduce((acc, b) => !escrowReleasedIds.includes(b.id) ? acc + (b.paidAmount || 0) : acc, 0);
    const escrowServices = mySupportServiceRequests.filter(r => r.status === 'قيد الانتظار').reduce((acc, r) => acc + (Number(r.price) || 0), 0);
    const escrowTotal = escrowHalls + escrowServices;

    // --- Indicator 3: Released Earnings (المكاسب المسيلة والمصروفة) ---
    const releasedHallsGross = myBookings.reduce((acc, b) => escrowReleasedIds.includes(b.id) ? acc + (b.paidAmount || 0) : acc, 0);
    const releasedServicesGross = mySupportServiceRequests.filter(r => r.status === 'تم القبول' || r.status === 'مكتمل').reduce((acc, r) => acc + (Number(r.price) || 0), 0);
    
    const releasedHallsNet = releasedHallsGross * 0.975;
    const releasedServicesNet = releasedServicesGross * 0.975;
    const releasedEarnings = releasedHallsNet + releasedServicesNet;
    
    // --- Indicator 4: Platform Commission (عمولة المنصة الإجمالية) ---
    const totalCommission = totalRevenue * 0.025;
    
    // --- Indicator 5: Net Profit (صافي الأرباح المحققة للشريك) ---
    const netHalls = totalHallsRevenue * 0.975;
    const netServices = totalServicesRevenue * 0.975;
    const netRevenue = netHalls + netServices;

    const efficiencyRate = 97.4;
    return { 
      totalHallsRevenue,
      totalServicesRevenue,
      totalRevenue, 
      totalPaid, 
      escrowHalls, 
      escrowServices, 
      escrowTotal, 
      releasedHallsGross,
      releasedServicesGross,
      releasedHallsNet,
      releasedServicesNet,
      releasedEarnings, 
      totalCommission, 
      netHalls,
      netServices,
      netRevenue, 
      efficiencyRate 
    };
  }, [bookings, supportRequests, supportServiceRequests, escrowReleasedIds, user, userRole]);

  // Not Logged In paywall
  if (!isAuthenticated) {
    return (
      <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-955'}`} dir="rtl">
        <Header />
        <div className="flex-grow flex items-center justify-center py-20 px-4">
          <div className={`max-w-xl w-full backdrop-blur-md rounded-3xl p-10 border text-center shadow-2xl transition-all duration-300 ${isDark ? 'bg-slate-955/60 border-amber-500/10' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${isDark ? 'bg-red-955/40 border-red-550/20' : 'bg-red-50 border-red-150'}`}>
              <ShieldAlert className="w-8 h-8 text-red-500" />
            </div>
            <h1 className={`text-2xl font-black mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>الصلاحية مقيدة بالخصوصية الأمنية</h1>
            <p className={`text-sm leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              عذراً، يتطلب الوصول إلى "بوابة إدارة الطلبات والعمليات اللوجستية" تسجيل الدخول بحساب مزود الخدمة المعتمد أو مشرف المنصة. يرجى تسجيل الدخول والمحاولة مرة أخرى.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register" className="px-6 py-3 bg-amber-500 text-slate-900 border border-amber-500 hover:bg-amber-600 rounded-xl font-bold text-sm transition-all shadow-lg shadow-amber-500/10 text-center">
                تسجيل مزود خدمة جديد
              </Link>
              <button onClick={() => {
                // Open login modal globally or direct
                const loginBtn = document.querySelector('[className*="LoginModal"]');
                if (loginBtn) {
                  (loginBtn as HTMLElement).click();
                } else {
                  // Fallback simulation
                  const mockUser = { name: "قاعة ليلة العمر الفاخرة", email: "provider@lailat-omar.com", role: "provider", status: "نشط" };
                  localStorage.setItem('currentUser', JSON.stringify(mockUser));
                  triggerNotification('success', 'تم توفير مستخدم شريك تجريبي بنجاح. يرجى التحديث.');
                  checkAuthAndSub();
                }
              }} className={`px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
                isDark 
                  ? 'bg-slate-800 text-slate-205 border-slate-700 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-700 border-slate-350 hover:bg-slate-200'
              }`}>
                المحاكاة السريعة لتسجيل الدخول
              </button>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Active Role is Not Provider / Admin Gate - Gentle friendly warning
  if (userRole !== 'provider' && userRole !== 'admin') {
    return (
      <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-950'}`} dir="rtl">
        <Header />
        <div className="flex-grow flex items-center justify-center py-20 px-4">
          <div className={`max-w-xl w-full backdrop-blur-md rounded-3xl p-10 border text-center shadow-2xl transition-all duration-300 ${isDark ? 'bg-slate-955/60 border-amber-500/10' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6 border ${isDark ? 'bg-amber-955/40 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
              <ShieldAlert className="w-8 h-8 text-amber-500" />
            </div>
            <h1 className={`text-2xl font-black mb-3 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>هذه الصفحة مخصصة للمزودين الشركاء</h1>
            <p className={`text-xs leading-relaxed mb-8 max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              بوابة الإجراءات ومتابعة ميزانيات الخدمات وتدفقات السيولة النقدية مخصصة ومصممة فقط للشركاء المعتمدين والمزودين الأفاضل. حسابكم الحالي مصنف كـ (<span className="text-amber-500 font-bold">{userRole}</span>).
            </p>
            <div className="flex gap-4 justify-center">
              <button onClick={() => {
                const userObj = JSON.parse(localStorage.getItem('currentUser') || '{}');
                userObj.role = 'provider';
                localStorage.setItem('currentUser', JSON.stringify(userObj));
                triggerNotification('success', 'تم تعديل دور حسابك فورياً إلى مزود شريك لمطابقة الدليل العملي!');
                checkAuthAndSub();
              }} className="px-6 py-3 bg-amber-500 text-slate-900 rounded-xl font-bold text-sm transition-all hover:bg-amber-600 shadow-lg cursor-pointer">
                تحويل حسابي فوري كـ "مزود خدمة"
              </button>
              <Link to="/" className={`px-6 py-3 rounded-xl font-bold text-sm transition-all border ${
                isDark 
                  ? 'bg-slate-800 text-slate-205 border-slate-750 hover:bg-slate-700' 
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}>
                العودة للرئيسية
              </Link>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Paywall: If they are not subscribed to Business / Pro / Premium plan
  if (!hasSubscription) {
    return (
      <div className={`min-h-screen flex flex-col justify-between font-sans transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-950'}`} dir="rtl">
        <Header />
        <div className="flex-grow flex items-center justify-center py-16 px-4 relative overflow-hidden">
          {/* Visual ambience glow elements */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl"></div>
          
          <div className={`max-w-2xl w-full backdrop-blur-xl rounded-[2.5rem] p-10 border text-center shadow-3xl relative z-10 transition-colors duration-300 ${isDark ? 'bg-slate-955/80 border-amber-500/20' : 'bg-white border-slate-200 shadow-xl'}`}>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-955 text-[10px] font-black uppercase px-5 py-1.5 rounded-full tracking-widest flex items-center gap-1.5 shadow">
              <Sparkles className="w-3.5 h-3.5" /> بوابة الشركاء النخبة
            </div>

            <div className={`w-20 h-20 border rounded-3xl flex items-center justify-center mx-auto mb-8 mt-4 shadow-inner ${isDark ? 'bg-slate-900 border-amber-500/20' : 'bg-amber-50 border-amber-200'}`}>
              <Lock className="w-10 h-10 text-amber-500 animate-pulse" />
            </div>

            <h1 className={`text-2xl font-black ${isDark ? 'text-transparent bg-clip-text bg-gradient-to-l from-amber-400 via-amber-200 to-amber-50' : 'text-slate-900'} px-2 leading-snug mb-4`}>
              هذه بوابة "إدارة السيولة والطلبات المتقدمة"
            </h1>
            
            <p className={`text-sm leading-relaxed mb-6 max-w-lg mx-auto ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              أهلاً بك يا <span className="font-bold text-amber-500">{user?.name || 'مزودنا الكريم'}</span>. يتطلب تفعيل واجهة الفرز اللوجستي وتتبع تدفقات سيولة تسييل العربون وحجوزات القاعات الاشتراك بباقة توفر خيار <span className="text-emerald-555 font-bold">"بوابة الطلبات اللوجستية وإدارة السيولة المتقدمة"</span> بشكل مستقل. ويرجى الترقية أو مراجعة إدارة المنصة لتفعيل الخاصية لباقة حسابك الحالي.
            </p>

            {/* Simulated features table comparison to spark conversions */}
            <div className={`rounded-2xl p-6 border text-right mb-8 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <h4 className={`text-xs font-bold mb-4 tracking-wider uppercase ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>الميزات اللوجستية المتطورة للشركاء النشطين:</h4>
              <ul className="space-y-3">
                <li className={`flex items-start gap-2.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>تسييل مبالغ الحجز والضمانات النقدية إلى حسابك المصرفي مباشرة فور اكتمال السهرة أو الحفل بنقرة زر واحدة.</span>
                </li>
                <li className={`flex items-start gap-2.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>لوحة تحكم إطلاق ومراقبة العمليات والخدمات اللوجستية المساندة (البوفيه، منسق الورد، المصورين، الدي في والمصاعد).</span>
                </li>
                <li className={`flex items-start gap-2.5 text-xs ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                  <CheckCircle2 className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <span>مؤشر الكفاءة ومقارنة الإيجارات المباشرة وتتبع نسب الحضور والرضا.</span>
                </li>
              </ul>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button 
                onClick={handleInstantUpgrade}
                className="flex-grow px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-extrabold rounded-2xl text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> ترقية فورية الآن (تجربة للمشرف المالي)
              </button>
              <Link 
                to="/subscription" 
                className={`px-6 py-4 font-bold rounded-2xl text-sm transition-all border ${isDark ? 'bg-slate-900 hover:bg-slate-800 text-slate-305 border-slate-800' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'}`}
              >
                تفقد خطط وباقات الاشتراك
              </Link>
            </div>
            
            <p className="text-[10px] text-slate-500 mt-6 font-mono">Secured Partner Subscription Framework v2.4 (ZATCA Complaint Ed.)</p>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // APPROVED & ACTIVE PREMIUM PORTAL
  return (
    <div className={`min-h-screen flex flex-col justify-between font-sans overflow-x-hidden animate-in fade-in duration-500 transition-colors duration-300 ${isDark ? 'bg-slate-900 text-white' : 'bg-slate-50 text-slate-905'}`} dir="rtl">
      <Header />
      
      {/* Real-time Event Floating System Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-4 right-4 md:left-auto md:w-96 z-50 pointer-events-auto"
          >
            <div className={`p-4 rounded-2xl border shadow-2xl flex items-start gap-3 backdrop-blur-md transition-colors duration-300 ${
              notification.type === 'success' 
                ? (isDark ? 'bg-slate-955/80 border-emerald-500/30 text-emerald-400' : 'bg-white/95 border-emerald-200 text-emerald-750 shadow-lg') 
                : (isDark ? 'bg-slate-955/80 border-red-500/30 text-red-400' : 'bg-white/95 border-red-200 text-red-750 shadow-lg')
            }`}>
              <div className="p-1 rounded-lg bg-white/5 border border-white/5 shrink-0">
                {notification.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
              </div>
              <div>
                <p className="text-xs font-bold font-sans">تنبيه النظام الفوري</p>
                <p className={`text-xs mt-1 leading-relaxed leading-6 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{notification.message}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-grow py-8 max-w-7xl mx-auto px-4 w-full">
        
        {/* Banner/Header */}
        <div className={`rounded-3xl p-6 border relative overflow-hidden mb-8 transition-colors duration-300 ${isDark ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <div className="absolute top-1/2 left-1/4 w-60 h-60 bg-gradient-to-br from-amber-550 to-purple-550 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-black">شريك المنصة الذهبي VIP</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-sans tracking-wide ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-600'}`}>نسخة البث المالي المباشر</span>
              </div>
              <h1 className={`text-3xl font-black mb-1.5 flex items-center gap-2 ${isDark ? 'text-amber-50' : 'text-slate-900'}`}>
                <Cpu className="w-7 h-7 text-amber-500 shrink-0" />
                بوابة إدارة الحجوزات والطلبات
              </h1>
              <p className={`text-xs max-w-2xl leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                لوحة متطابقة مخصصة للأعمال وسلسلة التوريد لإدارة عقود وحجوزات حفلات الزفاف، وجدولة طواقم الدعم، وصرف العربون والتسوية المصرفية التلقائية.
              </p>
            </div>
            
            {/* Quick action controllers */}
            <div className="flex flex-wrap items-center gap-3">
              <Link
                to="/provider-dashboard?tab=bookings"
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg transition-all"
              >
                <Cpu className="w-4 h-4" />
                <span>لوحة التحكم الموحدة 👑</span>
              </Link>
              <button 
                onClick={fetchData} 
                title="إعادة مزامنة المعطيات المباشرة"
                className={`p-3 rounded-2xl transition-all font-bold text-xs flex items-center gap-1.5 active:scale-95 ${isDark ? 'bg-slate-900 border border-slate-800 text-white hover:bg-slate-850 hover:text-amber-450' : 'bg-white border border-slate-205 text-slate-700 hover:bg-slate-100 hover:text-amber-650'}`}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-amber-500' : ''}`} />
                <span>مزامنة مباشرة</span>
              </button>
              
              <button 
                onClick={() => {
                  if (bookings.length === 0) {
                    triggerNotification('error', 'الرجاء الانتظار حتى اكتمال جلب البيانات أو حدد عقود نشطة للإشراف.');
                    return;
                  }
                  setSelectedBookingForLogistics(String(bookings[0]?.id || ''));
                  setIsModalOpen(true);
                }}
                className="px-5 py-3 rounded-2xl bg-amber-500 text-slate-950 hover:bg-amber-600 transition-all font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/10 hover:scale-[1.02] active:scale-95"
              >
                <Plus className="w-4 h-4 stroke-[3px]" />
                <span>تكليف وتعيين لوجستي عاجل</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard Financial & Efficiency Grid statistics - Unified Financial Analytics Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8" dir="rtl">
          
          {/* Card 1: Cumulative Revenues */}
          <div className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
            isDark 
              ? 'bg-slate-950/70 border-slate-800 hover:border-emerald-500/30 hover:bg-slate-900/60' 
              : 'bg-white border-slate-150 hover:border-emerald-300 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-extrabold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                إجمالي الإيرادات الكلي (Gross GMV)
              </span>
              <div className="flex items-center gap-1.5">
                {/* Info Tooltip Indicator */}
                <div className="relative cursor-help">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500 transition-colors" />
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute z-50 bottom-full mb-2 right-1/2 translate-x-1/2 w-72 p-4 bg-slate-900/95 backdrop-blur text-slate-100 rounded-xl border border-slate-700/50 shadow-xl transition-all duration-300 text-xs leading-relaxed" dir="rtl">
                    <div className="font-bold text-emerald-400 mb-1">الفلسفة المحاسبية والتشغيلية:</div>
                    <p className="text-slate-300 text-[11px] mb-2">يمثل المجموع الرقمي التراكمي لجميع حجوزات الصالات والخدمات اللوجستية والمساندة المستقلة والتابعة المبرمة عبر قنوات الدفع بالمنصة، شاملة ضريبة القيمة المضافة (VAT) ورسوم العمليات قبل خصم العمولات أو تجميد المستحقات.</p>
                    <div className="font-bold text-emerald-400 mb-1">دلالته التشغيلية:</div>
                    <p className="text-slate-300 text-[11px]">المؤشر الأبرز لقوة الشريك والنشاط التجاري الإجمالي (GMV) في السوق وجاذبية خدماته للعملاء.</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
              {statsSummary.totalRevenue.toLocaleString('ar-SA')} <span className="text-[10px] font-sans">ر.س</span>
            </div>
            
            {/* Split */}
            <div className={`mt-3 pt-2.5 border-t text-[10px] space-y-1.5 ${isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🏰 عقود القاعات:</span>
                <span className="font-mono font-bold">{statsSummary.totalHallsRevenue.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🍢 الخدمات المستقلة:</span>
                <span className="font-mono font-bold">{statsSummary.totalServicesRevenue.toLocaleString('ar-SA')} ر.س</span>
              </div>
            </div>
          </div>

          {/* Card 2: Escrow Revenues */}
          <div className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
            isDark 
              ? 'bg-slate-950/70 border-slate-800 hover:border-amber-500/30 hover:bg-slate-900/60' 
              : 'bg-white border-slate-150 hover:border-amber-300 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-extrabold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                إيرادات محتجزة - الضمان المالي
              </span>
              <div className="flex items-center gap-1.5">
                {/* Info Tooltip Indicator */}
                <div className="relative cursor-help">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-amber-500 transition-colors" />
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute z-50 bottom-full mb-2 right-1/2 translate-x-1/2 w-72 p-4 bg-slate-900/95 backdrop-blur text-slate-100 rounded-xl border border-slate-700/50 shadow-xl transition-all duration-300 text-xs leading-relaxed" dir="rtl">
                    <div className="font-bold text-amber-400 mb-1">الفلسفة المحاسبية والتشغيلية:</div>
                    <p className="text-slate-300 text-[11px] mb-2">المبالغ المالية المسددة فعلياً من قبل العملاء والمودعة مؤقتاً في محفظة الضمان (Escrow) التابعة للجامع المالي للمنصة لحماية مصالح الطرفين خلال فترة التجهيز.</p>
                    <div className="font-bold text-amber-400 mb-1">دلالته التشغيلية:</div>
                    <p className="text-slate-300 text-[11px]">لا يتم تحرير هذه الأموال وتسييلها للشريك إلا بعد إتمام الفعالية والمناسبة بنجاح وتأكيد خلوها من النزاعات لضمان جودة الأداء المتبادل.</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                  <Lock className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-amber-500' : 'text-amber-600'}`}>
              {statsSummary.escrowTotal.toLocaleString('ar-SA')} <span className="text-[10px] font-sans">ر.س</span>
            </div>
            
            {/* Split */}
            <div className={`mt-3 pt-2.5 border-t text-[10px] space-y-1.5 ${isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🏰 ضمان القاعات:</span>
                <span className="font-mono font-bold">{statsSummary.escrowHalls.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🍢 خدمات معلقة (إسكرو):</span>
                <span className="font-mono font-bold">{statsSummary.escrowServices.toLocaleString('ar-SA')} ر.س</span>
              </div>
            </div>
          </div>

          {/* Card 3: Released Earnings */}
          <div className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
            isDark 
              ? 'bg-slate-950/70 border-slate-800 hover:border-indigo-500/30 hover:bg-slate-900/60' 
              : 'bg-white border-slate-150 hover:border-indigo-300 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-extrabold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                المكاسب المسيلة والمصروفة
              </span>
              <div className="flex items-center gap-1.5">
                {/* Info Tooltip Indicator */}
                <div className="relative cursor-help">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-indigo-500 transition-colors" />
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute z-50 bottom-full mb-2 right-1/2 translate-x-1/2 w-72 p-4 bg-slate-900/95 backdrop-blur text-slate-100 rounded-xl border border-slate-700/50 shadow-xl transition-all duration-300 text-xs leading-relaxed" dir="rtl">
                    <div className="font-bold text-indigo-400 mb-1">الفلسفة المحاسبية والتشغيلية:</div>
                    <p className="text-slate-300 text-[11px] mb-2">الأموال التي خرجت رسمياً من دورة الحجز الضماني (Escrow Release) بعد نجاح الفعالية، وجرى تحويلها وتسييلها كسيولة نقدية جارية في الحساب المصرفي المعتمد للشركة (IBAN).</p>
                    <div className="font-bold text-indigo-400 mb-1">دلالته التشغيلية:</div>
                    <p className="text-slate-300 text-[11px]">يمثل التدفق النقدي الحقيقي (Cash Flow) الفعلي الذي تسلمه الشريك في خزينته المباشرة بعد خصم العمولات.</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
              {statsSummary.releasedEarnings.toLocaleString('ar-SA')} <span className="text-[10px] font-sans">ر.س</span>
            </div>
            
            {/* Split */}
            <div className={`mt-3 pt-2.5 border-t text-[10px] space-y-1.5 ${isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🏰 صالحة للصرف (قاعات):</span>
                <span className="font-mono font-bold">{statsSummary.releasedHallsNet.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🍢 صالحة للصرف (خدمات):</span>
                <span className="font-mono font-bold">{statsSummary.releasedServicesNet.toLocaleString('ar-SA')} ر.س</span>
              </div>
            </div>
          </div>

          {/* Card 4: Platform Commissions */}
          <div className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
            isDark 
              ? 'bg-slate-950/70 border-slate-800 hover:border-rose-500/30 hover:bg-slate-900/60' 
              : 'bg-white border-slate-150 hover:border-rose-300 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-extrabold tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                عمولة المنصة الإجمالية
              </span>
              <div className="flex items-center gap-1.5">
                {/* Info Tooltip Indicator */}
                <div className="relative cursor-help">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-rose-500 transition-colors" />
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute z-50 bottom-full mb-2 right-1/2 translate-x-1/2 w-72 p-4 bg-slate-900/95 backdrop-blur text-slate-100 rounded-xl border border-slate-700/50 shadow-xl transition-all duration-300 text-xs leading-relaxed" dir="rtl">
                    <div className="font-bold text-rose-400 mb-1">الفلسفة المحاسبية والتشغيلية:</div>
                    <p className="text-slate-300 text-[11px] mb-2">النسبة المستقطعة لصالح المنصة (المقررة بـ 2.5% على كافة الحركات المالية) نظير خدمات التشغيل التقني، الفواتير الذكية، التأمين السيادي، وحملات الجذب التسويقي.</p>
                    <div className="font-bold text-rose-400 mb-1">دلالته التشغيلية:</div>
                    <p className="text-slate-300 text-[11px]">تعكس قيمة الاستثمار المستدام للشريك في البنية التقنية للمنصة لضمان تدفق مستمر للعملاء وحماية المدفوعات.</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-rose-500/10 text-rose-450 flex items-center justify-center">
                  <Activity className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>
              {statsSummary.totalCommission.toLocaleString('ar-SA')} <span className="text-[10px] font-sans">ر.س</span>
            </div>
            
            {/* Split */}
            <div className={`mt-3 pt-2.5 border-t text-[10px] space-y-1.5 ${isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
              <div className="flex justify-between items-center">
                <span>🛡️ نسبة العمولة النشطة:</span>
                <span className="font-bold text-rose-500">2.5%</span>
              </div>
              <div className="flex justify-between items-center">
                <span>⚙️ تكاليف تشغيل الصفقات:</span>
                <span className="font-bold text-emerald-500">مؤمنة بالكامل</span>
              </div>
            </div>
          </div>

          {/* Card 5: Net Profit */}
          <div className={`group relative p-5 rounded-2xl border transition-all duration-300 ${
            isDark 
              ? 'bg-slate-950/70 border-emerald-500/20 hover:border-emerald-500/40 hover:bg-slate-900/60' 
              : 'bg-emerald-500/[0.02] border-emerald-200 hover:border-emerald-300 hover:shadow-md'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-[11px] font-extrabold tracking-tight ${isDark ? 'text-emerald-450' : 'text-emerald-700'}`}>
                صافي الأرباح المحققة للشريك
              </span>
              <div className="flex items-center gap-1.5">
                {/* Info Tooltip Indicator */}
                <div className="relative cursor-help">
                  <Info className="w-3.5 h-3.5 text-slate-400 hover:text-emerald-500 transition-colors" />
                  <div className="opacity-0 group-hover:opacity-100 pointer-events-none absolute z-50 bottom-full mb-2 right-1/2 translate-x-1/2 w-72 p-4 bg-slate-900/95 backdrop-blur text-slate-100 rounded-xl border border-slate-700/50 shadow-xl transition-all duration-300 text-xs leading-relaxed" dir="rtl">
                    <div className="font-bold text-emerald-400 mb-1">الفلسفة المحاسبية والتشغيلية:</div>
                    <p className="text-slate-300 text-[11px] mb-2">الإيراد الربحي الحقيقي المستحق للشريك بعد حسم الرسوم التشغيلية وعمولات تسييل المنصة من إجمالي المعاملات المكتملة.</p>
                    <div className="font-bold text-emerald-400 mb-1">دلالته التشغيلية:</div>
                    <p className="text-slate-300 text-[11px]">يمثل مؤشر صافي الأرباح والاستثمار الفعلي (ROI) الذي يقيس نجاح القوة التشغيلية للشريك ومعدلات الربحية الحقيقية المباشرة.</p>
                  </div>
                </div>
                <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
            </div>
            
            <div className={`text-xl font-black font-mono tracking-tight ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
              {statsSummary.netRevenue.toLocaleString('ar-SA')} <span className="text-[10px] font-sans">ر.س</span>
            </div>
            
            {/* Split */}
            <div className={`mt-3 pt-2.5 border-t text-[10px] space-y-1.5 ${isDark ? 'border-slate-800/60 text-slate-400' : 'border-slate-100 text-slate-500'}`}>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🏰 صافي أرباح القاعات:</span>
                <span className="font-mono font-bold text-emerald-500">{statsSummary.netHalls.toLocaleString('ar-SA')} ر.س</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1">🍢 صافي أرباح الخدمات:</span>
                <span className="font-mono font-bold text-emerald-500">{statsSummary.netServices.toLocaleString('ar-SA')} ر.س</span>
              </div>
            </div>
          </div>
        </div>

        {/* Escrow payout notifications */}
        {recentEscrowNotification && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`mb-8 p-5 rounded-2xl border flex items-center gap-3 shadow-lg transition-all ${isDark ? 'bg-gradient-to-l from-emerald-900/40 to-slate-950 border-emerald-500/30 text-emerald-200' : 'bg-emerald-50 border-emerald-250 text-emerald-900 shadow-sm'}`}
          >
            <div className="w-8 h-8 bg-emerald-500 text-slate-950 rounded-lg flex items-center justify-center shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <p className={`font-extrabold text-sm mb-0.5 ${isDark ? 'text-white' : 'text-emerald-950'}`}>تم تصفية وصرف العربون الضماني بنجاح!</p>
              <p className="text-xs leading-relaxed">{recentEscrowNotification}</p>
            </div>
          </motion.div>
        )}

        {/* Navigation tabs */}
        <div className={`rounded-2xl p-4 border flex items-center gap-1.5 overflow-x-auto mb-4 transition-colors duration-300 ${isDark ? 'bg-slate-955 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
          <button 
            onClick={() => { setActiveTab('contracts'); setStatusFilter('all'); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${activeTab === 'contracts' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg' : (isDark ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200')}`}
          >
            💼 عقود الحجز والتعاقدات الأساسية ({bookings.length})
          </button>
          <button 
            onClick={() => { setActiveTab('logistics'); setStatusFilter('all'); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${activeTab === 'logistics' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg' : (isDark ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200')}`}
          >
            🚒 العمليات والخدمات اللوجستية المساندة ({supportRequests.length})
          </button>
          <button 
            onClick={() => { setActiveTab('independentRequests'); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${activeTab === 'independentRequests' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg' : (isDark ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200')}`}
          >
            🌟 طلبات الخدمات المساندة المستقلة ({supportServiceRequests.length})
          </button>
          <button 
            onClick={() => { setActiveTab('finance'); setStatusFilter('all'); }}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs whitespace-nowrap transition-all border ${activeTab === 'finance' ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-lg' : (isDark ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850' : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200')}`}
          >
            💳 الإفراج المالي وتدفقات مستحقات الشريك
          </button>
        </div>

        {/* Filters and search - placed directly below tabs */}
        {activeTab !== 'independentRequests' && (
          <div className={`rounded-2xl p-4 border flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 transition-colors duration-300 ${isDark ? 'bg-slate-955 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className="relative flex-grow sm:flex-initial w-full sm:w-auto">
              <Search className="w-4 h-4 text-slate-500 absolute top-1/2 -translate-y-1/2 right-3.5" />
              <input 
                type="text" 
                placeholder="البحث بالرمز، العميل، المعين..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full sm:w-80 border rounded-xl py-2.5 pr-10 pl-4 text-xs font-medium outline-none transition-all font-sans ${isDark ? 'bg-slate-900 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-amber-500/50' : 'bg-slate-100 border-slate-200 text-slate-850 placeholder-slate-400 focus:border-amber-500/50'}`}
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <div className="flex items-center gap-1">
                <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0" />
                <select 
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className={`border rounded-xl py-2 px-3 text-[11px] font-bold outline-none ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
                >
                  <option value="all">الكل</option>
                  {activeTab === 'contracts' && (
                    <>
                      <option value="confirmed">المؤكدة والمقبولة</option>
                      <option value="pending">قيد الانتظار والفرز</option>
                      <option value="cancelled">الملغاة</option>
                    </>
                  )}
                  {activeTab === 'logistics' && (
                    <>
                      <option value="processing">جاري التجهيز والتنفيذ</option>
                      <option value="pending">معلق بقيد التوجيه</option>
                      <option value="completed">تم التوريد والتسليم</option>
                    </>
                  )}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* TAB CONTENT 1: Contracts & Booking Requests */}
        {activeTab === 'contracts' && (
          <div className={`rounded-2xl border overflow-hidden animate-in fade-in duration-300 transition-colors duration-300 ${isDark ? 'bg-slate-955 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`p-5 border-b flex items-center justify-between ${isDark ? 'border-slate-850' : 'border-slate-150'}`}>
              <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                <Building className="w-5 h-5 text-amber-500" />
                <span>إدارة ومتابعة طلبات وعقود حجز القاعات/المرافق</span>
              </h3>
              <span className={`text-[10px] font-sans tracking-tight ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>إجمالي عقود المطابقة لفلتر البحث: {filteredBookings.length}</span>
            </div>

            {filteredBookings.length === 0 ? (
              <div className="p-16 text-center">
                <AlertCircle className="w-10 h-10 text-slate-500 mx-auto mb-3" />
                <p className="text-xs text-slate-450 font-bold">لا تتوفر عقود حجز مطابقة حالياً.</p>
                <p className="text-[10px] text-slate-500 mt-1 font-sans">تأكد من ضبط محددات البحث أو تواصل مع مشرف المنصة لرفع ملف تسوية.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-50 text-slate-650 border-b border-slate-200'}`}>
                      <th className="p-4 font-extrabold">الرقم المرجعي الموازي</th>
                      <th className="p-4 font-extrabold">اسم العميل ورقم الجوال</th>
                      <th className="p-4 font-extrabold">المرفق/القاعة المستهدفة</th>
                      <th className="p-4 font-extrabold">تاريخ المناسبة والتوقيت</th>
                      <th className="p-4 font-extrabold">العربون المودع</th>
                      <th className="p-4 font-extrabold text-left">مجموع القيمة والمصاريف</th>
                      <th className="p-4 font-extrabold text-center">حالة العقد والاعتماد</th>
                    </tr>
                  </thead>
                  <tbody className={`${isDark ? 'divide-y divide-slate-850' : 'divide-y divide-slate-150'}`}>
                    {filteredBookings.map((b) => (
                      <tr key={b.id} className={`transition-colors ${isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 font-sans text-right">
                          <div className={`font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>المرجعي: #{b.id}</div>
                          <div className="mt-1">
                            <button 
                              type="button"
                              onClick={() => setSelectedViewingBooking(b)}
                              className="text-[11.5px] font-black text-amber-500 hover:text-amber-600 inline-flex items-center gap-1 cursor-pointer transition-all hover:underline md:block"
                              title="عرض تفاصيل الحجز المصور الكامل"
                            >
                              <span>رقم الحجز: <span className="font-mono text-xs">{formatBookingId(b.id)}</span></span>
                            </button>
                          </div>
                          <div className="mt-1.5 flex items-center gap-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[9.5px] text-emerald-550 font-black">مطابقة السيولة: ✓ العربون مطابق ومؤمن تلقائياً</span>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className={`font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{b.customerName}</p>
                          <p className={`text-[10px] mt-0.5 tracking-wider font-sans ${isDark ? 'text-slate-400' : 'text-slate-500'}`} dir="ltr">{b.phone || ''}</p>
                          <div className="flex items-center gap-1 mt-2">
                            <a 
                              href={`https://wa.me/${(b.phone || '').replace(/[\s+]/g, '')}`}
                              target="_blank"
                              rel="no-referrer"
                              className={`text-[10px] font-bold flex items-center gap-1 px-2.5 py-1 rounded transition-colors ${
                                isDark 
                                  ? 'text-emerald-400 bg-emerald-900/10 border border-emerald-500/20 hover:bg-emerald-900/20' 
                                  : 'text-emerald-700 bg-emerald-50 border border-emerald-250 hover:bg-emerald-100'
                              }`}
                            >
                              <Phone className="w-3 h-3 shrink-0" />
                              <span>للتواصل مع العميل</span>
                            </a>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-extrabold text-amber-500">{b.hall?.name || "مرفق مباشر"}</p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>{b.hall?.location}</p>
                        </td>
                        <td className="p-4">
                          <p className={`font-bold font-sans flex items-center gap-1 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <Calendar className="w-2.5 h-2.5 text-slate-500" />
                            {new Date(b.startTime).toLocaleDateString('ar-SA', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                          <p className={`text-[10px] mt-0.5 ${isDark ? 'text-slate-505' : 'text-slate-500'}`}>{b.period || 'مسائي'}</p>
                        </td>
                        <td className={`p-4 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {b.paidAmount ? `${b.paidAmount.toLocaleString('ar-SA')} ر.س` : 'معفى/لم يودع'}
                        </td>
                        <td className={`p-4 font-black text-left font-sans ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {b.totalAmount ? `${b.totalAmount.toLocaleString('ar-SA')} ر.س` : 'بدون رسوم'}
                        </td>
                        <td className="p-4 text-center">
                          <div className="flex flex-col items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                                b.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                                'bg-amber-500/10 text-amber-500 border-amber-500/20'
                            }`}>
                              {b.status === 'confirmed' ? 'مؤكد ومعتمد' : b.status === 'cancelled' ? 'ملغي' : 'بانتظار الفرز'}
                            </span>
                            
                            <div className="flex items-center gap-1">
                              {b.status !== 'confirmed' && (
                                <button 
                                  onClick={() => handleUpdateBookingStatus(b.id, 'confirmed')}
                                  className={`p-1.5 border rounded-lg transition-all font-bold text-[10px] cursor-pointer ${
                                    isDark 
                                      ? 'bg-slate-900 border-slate-800 text-emerald-450 hover:bg-slate-800' 
                                      : 'bg-slate-100 border-slate-200 text-emerald-700 hover:bg-slate-200'
                                  }`}
                                  title="قبول واهتمام بالعقد"
                                >
                                  تأكيد قبول
                                </button>
                              )}
                              {b.status !== 'cancelled' && (
                                <button 
                                  onClick={() => handleUpdateBookingStatus(b.id, 'cancelled')}
                                  className={`p-1.5 border rounded-lg transition-all font-bold text-[10px] cursor-pointer ${
                                    isDark 
                                      ? 'bg-slate-900 border-slate-800 text-red-400 hover:bg-slate-850' 
                                      : 'bg-slate-100 border-slate-200 text-red-600 hover:bg-slate-200'
                                  }`}
                                  title="إلغاء حجز القاعة وتصفية المرفق"
                                >
                                  رفض / تأجيل العقد
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* TAB CONTENT 2: Support Services & Logistics Operations */}
        {activeTab === 'logistics' && (
          <div className={`rounded-2xl border overflow-hidden animate-in fade-in duration-300 transition-colors duration-300 ${isDark ? 'bg-slate-955 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'border-slate-855' : 'border-slate-150'}`}>
              <div>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                  <Activity className="w-5 h-5 text-indigo-500" />
                  <span>مراقبة وجدولة طواقم الدعم وسلسلة العمليات اللوجستية</span>
                </h3>
                <p className={`text-[10px] mt-1 font-sans ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                  فرز وتتبع حالة الشركاء المنتسبين (تصوير، طهاة البوفيه، حراسات، منظمات حفلات، منسقي الزهور والزهور الطبيعية).
                </p>
              </div>

              <span className={`text-[10px] px-3 py-1 rounded-full font-black self-start ${isDark ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-700 border border-indigo-150'}`}>
                المهام المفتوحة بالجدول: {filteredLogistics.filter(l => l.status !== 'completed').length} من أصل {filteredLogistics.length}
              </span>
            </div>

            {filteredLogistics.length === 0 ? (
              <div className="p-16 text-center">
                <AlertCircle className="w-10 h-10 text-slate-550 mx-auto mb-3" />
                <p className="text-xs text-slate-450 font-bold">لا يوجد طلبات لوجستية حالياً.</p>
                <p className="text-[10px] text-slate-500 mt-1">بإمكانك تكليف وتعيين طاقم لوجستي مخصص عبر زر التكليف العاجل بالأعلى.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-900 text-slate-400 border-b border-slate-800' : 'bg-slate-50 text-slate-655 border-b border-slate-200'}`}>
                      <th className="p-4 font-extrabold pb-3 pt-3">الرمز التشغيلي</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">فئة الخدمة والدعم</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">تفاصيل ووصف العمليات المطلوب</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">العقد المالي المقترن</th>
                      <th className="p-4 font-extrabold text-left pb-3 pt-3">التكلفة ورسوم الأداء</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">الشريك المنفذ لـلبلدية/القاعة</th>
                      <th className="p-4 font-extrabold text-center pb-3 pt-3">الإجراءات وحالة المهمة اللوجستية</th>
                    </tr>
                  </thead>
                  <tbody className={`${isDark ? 'divide-y divide-slate-850' : 'divide-y divide-slate-150'}`}>
                    {filteredLogistics.map((s) => (
                      <tr key={s.id} className={`transition-colors ${isDark ? 'hover:bg-slate-900/40' : 'hover:bg-slate-50'}`}>
                        <td className="p-4 font-mono font-bold text-indigo-500">#{s.id}</td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${isDark ? 'bg-slate-900 text-amber-500 border border-slate-800' : 'bg-amber-50 text-amber-800 border border-amber-100'}`}>
                            {s.serviceType}
                          </span>
                        </td>
                        <td className={`p-4 font-sans text-xs ${isDark ? 'text-slate-300' : 'text-slate-705'} max-w-xs truncate`} title={s.description}>
                          {s.description}
                        </td>
                        <td className="p-4 font-sans text-right">
                          <button 
                            type="button"
                            onClick={() => {
                              const matchedBooking = bookings.find(bk => bk.id === s.bookingId);
                              if (matchedBooking) {
                                setSelectedViewingBooking(matchedBooking);
                              } else {
                                setSelectedViewingBooking({
                                  id: s.bookingId,
                                  customerName: "شريك عمليات مسجل للرمز",
                                  phone: "+966 50 123 4567",
                                  email: "info@platform.sa",
                                  status: "confirmed",
                                  totalAmount: s.price * 5,
                                  paidAmount: s.price,
                                  startTime: new Date().toISOString(),
                                  period: "مسائي",
                                  hall: { name: "صالة التشغيل اللوجستية العامة", location: "الرياض", category: "قاعة أفراح" },
                                  notes: "طلب دعم لوجستي مقترن: " + s.description
                                });
                              }
                            }}
                            className="text-[11.5px] font-black text-amber-500 hover:text-amber-600 inline-flex items-center gap-1 cursor-pointer hover:underline"
                          >
                            <span>حجز المناسبة #{s.bookingId}</span>
                          </button>
                        </td>
                        <td className={`p-4 font-bold text-left font-sans ${isDark ? 'text-emerald-450' : 'text-emerald-700'}`}>
                          {(s.price).toLocaleString('ar-SA')} ر.س
                        </td>
                        <td className={`p-4 font-sans text-xs ${isDark ? 'text-slate-350' : 'text-slate-650'}`}>
                          {s.assignedAgent || 'آلي - قيد التفويض'}
                        </td>
                        <td className="p-4">
                          <div className="flex flex-col sm:flex-row items-center justify-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-[9px] font-black tracking-wider ${
                              s.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' :
                              s.status === 'processing' ? 'bg-indigo-500/10 text-indigo-505 animate-pulse' :
                              'bg-amber-500/10 text-amber-505'
                            }`}>
                              {s.status === 'completed' ? '✓ تم التوريد' : s.status === 'processing' ? '⚙ قيد المعالجة' : '⏳ قيد التوجيه'}
                            </span>

                            <div className="flex items-center gap-1">
                              {s.status !== 'processing' && s.status !== 'completed' && (
                                <button 
                                  onClick={() => handleUpdateSupportRequestStatus(s.id, 'processing')}
                                  className="px-2 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[10px] transition-all cursor-pointer animate-in fade-in"
                                >
                                  بدء العمل
                                </button>
                              )}
                              {s.status !== 'completed' && (
                                <button 
                                  onClick={() => handleUpdateSupportRequestStatus(s.id, 'completed')}
                                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] transition-all cursor-pointer animate-in fade-in"
                                >
                                  أكتمال
                                </button>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
        {activeTab === 'finance' && (
          <div className={`rounded-2xl border overflow-hidden animate-in fade-in duration-300 transition-colors duration-300 ${isDark ? 'bg-slate-955 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
            <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isDark ? 'border-slate-855' : 'border-slate-150'}`}>
              <div>
                <h3 className={`font-bold text-sm flex items-center gap-2 ${isDark ? 'text-slate-100' : 'text-slate-850'}`}>
                  <DollarSign className="w-5 h-5 text-emerald-500 font-black" />
                  <span>ملف الضمان المالي ومكسب تسييل عربون الحجز المباشر (Escrow Releases)</span>
                </h3>
                <p className={`text-[10px] mt-1 font-sans ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                  نظام آلي متوافق مع لوائح ZATCA لتقييد مبالغ الدفعة المقدمة (عربون القاعة) وتسييلها الفوري إلى حساب مزود الخدمة البنكي فور اكتمال السهرة أو الحفل.
                </p>
              </div>
              <div className={`flex items-center gap-2 self-start border rounded-xl px-3 py-1 ${isDark ? 'bg-slate-900 border-slate-800/60' : 'bg-slate-50 border-slate-200'}`}>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className={`text-[10px] font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>بوابة تسوية الدفعات نشطة</span>
              </div>
            </div>

            <div className="p-5">
              
              {/* Informational luxury callout card regarding escrow rules */}
              <div className={`p-5 rounded-2xl border mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 ${
                isDark 
                  ? 'bg-gradient-to-l from-slate-900 to-slate-950 border-slate-800 text-slate-300' 
                  : 'bg-gradient-to-l from-slate-50 to-white border-slate-200 text-slate-700 shadow-sm'
              }`}>
                <div className="max-w-2xl text-xs leading-relaxed">
                  <span className="text-amber-500 font-extrabold block mb-1">💡 آلية التسوية والضمان المصرفي:</span>
                  يتم حجز عربون الحجز المدفوع من قبل العميل في خزانة المنصة المؤمنة كضمان (Escrow). بعد إتمام المناسبة بنجاح وتحويل الطاقم اللوجستي للحالة "مكتمل"، يتاح لمقرضي القاعات إطلاق السيولة يدوياً وتسييل المبلغ المصرفي مباشرة إلى الحساب الموثق.
                </div>
                <div className={`rounded-xl border text-[10px] font-black px-4 py-2 self-start md:self-auto uppercase tracking-wide shrink-0 ${
                  isDark ? 'bg-amber-500/10 text-amber-500 border-amber-550/20' : 'bg-amber-50 text-amber-800 border-amber-150'
                }`}>
                  عمولة المنصة: 2.5% فقط
                </div>
              </div>

              {/* Transactions Ledger Table / Entries of bookings */}
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs animate-in fade-in">
                  <thead>
                    <tr className={`${isDark ? 'bg-slate-900 text-slate-400 border-b border-indigo-850' : 'bg-slate-50 text-slate-650 border-b border-slate-200'}`}>
                      <th className="p-4 font-extrabold pb-3 pt-3">رقم الحركة</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">العميل المقترن والدفعة</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">قيمة عقد القاعة</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">عربون الضمان المودع</th>
                      <th className="p-4 font-extrabold pb-3 pt-3">عمولة النظام (2.5%)</th>
                      <th className="p-4 font-extrabold text-left pb-3 pt-3">الصافي للشريك</th>
                      <th className="p-4 font-extrabold text-center pb-3 pt-3">إجراء تسوية الإفراج المالي</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-slate-850' : 'divide-slate-150'}`}>
                    {bookings.map((b) => {
                      const comm = (b.paidAmount || 0) * 0.025;
                      const netAmount = (b.paidAmount || 0) - comm;
                      const isReleased = escrowReleasedIds.includes(b.id);
                      
                      return (
                        <tr key={b.id} className={`transition-colors ${isDark ? 'hover:bg-slate-900/20' : 'hover:bg-slate-50'}`}>
                          <td className={`p-4 font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>TXN-{b.id}B</td>
                          <td className="p-4">
                            <p className={`font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{b.customerName}</p>
                            <p className="text-[10px] text-indigo-500 font-sans mt-0.5 font-bold">عقد حجز معتمد</p>
                          </td>
                          <td className={`p-4 font-sans ${isDark ? 'text-slate-100' : 'text-slate-705'}`}>{(b.totalAmount || 0).toLocaleString('ar-SA')} ر.س</td>
                          <td className={`p-4 font-bold font-sans ${isDark ? 'text-emerald-450' : 'text-emerald-600'}`}>{(b.paidAmount || 0).toLocaleString('ar-SA')} ر.س</td>
                          <td className={`p-4 font-sans ${isDark ? 'text-red-400' : 'text-red-650'}`}>-{comm.toLocaleString('ar-SA')} ر.س</td>
                          <td className={`p-4 font-black text-left font-sans ${isDark ? 'text-slate-205' : 'text-slate-800'}`}>
                            {netAmount.toLocaleString('ar-SA')} ر.س
                          </td>
                          <td className="p-4">
                            <div className="flex justify-center">
                              {isReleased ? (
                                <span className={`flex items-center gap-1 px-3 py-1.5 rounded-xl border text-[10px] font-black ${
                                  isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-emerald-55 text-emerald-700 border-emerald-200'
                                }`}>
                                  <Check className="w-3.5 h-3.5" /> تمت تصفية وصرف المبلغ
                                </span>
                              ) : (
                                <button 
                                  onClick={() => handleReleaseEscrow(b.id, netAmount, b.customerName)}
                                  className="px-4 py-2 bg-gradient-to-r from-emerald-650 to-emerald-500 hover:from-emerald-700 hover:to-emerald-600 text-white rounded-xl text-[10px] font-black flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                                >
                                  <ArrowUpRight className="w-3.5 h-3.5" /> الإفراج الفوري والصرف للإيبان
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* HISTORICAL RELEASED LEDGER */}
              <div className="mt-10 pt-8 border-t border-dashed border-slate-700/30">
                <h4 className={`text-sm font-extrabold mb-4 flex items-center gap-2 ${isDark ? 'text-amber-100' : 'text-slate-800'}`}>
                  <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                  <span>سجل حركات الإطلاق المالي والتسويات المكتبية المكتملة (الدفوعات)</span>
                </h4>
                
                {escrowReleasedIds.length === 0 ? (
                  <div className={`p-8 text-center rounded-2xl border border-dashed ${isDark ? 'border-slate-800 text-slate-500' : 'border-slate-205 text-slate-400'}`}>
                    <Clock className="w-8 h-8 mx-auto mb-2 text-slate-500" />
                    <p className="text-xs font-bold">لا يوجد حركات تسوية مصرفية مكتملة حالياً.</p>
                    <p className="text-[10px] mt-1 text-slate-400">عند تسييل أي ضمان مالي أعلاه، سيتم قيده وتدوينه فورياً في السجل التاريخي كحوالة منفذة.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs animate-in fade-in">
                      <thead>
                        <tr className={`${isDark ? 'bg-slate-900/60 text-slate-400 border-b border-slate-800' : 'bg-slate-50 text-slate-550 border-b border-slate-200'}`}>
                          <th className="p-3 font-extrabold pb-2 pt-2">سند التسوية المصرفية</th>
                          <th className="p-3 font-extrabold pb-2 pt-2">المرفق/القاعة المستلمة</th>
                          <th className="p-3 font-extrabold pb-2 pt-2">العميل المقترن للوساطة</th>
                          <th className="p-3 font-extrabold pb-2 pt-2">المبلغ المودع كاملاً</th>
                          <th className="p-3 font-extrabold pb-2 pt-2">عمولة التسييل المقتطعة</th>
                          <th className="p-3 font-extrabold text-left pb-2 pt-2">الصافي المحول فورا للآيبان</th>
                          <th className="p-3 font-extrabold text-center pb-2 pt-2">حالة التسوية والترحيل</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/20">
                        {bookings.filter(b => escrowReleasedIds.includes(b.id)).map(b => {
                          const comm = (b.paidAmount || 0) * 0.025;
                          const netAmount = (b.paidAmount || 0) - comm;
                          return (
                            <tr key={b.id} className={`${isDark ? 'bg-emerald-950/10' : 'bg-emerald-50/10'}`}>
                              <td className="p-3 font-mono font-bold text-emerald-500">PAY-#{b.id * 14 + 1024}</td>
                              <td className="p-3 font-bold text-slate-300">{b.hall?.name || "صالة العمليات العامة"}</td>
                              <td className="p-3">{b.customerName}</td>
                              <td className="p-3 font-sans text-slate-400">{(b.paidAmount || 0).toLocaleString('ar-SA')} ر.س</td>
                              <td className="p-3 font-sans text-rose-450 text-red-500">-{comm.toLocaleString('ar-SA')} ر.س</td>
                              <td className="p-3 font-black text-left text-emerald-500 font-sans">{netAmount.toLocaleString('ar-SA')} ر.س</td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black ${
                                  isDark ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/10' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                }`}>
                                  <Check className="w-3.5 h-3.5" /> تم تحويل الحوالة للآيبان
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        )}

        {activeTab === 'independentRequests' && (() => {
          // Filter requests with security boundary for providers
          const filteredIndependentRequests = supportServiceRequests.filter(r => {
            if (userRole === 'provider' && user?.name) {
              const providerAttr = r.providerName || r.provider || '';
              const matchesProvider = providerAttr.toLowerCase().includes(user.name.toLowerCase()) || 
                                      user.name.toLowerCase().includes(providerAttr.toLowerCase());
              if (!matchesProvider && providerAttr !== '') {
                return false;
              }
            }
            const matchSearch = String(r.customerName || '').includes(supportServiceSearchQuery) || String(r.serviceName || '').includes(supportServiceSearchQuery);
            const matchStatus = supportServiceFilterStatus ? r.status === supportServiceFilterStatus : true;
            return matchSearch && matchStatus;
          });

          const handleAcceptRequest = (requestId: number) => {
            const updated = supportServiceRequests.map(r => r.id === requestId ? { ...r, status: 'تم القبول' } : r);
            setSupportServiceRequests(updated);
            triggerNotification('success', 'تم قبول طلب الخدمة المساندة المستقلة وجارٍ تحديث التسوية البنكية المصرفية تلقائياً 💳');
            window.dispatchEvent(new Event('booking_updated'));
          };

          const handleRejectRequest = (requestId: number) => {
            const updated = supportServiceRequests.map(r => r.id === requestId ? { ...r, status: 'ملغي' } : r);
            setSupportServiceRequests(updated);
            triggerNotification('error', 'تم رفض طلب الخدمة وتسوية المبالغ المسترجعة للمحفظة المصرفية بنجاح 💸');
            window.dispatchEvent(new Event('booking_updated'));
          };

          return (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Consolidated Settlement Info Banner */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-right transition-all duration-300 ${
                isDark 
                  ? 'bg-gradient-to-r from-amber-500/5 to-transparent border-slate-800' 
                  : 'bg-gradient-to-r from-amber-500/[0.02] to-transparent border-slate-100 shadow-sm'
              }`}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className={`text-xs font-bold ${isDark ? 'text-amber-400' : 'text-amber-800'}`}>تسويات وإيرادات الخدمات المساندة الموحدة</h4>
                    <p className={`text-[11px] mt-0.5 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                      تم دمج كافة الإحصائيات المالية والتدفقات النقدية والضمان المالي (Escrow) لهذه الخدمات في <strong>لوحة الإحصائيات الموحدة (Bento Grid)</strong> في أعلى الصفحة لتبسيط التتبع اليومي وتفادي التكرار.
                    </p>
                  </div>
                </div>
                <div className={`text-xs font-mono font-bold px-3 py-1.5 rounded-xl border ${
                  isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-150 text-slate-600'
                }`}>
                  {filteredIndependentRequests.length} طلب نشط
                </div>
              </div>

              {/* Filter and Control Toolbar */}
              <div className={`p-4 rounded-2xl border flex flex-col md:flex-row justify-between items-center gap-4 text-right ${isDark ? 'bg-slate-955 border-slate-800' : 'bg-white border-slate-100 shadow-sm'}`} dir="rtl">
                <div className="w-full md:w-auto flex flex-col sm:flex-row items-center gap-2">
                  <div className="w-full sm:w-64 relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                      type="text" 
                      value={supportServiceSearchQuery}
                      onChange={(e) => setSupportServiceSearchQuery(e.target.value)}
                      placeholder="ابحث باسم الخدمة أو العميل..."
                      className={`w-full pr-9 pl-3 py-2 border rounded-xl text-xs focus:outline-none focus:border-amber-500 ${isDark ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-200 text-slate-800'}`}
                    />
                  </div>
                  <select
                    value={supportServiceFilterStatus}
                    onChange={(e) => setSupportServiceFilterStatus(e.target.value)}
                    className={`w-full sm:w-40 p-2.5 border rounded-xl text-xs focus:outline-none font-bold ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}
                  >
                    <option value="">كل حالات الطلبات</option>
                    <option value="قيد الانتظار">قيد الانتظار</option>
                    <option value="تم القبول">تم القبول</option>
                    <option value="مكتمل">مكتمل</option>
                    <option value="ملغي">ملغي</option>
                  </select>
                </div>
                <div className={`text-xs font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  عرض {filteredIndependentRequests.length} طلب خدمات مساندة مستقلة
                </div>
              </div>

              {/* Responsive Table and Mobile Grid Layout */}
              <div className={`rounded-2xl border overflow-hidden shadow-sm ${isDark ? 'bg-slate-955 border-slate-800' : 'bg-white border-slate-100'}`} dir="rtl">
                {/* Desktop view */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className={`border-b font-bold uppercase ${isDark ? 'bg-slate-900 text-slate-250 border-slate-800' : 'bg-slate-50 text-slate-700 border-slate-100'}`}>
                      <tr>
                        <th className="p-4 rounded-r-2xl">رقم الطلب</th>
                        <th className="p-4">اسم العميل</th>
                        <th className="p-4">نوع الخدمية المطلوبة</th>
                        <th className="p-4">مزوّد الخدمة</th>
                        <th className="p-4">قيمة الضمان والتحصيل</th>
                        <th className="p-4">التسوية المباشرة</th>
                        <th className="p-4 text-center rounded-l-2xl">قرار الإدارة السريع</th>
                      </tr>
                    </thead>
                    <tbody className={`divide-y text-slate-600 font-sans ${isDark ? 'divide-slate-800 text-slate-350' : 'divide-slate-100 text-slate-600'}`}>
                      {filteredIndependentRequests.map((r, idx) => {
                        const idFormatted = `SR-${r.id}`;
                        return (
                          <tr key={idx} className="hover:bg-slate-500/5 transition-colors">
                            <td className="p-4 font-bold text-amber-500 font-mono">{idFormatted}</td>
                            <td className={`p-4 font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{r.customerName}</td>
                            <td className={`p-4 font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{r.serviceName}</td>
                            <td className="p-4 text-slate-500">{r.providerName}</td>
                            <td className="p-4 font-extrabold text-amber-500 font-mono">{formatCurrency(r.price)}</td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                                r.status === 'تم القبول' || r.status === 'مكتمل'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : r.status === 'ملغي'
                                  ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                                  : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              {r.status === 'قيد الانتظار' ? (
                                <div className="flex items-center justify-center gap-2">
                                  <button 
                                    onClick={() => handleAcceptRequest(r.id)}
                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                  >
                                    قبول الطلب
                                  </button>
                                  <button 
                                    onClick={() => handleRejectRequest(r.id)}
                                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-lg text-[10px] transition-colors cursor-pointer"
                                  >
                                    رفض الطلب
                                  </button>
                                </div>
                              ) : (
                                <span className={`text-[10px] font-bold ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>✓ تم اتخاذ القرار</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredIndependentRequests.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-550 font-bold text-xs">لا توجد طلبات جارية للمطابقة</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Portrait Mobile View */}
                <div className={`md:hidden block divide-y ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                  {filteredIndependentRequests.map((r, idx) => (
                    <div key={idx} className={`p-4 space-y-3 transition-colors text-right ${isDark ? 'bg-slate-950 hover:bg-slate-900 text-slate-300' : 'bg-white hover:bg-slate-50 text-slate-650'}`} dir="rtl">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xs text-amber-500 font-mono">SR-{r.id}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold ${
                          r.status === 'تم القبول' || r.status === 'مكتمل'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : r.status === 'ملغي'
                            ? 'bg-rose-500/10 text-rose-450 border border-rose-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {r.status}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-xs">
                        <div className="flex justify-between">
                          <span className={`font-medium font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>العميل:</span>
                          <span className={`font-extrabold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{r.customerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>الخدمة:</span>
                          <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{r.serviceName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>المزود:</span>
                          <span className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{r.providerName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className={`font-medium font-sans ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>مبلغ التسوية:</span>
                          <span className="font-black text-amber-500 font-mono">{formatCurrency(r.price)}</span>
                        </div>
                      </div>

                      {r.status === 'قيد الانتظار' && (
                        <div className="pt-2 flex gap-2">
                          <button 
                            onClick={() => handleAcceptRequest(r.id)}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                          >
                            قبول وهيكلة تسوية بنكية
                          </button>
                          <button 
                            onClick={() => handleRejectRequest(r.id)}
                            className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center"
                          >
                            رفض وإلغاء
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredIndependentRequests.length === 0 && (
                    <div className="p-8 text-center text-slate-400 font-medium text-xs">لا توجد طلبات تسوية مطابقة للبحث</div>
                  )}
                </div>
              </div>
            </div>
          );
        })()}

      </div>

      {/* MODAL: Assign/Create urgent logistics task form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className={`max-w-md w-full rounded-3xl border shadow-2xl p-6 relative transition-colors duration-350 ${isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-205 text-slate-900'}`}>
            <button 
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-4 left-4 p-2 rounded-full transition-all ${isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${isDark ? 'text-amber-50' : 'text-slate-800'}`}>
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>تكليف وتنسيق دعم لوجستي عاجل</span>
            </h3>

            <form onSubmit={handleCreateSupportRequest} className="space-y-4">
              
              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>اربط هذا التكليف برقم حجز المناسبة المناسب:</label>
                <select 
                  value={selectedBookingForLogistics}
                  onChange={e => setSelectedBookingForLogistics(e.target.value)}
                  className={`w-full p-3 rounded-xl border outline-none text-xs font-bold font-sans transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500/40' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500/45'
                  }`}
                >
                  <option value="">-- اختر رقم حجز المناسبة للعميل --</option>
                  {bookings.map(b => (
                    <option key={b.id} value={b.id}>
                      عقد {b.customerName} (#{b.id}) - {b.hall?.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>فئة الخدمة والدعم اللوجستي:</label>
                <select 
                  value={logisticsForm.serviceType}
                  onChange={e => setLogisticsForm({ ...logisticsForm, serviceType: e.target.value })}
                  className={`w-full p-3 rounded-xl border outline-none text-xs transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500/40' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500/45'
                  }`}
                >
                  <option value="بوفيه وضيافة">🍢 بوفيه مفتوح وضيافة مأدبة</option>
                  <option value="تصوير">📸 تصوير فوتوغرافي وتغطية سينمائية</option>
                  <option value="تنسيق قاعات">💐 تنسيق كوش وورد طبيعي وتزيين</option>
                  <option value="دي جي وفِرق">🎙 دي جي وفِرق غنائية وإحياء مناسبات</option>
                  <option value="مضافة وحراسة">💂 منظمين طاقم لإدارة حشود ودخول الملكيات</option>
                </select>
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>مبلغ التوريد المخطط (ر.س):</label>
                <input 
                  type="number" 
                  value={logisticsForm.price}
                  onChange={e => setLogisticsForm({ ...logisticsForm, price: parseFloat(e.target.value) || 0 })}
                  className={`w-full p-3 rounded-xl border outline-none text-xs font-bold font-sans transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-slate-200 focus:border-amber-500/40' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-amber-500/45'
                  }`}
                  placeholder="مثال: 3500"
                />
              </div>

              <div>
                <label className={`block text-xs font-bold mb-1.5 ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>تفاصيل وتكليفات الإشراف (تظهر لمزود الخدمة المكلف):</label>
                <textarea 
                  rows={3}
                  value={logisticsForm.description}
                  onChange={e => setLogisticsForm({ ...logisticsForm, description: e.target.value })}
                  placeholder="مثلاً: يرجى إيصال باقات الورد الساعة السادسة مساءً لتأمين تزيين طاولات الحفلات العلوية قبل وصول كبار الشخصيات والشريك..."
                  className={`w-full p-3 rounded-xl border outline-none text-xs leading-relaxed transition-colors duration-300 ${
                    isDark 
                      ? 'bg-slate-900 border-slate-800 text-slate-250 focus:border-amber-500/40' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 focus:border-amber-500/45'
                  }`}
                />
              </div>

              <div className="pt-2">
                <button 
                  type="submit"
                  className="w-full py-3 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-600 transition-all shadow-lg active:scale-97 cursor-pointer"
                >
                  إرسال وإطلاق التكليف اللوجستي الفوري 🚀
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL: View booking details popped-up from links */}
      {selectedViewingBooking && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-250">
          <div className={`max-w-xl w-full rounded-3xl border shadow-2xl p-6 relative transition-colors duration-350 ${
            isDark ? 'bg-slate-950 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-900'
          }`}>
            <button 
              onClick={() => setSelectedViewingBooking(null)}
              className={`absolute top-4 left-4 p-2 rounded-full transition-all ${
                isDark ? 'text-slate-400 hover:text-white hover:bg-slate-900' : 'text-slate-500 hover:text-slate-805 hover:bg-slate-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className={`text-lg font-black mb-4 flex items-center gap-2 ${isDark ? 'text-amber-50' : 'text-slate-800'}`}>
              <Building className="w-5 h-5 text-amber-500" />
              <span>تفاصيل عقد حجز المناسبة</span>
            </h3>

            <div className="space-y-4 text-xs">
              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <p className="text-[10px] text-slate-500 mb-0.5">الرقم المرجعي للحجز</p>
                <p className="font-mono font-black text-md text-amber-500">{formatBookingId(selectedViewingBooking.id)}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>العميل:</label>
                  <p className="font-extrabold text-sm">{selectedViewingBooking.customerName}</p>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>الهاتف:</label>
                  <p className="font-mono text-sm" dir="ltr">{selectedViewingBooking.phone}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>البريد الإلكتروني:</label>
                  <p className="font-sans break-all">{selectedViewingBooking.email || 'غير متوفر'}</p>
                </div>
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>حالة الاعتماد:</label>
                  <span className={`px-2.5 py-1 rounded text-[10px] inline-block font-bold ${
                    selectedViewingBooking.status === 'confirmed' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    selectedViewingBooking.status === 'cancelled' ? 'bg-red-500/10 text-red-500 border border-red-500/20' : 
                    'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                  }`}>
                    {selectedViewingBooking.status === 'confirmed' ? 'مؤكد ومعتمد' : selectedViewingBooking.status === 'cancelled' ? 'ملغي' : 'بانتظار الفرز'}
                  </span>
                </div>
              </div>

              <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-150'}`}>
                <p className={`font-black text-xs mb-1 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>{selectedViewingBooking.hall?.name || "مرفق حجز مباشر"}</p>
                <p className="text-[10px] text-slate-500">{selectedViewingBooking.hall?.location}</p>
                <div className="flex gap-4 mt-2 pt-2 border-t border-dashed border-slate-705/30">
                  <div>
                    <span className="text-slate-500 text-[10px]">التاريخ:</span>
                    <span className="font-bold font-sans block">{new Date(selectedViewingBooking.startTime).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 text-[10px]">التوقيت:</span>
                    <span className="font-bold block">{selectedViewingBooking.period || 'مسائي'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                  <span className="text-slate-500 block text-[10px] mb-0.5">القيمة الإجمالية للتعاقد:</span>
                  <span className="font-extrabold text-sm">{selectedViewingBooking.totalAmount?.toLocaleString('ar-SA')} ر.س</span>
                </div>
                <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900/40 border-slate-850' : 'bg-slate-50 border-slate-150'}`}>
                  <span className="text-slate-500 block text-[10px] mb-0.5">العربون المدفوع (المودع):</span>
                  <span className="font-extrabold text-sm text-emerald-500">{selectedViewingBooking.paidAmount?.toLocaleString('ar-SA')} ر.س</span>
                </div>
              </div>

              {selectedViewingBooking.notes && (
                <div>
                  <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>ملاحظات وتكليفات العميل الملحقة:</label>
                  <p className={`p-3 rounded-xl border text-xs leading-relaxed ${isDark ? 'bg-slate-900/20 border-slate-800 text-slate-300' : 'bg-slate-50/50 border-slate-150 text-slate-700'}`}>
                    {selectedViewingBooking.notes}
                  </p>
                </div>
              )}

              <div className="pt-2">
                <button 
                  onClick={() => setSelectedViewingBooking(null)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 text-slate-950 font-black text-xs hover:bg-amber-600 transition-all active:scale-97 cursor-pointer"
                >
                  إغلاق نافذة التفاصيل
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
