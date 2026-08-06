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

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, MapPin, Calendar as CalendarIcon, 
  Star, Crown, ShieldCheck, Map, Smartphone, 
  Percent, ThumbsUp, Headset, MessageCircle, AlertCircle, X
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { arSA } from 'date-fns/locale';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProviderChatModal from '../components/ProviderChatModal';
import { AdBanner } from '../components/AdBanner';
import { FavoriteHeartButton, HallPricingAndCompare, HallCapacityLabel, PricingPatternBadge, HallStatusBadges } from '../components/HallCardAddons';
import { halls, getStoredHalls, isProviderNameVisible, providers as fallbackProviders, getPartnerLevel } from '../data/mockData';
import { getFullDateInfo, CalendarType } from '../utils/dateUtils';
import { useCalendar } from '../context/CalendarContext';
import { ChevronRight, ChevronLeft, Navigation, RefreshCw } from 'lucide-react';

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
      { id: 1, name: 'الرياض', cities: ['الرياض', 'الخرج', 'الدرعية'], image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 2, name: 'مكة المكرمة', cities: ['مكة', 'جدة', 'الطائف'], image: 'https://images.unsplash.com/photo-1565552643952-b4306354dd95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 3, name: 'المدينة المنورة', cities: ['المدينة المنورة', 'ينبع', 'بدر'], image: 'https://images.unsplash.com/photo-1591462002164-81ebd02d6b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 4, name: 'المنطقة الشرقية', cities: ['الدمام', 'الخبر', 'الظهران', 'الجبيل'], image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 5, name: 'القصيم', cities: ['بريدة', 'عنيزة', 'الرس'], image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 6, name: 'حائل', cities: ['حائل', 'بقعاء', 'الشنان'], image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 7, name: 'عسير', cities: ['أبها', 'خميس مشيط', 'أحد رفيدة'], image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 8, name: 'تبوك', cities: ['تبوك', 'ضباء', 'الوجه'], image: 'https://images.unsplash.com/photo-1647432243886-42ab22c95333?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 9, name: 'الجوف', cities: ['سكاكا', 'القريات', 'دومة الجندل'], image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 10, name: 'جيزان', cities: ['جيزان', 'صبيا', 'أبو عريش'], image: 'https://images.unsplash.com/photo-1621213501708-518dd3e198b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 11, name: 'نجران', cities: ['نجران', 'شرورة'], image: 'https://images.unsplash.com/photo-1549419131-7294860b7cb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 12, name: 'الباحة', cities: ['الباحة', 'بلجرشي'], image: 'https://images.unsplash.com/photo-1623945415707-16067fa23cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
      { id: 13, name: 'الحدود الشمالية', cities: ['عرعر', 'رفحاء', 'طريف'], image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }
    ];
  });

  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const { calendarType, setCalendarType } = useCalendar();
  const navigate = useNavigate();

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

    fetchHallsFromDB();

    const handleHallsUpdate = () => {
      fetchHallsFromDB();
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

    return list.slice(0, 3);
  })();
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

      {/* 4. Featured Halls */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex justify-between items-end mb-10">
            <div>
              <h2 className="text-3xl font-bold text-blue-950 mb-2">أبرز القاعات والاستراحات</h2>
              <p className="text-slate-500">استكشف أفضل الوجهات الموصى بها لمناسبتك القادمة</p>
            </div>
            <Link to="/explore" className="hidden border border-amber-500 text-amber-600 hover:bg-amber-50 px-6 py-2 rounded-xl font-medium sm:block transition-colors">
              عرض الكل
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuredHalls.map((hall) => (
              <div key={hall.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group flex flex-col justify-between">
                <div className="relative h-64 overflow-hidden">
                  <img src={hall.image} alt={hall.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <FavoriteHeartButton hallId={hall.id} />
                  <HallStatusBadges status={hall.status} bookingStatus={hall.bookingStatus} />
                  <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-10 pl-14">
                    <PricingPatternBadge bookingType={hall.bookingType} />
                  </div>
                  <div className="absolute top-4 right-20 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-full text-[9px] font-bold text-amber-600 flex items-center gap-1 shadow-sm z-10">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> مميزة
                  </div>
                </div>
                <div className="p-6 flex-grow flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-xl font-bold text-blue-950 flex items-center gap-2">
                        {hall.name}
                        {localStorage.getItem('IS_AUTHENTICATED') === 'true' && (
                          <button onClick={(e) => openProviderChat(e, hall.provider, hall.name)} className="text-amber-500 hover:text-amber-600 transition-colors p-1" title="مراسلة المزود">
                             <MessageCircle className="w-5 h-5" />
                          </button>
                        )}
                      </h3>
                      <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                        <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                        {hall.rating}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-4 flex items-center gap-1">
                      <MapPin className="w-4 h-4" /> {hall.location}
                    </p>
                    {hall.showProvider !== false && isProviderNameVisible(hall.provider) && (
                      <div className="bg-slate-50 rounded-lg p-2.5 mb-2 flex items-center justify-between border border-slate-100">
                         <div className="flex items-center gap-2 overflow-hidden">
                            <span className="text-xs text-slate-400 shrink-0">مقدم الخدمة:</span>
                            <Link 
                              to={`/provider-profile/${encodeURIComponent(hall.provider)}`} 
                              className="text-xs font-bold text-blue-950 hover:text-amber-600 transition-colors truncate underline decoration-amber-400 decoration-1 underline-offset-2"
                              title="عرض ملف الشريك والموثوقية"
                            >
                              {hall.provider}
                            </Link>
                         </div>
                         <Link 
                            to={`/provider-profile/${encodeURIComponent(hall.provider)}`} 
                            className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-colors shrink-0 flex items-center gap-1"
                         >
                            <span>ملف الشريك</span>
                            <span>💎</span>
                         </Link>
                      </div>
                    )}
                    
                    {/* Modular Pricing, Comparison and Gold Line */}
                    <HallPricingAndCompare hall={hall} />
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                    <HallCapacityLabel capacity={hall.capacity} />
                    <Link to={`/hall/${hall.id}`} className="bg-blue-950 hover:bg-blue-900 text-white px-5 py-2 rounded-xl text-sm font-medium shadow-sm transition-all hover:-translate-y-0.5">
                      التفاصيل
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. First Triple Ad section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdBanner placement="الإعلان العلوي الأول - الأيمن" layout="overlay" className="h-40" />
            <AdBanner placement="الإعلان العلوي الثاني - الأوسط" layout="overlay" className="h-40" />
            <AdBanner placement="الإعلان العلوي الثالث - الأيسر" layout="overlay" className="h-40" />
          </div>
        </div>
      </section>

      {/* 6. Search By Region */}
      <section className="py-16 bg-slate-50 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 text-center">
          <h2 className="text-3xl font-bold text-blue-950 mb-10">اكتشف القاعات حسب منطقتك</h2>
          <div className="flex flex-wrap justify-center gap-8">
            {regionsList.map((region) => (
              <Link to={`/explore?region=${region.name}`} key={region.id || region.name} className="flex flex-col items-center gap-4 cursor-pointer group">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg group-hover:border-amber-400 group-hover:shadow-amber-500/20 transition-all relative">
                  <img src={region.image || 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80'} alt={region.name} className="w-full h-full object-cover mix-blend-multiply opacity-80 group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <MapPin className="text-amber-500 w-10 h-10 opacity-90 drop-shadow-md" />
                  </div>
                </div>
                <span className="text-lg font-bold text-blue-950 group-hover:text-amber-600 transition-colors">{region.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

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

      <Footer />
    </div>
  );
}
