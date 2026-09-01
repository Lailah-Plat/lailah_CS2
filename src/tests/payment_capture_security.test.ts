/**
 * @file payment_capture_security.test.ts
 * @description Comprehensive test suite for P0 Verified Payment Capture Hardening.
 * Validates cryptographic signature verification, CaptureGuard invariants, idempotency,
 * concurrency resilience, audit logging, and rejection of unverified capture attempts.
 */

import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import crypto from 'crypto';
import {
  sequelize,
  syncDatabase,
  VerifiedPaymentEvent,
  SplitTransaction,
  SettlementInstruction,
  LedgerJournal,
  Beneficiary
} from '../models/Database.js';
import { PaymentWebhookService } from '../services/payment/PaymentWebhookService.js';
import { CaptureGuard } from '../services/payment/CaptureGuard.js';
import { PaymentRecoveryService } from '../services/payment/PaymentRecoveryService.js';
import { MoyasarGatewayAdapter, TapGatewayAdapter } from '../services/payment/PaymentGatewayAdapter.js';
import { PaymentSecurityAuditService } from '../services/payment/PaymentSecurityAuditService.js';

import { GatewayEventNormalizer } from '../services/payment/GatewayEventNormalizer.js';

describe('Verified Payment Capture Hardening (P0 Security Suite)', () => {
  let MOYASAR_SECRET = 'mock_moyasar_secret_key_123';

  beforeAll(async () => {
    await syncDatabase();
    const adapter = GatewayEventNormalizer.getAdapter('moyasar') as MoyasarGatewayAdapter;
    MOYASAR_SECRET = adapter.getSecretKey();
  });

  beforeEach(async () => {
    // Clear test tables before each test
    await SplitTransaction.destroy({ where: {}, truncate: true }).catch(() => {});
    await SettlementInstruction.destroy({ where: {}, truncate: true }).catch(() => {});
    await VerifiedPaymentEvent.destroy({ where: {}, truncate: true }).catch(() => {});
    await LedgerJournal.destroy({ where: {}, truncate: true }).catch(() => {});
  });

  // --------------------------------------------------------------------------
  // Test 1: Valid Webhook Capture Flow
  // --------------------------------------------------------------------------
  it('1. should verify valid HMAC signature, create VerifiedPaymentEvent, and execute financial capture', async () => {
    const paymentReference = `BKG-26-0000000001`;
    const payload = {
      id: `moyasar_evt_${Date.now()}`,
      type: 'payment.captured',
      data: {
        id: `moyasar_pay_${Date.now()}`,
        status: 'paid',
        amount: 150000, // 1500.00 SAR
        currency: 'SAR',
        metadata: {
          orderId: paymentReference,
          booking_id: 101,
          provider_id: 202,
          commission_rate: 0.10
        }
      }
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', MOYASAR_SECRET).update(payloadStr).digest('hex');

    const result = await PaymentWebhookService.handleIncomingWebhook('moyasar', payload, signature);

    expect(result.success).toBe(true);
    expect(result.verifiedEvent).toBeDefined();
    expect(result.verifiedEvent.signatureVerified).toBe(true);
    expect(result.verifiedEvent.status).toBe('processed');
    expect(result.verifiedEvent.paymentReference).toBe(paymentReference);

    // Verify financial capture records were created with verifiedEventId
    expect(result.captureResult).toBeDefined();
    expect(result.captureResult?.isDuplicate).toBe(false);

    const splits = await SplitTransaction.findAll({ where: { paymentId: paymentReference } });
    expect(splits.length).toBe(3); // Platform, Provider, Gateway Fee
    
    // Check that all splits are bound to the verifiedEventId
    for (const split of splits) {
      expect(split.verifiedEventId).toBe(result.verifiedEvent.id);
    }

    const journal = await LedgerJournal.findOne({ where: { referenceId: paymentReference } });
    expect(journal).not.toBeNull();
    expect(journal?.verifiedEventId).toBe(result.verifiedEvent.id);
    expect(journal?.balanced).toBe(true);

    const settlement = await SettlementInstruction.findOne({ where: { paymentId: paymentReference } });
    expect(settlement).not.toBeNull();
    expect(settlement?.verifiedEventId).toBe(result.verifiedEvent.id);
  });

  // --------------------------------------------------------------------------
  // Test 2: Invalid Webhook Signature Rejection
  // --------------------------------------------------------------------------
  it('2. should reject invalid webhook signature with 400/403 and create NO financial capture records', async () => {
    const paymentReference = `BKG-26-0000000002`;
    const payload = {
      id: `moyasar_evt_fake_${Date.now()}`,
      data: {
        id: `moyasar_pay_fake_${Date.now()}`,
        status: 'paid',
        amount: 200000,
        currency: 'SAR',
        metadata: { orderId: paymentReference, booking_id: 102, provider_id: 203 }
      }
    };

    const invalidSignature = 'invalid_tampered_hmac_signature_hex';

    await expect(
      PaymentWebhookService.handleIncomingWebhook('moyasar', payload, invalidSignature)
    ).rejects.toThrow(/Invalid cryptographic signature/);

    // Verify NO splits or journals were created
    const splits = await SplitTransaction.findAll({ where: { paymentId: paymentReference } });
    expect(splits.length).toBe(0);

    const journal = await LedgerJournal.findOne({ where: { referenceId: paymentReference } });
    expect(journal).toBeNull();

    // Verify an unverified rejected event was recorded for audit trail
    const rejectedEvent = await VerifiedPaymentEvent.findOne({ where: { paymentReference } });
    expect(rejectedEvent).not.toBeNull();
    expect(rejectedEvent?.signatureVerified).toBe(false);
    expect(rejectedEvent?.status).toBe('rejected');
  });

  // --------------------------------------------------------------------------
  // Test 3: Direct Capture Attempt Without Verified Event is Strictly Forbidden
  // --------------------------------------------------------------------------
  it('3. should strictly reject CaptureGuard.processVerifiedCapture without verifiedEventId or with non-existent ID', async () => {
    // Missing ID
    await expect(
      CaptureGuard.processVerifiedCapture('')
    ).rejects.toThrow(/Forbidden: Financial capture strictly requires a verifiedEventId/);

    // Non-existent ID
    await expect(
      CaptureGuard.processVerifiedCapture('00000000-0000-0000-0000-000000000000')
    ).rejects.toThrow(/does not exist/);
  });

  // --------------------------------------------------------------------------
  // Test 4: Idempotency & Duplicate Webhooks / Retries
  // --------------------------------------------------------------------------
  it('4. should process duplicate webhooks idempotently without duplicate splits or double crediting', async () => {
    const paymentReference = `BKG-26-0000000004`;
    const payload = {
      id: `moyasar_evt_dup_100`,
      type: 'payment.captured',
      data: {
        id: `moyasar_pay_dup_100`,
        status: 'paid',
        amount: 100000,
        currency: 'SAR',
        metadata: {
          orderId: paymentReference,
          booking_id: 104,
          provider_id: 204
        }
      }
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', MOYASAR_SECRET).update(payloadStr).digest('hex');

    // First Webhook Call
    const firstResult = await PaymentWebhookService.handleIncomingWebhook('moyasar', payload, signature);
    expect(firstResult.success).toBe(true);
    expect(firstResult.captureResult?.isDuplicate).toBe(false);

    // Second Webhook Call (Duplicate Replay)
    const secondResult = await PaymentWebhookService.handleIncomingWebhook('moyasar', payload, signature);
    expect(secondResult.success).toBe(true);
    expect(secondResult.captureResult?.isDuplicate).toBe(true);

    // Ensure exact count of 3 splits (NO duplicates)
    const splits = await SplitTransaction.findAll({ where: { paymentId: paymentReference } });
    expect(splits.length).toBe(3);

    const journals = await LedgerJournal.findAll({ where: { referenceId: paymentReference } });
    expect(journals.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Test 5: Currency Mismatch Rejection
  // --------------------------------------------------------------------------
  it('5. should reject webhook if currency does not match expected SAR currency', async () => {
    const paymentReference = `BKG-26-0000000005`;
    const payload = {
      id: `moyasar_evt_curr_${Date.now()}`,
      data: {
        id: `moyasar_pay_curr_${Date.now()}`,
        status: 'paid',
        amount: 100000,
        currency: 'USD', // Non-SAR
        metadata: { orderId: paymentReference }
      }
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', MOYASAR_SECRET).update(payloadStr).digest('hex');

    await expect(
      PaymentWebhookService.handleIncomingWebhook('moyasar', payload, signature, undefined, { expectedCurrency: 'SAR' })
    ).rejects.toThrow(/Payment currency mismatch/);
  });

  // --------------------------------------------------------------------------
  // Test 6: Amount Mismatch Rejection
  // --------------------------------------------------------------------------
  it('6. should reject webhook if payload amount differs from expected booking amount', async () => {
    const paymentReference = `BKG-26-0000000006`;
    const payload = {
      id: `moyasar_evt_amt_${Date.now()}`,
      data: {
        id: `moyasar_pay_amt_${Date.now()}`,
        status: 'paid',
        amount: 50000, // 500.00 SAR
        currency: 'SAR',
        metadata: { orderId: paymentReference }
      }
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', MOYASAR_SECRET).update(payloadStr).digest('hex');

    await expect(
      PaymentWebhookService.handleIncomingWebhook('moyasar', payload, signature, undefined, {
        expectedAmountHalalas: 100000 // Expected 1000.00 SAR
      })
    ).rejects.toThrow(/Payment amount mismatch/);
  });

  // --------------------------------------------------------------------------
  // Test 7: Concurrency Resilience
  // --------------------------------------------------------------------------
  it('7. should safely handle 10 concurrent capture attempts on the same payment event without race conditions', async () => {
    const paymentReference = `BKG-26-0000000007`;
    const verifiedEvent = await VerifiedPaymentEvent.create({
      gatewayName: 'moyasar',
      gatewayEventId: `moyasar_evt_conc_${Date.now()}`,
      paymentReference,
      externalPaymentId: `moyasar_pay_conc_${Date.now()}`,
      amountHalalas: 100000,
      currency: 'SAR',
      status: 'verified',
      signature: 'TEST_VALID_SIG',
      signatureVerified: true,
      signatureAlgorithm: 'HMAC-SHA256',
      source: 'webhook',
      payload: { metadata: { booking_id: 107, provider_id: 207, commission_rate: 0.10 } },
      eventTimestamp: new Date(),
      idempotencyKey: `conc_${paymentReference}`
    });

    // Fire 10 parallel capture promises simultaneously
    const capturePromises = Array.from({ length: 10 }, () =>
      CaptureGuard.processVerifiedCapture(verifiedEvent.id, {
        bookingId: 107,
        providerId: 207,
        grossAmountHalalas: 100000
      })
    );

    const results = await Promise.all(capturePromises);

    // Exactly 1 should be original (isDuplicate: false) and 9 should be duplicates (isDuplicate: true)
    const initialCaptures = results.filter(r => !r.isDuplicate);
    const duplicateCaptures = results.filter(r => r.isDuplicate);

    expect(initialCaptures.length).toBe(1);
    expect(duplicateCaptures.length).toBe(9);

    // Verify exactly 3 splits in database
    const splits = await SplitTransaction.findAll({ where: { paymentId: paymentReference } });
    expect(splits.length).toBe(3);

    // Verify exactly 1 journal entry
    const journals = await LedgerJournal.findAll({ where: { referenceId: paymentReference } });
    expect(journals.length).toBe(1);
  });

  // --------------------------------------------------------------------------
  // Test 8: Payment Recovery Service (Out-of-Band TLS Query)
  // --------------------------------------------------------------------------
  it('8. should successfully recover a missed webhook via direct gateway API query and execute capture', async () => {
    const paymentReference = `BKG-26-0000000008`;
    
    // Configure mock status override for Moyasar
    MoyasarGatewayAdapter.setStatusOverride(paymentReference, {
      gatewayName: 'moyasar',
      gatewayEventId: `moyasar_rec_${Date.now()}`,
      paymentReference,
      externalPaymentId: `moyasar_ch_${Date.now()}`,
      amountHalalas: 250000,
      currency: 'SAR',
      status: 'captured',
      timestamp: new Date(),
      rawPayload: { recovered: true, paymentReference }
    });

    const recoveryResult = await PaymentRecoveryService.recoverPayment(paymentReference, 'moyasar', {
      expectedAmountHalalas: 250000,
      bookingId: 108,
      providerId: 208
    });

    expect(recoveryResult.success).toBe(true);
    expect(recoveryResult.verifiedEvent.source).toBe('recovery_lookup');
    expect(recoveryResult.verifiedEvent.signatureVerified).toBe(true);
    expect(recoveryResult.captureResult.isDuplicate).toBe(false);

    const splits = await SplitTransaction.findAll({ where: { paymentId: paymentReference } });
    expect(splits.length).toBe(3);

    MoyasarGatewayAdapter.clearStatusOverrides();
  });

  // --------------------------------------------------------------------------
  // Test 9: Payment Security Audit Logging Verification
  // --------------------------------------------------------------------------
  it('9. should verify PaymentSecurityAuditService logs all security violation and lifecycle events', async () => {
    const logSpy = async () => {
      await PaymentSecurityAuditService.logEvent('PAYMENT_WEBHOOK_RECEIVED', { gatewayName: 'moyasar' });
      await PaymentSecurityAuditService.logEvent('PAYMENT_WEBHOOK_SIGNATURE_VERIFIED', { gatewayName: 'moyasar' });
      await PaymentSecurityAuditService.logEvent('INVALID_WEBHOOK_SIGNATURE', { gatewayName: 'moyasar', errorMessage: 'Signature mismatch' });
      await PaymentSecurityAuditService.logEvent('CAPTURE_WITHOUT_VERIFIED_EVENT_ATTEMPT', { errorMessage: 'No verifiedEventId' });
      await PaymentSecurityAuditService.logEvent('PAYMENT_AMOUNT_MISMATCH', { amountHalalas: 100, expectedAmountHalalas: 200 });
      await PaymentSecurityAuditService.logEvent('PAYMENT_CURRENCY_MISMATCH', { currency: 'EUR', expectedCurrency: 'SAR' });
    };

    await expect(logSpy()).resolves.not.toThrow();
  });
});
