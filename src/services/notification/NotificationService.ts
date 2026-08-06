import { NotificationDriver } from "./NotificationDriver.js";
import { EmailDriver } from "./EmailDriver.js";
import { SmsDriver } from "./SmsDriver.js";
import { WhatsAppDriver } from "./WhatsAppDriver.js";
import { Logger } from "../logger.service.js";
import { JobQueue } from "../queue/JobQueue.js";

export class NotificationService {
  private static drivers: Map<string, NotificationDriver> = new Map();

  // Register standard drivers by default
  static {
    this.registerDriver(new EmailDriver());
    this.registerDriver(new SmsDriver());
    this.registerDriver(new WhatsAppDriver());

    // Register Background Job Queue Handlers
    JobQueue.registerHandler("send_notification", async (payload: { channel: string; recipient: string; message: string; options?: any }) => {
      await this.sendNotification(payload.channel, payload.recipient, payload.message, payload.options);
    });

    JobQueue.registerHandler("broadcast_notification", async (payload: { channels: string[]; recipient: string; message: string; options?: any }) => {
      await this.broadcastNotification(payload.channels, payload.recipient, payload.message, payload.options);
    });
  }

  /**
   * Registers a custom or custom-configured notification driver.
   */
  static registerDriver(driver: NotificationDriver): void {
    this.drivers.set(driver.getChannelName().toLowerCase(), driver);
    Logger.info(`[NotificationService] Registered driver for channel: ${driver.getChannelName()}`);
  }

  /**
   * Sends a notification through the specified channel driver.
   */
  static async sendNotification(
    channel: "sms" | "email" | "whatsapp" | string,
    recipient: string,
    message: string,
    options?: any
  ): Promise<boolean> {
    const driver = this.drivers.get(channel.toLowerCase());
    if (!driver) {
      Logger.warn(`No registered driver found for channel: ${channel}. Falling back to console simulator.`, { recipient, message });
      return true;
    }

    try {
      const result = await driver.send(recipient, message, options);
      if (result) {
        Logger.security(`Notification dispatched successfully`, { channel, recipient, success: true });
      } else {
        Logger.warn(`Notification dispatch returned false`, { channel, recipient });
      }
      return result;
    } catch (err) {
      Logger.error(`Failed to dispatch notification via ${channel} driver`, err, { recipient, channel });
      return false;
    }
  }

  /**
   * Utility helper to broadcast to multiple channels at once.
   */
  static async broadcastNotification(
    channels: string[],
    recipient: string,
    message: string,
    options?: any
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {};
    const promises = channels.map(async (chan) => {
      const success = await this.sendNotification(chan, recipient, message, options);
      results[chan] = success;
    });

    await Promise.all(promises);
    return results;
  }

  /**
   * Enqueues a notification to be processed in the background, avoiding main-thread blocking.
   */
  static enqueueNotification(
    channel: "sms" | "email" | "whatsapp" | string,
    recipient: string,
    message: string,
    options?: any
  ): string {
    return JobQueue.addJob("send_notification", { channel, recipient, message, options });
  }

  /**
   * Enqueues a broadcast to be processed in the background.
   */
  static enqueueBroadcast(
    channels: string[],
    recipient: string,
    message: string,
    options?: any
  ): string {
    return JobQueue.addJob("broadcast_notification", { channels, recipient, message, options });
  }
}
