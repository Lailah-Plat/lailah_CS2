import { PaymentProvider } from "./PaymentProvider.js";
import { getSecureKey } from "../../models/Database.js";

export class GeideaProvider implements PaymentProvider {
  private publicKey: string;
  private merchantId: string;

  constructor() {
    this.publicKey = getSecureKey("encryptedGeideaPublic", "GEIDEA_PUBLIC_KEY");
    this.merchantId = getSecureKey("encryptedGeideaMerchant", "GEIDEA_MERCHANT_ID");
    if (!this.publicKey || !this.merchantId) console.warn("Geidea credentials are not defined");
  }

  async createCheckoutSession(amount: number, customerDetails: any, orderId: string) {
    console.log(`[Geidea] Creating session for order ${orderId} with amount ${amount}`);
    // Example Geidea Hosted Payment Page integration
    const mockPaymentUrl = `https://geidea.net/checkout/mock_${Date.now()}`;
    return { url: mockPaymentUrl };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    console.log(`[Geidea] Validating webhook signature...`);
    if (this.publicKey && signature) {
      try {
        const crypto = require("crypto");
        const expected = crypto.createHmac("sha256", this.publicKey).update(JSON.stringify(payload)).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      } catch (e) {
        console.warn("[Geidea] Signature comparison failed:", e);
      }
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[Geidea] Webhook signature rejected: missing credentials or invalid signature in production.");
      return false;
    }
    return true;
  }
}

export { GeideaProvider as GeideaService };

