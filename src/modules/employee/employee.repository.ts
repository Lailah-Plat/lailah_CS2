import { Employee, Role, AuditLog, Attendance, LeaveRequest, EmployeeEvaluation, TemporaryPermission, EmployeeSession } from '../../models/Database.js';

export interface IEmployeeRepository {
  findAllEmployees(): Promise<Employee[]>;
  findEmployeeById(id: any): Promise<Employee | null>;
  findEmployeeByEmailOrNationalId(email: string, nationalId?: string): Promise<Employee | null>;
  createEmployee(data: any): Promise<Employee>;
  updateEmployee(id: any, data: any): Promise<[number]>;
  deleteEmployee(id: any): Promise<number>;
  
  findAllRoles(): Promise<Role[]>;
  findRoleByName(name: string): Promise<Role | null>;
  createRole(data: any): Promise<Role>;
  updateRole(id: any, data: any): Promise<[number]>;
  findRoleById(id: any): Promise<Role | null>;

  findAttendance(where: any): Promise<Attendance[]>;
  findAttendanceToday(employeeId: any, date: string): Promise<Attendance | null>;
  createAttendance(data: any): Promise<Attendance>;
  bulkCreateAttendance(data: any[]): Promise<Attendance[]>;

  findLeaveRequests(where: any): Promise<LeaveRequest[]>;
  createLeaveRequest(data: any): Promise<LeaveRequest>;
  bulkCreateLeaveRequests(data: any[]): Promise<LeaveRequest[]>;
  findLeaveRequestById(id: any): Promise<LeaveRequest | null>;

  findEvaluations(where: any): Promise<EmployeeEvaluation[]>;
  createEvaluation(data: any): Promise<EmployeeEvaluation>;
  bulkCreateEvaluations(data: any[]): Promise<EmployeeEvaluation[]>;

  findTemporaryPermissions(where: any): Promise<TemporaryPermission[]>;
  createTemporaryPermission(data: any): Promise<TemporaryPermission>;
  deleteTemporaryPermission(id: any): Promise<number>;

  findSessions(where: any): Promise<EmployeeSession[]>;
  createSession(data: any): Promise<EmployeeSession>;
  deleteSession(id: any): Promise<number>;
  findLatestSession(employeeId: any): Promise<EmployeeSession | null>;

  findAuditLogs(where: any): Promise<AuditLog[]>;
  createAuditLog(data: any): Promise<AuditLog>;
}

export class SequelizeEmployeeRepository implements IEmployeeRepository {
  async findAllEmployees(): Promise<Employee[]> {
    return Employee.findAll({ include: ['role'] });
  }

  async findEmployeeById(id: any): Promise<Employee | null> {
    return Employee.findByPk(id, { include: ['role'] });
  }

  async findEmployeeByEmailOrNationalId(email: string, nationalId?: string): Promise<Employee | null> {
    if (nationalId) {
      const found = await Employee.findOne({ where: { nationalId } });
      if (found) return found;
    }
    return Employee.findOne({ where: { email } });
  }

  async createEmployee(data: any): Promise<Employee> {
    return Employee.create(data);
  }

  async updateEmployee(id: any, data: any): Promise<[number]> {
    return Employee.update(data, { where: { id } });
  }

  async deleteEmployee(id: any): Promise<number> {
    return Employee.destroy({ where: { id } });
  }

  async findAllRoles(): Promise<Role[]> {
    return Role.findAll();
  }

  async findRoleByName(name: string): Promise<Role | null> {
    return Role.findOne({ where: { name } });
  }

  async createRole(data: any): Promise<Role> {
    return Role.create(data);
  }

  async updateRole(id: any, data: any): Promise<[number]> {
    return Role.update(data, { where: { id } });
  }

  async findRoleById(id: any): Promise<Role | null> {
    return Role.findByPk(id);
  }

  async findAttendance(where: any): Promise<Attendance[]> {
    return Attendance.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'jobTitle', 'branch'] }],
      order: [['date', 'DESC'], ['clockIn', 'DESC']]
    });
  }

  async findAttendanceToday(employeeId: any, date: string): Promise<Attendance | null> {
    return Attendance.findOne({ where: { employeeId, date } });
  }

  async createAttendance(data: any): Promise<Attendance> {
    return Attendance.create(data);
  }

  async bulkCreateAttendance(data: any[]): Promise<Attendance[]> {
    return Attendance.bulkCreate(data);
  }

  async findLeaveRequests(where: any): Promise<LeaveRequest[]> {
    return LeaveRequest.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'jobTitle', 'branch'] }],
      order: [['startDate', 'DESC']]
    });
  }

  async createLeaveRequest(data: any): Promise<LeaveRequest> {
    return LeaveRequest.create(data);
  }

  async bulkCreateLeaveRequests(data: any[]): Promise<LeaveRequest[]> {
    return LeaveRequest.bulkCreate(data);
  }

  async findLeaveRequestById(id: any): Promise<LeaveRequest | null> {
    return LeaveRequest.findByPk(id);
  }

  async findEvaluations(where: any): Promise<EmployeeEvaluation[]> {
    return EmployeeEvaluation.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'jobTitle', 'branch'] }],
      order: [['date', 'DESC']]
    });
  }

  async createEvaluation(data: any): Promise<EmployeeEvaluation> {
    return EmployeeEvaluation.create(data);
  }

  async bulkCreateEvaluations(data: any[]): Promise<EmployeeEvaluation[]> {
    return EmployeeEvaluation.bulkCreate(data);
  }

  async findTemporaryPermissions(where: any): Promise<TemporaryPermission[]> {
    return TemporaryPermission.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'jobTitle', 'branch'] }],
      order: [['expiresAt', 'ASC']]
    });
  }

  async createTemporaryPermission(data: any): Promise<TemporaryPermission> {
    return TemporaryPermission.create(data);
  }

  async deleteTemporaryPermission(id: any): Promise<number> {
    return TemporaryPermission.destroy({ where: { id } });
  }

  async findSessions(where: any): Promise<EmployeeSession[]> {
    return EmployeeSession.findAll({
      where,
      include: [{ model: Employee, as: 'employee', attributes: ['id', 'fullName', 'jobTitle', 'branch'] }],
      order: [['lastActive', 'DESC']]
    });
  }

  async createSession(data: any): Promise<EmployeeSession> {
    return EmployeeSession.create(data);
  }

  async deleteSession(id: any): Promise<number> {
    return EmployeeSession.destroy({ where: { id } });
  }

  async findLatestSession(employeeId: any): Promise<EmployeeSession | null> {
    return EmployeeSession.findOne({
      where: { employeeId },
      order: [['lastActive', 'DESC']]
    });
  }

  async findAuditLogs(where: any): Promise<AuditLog[]> {
    return AuditLog.findAll({
      where,
      include: [{ model: Employee, as: 'performer', attributes: ['id', 'fullName', 'jobTitle', 'branch'] }],
      order: [['createdAt', 'DESC']],
      limit: 150
    });
  }

  async createAuditLog(data: any): Promise<AuditLog> {
    return AuditLog.create(data);
  }
}
