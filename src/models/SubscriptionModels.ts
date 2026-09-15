import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from './dbInstance.js';
import { PlatformConfig } from './UserModels.js';

export class SubscriptionPlan extends Model {
  declare id: number;
  declare name: string;
  declare price: number;
  declare description: string;
  declare features: string; // JSON string representing allowed limits & Boolean flags
  declare isHidden: boolean; // True if it is a custom/private package
}

SubscriptionPlan.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  price: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  description: { type: DataTypes.TEXT },
  features: { type: DataTypes.TEXT, defaultValue: '{}' },
  isHidden: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'SubscriptionPlan', tableName: 'SubscriptionPlans' });


export type SubscriptionLifecycleStatus = 
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'ACTIVE'
  | 'RENEWAL_DUE'
  | 'GRACE_PERIOD'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'PAYMENT_FAILED'
  | 'UPGRADE_SCHEDULED'
  | 'DOWNGRADE_SCHEDULED';

export type SubscriptionPaymentStatus = 
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'REFUNDED'
  | 'WAIVED'
  | 'GRACE'
  | 'OVERDUE';

export class ProviderSubscription extends Model {
  declare id: number;
  declare providerId: number;
  declare providerEmail: string;
  declare planName: string;
  declare pricePaid: number;
  declare status: 'active' | 'expired' | 'suspended';
  declare subscriptionStatus: SubscriptionLifecycleStatus;
  declare paymentStatus: SubscriptionPaymentStatus;
  declare billingCycle: 'MONTHLY' | 'ANNUAL' | 'CUSTOM';
  declare startDate: Date;
  declare endDate: Date | null;
  declare currentPeriodStart: Date | null;
  declare currentPeriodEnd: Date | null;
  declare gracePeriodEnd: Date | null;
  declare nextBillingDate: Date | null;
  declare scheduledPlanId: number | null;
  declare scheduledPlanName: string | null;
  declare scheduledChangeDate: Date | null;
  declare scheduledChangeType: 'UPGRADE' | 'DOWNGRADE' | null;
  declare previousSubscriptionId: number | null;
  declare cancellationReason: string | null;
  declare cancelledAt: Date | null;
  declare autoRenew: boolean;
  declare isCustom: boolean;
  declare notes: string;
  declare planId: number | null;
  declare paymentId: string | null;
  declare version: number;
}

ProviderSubscription.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: false },
  planName: { type: DataTypes.STRING, allowNull: false },
  pricePaid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  subscriptionStatus: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  paymentStatus: { type: DataTypes.STRING, defaultValue: 'PAID' },
  billingCycle: { type: DataTypes.STRING, defaultValue: 'MONTHLY' },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  endDate: { type: DataTypes.DATE, allowNull: true },
  currentPeriodStart: { type: DataTypes.DATE, allowNull: true },
  currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
  gracePeriodEnd: { type: DataTypes.DATE, allowNull: true },
  nextBillingDate: { type: DataTypes.DATE, allowNull: true },
  scheduledPlanId: { type: DataTypes.INTEGER, allowNull: true },
  scheduledPlanName: { type: DataTypes.STRING, allowNull: true },
  scheduledChangeDate: { type: DataTypes.DATE, allowNull: true },
  scheduledChangeType: { type: DataTypes.STRING, allowNull: true },
  previousSubscriptionId: { type: DataTypes.INTEGER, allowNull: true },
  cancellationReason: { type: DataTypes.TEXT, allowNull: true },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
  autoRenew: { type: DataTypes.BOOLEAN, defaultValue: true },
  isCustom: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  planId: { type: DataTypes.INTEGER, allowNull: true },
  paymentId: { type: DataTypes.STRING, allowNull: true },
  version: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { 
  sequelize, 
  modelName: 'ProviderSubscription', 
  tableName: 'ProviderSubscriptions',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['subscriptionStatus'] },
    { fields: ['status'] }
  ]
});


export class ProviderFeatureOverride extends Model {
  declare id: number;
  declare providerId: number;
  declare providerEmail: string;
  declare featureKey: string; // e.g. 'max_halls', 'inventory_management', 'dynamic_pricing'
  declare featureName: string; // Arabic name, e.g. 'ميزة إدارة المخزون'
  declare overrideType: 'increment' | 'replace' | 'grant';
  declare value: string; // e.g. '5' or 'true' or 'false'
  declare isGranted: boolean; // boolean flag for override
  declare startsAt: Date | null;
  declare expiresAt: Date | null;
  declare notes: string;
  declare grantedBy: string;
  declare reason: string;
  declare financialImpact: number;
}

ProviderFeatureOverride.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: true },
  featureKey: { type: DataTypes.STRING, allowNull: false },
  featureName: { type: DataTypes.STRING, allowNull: true },
  overrideType: { type: DataTypes.STRING, defaultValue: 'grant' }, // grant = boolean, increment = add amount, replace = override limit
  value: { type: DataTypes.STRING, defaultValue: 'true' },
  isGranted: { type: DataTypes.BOOLEAN, defaultValue: true },
  startsAt: { type: DataTypes.DATE, allowNull: true },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  grantedBy: { type: DataTypes.STRING, defaultValue: 'Admin' },
  reason: { type: DataTypes.TEXT, defaultValue: '' },
  financialImpact: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 }
}, { sequelize, modelName: 'ProviderFeatureOverride', tableName: 'ProviderFeatureOverrides' });


export type AddonLifecycleStatus =
  | 'DRAFT'
  | 'PENDING_PAYMENT'
  | 'PAYMENT_PROCESSING'
  | 'ACTIVE'
  | 'RENEWAL_DUE'
  | 'GRACE_PERIOD'
  | 'EXPIRED'
  | 'PAYMENT_FAILED'
  | 'CANCELLED'
  | 'SUSPENDED'
  | 'REFUNDED'
  | 'REVOKED';

export class ProviderAddon extends Model {
  declare id: number;
  declare providerId: number;
  declare providerEmail: string;
  declare featureKey: string;
  declare featureName: string;
  declare addonType: 'boolean' | 'numeric_limit';
  declare quantity: number;
  declare pricePaid: number;
  declare unitPrice: number;
  declare currency: string;
  declare billingCycle: 'MONTHLY' | 'YEARLY' | 'ONE_TIME';
  declare status: 'active' | 'expired' | 'cancelled';
  declare addonStatus: AddonLifecycleStatus;
  declare paymentStatus: 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED' | 'OVERDUE' | 'REFUNDED' | 'WAIVED';
  declare paymentId: string | null;
  declare transactionId: string | null;
  declare purchaseDate: Date;
  declare startsAt: Date;
  declare expiresAt: Date | null;
  declare currentPeriodStart: Date | null;
  declare currentPeriodEnd: Date | null;
  declare gracePeriodEnd: Date | null;
  declare nextBillingDate: Date | null;
  declare cancelledAt: Date | null;
  declare cancellationReason: string | null;
  declare cancelAtPeriodEnd: boolean;
  declare refundedAt: Date | null;
  declare refundReason: string | null;
  declare refundAmount: number | null;
  declare autoRenew: boolean;
  declare source: 'MARKETPLACE' | 'ADMIN_MANUAL' | 'PROMOTION' | 'BUNDLE';
  declare notes: string;
  declare version: number;
}

ProviderAddon.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: true },
  featureKey: { type: DataTypes.STRING, allowNull: false },
  featureName: { type: DataTypes.STRING, allowNull: true },
  addonType: { type: DataTypes.STRING, defaultValue: 'boolean' },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  pricePaid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  unitPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'SAR' },
  billingCycle: { type: DataTypes.STRING, defaultValue: 'MONTHLY' },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  addonStatus: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  paymentStatus: { type: DataTypes.STRING, defaultValue: 'PAID' },
  paymentId: { type: DataTypes.STRING, allowNull: true },
  transactionId: { type: DataTypes.STRING, allowNull: true },
  purchaseDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  startsAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  currentPeriodStart: { type: DataTypes.DATE, allowNull: true },
  currentPeriodEnd: { type: DataTypes.DATE, allowNull: true },
  gracePeriodEnd: { type: DataTypes.DATE, allowNull: true },
  nextBillingDate: { type: DataTypes.DATE, allowNull: true },
  cancelledAt: { type: DataTypes.DATE, allowNull: true },
  cancellationReason: { type: DataTypes.TEXT, allowNull: true },
  cancelAtPeriodEnd: { type: DataTypes.BOOLEAN, defaultValue: false },
  refundedAt: { type: DataTypes.DATE, allowNull: true },
  refundReason: { type: DataTypes.TEXT, allowNull: true },
  refundAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: true },
  autoRenew: { type: DataTypes.BOOLEAN, defaultValue: true },
  source: { type: DataTypes.STRING, defaultValue: 'MARKETPLACE' },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  version: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { 
  sequelize, 
  modelName: 'ProviderAddon', 
  tableName: 'ProviderAddons',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['featureKey'] },
    { fields: ['addonStatus'] },
    { fields: ['status'] }
  ]
});


export type AdminGrantType =
  | 'FEATURE'
  | 'PLAN'
  | 'TEMPORARY_UPGRADE'
  | 'LIMIT_INCREASE'
  | 'FREE_SUBSCRIPTION'
  | 'PROMOTIONAL_ENTITLEMENT'
  | 'PERCENTAGE_DISCOUNT'
  | 'FIXED_DISCOUNT'
  | 'boolean'
  | 'numeric_limit'
  | 'numeric_increment';

export type AdminGrantStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'ACTIVE'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REVOKED'
  | 'active'
  | 'expired'
  | 'revoked';

export class ProviderAdminGrant extends Model {
  declare id: number;
  declare providerId: number;
  declare providerEmail: string;
  declare grantType: AdminGrantType;
  declare planId: number | null;
  declare planName: string | null;
  declare featureKey: string | null;
  declare featureName: string | null;
  declare quantity: number;
  declare value: string; // e.g. 'true', '5', '20%', '100 SAR'
  declare startsAt: Date;
  declare expiresAt: Date | null;
  declare status: AdminGrantStatus;
  declare reason: string;
  declare internalNotes: string;
  declare grantedBy: string;
  declare approvedBy: string | null;
  declare campaignId: string | null;
  declare financialImpact: number;
  declare listPrice: number;
  declare chargedAmount: number;
  declare discountAmount: number;
  declare grantValue: number;
  declare currency: string;
  declare revokedAt: Date | null;
  declare revokedBy: string | null;
  declare targetScope: 'SINGLE' | 'BULK' | 'ALL_PROVIDERS';
  declare bulkBatchId: string | null;
  declare metadata: string;
  declare version: number;
}

ProviderAdminGrant.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: true },
  grantType: { type: DataTypes.STRING, defaultValue: 'FEATURE' },
  planId: { type: DataTypes.INTEGER, allowNull: true },
  planName: { type: DataTypes.STRING, allowNull: true },
  featureKey: { type: DataTypes.STRING, allowNull: true },
  featureName: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  value: { type: DataTypes.STRING, defaultValue: 'true' },
  startsAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'ACTIVE' },
  reason: { type: DataTypes.TEXT, allowNull: false },
  internalNotes: { type: DataTypes.TEXT, defaultValue: '' },
  grantedBy: { type: DataTypes.STRING, defaultValue: 'Admin' },
  approvedBy: { type: DataTypes.STRING, allowNull: true },
  campaignId: { type: DataTypes.STRING, allowNull: true },
  financialImpact: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  listPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  chargedAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discountAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  grantValue: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'SAR' },
  revokedAt: { type: DataTypes.DATE, allowNull: true },
  revokedBy: { type: DataTypes.STRING, allowNull: true },
  targetScope: { type: DataTypes.STRING, defaultValue: 'SINGLE' },
  bulkBatchId: { type: DataTypes.STRING, allowNull: true },
  metadata: { type: DataTypes.TEXT, defaultValue: '{}' },
  version: { type: DataTypes.INTEGER, defaultValue: 1 }
}, { 
  sequelize, 
  modelName: 'ProviderAdminGrant', 
  tableName: 'ProviderAdminGrants',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['status'] },
    { fields: ['grantType'] },
    { fields: ['campaignId'] }
  ]
});


export class FinancialQuote extends Model {
  declare id: number;
  declare quoteId: string;
  declare providerId: number;
  declare providerEmail: string;
  declare itemType: 'SUBSCRIPTION' | 'ADDON' | 'FEATURE';
  declare planId: number | null;
  declare planName: string | null;
  declare featureKey: string | null;
  declare featureName: string | null;
  declare quantity: number;
  declare billingCycle: 'MONTHLY' | 'ANNUAL' | 'ONE_TIME' | 'CUSTOM';
  declare baseAmount: number; // Gross amount before discount
  declare discountAmount: number; // Value deducted
  declare discountRate: number | null; // e.g. 0.20 for 20%
  declare discountSource: 'ADMIN_GRANT' | 'PROMO' | 'COUPON' | 'NONE' | null;
  declare grantId: number | null;
  declare netAmountBeforeTax: number; // Taxable base amount
  declare taxRate: number; // e.g. 0.15
  declare taxAmount: number; // VAT amount
  declare totalAmount: number; // 15% VAT inclusive final price payable
  declare currency: string;
  declare status: 'ISSUED' | 'CONSUMED' | 'EXPIRED' | 'CANCELLED';
  declare issuedAt: Date;
  declare expiresAt: Date;
  declare consumedAt: Date | null;
  declare paymentId: string | null;
  declare verifiedEventId: string | null;
  declare idempotencyKey: string | null;
  declare metadata: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

FinancialQuote.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  quoteId: { type: DataTypes.STRING, allowNull: false, unique: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: true, defaultValue: '' },
  itemType: { type: DataTypes.STRING, allowNull: false, defaultValue: 'SUBSCRIPTION' },
  planId: { type: DataTypes.INTEGER, allowNull: true },
  planName: { type: DataTypes.STRING, allowNull: true },
  featureKey: { type: DataTypes.STRING, allowNull: true },
  featureName: { type: DataTypes.STRING, allowNull: true },
  quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  billingCycle: { type: DataTypes.STRING, defaultValue: 'MONTHLY' },
  baseAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  discountAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  discountRate: { type: DataTypes.FLOAT, allowNull: true },
  discountSource: { type: DataTypes.STRING, allowNull: true, defaultValue: 'NONE' },
  grantId: { type: DataTypes.INTEGER, allowNull: true },
  netAmountBeforeTax: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  taxRate: { type: DataTypes.FLOAT, defaultValue: 0.15 },
  taxAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  totalAmount: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'SAR' },
  status: { type: DataTypes.STRING, defaultValue: 'ISSUED' },
  issuedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
  consumedAt: { type: DataTypes.DATE, allowNull: true },
  paymentId: { type: DataTypes.STRING, allowNull: true },
  verifiedEventId: { type: DataTypes.STRING, allowNull: true },
  idempotencyKey: { type: DataTypes.STRING, allowNull: true },
  metadata: { type: DataTypes.TEXT, defaultValue: '{}' }
}, {
  sequelize,
  modelName: 'FinancialQuote',
  tableName: 'FinancialQuotes',
  indexes: [
    { fields: ['quoteId'], unique: true },
    { fields: ['providerId'] },
    { fields: ['status'] },
    { fields: ['expiresAt'] }
  ]
});

export type EntitlementAuditEventType =
  | 'PLAN_CHANGED'
  | 'ADDON_PURCHASE_REQUESTED'
  | 'ADDON_PAYMENT_VERIFIED'
  | 'ADDON_ACTIVATED'
  | 'ADDON_RENEWED'
  | 'ADDON_EXPIRED'
  | 'ADDON_CANCELLED'
  | 'ADDON_REFUNDED'
  | 'ADDON_REVOKED'
  | 'ADMIN_GRANT_CREATED'
  | 'ADMIN_GRANT_ACTIVATED'
  | 'ADMIN_GRANT_EXPIRED'
  | 'ADMIN_GRANT_REVOKED'
  | 'TEMPORARY_UPGRADE_STARTED'
  | 'TEMPORARY_UPGRADE_ENDED'
  | 'DISCOUNT_GRANTED'
  | 'DISCOUNT_EXPIRED'
  | 'BULK_GRANT_CREATED'
  | 'PROMOTION_APPLIED'
  | 'FEATURE_OVERRIDE_APPLIED'
  | 'FEATURE_ACCESS_GRANTED'
  | 'FEATURE_ACCESS_DENIED'
  | 'LIMIT_CHECK_PASSED'
  | 'LIMIT_EXCEEDED'
  | 'SUBSCRIPTION_CREATED'
  | 'SUBSCRIPTION_ACTIVATED'
  | 'SUBSCRIPTION_UPGRADED'
  | 'SUBSCRIPTION_DOWNGRADED'
  | 'SUBSCRIPTION_RENEWED'
  | 'SUBSCRIPTION_GRACE_STARTED'
  | 'SUBSCRIPTION_EXPIRED'
  | 'SUBSCRIPTION_CANCELLED'
  | 'SUBSCRIPTION_PAYMENT_FAILED'
  | 'FINANCIAL_QUOTE_CREATED'
  | 'FINANCIAL_QUOTE_CONSUMED'
  | 'SUBSCRIPTION_PAYMENT_VERIFIED'
  | 'DISCOUNT_APPLIED'
  | 'TAX_CALCULATED'
  | 'FINANCIAL_RECONCILIATION_MISMATCH';

export class EntitlementAuditLog extends Model {
  declare id: number;
  declare providerId: number;
  declare providerEmail: string;
  declare eventType: EntitlementAuditEventType;
  declare featureKey: string | null;
  declare source: 'PLAN' | 'ADDON' | 'ADMIN_GRANT' | 'PROMOTION' | 'TEMPORARY_UPGRADE' | 'OVERRIDE' | 'SYSTEM';
  declare actor: string;
  declare reason: string;
  declare oldValue: string | null;
  declare newValue: string | null;
  declare financialImpact: number;
  declare metadata: string; // JSON
  declare createdAt: Date;
}

EntitlementAuditLog.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: true },
  eventType: { type: DataTypes.STRING, allowNull: false },
  featureKey: { type: DataTypes.STRING, allowNull: true },
  source: { type: DataTypes.STRING, defaultValue: 'SYSTEM' },
  actor: { type: DataTypes.STRING, defaultValue: 'System' },
  reason: { type: DataTypes.TEXT, defaultValue: '' },
  oldValue: { type: DataTypes.TEXT, allowNull: true },
  newValue: { type: DataTypes.TEXT, allowNull: true },
  financialImpact: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  metadata: { type: DataTypes.TEXT, defaultValue: '{}' }
}, { sequelize, modelName: 'EntitlementAuditLog', tableName: 'EntitlementAuditLogs' });


export async function migrateSubscriptionTables() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo: any = await queryInterface.describeTable('ProviderFeatureOverrides').catch(() => null);
    if (tableInfo) {
      if (!tableInfo.isGranted) {
        await sequelize.query('ALTER TABLE ProviderFeatureOverrides ADD COLUMN isGranted INTEGER DEFAULT 1;').catch((e) => console.warn('Column isGranted add warning:', e.message));
      }
      if (!tableInfo.startsAt) {
        await sequelize.query('ALTER TABLE ProviderFeatureOverrides ADD COLUMN startsAt DATETIME;').catch((e) => console.warn('Column startsAt add warning:', e.message));
      }
      if (!tableInfo.grantedBy) {
        await sequelize.query("ALTER TABLE ProviderFeatureOverrides ADD COLUMN grantedBy TEXT DEFAULT 'Admin';").catch((e) => console.warn('Column grantedBy add warning:', e.message));
      }
      if (!tableInfo.reason) {
        await sequelize.query("ALTER TABLE ProviderFeatureOverrides ADD COLUMN reason TEXT DEFAULT '';").catch((e) => console.warn('Column reason add warning:', e.message));
      }
      if (!tableInfo.financialImpact) {
        await sequelize.query('ALTER TABLE ProviderFeatureOverrides ADD COLUMN financialImpact REAL DEFAULT 0;').catch((e) => console.warn('Column financialImpact add warning:', e.message));
      }
    }

    const subTableInfo: any = await queryInterface.describeTable('ProviderSubscriptions').catch(() => null);
    if (subTableInfo) {
      if (!subTableInfo.planId) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN planId INTEGER;").catch(() => {});
      }
      if (!subTableInfo.paymentId) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN paymentId TEXT;").catch(() => {});
      }
      if (!subTableInfo.subscriptionStatus) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN subscriptionStatus TEXT DEFAULT 'ACTIVE';").catch(() => {});
      }
      if (!subTableInfo.paymentStatus) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN paymentStatus TEXT DEFAULT 'PAID';").catch(() => {});
      }
      if (!subTableInfo.billingCycle) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN billingCycle TEXT DEFAULT 'MONTHLY';").catch(() => {});
      }
      if (!subTableInfo.currentPeriodStart) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN currentPeriodStart DATETIME;").catch(() => {});
      }
      if (!subTableInfo.currentPeriodEnd) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN currentPeriodEnd DATETIME;").catch(() => {});
      }
      if (!subTableInfo.gracePeriodEnd) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN gracePeriodEnd DATETIME;").catch(() => {});
      }
      if (!subTableInfo.nextBillingDate) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN nextBillingDate DATETIME;").catch(() => {});
      }
      if (!subTableInfo.scheduledPlanId) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN scheduledPlanId INTEGER;").catch(() => {});
      }
      if (!subTableInfo.scheduledPlanName) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN scheduledPlanName TEXT;").catch(() => {});
      }
      if (!subTableInfo.scheduledChangeDate) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN scheduledChangeDate DATETIME;").catch(() => {});
      }
      if (!subTableInfo.scheduledChangeType) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN scheduledChangeType TEXT;").catch(() => {});
      }
      if (!subTableInfo.previousSubscriptionId) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN previousSubscriptionId INTEGER;").catch(() => {});
      }
      if (!subTableInfo.cancellationReason) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN cancellationReason TEXT;").catch(() => {});
      }
      if (!subTableInfo.cancelledAt) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN cancelledAt DATETIME;").catch(() => {});
      }
      if (!subTableInfo.autoRenew) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN autoRenew INTEGER DEFAULT 1;").catch(() => {});
      }
      if (!subTableInfo.version) {
        await sequelize.query("ALTER TABLE ProviderSubscriptions ADD COLUMN version INTEGER DEFAULT 1;").catch(() => {});
      }
    }

    const addonTableInfo: any = await queryInterface.describeTable('ProviderAddons').catch(() => null);
    if (addonTableInfo) {
      if (!addonTableInfo.addonType) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN addonType TEXT DEFAULT 'boolean';").catch(() => {});
      }
      if (!addonTableInfo.quantity) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN quantity INTEGER DEFAULT 1;").catch(() => {});
      }
      if (!addonTableInfo.unitPrice) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN unitPrice REAL DEFAULT 0;").catch(() => {});
      }
      if (!addonTableInfo.currency) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN currency TEXT DEFAULT 'SAR';").catch(() => {});
      }
      if (!addonTableInfo.billingCycle) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN billingCycle TEXT DEFAULT 'MONTHLY';").catch(() => {});
      }
      if (!addonTableInfo.addonStatus) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN addonStatus TEXT DEFAULT 'ACTIVE';").catch(() => {});
      }
      if (!addonTableInfo.paymentStatus) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN paymentStatus TEXT DEFAULT 'PAID';").catch(() => {});
      }
      if (!addonTableInfo.paymentId) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN paymentId TEXT;").catch(() => {});
      }
      if (!addonTableInfo.currentPeriodStart) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN currentPeriodStart DATETIME;").catch(() => {});
      }
      if (!addonTableInfo.currentPeriodEnd) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN currentPeriodEnd DATETIME;").catch(() => {});
      }
      if (!addonTableInfo.gracePeriodEnd) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN gracePeriodEnd DATETIME;").catch(() => {});
      }
      if (!addonTableInfo.nextBillingDate) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN nextBillingDate DATETIME;").catch(() => {});
      }
      if (!addonTableInfo.cancelledAt) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN cancelledAt DATETIME;").catch(() => {});
      }
      if (!addonTableInfo.cancellationReason) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN cancellationReason TEXT;").catch(() => {});
      }
      if (!addonTableInfo.cancelAtPeriodEnd) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN cancelAtPeriodEnd INTEGER DEFAULT 0;").catch(() => {});
      }
      if (!addonTableInfo.refundedAt) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN refundedAt DATETIME;").catch(() => {});
      }
      if (!addonTableInfo.refundReason) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN refundReason TEXT;").catch(() => {});
      }
      if (!addonTableInfo.refundAmount) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN refundAmount REAL;").catch(() => {});
      }
      if (!addonTableInfo.autoRenew) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN autoRenew INTEGER DEFAULT 1;").catch(() => {});
      }
      if (!addonTableInfo.source) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN source TEXT DEFAULT 'MARKETPLACE';").catch(() => {});
      }
      if (!addonTableInfo.version) {
        await sequelize.query("ALTER TABLE ProviderAddons ADD COLUMN version INTEGER DEFAULT 1;").catch(() => {});
      }
    }

    const grantTableInfo: any = await queryInterface.describeTable('ProviderAdminGrants').catch(() => null);
    if (grantTableInfo) {
      if (!grantTableInfo.planId) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN planId INTEGER;").catch(() => {});
      }
      if (!grantTableInfo.planName) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN planName TEXT;").catch(() => {});
      }
      if (!grantTableInfo.quantity) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN quantity INTEGER DEFAULT 1;").catch(() => {});
      }
      if (!grantTableInfo.internalNotes) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN internalNotes TEXT DEFAULT '';").catch(() => {});
      }
      if (!grantTableInfo.approvedBy) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN approvedBy TEXT;").catch(() => {});
      }
      if (!grantTableInfo.campaignId) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN campaignId TEXT;").catch(() => {});
      }
      if (!grantTableInfo.listPrice) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN listPrice REAL DEFAULT 0;").catch(() => {});
      }
      if (!grantTableInfo.chargedAmount) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN chargedAmount REAL DEFAULT 0;").catch(() => {});
      }
      if (!grantTableInfo.discountAmount) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN discountAmount REAL DEFAULT 0;").catch(() => {});
      }
      if (!grantTableInfo.grantValue) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN grantValue REAL DEFAULT 0;").catch(() => {});
      }
      if (!grantTableInfo.currency) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN currency TEXT DEFAULT 'SAR';").catch(() => {});
      }
      if (!grantTableInfo.revokedAt) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN revokedAt DATETIME;").catch(() => {});
      }
      if (!grantTableInfo.revokedBy) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN revokedBy TEXT;").catch(() => {});
      }
      if (!grantTableInfo.targetScope) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN targetScope TEXT DEFAULT 'SINGLE';").catch(() => {});
      }
      if (!grantTableInfo.bulkBatchId) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN bulkBatchId TEXT;").catch(() => {});
      }
      if (!grantTableInfo.metadata) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN metadata TEXT DEFAULT '{}';").catch(() => {});
      }
      if (!grantTableInfo.version) {
        await sequelize.query("ALTER TABLE ProviderAdminGrants ADD COLUMN version INTEGER DEFAULT 1;").catch(() => {});
      }
    }
  } catch (err: any) {
    console.warn('⚠️ [SubscriptionModels] Migration table check warning:', err.message || err);
  }
}

export async function syncSubscriptionModels() {
  await migrateSubscriptionTables();
  await sequelize.sync();

  // Pre-seed some default standard and custom/hidden plans if empty, or ensure existing plans are synchronized with new capabilities
  try {
    const plansToSeed = [
      {
        name: 'الباقة الأساسية',
        price: 99.00,
        description: 'الباقة المبدئية لإدارة قاعة واحدة بخصائص أساسية',
        features: JSON.stringify({
          max_halls: 1,
          inventory_management: false,
          weekend_pricing: false,
          dynamic_surge_pricing: false,
          dynamic_pricing: false,
          marketing_analytics: false,
          client_chats: true,
          includesInventory: false,
          includesSuppliers: false,
          includesWeekendPricing: false,
          includesDynamicSurgePricing: false,
          hallsLimit: '1',
          servicesLimit: '5',
          canExportFinancials: false,
          hasSupport: false,
          staffSeatsLimit: '0',
          includesGrowthCharts: false,
          includesFinancialForecast: false,
          includesPartialPayment: false,
          includesAdvancedStats: false,
          includesFullManagement: false,
          includesAdvancedProviderDashboard: false,
          includesLogisticsPortal: false,
          includesWhatsAppCampaignAlerts: false
        }),
        isHidden: false
      },
      {
        name: 'باقة الأعمال',
        price: 199.00,
        description: 'باقة مثالية للمؤسسات والشركات المتوسطة لإدارة حتى 3 قاعات بمميزات متكاملة',
        features: JSON.stringify({
          max_halls: 3,
          inventory_management: true,
          weekend_pricing: true,
          dynamic_surge_pricing: false,
          dynamic_pricing: true,
          marketing_analytics: false,
          client_chats: true,
          includesInventory: true,
          includesSuppliers: true,
          includesWeekendPricing: true,
          includesDynamicSurgePricing: false,
          hallsLimit: '3',
          servicesLimit: '15',
          canExportFinancials: true,
          hasSupport: true,
          staffSeatsLimit: '5',
          includesGrowthCharts: false,
          includesFinancialForecast: false,
          includesPartialPayment: false,
          includesAdvancedStats: true,
          includesFullManagement: true,
          includesAdvancedProviderDashboard: true,
          includesLogisticsPortal: false,
          includesWhatsAppCampaignAlerts: true
        }),
        isHidden: false
      },
      {
        name: 'الباقة الاحترافية',
        price: 399.00,
        description: 'باقة النخبة للتميز المتكامل وإدارة القاعات والخدمات بلا حدود مع بوابات الدفع وشريك لوجستي',
        features: JSON.stringify({
          max_halls: 99,
          inventory_management: true,
          weekend_pricing: true,
          dynamic_surge_pricing: true,
          dynamic_pricing: true,
          marketing_analytics: true,
          client_chats: true,
          includesInventory: true,
          includesSuppliers: true,
          includesWeekendPricing: true,
          includesDynamicSurgePricing: true,
          hallsLimit: '',
          servicesLimit: '',
          canExportFinancials: true,
          hasSupport: true,
          staffSeatsLimit: '',
          includesGrowthCharts: true,
          includesFinancialForecast: true,
          includesPartialPayment: true,
          includesAdvancedStats: true,
          includesFullManagement: true,
          includesAdvancedProviderDashboard: true,
          includesLogisticsPortal: true,
          includesWhatsAppCampaignAlerts: true
        }),
        isHidden: false
      },
      {
        name: 'باقة التميز المتكاملة',
        price: 750.00,
        description: 'تغطية كاملة مع دعم مطلق وقاعات غير محدودة وتحليلات تسويق متقدمة وتأمين',
        features: JSON.stringify({
          max_halls: 99,
          inventory_management: true,
          weekend_pricing: true,
          dynamic_surge_pricing: true,
          dynamic_pricing: true,
          marketing_analytics: true,
          client_chats: true,
          includesInventory: true,
          includesSuppliers: true,
          includesWeekendPricing: true,
          includesDynamicSurgePricing: true,
          hallsLimit: '',
          servicesLimit: '',
          canExportFinancials: true,
          hasSupport: true,
          staffSeatsLimit: '',
          includesGrowthCharts: true,
          includesFinancialForecast: true,
          includesPartialPayment: true,
          includesAdvancedStats: true,
          includesFullManagement: true,
          includesAdvancedProviderDashboard: true,
          includesLogisticsPortal: true,
          includesWhatsAppCampaignAlerts: true
        }),
        isHidden: false
      },
      {
        name: 'باقة شريك النجاح البرونزية (مخفية)',
        price: 0.00,
        description: 'باقة ترويجية خاصة ومخفية تمنح ميزة قاعات إضافية مجاناً',
        features: JSON.stringify({
          max_halls: 3,
          inventory_management: false,
          dynamic_pricing: true,
          marketing_analytics: false,
          client_chats: true,
          includesInventory: false,
          includesSuppliers: true,
          hallsLimit: '3',
          servicesLimit: '10',
          canExportFinancials: true,
          hasSupport: true,
          staffSeatsLimit: '2',
          includesGrowthCharts: false,
          includesFinancialForecast: false,
          includesPartialPayment: false,
          includesAdvancedStats: false,
          includesFullManagement: false,
          includesAdvancedProviderDashboard: false,
          includesLogisticsPortal: false
        }),
        isHidden: true
      },
      {
        name: 'باقة الدعم الاستراتيجي الذهبية (مخفية)',
        price: 250.00,
        description: 'باقة مخصصة مخفية توفر جميع الميزات المتقدمة بخصم استثنائي',
        features: JSON.stringify({
          max_halls: 10,
          inventory_management: true,
          dynamic_pricing: true,
          marketing_analytics: true,
          client_chats: true,
          includesInventory: true,
          includesSuppliers: true,
          hallsLimit: '10',
          servicesLimit: '30',
          canExportFinancials: true,
          hasSupport: true,
          staffSeatsLimit: '10',
          includesGrowthCharts: true,
          includesFinancialForecast: true,
          includesPartialPayment: true,
          includesAdvancedStats: true,
          includesFullManagement: true,
          includesAdvancedProviderDashboard: true,
          includesLogisticsPortal: true
        }),
        isHidden: true
      }
    ];

    const [seedConfig, seededCreated] = await PlatformConfig.findOrCreate({
      where: { key: 'subscription_plans_seeded' },
      defaults: { key: 'subscription_plans_seeded', value: 'false' }
    });

    if (seedConfig.value !== 'true') {
      for (const planData of plansToSeed) {
        const existingPlan = await SubscriptionPlan.findOne({ where: { name: planData.name } });
        if (!existingPlan) {
          await SubscriptionPlan.create(planData);
        }
      }
      seedConfig.value = 'true';
      await seedConfig.save();
      console.log("✅ Initial seeding of default subscription plans completed successfully.");
    } else {
      console.log("ℹ️ Default subscription plans already seeded once. Skipping automatic re-seeding to protect user deletions and customization.");
    }
  } catch (err) {
    console.error("Error pre-seeding subscription plans:", err);
  }
}
