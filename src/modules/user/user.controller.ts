import { Request, Response } from 'express';
import { UserRepository } from './user.repository.js';
import { UserService } from './user.service.js';
import { OtpService } from './otp.service.js';
import { redisCache } from '../../services/redisCache.js';

const userRepository = new UserRepository();
const otpService = new OtpService();
const userService = new UserService(userRepository, otpService);

export class UserController {
  private userService: UserService;

  constructor(userService: UserService) {
    this.userService = userService;
  }

  async getAllUsers(req: Request, res: Response) {
    try {
      const result = await this.userService.getAllUsers();
      res.json({ success: true, verified: result.verified, pending: result.pending });
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: 'حدث خطأ أثناء استرجاع المستخدمين' });
    }
  }

  async getRedisStats(req: Request, res: Response) {
    try {
      const stats = redisCache.getStats();
      res.json({ success: true, ...stats });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async flushRedis(req: Request, res: Response) {
    try {
      redisCache.flush();
      res.json({ success: true, message: 'تم إفراغ ذاكرة كاش Redis وإعادة ضبط الإحصائيات بنجاح.' });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  async createUser(req: Request, res: Response) {
    try {
      const result = await this.userService.createUser(req.body);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      return res.json(result);
    } catch (error: any) {
      console.error("Error creating user:", error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء إضافة المستخدم' });
    }
  }

  async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const data = { ...req.body, id };
      const result = await this.userService.updateUser(Number(id), data);
      if (!result.success) {
        return res.status(404).json({ success: false, error: result.error });
      }
      return res.json(result);
    } catch (error: any) {
      console.error("Error updating user:", error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء تحديث بيانات المستخدم' });
    }
  }

  async deleteUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const isPending = req.query.isPending === 'true';
      const result = await this.userService.deleteUser(Number(id), isPending);
      if (!result.success) {
        return res.status(404).json({ success: false, error: result.error });
      }
      return res.json(result);
    } catch (error: any) {
      console.error("Error deleting user:", error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء حذف المستخدم' });
    }
  }

  async completeProfile(req: Request, res: Response) {
    try {
      const result = await this.userService.completeProfile(req.body);
      if (!result.success) {
        return res.status(404).json({ success: false, error: result.error });
      }
      return res.json(result);
    } catch (error: any) {
      console.error("Error completing profile:", error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء حفظ استكمال ملف المستخدم' });
    }
  }

  async migrateProviders(req: Request, res: Response) {
    try {
      const { providers } = req.body;
      if (!Array.isArray(providers)) {
        return res.status(400).json({ success: false, error: 'البيانات المرسلة غير صالحة' });
      }

      const migrated = await this.userService.migrateProviders(providers);
      return res.json({ success: true, migratedCount: migrated.length, migrated });
    } catch (error: any) {
      console.error("Error migrating providers:", error);
      res.status(500).json({ success: false, error: error.message || 'حدث خطأ أثناء ترحيل بيانات المزودين' });
    }
  }
}

// Instantiate and export the bound methods for routes to use seamlessly
const controllerInstance = new UserController(userService);

export const getAllUsers = controllerInstance.getAllUsers.bind(controllerInstance);
export const getRedisStats = controllerInstance.getRedisStats.bind(controllerInstance);
export const flushRedis = controllerInstance.flushRedis.bind(controllerInstance);
export const createUser = controllerInstance.createUser.bind(controllerInstance);
export const updateUser = controllerInstance.updateUser.bind(controllerInstance);
export const deleteUser = controllerInstance.deleteUser.bind(controllerInstance);
export const completeProfile = controllerInstance.completeProfile.bind(controllerInstance);
export const migrateProviders = controllerInstance.migrateProviders.bind(controllerInstance);
export default controllerInstance;
