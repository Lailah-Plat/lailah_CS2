import { UserRepository } from './user.repository.js';
import { OtpService } from './otp.service.js';
import { PasswordHasher } from './passwordHasher.service.js';
import { TokenService } from './token.service.js';
import { RegisterUserUseCase } from './usecases/RegisterUser.usecase.js';
import { VerifyRegistrationOtpUseCase } from './usecases/VerifyRegistrationOtp.usecase.js';
import { LoginUserUseCase } from './usecases/LoginUser.usecase.js';
import { ForgotPasswordUseCase } from './usecases/ForgotPassword.usecase.js';
import { ResetPasswordUseCase } from './usecases/ResetPassword.usecase.js';
import { User, SystemSettings } from '../../models/UserModels.js';

export class AuthService {
  private userRepository: UserRepository;
  private otpService: OtpService;
  private passwordHasher: PasswordHasher;
  private tokenService: TokenService;

  // UseCases
  private registerUserUseCase: RegisterUserUseCase;
  private verifyRegistrationOtpUseCase: VerifyRegistrationOtpUseCase;
  private loginUserUseCase: LoginUserUseCase;
  private forgotPasswordUseCase: ForgotPasswordUseCase;
  private resetPasswordUseCase: ResetPasswordUseCase;

  constructor(userRepository: UserRepository, otpService: OtpService) {
    this.userRepository = userRepository;
    this.otpService = otpService;
    this.passwordHasher = new PasswordHasher();
    this.tokenService = new TokenService();

    // Initialize Use Cases
    this.registerUserUseCase = new RegisterUserUseCase(
      this.userRepository,
      this.otpService,
      this.passwordHasher
    );
    this.verifyRegistrationOtpUseCase = new VerifyRegistrationOtpUseCase(
      this.userRepository
    );
    this.loginUserUseCase = new LoginUserUseCase(
      this.userRepository,
      this.otpService,
      this.passwordHasher,
      this.tokenService
    );
    this.forgotPasswordUseCase = new ForgotPasswordUseCase(
      this.userRepository,
      this.otpService
    );
    this.resetPasswordUseCase = new ResetPasswordUseCase(
      this.userRepository,
      this.passwordHasher
    );
  }

  // Exposed helper methods for legacy compatibility/tests
  hashPassword(password: string): string {
    return this.passwordHasher.hash(password);
  }

  verifyPassword(password: string, hash: string): boolean {
    return this.passwordHasher.verify(password, hash);
  }

  generateSecureToken(payload: object): string {
    return this.tokenService.sign(payload);
  }

  verifySecureToken(token: string): any | null {
    return this.tokenService.verify(token);
  }

  // Delegated Use Case Actions
  async registerUser(data: any) {
    return this.registerUserUseCase.execute(data);
  }

  async verifyRegistrationOtp(email: string, otp: string) {
    return this.verifyRegistrationOtpUseCase.execute(email, otp);
  }

  async loginUser(emailInput: string, passwordInput: string) {
    return this.loginUserUseCase.execute(emailInput, passwordInput);
  }

  async forgotPassword(email: string) {
    return this.forgotPasswordUseCase.execute(email);
  }

  async resetPassword(data: any) {
    return this.resetPasswordUseCase.execute(data);
  }

  // Directly maintained simpler methods
  async socialLogin(email: string, name: string, provider: string): Promise<{ success: boolean; token: string; user: any }> {
    const emailClean = email.trim().toLowerCase();
    
    let user = await this.userRepository.findUserByEmail(emailClean);
    
    if (!user) {
      user = await this.userRepository.createUser({
        name: name || emailClean.split('@')[0],
        email: emailClean,
        role: 'عميل',
        phone: '',
        status: 'نشط',
        password_hash: null
      });
      console.log(`[Social Service] Created new local user for external ${provider} sign-in: ${emailClean}`);
    } else {
      console.log(`[Social Service] Linked external ${provider} account to existing user: ${emailClean}`);
    }

    const userAvatar = user.image || user.avatarUrl || '';
    const userData = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'عميل',
      phone: user.phone || '',
      region: user.region || '',
      city: user.city || '',
      iban: user.iban || '',
      status: user.status,
      image: userAvatar,
      avatar: userAvatar,
      avatarUrl: userAvatar,
      imagePreview: userAvatar
    };

    const token = this.tokenService.sign(userData);

    return {
      success: true,
      token,
      user: userData
    };
  }

  async updateUserRole(email: string, role: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const user = await this.userRepository.findUserByEmail(email);
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود' };
    }

    user.role = role as any;
    await user.save();
    return { success: true, user };
  }

  async getSecuritySettings(): Promise<SystemSettings | { is_email_otp_enabled: boolean; is_sms_otp_enabled: boolean }> {
    const settings = await this.userRepository.findSystemSettings();
    return settings || { is_email_otp_enabled: false, is_sms_otp_enabled: false };
  }

  async updateSecuritySettings(isEmailOtpEnabled: boolean, isSmsOtpEnabled: boolean): Promise<SystemSettings> {
    let settings = await this.userRepository.findSystemSettings();
    if (!settings) {
      settings = await this.userRepository.createSystemSettings({
        is_email_otp_enabled: isEmailOtpEnabled,
        is_sms_otp_enabled: isSmsOtpEnabled
      });
    } else {
      settings.is_email_otp_enabled = isEmailOtpEnabled;
      settings.is_sms_otp_enabled = isSmsOtpEnabled;
      await settings.save();
    }
    return settings;
  }
}
