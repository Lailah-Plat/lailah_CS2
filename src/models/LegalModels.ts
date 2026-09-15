/**
 * @file LegalModels.ts
 * @description Models for Versioned Legal & Content CMS and FAQs in Lailah Platform (P1.9).
 */

import { DataTypes, Model } from 'sequelize';
import { sequelize } from './dbInstance.js';

export interface LegalSectionItem {
  id: string;
  title: string;
  content: string;
  requiredCapability?: string | null;
  orderIndex: number;
  isPublished?: boolean;
}

export class LegalDocument extends Model {
  declare id: number;
  declare documentType: string;
  declare version: string;
  declare title: string;
  declare subtitle?: string | null;
  declare introText?: string | null;
  declare contentAr: string;
  declare contentEn?: string | null;
  declare sections: LegalSectionItem[];
  declare status: 'draft' | 'published' | 'archived';
  declare publishedAt?: Date | null;
  declare effectiveAt?: Date | null;
  declare changedBy?: string | null;
  declare changeSummary?: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

LegalDocument.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  documentType: { type: DataTypes.STRING, allowNull: false },
  version: { type: DataTypes.STRING, allowNull: false, defaultValue: 'v1.0' },
  title: { type: DataTypes.STRING, allowNull: false },
  subtitle: { type: DataTypes.STRING, allowNull: true },
  introText: { type: DataTypes.TEXT, allowNull: true },
  contentAr: { type: DataTypes.TEXT, allowNull: false },
  contentEn: { type: DataTypes.TEXT, allowNull: true },
  sections: { type: DataTypes.JSON, defaultValue: [], allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'published', allowNull: false },
  publishedAt: { type: DataTypes.DATE, allowNull: true },
  effectiveAt: { type: DataTypes.DATE, allowNull: true },
  changedBy: { type: DataTypes.STRING, allowNull: true },
  changeSummary: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  modelName: 'LegalDocument',
  tableName: 'LegalDocuments',
  indexes: [
    { fields: ['documentType'] },
    { fields: ['status'] },
    { fields: ['version'] }
  ]
});

export class FAQItem extends Model {
  declare id: number;
  declare question: string;
  declare answer: string;
  declare audience: 'CUSTOMER' | 'PROVIDER' | 'GENERAL';
  declare category: string;
  declare orderIndex: number;
  declare isPublished: boolean;
  declare requiredCapability?: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

FAQItem.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  question: { type: DataTypes.STRING, allowNull: false },
  answer: { type: DataTypes.TEXT, allowNull: false },
  audience: { type: DataTypes.STRING, defaultValue: 'GENERAL', allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'عام', allowNull: false },
  orderIndex: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  isPublished: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: false },
  requiredCapability: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'FAQItem',
  tableName: 'FAQItems',
  indexes: [
    { fields: ['audience'] },
    { fields: ['isPublished'] },
    { fields: ['category'] }
  ]
});

/**
 * Initialize / Seed default Legal Documents & FAQs
 */
export async function seedDefaultLegalContent() {
  try {
    await LegalDocument.sync();
    await FAQItem.sync();

    const termsDoc = await LegalDocument.findOne({ where: { documentType: 'terms' } });
    if (!termsDoc) {
      await LegalDocument.create({
        documentType: 'terms',
        version: 'v2.0',
        title: 'الشروط والأحكام العامة لمنصة ليلة',
        subtitle: 'وثيقة الشروط والسياسات التعاقدية المعتمدة لحجز القاعات والخدمات',
        introText: 'مرحباً بك في منصة وتطبيق "ليلة". باستخدامك للمنصة، فإنك توافق على الالتزام بالشروط والأحكام الموضحة أدناه المنظمة لكافة عقود الحجز والخدمات المساندة المبرمة من خلالها.',
        contentAr: `مرحباً بك في منصة وتطبيق "ليلة". تنظم هذه الشروط والأحكام استخدامك للمنصة وكافة المعاملات وعقود الحجز والخدمات المبرمة من خلالها.`,
        sections: [
          {
            id: 'sec-defs',
            title: '1. التعريفات والأطراف التعاقدية',
            content: 'المنصة: منصة وتطبيق ليلة لحجز قاعات الأفراح والمناسبات وإدارة الخدمات المساندة. العميل/المستخدم: أي شخص يقوم بإنشاء حساب أو طلب حجز أو شراء خدمة. مزود الخدمة: مالك القاعة، الصالة، الاستراحة، أو مقدم الخدمة المستقل المعتمد بالنظام.',
            orderIndex: 1,
            isPublished: true
          },
          {
            id: 'sec-booking-payments',
            title: '2. سياسات الحجز والدفع والالتزامات المالية',
            content: 'تعتبر الحجوزات مؤكدة فقط بعد إتمام عملية الدفع (العربون أو كامل المبلغ) وفق سياسة الحجز المعتمدة للقاعة أو الخدمة. جميع الأسعار المعروضة في المنصة للمستهلك هي أسعار نهائية شاملة لضريبة القيمة المضافة (15% VAT-Inclusive).',
            orderIndex: 2,
            isPublished: true
          },
          {
            id: 'sec-grace-window',
            title: '3. سياسة نافذة الـ 24 ساعة السماحية المشروطة (Conditional 24-Hour Grace Window)',
            content: 'تتيح المنصة نافذة سماحية مدتها 24 ساعة من تاريخ ووقت تأكيد الحجز لإلغاء الحجز واسترداد كامل الرسوم مجاناً لمعالجة الحجوزات العفوية. يُستثنى من ذلك الحجوزات العاجلة التي يكون موعد المناسبة الفعلي فيها أقل من 72 ساعة لحماية حجوزات ومواسم الشركاء.',
            orderIndex: 3,
            isPublished: true
          },
          {
            id: 'sec-hybrid-cancellation',
            title: '4. النموذج الهجين للإلغاء والاسترجاع ورصيد الجدولة المؤجل',
            content: 'تعتمد المنصة نموذجاً تعاقدياً هجيناً: عند الإلغاء خارج نافذة السماح يتم تحويل النسبة المستحقة إلى قسيمة رصيد جدولة مؤجل (Rescheduling Voucher) في محفظة العميل بالمنصة صالحة لإعادة الحجز لدى نفس المزود. كما يتيح بروتوكول الظروف القاهرة الإنساني النظر في الحالات الطارئة المثبتة بوثائق رسمية.',
            orderIndex: 4,
            isPublished: true
          },
          {
            id: 'sec-instant-confirmation',
            title: '5. سياسة التأكيد الفوري (Instant Confirmation)',
            content: 'يعد الحجز الصادر بسياسة التأكيد الفوري ملزماً ومؤكداً فور سداد العميل للمبلغ وتأكيد العملية في النظام، ولا يحق للمزود إلغاؤه من طرف واحد، ويقتصر أي طلب إلغاء على رفع تذكرة دعم لمراجعة إدارة المنصة.',
            requiredCapability: 'booking_policy.instant_confirmation',
            orderIndex: 5,
            isPublished: true
          },
          {
            id: 'sec-auth-capture',
            title: '6. سياسة حجز المبلغ والتفويض المسبق (Hold & Capture)',
            content: 'في حال استخدام سياسة التفويض المسبق، يتم تعليق المبلغ على وسيلة الدفع ولا يتم الخصم الفعلي إلا عند قبول المزود للطلب ضمن المهلة الزمنية المحددة.',
            requiredCapability: 'booking_policy.authorize_then_capture',
            orderIndex: 6,
            isPublished: true
          },
          {
            id: 'sec-vendor-obligations',
            title: '7. التزامات مزودي الخدمات والقاعات المستقلة',
            content: 'يلتزم مزودو القاعات والخدمات بتقديم الخدمات وفق المعايير المعتمدة، وتحديث التوفر والأسعار لحظياً، والامتثال لكافة التراخيص البلدية والصحية واشتراطات الدفاع المدني.',
            orderIndex: 7,
            isPublished: true
          },
          {
            id: 'sec-sovereign-control',
            title: '8. الرقابة والحق السيادي لإدارة المنصة وثبات الأسعار',
            content: 'تحتفظ إدارة المنصة بالحق السيادي في ضبط معايير الذروة وتجميد مضاعفات الأسعار في حالات الطوارئ والقوة القاهرة لحماية المستهلكين وثبات العقود المعتمدة.',
            orderIndex: 8,
            isPublished: true
          }
        ],
        status: 'published',
        publishedAt: new Date(),
        effectiveAt: new Date(),
        changedBy: 'Admin (System Initialization)',
        changeSummary: 'الإصدار المعتمد للشروط والأحكام وفق معايير P1.9 وسياسات الحجز والدفع والرقابة السيادية.'
      });
    }

    const privacyDoc = await LegalDocument.findOne({ where: { documentType: 'privacy' } });
    if (!privacyDoc) {
      await LegalDocument.create({
        documentType: 'privacy',
        version: 'v2.0',
        title: 'سياسة الخصوصية وحماية البيانات الشخصية',
        subtitle: 'بيان الامتثال لنظام حماية البيانات الشخصية السعودي (PDPL)',
        introText: 'تحترم منصة ليلة خصوصيتك وتلتزم بحماية بياناتك الشخصية وفق نظام حماية البيانات الشخصية (PDPL) واللوائح التنفيذية الصادرة عن الهيئة السعودية للبيانات والذكاء الاصطناعي (سدايا - SDAIA).',
        contentAr: `نلتزم في منصة ليلة بحماية البيانات والخصوصية لكافة المستخدمين والشركاء وفق نظام حماية البيانات الشخصية المعمول به في المملكة العربية السعودية.`,
        sections: [
          {
            id: 'priv-pdpl-compliance',
            title: '1. الامتثال التشريعي ونطاق الخصوصية (PDPL)',
            content: 'نعلن صراحة امتثالنا وعملنا بموجب نظام حماية البيانات الشخصية الصادر في المملكة العربية السعودية بالمرسوم الملكي رقم (م/19) ولوائحه التنفيذية المعتمدة.',
            orderIndex: 1,
            isPublished: true
          },
          {
            id: 'priv-data-categories',
            title: '2. تصنيف وتفصيل البيانات التي يتم جمعها',
            content: 'تشمل البيانات المجمعة: بيانات الحساب والتواصل (الاسم، الجوال، البريد، المدينة)، بيانات الحجوزات والمناسبات، وثائق التحقق المالي والتجاري للمزودين، ومستندات الفحص للظروف القاهرة المحمية بأعلى درجات التشفير.',
            orderIndex: 2,
            isPublished: true
          },
          {
            id: 'priv-purposes',
            title: '3. أغراض استخدام ومعالجة البيانات والأساس النظامي',
            content: 'تُعالج البيانات لتنفيذ عقود الحجز وربط العميل بالمزود، وتسهيل المعاملات المالية المشفرة عبر بوابات مرخصة ومتوافقة مع PCI-DSS وتعاميم البنك المركزي (SAMA) دون حفظ أرقام البطاقات السرية لدينا.',
            orderIndex: 3,
            isPublished: true
          },
          {
            id: 'priv-retention-purging',
            title: '4. فترات الاحتفاظ بالبيانات وسياسة التطهير والإتلاف (Data Purging)',
            content: 'يتم الاحتفاظ بالبيانات للمدد المقررة نظامياً لاستيفاء الالتزامات القانونية والضريبية (ZATCA)، مع تطبيق إجراءات التطهير والإتلاف الآمن فور زوال الأثر النظامي أو بناء على طلب العميل.',
            orderIndex: 4,
            isPublished: true
          },
          {
            id: 'priv-user-rights',
            title: '5. حقوق المستخدم بموجب نظام حماية البيانات الشخصية',
            content: 'يحق للمستخدم ممارسة حقوقه النظامية: حق العلم والشفافية، حق الوصول والاطلاع، حق التصحيح والتحديث، وحق طلب الإتلاف والسحب.',
            orderIndex: 5,
            isPublished: true
          }
        ],
        status: 'published',
        publishedAt: new Date(),
        effectiveAt: new Date(),
        changedBy: 'Admin (System Initialization)',
        changeSummary: 'سياسة الخصوصية الرسمية المحدثة والمتوافقة مع نظام PDPL.'
      });
    }

    const aboutDoc = await LegalDocument.findOne({ where: { documentType: 'about' } });
    if (!aboutDoc) {
      await LegalDocument.create({
        documentType: 'about',
        version: 'v2.0',
        title: 'عن منصة ليلة - منظومة حجوزات وتنظيم المناسبات',
        subtitle: 'الوجهة الأولى والموثوقة في المملكة العربية السعودية لحجز وتنظيم أرقى المناسبات',
        introText: 'منصة ليلة هي المنظومة السعودية الرائدة لحجز قاعات الأفراح والمناسبات وإدارة الخدمات المساندة وربط الشركاء بالعملاء بأعلى معايير الشفافية والموثوقية والابتكار التقني.',
        contentAr: `منصة ليلة هي المنظومة السعودية الرائدة لحجز قاعات الأفراح والمناسبات وإدارة الخدمات المساندة وربط الشركاء بالعملاء بأعلى معايير الشفافية والموثوقية.`,
        sections: [
          {
            id: 'about-story',
            title: 'قصتنا',
            content: 'بدأت "ليلة" كفكرة رائدة لحل تحديات حجز القاعات ومزودي الخدمات، واليوم نفخر بأن نكون المنصة الأكثر موثوقية وأماناً في المملكة التي تجمع أرقى القاعات ومقدمي الخدمات في مكان واحد مع تجربة حجز رقمية متكاملة.',
            orderIndex: 1,
            isPublished: true
          },
          {
            id: 'about-vision-mission',
            title: 'رؤيتنا ورسالتنا',
            content: 'رؤيتنا: أن نكون المرجع الأول والخيار الذكي لكل من يبحث عن تنظيم مناسبة استثنائية. رسالتنا: توفير تجربة حجز سلسة، آمنة، ومتكاملة من خلال التقنية المبتكرة والخدمة المتميزة والرقابة الصارمة على الجودة.',
            orderIndex: 2,
            isPublished: true
          },
          {
            id: 'about-values',
            title: 'قيمنا ومعايير الجودة',
            content: 'الشفافية المطلقة، المصداقية، حماية حقوق المستهلك والمزود، والابتكار المستمر في تقديم تجربة مستخدم استثنائية وفق أعلى المقاييس الوطنية والدولية.',
            orderIndex: 3,
            isPublished: true
          }
        ],
        status: 'published',
        publishedAt: new Date(),
        effectiveAt: new Date(),
        changedBy: 'Admin (System Initialization)',
        changeSummary: 'الصفحة التعريفية الرسمية لمنصة ليلة.'
      });
    }

    const faqCount = await FAQItem.count();
    if (faqCount === 0) {
      await FAQItem.bulkCreate([
        {
          question: 'كيف يمكنني حجز قاعة أو خدمة تنظيم عبر المنصة؟',
          answer: 'يمكنك تصفح قاعات الأفراح والمناسبات عبر صفحة "الاستكشاف"، واختيار التاريخ المطلوب من خلال التقويم الذكي لمعرفة التوفر الفوري، واختيار الخدمات المساندة، ثم سداد العربون أو الدفعة المقررة إلكترونياً لتأكيد الحجز فورياً وإصدار العقد التلقائي.',
          audience: 'CUSTOMER',
          category: 'الحجوزات والمدفوعات',
          orderIndex: 1,
          isPublished: true
        },
        {
          question: 'ما هي سياسة نافذة الـ 24 ساعة السماحية المشروطة لإلغاء الحجز؟',
          answer: 'تتيح منصة ليلة نافذة سماح مدتها 24 ساعة تبدأ من تاريخ ووقت تأكيد الحجز، يمكن خلالها إلغاء الطلب تلقائياً واسترداد كامل الرسوم مجاناً (لعلاج حالات الأخطاء العفوية). ويُستثنى من هذه النافذة أي حجز تكون المناسبة الفعلية متبقٍ عليها أقل من 72 ساعة لحفظ حقوق الشركاء.',
          audience: 'CUSTOMER',
          category: 'الإلغاء والاسترداد',
          orderIndex: 2,
          isPublished: true
        },
        {
          question: 'ما هو (رصيد الجدولة المؤجل) وكيف يحمي المدخرات والحقوق المالية؟',
          answer: 'عند إلغاء الحجز خارج نافذة السماحية المعتادة، لا تضيع أموالك. بل يتم تحويل النسبة المستحقة إلى قسيمة رصيد دفتري مغلق (Rescheduling Voucher) داخل محفظتك بالمنصة، تكون صالحة لإعادة جدولة الحجز لنفس الشريك التجاري خلال مهلة تترواح من 6 أشهر إلى 36 شهراً بالتنسيق الودي.',
          audience: 'CUSTOMER',
          category: 'الإلغاء والاسترداد',
          orderIndex: 3,
          isPublished: true
        },
        {
          question: 'تعرضت لظرف طارئ شديد وقاهر، كيف أقدم مستندات ثبوتية للحصول على استرداد استثنائي؟',
          answer: 'نمتاز في منصة ليلة بـ "بروتوكول الظروف القاهرة الإنساني". يمكنك تقديم طلب إلغاء لظرف قاهر وإرفاق الوثائق الثبوتية الرسمية المصدقة (تقارير طبية، حوادث، قرارات رسمية). تراجع لجنة الحوكمة بالمنصة الطلب مع الشريك خلال 24 ساعة لاعتماد قسيمة رصيد مؤجلة بالكامل أو إعادة تسييل المبلغ حال إعادة حجز الموعد.',
          audience: 'CUSTOMER',
          category: 'الإلغاء والاسترداد',
          orderIndex: 4,
          isPublished: true
        },
        {
          question: 'كيف أحدد سياسة الحجز والدفع المعتمدة لقاعاتي وخدماتي؟',
          answer: 'من خلال لوحة تحكم المزود > إعدادات الحجز والدفع، يمكنك اختيار سياسة واحدة موحدة للقاعات وسياسة واحدة للخدمات المستقلة وفق الصلاحيات المتاحة في باقتك (التأكيد الفوري، الدفع قبل الموافقة، الموافقة قبل الدفع، أو التفويض المسبق).',
          audience: 'PROVIDER',
          category: 'إدارة الحساب وسياسات الحجز',
          orderIndex: 5,
          isPublished: true
        },
        {
          question: 'هل يمكن للمزود إلغاء حجز مؤكد أو مدفوع مباشرة؟',
          answer: 'لا، الحجوزات المؤكدة أو المدفوعة لا يمكن للمزود إلغاؤها مباشرة من طرف واحد، بل يتطلب ذلك تقديم طلب إلغاء عبر تذاكر الدعم لمراجعة إدارة المنصة لضمان حقوق العميل واستقرار الحجوزات.',
          audience: 'PROVIDER',
          category: 'العمليات والالتزامات',
          orderIndex: 6,
          isPublished: true
        },
        {
          question: 'هل أسعار الخدمات المعروضة في المنصة مطابقة للواقع وهل تشمل الضريبة المضافة؟',
          answer: 'نعم، تخضع كافة الأسعار للمراقبة الدورية. جميع الأسعار المعروضة في المنصة للمستهلك هي أسعار نهائية شاملة لضريبة القيمة المضافة (15% VAT-Inclusive) وتطابق تفاصيل العقد والفاتورة الضريبية ZATCA.',
          audience: 'GENERAL',
          category: 'الرقابة المالية والضريبية',
          orderIndex: 7,
          isPublished: true
        },
        {
          question: 'كيف يضمن النظام عدم تعارض المواعيد عبر ميزة التقويم الذكي؟',
          answer: 'يمثل التقويم الذكي العصب التقني لمنصة ليلة؛ بمجرد تأكيد حجز قاعة ليوم محدد، يتم حظر وإقفال هذا التاريخ فوراً وتلقائياً عبر كافة الواجهات للمستخدمين لمنع حدوث أي حجز مزدوج (Double Booking).',
          audience: 'GENERAL',
          category: 'التقويم الذكي والتوفر',
          orderIndex: 8,
          isPublished: true
        }
      ]);
    }
  } catch (err: any) {
    console.warn('[seedDefaultLegalContent] Warning during legal content seeding:', err.message);
  }
}
