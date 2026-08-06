import { Request, Response } from 'express';
import { UserRepository } from './user.repository.js';
import { AuthService } from './auth.service.js';
import { OtpService } from './otp.service.js';

const userRepository = new UserRepository();
const otpService = new OtpService();
const authService = new AuthService(userRepository, otpService);

// Legacy exports for backward compatibility across the codebase (e.g. auth middleware)
export function hashPassword(password: string): string {
  return authService.hashPassword(password);
}

export function verifyPassword(password: string, hash: string): boolean {
  return authService.verifyPassword(password, hash);
}

export function generateSecureToken(payload: object): string {
  return authService.generateSecureToken(payload);
}

export function verifySecureToken(token: string): any | null {
  return authService.verifySecureToken(token);
}

export class AuthController {
  private authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  async registerUser(req: Request, res: Response) {
    try {
      const result = await this.authService.registerUser(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب' });
    }
  }

  async verifyRegistrationOtp(req: Request, res: Response) {
    try {
      const { email, otp } = req.body;
      const result = await this.authService.verifyRegistrationOtp(email, otp);
      if (!result.success) {
        return res.status(400).json({ error: result.message });
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب' });
    }
  }

  async getSecuritySettings(req: Request, res: Response) {
    try {
      const settings = await this.authService.getSecuritySettings();
      return res.json(settings);
    } catch (error) {
      res.status(500).json({ error: 'حدث خطأ' });
    }
  }

  async updateSecuritySettings(req: Request, res: Response) {
    try {
      const { isEmailOtpEnabled, isSmsOtpEnabled } = req.body;
      const settings = await this.authService.updateSecuritySettings(isEmailOtpEnabled, isSmsOtpEnabled);
      return res.json({ success: true, settings });
    } catch (error) {
      res.status(500).json({ error: 'حدث خطأ' });
    }
  }

  async loginUser(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await this.authService.loginUser(email, password);
      if (!result.success) {
        if (result.error === 'المستخدم غير مسجل بالمنصة') {
          return res.status(404).json({ error: result.error });
        }
        return res.status(400).json({ error: result.error });
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول' });
    }
  }

  async socialLogin(req: Request, res: Response) {
    try {
      const { email, name, provider } = req.body;
      const result = await this.authService.socialLogin(email, name, provider);
      return res.json(result);
    } catch (error) {
      console.error('[Social Login Error]:', error);
      res.status(500).json({ error: 'حدث خطأ أثناء الدخول بالحساب الخارجي' });
    }
  }

  async updateUserRole(req: Request, res: Response) {
    try {
      const { email, role } = req.body;
      const result = await this.authService.updateUserRole(email, role);
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'حدث خطأ أثناء تعديل دور المستخدم' });
    }
  }

  async forgotPassword(req: Request, res: Response) {
    try {
      const { email } = req.body;
      const result = await this.authService.forgotPassword(email);
      if (!result.success) {
        return res.status(404).json({ error: result.error });
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'حدث خطأ أثناء معالجة الطلب' });
    }
  }

  async resetPassword(req: Request, res: Response) {
    try {
      const result = await this.authService.resetPassword(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error });
      }
      return res.json(result);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'حدث خطأ أثناء إعادة تعيين كلمة المرور' });
    }
  }
}

// Instantiate and export the bound methods for routes to use seamlessly
const controllerInstance = new AuthController(authService);

export const registerUser = controllerInstance.registerUser.bind(controllerInstance);
export const verifyRegistrationOtp = controllerInstance.verifyRegistrationOtp.bind(controllerInstance);
export const getSecuritySettings = controllerInstance.getSecuritySettings.bind(controllerInstance);
export const updateSecuritySettings = controllerInstance.updateSecuritySettings.bind(controllerInstance);
export const loginUser = controllerInstance.loginUser.bind(controllerInstance);
export const socialLogin = controllerInstance.socialLogin.bind(controllerInstance);
export const updateUserRole = controllerInstance.updateUserRole.bind(controllerInstance);
export const forgotPassword = controllerInstance.forgotPassword.bind(controllerInstance);
export const resetPassword = controllerInstance.resetPassword.bind(controllerInstance);
export default controllerInstance;
