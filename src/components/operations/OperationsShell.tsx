import React, { useState } from 'react';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  ExternalLink, 
  ChevronLeft,
  Menu,
  X,
  ShieldAlert, 
  Terminal, 
  Layout, 
  Sparkles,
  Sun,
  Moon,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Lock,
  Layers,
  Shield
} from 'lucide-react';
import { OperationsMode, OperationalPulseCounts, OpsTheme } from './types';
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
  theme?: OpsTheme;
  onToggleTheme?: () => void;
  onQuickSearch?: (query: string) => void;
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
  userRole = 'مشرف العمليات والرقابة السيادية',
  userName = 'عبدالله السبيعي',
  theme = 'dark',
  onToggleTheme,
  onQuickSearch
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [headerSearchQuery, setHeaderSearchQuery] = useState('');

  const isDark = theme === 'dark';

  // Human-readable breadcrumb label
  const getFilterLabel = () => {
    if (currentMode === 'pulse') return 'نبض العمليات الحي (Radar)';
    if (currentMode === 'command') return 'شريط الأوامر والبحث التشغيلي (⌘K)';
    if (currentMode === 'workspace') return 'مساحة العمل السياقية المتعمقة';
    switch (activeFilter) {
      case 'critical': return 'الحالات الحرجة (Critical)';
      case 'high': return 'حالات عالية الأولوية';
      case 'my-cases': return 'الحالات المسندة إليّ';
      case 'unassigned': return 'الحالات غير المسندة';
      case 'approvals': return 'اعتمادات المنشآت والخدمات';
      case 'bookings': return 'حجوزات القاعات (BKG-26)';
      case 'financial': return 'الضمانات المالية والفواتير (INV-26)';
      case 'disputes': return 'النزاعات والشكاوى';
      case 'escalations': return 'التصعيدات الميدانية';
      case 'sla': return 'مراقبة مستوى الخدمة (SLA)';
      case 'closed': return 'سجل الحالات المغلقة';
      default: return 'صندوق العمل العام';
    }
  };

  const handleHeaderSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!headerSearchQuery.trim()) {
      onOpenCommandPalette();
      return;
    }
    if (onQuickSearch) {
      onQuickSearch(headerSearchQuery);
    } else {
      onOpenCommandPalette();
    }
  };

  return (
    <div 
      className={`min-h-screen flex flex-col font-sans transition-colors duration-200 selection:bg-emerald-500/20 ${
        isDark 
          ? 'bg-slate-950 text-slate-100' 
          : 'bg-slate-50 text-slate-800'
      }`} 
      dir="rtl"
    >
      {/* SECTION 1: Fixed 64px Master Header & Control Bar */}
      <header 
        className={`sticky top-0 z-40 h-16 backdrop-blur-md border-b transition-colors ${
          isDark 
            ? 'bg-slate-950/90 border-slate-800/80 shadow-lg shadow-black/20' 
            : 'bg-white/95 border-slate-200/80 shadow-2xs'
        }`}
      >
        <div className="w-full h-full px-3 sm:px-5 flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Right Section: Mobile Menu + Brand Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
              className={`lg:hidden p-2 rounded-xl transition-colors ${
                isDark ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-slate-100'
              }`}
              title="القائمة الجانبية"
            >
              {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            {/* Glowing Emerald Hexagon / Activity Icon & Brand */}
            <div 
              className="flex items-center gap-2.5 cursor-pointer group select-none" 
              onClick={() => onSelectMode('pulse')}
              title="الانتقال إلى نبض العمليات"
            >
              <div className="relative flex items-center justify-center">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-slate-900 to-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-md shadow-emerald-950/30 group-hover:border-emerald-400 transition-all">
                  <Activity className="w-4.5 h-4.5 text-emerald-400 group-hover:scale-110 transition-transform" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 ring-2 ring-slate-950 animate-pulse" />
              </div>

              <div>
                <div className="flex items-center gap-1.5">
                  <span className={`font-black text-base tracking-tight ${isDark ? 'text-white' : 'text-slate-950'}`}>
                    ليلة
                  </span>
                  <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.2 rounded-md uppercase tracking-wider">
                    مركز العمليات
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-slate-400 font-mono -mt-0.5">
                  <span className="text-emerald-500 font-bold">LOS v2.5</span>
                  <span className="opacity-40">•</span>
                  <span>التحكم السيادي</span>
                </div>
              </div>
            </div>
          </div>

          {/* Center-Right: 4-Mode Persistent Switcher */}
          <nav 
            id="operations-4-mode-switcher" 
            aria-label="أوضاع مركز العمليات الأربعة"
            className={`hidden xl:flex items-center p-1 rounded-xl border ${
              isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-slate-100 border-slate-200'
            }`}
          >
            {/* Mode 1: Operational Pulse */}
            <button
              onClick={() => onSelectMode('pulse')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentMode === 'pulse'
                  ? isDark
                    ? 'bg-emerald-500 text-slate-950 shadow-sm font-black'
                    : 'bg-white text-emerald-800 shadow-xs ring-1 ring-emerald-500/30 font-black'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>نبض العمليات</span>
            </button>

            {/* Mode 2: Exceptions Center */}
            <button
              onClick={() => onSelectMode('exceptions')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentMode === 'exceptions'
                  ? isDark
                    ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                    : 'bg-white text-amber-900 shadow-xs ring-1 ring-amber-500/30 font-black'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>مركز الاستثناءات</span>
              {counts && counts.critical > 0 && (
                <span className={`inline-flex items-center gap-1 font-mono text-[10px] px-1.5 py-0.2 rounded font-black ${
                  currentMode === 'exceptions'
                    ? 'bg-slate-950/20 text-slate-950'
                    : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                }`}>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span>{counts.critical} حرج</span>
                </span>
              )}
            </button>

            {/* Mode 3: Omni-Command & Search */}
            <button
              onClick={() => onSelectMode('command')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentMode === 'command'
                  ? isDark
                    ? 'bg-teal-500 text-slate-950 shadow-sm font-black'
                    : 'bg-white text-teal-900 shadow-xs ring-1 ring-teal-500/30 font-black'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>البحث والأوامر</span>
              <kbd className={`font-mono text-[9px] px-1 py-0.2 rounded border ${
                isDark ? 'bg-slate-950 text-teal-300 border-slate-700' : 'bg-slate-200 text-slate-700 border-slate-300'
              }`}>
                ⌘K
              </kbd>
            </button>

            {/* Mode 4: Contextual Workspace */}
            <button
              onClick={() => onSelectMode('workspace')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentMode === 'workspace'
                  ? isDark
                    ? 'bg-blue-500 text-white shadow-sm font-black'
                    : 'bg-white text-blue-900 shadow-xs ring-1 ring-blue-500/30 font-black'
                  : isDark
                    ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <Layout className="w-3.5 h-3.5" />
              <span>مساحة العمل</span>
              {activeCaseId && (
                <span className="font-mono text-[10px] px-1.5 py-0.2 rounded bg-blue-950 text-blue-300 border border-blue-700 font-bold truncate max-w-[80px]">
                  {activeCaseId}
                </span>
              )}
            </button>
          </nav>

          {/* Center: Instant Omni-Search Field */}
          <form 
            onSubmit={handleHeaderSearchSubmit}
            className="hidden md:flex items-center flex-1 max-w-md mx-2"
          >
            <div 
              onClick={onOpenCommandPalette}
              className={`w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl border text-xs cursor-pointer transition-all ${
                isDark
                  ? 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-300'
                  : 'bg-slate-100 hover:bg-slate-200/80 border-slate-200 text-slate-500'
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="truncate text-xs">
                  بحث فوري بالمعرفات الرسمية (BKG-26 / SRV-26 / INV-26)...
                </span>
              </div>
              <div className="flex items-center gap-1 shrink-0 font-mono text-[10px]">
                <kbd className={`px-1.5 py-0.5 rounded border shadow-2xs ${
                  isDark ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'
                }`}>
                  ⌘K
                </kbd>
              </div>
            </div>
          </form>

          {/* Left: Quick Tools & Specialist Profile */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            
            {/* Live Indicator Dot */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${
              isDark 
                ? 'bg-emerald-950/40 text-emerald-400 border-emerald-800/60' 
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
            }`}>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>مباشر</span>
            </div>

            {/* Refresh / Data Sync Button */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              title={`آخر تحديث: ${lastUpdated.toLocaleTimeString('ar-SA')}`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80'
              }`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : 'text-slate-400'}`} />
              <span className="hidden 2xl:inline text-[11px] text-slate-400 font-mono">
                {isLoading ? 'مزامنة...' : lastUpdated.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </button>

            {/* Theme Toggle Button (Sun / Moon) */}
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className={`p-2 rounded-xl border transition-colors ${
                  isDark 
                    ? 'bg-slate-900 border-slate-800 text-amber-400 hover:bg-slate-800 hover:text-amber-300' 
                    : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200/80'
                }`}
                title={isDark ? 'التحويل للوضع الفاتح (Light Mode)' : 'التحويل للوضع الداكن الميداني (Deep Slate Dark Ops)'}
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>
            )}

            {/* Mobile Search Button */}
            <button
              onClick={onOpenCommandPalette}
              className={`md:hidden p-2 rounded-xl border ${
                isDark ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
              }`}
              title="البحث والأوامر (⌘K)"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Link to Standard Dashboard */}
            <a
              href="/dashboard"
              className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors ${
                isDark 
                  ? 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800' 
                  : 'bg-slate-100 border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-200/80'
              }`}
              title="الانتقال إلى لوحة الإدارة الشاملة"
            >
              <span>لوحة الإدارة</span>
              <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
            </a>

            {/* Ops Specialist Avatar & Identity */}
            <div className={`flex items-center gap-2 pl-1 border-r pr-2 ${
              isDark ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="relative">
                <div className="w-8 h-8 rounded-full bg-slate-900 text-emerald-400 border border-emerald-500/40 font-bold flex items-center justify-center text-xs shadow-inner">
                  {userName.charAt(0)}
                </div>
                <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-400 ring-1.5 ring-slate-950" />
              </div>
              <div className="hidden lg:block text-right">
                <div className={`text-xs font-bold leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                  {userName}
                </div>
                <div className="text-[10px] text-emerald-400 font-medium leading-tight">
                  متصل • وصول سيادي
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* Mobile Sub-Navigation Bar for 4 Modes */}
        <div className={`xl:hidden flex items-center gap-1.5 px-3 py-1.5 border-t overflow-x-auto scrollbar-none ${
          isDark ? 'bg-slate-950 border-slate-850' : 'bg-slate-50 border-slate-200'
        }`}>
          <button
            onClick={() => onSelectMode('pulse')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
              currentMode === 'pulse' 
                ? 'bg-emerald-500 text-slate-950' 
                : isDark ? 'text-slate-400 bg-slate-900' : 'text-slate-600 bg-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>نبض العمليات</span>
          </button>

          <button
            onClick={() => onSelectMode('exceptions')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
              currentMode === 'exceptions' 
                ? 'bg-amber-500 text-slate-950' 
                : isDark ? 'text-slate-400 bg-slate-900' : 'text-slate-600 bg-white'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>مركز الاستثناءات</span>
          </button>

          <button
            onClick={() => onSelectMode('command')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
              currentMode === 'command' 
                ? 'bg-teal-500 text-slate-950' 
                : isDark ? 'text-slate-400 bg-slate-900' : 'text-slate-600 bg-white'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>الأوامر ⌘K</span>
          </button>

          <button
            onClick={() => onSelectMode('workspace')}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 ${
              currentMode === 'workspace' 
                ? 'bg-blue-500 text-white' 
                : isDark ? 'text-slate-400 bg-slate-900' : 'text-slate-600 bg-white'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>مساحة العمل</span>
          </button>
        </div>
      </header>

      {/* Body Area with Sidebar and Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Desktop Operations Sidebar */}
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
            theme={theme}
          />
        </div>

        {/* Mobile Sidebar Drawer */}
        {isMobileSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden flex" dir="rtl">
            <div 
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs transition-opacity" 
              onClick={() => setIsMobileSidebarOpen(false)}
            />
            <div className={`relative w-72 max-w-[80vw] h-full shadow-2xl flex flex-col z-10 ${
              isDark ? 'bg-slate-950 border-l border-slate-800' : 'bg-white border-l border-slate-200'
            }`}>
              <div className={`p-4 border-b flex items-center justify-between ${
                isDark ? 'border-slate-800' : 'border-slate-200'
              }`}>
                <div className={`font-bold text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  أقسام مركز العمليات
                </div>
                <button 
                  onClick={() => setIsMobileSidebarOpen(false)}
                  className={`p-1 rounded-lg ${
                    isDark ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                  }`}
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
                  theme={theme}
                />
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0">
          <main className="flex-1 p-3 sm:p-6 max-w-[1720px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
};
