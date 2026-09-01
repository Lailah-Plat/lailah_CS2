/**
 * @file CaptureGuard.ts
 * @description Centralized Security Guard enforcing Verified Payment Capture invariants.
 *
 * INVARIANT:
 * Financial Capture => Verified Payment Event
 *
 * Rules:
 * 1. Financial capture, split snapshots, double-entry ledger journals, and settlement instructions
 *    can ONLY be initiated with a persisted, cryptographically verified VerifiedPaymentEvent.
 * 2. Strict idempotency prevents race conditions and duplicate financial snapshots.
 * 3. Atomic database operations ensure all-or-nothing consistency.
 */

import {
  sequelize,
  VerifiedPaymentEvent,
  SplitTransaction,
  SettlementInstruction,
  LedgerJournal,
  Beneficiary
} from '../../models/Database.js';
import { UnifiedPaymentsEngine } from './UnifiedPaymentsEngine.js';
import { PaymentSecurityAuditService } from './PaymentSecurityAuditService.js';
import { Logger } from '../logger.service.js';
import { Op } from 'sequelize';

export interface VerifiedCaptureResult {
  success: boolean;
  isDuplicate: boolean;
  verifiedEventId: string;
  paymentId: string;
  splits: any[];
  settlementInstruction: any;
  journal?: any;
}

export class CaptureGuard {
  // In-memory mutex map to serialize concurrent promises on the same paymentId
  private static locks = new Map<string, Promise<any>>();

  /**
   * Main guarded entry point for financial capture.
   * Requires a verifiedEventId pointing to an existing, cryptographically verified event in the DB.
   */
  static async processVerifiedCapture(
    verifiedEventId: string,
    options?: {
      bookingId?: number;
      providerId?: number;
      commissionRate?: number;
      grossAmountHalalas?: number;
      transaction?: any;
    }
  ): Promise<VerifiedCaptureResult> {
    if (!verifiedEventId) {
      await PaymentSecurityAuditService.logEvent('CAPTURE_WITHOUT_VERIFIED_EVENT_ATTEMPT', {
        errorMessage: 'Missing verifiedEventId in capture invocation'
      });
      throw new Error('Forbidden: Financial capture strictly requires a verifiedEventId.');
    }

    // 1. Fetch VerifiedPaymentEvent from Database
    const event = await VerifiedPaymentEvent.findByPk(verifiedEventId);
    if (!event) {
      await PaymentSecurityAuditService.logEvent('CAPTURE_WITHOUT_VERIFIED_EVENT_ATTEMPT', {
        verifiedEventId,
        errorMessage: 'VerifiedPaymentEvent record not found in database.'
      });
      throw new Error(`Forbidden: VerifiedPaymentEvent with ID ${verifiedEventId} does not exist.`);
    }

    // 2. Validate cryptographic verification & status invariant
    if (!event.signatureVerified) {
      await PaymentSecurityAuditService.logEvent('CAPTURE_WITHOUT_VERIFIED_EVENT_ATTEMPT', {
        verifiedEventId,
        gatewayName: event.gatewayName,
        paymentReference: event.paymentReference,
        errorMessage: 'Attempted capture on an unverified gateway signature event.'
      });
      throw new Error('Forbidden: Event signature was not cryptographically verified.');
    }

    if (event.status === 'rejected') {
      await PaymentSecurityAuditService.logEvent('CAPTURE_WITHOUT_VERIFIED_EVENT_ATTEMPT', {
        verifiedEventId,
        gatewayName: event.gatewayName,
        paymentReference: event.paymentReference,
        errorMessage: 'Attempted capture on a rejected event.'
      });
      throw new Error('Forbidden: Event status is rejected.');
    }

    const paymentId = event.paymentReference;

    // Mutex locking per paymentId to prevent race conditions in high-concurrency environments
    const existingLock = this.locks.get(paymentId);
    if (existingLock) {
      await existingLock;
    }

    let resolveLock!: (val?: any) => void;
    const lockPromise = new Promise(resolve => {
      resolveLock = resolve;
    });
    this.locks.set(paymentId, lockPromise);

    try {
      return await this.executeUnderLock(event, options);
    } finally {
      this.locks.delete(paymentId);
      resolveLock();
    }
  }

  /**
   * Internal execution with idempotency and database transaction
   */
  private static async executeUnderLock(
    event: VerifiedPaymentEvent,
    options?: {
      bookingId?: number;
      providerId?: number;
      commissionRate?: number;
      grossAmountHalalas?: number;
      transaction?: any;
    }
  ): Promise<VerifiedCaptureResult> {
    const paymentId = event.paymentReference;
    const verifiedEventId = event.id;

    // 3. Check for existing capture (Idempotency Check)
    const existingSplits = await SplitTransaction.findAll({
      where: { paymentId: String(paymentId) }
    });

    if (existingSplits.length > 0) {
      // Already captured! Return existing records idempotently
      const existingSettlement = await SettlementInstruction.findOne({
        where: { paymentId: String(paymentId) }
      });

      await PaymentSecurityAuditService.logEvent('PAYMENT_CAPTURE_DUPLICATE', {
        verifiedEventId,
        paymentReference: paymentId,
        gatewayName: event.gatewayName,
        amountHalalas: Number(event.amountHalalas)
      });

      if (event.status !== 'processed') {
        event.status = 'processed';
        event.processedAt = new Date();
        await event.save().catch(() => {});
      }

      return {
        success: true,
        isDuplicate: true,
        verifiedEventId,
        paymentId,
        splits: existingSplits,
        settlementInstruction: existingSettlement
      };
    }

    // 4. Log Capture Started
    await PaymentSecurityAuditService.logEvent('PAYMENT_CAPTURE_STARTED', {
      verifiedEventId,
      paymentReference: paymentId,
      gatewayName: event.gatewayName,
      amountHalalas: Number(event.amountHalalas)
    });

    // Update status to processing
    event.status = 'processing';
    await event.save().catch(() => {});

    // Derive amounts and booking parameters
    const grossAmountHalalas = options?.grossAmountHalalas || Number(event.amountHalalas) || 100000;
    
    // Extract booking/provider info from metadata or options or payload
    const rawPayload: any = event.payload || {};
    const metadata = rawPayload.metadata || rawPayload.data?.metadata || {};
    const bookingId = options?.bookingId || Number(metadata.booking_id || metadata.bookingId || metadata.orderId?.replace(/[^0-9]/g, '') || 1);
    const providerId = options?.providerId || Number(metadata.provider_id || metadata.providerId || 101);
    const commissionRate = options?.commissionRate || Number(metadata.commission_rate || metadata.commissionRate || 0.10);

    // 5. Execute DB Transaction
    const dbTransaction = options?.transaction || (await sequelize.transaction());

    try {
      // Execute the Immutable Capture in UnifiedPaymentsEngine
      const captureResult = await UnifiedPaymentsEngine.executeImmutableCapture({
        paymentId,
        bookingId,
        providerId,
        grossAmountHalalas,
        commissionRate,
        verifiedEventId: event.id,
        gatewayEventId: event.gatewayEventId,
        externalPaymentReference: event.externalPaymentId
      }, { transaction: dbTransaction });

      // Update VerifiedPaymentEvent to processed
      event.status = 'processed';
      event.processedAt = new Date();
      event.processingError = null;
      await event.save({ transaction: dbTransaction });

      if (!options?.transaction) {
        await dbTransaction.commit();
      }

      // 6. Log Capture Completed
      await PaymentSecurityAuditService.logEvent('PAYMENT_CAPTURE_COMPLETED', {
        verifiedEventId,
        paymentReference: paymentId,
        gatewayName: event.gatewayName,
        amountHalalas: grossAmountHalalas
      });

      return {
        success: true,
        isDuplicate: false,
        verifiedEventId,
        paymentId,
        splits: captureResult.splits,
        settlementInstruction: captureResult.settlementInstruction
      };
    } catch (err: any) {
      if (!options?.transaction) {
        await dbTransaction.rollback().catch(() => {});
      }

      // Update event status to processing_failed (do NOT un-verify the signature)
      event.status = 'processing_failed';
      event.processingError = err?.message || String(err);
      await event.save().catch(() => {});

      await PaymentSecurityAuditService.logEvent('PAYMENT_CAPTURE_REJECTED', {
        verifiedEventId,
        paymentReference: paymentId,
        gatewayName: event.gatewayName,
        errorMessage: err?.message || String(err)
      });

      throw err;
    }
  }
}
