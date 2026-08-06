import { PaymentProvider } from "./PaymentProvider.js";
import { getSecureKey } from "../../models/Database.js";

export class HyperPayProvider implements PaymentProvider {
  private entityId: string;
  private bearerToken: string;

  constructor() {
    this.entityId = getSecureKey("encryptedHyperpayEntity", "HYPERPAY_ENTITY_ID");
    // HyperPay bearer can also fall back to HYPERPAY_BEARER_TOKEN or read from dynamic configs if available
    this.bearerToken = process.env.HYPERPAY_BEARER_TOKEN || "";
    if (!this.entityId || !this.bearerToken) console.warn("HyperPay credentials are not defined");
  }

  async createCheckoutSession(amount: number, customerDetails: any, orderId: string) {
    console.log(`[HyperPay] Creating session for order ${orderId} with amount ${amount}`);
    // HyperPay typically returns a checkoutId which is then loaded via a frontend SDK widget
    const mockSessionId = `hyperpay_checkout_${Date.now()}`;
    
    // We return sessionId instead of URL because HyperPay requires the widget embedding
    return { sessionId: mockSessionId };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    console.log(`[HyperPay] Validating webhook signature...`);
    if (this.bearerToken && signature) {
      try {
        const crypto = require("crypto");
        const expected = crypto.createHmac("sha256", this.bearerToken).update(JSON.stringify(payload)).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      } catch (e) {
        console.warn("[HyperPay] Signature comparison failed:", e);
      }
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[HyperPay] Webhook signature rejected: missing credentials or invalid signature in production.");
      return false;
    }
    return true;
  }
}

export { HyperPayProvider as HyperPayService };

