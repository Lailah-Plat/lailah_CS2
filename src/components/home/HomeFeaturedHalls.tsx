import React, { useState } from 'react';
import { 
  Sparkles, 
  MapPin, 
  Users, 
  Star, 
  ShieldCheck, 
  ArrowLeft, 
  ChevronRight, 
  ChevronLeft, 
  MessageCircle,
  Crown
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FavoriteHeartButton } from '../HallCardAddons';
import { Hall } from '../../data/mockData';

interface HomeFeaturedHallsProps {
  featuredHalls: Hall[];
  approvedHalls: Hall[];
  openProviderChat: (e: React.MouseEvent, providerName: string, hallName: string) => void;
}

// Wave Cutout SVG Component for standard cards (1, 3, 5, 7, 9)
const WaveCutout: React.FC<{ className?: string }> = ({ className = "text-white" }) => (
  <div className="absolute -bottom-[1px] left-0 right-0 z-10 pointer-events-none overflow-hidden leading-none">
    <svg 
      viewBox="0 0 1200 120" 
      preserveAspectRatio="none" 
      className={`w-full h-3 sm:h-4 ${className} fill-current`}
    >
      <path d="M 0,0 C 150,90 400,100 600,40 C 800,-20 1000,80 1200,30 L 1200,120 L 0,120 Z" />
    </svg>
  </div>
);

// Geometric Step Cutout Component (For Cards 2, 4, 6, 8 only):
// Starts with a straight white baseline from Right (0% to 60% in RTL, which is x=1000 down to x=400 in 0-1000 coords or x=0 to x=600 in RTL orientation),
// then rises at a 135-degree angle (45-degree ascent upwards) by 20% of image height,
// then levels horizontally at 90 degrees all the way to the left edge, with a smooth white gradient transition.
const GeometricStepCutout: React.FC = () => (
  <div className="absolute -bottom-[1px] left-0 right-0 z-10 pointer-events-none overflow-hidden leading-none">
    <svg 
      viewBox="0 0 1000 100" 
      preserveAspectRatio="none" 
      className="w-full h-7 sm:h-8 md:h-9 text-white"
    >
      <defs>
        {/* Subtle white fade gradient to smoothly complete the image bottom transition into pure white */}
        <linearGradient id="stepWhiteGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.82" />
          <stop offset="50%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
        <linearGradient id="stepHighlight" x1="100%" y1="0%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="60%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="80%" stopColor="#f8fafc" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#ffffff" stopOpacity="1" />
        </linearGradient>
      </defs>

      {/* 
        In RTL Coordinate Space (0 = Left, 1000 = Right):
        - Right edge (1000, 100) -> Starts horizontal line at the bottom
        - At 60% from right: x = 400. From (1000, 95) to (400, 95) [Horizontal line from right]
        - Rises at 135° (45° visual ascent relative to baseline): from (400, 95) to (250, 20) [20% from top / 75-80px rise]
        - Straightens at 90° turn to horizontal left edge: from (250, 20) to (0, 20)
        - Closes shape: (0, 100) to (1000, 100)
      */}
      <path 
        d="M 1000,100 L 1000,92 L 400,92 L 230,18 L 0,18 L 0,100 Z" 
        fill="url(#stepWhiteGrad)" 
      />
      {/* Crisp geometric boundary line */}
      <path 
        d="M 1000,92 L 400,92 L 230,18 L 0,18" 
        fill="none" 
        stroke="#ffffff" 
        strokeWidth="3.5" 
        strokeLinecap="round"
        strokeLinejoin="miter"
      />
    </svg>
  </div>
);

// Helper to compute periods pricing and formatted data
const getHallData = (hall: Hall) => {
  const basePrice = Number(hall.price) || 2500;
  const morningPrice = hall.morningPrice || Math.floor(basePrice * 0.65);
  const nightPrice = hall.nightPrice || Math.floor(basePrice * 0.85);
  const fullDayPrice = hall.fullDayPrice || Math.floor(basePrice * 1.35);
  
  const rating = (hall as any).rating || 4.9;
  const reviewsCount = (hall as any).reviewsCount || 24;
  const capacity = hall.capacity || 400;
  const city = hall.city || 'الرياض';
  const region = hall.region || 'منطقة الرياض';
  const image = hall.image || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80";

  return {
    basePrice,
    morningPrice,
    nightPrice,
    fullDayPrice,
    rating,
    reviewsCount,
    capacity,
    city,
    region,
    image
  };
};

// Clean 3-Periods Pricing with clear readable typography and clean vertical dividers
const CleanPeriodsPricing: React.FC<{
  morning: number;
  night: number;
  fullDay: number;
  highlightFullDay?: boolean;
}> = ({ morning, night, fullDay, highlightFullDay = true }) => (
  <div className="flex items-center justify-between text-center divide-x divide-x-reverse divide-slate-200 py-1 my-0.5">
    <div className="flex-1 px-1">
      <span className="text-[11px] sm:text-xs text-slate-500 block font-bold leading-tight mb-0.5">الصباحية</span>
      <div className="flex items-baseline justify-center gap-0.5">
        <span className="text-xs sm:text-sm lg:text-base font-black text-slate-900 tracking-tight">{morning.toLocaleString()}</span>
        <span className="text-[10px] text-slate-400 font-bold">ر.س</span>
      </div>
    </div>
    <div className="flex-1 px-1">
      <span className="text-[11px] sm:text-xs text-slate-500 block font-bold leading-tight mb-0.5">المسائية</span>
      <div className="flex items-baseline justify-center gap-0.5">
        <span className="text-xs sm:text-sm lg:text-base font-black text-slate-900 tracking-tight">{night.toLocaleString()}</span>
        <span className="text-[10px] text-slate-400 font-bold">ر.س</span>
      </div>
    </div>
    <div className="flex-1 px-1">
      <span className={`text-[11px] sm:text-xs block font-black leading-tight mb-0.5 ${highlightFullDay ? 'text-amber-600' : 'text-slate-700'}`}>اليوم كاملاً</span>
      <div className="flex items-baseline justify-center gap-0.5">
        <span className={`text-xs sm:text-sm lg:text-base font-black tracking-tight ${highlightFullDay ? 'text-amber-600' : 'text-slate-900'}`}>{fullDay.toLocaleString()}</span>
        <span className={`text-[10px] font-bold ${highlightFullDay ? 'text-amber-600' : 'text-slate-400'}`}>ر.س</span>
      </div>
    </div>
  </div>
);

export const HomeFeaturedHalls: React.FC<HomeFeaturedHallsProps> = ({
  featuredHalls,
  approvedHalls,
  openProviderChat
}) => {
  // 9 Cards per Bento Mosaic page
  const allHalls = (() => {
    let list = [...featuredHalls];
    if (list.length < 9) {
      const remaining = approvedHalls.filter(h => !list.some(f => f.id === h.id));
      list = [...list, ...remaining];
    }
    return list;
  })();

  const [pageIndex, setPageIndex] = useState<number>(0);
  const pageSize = 9;
  const totalPages = Math.max(1, Math.ceil(allHalls.length / pageSize));

  const currentHalls = (() => {
    const start = pageIndex * pageSize;
    let page = allHalls.slice(start, start + pageSize);
    if (page.length < pageSize && allHalls.length > 0) {
      const needed = pageSize - page.length;
      page = [...page, ...allHalls.slice(0, needed)];
    }
    return page;
  })();

  const handlePrevPage = () => {
    setPageIndex(prev => (prev > 0 ? prev - 1 : totalPages - 1));
  };

  const handleNextPage = () => {
    setPageIndex(prev => (prev < totalPages - 1 ? prev + 1 : 0));
  };

  const h = currentHalls;
  if (!h[0]) return null;

  const d = h.map(item => item ? getHallData(item) : null);

  return (
    <section className="py-3.5 sm:py-4.5 bg-[#f8fafc] border-b border-slate-200/80 relative overflow-hidden" dir="rtl">
      {/* Subtle Ambient Glow */}
      <div className="absolute top-0 right-1/4 w-64 h-64 bg-amber-400/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-[1440px] mx-auto px-3 sm:px-4 md:px-6 relative z-10">
        
        {/* ==================================================================== */}
        {/* Header Section */}
        {/* ==================================================================== */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2.5 mb-3.5 sm:mb-4">
          
          {/* Right (RTL): Title, Gold Icon Badge, and Subtitle */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 shadow-2xs shrink-0">
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl lg:text-2xl font-black text-slate-900 tracking-tight leading-tight">
                  أبرز القاعات
                </h2>
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-amber-600 text-white text-[11px] font-black px-2 py-0.5 rounded-full shadow-2xs">
                  <Crown className="w-3 h-3 text-amber-100" />
                  مختارة وموثقة
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5 font-medium">
                اكتشف أرقى القاعات والاستراحات والمنتجعات المناسبة لكل مناسباتك
              </p>
            </div>
          </div>

          {/* Left: Pagination + Navy Luxury "Explore Map" Button */}
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
            {totalPages > 1 && (
              <div className="flex items-center bg-white border border-slate-200/90 rounded-xl p-0.5 shadow-2xs">
                <button
                  onClick={handleNextPage}
                  className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="المجموعة التالية"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs font-bold text-slate-700 px-2.5">
                  {pageIndex + 1} / {totalPages}
                </span>
                <button
                  onClick={handlePrevPage}
                  className="p-1.5 rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="المجموعة السابقة"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Navy Luxury Button with Gold Map Icon */}
            <Link
              to="/explore"
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#0B1528] hover:bg-[#15233d] border border-slate-800 text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow-md transition-all duration-300 group shrink-0"
            >
              <div className="w-5 h-5 rounded-md bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <span className="font-extrabold text-slate-100">استكشاف خريطة القاعات</span>
              <ArrowLeft className="w-3.5 h-3.5 text-amber-400 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* Compact Bento Mosaic Grid (Total Section Height ~680px-700px on Desktop) */}
        {/* ==================================================================== */}
        <div className="flex flex-col gap-2.5 sm:gap-3">
          {/* Top 2 Rows: 4 Columns Bento Grid for Cards 1 through 6 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3 items-stretch">
          
          {/* ------------------------------------------------------------------ */}
          {/* Card 1: Tall Portrait Card (Spans Row 1 & Row 2 on Col 1 in Desktop) */}
          {/* Photo takes 70% of card height then smoothly fades down to white */}
          {/* ------------------------------------------------------------------ */}
          {h[0] && d[0] && (
            <div className="lg:col-span-1 lg:row-span-2 bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative">
              <div className="relative h-[68%] min-h-[170px] sm:min-h-[190px] lg:min-h-[220px] overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={d[0].image} 
                  alt={h[0].name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                {/* Top dark gradient for badges readability */}
                <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-slate-950/75 to-transparent z-10" />
                {/* Bottom smooth fade to white completing into the card body */}
                <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent z-10" />
                
                {/* Floating Top Badges */}
                <div className="absolute top-2 right-2 left-2 flex items-center justify-between z-20">
                  <span className="inline-flex items-center gap-1 bg-emerald-600/95 text-white backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
                    موثقة 🛡️
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-2xs border border-slate-100 flex items-center gap-1 text-xs sm:text-sm font-black text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{d[0].rating}</span>
                    </div>
                    <div className="relative">
                      <FavoriteHeartButton hallId={Number(h[0].id) || 1} />
                    </div>
                  </div>
                </div>

                {/* Bottom Overlay Title & City with crisp high-contrast colors against white gradient */}
                <div className="absolute bottom-2 right-2.5 left-2.5 z-20 pointer-events-none">
                  <div className="flex items-center gap-1 text-xs text-amber-700 font-extrabold mb-0.5">
                    <MapPin className="w-3.5 h-3.5 text-amber-600" />
                    <span>{d[0].city} - {d[0].region}</span>
                  </div>
                  <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 leading-tight truncate">
                    {h[0].name}
                  </h3>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between bg-white text-right z-20">
                <div>
                  <div className="flex items-center justify-between text-xs sm:text-sm text-slate-700 font-bold mb-1">
                    <span className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-amber-600" />
                      <span>سعة {d[0].capacity} ضيف</span>
                    </span>
                    <span className="text-[10px] sm:text-xs text-slate-400">شامل الضريبة 15%</span>
                  </div>

                  <CleanPeriodsPricing morning={d[0].morningPrice} night={d[0].nightPrice} fullDay={d[0].fullDayPrice} />
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5 mt-1">
                  <button
                    onClick={(e) => openProviderChat(e, h[0].provider || '', h[0].name)}
                    className="text-xs sm:text-sm text-slate-500 hover:text-amber-600 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تواصل</span>
                  </button>
                  <Link
                    to={`/hall/${h[0].id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-amber-600 text-white rounded-lg text-xs sm:text-sm font-black transition-all shadow-2xs group/btn"
                  >
                    <span>عرض التفاصيل</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover/btn:-translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* Card 2: Wide Landscape Hero Card (Row 1, Cols 2 & 3) */}
          {/* ------------------------------------------------------------------ */}
          {h[1] && d[1] && (
            <div className="lg:col-span-2 bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative">
              <div className="relative h-28 sm:h-32 lg:h-34 overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={d[1].image} 
                  alt={h[1].name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-2 right-2 left-2 flex items-center justify-between z-20">
                  <div className="flex items-center gap-1.5">
                    <span className="inline-flex items-center gap-1 bg-emerald-600/95 text-white backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
                      موثقة 🛡️
                    </span>
                    <span className="hidden sm:inline-flex items-center bg-slate-900/80 backdrop-blur-md text-amber-300 border border-slate-700/60 px-2 py-0.5 rounded-md text-[10px] font-bold">
                      الأعلى طلباً
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-2xs border border-slate-100 flex items-center gap-1 text-xs sm:text-sm font-black text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{d[1].rating}</span>
                      <span className="text-[10px] text-slate-400 font-medium">({d[1].reviewsCount})</span>
                    </div>
                    <div className="relative">
                      <FavoriteHeartButton hallId={Number(h[1].id) || 2} />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-3 right-2.5 left-2.5 z-20 pointer-events-none flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-amber-300 font-bold mb-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{d[1].city}</span>
                    </div>
                    <h3 className="text-base sm:text-lg lg:text-xl font-black text-white leading-tight truncate drop-shadow-md">
                      {h[1].name}
                    </h3>
                  </div>
                  <div className="text-xs sm:text-sm text-white/90 font-bold bg-slate-900/70 px-2 py-0.5 rounded-md backdrop-blur-sm">
                    سعة {d[1].capacity} ضيف
                  </div>
                </div>
                <GeometricStepCutout />
              </div>

              <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between bg-white text-right">
                <CleanPeriodsPricing morning={d[1].morningPrice} night={d[1].nightPrice} fullDay={d[1].fullDayPrice} />
                
                <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2 mt-1">
                  <button
                    onClick={(e) => openProviderChat(e, h[1].provider || '', h[1].name)}
                    className="text-xs sm:text-sm text-slate-500 hover:text-amber-600 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تواصل مع المنشأة</span>
                  </button>
                  <Link
                    to={`/hall/${h[1].id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-900 hover:bg-amber-600 text-white rounded-lg text-xs sm:text-sm font-black transition-all shadow-2xs group/btn"
                  >
                    <span>عرض التفاصيل</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover/btn:-translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* Card 3: Compact Standard (Row 1, Col 4) */}
          {/* ------------------------------------------------------------------ */}
          {h[2] && d[2] && (
            <div className="lg:col-span-1 bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative">
              <div className="relative h-24 sm:h-28 lg:h-30 overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={d[2].image} 
                  alt={h[2].name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-2 right-2 left-2 flex items-center justify-between z-20">
                  <span className="inline-flex items-center gap-0.5 bg-emerald-600/95 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold">
                    موثقة 🛡️
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 text-xs font-black text-slate-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{d[2].rating}</span>
                    </div>
                    <div className="relative">
                      <FavoriteHeartButton hallId={Number(h[2].id) || 3} />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2 left-2 z-20 pointer-events-none">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate drop-shadow-md">
                    {h[2].name}
                  </h3>
                </div>
                <WaveCutout />
              </div>

              <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between bg-white text-right">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-0.5">
                  <span>سعة {d[2].capacity} ضيف</span>
                  <span className="text-[10px] text-slate-400">{d[2].city}</span>
                </div>
                <CleanPeriodsPricing morning={d[2].morningPrice} night={d[2].nightPrice} fullDay={d[2].fullDayPrice} />
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1 mt-0.5">
                  <button
                    onClick={(e) => openProviderChat(e, h[2].provider || '', h[2].name)}
                    className="text-xs text-slate-500 hover:text-amber-600 font-bold transition-colors cursor-pointer"
                  >
                    تواصل
                  </button>
                  <Link
                    to={`/hall/${h[2].id}`}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-md text-xs font-black transition-all shadow-2xs"
                  >
                    <span>تفاصيل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* Card 4: Compact Standard (Row 2, Col 2) */}
          {/* ------------------------------------------------------------------ */}
          {h[3] && d[3] && (
            <div className="lg:col-span-1 bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative">
              <div className="relative h-24 sm:h-28 lg:h-30 overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={d[3].image} 
                  alt={h[3].name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-2 right-2 left-2 flex items-center justify-between z-20">
                  <span className="inline-flex items-center gap-0.5 bg-emerald-600/95 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold">
                    موثقة 🛡️
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 text-xs font-black text-slate-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{d[3].rating}</span>
                    </div>
                    <div className="relative">
                      <FavoriteHeartButton hallId={Number(h[3].id) || 4} />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2 left-2 z-20 pointer-events-none">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate drop-shadow-md">
                    {h[3].name}
                  </h3>
                </div>
                <GeometricStepCutout />
              </div>

              <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between bg-white text-right">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-0.5">
                  <span>سعة {d[3].capacity} ضيف</span>
                  <span className="text-[10px] text-slate-400">{d[3].city}</span>
                </div>
                <CleanPeriodsPricing morning={d[3].morningPrice} night={d[3].nightPrice} fullDay={d[3].fullDayPrice} />
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1 mt-0.5">
                  <button
                    onClick={(e) => openProviderChat(e, h[3].provider || '', h[3].name)}
                    className="text-xs text-slate-500 hover:text-amber-600 font-bold transition-colors cursor-pointer"
                  >
                    تواصل
                  </button>
                  <Link
                    to={`/hall/${h[3].id}`}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-md text-xs font-black transition-all shadow-2xs"
                  >
                    <span>تفاصيل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* Card 5: Compact Standard (Row 2, Col 3) */}
          {/* ------------------------------------------------------------------ */}
          {h[4] && d[4] && (
            <div className="lg:col-span-1 bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative">
              <div className="relative h-24 sm:h-28 lg:h-30 overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={d[4].image} 
                  alt={h[4].name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-2 right-2 left-2 flex items-center justify-between z-20">
                  <span className="inline-flex items-center gap-0.5 bg-emerald-600/95 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold">
                    موثقة 🛡️
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 text-xs font-black text-slate-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{d[4].rating}</span>
                    </div>
                    <div className="relative">
                      <FavoriteHeartButton hallId={Number(h[4].id) || 5} />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2 left-2 z-20 pointer-events-none">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate drop-shadow-md">
                    {h[4].name}
                  </h3>
                </div>
                <WaveCutout />
              </div>

              <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between bg-white text-right">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-0.5">
                  <span>سعة {d[4].capacity} ضيف</span>
                  <span className="text-[10px] text-slate-400">{d[4].city}</span>
                </div>
                <CleanPeriodsPricing morning={d[4].morningPrice} night={d[4].nightPrice} fullDay={d[4].fullDayPrice} />
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1 mt-0.5">
                  <button
                    onClick={(e) => openProviderChat(e, h[4].provider || '', h[4].name)}
                    className="text-xs text-slate-500 hover:text-amber-600 font-bold transition-colors cursor-pointer"
                  >
                    تواصل
                  </button>
                  <Link
                    to={`/hall/${h[4].id}`}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-md text-xs font-black transition-all shadow-2xs"
                  >
                    <span>تفاصيل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* Card 6: Compact Standard (Row 2, Col 4) */}
          {/* ------------------------------------------------------------------ */}
          {h[5] && d[5] && (
            <div className="lg:col-span-1 bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative">
              <div className="relative h-24 sm:h-28 lg:h-30 overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={d[5].image} 
                  alt={h[5].name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-2 right-2 left-2 flex items-center justify-between z-20">
                  <span className="inline-flex items-center gap-0.5 bg-emerald-600/95 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold">
                    موثقة 🛡️
                  </span>
                  <div className="flex items-center gap-1">
                    <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 text-xs font-black text-slate-800">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{d[5].rating}</span>
                    </div>
                    <div className="relative">
                      <FavoriteHeartButton hallId={Number(h[5].id) || 6} />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2 left-2 z-20 pointer-events-none">
                  <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate drop-shadow-md">
                    {h[5].name}
                  </h3>
                </div>
                <GeometricStepCutout />
              </div>

              <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between bg-white text-right">
                <div className="flex items-center justify-between text-xs font-bold text-slate-600 mb-0.5">
                  <span>سعة {d[5].capacity} ضيف</span>
                  <span className="text-[10px] text-slate-400">{d[5].city}</span>
                </div>
                <CleanPeriodsPricing morning={d[5].morningPrice} night={d[5].nightPrice} fullDay={d[5].fullDayPrice} />
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-1 mt-0.5">
                  <button
                    onClick={(e) => openProviderChat(e, h[5].provider || '', h[5].name)}
                    className="text-xs text-slate-500 hover:text-amber-600 font-bold transition-colors cursor-pointer"
                  >
                    تواصل
                  </button>
                  <Link
                    to={`/hall/${h[5].id}`}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-md text-xs font-black transition-all shadow-2xs"
                  >
                    <span>تفاصيل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Row 3: 3 Equal Columns for Cards 7, 8, and 9 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 sm:gap-3 items-stretch">
          {/* ------------------------------------------------------------------ */}
          {/* Card 7: Equal Column 1 (Row 3) */}
          {/* Full-card image with gradient fading to white from right 60% to left */}
          {/* ------------------------------------------------------------------ */}
          {h[6] && d[6] && (
            <div className="bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative min-h-[175px] sm:min-h-[185px]">
              {/* Full Background Image */}
              <img 
                src={d[6].image} 
                alt={h[6].name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0" 
                referrerPolicy="no-referrer"
              />
              {/* Horizontal Gradient: completely clear image from Right (0% to 60%), then fades to solid white towards Left (100%) */}
              <div 
                className="absolute inset-0 z-10 pointer-events-none" 
                style={{
                  background: 'linear-gradient(to left, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.7) 72%, rgba(255,255,255,0.96) 88%, #ffffff 100%)'
                }}
              />
              {/* Vertical soft gradient for top badge visibility */}
              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-transparent z-10" />

              {/* Floating Top Badges */}
              <div className="p-2 sm:p-2.5 flex items-center justify-between z-20 relative">
                <span className="inline-flex items-center gap-0.5 bg-emerald-600/95 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold">
                  موثقة 🛡️
                </span>
                <div className="flex items-center gap-1">
                  <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 text-xs font-black text-slate-800">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{d[6].rating}</span>
                  </div>
                  <div className="relative">
                    <FavoriteHeartButton hallId={Number(h[6].id) || 7} />
                  </div>
                </div>
              </div>

              {/* Card Body & Info sitting over the white-faded gradient */}
              <div className="p-2 sm:p-2.5 z-20 relative text-right flex flex-col justify-end">
                <div className="mb-1">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-0.5">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate drop-shadow-xs">
                      {h[6].name}
                    </h3>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                      {d[6].city}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-600">
                    سعة {d[6].capacity} ضيف
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xs rounded-xl p-1 border border-slate-100 shadow-2xs">
                  <CleanPeriodsPricing morning={d[6].morningPrice} night={d[6].nightPrice} fullDay={d[6].fullDayPrice} />
                </div>

                <div className="pt-1.5 flex items-center justify-between gap-1 mt-1">
                  <button
                    onClick={(e) => openProviderChat(e, h[6].provider || '', h[6].name)}
                    className="text-xs text-slate-600 hover:text-amber-600 font-bold transition-colors cursor-pointer"
                  >
                    تواصل
                  </button>
                  <Link
                    to={`/hall/${h[6].id}`}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-md text-xs font-black transition-all shadow-2xs"
                  >
                    <span>تفاصيل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* Card 8: Equal Column 2 (Row 3) */}
          {/* ------------------------------------------------------------------ */}
          {h[7] && d[7] && (
            <div className="bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col group relative">
              <div className="relative h-24 sm:h-28 lg:h-30 overflow-hidden bg-slate-900 shrink-0">
                <img 
                  src={d[7].image} 
                  alt={h[7].name} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/20 to-transparent" />
                
                <div className="absolute top-2 right-2.5 left-2.5 flex items-center justify-between z-20">
                  <span className="inline-flex items-center gap-1 bg-emerald-600/95 text-white backdrop-blur-md px-2 py-0.5 rounded-lg text-xs font-bold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-100" />
                    موثقة 🛡️
                  </span>
                  <div className="flex items-center gap-1.5">
                    <div className="bg-white/95 backdrop-blur-md px-2 py-0.5 rounded-lg shadow-2xs border border-slate-100 flex items-center gap-1 text-xs sm:text-sm font-black text-slate-800">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span>{d[7].rating}</span>
                    </div>
                    <div className="relative">
                      <FavoriteHeartButton hallId={Number(h[7].id) || 8} />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-2.5 right-2.5 left-2.5 z-20 pointer-events-none flex items-end justify-between">
                  <div>
                    <div className="flex items-center gap-1 text-xs text-amber-300 font-bold mb-0.5">
                      <MapPin className="w-3.5 h-3.5 text-amber-400" />
                      <span>{d[7].city} - {d[7].region}</span>
                    </div>
                    <h3 className="text-sm sm:text-base font-black text-white leading-tight truncate drop-shadow-md">
                      {h[7].name}
                    </h3>
                  </div>
                  <div className="text-xs sm:text-sm text-white/90 font-bold bg-slate-900/70 px-2 py-0.5 rounded backdrop-blur-sm">
                    سعة {d[7].capacity} ضيف
                  </div>
                </div>
                <GeometricStepCutout />
              </div>

              <div className="p-2 sm:p-2.5 flex-1 flex flex-col justify-between bg-white text-right">
                <CleanPeriodsPricing morning={d[7].morningPrice} night={d[7].nightPrice} fullDay={d[7].fullDayPrice} />
                
                <div className="pt-1 border-t border-slate-100 flex items-center justify-between gap-2 mt-0.5">
                  <button
                    onClick={(e) => openProviderChat(e, h[7].provider || '', h[7].name)}
                    className="text-xs text-slate-500 hover:text-amber-600 font-bold transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>تواصل</span>
                  </button>
                  <Link
                    to={`/hall/${h[7].id}`}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-lg text-xs font-black transition-all shadow-2xs group/btn"
                  >
                    <span>عرض التفاصيل</span>
                    <ArrowLeft className="w-3.5 h-3.5 group-hover/btn:-translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* ------------------------------------------------------------------ */}
          {/* Card 9: Equal Column 3 (Row 3) */}
          {/* Full-card image with gradient fading to white from left 60% to right */}
          {/* ------------------------------------------------------------------ */}
          {h[8] && d[8] && (
            <div className="bg-white border border-slate-200/90 hover:border-amber-400/60 rounded-2xl overflow-hidden shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between group relative min-h-[175px] sm:min-h-[185px]">
              {/* Full Background Image */}
              <img 
                src={d[8].image} 
                alt={h[8].name} 
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 z-0" 
                referrerPolicy="no-referrer"
              />
              {/* Horizontal Gradient: completely clear image from Left (0% to 60%), then fades to solid white towards Right (100%) */}
              <div 
                className="absolute inset-0 z-10 pointer-events-none" 
                style={{
                  background: 'linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0) 58%, rgba(255,255,255,0.7) 72%, rgba(255,255,255,0.96) 88%, #ffffff 100%)'
                }}
              />
              {/* Vertical soft gradient for top badge visibility */}
              <div className="absolute inset-x-0 top-0 h-14 bg-gradient-to-b from-slate-950/60 via-slate-950/20 to-transparent z-10" />

              {/* Floating Top Badges */}
              <div className="p-2 sm:p-2.5 flex items-center justify-between z-20 relative">
                <span className="inline-flex items-center gap-0.5 bg-emerald-600/95 text-white backdrop-blur-md px-1.5 py-0.5 rounded text-[10px] font-bold">
                  موثقة 🛡️
                </span>
                <div className="flex items-center gap-1">
                  <div className="bg-white/95 backdrop-blur-md px-1.5 py-0.5 rounded shadow-2xs flex items-center gap-0.5 text-xs font-black text-slate-800">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{d[8].rating}</span>
                  </div>
                  <div className="relative">
                    <FavoriteHeartButton hallId={Number(h[8].id) || 9} />
                  </div>
                </div>
              </div>

              {/* Card Body & Info sitting over the white-faded gradient */}
              <div className="p-2 sm:p-2.5 z-20 relative text-right flex flex-col justify-end">
                <div className="mb-1">
                  <div className="flex items-center justify-between text-xs font-black text-slate-900 mb-0.5">
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate drop-shadow-xs">
                      {h[8].name}
                    </h3>
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded">
                      {d[8].city}
                    </span>
                  </div>
                  <div className="text-[11px] font-bold text-slate-600">
                    سعة {d[8].capacity} ضيف
                  </div>
                </div>

                <div className="bg-white/90 backdrop-blur-xs rounded-xl p-1 border border-slate-100 shadow-2xs">
                  <CleanPeriodsPricing morning={d[8].morningPrice} night={d[8].nightPrice} fullDay={d[8].fullDayPrice} />
                </div>

                <div className="pt-1.5 flex items-center justify-between gap-1 mt-1">
                  <button
                    onClick={(e) => openProviderChat(e, h[8].provider || '', h[8].name)}
                    className="text-xs text-slate-600 hover:text-amber-600 font-bold transition-colors cursor-pointer"
                  >
                    تواصل
                  </button>
                  <Link
                    to={`/hall/${h[8].id}`}
                    className="inline-flex items-center gap-0.5 px-2.5 py-1 bg-slate-900 hover:bg-amber-600 text-white rounded-md text-xs font-black transition-all shadow-2xs"
                  >
                    <span>تفاصيل</span>
                    <ArrowLeft className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </div>
          )}
          </div>
        </div>

      </div>
    </section>
  );
};
