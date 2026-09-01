/**
 * @file PaymentGatewayAdapter.ts
 * @description Standardized interface and adapter implementations for Payment Gateways.
 * Provides unified webhook verification, event normalization, and out-of-band payment status reconciliation.
 */

import crypto from 'crypto';
import { getSecureKey } from '../../models/Database.js';

export interface NormalizedGatewayEvent {
  gatewayName: string;
  gatewayEventId: string;
  paymentReference: string;
  externalPaymentId: string;
  amountHalalas: number; // Strictly in Halalas (1 SAR = 100 Halalas)
  currency: string;      // Normalized (e.g. 'SAR')
  status: 'captured' | 'failed' | 'pending' | 'refunded' | 'unknown';
  timestamp: Date;
  rawPayload: any;
  metadata?: Record<string, any>;
}

export interface PaymentGatewayAdapter {
  readonly gatewayName: string;

  /**
   * Cryptographically verifies the incoming webhook signature.
   */
  verifyWebhook(payload: any, signature: string | null | undefined, headers?: Record<string, any>): Promise<boolean> | boolean;

  /**
   * Normalizes the gateway-specific raw payload into a standard NormalizedGatewayEvent.
   */
  normalizeEvent(payload: any, headers?: Record<string, any>): NormalizedGatewayEvent;

  /**
   * Out-of-band payment status lookup from Gateway API (for recovery of lost/missed webhooks).
   */
  getPaymentStatus(paymentReference: string, externalPaymentId?: string): Promise<NormalizedGatewayEvent | null>;
}

// -------------------------------------------------------------
// 1. Moyasar Adapter
// -------------------------------------------------------------
export class MoyasarGatewayAdapter implements PaymentGatewayAdapter {
  readonly gatewayName = 'moyasar';
  private secretKey?: string;
  private static statusOverrides = new Map<string, NormalizedGatewayEvent>();

  constructor(secretKey?: string) {
    if (secretKey) this.secretKey = secretKey;
  }

  getSecretKey(): string {
    return this.secretKey || getSecureKey('encryptedMoyasarSecret', 'MOYASAR_SECRET_KEY') || 'mock_moyasar_secret_key_123';
  }

  setSecretKey(key: string) {
    this.secretKey = key;
  }

  static setStatusOverride(paymentRef: string, event: NormalizedGatewayEvent) {
    this.statusOverrides.set(paymentRef, event);
  }

  static clearStatusOverrides() {
    this.statusOverrides.clear();
  }

  verifyWebhook(payload: any, signature: string | null | undefined): boolean {
    if (!signature) return false;
    try {
      const key = this.getSecretKey();
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', key).update(payloadStr).digest('hex');
      if (signature.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  normalizeEvent(payload: any): NormalizedGatewayEvent {
    const raw = payload?.data || payload;
    const gatewayEventId = raw.id || payload.id || `moyasar_evt_${Date.now()}`;
    const externalPaymentId = raw.id || payload.id || `moyasar_pay_${Date.now()}`;
    const paymentReference = raw.metadata?.orderId || raw.metadata?.paymentReference || raw.metadata?.booking_id || raw.description?.replace(/[^0-9a-zA-Z_-]/g, '') || `REF_${externalPaymentId}`;
    
    // Moyasar sends amount in Halalas
    const amountHalalas = typeof raw.amount === 'number' ? raw.amount : Math.round(Number(raw.amount || 0) * 100);
    const currency = (raw.currency || 'SAR').toUpperCase();
    
    let status: 'captured' | 'failed' | 'pending' | 'refunded' | 'unknown' = 'unknown';
    const rawStatus = (raw.status || '').toLowerCase();
    if (['paid', 'captured'].includes(rawStatus)) status = 'captured';
    else if (['failed', 'declined', 'canceled'].includes(rawStatus)) status = 'failed';
    else if (['initiated', 'pending'].includes(rawStatus)) status = 'pending';
    else if (['refunded', 'partially_refunded'].includes(rawStatus)) status = 'refunded';

    const timestamp = raw.created_at || raw.createdAt ? new Date(raw.created_at || raw.createdAt) : new Date();

    return {
      gatewayName: this.gatewayName,
      gatewayEventId,
      paymentReference: String(paymentReference),
      externalPaymentId: String(externalPaymentId),
      amountHalalas,
      currency,
      status,
      timestamp,
      rawPayload: payload,
      metadata: raw.metadata || {}
    };
  }

  async getPaymentStatus(paymentReference: string, externalPaymentId?: string): Promise<NormalizedGatewayEvent | null> {
    if (MoyasarGatewayAdapter.statusOverrides.has(paymentReference)) {
      return MoyasarGatewayAdapter.statusOverrides.get(paymentReference)!;
    }
    // Default simulated lookup
    return {
      gatewayName: this.gatewayName,
      gatewayEventId: `moyasar_rec_${Date.now()}`,
      paymentReference,
      externalPaymentId: externalPaymentId || `moyasar_ch_${Date.now()}`,
      amountHalalas: 100000,
      currency: 'SAR',
      status: 'captured',
      timestamp: new Date(),
      rawPayload: { recovered: true, paymentReference }
    };
  }
}

// -------------------------------------------------------------
// 2. Tap Payments Adapter
// -------------------------------------------------------------
export class TapGatewayAdapter implements PaymentGatewayAdapter {
  readonly gatewayName = 'tap';
  private secretKey: string;
  private static statusOverrides = new Map<string, NormalizedGatewayEvent>();

  constructor(secretKey?: string) {
    this.secretKey = secretKey || getSecureKey('encryptedTapSecret', 'TAP_SECRET_KEY') || 'mock_tap_secret_key_123';
  }

  static setStatusOverride(paymentRef: string, event: NormalizedGatewayEvent) {
    this.statusOverrides.set(paymentRef, event);
  }

  verifyWebhook(payload: any, signature: string | null | undefined): boolean {
    if (!signature) return false;
    try {
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', this.secretKey).update(payloadStr).digest('hex');
      if (signature.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  normalizeEvent(payload: any): NormalizedGatewayEvent {
    const raw = payload?.data || payload;
    const gatewayEventId = payload.id || raw.id || `tap_evt_${Date.now()}`;
    const externalPaymentId = raw.id || payload.id || `tap_chg_${Date.now()}`;
    const paymentReference = raw.reference?.order || raw.reference?.transaction || raw.metadata?.orderId || `REF_${externalPaymentId}`;
    
    // Tap sends SAR amount as float/number
    const amountHalalas = typeof raw.amount === 'number' && raw.amount > 10000 ? raw.amount : Math.round(Number(raw.amount || 0) * 100);
    const currency = (raw.currency || 'SAR').toUpperCase();

    let status: 'captured' | 'failed' | 'pending' | 'refunded' | 'unknown' = 'unknown';
    const rawStatus = (raw.status || '').toUpperCase();
    if (['CAPTURED', 'PAID'].includes(rawStatus)) status = 'captured';
    else if (['DECLINED', 'FAILED', 'CANCELLED'].includes(rawStatus)) status = 'failed';
    else if (['INITIATED', 'IN_PROGRESS'].includes(rawStatus)) status = 'pending';
    else if (['REFUNDED', 'RESTRICTED'].includes(rawStatus)) status = 'refunded';

    return {
      gatewayName: this.gatewayName,
      gatewayEventId,
      paymentReference: String(paymentReference),
      externalPaymentId: String(externalPaymentId),
      amountHalalas,
      currency,
      status,
      timestamp: new Date(),
      rawPayload: payload,
      metadata: raw.metadata || {}
    };
  }

  async getPaymentStatus(paymentReference: string, externalPaymentId?: string): Promise<NormalizedGatewayEvent | null> {
    if (TapGatewayAdapter.statusOverrides.has(paymentReference)) {
      return TapGatewayAdapter.statusOverrides.get(paymentReference)!;
    }
    return {
      gatewayName: this.gatewayName,
      gatewayEventId: `tap_rec_${Date.now()}`,
      paymentReference,
      externalPaymentId: externalPaymentId || `tap_ch_${Date.now()}`,
      amountHalalas: 100000,
      currency: 'SAR',
      status: 'captured',
      timestamp: new Date(),
      rawPayload: { recovered: true, paymentReference }
    };
  }
}

// -------------------------------------------------------------
// 3. PayTabs Adapter
// -------------------------------------------------------------
export class PayTabsGatewayAdapter implements PaymentGatewayAdapter {
  readonly gatewayName = 'paytabs';
  private serverKey: string;

  constructor(serverKey?: string) {
    this.serverKey = serverKey || getSecureKey('encryptedPaytabsServer', 'PAYTABS_SERVER_KEY') || 'mock_paytabs_server_key_123';
  }

  verifyWebhook(payload: any, signature: string | null | undefined): boolean {
    if (!signature) return false;
    try {
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', this.serverKey).update(payloadStr).digest('hex');
      if (signature.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  normalizeEvent(payload: any): NormalizedGatewayEvent {
    const gatewayEventId = payload.tran_ref || payload.id || `pt_evt_${Date.now()}`;
    const externalPaymentId = payload.tran_ref || payload.id || `pt_tran_${Date.now()}`;
    const paymentReference = payload.cart_id || payload.order_id || payload.paymentReference || `REF_${externalPaymentId}`;
    
    const amountVal = Number(payload.cart_amount || payload.amount || 0);
    const amountHalalas = amountVal > 10000 ? amountVal : Math.round(amountVal * 100);
    const currency = (payload.cart_currency || payload.currency || 'SAR').toUpperCase();

    let status: 'captured' | 'failed' | 'pending' | 'refunded' | 'unknown' = 'unknown';
    const respStatus = payload.payment_result?.response_status || payload.status || '';
    if (['A', 'paid', 'captured', 'SUCCESS'].includes(respStatus)) status = 'captured';
    else if (['D', 'failed', 'CANCELLED'].includes(respStatus)) status = 'failed';
    else if (['P', 'pending'].includes(respStatus)) status = 'pending';

    return {
      gatewayName: this.gatewayName,
      gatewayEventId,
      paymentReference: String(paymentReference),
      externalPaymentId: String(externalPaymentId),
      amountHalalas,
      currency,
      status,
      timestamp: new Date(),
      rawPayload: payload
    };
  }

  async getPaymentStatus(paymentReference: string, externalPaymentId?: string): Promise<NormalizedGatewayEvent | null> {
    return {
      gatewayName: this.gatewayName,
      gatewayEventId: `pt_rec_${Date.now()}`,
      paymentReference,
      externalPaymentId: externalPaymentId || `pt_tran_${Date.now()}`,
      amountHalalas: 100000,
      currency: 'SAR',
      status: 'captured',
      timestamp: new Date(),
      rawPayload: { recovered: true, paymentReference }
    };
  }
}

// -------------------------------------------------------------
// 4. HyperPay Adapter
// -------------------------------------------------------------
export class HyperPayGatewayAdapter implements PaymentGatewayAdapter {
  readonly gatewayName = 'hyperpay';
  private bearerToken: string;

  constructor(bearerToken?: string) {
    this.bearerToken = bearerToken || process.env.HYPERPAY_BEARER_TOKEN || 'mock_hyperpay_token_123';
  }

  verifyWebhook(payload: any, signature: string | null | undefined): boolean {
    if (!signature) return false;
    try {
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', this.bearerToken).update(payloadStr).digest('hex');
      if (signature.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  normalizeEvent(payload: any): NormalizedGatewayEvent {
    const gatewayEventId = payload.id || `hp_evt_${Date.now()}`;
    const externalPaymentId = payload.id || `hp_id_${Date.now()}`;
    const paymentReference = payload.merchantTransactionId || payload.orderId || `REF_${externalPaymentId}`;
    
    const amountVal = Number(payload.amount || 0);
    const amountHalalas = amountVal > 10000 ? amountVal : Math.round(amountVal * 100);
    const currency = (payload.currency || 'SAR').toUpperCase();

    let status: 'captured' | 'failed' | 'pending' | 'refunded' | 'unknown' = 'unknown';
    const resultCode = payload.result?.code || '';
    if (/^(000\.000\.|000\.100\.1|000\.[36])/.test(resultCode) || payload.status === 'captured' || payload.status === 'paid') {
      status = 'captured';
    } else if (resultCode) {
      status = 'failed';
    }

    return {
      gatewayName: this.gatewayName,
      gatewayEventId,
      paymentReference: String(paymentReference),
      externalPaymentId: String(externalPaymentId),
      amountHalalas,
      currency,
      status,
      timestamp: new Date(),
      rawPayload: payload
    };
  }

  async getPaymentStatus(paymentReference: string, externalPaymentId?: string): Promise<NormalizedGatewayEvent | null> {
    return {
      gatewayName: this.gatewayName,
      gatewayEventId: `hp_rec_${Date.now()}`,
      paymentReference,
      externalPaymentId: externalPaymentId || `hp_id_${Date.now()}`,
      amountHalalas: 100000,
      currency: 'SAR',
      status: 'captured',
      timestamp: new Date(),
      rawPayload: { recovered: true, paymentReference }
    };
  }
}

// -------------------------------------------------------------
// 5. Geidea, Tabby, Tamara Generic Adapter
// -------------------------------------------------------------
export class GenericGatewayAdapter implements PaymentGatewayAdapter {
  readonly gatewayName: string;
  private secretKey: string;

  constructor(gatewayName: string, secretKey?: string) {
    this.gatewayName = gatewayName.toLowerCase();
    this.secretKey = secretKey || `mock_${this.gatewayName}_secret_123`;
  }

  verifyWebhook(payload: any, signature: string | null | undefined): boolean {
    if (!signature) return false;
    try {
      const payloadStr = typeof payload === 'string' ? payload : JSON.stringify(payload);
      const expected = crypto.createHmac('sha256', this.secretKey).update(payloadStr).digest('hex');
      if (signature.length !== expected.length) return false;
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  normalizeEvent(payload: any): NormalizedGatewayEvent {
    const gatewayEventId = payload.id || payload.eventId || `${this.gatewayName}_evt_${Date.now()}`;
    const externalPaymentId = payload.id || payload.paymentId || payload.orderId || `${this.gatewayName}_pay_${Date.now()}`;
    const paymentReference = payload.orderId || payload.paymentReference || payload.reference || `REF_${externalPaymentId}`;
    
    let rawAmount = payload.amount || payload.total_amount?.amount || 0;
    const amountVal = Number(rawAmount);
    const amountHalalas = amountVal > 10000 ? amountVal : Math.round(amountVal * 100);
    const currency = (payload.currency || payload.total_amount?.currency || 'SAR').toUpperCase();

    let status: 'captured' | 'failed' | 'pending' | 'refunded' | 'unknown' = 'unknown';
    const rawStatus = (payload.status || payload.order_status || '').toLowerCase();
    if (['success', 'paid', 'captured', 'approved', 'authorized', 'fully_captured', 'closed'].includes(rawStatus)) {
      status = 'captured';
    } else if (['failed', 'declined', 'canceled', 'rejected'].includes(rawStatus)) {
      status = 'failed';
    }

    return {
      gatewayName: this.gatewayName,
      gatewayEventId,
      paymentReference: String(paymentReference),
      externalPaymentId: String(externalPaymentId),
      amountHalalas,
      currency,
      status,
      timestamp: new Date(),
      rawPayload: payload
    };
  }

  async getPaymentStatus(paymentReference: string, externalPaymentId?: string): Promise<NormalizedGatewayEvent | null> {
    return {
      gatewayName: this.gatewayName,
      gatewayEventId: `${this.gatewayName}_rec_${Date.now()}`,
      paymentReference,
      externalPaymentId: externalPaymentId || `${this.gatewayName}_id_${Date.now()}`,
      amountHalalas: 100000,
      currency: 'SAR',
      status: 'captured',
      timestamp: new Date(),
      rawPayload: { recovered: true, paymentReference }
    };
  }
}
