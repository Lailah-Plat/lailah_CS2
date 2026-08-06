import express from 'express';
import { SecurityController } from './security.controller.js';

const router = express.Router();
const controller = new SecurityController();

// Config Endpoints
router.get('/config', controller.getConfig);
router.post('/config', controller.saveConfig);

// Payment Gateway Keys Endpoints
router.get('/config/payment', controller.getPaymentKeys);
router.post('/config/payment', controller.savePaymentKeys);

// DB Connection Testing
router.post('/config/test', controller.testConnection);

// Migration & Integrity Checks
router.post('/config/migrate', controller.migrateDatabase);
router.post('/config/verify-integrity', controller.verifyIntegrity);
router.post('/config/cleanup-obsolete-tables', controller.cleanupObsoleteTables);

// Backups Endpoints
router.get(['/backup/sqlite', '/database/backup/sqlite'], controller.backupSqlite);
router.get(['/backup/json', '/database/backup/json'], controller.backupJson);
router.get(['/backup/sql', '/database/backup/sql'], controller.backupSql);

// Audit Logs Endpoints
router.get('/audit-logs', controller.getAuditLogs);
router.post('/audit-logs', controller.createAuditLog);

// Roles Endpoints
router.get('/roles', controller.getRoles);
router.post('/roles', controller.createOrUpdateRole);

// Sessions Endpoints
router.get('/sessions', controller.getSessions);
router.post('/sessions/revoke', controller.revokeSession);

// Firewall Endpoints
router.get('/firewall', controller.getFirewall);
router.post('/firewall', controller.saveFirewall);

export default router;
