import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, ArrowLeft, Star, MapPin, ShieldCheck, 
  Calendar as CalendarIcon, ClipboardList, BadgePercent, LayoutGrid,
  Utensils, Camera, Music, Sparkle, Layers
} from 'lucide-react';
import { EventService } from '../../data/mockData';

interface HomeIndependentServicesProps {
  servicesList: EventService[];
  selectedServiceCategory: string;
  setSelectedServiceCategory: (id: string) => void;
  serviceCarouselIndex: number;
  setServiceCarouselIndex: React.Dispatch<React.SetStateAction<number>>;
  setSelectedServiceForDetails: (service: EventService) => void;
  setIsServiceDetailsOpen: (open: boolean) => void;
  setSelectedServiceForRequest: (service: EventService) => void;
  setIsServiceRequestOpen: (open: boolean) => void;
}

export const defaultServiceCategories = [
  { id: 'all', name: 'الكل', image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=300&q=80', icon: LayoutGrid },
  { id: 'بوفيه وضيافة', name: 'ضيافة وبوفيه', image: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=300&q=80', icon: Utensils },
  { id: 'تصوير وتوثيق', name: 'تصوير وتوثيق', image: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=300&q=80', icon: Camera },
  { id: 'كوش وتنسيق قاعات', name: 'كوش وتنسيق', image: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=300&q=80', icon: Sparkle },
  { id: 'صوتيات وإضاءة', name: 'صوتيات وإضاءة', image: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=300&q=80', icon: Music },
  { id: 'فرق شعبية وفنون', name: 'عروض وفنون', image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=300&q=80', icon: Layers },
];

export const HomeIndependentServices: React.FC<HomeIndependentServicesProps> = ({
  servicesList,
  selectedServiceCategory,
  setSelectedServiceCategory,
  serviceCarouselIndex,
  setServiceCarouselIndex,
  setSelectedServiceForDetails,
  setIsServiceDetailsOpen,
  setSelectedServiceForRequest,
  setIsServiceRequestOpen
}) => {
  const allFilteredServices = useMemo(() => {
    return servicesList.filter((s) => {
      const isApproved = s.status === 'approved' || s.adminStatus === 'approved' || s.adminStatus === 'فعالة' || s.status === 'نشط' || s.serviceStatus === 'نشط' || s.serviceStatus === 'متاحة' || !s.status;
      const isNotBlocked = s.status !== 'blocked' && s.adminStatus !== 'موقوفة' && s.adminStatus !== 'محظورة' && s.activationStatus !== 'موقوف';
      if (!isApproved || !isNotBlocked) return false;
      if (selectedServiceCategory === 'all') return true;
      
      const cat = (s.category || '').trim();
      const cls = (s.classification || '').trim();
      const name = (s.name || '').trim();
      const target = selectedServiceCategory.trim();

      // Flexible category matching
      if (cat === target || cls === target || name.includes(target)) return true;
      if (target === 'بوفيه وضيافة' && (cat.includes('بوفيه') || cat.includes('ضيافة') || cls.includes('ضيافة') || name.includes('بوفيه') || name.includes('ضيافة') || name.includes('قهوة'))) return true;
      if (target === 'تصوير وتوثيق' && (cat.includes('تصوير') || cat.includes('توثيق') || cls.includes('تصوير') || name.includes('تصوير') || name.includes('فيديو') || name.includes('سينمائي'))) return true;
      if (target === 'كوش وتنسيق قاعات' && (cat.includes('كوش') || cat.includes('تنسيق') || cls.includes('تنسيق') || name.includes('كوش') || name.includes('ورد') || name.includes('زهور'))) return true;
      if (target === 'صوتيات وإضاءة' && (cat.includes('صوت') || cat.includes('إضاءة') || cat.includes('دي جي') || cls.includes('صوت') || name.includes('صوت') || name.includes('إضاءة') || name.includes('ليزر'))) return true;
      if (target === 'فرق شعبية وفنون' && (cat.includes('فرق') || cat.includes('فنون') || cat.includes('عروض') || cls.includes('فنون') || name.includes('فرقة') || name.includes('عرضة') || name.includes('ألحان'))) return true;

      return false;
    });
  }, [servicesList, selectedServiceCategory]);

  const visibleServices = useMemo(() => {
    if (allFilteredServices.length === 0) return [];
    const startIndex = serviceCarouselIndex % allFilteredServices.length;
    const items = [];
    for (let i = 0; i < Math.min(5, allFilteredServices.length); i++) {
      items.push(allFilteredServices[(startIndex + i) % allFilteredServices.length]);
    }
    return items;
  }, [allFilteredServices, serviceCarouselIndex]);

  const handlePrevServices = () => {
    setServiceCarouselIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, allFilteredServices.length - 1)));
  };

  const handleNextServices = () => {
    setServiceCarouselIndex((prev) => (prev + 1) % Math.max(1, allFilteredServices.length));
  };

  return (
    <section className="py-14 sm:py-16 bg-slate-50/70 border-y border-slate-200/80 relative overflow-hidden" id="event-services-planner-section">
      {/* Subtle Ambient Light Decoration */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-200/20 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">

        {/* 1. Header & Title */}
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

        {/* 2. Quick Circular Category Carousel */}
        <div className="mb-8">
          <div className="flex items-center gap-3 sm:gap-6 overflow-x-auto scrollbar-none py-2 px-1 justify-start md:justify-center">
            {defaultServiceCategories.map((cat) => {
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

            {/* دائرة المزيد */}
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

        {/* 3. 5 Cards Row with Floating Controls */}
        <div className="relative mb-12">
          {allFilteredServices.length > 5 && (
            <>
              {/* Right Floating Button */}
              <button
                onClick={handlePrevServices}
                aria-label="السابق"
                className="absolute -right-2 sm:-right-4 md:-right-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-xl hover:shadow-2xl border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800 rotate-180" />
              </button>

              {/* Left Floating Button */}
              <button
                onClick={handleNextServices}
                aria-label="التالي"
                className="absolute -left-2 sm:-left-4 md:-left-6 top-1/2 -translate-y-1/2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white shadow-xl hover:shadow-2xl border border-slate-200 hover:border-amber-400 text-slate-700 hover:text-blue-950 flex items-center justify-center transition-all cursor-pointer hover:scale-110 active:scale-95"
              >
                <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6 text-slate-800" />
              </button>
            </>
          )}

          {/* 5 Cards Grid */}
          {visibleServices.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/90 p-8 text-center my-4">
              <Sparkles className="w-10 h-10 text-amber-500 mx-auto mb-3 opacity-70" />
              <h4 className="text-base font-bold text-blue-950 mb-1">لا توجد خدمات متاحة في هذا التصنيف حالياً</h4>
              <p className="text-xs text-slate-500 mb-4">يمكنك استعراض كافة الخدمات المتوفرة أو الاطلاع على جميع التصنيفات</p>
              <button
                onClick={() => setSelectedServiceCategory('all')}
                className="px-4 py-2 rounded-xl bg-blue-950 hover:bg-blue-900 text-amber-400 text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1.5 cursor-pointer"
              >
                <span>عرض جميع الخدمات</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
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
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                      <div className="absolute top-2.5 right-2.5 z-10">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-950/85 backdrop-blur-md text-amber-400 text-[10px] font-black border border-amber-400/30">
                          {service.category || 'خدمة مساندة'}
                        </span>
                      </div>

                      <div className="absolute top-2.5 left-2.5 z-10">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/60 backdrop-blur-md text-white text-[11px] font-bold">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          <span>{service.rating || '5.0'}</span>
                        </div>
                      </div>

                      <div className="absolute bottom-2 right-2.5 left-2.5 z-10">
                        <h4 className="text-white text-sm sm:text-base font-black truncate leading-tight drop-shadow-md">
                          {service.name}
                        </h4>
                        <div className="flex items-center gap-1.5 text-slate-200 text-xs mt-1">
                          <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                          <span className="truncate">{service.city || 'الرياض'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Body & Action */}
                    <div className="p-3.5 flex-1 flex flex-col justify-between bg-white">
                      <p className="text-slate-500 text-xs line-clamp-2 leading-relaxed mb-3">
                        {service.description || 'خدمة احترافية مميزة لتلبية كافة متطلبات مناسبتكم بأعلى معايير الجودة.'}
                      </p>

                      <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">يبدأ من</span>
                          <span className="text-sm font-black text-blue-950">
                            {Number(service.price || 0).toLocaleString('ar-SA')} <span className="text-[10px] font-medium text-slate-500">ر.س</span>
                          </span>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedServiceForRequest(service);
                            setIsServiceRequestOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-xs hover:shadow-md cursor-pointer"
                        >
                          طلب الخدمة
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Event Planning Steps Strip */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm relative overflow-hidden">
          <div className="text-center mb-6">
            <h3 className="text-lg sm:text-xl font-black text-blue-950">
              كيف تخطط لمناسبتك بذكاء مع ليلة؟
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              خطوات يسيرة تضمن لك مناسبة مثالية متكاملة بدون عناء
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                step: '1',
                title: 'اختر القاعة المناسبة',
                desc: 'تصفح مئات القاعات والاستراحات المعتمدة وقارن الأسعار والمواصفات.',
                icon: CalendarIcon,
                color: 'from-blue-600 to-blue-800'
              },
              {
                step: '2',
                title: 'أضف الخدمات المساندة',
                desc: 'اختر الضيافة، التصوير، الكوش، والصوتيات من أفضل الموردين.',
                icon: ClipboardList,
                color: 'from-amber-500 to-amber-700'
              },
              {
                step: '3',
                title: 'عقد موثق ودفع آمن',
                desc: 'ادفع عبر بوابات الدفع الرسمية مع ضمان كامل لحقوقك التعاقدية.',
                icon: ShieldCheck,
                color: 'from-emerald-500 to-emerald-700'
              },
              {
                step: '4',
                title: 'عروض حصرية وخصومات',
                desc: 'استفد من باقات الأسعار الموحدة الشاملة للضريبة بدون رسوم خفية.',
                icon: BadgePercent,
                color: 'from-purple-500 to-purple-700'
              }
            ].map((st) => {
              const StIcon = st.icon;
              return (
                <div key={st.step} className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/60 flex flex-col items-start gap-2.5">
                  <div className="flex items-center justify-between w-full">
                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${st.color} flex items-center justify-center text-white font-black text-xs shadow-xs`}>
                      {st.step}
                    </div>
                    <StIcon className="w-5 h-5 text-slate-400" />
                  </div>
                  <h4 className="font-bold text-xs sm:text-sm text-blue-950">{st.title}</h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
};
