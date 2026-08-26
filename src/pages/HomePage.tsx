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
import { useNavigate, useSearchParams } from 'react-router-dom';
import LPASPublicPage from './LPASPublicPage';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdBanner } from '../components/AdBanner';
import { 
  halls, getStoredHalls, isProviderNameVisible, 
  providers as fallbackProviders, getPartnerLevel, 
  getServices, syncServicesFromApi, EventService, Hall 
} from '../data/mockData';
import { getInitialRegionsList } from '../data/homeMetroData';
import { getFullDateInfo } from '../utils/dateUtils';
import { useCalendar } from '../context/CalendarContext';

// Extracted Modular Sub-Components
import { HomeHeroSection, HeroSlide } from '../components/home/HomeHeroSection';
import { HomeFeaturedHalls } from '../components/home/HomeFeaturedHalls';
import { HomeMetroRegionGrid } from '../components/home/HomeMetroRegionGrid';
import { HomeIndependentServices } from '../components/home/HomeIndependentServices';
import { HomeTrustGuaranteesBar } from '../components/home/HomeTrustGuaranteesBar';
import { HomeCalendarBookingSection } from '../components/home/HomeCalendarBookingSection';
import { HomeSuccessPartnersSection } from '../components/home/HomeSuccessPartnersSection';
import { HomeModalsManager } from '../components/home/HomeModalsManager';

/**
 * دالة مساعدة لتحديد صورة الشريك بناءً على الفئة أو الاسم
 */
const getPartnerImage = (name: string): string | undefined => {
  const lowercaseName = name.toLowerCase();
  if (lowercaseName.includes('أطياف')) {
    return 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80';
  }
  if (lowercaseName.includes('ليلة')) {
    return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80';
  }
  if (lowercaseName.includes('الضيافة الذهبية')) {
    return 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=600&q=80';
  }
  if (lowercaseName.includes('لمسات')) {
    return 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=600&q=80';
  }
  if (lowercaseName.includes('الريم')) {
    return 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80';
  }
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
   */
  const [regionsList, setRegionsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_REGIONS');
      if (stored) return JSON.parse(stored);
    } catch {}
    return getInitialRegionsList();
  });

  const [hallsList, setHallsList] = useState<Hall[]>(() => getStoredHalls());

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
  const [drillLevel, setDrillLevel] = useState<'zones' | 'regions' | 'cities'>('zones');
  const [selectedGeoZoneId, setSelectedGeoZoneId] = useState<string>('');
  const [selectedAdminRegionId, setSelectedAdminRegionId] = useState<string>('');
  const [metroPageIndex, setMetroPageIndex] = useState<number>(0);

  // Services State
  const [servicesList, setServicesList] = useState<EventService[]>(() => getServices());
  const [selectedServiceCategory, setSelectedServiceCategory] = useState<string>('all');
  const [serviceCarouselIndex, setServiceCarouselIndex] = useState<number>(0);
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

  // Search widget state variables
  const [searchTerm, setSearchTerm] = useState('');
  const [searchRegion, setSearchRegion] = useState('');
  const [searchCity, setSearchCity] = useState('');
  const [searchCategory, setSearchCategory] = useState('');

  const availableCities = useMemo(() => {
    if (searchRegion) {
      const matched = regionsList.find((r: any) => r.name === searchRegion);
      if (matched && Array.isArray(matched.cities)) {
        return matched.cities;
      }
      return [];
    }
    const allCities = regionsList.flatMap((r: any) => r.cities || []);
    return Array.from(new Set(allCities)) as string[];
  }, [searchRegion, regionsList]);

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
      () => {
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
    id: string;
    name: string;
    type?: string;
    packageName?: string;
    rating?: string;
    bookingsCount: number;
  }[]>([]);

  useEffect(() => {
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
        const isOrg = p.type === 'منشأة';
        const isHigherTier = p.packageName === 'الباقة الاحترافية' || p.packageName === 'باقة الأعمال';
        const hasHighRating = Number(p.rating || 0) >= 4.5;
        const hasHighBookings = Number(p.bookingsCount || 0) >= 50;
        const isVisible = isProviderNameVisible(p.name);
        return p.isSuccessfulPartner && isOrg && isHigherTier && hasHighRating && hasHighBookings && isVisible;
      }).map((p: any) => ({
        id: String(p.id),
        name: p.name,
        type: p.type,
        packageName: p.packageName,
        rating: p.rating ? String(p.rating) : '4.9',
        bookingsCount: Number(p.bookingsCount) || 50
      }));

      partners.sort((a, b) => (b.bookingsCount || 0) - (a.bookingsCount || 0));
      setSuccessPartners(partners.slice(0, 30));
    }
  }, []);

  const approvedHalls = useMemo(() => hallsList.filter(h => h.status === 'approved' && h.activationStatus !== 'موقوف'), [hallsList]);
  
  const featuredHalls = useMemo(() => {
    const list = approvedHalls.filter(h => h.featured);
    const criteria = localStorage.getItem('SETTINGS_FEATURED_CRITERIA') || 'rating';
    
    const savedProvidersStr = localStorage.getItem('providersData');
    let provList: any[] = [];
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
        if (diff !== 0) return diff;
      }
      return 0;
    });

    let showcaseHalls = [...list];
    if (showcaseHalls.length < 20) {
      const remaining = approvedHalls.filter(h => !showcaseHalls.some(f => f.id === h.id));
      showcaseHalls = [...showcaseHalls, ...remaining];
    }
    return showcaseHalls.slice(0, 20);
  }, [approvedHalls]);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (searchRegion) params.append('regionFilter', searchRegion);
    if (searchCity) params.append('city', searchCity);
    if (searchCity) params.append('region', searchCity);
    if (searchCategory) params.append('category', searchCategory);
    navigate(`/explore?${params.toString()}`);
  };

  const [platformData, setPlatformData] = useState<any>({});
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides: HeroSlide[] = useMemo(() => {
    const mode = platformData.heroMode || 'static';
    const list: HeroSlide[] = [];

    const getStaticFallback = (): HeroSlide => {
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
    } else {
      list.push(getStaticFallback());
    }

    if (list.length === 0) list.push(getStaticFallback());
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

      {/* 1. Dynamic Hero Section */}
      <HomeHeroSection 
        slides={slides}
        currentSlide={currentSlide}
        setCurrentSlide={setCurrentSlide}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        searchRegion={searchRegion}
        handleRegionChange={handleRegionChange}
        regionsList={regionsList}
        searchCity={searchCity}
        handleCityChange={handleCityChange}
        availableCities={availableCities}
        searchCategory={searchCategory}
        setSearchCategory={setSearchCategory}
        handleSearch={handleSearch}
      />

      {/* 2. Featured Halls Bento Grid */}
      <HomeFeaturedHalls 
        featuredHalls={featuredHalls}
        approvedHalls={approvedHalls}
        openProviderChat={openProviderChat}
      />

      {/* 3. First Triple Ad section */}
      <section className="py-8 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdBanner placement="الإعلان العلوي الأول - الأيمن" layout="overlay" className="h-40" />
            <AdBanner placement="الإعلان العلوي الثاني - الأوسط" layout="overlay" className="h-40" />
            <AdBanner placement="الإعلان العلوي الثالث - الأيسر" layout="overlay" className="h-40" />
          </div>
        </div>
      </section>

      {/* 4. Discover Halls By Region - Metro UI Hierarchical Layout */}
      <HomeMetroRegionGrid 
        hallsList={hallsList}
        regionsList={regionsList}
        drillLevel={drillLevel}
        setDrillLevel={setDrillLevel}
        selectedGeoZoneId={selectedGeoZoneId}
        setSelectedGeoZoneId={setSelectedGeoZoneId}
        selectedAdminRegionId={selectedAdminRegionId}
        setSelectedAdminRegionId={setSelectedAdminRegionId}
        metroPageIndex={metroPageIndex}
        setMetroPageIndex={setMetroPageIndex}
      />

      {/* 5. Independent Services & Event Planner */}
      <HomeIndependentServices 
        servicesList={servicesList}
        selectedServiceCategory={selectedServiceCategory}
        setSelectedServiceCategory={setSelectedServiceCategory}
        serviceCarouselIndex={serviceCarouselIndex}
        setServiceCarouselIndex={setServiceCarouselIndex}
        setSelectedServiceForDetails={setSelectedServiceForDetails}
        setIsServiceDetailsOpen={setIsServiceDetailsOpen}
        setSelectedServiceForRequest={setSelectedServiceForRequest}
        setIsServiceRequestOpen={setIsServiceRequestOpen}
      />

      {/* 6. Trust & Guarantees Bar */}
      <HomeTrustGuaranteesBar />

      {/* Middle Wide Ad Banner */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 my-8">
        <AdBanner placement="الإعلان الأوسط - عريض" layout="banner" className="h-32 rounded-2xl shadow-xs" />
      </div>

      {/* 7. Interactive Calendar & Available Halls */}
      <HomeCalendarBookingSection 
        calendarType={calendarType}
        setCalendarType={setCalendarType}
        currentMonth={currentMonth}
        setCurrentMonth={setCurrentMonth}
        selectedDate={selectedDate}
        setSelectedDate={setSelectedDate}
        getFullDateInfo={getFullDateInfo}
        selectedPeriod={selectedPeriod}
        setSelectedPeriod={setSelectedPeriod}
        nearMeOnly={nearMeOnly}
        setNearMeOnly={setNearMeOnly}
        gpsLoading={gpsLoading}
        gpsError={gpsError}
        handleGpsFilter={handleGpsFilter}
        hallsList={hallsList}
        searchRegion={searchRegion}
        searchCity={searchCity}
        searchCategory={searchCategory}
        searchTerm={searchTerm}
        regionsList={regionsList}
        setSearchRegion={setSearchRegion}
        setSearchCity={setSearchCity}
        setSearchTerm={setSearchTerm}
        setSearchCategory={setSearchCategory}
      />

      {/* 8. Success Partners & How It Works & Call to Action */}
      <HomeSuccessPartnersSection 
        successPartners={successPartners}
        getPartnerImage={getPartnerImage}
        handleAddHallClick={handleAddHallClick}
      />

      {/* 9. Second Triple Ad */}
      <section className="py-8 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AdBanner placement="الإعلان السفلي الأول - الأيمن" layout="banner" className="h-32" />
            <AdBanner placement="الإعلان السفلي الثاني - الأوسط" layout="banner" className="h-32" />
            <AdBanner placement="الإعلان السفلي الثالث - الأيسر" layout="banner" className="h-32" />
          </div>
        </div>
      </section>

      {/* Modals & Dialogs Manager */}
      <HomeModalsManager 
        providerModal={providerModal}
        setProviderModal={setProviderModal}
        isProviderChatOpen={isProviderChatOpen}
        setIsProviderChatOpen={setIsProviderChatOpen}
        chatData={chatData}
        selectedServiceForDetails={selectedServiceForDetails}
        isServiceDetailsOpen={isServiceDetailsOpen}
        setIsServiceDetailsOpen={setIsServiceDetailsOpen}
        setSelectedServiceForDetails={setSelectedServiceForDetails}
        selectedServiceForRequest={selectedServiceForRequest}
        isServiceRequestOpen={isServiceRequestOpen}
        setIsServiceRequestOpen={setIsServiceRequestOpen}
        setSelectedServiceForRequest={setSelectedServiceForRequest}
        currentUserData={currentUserData}
        userBookings={userBookings}
      />

      <Footer />
    </div>
  );
}
