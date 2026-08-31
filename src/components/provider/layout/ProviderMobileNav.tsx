import React from 'react';
import { Sliders, ChevronDown, Activity, LayoutGrid, Inbox, CheckSquare, Package, Wallet, Building2 } from 'lucide-react';

interface ProviderMobileNavProps {
  osTab: string;
  setOsTab: (tab: any) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  profileBusinessName?: string;
}

export const ProviderMobileNav: React.FC<ProviderMobileNavProps> = ({
  osTab,
  setOsTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  profileBusinessName = 'لوحة قيادة المزود',
}) => {
  const quickTabs = [
    { id: 'overview', label: 'الرئيسية', icon: Activity },
    { id: 'floorplan', label: 'مخطط 360°', icon: LayoutGrid },
    { id: 'ops_center', label: 'التشغيل', icon: Sliders },
    { id: 'orders', label: 'الطلبات', icon: Inbox },
    { id: 'bookings', label: 'الحجوزات', icon: CheckSquare },
    { id: 'catalog', label: 'الكتالوج والقاعات', icon: Package },
    { id: 'finance', label: 'المالية', icon: Wallet },
    { id: 'profile', label: 'الهوية والفروع', icon: Building2 },
  ];

  return (
    <div className="lg:hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
            <Sliders className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
              {profileBusinessName || 'لوحة قيادة المزود'}
            </div>
            <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
              <span>Lailah Workspace Mobile</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm"
        >
          <Sliders className="w-3.5 h-3.5 text-indigo-300" />
          <span>{isMobileMenuOpen ? 'إغلاق القائمة' : 'جميع الأقسام'}</span>
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Quick Horizontal Scroll Pills on Mobile */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-black -mx-1 px-1">
        {quickTabs.map((mTab) => {
          const MIcon = mTab.icon;
          const isCurrent = osTab === mTab.id;
          return (
            <button
              key={mTab.id}
              onClick={() => {
                setOsTab(mTab.id);
                setIsMobileMenuOpen(false);
              }}
              className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                isCurrent
                  ? 'bg-indigo-600 text-white shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              <MIcon className="w-3.5 h-3.5" />
              <span>{mTab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
