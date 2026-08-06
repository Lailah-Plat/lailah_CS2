import { PaymentProvider } from "./PaymentProvider.js";

export class TamaraProvider implements PaymentProvider {
  async createCheckoutSession(amount: number, customerDetails: any, orderId: string) {
    console.log(`[Tamara] Creating split-payment session for order ${orderId} with amount ${amount}`);
    const mockPaymentUrl = `https://tamara.co/checkout/mock_session_${Date.now()}`;
    return { url: mockPaymentUrl };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    console.log(`[Tamara] Validating webhook signature...`);
    if (process.env.TAMARA_API_TOKEN && signature) {
      try {
        const crypto = require("crypto");
        const expected = crypto.createHmac("sha256", process.env.TAMARA_API_TOKEN).update(JSON.stringify(payload)).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      } catch (e) {
        console.warn("[Tamara] Signature comparison failed:", e);
      }
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[Tamara] Webhook signature rejected in production.");
      return false;
    }
    return true;
  }
}

export { TamaraProvider as TamaraService };

