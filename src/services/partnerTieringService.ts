/**
 * @file partnerTieringService.ts
 * @description خدمة تصنيف وتقييم الشركاء والمزودين لمنصة "ليلة".
 * تقوم بتقديم التقييم التراكمي الشامل بخمسة أبعاد محددة (الأداء التجاري، الاعتمادية التشغيلية، تجربة العميل، الامتثال والثقة، والنضج والاستمرارية)،
 * بالإضافة للتحقق من بوابات الشروط (Eligibility Gates) وتوصيات ترقية أو خفض مستويات الشركاء تلقائياً.
 */

/**
 * واجهة أوزان الأبعاد الخمسة لتقييم المزود (إجمالي 100%)
 */
export interface DimensionWeights {
  /** الأداء التجاري (20%) */
  commercial: number;       
  /** الاعتمادية التشغيلية (30%) */
  operational: number;      
  /** تجربة العميل والجودة (20%) */
  customerExperience: number; 
  /** الامتثال والثقة (20%) */
  compliance: number;       
  /** النضج والاستمرارية (10%) */
  maturity: number;         
}

/**
 * واجهة تهيئة بوابات التأهل والشروط الحاكمة (Gates)
 */
export interface EligibilityGatesConfig {
  /** سريان وسلامة التوثيق والترخيص */
  docIntegrityRequired: boolean;      
  /** اشتراط عدم وجود إيقاف أو تجميد للحساب */
  accountActiveRequired: boolean;     
  /** الحد الأقصى للمخالفات والإنذارات النشطة المسموح بها */
  maxCriticalViolations: number;      
  /** أقصى نسبة إلغاء مسموحة من المزود (%) */
  maxProviderCancellationRate: number; 
  /** الحد الأدنى لعدد الحجوزات المكتملة */
  minCompletedBookings: number;       
  /** الحد الأدنى لعدد الأشهر النشطة في المنصة */
  minActivityMonths: number;          
}

/**
 * واجهة تهيئة حدود ومميزات مستويات الشركاء (Tiers)
 */
export interface TierThresholdConfig {
  /** المعرف الفريد للمستوى */
  key: string;
  /** الاسم الظاهر للمستوى (مثال: شريك استراتيجي) */
  name: string;
  /** الأيقونة التعبيرية للمستوى */
  icon: string;
  /** صنف لون النص في Tailwind */
  color: string;
  /** صنف خلفية الشارة في Tailwind */
  bg: string;
  /** صنف إطار الشارة في Tailwind */
  border: string;
  /** الحد الأدنى للدرجة المركبة المطلوبة للترقية (من 100) */
  minScore: number;                
  /** حد الخفض الهستيري لمنع تذبذب المستوى عند تغير الدرجات الطفيف */
  demotionScore: number;           
  /** فترة التأهيل والاستقرار المطلوبة بالأيام (30, 60, 90 يوماً) */
  qualificationDays: number;       
  /** هل يتطلب الاعتماد النهائي قراراً إدارياً من الإدارة السيادية */
  requiresAdminApproval?: boolean; 
}

/**
 * واجهة سياسة تصنيف الشركاء الكلية
 */
export interface PartnerTierPolicy {
  /** رقم إصدار السياسة */
  policyVersion: string;
  /** تاريخ بداية سريان السياسة */
  effectiveFrom: string;
  /** توزيع أوزان الأبعاد */
  weights: DimensionWeights;
  /** بوابات القبول والتأهل */
  eligibilityGates: EligibilityGatesConfig;
  /** مستويات وتصنيفات الشركاء */
  tiers: TierThresholdConfig[];
}

/** السياسة الافتراضية المعتمدة لتصنيف الشركاء */
export const DEFAULT_PARTNER_TIER_POLICY: PartnerTierPolicy = {
  policyVersion: 'v2026.1.0',
  effectiveFrom: '2026-01-01',
  weights: {
    commercial: 20,
    operational: 30,
    customerExperience: 20,
    compliance: 20,
    maturity: 10
  },
  eligibilityGates: {
    docIntegrityRequired: true,
    accountActiveRequired: true,
    maxCriticalViolations: 0,
    maxProviderCancellationRate: 5.0,
    minCompletedBookings: 3,
    minActivityMonths: 1
  },
  tiers: [
    {
      key: 'strategic',
      name: 'شريك استراتيجي',
      icon: '🤝',
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      minScore: 90,
      demotionScore: 85,
      qualificationDays: 90,
      requiresAdminApproval: true
    },
    {
      key: 'platinum',
      name: 'الشريك البلاتيني / الماسي',
      icon: '💎',
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
      minScore: 85,
      demotionScore: 80,
      qualificationDays: 60
    },
    {
      key: 'gold',
      name: 'شريك ذهبي',
      icon: '🥇',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      minScore: 75,
      demotionScore: 70,
      qualificationDays: 30
    },
    {
      key: 'silver',
      name: 'شريك فضي / مميز',
      icon: '✨',
      color: 'text-blue-600',
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      minScore: 65,
      demotionScore: 60,
      qualificationDays: 14
    },
    {
      key: 'verified',
      name: 'شريك موثق',
      icon: '🎖️',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      minScore: 50,
      demotionScore: 45,
      qualificationDays: 7
    },
    {
      key: 'new',
      name: 'شريك جديد',
      icon: '🌱',
      color: 'text-slate-600',
      bg: 'bg-slate-50',
      border: 'border-slate-200',
      minScore: 0,
      demotionScore: 0,
      qualificationDays: 0
    }
  ]
};

/**
 * واجهة نتيجة فحص بوابة قبول محددة
 */
export interface GateCheckResult {
  gateKey: string;
  label: string;
  passed: boolean;
  actualValue: string | number | boolean;
  requiredValue: string | number | boolean;
  blockingReason?: string;
}

/**
 * واجهة تفصيل بعد تقييمي محدد
 */
export interface DimensionBreakdown {
  dimensionKey: keyof DimensionWeights;
  label: string;
  icon: string;
  weight: number;            // الوزن المئوي (e.g. 20)
  scoreOutOf100: number;     // الدرجة المحسوبة لهذا البعد من 100
  weightedScore: number;     // المساهمة في الدرجة الإجمالية (weight * score / 100)
  subMetrics: {
    metricLabel: string;
    valueFormatted: string;
    subScore: number;
  }[];
}

/**
 * واجهة ملف تقييم أداء المزود الشامل
 */
export interface PartnerPerformanceProfile {
  providerId: number | string;
  providerName: string;
  evaluationWindowDays: number;
  
  // الدرجات
  commercialScore: number;
  operationalScore: number;
  customerExperienceScore: number;
  complianceScore: number;
  maturityScore: number;
  totalCompositeScore: number; // مجموع الدرجات الموزونة (0 إلى 100)
  
  // فحص بوابات التأهل
  isEligible: boolean;
  gateResults: GateCheckResult[];
  blockingReasons: string[];
  
  // نتائج وتوصيات المستوى
  currentTierKey: string;
  recommendedTierKey: string;
  tierInfo: TierThresholdConfig;
  
  // تفاصيل الأبعاد الخمسة
  dimensions: DimensionBreakdown[];
  
  evaluatedAt: string;
  policyVersion: string;
}

/**
 * واجهة سجل قرار تصنيف الشريك
 */
export interface PartnerTierDecision {
  id: string;
  providerId: number | string;
  providerName: string;
  previousTier: string;
  proposedTier: string;
  finalTier: string;
  scoreSnapshot: number;
  isEligible: boolean;
  blockingReasons: string[];
  decisionType: 'AUTOMATIC_PROMOTION' | 'AUTOMATIC_DEMOTION' | 'ADMIN_OVERRIDE' | 'GATES_BLOCKED';
  approvedBy?: string;
  effectiveDate: string;
  policyVersion: string;
  evaluatedAt: string;
}

/**
 * جلب سياسة تصنيف الشركاء الفعالة من التخزين المحلي أو السياسة الافتراضية
 */
export const getActivePartnerTierPolicy = (): PartnerTierPolicy => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('SYSTEM_PARTNER_TIER_POLICY');
      if (stored) {
        return JSON.parse(stored);
      }
    }
  } catch (e) {}
  return DEFAULT_PARTNER_TIER_POLICY;
};

/**
 * حفظ سياسة تصنيف الشركاء المعدلة في التخزين المحلي
 * @param policy السياسة الجديدة
 */
export const savePartnerTierPolicy = (policy: PartnerTierPolicy) => {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('SYSTEM_PARTNER_TIER_POLICY', JSON.stringify(policy));
    }
  } catch (e) {}
};

/**
 * تقييم أداء الشريك وحساب درجاته المركبة وتحديد مستواه المستحق
 * @param provider كائن المزود المحتوي على مؤشرات الأداء والبيانات التشغيلية
 * @param policy سياسة التصنيف المعتمدة
 * @returns PartnerPerformanceProfile ملف التقييم الشامل
 */
export const evaluatePartnerPerformance = (
  provider: any,
  policy: PartnerTierPolicy = getActivePartnerTierPolicy()
): PartnerPerformanceProfile => {
  const p = provider || {};
  
  const bCount = Number(p.bookingsCount ?? p.completedBookings ?? p.bookings ?? 0);
  const rating = Number(p.rating ?? 0);
  const revenue = Number(p.revenue ?? p.completedGMV ?? (bCount * 3000));
  const accRate = Number(p.acceptanceRate ?? (rating >= 4.7 ? 99 : rating >= 4.0 ? 94 : 80));
  const cancRate = Number(p.cancellationRate ?? (rating >= 4.7 ? 0.3 : rating >= 4.0 ? 1.5 : 5));
  const puncRate = Number(p.punctualityRate ?? (rating >= 4.7 ? 99 : rating >= 4.0 ? 95 : 85));
  const respMins = Number(p.responseTimeMins ?? (rating >= 4.7 ? 8 : rating >= 4.0 ? 20 : 60));
  const dispCount = Number(p.provenDisputes ?? 0);
  const compRate = Number(p.profileCompleteness ?? 100);
  const docIntegrity = p.documentationIntegrity !== undefined ? Boolean(p.documentationIntegrity) : true;
  const violations = Number(p.activeViolations ?? 0);
  const months = Number(p.activityMonths ?? (bCount >= 100 ? 18 : bCount >= 20 ? 8 : 2));
  const status = p.status || 'مفعل';
  const growthRate = Number(p.growthRate ?? 15); // %
  const descMatch = Number(p.descriptionMatchRate ?? 98); // %

  // 1. حساب درجة الأداء التجاري (Commercial Score من 100)
  const revScore = Math.min(100, (revenue / 100000) * 100);
  const bScore = Math.min(100, (bCount / 100) * 100);
  const growthScore = Math.min(100, Math.max(0, growthRate * 2 + 50));
  const commercialScore = Math.round(revScore * 0.4 + bScore * 0.4 + growthScore * 0.2);

  // 2. حساب درجة الاعتمادية التشغيلية (Operational Reliability Score من 100)
  const cancScore = Math.max(0, Math.min(100, (10 - cancRate) * 10));
  const respScore = Math.max(0, Math.min(100, 100 - (respMins - 10) * 0.8));
  const operationalScore = Math.round(accRate * 0.35 + cancScore * 0.25 + puncRate * 0.25 + respScore * 0.15);

  // 3. حساب درجة تجربة العميل والجودة (Customer Experience Score من 100)
  const ratingScore = Math.max(0, Math.min(100, (rating - 3.0) * 50));
  const dispScore = Math.max(0, 100 - dispCount * 40);
  const customerExperienceScore = Math.round(ratingScore * 0.5 + dispScore * 0.3 + descMatch * 0.2);

  // 4. حساب درجة الامتثال والثقة (Compliance & Trust Score من 100)
  const docScore = docIntegrity ? 100 : 0;
  const violScore = Math.max(0, 100 - violations * 50);
  const complianceScore = Math.round(compRate * 0.3 + docScore * 0.4 + violScore * 0.3);

  // 5. حساب درجة النضج والاستمرارية بالمنصة (Platform Maturity Score من 100)
  const maturityScore = Math.min(100, Math.max(10, months * 8.33));

  // إجمالي الدرجة المركبة الموزونة
  const w = policy.weights;
  const totalCompositeScore = Math.round(
    (commercialScore * w.commercial +
     operationalScore * w.operational +
     customerExperienceScore * w.customerExperience +
     complianceScore * w.compliance +
     maturityScore * w.maturity) / 100
  );

  // فحص بوابات الشروط والتأهل الصارمة (Eligibility Gates)
  const gates = policy.eligibilityGates;
  const gateResults: GateCheckResult[] = [
    {
      gateKey: 'docIntegrity',
      label: 'سلامة السجل والترخيص والحساب البنكي',
      passed: !gates.docIntegrityRequired || docIntegrity,
      actualValue: docIntegrity ? 'سليم ومكتمل' : 'غير سليم أو ناقص',
      requiredValue: 'سليم ومكتمل',
      blockingReason: !docIntegrity ? 'الوثائق أو السجل التجاري غير سريين أو غير مكتملين' : undefined
    },
    {
      gateKey: 'accountActive',
      label: 'حالة سريان الحساب',
      passed: !gates.accountActiveRequired || status === 'مفعل',
      actualValue: status,
      requiredValue: 'مفعل',
      blockingReason: status !== 'مفعل' ? `الحساب معلق أو بانتظار الموافقة (${status})` : undefined
    },
    {
      gateKey: 'criticalViolations',
      label: 'خلو الحساب من المخالفات الجسيمة والإنذارات',
      passed: violations <= gates.maxCriticalViolations,
      actualValue: violations,
      requiredValue: `<= ${gates.maxCriticalViolations}`,
      blockingReason: violations > gates.maxCriticalViolations ? `توجد ${violations} مخالفات أو إنذارات نشطة` : undefined
    },
    {
      gateKey: 'cancellationRate',
      label: 'أقصى نسبة إلغاء مسموحة من طرف المزود',
      passed: cancRate <= gates.maxProviderCancellationRate,
      actualValue: `${cancRate}%`,
      requiredValue: `<= ${gates.maxProviderCancellationRate}%`,
      blockingReason: cancRate > gates.maxProviderCancellationRate ? `نسبة الإلغاء (${cancRate}%) تتجاوز الحد الأقصى المسموح (${gates.maxProviderCancellationRate}%)` : undefined
    },
    {
      gateKey: 'minBookings',
      label: 'الحد الأدنى للحجوزات المكتملة',
      passed: bCount >= gates.minCompletedBookings,
      actualValue: `${bCount} حجز`,
      requiredValue: `>= ${gates.minCompletedBookings} حجز`,
      blockingReason: bCount < gates.minCompletedBookings ? `عدد الحجوزات المكتملة (${bCount}) أقل من الحد الأدنى (${gates.minCompletedBookings})` : undefined
    },
    {
      gateKey: 'minActivityMonths',
      label: 'الحد الأدنى لستمرارية النشاط في المنصة',
      passed: months >= gates.minActivityMonths,
      actualValue: `${months} شهر`,
      requiredValue: `>= ${gates.minActivityMonths} شهر`,
      blockingReason: months < gates.minActivityMonths ? `مدة النشاط (${months} شهر) أقل من الحد الأدنى (${gates.minActivityMonths} شهر)` : undefined
    }
  ];

  const blockingReasons = gateResults.filter(g => !g.passed && g.blockingReason).map(g => g.blockingReason!);
  const isEligible = gateResults.every(g => g.passed);

  // تحديد المستوى الموصى به
  let recommendedTier = policy.tiers.find(t => t.key === 'new') || policy.tiers[policy.tiers.length - 1];

  if (isEligible) {
    for (const tier of policy.tiers) {
      if (totalCompositeScore >= tier.minScore) {
        recommendedTier = tier;
        break;
      }
    }
  }

  const dimensions: DimensionBreakdown[] = [
    {
      dimensionKey: 'commercial',
      label: 'الأداء التجاري',
      icon: '📈',
      weight: w.commercial,
      scoreOutOf100: commercialScore,
      weightedScore: Math.round((commercialScore * w.commercial) / 100),
      subMetrics: [
        { metricLabel: 'إجمالي قيمة الحجوزات (GMV)', valueFormatted: `${revenue.toLocaleString('ar-SA')} ر.س`, subScore: revScore },
        { metricLabel: 'عدد الحجوزات المكتملة', valueFormatted: `${bCount} حجز`, subScore: bScore },
        { metricLabel: 'معدل نمو النشاط التجاري', valueFormatted: `+${growthRate}%`, subScore: growthScore }
      ]
    },
    {
      dimensionKey: 'operational',
      label: 'الاعتمادية التشغيلية',
      icon: '⚙️',
      weight: w.operational,
      scoreOutOf100: operationalScore,
      weightedScore: Math.round((operationalScore * w.operational) / 100),
      subMetrics: [
        { metricLabel: 'معدل قبول الحجوزات', valueFormatted: `${accRate}%`, subScore: accRate },
        { metricLabel: 'نسبة الإلغاء من المزود', valueFormatted: `${cancRate}%`, subScore: cancScore },
        { metricLabel: 'الالتزام بالمواعيد', valueFormatted: `${puncRate}%`, subScore: puncRate },
        { metricLabel: 'وسيط زمن الرد', valueFormatted: `${respMins} دقيقة`, subScore: respScore }
      ]
    },
    {
      dimensionKey: 'customerExperience',
      label: 'تجربة العميل والجودة',
      icon: '⭐',
      weight: w.customerExperience,
      scoreOutOf100: customerExperienceScore,
      weightedScore: Math.round((customerExperienceScore * w.customerExperience) / 100),
      subMetrics: [
        { metricLabel: 'متوسط تقييم العملاء', valueFormatted: `${rating.toFixed(1)} ⭐`, subScore: ratingScore },
        { metricLabel: 'النزاعات المثبتة ضده', valueFormatted: `${dispCount} نزاع`, subScore: dispScore },
        { metricLabel: 'مطابقة الخدمة للوصف', valueFormatted: `${descMatch}%`, subScore: descMatch }
      ]
    },
    {
      dimensionKey: 'compliance',
      label: 'الامتثال والثقة',
      icon: '🛡️',
      weight: w.compliance,
      scoreOutOf100: complianceScore,
      weightedScore: Math.round((complianceScore * w.compliance) / 100),
      subMetrics: [
        { metricLabel: 'جودة استكمال بيانات الملف', valueFormatted: `${compRate}%`, subScore: compRate },
        { metricLabel: 'سلامة التوثيق والسجل', valueFormatted: docIntegrity ? 'سليم' : 'ناقص', subScore: docScore },
        { metricLabel: 'سجل المخالفات والإنذارات', valueFormatted: `${violations} مخالفة`, subScore: violScore }
      ]
    },
    {
      dimensionKey: 'maturity',
      label: 'النضج والاستمرارية',
      icon: '🏛️',
      weight: w.maturity,
      scoreOutOf100: maturityScore,
      weightedScore: Math.round((maturityScore * w.maturity) / 100),
      subMetrics: [
        { metricLabel: 'مدة النشاط الفعلي بالمنصة', valueFormatted: `${months} شهر`, subScore: maturityScore }
      ]
    }
  ];

  return {
    providerId: p.id || 0,
    providerName: p.name || 'مزود غير محدد',
    evaluationWindowDays: 90,
    commercialScore,
    operationalScore,
    customerExperienceScore,
    complianceScore,
    maturityScore,
    totalCompositeScore,
    isEligible,
    gateResults,
    blockingReasons,
    currentTierKey: p.tierKey || recommendedTier.key,
    recommendedTierKey: recommendedTier.key,
    tierInfo: recommendedTier,
    dimensions,
    evaluatedAt: new Date().toISOString(),
    policyVersion: policy.policyVersion
  };
};

