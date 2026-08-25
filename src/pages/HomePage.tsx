/**
 * ============================================================================
 * الصفحة الرئيسية - منصة ليلة (Home Page Component)
 * ============================================================================
 * English Description:
 * Main landing and home view for the Laylah Platform. Features hero banner,
 * full-width multi-filter search widget with dynamic region/city binding,
 * instant interactive calendar availability check, partners showcase, and featured halls.
 *
 * الوصف بالعربية:
 * الصفحة الرئيسية لمنصة ليلة للأفراح والمناسبات. تحتوي على العرض الترويجي الرئيسي (Hero Banner)،
 * شريط البحث المطور بعرض كامل مع ربط ديناميكي بين المناطق والمدن من مخزن البيانات،
 * تقويم التوفر المباشر، واستعراض الشركاء والقاعات المميزة.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Calendar as CalendarIcon, 
  Star, Crown, ShieldCheck, Map, Smartphone, 
  Percent, ThumbsUp, Headset, MessageCircle, AlertCircle, X,
  ArrowLeft, ArrowRight, Lock, CheckCircle2, Sparkles, Users,
  Car, Utensils, Clock, Camera, Music, Palette, Gift, Zap, Layers,
  Compass, Plus, ChevronRight, ChevronLeft, Navigation, RefreshCw,
  ClipboardList, BadgePercent, LayoutGrid, Globe
} from 'lucide-react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import LPASPublicPage from './LPASPublicPage';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProviderChatModal from '../components/ProviderChatModal';
import ServiceDetailsModal from '../components/ServiceDetailsModal';
import RequestServiceModal from '../components/RequestServiceModal';
import { AdBanner } from '../components/AdBanner';
import { FavoriteHeartButton, HallPricingAndCompare, HallCapacityLabel, PricingPatternBadge, HallStatusBadges } from '../components/HallCardAddons';
import { halls, getStoredHalls, isProviderNameVisible, providers as fallbackProviders, getPartnerLevel, getServices, syncServicesFromApi, EventService } from '../data/mockData';
import { getFullDateInfo, CalendarType } from '../utils/dateUtils';
import { useCalendar } from '../context/CalendarContext';

/**
 * دالة مساعدة لتحديد صورة الشريك بناءً على الفئة أو الاسم
 * Helper function to map partner names to high-quality Unsplash images based on categorization
 */
const getPartnerImage = (name: string): string | undefined => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('أطياف')) {
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80'; // Event/Wedding deco
  }
  if (lowercaseName.includes('ليلة')) {
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80'; // Luxury Ballroom
  }
  if (lowercaseName.includes('الضيافة الذهبية')) {
    return 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80'; // Catering/Hospitality
  }
  if (lowercaseName.includes('لمسات')) {
    return 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80'; // Conference/Event stage
  }
  if (lowercaseName.includes('الريم')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80'; // Table setting / dining
  }
  // Generic class fallback
  if (lowercaseName.includes('تنظيم') || lowercaseName.includes('أفراح') || lowercaseName.includes('كوش') || lowercaseName.includes('تنسيق')) {
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';
  }
  if (lowercaseName.includes('قاعات') || lowercaseName.includes('قصر') || lowercaseName.includes('شاليهات') || lowercaseName.includes('منتجعات')) {
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80';
  }
  if (lowercaseName.includes('ضيافة') || lowercaseName.includes('مذاق') || lowercaseName.includes('حلويات') || lowercaseName.includes('فندقة') || lowercaseName.includes('مطعم')) {
    return 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80';
  }
  if (lowercaseName.includes('استوديو') || lowercaseName.includes('تصوير') || lowercaseName.includes('فوتوغرافي')) {
    return 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=600&q=80';
  }
  return undefined;
};

export default function HomePage() {
  const [searchParams] = useSearchParams();
  const lpasParam = searchParams.get('lpas_page') || searchParams.get('lpas_slug') || searchParams.get('landing_page');

  if (lpasParam) {
    return <LPASPublicPage />;
  }

  /**
   * قائمة المناطق والمدن من مخزن البيانات المحلي (Regions & Cities Datastore)
   * Local storage state synchronized with admin system datastore
   */
  const [regionsList, setRegionsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_REGIONS');
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 1, name: 'الرياض', cities: ['الرياض', 'الخرج', 'الدرعية', 'المجمعة', 'الدوادمي', 'الزلفي', 'وادي الدواسر', 'القويعية', 'شقراء'], image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 2, name: 'مكة المكرمة', cities: ['مكة', 'جدة', 'الطائف', 'رابغ', 'القنفذة', 'الليث', 'خليص'], image: 'https://images.unsplash.com/photo-1565552643952-b4306354dd95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 3, name: 'المدينة المنورة', cities: ['المدينة المنورة', 'ينبع', 'العلا', 'بدر', 'المهد', 'خيبر'], image: 'https://images.unsplash.com/photo-1591462002164-81ebd02d6b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 4, name: 'المنطقة الشرقية', cities: ['الدمام', 'الخبر', 'الظهران', 'الأحساء', 'الهفوف', 'الجبيل', 'القطيف', 'حفر الباطن', 'الخفجي', 'رأس تنورة'], image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 5, name: 'القصيم', cities: ['بريدة', 'عنيزة', 'الرس', 'البكيرية', 'المذنب', 'البدائع', 'رياض الخبراء'], image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 6, name: 'حائل', cities: ['حائل', 'بقعاء', 'الشنان', 'الغزالة'], image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 7, name: 'عسير', cities: ['أبها', 'خميس مشيط', 'النماص', 'أحد رفيدة', 'محايل عسير', 'تنومة', 'بيشة', 'المجاردة'], image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 8, name: 'تبوك', cities: ['تبوك', 'ضباء', 'الوجه', 'أملج', 'حقل', 'تيماء'], image: 'https://images.unsplash.com/photo-1647432243886-42ab22c95333?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 9, name: 'الجوف', cities: ['سكاكا', 'القريات', 'دومة الجندل', 'طبرجل'], image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 10, name: 'جيزان', cities: ['جيزان', 'صبيا', 'أبو عريش', 'صامطة', 'بيش', 'فرسان', 'الدرب'], image: 'https://images.unsplash.com/photo-1621213501708-518dd3e198b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 11, name: 'نجران', cities: ['نجران', 'شرورة', 'حبونا', 'بدر الجنوب'], image: 'https://images.unsplash.com/photo-1549419131-7294860b7cb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 12, name: 'الباحة', cities: ['الباحة', 'بلجرشي', 'المندق', 'المخواة', 'قلوة'], image: 'https://images.unsplash.com/photo-1623945415707-16067fa23cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 13, name: 'الحدود الشمالية', cities: ['عرعر', 'رفحاء', 'طريف', 'العويقيلة'], image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }
    ];
  });

  const [hallsList, setHallsList] = useState(() => getStoredHalls());

  useEffect(() => {
    const fetchHallsFromDB = async () => {
      try {
        const res = await fetch('/api/bookings/halls');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            setHallsList(data);
          }
        }
      } catch (err) {
        console.warn("Failed fetching halls from external DB API, fallback to local storage:", err);
      }
    };

    const syncRegionsFromStore = () => {
      try {
        const stored = localStorage.getItem('SYSTEM_REGIONS');
        if (stored) {
          setRegionsList(JSON.parse(stored));
        }
      } catch {}
    };

    fetchHallsFromDB();
    syncRegionsFromStore();

    const handleHallsUpdate = () => {
      fetchHallsFromDB();
      syncRegionsFromStore();
    };
    window.addEventListener('storage', handleHallsUpdate);
    window.addEventListener('settingsUpdated', handleHallsUpdate);
    window.addEventListener('hallsUpdated', handleHallsUpdate);
    return () => {
      window.removeEventListener('storage', handleHallsUpdate);
      window.removeEventListener('settingsUpdated', handleHallsUpdate);
      window.removeEventListener('hallsUpdated', handleHallsUpdate);
    };
  }, []);

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { calendarType, setCalendarType } = useCalendar();
  const navigate = useNavigate();

  // Hierarchical Drill-Down Metro State:
  // level: 'zones' (المناطق الجغرافية الـ 5) -> 'regions' (المناطق الإدارية للمنطقة الجغرافية) -> 'cities' (المدن والمحافظات)
  const [drillLevel, setDrillLevel] = useState<'zones' | 'regions' | 'cities'>('zones');
  const [selectedGeoZoneId, setSelectedGeoZoneId] = useState<string>(''); // e.g. 'central', 'western', etc.
  const [selectedAdminRegionId, setSelectedAdminRegionId] = useState<string>(''); // e.g. 'riyadh', 'qassim', etc.
  const [metroPageIndex, setMetroPageIndex] = useState<number>(0);

  // -------------------------------------------------------------
  // Services & Smart Planner Tier State (قسم الخدمات والتخطيط المطور)
  // -------------------------------------------------------------
  const [servicesList, setServicesList] = useState<EventService[]>(() => getServices());
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all');
  const [serviceCarouselIndex, setServiceCarouselIndex] = useState<number>(0);
  const [bentoGridHallIndex, setBentoGridHallIndex] = useState<number>(0);
  const [selectedServiceForDetails, setSelectedServiceForDetails] = useState<EventService | null>(null);
  const [selectedServiceForRequest, setSelectedServiceForRequest] = useState<EventService | null>(null);
  const [isServiceDetailsOpen, setIsServiceDetailsOpen] = useState<boolean>(false);
  const [isServiceRequestOpen, setIsServiceRequestOpen] = useState<boolean>(false);

  const [currentUserData, setCurrentUserData] = useState<any>(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [userBookings, setUserBookings] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('ais_user_bookings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const data = await syncServicesFromApi();
        if (Array.isArray(data) && data.length > 0) {
          setServicesList(data);
        }
      } catch {
        setServicesList(getServices());
      }
    };
    fetchServices();

    const handleServicesUpdate = () => {
      setServicesList(getServices());
      try {
        const storedUser = localStorage.getItem('currentUser');
        setCurrentUserData(storedUser ? JSON.parse(storedUser) : null);
        const storedBookings = localStorage.getItem('ais_user_bookings');
        setUserBookings(storedBookings ? JSON.parse(storedBookings) : []);
      } catch {}
    };

    window.addEventListener('servicesUpdated', handleServicesUpdate);
    window.addEventListener('storage', handleServicesUpdate);
    return () => {
      window.removeEventListener('servicesUpdated', handleServicesUpdate);
      window.removeEventListener('storage', handleServicesUpdate);
    };
  }, []);

  // Service categories with rich iconography and background photos for the circular quick carousel
  const serviceCategories = useMemo(() => [
    { id: 'all', name: 'الكل', label: 'جميع الخدمات', icon: Sparkles, image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=300&q=80' },
    { id: 'بوفيه وضيافة', name: 'بوفيه وضيافة', label: 'الضيافة والبوفيهات', icon: Utensils, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=300&q=80' },
    { id: 'تصوير', name: 'تصوير وتوثيق', label: 'التصوير والتوثيق', icon: Camera, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=300&q=80' },
    { id: 'تنسيق قاعات', name: 'كوش وتنسيق', label: 'الكوش وتنسيق القاعات', icon: Palette, image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?auto=format&fit=crop&w=300&q=80' },
    { id: 'دي جي وفِرق', name: 'دي جي وفِرق', label: 'الدي جي والفرق الغنائية', icon: Music, image: 'https://images.unsplash.com/photo-1470229722913-7c090be5f524?auto=format&fit=crop&w=300&q=80' },
    { id: 'إضاءة ومؤثرات', name: 'إضاءة ومؤثرات', label: 'الإضاءة وهندسة الصوت', icon: Zap, image: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=300&q=80' },
    { id: 'تنظيم وأمن', name: 'تنظيم وعبايات', label: 'الأمن وتنظيم العبايات', icon: ShieldCheck, image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=300&q=80' },
  ], []);

  // Filtered services (up to 30 items) based on active category - strictly actual items
  const allFilteredServices = useMemo(() => {
    const active = servicesList.filter(s => {
      const sAny = s as any;
      const isSuspendedOrBlocked = 
        sAny.status === 'blocked' || 
        sAny.status === 'suspended' || 
        sAny.status === 'موقوف' || 
        sAny.activationStatus === 'موقوف' || 
        sAny.activationStatus === 'blocked' || 
        sAny.activationStatus === 'suspended';
      return !isSuspendedOrBlocked;
    });

    if (selectedServiceCategory === 'all') {
      return active.slice(0, 30);
    }

    const catFiltered = active.filter(s => {
      const cat = (s.category || '').toLowerCase();
      const cls = (s.classification || '').toLowerCase();
      const name = (s.name || '').toLowerCase();
      
      if (selectedServiceCategory === 'بوفيه وضيافة') {
        return cat.includes('ضيافة') || cat.includes('بوفيه') || cls.includes('ضيافة') || name.includes('ضيافة') || name.includes('بوفيه') || name.includes('قهوة');
      }
      if (selectedServiceCategory === 'تصوير') {
        return cat.includes('تصوير') || cls.includes('تصوير') || name.includes('تصوير') || name.includes('فوتو') || name.includes('سينمائي');
      }
      if (selectedServiceCategory === 'تنسيق قاعات') {
        return cat.includes('تنسيق') || cat.includes('كوش') || cls.includes('تنسيق') || name.includes('كوش') || name.includes('زهور') || name.includes('ورد');
      }
      if (selectedServiceCategory === 'دي جي وفِرق') {
        return cat.includes('دي جي') || cat.includes('فرق') || cls.includes('دي جي') || name.includes('دي جي') || name.includes('فرقة') || name.includes('ألحان') || name.includes('صوت');
      }
      if (selectedServiceCategory === 'إضاءة ومؤثرات') {
        return cat.includes('إضاءة') || cat.includes('مؤثرات') || cls.includes('إضاءة') || name.includes('إضاءة') || name.includes('ليزر') || name.includes('دخان');
      }
      if (selectedServiceCategory === 'تنظيم وأمن') {
        return cat.includes('تنظيم') || cat.includes('أمن') || cls.includes('تنظيم') || name.includes('أمن') || name.includes('عبايات') || name.includes('استقبال');
      }
      return s.category === selectedServiceCategory;
    });

    // الاكتفاء بإظهار البطاقات الفعلية حسب التصنيف بدون زيادة أو استكمال من تصنيفات أخرى
    return catFiltered.slice(0, 30);
  }, [servicesList, selectedServiceCategory]);

  // Current visible 5 golden cards per page
  const visibleServices = useMemo(() => {
    const total = allFilteredServices.length;
    if (total === 0) return [];
    if (total <= 5) return allFilteredServices;
    const pageIndex = Math.floor(serviceCarouselIndex / 5);
    const start = pageIndex * 5;
    return allFilteredServices.slice(start, start + 5);
  }, [allFilteredServices, serviceCarouselIndex]);

  const handlePrevServices = () => {
    setServiceCarouselIndex(prev => {
      const totalPages = Math.max(1, Math.ceil(allFilteredServices.length / 5));
      const currentPage = Math.floor(prev / 5);
      const prevPage = currentPage <= 0 ? totalPages - 1 : currentPage - 1;
      return prevPage * 5;
    });
  };

  const handleNextServices = () => {
    setServiceCarouselIndex(prev => {
      const totalPages = Math.max(1, Math.ceil(allFilteredServices.length / 5));
      const currentPage = Math.floor(prev / 5);
      const nextPage = currentPage + 1 >= totalPages ? 0 : currentPage + 1;
      return nextPage * 5;
    });
  };

  /**
   * دالة مساعدة لحساب عدد القاعات المتاحة لكل مدينة أو منطقة من قاعدة البيانات السحابية
   */
  const getDynamicHallCount = (cityQuery: string, regionQuery: string, fallbackCount: number) => {
    if (!hallsList || hallsList.length === 0) return fallbackCount;
    const count = hallsList.filter((h: any) => {
      if (h.status && h.status !== 'approved') return false;
      if (h.activationStatus === 'موقوف') return false;
      if (cityQuery && h.city && (h.city.includes(cityQuery) || cityQuery.includes(h.city))) return true;
      if (regionQuery && h.region && (h.region.includes(regionQuery) || regionQuery.includes(h.region))) return true;
      return false;
    }).length;
    return count > 0 ? count : fallbackCount;
  };

  // Master Regions data mapping with geographic zones, administrative regions, and independent cities
  const zoneDataMap = useMemo(() => {
    return {
      all: {
        id: 'all',
        label: 'كل المناطق الجغرافية',
        subRegions: [],
        tiles: [
          {
            id: 'central-zone',
            zoneId: 'central',
            title: 'المنطقة الوسطى',
            subtitle: 'منطقة الرياض، منطقة القصيم، منطقة حائل',
            count: getDynamicHallCount('', 'الرياض', 312),
            query: 'الرياض',
            city: '',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'western-zone',
            zoneId: 'western',
            title: 'المنطقة الغربية',
            subtitle: 'منطقة مكة المكرمة، منطقة المدينة المنورة',
            count: getDynamicHallCount('', 'مكة المكرمة', 286),
            query: 'مكة المكرمة',
            city: '',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'southern-zone',
            zoneId: 'southern',
            title: 'المنطقة الجنوبية',
            subtitle: 'منطقة عسير، منطقة الباحة، منطقة جازان، منطقة نجران',
            count: getDynamicHallCount('', 'عسير', 164),
            query: 'عسير',
            city: '',
            image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'eastern-zone',
            zoneId: 'eastern',
            title: 'المنطقة الشرقية',
            subtitle: 'الدمام، الخبر، الأحساء، الجبيل، القطيف، حفر الباطن',
            count: getDynamicHallCount('', 'المنطقة الشرقية', 198),
            query: 'المنطقة الشرقية',
            city: '',
            image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'northern-zone',
            zoneId: 'northern',
            title: 'المنطقة الشمالية',
            subtitle: 'منطقة الجوف، منطقة تبوك، منطقة الحدود الشمالية',
            count: getDynamicHallCount('', 'تبوك', 142),
            query: 'تبوك',
            city: '',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ]
      },
      central: {
        id: 'central',
        label: 'المنطقة الوسطى',
        adminRegions: [
          {
            id: 'riyadh',
            title: 'منطقة الرياض',
            subtitle: 'العاصمة والدرعية والخرج والمجمعة والدوادمي والزلفي',
            count: getDynamicHallCount('', 'الرياض', 298),
            query: 'الرياض',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'qassim',
            title: 'منطقة القصيم',
            subtitle: 'بريدة وعنيزة والرس والبكيرية والمذنب',
            count: getDynamicHallCount('', 'القصيم', 96),
            query: 'القصيم',
            image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'hail',
            title: 'منطقة حائل',
            subtitle: 'عروس الشمال ومضايف الكرم الحاتمي وبقعاء',
            count: getDynamicHallCount('', 'حائل', 42),
            query: 'حائل',
            image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ],
        subRegions: [
          { id: 'riyadh', name: 'منطقة الرياض', query: 'الرياض' },
          { id: 'qassim', name: 'منطقة القصيم', query: 'القصيم' },
          { id: 'hail', name: 'منطقة حائل', query: 'حائل' },
        ],
        tiles: [
          {
            id: 'riyadh-city',
            title: 'مدينة الرياض',
            subtitle: 'العاصمة وقصور الأفراح الفاخرة',
            regionName: 'منطقة الرياض',
            subRegionId: 'riyadh',
            count: getDynamicHallCount('الرياض', 'الرياض', 185),
            query: 'الرياض',
            city: 'الرياض',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'diriyah-city',
            title: 'مدينة الدرعية',
            subtitle: 'أصالة نجد وقاعات المناسبات التراثية',
            regionName: 'منطقة الرياض',
            subRegionId: 'riyadh',
            count: getDynamicHallCount('الدرعية', 'الرياض', 42),
            query: 'الرياض',
            city: 'الدرعية',
            image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'kharj-city',
            title: 'مدينة الخرج',
            subtitle: 'واحات نجد وقصور الأفراح الراقية',
            regionName: 'منطقة الرياض',
            subRegionId: 'riyadh',
            count: getDynamicHallCount('الخرج', 'الرياض', 36),
            query: 'الرياض',
            city: 'الخرج',
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'buraidah-city',
            title: 'مدينة بريدة',
            subtitle: 'عاصمة القصيم وقصور الاحتفالات الكبرى',
            regionName: 'منطقة القصيم',
            subRegionId: 'qassim',
            count: getDynamicHallCount('بريدة', 'القصيم', 38),
            query: 'القصيم',
            city: 'بريدة',
            image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'unaizah-city',
            title: 'مدينة عنيزة',
            subtitle: 'باريس نجد وقاعات المناسبات الراقية',
            regionName: 'منطقة القصيم',
            subRegionId: 'qassim',
            count: getDynamicHallCount('عنيزة', 'القصيم', 28),
            query: 'القصيم',
            city: 'عنيزة',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'hail-main-city',
            title: 'مدينة حائل',
            subtitle: 'عروس الشمال ومضايف الكرم الحاتمي',
            regionName: 'منطقة حائل',
            subRegionId: 'hail',
            count: getDynamicHallCount('حائل', 'حائل', 24),
            query: 'حائل',
            city: 'حائل',
            image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'rass-city',
            title: 'مدينة الرس',
            subtitle: 'واحات القصيم وقاعات ومنتجعات الضيافة',
            regionName: 'منطقة القصيم',
            subRegionId: 'qassim',
            count: getDynamicHallCount('الرس', 'القصيم', 18),
            query: 'القصيم',
            city: 'الرس',
            image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'majmaah-city',
            title: 'مدينة المجمعة',
            subtitle: 'عروس سدير وقاعات الاحتفالات الراقية',
            regionName: 'منطقة الرياض',
            subRegionId: 'riyadh',
            count: getDynamicHallCount('المجمعة', 'الرياض', 22),
            query: 'الرياض',
            city: 'المجمعة',
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'dawadmi-city',
            title: 'مدينة الدوادمي',
            subtitle: 'عالية نجد واستراحات ومناسبات الفخامة',
            regionName: 'منطقة الرياض',
            subRegionId: 'riyadh',
            count: getDynamicHallCount('الدوادمي', 'الرياض', 16),
            query: 'الرياض',
            city: 'الدوادمي',
            image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'zulfi-city',
            title: 'مدينة الزلفي',
            subtitle: 'واحات الرمال وقاعات الضيافة المميزة',
            regionName: 'منطقة الرياض',
            subRegionId: 'riyadh',
            count: getDynamicHallCount('الزلفي', 'الرياض', 14),
            query: 'الرياض',
            city: 'الزلفي',
            image: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'bukayriyah-city',
            title: 'مدينة البكيرية',
            subtitle: 'مدينة الزهور وقاعات الأفراح',
            regionName: 'منطقة القصيم',
            subRegionId: 'qassim',
            count: getDynamicHallCount('البكيرية', 'القصيم', 12),
            query: 'القصيم',
            city: 'البكيرية',
            image: 'https://images.unsplash.com/photo-1452780212940-6f5c0d14d848?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'baqaa-city',
            title: 'محافظة بقعاء',
            subtitle: 'واحات حائل واستراحات المناسبات',
            regionName: 'منطقة حائل',
            subRegionId: 'hail',
            count: getDynamicHallCount('بقعاء', 'حائل', 8),
            query: 'حائل',
            city: 'بقعاء',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ]
      },
      western: {
        id: 'western',
        label: 'المنطقة الغربية',
        adminRegions: [
          {
            id: 'makkah',
            title: 'منطقة مكة المكرمة',
            subtitle: 'جدة ومكة المكرمة والطائف ورابغ والقنفذة والليث',
            count: getDynamicHallCount('', 'مكة المكرمة', 246),
            query: 'مكة المكرمة',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'madinah',
            title: 'منطقة المدينة المنورة',
            subtitle: 'طيبة الطيبة وينبع ومحافظة العلا وبدر والمهد',
            count: getDynamicHallCount('', 'المدينة المنورة', 78),
            query: 'المدينة المنورة',
            image: 'https://images.unsplash.com/photo-1591462002164-81ebd02d6b38?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ],
        subRegions: [
          { id: 'makkah', name: 'منطقة مكة المكرمة', query: 'مكة المكرمة' },
          { id: 'madinah', name: 'منطقة المدينة المنورة', query: 'المدينة المنورة' },
        ],
        tiles: [
          {
            id: 'jeddah-city',
            title: 'مدينة جدة',
            subtitle: 'عروس البحر الأحمر والقاعات الفندقية الفاخرة',
            regionName: 'منطقة مكة المكرمة',
            subRegionId: 'makkah',
            count: getDynamicHallCount('جدة', 'مكة المكرمة', 142),
            query: 'مكة المكرمة',
            city: 'جدة',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'makkah-main-city',
            title: 'مكة المكرمة',
            subtitle: 'قاعات المناسبات الكبرى والضيافة الراقية',
            regionName: 'منطقة مكة المكرمة',
            subRegionId: 'makkah',
            count: getDynamicHallCount('مكة', 'مكة المكرمة', 68),
            query: 'مكة المكرمة',
            city: 'مكة',
            image: 'https://images.unsplash.com/photo-1565552643952-b4306354dd95?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'taif-city',
            title: 'مدينة الطائف',
            subtitle: 'عروس المصائف وقاعات الإطلالات الجبلية',
            regionName: 'منطقة مكة المكرمة',
            subRegionId: 'makkah',
            count: getDynamicHallCount('الطائف', 'مكة المكرمة', 38),
            query: 'مكة المكرمة',
            city: 'الطائف',
            image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'madinah-main-city',
            title: 'المدينة المنورة',
            subtitle: 'طيبة الطيبة وقصور الضيافة والمناسبات',
            regionName: 'منطقة المدينة المنورة',
            subRegionId: 'madinah',
            count: getDynamicHallCount('المدينة المنورة', 'المدينة المنورة', 32),
            query: 'المدينة المنورة',
            city: 'المدينة المنورة',
            image: 'https://images.unsplash.com/photo-1591462002164-81ebd02d6b38?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'yanbu-city',
            title: 'مدينة ينبع',
            subtitle: 'لؤلؤة البحر الأحمر والمنتجعات الشاطئية',
            regionName: 'منطقة المدينة المنورة',
            subRegionId: 'madinah',
            count: getDynamicHallCount('ينبع', 'المدينة المنورة', 18),
            query: 'المدينة المنورة',
            city: 'ينبع',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'ula-city',
            title: 'محافظة العلا',
            subtitle: 'عروس الجبال وقاعات المناسبات الاستثنائية',
            regionName: 'منطقة المدينة المنورة',
            subRegionId: 'madinah',
            count: getDynamicHallCount('العلا', 'المدينة المنورة', 14),
            query: 'المدينة المنورة',
            city: 'العلا',
            image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'rabigh-city',
            title: 'محافظة رابغ',
            subtitle: 'سواحل البحر الأحمر وقاعات الاحتفالات الحديثة',
            regionName: 'منطقة مكة المكرمة',
            subRegionId: 'makkah',
            count: getDynamicHallCount('رابغ', 'مكة المكرمة', 12),
            query: 'مكة المكرمة',
            city: 'رابغ',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'qunfudhah-city',
            title: 'محافظة القنفذة',
            subtitle: 'غادة الجنوب والمنتجعات الساحلية الفاخرة',
            regionName: 'منطقة مكة المكرمة',
            subRegionId: 'makkah',
            count: getDynamicHallCount('القنفذة', 'مكة المكرمة', 9),
            query: 'مكة المكرمة',
            city: 'القنفذة',
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'badr-city',
            title: 'محافظة بدر',
            subtitle: 'واحات التاريخ وقاعات الضيافة',
            regionName: 'منطقة المدينة المنورة',
            subRegionId: 'madinah',
            count: getDynamicHallCount('بدر', 'المدينة المنورة', 7),
            query: 'المدينة المنورة',
            city: 'بدر',
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ]
      },
      eastern: {
        id: 'eastern',
        label: 'المنطقة الشرقية',
        adminRegions: [
          {
            id: 'eastern-region',
            title: 'المنطقة الشرقية',
            subtitle: 'الدمام والخبر والأحساء والجبيل والقطيف والظهران وحفر الباطن والخفجي',
            count: getDynamicHallCount('', 'المنطقة الشرقية', 198),
            query: 'المنطقة الشرقية',
            image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          }
        ],
        subRegions: [
          { id: 'eastern-region', name: 'المنطقة الشرقية', query: 'المنطقة الشرقية' },
        ],
        tiles: [
          {
            id: 'khobar-city',
            title: 'مدينة الخبر',
            subtitle: 'لؤلؤة الخليج والقاعات الفندقية الفاخرة',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('الخبر', 'المنطقة الشرقية', 78),
            query: 'المنطقة الشرقية',
            city: 'الخبر',
            image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'dammam-city',
            title: 'مدينة الدمام',
            subtitle: 'حاضرة الشرقية وقصور المناسبات الكبرى',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('الدمام', 'المنطقة الشرقية', 65),
            query: 'المنطقة الشرقية',
            city: 'الدمام',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'ahsa-city',
            title: 'محافظة الأحساء',
            subtitle: 'أكبر واحة نخيل وقصور الأفراح الفاخرة',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('الأحساء', 'المنطقة الشرقية', 46),
            query: 'المنطقة الشرقية',
            city: 'الهفوف',
            image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'jubail-city',
            title: 'مدينة الجبيل',
            subtitle: 'قاعات ومنتجعات النخيل وشواطئ الخليج',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('الجبيل', 'المنطقة الشرقية', 22),
            query: 'المنطقة الشرقية',
            city: 'الجبيل',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'qatif-city',
            title: 'محافظة القطيف',
            subtitle: 'سواحل الخليج واستراحات وقاعات المناسبات',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('القطيف', 'المنطقة الشرقية', 18),
            query: 'المنطقة الشرقية',
            city: 'القطيف',
            image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'dhahran-city',
            title: 'مدينة الظهران',
            subtitle: 'واحة الطاقة وقاعات الفنادق الراقية',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('الظهران', 'المنطقة الشرقية', 15),
            query: 'المنطقة الشرقية',
            city: 'الظهران',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'hafr-city',
            title: 'حفر الباطن',
            subtitle: 'عاصمة الربيع وقصور الضيافة الشمالية الشرقية',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('حفر الباطن', 'المنطقة الشرقية', 14),
            query: 'المنطقة الشرقية',
            city: 'حفر الباطن',
            image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'khafji-city',
            title: 'محافظة الخفجي',
            subtitle: 'شواطئ الخليج وقاعات المناسبات الساحلية',
            regionName: 'المنطقة الشرقية',
            subRegionId: 'eastern-region',
            count: getDynamicHallCount('الخفجي', 'المنطقة الشرقية', 9),
            query: 'المنطقة الشرقية',
            city: 'الخفجي',
            image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ]
      },
      northern: {
        id: 'northern',
        label: 'المنطقة الشمالية',
        adminRegions: [
          {
            id: 'tabuk',
            title: 'منطقة تبوك',
            subtitle: 'بوابة الشمال ونيوم وضباء والوجه وأملج وتيماء',
            count: getDynamicHallCount('', 'تبوك', 76),
            query: 'تبوك',
            image: 'https://images.unsplash.com/photo-1647432243886-42ab22c95333?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'jouf',
            title: 'منطقة الجوف',
            subtitle: 'سكاكا والقريات ودومة الجندل وطبرجل',
            count: getDynamicHallCount('', 'الجوف', 48),
            query: 'الجوف',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'northern-borders',
            title: 'منطقة الحدود الشمالية',
            subtitle: 'عرعر ورفحاء وطريف والعويقيلة',
            count: getDynamicHallCount('', 'الحدود الشمالية', 34),
            query: 'الحدود الشمالية',
            image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ],
        subRegions: [
          { id: 'jouf', name: 'منطقة الجوف', query: 'الجوف' },
          { id: 'tabuk', name: 'منطقة تبوك', query: 'تبوك' },
          { id: 'northern-borders', name: 'منطقة الحدود الشمالية', query: 'الحدود الشمالية' },
        ],
        tiles: [
          {
            id: 'tabuk-main-city',
            title: 'مدينة تبوك',
            subtitle: 'بوابة الشمال وقاعات المستقبل ونيوم',
            regionName: 'منطقة تبوك',
            subRegionId: 'tabuk',
            count: getDynamicHallCount('تبوك', 'تبوك', 62),
            query: 'تبوك',
            city: 'تبوك',
            image: 'https://images.unsplash.com/photo-1647432243886-42ab22c95333?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'sakaka-city',
            title: 'مدينة سكاكا',
            subtitle: 'عاصمة الجوف وواحات الزيتون وقصور الأفراح',
            regionName: 'منطقة الجوف',
            subRegionId: 'jouf',
            count: getDynamicHallCount('سكاكا', 'الجوف', 36),
            query: 'الجوف',
            city: 'سكاكا',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'qurayyat-city',
            title: 'محافظة القريات',
            subtitle: 'مدينة الملح وقاعات المناسبات الشمالية',
            regionName: 'منطقة الجوف',
            subRegionId: 'jouf',
            count: getDynamicHallCount('القريات', 'الجوف', 24),
            query: 'الجوف',
            city: 'القريات',
            image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'arar-city',
            title: 'مدينة عرعر',
            subtitle: 'عاصمة الحدود الشمالية ومناسبات البادية',
            regionName: 'منطقة الحدود الشمالية',
            subRegionId: 'northern-borders',
            count: getDynamicHallCount('عرعر', 'الحدود الشمالية', 22),
            query: 'الحدود الشمالية',
            city: 'عرعر',
            image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'rafha-city',
            title: 'محافظة رفحاء',
            subtitle: 'واحات الشمال وقصور الضيافة العربية',
            regionName: 'منطقة الحدود الشمالية',
            subRegionId: 'northern-borders',
            count: getDynamicHallCount('رفحاء', 'الحدود الشمالية', 14),
            query: 'الحدود الشمالية',
            city: 'رفحاء',
            image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'duba-city',
            title: 'محافظة ضباء',
            subtitle: 'لؤلؤة الشمال وقاعات الشواطئ الساحلية',
            regionName: 'منطقة تبوك',
            subRegionId: 'tabuk',
            count: getDynamicHallCount('ضباء', 'تبوك', 12),
            query: 'تبوك',
            city: 'ضباء',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'wajh-city',
            title: 'محافظة الوجه',
            subtitle: 'تراث الساحل وقاعات المناسبات',
            regionName: 'منطقة تبوك',
            subRegionId: 'tabuk',
            count: getDynamicHallCount('الوجه', 'تبوك', 10),
            query: 'تبوك',
            city: 'الوجه',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'umluj-city',
            title: 'محافظة أملج',
            subtitle: 'مالديف السعودية والمنتجعات الشاطئية',
            regionName: 'منطقة تبوك',
            subRegionId: 'tabuk',
            count: getDynamicHallCount('أملج', 'تبوك', 11),
            query: 'تبوك',
            city: 'أملج',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'turaif-city',
            title: 'محافظة طريف',
            subtitle: 'بوابة الشمال الغربية وقاعات الاحتفالات',
            regionName: 'منطقة الحدود الشمالية',
            subRegionId: 'northern-borders',
            count: getDynamicHallCount('طريف', 'الحدود الشمالية', 8),
            query: 'الحدود الشمالية',
            city: 'طريف',
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'dumat-city',
            title: 'دومة الجندل',
            subtitle: 'تراث قلعة مارد وقاعات الضيافة',
            regionName: 'منطقة الجوف',
            subRegionId: 'jouf',
            count: getDynamicHallCount('دومة الجندل', 'الجوف', 8),
            query: 'الجوف',
            city: 'دومة الجندل',
            image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ]
      },
      southern: {
        id: 'southern',
        label: 'المنطقة الجنوبية',
        adminRegions: [
          {
            id: 'asir',
            title: 'منطقة عسير',
            subtitle: 'أبها وخميس مشيط ومحافظة النماص ومحايل ورجال ألمع وتنومة',
            count: getDynamicHallCount('', 'عسير', 84),
            query: 'عسير',
            image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'jizan',
            title: 'منطقة جازان',
            subtitle: 'جازان وصبيا وأبو عريش وفرسان وصامطة والدرب',
            count: getDynamicHallCount('', 'جازان', 46),
            query: 'جازان',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'baha',
            title: 'منطقة الباحة',
            subtitle: 'مدينة الباحة وبلجرشي والمندق والمخواة وقلوة',
            count: getDynamicHallCount('', 'الباحة', 32),
            query: 'الباحة',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'najran',
            title: 'منطقة نجران',
            subtitle: 'مدينة نجران وشرورة وحبونا وبدر الجنوب',
            count: getDynamicHallCount('', 'نجران', 28),
            query: 'نجران',
            image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ],
        subRegions: [
          { id: 'asir', name: 'منطقة عسير', query: 'عسير' },
          { id: 'baha', name: 'منطقة الباحة', query: 'الباحة' },
          { id: 'jizan', name: 'منطقة جازان', query: 'جازان' },
          { id: 'najran', name: 'منطقة نجران', query: 'نجران' },
        ],
        tiles: [
          {
            id: 'abha-main-city',
            title: 'مدينة أبها',
            subtitle: 'سيدة الضباب وقاعات قمم السروات',
            regionName: 'منطقة عسير',
            subRegionId: 'asir',
            count: getDynamicHallCount('أبها', 'عسير', 72),
            query: 'عسير',
            city: 'أبها',
            image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?auto=format&fit=crop&w=1200&q=80',
            layout: 'hero',
          },
          {
            id: 'khamis-city',
            title: 'خميس مشيط',
            subtitle: 'حاضرة عسير التجارية وقصور الأفراح الكبرى',
            regionName: 'منطقة عسير',
            subRegionId: 'asir',
            count: getDynamicHallCount('خميس مشيط', 'عسير', 54),
            query: 'عسير',
            city: 'خميس مشيط',
            image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'baha-main-city',
            title: 'مدينة الباحة',
            subtitle: 'غابات رغدان وقصور الضيافة الجبلية',
            regionName: 'منطقة الباحة',
            subRegionId: 'baha',
            count: getDynamicHallCount('الباحة', 'الباحة', 26),
            query: 'الباحة',
            city: 'الباحة',
            image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'jizan-main-city',
            title: 'مدينة جازان',
            subtitle: 'لؤلؤة الجنوب وشواطئ الفخامة',
            regionName: 'منطقة جازان',
            subRegionId: 'jizan',
            count: getDynamicHallCount('جازان', 'جازان', 38),
            query: 'جازان',
            city: 'جازان',
            image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'najran-main-city',
            title: 'مدينة نجران',
            subtitle: 'أخدود التاريخ وقصور الطين والضيافة',
            regionName: 'منطقة نجران',
            subRegionId: 'najran',
            count: getDynamicHallCount('نجران', 'نجران', 22),
            query: 'نجران',
            city: 'نجران',
            image: 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'namas-city',
            title: 'محافظة النماص',
            subtitle: 'مدينة الضباب وقصور المناسبات الطبيعية',
            regionName: 'منطقة عسير',
            subRegionId: 'asir',
            count: getDynamicHallCount('النماص', 'عسير', 14),
            query: 'عسير',
            city: 'النماص',
            image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'baljurashi-city',
            title: 'محافظة بلجرشي',
            subtitle: 'عروس الباحة وقاعات المناسبات الجبلية',
            regionName: 'منطقة الباحة',
            subRegionId: 'baha',
            count: getDynamicHallCount('بلجرشي', 'الباحة', 12),
            query: 'الباحة',
            city: 'بلجرشي',
            image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'sabya-city',
            title: 'محافظة صبيا',
            subtitle: 'حاضرة جازان وقصور الأفراح والضيافة',
            regionName: 'منطقة جازان',
            subRegionId: 'jizan',
            count: getDynamicHallCount('صبيا', 'جازان', 15),
            query: 'جازان',
            city: 'صبيا',
            image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'sharurah-city',
            title: 'محافظة شرورة',
            subtitle: 'عروس الربع الخالي وقاعات الاحتفالات',
            regionName: 'منطقة نجران',
            subRegionId: 'najran',
            count: getDynamicHallCount('شرورة', 'نجران', 10),
            query: 'نجران',
            city: 'شرورة',
            image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          },
          {
            id: 'abu-arish-city',
            title: 'محافظة أبو عريش',
            subtitle: 'واحات الفل وقاعات المناسبات',
            regionName: 'منطقة جازان',
            subRegionId: 'jizan',
            count: getDynamicHallCount('أبو عريش', 'جازان', 11),
            query: 'جازان',
            city: 'أبو عريش',
            image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1000&q=80',
            layout: 'grid',
          }
        ]
      }
    };
  }, [hallsList]);

  // Current active tiles based on drill level:
  // Level 1: 'zones' -> 5 Major Geographic Zones
  // Level 2: 'regions' -> Administrative Regions of the selected Geo Zone
  // Level 3: 'cities' -> Cities/Governorates of the selected Admin Region
  const hierarchicalMetroTiles = useMemo(() => {
    if (drillLevel === 'zones') {
      return zoneDataMap.all.tiles;
    }

    const currentZone = (zoneDataMap as any)[selectedGeoZoneId] || zoneDataMap.central;

    if (drillLevel === 'regions') {
      return currentZone.adminRegions || [];
    }

    if (drillLevel === 'cities') {
      const allZoneCities = currentZone.tiles || [];
      if (!selectedAdminRegionId) return allZoneCities;
      return allZoneCities.filter((t: any) => t.subRegionId === selectedAdminRegionId);
    }

    return zoneDataMap.all.tiles;
  }, [drillLevel, selectedGeoZoneId, selectedAdminRegionId, zoneDataMap]);

  const totalMetroPages = Math.max(1, Math.ceil(hierarchicalMetroTiles.length / 5));

  // Current 5 tiles for the Metro Grid
  const currentTiles = useMemo(() => {
    const validPageIndex = Math.min(metroPageIndex, totalMetroPages - 1);
    const start = validPageIndex * 5;
    return hierarchicalMetroTiles.slice(start, start + 5);
  }, [hierarchicalMetroTiles, metroPageIndex, totalMetroPages]);

  const handlePrevMetroTab = () => {
    if (metroPageIndex > 0) {
      setMetroPageIndex(prev => prev - 1);
    } else {
      setMetroPageIndex(totalMetroPages - 1);
    }
  };

  const handleNextMetroTab = () => {
    if (metroPageIndex < totalMetroPages - 1) {
      setMetroPageIndex(prev => prev + 1);
    } else {
      setMetroPageIndex(0);
    }
  };

  // Helper labels for current drill breadcrumb
  const currentZoneObject = (zoneDataMap as any)[selectedGeoZoneId];
  const currentAdminRegionObject = currentZoneObject?.adminRegions?.find((r: any) => r.id === selectedAdminRegionId);

  // Search widget state variables / متغيرات حالة شريط البحث
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  /**
   * حساب المدن المتاحة بناءً على المنطقة المحددة من مخزن البيانات
   * Dynamically compute available cities based on selected region from datastore
   */
  const availableCities = useMemo(() => {
    if (searchRegion) {
      const matched = regionsList.find((r: any) => r.name === searchRegion);
      if (matched && Array.isArray(matched.cities)) {
        return matched.cities;
      }
      return [];
    }
    // Flatten unique cities from all regions in the datastore
    const allCities = regionsList.flatMap((r: any) => r.cities || []);
    return Array.from(new Set(allCities));
  }, [searchRegion, regionsList]);

  /**
   * التعامل مع تغيير المنطقة المحددة مع مسح اسم المدينة تلقائياً إن لم تكن تابعة للمنطقة الجديدة
   * Handle Region selection with automatic city clearing if mismatched
   */
  const handleRegionChange = (newRegion: string) => {
    setSearchRegion(newRegion);
    if (newRegion) {
      const matched = regionsList.find((r: any) => r.name === newRegion);
      const cities = matched?.cities || [];
      if (searchCity && !cities.includes(searchCity)) {
        setSearchCity('');
      }
    }
  };

  /**
   * التعامل مع اختيار المدينة مع تحديد المنطقة الأم تلقائياً
   * Handle City selection with automatic parent region detection
   */
  const handleCityChange = (newCity: string) => {
    setSearchCity(newCity);
    if (newCity) {
      const parentRegion = regionsList.find((r: any) => Array.isArray(r.cities) && r.cities.includes(newCity));
      if (parentRegion) {
        setSearchRegion(parentRegion.name);
      }
    }
  };

  const [isProviderChatOpen, setIsProviderChatOpen] = useState(false);
  const [chatData, setChatData] = useState({ providerName: '', hallName: '' });
  
  const [providerModal, setProviderModal] = useState<{isOpen: boolean, type: 'login' | 'upgrade' | null}>({isOpen: false, type: null});
  const [selectedPeriod, setSelectedPeriod] = useState<'morning' | 'evening' | 'fullday'>('evening');
  const [nearMeOnly, setNearMeOnly] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const handleGpsFilter = () => {
    if (nearMeOnly) {
      setNearMeOnly(false);
      setGpsError(null);
      return;
    }
    
    setGpsLoading(true);
    setGpsError(null);
    
    if (!navigator.geolocation) {
      setGpsError('متصفحك لا يدعم تحديد الموقع الجغرافي.');
      setGpsLoading(false);
      setNearMeOnly(true);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        setNearMeOnly(true);
      },
      (error) => {
        console.warn("GPS lookup failed, fallback to simulated proximity:", error);
        setGpsError('يرجى تفعيل الـ GPS وإعطاء الإذن لتحديد القاعات الأقرب لموقعك.');
        setGpsLoading(false);
        setNearMeOnly(true);
      },
      { timeout: 5000 }
    );
  };

  const openProviderChat = (e: React.MouseEvent, providerName: string, hallName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatData({ providerName, hallName });
    setIsProviderChatOpen(true);
  };
  
  const handleAddHallClick = () => {
    const isAuthenticated = localStorage.getItem('IS_AUTHENTICATED') === 'true';
    if (!isAuthenticated) {
      setProviderModal({isOpen: true, type: 'login'});
      return;
    }
    const currentUserStr = localStorage.getItem('currentUser');
    let role = 'عميل';
    if (currentUserStr) {
      try {
        const user = JSON.parse(currentUserStr);
        role = user.role || 'عميل';
      } catch {}
    }

    if (role === 'مزود' || role === 'موظف' || role === 'admin') {
      navigate('/dashboard?tab=halls');
    } else {
      setProviderModal({isOpen: true, type: 'upgrade'});
    }
  };

  const [successPartners, setSuccessPartners] = useState<{
    id: number;
    name: string;
    type?: string;
    packageName?: string;
    rating?: number;
    bookingsCount?: number;
  }[]>([]);

  React.useEffect(() => {
    const saved = localStorage.getItem('providersData');
    let parsedList = [];
    if (saved) {
      try {
        parsedList = JSON.parse(saved);
      } catch (e) {}
    }
    
    if (!parsedList || parsedList.length === 0) {
      parsedList = fallbackProviders || [];
    }

    if (parsedList && parsedList.length > 0) {
      const partners = parsedList.filter((p: any) => {
        // 1. Must be an organization (منشأة) and not an individual (فرد)
        const isOrg = p.type === 'منشأة';
        // 2. Subscribed to higher tiers (الباقة الاحترافية or باقة الأعمال)
        const isHigherTier = p.packageName === 'الباقة الاحترافية' || p.packageName === 'باقة الأعمال';
        // 3. Rating must be >= 4.5
        const hasHighRating = Number(p.rating || 0) >= 4.5;
        // 4. Bookings and service requests form a high percentage (bookingsCount >= 50)
        const hasHighBookings = Number(p.bookingsCount || 0) >= 50;
        // 5. Must not have disabled provider name visibility to customers
        const isVisible = isProviderNameVisible(p.name);

        return p.isSuccessfulPartner && isOrg && isHigherTier && hasHighRating && hasHighBookings && isVisible;
      }).map((p: any) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        packageName: p.packageName,
        rating: p.rating,
        bookingsCount: p.bookingsCount
      }));

      // Sort descending by bookings count
      partners.sort((a, b) => (b.bookingsCount || 0) - (a.bookingsCount || 0));

      // Limit to top 30 partners
      const top30Partners = partners.slice(0, 30);
      setSuccessPartners(top30Partners);
    }
  }, []);

  const approvedHalls = hallsList.filter(h => h.status === 'approved' && h.activationStatus !== 'موقوف');
  const featuredHalls = (() => {
    const list = approvedHalls.filter(h => h.featured);
    const criteria = localStorage.getItem('SETTINGS_FEATURED_CRITERIA') || 'rating';
    
    const savedProvidersStr = localStorage.getItem('providersData');
    let provList = [];
    if (savedProvidersStr) {
      try {
        provList = JSON.parse(savedProvidersStr);
      } catch (e) {}
    }
    if (!provList || provList.length === 0) {
      provList = fallbackProviders || [];
    }

    list.sort((a, b) => {
      const criteriaList = criteria.split(',').filter(Boolean);
      for (const crit of criteriaList) {
        let diff = 0;
        if (crit === 'rating') {
          diff = (b.rating || 0) - (a.rating || 0);
        } else if (crit === 'bookings') {
          const provA = provList.find((p: any) => p.name === a.provider);
          const provB = provList.find((p: any) => p.name === b.provider);
          diff = (provB?.bookingsCount || 0) - (provA?.bookingsCount || 0);
        } else if (crit === 'package') {
          const provA = provList.find((p: any) => p.name === a.provider);
          const provB = provList.find((p: any) => p.name === b.provider);
          const getPkgRank = (pkg: string | undefined | null) => {
            if (!pkg) return 0;
            if (pkg.includes('الاحترافية') || pkg.includes('التميز')) return 3;
            if (pkg.includes('الأعمال')) return 2;
            if (pkg.includes('الأساسية')) return 1;
            return 0;
          };
          diff = getPkgRank(provB?.packageName) - getPkgRank(provA?.packageName);
        } else if (crit === 'level') {
          const provA = provList.find((p: any) => p.name === a.provider);
          const provB = provList.find((p: any) => p.name === b.provider);
          const getLvlRank = (prov: any) => {
            if (!prov) return 0;
            const levelName = getPartnerLevel(prov.bookingsCount, prov.rating, true, prov.packageName, prov.packageDuration)?.name;
            if (!levelName) return 0;
            if (levelName === 'شريك استراتيجي') return 7;
            if (levelName === 'الشريك الماسي') return 6;
            if (levelName === 'شريك النخبة') return 5;
            if (levelName === 'شريك ذهبي') return 4;
            if (levelName === 'شريك مميز') return 3;
            if (levelName === 'شريك صاعد') return 2;
            if (levelName === 'شريك معتمد') return 1;
            return 0;
          };
          diff = getLvlRank(provB) - getLvlRank(provA);
        }
        if (diff !== 0) {
          return diff;
        }
      }
      return 0;
    });

    let showcaseHalls = [...list];
    if (showcaseHalls.length < 20) {
      const remaining = approvedHalls.filter(h => !showcaseHalls.some(f => f.id === h.id));
      showcaseHalls = [...showcaseHalls, ...remaining];
    }
    return showcaseHalls.slice(0, 20);
  })();

  const featuredScrollRef = useRef<HTMLDivElement>(null);
  const scrollFeaturedHalls = (direction: 'left' | 'right') => {
    if (featuredScrollRef.current) {
      const scrollAmount = featuredScrollRef.current.clientWidth * 0.9;
      // In RTL, left arrow moves viewport left (forward in content), right arrow moves viewport right (back)
      featuredScrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const latestHalls = [...approvedHalls].reverse().slice(0, 4);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (searchRegion) params.append('regionFilter', searchRegion);
    if (searchCity) params.append('city', searchCity);
    if (searchCity) params.append('region', searchCity);
    if (searchCategory) params.append('category', searchCategory);
    navigate(`/explore?${params.toString()}`);
  };

  const [activeAds, setActiveAds] = useState<any[]>([]);
  const [platformData, setPlatformData] = useState<any>({});
  const [currentSlide, setCurrentSlide] = useState(0);

  // Dynamic Advertising / Highlight Slides based on configured Hero & Smart Monetization Mode
  const slides = useMemo(() => {
    const mode = platformData.heroMode || 'static';
    const list = [];

    // 1. Static Fallback Slide helper
    const getStaticFallback = () => {
      const fb = platformData.heroFallback || {};
      return {
        image: fb.image || platformData.coverUrl || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
        title: fb.title || "لحظاتك السعيدة تبدأ من ليلة",
        subtitle: fb.subtitle || "اكتشف واحجز أرقى القاعات والاستراحات لمناسباتك بكل سهولة",
        badge: "الرئيسية",
        buttonText: fb.buttonText || "استكشف القاعات",
        link: fb.buttonLink || "/explore"
      };
    };

    if (mode === 'static') {
      list.push(getStaticFallback());
    } else if (mode === 'controlled') {
      // Admin Controlled Slider (Proposal 1)
      const activeSlides = (platformData.heroSlides || [])
        .filter((s: any) => s.status === 'active')
        .sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

      if (activeSlides.length > 0) {
        activeSlides.forEach((s: any) => {
          list.push({
            image: s.image,
            title: s.title,
            subtitle: s.subtitle,
            badge: s.badge || "عرض مميز",
            buttonText: s.buttonText || "تفاصيل العرض",
            link: s.buttonLink || "#"
          });
        });
      } else {
        list.push(getStaticFallback());
      }
    } else if (mode === 'spotlight') {
      // Spotlight Package
      const selectedHallsIds = platformData.spotlightConfig?.selectedHalls || [];
      const titleTemplate = platformData.spotlightConfig?.titleTemplate || "قاعة مميزة: {hallName}";
      const subtitleTemplate = platformData.spotlightConfig?.subtitleTemplate || "احجز مباشرة بخصومات حصرية من المنصة";
      
      const matchedHalls = hallsList.filter((h: any) => selectedHallsIds.includes(h.id));
      
      if (matchedHalls.length > 0) {
        matchedHalls.forEach((hall: any) => {
          list.push({
            image: hall.image || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
            title: titleTemplate.replace(/{hallName}/g, hall.name),
            subtitle: subtitleTemplate.replace(/{hallName}/g, hall.name),
            badge: "باقة الرعاية الفاخرة 👑",
            buttonText: "احجز الآن",
            link: `/hall/${hall.id}`
          });
        });
      } else {
        list.push(getStaticFallback());
      }
    } else if (mode === 'takeover') {
      // Seasonal Brand Takeover
      const tc = platformData.takeoverConfig || {};
      if (tc.title || tc.image) {
        list.push({
          image: tc.image || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
          title: tc.title || "موسم المناسبات الكبرى",
          subtitle: tc.subtitle || "عروض وخصومات مميزة بالتعاون مع أرقى العلامات التجارية",
          badge: tc.brandName || "استحواذ موسمي",
          buttonText: tc.buttonText || "تصفح العرض",
          link: tc.buttonLink || "#"
        });
      } else {
        list.push(getStaticFallback());
      }
    } else if (mode === 'bidding') {
      // Weekend Bidding System
      const bc = platformData.biddingConfig || {};
      const winningHall = hallsList.find((h: any) => String(h.id) === String(bc.winningHallId));
      if (winningHall) {
        const titleStr = (bc.title || "قاعة الويكيند الذهبية: {hallName}").replace(/{hallName}/g, winningHall.name);
        const subtitleStr = (bc.subtitle || "احجز القاعة الفائزة بمزاد الويكيند التنافسي").replace(/{hallName}/g, winningHall.name);
        list.push({
          image: winningHall.image || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
          title: titleStr,
          subtitle: subtitleStr,
          badge: "الفائز بمزاد الويكيند 🏆",
          buttonText: bc.buttonText || "تفاصيل الحجز",
          link: `/hall/${winningHall.id}`
        });
      } else {
        list.push(getStaticFallback());
      }
    } else if (mode === 'services') {
      // Upselling Auxiliary Services
      const sc = platformData.servicesConfig || {};
      if (sc.title || sc.image) {
        list.push({
          image: sc.image || "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80",
          title: sc.title || "باقة الخدمات المساندة المتكاملة",
          subtitle: sc.subtitle || "نوفر لك أفضل مصوري الفوتوغراف وضيافة الكوشة والسيارات الفاخرة",
          badge: "خدمات لوجستية مساندة 🏷️",
          buttonText: sc.buttonText || "اطلب الخدمة الآن",
          link: sc.buttonLink || "/explore?category=services"
        });
      } else {
        list.push(getStaticFallback());
      }
    }

    // fallback if somehow empty list
    if (list.length === 0) {
      list.push(getStaticFallback());
    }

    return list;
  }, [platformData, hallsList]);

  useEffect(() => {
    if (slides.length <= 1) return;
    const mode = platformData.heroMode || 'static';
    const intervalSeconds = (mode === 'spotlight' ? (platformData.spotlightConfig?.intervalSeconds || 5) : 6);
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, intervalSeconds * 1000);
    return () => clearInterval(interval);
  }, [slides.length, platformData.heroMode, platformData.spotlightConfig?.intervalSeconds]);

  useEffect(() => {
    try {
      const platformStored = localStorage.getItem('PLATFORM_DATA');
      if (platformStored) {
        setPlatformData(JSON.parse(platformStored));
      }
    } catch {}

    const handleSettingsUpdate = () => {
      try {
        const platformStored = localStorage.getItem('PLATFORM_DATA');
        if (platformStored) {
          setPlatformData(JSON.parse(platformStored));
        }
        const storedRegions = localStorage.getItem('SYSTEM_REGIONS');
        if (storedRegions) {
          setRegionsList(JSON.parse(storedRegions));
        }
      } catch {}
    };

    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    window.addEventListener('datastoreUpdated', handleSettingsUpdate);
    window.addEventListener('storage', handleSettingsUpdate);
    return () => {
      window.removeEventListener('settingsUpdated', handleSettingsUpdate);
      window.removeEventListener('datastoreUpdated', handleSettingsUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
    };
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 font-sans" dir="rtl">
      
      <Header />

      <AdBanner placement="شريط الإعلان العلوي" layout="banner" className="border-none" />

      {/* 3. Dynamic Advertising & Hero Slider */}
      <section className="relative h-[580px] flex items-center justify-center overflow-hidden">
        {/* Background Slider */}
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide}
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img 
                src={slides[currentSlide].image} 
                alt={slides[currentSlide].title} 
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-blue-950/80 via-slate-900/40 to-slate-950/50"></div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Left/Right Control Arrows */}
        <button 
          onClick={() => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)}
          className="absolute left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 border border-white/10 cursor-pointer"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <button 
          onClick={() => setCurrentSlide((prev) => (prev + 1) % slides.length)}
          className="absolute right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 text-white flex items-center justify-center backdrop-blur-sm transition-all hover:scale-105 border border-white/10 cursor-pointer"
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Indicator Dots */}
        <div className="absolute bottom-28 z-20 flex gap-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2 rounded-full transition-all duration-300 cursor-pointer ${i === currentSlide ? 'w-8 bg-amber-400' : 'w-2 bg-white/40'}`}
            />
          ))}
        </div>

        {/* Interactive Content & Search */}
        <div className="relative z-10 w-full max-w-[1280px] mx-auto px-4 mt-[-40px]">
          <div className="text-center mb-6 max-w-3xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentSlide}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.5 }}
                className="flex flex-col items-center"
              >
                <span className="bg-amber-400/20 text-amber-300 text-xs font-black px-3 py-1 rounded-full border border-amber-400/30 mb-3 backdrop-blur-sm tracking-wide">
                  {slides[currentSlide].badge}
                </span>
                <h1 className="text-[34px] md:text-[50px] font-black text-white mb-3 leading-tight drop-shadow-xl font-sans tracking-tight">
                  {slides[currentSlide].title}
                </h1>
                <p className="text-[16px] md:text-[19px] font-bold text-slate-200 mb-4 max-w-2xl drop-shadow-md leading-relaxed font-sans">
                  {slides[currentSlide].subtitle}
                </p>
                {slides[currentSlide].buttonText && (
                  <div className="mt-2 mb-4">
                    {slides[currentSlide].link && (slides[currentSlide].link.startsWith('http') || slides[currentSlide].link.startsWith('#')) ? (
                      <a 
                        href={slides[currentSlide].link} 
                        target={slides[currentSlide].link.startsWith('http') ? "_blank" : undefined}
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all hover:scale-105 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        {slides[currentSlide].buttonText}
                      </a>
                    ) : (
                      <Link 
                        to={slides[currentSlide].link || '/explore'} 
                        className="inline-flex items-center gap-2 px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs transition-all hover:scale-105 shadow-lg shadow-amber-500/20 cursor-pointer"
                      >
                        {slides[currentSlide].buttonText}
                      </Link>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Search Box - Full Width matching Hero Slider Banner */}
          <div className="bg-white/95 backdrop-blur-md rounded-2xl p-4 md:p-6 shadow-2xl border border-white/20 w-full mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-center">
              {/* Search input */}
              <div className="relative">
                <Search className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="اسم القاعة أو الاستراحة..." 
                  className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-sm font-sans" 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Dynamic Region Select (المناطق من مخزن البيانات) */}
              <div className="relative">
                <Map className="absolute right-3 top-3.5 w-5 h-5 text-amber-500" />
                <select 
                  className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-700 appearance-none bg-white text-sm font-sans font-medium"
                  value={searchRegion}
                  onChange={(e) => handleRegionChange(e.target.value)}
                >
                  <option value="">جميع المناطق ({regionsList.length})</option>
                  {regionsList.map((reg: any) => (
                    <option key={reg.id || reg.name} value={reg.name}>
                      {reg.name} ({reg.cities?.length || 0} مدينة)
                    </option>
                  ))}
                </select>
              </div>

              {/* Dynamic City Select (مرتبطة ديناميكياً بالمنطقة) */}
              <div className="relative">
                <MapPin className="absolute right-3 top-3.5 w-5 h-5 text-blue-600" />
                <select 
                  className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-700 appearance-none bg-white text-sm font-sans font-medium"
                  value={searchCity}
                  onChange={(e) => handleCityChange(e.target.value)}
                >
                  <option value="">
                    {searchRegion ? `جميع مدن ${searchRegion} (${availableCities.length})` : 'جميع المدن'}
                  </option>
                  {availableCities.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Category Select */}
              <div className="relative">
                <Crown className="absolute right-3 top-3.5 w-5 h-5 text-slate-400" />
                <select 
                  className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all text-slate-700 appearance-none bg-white text-sm font-sans font-medium"
                  value={searchCategory}
                  onChange={(e) => setSearchCategory(e.target.value)}
                >
                  <option value="">نوع المكان (الكل)</option>
                  <option value="قاعة أفراح">قاعة أفراح</option>
                  <option value="استراحات">استراحات</option>
                  <option value="شاليه">شاليه</option>
                  <option value="منتجع">منتجع</option>
                </select>
              </div>

              {/* Search Button */}
              <button 
                onClick={handleSearch}
                className="bg-blue-950 hover:bg-blue-900 text-white py-3 px-4 rounded-xl font-bold text-sm shadow-md hover:shadow-xl transition-all cursor-pointer font-sans flex items-center justify-center gap-2 group w-full"
              >
                <Search className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>ابحث الآن</span>
              </button>
            </div>
          </div>
        </div>

        {/* Features Strip - Absolute Bottom with gradient fade-out */}
        <div className="absolute bottom-0 left-0 right-0 pt-20 pb-4 bg-gradient-to-t from-blue-950 to-transparent">
          <div className="max-w-[1280px] mx-auto px-4 md:px-6">
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
              {[
                { icon: ShieldCheck, text: "دفع آمن" },
                { icon: Map, text: "أماكن متعددة" },
                { icon: Smartphone, text: "حجز سهل" },
                { icon: Percent, text: "أسعار شاملة" },
                { icon: ThumbsUp, text: "الوثوقية" },
                { icon: Headset, text: "مركز دعم" },
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-white/90">
                  <feature.icon className="w-5 h-5 text-amber-400" />
                  <span className="text-[18px] font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 4. Featured Halls - Ultra Compact Asymmetric Bento Grid (Under 720px Total Height, All 7 Cards Visible, No Amenities) */}
      <section className="py-5 sm:py-6 bg-slate-50 border-b border-slate-200/80">
        <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6">
          
          {/* Header Row: Compact Header with Sparkle and Explore Map Link */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-3 sm:mb-3.5">
            {/* Right: Title */}
            <div className="text-right">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 fill-amber-400 shrink-0" />
                <h2 className="text-lg sm:text-xl font-black text-blue-950 tracking-tight">
                  أبرز القاعات
                </h2>
              </div>
              <p className="text-slate-500 text-[11px] font-medium">
                اكتشف أرقى القاعات والاستراحات والمنتجعات المناسبة لكل مناسباتك
              </p>
            </div>

            {/* Left: Map Explorer Button */}
            <Link
              to="/explore?view=map"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-950 hover:bg-blue-900 text-white text-[11px] font-bold shadow-xs hover:shadow-sm transition-all hover:scale-[1.02] active:scale-95 border border-blue-900"
            >
              <span>استكشاف خريطة القاعات</span>
              <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
            </Link>
          </div>

          {/* Bento Grid Container */}
          {(() => {
            if (!featuredHalls || featuredHalls.length === 0) {
              return (
                <div className="bg-white rounded-xl p-6 text-center border border-slate-200 shadow-xs text-slate-500">
                  <p className="font-bold text-xs">لا توجد قاعات متاحة للعرض حالياً</p>
                </div>
              );
            }

            // Total available halls for pagination in Bento Grid
            const totalHallsCount = featuredHalls.length;
            const bentoPageSize = 8;
            const currentBentoPage = Math.floor(bentoGridHallIndex / bentoPageSize);
            const totalBentoPages = Math.max(1, Math.ceil(totalHallsCount / bentoPageSize));

            // Up to 8 Featured Halls for the Current Bento Composition
            const getHallAt = (offset: number) => {
              if (totalHallsCount === 0) return null;
              const idx = (bentoGridHallIndex + offset) % totalHallsCount;
              return featuredHalls[idx] || featuredHalls[0];
            };

            const h1 = getHallAt(0);
            const h2 = getHallAt(1);
            const h3 = getHallAt(2); // Tall Right Portrait Hall
            const h4 = getHallAt(3);
            const h4_extra = getHallAt(7); // Extra Middle Card between h4 & h5
            const h5 = getHallAt(4);
            const h6 = getHallAt(5);
            const h7 = getHallAt(6);

            const handlePrevBentoHalls = () => {
              setBentoGridHallIndex(prev => {
                if (prev <= 0) {
                  return Math.max(0, (totalBentoPages - 1) * bentoPageSize);
                }
                return Math.max(0, prev - bentoPageSize);
              });
            };

            const handleNextBentoHalls = () => {
              setBentoGridHallIndex(prev => {
                if (prev + bentoPageSize >= totalHallsCount) {
                  return 0;
                }
                return prev + bentoPageSize;
              });
            };

            const getPrices = (hall: any) => {
              const base = Number(hall?.price) || 2000;
              const morning = hall?.morningPrice || Math.floor(base * 0.6);
              const evening = hall?.nightPrice || Math.floor(base * 0.85);
              const fullDay = hall?.fullDayPrice || Math.floor(base * 1.35);
              return { morning, evening, fullDay };
            };

            const getRatingCount = (hall: any) => {
              const seed = (String(hall?.name || '').length * 37) % 350 + 120;
              return hall?.reviewsCount || seed;
            };

            return (
              <div className="relative space-y-2.5 select-none">
                
                {/* Floating Navigation Controls for Bento Grid (White Circular Buttons without Text) */}
                {totalHallsCount > bentoPageSize && (
                  <>
                    {/* Right Floating Button (السابق في RTL) */}
                    <button
                      onClick={handlePrevBentoHalls}
                      aria-label="السابق"
                      className="absolute -right-3 sm:-right-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
                    </button>

                    {/* Left Floating Button (التالي في RTL) */}
                    <button
                      onClick={handleNextBentoHalls}
                      aria-label="التالي"
                      className="absolute -left-3 sm:-left-5 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-lg hover:shadow-xl border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
                    </button>
                  </>
                )}
                
                {/* Upper Grid: 1 Tall Card on Right (3 cols on lg / h3 in RTL) + Left/Middle Cards Area (9 cols on lg) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
                  
                  {/* Right Block: Tall Grand Portrait Hall Card (Spans 3 Cols on lg / h3 in RTL) - Full Overlay Style */}
                  {h3 && (() => {
                    const p = getPrices(h3);
                    const rCount = getRatingCount(h3);
                    return (
                      <div 
                        onClick={() => navigate(`/hall/${h3.id}`)}
                        className="lg:col-span-3 group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[340px] sm:min-h-[360px] lg:min-h-[370px]"
                      >
                        {/* 100% Background Image */}
                        <img 
                          src={h3.image} 
                          alt={h3.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          referrerPolicy="no-referrer"
                        />

                        {/* Top Dark Scrim for Rating Contrast */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />

                        {/* 40% Transparent White Gradient Overlay (تدرج أبيض شفاف يمتد إلى 40% من الأسفل) */}
                        <div className="absolute inset-x-0 bottom-0 h-[48%] sm:h-[42%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                        {/* Top Rating Badge */}
                        <div className="relative z-10 p-2.5 flex items-center justify-between">
                          <div className="bg-black/60 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[11px] font-black text-white flex items-center gap-1 shadow-sm border border-white/20">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                            <span>{h3.rating || '4.9'}</span>
                            <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                          </div>
                        </div>

                        {/* Bottom Content Area */}
                        <div className="relative z-10 p-2.5 flex flex-col justify-end">
                          {/* Hall Name with crisp grey outline */}
                          <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                            <h3 
                              style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                              className="text-lg sm:text-xl font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                            >
                              {h3.name}
                            </h3>
                          </div>

                          {/* Location & Capacity with crisp grey outline */}
                          <div className="flex items-center justify-between text-white text-[15px] font-bold mb-2 drop-shadow-md">
                            <div 
                              style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                              className="flex items-center gap-1 truncate max-w-[60%]"
                            >
                              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="truncate">{h3.city || 'الدمام'}</span>
                            </div>
                            <div 
                              style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                              className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                            >
                              <Users className="w-4 h-4 text-white/90 shrink-0" />
                              <span>حتى {h3.capacity || '1000'}</span>
                            </div>
                          </div>

                          {/* Bottom Pricing (White Background) & Action */}
                          <div>
                            <div className="grid grid-cols-3 divide-x divide-x-reverse divide-slate-200 text-center py-1.5 px-2 bg-white rounded-lg border border-slate-200 shadow-xs mb-1.5">
                              <div>
                                <span className="block text-[8.5px] text-slate-500 font-bold">24 س</span>
                                <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="block text-[8.5px] text-slate-500 font-bold">مساء</span>
                                <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()}</span>
                              </div>
                              <div>
                                <span className="block text-[8.5px] text-slate-500 font-bold">صباح</span>
                                <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.morning.toLocaleString()}</span>
                              </div>
                            </div>

                            <Link
                              to={`/hall/${h3.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="w-full inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs"
                            >
                              <span>عرض التفاصيل</span>
                              <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-1 transition-transform" />
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Left & Middle Cards Grid (Spans 9 Cols on Desktop) */}
                  <div className="lg:col-span-9 flex flex-col gap-2.5">
                    
                    {/* Top Sub-Row: h1 (5 cols) + h2 (7 cols) - Full Overlay Style */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                      
                      {/* Card 1 (Top-Left / h1) */}
                      {h1 && (() => {
                        const p = getPrices(h1);
                        const rCount = getRatingCount(h1);
                        return (
                          <div 
                            onClick={() => navigate(`/hall/${h1.id}`)}
                            className="md:col-span-5 group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[175px]"
                          >
                            <img 
                              src={h1.image} 
                              alt={h1.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[44%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                            <div className="relative z-10 p-2 flex items-center justify-between">
                              <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-black text-white flex items-center gap-1 shadow-sm border border-white/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{h1.rating || '4.9'}</span>
                                <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                              </div>
                            </div>

                            <div className="relative z-10 p-2.5 pt-0 flex flex-col justify-end">
                              <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                                <h3 
                                  style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                                  className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                                >
                                  {h1.name}
                                </h3>
                              </div>

                              <div className="flex items-center justify-between text-white text-[15px] font-bold mb-1.5 drop-shadow-md">
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 truncate max-w-[58%]"
                                >
                                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="truncate">{h1.city || 'الرياض'}</span>
                                </div>
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                                >
                                  <Users className="w-4 h-4 text-white/90 shrink-0" />
                                  <span>حتى {h1.capacity || '800'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1">
                                <Link
                                  to={`/hall/${h1.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs shrink-0"
                                >
                                  <span>التفاصيل</span>
                                  <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                                </Link>

                                <div className="flex items-center gap-1.5 text-center bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">24 س</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()}</span>
                                  </div>
                                  <div className="w-px h-3.5 bg-slate-200" />
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">مساء</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()}</span>
                                  </div>
                                  <div className="w-px h-3.5 bg-slate-200" />
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">صباح</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.morning.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Card 2 (Top-Right / h2) */}
                      {h2 && (() => {
                        const p = getPrices(h2);
                        const rCount = getRatingCount(h2);
                        return (
                          <div 
                            onClick={() => navigate(`/hall/${h2.id}`)}
                            className="md:col-span-7 group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[175px]"
                          >
                            <img 
                              src={h2.image} 
                              alt={h2.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[44%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                            <div className="relative z-10 p-2 flex items-center justify-between">
                              <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-black text-white flex items-center gap-1 shadow-sm border border-white/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{h2.rating || '4.8'}</span>
                                <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                              </div>
                            </div>

                            <div className="relative z-10 p-2.5 pt-0 flex flex-col justify-end">
                              <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                                <h3 
                                  style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                                  className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                                >
                                  {h2.name}
                                </h3>
                              </div>

                              <div className="flex items-center justify-between text-white text-[15px] font-bold mb-1.5 drop-shadow-md">
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 truncate max-w-[62%]"
                                >
                                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="truncate">{h2.city || 'جدة'} - {h2.location || 'حي الشاطئ'}</span>
                                </div>
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                                >
                                  <Users className="w-4 h-4 text-white/90 shrink-0" />
                                  <span>حتى {h2.capacity || '600'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1.5">
                                <Link
                                  to={`/hall/${h2.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs"
                                >
                                  <span>التفاصيل</span>
                                  <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                                </Link>

                                <div className="flex items-center gap-2 text-center bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                                  <div>
                                    <span className="block text-[9px] text-slate-500 font-bold">24 ساعة</span>
                                    <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                                  </div>
                                  <div className="w-px h-4 bg-slate-200" />
                                  <div>
                                    <span className="block text-[9px] text-slate-500 font-bold">مسائية</span>
                                    <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                                  </div>
                                  <div className="w-px h-4 bg-slate-200" />
                                  <div>
                                    <span className="block text-[9px] text-slate-500 font-bold">صباحية</span>
                                    <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.morning.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Middle Sub-Row: 3 Cards (h4 on left + h4_extra in middle + h5 on right) - Full Overlay Style */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      
                      {/* Card 4 (Mid-Left / h4) */}
                      {h4 && (() => {
                        const p = getPrices(h4);
                        const rCount = getRatingCount(h4);
                        return (
                          <div 
                            onClick={() => navigate(`/hall/${h4.id}`)}
                            className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[175px]"
                          >
                            <img 
                              src={h4.image} 
                              alt={h4.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[44%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                            <div className="relative z-10 p-2 flex items-center justify-between">
                              <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-black text-white flex items-center gap-1 shadow-sm border border-white/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{h4.rating || '4.7'}</span>
                                <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                              </div>
                            </div>

                            <div className="relative z-10 p-2.5 pt-0 flex flex-col justify-end">
                              <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                                <h3 
                                  style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                                  className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                                >
                                  {h4.name}
                                </h3>
                              </div>

                              <div className="flex items-center justify-between text-white text-[15px] font-bold mb-1.5 drop-shadow-md">
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 truncate max-w-[58%]"
                                >
                                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="truncate">{h4.city || 'الرياض'}</span>
                                </div>
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                                >
                                  <Users className="w-4 h-4 text-white/90 shrink-0" />
                                  <span>حتى {h4.capacity || '300'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1">
                                <Link
                                  to={`/hall/${h4.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs shrink-0"
                                >
                                  <span>التفاصيل</span>
                                  <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                                </Link>

                                <div className="flex items-center gap-1.5 text-center bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">24 س</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()}</span>
                                  </div>
                                  <div className="w-px h-3.5 bg-slate-200" />
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">مساء</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Card Added Between h4 and h5 (Mid-Center / h4_extra) */}
                      {h4_extra && (() => {
                        const p = getPrices(h4_extra);
                        const rCount = getRatingCount(h4_extra);
                        return (
                          <div 
                            onClick={() => navigate(`/hall/${h4_extra.id}`)}
                            className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[175px]"
                          >
                            <img 
                              src={h4_extra.image} 
                              alt={h4_extra.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[44%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                            <div className="relative z-10 p-2 flex items-center justify-between">
                              <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-black text-white flex items-center gap-1 shadow-sm border border-white/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{h4_extra.rating || '4.9'}</span>
                                <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                              </div>
                            </div>

                            <div className="relative z-10 p-2.5 pt-0 flex flex-col justify-end">
                              <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                                <h3 
                                  style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                                  className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                                >
                                  {h4_extra.name}
                                </h3>
                              </div>

                              <div className="flex items-center justify-between text-white text-[15px] font-bold mb-1.5 drop-shadow-md">
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 truncate max-w-[58%]"
                                >
                                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="truncate">{h4_extra.city || 'الدمام'}</span>
                                </div>
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                                >
                                  <Users className="w-4 h-4 text-white/90 shrink-0" />
                                  <span>حتى {h4_extra.capacity || '500'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1">
                                <Link
                                  to={`/hall/${h4_extra.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs shrink-0"
                                >
                                  <span>التفاصيل</span>
                                  <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                                </Link>

                                <div className="flex items-center gap-1.5 text-center bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">24 س</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()}</span>
                                  </div>
                                  <div className="w-px h-3.5 bg-slate-200" />
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">مساء</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Card 5 (Mid-Right / h5) */}
                      {h5 && (() => {
                        const p = getPrices(h5);
                        const rCount = getRatingCount(h5);
                        return (
                          <div 
                            onClick={() => navigate(`/hall/${h5.id}`)}
                            className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[175px]"
                          >
                            <img 
                              src={h5.image} 
                              alt={h5.name}
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                            <div className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[44%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                            <div className="relative z-10 p-2 flex items-center justify-between">
                              <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[11px] font-black text-white flex items-center gap-1 shadow-sm border border-white/20">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span>{h5.rating || '4.8'}</span>
                                <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                              </div>
                            </div>

                            <div className="relative z-10 p-2.5 pt-0 flex flex-col justify-end">
                              <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                                <h3 
                                  style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                                  className="text-sm sm:text-base font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                                >
                                  {h5.name}
                                </h3>
                              </div>

                              <div className="flex items-center justify-between text-white text-[15px] font-bold mb-1.5 drop-shadow-md">
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 truncate max-w-[58%]"
                                >
                                  <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                                  <span className="truncate">{h5.city || 'الخبر'}</span>
                                </div>
                                <div 
                                  style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                                  className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                                >
                                  <Users className="w-4 h-4 text-white/90 shrink-0" />
                                  <span>حتى {h5.capacity || '700'}</span>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-1">
                                <Link
                                  to={`/hall/${h5.id}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs shrink-0"
                                >
                                  <span>التفاصيل</span>
                                  <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                                </Link>

                                <div className="flex items-center gap-1.5 text-center bg-white px-1.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">24 س</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()}</span>
                                  </div>
                                  <div className="w-px h-3.5 bg-slate-200" />
                                  <div>
                                    <span className="block text-[8.5px] text-slate-500 font-bold">مساء</span>
                                    <span className="text-[11px] sm:text-xs font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                  </div>
                </div>

                {/* Bottom Row: 2 Panoramic Bento Cards (Left Card 5 cols, Right Card 7 cols) - Full Overlay Style */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-2.5 items-stretch">
                  
                  {/* Bottom-Left Card (Spans 5 Cols on lg / h6) */}
                  {h6 && (() => {
                    const p = getPrices(h6);
                    const rCount = getRatingCount(h6);
                    return (
                      <div 
                        onClick={() => navigate(`/hall/${h6.id}`)}
                        className="lg:col-span-5 group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[175px]"
                      >
                        <img 
                          src={h6.image} 
                          alt={h6.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[44%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                        <div className="relative z-10 p-2 flex items-center justify-between">
                          <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black text-white flex items-center gap-0.5 shadow-sm border border-white/20">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{h6.rating || '4.6'}</span>
                            <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                          </div>
                        </div>

                        <div className="relative z-10 p-2.5 pt-0 flex flex-col justify-end">
                          <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                            <h3 
                              style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                              className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                            >
                              {h6.name}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-white text-[15px] font-bold mb-1.5 drop-shadow-md">
                            <div 
                              style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                              className="flex items-center gap-1 truncate max-w-[60%]"
                            >
                              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="truncate">{h6.city || 'الرياض'} - {h6.location || 'حي العليا'}</span>
                            </div>
                            <div 
                              style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                              className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                            >
                              <Users className="w-4 h-4 text-white/90 shrink-0" />
                              <span>حتى {h6.capacity || '450'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5">
                            <Link
                              to={`/hall/${h6.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs"
                            >
                              <span>التفاصيل</span>
                              <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                            </Link>

                            <div className="flex items-center gap-2 text-center bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                              <div>
                                <span className="block text-[9px] text-slate-500 font-bold">24 ساعة</span>
                                <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                              </div>
                              <div className="w-px h-4 bg-slate-200" />
                              <div>
                                <span className="block text-[9px] text-slate-500 font-bold">مسائية</span>
                                <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                              </div>
                              <div className="w-px h-4 bg-slate-200" />
                              <div>
                                <span className="block text-[9px] text-slate-500 font-bold">صباحية</span>
                                <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.morning.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Bottom-Right Panoramic Grand Card (Spans 7 Cols on lg / h7) */}
                  {h7 && (() => {
                    const p = getPrices(h7);
                    const rCount = getRatingCount(h7);
                    return (
                      <div 
                        onClick={() => navigate(`/hall/${h7.id}`)}
                        className="lg:col-span-7 group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between cursor-pointer hover:border-amber-300 min-h-[175px]"
                      >
                        <img 
                          src={h7.image} 
                          alt={h7.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute inset-x-0 bottom-0 h-[52%] sm:h-[44%] bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />

                        <div className="relative z-10 p-2 flex items-center justify-between">
                          <div className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-full text-[10px] font-black text-white flex items-center gap-0.5 shadow-sm border border-white/20">
                            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
                            <span>{h7.rating || '4.9'}</span>
                            <span className="text-white/70 font-bold text-[9px]">({rCount})</span>
                          </div>
                        </div>

                        <div className="relative z-10 p-2.5 pt-0 flex flex-col justify-end">
                          <div className="flex items-center gap-1.5 mb-1 drop-shadow-md">
                            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                            <h3 
                              style={{ textShadow: '0 0 1px #475569, -1px -1px 0 #475569, 1px -1px 0 #475569, -1px 1px 0 #475569, 1px 1px 0 #475569' }}
                              className="text-base sm:text-lg font-black text-white group-hover:text-amber-300 transition-colors line-clamp-1"
                            >
                              {h7.name}
                            </h3>
                          </div>

                          <div className="flex items-center justify-between text-white text-[15px] font-bold mb-1.5 drop-shadow-md">
                            <div 
                              style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                              className="flex items-center gap-1 truncate max-w-[65%]"
                            >
                              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="truncate">{h7.city || 'جدة'} - {h7.location || 'أبحر الشمالية'}</span>
                            </div>
                            <div 
                              style={{ textShadow: '0 0 1px #475569, -0.75px -0.75px 0 #475569, 0.75px -0.75px 0 #475569, -0.75px 0.75px 0 #475569, 0.75px 0.75px 0 #475569' }}
                              className="flex items-center gap-1 text-white font-black shrink-0 text-sm"
                            >
                              <Users className="w-4 h-4 text-white/90 shrink-0" />
                              <span>حتى {h7.capacity || '1200'}</span>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-1.5">
                            <Link
                              to={`/hall/${h7.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-800 hover:bg-amber-50 hover:border-amber-400 hover:text-amber-700 text-xs font-bold transition-colors shadow-xs"
                            >
                              <span>التفاصيل</span>
                              <ArrowLeft className="w-3 h-3 text-amber-500 group-hover:-translate-x-0.5 transition-transform" />
                            </Link>

                            <div className="flex items-center gap-2 text-center bg-white px-2.5 py-0.5 rounded-lg border border-slate-200 shadow-xs">
                              <div>
                                <span className="block text-[9px] text-slate-500 font-bold">24 ساعة</span>
                                <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.fullDay.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                              </div>
                              <div className="w-px h-4 bg-slate-200" />
                              <div>
                                <span className="block text-[9px] text-slate-500 font-bold">مسائية</span>
                                <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.evening.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                              </div>
                              <div className="w-px h-4 bg-slate-200" />
                              <div>
                                <span className="block text-[9px] text-slate-500 font-bold">صباحية</span>
                                <span className="text-xs sm:text-[13px] font-black text-blue-950 font-mono leading-tight">{p.morning.toLocaleString()} <span className="text-[9px] font-normal">ر.س</span></span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>

              </div>
            );
          })()}

        </div>
      </section>

      {/* 6. First Triple Ad section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdBanner placement="الإعلان العلوي الأول - الأيمن" layout="overlay" className="h-40" />
            <AdBanner placement="الإعلان العلوي الثاني - الأوسط" layout="overlay" className="h-40" />
            <AdBanner placement="الإعلان العلوي الثالث - الأيسر" layout="overlay" className="h-40" />
          </div>
        </div>
      </section>

      {/* 6. Discover Halls By Region - Metro UI Hierarchical Drill-Down Adaptive Layout */}
      <section className="py-12 bg-slate-50 border-y border-slate-200/80 relative overflow-hidden">
        {/* Header Container (Comfortably padded inside max container) */}
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6">
          
          {/* Header Row: Title & Emoji strictly on the RIGHT, Map Explorer Button strictly on the LEFT */}
          <div className="flex flex-row items-center justify-between gap-4 mb-2">
            {/* Right: Title & Emblem (First in DOM = Right side in RTL) */}
            <div className="flex items-center gap-2.5 text-right">
              <span className="text-amber-500 text-xl sm:text-2xl font-bold">✨</span>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-blue-950 tracking-tight">
                اكتشف القاعات حسب منطقتك
              </h2>
            </div>

            {/* Left Action: Map Explorer Button (Second in DOM = Left side in RTL) */}
            <div className="shrink-0">
              <Link 
                to="/map-explorer"
                className="inline-flex items-center gap-2.5 px-4 sm:px-6 py-2.5 sm:py-3 bg-[#0f1e36] hover:bg-[#182c4d] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md hover:shadow-xl transition-all duration-300 group cursor-pointer border border-slate-700/60 hover:-translate-y-0.5"
              >
                <MapPin className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                <span>استكشاف خريطة القاعات</span>
              </Link>
            </div>
          </div>

          {/* Subtitle / Descriptive motivation text strictly aligned to the RIGHT */}
          <p className="text-slate-500 text-xs sm:text-sm md:text-base mb-4 text-right font-medium max-w-4xl leading-relaxed">
            {drillLevel === 'zones' && 'اختر منطقتك الجغرافية للانتقال إلى تقسيم المناطق الإدارية والمحافظات بنمط الميترو التفاعلي'}
            {drillLevel === 'regions' && `المناطق الإدارية في ${currentZoneObject?.label || 'المنطقة المختارة'} - اختر المنطقة الإدارية لاستعراض مدنها ومحافظاتها`}
            {drillLevel === 'cities' && `مدن ومحافظات ${currentAdminRegionObject?.title || currentZoneObject?.label || 'المنطقة'} - اضغط على المدينة للانتقال لنتائج القاعات المتاحة`}
          </p>

          {/* Hierarchical Drill-down Breadcrumbs & Navigation Bar (بدل التبويبات العلوية) */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 p-2 sm:p-3 bg-white border border-slate-200/90 rounded-2xl shadow-xs">
            {/* Breadcrumb Navigation Path */}
            <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 text-xs sm:text-sm font-bold">
              {/* Root: All Geographic Zones */}
              <button
                onClick={() => {
                  setDrillLevel('zones');
                  setSelectedGeoZoneId('');
                  setSelectedAdminRegionId('');
                  setMetroPageIndex(0);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                  drillLevel === 'zones'
                    ? 'bg-[#0f1e36] text-white shadow-xs font-black'
                    : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100'
                }`}
              >
                <Globe className="w-4 h-4 text-amber-400" />
                <span>المناطق الجغرافية بالمملكة</span>
              </button>

              {/* Level 2: Selected Geo Zone */}
              {selectedGeoZoneId && currentZoneObject && (
                <>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                  <button
                    onClick={() => {
                      setDrillLevel('regions');
                      setSelectedAdminRegionId('');
                      setMetroPageIndex(0);
                    }}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                      drillLevel === 'regions'
                        ? 'bg-[#0f1e36] text-white shadow-xs font-black'
                        : 'text-slate-700 hover:text-blue-950 hover:bg-slate-100'
                    }`}
                  >
                    <Compass className="w-4 h-4 text-amber-400" />
                    <span>{currentZoneObject.label}</span>
                  </button>
                </>
              )}

              {/* Level 3: Selected Admin Region */}
              {selectedAdminRegionId && currentAdminRegionObject && (
                <>
                  <ChevronLeft className="w-4 h-4 text-slate-400" />
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 text-blue-950 shadow-xs font-black">
                    <MapPin className="w-4 h-4 text-blue-950" />
                    <span>{currentAdminRegionObject.title}</span>
                  </div>
                </>
              )}
            </div>

            {/* Back Navigation Button when inside drill levels */}
            {drillLevel !== 'zones' && (
              <button
                onClick={() => {
                  if (drillLevel === 'cities') {
                    setDrillLevel('regions');
                    setSelectedAdminRegionId('');
                    setMetroPageIndex(0);
                  } else if (drillLevel === 'regions') {
                    setDrillLevel('zones');
                    setSelectedGeoZoneId('');
                    setSelectedAdminRegionId('');
                    setMetroPageIndex(0);
                  }
                }}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-black text-slate-700 hover:text-blue-950 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <span>العودة للمستوى السابق</span>
                <ArrowLeft className="w-3.5 h-3.5 rotate-180 text-amber-600" />
              </button>
            )}
          </div>
        </div>

        {/* Full-Width Edge-to-Edge Metro Grid Container with Floating Circular Navigation Arrows */}
        <div className="relative w-full group/metro my-2 overflow-hidden">
          
          {/* Right Circular Floating Navigation Button (السابق) */}
          {totalMetroPages > 1 && (
            <button
              onClick={handlePrevMetroTab}
              className="absolute right-3 sm:right-6 lg:right-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-2xl border border-slate-200/90 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
              title="السابق"
              aria-label="السابق"
            >
              <ChevronRight className="w-6 h-6 text-slate-800 stroke-[2.5]" />
            </button>
          )}

          {/* Left Circular Floating Navigation Button (التالي) */}
          {totalMetroPages > 1 && (
            <button
              onClick={handleNextMetroTab}
              className="absolute left-3 sm:left-6 lg:left-8 top-1/2 -translate-y-1/2 z-30 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-white/95 hover:bg-white text-slate-800 shadow-2xl border border-slate-200/90 backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer opacity-90 hover:opacity-100"
              title="التالي"
              aria-label="التالي"
            >
              <ChevronLeft className="w-6 h-6 text-slate-800 stroke-[2.5]" />
            </button>
          )}

          {/* Dynamic Adaptive Metro Grid (Full-Width Edge-to-Edge with Automatic Page Pattern Shifting) */}
          {(() => {
            const count = currentTiles.length;
            if (count === 0) {
              return (
                <div className="w-full py-16 text-center text-slate-500 bg-white/50">
                  <MapPin className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                  <p className="text-sm font-bold">لا توجد بيانات متاحة حالياً في هذا النطاق</p>
                </div>
              );
            }

            const handleTileClick = (tile: any) => {
              if (!tile) return;

              // Level 1: Click on Geographic Zone Tile -> Drill to Administrative Regions
              if (drillLevel === 'zones') {
                const zId = tile.zoneId || (tile.id ? tile.id.replace('-zone', '').replace('-all', '') : 'central');
                setSelectedGeoZoneId(zId);
                setSelectedAdminRegionId('');
                setDrillLevel('regions');
                setMetroPageIndex(0);
                return;
              }

              // Level 2: Click on Administrative Region Tile -> Drill to Cities/Governorates
              if (drillLevel === 'regions') {
                setSelectedAdminRegionId(tile.id);
                setDrillLevel('cities');
                setMetroPageIndex(0);
                return;
              }

              // Level 3: Click on City/Governorate Tile -> Navigate to halls page with region and city filter applied
              if (drillLevel === 'cities') {
                const query = tile.city 
                  ? `/explore?region=${encodeURIComponent(tile.query)}&city=${encodeURIComponent(tile.city)}`
                  : `/explore?region=${encodeURIComponent(tile.query)}`;
                navigate(query);
              }
            };

            const renderMetroTile = (tile: any, isHero: boolean = false, customClass: string = '') => {
              if (!tile) return null;
              return (
                <div 
                  key={tile.id || tile.title}
                  onClick={() => handleTileClick(tile)}
                  className={`group/tile relative overflow-hidden cursor-pointer transition-all duration-300 rounded-none hover:brightness-105 shadow-xs hover:shadow-lg ring-0 hover:ring-2 hover:ring-amber-400 select-none min-h-0 min-w-0 ${customClass}`}
                >
                  <img 
                    src={tile.image} 
                    alt={tile.title} 
                    className="w-full h-full object-cover group-hover/tile:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/50 group-hover/tile:via-black/20 transition-all duration-500" />

                  {/* Top Info: Title, Subtitle, & Map Pin + Count */}
                  <div className={`absolute ${isHero ? 'top-5 sm:top-7 right-5 sm:right-7' : 'top-3.5 sm:top-4 right-3.5 sm:right-4'} text-right z-10 max-w-[85%]`}>
                    <div className="flex items-center gap-2 justify-end mb-1">
                      <h3 className={`${isHero ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-base sm:text-lg lg:text-xl'} font-black text-white drop-shadow-md truncate`}>
                        {tile.title}
                      </h3>
                      <MapPin className={`${isHero ? 'w-6 h-6 sm:w-7 sm:h-7' : 'w-4 h-4 sm:w-5 sm:h-5'} text-amber-400 shrink-0 drop-shadow`} />
                    </div>
                    {tile.subtitle && (
                      <p className={`${isHero ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'} text-amber-200/90 font-medium mb-1.5 drop-shadow-sm truncate`}>
                        {tile.subtitle}
                      </p>
                    )}
                    <div className="text-right">
                      <span className={`${isHero ? 'text-2xl sm:text-3xl lg:text-4xl' : 'text-base sm:text-xl'} font-black text-white font-mono leading-none block`}>
                        {tile.count}
                      </span>
                      <span className={`${isHero ? 'text-xs sm:text-sm' : 'text-[10px] sm:text-xs'} font-bold text-slate-300`}>
                        {drillLevel === 'zones' ? 'قاعة موزعة بالمناطق' : drillLevel === 'regions' ? 'قاعة بالمحافظات' : 'قاعة ومنتجع متاح'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Action Pill */}
                  <div className={`absolute ${isHero ? 'bottom-5 sm:bottom-7 left-5 sm:left-7' : 'bottom-3 sm:bottom-4 left-3 sm:left-4'} z-10`}>
                    <span className={`inline-flex items-center gap-1.5 ${isHero ? 'px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm' : 'px-2.5 sm:px-3 py-1 sm:py-1.5 text-[11px] sm:text-xs'} bg-black/40 hover:bg-black/65 backdrop-blur-md text-white font-bold rounded-xl border border-white/25 shadow-md group-hover/tile:border-amber-400 transition-all`}>
                      <span>
                        {drillLevel === 'zones' && 'استعراض المناطق الإدارية'}
                        {drillLevel === 'regions' && 'استعراض المدن والمحافظات'}
                        {drillLevel === 'cities' && 'استكشاف القاعات'}
                      </span>
                      <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover/tile:-translate-x-1 transition-transform shrink-0" />
                    </span>
                  </div>
                </div>
              );
            };

            // Layout Adaptations according to City Count & Page Pattern Index:
            // 1. Single City
            if (count === 1) {
              return (
                <div className="w-full h-[360px] sm:h-[440px] md:h-[480px] min-h-0">
                  {renderMetroTile(currentTiles[0], true, 'w-full h-full')}
                </div>
              );
            }

            // 2. Two Cities (Distinct Proportions: 60% Hero Landscape + 40% Portrait)
            if (count === 2) {
              const isEven = metroPageIndex % 2 === 0;
              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full min-h-0">
                  {isEven ? (
                    <>
                      {renderMetroTile(currentTiles[0], true, 'md:col-span-7 h-[300px] md:h-full')}
                      {renderMetroTile(currentTiles[1], true, 'md:col-span-5 h-[300px] md:h-full')}
                    </>
                  ) : (
                    <>
                      {renderMetroTile(currentTiles[0], true, 'md:col-span-5 h-[300px] md:h-full')}
                      {renderMetroTile(currentTiles[1], true, 'md:col-span-7 h-[300px] md:h-full')}
                    </>
                  )}
                </div>
              );
            }

            // 3. Three Cities: Varied Asymmetric Tiles
            if (count === 3) {
              const isEven = metroPageIndex % 2 === 0;
              if (isEven) {
                // Pattern A: Right Grand Hero (7 cols) + Left 2 Stacked Cards (5 cols)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full min-h-0">
                    {renderMetroTile(currentTiles[0], true, 'md:col-span-7 h-[300px] md:h-full')}
                    <div className="md:col-span-5 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                      {renderMetroTile(currentTiles[1], false, 'h-full')}
                      {renderMetroTile(currentTiles[2], false, 'h-full')}
                    </div>
                  </div>
                );
              } else {
                // Pattern B: Left 2 Stacked (5 cols) + Right Grand Hero (7 cols)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full min-h-0">
                    <div className="md:col-span-5 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                      {renderMetroTile(currentTiles[0], false, 'h-full')}
                      {renderMetroTile(currentTiles[1], false, 'h-full')}
                    </div>
                    {renderMetroTile(currentTiles[2], true, 'md:col-span-7 h-[300px] md:h-full')}
                  </div>
                );
              }
            }

            // 4. Four Cities: Distinct Modular Asymmetric Tile Geometry
            if (count === 4) {
              const isEven = metroPageIndex % 2 === 0;
              if (isEven) {
                // Pattern A: Right Hero (5 cols) + Middle Top Panorama (4 cols) & Bottom Mini (4 cols) + Left Slim (3 cols)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full min-h-0 select-none">
                    {renderMetroTile(currentTiles[0], true, 'md:col-span-5 h-[300px] md:h-full')}
                    <div className="md:col-span-4 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                      {renderMetroTile(currentTiles[1], false, 'h-full')}
                      {renderMetroTile(currentTiles[2], false, 'h-full')}
                    </div>
                    {renderMetroTile(currentTiles[3], true, 'md:col-span-3 h-[280px] md:h-full')}
                  </div>
                );
              } else {
                // Pattern B: Left Hero (5 cols) + Right 3 Dynamic Tiles (7 cols)
                return (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full min-h-0 select-none">
                    {renderMetroTile(currentTiles[0], true, 'md:col-span-3 h-[280px] md:h-full')}
                    <div className="md:col-span-4 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                      {renderMetroTile(currentTiles[1], false, 'h-full')}
                      {renderMetroTile(currentTiles[2], false, 'h-full')}
                    </div>
                    {renderMetroTile(currentTiles[3], true, 'md:col-span-5 h-[300px] md:h-full')}
                  </div>
                );
              }
            }

            // 5. Five or more Cities: 3 Unique Architectural Tile Formats with Distinct Proportions
            const pagePattern = metroPageIndex % 3;

            if (pagePattern === 0) {
              // Pattern 0: Asymmetric Grand Right (Hero 5 cols) + Middle Dual (4 cols) + Left Vertical Slims (3 cols)
              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full select-none min-h-0">
                  {/* Right Grand Hero (5 Columns Full Height) */}
                  {renderMetroTile(currentTiles[0], true, 'md:col-span-5 h-[300px] md:h-full')}

                  {/* Middle Column Stacked (4 Columns) */}
                  <div className="md:col-span-4 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                    {renderMetroTile(currentTiles[1], false, 'h-full')}
                    {renderMetroTile(currentTiles[2], false, 'h-full')}
                  </div>

                  {/* Left Column Stacked (3 Columns) */}
                  <div className="md:col-span-3 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                    {renderMetroTile(currentTiles[3], false, 'h-full')}
                    {renderMetroTile(currentTiles[4], false, 'h-full')}
                  </div>
                </div>
              );
            }

            if (pagePattern === 1) {
              // Pattern 1: Asymmetric Left Hero (5 cols) + Right Stacked (3 cols) + Middle Stacked (4 cols)
              return (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full select-none min-h-0">
                  {/* Right Column Stacked (3 Columns) */}
                  <div className="md:col-span-3 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                    {renderMetroTile(currentTiles[0], false, 'h-full')}
                    {renderMetroTile(currentTiles[1], false, 'h-full')}
                  </div>

                  {/* Middle Column Stacked (4 Columns) */}
                  <div className="md:col-span-4 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                    {renderMetroTile(currentTiles[2], false, 'h-full')}
                    {renderMetroTile(currentTiles[3], false, 'h-full')}
                  </div>

                  {/* Left Grand Hero (5 Columns Full Height) */}
                  {renderMetroTile(currentTiles[4], true, 'md:col-span-5 h-[300px] md:h-full')}
                </div>
              );
            }

            // Pattern 2: Center Majestic Pavilion (6 cols) + Flanking Stacked Wings (3 cols + 3 cols)
            return (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-1 md:gap-1.5 h-auto md:h-[480px] w-full select-none min-h-0">
                {/* Right Wing Stacked (3 Columns) */}
                <div className="md:col-span-3 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                  {renderMetroTile(currentTiles[0], false, 'h-full')}
                  {renderMetroTile(currentTiles[1], false, 'h-full')}
                </div>

                {/* Center Majestic Hero (6 Columns) */}
                {renderMetroTile(currentTiles[2], true, 'md:col-span-6 h-[300px] md:h-full')}

                {/* Left Wing Stacked (3 Columns) */}
                <div className="md:col-span-3 grid grid-rows-2 gap-1 md:gap-1.5 h-[420px] md:h-full min-h-0">
                  {renderMetroTile(currentTiles[3], false, 'h-full')}
                  {renderMetroTile(currentTiles[4], false, 'h-full')}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Footer Container: Dot Pagination Indicators, City Navigator & Trust Guarantees Bar */}
        <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 px-1">
            
            {/* Quick Status / Reset shortcut */}
            <div className="flex items-center gap-2 order-2 sm:order-1">
              {drillLevel !== 'zones' && (
                <button
                  onClick={() => {
                    setDrillLevel('zones');
                    setSelectedGeoZoneId('');
                    setSelectedAdminRegionId('');
                    setMetroPageIndex(0);
                  }}
                  className="text-xs font-black text-amber-700 bg-amber-50 hover:bg-amber-100 px-3 py-1.5 rounded-xl border border-amber-200 transition-colors cursor-pointer"
                >
                  العودة لكل المناطق الجغرافية
                </button>
              )}
            </div>

            {/* Page Navigator if multiple pages exist for this drill view */}
            {totalMetroPages > 1 ? (
              <div className="flex items-center gap-2 order-1 sm:order-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs">
                <span className="text-xs font-bold text-slate-500">
                  صفحة {metroPageIndex + 1} من {totalMetroPages}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalMetroPages }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setMetroPageIndex(idx)}
                      className={`h-2.5 transition-all duration-300 rounded-full cursor-pointer ${
                        metroPageIndex === idx
                          ? 'w-6 bg-amber-500 shadow-xs'
                          : 'w-2.5 bg-slate-200 hover:bg-slate-300'
                      }`}
                      aria-label={`الصفحة ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="order-1 sm:order-2" />
            )}

            {/* Quick Summary Pill */}
            <div className="order-3 text-xs font-bold text-slate-500 hidden sm:block">
              <span>
                {drillLevel === 'zones' && `${hierarchicalMetroTiles.length} مناطق جغرافية رئيسية بالمملكة`}
                {drillLevel === 'regions' && `${hierarchicalMetroTiles.length} مناطق إدارية رئيسية`}
                {drillLevel === 'cities' && `${hierarchicalMetroTiles.length} مدن ومحافظات متاحة`}
              </span>
            </div>
          </div>

          {/* 5-Item Trust & Guarantees Bar (Matching Screenshot) */}
          <div className="mt-8 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
              
              {/* Feature 1: مزودون معتمدون */}
              <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
                  <ShieldCheck className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="text-base font-black text-blue-950 mb-1">مزودون معتمدون</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">جميع القاعات والمزودين معتمدون من منصة ليلة</p>
              </div>

              {/* Feature 2: جودة مضمونة */}
              <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
                  <Star className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="text-base font-black text-blue-950 mb-1">جودة مضمونة</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">معايير جودة عالية وتجارب ممتازة لضيوفك</p>
              </div>

              {/* Feature 3: أسعار شفافة */}
              <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
                  <CheckCircle2 className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="text-base font-black text-blue-950 mb-1">أسعار شفافة</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">أسعار واضحة شاملة الضريبة (15%)</p>
              </div>

              {/* Feature 4: دعم على مدار الساعة */}
              <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
                  <Headset className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="text-base font-black text-blue-950 mb-1">دعم على مدار الساعة</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">فريق دعم جاهز لمساعدتك 24/7</p>
              </div>

              {/* Feature 5: حجز آمن وسريع */}
              <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
                  <Lock className="w-6 h-6 text-amber-600" />
                </div>
                <h4 className="text-base font-black text-blue-950 mb-1">حجز آمن وسريع</h4>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">حجز فوري وآمن في خطوات بسيطة</p>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* ========================================================================= */}
      {/* 🚀 قسم الخدمات والتخطيط المطورة: «توليفة التصفح والتخطيط الذكي المكتملة» */}
      {/* ========================================================================= */}
      <section className="py-14 sm:py-16 bg-slate-50/70 border-y border-slate-200/80 relative overflow-hidden" id="event-services-planner-section">
        {/* Subtle Ambient Light Decoration */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

          {/* 1. رأس القسم والعنوان الجذاب (Header & Title) */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div className="text-right">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-black mb-2.5 shadow-2xs">
                <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>خدمات وتخطيط المناسبات 🌟</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-blue-950 tracking-tight leading-tight">
                عندك مناسبة وتحتاج خدمة؟!
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm md:text-base mt-2 font-medium max-w-2xl leading-relaxed">
                اكتشف أفضل الخدمات المعتمدة لمناسبتك واطلبها بكل سهولة.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2 self-start md:self-auto">
              <Link
                to="/services"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 text-blue-950 text-xs sm:text-sm font-black rounded-xl border border-slate-200 shadow-xs hover:shadow-md hover:border-amber-400 transition-all duration-300 group cursor-pointer"
              >
                <span>استعراض جميع الخدمات</span>
                <ArrowLeft className="w-4 h-4 text-amber-500 group-hover:-translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>

          {/* 2. شريط الدوائر السريع (Quick Circular Category Carousel) */}
          <div className="mb-8">
            <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-1 justify-start md:justify-center">
              {serviceCategories.map((cat) => {
                const isActive = selectedServiceCategory === cat.id;
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedServiceCategory(cat.id);
                      setServiceCarouselIndex(0);
                    }}
                    className={`flex flex-col items-center gap-2 group cursor-pointer shrink-0 transition-all duration-300 focus:outline-none`}
                  >
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 transition-all duration-300 ${
                      isActive 
                        ? 'ring-3 ring-amber-500 ring-offset-2 scale-105 shadow-lg shadow-amber-500/25' 
                        : 'ring-1 ring-slate-200 hover:ring-amber-300 hover:scale-105 shadow-xs'
                    }`}>
                      <div className="w-full h-full rounded-full overflow-hidden relative">
                        <img 
                          src={cat.image} 
                          alt={cat.name} 
                          className="w-full h-full object-cover group-hover:scale-115 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                        <div className={`absolute inset-0 transition-all duration-300 flex items-center justify-center ${
                          isActive 
                            ? 'bg-blue-950/65' 
                            : 'bg-black/40 group-hover:bg-black/25'
                        }`}>
                          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 transition-transform duration-300 ${
                            isActive ? 'text-amber-400 scale-110' : 'text-white group-hover:scale-110'
                          }`} />
                        </div>
                      </div>
                      {isActive && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white" />
                      )}
                    </div>

                    <span className={`text-[11px] sm:text-xs font-black transition-colors whitespace-nowrap ${
                      isActive ? 'text-amber-600 font-black' : 'text-slate-600 group-hover:text-blue-950'
                    }`}>
                      {cat.name}
                    </span>
                  </button>
                );
              })}

              {/* دائرة المزيد - في الجهة المقابلة لدائرة الكل للانتقال المباشر لصفحة الخدمات */}
              <Link
                to="/services"
                className="flex flex-col items-center gap-2 group cursor-pointer shrink-0 transition-all duration-300 focus:outline-none"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full p-0.5 transition-all duration-300 ring-1 ring-slate-200 hover:ring-amber-400 hover:scale-105 shadow-xs">
                  <div className="w-full h-full rounded-full overflow-hidden relative bg-gradient-to-br from-blue-950 via-slate-900 to-indigo-950">
                    <img
                      src="https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=300&q=80"
                      alt="المزيد من الخدمات"
                      className="w-full h-full object-cover opacity-35 group-hover:scale-115 group-hover:opacity-55 transition-all duration-500"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-blue-950/60 group-hover:bg-blue-950/30 transition-colors flex items-center justify-center">
                      <LayoutGrid className="w-5 h-5 sm:w-6 sm:h-6 text-amber-400 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>
                </div>

                <span className="text-[11px] sm:text-xs font-black text-slate-600 group-hover:text-amber-600 transition-colors whitespace-nowrap">
                  المزيد
                </span>
              </Link>
            </div>
          </div>

          {/* 3. صف البطاقات الخمسة الذهبية مع أزرار التنقل العائمة والمؤشرات النقطية */}
          <div className="relative mb-12">
            {/* Floating Navigation Controls (Right & Left White Circular Buttons - No Text) */}
            {allFilteredServices.length > 5 && (
              <>
                {/* Right Floating Button (السابق في RTL) */}
                <button
                  onClick={handlePrevServices}
                  aria-label="السابق"
                  className="absolute -right-2 sm:-right-4 md:-right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-xl hover:shadow-2xl border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                >
                  <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
                </button>

                {/* Left Floating Button (التالي في RTL) */}
                <button
                  onClick={handleNextServices}
                  aria-label="التالي"
                  className="absolute -left-2 sm:-left-4 md:-left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-xl hover:shadow-2xl border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
                </button>
              </>
            )}

            {/* 5 Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
              {visibleServices.map((service, sIdx) => {
                return (
                  <div
                    key={service.id || `service-${sIdx}`}
                    onClick={() => {
                      setSelectedServiceForDetails(service);
                      setIsServiceDetailsOpen(true);
                    }}
                    className="group relative bg-white rounded-2xl border border-slate-200/90 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between overflow-hidden cursor-pointer hover:-translate-y-1"
                  >
                    {/* Top Image Box */}
                    <div className="relative h-40 sm:h-44 w-full overflow-hidden bg-slate-100">
                      <img
                        src={service.image}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

                      {/* Rating Badge (Top Right in RTL) */}
                      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/55 backdrop-blur-md border border-white/20 text-white text-[11px] font-black shadow-xs">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        <span>{service.rating || '4.8'}</span>
                      </div>

                      {/* Category Pill (Top Left in RTL) */}
                      <div className="absolute top-2.5 left-2.5 z-10">
                        <span className="px-2 py-0.5 rounded-lg bg-amber-500/95 backdrop-blur-md text-slate-950 text-[10px] font-black shadow-xs">
                          {service.category}
                        </span>
                      </div>

                      {/* Location Badge (Bottom of Image) */}
                      <div className="absolute bottom-2.5 right-2.5 left-2.5 z-10 flex items-center justify-between text-white text-[11px] font-medium">
                        <div className="flex items-center gap-1 drop-shadow">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{service.city || 'الرياض'}</span>
                        </div>
                        <span className="text-[10px] text-amber-300 font-bold bg-black/40 px-1.5 py-0.5 rounded">معتمد</span>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-3.5 flex flex-col flex-grow justify-between text-right">
                      <div>
                        <h3 className="text-sm sm:text-[15px] font-black text-blue-950 group-hover:text-amber-600 transition-colors line-clamp-1 leading-snug mb-1">
                          {service.name}
                        </h3>

                        {/* Provider Info */}
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
                          <ShieldCheck className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          <span className="truncate font-medium">{service.provider}</span>
                        </div>
                      </div>

                      {/* Pricing & Order CTA */}
                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex flex-col text-right">
                          <span className="text-[10px] text-slate-400 font-bold">السعر يبدأ من</span>
                          <div className="flex items-baseline gap-1">
                            <span className="text-sm sm:text-base font-black text-blue-950 font-mono">
                              {Number(service.price).toLocaleString()}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">ر.س</span>
                          </div>
                          <span className="text-[8px] text-emerald-600 font-bold">شامل الضريبة 15%</span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedServiceForRequest(service);
                            setIsServiceRequestOpen(true);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white rounded-xl text-xs font-black border border-amber-200 hover:border-amber-500 transition-all duration-200 shadow-2xs group/btn cursor-pointer"
                        >
                          <span>طلب</span>
                          <ArrowLeft className="w-3 h-3 transition-transform group-hover/btn:-translate-x-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* أشرطة المؤشرات النقطية للتنقل السريع بين كروت الخدمات (Pagination Dots) */}
            {allFilteredServices.length > 5 && (
              <div className="flex items-center justify-center gap-2 mt-6">
                {Array.from({ length: Math.ceil(allFilteredServices.length / 5) }).map((_, pageIdx) => {
                  const isActivePage = Math.floor(serviceCarouselIndex / 5) === pageIdx;
                  return (
                    <button
                      key={pageIdx}
                      onClick={() => setServiceCarouselIndex(pageIdx * 5)}
                      aria-label={`انتقل إلى صفحة الخدمات ${pageIdx + 1}`}
                      className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                        isActivePage
                          ? 'w-8 bg-amber-500 shadow-xs'
                          : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* 4. شريط/بانر التخطيط الذكي السفلي (Smart Event Planner Bar) - تصميم مخصص فاخر RTL مطابق للصورة */}
          <div className="relative rounded-3xl overflow-hidden shadow-sm border border-[#eadecc] bg-[#fdfbf7]">
            <div className="flex flex-col lg:flex-row items-stretch">
              {/* Right Hero Side (-20% width => lg:w-[30%] xl:w-[28%], Full image background with #f7f1e6 gradient) */}
              <div className="lg:w-[30%] xl:w-[28%] shrink-0 relative overflow-hidden border-b lg:border-b-0 lg:border-l border-[#ecdcc9] p-6 sm:p-7 flex flex-col justify-between text-right">
                {/* Full Background Image with #f7f1e6 tint overlay */}
                <div className="absolute inset-0 z-0">
                  <img
                    src="https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"
                    alt="Event background"
                    className="w-full h-full object-cover opacity-25"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-l from-[#f7f1e6]/95 via-[#f7f1e6]/90 to-[#f7f1e6]/98" />
                </div>

                <div className="relative z-10 flex flex-col items-start text-right">
                  <h3 className="text-xl sm:text-2xl xl:text-[26px] font-black text-[#0c1a30] leading-tight">
                    خطط لمناسبتك الآن
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 font-medium mt-2 leading-relaxed">
                    سنساعدك في اختيار القاعة<br className="hidden sm:inline" /> والخدمات المناسبة لك
                  </p>

                  <Link
                    to="/budget-planner"
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#0c1a30] hover:bg-[#162744] text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all group mt-5 cursor-pointer hover:scale-105 border border-amber-400/30"
                  >
                    <span>ابدأ التخطيط</span>
                    <ArrowLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform" />
                  </Link>
                </div>

                {/* الركن البصري الديكوري الفاخر */}
                <div className="relative z-10 mt-4 flex justify-end">
                  <div className="w-24 sm:w-28 h-24 sm:h-28 shrink-0 flex items-center justify-center">
                    <img
                      src="https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=300&q=80"
                      alt="Event Planner Decor"
                      className="w-full h-full object-contain mix-blend-multiply drop-shadow-md"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>
              </div>

              {/* Left Steps Side (في الجهة اليسرى حسب اتجاه RTL): إظهار الخطوات الخمس كاملة بدوائر أكبر وهوامش أضيق */}
              <div className="flex-1 p-4 sm:p-6 flex items-center justify-center bg-[#fdfbf7]">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5 sm:gap-2 w-full items-center justify-items-center py-1">
                  {[
                    {
                      num: '01',
                      title: 'اختر مناسبتك',
                      subtitle: 'حدد نوع المناسبة',
                      icon: CalendarIcon,
                      path: '/budget-planner?step=1',
                    },
                    {
                      num: '02',
                      title: 'حدد المدينة والمنطقة',
                      subtitle: 'اختر موقع المناسبة',
                      icon: MapPin,
                      path: '/budget-planner?step=2',
                    },
                    {
                      num: '03',
                      title: 'اختر الخدمات',
                      subtitle: 'اختر الخدمات التي تحتاجها',
                      icon: ClipboardList,
                      path: '/services',
                    },
                    {
                      num: '04',
                      title: 'احصل على عروض الأسعار',
                      subtitle: 'قارن بين أفضل العروض',
                      icon: BadgePercent,
                      path: '/explore?view=offers',
                    },
                    {
                      num: '05',
                      title: 'أكّد طلبك',
                      subtitle: 'احجز الخدمة بكل سهولة',
                      icon: ShieldCheck,
                      path: '/bookings',
                    },
                  ].map((step, idx) => {
                    const StepIcon = step.icon;
                    return (
                      <Link
                        key={idx}
                        to={step.path}
                        className="group flex flex-col items-center w-full max-w-[155px] text-center cursor-pointer focus:outline-none py-1 px-0.5"
                      >
                        {/* Number Badge */}
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#0c1a30] text-white font-black text-xs flex items-center justify-center shadow-xs mx-auto mb-1.5 border-2 border-white">
                          {step.num}
                        </div>

                        {/* Outer Circle with Gold Border & Icon - Enriched and Enlarged */}
                        <div className="w-16 h-16 sm:w-18 sm:h-18 lg:w-20 lg:h-20 rounded-full bg-white border-2 border-[#caa455] shadow-xs flex items-center justify-center mx-auto group-hover:scale-105 group-hover:border-amber-500 group-hover:shadow-md transition-all duration-300">
                          <StepIcon className="w-7 h-7 sm:w-8 sm:h-8 text-[#b88628] stroke-[1.75]" />
                        </div>

                        {/* Step Title */}
                        <h4 className="font-black text-xs sm:text-sm text-[#0c1a30] group-hover:text-amber-700 transition-colors mt-2 text-center truncate w-full">
                          {step.title}
                        </h4>

                        {/* Step Subtitle */}
                        <p className="text-[10px] sm:text-[11px] text-slate-500 font-medium mt-0.5 text-center truncate w-full">
                          {step.subtitle}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Middle Wide Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 my-8">
        <AdBanner placement="الإعلان الأوسط - عريض" layout="banner" className="h-32 rounded-2xl shadow-xs" />
      </div>

      {/* 7. Interactive Calendar & Latest Halls */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-10">
            <span className="text-amber-500 font-extrabold text-xs sm:text-sm tracking-wider uppercase bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/50">تخطيط فوري وحجز متكامل ⚡</span>
            <h2 className="text-3xl font-black text-blue-950 mt-3">خطط لمناسبتك بذكاء</h2>
            <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl mx-auto">تحقق لحظياً من توفر القاعات والاستراحات واحجز موعدك مباشرة من مكان واحد</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
            {/* Calendar Part */}
            <div className="lg:col-span-1 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5 text-amber-500" />
                    أيام المناسبات
                  </h3>
                  <div className="flex bg-white rounded-xl p-1 border border-slate-200 gap-1 shadow-2xs">
                    <button 
                      onClick={() => setCalendarType('gregorian')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calendarType === 'gregorian' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      ميلادي
                    </button>
                    <button 
                      onClick={() => setCalendarType('hijri')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calendarType === 'hijri' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                    >
                      هجري
                    </button>
                  </div>
                </div>
                
                <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs mb-4 flex-grow flex flex-col">
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 px-1">
                    <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    </button>
                    <div className="text-center">
                      <div className="font-extrabold text-blue-950 text-sm">
                        {calendarType === 'gregorian' 
                          ? format(currentMonth, 'MMMM yyyy', { locale: arSA })
                          : getFullDateInfo(currentMonth).hijri.monthName + ' ' + getFullDateInfo(currentMonth).hijri.year
                        }
                      </div>
                    </div>
                    <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                      <ChevronLeft className="w-4 h-4 text-slate-500" />
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-2 font-black text-slate-400">
                    {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map(d => <div key={d} className="py-1">{d}</div>)}
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-sm flex-1 content-start" key={calendarType}>
                    {(() => {
                      const start = startOfWeek(startOfMonth(currentMonth));
                      const end = endOfWeek(endOfMonth(currentMonth));
                      const days = eachDayOfInterval({ start, end });
                      
                      return days.map((day, idx) => {
                        const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                        const dateInfo = getFullDateInfo(day);
                        const isBooked = [10, 12, 18, 25].includes(day.getDate()); // Mock
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                        return (
                          <button 
                            key={idx} 
                            onClick={() => setSelectedDate(day)}
                            className={`relative py-2 rounded-xl flex flex-col items-center justify-center transition-all min-h-[52px]
                              ${isSelected 
                                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 scale-105 z-10' 
                                : !isCurrentMonth 
                                ? 'text-slate-300 opacity-40' 
                                : isBooked 
                                ? 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100/50' 
                                : 'hover:bg-slate-100 text-slate-700'}`}
                          >
                            {calendarType === 'gregorian' ? (
                              <>
                                <span className="text-base font-black leading-none">{dateInfo.gregorian.day}</span>
                                <span className={`text-[9px] mt-1 font-bold ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>{dateInfo.hijri.day}</span>
                              </>
                            ) : (
                              <>
                                <span className="text-base font-black leading-none">{dateInfo.hijri.day}</span>
                                <span className={`text-[9px] mt-1 font-bold ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>{dateInfo.gregorian.day}</span>
                              </>
                            )}
                            {isBooked && !isSelected && (
                              <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                            )}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>
              </div>

              {selectedDate && (
                <div className="mt-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl shadow-xs transition-all duration-300">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                      <CalendarIcon className="w-5 h-5 animate-pulse" />
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-[9px] text-amber-600 font-extrabold uppercase tracking-wider mb-0.5">التاريخ واليوم المحدد</span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-sm font-black text-slate-800 truncate">
                          {format(selectedDate, 'EEEE، d MMMM yyyy', { locale: arSA })}
                        </span>
                        <span className="text-xs font-bold text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded-lg w-max max-w-full truncate">
                          {getFullDateInfo(selectedDate).hijri.full}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Latest Halls Part */}
            <div className="lg:col-span-2 bg-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
              <div>
                {/* Header with periods, GPS, and link */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-black text-blue-950 flex items-center gap-1.5">
                      قاعات متاحة في هذا اليوم
                    </h3>
                    {selectedDate && (
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-slate-500 font-bold">
                          {format(selectedDate, 'd MMMM', { locale: arSA })}
                        </span>
                        <span className="text-xs text-amber-600 font-extrabold">
                          • {getFullDateInfo(selectedDate).hijri.day} {getFullDateInfo(selectedDate).hijri.monthName}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Period selection & GPS */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {/* Period Buttons */}
                    <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 gap-1 shadow-3xs">
                      <button 
                        onClick={() => setSelectedPeriod('morning')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          selectedPeriod === 'morning' 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : 'text-slate-600 hover:bg-white hover:text-slate-800'
                        }`}
                      >
                        <span>🌅</span>
                        <span>صباحي</span>
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('evening')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          selectedPeriod === 'evening' 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : 'text-slate-600 hover:bg-white hover:text-slate-800'
                        }`}
                      >
                        <span>🌌</span>
                        <span>مسائي</span>
                      </button>
                      <button 
                        onClick={() => setSelectedPeriod('fullday')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                          selectedPeriod === 'fullday' 
                            ? 'bg-amber-500 text-white shadow-xs' 
                            : 'text-slate-600 hover:bg-white hover:text-slate-800'
                        }`}
                      >
                        <span>📆</span>
                        <span>اليوم كامل</span>
                      </button>
                    </div>

                    {/* GPS Button */}
                    <button 
                      onClick={handleGpsFilter}
                      disabled={gpsLoading}
                      className={`p-2.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1.5 ${
                        nearMeOnly
                          ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-xs' 
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                      title="تحديد موقع القاعات الأقرب لموقعك"
                    >
                      {gpsLoading ? (
                        <RefreshCw className="w-4 h-4 animate-spin" />
                      ) : (
                        <MapPin className={`w-4 h-4 ${nearMeOnly ? 'animate-bounce' : ''}`} />
                      )}
                    </button>
                  </div>

                  <Link 
                    to={`/explore?date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}&period=${selectedPeriod}`} 
                    className="text-amber-600 hover:text-amber-700 font-extrabold text-xs sm:text-sm shrink-0 flex items-center gap-0.5 group self-end md:self-center"
                  >
                    <span>عرض جميع القاعات</span>
                    <span className="transition-transform group-hover:translate-x-[-3px]">←</span>
                  </Link>
                </div>

                {gpsError && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                    <span className="text-sm">⚠️</span>
                    <span>{gpsError}</span>
                  </div>
                )}

                {/* Compact Horizontal Cards Grid (Up to 8 cards) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(() => {
                    const day = selectedDate?.getDate() || 1;
                    const filtered = hallsList.filter(hall => {
                      if (hall.status !== 'approved') return false;
                      const hallIdNum = isNaN(parseInt(String(hall.id))) ? 1 : parseInt(String(hall.id));
                      // Deterministic mock availability per day (75% available)
                      const isAvailable = (hallIdNum + day) % 4 !== 0;
                      const matchesRegion = searchRegion 
                        ? (hall.region === searchRegion || (regionsList.find(r => r.name === searchRegion)?.cities?.includes(hall.city)))
                        : true;
                      const matchesCity = searchCity ? hall.city === searchCity : true;
                      const matchesCategory = searchCategory ? ((hall as any).type === searchCategory || hall.category === searchCategory) : true;
                      const matchesSearchTerm = searchTerm ? (hall.name.toLowerCase().includes(searchTerm.toLowerCase()) || (hall.city && hall.city.toLowerCase().includes(searchTerm.toLowerCase()))) : true;

                      const isMatch = isAvailable && matchesRegion && matchesCity && matchesCategory && matchesSearchTerm;

                      if (nearMeOnly) {
                        return isMatch && (hallIdNum % 2 === 0);
                      }
                      return isMatch;
                    });

                    const displayHalls = filtered.slice(0, 8);

                    if (displayHalls.length === 0) {
                      return (
                        <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center">
                          <span className="text-3xl mb-2">🔍</span>
                          <p className="text-slate-500 font-bold text-sm">عذراً، لا يوجد قاعات متاحة بالخيارات المحددة في هذه المنطقة أو المدينة.</p>
                          <button 
                            onClick={() => { setNearMeOnly(false); setSearchRegion(''); setSearchCity(''); setSearchTerm(''); setSearchCategory(''); }}
                            className="mt-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
                          >
                            إعادة ضبط الفلاتر ورؤية كافة النتائج
                          </button>
                        </div>
                      );
                    }

                    return displayHalls.map((hall) => {
                      const basePrice = Number(hall.price) || 2000;
                      const morningPrice = hall.morningPrice || Math.floor(basePrice * 0.6);
                      const nightPrice = hall.nightPrice || Math.floor(basePrice * 0.8);
                      const fullDayPrice = hall.fullDayPrice || Math.floor(basePrice * 1.3);

                      // Determine active price
                      const currentPrice = selectedPeriod === 'morning' 
                        ? morningPrice 
                        : selectedPeriod === 'evening' 
                        ? nightPrice 
                        : fullDayPrice;

                      return (
                        <div key={hall.id} className="flex flex-row bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-amber-200/50 transition-all group items-stretch">
                          {/* Image Box */}
                          <div className="w-1/3 relative overflow-hidden shrink-0">
                            <img 
                              src={hall.image} 
                              alt={hall.name} 
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                              referrerPolicy="no-referrer"
                            />
                            <div className="absolute top-1.5 right-1.5 z-10">
                              <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                                <span className="w-1 h-1 bg-white rounded-full animate-ping"></span>
                                متاح
                              </span>
                            </div>
                          </div>
                          
                          {/* Detail Box */}
                          <div className="flex flex-col justify-between flex-grow p-4 min-w-0">
                            <div>
                              <div className="flex items-center justify-between gap-1 mb-1">
                                <h4 className="font-extrabold text-blue-950 text-sm sm:text-base line-clamp-1 group-hover:text-amber-600 transition-colors">
                                  {hall.name}
                                </h4>
                                <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 shrink-0">
                                  <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                  <span className="text-[10px] font-black text-amber-700">{hall.rating || '4.8'}</span>
                                </div>
                              </div>
                              
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-slate-500 mb-2">
                                <span className="flex items-center gap-0.5 font-medium">
                                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                  {hall.city}
                                </span>
                                {nearMeOnly && (
                                  <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                    📍 أقرب إليك
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Price & View button */}
                            <div className="flex justify-between items-end mt-1 pt-1.5 border-t border-slate-50">
                              <div className="flex flex-col min-w-0">
                                <span className="text-[8px] sm:text-[9px] text-slate-400 font-extrabold leading-none mb-1">
                                  السعر لـ {selectedPeriod === 'morning' ? 'الصباحية' : selectedPeriod === 'evening' ? 'المسائية' : 'اليوم كامل'}
                                </span>
                                <span className="text-xs sm:text-sm font-black text-slate-900 leading-none">
                                  {currentPrice.toLocaleString()} <span className="text-[9px] font-medium text-slate-500">ريال</span>
                                </span>
                              </div>
                              
                              <Link 
                                to={`/hall/${hall.id}?date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}&period=${selectedPeriod}`} 
                                className="bg-slate-900 hover:bg-amber-500 text-white hover:text-white font-extrabold text-[10px] sm:text-xs py-1.5 px-3 rounded-lg transition-all shadow-xs shrink-0"
                              >
                                عرض التفاصيل
                              </Link>
                            </div>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Success Partners */}
      {successPartners.length > 0 && (
        <section className="py-16 bg-slate-50">
          <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
            <span className="text-amber-500 font-extrabold text-xs sm:text-sm tracking-wider uppercase bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/50">نخبة مزودي الخدمات المميزين ⭐</span>
            <h2 className="text-3xl font-black text-blue-950 mt-3 mb-4">شركاء النجاح</h2>
            <p className="text-slate-600 max-w-2xl mx-auto mb-12">نفتخر بالتعاون مع أرقى المنشآت والشركات التي تشكل حجوزاتها وخدماتها النسبة الأعلى من تفاعلات المنصة، وبتقييمات متميزة تعكس جودة وموثوقية خدماتهم.</p>
            <div className="relative w-full overflow-hidden py-4">
              {/* Left & Right ambient fade gradient masks */}
              <div className="absolute inset-y-0 left-0 w-16 sm:w-28 bg-gradient-to-r from-slate-50 to-transparent z-20 pointer-events-none" />
              <div className="absolute inset-y-0 right-0 w-16 sm:w-28 bg-gradient-to-l from-slate-50 to-transparent z-20 pointer-events-none" />

              <div className="flex gap-6 animate-marquee-ltr py-2">
                {/* First copy for seamless marquee */}
                {successPartners.map((partner, idx) => {
                  const bgImage = getPartnerImage(partner.name);
                  return (
                    <div 
                      key={`partner-p1-${partner.id}-${idx}`} 
                      className={`relative overflow-hidden group transition-all duration-300 flex flex-col justify-between text-right p-6 min-h-[220px] w-[280px] sm:w-[320px] shrink-0 shadow-xs hover:shadow-lg hover:-translate-y-1 rounded-tl-[30%] rounded-br-[30%] rounded-tr-none rounded-bl-none border ${
                        bgImage 
                          ? "border-white/10" 
                          : "bg-white border-slate-100 hover:border-amber-200/80"
                      }`}
                    >
                      {bgImage && (
                        <>
                          {/* Background image */}
                          <img 
                            src={bgImage} 
                            alt={partner.name} 
                            className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          {/* Dark professional gradient overlay for optimal readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/40 z-10" />
                        </>
                      )}

                      {/* Premium indicator bar */}
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 z-20"></div>

                      <div className="relative z-20">
                        {/* Header: Name and Rating */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <h4 className={`font-extrabold text-base line-clamp-2 leading-snug transition-colors group-hover:text-amber-400 ${
                            bgImage ? "text-white" : "text-blue-950"
                          }`}>
                            {partner.name}
                          </h4>
                          {partner.rating && (
                            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg shrink-0 border ${
                              bgImage 
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-md" 
                                : "bg-amber-50 border-amber-100 text-amber-700"
                            }`}>
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="text-xs font-black">{partner.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Metadata tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border ${
                            bgImage 
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md" 
                              : "bg-emerald-50 border-emerald-100/50 text-emerald-700"
                          }`}>
                            <span>🏢</span>
                            <span>منشأة معتمدة</span>
                          </span>
                          {partner.packageName && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border ${
                              bgImage 
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md" 
                                : "bg-blue-50 border-blue-100/50 text-blue-700"
                            }`}>
                              <span>💎</span>
                              <span>{partner.packageName}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transaction Volume Footer */}
                      <div className={`mt-4 pt-3 flex items-center justify-between text-xs relative z-20 border-t ${
                        bgImage 
                          ? "border-white/10 text-slate-300" 
                          : "border-slate-50 text-slate-400 font-bold"
                      }`}>
                        <span className={bgImage ? "text-slate-300 font-medium" : "text-slate-400 font-bold"}>نسبة الطلبات والحجوزات</span>
                        <div className="flex items-center gap-1">
                          <span className={`font-black px-2 py-0.5 rounded-md border ${
                            bgImage 
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-md" 
                              : "bg-amber-50 border-amber-100/40 text-amber-600"
                          }`}>
                            {partner.bookingsCount}+ حجز نشط
                          </span>
                          <span className="text-emerald-500 font-bold text-[10px] animate-pulse">● مرتفع</span>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* Second copy for seamless looping */}
                {successPartners.map((partner, idx) => {
                  const bgImage = getPartnerImage(partner.name);
                  return (
                    <div 
                      key={`partner-p2-${partner.id}-${idx}`} 
                      className={`relative overflow-hidden group transition-all duration-300 flex flex-col justify-between text-right p-6 min-h-[220px] w-[280px] sm:w-[320px] shrink-0 shadow-xs hover:shadow-lg hover:-translate-y-1 rounded-tl-[30%] rounded-br-[30%] rounded-tr-none rounded-bl-none border ${
                        bgImage 
                          ? "border-white/10" 
                          : "bg-white border-slate-100 hover:border-amber-200/80"
                      }`}
                    >
                      {bgImage && (
                        <>
                          {/* Background image */}
                          <img 
                            src={bgImage} 
                            alt={partner.name} 
                            className="absolute inset-0 w-full h-full object-cover z-0 group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          {/* Dark professional gradient overlay for optimal readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/85 to-slate-900/40 z-10" />
                        </>
                      )}

                      {/* Premium indicator bar */}
                      <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-400 to-amber-600 z-20"></div>

                      <div className="relative z-20">
                        {/* Header: Name and Rating */}
                        <div className="flex justify-between items-start gap-2 mb-3">
                          <h4 className={`font-extrabold text-base line-clamp-2 leading-snug transition-colors group-hover:text-amber-400 ${
                            bgImage ? "text-white" : "text-blue-950"
                          }`}>
                            {partner.name}
                          </h4>
                          {partner.rating && (
                            <div className={`flex items-center gap-0.5 px-2 py-0.5 rounded-lg shrink-0 border ${
                              bgImage 
                                ? "bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-md" 
                                : "bg-amber-50 border-amber-100 text-amber-700"
                            }`}>
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                              <span className="text-xs font-black">{partner.rating}</span>
                            </div>
                          )}
                        </div>

                        {/* Metadata tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border ${
                            bgImage 
                              ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 backdrop-blur-md" 
                              : "bg-emerald-50 border-emerald-100/50 text-emerald-700"
                          }`}>
                            <span>🏢</span>
                            <span>منشأة معتمدة</span>
                          </span>
                          {partner.packageName && (
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0 border ${
                              bgImage 
                                ? "bg-blue-500/20 text-blue-300 border-blue-500/30 backdrop-blur-md" 
                                : "bg-blue-50 border-blue-100/50 text-blue-700"
                            }`}>
                              <span>💎</span>
                              <span>{partner.packageName}</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Transaction Volume Footer */}
                      <div className={`mt-4 pt-3 flex items-center justify-between text-xs relative z-20 border-t ${
                        bgImage 
                          ? "border-white/10 text-slate-300" 
                          : "border-slate-50 text-slate-400 font-bold"
                      }`}>
                        <span className={bgImage ? "text-slate-300 font-medium" : "text-slate-400 font-bold"}>نسبة الطلبات والحجوزات</span>
                        <div className="flex items-center gap-1">
                          <span className={`font-black px-2 py-0.5 rounded-md border ${
                            bgImage 
                              ? "bg-amber-500/20 text-amber-300 border-amber-500/30 backdrop-blur-md" 
                              : "bg-amber-50 border-amber-100/40 text-amber-600"
                          }`}>
                            {partner.bookingsCount}+ حجز نشط
                          </span>
                          <span className="text-emerald-500 font-bold text-[10px] animate-pulse">● مرتفع</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 10. How it Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <h2 className="text-3xl font-bold text-blue-950 mb-12 text-center">كيف تعمل المنصة؟</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8 text-center relative">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-slate-100 z-0"></div>
            
            {[
              { num: "1", title: "ابحث", desc: "استكشف مئات القاعات والاستراحات" },
              { num: "2", title: "أختر المكان", desc: "أختر مكان المناسبة سواء قاعة أفراح او أستراحه أو شاليه وغيرها" },
              { num: "3", title: "اختر موعدك", desc: "حدد التاريخ المناسب وتأكد من التوفر وأكمل إجرءات حجزك واختيار الخدمات" },
              { num: "4", title: "ادفع بأمان", desc: "طرق دفع إلكترونية آمنة ومتنوعة" },
              { num: "5", title: "استمتع بمناسبتك", desc: "نوفر لك أفضل تجربة بلا متاعب" },
            ].map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center group">
                <div className="w-24 h-24 bg-white rounded-full border-4 border-slate-50 shadow-lg flex items-center justify-center mb-6 group-hover:border-amber-400 group-hover:-translate-y-2 transition-all duration-300">
                  <span className="text-4xl font-extrabold text-blue-950">{step.num}</span>
                </div>
                <h3 className="text-xl font-bold text-blue-950 mb-2">{step.title}</h3>
                <p className="text-slate-500 text-sm max-w-[200px]">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. Call to Action - Providers */}
      <section className="py-20 bg-blue-950 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">هل تمتلك قاعة أو استراحة؟</h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            ضاعف مبيعاتك ووسع شريحة عملائك بالانضمام إلى منصة "ليلة". نوفر لك أدوات متقدمة لإدارة حجوزاتك وعملائك بكل احترافية.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleAddHallClick} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-1">
              إضافة قاعة أو استراحة مجاناً
            </button>
            <Link to="/subscription" className="w-full sm:w-auto border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10 px-8 py-4 rounded-xl font-bold text-lg transition-all text-center inline-block">
              عرض خطط اشتراكات المزودين
            </Link>
          </div>
        </div>
      </section>

      {/* 11. Second Triple Ad */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdBanner placement="الإعلان السفلي الأول - الأيمن" layout="banner" className="h-32" />
            <AdBanner placement="الإعلان السفلي الثاني - الأوسط" layout="banner" className="h-32" />
            <AdBanner placement="الإعلان السفلي الثالث - الأيسر" layout="banner" className="h-32" />
          </div>
        </div>
      </section>

      {providerModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-slate-50">
              <h3 className="text-xl font-bold flex items-center gap-2 text-blue-950">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                تنبيه
              </h3>
              <button onClick={() => setProviderModal({isOpen: false, type: null})} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              {providerModal.type === 'login' ? (
                <>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    عذراً، يجب عليك تسجيل الدخول كمزود خدمة لتتمكن من إضافة قاعة المرفق.
                  </p>
                  <div className="flex justify-end gap-3 flex-row-reverse">
                    <Link
                      to="/register"
                      className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-colors ml-auto flex items-center justify-center text-center"
                    >
                      تسجيل
                    </Link>
                    <button 
                      onClick={() => setProviderModal({isOpen: false, type: null})}
                      className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      إغلاق
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-slate-600 mb-6 leading-relaxed">
                    هذا الخيار مخصص لمزودي الخدمة ويمكنك ترقية حسابك لعرض القاعات والاستراحات والشاليهات وأي مرافق مناسبات تملكها.
                  </p>
                  <div className="flex justify-end gap-3">
                    <button 
                      onClick={() => setProviderModal({isOpen: false, type: null})}
                      className="px-5 py-2.5 rounded-xl font-medium text-slate-600 hover:bg-slate-100 transition-colors"
                    >
                      تراجع
                    </button>
                    <Link
                      to="/subscription"
                      className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-xl font-bold transition-colors"
                    >
                      ترقية الاشتراك
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ProviderChatModal isOpen={isProviderChatOpen} onClose={() => setIsProviderChatOpen(false)} providerName={chatData.providerName} hallName={chatData.hallName} />

      {/* Service Details Modal */}
      {selectedServiceForDetails && (
        <ServiceDetailsModal
          isOpen={isServiceDetailsOpen}
          onClose={() => {
            setIsServiceDetailsOpen(false);
            setSelectedServiceForDetails(null);
          }}
          service={selectedServiceForDetails}
          onRequest={(svc) => {
            setIsServiceDetailsOpen(false);
            setSelectedServiceForRequest(svc);
            setIsServiceRequestOpen(true);
          }}
        />
      )}

      {/* Request Service Modal */}
      {selectedServiceForRequest && (
        <RequestServiceModal
          isOpen={isServiceRequestOpen}
          onClose={() => {
            setIsServiceRequestOpen(false);
            setSelectedServiceForRequest(null);
          }}
          service={selectedServiceForRequest}
          currentUserData={currentUserData}
          userBookings={userBookings}
          onSuccess={() => {
            setIsServiceRequestOpen(false);
            setSelectedServiceForRequest(null);
          }}
        />
      )}

      <Footer />
    </div>
  );
}
