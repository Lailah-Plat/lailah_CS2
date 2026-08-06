import React, { useState, useEffect, useMemo } from 'react';
import { 
  RefreshCw, ShieldCheck, Key, Timer, Save, Activity, CheckCircle2, AlertCircle, 
  Database, Download, ScrollText, FileDown, Shield, Users, KeyRound, Lock, Eye, 
  EyeOff, LogOut, Trash2, ShieldAlert, Globe, Server, CheckCircle, Info, Send, UserCheck, Trash,
  Search, Layers, Filter
} from 'lucide-react';

interface SecuritySecretTabProps {
  integrationKeys: any;
  setIntegrationKeys: any;
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
  dbHealthStatus: string;
  dbLastSyncTime: string;
}

export const SecuritySecretTab: React.FC<SecuritySecretTabProps> = ({ 
  integrationKeys, 
  setIntegrationKeys, 
  showNotification,
  dbHealthStatus,
  dbLastSyncTime
}) => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    preFlightCheckEnabled: true,
    preFlightTimeoutMs: 8000,
    encryptedDbUrl: '',
    dbProvider: 'supabase',
    encryptedSecretToken: '',
    localDatabaseEnabled: true
  });
  const [plainDatabaseUrl, setPlainDatabaseUrl] = useState('');
  const [plainSecretToken, setPlainSecretToken] = useState('');
  const [envUrlMasked, setEnvUrlMasked] = useState('');
  const [decryptedUrlMasked, setDecryptedUrlMasked] = useState('');
  const [decryptedSecretTokenMasked, setDecryptedSecretTokenMasked] = useState('');
  const [hasEnvUrl, setHasEnvUrl] = useState(false);
  
  // Testing and execution states
  const [activeTab, setActiveTab] = useState<'settings' | 'shield' | 'firewall' | 'audit' | 'migration'>('settings');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

  // Migration states
  const [migrating, setMigrating] = useState(false);
  const [migrationLogs, setMigrationLogs] = useState<string[]>([]);
  const [resetTarget, setResetTarget] = useState(false);
  const [migrationSuccess, setMigrationSuccess] = useState<boolean | null>(null);

  // Integrity verification states
  const [verifyingIntegrity, setVerifyingIntegrity] = useState(false);
  const [cleaningObsolete, setCleaningObsolete] = useState(false);
  const [integrityLogs, setIntegrityLogs] = useState<string[]>([]);
  const [integrityResults, setIntegrityResults] = useState<any[]>([]);
  const [integrityAllOk, setIntegrityAllOk] = useState<boolean | null>(null);
  const [autoRepairIntegrity, setAutoRepairIntegrity] = useState(false);
  const [schemaCategoryFilter, setSchemaCategoryFilter] = useState<string>('all');
  const [schemaSearchQuery, setSchemaSearchQuery] = useState<string>('');

  // RBAC States
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | string>('');
  const [rbacMatrix, setRbacMatrix] = useState<Record<string, string[]>>({});
  const [rbacLoading, setRbacLoading] = useState(false);
  const [selectedScope, setSelectedScope] = useState<string>('all');
  const [selectedFinancialCap, setSelectedFinancialCap] = useState<number>(50000);
  const [selectedSodRules, setSelectedSodRules] = useState({
    preventSelfRefundApproval: true,
    preventSelfSettlementDisbursement: true,
    preventSelfPriceOverride: true,
  });

  // Security Shield & Hashing States
  const [rawPassword, setRawPassword] = useState('P@ssword123');
  const [hashSaltLength, setHashSaltLength] = useState(16);
  const [hashSalt, setHashSalt] = useState('8b9a2f7c4d1e0f3a');
  const [generatedHash, setGeneratedHash] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaSetupStep, setMfaSetupStep] = useState(1);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBackupCodes, setMfaBackupCodes] = useState<string[]>([]);
  const [activeSessions, setActiveSessions] = useState<any[]>([]);

  // Firewall / Brute force / Complexity States
  const [firewallConfig, setFirewallConfig] = useState({
    maxLoginAttempts: 5,
    lockoutDurationMinutes: 15,
    requireSpecialChar: true,
    requireNumbers: true,
    requireUppercase: false,
    minLength: 9,
    lockedIPs: ['192.168.43.10', '82.112.5.204']
  });
  const [testPasswordComplexity, setTestPasswordComplexity] = useState('');

  // Security Audit Log States
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditSeverity, setAuditSeverity] = useState('all');
  const [auditLoading, setAuditLoading] = useState(false);

  const rbacModules = [
    { key: 'halls', label: 'إدارة الصالات والمنتجعات 🏰' },
    { key: 'bookings', label: 'إدارة وتنسيق الحجوزات 📅' },
    { key: 'financials', label: 'المطابقة والتقارير المالية 💰' },
    { key: 'refunds', label: 'طلبات الاسترداد والمطالبات 💸' },
    { key: 'settlements', label: 'التسويات وصرف المستحقات ⚖️' },
    { key: 'employees', label: 'شؤون الموظفين والصلاحيات 👥' },
    { key: 'inventory', label: 'إدارة المخزون والتوريد 📦' },
    { key: 'support', label: 'التذاكر والدعم والنزاعات 🎧' },
    { key: 'security', label: 'إعدادات الأمان والتشفير 🛡️' }
  ];

  const rbacOperations = [
    { key: 'view', label: '👁️ عرض' },
    { key: 'create', label: '➕ إنشاء' },
    { key: 'edit', label: '✏️ تعديل' },
    { key: 'delete', label: '🗑️ حذف' },
    { key: 'approve', label: '✅ اعتماد' },
    { key: 'reject', label: '❌ رفض' },
    { key: 'suspend', label: '⏸️ تعليق' },
    { key: 'refund', label: '💸 استرداد' },
    { key: 'settle', label: '⚖️ تسوية' },
    { key: 'export', label: '📥 تصدير' }
  ];

  const fetchRoles = async () => {
    try {
      setRbacLoading(true);
      const res = await fetch('/api/security/roles');
      const data = await res.json();
      if (data.success) {
        setRoles(data.roles);
        if (data.roles.length > 0) {
          const defaultRole = data.roles[0];
          setSelectedRoleId(defaultRole.id);
          const perms = defaultRole.permissions || {};
          const matrix = perms.modules || (Array.isArray(perms) ? {} : perms);
          setRbacMatrix(matrix);
          setSelectedScope(perms.scope || defaultRole.scope || 'all');
          setSelectedFinancialCap(perms.approvalFinancialCap || defaultRole.approvalFinancialCap || 50000);
          setSelectedSodRules(perms.sodRules || {
            preventSelfRefundApproval: true,
            preventSelfSettlementDisbursement: true,
            preventSelfPriceOverride: true
          });
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setRbacLoading(false);
    }
  };

  const handleSaveRolePermissions = async () => {
    if (!selectedRoleId) return;
    try {
      setRbacLoading(true);
      const roleToUpdate = roles.find(r => r.id === Number(selectedRoleId));
      const payloadPermissions = {
        modules: rbacMatrix,
        scope: selectedScope,
        approvalFinancialCap: selectedFinancialCap,
        sodRules: selectedSodRules
      };
      const res = await fetch('/api/security/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedRoleId,
          name: roleToUpdate?.name,
          permissions: payloadPermissions,
          status: roleToUpdate?.status
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', '🔐 تم حفظ حوكمة الصلاحيات ومصفوفة الفصل بين المهام سحابياً بنجاح!');
        // Add security log
        await fetch('/api/security/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'RBAC_MATRIX_UPDATE',
            entityType: 'Role',
            entityId: String(selectedRoleId),
            details: { roleName: roleToUpdate?.name, permissions: payloadPermissions }
          })
        });
      } else {
        showNotification('error', `فشل حفظ الصلاحيات: ${data.error}`);
      }
    } catch (e: any) {
      showNotification('error', `خطأ في الاتصال بالشبكة: ${e.message}`);
    } finally {
      setRbacLoading(false);
    }
  };

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/security/sessions');
      const data = await res.json();
      if (data.success) {
        setActiveSessions(data.sessions);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRevokeSession = async (sessId: string) => {
    try {
      const res = await fetch('/api/security/sessions/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: sessId })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        setActiveSessions(prev => prev.filter(s => s.id !== sessId));
        // Add audit log
        await fetch('/api/security/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SESSION_REVOKED',
            entityType: 'UserSession',
            entityId: sessId,
            details: { status: 'Terminated manually' }
          })
        });
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  const fetchFirewallConfig = async () => {
    try {
      const res = await fetch('/api/security/firewall');
      const data = await res.json();
      if (data.success) {
        setFirewallConfig(data.config);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFirewall = async (updatedConfig = firewallConfig) => {
    try {
      const res = await fetch('/api/security/firewall', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedConfig)
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message);
        // Add audit log
        await fetch('/api/security/audit-logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'SECURITY_POLICY_UPDATE',
            entityType: 'Firewall',
            entityId: 'RulesConfig',
            details: updatedConfig
          })
        });
      }
    } catch (e: any) {
      showNotification('error', e.message);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setAuditLoading(true);
      const res = await fetch('/api/security/audit-logs');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  };

  // Load data dynamically based on activeTab
  useEffect(() => {
    if (activeTab === 'shield') {
      fetchSessions();
    } else if (activeTab === 'firewall') {
      fetchFirewallConfig();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  // When selected role changes, update permission matrix, scope, cap, and SoD rules
  useEffect(() => {
    if (selectedRoleId && roles.length > 0) {
      const roleObj = roles.find(r => r.id === Number(selectedRoleId));
      if (roleObj) {
        const perms = roleObj.permissions || {};
        const matrix = perms.modules || (Array.isArray(perms) ? {} : perms);
        setRbacMatrix(matrix);
        setSelectedScope(perms.scope || roleObj.scope || 'all');
        setSelectedFinancialCap(perms.approvalFinancialCap || roleObj.approvalFinancialCap || 50000);
        setSelectedSodRules(perms.sodRules || {
          preventSelfRefundApproval: true,
          preventSelfSettlementDisbursement: true,
          preventSelfPriceOverride: true
        });
      }
    }
  }, [selectedRoleId, roles]);

  // Salted Hashing simulator
  useEffect(() => {
    if (rawPassword) {
      let salt = '';
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()';
      for (let i = 0; i < hashSaltLength; i++) {
        const charIndex = (rawPassword.charCodeAt(i % rawPassword.length) + i) % chars.length;
        salt += chars[charIndex];
      }
      setHashSalt(salt);
      
      let hash = 0;
      const combined = rawPassword + salt;
      for (let i = 0; i < combined.length; i++) {
        hash = (hash << 5) - hash + combined.charCodeAt(i);
        hash |= 0;
      }
      const hexHash = Math.abs(hash).toString(16).padStart(8, '0') + 
                      Math.abs(hash * 3).toString(16).padStart(8, '0') +
                      Math.abs(hash * 7).toString(16).padStart(8, '0') +
                      Math.abs(hash * 13).toString(16).padStart(8, '0');
      setGeneratedHash(`$2b$12$${salt.slice(0, 10)}...${hexHash}`);
    } else {
      setHashSalt('');
      setGeneratedHash('');
    }
  }, [rawPassword, hashSaltLength]);

  const passwordComplexityScore = useMemo(() => {
    if (!testPasswordComplexity) return { score: 0, text: 'يرجى إدخال كلمة مرور للتحقق من تطابق السياسة', color: 'bg-slate-200 text-slate-500' };
    let score = 0;
    if (testPasswordComplexity.length >= firewallConfig.minLength) score += 25;
    if (/[a-z]/.test(testPasswordComplexity)) score += 15;
    if (/[A-Z]/.test(testPasswordComplexity)) score += 15;
    if (/[0-9]/.test(testPasswordComplexity)) score += 20;
    if (/[^A-Za-z0-9]/.test(testPasswordComplexity)) score += 25;

    if (score < 40) return { score, text: '⚠️ ضعيفة جداً ولا تطابق السياسة الحالية', color: 'bg-rose-500 text-white' };
    if (score < 70) return { score, text: '🟡 متوسطة وتحتاج إلى تعقيد إضافي', color: 'bg-amber-500 text-slate-900' };
    if (score < 90) return { score, text: '🟢 قوية جداً وتطابق السياسات القياسية', color: 'bg-emerald-500 text-white' };
    return { score, text: '🛡️ فولاذية (أمان وحصانة مطلقة للعملاء)', color: 'bg-teal-500 text-white shadow-sm ring-2 ring-teal-500/30' };
  }, [testPasswordComplexity, firewallConfig]);

  const isUrlAndProviderMatching = useMemo(() => {
    const url = plainDatabaseUrl || decryptedUrlMasked || envUrlMasked || '';
    if (!url) return true;
    const provider = config.dbProvider || 'supabase';
    if (provider === 'supabase' && !url.includes('supabase')) return false;
    if (provider === 'firebase' && !(url.includes('firebase') || url.includes('firestore'))) return false;
    if (provider === 'remote_sql' && !(url.includes('postgres') || url.includes('postgresql'))) return false;
    return true;
  }, [plainDatabaseUrl, decryptedUrlMasked, envUrlMasked, config.dbProvider]);

  // Live auto-updater of provider when typing URL
  useEffect(() => {
    if (plainDatabaseUrl) {
      if (plainDatabaseUrl.includes('supabase')) {
        setConfig(prev => ({ ...prev, dbProvider: 'supabase' }));
      } else if (plainDatabaseUrl.includes('firebase') || plainDatabaseUrl.includes('firestore')) {
        setConfig(prev => ({ ...prev, dbProvider: 'firebase' }));
      } else if (plainDatabaseUrl.includes('postgres') || plainDatabaseUrl.includes('postgresql')) {
        setConfig(prev => ({ ...prev, dbProvider: 'remote_sql' }));
      } else if (plainDatabaseUrl.startsWith('http://') || plainDatabaseUrl.startsWith('https://')) {
        setConfig(prev => ({ ...prev, dbProvider: 'custom_api' }));
      }
    }
  }, [plainDatabaseUrl]);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/security/config');
      const data = await res.json();
      if (data.success) {
        setConfig(data.config);
        setEnvUrlMasked(data.envUrlMasked);
        setDecryptedUrlMasked(data.decryptedUrlMasked);
        setDecryptedSecretTokenMasked(data.decryptedSecretTokenMasked || '');
        setHasEnvUrl(data.hasEnvUrl);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    addTerminalLog('📡 تم تحميل إعدادات الأمان والتشفير بنجاح من الخادر المضيف.');
  }, []);

  const addTerminalLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('ar-EG');
    setTerminalLogs(prev => [...prev, `[${time}] ${msg}`]);
  };

  const handleSave = async (customConfig?: typeof config) => {
    const activeConfig = customConfig || config;
    try {
      setSaving(true);
      addTerminalLog('⚙️ جاري تشفير وحفظ إعدادات الفحص المسبق ورابط الاتصال والمزود ومفتاح الربط...');
      const res = await fetch('/api/security/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          preFlightCheckEnabled: activeConfig.preFlightCheckEnabled,
          preFlightTimeoutMs: Number(activeConfig.preFlightTimeoutMs),
          plainDatabaseUrl: plainDatabaseUrl || undefined,
          dbProvider: activeConfig.dbProvider,
          plainSecretToken: plainSecretToken || undefined,
          localDatabaseEnabled: activeConfig.localDatabaseEnabled
        })
      });
      const data = await res.json();
      if (data.success) {
        addTerminalLog('💾 تم الحفظ والتشفير بنجاح! تم كتابة التحرير بداخل ملف الخزن database_config.json بالتالي تم ترقية مستوى الأمان.');
        setPlainDatabaseUrl('');
        setPlainSecretToken('');
        
        // Use backend returned config to update state cleanly
        if (data.config) {
          setConfig(data.config);
        }
        
        // Force a minor refresh to load environment URL and key masks again
        const refreshRes = await fetch('/api/security/config');
        const refreshData = await refreshRes.json();
        if (refreshData.success) {
          setEnvUrlMasked(refreshData.envUrlMasked);
          setDecryptedUrlMasked(refreshData.decryptedUrlMasked);
          setDecryptedSecretTokenMasked(refreshData.decryptedSecretTokenMasked || '');
          setHasEnvUrl(refreshData.hasEnvUrl);
        }

        showNotification('success', '🔐 تم تشفير وحفظ إعدادات الأمان وقاعدة البيانات الخارجي بنجاح!');
      } else {
        addTerminalLog(`❌ فشل حفظ الإعدادات: ${data.error}`);
        showNotification('error', `فشل في التحديث: ${data.error}`);
      }
    } catch (e: any) {
      addTerminalLog(`❌ فشل في الاتصال بالشبكة لحفظ الإعدادات: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    try {
      setTesting(true);
      setTestResult(null);
      setTerminalLogs([]);
      addTerminalLog('🔎 بدء فحص الاتصال الذكي المسبق للمزود والأمان...');
      addTerminalLog(`📡 مزود الاستضافة المحدد للتحقق: ${config.dbProvider === 'supabase' ? 'Supabase (PostgreSQL)' : config.dbProvider === 'firebase' ? 'Firebase Firestore (NoSQL)' : config.dbProvider === 'remote_sql' ? 'Remote PostgreSQL/MySQL Server' : 'Custom REST API/Webhook'}`);
      
      if (plainSecretToken || config.encryptedSecretToken) {
        addTerminalLog('🔑 تم التوجيه والتحقق من وجود مفتاح الوصول السري للربط والمزامنة بنجاح.');
      } else {
        addTerminalLog('⚠️ تنبيه: لم يتم تزويد مفتاح وصول سري للربط والمزامنة (يخضع لتقديرك في حال عدم متطلبات مزودك).');
      }

      addTerminalLog(`🛡️ تشغيل الفحص المسبق بلغة Node لقرص اختبار الاتصال مع وقت مهلة ${config.preFlightTimeoutMs}ms...`);
      
      const res = await fetch('/api/security/config/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionString: plainDatabaseUrl || undefined,
          timeoutMs: Number(config.preFlightTimeoutMs)
        })
      });
      
      const data = await res.json();
      if (data.success) {
        setTestResult({ success: true, message: data.message });
        addTerminalLog('✅ نجاح اختبار الاتصال والمزامنة والمصافحة الآمنة مع قاعدة البيانات!');
        addTerminalLog(`📱 تم التحقق من توافق نوع المزود المختار (${config.dbProvider}) مع الرابط المُدخل.`);
        showNotification('success', '🔌 تم فحص استجابة قاعدة البيانات الخارجية بنجاح وبسرعة مناسبة!');
      } else {
        setTestResult({ success: false, message: data.error });
        addTerminalLog(`❌ فشل الاتصال: ${data.error}`);
        addTerminalLog('💡 توصية الحماية: يرجى فحص مفتاح الهوية أو زيادة وقت الفحص المسبق الذكي (Timeout Tuning).');
        showNotification('error', '❌ فشل اختبار الاتصال بالخادم الخارجي للبيانات.');
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message });
      addTerminalLog(`❌ خطأ أثناء الاتصال بالخادم: ${e.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleMigrate = async () => {
    try {
      setMigrating(true);
      setMigrationSuccess(null);
      setMigrationLogs(['⏳ جاري تهيئة الاتصال والمحركات...']);
      
      const res = await fetch('/api/security/config/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionString: plainDatabaseUrl || undefined,
          resetTarget: resetTarget
        })
      });

      const data = await res.json();
      if (data.success) {
        setMigrationSuccess(true);
        setMigrationLogs(data.logs || ['✅ اكتمل الترحيل بنجاح!']);
        showNotification('success', '🚀 تم ترحيل كافة الجداول والبيانات إلى الخادم الخارجي بنجاح!');
      } else {
        setMigrationSuccess(false);
        setMigrationLogs(data.logs || [`❌ خطأ: ${data.error}`]);
        showNotification('error', `فشل الترحيل: ${data.error}`);
      }
    } catch (e: any) {
      setMigrationSuccess(false);
      setMigrationLogs(prev => [...prev, `❌ فشل الاتصال بالشبكة: ${e.message}`]);
      showNotification('error', `عطل في الاتصال: ${e.message}`);
    } finally {
      setMigrating(false);
    }
  };

  const handleVerifyIntegrity = async () => {
    try {
      setVerifyingIntegrity(true);
      setIntegrityAllOk(null);
      setIntegrityResults([]);
      setIntegrityLogs(['⏳ جاري تشغيل وحدة التدقيق وفحص الربط وقاعدة البيانات...']);
      
      const res = await fetch('/api/security/config/verify-integrity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionString: plainDatabaseUrl || undefined,
          autoRepair: autoRepairIntegrity
        })
      });

      const data = await res.json();
      if (data.success) {
        setIntegrityAllOk(data.allOk);
        setIntegrityResults(data.results || []);
        setIntegrityLogs(data.logs || ['✅ اكتمل الفحص ومطابقة سلامة قاعدة البيانات والربط الهيكلي بنجاح!']);
        if (data.allOk) {
          showNotification('success', '🔌 تم تأكيد سلامة ومطابقة جميع جداول تطبيق الجوال والمنصة بنسبة 100%!');
        } else {
          showNotification('info', '⚠️ تم العثور على تفاوت أو هياكل ناقصة تتطلب تفعيل الإصلاح التلقائي.');
        }
      } else {
        setIntegrityAllOk(false);
        setIntegrityLogs(data.logs || [`❌ خطأ: ${data.error}`]);
        showNotification('error', `فشل فحص سلامة الجداول: ${data.error}`);
      }
    } catch (e: any) {
      setIntegrityAllOk(false);
      setIntegrityLogs(prev => [...prev, `❌ فشل الاتصال بقنوات الربط: ${e.message}`]);
      showNotification('error', `عطل في فحص قنوات الاتصال: ${e.message}`);
    } finally {
      setVerifyingIntegrity(false);
    }
  };

  const handleCleanupObsoleteTables = async () => {
    try {
      setCleaningObsolete(true);
      setIntegrityLogs(['⏳ جاري الاتصال بقاعدة البيانات وتنظيف وتطهير الجداول غير المستخدمة والزائدة...']);
      
      const res = await fetch('/api/security/config/cleanup-obsolete-tables', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          connectionString: plainDatabaseUrl || undefined
        })
      });

      const data = await res.json();
      if (data.success) {
        setIntegrityLogs(data.logs || ['✅ اكتملت عملية تنظيف وتطهير قاعدة البيانات السحابية بنجاح!']);
        showNotification('success', data.message || 'تم تنظيف قاعدة البيانات السحابية بنجاح!');
      } else {
        setIntegrityLogs(data.logs || [`❌ خطأ: ${data.error}`]);
        showNotification('error', `فشلت عملية التنظيف: ${data.error}`);
      }
    } catch (e: any) {
      setIntegrityLogs(prev => [...prev, `❌ فشل الاتصال بقواعد البيانات: ${e.message}`]);
      showNotification('error', `عطل في الاتصال: ${e.message}`);
    } finally {
      setCleaningObsolete(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mb-3" />
        <p className="text-slate-500 text-sm font-sans">جاري تحميل إعدادات الأمان والتشفير الذكي...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right font-sans" dir="rtl">
        {/* Header Info */}
        <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-6 lg:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 left-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl font-sans"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="bg-amber-500/20 text-amber-400 text-xs px-3 py-1 rounded-full font-bold border border-amber-500/30">إعدادات الأمان المتقدمة 🛡️</span>
            <h3 className="text-2xl font-bold tracking-tight">الأمان Secret والتشفير العالي لقاعدة البيانات</h3>
            <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
              تتيح لك هذه المنصة التحكم في تشفير رابط اتصال قاعدة البيانات الخارجية <span className="font-mono text-amber-400 bg-slate-800 px-1 py-0.5 rounded">SUPABASE_DATABASE_URL</span> وتفعيل الفحص الاستباقي الذكي عند إقلاع الخادم لمنع حدوث حالات الانهيار وتحديد مهلة الاتصال المثلى.
            </p>
          </div>
          <div className="shrink-0 flex items-center justify-center">
            <ShieldCheck className="w-16 h-16 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Inner Sub-Tabs for DB Control, Security Shield, firewall and Logs */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl gap-1.5 border border-slate-200 w-full" dir="rtl">
        <button
          type="button"
          onClick={() => setActiveTab('settings')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'settings' 
              ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Database className="w-4 h-4 text-slate-500" />
          رابط قاعدة البيانات والاتصال 🔌
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('shield')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'shield' 
              ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <KeyRound className="w-4 h-4 text-slate-500" />
          درع الأمان والتوثيق (Security Shield) 🔐
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('firewall')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'firewall' 
              ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <Lock className="w-4 h-4 text-slate-500" />
          جدار الحماية والسياسات 🚧
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'audit' 
              ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <ScrollText className="w-4 h-4 text-slate-500" />
          سجل الحركات الأمنية 📜
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('migration')}
          className={`px-4 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'migration' 
              ? 'bg-white text-slate-950 shadow-sm ring-1 ring-slate-200' 
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
          }`}
        >
          <RefreshCw className="w-4 h-4 text-slate-500" />
          الترحيل والنسخ الاحتياطي 🔄
        </button>
      </div>

      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-200">
          {/* Connection Setup and Timeout controls */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <h4 className="text-lg font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2 justify-start">
                <Key className="w-5 h-5 text-amber-500" />
                تكوين وحفظ سر الاتصال بقاعدة البيانات (Secrets)
              </h4>

              {/* Smart Pre-flight Toggle */}
              <div className="flex items-start justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 gap-4">
                <div className="space-y-1 text-right">
                  <span className="block font-bold text-slate-800 text-sm">تمكين الفحص المسبق الذكي (Smart Pre-flight Check)</span>
                  <span className="block text-xs text-slate-500 leading-relaxed text-right">عند إقلاع التطبيق، يقوم الخادم بفحص الاتصال بالـ Supabase قبل التمكين الفعلي للتطبيق لتجنب الأخطاء البرمجية.</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !config.preFlightCheckEnabled;
                    setConfig(prev => {
                      const updated = { ...prev, preFlightCheckEnabled: nextVal };
                      handleSave(updated);
                      return updated;
                    });
                  }}
                  className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${config.preFlightCheckEnabled ? 'bg-emerald-600' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all duration-200 ${config.preFlightCheckEnabled ? 'left-7' : 'left-1'}`}></span>
                </button>
              </div>

              {/* Local Fallback Database Toggle (Permanently disabled & retired) */}
              <div className="flex items-start justify-between bg-amber-50/50 p-4 rounded-xl border border-amber-100 gap-4">
                <div className="space-y-1 text-right">
                  <span className="block font-bold text-amber-900 text-sm flex items-center gap-2 justify-start">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
                    قاعدة البيانات المحلية SQLite: ملغاة وموقوفة نهائياً (Retired 🚫)
                  </span>
                  <span className="block text-xs text-amber-800 leading-relaxed text-right">
                    بناءً على التحديثات الأخيرة، تم إلغاء الاعتماد على قاعدة البيانات المحلية بشكل كامل ونهائي لتجنب تضارب السجلات وتشتت البيانات. النظام الآن مرتبط بالكامل وحصرياً بقاعدة البيانات الخارجية (PostgreSQL/Supabase).
                  </span>
                </div>
                <div className="bg-amber-100 text-amber-800 text-[11px] px-2.5 py-1.5 rounded-full font-bold border border-amber-200 shrink-0 select-none">
                  موقوفة نهائياً 🔒
                </div>
              </div>

              {/* Timeout Tuning */}
              <div className="space-y-3">
                <div className="flex justify-between items-center flex-row-reverse">
                  <label className="block text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-slate-400" />
                    زيادة وقت المهلة وفحص الاتصال الاحتياطي (Timeout Tuning)
                  </label>
                  <span className="font-mono font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg text-xs" dir="ltr">{config.preFlightTimeoutMs}ms ({(config.preFlightTimeoutMs / 1000).toFixed(1)} ثانية)</span>
                </div>
                <input
                  type="range"
                  min="1000"
                  max="30000"
                  step="500"
                  value={config.preFlightTimeoutMs}
                  onChange={e => {
                    const nextVal = Number(e.target.value);
                    setConfig(prev => ({ ...prev, preFlightTimeoutMs: nextVal }));
                  }}
                  onMouseUp={(e) => {
                    const finalVal = Number((e.target as HTMLInputElement).value);
                    setConfig(prev => {
                      const updated = { ...prev, preFlightTimeoutMs: finalVal };
                      handleSave(updated);
                      return updated;
                    });
                  }}
                  onTouchEnd={(e) => {
                    const finalVal = Number((e.target as HTMLInputElement).value);
                    setConfig(prev => {
                      const updated = { ...prev, preFlightTimeoutMs: finalVal };
                      handleSave(updated);
                      return updated;
                    });
                  }}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-100 rounded-lg"
                />
                
                {/* Quick Presets for connection speeds */}
                <div className="flex flex-wrap gap-2 pt-1 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => {
                        const updated = { ...prev, preFlightTimeoutMs: 3000 };
                        handleSave(updated);
                        return updated;
                      });
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${config.preFlightTimeoutMs === 3000 ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    3 ثوانٍ (سريع ⚡)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => {
                        const updated = { ...prev, preFlightTimeoutMs: 8000 };
                        handleSave(updated);
                        return updated;
                      });
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${config.preFlightTimeoutMs === 8000 ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    8 ثوانٍ (موصى به ⚙️)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => {
                        const updated = { ...prev, preFlightTimeoutMs: 15000 };
                        handleSave(updated);
                        return updated;
                      });
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${config.preFlightTimeoutMs === 15000 ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    15 ثانية (ممتد ⏱️)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setConfig(prev => {
                        const updated = { ...prev, preFlightTimeoutMs: 30000 };
                        handleSave(updated);
                        return updated;
                      });
                    }}
                    className={`px-3 py-1.5 text-[11px] font-bold rounded-lg transition-all ${config.preFlightTimeoutMs === 30000 ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'}`}
                  >
                    30 ثانية (أقصى حماية/IPv6 🛡️)
                  </button>
                </div>

                <p className="text-xs text-slate-400">إذا كانت قاعدة البيانات بعيدة أو بطيئة الاستجابة (مثل Supabase عبر IPv6 أو Render أو Neon)، يرجى تمديد وقت المهلة لتمكين اتصال مستقر وتجنب التحول التلقائي إلى SQLite.</p>
              </div>

              {/* External Hosting Provider Selection */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700">مزود الاستضافة الخارجي (External Hosting Provider)</label>
                <select
                  value={config.dbProvider || 'supabase'}
                  onChange={e => {
                    const nextVal = e.target.value;
                    setConfig(prev => {
                      const updated = { ...prev, dbProvider: nextVal };
                      handleSave(updated);
                      return updated;
                    });
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 outline-none text-xs text-slate-700 bg-white"
                >
                  <option value="supabase">Supabase (PostgreSQL)</option>
                  <option value="firebase">Firebase Firestore (NoSQL / Realtime)</option>
                  <option value="remote_sql">Remote Database Server (Postgres/MySQL)</option>
                  <option value="custom_api">Custom REST API / Webhook</option>
                </select>

                <div className={`text-xs font-semibold p-2.5 rounded-xl flex items-center gap-2 justify-start ${
                  isUrlAndProviderMatching 
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                    : 'bg-amber-50 text-amber-700 border border-amber-100'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${isUrlAndProviderMatching ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`}></span>
                  <span>
                    {isUrlAndProviderMatching 
                      ? '✓ نوع المزود متطابق ومتكامل مع رابط قاعدة البيانات المُدخل تلقائياً.' 
                      : '⚠️ تنبيه: يرجى التحقق من توافق نوع المزود المختار مع الرابط المُدخل.'}
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal mr-auto" dir="rtl">فحص آلي</span>
                </div>
              </div>

              {/* Plain Database Input for encryption */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700">تشفير وحفظ رابط SUPABASE_DATABASE_URL جديد</label>
                <div className="relative">
                  <input
                    type="password"
                    value={plainDatabaseUrl}
                    onChange={e => setPlainDatabaseUrl(e.target.value)}
                    placeholder="postgresql://postgres:password@db.supabase.co:5432/postgres"
                    className="w-full p-3 pl-12 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono text-left placeholder:text-slate-300 bg-white"
                    dir="ltr"
                  />
                  <Database className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500 font-medium">سيتم تشفير هذا الرابط تشفيراً كربتوغرافياً متيناً (Cryptographic AES-256) وسوف يتم حفظه وحفظ إعداداته في ملف التكوين الآمن والخاص بالنظام على الخادم.</p>
              </div>

              {/* Secret Token / Private Key Input */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <label className="block text-sm font-bold text-slate-700">مفتاح الوصول السري للربط والمزامنة (Secret Token / Private Key)</label>
                <div className="relative">
                  <input
                    type="password"
                    value={plainSecretToken}
                    onChange={e => setPlainSecretToken(e.target.value)}
                    placeholder="أدخل مفتاح الرمز السري الفني للربط والمزامنة..."
                    className="w-full p-3 pl-12 rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono text-left placeholder:text-slate-300 bg-white"
                    dir="ltr"
                  />
                  <Key className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
                </div>
                <p className="text-xs text-slate-500 font-medium">سيتم تشفير هذا الرمز السري وحفظه على مستوى الخادم لضمان أمان الربط الثنائي والمزامنة قنوات الاتصال والـ Webhooks.</p>
              </div>

              {/* Actions buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-4 justify-start">
                <button
                  type="button"
                  onClick={() => handleSave()}
                  disabled={saving}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-3 rounded-xl flex items-center gap-2 text-sm transition-colors cursor-pointer"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 text-amber-500" />}
                  تشفير وحفظ الإعدادات
                </button>

                <button
                  type="button"
                  onClick={handleTest}
                  disabled={testing}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-3 rounded-xl flex items-center gap-2 text-sm transition-colors cursor-pointer"
                >
                  {testing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Activity className="w-4 h-4" />}
                  اختبار الاتصال المباشر ⚡
                </button>
              </div>
            </div>

            {/* Render Test Banner if present */}
            {testResult && (
              <div className={`p-4 rounded-xl border flex items-start gap-3 justify-start ${testResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-800 text-right' : 'bg-rose-50 border-rose-200 text-rose-800 text-right'}`}>
                <div className="mt-0.5 shrink-0">
                  {testResult.success ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-rose-500" />}
                </div>
                <div>
                  <span className="block font-bold text-sm text-right">نبذة الفحص المباشر</span>
                  <span className="block text-xs mt-1 leading-relaxed text-right">{testResult.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Diagnostic Logs and Security Status */}
          <div className="space-y-6">
            {/* Live Database Sync Monitor & Telemetry */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4 relative overflow-hidden ring-2 ring-amber-500/10">
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500"></div>
              <div className="flex items-center justify-between">
                <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded-full font-bold border border-amber-500/30 font-sans">
                  مراقب الأداء الحي ⚡
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  Real-time Node Engine
                </span>
              </div>
              
              <h4 className="text-sm font-bold text-slate-200 text-right">حالة الاتصال ومزامنة البيانات الحية</h4>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400">حالة قاعدة البيانات:</span>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${
                      dbHealthStatus === 'connected' ? 'text-emerald-400' :
                      dbHealthStatus === 'fallback' ? 'text-amber-400' : 'text-blue-400'
                    }`}>
                      {dbHealthStatus === 'connected' ? 'متصل ومحمي (Active SQL)' :
                       dbHealthStatus === 'fallback' ? 'الوضع الاحتياطي (SQLite Fallback)' : 'جاري فحص النبض...'}
                    </span>
                    <span className={`w-3 h-3 rounded-full animate-pulse shrink-0 ${
                      dbHealthStatus === 'connected' ? 'bg-emerald-500' :
                      dbHealthStatus === 'fallback' ? 'bg-amber-500 animate-bounce' : 'bg-blue-500'
                    }`}></span>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400 font-sans">آخر مزامنة تلقائية:</span>
                  <span className="text-xs font-mono text-slate-200" dir="ltr">{dbLastSyncTime}</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-slate-800/60 rounded-xl border border-slate-700/50">
                  <span className="text-xs text-slate-400">مراقبة الـ WebSockets:</span>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold">
                    <span>نشط بالبث الفوري (Live)</span>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin duration-1000" />
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 text-right leading-relaxed bg-slate-950 p-3 rounded-lg border border-slate-800" dir="rtl">
                💡 <strong className="text-amber-400">حل ذكي لمنع تجمد البيانات:</strong> تم ربط المنصة بآلية مراقبة ثنائية تبث أي تحديث بالإعدادات فوراً لكافة الأجهزة والمدراء المتصلين بدون الحاجة لإعادة تحميل الصفحة أو تجميد مؤقت لـ LocalStorage.
              </div>
            </div>

            {/* Secrets Environment Info */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-4">
              <h4 className="text-sm font-bold text-slate-500 uppercase tracking-wider text-right">حالة التغليف والتشفير الفعلي</h4>
              
              <div className="space-y-3 font-sans">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-right">
                  <span className="block text-xs text-slate-500 mb-1">متغير بيئة الكونسول (SUPABASE_DATABASE_URL)</span>
                  {hasEnvUrl ? (
                    <div className="flex items-center gap-2 justify-end flex-wrap" dir="ltr">
                      <span className="font-mono text-[11px] text-slate-700 select-all break-all max-w-[90%]">{envUrlMasked}</span>
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full shrink-0"></span>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium block">غير متوفر بملف البيئة الافتراضي</span>
                  )}
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-right">
                  <span className="block text-xs text-indigo-600 mb-1 font-bold">رابط الاتصال المشفر المخزن بملف الإعدادات</span>
                  {config.encryptedDbUrl ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 justify-end flex-wrap" dir="ltr">
                        <span className="text-xs text-slate-600 font-semibold font-mono text-[10px] break-all select-all block max-w-[90%]">
                          {config.encryptedDbUrl.slice(0, 30)}...
                        </span>
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0"></span>
                      </div>
                      <div className="border-t border-indigo-100/50 pt-1 mt-1">
                        <span className="block text-[9px] text-slate-400 text-right">فك تشفير الرابط والتحقق:</span>
                        <span className="font-mono text-[10px] text-slate-700 select-all block text-left break-all" dir="ltr">{decryptedUrlMasked}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium block">لا تتوفر روابط مشفرة إضافية حالياً</span>
                  )}
                </div>

                <div className="p-3 bg-indigo-50/50 rounded-lg border border-indigo-100 text-right">
                  <span className="block text-xs text-indigo-600 mb-1 font-bold">مفتاح الوصول السري (Secret Token) المشفر المخزن</span>
                  {config.encryptedSecretToken ? (
                    <div className="space-y-1 text-right">
                      <div className="flex items-center gap-2 justify-end flex-wrap" dir="ltr">
                        <span className="text-xs text-slate-600 font-semibold font-mono text-[10px] break-all select-all block max-w-[90%]">
                          {config.encryptedSecretToken.slice(0, 30)}...
                        </span>
                        <span className="w-2.5 h-2.5 bg-indigo-500 rounded-full shrink-0"></span>
                      </div>
                      <div className="border-t border-indigo-100/50 pt-1 mt-1 text-right">
                        <span className="block text-[9px] text-slate-400">فك تشفير المفتاح والتحقق:</span>
                        <span className="font-mono text-[10px] text-slate-700 select-all block text-left break-all" dir="ltr">{decryptedSecretTokenMasked}</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-xs text-slate-400 font-medium block">لا يتوفر مفتاح وصول سري مخزن حالياً</span>
                  )}
                </div>

              </div>
            </div>

            {/* Interactive terminal viewer */}
            <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-lg font-mono text-xs space-y-3 text-right">
              <div className="flex justify-between items-center border-b border-slate-800 pb-3" dir="rtl">
                <span className="text-slate-400 text-xs flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                  موجز فحص الأمان والاتصال
                </span>
                <button
                  type="button"
                  onClick={() => setTerminalLogs([])}
                  className="text-slate-500 hover:text-slate-300 transition-colors text-[10px] uppercase font-bold"
                >
                  مسح الشاشة
                </button>
              </div>
              
              <div className="space-y-2 max-h-56 overflow-y-auto min-h-32 text-left" dir="ltr">
                {terminalLogs.length === 0 ? (
                  <p className="text-slate-500 italic text-center pt-8">لا يوجد سجل حالي. اضغط على فحص الاتصال لتوليد تقارير الأمان الفورية.</p>
                ) : (
                  terminalLogs.map((log, i) => (
                    <p key={i} className="leading-relaxed leading-6 selection:bg-amber-500 selection:text-slate-950">{log}</p>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'shield' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-250 text-right" dir="rtl">
          
          {/* Salted Hashing & 2FA column */}
          <div className="space-y-6">
            {/* Salted Password Hashing Simulator */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center gap-2 justify-start">
                <KeyRound className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-sm">محاكي التشفير والهاش ذو الملح الأحادي (Salted Password Hashing)</h4>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                أدخل كلمة مرور عشوائية لترى كيف يتم حقن ملح أحادي مولد عشوائياً (Dynamic Salt) وتشفيرها بخوارزمية <span className="font-mono font-bold bg-slate-100 text-slate-700 px-1 py-0.5 rounded">BCrypt / SHA-256</span> أحادية الاتجاه لضمان أعلى مستوى من الحصانة في قواعد البيانات الخارجية.
              </p>
              
              <div className="space-y-3 pt-2 text-right">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1 text-right">كلمة المرور التجريبية:</label>
                  <input
                    type="text"
                    value={rawPassword}
                    onChange={(e) => setRawPassword(e.target.value)}
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-right"
                    placeholder="اكتب كلمة مرور لتجربة تشفيرها..."
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1 flex-row-reverse">
                    <span>طول الملح المضاف (Salt Length):</span>
                    <span className="font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{hashSaltLength} bytes</span>
                  </div>
                  <input
                    type="range"
                    min="8"
                    max="32"
                    value={hashSaltLength}
                    onChange={(e) => setHashSaltLength(Number(e.target.value))}
                    className="w-full accent-amber-500"
                  />
                </div>

                <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5 space-y-2.5 font-mono text-left" dir="ltr">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1.5 flex-row-reverse text-right">
                    <span className="text-[10px] text-slate-400 font-sans font-bold">الملح الأحادي النشط (Active Salt)</span>
                    <span className="text-[11px] text-emerald-600 font-bold break-all">{hashSalt}</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 font-sans font-bold block text-right">الهاش النهائي المخزن في الحقل (Hash Result)</span>
                    <span className="text-[11px] text-amber-700 font-bold break-all block">{generatedHash}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Two-Factor Authentication Settings */}
            <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-row-reverse">
                <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${mfaEnabled ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                  {mfaEnabled ? 'نشط ومفعل بقوة 🔒' : 'غير مفعل حالياً 🔓'}
                </span>
                <div className="flex items-center gap-2 justify-start">
                  <Lock className="w-5 h-5 text-amber-500" />
                  <h4 className="font-bold text-slate-900 text-sm">إعدادات التحقق الثنائي للمشرفين (MFA/2FA Settings)</h4>
                </div>
              </div>
              
              <p className="text-xs text-slate-500 leading-relaxed">
                يقوم بفرض التحقق الثنائي عبر تطبيقات مصادقة الهوية (كـ Google Authenticator) على جميع حسابات موظفي إدارة المخزون، صانعي الصفقات والمشرفين.
              </p>

              {!mfaEnabled ? (
                <div className="bg-slate-50 p-4 border border-slate-100 rounded-xl space-y-3 text-right">
                  <div className="flex items-center gap-2.5 flex-row-reverse justify-end">
                    <span className="text-[11px] font-bold text-slate-700">امسح رمز الاستجابة السريع (QR Code):</span>
                    <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-xs">1</div>
                  </div>
                  
                  {/* QR code simulation */}
                  <div className="flex justify-center py-2">
                    <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-sm">
                      <div className="w-28 h-28 bg-[repeating-linear-gradient(45deg,transparent,transparent_8px,#000_8px,#000_16px)] opacity-80 rounded flex items-center justify-center text-center text-[8px] font-mono p-2 bg-slate-50">
                        [QR_SECURE_MFA_CODE_MOCK]
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2.5 flex-row-reverse justify-end">
                      <span className="text-[11px] font-bold text-slate-700">أدخل رمز التأكيد المكون من 6 أرقام:</span>
                      <div className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 font-extrabold flex items-center justify-center text-xs">2</div>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        maxLength={6}
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                        placeholder="123456"
                        className="flex-1 text-center font-mono tracking-widest text-xs p-2 rounded-lg border border-slate-200 outline-none focus:border-amber-500"
                      />
                      <button
                        onClick={() => {
                          if (mfaCode.length === 6) {
                            setMfaEnabled(true);
                            setMfaBackupCodes(['9081-3482', '1092-4829', '4021-9810', '5521-3910']);
                            showNotification('success', '🔐 تم تفعيل المصادقة الثنائية بنجاح وحفظ أكواد التراجع!');
                          } else {
                            showNotification('error', 'يرجى إدخال رمز صحيح من 6 أرقام');
                          }
                        }}
                        className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs font-sans cursor-pointer"
                      >
                        تحقق وتفعيل
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50/50 border border-emerald-150 p-4 rounded-xl space-y-3 text-right">
                  <span className="text-xs font-bold text-emerald-800 block">✔️ رمز التحقق الثنائي قيد العمل بنجاح.</span>
                  <div>
                    <span className="text-[10px] font-extrabold text-emerald-700 block mb-1.5 text-right">أكواد الطوارئ واستعادة الهوية الاحتياطية (Emergency Codes):</span>
                    <div className="grid grid-cols-2 gap-2 font-mono text-center" dir="ltr">
                      {mfaBackupCodes.map((code) => (
                        <div key={code} className="bg-white border border-emerald-200 text-emerald-800 text-xs py-1.5 rounded-lg select-all">
                          {code}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setMfaEnabled(false);
                      setMfaCode('');
                      setMfaBackupCodes([]);
                      showNotification('info', 'تم تعطيل التحقق الثنائي مؤقتاً');
                    }}
                    className="text-[10px] text-rose-600 font-bold hover:underline cursor-pointer"
                  >
                    تعطيل التحقق الثنائي
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Active Sessions column */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-4">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-row-reverse">
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2.5 py-1 rounded-full font-bold">
                {activeSessions.length} جلسة مفتوحة
              </span>
              <div className="flex items-center gap-2 justify-start">
                <Globe className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-sm">مستكشف وإدارة الجلسات النشطة (Active Sessions Explorer)</h4>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              راقب كافة المتصفحات وعناوين الـ IP المتصلة حالياً بالنظام وبوابة الموظفين، وأنهِ فوراً أي جلسة مريبة لحماية حسابات المنظومة من مخاطر القرصنة.
            </p>

            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between hover:border-slate-200 hover:bg-slate-50/40 transition-all flex-row-reverse">
                  <div className="space-y-1 text-right flex-1">
                    <div className="flex items-center gap-2 flex-row-reverse justify-end">
                      <span className="font-bold text-slate-800 text-xs">{session.employeeName || 'مشرف غير معروف'}</span>
                      <span className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-bold">{session.roleName || 'بدون فئة'}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono space-y-0.5 text-right" dir="ltr">
                      <div>IP: {session.ipAddress}</div>
                      <div>Agent: {session.userAgent}</div>
                      <div className="text-[9px] text-slate-350">Login: {new Date(session.loginTime).toLocaleString('ar-EG')}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRevokeSession(session.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer ml-3"
                    title="إنهاء وإبطال الجلسة فورا"
                  >
                    <LogOut className="w-4.5 h-4.5" />
                  </button>
                </div>
              ))}
              {activeSessions.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  لا توجد جلسات نشطة مسجلة حالياً.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'firewall' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in fade-in zoom-in-95 duration-250 text-right" dir="rtl">
          
          {/* Brute-Force Rate Limiting Settings */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-row-reverse">
              <button
                onClick={() => handleSaveFirewall()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
              >
                تطبيق السياسة
              </button>
              <div className="flex items-center gap-2 justify-start">
                <ShieldAlert className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-sm">جدار منع الاختراق والتخمين (Brute-Force Prevention)</h4>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              يقوم تلقائياً بحظر وتجميد عناوين الـ IP الخاصة بالمخربين الذين يحاولون تخمين كلمات المرور بكثرة لحماية قواعد بيانات المخزون والحجوزات.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1 flex-row-reverse">
                  <span>الحد الأقصى لمحاولات الدخول الخاطئة:</span>
                  <span className="font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{firewallConfig.maxLoginAttempts} محاولات</span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="10"
                  value={firewallConfig.maxLoginAttempts}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFirewallConfig(prev => ({ ...prev, maxLoginAttempts: val }));
                  }}
                  className="w-full accent-amber-500"
                />
              </div>

              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1 flex-row-reverse">
                  <span>مدة تجميد الحساب وحظر الـ IP:</span>
                  <span className="font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{firewallConfig.lockoutDurationMinutes} دقيقة</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="120"
                  step="5"
                  value={firewallConfig.lockoutDurationMinutes}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFirewallConfig(prev => ({ ...prev, lockoutDurationMinutes: val }));
                  }}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <span className="block text-xs font-bold text-slate-700 mb-2 text-right">عناوين الـ IP المحظورة حالياً (Blocked IPs Blacklist):</span>
                <div className="space-y-2">
                  {firewallConfig.lockedIPs.map((ip) => (
                    <div key={ip} className="p-2.5 bg-rose-50 border border-rose-100 rounded-lg flex items-center justify-between font-mono text-xs flex-row-reverse">
                      <span className="text-rose-700 font-bold">{ip}</span>
                      <button
                        onClick={() => {
                          const updated = {
                            ...firewallConfig,
                            lockedIPs: firewallConfig.lockedIPs.filter(i => i !== ip)
                          };
                          setFirewallConfig(updated);
                          handleSaveFirewall(updated);
                          showNotification('success', `تم إلغاء حظر عنوان الـ IP: ${ip} بنجاح!`);
                        }}
                        className="text-[10px] text-rose-600 hover:underline font-sans font-bold cursor-pointer"
                      >
                        إلغاء الحظر وتصفير المحاولات
                      </button>
                    </div>
                  ))}
                  {firewallConfig.lockedIPs.length === 0 && (
                    <div className="text-center p-4 text-slate-400 text-xs">
                      قائمة الحظر السوداء فارغة حالياً.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Password Complexity Engine */}
          <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-6">
            <div className="pb-3 border-b border-slate-100 flex items-center justify-between flex-row-reverse">
              <button
                onClick={() => handleSaveFirewall()}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer"
              >
                تطبيق السياسة
              </button>
              <div className="flex items-center gap-2 justify-start">
                <Key className="w-5 h-5 text-amber-500" />
                <h4 className="font-bold text-slate-900 text-sm">سياسة تعقيد كلمة المرور (Password Complexity Engine)</h4>
              </div>
            </div>
            
            <p className="text-xs text-slate-500 leading-relaxed">
              ضع معايير صارمة للغاية لإنشاء كلمات المرور للموظفين والمشرفين الجدد، للوقاية من هجمات الاختراق التخمينية.
            </p>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center text-[11px] font-bold text-slate-600 mb-1 flex-row-reverse">
                  <span>الحد الأدنى لطول كلمة المرور:</span>
                  <span className="font-mono text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">{firewallConfig.minLength} حروف</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="20"
                  value={firewallConfig.minLength}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setFirewallConfig(prev => ({ ...prev, minLength: val }));
                  }}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex-row-reverse">
                  <span className="text-[11px] font-bold text-slate-700">رموز خاصة (!@#)</span>
                  <input
                    type="checkbox"
                    checked={firewallConfig.requireSpecialChar}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setFirewallConfig(prev => ({ ...prev, requireSpecialChar: val }));
                    }}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex-row-reverse">
                  <span className="text-[11px] font-bold text-slate-700">أرقام (0-9)</span>
                  <input
                    type="checkbox"
                    checked={firewallConfig.requireNumbers}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setFirewallConfig(prev => ({ ...prev, requireNumbers: val }));
                    }}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 border border-slate-100 rounded-xl hover:bg-slate-50 cursor-pointer flex-row-reverse">
                  <span className="text-[11px] font-bold text-slate-700">حروف كبيرة (A-Z)</span>
                  <input
                    type="checkbox"
                    checked={firewallConfig.requireUppercase}
                    onChange={(e) => {
                      const val = e.target.checked;
                      setFirewallConfig(prev => ({ ...prev, requireUppercase: val }));
                    }}
                    className="w-4 h-4 accent-amber-500 rounded cursor-pointer"
                  />
                </label>
              </div>

              {/* Real-time strength visual evaluator */}
              <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                <span className="block text-xs font-bold text-slate-700 text-right">مقياس قوة كلمة المرور ومطابقتها التفاعلية:</span>
                <input
                  type="password"
                  value={testPasswordComplexity}
                  onChange={(e) => setTestPasswordComplexity(e.target.value)}
                  placeholder="اكتب كلمة مرور تجريبية لاختبار قوتها..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 outline-none bg-white font-mono text-right"
                />
                
                {testPasswordComplexity && (
                  <div className="space-y-1.5 text-right">
                    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordComplexityScore.score < 40 
                            ? 'bg-rose-500' 
                            : passwordComplexityScore.score < 70 
                              ? 'bg-amber-500' 
                              : passwordComplexityScore.score < 90 
                                ? 'bg-emerald-500' 
                                : 'bg-teal-500'
                        }`}
                        style={{ width: `${passwordComplexityScore.score}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-bold flex-row-reverse">
                      <span className="text-slate-400">تطابق السياسة:</span>
                      <span className={`px-2 py-0.5 rounded ${passwordComplexityScore.color}`}>
                        {passwordComplexityScore.text}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'audit' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-150 shadow-sm space-y-6 animate-in fade-in zoom-in-95 duration-250 text-right" dir="rtl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 flex-row-reverse">
            <div className="flex gap-2">
              <button
                onClick={() => {
                  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
                  const downloadAnchor = document.createElement('a');
                  downloadAnchor.setAttribute("href", dataStr);
                  downloadAnchor.setAttribute("download", `AuditLogs_Export_${Date.now()}.json`);
                  document.body.appendChild(downloadAnchor);
                  downloadAnchor.click();
                  downloadAnchor.remove();
                  showNotification('success', 'تم تصدير تقرير السجل الأمني بصيغة JSON بنجاح!');
                }}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-500" />
                تصدير بصيغة JSON
              </button>
            </div>

            <div className="space-y-1 text-right flex-1">
              <h4 className="text-lg font-bold text-slate-900 flex items-center gap-2 justify-end">
                <ScrollText className="w-5 h-5 text-amber-500" />
                سجل المطابقة والأحداث الأمنية الفورية (Real-time Secure Audit Trail)
              </h4>
              <p className="text-xs text-slate-500">
                قائمة حية تسجل جميع حركات الولوج، وتعديل إعدادات الأمان والمخزون، وتغيير الصلاحيات مسجلة بعنوان IP ونوع المنفذ لضمان الشفافية المطلقة.
              </p>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              type="text"
              placeholder="ابحث باسم الموظف أو بنوع الحركة..."
              value={auditSearch}
              onChange={(e) => setAuditSearch(e.target.value)}
              className="text-xs p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 text-right"
            />

            <select
              value={auditSeverity}
              onChange={(e) => setAuditSeverity(e.target.value)}
              className="text-xs font-sans font-bold bg-white border border-slate-200 rounded-xl p-3 outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 text-right"
            >
              <option value="all">كل درجات التنبيه (All Severities)</option>
              <option value="safe">🟢 عمليات تشغيلية آمنة (Safe)</option>
              <option value="warning">🟡 تحذير وتغيير إعدادات (Warning)</option>
              <option value="critical">🔴 مخاطر وتهديدات دخول (Critical)</option>
            </select>

            <button
              onClick={() => fetchAuditLogs()}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-3 rounded-xl text-xs flex items-center gap-2 justify-center cursor-pointer font-sans"
            >
              <RefreshCw className={`w-4 h-4 ${auditLoading ? 'animate-spin' : ''}`} />
              تحديث وتزامن فوري للسجل
            </button>
          </div>

          {/* Logs view */}
          <div className="overflow-x-auto border border-slate-100 rounded-xl" dir="rtl">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-600">
                  <th className="p-3.5 font-bold text-right">الرمز والوقت</th>
                  <th className="p-3.5 font-bold text-right">درجة الحساسية</th>
                  <th className="p-3.5 font-bold text-right">الحركة (Action)</th>
                  <th className="p-3.5 font-bold text-right">بواسطة (User)</th>
                  <th className="p-3.5 font-bold text-right">التفاصيل الفنية (Logs & Metadata)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {auditLoading ? (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                      جاري سحب الحركات الأمنية من قاعدة البيانات الخارجية...
                    </td>
                  </tr>
                ) : (
                  auditLogs
                    .filter((log) => {
                      const matchSearch =
                        !auditSearch ||
                        log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
                        (log.employeeName && log.employeeName.toLowerCase().includes(auditSearch.toLowerCase())) ||
                        JSON.stringify(log.details || '').toLowerCase().includes(auditSearch.toLowerCase());
                      
                      const severity = log.severity || (log.action.includes('MIGRATE') || log.action.includes('UPDATE') || log.action.includes('REVOKE') ? 'warning' : 'safe');
                      const matchSeverity = auditSeverity === 'all' || severity === auditSeverity;

                      return matchSearch && matchSeverity;
                    })
                    .map((log) => {
                      const severity = log.severity || (log.action.includes('MIGRATE') || log.action.includes('UPDATE') || log.action.includes('REVOKE') ? 'warning' : 'safe');
                      return (
                        <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-3.5 whitespace-nowrap text-right">
                            <div className="font-bold text-slate-800 font-mono">#{log.id}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{new Date(log.createdAt).toLocaleString('ar-EG')}</div>
                          </td>
                          <td className="p-3.5 text-right">
                            {severity === 'critical' ? (
                              <span className="bg-rose-50 text-rose-700 border border-rose-100 px-2 py-0.5 rounded-full font-bold text-[10px]">🔴 حرج (Critical)</span>
                            ) : severity === 'warning' ? (
                              <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-full font-bold text-[10px]">🟡 تحذير (Warning)</span>
                            ) : (
                              <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-full font-bold text-[10px]">🟢 آمن (Safe)</span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <span className="bg-slate-100 text-slate-700 font-mono font-bold px-1.5 py-0.5 rounded text-[11px]">{log.action}</span>
                          </td>
                          <td className="p-3.5 font-semibold text-slate-800 text-right">
                            {log.employeeName || 'مشرف المنظومة'}
                          </td>
                          <td className="p-3.5 text-left" dir="ltr">
                            <div className="text-[10px] text-slate-500 font-mono max-w-sm overflow-hidden text-ellipsis whitespace-nowrap" title={JSON.stringify(log.details)}>
                              {JSON.stringify(log.details)}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                )}
                {!auditLoading && auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">
                      سجل المطابقة والأحداث الأمنية فارغ تماماً حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'migration' && (
        <div className="space-y-8 animate-in fade-in zoom-in-95 duration-200 text-right">
          {/* Migration and Backup Hubs Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Migration to External DB Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 justify-start" dir="rtl">
                <RefreshCw className={`w-6 h-6 text-amber-500 ${migrating ? 'animate-spin' : ''}`} />
                <div className="text-right">
                  <h4 className="text-lg font-bold text-slate-800">مركز ترحيل قاعدة البيانات (Migration Hub)</h4>
                  <p className="text-xs text-slate-500">ترحيل كافة الجداول المحلية والسجلات لخدمة السحابة Supabase / PostgreSQL</p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200/50 rounded-xl p-4 text-xs text-amber-800 space-y-2 leading-relaxed text-right">
                <span className="font-bold block">💡 إرشادات ترحيل البيانات:</span>
                <p>
                  سيتم نسخ وتحويل السجلات من قاعدة البيانات المحلية الحالية (<span className="font-mono">SQLite</span>) إلى قاعدة البيانات الخارجية المعينة. يرجى التأكد من أن رابط الاتصال مدخل ومحفوظ بنجاح أو مأخوذ من متغيرات البيئة قبل بدء عملية النقل.
                </p>
              </div>

              {/* Wipe target or append option */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200/40" dir="rtl">
                <div className="text-right">
                  <span className="block font-bold text-sm text-slate-800">وضع التهجير والمسح الفردي (Fresh Wipe)</span>
                  <span className="block text-xs text-slate-400 text-right">سيقوم بمسح الجداول المستهدفة أولاً (Truncate) لتجنب حدوث تكرار في السجلات المهاجرة.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setResetTarget(!resetTarget)}
                  className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${resetTarget ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <span className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all duration-200 ${resetTarget ? 'right-1' : 'right-7'}`}></span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleMigrate}
                disabled={migrating}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-slate-950/10 active:scale-[0.99] font-sans"
              >
                {migrating ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5 text-amber-500" />}
                البدء الفوري في ترحيل قاعدة البيانات والجداول 🚀
              </button>

              {/* Migration Logs Visualizer */}
              {migrationLogs.length > 0 && (
                <div className="bg-slate-950 text-emerald-400 rounded-xl p-4 border border-slate-800 font-mono text-[11px] space-y-2 max-h-56 overflow-y-auto">
                  <span className="text-slate-400 block border-b border-slate-800 pb-1 flex items-center gap-2 justify-start font-sans" dir="rtl">
                    <span className={`w-2 h-2 rounded-full ${migrating ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
                    تقرير وسجل الترحيل الفوري في الخادم:
                  </span>
                  <div className="space-y-1 text-left" dir="ltr">
                    {migrationLogs.map((log, i) => (
                      <p key={i} className="leading-5">{log}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Download & Export Copy Panel */}
            <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-right">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100 justify-start" dir="rtl">
                <Download className="w-6 h-6 text-amber-500" />
                <div className="text-right">
                  <h4 className="text-lg font-bold text-slate-800">مستودع النسخ الاحتياطية والتصدير (Backups Hub)</h4>
                  <p className="text-xs text-slate-500">تنزيل نسخة احتياطية فورية من الجداول في أي وقت وبصيغ متعددة</p>
                </div>
              </div>

              <p className="text-xs text-slate-500 leading-relaxed">
                لحماية بيانات المنصة والاحتفاظ بنسخة مطابقة، يمكنك استخدام روابط التنزيل المباشرة التالية لتوليد وتحميل نسخ ترحيلية كاملة:
              </p>

              <div className="grid grid-cols-1 gap-3">
                {/* SQLite File Download */}
                <a
                  href="/api/security/database/backup/sqlite"
                  download
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-amber-200 bg-slate-50 hover:bg-amber-50/20 transition-all group"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3 text-right">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100/50">
                      <Database className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-800">قاعدة البيانات المحلية كاملة SQLite3</span>
                      <span className="block text-[11px] text-slate-400">تحميل ملف البيانات الثنائي الحالي <span className="font-mono">database.sqlite</span></span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                </a>

                {/* PostgreSQL SQL Dump Download */}
                <a
                  href="/api/security/database/backup/sql"
                  download
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-amber-200 bg-slate-50 hover:bg-amber-50/20 transition-all group"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3 text-right">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100/50">
                      <ScrollText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-800">نص الترحيل البرمجي SQL Dump</span>
                      <span className="block text-[11px] text-slate-400">تصدير مخطط وهيكل الجداول مع استعلامات SQL متوافقة مع <span className="font-mono">PostgreSQL</span></span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                </a>

                {/* JSON Dataset Download */}
                <a
                  href="/api/security/database/backup/json"
                  download
                  className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-amber-200 bg-slate-50 hover:bg-amber-50/20 transition-all group"
                  dir="rtl"
                >
                  <div className="flex items-center gap-3 text-right">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100/50">
                      <FileDown className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="block font-bold text-sm text-slate-800">بيانات الجدول المهيكل بصيغة JSON</span>
                      <span className="block text-[11px] text-slate-400">تحميل كافة السجلات والبيانات على هيئة مصفوفة كائنات منظمة</span>
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-slate-400 group-hover:text-amber-500" />
                </a>
              </div>
            </div>
          </div>

          {/* وحدة التدقيق والمطابقة لسلامة جداول تطبيق الجوال وقاعدة البيانات الخارجية */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-right animate-in fade-in zoom-in-95 duration-200" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-2 text-right">
              <div className="flex items-center gap-3 justify-start">
                <ShieldCheck className="w-6 h-6 text-emerald-600 animate-pulse" />
                <div>
                  <h4 className="text-lg font-bold text-slate-800">وحدة التدقيق ومطابقة سلامة الجداول لتطبيق الجوال (Mobile App & DB Integrity Auditor)</h4>
                  <p className="text-xs text-slate-500">فحص سلامة الربط ومطابقة الـ 30 جدولاً حرفياً مع قاعدة البيانات الخارجية وحل أي نقص فوراً</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end">
                <span className={`text-[10px] font-extrabold px-3 py-1 border rounded-full flex items-center gap-1.5 font-sans ${integrityAllOk === true ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : integrityAllOk === false ? 'bg-rose-50 text-rose-700 border-rose-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${integrityAllOk === true ? 'bg-emerald-500' : integrityAllOk === false ? 'bg-rose-500' : 'bg-slate-400'}`}></span>
                  {integrityAllOk === true ? 'متطابق وسليم 100%' : integrityAllOk === false ? 'يتطلب التدخل أو الإصلاح' : 'لم يتم الفحص بعد'}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تضمن هذه الوحدة توافقاً حرفياً كاملاً بين كافة هياكل الجداول الفنية المُعرّفة في شيفرة المنصة وبين الجداول المقابلة لها في خادم قاعدة البيانات الخارجي التابع لـ <span className="font-bold text-emerald-600">Supabase / PostgreSQL</span>. تفعيل خيار <span className="font-extrabold text-amber-600">الإصلاح التلقائي والمزامنة الحرفية</span> يمنح النظام الصلاحية لإعادة تفعيل وتحديث الجداول وتثبيت الأعمدة الناقصة برمجياً دون فقدان أي بيانات تشغيلية.
            </p>

            <div className="bg-slate-50 border border-slate-200/40 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs font-sans">
              <div className="text-right space-y-1">
                <span className="block font-bold text-sm text-slate-800">تفعيل الإصلاح والمزامنة الحرفية التلقائية (Auto-Repair & Sync)</span>
                <span className="block text-xs text-slate-400">في حال العثور على أي تفاوت أو جدول ناقص، سيقوم النظام تلقائياً بإنشائه ومطابقة الأعمدة حرفياً.</span>
              </div>
              <button
                type="button"
                onClick={() => setAutoRepairIntegrity(!autoRepairIntegrity)}
                className={`w-14 h-8 rounded-full transition-colors relative shrink-0 ${autoRepairIntegrity ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 bg-white w-6 h-6 rounded-full transition-all duration-200 ${autoRepairIntegrity ? 'right-1' : 'right-7'}`}></span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleVerifyIntegrity}
                disabled={verifyingIntegrity || cleaningObsolete}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-950/10 active:scale-[0.99] font-sans"
              >
                {verifyingIntegrity ? <RefreshCw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-white" />}
                {verifyingIntegrity ? 'جاري فحص وتدقيق الجداول...' : 'بدء تشغيل فحص المطابقة والتحقق 🛡️'}
              </button>

              <button
                type="button"
                onClick={handleCleanupObsoleteTables}
                disabled={verifyingIntegrity || cleaningObsolete}
                className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-rose-950/10 active:scale-[0.99] font-sans"
              >
                {cleaningObsolete ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5 text-white" />}
                {cleaningObsolete ? 'جاري تطهير الجداول الزائدة...' : 'تنظيف وتطهير الجداول الزائدة والمكررة 🧹'}
              </button>
            </div>

            {/* Live Logs from Server */}
            {integrityLogs.length > 0 && (
              <div className="bg-slate-950 text-emerald-400 rounded-xl p-4 border border-slate-800 font-mono text-[11px] space-y-2 max-h-56 overflow-y-auto">
                <span className="text-slate-400 block border-b border-slate-800 pb-1 flex items-center gap-2 justify-start font-sans font-bold" dir="rtl">
                  <span className={`w-2 h-2 rounded-full ${verifyingIntegrity ? 'bg-amber-500 animate-ping' : 'bg-emerald-500'}`}></span>
                  لوحة سجل التحقق الفوري وسلامة الاتصال:
                </span>
                <div className="space-y-1 text-left" dir="ltr">
                  {integrityLogs.map((log, i) => (
                    <p key={i} className="leading-5">{log}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Matrix of Table Results */}
            {integrityResults.length > 0 && (
              <div className="border border-slate-100 rounded-xl overflow-hidden shadow-xs text-right">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between font-bold text-xs text-slate-700" dir="rtl">
                  <span>جدول تفاصيل مطابقة الـ 30 جدولاً حرفياً مع قاعدة البيانات الخارجية</span>
                  <span className="text-[10px] text-slate-400">انقر على فحص المطابقة لتحديث البيانات</span>
                </div>
                <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
                  {integrityResults.map((resItem, idx) => (
                    <div key={idx} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-right" dir="rtl">
                      <div className="space-y-1 text-right">
                        <div className="flex items-center gap-2 justify-start">
                          <span className="font-extrabold text-sm text-slate-800">{resItem.table}</span>
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full font-mono">{resItem.model}</span>
                        </div>
                        <p className="text-xs text-slate-500 leading-relaxed text-right">{resItem.details}</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-3 py-1 rounded-full text-center sm:self-center shrink-0 border ${
                        resItem.status === 'ok' 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                          : resItem.status === 'repaired' 
                            ? 'bg-amber-50 text-amber-700 border-amber-100' 
                            : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {resItem.status === 'ok' ? 'سليم ومطابق حرفياً' : resItem.status === 'repaired' ? 'تم الإصلاح والمزامنة' : 'مفقود أو تالف'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* مخطط وهيكل وجداول قاعدة البيانات الفعالة (Database Schema Viewer) */}
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6 text-right animate-in fade-in zoom-in-95 duration-200" dir="rtl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 flex-wrap gap-3 text-right">
              <div className="flex items-center gap-3 justify-start">
                <Database className="w-6 h-6 text-amber-500 animate-pulse" />
                <div>
                  <h4 className="text-lg font-bold text-slate-800">هيكل ومخطط جداول قاعدة البيانات الفعالة (Database Schema Viewer)</h4>
                  <p className="text-xs text-slate-500">استكشاف المخطط (Schema) والعلاقات لجميع الجداول الـ 45 المتزامنة عبر حزم Sequelize ORM مع Supabase / PostgreSQL</p>
                </div>
              </div>
              <div className="flex gap-2 justify-end flex-wrap">
                <span className="text-[10px] bg-emerald-50 text-emerald-700 font-extrabold px-3 py-1 border border-emerald-200 rounded-full flex items-center gap-1.5 font-sans">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
                  45 جدولاً متكاملاً ومطابقاً
                </span>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-3 py-1 border border-indigo-200 rounded-full font-sans">
                  7 حزم برمجية شاملة
                </span>
                <span className="text-[10px] bg-amber-50 text-amber-700 font-extrabold px-3 py-1 border border-amber-200 rounded-full font-mono">
                  Sequelize / Supabase Postgres
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              تمثل القائمة أدناه جميع الجداول الـ <span className="font-extrabold text-amber-600">45</span> الفنية المطورة بلغة <span className="font-semibold text-slate-700">Sequelize ORM Modules</span> لدعم معالجة وحفظ العمليات على منصة ليلة بشكل متزامن تماماً مع قاعدة البيانات الخارجية في <span className="font-bold text-emerald-600">Supabase / PostgreSQL</span>. تتوزع الجداول على <span className="font-bold text-indigo-600">7 حزم تشغيلية</span> لتغطية النواة والإدارة، الحجوزات والقاعات، الشؤون المالية والمحافظ، الخدمات والمخزون، التسويق، الدعم، والاشتراكات.
            </p>

            {/* أدوات التصفية والبحث في المخطط */}
            <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-100">
              <div className="flex flex-col md:flex-row items-center justify-between gap-3">
                {/* حزم الجداول (Filter Categories) */}
                <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 scrollbar-none">
                  {[
                    { id: 'all', label: 'الكل', count: 45 },
                    { id: 'core', label: '📦 النواة والحوكمة', count: 12 },
                    { id: 'operations', label: '🏰 الصالات والحجوزات', count: 7 },
                    { id: 'finance', label: '💰 الشؤون المالية والمحافظ', count: 12 },
                    { id: 'services', label: '🛠️ الخدمات والمخزون', count: 3 },
                    { id: 'marketing', label: '📢 التسويق والإعلانات', count: 3 },
                    { id: 'support', label: '💬 الدعم والدردشة', count: 5 },
                    { id: 'subscriptions', label: '🌟 باقات الاشتراكات', count: 3 },
                  ].map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setSchemaCategoryFilter(cat.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                        schemaCategoryFilter === cat.id
                          ? 'bg-slate-900 text-amber-400 shadow-sm border border-slate-800'
                          : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{cat.label}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        schemaCategoryFilter === cat.id ? 'bg-amber-400/20 text-amber-300' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {cat.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* شريط البحث في المخطط */}
                <div className="relative w-full md:w-64 shrink-0">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={schemaSearchQuery}
                    onChange={(e) => setSchemaSearchQuery(e.target.value)}
                    placeholder="ابحث برقم الجدول أو الاسم أو الحقول..."
                    className="w-full pr-9 pl-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-amber-400 transition-all placeholder:text-slate-400"
                  />
                  {schemaSearchQuery && (
                    <button 
                      onClick={() => setSchemaSearchQuery('')}
                      className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* شبكة عرض حزم الجداول */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                // 1. Core & Admin (12)
                { id: '1', name: 'User', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'المستخدمين والعملاء (Users)', fields: 'id, name, email, phone, roleId, status, providerId', desc: 'إدارة وتخزين حسابات الإدارة والمشرفين ومزودي الخدمات والعملاء والشركاء مع بيانات الفتح والجلسة.', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { id: '2', name: 'Role', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'الأدوار والصلاحيات (Roles)', fields: 'id, name, permissions', desc: 'إدارة الأدوار والمجموعات الوظيفية وتخريج المصفوفات الأمنية وصلاحيات المشرفين والموظفين.', color: 'text-sky-700 bg-sky-50 border-sky-200' },
                { id: '3', name: 'Employee', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'الموظفين والسجلات (Employees)', fields: 'id, name, email, nationalId, ibanEncrypted, phone', desc: 'السجلات الوظيفية وهويات الموظفين الحساسة (تخضع لتشفير AES-256 محمي ببيئة الخادم).', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { id: '4', name: 'Attendance', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'الحضور والانصراف (Attendance)', fields: 'id, employeeId, date, checkIn, checkOut, status', desc: 'تتبع مواعيد وسجلات الحضور والانصراف وساعات الدوام لموظفي المنصة والصالات.', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { id: '5', name: 'LeaveRequest', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'طلبات الإجازات (LeaveRequests)', fields: 'id, employeeId, type, startDate, endDate, status', desc: 'إدارة وتتبع طلبات الإجازات السنوية والمرضية والطارئة للموظفين واعتمادها.', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                { id: '6', name: 'EmployeeEvaluation', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'تقييمات الموظفين (EmployeeEvaluations)', fields: 'id, employeeId, score, feedback, evaluatedBy', desc: 'تقييمات أداء الموظفين الدورية وملاحظات الإدارة ومؤشرات الإنتاجية.', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                { id: '7', name: 'TemporaryPermission', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'التصاريح المؤقتة (TemporaryPermissions)', fields: 'id, employeeId, permissionType, hours, status', desc: 'إدارة أذونات الخروج الاستثنائية والتصاريح الزمنية المؤقتة للموظفين.', color: 'text-teal-700 bg-teal-50 border-teal-200' },
                { id: '8', name: 'EmployeeSession', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'جلسات الموظفين (EmployeeSessions)', fields: 'id, employeeId, token, ipAddress, device, expiresAt', desc: 'تتبع جلسات تسجيل الدخول النشطة للموظفين وأجهزة الوصول الأمني.', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                { id: '9', name: 'PendingRegistration', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'التسجيلات المعلقة (PendingRegistrations)', fields: 'id, companyName, managerName, phone, status', desc: 'بوابة الشركاء الجدد ومزودي القاعات للالتحاق بالمنصة قبل نيل اعتماد الإدارة.', color: 'text-orange-700 bg-orange-50 border-orange-200' },
                { id: '10', name: 'SystemSettings', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'إعدادات النظام (SystemSettings)', fields: 'id, key, value, description', desc: 'تخزين متغيرات تهيئة بيئة العمل ونسبة ضريبة القيمة المضافة وشروط الإلغاء.', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                { id: '11', name: 'PlatformConfig', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'تهيئة وحدات المنصة (PlatformConfig)', fields: 'id, module, isEnabled, settings, updatedAt', desc: 'إدارة وتفعيل الوحدات البرمجية والخدمات المتقدمة ونقاط التكامل للمنصة.', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
                { id: '12', name: 'AuditLog', category: 'core', categoryLabel: 'النواة والحوكمة', arabicName: 'سجل حركات النظام (AuditLogs)', fields: 'id, userId, action, ipAddress, details, createdAt', desc: 'تتبع كافة التغييرات الحساسة وعمليات المشرفين في لوحة التحكم وتدقيق الأمان.', color: 'text-slate-600 bg-slate-100 border-slate-200' },

                // 2. Halls & Operations (7)
                { id: '13', name: 'Hall', category: 'operations', categoryLabel: 'الصالات والحجوزات', arabicName: 'صالات الأفراح (Halls)', fields: 'id, name, address, price, providerId, adminApprovalStatus', desc: 'المخزون الرئيسي للصالات والأسعار والمواصفات وحالة اعتماد الإدارة للظهور العام.', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                { id: '14', name: 'HallExtraServices', category: 'operations', categoryLabel: 'الصالات والحجوزات', arabicName: 'خدمات القاعة الداخلية (HallExtraServices)', fields: 'id, hallId, serviceName, price, isIncluded', desc: 'قائمة الخدمات المضافة الخاصة بالمكان (كالبوفيه والضيافة المدمجة بالقاعة).', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { id: '15', name: 'Booking', category: 'operations', categoryLabel: 'الصالات والحجوزات', arabicName: 'حجوزات الصالات (Bookings)', fields: 'id, bookingNumber, hallId, providerId, customerId, totalPrice, status', desc: 'سجلات حجز القاعات ومتابعة العربون والتواريخ والسريال المعياري BKG-YY.', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { id: '16', name: 'BookingService', category: 'operations', categoryLabel: 'الصالات والحجوزات', arabicName: 'خدمات الحجوزات (BookingServices)', fields: 'id, bookingId, serviceId, quantity, price', desc: 'جدول ربط خدمات الضيافة والتصوير والورود المضافة مع حجز القاعة.', color: 'text-violet-700 bg-violet-50 border-violet-200' },
                { id: '17', name: 'SupportServiceRequest', category: 'operations', categoryLabel: 'الصالات والحجوزات', arabicName: 'طلبات الدعم اللوجستي (SupportServiceRequests)', fields: 'id, bookingId, serviceType, description, status, price', desc: 'طلبات التنظيم وإدارة الحشود والخدمات اللوجستية المساندة لليلة المناسبة.', color: 'text-lime-700 bg-lime-50 border-lime-200' },
                { id: '18', name: 'ForceMajeureRequest', category: 'operations', categoryLabel: 'الصالات والحجوزات', arabicName: 'طلبات الظروف القاهرة (ForceMajeureRequests)', fields: 'id, bookingId, reason, documents, status, adminDecision', desc: 'دراسة ومعالجة طلبات إلغاء الحجز والاسترداد بسبب ظروف استثنائية طارئة.', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { id: '19', name: 'Favorite', category: 'operations', categoryLabel: 'الصالات والحجوزات', arabicName: 'قائمة المفضلة (Favorites)', fields: 'id, userId, hallId, serviceId, createdAt', desc: 'قائمة القاعات والخدمات المفضلة المحفوظة بحسابات العملاء لسهولة الحجز.', color: 'text-pink-700 bg-pink-50 border-pink-200' },

                // 3. Financials, Invoices & Wallets (12)
                { id: '20', name: 'Invoice', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'الفواتير الضريبية (Invoices)', fields: 'id, invoiceNumber, bookingId, totalAmount, taxAmount, netProviderAmount', desc: 'إصدار الفواتير الضريبية الموحدة بسريال INV-YYXXXXXXXXXX والضريبة المضافة.', color: 'text-purple-700 bg-purple-50 border-purple-200' },
                { id: '21', name: 'Revenue', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'الإيرادات التشغيلية (Revenues)', fields: 'id, revenueNumber, providerId, grossAmount, commissionAmount, netRevenue', desc: 'تسجيل عوائد المبيعات واقتطاع عمولة المنصة التلقائي بسريال REV-YY.', color: 'text-teal-700 bg-teal-50 border-teal-200' },
                { id: '22', name: 'RevenueType', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'تصنيفات الإيرادات (RevenueTypes)', fields: 'id, name, code, description', desc: 'تحديد وفهرسة مصادر الإيرادات التشغيلية وعمولات المنصة.', color: 'text-sky-700 bg-sky-50 border-sky-200' },
                { id: '23', name: 'Expense', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'المصروفات العامة (Expenses)', fields: 'id, expenseNumber, category, amount, taxAmount, paidTo', desc: 'توثيق ومتابعة المصروفات العمومية والتشغيلية للمنصة والقاعات بسريال EXP-YY.', color: 'text-red-700 bg-red-50 border-red-200' },
                { id: '24', name: 'ExpenseCategory', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'فئات المصروفات (ExpenseCategories)', fields: 'id, name, budgetLimit, description', desc: 'تصنيف وتبويب النفقات والمصروفات العمومية والتشغيلية.', color: 'text-rose-700 bg-rose-50 border-rose-200' },
                { id: '25', name: 'LedgerEntry', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'سجلات القيد المزدوج (LedgerEntries)', fields: 'id, accountId, debit, credit, reference, description', desc: 'قيود اليومية العامة والمحاسبة المالية المزدوجة للمنصة.', color: 'text-slate-700 bg-slate-100 border-slate-200' },
                { id: '26', name: 'FinancialClaim', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'المطالبات المالية (FinancialClaims)', fields: 'id, providerName, amount, status, createdAt', desc: 'متابعة الصفقات والمطالبات المستحقة لمزودي القاعات لضمان سرعة التسوية.', color: 'text-lime-700 bg-lime-50 border-lime-200' },
                { id: '27', name: 'Wallet', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'محافظ الشركاء (Wallets)', fields: 'id, userId, providerId, balance, pendingBalance', desc: 'رصيد المحفظة المالي النشط والمعلق المتاح لسحب أرباح الشريك والمزود.', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { id: '28', name: 'WalletTransaction', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'حركات المحافظ (WalletTransactions)', fields: 'id, walletId, amount, type, description, reference', desc: 'سجل حركات الإيداع والسحب وتصفية الحسابات والتحويلات للشركاء.', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
                { id: '29', name: 'CustomerWallet', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'محافظ العملاء (CustomerWallets)', fields: 'id, customerId, balance, currency, updatedAt', desc: 'رصيد محفظة العميل المستخدم في الدفع الإلكتروني واسترداد المبالغ.', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                { id: '30', name: 'CustomerHeldBalance', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'المبالغ المعلقة للعملاء (CustomerHeldBalances)', fields: 'id, customerId, bookingId, amount, status, releaseDate', desc: 'تجميد مبالغ العربون لحين تأكيد الحجز والتحقق من شروط الضمان.', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { id: '31', name: 'Settlement', category: 'finance', categoryLabel: 'الشؤون المالية والمحافظ', arabicName: 'التسويات والمقاصة (Settlements)', fields: 'id, providerId, totalSettled, status, bankReference, date', desc: 'سجلات التسوية المالية الدورية والمقاصة وتحويل الأرباح للبنوك.', color: 'text-slate-700 bg-slate-100 border-slate-200' },

                // 4. Services, Suppliers & Inventory (3)
                { id: '32', name: 'Service', category: 'services', categoryLabel: 'الخدمات والمخزون', arabicName: 'الخدمات المساندة (Services)', fields: 'id, serviceOrderNumber, name, price, providerId, adminApprovalStatus', desc: 'كتالوج الخدمات الإضافية المتاحة كالبوفيه والتصوير والتزيين بسريال SRV-YY.', color: 'text-indigo-700 bg-indigo-50 border-indigo-200' },
                { id: '33', name: 'InventoryItem', category: 'services', categoryLabel: 'الخدمات والمخزون', arabicName: 'عناصر المخزون (InventoryItems)', fields: 'id, name, sku, quantity, minimumQuantity, hallId', desc: 'متابعة وحصر الأثاث والديكورات والتجهيزات الفاخرة داخل القاعة.', color: 'text-stone-700 bg-stone-50 border-stone-200' },
                { id: '34', name: 'Supplier', category: 'services', categoryLabel: 'الخدمات والمخزون', arabicName: 'الموردين والمغذين (Suppliers)', fields: 'id, name, contactName, phone, email, type, address', desc: 'دليل الشركات والموردين المغذين لمستلزمات الضيافة والإضاءة والتصوير.', color: 'text-rose-700 bg-rose-50 border-rose-200' },

                // 5. Marketing & Campaigns (3)
                { id: '35', name: 'AgencyAgreement', category: 'marketing', categoryLabel: 'التسويق والإعلانات', arabicName: 'اتفاقيات الوكالات (AgencyAgreements)', fields: 'id, agencyName, commissionRate, status, notes', desc: 'توثيق شروط التعاون والعمولات للوكالات التسويقية والإعلانية.', color: 'text-blue-700 bg-blue-50 border-blue-200' },
                { id: '36', name: 'MarketingCampaign', category: 'marketing', categoryLabel: 'التسويق والإعلانات', arabicName: 'الحملات التسويقية (MarketingCampaigns)', fields: 'id, title, budget, status, channel, providerId', desc: 'تخطيط وتتبع الحملات الترويجية ومعدلات التحويل والعوائد.', color: 'text-fuchsia-700 bg-fuchsia-50 border-fuchsia-200' },
                { id: '37', name: 'CampaignExpense', category: 'marketing', categoryLabel: 'التسويق والإعلانات', arabicName: 'مصاريف الحملات (CampaignExpenses)', fields: 'id, campaignId, amount, details, date', desc: 'تسجيل الفواتير والمبالغ المسددة فعلياً لمنصات التسويق والإعلانات.', color: 'text-pink-700 bg-pink-50 border-pink-200' },

                // 6. Support, Chat & Reviews (5)
                { id: '38', name: 'Ticket', category: 'support', categoryLabel: 'الدعم والدردشة', arabicName: 'تذاكر الدعم الفني (Tickets)', fields: 'id, title, department, status, customerName, priority', desc: 'إدارة وتتبع تذاكر الدعم والشكاوى التقنية لعملاء وشركاء المنصة.', color: 'text-cyan-700 bg-cyan-50 border-cyan-200' },
                { id: '39', name: 'TicketMessage', category: 'support', categoryLabel: 'الدعم والدردشة', arabicName: 'مراسلات الدعم الفني (TicketMessages)', fields: 'id, ticketId, sender, message, createdAt', desc: 'أرشيف المراسلات والردود المتبادلة في تذاكر الدعم الفني.', color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
                { id: '40', name: 'Review', category: 'support', categoryLabel: 'الدعم والدردشة', arabicName: 'تقييمات العملاء (Reviews)', fields: 'id, targetType, targetId, rating, comment, customerName', desc: 'تجميع ومراجعة آراء العملاء على القاعات والخدمات بعد الفعاليات.', color: 'text-amber-700 bg-amber-50 border-amber-200' },
                { id: '41', name: 'ServiceChat', category: 'support', categoryLabel: 'الدعم والدردشة', arabicName: 'غرف المحادثات (ServiceChats)', fields: 'id, bookingId, customerId, customerName, status', desc: 'قنوات غرف التنسيق المباشر بين العميل ومزود القاعة أو الخدمة.', color: 'text-teal-700 bg-teal-50 border-teal-200' },
                { id: '42', name: 'ServiceChatMessage', category: 'support', categoryLabel: 'الدعم والدردشة', arabicName: 'رسائل المحادثات المباشرة (ServiceChatMessages)', fields: 'id, serviceChatId, senderId, senderRole, message, timestamp', desc: 'حفظ الرسائل الفورية والمستندات المتبادلة عبر شات التنسيق.', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },

                // 7. Subscriptions & Overrides (3)
                { id: '43', name: 'SubscriptionPlan', category: 'subscriptions', categoryLabel: 'باقات الاشتراكات', arabicName: 'باقات الاشتراك (SubscriptionPlans)', fields: 'id, name, price, description, features, isHidden', desc: 'تفاصيل باقات اشتراكات منصة ليلة لشركاء ومزودي الخدمات.', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
                { id: '44', name: 'ProviderSubscription', category: 'subscriptions', categoryLabel: 'باقات الاشتراكات', arabicName: 'اشتراكات المزودين (ProviderSubscriptions)', fields: 'id, providerId, planName, pricePaid, status, startDate, endDate', desc: 'متابعة الاشتراكات النشطة وتواريخ تجديدها وحالة سداد الرسومات.', color: 'text-violet-700 bg-violet-50 border-violet-200' },
                { id: '45', name: 'ProviderFeatureOverride', category: 'subscriptions', categoryLabel: 'باقات الاشتراكات', arabicName: 'استثناءات المزودين (ProviderFeatureOverrides)', fields: 'id, providerId, featureKey, overrideType, value, expiresAt', desc: 'منح صلاحيات أو ترفيع حدود برمجية خاصة للشريك خارج الباقة.', color: 'text-rose-700 bg-rose-50 border-rose-200' }
              ]
              .filter(tbl => {
                const matchesCat = schemaCategoryFilter === 'all' || tbl.category === schemaCategoryFilter;
                const q = schemaSearchQuery.trim().toLowerCase();
                const matchesSearch = !q || 
                  tbl.name.toLowerCase().includes(q) || 
                  tbl.arabicName.toLowerCase().includes(q) || 
                  tbl.fields.toLowerCase().includes(q) || 
                  tbl.desc.toLowerCase().includes(q) ||
                  tbl.categoryLabel.toLowerCase().includes(q);
                return matchesCat && matchesSearch;
              })
              .map((tbl) => {
                const auditMatch = integrityResults.find((r: any) => 
                  r.model?.toLowerCase() === tbl.name.toLowerCase() || 
                  r.table?.toLowerCase() === tbl.name.toLowerCase()
                );

                return (
                  <div key={tbl.id} className="bg-slate-50/60 p-4.5 rounded-xl border border-slate-150/60 hover:border-amber-400 hover:bg-white hover:shadow-md transition-all duration-300 flex flex-col justify-between group text-right">
                    <div>
                      {/* رأس كرت الجدول */}
                      <div className="flex items-center gap-2 justify-between mb-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-mono font-extrabold text-slate-800 bg-slate-200/80 px-2 py-0.5 rounded break-all border border-slate-200">{tbl.name}</span>
                          <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">#{tbl.id}</span>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 border rounded-full ${tbl.color}`}>{tbl.arabicName}</span>
                      </div>

                      {/* شارة حزمة الجدول وحالة التدقيق الحية */}
                      <div className="flex items-center justify-between gap-1 mb-2.5">
                        <span className="text-[9px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200">
                          {tbl.categoryLabel}
                        </span>

                        {auditMatch ? (
                          <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full border flex items-center gap-1 ${
                            auditMatch.status === 'ok' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            auditMatch.status === 'repaired' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-rose-50 text-rose-700 border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              auditMatch.status === 'ok' ? 'bg-emerald-500' : auditMatch.status === 'repaired' ? 'bg-amber-500' : 'bg-rose-500'
                            }`}></span>
                            {auditMatch.status === 'ok' ? 'مطابق 100%' : auditMatch.status === 'repaired' ? 'تمت المزامنة' : 'مفقود'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-semibold text-emerald-700 bg-emerald-50/80 px-2 py-0.5 rounded-full border border-emerald-100">
                            جاهز ومطابق
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 leading-relaxed mb-3">{tbl.desc}</p>
                    </div>

                    <div className="border-t border-slate-100 pt-2 mt-auto">
                      <span className="block text-[9px] text-slate-400 font-bold mb-1">الحقول الرئيسية (Fields Schema):</span>
                      <div className="bg-slate-900 text-slate-300 p-2 rounded text-[10px] font-mono text-left select-all overflow-x-auto truncate" dir="ltr">
                        {tbl.fields}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
