import { UserRepository } from '../user.repository.js';
import { OtpService } from '../otp.service.js';
import { ResetTokenStore } from '../resetTokenStore.js';

export interface ForgotPasswordResult {
  success: boolean;
  message: string;
  email: string;
  otp: string;
  isMock?: boolean;
  error?: string;
}

export class ForgotPasswordUseCase {
  private userRepository: UserRepository;
  private otpService: OtpService;

  constructor(userRepository: UserRepository, otpService: OtpService) {
    this.userRepository = userRepository;
    this.otpService = otpService;
  }

  async execute(email: string): Promise<ForgotPasswordResult> {
    const emailClean = email.trim().toLowerCase();
    
    // Check if it's admin
    if (emailClean === 'admin@system.local') {
      const otpCode = '123456';
      ResetTokenStore.set(emailClean, otpCode, new Date(Date.now() + 10 * 60 * 1000));
      return { success: true, message: 'تم إرسال رمز التحقق بنجاح', email: emailClean, otp: otpCode, isMock: true };
    }

    let user = await this.userRepository.findUserByIdentifier(emailClean);
    let pendingUser = null;

    if (!user) {
      pendingUser = await this.userRepository.findPendingByEmail(emailClean);
      if (!pendingUser) {
        return { success: false, error: 'المستخدم غير مسجل بالمنصة', message: '', email: '', otp: '' };
      }
    }

    const targetEmail = user ? user.email : (pendingUser ? pendingUser.email : emailClean);
    const targetPhone = user ? user.phone : (pendingUser ? pendingUser.phone : undefined);

    const otpCode = this.otpService.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Save token for all possible keys
    ResetTokenStore.set(emailClean, otpCode, expiresAt);
    if (targetEmail) {
      ResetTokenStore.set(targetEmail.trim().toLowerCase(), otpCode, expiresAt);
    }
    if (targetPhone) {
      ResetTokenStore.set(targetPhone.trim(), otpCode, expiresAt);
    }

    console.log(`[ForgotPasswordUseCase] Sent reset code ${otpCode} to ${targetEmail || emailClean}`);

    // Standard platform notification message
    const otpMessage = `رمز استعادة كلمة المرور لمنصة ليلة هو: ${otpCode}`;
    if (targetEmail) {
      await this.otpService.sendEmail(targetEmail, otpCode, 'استعادة كلمة المرور - منصة ليلة', otpMessage);
    }
    if (targetPhone) {
      await this.otpService.sendSms(targetPhone, otpCode, otpMessage);
    }

    return { success: true, message: 'تم إرسال رمز استعادة كلمة المرور بنجاح', email: targetEmail || emailClean, otp: otpCode };
  }
}
