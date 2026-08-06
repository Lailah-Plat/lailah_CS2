import { PaymentProviderFactory } from "./PaymentProviderFactory.js";
import { PaymentProvider } from "./PaymentProvider.js";

export class PaymentService {
  /**
   * Delegates session creation to the selected payment provider.
   */
  static async createCheckoutSession(
    providerName: string,
    amount: number,
    customerDetails: any,
    orderId: string
  ): Promise<{ url?: string; sessionId?: string; id?: string }> {
    const provider: PaymentProvider = PaymentProviderFactory.getProvider(providerName);
    return provider.createCheckoutSession(amount, customerDetails, orderId);
  }

  /**
   * Delegates webhook verification to the selected payment provider.
   */
  static validateWebhookSignature(
    providerName: string,
    payload: any,
    signature: string
  ): boolean {
    const provider: PaymentProvider = PaymentProviderFactory.getProvider(providerName);
    return provider.validateWebhookSignature(payload, signature);
  }
}
