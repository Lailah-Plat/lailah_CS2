import { DataTypes, Model } from "sequelize";
import { sequelize } from "./Database.js";

// Review Model (التقييمات بقاعدة البيانات)
export class Review extends Model {
  declare id: number;
  declare targetType: string;
  declare targetId: number | string;
  declare targetName: string;
  declare customerName: string;
  declare rating: number;
  declare comment: string;
  declare date: string;
  declare status: string;
  declare providerName: string | null;
  declare agentName: string | null;
  declare resolution: boolean | null;
  declare employeeRating: number | null;
  declare userId: number | null;
  declare providerId: number | null;
}

Review.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  targetType: { type: DataTypes.STRING, allowNull: false },
  targetId: { type: DataTypes.STRING, allowNull: false },
  targetName: { type: DataTypes.STRING, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: { type: DataTypes.TEXT, allowNull: false },
  date: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, defaultValue: 'published' },
  providerName: { type: DataTypes.STRING, allowNull: true },
  agentName: { type: DataTypes.STRING, allowNull: true },
  resolution: { type: DataTypes.BOOLEAN, allowNull: true },
  employeeRating: { type: DataTypes.INTEGER, allowNull: true },
  userId: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true }
}, { sequelize, modelName: 'Review', tableName: 'Reviews' });

// ServiceChat Model (محادثات الدعم الفني والخدمات)
export class ServiceChat extends Model {
  declare id: number;
  declare customerId: number;
  declare customerName: string;
  declare agentId: number | null;
  declare agentName: string | null;
  declare status: string; // 'waiting', 'active', 'ended'
  declare topic: string | null;
  declare department: string | null;
}

ServiceChat.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  agentId: { type: DataTypes.INTEGER, allowNull: true },
  agentName: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.STRING, defaultValue: 'waiting' },
  topic: { type: DataTypes.STRING, allowNull: true },
  department: { type: DataTypes.STRING, allowNull: true }
}, { sequelize, modelName: 'ServiceChat', tableName: 'ServiceChats' });

// ServiceChatMessage Model (رسائل محادثات الدعم والخدمة)
export class ServiceChatMessage extends Model {
  declare id: number;
  declare chatId: number;
  declare text: string;
  declare senderType: string; // 'customer', 'agent', 'system'
  declare senderName: string;
  declare time: string;
}

ServiceChatMessage.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  chatId: { type: DataTypes.INTEGER, allowNull: false },
  text: { type: DataTypes.TEXT, allowNull: false },
  senderType: { type: DataTypes.STRING, allowNull: false },
  senderName: { type: DataTypes.STRING, allowNull: false },
  time: { type: DataTypes.STRING, allowNull: false }
}, { sequelize, modelName: 'ServiceChatMessage', tableName: 'ServiceChatMessages' });

export async function syncFeedbackModels() {
  await Promise.all([
    Review.sync(),
    ServiceChat.sync(),
    ServiceChatMessage.sync()
  ]);
}
