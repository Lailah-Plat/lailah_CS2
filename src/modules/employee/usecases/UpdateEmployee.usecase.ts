import { IEmployeeRepository } from '../employee.repository.js';
import { Employee } from '../../../models/Database.js';

export class UpdateEmployeeUseCase {
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

  async execute(id: any, body: any, currentUser: Employee | undefined) {
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

    const [updatedCount] = await this.employeeRepository.updateEmployee(id, body);
    if (updatedCount > 0) {
      try {
        await this.employeeRepository.createAuditLog({
          action: 'UPDATE',
          entityType: 'Employee',
          entityId: String(id),
          details: { details: body },
          performedBy: currentUser?.id
        });
      } catch (err) {
        console.error('Failed to log update audit:', err);
      }

      const updatedEmployee = await this.employeeRepository.findEmployeeById(id);
      return this.filterSensitiveData(currentUser, updatedEmployee!);
    } else {
      let existing = await this.employeeRepository.findEmployeeByEmailOrNationalId(body.email || '', body.nationalId);
      if (existing) {
        await this.employeeRepository.updateEmployee(existing.id, body);
        try {
          await this.employeeRepository.createAuditLog({
            action: 'UPDATE',
            entityType: 'Employee',
            entityId: existing.id.toString(),
            details: { details: body },
            performedBy: currentUser?.id
          });
        } catch (err) {}
        const updatedEmployee = await this.employeeRepository.findEmployeeById(existing.id);
        return this.filterSensitiveData(currentUser, updatedEmployee!);
      } else {
        const newEmp = await this.employeeRepository.createEmployee(body);
        try {
          await this.employeeRepository.createAuditLog({
            action: 'CREATE',
            entityType: 'Employee',
            entityId: newEmp.id.toString(),
            details: { details: body },
            performedBy: currentUser?.id
          });
        } catch (err) {}
        return this.filterSensitiveData(currentUser, newEmp);
      }
    }
  }
}
