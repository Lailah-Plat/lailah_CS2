/**
 * @file PaymentRecoveryService.ts
 * @description Out-of-band payment reconciliation and recovery service for lost/missed webhooks.
 */

import { VerifiedPaymentEvent } from '../../models/Database.js';
import { GatewayEventNormalizer } from './GatewayEventNormalizer.js';
import { CaptureGuard, VerifiedCaptureResult } from './CaptureGuard.js';
import { PaymentSecurityAuditService } from './PaymentSecurityAuditService.js';
import { Logger } from '../logger.service.js';

export class PaymentRecoveryService {
  /**
   * Recovers a payment directly from the gateway when the webhook was missed or timed out.
   */
  static async recoverPayment(
    paymentReference: string,
    gatewayName: string,
    options?: {
      externalPaymentId?: string;
      expectedAmountHalalas?: number;
      expectedCurrency?: string;
      bookingId?: number;
      providerId?: number;
      commissionRate?: number;
    }
  ): Promise<{
    success: boolean;
    verifiedEvent: VerifiedPaymentEvent;
    captureResult: VerifiedCaptureResult;
  }> {
    const gw = gatewayName.toLowerCase();
    const adapter = GatewayEventNormalizer.getAdapter(gw);
    
    Logger.info(`[PaymentRecoveryService] Querying gateway '${gw}' for paymentReference: ${paymentReference}...`);

    // 1. Direct TLS Authenticated Gateway Query
    const gatewayStatus = await adapter.getPaymentStatus(paymentReference, options?.externalPaymentId);
    if (!gatewayStatus) {
      throw new Error(`Payment recovery failed: Payment reference '${paymentReference}' not found at gateway '${gw}'.`);
    }

    // 2. Validate Currency
    const expectedCurrency = (options?.expectedCurrency || 'SAR').toUpperCase();
    if (gatewayStatus.currency !== expectedCurrency) {
      await PaymentSecurityAuditService.logEvent('PAYMENT_CURRENCY_MISMATCH', {
        gatewayName: gw,
        currency: gatewayStatus.currency,
        expectedCurrency,
        paymentReference
      });
      throw new Error(`Payment recovery currency mismatch: expected ${expectedCurrency}, got ${gatewayStatus.currency}`);
    }

    // 3. Validate Amount
    if (options?.expectedAmountHalalas !== undefined && options.expectedAmountHalalas !== null) {
      if (Number(gatewayStatus.amountHalalas) !== Number(options.expectedAmountHalalas)) {
        await PaymentSecurityAuditService.logEvent('PAYMENT_AMOUNT_MISMATCH', {
          gatewayName: gw,
          amountHalalas: Number(gatewayStatus.amountHalalas),
          expectedAmountHalalas: Number(options.expectedAmountHalalas),
          paymentReference
        });
        throw new Error(`Payment recovery amount mismatch: expected ${options.expectedAmountHalalas} Halalas, got ${gatewayStatus.amountHalalas} Halalas`);
      }
    }

    if (gatewayStatus.status !== 'captured') {
      throw new Error(`Payment recovery status is not captured: got '${gatewayStatus.status}'`);
    }

    // 4. Create or fetch VerifiedPaymentEvent
    const idempotencyKey = `recovery_${gw}_${gatewayStatus.gatewayEventId}_${paymentReference}`;
    let verifiedEvent = await VerifiedPaymentEvent.findOne({
      where: { idempotencyKey }
    });

    if (!verifiedEvent) {
      verifiedEvent = await VerifiedPaymentEvent.create({
        gatewayName: gw,
        gatewayEventId: gatewayStatus.gatewayEventId,
        paymentReference,
        externalPaymentId: gatewayStatus.externalPaymentId,
        amountHalalas: gatewayStatus.amountHalalas,
        currency: gatewayStatus.currency,
        status: 'verified',
        signature: 'RECOVERY_DIRECT_TLS_API_VERIFIED',
        signatureVerified: true,
        signatureAlgorithm: 'DIRECT_API_QUERY',
        source: 'recovery_lookup',
        payload: gatewayStatus.rawPayload || { recovery: true },
        eventTimestamp: gatewayStatus.timestamp || new Date(),
        idempotencyKey
      });

      await PaymentSecurityAuditService.logEvent('PAYMENT_EVENT_VERIFIED', {
        verifiedEventId: verifiedEvent.id,
        gatewayName: gw,
        paymentReference,
        externalPaymentId: gatewayStatus.externalPaymentId,
        amountHalalas: Number(gatewayStatus.amountHalalas),
        metadata: { source: 'recovery_lookup' }
      });
    }

    // 5. Execute guarded capture
    const captureResult = await CaptureGuard.processVerifiedCapture(verifiedEvent.id, {
      bookingId: options?.bookingId,
      providerId: options?.providerId,
      commissionRate: options?.commissionRate,
      grossAmountHalalas: Number(gatewayStatus.amountHalalas)
    });

    return {
      success: true,
      verifiedEvent,
      captureResult
    };
  }
}
