import { Router } from 'express';
import { EmployeeController } from './employee.controller.js';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new EmployeeController();

// Apply authentication to all employee/role routes
router.use(authenticate);

// roles
router.get('/roles', authorize('إدارة الموظفين والصلاحيات', 'view'), controller.getRoles);
router.post('/roles', authorize('إدارة الموظفين والصلاحيات', 'add'), controller.createRole);
router.put('/roles/:id', authorize('إدارة الموظفين والصلاحيات', 'edit'), controller.updateRole);

// employees
router.get('/employees', authorize('إدارة الموظفين والصلاحيات', 'view'), controller.getEmployees);
router.get('/employees/:id', authorize('إدارة الموظفين والصلاحيات', 'view'), controller.getEmployeeById);
router.post('/employees', authorize('إدارة الموظفين والصلاحيات', 'add'), controller.createEmployee);
router.put('/employees/:id', authorize('إدارة الموظفين والصلاحيات', 'edit'), controller.updateEmployee);
router.delete('/employees/:id', authorize('إدارة الموظفين والصلاحيات', 'delete'), controller.deleteEmployee);

// advanced HR endpoints
router.get('/attendance', controller.getAttendance);
router.post('/attendance/clock-in', controller.clockIn);
router.post('/attendance/clock-out', controller.clockOut);

router.get('/leaves', controller.getLeaveRequests);
router.post('/leaves', controller.createLeaveRequest);
router.put('/leaves/:id/status', controller.updateLeaveRequestStatus);

router.get('/evaluations', controller.getEvaluations);
router.post('/evaluations', controller.createEvaluation);

router.get('/temporary-permissions', controller.getTemporaryPermissions);
router.post('/temporary-permissions', controller.createTemporaryPermission);
router.delete('/temporary-permissions/:id', controller.deleteTemporaryPermission);

router.get('/sessions', controller.getSessions);
router.delete('/sessions/:id', controller.revokeSession);
router.post('/sessions/verify-mfa', controller.verifyMFA);

router.get('/audit-logs', controller.getAuditLogs);

export default router;
