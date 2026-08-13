import { User, PendingRegistration, SystemSettings } from '../../models/UserModels.js';
import { Op } from 'sequelize';

function getPhoneVariants(phoneStr: string): string[] {
  if (!phoneStr) return [];
  const raw = phoneStr.trim();
  const digits = raw.replace(/[^\d]/g, '');
  const variants = new Set<string>();

  if (raw) variants.add(raw);
  if (digits) variants.add(digits);

  // KSA phone variations
  if (digits.length === 10 && digits.startsWith('05')) {
    variants.add(digits); // 0551234567
    variants.add(digits.substring(1)); // 551234567
    variants.add('+966' + digits.substring(1)); // +966551234567
    variants.add('966' + digits.substring(1)); // 966551234567
  } else if (digits.length === 9 && digits.startsWith('5')) {
    variants.add('0' + digits); // 0551234567
    variants.add(digits); // 551234567
    variants.add('+966' + digits); // +966551234567
    variants.add('966' + digits); // 966551234567
  } else if (digits.length === 12 && digits.startsWith('9665')) {
    variants.add('0' + digits.substring(3)); // 0551234567
    variants.add(digits.substring(3)); // 551234567
    variants.add('+' + digits); // +966551234567
    variants.add(digits); // 966551234567
  }

  return Array.from(variants);
}

export interface IUserRepository {
  findUserById(id: number): Promise<User | null>;
  findUserByIdentifier(identifier: string): Promise<User | null>;
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

  async findUserByIdentifier(identifier: string): Promise<User | null> {
    if (!identifier) return null;
    const raw = identifier.trim();
    if (!raw) return null;

    const cleanEmail = raw.toLowerCase();
    const phoneVars = getPhoneVariants(raw);

    const orConditions: any[] = [
      { email: cleanEmail },
      { email: raw }
    ];

    if (phoneVars.length > 0) {
      phoneVars.forEach(p => {
        orConditions.push({ phone: p });
      });
    }

    let user = await User.findOne({
      where: {
        [Op.or]: orConditions
      }
    });

    if (!user) {
      // Robust fallback search for formatting, case, or phone variations
      const allUsers = await User.findAll();
      const rawDigits = raw.replace(/[^\d]/g, '');
      user = allUsers.find(u => {
        const uEmail = u.email ? u.email.trim().toLowerCase() : '';
        const uPhone = u.phone ? u.phone.trim() : '';
        const uPhoneDigits = uPhone.replace(/[^\d]/g, '');

        if (uEmail && uEmail === cleanEmail) return true;
        if (uPhone && phoneVars.includes(uPhone)) return true;
        if (rawDigits && rawDigits.length >= 7 && uPhoneDigits && uPhoneDigits.endsWith(rawDigits)) return true;
        if (rawDigits && rawDigits.length >= 7 && uPhoneDigits && rawDigits.endsWith(uPhoneDigits)) return true;
        return false;
      }) || null;
    }

    return user;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.findUserByIdentifier(email);
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    return this.findUserByIdentifier(phone);
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
    if (!email) return null;
    const raw = email.trim();
    const cleanEmail = raw.toLowerCase();
    return PendingRegistration.findOne({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { email: raw }
        ]
      }
    });
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
    if (!email) return false;
    const raw = email.trim();
    const cleanEmail = raw.toLowerCase();
    const count = await PendingRegistration.destroy({
      where: {
        [Op.or]: [
          { email: cleanEmail },
          { email: raw }
        ]
      }
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

