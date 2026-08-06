import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { ChevronDown, ChevronUp } from 'lucide-react';

export default function FaqPage() {
  const [platformData] = useState(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { faq: '' };
  });

  const parseFaqs = (text: string) => {
    if (!text) return null;
    const parsed = [];
    const lines = text.split('\n');
    let currentQ = '';
    let currentA = '';
    for (const line of lines) {
      if (line.trim().startsWith('س:') || line.trim().startsWith('سؤال:')) {
        if (currentQ) parsed.push({ question: currentQ.replace(/^(س:|سؤال:)\s*/, ''), answer: currentA.replace(/^(ج:|إجابة:)\s*/, '').trim() });
        currentQ = line;
        currentA = '';
      } else if (line.trim().startsWith('ج:') || line.trim().startsWith('إجابة:')) {
        currentA = line + '\n';
      } else if (currentA) {
        currentA += line + '\n';
      } else if (currentQ) {
        currentQ += '\n' + line;
      }
    }
    if (currentQ) parsed.push({ question: currentQ.replace(/^(س:|سؤال:)\s*/, ''), answer: currentA.replace(/^(ج:|إجابة:)\s*/, '').trim() });
    return parsed.length > 0 ? parsed : null;
  };

  const dynamicFaqs = parseFaqs(platformData.faq);

  const defaultFaqs = [
    {
      question: 'كيف يمكنني حجز قاعة أو خدمة تنظيم عبر المنصة؟',
      answer: 'يمكنك تصفح قاعات الأفراح واستراحات المناسبات عبر صفحة "الاستكشاف"، واختيار التاريخ المطلوب من خلال ميزة "التقويم الذكي" لمعرفة التوفر الفوري. بمجرد النقر على "حجز"، تختار الخدمات المساندة المرغوبة كالتزيين والصبابين واللوجستيك، ثم تسدد العربون أو الدفعة المقررة إلكترونياً لتأكيد حجزك رسمياً وإصدار العقد التلقائي.'
    },
    {
      question: 'ما هي سياسة نافذة الـ 24 ساعة السماحية المشروطة لإلغاء الحجز؟',
      answer: 'تتيح منصة ليلة نافذة سماح مدتها 24 ساعة تبدأ من تاريخ ووقت تأكيد الحجز، يمكن خلالها إلغاء الطلب تلقائياً واسترداد كامل الرسوم مجاناً (لعلاج حالات الأخطاء العفوية). ويُستثنى من هذه النافذة أي حجز تكون المناسبة الفعلية متبقٍ عليها أقل من (72 ساعة) حيث يُصنف كأمر فوري عاجل غير قابل للنافذة لحفظ حقوق الشركاء.'
    },
    {
      question: 'ما هو (رصيد الجدولة المؤجل) وكيف يحمي المدخرات والحقوق المالية؟',
      answer: 'عند إلغاء الحجز خارج نافذة السماحية المعتادة، لا تضيع أموالك هباءً. بل يتم تحويل النسبة المستحقة إلى قسيمة رصيد دفتري مغلق (Rescheduling Voucher) داخل محفظتك بالمنصة، تكون صالحة بالكامل وجاهزة للخصم التلقائي لإعادة جدولة الحجز لنفس الشريك التجاري خلال مهلة تترواح من 6 أشهر إلى 36 شهراً بالتنسيق الودي.'
    },
    {
      question: 'تعرضت لظرف طارئ شديد وقاهر، كيف أقدم مستندات ثبوتية للحصول على استرداد استثنائي؟',
      answer: 'نمتاز في منصة ليلة بـ "بروتوكول الظروف القاهرة الإنساني". إذا واجهتك قوة قاهرة (كوارث طبيعية، لجان طبية طارئة، صيانة عاجلة سيادية)، يمكنك النقر على زر "طلب إلغاء لظرف قاهر" وإرفاق الوثائق الثبوتية الرسمية المصدقة. تقوم لجنة الحوكمة بالمنصة بمراجعة الطلب مع الشريك خلال 24 ساعة واعتماد قسيمة رصيد مؤجلة بالكامل أو إعادة تسييل المبلغ لو تم حجز اليوم مجدداً من قِبل عميل آخر.'
    },
    {
      question: 'سجلت كشريك/مزود خدمة (قاعة، منسق، خدمات لوجستية)، كيف أحصل على أموالي ومستحقاتي؟',
      answer: 'نسعد بتمكين شركائنا النجاح. يحتفظ نظام الأمانة والوساطة التقنية (Escrow Ledger) بالمنصة بجميع الدفعات المقدمة، وعند إتمام الحفل والتنفيذ الناجح دون أي عقبات، يتم تصفية مستحقات الموفر فورياً وتحويلها آلياً إلى حسابه البنكي المسجل بالنظام بعد اقتطاع الرسوم الإدارية أو اشتراك الباقة المحددة.'
    },
    {
      question: 'هل أسعار الخدمات المعروضة في المنصة مطابقة للواقع وهل تشمل الضريبة المضافة؟',
      answer: 'نعم، تخضع كافة الأسعار وتحديثاتها لمراقبة وتدقيق دوري من منسقي ليلة لضمان مطابقتها بدقة لأسعار السوق الواقعية، كما نوفر عروضاً حصرية مخصصة فقط لمستخدمي منصتنا. الأسعار تشمل ضريبة القيمة المضافة ما لم يذكر الشريك غير ذلك صراحة في بند تفاصيل عرضه.'
    },
    {
      question: 'كيف يضمن النظام عدم تعارض المواعيد عبر ميزة التقويم الذكي؟',
      answer: 'يمثل التقويم الذكي العصب التقني لمنصة ليلة. بمجرد تأكيد حجز قاعة ليوم محدد، يتم حظر وإقفال هذا التاريخ فوراً وتلقائياً عبر كافة الواجهات للمستخدمين لمنع حدوث أي حجز مزدوج (Double Booking). كما يرتبط لوجستياً مع بوابات المنسقين ومقدمي الدعم لضمان جاهزيتهم التامة.'
    },
    {
      question: 'أنا مصور أو منسق حفلات، هل يلزم الحصول على تصاريح للتصوير بالدرون؟',
      answer: 'نعم صراحةً، يعد تشغيل طائرات التصوير الجوي "الدرون" خاضعاً لقوانين الطيران المدني والأمني الصارم بالمملكة العربية السعودية. يلتزم مقدم خدمة التصوير بحيازة رخص تشغيل سارية، كما يلتزم العميل بالحصول على تصريح التصوير المؤقت لليوم المحدد لمقاطعة ومقر حفل الزفاف لضمان سلامة التنفيذ الخالي من أي مشكلات.'
    },
    {
      question: 'كيف تحمى منصة ليلة بيانات بطاقاتي الائتمانية والوثائق الرسمية التي أرفعها؟',
      answer: 'نطبق أعلى درجات حماية وسرية البيانات المشروطة بنظام حماية البيانات الشخصية السعودي (PDPL). يتم حماية الوثائق الرسمية والتقارير الطبية المرفوعة بخوادم مشفرة معزولة تماماً لا يحق لأحد الاطلاع عليها إلا لجنة الحوكمة المحدودة بالمنصة. كما يتم معالجة الحركات المالية عبر بوابات مشفرة بالكامل دون حفظ أرقام بطاقتك أو معلوماتها السرية لدى المنصة.'
    },
    {
      question: 'في حال وجود خلاف أو تدني في جودة الخدمة، كيف يتم حله عبر المنصة؟',
      answer: 'لدينا لوحة "تظلم وفض نزاع" متطورة. يمكنك تسجيل شكوى مدعومة بالصور والفيديوهات، لتتدخل لجنة المنصة كطرف وسيط محايد للفصل المهني وفق بنود شروط الاستخدام وعقود المنصة، ويكون اقتراح الصلح ملزماً لإعادة الأموال وحظر الأطراف المقصرة لضمان بقاء مجتمع ليلة مثالاً للرقي والاحترافية.'
    }
  ];

  const faqs = defaultFaqs;

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-6 w-full py-16">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-blue-950 mb-4">الأسئلة الشائعة</h1>
          <p className="text-slate-500 text-lg">جمعنا لك إجابات لأكثر الأسئلة التي تصلنا من عملائنا</p>
        </div>
        
        <div className="space-y-4">
          {platformData.faq ? (
             <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
               <div className="prose prose-slate max-w-none prose-headings:text-blue-950 prose-a:text-amber-600 ql-editor" dangerouslySetInnerHTML={{__html: platformData.faq}}></div>
             </div>
          ) : (
            faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`bg-white rounded-2xl shadow-sm border transition-all duration-300 overflow-hidden ${openIndex === index ? 'border-amber-500 ring-1 ring-amber-500' : 'border-slate-200'}`}
              >
                <button 
                  onClick={() => toggleFaq(index)}
                  className="w-full px-6 py-5 text-right flex justify-between items-center focus:outline-none"
                >
                  <h3 className={`font-bold text-lg ${openIndex === index ? 'text-amber-600' : 'text-blue-950'}`}>
                    {faq.question}
                  </h3>
                  {openIndex === index ? (
                    <ChevronUp className="w-5 h-5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                  )}
                </button>
                
                <div 
                  className={`px-6 overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
                >
                  <p className="text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-16 bg-blue-50 rounded-3xl p-8 text-center border border-blue-100">
          <h4 className="text-xl font-bold text-blue-950 mb-3">لم تجد إجابة لسؤالك؟</h4>
          <p className="text-slate-600 mb-6">فريق خدمة العملاء متواجد لمساعدتك والإجابة على أي استفسارات أخرى.</p>
          <a href="/contact" className="inline-block bg-blue-950 hover:bg-blue-900 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-md">
            تواصل معنا
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
