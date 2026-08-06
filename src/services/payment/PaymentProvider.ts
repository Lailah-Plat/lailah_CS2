export interface PaymentProvider {
  /**
   * Initializes a checkout session and returns the checkout URL or ID.
   */
  createCheckoutSession(
    amount: number,
    customerDetails: any,
    orderId: string
  ): Promise<{ url?: string; sessionId?: string; id?: string }>;

  /**
   * Validates a webhook payload securely.
   */
  validateWebhookSignature(payload: any, signature: string): boolean;
}
