import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Calendar as CalendarIcon, ChevronRight, ChevronLeft, RefreshCw, 
  MapPin, Star 
} from 'lucide-react';
import { format, subMonths, addMonths, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { Hall } from '../../data/mockData';

interface HomeCalendarBookingSectionProps {
  calendarType: 'gregorian' | 'hijri';
  setCalendarType: (type: 'gregorian' | 'hijri') => void;
  currentMonth: Date;
  setCurrentMonth: React.Dispatch<React.SetStateAction<Date>>;
  selectedDate: Date | null;
  setSelectedDate: (date: Date) => void;
  getFullDateInfo: (date: Date) => any;
  selectedPeriod: 'morning' | 'evening' | 'fullday';
  setSelectedPeriod: (period: 'morning' | 'evening' | 'fullday') => void;
  nearMeOnly: boolean;
  setNearMeOnly: (near: boolean) => void;
  gpsLoading: boolean;
  gpsError: string | null;
  handleGpsFilter: () => void;
  hallsList: Hall[];
  searchRegion: string;
  searchCity: string;
  searchCategory: string;
  searchTerm: string;
  regionsList: any[];
  setSearchRegion: (r: string) => void;
  setSearchCity: (c: string) => void;
  setSearchTerm: (t: string) => void;
  setSearchCategory: (c: string) => void;
}

export const HomeCalendarBookingSection: React.FC<HomeCalendarBookingSectionProps> = ({
  calendarType,
  setCalendarType,
  currentMonth,
  setCurrentMonth,
  selectedDate,
  setSelectedDate,
  getFullDateInfo,
  selectedPeriod,
  setSelectedPeriod,
  nearMeOnly,
  setNearMeOnly,
  gpsLoading,
  gpsError,
  handleGpsFilter,
  hallsList,
  searchRegion,
  searchCity,
  searchCategory,
  searchTerm,
  regionsList,
  setSearchRegion,
  setSearchCity,
  setSearchTerm,
  setSearchCategory
}) => {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        <div className="text-center mb-10">
          <span className="text-amber-500 font-extrabold text-xs sm:text-sm tracking-wider uppercase bg-amber-50 px-3.5 py-1.5 rounded-full border border-amber-200/50">تخطيط فوري وحجز متكامل ⚡</span>
          <h2 className="text-3xl font-black text-blue-950 mt-3">خطط لمناسبتك بذكاء</h2>
          <p className="text-slate-500 text-sm sm:text-base mt-2 max-w-xl mx-auto">تحقق لحظياً من توفر القاعات والاستراحات واحجز موعدك مباشرة من مكان واحد</p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {/* Calendar Part */}
          <div className="lg:col-span-1 bg-slate-50 border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col h-full justify-between">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-black text-blue-950 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-amber-500" />
                  أيام المناسبات
                </h3>
                <div className="flex bg-white rounded-xl p-1 border border-slate-200 gap-1 shadow-2xs">
                  <button 
                    onClick={() => setCalendarType('gregorian')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calendarType === 'gregorian' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    ميلادي
                  </button>
                  <button 
                    onClick={() => setCalendarType('hijri')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${calendarType === 'hijri' ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-xs' : 'text-slate-500 hover:bg-slate-50'}`}
                  >
                    هجري
                  </button>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs mb-4 flex-grow flex flex-col">
                <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 px-1">
                  <button onClick={() => setCurrentMonth(prev => subMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                  <div className="text-center">
                    <div className="font-extrabold text-blue-950 text-sm">
                      {calendarType === 'gregorian' 
                        ? format(currentMonth, 'MMMM yyyy', { locale: arSA })
                        : getFullDateInfo(currentMonth).hijri.monthName + ' ' + getFullDateInfo(currentMonth).hijri.year
                      }
                    </div>
                  </div>
                  <button onClick={() => setCurrentMonth(prev => addMonths(prev, 1))} className="p-1.5 hover:bg-slate-50 rounded-lg border border-slate-100 transition-colors">
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                  </button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center text-[11px] mb-2 font-black text-slate-400">
                  {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map(d => <div key={d} className="py-1">{d}</div>)}
                </div>

                <div className="grid grid-cols-7 gap-1 text-center text-sm flex-1 content-start" key={calendarType}>
                  {(() => {
                    const start = startOfWeek(startOfMonth(currentMonth));
                    const end = endOfWeek(endOfMonth(currentMonth));
                    const days = eachDayOfInterval({ start, end });
                    
                    return days.map((day, idx) => {
                      const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                      const dateInfo = getFullDateInfo(day);
                      const isBooked = [10, 12, 18, 25].includes(day.getDate()); // Mock
                      const isCurrentMonth = day.getMonth() === currentMonth.getMonth();

                      return (
                        <button 
                          key={idx} 
                          onClick={() => setSelectedDate(day)}
                          className={`relative py-2 rounded-xl flex flex-col items-center justify-center transition-all min-h-[52px]
                            ${isSelected 
                              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/20 scale-105 z-10' 
                              : !isCurrentMonth 
                              ? 'text-slate-300 opacity-40' 
                              : isBooked 
                              ? 'bg-orange-50 text-orange-600 border border-orange-100 hover:bg-orange-100/50' 
                              : 'hover:bg-slate-100 text-slate-700'}`}
                        >
                          {calendarType === 'gregorian' ? (
                            <>
                              <span className="text-base font-black leading-none">{dateInfo.gregorian.day}</span>
                              <span className={`text-[9px] mt-1 font-bold ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>{dateInfo.hijri.day}</span>
                            </>
                          ) : (
                            <>
                              <span className="text-base font-black leading-none">{dateInfo.hijri.day}</span>
                              <span className={`text-[9px] mt-1 font-bold ${isSelected ? 'text-amber-100' : 'text-slate-400'}`}>{dateInfo.gregorian.day}</span>
                            </>
                          )}
                          {isBooked && !isSelected && (
                            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></div>
                          )}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {selectedDate && (
              <div className="mt-2 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/60 rounded-2xl shadow-xs transition-all duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-amber-500 text-white rounded-xl shadow-xs shrink-0">
                    <CalendarIcon className="w-5 h-5 animate-pulse" />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] text-amber-600 font-extrabold uppercase tracking-wider mb-0.5">التاريخ واليوم المحدد</span>
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <span className="text-sm font-black text-slate-800 truncate">
                        {format(selectedDate, 'EEEE، d MMMM yyyy', { locale: arSA })}
                      </span>
                      <span className="text-xs font-bold text-amber-700 bg-amber-100/50 px-2 py-0.5 rounded-lg w-max max-w-full truncate">
                        {getFullDateInfo(selectedDate).hijri.full}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Latest Halls Part */}
          <div className="lg:col-span-2 bg-slate-50/50 border border-slate-100 rounded-3xl p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Header with periods, GPS, and link */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
                <div className="flex flex-col">
                  <h3 className="text-lg font-black text-blue-950 flex items-center gap-1.5">
                    قاعات متاحة في هذا اليوم
                  </h3>
                  {selectedDate && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500 font-bold">
                        {format(selectedDate, 'd MMMM', { locale: arSA })}
                      </span>
                      <span className="text-xs text-amber-600 font-extrabold">
                        • {getFullDateInfo(selectedDate).hijri.day} {getFullDateInfo(selectedDate).hijri.monthName}
                      </span>
                    </div>
                  )}
                </div>

                {/* Period selection & GPS */}
                <div className="flex flex-wrap items-center gap-2.5">
                  {/* Period Buttons */}
                  <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 gap-1 shadow-3xs">
                    <button 
                      onClick={() => setSelectedPeriod('morning')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedPeriod === 'morning' 
                          ? 'bg-amber-500 text-white shadow-xs' 
                          : 'text-slate-600 hover:bg-white hover:text-slate-800'
                      }`}
                    >
                      <span>🌅</span>
                      <span>صباحي</span>
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod('evening')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedPeriod === 'evening' 
                          ? 'bg-amber-500 text-white shadow-xs' 
                          : 'text-slate-600 hover:bg-white hover:text-slate-800'
                      }`}
                    >
                      <span>🌌</span>
                      <span>مسائي</span>
                    </button>
                    <button 
                      onClick={() => setSelectedPeriod('fullday')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        selectedPeriod === 'fullday' 
                          ? 'bg-amber-500 text-white shadow-xs' 
                          : 'text-slate-600 hover:bg-white hover:text-slate-800'
                      }`}
                    >
                      <span>📆</span>
                      <span>اليوم كامل</span>
                    </button>
                  </div>

                  {/* GPS Button */}
                  <button 
                    onClick={handleGpsFilter}
                    disabled={gpsLoading}
                    className={`p-2.5 rounded-xl text-xs font-black transition-all border flex items-center justify-center gap-1.5 ${
                      nearMeOnly
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-amber-600 shadow-xs' 
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                    title="تحديد موقع القاعات الأقرب لموقعك"
                  >
                    {gpsLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <MapPin className={`w-4 h-4 ${nearMeOnly ? 'animate-bounce' : ''}`} />
                    )}
                  </button>
                </div>

                <Link 
                  to={`/explore?date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}&period=${selectedPeriod}`} 
                  className="text-amber-600 hover:text-amber-700 font-extrabold text-xs sm:text-sm shrink-0 flex items-center gap-0.5 group self-end md:self-center"
                >
                  <span>عرض جميع القاعات</span>
                  <span className="transition-transform group-hover:translate-x-[-3px]">←</span>
                </Link>
              </div>

              {gpsError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-red-700 text-xs font-bold flex items-center gap-2 animate-fadeIn">
                  <span className="text-sm">⚠️</span>
                  <span>{gpsError}</span>
                </div>
              )}

              {/* Compact Horizontal Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(() => {
                  const day = selectedDate?.getDate() || 1;
                  const filtered = hallsList.filter(hall => {
                    if (hall.status !== 'approved') return false;
                    const hallIdNum = isNaN(parseInt(String(hall.id))) ? 1 : parseInt(String(hall.id));
                    const isAvailable = (hallIdNum + day) % 4 !== 0;
                    const matchesRegion = searchRegion 
                      ? (hall.region === searchRegion || (regionsList.find(r => r.name === searchRegion)?.cities?.includes(hall.city)))
                      : true;
                    const matchesCity = searchCity ? hall.city === searchCity : true;
                    const matchesCategory = searchCategory ? ((hall as any).type === searchCategory || hall.category === searchCategory) : true;
                    const matchesSearchTerm = searchTerm ? (hall.name.toLowerCase().includes(searchTerm.toLowerCase()) || (hall.city && hall.city.toLowerCase().includes(searchTerm.toLowerCase()))) : true;

                    const isMatch = isAvailable && matchesRegion && matchesCity && matchesCategory && matchesSearchTerm;

                    if (nearMeOnly) {
                      return isMatch && (hallIdNum % 2 === 0);
                    }
                    return isMatch;
                  });

                  const displayHalls = filtered.slice(0, 8);

                  if (displayHalls.length === 0) {
                    return (
                      <div className="col-span-2 text-center py-12 bg-white rounded-2xl border border-slate-100 p-6 flex flex-col items-center justify-center">
                        <span className="text-3xl mb-2">🔍</span>
                        <p className="text-slate-500 font-bold text-sm">عذراً، لا يوجد قاعات متاحة بالخيارات المحددة في هذه المنطقة أو المدينة.</p>
                        <button 
                          onClick={() => { setNearMeOnly(false); setSearchRegion(''); setSearchCity(''); setSearchTerm(''); setSearchCategory(''); }}
                          className="mt-3 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-bold transition-all cursor-pointer"
                        >
                          إعادة ضبط الفلاتر ورؤية كافة النتائج
                        </button>
                      </div>
                    );
                  }

                  return displayHalls.map((hall) => {
                    const basePrice = Number(hall.price) || 2000;
                    const morningPrice = hall.morningPrice || Math.floor(basePrice * 0.6);
                    const nightPrice = hall.nightPrice || Math.floor(basePrice * 0.8);
                    const fullDayPrice = hall.fullDayPrice || Math.floor(basePrice * 1.3);

                    const currentPrice = selectedPeriod === 'morning' 
                      ? morningPrice 
                      : selectedPeriod === 'evening' 
                      ? nightPrice 
                      : fullDayPrice;

                    return (
                      <div key={hall.id} className="flex flex-row bg-white border border-slate-100 rounded-xl overflow-hidden shadow-2xs hover:shadow-md hover:border-amber-200/50 transition-all group items-stretch">
                        {/* Image Box */}
                        <div className="w-1/3 relative overflow-hidden shrink-0">
                          <img 
                            src={hall.image} 
                            alt={hall.name} 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-1.5 right-1.5 z-10">
                            <span className="bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                              <span className="w-1 h-1 bg-white rounded-full animate-ping"></span>
                              متاح
                            </span>
                          </div>
                        </div>
                        
                        {/* Detail Box */}
                        <div className="flex flex-col justify-between flex-grow p-4 min-w-0">
                          <div>
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <h4 className="font-extrabold text-blue-950 text-sm sm:text-base line-clamp-1 group-hover:text-amber-600 transition-colors">
                                {hall.name}
                              </h4>
                              <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 shrink-0">
                                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                                <span className="text-[10px] font-black text-amber-700">{hall.rating || '4.8'}</span>
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] sm:text-xs text-slate-500 mb-2">
                              <span className="flex items-center gap-0.5 font-medium">
                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                {hall.city}
                              </span>
                              {nearMeOnly && (
                                <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded">
                                  📍 أقرب إليك
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Price & View button */}
                          <div className="flex justify-between items-end mt-1 pt-1.5 border-t border-slate-50">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[8px] sm:text-[9px] text-slate-400 font-extrabold leading-none mb-1">
                                السعر لـ {selectedPeriod === 'morning' ? 'الصباحية' : selectedPeriod === 'evening' ? 'المسائية' : 'اليوم كامل'}
                              </span>
                              <span className="text-xs sm:text-sm font-black text-slate-900 leading-none">
                                {currentPrice.toLocaleString()} <span className="text-[9px] font-medium text-slate-500">ريال</span>
                              </span>
                            </div>
                            
                            <Link 
                              to={`/hall/${hall.id}?date=${selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}&period=${selectedPeriod}`} 
                              className="bg-slate-900 hover:bg-amber-500 text-white hover:text-white font-extrabold text-[10px] sm:text-xs py-1.5 px-3 rounded-lg transition-all shadow-xs shrink-0"
                            >
                              عرض التفاصيل
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
