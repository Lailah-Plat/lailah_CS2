import React from 'react';
import { 
  Activity, 
  Flame, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Building2, 
  Calendar, 
  CreditCard, 
  Scale, 
  ShieldAlert, 
  Zap, 
  ArrowUpRight, 
  RefreshCw, 
  TrendingUp, 
  ShieldCheck, 
  Sparkles,
  Users,
  Compass,
  FileCheck,
  ChevronLeft
} from 'lucide-react';
import { OperationalCase, OperationalPulseCounts, OpsTheme } from './types';

interface OperationalPulseViewProps {
  counts: OperationalPulseCounts | null;
  cases: OperationalCase[];
  onNavigateToQueue: (queueFilter: string) => void;
  onOpenCase: (caseId: string) => void;
  onRunDiscovery?: () => void;
  isRunningDiscovery?: boolean;
  onOpenCommandPalette: () => void;
  theme?: OpsTheme;
}

export const OperationalPulseView: React.FC<OperationalPulseViewProps> = ({
  counts,
  cases,
  onNavigateToQueue,
  onOpenCase,
  onRunDiscovery,
  isRunningDiscovery = false,
  onOpenCommandPalette,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';

  // Calculate live health index
  const totalActive = counts?.totalActive || cases.length || 0;
  const criticalCount = counts?.critical || 0;
  const overdueCount = counts?.overdue || 0;
  
  // Health score calculation: 100 base minus weight of critical and overdue
  const healthPenalty = (criticalCount * 4) + (overdueCount * 2.5);
  const operationalDisciplineIndex = Math.max(72, Math.min(99, Math.round(98 - healthPenalty)));

  // 6 Dedicated Queue Widgets
  const queues = [
    {
      id: 'bookings',
      title: 'حجوزات القاعات',
      badgeFormat: 'BKG-26-XXXXXXXXXX',
      count: counts?.bookingsAttention ?? cases.filter(c => c.caseType.includes('BOOKING') || c.sourceEntityId.startsWith('BKG-')).length,
      icon: Calendar,
      accentColor: 'rose',
      description: 'حالات تحتاج تدخلاً في مواعيد القاعات، طلبات الإلغاء، أو تعثر تأكيد الموفر.',
      urgency: (counts?.bookingsAttention || 0) > 0 ? 'عالي' : 'مستقر'
    },
    {
      id: 'approvals',
      title: 'اعتمادات المنشآت الجديدة',
      badgeFormat: 'VEN-26-APP / HALL',
      count: counts?.pendingApprovals ?? cases.filter(c => c.caseType.includes('APPROVAL')).length,
      icon: Building2,
      accentColor: 'amber',
      description: 'منشآت وقاعات مضافة حديثاً تتطلب فحص الامتثال والوسائط قبل النشر العام.',
      urgency: (counts?.pendingApprovals || 0) > 0 ? 'معلق' : 'مكتمل'
    },
    {
      id: 'services',
      title: 'الخدمات الإضافية والمساندة',
      badgeFormat: 'SRV-26-XXXXXXXXXX',
      count: cases.filter(c => c.caseType.includes('SERVICE') || c.sourceEntityId.startsWith('SRV-')).length,
      icon: Sparkles,
      accentColor: 'indigo',
      description: 'طلبات الخدمات المستقلة والموردين وتفادي ازدواجية خدمات المكان.',
      urgency: 'تحت المراقبة'
    },
    {
      id: 'financial',
      title: 'الضمانات المالية والفواتير',
      badgeFormat: 'INV-26XXXXXXXXXX',
      count: counts?.financialStalled ?? cases.filter(c => c.caseType.includes('FINANCIAL') || c.caseType.includes('PAYMENT')).length,
      icon: CreditCard,
      accentColor: 'teal',
      description: 'مطابقة الفواتير الضريبية 15%، مبالغ الضمان (Escrow)، والتسويات المتوقفة.',
      urgency: (counts?.financialStalled || 0) > 0 ? 'مراجعة' : 'مطابق'
    },
    {
      id: 'disputes',
      title: 'النزاعات وحالات الأطراف',
      badgeFormat: 'DISP-26-XXXX / SLA',
      count: counts?.openDisputes ?? cases.filter(c => c.caseType.includes('DISPUTE') || c.caseType.includes('COMPLAINT')).length,
      icon: Scale,
      accentColor: 'purple',
      description: 'شكاوى العملاء والشركاء، التوفيق الودي، وتحكيم بنود عقد المنصة.',
      urgency: (counts?.openDisputes || 0) > 0 ? 'حرج' : 'صفر'
    },
    {
      id: 'escalations',
      title: 'الطوارئ والتدخل السريع',
      badgeFormat: 'EMERGENCY / SLA-BREACH',
      count: counts?.activeEscalations ?? cases.filter(c => c.status === 'ESCALATED' || c.priority === 'CRITICAL').length,
      icon: ShieldAlert,
      accentColor: 'red',
      description: 'تدخلات ميدانية فورية وتجاوزات زمنية تتطلب صلاحيات القيادة العليا.',
      urgency: (counts?.activeEscalations || 0) > 0 ? 'فوري' : 'طبيعي'
    }
  ];

  // Critical live list (top 4 cases)
  const criticalCases = cases
    .filter(c => c.priority === 'CRITICAL' || c.priority === 'HIGH')
    .slice(0, 4);

  return (
    <div className="space-y-6 pb-12" dir="rtl">
      
      {/* 1. Hero Ops Radar Banner */}
      <div className={`relative rounded-3xl border overflow-hidden p-6 sm:p-8 transition-all ${
        isDark 
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950/80 border-slate-800 shadow-2xl shadow-emerald-950/20' 
          : 'bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 border-slate-700 text-white shadow-xl'
      }`}>
        {/* Subtle Radial Glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
          
          {/* Main Title & Status */}
          <div className="max-w-2xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>غرفة العمليات المركزية الحية (Active Radar)</span>
              </span>
              <span className="font-mono text-xs text-slate-400">
                محدث الآن • LOS v2.5
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-snug">
              نبض العمليات والانضباط الميداني الشامل
            </h1>
            <p className="text-sm text-slate-300/90 mt-2 leading-relaxed">
              منظومة الرقابة والتحكم اللحظي لكافة حجوزات القاعات، اعتمادات المنشآت، الحركات المالية، والتدخلات الطارئة لضمان أعلى معايير الجودة والالتزام.
            </p>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 mt-6">
              <button
                onClick={onRunDiscovery}
                disabled={isRunningDiscovery}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition-all shadow-md shadow-emerald-950/40 cursor-pointer disabled:opacity-50"
              >
                <Zap className={`w-4 h-4 ${isRunningDiscovery ? 'animate-spin' : ''}`} />
                <span>{isRunningDiscovery ? 'جاري الفحص الشامل...' : 'تشغيل فحص الاستثناءات الآلي'}</span>
              </button>

              <button
                onClick={onOpenCommandPalette}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800/80 hover:bg-slate-700/80 text-white border border-slate-700 transition-all cursor-pointer"
              >
                <Compass className="w-4 h-4 text-teal-400" />
                <span>لوحة الأوامر الموحدة (⌘K)</span>
              </button>
            </div>
          </div>

          {/* Large Live System Health Index Gauge */}
          <div className="w-full lg:w-auto shrink-0 flex items-center justify-center">
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-700/80 backdrop-blur-md flex items-center gap-6 shadow-inner">
              <div className="relative w-28 h-28 flex items-center justify-center">
                {/* SVG Progress Ring */}
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-800"
                    strokeWidth="3.2"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-emerald-400 transition-all duration-1000 ease-out"
                    strokeDasharray={`${operationalDisciplineIndex}, 100`}
                    strokeWidth="3.2"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="font-mono text-2xl font-black text-white">
                    {operationalDisciplineIndex}%
                  </span>
                  <span className="text-[9px] font-bold text-emerald-400">انضباط</span>
                </div>
              </div>

              <div className="space-y-1.5 text-right">
                <div className="text-xs font-extrabold text-white">مؤشر الجاهزية التشغيلية</div>
                <div className="text-[11px] text-slate-400">
                  امتثال الاستجابة SLA: <span className="font-mono font-bold text-emerald-400">98.4%</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  متوسط وقت الحل (MTTR): <span className="font-mono font-bold text-teal-400">14 دقيقة</span>
                </div>
                <div className="text-[11px] text-slate-400">
                  حالات الطابور النشطة: <span className="font-mono font-bold text-amber-400">{totalActive}</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* 4 Dynamic Alert Tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mt-8 pt-6 border-t border-slate-800/80">
          
          {/* Tile 1: Critical Active */}
          <div 
            onClick={() => onNavigateToQueue('critical')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none group ${
              isDark 
                ? 'bg-rose-950/30 border-rose-800/60 hover:border-rose-500/80 hover:bg-rose-950/50' 
                : 'bg-rose-900/30 border-rose-700/60 hover:border-rose-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-rose-200">حالات حرجة نشطة</span>
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-2xl font-black text-rose-400">
                {counts?.critical || 0}
              </span>
              <span className="text-[10px] text-rose-300/80 group-hover:text-rose-200 flex items-center gap-1 font-bold">
                <span>معاينة فورية</span>
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Tile 2: SLA Overdue */}
          <div 
            onClick={() => onNavigateToQueue('sla')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none group ${
              isDark 
                ? 'bg-amber-950/30 border-amber-800/60 hover:border-amber-500/80 hover:bg-amber-950/50' 
                : 'bg-amber-900/30 border-amber-700/60 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-amber-200">تجاوزات مهلة SLA</span>
              <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-2xl font-black text-amber-400">
                {counts?.overdue || 0}
              </span>
              <span className="text-[10px] text-amber-300/80 group-hover:text-amber-200 flex items-center gap-1 font-bold">
                <span>تتبع المهلة</span>
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Tile 3: Pending Approvals */}
          <div 
            onClick={() => onNavigateToQueue('approvals')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none group ${
              isDark 
                ? 'bg-indigo-950/30 border-indigo-800/60 hover:border-indigo-500/80 hover:bg-indigo-950/50' 
                : 'bg-indigo-900/30 border-indigo-700/60 hover:border-indigo-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-indigo-200">اعتمادات منشآت معلقة</span>
              <Building2 className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-2xl font-black text-indigo-300">
                {counts?.pendingApprovals || 0}
              </span>
              <span className="text-[10px] text-indigo-200/80 group-hover:text-indigo-100 flex items-center gap-1 font-bold">
                <span>فحص وتدقيق</span>
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

          {/* Tile 4: Stalled Escrow / Invoices */}
          <div 
            onClick={() => onNavigateToQueue('financial')}
            className={`p-4 rounded-xl border transition-all cursor-pointer select-none group ${
              isDark 
                ? 'bg-teal-950/30 border-teal-800/60 hover:border-teal-500/80 hover:bg-teal-950/50' 
                : 'bg-teal-900/30 border-teal-700/60 hover:border-teal-400'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-teal-200">تسويات وضمانات متوقفة</span>
              <CreditCard className="w-4 h-4 text-teal-400" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-mono text-2xl font-black text-teal-400">
                {counts?.financialStalled || 0}
              </span>
              <span className="text-[10px] text-teal-300/80 group-hover:text-teal-200 flex items-center gap-1 font-bold">
                <span>التسويات المالية</span>
                <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* 2. Queues Breakdown Grid (6 Dedicated Widgets) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className={`text-lg font-black ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              طوابير العمليات الموزعة (Dedicated Operations Queues)
            </h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              انقر على أي طابور للانتقال الفوري إلى جدول الحالات المصفى
            </p>
          </div>
          <span className="text-xs font-mono font-bold text-slate-500">
            إجمالي الطوابير: 6 محاور سيادية
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {queues.map(q => {
            const Icon = q.icon;
            return (
              <div
                key={q.id}
                onClick={() => onNavigateToQueue(q.id)}
                className={`p-5 rounded-2xl border transition-all cursor-pointer group relative overflow-hidden ${
                  isDark
                    ? 'bg-slate-900/90 hover:bg-slate-800/90 border-slate-800 hover:border-slate-700 shadow-md'
                    : 'bg-white hover:bg-slate-50 border-slate-200 hover:border-slate-300 shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      isDark ? 'bg-slate-800 text-teal-400' : 'bg-slate-100 text-slate-700'
                    }`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className={`font-bold text-sm leading-tight ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
                        {q.title}
                      </h3>
                      <span className="font-mono text-[10px] text-slate-400">
                        {q.badgeFormat}
                      </span>
                    </div>
                  </div>

                  <div className="text-left">
                    <span className="font-mono text-2xl font-black text-slate-100 group-hover:text-teal-400 transition-colors">
                      {q.count}
                    </span>
                  </div>
                </div>

                <p className={`text-xs leading-relaxed line-clamp-2 mb-4 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {q.description}
                </p>

                <div className={`pt-3 border-t flex items-center justify-between text-xs ${
                  isDark ? 'border-slate-800 text-slate-400' : 'border-slate-100 text-slate-500'
                }`}>
                  <span className="flex items-center gap-1.5 font-bold">
                    <span>الحالة:</span>
                    <span className="font-mono text-[11px] text-amber-400">{q.urgency}</span>
                  </span>

                  <span className="flex items-center gap-1 font-bold text-teal-400 group-hover:translate-x-[-2px] transition-transform">
                    <span>فتح الطابور</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Priority Action Board (Critical Cases Requiring Immediate Attention) */}
      <div className={`rounded-2xl border p-5 ${
        isDark ? 'bg-slate-900/80 border-slate-800' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <Flame className="w-5 h-5 text-rose-500" />
            <h3 className={`font-extrabold text-sm ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
              الحالات ذات الأولوية القصوى (Immediate Attention List)
            </h3>
          </div>
          <button
            onClick={() => onNavigateToQueue('critical')}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
          >
            <span>عرض كل الحالات الحرجة ({counts?.critical || 0})</span>
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
        </div>

        {criticalCases.length === 0 ? (
          <div className="py-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-bold text-slate-300">لا توجد حالات حرجة نشطة حالياً</p>
            <p className="text-xs text-slate-500">كافة العمليات الميدانية تسير وفق معايير الجودة المطلوبة.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800/40">
            {criticalCases.map(c => (
              <div 
                key={c.caseId}
                onClick={() => onOpenCase(c.caseId)}
                className={`py-3.5 px-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-800/40 rounded-xl transition-colors cursor-pointer group`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-800/60">
                        {c.caseId}
                      </span>
                      {c.sourceEntityId && (
                        <span className="font-mono text-xs text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                          {c.sourceEntityId}
                        </span>
                      )}
                      <h4 className={`text-xs font-bold truncate ${isDark ? 'text-slate-100 group-hover:text-rose-300' : 'text-slate-900'}`}>
                        {c.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate mt-0.5">
                      {c.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="text-left font-mono text-xs">
                    <span className="text-slate-400 block text-[10px]">المهلة المتبقية:</span>
                    <span className="text-amber-400 font-bold">
                      {new Date(c.dueAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenCase(c.caseId);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-colors"
                  >
                    معالجة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};
