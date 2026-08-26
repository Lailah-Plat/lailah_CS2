import React from 'react';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';

interface SuccessPartner {
  id: string;
  name: string;
  rating?: string;
  packageName?: string;
  bookingsCount: number;
}

interface HomeSuccessPartnersSectionProps {
  successPartners: SuccessPartner[];
  getPartnerImage: (name: string) => string;
  handleAddHallClick: () => void;
}

export const HomeSuccessPartnersSection: React.FC<HomeSuccessPartnersSectionProps> = ({
  successPartners,
  getPartnerImage,
  handleAddHallClick
}) => {
  return (
    <>
      {/* Success Partners */}
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

      {/* How it Works */}
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

      {/* Call to Action - Providers */}
      <section className="py-20 bg-blue-950 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl mix-blend-screen"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl mix-blend-screen"></div>
        
        <div className="max-w-4xl mx-auto px-4 relative z-10 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">هل تمتلك قاعة أو استراحة؟</h2>
          <p className="text-lg text-slate-300 mb-10 max-w-2xl mx-auto">
            ضاعف مبيعاتك ووسع شريحة عملائك بالانضمام إلى منصة "ليلة". نوفر لك أدوات متقدمة لإدارة حجوزاتك وعملائك بكل احترافية.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button onClick={handleAddHallClick} className="w-full sm:w-auto bg-orange-500 hover:bg-orange-400 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-lg shadow-orange-500/20 hover:-translate-y-1 cursor-pointer">
              إضافة قاعة أو استراحة مجاناً
            </button>
            <Link to="/subscription" className="w-full sm:w-auto border-2 border-amber-500 text-amber-400 hover:bg-amber-500/10 px-8 py-4 rounded-xl font-bold text-lg transition-all text-center inline-block">
              عرض خطط اشتراكات المزودين
            </Link>
          </div>
        </div>
      </section>
    </>
  );
};
