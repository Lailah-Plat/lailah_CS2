import React, { useState } from 'react';
import {
  Sparkles,
  CheckSquare,
  Wallet,
  ArrowUpRight,
  ArrowRightLeft,
  Activity,
  CheckCircle2,
  Calendar,
  Layers,
  Star,
  AlertTriangle,
  Award,
  Clock,
  List,
  LayoutGrid,
  ChevronRight,
  ChevronLeft,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '../../../utils/helpers';
import { UnifiedPartnerCockpit } from '../cockpit/UnifiedPartnerCockpit';

interface ProviderOverviewDomainProps {
  currentProviderName: string;
  currentUserName: string;
  profileBusinessName: string;
  profileLogo: string;
  setIsWizardForceOpen: (v: boolean) => void;
  setOnboardingStep: (v: number) => void;
  setOsTab: (tab: string) => void;
  wizIban: string;
  withdrawIban: string;
  halls: any[];
  catalogServices: any[];
  wizWeekendPrice: any;
  wizWorkingHours: string;
  uploadedDocs: any[];
  bookings: any[];
  supportServiceRequests: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  supplyRequests: any[];
  inventoryItems: any[];
  profileEmployees: any[];
}

export function ProviderOverviewDomain({
  currentProviderName,
  currentUserName,
  profileBusinessName,
  profileLogo,
  setIsWizardForceOpen,
  setOnboardingStep,
  setOsTab,
  wizIban,
  withdrawIban,
  halls,
  catalogServices,
  wizWeekendPrice,
  wizWorkingHours,
  uploadedDocs,
  bookings,
  supportServiceRequests,
  showNotification,
  supplyRequests,
  inventoryItems,
  profileEmployees,
}: ProviderOverviewDomainProps) {
  // Action states
  const [actionBookingsCount, setActionBookingsCount] = useState(3);
  const [actionServiceCount, setActionServiceCount] = useState(1);
  const [actionSettlementCount, setActionSettlementCount] = useState(1);
  const [actionRatingReplied, setActionRatingReplied] = useState(false);
  const [actionSubscriptionRenewed, setActionSubscriptionRenewed] = useState(false);

  // Field Logistics & Operations state
  const [logisticsViewMode, setLogisticsViewMode] = useState<'table' | 'grid'>('table');
  const [logisticsPage, setLogisticsPage] = useState(1);

  const logisticsData = [
    { id: 'L-01', title: 'حفل زفاف عائلة الرويلي', type: 'event', hall: 'قاعة الأسطورة الكبرى', branch: 'الفرع الرئيسي', manager: 'خالد الرويلي', status: 'اليوم - جارٍ التجهيز', statusColor: 'emerald', time: '04:00 م' },
    { id: 'L-02', title: 'حفل استقبال شركة سابك', type: 'event', hall: 'قاعة القصر الذهبي', branch: 'فرع الشمال', manager: 'أحمد السالم', status: 'اليوم - مجدول', statusColor: 'blue', time: '06:00 م' },
    { id: 'L-03', title: 'حفل تخرج جامعة الملك سعود', type: 'event', hall: 'قاعة الأسطورة الكبرى', branch: 'الفرع الرئيسي', manager: 'خالد الرويلي', status: 'غداً - مؤكد', statusColor: 'slate', time: '09:00 ص' },
    { id: 'L-04', title: 'طاقم ضيافة نسائي VIP', type: 'service', hall: 'بوفيه عشاء ملكي فاخر', branch: 'فرع الشمال', manager: 'سارة العتيبي', status: 'مؤكد ومكتمل', statusColor: 'purple', time: '08:30 م' },
    { id: 'L-05', title: 'تغطية وتصوير فوتوغرافي وفيديو', type: 'service', hall: 'شاملاً ألبوم رقمي مطبوع', branch: 'فرع الشمال', manager: 'فهد المطيري', status: 'جارٍ التنسيق', statusColor: 'amber', time: '07:00 م' },
    { id: 'L-06', title: 'توريد كوشة ورد طبيعي', type: 'service', hall: 'قاعة الأسطورة الكبرى', branch: 'الفرع الرئيسي', manager: 'فيصل العمري', status: 'متأخر 15 دقيقة ⚠️', statusColor: 'red', time: '03:30 م', delay: '15 دقيقة', phoneAction: true },
    { id: 'L-07', title: 'تجهيز المؤثرات الصوتية والدي جي', type: 'service', hall: 'قاعة القصر الذهبي', branch: 'الفرع الرئيسي', manager: 'محمد القحطاني', status: 'مؤكد ومكتمل', statusColor: 'purple', time: '05:00 م' },
    { id: 'L-08', title: 'حفل استقبال السلك الدبلوماسي', type: 'event', hall: 'قاعة الأسطورة الكبرى', branch: 'الفرع الرئيسي', manager: 'عبدالرحمن آل سعود', status: 'الأسبوع القادم - مجدول', statusColor: 'blue', time: '01:00 م' },
    { id: 'L-09', title: 'بوفيه المأكولات والمقبلات الشرقية', type: 'service', hall: 'فرع المروج', branch: 'الفرع الرئيسي', manager: 'الشيف أنس', status: 'مؤكد وجارٍ التحضير', statusColor: 'emerald', time: '06:30 م' },
    { id: 'L-10', title: 'تنظيم مواقف السيارات والـ Valet', type: 'service', hall: 'قاعة القصر الذهبي', branch: 'فرع الشمال', manager: 'طاقم الحراسة', status: 'مؤكد وجاهز', statusColor: 'emerald', time: '05:30 م' },
    { id: 'L-11', title: 'حفل زفاف عائلة الشبيلي', type: 'event', hall: 'قاعة اللؤلؤة المصونة', branch: 'الفرع الرئيسي', manager: 'سليمان الحجيلان', status: 'بعد غدٍ - مؤكد', statusColor: 'blue', time: '07:30 م' },
    { id: 'L-12', title: 'توريد أجهزة بخار وإضاءة ليزر', type: 'service', hall: 'قاعة الأسطورة الكبرى', branch: 'فرع الشمال', manager: 'شركة نيون لايتس', status: 'جارٍ التجهيز', statusColor: 'amber', time: '04:00 م' },
    { id: 'L-13', title: 'خدمة تقديم وتجهيز القهوة السعودية', type: 'service', hall: 'فرع المروج', branch: 'الفرع الرئيسي', manager: 'أم محمد', status: 'مؤكد ومكتمل', statusColor: 'emerald', time: '02:00 م' },
    { id: 'L-14', title: 'لقاء ريادة الأعمال السنوي', type: 'event', hall: 'قاعة القصر الذهبي', branch: 'فرع الشمال', manager: 'رائد العيسى', status: 'الأسبوع القادم - مجدول', statusColor: 'blue', time: '10:00 ص' },
    { id: 'L-15', title: 'تنسيق الطاولات والشموع الرومانسية', type: 'service', hall: 'قاعة اللؤلؤة المصونة', branch: 'الفرع الرئيسي', manager: 'لمياء الحربي', status: 'مؤكد وجاهز', statusColor: 'emerald', time: '05:00 م' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Next-Gen Unified Partner Cockpit */}
      <UnifiedPartnerCockpit
        currentProviderName={currentProviderName}
        currentUserName={currentUserName}
        myBookings={bookings || []}
        mySupportRequests={supportServiceRequests || []}
        halls={halls || []}
        showNotification={showNotification}
        onOpenChat={(b) => {
          setOsTab('notifications');
          showNotification('info', `تم فتح غرفة التواصل المباشر للحجز ${b.id || b.bookingId}`);
        }}
        onUpdateBookingStage={(bookingId, newStage) => {
          showNotification('success', `تم تحديث مرحلة الجاهزية التشغيلية للحجز ${bookingId} إلى المرحلة ${newStage} بنجاح!`);
        }}
      />

      {/* Command Center Title Banner */}
      <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-md text-right">
        <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="space-y-2 flex-1">
            <span className="bg-indigo-500/80 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest font-mono">UNIFIED PROVIDER WORKSPACE</span>
            <h3 className="text-xl font-black">مركز قيادة عمليات المنشأة الموحد</h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              مرحباً بك مجدداً في مساحة عمل المزود الموحدة والمتكيفة <span className="text-amber-400 font-extrabold">Lailah Workspace v2.6</span> لشركة <span className="text-yellow-400 font-extrabold">{profileBusinessName}</span>. إليك تحليل حي ومؤشرات عمليات المنشأة والمهام العاجلة بانتظار اتخاذ إجراء الآن.
            </p>
          </div>
          <button
            onClick={() => {
              setIsWizardForceOpen(true);
              setOnboardingStep(1);
            }}
            className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-xl text-xs font-black shadow-lg hover:shadow-indigo-500/20 border border-indigo-500/50 transition-all cursor-pointer flex items-center gap-1.5 self-start md:self-center"
          >
            <Sparkles className="w-4 h-4 text-yellow-300" />
            <span>معالج تهيئة وتأسيس المنشأة</span>
          </button>
        </div>
      </div>

      {/* Interactive Provider Onboarding Checklist Banner (Requirement 1) */}
      {(() => {
        const checkListItems = [
          {
            id: 'identity',
            title: 'هوية المنشأة والشعار والخصوصية',
            isDone: Boolean(profileBusinessName && profileLogo),
            actionText: 'تحديث الهوية',
            tabTarget: 'profile',
          },
          {
            id: 'iban',
            title: 'ربط الآيبان الحساب البنكي للسحوبات',
            isDone: Boolean((wizIban && wizIban.length >= 12) || (withdrawIban && withdrawIban.length >= 12)),
            actionText: 'إدخال IBAN',
            tabTarget: 'finance',
          },
          {
            id: 'catalog',
            title: 'إضافة قاعة أو منشأة أو خدمة مساندة',
            isDone: Boolean((halls && halls.length > 0) || (catalogServices && catalogServices.length > 0)),
            actionText: 'إضافة بالكتالوج',
            tabTarget: 'catalog',
          },
          {
            id: 'pricing',
            title: 'تحديد أسعار نهايات الأسابيع والمواسم',
            isDone: Boolean(wizWeekendPrice && Number(wizWeekendPrice) > 0),
            actionText: 'التسعير المتقدم',
            tabTarget: 'pricing',
          },
          {
            id: 'policy',
            title: 'شروط وسياسة الإلغاء والاسترداد',
            isDone: Boolean(wizWorkingHours),
            actionText: 'تعديل السياسات',
            tabTarget: 'profile',
          },
          {
            id: 'docs',
            title: 'رفع السجل التجاري والوثائق المعتمدة',
            isDone: (uploadedDocs || []).some((d: any) => d.status === 'success'),
            actionText: 'رفع المستندات',
            tabTarget: 'profile',
          },
        ];

        const completedCount = checkListItems.filter((i) => i.isDone).length;
        const totalCount = checkListItems.length;
        const progressPercent = Math.round((completedCount / totalCount) * 100);

        return (
          <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-sm text-right space-y-4 font-sans">
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>دليل البدء السريع وإكمال ملف المزود (Interactive Onboarding)</span>
                    <span
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                        progressPercent === 100
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                      }`}
                    >
                      {progressPercent === 100 ? 'جاهز ومكتمل 100% 🚀' : `${progressPercent}% مكتمل`}
                    </span>
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    أكمل الخطوات التشغيلية لتنشيط ظهور القاعات والخدمات وتفعيل استلام الحجوزات
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">
                  {completedCount} من أصل {totalCount} خطوات منجزة
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${
                  progressPercent === 100 ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>

            {/* Checklist Items Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {checkListItems.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    item.isDone
                      ? 'bg-slate-50/50 dark:bg-slate-800/30 border-slate-200/50 dark:border-slate-800 text-slate-500'
                      : 'bg-white dark:bg-slate-800/80 border-amber-200 dark:border-amber-900/50 shadow-sm hover:border-amber-400'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        item.isDone
                          ? 'bg-emerald-500 text-white'
                          : 'bg-amber-100 dark:bg-amber-950 text-amber-600 border border-amber-300'
                      }`}
                    >
                      {item.isDone ? '✓' : '•'}
                    </span>
                    <span
                      className={`text-xs font-bold truncate ${
                        item.isDone ? 'text-slate-400 line-through' : 'text-slate-800 dark:text-slate-100'
                      }`}
                    >
                      {item.title}
                    </span>
                  </div>
                  {!item.isDone && (
                    <button
                      onClick={() => setOsTab(item.tabTarget)}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[10px] font-black shrink-0 cursor-pointer shadow-sm"
                    >
                      {item.actionText}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Unified Dashboard Grid: Financial Hub & Health Indicators (Right) & Action Center (Left) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Right Column: Financial Overview Hub & Operational Health (lg:col-span-8) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Financial Overview Hub */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col justify-between space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                <span className="text-[10px] font-black text-slate-400 font-mono">FINANCIAL MATRIX</span>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-slate-800">الرصيد الفوري والمركز المالي والسيولة للمنشأة</h3>
                  <Wallet className="w-4 h-4 text-emerald-600" />
                </div>
              </div>

              {(() => {
                const totalSuppliersDues = supplyRequests.reduce((sum, r) => sum + Number(r.cost), 0);
                const baseAvailable = 15200;
                const currentAvailable = Math.max(0, baseAvailable - totalSuppliersDues);
                return (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Metric 1 */}
                    <div className="p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100/60 text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">الإيراد المتوقع اليوم</span>
                      <span className="text-base font-black text-indigo-950 font-mono block">{formatCurrency(18500)}</span>
                      <div className="text-[8.5px] text-emerald-600 flex items-center gap-0.5 justify-end mt-1 font-bold">
                        <span>+12.4% عن الأمس</span>
                        <ArrowUpRight className="w-2.5 h-2.5" />
                      </div>
                    </div>

                    {/* Metric 2 */}
                    <div className="p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100/60 text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">إجمالي مستحقات الموردين</span>
                      <span className="text-base font-black text-red-600 font-mono block">{formatCurrency(totalSuppliersDues)}</span>
                      <span className="text-[8px] text-slate-400 block mt-1">تخصم تلقائياً من المحفظة</span>
                    </div>

                    {/* Metric 3 */}
                    <div className="p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100/60 text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">الرصيد الصافي المتاح</span>
                      <span className="text-base font-black text-emerald-700 font-mono block">{formatCurrency(currentAvailable)}</span>
                      <button
                        onClick={() => {
                          showNotification('success', `تم تقديم طلب التحويل التلقائي المباشر لعلامتك التجارية بقيمة ${formatCurrency(currentAvailable)} بنجاح!`);
                        }}
                        className="text-[8.5px] text-indigo-600 font-black hover:underline hover:text-indigo-800 mt-1 flex items-center justify-end gap-0.5 cursor-pointer min-h-[20px]"
                      >
                        <span>سحب فوري</span>
                        <ArrowRightLeft className="w-2.5 h-2.5" />
                      </button>
                    </div>

                    {/* Metric 4 */}
                    <div className="p-3.5 bg-slate-50/60 rounded-2xl border border-slate-100/60 text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-400 block">تسويات معلقة</span>
                      <span className="text-base font-black text-amber-700 font-mono block">{formatCurrency(12000)}</span>
                      <span className="text-[8px] text-slate-400 block mt-1">تتم تسويتها تلقائياً</span>
                    </div>
                  </div>
                );
              })()}

              <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/40 text-right">
                <p className="text-[9.5px] text-indigo-950 font-bold leading-relaxed">
                  💡 يمثل هذا المركز المالي التدفق النقدي والسيولة الفورية للمزود لعام ٢٠٢٦ م. يتم تحديث الرصيد وتدفقات الأرباح تلقائياً فورياً مع عزل تام عن بقية المزودين.
                </p>
              </div>
            </div>
          </div>

          {/* Operational Health & Service Quality Indicators */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <span className="text-[10px] font-black text-slate-400 font-mono">OPERATIONAL HEALTH</span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">مؤشرات الصحة التشغيلية وجودة الخدمات</h3>
                <Activity className="w-4 h-4 text-indigo-600" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Compliance & Ratings */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 space-y-3.5">
                <span className="text-[10px] font-black text-indigo-900 block border-b border-indigo-100/50 pb-1">الكفاءة اللوجستية والتقييمات</span>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-emerald-700">98.4%</span>
                    <span className="text-slate-600 font-extrabold">معدل الالتزام بالمواعيد</span>
                  </div>
                  <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-600 h-1.5 rounded-full" style={{ width: '98.4%' }}></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-mono font-bold text-indigo-700">4.85 / 5.0</span>
                    <span className="text-slate-600 font-extrabold">مؤشر جودة الخدمات والرضا</span>
                  </div>
                  <div className="w-full bg-slate-200/60 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: '92%' }}></div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-[10px] bg-white p-2 rounded-xl border border-slate-100 font-sans">
                  <span className="font-mono text-indigo-600 font-bold">{profileEmployees.filter((e) => e.status === 'نشط').length} موظفين</span>
                  <span className="text-slate-500">طاقم المناوبة النشط اليوم:</span>
                </div>
              </div>

              {/* Low Inventory & Asset Alerts (Dynamic Linkage) */}
              <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2.5">
                <span className="text-[10px] font-black text-rose-900 block border-b border-rose-100/50 pb-1">مراقبة المخزون وإنذارات العهدة</span>

                {(() => {
                  const lowStockItems = inventoryItems.filter((item) => item.available <= item.threshold);
                  if (lowStockItems.length > 0) {
                    return (
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center justify-between text-[10px] text-amber-700 font-bold animate-pulse">
                          <span>⚠️ {lowStockItems.length} إنذارات حرجة</span>
                          <span>أصناف شارفت على النفاد</span>
                        </div>
                        <div className="space-y-1.5 max-h-[75px] overflow-y-auto scrollbar-thin">
                          {lowStockItems.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-[9.5px] bg-white px-2 py-1 rounded-lg border border-slate-100">
                              <span className="font-mono text-rose-600 font-bold">الكمية: {item.available}</span>
                              <span className="text-slate-700 truncate max-w-[120px]">{item.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  } else {
                    return (
                      <div className="flex flex-col items-center justify-center py-4 text-center space-y-1 flex-1">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        <span className="text-[10px] font-black text-slate-700">المخزون ممتاز</span>
                        <p className="text-[8.5px] text-slate-400">جميع المستلزمات والعهود الميدانية متوفرة بكثرة.</p>
                      </div>
                    );
                  }
                })()}

                <button
                  onClick={() => setOsTab('inventory')}
                  className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black cursor-pointer transition-all border border-indigo-100"
                >
                  إجراء إعادة طلب فوري للمخزون
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Left Column: Action Center (lg:col-span-4) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col justify-between space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-50">
              <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full font-mono">
                {(actionBookingsCount > 0 ? 1 : 0) +
                  (actionServiceCount > 0 ? 1 : 0) +
                  (!actionRatingReplied ? 1 : 0) +
                  (actionSettlementCount > 0 ? 1 : 0) +
                  (!actionSubscriptionRenewed ? 1 : 0) +
                  1}{' '}
                مهام عاجلة
              </span>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-slate-800">مركز المهام الفورية والقرارات (Action Center)</h3>
                <Activity className="w-4 h-4 text-indigo-600 animate-pulse" />
              </div>
            </div>

            {/* Organized column with vertical scrollbar */}
            <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1 pl-1 scrollbar-thin scrollbar-thumb-slate-200">
              {/* Action 1: Pending Bookings */}
              {actionBookingsCount > 0 && (
                <div className="p-3 bg-slate-50 hover:bg-indigo-50/20 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-2">
                  <div className="flex gap-2.5 justify-end items-start text-right">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-black text-slate-800 block">حجوزات قاعات جديدة معلقة</span>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">لديك {actionBookingsCount} حجوزات معلقة لعام 2026 تحتاج إلى مراجعة وتأكيد.</p>
                    </div>
                    <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                      <Calendar className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setActionBookingsCount(0);
                        showNotification('success', 'تم تأكيد جميع حجوزات القاعات المعلقة وتحويل حالتها إلى "مؤكدة" في الوقت الحقيقي!');
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      تأكيد جميع الحجوزات
                    </button>
                    <button
                      onClick={() => setOsTab('bookings')}
                      className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      عرض التفاصيل
                    </button>
                  </div>
                </div>
              )}

              {/* Action 2: Service Request */}
              {actionServiceCount > 0 && (
                <div className="p-3 bg-slate-50 hover:bg-purple-50/20 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-2">
                  <div className="flex gap-2.5 justify-end items-start text-right">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-black text-slate-800 block">طلب خدمة تكميلية جديد</span>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">طلب خدمة بوفيه وضيافة بقيمة {formatCurrency(4500)} بانتظار الاعتماد.</p>
                    </div>
                    <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                      <Layers className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setActionServiceCount(0);
                        showNotification('success', 'تم قبول وتثبيت طلب الخدمة التكميلية في جدول المهام الميدانية!');
                      }}
                      className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      قبول الطلب
                    </button>
                    <button
                      onClick={() => setOsTab('orders')}
                      className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      عرض
                    </button>
                  </div>
                </div>
              )}

              {/* Action 3: Settlement */}
              {actionSettlementCount > 0 && (
                <div className="p-3 bg-slate-50 hover:bg-emerald-50/20 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-2">
                  <div className="flex gap-2.5 justify-end items-start text-right">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-black text-slate-800 block">طلب تحويل أرباح متاح</span>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">يتوفر رصيد متاح للسحب الفوري بقيمة {formatCurrency(15000)} للآيبان.</p>
                    </div>
                    <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                      <Wallet className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setActionSettlementCount(0);
                        showNotification('success', 'تم تقديم طلب التحويل المالي الفوري! سيصل المبلغ إلى حسابكم البنكي خلال ساعات العمل الرسمية.');
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      تحويل للبنك ➔
                    </button>
                    <button
                      onClick={() => setOsTab('finance')}
                      className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      عرض
                    </button>
                  </div>
                </div>
              )}

              {/* Action 4: Rating Reply */}
              {!actionRatingReplied && (
                <div className="p-3 bg-slate-50 hover:bg-amber-50/20 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-2">
                  <div className="flex gap-2.5 justify-end items-start text-right">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-black text-slate-800 block">تقييم جديد بـ 5 نجوم للرد</span>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">قيّم العميل "أحمد الحربي" قاعتك بتقييم ممتاز وترك تعليقاً إيجابياً.</p>
                    </div>
                    <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg shrink-0">
                      <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setActionRatingReplied(true);
                        showNotification('success', 'تم الرد على تقييم العميل أحمد الحربي برسالة الشكر المعتمدة من علامتك التجارية بنجاح!');
                      }}
                      className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      الرد السريع بنموذج الشكر
                    </button>
                  </div>
                </div>
              )}

              {/* Action 5: Subscription warning */}
              {!actionSubscriptionRenewed && (
                <div className="p-3 bg-slate-50 hover:bg-rose-50/20 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-2">
                  <div className="flex gap-2.5 justify-end items-start text-right">
                    <div className="min-w-0 flex-1">
                      <span className="text-[11px] font-black text-rose-700 flex items-center gap-1 justify-end">
                        <span>عضوية ERP ستنتهي قريباً</span>
                        <AlertTriangle className="w-3 h-3 text-rose-500" />
                      </span>
                      <p className="text-[9.5px] text-slate-400 mt-0.5">باقة اشتراك المنشأة الاحترافية ستنتهي خلال 5 أيام.</p>
                    </div>
                    <div className="p-1.5 bg-rose-50 text-rose-600 rounded-lg shrink-0">
                      <Award className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setActionSubscriptionRenewed(true);
                        showNotification('success', 'تم تجديد الباقة الاحترافية الملكية Layla ERP بنجاح لعام كامل إضافي! شكراً لثقتكم.');
                      }}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      تجديد فوري للباقة
                    </button>
                    <button
                      onClick={() => setOsTab('subscription')}
                      className="px-2.5 py-1 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                    >
                      تفاصيل
                    </button>
                  </div>
                </div>
              )}

              {/* Action 6: Hall approval status under rule 6 */}
              <div className="p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-2">
                <div className="flex gap-2.5 justify-end items-start text-right">
                  <div className="min-w-0 flex-1">
                    <span className="text-[11px] font-black text-slate-800 block">طلب إضافة قاعة جديدة معلق</span>
                    <p className="text-[9.5px] text-slate-400 mt-0.5">تم إرسال قاعة "الماسة والزمرد" وتطبيق القاعدة 6 بانتظار موافقة الإدارة.</p>
                  </div>
                  <div className="p-1.5 bg-slate-100 text-slate-600 rounded-lg shrink-0">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg text-[8px] font-black border border-amber-200 block text-center select-none">
                    ⚠️ معلقة بانتظار موافقة الإدارة (قاعدة 6)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. TODAY'S & TOMORROW'S OPERATIONS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between pb-3 border-b border-slate-50 gap-4">
          {/* View mode toggle triggers */}
          <div className="flex items-center bg-slate-50 p-1.5 rounded-2xl border border-slate-100 gap-1">
            <button
              onClick={() => setLogisticsViewMode('table')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[38px] ${
                logisticsViewMode === 'table'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <List className="w-4 h-4" />
              <span>جدولي (قائمة)</span>
            </button>
            <button
              onClick={() => setLogisticsViewMode('grid')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[38px] ${
                logisticsViewMode === 'grid'
                  ? 'bg-white text-indigo-700 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              <span>شبكي (بطاقات)</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right">
              <h3 className="text-sm font-black text-slate-800">حالة تشغيل المواعيد والخدمات اللوجستية الميدانية</h3>
              <p className="text-[10px] text-slate-400 mt-0.5">مؤشرات وجداول التجهيز الحي لعام ٢٠٢٦ م</p>
            </div>
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Activity className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Pagination Calculation */}
        {(() => {
          const itemsPerPage = 10;
          const totalItems = logisticsData.length;
          const totalPages = Math.ceil(totalItems / itemsPerPage);
          const currentItems = logisticsData.slice((logisticsPage - 1) * itemsPerPage, logisticsPage * itemsPerPage);

          const getStatusBadge = (status: string, color: string, item: any) => {
            let baseStyle = 'text-[9px] font-black px-2.5 py-1 rounded-full text-center inline-block whitespace-nowrap ';
            if (color === 'emerald') baseStyle += 'bg-emerald-50 text-emerald-700 border border-emerald-200';
            else if (color === 'blue') baseStyle += 'bg-blue-50 text-blue-700 border border-blue-200';
            else if (color === 'slate') baseStyle += 'bg-slate-100 text-slate-700 border border-slate-200';
            else if (color === 'purple') baseStyle += 'bg-purple-50 text-purple-700 border border-purple-200';
            else if (color === 'amber') baseStyle += 'bg-amber-50 text-amber-700 border border-amber-200';
            else if (color === 'red') baseStyle += 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse';
            else baseStyle += 'bg-slate-100 text-slate-800';

            return (
              <div className="flex items-center justify-end gap-2">
                {item.phoneAction && (
                  <button
                    onClick={() =>
                      showNotification('info', `جارٍ الاتصال التلقائي بـ ${item.manager} لتحديث حالة التوصيل للطلب ${item.id}...`)
                    }
                    className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-[8.5px] font-black cursor-pointer transition-all flex items-center gap-1 min-h-[22px]"
                  >
                    <span>اتصال بالمورد 📞</span>
                  </button>
                )}
                <span className={baseStyle}>{status}</span>
              </div>
            );
          };

          return (
            <div className="space-y-4">
              {/* Render Table (List Mode) */}
              {logisticsViewMode === 'table' ? (
                <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-sm">
                  <table className="w-full text-right text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3.5 text-right font-black">المعرّف</th>
                        <th className="p-3.5 text-right font-black">عنوان المناسبة / الخدمة</th>
                        <th className="p-3.5 text-right font-black">نوع المهمة</th>
                        <th className="p-3.5 text-right font-black">القاعة / منشأة التوريد</th>
                        <th className="p-3.5 text-right font-black">الفرع</th>
                        <th className="p-3.5 text-right font-black">مسؤول التشغيل</th>
                        <th className="p-3.5 text-right font-black">الوقت</th>
                        <th className="p-3.5 text-center font-black">الحالة الميدانية واللوجستية</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      {currentItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3.5 font-mono font-bold text-slate-400">{item.id}</td>
                          <td className="p-3.5 font-black text-slate-800">{item.title}</td>
                          <td className="p-3.5 font-bold text-slate-600">
                            {item.type === 'event' ? 'حجز قاعة رئيسية' : 'خدمة لوجستية وتجهيز'}
                          </td>
                          <td className="p-3.5 font-bold text-indigo-700">{item.hall}</td>
                          <td className="p-3.5 font-medium text-slate-500">{item.branch}</td>
                          <td className="p-3.5 font-medium text-slate-600">{item.manager}</td>
                          <td className="p-3.5 font-mono text-slate-500">{item.time}</td>
                          <td className="p-3.5 text-center">{getStatusBadge(item.status, item.statusColor, item)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                /* Render Grid Mode */
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {currentItems.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 bg-slate-50/70 rounded-2xl border border-slate-100 space-y-2 hover:border-indigo-100 transition-all text-right"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-mono text-slate-400">{item.id}</span>
                        <span className="text-[10px] font-black text-indigo-900">{item.hall}</span>
                      </div>
                      <h4 className="text-xs font-black text-slate-800 truncate">{item.title}</h4>
                      <div className="text-[10px] text-slate-500 space-y-0.5">
                        <p>
                          المسؤول: <span className="font-bold text-slate-700">{item.manager}</span>
                        </p>
                        <p>
                          التوقيت: <span className="font-bold font-mono">{item.time}</span>
                        </p>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        {getStatusBadge(item.status, item.statusColor, item)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                {/* Previous page */}
                <button
                  onClick={() => setLogisticsPage((p) => Math.max(1, p - 1))}
                  disabled={logisticsPage === 1}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[38px] ${
                    logisticsPage === 1
                      ? 'text-slate-300 border border-slate-100 bg-slate-50 cursor-not-allowed'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>الصفحة السابقة</span>
                </button>

                <div className="text-xs font-black text-slate-600">
                  <span>
                    صفحة {logisticsPage} من {totalPages}
                  </span>
                  <span className="text-[10px] text-slate-400 mr-1.5">({totalItems} سجلات تشغيلية)</span>
                </div>

                {/* Next page */}
                <button
                  onClick={() => setLogisticsPage((p) => Math.min(totalPages, p + 1))}
                  disabled={logisticsPage === totalPages}
                  className={`flex items-center gap-1 px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer min-h-[38px] ${
                    logisticsPage === totalPages
                      ? 'text-slate-300 border border-slate-100 bg-slate-50 cursor-not-allowed'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>الصفحة التالية</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* 4. BUSINESS HEALTH INDICATORS */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">BUSINESS HEALTH & SATISFACTION</span>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-800">مؤشرات الصحة التشغيلية وجودة خدمات المنشأة</h3>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block">معدل قبول الحجوزات</span>
            <span className="text-xl font-black text-indigo-600 font-mono block">٩٨.٤٪</span>
            <span className="text-[9px] text-emerald-600 block mt-1 font-bold">ممتاز (أعلى من متوسط الشركاء)</span>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block">معدل إلغاء الحجوزات</span>
            <span className="text-xl font-black text-emerald-600 font-mono block">١.٢٪</span>
            <span className="text-[9px] text-slate-400 block mt-1">منخفض ومستقر تماماً</span>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block">متوسط التقييم العام للعملاء</span>
            <div className="flex items-center justify-end gap-1">
              <span className="text-xl font-black text-slate-800 font-mono">٤.٩ / ٥</span>
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
            </div>
            <span className="text-[9px] text-slate-400 block mt-1">إجمالي التقييمات: 140 عميل سعيد</span>
          </div>

          <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
            <span className="text-[10px] font-bold text-slate-400 block">متوسط زمن الاستجابة والرد</span>
            <span className="text-xl font-black text-purple-600 font-mono">٨ دقائق</span>
            <span className="text-[9px] text-emerald-600 block mt-1 font-bold">أسرع من 95% من مقدمي الخدمة</span>
          </div>
        </div>
      </div>

      {/* 5. INTERACTIVE PERFORMANCE GRAPH */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">SALES GROWTH ANALYTICS</span>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-black text-slate-800">مخطط أداء المبيعات والإيرادات الأسبوعي المجمع</h3>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={[
                { day: 'السبت', bookings: 12000, services: 3500 },
                { day: 'الأحد', bookings: 8000, services: 2000 },
                { day: 'الإثنين', bookings: 15000, services: 4500 },
                { day: 'الثلاثاء', bookings: 9500, services: 3000 },
                { day: 'الأربعاء', bookings: 11000, services: 2500 },
                { day: 'الخميس', bookings: 22000, services: 6000 },
                { day: 'الجمعة', bookings: 25000, services: 7500 },
              ]}
              margin={{ top: 10, right: 10, bottom: 0, left: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
              <RechartsTooltip />
              <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }} />
              <Area type="monotone" dataKey="bookings" name="إيرادات القاعات" fill="#e0e7ff" stroke="#4f46e5" strokeWidth={2} />
              <Bar dataKey="services" name="مبيعات الخدمات التكميلية" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={16} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
