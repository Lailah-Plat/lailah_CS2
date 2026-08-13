/**
 * @file LPASPageRenderer.tsx
 * @description Dynamic, high-converting Landing Page Renderer component for Lailah LPAS.
 * Renders any LPAS landing page with responsive typography, value benefits, testimonials, FAQs,
 * and direct friction-free registration routing.
 */

import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, CalendarCheck, TrendingUp, ShieldCheck, 
  BarChart3, Sparkles, ChevronDown, Check, ArrowLeft, Star, 
  CheckCircle2, MapPin, Coffee, Camera, Utensils, Megaphone, 
  Tag, Crown, Rocket, Gift, Lock, Sliders, Layers, Headphones, 
  UserPlus, FileText, BadgeCheck, Grid, Menu, Heart, Navigation,
  HelpCircle, Share2, Eye
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { LPASLandingPage } from '../../types/lpas';
import { storeLPASAttribution } from '../../data/lpasData';

interface LPASPageRendererProps {
  page: LPASLandingPage;
  onNavigateToRegistration: (context?: {
    providerType?: 'VENUE' | 'SERVICE_PROVIDER' | 'ALL';
    defaultCategory?: string;
    defaultCity?: string;
    landingPageId?: string;
  }) => void;
  onViewOtherPages?: () => void;
}

export const LPASPageRenderer: React.FC<LPASPageRendererProps> = ({
  page,
  onNavigateToRegistration,
  onViewOtherPages
}) => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [copiedLink, setCopiedLink] = useState(false);

  // Store attribution context on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    storeLPASAttribution(page, params);
  }, [page]);

  // Helper icon lookup
  const renderIcon = (iconName: string, className: string = "w-6 h-6") => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className={className} />;
      case 'CalendarCheck': return <CalendarCheck className={className} />;
      case 'ShieldCheck': return <ShieldCheck className={className} />;
      case 'BarChart3': return <BarChart3 className={className} />;
      case 'Building2': return <Building2 className={className} />;
      case 'CalendarRange': return <CalendarCheck className={className} />;
      case 'Coins': return <TrendingUp className={className} />;
      case 'PieChart': return <BarChart3 className={className} />;
      case 'Utensils': return <Utensils className={className} />;
      case 'Coffee': return <Coffee className={className} />;
      case 'Camera': return <Camera className={className} />;
      case 'Crown': return <Crown className={className} />;
      case 'Rocket': return <Rocket className={className} />;
      case 'Megaphone': return <Megaphone className={className} />;
      case 'MapPin': return <MapPin className={className} />;
      case 'Navigation': return <Navigation className={className} />;
      case 'UserPlus': return <UserPlus className={className} />;
      case 'FileText': return <FileText className={className} />;
      case 'BadgeCheck': return <BadgeCheck className={className} />;
      case 'Sliders': return <Sliders className={className} />;
      case 'Layers': return <Layers className={className} />;
      case 'Lock': return <Lock className={className} />;
      case 'Grid': return <Grid className={className} />;
      case 'Headphones': return <Headphones className={className} />;
      default: return <Sparkles className={className} />;
    }
  };

  const handleStartCTA = () => {
    onNavigateToRegistration({
      providerType: page.targetProviderType,
      defaultCategory: page.targetCategoryId !== 'all' ? page.targetCategoryId : undefined,
      defaultCity: page.targetCityId !== 'all' ? page.targetCityId : undefined,
      landingPageId: page.id
    });
  };

  const handleCopyShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans dir-rtl" dir="rtl">
      
      {/* 1. TOP ANNOUNCEMENT & ATTRIBUTION BAR */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 py-2 px-4 text-center text-xs font-black flex items-center justify-between gap-2 shadow-md">
        <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
          <div className="flex items-center gap-2">
            <span className="bg-slate-950 text-amber-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase">
              LPAS ACTIVE CAMPAIGN
            </span>
            <span>{page.badgeText || '🚀 انضم إلى منصة ليلة لشركاء المناسبات 2026'}</span>
          </div>

          <div className="flex items-center gap-3">
            {onViewOtherPages && (
              <button
                onClick={onViewOtherPages}
                className="bg-slate-950/20 hover:bg-slate-950/40 text-slate-950 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>استكشف دليل صفحات الهبوط (LPAS)</span>
              </button>
            )}
            <button
              onClick={handleCopyShare}
              className="bg-slate-950 text-amber-300 hover:bg-slate-900 px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copiedLink ? 'تم نسخ الرابط!' : 'مشاركة الصفحة'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. HEADER NAVIGATION */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950 font-black text-xl tracking-tighter">
              ليلة
            </div>
            <div>
              <span className="text-base font-black tracking-tight text-white block">منصة ليلة</span>
              <span className="text-[10px] font-mono text-amber-400 block -mt-1 font-bold">LAILAH PROVIDER NETWORK</span>
            </div>
          </div>

          {/* Nav Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleStartCTA}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-5 py-2.5 rounded-xl text-xs font-black transition-all cursor-pointer shadow-lg shadow-amber-400/20 flex items-center gap-2 hover:scale-[1.02]"
            >
              <span>انضم كمزود الآن</span>
              <ArrowLeft className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800/80">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Hero Copy */}
            <div className="lg:col-span-7 space-y-6 text-right">
              
              {/* Category/City Tag */}
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-xs font-black">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{page.subtitle}</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight tracking-tight">
                {page.heroHeadline}
              </h1>

              {/* Subheadline */}
              <p className="text-sm sm:text-base text-slate-300 font-medium leading-relaxed max-w-2xl">
                {page.heroSubheadline}
              </p>

              {/* Primary Call to Action Card */}
              <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/80 space-y-4 max-w-xl backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={handleStartCTA}
                    className="w-full sm:w-auto flex-1 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 py-3.5 px-6 rounded-xl font-black text-sm transition-all cursor-pointer shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2"
                  >
                    <span>{page.primaryCTATtext}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  {page.secondaryCTATtext && (
                    <a
                      href="#benefits"
                      className="w-full sm:w-auto px-5 py-3.5 bg-slate-700/60 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs text-center transition-all border border-slate-600"
                    >
                      {page.secondaryCTATtext}
                    </a>
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-700/60">
                  <span className="flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    <span>تأكيد فوري ودعم معتمد</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                    <span>حماية البيانات والتحصيل 100%</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="relative rounded-3xl overflow-hidden border border-slate-700/80 shadow-2xl bg-slate-800 group">
                <img
                  src={page.heroImageUrl}
                  alt={page.title}
                  className="w-full h-80 sm:h-96 object-cover group-hover:scale-105 transition-all duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent"></div>

                {/* Floating Badge on Image */}
                <div className="absolute bottom-4 right-4 left-4 bg-slate-900/90 backdrop-blur-md p-4 rounded-2xl border border-slate-700/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-white">{page.title}</span>
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full font-mono">
                      {page.targetProviderType === 'VENUE' ? 'منظومة القاعات' : page.targetProviderType === 'SERVICE_PROVIDER' ? 'خدمات مساندة' : 'شريك معتمد'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-medium">
                    لوحة تحكم موحدة ومتكيفة + محرك حجز مباشر وتقويم توفر ذكي.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. VALUE BENEFITS GRID */}
      <section id="benefits" className="py-16 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-amber-400 text-xs font-black uppercase tracking-widest block font-mono">
              WHY JOIN LAILAH PLATFORM
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              لماذا تختار منصة ليلة لتطوير وتنمية أعمالك؟
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              صُممت المنصة خصيصاً لتلائم متطلبات السوق السعودي في قطاع المناسبات والأفراح.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
            {page.benefits.map((benefit) => (
              <div 
                key={benefit.id}
                className="bg-slate-900/90 p-6 rounded-2xl border border-slate-800 hover:border-amber-400/50 transition-all hover:-translate-y-1 space-y-4 relative group"
              >
                <div className="w-12 h-12 rounded-xl bg-amber-400/10 border border-amber-400/20 text-amber-400 flex items-center justify-center group-hover:scale-110 transition-all">
                  {renderIcon(benefit.iconName, "w-6 h-6")}
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-black text-white">{benefit.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {benefit.description}
                  </p>
                </div>

                {benefit.highlightText && (
                  <div className="pt-3 border-t border-slate-800 text-[11px] font-black text-amber-400 font-mono">
                    ✦ {benefit.highlightText}
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 5. PROCESS STEPS (HOW IT WORKS) */}
      <section className="py-16 bg-slate-900/60 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12 text-center">
          
          <div className="space-y-3 max-w-3xl mx-auto">
            <span className="text-amber-400 text-xs font-black uppercase tracking-widest block font-mono">
              SIMPLE ONBOARDING FLOW
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              خطوات الانضمام والتدشين في ٤ خطوات بسيطة
            </h2>
            <p className="text-xs sm:text-sm text-slate-400 font-medium">
              بدون أي تعقيدات تقنية، يمكنك بدء استقبال الطلبات خلال وقت قياسي.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-right">
            {page.processSteps.map((step) => (
              <div key={step.stepNumber} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4 relative">
                <div className="flex items-center justify-between">
                  <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center font-mono">
                    {step.stepNumber}
                  </span>
                  <div className="text-slate-500">
                    {renderIcon(step.iconName, "w-5 h-5")}
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-black text-white">{step.title}</h3>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* 6. KEY FEATURES & RULES */}
      <section className="py-16 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 p-8 sm:p-12 rounded-3xl border border-indigo-900/40 space-y-8">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6">
              <div className="space-y-2 text-right">
                <span className="text-amber-400 text-xs font-black font-mono">ADVANCED ENTERPRISE ENGINE</span>
                <h3 className="text-2xl font-black text-white">الميزات التشغيلية المتقدمة لبيئة العمل الموحدة</h3>
              </div>

              <button
                onClick={handleStartCTA}
                className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-6 py-3 rounded-xl font-black text-xs transition-all shrink-0 cursor-pointer shadow-lg shadow-amber-400/20"
              >
                تفعيل حسابك والبدء الآن
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-right">
              {page.keyFeatures.map((feat, idx) => (
                <div key={idx} className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-amber-400">
                      {renderIcon(feat.iconName, "w-5 h-5")}
                    </div>
                    {feat.badgeText && (
                      <span className="bg-indigo-900/60 text-indigo-300 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono border border-indigo-800">
                        {feat.badgeText}
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-black text-white">{feat.title}</h4>
                  <p className="text-xs text-slate-400 font-medium leading-relaxed">
                    {feat.description}
                  </p>
                </div>
              ))}
            </div>

          </div>
        </div>
      </section>

      {/* 7. TESTIMONIALS */}
      {page.testimonials && page.testimonials.length > 0 && (
        <section className="py-16 bg-slate-900/40 border-b border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10 text-center">
            <div className="space-y-2">
              <span className="text-amber-400 text-xs font-black font-mono uppercase">SUCCESS STORIES</span>
              <h2 className="text-2xl sm:text-3xl font-black text-white">ماذا يقول شركاؤنا عن تجربتهم مع منصة ليلة؟</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
              {page.testimonials.map((t) => (
                <div key={t.id} className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex text-amber-400 gap-1">
                      {[...Array(t.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="bg-amber-400/10 text-amber-300 text-[10px] font-black px-2.5 py-0.5 rounded-full font-mono">
                      {t.highlightTag}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed italic">
                    "{t.quote}"
                  </p>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-black text-white block">{t.providerName}</span>
                      <span className="text-slate-400 font-medium text-[11px]">{t.businessName}</span>
                    </div>
                    <span className="text-slate-500 font-mono text-[11px]">{t.city}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="py-16 bg-slate-950 border-b border-slate-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center space-y-2">
            <span className="text-amber-400 text-xs font-black font-mono uppercase">FREQUENTLY ASKED QUESTIONS</span>
            <h2 className="text-2xl font-black text-white">الأسئلة الشائعة حول الانضمام</h2>
          </div>

          <div className="space-y-3">
            {page.faqItems.map((faq, idx) => (
              <div 
                key={idx}
                className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(openFaqIndex === idx ? null : idx)}
                  className="w-full p-5 text-right font-black text-sm text-white flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/50 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{faq.question}</span>
                  </span>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${openFaqIndex === idx ? 'rotate-180 text-amber-400' : ''}`} />
                </button>

                <AnimatePresence>
                  {openFaqIndex === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="px-5 pb-5 text-xs text-slate-300 font-medium leading-relaxed border-t border-slate-800/60 pt-3"
                    >
                      {faq.answer}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. BOTTOM CONVERSION CTA BANNER */}
      <section className="py-20 bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-600 text-slate-950">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-950/20 text-slate-950 font-black text-xs font-mono">
            <span>READY TO GROW YOUR BUSINESS?</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            هل أنت جاهز لتسريع نمو مبيعاتك واستقبال الحجوزات؟
          </h2>

          <p className="text-sm font-bold text-slate-900 max-w-2xl mx-auto leading-relaxed">
            انضم الآن إلى ليلة وسجل نشاطك التجاري في دقائق لتصل إلى آلاف العملاء الباحثين عن قاعات وخدمات مناسباتهم.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={handleStartCTA}
              className="w-full sm:w-auto bg-slate-950 hover:bg-slate-900 text-amber-300 py-4 px-8 rounded-2xl font-black text-base transition-all shadow-2xl cursor-pointer hover:scale-105 flex items-center justify-center gap-2"
            >
              <span>انضم كمزود وسجل نشاطك الآن</span>
              <ArrowLeft className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* 10. FOOTER */}
      <footer className="bg-slate-950 py-8 border-t border-slate-800 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-slate-300">منصة ليلة للمناسبات</span>
            <span>— جميع الحقوق محفوظة © 2026</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400 font-medium">
            <span>شروط الانضمام</span>
            <span>•</span>
            <span>سياسة الخصوصية والعزل</span>
            <span>•</span>
            <span>الدعم الفني والشركاء</span>
          </div>
        </div>
      </footer>

    </div>
  );
};
