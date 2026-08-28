import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';

export default function TermsPage() {
  const [platformData] = useState(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_DATA');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return { termsAndConditions: '' };
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto px-4 md:px-6 w-full py-16">
        <h1 className="text-4xl font-bold text-blue-950 mb-8 border-r-4 border-amber-500 pr-4">الشروط والأحكام</h1>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 shadow-sm border border-slate-100">
          <div className="prose prose-slate max-w-none prose-headings:text-blue-950 prose-a:text-amber-600">
            {platformData.termsAndConditions ? (
              <div className="whitespace-pre-wrap text-slate-600 leading-relaxed text-lg ql-editor" dangerouslySetInnerHTML={{__html: platformData.termsAndConditions}}></div>
            ) : (
              <>
                <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                  مرحباً بك في منصة ليلة. باستخدامك للمنصة، فإنك توافق على الالتزام بالشروط والأحكام الموضحة أدناه. يُرجى قراءتها بعناية.
                </p>

                <h3 className="text-2xl font-bold mt-10 mb-4">1. التعريفات</h3>
                <ul className="list-disc pr-6 space-y-2 mb-6">
                  <li><strong>المنصة:</strong> تعني منصة وتطبيق ليلة لحجز قاعات الأفراح والاستراحات وخدمات المناسبات.</li>
                  <li><strong>المستخدم/العميل:</strong> أي شخص يقوم بإنشاء حساب بهدف تصفح أو حجز الخدمات.</li>
                  <li><strong>مزود الخدمة:</strong> الجهة (قاعة، استراحة، شاليه، مزود خدمة) التي تعرض خدماتها عبر المنصة.</li>
                </ul>

                <h3 className="text-2xl font-bold mt-10 mb-4">2. الحجز والدفع</h3>
                <ul className="list-disc pr-6 space-y-2 mb-6">
                  <li>تعتبر الحجوزات مؤكدة فقط بعد إتمام عملية دفع "العربون" أو المبلغ كاملاً حسب سياسة مزود الخدمة المعني.</li>
                  <li>الأسعار المعروضة في المنصة تشمل ضريبة القيمة المضافة ما لم يُنص على خلاف ذلك.</li>
                  <li>في حال وجود خطأ تقني في تسعير خدمة معينة، يحق للمنصة إلغاء الحجز برد كامل المبلغ المدفوع.</li>
                </ul>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">3. سياسة الإلغاء والاسترجاع المتكاملة (النموذج الهجين)</h3>
                <div className="bg-slate-50 border border-slate-200/80 p-8 rounded-3xl mb-8 space-y-6 text-slate-700">
                  <p className="text-base leading-relaxed font-medium text-slate-800">
                    تعتمد منصة ليلة نظاماً تعاقدياً هجيناً لحل النزاعات المالية وإجراءات الإلغاء، يهدف إلى خلق معادلة عادلة ومتوازنة (Win-Win Solution) تحمي السيولة والتدفقات النقدية لمزودي الخدمة (القاعات والمنسقين) من جهة، وتحفظ مدخرات العملاء وحقوقهم في الحالات الطارئة من جهة أخرى، مع تصفير تكلفة الخسائر ورسوم بوابات الدفع الإلكتروني.
                  </p>
                  
                  {/* البند الأول */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                    <h4 className="text-lg font-bold text-blue-950 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      أولاً: نافذة الـ 24 ساعة السماحية المشروطة (Conditional 24-Hour Grace Window)
                    </h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      هذه النافذة مخصصة لعلاج الحجوزات الخاطئة العفوية وتعارض المواعيد الفوري دون فرض أي غرامات، وتخضع للقواعد التنظيمية والقانونية التالية:
                    </p>
                    <ul className="list-disc pr-6 space-y-2 text-sm text-slate-600">
                      <li><strong>صلاحية الإلغاء:</strong> يحق للعميل إلغاء الحجز تلقائياً واسترجاع كامل مبلغ الدفعة المقدمة (العربون/المبلغ كاملاً) إلى وسيلة الدفع الأصلية خلال 24 ساعة فقط من لحظة تأكيد الحجز وإصدار العقد في النظام.</li>
                      <li><strong>الشرط المانع لحماية المواسم (The Safeguard Rule):</strong> يُستثنى من هذه النافذة أي حجز يقع تاريخ مناسبته الفعلي في غضون أقل من <strong>(72 ساعة)</strong> من وقت إجراء الحجز. في هذه الحالة يُصنف كـ <span className="text-amber-700 font-semibold">"حجز عاجل ونهائي" (Instant Last-Minute Booking)</span> غير قابل للنافذة السماحية الإلغائية لحماية القاعة من تجميد المواعيد والتواريخ الحرجة في الأيام الأخيرة.</li>
                    <li><strong>رسوم الاسترجاع:</strong> يتم إرجاع الأموال كاملة، مع خصم رسوم التحويل التقنية لبوابات الدفع الإلكتروني (إن وُجدت وخضعت لسياسات البنك المركزي).</li>
                    </ul>
                  </div>

                  {/* البند الثاني */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                    <h4 className="text-lg font-bold text-blue-950 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      ثانياً: السياسة التدرجية العامة لطلب الإلغاء وعقود الحجز والمدفوعات
                    </h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      في حال رغبة العميل بالإلغاء بعد انقضاء نافذة الـ 24 ساعة السماحية، يتم تطبيق الشروط المالية التدرجية تلقائياً بحسب المدة الزمنية المتبقية على موعد المناسبة الفعلي:
                    </p>
                    <div className="overflow-x-auto my-3">
                      <table className="w-full text-right text-xs sm:text-sm border-collapse border border-slate-100">
                        <thead>
                          <tr className="bg-slate-50 text-blue-950">
                            <th className="p-3 border border-slate-100">المهلة المتبقية للموعد الفعلي</th>
                            <th className="p-3 border border-slate-100">خيار الاسترداد النقدي لحساب البطاقة</th>
                            <th className="p-3 border border-slate-100">خيار الاسترداد والتحويل للمحفظة الداخلية</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="p-3 border border-slate-100 font-semibold text-slate-705">14 يوماً أو أكثر</td>
                            <td className="p-3 border border-slate-100 text-teal-600 font-medium">استرداد كامل (100% كاش)</td>
                            <td className="p-3 border border-slate-100 text-teal-600 font-medium font-semibold">تحويل كامل للمحفظة (100% رصيد)</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="p-3 border border-slate-100 font-semibold text-slate-705">من 7 أيام إلى 13 يوماً</td>
                            <td className="p-3 border border-slate-100 text-amber-700">خصم 50% رسوم إدارية واسترجاع 50% نقداً</td>
                            <td className="p-3 border border-slate-100 text-teal-600 font-medium">تحويل كامل للمبلغ (100% رصيد جدولة)</td>
                          </tr>
                          <tr>
                            <td className="p-3 border border-slate-100 font-semibold text-slate-705">من 4 أيام إلى 6 أيام</td>
                            <td className="p-3 border border-slate-100 text-rose-600">غير قابل للاسترداد النقدي كاش (0%)</td>
                            <td className="p-3 border border-slate-100 text-amber-700 font-semibold">خصم 25% رسوم إدارية وتحويل 75% رصيد جدولة</td>
                          </tr>
                          <tr className="bg-slate-50/50">
                            <td className="p-3 border border-slate-100 font-semibold text-slate-705">3 أيام أو أقل (72 ساعة فأقل)</td>
                            <td className="p-3 border border-slate-100 text-rose-600">غير قابل للاسترداد النقدي (0%)</td>
                            <td className="p-3 border border-slate-100 text-rose-600">غير قابل للاسترداد وتجميد الرصيد بالكامل (0%)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* البند الثالث */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                    <h4 className="text-lg font-bold text-blue-950 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      ثالثاً: دورة حياة رصيد محفظة جدولة الحجوزات المؤجل (Rescheduling Credit Wallet)
                    </h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      يمثل هذا البند الحل الذكي والإنساني لمطالب العملاء الذين يتعرضون لظروف مفاجئة ويضطرون للإلغاء في أوقات حرجة يمنع فيها النظام التلقائي الاسترداد النقدي، وذلك لحفظ حقوق وجدية الحجوزات وفق دورة حياة ثلاثية الأطوار:
                    </p>
                    <ul className="list-disc pr-6 space-y-2 text-sm text-slate-600">
                      <li><strong>مفهوم تحويل الرصيد (Credit Voucher):</strong> يحول المبلغ المستحق بنسبته إلى رصيد دفتري محجوز (Held Ledger Balance) داخل محفظة العميل بالمنصة لتسهيل عمليات إعادة الجدولة دون أي ضياع للحقوق.</li>
                      <li><strong>دورة حياة رصيد الجدولة (3 الأطوار الزمنية المعتمدة للامتثال والعدالة):</strong>
                        <ul className="list-decimal pr-6 mt-2 space-y-2 text-slate-500 text-xs">
                          <li><strong className="text-slate-700">الطور الأول (الـ 12 شهراً الأولى من الإصدار):</strong> يكون رصيد الجدولة متاحاً وخاصاً للاستخدام وإعادة الحجز لدى <strong>نفس مزود الخدمة المعني</strong> الذي تم إلغاء مناسبته لحماية التزاماته التجارية الحالية.</li>
                          <li><strong className="text-slate-700">الطور الثاني (من الشهر الـ 13 وإلى الشهر الـ 24):</strong> يُفتح رصيد الجدولة بشكل تلقائي ويصبح ساري المفعول لإعادة الحجز لدى <strong>أي مزود خدمة أو قاعة أخرى</strong> تتبع المنصة لإتاحة مرونة أكبر للعميل.</li>
                          <li><strong className="text-slate-700">الطور الثالث (بعد مرور 24 شهراً بالكامل دون استخدام):</strong> يتم تحويل الرصيد المحجوز بشكل آلي وفردي إلى <strong>نقد صالح للسحب الخارجي والتحويل النقدي (Withdrawable Cash Balance)</strong> إلى الحساب المصرفي دون خصم أي رسوم إضافية.</li>
                        </ul>
                      </li>
                      <li><strong>قاعدة حماية القاعة ومزود الخدمة:</strong> لا يُسمح للعميل بسحب هذا الرصيد كاش قبل الطور الثالث إلا في حالات بروتوكولات القوة القاهرة والوفاة (القاضي بتحويل يدوي مباشر بموافقة الإدارة العليا دون أي حسميات).</li>
                    </ul>
                  </div>

                  {/* البند الرابع */}
                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs">
                    <h4 className="text-lg font-bold text-blue-950 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      رابعاً: بروتوكول الإلغاء للظروف القاهرة والحمايات الإنسانية (Force Majeure Protocol)
                    </h4>
                    <p className="text-sm text-slate-600 mb-3 leading-relaxed">
                      تلتزم منصة ليلة بالتعاون الإنساني والمهني مع عملائها في أسوأ ظروفهم الطارئة، مثل (الوفاة من الدرجة الأولى، الكوارث الطبيعية، الأوامر الحكومية والسيادية، الحوادث الكبرى المانعة):
                    </p>
                    <ul className="list-disc pr-6 space-y-2 text-sm text-slate-600">
                      <li><strong>تقديم الطلب:</strong> يقوم العميل بالدخول إلى لوحة تحكم حسابي والذهاب للحجوزات والضغط على <span className="font-bold text-slate-800">"تقديم طلب إلغاء لظرف طارئ/قوة قاهرة"</span>.</li>
                      <li><strong>متطلبات التوثيق:</strong> يقر العميل قانونياً وشخصياً بصحة البيانات ويلتزم برفع مستندات ثبوتية رسمية وقاطعة مصدقة من الجهات المختصة (شهادة وفاة، تقارير طبية رسمية من مستشفى حكومي، إشعار رسمي بحادث سير لا قدر الله، إلخ).</li>
                      <li><strong>مسار المعالجة التلقائية والتحكيم:</strong> بمجرد رفع الطلب، يقوم نظام المنصة بتعليق الحجز مؤقتاً ومراجعة المستندات من قِبل لجنة الحوكمة بالمنصة بالتنسيق المباشر مع الشريك ومزود الخدمة خلال 24 ساعة عمل.</li>
                      <li><strong>تحرير اليوم ومحفز إعادة البيع السريع:</strong> يُعاد فتح تاريخ اليوم المُلغى فوراً في النظام ليكون متاحاً لعملاء آخرين لكسب ميزة حجز اللحظات الأخيرة. وفي حال تم حجز اليوم مجدداً من قِبل عميل آخر، يتم تفعيل الاسترداد النقدي 100% للعميل الأول تلقائياً لعدم تضرر القاعة بالكامل.</li>
                    </ul>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">4. سياسة محركات التسعير الديناميكي وزيادة الذروة والرقابة السيادية (Dynamic Pricing & Sovereign Oversight)</h3>
                <div className="bg-slate-50 border border-slate-200/80 p-8 rounded-3xl mb-8 space-y-6 text-slate-700">
                  <p className="text-base leading-relaxed font-medium text-slate-800">
                    تنظم هذه المادة القواعد الحاكمة لمحركات التسعير المرن، تسعيرات عطلات نهاية الأسبوع، ومضاعفات الذروة المرتبطة بنسب الإشغال ومواسم الطلب في منصة ليلة، وتحدد الحق السيادي للمنصة في التدخل الرقابي لحماية السوق وعدالة التسعير:
                  </p>

                  <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-xs space-y-4">
                    <div>
                      <h4 className="text-base font-bold text-blue-950 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        أولاً: طبيعة واستقلالية أدوات التسعير المتقدمة (Tier Capabilities)
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        تُعد أدوات تسعير عطلات نهاية الأسبوع (الخميس والجمعة والسبت) ومحركات زيادة الذروة الذكية أدوات تمكينية وتخضع لصلاحيات باقات الاشتراك النشطة للمزود (أو شراء القدرات المستقلة)، وتعمل وفق ضوابط وسقوف المنصة المعتمدة.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <h4 className="text-base font-bold text-blue-950 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        ثانياً: ثبات الحجوزات السابقة المعتمدة مالياً (Financial Immutability)
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        تسري أي تغييرات أو تحديثات يطرحها المزود على أسعار الأساس أو تسعير الويكند أو مضاعفات الذروة على <strong>الحجوزات والطلبات الجديدة أو قيد المراجعة فقط</strong>. ويُحظر تماماً تعديل أو مطالبة العميل بأي فروقات مالية على الحجوزات التي تم تأكيدها واعتمادها وتثبيت لقطتها المالية (<span className="font-mono text-xs font-bold text-indigo-900">Financial Pricing Snapshot</span>) في النظام مسبقاً، حيث تظل مقفلة وثابتة حمايةً للحقوق التعاقدية والامتثال الضريبي ZATCA.
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <h4 className="text-base font-bold text-blue-950 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                        ثالثاً: الحق السيادي للمنصة في التدخل والتعطيل الطارئ (Sovereign Oversight & Emergency Freeze)
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed mb-3">
                        تحتفظ إدارة منصة «ليلة» بحقها السيادي والمطلق في التدخل لتحديد السقوف العليا للزيادات السعرية (<span className="font-mono text-xs font-bold text-slate-800">Max Surge Caps</span>)، أو تجميد وتعطيل محركات التسعير الديناميكي وزيادة الذروة كلياً أو جزئياً على مستوى المنصة أو مناطق جغرافية محددة في الحالات التالية:
                      </p>
                      <ul className="list-disc pr-6 space-y-2 text-sm text-slate-600">
                        <li><strong>المناسبات والأعياد الوطنية الرسمية:</strong> بما يتوافق مع التوجيهات الحكومية والقرارات الصادرة عن الجهات التنظيمية والوزارية المختصة.</li>
                        <li><strong>حالات الطوارئ والأزمات والظروف القاهرة (Force Majeure):</strong> كالكوارث الطبيعية، الأحوال الجوية الطارئة، أو التوجيهات الأمنية والصحية العامة.</li>
                        <li><strong>حماية توازن وعدالة السوق:</strong> عند رصد ممارسات احتكارية، مبالغات سعرية غير مبررة تتجاوز السقف العادل، أو اختلالات مفاجئة في توازن العرض والطلب تضر بالمستهلك النهائي.</li>
                      </ul>
                    </div>

                    <div className="pt-3 border-t border-slate-100">
                      <h4 className="text-base font-bold text-blue-950 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                        رابعاً: نفاذ القرار وإخلاء المسؤولية التعويضية
                      </h4>
                      <p className="text-sm text-slate-600 leading-relaxed">
                        يُعد قرار الإدارة بتفعيل التعطيل الطارئ أو تحديد سقف الزيادة نافذاً وملزماً فور تطبيقه في النظام، ولا يترتب على المنصة أي تعويضات أو التزامات مالية تجاه الشركاء ناتجة عن تطبيق هذه السياسات الرقابية الاستثنائية.
                      </p>
                    </div>
                  </div>
                </div>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">5. تصنيف شركاء المنصة المتعددين والمسؤوليات التقاعدية</h3>
                <div className="space-y-4 mb-6 text-sm sm:text-base text-slate-600 leading-relaxed">
                  <p>
                    تضم منصة ليلة شبكة واسعة من الشركاء التجاريين المستقلين الخاضعين لرقابة وحوكمة المنصة الصارمة لضمان موثوقية وجودة التنفيذ:
                  </p>
                  <ul className="list-disc pr-6 space-y-3">
                    <li>
                      <strong>أولاً: مزودو قاعات المناسبات والصالات (Venues & Halls):</strong> يلزم على مالك المقر تقديم رخص تشغيل وبلدية سارية، وتحديث الأسعار وتقويم التوفر بشكل لحظي وأوتوماتيكي. يتحمل مالك القاعة المسؤولية التشغيلية الكاملة عن أمن المقر، وتجهيزات التكييف والإضاءة، وشروط السلامة والدفاع المدني.
                    </li>
                    <li>
                      <strong>ثانياً: منسقو الحفلات والديكورات والزهور (Event Planners & Decorators):</strong> يلتزم المنسق بتوفير المواد والخامات المذكورة في تفاصيل العينات (مثال: الزهور الطبيعية، كوش العروس، أنظمة الإضاءة والممرات). يحق للمنسق تحديد مدة قصوى للتحضير القبلي وتوضيح أي قيود على التركيب للمحافظة على بنية القاعات.
                    </li>
                    <li>
                      <strong>ثالثاً: الخدمات اللوجستية والمأكولات وبوفيهات الضيافة (Logistics & Catering Groups):</strong> تشمل مجموعات صبابين القهوة، المطابخ التراثية، والخدمة الفندقية. تشتمل شروط الانضمام على تقديم رخص بلدية، وشهادات صحية سارية لكافة العاملين، والالتزام الصارم بمعايير سلامة الأغذية وسلسلة التبريد للمنصة.
                    </li>
                    <li>
                      <strong>رابعاً: استوديوهات التصوير السينمائي والتغطية بالدرون (Photography & Drone Media):</strong> يقر مصور الفوتوغراف والإنتاج السينمائي بحيازته كافة تراخيص العمل اللازمة. ويفهم العميل صراحة أن تشغيل طائرات التصوير الجوي (Drones) يتطلب الحصول على التصاريح الأمنية اللازمة من هيئة الطيران المدني والجهات المختصة لموقع الحفل، وتبقى هذه المسؤولية حصرية على العميل بالتنسيق المباشر مع المصور دون أدنى تبعات على المنصة.
                    </li>
                  </ul>
                </div>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">6. معايير الامتثال التنظيمي والالتزامات العامة</h3>
                <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl mb-6 space-y-4 text-sm sm:text-base text-slate-600">
                  <h4 className="font-bold text-slate-800">أ) التزامات العميل (Customer Commitments):</h4>
                  <ul className="list-disc pr-6 space-y-1">
                    <li>إقراره بأن جميع البيانات، والمعلومات، والمستندات، والوثائق الشخصية أو الطبية أو القانونية المرفوعة للنظام صحيحة ودقيقة، ويتحمل كامل المسؤوليات الجنائية والمالية في حال تعارضها مع الواقع بموجب نظام مكافحة جرائم المعلوماتية السعودي.</li>
                    <li>الالتزام الصارم بلائحة الذوق العام المعمول بها في المملكة العربية السعودية داخل مقرات الحجز والتعامل المهني مع طاقم الخدمة.</li>
                    <li>تحمل المسؤولية القانونية الكاملة عن أي أضرار مادية، تخريب، أو إتلافات تقام للبند العقاري أو ملحقات الديكور المستأجرة والناتجة عن إساءة سلوك ضيوف العميل، وتتم تسوية قيمة الضرر مباشرة بالتنسيق مع إدارة القاعة.</li>
                  </ul>

                  <h4 className="font-bold text-slate-800">ب) التزامات مزود الخدمة (Vendor Compliance):</h4>
                  <ul className="list-disc pr-6 space-y-1">
                    <li>تحديث حالات التوفر والأسعار وفترات السماح باستمرار لمنع التجاوز والتعارض التقني في رزنامة المواعيد.</li>
                    <li>تقديم الخدمة المتفق عليها بكافة بنودها وتجهيزاتها وتفاصيلها المكتوبة بالعقد بجودة لا تقل عن المعايير الاحترافية المعتمدة في السوق السعودي.</li>
                    <li>حظر عرض أي مواد مضللة، أسعار وهمية، أو استغلال المنصة لتوجيه المدفوعات خارج بوابات الدفع الرسمية للمنصة (بما يخل بمدفوعات العقد ونسبة المنصة).</li>
                  </ul>
                </div>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">7. حوكمة تسوية النزاعات وبروتوكول التحكيم الودي</h3>
                <p className="mb-6 text-sm sm:text-base text-slate-600 leading-relaxed">
                  باعتبار منصة ليلة وسيطاً تقنياً معتمداً وموثقاً، فإنها تقدم لوحة تسوية ومطالبة متطورة لفض النزاعات وحفظ كفاءة التنسيق. في حال تعذر تنفيذ الخدمة أو نشوء خلاف بين العميل والشركاء، يتم اللجوء إلزامياً لبروتوكول التسوية الودية للمنصة:
                  <br />
                  1. تسجيل "طلب شكوى رسمي" عبر لوحة التحكم يتضمن المستندات الداعمة والأدلة الثبوتية (صور، فيديو، نصوص العقود).
                  <br />
                  2. تقوم إدارة منصة ليلة بدور المحكم الودي (Arbitrator) المعتمد للتحقق تكنولوجياً واقتراح مسارات الصلح العادل والآمن في غضون 7 أيام عمل.
                  <br />
                  3. إذا تبيّن تقصير المزود، يُلزم برد كامل المبالغ أو منح العميل "رصيد جدولة مؤجل معجل" تضمن المنصة حيازته وأمانه.
                  <br />
                  4. في حال استنفاد كافة الطرق الودية للتسوية التقنية، يحق لآي من الطرفين التوجه إلى الجهات القضائية والمحاكم المختصة بمدينة الرياض بالمملكة العربية السعودية وفقاً لأنظمة وزارة العدل.
                </p>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">8. حدود المسؤولية والامتثال القانوني لأحكام النشر</h3>
                <p className="mb-6 text-sm sm:text-base text-slate-600 leading-relaxed">
                  تلتزم المنصة بتوفير خدمات الربط التقني بأعلى نسبة موثوقية واستقرار. إن منصة ليلة غير مسؤولة نظامياً عن أي أضرار مادية، إصابات بدنية، أو خسائر تجارية تنجم بالخطأ أو الإهمال البشري من قبل الشركاء في أرض الواقع، أو أي مشكلات لوجستية تتعرض لشروط القوة القاهرة كالأحوال الجوية السيئة، انقطاع التيار الكهربائي العام، أو الإشعارات الأمنية والصحية العامة.
                </p>

                <h3 className="text-2xl font-bold mt-10 mb-4 text-blue-950 border-r-4 border-amber-500 pr-3">9. القانون المطبق والسيادة النظامية</h3>
                <p className="mb-6 text-sm sm:text-base text-slate-600 leading-relaxed">
                  تخضع هذه الشروط والأحكام وعلاقات السداد والتوثيقات وتُفسر بالكامل وتُطبق وتُنفذ بموجب الأنظمة والقوانين والتعليمات السارية والنافذة في المملكة العربية السعودية، وخصوصاً لائحة نظام التجارة الإلكترونية، ونظام التعاملات الإلكترونية ونظام مكافحة الجرائم المعلوماتية.
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
