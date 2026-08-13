import React, { useState, useEffect, useRef } from 'react';
import { Bell, AlertTriangle, ShieldAlert, CheckCircle2, DollarSign, FileText, Headphones, Scale, Zap, ExternalLink, RefreshCw, X, MessageSquare, AlertCircle } from 'lucide-react';

interface AdminHeaderNotificationBellProps {
  userRole: 'admin' | 'provider' | 'agency' | 'customer' | string;
  setActiveTab?: (tabId: any) => void;
  theme?: string;
  toggleTheme?: () => void;
}

export const AdminHeaderNotificationBell: React.FC<AdminHeaderNotificationBellProps> = ({
  userRole,
  setActiveTab,
  theme,
  toggleTheme,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | 'financial' | 'operational'>('all');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [readAlertIds, setReadAlertIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('ADMIN_READ_ALERT_IDS') || '[]');
    } catch (e) {
      return [];
    }
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Function to scan and construct operational & financial alerts
  const fetchOperationalAlerts = async () => {
    const newAlerts: any[] = [];

    if (userRole === 'admin' || userRole === 'مدير' || userRole === 'مشرف') {
      // 1. Pending Halls Approval
      try {
        const storedHalls = JSON.parse(localStorage.getItem('ais_halls_v2') || '[]');
        const pendingHalls = storedHalls.filter((h: any) => h.status === 'pending' || h.status === 'قيد الانتظار' || h.approvalStatus === 'pending');
        if (pendingHalls.length > 0) {
          newAlerts.push({
            id: 'alert_pending_halls',
            category: 'operational',
            type: 'warning',
            title: 'موافقات القاعات والمرافق',
            message: `هناك ${pendingHalls.length} طلب قاعة/مرفق جديد بانتظار الاعتماد المالي والفني للإدارة.`,
            actionLabel: 'مراجعة واعتماد القاعات',
            tab: 'halls',
            sovereign: true,
            icon: FileText,
            color: 'amber'
          });
        }
      } catch (e) {}

      // 2. Pending Supporting Services Approval
      try {
        const storedServices = JSON.parse(localStorage.getItem('ais_services_v2') || '[]');
        const pendingServices = storedServices.filter((s: any) => s.status === 'pending' || s.status === 'قيد الانتظار' || s.approvalStatus === 'pending');
        if (pendingServices.length > 0) {
          newAlerts.push({
            id: 'alert_pending_services',
            category: 'operational',
            type: 'warning',
            title: 'اعتماد الخدمات المساندة',
            message: `تم تسجيل ${pendingServices.length} خدمة مساندة جديدة معلقة تتطلب التقييم والمطابقة.`,
            actionLabel: 'فحص الخدمات المساندة',
            tab: 'services',
            sovereign: true,
            icon: Zap,
            color: 'indigo'
          });
        }
      } catch (e) {}

      // 3. Support Tickets & Dispute Claims
      try {
        let rawTickets: any[] = [];
        const res = await fetch('/api/support/tickets').catch(() => null);
        if (res && res.ok) {
          const data = await res.json();
          rawTickets = data.tickets || (Array.isArray(data) ? data : []);
        } else {
          rawTickets = JSON.parse(localStorage.getItem('SUPPORT_TICKETS_V2') || '[]');
        }
        const openTickets = rawTickets.filter((t: any) => 
          t.status === 'open' || t.status === 'مفتوحة' || t.status === 'pending' || t.status === 'قيد الانتظار' || t.category === 'dispute' || t.priority === 'high'
        );
        if (openTickets.length > 0) {
          newAlerts.push({
            id: 'alert_pending_tickets',
            category: 'operational',
            type: 'danger',
            title: 'تذاكر الدعم ونزاعات العملاء',
            message: `يوجد ${openTickets.length} تذكرة دعم أو شكوى نزاع تشغيلي مفتوحة وتتطلب التدخل الإداري.`,
            actionLabel: 'إدارة النزاعات والتذاكر',
            tab: 'support',
            sovereign: true,
            icon: Scale,
            color: 'rose'
          });
        }
      } catch (e) {}

      // 4. Pending Withdrawals & Financial Settlements
      try {
        let pendingWithdrawalsCount = 0;
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && (key.startsWith('provider_withdrawals_') || key === 'PLATFORM_WITHDRAW_REQUESTS')) {
            const items = JSON.parse(localStorage.getItem(key) || '[]');
            if (Array.isArray(items)) {
              pendingWithdrawalsCount += items.filter((w: any) => w.status === 'معلق' || w.status === 'pending').length;
            }
          }
        }
        if (pendingWithdrawalsCount > 0) {
          newAlerts.push({
            id: 'alert_pending_withdrawals',
            category: 'financial',
            type: 'danger',
            title: 'طلبات سحب الأرباح والتسويات',
            message: `يوجد ${pendingWithdrawalsCount} طلب سحب أرباح للمزودين بانتظار المطابقة والتحويل البنكي.`,
            actionLabel: 'معالجة التسويات المالية',
            tab: 'finance',
            sovereign: true,
            icon: DollarSign,
            color: 'emerald'
          });
        }
      } catch (e) {}

      // 5. Force Majeure Claims
      try {
        const forceMajeureList = JSON.parse(localStorage.getItem('force_majeure_requests') || '[]');
        const pendingFM = forceMajeureList.filter((f: any) => f.status === 'pending' || f.status === 'قيد الدراسة' || f.status === 'قيد المراجعة');
        if (pendingFM.length > 0) {
          newAlerts.push({
            id: 'alert_pending_force_majeure',
            category: 'operational',
            type: 'danger',
            title: 'مطالبات القوة القاهرة والظروف الطارئة',
            message: `هناك ${pendingFM.length} طلب إلغاء طارئ بحاجة للبت المالي السيادي من الإدارة.`,
            actionLabel: 'البت في القوة القاهرة',
            tab: 'bookings',
            sovereign: true,
            icon: ShieldAlert,
            color: 'purple'
          });
        }
      } catch (e) {}

      // 6. High Value Transactions Audit (> 50,000 SAR)
      try {
        const storedBookings = JSON.parse(localStorage.getItem('ais_bookings_v2') || '[]');
        const highValBookings = storedBookings.filter((b: any) => 
          ((b.totalAmount && b.totalAmount >= 50000) || (b.totalPrice && b.totalPrice >= 50000) || (b.amount && b.amount >= 50000)) &&
          (b.status === 'pending' || b.status === 'مؤكد جزئياً' || b.paymentStatus === 'موقوف بالمحفظة')
        );
        if (highValBookings.length > 0) {
          newAlerts.push({
            id: 'alert_high_value_bookings',
            category: 'financial',
            type: 'info',
            title: 'رقابة المعاملات المالية الكبرى',
            message: `تم رصد ${highValBookings.length} معاملات حجز ضخمة (تتجاوز 50,000 ر.س) تحت الرقابة المالية التلقائية.`,
            actionLabel: 'المركز المالي للضمان',
            tab: 'finance',
            sovereign: true,
            icon: DollarSign,
            color: 'blue'
          });
        }
      } catch (e) {}

      // 7. Pending Provider Verification Documents
      try {
        const storedProviders = JSON.parse(localStorage.getItem('ais_providers_v2') || '[]');
        const pendingDocs = storedProviders.filter((p: any) => 
          p.verificationStatus === 'pending' || p.status === 'قيد المراجعة' || p.documentsStatus === 'pending'
        );
        if (pendingDocs.length > 0) {
          newAlerts.push({
            id: 'alert_pending_provider_docs',
            category: 'operational',
            type: 'info',
            title: 'وثائق امتثال الشركاء الجدد',
            message: `هناك ${pendingDocs.length} شركاء جديد قاموا برفع السجل التجاري والوثائق الرسمية للمطابقة.`,
            actionLabel: 'فحص ملفات الشركاء',
            tab: 'providers',
            sovereign: true,
            icon: FileText,
            color: 'cyan'
          });
        }
      } catch (e) {}
    } else if (userRole === 'provider') {
      // Provider operational alerts
      try {
        const providerName = JSON.parse(localStorage.getItem('currentUser') || '{}').name || '';
        const storedBookings = JSON.parse(localStorage.getItem('ais_bookings_v2') || '[]');
        const providerPendingBookings = storedBookings.filter((b: any) => 
          (b.provider === providerName || b.providerName === providerName || b.providerId) &&
          (b.status === 'pending' || b.status === 'بانتظار موافقة المزود')
        );
        if (providerPendingBookings.length > 0) {
          newAlerts.push({
            id: 'provider_pending_bookings',
            category: 'operational',
            type: 'warning',
            title: 'حجوزات جديدة بانتظار موافقتك',
            message: `لديك ${providerPendingBookings.length} طلبات حجز معلقة تتطلب تأكيدك المباشر.`,
            actionLabel: 'إدارة الحجوزات',
            tab: 'bookings',
            sovereign: false,
            icon: Zap,
            color: 'amber'
          });
        }
      } catch (e) {}
    }

    setAlerts(newAlerts);
  };

  useEffect(() => {
    fetchOperationalAlerts();

    // Listen for real-time application updates
    const handleUpdate = () => fetchOperationalAlerts();
    window.addEventListener('bookingsUpdated', handleUpdate);
    window.addEventListener('hallsUpdated', handleUpdate);
    window.addEventListener('servicesUpdated', handleUpdate);
    window.addEventListener('support-tickets-updated', handleUpdate);
    window.addEventListener('withdrawals-updated', handleUpdate);
    window.addEventListener('documents-updated', handleUpdate);
    window.addEventListener('finance-updated', handleUpdate);
    window.addEventListener('settingsUpdated', handleUpdate);

    // Close dropdown on outside click
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('bookingsUpdated', handleUpdate);
      window.removeEventListener('hallsUpdated', handleUpdate);
      window.removeEventListener('servicesUpdated', handleUpdate);
      window.removeEventListener('support-tickets-updated', handleUpdate);
      window.removeEventListener('withdrawals-updated', handleUpdate);
      window.removeEventListener('documents-updated', handleUpdate);
      window.removeEventListener('finance-updated', handleUpdate);
      window.removeEventListener('settingsUpdated', handleUpdate);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [userRole]);

  const unreadAlerts = alerts.filter(a => !readAlertIds.includes(a.id));
  const filteredAlerts = alerts.filter(a => {
    if (activeFilter === 'financial') return a.category === 'financial';
    if (activeFilter === 'operational') return a.category === 'operational';
    return true;
  });

  const markAllAsRead = () => {
    const allIds = alerts.map(a => a.id);
    setReadAlertIds(allIds);
    localStorage.setItem('ADMIN_READ_ALERT_IDS', JSON.stringify(allIds));
  };

  const handleActionClick = (tab?: string) => {
    setIsOpen(false);
    if (tab && setActiveTab) {
      setActiveTab(tab);
    }
  };

  return (
    <div className="relative inline-block text-right" ref={dropdownRef} dir="rtl">
      {/* The Interactive Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-2xl transition-all cursor-pointer flex items-center justify-center ${
          unreadAlerts.length > 0
            ? 'bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 ring-2 ring-amber-500/40 animate-pulse'
            : 'bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
        }`}
        title="الإنذارات التشغيلية والمالية العاجلة"
      >
        <Bell className="w-5 h-5" />

        {/* Unread Counter Badge */}
        {unreadAlerts.length > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 bg-rose-600 text-white text-[10px] font-black rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center animate-bounce shadow-md">
            {unreadAlerts.length}
            <span className="absolute -inset-0.5 rounded-full bg-rose-500/60 animate-ping pointer-events-none"></span>
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute left-0 right-auto mt-3 w-80 sm:w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-950 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex justify-between items-center border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
              </span>
              <div>
                <h3 className="font-black text-xs text-amber-300">الإنذارات التشغيلية والمالية العاجلة</h3>
                <p className="text-[10px] text-slate-300">مراقبة تلقائية للأحداث والقرارات الحساسة 24/7</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {unreadAlerts.length > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded-lg text-slate-200 font-bold transition-all cursor-pointer"
                >
                  مسح الشارات
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-all"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-slate-50 dark:bg-slate-900/80 p-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                الكل ({alerts.length})
              </button>
              <button
                onClick={() => setActiveFilter('financial')}
                className={`px-3 py-1 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer ${
                  activeFilter === 'financial'
                    ? 'bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                المالية والسيادية
              </button>
              <button
                onClick={() => setActiveFilter('operational')}
                className={`px-3 py-1 rounded-xl font-extrabold text-[11px] transition-all cursor-pointer ${
                  activeFilter === 'operational'
                    ? 'bg-slate-900 text-amber-400 dark:bg-amber-500 dark:text-slate-950 shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
                }`}
              >
                التشغيلية والنزاعات
              </button>
            </div>

            <button
              onClick={fetchOperationalAlerts}
              className="p-1 text-slate-400 hover:text-amber-500 transition-all"
              title="تحديث فوري"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Alerts List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 p-2 space-y-2">
            {filteredAlerts.length === 0 ? (
              <div className="p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto opacity-80" />
                <p className="text-xs font-bold text-slate-700 dark:text-slate-300">لا توجد إنذارات تشغيلية عاجلة معلقة</p>
                <p className="text-[10px] text-slate-400">جميع المعاملات والطلبات والنزاعات معالجة ومستقرة تماماً.</p>
              </div>
            ) : (
              filteredAlerts.map((alert) => {
                const IconComponent = alert.icon || AlertCircle;
                const isUnread = !readAlertIds.includes(alert.id);

                return (
                  <div
                    key={alert.id}
                    className={`p-3.5 rounded-2xl transition-all border ${
                      isUnread
                        ? 'bg-amber-500/5 border-amber-500/30 dark:bg-amber-500/10'
                        : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl shrink-0 ${
                        alert.type === 'danger'
                          ? 'bg-rose-500/10 text-rose-500'
                          : alert.type === 'warning'
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}>
                        <IconComponent className="w-5 h-5" />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                            {alert.title}
                          </h4>
                          {alert.sovereign && (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-500 text-[9px] font-black border border-rose-500/20 shrink-0">
                              تنبيه سيادي غير قابل للتعطيل
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                          {alert.message}
                        </p>

                        <div className="pt-2 flex items-center justify-between">
                          <button
                            onClick={() => handleActionClick(alert.tab)}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-amber-400 hover:text-indigo-800 dark:hover:text-amber-300 bg-indigo-50 dark:bg-amber-500/10 hover:bg-indigo-100 dark:hover:bg-amber-500/20 px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                          >
                            <span>{alert.actionLabel}</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>

                          <span className="text-[9px] text-slate-400 font-bold">
                            الوضع: نشط وفوري
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-900 text-center border-t border-slate-200 dark:border-slate-800 space-y-2">
            <button
              onClick={() => handleActionClick('urgent_alerts')}
              className="w-full py-2 bg-gradient-to-r from-red-900 via-slate-900 to-red-950 hover:from-red-800 hover:to-red-900 text-red-200 font-extrabold text-xs rounded-xl border border-red-800/60 shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>🚨</span>
              <span>عرض لوحة الإنذارات والنزاعات التفصيلية (Urgent Alerts)</span>
            </button>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-bold">
              🔒 نظام الإنذارات محمي برمجياً وسيادياً ولا يمكن إيقاف تنبيهاته للإدارة
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
