import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

export class Ticket extends Model {
  declare id: number;
  declare title: string;
  declare description: string;
  declare status: 'مفتوحة' | 'قيد المعالجة' | 'بانتظار العميل' | 'مغلقة' | 'مخالفة الأولوية';
  declare priority: 'عالية جدا' | 'عالية' | 'متوسطة' | 'منخفضة';
  declare department: string;
  declare customerId: number;
  declare assignedAgentId: number | null;
  declare slaDeadline: Date;
  declare firstResponseTime: Date | null;
  declare closedAt: Date | null;
}
Ticket.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('مفتوحة', 'قيد المعالجة', 'بانتظار العميل', 'مغلقة', 'مخالفة الأولوية'),
    defaultValue: 'مفتوحة'
  },
  priority: {
    type: DataTypes.ENUM('عالية جدا', 'عالية', 'متوسطة', 'منخفضة'),
    defaultValue: 'متوسطة'
  },
  department: {
    type: DataTypes.STRING,
    allowNull: false
  },
  customerId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  assignedAgentId: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  slaDeadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  firstResponseTime: {
    type: DataTypes.DATE,
    allowNull: true
  },
  closedAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, { sequelize, modelName: 'Ticket', tableName: 'Tickets' });

export class TicketMessage extends Model {
  declare id: number;
  declare ticketId: number;
  declare senderId: number;
  declare senderType: 'عميل' | 'موظف' | 'نظام';
  declare message: string;
  declare attachments: any;
}
TicketMessage.init({
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: Ticket,
      key: 'id'
    }
  },
  senderId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  senderType: {
    type: DataTypes.ENUM('عميل', 'موظف', 'نظام'),
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  attachments: {
    type: DataTypes.JSON, // Array of URLs
    allowNull: true
  }
}, { sequelize, modelName: 'TicketMessage', tableName: 'TicketMessages' });

// Associations
// Ticket.hasMany(TicketMessage, { foreignKey: 'ticketId' });
// TicketMessage.belongsTo(Ticket, { foreignKey: 'ticketId' });

export async function syncSupportModels() {
  try {
    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tickets') THEN
          IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Tickets_id_seq') THEN
            CREATE SEQUENCE "Tickets_id_seq";
          END IF;
          ALTER TABLE "Tickets" ALTER COLUMN id SET DEFAULT nextval('Tickets_id_seq');
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TicketMessages') THEN
          IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'TicketMessages_id_seq') THEN
            CREATE SEQUENCE "TicketMessages_id_seq";
          END IF;
          ALTER TABLE "TicketMessages" ALTER COLUMN id SET DEFAULT nextval('TicketMessages_id_seq');
        END IF;
      END $$;
    `);
  } catch (e) {
    // ignore if not postgres or missing permissions
  }

  await Ticket.sync();
  await TicketMessage.sync();

  try {
    await sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Tickets') THEN
          IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'Tickets_id_seq') THEN
            CREATE SEQUENCE "Tickets_id_seq";
          END IF;
          ALTER TABLE "Tickets" ALTER COLUMN id SET DEFAULT nextval('Tickets_id_seq');
          PERFORM setval('Tickets_id_seq', COALESCE((SELECT MAX(id) FROM "Tickets"), 1));
        END IF;

        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'TicketMessages') THEN
          IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'TicketMessages_id_seq') THEN
            CREATE SEQUENCE "TicketMessages_id_seq";
          END IF;
          ALTER TABLE "TicketMessages" ALTER COLUMN id SET DEFAULT nextval('TicketMessages_id_seq');
          PERFORM setval('TicketMessages_id_seq', COALESCE((SELECT MAX(id) FROM "TicketMessages"), 1));
        END IF;
      END $$;
    `);
  } catch (e) {
    // ignore
  }
}
