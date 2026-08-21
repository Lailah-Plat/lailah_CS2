import React, { useState, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdBanner } from '../components/AdBanner';
import { 
  Calculator, Sparkles, Building2, Utensils, Camera, Music, ArrowRight, 
  CheckCircle2, DollarSign, Users, Calendar, Info, Layers, ChevronLeft,
  PieChart, Percent, ShieldCheck, Star, MapPin
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { getStoredHalls, getServices, isProviderNameVisible } from '../data/mockData';

export default function EventBudgetPlannerPage() {
  const [totalBudget, setTotalBudget] = useState<number>(35000);
  const [guestCount, setGuestCount] = useState<number>(200);
  const [eventType, setEventType] = useState<string>('زواج');
  const [selectedCity, setSelectedCity] = useState<string>('الرياض');

  // Custom Allocation Percentages
  const [venuePercent, setVenuePercent] = useState<number>(50);
  const [cateringPercent, setCateringPercent] = useState<number>(25);
  const [mediaPercent, setMediaPercent] = useState<number>(10);
  const [soundPercent, setSoundPercent] = useState<number>(10);
  const [extraPercent, setExtraPercent] = useState<number>(5);

  const halls = useMemo(() => {
    return getStoredHalls().filter((h: any) => h.status !== 'pending' && h.status !== 'بانتظار الموافقة' && h.status !== 'pending_approval' && h.adminStatus !== 'pending');
  }, []);
  const services = useMemo(() => {
    return getServices().filter((s: any) => s.status === 'approved' || s.adminStatus === 'approved' || s.status === 'active' || s.status === 'published');
  }, []);

  // Budget Calculations
  const calculatedAllocations = useMemo(() => {
    const venueAmount = Math.round((totalBudget * venuePercent) / 100);
    const cateringAmount = Math.round((totalBudget * cateringPercent) / 100);
    const mediaAmount = Math.round((totalBudget * mediaPercent) / 100);
    const soundAmount = Math.round((totalBudget * soundPercent) / 100);
    const extraAmount = Math.round((totalBudget * extraPercent) / 100);

    // Calculate tax portions (15% VAT included rule)
    const baseAmount = Math.round(totalBudget / 1.15);
    const taxAmount = totalBudget - baseAmount;

    return {
      venueAmount,
      cateringAmount,
      mediaAmount,
      soundAmount,
      extraAmount,
      baseAmount,
      taxAmount,
      perGuestCost: Math.round(totalBudget / (guestCount || 1))
    };
  }, [totalBudget, guestCount, venuePercent, cateringPercent, mediaPercent, soundPercent, extraPercent]);

  // Suggested Matching Halls
  const suggestedHalls = useMemo(() => {
    return halls.filter((hall: any) => {
      const price = Number(hall.price || hall.nightPrice || 0);
      const capacity = Number(hall.capacity || 500);
      const cityMatch = !selectedCity || selectedCity === 'الكل' || hall.city === selectedCity || hall.location === selectedCity;
      
      // Fits within venue budget (+15% tolerance) and meets capacity
      const fitsBudget = price === 0 || price <= calculatedAllocations.venueAmount * 1.15;
      const fitsCapacity = capacity >= guestCount * 0.7;

      return cityMatch && fitsBudget && fitsCapacity;
    }).slice(0, 6);
  }, [halls, selectedCity, calculatedAllocations.venueAmount, guestCount]);

  // Suggested Extra Services
  const suggestedServices = useMemo(() => {
    return services.filter((srv: any) => {
      const price = Number(srv.price || 0);
      const categoryMatch = ['ضيافة وبوفيه', 'تصوير وتوثيق', 'إضاءة وصوتيات', 'تنسيق وزهور'].includes(srv.category);
      return categoryMatch && (price === 0 || price <= calculatedAllocations.cateringAmount + calculatedAllocations.mediaAmount);
    }).slice(0, 4);
  }, [services, calculatedAllocations]);

  const presetBudgets = [
    { label: 'ميزانية اقتصادية (15,000 ر.س)', value: 15000, guests: 100 },
    { label: 'ميزانية متوسطة (35,000 ر.س)', value: 35000, guests: 200 },
    { label: 'ميزانية فاخرة (75,000 ر.س)', value: 75000, guests: 350 },
    { label: 'ميزانية الملكية (120,000 ر.س)', value: 120000, guests: 500 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-10">
        {/* Header Hero Section */}
        <div className="bg-gradient-to-br from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white shadow-xl relative overflow-hidden mb-10 border border-amber-500/20">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3.5 py-1.5 rounded-full text-xs font-bold mb-4">
              <Calculator className="w-4 h-4 text-amber-400" />
              <span>حاسبة ميزانية المناسبة الذكية والتخطيط التفاعلي</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-4 leading-tight">
              خطط ميزانية حفلكم بدقة واحترافية متناهية
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed mb-6">
              أدخل ميزانيتك المتوقعة وعدد ضيوفك، وسيساعدك النظام التفاعلي آلياً على توزيع التكاليف واقتراح القاعات والخدمات المساندة المناسبة لميزانيتك بدقة (شاملة ضريبة القيمة المضافة 15%).
            </p>
          </div>
        </div>

        {/* Input Parameters Form */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-10">
          {/* Controls Panel */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200/80 space-y-6">
              <h2 className="text-xl font-bold text-blue-950 flex items-center gap-2 pb-4 border-b border-slate-100">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span>بيانات المناسبة والميزانية</span>
              </h2>

              {/* Quick Preset Buttons */}
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-2">اختر نموذج ميزانية سريع:</label>
                <div className="grid grid-cols-2 gap-2">
                  {presetBudgets.map((preset, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setTotalBudget(preset.value);
                        setGuestCount(preset.guests);
                      }}
                      className={`text-right p-2.5 rounded-xl border text-xs font-bold transition-all ${
                        totalBudget === preset.value
                          ? 'bg-amber-50 border-amber-500 text-amber-800'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Total Budget Slider & Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                    <DollarSign className="w-4 h-4 text-emerald-600" /> الميزانية الإجمالية (ر.س)
                  </label>
                  <span className="text-xs text-slate-400 font-medium">شاملة 15% الضريبة</span>
                </div>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={totalBudget}
                    onChange={(e) => setTotalBudget(Math.max(1000, Number(e.target.value) || 0))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-black text-blue-950 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-slate-500 font-bold shrink-0 text-sm">ر.س</span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="200000"
                  step="2500"
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              {/* Guest Count */}
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-blue-600" /> عدد الحضور المتوقع
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={guestCount}
                    onChange={(e) => setGuestCount(Math.max(1, Number(e.target.value) || 1))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-base font-bold text-blue-950 focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <span className="text-slate-500 font-bold shrink-0 text-xs">شخص</span>
                </div>
              </div>

              {/* Event Type & City */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">نوع المناسبة</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="زواج">زواج كامل</option>
                    <option value="ملكة">حفل ملكة / خطوبة</option>
                    <option value="تخرج">حفل تخرج</option>
                    <option value="مؤتمر">مؤتمر / اجتماعات</option>
                    <option value="خاصة">حفلة خاصة / عائلية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">المدينة</label>
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="الرياض">الرياض</option>
                    <option value="جدة">جدة</option>
                    <option value="الدمام">الدمام</option>
                    <option value="مكة المكرمة">مكة المكرمة</option>
                    <option value="المدينة المنورة">المدينة المنورة</option>
                  </select>
                </div>
              </div>

              {/* Custom Sliders for Budget Breakdown */}
              <div className="pt-4 border-t border-slate-100 space-y-4">
                <h3 className="text-xs font-extrabold text-slate-800 flex justify-between">
                  <span>توزيع النسب المئوية للمكونات:</span>
                  <span className="text-amber-600">{venuePercent + cateringPercent + mediaPercent + soundPercent + extraPercent}% الإجمالي</span>
                </h3>

                <div className="space-y-3 text-xs">
                  <div>
                    <div className="flex justify-between text-slate-600 font-bold mb-1">
                      <span>إيجار القاعة والمكان ({venuePercent}%)</span>
                      <span className="font-mono text-blue-950">{calculatedAllocations.venueAmount.toLocaleString()} ر.س</span>
                    </div>
                    <input
                      type="range"
                      min="30"
                      max="70"
                      value={venuePercent}
                      onChange={(e) => setVenuePercent(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 font-bold mb-1">
                      <span>الضيافة والبوفيه ({cateringPercent}%)</span>
                      <span className="font-mono text-blue-950">{calculatedAllocations.cateringAmount.toLocaleString()} ر.س</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      value={cateringPercent}
                      onChange={(e) => setCateringPercent(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 font-bold mb-1">
                      <span>التصوير والتوثيق ({mediaPercent}%)</span>
                      <span className="font-mono text-blue-950">{calculatedAllocations.mediaAmount.toLocaleString()} ر.س</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={mediaPercent}
                      onChange={(e) => setMediaPercent(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-600 font-bold mb-1">
                      <span>الإضاءة والصوتيات ({soundPercent}%)</span>
                      <span className="font-mono text-blue-950">{calculatedAllocations.soundAmount.toLocaleString()} ر.س</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="20"
                      value={soundPercent}
                      onChange={(e) => setSoundPercent(Number(e.target.value))}
                      className="w-full accent-amber-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary & Breakdown */}
          <div className="lg:col-span-7 space-y-6">
            {/* Overview Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <span className="text-xs font-bold text-slate-400 block mb-1">إجمالي الميزانية المحددة</span>
                <span className="text-xl md:text-2xl font-black text-blue-950 font-mono">
                  {totalBudget.toLocaleString()} <span className="text-xs font-bold text-slate-500">ر.س</span>
                </span>
                <span className="text-[10px] text-emerald-600 font-bold block mt-1">شاملة 15% الضريبة</span>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80">
                <span className="text-xs font-bold text-slate-400 block mb-1">متوسط التكلفة للضيف</span>
                <span className="text-xl md:text-2xl font-black text-amber-600 font-mono">
                  {calculatedAllocations.perGuestCost.toLocaleString()} <span className="text-xs font-bold text-slate-500">ر.س / ضيف</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">بناءً على {guestCount} ضيف</span>
              </div>

              <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 col-span-2 sm:col-span-1">
                <span className="text-xs font-bold text-slate-400 block mb-1">ضريبة القيمة المضافة (15%)</span>
                <span className="text-xl md:text-2xl font-black text-slate-700 font-mono">
                  {calculatedAllocations.taxAmount.toLocaleString()} <span className="text-xs font-bold text-slate-500">ر.س</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold block mt-1">مخصصة ومحسوبة آلياً</span>
              </div>
            </div>

            {/* Visual Allocation Cards Grid */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
              <h3 className="text-base font-bold text-blue-950 flex items-center justify-between">
                <span>توزيع الميزانية المقترح حسب الفئات:</span>
                <span className="text-xs text-amber-600 font-bold bg-amber-50 px-2.5 py-1 rounded-lg">تخطيط ذكي</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">ميزانية القاعة والمكان</span>
                    <span className="text-base font-black text-blue-950 font-mono">{calculatedAllocations.venueAmount.toLocaleString()} ر.س</span>
                    <span className="text-[10px] text-slate-400 block">({venuePercent}% من الميزانية)</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">ميزانية الضيافة والبوفيه</span>
                    <span className="text-base font-black text-blue-950 font-mono">{calculatedAllocations.cateringAmount.toLocaleString()} ر.س</span>
                    <span className="text-[10px] text-slate-400 block">({cateringPercent}% من الميزانية)</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-purple-100 text-purple-700 rounded-xl flex items-center justify-center shrink-0">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">ميزانية التصوير والتوثيق</span>
                    <span className="text-base font-black text-blue-950 font-mono">{calculatedAllocations.mediaAmount.toLocaleString()} ر.س</span>
                    <span className="text-[10px] text-slate-400 block">({mediaPercent}% من الميزانية)</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center shrink-0">
                    <Music className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 font-bold block">ميزانية الصوتيات والإضاءة</span>
                    <span className="text-base font-black text-blue-950 font-mono">{calculatedAllocations.soundAmount.toLocaleString()} ر.س</span>
                    <span className="text-[10px] text-slate-400 block">({soundPercent}% من الميزانية)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Matching Halls Section */}
            <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-blue-950 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-amber-500" />
                  <span>قاعات ومقرات مطابقة لميزانية المكان ({suggestedHalls.length})</span>
                </h3>
                <Link to="/halls" className="text-xs text-amber-600 font-bold hover:underline flex items-center gap-1">
                  عرض الكل <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                </Link>
              </div>

              {suggestedHalls.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  <p className="text-sm font-bold">لا توجد قاعات مطابقة تماماً للميزانية المحددة في {selectedCity}.</p>
                  <p className="text-xs text-slate-400 mt-1">جرب زيادة الميزانية أو تغيير خيارات المدينة.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {suggestedHalls.map((hall: any) => (
                    <div key={hall.id} className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <img src={hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'} alt={hall.name} className="w-full h-32 rounded-xl object-cover mb-3" />
                        <h4 className="font-extrabold text-blue-950 text-sm mb-1">{hall.name}</h4>
                        <p className="text-xs text-slate-500 flex items-center gap-1 mb-2">
                          <MapPin className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {hall.location || hall.city} • السعة: {hall.capacity || 300} شخص
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-slate-200/60 mt-2">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold">الإيجار المبدأي</span>
                          <span className="text-sm font-black text-amber-600">
                            {Number(hall.price || hall.nightPrice || 0).toLocaleString()} ر.س
                          </span>
                        </div>
                        <Link
                          to={`/hall/${hall.id}`}
                          className="bg-blue-950 hover:bg-blue-900 text-white text-xs font-bold px-3.5 py-1.5 rounded-xl transition-colors"
                        >
                          عرض القاعة
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Budget & Planning Sponsored Offer Banner */}
            <div className="pt-2">
              <AdBanner placement="صفحة حاسبة ميزانية المناسبة" layout="card" className="w-full shadow-sm" />
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
