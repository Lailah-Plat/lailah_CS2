import { NotificationDriver } from "./NotificationDriver.js";
import nodemailer from "nodemailer";
import { Logger } from "../logger.service.js";

export class EmailDriver implements NotificationDriver {
  getChannelName(): string {
    return "email";
  }

  async send(recipient: string, message: string, options?: any): Promise<boolean> {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM_EMAIL || "otp@lylah.sa";

    const subject = options?.subject || "تنبيه من منصة ليلة";
    const isHtml = options?.html || false;

    if (smtpHost && smtpUser && smtpPass) {
      try {
        Logger.info(`Routing via SMTP: ${smtpHost}:${smtpPort}`, { recipient });
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || "587"),
          secure: smtpPort === "465",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

        const mailOptions: nodemailer.SendMailOptions = {
          from: `"منصة ليلة للمناسبات" <${smtpFrom}>`,
          to: recipient,
          subject: subject,
        };

        if (isHtml) {
          mailOptions.html = message;
        } else {
          mailOptions.text = message;
        }

        const info = await transporter.sendMail(mailOptions);
        Logger.info(`SMTP delivered successfully: ${info.messageId}`, { recipient });
        return true;
      } catch (err) {
        Logger.error("SMTP transmission failed", err, { recipient });
      }
    }

    Logger.info(`[EmailDriver Simulator] Recipient: ${recipient} | Subject: "${subject}" | Message Length: ${message.length}`);
    return true;
  }
}
