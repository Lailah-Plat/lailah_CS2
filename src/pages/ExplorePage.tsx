/**
 * ============================================================================
 * صفحة استكشاف القاعات والخدمات - منصة ليلة (Explore Halls & Services Page)
 * ============================================================================
 * English Description:
 * Exploration and discovery page for halls, resorts, camps, and ancillary services.
 * Features advanced multi-faceted filters, dynamic region/city binding synced with datastore,
 * calendar availability lookup, and card view mode toggling.
 *
 * الوصف بالعربية:
 * صفحة استكشاف وتصفح القاعات، المنتجعات، المخيمات والخدمات المساندة.
 * تتيح التصفية المتقدمة متعددة الخيارات، الربط الديناميكي بين المناطق والمدن المزامنة مع مخزن البيانات،
 * استعلام توفر التاريخ، والتبديل بين أنماط العرض.
 */

import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProviderChatModal from '../components/ProviderChatModal';
import { AdBanner } from '../components/AdBanner';
import { Search, MapPin, Filter, Star, Crown, SlidersHorizontal, Map, ChevronDown, CheckSquare, Square, MessageCircle, Building2, Package, X, CheckCircle2, User, Calendar, AlertTriangle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import { FavoriteHeartButton, HallPricingAndCompare, HallCapacityLabel, PricingPatternBadge, HallStatusBadges } from '../components/HallCardAddons';
import { halls, getServices, EventService, getPartnerLevel, providers, getStoredHalls, isProviderNameVisible, initialRegions } from '../data/mockData';
import ServiceDetailsModal from '../components/ServiceDetailsModal';
import RequestServiceModal from '../components/RequestServiceModal';

export default function ExplorePage() {
  const [searchParams] = useSearchParams();
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false');
  const [localHalls, setLocalHalls] = useState(() => getStoredHalls());

  useEffect(() => {
    const handleStorageChange = () => {
      setIsEnabled(localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false');
      setLocalHalls(getStoredHalls());
      setAllAvailableServices(getServices());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleStorageChange);
    window.addEventListener('hallsUpdated', handleStorageChange);
    window.addEventListener('servicesUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
      window.removeEventListener('hallsUpdated', handleStorageChange);
      window.removeEventListener('servicesUpdated', handleStorageChange);
    };
  }, []);

  // URL parameters extraction / استخراج بارامترات البحث من الرابط
  const urlCategory = searchParams.get('category');
  const urlRegionFilter = searchParams.get('regionFilter');
  const urlCityFilter = searchParams.get('city');
  const urlRegion = searchParams.get('region');
  const urlSearch = searchParams.get('search');
  const [selectedDateFilter, setSelectedDateFilter] = useState('');

  // Active section tab ('halls' | 'resorts' | 'camps' | 'services')
  const [activeTab, setActiveTab] = useState<'halls' | 'resorts' | 'camps' | 'services'>('halls');

  /**
   * قائمة المناطق والمدن من مخزن النظام (System Regions List)
   */
  const [regionsList, setRegionsList] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_REGIONS');
      if (stored) return JSON.parse(stored);
    } catch {}
    return initialRegions;
  });

  const [searchTerm, setSearchTerm] = useState(urlSearch || '');
  const [selectedRegion, setSelectedRegion] = useState(urlRegionFilter || '');
  const [selectedCity, setSelectedCity] = useState(urlCityFilter || urlRegion || '');
  const [selectedCategory, setSelectedCategory] = useState(urlCategory || '');

  /**
   * حساب قائمة المدن المتاحة بناءً على المنطقة المختارة
   * Dynamically calculate available cities based on active region
   */
  const availableCities = React.useMemo(() => {
    if (selectedRegion) {
      const matched = regionsList.find((r: any) => r.name === selectedRegion);
      if (matched && Array.isArray(matched.cities)) {
        return matched.cities;
      }
      return [];
    }
    const allCities = regionsList.flatMap((r: any) => r.cities || []);
    return Array.from(new Set(allCities));
  }, [selectedRegion, regionsList]);

  /**
   * معالجة تغيير المنطقة مع مسح استعلام المدينة في حال عدم التطابق
   * Handle Region change logic with automatic city reset
   */
  const handleRegionChange = (newRegion: string) => {
    setSelectedRegion(newRegion);
    if (newRegion) {
      const matched = regionsList.find((r: any) => r.name === newRegion);
      const cities = matched?.cities || [];
      if (selectedCity && !cities.includes(selectedCity)) {
        setSelectedCity('');
      }
    }
  };

  /**
   * معالجة اختيار المدينة مع الربط التلقائي بالمنطقة التابعة لها
   * Handle City change with parent region auto-selection
   */
  const handleCityChange = (newCity: string) => {
    setSelectedCity(newCity);
    if (newCity) {
      const parentRegion = regionsList.find((r: any) => Array.isArray(r.cities) && r.cities.includes(newCity));
      if (parentRegion) {
        setSelectedRegion(parentRegion.name);
      }
    }
  };
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [nearMe, setNearMe] = useState(false);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);

  const [isProviderChatOpen, setIsProviderChatOpen] = useState(false);
  const [chatData, setChatData] = useState({ providerName: '', hallName: '' });
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [gridColumns, setGridColumns] = useState<3 | 4 | 5>(() => {
    try {
      const saved = localStorage.getItem('EXPLORE_GRID_COLUMNS');
      if (saved && (saved === '3' || saved === '4' || saved === '5')) {
        return Number(saved) as 3 | 4 | 5;
      }
    } catch {}
    return 3;
  });

  const handleSetGridColumns = (cols: 3 | 4 | 5) => {
    setGridColumns(cols);
    try {
      localStorage.setItem('EXPLORE_GRID_COLUMNS', String(cols));
    } catch {}
    if (viewMode !== 'grid') {
      setViewMode('grid');
    }
  };

  const getGridColsClass = () => {
    if (viewMode === 'list') return 'flex flex-col gap-6';
    if (gridColumns === 5) {
      return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4';
    }
    if (gridColumns === 4) {
      return 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5';
    }
    return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8';
  };

  // For services modal
  const [selectedServiceToRequest, setSelectedServiceToRequest] = useState<EventService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [serviceForDetails, setServiceForDetails] = useState<EventService | null>(null);

  const handleOpenDetails = (service: EventService) => {
    setServiceForDetails(service);
    setIsDetailsModalOpen(true);
  };
  const [quantity, setQuantity] = useState(1);
  const [currentUserData, setCurrentUserData] = useState<any>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [isLinkedToBooking, setIsLinkedToBooking] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        setCurrentUserData(user);
        
        fetch('/api/bookings').then(res => res.json()).then(data => {
          if (Array.isArray(data)) {
            const userName = user.name || user.customerName || '';
            const myBookings = data.filter(b => b.customer === userName || b.email === user.email);
            setUserBookings(myBookings);
          }
        }).catch(() => {});
      }
    } catch(e) {}
  }, []);

  const [serviceDate, setServiceDate] = useState('');
  const [allAvailableServices, setAllAvailableServices] = useState(getServices());
  
  React.useEffect(() => {
    const urlDate = searchParams.get('date');
    if (urlDate) setSelectedDateFilter(urlDate);
  }, [searchParams]);

  const handleRequestService = (service: EventService) => {
    setSelectedServiceToRequest(service);
    setIsModalOpen(true);
    setIsSuccess(false);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceToRequest) return;
    
    const limit = selectedServiceToRequest.quantityLimit ? parseInt(selectedServiceToRequest.quantityLimit) : Infinity;
    if (quantity > limit) {
      return; 
    }
    
    let userId = 'GUEST';
    let customerName = 'عميل زائر';

    if (currentUserData) {
      userId = currentUserData.id || currentUserData.uid || 'USER-123';
      customerName = currentUserData.name || currentUserData.fullName || 'أحمد محمد';
    }

    const newRequest = {
      id: Date.now(),
      bookingId: isLinkedToBooking ? selectedBookingId : '',
      userId: userId,
      customerName: customerName,
      providerName: selectedServiceToRequest.provider || 'مزود خدمة',
      serviceName: selectedServiceToRequest.name || 'خدمة مساندة',
      date: serviceDate || new Date().toISOString().split('T')[0],
      status: 'قيد الانتظار',
      price: quantity * (selectedServiceToRequest.price || 0),
      quantity: quantity,
      paymentMethod: 'creditMax',
      paymentStatus: 'مدفوع'
    };

    const existingRequests = JSON.parse(localStorage.getItem('SUPPORT_SERVICE_REQUESTS') || '[]');
    localStorage.setItem('SUPPORT_SERVICE_REQUESTS', JSON.stringify([newRequest, ...existingRequests]));
    window.dispatchEvent(new Event('storage'));

    setIsSuccess(true);
    setTimeout(() => {
      setIsModalOpen(false);
      setSelectedServiceToRequest(null);
      setIsSuccess(false);
    }, 2500);
  };

  const openProviderChat = (e: React.MouseEvent, providerName: string, hallName: string) => {
    e.preventDefault();
    e.stopPropagation();
    setChatData({ providerName, hallName });
    setIsProviderChatOpen(true);
  };
  
  // Static list of possible features and services for filter
  const allFeatures = ['موقف خاص للسيارات', 'تكييف مركزي', 'مسبح خاص', 'انترنت مجاني', 'إضاءة ليزر', 'شواية'];
  const allServices = ['تنسيق ورد طبيعي', 'تصوير فوتوغرافي', 'خدمة ضيافة كاملة', 'DJ وعازف عود', 'تجهيز ملعب صابوني', 'ذبائح وطبخ'];

  const toggleFeature = (f: string) => {
    setSelectedFeatures(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  const toggleService = (s: string) => {
    setSelectedServices(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  };

  useEffect(() => {
    if (urlCategory) {
      if (urlCategory.includes('استراحة') || urlCategory.includes('شاليه') || urlCategory.includes('استراحات')) {
         setActiveTab('resorts');
         if (urlCategory === 'استراحات') {
           setSelectedCategory('');
         } else {
           setSelectedCategory(urlCategory);
         }
      } else if (urlCategory.includes('منتجع') || urlCategory.includes('مخيم') || urlCategory.includes('منتزه')) {
         setActiveTab('camps');
         setSelectedCategory(urlCategory);
      } else {
         setActiveTab('halls');
         setSelectedCategory(urlCategory);
      }
    }
    if (urlRegionFilter) {
      setSelectedRegion(urlRegionFilter);
    }
    if (urlCityFilter) {
      setSelectedCity(urlCityFilter);
    } else if (urlRegion) {
      setSelectedCity(urlRegion);
    }
    if (urlSearch) {
      setSearchTerm(urlSearch);
    }
  }, [urlCategory, urlRegion, urlRegionFilter, urlCityFilter, urlSearch]);

  useEffect(() => {
    if (activeTab === 'halls') {
      const allowed = ['قاعة أفراح', 'قاعة اجتماعات', 'قاعة فندقية', 'قاعة مؤتمرات'];
      if (selectedCategory && !allowed.includes(selectedCategory)) {
        setSelectedCategory('');
      }
    } else if (activeTab === 'resorts') {
      const allowed = ['استراحة', 'استراحة قسمين', 'استراحة قسم', 'شاليه'];
      if (selectedCategory && !allowed.includes(selectedCategory)) {
        setSelectedCategory('');
      }
    } else if (activeTab === 'camps') {
      const allowed = ['منتجع', 'مخيم', 'منتزه', 'متنزه'];
      if (selectedCategory && !allowed.includes(selectedCategory)) {
        setSelectedCategory('');
      }
    } else if (activeTab === 'services') {
      const allowed = ['بوفيه وضيافة', 'تصوير', 'تنسيق قاعات', 'تصوير سينمائي', 'دي جي وفِرق', 'أخرى'];
      if (selectedCategory && !allowed.includes(selectedCategory)) {
        setSelectedCategory('');
      }
    }
  }, [activeTab, selectedCategory]);

  const filteredHalls = localHalls.map(hall => {
    // Determine corrected category to avoid inappropriate fallback of "قاعة أفراح" in other tabs
    let correctedCategory = hall.category || '';
    const hallName = hall.name || '';
    
    // Normalize or match categories according to requested tabs
    if (hallName.includes('شاليه') || correctedCategory.includes('شاليه')) {
      correctedCategory = 'شاليه';
    } else if (hallName.includes('منتجع') || correctedCategory.includes('منتجع')) {
      correctedCategory = 'منتجع';
    } else if (hallName.includes('مخيم') || correctedCategory.includes('مخيم')) {
      correctedCategory = 'مخيم';
    } else if (hallName.includes('منتزه') || correctedCategory.includes('منتزه') || hallName.includes('متنزه') || correctedCategory.includes('متنزه')) {
      correctedCategory = 'متنزه';
    } else if (hallName.includes('اجتماع') || correctedCategory.includes('اجتماع') || hallName.includes('مؤتم') || correctedCategory.includes('مؤتم') || correctedCategory.includes('ندوة') || correctedCategory.includes('ندوات')) {
      correctedCategory = 'قاعة اجتماعات';
    } else if (hallName.includes('فندق') || correctedCategory.includes('فندق') || correctedCategory.includes('فندقية')) {
      correctedCategory = 'قاعة فندقية';
    } else if (hallName.includes('أفراح') || correctedCategory.includes('أفراح') || correctedCategory.includes('زفاف')) {
      correctedCategory = 'قاعة أفراح';
    } else if (hallName.includes('استراحة') || correctedCategory.includes('استراحة')) {
      if (hallName.includes('قسمين') || correctedCategory.includes('قسمين')) {
        correctedCategory = 'استراحة قسمين';
      } else {
        correctedCategory = 'استراحة قسم';
      }
    } else {
      // Fallback based on activeTab
      if (activeTab === 'resorts') {
        correctedCategory = 'استراحة قسم';
      } else if (activeTab === 'camps') {
        correctedCategory = 'منتجع';
      } else if (activeTab === 'halls') {
        correctedCategory = 'قاعة أفراح';
      }
    }
    return { ...hall, category: correctedCategory };
  }).filter(hall => {
    // Admin status check: only approved halls show up for clients
    const isMainActive = hall.status === 'approved' || hall.status === 'مفعل' || hall.status === 'active' || hall.status === 'نشط';
    if (!isMainActive) return false;

    // Administrative status (الحالة الإدارية): if 'موقوف' (suspended), do not show to clients
    const isNotSuspended = hall.activationStatus !== 'موقوف';
    if (!isNotSuspended) return false;

    // Provider booking selection check: if 'موقوفة' (stopped/hidden), do not show to clients
    const isNotStopped = hall.bookingStatus !== 'موقوفة' && hall.bookingStatus !== 'موقوف';
    if (!isNotStopped) return false;

    const hallCity = hall.city || '';
    const hallCategory = hall.category || '';
    const hallName = hall.name || '';

    const matchesSearch = hallName.includes(searchTerm) || hallCity.includes(searchTerm);
    const matchesRegion = selectedRegion === '' || hall.region === selectedRegion || availableCities.includes(hallCity);
    const matchesCity = selectedCity === '' || hallCity === selectedCity;
    
    // Tab filter strictly as requested
    let matchesTab = true;
    if (activeTab === 'halls') {
      matchesTab = ['قاعة أفراح', 'قاعة اجتماعات', 'قاعة فندقية', 'قاعة مؤتمرات'].includes(hallCategory);
    } else if (activeTab === 'resorts') {
      matchesTab = ['استراحة قسم', 'استراحة قسمين', 'شاليه', 'استراحة'].includes(hallCategory);
    } else if (activeTab === 'camps') {
      matchesTab = ['منتجع', 'منتزه', 'متنزه', 'مخيم'].includes(hallCategory);
    } else {
      matchesTab = false;
    }

    let matchesCategory = true;
    if (selectedCategory !== '') {
      matchesCategory = hallCategory.includes(selectedCategory);
    }

    let matchesDate = true;
    if (selectedDateFilter) {
      const day = parseInt(selectedDateFilter.split('-')[2]);
      const hallIdNum = isNaN(parseInt(String(hall.id))) ? 1 : parseInt(String(hall.id));
      matchesDate = !isNaN(day) ? (hallIdNum + day) % 3 !== 0 : true;
    }

    // Safeguard features array
    let hallFeatures: string[] = [];
    if (Array.isArray(hall.features)) {
      hallFeatures = hall.features;
    } else if (typeof hall.features === 'string') {
      try {
        hallFeatures = JSON.parse(hall.features || '[]');
      } catch (e) {
        hallFeatures = [];
      }
    }

    // Safeguard extraServicesList
    let hallExtraServicesList: any[] = [];
    if (Array.isArray(hall.extraServicesList)) {
      hallExtraServicesList = hall.extraServicesList;
    } else if (typeof hall.extraServicesList === 'string') {
      try {
        hallExtraServicesList = JSON.parse(hall.extraServicesList || '[]');
      } catch (e) {
        hallExtraServicesList = [];
      }
    }

    const matchesFeatures = selectedFeatures.length === 0 || selectedFeatures.every(f => hallFeatures.includes(f));
    const matchesServices = selectedServices.length === 0 || selectedServices.every(s => hallExtraServicesList.some(xs => xs && typeof xs === 'object' && (xs.name || '').includes(s)));

    return matchesSearch && matchesRegion && matchesCity && matchesTab && matchesCategory && matchesFeatures && matchesServices && matchesDate;
  }).map(hall => {
    // Mock distance for near me
    const mockDistance = (Math.random() * 15 + 1).toFixed(1);
    return { ...hall, mockDistance };
  });

  if (nearMe) {
    filteredHalls.sort((a, b) => parseFloat(a.mockDistance) - parseFloat(b.mockDistance));
  }
  
  const filteredServices = allAvailableServices.filter(service => {
    const serviceCity = service.city || '';
    const serviceCategory = service.category || '';
    const serviceName = service.name || '';
    const sAny = service as any;

    const isApproved = sAny.status === 'approved' || sAny.adminStatus === 'approved';
    if (!isApproved) return false;

    // Administrative status (الحالة الإدارية): if 'موقوف' (suspended), do not show to clients
    const isNotSuspended = sAny.activationStatus !== 'موقوف';
    if (!isNotSuspended) return false;
    const matchesSearch = serviceName.includes(searchTerm) || serviceCity.includes(searchTerm);
    const matchesCity = selectedCity === '' || serviceCity === selectedCity;
    const matchesCategory = selectedCategory === '' || serviceCategory.includes(selectedCategory);
    return matchesSearch && matchesCity && matchesCategory;
  }).map(service => {
    const mockDistance = (Math.random() * 15 + 1).toFixed(1);
    return { ...service, mockDistance };
  });

  if (nearMe) {
    filteredServices.sort((a, b) => parseFloat(a.mockDistance) - parseFloat(b.mockDistance));
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <AdBanner placement="شريط الإعلان العلوي" layout="banner" className="border-none" />
      <main className={`flex-grow ${gridColumns === 5 && viewMode === 'grid' ? 'max-w-[1700px]' : gridColumns === 4 && viewMode === 'grid' ? 'max-w-[1480px]' : 'max-w-7xl'} mx-auto px-4 md:px-6 w-full py-12 transition-all duration-300`}>
        
        {/* Header Section */}
        <div className="mb-10 text-center max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-blue-950 mb-4">اكتشف أفضل الأماكن والخدمات لمناسبتك</h1>
          <p className="text-slate-500 text-lg">تصفح مجموعة واسعة من قاعات الأفراح، الاستراحات، والشاليهات، بالإضافة للخدمات المساندة في جميع أنحاء المملكة</p>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5 flex-wrap justify-center">
            <button 
              onClick={() => setActiveTab('halls')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'halls' 
                  ? 'bg-blue-950 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Building2 className="w-5 h-5" />
              القاعات
            </button>
            <button 
              onClick={() => setActiveTab('resorts')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'resorts' 
                  ? 'bg-blue-950 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Crown className="w-5 h-5" />
              الاستراحات والشاليهات
            </button>
            <button 
              onClick={() => setActiveTab('camps')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'camps' 
                  ? 'bg-blue-950 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Map className="w-5 h-5" />
              المنتجعات والمخيمات
            </button>
            <button 
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${
                activeTab === 'services' 
                  ? 'bg-blue-950 text-white shadow-md' 
                  : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <Package className="w-5 h-5" />
              الخدمات المساندة
            </button>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-10 sticky top-24 z-40">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute right-3 top-3 w-5 h-5 text-slate-400 group-focus-within:text-amber-500" />
              <input 
                type="text" 
                placeholder={activeTab === 'services' ? "ابحث عن خدمة، مصور، منسق..." : "ابحث عن قاعة، استراحة..."}
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="relative">
              <Calendar className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
              <input 
                type="date" 
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all bg-white text-slate-700 font-sans"
                value={selectedDateFilter}
                onChange={(e) => setSelectedDateFilter(e.target.value)}
              />
            </div>
            {/* Dynamic Region Select */}
            <div className="relative">
              <Map className="absolute right-3 top-3 w-5 h-5 text-amber-500" />
              <select 
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all appearance-none bg-white text-slate-700 font-medium text-sm"
                value={selectedRegion}
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

            {/* Dynamic City Select */}
            <div className="relative flex gap-2">
              <div className="relative flex-grow">
                <MapPin className="absolute right-3 top-3 w-5 h-5 text-blue-600" />
                <select 
                  className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all appearance-none bg-white text-slate-700 font-medium text-sm"
                  value={selectedCity || ''}
                  onChange={(e) => handleCityChange(e.target.value)}
                >
                  <option value="">
                    {selectedRegion ? `جميع مدن ${selectedRegion} (${availableCities.length})` : 'جميع المدن'}
                  </option>
                  {availableCities.map((c: string) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <button 
                onClick={() => setNearMe(!nearMe)}
                className={`flex-shrink-0 px-3 py-2.5 rounded-xl border transition-all flex items-center gap-1 font-medium text-sm ${nearMe ? 'bg-amber-50 border-amber-500 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}
                title="اقرب الأماكن لي"
              >
                <Map className="w-5 h-5" />
                <span className="hidden lg:inline">الأقرب لي</span>
              </button>
            </div>
            <div className="relative">
              <Filter className="absolute right-3 top-3 w-5 h-5 text-slate-400" />
              <select 
                className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all appearance-none bg-white text-slate-700"
                value={selectedCategory || ''}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">جميع الفئات</option>
                {activeTab === 'halls' && (
                  <>
                    <option value="قاعة أفراح">قاعة أفراح</option>
                    <option value="قاعة اجتماعات">قاعة اجتماعات</option>
                    <option value="قاعة فندقية">قاعة فندقية</option>
                  </>
                )}
                {activeTab === 'resorts' && (
                  <>
                    <option value="استراحة قسم">استراحة قسم واحد</option>
                    <option value="استراحة قسمين">استراحة قسمين</option>
                    <option value="شاليه">شاليه</option>
                  </>
                )}
                {activeTab === 'camps' && (
                  <>
                    <option value="منتجع">منتجع</option>
                    <option value="متنزه">متنزه</option>
                    <option value="مخيم">مخيم</option>
                  </>
                )}
                {activeTab === 'services' && (
                  <>
                    <option value="بوفيه وضيافة">بوفيه وضيافة</option>
                    <option value="تصوير">تصوير</option>
                    <option value="تنسيق قاعات">تنسيق قاعات</option>
                    <option value="تصوير سينمائي">تصوير سينمائي</option>
                    <option value="دي جي وفِرق">دي جي وفِرق</option>
                    <option value="أخرى">أخرى</option>
                  </>
                )}
              </select>
            </div>
            {(activeTab === 'halls' || activeTab === 'resorts' || activeTab === 'camps') && (
              <button 
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="bg-blue-950 hover:bg-blue-900 text-white py-2.5 rounded-xl font-bold shadow-md transition-colors w-full flex items-center justify-center gap-2"
              >
                <SlidersHorizontal className="w-5 h-5" /> بحث متقدم
              </button>
            )}
          </div>
          
          {/* Advanced Filters Section */}
          {(activeTab === 'halls' || activeTab === 'resorts' || activeTab === 'camps') && showAdvanced && (
            <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h4 className="font-bold text-blue-950 mb-3">المرافق المتوفرة</h4>
                <div className="grid grid-cols-2 gap-3">
                  {allFeatures.map(feature => (
                    <label key={feature} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-amber-600 transition-colors">
                      {selectedFeatures.includes(feature) ? 
                        <CheckSquare className="w-5 h-5 text-amber-500" /> : 
                        <Square className="w-5 h-5 text-slate-300" />
                      }
                      <span className="text-sm font-medium">{feature}</span>
                      <input type="checkbox" className="hidden" checked={selectedFeatures.includes(feature)} onChange={() => toggleFeature(feature)} />
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-bold text-blue-950 mb-3">الخدمات الإضافية</h4>
                <div className="grid grid-cols-2 gap-3">
                  {allServices.map(service => (
                    <label key={service} className="flex items-center gap-2 cursor-pointer text-slate-700 hover:text-amber-600 transition-colors">
                      {selectedServices.includes(service) ? 
                        <CheckSquare className="w-5 h-5 text-amber-500" /> : 
                        <Square className="w-5 h-5 text-slate-300" />
                      }
                      <span className="text-sm font-medium">{service}</span>
                      <input type="checkbox" className="hidden" checked={selectedServices.includes(service)} onChange={() => toggleService(service)} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results */}
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <span>{activeTab === 'services' ? 'الخدمات المتاحة' : 'الأماكن المتاحة'}</span>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
              {(activeTab === 'services' ? filteredServices : filteredHalls).length}
            </span>
          </h2>
          
          <div className="flex items-center gap-3">
            {/* Grid Columns Controls (3, 4, 5) */}
            <div className="flex items-center bg-white rounded-xl p-1 border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-400 px-2 select-none">الأعمدة:</span>
              <div className="flex items-center gap-1">
                {([3, 4, 5] as const).map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSetGridColumns(num)}
                    className={`w-8 h-8 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                      gridColumns === num && viewMode === 'grid'
                        ? 'bg-amber-500 text-white shadow-xs scale-105'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-amber-600'
                    }`}
                    title={`عرض ${num} بطاقات في الصف الواحد`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        <AdBanner placement="نتائج البحث (صفحة استكشاف)" layout="card" className="mb-8" />

        {(activeTab === 'halls' || activeTab === 'resorts' || activeTab === 'camps') ? (
          filteredHalls.length > 0 ? (
            viewMode === 'table' ? (
              <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
                <table className="w-full text-right text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">الاسم</th>
                      <th className="px-6 py-4 font-bold">الفئة</th>
                      <th className="px-6 py-4 font-bold">المدينة</th>
                      <th className="px-6 py-4 font-bold">السعر</th>
                      <th className="px-6 py-4 font-bold text-center">التقييم</th>
                      <th className="px-6 py-4 font-bold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHalls.map((hall) => {
                      const providerData = providers.find(p => p.name === hall.provider);
                      const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;
                      return (
                        <tr key={hall.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-blue-950 flex flex-col">
                            <div className="flex items-center gap-3">
                              <img src={hall.image} alt={hall.name} className="w-12 h-12 rounded-lg object-cover" />
                              <div className="flex flex-col">
                                <span className="flex items-center gap-2">
                                  {hall.name}
                                  {hall.bookingStatus === 'صيانة' && (
                                    <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded text-[10px] font-black border border-rose-250 animate-pulse">تحت الصيانة</span>
                                  )}
                                </span>
                              </div>
                            </div>
                            {partnerLevel && (
                              <div className="mt-1 pr-15 text-right w-fit">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${partnerLevel.bg} ${partnerLevel.color} ${partnerLevel.border} shadow-sm`}>
                                  <span>{partnerLevel.icon}</span>
                                  <span>{partnerLevel.name}</span>
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">{hall.category}</td>
                          <td className="px-6 py-4">{hall.city}</td>
                          <td className="px-6 py-4 font-bold text-orange-500">{hall.price.toLocaleString()} ريال</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {hall.rating}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link to={`/hall/${hall.id}${selectedDateFilter ? `?date=${selectedDateFilter}` : ''}`} className="text-amber-600 hover:text-amber-700 font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors inline-block whitespace-nowrap">عرض التفاصيل</Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={getGridColsClass()}>
                {filteredHalls.map((hall, index) => {
                  const providerData = providers.find(p => p.name === hall.provider);
                  const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;
                  return (
                    <React.Fragment key={hall.id}>
                      <div className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/90 group flex ${viewMode === 'list' ? 'flex-col md:flex-row md:min-h-[280px]' : gridColumns === 5 ? 'flex-col min-h-[470px]' : gridColumns === 4 ? 'flex-col min-h-[495px]' : 'flex-col min-h-[520px]'} relative`}>
                        {/* Full-Card Background Image spanning completely to the bottom */}
                        <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                          <img 
                            src={hall.image} 
                            alt={hall.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                          />
                          
                          {/* Smooth Full-Height Panoramic Gradient Overlays */}
                          {/* Vertical Gradient Fade (Grid & Mobile) */}
                          <div className={`absolute inset-0 bg-gradient-to-t from-white via-white/90 via-45% to-black/30 ${viewMode === 'list' ? 'md:hidden' : ''}`} />
                          
                          {/* Horizontal Gradient Fade (Desktop List Mode in RTL) */}
                          {viewMode === 'list' && (
                            <div className="hidden md:block absolute inset-0 bg-gradient-to-l from-white via-white/95 via-50% to-transparent" />
                          )}
                        </div>

                        {/* Top Badges & Floating Controls Layer */}
                        <div className="relative z-10 p-3 sm:p-4 pb-0 flex justify-between items-start">
                          <div className="flex flex-col gap-2 items-start">
                            <div className="bg-blue-950/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-white shadow-sm flex items-center gap-1">
                              {hall.category}
                            </div>
                            <PricingPatternBadge bookingType={hall.bookingType} />
                            {partnerLevel && (
                              <div className={`${partnerLevel.bg}/90 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold ${partnerLevel.color} shadow-sm border ${partnerLevel.border}`}>
                                {partnerLevel.icon} {partnerLevel.name}
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 sm:gap-2">
                            {hall.featured && (
                              <div className="bg-white/95 backdrop-blur-sm px-2 sm:px-2.5 py-1 rounded-full text-[9px] font-bold text-amber-600 flex items-center gap-1 shadow-sm">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> مميزة
                              </div>
                            )}
                            <HallStatusBadges status={hall.status} bookingStatus={hall.bookingStatus} />
                            <FavoriteHeartButton hallId={hall.id} />
                          </div>
                        </div>

                        {/* Spacer to showcase panoramic image header in grid mode */}
                        <div className={`relative z-10 pointer-events-none ${viewMode === 'list' ? 'h-16 md:hidden' : gridColumns === 5 ? 'h-24 sm:h-28' : 'h-32 sm:h-36'}`}>
                          {nearMe && (
                            <div className="absolute bottom-2 right-4 bg-emerald-600/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1 pointer-events-auto">
                              <MapPin className="w-3.5 h-3.5" /> تبعد {hall.mockDistance} كم
                            </div>
                          )}
                        </div>

                        {/* Content Body sitting cleanly on full-height white fade */}
                        <div className="p-4 sm:p-5 md:p-6 pt-2 flex-grow flex flex-col justify-between relative z-10">
                          <div>
                            <div className="flex justify-between items-start mb-3">
                              <h3 className="text-lg sm:text-xl font-bold text-blue-950 group-hover:text-amber-600 transition-colors flex items-center gap-2">
                                 {hall.name}
                                 {localStorage.getItem('IS_AUTHENTICATED') === 'true' && (
                                   <button onClick={(e) => openProviderChat(e, hall.provider, hall.name)} className="text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 p-1.5 rounded-lg" title="مراسلة المزود">
                                      <MessageCircle className="w-5 h-5" />
                                   </button>
                                 )}
                              </h3>
                              <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-700 bg-white/90 backdrop-blur-xs px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                                <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
                                {hall.rating}
                              </div>
                            </div>
                            <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" /> {hall.city}
                            </p>
                            {hall.showProvider !== false && isProviderNameVisible(hall.provider) && (
                              <div className="bg-slate-50/90 backdrop-blur-xs rounded-xl p-2.5 mb-2 flex items-center justify-between border border-slate-200/70 shadow-2xs">
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

                            {/* 3 Shift Pricing and Compare Box */}
                            <HallPricingAndCompare hall={hall} />
                          </div>
                          <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                            <HallCapacityLabel capacity={hall.capacity} />
                            <Link to={`/hall/${hall.id}${selectedDateFilter ? `?date=${selectedDateFilter}` : ''}`} className="bg-white border-2 border-slate-200 hover:border-amber-500 text-blue-950 hover:text-amber-600 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-xs">
                              التفاصيل
                            </Link>
                          </div>
                        </div>
                      </div>

                      {/* In-feed Ad after every 3 items */}
                      {(index === 2 || (index > 2 && (index + 1) % 6 === 0)) && (
                        <div className={viewMode === 'list' ? "w-full my-2" : "col-span-1"}>
                          <AdBanner placement="بين بطاقات القاعات في صفحة الاستكشاف" layout={viewMode === 'list' ? 'banner' : 'native_hall'} className="h-full" />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            )
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
              <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-950 mb-2">لا توجد نتائج مطابقة</h3>
              <p className="text-slate-500">حاول تغيير معايير البحث أو تصفح الفئات الأخرى</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCity(''); setSelectedCategory(''); setSelectedFeatures([]); setSelectedServices([]); setNearMe(false); }}
                className="mt-6 text-amber-600 font-bold hover:underline"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          )
        ) : (
          filteredServices.length > 0 ? (
            viewMode === 'table' ? (
              <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
                <table className="w-full text-right text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">الاسم</th>
                      <th className="px-6 py-4 font-bold">الفئة</th>
                      <th className="px-6 py-4 font-bold">مقدم الخدمة</th>
                      <th className="px-6 py-4 font-bold">السعر</th>
                      <th className="px-6 py-4 font-bold text-center">التقييم</th>
                      <th className="px-6 py-4 font-bold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredServices.map((service) => {
                      const providerData = providers.find(p => p.name === service.provider);
                      const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;
                      return (
                        <tr key={service.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-blue-950 flex flex-col">
                            <div className="flex items-center gap-3">
                              <img 
                                src={service.image} 
                                alt={service.name} 
                                className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-100" 
                                onClick={() => handleOpenDetails(service)}
                                title="عرض تفاصيل الخدمة الفاخرة"
                              />
                              {service.name}
                            </div>
                            {partnerLevel && (
                              <div className="mt-1 pr-15 text-right w-fit">
                                <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold border ${partnerLevel.bg} ${partnerLevel.color} ${partnerLevel.border} shadow-sm`}>
                                  <span>{partnerLevel.icon}</span>
                                  <span>{partnerLevel.name}</span>
                                </span>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4">{service.category}</td>
                          <td className="px-6 py-4">
                            {isProviderNameVisible(service.provider) ? (
                              <Link 
                                to={`/provider-profile/${encodeURIComponent(service.provider)}`}
                                className="font-bold text-blue-950 hover:text-amber-600 underline decoration-amber-400 decoration-1 underline-offset-2 transition-colors"
                              >
                                {service.provider}
                              </Link>
                            ) : (
                              <span className="text-slate-500">مزود خدمة معتمد</span>
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-orange-500">{service.price} ريال</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {service.rating}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleRequestService(service)} className="text-amber-600 hover:text-amber-700 font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors inline-block whitespace-nowrap">طلب الخدمة</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
            <div className={getGridColsClass()}>
              {filteredServices.map((service) => {
                const providerData = providers.find(p => p.name === service.provider);
                const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;
                return (
                  <div key={service.id} className={`bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100/90 group flex ${viewMode === 'list' ? 'flex-col md:flex-row md:min-h-[280px]' : gridColumns === 5 ? 'flex-col min-h-[450px]' : gridColumns === 4 ? 'flex-col min-h-[475px]' : 'flex-col min-h-[500px]'} relative`}>
                    {/* Full-Card Background Image spanning completely to the bottom */}
                    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
                      <img 
                        src={service.image} 
                        alt={service.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                      />
                      
                      {/* Smooth Full-Height Panoramic Gradient Overlays */}
                      {/* Vertical Gradient Fade (Grid & Mobile) */}
                      <div className={`absolute inset-0 bg-gradient-to-t from-white via-white/90 via-45% to-black/30 ${viewMode === 'list' ? 'md:hidden' : ''}`} />
                      
                      {/* Horizontal Gradient Fade (Desktop List Mode in RTL) */}
                      {viewMode === 'list' && (
                        <div className="hidden md:block absolute inset-0 bg-gradient-to-l from-white via-white/95 via-50% to-transparent" />
                      )}
                    </div>

                    {/* Top Badges & Floating Controls Layer */}
                    <div className="relative z-10 p-3 sm:p-4 pb-0 flex justify-between items-start">
                      <div className="flex flex-col gap-2 items-start">
                        <div className="bg-blue-950/85 backdrop-blur-md px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold text-white shadow-sm flex items-center gap-1">
                          {service.category}
                        </div>
                        {partnerLevel && (
                          <div className={`${partnerLevel.bg}/90 backdrop-blur-sm px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full text-[9px] sm:text-[10px] font-bold ${partnerLevel.color} shadow-sm border ${partnerLevel.border}`}>
                            {partnerLevel.icon} {partnerLevel.name}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Spacer to showcase panoramic image header in grid mode */}
                    <div className={`relative z-10 pointer-events-none ${viewMode === 'list' ? 'h-16 md:hidden' : gridColumns === 5 ? 'h-24 sm:h-28' : 'h-32 sm:h-36'}`}>
                      {nearMe && (
                        <div className="absolute bottom-2 right-4 bg-emerald-600/95 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-white shadow-sm flex items-center gap-1 pointer-events-auto">
                          <MapPin className="w-3.5 h-3.5" /> تبعد {service.mockDistance} كم
                        </div>
                      )}
                    </div>

                    {/* Content Body sitting cleanly on full-height white fade */}
                    <div className="p-4 sm:p-5 md:p-6 pt-2 flex-grow flex flex-col justify-between relative z-10">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <h3 
                            className="text-lg sm:text-xl font-bold text-blue-950 group-hover:text-amber-600 transition-colors flex items-center gap-2 cursor-pointer"
                            onClick={() => handleOpenDetails(service)}
                          >
                             {service.name}
                             {localStorage.getItem('IS_AUTHENTICATED') === 'true' && (
                               <button onClick={(e) => { e.stopPropagation(); openProviderChat(e, service.provider, service.name); }} className="text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 p-1.5 rounded-lg" title="مراسلة المزود">
                                  <MessageCircle className="w-5 h-5" />
                               </button>
                             )}
                          </h3>
                          <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-700 bg-white/90 backdrop-blur-xs px-2 sm:px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-2xs">
                            <Star className="w-3.5 h-3.5 sm:w-4 sm:h-4 fill-amber-500 text-amber-500" />
                            {service.rating}
                          </div>
                        </div>
                        <p className="text-slate-500 text-xs sm:text-sm mb-3 sm:mb-4 flex items-center gap-1.5 font-medium">
                          <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" /> {service.city}
                        </p>
                        {isProviderNameVisible(service.provider) && (
                          <div className="bg-slate-50/90 backdrop-blur-xs rounded-xl p-2.5 mb-4 flex items-center justify-between border border-slate-200/70 shadow-2xs">
                             <div className="flex items-center gap-2 overflow-hidden">
                                <span className="text-xs text-slate-400 shrink-0">مقدم الخدمة:</span>
                                <Link 
                                  to={`/provider-profile/${encodeURIComponent(service.provider)}`} 
                                  className="text-xs font-bold text-blue-950 hover:text-amber-600 transition-colors truncate underline decoration-amber-400 decoration-1 underline-offset-2"
                                  title="عرض ملف الشريك والموثوقية"
                                >
                                  {service.provider}
                                </Link>
                             </div>
                             <Link 
                                to={`/provider-profile/${encodeURIComponent(service.provider)}`} 
                                className="text-[10px] font-extrabold text-amber-800 bg-amber-100/80 hover:bg-amber-200 px-2 py-0.5 rounded-full transition-colors shrink-0 flex items-center gap-1"
                             >
                                <span>ملف الشريك</span>
                                <span>💎</span>
                             </Link>
                          </div>
                        )}
                      </div>
                      <div className="flex justify-between items-center pt-5 border-t border-slate-100 mt-4">
                        <div>
                          <span className="block text-xs text-slate-400 mb-0.5">يبدأ من</span>
                          <span className="text-lg font-bold text-orange-500">{service.price} <span className="text-sm font-medium">ريال</span></span>
                        </div>
                        <button onClick={() => handleRequestService(service)} className="bg-white border-2 border-slate-200 hover:border-amber-500 text-blue-950 hover:text-amber-600 px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-xs">
                          طلب الخدمة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
              <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-2xl font-bold text-blue-950 mb-2">لا توجد خدمات مطابقة</h3>
              <p className="text-slate-500">حاول تغيير معايير البحث أو تصفح الفئات الأخرى</p>
              <button 
                onClick={() => { setSearchTerm(''); setSelectedCity(''); setSelectedCategory(''); setNearMe(false); }}
                className="mt-6 text-amber-600 font-bold hover:underline"
              >
                مسح جميع الفلاتر
              </button>
            </div>
          )
        )}
      </main>

      {/* Request Service Modal */}
      <RequestServiceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        service={selectedServiceToRequest}
        currentUserData={currentUserData}
        userBookings={userBookings}
        onSuccess={() => {}}
      />

      <ProviderChatModal isOpen={isProviderChatOpen} onClose={() => setIsProviderChatOpen(false)} providerName={chatData.providerName} hallName={chatData.hallName} />

      <ServiceDetailsModal 
        isOpen={isDetailsModalOpen} 
        onClose={() => setIsDetailsModalOpen(false)} 
        service={serviceForDetails} 
        onRequest={handleRequestService} 
      />

      <Footer />
    </div>
  );
}
