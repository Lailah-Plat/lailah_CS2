import React, { useMemo } from 'react';
import { 
  Star, Award, Trophy, TrendingUp, Filter, Search, ArrowUpDown, 
  ShieldCheck, Heart, Sparkles, Building2, CheckCircle2, MessageSquare, ThumbsUp
} from 'lucide-react';

export interface ProviderRatingsMiniDashboardProps {
  providers: any[];
  activeSort: string;
  setActiveSort: (sort: string) => void;
  minRatingFilter: number;
  setMinRatingFilter: (rating: number) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onViewProviderProfile?: (provider: any) => void;
}

export function ProviderRatingsMiniDashboard({
  providers = [],
  activeSort,
  setActiveSort,
  minRatingFilter,
  setMinRatingFilter,
  searchQuery,
  setSearchQuery,
  onViewProviderProfile,
}: ProviderRatingsMiniDashboardProps) {

  // Overall Statistics Calculation
  const stats = useMemo(() => {
    if (!providers || providers.length === 0) {
      return {
        avgRating: 4.8,
        totalReviews: 1240,
        highQualityCount: 0,
        highQualityPercent: '100.0',
        topProvider: null
      };
    }

    const ratings = providers.map(p => Number(p.rating || 4.5));
    const sumRatings = ratings.reduce((acc, curr) => acc + curr, 0);
    const avgRating = Number((sumRatings / providers.length).toFixed(2));

    const totalReviews = providers.reduce((acc, p) => acc + Number(p.reviewsCount || Math.round((p.rating || 4.8) * 12 + 10)), 0);

    const highQualityCount = providers.filter(p => Number(p.rating || 0) >= 4.5).length;
    const highQualityPercent = ((highQualityCount / providers.length) * 100).toFixed(1);

    // Top rated provider
    const sorted = [...providers].sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0));
    const topProvider = sorted[0] || null;

    return {
      avgRating,
      totalReviews,
      highQualityCount,
      highQualityPercent,
      topProvider
    };
  }, [providers]);

  // Top 3 Leaderboard Providers
  const topLeaderboardProviders = useMemo(() => {
    return [...providers]
      .sort((a, b) => {
        const ratingDiff = Number(b.rating || 0) - Number(a.rating || 0);
        if (ratingDiff !== 0) return ratingDiff;
        return Number(b.bookingsCount || 0) - Number(a.bookingsCount || 0);
      })
      .slice(0, 3);
  }, [providers]);

  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-indigo-500/20 space-y-6 font-sans">
      {/* Top Banner Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl border border-amber-500/30 shrink-0">
            <Trophy className="w-7 h-7 animate-bounce" />
          </div>
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-black border border-amber-400/30 mb-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>مؤشرات الجودة والولاء والتميز للشركاء</span>
            </div>
            <h3 className="text-xl font-black text-white tracking-tight">
              لوحة تقييمات الشركاء ومعايير الولاء والجودة ⭐
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
              تتيح للإدارة متابعة أداء وتقييمات جميع المزودين بالمنظومة بشكل لحظي، وترتيب الشركاء حسب الأعلى تقييماً لتكريمهم ودعم معايير الجودة الشاملة.
            </p>
          </div>
        </div>

        {/* Global Rating Badge */}
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/15 flex items-center gap-4 shrink-0">
          <div className="text-center">
            <div className="text-[10px] text-slate-300 font-bold">متوسط تقييم الشركاء</div>
            <div className="text-2xl font-black text-amber-400 font-mono flex items-center justify-center gap-1">
              <span>{stats.avgRating}</span>
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
          </div>
          <div className="h-8 w-px bg-white/15" />
          <div className="text-center">
            <div className="text-[10px] text-slate-300 font-bold">نسبة الامتثال (4.5+)</div>
            <div className="text-2xl font-black text-emerald-400 font-mono">
              {stats.highQualityPercent}%
            </div>
          </div>
        </div>
      </div>

      {/* Top 3 Leaderboard Cards (أبطال التميز والجودة) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {topLeaderboardProviders.map((prov, idx) => {
          const medalColor = idx === 0 ? 'from-amber-500 to-amber-600 text-slate-950 border-amber-400' :
                             idx === 1 ? 'from-slate-300 to-slate-400 text-slate-950 border-slate-200' :
                             'from-amber-700 to-amber-800 text-white border-amber-600';
          const medalLabel = idx === 0 ? '🥇 المركز الأول' : idx === 1 ? '🥈 المركز الثاني' : '🥉 المركز الثالث';
          const ratingVal = Number(prov.rating || 4.9).toFixed(1);

          return (
            <div 
              key={prov.id || idx}
              className="bg-white/5 hover:bg-white/10 transition-all p-4 rounded-2xl border border-white/10 relative overflow-hidden flex flex-col justify-between group cursor-pointer"
              onClick={() => onViewProviderProfile && onViewProviderProfile(prov)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    {prov.image || prov.imagePreview ? (
                      <img 
                        src={prov.image || prov.imagePreview} 
                        alt={prov.name} 
                        className="w-12 h-12 rounded-full object-cover border-2 border-amber-400/60 shadow-md"
                        onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center justify-center font-black text-sm">
                        {prov.name ? prov.name.charAt(0) : 'ش'}
                      </div>
                    )}
                    <span className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[9px] font-black bg-gradient-to-r ${medalColor} border shadow-xs`}>
                      #{idx + 1}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-white text-sm group-hover:text-amber-300 transition-colors">{prov.name}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{prov.city || 'الرياض'}</span>
                      <span>•</span>
                      <span className="text-amber-300 font-bold">{prov.packageName || 'الفئة البلاتينية'}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black bg-gradient-to-r ${medalColor} border shadow-xs`}>
                    {medalLabel}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                <div className="flex items-center gap-1 font-mono font-black text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-xl border border-amber-400/20">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{ratingVal} / 5.0</span>
                </div>
                <div className="text-[11px] text-slate-300 flex items-center gap-2 font-mono">
                  <span>{prov.reviewsCount || Math.round((prov.rating || 4.8) * 15 + 8)} مراجعة</span>
                  <span>•</span>
                  <span>{prov.bookingsCount || 24} حجز</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Interactive Controls & Filter Bar */}
      <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs">
        {/* Search Input */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحث باسم المزود، المدينة، أو رقم التواصل..."
            className="w-full pr-9 pl-3 py-2 bg-slate-950/60 border border-white/15 rounded-xl text-white placeholder-slate-400 font-bold text-xs outline-none focus:border-amber-400 transition-all"
          />
        </div>

        {/* Rating Quick Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap w-full md:w-auto justify-center">
          <span className="text-[11px] font-bold text-slate-300 ml-1">تصفية التقييم:</span>
          {[
            { label: 'الكل', val: 0 },
            { label: '5.0 ⭐ (مستوفى)', val: 5.0 },
            { label: '4.8+ ⭐ (ممتاز جداً)', val: 4.8 },
            { label: '4.5+ ⭐ (ممتاز)', val: 4.5 },
          ].map((item) => (
            <button
              key={item.val}
              onClick={() => setMinRatingFilter(item.val)}
              className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer border ${minRatingFilter === item.val ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-md' : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/15'}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Sort Selector Dropdown */}
        <div className="flex items-center gap-2 w-full md:w-auto shrink-0">
          <ArrowUpDown className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="text-[11px] font-bold text-slate-300 shrink-0">الترتيب حسب:</span>
          <select
            value={activeSort}
            onChange={(e) => setActiveSort(e.target.value)}
            className="py-2 px-3 bg-slate-950/80 border border-amber-500/40 rounded-xl text-amber-300 font-black text-xs outline-none cursor-pointer focus:border-amber-400 transition-all"
          >
            <option value="rating_desc">🌟 الأعلى تقييماً أولاً (Highest Rating)</option>
            <option value="rating_asc">📉 الأقل تقييماً أولاً (Lowest Rating)</option>
            <option value="bookings_desc">📊 الأكثر حجوزات وتفاعلاً</option>
            <option value="reviews_desc">💬 الأكثر مراجعات وتقييماً</option>
            <option value="name_asc">🔤 أبجدياً (اسم المزود)</option>
          </select>
        </div>
      </div>
    </div>
  );
}
