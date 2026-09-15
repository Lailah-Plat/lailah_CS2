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
  FileCheck
} from 'lucide-react';
import { 
  OperationalCase, 
  OperationalPulseCounts, 
  ExceptionsViewMode, 
  PRIORITY_LABELS, 
  STATUS_LABELS, 
  CASE_TYPE_LABELS,
  OPERATIONAL_TEAMS
} from './types';

interface ExceptionsCenterViewProps {
  cases: OperationalCase[];
  counts: OperationalPulseCounts | null;
  activeFilter: string | null;
  onSelectFilter: (filter: string | null) => void;
  onOpenInWorkspace: (caseId: string) => void;
  onExecuteCommand: (commandId: string, caseId: string, payload?: any) => void;
}

export const ExceptionsCenterView: React.FC<ExceptionsCenterViewProps> = ({
  cases,
  counts,
  activeFilter,
  onSelectFilter,
  onOpenInWorkspace,
  onExecuteCommand
}) => {
  const [viewMode, setViewMode] = useState<ExceptionsViewMode>('smart-list');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const selectedCase = useMemo(() => {
    return cases.find(c => c.caseId === selectedCaseId) || null;
  }, [cases, selectedCaseId]);

  // Filter cases locally by search & sub-filters
  const filteredCases = useMemo(() => {
    return cases.filter(c => {
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
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
  }, [cases, searchQuery, statusFilter]);

  // Pulse Cards configuration
  const pulseCards = [
    {
      id: 'critical',
      label: 'الحالات الحرجة',
      count: counts?.critical || 0,
      icon: Flame,
      color: 'text-red-600 bg-red-50 border-red-200 hover:border-red-300',
      activeColor: 'bg-red-600 text-white ring-2 ring-red-400'
    },
    {
      id: 'high',
      label: 'عالية الأولوية',
      count: counts?.high || 0,
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50 border-orange-200 hover:border-orange-300',
      activeColor: 'bg-orange-600 text-white ring-2 ring-orange-400'
    },
    {
      id: 'unassigned',
      label: 'غير مسندة',
      count: counts?.unassigned || 0,
      icon: UserX,
      color: 'text-amber-600 bg-amber-50 border-amber-200 hover:border-amber-300',
      activeColor: 'bg-amber-600 text-white ring-2 ring-amber-400'
    },
    {
      id: 'my-cases',
      label: 'المسندة إليّ',
      count: counts?.assignedToMe || 0,
      icon: UserCheck,
      color: 'text-blue-600 bg-blue-50 border-blue-200 hover:border-blue-300',
      activeColor: 'bg-blue-600 text-white ring-2 ring-blue-400'
    },
    {
      id: 'overdue',
      label: 'تجاوزت المهلة (SLA)',
      count: counts?.overdue || 0,
      icon: Clock,
      color: 'text-rose-600 bg-rose-50 border-rose-200 hover:border-rose-300',
      activeColor: 'bg-rose-700 text-white ring-2 ring-rose-400'
    },
    {
      id: 'approaching',
      label: 'قاربت المهلة (<4س)',
      count: counts?.approachingSla || 0,
      icon: AlertCircle,
      color: 'text-yellow-700 bg-yellow-50 border-yellow-200 hover:border-yellow-300',
      activeColor: 'bg-yellow-600 text-white ring-2 ring-yellow-400'
    },
    {
      id: 'approvals',
      label: 'اعتمادات معلقة',
      count: counts?.pendingApprovals || 0,
      icon: FileCheck,
      color: 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:border-emerald-300',
      activeColor: 'bg-emerald-600 text-white ring-2 ring-emerald-400'
    },
    {
      id: 'bookings',
      label: 'حجوزات تحتاج تدخلاً',
      count: counts?.bookingsAttention || 0,
      icon: Calendar,
      color: 'text-indigo-600 bg-indigo-50 border-indigo-200 hover:border-indigo-300',
      activeColor: 'bg-indigo-600 text-white ring-2 ring-indigo-400'
    },
    {
      id: 'financial',
      label: 'حالات مالية متوقفة',
      count: counts?.financialStalled || 0,
      icon: CreditCard,
      color: 'text-purple-600 bg-purple-50 border-purple-200 hover:border-purple-300',
      activeColor: 'bg-purple-600 text-white ring-2 ring-purple-400'
    },
    {
      id: 'disputes',
      label: 'نزاعات وشكاوى',
      count: counts?.openDisputes || 0,
      icon: Scale,
      color: 'text-teal-700 bg-teal-50 border-teal-200 hover:border-teal-300',
      activeColor: 'bg-teal-600 text-white ring-2 ring-teal-400'
    },
    {
      id: 'escalations',
      label: 'تصعيدات نشطة',
      count: counts?.activeEscalations || 0,
      icon: TrendingUp,
      color: 'text-red-700 bg-red-100 border-red-300 hover:border-red-400',
      activeColor: 'bg-red-800 text-white ring-2 ring-red-500'
    }
  ];

  // Helper for SLA Remaining time calculation
  const getSlaRemainingFormatted = (c: OperationalCase) => {
    if (c.status === 'RESOLVED' || c.status === 'CLOSED') {
      return { text: 'مكتملة', color: 'text-emerald-600', isOverdue: false };
    }
    if (c.isSlaPaused) {
      return { text: 'مهلة معلقة', color: 'text-slate-500', isOverdue: false };
    }
    const dueTime = new Date(c.dueAt).getTime();
    const diff = dueTime - Date.now();
    if (diff < 0) {
      const overdueMins = Math.abs(Math.round(diff / (1000 * 60)));
      const hrs = Math.floor(overdueMins / 60);
      const mins = overdueMins % 60;
      return {
        text: `متأخرة بـ ${hrs > 0 ? `${hrs} س و ` : ''}${mins} د`,
        color: 'text-red-600 font-bold',
        isOverdue: true
      };
    }
    const remainingMins = Math.round(diff / (1000 * 60));
    const hrs = Math.floor(remainingMins / 60);
    const mins = remainingMins % 60;
    return {
      text: `متبقي ${hrs > 0 ? `${hrs} س و ` : ''}${mins} د`,
      color: hrs < 4 ? 'text-amber-600 font-semibold' : 'text-slate-600',
      isOverdue: false
    };
  };

  return (
    <div className="flex-1 flex flex-col gap-5">
      {/* 6.1 شريط النبض التشغيلي (Operational Pulse Bar) */}
      <section className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-slate-900">شريط النبض التشغيلي للحالات</h2>
            <span className="text-xs text-slate-500 font-normal">
              (انقر على أي بطاقة لتصفية الحالات فورياً)
            </span>
          </div>
          {activeFilter && (
            <button
              onClick={() => onSelectFilter(null)}
              className="flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg font-bold transition-colors"
            >
              <span>إلغاء التصفية الحالية</span>
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Pulse Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-11 gap-2.5">
          {pulseCards.map(card => {
            const Icon = card.icon;
            const isActive = activeFilter === card.id;

            return (
              <button
                key={card.id}
                onClick={() => onSelectFilter(isActive ? null : card.id)}
                className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                  isActive ? card.activeColor : `${card.color} bg-opacity-70`
                }`}
              >
                <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/60 mb-1.5 shadow-2xs">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : ''}`} />
                </div>
                <div className={`text-base font-extrabold leading-none mb-1 ${isActive ? 'text-white' : ''}`}>
                  {card.count}
                </div>
                <div className={`text-[11px] font-medium leading-tight line-clamp-1 ${isActive ? 'text-white' : 'text-slate-700'}`}>
                  {card.label}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Controls: Search, View Mode Switcher, and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search & Quick Filter */}
        <div className="flex items-center gap-2 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              className="w-full bg-white border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-xs md:text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary shadow-2xs"
              placeholder="تصفية بالرقم OPS- أو العنوان أو الموظف..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Status Quick Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 shadow-2xs focus:outline-none"
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

        {/* 6.2 مبدل المناظر (View Switcher) */}
        <div className="flex items-center bg-slate-200/80 p-1 rounded-xl border border-slate-300/60 shadow-2xs shrink-0 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('smart-list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'smart-list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>القائمة الذكية</span>
          </button>

          <button
            onClick={() => setViewMode('stage-board')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'stage-board' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>لوحة المراحل</span>
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'timeline' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>الخط الزمني</span>
          </button>

          <button
            onClick={() => setViewMode('team-distribution')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
              viewMode === 'team-distribution' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>توزيع الفرق</span>
          </button>
        </div>
      </div>

      {/* View Content Rendering */}
      <div className="flex-1 flex gap-5">
        {/* Main List / Kanban / Timeline / Teams area */}
        <div className={`flex-1 transition-all ${selectedCase ? 'lg:w-2/3' : 'w-full'}`}>
          {/* Smart List View */}
          {viewMode === 'smart-list' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 text-xs font-bold uppercase">
                      <th className="py-3.5 px-4">رقم الحالة والنوع</th>
                      <th className="py-3.5 px-4">عنوان الاستثناء والكيان</th>
                      <th className="py-3.5 px-4">الأولوية والأسباب</th>
                      <th className="py-3.5 px-4">الحالة</th>
                      <th className="py-3.5 px-4">المسؤول / الفريق</th>
                      <th className="py-3.5 px-4">مهلة الاستجابة (SLA)</th>
                      <th className="py-3.5 px-4 text-center">إجراءات</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
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
                        const typeInfo = CASE_TYPE_LABELS[c.caseType] || { label: c.caseType, color: 'text-slate-700 bg-slate-100' };
                        const slaStatus = getSlaRemainingFormatted(c);
                        const isSelected = selectedCaseId === c.caseId;

                        return (
                          <tr
                            key={c.caseId}
                            onClick={() => setSelectedCaseId(c.caseId)}
                            className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                              isSelected ? 'bg-primary/5 font-medium' : ''
                            }`}
                          >
                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="font-mono font-bold text-slate-900">{c.caseId}</div>
                              <span className={`inline-block text-[10px] px-2 py-0.5 mt-1 rounded-full border ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 line-clamp-1 max-w-xs">{c.title}</div>
                              <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                                الكيان: {c.sourceEntityType} #{c.sourceEntityId}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="flex items-center gap-1.5">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[11px] font-bold ${priorityInfo.badge}`}>
                                  {priorityInfo.label}
                                </span>
                              </div>
                              {c.priorityReasons && c.priorityReasons.length > 0 && (
                                <div className="text-[10px] text-slate-500 mt-1 line-clamp-1">
                                  {c.priorityReasons[0].label}
                                </div>
                              )}
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${statusInfo.badge}`}>
                                {statusInfo.label}
                              </span>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className="text-slate-800 font-semibold">
                                {c.assignedUserName || <span className="text-amber-600 font-bold">غير مسند</span>}
                              </div>
                              <div className="text-[10px] text-slate-500">{c.assignedTeamName || 'فريق العمليات'}</div>
                            </td>

                            <td className="py-3.5 px-4 whitespace-nowrap">
                              <div className={`text-xs ${slaStatus.color}`}>
                                {slaStatus.text}
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                                {new Date(c.dueAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap" onClick={e => e.stopPropagation()}>
                              <button
                                onClick={() => onOpenInWorkspace(c.caseId)}
                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-primary hover:text-white text-slate-700 px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors"
                              >
                                <span>مساحة العمل</span>
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

          {/* Stage Board / Kanban View */}
          {viewMode === 'stage-board' && (
            <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-7 gap-3.5 overflow-x-auto pb-4">
              {['NEW', 'TRIAGED', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_EXTERNAL', 'ESCALATED', 'RESOLVED'].map(st => {
                const stageCases = filteredCases.filter(c => c.status === st);
                const statusInfo = STATUS_LABELS[st] || { label: st, badge: 'bg-slate-100' };

                return (
                  <div key={st} className="bg-slate-100/70 rounded-2xl p-3 border border-slate-200/80 flex flex-col min-w-[240px]">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                      <span className="text-xs font-bold text-slate-800">{statusInfo.label}</span>
                      <span className="text-xs font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200 text-slate-600">
                        {stageCases.length}
                      </span>
                    </div>

                    <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[650px] pr-0.5">
                      {stageCases.map(c => {
                        const priorityInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;
                        const sla = getSlaRemainingFormatted(c);
                        const isSelected = selectedCaseId === c.caseId;

                        return (
                          <div
                            key={c.caseId}
                            onClick={() => setSelectedCaseId(c.caseId)}
                            className={`bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs hover:shadow-xs transition-all cursor-pointer ${
                              isSelected ? 'ring-2 ring-primary border-transparent' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-1 mb-1.5">
                              <span className="font-mono text-[11px] font-bold text-slate-900">{c.caseId}</span>
                              <span className={`text-[10px] px-1.5 py-0.2 rounded border font-bold ${priorityInfo.badge}`}>
                                {priorityInfo.label}
                              </span>
                            </div>

                            <div className="text-xs font-bold text-slate-800 line-clamp-2 mb-2 leading-snug">
                              {c.title}
                            </div>

                            <div className="flex items-center justify-between text-[10px] pt-2 border-t border-slate-100 text-slate-500">
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

          {/* Timeline View */}
          {viewMode === 'timeline' && (
            <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-xs">
              <div className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span>الخط الزمني للمهل والاستحقاقات القادمة</span>
              </div>

              <div className="space-y-4 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {filteredCases
                  .slice()
                  .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
                  .map((c, idx) => {
                    const sla = getSlaRemainingFormatted(c);
                    const priorityInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;

                    return (
                      <div
                        key={c.caseId}
                        onClick={() => setSelectedCaseId(c.caseId)}
                        className="relative pr-9 cursor-pointer group"
                      >
                        <div className={`absolute right-2.5 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-xs ${sla.isOverdue ? 'bg-red-600' : 'bg-primary'}`} />
                        <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 group-hover:bg-slate-50 group-hover:border-slate-300 transition-all">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-slate-900">{c.caseId}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded border font-bold ${priorityInfo.badge}`}>
                                {priorityInfo.label}
                              </span>
                            </div>
                            <span className={`text-xs ${sla.color}`}>{sla.text}</span>
                          </div>
                          <div className="text-xs font-bold text-slate-800">{c.title}</div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                            <span>المسؤول: {c.assignedUserName || 'غير مسند'}</span>
                            <span className="font-mono">{new Date(c.dueAt).toLocaleString('ar-SA')}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Team Distribution View */}
          {viewMode === 'team-distribution' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {OPERATIONAL_TEAMS.map(team => {
                const teamCases = filteredCases.filter(c => c.assignedTeamId === team.id);
                const criticalCount = teamCases.filter(c => c.priority === 'CRITICAL').length;
                const overdueCount = teamCases.filter(c => !c.isSlaPaused && new Date(c.dueAt).getTime() < Date.now()).length;

                return (
                  <div key={team.id} className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-bold text-slate-900 text-sm">{team.name}</h3>
                        <span className="font-mono font-bold text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                          {teamCases.length} حالات
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mb-4">قائد الفريق: {team.lead}</div>

                      <div className="grid grid-cols-2 gap-2 mb-4">
                        <div className="bg-red-50 p-2.5 rounded-xl border border-red-100 text-center">
                          <div className="text-base font-extrabold text-red-600">{criticalCount}</div>
                          <div className="text-[10px] font-semibold text-red-700">حالات حرجة</div>
                        </div>
                        <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100 text-center">
                          <div className="text-base font-extrabold text-rose-600">{overdueCount}</div>
                          <div className="text-[10px] font-semibold text-rose-700">تجاوزت المهلة</div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-3 border-t border-slate-100">
                      <div className="text-[11px] font-semibold text-slate-600 mb-1">أبرز الحالات النشطة:</div>
                      {teamCases.slice(0, 3).map(c => (
                        <div
                          key={c.caseId}
                          onClick={() => setSelectedCaseId(c.caseId)}
                          className="flex items-center justify-between p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                        >
                          <span className="font-mono text-[11px] font-bold text-slate-800">{c.caseId}</span>
                          <span className="text-slate-600 line-clamp-1 max-w-[150px]">{c.title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 6.3 المعاينة السريعة (Quick Preview Drawer) */}
        {selectedCase && (
          <aside className="w-full lg:w-96 bg-white rounded-2xl border border-slate-200/90 shadow-md p-5 flex flex-col shrink-0 self-start sticky top-20 animate-fade-in">
            {/* Header */}
            <div className="flex items-start justify-between pb-3 border-b border-slate-100 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm font-extrabold text-slate-900">{selectedCase.caseId}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${CASE_TYPE_LABELS[selectedCase.caseType]?.color || 'bg-slate-100'}`}>
                    {CASE_TYPE_LABELS[selectedCase.caseType]?.label || selectedCase.caseType}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  تاريخ الإنشاء: {new Date(selectedCase.createdAt).toLocaleString('ar-SA')}
                </div>
              </div>
              <button
                onClick={() => setSelectedCaseId(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Title & Description */}
            <div className="mb-4">
              <h3 className="font-bold text-slate-900 text-sm leading-snug mb-1.5">{selectedCase.title}</h3>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                {selectedCase.description}
              </p>
            </div>

            {/* Priority & Explainable Reasons */}
            <div className="mb-4 bg-red-50/40 p-3 rounded-xl border border-red-100">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-800">الأولوية التشغيلية:</span>
                <span className={`text-xs px-2 py-0.5 rounded-md border font-extrabold ${PRIORITY_LABELS[selectedCase.priority].badge}`}>
                  {PRIORITY_LABELS[selectedCase.priority].label}
                </span>
              </div>
              {selectedCase.priorityReasons && selectedCase.priorityReasons.length > 0 && (
                <div className="space-y-1 mt-2">
                  <div className="text-[11px] font-semibold text-slate-600">عوامل احتساب الأولوية:</div>
                  {selectedCase.priorityReasons.map((r, i) => (
                    <div key={i} className="text-[11px] text-slate-700 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span>{r.label}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SLA Due */}
            <div className="mb-4 p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">المهلة المتبقية (SLA):</div>
                <div className={`text-xs ${getSlaRemainingFormatted(selectedCase).color}`}>
                  {getSlaRemainingFormatted(selectedCase).text}
                </div>
              </div>
              <Timer className="w-5 h-5 text-slate-400" />
            </div>

            {/* Context Entity Summary */}
            <div className="mb-4 text-xs space-y-1.5 border-t border-slate-100 pt-3">
              <div className="flex justify-between text-slate-600">
                <span>الكيان المرتبط:</span>
                <span className="font-mono font-bold text-slate-800">{selectedCase.sourceEntityType} #{selectedCase.sourceEntityId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>المسؤول الحالي:</span>
                <span className="font-bold text-slate-800">{selectedCase.assignedUserName || 'غير مسند'}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>الفريق المختص:</span>
                <span className="font-bold text-slate-800">{selectedCase.assignedTeamName || 'فريق العمليات'}</span>
              </div>
              {selectedCase.financialImpact > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>الأثر المالي:</span>
                  <span className="font-bold text-slate-900">{selectedCase.financialImpact.toLocaleString('ar-SA')} ر.س</span>
                </div>
              )}
            </div>

            {/* Quick Actions Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {/* Primary Workspace Button */}
              <button
                onClick={() => onOpenInWorkspace(selectedCase.caseId)}
                className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white py-2.5 px-4 rounded-xl font-bold text-xs shadow-sm transition-all"
              >
                <span>فتح في مساحة العمل</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>

              {/* Allowed Secondary Actions */}
              <div className="grid grid-cols-2 gap-2">
                {!selectedCase.assignedUserId && (
                  <button
                    onClick={() => onExecuteCommand('ASSIGN_TO_ME', selectedCase.caseId)}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>إسناد إليّ</span>
                  </button>
                )}

                {selectedCase.status !== 'IN_PROGRESS' && selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                  <button
                    onClick={() => onExecuteCommand('START_PROCESSING', selectedCase.caseId)}
                    className="flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>بدء المعالجة</span>
                  </button>
                )}

                {selectedCase.status !== 'ESCALATED' && selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                  <button
                    onClick={() => {
                      const reason = window.prompt('سبب التصعيد التشغيلي:');
                      if (reason) onExecuteCommand('ESCALATE_CASE', selectedCase.caseId, { reason });
                    }}
                    className="flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 py-2 rounded-xl text-xs font-semibold transition-colors"
                  >
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>تصعيد</span>
                  </button>
                )}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
