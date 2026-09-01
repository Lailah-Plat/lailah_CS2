/**
 * @file otpSender.ts
 * @description وحدة إرسال رموز التحقق المؤقتة (OTP) عبر الرسائل النصية القصيرة (SMS) والبريد الإلكتروني (Email).
 * تدعم بوابات التقنيات السعودية (Taqnyat)، تويليو (Twilio)، وخدمة البريد (Nodemailer)، مع نظام شبييه محاكاة أوتوماتيكي عند غياب المفتاح.
 */

/**
 * خيارات خيارات إرسال رمز التحقق
 */
export interface OtpOptions {
  recipientEmail?: string;
  recipientPhone?: string;
  code: string;
  message: string;
}

/**
 * معالجة وتوحيد صيغة أرقام الجوالات السعودية للنمط القياسي الدولي (+9665xxxxxxxx)
 * @param phone رقم الجوال بوجوهه المختلفة
 * @returns الرقم القياسي المعالج
 */
export function normalizePhone(phone: string): string {
  if (!phone) return '';
  
  // إزالة المسافات، الشرطات، الأقواس، والنقاط والرموز غير الرقمية
  let sanitized = phone.trim().replace(/[\s\-\(\)\.\,]/g, '');
  const hasPlus = sanitized.startsWith('+');
  if (hasPlus) {
    sanitized = sanitized.slice(1);
  } else {
    sanitized = sanitized.replace(/^\+/, '');
  }

  const length = sanitized.length;
  
  // النمط 1: محلي تقليدي (05xxxxxxxx - 10 أرقام)
  if (length === 10 && sanitized.startsWith('05')) {
    return '+966' + sanitized.substring(1);
  }
  
  // النمط 2: محلي مختصر (5xxxxxxxx - 9 أرقام)
  if (length === 9 && sanitized.startsWith('5')) {
    return '+966' + sanitized;
  }
  
  // النمط 3: دولي مباشر (9665xxxxxxxx - 12 رقماً)
  if (length === 12 && sanitized.startsWith('9665')) {
    return '+' + sanitized;
  }
  
  // النمط 4: دولي بديل (966xxxxxxxx - 12 رقماً)
  if (length === 12 && sanitized.startsWith('966')) {
    if (sanitized.substring(3).startsWith('5')) {
      return '+' + sanitized;
    }
  }

  // إذا كان متطابقاً بالفعل مع الصيغة +9665xxxxxxxx
  if (phone.startsWith('+9665') && phone.replace(/[^\d]/g, '').length === 12) {
    return phone;
  }

  // خيار احتياطي في حال تنظيف النص
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
 * التحقق مما إذا كان المعرف الممرر هو رقم جوال أم بريد إلكتروني
 * @param value النص المراد فحصه
 * @returns boolean هل هو رقم جوال
 */
export function isPhone(value: string): boolean {
  if (!value) return false;
  const clean = value.replace(/[^\d]/g, '');
  return clean.length >= 7 && !value.includes('@');
}

/**
 * إرسال رسالة نصية قصيرة (SMS) بفرعين: بوابة تقنيات السعودية أو تويليو
 * @param phone رقم الجوال
 * @param code رمز التحقق
 * @param bodyText نص الرسالة
 * @returns boolean نجاح عملية الإرسال
 */
export async function sendOtpSms(phone: string, code: string, bodyText: string): Promise<boolean> {
  const normalized = normalizePhone(phone);
  console.log(`[OTP SMS] بدء عملية إرسال رمز التحقق إلى الرقم الموحد: ${normalized}`);

  // 1. استخدام بوابة "تقنيات" السعودية (Taqnyat)
  const taqnyatApiKey = process.env.TAQNYAT_API_KEY;
  const taqnyatSender = process.env.TAQNYAT_SENDER_NAME || 'LAYLAH';
  
  if (taqnyatApiKey) {
    try {
      let internationalPhone = normalized;
      if (normalized.startsWith('+')) {
        internationalPhone = normalized.slice(1);
      }
      
      console.log(`[OTP SMS] إرسال عبر بوابة تقنيات السعودية لـ: ${internationalPhone}`);
      const response = await fetch('https://www.taqnyat.sa/services/api/v1/web/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${taqnyatApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          recipients: [internationalPhone],
          body: bodyText,
          sender: taqnyatSender
        })
      });

      const responseText = await response.text();
      console.log(`[OTP SMS] استجابة تقنيات: ${responseText}`);
      return response.ok;
    } catch (err) {
      console.error('[OTP SMS] فشل إرسال الرسالة عبر تقنيات:', err);
    }
  }

  // 2. استخدام بوابة "تويليو" (Twilio)
  const twilioSid = process.env.TWILIO_ACCOUNT_SID;
  const twilioToken = process.env.TWILIO_AUTH_TOKEN;
  const twilioFrom = process.env.TWILIO_FROM_NUMBER;

  if (twilioSid && twilioToken && twilioFrom) {
    try {
      console.log(`[OTP SMS] إرسال عبر بوابة تويليو العالمية`);
      let twilioPhone = normalized;
      if (!normalized.startsWith('+')) {
        twilioPhone = '+' + normalized;
      }

      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`;
      const basicAuth = Buffer.from(`${twilioSid}:${twilioToken}`).toString('base64');

      const params = new URLSearchParams();
      params.append('To', twilioPhone);
      params.append('From', twilioFrom);
      params.append('Body', bodyText);

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${basicAuth}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: params
      });

      const responseData = await response.json();
      console.log(`[OTP SMS] استجابة تويليو:`, responseData);
      return response.ok;
    } catch (err) {
      console.error('[OTP SMS] فشل إرسال الرسالة عبر تويليو:', err);
    }
  }

  // المحاكاة الافتراضية للتطوير والتجربة عند غياب المفتاح
  console.log(`[محاكي الرسائل النصية] مفاتيح مزود الخدمة غير مجهزة بالكامل في البيئة.`);
  console.log(`[محاكي الرسائل النصية] الرسالة المرسلة افتراضياً: لـ: ${normalized} | الرمز: ${code} | النص: "${bodyText}"`);
  return true;
}

/**
 * إرسال بريد إلكتروني يحتوي رمز التحقق من خلال خدمة Nodemailer
 * @param emailAddress عنوان البريد
 * @param code رمز التحقق
 * @param subject عنوان الرسالة
 * @param bodyText نص الرسالة الصريح
 * @returns boolean نجاح عملية الإرسال
 */
export async function sendOtpEmail(emailAddress: string, code: string, subject: string, bodyText: string): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpFrom = process.env.SMTP_FROM_EMAIL || 'otp@lylah.sa';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      console.log(`[OTP Email] استخدام خادم SMTP: ${smtpHost}:${smtpPort}`);
      const nodemailerModule = await import('nodemailer');
      const nodemailer = nodemailerModule.default || nodemailerModule;
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: smtpPort === '465',
        auth: {
          user: smtpUser,
          pass: smtpPass
        }
      });

      const info = await transporter.sendMail({
        from: `"منصة ليلة للمناسبات" <${smtpFrom}>`,
        to: emailAddress,
        subject: subject,
        text: bodyText,
        html: `
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
        `
      });

      console.log(`[OTP Email] تم إرسال البريد الإلكتروني بنجاح: ${info.messageId}`);
      return true;
    } catch (err) {
      console.error('[OTP Email] فشل إرسال البريد الإلكتروني:', err);
    }
  }

  // المحاكاة الافتراضية للبريد عند غياب مفاتيح SMTP
  console.log(`[محاكي البريد الإلكتروني] بيانات SMTP غير مجهزة بالكامل في متغيرات البيئة.`);
  console.log(`[محاكي البريد الإلكتروني] البريد المرسل افتراضياً: لـ: ${emailAddress} | الرمز: ${code} | العنوان: "${subject}"`);
  return true;
}

