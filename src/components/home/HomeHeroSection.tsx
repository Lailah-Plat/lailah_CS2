import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Map, MapPin, Crown, ChevronLeft, ChevronRight, 
  ShieldCheck, Smartphone, Percent, ThumbsUp, Headset 
} from 'lucide-react';
import { Link } from 'react-router-dom';

export interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  badge: string;
  buttonText?: string;
  link?: string;
}

interface HomeHeroSectionProps {
  slides: HeroSlide[];
  currentSlide: number;
  setCurrentSlide: React.Dispatch<React.SetStateAction<number>>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  searchRegion: string;
  handleRegionChange: (region: string) => void;
  regionsList: any[];
  searchCity: string;
  handleCityChange: (city: string) => void;
  availableCities: string[];
  searchCategory: string;
  setSearchCategory: (cat: string) => void;
  handleSearch: () => void;
}

export const HomeHeroSection: React.FC<HomeHeroSectionProps> = ({
  slides,
  currentSlide,
  setCurrentSlide,
  searchTerm,
  setSearchTerm,
  searchRegion,
  handleRegionChange,
  regionsList,
  searchCity,
  handleCityChange,
  availableCities,
  searchCategory,
  setSearchCategory,
  handleSearch,
}) => {
  return (
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

            {/* Dynamic Region Select */}
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

            {/* Dynamic City Select */}
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
  );
};
