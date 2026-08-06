import { IEmployeeRepository } from '../employee.repository.js';
import { Employee } from '../../../models/Database.js';

export class GetEmployeeByIdUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  private hasSensitiveAccess(user?: Employee) {
    if (!user || !user.role) return false;
    const roleName = (user.role as any).name;
    return roleName === 'مدير النظام' || roleName === 'المدير العام' || roleName === 'المشرف المالي';
  }

  private filterSensitiveData(currentUser: Employee | undefined, employee: Employee) {
    const json = employee.toJSON() as any;
    if (!this.hasSensitiveAccess(currentUser) && currentUser?.id !== employee.id) {
      delete json.nationalId;
      delete json.iban;
      delete json.baseSalary;
      delete json.allowances;
      delete json.insuranceNumber;
    }
    return json;
  }

  async execute(id: any, currentUser: Employee | undefined) {
    const employee = await this.employeeRepository.findEmployeeById(id);
    if (!employee) {
      throw new Error('Employee not found');
    }
    
    try {
      await this.employeeRepository.createAuditLog({
        action: 'VIEW',
        entityType: 'Employee',
        entityId: String(id),
        details: { message: 'Viewed employee profile' },
        performedBy: currentUser?.id
      });
    } catch (err) {
      console.error('Failed to log employee view audit:', err);
    }

    return this.filterSensitiveData(currentUser, employee);
  }
}
