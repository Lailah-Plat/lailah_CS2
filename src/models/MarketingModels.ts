import { Sequelize, DataTypes, Model, Op } from 'sequelize';
import { sequelize } from './Database.js';

// Agency Agreements
export class AgencyAgreement extends Model {
  declare id: number;
  declare agencyId: string;
  declare platformFeePercentage: number;
  declare status: 'active' | 'suspended';
}

AgencyAgreement.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  agencyId: { type: DataTypes.STRING, allowNull: false, unique: true },
  platformFeePercentage: { type: DataTypes.FLOAT, defaultValue: 20 },
  status: { type: DataTypes.ENUM('active', 'suspended'), defaultValue: 'active' }
}, { sequelize, modelName: 'AgencyAgreement' });

// Marketing Campaigns
export class MarketingCampaign extends Model {
  declare id: number;
  declare title: string;
  declare providerId: number;
  declare agencyId: string;
  
  // Campaign Structure (6-Steps)
  declare goalMetric: string;
  declare targetAudience: string;
  declare coreMessage: string;
  declare channel: string;
  declare offer: string;
  declare followUpMethod: string;
  
  // External Links
  declare assetsLink: string;
  declare reportsLink: string;
  declare lookerStudioLink: string;
  declare boardsLink: string;

  declare startDate: string;
  declare endDate: string;
  declare workflowStatus: 'In Progress' | 'Pending Approval' | 'Scheduled' | 'Live Results' | 'Draft';
  
  // Financials
  declare totalPaid: number;
  declare adBudget: number;
  declare agencyFee: number;
  declare platformCommission: number;
  declare agencyNetProfit: number;
  
  declare cpa: number;
  declare status: 'pending' | 'active' | 'completed' | 'cancelled';
  declare createdAt: Date;
}

MarketingCampaign.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: DataTypes.STRING, allowNull: false, defaultValue: 'حملة جديدة' },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  agencyId: { type: DataTypes.STRING, allowNull: false },

  goalMetric: { type: DataTypes.STRING, allowNull: true },
  targetAudience: { type: DataTypes.STRING, allowNull: true },
  coreMessage: { type: DataTypes.STRING, allowNull: true },
  channel: { type: DataTypes.STRING, allowNull: true },
  offer: { type: DataTypes.STRING, allowNull: true },
  followUpMethod: { type: DataTypes.STRING, allowNull: true },

  assetsLink: { type: DataTypes.STRING, allowNull: true },
  reportsLink: { type: DataTypes.STRING, allowNull: true },
  lookerStudioLink: { type: DataTypes.STRING, allowNull: true },
  boardsLink: { type: DataTypes.STRING, allowNull: true },

  startDate: { type: DataTypes.STRING, allowNull: true },
  endDate: { type: DataTypes.STRING, allowNull: true },
  workflowStatus: { type: DataTypes.ENUM('In Progress', 'Pending Approval', 'Scheduled', 'Live Results', 'Draft'), defaultValue: 'Draft' },

  totalPaid: { type: DataTypes.FLOAT, defaultValue: 0 },
  adBudget: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  agencyFee: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  platformCommission: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
  agencyNetProfit: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },

  cpa: { type: DataTypes.FLOAT, defaultValue: 0 },
  status: { type: DataTypes.ENUM('pending', 'active', 'completed', 'cancelled'), defaultValue: 'pending' },
  createdAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'MarketingCampaign' });

// Campaign Expenses
export class CampaignExpense extends Model {
  declare id: number;
  declare campaignId: number;
  declare amount: number;
  declare category: string;
  declare note: string;
  declare receiptUrl: string;
  declare date: Date;
}

CampaignExpense.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  campaignId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.FLOAT, allowNull: false },
  category: { type: DataTypes.STRING, defaultValue: 'Ads' },
  note: { type: DataTypes.STRING, allowNull: false },
  receiptUrl: { type: DataTypes.STRING, allowNull: true },
  date: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, { sequelize, modelName: 'CampaignExpense' });

// Agency Proposals (MPR-YY-XXXXXXXXXX)
export class AgencyProposal extends Model {
  declare id: number;
  declare proposalNumber: string;
  declare srvNumber: string;
  declare campaignRequestId: string;
  declare providerName: string;
  declare agencyId: string;
  declare agencyName: string;
  declare title: string;
  declare goalStrategy: string;
  declare targetAudience: string;
  declare proposedChannels: string;
  declare adBudget: number;
  declare agencyFee: number;
  declare totalBudget: number;
  declare platformCommissionBps: number;
  declare startDate: string;
  declare endDate: string;
  declare status: 'Submitted' | 'Accepted' | 'ModificationRequested' | 'Rejected';
  declare providerFeedback: string;
}

AgencyProposal.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  proposalNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  srvNumber: { type: DataTypes.STRING, allowNull: false },
  campaignRequestId: { type: DataTypes.STRING, allowNull: true },
  providerName: { type: DataTypes.STRING, allowNull: false },
  agencyId: { type: DataTypes.STRING, allowNull: false, defaultValue: 'main_agency' },
  agencyName: { type: DataTypes.STRING, defaultValue: 'وكالة ليلة التسويقية' },
  title: { type: DataTypes.STRING, allowNull: false },
  goalStrategy: { type: DataTypes.TEXT, allowNull: true },
  targetAudience: { type: DataTypes.STRING, allowNull: true },
  proposedChannels: { type: DataTypes.STRING, allowNull: true },
  adBudget: { type: DataTypes.FLOAT, defaultValue: 0 },
  agencyFee: { type: DataTypes.FLOAT, defaultValue: 0 },
  totalBudget: { type: DataTypes.FLOAT, defaultValue: 0 },
  platformCommissionBps: { type: DataTypes.INTEGER, defaultValue: 2000 },
  startDate: { type: DataTypes.STRING, allowNull: true },
  endDate: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('Submitted', 'Accepted', 'ModificationRequested', 'Rejected'), defaultValue: 'Submitted' },
  providerFeedback: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, modelName: 'AgencyProposal' });

// Administrative Marketing Grants (حالة الحملة المجانية أو الممنوحة للمزودين)
export class AdministrativeMarketingGrant extends Model {
  declare id: number;
  declare grantNumber: string;
  declare srvNumber: string;
  declare campaignId: string;
  declare providerId: number;
  declare providerName: string;
  declare grantReason: string;
  declare grantedBudget: number;
  declare agencyFeeCovered: number;
  declare budgetSource: string;
  declare costCenter: string;
  declare financialImpact: string;
  declare creatorEmployeeId: string;
  declare creatorEmployeeName: string;
  declare approvingManagerId: string;
  declare approvingManagerName: string;
  declare status: 'PendingManagerApproval' | 'Approved' | 'Rejected';
  declare startDate: string;
  declare endDate: string;
  declare auditLog: string;
}

AdministrativeMarketingGrant.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  grantNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  srvNumber: { type: DataTypes.STRING, allowNull: false },
  campaignId: { type: DataTypes.STRING, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  providerName: { type: DataTypes.STRING, allowNull: false },
  grantReason: { type: DataTypes.TEXT, allowNull: false },
  grantedBudget: { type: DataTypes.FLOAT, defaultValue: 0 },
  agencyFeeCovered: { type: DataTypes.FLOAT, defaultValue: 0 },
  budgetSource: { type: DataTypes.STRING, defaultValue: 'ميزانية المنح التسويقية للمنصة' },
  costCenter: { type: DataTypes.STRING, defaultValue: 'مركز كلفة التسويق والنمو - ليلة' },
  financialImpact: { type: DataTypes.STRING, defaultValue: 'مصروفات تسويقية مباشرة محتملة بواسطة المنصة' },
  creatorEmployeeId: { type: DataTypes.STRING, allowNull: false },
  creatorEmployeeName: { type: DataTypes.STRING, allowNull: false },
  approvingManagerId: { type: DataTypes.STRING, allowNull: true },
  approvingManagerName: { type: DataTypes.STRING, allowNull: true },
  status: { type: DataTypes.ENUM('PendingManagerApproval', 'Approved', 'Rejected'), defaultValue: 'PendingManagerApproval' },
  startDate: { type: DataTypes.STRING, allowNull: true },
  endDate: { type: DataTypes.STRING, allowNull: true },
  auditLog: { type: DataTypes.TEXT, allowNull: true }
}, { sequelize, modelName: 'AdministrativeMarketingGrant' });

import { User } from './UserModels.js';

// Relationships
AgencyAgreement.hasMany(MarketingCampaign, { foreignKey: 'agencyId', sourceKey: 'agencyId' });
MarketingCampaign.belongsTo(AgencyAgreement, { foreignKey: 'agencyId', targetKey: 'agencyId' });

MarketingCampaign.hasMany(CampaignExpense, { foreignKey: 'campaignId' });
CampaignExpense.belongsTo(MarketingCampaign, { foreignKey: 'campaignId' });

MarketingCampaign.belongsTo(User, { foreignKey: 'providerId', as: 'providerUser' });
User.hasMany(MarketingCampaign, { foreignKey: 'providerId', as: 'marketingCampaigns' });

export async function syncMarketingModels() {
  try {
    const queryInterface = sequelize.getQueryInterface();
    const tableInfo = await queryInterface.describeTable(MarketingCampaign.tableName);
    if (tableInfo.providerId && !tableInfo.providerId.type.toLowerCase().includes('int')) {
      console.log(`Altering 'providerId' column type to INTEGER in ${MarketingCampaign.tableName}...`);
      await sequelize.query(`ALTER TABLE "${MarketingCampaign.tableName}" ALTER COLUMN "providerId" TYPE INTEGER USING NULLIF(REGEXP_REPLACE("providerId", '[^0-9]', '', 'g'), '')::integer`);
      console.log(`Column 'providerId' in ${MarketingCampaign.tableName} altered successfully to INTEGER.`);
    }
  } catch (err: any) {
    console.warn("MarketingCampaign migration warning:", err.message || err);
  }
  await sequelize.sync();
}

export async function createMarketingCampaign(providerId: number, agencyId: string, payload: Partial<MarketingCampaign>) {
  const agreement = await AgencyAgreement.findOne({ where: { agencyId, status: 'active' } });
  if (!agreement) throw new Error('No active agreement found for this agency.');

  const adBudget = payload.adBudget || 0;
  const agencyFee = payload.agencyFee || 0;
  
  // Financial Logic Split
  const platformCommission = agencyFee * (agreement.platformFeePercentage / 100);
  const agencyNetProfit = agencyFee - platformCommission;

  const campaign = await MarketingCampaign.create({
    ...payload,
    providerId,
    agencyId,
    adBudget,
    agencyFee,
    platformCommission,
    agencyNetProfit,
    totalPaid: adBudget + agencyFee,
  });

  return campaign;
}

export async function addCampaignExpense(campaignId: number, amount: number, note: string, category: string = 'Ads') {
  const campaign = await MarketingCampaign.findByPk(campaignId);
  if (!campaign) throw new Error('Campaign not found.');

  const expenses = await CampaignExpense.sum('amount', { where: { campaignId } }) || 0;
  if (expenses + amount > campaign.adBudget) {
    throw new Error('Expense exceeds available Ad Budget. You can only spend from the ad budget.');
  }

  const expense = await CampaignExpense.create({
    campaignId,
    amount,
    category,
    note
  });
  
  return expense;
}
