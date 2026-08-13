import { Sequelize, DataTypes, Model } from 'sequelize';
import { sequelize } from './dbInstance.js';
import bcrypt from 'bcryptjs';

export class User extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare role: 'Admin' | 'Provider' | 'Marketer' | 'عميل' | 'مزود';
  declare password_hash?: string;
  declare phone?: string;
  declare region?: string;
  declare city?: string;
  declare addressDetails?: string;
  declare bankName?: string;
  declare iban?: string;
  declare commercialRecord?: string;
  declare status: string;
  declare avatarUrl?: string;
  declare image?: string;
  declare points: number;
  declare username?: string;
  declare showProviderToCustomers?: boolean;
}

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { 
    type: DataTypes.STRING, 
    allowNull: false, 
    unique: true,
    validate: {
      isEmail: {
        msg: 'البريد الإلكتروني غير صحيح، يرجى تقديم بريد إلكتروني بصيغة معتمدة (مثل: name@domain.com)'
      }
    },
    set(value: string) {
      if (typeof value === 'string') {
        this.setDataValue('email', value.trim().toLowerCase());
      } else {
        this.setDataValue('email', value);
      }
    }
  },
  role: { type: DataTypes.STRING, allowNull: false },
  password_hash: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING },
  region: { type: DataTypes.STRING },
  city: { type: DataTypes.STRING },
  addressDetails: { type: DataTypes.STRING },
  bankName: { type: DataTypes.STRING },
  iban: { type: DataTypes.STRING },
  commercialRecord: { type: DataTypes.STRING },
  status: { type: DataTypes.STRING, defaultValue: 'نشط' },
  avatarUrl: { type: DataTypes.STRING, allowNull: true },
  image: { type: DataTypes.STRING, allowNull: true },
  points: { type: DataTypes.INTEGER, defaultValue: 0, allowNull: false },
  username: { type: DataTypes.STRING, allowNull: true },
  showProviderToCustomers: { type: DataTypes.BOOLEAN, defaultValue: true, allowNull: true }
}, {
  sequelize,
  modelName: 'User',
  paranoid: true,
  indexes: [
    { unique: true, fields: ['email'] },
    { fields: ['role'] },
    { fields: ['status'] },
    { fields: ['points'] }
  ]
});

export class SystemSettings extends Model {
  declare id: number;
  declare is_email_otp_enabled: boolean;
  declare is_sms_otp_enabled: boolean;
}

SystemSettings.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  is_email_otp_enabled: { type: DataTypes.BOOLEAN, defaultValue: false },
  is_sms_otp_enabled: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'SystemSettings' });

export class PlatformConfig extends Model {
  declare key: string;
  declare value: string;
}

PlatformConfig.init({
  key: { type: DataTypes.STRING, primaryKey: true },
  value: { type: DataTypes.TEXT, allowNull: false }
}, { sequelize, modelName: 'PlatformConfig' });

export class PendingRegistration extends Model {
  declare id: number;
  declare name: string;
  declare email: string;
  declare phone: string;
  declare password_hash: string;
  declare role: string;
  declare otp_code: string;
  declare expires_at: Date;
  declare userId: number | null;
}

PendingRegistration.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  phone: { type: DataTypes.STRING, allowNull: false },
  password_hash: { type: DataTypes.STRING },
  role: { type: DataTypes.STRING, allowNull: false },
  otp_code: { type: DataTypes.STRING, allowNull: false },
  expires_at: { type: DataTypes.DATE, allowNull: false },
  userId: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'PendingRegistration' });

export class PendingProfileUpdate extends Model {
  declare id: string;
  declare userId: number;
  declare userEmail: string;
  declare userName: string;
  declare requestedByRole: string;
  declare status: 'pending' | 'needs_revision' | 'approved' | 'rejected';
  declare requestedChanges: object;
  declare currentValues: object;
  declare sensitiveFieldsChanged: string[];
  declare rejectionReason: string | null;
  declare notesThread: any[];
  declare reviewedBy: string | null;
  declare reviewedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PendingProfileUpdate.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  userEmail: { type: DataTypes.STRING, allowNull: true },
  userName: { type: DataTypes.STRING, allowNull: true },
  requestedByRole: { type: DataTypes.STRING, defaultValue: 'provider' },
  status: { type: DataTypes.STRING, defaultValue: 'pending', allowNull: false },
  requestedChanges: { type: DataTypes.JSON, allowNull: false },
  currentValues: { type: DataTypes.JSON, allowNull: false },
  sensitiveFieldsChanged: { type: DataTypes.JSON, allowNull: true },
  rejectionReason: { type: DataTypes.TEXT, allowNull: true },
  notesThread: { type: DataTypes.JSON, defaultValue: [], allowNull: true },
  reviewedBy: { type: DataTypes.STRING, allowNull: true },
  reviewedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  modelName: 'PendingProfileUpdate',
  tableName: 'pending_profile_updates',
  indexes: [
    { fields: ['userId'] },
    { fields: ['status'] }
  ]
});

export class ProfileDataHistory extends Model {
  declare id: string;
  declare userId: number;
  declare userEmail: string;
  declare changedBy: string;
  declare changeType: string;
  declare snapshot: object;
  declare changedFields: object;
  declare retentionDays: number;
  declare createdAt: Date;
}

ProfileDataHistory.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  userId: { type: DataTypes.INTEGER, allowNull: false },
  userEmail: { type: DataTypes.STRING, allowNull: true },
  changedBy: { type: DataTypes.STRING, allowNull: false, defaultValue: 'system' },
  changeType: { type: DataTypes.STRING, defaultValue: 'admin_approval' },
  snapshot: { type: DataTypes.JSON, allowNull: false },
  changedFields: { type: DataTypes.JSON, allowNull: false },
  retentionDays: { type: DataTypes.INTEGER, defaultValue: 365 },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'ProfileDataHistory',
  tableName: 'profile_data_histories',
  indexes: [
    { fields: ['userId'] },
    { fields: ['createdAt'] }
  ]
});

export async function syncUserModels() {
  // Dynamic migration: Ensure password_hash, avatarUrl, image, points exist in User's table BEFORE sequelize.sync()
  // to avoid index creation failures on columns that don't exist yet!
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable(User.tableName);
    if (!tableInfo.password_hash) {
      console.log(`Adding password_hash column to ${User.tableName}...`);
      await queryInterface.addColumn(User.tableName, 'password_hash', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log(`Column password_hash added successfully to ${User.tableName}.`);
    }
    if (!tableInfo.avatarUrl) {
      console.log(`Adding avatarUrl column to ${User.tableName}...`);
      await queryInterface.addColumn(User.tableName, 'avatarUrl', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log(`Column avatarUrl added successfully to ${User.tableName}.`);
    }
    if (!tableInfo.image) {
      console.log(`Adding image column to ${User.tableName}...`);
      await queryInterface.addColumn(User.tableName, 'image', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log(`Column image added successfully to ${User.tableName}.`);
    }
    if (!tableInfo.points) {
      console.log(`Adding points column to ${User.tableName}...`);
      await queryInterface.addColumn(User.tableName, 'points', {
        type: DataTypes.INTEGER,
        defaultValue: 0,
        allowNull: false
      });
      console.log(`Column points added successfully to ${User.tableName}.`);
    }
    if (!tableInfo.username) {
      console.log(`Adding username column to ${User.tableName}...`);
      await queryInterface.addColumn(User.tableName, 'username', {
        type: DataTypes.STRING,
        allowNull: true
      });
      console.log(`Column username added successfully to ${User.tableName}.`);
    }
    if (!tableInfo.showProviderToCustomers) {
      console.log(`Adding showProviderToCustomers column to ${User.tableName}...`);
      await queryInterface.addColumn(User.tableName, 'showProviderToCustomers', {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: true
      });
      console.log(`Column showProviderToCustomers added successfully to ${User.tableName}.`);
    }
  } catch (err: any) {
    console.log("Could not check/add columns dynamically before sync (this is normal if table does not exist yet):", err.message || err);
  }

  await sequelize.sync();

  // Ensure default SystemSettings exists
  const settings = await SystemSettings.findOne();
  if (!settings) {
    await SystemSettings.create({ is_email_otp_enabled: false, is_sms_otp_enabled: false });
  }

  // Pre-seed some default users if none exist (specifically kaab_b)
  try {
    const userCount = await User.count();
    const defaultPasswordHash = bcrypt.hashSync('123456', 10);
    if (userCount === 0) {
      await User.bulkCreate([
        {
          name: 'كعب العرابي',
          email: 'kaab909@gmail.com',
          role: 'مزود',
          phone: '+966551234567',
          password_hash: defaultPasswordHash,
          region: 'الرياض',
          city: 'الرياض',
          status: 'نشط'
        },
        {
          name: 'سارة الأحمد',
          email: 'sara@example.com',
          role: 'عميل',
          phone: '+966543210987',
          password_hash: defaultPasswordHash,
          region: 'مكة المكرمة',
          city: 'جدة',
          status: 'نشط'
        },
        {
          name: 'شركة ليلة للأفراح',
          email: 'provider@lylah.com',
          role: 'مزود',
          phone: '+966567891234',
          password_hash: defaultPasswordHash,
          region: 'الشرقية',
          city: 'الدمام',
          status: 'نشط'
        }
      ]);
      console.log("✅ Seeded default users successfully.");
    } else {
      // If users already exist, ensure kaab_b has password_hash and phone set
      const kaabUser = await User.findOne({ where: { email: 'kaab909@gmail.com' } });
      if (!kaabUser) {
        await User.create({
          name: 'كعب العرابي',
          email: 'kaab909@gmail.com',
          role: 'مزود',
          phone: '+966551234567',
          password_hash: defaultPasswordHash,
          region: 'الرياض',
          city: 'الرياض',
          status: 'نشط'
        });
        console.log("✅ Seeded user kaab_b successfully.");
      } else {
        let changed = false;
        if (kaabUser.role !== 'مزود') {
          kaabUser.role = 'مزود';
          changed = true;
        }
        if (kaabUser.name !== 'كعب العرابي') {
          kaabUser.name = 'كعب العرابي';
          changed = true;
        }
        if (!kaabUser.password_hash) {
          kaabUser.password_hash = defaultPasswordHash;
          changed = true;
        }
        if (!kaabUser.phone) {
          kaabUser.phone = '+966551234567';
          changed = true;
        }
        if (changed) {
          await kaabUser.save();
          console.log("✅ Updated user kaab_b role, password_hash, and phone.");
        }
      }
    }

    // Ensure admin@system.local is seeded in User table so its password can be updated
    const adminUser = await User.findOne({ where: { email: 'admin@system.local' } });
    if (!adminUser) {
      await User.create({
        name: 'المشرف العام (System)',
        email: 'admin@system.local',
        role: 'Admin',
        phone: '0501112233',
        password_hash: bcrypt.hashSync('admin', 10),
        region: 'الرياض',
        city: 'الرياض',
        status: 'نشط'
      });
      console.log("✅ Seeded admin@system.local successfully in User table.");
    }
  } catch (err) {
    console.error("Error pre-seeding users:", err);
  }
}
