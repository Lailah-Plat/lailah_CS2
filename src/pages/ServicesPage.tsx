import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdBanner } from '../components/AdBanner';
import { Search, MapPin, Filter, Star, Camera, Utensils, Music, Flower2, X, CheckCircle2, User, CreditCard, Info, MessageCircle, AlertTriangle } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import ProviderChatModal from '../components/ProviderChatModal';
import { getServices, EventService, isProviderNameVisible } from '../data/mockData';
import { getFullDateInfo } from '../utils/dateUtils';
import ServiceDetailsModal from '../components/ServiceDetailsModal';
import RequestServiceModal from '../components/RequestServiceModal';
import { ReviewModal } from '../components/modals/ReviewModal';

export default function ServicesPage() {
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedService, setSelectedService] = useState<EventService | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [serviceDate, setServiceDate] = useState('');
  const [allServices, setAllServices] = useState(getServices());
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Capture and persist referral / ambassador attribution code
  const refParam = searchParams.get('ref') || searchParams.get('ambassador') || searchParams.get('affiliate');
  useEffect(() => {
    if (refParam) {
      try {
        localStorage.setItem('layla_referral_code', refParam);
        localStorage.setItem('layla_ambassador_ref', refParam);
        localStorage.setItem('layla_affiliate_id', refParam);
      } catch (e) {}
    }
  }, [refParam]);

  // Target service query param
  const targetServiceId = searchParams.get('serviceId') || searchParams.get('service');
  const targetDirectService = useMemo(() => {
    if (!targetServiceId) return null;
    return allServices.find(s => String(s.id) === String(targetServiceId)) || null;
  }, [allServices, targetServiceId]);

  const isTargetArchivedOrPaused = useMemo(() => {
    if (!targetDirectService) return false;
    const sAny = targetDirectService as any;
    return sAny.isArchived === true || sAny.status === 'مؤرشفة' || sAny.activationStatus === 'موقوف';
  }, [targetDirectService]);

  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [serviceForDetails, setServiceForDetails] = useState<EventService | null>(null);

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetService, setReviewTargetService] = useState<EventService | null>(null);
  const [reviewModalTargetType, setReviewModalTargetType] = useState<'service' | 'provider'>('service');

  const handleOpenReview = (service: EventService, targetType: 'service' | 'provider' = 'service') => {
    setReviewTargetService(service);
    setReviewModalTargetType(targetType);
    setIsReviewModalOpen(true);
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
        providerName: reviewData.providerName || '',
        customerName: reviewData.customerName || currentUserData?.name || currentUserData?.email || 'عميل منصة ليلة',
        rating: reviewData.rating,
        comment: reviewData.comment,
        date: new Date().toISOString().split('T')[0],
        status: 'published'
      };
      const updatedList = [newRev, ...allReviewsList];
      localStorage.setItem('allReviews', JSON.stringify(updatedList));
      window.dispatchEvent(new Event('storage'));

      // Dynamically update service rating if target is service
      if (reviewData.targetType === 'service') {
        const storedServices = getServices();
        const updatedServices = storedServices.map((s: any) => {
          if (String(s.id) === String(reviewData.targetId)) {
            const reviewsForService = updatedList.filter((r: any) => r.targetType === 'service' && String(r.targetId) === String(s.id));
            const newCount = reviewsForService.length;
            const newAvg = Number((reviewsForService.reduce((acc: number, curr: any) => acc + Number(curr.rating || 0), 0) / newCount).toFixed(1));
            return { ...s, rating: newAvg, reviewsCount: newCount };
          }
          return s;
        });
        localStorage.setItem('SERVICES', JSON.stringify(updatedServices));
        setAllServices(updatedServices);
      }

      return true;
    } catch {
      return false;
    }
  };

  const handleOpenDetails = (service: EventService) => {
    setServiceForDetails(service);
    setIsDetailsModalOpen(true);
  };

  useEffect(() => {
    const handleServicesUpdate = () => {
      setAllServices(getServices());
    };
    window.addEventListener('storage', handleServicesUpdate);
    window.addEventListener('settingsUpdated', handleServicesUpdate);
    window.addEventListener('hallsUpdated', handleServicesUpdate);
    window.addEventListener('servicesUpdated', handleServicesUpdate);
    return () => {
      window.removeEventListener('storage', handleServicesUpdate);
      window.removeEventListener('settingsUpdated', handleServicesUpdate);
      window.removeEventListener('hallsUpdated', handleServicesUpdate);
      window.removeEventListener('servicesUpdated', handleServicesUpdate);
    };
  }, []);

  const [isProviderChatOpen, setIsProviderChatOpen] = useState(false);
  const [chatData, setChatData] = useState({ providerName: '', hallName: '' });

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
        
        // Fetch bookings to link
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

  const paymentSettings = useMemo(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      if (stored) return JSON.parse(stored);
    } catch(e){}
    return { mada: true, creditMax: true, apple: true, stc: true, google_pay: false, tabby: true, tamara: true, bank_transfer: true };
  }, []);
  
  const [paymentMethod, setPaymentMethod] = useState('mada');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingGateway, setProcessingGateway] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  const filteredServices = allServices.filter(service => {
    const sAny = service as any;
    return (sAny.status === 'approved' || sAny.adminStatus === 'approved') &&
      sAny.activationStatus !== 'موقوف' &&
      (((service.name || '').includes(searchTerm) || (service.city || '').includes(searchTerm))) &&
      (selectedCategory === '' || (service.category || '') === selectedCategory);
  });

  const getCategoryIcon = (category: string) => {
    switch(category) {
      case 'تصوير': return <Camera className="w-5 h-5" />;
      case 'بوفيه وضيافة': return <Utensils className="w-5 h-5" />;
      case 'دي جي وفِرق': return <Music className="w-5 h-5" />;
      case 'تنسيق قاعات': return <Flower2 className="w-5 h-5" />;
      default: return <Star className="w-5 h-5" />;
    }
  };

  const handleRequestService = (service: EventService) => {
    setSelectedService(service);
    setIsModalOpen(true);
    setIsSuccess(false);
  };

  const openProviderChat = (e: React.MouseEvent, providerName: string, serviceName: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (localStorage.getItem('IS_AUTHENTICATED') !== 'true') {
      alert('يرجى تسجيل الدخول أولاً للمحادثة مع المزود');
      return;
    }
    setChatData({ providerName, hallName: serviceName });
    setIsProviderChatOpen(true);
  };

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);
    
    if (selectedService.quantityLimit) {
      const limit = parseInt(selectedService.quantityLimit);
      if (quantity > limit) {
        setRequestError(`الكمية المطلوبة تتجاوز الحد الأقصى المسموح به لطلب هذه الخدمة وهو ${limit} وحدة.`);
        return;
      }
    }
    
    // Dynamically resolve payment gateway according to the selected payment method and active gateways
    let activeGatewayKey = 'moyasar';
    try {
      const stored = localStorage.getItem('ADMIN_ENABLED_GATEWAYS');
      const enabled = stored ? JSON.parse(stored) : {
        moyasar: true,
        hyperpay: false,
        paytabs: false,
        geidea: false,
        tabby_api: true,
        tamara_api: true
      };
      
      if (paymentMethod === 'tabby') {
        activeGatewayKey = 'tabby_api';
      } else if (paymentMethod === 'tamara') {
        activeGatewayKey = 'tamara_api';
      } else {
        // Standard card payment method: route to first active standard gateway
        const standardKeys = ['moyasar', 'hyperpay', 'paytabs', 'geidea'];
        const activeStandard = standardKeys.find(k => enabled[k]);
        activeGatewayKey = activeStandard || localStorage.getItem('ADMIN_ACTIVE_GATEWAY') || 'moyasar';
      }
    } catch (e) {
      activeGatewayKey = localStorage.getItem('ADMIN_ACTIVE_GATEWAY') || 'moyasar';
    }

    const gatewaysMap: Record<string, string> = {
      moyasar: 'مُيسر (Moyasar)',
      hyperpay: 'هايبر باي (HyperPay)',
      paytabs: 'بي تابس (PayTabs)',
      geidea: 'جيديا (Geidea)',
      tabby_api: 'تابي (Tabby)',
      tamara_api: 'تمارا (Tamara)'
    };
    const selectedGateway = gatewaysMap[activeGatewayKey] || 'مُيسر (Moyasar)';
 
    const completeRequest = () => {
      try {
        // Get current user info from localStorage
        let userId = 'GUEST';
        let customerName = 'عميل زائر';
        if (currentUserData) {
          userId = currentUserData.id || currentUserData.uid || 'USER-123';
          customerName = currentUserData.name || currentUserData.fullName || 'أحمد محمد';
        }
  
        // Save the request to localStorage for cross-page visibility
        const newRequest = {
          id: Date.now(),
          bookingId: isLinkedToBooking ? selectedBookingId : '', // Service requested directly is independent by default unless linked later
          userId: userId,
          customerName: customerName,
          providerName: selectedService.provider,
          serviceName: selectedService.name,
          date: serviceDate,
          status: 'قيد الانتظار',
          price: quantity * selectedService.price,
          quantity: quantity,
          paymentMethod: paymentMethod,
          paymentStatus: paymentMethod === 'bank_transfer' ? 'في انتظار التحويل' : 'مدفوع'
        };
  
        const existingRequests = JSON.parse(localStorage.getItem('SUPPORT_SERVICE_REQUESTS') || '[]');
        localStorage.setItem('SUPPORT_SERVICE_REQUESTS', JSON.stringify([newRequest, ...existingRequests]));
        window.dispatchEvent(new Event('storage'));
        
        setIsSuccess(true);
        setTimeout(closeModal, 2500);
      } catch (err: any) {
        console.error(err);
        setRequestError('فشلت محاولة حجز وإرسال طلب الخدمة، يرجى ملء البيانات وإعادة المحاولة.');
      }
    };
 
    if (paymentMethod !== 'bank_transfer') {
      setProcessingGateway(selectedGateway);
      setPaymentProcessing(true);
      setTimeout(() => {
        setPaymentProcessing(false);
        completeRequest();
      }, 2500);
    } else {
      completeRequest();
    }
  };
 
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedService(null);
    setIsSuccess(false);
    setRequestError(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <AdBanner placement="شريط الإعلان العلوي" layout="banner" className="border-none" />
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-12">
        <h1 className="text-4xl font-bold text-blue-950 mb-2 border-r-4 border-amber-500 pr-4">خدمات المناسبات</h1>
        <p className="text-slate-500 pr-5 mb-8">كل ما تحتاجه لتنظيم مناسبتك المثالية في مكان واحد</p>

        {/* Smart Redirect / Archived Service Landing Banner */}
        {targetDirectService && isTargetArchivedOrPaused && (
          <div className="mb-8 p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-amber-50 to-purple-500/10 border border-amber-300 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-black text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                  الخدمة مؤرشفة أو غير متاحة مؤقتاً
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  الخدمة المطلوبة ({targetDirectService.name}) غير متاحة للطلب المباشر حالياً
                </h3>
                <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                  تم حفظ وتأكيد كود إحالة السفير/الشريك لضمان حقوق العمولات. يمكنك استعراض وطلب خدمات بديلة نشطة بنفس الفئة أدناه.
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                if (targetDirectService.category) {
                  setSelectedCategory(targetDirectService.category);
                }
              }}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl whitespace-nowrap shadow-sm transition-all cursor-pointer"
            >
              عرض بدائل في فئة {targetDirectService.category || 'الخدمات'}
            </button>
          </div>
        )}

        {/* Categories Quick Select */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button 
            onClick={() => setSelectedCategory('')}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${selectedCategory === '' ? 'bg-blue-950 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
          >
            الكل
          </button>
          {['تصوير', 'بوفيه وضيافة', 'دي جي وفِرق', 'تنسيق قاعات'].map(cat => (
             <button 
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${selectedCategory === cat ? 'bg-amber-500 text-white shadow-md' : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
              >
                {getCategoryIcon(cat)} {cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex items-center mb-8">
          <Search className="w-6 h-6 text-slate-400 ml-3 mr-4" />
          <input 
            type="text" 
            placeholder="ابحث عن مزودي الخدمات بالاسم أو المدينة..." 
            className="flex-grow bg-transparent outline-none py-3 text-slate-700"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* View Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-800">النتائج ({filteredServices.length})</h2>
          <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
        </div>

        {/* Main Content Area with Services List & Sidebar */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Services Results Column */}
          <div className="lg:col-span-3 space-y-6">
            <AdBanner placement="نتائج البحث (صفحة استكشاف)" layout="card" className="mb-6" />

            {filteredServices.length > 0 ? (
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
                      {filteredServices.map(service => (
                        <tr key={service.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="px-6 py-4 font-bold text-blue-950 flex items-center gap-3">
                            <img 
                              src={service.image} 
                              alt={service.name} 
                              className="w-12 h-12 rounded-lg object-cover cursor-pointer hover:scale-110 transition-transform duration-300 shadow-sm border border-slate-100" 
                              onClick={() => handleOpenDetails(service)}
                              title="عرض تفاصيل الخدمة الفاخرة"
                            />
                            <div className="flex items-center gap-2">
                              <span>{service.name}</span>
                              <button onClick={(e) => openProviderChat(e, service.provider, service.name)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors" title="مراسلة مزود الخدمة">
                                <MessageCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 py-4 flex items-center gap-1">{getCategoryIcon(service.category)} {service.category}</td>
                          <td className="px-6 py-4">
                            {isProviderNameVisible(service.provider) ? (
                              <Link 
                                to={`/provider-profile/${encodeURIComponent(service.provider)}`}
                                className="font-bold text-blue-950 hover:text-amber-600 underline decoration-amber-400 decoration-1 underline-offset-2 transition-colors"
                              >
                                {service.provider}
                              </Link>
                            ) : (
                              "مزود خدمة معتمد"
                            )}
                          </td>
                          <td className="px-6 py-4 font-bold text-orange-500">{service.price} ر.س</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                              <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {service.rating}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button onClick={() => handleRequestService(service)} className="bg-amber-100 text-amber-700 hover:bg-amber-200 font-bold px-4 py-2 rounded-lg transition-colors whitespace-nowrap">
                              طلب خدمة
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
              <div className={viewMode === 'list' ? "flex flex-col gap-6" : "grid grid-cols-1 md:grid-cols-2 gap-6"}>
                {filteredServices.map(service => (
                  <div key={service.id} className={`bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all flex ${viewMode === 'list' ? 'flex-col md:flex-row' : 'flex-col'}`}>
                    <div className={`relative ${viewMode === 'list' ? 'h-48 md:h-auto md:w-1/3 shrink-0' : 'h-48'} overflow-hidden`}>
                      <img 
                        src={service.image} 
                        alt={service.name} 
                        className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform duration-500" 
                        onClick={() => handleOpenDetails(service)}
                        title="عرض تفاصيل الخدمة الفاخرة"
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-lg text-sm font-bold text-amber-600 flex items-center gap-1.5 shadow-sm">
                        {getCategoryIcon(service.category)} {service.category}
                      </div>
                    </div>
                    <div className="p-5 flex-grow flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-bold text-blue-950 truncate">{service.name}</h3>
                            <button onClick={(e) => openProviderChat(e, service.provider, service.name)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-full transition-colors flex-shrink-0" title="مراسلة مزود الخدمة">
                              <MessageCircle className="w-5 h-5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-1 text-sm font-bold text-slate-700">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-500" /> {service.rating}
                          </div>
                        </div>
                        <p className="text-slate-500 text-sm mb-4">
                          بواسطة: {isProviderNameVisible(service.provider) ? (
                            <Link 
                              to={`/provider-profile/${encodeURIComponent(service.provider)}`}
                              className="font-bold text-blue-950 hover:text-amber-600 underline decoration-amber-400 decoration-1 underline-offset-2 transition-colors inline-block mr-1"
                            >
                              {service.provider}
                            </Link>
                          ) : (
                            "مزود خدمة معتمد"
                          )}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-slate-600 mb-6">
                          <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-slate-400" /> {service.city}</span>
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-slate-100 flex justify-between items-center gap-2">
                        <span className="text-orange-500 font-bold">{service.price} ر.س</span>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleOpenReview(service, 'service')}
                            className="px-2.5 py-1 text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors cursor-pointer"
                            title="أضف تقييمك لهذه الخدمة"
                          >
                            ⭐ تقييم
                          </button>
                          <button 
                            onClick={() => handleRequestService(service)}
                            className="text-blue-950 font-bold hover:text-amber-500 transition-colors"
                          >
                            طلب الخدمة
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              )
            ) : (
              <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
                <p className="text-slate-500 text-lg">لم يتم العثور على خدمات مطابقة.</p>
              </div>
            )}
          </div>

          {/* Dedicated Services Sidebar with Ad Placement */}
          <aside className="lg:col-span-1 space-y-6">
            {/* Sidebar Ad Placement */}
            <div className="space-y-2">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider block">
                مساحة إعلانية مخصصة
              </span>
              <AdBanner 
                placement="شريط جانبي في قائمة الخدمات" 
                layout="card" 
                className="w-full shadow-sm hover:shadow-md transition-shadow" 
              />
            </div>

            {/* Quick Guarantees / Service Trust Box */}
            <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm space-y-3">
              <h4 className="font-bold text-sm text-blue-950 flex items-center gap-2">
                <span>🛡️</span>
                <span>ضمان منصة ليلة للخدمات</span>
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                جميع مزودي الخدمات المساندة معتمدون ومفحوصون وفق معايير جودة صارمة لضمان مناسبة خالية من المفاجآت.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-amber-600 font-bold">
                <span>حماية المدفوعات 100%</span>
                <span>دعم مباشر 24/7</span>
              </div>
            </div>
          </aside>
        </div>

        {/* Request Service Modal */}
        <RequestServiceModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          service={selectedService}
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

      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetType={reviewModalTargetType}
        allowedTargetTypes={['service', 'provider']}
        targetId={reviewTargetService?.id}
        targetName={reviewTargetService?.name}
        providerName={reviewTargetService?.provider}
        onSubmitReview={handleModalSubmitReview}
      />

      </main>
      <Footer />
    </div>
  );
}
