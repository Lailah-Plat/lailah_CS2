import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, Star, Clock, Sparkles, Search, Loader2, ArrowUp, Filter, Building2, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import { getStoredHalls, getPartnerLevel, providers, isProviderNameVisible } from '../data/mockData';
import { FavoriteHeartButton, HallStatusBadges } from '../components/HallCardAddons';

export default function NewPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [hallsList, setHallsList] = useState<any[]>(() => getStoredHalls());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('الكل');
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false');

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleStorageChange = () => {
      setIsEnabled(localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false');
      setHallsList(getStoredHalls());
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('settingsUpdated', handleStorageChange);
    window.addEventListener('hallsUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('settingsUpdated', handleStorageChange);
      window.removeEventListener('hallsUpdated', handleStorageChange);
    };
  }, []);

  // Filter approved and active halls only
  const activeHalls = hallsList.filter((hall: any) => {
    const isApproved = hall.status === 'approved' || hall.status === 'مفعل' || hall.status === 'active' || hall.status === 'نشط' || !hall.status;
    const isNotSuspended = hall.activationStatus !== 'موقوف';
    return isApproved && isNotSuspended;
  });

  // Sort by newest first (createdAt timestamp or ID descending)
  const sortedHalls = [...activeHalls].sort((a: any, b: any) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    
    if (timeA && timeB && !isNaN(timeA) && !isNaN(timeB) && timeA !== timeB) {
      return timeB - timeA;
    }
    
    const idA = typeof a.id === 'number' ? a.id : parseInt(String(a.id).replace(/\D/g, ''), 10) || 0;
    const idB = typeof b.id === 'number' ? b.id : parseInt(String(b.id).replace(/\D/g, ''), 10) || 0;
    return idB - idA;
  });

  // Apply search & category filter
  const filteredHalls = sortedHalls.filter((hall: any) => {
    const nameMatch = (hall.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const cityMatch = (hall.city || hall.location || '').toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = (hall.category || '').toLowerCase().includes(searchTerm.toLowerCase());
    const providerMatch = (hall.provider || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSearch = nameMatch || cityMatch || categoryMatch || providerMatch;
    const matchesCategory = selectedCategory === 'الكل' || hall.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  // Reset pagination count on search/filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [searchTerm, selectedCategory]);

  // Infinite Scroll Trigger via IntersectionObserver
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredHalls.length && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + 12, filteredHalls.length));
            setIsLoadingMore(false);
          }, 350);
        }
      },
      { threshold: 0.1, rootMargin: '150px' }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [visibleCount, filteredHalls.length, isLoadingMore]);

  const displayedHalls = filteredHalls.slice(0, visibleCount);
  const hasMore = visibleCount < filteredHalls.length;

  const categories = ['الكل', 'قاعة أفراح', 'استراحة', 'شاليه', 'منتجع', 'مجمع قاعات'];

  const getHallDisplayPrice = (hall: any) => {
    if (hall.price && Number(hall.price) > 0) return Number(hall.price);
    if (hall.nightPrice && Number(hall.nightPrice) > 0) return Number(hall.nightPrice);
    if (hall.morningPrice && Number(hall.morningPrice) > 0) return Number(hall.morningPrice);
    if (hall.fullDayPrice && Number(hall.fullDayPrice) > 0) return Number(hall.fullDayPrice);
    if (hall.packagesList && hall.packagesList.length > 0 && hall.packagesList[0].price) {
      return Number(hall.packagesList[0].price);
    }
    return 0;
  };

  const formatAddedDate = (hall: any) => {
    if (hall.addedDate) return hall.addedDate;
    if (hall.createdAt) {
      try {
        const d = new Date(hall.createdAt);
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric' });
        }
      } catch (e) {}
      return hall.createdAt;
    }
    return 'مُضاف حديثاً';
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-10">
        
        {/* Header Hero Section */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center bg-amber-100 text-amber-600 p-3 rounded-2xl mb-4 shadow-sm border border-amber-200/60">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-blue-950 mb-3">
            أحدث الإضافات في منصة ليلة
          </h1>
          <p className="text-slate-500 text-base md:text-lg max-w-2xl mx-auto mb-8 leading-relaxed">
            استكشف القاعات والشاليهات والاستراحات المضافة حديثاً مرتبة بحسب الأحدث أولاً، وكُن من أول الحافلين بروعة المكان!
          </p>

          {/* Search and Category Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200/80 max-w-4xl mx-auto space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-grow">
                <Search className="w-5 h-5 text-slate-400 absolute right-3.5 top-3.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="ابحث باسم القاعة، المدينة، أو مقدم الخدمة..."
                  className="w-full pr-11 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 focus:bg-white transition-all font-medium text-slate-800"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute left-3 top-3 text-xs text-slate-400 hover:text-slate-600 font-bold"
                  >
                    إلغاء
                  </button>
                )}
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
              </div>
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-2 scrollbar-none text-xs border-t border-slate-100">
              <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1 ml-1">
                <Filter className="w-3.5 h-3.5" /> التصنيف:
              </span>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap ${
                    selectedCategory === cat
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Counter and Status */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 max-w-7xl mx-auto px-1 gap-2">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-800">
              قائمة الإضافات الجديدة
            </h2>
            <span className="bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full text-xs font-extrabold border border-amber-200">
              {filteredHalls.length} مكان وقاعة
            </span>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            عرض <span className="font-bold text-slate-800">{displayedHalls.length}</span> من أصل <span className="font-bold text-slate-800">{filteredHalls.length}</span> (تحميل تلقائي 12 منتج كل مرة)
          </div>
        </div>

        {/* Empty state */}
        {filteredHalls.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center max-w-xl mx-auto border border-slate-200 shadow-sm my-8">
            <Building2 className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">لا توجد نتائج مطابقة للبحث</h3>
            <p className="text-slate-500 text-sm mb-6">جرب تغيير كلمات البحث أو اختيار تصنيف مختلف للعثور على القاعات والمحلات المتاحة.</p>
            <button
              onClick={() => { setSearchTerm(''); setSelectedCategory('الكل'); }}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-sm transition-colors shadow-sm"
            >
              إعادة ضبط الفلاتر
            </button>
          </div>
        ) : (
          <>
            {/* Table View */}
            {viewMode === 'table' ? (
              <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-200 max-w-6xl mx-auto">
                <table className="w-full text-right text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">مكان الحفل / القاعة</th>
                      <th className="px-6 py-4 font-bold">التصنيف</th>
                      <th className="px-6 py-4 font-bold">المدينة</th>
                      <th className="px-6 py-4 font-bold">السعر الابتدائي (شامل الضريبة)</th>
                      <th className="px-6 py-4 font-bold">تاريخ الإضافة</th>
                      <th className="px-6 py-4 font-bold text-center">التقييم</th>
                      <th className="px-6 py-4 font-bold text-center">التفاصيل</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedHalls.map((hall) => {
                      const price = getHallDisplayPrice(hall);
                      const providerData = providers.find((p) => p.name === hall.provider);
                      const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;
                      
                      return (
                        <tr key={hall.id} className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors">
                          <td className="px-6 py-4 font-bold text-blue-950">
                            <div className="flex items-center gap-3">
                              <img
                                src={hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'}
                                alt={hall.name}
                                className="w-12 h-12 rounded-xl object-cover shrink-0 border border-slate-100"
                              />
                              <div>
                                <div className="flex items-center gap-2">
                                  <span>{hall.name}</span>
                                  <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-extrabold shrink-0 shadow-sm">جديد</span>
                                </div>
                                {isProviderNameVisible(hall) && hall.provider && (
                                  <span className="text-[11px] text-slate-400 font-normal block mt-0.5">
                                    المزود: {hall.provider}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg text-xs font-bold inline-block">
                              {hall.category || 'قاعة'}
                            </span>
                          </td>
                          <td className="px-6 py-4 font-medium text-slate-700">{hall.location || hall.city || 'الرياض'}</td>
                          <td className="px-6 py-4 font-black text-amber-600 text-base">
                            {price > 0 ? `${price.toLocaleString()} ر.س` : 'حسب الاختيار'}
                          </td>
                          <td className="px-6 py-4 text-xs font-medium text-slate-500">{formatAddedDate(hall)}</td>
                          <td className="px-6 py-4 text-center">
                            <span className="inline-flex items-center gap-1 font-bold bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200/50 text-xs">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {hall.rating || 5.0}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <Link
                              to={`/hall/${hall.id}`}
                              className="text-amber-600 hover:text-amber-700 font-bold px-3.5 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors inline-block whitespace-nowrap text-xs border border-amber-200/60"
                            >
                              عرض التفاصيل
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Grid / List View */
              <div className={viewMode === 'list' ? 'flex flex-col gap-6 max-w-4xl mx-auto' : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'}>
                {displayedHalls.map((hall) => {
                  const price = getHallDisplayPrice(hall);
                  const providerData = providers.find((p) => p.name === hall.provider);
                  const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;

                  return (
                    <div
                      key={hall.id}
                      className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200/80 group flex ${
                        viewMode === 'list' ? 'flex-col md:flex-row' : 'flex-col'
                      }`}
                    >
                      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'h-52 md:h-auto md:w-2/5 shrink-0' : 'h-56'}`}>
                        <img
                          src={hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'}
                          alt={hall.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <FavoriteHeartButton hallId={hall.id} />
                        <HallStatusBadges status={hall.status} bookingStatus={hall.bookingStatus} />

                        <div className="absolute top-3 right-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5" /> جديد
                        </div>

                        <div className="absolute bottom-3 right-3 flex flex-wrap gap-1.5">
                          <span className="bg-blue-950/80 backdrop-blur-sm text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-sm">
                            {hall.category || 'قاعة'}
                          </span>
                          {partnerLevel && (
                            <span className={`${partnerLevel.bg}/95 backdrop-blur-sm px-2.5 py-1 rounded-lg text-[10px] font-bold ${partnerLevel.color} shadow-sm border ${partnerLevel.border}`}>
                              {partnerLevel.icon} {partnerLevel.name}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-5 flex flex-col justify-between flex-grow">
                        <div>
                          <div className="flex justify-between items-start mb-2 gap-2">
                            <h3 className="text-lg font-extrabold text-blue-950 group-hover:text-amber-600 transition-colors line-clamp-1">
                              {hall.name}
                            </h3>
                            <div className="flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg shrink-0 border border-slate-100">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" /> {hall.rating || 5.0}
                            </div>
                          </div>

                          <div className="space-y-2 mb-4 text-xs text-slate-500">
                            <p className="flex items-center gap-1.5 font-medium">
                              <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {hall.location || hall.city || 'الرياض'}
                            </p>
                            
                            <p className="flex items-center gap-1.5 font-medium text-slate-400">
                              <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" /> أُضيفت {formatAddedDate(hall)}
                            </p>

                            {isProviderNameVisible(hall) && hall.provider && (
                              <p className="flex items-center gap-1.5 text-slate-600 font-bold bg-slate-50 p-1.5 rounded-lg border border-slate-100/80">
                                <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                                <span>المزود: {hall.provider}</span>
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-auto">
                          <div>
                            <span className="block text-[10px] text-slate-400 font-bold">السعر المبدأي (شامل الضريبة)</span>
                            <span className="text-base font-black text-amber-600">
                              {price > 0 ? `${price.toLocaleString()} ر.س` : 'حسب الفترة'}
                            </span>
                          </div>
                          <Link
                            to={`/hall/${hall.id}`}
                            className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm hover:shadow-md flex items-center gap-1"
                          >
                            عرض التفاصيل
                          </Link>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Infinite Scroll Sentinel and Load More indicator */}
            <div ref={observerTarget} className="py-8 text-center flex flex-col items-center justify-center">
              {isLoadingMore ? (
                <div className="flex items-center gap-2 bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200 text-amber-600 font-bold text-sm">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>جاري تحميل المزيد من القاعات والأماكن الأحدث (12 منتج كل مرة)...</span>
                </div>
              ) : hasMore ? (
                <button
                  onClick={() => setVisibleCount((prev) => Math.min(prev + 12, filteredHalls.length))}
                  className="bg-white hover:bg-amber-50 border border-amber-300 text-amber-700 px-6 py-2.5 rounded-2xl font-bold text-sm transition-all shadow-sm flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>تحميل المزيد ({Math.min(12, filteredHalls.length - visibleCount)} قاعة متبقية)</span>
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-slate-400 font-bold bg-slate-100 px-4 py-2 rounded-full inline-block">
                    ✨ وصلت إلى نهاية القائمة - تم عرض جميع الإضافات الجديدة ({filteredHalls.length})
                  </p>
                  <div>
                    <button
                      onClick={scrollToTop}
                      className="text-amber-600 hover:text-amber-700 text-xs font-bold inline-flex items-center gap-1 hover:underline"
                    >
                      <ArrowUp className="w-3.5 h-3.5" /> العودة للأعلى
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}

