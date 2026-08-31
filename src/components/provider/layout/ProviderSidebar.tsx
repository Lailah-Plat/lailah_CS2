import React, { useState } from 'react';
import {
  Sliders,
  Search,
  Activity,
  LayoutGrid,
  CheckSquare,
  Package,
  Inbox,
  Boxes,
  Wallet,
  Award,
  Megaphone,
  ShieldAlert,
  Building2,
  FileSpreadsheet,
  ChevronDown,
  Sparkles,
  CreditCard,
  Clock,
  Star,
} from 'lucide-react';

interface ProviderSidebarProps {
  osTab: string;
  setOsTab: (tab: any) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  liveNotifications?: any[];
}

export const ProviderSidebar: React.FC<ProviderSidebarProps> = ({
  osTab,
  setOsTab,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  liveNotifications = [],
}) => {
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [expandedDomains, setExpandedDomains] = useState<{ [key: string]: boolean }>({
    extra_tools: false,
  });

  const domainGroups = [
    {
      categoryName: '1. العمليات والقيادة',
      items: [
        { id: 'overview', name: 'مركز القيادة والعمليات الموحد', desc: 'أحداث اليوم والاتصال والتأكيد الميداني', icon: Activity, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { id: 'floorplan', name: 'مخطط القاعة والتوزيع 360°', desc: 'حاسبة السعة وتوزيع الطاولات والـ VIP وبطاقات QR', icon: LayoutGrid, color: 'text-indigo-600 bg-indigo-50 border-indigo-100' },
        { id: 'bookings', name: 'إدارة الحجوزات والطلبات', desc: 'تتبع الحجوزات بالسيريال BKG-26 و SRV-26', icon: CheckSquare, color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
      ],
    },
    {
      categoryName: '2. إدارة المنشأة والخدمات',
      items: [
        { id: 'catalog', name: 'إدارة القاعات والكتالوج', desc: 'معروضات المنشأة وتوثيق الوسائط', icon: Package, color: 'text-purple-600 bg-purple-50 border-purple-100' },
        { id: 'orders', name: 'الخدمات المساندة والمستقلة', desc: 'إدارة طلبات الضيافة والتجهيزات', icon: Inbox, color: 'text-rose-600 bg-rose-50 border-rose-100' },
        { id: 'inventory', name: 'المخزون والموردين', desc: 'متابعة المستلزمات والعهود الميدانية', icon: Boxes, color: 'text-amber-600 bg-amber-50 border-amber-100' },
      ],
    },
    {
      categoryName: '3. المركز المالي والأداء',
      items: [
        { id: 'finance', name: 'المركز المالي وحساب الضمان', desc: 'إجمالي الأرباح وعربين الضمان والمسحوبات', icon: Wallet, color: 'text-cyan-600 bg-cyan-50 border-cyan-100' },
        { id: 'subscription', name: 'باقات الاشتراك والعمولة', desc: 'ترقية الاشتراك والعمولة المقتطعة', icon: Award, color: 'text-yellow-600 bg-yellow-50 border-yellow-100' },
        { id: 'marketing', name: 'مركز النمو والتسويق', desc: 'الحملات الإعلانية والخصومات الترويجية ومحرك النمو', icon: Megaphone, color: 'text-fuchsia-600 bg-fuchsia-50 border-fuchsia-100' },
      ],
    },
    {
      categoryName: '4. التواصل والدعم',
      items: [
        { id: 'notifications', name: 'الرسائل والدعم الفني', desc: 'الدردشة المباشرة وتذاكر المساعدة', icon: ShieldAlert, color: 'text-red-600 bg-red-50 border-red-100' },
        { id: 'profile', name: 'بيانات المنشأة والهوية', desc: 'معلومات الفروع والكوادر الميدانية', icon: Building2, color: 'text-blue-600 bg-blue-50 border-blue-100' },
        { id: 'reports', name: 'التقارير الشاملة وسجل النشاط', desc: 'ملخصات الأداء والسجلات الميدانية', icon: FileSpreadsheet, color: 'text-sky-600 bg-sky-50 border-sky-100' },
      ],
    },
  ];

  return (
    <div className={`lg:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 h-fit lg:sticky lg:top-24 lg:max-h-[85vh] lg:overflow-y-auto scrollbar-none transition-all duration-300 ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
      {/* Sidebar Header */}
      <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
        <span className="text-[10px] font-black text-indigo-600 font-mono tracking-wider">UNIFIED PROVIDER WORKSPACE</span>
        <h4 className="text-sm font-black text-slate-800 dark:text-slate-100 mt-1 flex items-center gap-1.5 justify-end">
          <span>مساحة عمل المزود الموحدة</span>
          <Sliders className="w-4 h-4 text-indigo-600" />
        </h4>
      </div>

      {/* Dynamic Instant Tab Search */}
      <div className="relative">
        <input
          type="text"
          placeholder="بحث سريع في الأقسام..."
          value={sidebarSearch}
          onChange={(e) => setSidebarSearch(e.target.value)}
          className="w-full text-xs font-bold text-right p-2.5 pr-8 bg-slate-50 dark:bg-slate-800 border border-slate-200/60 dark:border-slate-700 rounded-xl focus:bg-white dark:focus:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-slate-700 dark:text-slate-200"
          dir="rtl"
        />
        <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
        {sidebarSearch && (
          <button 
            onClick={() => setSidebarSearch('')}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200/40 rounded-full w-4 h-4 flex items-center justify-center transition-all cursor-pointer"
          >
            ×
          </button>
        )}
      </div>

      {/* Categorized Next-Gen Sidebar Navigation */}
      <div className="space-y-4">
        {domainGroups.map((group, groupIdx) => {
          const filteredItems = group.items.filter((item) =>
            sidebarSearch === '' ||
            item.name.includes(sidebarSearch) ||
            item.desc.includes(sidebarSearch) ||
            group.categoryName.includes(sidebarSearch)
          );

          if (filteredItems.length === 0) return null;

          return (
            <div key={groupIdx} className="space-y-1.5">
              <div className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                {group.categoryName}
              </div>
              <div className="space-y-1">
                {filteredItems.map((navTab) => {
                  const TabIcon = navTab.icon;
                  const isSelected = osTab === navTab.id;
                  const unreadCount = navTab.id === 'notifications' ? liveNotifications.filter((n) => n.unread).length : 0;
                  return (
                    <button
                      key={navTab.id}
                      onClick={() => {
                        setOsTab(navTab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 p-2.5 rounded-2xl text-right transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md font-black scale-[1.01]'
                          : 'bg-slate-50/70 hover:bg-slate-100 dark:bg-slate-800/40 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-slate-800'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${isSelected ? 'bg-white/20 text-white' : navTab.color + ' border'}`}>
                        <TabIcon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <div className={`text-xs font-black truncate ${isSelected ? 'text-white' : 'text-slate-800 dark:text-slate-100'}`}>
                            {navTab.name}
                          </div>
                          {unreadCount > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <div className={`text-[9px] truncate mt-0.5 ${isSelected ? 'text-indigo-100' : 'text-slate-400'}`}>
                          {navTab.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Advanced Operating Tools Accordion (Hidden by default to avoid clutter) */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => setExpandedDomains((prev) => ({ ...prev, extra_tools: !prev.extra_tools }))}
          className="w-full flex items-center justify-between p-2 text-xs font-black text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-all cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedDomains.extra_tools ? 'rotate-180' : ''}`} />
          <span className="flex items-center gap-1.5">
            <span>أدوات وإعدادات إضافية</span>
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          </span>
        </button>

        {expandedDomains.extra_tools && (
          <div className="pt-2 space-y-1 animate-in fade-in duration-200">
            {[
              { id: 'profile', name: 'الهوية والفروع والكوادر', icon: Building2 },
              { id: 'pricing', name: 'محرك التسعير الذكي', icon: CreditCard },
              { id: 'availability', name: 'مواعيد العمل والإتاحة', icon: Clock },
              { id: 'marketing', name: 'مركز النمو والتسويق', icon: Megaphone },
              { id: 'quality', name: 'مؤشر الجودة وتجربة العميل', icon: Star },
              { id: 'reports', name: 'التقارير الشاملة', icon: FileSpreadsheet },
            ].map((subItem) => {
              const SubIcon = subItem.icon;
              const isSubSelected = osTab === subItem.id;
              return (
                <button
                  key={subItem.id}
                  onClick={() => {
                    setOsTab(subItem.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-2 p-2 rounded-xl text-right text-xs transition-all cursor-pointer ${
                    isSubSelected
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-300 font-black border-r-4 border-indigo-600'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{subItem.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
