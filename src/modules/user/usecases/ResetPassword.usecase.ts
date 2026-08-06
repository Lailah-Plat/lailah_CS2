import { UserRepository } from '../user.repository.js';
import { PasswordHasher } from '../passwordHasher.service.js';
import { ResetTokenStore } from '../resetTokenStore.js';
import { passwordRegex } from '../../../utils/validations.js';

export interface ResetPasswordResult {
  success: boolean;
  message: string;
  error?: string;
}

export class ResetPasswordUseCase {
  private userRepository: UserRepository;
  private passwordHasher: PasswordHasher;

  constructor(userRepository: UserRepository, passwordHasher: PasswordHasher) {
    this.userRepository = userRepository;
    this.passwordHasher = passwordHasher;
  }

  async execute(data: any): Promise<ResetPasswordResult> {
    const { email, otp, newPassword } = data;
    const emailClean = email.trim().toLowerCase();

    // Validate new password strength according to the 9-character policy
    if (!passwordRegex.test(newPassword)) {
      return { success: false, error: 'كلمة المرور الجديدة يجب أن تحتوي على 9 خانات على الأقل، حروف كبيرة وصغيرة، أرقام، ورموز خاصة.', message: '' };
    }

    // Check system admin reset
    if (emailClean === 'admin@system.local') {
      const saved = ResetTokenStore.get(emailClean);
      if (!saved || saved.code !== otp) {
        return { success: false, error: 'رمز التحقق غير صحيح', message: '' };
      }
      const adminInDb = await this.userRepository.findUserByEmail(emailClean);
      if (adminInDb) {
        adminInDb.password_hash = this.passwordHasher.hash(newPassword);
        await adminInDb.save();
      }
      ResetTokenStore.delete(emailClean);
      return { success: true, message: 'تم تعيين كلمة المرور الجديدة بنجاح' };
    }

    const saved = ResetTokenStore.get(emailClean);
    if (!saved) {
      return { success: false, error: 'لم يتم طلب رمز تحقق لهذا البريد أو انتهت صلاحيته', message: '' };
    }

    if (saved.code !== otp) {
      return { success: false, error: 'رمز التحقق غير صحيح', message: '' };
    }

    if (new Date() > saved.expiresAt) {
      ResetTokenStore.delete(emailClean);
      return { success: false, error: 'انتهت صلاحية رمز التحقق', message: '' };
    }

    const user = await this.userRepository.findUserByEmail(emailClean);
    if (!user) {
      return { success: false, error: 'المستخدم غير موجود', message: '' };
    }

    user.password_hash = this.passwordHasher.hash(newPassword);
    await user.save();

    ResetTokenStore.delete(emailClean);

    return { success: true, message: 'تم تعيين كلمة المرور الجديدة بنجاح' };
  }
}
