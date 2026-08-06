import { IEmployeeRepository } from '../employee.repository.js';

export class CreateEmployeeUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(body: any, performerId: number | undefined) {
    if (body.jobTitle && !body.RoleId) {
      let matchRole = await this.employeeRepository.findRoleByName(body.jobTitle);
      if (!matchRole) {
        matchRole = await this.employeeRepository.createRole({
          name: body.jobTitle,
          permissions: { '*': ['view', 'add', 'edit', 'delete'] },
          status: 'active'
        });
      }
      body.RoleId = matchRole.id;
    }

    const employee = await this.employeeRepository.createEmployee(body);

    try {
      await this.employeeRepository.createAuditLog({
        action: 'CREATE',
        entityType: 'Employee',
        entityId: employee.id.toString(),
        details: { details: body },
        performedBy: performerId
      });
    } catch (err) {
      console.error('Failed to write create employee audit log:', err);
    }

    return employee;
  }
}
