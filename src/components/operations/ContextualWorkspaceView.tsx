import React, { useState, useEffect, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Flame, 
  ExternalLink, 
  UserCheck, 
  TrendingUp, 
  TrendingDown,
  Play, 
  Pause, 
  FileText, 
  Scale, 
  ShieldCheck, 
  MessageSquare, 
  History, 
  Layers, 
  Send, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft,
  Calendar, 
  CreditCard, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Copy,
  Check,
  Columns,
  Maximize2,
  SplitSquareVertical,
  SlidersHorizontal,
  FileCheck,
  AlertCircle,
  Search,
  Filter,
  ArrowUpDown,
  PlusCircle,
  Users,
  Shield,
  HelpCircle,
  ListTodo
} from 'lucide-react';
import { 
  OperationalCase, 
  OperationalCaseActivity, 
  WorkspaceViewMode, 
  CASE_TYPE_LABELS, 
  PRIORITY_LABELS, 
  STATUS_LABELS,
  OPERATIONAL_TEAMS
} from './types';

interface ContextualWorkspaceViewProps {
  currentCase: OperationalCase | null;
  allCases: OperationalCase[];
  onSelectCase: (caseId: string) => void;
  onExecuteCommand: (commandId: string, caseId: string, payload?: any) => void;
  onRefreshCase: (caseId: string) => void;
}

export const ContextualWorkspaceView: React.FC<ContextualWorkspaceViewProps> = ({
  currentCase,
  allCases,
  onSelectCase,
  onExecuteCommand,
  onRefreshCase
}) => {
  // Mobile / Tablet Pane switcher: 'list' | 'details' | 'actions'
  const [mobilePane, setMobilePane] = useState<'list' | 'details' | 'actions'>('details');

  // Desktop Collapsible Panels
  const [isListPaneCollapsed, setIsListPaneCollapsed] = useState(false);
  const [isActionsPaneCollapsed, setIsActionsPaneCollapsed] = useState(false);

  // Pane 1: Filters and Sorting
  const [listSearch, setListSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'dueAt' | 'createdAt' | 'priority' | 'financialImpact'>('dueAt');

  // Pane 2: Tabs
  const [activeTab, setActiveTab] = useState<'overview' | 'entity' | 'documents' | 'checks' | 'subtasks' | 'notes' | 'timeline'>('overview');

  // Pane 3: Internal Note Form & Action inputs
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [copiedCaseId, setCopiedCaseId] = useState(false);

  // Filtered & Sorted Cases for Pane 1
  const filteredCases = useMemo(() => {
    return allCases.filter(c => {
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (teamFilter !== 'ALL' && c.assignedTeamId !== teamFilter) return false;
      if (!listSearch.trim()) return true;
      const q = listSearch.toLowerCase();
      return (
        c.caseId.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        (c.assignedUserName && c.assignedUserName.toLowerCase().includes(q)) ||
        (c.sourceEntityId && c.sourceEntityId.includes(q))
      );
    }).sort((a, b) => {
      if (sortBy === 'dueAt') return new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime();
      if (sortBy === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === 'financialImpact') return (b.financialImpact || 0) - (a.financialImpact || 0);
      if (sortBy === 'priority') {
        const order: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return (order[b.priority] || 0) - (order[a.priority] || 0);
      }
      return 0;
    });
  }, [allCases, listSearch, priorityFilter, statusFilter, teamFilter, sortBy]);

  // Copy Case ID helper
  const handleCopyCaseId = () => {
    if (!currentCase) return;
    navigator.clipboard.writeText(currentCase.caseId);
    setCopiedCaseId(true);
    setTimeout(() => setCopiedCaseId(false), 2000);
  };

  // Submit note handler
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentCase || !internalNoteText.trim()) return;
    try {
      setIsSubmittingNote(true);
      await onExecuteCommand('ADD_INTERNAL_NOTE', currentCase.caseId, { note: internalNoteText.trim() });
      setInternalNoteText('');
      onRefreshCase(currentCase.caseId);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  // If no case is selected, prompt selection
  if (!currentCase) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80 shadow-xs text-center" dir="rtl">
        <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">لم يتم اختيار أي حالة تشغيلية</h2>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          يرجى اختيار حالة من القائمة أدناه أو استخدام البحث (⌘K) لتحميل بياناتها ومستنداتها في مساحة العمل السياقية.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
          {allCases.slice(0, 5).map(c => (
            <button
              key={c.caseId}
              onClick={() => onSelectCase(c.caseId)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-200"
            >
              فتح {c.caseId} ({c.title.slice(0, 24)}...)
            </button>
          ))}
        </div>
      </div>
    );
  }

  const priorityInfo = PRIORITY_LABELS[currentCase.priority] || PRIORITY_LABELS.MEDIUM;
  const statusInfo = STATUS_LABELS[currentCase.status] || STATUS_LABELS.NEW;
  const typeInfo = CASE_TYPE_LABELS[currentCase.caseType] || { label: currentCase.caseType, color: 'text-slate-700 bg-slate-100 border-slate-200' };

  // Calculate elapsed and remaining time
  const now = new Date();
  const createdDate = new Date(currentCase.createdAt);
  const dueDate = new Date(currentCase.dueAt);
  const isOverdue = !currentCase.isSlaPaused && dueDate.getTime() < now.getTime();
  const remainingHours = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60));
  const elapsedHours = Math.round((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-[82vh]" dir="rtl">
      
      {/* Mobile / Tablet Segmented Control */}
      <div className="lg:hidden flex items-center bg-slate-200/80 p-1 rounded-xl gap-1 text-xs font-bold">
        <button
          onClick={() => setMobilePane('list')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mobilePane === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          قائمة الحالات ({filteredCases.length})
        </button>
        <button
          onClick={() => setMobilePane('details')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mobilePane === 'details' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          تفاصيل الحالة
        </button>
        <button
          onClick={() => setMobilePane('actions')}
          className={`flex-1 py-2 rounded-lg transition-colors ${
            mobilePane === 'actions' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
          }`}
        >
          الإجراءات والتدقيق
        </button>
      </div>

      {/* 3-Pane Workspace Container */}
      <div className="flex-1 flex gap-3.5 overflow-hidden">
        
        {/* ========================================================= */}
        {/* PANE 1: LIST OF CASES (قائمة الحالات)                       */}
        {/* ========================================================= */}
        <aside 
          className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 transition-all duration-300 ${
            mobilePane !== 'list' ? 'hidden lg:flex' : 'flex w-full'
          } ${isListPaneCollapsed ? 'lg:w-12 p-2' : 'lg:w-84 xl:w-92 p-3.5'}`}
        >
          {/* Header & Collapse Toggle */}
          <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-100">
            {!isListPaneCollapsed && (
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-slate-900">قائمة الحالات التشغيلية</span>
                <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded-full text-slate-600 font-extrabold">
                  {filteredCases.length}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsListPaneCollapsed(!isListPaneCollapsed)}
              className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 mr-auto"
              title={isListPaneCollapsed ? 'توسيع قائمة الحالات' : 'طي قائمة الحالات'}
            >
              {isListPaneCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>

          {!isListPaneCollapsed && (
            <>
              {/* Search & Filters */}
              <div className="space-y-2 mb-3">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute right-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    value={listSearch}
                    onChange={e => setListSearch(e.target.value)}
                    placeholder="بحث برقم الحالة، العنوان، الكيان..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <select
                    value={priorityFilter}
                    onChange={e => setPriorityFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">كل الأولويات</option>
                    <option value="CRITICAL">حرجة فقط</option>
                    <option value="HIGH">عالية</option>
                    <option value="MEDIUM">متوسطة</option>
                    <option value="LOW">منخفضة</option>
                  </select>

                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                    className="bg-slate-50 border border-slate-200 rounded-lg p-1 text-slate-700 font-medium focus:outline-none"
                  >
                    <option value="ALL">كل الحالات</option>
                    <option value="NEW">جديدة</option>
                    <option value="ASSIGNED">مسندة</option>
                    <option value="IN_PROGRESS">قيد المعالجة</option>
                    <option value="WAITING_EXTERNAL">بانتظار خارجي</option>
                    <option value="ESCALATED">مصعّدة</option>
                    <option value="RESOLVED">محلولة</option>
                    <option value="CLOSED">مغلقة</option>
                  </select>
                </div>
              </div>

              {/* Cases Scrollable List */}
              <div className="flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-250px)] pr-0.5 scrollbar-thin">
                {filteredCases.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">
                    لا توجد حالات مطابقة للبحث أو الفلتر.
                  </div>
                ) : (
                  filteredCases.map(c => {
                    const isSelected = c.caseId === currentCase.caseId;
                    const pInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;
                    const sInfo = STATUS_LABELS[c.status] || STATUS_LABELS.NEW;
                    const cDue = new Date(c.dueAt);
                    const isCaseOverdue = !c.isSlaPaused && cDue.getTime() < now.getTime();

                    return (
                      <div
                        key={c.caseId}
                        onClick={() => {
                          onSelectCase(c.caseId);
                          setMobilePane('details');
                        }}
                        className={`p-3 rounded-xl border transition-all cursor-pointer text-xs relative ${
                          isSelected 
                            ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-400/40 shadow-xs' 
                            : 'bg-white border-slate-200/80 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        {/* Top: Case ID, Priority, Overdue indicator */}
                        <div className="flex items-center justify-between gap-1 mb-1.5">
                          <span className="font-mono font-black text-slate-900 text-[11px]">
                            {c.caseId}
                          </span>
                          <div className="flex items-center gap-1">
                            {isCaseOverdue && (
                              <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-mono">
                                تجاوز المهلة
                              </span>
                            )}
                            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-extrabold ${pInfo.badge}`}>
                              {pInfo.label}
                            </span>
                          </div>
                        </div>

                        {/* Title */}
                        <div className="font-bold text-slate-900 line-clamp-1 mb-1">
                          {c.title}
                        </div>

                        {/* Meta: Linked entity, Assignee, Impact */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                          <span className="truncate max-w-[130px]">
                            {c.assignedUserName || 'غير مسند'}
                          </span>
                          <span className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${sInfo.badge}`}>
                            {sInfo.label}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </aside>

        {/* ========================================================= */}
        {/* PANE 2: CASE DETAILS & CONTEXT (تفاصيل الحالة)              */}
        {/* ========================================================= */}
        <section 
          className={`flex-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col min-w-0 overflow-y-auto ${
            mobilePane !== 'details' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Sticky Context Header for Active Case */}
          <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/50 sticky top-0 z-20 backdrop-blur">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Badges & ID */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyCaseId}
                  className="flex items-center gap-1.5 font-mono text-xs font-black bg-slate-900 text-amber-400 px-2.5 py-1.5 rounded-xl hover:bg-slate-800 transition-colors shadow-2xs"
                  title="انقر لنسخ المعرّف"
                >
                  <span>{currentCase.caseId}</span>
                  {copiedCaseId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
                </button>

                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${typeInfo.color}`}>
                  {typeInfo.label}
                </span>

                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${statusInfo.badge}`}>
                  {statusInfo.label}
                </span>

                <span className={`text-xs px-2.5 py-1 rounded-md border font-extrabold ${priorityInfo.badge}`}>
                  {priorityInfo.label}
                </span>

                {currentCase.isSlaPaused && (
                  <span className="text-xs bg-amber-100 text-amber-800 border border-amber-300 font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
                    <Pause className="w-3 h-3" />
                    <span>المهلة معلقة</span>
                  </span>
                )}
              </div>

              {/* Meta Stats: SLA Remaining, Assignee */}
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>
                    المهلة: <strong className={`font-mono ${isOverdue ? 'text-rose-600 font-black' : 'text-slate-700'}`}>
                      {isOverdue ? 'متجاوزة المهلة' : `${remainingHours} ساعة متبقية`}
                    </strong>
                  </span>
                </div>
                <div>
                  المسؤول: <strong className="text-slate-800">{currentCase.assignedUserName || 'غير مسند'}</strong>
                </div>
              </div>
            </div>

            {/* Case Title */}
            <h1 className="text-base sm:text-lg font-black text-slate-950 mt-2.5 tracking-tight">
              {currentCase.title}
            </h1>
          </div>

          {/* Navigation Tabs for Pane 2 */}
          <div className="px-4 sm:px-5 pt-3 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none">
            {[
              { id: 'overview', label: 'نظرة عامة وسياق الحالة' },
              { id: 'entity', label: 'الكيان والبيانات الأساسية' },
              { id: 'documents', label: 'اللقطة المالية والعقود' },
              { id: 'checks', label: 'الفحوصات والامتثال الآلي' },
              { id: 'subtasks', label: 'المحادثات والمهام الفرعية' },
              { id: 'notes', label: 'الملاحظات الداخلية' },
              { id: 'timeline', label: 'التسلسل الزمني وسجل التدقيق' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
            
            {/* 1. Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Reason & Detailed Explanation */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <h4 className="text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span>شرح وتفاصيل الاستثناء التشغيلي:</span>
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-800 leading-relaxed whitespace-pre-wrap font-medium">
                    {currentCase.description}
                  </p>
                </div>

                {/* Explainable Priority Factors */}
                <div className="p-4 bg-red-50/30 rounded-2xl border border-red-100">
                  <h4 className="text-xs font-bold text-red-900 mb-2.5 flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-red-600" />
                    <span>عوامل تصنيف الأولوية القابلة للتفسير (Explainable Priority Factors):</span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentCase.priorityReasons && currentCase.priorityReasons.length > 0 ? (
                      currentCase.priorityReasons.map((r, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 bg-white rounded-xl border border-red-100 text-xs text-slate-700">
                          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
                          <span className="font-semibold">{r.label}</span>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-500">تم تحديد الأولوية وفق المعايير الاعتيادية.</div>
                    )}
                  </div>
                </div>

                {/* Quick Facts Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="text-slate-400 font-medium">مصدر الاستثناء:</div>
                    <div className="font-bold text-slate-800 mt-1 font-mono">{currentCase.source}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="text-slate-400 font-medium">الكيان المرتبط:</div>
                    <div className="font-bold text-slate-800 mt-1 font-mono">{currentCase.sourceEntityType} #{currentCase.sourceEntityId}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="text-slate-400 font-medium">مستوى التصعيد:</div>
                    <div className="font-bold text-slate-800 mt-1">المستوى {currentCase.escalationLevel || 0}</div>
                  </div>
                  <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/50">
                    <div className="text-slate-400 font-medium">تاريخ الإنشاء:</div>
                    <div className="font-bold text-slate-800 mt-1">{new Date(currentCase.createdAt).toLocaleString('ar-SA')}</div>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Entity Details Tab */}
            {activeTab === 'entity' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-indigo-50/30 rounded-2xl border border-indigo-200/80">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-bold text-indigo-950 text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                      <span>بيانات الكيان التشغيلي: {currentCase.sourceEntityType} #{currentCase.sourceEntityId}</span>
                    </h4>
                    <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-2 py-0.5 rounded-full">
                      {currentCase.metadata?.period || 'الفترة المسائية'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs mb-3">
                    <div className="bg-white p-3 rounded-xl border border-indigo-200/60">
                      <div className="text-slate-500">اسم العميل:</div>
                      <div className="font-bold text-slate-800 mt-0.5">{currentCase.metadata?.customerName || 'عميل منصة ليلة'}</div>
                      <div className="text-[11px] text-slate-400 font-mono mt-0.5">{currentCase.metadata?.customerPhone || '05XXXXXXXX'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-indigo-200/60">
                      <div className="text-slate-500">القاعة / الخدمة:</div>
                      <div className="font-bold text-slate-800 mt-0.5">{currentCase.metadata?.hallName || currentCase.metadata?.serviceName || 'قاعة ليلة الكبرى'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{currentCase.metadata?.city || 'الرياض'}</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-indigo-200/60">
                      <div className="text-slate-500">المزود المسؤول:</div>
                      <div className="font-bold text-slate-800 mt-0.5">{currentCase.metadata?.providerName || 'شريك معتمد'}</div>
                    </div>
                  </div>
                </div>

                {/* Direct Link to Dashboard */}
                <div className="p-4 bg-blue-50/40 rounded-2xl border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-blue-900 text-sm">الانتقال إلى السجل الكامل في لوحة الإدارة</div>
                    <div className="text-slate-600 mt-0.5">يمكنك فتح وتعديل كافة خصائص هذا السجل مباشرة في لوحة الإدارة الشاملة.</div>
                  </div>
                  <a
                    href={`/dashboard/${currentCase.sourceEntityType.toLowerCase()}s/${currentCase.sourceEntityId}`}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors shrink-0"
                  >
                    <span>فتح في لوحة الإدارة</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            )}

            {/* 3. Financial Snapshot & Contracts */}
            {activeTab === 'documents' && (
              <div className="space-y-4 text-xs">
                <div className="p-4 bg-emerald-50/40 rounded-2xl border border-emerald-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-emerald-950 text-sm flex items-center gap-2">
                      <Scale className="w-4 h-4 text-emerald-600" />
                      <span>اللقطة المالية المثبتة (Financial Pricing Snapshot)</span>
                    </h4>
                    <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                      غير قابلة للتعديل (Financial Immutability)
                    </span>
                  </div>
                  <p className="text-slate-600 leading-relaxed mb-3">
                    كافة الأسعار المعروضة في المنصة هي أسعار نهائية شاملة لضريبة القيمة المضافة 15% (VAT-Inclusive). وتُحسب عمولة المنصة السيادية وفق باقة اشتراك المزود واللقطة المالية المثبتة.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="bg-white p-3 rounded-xl border border-emerald-100">
                      <div className="text-slate-500">المبلغ الإجمالي الشامل (15% VAT):</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{Number(currentCase.financialImpact).toLocaleString('ar-SA')} ر.س</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100">
                      <div className="text-slate-500">ضريبة القيمة المضافة المستخرجة (15%):</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{(Number(currentCase.financialImpact) * 0.15 / 1.15).toFixed(2)} ر.س</div>
                    </div>
                    <div className="bg-white p-3 rounded-xl border border-emerald-100">
                      <div className="text-slate-500">الوعاء الخاضع للضريبة (Taxable):</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">{(Number(currentCase.financialImpact) / 1.15).toFixed(2)} ر.س</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Automated Checks & Compliance Tab */}
            {activeTab === 'checks' && (
              <div className="space-y-3 text-xs">
                <div className="font-bold text-slate-900 text-sm mb-1">نتائج الفحوصات والامتثال السيادي</div>
                <div className="space-y-2">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>امتثال الأسعار لضريبة القيمة المضافة 15% الشاملة (VAT-Inclusive).</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">مكتمل</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>الامتثال لمعايير الصور (16:9 بحد أقصى 500KB وتنسيقات WebP/JPEG/PNG).</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">مكتمل</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>قاعدة عدم ازدواجية الخدمات بين خدمات المكان والخدمات الخارجية المستقلة.</span>
                    </div>
                    <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">مكتمل</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-amber-600" />
                      <span>حظر النشر العام قبل اعتماد الإدارة الرسمي (Pending Approval Gate).</span>
                    </div>
                    <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded">تحت المراجعة</span>
                  </div>
                </div>
              </div>
            )}

            {/* 5. Subtasks & Conversations Tab */}
            {activeTab === 'subtasks' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 text-sm">المهام الفرعية والتكليفات الميدانية</h4>
                  <button
                    onClick={() => {
                      const title = window.prompt('عنوان المهمة الفرعية:');
                      if (title) {
                        const assignee = window.prompt('الموظف أو الفريق المكلف:') || 'فريق العمليات';
                        onExecuteCommand('CREATE_SUBTASK', currentCase.caseId, { title, assignee });
                      }
                    }}
                    className="flex items-center gap-1 text-xs bg-slate-900 text-white px-3 py-1.5 rounded-xl font-bold hover:bg-slate-800"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>إضافة مهمة فرعية</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {currentCase.activities?.filter(a => a.activityType === 'SUBTASK_CREATED').length === 0 ? (
                    <div className="text-slate-400 py-6 text-center border border-dashed border-slate-200 rounded-xl">
                      لا توجد مهام فرعية مسجلة لهذه الحالة حتى الآن.
                    </div>
                  ) : (
                    currentCase.activities?.filter(a => a.activityType === 'SUBTASK_CREATED').map(a => (
                      <div key={a.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                        <div>
                          <div className="font-bold text-slate-800">{a.message}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(a.createdAt).toLocaleString('ar-SA')} • {a.authorName}</div>
                        </div>
                        <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">قيد المتابعة</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 6. Notes Tab */}
            {activeTab === 'notes' && (
              <div className="space-y-4">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700">إضافة ملاحظة داخلية سرية لفريق العمليات:</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={internalNoteText}
                      onChange={e => setInternalNoteText(e.target.value)}
                      placeholder="اكتب ملاحظة توثيقية حول الاتصال بالعميل أو نتيجة الفحص..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 focus:outline-none focus:border-primary"
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingNote}
                      className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors shrink-0"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>حفظ</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="text-xs font-bold text-slate-700">الملاحظات المسجلة:</div>
                  {currentCase.activities?.filter(a => a.activityType === 'INTERNAL_NOTE').length === 0 ? (
                    <div className="text-xs text-slate-400 py-4 text-center">لا توجد ملاحظات داخلية مسجلة بعد.</div>
                  ) : (
                    currentCase.activities?.filter(a => a.activityType === 'INTERNAL_NOTE').map(a => (
                      <div key={a.id} className="p-3 bg-amber-50/50 rounded-xl border border-amber-200/60 text-xs">
                        <div className="flex items-center justify-between text-slate-500 mb-1">
                          <span className="font-bold text-slate-800">{a.authorName}</span>
                          <span className="font-mono text-[10px]">{new Date(a.createdAt).toLocaleString('ar-SA')}</span>
                        </div>
                        <div className="text-slate-800 leading-relaxed">{a.message}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* 7. Timeline & Audit Tab */}
            {activeTab === 'timeline' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700 mb-2">التسلسل الزمني وسجل التدقيق التشغيلي:</div>
                <div className="space-y-3 relative before:absolute before:right-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                  {currentCase.activities?.map(act => (
                    <div key={act.id} className="relative pr-9 text-xs">
                      <div className="absolute right-2.5 top-1.5 w-3.5 h-3.5 rounded-full bg-slate-800 border-2 border-white shadow-2xs" />
                      <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/60">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-bold text-slate-800">{act.authorName} ({act.authorRole})</span>
                          <span className="font-mono text-[10px] text-slate-400">{new Date(act.createdAt).toLocaleString('ar-SA')}</span>
                        </div>
                        <div className="text-slate-700 leading-relaxed">{act.message}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ========================================================= */}
        {/* PANE 3: PERMITTED ACTIONS & AUDIT TRAIL (الإجراءات والتدقيق) */}
        {/* ========================================================= */}
        <aside 
          className={`bg-white rounded-2xl border border-slate-200/80 shadow-xs flex flex-col shrink-0 transition-all duration-300 ${
            mobilePane !== 'actions' ? 'hidden lg:flex' : 'flex w-full'
          } ${isActionsPaneCollapsed ? 'lg:w-12 p-2' : 'lg:w-80 xl:w-88 p-4'}`}
        >
          {/* Header & Toggle */}
          <div className="flex items-center justify-between pb-2.5 mb-3 border-b border-slate-100">
            {!isActionsPaneCollapsed && (
              <span className="font-bold text-xs text-slate-900">الإجراءات وسجل التدقيق</span>
            )}
            <button
              onClick={() => setIsActionsPaneCollapsed(!isActionsPaneCollapsed)}
              className="hidden lg:flex p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 mr-auto"
              title={isActionsPaneCollapsed ? 'توسيع لوحة الإجراءات' : 'طي لوحة الإجراءات'}
            >
              {isActionsPaneCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {!isActionsPaneCollapsed && (
            <div className="flex-1 overflow-y-auto space-y-4 pr-0.5 scrollbar-thin">
              
              {/* Permitted Actions Block */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  الإجراءات المتاحة للحالة:
                </div>

                {/* 1. Assign to me */}
                {(!currentCase.assignedUserId || currentCase.status === 'NEW') && (
                  <button
                    onClick={() => onExecuteCommand('ASSIGN_TO_ME', currentCase.caseId)}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-colors shadow-xs"
                  >
                    <span className="flex items-center gap-2">
                      <UserCheck className="w-4 h-4" />
                      <span>إسناد الحالة إليّ</span>
                    </span>
                    <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">استلام</span>
                  </button>
                )}

                {/* 2. Assign to another agent */}
                <button
                  onClick={() => {
                    const agentName = window.prompt('اسم الموظف المسند إليه:');
                    if (agentName) {
                      const reason = window.prompt('سبب إعادة الإسناد:') || 'توجيه تشغيلي';
                      onExecuteCommand('ASSIGN_TO_AGENT', currentCase.caseId, { assignedUserName: agentName, reason });
                    }
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-right"
                >
                  <Users className="w-4 h-4 text-slate-500" />
                  <span>إعادة إسناد لموظف آخر</span>
                </button>

                {/* 3. Start Processing */}
                {currentCase.status !== 'IN_PROGRESS' && currentCase.status !== 'RESOLVED' && currentCase.status !== 'CLOSED' && (
                  <button
                    onClick={() => onExecuteCommand('START_PROCESSING', currentCase.caseId)}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors text-right shadow-xs"
                  >
                    <Play className="w-4 h-4" />
                    <span>بدء المعالجة والتحقيق</span>
                  </button>
                )}

                {/* 4. Request More Info */}
                <button
                  onClick={() => {
                    const reason = window.prompt('أدخل تفاصيل الاستفسار أو المعلومات المطلوبة:');
                    if (reason) onExecuteCommand('REQUEST_MORE_INFO', currentCase.caseId, { reason });
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-right"
                >
                  <HelpCircle className="w-4 h-4 text-slate-500" />
                  <span>طلب إيضاحات إضافية</span>
                </button>

                {/* 5. Escalate Case */}
                <button
                  onClick={() => {
                    const reason = window.prompt('سبب التصعيد للإشراف:');
                    if (reason) onExecuteCommand('ESCALATE_CASE', currentCase.caseId, { reason });
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors text-right border border-rose-200"
                >
                  <TrendingUp className="w-4 h-4 text-rose-600" />
                  <span>تصعيد الحالة (Escalate)</span>
                </button>

                {/* 6. De-escalate Case (If Escalated) */}
                {currentCase.status === 'ESCALATED' && (
                  <button
                    onClick={() => {
                      const reason = window.prompt('سبب تخفيض التصعيد:');
                      if (reason) onExecuteCommand('DE_ESCALATE_CASE', currentCase.caseId, { reason });
                    }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-colors text-right border border-indigo-200"
                  >
                    <TrendingDown className="w-4 h-4 text-indigo-600" />
                    <span>تخفيض التصعيد (De-escalate)</span>
                  </button>
                )}

                {/* 7. Transfer to another team */}
                <button
                  onClick={() => {
                    const teamName = window.prompt('اختر الفريق (SUPPORT / FINANCE / VERIFICATION / LOGISTICS):', 'FINANCE');
                    if (teamName) {
                      const reason = window.prompt('سبب تحويل الفريق:') || 'توجيه اختصاص';
                      onExecuteCommand('TRANSFER_TEAM', currentCase.caseId, { targetTeamId: teamName, reason });
                    }
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-right"
                >
                  <SlidersHorizontal className="w-4 h-4 text-slate-500" />
                  <span>تحويل الحالة لفريق آخر</span>
                </button>

                {/* 8. Pause / Resume SLA */}
                {!currentCase.isSlaPaused ? (
                  <button
                    onClick={() => {
                      const reason = window.prompt('سبب تعليق المهلة (انتظار جهة خارجية / إفادة رسمية):');
                      if (reason) onExecuteCommand('PAUSE_SLA_WAITING', currentCase.caseId, { reason });
                    }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors text-right"
                  >
                    <Pause className="w-4 h-4 text-amber-600" />
                    <span>تعليق المهلة لانتظار خارجي</span>
                  </button>
                ) : (
                  <button
                    onClick={() => onExecuteCommand('RESUME_SLA', currentCase.caseId)}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-colors text-right shadow-xs"
                  >
                    <Play className="w-4 h-4" />
                    <span>استئناف احتساب المهلة</span>
                  </button>
                )}

                {/* 9. Resolve Case */}
                {currentCase.status !== 'RESOLVED' && currentCase.status !== 'CLOSED' && (
                  <button
                    onClick={() => {
                      const summary = window.prompt('ملخص الحل والإجراء المعتمد:');
                      if (summary) {
                        onExecuteCommand('RESOLVE_CASE', currentCase.caseId, { reason: summary, summary });
                      }
                    }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors text-right shadow-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد الحل وتوثيق النتيجة</span>
                  </button>
                )}

                {/* 10. Close Case */}
                {currentCase.status === 'RESOLVED' && (
                  <button
                    onClick={() => onExecuteCommand('CLOSE_CASE', currentCase.caseId)}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors text-right shadow-xs"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>أرشفة وإغلاق نهائي</span>
                  </button>
                )}

                {/* 11. Reopen Case */}
                {currentCase.status === 'CLOSED' && (
                  <button
                    onClick={() => {
                      const reason = window.prompt('سبب إعادة فتح الحالة المغلقة:');
                      if (reason) onExecuteCommand('REOPEN_CASE', currentCase.caseId, { reason });
                    }}
                    className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold transition-colors text-right shadow-xs"
                  >
                    <span>إعادة فتح الحالة المغلقة</span>
                  </button>
                )}
              </div>

              {/* Live Mini Activity Log */}
              <div className="pt-3 border-t border-slate-100">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  آخر الأنشطة والقرارات:
                </div>
                <div className="space-y-2 text-xs max-h-60 overflow-y-auto pr-0.5">
                  {currentCase.activities?.slice(0, 6).map(act => (
                    <div key={act.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-slate-700">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                        <span>{act.authorName}</span>
                        <span>{new Date(act.createdAt).toLocaleTimeString('ar-SA')}</span>
                      </div>
                      <div className="line-clamp-2">{act.message}</div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </aside>

      </div>
    </div>
  );
};
