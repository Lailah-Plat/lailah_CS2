import React, { useState, useMemo } from 'react';
import { 
  Flame, 
  AlertTriangle, 
  UserX, 
  UserCheck, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  Calendar, 
  CreditCard, 
  Scale, 
  TrendingUp, 
  List, 
  Kanban, 
  History, 
  Users, 
  Search, 
  Filter, 
  ArrowUpRight, 
  X, 
  ChevronRight, 
  Play, 
  ShieldAlert, 
  ExternalLink,
  ChevronDown,
  Timer,
  FileCheck,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { 
  OperationalCase, 
  OperationalPulseCounts, 
  ExceptionsViewMode, 
  PRIORITY_LABELS, 
  STATUS_LABELS, 
  CASE_TYPE_LABELS,
  OPERATIONAL_TEAMS,
  OpsTheme
} from './types';

interface ExceptionsCenterViewProps {
  cases: OperationalCase[];
  counts: OperationalPulseCounts | null;
  activeFilter: string | null;
  onSelectFilter: (filter: string | null) => void;
  onOpenInWorkspace: (caseId: string) => void;
  onExecuteCommand: (commandId: string, caseId: string, payload?: any) => void;
  theme?: OpsTheme;
}

export const ExceptionsCenterView: React.FC<ExceptionsCenterViewProps> = ({
  cases,
  counts,
  activeFilter,
  onSelectFilter,
  onOpenInWorkspace,
  onExecuteCommand,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  const [viewMode, setViewMode] = useState<ExceptionsViewMode>('smart-list');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [quickChipFilter, setQuickChipFilter] = useState<'ALL' | 'CRITICAL' | 'OVERDUE' | 'UNDER_1H' | 'APPROVALS' | 'UNASSIGNED'>('ALL');

  const selectedCase = useMemo(() => {
    return cases.find(c => c.caseId === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Helper for SLA Remaining time calculation
  const getSlaRemainingFormatted = (c: OperationalCase) => {
    if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
      return { text: 'مكتملة', color: 'text-emerald-400', isOverdue: false, remainingMins: 99999 };
    }
    if (c.isSlaPaused) {
      return { text: 'مهلة معلقة', color: 'text-amber-400', isOverdue: false, remainingMins: 99999 };
    }
    const dueTime = new Date(c.dueAt).getTime();
    const diff = dueTime - Date.now();
    const remainingMins = Math.round(diff / (1000 * 60));
    if (diff < 0) {
      const overdueMins = Math.abs(remainingMins);
      const hrs = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      return {
        text: `متأخرة بـ ${hrs > 0 ? `${hrs} س و ` : ''}${mins} د`,
        color: 'text-rose-400 font-black',
        isOverdue: true,
        remainingMins
      };
    }
    const hrs = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    return {
      text: `متبقي ${hrs > 0 ? `${hrs} س و ` : ''}${mins} د`,
      color: hrs < 1 ? 'text-rose-400 font-bold' : hrs < 4 ? 'text-amber-400 font-semibold' : 'text-slate-300',
      isOverdue: false,
      remainingMins
    };
  };

  // Filter cases locally by search, status, and quick chip filter
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      // Status Filter
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;

      // Quick Chips Filter
      if (quickChipFilter === 'CRITICAL' && c.priority !== 'CRITICAL') return false;
      if (quickChipFilter === 'OVERDUE') {
        const isOverdue = !c.isSlaPaused && new Date(c.dueAt).getTime() < Date.now();
        if (!isOverdue) return false;
      }
      if (quickChipFilter === 'UNDER_1H') {
        const sla = getSlaRemainingFormatted(c);
        if (sla.isOverdue || sla.remainingMins > 60) return false;
      }
      if (quickChipFilter === 'APPROVALS' && c.caseType !== 'HALL_APPROVAL') return false;
      if (quickChipFilter === 'UNASSIGNED' && Boolean(c.assignedUserId)) return false;

      // Search Query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return (
        c.caseId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        (c.assignedUserName && c.assignedUserName.toLowerCase().includes(q)) ||
        (c.sourceEntityId && c.sourceEntityId.includes(q))
      );
    });
  }, [cases, searchQuery, statusFilter, quickChipFilter]);

  // Status Chips definition
  const statusChips = [
    { id: 'ALL', label: 'الكل', count: cases.length },
    { id: 'CRITICAL', label: 'حالات حرجة', count: cases.filter(c => c.priority === 'CRITICAL').length },
    { id: 'OVERDUE', label: 'تجاوزت المهلة', count: cases.filter(c => !c.isSlaPaused && new Date(c.dueAt).getTime() < Date.now()).length },
    { id: 'UNDER_1H', label: 'أقل من ساعة', count: cases.filter(c => {
      const diff = new Date(c.dueAt).getTime() - Date.now();
      return diff > 0 && diff < 3600000;
    }).length },
    { id: 'APPROVALS', label: 'بانتظار الاعتماد', count: cases.filter(c => c.caseType === 'HALL_APPROVAL').length },
    { id: 'UNASSIGNED', label: 'غير مسندة', count: cases.filter(c => !c.assignedUserId).length },
  ];

  return (
    <div className="flex-1 flex flex-col gap-4" dir="rtl">
      
      {/* SECTION 3.1: Interactive Status Chips Bar */}
      <div className={`p-3 rounded-2xl border transition-colors flex flex-wrap items-center justify-between gap-2.5 ${
        isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-2xs'
      }`}>
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
          <span className="text-xs font-bold text-slate-400 pl-2 shrink-0">
            تصفية سريعة:
          </span>
          {statusChips.map(chip => {
            const isActive = quickChipFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setQuickChipFilter(chip.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 border ${
                  isActive
                    ? isDark
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black shadow-xs'
                      : 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : isDark
                      ? 'bg-slate-950/60 text-slate-300 border-slate-800 hover:bg-slate-800'
                      : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <span>{chip.label}</span>
                <span className={`font-mono text-[10px] px-1.5 py-0.2 rounded-full font-extrabold ${
                  isActive 
                    ? isDark ? 'bg-slate-950/20 text-slate-950' : 'bg-white/20 text-white'
                    : isDark ? 'bg-slate-800 text-slate-400' : 'bg-white text-slate-600'
                }`}>
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Total Filtered Count */}
        <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5">
          <span>المعروض:</span>
          <strong className={isDark ? 'text-white' : 'text-slate-900'}>{filteredCases.length}</strong>
          <span>حالة</span>
        </div>
      </div>

      {/* SECTION 3.2: Controls & View Switcher */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Quick Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className={`w-full rounded-xl pr-9 pl-4 py-2 text-xs md:text-sm border focus:outline-none transition-colors ${
                isDark 
                  ? 'bg-slate-900/90 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-amber-400' 
                  : 'bg-white border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 shadow-2xs'
              }`}
              placeholder="تصفية بالرقم OPS- أو BKG-26 أو العنوان..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Quick Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`rounded-xl px-3 py-2 text-xs font-bold border focus:outline-none ${
              isDark 
                ? 'bg-slate-900 border-slate-800 text-slate-300' 
                : 'bg-white border-slate-200 text-slate-700 shadow-2xs'
            }`}
          >
            <option value="ALL">كافة الحالات</option>
            <option value="NEW">جديدة</option>
            <option value="IN_PROGRESS">قيد المعالجة</option>
            <option value="WAITING_EXTERNAL">بانتظار خارجي</option>
            <option value="ESCALATED">مصعّدة</option>
            <option value="RESOLVED">محلولة</option>
            <option value="CLOSED">مغلقة</option>
          </select>
        </div>

        {/* 4 Switchable View Layouts */}
        <div className={`flex items-center p-1 rounded-xl border shrink-0 self-start sm:self-auto ${
          isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setViewMode('smart-list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'smart-list'
                ? isDark ? 'bg-slate-800 text-white shadow-xs font-black' : 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>القائمة الذكية</span>
          </button>

          <button
            onClick={() => setViewMode('stage-board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'stage-board'
                ? isDark ? 'bg-slate-800 text-white shadow-xs font-black' : 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>لوحة المراحل</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'timeline'
                ? isDark ? 'bg-slate-800 text-white shadow-xs font-black' : 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>الخط الزمني</span>
          </button>

          <button
            onClick={() => setViewMode('team-distribution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'team-distribution'
                ? isDark ? 'bg-slate-800 text-white shadow-xs font-black' : 'bg-white text-slate-900 shadow-xs font-black'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>توزيع الفرق</span>
          </button>
        </div>
      </div>

      {/* Main Content Area & Slide-Over Drawer */}
      <div className="flex-1 flex gap-4 overflow-hidden">
        
        {/* Left Side (or Main Column in RTL): Views */}
        <div className={`flex-1 transition-all ${selectedCase ? 'lg:w-2/3' : 'w-full'}`}>
          
          {/* 1. Smart List View */}
          {viewMode === 'smart-list' && (
            <div className={`rounded-2xl border overflow-hidden transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className={`border-b text-xs font-bold uppercase ${
                      isDark ? 'bg-slate-950/60 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                    }`}>
                      <th className="py-3 px-4">رقم الحالة والنوع</th>
                      <th className="py-3 px-4">عنوان الاستثناء والكيان</th>
                      <th className="py-3 px-4">الأولوية</th>
                      <th className="py-3 px-4">الحالة</th>
                      <th className="py-3 px-4">المسؤول</th>
                      <th className="py-3 px-4">مهلة الاستجابة (SLA)</th>
                      <th className="py-3 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y text-xs ${isDark ? 'divide-slate-800' : 'divide-slate-100'}`}>
                    {filteredCases.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400">
                          لا توجد حالات استثنائية مطابقة للشروط المحددة حالياً.
                        </td>
                      </tr>
                    ) : (
                      filteredCases.map(c => {
                        const priorityInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;
                        const statusInfo = STATUS_LABELS[c.status] || STATUS_LABELS.NEW;
                        const typeInfo = CASE_TYPE_LABELS[c.caseType] || { label: c.caseType, color: 'text-slate-400 bg-slate-800' };
                        const slaStatus = getSlaRemainingFormatted(c);
                        const isSelected = selectedCaseId === c.caseId;

                        return (
                          <tr
                            key={c.caseId}
                            onClick={() => setSelectedCaseId(c.caseId)}
                            className={`transition-colors cursor-pointer ${
                              isSelected 
                                ? isDark ? 'bg-emerald-950/30' : 'bg-blue-50/80' 
                                : isDark ? 'hover:bg-slate-850/60' : 'hover:bg-slate-50'
                            }`}
                          >
                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className={`font-mono font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                {c.caseId}
                              </div>
                              <span className={`inline-block text-[10px] px-2 py-0.2 mt-1 rounded-md border font-bold ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </td>

                            <td className="py-3 px-4">
                              <div className={`font-bold line-clamp-1 max-w-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                                {c.title}
                              </div>
                              <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5 font-mono">
                                {c.sourceEntityType}: #{c.sourceEntityId}
                              </div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold ${priorityInfo.badge}`}>
                                {priorityInfo.label}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusInfo.badge}`}>
                                {statusInfo.label}
                              </span>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className={isDark ? 'text-slate-200 font-semibold' : 'text-slate-800 font-semibold'}>
                                {c.assignedUserName || <span className="text-amber-400 font-bold">غير مسند</span>}
                              </div>
                              <div className="text-[10px] text-slate-400">{c.assignedTeamName || 'فريق العمليات'}</div>
                            </td>

                            <td className="py-3 px-4 whitespace-nowrap">
                              <div className={`text-xs ${slaStatus.color}`}>
                                {slaStatus.text}
                              </div>
                            </td>

                            <td className="py-3 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => onOpenInWorkspace(c.caseId)}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-xl font-bold text-xs transition-colors ${
                                  isDark 
                                    ? 'bg-slate-800 hover:bg-emerald-500 hover:text-slate-950 text-slate-200' 
                                    : 'bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700'
                                }`}
                              >
                                <span>معالجة</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
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
          )}

          {/* 2. Stage Board / Kanban View */}
          {viewMode === 'stage-board' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3.5 overflow-x-auto pb-4">
              {[
                { id: 'NEW_QUEUE', label: '1. جديدة في الطابور', statuses: ['NEW', 'TRIAGED'] },
                { id: 'IN_PROGRESS_QUEUE', label: '2. قيد الفحص والتحقيق', statuses: ['ASSIGNED', 'IN_PROGRESS'] },
                { id: 'WAITING_QUEUE', label: '3. بانتظار الرد / تصعيد', statuses: ['WAITING_EXTERNAL', 'ESCALATED'] },
                { id: 'RESOLVED_QUEUE', label: '4. محسومة ومكتملة', statuses: ['RESOLVED', 'CLOSED'] }
              ].map(lane => {
                const laneCases = filteredCases.filter(c => lane.statuses.includes(c.status));

                return (
                  <div 
                    key={lane.id} 
                    className={`rounded-2xl p-3 border flex flex-col min-w-[260px] transition-colors ${
                      isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-slate-100 border-slate-200'
                    }`}
                  >
                    <div className={`flex items-center justify-between pb-2 mb-2 border-b ${
                      isDark ? 'border-slate-800 text-slate-200' : 'border-slate-200 text-slate-800'
                    }`}>
                      <span className="text-xs font-black">{lane.label}</span>
                      <span className="text-xs font-mono font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                        {laneCases.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[620px] pr-0.5">
                      {laneCases.map(c => {
                        const priorityInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;
                        const sla = getSlaRemainingFormatted(c);
                        const isSelected = selectedCaseId === c.caseId;

                        return (
                          <div
                            key={c.caseId}
                            onClick={() => setSelectedCaseId(c.caseId)}
                            className={`p-3 rounded-xl border transition-all cursor-pointer ${
                              isSelected 
                                ? 'ring-2 ring-amber-400 border-transparent' 
                                : isDark 
                                  ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700' 
                                  : 'bg-white border-slate-200 shadow-2xs'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-300">{c.caseId}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-bold ${priorityInfo.badge}`}>
                                {priorityInfo.label}
                              </span>
                            </div>

                            <div className={`text-xs font-bold line-clamp-2 mb-2 leading-snug ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                              {c.title}
                            </div>

                            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-800/60 text-slate-400">
                              <span>{c.assignedUserName || 'غير مسند'}</span>
                              <span className={`font-semibold ${sla.color}`}>{sla.text}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Chronological Timeline */}
          {viewMode === 'timeline' && (
            <div className={`rounded-2xl p-5 border transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
            }`}>
              <div className="text-sm font-black mb-4 flex items-center gap-2 text-emerald-400">
                <History className="w-4 h-4" />
                <span>الخط الزمني للطوارئ والاستحقاقات (SLA Timeline)</span>
              </div>

              <div className="space-y-3 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                {filteredCases
                  .slice()
                  .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
                  .map(c => {
                    const sla = getSlaRemainingFormatted(c);
                    const priorityInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;

                    return (
                      <div
                        key={c.caseId}
                        onClick={() => setSelectedCaseId(c.caseId)}
                        className="relative pr-9 cursor-pointer group"
                      >
                        <div className={`absolute right-2.5 top-2 w-3.5 h-3.5 rounded-full ring-4 ring-slate-950 ${
                          sla.isOverdue ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'
                        }`} />
                        <div className={`p-3.5 rounded-xl border transition-all ${
                          isDark 
                            ? 'bg-slate-950/60 border-slate-800 group-hover:border-slate-700' 
                            : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-black text-slate-200">{c.caseId}</span>
                              <span className={`text-[10px] px-2 py-0.2 rounded border font-bold ${priorityInfo.badge}`}>
                                {priorityInfo.label}
                              </span>
                            </div>
                            <span className={`text-xs ${sla.color}`}>{sla.text}</span>
                          </div>
                          <div className={`text-xs font-bold ${isDark ? 'text-slate-100' : 'text-slate-800'}`}>
                            {c.title}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* 4. Team Distribution View */}
          {viewMode === 'team-distribution' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {OPERATIONAL_TEAMS.map(team => {
                const teamCases = filteredCases.filter(c => c.assignedTeamId === team.id);
                const criticalCount = teamCases.filter(c => c.priority === 'CRITICAL').length;
                const overdueCount = teamCases.filter(c => !c.isSlaPaused && new Date(c.dueAt).getTime() < Date.now()).length;

                return (
                  <div 
                    key={team.id} 
                    className={`rounded-2xl p-5 border flex flex-col justify-between transition-colors ${
                      isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-black text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>{team.name}</h3>
                        <span className="font-mono font-bold text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded-full">
                          {teamCases.length} حالة
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mb-3">مسؤول الفريق: {team.lead}</div>

                      <div className="grid grid-cols-2 gap-2 mb-3">
                        <div className="bg-rose-500/10 border border-rose-500/20 p-2 rounded-xl text-center">
                          <div className="text-base font-black text-rose-400">{criticalCount}</div>
                          <div className="text-[10px] text-rose-300 font-bold">حالات حرجة</div>
                        </div>
                        <div className="bg-amber-500/10 border border-amber-500/20 p-2 rounded-xl text-center">
                          <div className="text-base font-black text-amber-400">{overdueCount}</div>
                          <div className="text-[10px] text-amber-300 font-bold">تجاوزت المهلة</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-slate-800">
                      {teamCases.slice(0, 3).map(c => (
                        <div
                          key={c.caseId}
                          onClick={() => setSelectedCaseId(c.caseId)}
                          className={`flex items-center justify-between p-1.5 rounded-lg cursor-pointer text-xs ${
                            isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <span className="font-mono font-bold">{c.caseId}</span>
                          <span className="truncate max-w-[140px] text-[11px]">{c.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>

        {/* SECTION 3.3: Quick Slide-Over Inspection Drawer (380px) */}
        {selectedCase && (
          <aside 
            className={`w-full lg:w-96 rounded-2xl border p-4 flex flex-col shrink-0 self-start sticky top-20 animate-fade-in transition-colors ${
              isDark ? 'bg-slate-900/95 border-slate-800 shadow-xl' : 'bg-white border-slate-200 shadow-md'
            }`}
          >
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-800 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    {selectedCase.caseId}
                  </span>
                  <span className={`text-[10px] px-2 py-0.2 rounded-full border font-bold ${CASE_TYPE_LABELS[selectedCase.caseType]?.color || 'bg-slate-800'}`}>
                    {CASE_TYPE_LABELS[selectedCase.caseType]?.label || selectedCase.caseType}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  تاريخ الإنشاء: {new Date(selectedCase.createdAt).toLocaleString('ar-SA')}
                </div>
              </div>
              <button
                onClick={() => setSelectedCaseId(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="mb-3">
              <h3 className={`font-bold text-xs mb-1.5 leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {selectedCase.title}
              </h3>
              <p className={`text-[11px] leading-relaxed p-2.5 rounded-xl border ${
                isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}>
                {selectedCase.description}
              </p>
            </div>

            {/* SLA & Reasons */}
            <div className={`mb-3 p-3 rounded-xl border ${
              isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50 border-rose-200'
            }`}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-slate-300">المهلة المتبقية:</span>
                <span className={`text-xs ${getSlaRemainingFormatted(selectedCase).color}`}>
                  {getSlaRemainingFormatted(selectedCase).text}
                </span>
              </div>
              {selectedCase.priorityReasons && selectedCase.priorityReasons.length > 0 && (
                <div className="text-[11px] text-slate-400 mt-1">
                  السبب: {selectedCase.priorityReasons[0].label}
                </div>
              )}
            </div>

            {/* Compliance Badges */}
            <div className="mb-3 space-y-1.5 border-t border-slate-800 pt-2 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>شامل ضريبة القيمة المضافة 15% (VAT-Inclusive)</span>
              </div>
              <div className="flex items-center gap-1.5 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>عزل بيانات الشركاء والعملاء معتمد</span>
              </div>
            </div>

            {/* Top 2 Instant Actions */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={() => onOpenInWorkspace(selectedCase.caseId)}
                className="w-full flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 py-2.5 px-4 rounded-xl font-black text-xs shadow-md transition-all"
              >
                <span>فتح في مساحة العمل السياقية</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <div className="grid grid-cols-2 gap-2">
                {!selectedCase.assignedUserId && (
                  <button
                    onClick={() => onExecuteCommand('ASSIGN_TO_ME', selectedCase.caseId)}
                    className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-slate-200 py-2 rounded-xl text-xs font-bold transition-colors border border-slate-700"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>إسناد لي</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    const reason = window.prompt('سبب التصعيد التشغيلي للإشراف:');
                    if (reason) onExecuteCommand('ESCALATE_CASE', selectedCase.caseId, { reason });
                  }}
                  className="flex items-center justify-center gap-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 py-2 rounded-xl text-xs font-bold transition-colors border border-rose-500/30"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>تصعيد</span>
                </button>
              </div>
            </div>

          </aside>
        )}

      </div>

    </div>
  );
};
