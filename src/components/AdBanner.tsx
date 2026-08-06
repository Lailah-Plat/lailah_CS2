import React, { useState, useEffect } from 'react';

interface AdInfo {
  id: number;
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
  layout?: 'simple' | 'overlay' | 'card' | 'banner';
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, className = "", layout = 'simple' }) => {
  const [ad, setAd] = useState<AdInfo | null>(null);

  useEffect(() => {
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
            advertiser: ia.providerName || '',
            title: ia.name || '',
            content: ia.content || '',
            placement: ia.location || '',
            startDate: ia.startDate || '',
            endDate: ia.endDate || '',
            value: ia.revenue || 0,
            views: ia.views || 0,
            clicks: ia.clicks || 0,
            status: ia.status === 'نشط' ? 'فعّال' : 'متوقف',
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
      
      // Map any equivalent location aliases so both naming patterns work seamlessly
      const getAliases = (p: string): string[] => {
        const aliasMap: Record<string, string[]> = {
          'الإعلان العلوي الأول - الأيمن': ['الإعلان العلوي الأول - الأيمن', 'شريط الإعلانات العلوي - يمين'],
          'الإعلان العلوي الثاني - الأوسط': ['الإعلان العلوي الثاني - الأوسط', 'شريط الإعلانات العلوي - وسط'],
          'الإعلان العلوي الثالث - الأيسر': ['الإعلان العلوي الثالث - الأيسر', 'شريط الإعلانات العلوي - يسار'],
          'الإعلان السفلي الأول - الأيمن': ['الإعلان السفلي الأول - الأيمن', 'شريط الإعلانات السفلي - يمين'],
          'الإعلان السفلي الثاني - الأوسط': ['الإعلان السفلي الثاني - الأوسط', 'شريط الإعلانات السفلي - وسط'],
          'الإعلان السفلي الثالث - الأيسر': ['الإعلان السفلي الثالث - الأيسر', 'شريط الإعلانات السفلي - يسار'],

          'شريط الإعلانات العلوي - يمين': ['الإعلان العلوي الأول - الأيمن', 'شريط الإعلانات العلوي - يمين'],
          'شريط الإعلانات العلوي - وسط': ['الإعلان العلوي الثاني - الأوسط', 'شريط الإعلانات العلوي - وسط'],
          'شريط الإعلانات العلوي - يسار': ['الإعلان العلوي الثالث - الأيسر', 'شريط الإعلانات العلوي - يسار'],
          'شريط الإعلانات السفلي - يمين': ['الإعلان السفلي الأول - الأيمن', 'شريط الإعلانات السفلي - يمين'],
          'شريط الإعلانات السفلي - وسط': ['الإعلان السفلي الثاني - الأوسط', 'شريط الإعلانات السفلي - وسط'],
          'شريط الإعلانات السفلي - يسار': ['الإعلان السفلي الثالث - الأيسر', 'شريط الإعلانات السفلي - يسار'],
        };
        return aliasMap[p] || [p];
      };

      const allowedPlacements = getAliases(placement);

      // Find ads matching placement, status, and date range
      const activeAds = allAds.filter(a => 
        allowedPlacements.includes(a.placement) && 
        a.status === 'فعّال' &&
        (!a.startDate || today >= a.startDate) &&
        (!a.endDate || today <= a.endDate)
      );

      if (activeAds.length > 0) {
        // Pick a random ad from eligible ones to rotate exposure
        const selected = activeAds[Math.floor(Math.random() * activeAds.length)];
        setAd(selected);
        
        // Increment view count directly without causing loops across tabs
        if (selected.isInternal) {
          if (internalStored) {
            try {
              const internalAds: any[] = JSON.parse(internalStored);
              const updatedInternal = internalAds.map((ia: any) => {
                if (ia.id === selected.id) {
                  return { ...ia, views: (ia.views || 0) + 1 };
                }
                return ia;
              });
              localStorage.setItem('internal_ads', JSON.stringify(updatedInternal));
            } catch {}
          }
        } else {
          const updated = ads.map(a => {
            if (a.id === selected.id) {
              return { ...a, views: (a.views || 0) + 1 };
            }
            return a;
          });
          localStorage.setItem('GLOBAL_ADS', JSON.stringify(updated));
        }
      }
    } catch (err) {
      console.error("Error fetching ad for placement:", placement, err);
    }
  }, [placement]);

  const handleAdClick = () => {
    if (ad) {
      try {
        if (ad.isInternal) {
          const internalStored = localStorage.getItem('internal_ads');
          if (internalStored) {
            const internalAds: any[] = JSON.parse(internalStored);
            const updatedInternal = internalAds.map((ia: any) => {
              if (ia.id === ad.id) {
                return { ...ia, clicks: (ia.clicks || 0) + 1 };
              }
              return ia;
            });
            localStorage.setItem('internal_ads', JSON.stringify(updatedInternal));
          }
        } else {
          const stored = localStorage.getItem('GLOBAL_ADS');
          if (stored) {
            const ads: AdInfo[] = JSON.parse(stored);
            const updated = ads.map(a => {
              if (a.id === ad.id) {
                return { ...a, clicks: (a.clicks || 0) + 1 };
              }
              return a;
            });
            localStorage.setItem('GLOBAL_ADS', JSON.stringify(updated));
          }
        }
      } catch {}
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
