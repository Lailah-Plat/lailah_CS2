import { ISecurityRepository } from '../security.repository.js';
import { AuditLog } from '../../../models/Database.js';

export class CreateAuditLogUseCase {
  constructor(private securityRepository: ISecurityRepository) {}

  async execute(data: any): Promise<AuditLog> {
    if (!data.action || !data.entityType || !data.entityId) {
      throw new Error('بيانات سجل التدقيق غير كاملة.');
    }
    return this.securityRepository.createAuditLog(data);
  }
}
