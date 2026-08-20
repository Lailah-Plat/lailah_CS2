import React, { useState } from 'react';
import { 
  Sparkles, Megaphone, Video, Copy, Check, Share2, 
  Send, RefreshCw, Layers, Wand2, Hash, Play, Eye, 
  FileText, Lightbulb, Zap, ArrowRight, CheckCircle2 
} from 'lucide-react';

interface AIMarketingStudioProps {
  halls?: any[];
  services?: any[];
  providers?: any[];
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  currentUser?: any;
}

export function AIMarketingStudio({
  halls = [],
  services = [],
  providers = [],
  showNotification
}: AIMarketingStudioProps) {
  // Input parameters state
  const [selectedChannel, setSelectedChannel] = useState<'snapchat' | 'meta' | 'tiktok' | 'whatsapp' | 'google' | 'x'>('snapchat');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('weddings');
  const [selectedTone, setSelectedTone] = useState<string>('royal');
  const [selectedEntityName, setSelectedEntityName] = useState<string>('');
  const [customOffer, setCustomOffer] = useState<string>('خصم 20% على باقات نهاية الأسبوع مع ضيافة مجانية وباقة كوشة ملكية');
  const [city, setCity] = useState<string>('الرياض');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Generated campaign kit output state
  const [generatedKit, setGeneratedKit] = useState<{
    headline: string;
    hook: string;
    bodyCopy: string;
    videoConcept: {
      scene1: string;
      scene2: string;
      scene3: string;
      audioPrompt: string;
    };
    cta: string;
    hashtags: string[];
    generatedAt: string;
  }>({
    headline: 'ليلة عمرك في مكان يليق بفخامتك.. احجز قصر الملكة بعرض حصري!',
    hook: 'تبحثين عن قاعة تجمع بين الهيبة والضيافة النجدية الأصيلة بدون تعقيد الحجوزات؟',
    bodyCopy: 'اجعل ليلة زفافك ذكرى استثنائية لا تُنسى في أرقى قاعات الرياض. استمتع بمساحات رحبة وديكورات ساحرة وضيافة متكاملة تليق بضيوفك الكرام. وثّق حجزك الآن عبر منصة "ليلة" بعقد رقمي موثق وضمان مالي كامل وبسعر حصري يشمل الضيافة وباقة الكوشة الملكية مجاناً.',
    videoConcept: {
      scene1: 'لقطة افتتاحية سينمائية بطيئة لمدخل القاعة مع إضاءة دافئة وثرية كريستالية مبهرة (0:00 - 0:03).',
      scene2: 'استعراض طاولة الضيافة الفاخرة وترتيبات المائدة وتنسيق الورد الطبيعي الفاخر (0:03 - 0:08).',
      scene3: 'انتقال لشاشة الجوال تظهر سهولة الحجز وتأكيد التاريخ فورياً عبر منصة ليلة بخصم 20% (0:08 - 0:15).',
      audioPrompt: 'موسيقى وترية هادئة ممتزجة بصوت عذب يرحب بضيوف الفرح بأسلوب راقٍ ومطمئن.'
    },
    cta: 'احجز موعد المعاينة الآن واستفد من خصم 20% المؤقت',
    hashtags: ['#أعراس_الرياض', '#قاعات_ليلة', '#زواج_فخم', '#ليلة_العمر', '#منصة_ليلة', '#مناسبات_المملكة'],
    generatedAt: 'محدث تلقائياً'
  });

  const channelsList = [
    { id: 'snapchat', name: 'سناب شات (Snapchat Ads)', desc: 'فيديو عمودي 9:16 + نصوص خاطفة' },
    { id: 'meta', name: 'إنستغرام وفيسبوك (Meta)', desc: 'كاروسيل + بوست مرئي فاخر' },
    { id: 'tiktok', name: 'تيك توك (TikTok Trends)', desc: 'سيناريو تفاعلي سريع وتحديات' },
    { id: 'whatsapp', name: 'رسائل واتساب المباشرة', desc: 'نصوص تسويقية شخصية مقنعة' },
    { id: 'google', name: 'إعلانات بحث جوجل (Google Ads)', desc: 'عناوين ووصف بحث عالي التحويل' },
    { id: 'x', name: 'منصة X (تويتر)', desc: 'تغريدات ترويجية وهاشتاقات متصدرة' }
  ];

  const occasionsList = [
    { id: 'weddings', label: '💍 حفلات زفاف وأعراس كبرى' },
    { id: 'engagement', label: '✨ حفلات ملكة وخطوبة وعقد قران' },
    { id: 'graduation', label: '🎓 مناسبات التخرج والاحتفالات الأكاديمية' },
    { id: 'corporate', label: '🏢 مؤتمرات واجتماعات قطاع الأعمال والشركات' },
    { id: 'national_events', label: '🇸🇦 عروض اليوم الوطني، التأسيس، والأعياد' }
  ];

  const tonesList = [
    { id: 'royal', label: '👑 ملكية وفاخرة (فخامة وهيبة ورقي)' },
    { id: 'joyful', label: '🎉 حماسية ومبهجة (فرح وسرور وحيوية)' },
    { id: 'fomo', label: '⏳ عرض حصري ومستعجل (FOMO وفرصة محدودة)' },
    { id: 'corporate', label: '🤝 رسمية وموثوقة (احترافية وضمان)' }
  ];

  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const entity = selectedEntityName || 'قصر الفخامة الملكي للمناسبات';
      
      let headline = '';
      let hook = '';
      let bodyCopy = '';
      let cta = '';
      let hashtags: string[] = [];

      if (selectedTone === 'royal') {
        headline = `ليلة استثنائية تليق بمقامكم في ${entity}.. حيث تلتقي الفخامة بالضيافة النجدية الفاخرة.`;
        hook = `لأن ليلة العمر لا تتكرر.. اختر المكان الذي يبهر ضيوفك ويخلّد ذكراكم بأرقى تفاصيل الرقي.`;
        bodyCopy = `يسر ${entity} بمدينة ${city} بالتعاون مع منصة ليلة تقديم باقة احتفالية متكاملة تشمل ${customOffer}. احجز تاريخك المميز الآن واستمتع بعقود رقمية موثقة وضمان الحجز الفوري مع أفضل خبراء تنسيق الاحتفالات.`;
        cta = 'احجز موعد المعاينة الملكية واستلم عرض السعر الفوري';
        hashtags = ['#فخامة_الأعراس', `#قاعات_${city}`, '#ليلة_الملكية', '#زفاف_فاخر', '#منصة_ليلة'];
      } else if (selectedTone === 'fomo') {
        headline = `⏳ مقاعد وتواريخ محدودة جداً! احصل على ${customOffer} في ${entity}!`;
        hook = `تخطط لزواجك في موسم الذروة؟ لا تفوّت آخر 3 أيام متاحة بهذا السعر الاستثنائي!`;
        bodyCopy = `فرصة حصرية غير مسبوقة في ${entity} بـ ${city}! احجز الآن عبر منصة ليلة واحصل على ${customOffer}. العرض سارٍ لأول 5 حجوزات مؤكدة فقط لهذا الشهر.`;
        cta = 'ثبّت حجزك الآن قبل نفاد التواريخ المتاحة';
        hashtags = ['#عروض_الأعراس', '#حجز_مستعجل', `#أعراس_${city}`, '#خصم_خاص', '#ليلة'];
      } else if (selectedTone === 'joyful') {
        headline = `الفرحة تكمل في ${entity} 🎉.. شارك أحبابك أجمل لحظات العمر!`;
        hook = `تبغى ليلة تملأها البهجة والذكريات السعيدة بدون أي قلق تشغيلي؟`;
        bodyCopy = `نحن في ${entity} نهتم بأدق التفاصيل لتستمتع بكل لحظة من فرحتك. بالتعاون مع منصة ليلة، نقدم لكم ${customOffer} لتكون ليلتكم عامرة بالمسرات والأناقة.`;
        cta = 'اختر التاريخ وتواصل معنا فوراً لتأكيد الحجز';
        hashtags = ['#فرحة_العمر', '#أجمل_الليالي', `#أعراس_${city}`, '#منصة_ليلة'];
      } else {
        headline = `التنظيم الاحترافي والتميز التشغيلي في ${entity} - شريككم المعتمد للمؤتمرات والفعاليات.`;
        hook = `ابحث عن بيئة متكاملة تضمن نجاح فعاليتكم ومؤتمراتكم بكفاءة تامة وتجهيزات ذكية متطورة.`;
        bodyCopy = `توفر ${entity} في ${city} أحدث التقنيات الصوتية والمرئية، مساحات متعددة الاستخدام، وإدارة ضيافة احترافية تلبي أعلى معايير الجودة المؤسسية، مع إمكانية التعاقد والفواتير الضريبية عبر منصة ليلة.`;
        cta = 'اطلب عرض الأسعار المؤسسي والملف التعريفي';
        hashtags = ['#فعاليات_الأعمال', '#مؤتمرات_المملكة', `#قاعات_${city}`, '#منصة_ليلة'];
      }

      setGeneratedKit({
        headline,
        hook,
        bodyCopy,
        videoConcept: {
          scene1: `مشهد خاطف عالي الدقة يبرز جمالية مدخل ${entity} في ${city} مع إبراز الإضاءة الترحيبية وتجهيزات الحفل.`,
          scene2: `لقطة تفاعلية للضيافة مع عرض تفاصيل العرض: "${customOffer}".`,
          scene3: `إظهار تطبيق منصة ليلة مع شارة "حجز مؤكد فوري وضمان دفع آمن عبر مدى وسداد".`,
          audioPrompt: `مؤثر صوتي ملهم متناغم مع نبرة الخطاب (${selectedTone}) يعزز مشاعر الثقة والإعجاب.`
        },
        cta,
        hashtags,
        generatedAt: new Date().toLocaleTimeString('ar-SA')
      });

      setIsGenerating(false);
      if (showNotification) {
        showNotification('success', '✨ تم توليد الخطة التسويقية والمحتوى الإعلاني بالذكاء الاصطناعي بنجاح!');
      }
    }, 600);
  };

  const copyToClipboard = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    if (showNotification) {
      showNotification('info', '📋 تم نسخ النص بنجاح إلى الحافظة.');
    }
    setTimeout(() => setCopiedSection(null), 2000);
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-6 rounded-3xl border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black mb-2 border border-indigo-400/30">
              <Sparkles className="w-4 h-4 text-indigo-400 animate-spin" />
              <span>محرّك الذكاء الاصطناعي الإعلاني المتخصص لسوق الأعراس والمناسبات</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              استوديو المحتوى والتسويق الذكي (AI Growth Studio) 🪄
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              صناعة متكاملة للحملات الترويجية، صياغة النصوص المقنعة، وسيناريوهات الفيديو الخاطفة لجميع منصات التواصل بمراعاة كاملة للثقافة والخصوصية المحلية.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Wand2 className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'جاري الصياغة والتوليد...' : 'توليد المحتوى الإعلاني فورياً'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Controls Engine */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>1. معايير وضبط الحملة الإعلانية</span>
            </h3>

            {/* Target Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">منصة النشر المستهدفة:</label>
              <div className="grid grid-cols-2 gap-2">
                {channelsList.map(ch => (
                  <button
                    key={ch.id}
                    onClick={() => setSelectedChannel(ch.id as any)}
                    className={`p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      selectedChannel === ch.id 
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-black shadow-sm' 
                        : 'border-slate-200 bg-slate-50/60 text-slate-600 hover:bg-slate-100 font-medium'
                    }`}
                  >
                    <p className="text-xs font-bold">{ch.name}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{ch.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Occasion */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">نوع المناسبة والتصنيف:</label>
              <select
                value={selectedOccasion}
                onChange={e => setSelectedOccasion(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              >
                {occasionsList.map(occ => (
                  <option key={occ.id} value={occ.id}>{occ.label}</option>
                ))}
              </select>
            </div>

            {/* Tone of Voice */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">نبرة الخطاب الإعلاني (Tone of Voice):</label>
              <select
                value={selectedTone}
                onChange={e => setSelectedTone(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
              >
                {tonesList.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>

            {/* Entity Selection & City */}
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">اسم القاعة أو المزود:</label>
                <input
                  type="text"
                  placeholder="مثال: قصر الملكة للمناسبات"
                  value={selectedEntityName}
                  onChange={e => setSelectedEntityName(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">المدينة المستهدفة:</label>
                <select
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                >
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام والخبر">الدمام والخبر</option>
                  <option value="مكة المكرمة">مكة المكرمة</option>
                  <option value="المدينة المنورة">المدينة المنورة</option>
                  <option value="كافة مدن المملكة">كافة مدن المملكة</option>
                </select>
              </div>
            </div>

            {/* Custom Special Offer */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">العرض الترويجي والخصم المميز:</label>
              <textarea
                rows={2}
                value={customOffer}
                onChange={e => setCustomOffer(e.target.value)}
                placeholder="اكتب تفاصيل العرض (مثال: خصم 20% + كوشة مجانية...)"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Sparkles className={`w-4 h-4 text-amber-300 ${isGenerating ? 'animate-spin' : ''}`} />
              <span>{isGenerating ? 'جاري التحليل والتوليد...' : 'تحديث وتوليد الحزمة الإعلانية بالذكاء الاصطناعي'}</span>
            </button>
          </div>
        </div>

        {/* Right Column: Generated Campaign Kit */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">مخرجات الحزمة الإعلانية الجاهزة للنشر</h3>
                  <p className="text-xs text-slate-500">تم التخصيص لمنصة {channelsList.find(c => c.id === selectedChannel)?.name}</p>
                </div>
              </div>
              <span className="text-[11px] bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full font-bold">
                جاهزة للنسخ والنشر المباشر ✅
              </span>
            </div>

            {/* 1. Campaign Headline */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 relative group">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-indigo-600" />
                  1. العنوان الإعلاني الجاذب (Headline)
                </span>
                <button
                  onClick={() => copyToClipboard(generatedKit.headline, 'headline')}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {copiedSection === 'headline' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'headline' ? 'تم النسخ' : 'نسخ العنوان'}</span>
                </button>
              </div>
              <p className="text-sm font-black text-slate-900 leading-relaxed font-sans">{generatedKit.headline}</p>
            </div>

            {/* 2. Visual Hook */}
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  2. خطاف جذب الانتباه في أول 3 ثوانٍ (Visual Hook)
                </span>
                <button
                  onClick={() => copyToClipboard(generatedKit.hook, 'hook')}
                  className="px-2.5 py-1 bg-white border border-amber-200 text-amber-900 hover:text-amber-700 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {copiedSection === 'hook' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'hook' ? 'تم النسخ' : 'نسخ الخطاف'}</span>
                </button>
              </div>
              <p className="text-xs font-bold text-amber-900 leading-relaxed">{generatedKit.hook}</p>
            </div>

            {/* 3. Primary Copy & Body */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <Megaphone className="w-3.5 h-3.5 text-indigo-600" />
                  3. النص الترويجي الأساسي (Primary Copy & Body)
                </span>
                <button
                  onClick={() => copyToClipboard(generatedKit.bodyCopy, 'body')}
                  className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 hover:text-indigo-600 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {copiedSection === 'body' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'body' ? 'تم النسخ' : 'نسخ النص الكامل'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed font-sans whitespace-pre-line">{generatedKit.bodyCopy}</p>
            </div>

            {/* 4. Video Concept & Storyboard */}
            <div className="p-4 bg-indigo-50/40 rounded-2xl border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-indigo-950 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-indigo-600" />
                  4. فكرة وسيناريو الفيديو الإعلاني (Storyboard)
                </span>
                <button
                  onClick={() => copyToClipboard(`${generatedKit.videoConcept.scene1}\n${generatedKit.videoConcept.scene2}\n${generatedKit.videoConcept.scene3}`, 'video')}
                  className="px-2.5 py-1 bg-white border border-indigo-200 text-indigo-900 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                >
                  {copiedSection === 'video' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSection === 'video' ? 'تم النسخ' : 'نسخ السيناريو'}</span>
                </button>
              </div>
              <div className="space-y-2 text-xs text-slate-700">
                <div className="p-2.5 bg-white rounded-xl border border-indigo-50 flex items-start gap-2">
                  <span className="font-black text-indigo-600 shrink-0">مشهد 1:</span>
                  <p>{generatedKit.videoConcept.scene1}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-indigo-50 flex items-start gap-2">
                  <span className="font-black text-indigo-600 shrink-0">مشهد 2:</span>
                  <p>{generatedKit.videoConcept.scene2}</p>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-indigo-50 flex items-start gap-2">
                  <span className="font-black text-indigo-600 shrink-0">مشهد 3:</span>
                  <p>{generatedKit.videoConcept.scene3}</p>
                </div>
                <div className="text-[11px] text-indigo-900 font-bold p-2 bg-indigo-100/50 rounded-lg">
                  🎵 الموجه الصوتي والموسيقي: {generatedKit.videoConcept.audioPrompt}
                </div>
              </div>
            </div>

            {/* 5. CTA & Hashtags */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-emerald-900">5. عبارة الحث على الإجراء (CTA)</span>
                  <button
                    onClick={() => copyToClipboard(generatedKit.cta, 'cta')}
                    className="text-[10px] text-emerald-800 hover:underline cursor-pointer font-bold"
                  >
                    نسخ
                  </button>
                </div>
                <p className="text-xs font-bold text-emerald-950 font-sans">{generatedKit.cta}</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-800 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-indigo-600" />
                    6. الهاشتاقات الأكثر رواجاً
                  </span>
                  <button
                    onClick={() => copyToClipboard(generatedKit.hashtags.join(' '), 'tags')}
                    className="text-[10px] text-indigo-600 hover:underline cursor-pointer font-bold"
                  >
                    نسخ الكل
                  </button>
                </div>
                <div className="flex flex-wrap gap-1">
                  {generatedKit.hashtags.map((tag, idx) => (
                    <span key={idx} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-indigo-700">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
