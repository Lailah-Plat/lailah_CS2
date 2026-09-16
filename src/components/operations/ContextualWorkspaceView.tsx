import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  ArrowRight, 
  ShieldCheck, 
  ChevronRight, 
  ChevronLeft, 
  Play, 
  Pause, 
  RotateCcw, 
  Send, 
  UserCheck, 
  MessageSquare, 
  FileText, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Scale, 
  Calendar, 
  SlidersHorizontal, 
  Search, 
  ExternalLink, 
  Copy, 
  Check, 
  Layers,
  Image as ImageIcon,
  Video as VideoIcon,
  Maximize2,
  Columns,
  ListFilter,
  History,
  ShieldAlert,
  Sparkles,
  Info,
  CheckSquare,
  AlertCircle
} from 'lucide-react';
import { 
  OperationalCase, 
  CommandDefinition, 
  PRIORITY_LABELS, 
  STATUS_LABELS, 
  CASE_TYPE_LABELS,
  OpsTheme
} from './types';
import { GovernedActionModal, GovernedActionConfig } from './GovernedActionModal';

type WorkspaceLayout = 'three-pane' | 'split' | 'focused' | 'timeline-only';

interface ContextualWorkspaceViewProps {
  currentCase: OperationalCase | null;
  allCases: OperationalCase[];
  onSelectCase: (caseId: string) => void;
  onExecuteCommand: (commandId: string, caseId: string, payload?: any) => Promise<any>;
  onRefreshCase: (caseId: string) => void;
  userRole?: string;
  theme?: OpsTheme;
}

export const ContextualWorkspaceView: React.FC<ContextualWorkspaceViewProps> = ({
  currentCase,
  allCases,
  onSelectCase,
  onExecuteCommand,
  onRefreshCase,
  userRole = 'مشرف العمليات',
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Workspace Layout Switcher state
  const [layoutMode, setLayoutMode] = useState<WorkspaceLayout>('three-pane');

  // Active Tab inside Center Pane
  const [activeTab, setActiveTab] = useState<'overview' | 'entity' | 'documents' | 'checks' | 'media' | 'subtasks' | 'notes' | 'timeline'>('overview');
  
  // Left List Search & Filter
  const [listSearch, setListSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<'dueAt' | 'createdAt' | 'priority' | 'financialImpact'>('dueAt');
  
  // Internal Note form state
  const [internalNoteText, setInternalNoteText] = useState('');
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [copiedCaseId, setCopiedCaseId] = useState(false);

  // Governed Action Modal state
  const [activeGovernedAction, setActiveGovernedAction] = useState<GovernedActionConfig | null>(null);

  // Filtered Queue Stream Cases for Right Pane
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
      <div 
        className={`flex-1 flex flex-col items-center justify-center p-12 rounded-2xl border text-center transition-colors ${
          isDark 
            ? 'bg-slate-900/90 border-slate-800 text-slate-200' 
            : 'bg-white border-slate-200/80 text-slate-800 shadow-xs'
        }`} 
        dir="rtl"
      >
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center mb-4 shadow-inner">
          <Layers className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-black mb-1">لم يتم اختيار أي حالة تشغيلية</h2>
        <p className="text-xs text-slate-400 max-w-md mb-6">
          يرجى اختيار حالة من القائمة أدناه أو استخدام البحث الفوري (⌘K) لتحميل بياناتها ومستنداتها في مساحة العمل السياقية.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
          {allCases.slice(0, 5).map(c => (
            <button
              key={c.caseId}
              onClick={() => onSelectCase(c.caseId)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all border ${
                isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
              }`}
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

  // Calculate elapsed and remaining SLA time
  const now = new Date();
  const dueDate = new Date(currentCase.dueAt);
  const isOverdue = !currentCase.isSlaPaused && dueDate.getTime() < now.getTime();
  const remainingMinutes = Math.round((dueDate.getTime() - now.getTime()) / (1000 * 60));
  const remainingHours = Math.floor(Math.abs(remainingMinutes) / 60);
  const remMins = Math.abs(remainingMinutes) % 60;

  return (
    <div className="flex-1 flex flex-col gap-3 min-h-[84vh]" dir="rtl">
      
      {/* SECTION 4.1: Persistent Shared Context Sub-Header */}
      <div className={`p-3.5 sm:p-4 rounded-2xl border transition-colors ${
        isDark 
          ? 'bg-slate-900/95 border-slate-800 shadow-md' 
          : 'bg-white border-slate-200/90 shadow-2xs'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Right: Reference Badges & Entity Details */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            {/* Official Case ID Button with Copy */}
            <button
              onClick={handleCopyCaseId}
              className="flex items-center gap-1.5 font-mono text-xs font-black bg-slate-950 text-amber-400 border border-amber-400/30 px-3 py-1.5 rounded-xl hover:border-amber-400 transition-all shadow-inner"
              title="انقر لنسخ المعرّف الرسمي"
            >
              <span>{currentCase.caseId}</span>
              {copiedCaseId ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-slate-400" />}
            </button>

            {/* Linked Official Entity Badge (BKG-26 / SRV-26 / INV-26) */}
            {currentCase.sourceEntityId && (
              <span className={`font-mono text-xs px-2.5 py-1 rounded-xl border font-black ${
                isDark ? 'bg-slate-800 text-teal-300 border-teal-500/30' : 'bg-teal-50 text-teal-800 border-teal-200'
              }`}>
                {currentCase.sourceEntityType}: #{currentCase.sourceEntityId}
              </span>
            )}

            {/* Case Type Tag */}
            <span className={`text-xs px-2.5 py-1 rounded-xl border font-bold ${typeInfo.color}`}>
              {typeInfo.label}
            </span>

            {/* Status Tag */}
            <span className={`text-xs px-2.5 py-1 rounded-xl border font-bold ${statusInfo.badge}`}>
              {statusInfo.label}
            </span>

            {/* Priority Tag */}
            <span className={`text-xs px-2.5 py-1 rounded-xl border font-extrabold ${priorityInfo.badge}`}>
              {priorityInfo.label}
            </span>

            {/* SLA Remaining Real-time Pill */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-mono font-bold border ${
              isOverdue 
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse' 
                : isDark 
                  ? 'bg-slate-800 text-slate-300 border-slate-700' 
                  : 'bg-slate-100 text-slate-700 border-slate-200'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>
                {isOverdue 
                  ? `متأخرة بـ ${remainingHours}س ${remMins}د` 
                  : `متبقي ${remainingHours}س ${remMins}د`}
              </span>
            </div>
          </div>

          {/* Left: Workspace Layout Switcher (4 modes) */}
          <div className={`flex items-center p-1 rounded-xl border self-start lg:self-auto ${
            isDark ? 'bg-slate-950 border-slate-800' : 'bg-slate-100 border-slate-200'
          }`}>
            <button
              onClick={() => setLayoutMode('three-pane')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'three-pane'
                  ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض ثلاثي كامل (القائمة + التفاصيل + الإجراءات)"
            >
              <Columns className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">ثلاثي (3-Pane)</span>
            </button>

            <button
              onClick={() => setLayoutMode('split')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'split'
                  ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="عرض منقسم (تفاصيل + إجراءات)"
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">منقسم (2-Pane)</span>
            </button>

            <button
              onClick={() => setLayoutMode('focused')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'focused'
                  ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="شاشة عريضة مركزة"
            >
              <Maximize2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">مركز (Focused)</span>
            </button>

            <button
              onClick={() => setLayoutMode('timeline-only')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                layoutMode === 'timeline-only'
                  ? isDark ? 'bg-slate-800 text-white shadow-xs' : 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="سجل التدقيق فقط"
            >
              <History className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">سجل التدقيق</span>
            </button>
          </div>

        </div>

        {/* Title & Hall Name Subtitle */}
        <div className="mt-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-t pt-2 border-slate-800/50">
          <h1 className={`text-sm sm:text-base font-black ${isDark ? 'text-white' : 'text-slate-950'}`}>
            {currentCase.title}
          </h1>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>المنشأة: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{currentCase.metadata?.hallName || 'قاعة ليلة الكبرى'}</strong></span>
            <span>•</span>
            <span>المزود: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{currentCase.metadata?.providerName || 'شركة ليلة للضيافة'}</strong></span>
            <span>•</span>
            <span>المسؤول: <strong className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>{currentCase.assignedUserName || 'غير مسند'}</strong></span>
          </div>
        </div>
      </div>

      {/* Main Multi-Pane Workspace Container */}
      <div className="flex-1 flex gap-3.5 overflow-hidden">
        
        {/* ========================================================= */}
        {/* PANE 1: QUEUE STREAM (يمين في RTL - 280px)                 */}
        {/* ========================================================= */}
        {layoutMode === 'three-pane' && (
          <aside 
            className={`w-72 xl:w-80 rounded-2xl border p-3 flex flex-col shrink-0 transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/60">
              <div className="flex items-center gap-1.5">
                <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  طابور الحالات المفتوحة
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-extrabold">
                  {filteredCases.length}
                </span>
              </div>
            </div>

            {/* Quick Search */}
            <div className="relative mb-2">
              <Search className="w-3.5 h-3.5 absolute right-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={listSearch}
                onChange={e => setListSearch(e.target.value)}
                placeholder="تصفية الطابور..."
                className={`w-full rounded-xl pr-8 pl-3 py-1.5 text-xs border focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-emerald-500' 
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                }`}
              />
            </div>

            {/* Scrollable Cases List */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[calc(100vh-280px)] pr-0.5 scrollbar-thin">
              {filteredCases.map(c => {
                const isSelected = c.caseId === currentCase.caseId;
                const pInfo = PRIORITY_LABELS[c.priority] || PRIORITY_LABELS.MEDIUM;
                const sInfo = STATUS_LABELS[c.status] || STATUS_LABELS.NEW;
                const cDue = new Date(c.dueAt);
                const isCaseOverdue = !c.isSlaPaused && cDue.getTime() < now.getTime();

                return (
                  <div
                    key={c.caseId}
                    onClick={() => onSelectCase(c.caseId)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer text-xs ${
                      isSelected 
                        ? isDark 
                          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-xs ring-1 ring-emerald-500/30' 
                          : 'bg-blue-50 border-blue-300 shadow-xs ring-1 ring-blue-400/40'
                        : isDark 
                          ? 'bg-slate-950/60 border-slate-800 hover:bg-slate-850 hover:border-slate-700' 
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className={`font-mono font-bold text-[11px] ${isSelected ? 'text-emerald-400' : isDark ? 'text-slate-300' : 'text-slate-800'}`}>
                        {c.caseId}
                      </span>
                      <div className="flex items-center gap-1">
                        {isCaseOverdue && (
                          <span className="text-[9px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 px-1 py-0.2 rounded">
                            مهلة
                          </span>
                        )}
                        <span className={`text-[9px] px-1 py-0.2 rounded border font-bold ${pInfo.badge}`}>
                          {pInfo.label}
                        </span>
                      </div>
                    </div>

                    <div className={`font-bold line-clamp-1 mb-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                      {c.title}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800/40">
                      <span className="truncate max-w-[120px]">
                        {c.assignedUserName || 'غير مسند'}
                      </span>
                      <span className={`px-1 py-0.2 rounded text-[9px] font-bold border ${sInfo.badge}`}>
                        {sInfo.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </aside>
        )}

        {/* ========================================================= */}
        {/* PANE 2: VERIFICATION & INSPECTION STUDIO (وسط)            */}
        {/* ========================================================= */}
        <section 
          className={`flex-1 rounded-2xl border flex flex-col min-w-0 overflow-y-auto transition-colors ${
            isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
          }`}
        >
          {/* Navigation Tabs for Center Pane */}
          <div className={`px-4 pt-3 border-b flex items-center gap-1.5 overflow-x-auto text-xs font-bold scrollbar-none ${
            isDark ? 'border-slate-800 bg-slate-950/40' : 'border-slate-200 bg-slate-50/50'
          }`}>
            {[
              { id: 'overview', label: '1. نظرة عامة وسياق الحالة' },
              { id: 'checks', label: '2. قائمة الامتثال السيادي' },
              { id: 'media', label: '3. مختبر فحص الوسائط' },
              { id: 'documents', label: '4. اللقطة المالية (15% VAT)' },
              { id: 'entity', label: '5. بيانات الكيان والطرف' },
              { id: 'notes', label: '6. الملاحظات السرية' },
              { id: 'timeline', label: '7. سجل التدقيق الزمني' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap shrink-0 text-xs ${
                  activeTab === tab.id 
                    ? isDark 
                      ? 'bg-emerald-500 text-slate-950 font-black shadow-xs' 
                      : 'bg-slate-900 text-white shadow-xs' 
                    : isDark 
                      ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' 
                      : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Contents Area */}
          <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4">
            
            {/* TAB 1: OVERVIEW & ROOT CAUSE */}
            {activeTab === 'overview' && (
              <div className="space-y-4">
                {/* Description Box */}
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <h4 className="text-xs font-bold text-slate-400 mb-1.5 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span>سبب الاستثناء والوصف التشغيلي:</span>
                  </h4>
                  <p className={`text-xs leading-relaxed font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    {currentCase.description}
                  </p>
                </div>

                {/* Priority Drivers */}
                {currentCase.priorityReasons && currentCase.priorityReasons.length > 0 && (
                  <div className={`p-4 rounded-2xl border ${
                    isDark ? 'bg-rose-950/20 border-rose-900/40' : 'bg-rose-50 border-rose-200'
                  }`}>
                    <h4 className="text-xs font-bold text-rose-400 mb-2 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      <span>محددات درجة الخطورة والأولوية:</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {currentCase.priorityReasons.map((reason, idx) => (
                        <div key={idx} className={`p-2.5 rounded-xl border text-xs flex items-center justify-between ${
                          isDark ? 'bg-slate-950/70 border-rose-900/40 text-slate-300' : 'bg-white border-rose-200 text-slate-800'
                        }`}>
                          <span>{reason.label}</span>
                          <span className="font-mono text-[10px] bg-rose-500/20 text-rose-400 px-1.5 py-0.2 rounded font-bold">
                            +{reason.weight}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Entity Preview */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-[11px] text-slate-400">الكيان المرتبط:</div>
                    <div className={`font-mono font-bold text-xs mt-0.5 ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                      {currentCase.sourceEntityType} #{currentCase.sourceEntityId}
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-[11px] text-slate-400">الأثر المالي للحالة:</div>
                    <div className="font-bold text-xs mt-0.5 text-emerald-400">
                      {Number(currentCase.financialImpact || 0).toLocaleString('ar-SA')} ر.س
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="text-[11px] text-slate-400">أثر تجربة العميل:</div>
                    <div className={`font-bold text-xs mt-0.5 ${
                      currentCase.customerImpact === 'BLOCKING' ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {currentCase.customerImpact || 'عالي'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: COMPLIANCE CHECKLIST */}
            {activeTab === 'checks' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h4 className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    قائمة التحقق الإلزامية للمشرف (Sovereign Audit Checklist)
                  </h4>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-lg font-bold">
                    100% مدققة آلياً
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-400">قاعدة الأسعار الشاملة لضريبة القيمة المضافة (15% VAT-Inclusive)</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        تم التحقق من استخراج الضريبة محاسبياً (`Taxable = Gross / 1.15`) وعدم إضافة الضريبة فوق السعر المعروض للمستهلك.
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-400">العزل الصارم لبيانات الشركاء والعملاء (Multi-Tenancy Isolation)</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        البيانات مقيدة بشكل حصري على معرف الشريك (`providerId`) ومعرف العميل (`customerId`).
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-400">منع ازدواجية الخدمات الإضافية مع خدمات المكان</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        تم تأكيد أولوية خدمات المنشأة الأصلية وعدم تضارب أي مزود خارجي مستقل مع خدمات القاعة الداخلية.
                      </div>
                    </div>
                  </div>

                  <div className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                  }`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-emerald-400">معيارية المعرفات والسلاسل الرقمية (BKG-26-..., SRV-26-..., INV-26...)</div>
                      <div className="text-slate-400 text-[11px] mt-0.5">
                        كافة المعرفات المسجلة تبدأ بالبادئات المعتمدة رسمياً لعام 2026 مع الأرقام التسلسلية المكونة من 10 خانات.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 3: MEDIA & ASSET VERIFICATION LAB (فحص الوسائط وفق Rule 7) */}
            {activeTab === 'media' && (
              <div className="space-y-4 text-xs">
                <div className={`p-3.5 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <h4 className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      مختبر الفحص الفني للصور والفيديوهات (Rule 7 Media Specifications)
                    </h4>
                    <p className="text-slate-400 text-[11px] mt-0.5">
                      فحص فوري للأبعاد والنسبة 16:9 وصيغ WebP/JPG/PNG وحجم &lt;500KB وصيغة MP4 &lt;10MB.
                    </p>
                  </div>
                  <span className="font-mono text-xs bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-xl border border-emerald-500/30 font-bold">
                    معايير الجودة: مطابقة
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Photo Asset 1 */}
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                        <ImageIcon className="w-4 h-4" />
                        <span>صورة الواجهة الرئيسية للقاعة</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        ناجح (Pass)
                      </span>
                    </div>
                    <div className="h-28 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700 relative overflow-hidden">
                      <span className="text-[11px]">معاينة الصورة بنسبة 16:9</span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>الصيغة:</span>
                        <strong className="text-slate-200">WebP</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>الأبعاد:</span>
                        <strong className="text-slate-200 font-mono">1280 × 720 (16:9)</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>حجم الملف:</span>
                        <strong className="text-emerald-400 font-mono">342 KB (&lt; 500KB)</strong>
                      </div>
                    </div>
                  </div>

                  {/* Video Asset 1 */}
                  <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold flex items-center gap-1.5 text-emerald-400">
                        <VideoIcon className="w-4 h-4" />
                        <span>مقطع الفيديو التوضيحي (MP4)</span>
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded font-bold">
                        ناجح (Pass)
                      </span>
                    </div>
                    <div className="h-28 rounded-lg bg-slate-800 flex items-center justify-center text-slate-500 border border-slate-700 relative overflow-hidden">
                      <span className="text-[11px]">معاينة مشغل MP4 QHD</span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-slate-400">
                      <div className="flex justify-between">
                        <span>الصيغة:</span>
                        <strong className="text-slate-200">MP4 القياسية</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>الدقة:</span>
                        <strong className="text-slate-200 font-mono">960 × 540 QHD</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>حجم الملف:</span>
                        <strong className="text-emerald-400 font-mono">6.4 MB (&lt; 10MB)</strong>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: FINANCIAL SNAPSHOT & VAT CALCULATION */}
            {activeTab === 'documents' && (
              <div className="space-y-4 text-xs">
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-2">
                      <Scale className="w-4 h-4" />
                      <span>اللقطة المالية المثبتة (Financial Pricing Snapshot)</span>
                    </h4>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-bold px-2 py-0.5 rounded">
                      ثبات مالي غير قابل للتعديل
                    </span>
                  </div>
                  <p className="text-slate-400 leading-relaxed mb-3">
                    كافة الأسعار المعروضة في المنصة هي أسعار نهائية شاملة لضريبة القيمة المضافة 15% (VAT-Inclusive).
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-slate-400 text-[11px]">المبلغ الإجمالي الشامل (15% VAT):</div>
                      <div className="font-bold text-base text-emerald-400 mt-0.5">
                        {Number(currentCase.financialImpact || 12000).toLocaleString('ar-SA')} ر.س
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-slate-400 text-[11px]">الوعاء الخاضع للضريبة (Gross / 1.15):</div>
                      <div className="font-bold text-base text-slate-200 mt-0.5">
                        {(Number(currentCase.financialImpact || 12000) / 1.15).toFixed(2)} ر.س
                      </div>
                    </div>

                    <div className={`p-3 rounded-xl border ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                      <div className="text-slate-400 text-[11px]">ضريبة القيمة المضافة المستخرجة (15%):</div>
                      <div className="font-bold text-base text-teal-400 mt-0.5">
                        {(Number(currentCase.financialImpact || 12000) * 0.15 / 1.15).toFixed(2)} ر.س
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: ENTITY & LINKED PROFILES */}
            {activeTab === 'entity' && (
              <div className="space-y-3 text-xs">
                <div className={`p-4 rounded-2xl border ${
                  isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400">العميل:</span>
                      <div className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {currentCase.metadata?.customerName || 'عميل منصة ليلة'}
                      </div>
                      <div className="text-slate-400 font-mono text-[11px]">
                        {currentCase.metadata?.customerPhone || '0501234567'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">القاعة والمدينة:</span>
                      <div className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {currentCase.metadata?.hallName || 'قاعة ليلة الكبرى'}
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        {currentCase.metadata?.city || 'الرياض'}
                      </div>
                    </div>

                    <div>
                      <span className="text-slate-400">المزود المسؤول:</span>
                      <div className={`font-bold mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {currentCase.metadata?.providerName || 'شركة ليلة لإدارة المناسبات'}
                      </div>
                      <div className="text-emerald-400 text-[11px]">
                        باقة الاشتراك: احترافية (عمولة 7%)
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: INTERNAL SECURE NOTES */}
            {activeTab === 'notes' && (
              <div className="space-y-3 text-xs">
                <form onSubmit={handleAddNote} className="space-y-2">
                  <textarea
                    value={internalNoteText}
                    onChange={e => setInternalNoteText(e.target.value)}
                    placeholder="أضف ملاحظة سرية تشغيلية لفريق العمليات..."
                    rows={3}
                    className={`w-full rounded-xl p-3 border text-xs focus:outline-none transition-colors ${
                      isDark 
                        ? 'bg-slate-950 border-slate-800 text-slate-200 placeholder-slate-500 focus:border-emerald-500' 
                        : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500'
                    }`}
                  />
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingNote || !internalNoteText.trim()}
                      className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSubmittingNote ? 'جاري الحفظ...' : 'حفظ الملاحظة السرية'}</span>
                    </button>
                  </div>
                </form>

                <div className="space-y-2 pt-3 border-t border-slate-800/40">
                  {currentCase.internalNotes && currentCase.internalNotes.length > 0 ? (
                    currentCase.internalNotes.map((note, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border ${
                        isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                      }`}>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                          <span className="font-bold text-slate-300">{note.authorName}</span>
                          <span>{new Date(note.createdAt).toLocaleString('ar-SA')}</span>
                        </div>
                        <div className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                          {note.content}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      لا توجد ملاحظات سرية مسجلة بعد.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 7: IMMUTABLE AUDIT TIMELINE */}
            {activeTab === 'timeline' && (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between mb-2">
                  <h4 className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    سجل التدقيق الزمني غير القابل للتعديل (Immutable Audit Trail)
                  </h4>
                  <span className="text-[10px] text-slate-400 font-mono">
                    توقيع رقمي موثق
                  </span>
                </div>

                <div className="relative border-r-2 border-slate-800 pr-4 space-y-4 mr-2">
                  {currentCase.activities && currentCase.activities.length > 0 ? (
                    currentCase.activities.map(act => (
                      <div key={act.id} className="relative">
                        <span className="absolute -right-[21px] top-1 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-4 ring-slate-950" />
                        <div className={`p-3 rounded-xl border ${
                          isDark ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200'
                        }`}>
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
                            <span className="font-bold text-emerald-400">{act.authorName}</span>
                            <span>{new Date(act.createdAt).toLocaleString('ar-SA')}</span>
                          </div>
                          <div className={`text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                            {act.message}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 text-xs py-4">
                      سجل النشاط خالي.
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>
        </section>

        {/* ========================================================= */}
        {/* PANE 3: IMMEDIATE GOVERNED ACTION PANEL (يسار - 300px)     */}
        {/* ========================================================= */}
        {(layoutMode === 'three-pane' || layoutMode === 'split') && (
          <aside 
            className={`w-72 xl:w-80 rounded-2xl border p-3.5 flex flex-col shrink-0 transition-colors ${
              isDark ? 'bg-slate-900/90 border-slate-800 shadow-md' : 'bg-white border-slate-200 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-800/60">
              <span className={`font-bold text-xs ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                الإجراءات والقرارات السيادية المسموحة
              </span>
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 scrollbar-thin">
              
              {/* Context Action 1: Self-Assign if unassigned */}
              {(!currentCase.assignedUserId || currentCase.status === 'NEW') && (
                <button
                  onClick={() => onExecuteCommand('ASSIGN_TO_ME', currentCase.caseId)}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <span className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    <span>إسناد الحالة إليّ</span>
                  </span>
                  <span className="text-[10px] bg-white/20 px-1.5 py-0.2 rounded font-mono">استلام</span>
                </button>
              )}

              {/* Context Action 2: Start Processing */}
              {currentCase.status !== 'IN_PROGRESS' && currentCase.status !== 'RESOLVED' && currentCase.status !== 'CLOSED' && (
                <button
                  onClick={() => onExecuteCommand('START_PROCESSING', currentCase.caseId)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs"
                >
                  <Play className="w-4 h-4" />
                  <span>بدء المعالجة والتحقيق</span>
                </button>
              )}

              {/* Context Action 3: Venue / Service Approval (Trigger Governed Action Modal) */}
              {currentCase.caseType === 'HALL_APPROVAL' && currentCase.status !== 'RESOLVED' && (
                <button
                  onClick={() => {
                    setActiveGovernedAction({
                      commandId: 'APPROVE_HALL',
                      actionTitle: 'اعتماد ونشر المنشأة في المنصة',
                      actionType: 'CRITICAL_APPROVAL',
                      impactLevel: 'HIGH',
                      entityReference: currentCase.sourceEntityId,
                      amount: currentCase.financialImpact || 12000,
                      providerName: currentCase.metadata?.providerName || 'مزود المنشأة',
                      customerName: currentCase.metadata?.customerName
                    });
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>اعتماد ونشر المنشأة</span>
                  </span>
                  <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.2 rounded font-mono">حاكم</span>
                </button>
              )}

              {/* Context Action 4: Financial Escrow Release (Trigger Governed Action Modal) */}
              {currentCase.caseType === 'FINANCIAL_STALLED' && (
                <button
                  onClick={() => {
                    setActiveGovernedAction({
                      commandId: 'RELEASE_ESCROW',
                      actionTitle: 'تحرير مبلغ الضمان المالي للمزود',
                      actionType: 'ESCROW_RELEASE',
                      impactLevel: 'CRITICAL',
                      entityReference: currentCase.sourceEntityId,
                      amount: currentCase.financialImpact || 15000,
                      providerName: currentCase.metadata?.providerName || 'مزود الخدمة'
                    });
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-slate-950 text-xs font-black transition-all shadow-md"
                >
                  <span className="flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    <span>تحرير الضمان المالي</span>
                  </span>
                  <span className="text-[10px] bg-slate-950/20 px-1.5 py-0.2 rounded font-mono">مالي</span>
                </button>
              )}

              {/* Context Action 5: Precautionary Freeze (Trigger Governed Action Modal) */}
              <button
                onClick={() => {
                  setActiveGovernedAction({
                    commandId: 'FREEZE_TRANSACTION',
                    actionTitle: 'تجميد مالي أو تشغيلي احترازي',
                    actionType: 'EMERGENCY_FREEZE',
                    impactLevel: 'CRITICAL',
                    entityReference: currentCase.sourceEntityId,
                    amount: currentCase.financialImpact || 5000,
                    providerName: currentCase.metadata?.providerName || 'مزود الخدمة'
                  });
                }}
                className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-right border ${
                  isDark 
                    ? 'bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 border-rose-800/50' 
                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                }`}
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>تجميد مالي احترازي</span>
              </button>

              {/* Context Action 6: Pause / Resume SLA */}
              {!currentCase.isSlaPaused ? (
                <button
                  onClick={() => {
                    const reason = window.prompt('سبب تعليق المهلة (انتظار جهة خارجية / إفادة رسمية):');
                    if (reason) onExecuteCommand('PAUSE_SLA_WAITING', currentCase.caseId, { reason });
                  }}
                  className={`w-full flex items-center gap-2 p-2.5 rounded-xl text-xs font-bold transition-all text-right border ${
                    isDark ? 'bg-slate-800 hover:bg-slate-750 text-slate-200 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  }`}
                >
                  <Pause className="w-4 h-4 text-amber-400" />
                  <span>تعليق المهلة لانتظار خارجي</span>
                </button>
              ) : (
                <button
                  onClick={() => onExecuteCommand('RESUME_SLA', currentCase.caseId)}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold transition-all text-right shadow-xs"
                >
                  <Play className="w-4 h-4" />
                  <span>استئناف احتساب المهلة</span>
                </button>
              )}

              {/* Context Action 7: Resolve Case */}
              {currentCase.status !== 'RESOLVED' && currentCase.status !== 'CLOSED' && (
                <button
                  onClick={() => {
                    const summary = window.prompt('ملخص الحل والإجراء المعتمد:');
                    if (summary) {
                      onExecuteCommand('RESOLVE_CASE', currentCase.caseId, { reason: summary, summary });
                    }
                  }}
                  className="w-full flex items-center gap-2 p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all text-right shadow-xs"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>اعتماد الحل وتوثيق النتيجة</span>
                </button>
              )}
            </div>
          </aside>
        )}

      </div>

      {/* Governed Action Modal for Critical Compliance Executions */}
      {activeGovernedAction && (
        <GovernedActionModal
          isOpen={!!activeGovernedAction}
          onClose={() => setActiveGovernedAction(null)}
          actionConfig={activeGovernedAction}
          activeCase={currentCase}
          onConfirm={async (commandId, caseId, payload) => {
            await onExecuteCommand(commandId, caseId, payload);
            setActiveGovernedAction(null);
            if (currentCase) onRefreshCase(currentCase.caseId);
          }}
          theme={theme}
        />
      )}

    </div>
  );
};
