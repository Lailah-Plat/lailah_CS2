import { UserRepository } from '../user.repository.js';
import { User } from '../../../models/UserModels.js';

export interface VerifyOtpResult {
  success: boolean;
  message: string;
  user?: User;
}

export class VerifyRegistrationOtpUseCase {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  async execute(email: string, otp: string): Promise<VerifyOtpResult> {
    const emailClean = email.trim().toLowerCase();

    const pending = await this.userRepository.findPendingByEmail(emailClean);
    if (!pending) {
      return { success: false, message: 'لا يوجد طلب تسجيل معلق لهذا البريد' };
    }

    if (pending.otp_code !== otp) {
      return { success: false, message: 'كود التحقق غير صحيح' };
    }

    if (new Date() > pending.expires_at) {
      return { success: false, message: 'كود التحقق منتهي الصلاحية' };
    }

    // Create user with default unified role: عميل
    const newUser = await this.userRepository.createUser({
      name: pending.name,
      email: pending.email,
      phone: pending.phone,
      role: 'عميل',
      password_hash: pending.password_hash
    });

    await pending.destroy();

    return { success: true, message: 'تم التسجيل بنجاح', user: newUser };
  }
}
