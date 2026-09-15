import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Sparkles, Heart, ShieldCheck, Zap, Award, CheckCircle2, Building, Users } from 'lucide-react';

interface LegalSection {
  id: string;
  title: string;
  content: string;
  orderIndex?: number;
  order?: number;
  isPublished?: boolean;
  isActive?: boolean;
  requiredCapability?: string | null;
}

interface LegalDocData {
  id: number;
  documentType: string;
  version: string;
  title: string;
  subtitle?: string;
  introText?: string;
  contentAr?: string;
  contentEn?: string;
  sections?: LegalSection[];
  status: string;
  publishedAt?: string;
  effectiveAt?: string;
}

export default function AboutPage() {
  const [doc, setDoc] = useState<LegalDocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/legal/content/about_us')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setDoc(data.data);
        }
      })
      .catch(err => {
        console.warn('Failed to load about us document:', err);
      })
      .finally(() => setLoading(false));
  }, []);

  const sections = (doc?.sections || [])
    .filter(s => s.isPublished !== false && s.isActive !== false)
    .sort((a, b) => ((a.orderIndex ?? a.order ?? 0) - (b.orderIndex ?? b.order ?? 0)));

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col text-right" dir="rtl">
      <Header />
      
      {/* Top Banner */}
      <div className="bg-gradient-to-b from-blue-950 via-slate-900 to-slate-950 text-white py-20 px-4">
        <div className="max-w-4xl mx-auto space-y-5 text-center sm:text-right">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>المنصة السعودية الرائدة لمناسبات استثنائية</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            {doc?.title || 'من نحن — قصة منصة ليلة'}
          </h1>
          
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl leading-relaxed">
            {doc?.subtitle || 'المنظومة الرقمية المتكاملة لحجز قاعات المناسبات وإدارة الخدمات المساندة بالمملكة'}
          </p>
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-6 w-full -mt-8 pb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200/80 space-y-10">
          
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">جاري تحميل المعلومات الرسمية للمنصة...</p>
            </div>
          ) : (
            <>
              {/* Intro Text */}
              {doc?.introText && (
                <div className="bg-gradient-to-l from-amber-500/10 via-amber-50/50 to-transparent border-r-4 border-amber-500 p-6 rounded-2xl text-slate-800 text-base sm:text-lg leading-relaxed font-medium">
                  <p>{doc.introText}</p>
                </div>
              )}

              {/* Dynamic Sections from Legal CMS */}
              {sections.length > 0 ? (
                <div className="space-y-10 divide-y divide-slate-100">
                  {sections.map((sec, idx) => (
                    <div key={sec.id || idx} className={idx > 0 ? 'pt-10' : ''}>
                      <h2 className="text-2xl font-bold text-blue-950 mb-4 flex items-center gap-3">
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                        <span>{sec.title}</span>
                      </h2>
                      <div className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                        {sec.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback if no sections */
                <div className="text-slate-700 leading-relaxed text-base whitespace-pre-wrap">
                  {doc?.contentAr || 'منصة ليلة هي المنصة السعودية الرائدة المتخصصة في حجز قاعات الأفراح والمناسبات وإدارة الخدمات المساندة.'}
                </div>
              )}

              {/* Core Value Highlights */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-100">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <ShieldCheck className="w-6 h-6 text-emerald-600 mx-auto" />
                  <h4 className="font-black text-slate-900 text-sm">ضمان وثبات الحجوزات</h4>
                  <p className="text-xs text-slate-500">حماية تعاقدية ولقطة أسعار موثقة وفواتير ضريبية نظامية</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Zap className="w-6 h-6 text-amber-500 mx-auto" />
                  <h4 className="font-black text-slate-900 text-sm">سرعة ومرونة الحجز</h4>
                  <p className="text-xs text-slate-500">تأكيد فوري وخيارات تفويض مسبق وحلول إلغاء وجدولة عادلة</p>
                </div>

                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2">
                  <Award className="w-6 h-6 text-blue-600 mx-auto" />
                  <h4 className="font-black text-slate-900 text-sm">جودة وامتثال معتمد</h4>
                  <p className="text-xs text-slate-500">شركاء موثقون ومعايير سلامة وترخيص متوافقة مع الأنظمة</p>
                </div>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
