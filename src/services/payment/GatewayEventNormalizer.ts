/**
 * @file GatewayEventNormalizer.ts
 * @description Unified registry and normalizer for external Payment Gateway events.
 */

import {
  PaymentGatewayAdapter,
  NormalizedGatewayEvent,
  MoyasarGatewayAdapter,
  TapGatewayAdapter,
  PayTabsGatewayAdapter,
  HyperPayGatewayAdapter,
  GenericGatewayAdapter
} from './PaymentGatewayAdapter.js';

export class GatewayEventNormalizer {
  private static adapters = new Map<string, PaymentGatewayAdapter>();

  static {
    this.registerAdapter(new MoyasarGatewayAdapter());
    this.registerAdapter(new TapGatewayAdapter());
    this.registerAdapter(new PayTabsGatewayAdapter());
    this.registerAdapter(new HyperPayGatewayAdapter());
    this.registerAdapter(new GenericGatewayAdapter('geidea'));
    this.registerAdapter(new GenericGatewayAdapter('tabby'));
    this.registerAdapter(new GenericGatewayAdapter('tamara'));
  }

  /**
   * Register or override a gateway adapter
   */
  static registerAdapter(adapter: PaymentGatewayAdapter): void {
    this.adapters.set(adapter.gatewayName.toLowerCase(), adapter);
  }

  /**
   * Retrieve an adapter by gateway name
   */
  static getAdapter(gatewayName: string): PaymentGatewayAdapter {
    const key = (gatewayName || '').toLowerCase();
    const adapter = this.adapters.get(key);
    if (!adapter) {
      // Fall back to generic adapter for unrecognized gateways
      const fallback = new GenericGatewayAdapter(key);
      this.adapters.set(key, fallback);
      return fallback;
    }
    return adapter;
  }

  /**
   * Normalizes an event from any supported gateway
   */
  static normalize(gatewayName: string, payload: any, headers?: Record<string, any>): NormalizedGatewayEvent {
    const adapter = this.getAdapter(gatewayName);
    return adapter.normalizeEvent(payload, headers);
  }

  /**
   * Verifies signature using the registered gateway adapter
   */
  static async verifySignature(
    gatewayName: string,
    payload: any,
    signature: string | null | undefined,
    headers?: Record<string, any>
  ): Promise<boolean> {
    const adapter = this.getAdapter(gatewayName);
    return await adapter.verifyWebhook(payload, signature, headers);
  }
}
