import React, { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  ShieldCheck, Award, Zap, CheckCircle2, Star, Sparkles, Building2, 
  Clock, FileText, ArrowRight, Heart, Share2, MapPin, Users, Info,
  DollarSign, Camera, Check, ThumbsUp, AlertCircle, Wrench, Shield, FileCheck
} from 'lucide-react';
import { getStoredHalls, getServices, providers, getPartnerLevel } from '../data/mockData';

export default function ProviderTrustProfilePage() {
  const { providerName } = useParams<{ providerName: string }>();
  const decodedProviderName = providerName ? decodeURIComponent(providerName) : 'شركة أطياف لتنظيم المعارض';

  const halls = useMemo(() => getStoredHalls(), []);
  const services = useMemo(() => getServices(), []);

  // Find provider obj from mockData if available
  const matchedProvider = useMemo(() => {
    return providers.find(p => p.name === decodedProviderName || p.name?.includes(decodedProviderName)) || {
      name: decodedProviderName,
      bookingsCount: 184,
      rating: 4.9,
      packageName: 'الباقة الاحترافية',
      packageDuration: 'yearly',
      idNumber: '1010892341',
      taxNumber: '310982341200003'
    };
  }, [decodedProviderName]);

  const partnerLevel = useMemo(() => {
    const pkgDuration = (matchedProvider.packageDuration === 'monthly' || matchedProvider.packageDuration === 'yearly') ? matchedProvider.packageDuration : undefined;
    return getPartnerLevel(matchedProvider.bookingsCount, matchedProvider.rating, true, matchedProvider.packageName, pkgDuration) || {
      name: 'ماسي 💎',
      color: 'text-amber-400',
      bg: 'bg-amber-500/20',
      border: 'border-amber-500/30',
      icon: '💎'
    };
  }, [matchedProvider]);

  // Filter provider halls & services
  const providerHalls = useMemo(() => {
    return halls.filter((h: any) => h.provider === decodedProviderName || h.provider?.includes(decodedProviderName));
  }, [halls, decodedProviderName]);

  const providerServices = useMemo(() => {
    return services.filter((s: any) => s.provider === decodedProviderName || s.provider?.includes(decodedProviderName));
  }, [services, decodedProviderName]);

  // Provider Metrics & Criteria
  const providerStats = {
    tierName: partnerLevel.name || 'ماسي 💎',
    tierCriteriaDescription: 'تم منح هذا المستوى بناءً على تحقيق أكثر من 100 حجز مكتمل بنجاح، ومعدل تقييم عام يتجاوز 4.8/5، ونسبة التزام تتخطى 99% طوال فترة النشاط.',
    responseSpeed: '12 دقيقة ⚡',
    bookingCommitment: '99.8%',
    completedEvents: `${matchedProvider.bookingsCount || 184} مناسبة ناجحة`,
    rating: matchedProvider.rating || 4.9,
    reviewsCount: 142,
    cleanlinessRating: 4.9,
    staffRating: 4.8,
    equipmentRating: 4.7,
    punctualityRating: 5.0,
    crNumber: `${matchedProvider.idNumber || '1010892341'} (معتمد ورسمي)`,
    vatNumber: `${matchedProvider.taxNumber || '310982341200003'} (مسجل لدى ZATCA)`,
    depositPercent: '20% من إجمالي قيمة الحجز عبر المنصة',
    cancellationPolicy: 'إلغاء مجاني وإعادة العربون كاملاً قبل 14 يوماً من موعد المناسبة.',
    damageInsurancePolicy: 'يتم إرجاع مبلغ تأمين الأضرار فورياً وبشكل آلي خلال 24 ساعة من انتهاء المناسبة بعد الفحص السريع.'
  };

  const realGalleryPhotos = [
    {
      url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
      caption: 'حفل زفاف عائلة آل سعود - يوليو 2026',
      reviewer: 'عبدالله العتيبي',
      comment: 'خدمة خيالية والتزام دقيق بكل المواعيد والتفاصيل. القاعة كانت قمة في النظافة.'
    },
    {
      url: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
      caption: 'مؤتمر الاستثمار التقني - يونيو 2026',
      reviewer: 'د. سارة الشمري',
      comment: 'التجهيزات الصوتية وشاشات العرض كانت ممتازة للغاية والتعامل احترافي جداً.'
    },
    {
      url: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
      caption: 'حفل ملكة فاخر - مايو 2026',
      reviewer: 'فهد القحطاني',
      comment: 'الضيافة والبوفيه أثنى عليهم جميع الضيوف بدون استثناء. شكراً لفريق العمل.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />

      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-10 space-y-10">
        {/* Partner Header Hero Profile Card */}
        <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-blue-900 rounded-3xl p-8 md:p-12 text-white shadow-2xl relative overflow-hidden border border-amber-500/30">
          <div className="absolute top-0 left-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="bg-amber-500 text-blue-950 font-black text-xs px-3.5 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" />
                  مستوى الشريك: {providerStats.tierName}
                </span>
                <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold text-xs px-3.5 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  توثيق منصة ليلة ✅
                </span>
              </div>

              <h1 className="text-3xl md:text-5xl font-black leading-tight">
                {decodedProviderName}
              </h1>

              {/* Tier Standards Criteria Explanation */}
              <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15 max-w-2xl text-slate-200 text-xs md:text-sm leading-relaxed space-y-1">
                <span className="font-bold text-amber-300 block">معايير الاعتماد لمستوى {providerStats.tierName}:</span>
                <p>{providerStats.tierCriteriaDescription}</p>
              </div>

              {/* Official Accreditation Badges */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <div className="bg-white/10 text-slate-200 border border-white/20 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  <span>سجل تجاري موثق 🏢</span>
                </div>
                <div className="bg-white/10 text-slate-200 border border-white/20 font-bold text-xs px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                  <span>شهادة هيئة الزكاة والضريبة والجمارك ZATCA 🧾</span>
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/15 text-center space-y-2 shrink-0 w-full md:w-auto shadow-xl">
              <span className="text-4xl font-black text-amber-400 font-mono block">{providerStats.rating} / 5</span>
              <div className="flex justify-center text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="w-4.5 h-4.5 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs text-slate-300 font-bold block">بناءً على {providerStats.reviewsCount} تقييم موثق بالكامل</span>
            </div>
          </div>
        </div>

        {/* Section 1: Performance KPIs & Reliability */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center shrink-0">
              <Zap className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">سرعة الاستجابة والتأكيد</span>
              <span className="text-xl font-black text-blue-950 font-mono">{providerStats.responseSpeed}</span>
              <span className="text-[10px] text-emerald-600 font-bold block mt-1">متوسط زمن الرد على الاستفسارات والتأكيد</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">معدل الالتزام بالحجوزات</span>
              <span className="text-xl font-black text-blue-950 font-mono">{providerStats.bookingCommitment}</span>
              <span className="text-[10px] text-slate-400 font-bold block mt-1">نسبة تنفيذ المناسبات بدون إلغاءات</span>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200/80 flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-100 text-blue-700 rounded-2xl flex items-center justify-center shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-400 block mb-1">خبرة المنصة</span>
              <span className="text-xl font-black text-blue-950 font-mono">{providerStats.completedEvents}</span>
              <span className="text-[10px] text-amber-600 font-bold block mt-1">عدد المناسبات الناجحة المُنفذة عبر ليلة</span>
            </div>
          </div>
        </div>

        {/* Section 2: Rating Breakdown & Financial Transparency */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Granular Quality Ratings Breakdown (7 Cols) */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
            <h2 className="text-xl font-black text-blue-950 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>تحليل التقييمات التفصيلي حسب معايير الجودة</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>🧹 النظافة والتعقيم</span>
                  <span className="font-mono text-amber-600 font-black">{providerStats.cleanlinessRating} / 5</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '98%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>🤝 حسن التعامل والاحترافية</span>
                  <span className="font-mono text-amber-600 font-black">{providerStats.staffRating} / 5</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '96%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>🔊 التجهيزات والتقنيات</span>
                  <span className="font-mono text-amber-600 font-black">{providerStats.equipmentRating} / 5</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
                <div className="flex justify-between text-xs font-bold text-slate-700">
                  <span>⏰ الالتزام بالمواعيد والوقت</span>
                  <span className="font-mono text-amber-600 font-black">{providerStats.punctualityRating} / 5</span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Transparency & Policies (5 Cols) */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
            <h2 className="text-xl font-black text-blue-950 flex items-center gap-2 pb-4 border-b border-slate-100">
              <Shield className="w-5 h-5 text-emerald-600" />
              <span>الشفافية المالية والسياسات المعتمدة</span>
            </h2>

            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200/60 flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-emerald-950 block">ضمان أسعار شاملة لـ 15% VAT وبدون رسوم خفية</span>
                  <span className="text-emerald-800 text-[11px] leading-relaxed block mt-0.5">
                    جميع الأسعار المعروضة نهائية ومطابقة للفاتورة الرسمية الشاملة لضريبة القيمة المضافة بدون أي تكاليف مستترة عند الوصول.
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-2">
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">رقم السجل التجاري:</span>
                  <span className="font-mono font-bold text-blue-950">{providerStats.crNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">الشهادة الضريبية ZATCA:</span>
                  <span className="font-mono font-bold text-blue-950">{providerStats.vatNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-bold text-slate-600">سياسة العربون:</span>
                  <span className="font-mono font-bold text-amber-600">{providerStats.depositPercent}</span>
                </div>
              </div>

              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200/70 space-y-2">
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-amber-950 block">استرداد تأمين الأضرار والمرونة:</span>
                    <span className="text-amber-900 text-[11px] block mt-1 leading-relaxed">
                      {providerStats.damageInsurancePolicy}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Verified Real Events Gallery */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex justify-between items-center flex-wrap gap-2">
            <h2 className="text-xl font-extrabold text-blue-950 flex items-center gap-2">
              <Camera className="w-5 h-5 text-amber-500" />
              <span>معرض صور ومقاطع فيديو حقيقية لمناسبات سابقة</span>
            </h2>
            <span className="text-xs text-slate-400 font-bold">صور موثقة أقيمت بالفعل مع تعليقات وتجارب العائلات</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {realGalleryPhotos.map((photo, idx) => (
              <div key={idx} className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50/50 hover:shadow-lg transition-all">
                <img src={photo.url} alt={photo.caption} className="w-full h-48 object-cover" />
                <div className="p-4 space-y-2">
                  <span className="text-xs font-black text-blue-950 block">{photo.caption}</span>
                  <p className="text-xs text-slate-600 italic leading-relaxed">"{photo.comment}"</p>
                  <span className="text-[10px] text-amber-600 font-extrabold block">— العميل: {photo.reviewer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Halls & Properties Provided by Provider */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-blue-950 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-amber-500" />
              <span>الأماكن والقاعات المعتمدة التابعة للمزود ({providerHalls.length})</span>
            </h2>
          </div>

          {providerHalls.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed">
              لا تتوفر قاعات معروضة لهذا المزود حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {providerHalls.map((hall: any) => (
                <div key={hall.id} className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50/50 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <img src={hall.image || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80'} alt={hall.name} className="w-full h-40 object-cover" />
                    <div className="p-4">
                      <h3 className="font-extrabold text-blue-950 text-base mb-1">{hall.name}</h3>
                      <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" /> {hall.location || hall.city} • السعة: {hall.capacity || 300} شخص
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-blue-950 font-mono">
                      {Number(hall.price || hall.nightPrice || 0).toLocaleString()} ر.س
                    </span>
                    <Link
                      to={`/hall/${hall.id}`}
                      className="bg-blue-950 hover:bg-blue-900 text-white font-bold text-xs px-4 py-2 rounded-xl transition-colors"
                    >
                      عرض تفاصيل القاعة
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 5: Independent Services Provided by Provider */}
        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-blue-950 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-amber-500" />
              <span>الخدمات المساندة المستقلة التابعة للمزود ({providerServices.length})</span>
            </h2>
          </div>

          {providerServices.length === 0 ? (
            <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed text-xs font-bold">
              لا تتوفر خدمات مساندة مستقلة مضافة لهذا المزود حالياً.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {providerServices.map((service: any) => (
                <div key={service.id} className="rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-50/50 hover:shadow-lg transition-all flex flex-col justify-between">
                  <div>
                    <img src={service.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'} alt={service.name} className="w-full h-40 object-cover" />
                    <div className="p-4 space-y-1">
                      <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full inline-block">
                        {service.category || 'خدمة مساندة'}
                      </span>
                      <h3 className="font-extrabold text-blue-950 text-base">{service.name}</h3>
                      <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                        {service.description || 'خدمة احترافية أعلى معايير التنفيذ والالتزام.'}
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                    <span className="text-sm font-black text-blue-950 font-mono">
                      {Number(service.price || 0).toLocaleString()} ر.س
                    </span>
                    <Link
                      to="/services"
                      className="bg-amber-500 hover:bg-amber-600 text-blue-950 font-extrabold text-xs px-4 py-2 rounded-xl transition-colors"
                    >
                      طلب الخدمة
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}

