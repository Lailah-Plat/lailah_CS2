import { NotificationDriver } from "./NotificationDriver.js";
import { HttpClient } from "../../utils/httpClient.js";
import { Logger } from "../logger.service.js";

export class SmsDriver implements NotificationDriver {
  getChannelName(): string {
    return "sms";
  }

  private normalizePhone(phone: string): string {
    if (!phone) return "";
    let sanitized = phone.trim().replace(/[\s\-\(\)\.\,]/g, "");
    const hasPlus = sanitized.startsWith("+");
    if (hasPlus) {
      sanitized = sanitized.slice(1);
    } else {
      sanitized = sanitized.replace(/^\+/, "");
    }

    const length = sanitized.length;
    if (length === 10 && sanitized.startsWith("05")) {
      return "+966" + sanitized.substring(1);
    }
    if (length === 9 && sanitized.startsWith("5")) {
      return "+966" + sanitized;
    }
    if (length === 12 && sanitized.startsWith("9665")) {
      return "+" + sanitized;
    }
    return phone.startsWith("+") ? phone : "+" + phone;
  }

  async send(recipient: string, message: string, options?: any): Promise<boolean> {
    const normalized = this.normalizePhone(recipient);
    Logger.info(`Initiating SMS dispatch to: ${normalized}`);

    // 1. Taqnyat SMS Gateway
    const taqnyatApiKey = process.env.TAQNYAT_API_KEY;
    const taqnyatSender = process.env.TAQNYAT_SENDER_NAME || "LAYLAH";

    if (taqnyatApiKey) {
      try {
        let internationalPhone = normalized.startsWith("+") ? normalized.slice(1) : normalized;
        Logger.info(`Routing through Taqnyat API for recipient: ${internationalPhone}`);
        
        const response = await HttpClient.post("https://www.taqnyat.sa/services/api/v1/web/send", {
          recipients: [internationalPhone],
          body: message,
          sender: taqnyatSender,
        }, {
          headers: {
            "Authorization": `Bearer ${taqnyatApiKey}`
          }
        });

        Logger.info(`Taqnyat Response: ${JSON.stringify(response)}`);
        return true;
      } catch (err) {
        Logger.error("Taqnyat SMS delivery failed", err, { recipient: normalized });
      }
    }

    // 2. Twilio Gateway
    const twilioSid = process.env.TWILIO_ACCOUNT_SID;
    const twilioToken = process.env.TWILIO_AUTH_TOKEN;
    const twilioFrom = process.env.TWILIO_FROM_NUMBER;

    if (twilioSid && twilioToken && twilioFrom) {
      try {
        Logger.info(`Routing through Twilio SMS Gateway to: ${normalized}`);
        const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
        const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString("base64");

        const params = new URLSearchParams();
        params.append("To", normalized);
        params.append("From", twilioFrom);
        params.append("Body", message);

        // Convert params to x-www-form-urlencoded format
        const response = await HttpClient.request(twilioUrl, "POST", params.toString(), {
          headers: {
            "Authorization": `Basic ${basicAuth}`,
            "Content-Type": "application/x-www-form-urlencoded",
          }
        });

        Logger.info(`Twilio Response Status: SUCCESS`, { sid: response.sid });
        return true;
      } catch (err) {
        Logger.error("Twilio SMS delivery failed", err, { recipient: normalized });
      }
    }

    Logger.info(`[SmsDriver Simulator] Recipient: ${normalized} | Message: "${message}"`);
    return true;
  }
}
