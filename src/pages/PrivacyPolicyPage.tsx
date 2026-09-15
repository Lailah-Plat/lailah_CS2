import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Shield, Lock, Clock, CheckCircle2 } from 'lucide-react';

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

export default function PrivacyPolicyPage() {
  const [doc, setDoc] = useState<LegalDocData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/legal/content/privacy_policy')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.data) {
          setDoc(data.data);
        }
      })
      .catch(err => {
        console.warn('Failed to load privacy document:', err);
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
      <div className="bg-gradient-to-b from-blue-950 to-slate-900 text-white py-16 px-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
            <Shield className="w-4 h-4" />
            <span>الامتثال لنظام حماية البيانات الشخصية (PDPL)</span>
            {doc?.version && (
              <span className="font-mono bg-emerald-500 text-slate-950 px-2 py-0.5 rounded-full text-[10px]">
                v{doc.version}
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
            {doc?.title || 'سياسة الخصوصية وحماية البيانات الشخصية'}
          </h1>
          
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
            {doc?.subtitle || 'بيان الامتثال لنظام حماية البيانات الشخصية السعودي (PDPL) واللوائح الصادرة عن سدايا'}
          </p>

          {doc?.publishedAt && (
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <Clock className="w-3.5 h-3.5" />
              <span>تاريخ النفاذ والسريان: {new Date(doc.publishedAt).toLocaleDateString('ar-SA')}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Container */}
      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-6 w-full -mt-6 pb-20">
        <div className="bg-white rounded-3xl p-6 sm:p-10 md:p-12 shadow-sm border border-slate-200/80 space-y-8">
          
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-xs font-bold text-slate-500">جاري تحميل وثيقة الخصوصية الرسمية...</p>
            </div>
          ) : (
            <>
              {/* Intro Text */}
              {doc?.introText && (
                <div className="bg-emerald-50/60 border border-emerald-200/80 p-5 sm:p-6 rounded-2xl text-slate-800 text-sm sm:text-base leading-relaxed">
                  <p>{doc.introText}</p>
                </div>
              )}

              {/* Dynamic Sections from Legal CMS */}
              {sections.length > 0 ? (
                <div className="space-y-8 divide-y divide-slate-100">
                  {sections.map((sec, idx) => (
                    <div key={sec.id || idx} className={idx > 0 ? 'pt-8' : ''}>
                      <h2 className="text-xl sm:text-2xl font-bold text-blue-950 mb-4 border-r-4 border-emerald-500 pr-3">
                        {sec.title}
                      </h2>
                      <div className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                        {sec.content}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback if no sections */
                <div className="text-slate-700 leading-relaxed text-sm sm:text-base whitespace-pre-wrap">
                  {doc?.contentAr || 'نلتزم في منصة ليلة بحماية البيانات والخصوصية لكافة المستخدمين والشركاء وفق نظام حماية البيانات الشخصية المعمول به في المملكة العربية السعودية.'}
                </div>
              )}

              {/* Footer Meta */}
              <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
                <span>
                  آخر تحديث رسمي: {doc?.publishedAt ? new Date(doc.publishedAt).toLocaleDateString('ar-SA') : '1 يناير 2026'}
                </span>
                {doc?.version && (
                  <span className="font-semibold bg-slate-100 text-slate-700 px-3 py-1 rounded-full">
                    رقم الإصدار: v{doc.version}
                  </span>
                )}
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
}
