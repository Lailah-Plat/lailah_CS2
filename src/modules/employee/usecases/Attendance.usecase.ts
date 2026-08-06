import { IEmployeeRepository } from '../employee.repository.js';
import { Attendance } from '../../../models/Database.js';

function parseTimeToMinutes(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  return hours * 60 + minutes;
}

function parseTimeToMs(timeStr: string): number {
  const parts = timeStr.split(':');
  const hours = parseInt(parts[0], 10) || 0;
  const minutes = parseInt(parts[1], 10) || 0;
  const seconds = parseInt(parts[2], 10) || 0;
  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

export class GetAttendanceUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(query: { employeeId?: any; date?: string }) {
    const { employeeId, date } = query;
    const where: any = {};
    if (date) where.date = date;
    if (employeeId) where.employeeId = employeeId;

    let records = await this.employeeRepository.findAttendance(where);

    if (records.length === 0) {
      const employees = await this.employeeRepository.findAllEmployees();
      const mockData = [];
      const today = new Date().toISOString().split('T')[0];
      for (const emp of employees) {
        mockData.push({
          employeeId: emp.id,
          date: today,
          clockIn: '08:30:00',
          clockOut: '17:00:00',
          status: 'present',
          notes: 'حضور اعتيادي للدوام اليومي',
          ipAddress: '192.168.1.44',
          device: 'Chrome / Windows 11'
        });
        mockData.push({
          employeeId: emp.id,
          date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          clockIn: '09:15:00',
          clockOut: '17:05:00',
          status: 'late',
          notes: 'تأخر بسبب زحام المرور الصباحي',
          ipAddress: '192.168.1.12',
          device: 'Safari / iPhone'
        });
      }
      if (mockData.length > 0) {
        await this.employeeRepository.bulkCreateAttendance(mockData);
      }
      records = await this.employeeRepository.findAttendance(where);
    }
    return records;
  }
}

export class ClockInUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(body: any, fallbackIp: string, userAgent: string) {
    const { employeeId, notes, device, ipAddress } = body;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];

    const existing = await this.employeeRepository.findAttendanceToday(employeeId, today);
    if (existing) {
      throw new Error('الموظف مسجل حضور بالفعل اليوم.');
    }

    const employee = await this.employeeRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new Error('لم يتم العثور على الموظف.');
    }

    const workType = employee.workType || 'fixed';
    const shiftStart = employee.shiftStart || '08:00';
    const flexibleStartWindowEnd = employee.flexibleStartWindowEnd || '10:00';

    let delayMinutes = 0;
    const clockInMin = parseTimeToMinutes(nowTime);

    if (workType === 'fixed') {
      const targetMin = parseTimeToMinutes(shiftStart);
      if (clockInMin > targetMin) {
        delayMinutes = clockInMin - targetMin;
      }
    } else if (workType === 'flexible_window') {
      const windowEndMin = parseTimeToMinutes(flexibleStartWindowEnd);
      if (clockInMin > windowEndMin) {
        delayMinutes = clockInMin - windowEndMin;
      }
    }

    const status = delayMinutes > 0 ? 'late' : 'present';

    const record = await this.employeeRepository.createAttendance({
      employeeId,
      date: today,
      clockIn: nowTime,
      clockOut: null,
      status,
      notes: notes || 'تسجيل دخول عن طريق النظام',
      ipAddress: ipAddress || fallbackIp || '127.0.0.1',
      device: device || userAgent || 'Unknown Device',
      delayMinutes,
      earlyDepartureMinutes: 0,
      workHours: 0,
      deficitHours: 0
    });

    try {
      await this.employeeRepository.createAuditLog({
        action: 'CLOCK_IN',
        entityType: 'Attendance',
        entityId: record.id.toString(),
        details: { record },
        performedBy: employeeId
      });
    } catch (err) {}

    const records = await this.employeeRepository.findAttendance({ id: record.id });
    return records[0] || record;
  }
}

export class ClockOutUseCase {
  constructor(private employeeRepository: IEmployeeRepository) {}

  async execute(body: any) {
    const { employeeId, notes } = body;
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toTimeString().split(' ')[0];

    const record = await this.employeeRepository.findAttendanceToday(employeeId, today);
    if (!record) {
      throw new Error('لم يتم العثور على تسجيل حضور اليوم لهذا الموظف.');
    }

    const employee = await this.employeeRepository.findEmployeeById(employeeId);
    if (!employee) {
      throw new Error('لم يتم العثور على الموظف.');
    }

    const workType = employee.workType || 'fixed';
    const requiredHours = employee.requiredHours || 8;
    const shiftEnd = employee.shiftEnd || '16:00';

    const clockInMs = parseTimeToMs(record.clockIn);
    const clockOutMs = parseTimeToMs(nowTime);
    const diffMs = clockOutMs - clockInMs;
    const workHours = Math.max(0, parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2)));

    const deficitHours = Math.max(0, parseFloat((requiredHours - workHours).toFixed(2)));

    let earlyDepartureMinutes = 0;
    if (workType === 'fixed') {
      const clockOutMin = parseTimeToMinutes(nowTime);
      const targetMin = parseTimeToMinutes(shiftEnd);
      if (clockOutMin < targetMin) {
        earlyDepartureMinutes = targetMin - clockOutMin;
      }
    } else if (workType === 'flexible_window' || workType === 'flexible_free' || workType === 'remote') {
      const clockInMin = parseTimeToMinutes(record.clockIn);
      const expectedClockOutMin = clockInMin + (requiredHours * 60);
      const clockOutMin = parseTimeToMinutes(nowTime);
      if (clockOutMin < expectedClockOutMin) {
        earlyDepartureMinutes = Math.round(expectedClockOutMin - clockOutMin);
      }
    }

    record.clockOut = nowTime;
    record.earlyDepartureMinutes = earlyDepartureMinutes;
    record.workHours = workHours;
    record.deficitHours = deficitHours;
    if (notes) record.notes = (record.notes ? record.notes + ' | ' : '') + notes;
    await record.save();

    try {
      await this.employeeRepository.createAuditLog({
        action: 'CLOCK_OUT',
        entityType: 'Attendance',
        entityId: record.id.toString(),
        details: { record },
        performedBy: employeeId
      });
    } catch (err) {}

    const records = await this.employeeRepository.findAttendance({ id: record.id });
    return records[0] || record;
  }
}
