import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from './Database.js';
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


export class ProviderSubscription extends Model {
  declare id: number;
  declare providerId: number;
  declare providerEmail: string;
  declare planName: string;
  declare pricePaid: number;
  declare status: 'active' | 'expired' | 'suspended';
  declare startDate: Date;
  declare endDate: Date | null;
  declare isCustom: boolean;
  declare notes: string;
  declare planId: number | null;
}

ProviderSubscription.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: false },
  planName: { type: DataTypes.STRING, allowNull: false },
  pricePaid: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  startDate: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  endDate: { type: DataTypes.DATE, allowNull: true },
  isCustom: { type: DataTypes.BOOLEAN, defaultValue: false },
  notes: { type: DataTypes.TEXT, defaultValue: '' },
  planId: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'ProviderSubscription', tableName: 'ProviderSubscriptions' });


export class ProviderFeatureOverride extends Model {
  declare id: number;
  declare providerId: number;
  declare providerEmail: string;
  declare featureKey: string; // e.g. 'max_halls', 'inventory_management', 'dynamic_pricing'
  declare featureName: string; // Arabic name, e.g. 'ميزة إدارة المخزون'
  declare overrideType: 'increment' | 'replace' | 'grant';
  declare value: string; // e.g. '5' or 'true'
  declare expiresAt: Date | null;
  declare notes: string;
}

ProviderFeatureOverride.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerEmail: { type: DataTypes.STRING, allowNull: false },
  featureKey: { type: DataTypes.STRING, allowNull: false },
  featureName: { type: DataTypes.STRING, allowNull: false },
  overrideType: { type: DataTypes.STRING, defaultValue: 'grant' }, // grant = boolean, increment = add amount, replace = override limit
  value: { type: DataTypes.STRING, defaultValue: 'true' },
  expiresAt: { type: DataTypes.DATE, allowNull: true },
  notes: { type: DataTypes.TEXT, defaultValue: '' }
}, { sequelize, modelName: 'ProviderFeatureOverride', tableName: 'ProviderFeatureOverrides' });


export async function syncSubscriptionModels() {
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
          dynamic_pricing: false,
          marketing_analytics: false,
          client_chats: true,
          includesInventory: false,
          includesSuppliers: false,
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
          dynamic_pricing: true,
          marketing_analytics: false,
          client_chats: true,
          includesInventory: true,
          includesSuppliers: true,
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
          dynamic_pricing: true,
          marketing_analytics: true,
          client_chats: true,
          includesInventory: true,
          includesSuppliers: true,
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
          dynamic_pricing: true,
          marketing_analytics: true,
          client_chats: true,
          includesInventory: true,
          includesSuppliers: true,
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
