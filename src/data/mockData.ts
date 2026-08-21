import { Promotion } from '../types';
import { convertDigits } from '../utils/digitConverter';
import { evaluatePartnerPerformance } from '../services/partnerTieringService';

export const subscriptionPackages = [
  {
    id: 'basic',
    name: 'الباقة الأساسية',
    monthlyPrice: 99,
    yearlyPrice: Math.floor(99 * 12 * 0.8),
    features: ['إدراج قاعة واحدة', 'نظام حجوزات مبسط', 'دعم فني عبر البريد', 'تقارير شهرية'],
    isPopular: false
  },
  {
    id: 'business',
    name: 'باقة الأعمال',
    monthlyPrice: 199,
    yearlyPrice: Math.floor(199 * 12 * 0.8),
    features: ['إدراج 3 قاعات', 'نظام حجوزات متقدم', 'دعم فني على مدار الساعة', 'تقارير متقدمة', 'الربط ببوابات الدفع'],
    isPopular: true
  },
  {
    id: 'pro',
    name: 'الباقة الاحترافية',
    monthlyPrice: 399,
    yearlyPrice: Math.floor(399 * 12 * 0.8),
    features: ['إدراج غير محدود للقاعات', 'نظام إدارة متكامل', 'مدير حساب مخصص', 'وصول لبيانات العملاء', 'أولوية في الظهور'],
    isPopular: false
  }
];

export interface Review {
  id: number | string;
  author: string;
  rating: number;
  text: string;
  date: string;
}

export interface ExtraService {
  id: string;
  name: string;
  desc: string;
  price: number;
}

export interface Provider {
  id: number;
  name: string;
  type: string;
  idNumber: string;
  expiryDate: string;
  phone: string;
  email: string;
  taxNumber?: string;
  iban: string;
  region: string;
  city: string;
  nationalAddress: string;
  status: string;
  pledge: boolean;
  role: string;
  isSuccessfulPartner: boolean;
  bookingsCount: number;
  rating: number;
  revenue?: number;
  acceptanceRate?: number;       // معدل قبول الحجوزات (%)
  cancellationRate?: number;     // نسبة الإلغاء من طرف المزود (%)
  punctualityRate?: number;      // الالتزام بالمواعيد (%)
  responseTimeMins?: number;     // سرعة الرد (بالدقائق)
  provenDisputes?: number;       // النزاعات المثبتة
  profileCompleteness?: number;  // جودة استكمال البيانات (%)
  documentationIntegrity?: boolean; // سلامة التوثيق ورخصة العمل
  activeViolations?: number;     // المخالفات والإنذارات
  activityMonths?: number;       // مدة النشاط في المنصة (بالأشهر)
  packageName?: string;
  packageDuration?: 'monthly' | 'yearly';
  crExpiryDate?: string;
  crNumber?: string;
  extraAddress?: string;
  reviewsCount?: number;
  showProviderToCustomers?: boolean;
  documents?: {
    type: string;
    name: string;
    url: string;
    uploadDate: string;
  }[];
}

export const providers: Provider[] = [
  {
    id: 4, name: 'شركة أطياف لتنظيم المعارض', type: 'منشأة', idNumber: '1010123456',
    expiryDate: '2027-01-01', phone: '0501234567', email: 'info@atyaf.com',
    taxNumber: '300123456700003', iban: 'SA1234567890123456789012',
    region: 'الرياض', city: 'الرياض', nationalAddress: '1234 رمز 5678',
    status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: true,
    bookingsCount: 120, rating: 4.9, revenue: 380000, acceptanceRate: 98.5, cancellationRate: 0.5,
    punctualityRate: 99.0, responseTimeMins: 8, provenDisputes: 0, profileCompleteness: 100,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 24,
    packageName: 'الباقة الاحترافية', packageDuration: 'yearly',
    documents: [
      { type: 'cr', name: 'شهادة السجل التجاري', url: '#', uploadDate: '2024-01-10' },
      { type: 'vat', name: 'شهادة القيمة المضافة', url: '#', uploadDate: '2024-01-12' },
      { type: 'iban', name: 'شهادة الآيبان', url: '#', uploadDate: '2024-01-15' }
    ]
  },
  {
    id: 27, name: 'سالم الدوسري', type: 'فرد', idNumber: '1020304050',
    expiryDate: '2028-05-15', phone: '0551234567', email: 'salem@example.com',
    iban: 'SA0987654321098765432109', region: 'مكة المكرمة', city: 'جدة',
    nationalAddress: '4321 رمز 8765', status: 'بانتظار الموافقة', pledge: true, role: 'agency', isSuccessfulPartner: false,
    bookingsCount: 12, rating: 4.2, revenue: 24000, acceptanceRate: 82.0, cancellationRate: 4.0,
    punctualityRate: 88.0, responseTimeMins: 45, provenDisputes: 1, profileCompleteness: 85,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 5,
    packageName: 'الباقة الأساسية', packageDuration: 'monthly',
    documents: [
      { type: 'id', name: 'صورة الهوية الوطنية', url: '#', uploadDate: '2024-02-05' },
      { type: 'iban', name: 'شهادة الآيبان', url: '#', uploadDate: '2024-02-07' }
    ]
  },
  {
    id: 5, name: 'مجموعة قاعات الرياض', type: 'منشأة', idNumber: '1010001111',
    expiryDate: '2027-12-30', phone: '0500001111', email: 'riyadh@halls.com',
    iban: 'SA1111111111111111111111', region: 'الرياض', city: 'الرياض',
    nationalAddress: '1111 رمز 2222', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 60, rating: 4.6, revenue: 190000, acceptanceRate: 91.0, cancellationRate: 2.0,
    punctualityRate: 94.0, responseTimeMins: 20, provenDisputes: 0, profileCompleteness: 95,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 14,
    packageName: 'باقة الأعمال', packageDuration: 'yearly',
    documents: [
      { type: 'cr', name: 'شهادة السجل التجاري', url: '#', uploadDate: '2023-11-20' },
      { type: 'iban', name: 'شهادة الآيبان', url: '#', uploadDate: '2023-11-22' }
    ]
  },
  {
    id: 14, name: 'شركة النخيل للاستثمارات', type: 'منشأة', idNumber: '1010002222',
    expiryDate: '2028-01-01', phone: '0500002222', email: 'nakheel@invest.com',
    iban: 'SA2222222222222222222222', region: 'مكة المكرمة', city: 'جدة',
    nationalAddress: '2222 رمز 3333', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 25, rating: 4.3, revenue: 75000, acceptanceRate: 88.0, cancellationRate: 3.5,
    punctualityRate: 90.0, responseTimeMins: 30, provenDisputes: 0, profileCompleteness: 90,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 8,
    packageName: 'باقة الأعمال', packageDuration: 'monthly',
    documents: [
      { type: 'cr', name: 'شهادة السجل التجاري', url: '#', uploadDate: '2024-03-01' }
    ]
  },
  {
    id: 15, name: 'مؤسسة ليلة لخدمات للمناسبات', type: 'منشأة', idNumber: '1010003333',
    expiryDate: '2029-01-01', phone: '0500000000', email: 'lailah.plat@gmail.com',
    iban: 'SA3333333333333333333333', region: 'الرياض', city: 'الرياض',
    nationalAddress: '3333 رمز 4444', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: true,
    bookingsCount: 220, rating: 5.0, revenue: 650000, acceptanceRate: 99.5, cancellationRate: 0.1,
    punctualityRate: 99.8, responseTimeMins: 5, provenDisputes: 0, profileCompleteness: 100,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 36,
    packageName: 'الباقة الاحترافية', packageDuration: 'yearly',
    documents: [
      { type: 'cr', name: 'شهادة السجل التجاري', url: '#', uploadDate: '2024-04-01' },
      { type: 'iban', name: 'شهادة الآيبان', url: '#', uploadDate: '2024-04-05' }
    ]
  },
  {
    id: 16, name: 'صالون الأناقة للضيافة والتمثيل', type: 'منشأة', idNumber: '1010004444',
    expiryDate: '2028-10-10', phone: '0501112222', email: 'anaga@example.com',
    taxNumber: '300123456700004', iban: 'SA4444444444444444444444', region: 'الرياض', city: 'الرياض',
    nationalAddress: '4444 رمز 5555', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 35, rating: 4.5, revenue: 105000, acceptanceRate: 89.0, cancellationRate: 2.5,
    punctualityRate: 92.0, responseTimeMins: 25, provenDisputes: 0, profileCompleteness: 90,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 10,
    packageName: 'الباقة الأساسية', packageDuration: 'monthly',
    documents: []
  },
  {
    id: 17, name: 'شركة الضيافة الذهبية المحدودة', type: 'منشأة', idNumber: '1010005555',
    expiryDate: '2029-05-15', phone: '0503334444', email: 'golden@hospitality.com',
    taxNumber: '300123456700005', iban: 'SA5555555555555555555555', region: 'مكة المكرمة', city: 'مكة المكرمة',
    nationalAddress: '5555 رمز 6666', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: true,
    bookingsCount: 95, rating: 4.8, revenue: 310000, acceptanceRate: 96.0, cancellationRate: 1.0,
    punctualityRate: 97.0, responseTimeMins: 12, provenDisputes: 0, profileCompleteness: 100,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 18,
    packageName: 'باقة الأعمال', packageDuration: 'yearly',
    documents: []
  },
  {
    id: 26, name: 'استوديو روتانا الفوتوغرافي', type: 'فرد', idNumber: '2030405060',
    expiryDate: '2027-12-11', phone: '0505556666', email: 'rotana@studio.com',
    iban: 'SA6666666666666666666666', region: 'الشرقية', city: 'الدمام',
    nationalAddress: '6666 رمز 7777', status: 'مفعل', pledge: true, role: 'agency', isSuccessfulPartner: true,
    bookingsCount: 110, rating: 4.9, revenue: 290000, acceptanceRate: 97.5, cancellationRate: 0.8,
    punctualityRate: 98.5, responseTimeMins: 10, provenDisputes: 0, profileCompleteness: 100,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 20,
    packageName: 'الباقة الاحترافية', packageDuration: 'yearly',
    documents: []
  },
  {
    id: 19, name: 'قصر الفخامة لإقامة المناسبات والسهرات', type: 'منشأة', idNumber: '1010007777',
    expiryDate: '2028-04-20', phone: '0507778888', email: 'fakhama@palace.com',
    taxNumber: '300123456700007', iban: 'SA7777777777777777777777', region: 'المدينة المنورة', city: 'المدينة المنورة',
    nationalAddress: '7777 رمز 8888', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 40, rating: 4.4, revenue: 140000, acceptanceRate: 87.0, cancellationRate: 3.0,
    punctualityRate: 89.0, responseTimeMins: 35, provenDisputes: 1, profileCompleteness: 88,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 11,
    packageName: 'الباقة الاحترافية', packageDuration: 'yearly',
    documents: []
  },
  {
    id: 18, name: 'شركة كوش الفخمة وتنسيق الأفراح والعقود', type: 'منشأة', idNumber: '1010008888',
    expiryDate: '2029-01-11', phone: '0508889999', email: 'kosha@fakhma.com',
    taxNumber: '300123456700008', iban: 'SA8888888888888888888888', region: 'عسير', city: 'أبها',
    nationalAddress: '8888 رمز 9999', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 18, rating: 4.1, revenue: 54000, acceptanceRate: 81.0, cancellationRate: 5.0,
    punctualityRate: 86.0, responseTimeMins: 50, provenDisputes: 1, profileCompleteness: 82,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 4,
    packageName: 'باقة الأعمال', packageDuration: 'monthly',
    documents: []
  },
  {
    id: 21, name: 'مؤسسة المذاق العربي للحلويات والضيافة', type: 'فرد', idNumber: '1020309999',
    expiryDate: '2028-09-09', phone: '0509991111', email: 'arabian@taste.com',
    iban: 'SA9999999999999999999999', region: 'القصيم', city: 'بريدة',
    nationalAddress: '9999 رمز 1111', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 22, rating: 4.3, revenue: 66000, acceptanceRate: 85.0, cancellationRate: 4.0,
    punctualityRate: 88.0, responseTimeMins: 40, provenDisputes: 0, profileCompleteness: 85,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 6,
    packageName: 'الباقة الأساسية', packageDuration: 'monthly',
    documents: []
  },
  {
    id: 22, name: 'شركة لمسات لتنظيم المؤتمرات والمعارض العامة', type: 'منشأة', idNumber: '1010009991',
    expiryDate: '2027-11-30', phone: '0555552222', email: 'lamasat@exhibits.com',
    taxNumber: '310123456700003', iban: 'SA1212121212121212121212', region: 'الرياض', city: 'الرياض',
    nationalAddress: '1212 رمز 1313', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: true,
    bookingsCount: 145, rating: 5.0, revenue: 450000, acceptanceRate: 99.0, cancellationRate: 0.2,
    punctualityRate: 99.5, responseTimeMins: 6, provenDisputes: 0, profileCompleteness: 100,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 28,
    packageName: 'الباقة الاحترافية', packageDuration: 'yearly',
    documents: []
  },
  {
    id: 23, name: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي', type: 'منشأة', idNumber: '1010009992',
    expiryDate: '2028-03-24', phone: '0555553333', email: 'nokba@resorts.com',
    taxNumber: '320123456700003', iban: 'SA1313131313131313131313', region: 'مكة المكرمة', city: 'الطائف',
    nationalAddress: '1313 رمز 1414', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 50, rating: 4.6, revenue: 160000, acceptanceRate: 92.0, cancellationRate: 2.0,
    punctualityRate: 95.0, responseTimeMins: 18, provenDisputes: 0, profileCompleteness: 92,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 12,
    packageName: 'باقة الأعمال', packageDuration: 'monthly',
    documents: []
  },
  {
    id: 24, name: 'أنوار المدينة للدي جي والفرق الشعبية وتجهيز الصوت', type: 'فرد', idNumber: '1020309993',
    expiryDate: '2028-07-20', phone: '0555554444', email: 'madina.dj@example.com',
    iban: 'SA1414141414141414141414', region: 'المدينة المنورة', city: 'المدينة المنورة',
    nationalAddress: '1414 رمز 1515', status: 'بانتظار الموافقة', pledge: true, role: 'provider', isSuccessfulPartner: false,
    bookingsCount: 8, rating: 4.0, revenue: 24000, acceptanceRate: 78.0, cancellationRate: 6.0,
    punctualityRate: 82.0, responseTimeMins: 60, provenDisputes: 1, profileCompleteness: 75,
    documentationIntegrity: false, activeViolations: 0, activityMonths: 2,
    packageName: 'الباقة الأساسية', packageDuration: 'monthly',
    documents: []
  },
  {
    id: 25, name: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات', type: 'منشأة', idNumber: '1010009994',
    expiryDate: '2029-06-15', phone: '0555555555', email: 'reem@hospitality.com',
    taxNumber: '330123456700003', iban: 'SA1515151515151515151515', region: 'الرياض', city: 'الرياض',
    nationalAddress: '1515 رمز 1616', status: 'مفعل', pledge: true, role: 'provider', isSuccessfulPartner: true,
    bookingsCount: 160, rating: 4.9, revenue: 510000, acceptanceRate: 98.0, cancellationRate: 0.4,
    punctualityRate: 98.8, responseTimeMins: 7, provenDisputes: 0, profileCompleteness: 100,
    documentationIntegrity: true, activeViolations: 0, activityMonths: 30,
    packageName: 'الباقة الاحترافية', packageDuration: 'yearly',
    documents: []
  }
];

export interface PartnerLevelCriteria {
  bookings: number;             // عدد الحجوزات الناجحة
  rating: number;               // متوسط التقييم
  revenue: number;              // الإيرادات المالية المحققة (ر.س)
  acceptanceRate: number;       // معدل قبول الحجوزات (%)
  cancellationRate: number;     // أقصى نسبة إلغاء مسموحة من المزود (%)
  punctualityRate: number;      // الالتزام بالمواعيد (%)
  responseTimeMins: number;     // أقصى زمن رد بالدقائق
  provenDisputes: number;       // أقصى عدد نزاعات مثبتة
  profileCompleteness: number;  // جودة استكمال البيانات (%)
  docIntegrityRequired: boolean;// اشتراط توثيق المستندات ورخصة العمل
  activeViolations: number;     // أقصى عدد مخالفات وإنذارات نشطة
  activityMonths: number;       // مدة النشاط في المنصة (بالأشهر)
}

export const DEFAULT_PARTNER_LEVEL_THRESHOLDS: Record<string, PartnerLevelCriteria> = {
  strategic: {
    bookings: 200, rating: 4.8, revenue: 100000, acceptanceRate: 98, cancellationRate: 1,
    punctualityRate: 98, responseTimeMins: 15, provenDisputes: 0, profileCompleteness: 100,
    docIntegrityRequired: true, activeViolations: 0, activityMonths: 12
  },
  diamond: {
    bookings: 120, rating: 4.7, revenue: 60000, acceptanceRate: 95, cancellationRate: 2,
    punctualityRate: 95, responseTimeMins: 25, provenDisputes: 0, profileCompleteness: 95,
    docIntegrityRequired: true, activeViolations: 0, activityMonths: 9
  },
  elite: {
    bookings: 70, rating: 4.5, revenue: 30000, acceptanceRate: 90, cancellationRate: 3,
    punctualityRate: 92, responseTimeMins: 45, provenDisputes: 1, profileCompleteness: 90,
    docIntegrityRequired: true, activeViolations: 0, activityMonths: 6
  },
  gold: {
    bookings: 35, rating: 4.3, revenue: 15000, acceptanceRate: 85, cancellationRate: 5,
    punctualityRate: 88, responseTimeMins: 60, provenDisputes: 2, profileCompleteness: 85,
    docIntegrityRequired: true, activeViolations: 1, activityMonths: 3
  },
  distinguished: {
    bookings: 20, rating: 4.0, revenue: 5000, acceptanceRate: 80, cancellationRate: 7,
    punctualityRate: 85, responseTimeMins: 90, provenDisputes: 3, profileCompleteness: 80,
    docIntegrityRequired: true, activeViolations: 1, activityMonths: 2
  },
  rising: {
    bookings: 10, rating: 3.8, revenue: 1000, acceptanceRate: 75, cancellationRate: 10,
    punctualityRate: 80, responseTimeMins: 120, provenDisputes: 3, profileCompleteness: 70,
    docIntegrityRequired: false, activeViolations: 2, activityMonths: 1
  },
  certified: {
    bookings: 5, rating: 3.5, revenue: 0, acceptanceRate: 60, cancellationRate: 15,
    punctualityRate: 70, responseTimeMins: 240, provenDisputes: 5, profileCompleteness: 60,
    docIntegrityRequired: false, activeViolations: 3, activityMonths: 0
  }
};

export const getPartnerLevelThresholds = (): Record<string, PartnerLevelCriteria> => {
  try {
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('PARTNER_LEVEL_THRESHOLDS');
      if (stored) {
        const parsed = JSON.parse(stored);
        const result: Record<string, any> = {};
        Object.keys(DEFAULT_PARTNER_LEVEL_THRESHOLDS).forEach(key => {
          const defKey = (DEFAULT_PARTNER_LEVEL_THRESHOLDS as any)[key];
          const storedKey = parsed[key] || {};
          result[key] = {
            bookings: storedKey.bookings ?? parsed[`${key}Bookings`] ?? defKey.bookings,
            rating: storedKey.rating ?? parsed[`${key}Rating`] ?? defKey.rating,
            revenue: storedKey.revenue ?? defKey.revenue,
            acceptanceRate: storedKey.acceptanceRate ?? defKey.acceptanceRate,
            cancellationRate: storedKey.cancellationRate ?? defKey.cancellationRate,
            punctualityRate: storedKey.punctualityRate ?? defKey.punctualityRate,
            responseTimeMins: storedKey.responseTimeMins ?? defKey.responseTimeMins,
            provenDisputes: storedKey.provenDisputes ?? defKey.provenDisputes,
            profileCompleteness: storedKey.profileCompleteness ?? defKey.profileCompleteness,
            docIntegrityRequired: storedKey.docIntegrityRequired ?? defKey.docIntegrityRequired,
            activeViolations: storedKey.activeViolations ?? defKey.activeViolations,
            activityMonths: storedKey.activityMonths ?? defKey.activityMonths,
          };
        });
        return result as Record<string, PartnerLevelCriteria>;
      }
    }
  } catch (e) {}
  return DEFAULT_PARTNER_LEVEL_THRESHOLDS;
};

export const evaluateProviderCriteriaBreakdown = (providerData: any, targetTierKey: string = 'strategic') => {
  const thresholds = getPartnerLevelThresholds();
  const criteria = thresholds[targetTierKey] || thresholds.strategic;

  const b = Number(providerData?.bookingsCount ?? providerData?.bookings ?? 0);
  const r = Number(providerData?.rating ?? 0);
  const rev = Number(providerData?.revenue ?? (b * 3000));
  const acc = Number(providerData?.acceptanceRate ?? (r >= 4.7 ? 99 : r >= 4.0 ? 94 : 80));
  const canc = Number(providerData?.cancellationRate ?? (r >= 4.7 ? 0.3 : r >= 4.0 ? 1.5 : 5));
  const punc = Number(providerData?.punctualityRate ?? (r >= 4.7 ? 99 : r >= 4.0 ? 95 : 85));
  const resp = Number(providerData?.responseTimeMins ?? (r >= 4.7 ? 8 : r >= 4.0 ? 20 : 60));
  const disp = Number(providerData?.provenDisputes ?? 0);
  const comp = Number(providerData?.profileCompleteness ?? 100);
  const doc = providerData?.documentationIntegrity !== undefined ? Boolean(providerData.documentationIntegrity) : true;
  const viol = Number(providerData?.activeViolations ?? 0);
  const months = Number(providerData?.activityMonths ?? (b >= 100 ? 18 : b >= 20 ? 8 : 2));

  return [
    { key: 'bookings', label: 'عدد الحجوزات الناجحة', val: `${b} حجز`, req: `>= ${criteria.bookings} حجز`, pass: b >= criteria.bookings },
    { key: 'rating', label: 'متوسط التقييم', val: `${r.toFixed(1)} ⭐`, req: `>= ${criteria.rating}`, pass: r >= criteria.rating },
    { key: 'revenue', label: 'الإيرادات المحققة', val: `${rev.toLocaleString('ar-SA')} ر.س`, req: `>= ${criteria.revenue.toLocaleString('ar-SA')} ر.س`, pass: rev >= criteria.revenue },
    { key: 'acceptanceRate', label: 'معدل قبول الحجوزات', val: `${acc}%`, req: `>= ${criteria.acceptanceRate}%`, pass: acc >= criteria.acceptanceRate },
    { key: 'cancellationRate', label: 'نسبة الإلغاء من طرف المزود', val: `${canc}%`, req: `<= ${criteria.cancellationRate}%`, pass: canc <= criteria.cancellationRate },
    { key: 'punctualityRate', label: 'الالتزام بالمواعيد', val: `${punc}%`, req: `>= ${criteria.punctualityRate}%`, pass: punc >= criteria.punctualityRate },
    { key: 'responseTimeMins', label: 'سرعة الرد', val: `${resp} دقيقة`, req: `<= ${criteria.responseTimeMins} دقيقة`, pass: resp <= criteria.responseTimeMins },
    { key: 'provenDisputes', label: 'النزاعات المثبتة', val: `${disp}`, req: `<= ${criteria.provenDisputes}`, pass: disp <= criteria.provenDisputes },
    { key: 'profileCompleteness', label: 'جودة استكمال البيانات', val: `${comp}%`, req: `>= ${criteria.profileCompleteness}%`, pass: comp >= criteria.profileCompleteness },
    { key: 'documentationIntegrity', label: 'سلامة التوثيق ورخصة العمل', val: doc ? 'سليم ومكتمل' : 'غير مكتمل', req: criteria.docIntegrityRequired ? 'توثيق سليم ومكتمل' : 'اختياري', pass: !criteria.docIntegrityRequired || doc },
    { key: 'activeViolations', label: 'المخالفات والإنذارات', val: `${viol}`, req: `<= ${criteria.activeViolations}`, pass: viol <= criteria.activeViolations },
    { key: 'activityMonths', label: 'مدة النشاط في المنصة', val: `${months} شهر`, req: `>= ${criteria.activityMonths} شهر`, pass: months >= criteria.activityMonths },
  ];
};

export const getPartnerLevel = (
  bookingsCountOrObj: any = 0,
  rating: number = 0,
  isEnabled: boolean = true,
  packageName?: string,
  packageDuration?: 'monthly' | 'yearly',
  extraProviderData?: any
) => {
  if (typeof isEnabled === 'boolean' && !isEnabled) return null;

  let providerObj: any = {};
  if (typeof bookingsCountOrObj === 'object' && bookingsCountOrObj !== null) {
    providerObj = bookingsCountOrObj;
  } else {
    providerObj = {
      bookingsCount: bookingsCountOrObj,
      rating,
      packageName,
      packageDuration,
      ...extraProviderData
    };
  }

  const profile = evaluatePartnerPerformance(providerObj);
  const tier = profile.tierInfo;

  return {
    name: tier.name,
    icon: tier.icon,
    color: tier.color,
    bg: tier.bg,
    border: tier.border,
    tierKey: tier.key,
    compositeScore: profile.totalCompositeScore,
    isEligible: profile.isEligible,
    blockingReasons: profile.blockingReasons,
    profile
  };
};

export interface Hall {
  id: any;
  name: string;
  city: string;
  category: string;
  price?: number;
  rating: number;
  image?: string;
  images?: any[];
  location?: string;
  capacity: number | string;
  provider: string;
  address?: string;
  showProvider?: boolean;
  description?: string;
  features?: string[];
  rules?: string[] | string;
  contractTerms?: string;
  reviews?: Review[];
  extraServicesList?: ExtraService[];
  pledge?: boolean;
  featured?: boolean;
  paymentMethods?: string[];
  providerType?: string;
  crNumber?: string;
  crExpiryDate?: string;
  phone?: string;
  email?: string;
  taxNumber?: string;
  region?: string;
  nationalAddress?: string;
  extraAddress?: string;
  nightPrice?: number;
  morningPrice?: number;
  fullDayPrice?: number;
  weekendPrice?: number;
  weekendMorningPrice?: number;
  weekendNightPrice?: number;
  weekendFullDayPrice?: number;
  securityDeposit?: number;
  status?: string;
  activationStatus?: string;
  bookingStatus?: string;
  facilities?: string;
  crFile?: any;
  ibanFile?: any;
  vatFile?: any;
  hostName?: string;
  reviewsCount?: number;
  availableDays?: string[];
  cancellationPeriod?: number | string;
  lastPriceUpdate?: string;
  bookingType?: 'packages' | 'alacarte' | 'venueonly';
  guests?: number;
  version?: number;
  isPaused?: boolean;
  pausedAt?: string;
  pauseReason?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  packagesList?: any[];
  approved?: boolean;
  hasPendingEdits?: boolean;
  pendingChanges?: any;
  pendingPayload?: any;
}

const defaultRules = [
  'ممنوع التدخين داخل القاعة',
  'الالتزام بمواعيد الدخول والخروج',
  'احترام الجيران بعد منتصف الليل'
];

export interface EventService {
  id: number;
  name: string;
  category: string;
  city: string;
  price: number;
  rating: number;
  image: string;
  images?: any[];
  provider: string;
  providerId?: string;
  showProviderToCustomers?: boolean;
  description?: string;
  terms?: string;
  quantityLimit: string;
  regions?: string;
  cities?: string;
  serviceStatus?: string;
  adminStatus?: string;
  unit?: string;
  hostName?: string;
  paymentMethods?: string[];
  cancellationPeriod?: number | string;
  taxonomyType?: 'rental' | 'sales' | 'dynamic';
  version?: number;
  isPaused?: boolean;
  pausedAt?: string;
  pauseReason?: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
  packages?: Array<{ id: string; name: string; description: string; price: number }>;
  addons?: Array<{ id: string; name: string; description: string; price: number }>;
  classification?: string;
  status?: string;
  approved?: boolean;
  hasPendingEdits?: boolean;
  pendingChanges?: any;
  pendingPayload?: any;
}

let HAS_SERVICES_SYNCED_WITH_DB = false;
const STORAGE_KEY = 'ais_event_services_v2';

export const normaliseService = (s: any): EventService => {
  let rawimages: any[] = [];
  if (Array.isArray(s.images)) {
    rawimages = s.images;
  } else if (typeof s.images === 'string') {
    try {
      rawimages = JSON.parse(s.images || '[]');
    } catch (e) {
      rawimages = [];
    }
  }

  let rawPackages: any[] = [];
  if (Array.isArray(s.packages)) {
    rawPackages = s.packages;
  } else if (typeof s.packages === 'string') {
    try {
      rawPackages = JSON.parse(s.packages || '[]');
    } catch (e) {
      rawPackages = [];
    }
  }

  let rawAddons: any[] = [];
  if (Array.isArray(s.addons)) {
    rawAddons = s.addons;
  } else if (typeof s.addons === 'string') {
    try {
      rawAddons = JSON.parse(s.addons || '[]');
    } catch (e) {
      rawAddons = [];
    }
  }

  const staticMatch = eventServices.find(es => Number(es.id) === Number(s.id) || es.name === s.name);
  const defaultImage = staticMatch?.image || 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60';
  
  const isValidImage = (url: any) => url && typeof url === 'string' && url !== '' && url !== 'null' && url !== 'undefined' && url.length > 3;
  const image = isValidImage(s.image) ? s.image : (rawimages.filter(isValidImage).length > 0 ? rawimages.filter(isValidImage)[0] : defaultImage);
  const images = rawimages.filter(isValidImage).length > 0 ? rawimages.filter(isValidImage) : (staticMatch?.images || [image]);

  return {
    ...s,
    id: Number(s.id),
    name: s.name,
    category: s.category || staticMatch?.category || 'بوفيه وضيافة',
    classification: s.classification || s.category || staticMatch?.category || 'ضيافة',
    city: s.city || staticMatch?.city || 'الرياض',
    price: Number(s.price || 0),
    rating: s.rating !== undefined ? Number(s.rating) : (staticMatch?.rating || 4.5),
    image,
    images: Array.isArray(images) ? images : [images],
    provider: s.provider || staticMatch?.provider || s.hostName || 'مزود خدمة معتمد',
    providerId: s.providerId ? String(s.providerId) : "1",
    description: s.description || staticMatch?.description || '',
    terms: s.terms || staticMatch?.terms || '',
    regions: s.regions || staticMatch?.regions || 'الرياض',
    cities: s.cities || staticMatch?.cities || 'الرياض',
    taxonomyType: s.taxonomyType || 'rental',
    packages: rawPackages,
    addons: rawAddons,
    status: (s.status === 'pending_modification' || s.status === 'تعديل معلق' || s.hasPendingEdits)
      ? 'pending_modification'
      : (s.status === 'pending' || s.status === 'معلق' || s.status === 'بانتظار الموافقة' || s.status === 'بانتظار الاعتماد')
        ? 'pending'
        : (s.status === 'blocked' || s.status === 'موقوف' || s.status === 'مرفوض')
          ? 'blocked'
          : 'approved',
    pendingChanges: s.pendingChanges || staticMatch?.pendingChanges || null,
    pendingPayload: s.pendingPayload || staticMatch?.pendingPayload || null,
    hasPendingEdits: Boolean(s.hasPendingEdits || s.pendingChanges || staticMatch?.hasPendingEdits),
    activationStatus: s.activationStatus || ((s.status === 'مفعل' || s.status === 'active' || s.status === undefined || s.status === 'approved' || s.status === 'نشط') ? 'مفعل' : 'موقوف'),
    adminStatus: s.adminStatus || (s.status === 'pending_modification' ? 'pending_modification' : (s.status === 'pending' ? 'pending' : 'approved'))
  };
};

let isSyncingServicesInFlight = false;
export const syncServicesFromApi = async (retries = 4, delay = 1000): Promise<EventService[]> => {
  if (typeof window === 'undefined') return eventServices.map(normaliseService);
  if (isSyncingServicesInFlight) return eventServices.map(normaliseService);

  isSyncingServicesInFlight = true;
  try {
    const headers: Record<string, string> = {};
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const roleStr = (parsedUser.role || '').toLowerCase();
        const role = roleStr.includes('admin') || roleStr.includes('مدير') || roleStr.includes('مشرف') ? 'admin' : 'provider';
        headers['x-user-role'] = role;
        headers['x-user-name'] = encodeURIComponent(parsedUser.name || '');
      }
    } catch (e) {}

    const res = await fetch('/api/bookings/services', { headers });
    if (!res.ok) throw new Error('HTTP status: ' + res.status);
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      throw new Error('Received HTML response instead of JSON. Server initializing...');
    }
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      saveServices(data);
      return data.map(normaliseService);
    }
  } catch (err: any) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      isSyncingServicesInFlight = false;
      return syncServicesFromApi(retries - 1, delay * 1.5);
    }
    console.warn('Syncing services from Cloud DB deferred (using local memory):', err.message || err);
  } finally {
    isSyncingServicesInFlight = false;
  }
  return eventServices.map(normaliseService);
};

export const getServices = (): EventService[] => {
  if (typeof window !== 'undefined') {
    // Always trigger background sync with Cloud DB to ensure fresh real data
    setTimeout(() => {
      syncServicesFromApi().catch(() => {});
    }, 50);
  }

  if (eventServices.length > 0) {
    return eventServices.map(normaliseService);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normaliseService);
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse services', e);
  }
  return eventServices.map(normaliseService);
};

export const saveServices = (servicesList: EventService[]) => {
  const normalised = servicesList.map(normaliseService);

  // Update in-memory array immediately
  eventServices.length = 0;
  eventServices.push(...normalised);

  try {
    if (typeof localStorage !== 'undefined') {
      const stripped = normalised.map((s: any) => {
        const { activationStatus, ...rest } = s;
        return rest;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stripped));
    }
  } catch (e) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('settingsUpdated'));
    window.dispatchEvent(new Event('hallsUpdated'));
    window.dispatchEvent(new Event('servicesUpdated'));
  }
};

export const eventServices: EventService[] = [
  { id: 1, name: 'بوفيه مفتوح (VIP)', category: 'بوفيه وضيافة', city: 'الرياض', price: 350, description: 'بوفيه فاخر يشمل جميع الأصناف بتقديم مميز لحفلات الزفاف والمناسبات', terms: 'الحجز المسبق قبل 48 ساعة\nدفع عربون 50%', quantityLimit: '', rating: 4.9, image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', provider: 'شركة أطياف لتنظيم المعارض', regions: 'الرياض، جدة', cities: 'الرياض، الخرج، جدة' },
  { id: 2, name: 'تصوير فوتوغرافي وفيديو', category: 'تصوير', city: 'الرياض', price: 5000, description: 'تغطية كاملة للمناسبة بطاقم مصورين احترافي', terms: 'دفع كامل المبلغ قبل المناسبة', quantityLimit: '5', rating: 4.7, image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', provider: 'سالم الدوسري', regions: 'الرياض', cities: 'الرياض' },
  { id: 3, name: 'تنسيق زهور', category: 'تنسيق قاعات', city: 'مكة المكرمة', price: 2000, description: 'تنسيق كوشة وطاولات الضيوف بزهور طبيعية', terms: 'لا يتم إرجاع العربون عند الإلغاء', quantityLimit: '', rating: 4.0, image: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3', provider: 'سالم الدوسري', regions: 'مكة المكرمة', cities: 'مكة' },
  { id: 4, name: 'ألحان المناسبات', category: 'دي جي وفِرق', city: 'جدة', price: 5000, description: 'إحياء مناسبتك بأفضل الفرق الغنائية', terms: 'توفير مسرح مجهز', quantityLimit: '1', rating: 4.7, image: 'https://images.unsplash.com/photo-1470229722913-7c090be5f524?w=800&q=80', provider: 'فرقة الألحان الذهبية', regions: 'الرياض', cities: 'الرياض' },
  { id: 5, name: 'روز لتنسيق الورد', category: 'تنسيق قاعات', city: 'الدمام', price: 2000, description: 'كوش فاخرة وتنسيقات ورد طبيعي', terms: '', quantityLimit: '', rating: 4.6, image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80', provider: 'مؤسسة روز للزهور', regions: 'المنطقة الشرقية', cities: 'الدمام، الخبر' }
];

const LOCAL_STORAGE_HALLS_KEY = 'ais_halls_v2';



const getTodayString = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const initialHalls: Hall[] = [
  { id: 1, name: 'قاعة الملكية', category: 'قاعة أفراح', provider: 'شركة أطياف لتنظيم المعارض', crNumber: '1010123456', region: 'الرياض', city: 'الرياض', address: 'طريق الملك فهد', nationalAddress: '1234 رمز 5678', capacity: 500, nightPrice: 15000, morningPrice: 8000, fullDayPrice: 20000, facilities: 'ضيافة، دي جي، إضاءة ليثيوم', status: 'مفعل', bookingStatus: 'متاح', contractTerms: 'دفع 50% مقدم', rating: 4.8, reviewsCount: 124, paymentMethods: ['mada', 'apple', 'stc', 'bank_transfer'], cancellationPeriod: 15, lastPriceUpdate: '2026-05-20T12:00:00Z' },
  { id: 2, name: 'قاعة اللؤلؤة', category: 'قاعة أفراح', provider: 'سالم الدوسري', crNumber: '1010765432', region: 'مكة المكرمة', city: 'جدة', address: 'طريق الكورنيش', nationalAddress: '4321 رمز 8765', capacity: 300, nightPrice: 12000, morningPrice: 6000, fullDayPrice: 15000, facilities: 'بوفيه مفتوح، كوشة مسرح', status: 'مفعل', bookingStatus: 'محجوز', contractTerms: 'دفع 30% مقدم', rating: 4.2, reviewsCount: 86, paymentMethods: ['mada', 'creditMax', 'apple'], cancellationPeriod: 10, lastPriceUpdate: '2026-05-18T10:00:00Z' },
  { id: 3, name: 'شاليه النسيم', category: 'شاليه', provider: 'سالم الدوسري', crNumber: '1010765431', region: 'مكة المكرمة', city: 'الطائف', address: 'الشفا', nationalAddress: '5521 رمز 1111', capacity: 50, nightPrice: 1500, morningPrice: 1000, fullDayPrice: 2000, facilities: 'مسبح، ألعاب أطفال', status: 'موقوف', bookingStatus: 'صيانة', contractTerms: 'دفع كامل المبلغ', rating: 3.5, reviewsCount: 12, paymentMethods: ['mada', 'bank_transfer'], cancellationPeriod: 0, lastPriceUpdate: '2026-05-10T08:00:00Z' },
  { id: 4, name: 'قاعة الأسطورة الكبرى', category: 'قاعة أفراح', provider: 'مجموعة قاعات الرياض', crNumber: '1010001111', region: 'الرياض', city: 'الرياض', address: 'حي الملقا', nationalAddress: '9764 رمز 4432', capacity: 600, nightPrice: 22000, morningPrice: 11000, fullDayPrice: 28000, facilities: 'شاشات عرض ثلاثية الأبعاد، ضيافة كاملة', status: 'مفعل', bookingStatus: 'متاح', contractTerms: 'دفع 50% مقدم وباقي المبلغ قبل يومين', rating: 4.9, reviewsCount: 200, paymentMethods: ['mada', 'apple', 'stc', 'bank_transfer'], cancellationPeriod: 20, lastPriceUpdate: '2026-05-25T14:00:00Z' },
  { id: 5, name: 'شاليه اللافندر الفاخر', category: 'شاليه', provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي', crNumber: '1010009992', region: 'مكة المكرمة', city: 'الطائف', address: 'حي الهدا الرئيسي', nationalAddress: '3321 رمز 9980', capacity: 80, nightPrice: 3000, morningPrice: 1800, fullDayPrice: 4200, facilities: 'مسبح مدفأ، شلالات مائية، حديقة خارجية', status: 'مفعل', bookingStatus: 'متاح', contractTerms: 'دفع قيمة التأمين مستردة للتلفيات', rating: 4.7, reviewsCount: 54, paymentMethods: ['mada', 'apple', 'stc'], cancellationPeriod: 7, lastPriceUpdate: '2026-05-20T11:00:00Z' },
  { id: 6, name: 'استراحة الريم الملكية للمناسبات', category: 'استراحة', provider: 'شركة الريم لخدمات الفندقة والضيافة ومستلزمات الحفلات', crNumber: '1010009994', region: 'الرياض', city: 'الرياض', address: 'حي الرمال', nationalAddress: '2321 رمز 8876', capacity: 150, nightPrice: 4000, morningPrice: 2500, fullDayPrice: 5500, facilities: 'مسطحات خضراء، قسمين منفصلين، مجلس ضيافة', status: 'مفعل', bookingStatus: 'متاح', contractTerms: 'ممنوع إدخال الألعاب النارية', rating: 4.6, reviewsCount: 78, paymentMethods: ['mada', 'apple', 'stc', 'bank_transfer', 'tamara'], cancellationPeriod: 10, lastPriceUpdate: '2026-05-19T09:00:00Z' },
  { id: 7, name: 'قصر الفخامة الملكي الكبرى', category: 'قاعة أفراح', provider: 'قصر الفخامة لإقامة المناسبات والسهرات', crNumber: '1010007777', region: 'المدينة المنورة', city: 'المدينة المنورة', address: 'حي العزيزية', nationalAddress: '7689 رمز 1123', capacity: 450, nightPrice: 18000, morningPrice: 9000, fullDayPrice: 23000, facilities: 'زفة ليزر، بوفيه خمس نجوم، جناح للعروسين', status: 'مفعل', bookingStatus: 'محجوز', contractTerms: 'دفع كامل المبلغ قبل المناسبة بأسبوعين', rating: 4.8, reviewsCount: 152, paymentMethods: ['mada', 'apple', 'bank_transfer'], cancellationPeriod: 14, lastPriceUpdate: '2026-05-22T13:00:00Z' },
  { id: 8, name: 'شاليه رويال أوشن', category: 'شاليه', provider: 'شاليهات ومنتجعات النخبة السياحية بدعم مالي', crNumber: '1010009992', region: 'الشرقية', city: 'الخبر', address: 'شاطئ نصف القمر', nationalAddress: '4331 رمز 1234', capacity: 60, nightPrice: 2500, morningPrice: 1500, fullDayPrice: 3500, facilities: 'شرفة مطلة على البحر مباشرة، مسبح خاص', status: 'مفعل', bookingStatus: 'متاح', contractTerms: 'حجز المبيت غير مسموح دون هوية وطنية', rating: 4.5, reviewsCount: 32, paymentMethods: ['mada', 'apple', 'creditMax'], cancellationPeriod: 5, lastPriceUpdate: '2026-05-18T16:00:00Z' },
  { id: 9, name: 'استراحة الأناقة للمناسبات العائلية', category: 'استراحة', provider: 'صالون الأناقة للضيافة والتمثيل', crNumber: '1010004444', region: 'الرياض', city: 'الرياض', address: 'طريق ديراب', nationalAddress: '8876 رمز 4432', capacity: 100, nightPrice: 2000, morningPrice: 1200, fullDayPrice: 2800, facilities: 'بيت شعر، مشب فخم، ملعب كرة طائرة', status: 'مفعل', bookingStatus: 'متاح', contractTerms: 'المحافظة على الممتلكات والنظام العام', rating: 4.3, reviewsCount: 41, paymentMethods: ['mada', 'apple', 'stc'], cancellationPeriod: 3, lastPriceUpdate: '2026-05-15T15:20:00Z' },
  { id: 10, name: 'قاعة اللؤلؤة بمكة المكرمة للتجهيز الفندقي', category: 'قاعة أفراح', provider: 'شركة الضيافة الذهبية المحدودة', crNumber: '1010005555', region: 'مكة المكرمة', city: 'مكة المكرمة', address: 'طريق الليث', nationalAddress: '1543 رمز 9920', capacity: 350, nightPrice: 14000, morningPrice: 7000, fullDayPrice: 18000, facilities: 'خدمة فندقية كاملة، مواقف أرضية للسيارات', status: 'مفعل', bookingStatus: 'متاح', contractTerms: 'دفع مقدم الثلث والباقي بالتقسيط مع الميسر', rating: 4.4, reviewsCount: 65, paymentMethods: ['mada', 'apple', 'stc', 'tamara'], cancellationPeriod: 15, lastPriceUpdate: '2026-05-24T18:00:00Z' },
  { id: 101, name: 'قاعة الزمرد الملكية للمناسبات', category: 'قاعة أفراح', provider: 'شركة الضيافة الذهبية المحدودة', crNumber: '1010998877', region: 'الرياض', city: 'الرياض', address: 'حي الياسمين', nationalAddress: '1234 رمز 9988', capacity: 400, nightPrice: 18000, morningPrice: 9500, fullDayPrice: 24000, facilities: 'ضيافة فاخرة، شاشات تفاعلية، كوشة عصرية', status: 'pending', approved: false, bookingStatus: 'متاح', contractTerms: 'دفع 50% مقدم', rating: 4.8, reviewsCount: 0, paymentMethods: ['mada', 'apple', 'stc'], cancellationPeriod: 14, lastPriceUpdate: '2026-07-26T10:00:00Z' },
  { id: 102, name: 'قاعة قصر الأسطورة الكبرى', category: 'قاعة أفراح', provider: 'مجموعة قاعات الرياض', crNumber: '1010001111', region: 'الرياض', city: 'الرياض', address: 'حي الملقا', nationalAddress: '9764 رمز 4432', capacity: 600, nightPrice: 22000, morningPrice: 11000, fullDayPrice: 28000, facilities: 'شاشات عرض ثلاثية الأبعاد، ضيافة كاملة', status: 'pending_modification', hasPendingEdits: true, approved: true, pendingChanges: { nightPrice: { label: 'السعر للفترة المسائية', oldVal: '22,000 ر.س', newVal: '26,500 ر.س' }, capacity: { label: 'السعة الاستيعابية للضيوف', oldVal: '600 شخص', newVal: '800 شخص' }, facilities: { label: 'المرافق والتجهيزات', oldVal: 'شاشات عرض ثلاثية الأبعاد، ضيافة كاملة', newVal: 'شاشات ثلاثية الأبعاد، ضيافة، جناح عروسين جديد، كوشة مسرح' } }, pendingPayload: { nightPrice: 26500, capacity: 800, facilities: 'شاشات ثلاثية الأبعاد، ضيافة، جناح عروسين جديد، كوشة مسرح' }, bookingStatus: 'متاح', contractTerms: 'دفع 50% مقدم وباقي المبلغ قبل يومين', rating: 4.9, reviewsCount: 200, paymentMethods: ['mada', 'apple', 'stc', 'bank_transfer'], cancellationPeriod: 20, lastPriceUpdate: '2026-07-27T08:00:00Z' },
];

const normaliseHall = (h: any): Hall => {
  const staticMatch = initialHalls.find(sh => String(sh.id) === String(h.id) || sh.name === h.name);
  
  const price = h.price !== undefined ? Number(h.price) : (staticMatch ? Number(staticMatch.price) : Number(h.nightPrice || 0));
  const nightPrice = h.nightPrice !== undefined ? Number(h.nightPrice) : price;
  const morningPrice = h.morningPrice !== undefined ? Number(h.morningPrice) : Math.floor(price * 0.6);
  const fullDayPrice = h.fullDayPrice !== undefined ? Number(h.fullDayPrice) : Math.floor(price * 1.5);
  
  let rawimages: any[] = [];
  if (Array.isArray(h.images)) {
    rawimages = h.images;
  } else if (typeof h.images === 'string') {
    try {
      rawimages = JSON.parse(h.images || '[]');
    } catch (e) {
      rawimages = [];
    }
  }

  const isValidImage = (url: any) => url && typeof url === 'string' && url !== '' && url !== 'null' && url !== 'undefined' && url.length > 3;
  const image = isValidImage(h.image) ? h.image : (rawimages.filter(isValidImage).length > 0 ? rawimages.filter(isValidImage)[0] : (staticMatch?.image || 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80'));
  const images = rawimages.filter(isValidImage).length > 0 ? rawimages.filter(isValidImage) : (staticMatch?.images || [image]);

  let features: string[] = [];
  if (Array.isArray(h.features)) {
    features = h.features;
  } else if (typeof h.features === 'string') {
    try {
      features = JSON.parse(h.features || '[]');
    } catch (e) {
      features = h.features.split('،');
    }
  } else if (h.facilities) {
    features = typeof h.facilities === 'string' ? h.facilities.split('،') : [];
  }
  
  if (features.length === 0 && staticMatch?.features) {
    features = staticMatch.features;
  }

  return {
    ...h,
    id: String(h.id),
    price,
    nightPrice,
    morningPrice,
    fullDayPrice,
    image,
    images: Array.isArray(images) ? images : [images],
    features,
    rating: h.rating !== undefined ? Number(h.rating) : (staticMatch?.rating || 4.5),
    reviewsCount: h.reviewsCount !== undefined ? Number(h.reviewsCount) : (staticMatch?.reviewsCount || 10),
    city: h.city || staticMatch?.city || 'الرياض',
    category: h.category || staticMatch?.category || 'قاعة أفراح',
    provider: h.provider || staticMatch?.provider || h.hostName || 'شركة أطياف لتنظيم المعارض',
    description: h.description || staticMatch?.description || 'مرفق راقٍ ومجهز بالكامل لكافة المناسبات والفعاليات العائلية والخاصة.',
    location: h.location || staticMatch?.location || `${h.region || ''} - ${h.city || 'الرياض'}`,
    rules: h.rules || staticMatch?.rules || [],
    extraServicesList: h.extraServicesList || staticMatch?.extraServicesList || [],
    featured: h.featured !== undefined ? (h.featured === true || h.featured === 'true' || h.featured === 1) : (staticMatch?.featured || false),
    bookingType: h.bookingType || staticMatch?.bookingType || 'alacarte',
    status: (h.status === 'pending_modification' || h.status === 'تعديل معلق' || h.hasPendingEdits)
      ? 'pending_modification'
      : (h.status === 'pending' || h.status === 'معلق' || h.status === 'بانتظار الموافقة' || h.status === 'بانتظار الاعتماد')
        ? 'pending'
        : (h.status === 'blocked' || h.status === 'موقوف' || h.status === 'مرفوض')
          ? 'blocked'
          : 'approved',
    pendingChanges: h.pendingChanges || staticMatch?.pendingChanges || null,
    pendingPayload: h.pendingPayload || staticMatch?.pendingPayload || null,
    hasPendingEdits: Boolean(h.hasPendingEdits || h.pendingChanges || staticMatch?.hasPendingEdits),
    activationStatus: h.activationStatus || ((h.status === 'مفعل' || h.status === 'active' || h.status === undefined || h.status === 'approved') ? 'مفعل' : 'موقوف'),
    packagesList: (() => {
      let list = h.packagesList || staticMatch?.packagesList || [];
      if (typeof list === 'string') {
        try {
          list = JSON.parse(list);
        } catch (e) {
          list = [];
        }
      }
      return Array.isArray(list) ? list : [];
    })(),
    availableDays: (() => {
      const rawDays = h.availableDays || staticMatch?.availableDays || [];
      const todayStr = getTodayString();
      return rawDays.includes(todayStr) ? rawDays : [todayStr, ...rawDays];
    })()
  };
};

let HAS_SYNCED_WITH_DB = false;
let isSyncingHallsInFlight = false;
export const syncHallsFromApi = async (retries = 4, delay = 1000): Promise<Hall[]> => {
  if (typeof window === 'undefined') return halls;
  if (isSyncingHallsInFlight) return halls;

  isSyncingHallsInFlight = true;
  try {
    const headers: Record<string, string> = {};
    try {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        const roleStr = (parsedUser.role || '').toLowerCase();
        const role = roleStr.includes('admin') || roleStr.includes('مدير') || roleStr.includes('مشرف') ? 'admin' : 'provider';
        headers['x-user-role'] = role;
        headers['x-user-name'] = encodeURIComponent(parsedUser.name || '');
      }
    } catch (e) {}

    const res = await fetch('/api/bookings/halls', { headers });
    if (!res.ok) throw new Error('HTTP status: ' + res.status);
    const text = await res.text();
    if (text.trim().startsWith('<')) {
      throw new Error('Received HTML response instead of JSON. Server initializing...');
    }
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      saveStoredHalls(data);
      return data.map(normaliseHall);
    }
  } catch (err: any) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
      isSyncingHallsInFlight = false;
      return syncHallsFromApi(retries - 1, delay * 1.5);
    }
    console.warn('Syncing halls from Cloud DB deferred (using local memory):', err.message || err);
  } finally {
    isSyncingHallsInFlight = false;
  }
  return halls;
};

export const getStoredHalls = (): Hall[] => {
  if (typeof window !== 'undefined') {
    setTimeout(() => {
      syncHallsFromApi().catch(() => {});
    }, 50);
  }

  if (halls.length > 0) {
    return halls.map(normaliseHall);
  }

  try {
    if (typeof localStorage !== 'undefined') {
      const data = localStorage.getItem(LOCAL_STORAGE_HALLS_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map(normaliseHall);
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse halls', e);
  }
  
  const normalisedDefaults = initialHalls.map(normaliseHall);
  return normalisedDefaults;
};

export const saveStoredHalls = (hallsList: Hall[]) => {
  const normalised = hallsList.map(normaliseHall);

  halls.length = 0;
  halls.push(...normalised);

  try {
    if (typeof localStorage !== 'undefined') {
      const stripped = normalised.map((h: any) => {
        const { activationStatus, ...rest } = h;
        return rest;
      });
      localStorage.setItem(LOCAL_STORAGE_HALLS_KEY, JSON.stringify(stripped));
    }
  } catch (e) {}
  
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('settingsUpdated'));
    window.dispatchEvent(new Event('hallsUpdated'));
  }
};

export const halls: Hall[] = [];
halls.push(...getStoredHalls());

export const isProviderNameVisible = (providerName: string): boolean => {
  if (!providerName) return false;
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('providersData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: any) => p.name === providerName || String(p.id) === String(providerName) || p.providerName === providerName);
          if (found) {
            return found.showProviderToCustomers !== false;
          }
        }
      }

      const settingsKey = `provider_settings_${providerName}`;
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        const parsedS = JSON.parse(savedSettings);
        if (parsedS.showProviderToCustomers === false) {
          return false;
        }
      }
    }
  } catch (e) {}
  return true;
};

export const getDisplayedProviderName = (providerName: string): string => {
  if (!providerName) return 'مزود خدمة معتمد';
  try {
    if (typeof localStorage !== 'undefined') {
      const saved = localStorage.getItem('providersData');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: any) => p.name === providerName || p.id === providerName || p.providerName === providerName);
          if (found) {
            if (found.showProviderToCustomers === false) {
              if (found.username && String(found.username).trim() !== '') {
                return String(found.username).trim();
              }
              return 'مزود خدمة معتمد';
            }
            return found.name || providerName;
          }
        }
      }

      const settingsKey = `provider_settings_${providerName}`;
      const savedSettings = localStorage.getItem(settingsKey);
      if (savedSettings) {
        const parsedS = JSON.parse(savedSettings);
        if (parsedS.showProviderToCustomers === false) {
          if (parsedS.username && String(parsedS.username).trim() !== '') {
            return String(parsedS.username).trim();
          }
          return 'مزود خدمة معتمد';
        }
      }
    }
  } catch (e) {}
  return providerName;
};

// --- CENTRALIZED MOCK DATA FROM DASHBOARD CONSTANTS ---

export const getDynamicInitialBookings = () => {
  const getOffsetDate = (daysOffset: number) => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    { id: 101, customer: 'أحمد عبدالله', phone: '0501112233', hall: 'قاعة الملكية', type: 'حجز قاعة', startDate: getOffsetDate(-30), endDate: getOffsetDate(-30), period: 'مسائية', guests: 300, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'دي جي، إضاءة إضافية', notes: 'حجز مبكر لزفاف', basePrice: 15000, extraPrice: 5000, amount: 20000, date: getOffsetDate(-30) },
    { id: 102, customer: 'سارة الشمري', phone: '0561234455', hall: 'قاعة اللؤلؤة بمكة المكرمة للتجهيز الفندقي', type: 'حجز قاعة', startDate: getOffsetDate(-25), endDate: getOffsetDate(-25), period: 'مسائية', guests: 150, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'بوفيه مفتوح', notes: 'تنسيق خاص للكوشة الكبرى', basePrice: 14000, extraPrice: 4000, amount: 18000, date: getOffsetDate(-25) },
    { id: 103, customer: 'فيصل العتيبي', phone: '0504445566', hall: 'قاعة الأسطورة الكبرى', type: 'حجز قاعة', startDate: getOffsetDate(-20), endDate: getOffsetDate(-20), period: 'مسائية', guests: 500, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'شاشات وشبكة ضوتية كاملة', notes: 'حفلة تخرج جامعي متميزة', basePrice: 22000, extraPrice: 6000, amount: 28000, date: getOffsetDate(-20) },
    { id: 104, customer: 'ليلى الشهري', phone: '0533334455', hall: 'شاليه اللافندر الفاخر', type: 'حجز شاليه', startDate: getOffsetDate(-15), endDate: getOffsetDate(-14), period: 'كاملة', guests: 50, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'ضيافة قهوة وشاي وشوكولاتة', notes: 'حفلة نجاح عائلية للأولاد', basePrice: 3000, extraPrice: 1200, amount: 4200, date: getOffsetDate(-15) },
    { id: 105, customer: 'خالد الحربي', phone: '0505557788', hall: 'استراحة الريم الملكية للمناسبات', type: 'حجز استراحة', startDate: getOffsetDate(-10), endDate: getOffsetDate(-10), period: 'صباحية', guests: 100, status: 'مؤكد', paymentStatus: 'جزئي', extraServices: 'عشاء شعبي متكامل وبوفيه تراثي', notes: 'عقد قران عائلي فخم', basePrice: 4000, extraPrice: 1500, amount: 5500, date: getOffsetDate(-10) },
    { id: 106, customer: 'مريم الدوسري', phone: '0555558833', hall: 'قصر الفخامة الملكي الكبرى', type: 'حجز قاعة', startDate: getOffsetDate(-8), endDate: getOffsetDate(-7), period: 'كاملة', guests: 400, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'كوشة متميزة وورد طبيعي كامل', notes: 'زفاف عائلي فخم جداً', basePrice: 18000, extraPrice: 5000, amount: 23000, date: getOffsetDate(-8) },
    { id: 107, customer: 'فهد القحطاني', phone: '0502223344', hall: 'شاليه رويال أوشن', type: 'حجز شاليه', startDate: getOffsetDate(-5), endDate: getOffsetDate(-5), period: 'كاملة', guests: 30, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'لا يوجد دكيشن إضافي', notes: 'جمعة زملاء عمل بالشركة', basePrice: 2500, extraPrice: 1000, amount: 3500, date: getOffsetDate(-5) },
    { id: 108, customer: 'منى العنزي', phone: '0544449911', hall: 'استراحة الأناقة للمناسبات العائلية', type: 'حجز استراحة', startDate: getOffsetDate(-4), endDate: getOffsetDate(-4), period: 'مسائية', guests: 60, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'شاي وقهوة وتمر القصيم الفاخر', notes: 'اجتماع عيد سنوي عائلي', basePrice: 2000, extraPrice: 800, amount: 2800, date: getOffsetDate(-4) },
    { id: 109, customer: 'عبدالله الغامدي', phone: '0502221199', hall: 'قاعة اللؤلؤة بمكة المكرمة للتجهيز الفندقي', type: 'حجز قاعة', startDate: getOffsetDate(-3), endDate: getOffsetDate(-3), period: 'صباحية', guests: 200, status: 'منتظر', paymentStatus: 'غير مدفوع', extraServices: 'خدمات طعام وترتيب فندقي متميز', notes: 'ندوة علمية طبية للجامعة', basePrice: 14000, extraPrice: 4000, amount: 18000, date: getOffsetDate(-3) },
    { id: 110, customer: 'ريم المطيري', phone: '0566662288', hall: 'قاعة الملكية', type: 'حجز قاعة', startDate: getOffsetDate(-2), endDate: getOffsetDate(-2), period: 'مسائية', guests: 350, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'شبكات ليزر وضيافة حصرية', notes: 'حج حفلة خطوبة فاخرة جداً', basePrice: 15000, extraPrice: 5000, amount: 20000, date: getOffsetDate(-2) },
    { id: 111, customer: 'محمد بن سلمان الشريف', phone: '0555559988', hall: 'قاعة الأسطورة الكبرى', type: 'حجز قاعة', startDate: getOffsetDate(-1), endDate: getOffsetDate(-1), period: 'صباحية', guests: 450, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'بوفيه فاخر متكامل وعزف مباشر', notes: 'اجتماع سنوي للشركاء والمساهمين', basePrice: 22000, extraPrice: 0, amount: 22000, date: getOffsetDate(-1) },
    { id: 112, customer: 'نورة السبيعي', phone: '0544445522', hall: 'شاليه اللافندر الفاخر', type: 'حجز شاليه', startDate: getOffsetDate(0), endDate: getOffsetDate(0), period: 'كاملة', guests: 40, status: 'مؤكد', paymentStatus: 'جزئي', extraServices: 'ألعاب صابونية مائية مخصصة للأولاد', notes: 'جمعة أقارب بمناسبة العطلة', basePrice: 3000, extraPrice: 0, amount: 3000, date: getOffsetDate(0) },
    { id: 113, customer: 'علي بن حسين الحارثي', phone: '0599991122', hall: 'استراحة الريم الملكية للمناسبات', type: 'حجز استراحة', startDate: getOffsetDate(0), endDate: getOffsetDate(0), period: 'مسائية', guests: 120, status: 'مؤكد', paymentStatus: 'مدفوع', extraServices: 'تنسيق الطاولات والمدخل الرخامي الجديد', notes: 'مأدبة عشاء وفاء للأمير الكرام', basePrice: 4000, extraPrice: 0, amount: 4000, date: getOffsetDate(0) },
    { id: 114, customer: 'جواهر آل سعود', phone: '0500000001', hall: 'قصر الفخامة الملكي الكبرى', type: 'حجز قاعة', startDate: getOffsetDate(3), endDate: getOffsetDate(3), period: 'مسائية', guests: 300, status: 'منتظر', paymentStatus: 'جزئي', extraServices: 'بافية خمس نجوم متكامل وجولات درون', notes: 'تجهيز لندوة خيرية عامة للمؤسسة', basePrice: 18000, extraPrice: 0, amount: 18000, date: getOffsetDate(3) },
    { id: 115, customer: 'صالح بن محمد الودعاني', phone: '0555551133', hall: 'شاليه رويال أوشن', type: 'حجز شاليه', startDate: getOffsetDate(5), endDate: getOffsetDate(5), period: 'كاملة', guests: 25, status: 'ملغي', paymentStatus: 'غير مدفوع', extraServices: 'لا يوجد خدمة إضافية تم الإلغاء لظرف استثنائي', notes: 'وفاة قريب للمستأجر والاتفاق على الاسترجاع', basePrice: 2500, extraPrice: 0, amount: 2500, date: getOffsetDate(5) }
  ];
};

export const initialBookings = getDynamicInitialBookings();

export const getDynamicInitialSupportRequests = () => {
  const getOffsetDate = (daysOffset: number) => {
    const today = new Date();
    const d = new Date(today);
    d.setDate(today.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  return [
    { id: 1, bookingId: 101, userId: 'USER-1', customerName: 'أحمد عبدالله', providerName: 'شركة أطياف لتنظيم المعارض', serviceName: 'بوفيه مفتوح (VIP)', date: getOffsetDate(-30), status: 'مكتمل', price: 3500 },
    { id: 2, bookingId: 102, userId: 'USER-3', customerName: 'سارة الشمري', providerName: 'شركة الضيافة الذهبية المحدودة', serviceName: 'مجموعة ضيافة ملكية فاخرة وصبابين مهيلين', date: getOffsetDate(-25), status: 'مكتمل', price: 1500 },
    { id: 3, bookingId: 103, userId: 'USER-4', customerName: 'فيصل العتيبي', providerName: 'سالم الدوسري', serviceName: 'تصوير فوتوغرافي وفيديو', date: getOffsetDate(-20), status: 'مؤكد', price: 5000 },
    { id: 4, bookingId: 104, userId: 'USER-5', customerName: 'ليلى الشهري', providerName: 'شركة كوش الفخمة وتنسيق الأفراح والعقود', serviceName: 'تفصيل كوشة العروس المتميزة واضاءات الممر', date: getOffsetDate(-15), status: 'قيد التنفيذ', price: 6000 },
    { id: 5, bookingId: 105, userId: 'USER-6', customerName: 'خالد الحربي', providerName: 'مؤسسة المذاق العربي للحلويات والضيافة', serviceName: 'بوفيه مفتوح تراثي شعبي وأطباق سعودية', date: getOffsetDate(-10), status: 'مكتمل', price: 2500 },
    { id: 6, bookingId: 106, userId: 'USER-7', customerName: 'مريم الدوسري', providerName: 'استوديو روتانا الفوتوغرافي', serviceName: 'تغطية سينمائية درون فوتو وغرافيك مجسم للأجنحة', date: getOffsetDate(-8), status: 'مكتمل', price: 9000 },
    { id: 7, bookingId: 107, userId: 'USER-8', customerName: 'فهد القحطاني', providerName: 'سالم الدوسري', serviceName: 'تنسيق زهور', date: getOffsetDate(-5), status: 'قيد الانتظار', price: 2000 },
    { id: 8, bookingId: 108, userId: 'USER-9', customerName: 'منى العنزي', providerName: 'شركة أطياف لتنظيم المعارض', serviceName: 'بوفيه مفتوح (VIP)', date: getOffsetDate(-4), status: 'مجدول', price: 1050 },
    { id: 9, bookingId: 110, userId: 'USER-11', customerName: 'ريم المطيري', providerName: 'شركة الضيافة الذهبية المحدودة', serviceName: 'مجموعة ضيافة ملكية فاخرة وصبابين مهيلين', date: getOffsetDate(0), status: 'مؤكد', price: 3000 },
    { id: 10, bookingId: 111, userId: 'USER-12', customerName: 'محمد بن سلمان الشريف', providerName: 'استوديو روتانا الفوتوغرافي', serviceName: 'تغطية سينمائية درون فوتو وغرافيك مجسم للأجنحة', date: getOffsetDate(0), status: 'مؤكد', price: 9000 }
  ];
};

export const initialSupportRequests = getDynamicInitialSupportRequests();

export const initialPromotions: Promotion[] = [
  {
    id: 1,
    name: 'عرض الصيف الكبير',
    type: 'percentage',
    value: 20,
    applyTo: 'halls',
    targetIds: [1],
    status: 'active',
    startDate: '2026-06-01',
    endDate: '2026-08-31',
    providerName: 'شركة أطياف لتنظيم المعارض',
    conditions: {
      seasonal: { start: '2026-06-01', end: '2026-08-31' }
    },
    hasAdCampaign: true,
    adCampaignId: 1,
    createdAt: '2026-05-01'
  },
  {
    id: 2,
    name: 'حجز مبكر سياحي',
    type: 'fixed',
    value: 500,
    applyTo: 'services',
    targetIds: [],
    status: 'pending',
    startDate: '2026-05-20',
    endDate: '2026-12-31',
    providerName: 'سالم الدوسري',
    conditions: {
      earlyBird: 30
    },
    hasAdCampaign: false,
    createdAt: '2026-05-15'
  }
];

export const initialServices = [
  { id: 1, name: 'بوفيه مفتوح (VIP)', description: 'بوفيه فاخر يشمل جميع الأصناف بتقديم مميز لحفلات الزفاف والمناسبات', provider: 'شركة أطياف لتنظيم المعارض', quantity: '', price: 350, regions: 'الرياض، جدة، الدمام', terms: 'الحجز المسبق قبل 48 ساعة\nدفع عربون 50%', serviceStatus: 'نشط', adminStatus: 'فعالة', images: [{name: 'buffet', preview: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}], hostName: 'أحمد المدير', rating: 4.9, reviewsCount: 45, cancellationPeriod: 7 },
  { id: 2, name: 'تصوير فوتوغرافي وفيديو', description: 'تغطية كاملة للمناسبة بطاقم مصورين احترافي', provider: 'سالم الدوسري', quantity: '5', price: 5000, regions: 'الرياض', terms: 'دفع كامل المبلغ قبل المناسبة', serviceStatus: 'نشط', adminStatus: 'فعالة', images: [{name: 'camera', preview: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}], hostName: 'أحمد المدير', rating: 4.7, reviewsCount: 112, cancellationPeriod: 3 },
  { id: 3, name: 'تنسيق زهور', description: 'تنسيق كوشة وطاولات الضيوف بزهور طبيعية', provider: 'سالم الدوسري', quantity: '', price: 2000, regions: 'مكة المكرمة، جدة', terms: 'لا يتم إرجاع العربون عند الإلغاء', serviceStatus: 'metوقف', adminStatus: 'محظورة', images: [{name: 'flowers', preview: 'https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}], hostName: 'أحمد المدير', rating: 4.0, reviewsCount: 8, cancellationPeriod: '' },
  { id: 4, name: 'تفصيل كوشة العروس المتميزة واضاءات الممر', description: 'تصميم وتنفيذ كوشة العروسة بأحدث الصيحات والورود الفاخرة', provider: 'شركة كوش الفخمة وتنسيق الأفراح والعقود', quantity: '', price: 6000, regions: 'أبها، خميس مشيط', terms: 'يجب حجز الخدمة قبل المناسبة بـ 10 أيام على الأقل', serviceStatus: 'نشط', adminStatus: 'فعالة', images: [{name: 'flowers_fajr', preview: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}], hostName: 'خالد منسق كوش', rating: 4.8, reviewsCount: 30, cancellationPeriod: 5 },
  { id: 5, name: 'مجموعة ضيافة ملكية فاخرة وصبابين مهيلين', description: 'توفير فريق صبابين وصبابات مجهزين بأحدث دلال رسلان الفضية', provider: 'شركة الضيافة الذهبية المحدودة', quantity: '15', price: 1500, regions: 'مكة المكرمة، جدة, الرياض', terms: 'توفير المياه والمشروبات الغازية مجاناً مع التموين', serviceStatus: 'نشط', adminStatus: 'فعالة', images: [{name: 'hospitality', preview: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}], hostName: 'سليمان الحربي', rating: 4.9, reviewsCount: 89, cancellationPeriod: 3 },
  { id: 6, name: 'بوفيه مفتوح تراثي شعبي وأطباق سعودية', description: 'أشهى المأكولات النجدية والحجازية والمأكولات الشعبية بجودة عالية', provider: 'مؤسسة المذاق العربي للحلويات والضيافة', quantity: '', price: 250, regions: 'القصيم، بريدة، الرياض', terms: 'الحد الأدنى لطلب الخدمة 50 شخص', serviceStatus: 'نشط', adminStatus: 'فعالة', images: [{name: 'arabic_food', preview: 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}], hostName: 'عبدالعزيز المذاق', rating: 4.6, reviewsCount: 22, cancellationPeriod: 7 },
  { id: 7, name: 'تغطية سينمائية درون فوتو وغرافيك مجسم للأجنحة', description: 'تغطية وبث مباشر جوي درون عالي الجودة لفعالياتكم ومؤتمراتكم الكبرى', provider: 'استوديو روتانا الفوتوغرافي', quantity: '3', price: 9000, regions: 'المنطقة الشرقية، الرياض', terms: 'يتحمل العميل مسؤولية التصاريح الأمنية اللازمة للطائرات', serviceStatus: 'نشط', adminStatus: 'فعالة', images: [{name: 'drone', preview: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3'}], hostName: 'سلطان روتانا', rating: 4.9, reviewsCount: 42, cancellationPeriod: 10 },
  { id: 101, name: 'فرقة العرضة والسامري السعودية الملكية', description: 'فرقة شعبية مجهزة بأحدث الدفوف والزي الرسمي لإحياء كافة المناسبات والاحتفالات', provider: 'شركة الضيافة الذهبية المحدودة', quantity: '12', price: 4500, regions: 'الرياض، جدة، الشرقية', terms: 'الحجز المسبق قبل أسبوع من المناسبة', serviceStatus: 'نشط', status: 'pending', adminStatus: 'pending', approved: false, images: [{ name: 'folk', preview: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500&auto=format&fit=crop&q=60' }], hostName: 'محمد العتيبي', rating: 5.0, reviewsCount: 0, cancellationPeriod: 7 },
  { id: 102, name: 'خدمة التغطية الضوئية واستوديو البث السينمائي', description: 'تغطية فوتوغرافية ومونتاج احترافي متقدم', provider: 'سالم الدوسري', quantity: '5', price: 5000, regions: 'الرياض', terms: 'دفع كامل المبلغ قبل المناسبة', serviceStatus: 'نشط', status: 'pending_modification', adminStatus: 'فعالة', hasPendingEdits: true, pendingChanges: { price: { label: 'سعر الخدمة الأساسي', oldVal: '5,000 ر.س', newVal: '6,800 ر.س' }, description: { label: 'وصف الخدمة والمميزات', oldVal: 'تغطية فوتوغرافية ومونتاج احترافي', newVal: 'تغطية سينمائية شاملة مع طائرة درون وإخراج فوري في موقع الحفل' } }, pendingPayload: { price: 6800, description: 'تغطية سينمائية شاملة مع طائرة درون وإخراج فوري في موقع الحفل' }, approved: true, images: [{ name: 'camera', preview: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60' }], hostName: 'أحمد المدير', rating: 4.7, reviewsCount: 112, cancellationPeriod: 3 },
];

export const CURRENT_PROVIDER = 'مؤسسة ليلة لخدمات للمناسبات';

export const initialProviders = providers;

export const initialCustomers = [
  {
    id: 1, name: 'أحمد عبدالله', idNumber: '1020304050',
    expiryDate: '2028-05-15', phone: '0501112233', email: 'ahmed@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '1234 رمز 5678', extraAddress: 'حي الياسمين',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-01T10:00:00Z', 
    ipAddress: '192.168.1.1', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174000',
    points: 1540,
    image: 'https://i.pravatar.cc/150?img=11'
  },
  {
    id: 2, name: 'شركة التقنية الحديثة', idNumber: '1010998877',
    expiryDate: '2027-11-20', phone: '0559998888', email: 'info@tech.com',
    taxNumber: '300999888700003', iban: 'SA1234567890123456789012', region: 'الشرقية', city: 'الدمام',
    nationalAddress: '4321 رمز 8765', extraAddress: 'المدينة الصناعية',
    status: 'موقوف', pledge: true, approvalDate: '2025-10-15T09:30:00Z', 
    ipAddress: '10.0.0.5', acquisitionMethod: '',
    points: 850,
    image: ''
  },
  {
    id: 3, name: 'سارة الشمري', idNumber: '1020308871',
    expiryDate: '2028-08-10', phone: '0561234455', email: 'sara.sham@example.com',
    taxNumber: '', iban: '', region: 'حائل', city: 'حائل',
    nationalAddress: '1122 رمز 3344', extraAddress: ' حي النقرة',
    status: 'مفعل', pledge: true, approvalDate: '2026-03-12T11:00:00Z', 
    ipAddress: '192.168.1.20', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174001',
    points: 2100, image: 'https://i.pravatar.cc/150?img=32'
  },
  {
    id: 4, name: 'فيصل العتيبي', idNumber: '1020409988',
    expiryDate: '2029-01-20', phone: '0504445566', email: 'faisal.otaibi@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '1540 رمز 8876', extraAddress: 'حي النرجس',
    status: 'مفعل', pledge: true, approvalDate: '2026-04-10T12:30:00Z', 
    ipAddress: '172.16.0.4', acquisitionMethod: '',
    points: 980, image: 'https://i.pravatar.cc/150?img=12'
  },
  {
    id: 5, name: 'ليلى الشهري', idNumber: '1020301122',
    expiryDate: '2028-09-05', phone: '0533334455', email: 'laila@example.com',
    taxNumber: '', iban: '', region: 'عسير', city: 'أبها',
    nationalAddress: '1254 رمز 9922', extraAddress: 'حي السد',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-20T10:30:00Z', 
    ipAddress: '192.168.5.55', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174003',
    points: 1250, image: 'https://i.pravatar.cc/150?img=21'
  },
  {
    id: 6, name: 'خالد الحربي', idNumber: '1020304455',
    expiryDate: '2029-03-18', phone: '0505557788', email: 'khalid.h@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '2321 رمز 8876', extraAddress: 'حي الرمال',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-20T14:00:00Z', 
    ipAddress: '10.0.12.3', acquisitionMethod: '',
    points: 1100, image: 'https://i.pravatar.cc/150?img=8'
  },
  {
    id: 7, name: 'مريم الدوسري', idNumber: '1020305566',
    expiryDate: '2029-04-22', phone: '0555558833', email: 'maryam.d@example.com',
    taxNumber: '', iban: '', region: 'مكة المكرمة', city: 'جدة',
    nationalAddress: '7689 رمز 1123', extraAddress: 'حي الشاطئ',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-22T09:30:00Z', 
    ipAddress: '172.16.4.5', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174004',
    points: 1750, image: 'https://i.pravatar.cc/150?img=23'
  },
  {
    id: 8, name: 'فهد القحطاني', idNumber: '1020306677',
    expiryDate: '2028-12-05', phone: '0502223344', email: 'fahad.q@example.com',
    taxNumber: '', iban: '', region: 'الشرقية', city: 'الخبر',
    nationalAddress: '4331 رمز 1234', extraAddress: 'حي الحزام الذهبي',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-25T11:00:00Z', 
    ipAddress: '192.168.10.15', acquisitionMethod: '',
    points: 950, image: 'https://i.pravatar.cc/150?img=13'
  },
  {
    id: 9, name: 'منى العنزي', idNumber: '1020307788',
    expiryDate: '2029-02-12', phone: '0544449911', email: 'muna.a@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '8876 رمز 4432', extraAddress: 'حي العقيق',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-26T15:20:00Z', 
    ipAddress: '192.168.1.100', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174005',
    points: 1300, image: 'https://i.pravatar.cc/150?img=14'
  },
  {
    id: 10, name: 'عبدالله الغامدي', idNumber: '1020309900',
    expiryDate: '2028-10-30', phone: '0502221199', email: 'ghamd@example.com',
    taxNumber: '', iban: '', region: 'مكة المكرمة', city: 'مكة المكرمة',
    nationalAddress: '1543 رمز 9920', extraAddress: 'حي العوالي',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-27T13:00:00Z', 
    ipAddress: '10.0.50.60', acquisitionMethod: '',
    points: 1420, image: 'https://i.pravatar.cc/150?img=15'
  },
  {
    id: 11, name: 'ريم المطيري', idNumber: '1020301101',
    expiryDate: '2029-06-01', phone: '0566662288', email: 'reem.m@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '1234 رمز 5678', extraAddress: 'حي الملقا',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-28T16:45:00Z', 
    ipAddress: '192.168.2.11', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174006',
    points: 1150, image: 'https://i.pravatar.cc/150?img=16'
  },
  {
    id: 12, name: 'محمد بن سلمان الشريف', idNumber: '1020301102',
    expiryDate: '2027-08-15', phone: '0555559988', email: 'sharif@example.com',
    taxNumber: '', iban: '', region: 'المدينة المنورة', city: 'المدينة المنورة',
    nationalAddress: '7689 رمز 1123', extraAddress: 'حي الخالدية',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-29T11:20:00Z', 
    ipAddress: '172.16.55.4', acquisitionMethod: '',
    points: 1800, image: 'https://i.pravatar.cc/150?img=17'
  },
  {
    id: 13, name: 'نورة السبيعي', idNumber: '1020301103',
    expiryDate: '2029-07-20', phone: '0544445522', email: 'noura.s@example.com',
    taxNumber: '', iban: '', region: 'مكة المكرمة', city: 'الطائف',
    nationalAddress: '3321 رمز 9980', extraAddress: 'حي الشفا',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-30T10:00:00Z', 
    ipAddress: '192.168.33.22', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174007',
    points: 920, image: 'https://i.pravatar.cc/150?img=18'
  },
  {
    id: 14, name: 'علي بن حسين الحارثي', idNumber: '1020301104',
    expiryDate: '2028-04-10', phone: '0599991122', email: 'ali.h@example.com',
    taxNumber: '', iban: '', region: 'عسير', city: 'خميس مشيط',
    nationalAddress: '2321 رمز 8876', extraAddress: 'حي حسام',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-30T14:30:00Z', 
    ipAddress: '10.10.1.5', acquisitionMethod: '',
    points: 1050, image: 'https://i.pravatar.cc/150?img=19'
  },
  {
    id: 15, name: 'جواهر آل سعود', idNumber: '1020301105',
    expiryDate: '2029-09-01', phone: '0500000001', email: 'jawahar@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '9988 رمز 7766', extraAddress: 'حي حطين',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-30T16:00:00Z', 
    ipAddress: '192.168.100.1', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174008',
    points: 3500, image: 'https://i.pravatar.cc/150?img=20'
  },
  {
    id: 16, name: 'صالح بن محمد الودعاني', idNumber: '1020301106',
    expiryDate: '2028-11-15', phone: '0555551133', email: 'saleh.w@example.com',
    taxNumber: '', iban: '', region: 'الشرقية', city: 'الخبر',
    nationalAddress: '4331 رمز 1234', extraAddress: 'حي الثقبة',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-31T09:00:00Z', 
    ipAddress: '172.16.8.19', acquisitionMethod: '',
    points: 750, image: 'https://i.pravatar.cc/150?img=24'
  },
  {
    id: 17, name: 'سناء المطيري', idNumber: '1020301107',
    expiryDate: '2029-10-05', phone: '0566661122', email: 'sanaa@example.com',
    taxNumber: '', iban: '', region: 'القصيم', city: 'بريدة',
    nationalAddress: '1254 رمز 9922', extraAddress: 'حي الصفراء',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-31T11:00:00Z', 
    ipAddress: '192.168.4.15', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174009',
    points: 1280, image: 'https://i.pravatar.cc/150?img=25'
  },
  {
    id: 18, name: 'عبدالرحمن الشهري', idNumber: '1020301108',
    expiryDate: '2028-02-28', phone: '0533331122', email: 'dahm@example.com',
    taxNumber: '', iban: '', region: 'عسير', city: 'أبها',
    nationalAddress: '2233 رمز 4455', extraAddress: 'حي المحالة',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-31T14:00:00Z', 
    ipAddress: '10.200.1.4', acquisitionMethod: '',
    points: 990, image: 'https://i.pravatar.cc/150?img=26'
  },
  {
    id: 19, name: 'فاطمة العتيبي', idNumber: '1020301109',
    expiryDate: '2029-11-20', phone: '0505552233', email: 'fatma.o@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '1540 رمز 8876', extraAddress: 'حي النخيل',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-31T16:15:00Z', 
    ipAddress: '192.168.5.21', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174010',
    points: 1450, image: 'https://i.pravatar.cc/150?img=27'
  },
  {
    id: 20, name: 'حسن بن علي آل حيدر', idNumber: '1020301110',
    expiryDate: '2028-06-30', phone: '0599992233', email: 'hasan@example.com',
    taxNumber: '', iban: '', region: 'نجران', city: 'نجران',
    nationalAddress: '5432 رمز 1122', extraAddress: 'حي الفهد',
    status: 'مفعل', pledge: true, approvalDate: '2026-06-01T10:00:00Z', 
    ipAddress: '172.16.99.12', acquisitionMethod: '',
    points: 820, image: 'https://i.pravatar.cc/150?img=28'
  },
  {
    id: 21, name: 'موسى الزهراني', idNumber: '1020301201',
    expiryDate: '2029-01-15', phone: '0544446622', email: 'mosa@example.com',
    taxNumber: '', iban: '', region: 'الباحة', city: 'الباحة',
    nationalAddress: '3321 رمز 9980', extraAddress: 'حي رغدان',
    status: 'مفعل', pledge: true, approvalDate: '2026-06-02T11:00:00Z', 
    ipAddress: '192.168.1.5', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174011',
    points: 1100, image: 'https://i.pravatar.cc/150?img=29'
  },
  {
    id: 22, name: 'خلوفة بن أحمد الأسمري', idNumber: '1020301202',
    expiryDate: '2028-08-18', phone: '0533336622', email: 'khalofa@example.com',
    taxNumber: '', iban: '', region: 'عسير', city: 'بللسمر',
    nationalAddress: '2321 رمز 8876', extraAddress: 'حي الشعبين',
    status: 'مفعل', pledge: true, approvalDate: '2026-06-03T09:30:00Z', 
    ipAddress: '10.0.4.5', acquisitionMethod: '',
    points: 680, image: 'https://i.pravatar.cc/150?img=30'
  },
  {
    id: 23, name: 'مها الحربي', idNumber: '1020301203',
    expiryDate: '2029-04-12', phone: '0505556633', email: 'maha@example.com',
    taxNumber: '', iban: '', region: 'القصيم', city: 'عنيزة',
    nationalAddress: '8876 رمز 4432', extraAddress: 'حي المروج',
    status: 'مفعل', pledge: true, approvalDate: '2026-06-04T13:15:00Z', 
    ipAddress: '192.168.6.14', acquisitionMethod: '123e4567-e89b-12d3-a456-426614174012',
    points: 1350, image: 'https://i.pravatar.cc/150?img=31'
  },
  {
    id: 24, name: 'هند الشريف', idNumber: '1020301204',
    expiryDate: '2028-10-05', phone: '0566663322', email: 'hind@example.com',
    taxNumber: '', iban: '', region: 'مكة المكرمة', city: 'جدة',
    nationalAddress: '1543 رمز 9920', extraAddress: 'حي النعيم',
    status: 'مفعل', pledge: true, approvalDate: '2026-06-05T15:40:00Z', 
    ipAddress: '172.16.12.15', acquisitionMethod: '',
    points: 1600, image: 'https://i.pravatar.cc/150?img=33'
  },
  {
    id: 25, name: 'سلطان الهذلول', idNumber: '1020301205',
    expiryDate: '2029-05-14', phone: '0505559902', email: 'sultan.h@example.com',
    taxNumber: '', iban: '', region: 'الرياض', city: 'الرياض',
    nationalAddress: '6543 رمز 9920', extraAddress: 'حي السليمانية',
    status: 'مفعل', pledge: true, approvalDate: '2026-05-15T10:10:00Z',
    ipAddress: '172.16.89.8', acquisitionMethod: '',
    points: 1530, image: 'https://i.pravatar.cc/150?img=7'
  }
];

export const initialCampaigns = [
  { id: 1, title: 'خصومات الصيف الكبرى مع أطياف', type: 'SMS', targetAudience: 'العملاء النشطين', budget: 5000, spent: 4200, reach: 15400, clicks: 3200, conversions: 120, status: 'نشطة', startDate: '2026-05-01', endDate: '2026-08-01', content: 'خصم 20٪ على جميع قاعات شركة أطياف لتنظيم المعارض لفترة محدودة!' },
  { id: 2, title: 'بوفيهات ليلة المتميزة مع روز', type: 'Email', targetAudience: 'المزودين المحتملين', budget: 2000, spent: 2000, reach: 5000, clicks: 800, conversions: 45, status: 'مكتملة', startDate: '2026-03-01', endDate: '2026-04-01', content: 'احجز بوفيه ليلة المتميزة من روز واحصل على ضيافة مجانية بالكامل.' },
  { id: 3, title: 'عروض الزهور من ديراب الأناقة', type: 'Social Media', targetAudience: 'الكل', budget: 8000, spent: 1500, reach: 45000, clicks: 5600, conversions: 210, status: 'نشطة', startDate: '2026-05-15', endDate: '2026-09-01', content: 'نسق كوشة مناسبتك الآن بخصم 15% من صالون الأناقة للضيافة.' },
  { id: 4, title: 'شاليهات الهدا مع لافندر', type: 'Push Notification', targetAudience: 'العملاء الحاليين', budget: 5000, spent: 3000, reach: 8520, clicks: 1230, conversions: 80, status: 'نشطة', startDate: '2026-06-01', endDate: '2026-06-30', content: 'عرض الويكند في شاليه اللافندر الفاخر - الليلة الثالثة مجاناً!' },
  { id: 5, title: 'تصوير روتانا الفاخر بالأعياد', type: 'Social Media', targetAudience: 'الكل', budget: 6000, spent: 4000, reach: 35000, clicks: 4200, conversions: 150, status: 'نشطة', startDate: '2026-05-10', endDate: '2026-07-20', content: 'احصل على تغطية درون مجانية عند حجز باقة تصوير روتانا الفوتوغرافي.' },
  { id: 6, title: 'شركة الضيافة الذهبية بالحرم', type: 'SMS', targetAudience: 'الكل', budget: 10000, spent: 8000, reach: 60000, clicks: 9000, conversions: 450, status: 'نشطة', startDate: '2026-05-12', endDate: '2026-08-15', content: 'ضيافة وفود الرحمن بمستوى خمس نجوم مع شركة الضيافة الذهبية المحدودة.' },
  { id: 7, title: 'مهرجان التمور والضيافة بالقصيم', type: 'Push Notification', targetAudience: 'العملاء النشطين', budget: 4000, spent: 2500, reach: 18000, clicks: 2300, conversions: 95, status: 'نشطة', startDate: '2026-05-18', endDate: '2026-06-18', content: 'خصومات المذاق العربي للحلويات والضيافة في مهرجانات بريدة والرياض.' }
];

export const initialRegions = [
  { id: 1, name: 'الرياض', cities: ['الرياض', 'الخرج', 'الدرعية'], image: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 2, name: 'مكة المكرمة', cities: ['مكة', 'جدة', 'الطائف'], image: 'https://images.unsplash.com/photo-1565552643952-b4306354dd95?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 3, name: 'المدينة المنورة', cities: ['المدينة المنورة', 'ينبع', 'بدر'], image: 'https://images.unsplash.com/photo-1591462002164-81ebd02d6b38?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 4, name: 'المنطقة الشرقية', cities: ['الدمام', 'الخبر', 'الظهران', 'الجبيل'], image: 'https://images.unsplash.com/photo-1578306338421-2a061bb0e271?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 5, name: 'القصيم', cities: ['بريدة', 'عنيزة', 'الرس'], image: 'https://images.unsplash.com/photo-1582236371728-4ce67cfab7ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 6, name: 'حائل', cities: ['حائل', 'بقعاء', 'الشنان'], image: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 7, name: 'عسير', cities: ['أبها', 'خميس مشيط', 'أحد رفيدة'], image: 'https://images.unsplash.com/photo-1627998656608-f40b28ecda90?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 8, name: 'تبوك', cities: ['تبوك', 'ضباء', 'الوجه'], image: 'https://images.unsplash.com/photo-1647432243886-42ab22c95333?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 9, name: 'الجوف', cities: ['سكاكا', 'القريات', 'دومة الجندل'], image: 'https://images.unsplash.com/photo-1473448912268-2022ce9509d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 10, name: 'جازان', cities: ['جازان', 'صبيا', 'أبو عريش'], image: 'https://images.unsplash.com/photo-1621213501708-518dd3e198b1?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 11, name: 'نجران', cities: ['نجران', 'شرورة'], image: 'https://images.unsplash.com/photo-1549419131-7294860b7cb3?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 12, name: 'الباحة', cities: ['الباحة', 'بلجرشي'], image: 'https://images.unsplash.com/photo-1623945415707-16067fa23cd2?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' },
  { id: 13, name: 'الحدود الشمالية', cities: ['عرعر', 'رفحاء', 'طريف'], image: 'https://images.unsplash.com/photo-1625695507914-7f152d127a92?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80' }
];

export const initialStaff = [
  { id: 1, name: 'أحمد سعيد', idNumber: '1020304051', dateOfBirth: '1985-06-15', gender: 'ذكر', qualification: 'ماجستير', major: 'إدارة أعمال', department: 'الإدارة', role: 'المدير العام (Admin)', status: 'نشط', isOnline: true, email: 'admin@system.local', phone: '0501112233', joinDate: '2023-01-15', region: 'الرياض', city: 'الرياض', permissions: ['الإدارة الكاملة'], image: 'https://i.pravatar.cc/150?img=11', iban: 'SA1234567890123456789012', baseSalary: 15000, allowances: 2000, insuranceNumber: 'INS-001' },
  { id: 2, name: 'سارة محمد', idNumber: '1020304052', dateOfBirth: '1990-03-22', gender: 'أنثى', qualification: 'بكالوريوس', major: 'تسويق', department: 'المبيعات', role: 'مدير المبيعات', status: 'نشط', isOnline: false, email: 'sara@example.com', phone: '0552223344', joinDate: '2023-05-10', region: 'مكة المكرمة', city: 'جدة', permissions: ['إدارة الحجوزات', 'إدارة القاعات'], image: 'https://i.pravatar.cc/150?img=5', iban: 'SA1234567890123456789013', baseSalary: 12000, allowances: 1500, insuranceNumber: 'INS-002' },
  { id: 3, name: 'خالد صالح', idNumber: '1020304053', dateOfBirth: '1988-11-05', gender: 'ذكر', qualification: 'بكالوريوس', major: 'محاسبة', department: 'المالية', role: 'المحاسب المالي', status: 'نشط', isOnline: true, email: 'khalid@example.com', phone: '0563334455', joinDate: '2023-08-20', region: 'الرياض', city: 'الرياض', permissions: ['الإدارة المالية'], image: 'https://i.pravatar.cc/150?img=12', iban: 'SA1234567890123456789014', baseSalary: 10000, allowances: 1000, insuranceNumber: 'INS-003' },
  { id: 4, name: 'نورة الدوسري', idNumber: '1020304054', dateOfBirth: '1995-09-12', gender: 'أنثى', qualification: 'دبلوم', major: 'حاسب آلي', department: 'الدعم', role: 'خدمة العملاء (Support)', status: 'نشط', isOnline: true, email: 'noura@example.com', phone: '0544445566', joinDate: '2024-02-01', region: 'المنطقة الشرقية', city: 'الدمام', permissions: ['الدعم الفني'], image: 'https://i.pravatar.cc/150?img=9', iban: 'SA1234567890123456789015', baseSalary: 6000, allowances: 500, insuranceNumber: 'INS-004' },
  { id: 5, name: 'عبدالله فهد', idNumber: '1020304055', dateOfBirth: '1992-01-30', gender: 'ذكر', qualification: 'بكالوريوس', major: 'تسويق', department: 'التسويق', role: 'مدير التسويق والتطوير', status: 'موقوف', isOnline: false, email: 'abdullah@example.com', phone: '0595556677', joinDate: '2023-11-05', region: 'الرياض', city: 'الرياض', permissions: ['التسويق والإعلانات'], image: 'https://i.pravatar.cc/150?img=13', iban: 'SA1234567890123456789016', baseSalary: 11000, allowances: 1200, insuranceNumber: 'INS-005' },
];

export const roles = ['المدير العام (Admin)', 'مدير المبيعات', 'المحاسب المالي', 'خدمة العملاء (Support)', 'مدير التسويق والتطوير'];

export const formatCurrency = (amount: number) => {
  return convertDigits((amount || 0).toLocaleString('en-US') + ' ر.س');
};

export const getStatusColor = (status: string) => {
  switch (status) {
    case 'مؤكد': case 'مدفوع': case 'نشط': case 'مفعل': return 'bg-green-100 text-green-700 border-green-200';
    case 'انتظار': case 'جزئي': return 'bg-amber-100 text-amber-700 border-amber-200';
    case 'ملغي': case 'غير مدفوع': case 'متوقف': case 'موقوف': return 'bg-red-100 text-red-700 border-red-200';
    default: return 'bg-blue-100 text-blue-700 border-blue-200';
  }
};

export const mockChats = [
  { id: 1, name: 'أحمد محمد', role: 'عميل', lastMsg: 'متى سيتم تأكيد الحجز؟', time: '10:30 ص', unread: 2 },
  { id: 2, name: 'شركة قمة الخليج', role: 'مزود خدمة', lastMsg: 'تم تحديث أسعار البوفيه.', time: '09:15 ص', unread: 0 },
  { id: 3, name: 'مؤسسة ليلة لخدمات للمناسبات', role: 'مزود خدمة (Premium)', lastMsg: 'الباقة المحدثة جاهزة للاستخدام الآن.', time: 'أمس', unread: 0 },
  { id: 4, name: 'شركة أطياف لتنظيم المعارض', role: 'مزود خدمة (Premium)', lastMsg: 'قمت بإرسال شهادة الآيبان الجديدة للمطابقة.', time: 'أمس', unread: 1 },
  { id: 5, name: 'شركة الضيافة الذهبية المحدودة', role: 'مزود خدمة (Premium)', lastMsg: 'الرجاء الاطلاع على شروط عقد الضيافة المرفق.', time: '2026-05-24', unread: 0 },
  { id: 6, name: 'سارة الشمري', role: 'عميل', lastMsg: 'هل يغطي بوفيه الـ VIP كافة المدعوين؟', time: '2026-05-20', unread: 0 },
  { id: 7, name: 'فيصل العتيبي', role: 'عميل', lastMsg: 'تم دفع كامل القيمة بنجاح.', time: '2026-05-18', unread: 0 }
];

export const mockMessages: Record<number, any[]> = {
  1: [
    { id: 101, text: 'السلام عليكم', sender: 'user', time: '10:00 ص' },
    { id: 102, text: 'وعليكم السلام، كيف يمكنني مساعدتك؟', sender: 'admin', time: '10:05 ص' },
    { id: 103, text: 'متى سيتم تأكيد الحجز؟', sender: 'user', time: '10:30 ص' },
  ],
  2: [
    { id: 201, text: 'تم تحديث أسعار البوفيه.', sender: 'user', time: '09:15 ص' }
  ],
  3: [
    { id: 301, text: 'مرحباً، أود الاستفهام عن طريقة ترقية مزايا باقتي للاحترافية والتقويم الذكي.', sender: 'user', time: '11:00 ص' },
    { id: 302, text: 'أهلاً بكم مؤسسة ليلة، تم تفعيل ميزة التقويم والربط التلقائي والذكاء الاصطناعي لحسابكم.', sender: 'admin', time: '11:15 ص' },
    { id: 303, text: 'الباقة المحدثة جاهزة للاستخدام الآن.', sender: 'user', time: 'أمس' }
  ],
  4: [
    { id: 401, text: 'لقد عدلت رقم الآيبان لتلقي التسويات المالية لشركتنا.', sender: 'user', time: '01:00 م' },
    { id: 402, text: 'جاري مراجعة الشهادة الآيبان المرفقة والتحقق من تطابق الاسم المعتمد.', sender: 'admin', time: '01:30 م' },
    { id: 403, text: 'قمت بإرسال شهادة الآيبان الجديدة للمطابقة.', sender: 'user', time: 'أمس' }
  ],
  5: [
    { id: 501, text: 'أرسلنا شروط التعاقد لتوفير الصبابين والضيافة بمكة المكرمة لحفلات التخرج.', sender: 'user', time: '04:00 م' },
    { id: 502, text: 'أهلاً شركة الضيافة الذهبية، تم استلام الشروط وتدقيقها والموافقة عليها بنجاح.', sender: 'admin', time: '04:30 م' }
  ],
  6: [
    { id: 601, text: 'مساء الخير، لو سمحت حجزت قاعة اللؤلؤة وأريد بوفيه الـ VIP كمرافق حجز.', sender: 'user', time: '05:00 م' },
    { id: 602, text: 'أهلاً سارة، نعم باقة الـ VIP ممتازة وتكفي لـ 150 شخصاً ومتاحة فوراً.', sender: 'admin', time: '05:40 م' },
  ],
  7: [
    { id: 701, text: 'قمت بدفع عربون قاعة الأسطورة الكبرى عبر المدى، متى يظهر بالمحفظة؟', sender: 'user', time: '02:00 م' },
    { id: 702, text: 'يتم المزامنة وتأكيد الدفع بشكل لحظي، يرجى مراجعة لوحة الحجز الخاصة بك.', sender: 'admin', time: '02:15 م' }
  ]
};
