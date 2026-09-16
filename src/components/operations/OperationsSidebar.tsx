import React from 'react';
import { 
  Inbox, 
  UserCheck, 
  UserX, 
  Flame, 
  FileCheck2, 
  Calendar, 
  CreditCard, 
  Scale, 
  TrendingUp, 
  Clock, 
  Archive,
  ChevronRight,
  ChevronLeft,
  Layout,
  Terminal,
  RefreshCw,
  ExternalLink,
  Shield
} from 'lucide-react';
import { OperationalPulseCounts, OperationsMode, OpsTheme } from './types';

export interface OperationsSidebarItem {
  id: string;
  path: string;
  filter: string | null;
  label: string;
  icon: React.ElementType;
  countKey?: keyof OperationalPulseCounts;
  color: string;
  activeBg: string;
  permission?: string;
  badgeType?: 'danger' | 'warning' | 'info' | 'default';
}

interface OperationsSidebarProps {
  currentPath: string;
  activeFilter: string | null;
  currentMode: OperationsMode;
  counts: OperationalPulseCounts | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onNavigate: (path: string, filter: string | null, mode: OperationsMode) => void;
  onRunDiscovery?: () => void;
  isRunningDiscovery?: boolean;
  userRole?: string;
  activeCaseId?: string | null;
  theme?: OpsTheme;
}

export const OperationsSidebar: React.FC<OperationsSidebarProps> = ({
  currentPath,
  activeFilter,
  currentMode,
  counts,
  isCollapsed,
  onToggleCollapse,
  onNavigate,
  onRunDiscovery,
  isRunningDiscovery = false,
  userRole = 'admin',
  activeCaseId,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  // 11 sovereign sections according to prompt requirements
  const navigationItems: OperationsSidebarItem[] = [
    {
      id: 'inbox',
      path: '/operations/inbox',
      filter: null,
      label: 'صندوق العمل',
      icon: Inbox,
      countKey: 'totalActive',
      color: 'text-slate-700',
      activeBg: 'bg-slate-900 text-white shadow-xs'
    },
    {
      id: 'my-cases',
      path: '/operations/my-cases',
      filter: 'my-cases',
      label: 'الحالات المسندة إليّ',
      icon: UserCheck,
      countKey: 'assignedToMe',
      color: 'text-blue-600',
      activeBg: 'bg-blue-600 text-white shadow-xs'
    },
    {
      id: 'unassigned',
      path: '/operations/unassigned',
      filter: 'unassigned',
      label: 'الحالات غير المسندة',
      icon: UserX,
      countKey: 'unassigned',
      color: 'text-slate-600',
      activeBg: 'bg-slate-800 text-white shadow-xs'
    },
    {
      id: 'critical',
      path: '/operations/critical',
      filter: 'critical',
      label: 'الحالات الحرجة',
      icon: Flame,
      countKey: 'critical',
      color: 'text-rose-600',
      activeBg: 'bg-rose-600 text-white shadow-xs',
      badgeType: 'danger'
    },
    {
      id: 'approvals',
      path: '/operations/approvals',
      filter: 'approvals',
      label: 'الاعتمادات',
      icon: FileCheck2,
      countKey: 'pendingApprovals',
      color: 'text-amber-600',
      activeBg: 'bg-amber-600 text-white shadow-xs',
      permission: 'operations.approval.handle'
    },
    {
      id: 'bookings',
      path: '/operations/bookings',
      filter: 'bookings',
      label: 'الحجوزات والطلبات',
      icon: Calendar,
      countKey: 'bookingsAttention',
      color: 'text-indigo-600',
      activeBg: 'bg-indigo-600 text-white shadow-xs',
      permission: 'operations.booking_case.handle'
    },
    {
      id: 'financial',
      path: '/operations/financial',
      filter: 'financial',
      label: 'المالية والتسويات',
      icon: CreditCard,
      countKey: 'financialStalled',
      color: 'text-purple-600',
      activeBg: 'bg-purple-600 text-white shadow-xs',
      permission: 'operations.financial_case.view'
    },
    {
      id: 'disputes',
      path: '/operations/disputes',
      filter: 'disputes',
      label: 'النزاعات والشكاوى',
      icon: Scale,
      countKey: 'openDisputes',
      color: 'text-orange-600',
      activeBg: 'bg-orange-600 text-white shadow-xs',
      permission: 'operations.dispute.handle'
    },
    {
      id: 'escalations',
      path: '/operations/escalations',
      filter: 'escalations',
      label: 'التصعيدات',
      icon: TrendingUp,
      countKey: 'activeEscalations',
      color: 'text-red-700',
      activeBg: 'bg-red-700 text-white shadow-xs',
      badgeType: 'danger'
    },
    {
      id: 'sla',
      path: '/operations/sla',
      filter: 'sla',
      label: 'مراقبة مستوى الخدمة',
      icon: Clock,
      countKey: 'overdue',
      color: 'text-rose-500',
      activeBg: 'bg-rose-700 text-white shadow-xs'
    },
    {
      id: 'closed',
      path: '/operations/closed',
      filter: 'closed',
      label: 'الحالات المغلقة',
      icon: Archive,
      color: 'text-slate-500',
      activeBg: 'bg-slate-700 text-white shadow-xs'
    }
  ];

  // Helper to test if item is active
  const isItemActive = (item: OperationsSidebarItem) => {
    if (currentMode === 'workspace' || currentMode === 'command') return false;
    if (item.filter === null) {
      return activeFilter === null && (currentPath === '/operations' || currentPath === '/operations/inbox');
    }
    return activeFilter === item.filter || currentPath === item.path;
  };

  return (
    <aside 
      className={`border-l shrink-0 flex flex-col transition-all duration-300 z-30 select-none ${
        isDark 
          ? 'bg-slate-950 border-slate-850 text-slate-200' 
          : 'bg-white border-slate-200/80 text-slate-800'
      } ${
        isCollapsed ? 'w-18' : 'w-64'
      }`}
      dir="rtl"
    >
      {/* Sidebar Header / Brand Mini */}
      <div className={`p-4 border-b flex items-center justify-between gap-2 ${
        isDark ? 'border-slate-800/80' : 'border-slate-100'
      }`}>
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center text-xs font-black shadow-xs">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <div className={`text-xs font-extrabold tracking-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>أقسام العمليات</div>
              <div className="text-[10px] text-slate-400 font-medium">الوصول الميداني المباشر</div>
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className={`p-1.5 rounded-lg transition-colors mr-auto ${
            isDark ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800' : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
          }`}
          title={isCollapsed ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'}
        >
          {isCollapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Main Navigation (11 Sovereign Sections) */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
        {navigationItems.map((item) => {
          const active = isItemActive(item);
          const Icon = item.icon;
          const count = item.countKey && counts ? counts[item.countKey] : 0;

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.path, item.filter, 'exceptions')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all group relative ${
                active 
                  ? item.activeBg 
                  : isDark 
                    ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' 
                    : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : item.color}`} />
              
              {!isCollapsed && (
                <span className="flex-1 text-right truncate">
                  {item.label}
                </span>
              )}

              {!isCollapsed && count !== undefined && count > 0 && (
                <span 
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-black ${
                    active 
                      ? 'bg-white/20 text-white' 
                      : item.badgeType === 'danger'
                        ? 'bg-rose-900/50 text-rose-300 border border-rose-800'
                        : isDark ? 'bg-slate-850 text-slate-300' : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              )}

              {/* Collapsed Badge Dot Indicator */}
              {isCollapsed && count !== undefined && count > 0 && (
                <span className="absolute top-1.5 left-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-slate-900" />
              )}
            </button>
          );
        })}
      </div>

      {/* Secondary Quick Workspaces */}
      <div className={`p-2 border-t space-y-1 ${isDark ? 'border-slate-800/80' : 'border-slate-100'}`}>
        {/* Contextual Workspace Direct Link */}
        <button
          onClick={() => onNavigate('/operations/workspace' + (activeCaseId ? `/${activeCaseId}` : ''), null, 'workspace')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentMode === 'workspace'
              ? 'bg-teal-600 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={isCollapsed ? 'مساحة العمل السياقية' : undefined}
        >
          <Layout className={`w-4 h-4 shrink-0 ${currentMode === 'workspace' ? 'text-white' : 'text-teal-400'}`} />
          {!isCollapsed && (
            <div className="flex-1 text-right flex items-center justify-between">
              <span>مساحة العمل السياقية</span>
              {activeCaseId && (
                <span className="font-mono text-[10px] bg-teal-900/60 text-teal-300 border border-teal-700 px-1.5 py-0.2 rounded font-normal">
                  نشطة
                </span>
              )}
            </div>
          )}
        </button>

        {/* Command & Search Link */}
        <button
          onClick={() => onNavigate('/operations/command', null, 'command')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
            currentMode === 'command'
              ? 'bg-slate-800 text-white shadow-xs'
              : isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
          title={isCollapsed ? 'شريط الأوامر والبحث' : undefined}
        >
          <Terminal className={`w-4 h-4 shrink-0 ${currentMode === 'command' ? 'text-white' : 'text-amber-400'}`} />
          {!isCollapsed && (
            <span className="flex-1 text-right truncate">شريط الأوامر والبحث</span>
          )}
        </button>

        {/* Trigger Automated Discovery */}
        {onRunDiscovery && (
          <button
            onClick={onRunDiscovery}
            disabled={isRunningDiscovery}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-bold transition-colors ${
              isDark ? 'text-slate-400 hover:bg-slate-900 hover:text-slate-200' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
            title={isCollapsed ? 'فحص الاستثناءات الآلي' : undefined}
          >
            <RefreshCw className={`w-4 h-4 shrink-0 text-amber-500 ${isRunningDiscovery ? 'animate-spin' : ''}`} />
            {!isCollapsed && (
              <span className="flex-1 text-right truncate">
                {isRunningDiscovery ? 'جاري الفحص...' : 'فحص الاستثناءات'}
              </span>
            )}
          </button>
        )}
      </div>

      {/* Footer / Link to Dashboard */}
      <div className={`p-3 border-t ${isDark ? 'border-slate-800/80 bg-slate-950' : 'border-slate-100 bg-slate-50/70'}`}>
        <a
          href="/dashboard"
          className={`flex items-center gap-2 px-3 py-2 text-xs font-bold rounded-xl border transition-all shadow-2xs ${
            isDark 
              ? 'text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border-slate-800' 
              : 'text-slate-700 hover:text-slate-900 hover:bg-white border-slate-200/80'
          }`}
          title={isCollapsed ? 'لوحة الإدارة الشاملة' : undefined}
        >
          <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          {!isCollapsed && (
            <span className="truncate">فتح لوحة الإدارة الشاملة</span>
          )}
        </a>
      </div>
    </aside>
  );
};
