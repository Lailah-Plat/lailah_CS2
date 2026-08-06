import React, { useState, useEffect } from 'react';
import { Heart, GitCompare, Users } from 'lucide-react';
import { 
  toggleFavoriteInDB, 
  fetchFavoritesFromDB, 
  getAuthUser,
  FAVORITES_UPDATED_EVENT, 
  COMPARE_UPDATED_EVENT,
  Hall 
} from './FavoriteCompareManager';

// 1. Favorite Heart Button Component (❤️ in top-left of image)
export function FavoriteHeartButton({ hallId }: { hallId: number }) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(false);
  const user = getAuthUser();

  useEffect(() => {
    const checkFavorite = () => {
      try {
        if (user && user.id) {
          const stored = localStorage.getItem(`USER_FAVORITES_${user.id}`);
          if (stored) {
            const list: number[] = JSON.parse(stored);
            setIsFavorited(list.includes(hallId));
          }
        } else {
          setIsFavorited(false);
        }
      } catch (e) {}
    };

    checkFavorite();
    window.addEventListener(FAVORITES_UPDATED_EVENT, checkFavorite);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, checkFavorite);
  }, [hallId, user?.id]);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !user.id) {
      alert('يرجى تسجيل الدخول أولاً لإضافة القاعة إلى المفضلة');
      return;
    }

    if (loading) return;
    setLoading(true);

    const res = await toggleFavoriteInDB(hallId);
    if (res.status === 'error') {
      alert(res.message);
    } else {
      setIsFavorited(res.status === 'added');
    }
    setLoading(false);
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-md hover:scale-110 transition-all duration-300 z-30"
      title={isFavorited ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
    >
      <Heart 
        className={`w-5 h-5 transition-colors duration-300 ${isFavorited ? 'fill-rose-600 text-rose-600' : 'text-slate-400 hover:text-rose-500'}`} 
      />
    </button>
  );
}

// 2. Hall Pricing and Compare Component (Gold line, Compare Button, 3 Shift squares)
export function HallPricingAndCompare({ hall }: { hall: Hall }) {
  const [isCompared, setIsCompared] = useState(false);

  useEffect(() => {
    const checkCompared = () => {
      try {
        const stored = localStorage.getItem('COMPARED_HALLS');
        if (stored) {
          const list: Hall[] = JSON.parse(stored);
          setIsCompared(list.some(h => h.id === hall.id));
        } else {
          setIsCompared(false);
        }
      } catch (e) {
        setIsCompared(false);
      }
    };

    checkCompared();
    window.addEventListener(COMPARE_UPDATED_EVENT, checkCompared);
    return () => window.removeEventListener(COMPARE_UPDATED_EVENT, checkCompared);
  }, [hall.id]);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      const stored = localStorage.getItem('COMPARED_HALLS');
      let list: Hall[] = stored ? JSON.parse(stored) : [];

      if (isCompared) {
        // Remove
        list = list.filter(h => h.id !== hall.id);
        localStorage.setItem('COMPARED_HALLS', JSON.stringify(list));
        setIsCompared(false);
      } else {
        // Add
        if (list.length >= 3) {
          alert('يمكنك مقارنة 3 قاعات كحد أقصى! يرجى إلغاء إحدى القاعات من نافذة المقارنة أولاً.');
          return;
        }
        list.push(hall);
        localStorage.setItem('COMPARED_HALLS', JSON.stringify(list));
        setIsCompared(true);
      }

      // Dispatch global compare update event
      window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
    } catch (err) {
      console.error(err);
    }
  };

  // Prices calculation with fallback logic
  const basePrice = Number(hall.price) || 2000;
  const morningPrice = hall.morningPrice || Math.floor(basePrice * 0.6);
  const nightPrice = hall.nightPrice || Math.floor(basePrice * 0.8);
  const fullDayPrice = hall.fullDayPrice || Math.floor(basePrice * 1.3);

  return (
    <div className="w-full mt-3 mb-3">
      {/* Gold Line */}
      <div className="border-t-2 border-[#D4AF37]/50 my-2"></div>

      {/* Compare trigger button */}
      <div className="flex justify-between items-center mb-2 px-1">
        <button
          onClick={handleCompareToggle}
          className={`flex items-center gap-1.5 text-xs font-bold transition-all duration-300 py-1 px-2.5 rounded-lg border ${
            isCompared 
              ? 'bg-amber-500 text-blue-950 border-amber-600 shadow-sm' 
              : 'text-blue-900 hover:text-amber-600 bg-slate-50 border-slate-200 hover:bg-amber-50/50 hover:border-amber-500/30'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>{isCompared ? "تمت الإضافة للمقارنة (إلغاء)" : "قارن الأسعار والميزات"}</span>
        </button>
        <span className="text-[10px] text-slate-400 font-medium">مقارنة سريعة 📊</span>
      </div>

      {/* Pricing Squares */}
      <div className="grid grid-cols-3 gap-2">
        {/* Morning */}
        <div className="bg-[#FAF6F0] border border-[#D4AF37]/40 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[9px] text-[#1A365D] font-black tracking-wider mb-0.5">الصباحية</span>
          <span className="text-xs font-extrabold text-[#1A365D]">{morningPrice.toLocaleString()} <span className="text-[8px] font-medium">ريال</span></span>
        </div>
        {/* Evening */}
        <div className="bg-[#FAF6F0] border border-[#D4AF37]/40 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[9px] text-[#1A365D] font-black tracking-wider mb-0.5">المسائية</span>
          <span className="text-xs font-extrabold text-[#1A365D]">{nightPrice.toLocaleString()} <span className="text-[8px] font-medium">ريال</span></span>
        </div>
        {/* Full Day */}
        <div className="bg-[#FAF6F0] border border-[#D4AF37]/40 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
          <span className="text-[9px] text-[#1A365D] font-black tracking-wider mb-0.5">اليوم كاملاً</span>
          <span className="text-xs font-extrabold text-orange-600">{fullDayPrice.toLocaleString()} <span className="text-[8px] font-medium">ريال</span></span>
        </div>
      </div>
    </div>
  );
}

// 3. Hall Capacity Label (سعة الاستيعاب)
export function HallCapacityLabel({ capacity }: { capacity?: number | string }) {
  return (
    <div className="flex items-center gap-1 bg-blue-50/50 border border-blue-100 text-blue-950 font-bold px-2.5 py-1 rounded-lg text-xs" title="سعة استيعاب القاعة">
      <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
      <span>سعة الاستيعاب: <strong className="text-amber-600 font-black">{capacity || '500'}</strong> شخص</span>
    </div>
  );
}

// 4. Pricing Pattern Badge Component (Dynamic Overlay Badge)
export function PricingPatternBadge({ bookingType }: { bookingType?: string }) {
  const type = bookingType || 'alacarte';
  
  if (type === 'packages' || type === 'package') {
    return (
      <div className="bg-amber-950/95 border border-amber-800/60 text-amber-100 backdrop-blur-xs px-3 py-1.5 rounded-full text-[10px] font-extrabold shadow-sm flex items-center gap-1">
        <span>📦</span>
        <span>باقة متكاملة مسبقة التحضير</span>
      </div>
    );
  } else if (type === 'venueonly') {
    return (
      <div className="bg-slate-800/95 border border-slate-700/60 text-slate-100 backdrop-blur-xs px-3 py-1.5 rounded-full text-[10px] font-extrabold shadow-sm flex items-center gap-1">
        <span>🏡</span>
        <span>إيجار مساحة فارغة فقط</span>
      </div>
    );
  } else {
    return (
      <div className="bg-[#1A365D]/95 border border-blue-900/60 text-white backdrop-blur-xs px-3 py-1.5 rounded-full text-[10px] font-extrabold shadow-sm flex items-center gap-1">
        <span>🏷️</span>
        <span>سعر أساسي + خدمات اختيارية</span>
      </div>
    );
  }
}

// 5. Hall Status Badges (Dynamic Overlay Badges on Top-Right of Image)
export function HallStatusBadges({ status, bookingStatus }: { status?: string, bookingStatus?: string }) {
  const isActive = status === "مفعل" || status === "active" || status === "approved" || status === "نشط" || !status;
  const bStatus = bookingStatus || "متاح";

  return (
    <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end z-25">
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black shadow-sm text-white border ${
        isActive 
          ? 'bg-emerald-600/90 border-emerald-500/30' 
          : 'bg-rose-600/90 border-rose-500/30'
      }`}>
        {isActive ? "مفعل" : "غير مفعل"}
      </span>
      <span className={`px-2.5 py-1 rounded-full text-[9px] font-black shadow-sm text-white border ${
        bStatus === "متاح" 
          ? 'bg-teal-600/95 border-teal-500/30' 
          : bStatus === "صيانة" 
          ? 'bg-amber-600/95 border-amber-500/30' 
          : 'bg-rose-700/95 border-rose-600/30'
      }`}>
        {bStatus}
      </span>
    </div>
  );
}

// 6. Hall Current Month Occupancy Progress Bar Component
export function getHallCurrentMonthOccupancy(hall: any, bookings: any[] = []) {
  if (typeof hall.occupancyRate === 'number' && hall.occupancyRate >= 0) {
    const percentage = Math.min(100, Math.max(0, hall.occupancyRate));
    const now = new Date();
    const totalDays = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const bookedDays = Math.round((percentage / 100) * totalDays);
    return { percentage, bookedDays, totalDays };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth(); // 0-indexed
  const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

  if (Array.isArray(bookings) && bookings.length > 0) {
    const hallBookings = bookings.filter((b: any) => {
      const isSameHall = b.hall === hall.name || b.facility === hall.name || String(b.hallId) === String(hall.id);
      const isNotCancelled = !['ملغي', 'مرفوض', 'cancelled', 'rejected'].includes(b.status || '');
      return isSameHall && isNotCancelled;
    });

    if (hallBookings.length > 0) {
      const bookedDaysSet = new Set<number>();
      hallBookings.forEach((b: any) => {
        const dateStr = b.startDate || b.date;
        if (dateStr) {
          const bd = new Date(dateStr);
          if (bd.getFullYear() === currentYear && bd.getMonth() === currentMonth) {
            bookedDaysSet.add(bd.getDate());
          }
        }
      });
      if (bookedDaysSet.size > 0) {
        const bookedDays = Math.min(totalDays, bookedDaysSet.size);
        const percentage = Math.min(100, Math.round((bookedDays / totalDays) * 100));
        return { percentage, bookedDays, totalDays };
      }
    }
  }

  // Fallback: deterministic rate based on hall id or name seed
  const idSeed = typeof hall.id === 'number' ? hall.id : (String(hall.id || hall.name).charCodeAt(0) || 1);
  const percentage = 35 + ((idSeed * 19 + 7) % 52); // 35% to 86%
  const bookedDays = Math.round((percentage / 100) * totalDays);
  return { percentage, bookedDays, totalDays };
}

export function HallOccupancyProgressBar({ hall, bookings = [] }: { hall: any; bookings?: any[] }) {
  const { percentage, bookedDays, totalDays } = getHallCurrentMonthOccupancy(hall, bookings);
  
  // Format current month in Arabic (e.g. "أغسطس 2026")
  const currentMonthName = new Date().toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' });

  const barGradient = percentage >= 75
    ? 'from-emerald-500 to-teal-600'
    : percentage >= 45
    ? 'from-amber-500 to-orange-500'
    : 'from-blue-500 to-indigo-600';

  const badgeStyle = percentage >= 75
    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
    : percentage >= 45
    ? 'bg-amber-50 text-amber-800 border-amber-200'
    : 'bg-blue-50 text-blue-800 border-blue-200';

  return (
    <div className="w-full my-2 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/80 shadow-2xs">
      <div className="flex items-center justify-between text-[11px] mb-1.5 font-bold">
        <span className="text-slate-700 flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full inline-block ${percentage >= 75 ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          <span>نسبة إشغال الشهر الحالي ({currentMonthName}):</span>
        </span>
        <span className={`font-mono font-black text-[11px] px-2 py-0.5 rounded-md border ${badgeStyle}`}>
          {percentage}% ({bookedDays}/{totalDays} يوم)
        </span>
      </div>
      <div className="w-full bg-slate-200/80 rounded-full h-2 overflow-hidden p-0.5">
        <div 
          className={`h-full rounded-full transition-all duration-700 ease-out bg-gradient-to-r ${barGradient}`} 
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}


