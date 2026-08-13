import { DataTypes, Model } from 'sequelize';
import { sequelize } from './Database.js';
import { User } from './UserModels.js';

export class Hall extends Model {
  declare id: number;
  declare name: string;
  declare type: string; // 'مؤتمرات', 'أفراح', 'شاليه', 'استراحة'
  declare description: string;
  declare contractTerms: string;
  declare capacity: number;
  declare hourlyRate: number;
  declare status: string;
  declare activationStatus: string;
  declare city: string;
  declare category: string;
  declare price: number;
  declare rating: number;
  declare image: string;
  declare images: string;
  declare location: string;
  declare provider: string;
  declare features: string;
  declare rules: string;
  declare extraServicesList: string;
  declare featured: boolean;
  declare nightPrice: number;
  declare morningPrice: number;
  declare fullDayPrice: number;
  declare phone: string;
  declare email: string;
  declare region: string;
  declare nationalAddress: string;
  declare extraAddress: string;
  declare providerType: string;
  declare crNumber: string;
  declare crExpiryDate: string;
  declare taxNumber: string;
  declare bookingStatus: string;
  declare facilities: string;
  declare cancellationPeriod: number | null;
  declare providerId: number | null;
  declare taxExempt: boolean;
  declare paymentMethod: string;
  declare pledgeAccepted: boolean;
  declare crImage: string;
  declare ibanImage: string;
  declare taxCertificateImage: string;
  declare zakatCertificateImage: string;
  declare tourismLicenseImage: string;
  declare bookingType: string;
  declare packagesList: string;
  declare providerUser?: any;
}

Hall.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  contractTerms: { type: DataTypes.TEXT },
  capacity: { type: DataTypes.INTEGER, allowNull: false },
  hourlyRate: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  activationStatus: { type: DataTypes.STRING, defaultValue: 'مفعل' },
  city: { type: DataTypes.STRING, defaultValue: 'الرياض' },
  category: { type: DataTypes.STRING, defaultValue: 'قاعة أفراح' },
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  rating: { type: DataTypes.FLOAT, defaultValue: 4.5 },
  image: { type: DataTypes.TEXT },
  images: { type: DataTypes.TEXT },
  location: { type: DataTypes.STRING },
  provider: { type: DataTypes.STRING },
  features: { type: DataTypes.TEXT },
  rules: { type: DataTypes.TEXT },
  extraServicesList: { type: DataTypes.TEXT },
  featured: { type: DataTypes.BOOLEAN, defaultValue: false },
  nightPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  morningPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  fullDayPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  region: { type: DataTypes.STRING },
  nationalAddress: { type: DataTypes.STRING },
  extraAddress: { type: DataTypes.STRING },
  providerType: { type: DataTypes.STRING },
  crNumber: { type: DataTypes.STRING },
  crExpiryDate: { type: DataTypes.STRING },
  taxNumber: { type: DataTypes.STRING },
  bookingStatus: { type: DataTypes.STRING, defaultValue: 'متاحة' },
  facilities: { type: DataTypes.TEXT },
  cancellationPeriod: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  taxExempt: { type: DataTypes.BOOLEAN, defaultValue: false },
  paymentMethod: { type: DataTypes.STRING },
  pledgeAccepted: { type: DataTypes.BOOLEAN, defaultValue: false },
  crImage: { type: DataTypes.TEXT },
  ibanImage: { type: DataTypes.TEXT },
  taxCertificateImage: { type: DataTypes.TEXT },
  zakatCertificateImage: { type: DataTypes.TEXT },
  tourismLicenseImage: { type: DataTypes.TEXT },
  bookingType: { type: DataTypes.STRING, defaultValue: 'alacarte' },
  packagesList: { type: DataTypes.TEXT, defaultValue: '[]' }
}, {
  sequelize,
  modelName: 'Hall',
  paranoid: true,
  indexes: [
    { fields: ['providerId'] },
    { fields: ['status'] },
    { fields: ['city'] }
  ]
});

export class HallExtraServices extends Model {
  declare id: number;
  declare providerId: number | null;
  declare hallId: number;
  declare nameAr: string;
  declare nameEn: string | null;
  declare description: string | null;
  declare category: string | null;
  declare priceType: 'flat_fee' | 'per_guest' | 'per_hour';
  declare price: number;
  declare status: 'active' | 'inactive' | 'under_review';
  declare imageUrl: string | null;
  declare quantity: number | null;
}

HallExtraServices.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  hallId: { type: DataTypes.INTEGER, allowNull: false },
  nameAr: { type: DataTypes.STRING(150), allowNull: false },
  nameEn: { type: DataTypes.STRING(150), allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  category: { type: DataTypes.STRING, allowNull: true },
  priceType: { type: DataTypes.STRING, defaultValue: 'flat_fee' }, // flat_fee, per_guest, per_hour
  price: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.STRING, defaultValue: 'active' }, // active, inactive, under_review
  imageUrl: { type: DataTypes.TEXT, allowNull: true },
  quantity: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'HallExtraServices', tableName: 'hall_extra_services' });

export class Service extends Model {
  declare id: number;
  declare hallId: number;
  declare name: string;
  declare description: string;
  declare quantity: number | null;
  declare price: number;
  declare provider: string;
  declare providerId: number | null;
  declare showProviderToCustomers: boolean;
  declare regions: string;
  declare cities: string;
  declare terms: string;
  declare serviceStatus: string;
  declare adminStatus: string;
  declare status: string;
  declare activationStatus: string;
  declare cancellationPeriod: number | null;
  declare images: string;
  declare hostName: string;
  declare unit: string;
  declare unitPrice: number;
  declare taxonomyType: string;
  declare packages: string;
  declare addons: string;
  declare classification: string | null;
  declare providerUser?: any;
}

Service.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  hallId: { type: DataTypes.INTEGER, allowNull: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  quantity: { type: DataTypes.INTEGER, allowNull: true },
  price: { type: DataTypes.FLOAT, allowNull: false },
  provider: { type: DataTypes.STRING },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  showProviderToCustomers: { type: DataTypes.BOOLEAN, defaultValue: false },
  regions: { type: DataTypes.TEXT },
  cities: { type: DataTypes.TEXT },
  terms: { type: DataTypes.TEXT },
  serviceStatus: { type: DataTypes.STRING, defaultValue: 'متاحة' },
  adminStatus: { type: DataTypes.STRING, defaultValue: 'فعالة' },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  activationStatus: { type: DataTypes.STRING, defaultValue: 'مفعل' },
  cancellationPeriod: { type: DataTypes.INTEGER, allowNull: true },
  images: { type: DataTypes.TEXT },
  hostName: { type: DataTypes.STRING },
  unit: { type: DataTypes.STRING, defaultValue: 'مرة واحدة' },
  unitPrice: { type: DataTypes.FLOAT, defaultValue: 0 },
  taxonomyType: { type: DataTypes.STRING, defaultValue: 'rental' },
  packages: { type: DataTypes.TEXT, defaultValue: '[]' },
  addons: { type: DataTypes.TEXT, defaultValue: '[]' },
  classification: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'Service',
  paranoid: true,
  indexes: [
    { fields: ['providerId'] },
    { fields: ['status'] },
    { fields: ['hallId'] }
  ]
});

export class Booking extends Model {
  declare id: number;
  declare customerName: string;
  declare customerPhone: string;
  declare hallId: number;
  declare startTime: Date;
  declare endTime: Date;
  declare guests: number;
  declare totalAmount: number;
  declare status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  declare createdAt?: Date;
  declare userId: number | null;
  declare customerEmail: string | null;
  declare bookingType: string | null;
  declare packageName: string | null;
  declare selectedAddons: string | null;
  declare externalServices: string | null;
  declare subTotal: number | null;
  declare taxAmount: number | null;
  declare depositAmount: number | null;
  declare paymentMethod: string | null;
  declare paymentStatus: string | null;
  declare paymentDeadline: Date | null;
}

Booking.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerPhone: { type: DataTypes.STRING, allowNull: false },
  hallId: { type: DataTypes.INTEGER, allowNull: false },
  startTime: { type: DataTypes.DATE, allowNull: false },
  endTime: { type: DataTypes.DATE, allowNull: false },
  guests: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  customerEmail: { type: DataTypes.STRING, allowNull: true },
  bookingType: { type: DataTypes.STRING, defaultValue: 'alacarte' },
  packageName: { type: DataTypes.STRING, allowNull: true },
  selectedAddons: { type: DataTypes.TEXT, defaultValue: '[]' },
  externalServices: { type: DataTypes.TEXT, defaultValue: '[]' },
  subTotal: { type: DataTypes.FLOAT, defaultValue: 0 },
  taxAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  depositAmount: { type: DataTypes.FLOAT, defaultValue: 0 },
  paymentMethod: { type: DataTypes.STRING, allowNull: true },
  paymentStatus: { type: DataTypes.STRING, defaultValue: 'pending' },
  paymentDeadline: { type: DataTypes.DATE, allowNull: true },
}, {
  sequelize,
  modelName: 'Booking',
  indexes: [
    { fields: ['status'] },
    { fields: ['userId'] },
    { fields: ['hallId'] },
    { fields: ['startTime'] },
    { fields: ['paymentStatus'] }
  ]
});

export class BookingService extends Model {
  declare id: number;
  declare bookingId: number;
  declare serviceId: number;
  declare requested_quantity: number;
  declare unit_price: number;
}

BookingService.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: false },
  serviceId: { type: DataTypes.INTEGER, allowNull: false },
  requested_quantity: { type: DataTypes.INTEGER, defaultValue: 1 },
  unit_price: { type: DataTypes.FLOAT, allowNull: false }
}, { sequelize, modelName: 'BookingService', tableName: 'booking_services' });

// Relationships
Hall.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(Hall, { foreignKey: 'providerId', as: 'halls', constraints: false });

Service.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(Service, { foreignKey: 'providerId', as: 'providerServices', constraints: false });

Hall.hasMany(Booking, { foreignKey: 'hallId', as: 'bookings', constraints: false });
Booking.belongsTo(Hall, { foreignKey: 'hallId', as: 'hall', constraints: false });

Hall.hasMany(Service, { foreignKey: 'hallId', as: 'services', constraints: false });
Service.belongsTo(Hall, { foreignKey: 'hallId', as: 'hall', constraints: false });

Hall.hasMany(HallExtraServices, { foreignKey: 'hallId', as: 'extraServices', onDelete: 'CASCADE', constraints: false });
HallExtraServices.belongsTo(Hall, { foreignKey: 'hallId', as: 'hall', constraints: false });

Booking.hasMany(BookingService, { foreignKey: 'bookingId', as: 'bookingServices', constraints: false });
BookingService.belongsTo(Booking, { foreignKey: 'bookingId', constraints: false });

Service.hasMany(BookingService, { foreignKey: 'serviceId', constraints: false });
BookingService.belongsTo(Service, { foreignKey: 'serviceId', as: 'serviceInfo', constraints: false });

export class SupportServiceRequest extends Model {
  declare id: number;
  declare bookingId: number;
  declare customerName: string;
  declare providerName: string;
  declare serviceName: string;
  declare price: number;
  declare date: string;
  declare status: string;
  declare customerId: number | null;
  declare providerId: number | null;
  declare serviceId: number | null;
}

SupportServiceRequest.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: true },
  customerName: { type: DataTypes.STRING },
  providerName: { type: DataTypes.STRING },
  serviceName: { type: DataTypes.STRING },
  price: { type: DataTypes.FLOAT },
  date: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'قيد الانتظار' },
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  serviceId: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'SupportServiceRequest' });

export class InventoryItem extends Model {
  declare id: number;
  declare name: string;
  declare sku: string;
  declare itemType: 'rental' | 'sale' | 'staff' | 'general';
  declare operationalStatus: 'active' | 'maintenance' | 'out_of_service' | 'retired';
  declare linkedType: 'service' | 'hall_addon' | 'none';
  declare linkedId: string | number | null;
  declare totalQuantity: number;
  declare currentStock: number;
  declare reservedQuantity: number;
  declare damagedQuantity: number;
  declare reorderLevel: number;
  declare unit: string;
  declare cost: number;
  declare supplier: string;
  declare supplierId: number | null;
  declare providerId: number | null;
  declare providerName: string | null;
  declare lastUpdated: string;
  declare notes: string | null;
}

InventoryItem.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  sku: { type: DataTypes.STRING },
  itemType: { type: DataTypes.STRING, defaultValue: 'general' },
  operationalStatus: { type: DataTypes.STRING, defaultValue: 'active' },
  linkedType: { type: DataTypes.STRING, defaultValue: 'none' },
  linkedId: { type: DataTypes.STRING, allowNull: true },
  totalQuantity: { type: DataTypes.INTEGER, defaultValue: 100 },
  currentStock: { type: DataTypes.INTEGER, defaultValue: 0 },
  reservedQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  damagedQuantity: { type: DataTypes.INTEGER, defaultValue: 0 },
  reorderLevel: { type: DataTypes.INTEGER, defaultValue: 0 },
  unit: { type: DataTypes.STRING, defaultValue: 'قطعة' },
  cost: { type: DataTypes.FLOAT, defaultValue: 0 },
  supplier: { type: DataTypes.STRING },
  supplierId: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  providerName: { type: DataTypes.STRING, allowNull: true },
  lastUpdated: { type: DataTypes.STRING },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, modelName: 'InventoryItem' });

export class Supplier extends Model {
  declare id: number;
  declare name: string;
  declare cr: string;
  declare phone: string;
  declare email: string;
  declare city: string;
  declare address: string | null;
  declare category: string | null;
  declare paymentTerms: string | null;
  declare totalOrders: number;
  declare totalPaid: number;
  declare pendingBalance: number;
  declare rating: number;
  declare providerId: number | null;
  declare providerName: string | null;
  declare userId: number | null;
}

Supplier.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  cr: { type: DataTypes.STRING },
  phone: { type: DataTypes.STRING },
  email: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  address: { type: DataTypes.STRING, allowNull: true },
  category: { type: DataTypes.STRING, defaultValue: 'عام' },
  paymentTerms: { type: DataTypes.STRING, defaultValue: 'دفع فوري (كاش)' },
  totalOrders: { type: DataTypes.INTEGER, defaultValue: 0 },
  totalPaid: { type: DataTypes.FLOAT, defaultValue: 0 },
  pendingBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
  rating: { type: DataTypes.FLOAT, defaultValue: 5.0 },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  providerName: { type: DataTypes.STRING, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'Supplier' });

export class InventoryLog extends Model {
  declare id: number;
  declare inventoryItemId: number;
  declare itemName: string;
  declare type: 'usage' | 'restock' | 'damage' | 'variance' | 'status_change';
  declare quantityChanged: number;
  declare reason: string;
  declare costImpact: number;
  declare performedBy: string;
  declare providerId: number | null;
  declare providerName: string | null;
}

InventoryLog.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  inventoryItemId: { type: DataTypes.INTEGER, allowNull: false },
  itemName: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, defaultValue: 'usage' },
  quantityChanged: { type: DataTypes.INTEGER, defaultValue: 0 },
  reason: { type: DataTypes.STRING },
  costImpact: { type: DataTypes.FLOAT, defaultValue: 0 },
  performedBy: { type: DataTypes.STRING },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  providerName: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, modelName: 'InventoryLog' });

export class SupplierInvoice extends Model {
  declare id: number;
  declare supplierId: number;
  declare supplierName: string;
  declare invoiceNumber: string;
  declare poNumber: string;
  declare amount: number;
  declare matchingStatus: 'matched' | 'variance' | 'pending_audit';
  declare paymentStatus: 'paid' | 'partial' | 'unpaid';
  declare notes: string;
  declare providerId: number | null;
  declare providerName: string | null;
  declare date: string;
}

SupplierInvoice.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  supplierId: { type: DataTypes.INTEGER, allowNull: false },
  supplierName: { type: DataTypes.STRING, allowNull: false },
  invoiceNumber: { type: DataTypes.STRING, allowNull: false },
  poNumber: { type: DataTypes.STRING },
  amount: { type: DataTypes.FLOAT, defaultValue: 0 },
  matchingStatus: { type: DataTypes.STRING, defaultValue: 'matched' },
  paymentStatus: { type: DataTypes.STRING, defaultValue: 'unpaid' },
  notes: { type: DataTypes.TEXT },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  providerName: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.STRING }
}, { sequelize, modelName: 'SupplierInvoice' });

export class ForceMajeureRequest extends Model {
  declare id: number;
  declare bookingId: number;
  declare customerName: string;
  declare customerPhone: string;
  declare customerEmail: string;
  declare reason: string;
  declare documents: string; // JSON string of urls
  declare status: string; // 'pending' | 'approved' | 'rejected'
  declare adminNotes: string;
  declare amountRefunded: number;
  declare refundType: string; // 'credit_held' | 'cash' | 'none'
  declare resolvedAt: Date | null;
  declare customerId: number | null;
}

ForceMajeureRequest.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  customerPhone: { type: DataTypes.STRING, allowNull: false },
  customerEmail: { type: DataTypes.STRING, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  documents: { type: DataTypes.TEXT, defaultValue: '[]' },
  status: { type: DataTypes.STRING, defaultValue: 'pending' },
  adminNotes: { type: DataTypes.TEXT, defaultValue: '' },
  amountRefunded: { type: DataTypes.FLOAT, defaultValue: 0 },
  refundType: { type: DataTypes.STRING, defaultValue: 'none' },
  resolvedAt: { type: DataTypes.DATE, allowNull: true },
  customerId: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'ForceMajeureRequest' });

export async function syncBookingModels() {
  const syncTable = async (model: any) => {
    try {
      if (model.name === 'Booking') {
        try {
          if (sequelize.getDialect() === 'postgres') {
            await sequelize.query(`ALTER TABLE "${Booking.tableName}" ALTER COLUMN "status" TYPE VARCHAR(255) USING "status"::varchar;`).catch(() => {});
          }
        } catch (eEnum: any) {
          // Non-blocking enum migration
        }
      }
      if (model.name === 'BookingService') {
        try {
          // Get all booking IDs and service IDs that actually exist in the database
          const existingBookings = await Booking.findAll({ attributes: ['id'], raw: true });
          const existingServices = await Service.findAll({ attributes: ['id'], raw: true });
          
          const bookingIds = new Set(existingBookings.map((b: any) => b.id));
          const serviceIds = new Set(existingServices.map((s: any) => s.id));
          
          // Get all BookingService rows currently present
          const allBookingServices = await BookingService.findAll({ raw: true });
          
          // Filter out rows where parent objects do not exist
          const orphanedIds = allBookingServices
            .filter((bs: any) => !bookingIds.has(bs.bookingId) || !serviceIds.has(bs.serviceId))
            .map((bs: any) => bs.id);
            
          if (orphanedIds.length > 0) {
            console.log(`🧹 Found ${orphanedIds.length} orphaned BookingService rows violating foreign key constraints. Cleaning up...`);
            await BookingService.destroy({
              where: {
                id: orphanedIds
              }
            });
            console.log("✅ Custom cleanup of orphaned BookingService records finished successfully!");
          }
        } catch (cleanupErr: any) {
          console.warn("⚠️ Safe BookingService pre-sync cleanup skipped (tables or columns might not exist yet):", cleanupErr.message || cleanupErr);
        }
      }
      await model.sync();
      try {
        await model.sync({ alter: { drop: false } });
      } catch (e: any) {
        // Table synced successfully via model.sync(); dynamic schema alterations handle missing columns below.
      }
    } catch (err: any) {
      console.warn(`Sync table ${model.name} fallback:`, err.message || err);
      try {
        await model.sync();
      } catch (err2: any) {}
    }
  };

  // Sync sequentially to preserve primary/foreign key ordering constraints perfectly
  await syncTable(Hall);
  await syncTable(HallExtraServices);
  await syncTable(Service);

  // Dynamic migration: Ensure 'unit', 'unitPrice' and 'cancellationPeriod' columns exist dynamically
  try {
    const queryInterface = sequelize.getQueryInterface();
    
    // Check Hall table
    try {
      const hallTableInfo = await queryInterface.describeTable(Hall.tableName);
      if (!hallTableInfo.cancellationPeriod) {
        console.log(`Adding 'cancellationPeriod' column dynamically to ${Hall.tableName}...`);
        await queryInterface.addColumn(Hall.tableName, 'cancellationPeriod', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
        console.log(`Column 'cancellationPeriod' added successfully to ${Hall.tableName}.`);
      }
      if (!hallTableInfo.providerId) {
        console.log(`Adding 'providerId' column dynamically to ${Hall.tableName}...`);
        await queryInterface.addColumn(Hall.tableName, 'providerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
        console.log(`Column 'providerId' added successfully to ${Hall.tableName}.`);
      } else if (!hallTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Hall.tableName}...`);
        try {
          await sequelize.query(`ALTER TABLE "${Hall.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF("providerId", '')::integer`);
          console.log(`Column 'providerId' altered successfully to INTEGER.`);
        } catch (alterErr: any) {
          console.warn(`Could not alter 'providerId' column type to INTEGER via query:`, alterErr.message || alterErr);
          try {
            await queryInterface.changeColumn(Hall.tableName, 'providerId', {
              type: DataTypes.INTEGER,
              allowNull: true
            });
          } catch (alterErr2: any) {
            console.error(`Failed to alter 'providerId' column to INTEGER:`, alterErr2.message || alterErr2);
          }
        }
      }
      if (!hallTableInfo.bookingType) {
        console.log(`Adding 'bookingType' column dynamically to ${Hall.tableName}...`);
        await queryInterface.addColumn(Hall.tableName, 'bookingType', {
          type: DataTypes.STRING,
          defaultValue: 'alacarte',
          allowNull: true
        });
        console.log(`Column 'bookingType' added successfully to ${Hall.tableName}.`);
      }
      if (!hallTableInfo.packagesList) {
        console.log(`Adding 'packagesList' column dynamically to ${Hall.tableName}...`);
        await queryInterface.addColumn(Hall.tableName, 'packagesList', {
          type: DataTypes.TEXT,
          defaultValue: '[]',
          allowNull: true
        });
        console.log(`Column 'packagesList' added successfully to ${Hall.tableName}.`);
      }
      if (!hallTableInfo.taxExempt) {
        await queryInterface.addColumn(Hall.tableName, 'taxExempt', {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: true
        });
      }
      if (!hallTableInfo.paymentMethod) {
        await queryInterface.addColumn(Hall.tableName, 'paymentMethod', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!hallTableInfo.pledgeAccepted) {
        await queryInterface.addColumn(Hall.tableName, 'pledgeAccepted', {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: true
        });
      }
      if (!hallTableInfo.crImage) {
        await queryInterface.addColumn(Hall.tableName, 'crImage', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!hallTableInfo.ibanImage) {
        await queryInterface.addColumn(Hall.tableName, 'ibanImage', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!hallTableInfo.taxCertificateImage) {
        await queryInterface.addColumn(Hall.tableName, 'taxCertificateImage', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!hallTableInfo.zakatCertificateImage) {
        await queryInterface.addColumn(Hall.tableName, 'zakatCertificateImage', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!hallTableInfo.tourismLicenseImage) {
        await queryInterface.addColumn(Hall.tableName, 'tourismLicenseImage', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!hallTableInfo.activationStatus) {
        console.log(`Adding 'activationStatus' column dynamically to ${Hall.tableName}...`);
        await queryInterface.addColumn(Hall.tableName, 'activationStatus', {
          type: DataTypes.STRING,
          defaultValue: 'مفعل',
          allowNull: true
        });
        console.log(`Column 'activationStatus' added successfully to ${Hall.tableName}.`);
      }
    } catch (hallColErr: any) {
      console.warn(`Could not verify/add columns dynamically for ${Hall.tableName}:`, hallColErr.message || hallColErr);
    }

    // Check Service table
    try {
      const serviceTableInfo = await queryInterface.describeTable(Service.tableName);
      if (!serviceTableInfo.unit) {
        console.log(`Adding 'unit' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'unit', {
          type: DataTypes.STRING,
          defaultValue: 'مرة واحدة',
          allowNull: true
        });
        console.log(`Column 'unit' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.unitPrice) {
        console.log(`Adding 'unitPrice' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'unitPrice', {
          type: DataTypes.FLOAT,
          defaultValue: 0,
          allowNull: true
        });
        console.log(`Column 'unitPrice' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.cancellationPeriod) {
        console.log(`Adding 'cancellationPeriod' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'cancellationPeriod', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
        console.log(`Column 'cancellationPeriod' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.providerId) {
        console.log(`Adding 'providerId' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'providerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
        console.log(`Column 'providerId' added successfully to ${Service.tableName}.`);
      } else if (!serviceTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Service.tableName}...`);
        try {
          await sequelize.query(`ALTER TABLE "${Service.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF("providerId", '')::integer`);
          console.log(`Column 'providerId' altered successfully to INTEGER.`);
        } catch (alterErr: any) {
          console.warn(`Could not alter 'providerId' column type to INTEGER via query:`, alterErr.message || alterErr);
          try {
            await queryInterface.changeColumn(Service.tableName, 'providerId', {
              type: DataTypes.INTEGER,
              allowNull: true
            });
          } catch (alterErr2: any) {
            console.error(`Failed to alter 'providerId' column to INTEGER:`, alterErr2.message || alterErr2);
          }
        }
      }

      if (!serviceTableInfo.showProviderToCustomers) {
        console.log(`Adding 'showProviderToCustomers' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'showProviderToCustomers', {
          type: DataTypes.BOOLEAN,
          defaultValue: false,
          allowNull: true
        });
        console.log(`Column 'showProviderToCustomers' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.classification) {
        console.log(`Adding 'classification' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'classification', {
          type: DataTypes.STRING,
          allowNull: true
        });
        console.log(`Column 'classification' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.activationStatus) {
        console.log(`Adding 'activationStatus' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'activationStatus', {
          type: DataTypes.STRING,
          defaultValue: 'مفعل',
          allowNull: true
        });
        console.log(`Column 'activationStatus' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.status) {
        console.log(`Adding 'status' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'status', {
          type: DataTypes.STRING,
          defaultValue: 'approved',
          allowNull: true
        });
        console.log(`Column 'status' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.adminStatus) {
        console.log(`Adding 'adminStatus' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'adminStatus', {
          type: DataTypes.STRING,
          defaultValue: 'approved',
          allowNull: true
        });
        console.log(`Column 'adminStatus' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.serviceStatus) {
        console.log(`Adding 'serviceStatus' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'serviceStatus', {
          type: DataTypes.STRING,
          defaultValue: 'نشط',
          allowNull: true
        });
        console.log(`Column 'serviceStatus' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.taxonomyType) {
        console.log(`Adding 'taxonomyType' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'taxonomyType', {
          type: DataTypes.STRING,
          defaultValue: 'rental',
          allowNull: true
        });
        console.log(`Column 'taxonomyType' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.packages) {
        console.log(`Adding 'packages' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'packages', {
          type: DataTypes.TEXT,
          defaultValue: '[]',
          allowNull: true
        });
        console.log(`Column 'packages' added successfully to ${Service.tableName}.`);
      }

      if (!serviceTableInfo.addons) {
        console.log(`Adding 'addons' column dynamically to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'addons', {
          type: DataTypes.TEXT,
          defaultValue: '[]',
          allowNull: true
        });
        console.log(`Column 'addons' added successfully to ${Service.tableName}.`);
      }
    } catch (serviceColErr: any) {
      console.warn(`Could not verify/add columns dynamically for ${Service.tableName}:`, serviceColErr.message || serviceColErr);
    }

    // Check Booking table
    try {
      const bookingTableInfo = await queryInterface.describeTable(Booking.tableName);
      if (!bookingTableInfo.userId) {
        console.log(`Adding 'userId' column dynamically to ${Booking.tableName}...`);
        await queryInterface.addColumn(Booking.tableName, 'userId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
        console.log(`Column 'userId' added successfully to ${Booking.tableName}.`);
      }
      if (!bookingTableInfo.customerEmail) {
        console.log(`Adding 'customerEmail' column dynamically to ${Booking.tableName}...`);
        await queryInterface.addColumn(Booking.tableName, 'customerEmail', {
          type: DataTypes.STRING,
          allowNull: true
        });
        console.log(`Column 'customerEmail' added successfully to ${Booking.tableName}.`);
      }
      if (!bookingTableInfo.bookingType) {
        await queryInterface.addColumn(Booking.tableName, 'bookingType', {
          type: DataTypes.STRING,
          defaultValue: 'alacarte',
          allowNull: true
        });
      }
      if (!bookingTableInfo.packageName) {
        await queryInterface.addColumn(Booking.tableName, 'packageName', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!bookingTableInfo.selectedAddons) {
        await queryInterface.addColumn(Booking.tableName, 'selectedAddons', {
          type: DataTypes.TEXT,
          defaultValue: '[]',
          allowNull: true
        });
      }
      if (!bookingTableInfo.externalServices) {
        await queryInterface.addColumn(Booking.tableName, 'externalServices', {
          type: DataTypes.TEXT,
          defaultValue: '[]',
          allowNull: true
        });
      }
      if (!bookingTableInfo.subTotal) {
        await queryInterface.addColumn(Booking.tableName, 'subTotal', {
          type: DataTypes.FLOAT,
          defaultValue: 0,
          allowNull: true
        });
      }
      if (!bookingTableInfo.taxAmount) {
        await queryInterface.addColumn(Booking.tableName, 'taxAmount', {
          type: DataTypes.FLOAT,
          defaultValue: 0,
          allowNull: true
        });
      }
      if (!bookingTableInfo.depositAmount) {
        await queryInterface.addColumn(Booking.tableName, 'depositAmount', {
          type: DataTypes.FLOAT,
          defaultValue: 0,
          allowNull: true
        });
      }
      if (!bookingTableInfo.paymentMethod) {
        await queryInterface.addColumn(Booking.tableName, 'paymentMethod', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!bookingTableInfo.paymentStatus) {
        await queryInterface.addColumn(Booking.tableName, 'paymentStatus', {
          type: DataTypes.STRING,
          defaultValue: 'pending',
          allowNull: true
        });
      }
      if (!bookingTableInfo.paymentDeadline) {
        console.log(`Adding 'paymentDeadline' column dynamically to ${Booking.tableName}...`);
        await queryInterface.addColumn(Booking.tableName, 'paymentDeadline', {
          type: DataTypes.DATE,
          allowNull: true
        });
        console.log(`Column 'paymentDeadline' added successfully to ${Booking.tableName}.`);
      }
    } catch (bookingColErr: any) {
      console.warn(`Could not verify/add columns dynamically for ${Booking.tableName}:`, bookingColErr.message || bookingColErr);
    }

    // Check InventoryItem, Supplier, SupplierInvoice, InventoryLog for providerId column type
    const modelsToFixProviderId = [
      { model: InventoryItem, name: InventoryItem.tableName },
      { model: Supplier, name: Supplier.tableName },
      { model: SupplierInvoice, name: SupplierInvoice.tableName },
      { model: InventoryLog, name: InventoryLog.tableName }
    ];

    for (const item of modelsToFixProviderId) {
      try {
        const tableInfo = await queryInterface.describeTable(item.name);
        if (!tableInfo.providerId) {
          console.log(`Adding 'providerId' column dynamically to ${item.name}...`);
          await queryInterface.addColumn(item.name, 'providerId', {
            type: DataTypes.INTEGER,
            allowNull: true
          });
        } else if (!tableInfo.providerId.type.toLowerCase().includes('int')) {
          console.log(`Altering 'providerId' column type to INTEGER in ${item.name}...`);
          if (sequelize.getDialect() === 'postgres') {
            await sequelize.query(`ALTER TABLE "${item.name}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId"::text, '[^0-9]', '', 'g'), '')::integer`);
          }
        }
      } catch (err: any) {
        console.warn(`Could not alter providerId for ${item.name}:`, err.message || err);
      }
    }
  } catch (colErr: any) {
    console.warn(`Could not run dynamic migration checks:`, colErr.message || colErr);
  }

  await syncTable(Booking);
  await syncTable(BookingService);
  await syncTable(SupportServiceRequest);
  await syncTable(InventoryItem);
  await syncTable(Supplier);
  await syncTable(ForceMajeureRequest);

  // Seed sample data if empty or missing images (self-healing for previous empty seeds)
  const count = await Hall.count();
  const emptyImgCount = await Hall.count({ where: { image: null } });
  if (count === 0 || emptyImgCount > 0) {
    if (count > 0) {
      await Hall.destroy({ where: {}, force: true });
    }
    await Hall.bulkCreate([
      { 
        id: 1, 
        name: 'قاعة اللؤلؤة الملكية', 
        type: 'قاعة أفراح', 
        capacity: 500, 
        hourlyRate: 15000, 
        status: 'مفعل', 
        city: 'الرياض', 
        category: 'قاعة أفراح', 
        price: 15000, 
        rating: 4.9, 
        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=1600&q=80', 
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80',
          'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80',
          'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80'
        ]), 
        location: 'الرياض - حي الياسمين، شارع الأمير محمد بن سلمان', 
        provider: 'مجموعة قاعات الرياض', 
        description: 'قاعة فاخرة بتصميم مستوحى من العمارة الأندلسية. تتسع لأكثر من 500 ضيف، مع إضاءة كريستالية وكوشة ملكية وممرات مزينة بالورود الطبيعية.', 
        features: JSON.stringify(['موقف خاص للسيارات', 'نظام صوتي احترافي', 'غرفة عروس', 'إضاءة LED', 'تكييف مركزي']), 
        rules: JSON.stringify(['عدم إدخال المأكولات والمشروبات من الخارج', 'الالتزام بموعد الخروج المتفق عليه', 'المسؤولية الكاملة عن المقتنيات الشخصية']), 
        contractTerms: 'يتم تأكيد الحجز بدفع 30% مقدماً، ويسدد المبلغ المتبقي قبل المناسبة بأسبوع. يتم إلغاء الحجز قبل 14 يوماً مع استرداد 50% من المقدم.', 
        featured: true, 
        nightPrice: 15000, 
        morningPrice: 9000, 
        fullDayPrice: 22000,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 2, 
        name: 'استراحة النخيل', 
        type: 'استراحة قسمين', 
        capacity: 100, 
        hourlyRate: 2500, 
        status: 'مفعل', 
        city: 'جدة', 
        category: 'استراحة قسمين', 
        price: 2500, 
        rating: 4.5, 
        image: 'https://images.unsplash.com/photo-1565552643952-b4306354dd95?w=1600&q=80', 
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1565552643952-b4306354dd95?w=800&q=80',
          'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&q=80'
        ]), 
        location: 'جدة - أبحر الشمالية', 
        provider: 'شركة النخيل للاستثمارات', 
        description: 'استراحة النخيل توفر لك ولعائلتك أجواء رائعة مع مسبح مفلتر ومجالس واسعة وألعاب أطفال.', 
        features: JSON.stringify(['مسبح خاص', 'منطقة ألعاب', 'مطبخ متكامل', 'جلسات خارجية', 'شواية']), 
        rules: JSON.stringify(['عدم إزعاج الجيران', 'الخروج الساعة 2 صباحاً']), 
        contractTerms: 'دفع نصف المبلغ كعربون والباقي عند الدخول. تأمين 500 ريال.', 
        featured: false, 
        nightPrice: 2500, 
        morningPrice: 1500, 
        fullDayPrice: 3500,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 3, 
        name: 'شاليهات الغروب', 
        type: 'شاليه', 
        capacity: 20, 
        hourlyRate: 1200, 
        status: 'مفعل', 
        city: 'الدمام', 
        category: 'شاليه', 
        price: 1200, 
        rating: 4.7, 
        image: 'https://images.unsplash.com/photo-1626244516315-736025d2ce6b?w=1600&q=80', 
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1626244516315-736025d2ce6b?w=800&q=80',
          'https://images.unsplash.com/photo-1610641818989-c2051b5e2cfd?w=800&q=80'
        ]), 
        location: 'الدمام - حي الشاطئ', 
        provider: 'بوكينج ديزاين', 
        description: 'شاليهات الغروب تتميز بإطلالتها على البحر ومرافقها الحديثة وتوفر الراحة والاستجمام.', 
        features: JSON.stringify(['إطلالة بحرية', 'مسبح مغلق', 'غرفة نوم ماستر', 'انترنت مجاني']), 
        rules: JSON.stringify(['ممنوع اصطحاب الحيوانات الأليفة', 'المحافظة على نظافة المسبح']), 
        contractTerms: 'يُدفع المبلغ كاملاً لتأكيد الحجز. لا يمكن استرداد المبلغ قبل أقل من 3 أيام من الموعد.', 
        featured: false, 
        nightPrice: 1200, 
        morningPrice: 720, 
        fullDayPrice: 1800,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 4, 
        name: 'قاعة امسيتي', 
        type: 'قاعة أفراح', 
        capacity: 400, 
        hourlyRate: 12000, 
        status: 'مفعل', 
        city: 'الرياض', 
        category: 'قاعة أفراح', 
        price: 12000, 
        rating: 4.8, 
        image: 'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=1600&q=80', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&q=80']), 
        location: 'الرياض - الدائري الشمالي', 
        provider: 'أمسيتي المحدودة', 
        description: 'قاعة أنيقة بطابع عصري تلائم جميع مناسباتكم مع خدمة فندقية ممتازة.', 
        features: JSON.stringify(['تكييف مركزي', 'موقف خاص للسيارات', 'مصعد ضيوف', 'مقدمات ضيافة']), 
        rules: JSON.stringify(['عدم إدخال المأكولات والمشروبات من الخارج', 'الالتزام بموعد الخروج المعتمد']), 
        contractTerms: 'العربون 30٪ والباقي قبل موعد الحفلة. توجد باقات استرداد مرنة.', 
        featured: true, 
        nightPrice: 12000, 
        morningPrice: 7200, 
        fullDayPrice: 18000,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 5, 
        name: 'درة الليالي', 
        type: 'قاعة أفراح', 
        capacity: 800, 
        hourlyRate: 20000, 
        status: 'مفعل', 
        city: 'مكة المكرمة', 
        category: 'قاعة أفراح', 
        price: 20000, 
        rating: 4.9, 
        image: 'https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=1600&q=80', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1549488344-1f9b8d2bd1f3?w=800&q=80']), 
        location: 'مكة - العوالي', 
        provider: 'أفراح مكة', 
        description: 'قبة ضخمة وساحات واسعة لاستقبال ضيوفكم من كبار الشخصيات مع أرقى مستوى من البوفيه والضيافة.', 
        features: JSON.stringify(['مواقف سيارات واسعة', 'أجنحة لكبار الشخصيات', 'أقسام منفصلة بالكامل', 'بوفيه عالمي']), 
        rules: JSON.stringify(['عدم استخدام مواد تضر بالديكورات', 'الحفاظ على الهدوء في الممرات']), 
        contractTerms: 'دفع 50٪ لتأكيد الحجز. الشرط الجزائي 20٪ في حالة الإلغاء.', 
        featured: true, 
        nightPrice: 20000, 
        morningPrice: 12000, 
        fullDayPrice: 30000,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 6, 
        name: 'استراحة السعادة', 
        type: 'استراحة قسم', 
        capacity: 50, 
        hourlyRate: 1500, 
        status: 'مفعل', 
        city: 'الطائف', 
        category: 'استراحة قسم', 
        price: 1500, 
        rating: 4.2, 
        image: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1600&q=80', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=800&q=80']), 
        location: 'الطائف - الحوية', 
        provider: 'أبو فهد', 
        description: 'استراحة وسط الطبيعة، توفر مسطحات خضراء وجو لطيف، مثالية للجمعات العائلية البسيطة والشبابية.', 
        features: JSON.stringify(['ملعب كرة طائرة', 'بيت شعر', 'مسطحات خضراء', 'مرافق شواء']), 
        rules: JSON.stringify(['احترام مواعيد الدخول والخروج', 'الحفاظ على نظافة المكان عند المغادرة']), 
        contractTerms: 'الدفع عند الوصول. تأمين 300 ريال.', 
        featured: false, 
        nightPrice: 1500, 
        morningPrice: 900, 
        fullDayPrice: 2200,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 10, 
        name: 'قاعة الجوهرة الجديدة', 
        type: 'قاعة أفراح', 
        capacity: 500, 
        hourlyRate: 18000, 
        status: 'مفعل', 
        city: 'الرياض', 
        category: 'قاعة أفراح', 
        price: 18000, 
        rating: 5.0, 
        image: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=1600&q=80', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80']), 
        location: 'الرياض - الملقا', 
        provider: 'الجوهرة', 
        description: 'من أحدث قاعات الرياض بتكنولوجيا إضاءة مبهرة.', 
        features: JSON.stringify(['إضاءة ليزر', 'نظام صوتي خارق', 'صالات انتظار فخمة']), 
        rules: JSON.stringify(['الالتزام بنظافة الصالات والمطابخ والحد الأقصى للمدعوين']), 
        contractTerms: 'دفع 30% كعربون. الإلغاء قبل شهر من الموعد.', 
        featured: false, 
        nightPrice: 18000, 
        morningPrice: 10800, 
        fullDayPrice: 27000,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 11, 
        name: 'شاليهات أوشن بارك', 
        type: 'شاليه', 
        capacity: 15, 
        hourlyRate: 1500, 
        status: 'مفعل', 
        city: 'جدة', 
        category: 'شاليه', 
        price: 1500, 
        rating: 4.5, 
        image: 'https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=1600&q=80', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800&q=80']), 
        location: 'جدة - الكورنيش', 
        provider: 'أوشن أمواج', 
        description: 'تصميم بحري متميز ومسبح ألعاب مائية للأطفال.', 
        features: JSON.stringify(['ألعاب مائية', 'شرفة على البحر', 'واي فاي']), 
        rules: JSON.stringify(['يمنع إشعال النار على الشرفة']), 
        contractTerms: 'عربون 50%، والباقي عند الوصول', 
        featured: false, 
        nightPrice: 1500, 
        morningPrice: 900, 
        fullDayPrice: 2250,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      },
      { 
        id: 12, 
        name: 'استراحة الواحة الهادئة', 
        type: 'استراحة قسمين', 
        capacity: 70, 
        hourlyRate: 800, 
        status: 'مفعل', 
        city: 'بريدة', 
        category: 'استراحة قسمين', 
        price: 800, 
        rating: 4.8, 
        image: 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1600&q=80', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1449844908441-8829872d2607?w=800&q=80']), 
        location: 'بريدة - حي الريان', 
        provider: 'مكتب الواحة', 
        description: 'واحتك للهدوء والاسترخاء مع مجالس تراثية وساحات عشبية.', 
        features: JSON.stringify(['مجالس تراثية', 'دكات خارجية', 'مسطحات خضراء']), 
        rules: JSON.stringify(['عدم رفع الصوت بعد منتصف الليل']), 
        contractTerms: 'الدفع عند الوصول. تأمين 300 ريال.', 
        featured: false, 
        nightPrice: 800, 
        morningPrice: 480, 
        fullDayPrice: 1200,
        bookingStatus: 'متاح',
        activationStatus: 'مفعل'
      }
    ]);
  }

  const sCount = await Service.count();
  const emptyServiceImgCount = await Service.count({ where: { images: null } });
  if (sCount === 0 || emptyServiceImgCount > 0) {
    if (sCount > 0) {
      await Service.destroy({ where: {}, force: true });
    }
    await Service.bulkCreate([
      { 
        id: 1, 
        hallId: 1, 
        name: 'بوفيه مفتوح (VIP)', 
        description: 'بوفيه فاخر يشمل جميع الأصناف بتقديم مميز لحفلات الزفاف والمناسبات', 
        quantity: null, 
        price: 350, 
        provider: 'شركة أطياف لتنظيم المعارض', 
        regions: 'الرياض، جدة', 
        cities: 'الرياض، الخرج، جدة', 
        terms: 'الحجز المسبق قبل 48 ساعة\nدفع عربون 50%', 
        serviceStatus: 'نشط', 
        adminStatus: 'فعالة', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1555244162-803834f70033?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']), 
        hostName: 'شركة أطياف لتنظيم المعارض' 
      },
      { 
        id: 2, 
        hallId: 1, 
        name: 'تصوير فوتوغرافي وفيديو', 
        description: 'تغطية كاملة للمناسبة بطاقم مصورين احترافي', 
        quantity: 5, 
        price: 5000, 
        provider: 'سالم الدوسري', 
        regions: 'الرياض', 
        cities: 'الرياض', 
        terms: 'دفع كامل المبلغ قبل المناسبة', 
        serviceStatus: 'نشط', 
        adminStatus: 'فعالة', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']), 
        hostName: 'سالم الدوسري' 
      },
      { 
        id: 3, 
        hallId: 2, 
        name: 'تنسيق زهور', 
        description: 'تنسيق كوشة وطاولات الضيوف بزهور طبيعية', 
        quantity: null, 
        price: 2000, 
        provider: 'سالم الدوسري', 
        regions: 'مكة المكرمة', 
        cities: 'مكة', 
        terms: 'لا يتم إرجاع العربون عند الإلغاء', 
        serviceStatus: 'نشط', 
        adminStatus: 'فعالة', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3']), 
        hostName: 'سالم الدوسري' 
      },
      { 
        id: 4, 
        hallId: 2, 
        name: 'ألحان المناسبات', 
        description: 'إحياء مناسبتك بأفضل الفرق الغنائية', 
        quantity: 1, 
        price: 5000, 
        provider: 'فرقة الألحان الذهبية', 
        regions: 'الرياض', 
        cities: 'الرياض', 
        terms: 'توفير مسرح مجهز', 
        serviceStatus: 'نشط', 
        adminStatus: 'فعالة', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1470229722913-7c090be5f524?w=800&q=80']), 
        hostName: 'فرقة الألحان الذهبية' 
      },
      { 
        id: 5, 
        hallId: 3, 
        name: 'روز لتنسيق الورد', 
        description: 'كوش فاخرة وتنسيقات ورد طبيعي', 
        quantity: null, 
        price: 2000, 
        provider: 'مؤسسة روز للزهور', 
        regions: 'المنطقة الشرقية', 
        cities: 'الدمام، الخبر', 
        terms: '', 
        serviceStatus: 'نشط', 
        adminStatus: 'فعالة', 
        images: JSON.stringify(['https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80']), 
        hostName: 'مؤسسة روز للزهور' 
      }
    ]);
  }

  // Seed suppliers if empty
  const supplierCount = await Supplier.count();
  if (supplierCount === 0) {
    await Supplier.bulkCreate([
      { id: 1, name: 'مكتبة جرير', cr: '1010112233', phone: '0501112222', email: 'sales@jarir.com', city: 'الرياض' },
      { id: 2, name: 'الشركة العربية للحاسبات', cr: '1010334455', phone: '0503334444', email: 'info@arabcomputers.sa', city: 'جدة' },
      { id: 3, name: 'مصنع البلاستيك الوطني', cr: '1010556677', phone: '0505556666', email: 'orders@natpack.com.sa', city: 'الدمام' }
    ]);
  }

  // Seed inventory if empty
  const inventoryCount = await InventoryItem.count();
  if (inventoryCount === 0) {
    await InventoryItem.bulkCreate([
      { id: 1, name: 'ورق طباعة A4', sku: 'PR-100', currentStock: 50, reorderLevel: 20, supplier: 'مكتبة جرير', cost: 15, lastUpdated: '2023-10-25' },
      { id: 2, name: 'حبر طابعة أسود', sku: 'INK-B20', currentStock: 5, reorderLevel: 10, supplier: 'الشركة العربية للحاسبات', cost: 120, lastUpdated: '2023-10-20' },
      { id: 3, name: 'أكواب قهوة', sku: 'CUP-C50', currentStock: 200, reorderLevel: 50, supplier: 'مصنع البلاستيك الوطني', cost: 5, lastUpdated: '2023-11-01' },
      { id: 4, name: 'ضيافة كبار الشخصيات', sku: 'HOSP-VIP', currentStock: 15, reorderLevel: 20, supplier: 'حلويات سعد الدين', cost: 50, lastUpdated: '2023-11-05' }
    ]);
  }

  // Seed bookings if empty
  const bookingCount = await Booking.count();
  if (bookingCount === 0) {
    const today = new Date();
    const getOffsetDate = (daysOffset: number) => {
      const d = new Date(today);
      d.setDate(today.getDate() + daysOffset);
      return d;
    };
    await Booking.bulkCreate([
      { id: 101, customerName: 'أحمد عبدالله', customerPhone: '0501112233', hallId: 1, startTime: getOffsetDate(-30), endTime: getOffsetDate(-30), guests: 300, totalAmount: 20000, status: 'confirmed' },
      { id: 102, customerName: 'سارة الشمري', customerPhone: '0561234455', hallId: 2, startTime: getOffsetDate(-25), endTime: getOffsetDate(-25), guests: 150, totalAmount: 18000, status: 'confirmed' },
      { id: 103, customerName: 'فيصل العتيبي', customerPhone: '0504445566', hallId: 3, startTime: getOffsetDate(-20), endTime: getOffsetDate(-20), guests: 500, totalAmount: 28000, status: 'confirmed' },
      { id: 104, customerName: 'ليلى الشهري', customerPhone: '0533334455', hallId: 2, startTime: getOffsetDate(-15), endTime: getOffsetDate(-14), guests: 50, totalAmount: 4200, status: 'confirmed' },
      { id: 105, customerName: 'خالد الحربي', customerPhone: '0505557788', hallId: 4, startTime: getOffsetDate(-10), endTime: getOffsetDate(-10), guests: 100, totalAmount: 5500, status: 'confirmed' },
      { id: 109, customerName: 'عبدالله الغامدي', customerPhone: '0502221199', hallId: 2, startTime: getOffsetDate(-3), endTime: getOffsetDate(-3), guests: 200, totalAmount: 14000, status: 'pending' },
      { id: 114, customerName: 'جواهر آل سعود', customerPhone: '0500000001', hallId: 5, startTime: getOffsetDate(3), endTime: getOffsetDate(3), guests: 300, totalAmount: 18000, status: 'pending' }
    ]);
  }

  // Seed support service requests if empty
  const sReqCount = await SupportServiceRequest.count();
  if (sReqCount === 0) {
    await SupportServiceRequest.bulkCreate([
      { id: 1, bookingId: 101, customerName: 'أحمد عبدالله', providerName: 'شركة أطياف لتنظيم المعارض', serviceName: 'بوفيه مفتوح (VIP)', date: '2026-05-10', status: 'مكتمل', price: 3500 },
      { id: 2, bookingId: 102, customerName: 'سارة الشمري', providerName: 'شركة الضيافة الذهبية المحدودة', serviceName: 'مجموعة ضيافة ملكية فاخرة وصبابين مهيلين', date: '2026-05-15', status: 'مكتمل', price: 1500 },
      { id: 3, bookingId: 103, customerName: 'فيصل العتيبي', providerName: 'سالم الدوسري', serviceName: 'تصوير فوتوغرافي وفيديو', date: '2026-05-20', status: 'قيد الانتظار', price: 5000 },
      { id: 4, bookingId: 104, customerName: 'ليلى الشهري', providerName: 'شركة كوش الفخمة وتنسيق الأفراح والعقود', serviceName: 'تفصيل كوشة العروس المتميزة واضاءات الممر', date: '2026-05-21', status: 'قيد الانتظار', price: 6000 },
      { id: 5, bookingId: 105, customerName: 'خالد الحربي', providerName: 'مؤسسة المذاق العربي للحلويات والضيافة', serviceName: 'بوفيه مفتوح تراثي شعبي وأطباق سعودية', date: '2026-05-22', status: 'مكتمل', price: 2500 }
    ]);
  }
}
