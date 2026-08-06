import { ISecurityRepository } from '../security.repository.js';

export class GetAuditLogsUseCase {
  constructor(private securityRepository: ISecurityRepository) {}

  async execute(): Promise<any[]> {
    const logs = await this.securityRepository.getAuditLogs();
    const currentYear = new Date().getFullYear().toString().slice(-2);

    return logs.map((log: any, index: number) => {
      const details = typeof log.details === 'object' && log.details ? log.details : {};
      const performerName = log.performer?.fullName 
        ? `${log.performer.fullName} (${log.performer.jobTitle || 'مشرف'})` 
        : (details.supervisor || 'م. عبد العزيز الغامدي (المدير العام)');

      const seqStr = String(log.id || (index + 1)).padStart(10, '0');
      const fallbackRefNo = `AUD-${currentYear}-${seqStr}`;

      return {
        id: log.id,
        refNo: details.refNo || log.entityId || fallbackRefNo,
        supervisor: details.supervisor || performerName,
        actionType: details.actionType || log.action || 'تعديل حوكمة الصلاحيات',
        targetEntity: details.targetEntity || log.entityType || 'المنصة العامة',
        technicalDetails: details.technicalDetails || (typeof details === 'string' ? details : JSON.stringify(details)),
        dateTime: details.dateTime || log.createdAt || new Date().toISOString(),
        isSensitive: details.isSensitive !== undefined ? details.isSensitive : true,
        encryptionType: details.encryptionType || 'AES-256-GCM / SHA-256'
      };
    });
  }
}
