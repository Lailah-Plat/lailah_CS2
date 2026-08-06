import { UserRepository } from '../user.repository.js';
import { OtpService } from '../otp.service.js';
import { PasswordHasher } from '../passwordHasher.service.js';
import { User } from '../../../models/UserModels.js';
import { passwordRegex } from '../../../utils/validations.js';

export interface RegisterResult {
  success: boolean;
  message: string;
  user?: User;
  requireOtp: boolean;
  otpEnabled?: {
    email: boolean;
    sms: boolean;
    code: string;
  };
}

export class RegisterUserUseCase {
  private userRepository: UserRepository;
  private otpService: OtpService;
  private passwordHasher: PasswordHasher;

  constructor(
    userRepository: UserRepository,
    otpService: OtpService,
    passwordHasher: PasswordHasher
  ) {
    this.userRepository = userRepository;
    this.otpService = otpService;
    this.passwordHasher = passwordHasher;
  }

  async execute(data: any): Promise<RegisterResult> {
    const { name, email, phone, password } = data;
    
    const emailClean = email.trim().toLowerCase();
    const normalizedPhone = this.otpService.normalizePhone(phone);

    // Validate password strength according to policy (minimum 9 chars, lowercase, uppercase, digit, special character)
    if (password) {
      if (!passwordRegex.test(password)) {
        return { success: false, message: 'كلمة المرور يجب أن تحتوي على 9 خانات على الأقل، حروف كبيرة وصغيرة، أرقام، ورموز خاصة.', requireOtp: false };
      }
    }

    // Ensure email is unique
    const existingUserEmail = await this.userRepository.findUserByEmail(emailClean);
    if (existingUserEmail) {
      return { success: false, message: 'البريد الإلكتروني مسجل مسبقاً', requireOtp: false };
    }

    // Ensure phone is unique
    if (normalizedPhone) {
      const existingUserPhone = await this.userRepository.findUserByPhone(normalizedPhone);
      if (existingUserPhone) {
        return { success: false, message: 'رقم الجوال مسجل مسبقاً لمستخدم آخر', requireOtp: false };
      }
    }

    const settings = await this.userRepository.findSystemSettings();
    const isEmailOtpEnabled = settings?.is_email_otp_enabled || false;
    const isSmsOtpEnabled = settings?.is_sms_otp_enabled || false;

    // Unify registration: Everyone registers as client (عميل)
    const defaultUserRole = 'عميل';

    if (!isEmailOtpEnabled && !isSmsOtpEnabled) {
      // Direct Registration without OTP
      const newUser = await this.userRepository.createUser({
        name,
        email: emailClean,
        phone: normalizedPhone,
        role: defaultUserRole,
        password_hash: this.passwordHasher.hash(password || '')
      });
      return { success: true, message: 'تم التسجيل بنجاح', user: newUser, requireOtp: false };
    }

    // OTP required
    const otpCode = this.otpService.generateOtpCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Clear previous pending registrations for this email
    await this.userRepository.deletePendingByEmail(emailClean);

    await this.userRepository.createPending({
      name,
      email: emailClean,
      phone: normalizedPhone,
      role: defaultUserRole,
      password_hash: this.passwordHasher.hash(password || ''),
      otp_code: otpCode,
      expires_at: expiresAt
    });

    const otpMessage = `رمز التحقق الخاص بك لمنصة ليلة هو: ${otpCode}`;

    // Dispatch real OTP transactions
    if (isEmailOtpEnabled) {
      await this.otpService.sendEmail(emailClean, otpCode, 'رمز تحقق منصة ليلة', otpMessage);
    }
    if (isSmsOtpEnabled && normalizedPhone) {
      await this.otpService.sendSms(normalizedPhone, otpCode, otpMessage);
    }

    return {
      success: true,
      message: 'تم إرسال كود التحقق الفعلي بنجاح',
      requireOtp: true,
      otpEnabled: {
        email: isEmailOtpEnabled,
        sms: isSmsOtpEnabled,
        code: otpCode
      }
    };
  }
}
