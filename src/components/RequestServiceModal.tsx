import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, User, MapPin, CreditCard, Info, AlertTriangle, 
  CheckCircle2, Sparkles, Building, Calendar, Phone, 
  ShieldCheck, ArrowLeft, ArrowRight, DollarSign, Wallet
} from 'lucide-react';
import { EventService } from '../data/mockData';
import { getFullDateInfo } from '../utils/dateUtils';
import { useTheme } from '../context/ThemeContext';

interface RequestServiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: EventService | null;
  currentUserData: any;
  userBookings: any[];
  onSuccess: () => void;
}

export default function RequestServiceModal({
  isOpen,
  onClose,
  service,
  currentUserData,
  userBookings,
  onSuccess,
}: RequestServiceModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Active state within the request modal
  const [isSuccess, setIsSuccess] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [serviceDate, setServiceDate] = useState('');
  const [isLinkedToBooking, setIsLinkedToBooking] = useState(false);
  const [selectedBookingId, setSelectedBookingId] = useState('');
  const [contactPhone, setContactPhone] = useState(
    currentUserData?.phone ? currentUserData.phone.replace(/^(05|\+9665|5)/, '5') : ''
  );
  
  const [region, setRegion] = useState('الرياض');
  const [city, setCity] = useState(service?.city || 'الرياض');
  const [detailedAddress, setDetailedAddress] = useState('');
  const [mapsUrl, setMapsUrl] = useState('');

  const [paymentMethod, setPaymentMethod] = useState('mada');
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [processingGateway, setProcessingGateway] = useState<string | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  // Form payment details
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [stcPhone, setStcPhone] = useState('');
  const [fileAttached, setFileAttached] = useState<boolean>(false);

  // Parse payment settings
  const paymentSettings = useMemo(() => {
    try {
      const stored = localStorage.getItem('PAYMENT_SETTINGS');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return { 
      mada: true, 
      creditMax: true, 
      apple: true, 
      stc: true, 
      google_pay: true, 
      tabby: true, 
      tamara: true, 
      bank_transfer: true 
    };
  }, []);

  // Filter valid regions and cities
  const regionsArray = useMemo(() => {
    return (service?.regions || 'الرياض، مكة المكرمة، المنطقة الشرقية')
      .split('،')
      .map(r => r.trim())
      .filter(Boolean);
  }, [service]);

  const citiesArray = useMemo(() => {
    return (service?.cities || 'الرياض، جدة، الدمام، بريدة')
      .split('،')
      .map(c => c.trim())
      .filter(Boolean);
  }, [service]);

  useEffect(() => {
    if (service) {
      setCity(service.city || 'الرياض');
    }
  }, [service]);

  // Early return must happen after all Hooks are registered to maintain constant hook call count and order
  if (!isOpen || !service) return null;

  const totalCost = quantity * service.price;

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    setRequestError(null);

    // Validate date has been selected
    if (!serviceDate) {
      setRequestError('يرجى تحديد تاريخ المناسبة أولاً للمتابعة.');
      return;
    }

    // Validate quantity constraints
    if (service.quantityLimit) {
      const limit = parseInt(service.quantityLimit);
      if (quantity > limit) {
        setRequestError(`الكمية المطلوبة تتجاوز الحد الأقصى المسموح به لطلب هذه الخدمة وهو ${limit} وحدة.`);
        return;
      }
    }

    // Validate booking connection
    if (isLinkedToBooking && !selectedBookingId) {
      setRequestError('يرجى اختيار الحجز المرتبط أو تبديل نوع الطلب إلى كونه خدمة مستقلة.');
      return;
    }

    setPaymentProcessing(true);

    // Simulated Gateway lookup
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
        const standardKeys = ['moyasar', 'hyperpay', 'paytabs', 'geidea'];
        const activeStandard = standardKeys.find(k => enabled[k]);
        activeGatewayKey = activeStandard || localStorage.getItem('ADMIN_ACTIVE_GATEWAY') || 'moyasar';
      }
    } catch (err) {
      activeGatewayKey = 'moyasar';
    }

    const gatewaysMap: Record<string, string> = {
      moyasar: 'مُيسر (Moyasar Secure)',
      hyperpay: 'هايبر باي (HyperPay 3D Secure)',
      paytabs: 'بي تابس (PayTabs Secured)',
      geidea: 'جيديا (Geidea API)',
      tabby_api: 'تابي (Tabby Installments)',
      tamara_api: 'تمارا (Tamara Installments)'
    };
    
    const selectedGateway = gatewaysMap[activeGatewayKey] || 'قناة الدفع الآمنة';
    setProcessingGateway(selectedGateway);

    // Trigger simulator timer
    setTimeout(() => {
      try {
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
          providerName: service.provider || 'مزود الخدمة',
          serviceName: service.name,
          date: serviceDate,
          status: 'قيد الانتظار',
          price: totalCost,
          quantity: quantity,
          paymentMethod: paymentMethod,
          paymentStatus: paymentMethod === 'bank_transfer' ? 'في انتظار التحويل' : 'مدفوع',
          shippingAddress: `${region} - ${city} - ${detailedAddress}`,
          phone: `+966${contactPhone}`,
          locationUrl: mapsUrl
        };

        const existingRequests = JSON.parse(localStorage.getItem('SUPPORT_SERVICE_REQUESTS') || '[]');
        localStorage.setItem('SUPPORT_SERVICE_REQUESTS', JSON.stringify([newRequest, ...existingRequests]));
        window.dispatchEvent(new Event('storage'));

        setPaymentProcessing(false);
        setIsSuccess(true);
        setTimeout(() => {
          onSuccess();
          onClose();
          setIsSuccess(false);
        }, 3000);

      } catch (err: any) {
        setPaymentProcessing(false);
        setRequestError(err?.message || 'وقع خطأ أثناء معالجة تفاصيل الطلب، يرجى المحاولة لاحقاً.');
      }
    }, 2000);
  };

  return (
    <div 
      id="request-service-modal-overlay" 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
    >
      <div 
        id="request-service-panel" 
        className={`relative rounded-3xl overflow-hidden shadow-2xl max-w-5xl w-full border flex flex-col md:flex-row max-h-[85vh] transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-950 text-slate-100 border-slate-800' 
            : 'bg-white text-slate-850 border-slate-200'
        }`}
      >
        {/* Absolute Close Option */}
        <button 
          onClick={onClose}
          className={`absolute top-4 left-4 z-30 p-2 text-xs rounded-full transition-all duration-300 border backdrop-blur-sm shadow-md ${
            isDark 
              ? 'bg-slate-900/65 hover:bg-red-500/30 text-slate-300 hover:text-white border-slate-800' 
              : 'bg-slate-100/80 hover:bg-red-550/20 text-slate-600 hover:text-red-700 border-slate-200'
          }`}
          title="إغلاق التبويب وإلغاء الطلب"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Column 1: Luxury Vertical Sidebar Detail Frame (Right Section) */}
        <div className={`relative w-full md:w-5/12 h-44 md:h-auto shrink-0 overflow-hidden flex flex-col justify-end p-6 md:p-8 border-b md:border-b-0 md:border-l transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-950/20 border-slate-900' 
            : 'bg-slate-50/10 border-slate-200'
        }`}>
          {/* Cover Graphic visual with soft glow */}
          <div className="absolute inset-0 z-0">
            <img 
              src={service.image} 
              alt={service.name} 
              className="w-full h-full object-cover transition-transform duration-1000 saturate-110"
            />
            {/* Elegant luxury visual vignette gradient */}
            <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/30"></span>
            {/* Subtle premium glow effect to mimic premium styling */}
            <span className="absolute -top-1/4 -right-1/4 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl"></span>
          </div>

          <div className="relative z-10 space-y-4">
            <span className="bg-gradient-to-l from-amber-500/20 to-orange-500/20 backdrop-blur-md border border-amber-500/30 text-amber-300 px-3 py-1 rounded-full text-[10px] font-extrabold w-fit flex items-center gap-1.5 shadow-md">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 animate-pulse" />
              خدمة مساندة مستقلة فاخرة
            </span>

            <div>
              <p className="text-xs text-slate-400 font-medium">الخدمة المحددة</p>
              <h3 className="text-xl md:text-2xl font-extrabold text-white tracking-tight leading-snug drop-shadow-sm">
                {service.name}
              </h3>
            </div>

            <div className="p-3.5 bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">سعر الوحدة</span>
                <span className="text-sm font-extrabold text-slate-200">{service.price.toLocaleString()} ر.س</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">مزود الخدمة</span>
                <span className="text-sm font-extrabold text-amber-500 truncate block">{service.provider}</span>
              </div>
            </div>

            {/* Price Badge calculation representation */}
            <div className="hidden md:block pt-3 border-t border-slate-850">
              <span className="text-slate-400 text-xs block mb-1">تفصيل الحسبة اللحظية</span>
              <div className="flex justify-between items-baseline">
                <span className="text-slate-300 text-xs font-medium">الإجمالي (شامل رسوم الضمان):</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-orange-500">{totalCost.toLocaleString()}</span>
                  <span className="text-[10px] text-slate-400 font-bold">ريال سعودي</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Column 2: Form Scrollable Segment (Left Section) */}
        {!(localStorage.getItem('IS_AUTHENTICATED') === 'true') ? (
          <div className={`flex-grow p-8 md:p-12 flex flex-col justify-center items-center text-center transition-colors duration-300 ${
            isDark ? 'bg-slate-950/40 text-slate-100' : 'bg-slate-50/50 text-slate-800'
          }`}>
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 border ${
              isDark ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-blue-50 text-blue-600 border-blue-105'
            }`}>
              <User className="w-8 h-8" />
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>يرجى تسجيل الدخول أولاً</h3>
            <p className={`text-sm max-w-sm leading-relaxed mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              يجب أن تكون مسجلاً ولديك حساب في منصتنا من أجل حجز أو طلب الخدمات المساندة بضمانات رسمية.
            </p>
            <button 
              onClick={() => { onClose(); alert('يرجى الضغط على زر تسجيل الدخول في أعلى الصفحة الرئيسية.'); }}
              className="w-full max-w-xs py-3.5 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-sm rounded-xl transition-all shadow-lg"
            >
              الذهاب لتسجيل الدخول
            </button>
          </div>
        ) : (
          <div className={`flex-grow p-6 md:p-8 flex flex-col justify-between overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950/40 text-slate-100' : 'bg-slate-50/50 text-slate-800'}`}>
            {!isSuccess ? (
              <form onSubmit={handleSubmitRequest} className="flex flex-col justify-between h-full overflow-hidden">
                
                {/* Form Inputs Container - ONLY scrolling part */}
                <div className="space-y-6 overflow-y-auto pr-1 pl-1 max-h-[50vh] md:max-h-[54vh] scrollbar-thin scrollbar-thumb-slate-850 scrollbar-track-transparent">
                  
                  {/* Luxury Alert if Error */}
                  {requestError && (
                    <div className={`border rounded-2xl p-4 flex items-start gap-3 transition-colors ${
                      isDark 
                        ? 'bg-red-950/40 border-red-500/30 text-red-200' 
                        : 'bg-red-50 border-red-205 text-red-800'
                    }`}>
                      <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 text-red-400" />
                      <div className="flex-grow text-xs leading-relaxed">
                        <span className={`font-extrabold block text-sm mb-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>يوجد خطأ في معالجة طلبك</span>
                        {requestError}
                      </div>
                    </div>
                  )}

                  {/* Partition 1: Client details read-only display */}
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-extrabold tracking-widest text-amber-500 uppercase flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
                      بيانات العميل (من الحساب الشخصي الموثق)
                    </h4>
                    <div className={`grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-2xl border transition-colors ${
                      isDark ? 'bg-slate-900/35 border-slate-900' : 'bg-slate-100/60 border-slate-200'
                    }`}>
                      <div className={`p-3 rounded-xl border transition-colors ${
                        isDark ? 'bg-slate-900/60 border-slate-850/65 text-slate-300' : 'bg-white border-slate-200/80 text-slate-700 shadow-sm'
                      }`}>
                        <span className="text-[10px] text-slate-400 block mb-0.5">الاسم الكريم</span>
                        <span className="text-xs font-bold truncate block">{currentUserData?.name || 'عميل المساندة'}</span>
                      </div>
                      <div className={`p-3 rounded-xl border transition-colors ${
                        isDark ? 'bg-slate-900/60 border-slate-850/65 text-slate-300' : 'bg-white border-slate-200/80 text-slate-700 shadow-sm'
                      }`}>
                        <span className="text-[10px] text-slate-400 block mb-0.5">البريد الإلكتروني</span>
                        <span className="text-xs font-bold truncate block text-left" dir="ltr">{currentUserData?.email || 'customer@example.sa'}</span>
                      </div>
                      <div className={`p-3 rounded-xl border transition-colors ${
                        isDark ? 'bg-slate-900/60 border-slate-850/65 text-slate-300' : 'bg-white border-slate-200/80 text-slate-700 shadow-sm'
                      }`}>
                        <span className="text-[10px] text-slate-400 block mb-0.5">الجوال الموثق</span>
                        <span className="text-xs font-bold truncate block text-left" dir="ltr">{currentUserData?.phone || '+9665XXXXXXXX'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Partition 2: Delivery & Direct Contact Requirements */}
                  <div className="space-y-3">
                    <h4 className={`text-[10px] font-extrabold tracking-widest uppercase flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                      معطيات وموقع تقديم الخدمة المساندة
                    </h4>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Connection Phone with country code */}
                      <div>
                        <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>رقم جوال العميل للتواصل النهائي</label>
                        <div className={`flex rounded-xl overflow-hidden border transition-colors ${
                          isDark ? 'border-slate-800 bg-slate-900' : 'border-slate-200 bg-white'
                        }`} dir="ltr">
                          <span className={`inline-flex items-center px-4.5 text-xs border-r font-extrabold ${
                            isDark ? 'text-slate-300 bg-slate-850 border-slate-850' : 'text-slate-600 bg-slate-100 border-slate-200'
                          }`}>+966</span>
                          <input 
                            required 
                            type="tel"
                            maxLength={10} 
                            pattern="[0-9]{9,10}" 
                            value={contactPhone}
                            onChange={(e) => setContactPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            className={`bg-transparent border-0 block flex-1 min-w-0 w-full text-xs p-3.5 focus:outline-none focus:ring-0 ${
                              isDark ? 'text-slate-200 placeholder-slate-600' : 'text-slate-800 placeholder-slate-400'
                            }`} 
                            placeholder="5XXXXXXXX" 
                          />
                        </div>
                      </div>

                      {/* Region Selector */}
                      <div>
                        <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>المنطقة</label>
                        <select 
                          required 
                          value={region}
                          onChange={(e)=>setRegion(e.target.value)}
                          className={`w-full px-4 py-3.5 rounded-xl border outline-none text-xs transition-colors ${
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-300 focus:border-amber-500' : 'border-slate-200 bg-white text-slate-800 focus:border-amber-500'
                          }`}
                        >
                          {regionsArray.map((r, i) => (
                            <option key={i} value={r} className={isDark ? "bg-slate-950 text-white" : "bg-white text-slate-800"}>{r}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* City Selector */}
                      <div>
                        <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>المدينة</label>
                        <select 
                          required 
                          value={city}
                          onChange={(e)=>setCity(e.target.value)}
                          className={`w-full px-4 py-3.5 rounded-xl border outline-none text-xs transition-colors ${
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-300 focus:border-amber-500' : 'border-slate-200 bg-white text-slate-800 focus:border-amber-500'
                          }`}
                        >
                          {citiesArray.map((c, i) => (
                            <option key={i} value={c} className={isDark ? "bg-slate-950 text-white" : "bg-white text-slate-800"}>{c}</option>
                          ))}
                        </select>
                      </div>

                      {/* Detailed Address */}
                      <div>
                        <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>العنوان بالتفصيل أو الوطني</label>
                        <input 
                          required 
                          type="text" 
                          value={detailedAddress}
                          onChange={(e)=>setDetailedAddress(e.target.value)}
                          className={`w-full px-4 py-3.5 rounded-xl border outline-none text-xs transition-colors ${
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-600 focus:border-amber-500' : 'border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-amber-500'
                          }`} 
                          placeholder="مثال: حي النرجس، شارع مكة، رقم البناية 4" 
                        />
                      </div>
                    </div>

                    <div className="relative">
                      <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>رابط الخارطة (Google Maps) لموقع المناسبة</label>
                      <div className="relative flex items-center">
                        <input 
                          type="url" 
                          value={mapsUrl}
                          onChange={(e)=>setMapsUrl(e.target.value)}
                          className={`w-full px-4 py-3.5 pl-14 rounded-xl border outline-none text-xs text-left transition-colors ${
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-200 placeholder-slate-600 focus:border-amber-500' : 'border-slate-200 bg-white text-slate-800 placeholder-slate-400 focus:border-amber-500'
                          }`} 
                          dir="ltr" 
                          placeholder="https://maps.google.com/..." 
                        />
                        <button 
                          type="button" 
                          onClick={() => {
                            const sampleUrl = `https://maps.google.com/?q=${encodeURIComponent(city + ' ' + region)}`;
                            setMapsUrl(sampleUrl);
                            alert('تم توليد إحداثيات تقريبية لعنوانك المحدد في المدينة!');
                          }} 
                          className={`absolute left-2.5 p-2 rounded-lg transition-all border ${
                            isDark ? 'bg-slate-800 hover:bg-slate-700 text-amber-550 border-slate-700/50' : 'bg-slate-100 hover:bg-slate-200 text-amber-600 border-slate-205'
                          }`} 
                          title="استخراج تلقائي لموقع تقريبي"
                        >
                          <MapPin className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Partition 3: Booking connection setup */}
                  <div className={`p-4 border rounded-2xl space-y-4 transition-colors duration-200 ${
                    isDark ? 'bg-slate-900/20 border-slate-800' : 'bg-slate-100/40 border-slate-205'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className={`block text-xs font-extrabold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>نوع وهدف طلب هذه الخدمة المساندة:</label>
                      <div className="flex gap-4">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="requestTargetType" 
                            checked={!isLinkedToBooking} 
                            onChange={() => { setIsLinkedToBooking(false); setSelectedBookingId(''); }} 
                            className="w-4 h-4 text-amber-500 focus:ring-0 bg-transparent border-slate-400" 
                          />
                          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>مستقلة بالكامل</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="radio" 
                            name="requestTargetType" 
                            checked={isLinkedToBooking} 
                            onChange={() => setIsLinkedToBooking(true)} 
                            className="w-4 h-4 text-amber-500 focus:ring-0 bg-transparent border-slate-400" 
                          />
                          <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>تتبع حجز حالي</span>
                        </label>
                      </div>
                    </div>

                    {isLinkedToBooking && (
                      <div className={`space-y-2 border-t pt-3 animate-in fade-in duration-300 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                        <label className="block text-xs font-bold text-amber-550">اختر حجز قاعة المربوط بالخدمة المساندة <span className="text-red-500">*</span></label>
                        {userBookings.length > 0 ? (
                          <select 
                            className={`w-full p-3.5 rounded-xl border outline-none text-xs font-bold transition-colors ${
                              isDark ? 'border-slate-800 bg-slate-900 text-slate-300 focus:border-amber-500' : 'border-slate-200 bg-white text-slate-705 focus:border-amber-550'
                            }`}
                            value={selectedBookingId}
                            onChange={(e) => setSelectedBookingId(e.target.value)}
                            required={isLinkedToBooking}
                          >
                            <option value="">-- اضغط لتحديد حجزك وتنسيقه --</option>
                            {userBookings.map(b => (
                              <option key={b.id} value={b.id} className={isDark ? "bg-slate-950 text-white" : "bg-white text-slate-800"}>
                                حجز رقم #{b.id} - {b.hall || b.type} ({b.startDate})
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className={`text-xs p-3 rounded-xl leading-relaxed border ${
                            isDark ? 'text-orange-405 bg-orange-950/20 border-orange-500/10' : 'text-orange-700 bg-orange-50 border-orange-200'
                          }`}>
                            تنبيه: لم نعثر في سجلك على حجوزات نشطة تناسب الحساب الحالي. يرجى طلب الخدمة بصفتها مستقلة وبدون ربط.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Partition 4: Quantity & Event timing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        الكمية المطلوبة {service.quantityLimit ? `(الحد الأقصى المسموح: ${service.quantityLimit})` : ''}
                      </label>
                      <input 
                        required 
                        type="number" 
                        min="1" 
                        max={service.quantityLimit ? parseInt(service.quantityLimit) : undefined} 
                        value={quantity} 
                        onChange={(e)=>setQuantity(parseInt(e.target.value) || 1)} 
                        className={`w-full px-4 py-3 rounded-xl border transition-colors outline-none text-xs font-bold ${
                          service.quantityLimit && quantity > parseInt(service.quantityLimit) 
                            ? 'border-red-500 focus:border-red-500 text-red-500 bg-red-50/15' 
                            : isDark ? 'border-slate-800 bg-slate-900 focus:border-amber-500 text-slate-200' : 'border-slate-200 bg-white focus:border-amber-500 text-slate-800'
                        }`} 
                      />
                      {service.quantityLimit && quantity > parseInt(service.quantityLimit) && (
                        <p className="text-red-500 text-[10px] mt-1.5 font-bold">عذراً! الكمية المطلوبة تتجاوز المتاح من المزود.</p>
                      )}
                    </div>

                    <div>
                      <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>تاريخ المناسبة المستهدفة</label>
                      <div className="relative">
                        <input 
                          required 
                          type="date" 
                          value={serviceDate} 
                          onChange={(e)=>setServiceDate(e.target.value)} 
                          className={`w-full px-4 py-3.5 rounded-xl border outline-none text-xs font-mono transition-colors ${
                            isDark ? 'border-slate-800 bg-slate-900 text-slate-300 focus:border-amber-500' : 'border-slate-200 bg-white text-slate-800 focus:border-amber-550'
                          }`} 
                        />
                        {serviceDate && (
                          <div className={`absolute left-3 top-3 text-[10px] border px-2 py-0.5 rounded-lg font-bold ${
                            isDark ? 'bg-amber-500/10 text-amber-300 border-amber-500/20' : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            هجري: {getFullDateInfo(new Date(serviceDate)).hijri.full}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Partition 5: Financial Security Gateways & Checkout */}
                  <div className={`border-t pt-6 mt-4 space-y-4 transition-colors ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-amber-500 animate-pulse" />
                      <h4 className={`text-[10px] font-extrabold tracking-widest uppercase ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        بوابة الدفع الإلكتروني المشفر والمضمون
                      </h4>
                    </div>

                    {/* Compact payment method visual selections */}
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {[
                        { key: 'mada', name: 'مدى' },
                        { key: 'creditMax', name: 'البطاقات الائتمانية' },
                        { key: 'apple', name: 'Apple Pay' },
                        { key: 'google_pay', name: 'Google Pay' },
                        { key: 'stc', name: 'STC Pay' },
                        { key: 'tabby', name: 'تابي (تقسيط)' },
                        { key: 'tamara', name: 'تمارا (تقسيط)' },
                        { key: 'bank_transfer', name: 'تحويل يدوي' }
                      ].filter(item => 
                        paymentSettings[item.key as keyof typeof paymentSettings]
                      ).map((item) => (
                        <label 
                          key={item.key} 
                          className={`border rounded-xl p-3 flex flex-col items-center justify-center cursor-pointer transition-all ${
                            paymentMethod === item.key 
                              ? 'border-amber-500 bg-gradient-to-b from-amber-500/10 to-transparent shadow-lg text-amber-500' 
                              : isDark ? 'border-slate-800 bg-slate-900/30 text-slate-400 hover:border-slate-700 hover:text-slate-200' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 shadow-sm'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="checkoutPaymentOption" 
                            value={item.key} 
                            className="hidden" 
                            checked={paymentMethod === item.key} 
                            onChange={() => setPaymentMethod(item.key)} 
                          />
                          <Wallet className={`w-5 h-5 mb-1.5 ${paymentMethod === item.key ? 'text-amber-500' : 'text-slate-400'}`} />
                          <span className="text-[10px] font-extrabold text-center block whitespace-nowrap leading-none">
                            {item.name}
                          </span>
                        </label>
                      ))}
                    </div>

                    {/* Integrated mini secure sub-forms */}
                    <div className={`p-4 rounded-2xl border animate-in fade-in duration-300 transition-colors ${
                      isDark ? 'bg-slate-900/50 border-slate-900' : 'bg-slate-100/50 border-slate-200'
                    }`}>
                      
                      {/* Gateway Form 1: Cards */}
                      {(paymentMethod === 'mada' || paymentMethod === 'creditMax') && (
                        <div className="space-y-3.5">
                          <div>
                            <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>الاسم المحفور على البطاقة</label>
                            <input 
                              required 
                              type="text" 
                              value={cardName}
                              onChange={(e)=>setCardName(e.target.value)}
                              className={`w-full border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-amber-500 transition-colors ${
                                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                              }`} 
                              placeholder="MOHAMMAD AL-MUTAIRI" 
                            />
                          </div>
                          <div>
                            <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>رقم بطاقة الصراف الائتمانية</label>
                            <input 
                              required 
                              type="text" 
                              maxLength={19}
                              value={cardNumber}
                              onChange={(e)=>{
                                const clean = e.target.value.replace(/[^0-9]/g, '');
                                const formatted = clean.match(/.{1,4}/g)?.join(' ') || clean;
                                setCardNumber(formatted);
                              }}
                              className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-amber-500 transition-colors ${
                                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                              }`} 
                              placeholder="4000 1234 5678 9010" 
                              dir="ltr" 
                            />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>تاريخ نهاية الصلاحية</label>
                              <input 
                                required 
                                type="text" 
                                maxLength={5}
                                value={cardExpiry}
                                onChange={(e)=>{
                                  const clean = e.target.value.replace(/[^0-9]/g, '');
                                  if (clean.length >= 2) {
                                    setCardExpiry(clean.slice(0,2) + '/' + clean.slice(2,4));
                                  } else {
                                    setCardExpiry(clean);
                                  }
                                }}
                                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono text-center focus:outline-none focus:border-amber-500 transition-colors ${
                                  isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800'
                                }`} 
                                placeholder="MM/YY" 
                                dir="ltr" 
                              />
                            </div>
                            <div>
                              <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>الرمز السري الخلفي (CVC)</label>
                              <input 
                                required 
                                type="password" 
                                maxLength={3}
                                value={cardCvc}
                                onChange={(e)=>setCardCvc(e.target.value.replace(/[^0-9]/g, ''))}
                                className={`w-full border rounded-xl px-3.5 py-2.5 text-xs text-center font-mono focus:outline-none focus:border-amber-500 transition-colors ${
                                  isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-850'
                                }`} 
                                placeholder="***" 
                                dir="ltr" 
                              />
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Gateway Form 2: Apple Pay / Google Pay Sim */}
                      {(paymentMethod === 'apple' || paymentMethod === 'google_pay') && (
                        <div className="py-4 text-center">
                          <p className={`text-xs leading-relaxed mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                            سيتم تفعيل الدفع الفوري الآمن والمباشر بنقرة واحدة بمجرد الضغط على زر تأكيد الطلب السفلي.
                          </p>
                          <div className={`border rounded-xl p-3 inline-block font-mono text-xs ${
                            isDark ? 'border-slate-800 bg-slate-950/50 text-amber-400' : 'border-slate-200 bg-white text-amber-600'
                          }`}>
                            🛡️ جاهز للمصادقة السريعة عبر البصمة/الوجه
                          </div>
                        </div>
                      )}

                      {/* Gateway Form 3: STC Pay */}
                      {paymentMethod === 'stc' && (
                        <div className="space-y-2">
                          <label className={`block text-[10px] font-bold mb-1 ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>رقم جوال المنشأ عليه المحفظة في STC Pay</label>
                          <input 
                            required 
                            type="tel" 
                            maxLength={10}
                            value={stcPhone}
                            onChange={(e)=>setStcPhone(e.target.value.replace(/[^0-9]/g, ''))}
                            className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono text-left focus:outline-none focus:border-amber-505 transition-colors ${
                              isDark ? 'bg-slate-950/60 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-750'
                            }`} 
                            placeholder="05XXXXXXXX" 
                            dir="ltr" 
                          />
                          <p className="text-[9px] text-slate-400 text-right">سنرسل لك رمز إشعار فوري مكون من 4 خانات لتأكيد السحب خلال ثوانٍ.</p>
                        </div>
                      )}

                      {/* Gateway Form 4: Tabby / Tamara Divide Calculator */}
                      {(paymentMethod === 'tabby' || paymentMethod === 'tamara') && (
                        <div className="space-y-3 font-sans">
                          <div className="flex items-start gap-2.5">
                            <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                            <div>
                              <span className={`text-[11px] font-bold block ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                                قسّم الحسبة على 4 دفعات بدون فوائد شهرياً
                              </span>
                              <p className={`text-[10px] leading-normal mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                يمكنك تقسيط مبلغ هذه الخدمة المساندة المستقلة مع الضوابط المتوافقة بالكامل مع الشريعة الإسلامية.
                              </p>
                            </div>
                          </div>
                          <div className={`flex justify-between items-center p-3 rounded-xl border text-xs font-bold transition-colors ${
                            isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-white border-slate-200 shadow-sm'
                          }`}>
                            <span className={isDark ? 'text-slate-400' : 'text-slate-505'}>قيمة القسط الشهري:</span>
                            <span className="text-amber-550 text-sm font-extrabold">{(totalCost / 4).toFixed(2)} ر.س / شهر</span>
                          </div>
                        </div>
                      )}

                      {/* Gateway Form 5: Bank Transfer Display card */}
                      {paymentMethod === 'bank_transfer' && (
                        <div className="space-y-3.5">
                          <div className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                            isDark ? 'bg-slate-950/60 border-slate-850' : 'bg-white border-slate-200 shadow-sm'
                          }`}>
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>اسم البنك المعتمد:</span>
                              <span className={`font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>مصرف الراجحي للشركات</span>
                            </div>
                            <div className="flex justify-between">
                              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>اسم المستفيد الكامل:</span>
                              <span className="font-bold text-amber-550 truncate max-w-[200px]">{service.provider}</span>
                            </div>
                            <div className="flex justify-between items-baseline">
                              <span className={isDark ? 'text-slate-500' : 'text-slate-400'}>رقم الحساب الآيبان:</span>
                              <span className={`font-mono font-extrabold select-all ${isDark ? 'text-slate-300' : 'text-slate-750'}`} dir="ltr">SA43 8000 0000 1234 5678 9012</span>
                            </div>
                          </div>
                          <div className={`p-3 border border-dashed rounded-xl flex items-center justify-between text-xs transition-colors ${
                            isDark ? 'bg-slate-950/40 border-slate-800' : 'bg-white border-slate-200 shadow-sm'
                          }`}>
                            <span className={isDark ? 'text-slate-450' : 'text-slate-500'}>إرفاق إثبات الحوالة لسرعة الدعم:</span>
                            <label className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all text-[10px] border ${
                              isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-705' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-205'
                            }`}>
                              إرفاق الإيصال
                              <input 
                                type="file" 
                                accept="image/*" 
                                className="hidden" 
                                onChange={()=>setFileAttached(true)} 
                              />
                            </label>
                          </div>
                          {fileAttached && (
                            <div className={`text-[10px] font-bold p-2 rounded-lg text-center border transition-all ${
                              isDark ? 'text-emerald-405 bg-emerald-950/20 border-emerald-500/10' : 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            }`}>
                              ✓ تم إرفاق مستند الإيصال بنجاح وسيرفع لمقدم الخدمة.
                            </div>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                </div>

                {/* Fixed Stat & Buttons bottom interface - NO SCROLL */}
                <div className="pt-4 border-t border-slate-900 mt-4 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block mb-0.5">الإجمالي النهائي المستحق للسداد</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl md:text-3xl font-black text-orange-500 font-sans">{totalCost.toLocaleString()}</span>
                      <span className="text-xs font-extrabold text-slate-300">ريال</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      type="button" 
                      onClick={onClose}
                      disabled={paymentProcessing}
                      className="px-5 py-3 rounded-xl text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 text-xs font-bold transition-all whitespace-nowrap"
                    >
                      إلغاء الطلب
                    </button>

                    <button 
                      type="submit"
                      disabled={paymentProcessing}
                      className="px-6 py-3 bg-gradient-to-l from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-orange-500/10 hover:scale-[1.02] active:scale-95 transition-all duration-300 min-w-[150px] flex items-center justify-center gap-2"
                    >
                      {paymentProcessing ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin"></span>
                          <span className="text-[10px]">يقوم {processingGateway ? 'المعالج' : 'النظام'} بالدفع...</span>
                        </>
                      ) : (
                        "تأكيد وحجز الخدمة"
                      )}
                    </button>
                  </div>
                </div>

              </form>
            ) : (
              <div className="p-8 md:p-12 text-center flex flex-col items-center justify-center h-full animate-fade-in">
                <div className="relative mb-6">
                  <div className="w-20 h-20 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center border border-emerald-500/20 shadow-md">
                    <CheckCircle2 className="w-10 h-10 animate-bounce" />
                  </div>
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-amber-500/10 text-amber-400 rounded-full flex items-center justify-center font-bold text-xs border border-amber-500/20">
                    <Sparkles className="w-3 h-3 fill-amber-400 animate-pulse" />
                  </span>
                </div>
                
                <h3 className="text-xl md:text-2xl font-extrabold text-white mb-2 tracking-tight">
                  تم استلام طلب الخدمة بنجاح!
                </h3>
                <p className="text-slate-400 text-xs max-w-sm leading-relaxed mb-6">
                  تم إدراج طلبك لخدمة <strong className="text-amber-500">{service.name}</strong> في قائمة الطلبات قيد المراجعة. سيقوم المزود <strong className="text-slate-200">({service.provider})</strong> الموقر بمراجعة الجدول والاتصال بك لتأكيد الترتيبات.
                </p>
                <div className="border border-slate-850 p-3 bg-slate-900/30 rounded-xl text-[10px] text-amber-500">
                  سيتم إغلاق هذه النافذة تلقائياً خلال لحظات...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
