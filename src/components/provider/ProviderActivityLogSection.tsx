import React, { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { 
  Clock, Search, Filter, ShieldCheck, AlertCircle, Calendar, 
  User, RefreshCw, FileText, CheckCircle2, XCircle, Settings, ClipboardList
} from 'lucide-react';

interface LogEntry {
  id: string;
  providerName: string;
  userName: string;
  actionType: string;
  details: string;
  date: string;
}

interface ProviderActivityLogSectionProps {
  currentProviderName: string;
  currentUserName: string;
  providerActivityLogs: LogEntry[];
  setProviderActivityLogs: React.Dispatch<React.SetStateAction<LogEntry[]>>;
}

export function ProviderActivityLogSection({
  currentProviderName,
  currentUserName,
  providerActivityLogs = [],
  setProviderActivityLogs
}: ProviderActivityLogSectionProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  // Strict Data Isolation: filter logs belonging ONLY to this provider
  const myLogs = useMemo(() => {
    return providerActivityLogs.filter(log => log.providerName === currentProviderName);
  }, [providerActivityLogs, currentProviderName]);

  // Search and filter logs
  const filteredLogs = useMemo(() => {
    return myLogs.filter(log => {
      const matchesSearch = 
        log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        log.actionType.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesAction = actionFilter === 'all' || log.actionType === actionFilter;

      return matchesSearch && matchesAction;
    });
  }, [myLogs, searchQuery, actionFilter]);

  // Unique actions for filtering dropdown
  const uniqueActionTypes = useMemo(() => {
    const actions = myLogs.map(log => log.actionType);
    return Array.from(new Set(actions));
  }, [myLogs]);

  const clearLogs = () => {
    if (window.confirm('هل أنت متأكد من رغبتك في مسح سجل النشاط الخاص بك؟ لا يمكن التراجع عن هذا الإجراء.')) {
      setProviderActivityLogs(prev => prev.filter(log => log.providerName !== currentProviderName));
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'تأكيد حجز':
      case 'قبول طلب خدمة':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'رفض حجز':
      case 'رفض طلب خدمة':
        return <XCircle className="w-5 h-5 text-rose-500 shrink-0" />;
      case 'إضافة قاعة جديدة':
      case 'إضافة خدمة جديدة':
        return <ClipboardList className="w-5 h-5 text-blue-500 shrink-0" />;
      case 'تعديل قاعة':
      case 'تعديل خدمة مساندة':
        return <Settings className="w-5 h-5 text-amber-500 shrink-0" />;
      default:
        return <Clock className="w-5 h-5 text-indigo-500 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 font-sans" dir="rtl">
      {/* Header section */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="text-right">
          <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Clock className="w-6 h-6 text-indigo-500 animate-pulse" />
            سجل النشاط والعمليات (Activity Log)
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">
            مراقبة وتتبع أهم العمليات والتغييرات التي تمت بواسطة طاقم عمل مؤسسة <span className="font-bold text-indigo-600 dark:text-indigo-400">({currentProviderName})</span> لتعزيز الشفافية والرقابة الذاتية.
          </p>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={clearLogs}
            className="px-4 py-2 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            مسح السجل
          </button>
        </div>
      </div>

      {/* Filter and Search controls */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <input
            type="text"
            placeholder="البحث في تفاصيل العمليات..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-3 pr-10 py-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-semibold outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-200"
          />
          <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <span className="text-slate-400 dark:text-slate-500 text-xs flex items-center gap-1 shrink-0">
            <Filter className="w-3.5 h-3.5" /> تصفية العمليات:
          </span>
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="p-1.5 px-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-800 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-indigo-500 text-slate-700 dark:text-slate-300"
          >
            <option value="all">كل العمليات</option>
            {uniqueActionTypes.map(action => (
              <option key={action} value={action}>{action}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Logs List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-16 text-center space-y-4">
            <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-400 dark:text-slate-500">
              <FileText className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <p className="text-slate-700 dark:text-slate-300 font-bold text-sm">لا توجد عمليات مسجلة</p>
              <p className="text-slate-400 dark:text-slate-500 text-xs">لم يتم العثور على أي نشاطات مسجلة تطابق معايير البحث الحالية.</p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-50 dark:divide-slate-800/50">
            {filteredLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all flex items-start gap-4"
              >
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/80 rounded-xl shrink-0">
                  {getActionIcon(log.actionType)}
                </div>

                <div className="space-y-2 text-right flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {log.actionType}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(log.date).toLocaleString('ar-EG', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                        second: 'numeric',
                        hour12: true
                      })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-medium">
                    {log.details}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] text-slate-400 dark:text-slate-500 font-semibold bg-slate-50 dark:bg-slate-850 w-fit px-2 py-0.5 rounded-lg">
                    <User className="w-3 h-3 text-slate-400" />
                    <span>المستخدم: {log.userName}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Informative footer */}
      <div className="bg-slate-50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex items-start gap-3 text-right">
        <ShieldCheck className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
        <div className="space-y-0.5">
          <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300">سجل عمليات آمن ومشفر</h4>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 leading-relaxed">
            يتم تسجيل وتتبع هذه العمليات بشكل آلي لأغراض التدقيق الداخلي ولا يمكن تعديل أو تزييف أي حقل مسجل، مما يعزز موثوقية إدارة ومتابعة الصلاحيات داخل المنصة.
          </p>
        </div>
      </div>
    </div>
  );
}
