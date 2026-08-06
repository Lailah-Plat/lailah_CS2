import fs from 'fs';
import path from 'path';
import { Role, Employee, AuditLog } from '../../models/Database.js';

export function maskUrl(url: string | null): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (parsed.password) {
      parsed.password = '********';
    }
    return parsed.toString();
  } catch (e) {
    if (url.length > 20) {
      return url.slice(0, 15) + '...********...' + url.slice(-10);
    }
    return '********';
  }
}

export function maskToken(token: string | null): string {
  if (!token) return '';
  if (token.length > 8) {
    return token.slice(0, 4) + '...********...' + token.slice(-4);
  }
  return '********';
}

export interface ISecurityRepository {
  getConfig(): any;
  saveConfig(config: any): void;
  getAuditLogs(): Promise<AuditLog[]>;
  createAuditLog(data: any): Promise<AuditLog>;
  getRoles(): Promise<Role[]>;
  findRoleById(id: number): Promise<Role | null>;
  createRole(data: any): Promise<Role>;
  updateRole(role: Role, data: any): Promise<Role>;
}

export class SequelizeSecurityRepository implements ISecurityRepository {
  private configFilePath = path.join(process.cwd(), 'database_config.json');

  getConfig(): any {
    if (fs.existsSync(this.configFilePath)) {
      return JSON.parse(fs.readFileSync(this.configFilePath, 'utf-8'));
    }
    return {};
  }

  saveConfig(config: any): void {
    fs.writeFileSync(this.configFilePath, JSON.stringify(config, null, 2), 'utf-8');
  }

  async getAuditLogs(): Promise<AuditLog[]> {
    return AuditLog.findAll({
      include: [{ model: Employee, as: 'performer', attributes: ['id', 'fullName', 'email', 'jobTitle'] }],
      order: [['createdAt', 'DESC']],
      limit: 100
    });
  }

  async createAuditLog(data: any): Promise<AuditLog> {
    const currentYear = new Date().getFullYear();
    const yy = String(currentYear).slice(-2);
    const count = await AuditLog.count();
    const seq = String(count + 1).padStart(10, '0');
    const refNo = data.refNo || `AUD-${yy}-${seq}`;

    const details = {
      refNo,
      supervisor: data.supervisor || 'م. عبد العزيز الغامدي (المدير العام)',
      actionType: data.actionType || data.action || 'تعديل حوكمة الصلاحيات',
      targetEntity: data.targetEntity || data.entityType || 'المنصة العامة',
      technicalDetails: data.technicalDetails || (typeof data.details === 'string' ? data.details : JSON.stringify(data.details || {})),
      dateTime: data.dateTime || new Date().toISOString(),
      isSensitive: data.isSensitive !== undefined ? data.isSensitive : true,
      encryptionType: data.encryptionType || 'AES-256-GCM / SHA-256',
      ...(typeof data.details === 'object' ? data.details : {})
    };

    return AuditLog.create({
      action: data.actionType || data.action || 'تحديث الصلاحيات',
      entityType: data.targetEntity || data.entityType || 'الصلاحيات والأدوار',
      entityId: refNo,
      details,
      performedBy: data.performedBy || null
    });
  }

  async getRoles(): Promise<Role[]> {
    return Role.findAll();
  }

  async findRoleById(id: number): Promise<Role | null> {
    return Role.findByPk(id);
  }

  async createRole(data: any): Promise<Role> {
    return Role.create({
      name: data.name,
      permissions: data.permissions,
      status: data.status || 'active'
    });
  }

  async updateRole(role: Role, data: any): Promise<Role> {
    await role.update({
      name: data.name !== undefined ? data.name : role.name,
      permissions: data.permissions !== undefined ? data.permissions : role.permissions,
      status: data.status !== undefined ? data.status : role.status
    });
    return role;
  }
}
