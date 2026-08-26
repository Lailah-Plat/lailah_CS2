import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MapPin, ArrowLeft, Sparkles, Globe, 
  ChevronLeft, ChevronRight, Building2, Map as MapIcon, ArrowRight
} from 'lucide-react';
import { 
  SAUDI_GEO_ZONES, 
  SAUDI_13_ADMIN_REGIONS, 
  GeoZoneDefinition, 
  SaudiAdminRegion 
} from '../../data/homeMetroData';
import { Hall } from '../../data/mockData';

interface HomeMetroRegionGridProps {
  hallsList: Hall[];
  regionsList?: any[];
  drillLevel: 'zones' | 'regions' | 'cities';
  setDrillLevel: (level: 'zones' | 'regions' | 'cities') => void;
  selectedGeoZoneId: string;
  setSelectedGeoZoneId: (id: string) => void;
  selectedAdminRegionId: string;
  setSelectedAdminRegionId: (id: string) => void;
  metroPageIndex: number;
  setMetroPageIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const HomeMetroRegionGrid: React.FC<HomeMetroRegionGridProps> = ({
  hallsList = [],
  regionsList = [],
  drillLevel,
  setDrillLevel,
  selectedGeoZoneId,
  setSelectedGeoZoneId,
  selectedAdminRegionId,
  setSelectedAdminRegionId,
  metroPageIndex,
  setMetroPageIndex,
}) => {
  const navigate = useNavigate();

  // Dynamic lookup map from cloud settings / dynamic regions list (matches by clean name)
  const dynamicRegionsMap = useMemo(() => {
    const map = new Map<string, { image?: string; cities?: string[]; name?: string }>();
    if (Array.isArray(regionsList)) {
      regionsList.forEach((r: any) => {
        if (r && r.name) {
          const cleanName = r.name.replace(/^منطقة\s+/, '').trim();
          map.set(cleanName, r);
          map.set(r.name.trim(), r);
        }
      });
    }
    return map;
  }, [regionsList]);

  // Merge static metadata with dynamic images & cities from database settings
  const dynamicAdminRegions: SaudiAdminRegion[] = useMemo(() => {
    return SAUDI_13_ADMIN_REGIONS.map(reg => {
      const cleanRegName = reg.name.replace(/^منطقة\s+/, '').trim();
      const dynamicMatch = dynamicRegionsMap.get(cleanRegName) || dynamicRegionsMap.get(reg.name.trim()) || dynamicRegionsMap.get(reg.query.trim());
      
      const effectiveImage = dynamicMatch?.image || reg.image;
      
      // Dynamic cities if configured in settings
      let effectiveCities = reg.cities;
      if (dynamicMatch?.cities && Array.isArray(dynamicMatch.cities) && dynamicMatch.cities.length > 0) {
        // If settings have custom cities, maintain existing imagery or fallback gracefully
        const existingCityMap = new Map(reg.cities.map(c => [c.name.trim(), c]));
        effectiveCities = dynamicMatch.cities.map((cityName: string, idx: number) => {
          const trimmedCity = cityName.trim();
          const existing = existingCityMap.get(trimmedCity);
          return {
            name: trimmedCity,
            subtitle: existing?.subtitle || `قاعات ومناسبات ${trimmedCity} المعتمدة`,
            image: existing?.image || effectiveImage
          };
        });
      }

      return {
        ...reg,
        image: effectiveImage,
        cities: effectiveCities
      };
    });
  }, [dynamicRegionsMap]);

  // Dynamic Geographic Zones with updated images from the primary region of that zone
  const dynamicGeoZones: GeoZoneDefinition[] = useMemo(() => {
    return SAUDI_GEO_ZONES.map(zone => {
      // Find the hero / primary admin region for this zone to reflect any custom image set in Settings
      const primaryAdminRegion = dynamicAdminRegions.find(ar => zone.adminRegionIds.includes(ar.id));
      const zoneImage = primaryAdminRegion?.image || zone.image;
      return {
        ...zone,
        image: zoneImage
      };
    });
  }, [dynamicAdminRegions]);

  // Helper to calculate dynamic halls count from DB
  const getDynamicZoneHallCount = (zone: GeoZoneDefinition): number => {
    if (!hallsList || hallsList.length === 0) return 0;
    const matching = hallsList.filter((h: any) => {
      const isApproved = h.status === 'approved' && h.activationStatus !== 'موقوف';
      if (!isApproved) return false;

      const cityClean = (h.city || '').trim();
      if (cityClean && zone.citiesList.some(c => cityClean.includes(c) || c.includes(cityClean))) {
        return true;
      }

      const regionClean = (h.region || '').replace(/^منطقة\s+/, '').trim();
      const zoneAdminRegions = dynamicAdminRegions.filter(ar => zone.adminRegionIds.includes(ar.id));
      if (regionClean && zoneAdminRegions.some(ar => ar.name.includes(regionClean) || ar.query.includes(regionClean) || regionClean.includes(ar.query))) {
        return true;
      }

      return false;
    });

    return matching.length;
  };

  const getDynamicRegionHallCount = (region: SaudiAdminRegion): number => {
    if (!hallsList || hallsList.length === 0) return 0;
    const cleanRegQuery = region.query.trim();
    const cleanRegName = region.name.replace(/^منطقة\s+/, '').trim();

    const matching = hallsList.filter((h: any) => {
      const isApproved = h.status === 'approved' && h.activationStatus !== 'موقوف';
      if (!isApproved) return false;

      const hRegion = (h.region || '').replace(/^منطقة\s+/, '').trim();
      if (hRegion && (hRegion.includes(cleanRegQuery) || cleanRegQuery.includes(hRegion) || hRegion.includes(cleanRegName))) {
        return true;
      }

      const hCity = (h.city || '').trim();
      if (hCity && region.cities.some(c => hCity.includes(c.name) || c.name.includes(hCity))) {
        return true;
      }

      return false;
    });

    return matching.length;
  };

  const getDynamicCityHallCount = (cityName: string, regionName: string): number => {
    if (!hallsList || hallsList.length === 0) return 0;
    const cleanCity = cityName.replace(/^(مدينة|محافظة)\s+/, '').trim();
    const cleanRegion = regionName.replace(/^(منطقة)\s+/, '').trim();

    const matching = hallsList.filter((h: any) => {
      const isApproved = h.status === 'approved' && h.activationStatus !== 'موقوف';
      if (!isApproved) return false;

      const hCity = (h.city || '').replace(/^(مدينة|محافظة)\s+/, '').trim();
      if (hCity && (hCity.includes(cleanCity) || cleanCity.includes(hCity))) {
        return true;
      }

      if (!hCity && cleanRegion) {
        const hRegion = (h.region || '').replace(/^(منطقة)\s+/, '').trim();
        return hRegion.includes(cleanRegion) || cleanRegion.includes(hRegion);
      }

      return false;
    });

    return matching.length;
  };

  // 1. Current Selected Geographic Zone object
  const currentGeoZone = useMemo(() => {
    if (!selectedGeoZoneId) return undefined;
    return dynamicGeoZones.find(z => z.id === selectedGeoZoneId);
  }, [selectedGeoZoneId, dynamicGeoZones]);

  // 2. Current Selected Administrative Region object
  const currentAdminRegion = useMemo(() => {
    if (!selectedAdminRegionId) return undefined;
    return dynamicAdminRegions.find(r => r.id === selectedAdminRegionId || r.query === selectedAdminRegionId);
  }, [selectedAdminRegionId, dynamicAdminRegions]);

  // Actions
  const handleZoneClick = (zoneId: 'central' | 'western' | 'southern' | 'eastern' | 'northern') => {
    setSelectedGeoZoneId(zoneId);
    setDrillLevel('regions');
    setMetroPageIndex(0);
  };

  const handleAdminRegionClick = (regionId: string) => {
    setSelectedAdminRegionId(regionId);
    setDrillLevel('cities');
    setMetroPageIndex(0);
  };

  const handleCityClick = (cityName: string, regionName: string) => {
    const cleanCity = cityName.replace(/^(مدينة|محافظة)\s+/, '').trim();
    const cleanRegion = regionName.replace(/^منطقة\s+/, '').trim();
    navigate(`/explore?region=${encodeURIComponent(cleanRegion)}&city=${encodeURIComponent(cleanCity)}`);
  };

  const handleResetToZones = () => {
    setDrillLevel('zones');
    setSelectedGeoZoneId('');
    setSelectedAdminRegionId('');
    setMetroPageIndex(0);
  };

  const handleBackToRegions = () => {
    setDrillLevel('regions');
    setSelectedAdminRegionId('');
    setMetroPageIndex(0);
  };

  // 5 Geographic Zones
  const centralZone = dynamicGeoZones.find(z => z.id === 'central') || dynamicGeoZones[0];
  const westernZone = dynamicGeoZones.find(z => z.id === 'western') || dynamicGeoZones[1];
  const southernZone = dynamicGeoZones.find(z => z.id === 'southern') || dynamicGeoZones[2];
  const easternZone = dynamicGeoZones.find(z => z.id === 'eastern') || dynamicGeoZones[3];
  const northernZone = dynamicGeoZones.find(z => z.id === 'northern') || dynamicGeoZones[4];

  // LEVEL 2: ADMIN REGIONS OF SELECTED ZONE (OR ALL)
  const activeAdminRegions = useMemo(() => {
    if (currentGeoZone) {
      return dynamicAdminRegions.filter(r => currentGeoZone.adminRegionIds.includes(r.id));
    }
    return dynamicAdminRegions;
  }, [currentGeoZone, dynamicAdminRegions]);

  // LEVEL 3: CITIES OF SELECTED ADMIN REGION
  const activeCities = useMemo(() => {
    if (!currentAdminRegion) return [];
    return currentAdminRegion.cities;
  }, [currentAdminRegion]);

  // Paging for Level 3 (Cities) if there are many
  const CITIES_PER_PAGE = 5; // 1 Hero + 4 medium tiles
  const totalCityPages = Math.max(1, Math.ceil(activeCities.length / CITIES_PER_PAGE));
  const currentCitiesSlice = useMemo(() => {
    const start = metroPageIndex * CITIES_PER_PAGE;
    return activeCities.slice(start, start + CITIES_PER_PAGE);
  }, [activeCities, metroPageIndex]);

  return (
    <section 
      className="w-full bg-white dark:bg-slate-950 pt-8 pb-14 transition-colors"
      id="metro-regions-section"
    >
      {/* 1. Header Bar: Aligned within readable container */}
      <div className="w-full px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto mb-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          
          {/* Title */}
          <div className="flex items-center gap-2.5 order-1 sm:order-2">
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
              <span>اكتشف القاعات حسب منطقتك</span>
              <Sparkles className="w-7 h-7 text-amber-500 shrink-0" />
            </h2>
          </div>

          {/* Map Exploration Button */}
          <button
            onClick={() => navigate('/explore?view=map')}
            className="order-2 sm:order-1 px-5 py-2.5 rounded-xl bg-[#0b1329] hover:bg-[#131f3f] text-white text-xs sm:text-sm font-black border border-slate-700/80 shadow-md flex items-center gap-2 transition-all duration-300 hover:scale-[1.02] cursor-pointer"
          >
            <MapPin className="w-4 h-4 text-amber-400" />
            <span>استكشاف خريطة القاعات</span>
          </button>
        </div>
      </div>

      {/* 2. Sub-Header Bar: Breadcrumb / Filter Pill Container */}
      <div className="w-full px-4 sm:px-8 lg:px-12 max-w-[1720px] mx-auto mb-5">
        <div className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-2.5 shadow-xs flex items-center justify-between gap-3">
          
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 flex-wrap text-xs sm:text-sm">
            <button
              onClick={handleResetToZones}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 font-black transition-all cursor-pointer ${
                drillLevel === 'zones'
                  ? 'bg-[#0b1329] text-white shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4 text-amber-400" />
              <span>المناطق الجغرافية بالمملكة</span>
            </button>

            {drillLevel !== 'zones' && currentGeoZone && (
              <>
                <span className="text-slate-400 dark:text-slate-600 font-bold">/</span>
                <button
                  onClick={handleBackToRegions}
                  className={`px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 font-bold transition-all cursor-pointer ${
                    drillLevel === 'regions'
                      ? 'bg-[#0b1329] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-400" />
                  <span>{currentGeoZone.name}</span>
                </button>
              </>
            )}

            {drillLevel === 'cities' && currentAdminRegion && (
              <>
                <span className="text-slate-400 dark:text-slate-600 font-bold">/</span>
                <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-800 dark:text-amber-300 font-black flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>{currentAdminRegion.name}</span>
                </div>
              </>
            )}
          </div>

          {/* Controls: Quick Back & Pagination (if cities level) */}
          <div className="flex items-center gap-2">
            {drillLevel === 'cities' && totalCityPages > 1 && (
              <div className="flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
                <button
                  onClick={() => setMetroPageIndex(p => Math.max(0, p - 1))}
                  disabled={metroPageIndex === 0}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  title="الصفحة السابقة"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs font-black px-2 text-slate-700 dark:text-slate-300">
                  {metroPageIndex + 1} / {totalCityPages}
                </span>
                <button
                  onClick={() => setMetroPageIndex(p => Math.min(totalCityPages - 1, p + 1))}
                  disabled={metroPageIndex >= totalCityPages - 1}
                  className="p-1.5 rounded-lg hover:bg-white dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 disabled:opacity-30 disabled:pointer-events-none transition-all"
                  title="الصفحة التالية"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            )}

            {drillLevel !== 'zones' && (
              <button
                onClick={drillLevel === 'cities' ? handleBackToRegions : handleResetToZones}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />
                <span>{drillLevel === 'cities' ? 'رجوع للمناطق' : 'رجوع لكافة المناطق'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. FULL-BLEED EDGE-TO-EDGE METRO GRID (Extends from edge to edge like Hero) */}
      <div className="w-full px-2 sm:px-4 md:px-6">
        
        {/* =========================================================================
            LEVEL 1: GEOGRAPHIC ZONES VIEW (FULL-BLEED 480px METRO)
            - Right Column: Hero Card (المنطقة الوسطى)
            - Middle Column: 2 Cards (الغربية + الجنوبية)
            - Left Column: 2 Cards (الشرقية + الشمالية)
           ========================================================================= */}
        {drillLevel === 'zones' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 h-auto md:h-[480px] w-full">
            
            {/* 1. RIGHT HERO COLUMN: المنطقة الوسطى (md:col-span-5) */}
            <div 
              onClick={() => handleZoneClick('central')}
              className="md:col-span-5 h-[360px] md:h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300"
            >
              <img
                src={centralZone.image}
                alt={centralZone.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:via-black/45 transition-colors duration-300" />

              <div className="absolute top-6 right-6 left-6 z-10 text-right">
                <div className="flex items-center gap-2 justify-start mb-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0 shadow-xs" />
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-md">
                    {centralZone.name}
                  </h3>
                  <MapPin className="w-6 h-6 text-amber-400 shrink-0" />
                </div>
                <p className="text-slate-200 text-xs sm:text-sm font-medium drop-shadow-sm mt-1">
                  {centralZone.subtitle}
                </p>

                <div className="mt-4 text-right">
                  <div className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                    {getDynamicZoneHallCount(centralZone) || 312}
                  </div>
                  <div className="text-xs text-slate-300 font-medium mt-0.5">
                    قاعة موزعة بالمناطق
                  </div>
                </div>
              </div>

              <div className="absolute bottom-5 right-5 z-10">
                <button className="px-4 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/20 flex items-center gap-2 transition-all duration-300 group-hover:border-amber-400/80">
                  <ArrowLeft className="w-4 h-4 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                  <span>استعراض المناطق الإدارية</span>
                </button>
              </div>
            </div>

            {/* 2. MIDDLE COLUMN: Top = المنطقة الغربية (240px), Bottom = المنطقة الجنوبية (240px) (md:col-span-4) */}
            <div className="md:col-span-4 grid grid-rows-2 gap-2.5 h-[480px]">
              
              {/* Middle-Top: المنطقة الغربية */}
              <div 
                onClick={() => handleZoneClick('western')}
                className="h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 min-h-0"
              >
                <img
                  src={westernZone.image}
                  alt={westernZone.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:via-black/45 transition-colors duration-300" />

                <div className="absolute top-4 right-5 left-5 z-10 text-right">
                  <div className="flex items-center gap-2 justify-start mb-0.5">
                    <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {westernZone.name}
                    </h3>
                    <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>
                  <p className="text-slate-200 text-[11px] sm:text-xs font-medium drop-shadow-sm line-clamp-1">
                    {westernZone.subtitle}
                  </p>

                  <div className="mt-2 text-right">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                      {getDynamicZoneHallCount(westernZone) || 286}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      قاعة موزعة بالمناطق
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <button className="px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all duration-300 group-hover:border-amber-400/80">
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                    <span>استعراض المناطق الإدارية</span>
                  </button>
                </div>
              </div>

              {/* Middle-Bottom: المنطقة الجنوبية */}
              <div 
                onClick={() => handleZoneClick('southern')}
                className="h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 min-h-0"
              >
                <img
                  src={southernZone.image}
                  alt={southernZone.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:via-black/45 transition-colors duration-300" />

                <div className="absolute top-4 right-5 left-5 z-10 text-right">
                  <div className="flex items-center gap-2 justify-start mb-0.5">
                    <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {southernZone.name}
                    </h3>
                    <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>
                  <p className="text-slate-200 text-[11px] sm:text-xs font-medium drop-shadow-sm line-clamp-1">
                    {southernZone.subtitle}
                  </p>

                  <div className="mt-2 text-right">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                      {getDynamicZoneHallCount(southernZone) || 164}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      قاعة موزعة بالمناطق
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <button className="px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all duration-300 group-hover:border-amber-400/80">
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                    <span>استعراض المناطق الإدارية</span>
                  </button>
                </div>
              </div>
            </div>

            {/* 3. LEFT COLUMN: Top = المنطقة الشرقية (240px), Bottom = المنطقة الشمالية (240px) (md:col-span-3) */}
            <div className="md:col-span-3 grid grid-rows-2 gap-2.5 h-[480px]">
              
              {/* Left-Top: المنطقة الشرقية */}
              <div 
                onClick={() => handleZoneClick('eastern')}
                className="h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 min-h-0"
              >
                <img
                  src={easternZone.image}
                  alt={easternZone.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:via-black/45 transition-colors duration-300" />

                <div className="absolute top-4 right-5 left-5 z-10 text-right">
                  <div className="flex items-center gap-2 justify-start mb-0.5">
                    <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {easternZone.name}
                    </h3>
                    <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>
                  <p className="text-slate-200 text-[11px] sm:text-xs font-medium drop-shadow-sm line-clamp-1">
                    {easternZone.subtitle}
                  </p>

                  <div className="mt-2 text-right">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                      {getDynamicZoneHallCount(easternZone) || 198}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      قاعة موزعة بالمناطق
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <button className="px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all duration-300 group-hover:border-amber-400/80">
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                    <span>استعراض المناطق الإدارية</span>
                  </button>
                </div>
              </div>

              {/* Left-Bottom: المنطقة الشمالية */}
              <div 
                onClick={() => handleZoneClick('northern')}
                className="h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 min-h-0"
              >
                <img
                  src={northernZone.image}
                  alt={northernZone.name}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/35 to-black/10 group-hover:via-black/45 transition-colors duration-300" />

                <div className="absolute top-4 right-5 left-5 z-10 text-right">
                  <div className="flex items-center gap-2 justify-start mb-0.5">
                    <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md">
                      {northernZone.name}
                    </h3>
                    <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                  </div>
                  <p className="text-slate-200 text-[11px] sm:text-xs font-medium drop-shadow-sm line-clamp-1">
                    {northernZone.subtitle}
                  </p>

                  <div className="mt-2 text-right">
                    <div className="text-3xl sm:text-4xl font-black text-white tracking-tight drop-shadow-md">
                      {getDynamicZoneHallCount(northernZone) || 142}
                    </div>
                    <div className="text-[11px] text-slate-300 font-medium">
                      قاعة موزعة بالمناطق
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 right-4 z-10">
                  <button className="px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all duration-300 group-hover:border-amber-400/80">
                    <ArrowLeft className="w-3.5 h-3.5 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                    <span>استعراض المناطق الإدارية</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            LEVEL 2: ADMINISTRATIVE REGIONS VIEW (DYNAMIC METRO BENTO GRID)
            - Adapts layout based on region count (Panoramic Lead + Responsive Tiles)
           ========================================================================= */}
        {drillLevel === 'regions' && (
          <div className="w-full">
            {activeAdminRegions.length <= 4 ? (
              // 2 to 4 regions: Panoramic + Grid
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 h-auto md:h-[480px] w-full">
                {/* Main Hero Region (Right Column, 50% width) */}
                {activeAdminRegions[0] && (
                  <div
                    onClick={() => handleAdminRegionClick(activeAdminRegions[0].id)}
                    className={`h-[320px] md:h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 ${
                      activeAdminRegions.length === 1 ? 'md:col-span-12' : 'md:col-span-6'
                    }`}
                  >
                    <img
                      src={activeAdminRegions[0].image}
                      alt={activeAdminRegions[0].name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 group-hover:via-black/50 transition-colors duration-300" />

                    <div className="absolute top-6 right-6 left-6 z-10 text-right">
                      <div className="flex items-center gap-2 justify-start mb-1">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                        <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-md">
                          {activeAdminRegions[0].name}
                        </h3>
                        <MapPin className="w-6 h-6 text-amber-400 shrink-0" />
                      </div>
                      <p className="text-slate-200 text-xs sm:text-sm font-medium drop-shadow-sm line-clamp-2">
                        {activeAdminRegions[0].subtitle}
                      </p>
                      <div className="mt-4 text-right">
                        <div className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                          {getDynamicRegionHallCount(activeAdminRegions[0]) || 45}
                        </div>
                        <div className="text-xs text-slate-300 font-medium">
                          قاعة معتمدة بالمنطقة
                        </div>
                      </div>
                    </div>

                    <div className="absolute bottom-5 right-5 z-10">
                      <button className="px-4 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/20 flex items-center gap-2 transition-all duration-300 group-hover:border-amber-400/80">
                        <ArrowLeft className="w-4 h-4 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                        <span>استعراض المدن والمحافظات</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Sub Regions (Left Column, stacked tiles) */}
                {activeAdminRegions.length > 1 && (
                  <div className={`md:col-span-6 grid gap-2.5 h-[480px] ${
                    activeAdminRegions.length === 2 ? 'grid-rows-1' :
                    activeAdminRegions.length === 3 ? 'grid-rows-2' :
                    'grid-cols-2 grid-rows-2'
                  }`}>
                    {activeAdminRegions.slice(1).map((region) => {
                      const regCount = getDynamicRegionHallCount(region);
                      return (
                        <div
                          key={region.id}
                          onClick={() => handleAdminRegionClick(region.id)}
                          className="h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 min-h-0"
                        >
                          <img
                            src={region.image}
                            alt={region.name}
                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 group-hover:via-black/50 transition-colors duration-300" />

                          <div className="absolute top-4 right-5 left-5 z-10 text-right">
                            <div className="flex items-center gap-2 justify-start mb-0.5">
                              <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                                {region.name}
                              </h3>
                              <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                            </div>
                            <p className="text-slate-200 text-[11px] font-medium drop-shadow-sm line-clamp-1">
                              {region.subtitle}
                            </p>
                            <div className="mt-2 text-right">
                              <div className="text-2xl sm:text-3xl font-black text-white tracking-tight drop-shadow-md">
                                {regCount || 20}
                              </div>
                              <div className="text-[10px] text-slate-300 font-medium">
                                قاعة معتمدة بالمنطقة
                              </div>
                            </div>
                          </div>

                          <div className="absolute bottom-3 right-3 z-10">
                            <button className="px-3 py-1 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 transition-all duration-300 group-hover:border-amber-400/80">
                              <ArrowLeft className="w-3 h-3 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                              <span>استعراض المدن</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              // More than 4 regions: Symmetric Full-Bleed 480px Grid
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 min-h-[480px]">
                {activeAdminRegions.map((region) => {
                  const regCount = getDynamicRegionHallCount(region);
                  return (
                    <div
                      key={region.id}
                      onClick={() => handleAdminRegionClick(region.id)}
                      className="h-[235px] relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300"
                    >
                      <img
                        src={region.image}
                        alt={region.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 group-hover:via-black/50 transition-colors duration-300" />

                      <div className="absolute top-4 right-5 left-5 z-10 text-right">
                        <div className="flex items-center gap-2 justify-start mb-1">
                          <h3 className="text-xl font-black text-white drop-shadow-md">
                            {region.name}
                          </h3>
                          <MapPin className="w-5 h-5 text-amber-400 shrink-0" />
                        </div>
                        <p className="text-slate-200 text-xs font-medium drop-shadow-sm line-clamp-1">
                          {region.subtitle}
                        </p>
                        <div className="mt-2 text-right">
                          <div className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                            {regCount || 24}
                          </div>
                          <div className="text-[11px] text-slate-300 font-medium">
                            قاعة معتمدة بالمنطقة
                          </div>
                        </div>
                      </div>

                      <div className="absolute bottom-4 right-4 z-10">
                        <button className="px-3.5 py-1.5 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all duration-300 group-hover:border-amber-400/80">
                          <ArrowLeft className="w-3.5 h-3.5 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                          <span>استعراض المدن والمحافظات</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            LEVEL 3: CITIES & GOVERNORATES VIEW (DYNAMIC SHAPES & SIZES)
            - 1 Large Hero City Tile (Capital / Major City) + 4 Balanced Tiles
            - Page index alters layout orientation (Page 1 = Hero on Right, Page 2 = Hero on Left)
           ========================================================================= */}
        {drillLevel === 'cities' && currentAdminRegion && (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 h-auto md:h-[480px] w-full">
              
              {/* Layout variation based on Page Index:
                  Page 0 (Odd): Hero Right (md:col-span-5) + 4 Tiles on Left (md:col-span-7)
                  Page 1 (Even): 4 Tiles on Right (md:col-span-7) + Hero Left (md:col-span-5)
              */}
              
              {/* PRIMARY HERO CITY TILE (currentCitiesSlice[0]) */}
              {currentCitiesSlice[0] && (
                <div
                  onClick={() => handleCityClick(currentCitiesSlice[0].name, currentAdminRegion.name)}
                  className={`h-[340px] md:h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 ${
                    currentCitiesSlice.length === 1 
                      ? 'md:col-span-12' 
                      : (metroPageIndex % 2 === 0 ? 'md:col-span-5 order-1 md:order-1' : 'md:col-span-5 order-1 md:order-2')
                  }`}
                >
                  <img
                    src={currentCitiesSlice[0].image}
                    alt={currentCitiesSlice[0].name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 group-hover:via-black/50 transition-colors duration-300" />

                  <div className="absolute top-6 right-6 left-6 z-10 text-right">
                    <div className="flex items-center gap-2 justify-start mb-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shrink-0" />
                      <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-md">
                        {currentCitiesSlice[0].name.startsWith('مدينة') || currentCitiesSlice[0].name.startsWith('محافظة')
                          ? currentCitiesSlice[0].name 
                          : `مدينة ${currentCitiesSlice[0].name}`}
                      </h3>
                      <MapPin className="w-6 h-6 text-amber-400 shrink-0" />
                    </div>
                    <p className="text-slate-200 text-xs sm:text-sm font-medium drop-shadow-sm mt-1">
                      {currentCitiesSlice[0].subtitle}
                    </p>

                    <div className="mt-4 text-right">
                      <div className="text-4xl sm:text-5xl font-black text-white tracking-tight drop-shadow-md">
                        {getDynamicCityHallCount(currentCitiesSlice[0].name, currentAdminRegion.name) || 18}
                      </div>
                      <div className="text-xs text-slate-300 font-medium">
                        قاعة ومكان متاح
                      </div>
                    </div>
                  </div>

                  <div className="absolute bottom-5 right-5 z-10">
                    <button className="px-4 py-2 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-xs sm:text-sm font-bold border border-white/20 flex items-center gap-2 transition-all duration-300 group-hover:border-amber-400/80">
                      <ArrowLeft className="w-4 h-4 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                      <span>استعراض قاعات المدينة</span>
                    </button>
                  </div>
                </div>
              )}

              {/* SECONDARY TILES (currentCitiesSlice[1..4]) - 2x2 Grid of 240px Tiles */}
              {currentCitiesSlice.length > 1 && (
                <div className={`md:col-span-7 grid grid-cols-1 sm:grid-cols-2 grid-rows-2 gap-2.5 h-[480px] ${
                  metroPageIndex % 2 === 0 ? 'order-2 md:order-2' : 'order-2 md:order-1'
                }`}>
                  {currentCitiesSlice.slice(1, 5).map((city, idx) => {
                    const cityCount = getDynamicCityHallCount(city.name, currentAdminRegion.name);
                    return (
                      <div
                        key={idx}
                        onClick={() => handleCityClick(city.name, currentAdminRegion.name)}
                        className="h-full relative overflow-hidden group cursor-pointer border border-slate-300/40 dark:border-slate-800 shadow-sm transition-all duration-300 min-h-0"
                      >
                        <img
                          src={city.image}
                          alt={city.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/15 group-hover:via-black/50 transition-colors duration-300" />

                        <div className="absolute top-4 right-5 left-5 z-10 text-right">
                          <div className="flex items-center gap-2 justify-start mb-0.5">
                            <h3 className="text-lg sm:text-xl font-black text-white drop-shadow-md">
                              {city.name.startsWith('مدينة') || city.name.startsWith('محافظة')
                                ? city.name 
                                : `مدينة ${city.name}`}
                            </h3>
                            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
                          </div>
                          <p className="text-slate-200 text-[11px] font-medium drop-shadow-sm line-clamp-1">
                            {city.subtitle}
                          </p>
                          <div className="mt-2 text-right">
                            <div className="text-2xl font-black text-white tracking-tight drop-shadow-md">
                              {cityCount || 8}
                            </div>
                            <div className="text-[10px] text-slate-300 font-medium">
                              قاعة ومكان متاح
                            </div>
                          </div>
                        </div>

                        <div className="absolute bottom-3 right-3 z-10">
                          <button className="px-3 py-1 rounded-xl bg-black/70 hover:bg-black/90 backdrop-blur-md text-white text-[11px] font-bold border border-white/20 flex items-center gap-1 transition-all duration-300 group-hover:border-amber-400/80">
                            <ArrowLeft className="w-3 h-3 text-amber-400 rtl:-scale-x-100 group-hover:-translate-x-1 transition-transform" />
                            <span>استعراض القاعات</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
