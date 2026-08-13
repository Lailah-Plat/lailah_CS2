import { Router, Request, Response } from 'express';

export const affiliatesRouter = Router();

interface AffiliateCode {
  id: string;
  code: string;
  promoterName: string;
  promoterType: 'influencer' | 'partner' | 'agency' | 'employee';
  discountPercentage: number;
  commissionPercentage: number;
  clicksCount: number;
  conversionsCount: number;
  totalSalesVolume: number;
  totalCommissionEarned: number;
  status: 'active' | 'paused' | 'expired';
  createdAt: string;
  refLink: string;
}

interface ConversionLog {
  id: string;
  affiliateCode: string;
  bookingNumber: string;
  customerName: string;
  saleAmount: number;
  discountApplied: number;
  commissionEarned: number;
  timestamp: string;
}

// In-memory initial data for affiliate campaigns
const affiliateCodes: AffiliateCode[] = [
  {
    id: 'AFF-001',
    code: 'LAYLAH26',
    promoterName: 'شبكة تسويق الرياض للفعاليات',
    promoterType: 'agency',
    discountPercentage: 10,
    commissionPercentage: 5,
    clicksCount: 342,
    conversionsCount: 28,
    totalSalesVolume: 145000,
    totalCommissionEarned: 7250,
    status: 'active',
    createdAt: '2026-01-15',
    refLink: 'https://layla.sa/?ref=LAYLAH26'
  },
  {
    id: 'AFF-002',
    code: 'WEDDING2026',
    promoterName: 'صانعة المحتوى سارة الفعالية',
    promoterType: 'influencer',
    discountPercentage: 15,
    commissionPercentage: 7,
    clicksCount: 512,
    conversionsCount: 41,
    totalSalesVolume: 218000,
    totalCommissionEarned: 15260,
    status: 'active',
    createdAt: '2026-02-01',
    refLink: 'https://layla.sa/?ref=WEDDING2026'
  },
  {
    id: 'AFF-003',
    code: 'PROVIDER10',
    promoterName: 'رابط إحالة الشركاء المباشر',
    promoterType: 'partner',
    discountPercentage: 5,
    commissionPercentage: 3,
    clicksCount: 189,
    conversionsCount: 14,
    totalSalesVolume: 82000,
    totalCommissionEarned: 2460,
    status: 'active',
    createdAt: '2026-03-10',
    refLink: 'https://layla.sa/?ref=PROVIDER10'
  }
];

const conversionLogs: ConversionLog[] = [
  {
    id: 'CONV-101',
    affiliateCode: 'LAYLAH26',
    bookingNumber: 'BKG-26-0000000012',
    customerName: 'فهد العتيبي',
    saleAmount: 12000,
    discountApplied: 1200,
    commissionEarned: 600,
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 'CONV-102',
    affiliateCode: 'WEDDING2026',
    bookingNumber: 'BKG-26-0000000018',
    customerName: 'نورة الشمري',
    saleAmount: 18500,
    discountApplied: 2775,
    commissionEarned: 1295,
    timestamp: new Date(Date.now() - 3600000 * 12).toISOString()
  }
];

/**
 * @route GET /api/marketing/affiliates
 * @description استرجاع قائمة أكواد التسويق بالعمولة والروابط المخصصة
 */
affiliatesRouter.get('/', (req: Request, res: Response) => {
  const totalSales = affiliateCodes.reduce((sum, c) => sum + c.totalSalesVolume, 0);
  const totalCommissions = affiliateCodes.reduce((sum, c) => sum + c.totalCommissionEarned, 0);
  const totalClicks = affiliateCodes.reduce((sum, c) => sum + c.clicksCount, 0);
  const totalConversions = affiliateCodes.reduce((sum, c) => sum + c.conversionsCount, 0);

  res.json({
    success: true,
    summary: {
      totalCodes: affiliateCodes.length,
      totalClicks,
      totalConversions,
      conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(1) + '%' : '0%',
      totalSalesVolumeSAR: totalSales,
      totalCommissionsEarnedSAR: totalCommissions
    },
    affiliateCodes,
    recentConversions: conversionLogs.slice(0, 20)
  });
});

/**
 * @route POST /api/marketing/affiliates
 * @description إنشاء رمز تسويق بالعمولة جديد ورابط إحالة مخصص
 */
affiliatesRouter.post('/', (req: Request, res: Response) => {
  try {
    const { promoterName, promoterType = 'influencer', code, discountPercentage = 10, commissionPercentage = 5 } = req.body;

    if (!promoterName || !code) {
      return res.status(400).json({ success: false, error: 'يلزم إدخال اسم المسوق والرمز التسويقي' });
    }

    const cleanCode = String(code).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

    // التحقق من عدم تكرار الرمز
    if (affiliateCodes.some(c => c.code === cleanCode)) {
      return res.status(400).json({ success: false, error: 'الرمز التسويقي موجود مسبقاً، يرجى اختيار رمز آخر' });
    }

    const newAffiliate: AffiliateCode = {
      id: `AFF-${String(affiliateCodes.length + 1).padStart(3, '0')}`,
      code: cleanCode,
      promoterName,
      promoterType,
      discountPercentage: Number(discountPercentage),
      commissionPercentage: Number(commissionPercentage),
      clicksCount: 0,
      conversionsCount: 0,
      totalSalesVolume: 0,
      totalCommissionEarned: 0,
      status: 'active',
      createdAt: new Date().toISOString().split('T')[0],
      refLink: `https://layla.sa/?ref=${cleanCode}`
    };

    affiliateCodes.unshift(newAffiliate);

    const io = req.app.get('io');
    if (io) {
      io.emit('affiliate_created', newAffiliate);
    }

    return res.json({
      success: true,
      message: 'تم إنشاء رابط الكود التسويقي بنجاح وتفعيل تتبع العمولات',
      affiliate: newAffiliate
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * @route POST /api/marketing/affiliates/track-click
 * @description تتبع النقر على رابط الإحالة والتسجيل
 */
affiliatesRouter.post('/track-click', (req: Request, res: Response) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, error: 'Code required' });

  const aff = affiliateCodes.find(c => c.code === String(code).toUpperCase());
  if (aff) {
    aff.clicksCount += 1;
    return res.json({ success: true, code: aff.code, clicksCount: aff.clicksCount, discountPercentage: aff.discountPercentage });
  }

  return res.status(404).json({ success: false, error: 'الكود غير صالح' });
});

/**
 * @route POST /api/marketing/affiliates/track-conversion
 * @description تسجيل تحويل حجز وتطبيق نسبة الخصم وحساب عمولة المسوق آلياً
 */
affiliatesRouter.post('/track-conversion', (req: Request, res: Response) => {
  const { code, bookingNumber, customerName = 'عميل المنصة', saleAmount = 0 } = req.body;
  
  if (!code || !bookingNumber) {
    return res.status(400).json({ success: false, error: 'يلزم الكود ورقم الحجز' });
  }

  const aff = affiliateCodes.find(c => c.code === String(code).toUpperCase());
  if (!aff || aff.status !== 'active') {
    return res.status(400).json({ success: false, error: 'كود التسويق غير فعال أو غير موجود' });
  }

  const numericSale = Number(saleAmount) || 10000;
  const discountAmount = (numericSale * aff.discountPercentage) / 100;
  const netSale = numericSale - discountAmount;
  const commissionEarned = (netSale * aff.commissionPercentage) / 100;

  aff.conversionsCount += 1;
  aff.totalSalesVolume += netSale;
  aff.totalCommissionEarned += commissionEarned;

  const convLog: ConversionLog = {
    id: `CONV-${Date.now()}`,
    affiliateCode: aff.code,
    bookingNumber,
    customerName,
    saleAmount: netSale,
    discountApplied: discountAmount,
    commissionEarned,
    timestamp: new Date().toISOString()
  };

  conversionLogs.unshift(convLog);

  const io = req.app.get('io');
  if (io) {
    io.emit('affiliate_conversion_recorded', {
      affiliateCode: aff.code,
      promoterName: aff.promoterName,
      commissionEarned,
      bookingNumber
    });
  }

  return res.json({
    success: true,
    message: 'تم احتساب خصم الحجز وتسجيل عمولة المسوق بنجاح',
    conversion: convLog,
    affiliateSummary: {
      code: aff.code,
      totalCommissionEarned: aff.totalCommissionEarned,
      conversionsCount: aff.conversionsCount
    }
  });
});
