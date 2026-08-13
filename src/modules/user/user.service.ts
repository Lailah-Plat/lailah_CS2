import { UserRepository } from './user.repository.js';
import { OtpService } from './otp.service.js';
import { User, PendingRegistration } from '../../models/UserModels.js';
import { normalizeIban } from '../../utils/phoneMigration.js';
import { redisCache } from '../../services/redisCache.js';

export class UserService {
  private userRepository: UserRepository;
  private otpService: OtpService;

  constructor(userRepository: UserRepository, otpService: OtpService) {
    this.userRepository = userRepository;
    this.otpService = otpService;
  }

  async getAllUsers(): Promise<{ verified: any[]; pending: PendingRegistration[] }> {
    const verifiedUsers = await this.userRepository.findAllUsers();
    const pendingUsers = await this.userRepository.findAllPending();

    // Cache-Aside pattern for user points to avoid database strain
    const verifiedWithCachedPoints = verifiedUsers.map(u => {
      const uJson = u.toJSON() as any;
      if (uJson.role === 'عميل' || uJson.role === 'customer' || uJson.role === 'client') {
        const cacheKey = `user_points:${uJson.id}`;
        let pts = redisCache.get(cacheKey);
        if (pts === null) {
          // Cache Miss: read from database and write into Redis with 300 seconds TTL
          pts = uJson.points !== undefined && uJson.points !== null ? uJson.points : 0;
          redisCache.set(cacheKey, pts, 300);
        } else {
          // Cache Hit: serve the loyalty points from Redis cache directly
          uJson.points = pts;
        }
      }
      return uJson;
    });

    return {
      verified: verifiedWithCachedPoints,
      pending: pendingUsers
    };
  }

  async createUser(data: any): Promise<{ success: boolean; user: any; isPending: boolean; error?: string }> {
    const { name, email, phone, role, status, region, city, isPending, otp_code, points } = data;

    if (!name || !email || !role) {
      return { success: false, user: null, isPending: false, error: 'الاسم والبريد الإلكتروني والدور حقول مطلوبة' };
    }

    if (isPending) {
      const code = otp_code || this.otpService.generateOtpCode();
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);

      const pending = await this.userRepository.createPending({
        name,
        email,
        phone: phone ? this.otpService.normalizePhone(phone) : '',
        role,
        otp_code: code,
        expires_at: expires
      });
      return { success: true, user: pending, isPending: true };
    } else {
      const existing = await this.userRepository.findUserByEmail(email);
      if (existing) {
        return { success: false, user: null, isPending: false, error: 'البريد الإلكتروني مسجل بالفعل لمستند آخر' };
      }

      const user = await this.userRepository.createUser({
        name,
        email,
        phone: phone ? this.otpService.normalizePhone(phone) : '',
        role,
        status: status || 'نشط',
        region: region || '',
        city: city || '',
        points: points || 0
      });
      return { success: true, user, isPending: false };
    }
  }

  async updateUser(id: number, data: any): Promise<{ success: boolean; user: any; isPending: boolean; error?: string }> {
    const { name, email, phone, role, status, region, city, addressDetails, bankName, iban, commercialRecord, isPending, otp_code, avatarUrl, image, imagePreview, points } = data;

    if (isPending === true || isPending === 'true') {
      const pending = await this.userRepository.findPendingById(id);
      if (!pending) {
        return { success: false, user: null, isPending: true, error: 'المستخدم المعلق غير موجود' };
      }

      pending.name = name ?? pending.name;
      pending.email = email ?? pending.email;
      pending.phone = phone ? this.otpService.normalizePhone(phone) : pending.phone;
      pending.role = role ?? pending.role;
      pending.otp_code = otp_code ?? pending.otp_code;
      await pending.save();

      return { success: true, user: pending, isPending: true };
    } else {
      const user = await this.userRepository.findUserById(id);
      if (!user) {
        return { success: false, user: null, isPending: false, error: 'المستخدم غير موجود' };
      }

      user.name = name ?? user.name;
      user.email = email ?? user.email;
      user.phone = phone ? this.otpService.normalizePhone(phone) : user.phone;
      user.role = role ?? user.role;
      user.status = status ?? user.status;
      user.region = region ?? user.region;
      user.city = city ?? user.city;
      if (addressDetails !== undefined) user.addressDetails = addressDetails;
      if (bankName !== undefined) user.bankName = bankName;
      if (iban !== undefined) user.iban = iban ? normalizeIban(iban) : iban;
      if (commercialRecord !== undefined) user.commercialRecord = commercialRecord;
      
      const targetAvatar = avatarUrl || image || imagePreview;
      if (targetAvatar !== undefined) {
        user.avatarUrl = targetAvatar;
        user.image = targetAvatar;
      }

      // If points are updated, update the database AND invalidate/delete the Redis cache key
      if (points !== undefined) {
        user.points = points;
        const cacheKey = `user_points:${user.id}`;
        redisCache.del(cacheKey); // Invalidation pattern ensures next read updates cache with fresh DB value
      }

      await user.save();

      return { success: true, user, isPending: false };
    }
  }

  async deleteUser(id: number, isPending: boolean): Promise<{ success: boolean; message: string; error?: string }> {
    if (isPending) {
      const success = await this.userRepository.deletePending(id);
      if (!success) {
        return { success: false, message: '', error: 'المستخدم المعلق غير موجود' };
      }
      return { success: true, message: 'تم حذف المستخدم المعلق بنجاح' };
    } else {
      const success = await this.userRepository.deleteUser(id);
      if (!success) {
        return { success: false, message: '', error: 'المستخدم غير موجود' };
      }
      return { success: true, message: 'تم حذف المستخدم بنجاح' };
    }
  }

  async completeProfile(data: any): Promise<{ success: boolean; message: string; user?: User; error?: string }> {
    const { email, id, region, city, addressDetails, bankName, iban, commercialRecord } = data;

    let user;
    if (id) {
      user = await this.userRepository.findUserById(id);
    }
    if (!user && email) {
      user = await this.userRepository.findUserByEmail(email);
    }

    if (!user) {
      return { success: false, error: 'المستخدم غير موجود', message: '' };
    }

    user.region = region ?? user.region;
    user.city = city ?? user.city;
    if (addressDetails !== undefined) user.addressDetails = addressDetails;
    if (bankName !== undefined) user.bankName = bankName;
    if (iban !== undefined) user.iban = iban ? normalizeIban(iban) : iban;
    if (commercialRecord !== undefined) user.commercialRecord = commercialRecord;

    await user.save();

    return { success: true, message: 'تم استكمال الملف الشخصي بنجاح', user };
  }

  async syncProfile(data: any): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const { providerName, showProviderToCustomers, username, customerAlias, settings } = data;
      let user;
      if (providerName) {
        user = await User.findOne({ where: { name: providerName } });
      }
      if (!user && settings?.email) {
        user = await this.userRepository.findUserByEmail(settings.email);
      }
      if (user) {
        const uname = username || customerAlias || settings?.username;
        if (uname !== undefined) user.username = uname;
        if (showProviderToCustomers !== undefined) user.showProviderToCustomers = showProviderToCustomers;
        if (settings?.region) user.region = settings.region;
        if (settings?.city) user.city = settings.city;
        if (settings?.nationalAddress) user.addressDetails = settings.nationalAddress;
        if (settings?.bankName) user.bankName = settings.bankName;
        if (settings?.iban) user.iban = normalizeIban(settings.iban);
        if (settings?.crNumber) user.commercialRecord = settings.crNumber;
        await user.save();
        return { success: true, message: 'تم التزامن وتحديث بيانات المزود في قاعدة البيانات السحابية بنجاح', user };
      }
    } catch (e) {
      console.error('Error in syncProfile user.service:', e);
    }
    return { success: true, message: 'تم استقبال إشارة التزامن السحابي بنجاح' };
  }

  async migrateProviders(providers: any[]): Promise<User[]> {
    const migrated = [];
    for (const p of providers) {
      if (!p.email) continue;
      const email = p.email.toLowerCase().trim();
      let user = await this.userRepository.findUserByEmail(email);
      if (!user) {
        user = await this.userRepository.createUser({
          name: p.name,
          email: email,
          phone: p.phone || '',
          role: 'مزود',
          status: 'نشط',
          region: p.region || 'الرياض',
          city: p.city || 'الرياض',
          iban: p.iban || '',
          commercialRecord: p.commercialRecord || p.idNumber || '',
          password_hash: p.password_hash || null,
        });
        migrated.push(user);
      }
    }
    return migrated;
  }
}
