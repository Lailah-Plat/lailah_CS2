import React, { useState, useMemo, useEffect } from 'react';
import { 
  AlertTriangle, ShieldAlert, RefreshCw, Filter, Search, 
  CheckCircle2, Clock, DollarSign, FileText, HeadphonesIcon, 
  ArrowUpRight, ExternalLink, Zap, ShieldCheck, MessageCircle, 
  Building2, User, ChevronRight, X, AlertCircle, ArrowRight
} from 'lucide-react';

interface UrgentAlertsDashboardProps {
  showNotification?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  setActiveTab?: (tabId: any) => void;
  bookings?: any[];
  supportServiceRequests?: any[];
}

export interface UrgentAlert {
  id: string; // e.g. BKG-26-0000000012 or SRV-26-0000000088 or INV-260000000045 or REV-26-0000000019
  title: string;
  category: 'financial' | 'dispute' | 'support' | 'invoice' | 'operational';
  severity: 'critical' | 'high' | 'medium';
  providerName: string;
  customerName: string;
  amount: number;
  timestamp: string;
  status: 'pending' | 'in_progress' | 'resolved';
  description: string;
  suggestedAction: string;
}

const INITIAL_ALERTS: UrgentAlert[] = [
  {
    id: 'BKG-26-0000000088',
    title: 'تفاوت في تسوية الدفعة المالية الموقوفة لحجز قاعة الريم الملكية',
    category: 'financial',
    severity: 'critical',
    providerName: 'مجموعة الريم للمناسبات',
    customerName: 'عبدالرحمن العتيبي',
    amount: 12500,
    timestamp: 'قبل 5 دقائق',
    status: 'pending',
    description: 'تم رصد تفاوت بين قيمة الضمان المسترد وقيمة المحفزة المسجلة بالنظام. الحجز بانتظار الاعتماد المالي الفوري.',
    suggestedAction: 'تعديل الفروقات المباشرة وإصدار سند تسويةREV-26-0000000018 وتفعيل الصرف.'
  },
  {
    id: 'SRV-26-0000000041',
    title: 'بلاغ نزاع عاجل: عدم الالتزام بتوفير باقة الضيافة الملكية في الموعد',
    category: 'dispute',
    severity: 'critical',
    providerName: 'مؤسسة الماس للضيافة والتنظيم',
    customerName: 'فاطمة الشمري',
    amount: 8400,
    timestamp: 'قبل 12 دقيقة',
    status: 'pending',
    description: 'أفاد العميل بعدم وصول فريق الضيافة قبل ساعتين من بدء المناسبة. تذكرة النزاع مرفوعة بانتظار الشدة والربط.',
    suggestedAction: 'فتح شات طوارئ مباشر مع المزود وتحويل المبلغ لحساب الضمان المؤقت.'
  },
  {
    id: 'INV-260000000092',
    title: 'تعثر ربط الفاتورة الضريبية ZATCA Phase-2 بسبب نقص المعرّف الضريبي',
    category: 'invoice',
    severity: 'high',
    providerName: 'قاعة اللؤلؤة الكبرى',
    customerName: 'خالد السديري',
    amount: 18000,
    timestamp: 'قبل 24 دقيقة',
    status: 'pending',
    description: 'فشل إرسال الفاتورة الضريبية لشركة الهيئة العامة للزكاة والدخل لعدم استكمال الرقم الضريبي الموحد للمزود.',
    suggestedAction: 'إخطار المزود بتعديل البيانات الضريبية وإعادة المحاولة التلقائية للفاتورة INV-260000000092.'
  },
  {
    id: 'SRV-26-0000000015',
    title: 'تجاوز زمن SLA المحدد لتذكرة دعم فني طارئ (معدات الصوت)',
    category: 'support',
    severity: 'high',
    providerName: 'شركة النجوم للصوتيات والإضاءة',
    customerName: 'سارة الدوسري',
    amount: 3500,
    timestamp: 'قبل 45 دقيقة',
    status: 'in_progress',
    description: 'تأخر الرد من فريق الدعم الفني المباشر لأكثر من 30 دقيقة على استفسار العميل بخصوص أجهزة الصوت.',
    suggestedAction: 'تصعيد التذكرة إلى مشرف الدعم الفني الفوري وتخصيص تعويض نقاط ولاء للعميل.'
  },
  {
    id: 'REV-26-0000000034',
    title: 'اشتباه عملية دفع مكررة من محفظة العميل للحجز BKG-26-0000000034',
    category: 'financial',
    severity: 'medium',
    providerName: 'قاعة الأسطورة للعمليات',
    customerName: 'محمد الغامدي',
    amount: 5000,
    timestamp: 'قبل ساعة واحدة',
    status: 'pending',
    description: 'تم خصم مبلغ الحجز مرتين متتاليتين عبر بوابة مدى بسبب بطء الاتصال بالويب هولك.',
    suggestedAction: 'إجراء استرداد تلقائي فورياً للمبلغ المكرر (SAR 5,000) لحساب المحفظة المباشرة.'
  }
];

export function UrgentAlertsDashboard({
  showNotification = () => {},
  setActiveTab = () => {},
  bookings = [],
  supportServiceRequests = []
}: UrgentAlertsDashboardProps) {
  const [alerts, setAlerts] = useState<UrgentAlert[]>(() => {
    const saved = localStorage.getItem('LAILAH_URGENT_ALERTS');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return INITIAL_ALERTS;
  });

  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('الآن (مزامنة لحظية)');

  // Selected Alert for resolution modal
  const [selectedAlert, setSelectedAlert] = useState<UrgentAlert | null>(null);
  const [actionNotes, setActionNotes] = useState<string>('');
  const [selectedResolution, setSelectedResolution] = useState<string>('refund');

  // Save changes to localStorage
  useEffect(() => {
    localStorage.setItem('LAILAH_URGENT_ALERTS', JSON.stringify(alerts));
  }, [alerts]);

  // Instant Sync Handler
  const handleInstantSync = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      const now = new Date();
      const timeStr = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
      setLastSyncTime(`تمت المزامنة اللحظية في ${timeStr}`);
      showNotification('success', 'تم تحديث الإنذارات التشغيلية والمالية بنجاح ومزامنة السجلات الحية!');
    }, 800);
  };

  // Filtered Alerts
  const filteredAlerts = useMemo(() => {
    return alerts.filter(alert => {
      const matchesSeverity = filterSeverity === 'all' || alert.severity === filterSeverity;
      const matchesCategory = filterCategory === 'all' || alert.category === filterCategory;
      const matchesSearch = 
        alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        alert.customerName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSeverity && matchesCategory && matchesSearch;
    });
  }, [alerts, filterSeverity, filterCategory, searchQuery]);

  // Summary Metrics
  const metrics = useMemo(() => {
    const criticalCount = alerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;
    const pendingCount = alerts.filter(a => a.status === 'pending').length;
    const totalAmountAtRisk = alerts
      .filter(a => a.status !== 'resolved')
      .reduce((sum, a) => sum + (a.amount || 0), 0);
    return { criticalCount, pendingCount, totalAmountAtRisk };
  }, [alerts]);

  // Handle Resolve Alert
  const handleResolveAlert = () => {
    if (!selectedAlert) return;
    
    setAlerts(prev => prev.map(a => {
      if (a.id === selectedAlert.id) {
        return {
          ...a,
          status: 'resolved',
          description: `${a.description} - (تمت المعالجة: ${actionNotes || 'تم تنفيذ الإجراء المطلوب بنجاح'})`
        };
      }
      return a;
    }));

    showNotification('success', `تمت معالجة الإنذار رقم ${selectedAlert.id} بنجاح وإشعار الأطراف ذات الصلة!`);
    setSelectedAlert(null);
    setActionNotes('');
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-rose-950 via-slate-900 to-indigo-950 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden border border-rose-900/40">
        <div className="absolute top-0 left-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
              <ShieldAlert className="w-4 h-4 animate-pulse text-rose-400" />
              مركز المراقبة والإنذارات العاجلة - نظام حماية العمليات والسيادة الماليّة
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              الإنذارات التشغيلية والمالية العاجلة 🚨
            </h1>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              شاشة مركزية لمتابعة ومعالجة النزاعات المعلقة، التفاوتات المالية، تعثر الفواتير الضريبية، وبلاغات الدعم الفني الحرجة بشكل لحظي ومباشر.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs text-rose-200 bg-black/40 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 font-mono">
              {lastSyncTime}
            </div>
            <button
              onClick={handleInstantSync}
              disabled={isRefreshing}
              className="px-5 py-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm rounded-2xl shadow-lg hover:shadow-rose-500/30 transition-all flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              تحديث فوري للمزامنة
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">الإنذارات الحرجة المعلقة</p>
            <h3 className="text-2xl font-black text-rose-600 dark:text-rose-400">{metrics.criticalCount} إنذارات</h3>
            <p className="text-[10px] text-rose-500 font-semibold">تتطلب تدخل الإدارة فوراً</p>
          </div>
          <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 rounded-2xl">
            <AlertTriangle className="w-6 h-6 animate-bounce" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">المبالغ تحت المراجعة والتحفظ</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {metrics.totalAmountAtRisk.toLocaleString()} <span className="text-xs text-slate-500">ر.س</span>
            </h3>
            <p className="text-[10px] text-amber-500 font-semibold">محفوظة في حساب الضمان المؤقت</p>
          </div>
          <div className="p-3.5 bg-amber-50 dark:bg-amber-950/40 text-amber-600 rounded-2xl">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">إجمالي البلاغات والإنذارات</p>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{alerts.length} بلاغات</h3>
            <p className="text-[10px] text-emerald-600 font-semibold">نسبة المعالجة التلقائية 94.2%</p>
          </div>
          <div className="p-3.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400">متوسط زمن الاستجابة الفوري</p>
            <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">14 دقيقة</h3>
            <p className="text-[10px] text-emerald-600 font-semibold">ضمن نطاق اتفاقية SLA العاجلة</p>
          </div>
          <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 rounded-2xl">
            <Clock className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          
          {/* Search Box */}
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 absolute right-3.5 top-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث برقم المعاملة، اسم المزود، العميل، أو السبب..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white rounded-2xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          {/* Severity Filters */}
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> الأهمية:
            </span>
            <button
              onClick={() => setFilterSeverity('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterSeverity === 'all' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}
            >
              الكل ({alerts.length})
            </button>
            <button
              onClick={() => setFilterSeverity('critical')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterSeverity === 'critical' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'}`}
            >
              حرج للغاية 🚨
            </button>
            <button
              onClick={() => setFilterSeverity('high')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterSeverity === 'high' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'}`}
            >
              عالي ⚠️
            </button>
            <button
              onClick={() => setFilterSeverity('medium')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${filterSeverity === 'medium' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'}`}
            >
              متوسط ℹ️
            </button>
          </div>

        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs font-bold text-slate-500">التصنيف:</span>
          {[
            { id: 'all', label: 'كافة التصنيفات' },
            { id: 'financial', label: 'تفاوتات مالية وسندات (REV/EXP)' },
            { id: 'dispute', label: 'نزاعات وصعوبات حجوزات (BKG)' },
            { id: 'support', label: 'بلاغات الدعم الطارئ (SRV)' },
            { id: 'invoice', label: 'فواتير ضريبية (INV)' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all ${filterCategory === cat.id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-12 text-center border border-slate-200 dark:border-slate-800 space-y-3">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">لا توجد إنذارات عاجلة تطابق الفلتر المحدد</h3>
            <p className="text-xs text-slate-500">جميع المعاملات والنزاعات تحت السيطرة وتعمل بسلاسة تامة.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isResolved = alert.status === 'resolved';
            return (
              <div
                key={alert.id}
                className={`bg-white dark:bg-slate-900 rounded-3xl p-5 border transition-all shadow-sm hover:shadow-md ${
                  isResolved 
                    ? 'border-emerald-200 bg-emerald-50/20 dark:border-emerald-900/30' 
                    : alert.severity === 'critical'
                    ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/10'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  
                  {/* Alert Content */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700">
                        {alert.id}
                      </span>

                      {alert.severity === 'critical' && (
                        <span className="px-2.5 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-black flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> حرج للغاية
                        </span>
                      )}
                      {alert.severity === 'high' && (
                        <span className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-black">
                          عالي ⚠️
                        </span>
                      )}
                      {alert.severity === 'medium' && (
                        <span className="px-2.5 py-1 rounded-lg bg-blue-500 text-white text-[10px] font-black">
                          متوسط ℹ️
                        </span>
                      )}

                      <span className="text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                        {alert.timestamp}
                      </span>

                      {isResolved && (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-black flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> تمت المعالجة بنجاح
                        </span>
                      )}
                    </div>

                    <h3 className="font-extrabold text-base text-slate-900 dark:text-white leading-snug">
                      {alert.title}
                    </h3>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {alert.description}
                    </p>

                    {/* Metadata summary */}
                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <Building2 className="w-3.5 h-3.5 text-indigo-500" /> المزود: {alert.providerName}
                      </span>
                      <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                        <User className="w-3.5 h-3.5 text-emerald-500" /> العميل: {alert.customerName}
                      </span>
                      <span className="flex items-center gap-1 font-extrabold text-rose-600 dark:text-rose-400">
                        <DollarSign className="w-3.5 h-3.5" /> القيمة: {alert.amount.toLocaleString()} ر.س
                      </span>
                    </div>

                    {/* Suggested Action */}
                    <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-2xl border border-amber-200/50 dark:border-amber-900/30 text-[11px] text-amber-900 dark:text-amber-200 flex items-start gap-2">
                      <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="font-black">التوصية البرمجية العاجلة:</strong> {alert.suggestedAction}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0 justify-center border-t lg:border-t-0 pt-3 lg:pt-0 border-slate-100 dark:border-slate-800">
                    {!isResolved ? (
                      <>
                        <button
                          onClick={() => setSelectedAlert(alert)}
                          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                        >
                          <Zap className="w-3.5 h-3.5" /> معالجة فورية وتوثيق
                        </button>
                        <button
                          onClick={() => {
                            setActiveTab('messages');
                            showNotification('info', `تم توجيهك لشات الطوارئ للتعامل مع المعاملة ${alert.id}`);
                          }}
                          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5"
                        >
                          <MessageCircle className="w-3.5 h-3.5 text-indigo-500" /> شات مباشر مع الأطراف
                        </button>
                      </>
                    ) : (
                      <button
                        disabled
                        className="px-4 py-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold rounded-xl flex items-center justify-center gap-1 cursor-default"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> مكتملة
                      </button>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Resolution Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                  اتخاذ إجراء معالجة عاجل للمعاملة {selectedAlert.id}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedAlert(null)}
                className="p-1 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-1">
                <p className="font-bold text-slate-800 dark:text-white">{selectedAlert.title}</p>
                <p className="text-slate-500">المزود: {selectedAlert.providerName} | العميل: {selectedAlert.customerName}</p>
                <p className="text-rose-600 font-extrabold">المبلغ المتأثر: {selectedAlert.amount.toLocaleString()} ر.س</p>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">اختر إجراء المعالجة السيادية:</label>
                <select
                  value={selectedResolution}
                  onChange={(e) => setSelectedResolution(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold text-xs"
                >
                  <option value="refund">اعتماد استرداد تلقائي لحساب محفظة العميل (Refund to Wallet)</option>
                  <option value="release_escrow">إفراج عن المبلغ وتحويله لمزود الخدمة (Release Escrow)</option>
                  <option value="compensation">إصدار كوبون تعويض نقاط ولاء وتسوية النزاع</option>
                  <option value="legal_escalation">إحالة إلى فريق الشؤون القانونية للتحقيق</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">ملاحظات المعالجة وتوثيق القرار:</label>
                <textarea
                  rows={3}
                  value={actionNotes}
                  onChange={(e) => setActionNotes(e.target.value)}
                  placeholder="اكتب سبب اتخاذ القرار والتوجيهات المرفقة للتوثيق المحاسبي..."
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs focus:ring-2 focus:ring-rose-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleResolveAlert}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all"
              >
                اعتماد وتأفيذ المعالجة الفورية
              </button>
              <button
                onClick={() => setSelectedAlert(null)}
                className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
              >
                إلغاء
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
