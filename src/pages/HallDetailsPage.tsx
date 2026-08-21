import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProviderChatModal from '../components/ProviderChatModal';
import BookingInvoice from '../components/BookingInvoice';
import { AdBanner } from '../components/AdBanner';
import { 
  MapPin, Users, Star, MessageSquare, CheckCircle2, ChevronRight, Info, X, Map, 
  CreditCard, MessageCircle, Crown, Shield, AlertTriangle, Check, Play, Compass, 
  ImageIcon, ShieldCheck, ChevronDown, Award, Sparkles, Building, Layers, Eye,
  ArrowLeft, ArrowRight, ExternalLink, Calendar, Clock
} from 'lucide-react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import { getPartnerLevel, providers, getStoredHalls, isProviderNameVisible } from '../data/mockData';
import { SubscriptionFlow } from './SubscriptionPage';
import { getFullDateInfo } from '../utils/dateUtils';
import { ReviewModal } from '../components/modals/ReviewModal';

export default function HallDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const urlDate = searchParams.get('date');
  
  const [hallsList, setHallsList] = useState(() => getStoredHalls());
  const currentHall = hallsList.find(h => String(h.id) === id);
  const providerData = providers.find(p => p.name === currentHall?.provider);
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false');

  useEffect(() => {
    const handleStorageChange = () => {
      setIsEnabled(localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false');
      setHallsList(getStoredHalls());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleStorageChange);
    window.addEventListener('hallsUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
      window.removeEventListener('hallsUpdated', handleStorageChange);
    };
  }, []);

  const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;

  const [activeImage, setActiveImage] = useState<string>('');

  useEffect(() => {
    if (currentHall) {
      setActiveImage(currentHall.image || '');
    }
  }, [currentHall]);

  const [guests, setGuests] = useState('0');
  const [fromDate, setFromDate] = useState(urlDate || '');
  const [toDate, setToDate] = useState(urlDate || '');
  const [period, setPeriod] = useState('evening');
  const [services, setServices] = useState<string[]>([]);
  const [notes, setNotes] = useState('');
  
  // Custom states for progressive decision making
  const [activeTabNav, setActiveTabNav] = useState('overview-section');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [is360ModalOpen, setIs360ModalOpen] = useState(false);
  const [isFloorPlanModalOpen, setIsFloorPlanModalOpen] = useState(false);
  const [isBeforeAfterModalOpen, setIsBeforeAfterModalOpen] = useState(false);
  const [beforeAfterView, setBeforeAfterView] = useState<'after' | 'before'>('after');
  const [faqOpenIndex, setFaqOpenIndex] = useState<number | null>(0);

  // Custom states for booking strategies and external partner services
  const [selectedPackageId, setSelectedPackageId] = useState<string>('');
  const [activePackageDetail, setActivePackageDetail] = useState<any | null>(null);
  const [selectedExternalServices, setSelectedExternalServices] = useState<string[]>([]);
  const [isExternalModalOpen, setIsExternalModalOpen] = useState(false);

  const EXTERNAL_PARTNERS_SERVICES = [
    { id: 'ext-cater', name: 'خدمات ضيافة بوفيه ملكي (شريك خارجي)', price: 4500, desc: 'بوفيه طعام فاخر ومشروبات ساخنة وباردة تحت إشراف طهاة دوليين.' },
    { id: 'ext-florist', name: 'تنسيق ورد طبيعي فاخر (شريك خارجي)', price: 2000, desc: 'تزيين الممر، الطاولات، والكوشة بأحدث تصاميم الورد الطبيعي المستورد.' },
    { id: 'ext-media', name: 'تصوير سينمائي وجوي احترافي (شريك خارجي)', price: 3500, desc: 'تصوير فيديو بدقة 4K مع تصوير درون جوي وألبوم صور حراري للمناسبة.' },
    { id: 'ext-lighting', name: 'إضاءة مسرح ومؤثرات بصرية (شريك خارجي)', price: 1500, desc: 'أجهزة ليزر، بخار، وإضاءة مسرح متحركة متناغمة مع الموسيقى.' }
  ];
  
  const [isProviderChatOpen, setIsProviderChatOpen] = useState(false);

  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isBookingSuccess, setIsBookingSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('creditMax');
  const [bookingError, setBookingError] = useState<string | null>(null);

  const paymentSettings = useMemo(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      if (stored) return JSON.parse(stored);
    } catch(e){}
    return { mada: true, creditMax: true, apple: true, stc: true, google_pay: false, tabby: true, tamara: true, bank_transfer: true };
  }, [isBookingModalOpen]);
  
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [isReviewSubmitted, setIsReviewSubmitted] = useState(false);
  const [reviewSort, setReviewSort] = useState('newest');
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewModalTargetType, setReviewModalTargetType] = useState<'hall' | 'service' | 'provider'>('hall');

  const user = useMemo(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : {};
    } catch {
      return {};
    }
  }, []);
  const customerName = user.name || user.customerName || 'عميل منتظم';
  const customerPhone = user.phone || '0500000000';

  const scrollToSection = (sectionId: string) => {
    setActiveTabNav(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const periodOptions = useMemo(() => {
    const options = [];
    if (currentHall) {
      const isPackages = currentHall.bookingType === 'packages';
      let source: any = currentHall;
      
      if (isPackages) {
        const packages = currentHall.packagesList || [];
        const selectedPkg = packages.find((p: any) => p.id === selectedPackageId) || packages[0];
        if (selectedPkg) {
          source = selectedPkg;
        }
      }

      const mPrice = source.morningPrice !== undefined && source.morningPrice !== '' ? Number(source.morningPrice) : (isPackages ? 0 : Number(currentHall.morningPrice || 0));
      if (mPrice && mPrice > 0) {
        options.push({ value: 'morning', label: 'صباحي', price: mPrice });
      }

      let nPrice = source.nightPrice !== undefined && source.nightPrice !== '' ? Number(source.nightPrice) : undefined;
      if (nPrice === undefined && isPackages) {
        nPrice = source.price !== undefined && source.price !== '' ? Number(source.price) : undefined;
      }
      if (nPrice === undefined) {
        nPrice = Number(currentHall.nightPrice || currentHall.price || 0);
      }

      if (nPrice && nPrice > 0) {
        options.push({ value: 'evening', label: 'مسائي', price: nPrice });
      }

      const fPrice = source.fullDayPrice !== undefined && source.fullDayPrice !== '' ? Number(source.fullDayPrice) : (isPackages ? 0 : Number(currentHall.fullDayPrice || 0));
      if (fPrice && fPrice > 0) {
        options.push({ value: 'full', label: 'كامل اليوم', price: fPrice });
      }
    }

    if (options.length === 0 && currentHall) {
      options.push({ value: 'evening', label: 'مسائي', price: Number(currentHall.price || 0) });
    }
    return options;
  }, [currentHall, selectedPackageId]);

  useEffect(() => {
    if (periodOptions.length > 0) {
      const exists = periodOptions.some(opt => opt.value === period);
      if (!exists) {
        setPeriod(periodOptions[0].value);
      }
    }
  }, [periodOptions, period]);

  useEffect(() => {
    if (isBookingModalOpen) {
      const enabledKeys = [
        'mada', 'creditMax', 'apple', 'stc', 'google_pay', 'tabby', 'tamara', 'bank_transfer'
      ].filter(k => paymentSettings[k]);
      if (enabledKeys.length > 0 && !enabledKeys.includes(paymentMethod)) {
        setPaymentMethod(enabledKeys[0]);
      }
    }
  }, [isBookingModalOpen, paymentSettings, paymentMethod]);

  const refParam = searchParams.get('ref') || searchParams.get('ambassador') || searchParams.get('affiliate');
  useEffect(() => {
    if (refParam) {
      try {
        localStorage.setItem('layla_referral_code', refParam);
        localStorage.setItem('layla_ambassador_ref', refParam);
      } catch (e) {}
    }
  }, [refParam]);

  const isApproved = currentHall && (
    currentHall.status === 'approved' ||
    currentHall.status === 'مفعل' ||
    currentHall.status === 'active' ||
    currentHall.status === 'نشط' ||
    currentHall.status === undefined
  ) && !currentHall.isArchived && currentHall.status !== 'مؤرشفة';

  const isSuspended = currentHall && (
    currentHall.activationStatus === 'موقوف' ||
    currentHall.bookingStatus === 'موقوفة' ||
    currentHall.bookingStatus === 'موقوف' ||
    currentHall.isArchived === true
  );

  // Alternative recommendations if unavailable
  const alternativeHalls = useMemo(() => {
    const activeOnes = hallsList.filter(h => 
      String(h.id) !== String(id) && 
      !h.isArchived && 
      h.status !== 'مؤرشفة' && 
      h.activationStatus !== 'موقوف'
    );
    if (currentHall?.city) {
      const sameCity = activeOnes.filter(h => h.city === currentHall.city);
      if (sameCity.length > 0) return sameCity.slice(0, 3);
    }
    return activeOnes.slice(0, 3);
  }, [hallsList, currentHall, id]);

  if (!currentHall || !isApproved || isSuspended) {
    const isArchived = currentHall?.isArchived || currentHall?.status === 'مؤرشفة';
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col pt-12" dir="rtl">
        <Header />
        <div className="flex-1 max-w-4xl mx-auto w-full flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 bg-amber-100 text-amber-700 rounded-3xl flex items-center justify-center mb-4 shadow-sm border border-amber-200">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <span className="text-xs font-black text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full mb-3">
            {isArchived ? 'هذه المنشأة مؤرشفة حالياً' : 'المنشأة غير متاحة حالياً'}
          </span>
          <h2 className="text-2xl md:text-3xl font-black text-slate-900 mb-2">
            {isArchived ? 'تمت أرشفة هذه القاعة ولا تقبل حجوزات جديدة' : 'القاعة المطلوبة غير متاحة للحجز حالياً'}
          </h2>
          <p className="text-slate-600 text-sm max-w-lg mb-8 leading-relaxed">
            {isArchived 
              ? 'تم حفظ وأرشفة هذه القاعة التزاماً بمعايير الحوكمة المالية وحفظ العقود السابقة. يمكنك استعراض قاعات ومرافق مميزة أخرى بديلة أدناه.'
              : 'لقد تم إيقاف عرض هذه المنشأة مؤقتاً من قبل الإدارة أو الشريك. تفضل باكتشاف بدائل مطابقة بنفس المواصفات.'}
          </p>

          {/* Alternative Recommendations Grid */}
          {alternativeHalls.length > 0 && (
            <div className="w-full text-right mb-8">
              <h3 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                قاعات بديلة مقترحة ومتاحة للحجز الفوري:
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {alternativeHalls.map((alt) => (
                  <Link
                    key={alt.id}
                    to={`/hall/${alt.id}${refParam ? `?ref=${encodeURIComponent(refParam)}` : ''}`}
                    className="bg-white border border-slate-200 hover:border-amber-400 rounded-2xl overflow-hidden p-3 text-right group transition-all hover:shadow-md block"
                  >
                    <div className="h-32 rounded-xl overflow-hidden bg-slate-100 mb-2.5 relative">
                      <img 
                        src={alt.image || '/placeholder.jpg'} 
                        alt={alt.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-md font-bold">
                        {alt.city || 'الرياض'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-xs mb-1 line-clamp-1 group-hover:text-amber-700 transition-colors">
                      {alt.name}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>السعة: {alt.capacity || alt.guests || 200}</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {alt.price ? `${alt.price.toLocaleString()} ر.س` : 'حسب الباقة'}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Link 
              to="/explore" 
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-6 py-3 rounded-xl transition-all shadow-md"
            >
              استعراض كافة القاعات والخدمات
            </Link>
            <Link 
              to="/" 
              className="bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs px-6 py-3 rounded-xl transition-all"
            >
              الرئيسية
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const allImages = useMemo(() => {
    const list = currentHall.images || [];
    if (currentHall.image && !list.includes(currentHall.image)) {
      return [currentHall.image, ...list];
    }
    return list.length > 0 ? list : ['/placeholder.jpg'];
  }, [currentHall]);

  const nationalAddress = currentHall.nationalAddress || (() => {
    const districtMap: Record<string, string> = {
      'الرياض': 'حي الياسمين',
      'جدة': 'حي أبحر الشمالية',
      'الدمام': 'حي الشاطئ',
      'بارق': 'حي الرداد',
      'الخبر': 'حي الحزام الذهبي',
      'الجبيل': 'حي جلمودة'
    };
    const district = districtMap[currentHall.city] || 'حي اليرموك';
    const num = 1000 + (currentHall.name.charCodeAt(0) * 123) % 8999;
    const pin = 10000 + (currentHall.name.charCodeAt(1) * 321) % 89999;
    return `${num} طريق الملك عبد العزيز - ${district} - ${currentHall.city || 'الرياض'} ${pin}`;
  })();

  const mapCoords = useMemo(() => {
    const cityCoords: Record<string, { lat: number; lon: number }> = {
      'الرياض': { lat: 24.7136, lon: 46.6753 },
      'جدة': { lat: 21.4858, lon: 39.1925 },
      'الدمام': { lat: 26.4207, lon: 50.0888 },
      'مكة': { lat: 21.3891, lon: 39.8579 },
      'مكة المكرمة': { lat: 21.3891, lon: 39.8579 },
      'المدينة': { lat: 24.4672, lon: 39.6112 },
      'المدينة المنورة': { lat: 24.4672, lon: 39.6112 },
      'أبها': { lat: 18.2164, lon: 42.5053 },
      'الطائف': { lat: 21.2636, lon: 40.4062 },
      'الخبر': { lat: 26.2167, lon: 50.1833 },
      'الجبيل': { lat: 27.0112, lon: 49.6583 },
      'بارق': { lat: 18.9167, lon: 41.9167 }
    };

    const city = currentHall.city || 'الرياض';
    let base = cityCoords[city] || cityCoords['الرياض'];

    const seed = nationalAddress.split('').reduce((acc: number, val: string) => acc + val.charCodeAt(0), 0);
    const latOffset = ((seed % 75) - 37.5) * 0.0003;
    const lonOffset = (((seed * 3) % 75) - 37.5) * 0.0003;
    const lat = base.lat + latOffset;
    const lon = base.lon + lonOffset;

    const delta = 0.004;
    return {
      lat,
      lon,
      bbox: `${lon - delta}%2C${lat - delta}%2C${lon + delta}%2C${lat + delta}`
    };
  }, [currentHall.city, nationalAddress]);

  const extraServicesList = currentHall.extraServicesList || [];

  const availableExternalServices = useMemo(() => {
    const internalNames = (extraServicesList || []).map((s: any) => (s.name + ' ' + (s.desc || '')).toLowerCase());
    return EXTERNAL_PARTNERS_SERVICES.filter(ext => {
      if (ext.id === 'ext-cater' && internalNames.some(n => n.includes('بوفيه') || n.includes('ضيافة') || n.includes('طعام') || n.includes('عشاء'))) {
        return false;
      }
      if (ext.id === 'ext-florist' && internalNames.some(n => n.includes('ورد') || n.includes('تزيين') || n.includes('كوشة') || n.includes('طاولات'))) {
        return false;
      }
      if (ext.id === 'ext-media' && internalNames.some(n => n.includes('تصوير') || n.includes('فيديو') || n.includes('ألبوم'))) {
        return false;
      }
      if (ext.id === 'ext-lighting' && internalNames.some(n => n.includes('إضاءة') || n.includes('ليزر') || n.includes('مسرح'))) {
        return false;
      }
      return true;
    });
  }, [extraServicesList]);

  const handleServiceToggle = (id: string) => {
    setServices(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const handleExternalServiceToggle = (id: string) => {
    setSelectedExternalServices(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const getPackagePriceForPeriod = (pkg: any, prd: string) => {
    if (prd === 'morning' && pkg.morningPrice && Number(pkg.morningPrice) > 0) return Number(pkg.morningPrice);
    if (prd === 'evening' && pkg.nightPrice && Number(pkg.nightPrice) > 0) return Number(pkg.nightPrice);
    if (prd === 'evening' && pkg.price && Number(pkg.price) > 0) return Number(pkg.price);
    if (prd === 'full' && pkg.fullDayPrice && Number(pkg.fullDayPrice) > 0) return Number(pkg.fullDayPrice);
    return Number(pkg.price || 0);
  };

  const getBookingDetails = () => {
    let days = 1;
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      const diffTime = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      if (diffDays > 0) {
        days = diffDays;
      } else {
        days = 0;
      }
    }

    const selectedOption = periodOptions.find(opt => opt.value === period) || periodOptions[0] || { price: 0, label: 'مسائي' };
    const currentPeriodPrice = selectedOption.price;

    let basePrice = currentPeriodPrice * days;
    const bookingType = currentHall.bookingType || 'alacarte';

    let servicesPrice = 0;
    if (bookingType === 'alacarte') {
      services.forEach(id => {
        const service = extraServicesList.find(s => s.id === id);
        if (service) servicesPrice += service.price;
      });
    }

    let externalServicesPrice = 0;
    selectedExternalServices.forEach(id => {
      const extSrv = EXTERNAL_PARTNERS_SERVICES.find(s => s.id === id);
      if (extSrv) externalServicesPrice += extSrv.price;
    });

    const total = basePrice + servicesPrice + externalServicesPrice;
    const subTotal = total;
    const baseAmount = Math.round((total / 1.15) * 100) / 100;
    const taxAmount = Math.round((total - baseAmount) * 100) / 100;
    const securityDeposit = Number(currentHall.securityDeposit || 1000);
    const depositAmount = Math.round(total * 0.25);
    const remainingAmount = total - depositAmount;

    return {
      days,
      basePrice,
      servicesPrice,
      externalServicesPrice,
      subTotal,
      baseAmount,
      taxAmount,
      securityDeposit,
      total,
      depositAmount,
      remainingAmount,
      periodLabel: selectedOption.label
    };
  };

  const bookingDetails = getBookingDetails();

  const handleBookNow = () => {
    setIsBookingModalOpen(true);
    setIsBookingSuccess(false);
  };

  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingGateway, setProcessingGateway] = useState<string | null>(null);

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingError(null);
    
    let activeGatewayKey = 'moyasar';
    try {
      const stored = localStorage.getItem('ADMIN_ENABLED_GATEWAYS');
      const enabled = stored ? JSON.parse(stored) : {
        moyasar: true, hyperpay: false, paytabs: false, geidea: false, tabby_api: true, tamara_api: true
      };
      
      if (paymentMethod === 'tabby') activeGatewayKey = 'tabby_api';
      else if (paymentMethod === 'tamara') activeGatewayKey = 'tamara_api';
      else {
        const standardKeys = ['moyasar', 'hyperpay', 'paytabs', 'geidea'];
        const activeStandard = standardKeys.find(k => enabled[k]);
        activeGatewayKey = activeStandard || localStorage.getItem('ADMIN_ACTIVE_GATEWAY') || 'moyasar';
      }
    } catch (e) {
      activeGatewayKey = localStorage.getItem('ADMIN_ACTIVE_GATEWAY') || 'moyasar';
    }

    const gatewaysMap: Record<string, string> = {
      moyasar: 'مُيسر (Moyasar)', hyperpay: 'هايبر باي (HyperPay)', paytabs: 'بي تابس (PayTabs)',
      geidea: 'جيديا (Geidea)', tabby_api: 'تابي (Tabby)', tamara_api: 'تمارا (Tamara)'
    };
    const selectedGateway = gatewaysMap[activeGatewayKey] || 'مُيسر (Moyasar)';

    const srvs = services.map(s => {
      const sId = parseInt(s.replace(/\D/g, '')) || 1;
      return { serviceId: sId, quantity: 1 };
    });

    const bType = currentHall.bookingType || 'alacarte';
    const chosenPkg = bType === 'packages' 
      ? (currentHall.packagesList?.find((p: any) => p.id === selectedPackageId) || currentHall.packagesList?.[0]) 
      : null;

    const bookingPayload = {
      customerName,
      customerPhone,
      customerEmail: user.email || null,
      userId: user.id || null,
      hallId: isNaN(parseInt(currentHall.id)) ? 1 : parseInt(currentHall.id),
      startTime: fromDate || new Date().toISOString(),
      endTime: toDate || new Date().toISOString(),
      guests: parseInt(guests) || 50,
      services: srvs,
      amount: bookingDetails.total,
      paymentStatus: paymentMethod === 'bank_transfer' ? 'pending' : 'مدفوع',
      bookingType: bType,
      packageName: chosenPkg ? chosenPkg.name : null,
      selectedAddons: JSON.stringify(services),
      externalServices: JSON.stringify(selectedExternalServices),
      subTotal: bookingDetails.subTotal,
      taxAmount: bookingDetails.taxAmount,
      depositAmount: bookingDetails.depositAmount,
      paymentMethod: paymentMethod
    };

    const processPaymentAndBook = async () => {
      try {
        const response = await fetch('/api/bookings/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bookingPayload)
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'فشلت عملية إكمال الحجز والدفع.');
        }

        window.dispatchEvent(new Event('booking_updated'));
        setIsBookingSuccess(true);
      } catch (err: any) {
        console.error('Error creating booking:', err);
        setBookingError(err.message || 'حدث خطأ غير متوقع أثناء معالجة عملية الحجز والدفع.');
      }
    };

    if (paymentMethod !== 'bank_transfer') {
      setProcessingGateway(selectedGateway);
      setPaymentProcessing(true);
      setTimeout(() => {
        setPaymentProcessing(false);
        processPaymentAndBook();
      }, 2500);
    } else {
      processPaymentAndBook();
    }
  };

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
      const newRev = {
        id: `rev-${Date.now()}`,
        targetType: reviewData.targetType,
        targetId: reviewData.targetId,
        targetName: reviewData.targetName,
        providerName: reviewData.providerName || (currentHall?.provider || ''),
        customerName: reviewData.customerName || (user?.name || user?.email || 'عميل منصة ليلة'),
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date().toISOString().split('T')[0],
        status: 'published'
      };
      const updatedList = [newRev, ...allReviewsList];
      localStorage.setItem('allReviews', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage'));

      if (reviewData.targetType === 'hall' && currentHall) {
        const newHallReview = {
          id: Date.now(),
          author: newRev.customerName,
          rating: newRev.rating,
          text: newRev.comment,
          date: newRev.date
        };
        currentHall.reviews = [newHallReview, ...(currentHall.reviews || [])];
        const newCount = currentHall.reviews.length;
        const newAvg = Number((currentHall.reviews.reduce((acc: number, curr: any) => acc + Number(curr.rating || 0), 0) / newCount).toFixed(1));
        currentHall.rating = newAvg;
        currentHall.reviewsCount = newCount;
      }

      setIsReviewSubmitted(true);
      setTimeout(() => setIsReviewSubmitted(false), 4000);
      return true;
    } catch {
      return false;
    }
  };

  const handleReviewSubmit = () => {
    if (reviewText.trim()) {
      handleModalSubmitReview({
        targetType: 'hall',
        targetId: currentHall?.id || id || '',
        targetName: currentHall?.name || 'قاعة مناسبات',
        providerName: currentHall?.provider || '',
        rating: reviewRating,
        comment: reviewText
      });
      setReviewText('');
      setReviewRating(5);
    }
  };

  const sortedReviews = [...(currentHall.reviews || [])].sort((a, b) => {
    if (reviewSort === 'positive') return b.rating - a.rating;
    if (reviewSort === 'detailed') return b.text.length - a.text.length;
    return 0;
  });

  const packageComparisonList = [
    { key: 'hall', label: 'حجز القاعة والمنشأة كاملة' },
    { key: 'catering', label: 'خدمات الضيافة والبوفيه' },
    { key: 'decor', label: 'تنسيق الطاولات والكوشة والورود' },
    { key: 'lighting', label: 'الإضاءة المسرحية والمؤثرات' },
    { key: 'sound', label: 'أجهزة الصوت والدي جي' },
    { key: 'staff', label: 'طاقم المباشرات والصبابات' },
    { key: 'bridal', label: 'جناح خاص لتجهيز العروس' },
    { key: 'security', label: 'تنظيم وحراسة المواقف' }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <AdBanner placement="شريط الإعلان العلوي" layout="banner" className="border-none" />
      
      <main className="flex-grow w-full pb-20">
        
        {/* 1. HERO MEDIA GALLERY (معرض الوسائط التفاعلي) */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pt-6 mb-4">
          <div className="relative rounded-3xl overflow-hidden shadow-md group bg-slate-900 h-[380px] md:h-[460px]">
            <img 
              src={activeImage || currentHall.image}
              alt={currentHall.name} 
              className="w-full h-full object-cover transition-all duration-500 group-hover:scale-102"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/20 pointer-events-none"></div>

            {/* Top Interactive Badges on Hero Image */}
            <div className="absolute top-4 right-4 left-4 flex flex-wrap justify-between items-center gap-2 z-10">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-blue-950/90 backdrop-blur-md text-amber-400 font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 border border-amber-500/20 shadow">
                  <Crown className="w-3.5 h-3.5" />
                  {currentHall.category || 'قاعة مناسبات'}
                </span>
                <span className="bg-emerald-500/90 backdrop-blur-md text-white font-bold px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  تم التحقق من المنشأة
                </span>
              </div>

              <button
                onClick={() => {
                  const idx = allImages.indexOf(activeImage || currentHall.image);
                  setLightboxIndex(idx >= 0 ? idx : 0);
                  setIsLightboxOpen(true);
                }}
                className="bg-white/90 hover:bg-white text-slate-900 font-extrabold px-3.5 py-1.5 rounded-xl text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow cursor-pointer"
              >
                <Eye className="w-4 h-4 text-amber-600" />
                <span>تكبير الصور ({allImages.length})</span>
              </button>
            </div>

            {/* Bottom Floating Interactive Media Triggers */}
            <div className="absolute bottom-4 right-4 left-4 flex flex-wrap gap-2 z-10">
              <button
                onClick={() => {
                  setLightboxIndex(0);
                  setIsLightboxOpen(true);
                }}
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 font-bold px-3.5 py-2 rounded-xl text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-amber-400" />
                <span>معرض الصور ({allImages.length})</span>
              </button>

              <button
                onClick={() => setIsVideoModalOpen(true)}
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 font-bold px-3.5 py-2 rounded-xl text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow cursor-pointer hover:border-amber-400"
              >
                <Play className="w-4 h-4 text-emerald-400 fill-emerald-400" />
                <span>فيديو توضيحي 🎥</span>
              </button>

              <button
                onClick={() => setIs360ModalOpen(true)}
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 font-bold px-3.5 py-2 rounded-xl text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow cursor-pointer hover:border-purple-400"
              >
                <Compass className="w-4 h-4 text-purple-400 animate-spin" />
                <span>جولة 360° افتراضية 🔄</span>
              </button>

              <button
                onClick={() => setIsFloorPlanModalOpen(true)}
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 font-bold px-3.5 py-2 rounded-xl text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow cursor-pointer hover:border-blue-400"
              >
                <Layers className="w-4 h-4 text-blue-400" />
                <span>مخطط القاعة 📐</span>
              </button>

              <button
                onClick={() => setIsBeforeAfterModalOpen(true)}
                className="bg-slate-900/80 hover:bg-slate-900 text-white border border-white/20 font-bold px-3.5 py-2 rounded-xl text-xs backdrop-blur-md transition-all flex items-center gap-1.5 shadow cursor-pointer hover:border-amber-400"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>قبل/بعد التجهيز 📸</span>
              </button>
            </div>
          </div>

          {/* Gallery Thumbnails Strip */}
          <div className="flex gap-3 overflow-x-auto pt-3 pb-1 scrollbar-thin">
            {allImages.map((img, i) => {
              const isActive = (activeImage || currentHall.image) === img;
              return (
                <button 
                  key={i} 
                  onClick={() => setActiveImage(img)}
                  className={`flex-shrink-0 w-28 h-20 rounded-2xl overflow-hidden border-2 transition-all duration-200 cursor-pointer ${
                    isActive 
                      ? 'border-amber-500 ring-4 ring-amber-500/20 scale-102 shadow-md' 
                      : 'border-transparent hover:border-slate-300 opacity-80 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt={`Thumbnail ${i}`} className="w-full h-full object-cover" />
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. STICKY INTERNAL SECTION NAVIGATION (شريط التنقل الداخلي) */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-y border-slate-200/80 shadow-sm py-2.5 px-4 md:px-6 my-4 overflow-hidden">
          <div className="max-w-7xl mx-auto flex items-center justify-start gap-3 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex items-center gap-1.5 md:gap-2.5 shrink-0">
              {[
                { id: 'overview-section', label: 'نبذة', icon: Info },
                { id: 'why-us-section', label: 'لماذا هذا المكان؟', icon: Award },
                { id: 'features-section', label: 'المرافق والأنشطة', icon: CheckCircle2 },
                { id: 'location-section', label: 'الموقع', icon: MapPin },
                { id: 'policies-section', label: 'السياسات والعقد', icon: Shield },
                { id: 'provider-section', label: 'المزود', icon: Building },
                { id: 'faq-section', label: 'الأسئلة الشائعة', icon: MessageSquare },
                { id: 'reviews-section', label: 'التقييمات', icon: Star },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => scrollToSection(tab.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs md:text-sm font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                    activeTabNav === tab.id
                      ? 'bg-blue-950 text-amber-400 shadow-md scale-102 font-extrabold'
                      : 'bg-slate-100/80 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4 text-amber-500" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN CONTAINER (LAYOUT GRID) */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 flex flex-col lg:flex-row gap-8 items-start pt-2">
          
          {/* LEFT INFORMATION COLUMN (65% WIDTH) */}
          <div className="lg:order-2 lg:w-[65%] space-y-10 w-full">
            
            {/* Quick Summary Header under Title */}
            <div id="overview-section" className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-slate-200 text-slate-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                  {currentHall.category}
                </span>
                <span className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                  {currentHall.rating || '4.9'} ({currentHall.reviewsCount || currentHall.reviews?.length || 15} تقييم)
                </span>
                {partnerLevel && (
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold border ${partnerLevel.bg} ${partnerLevel.color} ${partnerLevel.border} shadow-sm`}>
                    <span>{partnerLevel.icon}</span>
                    <span>{partnerLevel.name}</span>
                  </span>
                )}
              </div>

              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-3xl md:text-4xl font-black text-blue-950 mb-2 flex items-center gap-3">
                    {currentHall.name}
                    {localStorage.getItem('IS_AUTHENTICATED') === 'true' && (
                      <button onClick={() => setIsProviderChatOpen(true)} className="text-amber-500 hover:text-amber-600 transition-colors bg-amber-50 hover:bg-amber-100 p-2 rounded-xl border border-amber-200 shadow-sm" title="مراسلة المزود">
                         <MessageCircle className="w-5 h-5" />
                      </button>
                    )}
                  </h1>
                  <p className="text-slate-500 flex items-center gap-2 text-base md:text-lg font-medium">
                    <MapPin className="w-5 h-5 text-amber-500 shrink-0" />
                    {currentHall.location} - {currentHall.city}
                  </p>
                </div>
              </div>

              {/* Fast Facts Banner */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60 flex items-center gap-2.5 hover:bg-slate-100/60 transition-colors">
                  <div className="w-7 h-7 bg-blue-50/90 text-blue-600 rounded-lg flex items-center justify-center shrink-0 border border-blue-100">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium leading-none">السعة القصوى</span>
                    <strong className="text-xs font-bold text-slate-800 block mt-1 truncate">{currentHall.capacity} ضيف</strong>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60 flex items-center gap-2.5 hover:bg-slate-100/60 transition-colors">
                  <div className="w-7 h-7 bg-emerald-50/90 text-emerald-600 rounded-lg flex items-center justify-center shrink-0 border border-emerald-100">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium leading-none">حالة التوثيق</span>
                    <strong className="text-xs font-bold text-emerald-700 block mt-1 truncate">معتمدة وموثقة</strong>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60 flex items-center gap-2.5 hover:bg-slate-100/60 transition-colors">
                  <div className="w-7 h-7 bg-amber-50/90 text-amber-600 rounded-lg flex items-center justify-center shrink-0 border border-amber-100">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium leading-none">سرعة التأكيد</span>
                    <strong className="text-xs font-bold text-slate-700 block mt-1 truncate">خلال ساعة</strong>
                  </div>
                </div>

                <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-200/60 flex items-center gap-2.5 hover:bg-slate-100/60 transition-colors">
                  <div className="w-7 h-7 bg-purple-50/90 text-purple-600 rounded-lg flex items-center justify-center shrink-0 border border-purple-100">
                    <Crown className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[10px] text-slate-400 block font-medium leading-none">السعر الابتدائي</span>
                    <strong className="text-xs font-bold text-amber-700 block mt-1 truncate">{currentHall.price} ر.س</strong>
                  </div>
                </div>
              </div>

              {/* PARTNER LEVEL & PERFORMANCE TRANSPARENCY CARD (بطاقة مستوى الشراكة وشفافية الأداء) */}
              {isEnabled && (
                <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/90 space-y-4 my-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-200/80">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-black text-blue-950">شفافية الأداء ومستوى الشراكة</h4>
                          <span className="bg-amber-100/80 text-amber-800 text-[10px] font-black px-2.5 py-0.5 rounded-full border border-amber-300/80">
                            مؤشرات معتمدة
                          </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                          مزود الخدمة المسؤول: <span className="font-bold text-slate-800">{currentHall?.provider || 'مؤسسة معتمدة'}</span>
                        </p>
                      </div>
                    </div>

                    {partnerLevel && (
                      <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-black border ${partnerLevel.bg} ${partnerLevel.color} ${partnerLevel.border} shadow-sm`}>
                        <span className="text-sm">{partnerLevel.icon}</span>
                        <span>{partnerLevel.name}</span>
                      </div>
                    )}
                  </div>

                  {/* Performance Metrics Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 text-[10px] block font-bold">إجمالي الحجوزات</span>
                      <span className="text-sm font-black text-amber-600 mt-0.5 block">
                        {providerData?.bookingsCount || (currentHall as any)?.bookingsCount || 24}+ حجز مؤكد
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 text-[10px] block font-bold">التقييم وسجلات الرضا</span>
                      <span className="text-sm font-black text-emerald-700 mt-0.5 block flex items-center gap-1">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 inline" />
                        {providerData?.rating || currentHall?.rating || 4.9} / 5.0
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 text-[10px] block font-bold">معدل الاستجابة والقبول</span>
                      <span className="text-sm font-black text-blue-700 mt-0.5 block">
                        أقل من 15 دقيقة (99%)
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                      <span className="text-slate-500 text-[10px] block font-bold">التوثيق والتراخيص</span>
                      <span className="text-sm font-black text-purple-700 mt-0.5 block flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                        هوية محققة وسجل تجاري
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Description Paragraph */}
              <div className="space-y-3 py-2">
                <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3">عن المكان</h3>
                <p className="text-slate-600 leading-relaxed text-sm md:text-base font-medium">
                  {currentHall.description || 'منشأة فاخرة مجهزة بأحدث تقنيات الإضاءة والصوتيات مع كوشة مميزة وتنسيق طاولات عصري يناسب كافة المناسبات والأعراس.'}
                </p>
                
                <div className="pt-2 flex flex-wrap gap-2 text-xs font-bold text-slate-700">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">الأعراس وحفلات الزفاف</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">حفلات الملكة والخطوبة</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">حفلات التخرج</span>
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">المؤتمرات والفعاليات</span>
                </div>
              </div>
            </div>

            {/* BOARD: WHY CHOOSE THIS VENUE ("لوحة لماذا تختار هذا المكان؟") */}
            <section id="why-us-section" className="bg-gradient-to-br from-blue-950 to-indigo-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="flex items-center gap-2 mb-4">
                <Award className="w-6 h-6 text-amber-400" />
                <h3 className="text-xl font-black text-white">لماذا تختار {currentHall.name}؟</h3>
              </div>
              <p className="text-slate-300 text-xs md:text-sm mb-6 leading-relaxed">
                أهم المزايا والضمانات التي تجعل هذا المكان خياراً مثالياً لليلة عمرك بنجاح واطمئنان:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-white mb-1">منشأة معتمدة 100%</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">مطابقة لكافة الاشتراطات الرسمية وتراخيص السلامة في المنطقة.</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-white mb-1">إلغاء مرن وسياسة واضحة</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">ضمان استرجاع العربون أو تعديل الموعد وفق الشروط المعلنة.</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                  <Crown className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-white mb-1">أكثر من 500 حجز ناجح</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">خبرة واسعة في إدارة الفعاليات مع تقييمات إيجابية مرتفعة.</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                  <Clock className="w-5 h-5 text-blue-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-white mb-1">استجابة وتأكيد سريع</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">موافقات فورية وتواصل مباشر مع المزود المسؤول عبر المنصة.</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                  <CreditCard className="w-5 h-5 text-purple-300 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-white mb-1">دفع ميسر وآمن</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">دعم تقسيط تابي وتمارا وتأمين الدفعات المالية حتى موعد المناسبة.</p>
                  </div>
                </div>

                <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block text-sm font-bold text-white mb-1">خدمات مساندة شاملة</strong>
                    <p className="text-xs text-slate-300 leading-relaxed">باقات هجينة تضم ضيافة وبوفيه وتصوير وسماعات احترافية.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* FEATURES & FACILITIES (المرافق والمميزات) */}
            <section id="features-section" className="space-y-4 py-2">
              <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3">المرافق والتجهيزات المتوفرة</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {(currentHall.features || ['مواقف سيارات متسعة', 'جناح تجهيز العروس', 'أجهزة صوت ودي جي', 'إضاءات ومؤثرات مسرحية', 'طاقم ضيافة ومباشرات', 'تكييف مركزي متطور', 'شاشات عرض LED', 'كوشة وتنسيق طاولات']).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-slate-700 font-bold text-xs md:text-sm bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* LOCATION & MAP (الموقع والخريطة والعنوان الوطني) */}
            <section id="location-section" className="space-y-4 py-2">
              <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3 flex items-center gap-2">
                <Map className="w-5 h-5 text-amber-500" /> الموقع والخريطة والعنوان الوطني
              </h3>
              
              <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/15 text-amber-800 rounded-lg flex items-center justify-center font-bold text-lg shrink-0">
                  🇸🇦
                </div>
                <div>
                  <p className="text-xs text-slate-500 font-bold mb-0.5">العنوان الوطني المعتمد للقاعة</p>
                  <p className="text-xs md:text-sm font-black text-blue-950 leading-relaxed">{nationalAddress}</p>
                </div>
              </div>

              <div className="rounded-2xl overflow-hidden border border-slate-200 h-64 w-full shadow-sm">
                <iframe 
                  title="موقع القاعة"
                  src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.bbox}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lon}`}
                  className="w-full h-full border-0" 
                  allowFullScreen 
                  loading="lazy"
                ></iframe>
              </div>
              <p className="text-sm text-slate-500 flex justify-end">
                <a href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(currentHall.name + ' ' + nationalAddress)}`} target="_blank" rel="noreferrer" className="font-bold text-amber-600 hover:underline flex items-center gap-1">
                  <span>الحصول على اتجاهات الوصول في الخريطة</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </p>
            </section>

            {/* POLICIES & CONTRACT TERMS (السياسات والعقد) */}
            <section id="policies-section" className="space-y-6 py-2">
              {/* قواعد المكان */}
              <div className="space-y-3">
                <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" /> قواعد المكان
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <ul className="list-disc pr-4 space-y-1.5 text-xs md:text-sm text-slate-700 font-medium leading-relaxed">
                    {Array.isArray(currentHall.rules) ? currentHall.rules.map((rule, i) => (
                      <li key={i}>{rule}</li>
                    )) : (currentHall.rules || 'مراعاة أوقات دخول وخروج طاقم الخدمة. الحفاظ على سلامة أجهزة الصوت والإضاءة. منع الألعاب النارية داخل الصالات المغلقة.').split('\n').map((rule, i) => (
                      <li key={i}>{rule}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* شروط العقد */}
              <div className="space-y-3">
                <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" /> شروط العقد
                </h3>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <p className="text-xs md:text-sm text-slate-700 leading-relaxed font-medium">
                    {currentHall.contractTerms || 'يتم اقتطاع عربون تأكيد بنسبة 25% لحجز التاريخ. يضاف مبلغ تأمين مسترد بقيمة 1,000 ر.س يعاد بالكامل فور انتهاء المناسبة وتسليم القاعة بحالتها الطبيعية.'}
                  </p>
                </div>
              </div>
            </section>

            {/* PROVIDER INFO CARD (معلومات المزود) */}
            <section id="provider-section" className="space-y-4 py-2">
              <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3">معلومات مزود الخدمة المسؤول</h3>
              
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-2xl p-5 border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-amber-500 text-slate-950 font-black text-2xl rounded-2xl flex items-center justify-center shadow-md shrink-0">
                    {currentHall.provider.charAt(0)}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {isProviderNameVisible(currentHall.provider) ? (
                        <Link 
                          to={`/provider-profile/${encodeURIComponent(currentHall.provider)}`}
                          className="text-lg font-black text-blue-950 hover:text-amber-600 transition-colors flex items-center gap-1.5 group"
                        >
                          <span className="underline decoration-amber-400 decoration-2 underline-offset-4 group-hover:text-amber-600">{currentHall.provider}</span>
                          <Award className="w-4 h-4 text-amber-500 inline shrink-0" />
                        </Link>
                      ) : (
                        <h4 className="text-lg font-black text-blue-950">مزود خدمة معتمد</h4>
                      )}

                      {partnerLevel && isProviderNameVisible(currentHall.provider) && (
                        <Link to={`/provider-profile/${encodeURIComponent(currentHall.provider)}`}>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition-transform hover:scale-105 ${partnerLevel.bg} ${partnerLevel.color} ${partnerLevel.border}`}>
                            <span>{partnerLevel.icon}</span>
                            <span>{partnerLevel.name}</span>
                          </span>
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <span>عضو معتمد لدى منصة ليلة</span>
                      <span>•</span>
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                        حساب ورخصة موثقة بالكامل
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
                  {isProviderNameVisible(currentHall.provider) && (
                    <Link
                      to={`/provider-profile/${encodeURIComponent(currentHall.provider)}`}
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-blue-950 text-xs font-black rounded-xl shadow transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>ملف الشريك المعتمد 💎</span>
                    </Link>
                  )}
                  <button
                    onClick={() => setIsProviderChatOpen(true)}
                    className="flex-1 md:flex-none px-4 py-2.5 bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold rounded-xl shadow transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-amber-400" />
                    <span>مراسلة المزود</span>
                  </button>
                  <button
                    onClick={() => {
                      setReviewModalTargetType('provider');
                      setIsReviewModalOpen(true);
                    }}
                    className="px-3.5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                  >
                    تقييم المزود
                  </button>
                </div>
              </div>
            </section>

            {/* FREQUENTLY ASKED QUESTIONS (الأسئلة الشائعة) */}
            <section id="faq-section" className="space-y-4 py-2">
              <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3">الأسئلة الشائعة حول الحجز</h3>
              
              <div className="space-y-3">
                {[
                  {
                    q: 'ما هي آلية تأكيد الحجز ودفع العربون؟',
                    a: 'عند اختيار التاريخ والفترة والدفع عبر المنصة، يتم خصم العربون بنسبة 25% ويصل الطلب فوراً لمزود الخدمة للموافقة والتأكيد التلقائي.'
                  },
                  {
                    q: 'هل مبلغ التأمين مسترد بالكامل؟',
                    a: 'نعم، مبلغ التأمين (1,000 ر.س) مسترد بالكامل فور انتهاء المناسبة وتسليم المنشأة بحالتها الطبيعية.'
                  },
                  {
                    q: 'هل يمكن معاينة وزيارة القاعة ميدانياً قبل إتمام الحجز؟',
                    a: 'نعم بالتأكيد، يمكنك التواصل مع المزود مباشرة عبر زر المراسلة الداخلية لتنسيق موعد زيارة معاينة.'
                  },
                  {
                    q: 'ماذا يحدث في حال تم رفض الحجز أو عدم توفر المكان؟',
                    a: 'في حال تعذر قبول الحجز، يتم إرجاع المبلغ كاملاً وبشكل فوري إلى حسابك البنكي أو بطاقتك بدون أي رسوم اقتطاع.'
                  }
                ].map((faq, i) => (
                  <div key={i} className="border border-slate-200 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setFaqOpenIndex(faqOpenIndex === i ? null : i)}
                      className="w-full text-right p-4 font-bold text-slate-800 text-sm flex justify-between items-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
                    >
                      <span>{faq.q}</span>
                      <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${faqOpenIndex === i ? 'rotate-180' : ''}`} />
                    </button>
                    {faqOpenIndex === i && (
                      <div className="p-4 bg-white text-xs md:text-sm text-slate-600 leading-relaxed border-t border-slate-100">
                        {faq.a}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* VISITOR REVIEWS & RATINGS (التقييمات) */}
            <section id="reviews-section" className="space-y-6 py-2">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-100 pb-4">
                <h3 className="text-xl font-black text-blue-950 border-r-4 border-amber-500 pr-3 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-amber-500" /> تقييمات وآراء الزوار
                </h3>

                <div className="flex items-center gap-2">
                  {sortedReviews.length > 0 && (
                    <select 
                      value={reviewSort || ''}
                      onChange={(e) => setReviewSort(e.target.value)}
                      className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs outline-none focus:border-amber-500 text-slate-700 bg-white font-bold"
                    >
                      <option value="newest">الأحدث</option>
                      <option value="positive">الأكثر إيجابية</option>
                      <option value="detailed">الأكثر تفصيلاً</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Add Review Box */}
              <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200">
                <h4 className="font-bold text-blue-950 text-sm mb-1">شاركنا تجربتك وتقييمك للمكان</h4>
                <p className="text-xs text-slate-500 mb-3">رأيك يساعد العملاء الآخرين في اتخاذ القرار المناسب</p>
                {isReviewSubmitted ? (
                  <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl flex items-center gap-2 font-bold text-xs">
                    <CheckCircle2 className="w-4 h-4" />
                    تم تسجيل تقييمك بنجاح، شكراً لك!
                  </div>
                ) : (
                  <>
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-6 h-6 cursor-pointer transition-transform hover:scale-110 ${star <= reviewRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300 fill-slate-300'}`}
                          onClick={() => setReviewRating(star)}
                        />
                      ))}
                    </div>
                    <textarea 
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:border-amber-500 resize-none h-20 mb-3 text-xs md:text-sm bg-white"
                      placeholder="اكتب انطباعك وتجربتك عن القاعة والخدمة..."
                    ></textarea>
                    <button 
                      onClick={handleReviewSubmit}
                      className="bg-blue-950 text-white px-5 py-2 rounded-xl font-bold text-xs hover:bg-blue-900 transition-colors cursor-pointer"
                    >
                      إرسال التقييم
                    </button>
                  </>
                )}
              </div>

              {/* Reviews List */}
              {sortedReviews.length > 0 ? (
                <div className="space-y-3">
                  {sortedReviews.map((review: any) => (
                    <div key={review.id} className="p-4 rounded-xl border border-slate-100 bg-white shadow-2xs">
                      <div className="flex justify-between items-center mb-1.5">
                        <span className="font-bold text-blue-950 text-xs md:text-sm">{review.author}</span>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: 5 }).map((_, idx) => (
                            <Star key={idx} className={`w-3.5 h-3.5 ${idx < review.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'}`} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-xs md:text-sm leading-relaxed">{review.text}</p>
                      {review.date && <p className="text-slate-400 text-[10px] mt-2 font-mono">{review.date}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 text-center text-slate-500 text-xs">
                  لا توجد تقييمات مسجلة لهذه القاعة حتى الآن.
                </div>
              )}
            </section>

          </div>

          {/* RIGHT COLUMN: STICKY BOOKING CARD (DECISION CENTER - بطاقة الحجز الذكية) */}
          <div id="booking-card-section" className="lg:order-1 lg:w-[35%] lg:sticky lg:top-20 w-full">
            <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200/90">
              
              {/* Header Badge */}
              <div className="bg-gradient-to-r from-blue-950 to-indigo-900 text-white p-5 text-center relative">
                <p className="text-amber-400 text-xs font-bold mb-1">مركز اتخاذ القرار الحصري ⚡</p>
                <div className="text-3xl font-black">{currentHall.price} <span className="text-sm font-bold text-slate-300">ر.س / فترة</span></div>
                <p className="text-[10px] text-slate-300 mt-1">تحديث آلي فوري للتكاليف والعربون</p>
              </div>

              <div className="p-5 space-y-5">
                
                {/* Date & Period Selection */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ المناسبة (من)</label>
                      <input 
                        type="date" 
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 text-xs bg-white font-medium" 
                      />
                      {fromDate && (
                        <div className="text-[9.5px] text-amber-600 font-bold mt-1">
                           هجري: {getFullDateInfo(new Date(fromDate)).hijri.full}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">تاريخ المناسبة (إلى)</label>
                      <input 
                        type="date" 
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 text-xs bg-white font-medium" 
                      />
                      {toDate && (
                        <div className="text-[9.5px] text-amber-600 font-bold mt-1">
                           هجري: {getFullDateInfo(new Date(toDate)).hijri.full}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">الفترة الزمنية</label>
                      <select 
                        value={period || ''}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 text-xs bg-white font-bold text-slate-800"
                      >
                        {periodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label} ({opt.price} ر.س)
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex-1">
                      <label className="block text-xs font-bold text-slate-700 mb-1">عدد الضيوف المتوقع</label>
                      <input 
                        type="number" 
                        value={guests}
                        onChange={(e) => setGuests(e.target.value)}
                        min={0}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 text-xs font-bold" 
                      />
                    </div>
                  </div>
                </div>

                {/* Booking Model Options (الباقات والتفريد والخدمات الإضافية والنموذج الهجين) inside Sticky Decision Card */}
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  
                  {/* 1) Packages Model (نموذج الباقات الشاملة) */}
                  {(currentHall.packagesList && currentHall.packagesList.length > 0) && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-blue-950 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-500" />
                          <span>اختر الباقة الشاملة (نموذج الباقات):</span>
                        </label>
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full font-bold">باقات مدمجة 👑</span>
                      </div>
                      <div className="space-y-1.5">
                        {currentHall.packagesList.map((pkg: any) => {
                          const isSelected = selectedPackageId === pkg.id || (!selectedPackageId && currentHall.packagesList?.[0]?.id === pkg.id);
                          const pkgPrice = getPackagePriceForPeriod(pkg, period);
                          return (
                            <div
                              key={pkg.id}
                              onClick={() => setSelectedPackageId(pkg.id)}
                              className={`p-2.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between text-xs ${
                                isSelected 
                                  ? 'border-amber-500 bg-amber-50/80 font-bold shadow-2xs ring-1 ring-amber-500/30' 
                                  : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input 
                                  type="radio" 
                                  name="cardPackage" 
                                  checked={isSelected}
                                  onChange={() => setSelectedPackageId(pkg.id)}
                                  className="w-3.5 h-3.5 text-amber-500 focus:ring-amber-500"
                                />
                                <div>
                                  <span className="text-blue-950 font-black block">{pkg.name}</span>
                                  {pkg.desc && <span className="text-[10px] text-slate-500 block line-clamp-1">{pkg.desc}</span>}
                                </div>
                              </div>
                              <span className="text-emerald-700 font-extrabold shrink-0">{pkgPrice} ر.س</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2) A La Carte Extra Services (نموذج التفريد والخدمات الإضافية) */}
                  {extraServicesList && extraServicesList.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-blue-950 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                          <span>خدمات القاعة الإضافية (نموذج التفريد A La Carte):</span>
                        </label>
                        <span className="text-[10px] text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full font-bold">تفريد 🛠️</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {extraServicesList.map((service) => {
                          const isChecked = services.includes(service.id);
                          return (
                            <label 
                              key={service.id} 
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isChecked ? 'border-amber-500 bg-amber-50/60 shadow-2xs' : 'border-slate-200 hover:border-slate-300 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleServiceToggle(service.id)}
                                  className="w-3.5 h-3.5 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">{service.name}</span>
                                  {service.desc && <span className="text-[10px] text-slate-500 block line-clamp-1">{service.desc}</span>}
                                </div>
                              </div>
                              <span className="font-black text-amber-600 text-xs shrink-0">+{service.price} ر.س</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 3) External Partner Services (النموذج الهجين - الشركاء المعتمدون) */}
                  {availableExternalServices.length > 0 && (
                    <div className="space-y-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-black text-purple-950 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
                          <span>خدمات الشركاء المعتمدين (النموذج الهجين):</span>
                        </label>
                        <span className="text-[9px] bg-purple-600 text-white px-2 py-0.5 rounded font-black">شركاء معتمدون 🌸</span>
                      </div>
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1 scrollbar-thin">
                        {availableExternalServices.map((extSrv) => {
                          const isChecked = selectedExternalServices.includes(extSrv.id);
                          return (
                            <label 
                              key={extSrv.id} 
                              className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                isChecked ? 'border-purple-500 bg-purple-50/70 shadow-2xs ring-1 ring-purple-400/30' : 'border-purple-100 hover:border-purple-200 bg-white'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input 
                                  type="checkbox" 
                                  checked={isChecked}
                                  onChange={() => handleExternalServiceToggle(extSrv.id)}
                                  className="w-3.5 h-3.5 text-purple-600 rounded border-purple-300 focus:ring-purple-500 cursor-pointer"
                                />
                                <div>
                                  <span className="font-bold text-slate-800 block">{extSrv.name}</span>
                                  <span className="text-[10px] text-slate-500 block line-clamp-1">{extSrv.desc}</span>
                                </div>
                              </div>
                              <span className="font-black text-purple-700 text-xs shrink-0">+{extSrv.price} ر.س</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>

                {/* Notes Input */}
                <div className="border-t border-slate-100 pt-4">
                  <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات أو طلبات خاصة (اختياري)</label>
                  <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl p-2.5 focus:outline-none focus:border-amber-500 resize-none h-16 text-xs"
                    placeholder="أي تجهيزات أو تفاصيل تود إضافتها..."
                  ></textarea>
                </div>

                {/* Instant Financial Calculations Breakdown */}
                <div className="border-t border-slate-100 pt-4 space-y-2 text-xs">
                  <h4 className="text-xs font-black text-amber-600 mb-2">ملخص المستحقات المالية المباشرة</h4>
                  
                  <div className="flex justify-between text-slate-600">
                    <span>
                      {currentHall.bookingType === 'packages' ? 'الباقة المختارة' : `إيجار القاعة (${bookingDetails.periodLabel})`} 
                      {bookingDetails.days > 1 && ` x ${bookingDetails.days} أيام`}
                    </span>
                    <span className="font-bold text-slate-800">{bookingDetails.basePrice} ر.س</span>
                  </div>

                  {bookingDetails.servicesPrice > 0 && (
                    <div className="flex justify-between text-slate-600">
                      <span>الخدمات الإضافية المختارة</span>
                      <span className="font-bold text-slate-800">{bookingDetails.servicesPrice} ر.س</span>
                    </div>
                  )}

                  {bookingDetails.externalServicesPrice > 0 && (
                    <div className="flex justify-between text-purple-700 font-bold">
                      <span>خدمات الشركاء الخارجية</span>
                      <span>{bookingDetails.externalServicesPrice} ر.س</span>
                    </div>
                  )}

                  <div className="flex justify-between text-slate-800 pt-1 border-t border-slate-100 font-bold">
                    <span>المجموع الفرعي (شامل الضريبة 15%)</span>
                    <span className="font-black text-blue-950">{bookingDetails.subTotal} ر.س</span>
                  </div>

                  <div className="flex justify-between text-slate-500 text-[11px] bg-slate-50 p-2 rounded-lg my-1">
                    <span>المبلغ الأساسي (قبل الضريبة)</span>
                    <span className="font-mono font-bold text-slate-700">{bookingDetails.baseAmount} ر.س</span>
                  </div>

                  <div className="flex justify-between text-slate-600 text-[11px]">
                    <span>ضريبة القيمة المضافة (15% VAT مستخرجة)</span>
                    <span className="font-bold text-slate-800">{bookingDetails.taxAmount} ر.س</span>
                  </div>

                  <div className="flex justify-between text-amber-700 font-bold">
                    <span>مبلغ التأمين المسترد</span>
                    <span>+{bookingDetails.securityDeposit} ر.س</span>
                  </div>

                  <div className="flex justify-between text-sm font-black text-blue-950 pt-2 border-t border-slate-200">
                    <span>الإجمالي الكلي المباشر (شامل الضريبة + التأمين)</span>
                    <span>{bookingDetails.total + bookingDetails.securityDeposit} ر.س</span>
                  </div>

                  {/* Araboon / Deposit Row */}
                  <div className="flex justify-between items-center p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 font-black mt-2">
                    <div>
                      <span className="block text-xs">العربون المطلوب لتأكيد الحجز</span>
                      <span className="text-[9px] font-normal text-emerald-600">تأمين حجز 25% من قيمة العقد</span>
                    </div>
                    <span className="text-sm font-black">{bookingDetails.depositAmount} ر.س</span>
                  </div>
                </div>

                {/* Booking Button */}
                {currentHall.bookingStatus === 'صيانة' ? (
                  <button
                    disabled
                    className="w-full font-bold py-3.5 rounded-xl text-xs bg-slate-200 text-slate-500 cursor-not-allowed"
                  >
                    مغلق لأعمال الصيانة
                  </button>
                ) : (
                  <>
                    <button
                      disabled={!fromDate || !toDate}
                      onClick={handleBookNow} 
                      className={`w-full font-black py-3.5 rounded-xl shadow-lg transition-all text-sm cursor-pointer ${
                        (!fromDate || !toDate) 
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed' 
                          : 'bg-blue-950 hover:bg-blue-900 text-white'
                      }`}
                    >
                      احجز الآن والدفع الأمني ⚡
                    </button>
                    <p className="text-center text-[10px] text-slate-400">
                      لن يتم خصم أي مبلغ حتى يتم موافقة وتأكيد حجز القاعة
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>

        </div>

        {/* 3. MOBILE FIXED BOTTOM BOOKING BAR */}
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 p-3 px-4 flex items-center justify-between shadow-2xl">
          <div>
            <span className="text-[10px] text-slate-400 block font-bold">الإجمالي المبدأي</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-blue-950">{bookingDetails.total + bookingDetails.securityDeposit}</span>
              <span className="text-xs text-slate-500 font-bold">ر.س</span>
            </div>
            <span className="text-[10px] text-emerald-600 font-black block">العربون: {bookingDetails.depositAmount} ر.س</span>
          </div>

          <button
            onClick={() => {
              const element = document.getElementById('booking-card-section');
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              } else {
                handleBookNow();
              }
            }}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-5 py-2.5 rounded-xl shadow-lg transition-all text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <span>متابعة الحجز</span>
            <ChevronRight className="w-4 h-4 rotate-180" />
          </button>
        </div>

        {/* LIGHTBOX GALLERY MODAL (تكبير الصور) */}
        {isLightboxOpen && (
          <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between p-4" dir="rtl">
            <div className="flex justify-between items-center text-white z-10">
              <span className="font-bold text-sm">معرض الصور ({lightboxIndex + 1} من {allImages.length})</span>
              <button 
                onClick={() => setIsLightboxOpen(false)}
                className="bg-white/10 hover:bg-white/20 p-2 rounded-full text-white transition-colors cursor-pointer"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="relative flex-1 flex items-center justify-center my-4">
              <button
                onClick={() => setLightboxIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                className="absolute right-4 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur transition-all cursor-pointer z-10"
              >
                <ArrowRight className="w-6 h-6" />
              </button>

              <img 
                src={allImages[lightboxIndex]} 
                alt="Fullscreen Hall" 
                className="max-h-[75vh] max-w-full object-contain rounded-2xl shadow-2xl"
              />

              <button
                onClick={() => setLightboxIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                className="absolute left-4 bg-white/20 hover:bg-white/40 text-white p-3 rounded-full backdrop-blur transition-all cursor-pointer z-10"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto justify-center pb-2 z-10">
              {allImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  className={`w-16 h-12 rounded-lg overflow-hidden border-2 transition-all cursor-pointer ${
                    i === lightboxIndex ? 'border-amber-400 scale-105' : 'border-transparent opacity-60'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* VIDEO MODAL (فيديو توضيحي) */}
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-slate-900 rounded-3xl max-w-3xl w-full p-6 text-white relative shadow-2xl border border-slate-800">
              <button 
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-4 left-4 bg-slate-800 hover:bg-slate-700 p-2 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-amber-400">
                <Play className="w-5 h-5" /> فيديو توضيحي استعراضي للقاعة
              </h3>
              <div className="rounded-2xl overflow-hidden aspect-video bg-black flex items-center justify-center border border-slate-800">
                <div className="text-center p-8 space-y-3">
                  <div className="w-16 h-16 bg-amber-500 text-slate-950 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <Play className="w-8 h-8 fill-slate-950 mr-1" />
                  </div>
                  <p className="font-bold text-sm text-slate-300">جاري تشغيل العرض السينمائي للقاعة سينمائياً بدقة 4K</p>
                  <p className="text-xs text-slate-500">يغطي العرض مدخل النساء، الكوشة، توزيع الطاولات، وبوفيه الطعام.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 360 VIRTUAL TOUR MODAL (جولة 360°) */}
        {is360ModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-slate-900 rounded-3xl max-w-4xl w-full p-6 text-white relative shadow-2xl border border-slate-800">
              <button 
                onClick={() => setIs360ModalOpen(false)}
                className="absolute top-4 left-4 bg-slate-800 hover:bg-slate-700 p-2 rounded-full text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-purple-400">
                <Compass className="w-5 h-5 animate-spin" /> جولة افتراضية 360° تفاعلية
              </h3>
              <div className="rounded-2xl overflow-hidden h-[400px] bg-slate-950 relative border border-slate-800 flex items-center justify-center">
                <img src={activeImage || currentHall.image} alt="360 View" className="w-full h-full object-cover opacity-60" />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-xs text-center p-6">
                  <span className="text-4xl mb-2 animate-bounce">🔄</span>
                  <strong className="text-base font-black text-amber-400">انقر واسحب للتجول 360 درجة داخل الصالة</strong>
                  <p className="text-xs text-slate-300 mt-2 max-w-md">يمكنك التنقل بين صالة النساء وصالة الرجال وجناح العروس بدقة عالية عبر النقاط التفاعلية.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FLOOR PLAN MODAL (مخطط القاعة) */}
        {isFloorPlanModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 text-slate-800 relative shadow-2xl border border-slate-100">
              <button 
                onClick={() => setIsFloorPlanModalOpen(false)}
                className="absolute top-4 left-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-blue-950">
                <Layers className="w-5 h-5 text-amber-500" /> مخطط توزيع القاعة والتقسيم الهندسي
              </h3>
              <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-8 text-center space-y-4">
                <div className="grid grid-cols-3 gap-3 text-xs font-bold">
                  <div className="bg-amber-100 text-amber-800 p-4 rounded-xl border border-amber-200">
                    مدخل ومواقف النساء
                  </div>
                  <div className="bg-blue-100 text-blue-800 p-4 rounded-xl border border-blue-200">
                    الصالة الرئيسية (الممر والكوشة)
                  </div>
                  <div className="bg-purple-100 text-purple-800 p-4 rounded-xl border border-purple-200">
                    جناح تجهيز العروس الخاص
                  </div>
                </div>
                <p className="text-xs text-slate-500">مخطط هندسي توضيحي يوضح المساحات ومواقع الكوشة والبوفيه ومصاعد الخدمة.</p>
              </div>
            </div>
          </div>
        )}

        {/* BEFORE & AFTER PREPARATION MODAL */}
        {isBeforeAfterModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
            <div className="bg-white rounded-3xl max-w-3xl w-full p-6 text-slate-800 relative shadow-2xl border border-slate-100">
              <button 
                onClick={() => setIsBeforeAfterModalOpen(false)}
                className="absolute top-4 left-4 bg-slate-100 hover:bg-slate-200 p-2 rounded-full text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-blue-950">
                <Sparkles className="w-5 h-5 text-amber-500" /> صور القاعة قبل وبعد التجهيز والديكور
              </h3>
              
              <div className="flex justify-center gap-3 mb-4">
                <button
                  onClick={() => setBeforeAfterView('after')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${beforeAfterView === 'after' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-100 text-slate-600'}`}
                >
                  ✨ بعد التجهيز والديكور الكامل
                </button>
                <button
                  onClick={() => setBeforeAfterView('before')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${beforeAfterView === 'before' ? 'bg-amber-500 text-slate-950 shadow' : 'bg-slate-100 text-slate-600'}`}
                >
                  🏛️ الصالة قبل الديكور (مجردة)
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden h-[320px] bg-slate-100 relative">
                <img 
                  src={activeImage || currentHall.image} 
                  alt="Preparation View" 
                  className={`w-full h-full object-cover transition-all duration-500 ${beforeAfterView === 'before' ? 'grayscale opacity-75' : ''}`} 
                />
              </div>
            </div>
          </div>
        )}

        {/* BOOKING REQUEST & PAYMENT MODAL */}
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <div className="bg-white rounded-3xl max-w-5xl w-full max-h-[95vh] overflow-y-auto shadow-2xl relative flex flex-col md:flex-row rtl">
              <button onClick={() => {
                  setIsBookingModalOpen(false);
                  setIsBookingSuccess(false);
                }} className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200">
                <X className="w-6 h-6" />
              </button>
              
              {!isBookingSuccess ? (
                <>
                  <div className="w-full md:w-3/5 p-8 border-b md:border-b-0 md:border-l border-slate-100">
                    <h2 className="text-2xl font-bold text-blue-950 mb-2">إتمام عملية الدفع</h2>
                    
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4 mt-6">
                      <p className="text-amber-800 text-sm font-bold flex items-start gap-2">
                        <Info className="w-5 h-5 flex-shrink-0" />
                        هذا الحجز مبدأي ولا يعد مؤكدا حتى يتم الموافقة عليه من مزود الخدمة لتأكيد عملية الحجز.
                      </p>
                    </div>

                    {bookingError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-500" />
                        <div className="flex-1">
                          <p className="font-extrabold text-sm text-red-850">تعذر إكمال الحجز والعملية</p>
                          <p className="text-xs text-red-600 mt-1 leading-relaxed">{bookingError}</p>
                        </div>
                      </div>
                    )}

                    <form onSubmit={handleSubmitBooking}>
                      <h4 className="font-bold text-slate-800 mb-4">طريقة الدفع</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        {[
                          { key: 'mada', name: 'مدى' },
                          { key: 'creditMax', name: 'البطاقة الائتمانية' },
                          { key: 'apple', name: 'Apple Pay' },
                          { key: 'stc', name: 'STC Pay' },
                          { key: 'google_pay', name: 'Google Pay' },
                          { key: 'tabby', name: 'تابي (Tabby)' },
                          { key: 'tamara', name: 'تمارا (Tamara)' },
                          { key: 'bank_transfer', name: 'تحويل بنكي' }
                        ].filter(gw => 
                          paymentSettings[gw.key]
                        ).map(gw => (
                          <label key={gw.key} className={`border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${paymentMethod === gw.key ? 'border-amber-500 bg-amber-50' : 'border-slate-200 hover:border-slate-300'}`}>
                            <input type="radio" name="payment" value={gw.key} className="hidden" checked={paymentMethod === gw.key} onChange={() => setPaymentMethod(gw.key)} />
                            <CreditCard className={`w-6 h-6 mb-2 ${paymentMethod === gw.key ? 'text-amber-500' : 'text-slate-400'}`} />
                            <span className="text-xs font-bold text-slate-700 text-center">{gw.name}</span>
                          </label>
                        ))}
                      </div>

                      <h4 className="font-bold text-slate-800 mb-4">بيانات الدفع</h4>
                      <div className="space-y-4">
                        {(paymentMethod === 'mada' || paymentMethod === 'creditMax') && (
                          <>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">الاسم على البطاقة</label>
                              <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors" placeholder="الاسم الكامل" />
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">رقم البطاقة</label>
                              <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-left" placeholder="0000 0000 0000 0000" dir="ltr" />
                            </div>
                            <div className="flex gap-4">
                              <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">تاريخ الانتهاء</label>
                                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-left" placeholder="MM/YY" dir="ltr" />
                              </div>
                              <div className="flex-1">
                                <label className="block text-xs font-bold text-slate-500 mb-1">الرمز السري (CVC)</label>
                                <input required type="text" className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-left" placeholder="123" dir="ltr" maxLength={3} />
                              </div>
                            </div>
                          </>
                        )}
                        {paymentMethod === 'apple' && (
                          <div className="flex justify-center items-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            <button type="submit" className="bg-black text-white hover:bg-gray-800 font-bold py-3 px-8 rounded-full shadow-lg transition-colors flex items-center justify-center gap-2 w-full max-w-sm cursor-pointer">
                               الدفع بواسطة Apple Pay
                            </button>
                          </div>
                        )}
                        {paymentMethod === 'google_pay' && (
                          <div className="flex justify-center items-center p-6 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                            <button type="submit" className="bg-black text-white hover:bg-gray-800 font-bold py-3 px-8 rounded-full shadow-lg transition-colors flex items-center justify-center gap-2 w-full max-w-sm cursor-pointer">
                               الدفع بواسطة Google Pay
                            </button>
                          </div>
                        )}
                        {(paymentMethod === 'tabby' || paymentMethod === 'tamara') && (
                          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 font-sans">
                            <div className="flex items-start gap-3">
                              <div className="bg-amber-100 text-amber-700 p-2 rounded-lg shrink-0 mt-0.5 animate-pulse">
                                <Info className="w-5 h-5" />
                              </div>
                              <div>
                                <h5 className="font-extrabold text-slate-900 text-sm">شراء الآن والدفع لاحقاً مع {paymentMethod === 'tabby' ? 'تابي (Tabby)' : 'تمارا (Tamara)'}</h5>
                                <p className="text-xs text-slate-500 mt-1">قسم فاتورتك بكل سهولة إلى 4 دفعات شهرية ميسرة بدون أي رسوم مخفية أو فوائد إضافية.</p>
                              </div>
                            </div>
                            <div className="flex justify-between items-center bg-white p-3.5 rounded-xl border border-slate-100 text-sm font-extrabold text-slate-700">
                              <span>قيمة الدفعة الواحدة:</span>
                              <span className="text-amber-600">{(bookingDetails.total / 4).toFixed(2)} ر.س / شهرياً</span>
                            </div>
                          </div>
                        )}
                        {paymentMethod === 'stc' && (
                          <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">رقم الجوال المسجل في STC Pay</label>
                            <input 
                              required 
                              type="tel" 
                              maxLength={10}
                              minLength={10}
                              pattern="05[0-9]{8}"
                              className="w-full border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-amber-500 transition-colors text-left" 
                              placeholder="05XXXXXXXX" 
                              dir="ltr" 
                            />
                          </div>
                        )}
                        {paymentMethod === 'bank_transfer' && (
                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-4">
                            <div>
                               <p className="text-xs text-slate-500 mb-1">اسم البنك:</p>
                               <p className="font-bold text-slate-800">مصرف الراجحي</p>
                            </div>
                            <div>
                               <p className="text-xs text-slate-500 mb-1">اسم الحساب:</p>
                               <p className="font-bold text-slate-800">{currentHall.provider}</p>
                            </div>
                            <div>
                               <p className="text-xs text-slate-500 mb-1">رقم الآيبان (IBAN):</p>
                               <p className="font-bold text-slate-800 text-left bg-white p-2 rounded border border-slate-200" dir="ltr">SA00 0000 0000 0000 0000 0000</p>
                            </div>
                            <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">إرفاق إيصال التحويل</label>
                              <input required type="file" accept="image/*,.pdf" className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-white focus:outline-none focus:border-amber-500 transition-colors text-sm" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 mt-8">
                        <button 
                          disabled={paymentProcessing} 
                          type="submit" 
                          className="flex-1 bg-blue-950 hover:bg-blue-900 flex justify-center items-center gap-2 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all cursor-pointer"
                        >
                          {paymentProcessing ? (
                            <>
                              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                              <span>معالجة الدفع عبر {processingGateway}...</span>
                            </>
                          ) : (
                            <span>تأكيد والدفع الآن</span>
                          )}
                        </button>
                        
                        <button 
                          type="button" 
                          disabled={paymentProcessing}
                          onClick={() => {
                            setIsBookingModalOpen(false);
                            setIsBookingSuccess(false);
                            setBookingError(null);
                          }} 
                          className="px-6 py-4 border border-slate-200 text-slate-600 hover:text-red-500 hover:bg-red-50 rounded-xl font-bold transition-all text-center cursor-pointer"
                        >
                          إلغاء الحجز
                        </button>
                      </div>
                    </form>
                  </div>
                  
                  <div className="w-full md:w-2/5 p-8 bg-slate-50 rounded-l-3xl">
                    <h3 className="text-xl font-bold text-blue-950 mb-6">ملخص الحجز</h3>
                    
                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden mb-6">
                      <div className="h-32 bg-slate-200 relative">
                        <iframe 
                          title="Map Area"
                          src={`https://www.openstreetmap.org/export/embed.html?bbox=${mapCoords.bbox}&layer=mapnik&marker=${mapCoords.lat}%2C${mapCoords.lon}`} 
                          className="w-full h-full border-0 pointer-events-none" 
                        ></iframe>
                        <div className="absolute inset-0 bg-blue-950/20"></div>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-blue-950 text-lg">{currentHall.name}</h4>
                        <p className="text-sm text-slate-500 flex items-center gap-1 mb-4"><MapPin className="w-3 h-3" /> {currentHall.city} - {currentHall.location}</p>
                        
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500">التاريخ:</span>
                            <div className="text-left font-bold text-slate-700">
                              <div>{fromDate || '-'} {toDate !== fromDate && toDate ? `إلى ${toDate}` : ''}</div>
                            </div>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500">عدد الأيام:</span>
                            <span className="font-bold text-slate-700 bg-blue-50 text-blue-800 px-2 rounded">{bookingDetails.days} يوم</span>
                          </div>
                          <div className="flex justify-between border-b border-slate-50 pb-2">
                            <span className="text-slate-500">الفترة:</span>
                            <span className="font-bold text-slate-700">{bookingDetails.periodLabel}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 space-y-3">
                      <h4 className="font-bold text-slate-800 mb-2">تكاليف الحجز (شاملة ضريبة القيمة المضافة 15%)</h4>
                      <div className="flex justify-between text-sm text-slate-600">
                        <span>إجمالي إيجار المكان</span>
                        <span className="font-medium">{bookingDetails.basePrice} ر.س</span>
                      </div>
                      {bookingDetails.servicesPrice > 0 && (
                        <div className="flex justify-between text-sm text-slate-600">
                          <span>إجمالي الخدمات الإضافية</span>
                          <span className="font-medium">{bookingDetails.servicesPrice} ر.س</span>
                        </div>
                      )}
                      {bookingDetails.externalServicesPrice > 0 && (
                        <div className="flex justify-between text-sm text-purple-700 font-semibold">
                          <span>خدمات الشركاء الخارجية</span>
                          <span>{bookingDetails.externalServicesPrice} ر.س</span>
                        </div>
                      )}
                      <div className="flex justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                        <span>المبلغ الأساسي (قبل الضريبة)</span>
                        <span className="font-mono">{bookingDetails.baseAmount} ر.س</span>
                      </div>
                      <div className="flex justify-between text-xs text-slate-500">
                        <span>ضريبة القيمة المضافة (15% VAT مستخرجة)</span>
                        <span className="font-mono">{bookingDetails.taxAmount} ر.س</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold text-blue-950 pt-2 border-t border-slate-100">
                        <span>المبلغ المطلوب الإجمالي (شامل الضريبة)</span>
                        <span className="text-orange-500">{bookingDetails.total} ر.س</span>
                      </div>
                    </div>

                    {/* Ad Banner - أسفل تفاصيل الحجز */}
                    <div className="pt-2">
                      <AdBanner 
                        placement="أسفل تفاصيل الحجز" 
                        layout="card" 
                        className="w-full shadow-sm" 
                      />
                    </div>
                  </div>
                </>
              ) : (
                <div className="p-8 w-full">
                   <BookingInvoice
                      bookingId={Math.floor(100 + Math.random() * 900).toString()}
                      issueDate={new Date().toLocaleDateString('ar-SA')}
                      providerName={currentHall.provider}
                      providerAddress={`${currentHall.city} - ${currentHall.location}`}
                      providerVatNo="300000000000003"
                      customerName={customerName}
                      customerPhone={customerPhone}
                      customerEmail={user.email || 'guest@example.com'}
                      customerRegion={currentHall.city || "منطقة الرياض"}
                      customerAddressDetail={`${currentHall.city} - ${currentHall.location}`}
                      customerVatNo=""
                      checkInDate={fromDate || new Date().toLocaleDateString('ar-SA')}
                      checkOutDate={toDate || (fromDate || new Date().toLocaleDateString('ar-SA'))}
                      duration={bookingDetails.days.toString()}
                      items={[
                        { 
                          name: currentHall.bookingType === 'packages' 
                            ? `باقة: ${currentHall.packagesList?.find((p: any) => p.id === selectedPackageId)?.name || currentHall.packagesList?.[0]?.name || 'باقة الخدمات الشاملة'} (${bookingDetails.periodLabel})` 
                            : `إيجار القاعة (${bookingDetails.periodLabel})`, 
                          quantity: bookingDetails.days, 
                          price: bookingDetails.days > 0 ? (bookingDetails.basePrice / bookingDetails.days) : 0, 
                          total: bookingDetails.basePrice 
                        },
                        ...services.map(id => {
                          const s = currentHall.extraServicesList?.find(sx => sx.id === id);
                          return { name: s?.name || '', quantity: 1, price: s?.price || 0, total: s?.price || 0 };
                        }).filter(s => s.name !== ''),
                        ...selectedExternalServices.map(id => {
                          const s = EXTERNAL_PARTNERS_SERVICES.find(sx => sx.id === id);
                          return { name: s?.name || '', quantity: 1, price: s?.price || 0, total: s?.price || 0 };
                        }).filter(s => s.name !== '')
                      ]}
                      subtotal={bookingDetails.subTotal}
                      vatAmount={bookingDetails.taxAmount}
                      grandTotal={bookingDetails.total}
                      paymentMethod={paymentMethod}
                      status="paid"
                   />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscription Flow Section */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-32 mb-10 overflow-hidden">
          <div className="text-center mb-6">
             <span className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-xs font-bold mb-4 inline-block">عروض الاشتراك</span>
          </div>
          <SubscriptionFlow embedded={true} title="انضم كمزود خدمة" />
        </div>

      </main>

      <ProviderChatModal isOpen={isProviderChatOpen} onClose={() => setIsProviderChatOpen(false)} providerName={currentHall.provider} hallName={currentHall.name} />

      {/* External Services Modal */}
      {isExternalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans" dir="rtl">
          <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white p-5 relative shrink-0">
              <button 
                type="button"
                onClick={() => setIsExternalModalOpen(false)} 
                className="absolute left-4 top-5 text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-base font-extrabold flex items-center gap-2">
                <span>🌸 إضافة خدمات مساندة مستقلة (النموذج الهجين)</span>
              </h3>
              <p className="text-purple-100 text-xs mt-1">
                اختر الخدمات الإضافية التي ترغب بإضافتها لطلبك من الشركاء الخارجيين المعتمدين في منصة ليلة.
              </p>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 flex-grow bg-slate-50/50">
              {availableExternalServices.map((service) => {
                const isSelected = selectedExternalServices.includes(service.id);
                return (
                  <div 
                    key={service.id} 
                    onClick={() => handleExternalServiceToggle(service.id)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                      isSelected 
                        ? 'border-purple-600 bg-purple-500/[0.02] shadow-sm' 
                        : 'border-slate-100 hover:border-slate-200 bg-white'
                    }`}
                  >
                    <div className="mt-0.5">
                      <div className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-purple-600 bg-purple-600 text-white' 
                          : 'border-slate-300 bg-white'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-4.5 h-4.5 text-white" />}
                      </div>
                    </div>
                    <div className="flex-grow">
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <span className="font-bold text-sm text-blue-950">{service.name}</span>
                        <span className="text-sm font-extrabold text-purple-600 shrink-0">{service.price} ر.س</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed">{service.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="p-4 border-t border-slate-100 bg-white flex items-center justify-between shrink-0">
              <div>
                <span className="text-xs text-slate-400 block font-semibold">الخدمات المختارة</span>
                <span className="font-extrabold text-purple-700 text-base">
                  {selectedExternalServices.length} {selectedExternalServices.length === 1 ? 'خدمة' : 'خدمات'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsExternalModalOpen(false)}
                className="px-6 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-800 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer"
              >
                تأكيد وحفظ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Package Detail Modal Popup */}
      {activePackageDetail && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans" 
          dir="rtl"
          onClick={() => setActivePackageDetail(null)}
        >
          <div 
            className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh] relative text-right"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              type="button"
              onClick={() => setActivePackageDetail(null)} 
              className="absolute left-4 top-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors z-10 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-6 overflow-y-auto flex-grow space-y-6">
              <div className="space-y-1 mt-2">
                <span className="text-[10px] bg-amber-500/15 text-amber-700 px-2.5 py-0.5 rounded-full font-bold inline-block">باقة خدمات مدمجة 👑</span>
                <h3 className="text-xl font-black text-blue-950">{activePackageDetail.name}</h3>
                <p className="text-xs text-slate-500 leading-relaxed font-medium">{activePackageDetail.desc}</p>
              </div>

              <div className="border-t border-slate-100" />

              <div className="space-y-3">
                <h4 className="text-xs font-black text-slate-400">⏱️ أسعار الباقة</h4>
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex justify-between items-center text-xs font-bold text-emerald-800">
                  <span>السعر الأساسي للفترة</span>
                  <span className="text-sm font-black">{activePackageDetail.price} ر.س</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-100 bg-slate-50/50 shrink-0 flex gap-3">
              <button
                type="button"
                onClick={() => setActivePackageDetail(null)}
                className="flex-1 py-3 text-xs font-black text-slate-500 bg-white rounded-xl border border-slate-200 cursor-pointer"
              >
                تراجع
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedPackageId(activePackageDetail.id);
                  setActivePackageDetail(null);
                }}
                className="flex-[2] py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-all cursor-pointer"
              >
                ✓ اختيار هذه الباقة
              </button>
            </div>
          </div>
        </div>
      )}

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetType={reviewModalTargetType}
        allowedTargetTypes={['hall', 'provider']}
        targetId={reviewModalTargetType === 'provider' ? (providerData?.id || currentHall?.provider) : (currentHall?.id || id)}
        targetName={reviewModalTargetType === 'provider' ? (currentHall?.provider || 'مزود الخدمة') : (currentHall?.name || 'القاعة')}
        providerName={currentHall?.provider}
        onSubmitReview={handleModalSubmitReview}
      />

      <Footer />
    </div>
  );
}
