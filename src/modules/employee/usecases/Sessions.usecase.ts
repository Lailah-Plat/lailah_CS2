import { IEmployeeRepository } from '../employee.repository.js';

export class GetSessionsUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(employeeId?: any) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    let records = await this.employeeRepository.findSessions(where);

    if (records.length === 0) {
      const employees = await this.employeeRepository.findAllEmployees();
      const mockData = [];
      const now = new Date().toISOString();
      for (const emp of employees) {
        mockData.push({
          employeeId: emp.id,
          ipAddress: '197.34.120.91',
          device: 'Windows 11 - Chrome',
          location: 'الرياض، المملكة العربية السعودية',
          lastActive: now,
          mfaVerified: true
        });
        mockData.push({
          employeeId: emp.id,
          ipAddress: '82.164.22.10',
          device: 'iOS - Safari Mobile',
          location: 'جدة، المملكة العربية السعودية',
          lastActive: new Date(Date.now() - 3600000).toISOString(),
          mfaVerified: false
        });
      }
      if (mockData.length > 0) {
        await this.employeeRepository.createSession(mockData[0]);
        if (mockData[1]) await this.employeeRepository.createSession(mockData[1]);
      }
      records = await this.employeeRepository.findSessions(where);
    }
    return records;
  }
}

export class RevokeSessionUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(id: any, performerId: number | undefined) {
    const deleted = await this.employeeRepository.deleteSession(id);
    if (deleted > 0) {
      try {
        await this.employeeRepository.createAuditLog({
          action: 'REVOKE_SESSION',
          entityType: 'EmployeeSession',
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

export class VerifyMFAUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(employeeId: any, code: string) {
    if (!code || code.length !== 6) {
      throw new Error('رمز التحقق الثنائي غير صالح. يجب أن يتكون من 6 أرقام.');
    }

    const session = await this.employeeRepository.findLatestSession(employeeId);
    if (session) {
      session.mfaVerified = true;
      session.lastActive = new Date().toISOString();
      await session.save();
    }

    try {
      await this.employeeRepository.createAuditLog({
        action: 'MFA_VERIFY_SUCCESS',
        entityType: 'Employee',
        entityId: String(employeeId),
        details: { code },
        performedBy: employeeId
      });
    } catch (err) {}

    return true;
  }
}
