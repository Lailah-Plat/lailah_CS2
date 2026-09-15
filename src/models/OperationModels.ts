import { DataTypes, Model, Op } from "sequelize";
import { sequelize } from "./dbInstance.js";

export interface PriorityReason {
  code: string;
  label: string;
  weight: number;
}

export class OperationalCase extends Model {
  declare id: number;
  declare caseId: string; // OPS-26-XXXXXXXXXX
  declare caseType: 
    | 'PROVIDER_APPROVAL'
    | 'VENUE_APPROVAL'
    | 'HALL_APPROVAL'
    | 'SERVICE_APPROVAL'
    | 'BOOKING_ATTENTION'
    | 'SERVICE_REQUEST_STALLED'
    | 'PROVIDER_DEADLINE_EXPIRED'
    | 'PAYMENT_FAILED'
    | 'FINANCIAL_MISMATCH'
    | 'WEBHOOK_FAILED'
    | 'SETTLEMENT_STALLED'
    | 'REFUND_REQUEST'
    | 'FINANCIAL_DISPUTE'
    | 'OPERATIONAL_COMPLAINT'
    | 'PROVIDER_CANCELLATION_REQUEST'
    | 'EXPIRED_DOCUMENT'
    | 'VIOLATION_REVIEW'
    | 'INTEGRATION_FAILURE'
    | 'CROSS_DEPARTMENT_COORDINATION';
  
  declare title: string;
  declare description: string;
  declare source: 'SYSTEM_EVENT' | 'WORKFLOW_RULE' | 'DEADLINE_WORKER' | 'PAYMENT_WEBHOOK' | 'MANUAL_STAFF' | 'CUSTOMER_DISPUTE' | 'PROVIDER_REQUEST';
  declare sourceEventId: string | null;
  declare sourceEntityType: 'Booking' | 'Service' | 'Hall' | 'SupportServiceRequest' | 'User' | 'Provider' | 'Settlement' | 'Dispute' | 'Invoice';
  declare sourceEntityId: string;
  
  declare priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  declare priorityReasons: PriorityReason[];
  
  declare status: 'NEW' | 'TRIAGED' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_EXTERNAL' | 'ESCALATED' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
  
  declare assignedUserId: number | null;
  declare assignedUserName: string | null;
  declare assignedTeamId: string | null; // e.g., 'SUPPORT', 'FINANCE', 'DISPUTES', 'VERIFICATION', 'LOGISTICS'
  declare assignedTeamName: string | null;
  
  declare dueAt: Date;
  declare firstResponseAt: Date | null;
  declare resolvedAt: Date | null;
  declare closedAt: Date | null;
  
  declare isSlaPaused: boolean;
  declare slaPauseReason: string | null;
  declare slaPausedAt: Date | null;
  
  declare escalationLevel: number; // 0 = normal, 1 = supervisor, 2 = head of operations, 3 = sovereign executive
  declare financialImpact: number; // in Halalas or SAR
  declare customerImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'BLOCKING';
  declare eventDate: string | null; // YYYY-MM-DD
  
  declare resolutionCode: string | null;
  declare resolutionSummary: string | null;
  declare createdBy: string; // 'SYSTEM' or User name/email
  declare deduplicationKey: string; // type + entityType + entityId + activeReason
  declare version: number;
  declare metadata: object;
}

OperationalCase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    caseId: {
      type: DataTypes.STRING(32),
      allowNull: false,
      unique: true
    },
    caseType: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    source: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'SYSTEM_EVENT'
    },
    sourceEventId: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    sourceEntityType: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    sourceEntityId: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    priority: {
      type: DataTypes.ENUM('CRITICAL', 'HIGH', 'MEDIUM', 'LOW'),
      allowNull: false,
      defaultValue: 'MEDIUM'
    },
    priorityReasons: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: []
    },
    status: {
      type: DataTypes.ENUM(
        'NEW',
        'TRIAGED',
        'ASSIGNED',
        'IN_PROGRESS',
        'WAITING_EXTERNAL',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
        'REOPENED'
      ),
      allowNull: false,
      defaultValue: 'NEW'
    },
    assignedUserId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    assignedUserName: {
      type: DataTypes.STRING(128),
      allowNull: true
    },
    assignedTeamId: {
      type: DataTypes.STRING(64),
      allowNull: true,
      defaultValue: 'SUPPORT'
    },
    assignedTeamName: {
      type: DataTypes.STRING(128),
      allowNull: true,
      defaultValue: 'فريق الدعم والعمليات'
    },
    dueAt: {
      type: DataTypes.DATE,
      allowNull: false
    },
    firstResponseAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    resolvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    closedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    isSlaPaused: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    slaPauseReason: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    slaPausedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    escalationLevel: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    financialImpact: {
      type: DataTypes.BIGINT,
      defaultValue: 0
    },
    customerImpact: {
      type: DataTypes.STRING(32),
      defaultValue: 'MEDIUM'
    },
    eventDate: {
      type: DataTypes.STRING(32),
      allowNull: true
    },
    resolutionCode: {
      type: DataTypes.STRING(64),
      allowNull: true
    },
    resolutionSummary: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.STRING(128),
      defaultValue: 'SYSTEM'
    },
    deduplicationKey: {
      type: DataTypes.STRING(191),
      allowNull: false
    },
    version: {
      type: DataTypes.INTEGER,
      defaultValue: 1
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'OperationalCase',
    tableName: 'operational_cases',
    indexes: [
      { fields: ['caseId'], unique: true },
      { fields: ['deduplicationKey'] },
      { fields: ['status'] },
      { fields: ['priority'] },
      { fields: ['assignedUserId'] },
      { fields: ['assignedTeamId'] },
      { fields: ['sourceEntityType', 'sourceEntityId'] },
      { fields: ['dueAt'] }
    ]
  }
);

export class OperationalCaseActivity extends Model {
  declare id: number;
  declare caseId: string;
  declare activityType: 
    | 'CREATED'
    | 'STATUS_CHANGE'
    | 'ASSIGNMENT'
    | 'ESCALATION'
    | 'INTERNAL_NOTE'
    | 'CUSTOMER_MESSAGE'
    | 'PROVIDER_MESSAGE'
    | 'SLA_PAUSE'
    | 'SLA_RESUME'
    | 'DOCUMENT_VIEWED'
    | 'PAYMENT_AUDIT'
    | 'RESOLVED'
    | 'CLOSED'
    | 'REOPENED'
    | 'SYSTEM_EVENT';
  
  declare authorId: number | null;
  declare authorName: string;
  declare authorRole: string; // 'ADMIN' | 'SUPPORT_AGENT' | 'SYSTEM' | 'FINANCE_MANAGER'
  declare previousValue: string | null;
  declare newValue: string | null;
  declare message: string;
  declare metadata: object;
}

OperationalCaseActivity.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    caseId: {
      type: DataTypes.STRING(32),
      allowNull: false
    },
    activityType: {
      type: DataTypes.STRING(64),
      allowNull: false
    },
    authorId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    authorName: {
      type: DataTypes.STRING(128),
      allowNull: false,
      defaultValue: 'النظام الآلي'
    },
    authorRole: {
      type: DataTypes.STRING(64),
      allowNull: false,
      defaultValue: 'SYSTEM'
    },
    previousValue: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    newValue: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    metadata: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: {}
    }
  },
  {
    sequelize,
    modelName: 'OperationalCaseActivity',
    tableName: 'operational_case_activities',
    indexes: [
      { fields: ['caseId'] },
      { fields: ['activityType'] },
      { fields: ['createdAt'] }
    ]
  }
);

// Synchronize models if needed
OperationalCase.hasMany(OperationalCaseActivity, { foreignKey: 'caseId', sourceKey: 'caseId', as: 'activities' });
OperationalCaseActivity.belongsTo(OperationalCase, { foreignKey: 'caseId', targetKey: 'caseId', as: 'case' });

export async function initOperationsDatabase() {
  try {
    // Safely cleanup any temporary backup tables left behind by interrupted SQLite operations
    try {
      await sequelize.query("DROP TABLE IF EXISTS operational_cases_backup;");
      await sequelize.query("DROP TABLE IF EXISTS operational_case_activities_backup;");
    } catch {
      // Ignore if dialect does not support or table does not exist
    }

    await OperationalCase.sync();
    await OperationalCaseActivity.sync();
    console.log("✅ Operational Cases & Activities database tables synchronized successfully.");
  } catch (err: any) {
    console.error("⚠️ Notice while syncing OperationalCase tables:", err.message || err);
  }
}
