import { PaymentProvider } from "./PaymentProvider.js";
import crypto from "crypto";
import { getSecureKey } from "../../models/Database.js";

export class PayTabsProvider implements PaymentProvider {
  private profileId: string;
  private serverKey: string;

  constructor() {
    this.profileId = getSecureKey("encryptedPaytabsProfile", "PAYTABS_PROFILE_ID");
    this.serverKey = getSecureKey("encryptedPaytabsServer", "PAYTABS_SERVER_KEY");
    if (!this.profileId || !this.serverKey) console.warn("PAYTABS_PROFILE_ID or PAYTABS_SERVER_KEY is not defined");
  }

  async createCheckoutSession(amount: number, customerDetails: any, orderId: string) {
    console.log(`[PayTabs] Creating session for order ${orderId} with amount ${amount}`);
    
    // In a real implementation:
    // Call PayTabs Payment API using serverKey and profileId
    
    const mockPaymentUrl = `https://secure.paytabs.sa/payment/page/mock_page_${Date.now()}`;
    return { url: mockPaymentUrl };
  }

  validateWebhookSignature(payload: any, signature: string): boolean {
    console.log(`[PayTabs] Validating webhook signature...`);
    if (this.serverKey && signature) {
      try {
        const expected = crypto.createHmac("sha256", this.serverKey).update(JSON.stringify(payload)).digest("hex");
        return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
      } catch (e) {
        console.warn("[PayTabs] Signature comparison failed:", e);
      }
    }
    if (process.env.NODE_ENV === "production") {
      console.error("[PayTabs] Webhook signature rejected: missing credentials or invalid signature in production.");
      return false;
    }
    return true;
  }
}

export { PayTabsProvider as PayTabsService };

