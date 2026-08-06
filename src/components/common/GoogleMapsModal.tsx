import React, { useState, useEffect, useRef } from 'react';
import { 
  APIProvider, 
  Map, 
  AdvancedMarker, 
  useMap, 
  useMapsLibrary,
  MapMouseEvent
} from '@vis.gl/react-google-maps';
import { X, MapPin, Search, Check, AlertTriangle, Compass, ShieldAlert, FileSpreadsheet, RefreshCw, Layers } from 'lucide-react';

const API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  '';

const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface GoogleMapsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (address: string, location?: { lat: number; lng: number }, extra?: { region: string; city: string }) => void;
  initialAddress?: string;
}

interface StructuredAddress {
  region: string;
  city: string;
  district: string;
  street: string;
  postalCode: string;
}

// Custom autocomplete prediction type
interface PredictionItem {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

const defaultRegionCities: Record<string, string[]> = {
  'الرياض': ['الرياض', 'الخرج', 'الدرعية', 'الدوادمي'],
  'مكة المكرمة': ['مكة', 'جدة', 'الطائف', 'مكة المكرمة', 'رابغ'],
  'المدينة المنورة': ['المدينة المنورة', 'ينبع', 'بدر', 'العلا'],
  'المنطقة الشرقية': ['الدمام', 'الخبر', 'الظهران', 'الجبيل', 'الأحساء'],
  'القصيم': ['بريدة', 'عنيزة', 'الرس'],
  'حائل': ['حائل', 'بقعاء', 'الشنان'],
  'عسير': ['أبها', 'خميس مشيط', 'أحد رفيدة'],
  'تبوك': ['تبوك', 'ضباء', 'الوجه'],
  'الجوف': ['سكاكا', 'القريات', 'دومة الجندل'],
  'جيزان': ['جيزان', 'صبيا', 'أبو عريش'],
  'نجران': ['نجران', 'شرورة'],
  'الباحة': ['الباحة', 'بلجرشي'],
  'الحدود الشمالية': ['عرعر', 'رفحاء', 'طريف']
};

const CITY_COORDINATES: Record<string, { lat: number; lng: number }> = {
  'الرياض': { lat: 24.7136, lng: 46.6753 },
  'الخرج': { lat: 24.1500, lng: 47.3000 },
  'الدرعية': { lat: 24.7356, lng: 46.5744 },
  'الدوادمي': { lat: 24.5077, lng: 44.3923 },
  'مكة': { lat: 21.3891, lng: 39.8579 },
  'جدة': { lat: 21.4858, lng: 39.1925 },
  'الطائف': { lat: 21.2854, lng: 40.4137 },
  'مكة المكرمة': { lat: 21.3891, lng: 39.8579 },
  'رابغ': { lat: 22.7986, lng: 39.0349 },
  'المدينة المنورة': { lat: 24.4672, lng: 39.6111 },
  'ينبع': { lat: 24.0891, lng: 38.0637 },
  'بدر': { lat: 23.7781, lng: 38.7901 },
  'العلا': { lat: 26.6167, lng: 37.9167 },
  'الدمام': { lat: 26.4207, lng: 50.0888 },
  'الخبر': { lat: 26.2731, lng: 50.2073 },
  'الظهران': { lat: 26.2361, lng: 50.1553 },
  'الجبيل': { lat: 27.0112, lng: 49.6583 },
  'الأحساء': { lat: 25.3833, lng: 49.5833 },
  'بريدة': { lat: 26.3260, lng: 43.9750 },
  'عنيزة': { lat: 26.0850, lng: 43.9900 },
  'الرس': { lat: 25.8677, lng: 43.4981 },
  'حائل': { lat: 27.5114, lng: 41.7208 },
  'بقعاء': { lat: 27.8428, lng: 42.3831 },
  'الشنان': { lat: 27.1650, lng: 42.4277 },
  'أبها': { lat: 18.2164, lng: 42.5053 },
  'خميس مشيط': { lat: 18.3000, lng: 42.7333 },
  'أحد رفيدة': { lat: 18.1889, lng: 42.8425 },
  'تبوك': { lat: 28.3835, lng: 36.5662 },
  'ضباء': { lat: 27.3524, lng: 35.6908 },
  'الوجه': { lat: 26.2444, lng: 36.4525 },
  'سكاكا': { lat: 29.9697, lng: 40.2064 },
  'القريات': { lat: 31.3314, lng: 37.3422 },
  'دومة الجندل': { lat: 29.8122, lng: 39.8784 },
  'جيزان': { lat: 16.8892, lng: 42.5511 },
  'صبيا': { lat: 17.1500, lng: 42.6333 },
  'أبو عريش': { lat: 16.9667, lng: 42.8333 },
  'نجران': { lat: 17.4933, lng: 44.1277 },
  'شرورة': { lat: 17.4872, lng: 47.1172 },
  'الباحة': { lat: 20.0129, lng: 41.4677 },
  'بلجرشي': { lat: 19.8557, lng: 41.5645 },
  'عرعر': { lat: 30.9753, lng: 41.0381 },
  'رفحاء': { lat: 29.6353, lng: 43.4905 },
  'طريف': { lat: 31.6725, lng: 38.6631 }
};

function normalizeRegionAndCity(geoRegion: string, geoCity: string) {

  // Add aliases for matching
  const regionAliases: Record<string, string> = {
    'جازان': 'جيزان',
    'الشرقية': 'المنطقة الشرقية',
    'منطقة مكة': 'مكة المكرمة',
    'منطقة الرياض': 'الرياض',
    'منطقة المدينة': 'المدينة المنورة',
    'منطقة القصيم': 'القصيم',
    'منطقة عسير': 'عسير',
    'منطقة تبوك': 'تبوك',
    'منطقة حائل': 'حائل',
    'منطقة الجوف': 'الجوف',
    'منطقة الباحة': 'الباحة',
    'منطقة نجران': 'نجران',
    'منطقة الحدود الشمالية': 'الحدود الشمالية'
  };

  let cleanRegion = (geoRegion || '').trim().replace('منطقة ', '');
  let cleanCity = (geoCity || '').trim().replace('مدينة ', '');

  // Map region aliases
  if (regionAliases[cleanRegion]) {
    cleanRegion = regionAliases[cleanRegion];
  }
  for (const [alias, realName] of Object.entries(regionAliases)) {
    if (cleanRegion.includes(alias) || alias.includes(cleanRegion)) {
      cleanRegion = realName;
      break;
    }
  }

  let matchedRegion = '';
  let matchedCity = '';

  // 1. Try exact or partial match of region name
  for (const rName of Object.keys(defaultRegionCities)) {
    if (
      cleanRegion.includes(rName) || 
      rName.includes(cleanRegion)
    ) {
      matchedRegion = rName;
      break;
    }
  }

  // 2. If no region matched, see if city is in defaultRegionCities
  if (!matchedRegion && cleanCity) {
    for (const [rName, cities] of Object.entries(defaultRegionCities)) {
      if (cities.some(c => cleanCity.includes(c) || c.includes(cleanCity))) {
        matchedRegion = rName;
        break;
      }
    }
  }

  // Fallback to 'الرياض' if none match
  if (!matchedRegion) {
    matchedRegion = 'الرياض';
  }

  // 3. Find matched city inside that region
  const citiesInRegion = defaultRegionCities[matchedRegion] || [];
  for (const cName of citiesInRegion) {
    if (
      cleanCity.includes(cName) || 
      cName.includes(cleanCity)
    ) {
      matchedCity = cName;
      break;
    }
  }

  // Special normalization for 'مكة المكرمة' / 'مكة'
  if (matchedRegion === 'مكة المكرمة' && (cleanCity.includes('مكة') || cleanCity.includes('مكه'))) {
    matchedCity = 'مكة المكرمة';
  }

  if (!matchedCity && citiesInRegion.length > 0) {
    matchedCity = citiesInRegion[0];
  }

  return { region: matchedRegion, city: matchedCity };
}

function MapPicker({ onConfirm, onClose, initialAddress, isEditable, username, userRole }: { 
  onConfirm: (address: string, location: { lat: number; lng: number }, extra?: { region: string; city: string }) => void;
  onClose: () => void;
  initialAddress?: string;
  isEditable: boolean;
  username: string;
  userRole: string;
}) {
  const map = useMap();
  const placesLib = useMapsLibrary('places');
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState(initialAddress || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [showPredictions, setShowPredictions] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [mapsError, setMapsError] = useState(false);
  const [mapsErrorDetails, setMapsErrorDetails] = useState<string | null>(null);
  const [isManualMode, setIsManualMode] = useState(false);
  
  // Structured Address Components
  const [structuredAddress, setStructuredAddress] = useState<StructuredAddress>({
    region: 'الرياض',
    city: 'الرياض',
    district: '',
    street: '',
    postalCode: ''
  });

  const autocompleteServiceRef = useRef<any>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Saudi Arabia Central Center
  const defaultCenter = { lat: 24.7136, lng: 46.6753 };

  // Intercept Google Maps authorization/billing failures (e.g., BillingNotEnabledMapError)
  useEffect(() => {
    const originalAuthFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn("Google Maps Auth/Billing failure intercepted.");
      setMapsError(true);
      setMapsErrorDetails("تم رصد قيد أو عدم تمكين الفواتير (Billing) لحساب خرائط قوقل. تم تفعيل وضع الإدخال اليدوي المباشر لحفظ العنوان بدقة.");
      setIsManualMode(true);
      if (originalAuthFailure) {
        originalAuthFailure();
      }
    };
    return () => {
      (window as any).gm_authFailure = originalAuthFailure;
    };
  }, []);

  // Setup Autocomplete service
  useEffect(() => {
    try {
      if (window.google && window.google.maps && window.google.maps.places && !autocompleteServiceRef.current) {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
      }
    } catch (e) {
      console.warn("Could not load Google Places Autocomplete Service:", e);
    }
  }, [placesLib]);

  // Manual fallback updates
  const handleManualRegionChange = (newRegion: string) => {
    const cities = defaultRegionCities[newRegion] || [];
    const newCity = cities[0] || '';
    const coords = CITY_COORDINATES[newCity] || { lat: 24.7136, lng: 46.6753 };
    
    setSelectedLocation(coords);
    if (map) {
      try {
        map.setCenter(coords);
        map.setZoom(13);
      } catch (e) {}
    }

    setStructuredAddress(prev => {
      const updated = {
        ...prev,
        region: newRegion,
        city: newCity
      };
      updateFullAddressFromStructured(updated);
      return updated;
    });
  };

  const handleManualCityChange = (newCity: string) => {
    const coords = CITY_COORDINATES[newCity] || { lat: 24.7136, lng: 46.6753 };
    
    setSelectedLocation(coords);
    if (map) {
      try {
        map.setCenter(coords);
        map.setZoom(14);
      } catch (e) {}
    }

    setStructuredAddress(prev => {
      const updated = {
        ...prev,
        city: newCity
      };
      updateFullAddressFromStructured(updated);
      return updated;
    });
  };

  const handleManualFieldChange = (field: keyof StructuredAddress, value: string) => {
    setStructuredAddress(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      updateFullAddressFromStructured(updated);
      return updated;
    });
  };

  const handleManualCoordinateChange = (field: 'lat' | 'lng', value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setSelectedLocation(prev => {
        const updated = prev ? { ...prev, [field]: num } : { lat: 24.7136, lng: 46.6753, [field]: num };
        if (map) {
          try {
            map.setCenter(updated);
          } catch (e) {}
        }
        return updated;
      });
    }
  };

  const updateFullAddressFromStructured = (struct: StructuredAddress) => {
    const parts = [];
    if (struct.region) parts.push(`المنطقة: ${struct.region}`);
    if (struct.city) parts.push(`المدينة: ${struct.city}`);
    if (struct.district) parts.push(`حي ${struct.district}`);
    if (struct.street) parts.push(`شارع ${struct.street}`);
    if (struct.postalCode) parts.push(`الرمز البريدي: ${struct.postalCode}`);
    
    const full = parts.join(' - ');
    setAddress(full);
  };

  // Geocode initial address if provided
  useEffect(() => {
    if (initialAddress && initialAddress.trim() && window.google) {
      try {
        const geocoder = new google.maps.Geocoder();
        setIsGeocoding(true);
        geocoder.geocode({ address: initialAddress }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const loc = results[0].geometry.location;
            const pos = { lat: loc.lat(), lng: loc.lng() };
            setSelectedLocation(pos);
            setAddress(results[0].formatted_address);
            
            // Parse structured components
            const parsed = parseAddressComponents(results[0].address_components);
            setStructuredAddress(parsed);

            if (map) {
              map.setCenter(pos);
              map.setZoom(15);
            }
          } else {
            console.error("Initial geocoding status error:", status);
            if (status === 'REQUEST_DENIED' || status === 'OVER_QUERY_LIMIT' || status === 'ZERO_RESULTS') {
              setMapsError(true);
              setMapsErrorDetails("تم رفض أو تعذر الاتصال بمرفق الجيوكود من قوقل (غالباً بسبب تفعيل الفواتير أو قيود المفتاح). تم تفعيل وضع الإدخال اليدوي الموثوق.");
              setIsManualMode(true);
            }
          }
          setIsGeocoding(false);
        });
      } catch (e) {
        console.error("Geocoder execution error:", e);
        setMapsError(true);
        setIsManualMode(true);
        setIsGeocoding(false);
      }
    } else if (initialAddress && initialAddress.trim()) {
      // Local fallback parsing for initialAddress when google is not loaded
      try {
        const parts = initialAddress.split(/,|،|-/);
        let guessedCity = 'الرياض';
        let guessedRegion = 'الرياض';
        for (const [reg, cities] of Object.entries(defaultRegionCities)) {
          for (const c of cities) {
            if (initialAddress.includes(c)) {
              guessedCity = c;
              guessedRegion = reg;
              break;
            }
          }
        }
        setStructuredAddress({
          region: guessedRegion,
          city: guessedCity,
          district: parts[2]?.trim() || parts[1]?.trim() || '',
          street: parts[3]?.trim() || '',
          postalCode: ''
        });
        const coords = CITY_COORDINATES[guessedCity] || CITY_COORDINATES['الرياض'];
        setSelectedLocation(coords);
      } catch (e) {
        console.error("Local parse error:", e);
      }
    }
  }, [initialAddress, map]);

  const parseAddressComponents = (components: google.maps.GeocoderAddressComponent[]): StructuredAddress => {
    let region = '';
    let city = '';
    let district = '';
    let street = '';
    let postalCode = '';

    components.forEach(comp => {
      const types = comp.types;
      if (types.includes('administrative_area_level_1')) {
        region = comp.long_name;
      } else if (types.includes('locality') || types.includes('administrative_area_level_2')) {
        city = comp.long_name;
      } else if (types.includes('sublocality') || types.includes('neighborhood') || types.includes('sublocality_level_1')) {
        district = comp.long_name;
      } else if (types.includes('route')) {
        street = comp.long_name;
      } else if (types.includes('postal_code')) {
        postalCode = comp.long_name;
      }
    });

    const normalized = normalizeRegionAndCity(region, city);

    return { 
      region: normalized.region, 
      city: normalized.city, 
      district, 
      street, 
      postalCode 
    };
  };

  const handleMapClick = async (e: MapMouseEvent) => {
    if (!isEditable) return; // RBAC Guard
    if (e.detail.latLng) {
      const lat = e.detail.latLng.lat;
      const lng = e.detail.latLng.lng;
      setSelectedLocation({ lat, lng });
      reverseGeocode(lat, lng);
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsGeocoding(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ location: { lat, lng } });
      if (response.results[0]) {
        setAddress(response.results[0].formatted_address);
        const parsed = parseAddressComponents(response.results[0].address_components);
        setStructuredAddress(parsed);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      // Fallback: Generate address locally
      setMapsError(true);
      setIsManualMode(true);
      setMapsErrorDetails("فشل جلب تفاصيل الموقع من قوقل (تحقق من الفواتير والقيود). يمكنك إدخال تفاصيل العنوان يدوياً.");
    } finally {
      setIsGeocoding(false);
    }
  };

  // Handle typed inputs for Predictive Search
  const handleInputChange = (val: string) => {
    setSearchQuery(val);
    if (!isEditable) return; // Guard
    if (!val.trim() || !autocompleteServiceRef.current) {
      setPredictions([]);
      setShowPredictions(false);
      return;
    }

    try {
      autocompleteServiceRef.current.getPlacePredictions(
        { 
          input: val, 
          componentRestrictions: { country: 'SA' },
          language: 'ar'
        },
        (results: any, status: any) => {
          if (status === 'OK' && results) {
            const formatted = results.map((item: any) => ({
              placeId: item.place_id,
              description: item.description,
              mainText: item.structured_formatting?.main_text || item.description,
              secondaryText: item.structured_formatting?.secondary_text || ''
            }));
            setPredictions(formatted);
            setShowPredictions(true);
          } else {
            setPredictions([]);
            setShowPredictions(false);
          }
        }
      );
    } catch (e) {
      console.warn("Autocomplete error:", e);
    }
  };

  const handlePredictionClick = async (pred: PredictionItem) => {
    setSearchQuery(pred.description);
    setShowPredictions(false);
    setIsGeocoding(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ placeId: pred.placeId });
      if (response.results[0]) {
        const { lat, lng } = response.results[0].geometry.location;
        const location = { lat: lat(), lng: lng() };
        setSelectedLocation(location);
        setAddress(response.results[0].formatted_address);
        
        const parsed = parseAddressComponents(response.results[0].address_components);
        setStructuredAddress(parsed);

        map?.setCenter(location);
        map?.setZoom(16);
      }
    } catch (error) {
      console.error('Autocomplete Geocoding Error:', error);
      setMapsError(true);
      setIsManualMode(true);
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSearchSubmit = async () => {
    if (!searchQuery.trim()) return;
    setIsGeocoding(true);
    try {
      const geocoder = new google.maps.Geocoder();
      const response = await geocoder.geocode({ address: searchQuery });
      if (response.results[0]) {
        const { lat, lng } = response.results[0].geometry.location;
        const location = { lat: lat(), lng: lng() };
        setSelectedLocation(location);
        setAddress(response.results[0].formatted_address);
        
        const parsed = parseAddressComponents(response.results[0].address_components);
        setStructuredAddress(parsed);

        map?.setCenter(location);
        map?.setZoom(16);
      }
    } catch (error) {
      console.error('Search error:', error);
      setMapsError(true);
      setIsManualMode(true);
      // Fallback search: try parsing search query text to guess region/city
      const queryLower = searchQuery.toLowerCase();
      let foundCity = '';
      for (const [reg, cities] of Object.entries(defaultRegionCities)) {
        for (const c of cities) {
          if (queryLower.includes(c)) {
            foundCity = c;
            break;
          }
        }
        if (foundCity) break;
      }
      if (foundCity) {
        const coords = CITY_COORDINATES[foundCity];
        if (coords) {
          setSelectedLocation(coords);
          setStructuredAddress(prev => {
            const updated = { ...prev, city: foundCity, district: searchQuery.replace(foundCity, '').trim() };
            updateFullAddressFromStructured(updated);
            return updated;
          });
          map?.setCenter(coords);
        }
      }
    } finally {
      setIsGeocoding(false);
    }
  };

  // GPS Current Location Getter
  const handleGetCurrentLocation = () => {
    if (!isEditable) return; // Guard
    if (navigator.geolocation) {
      setIsGeocoding(true);
      setGpsError(null);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setSelectedLocation({ lat, lng });
          reverseGeocode(lat, lng);
          map?.setCenter({ lat, lng });
          map?.setZoom(16);
        },
        (error) => {
          console.error("GPS Error:", error);
          let errorMsg = 'تعذر الحصول على موقعك الجغرافي الفعلي.';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'تم رفض إذن الوصول للموقع الجغرافي GPS من قبل المتصفح.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'موقع الـ GPS الخاص بجهازك غير متاح حالياً.';
          }
          setGpsError(errorMsg);
          setIsGeocoding(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setGpsError('متصفحك الحالي لا يدعم ميزة قراءة الموقع الجغرافي GPS.');
    }
  };

  // Record audit logs in database
  const recordAuditTrail = async (finalAddr: string, lat: number, lng: number) => {
    try {
      await fetch('/api/security/audit-logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'تحديث الموقع الجغرافي والإحداثيات',
          entityType: 'location_settings',
          entityId: 'geo_' + Date.now(),
          performedBy: `${username} (${userRole === 'admin' ? 'مدير نظام' : 'شريك مزود'})`,
          details: {
            oldAddress: initialAddress || 'غير محدد سابقاً',
            newAddress: finalAddr,
            coordinates: { lat, lng },
            structured: structuredAddress,
            ipAddress: '127.0.0.1 (المتصفح)',
            device: navigator.userAgent
          }
        })
      });
    } catch (e) {
      console.error("Failed to log audit trail:", e);
    }
  };

  const handleConfirmClick = async () => {
    if (!selectedLocation) return;
    setIsGeocoding(true);
    // Log the change dynamically in background audit logs
    await recordAuditTrail(address, selectedLocation.lat, selectedLocation.lng);
    onConfirm(address, selectedLocation, { region: structuredAddress.region, city: structuredAddress.city });
    setIsGeocoding(false);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full relative font-sans">
      {/* Map Main View Component */}
      <div className="flex-1 flex flex-col min-h-[300px] lg:min-h-0 relative">
        {/* Predictive Autocomplete Search Bar */}
        <div className="p-4 bg-white/95 backdrop-blur-md border-b border-slate-100 flex gap-2 shrink-0 z-20 absolute top-0 left-0 right-0 shadow-sm">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-slate-400" />
            <input 
              ref={inputRef}
              type="text" 
              disabled={!isEditable}
              className="w-full pr-11 pl-4 py-3 rounded-2xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-sm transition-all shadow-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
              placeholder={isEditable ? "ابحث عن مكان، معلم، حي، أو اسم شارع..." : "وضع العرض فقط - لا يمكن البحث أو التعديل"}
              value={searchQuery}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
            />

            {/* Predictions Dropdown Panel */}
            {showPredictions && predictions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto z-[30] divide-y divide-slate-50">
                {predictions.map((pred) => (
                  <button
                    key={pred.placeId}
                    onClick={() => handlePredictionClick(pred)}
                    className="w-full text-right px-4 py-3 hover:bg-slate-50 transition-colors flex flex-col"
                  >
                    <span className="text-sm font-bold text-slate-800">{pred.mainText}</span>
                    {pred.secondaryText && (
                      <span className="text-xs text-slate-405 mt-0.5">{pred.secondaryText}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          
          {isEditable && (
            <button 
              onClick={handleGetCurrentLocation}
              title="تحديد موقعي الفعلي GPS"
              className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-200 hover:bg-amber-100 active:scale-95 transition-all flex items-center justify-center shadow-sm"
            >
              <Compass className="w-5 h-5 animate-pulse" />
            </button>
          )}

          <button 
            onClick={handleSearchSubmit}
            disabled={isGeocoding || !isEditable}
            className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-sm font-bold hover:bg-slate-800 active:scale-95 transition-all disabled:opacity-40 shadow-md shadow-slate-900/15"
          >
            بحث
          </button>
        </div>

        {/* The Google Map itself */}
        <div className="flex-1 relative mt-[73px]">
          <Map
            defaultCenter={selectedLocation || defaultCenter}
            defaultZoom={selectedLocation ? 16 : 6}
            mapId="DEMO_MAP_ID"
            onClick={handleMapClick}
            style={{ width: '100%', height: '100%' }}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            gestureHandling={'greedy'}
            disableDefaultUI={false}
          >
            {selectedLocation && (
              <AdvancedMarker 
                position={selectedLocation} 
                draggable={isEditable}
                onDragEnd={(e) => {
                  const lat = e.latLng?.lat();
                  const lng = e.latLng?.lng();
                  if (lat && lng) {
                    setSelectedLocation({ lat, lng });
                    reverseGeocode(lat, lng);
                  }
                }}
              />
            )}
          </Map>
          
          {/* Geocoding Loading Spinner Backdrop */}
          {isGeocoding && (
            <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px] flex items-center justify-center z-10">
              <div className="bg-white/95 px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100">
                <RefreshCw className="w-5 h-5 text-amber-500 animate-spin" />
                <span className="text-xs font-bold text-slate-700">جاري استخراج بيانات الموقع الجغرافي...</span>
              </div>
            </div>
          )}

          {/* GPS Location Alerts */}
          {gpsError && (
            <div className="absolute bottom-4 right-4 left-4 lg:left-auto lg:w-96 bg-red-50 border border-red-150 p-3.5 rounded-xl text-red-750 text-xs shadow-lg flex gap-2.5 items-start z-10 animate-bounce">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <div>
                <p className="font-bold">تنبيه GPS:</p>
                <p className="mt-0.5 text-red-650 leading-relaxed">{gpsError}</p>
              </div>
              <button onClick={() => setGpsError(null)} className="text-red-400 hover:text-red-700 mr-auto font-bold">×</button>
            </div>
          )}

          {/* Draggable Notice Tooltip Overlay */}
          {isEditable && selectedLocation && (
            <div className="absolute top-4 left-4 bg-slate-900/90 text-white px-3.5 py-1.5 rounded-full text-[11px] font-medium shadow-md flex items-center gap-1.5 z-10 backdrop-blur-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              ميزة ذكية: يمكنك سحب الدبوس (Drag & Drop) بدقة لتغيير الموقع
            </div>
          )}
        </div>
      </div>

      {/* Structured GeoJSON & Administrative Details Sidebar */}
      <div className="w-full lg:w-[350px] bg-slate-50 border-t lg:border-t-0 lg:border-r border-slate-200 p-5 flex flex-col justify-between shrink-0 overflow-y-auto max-h-[400px] lg:max-h-none">
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
            <Layers className="w-4.5 h-4.5 text-amber-600" />
            <h4 className="text-xs font-extrabold text-slate-800">بيانات التموضع الهيكلي (GeoJSON)</h4>
          </div>

          {isEditable && (
            <div className="bg-white p-3 rounded-xl border border-slate-200/85 shadow-sm flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">وضع الإدخال اليدوي:</span>
              <button
                onClick={() => setIsManualMode(!isManualMode)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all ${
                  isManualMode 
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/15' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isManualMode ? 'نشط ✍️' : 'تفعيل'}
              </button>
            </div>
          )}

          {mapsError && (
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-amber-950 text-xs leading-relaxed space-y-1">
              <div className="flex gap-1.5 items-center font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>وضع إدخال يدوي احتياطي</span>
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">{mapsErrorDetails || 'ميزة جلب الخريطة مقيدة مؤقتاً بسبب الفواتير أو الاتصال. تم تفعيل وضع الإدخال النصي اليدوي.'}</p>
            </div>
          )}

          {!isEditable && (
            <div className="bg-red-50 border border-red-100 p-3 rounded-xl flex gap-2 items-start text-xs text-red-800 leading-relaxed">
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">تنبيه حوكمة البيانات (RBAC):</span>
                <p className="mt-0.5 text-red-700">أنت مسجل حالياً بصلاحية "عرض فقط". لا تملك الصلاحية الأمنية لتعديل أو زحزحة الدبوس الجغرافي للمقر.</p>
              </div>
            </div>
          )}

          {/* Coordinates Structured Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">خط العرض (Lat)</span>
              {isManualMode && isEditable ? (
                <input
                  type="number"
                  step="0.000001"
                  value={selectedLocation ? selectedLocation.lat : ''}
                  onChange={(e) => handleManualCoordinateChange('lat', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-mono font-bold text-slate-700 outline-none focus:border-amber-500"
                />
              ) : (
                <span className="text-xs font-mono font-bold text-slate-700">
                  {selectedLocation ? selectedLocation.lat.toFixed(6) : '---'}
                </span>
              )}
            </div>
            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-bold">خط الطول (Lng)</span>
              {isManualMode && isEditable ? (
                <input
                  type="number"
                  step="0.000001"
                  value={selectedLocation ? selectedLocation.lng : ''}
                  onChange={(e) => handleManualCoordinateChange('lng', e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-1 text-xs font-mono font-bold text-slate-700 outline-none focus:border-amber-500"
                />
              ) : (
                <span className="text-xs font-mono font-bold text-slate-700">
                  {selectedLocation ? selectedLocation.lng.toFixed(6) : '---'}
                </span>
              )}
            </div>
          </div>

          {/* Logical Administrative Separation */}
          <div className="space-y-3 bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs">
            <span className="text-[10px] text-slate-400 block font-bold">التقسيم الإداري النصي (Logical Address)</span>
            
            {isManualMode && isEditable ? (
              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">المنطقة</label>
                  <select
                    value={structuredAddress.region}
                    onChange={(e) => handleManualRegionChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:border-amber-500 outline-none"
                  >
                    {Object.keys(defaultRegionCities).map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">المدينة</label>
                  <select
                    value={structuredAddress.city}
                    onChange={(e) => handleManualCityChange(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:border-amber-500 outline-none"
                  >
                    {(defaultRegionCities[structuredAddress.region] || []).map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">الحي</label>
                  <input
                    type="text"
                    value={structuredAddress.district}
                    onChange={(e) => handleManualFieldChange('district', e.target.value)}
                    placeholder="مثال: النرجس"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">الشارع</label>
                  <input
                    type="text"
                    value={structuredAddress.street}
                    onChange={(e) => handleManualFieldChange('street', e.target.value)}
                    placeholder="مثال: طريق الملك فهد"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:border-amber-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">الرمز البريدي</label>
                  <input
                    type="text"
                    value={structuredAddress.postalCode}
                    onChange={(e) => handleManualFieldChange('postalCode', e.target.value)}
                    placeholder="مثال: 12345"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono font-bold text-slate-800 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-2.5 mt-2 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block">المنطقة</span>
                    <span className="font-bold text-slate-800">{structuredAddress.region || 'الرياض'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">المدينة</span>
                    <span className="font-bold text-slate-800">{structuredAddress.city || 'الرياض'}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 mt-2.5 pt-2 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block">الحي</span>
                    <span className="font-bold text-slate-850">{structuredAddress.district || 'مجهول / انقر للتحديد'}</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block">الشارع</span>
                    <span className="font-bold text-slate-805 truncate block">{structuredAddress.street || 'غير متوفر'}</span>
                  </div>
                </div>

                <div className="mt-2.5 pt-2 border-t border-slate-100 text-xs">
                  <span className="text-[9px] text-slate-400 block">الرمز البريدي</span>
                  <span className="font-mono font-bold text-slate-850">{structuredAddress.postalCode || '---'}</span>
                </div>
              </>
            )}
          </div>

          {/* Full descriptive Address Output */}
          <div className="bg-white p-3.5 rounded-xl border border-slate-200/80 shadow-xs space-y-1.5">
            <span className="text-[10px] text-slate-400 block font-bold">العنوان الكامل الموحد:</span>
            {isManualMode && isEditable ? (
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="أدخل العنوان التفصيلي الكامل هنا..."
                rows={3}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold text-slate-800 focus:border-amber-500 outline-none resize-none"
              />
            ) : (
              <p className="text-xs text-slate-750 leading-relaxed font-medium">
                {address || 'يرجى النقر على الخريطة أو استخدام البحث التلقائي لتوليد العنوان الموحد.'}
              </p>
            )}
          </div>

          {/* Audit Logs Warning Banner */}
          <div className="p-3 bg-slate-200/60 rounded-xl text-[10px] text-slate-500 leading-normal border border-slate-200 flex gap-1.5 items-start">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span>نظام الحوكمة الأمنية: يتم رصد وتسجيل أي تحديث للإحداثيات تلقائياً في سجلات المراجعة (Audit Log) للمنشأة ببيانات الهوية والـ IP لضمان الشفافية.</span>
          </div>
        </div>

        {/* Footer actions of the sidebar */}
        <div className="pt-4 border-t border-slate-200 mt-4 space-y-2">
          <button 
            onClick={onClose}
            className="w-full py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-200 hover:text-slate-800 transition-colors bg-slate-100 border border-slate-200"
          >
            إلغاء التعديل
          </button>
          
          <button 
            onClick={handleConfirmClick}
            disabled={!selectedLocation || isGeocoding || !isEditable}
            className="w-full py-3 bg-amber-500 text-slate-900 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 hover:bg-amber-600 hover:shadow-amber-500/35 transition-all disabled:opacity-40 disabled:grayscale flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            حفظ وتوثيق الموقع الجغرافي
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GoogleMapsModal({ isOpen, onClose, onConfirm, initialAddress }: GoogleMapsModalProps) {
  // Read authenticated user state from localStorage for secure Audit Logs and RBAC
  const [username, setUsername] = useState('موفر الخدمة');
  const [userRole, setUserRole] = useState('provider');

  useEffect(() => {
    try {
      const stored = localStorage.getItem('currentUser');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          if (parsed.name) setUsername(parsed.name);
          if (parsed.role) setUserRole(parsed.role);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, [isOpen]);

  // RBAC checks: System admins and facility owners have full edit rights. Other employees are view-only.
  const isEditable = (() => {
    const roleLower = userRole.toLowerCase();
    return (
      roleLower.includes('admin') || 
      roleLower.includes('owner') || 
      roleLower.includes('provider') || 
      roleLower.includes('مدير') || 
      roleLower.includes('صاحب')
    );
  })();

  if (!isOpen) return null;

  if (!hasValidKey) {
    return (
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl p-8 text-center font-sans">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-8 h-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-4">مطلوب مفتاح Google Maps API</h2>
          <p className="text-slate-600 mb-6 leading-relaxed">
            لتفعيل ميزة تحديد الموقع الجغرافي الذكي وتوليد الخريطة التفاعلية، يرجى تزويد النظام بمفتاح الـ API الخاص بخرائط قوقل.
          </p>
          
          <div className="bg-slate-50 rounded-2xl p-6 text-right mb-8 border border-slate-100">
            <h3 className="font-bold text-slate-800 mb-3 text-sm">خطوات التفعيل الفوري:</h3>
            <ol className="space-y-3 text-xs text-slate-600">
              <li className="flex gap-2">
                <span className="font-bold text-amber-600">1.</span>
                <a href="https://console.cloud.google.com/google/maps-apis/start" target="_blank" rel="noopener" className="text-blue-600 hover:underline font-bold">احصل على مفتاح API من قوقل (Google Maps Platform)</a>
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600">2.</span>
                افتح علامة تبويب "الأمان والأسرار" (Security & Secrets) في لوحة الإعدادات
              </li>
              <li className="flex gap-2">
                <span className="font-bold text-amber-600">3.</span>
                قم بإضافة متغير سري بالاسم <code>GOOGLE_MAPS_PLATFORM_KEY</code> والصق الرمز السري هناك
              </li>
            </ol>
          </div>

          <button 
            onClick={onClose}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-colors"
          >
            إغلاق النافذة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-150 shrink-0 bg-slate-50">
          <div>
            <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
              <div className="w-2.5 h-6 bg-amber-500 rounded-full"></div>
              نظام تحديد التموضع والموقع الجغرافي السحابي 🗺️
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-semibold">
              إدارة إعدادات الموقع بدقة فائقة مع فصل النطاق الجغرافي والتقسيم الإداري للأصول والمرافق.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <span className={`text-[10px] px-3 py-1.5 rounded-full font-extrabold shadow-sm ${
              isEditable 
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-150' 
                : 'bg-rose-50 text-rose-700 border border-rose-150'
            }`}>
              {isEditable ? 'صلاحية التعديل كاملة ✔️' : 'وضع العرض والتدقيق 🔒'}
            </span>

            <button onClick={onClose} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-2 rounded-full transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Mappicker Content (Lazy loaded inside APIProvider natively) */}
        <div className="flex-1 overflow-hidden">
          <APIProvider apiKey={API_KEY} version="weekly" language="ar" region="SA">
            <MapPicker 
              onConfirm={onConfirm} 
              onClose={onClose} 
              initialAddress={initialAddress} 
              isEditable={isEditable}
              username={username}
              userRole={userRole}
            />
          </APIProvider>
        </div>
      </div>
    </div>
  );
}
