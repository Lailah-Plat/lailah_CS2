import React, { useState, useEffect, useCallback } from 'react';
import { matchAdPlacement, recordAdView, recordAdClick } from '../utils/adTracker';

interface AdInfo {
  id: number | string;
  advertiser: string;
  title: string;
  content: string;
  imageUrl: string;
  placement: string;
  startDate: string;
  endDate: string;
  value: number;
  views: number;
  clicks: number;
  status: string;
  linkUrl?: string;
  isInternal?: boolean;
}

interface AdBannerProps {
  placement: string;
  className?: string;
  layout?: 'simple' | 'overlay' | 'card' | 'banner' | 'native_hall' | 'announcement';
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = "", layout = 'simple' }) => {
  const [ad, setAd] = useState<AdInfo | null>(null);

  const loadAd = useCallback(() => {
    try {
      const stored = localStorage.getItem('GLOBAL_ADS');
      const internalStored = localStorage.getItem('internal_ads');
      
      let ads: AdInfo[] = [];
      if (stored) {
        ads = JSON.parse(stored);
      }

      // Helper to generate fallback images based on placement
      const getFallbackImage = (p: string): string => {
        if (p.includes('يمين')) return 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80';
        if (p.includes('وسط')) return 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80';
        if (p.includes('يسار')) return 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80';
        if (p.includes('أعلى')) return 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=80';
        if (p.includes('خدمات') || p.includes('جانبي')) return 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80';
        if (p.includes('حجز') || p.includes('تفاصيل')) return 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80';
        if (p.includes('منبثقة') || p.includes('Popup')) return 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=800&q=80';
        return 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80';
      };

      // Helper to extract an image/design URL from content text if any exists
      const extractImageUrl = (text: string, p: string): string => {
        if (!text) return getFallbackImage(p);
        const match = text.match(/https?:\/\/[^\s"',]+\.(?:png|jpg|jpeg|gif|webp)(?:\?[^\s"',]*)?/i);
        if (match) return match[0];
        const unsplashMatch = text.match(/https?:\/\/images\.unsplash\.com\/[^\s"',]+/i);
        if (unsplashMatch) return unsplashMatch[0];
        return getFallbackImage(p);
      };

      // Map internal ads to standard AdInfo
      let mappedInternal: AdInfo[] = [];
      if (internalStored) {
        try {
          const internalAds: any[] = JSON.parse(internalStored);
          mappedInternal = internalAds.map((ia: any) => ({
            id: ia.id,
            advertiser: ia.providerName || 'مزود معتمد',
            title: ia.name || ia.title || 'إعلان ترويجي',
            content: ia.content || '',
            placement: ia.location || ia.placement || '',
            startDate: ia.startDate || '',
            endDate: ia.endDate || '',
            value: ia.revenue || 0,
            views: ia.views || 0,
            clicks: ia.clicks || 0,
            status: (ia.status === 'نشط' || ia.status === 'فعّال') ? 'فعّال' : 'متوقف',
            linkUrl: ia.linkUrl || '#',
            imageUrl: extractImageUrl(ia.content || '', ia.location || ''),
            isInternal: true
          }));
        } catch (e) {
          console.error("Error parsing internal ads", e);
        }
      }

      const allAds = [...ads, ...mappedInternal];
      const today = new Date().toISOString().split('T')[0];

      // Find ads matching placement with dual alias mapping, active status, and date range
      const activeAds = allAds.filter(a => 
        matchAdPlacement(a.placement, placement) && 
        (a.status === 'فعّال' || a.status === 'نشط') &&
        (!a.startDate || today >= a.startDate) &&
        (!a.endDate || today <= a.endDate)
      );

      if (activeAds.length > 0) {
        // Pick a random ad from eligible ones to rotate exposure
        const selected = activeAds[Math.floor(Math.random() * activeAds.length)];
        setAd(selected);
        
        // Record performance metric (view) and update database in real-time
        recordAdView(selected.id, selected.isInternal ?? true);
      } else if (layout === 'announcement') {
        // Default announcement fallback for top header bar
        setAd({
          id: 'default-announcement',
          advertiser: 'منصة ليلة',
          title: '🎉 عرض خاص للمناسبات',
          content: 'خصم 20% على جميع قاعات الأفراح وباقات الخدمات عند الحجز المبكر هذا الأسبوع!',
          imageUrl: '',
          placement: 'شريط الهيدر الإعلاني المصغر',
          startDate: '',
          endDate: '',
          value: 0,
          views: 0,
          clicks: 0,
          status: 'فعّال',
          linkUrl: '/explore'
        });
      } else {
        setAd(null);
      }
    } catch (err) {
      console.error("Error fetching ad for placement:", placement, err);
    }
  }, [placement, layout]);

  useEffect(() => {
    loadAd();

    // Listen to real-time ad updates if necessary
    const handleUpdate = (e: any) => {
      if (e.detail?.adId && ad && String(e.detail.adId) === String(ad.id)) {
        if (e.detail.updatedAd) {
          setAd(prev => prev ? { ...prev, views: e.detail.updatedAd.views ?? prev.views, clicks: e.detail.updatedAd.clicks ?? prev.clicks } : null);
        }
      }
    };

    window.addEventListener('layla_internal_ads_updated', handleUpdate);
    return () => {
      window.removeEventListener('layla_internal_ads_updated', handleUpdate);
    };
  }, [loadAd, placement]);

  const handleAdClick = () => {
    if (ad) {
      // Record real-time click and persist to database & storage
      recordAdClick(ad.id, ad.isInternal ?? true);
    }
  };

  if (!ad) return null;

  if (layout === 'overlay') {
    return (
      <a 
        href={ad.linkUrl || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className={`relative block overflow-hidden rounded-2xl group ${className}`}
      >
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-blue-950/90 via-blue-950/20 to-transparent flex flex-col justify-end p-4">
          <div className="text-white">
            <span className="bg-amber-500 text-blue-950 text-[10px] font-bold px-2 py-0.5 rounded-full mb-2 inline-block">إعلان ممول</span>
            <h4 className="font-bold text-lg leading-tight mb-1">{ad.title}</h4>
            <p className="text-white/80 text-xs line-clamp-1">{ad.content}</p>
          </div>
        </div>
      </a>
    );
  }

  if (layout === 'native_hall') {
    return (
      <a 
        href={ad.linkUrl || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className={`bg-gradient-to-br from-amber-500/10 via-white to-amber-500/5 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border-2 border-amber-400/60 group flex flex-col justify-between relative ${className}`}
      >
        <div className="relative h-60 overflow-hidden">
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-4 right-4 bg-amber-500 text-slate-950 px-3 py-1 rounded-full text-xs font-black shadow-md flex items-center gap-1.5 z-10 animate-pulse">
            <span>✨</span>
            <span>عرض مميز / شريك معتمد</span>
          </div>
          <div className="absolute bottom-3 right-4 left-4 text-white z-10">
            <span className="text-[10px] bg-slate-900/80 px-2 py-0.5 rounded text-amber-300 font-bold">إعلان مدعوم من منصة ليلة</span>
          </div>
        </div>
        <div className="p-6 flex-grow flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xl font-bold text-slate-900 group-hover:text-amber-600 transition-colors">
                {ad.title}
              </h3>
              <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-lg">
                خصم حصري
              </span>
            </div>
            <p className="text-slate-600 text-sm mb-4 line-clamp-3 leading-relaxed">
              {ad.content}
            </p>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex items-center justify-between text-xs text-slate-500 mb-3">
              <span>المعلن: <strong className="text-slate-800 font-bold">{ad.advertiser}</strong></span>
              <span className="text-amber-600 font-bold font-mono">سعر خاص للزوار ⭐</span>
            </div>
          </div>
          <div className="flex justify-between items-center pt-3 border-t border-amber-100/60 mt-2">
            <span className="text-xs font-bold text-amber-700">عرض استثنائي عبر ليلة</span>
            <span className="bg-amber-500 group-hover:bg-amber-600 text-slate-950 px-5 py-2 rounded-xl text-xs font-black transition-all shadow-sm">
              استكشف العرض ↗
            </span>
          </div>
        </div>
      </a>
    );
  }

  if (layout === 'announcement') {
    return (
      <a 
        href={ad.linkUrl || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className={`w-full bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 flex items-center justify-center gap-3 text-xs font-black shadow-inner transition-all hover:brightness-105 ${className}`}
      >
        <span className="bg-slate-950 text-amber-300 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider font-mono">عاجل وحصري</span>
        <span className="truncate">{ad.title} — {ad.content}</span>
        <span className="hidden md:inline-flex items-center gap-1 bg-white/40 hover:bg-white/60 text-slate-950 px-2.5 py-0.5 rounded-lg text-[11px] font-bold">
          تفاصيل العرض ↗
        </span>
      </a>
    );
  }

  if (layout === 'card') {
    return (
      <a 
        href={ad.linkUrl || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className={`bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-md transition-all group flex flex-col ${className}`}
      >
        <div className="relative h-32 overflow-hidden">
          <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <span className="absolute top-2 right-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-sm">إعلان</span>
        </div>
        <div className="p-4">
          <h4 className="text-sm font-bold text-blue-950 mb-1 leading-tight group-hover:text-amber-600 transition-colors">{ad.title}</h4>
          <p className="text-xs text-slate-500 line-clamp-2">{ad.content}</p>
        </div>
      </a>
    );
  }

  if (layout === 'banner') {
    return (
      <a 
        href={ad.linkUrl || '#'} 
        target="_blank" 
        rel="noopener noreferrer"
        onClick={handleAdClick}
        className={`block w-full overflow-hidden relative group rounded-xl border border-slate-200 ${className}`}
      >
        <div className="absolute inset-0 bg-blue-950/20 group-hover:bg-transparent transition-colors z-10 w-full h-full"></div>
        <img src={ad.imageUrl} alt={ad.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 min-h-[80px]" />
        <div className="absolute bottom-2 left-2 z-20 flex items-center gap-2">
            <span className="bg-white/90 backdrop-blur-sm text-blue-950 text-[10px] font-bold px-2 py-0.5 rounded shadow-sm">إعلان: {ad.advertiser}</span>
        </div>
      </a>
    );
  }

  // Default simple layout
  return (
    <a 
      href={ad.linkUrl || '#'} 
      target="_blank" 
      rel="noopener noreferrer"
      onClick={handleAdClick}
      className={`block w-full border border-slate-100 rounded-xl overflow-hidden group relative ${className}`}
    >
      <img src={ad.imageUrl} alt={ad.title} className="w-full h-auto object-cover group-hover:opacity-90 transition-opacity" />
      <span className="absolute bottom-1 right-1 bg-black/40 text-white text-[8px] px-1 rounded">إعلان</span>
    </a>
  );
};
