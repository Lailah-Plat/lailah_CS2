import { Sequelize, DataTypes, Model, Op } from 'sequelize';
import CryptoJS from 'crypto-js';
import { PendingProfileUpdate } from './UserModels.js';
import {
  encrypt,
  decrypt,
  getSecureKey,
  checkDatabaseReachable,
  sequelize
} from './dbInstance.js';

export {
  encrypt,
  decrypt,
  getSecureKey,
  checkDatabaseReachable,
  sequelize
};

export class Role extends Model {
  declare id: number;
  declare name: string;
  declare permissions: object;
  declare status: 'active' | 'suspended';
}

Role.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    status: { type: DataTypes.ENUM('active', 'suspended'), defaultValue: 'active' }
  },
  { sequelize, modelName: 'Role' }
);

export class Employee extends Model {
  declare id: number;
  declare fullName: string;
  declare nationalId: string;
  declare dateOfBirth: Date;
  declare gender: 'Male' | 'Female';
  declare qualification: string;
  declare major: string;
  declare avatarUrl: string;
  declare phone: string;
  declare email: string;
  declare nationalAddress: string;
  declare region: string;
  declare city: string;
  declare jobTitle: string;
  declare department: string;
  declare joinDate: Date;
  declare status: 'active' | 'suspended' | 'on_leave' | 'resigned';
  declare iban: string;
  declare baseSalary: number;
  declare allowances: number;
  declare insuranceNumber: string;
  declare permissions: object;
  declare RoleId: number;
  declare role?: Role; // include alias
  declare branch: string | null;
  declare providerId: number | null;
  declare employeeCode: string | null;
  
  // Work/Shift arrangement fields
  declare workType: 'fixed' | 'flexible_window' | 'flexible_free' | 'remote';
  declare requiredHours: number;
  declare shiftStart: string;
  declare shiftEnd: string;
  declare flexibleStartWindowStart: string;
  declare flexibleStartWindowEnd: string;
}

Employee.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    fullName: { type: DataTypes.STRING, allowNull: false },
    nationalId: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true,
      get() {
        const rawValue = this.getDataValue('nationalId');
        return decrypt(rawValue);
      },
      set(value: string) {
        this.setDataValue('nationalId', encrypt(value));
      }
    },
    dateOfBirth: { type: DataTypes.DATEONLY },
    gender: { type: DataTypes.ENUM('Male', 'Female') },
    qualification: { type: DataTypes.STRING },
    major: { type: DataTypes.STRING },
    avatarUrl: { type: DataTypes.STRING },
    phone: { 
      type: DataTypes.STRING, 
      allowNull: false, 
      unique: true,
      validate: {
        is: /^(\+9665|9665|05)\d{8}$/
      }
    },
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
    nationalAddress: { type: DataTypes.TEXT },
    region: { type: DataTypes.STRING },
    city: { type: DataTypes.STRING },
    jobTitle: { type: DataTypes.STRING },
    department: { type: DataTypes.STRING },
    joinDate: { type: DataTypes.DATEONLY, defaultValue: DataTypes.NOW },
    status: { type: DataTypes.ENUM('active', 'suspended', 'on_leave', 'resigned'), defaultValue: 'active' },
    iban: {
      type: DataTypes.STRING,
      get() {
        const rawValue = this.getDataValue('iban');
        return decrypt(rawValue);
      },
      set(value: string | null) {
        this.setDataValue('iban', encrypt(value));
      }
    },
    baseSalary: { type: DataTypes.FLOAT, defaultValue: 0 },
    allowances: { type: DataTypes.FLOAT, defaultValue: 0 },
    insuranceNumber: { type: DataTypes.STRING },
    permissions: { type: DataTypes.JSON, allowNull: false, defaultValue: {} },
    branch: { type: DataTypes.STRING, defaultValue: 'الفرع الرئيسي' },
    providerId: { type: DataTypes.INTEGER, allowNull: true },
    employeeCode: { type: DataTypes.STRING, allowNull: true, unique: true },
    
    // Work/Shift arrangement configurations
    workType: { type: DataTypes.STRING, defaultValue: 'fixed' }, // 'fixed', 'flexible_window', 'flexible_free', 'remote'
    requiredHours: { type: DataTypes.FLOAT, defaultValue: 8 },
    shiftStart: { type: DataTypes.STRING, defaultValue: '08:00' },
    shiftEnd: { type: DataTypes.STRING, defaultValue: '16:00' },
    flexibleStartWindowStart: { type: DataTypes.STRING, defaultValue: '08:00' },
    flexibleStartWindowEnd: { type: DataTypes.STRING, defaultValue: '10:00' },
  },
  { sequelize, modelName: 'Employee' }
);

Employee.beforeCreate(async (emp: any) => {
  if (!emp.employeeCode) {
    try {
      const currentYear = new Date().getFullYear();
      const yy = String(currentYear).slice(-2);
      const countThisYear = await Employee.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
          }
        }
      });
      const seq = countThisYear + 1;
      const paddedSeq = String(seq).padStart(10, '0');
      emp.employeeCode = `EMP-${yy}-${paddedSeq}`;
    } catch (e) {
      console.error("Error in Employee beforeCreate hook:", e);
    }
  }
});

export class AuditLog extends Model {
  declare id: number;
  declare action: string;
  declare entityType: string;
  declare entityId: string;
  declare details: object;
  declare performedBy: number;
}

AuditLog.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    action: { type: DataTypes.STRING, allowNull: false }, // 'VIEW', 'CREATE', 'UPDATE', 'DELETE'
    entityType: { type: DataTypes.STRING, allowNull: false }, // 'Employee', 'Role', etc.
    entityId: { type: DataTypes.STRING, allowNull: true },
    details: { type: DataTypes.JSON, allowNull: true },
    performedBy: { type: DataTypes.INTEGER, allowNull: true } // Employee ID
  },
  { sequelize, modelName: 'AuditLog' }
);

Role.hasMany(Employee, { foreignKey: 'RoleId', as: 'employees' });
Employee.belongsTo(Role, { foreignKey: 'RoleId', as: 'role' });

Employee.hasMany(AuditLog, { foreignKey: 'performedBy', as: 'auditLogs' });
AuditLog.belongsTo(Employee, { foreignKey: 'performedBy', as: 'performer' });

export class Attendance extends Model {
  declare id: number;
  declare employeeId: number;
  declare date: string;
  declare clockIn: string;
  declare clockOut: string | null;
  declare status: 'present' | 'absent' | 'late' | 'excused';
  declare notes: string | null;
  declare ipAddress: string | null;
  declare device: string | null;

  // Real calculation metrics
  declare delayMinutes: number;
  declare earlyDepartureMinutes: number;
  declare workHours: number;
  declare deficitHours: number;
}

Attendance.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
    clockIn: { type: DataTypes.STRING, allowNull: false },
    clockOut: { type: DataTypes.STRING, allowNull: true },
    status: { type: DataTypes.ENUM('present', 'absent', 'late', 'excused'), defaultValue: 'present' },
    notes: { type: DataTypes.TEXT, allowNull: true },
    ipAddress: { type: DataTypes.STRING, allowNull: true },
    device: { type: DataTypes.STRING, allowNull: true },

    // Metrics for calculating delay/early out/deficit
    delayMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    earlyDepartureMinutes: { type: DataTypes.INTEGER, defaultValue: 0 },
    workHours: { type: DataTypes.FLOAT, defaultValue: 0 },
    deficitHours: { type: DataTypes.FLOAT, defaultValue: 0 }
  },
  { sequelize, modelName: 'Attendance' }
);

export class LeaveRequest extends Model {
  declare id: number;
  declare employeeId: number;
  declare type: 'annual' | 'sick' | 'unpaid' | 'maternity' | 'emergency';
  declare startDate: string;
  declare endDate: string;
  declare status: 'pending' | 'approved' | 'rejected';
  declare reason: string | null;
  declare approvedBy: number | null;
}

LeaveRequest.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    type: { type: DataTypes.ENUM('annual', 'sick', 'unpaid', 'maternity', 'emergency'), defaultValue: 'annual' },
    startDate: { type: DataTypes.STRING, allowNull: false },
    endDate: { type: DataTypes.STRING, allowNull: false },
    status: { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    reason: { type: DataTypes.TEXT, allowNull: true },
    approvedBy: { type: DataTypes.INTEGER, allowNull: true }
  },
  { sequelize, modelName: 'LeaveRequest' }
);

export class EmployeeEvaluation extends Model {
  declare id: number;
  declare employeeId: number;
  declare evaluatorId: number;
  declare date: string;
  declare score: number;
  declare feedback: string | null;
  declare attendanceRating: number;
  declare tasksRating: number;
  declare cooperationRating: number;
  declare speedRating: number;
  declare superiorsRating: number;
  declare teamworkRating: number;
  declare behaviorRating: number;
}

EmployeeEvaluation.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    evaluatorId: { type: DataTypes.INTEGER, allowNull: false },
    date: { type: DataTypes.STRING, allowNull: false },
    score: { type: DataTypes.INTEGER, defaultValue: 100 },
    feedback: { type: DataTypes.TEXT, allowNull: true },
    attendanceRating: { type: DataTypes.INTEGER, defaultValue: 5 },
    tasksRating: { type: DataTypes.INTEGER, defaultValue: 5 },
    cooperationRating: { type: DataTypes.INTEGER, defaultValue: 5 },
    speedRating: { type: DataTypes.INTEGER, defaultValue: 5 },
    superiorsRating: { type: DataTypes.INTEGER, defaultValue: 5 },
    teamworkRating: { type: DataTypes.INTEGER, defaultValue: 5 },
    behaviorRating: { type: DataTypes.INTEGER, defaultValue: 5 }
  },
  { sequelize, modelName: 'EmployeeEvaluation' }
);

export class TemporaryPermission extends Model {
  declare id: number;
  declare employeeId: number;
  declare permission: string;
  declare expiresAt: string;
  declare grantedBy: number;
}

TemporaryPermission.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    permission: { type: DataTypes.STRING, allowNull: false },
    expiresAt: { type: DataTypes.STRING, allowNull: false },
    grantedBy: { type: DataTypes.INTEGER, allowNull: false }
  },
  { sequelize, modelName: 'TemporaryPermission' }
);

export class EmployeeSession extends Model {
  declare id: number;
  declare employeeId: number;
  declare ipAddress: string;
  declare device: string;
  declare location: string;
  declare lastActive: string;
  declare mfaVerified: boolean;
}

EmployeeSession.init(
  {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    employeeId: { type: DataTypes.INTEGER, allowNull: false },
    ipAddress: { type: DataTypes.STRING, allowNull: false },
    device: { type: DataTypes.STRING, allowNull: false },
    location: { type: DataTypes.STRING, allowNull: false },
    lastActive: { type: DataTypes.STRING, allowNull: false },
    mfaVerified: { type: DataTypes.BOOLEAN, defaultValue: false }
  },
  { sequelize, modelName: 'EmployeeSession' }
);

Employee.hasMany(Attendance, { foreignKey: 'employeeId', as: 'attendances' });
Attendance.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(LeaveRequest, { foreignKey: 'employeeId', as: 'leaveRequests' });
LeaveRequest.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(EmployeeEvaluation, { foreignKey: 'employeeId', as: 'evaluations' });
EmployeeEvaluation.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(TemporaryPermission, { foreignKey: 'employeeId', as: 'temporaryPermissions' });
TemporaryPermission.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

Employee.hasMany(EmployeeSession, { foreignKey: 'employeeId', as: 'sessions' });
EmployeeSession.belongsTo(Employee, { foreignKey: 'employeeId', as: 'employee' });

export class Expense extends Model {
  declare id: number;
  declare expenseNumber: string | null;
  declare title: string;
  declare amount: number;
  declare vatAmount: number;
  declare amountIncludingVat: number;
  declare category: string; // 'salaries', 'marketing', 'utilities', 'hosting', 'other'
  declare paymentMethod: string;
  declare date: Date;
  declare dueDate: Date | null;
  declare status: 'pending' | 'paid';
  declare EmployeeId: number; // who added it
  declare type: string; // 'operational', 'refund', 'manual'
  declare providerId: number | null;
  declare description: string | null;
  declare notes: string | null;
  declare attachmentUrl: string | null;
  declare isExternal: boolean;
  declare isTaxable: boolean;
}

Expense.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  expenseNumber: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  vatAmount: { type: DataTypes.FLOAT, allowNull: false },
  amountIncludingVat: { type: DataTypes.FLOAT, allowNull: false },
  category: { type: DataTypes.STRING, allowNull: false },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'cash' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  dueDate: { type: DataTypes.DATE, allowNull: true },
  status: { type: DataTypes.ENUM('pending', 'paid'), defaultValue: 'pending' },
  type: { type: DataTypes.STRING, defaultValue: 'operational' },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  attachmentUrl: { type: DataTypes.TEXT, allowNull: true },
  isExternal: { type: DataTypes.BOOLEAN, defaultValue: false },
  isTaxable: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, modelName: 'Expense' });

Expense.beforeCreate(async (expense: any) => {
  if (!expense.expenseNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const yy = String(currentYear).slice(-2);
      
      const countThisYear = await Expense.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
          }
        }
      });
      const seq = countThisYear + 1;
      const paddedSeq = String(seq).padStart(10, '0');
      expense.expenseNumber = `EXP-${yy}-${paddedSeq}`;
    } catch (e) {
      console.error("Error in Expense beforeCreate hook:", e);
    }
  }
});

export class RevenueType extends Model {
  declare id: number;
  declare name: string;
  declare key: string;
  declare isSystem: boolean;
}

RevenueType.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'RevenueType', tableName: 'revenue_types' });

export class ExpenseCategory extends Model {
  declare id: number;
  declare name: string;
  declare key: string;
  declare isSystem: boolean;
}

ExpenseCategory.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  key: { type: DataTypes.STRING, allowNull: false, unique: true },
  isSystem: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { sequelize, modelName: 'ExpenseCategory', tableName: 'expense_categories' });

export class Revenue extends Model {
  declare id: number;
  declare revenueNumber: string | null;
  declare title: string;
  declare type: string; // 'commission', 'subscription', 'addon', 'manual', or custom names
  declare amount: number;
  declare vatAmount: number;
  declare amountIncludingVat: number;
  declare bookingId: string | null;
  declare providerId: number | null;
  declare paymentMethod: string; // 'mada', 'visa', 'stcpay', etc.
  declare collectionMethod: 'bank' | 'cash' | 'credit' | null;
  declare referenceNumber: string | null;
  declare payerName: string | null;
  declare description: string | null;
  declare notes: string | null;
  declare attachmentUrl: string | null;
  declare isExternal: boolean;
  declare date: Date;
}

Revenue.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  revenueNumber: { type: DataTypes.STRING, allowNull: true },
  title: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  vatAmount: { type: DataTypes.FLOAT, allowNull: false },
  amountIncludingVat: { type: DataTypes.FLOAT, allowNull: false },
  bookingId: { type: DataTypes.STRING, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  paymentMethod: { type: DataTypes.STRING, defaultValue: 'mada' },
  collectionMethod: { type: DataTypes.STRING, allowNull: true }, // 'bank' | 'cash' | 'credit'
  referenceNumber: { type: DataTypes.STRING, allowNull: true },
  payerName: { type: DataTypes.STRING, allowNull: true },
  description: { type: DataTypes.TEXT, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  attachmentUrl: { type: DataTypes.TEXT, allowNull: true },
  isExternal: { type: DataTypes.BOOLEAN, defaultValue: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'Revenue' });

Revenue.beforeCreate(async (revenue: any) => {
  if (!revenue.revenueNumber) {
    try {
      const currentYear = new Date().getFullYear();
      const yy = String(currentYear).slice(-2);
      
      const countThisYear = await Revenue.count({
        where: {
          createdAt: {
            [Op.gte]: new Date(`${currentYear}-01-01T00:00:00.000Z`)
          }
        }
      });
      const seq = countThisYear + 1;
      const paddedSeq = String(seq).padStart(10, '0');
      revenue.revenueNumber = `REV-${yy}-${paddedSeq}`;
    } catch (e) {
      console.error("Error in Revenue beforeCreate hook:", e);
    }
  }
});

export class FinancialClaim extends Model {
  declare id: number;
  declare providerId: number;
  declare amount: number;
  declare status: 'pending' | 'paid' | 'rejected';
  declare bankDetails: string;
  declare date: Date;
}

FinancialClaim.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'paid', 'rejected'), defaultValue: 'pending' },
  bankDetails: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'FinancialClaim' });

export class Invoice extends Model {
  declare id: number;
  declare customerId: number | null;
  declare providerId: number | null;
  declare bookingId: number | null;
  declare totalAmount: number;
  declare vatAmount: number;
  declare date: Date;
  declare status: 'paid' | 'unpaid' | 'cancelled';
}

Invoice.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: true },
  totalAmount: { type: DataTypes.FLOAT, allowNull: false },
  vatAmount: { type: DataTypes.FLOAT, allowNull: false },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  status: { type: DataTypes.ENUM('paid', 'unpaid', 'cancelled'), defaultValue: 'unpaid' }
}, { sequelize, modelName: 'Invoice' });

export class Wallet extends Model {
  declare id: number;
  declare providerId: number;
  declare balance: number;
  declare pendingBalance: number;
}

Wallet.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  balance: { type: DataTypes.FLOAT, defaultValue: 0 },
  pendingBalance: { type: DataTypes.FLOAT, defaultValue: 0 }
}, { sequelize, modelName: 'Wallet' });

export class WalletTransaction extends Model {
  declare id: number;
  declare providerId: number;
  declare type: string; // 'deposit_pending', 'release_deposit', 'withdrawal', 'commission_charge', 'refund'
  declare description: string;
  declare amount: number;
  declare status: 'pending' | 'completed' | 'failed';
  declare date: Date;
}

WalletTransaction.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), defaultValue: 'pending' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'WalletTransaction' });

export class Settlement extends Model {
  declare id: number;
  declare settlementNumber: string;
  declare referenceId: string;
  declare referenceType: 'booking' | 'order' | 'support_service' | 'subscription' | 'other';
  declare providerId: number;
  declare grossAmount: number;
  declare gatewayFee: number;
  declare commissionAmount: number;
  declare commissionBase: number;
  declare commissionVat: number;
  declare providerShare: number;
  declare status: 'pending' | 'approved' | 'transferred' | 'closed';
  declare createdAt: Date;
  declare updatedAt: Date;
  declare transferredAt: Date | null;
}

Settlement.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  settlementNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  referenceId: { type: DataTypes.STRING, allowNull: false },
  referenceType: { type: DataTypes.STRING, allowNull: false },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  grossAmount: { type: DataTypes.FLOAT, allowNull: false },
  gatewayFee: { type: DataTypes.FLOAT, defaultValue: 0 },
  commissionAmount: { type: DataTypes.FLOAT, allowNull: false },
  commissionBase: { type: DataTypes.FLOAT, allowNull: false },
  commissionVat: { type: DataTypes.FLOAT, allowNull: false },
  providerShare: { type: DataTypes.FLOAT, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'approved', 'transferred', 'closed'), defaultValue: 'pending' },
  transferredAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  modelName: 'Settlement',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['status'] },
    { fields: ['referenceId', 'referenceType'] }
  ]
});

export class LedgerEntry extends Model {
  declare id: number;
  declare ledgerNumber: string;
  declare walletType: 'provider' | 'platform_revenue' | 'platform_vat' | 'gateway_fee';
  declare providerId: number | null;
  declare referenceId: string;
  declare referenceType: string;
  declare type: 'debit' | 'credit';
  declare amount: number;
  declare balanceBefore: number;
  declare balanceAfter: number;
  declare description: string;
  declare status: 'pending' | 'completed' | 'failed';
  declare date: Date;
  declare createdBy: string | null;
}

LedgerEntry.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ledgerNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  walletType: { type: DataTypes.ENUM('provider', 'platform_revenue', 'platform_vat', 'gateway_fee'), allowNull: false },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  referenceId: { type: DataTypes.STRING, allowNull: false },
  referenceType: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('debit', 'credit'), allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  balanceBefore: { type: DataTypes.FLOAT, defaultValue: 0 },
  balanceAfter: { type: DataTypes.FLOAT, defaultValue: 0 },
  description: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.ENUM('pending', 'completed', 'failed'), defaultValue: 'completed' },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  createdBy: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'LedgerEntry',
  indexes: [
    { fields: ['walletType'] },
    { fields: ['providerId'] },
    { fields: ['referenceId', 'referenceType'] }
  ]
});

export class CustomerWallet extends Model {
  declare id: number;
  declare customerEmail: string;
  declare customerName: string;
  declare cashBalance: number;
  declare customerId: number | null;
}

CustomerWallet.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerEmail: { type: DataTypes.STRING, allowNull: false, unique: true },
  customerName: { type: DataTypes.STRING, allowNull: true },
  cashBalance: { type: DataTypes.FLOAT, defaultValue: 0 },
  customerId: { type: DataTypes.INTEGER, allowNull: true, unique: true }
}, { sequelize, modelName: 'CustomerWallet' });

export class CustomerHeldBalance extends Model {
  declare id: number;
  declare customerEmail: string;
  declare customerName: string;
  declare amount: number;
  declare originalBookingId: number;
  declare originalProviderId: number | null;
  declare holdReason: 'force_majeure' | 'rescheduling';
  declare heldSince: Date;
  declare conversionStatus: 'held' | 'converted_to_cash' | 'used';
  declare approvedByAdmin: string;
  declare notes: string;
  declare customerId: number | null;
}

CustomerHeldBalance.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerEmail: { type: DataTypes.STRING, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: true },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  originalBookingId: { type: DataTypes.INTEGER, allowNull: true },
  originalProviderId: { type: DataTypes.INTEGER, allowNull: true },
  holdReason: { type: DataTypes.STRING, defaultValue: 'rescheduling' },
  heldSince: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  conversionStatus: { type: DataTypes.STRING, defaultValue: 'held' },
  approvedByAdmin: { type: DataTypes.STRING, allowNull: true },
  notes: { type: DataTypes.TEXT, allowNull: true },
  customerId: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'CustomerHeldBalance' });

export class GatewayCapability extends Model {
  declare id: number;
  declare gatewayName: string;
  declare splitAtPayment: string;
  declare beneficiaryOnboarding: string;
  declare deferredPayout: string;
  declare cancelScheduledPayout: boolean;
  declare reversePaidPayout: boolean;
  declare partialRefund: boolean;
}

GatewayCapability.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  gatewayName: { type: DataTypes.STRING, allowNull: false, unique: true },
  splitAtPayment: { type: DataTypes.STRING, defaultValue: 'logical_only' },
  beneficiaryOnboarding: { type: DataTypes.STRING, defaultValue: 'api' },
  deferredPayout: { type: DataTypes.STRING, defaultValue: 'platform_schedule' },
  cancelScheduledPayout: { type: DataTypes.BOOLEAN, defaultValue: true },
  reversePaidPayout: { type: DataTypes.BOOLEAN, defaultValue: false },
  partialRefund: { type: DataTypes.BOOLEAN, defaultValue: true }
}, { sequelize, modelName: 'GatewayCapability' });

import { User } from './UserModels.js';
import { ForceMajeureRequest, Booking, SupportServiceRequest, Service, Supplier, Hall } from './BookingModels.js';
import { ProviderSubscription, ProviderFeatureOverride, SubscriptionPlan } from './SubscriptionModels.js';
import { PendingRegistration } from './UserModels.js';
import { Review, ServiceChat, ServiceChatMessage } from './FeedbackModels.js';
import { Ticket, TicketMessage } from './SupportModels.js';

// Setup relationships
Invoice.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
User.hasMany(Invoice, { foreignKey: 'customerId', as: 'invoices' });

Invoice.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
User.hasMany(Invoice, { foreignKey: 'providerId', as: 'providerInvoices' });

Invoice.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Booking.hasMany(Invoice, { foreignKey: 'bookingId', as: 'invoices' });

// ServiceChat and ServiceChatMessage relations
ServiceChat.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
User.hasMany(ServiceChat, { foreignKey: 'customerId', as: 'serviceChatsAsCustomer' });

ServiceChat.belongsTo(User, { foreignKey: 'agentId', as: 'agentUser' });
User.hasMany(ServiceChat, { foreignKey: 'agentId', as: 'serviceChatsAsAgent' });

ServiceChatMessage.belongsTo(ServiceChat, { foreignKey: 'chatId', as: 'serviceChat' });
ServiceChat.hasMany(ServiceChatMessage, { foreignKey: 'chatId', as: 'messages' });

// Ticket and TicketMessage relations
Ticket.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
User.hasMany(Ticket, { foreignKey: 'customerId', as: 'ticketsAsCustomer' });

Ticket.belongsTo(User, { foreignKey: 'assignedAgentId', as: 'assignedAgentUser' });
User.hasMany(Ticket, { foreignKey: 'assignedAgentId', as: 'ticketsAsAgent' });

TicketMessage.belongsTo(Ticket, { foreignKey: 'ticketId', as: 'ticket' });
Ticket.hasMany(TicketMessage, { foreignKey: 'ticketId', as: 'ticketMessages' });

TicketMessage.belongsTo(User, { foreignKey: 'senderId', as: 'senderUser' });
User.hasMany(TicketMessage, { foreignKey: 'senderId', as: 'ticketMessages' });

// Supplier relations
Supplier.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Supplier, { foreignKey: 'userId', as: 'suppliers' });

// SubscriptionPlan relations
ProviderSubscription.belongsTo(SubscriptionPlan, { foreignKey: 'planId', as: 'subscriptionPlan' });
SubscriptionPlan.hasMany(ProviderSubscription, { foreignKey: 'planId', as: 'providerSubscriptions' });

// SupportServiceRequest Service relation
SupportServiceRequest.belongsTo(Service, { foreignKey: 'serviceId', as: 'service' });
Service.hasMany(SupportServiceRequest, { foreignKey: 'serviceId', as: 'supportServiceRequests' });

ProviderSubscription.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
User.hasMany(ProviderSubscription, { foreignKey: 'providerId', as: 'subscriptions' });

ProviderFeatureOverride.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
User.hasMany(ProviderFeatureOverride, { foreignKey: 'providerId', as: 'featureOverrides' });

PendingRegistration.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(PendingRegistration, { foreignKey: 'userId', as: 'pendingRegistrations' });

Review.belongsTo(User, { foreignKey: 'userId', as: 'customerUser' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviewsAsCustomer' });

Review.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
User.hasMany(Review, { foreignKey: 'providerId', as: 'reviewsAsProvider' });

SupportServiceRequest.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser' });
User.hasMany(SupportServiceRequest, { foreignKey: 'customerId', as: 'customerServiceRequests' });

SupportServiceRequest.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
User.hasMany(SupportServiceRequest, { foreignKey: 'providerId', as: 'providerServiceRequests' });

SupportServiceRequest.belongsTo(Booking, { foreignKey: 'bookingId', as: 'booking' });
Booking.hasMany(SupportServiceRequest, { foreignKey: 'bookingId', as: 'serviceRequests' });

CustomerHeldBalance.belongsTo(Booking, { foreignKey: 'originalBookingId', as: 'originalBooking' });
Booking.hasMany(CustomerHeldBalance, { foreignKey: 'originalBookingId', as: 'heldBalances' });

Wallet.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasOne(Wallet, { foreignKey: 'providerId', as: 'wallet', constraints: false });

WalletTransaction.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(WalletTransaction, { foreignKey: 'providerId', as: 'walletTransactions', constraints: false });

Revenue.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(Revenue, { foreignKey: 'providerId', as: 'revenues', constraints: false });

FinancialClaim.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(FinancialClaim, { foreignKey: 'providerId', as: 'financialClaims', constraints: false });

Settlement.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(Settlement, { foreignKey: 'providerId', as: 'settlements', constraints: false });

LedgerEntry.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(LedgerEntry, { foreignKey: 'providerId', as: 'ledgerEntries', constraints: false });

CustomerHeldBalance.belongsTo(User, { foreignKey: 'originalProviderId', as: 'providerUser', constraints: false });
User.hasMany(CustomerHeldBalance, { foreignKey: 'originalProviderId', as: 'heldBalances', constraints: false });

CustomerHeldBalance.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser', constraints: false });
User.hasMany(CustomerHeldBalance, { foreignKey: 'customerId', as: 'heldBalancesCustomer', constraints: false });

CustomerWallet.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser', constraints: false });
User.hasOne(CustomerWallet, { foreignKey: 'customerId', as: 'customerWallet', constraints: false });

Expense.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser', constraints: false });
User.hasMany(Expense, { foreignKey: 'providerId', as: 'expenses', constraints: false });

ForceMajeureRequest.belongsTo(User, { foreignKey: 'customerId', as: 'customerUser', constraints: false });
User.hasMany(ForceMajeureRequest, { foreignKey: 'customerId', as: 'forceMajeureRequests', constraints: false });

Employee.hasMany(Expense, { foreignKey: 'EmployeeId', as: 'expenses', constraints: false });
Expense.belongsTo(Employee, { foreignKey: 'EmployeeId', constraints: false });

// Simple wrapper to sync models
export async function syncDatabase() {
  // Try running migrations first before sync to ensure any column type alterations are processed without crash
  try {
    const queryInterface = sequelize.getQueryInterface();

    // 1. Wallet column type alteration
    try {
      const walletTableInfo = await queryInterface.describeTable(Wallet.tableName);
      if (walletTableInfo.providerId && !walletTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Wallet.tableName}...`);
        await sequelize.query(`ALTER TABLE "${Wallet.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId", '[^0-9]', '', 'g'), '')::integer`);
        console.log(`Column 'providerId' in ${Wallet.tableName} altered to INTEGER.`);
      }
    } catch (err: any) {
      console.warn("Wallet migration warning:", err.message || err);
    }

    // 2. WalletTransaction column type alteration
    try {
      const wtTableInfo = await queryInterface.describeTable(WalletTransaction.tableName);
      if (wtTableInfo.providerId && !wtTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${WalletTransaction.tableName}...`);
        await sequelize.query(`ALTER TABLE "${WalletTransaction.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId"::text, '[^0-9]', '', 'g'), '')::integer`);
        console.log(`Column 'providerId' in ${WalletTransaction.tableName} altered to INTEGER.`);
      }
    } catch (err: any) {
      console.warn("WalletTransaction migration warning:", err.message || err);
    }

    // 3. Revenue column type alteration
    try {
      const revTableInfo = await queryInterface.describeTable(Revenue.tableName);
      if (revTableInfo.providerId && !revTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Revenue.tableName}...`);
        await sequelize.query(`ALTER TABLE "${Revenue.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId"::text, '[^0-9]', '', 'g'), '')::integer`);
        console.log(`Column 'providerId' in ${Revenue.tableName} altered to INTEGER.`);
      }
    } catch (err: any) {
      console.warn("Revenue migration warning:", err.message || err);
    }

    // 4. FinancialClaim column type alteration
    try {
      const fcTableInfo = await queryInterface.describeTable(FinancialClaim.tableName);
      if (fcTableInfo.providerId && !fcTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${FinancialClaim.tableName}...`);
        await sequelize.query(`ALTER TABLE "${FinancialClaim.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId"::text, '[^0-9]', '', 'g'), '')::integer`);
        console.log(`Column 'providerId' in ${FinancialClaim.tableName} altered to INTEGER.`);
      }
    } catch (err: any) {
      console.warn("FinancialClaim migration warning:", err.message || err);
    }

    // 5. CustomerHeldBalance column type alteration
    try {
      const chbTableInfo = await queryInterface.describeTable(CustomerHeldBalance.tableName);
      if (chbTableInfo.originalProviderId && !chbTableInfo.originalProviderId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'originalProviderId' column type to INTEGER in ${CustomerHeldBalance.tableName}...`);
        await sequelize.query(`ALTER TABLE "${CustomerHeldBalance.tableName}" ALTER COLUMN "originalProviderId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("originalProviderId"::text, '[^0-9]', '', 'g'), '')::integer`);
        console.log(`Column 'originalProviderId' in ${CustomerHeldBalance.tableName} altered to INTEGER.`);
      }
    } catch (err: any) {
      console.warn("CustomerHeldBalance migration warning:", err.message || err);
    }

    // 6. Add providerId column to Expense if not present & alter to INTEGER if needed
    try {
      const expenseTableInfo = await queryInterface.describeTable(Expense.tableName);
      if (!expenseTableInfo.providerId) {
        console.log(`Adding 'providerId' column to ${Expense.tableName}...`);
        await queryInterface.addColumn(Expense.tableName, 'providerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      } else if (!expenseTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Expense.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${Expense.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId"::text, '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("Expense providerId migration warning:", err.message || err);
    }

    // 7. Add customerId column to CustomerWallet if not present
    try {
      const cwTableInfo = await queryInterface.describeTable(CustomerWallet.tableName);
      if (!cwTableInfo.customerId) {
        console.log(`Adding 'customerId' column to ${CustomerWallet.tableName}...`);
        await queryInterface.addColumn(CustomerWallet.tableName, 'customerId', {
          type: DataTypes.INTEGER,
          allowNull: true,
          unique: true
        });
      }
    } catch (err: any) {
      console.warn("CustomerWallet customerId migration warning:", err.message || err);
    }

    // 8. Add customerId column to CustomerHeldBalance if not present
    try {
      const chbTableInfo = await queryInterface.describeTable(CustomerHeldBalance.tableName);
      if (!chbTableInfo.customerId) {
        console.log(`Adding 'customerId' column to ${CustomerHeldBalance.tableName}...`);
        await queryInterface.addColumn(CustomerHeldBalance.tableName, 'customerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("CustomerHeldBalance customerId migration warning:", err.message || err);
    }

    // 9. Add customerId column to ForceMajeureRequest if not present
    try {
      const fmTableInfo = await queryInterface.describeTable(ForceMajeureRequest.tableName);
      if (!fmTableInfo.customerId) {
        console.log(`Adding 'customerId' column to ${ForceMajeureRequest.tableName}...`);
        await queryInterface.addColumn(ForceMajeureRequest.tableName, 'customerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("ForceMajeureRequest customerId migration warning:", err.message || err);
    }

    // 10. Alter Invoice customerId and bookingId columns to INTEGER
    try {
      const invoiceTableInfo = await queryInterface.describeTable(Invoice.tableName);
      if (invoiceTableInfo.customerId && !invoiceTableInfo.customerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'customerId' column type to INTEGER in ${Invoice.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${Invoice.tableName}" ALTER COLUMN "customerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("customerId"::text, '[^0-9]', '', 'g'), '')::integer`);
        }
      }
      if (invoiceTableInfo.bookingId && !invoiceTableInfo.bookingId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'bookingId' column type to INTEGER in ${Invoice.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${Invoice.tableName}" ALTER COLUMN "bookingId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("bookingId"::text, '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("Invoice columns migration warning:", err.message || err);
    }

    // 10.5. Add providerId column to Invoice if not present & alter to INTEGER
    try {
      const invoiceTableInfo = await queryInterface.describeTable(Invoice.tableName);
      if (!invoiceTableInfo.providerId) {
        console.log(`Adding 'providerId' column to ${Invoice.tableName}...`);
        await queryInterface.addColumn(Invoice.tableName, 'providerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      } else if (!invoiceTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Invoice.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${Invoice.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("Invoice providerId column migration warning:", err.message || err);
    }

    // 11. Add userId column to PendingRegistration if not present
    try {
      const pendingTableInfo = await queryInterface.describeTable(PendingRegistration.tableName);
      if (!pendingTableInfo.userId) {
        console.log(`Adding 'userId' column to ${PendingRegistration.tableName}...`);
        await queryInterface.addColumn(PendingRegistration.tableName, 'userId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      } else if (!pendingTableInfo.userId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'userId' column type to INTEGER in ${PendingRegistration.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${PendingRegistration.tableName}" ALTER COLUMN "userId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("userId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("PendingRegistration userId migration warning:", err.message || err);
    }

    // 12. Add userId and providerId columns to Review if not present & alter to INTEGER
    try {
      const reviewTableInfo = await queryInterface.describeTable(Review.tableName);
      if (!reviewTableInfo.userId) {
        console.log(`Adding 'userId' column to ${Review.tableName}...`);
        await queryInterface.addColumn(Review.tableName, 'userId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      } else if (!reviewTableInfo.userId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'userId' column type to INTEGER in ${Review.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${Review.tableName}" ALTER COLUMN "userId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("userId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
      if (!reviewTableInfo.providerId) {
        console.log(`Adding 'providerId' column to ${Review.tableName}...`);
        await queryInterface.addColumn(Review.tableName, 'providerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      } else if (!reviewTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Review.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${Review.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("Review columns migration warning:", err.message || err);
    }

    // 13. Add customerId and providerId columns to SupportServiceRequest if not present & alter to INTEGER
    try {
      const ssrTableInfo = await queryInterface.describeTable(SupportServiceRequest.tableName);
      if (!ssrTableInfo.customerId) {
        console.log(`Adding 'customerId' column to ${SupportServiceRequest.tableName}...`);
        await queryInterface.addColumn(SupportServiceRequest.tableName, 'customerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      } else if (!ssrTableInfo.customerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'customerId' column type to INTEGER in ${SupportServiceRequest.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${SupportServiceRequest.tableName}" ALTER COLUMN "customerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("customerId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
      if (!ssrTableInfo.providerId) {
        console.log(`Adding 'providerId' column to ${SupportServiceRequest.tableName}...`);
        await queryInterface.addColumn(SupportServiceRequest.tableName, 'providerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      } else if (!ssrTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${SupportServiceRequest.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${SupportServiceRequest.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("SupportServiceRequest columns migration warning:", err.message || err);
    }

    // 14. Alter ProviderSubscription providerId to INTEGER
    try {
      const subTableInfo = await queryInterface.describeTable(ProviderSubscription.tableName);
      if (subTableInfo.providerId && !subTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${ProviderSubscription.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${ProviderSubscription.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("ProviderSubscription providerId alteration warning:", err.message || err);
    }

    // 15. Alter ProviderFeatureOverride providerId to INTEGER
    try {
      const overrideTableInfo = await queryInterface.describeTable(ProviderFeatureOverride.tableName);
      if (overrideTableInfo.providerId && !overrideTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${ProviderFeatureOverride.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${ProviderFeatureOverride.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId", '[^0-9]', '', 'g'), '')::integer`);
        }
      }
    } catch (err: any) {
      console.warn("ProviderFeatureOverride providerId alteration warning:", err.message || err);
    }

    // 16. Recreate ServiceChat and ServiceChatMessage if columns are old varchar types
    try {
      const chatTableInfo = await queryInterface.describeTable(ServiceChat.tableName);
      if (chatTableInfo.id && !chatTableInfo.id.type.toLowerCase().includes('int')) {
        console.log(`Dropping old varchar 'service_chats' and 'service_chat_messages' tables to recreate as INTEGER...`);
        await sequelize.query(`DROP TABLE IF EXISTS "service_chat_messages" CASCADE`);
        await sequelize.query(`DROP TABLE IF EXISTS "service_chats" CASCADE`);
      }
    } catch (err: any) {
      console.warn("ServiceChat migration recreate warning:", err.message || err);
    }

    // 17. Recreate Ticket and TicketMessage if columns are old UUID types
    try {
      const ticketTableInfo = await queryInterface.describeTable(Ticket.tableName);
      if (ticketTableInfo.id && !ticketTableInfo.id.type.toLowerCase().includes('int')) {
        console.log(`Dropping old UUID 'support_tickets' and 'support_ticket_messages' tables to recreate as INTEGER...`);
        await sequelize.query(`DROP TABLE IF EXISTS "support_ticket_messages" CASCADE`);
        await sequelize.query(`DROP TABLE IF EXISTS "support_tickets" CASCADE`);
      }
    } catch (err: any) {
      console.warn("Ticket migration recreate warning:", err.message || err);
    }

    // 18. Add userId column to Supplier if not present
    try {
      const supplierTableInfo = await queryInterface.describeTable(Supplier.tableName);
      if (!supplierTableInfo.userId) {
        console.log(`Adding 'userId' column to ${Supplier.tableName}...`);
        await queryInterface.addColumn(Supplier.tableName, 'userId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("Supplier userId migration warning:", err.message || err);
    }

    // 19. Add planId column to ProviderSubscription if not present
    try {
      const subTableInfo = await queryInterface.describeTable(ProviderSubscription.tableName);
      if (!subTableInfo.planId) {
        console.log(`Adding 'planId' column to ${ProviderSubscription.tableName}...`);
        await queryInterface.addColumn(ProviderSubscription.tableName, 'planId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("ProviderSubscription planId migration warning:", err.message || err);
    }

    // 20. Add serviceId column to SupportServiceRequest if not present
    try {
      const ssrTableInfo = await queryInterface.describeTable(SupportServiceRequest.tableName);
      if (!ssrTableInfo.serviceId) {
        console.log(`Adding 'serviceId' column to ${SupportServiceRequest.tableName}...`);
        await queryInterface.addColumn(SupportServiceRequest.tableName, 'serviceId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("SupportServiceRequest serviceId migration warning:", err.message || err);
    }

    // 21. Add columns to Revenue table if not present
    try {
      const revenueTableInfo = await queryInterface.describeTable(Revenue.tableName);
      if (revenueTableInfo.providerId && !revenueTableInfo.providerId.type.toLowerCase().includes('int')) {
        console.log(`Altering 'providerId' column type to INTEGER in ${Revenue.tableName}...`);
        if (sequelize.getDialect() === 'postgres') {
          await sequelize.query(`ALTER TABLE "${Revenue.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId"::text, '[^0-9]', '', 'g'), '')::integer`);
        }
      }
      if (!revenueTableInfo.revenueNumber) {
        console.log(`Adding 'revenueNumber' column to ${Revenue.tableName}...`);
        await queryInterface.addColumn(Revenue.tableName, 'revenueNumber', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!revenueTableInfo.referenceNumber) {
        await queryInterface.addColumn(Revenue.tableName, 'referenceNumber', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!revenueTableInfo.payerName) {
        await queryInterface.addColumn(Revenue.tableName, 'payerName', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!revenueTableInfo.collectionMethod) {
        await queryInterface.addColumn(Revenue.tableName, 'collectionMethod', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!revenueTableInfo.description) {
        await queryInterface.addColumn(Revenue.tableName, 'description', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!revenueTableInfo.notes) {
        await queryInterface.addColumn(Revenue.tableName, 'notes', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!revenueTableInfo.attachmentUrl) {
        await queryInterface.addColumn(Revenue.tableName, 'attachmentUrl', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!revenueTableInfo.isExternal) {
        await queryInterface.addColumn(Revenue.tableName, 'isExternal', {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        });
      }
    } catch (err: any) {
      console.warn("Revenue columns migration warning:", err.message || err);
    }

    // 22. Add new columns to Expense table if not present
    try {
      const expenseTableInfo = await queryInterface.describeTable(Expense.tableName);
      if (!expenseTableInfo.expenseNumber) {
        console.log(`Adding 'expenseNumber' column to ${Expense.tableName}...`);
        await queryInterface.addColumn(Expense.tableName, 'expenseNumber', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!expenseTableInfo.dueDate) {
        await queryInterface.addColumn(Expense.tableName, 'dueDate', {
          type: DataTypes.DATE,
          allowNull: true
        });
      }
      if (!expenseTableInfo.description) {
        await queryInterface.addColumn(Expense.tableName, 'description', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!expenseTableInfo.notes) {
        await queryInterface.addColumn(Expense.tableName, 'notes', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!expenseTableInfo.attachmentUrl) {
        await queryInterface.addColumn(Expense.tableName, 'attachmentUrl', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!expenseTableInfo.isExternal) {
        await queryInterface.addColumn(Expense.tableName, 'isExternal', {
          type: DataTypes.BOOLEAN,
          defaultValue: false
        });
      }
      if (!expenseTableInfo.isTaxable) {
        await queryInterface.addColumn(Expense.tableName, 'isTaxable', {
          type: DataTypes.BOOLEAN,
          defaultValue: true
        });
      }
    } catch (err: any) {
      console.warn("Expense columns migration warning:", err.message || err);
    }

    // 23. Add new columns to Employee table if not present (including employeeCode, branch, providerId)
    try {
      const employeeTableInfo = await queryInterface.describeTable(Employee.tableName);
      if (!employeeTableInfo.employeeCode) {
        console.log(`Adding 'employeeCode' column to ${Employee.tableName}...`);
        await queryInterface.addColumn(Employee.tableName, 'employeeCode', {
          type: DataTypes.STRING,
          allowNull: true,
          unique: true
        });
      }
      if (!employeeTableInfo.branch) {
        console.log(`Adding 'branch' column to ${Employee.tableName}...`);
        await queryInterface.addColumn(Employee.tableName, 'branch', {
          type: DataTypes.STRING,
          defaultValue: 'الفرع الرئيسي'
        });
      }
      if (!employeeTableInfo.providerId) {
        console.log(`Adding 'providerId' column to ${Employee.tableName}...`);
        await queryInterface.addColumn(Employee.tableName, 'providerId', {
          type: DataTypes.INTEGER,
          allowNull: true
        });
      }
      if (!employeeTableInfo.workType) {
        await queryInterface.addColumn(Employee.tableName, 'workType', {
          type: DataTypes.STRING,
          defaultValue: 'fixed'
        });
      }
      if (!employeeTableInfo.requiredHours) {
        await queryInterface.addColumn(Employee.tableName, 'requiredHours', {
          type: DataTypes.FLOAT,
          defaultValue: 8
        });
      }
      if (!employeeTableInfo.shiftStart) {
        await queryInterface.addColumn(Employee.tableName, 'shiftStart', {
          type: DataTypes.STRING,
          defaultValue: '08:00'
        });
      }
      if (!employeeTableInfo.shiftEnd) {
        await queryInterface.addColumn(Employee.tableName, 'shiftEnd', {
          type: DataTypes.STRING,
          defaultValue: '16:00'
        });
      }
      if (!employeeTableInfo.flexibleStartWindowStart) {
        await queryInterface.addColumn(Employee.tableName, 'flexibleStartWindowStart', {
          type: DataTypes.STRING,
          defaultValue: '08:00'
        });
      }
      if (!employeeTableInfo.flexibleStartWindowEnd) {
        await queryInterface.addColumn(Employee.tableName, 'flexibleStartWindowEnd', {
          type: DataTypes.STRING,
          defaultValue: '10:00'
        });
      }
    } catch (err: any) {
      console.warn("Employee columns migration warning:", err.message || err);
    }

    // 24. Add Attendance columns if not present
    try {
      const attendanceTableInfo = await queryInterface.describeTable(Attendance.tableName);
      if (!attendanceTableInfo.delayMinutes) {
        await queryInterface.addColumn(Attendance.tableName, 'delayMinutes', {
          type: DataTypes.INTEGER,
          defaultValue: 0
        });
      }
      if (!attendanceTableInfo.earlyDepartureMinutes) {
        await queryInterface.addColumn(Attendance.tableName, 'earlyDepartureMinutes', {
          type: DataTypes.INTEGER,
          defaultValue: 0
        });
      }
      if (!attendanceTableInfo.workHours) {
        await queryInterface.addColumn(Attendance.tableName, 'workHours', {
          type: DataTypes.FLOAT,
          defaultValue: 0
        });
      }
      if (!attendanceTableInfo.deficitHours) {
        await queryInterface.addColumn(Attendance.tableName, 'deficitHours', {
          type: DataTypes.FLOAT,
          defaultValue: 0
        });
      }
    } catch (err: any) {
      console.warn("Attendance columns migration warning:", err.message || err);
    }

    // Add EmployeeEvaluation new rating columns if not present
    try {
      const evalTableInfo = await queryInterface.describeTable(EmployeeEvaluation.tableName);
      if (!evalTableInfo.speedRating) {
        await queryInterface.addColumn(EmployeeEvaluation.tableName, 'speedRating', {
          type: DataTypes.INTEGER,
          defaultValue: 5
        });
      }
      if (!evalTableInfo.superiorsRating) {
        await queryInterface.addColumn(EmployeeEvaluation.tableName, 'superiorsRating', {
          type: DataTypes.INTEGER,
          defaultValue: 5
        });
      }
      if (!evalTableInfo.teamworkRating) {
        await queryInterface.addColumn(EmployeeEvaluation.tableName, 'teamworkRating', {
          type: DataTypes.INTEGER,
          defaultValue: 5
        });
      }
      if (!evalTableInfo.behaviorRating) {
        await queryInterface.addColumn(EmployeeEvaluation.tableName, 'behaviorRating', {
          type: DataTypes.INTEGER,
          defaultValue: 5
        });
      }
    } catch (err: any) {
      console.warn("EmployeeEvaluation columns migration warning:", err.message || err);
    }

    // 25. Add deletedAt column to User if not present
    try {
      const userTableInfo = await queryInterface.describeTable(User.tableName);
      if (!userTableInfo.deletedAt) {
        console.log(`Adding 'deletedAt' column to ${User.tableName}...`);
        await queryInterface.addColumn(User.tableName, 'deletedAt', {
          type: DataTypes.DATE,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("User deletedAt migration warning:", err.message || err);
    }

    // 26. Add deletedAt column to Hall if not present
    try {
      const hallTableInfo = await queryInterface.describeTable(Hall.tableName);
      if (!hallTableInfo.deletedAt) {
        console.log(`Adding 'deletedAt' column to ${Hall.tableName}...`);
        await queryInterface.addColumn(Hall.tableName, 'deletedAt', {
          type: DataTypes.DATE,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("Hall deletedAt migration warning:", err.message || err);
    }

    // 27. Add deletedAt column to Service if not present
    try {
      const serviceTableInfo = await queryInterface.describeTable(Service.tableName);
      if (!serviceTableInfo.deletedAt) {
        console.log(`Adding 'deletedAt' column to ${Service.tableName}...`);
        await queryInterface.addColumn(Service.tableName, 'deletedAt', {
          type: DataTypes.DATE,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("Service deletedAt migration warning:", err.message || err);
    }

    // 28. Add notesThread and missing columns to PendingProfileUpdate if not present, and alter status column to VARCHAR
    try {
      const pendingProfileTableInfo = await queryInterface.describeTable(PendingProfileUpdate.tableName);
      if (pendingProfileTableInfo.status && sequelize.getDialect() === 'postgres') {
        try {
          await sequelize.query(`ALTER TYPE "enum_pending_profile_updates_status" ADD VALUE IF NOT EXISTS 'needs_revision'`);
        } catch (e) {}
        try {
          await sequelize.query(`ALTER TABLE "${PendingProfileUpdate.tableName}" ALTER COLUMN "status" TYPE VARCHAR(255) USING "status"::varchar`);
        } catch (e) {}
      }
      if (!pendingProfileTableInfo.notesThread) {
        console.log(`Adding 'notesThread' column to ${PendingProfileUpdate.tableName}...`);
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'notesThread', {
          type: DataTypes.JSON,
          defaultValue: [],
          allowNull: true
        });
      }
      if (!pendingProfileTableInfo.userEmail) {
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'userEmail', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!pendingProfileTableInfo.userName) {
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'userName', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!pendingProfileTableInfo.requestedByRole) {
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'requestedByRole', {
          type: DataTypes.STRING,
          defaultValue: 'provider'
        });
      }
      if (!pendingProfileTableInfo.sensitiveFieldsChanged) {
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'sensitiveFieldsChanged', {
          type: DataTypes.JSON,
          allowNull: true
        });
      }
      if (!pendingProfileTableInfo.rejectionReason) {
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'rejectionReason', {
          type: DataTypes.TEXT,
          allowNull: true
        });
      }
      if (!pendingProfileTableInfo.reviewedBy) {
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'reviewedBy', {
          type: DataTypes.STRING,
          allowNull: true
        });
      }
      if (!pendingProfileTableInfo.reviewedAt) {
        await queryInterface.addColumn(PendingProfileUpdate.tableName, 'reviewedAt', {
          type: DataTypes.DATE,
          allowNull: true
        });
      }
    } catch (err: any) {
      console.warn("PendingProfileUpdate migration warning:", err.message || err);
    }

  } catch (err: any) {
    console.warn("Database dynamic pre-migration check warning:", err.message || err);
  }

  await sequelize.sync();

  // Pre-seed default RevenueType and other roles/employees
  try {
    const typeCount = await RevenueType.count();
    if (typeCount === 0) {
      await RevenueType.bulkCreate([
        { name: 'عمولة حجز قاعات', key: 'commission', isSystem: true },
        { name: 'اشتراكات شركاء المنصة', key: 'subscription', isSystem: true },
        { name: 'مبيعات خدمات مساندة إضافية', key: 'addon', isSystem: true },
        { name: 'إيراد حملات تسويقية', key: 'marketing', isSystem: true },
        { name: 'إيرادات خارجية عامة', key: 'external', isSystem: false }
      ]);
      console.log("Seeded default RevenueTypes successfully.");
    }
  } catch (err: any) {
    console.warn("RevenueType seeding warning:", err.message || err);
  }

  // Pre-seed default ExpenseCategory
  try {
    const expenseCatCount = await ExpenseCategory.count();
    if (expenseCatCount === 0) {
      await ExpenseCategory.bulkCreate([
        { name: 'رواتب', key: 'salaries', isSystem: true },
        { name: 'تسويق', key: 'marketing', isSystem: true },
        { name: 'خدمات', key: 'services', isSystem: true },
        { name: 'استضافة', key: 'hosting', isSystem: true },
        { name: 'تبرعات', key: 'donations', isSystem: true },
        { name: 'أخرى', key: 'other', isSystem: true }
      ]);
      console.log("Seeded default ExpenseCategories successfully.");
    }
  } catch (err: any) {
    console.warn("ExpenseCategory seeding warning:", err.message || err);
  }

  // Pre-seed default Role and Employee at start to prevent runtime authentication race conditions
  try {
    let adminRole = await Role.findOne({ where: { name: 'مدير النظام' } });
    if (!adminRole) {
      adminRole = await Role.create({
        name: 'مدير النظام',
        permissions: { '*': ['view', 'add', 'edit', 'delete', 'ban'] },
        status: 'active'
      });
    }

    let adminEmployee = await Employee.findOne({ where: { email: 'admin@system.local' } });
    if (!adminEmployee) {
      await Employee.create({
        fullName: 'Admin User',
        nationalId: '1234567890',
        qualification: 'Bachelors',
        avatarUrl: '',
        phone: '0500000000',
        email: 'admin@system.local',
        nationalAddress: '123 Riyadh',
        region: 'Riyadh',
        city: 'Riyadh',
        jobTitle: 'المدير العام (Admin)',
        permissions: { '*': ['view', 'add', 'edit', 'delete', 'ban'] },
        RoleId: adminRole.id,
        status: 'active'
      });
    }
  } catch (error) {
    console.error("Error during database pre-seeding:", error);
  }

  // Pre-seed default AuditLogs in database
  try {
    const auditCount = await AuditLog.count();
    if (auditCount === 0) {
      await AuditLog.bulkCreate([
        {
          action: 'تعديل مصفوفة الصلاحيات',
          entityType: 'إدارة القاعات والصالات',
          entityId: 'AUD-26-0000000008',
          details: {
            refNo: 'AUD-26-0000000008',
            supervisor: 'م. عبد العزيز الغامدي (المدير العام)',
            actionType: 'تعديل مصفوفة الصلاحيات',
            targetEntity: 'إدارة القاعات والصالات',
            technicalDetails: 'تم تفعيل صلاحيات [العرض، الإنشاء، التعديل] وتعطيل [الحذف] لدور مسؤول قاعات. (IP: 192.168.1.12 | HMAC-SHA256: e3b0c442)',
            dateTime: '2026-08-05T00:35:12.000Z',
            isSensitive: true,
            encryptionType: 'AES-256-GCM / SHA-256'
          }
        },
        {
          action: 'منح صلاحية مؤقتة',
          entityType: 'الموظف: عبد الرحمن الحربي',
          entityId: 'AUD-26-0000000007',
          details: {
            refNo: 'AUD-26-0000000007',
            supervisor: 'د. سارة السديري (مدير الأمن والحوكمة)',
            actionType: 'منح صلاحية مؤقتة',
            targetEntity: 'الموظف: عبد الرحمن الحربي',
            technicalDetails: 'ترخيص استثنائي لمدة 120 دقيقة للوصول للتقارير المالية المتقدمة. (Session Token: #TK-9821)',
            dateTime: '2026-08-04T22:15:40.000Z',
            isSensitive: true,
            encryptionType: 'AES-256-GCM / SHA-256'
          }
        },
        {
          action: 'مزامنة الدليل النشط',
          entityType: 'خادم LDAP الرئيسي (LAILAH.SA)',
          entityId: 'AUD-26-0000000006',
          details: {
            refNo: 'AUD-26-0000000006',
            supervisor: 'النظام الآلي (LDAP Directory Sync)',
            actionType: 'مزامنة الدليل النشط',
            targetEntity: 'خادم LDAP الرئيسي (LAILAH.SA)',
            technicalDetails: 'استعلام وتحديث بيانات 42 موظفاً واستبدال مجموعات الوصول (Base DN: dc=lailah,dc=sa).',
            dateTime: '2026-08-04T20:00:00.000Z',
            isSensitive: false,
            encryptionType: 'TLS 1.3 / AES-256'
          }
        },
        {
          action: 'تفويض دور وظيفي',
          entityType: 'الموظف: أحمد علي العتيبي',
          entityId: 'AUD-26-0000000005',
          details: {
            refNo: 'AUD-26-0000000005',
            supervisor: 'م. عبد العزيز الغامدي (المدير العام)',
            actionType: 'تفويض دور وظيفي',
            targetEntity: 'الموظف: أحمد علي العتيبي',
            technicalDetails: 'ترفيع الدور من [مدخل بيانات] إلى [محاسب مالي معتمد]. (Approval Hash: #AP-77312)',
            dateTime: '2026-08-04T16:45:22.000Z',
            isSensitive: true,
            encryptionType: 'AES-256-GCM / SHA-256'
          }
        },
        {
          action: 'إنشاء قالب دور جديد',
          entityType: 'منسق حافلات وضيافة',
          entityId: 'AUD-26-0000000004',
          details: {
            refNo: 'AUD-26-0000000004',
            supervisor: 'م. خالد الشهري (مشرف النظام)',
            actionType: 'إنشاء قالب دور جديد',
            targetEntity: 'منسق حافلات وضيافة',
            technicalDetails: 'إضافة قالب دور وظيفي مخصص بصلاحيات عرض وتعديل المواعيد المباشرة.',
            dateTime: '2026-08-03T11:20:05.000Z',
            isSensitive: false,
            encryptionType: 'AES-256-GCM / SHA-256'
          }
        },
        {
          action: 'اعتماد ثنائي (Maker-Checker)',
          entityType: 'حجز BKG-26-0000000124',
          entityId: 'AUD-26-0000000003',
          details: {
            refNo: 'AUD-26-0000000003',
            supervisor: 'د. سارة السديري (مدير الأمن والحوكمة)',
            actionType: 'اعتماد ثنائي (Maker-Checker)',
            targetEntity: 'حجز BKG-26-0000000124',
            technicalDetails: 'الموافقة على طلب إلغاء حجز مؤكد ومفوتر مع تسوية عربون بقيمة 5,000 ر.س.',
            dateTime: '2026-08-02T14:10:30.000Z',
            isSensitive: true,
            encryptionType: 'AES-256-GCM / SHA-256'
          }
        },
        {
          action: 'تأكيد الربط الضريبي',
          entityType: 'وحدة الفوترة الإلكترونية',
          entityId: 'AUD-26-0000000002',
          details: {
            refNo: 'AUD-26-0000000002',
            supervisor: 'النظام الآلي (Zatca Compliance Bot)',
            actionType: 'تأكيد الربط الضريبي',
            targetEntity: 'وحدة الفوترة الإلكترونية',
            technicalDetails: 'مراجعة أختام وتشفير الفواتير الصادرة وتأكيد التوافق مع متطلبات المرحلة الثانية.',
            dateTime: '2026-08-01T09:00:00.000Z',
            isSensitive: false,
            encryptionType: 'ECDSA / SHA-256'
          }
        },
        {
          action: 'تحديث صلاحيات فردية',
          entityType: 'الموظف: محمد القحطاني',
          entityId: 'AUD-26-0000000001',
          details: {
            refNo: 'AUD-26-0000000001',
            supervisor: 'م. عبد العزيز الغامدي (المدير العام)',
            actionType: 'تحديث صلاحيات فردية',
            targetEntity: 'الموظف: محمد القحطاني',
            technicalDetails: 'تعديل تبويبات الصلاحيات الفردية ومنح إمكانية الوصول للوحة التحكم الضريبية.',
            dateTime: '2026-07-31T18:30:15.000Z',
            isSensitive: true,
            encryptionType: 'AES-256-GCM / SHA-256'
          }
        }
      ]);
      console.log("Seeded default AuditLogs successfully.");
    }
  } catch (err: any) {
    console.warn("AuditLog seeding warning:", err.message || err);
  }

  // Pre-seed Gateway Capabilities Matrix (Section 10.2 of Architecture Doc)
  try {
    const capCount = await GatewayCapability.count();
    if (capCount === 0) {
      await GatewayCapability.bulkCreate([
        { gatewayName: 'moyasar', splitAtPayment: 'logical_only', beneficiaryOnboarding: 'api', deferredPayout: 'platform_schedule', cancelScheduledPayout: true, reversePaidPayout: false, partialRefund: true },
        { gatewayName: 'paytabs', splitAtPayment: 'native', beneficiaryOnboarding: 'api', deferredPayout: 'native_schedule', cancelScheduledPayout: true, reversePaidPayout: true, partialRefund: true },
        { gatewayName: 'hyperpay', splitAtPayment: 'native', beneficiaryOnboarding: 'api', deferredPayout: 'native_schedule', cancelScheduledPayout: true, reversePaidPayout: true, partialRefund: true },
        { gatewayName: 'geidea', splitAtPayment: 'logical_only', beneficiaryOnboarding: 'dashboard', deferredPayout: 'platform_schedule', cancelScheduledPayout: true, reversePaidPayout: false, partialRefund: true },
        { gatewayName: 'tabby', splitAtPayment: 'logical_only', beneficiaryOnboarding: 'api', deferredPayout: 'platform_schedule', cancelScheduledPayout: false, reversePaidPayout: false, partialRefund: true },
        { gatewayName: 'tamara', splitAtPayment: 'logical_only', beneficiaryOnboarding: 'api', deferredPayout: 'platform_schedule', cancelScheduledPayout: false, reversePaidPayout: false, partialRefund: true }
      ]);
      console.log("Seeded Gateway Capability Matrix successfully.");
    }
  } catch (err: any) {
    console.warn("Gateway Capability Matrix seeding warning:", err.message || err);
  }
}

export * from './PaymentArchitectureModels.js';

