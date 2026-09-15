import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  ChevronLeft,
  Menu,
  X,
  ChevronRight,
  ShieldAlert,
  Flame,
  Terminal,
  Layout,
  Layers,
  Sparkles
} from 'lucide-react';
import { OperationsMode, OperationalPulseCounts } from './types';
import { OperationsSidebar } from './OperationsSidebar';

interface OperationsShellProps {
  currentMode: OperationsMode;
  onSelectMode: (mode: OperationsMode) => void;
  currentPath: string;
  activeFilter: string | null;
  counts: OperationalPulseCounts | null;
  isLoading: boolean;
  onRefresh: () => void;
  lastUpdated: Date;
  onOpenCommandPalette: () => void;
  onNavigate: (path: string, filter: string | null, mode: OperationsMode) => void;
  onRunDiscovery?: () => void;
  isRunningDiscovery?: boolean;
  children: React.ReactNode;
  activeCaseId?: string | null;
  userRole?: string;
  userName?: string;
}

export const OperationsShell: React.FC<OperationsShellProps> = ({
  currentMode,
  onSelectMode,
  currentPath,
  activeFilter,
  counts,
  isLoading,
  onRefresh,
  lastUpdated,
  onOpenCommandPalette,
  onNavigate,
  onRunDiscovery,
  isRunningDiscovery = false,
  children,
  activeCaseId,
  userRole = 'مشرف العمليات',
  userName = 'عبدالله السبيعي'
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Derive human-readable breadcrumb label
  const getFilterLabel = () => {
    if (currentMode === 'command') return 'شريط الأوامر والبحث التشغيلي';
    if (currentMode === 'workspace') return 'مساحة العمل السياقية';
    switch (activeFilter) {
      case 'critical': return 'الحالات الحرجة';
      case 'high': return 'حالات عالية الأولوية';
      case 'my-cases': return 'الحالات المسندة إليّ';
      case 'unassigned': return 'الحالات غير المسندة';
      case 'approvals': return 'الاعتمادات السيادية';
      case 'bookings': return 'الحجوزات وطلبات الخدمات';
      case 'financial': return 'المالية والتسويات المعلقة';
      case 'disputes': return 'النزاعات والشكاوى';
      case 'escalations': return 'التصعيدات الميدانية';
      case 'sla': return 'مراقبة مستوى الخدمة (SLA)';
      case 'closed': return 'سجل الحالات المغلقة';
      default: return 'صندوق العمل العام';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800 selection:bg-primary/20" dir="rtl">
      {/* Top Header - Sovereign Operations Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-2xs">
        <div className="w-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          
          {/* Right: Mobile Hamburger & Logo / Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl"
              title="القائمة الجانبية"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => onNavigate('/operations/inbox', null, 'exceptions')}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-950 to-slate-800 flex items-center justify-center text-white shadow-md shadow-slate-900/10 border border-slate-700">
                <Activity className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-base text-slate-950 tracking-tight">ليلة</span>
                  <span className="text-[10px] font-black bg-slate-900 text-amber-400 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                    مركز العمليات السياقي
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium -mt-0.5">
                  منظومة التدخل والاستثناءات الميدانية
                </div>
              </div>
            </div>
          </div>

          {/* Center: Dynamic Breadcrumbs Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 text-xs text-slate-500 font-medium bg-slate-100/70 px-3 py-1.5 rounded-xl border border-slate-200/60 max-w-xl truncate">
            <button 
              onClick={() => onNavigate('/operations/inbox', null, 'exceptions')}
              className="text-slate-600 hover:text-slate-900 font-bold transition-colors"
            >
              مركز العمليات
            </button>
            <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="text-slate-800 font-semibold truncate">
              {getFilterLabel()}
            </span>
            {activeCaseId && (
              <>
                <ChevronLeft className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 truncate">
                  {activeCaseId}
                </span>
              </>
            )}
          </nav>

          {/* Quick Search Trigger (Ctrl+K) */}
          <div className="hidden lg:flex items-center flex-1 max-w-xs mx-2">
            <button
              onClick={onOpenCommandPalette}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-slate-100/80 hover:bg-slate-200/70 border border-slate-200 rounded-xl text-xs text-slate-500 transition-colors"
            >
              <span className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <span>بحث سريع أو كتابة أمر...</span>
              </span>
              <kbd className="font-mono text-[10px] bg-white text-slate-500 px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                ⌘K
              </kbd>
            </button>
          </div>

          {/* Left: Live Status, Refresh, Link to Dashboard, User Profile */}
          <div className="flex items-center gap-2.5">
            {/* Live Pulse Dot */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>مباشر</span>
            </div>

            {/* Refresh Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title={`آخر تحديث: ${lastUpdated.toLocaleTimeString('ar-SA')}`}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-primary' : 'text-slate-500'}`} />
              <span className="hidden xl:inline text-[11px] text-slate-500">
                {isLoading ? 'جاري التحديث...' : `تحديث ${lastUpdated.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`}
              </span>
            </button>

            {/* Mobile Search Button */}
            <button
              onClick={onOpenCommandPalette}
              className="lg:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
              title="البحث والأوامر (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Link to Dashboard for authorized managers */}
            <a
              href="/dashboard"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 rounded-lg transition-colors"
              title="الانتقال إلى لوحة الإدارة الشاملة"
            >
              <span>لوحة الإدارة</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-1 border-r border-slate-200 pr-2">
              <div className="w-8 h-8 rounded-full bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-inner">
                {userName.charAt(0)}
              </div>
              <div className="hidden md:block text-right">
                <div className="text-xs font-bold text-slate-900 leading-tight">{userName}</div>
                <div className="text-[10px] text-slate-500 font-medium leading-tight">{userRole}</div>
              </div>
            </div>
          </div>

        </div>

        {/* 3 Interconnected Unified Models Navigation Buttons Bar */}
        <div className="bg-slate-50/95 border-t border-slate-200/80 px-3 sm:px-6 py-2">
          <nav 
            id="operations-unified-models-nav"
            aria-label="النماذج التشغيلية الموحدة لمركز العمليات" 
            className="grid grid-cols-1 md:grid-cols-3 gap-2 sm:gap-3 max-w-[1720px] mx-auto"
          >
            {/* Model 1: Exceptions-Based Management */}
            <button
              id="btn-model-exceptions"
              type="button"
              onClick={() => onSelectMode('exceptions')}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                currentMode === 'exceptions'
                  ? 'bg-white border-amber-500/80 shadow-xs ring-2 ring-amber-500/20 text-slate-900'
                  : 'bg-white/60 hover:bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                currentMode === 'exceptions' 
                  ? 'bg-amber-500 text-white shadow-xs' 
                  : 'bg-amber-50 text-amber-600 border border-amber-200/60'
              }`}>
                <Flame className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="font-extrabold text-xs sm:text-sm truncate">
                    1. الإدارة المبنية على الاستثناءات
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                    currentMode === 'exceptions'
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {counts?.critical ? `${counts.critical} حرجة` : `${counts?.totalActive || 0} نشطة`}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  لاكتشاف الحالات وترتيب أولوياتها
                </div>
              </div>

              {currentMode === 'exceptions' && (
                <span className="hidden sm:block absolute -top-1 right-1/2 translate-x-1/2 w-8 h-1 bg-amber-500 rounded-full" />
              )}
            </button>

            {/* Model 2: Comprehensive Search & Operational Commands */}
            <button
              id="btn-model-command"
              type="button"
              onClick={() => onSelectMode('command')}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                currentMode === 'command'
                  ? 'bg-white border-slate-900 shadow-xs ring-2 ring-slate-900/20 text-slate-900'
                  : 'bg-white/60 hover:bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                currentMode === 'command' 
                  ? 'bg-slate-950 text-white shadow-xs' 
                  : 'bg-slate-100 text-slate-700 border border-slate-200/80'
              }`}>
                <Terminal className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="font-extrabold text-xs sm:text-sm truncate">
                    2. البحث والأوامر التشغيلية الشاملة
                  </span>
                  <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded-md font-bold shrink-0 ${
                    currentMode === 'command'
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    ⌘K
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  للوصول السريع وبدء إجراء مسموح
                </div>
              </div>

              {currentMode === 'command' && (
                <span className="hidden sm:block absolute -top-1 right-1/2 translate-x-1/2 w-8 h-1 bg-slate-950 rounded-full" />
              )}
            </button>

            {/* Model 3: Existing Contextual Workspace */}
            <button
              id="btn-model-workspace"
              type="button"
              onClick={() => onSelectMode('workspace')}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl border text-right transition-all cursor-pointer relative ${
                currentMode === 'workspace'
                  ? 'bg-white border-blue-600 shadow-xs ring-2 ring-blue-600/20 text-slate-900'
                  : 'bg-white/60 hover:bg-white border-slate-200/80 text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                currentMode === 'workspace' 
                  ? 'bg-blue-600 text-white shadow-xs' 
                  : 'bg-blue-50 text-blue-600 border border-blue-200/60'
              }`}>
                <Layout className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1.5 mb-0.5">
                  <span className="font-extrabold text-xs sm:text-sm truncate">
                    3. مساحة العمل السياقية
                  </span>
                  {activeCaseId ? (
                    <span className="font-mono text-[10px] bg-blue-100 text-blue-900 px-1.5 py-0.2 rounded font-bold shrink-0 truncate max-w-[90px]">
                      {activeCaseId}
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.2 rounded shrink-0">
                      معالجة الحالة
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 font-medium truncate">
                  لفهم الحالة ومعالجتها وتوثيق القرار
                </div>
              </div>

              {currentMode === 'workspace' && (
                <span className="hidden sm:block absolute -top-1 right-1/2 translate-x-1/2 w-8 h-1 bg-blue-600 rounded-full" />
              )}
            </button>
          </nav>
        </div>
      </header>

      {/* Body Area with Sidebar and Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Independent Operations Sidebar */}
        <div className="hidden lg:block">
          <OperationsSidebar
            currentPath={currentPath}
            activeFilter={activeFilter}
            currentMode={currentMode}
            counts={counts}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            onNavigate={onNavigate}
            onRunDiscovery={onRunDiscovery}
            isRunningDiscovery={isRunningDiscovery}
            userRole={userRole}
            activeCaseId={activeCaseId}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" dir="rtl">
            <div 
              className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity" 
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className="relative w-72 max-w-[80vw] bg-white h-full shadow-2xl flex flex-col z-10">
              <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                <div className="font-bold text-slate-900 text-sm">أقسام مركز العمليات</div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                <OperationsSidebar
                  currentPath={currentPath}
                  activeFilter={activeFilter}
                  currentMode={currentMode}
                  counts={counts}
                  isCollapsed={false}
                  onToggleCollapse={() => setIsMobileSidebarOpen(false)}
                  onNavigate={(path, filter, mode) => {
                    setIsMobileSidebarOpen(false);
                    onNavigate(path, filter, mode);
                  }}
                  onRunDiscovery={onRunDiscovery}
                  isRunningDiscovery={isRunningDiscovery}
                  userRole={userRole}
                  activeCaseId={activeCaseId}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <main className="flex-1 p-3 sm:p-5 max-w-[1720px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
