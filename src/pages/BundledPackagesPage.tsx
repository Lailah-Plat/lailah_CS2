import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  Package, Tag, Clock, Sparkles, Building2, Utensils, Camera, Music, 
  CheckCircle2, ArrowRight, ShieldCheck, Heart, Star, Percent, Filter, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Link as RouterLink } from 'react-router-dom';
import { getStoredHalls, isProviderNameVisible } from '../data/mockData';

export default function BundledPackagesPage() {
  const [selectedCity, setSelectedCity] = useState<string>('الكل');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [maxPrice, setMaxPrice] = useState<number>(100000);

  // Live Countdown Timer state
  const [timeLeft, setTimeLeft] = useState({
    days: 4,
    hours: 18,
    minutes: 32,
    seconds: 45
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: 59, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const bundledPackages = [
    {
      id: 'bundle-1',
      title: 'باقة الزفاف الملكي المكتملة',
      subtitle: 'قاعة الأسطورة + بوفيه فاخر 250 شخص + توثيق سنيما + إضاءة ليزر',
      provider: 'مجموعة القصور الفاخرة',
      tier: 'ماسي 💎',
      city: 'الرياض',
      originalPrice: 48000,
      discountedPrice: 38500,
      savings: 9500,
      capacity: '200 - 300 شخص',
      image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
      rating: 4.9,
      reviewsCount: 84,
      tag: 'عرض الموسم المباشر',
      includedItems: [
        'قاعة فاخرة (قسمين رجال ونساء)',
        'بوفيه مفتوح مع 12 صنف مقبلات وحلويات شرقية',
        'فريق تصوير فوتوغرافي وفيديو سينمائي 4K',
        'تجهيزات إضاءة وليزر وشاشات LED حديثة',
        'مضيفين ومضيفات زيهم موحد بروتوكول عالي'
      ]
    },
    {
      id: 'bundle-2',
      title: 'باقة الملكة والخطوبة الفاخرة',
      subtitle: 'قاعة لؤلؤة الخليج + كوشة زهور + ضيافة ملكية + ديجي مع ستيريو',
      provider: 'شركة اللؤلؤة للمناسبات',
      tier: 'ذهبي 🥇',
      city: 'جدة',
      originalPrice: 26000,
      discountedPrice: 19900,
      savings: 6100,
      capacity: '100 - 150 شخص',
      image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
      rating: 4.8,
      reviewsCount: 62,
      tag: 'خصم الحجز المبكر',
      includedItems: [
        'قاعة مجهزة بمدخل مستقل وديكور عصري',
        'تصميم كوشة زهور طبيعية مخصصة للعروسين',
        'ضيافة قهوة وشاي وموالح مع 4 مضيفات',
        'نظام صوت ديجي متكامل مع هندسة صوتية'
      ]
    },
    {
      id: 'bundle-3',
      title: 'باقة الحفلات والمؤتمرات الاقتصادية',
      subtitle: 'قاعة رويال قصر + تجهيزات صوت وشاشات + ضيافة شاي وقهوة',
      provider: 'شركة رواد الضيافة',
      tier: 'فضية 🥈',
      city: 'الدمام',
      originalPrice: 18000,
      discountedPrice: 13500,
      savings: 4500,
      capacity: '80 - 120 شخص',
      image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      rating: 4.7,
      reviewsCount: 41,
      tag: 'الأكثر طلباً للشركات',
      includedItems: [
        'قاعة مؤتمرات مجهزة بشاشات بروجكتور تفاعلية',
        'بوفيه مفتوح وجبات خفيفة ومشروبات ساخنة طوال اليوم',
        'توفير خدمة إنترنت سريع جداً وحراسات أمنية',
        'إنهاء إجراءات وتوثيق الحجز آلياً'
      ]
    },
    {
      id: 'bundle-4',
      title: 'باقة الصيف المجمعة للحفلات الخاصة',
      subtitle: 'شاليهات ومقرات الأحلام + بوفيه مشاوي + ديجي وتصوير فوتوغرافي',
      provider: 'منتجعات و شاليهات الأحلام',
      tier: 'ماسي 💎',
      city: 'الرياض',
      originalPrice: 15000,
      discountedPrice: 11200,
      savings: 3800,
      capacity: '50 - 80 شخص',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=800&q=80',
      rating: 4.9,
      reviewsCount: 95,
      tag: 'عروض الصيف الحصرية',
      includedItems: [
        'إيجار كامل اليوم لمنتجع خاص بمسبح مغلق',
        'بوفيه مشاوي حية ومقبلات لبنانية',
        'جلسات خارجية مجهزة بإضاءة ديكورية',
        'جلسة تصوير فوتوغرافي 3 ساعات'
      ]
    }
  ];

  const filteredBundles = useMemo(() => {
    return bundledPackages.filter(b => {
      const matchCity = selectedCity === 'الكل' || b.city === selectedCity;
      const matchPrice = b.discountedPrice <= maxPrice;
      return matchCity && matchPrice;
    });
  }, [selectedCity, maxPrice]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-10">
        {/* Banner Hero */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-amber-950 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden mb-10 border border-amber-500/30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 px-3.5 py-1 rounded-full text-xs font-extrabold">
                <Tag className="w-4 h-4 text-amber-400" />
                <span>عروض المجموعات والباقات المجمعة (Bundled Deals)</span>
              </div>
              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                احجز باقة المناسبة المكتملة ووفّر حتى <span className="text-amber-400 font-mono">10,000 ر.س</span>
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-2xl">
                جمعنا لك القاعات الفاخرة مع خدمات الضيافة والتصوير والصوتيات في باقة مجمعة واحدة موثوقة وبأسعار خاصة مخصصة، مع ضمان شامل 15% ضريبة القيمة المضافة وإلغاء مرن.
              </p>
            </div>

            {/* Countdown Box */}
            <div className="lg:col-span-4 bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-amber-500/30 text-center space-y-3">
              <span className="text-xs font-bold text-amber-300 flex items-center justify-center gap-1.5">
                <Clock className="w-4 h-4 animate-spin text-amber-400" /> ينتهي هذا العرض الأسبوعي خلال:
              </span>
              <div className="grid grid-cols-4 gap-2 font-mono" dir="ltr">
                <div className="bg-blue-950/80 p-2.5 rounded-2xl border border-amber-500/30">
                  <span className="text-xl font-black text-amber-400 block">{String(timeLeft.days).padStart(2, '0')}</span>
                  <span className="text-[10px] text-slate-300 block font-sans">يوم</span>
                </div>
                <div className="bg-blue-950/80 p-2.5 rounded-2xl border border-amber-500/30">
                  <span className="text-xl font-black text-amber-400 block">{String(timeLeft.hours).padStart(2, '0')}</span>
                  <span className="text-[10px] text-slate-300 block font-sans">ساعة</span>
                </div>
                <div className="bg-blue-950/80 p-2.5 rounded-2xl border border-amber-500/30">
                  <span className="text-xl font-black text-amber-400 block">{String(timeLeft.minutes).padStart(2, '0')}</span>
                  <span className="text-[10px] text-slate-300 block font-sans">دقيقة</span>
                </div>
                <div className="bg-blue-950/80 p-2.5 rounded-2xl border border-amber-500/30">
                  <span className="text-xl font-black text-amber-400 block">{String(timeLeft.seconds).padStart(2, '0')}</span>
                  <span className="text-[10px] text-slate-300 block font-sans">ثانية</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Filter className="w-4 h-4 text-amber-500" />
            <span>تصفية العروض والباقات:</span>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div>
              <span className="text-xs text-slate-500 font-bold ml-2">المدينة:</span>
              <select 
                value={selectedCity} 
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
              >
                <option value="الكل">جميع المدن</option>
                <option value="الرياض">الرياض</option>
                <option value="جدة">جدة</option>
                <option value="الدمام">الدمام</option>
              </select>
            </div>

            <div>
              <span className="text-xs text-slate-500 font-bold ml-2">الحد الأقصى للسعر:</span>
              <span className="text-xs font-black text-amber-600 font-mono">{maxPrice.toLocaleString()} ر.س</span>
              <input 
                type="range"
                min="10000"
                max="60000"
                step="2500"
                value={maxPrice}
                onChange={(e) => setMaxPrice(Number(e.target.value))}
                className="w-32 mr-2 accent-amber-500 align-middle cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Bundled Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredBundles.map((bundle) => (
            <div 
              key={bundle.id} 
              className="bg-white rounded-3xl shadow-sm border border-slate-200/80 overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
            >
              <div>
                {/* Image Header with Badges */}
                <div className="relative h-64 overflow-hidden">
                  <img 
                    src={bundle.image} 
                    alt={bundle.title} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent"></div>

                  {/* Top Badges */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span className="bg-amber-500 text-blue-950 font-black text-xs px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5" />
                      {bundle.tag}
                    </span>
                    <span className="bg-blue-950/90 text-white font-bold text-xs px-3 py-1.5 rounded-xl backdrop-blur-md border border-white/20">
                      {bundle.tier}
                    </span>
                  </div>

                  <div className="absolute top-4 left-4">
                    <span className="bg-rose-600 text-white font-extrabold text-xs px-3 py-1.5 rounded-xl shadow-lg">
                      توفير {bundle.savings.toLocaleString()} ر.س
                    </span>
                  </div>

                  {/* Bottom Image Overlay Details */}
                  <div className="absolute bottom-4 right-4 left-4 text-white">
                    <span className="text-xs text-amber-300 font-bold flex items-center gap-1 mb-1">
                      <MapPin className="w-3.5 h-3.5" /> {bundle.city} • السعة: {bundle.capacity}
                    </span>
                    <h3 className="text-xl font-extrabold leading-snug">{bundle.title}</h3>
                  </div>
                </div>

                {/* Bundle Content Details */}
                <div className="p-6 space-y-4">
                  <p className="text-xs font-bold text-slate-500 leading-relaxed">{bundle.subtitle}</p>

                  <div className="space-y-2 pt-2 border-t border-slate-100">
                    <span className="text-xs font-black text-blue-950 block">مكونات الباقة المضمنة المكتملة:</span>
                    <ul className="space-y-1.5">
                      {bundle.includedItems.map((item, idx) => (
                        <li key={idx} className="text-xs text-slate-700 flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Pricing & Booking Footer */}
              <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-4">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block line-through">
                    السعر السابق: {bundle.originalPrice.toLocaleString()} ر.س
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-2xl font-black text-blue-950 font-mono">
                      {bundle.discountedPrice.toLocaleString()}
                    </span>
                    <span className="text-xs font-bold text-slate-600">ر.س (شامل 15% الضريبة)</span>
                  </div>
                </div>

                <RouterLink
                  to={`/halls`}
                  className="bg-blue-950 hover:bg-blue-900 text-white font-extrabold px-6 py-3 rounded-2xl text-xs transition-all shadow-md hover:shadow-lg flex items-center gap-2 shrink-0"
                >
                  <span>احجز الباقة الآن</span>
                  <ArrowRight className="w-4 h-4 rotate-180" />
                </RouterLink>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
