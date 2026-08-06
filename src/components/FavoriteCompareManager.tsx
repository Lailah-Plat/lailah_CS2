import React, { useState, useEffect } from 'react';
import { GitCompare, Heart, X, Star, Users, MapPin, Check, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export interface Hall {
  id: number;
  name: string;
  type?: string;
  description?: string;
  capacity?: number | string;
  location?: string;
  city: string;
  category: string;
  price?: number;
  rating: number;
  image?: string;
  provider: string;
  morningPrice?: number;
  nightPrice?: number;
  fullDayPrice?: number;
  features?: string | string[];
  [key: string]: any;
}

// Global state keys / events
export const FAVORITES_UPDATED_EVENT = 'favoritesUpdated';
export const COMPARE_UPDATED_EVENT = 'compareUpdated';

export function getAuthUser() {
  try {
    const stored = localStorage.getItem('currentUser');
    if (stored) return JSON.parse(stored);
  } catch (e) {}
  return null;
}

// API helper to toggle favorite in the Postgres database
export async function toggleFavoriteInDB(hallId: number): Promise<{ status: 'added' | 'removed' | 'error'; message: string }> {
  const user = getAuthUser();
  if (!user || !user.id) {
    return { status: 'error', message: 'يرجى تسجيل الدخول أولاً لإضافة القاعة إلى المفضلة' };
  }

  try {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: user.id, hallId })
    });

    if (response.ok) {
      const data = await response.json();
      // Dispatch event to update UI instantly
      window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT));
      return { status: data.status, message: data.message };
    } else {
      const data = await response.json();
      return { status: 'error', message: data.error || 'فشل تعديل المفضلة' };
    }
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return { status: 'error', message: 'خطأ في الاتصال بالخادم' };
  }
}

// Fetch user favorites from database
export async function fetchFavoritesFromDB(): Promise<number[]> {
  const user = getAuthUser();
  if (!user || !user.id) return [];

  const fetchFavsWithRetry = (retries = 4, delay = 1000): Promise<any> => {
    return fetch(`/api/favorites/${user.id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load favorites: status ' + res.status);
        return res.json();
      })
      .catch(err => {
        if (retries > 0) {
          console.log(`[Retry] Retrying fetch /api/favorites/${user.id}... ${retries} attempts left`);
          return new Promise(resolve => setTimeout(resolve, delay))
            .then(() => fetchFavsWithRetry(retries - 1, delay * 1.5));
        }
        throw err;
      });
  };

  try {
    const data = await fetchFavsWithRetry();
    return data.map((fav: any) => fav.hallId);
  } catch (error) {
    console.error('Error fetching favorites after retries:', error);
  }
  return [];
}

export default function FavoriteCompareManager() {
  const [comparedHalls, setComparedHalls] = useState<Hall[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const user = getAuthUser();

  // Load compared halls on mount and listen to updates
  useEffect(() => {
    const loadCompared = () => {
      try {
        const stored = localStorage.getItem('COMPARED_HALLS');
        if (stored) {
          setComparedHalls(JSON.parse(stored));
        } else {
          setComparedHalls([]);
        }
      } catch (e) {
        setComparedHalls([]);
      }
    };

    const loadFavorites = async () => {
      if (user && user.id) {
        const favIds = await fetchFavoritesFromDB();
        setFavorites(favIds);
        localStorage.setItem(`USER_FAVORITES_${user.id}`, JSON.stringify(favIds));
      } else {
        setFavorites([]);
      }
    };

    loadCompared();
    loadFavorites();

    const handleCompareUpdate = () => loadCompared();
    const handleFavoritesUpdate = () => loadFavorites();

    window.addEventListener(COMPARE_UPDATED_EVENT, handleCompareUpdate);
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdate);
    window.addEventListener('storage', loadCompared);

    return () => {
      window.removeEventListener(COMPARE_UPDATED_EVENT, handleCompareUpdate);
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdate);
      window.removeEventListener('storage', loadCompared);
    };
  }, [user?.id]);

  const removeCompared = (hallId: number) => {
    const updated = comparedHalls.filter(h => h.id !== hallId);
    localStorage.setItem('COMPARED_HALLS', JSON.stringify(updated));
    setComparedHalls(updated);
    window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
  };

  const clearAllCompared = () => {
    localStorage.removeItem('COMPARED_HALLS');
    setComparedHalls([]);
    window.dispatchEvent(new Event(COMPARE_UPDATED_EVENT));
  };

  const showToast = (text: string, type: 'success' | 'error' | 'info') => {
    setMessage({ text, type });
    setTimeout(() => {
      setMessage(null);
    }, 4000);
  };

  if (comparedHalls.length === 0 && !isCompareModalOpen) {
    return (
      <>
        {message && (
          <div className="fixed bottom-6 right-6 z-[999] bg-blue-950 text-white border border-amber-500/30 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce font-sans" dir="rtl">
            <AlertCircle className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-bold">{message.text}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="font-sans" dir="rtl">
      {/* Toast Notification */}
      {message && (
        <div className="fixed bottom-6 right-6 z-[999] bg-blue-950 text-white border border-amber-500/30 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce" style={{ direction: 'rtl' }}>
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span className="text-sm font-bold">{message.text}</span>
        </div>
      )}

      {/* Floating Comparison Window (نافذة مقارنة عائمة) */}
      {comparedHalls.length > 0 && (
        <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-6 md:w-[450px] z-[90] bg-blue-950/95 backdrop-blur-md text-white border border-amber-500/40 p-4 rounded-2xl shadow-2xl animate-fade-in flex flex-col gap-3">
          <div className="flex justify-between items-center pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="bg-amber-500 text-blue-950 p-1.5 rounded-lg">
                <GitCompare className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold">مقارنة الأسعار والميزات</h4>
                <p className="text-[10px] text-slate-300">مقارنة بين {comparedHalls.length} من أصل 4 قاعات كحد أقصى</p>
              </div>
            </div>
            <button 
              onClick={clearAllCompared} 
              className="text-slate-400 hover:text-white transition-colors text-xs font-bold px-2 py-1 bg-white/5 rounded-lg"
            >
              إلغاء الكل
            </button>
          </div>

          {/* Compared Items List */}
          <div className="grid grid-cols-4 gap-2">
            {comparedHalls.map((hall) => (
              <div key={hall.id} className="relative bg-white/5 border border-white/10 p-2 rounded-xl flex flex-col items-center text-center">
                <button 
                  onClick={() => removeCompared(hall.id)}
                  className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white p-1 rounded-full hover:bg-rose-700 transition-all z-10"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
                <img src={hall.image} alt={hall.name} className="w-10 h-10 rounded-lg object-cover mb-1 border border-white/10" />
                <span className="text-[9px] font-bold line-clamp-1 text-slate-100">{hall.name}</span>
                <span className="text-[8px] text-amber-400 font-bold mt-0.5">{hall.price ? hall.price.toLocaleString() : '0'} ر.س</span>
              </div>
            ))}
            {Array.from({ length: 4 - comparedHalls.length }).map((_, idx) => (
              <div key={idx} className="border border-dashed border-white/10 p-1.5 rounded-xl flex flex-col items-center justify-center h-16 text-slate-500">
                <span className="text-[9px] font-bold">شاغر</span>
                <span className="text-[7px] mt-0.5">+ أضف</span>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button 
              onClick={() => setIsCompareModalOpen(true)}
              className="flex-grow bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-blue-950 font-bold py-2.5 rounded-xl text-xs transition-all shadow-md text-center flex items-center justify-center gap-1.5"
            >
              <GitCompare className="w-4 h-4" />
              قارن الآن (عرض مقارنة تفصيلية)
            </button>
          </div>
        </div>
      )}

      {/* Majestic Comparison Detailed Overlay Modal (شاشة المقارنة التفصيلية) */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 bg-blue-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl w-full max-w-5xl shadow-2xl border border-slate-100 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-blue-950 text-white p-6 flex justify-between items-center border-b border-amber-500/30">
              <div className="flex items-center gap-3">
                <div className="bg-amber-500 text-blue-950 p-2 rounded-xl">
                  <GitCompare className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold">المقارنة الشاملة للقاعات والميزات</h3>
                  <p className="text-xs text-slate-300">تحليل مقارن للميزات والمواصفات والأسعار لمساعدتك في اتخاذ القرار الأمثل</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCompareModalOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable Table) */}
            <div className="p-6 overflow-y-auto flex-grow">
              {comparedHalls.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <GitCompare className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <p className="font-bold text-lg">لا توجد قاعات محددة للمقارنة حالياً</p>
                  <p className="text-xs text-slate-400 mt-1">يرجى إضافة بعض القاعات إلى قائمة المقارنة لعرضها هنا</p>
                </div>
              ) : (
                <div className="grid grid-cols-5 border border-slate-100 rounded-2xl overflow-hidden bg-slate-50/50 min-w-[750px]">
                  {/* Category Column */}
                  <div className="col-span-1 bg-slate-50 font-bold text-slate-700 divide-y divide-slate-100 shrink-0">
                    <div className="h-52 p-3 flex items-center bg-slate-100 text-blue-950 font-black text-xs">القاعات المحددة للمقارنة</div>
                    <div className="h-12 p-3 flex items-center text-xs">التصنيف والنوع</div>
                    <div className="h-12 p-3 flex items-center text-xs">السعة القصوى</div>
                    <div className="h-12 p-3 flex items-center text-xs">المدينة والمنطقة</div>
                    <div className="h-12 p-3 flex items-center text-xs font-bold text-blue-900 bg-blue-50/30">مستوى الشريك والتأكيد</div>
                    <div className="h-12 p-3 flex items-center text-xs font-bold text-emerald-800 bg-emerald-50/30">زمن الاستجابة</div>
                    <div className="h-12 p-3 flex items-center text-xs">المناسبات المكتملة</div>
                    <div className="h-16 p-3 flex items-center text-xs font-black text-amber-600 bg-amber-50/30">الفترة الصباحية</div>
                    <div className="h-16 p-3 flex items-center text-xs font-black text-amber-600 bg-amber-50/30">الفترة المسائية</div>
                    <div className="h-16 p-3 flex items-center text-xs font-black text-amber-600 bg-amber-50/30">سعر اليوم الكامل</div>
                    <div className="h-12 p-3 flex items-center text-xs">التقييم العام</div>
                    <div className="h-20 p-3 flex items-center text-xs">الميزات والباقات</div>
                    <div className="h-14 p-3 flex items-center text-xs bg-slate-100">العربون وسياسة الإلغاء</div>
                    <div className="h-16 p-3 flex items-center text-xs bg-slate-100">إجراءات الحجز</div>
                  </div>

                  {/* Hall Columns */}
                  {Array.from({ length: 4 }).map((_, idx) => {
                    const hall = comparedHalls[idx];
                    if (!hall) {
                      return (
                        <div key={idx} className="col-span-1 bg-white border-r border-slate-100 flex flex-col justify-center items-center text-slate-300 h-full py-20 text-center">
                          <GitCompare className="w-8 h-8 mb-2 text-slate-200" />
                          <span className="text-xs font-bold text-slate-400">مكان شاغر</span>
                          <span className="text-[10px] text-slate-300 mt-1">أضف خياراً آخر</span>
                        </div>
                      );
                    }

                    // Fallback prices calculation
                    const basePrice = hall.price || 0;
                    const mPrice = hall.morningPrice || Math.floor(basePrice * 0.6);
                    const ePrice = hall.nightPrice || Math.floor(basePrice * 0.8);
                    const fPrice = hall.fullDayPrice || Math.floor(basePrice * 1.3);

                    // Features parsing
                    let featuresArr: string[] = [];
                    if (hall.features) {
                      if (Array.isArray(hall.features)) {
                        featuresArr = hall.features;
                      } else {
                        try {
                          featuresArr = JSON.parse(hall.features);
                        } catch {
                          featuresArr = hall.features.split(',').map(f => f.trim());
                        }
                      }
                    }

                    return (
                      <div key={hall.id} className="col-span-1 bg-white border-r border-slate-100 divide-y divide-slate-100 text-center flex flex-col justify-between">
                        {/* Hall Header Details */}
                        <div className="h-52 p-3 flex flex-col justify-between items-center bg-white relative">
                          <img src={hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'} alt={hall.name} className="w-full h-28 rounded-xl object-cover border border-slate-100 shadow-sm" />
                          <h4 className="font-extrabold text-blue-950 mt-1 text-xs line-clamp-1">{hall.name}</h4>
                          <Link 
                            to={`/provider-profile/${encodeURIComponent(hall.provider || 'الشريك المعتمد')}`}
                            onClick={() => setIsCompareModalOpen(false)}
                            className="text-[10px] text-blue-600 hover:underline font-bold block line-clamp-1"
                          >
                            {hall.provider || 'شريك منصة ليلة'}
                          </Link>
                        </div>

                        {/* Hall Info Cells */}
                        <div className="h-12 p-2 flex items-center justify-center text-xs text-slate-700 font-bold">{hall.category || 'قاعة'}</div>
                        <div className="h-12 p-2 flex items-center justify-center text-xs text-slate-700 font-extrabold bg-blue-50/20">
                          <Users className="w-3.5 h-3.5 ml-1 text-amber-500 inline" />
                          {hall.capacity || 300} شخص
                        </div>
                        <div className="h-12 p-2 flex items-center justify-center text-xs text-slate-700">
                          <MapPin className="w-3.5 h-3.5 ml-1 text-amber-500 inline" />
                          {hall.location || hall.city || 'الرياض'}
                        </div>

                        {/* Partner Tier & Confirmation Speed */}
                        <div className="h-12 p-2 flex items-center justify-center text-[11px] font-extrabold text-blue-950 bg-blue-50/30">
                          <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[10px]">💎 شريك ماسي</span>
                        </div>
                        <div className="h-12 p-2 flex items-center justify-center text-[11px] font-bold text-emerald-700 bg-emerald-50/30">
                          ⚡ استجابة خلال 10 دقائق
                        </div>
                        <div className="h-12 p-2 flex items-center justify-center text-xs font-extrabold text-slate-800">
                          140+ مناسبة منفذة
                        </div>

                        {/* Shift Prices */}
                        <div className="h-16 p-2 flex flex-col justify-center items-center bg-[#FAF6F0] border-amber-500/20">
                          <span className="text-[9px] text-slate-500 font-medium">الصباحية</span>
                          <span className="text-xs font-black text-blue-950">{mPrice.toLocaleString()} ر.س</span>
                        </div>
                        <div className="h-16 p-2 flex flex-col justify-center items-center bg-[#FAF6F0] border-amber-500/20">
                          <span className="text-[9px] text-slate-500 font-medium">المسائية</span>
                          <span className="text-xs font-black text-blue-950">{ePrice.toLocaleString()} ر.س</span>
                        </div>
                        <div className="h-16 p-2 flex flex-col justify-center items-center bg-[#FAF6F0] border-amber-500/20 font-black">
                          <span className="text-[9px] text-slate-500 font-medium">اليوم كاملاً</span>
                          <span className="text-xs font-black text-orange-600">{fPrice.toLocaleString()} ر.س</span>
                        </div>

                        {/* Rating */}
                        <div className="h-12 p-2 flex items-center justify-center text-xs font-bold text-amber-600">
                          <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500 ml-1 inline" />
                          {hall.rating || 4.9} / 5
                        </div>

                        {/* Features */}
                        <div className="h-20 p-2 flex flex-wrap gap-1 items-center justify-center overflow-y-auto">
                          {featuresArr.length > 0 ? (
                            featuresArr.slice(0, 3).map((feat, i) => (
                              <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-slate-50 border border-slate-100 text-[8px] font-bold text-slate-600 whitespace-nowrap">
                                <Check className="w-2.5 h-2.5 text-emerald-500" />
                                {feat}
                              </span>
                            ))
                          ) : (
                            <span className="text-[9px] text-slate-400">باقة خدمات مجهزة بالكامل</span>
                          )}
                        </div>

                        {/* Deposit & Cancellation */}
                        <div className="h-14 p-2 flex flex-col items-center justify-center text-[10px] text-slate-600 bg-slate-50/80">
                          <span className="font-bold text-emerald-700">عربون 20% فقط</span>
                          <span className="text-slate-400 text-[9px]">إلغاء مجاني قبل 14 يوم</span>
                        </div>

                        {/* Action Details */}
                        <div className="h-16 p-2 flex items-center justify-center bg-slate-50">
                          <Link 
                            to={`/hall/${hall.id}`} 
                            onClick={() => setIsCompareModalOpen(false)}
                            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition-all shadow-sm block w-full whitespace-nowrap"
                          >
                            عرض وحجز
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 p-4 flex justify-between items-center border-t border-slate-100">
              <button 
                onClick={clearAllCompared}
                className="text-red-600 hover:bg-red-50 font-bold px-5 py-2.5 rounded-xl text-xs transition-all border border-red-200"
              >
                مسح قائمة المقارنة بالكامل
              </button>
              <button 
                onClick={() => setIsCompareModalOpen(false)}
                className="bg-blue-950 hover:bg-blue-900 text-white font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
              >
                إغلاق النافذة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
