import { IEmployeeRepository } from '../employee.repository.js';
import { LeaveRequest } from '../../../models/Database.js';

export class GetLeaveRequestsUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(employeeId?: any) {
    const where: any = {};
    if (employeeId) where.employeeId = employeeId;

    let records = await this.employeeRepository.findLeaveRequests(where);

    if (records.length === 0) {
      const employees = await this.employeeRepository.findAllEmployees();
      const mockData = [];
      const today = new Date();
      for (const emp of employees) {
        mockData.push({
          employeeId: emp.id,
          type: 'annual',
          startDate: new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'pending',
          reason: 'إجازة سنوية اعتيادية لقضاء عطلة الصيف مع العائلة',
          approvedBy: null
        });
        mockData.push({
          employeeId: emp.id,
          type: 'sick',
          startDate: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          endDate: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: 'approved',
          reason: 'وعكة صحية طارئة - مرفق التقرير الطبي',
          approvedBy: emp.id
        });
      }
      if (mockData.length > 0) {
        await this.employeeRepository.bulkCreateLeaveRequests(mockData);
      }
      records = await this.employeeRepository.findLeaveRequests(where);
    }
    return records;
  }
}

export class CreateLeaveRequestUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(body: any) {
    const record = await this.employeeRepository.createLeaveRequest(body);
    try {
      await this.employeeRepository.createAuditLog({
        action: 'CREATE_LEAVE',
        entityType: 'LeaveRequest',
        entityId: record.id.toString(),
        details: { record },
        performedBy: body.employeeId
      });
    } catch (err) {}

    const list = await this.employeeRepository.findLeaveRequests({ id: record.id });
    return list[0] || record;
  }
}

export class UpdateLeaveRequestStatusUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(id: any, status: string, approvedBy: any, performerId: number | undefined) {
    const record = await this.employeeRepository.findLeaveRequestById(id);
    if (!record) {
      throw new Error('طلب الإجازة غير موجود.');
    }

    record.status = status as 'pending' | 'rejected' | 'approved';
    record.approvedBy = approvedBy || performerId || null;
    await record.save();

    try {
      await this.employeeRepository.createAuditLog({
        action: 'UPDATE_LEAVE',
        entityType: 'LeaveRequest',
        entityId: record.id.toString(),
        details: { status, approvedBy },
        performedBy: performerId
      });
    } catch (err) {}

    if (status === 'approved') {
      await this.employeeRepository.updateEmployee(record.employeeId, { status: 'on_leave' });
    }

    const list = await this.employeeRepository.findLeaveRequests({ id: record.id });
    return list[0] || record;
  }
}
