import React, { useState, useEffect } from 'react';
import { X, Sparkles, ExternalLink, Megaphone } from 'lucide-react';
import { matchAdPlacement, recordAdView, recordAdClick } from '../utils/adTracker';

interface InternalAd {
  id: number | string;
  name?: string;
  title?: string;
  content?: string;
  location?: string;
  placement?: string;
  imageUrl?: string;
  linkUrl?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  providerName?: string;
  views?: number;
  clicks?: number;
  revenue?: number;
  isInternal?: boolean;
}

export const PopupAdModal: React.FC = () => {
  const [ad, setAd] = useState<InternalAd | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user dismissed popup in this session or within the last 15 minutes
    const dismissedKey = 'layla_popup_dismissed_time';
    const lastDismissed = sessionStorage.getItem(dismissedKey);
    if (lastDismissed) {
      const diff = Date.now() - parseInt(lastDismissed, 10);
      if (diff < 15 * 60 * 1000) { // 15 mins cool-off within session
        return;
      }
    }

    try {
      const internalStored = localStorage.getItem('internal_ads');
      const globalStored = localStorage.getItem('GLOBAL_ADS');

      let candidateAds: InternalAd[] = [];

      if (internalStored) {
        try {
          const parsed = JSON.parse(internalStored);
          if (Array.isArray(parsed)) {
            candidateAds = candidateAds.concat(
              parsed.map((a: any) => ({
                id: a.id,
                name: a.name || a.title || 'عرض خاص وحصري',
                title: a.name || a.title || 'عرض خاص وحصري',
                content: a.content || 'استفد من أحدث العروض والخصومات المعتمدة عبر منصة ليلة لتنظيم مناسبتك بأعلى مستويات الفخامة والتميز.',
                location: a.location || a.placement || '',
                placement: a.location || a.placement || '',
                imageUrl: a.imageUrl || a.image || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
                linkUrl: a.linkUrl || '/explore',
                status: a.status || 'نشط',
                startDate: a.startDate,
                endDate: a.endDate,
                providerName: a.providerName || 'شريك منصة ليلة المعتمد',
                views: a.views || 0,
                clicks: a.clicks || 0,
                isInternal: true
              }))
            );
          }
        } catch (e) {}
      }

      if (globalStored) {
        try {
          const parsed = JSON.parse(globalStored);
          if (Array.isArray(parsed)) {
            candidateAds = candidateAds.concat(
              parsed.map((a: any) => ({
                id: a.id,
                name: a.title || a.name || 'عرض ترويجي',
                title: a.title || a.name || 'عرض ترويجي',
                content: a.content || '',
                location: a.placement || '',
                placement: a.placement || '',
                imageUrl: a.imageUrl || 'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80',
                linkUrl: a.linkUrl || '/explore',
                status: a.status === 'فعّال' ? 'نشط' : a.status,
                startDate: a.startDate,
                endDate: a.endDate,
                providerName: a.advertiser || 'معلن معتمد',
                views: a.views || 0,
                clicks: a.clicks || 0,
                isInternal: false
              }))
            );
          }
        } catch (e) {}
      }

      const today = new Date().toISOString().split('T')[0];

      // Filter ads designed for popup using Placement Alias Mapping
      const popupAds = candidateAds.filter(a => {
        const isPopupMatched = matchAdPlacement(a.location || a.placement, 'نافذة منبثقة (Popup)');
        const isActive = a.status === 'نشط' || a.status === 'فعّال';
        const isDateValid = (!a.startDate || today >= a.startDate) && (!a.endDate || today <= a.endDate);
        
        return isPopupMatched && isActive && isDateValid;
      });

      if (popupAds.length > 0) {
        // Pick one randomly
        const selected = popupAds[Math.floor(Math.random() * popupAds.length)];
        
        // Show after 1.8s delay
        const timer = setTimeout(() => {
          setAd(selected);
          setIsOpen(true);

          // Track real-time view and sync with database
          recordAdView(selected.id, selected.isInternal ?? true);
        }, 1800);

        return () => clearTimeout(timer);
      }
    } catch (e) {
      console.error('Error initializing popup ad modal:', e);
    }
  }, []);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsOpen(false);
    sessionStorage.setItem('layla_popup_dismissed_time', Date.now().toString());
  };

  const handleAdClick = () => {
    if (ad) {
      // Track real-time click and sync with database
      recordAdClick(ad.id, ad.isInternal ?? true);
    }
    handleClose();
  };

  if (!isOpen || !ad) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-300"
      dir="rtl"
      onClick={handleClose}
    >
      <div 
        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-amber-500/30 transform animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white backdrop-blur-sm flex items-center justify-center transition-all cursor-pointer shadow-md"
          title="إغلاق الإعلان"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Media & Badge */}
        <div className="relative h-56 md:h-64 overflow-hidden group">
          <img 
            src={ad.imageUrl} 
            alt={ad.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>
          
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>إعلان مميز وحصري</span>
            </span>
          </div>

          <div className="absolute bottom-4 right-4 left-4 text-white">
            <span className="text-[11px] font-bold text-amber-300 bg-slate-900/70 px-2.5 py-0.5 rounded-md backdrop-blur-sm inline-block mb-1.5">
              {ad.providerName}
            </span>
            <h3 className="text-xl md:text-2xl font-black leading-tight drop-shadow-sm">
              {ad.title}
            </h3>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
            {ad.content}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
            <a
              href={ad.linkUrl || '#'}
              onClick={handleAdClick}
              className="w-full sm:flex-1 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-sm text-center shadow-lg hover:shadow-amber-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>استكشف العرض الآن</span>
              <ExternalLink className="w-4 h-4" />
            </a>

            <button
              onClick={handleClose}
              className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
            >
              تخطي العرض
            </button>
          </div>
        </div>

        {/* Footer info note */}
        <div className="px-6 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <Megaphone className="w-3.5 h-3.5 text-amber-500" />
            <span>شبكة إعلانات منصة ليلة الرسمية</span>
          </span>
          <span>إعلان موثوق ومعتمد</span>
        </div>
      </div>
    </div>
  );
};
