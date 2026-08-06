import { User, PendingRegistration, SystemSettings } from '../../models/UserModels.js';
import { Op } from 'sequelize';

export interface IUserRepository {
  findUserById(id: number): Promise<User | null>;
  findUserByEmail(email: string): Promise<User | null>;
  findUserByPhone(phone: string): Promise<User | null>;
  findAllUsers(): Promise<User[]>;
  createUser(data: any): Promise<User>;
  updateUser(id: number, data: any): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;

  findPendingById(id: number): Promise<PendingRegistration | null>;
  findPendingByEmail(email: string): Promise<PendingRegistration | null>;
  findAllPending(): Promise<PendingRegistration[]>;
  createPending(data: any): Promise<PendingRegistration>;
  deletePending(id: number): Promise<boolean>;
  deletePendingByEmail(email: string): Promise<boolean>;

  findSystemSettings(): Promise<SystemSettings | null>;
  createSystemSettings(data: any): Promise<SystemSettings>;
}

export class UserRepository implements IUserRepository {
  async findUserById(id: number): Promise<User | null> {
    return User.findByPk(id);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return User.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    return User.findOne({ where: { phone } });
  }

  async findAllUsers(): Promise<User[]> {
    return User.findAll();
  }

  async createUser(data: any): Promise<User> {
    return User.create(data);
  }

  async updateUser(id: number, data: any): Promise<User | null> {
    const user = await User.findByPk(id);
    if (!user) return null;
    await user.update(data);
    return user;
  }

  async deleteUser(id: number): Promise<boolean> {
    const user = await User.findByPk(id);
    if (!user) return false;
    await user.destroy();
    return true;
  }

  async findPendingById(id: number): Promise<PendingRegistration | null> {
    return PendingRegistration.findByPk(id);
  }

  async findPendingByEmail(email: string): Promise<PendingRegistration | null> {
    return PendingRegistration.findOne({ where: { email: email.trim().toLowerCase() } });
  }

  async findAllPending(): Promise<PendingRegistration[]> {
    return PendingRegistration.findAll();
  }

  async createPending(data: any): Promise<PendingRegistration> {
    return PendingRegistration.create(data);
  }

  async deletePending(id: number): Promise<boolean> {
    const pending = await PendingRegistration.findByPk(id);
    if (!pending) return false;
    await pending.destroy();
    return true;
  }

  async deletePendingByEmail(email: string): Promise<boolean> {
    const count = await PendingRegistration.destroy({
      where: { email: email.trim().toLowerCase() }
    });
    return count > 0;
  }

  async findSystemSettings(): Promise<SystemSettings | null> {
    return SystemSettings.findOne();
  }

  async createSystemSettings(data: any): Promise<SystemSettings> {
    return SystemSettings.create(data);
  }
}
