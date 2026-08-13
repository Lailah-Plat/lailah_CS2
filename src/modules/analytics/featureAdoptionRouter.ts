import { Router, Request, Response } from 'express';

export const featureAdoptionRouter = Router();

export interface FeatureMetric {
  id: string;
  name: string;
  category: 'ai' | 'finance' | 'legal' | 'integrations' | 'operations';
  activeProvidersCount: number;
  totalProvidersCount: number;
  adoptionPercentage: number;
  monthlyUsageCount: number;
  monetizationImpactSAR: number;
  status: 'high_adoption' | 'growing' | 'recommended';
  description: string;
}

const featureMetrics: FeatureMetric[] = [
  {
    id: 'feat_ai_pricing',
    name: 'مساعد التسعير الذكي بالذكاء الاصطناعي (AI Smart Pricing)',
    category: 'ai',
    activeProvidersCount: 68,
    totalProvidersCount: 85,
    adoptionPercentage: 80.0,
    monthlyUsageCount: 1420,
    monetizationImpactSAR: 128000,
    status: 'high_adoption',
    description: 'تحليل مواسم الطلب والمقارنة المباشرة بالأسعار المجاورة لاقتراح السعر الأمثل للقاعات والخدمات.'
  },
  {
    id: 'feat_escrow_wallet',
    name: 'المحفظة والضمان المالي (Wallet & Escrow Vault)',
    category: 'finance',
    activeProvidersCount: 79,
    totalProvidersCount: 85,
    adoptionPercentage: 92.9,
    monthlyUsageCount: 3890,
    monetizationImpactSAR: 485000,
    status: 'high_adoption',
    description: 'احتجاز مبالغ الحجوزات في محفظة الضمان الضريبية لحين اكتمال المناسبة والتسوية المباشرة.'
  },
  {
    id: 'feat_ical_sync',
    name: 'مزامنة التقويم الخارجي (iCal Auto-Sync)',
    category: 'integrations',
    activeProvidersCount: 54,
    totalProvidersCount: 85,
    adoptionPercentage: 63.5,
    monthlyUsageCount: 890,
    monetizationImpactSAR: 64000,
    status: 'growing',
    description: 'ربط تقويم المنصة مع Google Calendar وتطبيقات التقويم لحظر المواعيد المزدوجة.'
  },
  {
    id: 'feat_econtract_bundle',
    name: 'تصدير حزمة الإثبات الرقمي للعقود (E-Contract Audit Package)',
    category: 'legal',
    activeProvidersCount: 72,
    totalProvidersCount: 85,
    adoptionPercentage: 84.7,
    monthlyUsageCount: 2150,
    monetizationImpactSAR: 210000,
    status: 'high_adoption',
    description: 'توليد شهادة التوقيع الإلكتروني وتصدير ملفات SHA-256 وسجلات IP للتدقيق القضائي.'
  },
  {
    id: 'feat_webhook_listener',
    name: 'مستقبل الدفع التلقائي عبر الخادم (Payment Webhook Listener)',
    category: 'operations',
    activeProvidersCount: 85,
    totalProvidersCount: 85,
    adoptionPercentage: 100.0,
    monthlyUsageCount: 4120,
    monetizationImpactSAR: 620000,
    status: 'high_adoption',
    description: 'استقبال وتأكيد عمليات السداد حظياً Server-to-Server لمنع التلاعب بجلسة المتصفح.'
  },
  {
    id: 'feat_zatca_invoicing',
    name: 'الفاتورة الضريبية الموحدة الربط المباشر (ZATCA Phase 2 E-Invoicing)',
    category: 'finance',
    activeProvidersCount: 81,
    totalProvidersCount: 85,
    adoptionPercentage: 95.3,
    monthlyUsageCount: 3950,
    monetizationImpactSAR: 540000,
    status: 'high_adoption',
    description: 'إصدار الفواتير الضريبية المبسطة بـ QR Code متوافق مع هيئة الزكاة والضريبة والجمارك.'
  }
];

/**
 * @route GET /api/analytics/feature-adoption
 * @description استرجاع مؤشرات استخدام وتحليلات المزايا المتقدمة وأثرها التجاري على باقات الاشتراك
 */
featureAdoptionRouter.get('/', (req: Request, res: Response) => {
  const avgAdoption = (featureMetrics.reduce((s, f) => s + f.adoptionPercentage, 0) / featureMetrics.length).toFixed(1);
  const totalMonetizationImpact = featureMetrics.reduce((s, f) => s + f.monetizationImpactSAR, 0);

  res.json({
    success: true,
    summary: {
      averageAdoptionRate: `${avgAdoption}%`,
      totalProvidersEvaluated: 85,
      totalMonetizationImpactSAR: totalMonetizationImpact,
      topFeature: featureMetrics[4].name,
      evaluationDate: new Date().toISOString()
    },
    features: featureMetrics
  });
});
