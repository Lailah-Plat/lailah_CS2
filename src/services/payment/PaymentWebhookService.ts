/**
 * @file PaymentWebhookService.ts
 * @description Secure ingestion, cryptographic validation, and dispatch pipeline for Payment Gateway Webhooks.
 */

import { VerifiedPaymentEvent, GatewayEvent } from '../../models/Database.js';
import { GatewayEventNormalizer } from './GatewayEventNormalizer.js';
import { CaptureGuard, VerifiedCaptureResult } from './CaptureGuard.js';
import { PaymentSecurityAuditService } from './PaymentSecurityAuditService.js';
import { Logger } from '../logger.service.js';

export interface ProcessWebhookOptions {
  expectedAmountHalalas?: number;
  expectedCurrency?: string;
  maxTimestampDriftMinutes?: number;
  bookingId?: number;
  providerId?: number;
  commissionRate?: number;
}

export class PaymentWebhookService {
  private static readonly DEFAULT_MAX_DRIFT_MINUTES = 15;

  /**
   * Primary entry point for all incoming payment gateway webhooks.
   */
  static async handleIncomingWebhook(
    gatewayName: string,
    rawPayload: any,
    signature: string | null | undefined,
    headers?: Record<string, any>,
    options?: ProcessWebhookOptions
  ): Promise<{
    success: boolean;
    verifiedEvent: VerifiedPaymentEvent;
    captureResult?: VerifiedCaptureResult;
    normalizedEvent: any;
  }> {
    const gw = (gatewayName || 'generic').toLowerCase();

    // 1. Audit: PAYMENT_WEBHOOK_RECEIVED
    await PaymentSecurityAuditService.logEvent('PAYMENT_WEBHOOK_RECEIVED', {
      gatewayName: gw,
      signature: signature || undefined
    });

    // 2. Cryptographic Signature Verification
    const isValidSignature = await GatewayEventNormalizer.verifySignature(gw, rawPayload, signature, headers);
    
    if (!isValidSignature) {
      // Record rejected event for security auditing
      const normalized = GatewayEventNormalizer.normalize(gw, rawPayload, headers);
      await PaymentSecurityAuditService.logEvent('INVALID_WEBHOOK_SIGNATURE', {
        gatewayName: gw,
        gatewayEventId: normalized.gatewayEventId,
        paymentReference: normalized.paymentReference,
        signature: signature || undefined,
        errorMessage: `Cryptographic HMAC verification failed for gateway '${gw}'.`
      });

      const idempotencyKey = `${gw}_${normalized.gatewayEventId}_${Date.now()}`;
      await VerifiedPaymentEvent.create({
        gatewayName: gw,
        gatewayEventId: normalized.gatewayEventId,
        paymentReference: normalized.paymentReference,
        externalPaymentId: normalized.externalPaymentId,
        amountHalalas: normalized.amountHalalas,
        currency: normalized.currency,
        status: 'rejected',
        signature: signature || null,
        signatureVerified: false,
        source: 'webhook',
        payload: rawPayload,
        rawHeaders: headers || null,
        eventTimestamp: normalized.timestamp || new Date(),
        processingError: 'Invalid cryptographic signature',
        idempotencyKey
      }).catch(() => {});

      throw new Error(`Forbidden: Invalid cryptographic signature for gateway '${gw}'.`);
    }

    // 3. Audit: PAYMENT_WEBHOOK_SIGNATURE_VERIFIED
    await PaymentSecurityAuditService.logEvent('PAYMENT_WEBHOOK_SIGNATURE_VERIFIED', {
      gatewayName: gw
    });

    // 4. Normalization
    const normalized = GatewayEventNormalizer.normalize(gw, rawPayload, headers);
    const maxDrift = options?.maxTimestampDriftMinutes || this.DEFAULT_MAX_DRIFT_MINUTES;
    const now = Date.now();
    const eventTime = normalized.timestamp.getTime();
    const driftMinutes = Math.abs(now - eventTime) / (1000 * 60);

    // 5. Replay Protection / Timestamp Check
    let isReplayed = false;
    if (driftMinutes > maxDrift) {
      isReplayed = true;
      Logger.warn(`[PaymentWebhookService] Event timestamp drift is ${driftMinutes.toFixed(1)} mins (max ${maxDrift} mins).`);
    }

    // 6. Currency Verification
    const expectedCurrency = (options?.expectedCurrency || 'SAR').toUpperCase();
    if (normalized.currency !== expectedCurrency) {
      await PaymentSecurityAuditService.logEvent('PAYMENT_CURRENCY_MISMATCH', {
        gatewayName: gw,
        currency: normalized.currency,
        expectedCurrency,
        paymentReference: normalized.paymentReference
      });
      throw new Error(`Payment currency mismatch: expected ${expectedCurrency}, got ${normalized.currency}`);
    }

    // 7. Amount Verification
    if (options?.expectedAmountHalalas !== undefined && options.expectedAmountHalalas !== null) {
      if (Number(normalized.amountHalalas) !== Number(options.expectedAmountHalalas)) {
        await PaymentSecurityAuditService.logEvent('PAYMENT_AMOUNT_MISMATCH', {
          gatewayName: gw,
          amountHalalas: Number(normalized.amountHalalas),
          expectedAmountHalalas: Number(options.expectedAmountHalalas),
          paymentReference: normalized.paymentReference
        });
        throw new Error(`Payment amount mismatch: expected ${options.expectedAmountHalalas} Halalas, got ${normalized.amountHalalas} Halalas`);
      }
    }

    // 8. Idempotency Check for existing VerifiedPaymentEvent
    const idempotencyKey = `${gw}_${normalized.gatewayEventId}`;
    let existingVerifiedEvent = await VerifiedPaymentEvent.findOne({
      where: { idempotencyKey }
    });

    if (!existingVerifiedEvent) {
      // Also check if an event exists for the exact same (gatewayName, gatewayEventId)
      existingVerifiedEvent = await VerifiedPaymentEvent.findOne({
        where: { gatewayName: gw, gatewayEventId: normalized.gatewayEventId }
      });
    }

    let verifiedEvent: VerifiedPaymentEvent;

    if (existingVerifiedEvent) {
      verifiedEvent = existingVerifiedEvent;
      Logger.info(`[PaymentWebhookService] Duplicate webhook event received for ${idempotencyKey}`);
    } else {
      // 9. Create and persist VerifiedPaymentEvent
      verifiedEvent = await VerifiedPaymentEvent.create({
        gatewayName: gw,
        gatewayEventId: normalized.gatewayEventId,
        paymentReference: normalized.paymentReference,
        externalPaymentId: normalized.externalPaymentId,
        amountHalalas: normalized.amountHalalas,
        currency: normalized.currency,
        status: normalized.status === 'captured' ? 'verified' : 'ignored',
        signature: signature || null,
        signatureVerified: true,
        signatureAlgorithm: 'HMAC-SHA256',
        replayed: isReplayed,
        source: 'webhook',
        payload: rawPayload,
        rawHeaders: headers || null,
        eventTimestamp: normalized.timestamp,
        idempotencyKey
      });

      // Keep legacy GatewayEvent in sync for backward-compatibility with reconciliation
      await GatewayEvent.create({
        gatewayName: gw,
        externalEventId: normalized.gatewayEventId,
        eventType: normalized.status,
        payload: rawPayload,
        signature: signature || null,
        verified: true,
        processed: false
      }).catch(() => {});

      // 10. Audit: PAYMENT_EVENT_VERIFIED
      await PaymentSecurityAuditService.logEvent('PAYMENT_EVENT_VERIFIED', {
        verifiedEventId: verifiedEvent.id,
        gatewayName: gw,
        paymentReference: normalized.paymentReference,
        externalPaymentId: normalized.externalPaymentId,
        amountHalalas: Number(normalized.amountHalalas)
      });
    }

    // 11. Trigger CaptureGuard if status is captured
    let captureResult: VerifiedCaptureResult | undefined;
    if (normalized.status === 'captured') {
      captureResult = await CaptureGuard.processVerifiedCapture(verifiedEvent.id, {
        bookingId: options?.bookingId,
        providerId: options?.providerId,
        commissionRate: options?.commissionRate,
        grossAmountHalalas: Number(normalized.amountHalalas)
      });
      await verifiedEvent.reload().catch(() => {});
    }

    return {
      success: true,
      verifiedEvent,
      captureResult,
      normalizedEvent: normalized
    };
  }
}
