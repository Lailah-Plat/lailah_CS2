import { IEmployeeRepository } from '../employee.repository.js';

export class DeleteEmployeeUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(id: any, performerId: number | undefined) {
    const deletedCount = await this.employeeRepository.deleteEmployee(id);
    if (deletedCount > 0) {
      try {
        await this.employeeRepository.createAuditLog({
          action: 'DELETE',
          entityType: 'Employee',
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
