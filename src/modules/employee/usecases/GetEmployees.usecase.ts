import { IEmployeeRepository } from '../employee.repository.js';
import { Employee } from '../../../models/Database.js';

export class GetEmployeesUseCase {
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

  private async logAudit(action: string, entityType: string, entityId: string | null, details: any, performedBy: number | undefined) {
    if (!performedBy) return;
    try {
      await this.employeeRepository.createAuditLog({
        action,
        entityType,
        entityId,
        details,
        performedBy
      });
    } catch (err) {
      console.error('Failed to write audit log', err);
    }
  }

  async execute(currentUser: Employee | undefined) {
    let employees = await this.employeeRepository.findAllEmployees();

    if (employees.length === 0) {
      try {
        let adminRole = await this.employeeRepository.findRoleByName('مدير النظام');
        if (!adminRole) {
          adminRole = await this.employeeRepository.createRole({
            name: 'مدير النظام',
            permissions: { '*': ['view', 'add', 'edit', 'delete', 'ban'] },
            status: 'active'
          });
        }

        await this.employeeRepository.createEmployee({
          fullName: 'Admin User',
          nationalId: '1234567890',
          qualification: 'Bachelors',
          avatarUrl: '',
          phone: '0500000000',
          email: 'admin@system.local',
          nationalAddress: '123 Riyadh',
          region: 'Riyadh',
          city: 'Riyadh',
          jobTitle: 'المدير العام (Admin)',
          permissions: { '*': ['view', 'add', 'edit', 'delete', 'ban'] },
          RoleId: adminRole.id,
          status: 'active'
        });

        employees = await this.employeeRepository.findAllEmployees();
      } catch (seedErr) {
        console.error("Auto-seeding within GetEmployeesUseCase failed:", seedErr);
      }
    }

    const canSeeSensitive = this.hasSensitiveAccess(currentUser);
    if (canSeeSensitive) {
      await this.logAudit('VIEW_LIST', 'Employee', null, { message: 'Viewed all employees (sensitive data exposed)' }, currentUser?.id);
    }

    return employees.map(emp => this.filterSensitiveData(currentUser, emp));
  }
}
