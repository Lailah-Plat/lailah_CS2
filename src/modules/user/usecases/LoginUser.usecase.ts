import { UserRepository } from '../user.repository.js';
import { OtpService } from '../otp.service.js';
import { PasswordHasher } from '../passwordHasher.service.js';
import { TokenService } from '../token.service.js';
import { User } from '../../../models/UserModels.js';

export interface LoginResult {
  success: boolean;
  token?: string;
  user?: any;
  error?: string;
}

export class LoginUserUseCase {
  private userRepository: UserRepository;
  private otpService: OtpService;
  private passwordHasher: PasswordHasher;
  private tokenService: TokenService;

  constructor(
    userRepository: UserRepository,
    otpService: OtpService,
    passwordHasher: PasswordHasher,
    tokenService: TokenService
  ) {
    this.userRepository = userRepository;
    this.otpService = otpService;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
  }

  async execute(emailInput: string, passwordInput: string): Promise<LoginResult> {
    if (!emailInput) {
      return { success: false, error: 'البريد الإلكتروني أو رقم الجوال مطلوب' };
    }

    const inputClean = emailInput.trim();
    let queryField: { email?: string; phone?: string } = {};

    if (this.otpService.isPhone(inputClean)) {
      const normalized = this.otpService.normalizePhone(inputClean);
      queryField = { phone: normalized };
      console.log(`[LoginUseCase] Attempting lookup by PHONE: ${normalized}`);
    } else {
      queryField = { email: inputClean.toLowerCase() };
      console.log(`[LoginUseCase] Attempting lookup by EMAIL: ${inputClean.toLowerCase()}`);
    }

    // Check if it's admin@system.local
    if (typeof inputClean === 'string' && inputClean.toLowerCase() === 'admin@system.local') {
      const adminInDb = await this.userRepository.findUserByEmail('admin@system.local');
      if (!adminInDb || !adminInDb.password_hash) {
        return { success: false, error: 'حساب المشرف غير مهيأ في قاعدة البيانات' };
      }

      const enteredPass = passwordInput ? passwordInput.trim() : '';
      const expectedPassword = adminInDb.password_hash.trim();

      const isMatch = this.passwordHasher.verify(enteredPass, expectedPassword);
      if (!isMatch) {
        return { success: false, error: 'كلمة المرور غير صحيحة' };
      }

      // Automatic password upgrade to bcrypt
      const isBcrypt = expectedPassword.startsWith('$2a$') || expectedPassword.startsWith('$2b$');
      if (!isBcrypt) {
        adminInDb.password_hash = this.passwordHasher.hash(enteredPass);
        await adminInDb.save();
        console.log('[LoginUseCase] Admin password automatically migrated to secure bcrypt hash.');
      }

      const adminAvatar = adminInDb.image || adminInDb.avatarUrl || 'https://i.pravatar.cc/150?img=11';
      const systemAdmin = {
        id: adminInDb.id || 1,
        name: adminInDb.name || 'المشرف العام (System)',
        email: 'admin@system.local',
        role: 'admin',
        status: 'نشط',
        region: adminInDb.region || 'الرياض',
        city: adminInDb.city || 'الرياض',
        image: adminAvatar,
        avatar: adminAvatar,
        avatarUrl: adminAvatar,
        imagePreview: adminAvatar
      };

      const token = this.tokenService.sign(systemAdmin);

      return {
        success: true,
        token,
        user: systemAdmin
      };
    }

    let user: User | null = null;
    if (queryField.phone) {
      user = await this.userRepository.findUserByPhone(queryField.phone);
    } else if (queryField.email) {
      user = await this.userRepository.findUserByEmail(queryField.email);
    }

    if (!user) {
      return { success: false, error: 'المستخدم غير مسجل بالمنصة' };
    }

    const enteredPass = passwordInput ? passwordInput.trim() : '';
    const expectedPassword = user.password_hash;

    if (!expectedPassword) {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    const isMatch = this.passwordHasher.verify(enteredPass, expectedPassword);
    if (!isMatch) {
      return { success: false, error: 'كلمة المرور غير صحيحة' };
    }

    // Automatic password upgrade to bcrypt
    const isBcrypt = expectedPassword.startsWith('$2a$') || expectedPassword.startsWith('$2b$');
    if (!isBcrypt) {
      user.password_hash = this.passwordHasher.hash(enteredPass);
      await user.save();
      console.log(`[LoginUseCase] User ${user.email} password automatically migrated to secure bcrypt hash.`);
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
}
