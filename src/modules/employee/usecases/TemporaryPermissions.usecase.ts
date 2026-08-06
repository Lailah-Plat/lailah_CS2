import { IEmployeeRepository } from '../employee.repository.js';

export class GetTemporaryPermissionsUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(employeeId?: any) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;
    return this.employeeRepository.findTemporaryPermissions(where);
  }
}

export class CreateTemporaryPermissionUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(body: any, performerId: number | undefined) {
    const record = await this.employeeRepository.createTemporaryPermission(body);
    try {
      await this.employeeRepository.createAuditLog({
        action: 'GRANT_TEMP_PERMISSION',
        entityType: 'TemporaryPermission',
        entityId: record.id.toString(),
        details: { record },
        performedBy: performerId
      });
    } catch (err) {}

    const list = await this.employeeRepository.findTemporaryPermissions({ id: record.id });
    return list[0] || record;
  }
}

export class DeleteTemporaryPermissionUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(id: any, performerId: number | undefined) {
    const deleted = await this.employeeRepository.deleteTemporaryPermission(id);
    if (deleted > 0) {
      try {
        await this.employeeRepository.createAuditLog({
          action: 'REVOKE_TEMP_PERMISSION',
          entityType: 'TemporaryPermission',
          entityId: String(id),
          details: {},
          performedBy: performerId
        });
      } catch (err) {}
      return true;
    }
    return false;
  }
}
