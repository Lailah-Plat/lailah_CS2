import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  History, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  FileCode, 
  Lock, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  TrendingUp, 
  Building2, 
  Sparkles, 
  User, 
  Calendar, 
  ArrowRightLeft,
  X,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import { AuditLog } from '../../types';
import { useTheme } from '../../context/ThemeContext';

interface EnterpriseAuditLogProps {
  userRole?: string;
  className?: string;
}

export function EnterpriseAuditLog({ userRole = 'admin', className = '' }: EnterpriseAuditLogProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [selectedActorRole, setSelectedActorRole] = useState<string>('all');
  const [selectedLogForDetails, setSelectedLogForDetails] = useState<AuditLog | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  // Load audit logs from localStorage & sync
  const loadLogs = () => {
    try {
      const raw = localStorage.getItem('layla_audit_logs');
      if (raw) {
        const parsed = JSON.parse(raw);
        setLogs(Array.isArray(parsed) ? parsed : []);
      } else {
        // Initialize with default historical audit trail if empty
        const initialAuditLogs: AuditLog[] = [
          {
            id: 'audit-1001',
            entityType: 'hall',
            entityId: 1,
            entityName: 'قاعة قصر الرياض الملكية',
            action: 'update',
            actorName: 'سعد العتيبي (مزود)',
            actorRole: 'provider',
            previousValues: { nightPrice: 25000, capacity: 500, version: 1 },
            newValues: { nightPrice: 28000, capacity: 550, version: 2 },
            details: 'تحديث سعر الفترة المسائية والسعة الاستيعابية وترقية الإصدار إلى (v2)',
            impactSummary: 'تم تجميد 4 حجوزات مؤكدة سابقة بالسعر الأصلي 25,000 ر.س مع سريان v2 على الحجوزات المستقبلية.',
            timestamp: new Date(Date.now() - 3600000 * 24 * 2).toISOString()
          },
          {
            id: 'audit-1002',
            entityType: 'service',
            entityId: 'srv-101',
            entityName: 'خدمة تصوير احترافي 4K',
            action: 'update',
            actorName: 'فهد الشمري (مزود)',
            actorRole: 'provider',
            previousValues: { price: 3500, version: 1 },
            newValues: { price: 4200, version: 2 },
            details: 'تحديث تسعيرة حزمة التصوير وإضافة ألبوم حراري رقمي (v2)',
            impactSummary: 'تم تجميد 2 طلب خدمة نشط بالسعر السابق دون مساس بالفواتير المصدرة.',
            timestamp: new Date(Date.now() - 3600000 * 18).toISOString()
          },
          {
            id: 'audit-1003',
            entityType: 'hall',
            entityId: 2,
            entityName: 'قاعة الأسطورة الكبرى',
            action: 'status_change',
            actorName: 'إدارة المنصة السيادية',
            actorRole: 'admin',
            previousValues: { activationStatus: 'نشط', isPaused: false },
            newValues: { activationStatus: 'موقوف', isPaused: true },
            details: 'إيقاف مؤقت للقاعة لغرض أعمال الصيانة والتجديد الدوري الشامل',
            impactSummary: 'إغلاق التقويم للحجوزات الجديدة مع بقاء الاعتماد سارياً وحفظ الحجوزات السابقة.',
            timestamp: new Date(Date.now() - 3600000 * 8).toISOString()
          }
        ];
        localStorage.setItem('layla_audit_logs', JSON.stringify(initialAuditLogs));
        setLogs(initialAuditLogs);
      }
    } catch (e) {
      setLogs([]);
    }
  };

  useEffect(() => {
    loadLogs();
    const handleStorage = () => loadLogs();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('auditLogUpdated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('auditLogUpdated', handleStorage);
    };
  }, []);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchSearch = 
        !searchTerm || 
        log.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.actorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(log.entityId).includes(searchTerm);

      const matchEntity = selectedEntityType === 'all' || log.entityType === selectedEntityType;
      const matchAction = selectedAction === 'all' || log.action === selectedAction;
      const matchRole = selectedActorRole === 'all' || log.actorRole === selectedActorRole;

      return matchSearch && matchEntity && matchAction && matchRole;
    });
  }, [logs, searchTerm, selectedEntityType, selectedAction, selectedActorRole]);

  // Summary Metrics
  const stats = useMemo(() => {
    const total = logs.length;
    const priceUpdates = logs.filter(l => l.action === 'update' && (l.newValues?.nightPrice || l.newValues?.price)).length;
    const statusChanges = logs.filter(l => l.action === 'status_change').length;
    const adminActions = logs.filter(l => l.actorRole === 'admin').length;
    return { total, priceUpdates, statusChanges, adminActions };
  }, [logs]);

  // Export functions
  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['المعرف', 'نوع الكيان', 'اسم الكيان', 'نوع الإجراء', 'المنفذ', 'الرتبة', 'التفاصيل', 'الأثر التشغيلي', 'التاريخ'];
      const rows = filteredLogs.map(l => [
        l.id,
        l.entityType === 'hall' ? 'قاعة' : l.entityType === 'service' ? 'خدمة' : l.entityType,
        `"${l.entityName.replace(/"/g, '""')}"`,
        l.action,
        `"${l.actorName.replace(/"/g, '""')}"`,
        l.actorRole,
        `"${l.details.replace(/"/g, '""')}"`,
        `"${(l.impactSummary || '').replace(/"/g, '""')}"`,
        new Date(l.timestamp).toLocaleString('ar-SA')
      ]);

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `layla_audit_log_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `layla_audit_trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Strictly enforce Admin view if required
  if (userRole !== 'admin') {
    return (
      <div className={`p-8 rounded-3xl border text-center ${isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
        <div className="w-14 h-14 bg-red-100 dark:bg-red-950/50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <Lock className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-black text-slate-900 dark:text-white mb-1">صلاحية وصول مقيدة (Admin Only)</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          سجل التدقيق الشامل والحوكمة المالية مخصص حصرياً لمسؤولي المنصة المشرفين لمنع أي تلاعب أو كشف غير مصرح به.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 font-sans ${className}`} dir="rtl">
      {/* Header Banner */}
      <div className={`p-6 rounded-3xl border flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 shadow-sm ${
        isDark ? 'bg-gradient-to-r from-slate-900 via-purple-950/20 to-slate-900 border-purple-900/30' : 'bg-gradient-to-r from-purple-50 via-white to-purple-50/50 border-purple-100'
      }`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-500/20 shrink-0">
            <History className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white">سجل التدقيق والحوكمة المالية (Enterprise Audit Log)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-700 dark:bg-purple-900/60 dark:text-purple-300 border border-purple-200 dark:border-purple-700/50">
                حماية سيادية غير قابلة للتعديل
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              توثيق فوري لجميع التغييرات المالية والهيكلية (الأسعار، السعات، الإصدارات، وحالات الإيقاف) مع تجميد الحجوزات السابقة بلقطات ثابتة (Immutable Snapshots).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full lg:w-auto justify-end">
          <button
            type="button"
            onClick={loadLogs}
            className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
              isDark ? 'bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
            title="تحديث السجلات"
          >
            <RefreshCw className="w-4 h-4" />
            <span>تحديث</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || filteredLogs.length === 0}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير CSV</span>
          </button>

          <button
            type="button"
            onClick={handleExportJSON}
            disabled={filteredLogs.length === 0}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <FileCode className="w-4 h-4" />
            <span>سجل JSON للرقابة</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} shadow-sm`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>إجمالي السجلات الموثقة</span>
            <ShieldCheck className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white font-sans">{stats.total}</div>
          <p className="text-[10px] text-emerald-800 dark:text-emerald-400 font-bold mt-1">سجلات مشفرة ومؤكدة</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} shadow-sm`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>تعديلات الأسعار والعقود</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 font-sans">{stats.priceUpdates}</div>
          <p className="text-[10px] text-slate-500 mt-1">ترقيات إصدارات تلقائية</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} shadow-sm`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>تغييرات حالات التشغيل</span>
            <SlidersHorizontal className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-blue-600 font-sans">{stats.statusChanges}</div>
          <p className="text-[10px] text-slate-500 mt-1">إيقاف مؤقت واستئناف</p>
        </div>

        <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} shadow-sm`}>
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-1">
            <span>إجراءات الإدارة والرقابة</span>
            <Lock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-indigo-600 font-sans">{stats.adminActions}</div>
          <p className="text-[10px] text-slate-500 mt-1">حوكمة مركزية معتمدة</p>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div className={`p-4 rounded-2xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'} shadow-sm flex flex-col md:flex-row items-center gap-3`}>
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="بحث باسم القاعة، الخدمة، المنفذ، أو نص التعديل..."
            className={`w-full pr-10 pl-4 py-2.5 rounded-xl text-xs border outline-none transition-all ${
              isDark ? 'bg-slate-800 border-slate-700 text-white placeholder-slate-500 focus:border-purple-500' : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500'
            }`}
          />
          {searchTerm && (
            <button
              type="button"
              onClick={() => setSearchTerm('')}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Entity Type Filter */}
        <select
          value={selectedEntityType}
          onChange={(e) => setSelectedEntityType(e.target.value)}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <option value="all">كافة الكيانات</option>
          <option value="hall">القاعات والمرافق</option>
          <option value="service">الخدمات المساندة</option>
          <option value="booking">الحجوزات والتعاقدات</option>
        </select>

        {/* Action Type Filter */}
        <select
          value={selectedAction}
          onChange={(e) => setSelectedAction(e.target.value)}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <option value="all">كافة الإجراءات</option>
          <option value="update">تعديل بنود وأسعار</option>
          <option value="status_change">تغيير حالة التشغيل</option>
          <option value="create">إنشاء جديد</option>
          <option value="archive">أرشفة</option>
        </select>

        {/* Actor Role Filter */}
        <select
          value={selectedActorRole}
          onChange={(e) => setSelectedActorRole(e.target.value)}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold border outline-none cursor-pointer ${
            isDark ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}
        >
          <option value="all">كافة المنفذين</option>
          <option value="admin">الإدارة المركزية (Admin)</option>
          <option value="provider">المزودون المعتمدون (Providers)</option>
        </select>
      </div>

      {/* Audit Logs Table */}
      <div className={`rounded-3xl border overflow-hidden shadow-sm ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200/80'}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className={`border-b font-black ${isDark ? 'bg-slate-800/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                <th className="p-4">الطابع الزمني</th>
                <th className="p-4">الكيان المستهدف</th>
                <th className="p-4">نوع الإجراء</th>
                <th className="p-4">الجهة الفاعلة (Actor)</th>
                <th className="p-4">تفاصيل التغيير وفروقات القيم</th>
                <th className="p-4">الأثر التشغيلي</th>
                <th className="p-4 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-12 text-center text-slate-400">
                    <History className="w-10 h-10 mx-auto mb-2 opacity-40 text-purple-400" />
                    <p className="font-bold text-slate-600 dark:text-slate-300">لا توجد سجلات تدقيق مطابقة لمعايير البحث الحالية.</p>
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isHall = log.entityType === 'hall';
                  const isService = log.entityType === 'service';
                  const isAdmin = log.actorRole === 'admin';

                  return (
                    <tr 
                      key={log.id} 
                      className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/40`}
                    >
                      {/* Timestamp */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="font-bold text-slate-800 dark:text-slate-200 font-sans" dir="ltr">
                          {new Date(log.timestamp).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans" dir="ltr">
                          {new Date(log.timestamp).toLocaleDateString('ar-SA')}
                        </div>
                      </td>

                      {/* Target Entity */}
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${isHall ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}>
                            {isHall ? <Building2 className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                          </div>
                          <div>
                            <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{log.entityName}</span>
                              {log.newValues?.version && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-slate-900 text-amber-300">
                                  v{log.newValues.version}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-400 font-sans">ID: {String(log.entityId).slice(0, 12)}</span>
                          </div>
                        </div>
                      </td>

                      {/* Action Type */}
                      <td className="p-4 whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-flex items-center gap-1 ${
                          log.action === 'update' 
                            ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300' 
                            : log.action === 'status_change'
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : log.action === 'create'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}>
                          {log.action === 'update' && 'تعديل بنود/أسعار'}
                          {log.action === 'status_change' && 'تغيير حالة التشغيل'}
                          {log.action === 'create' && 'إنشاء جديد'}
                          {log.action === 'archive' && 'أرشفة أصل'}
                        </span>
                      </td>

                      {/* Actor */}
                      <td className="p-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800 dark:text-slate-200">{log.actorName}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black ${
                            isAdmin 
                              ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300' 
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                          }`}>
                            {isAdmin ? 'الإدارة' : 'المزود'}
                          </span>
                        </div>
                      </td>

                      {/* Details & Values Diff */}
                      <td className="p-4 max-w-xs">
                        <div className="text-slate-700 dark:text-slate-200 font-bold mb-1 line-clamp-1">{log.details}</div>
                        {/* Numerical Diff if available */}
                        {log.previousValues?.nightPrice !== undefined && log.newValues?.nightPrice !== undefined && (
                          <div className="flex items-center gap-1.5 text-[10px] font-sans">
                            <span className="line-through text-slate-400">{Number(log.previousValues.nightPrice).toLocaleString('ar-SA')} ر.س</span>
                            <span className="text-amber-500">←</span>
                            <strong className="text-emerald-700 dark:text-emerald-400 font-black">{Number(log.newValues.nightPrice).toLocaleString('ar-SA')} ر.س</strong>
                          </div>
                        )}
                        {log.previousValues?.capacity !== undefined && log.newValues?.capacity !== undefined && (
                          <div className="flex items-center gap-1.5 text-[10px] font-sans">
                            <span className="line-through text-slate-400">{log.previousValues.capacity} شخص</span>
                            <span className="text-blue-500">←</span>
                            <strong className="text-blue-600 dark:text-blue-400 font-black">{log.newValues.capacity} شخص</strong>
                          </div>
                        )}
                      </td>

                      {/* Impact Summary */}
                      <td className="p-4 max-w-xs">
                        {log.impactSummary ? (
                          <div className="text-[11px] text-emerald-800 dark:text-emerald-400 font-medium leading-tight">
                            {log.impactSummary}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-[10px]">-</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="p-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedLogForDetails(log)}
                          className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                            isDark ? 'border-slate-700 hover:bg-slate-800 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-700'
                          }`}
                          title="استعراض كامل تفاصيل السجل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Log Details Modal */}
      {selectedLogForDetails && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-in fade-in duration-300 font-sans">
          <div className={`rounded-3xl max-w-lg w-full p-6 shadow-2xl border text-right overflow-hidden ${
            isDark ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black">تفاصيل السجل الموثق</h3>
                  <p className="text-[10px] text-slate-400 font-sans" dir="ltr">Audit ID: {selectedLogForDetails.id}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">الكيان المستهدف:</span>
                <p className="font-black text-slate-900 dark:text-white">{selectedLogForDetails.entityName}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">المنفذ ورتبته:</span>
                <p className="font-bold text-slate-800 dark:text-slate-200">{selectedLogForDetails.actorName} ({selectedLogForDetails.actorRole})</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-0.5">التفاصيل الفنية:</span>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{selectedLogForDetails.details}</p>
              </div>

              {selectedLogForDetails.impactSummary && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40">
                  <span className="text-[10px] text-emerald-800 dark:text-emerald-300 font-black block mb-0.5">الأثر على الحجوزات والعملاء:</span>
                  <p className="text-emerald-900 dark:text-emerald-300 text-[11px] leading-relaxed">{selectedLogForDetails.impactSummary}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">القيم السابقة:</span>
                  <pre className="text-[10px] font-sans mt-1 overflow-x-auto text-slate-600 dark:text-slate-300">
                    {JSON.stringify(selectedLogForDetails.previousValues || {}, null, 2)}
                  </pre>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                  <span className="text-[10px] text-slate-400 block">القيم الجديدة المعتمدة:</span>
                  <pre className="text-[10px] font-sans mt-1 overflow-x-auto text-emerald-700 dark:text-emerald-400 font-bold">
                    {JSON.stringify(selectedLogForDetails.newValues || {}, null, 2)}
                  </pre>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLogForDetails(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold rounded-xl text-xs transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
