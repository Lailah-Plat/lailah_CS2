import { Request, Response } from 'express';
import { SequelizeEmployeeRepository } from './employee.repository.js';
import { GetEmployeesUseCase } from './usecases/GetEmployees.usecase.js';
import { GetEmployeeByIdUseCase } from './usecases/GetEmployeeById.usecase.js';
import { CreateEmployeeUseCase } from './usecases/CreateEmployee.usecase.js';
import { UpdateEmployeeUseCase } from './usecases/UpdateEmployee.usecase.js';
import { DeleteEmployeeUseCase } from './usecases/DeleteEmployee.usecase.js';
import { GetRolesUseCase } from './usecases/GetRoles.usecase.js';
import { CreateRoleUseCase } from './usecases/CreateRole.usecase.js';
import { UpdateRoleUseCase } from './usecases/UpdateRole.usecase.js';
import { GetAttendanceUseCase, ClockInUseCase, ClockOutUseCase } from './usecases/Attendance.usecase.js';
import { GetLeaveRequestsUseCase, CreateLeaveRequestUseCase, UpdateLeaveRequestStatusUseCase } from './usecases/Leaves.usecase.js';
import { GetEvaluationsUseCase, CreateEvaluationUseCase } from './usecases/Evaluations.usecase.js';
import { GetTemporaryPermissionsUseCase, CreateTemporaryPermissionUseCase, DeleteTemporaryPermissionUseCase } from './usecases/TemporaryPermissions.usecase.js';
import { GetSessionsUseCase, RevokeSessionUseCase, VerifyMFAUseCase } from './usecases/Sessions.usecase.js';
import { GetAuditLogsUseCase } from './usecases/GetAuditLogs.usecase.js';
import { UniqueConstraintError } from 'sequelize';

export class EmployeeController {
  private employeeRepository = new SequelizeEmployeeRepository();
  private getEmployeesUseCase = new GetEmployeesUseCase(this.employeeRepository);
  private getEmployeeByIdUseCase = new GetEmployeeByIdUseCase(this.employeeRepository);
  private createEmployeeUseCase = new CreateEmployeeUseCase(this.employeeRepository);
  private updateEmployeeUseCase = new UpdateEmployeeUseCase(this.employeeRepository);
  private deleteEmployeeUseCase = new DeleteEmployeeUseCase(this.employeeRepository);
  private getRolesUseCase = new GetRolesUseCase(this.employeeRepository);
  private createRoleUseCase = new CreateRoleUseCase(this.employeeRepository);
  private updateRoleUseCase = new UpdateRoleUseCase(this.employeeRepository);
  private getAttendanceUseCase = new GetAttendanceUseCase(this.employeeRepository);
  private clockInUseCase = new ClockInUseCase(this.employeeRepository);
  private clockOutUseCase = new ClockOutUseCase(this.employeeRepository);
  private getLeaveRequestsUseCase = new GetLeaveRequestsUseCase(this.employeeRepository);
  private createLeaveRequestUseCase = new CreateLeaveRequestUseCase(this.employeeRepository);
  private updateLeaveRequestStatusUseCase = new UpdateLeaveRequestStatusUseCase(this.employeeRepository);
  private getEvaluationsUseCase = new GetEvaluationsUseCase(this.employeeRepository);
  private createEvaluationUseCase = new CreateEvaluationUseCase(this.employeeRepository);
  private getTemporaryPermissionsUseCase = new GetTemporaryPermissionsUseCase(this.employeeRepository);
  private createTemporaryPermissionUseCase = new CreateTemporaryPermissionUseCase(this.employeeRepository);
  private deleteTemporaryPermissionUseCase = new DeleteTemporaryPermissionUseCase(this.employeeRepository);
  private getSessionsUseCase = new GetSessionsUseCase(this.employeeRepository);
  private revokeSessionUseCase = new RevokeSessionUseCase(this.employeeRepository);
  private verifyMFAUseCase = new VerifyMFAUseCase(this.employeeRepository);
  private getAuditLogsUseCase = new GetAuditLogsUseCase(this.employeeRepository);

  getEmployees = async (req: Request, res: Response) => {
    try {
      const filtered = await this.getEmployeesUseCase.execute(req.user);
      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getEmployeeById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const filtered = await this.getEmployeeByIdUseCase.execute(id, req.user);
      res.json(filtered);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  createEmployee = async (req: Request, res: Response) => {
    try {
      const employee = await this.createEmployeeUseCase.execute(req.body, req.user?.id);
      res.status(201).json(employee);
    } catch (err: any) {
      if (err instanceof UniqueConstraintError) {
        res.status(400).json({ error: 'National ID, Email or Phone already exists.' });
        return;
      }
      if (err?.name === 'SequelizeValidationError') {
        const msg = err.errors?.map((e: any) => e.message).join(' - ') || 'خطأ في التحقق من صحة البيانات المدخلة';
        res.status(400).json({ error: msg });
        return;
      }
      res.status(400).json({ error: err.message });
    }
  };

  updateEmployee = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const employee = await this.updateEmployeeUseCase.execute(id, req.body, req.user);
      res.json(employee);
    } catch (err: any) {
      if (err instanceof UniqueConstraintError) {
        res.status(400).json({ error: 'National ID, Email or Phone already exists.' });
        return;
      }
      if (err?.name === 'SequelizeValidationError') {
        const msg = err.errors?.map((e: any) => e.message).join(' - ') || 'خطأ في التحقق من صحة البيانات المدخلة';
        res.status(400).json({ error: msg });
        return;
      }
      res.status(400).json({ error: err.message });
    }
  };

  deleteEmployee = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.deleteEmployeeUseCase.execute(id, req.user?.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'Employee not found' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getRoles = async (req: Request, res: Response) => {
    try {
      const roles = await this.getRolesUseCase.execute();
      res.json(roles);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  createRole = async (req: Request, res: Response) => {
    try {
      const role = await this.createRoleUseCase.execute(req.body, req.user?.id);
      res.status(201).json(role);
    } catch (err: any) {
      if (err instanceof UniqueConstraintError) {
        res.status(400).json({ error: 'Role name already exists.' });
        return;
      }
      res.status(400).json({ error: err.message });
    }
  };

  updateRole = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const role = await this.updateRoleUseCase.execute(id, req.body, req.user?.id);
      if (role) {
        res.json(role);
      } else {
        res.status(404).json({ error: 'Role not found' });
      }
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  getAttendance = async (req: Request, res: Response) => {
    try {
      const records = await this.getAttendanceUseCase.execute(req.query);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  clockIn = async (req: Request, res: Response) => {
    try {
      const fallbackIp = req.ip || '127.0.0.1';
      const userAgent = req.headers['user-agent'] || 'Unknown Device';
      const record = await this.clockInUseCase.execute(req.body, fallbackIp, userAgent);
      res.status(201).json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  clockOut = async (req: Request, res: Response) => {
    try {
      const record = await this.clockOutUseCase.execute(req.body);
      res.json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  getLeaveRequests = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.query;
      const records = await this.getLeaveRequestsUseCase.execute(employeeId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  createLeaveRequest = async (req: Request, res: Response) => {
    try {
      const record = await this.createLeaveRequestUseCase.execute(req.body);
      res.status(201).json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  updateLeaveRequestStatus = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, approvedBy } = req.body;
      const record = await this.updateLeaveRequestStatusUseCase.execute(id, status, approvedBy, req.user?.id);
      res.json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  getEvaluations = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.query;
      const records = await this.getEvaluationsUseCase.execute(employeeId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  createEvaluation = async (req: Request, res: Response) => {
    try {
      const record = await this.createEvaluationUseCase.execute(req.body, req.user?.id);
      res.status(201).json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  getTemporaryPermissions = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.query;
      const records = await this.getTemporaryPermissionsUseCase.execute(employeeId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  createTemporaryPermission = async (req: Request, res: Response) => {
    try {
      const record = await this.createTemporaryPermissionUseCase.execute(req.body, req.user?.id);
      res.status(201).json(record);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  deleteTemporaryPermission = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.deleteTemporaryPermissionUseCase.execute(id, req.user?.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'الصلاحية المؤقتة غير موجودة.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  getSessions = async (req: Request, res: Response) => {
    try {
      const { employeeId } = req.query;
      const records = await this.getSessionsUseCase.execute(employeeId);
      res.json(records);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  revokeSession = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const success = await this.revokeSessionUseCase.execute(id, req.user?.id);
      if (success) {
        res.status(204).send();
      } else {
        res.status(404).json({ error: 'الجلسة النشطة غير موجودة.' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };

  verifyMFA = async (req: Request, res: Response) => {
    try {
      const { employeeId, code } = req.body;
      await this.verifyMFAUseCase.execute(employeeId, code);
      res.json({ success: true, message: 'تم تفعيل التحقق الثنائي بنجاح والتحقق من جهازك.' });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  };

  getAuditLogs = async (req: Request, res: Response) => {
    try {
      const logs = await this.getAuditLogsUseCase.execute();
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  };
}
export const getEmployees = new EmployeeController().getEmployees;
export const getEmployeeById = new EmployeeController().getEmployeeById;
export const createEmployee = new EmployeeController().createEmployee;
export const updateEmployee = new EmployeeController().updateEmployee;
export const deleteEmployee = new EmployeeController().deleteEmployee;
export const getRoles = new EmployeeController().getRoles;
export const createRole = new EmployeeController().createRole;
export const updateRole = new EmployeeController().updateRole;
export const getAttendance = new EmployeeController().getAttendance;
export const clockIn = new EmployeeController().clockIn;
export const clockOut = new EmployeeController().clockOut;
export const getLeaveRequests = new EmployeeController().getLeaveRequests;
export const createLeaveRequest = new EmployeeController().createLeaveRequest;
export const updateLeaveRequestStatus = new EmployeeController().updateLeaveRequestStatus;
export const getEvaluations = new EmployeeController().getEvaluations;
export const createEvaluation = new EmployeeController().createEvaluation;
export const getTemporaryPermissions = new EmployeeController().getTemporaryPermissions;
export const createTemporaryPermission = new EmployeeController().createTemporaryPermission;
export const deleteTemporaryPermission = new EmployeeController().deleteTemporaryPermission;
export const getSessions = new EmployeeController().getSessions;
export const revokeSession = new EmployeeController().revokeSession;
export const verifyMFA = new EmployeeController().verifyMFA;
export const getAuditLogs = new EmployeeController().getAuditLogs;
