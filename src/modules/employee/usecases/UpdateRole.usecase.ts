import { IEmployeeRepository } from '../employee.repository.js';

export class UpdateRoleUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(id: any, body: any, performerId: number | undefined) {
    const [updated] = await this.employeeRepository.updateRole(id, body);
    if (updated) {
      try {
        await this.employeeRepository.createAuditLog({
          action: 'UPDATE',
          entityType: 'Role',
          entityId: String(id),
          details: { details: body },
          performedBy: performerId
        });
      } catch (err) {}
      return this.employeeRepository.findRoleById(id);
    }
    return null;
  }
}
