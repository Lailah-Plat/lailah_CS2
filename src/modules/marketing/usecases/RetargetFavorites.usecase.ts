import { IMarketingRepository } from '../marketing.repository.js';
import nodemailer from 'nodemailer';

export class RetargetFavoritesUseCase {
  constructor(private marketingRepository: IMarketingRepository) {}

  async execute(data: any) {
    const { hallId, customMessage } = data;

    const hall = await this.marketingRepository.findHallById(Number(hallId));
    if (!hall) {
      throw new Error('القاعة غير موجودة!');
    }

    const favorites = await this.marketingRepository.findFavoritesByHallId(Number(hallId));
    if (favorites.length === 0) {
      return {
        success: true,
        count: 0,
        emailsSent: 0,
        message: 'لا يوجد عملاء أضافوا هذه القاعة للمفضلة بعد.'
      };
    }

    const userIds = favorites.map(f => f.userId);
    const users = await this.marketingRepository.findUsersByIds(userIds);
    const emailList = users.map(u => u.email).filter(Boolean);

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM_EMAIL || 'notifications@lylah.sa';

    let emailsSent = 0;
    const subject = `عرض خاص لفترة محدودة على قاعتك المفضلة: ${hall.name}! 🎁`;
    const msgText = customMessage || `مرحباً، لدينا خبر سار! تم تفعيل خصم خاص ومؤقت على قاعة "${hall.name}" التي قمت بإضافتها لمفضلتك. لا تفوت الفرصة واحجز الآن!`;

    if (smtpHost && smtpUser && smtpPass && emailList.length > 0) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: parseInt(smtpPort || '587'),
          secure: smtpPort === '465',
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        await Promise.all(emailList.map(async (email) => {
          try {
            await transporter.sendMail({
              from: `"منصة ليلة للمناسبات" <${smtpFrom}>`,
              to: email,
              subject: subject,
              text: msgText,
              html: `
                <div style="font-family: sans-serif; direction: rtl; text-align: right; padding: 25px; border: 1px solid #e2e8f0; border-radius: 16px; max-width: 500px; margin: auto; background-color: #ffffff; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <span style="font-size: 40px;">📢</span>
                  </div>
                  <h2 style="color: #0f172a; font-weight: 800; font-size: 20px; text-align: center; margin-bottom: 20px;">عرض خاص بانتظارك!</h2>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6;">مرحباً،</p>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6;">بصفتك مهتماً بقاعة <strong>${hall.name}</strong> وقمت بإضافتها إلى قائمة مفضلتك، يسعدنا إعلامك بوجود عرض خاص لفترة محدودة:</p>
                  <div style="background-color: #fef3c7; color: #b45309; border: 1px solid #fde68a; font-size: 16px; font-weight: bold; text-align: center; padding: 15px; border-radius: 12px; margin: 20px 0;">
                    ${msgText}
                  </div>
                  <p style="color: #475569; font-size: 14px; line-height: 1.6; text-align: center;">سارع بالدخول إلى المنصة وحجز مناسبتك الآن قبل انتهاء صلاحية العرض!</p>
                  <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
                  <p style="font-size: 11px; color: #94a3b8; text-align: center;">حقوق النشر © 2026 منصة ليلة. جميع الحقوق محفوظة.</p>
                </div>
              `
            });
            emailsSent++;
          } catch (err) {
            console.error(`Failed to send retargeting email to ${email}:`, err);
          }
        }));
      } catch (err) {
        console.error('SMTP retargeting transporter error:', err);
      }
    } else {
      console.log(`[Retargeting Simulator] SMTP not configured. Simulated sending to ${emailList.length} emails:`, emailList);
      emailsSent = emailList.length;
    }

    return {
      success: true,
      count: emailList.length,
      emailsSent,
      message: `تم إرسال الإشعارات والرسائل الإلكترونية بنجاح لـ ${emailList.length} من العملاء المهتمين بهذه القاعة!`
    };
  }
}
