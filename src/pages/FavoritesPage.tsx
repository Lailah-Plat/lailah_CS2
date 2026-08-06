import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Heart, Search, MapPin, Users, Star, ArrowRight, Calendar } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { getAuthUser, fetchFavoritesFromDB, FAVORITES_UPDATED_EVENT } from '../components/FavoriteCompareManager';
import { FavoriteHeartButton, HallPricingAndCompare, HallCapacityLabel, PricingPatternBadge, HallStatusBadges } from '../components/HallCardAddons';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const user = getAuthUser();

  const loadFavorites = async () => {
    if (!user || !user.id) {
      setError('يرجى تسجيل الدخول أولاً لعرض القاعات المفضلة.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/favorites/${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setFavorites(data);
        setError(null);
      } else {
        setError('حدث خطأ أثناء تحميل القاعات المفضلة.');
      }
    } catch (err) {
      console.error(err);
      setError('خطأ في الاتصال بالخادم.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();

    const handleFavoritesUpdate = () => loadFavorites();
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdate);

    return () => {
      window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavoritesUpdate);
    };
  }, [user?.id]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-12">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-2">
            <Link to="/" className="hover:text-amber-600 transition-colors">الرئيسية</Link>
            <span>/</span>
            <span className="text-blue-950 font-bold">المفضلة</span>
          </div>
          <h1 className="text-4xl font-extrabold text-blue-950 mb-2 border-r-4 border-rose-500 pr-4">
            قاعاتي المفضلة ❤️
          </h1>
          <p className="text-slate-500 pr-5">إليك قائمة بكافة القاعات التي قمت بحفظها للرجوع إليها لاحقاً وحجزها</p>
        </div>

        {/* Content Section */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-rose-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-500 font-bold mt-4">جاري تحميل قائمتك المفضلة...</p>
          </div>
        ) : error ? (
          <div className="bg-rose-50 border border-rose-100 rounded-2xl p-8 text-center max-w-lg mx-auto">
            <Heart className="w-16 h-16 text-rose-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-rose-900 mb-2">{error}</h3>
            {!user && (
              <button 
                onClick={() => navigate('/')} 
                className="mt-4 bg-rose-600 hover:bg-rose-700 text-white font-bold px-6 py-2.5 rounded-xl transition-all shadow-md"
              >
                تسجيل الدخول / العودة للرئيسية
              </button>
            )}
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-white rounded-3xl p-16 text-center border border-slate-100 shadow-sm max-w-2xl mx-auto">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Heart className="w-10 h-10 text-rose-500 fill-rose-100" />
            </div>
            <h3 className="text-2xl font-extrabold text-blue-950 mb-2">قائمتك المفضلة فارغة حالياً</h3>
            <p className="text-slate-500 max-w-md mx-auto mb-8 text-sm leading-relaxed">
              تصفح القاعات والمنتجعات المتميزة المتاحة في المنصة، وقم بإضافة القاعات المفضلة إليك من خلال الضغط على أيقونة القلب الأحمر (❤️) لحفظها هنا ومقارنتها لاحقاً.
            </p>
            <Link 
              to="/explore" 
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-blue-950 font-black px-8 py-3.5 rounded-2xl transition-all shadow-lg hover:shadow-amber-500/10"
            >
              استكشف القاعات الآن
              <ArrowRight className="w-5 h-5 flip-horizontal" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {favorites.map((fav) => {
              const hall = fav.Hall;
              if (!hall) return null;

              return (
                <div key={hall.id} className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 group flex flex-col justify-between">
                  {/* Card Image area */}
                  <div className="relative h-56 overflow-hidden">
                    <img src={hall.image} alt={hall.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <FavoriteHeartButton hallId={hall.id} />
                    <HallStatusBadges status={hall.status} bookingStatus={hall.bookingStatus} />
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-10 pl-14">
                      <div className="bg-blue-950/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm">
                        {hall.category}
                      </div>
                      <PricingPatternBadge bookingType={hall.bookingType} />
                    </div>
                  </div>

                  {/* Card Body content */}
                  <div className="p-6 flex-grow flex flex-col justify-between">
                    <div>
                      {/* Name & rating */}
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-lg font-bold text-blue-950 line-clamp-1">{hall.name}</h3>
                        <div className="flex items-center gap-1 text-sm font-medium text-slate-700 shrink-0">
                          <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                          {hall.rating}
                        </div>
                      </div>

                      {/* Location and simple specs */}
                      <p className="text-slate-500 text-xs mb-3 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" /> {hall.location || hall.city}
                      </p>

                      {/* Provider name if enabled */}
                      {hall.provider && (
                        <div className="text-[11px] text-slate-400 font-bold mb-2">
                          بواسطة المزود: <span className="text-blue-950 font-extrabold">{hall.provider}</span>
                        </div>
                      )}

                      {/* Custom Added Hall Pricing & Compare components */}
                      <HallPricingAndCompare hall={hall} />
                    </div>

                    {/* Card Footer details */}
                    <div className="flex justify-between items-center pt-3 border-t border-slate-100 mt-2">
                      <HallCapacityLabel capacity={hall.capacity} />
                      <Link 
                        to={`/hall/${hall.id}`} 
                        className="bg-blue-950 hover:bg-blue-900 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-sm transition-all whitespace-nowrap shrink-0"
                      >
                        عرض وحجز
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
