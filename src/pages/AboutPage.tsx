import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Target, Lightbulb, Users, Award } from 'lucide-react';

export default function AboutPage() {
  const [platformData, setPlatformData] = useState(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { aboutUs: '' };
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow w-full pb-20">
        {/* Hero Section */}
        <div className="bg-blue-950 text-white py-20 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1920&q=80')] bg-cover bg-center"></div>
          <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10 text-center">
            <div className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-blue-950 font-bold text-4xl shadow-xl mx-auto mb-6">ل</div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6">عن منصة ليلة</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
              الوجهة الأولى والموثوقة في المملكة العربية السعودية لحجز وتنظيم أرقى المناسبات، حيث نجمع لك أفضل القاعات ومزودي الخدمات في مكان واحد.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 md:px-6 mt-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center mb-20">
            <div>
              <h2 className="text-3xl font-bold text-blue-950 mb-6 border-r-4 border-amber-500 pr-4">قصتنا</h2>
              {platformData.aboutUs ? (
                <div className="text-slate-600 leading-relaxed text-lg whitespace-pre-wrap ql-editor" dangerouslySetInnerHTML={{__html: platformData.aboutUs}}></div>
              ) : (
                <>
                  <p className="text-slate-600 leading-relaxed text-lg mb-4">
                    بدأت "ليلة" كفكرة بسيطة لحل مشكلة يواجهها الكثيرون: صعوبة العثور على القاعة المناسبة ومزودي الخدمات الموثوقين لتنظيم المناسبات المختلفة.
                  </p>
                  <p className="text-slate-600 leading-relaxed text-lg">
                    اليوم، نفخر بأن نكون المنصة الرائدة التي تربط الباحثين عن التميز بأفضل مقدمي خدمات المناسبات في المملكة، معتمدين على الشفافية، الجودة، والتكنولوجيا المتقدمة لتسهيل رحلة التخطيط.
                  </p>
                </>
              )}
            </div>
            <div className="rounded-3xl overflow-hidden shadow-xl border-4 border-white">
              <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1000&q=80" alt="مناسبات" className="w-full h-auto" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-blue-50 text-blue-950 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-3">رؤيتنا</h3>
              <p className="text-slate-500">أن نكون المرجع الأول والخيار الذكي لكل من يبحث عن تنظيم مناسبة استثنائية.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Lightbulb className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-3">رسالتنا</h3>
              <p className="text-slate-500">توفير تجربة حجز سلسة، آمنة، ومتكاملة من خلال التقنية المبتكرة والخدمة المتميزة.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Users className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-3">قيمنا</h3>
              <p className="text-slate-500">الشفافية، المصداقية، التركيز على العميل، والابتكار المستمر في تقديم الخدمات.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 text-center hover:-translate-y-2 transition-transform duration-300">
              <div className="w-16 h-16 bg-orange-50 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-blue-950 mb-3">جودتنا</h3>
              <p className="text-slate-500">نضمن أعلى معايير الجودة من خلال اختيار شركائنا بعناية وتقييمات العملاء الحقيقية.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
