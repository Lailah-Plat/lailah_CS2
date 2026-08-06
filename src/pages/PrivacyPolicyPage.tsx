import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function PrivacyPolicyPage() {
  const [platformData] = useState(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { privacyPolicy: '' };
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-6 w-full py-16">
        <h1 className="text-4xl font-bold text-blue-950 mb-8 border-r-4 border-amber-500 pr-4">سياسة الخصوصية</h1>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="prose prose-slate max-w-none prose-headings:text-blue-950 prose-a:text-amber-600">
            {platformData.privacyPolicy ? (
              <div className="whitespace-pre-wrap text-slate-600 leading-relaxed text-lg ql-editor" dangerouslySetInnerHTML={{__html: platformData.privacyPolicy}}></div>
            ) : (
              <>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  تحترم منصة ليلة خصوصيتك وتلتزم بحماية بياناتك الشخصية. توضح هذه السياسة كيف نقوم بجمع واستخدام وحماية معلوماتك عند استخدام منصتنا.
                </p>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">1. الامتثال التشريعي ونطاق الخصوصية</h3>
                <p className="text-sm sm:text-base text-slate-650 mb-6 leading-relaxed">
                  تلتزم منصة ليلة بحماية حقوق الخصوصية للمستخدمين والشركاء بشكل مطلق. نعلن صراحة امتثالنا وعملنا بموجب <strong>"نظام حماية البيانات الشخصية" (Personal Data Protection Law - PDPL)</strong> الصادر في المملكة العربية السعودية بالمرسوم الملكي رقم (م/19) وتعديلاته، واللوائح التنفيذية الصادرة عن الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا - SDAIA) ومكتب إدارة البيانات الوطنية (NDMO).
                </p>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">2. تصنيف وتفصيل البيانات التي يتم جمعها</h3>
                <div className="space-y-4 mb-6 text-sm sm:text-base text-slate-600 leading-relaxed">
                  <p>
                    نقوم بجمع وتجهيز البيانات الشخصية والمهنية الضرورية فقط لتشغيل المنصة وربط أطراف الخدمة بشكل قانوني سليم:
                  </p>
                  <ul className="list-disc pr-6 space-y-3">
                    <li>
                      <strong>أ) بيانات العملاء والمستخدمين العامة:</strong> تشمل الاسم الثلاثي، رقم الجوال الموثق، البريد الإلكتروني، المدينة، وتواريخ المناسبات المحجوزة.
                    </li>
                    <li>
                      <strong>ب) وثائق الفحص القانوني ومرسلات التسوية والمستندات الطارئة:</strong> في غضون استخدامك لخدمة "بروتوكول الإلغاء للظروف القاهرة"، يلتزم العميل برفع مستندات ثبوتية (كتقارير طبية رسمية، شهادات وفاة، تقارير حوادث مرورية تابعة لنجم). تُخزن هذه الوثائق الفائقة الحساسية تحت حماية تشفير معقدة طوال فترة التحقق والتحكيم الودي، وتخضع لبروتوكول وصول معزول ومحاط بالسرية الكاملة.
                    </li>
                    <li>
                      <strong>ج) بيانات التحقق المالي واللوجستي للمزودين والشركاء:</strong> تشمل السجل التجاري للشخصية الاعتبارية، شهادة تسجيل ضريبة القيمة المضافة، شهادة الآيبان البنكي الصادرة من بنوك سعودية معتمدة، وهوية المفوض بالتوقيع.
                    </li>
                    <li>
                      <strong>د) البيانات التقنية وبيانات التصفح (Cookies & Logs):</strong> مثل عنوان بروتوكول الإنترنت (IP)، نوع المتصفح، لغة النظام، وملفات تعريف الارتباط الضرورية لتحسين الأداء وحفظ الجلسات وتأمين حسابك من الاختراق.
                    </li>
                  </ul>
                </div>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">3. أغراض استخدام ومعالجة البيانات والأساس النظامي</h3>
                <p className="text-sm sm:text-base text-slate-650 mb-4 leading-relaxed">
                  نحن لا نعالج أي بيانات دون موافقة صريحة من العميل أو بهدف تنفيذ التزامات تعاقدية وخدمية محددة:
                </p>
                <ul className="list-disc pr-6 space-y-2 mb-6 text-sm text-slate-600">
                  <li><strong>تسهيل تلبية وإصدار عقود الحجز:</strong> نقوم بمشاركة بياناتك الأساسية (الاسم، ورقم الجوال) مع مزود القاعة أو منسق الحفل المُختص لتمكينه من تجهيز مستلزمات الحفل وتنظيم الدخول والتواصل السليم.</li>
                  <li><strong>معالجة المعاملات المالية الآمنة:</strong> تتم معالجة البيانات المالية وبطاقات الائتمان ومدى بالكامل من خلال قنوات مشفرة وبوابات دفع مرخصة وخاضعة لأعلى معايير الأمن السيبراني <strong>PCI-DSS</strong> وبتعميمات البنك المركزي السعودي (SAMA). لا تقوم منصة ليلة بتخزين أرقام بطاقات الدفع أو الرموز السرية CVV الخاصة بك في قواعد بياناتها الإطلاقاً.</li>
                  <li><strong>تحديث ومواءمة المنصة:</strong> استخدام بيانات الموقع والتصفح لتقديم عروض ترويجية جغرافية مفيدة بالقرب من موقعك الجغرافي.</li>
                </ul>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">4. فترات الاحتفاظ بالبيانات وسياسة التطهير والإتلاف (Data Purging)</h3>
                <p className="text-sm sm:text-base text-slate-650 mb-6 leading-relaxed">
                  تلتزم منصة ليلة بالاحتفاظ بالبيانات الشخصية طوال المدة النظامية المقررة لخدمتك، أو لاستيفاء المتطلبات القانونية المنصوص عليها بنظام مكافحة غسيل الأموال السعودي والأنظمة الضريبية لمصلحة الزكاة والجمارك (والتي قد تتطلب الاحتفاظ بسجلات المعاملات المالية لمدد تصل إلى 10 سنوات). فور زوال الأثر النظامي أو بناء على طلب صريح ومثبت من العميل، يتم تشغيل إجراء "التطهير والإتلاف والتشفير اللارجعي" للمستندات والملفات الشخصية من خوادم السحاب بشكل آمن ودائم.
                </p>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">5. حقوقك بموجب نظام حماية البيانات الشخصية السعودي (PDPL)</h3>
                <p className="text-sm sm:text-base text-slate-650 mb-4 leading-relaxed">
                  بموجب النظام، يحق لك ممارسة الحقوق القانونية التالية عبر التواصل مع مسؤول حماية البيانات الشخصية داخل المنصة:
                </p>
                <ul className="list-disc pr-6 space-y-2 mb-6 text-sm text-slate-600">
                  <li><strong>حق العلم والشفافية:</strong> معرفة الأساس النظامي لجمع بياناتك وطرق معالجتها ونوعية الجهات التي يتم مشاركتها معها.</li>
                  <li><strong>حق الوصول والاطلاع:</strong> الحصول على نسخة واضحة ومقروءة من بياناتك الشخصية المتاحة بالنظام.</li>
                  <li><strong>حق التصحيح والطلب:</strong> طلب تعديل، تحديث، أو تصحيح أي بيانات غير دقيقة أو ناقصة مسجلة في ملفك الشخصي.</li>
                  <li><strong>حق الإتلاف والنسيان الإذاعي:</strong> طلب حذف وتطهير بياناتك الشخصية عند انتهاء الغرض المهني أو سحب موافقتك الصريحة على المعالجة.</li>
                </ul>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">6. مشاركة البيانات والإفصاح للغير</h3>
                <p className="text-sm sm:text-base text-slate-650 mb-4 leading-relaxed">
                  تحظر المنصة بيع أو تأجير أي بيانات شخصية لأطراف ثالثة لأغراض دعائية وتجريبية. ويتم الإفصاح فقط في الحالات الحصرية القانونية التالية:
                </p>
                <ul className="list-disc pr-6 space-y-2 mb-6 text-sm text-slate-600">
                  <li>تنفيذ القانون والامتثال للأوامر القضائية والأمنية الصادرة من المحاكم والهيئات التنظيمية في المملكة.</li>
                  <li>بوابات الدفع الإلكتروني المعتمدة للتحقق من أمان ومصداقية الحركات المالية.</li>
                  <li>لمزودي الخدمات اللوجستية ومجموعات الضيافة المختارين صراحة من قبل العميل في فاتورة طلبه الحالية لغرض إكمال المأدبة وقضاء الخدمة على الوجه الأكمل.</li>
                </ul>

                <h3 className="text-2xl font-bold mt-10 mb-4">6. التغييرات على هذه السياسة</h3>
                <p className="mb-6">
                  قد نقوم بتحديث سياسة الخصوصية من وقت لآخر. سيتم نشر أي تغييرات على هذه الصفحة وتحديث تاريخ "آخر تعديل". استمرارك في استخدام المنصة بعد هذه التغييرات يعنى موافقتك عليها.
                </p>
              </>
            )}
            
            <p className="text-sm text-slate-400 mt-12 bg-slate-50 p-4 rounded-xl">
              آخر تحديث: 1 يناير 2026
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
