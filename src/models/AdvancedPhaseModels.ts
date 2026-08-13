import { DataTypes, Model } from 'sequelize';
import { sequelize } from './dbInstance';

// ==========================================
// 1. FEATURE FLAGS & PROVIDER ENTITLEMENTS
// ==========================================
export class FeatureFlag extends Model {
  public id!: number;
  public key!: string; // e.g. 'contracts.electronic', 'marketing.affiliates', 'pricing.ai_recommendations', 'pricing.autopilot'
  public nameArabic!: string;
  public nameEnglish!: string;
  public description!: string;
  public isEnabled!: boolean;
  public environment!: string; // 'development', 'production', 'all'
  public allowedTiers!: string; // JSON string e.g. ["pro", "enterprise"]
}

FeatureFlag.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  nameArabic: { type: DataTypes.STRING, allowNull: false },
  nameEnglish: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: true },
  isEnabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  environment: { type: DataTypes.STRING, defaultValue: 'all' },
  allowedTiers: { type: DataTypes.TEXT, defaultValue: '["basic", "pro", "enterprise"]' }
}, { sequelize, tableName: 'feature_flags' });

export class ProviderEntitlement extends Model {
  public id!: number;
  public providerId!: string;
  public featureKey!: string;
  public isGranted!: boolean;
  public source!: string; // 'package_tier', 'marketplace_addon', 'admin_override'
  public expiresAt!: Date | null;
}

ProviderEntitlement.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.STRING, allowNull: false },
  featureKey: { type: DataTypes.STRING, allowNull: false },
  isGranted: { type: DataTypes.BOOLEAN, defaultValue: true },
  source: { type: DataTypes.STRING, defaultValue: 'package_tier' },
  expiresAt: { type: DataTypes.DATE, allowNull: true }
}, { sequelize, tableName: 'provider_entitlements' });

// ==========================================
// 2. DOMAIN EVENTS & AUDIT LOG
// ==========================================
export class DomainEvent extends Model {
  public id!: number;
  public eventType!: string; // 'BookingCreated', 'BookingAccepted', 'PaymentCaptured', 'ContractAccepted', 'EventCompleted', 'RefundConfirmed', 'BookingCancelled', 'ChargebackReceived'
  public entityType!: string; // 'booking', 'service_request', 'contract', 'affiliate'
  public entityId!: string;
  public actorId!: string | null;
  public actorRole!: string | null;
  public payload!: string; // JSON string
  public hashProof!: string | null;
  public ipAddress!: string | null;
}

DomainEvent.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  eventType: { type: DataTypes.STRING, allowNull: false },
  entityType: { type: DataTypes.STRING, allowNull: false },
  entityId: { type: DataTypes.STRING, allowNull: false },
  actorId: { type: DataTypes.STRING, allowNull: true },
  actorRole: { type: DataTypes.STRING, allowNull: true },
  payload: { type: DataTypes.TEXT, allowNull: false },
  hashProof: { type: DataTypes.STRING, allowNull: true },
  ipAddress: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, tableName: 'domain_events' });

// ==========================================
// 3. ELECTRONIC CONTRACTS (المرحلة 4 - العقود الإلكترونية)
// ==========================================
export class ElectronicContract extends Model {
  public id!: number;
  public contractNumber!: string; // e.g. BKG-26-0000000001-CTR
  public bookingId!: string | null;
  public serviceRequestId!: string | null;
  public targetType!: string; // 'hall' | 'service'
  public customerId!: string;
  public customerName!: string;
  public customerNationalIdPhone!: string;
  public providerId!: string;
  public providerName!: string;
  public contractTitleArabic!: string;
  public contractTitleEnglish!: string;
  public termsContentArabic!: string;
  public termsContentEnglish!: string;
  public totalAmount!: number;
  public commissionAmount!: number;
  public cancellationPolicyArabic!: string;
  public status!: string; // 'draft', 'pending_signature', 'executed', 'cancelled', 'terminated'
  public documentHash!: string; // SHA-256 hash of text
  public signedAt!: Date | null;
  public otpVerifiedAt!: Date | null;
  public otpPhoneMasked!: string | null;
  public verificationIp!: string | null;
  public verificationUserAgent!: string | null;
  public proofCertificateJson!: string | null;
}

ElectronicContract.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  contractNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  bookingId: { type: DataTypes.STRING, allowNull: true },
  serviceRequestId: { type: DataTypes.STRING, allowNull: true },
  targetType: { type: DataTypes.STRING, defaultValue: 'hall' },
  customerId: { type: DataTypes.STRING, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerNationalIdPhone: { type: DataTypes.STRING, allowNull: false },
  providerId: { type: DataTypes.STRING, allowNull: false },
  providerName: { type: DataTypes.STRING, allowNull: false },
  contractTitleArabic: { type: DataTypes.STRING, allowNull: false },
  contractTitleEnglish: { type: DataTypes.STRING, allowNull: false },
  termsContentArabic: { type: DataTypes.TEXT, allowNull: false },
  termsContentEnglish: { type: DataTypes.TEXT, allowNull: false },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  commissionAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  cancellationPolicyArabic: { type: DataTypes.TEXT, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'draft' },
  documentHash: { type: DataTypes.STRING, allowNull: false },
  signedAt: { type: DataTypes.DATE, allowNull: true },
  otpVerifiedAt: { type: DataTypes.DATE, allowNull: true },
  otpPhoneMasked: { type: DataTypes.STRING, allowNull: true },
  verificationIp: { type: DataTypes.STRING, allowNull: true },
  verificationUserAgent: { type: DataTypes.STRING, allowNull: true },
  proofCertificateJson: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, tableName: 'electronic_contracts' });

// ==========================================
// 4. AFFILIATE & REFERRAL MARKETING (المرحلة 5 - التسويق بالعمولة)
// ==========================================
export class PromoterProfile extends Model {
  public id!: number;
  public promoterId!: string; // User ID or Provider ID
  public name!: string;
  public email!: string;
  public phone!: string;
  public iban!: string;
  public promoterCode!: string; // Unique e.g. AFF-LAYLAH-8821
  public trackingUrl!: string;
  public defaultCommissionType!: string; // 'percentage', 'fixed'
  public defaultCommissionValue!: number; // e.g. 5% or 50 SAR
  public status!: string; // 'pending_approval', 'active', 'suspended'
  public totalEarned!: number;
  public totalPaidOut!: number;
}

PromoterProfile.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  promoterId: { type: DataTypes.STRING, allowNull: false, unique: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  iban: { type: DataTypes.STRING, allowNull: true },
  promoterCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  trackingUrl: { type: DataTypes.STRING, allowNull: false },
  defaultCommissionType: { type: DataTypes.STRING, defaultValue: 'percentage' },
  defaultCommissionValue: { type: DataTypes.FLOAT, defaultValue: 5 },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  totalEarned: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalPaidOut: { type: DataTypes.FLOAT, defaultValue: 0 }
}, { sequelize, tableName: 'promoter_profiles' });

export class ReferralAttribution extends Model {
  public id!: number;
  public attributionCode!: string;
  public promoterCode!: string;
  public promoterId!: string;
  public customerId!: string;
  public customerName!: string;
  public targetType!: string; // 'hall_booking', 'service_request'
  public targetId!: string;
  public bookingReference!: string;
  public orderAmount!: number;
  public calculatedCommission!: number;
  public status!: string; // 'tracked', 'pending', 'earned', 'payable', 'paid', 'reversed'
  public attributionModel!: string; // 'last_touch', 'first_touch'
  public eventCompletedAt!: Date | null;
  public paidAt!: Date | null;
  public auditTrail!: string; // JSON string
}

ReferralAttribution.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  attributionCode: { type: DataTypes.STRING, allowNull: false, unique: true },
  promoterCode: { type: DataTypes.STRING, allowNull: false },
  promoterId: { type: DataTypes.STRING, allowNull: false },
  customerId: { type: DataTypes.STRING, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  targetType: { type: DataTypes.STRING, defaultValue: 'hall_booking' },
  targetId: { type: DataTypes.STRING, allowNull: false },
  bookingReference: { type: DataTypes.STRING, allowNull: false },
  orderAmount: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  calculatedCommission: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'tracked' },
  attributionModel: { type: DataTypes.STRING, defaultValue: 'last_touch' },
  eventCompletedAt: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  auditTrail: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, tableName: 'referral_attributions' });

// ==========================================
// 5. AI DYNAMIC PRICING (المرحلة 2 - التسعير الديناميكي)
// ==========================================
export class PricingBound extends Model {
  public id!: number;
  public entityId!: string; // Hall ID or Service ID
  public entityType!: string; // 'hall' | 'service'
  public providerId!: string;
  public minPrice!: number;
  public maxPrice!: number;
  public basePrice!: number;
  public maxDailyChangePercent!: number; // e.g. 10 = max 10% change per day
  public weekendMultiplier!: number; // e.g. 1.15 = 15% increase
  public holidayMultiplier!: number; // e.g. 1.25 = 25% increase
  public isAutoPilotEnabled!: boolean; // false = recommendations only, true = auto update
}

PricingBound.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entityId: { type: DataTypes.STRING, allowNull: false },
  entityType: { type: DataTypes.STRING, defaultValue: 'hall' },
  providerId: { type: DataTypes.STRING, allowNull: false },
  minPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 500 },
  maxPrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 15000 },
  basePrice: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 2000 },
  maxDailyChangePercent: { type: DataTypes.FLOAT, defaultValue: 15 },
  weekendMultiplier: { type: DataTypes.FLOAT, defaultValue: 1.15 },
  holidayMultiplier: { type: DataTypes.FLOAT, defaultValue: 1.25 },
  isAutoPilotEnabled: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, tableName: 'pricing_bounds' });

export class PricingRecommendation extends Model {
  public id!: number;
  public entityId!: string;
  public entityType!: string;
  public providerId!: string;
  public currentPrice!: number;
  public recommendedPrice!: number;
  public deltaPercent!: number;
  public confidenceLevel!: number; // 0 to 100
  public reasonArabic!: string;
  public reasonEnglish!: string;
  public status!: string; // 'pending', 'accepted', 'rejected', 'auto_applied'
  public appliedAt!: Date | null;
}

PricingRecommendation.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entityId: { type: DataTypes.STRING, allowNull: false },
  entityType: { type: DataTypes.STRING, defaultValue: 'hall' },
  providerId: { type: DataTypes.STRING, allowNull: false },
  currentPrice: { type: DataTypes.FLOAT, allowNull: false },
  recommendedPrice: { type: DataTypes.FLOAT, allowNull: false },
  deltaPercent: { type: DataTypes.FLOAT, allowNull: false },
  confidenceLevel: { type: DataTypes.INTEGER, defaultValue: 85 },
  reasonArabic: { type: DataTypes.TEXT, allowNull: false },
  reasonEnglish: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  appliedAt: { type: DataTypes.DATE, allowNull: true }
}, { sequelize, tableName: 'pricing_recommendations' });

export class PriceSchedule extends Model {
  public id!: number;
  public entityId!: string;
  public entityType!: string;
  public dateString!: string; // YYYY-MM-DD
  public finalPrice!: number;
  public priceSource!: string; // 'manual', 'ai_recommendation', 'rule_engine'
  public isLocked!: boolean;
}

PriceSchedule.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  entityId: { type: DataTypes.STRING, allowNull: false },
  entityType: { type: DataTypes.STRING, defaultValue: 'hall' },
  dateString: { type: DataTypes.STRING, allowNull: false },
  finalPrice: { type: DataTypes.FLOAT, allowNull: false },
  priceSource: { type: DataTypes.STRING, defaultValue: 'manual' },
  isLocked: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, tableName: 'price_schedules' });

// ==========================================
// DB SYNC FOR ADVANCED PHASE MODELS
// ==========================================
export async function syncAdvancedPhaseModels() {
  try {
    await FeatureFlag.sync({ alter: true }).catch(() => FeatureFlag.sync());
    await ProviderEntitlement.sync({ alter: true }).catch(() => ProviderEntitlement.sync());
    await DomainEvent.sync({ alter: true }).catch(() => DomainEvent.sync());
    await ElectronicContract.sync({ alter: true }).catch(() => ElectronicContract.sync());
    await PromoterProfile.sync({ alter: true }).catch(() => PromoterProfile.sync());
    await ReferralAttribution.sync({ alter: true }).catch(() => ReferralAttribution.sync());
    await PricingBound.sync({ alter: true }).catch(() => PricingBound.sync());
    await PricingRecommendation.sync({ alter: true }).catch(() => PricingRecommendation.sync());
    await PriceSchedule.sync({ alter: true }).catch(() => PriceSchedule.sync());

    // Seed default feature flags if none exist
    const count = await FeatureFlag.count();
    if (count === 0) {
      await FeatureFlag.bulkCreate([
        {
          key: 'contracts.electronic',
          nameArabic: 'العقود الإلكترونية وتوثيق الشروط',
          nameEnglish: 'Electronic Contracts & E-Signatures',
          description: 'تفعيل إصدار العقود الإلكترونية الموقتة بـ SHA-256 ورمز OTP',
          isEnabled: true,
          environment: 'all',
          allowedTiers: '["basic", "pro", "enterprise"]'
        },
        {
          key: 'marketing.affiliates',
          nameArabic: 'التسويق بالعمولة والإحالات المخصصة',
          nameEnglish: 'Affiliate & Referral Marketing Program',
          description: 'تفعيل تتبع روابط الإحالة وحساب العمولات التلقائي بعد اكتمال الخدمة',
          isEnabled: true,
          environment: 'all',
          allowedTiers: '["pro", "enterprise"]'
        },
        {
          key: 'pricing.ai_recommendations',
          nameArabic: 'توصيات التسعير الذكي (وضع الاقتراح)',
          nameEnglish: 'AI Dynamic Pricing Recommendations',
          description: 'عرض توصيات تعديل الأسعار بناءً على المواسم ونسبة الإشغال دون تغيير تلقائي',
          isEnabled: true,
          environment: 'all',
          allowedTiers: '["pro", "enterprise"]'
        },
        {
          key: 'pricing.autopilot',
          nameArabic: 'التسعير التلقائي الذكي (الطيار الآلي)',
          nameEnglish: 'Autopilot Dynamic Pricing Engine',
          description: 'التحديث التلقائي لأسعار القاعات والخدمات ضمن الحدود الآمنة المحددة من المزود',
          isEnabled: false,
          environment: 'all',
          allowedTiers: '["enterprise"]'
        }
      ]);
      console.log('✅ Default Feature Flags seeded successfully.');
    }
  } catch (err) {
    console.warn('⚠️ Advanced Phase Models Sync Warning:', err);
  }
}
