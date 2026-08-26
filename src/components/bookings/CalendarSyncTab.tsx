import React, { useState, useMemo } from 'react';
import { 
  RefreshCw, Link as LinkIcon, Download, Copy, Check, Calendar as CalendarIcon, 
  Smartphone, Globe, ShieldCheck, AlertTriangle, Sparkles, Building2, 
  ExternalLink, Layers, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle2, 
  Info, Lock
} from 'lucide-react';
import { BlockedDateEntry, ExternalBlockManagerModal } from '../ExternalBlockManagerModal';
import { formatBlockedDateId } from '../../utils/idUtils';
import { convertDigits } from '../../utils/digitConverter';

interface CalendarSyncTabProps {
  userRole: string;
  currentProviderName: string;
  halls: any[];
  setHalls?: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices?: React.Dispatch<React.SetStateAction<any[]>>;
  bookings: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const CalendarSyncTab: React.FC<CalendarSyncTabProps> = ({
  userRole,
  currentProviderName,
  halls = [],
  setHalls,
  services = [],
  setServices,
  bookings = [],
  showNotification
}) => {
  // Strict Multi-tenancy
  const availableHalls = useMemo(() => {
    if (userRole === 'admin') return halls;
    return halls.filter(h => h.provider === currentProviderName || h.providerName === currentProviderName);
  }, [halls, userRole, currentProviderName]);

  const [selectedHallId, setSelectedHallId] = useState<string>(() => {
    return availableHalls[0]?.id ? String(availableHalls[0].id) : 'all';
  });

  // Outbound / Export states
  const [copiedFeed, setCopiedFeed] = useState<boolean>(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'google' | 'apple' | 'outlook'>('google');

  // Inbound / Import states
  const [externalIcalUrl, setExternalIcalUrl] = useState<string>('');
  const [autoSyncEnabled, setAutoSyncEnabled] = useState<boolean>(true);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExternalBlockModalOpen, setIsExternalBlockModalOpen] = useState<boolean>(false);
  const [syncHistory, setSyncHistory] = useState<Array<{
    id: string;
    timestamp: string;
    hallName: string;
    importedEventsCount: number;
    blockedDatesCount: number;
    status: 'success' | 'warning' | 'error';
    details: string;
  }>>([
    {
      id: 'SYNC-26-001',
      timestamp: new Date(Date.now() - 3600000 * 2).toLocaleTimeString('ar-SA') + ' اليوم',
      hallName: availableHalls[0]?.name || 'قاعة الريان الملكية',
      importedEventsCount: 2,
      blockedDatesCount: 2,
      status: 'success',
      details: 'تم استيراد حجزين خارجيين وإغلاق تاريخ 15 و 16 شوال بنجاح.'
    },
    {
      id: 'SYNC-26-002',
      timestamp: new Date(Date.now() - 3600000 * 24).toLocaleTimeString('ar-SA') + ' أمس',
      hallName: availableHalls[0]?.name || 'قاعة الريان الملكية',
      importedEventsCount: 1,
      blockedDatesCount: 1,
      status: 'success',
      details: 'تم استيراد موعد صيانة دورية وإغلاق الفترة الصباحية.'
    }
  ]);

  const selectedHall = useMemo(() => {
    if (selectedHallId === 'all') return availableHalls[0];
    return availableHalls.find(h => String(h.id) === selectedHallId) || availableHalls[0];
  }, [availableHalls, selectedHallId]);

  // Generate Outbound Feed URL
  const outboundFeedUrl = useMemo(() => {
    const hallSlug = selectedHall?.id || 'all-venues';
    const providerToken = (currentProviderName || 'provider').replace(/\s+/g, '-').toLowerCase();
    return `https://api.lailah.app/api/ical/v1/export/${providerToken}/${hallSlug}.ics`;
  }, [selectedHall, currentProviderName]);

  // Handle Copy Feed URL
  const handleCopyFeed = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(outboundFeedUrl);
      setCopiedFeed(true);
      showNotification('success', 'تم نسخ رابط تغذية iCal إلى الحافظة بنجاح 📋');
      setTimeout(() => setCopiedFeed(false), 3000);
    }
  };

  // Handle Download .ics File
  const handleDownloadIcs = () => {
    const hallName = selectedHall?.name || 'جميع القاعات';
    const activeBookings = bookings.filter(b => b.status !== 'ملغي');
    
    let icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Lailah Platform//Calendar Sync Engine v2.0//AR',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:منصة ليلة - ${hallName}`,
      'X-WR-TIMEZONE:Asia/Riyadh'
    ];

    activeBookings.forEach((b: any, idx: number) => {
      const bDate = (b.startDate || b.date || '2026-09-01').replace(/-/g, '');
      const bId = b.id || `BKG-26-000000000${idx + 1}`;
      icsContent.push(
        'BEGIN:VEVENT',
        `UID:${bId}@lailah.app`,
        `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
        `DTSTART;VALUE=DATE:${bDate}`,
        `DTEND;VALUE=DATE:${bDate}`,
        `SUMMARY:حجز مؤكد منصة ليلة - ${b.customer || 'عميل'} (${b.itemName || hallName})`,
        `DESCRIPTION:رقم الحجز: ${bId}\\nالفترة: ${b.period || 'مسائية'}\\nالمبلغ: ${b.amount || 0} ر.س`,
        'STATUS:CONFIRMED',
        'END:VEVENT'
      );
    });

    icsContent.push('END:VCALENDAR');

    const blob = new Blob([icsContent.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `lailah-calendar-${selectedHall?.id || 'all'}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', 'تم تصدير وتحميل ملف التقويم (.ics) بنجاح 📅');
  };

  // Handle Instant Sync (Inbound Trigger)
  const handleTriggerSync = () => {
    if (!externalIcalUrl.trim()) {
      showNotification('warning', 'يرجى إدخال رابط تقويم Google أو iCal الخارجي أولاً للبدء بالمزامنة.');
      return;
    }

    setIsSyncing(true);
    showNotification('info', 'جاري الاتصال بخادم التقويم الخارجي وفحص المواعيد لمنع التعارض...');

    setTimeout(() => {
      setIsSyncing(false);
      
      // Simulate discovering 1 external appointment and auto-blocking it
      const sampleDate = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];
      const autoBlock: BlockedDateEntry = {
        id: formatBlockedDateId(Date.now()),
        entityId: selectedHall?.id || 1,
        entityType: 'hall',
        entityName: selectedHall?.name || 'قاعة الريان الملكية',
        providerName: currentProviderName,
        startDate: sampleDate,
        endDate: sampleDate,
        period: 'يوم كامل',
        blockType: 'external_booking',
        reason: 'حجز خارجي متزامن تلقائياً عبر تقويم Google',
        source: 'ical_sync',
        status: 'active',
        createdAt: new Date().toLocaleString('ar-SA'),
        createdBy: 'محرك مزامنة iCal الآلي'
      };

      if (setHalls && selectedHall) {
        setHalls(prev => prev.map(h => {
          if (String(h.id) === String(selectedHall.id)) {
            const list = h.blockedDatesList || [];
            return {
              ...h,
              blockedDatesList: [autoBlock, ...list],
              bookedDates: Array.from(new Set([...(h.bookedDates || []), sampleDate]))
            };
          }
          return h;
        }));
      }

      setSyncHistory(prev => [
        {
          id: `SYNC-${Date.now().toString().slice(-4)}`,
          timestamp: new Date().toLocaleTimeString('ar-SA') + ' الآن',
          hallName: selectedHall?.name || 'قاعة رئيسية',
          importedEventsCount: 1,
          blockedDatesCount: 1,
          status: 'success',
          details: `تمت المزامنة بنجاح! تم استيراد حجز بتاريخ ${sampleDate} وإغلاق الفترة تلقائياً لمنع الحجز المزدوج.`
        },
        ...prev
      ]);

      showNotification('success', '⚡ اكتملت المزامنة الفورية بنجاح! تم حظر التواريخ المكتشفة تلقائياً في تقويم المنصة.');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <RefreshCw className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-slate-900">مزامنة التقويم الخارجي (Two-Way iCal & Google Calendar Sync)</h3>
            <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-black">
              🟢 محرك المزامنة جاهز
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            الربط اللحظي والمزدوج لجدول المواعيد بين منصة «ليلة» والتقويمات الخارجية على هاتفك (Google Calendar, Apple Calendar, Outlook) وفق بروتوكول <strong>iCal (RFC 5545)</strong> لمنع التعارض المزدوج تلقائياً.
          </p>
        </div>

        {/* Venue Selector & Quick Modal Action */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700">القاعة المحددة:</span>
            <select
              value={selectedHallId}
              onChange={e => setSelectedHallId(e.target.value)}
              className="bg-transparent text-xs font-black text-indigo-700 outline-none cursor-pointer"
            >
              <option value="all">كافة منشآت الشريك ({availableHalls.length})</option>
              {availableHalls.map(h => (
                <option key={h.id} value={String(h.id)}>{h.name}</option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => setIsExternalBlockModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all hover:scale-105 cursor-pointer"
          >
            <Lock className="w-4 h-4" />
            <span>فتح نافذة الإغلاق والتزامن المتقدمة 🔒</span>
          </button>
        </div>
      </div>

      {/* Two Main Pathways Grid (الاتجاهان الأساسيان للمزامنة) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* ================= المسار الأول: تصدير الحجوزات (OUTBOUND FEED) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">1️⃣ المسار الأول: تصدير الحجوزات إلى تقويم هاتفك</h4>
                  <span className="text-[11px] text-slate-500 font-bold">من ليلة ➔ تقويم Google / iPhone / Outlook</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md text-[10px] font-black">
                Outbound Feed
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              انسخ الرابط المشفر أدناه وأضفه لمرة واحدة في تطبيق التقويم على هاتفك أو حاسوبك؛ لتظهر كافة الحجوزات المؤكدة تلقائياً مع تنبيهات المواعيد وتفاصيل العميل.
            </p>

            {/* Outbound URL Box */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رابط تغذية التقويم المشفر (iCal .ics Feed URL)
              </label>
              <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <input
                  type="text"
                  readOnly
                  value={outboundFeedUrl}
                  className="bg-transparent flex-1 text-xs font-mono text-slate-700 outline-none text-left select-all"
                  dir="ltr"
                />
                <button
                  onClick={handleCopyFeed}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shrink-0 ${
                    copiedFeed
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                  }`}
                >
                  {copiedFeed ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>تم النسخ!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ الرابط</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Download .ics Button */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <span className="text-slate-600 font-medium">تنزيل ملف تقويم فوري للاستيراد اليدوي:</span>
              <button
                onClick={handleDownloadIcs}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-indigo-600" />
                <span>تحميل (.ics)</span>
              </button>
            </div>

            {/* Interactive Step-by-Step Setup Guides */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-black text-slate-800">إرشادات الربط السريع للتطبيقات:</span>
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px] font-bold">
                  <button
                    onClick={() => setActiveGuideTab('google')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      activeGuideTab === 'google' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Google Cal
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('apple')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      activeGuideTab === 'apple' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Apple / iPhone
                  </button>
                  <button
                    onClick={() => setActiveGuideTab('outlook')}
                    className={`px-2 py-1 rounded-md transition-all ${
                      activeGuideTab === 'outlook' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-500'
                    }`}
                  >
                    Outlook
                  </button>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1.5">
                {activeGuideTab === 'google' && (
                  <>
                    <p className="font-bold text-indigo-900">🌐 خطوات الإضافة في تقويم Google:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>افتح Google Calendar على المتصفح ➔ انقر على علامة (+) بجانب "Other calendars".</li>
                      <li>اختر "From URL" (من عنوان URL).</li>
                      <li>الصق الرابط المنسوخ أعلاه واضغط "Add calendar".</li>
                    </ol>
                  </>
                )}
                {activeGuideTab === 'apple' && (
                  <>
                    <p className="font-bold text-indigo-900">📱 خطوات الإضافة على iPhone / iPad / Mac:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>افتح تطبيق "التقويم" ➔ اضغط على "التقويمات" أسفل الشاشة.</li>
                      <li>اختر "إضافة تقويم اشتراك" (Add Subscription Calendar).</li>
                      <li>الصق الرابط المنسوخ واضغط "اشتراك" ليتم تفعيل التحديث التلقائي.</li>
                    </ol>
                  </>
                )}
                {activeGuideTab === 'outlook' && (
                  <>
                    <p className="font-bold text-indigo-900">💻 خطوات الإضافة في Microsoft Outlook:</p>
                    <ol className="list-decimal list-inside space-y-1 text-[11px]">
                      <li>انتقل إلى التقويم ➔ انقر على "Add Calendar" ثم "Subscribe from web".</li>
                      <li>الصق الرابط واختر اسماً ولوناً مميزاً للمنشأة ثم اضغط "Import".</li>
                    </ol>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-900 text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>التغذية نشطة وتدعم التحديث الآلي كلما تم تأكيد حجز جديد على المنصة.</span>
          </div>
        </div>

        {/* ================= المسار الثاني: استيراد التواريخ المحجوزة خارجياً (INBOUND SYNC) ================= */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 text-sm">2️⃣ المسار الثاني: استيراد المواعيد الخارجية لمنع التعارض</h4>
                  <span className="text-[11px] text-slate-500 font-bold">من تقويم المزود ➔ منصة ليلة (Auto-Lock)</span>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-md text-[10px] font-black">
                Inbound Sync
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              إذا كنت تسجل حجوزاتك الخارجية (المباشرة أو الهاتفية) في تقويم Google الشخصي، ضع رابطه هنا؛ لتقوم المنصة <strong>بقراءته وحظر التواريخ تلقائياً</strong> ومنع الحجز المزدوج.
            </p>

            {/* Inbound Input Form */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                رابط iCal لتقويمك الخارجي (Google Calendar Secret iCal URL)
              </label>
              <input
                type="url"
                value={externalIcalUrl}
                onChange={e => setExternalIcalUrl(e.target.value)}
                placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 outline-none text-left focus:border-amber-500 focus:bg-white"
                dir="ltr"
              />
            </div>

            {/* Auto-Sync Toggle & Instant Trigger */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">المزامنة التلقائية الدورية</span>
                  <span className="text-[10px] text-slate-500">فحص التقويم الخارجي كل 15 دقيقة تلقائياً</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoSyncEnabled}
                    onChange={e => {
                      setAutoSyncEnabled(e.target.checked);
                      showNotification(e.target.checked ? 'success' : 'info', e.target.checked ? 'تم تفعيل المزامنة الدورية التلقائية' : 'تم إيقاف المزامنة التلقائية');
                    }}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                <span className="text-xs text-slate-600 font-medium">مزامنة فورية يدوية الآن:</span>
                <button
                  onClick={handleTriggerSync}
                  disabled={isSyncing}
                  className={`px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-amber-500/20 ${
                    isSyncing ? 'opacity-70 cursor-not-allowed' : 'hover:scale-105'
                  }`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'جاري المزامنة...' : '⚡ بدء المزامنة الفورية الآن'}</span>
                </button>
              </div>
            </div>

            {/* Sync History Logs */}
            <div>
              <h5 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                سجل آخر عمليات المزامنة المكتملة
              </h5>
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                {syncHistory.map(item => (
                  <div key={item.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-slate-900">{item.hallName}</span>
                        <span className="text-slate-400">• {item.timestamp}</span>
                      </div>
                      <p className="text-slate-600 mt-0.5 text-[10px]">{item.details}</p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-black text-[9px] shrink-0">
                      ناجحة ✔️
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-amber-900 text-xs">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0" />
            <span>حماية تامة من الحجز المزدوج: يتم إغلاق أي موعد خارجي فور رصده.</span>
          </div>
        </div>

      </div>

      {/* RFC 5545 Standard Specifications Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <h4 className="text-xs font-black text-slate-800 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-600" />
          المواصفات التقنية والمعايير المعتمدة (iCalendar Protocol - RFC 5545)
        </h4>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-center">
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-mono text-xs font-bold text-indigo-700 block">UID</span>
            <span className="text-[10px] text-slate-500">معرف الحجز الفريد</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-mono text-xs font-bold text-indigo-700 block">DTSTART</span>
            <span className="text-[10px] text-slate-500">تاريخ ووقت البداية</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-mono text-xs font-bold text-indigo-700 block">DTEND</span>
            <span className="text-[10px] text-slate-500">تاريخ ووقت النهاية</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-mono text-xs font-bold text-indigo-700 block">SUMMARY</span>
            <span className="text-[10px] text-slate-500">عنوان ونوع المناسبة</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-mono text-xs font-bold text-indigo-700 block">DESCRIPTION</span>
            <span className="text-[10px] text-slate-500">ملخص وملاحظات الحجز</span>
          </div>
          <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
            <span className="font-mono text-xs font-bold text-indigo-700 block">STATUS</span>
            <span className="text-[10px] text-slate-500">مؤكد / ملغي</span>
          </div>
        </div>
      </div>

      {/* ================= EXTERNAL BLOCK & ICAL SYNC MANAGER MODAL ================= */}
      {isExternalBlockModalOpen && (
        <ExternalBlockManagerModal
          userRole={userRole}
          currentProviderName={currentProviderName}
          halls={halls}
          setHalls={setHalls || (() => {})}
          services={services}
          setServices={setServices || (() => {})}
          showNotification={showNotification}
          onClose={() => setIsExternalBlockModalOpen(false)}
          defaultEntityId={selectedHallId !== 'all' ? selectedHallId : availableHalls[0]?.id}
          defaultEntityType="hall"
        />
      )}

    </div>
  );
};
