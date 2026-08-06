import React from 'react';
import { X, Star, MapPin, Globe, ShieldAlert, BadgeCheck, Sparkles, Award, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { EventService, getPartnerLevel, providers } from '../data/mockData';
import { useTheme } from '../context/ThemeContext';
import { ItemQrCodeButton } from './common/ItemQrCodeModal';

interface ServiceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: EventService | null;
  onRequest: (service: EventService) => void;
}

export default function ServiceDetailsModal({
  isOpen,
  onClose,
  service,
  onRequest,
}: ServiceDetailsModalProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (!isOpen || !service) return null;

  const isLevelsEnabled = typeof window !== 'undefined' && localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false';
  const providerData = providers.find((p) => p.name === service.provider);
  const partnerLevel = providerData
    ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isLevelsEnabled, providerData.packageName, providerData.packageDuration)
    : null;

  // Split regions or cities safely
  const parsedRegions = service.regions
    ? service.regions.split('،').map((r) => r.trim()).filter(Boolean)
    : [];
  const parsedCities = service.cities
    ? service.cities.split('،').map((c) => c.trim()).filter(Boolean)
    : [service.city];

  return (
    <div id="service-details-modal-overlay" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      {/* Centered Modal Container */}
      <div 
        id="service-details-panel" 
        className={`relative rounded-3xl overflow-hidden shadow-2xl max-w-4xl w-full border flex flex-col md:flex-row max-h-[85vh] transition-all duration-300 ${
          isDark 
            ? 'bg-gradient-to-br from-slate-900 to-slate-950 text-slate-100 border-slate-800' 
            : 'bg-white text-slate-800 border-slate-200'
        }`}
      >
        {/* Top Left Action Buttons */}
        <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
          <ItemQrCodeButton
            item={{ id: service.id, name: service.name, type: 'service', provider: service.provider, image: service.image }}
            variant="icon"
          />
          <button 
            id="close-modal-btn"
            onClick={onClose}
            className={`p-2.5 rounded-full transition-all duration-300 backdrop-blur-sm border ${
              isDark 
                ? 'bg-slate-900/60 hover:bg-red-500/30 text-slate-300 hover:text-white border-slate-700/50' 
                : 'bg-slate-100/80 hover:bg-red-550/20 text-slate-600 hover:text-red-700 border-slate-300'
            }`}
            title="إغلاق التبويب"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Interactive Media Showcase (Right section in RTL) */}
        <div className="relative w-full md:w-5/12 h-64 md:h-auto shrink-0 overflow-hidden group">
          {/* Main Visual */}
          <img 
            src={service.image} 
            alt={service.name} 
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
          {/* Subtle Ambient Vignette Overlay - Always dark with white text overlay for maximum contrast */}
          <span className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent md:bg-gradient-to-l md:from-slate-950 md:via-slate-950/40 md:to-transparent opacity-95"></span>
          
          {/* High-end Brand / Rating badge overlay */}
          <div className="absolute bottom-6 right-6 left-6 flex flex-col gap-2">
            <span className="bg-amber-500/20 backdrop-blur-md border border-amber-500/40 text-amber-300 px-3 py-1 rounded-full text-xs font-bold w-fit flex items-center gap-1.5 shadow-lg tracking-wider">
              <Sparkles className="w-3.5 h-3.5 fill-amber-300 animate-pulse" />
              خدمة مساندة فاخرة
            </span>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight drop-shadow-md leading-snug">
              {service.name}
            </h2>

            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-slate-200 text-sm font-semibold bg-white/10 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-white/10">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span>{service.rating || '4.8'}</span>
              </div>
              <span className="text-slate-300 text-xs font-medium">التقييم العام للمزود</span>
            </div>
          </div>
        </div>

        {/* Section 2: Details Content Area (Left section in RTL) */}
        <div className={`flex-grow p-6 md:p-8 flex flex-col justify-between overflow-hidden transition-colors duration-300 ${isDark ? 'bg-slate-950/40' : 'bg-slate-50/50'}`}>
          
          {/* Partitioned details area - constrained so no outer page scrollbars exist */}
          <div className="space-y-6 overflow-y-auto pr-2 max-h-[45vh] md:max-h-[50vh] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
            
            {/* Row 1: Quick stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                isDark 
                  ? 'bg-slate-900/60 border-slate-800/80' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="p-2.5 bg-blue-500/10 text-blue-500 rounded-xl">
                  <BadgeCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className={`block text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>مقدم الخدمة</span>
                  <span className={`text-xs font-bold truncate block max-w-[140px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{service.provider || 'نخبة المصممين'}</span>
                </div>
              </div>

              <div className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-colors ${
                isDark 
                  ? 'bg-slate-900/60 border-slate-800/80' 
                  : 'bg-white border-slate-200 shadow-sm'
              }`}>
                <div className="p-2.5 bg-orange-500/10 text-orange-500 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <span className={`block text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>المدينة الرئيسية</span>
                  <span className={`text-xs font-bold truncate block max-w-[140px] ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{service.city}</span>
                </div>
              </div>
            </div>

            {/* SERVICE PERFORMANCE & TRANSPARENCY CARD (بطاقة مستوى الشراكة وشفافية الأداء للخدمات) */}
            {isLevelsEnabled && (
              <div className={`p-4 rounded-2xl border space-y-3 transition-all ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-100 shadow-sm' 
                  : 'bg-white border-purple-200/90 text-slate-800 shadow-sm'
              }`}>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-purple-100 dark:border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400 rounded-xl border border-purple-200/80 dark:border-purple-800/60">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black flex items-center gap-1.5">
                        <span>شفافية أداء الخدمة ومستوى الشراكة</span>
                        <span className="bg-purple-100 text-purple-800 dark:bg-purple-900/60 dark:text-purple-300 text-[9px] font-black px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                          مزود معتمد
                        </span>
                      </h4>
                      <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        المزود المسؤول: <strong className="text-purple-700 dark:text-purple-300 font-extrabold">{service.provider || 'نخبة المصممين'}</strong>
                      </p>
                    </div>
                  </div>

                  {partnerLevel && (
                    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black border ${partnerLevel.bg} ${partnerLevel.color} ${partnerLevel.border} shadow-sm`}>
                      <span>{partnerLevel.icon}</span>
                      <span>{partnerLevel.name}</span>
                    </div>
                  )}
                </div>

                {/* Service Metrics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200/70'}`}>
                    <span className={`text-[10px] block font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>الطلبات المنجزة</span>
                    <strong className="text-xs font-black text-purple-700 dark:text-purple-300 mt-0.5 block">
                      {providerData?.bookingsCount || (service as any).reviewsCount || 15}+ طلب منفذ
                    </strong>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200/70'}`}>
                    <span className={`text-[10px] block font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>معدل تقييم الجودة</span>
                    <strong className="text-xs font-black text-amber-600 mt-0.5 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400 inline" />
                      {service.rating || providerData?.rating || 4.9} / 5.0
                    </strong>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200/70'}`}>
                    <span className={`text-[10px] block font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>نطاق الملاءمة والسرعة</span>
                    <strong className="text-xs font-black text-emerald-700 dark:text-emerald-400 mt-0.5 block">
                      تغطية سريعة ({service.city})
                    </strong>
                  </div>

                  <div className={`p-2.5 rounded-xl border ${isDark ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200/70'}`}>
                    <span className={`text-[10px] block font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ضمان التنفيذ الحقيقي</span>
                    <strong className="text-xs font-black text-indigo-700 dark:text-indigo-300 mt-0.5 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 inline" />
                      ضمان منصة ليلة 100%
                    </strong>
                  </div>
                </div>
              </div>
            )}

            {/* Description Tab */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full"></span>
                عن الخدمة
              </h4>
              <p className={`text-xs leading-relaxed font-normal transition-colors ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                {service.description || 'هذه الخدمة المساندة تضمن إضفاء أرقى اللمسات الإبداعية لتكامل مناسبتك وجعلها ذكرى لا تُنسى بأقصى درجات الاحترافية والجمال.'}
              </p>
            </div>

            {/* Service Classification & Taxonomy Banner */}
            <div className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
              isDark ? 'bg-indigo-950/25 border-indigo-900/50 text-indigo-300' : 'bg-purple-50 border-purple-100 text-purple-800'
            }`}>
              <span className="font-bold">تصنيف وتسعير الخدمة الحالي:</span>
              <span className="font-extrabold bg-white/20 px-2 py-0.5 rounded-md border border-white/25">
                {service.taxonomyType === 'rental' && 'تأجير بالوقت / موارد وموظفين ⏳'}
                {service.taxonomyType === 'sales' && 'منتجات مبيعات استهلاكية بالقطعة 📦'}
                {service.taxonomyType === 'dynamic' && 'خدمة ذات نطاق متغير حسب الحجم والعدد 📐'}
                {!service.taxonomyType && 'تأجير موارد وموظفين ⏳'}
              </span>
            </div>

            {/* Packages Section */}
            {service.packages && service.packages.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-purple-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-purple-600 rounded-full animate-ping"></span>
                  باقات الخدمة المتاحة للطلب (Packages)
                </h4>
                <div className="grid grid-cols-1 gap-2.5">
                  {service.packages.map((pkg: any) => (
                    <div key={pkg.id} className={`p-3.5 rounded-2xl border transition-all hover:scale-[1.01] flex justify-between items-center ${
                      isDark ? 'bg-slate-900/80 border-slate-800 hover:border-purple-500/50' : 'bg-white border-slate-200 shadow-xs hover:border-purple-300'
                    }`}>
                      <div className="space-y-1">
                        <span className="font-black text-xs text-purple-650 tracking-wide block">{pkg.name}</span>
                        <span className={`text-[11px] font-normal leading-relaxed block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{pkg.description}</span>
                      </div>
                      <div className="text-left shrink-0 mr-4">
                        <strong className="text-sm font-extrabold text-purple-700 font-mono">{(pkg.price).toLocaleString()}</strong>
                        <span className={`block text-[9px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ريال سعودي</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Addons */}
            {service.addons && service.addons.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                  الترقيات والزيادات الاختيارية المتاحة (Add-ons)
                </h4>
                <div className={`p-3.5 rounded-2xl border ${isDark ? 'bg-slate-900/10 border-slate-800' : 'bg-slate-50/75 border-slate-200'}`}>
                  <div className="divide-y divide-slate-100">
                    {service.addons.map((add: any) => (
                      <div key={add.id} className="py-2.5 first:pt-0 last:pb-0 flex justify-between items-center text-xs">
                        <div className="space-y-0.5">
                          <span className={`font-extrabold block ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{add.name}</span>
                          <span className={`text-[11px] font-normal block ${isDark ? 'text-slate-400' : 'text-slate-550'}`}>{add.description}</span>
                        </div>
                        <div className="text-left shrink-0 font-mono font-bold text-emerald-600">
                          +{(add.price).toLocaleString()} ر.س
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Coverage / Area */}
            {parsedCities.length > 0 && (
              <div className="space-y-2">
                <h4 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <Globe className="w-3.5 h-3.5 text-blue-500" />
                  مناطق التغطية المتاحة
                </h4>
                <div className="flex flex-wrap gap-1.5">
                  {parsedCities.map((c, i) => (
                    <span key={i} className={`text-xs border px-2.5 py-1 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-slate-900 text-slate-300 border-slate-800' 
                        : 'bg-white text-slate-700 border-slate-200 shadow-sm'
                    }`}>
                      {c}
                    </span>
                  ))}
                  {parsedRegions.map((r, i) => (
                    <span key={i} className={`text-xs border px-2.5 py-1 rounded-lg transition-colors ${
                      isDark 
                        ? 'bg-indigo-950/40 text-indigo-300 border-indigo-950/60' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100 shadow-sm'
                    }`}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Service Terms */}
            {service.terms && (
              <div className={`p-4 border rounded-2xl space-y-2 transition-colors ${
                isDark 
                  ? 'bg-slate-900/40 border-amber-500/10' 
                  : 'bg-amber-500/5 border-amber-500/20'
              }`}>
                <h4 className="text-xs font-bold text-amber-505 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-500" />
                  شروط وأحكام حجز الخدمة المساندة
                </h4>
                <p className={`text-xs leading-relaxed whitespace-pre-line transition-colors ${isDark ? 'text-slate-400' : 'text-slate-650'}`}>
                  {service.terms}
                </p>
              </div>
            )}

          </div>

          {/* Pricing & Call to Action (Buttons Panel) */}
          <div className={`pt-5 mt-4 border-t flex items-center justify-between gap-4 transition-colors ${isDark ? 'border-slate-900' : 'border-slate-200'}`}>
            <div>
              <span className={`block text-xs mb-0.5 ${isDark ? 'text-slate-400' : 'text-slate-505'}`}>تكلفة الخدمة الأساسية</span>
              <div className="flex items-baseline gap-1">
                <span className="text-2xl md:text-3xl font-extrabold text-orange-500 font-sans">{service.price.toLocaleString()}</span>
                <span className={`text-xs font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>ريال سعودي</span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Cancel Button */}
              <button 
                id="cancel-modal-btn"
                onClick={onClose}
                className={`px-5 py-3 rounded-2xl text-sm font-bold transition-all duration-300 whitespace-nowrap border ${
                  isDark 
                    ? 'text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 border-slate-800' 
                    : 'text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 border-slate-200 shadow-sm'
                }`}
              >
                إلغاء التصفح
              </button>

              {/* Order / Booking Request Button */}
              <button 
                id="request-service-btn"
                onClick={() => {
                  onClose();
                  onRequest(service);
                }}
                className="px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-650 text-white shadow-lg shadow-orange-500/10 rounded-2xl text-sm font-extrabold transition-all duration-300 hover:scale-[1.02] whitespace-nowrap"
              >
                طلب هذه الخدمة
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
