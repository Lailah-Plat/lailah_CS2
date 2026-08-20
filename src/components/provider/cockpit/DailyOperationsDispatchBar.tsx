import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Activity, Calendar, CheckCircle2, MessageSquare, QrCode, 
  ShieldAlert, Clock, Phone, User, Building2, Sparkles, 
  Eye, AlertCircle, X, Layers, FileText, Check, ChevronRight
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export interface DispatchRowItem {
  id: string;
  type: 'hall' | 'service';
  title: string;
  serialId: string;
  clientName: string;
  clientPhone: string;
  timeWindow: string;
  rawItem: any;
  childServices: Array<{
    id: string;
    serialId: string;
    title: string;
    status: string;
  }>;
}

interface DailyOperationsDispatchBarProps {
  myBookings: any[];
  mySupportRequests?: any[];
  currentProviderName: string;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onOpenChat?: (booking: any) => void;
}

export const DailyOperationsDispatchBar: React.FC<DailyOperationsDispatchBarProps> = ({
  myBookings = [],
  mySupportRequests = [],
  currentProviderName,
  showNotification,
  onOpenChat
}) => {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [selectedEventForModal, setSelectedEventForModal] = useState<DispatchRowItem | null>(null);
  const [inspectedEvents, setInspectedEvents] = useState<Record<string, boolean>>({});
  const [dispatchedStaff, setDispatchedStaff] = useState<Record<string, boolean>>({});
  const [confirmedDeposits, setConfirmedDeposits] = useState<Record<string, boolean>>({});

  // Helper formatting serial IDs strictly per project rules
  const formatBkgId = (id: any, index: number = 1) => {
    if (!id) return `BKG-26-${String(index).padStart(10, '0')}`;
    const idStr = String(id);
    if (idStr.startsWith('BKG-')) return idStr;
    const cleanNum = idStr.replace(/\D/g, '') || String(index);
    return `BKG-26-${cleanNum.padStart(10, '0')}`;
  };

  const formatSrvId = (id: any, index: number = 1) => {
    if (!id) return `SRV-26-${String(index).padStart(10, '0')}`;
    const idStr = String(id);
    if (idStr.startsWith('SRV-')) return idStr;
    const cleanNum = idStr.replace(/\D/g, '') || String(index);
    return `SRV-26-${cleanNum.padStart(10, '0')}`;
  };

  // Build grouped events (Parent Hall Bookings with Child Linked Services)
  const groupedEvents = useMemo(() => {
    const itemsMap = new Map<string, DispatchRowItem>();

    // 1. Process Hall Bookings (Parent Entities)
    const providerBookings = myBookings.filter(b => {
      if (!b) return false;
      return !b.provider || b.provider === currentProviderName || b.providerName === currentProviderName;
    });

    providerBookings.forEach((b, idx) => {
      const serialId = formatBkgId(b.id, idx + 1);
      const eventKey = `bkg-${serialId}`;

      // Extract child services / addons for this booking
      const childServices: DispatchRowItem['childServices'] = [];
      if (Array.isArray(b.addons) && b.addons.length > 0) {
        b.addons.forEach((ad: any, adIdx: number) => {
          childServices.push({
            id: ad.id || `ad-${adIdx}`,
            serialId: formatSrvId(ad.id || adIdx + 1, adIdx + 1),
            title: ad.name || ad.title || 'خدمة مضافة',
            status: ad.status || 'معتمد'
          });
        });
      }

      // Check if any support request matches this booking
      mySupportRequests.forEach((sr, srIdx) => {
        if (sr.bookingId === b.id || sr.customerName === b.customerName) {
          childServices.push({
            id: sr.id || `sr-${srIdx}`,
            serialId: formatSrvId(sr.id, srIdx + 1),
            title: sr.serviceName || sr.title || 'خدمة مساندة مرتبطة',
            status: sr.status || 'قيد التنفيذ'
          });
        }
      });

      itemsMap.set(eventKey, {
        id: String(b.id || idx + 1),
        type: 'hall',
        title: b.hallName || b.hall || 'قاعة الثريا الكبرى',
        serialId,
        clientName: b.customerName || b.client || 'عبدالله المنصور',
        clientPhone: b.phone || '+966 50 123 4567',
        timeWindow: b.timeWindow || 'تسليم القاعة: 04:00 مساءً',
        rawItem: b,
        childServices
      });
    });

    // 2. Add Standalone Support Services (if unlinked to parent booking)
    mySupportRequests.forEach((sr, idx) => {
      const isMatch = !sr.provider || sr.provider === currentProviderName || sr.providerName === currentProviderName;
      if (!isMatch) return;

      const srvSerial = formatSrvId(sr.id, idx + 1);
      const isAlreadyLinked = Array.from(itemsMap.values()).some(item => 
        item.childServices.some(cs => cs.serialId === srvSerial)
      );

      if (!isAlreadyLinked) {
        const eventKey = `srv-${srvSerial}`;
        itemsMap.set(eventKey, {
          id: String(sr.id || idx + 1),
          type: 'service',
          title: sr.serviceName || sr.title || 'خدمة توثيق وضيافة مستقلة',
          serialId: srvSerial,
          clientName: sr.customerName || sr.client || 'محمد العتيبي',
          clientPhone: sr.phone || '+966 55 987 6543',
          timeWindow: sr.timeWindow || 'موعد التنفيذ: 06:00 مساءً',
          rawItem: sr,
          childServices: []
        });
      }
    });

    return Array.from(itemsMap.values()).slice(0, 6); // Top items for 24-hour bar
  }, [myBookings, mySupportRequests, currentProviderName]);

  const totalEscrowAmount = useMemo(() => {
    return groupedEvents.reduce((acc, evt) => {
      const price = Number(evt.rawItem?.price || evt.rawItem?.amount || 15000);
      return acc + (price * 0.25);
    }, 0);
  }, [groupedEvents]);

  const toggleInspection = (id: string, title: string) => {
    setInspectedEvents(prev => {
      const nextState = !prev[id];
      showNotification(
        nextState ? 'success' : 'info',
        nextState 
          ? `تم اعتماد فحص أنظمة الصوت والتكييف والإضاءة لـ (${title}) بنجاح.` 
          : `تم إلغاء اعتماد الفحص الفني لـ (${title}).`
      );
      return { ...prev, [id]: nextState };
    });
  };

  const toggleStaffDispatch = (id: string, clientName: string) => {
    setDispatchedStaff(prev => {
      const nextState = !prev[id];
      showNotification(
        nextState ? 'success' : 'info',
        nextState 
          ? `تم توجيه الطاقم الميداني وإصدار بطاقات QR لحفل (${clientName}).` 
          : `تم إلغاء توجيه الطاقم للحفل.`
      );
      return { ...prev, [id]: nextState };
    });
  };

  const toggleDeposit = (id: string, serialId: string) => {
    setConfirmedDeposits(prev => {
      const nextState = !prev[id];
      showNotification(
        nextState ? 'success' : 'info',
        nextState 
          ? `تم تأكيد إيداع العربون وتأمين الحجز بضمان المنصة (${serialId}).` 
          : `تم تعليق تأكيد العربون للحجز.`
      );
      return { ...prev, [id]: nextState };
    });
  };

  const handleCallClient = (evt: DispatchRowItem) => {
    showNotification('info', `جاري إجراء اتصال مباشر برقم العميل (${evt.clientPhone})...`);
    window.location.href = `tel:${evt.clientPhone.replace(/\s+/g, '')}`;
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-3xl p-6 shadow-xl border space-y-5 transition-colors ${
        isDark
          ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white border-indigo-900/40'
          : 'bg-gradient-to-r from-slate-50 via-indigo-50/60 to-slate-50 text-slate-900 border-indigo-200/80 shadow-indigo-100/50'
      }`}
    >
      {/* Top Header Bar */}
      <div className={`flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b ${
        isDark ? 'border-indigo-800/40' : 'border-indigo-100'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-3 rounded-2xl border ${
            isDark 
              ? 'bg-amber-400/20 text-amber-400 border-amber-400/30 animate-pulse' 
              : 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
          }`}>
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`text-xs font-black uppercase tracking-wider ${
                isDark ? 'text-amber-400' : 'text-amber-800'
              }`}>
                Daily Operations Dispatch Bar
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className={`text-[10px] border px-2.5 py-0.5 rounded-full font-bold ${
                isDark 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
                  : 'bg-emerald-100 text-emerald-800 border-emerald-300'
              }`}>
                بث مباشر حي
              </span>
            </div>
            <h3 className={`text-lg md:text-xl font-black mt-0.5 ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>
              شريط التدفق والتجهيز اليومي المباشر
            </h3>
          </div>
        </div>

        {/* Emergency & Escrow Indicator */}
        <div className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl text-xs backdrop-blur-md border ${
          isDark 
            ? 'bg-white/5 border-white/10' 
            : 'bg-white border-indigo-100 shadow-xs'
        }`}>
          <ShieldAlert className={`w-4 h-4 shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
          <div>
            <span className={`font-bold block ${isDark ? 'text-slate-300' : 'text-slate-500'}`}>
              رصيد الضمان الميداني:
            </span>
            <span className={`font-black ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
              {totalEscrowAmount.toLocaleString()} ر.س (محمي بالمنصة)
            </span>
          </div>
        </div>
      </div>

      {/* Today Scheduled Events Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Calendar className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <h4 className={`text-sm font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              جدول مناسبات اليوم والـ 24 ساعة القادمة ({groupedEvents.length} حفل وفعالية)
            </h4>
          </div>
          <span className={`text-[11px] font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            التحديث اللحظي الموحد للصالات والخدمات المرتبطة
          </span>
        </div>

        {groupedEvents.length === 0 ? (
          <div className={`p-6 rounded-2xl border text-center text-xs flex items-center justify-center gap-2 ${
            isDark 
              ? 'bg-slate-800/40 border-slate-700/50 text-slate-400' 
              : 'bg-white border-slate-200 text-slate-600 shadow-xs'
          }`}>
            <AlertCircle className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            <span>لا توجد فعاليات مجدولة للتنفيذ خلال الـ 24 ساعة القادمة. يمكنك استعراض جدول الحجوزات القادمة.</span>
          </div>
        ) : (
          <div className="space-y-3">
            {groupedEvents.map((evt) => {
              const isInspected = inspectedEvents[evt.id];
              const isDispatched = dispatchedStaff[evt.id];
              const isDepositConfirmed = confirmedDeposits[evt.id];

              return (
                <div
                  key={`${evt.type}-${evt.id}`}
                  id={`today-event-row-${evt.serialId}`}
                  className={`group flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 rounded-2xl border transition-all duration-200 shadow-sm ${
                    isDark 
                      ? 'bg-slate-800/60 hover:bg-slate-800/90 border-slate-700/70 hover:border-amber-500/40' 
                      : 'bg-white hover:bg-indigo-50/30 border-slate-200/90 hover:border-indigo-300 shadow-xs'
                  }`}
                >
                  {/* Right Column: Icon, Metadata, Title & Child Services */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border mt-0.5 ${
                        evt.type === 'hall'
                          ? isDark 
                            ? 'bg-blue-500/10 border-blue-500/25 text-blue-400' 
                            : 'bg-blue-50 border-blue-200 text-blue-700'
                          : isDark 
                            ? 'bg-purple-500/10 border-purple-500/25 text-purple-400' 
                            : 'bg-purple-50 border-purple-200 text-purple-700'
                      }`}
                    >
                      {evt.type === 'hall' ? (
                        <Building2 className="w-5 h-5" />
                      ) : (
                        <Sparkles className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className={`text-sm font-black transition-colors truncate ${
                          isDark 
                            ? 'text-white group-hover:text-amber-400' 
                            : 'text-slate-900 group-hover:text-indigo-700'
                        }`}>
                          {evt.title}
                        </h5>
                        <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                          isDark 
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {evt.serialId}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isInspected 
                            ? isDark 
                              ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40' 
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : isDark 
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' 
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}>
                          {isInspected ? 'جاهزية كاملة 🟢' : 'قيد الفحص والضبط 🟡'}
                        </span>
                      </div>

                      {/* Client Info & Time */}
                      <div className={`flex items-center gap-3 text-xs flex-wrap ${
                        isDark ? 'text-slate-300' : 'text-slate-600'
                      }`}>
                        <span className="flex items-center gap-1 font-bold">
                          <User className={`w-3.5 h-3.5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                          <span className={isDark ? 'text-slate-200' : 'text-slate-800'}>{evt.clientName}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 font-mono dir-ltr">
                          <Phone className={`w-3 h-3 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                          <span>{evt.clientPhone}</span>
                        </span>
                        <span>•</span>
                        <span className={`flex items-center gap-1 font-bold font-mono ${
                          isDark ? 'text-amber-400' : 'text-amber-700'
                        }`}>
                          <Clock className="w-3.5 h-3.5" />
                          <span>{evt.timeWindow}</span>
                        </span>
                      </div>

                      {/* Child Services Badges (Grouped under parent) */}
                      {evt.childServices.length > 0 && (
                        <div className="flex items-center gap-2 pt-1 flex-wrap">
                          <span className={`text-[10px] font-bold flex items-center gap-1 ${
                            isDark ? 'text-slate-400' : 'text-slate-500'
                          }`}>
                            <Layers className={`w-3 h-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                            {evt.childServices.length} خدمات مساندة مرتبطة:
                          </span>
                          {evt.childServices.map((cs) => (
                            <span 
                              key={cs.serialId}
                              className={`text-[10px] px-2 py-0.5 border rounded-lg font-mono font-bold flex items-center gap-1 ${
                                isDark 
                                  ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                                  : 'bg-purple-50 text-purple-800 border-purple-200'
                              }`}
                            >
                              <span>{cs.serialId}</span>
                              <span className={isDark ? 'text-slate-300' : 'text-slate-600'}>({cs.title})</span>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Left Column: 3 Quick Actions ONLY (Details, Call, Chat) */}
                  <div className={`flex items-center justify-end shrink-0 gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 ${
                    isDark ? 'border-slate-700/50' : 'border-slate-100'
                  }`}>
                    {/* Quick Action 1: Details Modal */}
                    <button
                      id={`btn-view-details-${evt.serialId}`}
                      type="button"
                      onClick={() => setSelectedEventForModal(evt)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                        isDark 
                          ? 'bg-slate-700/70 hover:bg-amber-500/20 text-slate-200 hover:text-amber-300 border-slate-600 hover:border-amber-500/40' 
                          : 'bg-slate-100 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border-slate-200 hover:border-amber-300'
                      }`}
                    >
                      <Eye className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                      <span>التفاصيل</span>
                    </button>

                    {/* Quick Action 2: Direct Call */}
                    <button
                      id={`btn-call-client-${evt.serialId}`}
                      type="button"
                      onClick={() => handleCallClient(evt)}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                        isDark 
                          ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 hover:text-white border-indigo-400/40' 
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-900 border-indigo-200'
                      }`}
                      title="اتصال تلفزيوني / هاتفي مباشر بالعميل"
                    >
                      <Phone className={`w-4 h-4 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} />
                      <span className="hidden sm:inline">اتصال</span>
                    </button>

                    {/* Quick Action 3: Instant Chat */}
                    <button
                      id={`btn-chat-client-${evt.serialId}`}
                      type="button"
                      onClick={() => {
                        if (onOpenChat) onOpenChat(evt.rawItem);
                        else showNotification('info', `جاري فتح محادثة المباشرة مع العميل (${evt.clientName}).`);
                      }}
                      className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs border ${
                        isDark 
                          ? 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-200 hover:text-white border-purple-400/40' 
                          : 'bg-purple-50 hover:bg-purple-100 text-purple-700 hover:text-purple-900 border-purple-200'
                      }`}
                      title="دردشة فورية مشفرة مع العميل"
                    >
                      <MessageSquare className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      <span className="hidden sm:inline">مراسلة</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Operational Details Modal (Event Operations Panel) */}
      <AnimatePresence>
        {selectedEventForModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl dir-rtl border ${
                isDark 
                  ? 'bg-slate-900 text-white border-indigo-500/30' 
                  : 'bg-white text-slate-900 border-indigo-200'
              }`}
              dir="rtl"
            >
              {/* Modal Header */}
              <div className={`p-5 border-b flex justify-between items-center ${
                isDark 
                  ? 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-800/40' 
                  : 'bg-gradient-to-r from-slate-50 via-indigo-50 to-slate-50 border-indigo-100'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-2xl border ${
                    selectedEventForModal.type === 'hall'
                      ? isDark 
                        ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' 
                        : 'bg-blue-50 border-blue-200 text-blue-700'
                      : isDark 
                        ? 'bg-purple-500/20 border-purple-500/30 text-purple-400' 
                        : 'bg-purple-50 border-purple-200 text-purple-700'
                  }`}>
                    {selectedEventForModal.type === 'hall' ? <Building2 className="w-6 h-6" /> : <Sparkles className="w-6 h-6" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-black px-2.5 py-0.5 rounded-full border ${
                        isDark 
                          ? 'text-amber-400 bg-amber-400/10 border-amber-400/30' 
                          : 'text-amber-800 bg-amber-100 border-amber-200'
                      }`}>
                        {selectedEventForModal.serialId}
                      </span>
                      <span className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                        نافذة التشغيل الميداني العميق
                      </span>
                    </div>
                    <h3 className={`text-lg font-black mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedEventForModal.title}
                    </h3>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedEventForModal(null)}
                  className={`p-2 rounded-xl transition-all cursor-pointer ${
                    isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-white/10' 
                      : 'text-slate-400 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
                {/* Section 1: Client Metadata & Schedule */}
                <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-2xl border text-xs ${
                  isDark 
                    ? 'bg-white/5 border-white/10' 
                    : 'bg-slate-50 border-slate-200'
                }`}>
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      بيانات العميل صاحب الفعالية:
                    </span>
                    <span className={`font-black text-sm block mt-0.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {selectedEventForModal.clientName}
                    </span>
                    <span className={`font-mono block dir-ltr text-right mt-1 ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                      {selectedEventForModal.clientPhone}
                    </span>
                  </div>
                  <div>
                    <span className={`font-bold block ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      التوقيت الميداني المعتمد:
                    </span>
                    <span className={`font-black text-sm block mt-0.5 font-mono ${
                      isDark ? 'text-amber-400' : 'text-amber-700'
                    }`}>
                      {selectedEventForModal.timeWindow}
                    </span>
                    <span className={`font-bold block mt-1 ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                      ضمان المنصة: محمي بنسبة 100%
                    </span>
                  </div>
                </div>

                {/* Section 2: Grouped Linked Support Services */}
                {selectedEventForModal.childServices.length > 0 && (
                  <div className="space-y-2">
                    <h4 className={`text-xs font-black flex items-center gap-2 ${
                      isDark ? 'text-purple-300' : 'text-purple-800'
                    }`}>
                      <Layers className={`w-4 h-4 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                      الخدمات المساندة المرتبطة بالمناسبة ({selectedEventForModal.childServices.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedEventForModal.childServices.map((cs) => (
                        <div 
                          key={cs.serialId} 
                          className={`p-3 rounded-xl flex justify-between items-center text-xs border ${
                            isDark 
                              ? 'bg-purple-500/10 border-purple-500/20' 
                              : 'bg-purple-50/80 border-purple-200'
                          }`}
                        >
                          <div>
                            <span className={`font-mono text-[10px] font-bold block ${
                              isDark ? 'text-amber-300' : 'text-amber-700'
                            }`}>
                              {cs.serialId}
                            </span>
                            <span className={`font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {cs.title}
                            </span>
                          </div>
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold ${
                            isDark 
                              ? 'bg-purple-500/20 text-purple-300' 
                              : 'bg-purple-100 text-purple-800'
                          }`}>
                            {cs.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Deep Operational Controls & Field Actions */}
                <div className="space-y-3">
                  <h4 className={`text-xs font-black flex items-center gap-2 ${
                    isDark ? 'text-indigo-200' : 'text-indigo-800'
                  }`}>
                    <Activity className={`w-4 h-4 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                    الإجراءات التشغيلية والميدانية المتقدمة
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Action A: Confirm Deposit */}
                    <button
                      onClick={() => toggleDeposit(selectedEventForModal.id, selectedEventForModal.serialId)}
                      className={`p-3.5 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-2 cursor-pointer border text-center ${
                        confirmedDeposits[selectedEventForModal.id]
                          ? isDark 
                            ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md' 
                            : 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                          : isDark 
                            ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40' 
                            : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{confirmedDeposits[selectedEventForModal.id] ? 'العربون مؤكد بضمان المنصة' : 'تأكيد إيداع العربون'}</span>
                    </button>

                    {/* Action B: Inspection */}
                    <button
                      onClick={() => toggleInspection(selectedEventForModal.id, selectedEventForModal.title)}
                      className={`p-3.5 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-2 cursor-pointer border text-center ${
                        inspectedEvents[selectedEventForModal.id]
                          ? isDark 
                            ? 'bg-indigo-500 text-white border-indigo-400 shadow-md' 
                            : 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                          : isDark 
                            ? 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-200 border-indigo-400/40' 
                            : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200'
                      }`}
                    >
                      <Activity className="w-5 h-5" />
                      <span>{inspectedEvents[selectedEventForModal.id] ? 'تم اعتماد فحص الصوت/التكييف' : 'اعتماد فحص الصوت والتكييف'}</span>
                    </button>

                    {/* Action C: Staff Dispatch */}
                    <button
                      onClick={() => toggleStaffDispatch(selectedEventForModal.id, selectedEventForModal.clientName)}
                      className={`p-3.5 rounded-2xl text-xs font-black transition-all flex flex-col items-center justify-center gap-2 cursor-pointer border text-center ${
                        dispatchedStaff[selectedEventForModal.id]
                          ? isDark 
                            ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md' 
                            : 'bg-amber-500 text-slate-950 border-amber-400 shadow-md'
                          : isDark 
                            ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border-amber-400/40' 
                            : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                      <span>{dispatchedStaff[selectedEventForModal.id] ? 'تم إصدار بطاقات QR للطاقم' : 'إصدار بطاقات QR وتوجيه الطاقم'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className={`p-4 border-t flex justify-between items-center text-xs ${
                isDark 
                  ? 'bg-slate-950/60 border-slate-800' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCallClient(selectedEventForModal)}
                    className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>اتصال بالعميل</span>
                  </button>

                  <button
                    onClick={() => {
                      if (onOpenChat) onOpenChat(selectedEventForModal.rawItem);
                      else showNotification('info', `فتح محادثة العميل (${selectedEventForModal.clientName}).`);
                      setSelectedEventForModal(null);
                    }}
                    className="px-3 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>دردشة العميل</span>
                  </button>
                </div>

                <button
                  onClick={() => setSelectedEventForModal(null)}
                  className={`px-4 py-2 rounded-xl font-bold transition-all cursor-pointer border ${
                    isDark 
                      ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300 shadow-xs'
                  }`}
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
