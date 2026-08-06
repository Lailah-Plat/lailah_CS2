import { PaymentProvider } from "./PaymentProvider.js";

export class TabbyProvider implements PaymentProvider {
  async createCheckoutSession(amount: number, customerDetails: any, orderId: string) {
    console.log(`[Tabby] Creating installment session for order ${orderId} with amount ${amount}`);
    const mockPaymentUrl = `https://tabby.ai/checkout/mock_session_${Date.now()}`;
    return { url: mockPaymentUrl };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    console.log(`[Tabby] Validating webhook signature...`);
    if (process.env.TABBY_SECRET_KEY && signature) {
      try {
        const crypto = require("crypto");
        const expected = crypto.createHmac("sha256", process.env.TABBY_SECRET_KEY).update(JSON.stringify(payload)).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      } catch (e) {
        console.warn("[Tabby] Signature comparison failed:", e);
      }
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[Tabby] Webhook signature rejected in production.");
      return false;
    }
    return true;
  }
}

export { TabbyProvider as TabbyService };

