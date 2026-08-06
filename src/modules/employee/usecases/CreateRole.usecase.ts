import { IEmployeeRepository } from '../employee.repository.js';

export class CreateRoleUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(body: any, performerId: number | undefined) {
    const role = await this.employeeRepository.createRole(body);
    try {
      await this.employeeRepository.createAuditLog({
        action: 'CREATE',
        entityType: 'Role',
        entityId: role.id.toString(),
        details: { details: body },
        performedBy: performerId
      });
    } catch (err) {}
    return role;
  }
}
