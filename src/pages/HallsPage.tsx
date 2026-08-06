import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Search, MapPin, Star, Calendar, Users, Crown } from 'lucide-react';
import { Link } from 'react-router-dom';
import ViewToggle, { ViewMode } from '../components/ViewToggle';
import { FavoriteHeartButton, HallPricingAndCompare, HallCapacityLabel, PricingPatternBadge, HallStatusBadges } from '../components/HallCardAddons';
import { halls, getPartnerLevel, providers, getStoredHalls } from '../data/mockData';

export default function HallsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [isEnabled, setIsEnabled] = useState(() => localStorage.getItem('ENABLE_PROVIDER_LEVELS') !== 'false');
  const [userLocation, setUserLocation] = useState<{city?: string, region?: string}>({});

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const user = JSON.parse(stored);
        setUserLocation({ city: user.city, region: user.region });
      }
    } catch(e) {}
  }, []);

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

  const [hallsList, setHallsList] = useState(() => getStoredHalls());
  const [currentPage, setCurrentPage] = useState(1);
  const hallsPerPage = Number(localStorage.getItem('SETTINGS_HALLS_PER_PAGE') || '6');

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const displayedHalls = hallsList.filter(hall => {
    if (hall.status !== 'approved' && hall.status !== 'مفعل' && hall.status !== 'active' && hall.status !== 'نشط') return false;
    if (hall.activationStatus === 'موقوف') return false;
    const hallCity = hall.city || '';
    const hallName = hall.name || '';
    const hallCategory = hall.category || '';

    return hallName.includes(searchTerm) || hallCity.includes(searchTerm) || hallCategory.includes(searchTerm);
  });

  const totalPages = Math.ceil(displayedHalls.length / hallsPerPage) || 1;
  const paginatedHalls = displayedHalls.slice((currentPage - 1) * hallsPerPage, currentPage * hallsPerPage);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-blue-950 mb-2 border-r-4 border-amber-500 pr-4">حجوزات الأماكن</h1>
            <p className="text-slate-500 pr-5">استعرض كافة الأماكن المتاحة وقم بحجز مناسبتك</p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="بحث بالاسم أو المدينة..." 
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <ViewToggle viewMode={viewMode} setViewMode={setViewMode} />
          </div>
        </div>

        {displayedHalls.length > 0 ? (
          <>
            {viewMode === 'table' ? (
              <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100">
                <table className="w-full text-right text-sm text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-100 text-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-bold">الاسم</th>
                      <th className="px-6 py-4 font-bold">الفئة</th>
                      <th className="px-6 py-4 font-bold">المدينة</th>
                      <th className="px-6 py-4 font-bold">السعر</th>
                      <th className="px-6 py-4 font-bold text-center">التقييم</th>
                      <th className="px-6 py-4 font-bold text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody>
                      {paginatedHalls.map((hall) => {
                        const providerData = providers.find(p => p.name === hall.provider);
                        const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;
                        return (
                          <tr key={hall.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                            <td className="px-6 py-4 font-bold text-blue-950 flex flex-col">
                              <div className="flex items-center gap-3">
                                <img src={hall.image} alt={hall.name} className="w-12 h-12 rounded-lg object-cover" />
                                {hall.name}
                              </div>
                              {partnerLevel && (
                                <div className="mt-1 pr-15">
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold border ${partnerLevel.bg} ${partnerLevel.color} ${partnerLevel.border}`}>
                                    <span>{partnerLevel.icon}</span>
                                    <span>{partnerLevel.name}</span>
                                  </span>
                                </div>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              <div className="font-medium text-slate-800">{hall.category}</div>
                              <div className="mt-1">
                                {hall.bookingType === 'packages' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                    🎁 باقات شاملة
                                  </span>
                                )}
                                {hall.bookingType === 'venueonly' && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                    🏰 حجز مجرد
                                  </span>
                                )}
                                {(hall.bookingType === 'alacarte' || !hall.bookingType) && (
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-750 border border-slate-200">
                                    🛒 خدمات منفردة
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4">{hall.location || hall.city}</td>
                            <td className="px-6 py-4 font-bold text-orange-500">{hall.price.toLocaleString()} ريال</td>
                            <td className="px-6 py-4 text-center">
                              <span className="inline-flex items-center gap-1 font-bold bg-amber-50 text-amber-700 px-2 py-1 rounded">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> {hall.rating}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-center">
                              <Link to={`/hall/${hall.id}`} className="text-amber-600 hover:text-amber-700 font-bold px-3 py-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors inline-block whitespace-nowrap">عرض التفاصيل</Link>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className={viewMode === 'list' ? "space-y-6" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"}>
                {paginatedHalls.map((hall) => {
                  const providerData = providers.find(p => p.name === hall.provider);
                  const partnerLevel = providerData ? getPartnerLevel(providerData.bookingsCount, providerData.rating, isEnabled, providerData.packageName, providerData.packageDuration) : null;
                  return (
                    <div key={hall.id} className={`bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all border border-slate-100 flex ${viewMode === 'list' ? 'flex-col md:flex-row' : 'flex-col'} group`}>
                      <div className={`relative overflow-hidden ${viewMode === 'list' ? 'w-full md:w-1/3 h-64 md:h-auto shrink-0' : 'h-48'}`}>
                        <img src={hall.image} alt={hall.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <FavoriteHeartButton hallId={hall.id} />
                        <HallStatusBadges status={hall.status} bookingStatus={hall.bookingStatus} />
                        <div className="absolute top-4 left-4 flex flex-col gap-2 items-start z-10 pl-14">
                          <div className="bg-blue-950/80 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm">
                            {hall.category}
                          </div>
                          <PricingPatternBadge bookingType={hall.bookingType} />
                          {partnerLevel && (
                            <div className={`${partnerLevel.bg}/90 backdrop-blur-sm px-3 py-1.5 rounded-full text-[10px] font-bold ${partnerLevel.color} shadow-sm border ${partnerLevel.border}`}>
                              {partnerLevel.icon} {partnerLevel.name}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className={`p-6 flex flex-col justify-between ${viewMode === 'list' ? 'w-full md:w-2/3' : 'w-full flex-grow'}`}>
                        <div>
                          <div className="flex justify-between items-start mb-2">
                            <h2 className="text-2xl font-bold text-blue-950 group-hover:text-amber-600 transition-colors">{hall.name}</h2>
                            <div className="flex items-center gap-1 text-sm font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded-lg">
                              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                              {hall.rating}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-amber-500" /> {hall.location || hall.city}</span>
                            <span className="flex items-center gap-1.5 text-emerald-600 font-medium">
                              <Calendar className="w-4 h-4" /> متاح للحجز
                            </span>
                          </div>

                          {hall.showProvider !== false && hall.provider && (
                            <div className="bg-slate-50 rounded-lg p-2 mb-2 flex items-center gap-2 w-fit">
                               <span className="text-xs text-slate-400">مقدم الخدمة:</span>
                               <span className="text-xs font-bold text-blue-950">{hall.provider}</span>
                            </div>
                          )}

                          <HallPricingAndCompare hall={hall} />
                          
                          <p className="text-slate-600 line-clamp-2 mt-4 mb-4 text-sm">
                            {hall.description}
                          </p>
                        </div>

                        <div className="flex justify-between items-center pt-4 border-t border-slate-100 mt-2">
                          <HallCapacityLabel capacity={hall.capacity} />
                          <div className="flex gap-3">
                            <Link to={`/hall/${hall.id}`} className="bg-blue-950 hover:bg-blue-900 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-md text-sm">
                              التفاصيل والحجز
                            </Link>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-between items-center bg-white rounded-2xl p-4 border border-slate-100 shadow-sm mt-8 animate-in fade-in" dir="rtl">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-750 hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-350 disabled:border-slate-100 disabled:cursor-not-allowed rounded-xl transition-all text-sm font-bold"
                >
                  السابق
                </button>
                <span className="text-slate-600 text-sm font-semibold">
                  الصفحة {currentPage} من {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-slate-50 border border-slate-200 text-slate-750 hover:bg-slate-100 disabled:bg-slate-50 disabled:text-slate-350 disabled:border-slate-100 disabled:cursor-not-allowed rounded-xl transition-all text-sm font-bold"
                >
                  التالي
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
            <Search className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-blue-950 mb-2">لا توجد نتائج مطابقة</h3>
            <p className="text-slate-500">حاول تغيير معايير البحث أو تصفح الأماكن المتاحة</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
