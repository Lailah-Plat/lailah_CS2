/**
 * @file lpasData.ts
 * @description Central Registry and Content Repository for Lailah Provider Acquisition & Landing Page System (LPAS).
 * Contains rich pre-configured landing pages matching the 8 structural acquisition levels requested.
 */

import { LPASLandingPage } from '../types/lpas';

export const INITIAL_LPAS_PAGES: LPASLandingPage[] = [
  // 1. PAGE 1: General Provider Acquisition Parent Landing Page (المظلة العامة لاكتساب المزودين)
  {
    id: 'lpas-general-parent',
    slug: 'providers-join',
    pageType: 'ACQUISITION_GENERAL',
    title: 'انضم إلى ليلة ونمِّ أعمالك في قطاع المناسبات',
    subtitle: 'المنصة السعودية الأولى لتنظيم وتمكين قاعات ومزودي خدمات المناسبات',
    badgeText: '🚀 انضمام الشركاء والمزودين 2026',
    heroHeadline: 'وصل خدماتك وقاعتك إلى آلاف العملاء الباحثين عن التميز',
    heroSubheadline: 'سواء كنت تملك قاعة أفراح، استراحة، أو تقدم خدمات الضيافة والتصوير والتنسيق، توفر لك ليلة المنظومة الرقمية الشاملة لإدارة الحجوزات والمدفوعات والنمو التجاري.',
    heroImageUrl: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80',
    targetProviderType: 'ALL',
    targetCityId: 'all',
    targetCategoryId: 'all',
    seoTitle: 'انضم كمزود خدمة أو صاحب قاعة في منصة ليلة - نمِّ أعمالك الآن',
    seoDescription: 'سجل نشاطك التجاري أو قاعتك في منصة ليلة لتستقبل طلبات الحجوزات المباشرة، وتدير جدول تفرغك، وتزيد أرباحك في قطاع المناسبات بالسعودية.',
    keywords: ['انضمام مزودي المناسبات', 'حجز قاعات', 'تسجيل مزود خدمة', 'منصة ليلة', 'قاعات الأفراح السعودية'],
    
    benefits: [
      {
        id: 'b1',
        iconName: 'TrendingUp',
        title: 'زيادة المبيعات والوصول المستهدف',
        description: 'استفد من وجود آلاف العملاء النشطين يبحثون يومياً عن قاعات وخدمات مناسباتهم في منطقتك.',
        highlightText: '+45% زيادة متوسط الحجوزات'
      },
      {
        id: 'b2',
        iconName: 'CalendarCheck',
        title: 'إدارة التقويم والتوفر المباشر',
        description: 'نظام ذكي يمنع التعارض الزمني، ويتيح لك تحديث التوفر والأسعار حسب المواسم وعطلات نهاية الأسبوع.',
        highlightText: 'تقويم ذكي حي'
      },
      {
        id: 'b3',
        iconName: 'ShieldCheck',
        title: 'حماية المدفوعات ونظام العربون',
        description: 'تحصيل العربون والمدفوعات تلقائياً عبر بوابات سداد الآمنة مع الضمان الكامل لحقوق الشريك والعميل.',
        highlightText: 'مدفوعات آمنة 100%'
      },
      {
        id: 'b4',
        iconName: 'BarChart3',
        title: 'تحليلات النمو والتدفقات المالية',
        description: 'لوحة قيادة متكاملة تمنحك رؤية تفصيلية عن المبيعات، أكثر الخدمات طلباً، وتقييمات العملاء.',
        highlightText: 'تقارير مالية فورية'
      }
    ],

    processSteps: [
      {
        stepNumber: 1,
        title: 'أنشئ حسابك وحدد نوع نشاطك',
        description: 'اختر ما إذا كنت صاحب قاعة/استراحة أو مزود خدمات مساندة (ضيافة، تصوير، ورد، إلخ).',
        iconName: 'UserPlus'
      },
      {
        stepNumber: 2,
        title: 'أضف بيانات القاعة أو قائمة الخدمات',
        description: 'أدخل الصور، الأسعار، الباقات المتاحة، وشروط الحجز بكل سهولة وسرعة.',
        iconName: 'FileText'
      },
      {
        stepNumber: 3,
        title: 'مراجعة واعتماد الحساب',
        description: 'يقوم فريق الجودة بمراجعة البيانات وتفعيل حسابك للظهور العام للعملاء.',
        iconName: 'BadgeCheck'
      },
      {
        stepNumber: 4,
        title: 'استقبل الحجوزات وابدأ النمو',
        description: 'استقبل الإشعارات الفورية بالطلبات الجديدة، وحصّل مبالغ الحجز مباشرة في حسابك.',
        iconName: 'Sparkles'
      }
    ],

    keyFeatures: [
      {
        title: 'واجهة متكيفة حسب نوع المنشأة',
        description: 'تتأقلم لوحة التحكم تلقائياً مع متطلبات إدارة القاعات أو الخدمات المساندة المستقلة.',
        badgeText: 'ذكاء تشغيلي',
        iconName: 'Sliders'
      },
      {
        title: 'ربط الفروع والموظفين',
        description: 'إمكانية إضافة طاقم العمل وتوزيع الصلاحيات وتتبع أداء كل فرع بسهولة.',
        badgeText: 'إدارة شاملة',
        iconName: 'Users'
      },
      {
        title: 'تسويق موجه ومواسم مستهدفة',
        description: 'إطلاق حملات ترويجية موسمية وعروض خاصة بمواسم الأفراح والأعياد.',
        badgeText: 'نمو تسويقي',
        iconName: 'Target'
      }
    ],

    testimonials: [
      {
        id: 't1',
        providerName: 'الشيخ عبدالسلام القحطاني',
        businessName: 'قصر الخزامى للمناسبات',
        city: 'الرياض',
        quote: 'منصة ليلة أحدثت نقلة نوعية في تنظيم جدول حجز القاعة لدينا، وقضت تماماً على مشكلة ازدواجية الحجوزات.',
        rating: 5,
        highlightTag: 'صاحب قاعة'
      },
      {
        id: 't2',
        providerName: 'سارة التميمي',
        businessName: 'استوديو لمسة توثيق',
        city: 'جدة',
        quote: 'بفضل ليلة تضاعفت طلبات التصوير لدينا خلال موسم الصيف وتلقينا حجوزات مؤكدة بعرابين فورية.',
        rating: 5,
        highlightTag: 'مزود خدمة تصوير'
      }
    ],

    faqItems: [
      {
        question: 'ما هي متطلبات الانضمام لمنصة ليلة كمزود؟',
        answer: 'يتطلب وجود سجل تجاري نشط أو وثيقة العمل الحر، بالإضافة إلى صك الملكية/عقد الإيجار بالنسبة للقاعات، وهوية الشريك.'
      },
      {
        question: 'كيف يتم احتساب العمولة والرسوم؟',
        answer: 'تعتمد العمولة على نوع باقة الاشتراك النشطة للشركاء وتقتطع آلياً عن الحجوزات الناجحة فقط.'
      },
      {
        question: 'هل يمكنني التحكم في أيام التوفر والأسعار المخصصة للويكند؟',
        answer: 'نعم بالتأكيد! تتيح لك المنصة تحديث تقويم التوفر فورياً وضبط أسعار نهاية الأسبوع والمواسم بكل مرونة.'
      }
    ],

    primaryCTATtext: 'ابدأ البيع والانضمام إلى ليلة الآن',
    primaryCTASubtitle: 'التسجيل مجاني ولا يستغرق أكثر من 3 دقائق',
    secondaryCTATtext: 'استكشف مزايا الباقات والأنشطة',

    isActive: true,
    createdAt: '2026-01-10',
    updatedAt: '2026-08-10'
  },

  // 2. PAGE 2: Venues & Halls Acquisition Page (صفحة القاعات والاستراحات)
  {
    id: 'lpas-venues-acquisition',
    slug: 'providers-venues',
    pageType: 'ACQUISITION_VENUES',
    title: 'أضف قاعتك أو استراحتك إلى منصة ليلة',
    subtitle: 'حوّل منشأتك إلى وجهة مميزة يكتشفها آلاف العملاء ويحجزونها فورياً',
    badgeText: '🏰 المظلة المخصصة للقاعات والأفراح',
    heroHeadline: 'حوّل قاعتك إلى مقصد أول للعملاء مع إدارة رقمية كاملة للحجوزات',
    heroSubheadline: 'اعرض القاعة بصور وفيديوهات عالية الدقة، حدد أسعار الأيام والباقات الشاملة، وادارة التوفر والعرابين بنقرة واحدة.',
    heroImageUrl: 'https://images.unsplash.com/photo-1544078751-58fee2d8a03b?auto=format&fit=crop&w=1200&q=80',
    targetProviderType: 'VENUE',
    targetCityId: 'all',
    targetCategoryId: 'venue',
    targetCategoryNameAr: 'قاعات وأماكن المناسبات',
    seoTitle: 'أضف قاعتك أو قصتك إلى ليلة - نظام إدارة حجز القاعات بالسعودية',
    seoDescription: 'سجل قاعة الأفراح، القصر، الاستراحة، أو المنتجع الخاص بك في ليلة واستقبل الحجوزات المباشرة والعربين الآمنة مع تقويم حي للتوفر.',
    keywords: ['إضافة قاعة أفراح', 'تسجيل استراحة', 'حجز قاعات مناسبات', 'منصة حجز قاعات', 'استثمارات القاعات'],

    benefits: [
      {
        id: 'vb1',
        iconName: 'Building2',
        title: 'استعراض مبهر للقاعة والخدمات التابعة',
        description: 'إبراز القاعة بألبوم صور عالي الدقة، جولات توضيحية، وعرض المزايا والخدمات التكميلية.',
        highlightText: 'عرض بؤري جذاب'
      },
      {
        id: 'vb2',
        iconName: 'CalendarRange',
        title: 'إدارة المواسم والأسعار الديناميكية',
        description: 'تحديد أسعار مختلفة لأيام وسط الأسبوع، عطلات نهاية الأسبوع، والمواسم المزدحمة.',
        highlightText: 'تسعير مرن للمواسم'
      },
      {
        id: 'vb3',
        iconName: 'Coins',
        title: 'تحصيل العربون والضمان المستندي',
        description: 'تحصيل العربون آلياً لحجز التاريخ واستصدار سندات وإيصالات رسمية موثقة.',
        highlightText: 'عربين مؤكدة فورا'
      },
      {
        id: 'vb4',
        iconName: 'PieChart',
        title: 'تحليلات الإشغال والعائد المستهدف',
        description: 'متابعة نسبة إشغال القاعة شهرياً وتوقع الإيرادات بدقة عالية.',
        highlightText: 'مؤشرات إشغال حية'
      }
    ],

    processSteps: [
      {
        stepNumber: 1,
        title: 'أدخل معلومات المنشأة والموقع',
        description: 'اسم القاعة، المدينة، الحي، الطاقة الاستيعابية، والترخيص.',
        iconName: 'MapPin'
      },
      {
        stepNumber: 2,
        title: 'ارفع الصور والأسعار والباقات',
        description: 'أضف صور القاعات (رجالي/نسائي)، أسعار الأيام، والباقات الشاملة.',
        iconName: 'Camera'
      },
      {
        stepNumber: 3,
        title: 'اعتماد القاعة من الإدارة',
        description: 'مراجعة معايير الجودة والتحقق الميداني المعتمد لنشر القاعة.',
        iconName: 'CheckCircle'
      },
      {
        stepNumber: 4,
        title: 'استقبال الحجوزات الفورية',
        description: 'ظهور القاعة في نتائج البحث ومحرك الاستكشاف الجغرافي للعملاء.',
        iconName: 'Building'
      }
    ],

    keyFeatures: [
      {
        title: 'دعم الأقسام المتعددة',
        description: 'إدارة قاعة النساء وقاعة الرجال بشكل مستقل أو كحزمة واحدة.',
        badgeText: 'استيعاب مزدوج',
        iconName: 'Layers'
      },
      {
        title: 'حظر ازدواجية الخدمات الخارجية',
        description: 'إذا كانت القاعة توفر الضيافة أو الديكور ضمن خدماتها، يتم إعطاء الأولوية لخدمات القاعة.',
        badgeText: 'أولوية المزود الأصلي',
        iconName: 'Lock'
      }
    ],

    testimonials: [
      {
        id: 'vt1',
        providerName: 'مهندس منصور المطيري',
        businessName: 'قاعات لؤلؤة الشرق',
        city: 'الرياض',
        quote: 'نظام إدارة التقويم في ليلة قضى على التشتت وأتاح لعملائنا حجز القاعة وتأكيد العربون مباشرة دون الحاجة لزيارات مكررة.',
        rating: 5,
        highlightTag: 'قاعة أفراح'
      }
    ],

    faqItems: [
      {
        question: 'ما هي الشروط الخاصة بطلب إدراج القاعات؟',
        answer: 'أن تكون القاعة مرخصة رسمياً، وتحقق معايير السلامة والنظافة، وتتوفر صور حقيقية بدقة 16:9 وبحجم أقل من 500KB للصورة.'
      },
      {
        question: 'هل يمكنني إضافة خدمات إضافية خاصة بالقاعة مثل الكوشة والضيافة؟',
        answer: 'نعم! تتيح لك لوحة التحكم إضافة خدمات تكميلية تابعة للقاعة مع تحديد أسعارها ومميزاتها.'
      }
    ],

    primaryCTATtext: 'أضف قاعتك أو استراحتك إلى ليلة الآن',
    primaryCTASubtitle: 'احصل على جاهزية تشغيلية كاملة واستقبل الحجوزات',
    secondaryCTATtext: 'تعرف على مزايا ومؤشرات القاعات',

    isActive: true,
    createdAt: '2026-01-12',
    updatedAt: '2026-08-10'
  },

  // 3. PAGE 3: General Event Services Acquisition Page (صفحة خدمات المناسبات العامة)
  {
    id: 'lpas-services-parent',
    slug: 'providers-services',
    pageType: 'ACQUISITION_SERVICES',
    title: 'انضم كمزود خدمة ووسّع وصولك إلى عملاء المناسبات',
    subtitle: 'المنصة المثالية لمزودي خدمات الضيافة، التصوير، الورد، الديكور، الإضاءة، والتجهيزات',
    badgeText: '✨ الشركاء ومزودو الخدمات المساندة',
    heroHeadline: 'اعرض خدماتك أمام آلاف منظمي وأصحاب المناسبات في منطقتك',
    heroSubheadline: 'اربط خدماتك المستقلة، أضف باقاتك وأسعارك، واستقبل طلبات الخدمة المباشرة مع ضمان التحصيل والعربين.',
    heroImageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
    targetProviderType: 'SERVICE_PROVIDER',
    targetCityId: 'all',
    targetCategoryId: 'all',
    seoTitle: 'سجل كمزود خدمة مناسبات في ليلة - ضيافة، تصوير، ورد، وتجهيزات',
    seoDescription: 'انضم إلى منصة ليلة كمزود خدمة مستقل واستقبل طلبات الحجز الفورية للضيافة والتصوير وتنسيق الديكور في كافة مدن المملكة.',
    keywords: ['مزود خدمة مناسبات', 'خدمات ضيافة', 'مصور أعراس', 'تنسيق ورد مناسبات', 'تأجير مستلزمات'],

    benefits: [
      {
        id: 'sb1',
        iconName: 'ShoppingBag',
        title: 'كتالوج خدمات إلكتروني فاخر',
        description: 'عرض خدماتك وباقاتك بصور توضيحية وأسعار شفافة وسريعة.',
        highlightText: 'كتالوج تفاعلي'
      },
      {
        id: 'sb2',
        iconName: 'Zap',
        title: 'طلبات مباشرة وإشعارات حية',
        description: 'وصول الطلبات مباشرة إلى هاتفك مع إمكانية القبول أو التنسيق الفوري.',
        highlightText: 'إشعارات لحظية'
      },
      {
        id: 'sb3',
        iconName: 'CheckSquare',
        title: 'العزل والخصوصية التامة',
        description: 'استقلالية كاملة لبياناتك وطلباتك وعملائك دون أي تداخل مع مزودين آخرين.',
        highlightText: 'عزل بيانات صارم'
      }
    ],

    processSteps: [
      {
        stepNumber: 1,
        title: 'حدد فئات ومجالات خدماتك',
        description: 'اختر الفئة الرئيسية الفرعية (ضيافة، تصوير، ورد، صوتيات، إلخ).',
        iconName: 'Grid'
      },
      {
        stepNumber: 2,
        title: 'أضف الباقات والأسعار',
        description: 'حدد سعر الخدمة، طريقة الاحتساب (بالساعة/باليوم/بالنفر)، وخيارات العطلات.',
        iconName: 'Tag'
      },
      {
        stepNumber: 3,
        title: 'اعتماد الخدمة واستقبال الطلبات',
        description: 'بعد المراجعة السريعة تظهر خدماتك للعملاء مباشرة.',
        iconName: 'Check'
      }
    ],

    keyFeatures: [
      {
        title: 'دعم العمل الحر والشركات',
        description: 'متاح لأصحاب المشاريع المنزلية، المستقلين، والشركات المتخصصة.',
        badgeText: 'تغطية شاملة',
        iconName: 'Briefcase'
      }
    ],

    testimonials: [
      {
        id: 'st1',
        providerName: 'رنا الشهري',
        businessName: 'زهرة الريف لتنسيق الورود',
        city: 'الرياض',
        quote: 'ليلة وفرت لنا قناة تسويق مستمرة وموثوقة لطلبات تنسيق القاعات والورد دون الحاجة لإعلانات مكلفة.',
        rating: 5,
        highlightTag: 'مزود تنسيق وورد'
      }
    ],

    faqItems: [
      {
        question: 'هل يمكنني التقديم كفرد يحمل وثيقة عمل حر؟',
        answer: 'نعم! تدعم منصة ليلة الشركاء الأفراد الحاصلين على وثيقة العمل الحر المعتمدة.'
      }
    ],

    primaryCTATtext: 'أضف خدماتك إلى منصة ليلة الآن',
    primaryCTASubtitle: 'ابدأ استقبال الطلبات فوراً',
    secondaryCTATtext: 'استكشف الفئات والتصنيفات',

    isActive: true,
    createdAt: '2026-01-15',
    updatedAt: '2026-08-10'
  },

  // 4. PAGE 4: Category Specific Landing Page: Catering & Hospitality (صفحة الضيافة والقهوة)
  {
    id: 'lpas-category-catering',
    slug: 'catering-hospitality',
    pageType: 'CATEGORY_TARGETED',
    title: 'نمِّ أعمال الضيافة والمناسبات مع ليلة',
    subtitle: 'استقبل طلبات بوفيهات الأفراح، القهوة السعودية والنسائية، وتأمين الأطعمة المتميزة',
    badgeText: '☕ فئة الضيافة والأطعمة للمناسبات',
    heroHeadline: 'اجعل خدمات الضيافة والقهوة الخاصة بك الخيار الأول لعملاء المناسبات',
    heroSubheadline: 'اعرض قائمة المألوك المشروبات، صواني الحلى والقهوة، طواقم التقديم، والبوفيهات المفتوحة مع تحديد الأسعار وحجز التواريخ مباشرة.',
    heroImageUrl: 'https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=1200&q=80',
    targetProviderType: 'SERVICE_PROVIDER',
    targetCityId: 'all',
    targetCategoryId: 'catering',
    targetCategoryNameAr: 'الضيافة والقهوة والبوفيهات',
    seoTitle: 'اعرض خدمات الضيافة والقهوة والبوفيهات في منصة ليلة',
    seoDescription: 'سجل نشاط الضيافة والقهوة السعودية والبوفيهات المفتوحة على ليلة واستقبل طلبات المناسبات والأعراس المباشرة.',
    keywords: ['خدمات ضيافة أعراس', 'قهوة نسائية مناسبات', 'بوفيه مفتوح الرياض', 'مشروبات وحلى المناسبات'],

    benefits: [
      {
        id: 'cb1',
        iconName: 'Utensils',
        title: 'عرض البوفيهات والمنيو بالتفصيل',
        description: 'إمكانية تسعير الخدمة بالشخص (بالنفر) أو بالباقة الكلية مع إيضاح الأصناف.',
        highlightText: 'تسعير بالنفر والوجبة'
      },
      {
        id: 'cb2',
        iconName: 'Users',
        title: 'حجز طواقم الضيافة المباشرة',
        description: 'إمكانية إضافة صبابين وصبابات وقهوجية مع تحديد عدد أفراد الطاقم.',
        highlightText: 'إدارة طواقم الضيافة'
      }
    ],

    processSteps: [
      {
        stepNumber: 1,
        title: 'سجل بيانات المطبخ أو شركة الضيافة',
        description: 'أدخل معلومات النشاط ونوع المأكولات والمشروبات.',
        iconName: 'Coffee'
      },
      {
        stepNumber: 2,
        title: 'أضف باقات البوفيه والضيافة',
        description: 'حدد الحد الأدنى للضيوف، الأسعار، وخيارات التوصيل والخدمة.',
        iconName: 'DollarSign'
      },
      {
        stepNumber: 3,
        title: 'استقبل الحجوزات المؤكدة',
        description: 'استقبل العرابين والطلبات ببيانات التاريخ والموقع الدقيق.',
        iconName: 'CheckCircle2'
      }
    ],

    keyFeatures: [
      {
        title: 'دعم القوائم الخاصة والمواسم',
        description: 'تخصيص منيو خاص بأعراس الرجال أو النساء مع المشروبات والحلويات.',
        badgeText: 'تنوع خيارات',
        iconName: 'Menu'
      }
    ],

    testimonials: [
      {
        id: 'ct1',
        providerName: 'أبو فهد العتيبي',
        businessName: 'ضيافة الأصالة للقهوة السعودية',
        city: 'الرياض',
        quote: 'تصلنا طلبات حجز طواقم القهوة والضيافة مباشرة عبر ليلة، وأصبحت المواعيد والمدفوعات واضحة ومنظمة تماماً.',
        rating: 5,
        highlightTag: 'مزود ضيافة وقهوة'
      }
    ],

    faqItems: [
      {
        question: 'هل يمكن احتساب السعر بناءً على عدد الضيوف (بالنفر)؟',
        answer: 'نعم! يدعم محرك التسعير احتساب القيمة لكل ضيف مع تحديد حد أدنى للطلب.'
      }
    ],

    primaryCTATtext: 'أضف خدمات الضيافة والقهوة الآن',
    primaryCTASubtitle: 'ابدأ البيع واستقبل طلبات المناسبات',
    secondaryCTATtext: 'شاهد نماذج مزودي الضيافة',

    isActive: true,
    createdAt: '2026-01-20',
    updatedAt: '2026-08-10'
  },

  // 5. PAGE 5: Combined Geographic x Category Page: Riyadh Venues (قاعات الأفراح والمناسبات في الرياض)
  {
    id: 'lpas-target-riyadh-venues',
    slug: 'venues-riyadh',
    pageType: 'COMBINED_TARGETED',
    title: 'هل تملك قاعة أو استراحة مناسبات في الرياض؟ انضم إلى ليلة',
    subtitle: 'استهدف عملاء الأعراس والمناسبات في العاصمة الرياض وحقق أعلى نسبة إشغال لقاعتك',
    badgeText: '📍 قاعات واستراحات منطقة الرياض',
    heroHeadline: 'اعرض قاعتك واستراحتك أمام أهالي الرياض الباحثين عن التميز في مناسباتهم',
    heroSubheadline: 'منطقة الرياض تشهد أعلى كثافة في حجز القاعات والأفراح. انضم اليوم وسجل منشأتك في محرك البحث الجغرافي الذكي لمنصة ليلة.',
    heroImageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1200&q=80',
    targetProviderType: 'VENUE',
    targetCityId: 'riyadh',
    targetCityNameAr: 'مدينة الرياض',
    targetCategoryId: 'venue',
    targetCategoryNameAr: 'قاعات واستراحات الرياض',
    seoTitle: 'أضف قاعتك أو استراحتك في الرياض - منصة ليلة لحجز القاعات',
    seoDescription: 'انضم إلى شبكة قاعات الأفراح والمناسبات في الرياض على منصة ليلة، واستقبل الحجوزات الفورية من سكان الرياض وضواحيها.',
    keywords: ['قاعات أفراح الرياض', 'استراحات مناسبات الرياض', 'حجز قاعات شمال الرياض', 'منصة ليلة الرياض'],

    benefits: [
      {
        id: 'rvb1',
        iconName: 'MapPin',
        title: 'تغطية شمال، شرق، وجنوب الرياض',
        description: 'ربط قاعتك بالعملاء الباحثين حسب الأحياء والمواقع القريبة في الرياض.',
        highlightText: 'استهداف جغرافي دقيق'
      },
      {
        id: 'rvb2',
        iconName: 'Calendar',
        title: 'استغلال مواسم الإجازات والويكند',
        description: 'مضاعفة الإشغال خلال عطلات نهاية الأسبوع ومواسم الزواجات الكبرى بالرياض.',
        highlightText: 'إشغال مرتفع بالرياض'
      }
    ],

    processSteps: [
      {
        stepNumber: 1,
        title: 'حدد موقع قاعتك في الرياض',
        description: 'الحي، الشارع الرئيسي، والمعالم القريبة بالرياض.',
        iconName: 'Navigation'
      },
      {
        stepNumber: 2,
        title: 'ضبط أسعار مواسم الرياض',
        description: 'تحديد تسعيرة الويكند والمواسم المزدحمة بالعاصمة.',
        iconName: 'DollarSign'
      },
      {
        stepNumber: 3,
        title: 'استقبال الحجوزات المباشرة',
        description: 'وصول طلبات الحجز ببيانات العميل المؤكدة فورا.',
        iconName: 'Sparkles'
      }
    ],

    keyFeatures: [
      {
        title: 'تخصيص البروتوكول النجدي والضيافة',
        description: 'إبراز المزايا والخدمات المتوافقة مع طبيعة واحتياجات مناسبات أهالي الرياض.',
        badgeText: 'ملائمة ثقافية',
        iconName: 'Heart'
      }
    ],

    testimonials: [
      {
        id: 'rvt1',
        providerName: 'سعود السبيعي',
        businessName: 'قصر الرياض للمؤتمرات والأفراح',
        city: 'الرياض',
        quote: 'منذ انضمامنا لـ ليلة بالرياض زادت الحجوزات المؤكدة في وسط الأسبوع بنسبة 35% واستقبلنا طلبات من مختلف أحياء العاصمة.',
        rating: 5,
        highlightTag: 'قاعة بالرياض'
      }
    ],

    faqItems: [
      {
        question: 'هل يغطي النظام جميع أحياء الرياض؟',
        answer: 'نعم! يشمل محرك ليلة أحياء شمال الرياض، الشرق، الغرب، الجنوب، والمحافظات القريبة مثل الدرعية والخرج.'
      }
    ],

    primaryCTATtext: 'أضف قاعتك بالرياض الآن',
    primaryCTASubtitle: 'انضم لشبكة الشركاء المعتمدين في العاصمة',
    secondaryCTATtext: 'استكشف خريطة قاعات الرياض',

    isActive: true,
    createdAt: '2026-01-25',
    updatedAt: '2026-08-10'
  },

  // 6. PAGE 6: Seasonal & Campaign Targeted Page (حملة موسم الأفراح والمناسبات)
  {
    id: 'lpas-campaign-wedding-season',
    slug: 'wedding-season-2026',
    pageType: 'SEASONAL_CAMPAIGN',
    title: 'انضم إلى ليلة قبل انطلاق موسم أفراح ومناسبات 2026',
    subtitle: 'عرض خاص ومزايا استثنائية للمزودين والقاعات الجدد المنضمين خلال الحملة الموسمية',
    badgeText: '🔥 حملة التجهيز لموسم الأعراس 2026',
    heroHeadline: 'استعد لأقوى موسم مناسبات بالسعودية وحقق أعلى عوائد تجارية مع ليلة',
    heroSubheadline: 'سجل نشاطك الآن واحصل على تمييز مجاني في نتائج البحث، لوحة تحليلات متقدمة، وأولوية الظهور في الحملات التسويقية الموجهة للعملاء.',
    heroImageUrl: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1200&q=80',
    targetProviderType: 'ALL',
    targetCityId: 'all',
    targetCategoryId: 'all',
    campaignCode: 'WEDDING_SEASON_2026',
    seoTitle: 'حملة انضمام المزودين لموسم الأفراح 2026 - منصة ليلة',
    seoDescription: 'سجل قاعتك أو خدمتك في منصة ليلة للاستفادة من عرض الموسم المميز وزيادة وصولك لعملاء الأفراح بالمملكة.',
    keywords: ['موسم الأفراح 2026', 'عروض مزودي المناسبات', 'تسجيل قاعات الأعراس', 'حملة ليلة 2026'],

    benefits: [
      {
        id: 'wsb1',
        iconName: 'Crown',
        title: 'شارة شركاء الموسم المعتمدين',
        description: 'إبراز حسابك بشارة تمييز ذهبية تزيد من ثقة العملاء ومعدل التحويل.',
        highlightText: 'شارة شريك موسم ذهبية'
      },
      {
        id: 'wsb2',
        iconName: 'Megaphone',
        title: 'أولوية الظهور في الحملات التسويقية',
        description: 'إدراج قاعتك أو خدمتك ضمن الحملات الإعلانية المدفوعة لمنصة ليلة.',
        highlightText: 'ترويج مجاني مدفوع'
      }
    ],

    processSteps: [
      {
        stepNumber: 1,
        title: 'سجل حسابك وادخل كود الحملة',
        description: 'استخدم كود WEDDING_SEASON_2026 للحصول على المزايا.',
        iconName: 'Gift'
      },
      {
        stepNumber: 2,
        title: 'استكمل إضافة البيانات',
        description: 'أضف الصور والأسعار والباقات الجاهزة.',
        iconName: 'FileCheck'
      },
      {
        stepNumber: 3,
        title: 'تفعيل وتصدر نتائج البحث',
        description: 'تنشيط حسابك فوراً قبل ازدحام الموسم.',
        iconName: 'Rocket'
      }
    ],

    keyFeatures: [
      {
        title: 'دعم فني استشاري مجاني',
        description: 'مساعدة مجانية من فريق ليلة لتنسيق الصور وتسعير الباقات بالشكل الأمثل.',
        badgeText: 'دعم استشاري',
        iconName: 'Headphones'
      }
    ],

    testimonials: [
      {
        id: 'wst1',
        providerName: 'فيصل الغامدي',
        businessName: 'شركة السعد للضيافة والتجهيزات',
        city: 'جدة',
        quote: 'الحملة الموسمية العام الماضي حققت لنا حجوزات مغلقة لـ 3 أشهر قادمة. ننصح جميع المزودين بالانضمام المبكر.',
        rating: 5,
        highlightTag: 'مزود حائز على درع التميز'
      }
    ],

    faqItems: [
      {
        question: 'متى تنتهي الحملة الموسمية؟',
        answer: 'العرض متاح لفترة محدودة وحتى اكتمال العدد المخصص لشركاء الموسم لكل مدينة.'
      }
    ],

    primaryCTATtext: 'احجز مكانك في موسم 2026 الآن',
    primaryCTASubtitle: 'انضمام فوري مع تفعيل المزايا الموسمية',
    secondaryCTATtext: 'الشروط والأحكام الخاصة بالحملة',

    isActive: true,
    createdAt: '2026-02-01',
    updatedAt: '2026-08-10'
  }
];

/**
 * Storage key for user-created dynamic LPAS pages or updates
 */
const LPAS_STORAGE_KEY = 'lailah_lpas_landing_pages_v1';

/**
 * Helper to fetch all registered LPAS landing pages
 */
export function getLPASPages(): LPASLandingPage[] {
  try {
    const stored = localStorage.getItem(LPAS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse LPAS pages from localStorage', e);
  }
  return INITIAL_LPAS_PAGES;
}

/**
 * Helper to save updated LPAS pages list
 */
export function saveLPASPages(pages: LPASLandingPage[]) {
  try {
    localStorage.setItem(LPAS_STORAGE_KEY, JSON.stringify(pages));
    window.dispatchEvent(new Event('lpasUpdated'));
  } catch (e) {
    console.error('Failed to save LPAS pages to localStorage', e);
  }
}

/**
 * Helper to find a specific LPAS page by slug or ID
 */
export function getLPASPageBySlug(slugOrId: string): LPASLandingPage | undefined {
  const pages = getLPASPages();
  return pages.find(p => p.slug === slugOrId || p.id === slugOrId) || pages[0];
}

/**
 * Session storage key for active LPAS acquisition attribution context
 */
export const LPAS_ATTRIBUTION_KEY = 'lailah_lpas_attribution_context';

/**
 * Store user acquisition context when visiting an LPAS page
 */
export function storeLPASAttribution(page: LPASLandingPage, urlSearchParams?: URLSearchParams) {
  try {
    const attributionData = {
      utmSource: urlSearchParams?.get('utm_source') || 'organic_lpas',
      utmMedium: urlSearchParams?.get('utm_medium') || 'landing_page',
      utmCampaign: urlSearchParams?.get('utm_campaign') || page.campaignCode || page.slug,
      utmContent: urlSearchParams?.get('utm_content') || page.pageType,
      utmTerm: urlSearchParams?.get('utm_term') || page.targetCategoryId || 'general',
      landingPageId: page.id,
      campaignId: page.campaignCode,
      targetProviderType: page.targetProviderType,
      targetCategory: page.targetCategoryId,
      targetCity: page.targetCityId,
      referrerUrl: document.referrer || '',
      timestamp: Date.now()
    };

    sessionStorage.setItem(LPAS_ATTRIBUTION_KEY, JSON.stringify(attributionData));
    localStorage.setItem(LPAS_ATTRIBUTION_KEY, JSON.stringify(attributionData));
  } catch (e) {
    console.error('Failed to store LPAS attribution context', e);
  }
}

/**
 * Retrieve current active acquisition attribution context
 */
export function getLPASAttribution() {
  try {
    const stored = sessionStorage.getItem(LPAS_ATTRIBUTION_KEY) || localStorage.getItem(LPAS_ATTRIBUTION_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to read LPAS attribution', e);
  }
  return null;
}
