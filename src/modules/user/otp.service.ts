import { NotificationService } from '../../services/notification/NotificationService.js';

export interface IOtpService {
  normalizePhone(phone: string): string;
  isPhone(value: string): boolean;
  generateOtpCode(): string;
  sendSms(phone: string, code: string, message: string): Promise<boolean>;
  sendEmail(emailAddress: string, code: string, subject: string, message: string): Promise<boolean>;
}

export class OtpService implements IOtpService {
  /**
   * Normalizes a phone number to standard Saudi +9665xxxxxxxx format
   */
  normalizePhone(phone: string): string {
    if (!phone) return '';
    
    // Clean/Sanitize: strip whitespace, hyphens, parentheses, dots, commas, and leading plus
    let sanitized = phone.trim().replace(/[\s\-\(\)\.\,]/g, '');
    const hasPlus = sanitized.startsWith('+');
    if (hasPlus) {
      sanitized = sanitized.slice(1);
    } else {
      sanitized = sanitized.replace(/^\+/, '');
    }

    const length = sanitized.length;
    
    // Pattern 1: local traditional (05xxxxxxxx - 10 digits)
    if (length === 10 && sanitized.startsWith('05')) {
      return '+966' + sanitized.substring(1);
    }
    
    // Pattern 2: local short (5xxxxxxxx - 9 digits)
    if (length === 9 && sanitized.startsWith('5')) {
      return '+966' + sanitized;
    }
    
    // Pattern 3: international direct (9665xxxxxxxx - 12 digits)
    if (length === 12 && sanitized.startsWith('9665')) {
      return '+' + sanitized;
    }
    
    // Pattern 4: international alternative (966xxxxxxxx - 12 digits)
    if (length === 12 && sanitized.startsWith('966')) {
      if (sanitized.substring(3).startsWith('5')) {
        return '+' + sanitized;
      }
    }

    // Fallback for already correct +9665xxxxxxxx with length 13
    if (phone.startsWith('+9665') && phone.replace(/[^\d]/g, '').length === 12) {
      return phone;
    }

    // If none of the KSA patterns matched, return the cleaned digits or KSA fallback
    let cleanDigits = phone.replace(/[^\d]/g, '');
    if (cleanDigits.startsWith('05') && cleanDigits.length === 10) {
      return '+966' + cleanDigits.substring(1);
    }
    if (cleanDigits.startsWith('5') && cleanDigits.length === 9) {
      return '+966' + cleanDigits;
    }
    if (cleanDigits.startsWith('9665') && cleanDigits.length === 12) {
      return '+' + cleanDigits;
    }
    return phone.startsWith('+') ? phone : '+' + phone;
  }

  /**
   * Checks if the string identifier is a phone number
   */
  isPhone(value: string): boolean {
    if (!value) return false;
    // If it's a number after stripping spaces/dashes, or has no @
    const clean = value.replace(/[^\d]/g, '');
    return clean.length >= 7 && !value.includes('@');
  }

  /**
   * Generates a random 6-digit numeric OTP code
   */
  generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Sends a real SMS using unified NotificationService
   */
  async sendSms(phone: string, code: string, message: string): Promise<boolean> {
    const normalized = this.normalizePhone(phone);
    console.log(`[OtpService SMS] Delegating SMS delivery to NotificationService: ${normalized}`);
    return NotificationService.sendNotification('sms', normalized, message, { code });
  }

  /**
   * Sends an OTP Email using unified NotificationService
   */
  async sendEmail(emailAddress: string, code: string, subject: string, message: string): Promise<boolean> {
    console.log(`[OtpService Email] Delegating Email delivery to NotificationService: ${emailAddress}`);
    
    const htmlBody = `
      <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #ddd; border-radius: 10px; max-width: 500px; margin: auto;">
        <h2 style="color: #0c1b3a; text-align: center;">رمز التحقق لمنصة ليلة</h2>
        <p>مرحباً بك،</p>
        <p>من فضلك استخدم رمز التحقق التالي لإتمام تسجيل أو تفعيل حسابك:</p>
        <div style="background-color: #fca510; color: #0c1b3a; font-size: 28px; font-weight: bold; text-align: center; padding: 15px; border-radius: 8px; letter-spacing: 5px; margin: 20px 0;">
          ${code}
        </div>
        <p style="font-size: 12px; color: #777;">هذا الرمز صالح لمدة 10 دقائق فقط. يرجى عدم مشاركته مع أي شخص.</p>
        <hr style="border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 11px; color: #aaa; text-align: center;">حقوق النشر © 2026 منصة ليلة. جميع الحقوق محفوظة.</p>
      </div>
    `;

    return NotificationService.sendNotification('email', emailAddress, htmlBody, {
      subject,
      html: true,
      code
    });
  }
}

