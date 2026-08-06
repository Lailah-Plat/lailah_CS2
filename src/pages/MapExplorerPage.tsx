import React, { useState, useMemo, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  MapPin, Search, Filter, Layers, Building2, Users, Star, ArrowRight, 
  Sparkles, CheckCircle2, ChevronLeft, Eye, ShieldCheck, Compass, Sliders,
  Navigation, Crosshair, AlertCircle, Map as MapIcon, Globe
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredHalls } from '../data/mockData';

// Coordinates helper for Saudi Cities & Districts
const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'الرياض': { lat: 24.7136, lng: 46.6753 },
  'جدة': { lat: 21.5433, lng: 39.1728 },
  'الدمام': { lat: 26.4207, lng: 50.0888 },
  'مكة المكرمة': { lat: 21.3891, lng: 39.8579 },
  'المدينة المنورة': { lat: 24.5247, lng: 39.5692 },
  'الخبر': { lat: 26.2172, lng: 50.1971 },
};

// District offsets & names for rich canvas simulation
const CITY_DISTRICTS: Record<string, { name: string; top: string; left: string; latOffset: number; lngOffset: number }[]> = {
  'الرياض': [
    { name: 'حي النرجس', top: '22%', left: '32%', latOffset: 0.08, lngOffset: -0.02 },
    { name: 'حي الملقا', top: '35%', left: '52%', latOffset: 0.06, lngOffset: 0.04 },
    { name: 'حي الياسمين', top: '42%', left: '22%', latOffset: 0.04, lngOffset: -0.05 },
    { name: 'حي حطين', top: '58%', left: '46%', latOffset: 0.01, lngOffset: 0.02 },
    { name: 'حي الصحافة', top: '28%', left: '68%', latOffset: 0.07, lngOffset: 0.08 },
    { name: 'حي العقيق', top: '70%', left: '60%', latOffset: -0.03, lngOffset: 0.06 },
  ],
  'جدة': [
    { name: 'حي الشاطئ', top: '25%', left: '30%', latOffset: 0.05, lngOffset: -0.04 },
    { name: 'حي الحمراء', top: '45%', left: '50%', latOffset: 0.01, lngOffset: 0.01 },
    { name: 'حي الروضة', top: '65%', left: '40%', latOffset: -0.04, lngOffset: -0.02 },
    { name: 'حي المرجان', top: '30%', left: '70%', latOffset: 0.06, lngOffset: 0.05 },
  ],
  'الدمام': [
    { name: 'حي الشاطئ الشرقي', top: '30%', left: '40%', latOffset: 0.03, lngOffset: 0.02 },
    { name: 'حي الفيصلية', top: '55%', left: '60%', latOffset: -0.02, lngOffset: 0.04 },
    { name: 'حي الجلوية', top: '40%', left: '25%', latOffset: 0.01, lngOffset: -0.03 },
  ]
};

// Haversine formula to calculate distance in Kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export default function MapExplorerPage() {
  const halls = useMemo(() => {
    return getStoredHalls().filter((h: any) => h.status !== 'pending' && h.status !== 'بانتظار الموافقة' && h.status !== 'pending_approval' && h.adminStatus !== 'pending');
  }, []);

  // 1. Dynamic Unique Cities extracted from available stored halls
  const availableCities = useMemo(() => {
    const citiesSet = new Set<string>();
    halls.forEach((hall: any) => {
      const city = hall.city || hall.location || 'الرياض';
      if (city) citiesSet.add(city.trim());
    });
    return Array.from(citiesSet);
  }, [halls]);

  const [selectedCity, setSelectedCity] = useState<string>('الرياض');
  const [activeHallId, setActiveHallId] = useState<number | null>(1);

  // 2. Dynamic Min & Max Price Bounds calculation based on selected city
  const cityHalls = useMemo(() => {
    if (!selectedCity || selectedCity === 'الكل') return halls;
    return halls.filter((h: any) => (h.city || h.location) === selectedCity);
  }, [halls, selectedCity]);

  const { cityMinPrice, cityMaxPrice } = useMemo(() => {
    if (cityHalls.length === 0) return { cityMinPrice: 0, cityMaxPrice: 100000 };
    const prices = cityHalls.map((h: any) => Number(h.price || h.nightPrice || 0));
    const minP = Math.min(...prices);
    const maxP = Math.max(...prices);
    return {
      cityMinPrice: minP === Infinity ? 0 : minP,
      cityMaxPrice: maxP === -Infinity || maxP === 0 ? 100000 : maxP
    };
  }, [cityHalls]);

  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(100000);

  // Auto adjust maxPriceFilter when selectedCity or cityMaxPrice changes
  useEffect(() => {
    setMaxPriceFilter(cityMaxPrice);
  }, [cityMaxPrice, selectedCity]);

  // 3. GPS Geolocation State & Distance Slider
  const [gpsEnabled, setGpsEnabled] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationLoading, setLocationLoading] = useState<boolean>(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [maxDistanceKm, setMaxDistanceKm] = useState<number>(35);

  const requestGpsLocation = () => {
    if (!navigator.geolocation) {
      setLocationError('خاصية تحديد الموقع غير مدعومة في متصفحك');
      return;
    }

    setLocationLoading(true);
    setLocationError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(coords);
        setGpsEnabled(true);
        setLocationLoading(false);
      },
      (error) => {
        setLocationLoading(false);
        // Fallback simulation to Riyadh center if blocked in iframe preview
        const fallbackLocation = CITY_COORDINATES[selectedCity] || CITY_COORDINATES['الرياض'];
        setUserLocation(fallbackLocation);
        setGpsEnabled(true);
        setLocationError('تعذر جلب موقع GPS الدقيق تلقائياً. تم تفعيل الموقع التقريبي للرياض.');
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Google Maps API Key Detection
  const googleMapsApiKey = (import.meta as any).env?.VITE_GOOGLE_MAPS_API_KEY || (process as any).env?.GOOGLE_MAPS_API_KEY;

  // Enhance Halls with simulated GPS coordinates based on city/district
  const hallsWithCoordinates = useMemo(() => {
    return halls.map((hall: any, index: number) => {
      const city = hall.city || hall.location || 'الرياض';
      const cityBase = CITY_COORDINATES[city] || CITY_COORDINATES['الرياض'];
      const districtList = CITY_DISTRICTS[city] || CITY_DISTRICTS['الرياض'];
      const district = districtList[index % districtList.length];

      const lat = cityBase.lat + (district?.latOffset || (index * 0.015 - 0.03));
      const lng = cityBase.lng + (district?.lngOffset || (index * 0.02 - 0.02));
      const price = Number(hall.price || hall.nightPrice || 12000);

      let distance = 0;
      if (userLocation) {
        distance = calculateDistanceKm(userLocation.lat, userLocation.lng, lat, lng);
      }

      return {
        ...hall,
        city,
        districtName: district?.name || `حي ${hall.location || 'الروضة'}`,
        top: district?.top || `${20 + (index * 12) % 65}%`,
        left: district?.left || `${25 + (index * 15) % 60}%`,
        lat,
        lng,
        price,
        distance
      };
    });
  }, [halls, userLocation]);

  // 4. Final Filtered Halls considering City, Dynamic Price Slider, and Distance Slider
  const filteredHalls = useMemo(() => {
    return hallsWithCoordinates.filter((hall: any) => {
      const matchCity = !selectedCity || selectedCity === 'الكل' || hall.city === selectedCity;
      const matchPrice = hall.price <= maxPriceFilter;
      const matchDistance = !gpsEnabled || !userLocation || hall.distance <= maxDistanceKm;
      return matchCity && matchPrice && matchDistance;
    });
  }, [hallsWithCoordinates, selectedCity, maxPriceFilter, gpsEnabled, userLocation, maxDistanceKm]);

  const activeHall = useMemo(() => {
    return filteredHalls.find((h: any) => h.id === activeHallId) || filteredHalls[0] || hallsWithCoordinates[0];
  }, [filteredHalls, activeHallId, hallsWithCoordinates]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-8 flex flex-col space-y-6">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-amber-500/10 text-amber-800 border border-amber-500/20 px-3 py-1 rounded-full text-xs font-bold mb-2">
              <Compass className="w-4 h-4 text-amber-600" />
              <span>خريطة استكشاف الأماكن والقاعات التفاعلية المباشرة</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-blue-950">
              استكشف القاعات جغرافياً بالاسم والسعر والمسافة المباشرة
            </h1>
          </div>

          {/* Dynamic City Switcher (Extracted from registered halls) */}
          <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm text-xs font-bold">
            <button
              onClick={() => setSelectedCity('الكل')}
              className={`px-3.5 py-2 rounded-xl transition-all ${
                selectedCity === 'الكل'
                  ? 'bg-blue-950 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              جميع المدن ({halls.length})
            </button>
            {availableCities.map((city) => {
              const count = halls.filter((h: any) => (h.city || h.location) === city).length;
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 ${
                    selectedCity === city
                      ? 'bg-blue-950 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <span>{city}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    selectedCity === city ? 'bg-amber-500 text-blue-950 font-black' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GPS Location & Distance Control Banner */}
        <div className="bg-white p-4 md:p-5 rounded-3xl shadow-sm border border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={requestGpsLocation}
              disabled={locationLoading}
              className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-sm ${
                gpsEnabled 
                  ? 'bg-emerald-600 text-white hover:bg-emerald-700' 
                  : 'bg-blue-950 text-white hover:bg-blue-900'
              }`}
            >
              <Navigation className={`w-4 h-4 ${locationLoading ? 'animate-spin' : ''}`} />
              <span>{gpsEnabled ? 'تم تفعيل موقع GPS النشط' : 'تفعيل موقعي الجغرافي (GPS)'}</span>
            </button>

            {gpsEnabled && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                تحديد القاعات القريبة منك
              </span>
            )}
          </div>

          {/* Distance Slider (Active when GPS enabled) */}
          {gpsEnabled && (
            <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <Crosshair className="w-4 h-4 text-amber-500" />
              <div className="flex items-center gap-2 text-xs">
                <span className="font-bold text-slate-700">نطاق المسافة:</span>
                <span className="font-mono font-black text-amber-600">{maxDistanceKm} كم</span>
              </div>
              <input
                type="range"
                min="5"
                max="80"
                step="5"
                value={maxDistanceKm}
                onChange={(e) => setMaxDistanceKm(Number(e.target.value))}
                className="w-32 accent-amber-500 cursor-pointer"
              />
            </div>
          )}

          {locationError && (
            <div className="w-full text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{locationError}</span>
            </div>
          )}
        </div>

        {/* Map Layout Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Interactive Visual Map View (7 Cols) */}
          <div className="lg:col-span-7 bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl relative min-h-[540px] flex flex-col">
            {/* Map Top Dynamic Overlay Filter Bar */}
            <div className="absolute top-4 right-4 left-4 z-20 flex flex-wrap gap-3 items-center justify-between bg-blue-950/90 backdrop-blur-md p-3.5 rounded-2xl border border-white/10 text-white text-xs">
              {/* Dynamic Price Slider Bound based on City */}
              <div className="flex items-center gap-3 flex-grow max-w-xs">
                <Sliders className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="space-y-0.5 w-full">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span>النطاق السعري لـ {selectedCity}:</span>
                    <span className="text-amber-400 font-mono font-black">{maxPriceFilter.toLocaleString()} ر.س</span>
                  </div>
                  <input
                    type="range"
                    min={cityMinPrice}
                    max={cityMaxPrice}
                    step={1000}
                    value={maxPriceFilter}
                    onChange={(e) => setMaxPriceFilter(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] text-slate-400 font-mono">
                    <span>أدنى: {cityMinPrice.toLocaleString()}</span>
                    <span>أعلى: {cityMaxPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] text-slate-300 font-bold bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                  معروض: {filteredHalls.length} من {halls.length} مكان
                </span>
              </div>
            </div>

            {/* Map Rendering Container (Google Maps or GIS Canvas Fallback) */}
            {googleMapsApiKey ? (
              <div className="w-full h-[540px] relative">
                <iframe
                  title="Google Maps Interactive View"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/place?key=${googleMapsApiKey}&q=${encodeURIComponent(selectedCity + ' السعودية')}`}
                ></iframe>
              </div>
            ) : (
              /* High-End GIS Custom Vector Map Canvas */
              <div className="relative w-full h-[540px] bg-[#111827] overflow-hidden flex items-center justify-center p-4">
                {/* Decorative Grid Lines */}
                <div className="absolute inset-0 opacity-20 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:28px_28px]"></div>

                {/* Simulated Road Networks */}
                <svg className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0,120 Q300,150 600,350 T1200,550" stroke="#f59e0b" strokeWidth="4" fill="none" strokeDasharray="8 4" />
                  <path d="M120,0 Q280,220 420,620" stroke="#3b82f6" strokeWidth="3" fill="none" />
                  <path d="M600,0 C450,320 220,420 0,550" stroke="#10b981" strokeWidth="2" fill="none" />
                </svg>

                {/* District Label Markers */}
                {(CITY_DISTRICTS[selectedCity] || CITY_DISTRICTS['الرياض']).map((dist, idx) => (
                  <div
                    key={idx}
                    style={{ top: dist.top, left: dist.left }}
                    className="absolute text-[10px] font-black text-slate-400/50 tracking-wider pointer-events-none select-none uppercase bg-slate-900/60 px-2 py-0.5 rounded-md border border-white/5"
                  >
                    {dist.name}
                  </div>
                ))}

                {/* Rich Price Map Pins (Showing Hall Name + Price + Location) */}
                {filteredHalls.map((hall: any, index: number) => {
                  const isActive = hall.id === activeHall?.id;

                  return (
                    <button
                      key={hall.id}
                      onClick={() => setActiveHallId(hall.id)}
                      style={{ top: hall.top, left: hall.left }}
                      className={`absolute z-10 transition-all duration-300 group flex items-center gap-2 px-3 py-1.5 rounded-2xl shadow-2xl border ${
                        isActive
                          ? 'bg-amber-500 text-blue-950 border-white scale-110 z-30 ring-4 ring-amber-500/40 font-black'
                          : 'bg-blue-950/95 text-white border-amber-500/40 hover:scale-105 hover:bg-amber-500 hover:text-blue-950'
                      }`}
                    >
                      <MapPin className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-950' : 'text-amber-400'}`} />
                      <div className="text-right flex flex-col items-start leading-tight">
                        <span className="text-[11px] font-extrabold line-clamp-1">
                          {hall.name}
                        </span>
                        <div className="flex items-center gap-1 text-[9px] opacity-90 font-mono">
                          <span className="font-black text-amber-300 group-hover:text-blue-950">
                            {hall.price.toLocaleString()} ر.س
                          </span>
                          {gpsEnabled && hall.distance > 0 && (
                            <span className="opacity-75">({hall.distance} كم)</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Hall Details Panel (5 Cols) */}
          <div className="lg:col-span-5 space-y-4">
            {activeHall ? (
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-5 animate-in fade-in duration-300">
                <div className="relative rounded-2xl overflow-hidden h-56">
                  <img
                    src={activeHall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'}
                    alt={activeHall.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3 bg-blue-950/80 text-white backdrop-blur-md px-3 py-1 rounded-xl text-xs font-bold border border-white/20">
                    💎 شريك ماسي معتمد
                  </div>
                  {gpsEnabled && activeHall.distance > 0 && (
                    <div className="absolute bottom-3 right-3 bg-amber-500 text-blue-950 font-black text-xs px-3 py-1 rounded-xl shadow-lg flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5" />
                      على مسافة {activeHall.distance} كم من موقعك
                    </div>
                  )}
                </div>

                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-extrabold text-blue-950">{activeHall.name}</h2>
                    <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {activeHall.rating || 4.9}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <MapPin className="w-3.5 h-3.5 text-amber-500" />
                    <span>{activeHall.districtName || activeHall.location} - {activeHall.city} • السعة: {activeHall.capacity || 300} شخص</span>
                  </p>

                  <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 mb-4">
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">السعر للفترة المسائية</span>
                      <span className="text-sm font-black text-blue-950 font-mono">
                        {activeHall.price.toLocaleString()} ر.س
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-bold block">العربون المطلوب</span>
                      <span className="text-sm font-black text-emerald-600 font-mono">20% فقط</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed mb-6 line-clamp-3">
                    {activeHall.description || 'تتميز هذه القاعة بتجهيزات فاخرة وديكورات عصرية تتناسب مع كافة الحفلات والمناسبات الملكية.'}
                  </p>
                </div>

                <div className="flex gap-3 pt-2 border-t border-slate-100">
                  <Link
                    to={`/hall/${activeHall.id}`}
                    className="flex-grow bg-blue-950 hover:bg-blue-900 text-white font-extrabold text-xs py-3 rounded-2xl text-center transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    <Eye className="w-4 h-4" />
                    <span>تفاصيل القاعة والحجز المباشر</span>
                  </Link>
                  <Link
                    to={`/provider-profile/${encodeURIComponent(activeHall.provider || 'الشريك المعتمد')}`}
                    className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs px-4 py-3 rounded-2xl transition-all shrink-0"
                  >
                    ملف الشريك
                  </Link>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-8 text-center text-slate-400">
                اختر قاعة من الخريطة لاستعراض تفاصيلها
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

