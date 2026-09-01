/**
 * @file PaymentSecurityAuditService.ts
 * @description Centralized audit & security logging for payment capture and webhook verification pipeline.
 * Records cryptographically verified immutable events, replay attempts, and security violations.
 */

import { Logger } from '../logger.service.js';
import { AuditLog } from '../../models/Database.js';

export type PaymentSecurityEventType =
  | 'PAYMENT_WEBHOOK_RECEIVED'
  | 'PAYMENT_WEBHOOK_SIGNATURE_VERIFIED'
  | 'PAYMENT_EVENT_VERIFIED'
  | 'PAYMENT_CAPTURE_STARTED'
  | 'PAYMENT_CAPTURE_COMPLETED'
  | 'PAYMENT_CAPTURE_DUPLICATE'
  | 'PAYMENT_CAPTURE_REJECTED'
  | 'INVALID_WEBHOOK_SIGNATURE'
  | 'CAPTURE_WITHOUT_VERIFIED_EVENT_ATTEMPT'
  | 'PAYMENT_AMOUNT_MISMATCH'
  | 'PAYMENT_CURRENCY_MISMATCH';

export interface PaymentSecurityEventContext {
  gatewayName?: string;
  gatewayEventId?: string;
  paymentReference?: string;
  externalPaymentId?: string;
  amountHalalas?: number;
  expectedAmountHalalas?: number;
  currency?: string;
  expectedCurrency?: string;
  signature?: string;
  verifiedEventId?: string;
  ipAddress?: string;
  userAgent?: string;
  errorMessage?: string;
  attemptedByRole?: string;
  attemptedByUserId?: string | number;
  metadata?: Record<string, any>;
}

export class PaymentSecurityAuditService {
  /**
   * Log and persist a payment security or audit event
   */
  static async logEvent(
    eventType: PaymentSecurityEventType,
    context: PaymentSecurityEventContext
  ): Promise<void> {
    const timestamp = new Date().toISOString();
    const isSecurityViolation = [
      'INVALID_WEBHOOK_SIGNATURE',
      'CAPTURE_WITHOUT_VERIFIED_EVENT_ATTEMPT',
      'PAYMENT_AMOUNT_MISMATCH',
      'PAYMENT_CURRENCY_MISMATCH',
      'PAYMENT_CAPTURE_REJECTED'
    ].includes(eventType);

    const logPayload = {
      eventType,
      timestamp,
      ...context
    };

    if (isSecurityViolation) {
      Logger.security(`[SECURITY VIOLATION] ${eventType} - ${context.errorMessage || 'Unauthorized payment operation'}`, logPayload);
    } else {
      Logger.financial(`[PAYMENT AUDIT] ${eventType} for ref: ${context.paymentReference || context.externalPaymentId || 'N/A'}`, logPayload);
    }

    // Persist to AuditLog database table asynchronously (never fail capture if audit DB insert has issues)
    try {
      await AuditLog.create({
        action: eventType,
        entityType: 'PaymentCapturePipeline',
        entityId: context.verifiedEventId || context.paymentReference || context.gatewayEventId || 'SYSTEM',
        details: logPayload,
        performedBy: null
      });
    } catch (err: any) {
      // In-memory / test SQLite might have concurrent locks; log and do not break flow
      console.warn(`[PaymentSecurityAuditService] Notice writing to AuditLog table: ${err?.message || err}`);
    }
  }
}
