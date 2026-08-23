import { DataTypes, Model } from 'sequelize';
import { sequelize } from './Database.js';

export class StoreProductModel extends Model {
  declare id: string;
  declare hallId: number | null;
  declare providerId: string;
  declare providerName: string;
  declare name: string;
  declare category: string; // 'beverages' | 'hospitality' | 'furniture' | 'logistics' | 'perfumes' | 'general'
  declare unit: string;
  declare price: number; // 15% VAT-Inclusive
  declare costPrice: number;
  declare stock: number;
  declare minQuantity: number;
  declare maxQuantity: number;
  declare description: string;
  declare image: string;
  declare sku: string;
  declare status: string; // 'active' | 'paused' | 'low_stock'
  declare periods: string; // JSON array of periods: ['morning', 'night', 'fullday']
  declare itemType: string; // 'consumable' | 'asset'
  declare isLinkedToInventory: boolean;
  declare inventoryItemId: string | null;
}

StoreProductModel.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  hallId: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.STRING, allowNull: false, defaultValue: 'PROV-1' },
  providerName: { type: DataTypes.STRING, allowNull: false, defaultValue: '' },
  name: { type: DataTypes.STRING, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'hospitality' },
  unit: { type: DataTypes.STRING, defaultValue: 'قطعة' },
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false, defaultValue: 0 },
  costPrice: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  stock: { type: DataTypes.INTEGER, defaultValue: 100 },
  minQuantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  maxQuantity: { type: DataTypes.INTEGER, defaultValue: 100 },
  description: { type: DataTypes.TEXT, defaultValue: '' },
  image: { type: DataTypes.TEXT, defaultValue: '' },
  sku: { type: DataTypes.STRING, defaultValue: '' },
  status: { type: DataTypes.STRING, defaultValue: 'active' },
  periods: { type: DataTypes.TEXT, defaultValue: '["morning","night","fullday"]' },
  itemType: { type: DataTypes.STRING, defaultValue: 'consumable' },
  isLinkedToInventory: { type: DataTypes.BOOLEAN, defaultValue: false },
  inventoryItemId: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, modelName: 'StoreProduct', tableName: 'StoreProducts' });


export class StoreOrderModel extends Model {
  declare id: string;
  declare orderNumber: string; // SRV-YY-XXXXXXXXXX
  declare bookingId: string | null;
  declare hallId: number | null;
  declare providerId: string;
  declare customerId: string;
  declare customerName: string;
  declare customerPhone: string;
  declare totalGrossAmount: number; // VAT Inclusive
  declare taxableAmount: number;
  declare vatAmount: number;
  declare status: 'confirmed' | 'pending' | 'completed' | 'cancelled';
  declare items: string; // JSON array of items
  declare notes: string;
}

StoreOrderModel.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  orderNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  bookingId: { type: DataTypes.STRING, allowNull: true },
  hallId: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.STRING, allowNull: false },
  customerId: { type: DataTypes.STRING, defaultValue: 'CUST-GUEST' },
  customerName: { type: DataTypes.STRING, defaultValue: 'عميل المنصة' },
  customerPhone: { type: DataTypes.STRING, defaultValue: '' },
  totalGrossAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  taxableAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  vatAmount: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'confirmed' },
  items: { type: DataTypes.TEXT, defaultValue: '[]' },
  notes: { type: DataTypes.TEXT, defaultValue: '' }
}, { sequelize, modelName: 'StoreOrder', tableName: 'StoreOrders' });


export class EntitlementAuditModel extends Model {
  declare id: string;
  declare providerId: string;
  declare providerName: string;
  declare featureKey: string;
  declare featureName: string;
  declare action: string;
  declare source: string;
  declare performedBy: string;
  declare reason: string;
  declare details: string;
}

EntitlementAuditModel.init({
  id: { type: DataTypes.STRING, primaryKey: true },
  providerId: { type: DataTypes.STRING, allowNull: false },
  providerName: { type: DataTypes.STRING, defaultValue: '' },
  featureKey: { type: DataTypes.STRING, allowNull: false },
  featureName: { type: DataTypes.STRING, defaultValue: '' },
  action: { type: DataTypes.STRING, allowNull: false },
  source: { type: DataTypes.STRING, defaultValue: 'addon' },
  performedBy: { type: DataTypes.STRING, defaultValue: 'النظام' },
  reason: { type: DataTypes.TEXT, defaultValue: '' },
  details: { type: DataTypes.TEXT, defaultValue: '{}' }
}, { sequelize, modelName: 'EntitlementAudit', tableName: 'EntitlementAudits' });

export class MiniStoreCommissionPolicyModel extends Model {
  declare id: string;
  declare applyCommission: boolean;
  declare commissionMethod: 'global_rate' | 'tier_based';
  declare commissionRate: number; // e.g. 0.05 for 5%
  declare version: string;
  declare effectiveAt: Date;
  declare updatedBy: string;
  declare notes: string;
}

MiniStoreCommissionPolicyModel.init({
  id: { type: DataTypes.STRING, primaryKey: true, defaultValue: 'default' },
  applyCommission: { type: DataTypes.BOOLEAN, defaultValue: false }, // Default: Exemption Active (0% Commission)
  commissionMethod: { type: DataTypes.STRING, defaultValue: 'global_rate' },
  commissionRate: { type: DataTypes.DECIMAL(5, 4), defaultValue: 0.0000 },
  version: { type: DataTypes.STRING, defaultValue: 'V1.0.0' },
  effectiveAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  updatedBy: { type: DataTypes.STRING, defaultValue: 'الإدارة السيادية' },
  notes: { type: DataTypes.TEXT, defaultValue: 'مبيعات منتجات المتجر المصغر معفاة افتراضياً من عمولة منصة ليلة' }
}, { sequelize, modelName: 'MiniStoreCommissionPolicy', tableName: 'MiniStoreCommissionPolicies' });

export async function syncStoreModels() {
  await sequelize.sync();
  // Ensure default policy exists
  try {
    const [policy, created] = await MiniStoreCommissionPolicyModel.findOrCreate({
      where: { id: 'default' },
      defaults: {
        id: 'default',
        applyCommission: false,
        commissionMethod: 'global_rate',
        commissionRate: 0.0,
        version: 'V1.0.0',
        effectiveAt: new Date(),
        updatedBy: 'الإدارة السيادية',
        notes: 'مبيعات منتجات المتجر المصغر معفاة افتراضياً من عمولة منصة ليلة (Commission = 0%)'
      }
    });
    if (created) {
      console.log('✅ [MiniStore] Default Commission Exemption Policy created (applyCommission = false, rate = 0%).');
    }
  } catch (err) {
    console.error('⚠️ [MiniStore] Could not initialize default commission policy:', err);
  }
}
