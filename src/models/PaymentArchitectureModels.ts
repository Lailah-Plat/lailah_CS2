import { DataTypes, Model } from 'sequelize';
import { sequelize } from './dbInstance.js';

/**
 * 1. SplitTransaction Model
 * Represents the immutable snapshot of payment splits created at capture time.
 */
export class SplitTransaction extends Model {
  declare id: string;
  declare paymentId: string;
  declare bookingId: number;
  declare providerId: number | null;
  declare role: 'platform' | 'provider' | 'gateway_fee' | 'tax' | 'discount' | 'reserve' | 'other';
  declare type: 'fixed' | 'percentage';
  declare amount: number; // In Halalas (BIGINT or number)
  declare percentage: number | null;
  declare status: 'pending' | 'held' | 'available' | 'paid' | 'refunded' | 'reversed' | 'cancelled';
  declare refundable: boolean;
  declare feeSource: string;
  declare ruleVersion: string;
  declare verifiedEventId: string | null;
  declare gatewayEventId: string | null;
  declare externalPaymentReference: string | null;
  declare metadata: object | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

SplitTransaction.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  paymentId: { type: DataTypes.STRING, allowNull: false },
  bookingId: { type: DataTypes.INTEGER, allowNull: false },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  role: { 
    type: DataTypes.ENUM('platform', 'provider', 'gateway_fee', 'tax', 'discount', 'reserve', 'other'),
    allowNull: false 
  },
  type: { type: DataTypes.ENUM('fixed', 'percentage'), allowNull: false },
  amount: { type: DataTypes.BIGINT, allowNull: false }, // Amount in Halalas
  percentage: { type: DataTypes.DECIMAL(9, 6), allowNull: true },
  status: { 
    type: DataTypes.ENUM('pending', 'held', 'available', 'paid', 'refunded', 'reversed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false 
  },
  refundable: { type: DataTypes.BOOLEAN, defaultValue: true },
  feeSource: { type: DataTypes.STRING, defaultValue: 'platform' },
  ruleVersion: { type: DataTypes.STRING, defaultValue: 'V2.5.0' },
  verifiedEventId: { type: DataTypes.UUID, allowNull: true },
  gatewayEventId: { type: DataTypes.STRING, allowNull: true },
  externalPaymentReference: { type: DataTypes.STRING, allowNull: true },
  metadata: { type: DataTypes.JSON, allowNull: true }
}, {
  sequelize,
  modelName: 'SplitTransaction',
  tableName: 'split_transactions',
  indexes: [
    { fields: ['paymentId'] },
    { fields: ['bookingId'] },
    { fields: ['providerId'] },
    { fields: ['status'] },
    { fields: ['verifiedEventId'] }
  ]
});

/**
 * 2. Beneficiary Model
 * Provider KYB/KYC verification & official bank account mapping.
 */
export class Beneficiary extends Model {
  declare id: number;
  declare providerId: number;
  declare officialName: string;
  declare commercialRegister: string;
  declare iban: string;
  declare bankName: string;
  declare bankCode: string;
  declare kycStatus: 'pending_kyc' | 'under_review' | 'suspended' | 'active' | 'rejected' | 'closed';
  declare kycDocuments: object | null;
  declare verifiedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Beneficiary.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false, unique: true },
  officialName: { type: DataTypes.STRING, allowNull: false },
  commercialRegister: { type: DataTypes.STRING, allowNull: false },
  iban: { type: DataTypes.STRING, allowNull: false },
  bankName: { type: DataTypes.STRING, allowNull: false },
  bankCode: { type: DataTypes.STRING, defaultValue: 'SA' },
  kycStatus: { 
    type: DataTypes.ENUM('pending_kyc', 'under_review', 'suspended', 'active', 'rejected', 'closed'),
    defaultValue: 'pending_kyc',
    allowNull: false 
  },
  kycDocuments: { type: DataTypes.JSON, allowNull: true },
  verifiedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  modelName: 'Beneficiary',
  tableName: 'beneficiaries',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['kycStatus'] }
  ]
});

/**
 * 3. SettlementInstruction Model
 * Deferred payout settlement state machine representing what the provider is owed, why, and when.
 */
export class SettlementInstruction extends Model {
  declare id: string;
  declare paymentId: string;
  declare providerId: number;
  declare beneficiaryId: number;
  declare splitTransactionId: string | null;
  declare instructionNo: string; // e.g. SRV-26-0000000001 or BKG-26-0000000001
  declare amount: number; // Gross Halalas
  declare netPayableAmount: number; // Net Halalas
  declare receivablesOffsetAmount: number; // Halalas
  declare refundDeductionsAmount: number; // Halalas
  declare penaltiesAmount: number; // Halalas
  declare currency: string;
  declare eligibleAt: Date;
  declare scheduledAt: Date | null;
  declare status: 'draft' | 'pending_eligibility' | 'eligible' | 'scheduled' | 'on_hold' | 'release_requested' | 'processing' | 'paid' | 'cancelled' | 'failed' | 'reversed' | 'partially_reversed' | 'reconciliation_required' | 'manual_review';
  declare holdReason: string | null;
  declare holdUntil: Date | null;
  declare releaseConditions: object | null;
  declare payoutId: string | null;
  declare gatewayTransferId: string | null;
  declare releasedAt: Date | null;
  declare paidAt: Date | null;
  declare failureCode: string | null;
  declare retryCount: number;
  declare version: number;
  declare settlementStrategy: string;
  declare settlementStrategyVersion: string;
  declare verifiedEventId: string | null;
  declare gatewayEventId: string | null;
  declare externalPaymentReference: string | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

SettlementInstruction.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  paymentId: { type: DataTypes.STRING, allowNull: false },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  beneficiaryId: { type: DataTypes.INTEGER, allowNull: true },
  splitTransactionId: { type: DataTypes.STRING, allowNull: true },
  instructionNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  amount: { type: DataTypes.BIGINT, allowNull: false },
  netPayableAmount: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
  receivablesOffsetAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  refundDeductionsAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  penaltiesAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'SAR' },
  eligibleAt: { type: DataTypes.DATE, allowNull: false },
  scheduledAt: { type: DataTypes.DATE, allowNull: true },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'pending_eligibility',
    allowNull: false
  },
  holdReason: { type: DataTypes.STRING, allowNull: true },
  holdUntil: { type: DataTypes.DATE, allowNull: true },
  releaseConditions: { type: DataTypes.JSON, allowNull: true },
  payoutId: { type: DataTypes.STRING, allowNull: true },
  gatewayTransferId: { type: DataTypes.STRING, allowNull: true },
  releasedAt: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  failureCode: { type: DataTypes.STRING, allowNull: true },
  retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  version: { type: DataTypes.INTEGER, defaultValue: 1 },
  settlementStrategy: { type: DataTypes.STRING, defaultValue: 'T_PLUS_1' },
  settlementStrategyVersion: { type: DataTypes.STRING, defaultValue: 'V2.5.0' },
  verifiedEventId: { type: DataTypes.UUID, allowNull: true },
  gatewayEventId: { type: DataTypes.STRING, allowNull: true },
  externalPaymentReference: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'SettlementInstruction',
  tableName: 'settlement_instructions',
  indexes: [
    { fields: ['providerId'] },
    { fields: ['paymentId'] },
    { fields: ['instructionNo'] },
    { fields: ['status'] },
    { fields: ['verifiedEventId'] }
  ]
});

/**
 * 3.1 PayoutInstruction Model
 * Sovereign external payout execution tracking rail, submission, proof, and reconciliation.
 */
export class PayoutInstruction extends Model {
  declare id: string;
  declare payoutNo: string; // e.g. EXP-26-0000000001
  declare settlementId: string;
  declare providerId: number;
  declare beneficiaryId: number;
  declare amount: number; // Net Halalas to transfer
  declare grossPayableAmount: number; // Halalas
  declare receivablesOffsetAmount: number; // Halalas
  declare refundDeductionsAmount: number; // Halalas
  declare penaltiesAmount: number; // Halalas
  declare adjustmentsAmount: number; // Halalas
  declare currency: string;
  declare paymentRail: 'sarie' | 'sama_fast' | 'b2b_wire' | 'gateway_payout' | 'direct_bank';
  declare gatewayName: string;
  declare externalReference: string | null;
  declare externalBatchId: string | null;
  declare idempotencyKey: string;
  declare status: 'created' | 'validated' | 'queued' | 'submitted' | 'processing' | 'confirmed' | 'reconciled' | 'paid' | 'rejected' | 'failed' | 'returned' | 'cancelled' | 'retry_pending' | 'manual_review' | 'reconciliation_required';
  declare submissionStatus: 'unsubmitted' | 'submitted' | 'accepted' | 'rejected';
  declare confirmationStatus: 'unconfirmed' | 'confirmed' | 'failed' | 'returned';
  declare reconciliationStatus: 'unreconciled' | 'matched' | 'mismatch' | 'accepted_difference';
  declare ledgerPostingStatus: 'unposted' | 'posted' | 'reversed';
  declare financialSnapshot: object;
  declare beneficiarySnapshot: object;
  declare failureCode: string | null;
  declare failureReason: string | null;
  declare retryCount: number;
  declare maxRetries: number;
  declare dualApproval: object | null;
  declare auditTrail: object[] | null;
  declare submittedAt: Date | null;
  declare confirmedAt: Date | null;
  declare reconciledAt: Date | null;
  declare paidAt: Date | null;
  declare returnedAt: Date | null;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PayoutInstruction.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  payoutNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  settlementId: { type: DataTypes.STRING, allowNull: false },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  beneficiaryId: { type: DataTypes.INTEGER, allowNull: false },
  amount: { type: DataTypes.BIGINT, allowNull: false },
  grossPayableAmount: { type: DataTypes.BIGINT, allowNull: false },
  receivablesOffsetAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  refundDeductionsAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  penaltiesAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  adjustmentsAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  currency: { type: DataTypes.STRING, defaultValue: 'SAR' },
  paymentRail: { type: DataTypes.STRING, defaultValue: 'sarie' },
  gatewayName: { type: DataTypes.STRING, defaultValue: 'hyperpay' },
  externalReference: { type: DataTypes.STRING, allowNull: true },
  externalBatchId: { type: DataTypes.STRING, allowNull: true },
  idempotencyKey: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'created',
    allowNull: false
  },
  submissionStatus: { type: DataTypes.STRING, defaultValue: 'unsubmitted' },
  confirmationStatus: { type: DataTypes.STRING, defaultValue: 'unconfirmed' },
  reconciliationStatus: { type: DataTypes.STRING, defaultValue: 'unreconciled' },
  ledgerPostingStatus: { type: DataTypes.STRING, defaultValue: 'unposted' },
  financialSnapshot: { type: DataTypes.JSON, allowNull: false },
  beneficiarySnapshot: { type: DataTypes.JSON, allowNull: false },
  failureCode: { type: DataTypes.STRING, allowNull: true },
  failureReason: { type: DataTypes.TEXT, allowNull: true },
  retryCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  maxRetries: { type: DataTypes.INTEGER, defaultValue: 3 },
  dualApproval: { type: DataTypes.JSON, allowNull: true },
  auditTrail: { type: DataTypes.JSON, defaultValue: [] },
  submittedAt: { type: DataTypes.DATE, allowNull: true },
  confirmedAt: { type: DataTypes.DATE, allowNull: true },
  reconciledAt: { type: DataTypes.DATE, allowNull: true },
  paidAt: { type: DataTypes.DATE, allowNull: true },
  returnedAt: { type: DataTypes.DATE, allowNull: true }
}, {
  sequelize,
  modelName: 'PayoutInstruction',
  tableName: 'payout_instructions',
  indexes: [
    { fields: ['payoutNo'] },
    { fields: ['settlementId'] },
    { fields: ['providerId'] },
    { fields: ['externalReference'] },
    { fields: ['idempotencyKey'] },
    { fields: ['status'] }
  ]
});

/**
 * 4. RefundAllocation Model
 * Decoupled refund breakdown tracking platform vs provider vs tax share reversals.
 */
export class RefundAllocation extends Model {
  declare id: string;
  declare refundId: string;
  declare idempotencyKey: string | null;
  declare paymentId: string;
  declare bookingId: number | null;
  declare providerId: number | null;
  declare customerId: number | null;
  declare customerEmail: string | null;
  declare refundType: 'FULL_REFUND' | 'PARTIAL_REFUND' | 'NO_REFUND' | 'WALLET_REFUND' | 'GATEWAY_REFUND' | 'MIXED_REFUND' | 'PRE_SETTLEMENT_REFUND' | 'POST_SETTLEMENT_REFUND' | 'PROVIDER_FAULT_REFUND' | 'CUSTOMER_CANCELLATION_REFUND' | 'ADMIN_OVERRIDE_REFUND' | 'FORCE_MAJEURE_REFUND' | string;
  declare refundMethod: 'gateway' | 'wallet' | 'mixed' | string;
  declare executionStatus: 'REQUESTED' | 'CALCULATED' | 'APPROVED' | 'PROCESSING' | 'SUCCEEDED' | 'PARTIAL' | 'FAILED' | 'RETRY' | 'MANUAL_REVIEW' | 'RECONCILIATION_REQUIRED' | 'CANCELLED' | 'REVERSED' | string;
  declare grossRefundAmount: number; // Halalas
  declare customerRefundAmount: number; // Halalas
  declare providerDeductionAmount: number; // Halalas
  declare platformCommissionReversal: number; // Halalas
  declare platformRevenueReversal: number; // Halalas
  declare platformVatReversal: number; // Halalas
  declare taxReversal: number; // Halalas
  declare cancellationFee: number; // Halalas
  declare retainedProviderAmount: number; // Halalas
  declare providerReceivableAmount: number; // Halalas
  declare providerReceivableId: string | null;
  declare gatewayFeeTreatment: 'absorbed_by_platform' | 'charged_to_provider' | 'charged_to_customer';
  declare postPayoutRefund: boolean;
  declare policyId: string | null;
  declare policyVersion: string | null;
  declare reason: string | null;
  declare cancelledBy: 'customer' | 'provider' | 'admin' | 'force_majeure' | string;
  declare gatewayRefundReference: string | null;
  declare gatewayName: string | null;
  declare legs: object[] | null;
  declare snapshot: object | null;
  declare journalId: string | null;
  declare expectedDueDate: Date | null;
  declare status: 'allocated' | 'posted' | 'failed' | string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

RefundAllocation.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  refundId: { type: DataTypes.STRING, allowNull: false, unique: true },
  idempotencyKey: { type: DataTypes.STRING, allowNull: true, unique: true },
  paymentId: { type: DataTypes.STRING, allowNull: false },
  bookingId: { type: DataTypes.INTEGER, allowNull: true },
  providerId: { type: DataTypes.INTEGER, allowNull: true },
  customerId: { type: DataTypes.INTEGER, allowNull: true },
  customerEmail: { type: DataTypes.STRING, allowNull: true },
  refundType: { type: DataTypes.STRING, defaultValue: 'FULL_REFUND' },
  refundMethod: { type: DataTypes.STRING, defaultValue: 'gateway' },
  executionStatus: { type: DataTypes.STRING, defaultValue: 'REQUESTED' },
  grossRefundAmount: { type: DataTypes.BIGINT, allowNull: false },
  customerRefundAmount: { type: DataTypes.BIGINT, allowNull: false },
  providerDeductionAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  platformCommissionReversal: { type: DataTypes.BIGINT, defaultValue: 0 },
  platformRevenueReversal: { type: DataTypes.BIGINT, defaultValue: 0 },
  platformVatReversal: { type: DataTypes.BIGINT, defaultValue: 0 },
  taxReversal: { type: DataTypes.BIGINT, defaultValue: 0 },
  cancellationFee: { type: DataTypes.BIGINT, defaultValue: 0 },
  retainedProviderAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  providerReceivableAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  providerReceivableId: { type: DataTypes.STRING, allowNull: true },
  gatewayFeeTreatment: {
    type: DataTypes.ENUM('absorbed_by_platform', 'charged_to_provider', 'charged_to_customer'),
    defaultValue: 'absorbed_by_platform'
  },
  postPayoutRefund: { type: DataTypes.BOOLEAN, defaultValue: false },
  policyId: { type: DataTypes.STRING, defaultValue: 'POL_STD_CANCELLATION' },
  policyVersion: { type: DataTypes.STRING, defaultValue: 'V2.5.0' },
  reason: { type: DataTypes.TEXT, allowNull: true },
  cancelledBy: { type: DataTypes.STRING, defaultValue: 'customer' },
  gatewayRefundReference: { type: DataTypes.STRING, allowNull: true },
  gatewayName: { type: DataTypes.STRING, defaultValue: 'moyasar' },
  legs: { type: DataTypes.JSON, allowNull: true },
  snapshot: { type: DataTypes.JSON, allowNull: true },
  journalId: { type: DataTypes.STRING, allowNull: true },
  expectedDueDate: { type: DataTypes.DATE, allowNull: true },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'allocated'
  }
}, {
  sequelize,
  modelName: 'RefundAllocation',
  tableName: 'refund_allocations',
  indexes: [
    { fields: ['refundId'] },
    { fields: ['paymentId'] },
    { fields: ['providerId'] },
    { fields: ['executionStatus'] }
  ]
});

/**
 * 5. LedgerJournal Model
 * Header for double-entry financial journals enforcing balanced entries.
 */
export class LedgerJournal extends Model {
  declare id: string;
  declare journalNo: string; // e.g. REV-26-0000000001 or EXP-26-0000000001
  declare referenceId: string;
  declare referenceType: string;
  declare description: string;
  declare totalDebit: number; // Halalas
  declare totalCredit: number; // Halalas
  declare balanced: boolean;
  declare postedBy: string | null;
  declare verifiedEventId: string | null;
  declare gatewayEventId: string | null;
  declare externalPaymentReference: string | null;
  declare createdAt: Date;
}

LedgerJournal.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  journalNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  referenceId: { type: DataTypes.STRING, allowNull: false },
  referenceType: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  totalDebit: { type: DataTypes.BIGINT, allowNull: false },
  totalCredit: { type: DataTypes.BIGINT, allowNull: false },
  balanced: { type: DataTypes.BOOLEAN, defaultValue: true },
  postedBy: { type: DataTypes.STRING, allowNull: true },
  verifiedEventId: { type: DataTypes.UUID, allowNull: true },
  gatewayEventId: { type: DataTypes.STRING, allowNull: true },
  externalPaymentReference: { type: DataTypes.STRING, allowNull: true }
}, {
  sequelize,
  modelName: 'LedgerJournal',
  tableName: 'ledger_journals',
  indexes: [
    { fields: ['journalNo'] },
    { fields: ['referenceId'] },
    { fields: ['verifiedEventId'] }
  ]
});

/**
 * 6. GatewayEvent Model
 * Raw webhook ingestion log with signature verification status and idempotency.
 */
export class GatewayEvent extends Model {
  declare id: string;
  declare gatewayName: string;
  declare externalEventId: string;
  declare eventType: string;
  declare payload: object;
  declare signature: string | null;
  declare verified: boolean;
  declare processed: boolean;
  declare processingError: string | null;
  declare receivedAt: Date;
}

GatewayEvent.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  gatewayName: { type: DataTypes.STRING, allowNull: false },
  externalEventId: { type: DataTypes.STRING, allowNull: false },
  eventType: { type: DataTypes.STRING, allowNull: false },
  payload: { type: DataTypes.JSON, allowNull: false },
  signature: { type: DataTypes.TEXT, allowNull: true },
  verified: { type: DataTypes.BOOLEAN, defaultValue: false },
  processed: { type: DataTypes.BOOLEAN, defaultValue: false },
  processingError: { type: DataTypes.TEXT, allowNull: true },
  receivedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  sequelize,
  modelName: 'GatewayEvent',
  tableName: 'gateway_events',
  indexes: [
    { fields: ['gatewayName', 'externalEventId'], unique: true },
    { fields: ['processed'] }
  ]
});

/**
 * 6.1 VerifiedPaymentEvent Model
 * High-integrity audit record of cryptographically verified external gateway payment events.
 * Serves as the mandatory, unforgeable prerequisite for any financial capture, split creation, or ledger journal.
 */
export class VerifiedPaymentEvent extends Model {
  declare id: string;
  declare gatewayName: string;
  declare gatewayEventId: string;
  declare paymentReference: string;
  declare externalPaymentId: string;
  declare amountHalalas: number;
  declare currency: string;
  declare status: 'verified' | 'processing' | 'processed' | 'processing_failed' | 'rejected' | 'ignored';
  declare signature: string | null;
  declare signatureVerified: boolean;
  declare signatureAlgorithm: string | null;
  declare replayed: boolean;
  declare source: 'webhook' | 'recovery_lookup' | 'internal_reconciliation';
  declare payload: object;
  declare rawHeaders: object | null;
  declare eventTimestamp: Date;
  declare processedAt: Date | null;
  declare processingError: string | null;
  declare reconciliationStatus: string | null;
  declare idempotencyKey: string;
  declare createdAt: Date;
  declare updatedAt: Date;
}

VerifiedPaymentEvent.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  gatewayName: { type: DataTypes.STRING, allowNull: false },
  gatewayEventId: { type: DataTypes.STRING, allowNull: false },
  paymentReference: { type: DataTypes.STRING, allowNull: false },
  externalPaymentId: { type: DataTypes.STRING, allowNull: false },
  amountHalalas: { type: DataTypes.BIGINT, allowNull: false },
  currency: { type: DataTypes.STRING, defaultValue: 'SAR', allowNull: false },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'verified',
    allowNull: false
  },
  signature: { type: DataTypes.TEXT, allowNull: true },
  signatureVerified: { type: DataTypes.BOOLEAN, defaultValue: false, allowNull: false },
  signatureAlgorithm: { type: DataTypes.STRING, defaultValue: 'HMAC-SHA256' },
  replayed: { type: DataTypes.BOOLEAN, defaultValue: false },
  source: {
    type: DataTypes.STRING,
    defaultValue: 'webhook',
    allowNull: false
  },
  payload: { type: DataTypes.JSON, allowNull: false },
  rawHeaders: { type: DataTypes.JSON, allowNull: true },
  eventTimestamp: { type: DataTypes.DATE, allowNull: false },
  processedAt: { type: DataTypes.DATE, allowNull: true },
  processingError: { type: DataTypes.TEXT, allowNull: true },
  reconciliationStatus: { type: DataTypes.STRING, allowNull: true },
  idempotencyKey: { type: DataTypes.STRING, allowNull: false, unique: true }
}, {
  sequelize,
  modelName: 'VerifiedPaymentEvent',
  tableName: 'verified_payment_events',
  indexes: [
    { fields: ['gatewayName', 'gatewayEventId'] },
    { fields: ['paymentReference'] },
    { fields: ['externalPaymentId'] },
    { fields: ['status'] },
    { fields: ['idempotencyKey'] },
    { fields: ['eventTimestamp'] }
  ]
});

/**
 * 7. ReconciliationRun & ReconciliationItem Models
 * Multi-tier automated continuous reconciliation engine.
 */
export class ReconciliationRun extends Model {
  declare id: string;
  declare runNo: string;
  declare gatewayName: string;
  declare startDate: Date;
  declare endDate: Date;
  declare totalTransactions: number;
  declare matchedCount: number;
  declare discrepancyCount: number;
  declare status: 'completed' | 'has_discrepancies' | 'failed';
  declare createdAt: Date;
}

ReconciliationRun.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  runNo: { type: DataTypes.STRING, allowNull: false, unique: true },
  gatewayName: { type: DataTypes.STRING, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  totalTransactions: { type: DataTypes.INTEGER, defaultValue: 0 },
  matchedCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  discrepancyCount: { type: DataTypes.INTEGER, defaultValue: 0 },
  status: { type: DataTypes.ENUM('completed', 'has_discrepancies', 'failed'), defaultValue: 'completed' }
}, {
  sequelize,
  modelName: 'ReconciliationRun',
  tableName: 'reconciliation_runs'
});

export class ReconciliationItem extends Model {
  declare id: string;
  declare runId: string;
  declare paymentId: string;
  declare gatewayReference: string;
  declare expectedAmount: number;
  declare actualAmount: number;
  declare difference: number;
  declare reason: string;
  declare status: 'open' | 'investigating' | 'resolved' | 'accepted_difference';
  declare createdAt: Date;
}

ReconciliationItem.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  runId: { type: DataTypes.STRING, allowNull: false },
  paymentId: { type: DataTypes.STRING, allowNull: false },
  gatewayReference: { type: DataTypes.STRING, allowNull: false },
  expectedAmount: { type: DataTypes.BIGINT, allowNull: false },
  actualAmount: { type: DataTypes.BIGINT, allowNull: false },
  difference: { type: DataTypes.BIGINT, allowNull: false },
  reason: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.ENUM('open', 'investigating', 'resolved', 'accepted_difference'), defaultValue: 'open' }
}, {
  sequelize,
  modelName: 'ReconciliationItem',
  tableName: 'reconciliation_items'
});

/**
 * 8. GatewayCapability Model
 * Capability matrix database mapping per gateway provider.
 */
export class GatewayCapability extends Model {
  declare gatewayName: string;
  declare splitAtPayment: string; // 'logical_only' | 'native'
  declare beneficiaryOnboarding: string; // 'dashboard' | 'api'
  declare deferredPayout: string; // 'platform_schedule' | 'native_schedule'
  declare cancelScheduledPayout: boolean;
  declare reversePaidPayout: boolean;
  declare partialRefund: boolean;
  declare maxTimeoutMs: number;
}

GatewayCapability.init({
  gatewayName: { type: DataTypes.STRING, primaryKey: true },
  splitAtPayment: { type: DataTypes.STRING, defaultValue: 'logical_only' },
  beneficiaryOnboarding: { type: DataTypes.STRING, defaultValue: 'api' },
  deferredPayout: { type: DataTypes.STRING, defaultValue: 'platform_schedule' },
  cancelScheduledPayout: { type: DataTypes.BOOLEAN, defaultValue: true },
  reversePaidPayout: { type: DataTypes.BOOLEAN, defaultValue: false },
  partialRefund: { type: DataTypes.BOOLEAN, defaultValue: true },
  maxTimeoutMs: { type: DataTypes.INTEGER, defaultValue: 5000 }
}, {
  sequelize,
  modelName: 'GatewayCapability',
  tableName: 'gateway_capabilities'
});

/**
 * 9. CorporateLiability Model
 * Tracks external debts, bank facilities, Murabaha loans, and end-of-service liabilities.
 */
export class CorporateLiabilityModel extends Model {
  declare id: string;
  declare facilityNumber: string; // e.g. EXP-26-0000000001
  declare type: 'bank_facility' | 'murabaha' | 'end_of_service' | 'operational_debt' | 'external_loan';
  declare creditorName: string;
  declare principalAmount: number; // Halalas
  declare profitRate: number; // Decimal percentage
  declare profitAmount: number; // Halalas
  declare totalRepaymentAmount: number; // Halalas
  declare repaidAmount: number; // Halalas
  declare remainingAmount: number; // Halalas
  declare termMonths: number;
  declare startDate: Date;
  declare dueDate: Date;
  declare monthlyPayment: number; // Halalas
  declare status: 'active' | 'settled' | 'defaulted' | 'grace_period';
  declare installments: object; // JSON array of amortization schedule
  declare notes: string | null;
}

CorporateLiabilityModel.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  facilityNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  type: {
    type: DataTypes.ENUM('bank_facility', 'murabaha', 'end_of_service', 'operational_debt', 'external_loan'),
    allowNull: false
  },
  creditorName: { type: DataTypes.STRING, allowNull: false },
  principalAmount: { type: DataTypes.BIGINT, allowNull: false },
  profitRate: { type: DataTypes.DECIMAL(5, 2), defaultValue: 0 },
  profitAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  totalRepaymentAmount: { type: DataTypes.BIGINT, allowNull: false },
  repaidAmount: { type: DataTypes.BIGINT, defaultValue: 0 },
  remainingAmount: { type: DataTypes.BIGINT, allowNull: false },
  termMonths: { type: DataTypes.INTEGER, allowNull: false },
  startDate: { type: DataTypes.DATE, allowNull: false },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  monthlyPayment: { type: DataTypes.BIGINT, allowNull: false },
  status: {
    type: DataTypes.ENUM('active', 'settled', 'defaulted', 'grace_period'),
    defaultValue: 'active'
  },
  installments: { type: DataTypes.JSON, allowNull: false },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  modelName: 'CorporateLiabilityModel',
  tableName: 'corporate_liabilities',
  indexes: [
    { fields: ['facilityNumber'] },
    { fields: ['status'] },
    { fields: ['type'] }
  ]
});

/**
 * 10. ProviderReceivable Model
 * Outstanding receivables due from providers (unpaid subscriptions, offline booking commissions).
 */
export class ProviderReceivableModel extends Model {
  declare id: string;
  declare receivableNumber: string; // e.g. REV-26-0000000001
  declare providerId: number;
  declare providerName: string;
  declare amount: number; // Halalas
  declare reason: 'unpaid_subscription' | 'offline_booking_commission' | 'penalty' | 'other';
  declare status: 'outstanding' | 'partially_paid' | 'collected' | 'written_off';
  declare dueDate: Date;
  declare ageingDays: number;
  declare notes: string | null;
}

ProviderReceivableModel.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  receivableNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  providerId: { type: DataTypes.INTEGER, allowNull: false },
  providerName: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.BIGINT, allowNull: false },
  reason: {
    type: DataTypes.ENUM('unpaid_subscription', 'offline_booking_commission', 'penalty', 'other'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('outstanding', 'partially_paid', 'collected', 'written_off'),
    defaultValue: 'outstanding'
  },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  ageingDays: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  modelName: 'ProviderReceivableModel',
  tableName: 'provider_receivables',
  indexes: [
    { fields: ['receivableNumber'] },
    { fields: ['providerId'] },
    { fields: ['status'] }
  ]
});

/**
 * 11. ClientReceivable Model
 * Outstanding receivables due from clients (pay on arrival, deferred installments).
 */
export class ClientReceivableModel extends Model {
  declare id: string;
  declare receivableNumber: string; // e.g. REV-26-0000000001
  declare bookingId: number | null;
  declare customerId: number;
  declare customerName: string;
  declare amount: number; // Halalas
  declare paymentType: 'pay_on_arrival' | 'deferred_installments';
  declare status: 'outstanding' | 'collected' | 'overdue';
  declare dueDate: Date;
  declare ageingDays: number;
  declare notes: string | null;
}

ClientReceivableModel.init({
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  receivableNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  bookingId: { type: DataTypes.INTEGER, allowNull: true },
  customerId: { type: DataTypes.INTEGER, allowNull: false },
  customerName: { type: DataTypes.STRING, allowNull: false },
  amount: { type: DataTypes.BIGINT, allowNull: false },
  paymentType: {
    type: DataTypes.ENUM('pay_on_arrival', 'deferred_installments'),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('outstanding', 'collected', 'overdue'),
    defaultValue: 'outstanding'
  },
  dueDate: { type: DataTypes.DATE, allowNull: false },
  ageingDays: { type: DataTypes.INTEGER, defaultValue: 0 },
  notes: { type: DataTypes.TEXT, allowNull: true }
}, {
  sequelize,
  modelName: 'ClientReceivableModel',
  tableName: 'client_receivables',
  indexes: [
    { fields: ['receivableNumber'] },
    { fields: ['customerId'] },
    { fields: ['status'] }
  ]
});

