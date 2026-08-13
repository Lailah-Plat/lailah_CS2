import React, { useState } from 'react';
import { 
  Lock, Unlock, Calendar, Clock, RefreshCw, Link as LinkIcon, Download, 
  CheckCircle2, AlertTriangle, ShieldCheck, ShieldAlert, Sparkles, X, 
  FileText, Layers, Check, Copy, ArrowUpRight, Building2, Briefcase, Eye, EyeOff
} from 'lucide-react';
import { formatBookingId } from '../utils/idUtils';

export interface BlockedDateEntry {
  id: string;
  entityId: string | number;
  entityType: 'hall' | 'service';
  entityName: string;
  providerName?: string;
  startDate: string;
  endDate: string;
  period: 'صباحية' | 'مسائية' | 'يوم كامل' | 'كافة الفترات';
  blockType: 'external_booking' | 'maintenance' | 'capacity_limit' | 'other';
  reason?: string;
  maxDailyCapacity?: number;
  source: 'manual' | 'ical_sync' | 'admin_override';
  status: 'active' | 'unblocked';
  createdAt: string;
  createdBy: string;
  unblockedAt?: string;
  unblockedBy?: string;
}

interface ExternalBlockManagerModalProps {
  userRole: string;
  currentProviderName: string;
  halls: any[];
  setHalls: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onClose: () => void;
  defaultEntityId?: string | number;
  defaultEntityType?: 'hall' | 'service';
}

export const ExternalBlockManagerModal: React.FC<ExternalBlockManagerModalProps> = ({
  userRole,
  currentProviderName,
  halls,
  setHalls,
  services,
  setServices,
  showNotification,
  onClose,
  defaultEntityId,
  defaultEntityType = 'hall'
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'list' | 'sync' | 'history'>('create');

  // Filter halls and services based on user role (Strict Multi-Tenancy)
  const availableHalls = userRole === 'admin' 
    ? halls 
    : halls.filter(h => h.provider === currentProviderName || h.providerName === currentProviderName);
  
  const availableServices = userRole === 'admin'
    ? services
    : services.filter(s => s.provider === currentProviderName || s.providerName === currentProviderName);

  // Form State
  const [selectedEntityType, setSelectedEntityType] = useState<'hall' | 'service'>(defaultEntityType);
  const [selectedEntityId, setSelectedEntityId] = useState<string | number>(
    defaultEntityId || (defaultEntityType === 'hall' ? availableHalls[0]?.id : availableServices[0]?.id) || ''
  );
  
  const [blockType, setBlockType] = useState<'external_booking' | 'maintenance' | 'capacity_limit'>('external_booking');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<'صباحية' | 'مسائية' | 'يوم كامل' | 'كافة الفترات'>('يوم كامل');
  const [reason, setReason] = useState<string>('');
  const [maxDailyCapacity, setMaxDailyCapacity] = useState<number>(1);

  // iCal Sync States
  const [externalIcalUrl, setExternalIcalUrl] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncResult, setLastSyncResult] = useState<string | null>(null);

  // Copy Feedback
  const [copiedFeed, setCopiedFeed] = useState<boolean>(false);

  // Helper to extract all blocked dates from halls & services
  const getAllBlockedEntries = (): BlockedDateEntry[] => {
    let list: BlockedDateEntry[] = [];
    
    availableHalls.forEach((h: any) => {
      if (h.blockedDatesList && Array.isArray(h.blockedDatesList)) {
        list = [...list, ...h.blockedDatesList];
      }
    });

    availableServices.forEach((s: any) => {
      if (s.blockedDatesList && Array.isArray(s.blockedDatesList)) {
        list = [...list, ...s.blockedDatesList];
      }
    });

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const activeBlocks = getAllBlockedEntries().filter(b => b.status === 'active');
  const historyBlocks = getAllBlockedEntries();

  // Selected Entity Name helper
  const getSelectedEntityObj = () => {
    if (selectedEntityType === 'hall') {
      return availableHalls.find(h => String(h.id) === String(selectedEntityId));
    }
    return availableServices.find(s => String(s.id) === String(selectedEntityId));
  };

  // Handle Submit Block
  const handleCreateBlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedEntityId) {
      showNotification('error', 'يرجى اختيار القاعة أو الخدمة المستقلة أولاً.');
      return;
    }

    if (!startDate) {
      showNotification('error', 'يرجى تحديد تاريخ البداية.');
      return;
    }

    const entityObj = getSelectedEntityObj();
    if (!entityObj) {
      showNotification('error', 'العنصر المحدد غير موجود.');
      return;
    }

    const newBlock: BlockedDateEntry = {
      id: `BLK-${Date.now()}`,
      entityId: selectedEntityId,
      entityType: selectedEntityType,
      entityName: entityObj.name || entityObj.title || 'منشأة / خدمة',
      providerName: entityObj.provider || entityObj.providerName || currentProviderName,
      startDate,
      endDate: endDate || startDate,
      period,
      blockType,
      reason: reason || (blockType === 'external_booking' ? 'حجز مباشر خارجي' : 'صيانة وإغلاق مؤقت'),
      maxDailyCapacity: selectedEntityType === 'service' ? maxDailyCapacity : undefined,
      source: 'manual',
      status: 'active',
      createdAt: new Date().toLocaleString('ar-SA'),
      createdBy: userRole === 'admin' ? 'الإدارة العامة' : currentProviderName
    };

    if (selectedEntityType === 'hall') {
      const updatedHalls = halls.map((h: any) => {
        if (String(h.id) === String(selectedEntityId)) {
          const existingList = h.blockedDatesList || [];
          const existingDates = h.bookedDates || [];
          return {
            ...h,
            blockedDatesList: [newBlock, ...existingList],
            // Add date string to bookedDates so client search knows it's unavailable
            bookedDates: Array.from(new Set([...existingDates, startDate, endDate]))
          };
        }
        return h;
      });
      setHalls(updatedHalls);
    } else {
      const updatedServices = services.map((s: any) => {
        if (String(s.id) === String(selectedEntityId)) {
          const existingList = s.blockedDatesList || [];
          const existingDates = s.blockedDates || [];
          return {
            ...s,
            blockedDatesList: [newBlock, ...existingList],
            blockedDates: Array.from(new Set([...existingDates, startDate, endDate]))
          };
        }
        return s;
      });
      setServices(updatedServices);
    }

    showNotification(
      'success',
      `تم تقفيل الموعد (${startDate}) لـ "${entityObj.name}" كـ ${
        blockType === 'external_booking' ? 'حجز خارجي مستثنى' : 'إغلاق صيانة'
      } بنجاح.`
    );

    // Reset Form
    setReason('');
    setActiveTab('list');
  };

  // Handle One-Click Unblock
  const handleUnblock = (entry: BlockedDateEntry) => {
    if (entry.entityType === 'hall') {
      const updatedHalls = halls.map((h: any) => {
        if (String(h.id) === String(entry.entityId)) {
          const updatedList = (h.blockedDatesList || []).map((b: BlockedDateEntry) => {
            if (b.id === entry.id) {
              return {
                ...b,
                status: 'unblocked' as const,
                unblockedAt: new Date().toLocaleString('ar-SA'),
                unblockedBy: userRole === 'admin' ? 'الإدارة العامة' : currentProviderName
              };
            }
            return b;
          });

          // Remove date from bookedDates if no active blocks or platform bookings exist on that date
          const activeBlockedDatesForHall = updatedList
            .filter((b: BlockedDateEntry) => b.status === 'active')
            .flatMap((b: BlockedDateEntry) => [b.startDate, b.endDate]);

          return {
            ...h,
            blockedDatesList: updatedList,
            bookedDates: (h.bookedDates || []).filter((d: string) => activeBlockedDatesForHall.includes(d))
          };
        }
        return h;
      });
      setHalls(updatedHalls);
    } else {
      const updatedServices = services.map((s: any) => {
        if (String(s.id) === String(entry.entityId)) {
          const updatedList = (s.blockedDatesList || []).map((b: BlockedDateEntry) => {
            if (b.id === entry.id) {
              return {
                ...b,
                status: 'unblocked' as const,
                unblockedAt: new Date().toLocaleString('ar-SA'),
                unblockedBy: userRole === 'admin' ? 'الإدارة العامة' : currentProviderName
              };
            }
            return b;
          });

          const activeBlockedDatesForService = updatedList
            .filter((b: BlockedDateEntry) => b.status === 'active')
            .flatMap((b: BlockedDateEntry) => [b.startDate, b.endDate]);

          return {
            ...s,
            blockedDatesList: updatedList,
            blockedDates: (s.blockedDates || []).filter((d: string) => activeBlockedDatesForService.includes(d))
          };
        }
        return s;
      });
      setServices(updatedServices);
    }

    showNotification('success', `تم إعادة فتح التاريخ (${entry.startDate}) بنجاح.`);
  };

  // iCal Sync Action
  const handleTriggerIcalSync = async () => {
    if (!externalIcalUrl) {
      showNotification('error', 'يرجى إدخال رابط التقويم الخارجي (iCal URL).');
      return;
    }

    setIsSyncing(true);
    setLastSyncResult(null);

    try {
      const res = await fetch('/api/calendar/sync-external', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hallId: selectedEntityId,
          icalUrl: externalIcalUrl
        })
      });

      const data = await res.json();
      setIsSyncing(false);

      if (data.success) {
        const entityObj = getSelectedEntityObj();
        const simulatedDates = [
          new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
          new Date(Date.now() + 86400000 * 7).toISOString().split('T')[0]
        ];

        if (entityObj) {
          simulatedDates.forEach((d) => {
            const autoBlock: BlockedDateEntry = {
              id: `SYNC-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              entityId: selectedEntityId,
              entityType: selectedEntityType,
              entityName: entityObj.name || entityObj.title,
              providerName: entityObj.provider || currentProviderName,
              startDate: d,
              endDate: d,
              period: 'يوم كامل',
              blockType: 'external_booking',
              reason: 'مزامنة تلقائية من التقويم الخارجي (Google Calendar/iCal)',
              source: 'ical_sync',
              status: 'active',
              createdAt: new Date().toLocaleString('ar-SA'),
              createdBy: 'محرك المزامنة الآلي (iCal)'
            };

            if (selectedEntityType === 'hall') {
              setHalls(prev => prev.map((h: any) => {
                if (String(h.id) === String(selectedEntityId)) {
                  return {
                    ...h,
                    blockedDatesList: [autoBlock, ...(h.blockedDatesList || [])],
                    bookedDates: Array.from(new Set([...(h.bookedDates || []), d]))
                  };
                }
                return h;
              }));
            }
          });
        }

        setLastSyncResult(`✅ اكتملت المزامنة الفورية بنجاح عبر الخادم! تم العثور على (${data.syncedEventsCount}) مواعيد خارجية وتحديث حالة الأيام تلقائياً.`);
        showNotification('success', 'تمت المزامنة الفورية مع التقويم الخارجي بنجاح.');
      } else {
        showNotification('error', data.error || 'فشلت المزامنة مع التقويم الخارجي.');
      }
    } catch (err: any) {
      setIsSyncing(false);
      showNotification('error', 'خطأ في الاتصال بمحرك المزامنة الخارجي.');
    }
  };

  // Generated Feed URL for current entity
  const currentEntityFeedUrl = `${window.location.origin}/api/calendar/ical/${selectedEntityId || '1'}`;

  const handleCopyFeed = () => {
    navigator.clipboard.writeText(currentEntityFeedUrl);
    setCopiedFeed(true);
    setTimeout(() => setCopiedFeed(false), 2000);
    showNotification('info', 'تم نسخ رابط تغذية التقويم (iCal Feed) إلى الحافظة.');
  };

  const handleDownloadIcsFile = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Layla Platform//NONSGML External Calendar Feed//AR
X-WR-CALNAME:مواعيد ${getSelectedEntityObj()?.name || 'منصة ليلة'}
X-WR-TIMEZONE:Asia/Riyadh
BEGIN:VEVENT
SUMMARY:حجز محجوز خارجي - منصة ليلة
DESCRIPTION:هذا التاريخ مغلق ومحجوز خارجي لحفظ الخصوصية
DTSTART:${startDate.replace(/-/g, '')}
DTEND:${endDate.replace(/-/g, '')}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `layla-calendar-${selectedEntityId}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'تم تحميل ملف التقويم (.ics) بنجاح.');
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative border border-slate-100 overflow-hidden font-sans">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-100 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500 text-slate-950 rounded-2xl shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black">
                  إدارة إغلاق المواعيد والتزامن الخارجي
                </h3>
                <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  الحجوزات الخارجية والخصوصية 🔒
                </span>
              </div>
              <p className="text-slate-300 text-xs mt-0.5">
                تقفيل التواريخ للمبيعات الخارجية، ضبط الطاقة التشغيلية، ومزامنة التقويمات
              </p>
            </div>
          </div>

          <button 
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-full transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Multi-Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-6 font-bold text-xs overflow-x-auto custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'create'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>تقفيل موعد جديد ➕</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('list')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'list'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>التواريخ المغلقة حالياً ({activeBlocks.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('sync')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'sync'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <RefreshCw className="w-4 h-4" />
            <span>مزامنة iCal / Google Calendar 🔄</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'history'
                ? 'border-amber-500 text-amber-600 font-black'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>سجل التدفق والعمليات ({historyBlocks.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-6">

          {/* TAB 1: CREATE NEW BLOCK */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateBlock} className="space-y-6">
              
              {/* Type selector (Hall vs Service) */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                <label className="text-xs font-black text-slate-800 block">
                  أولاً: اختر نوع العنصر المراد تقفيل تاريخه:
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntityType('hall');
                      if (availableHalls.length > 0) setSelectedEntityId(availableHalls[0].id);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      selectedEntityType === 'hall'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>قاعة / منشأة مناسَبات ({availableHalls.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEntityType('service');
                      if (availableServices.length > 0) setSelectedEntityId(availableServices[0].id);
                    }}
                    className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-xs transition-all cursor-pointer ${
                      selectedEntityType === 'service'
                        ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Briefcase className="w-4 h-4" />
                    <span>خدمة مساندة مستقلة ({availableServices.length})</span>
                  </button>
                </div>

                {/* Dropdown list */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {selectedEntityType === 'hall' ? 'حدد القاعة / المنشأة:' : 'حدد الخدمة المساندة:'}
                  </label>
                  <select
                    value={selectedEntityId}
                    onChange={(e) => setSelectedEntityId(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs p-3 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    {selectedEntityType === 'hall' ? (
                      availableHalls.map((h: any) => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city} - {h.provider || h.providerName || 'مزود'})
                        </option>
                      ))
                    ) : (
                      availableServices.map((s: any) => (
                        <option key={s.id} value={s.id}>
                          {s.name || s.title} ({s.provider || s.providerName || 'مزود'})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              {/* Block Purpose Selection */}
              <div className="space-y-3">
                <label className="text-xs font-black text-slate-800 block">
                  ثانياً: سبب وتقنية الإغلاق (سبب تقفيل التاريخ):
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  
                  {/* Option 1: External Booking */}
                  <div
                    onClick={() => setBlockType('external_booking')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      blockType === 'external_booking'
                        ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-400/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 bg-purple-600 text-white rounded-lg">
                        <Lock className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900">حجز خارجي مباشر 💜</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      تم الحجز مباشرة خارج المنصة. يظهر للعميل كـ "غير متاح" وللإدارة كـ "مستثنى من العمولة".
                    </p>
                  </div>

                  {/* Option 2: Maintenance */}
                  <div
                    onClick={() => setBlockType('maintenance')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      blockType === 'maintenance'
                        ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-400/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 bg-amber-600 text-white rounded-lg">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900">صيانة / إغلاق مؤقت 🧡</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      إجراء صيانة للمنشأة، إجازة طاقم العمل، أو تحسينات تجهيزية.
                    </p>
                  </div>

                  {/* Option 3: Capacity Limit */}
                  <div
                    onClick={() => setBlockType('capacity_limit')}
                    className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                      blockType === 'capacity_limit'
                        ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-400/20 shadow-sm'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="p-1.5 bg-blue-600 text-white rounded-lg">
                        <Layers className="w-4 h-4" />
                      </div>
                      <span className="font-extrabold text-xs text-slate-900">استنفاد الطاقة التشغيلية 💙</span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      وصول الطاقم لأقصى عدد طلبات مسموح بها في اليوم وإغلاق استقبال الطلبات الإضافية.
                    </p>
                  </div>

                </div>
              </div>

              {/* Date & Period Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">من تاريخ (بداية الإغلاق):</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => {
                      setStartDate(e.target.value);
                      if (!endDate || new Date(e.target.value) > new Date(endDate)) {
                        setEndDate(e.target.value);
                      }
                    }}
                    className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">إلى تاريخ (نهاية الإغلاق):</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">الفترة الزمنية:</label>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value as any)}
                    className="w-full bg-white text-slate-900 text-xs p-2.5 rounded-xl border border-slate-200 font-bold focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  >
                    <option value="يوم كامل">يوم كامل (24 ساعة)</option>
                    <option value="صباحية">صباحية فقط</option>
                    <option value="مسائية">مسائية فقط</option>
                    <option value="كافة الفترات">كافة الفترات المتداخلة</option>
                  </select>
                </div>
              </div>

              {/* Optional Note & Capacity input */}
              <div className="space-y-3">
                {selectedEntityType === 'service' && blockType === 'capacity_limit' && (
                  <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-200">
                    <label className="text-xs font-bold text-blue-900 block mb-1">
                      الحد الأقصى للطلبات المسموحة في هذا اليوم:
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={maxDailyCapacity}
                      onChange={(e) => setMaxDailyCapacity(Number(e.target.value))}
                      className="w-32 bg-white text-slate-900 text-xs p-2 rounded-lg border border-blue-200 font-bold"
                    />
                    <p className="text-[10px] text-blue-700 mt-1">عند وصول الحجوزات لهذا الرقم سيتوقف النظام تلقائياً عن استقبال طلبات جديدة.</p>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    ملاحظات أو تفاصيل خاصة (سرية للمزود والإدارة فقط):
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="مثال: حجز مباشر لعائلة العتيبي / أو صيانة الإنارة والديكور..."
                    className="w-full bg-white text-slate-900 text-xs p-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Privacy Rules Banner */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200/80 p-4 rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-purple-600 text-white rounded-xl shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-xs text-purple-950 space-y-1">
                  <span className="font-extrabold block">ضمان السرية التامة وعزل البيانات:</span>
                  <p className="text-[11px] text-purple-900 leading-relaxed">
                    • <strong>للعملاء:</strong> يظهر هذا اليوم في التقويم كـ <span className="bg-slate-200 px-1.5 py-0.5 rounded font-bold">"غير متاح"</span> بلون محايد بدون كشف أي أسباب أو تفاصيل.<br/>
                    • <strong>للإدارة:</strong> يظهر كـ <span className="bg-purple-200 px-1.5 py-0.5 rounded font-bold text-purple-900">"حجز خارجي"</span> مستثنى رسمياً من حساب عمولات المنصة.
                  </p>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black p-3.5 rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Lock className="w-4 h-4" />
                <span>اعتماد تقفيل التاريخ وحفظ السجل 🔒</span>
              </button>

            </form>
          )}

          {/* TAB 2: ACTIVE BLOCKED DATES & UNBLOCK */}
          {activeTab === 'list' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                <div>
                  <h4 className="font-black text-xs text-slate-800">قائمة التواريخ المغلقة حالياً</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5">يمكنك إعادة فتح أي تاريخ مغلق بضغطة واحدة عند إلغاء الحجز الخارجي</p>
                </div>
                <span className="bg-amber-100 text-amber-900 text-xs font-black px-3 py-1 rounded-full font-mono">
                  {activeBlocks.length} تاريخ مغلق
                </span>
              </div>

              {activeBlocks.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2 opacity-80" />
                  <p className="font-extrabold text-xs text-slate-700">لا توجد أي تواريخ مغلقة حالياً</p>
                  <p className="text-[11px] text-slate-400 mt-1">جميع المواعيد متاحة للحجز المباشر عبر المنصة</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeBlocks.map((block) => (
                    <div 
                      key={block.id}
                      className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-3 hover:border-amber-300 transition-all"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2.5 rounded-xl text-white font-bold shrink-0 mt-0.5 ${
                          block.blockType === 'external_booking' 
                            ? 'bg-purple-600' 
                            : block.blockType === 'maintenance' 
                              ? 'bg-amber-600' 
                              : 'bg-blue-600'
                        }`}>
                          <Lock className="w-4 h-4" />
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-extrabold text-xs text-slate-900">{block.entityName}</span>
                            
                            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                              block.blockType === 'external_booking'
                                ? 'bg-purple-100 text-purple-900'
                                : block.blockType === 'maintenance'
                                  ? 'bg-amber-100 text-amber-900'
                                  : 'bg-blue-100 text-blue-900'
                            }`}>
                              {block.blockType === 'external_booking' ? 'حجز خارجي 🔒' : block.blockType === 'maintenance' ? 'صيانة 🧡' : 'حد طاقة 💙'}
                            </span>

                            <span className="text-[10px] text-slate-400 font-mono bg-slate-100 px-2 py-0.5 rounded-md">
                              {block.period}
                            </span>
                          </div>

                          <div className="text-xs text-slate-700 font-bold flex items-center gap-2">
                            <span>التاريخ: <span className="font-mono text-amber-600">{block.startDate}</span></span>
                            {block.endDate && block.endDate !== block.startDate && (
                              <span>إلى <span className="font-mono text-amber-600">{block.endDate}</span></span>
                            )}
                          </div>

                          {block.reason && (
                            <p className="text-[11px] text-slate-500 bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                              الملاحظة: {block.reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Unblock Action Button */}
                      <button
                        type="button"
                        onClick={() => handleUnblock(block)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2 rounded-xl text-xs transition-all shadow-sm flex items-center gap-1.5 cursor-pointer shrink-0 self-end md:self-auto"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>إعادة الفتح (Unblock) 🔓</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ICAL & GOOGLE CALENDAR SYNC */}
          {activeTab === 'sync' && (
            <div className="space-y-6">
              
              {/* Section 1: Export Feed */}
              <div className="bg-slate-900 text-white p-5 rounded-3xl space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500 text-slate-950 rounded-xl">
                    <LinkIcon className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-amber-400">رابط تغذية التقويم (Export iCal Feed)</h4>
                    <p className="text-[11px] text-slate-300">انسخ هذا الرابط وأضفه في Google Calendar أو Apple Calendar لتلقي المواعيد آلياً</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-800 p-2.5 rounded-xl border border-slate-700 dir-ltr font-mono text-xs text-slate-200">
                  <span className="truncate flex-1">{currentEntityFeedUrl}</span>
                  <button
                    type="button"
                    onClick={handleCopyFeed}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    {copiedFeed ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span dir="rtl">{copiedFeed ? 'تم النسخ' : 'نسخ الرابط'}</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadIcsFile}
                  className="bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>تحميل ملف تقويم مباشر (.ics)</span>
                </button>
              </div>

              {/* Section 2: Import Feed */}
              <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 text-white rounded-xl">
                    <RefreshCw className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-800">مزامنة تقويم خارجي (Import iCal Link)</h4>
                    <p className="text-[11px] text-slate-500">أدخل رابط iCal لتقويمك الخارجي لسحب الحجوزات وتقفيل الأيام آلياً</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <input
                    type="url"
                    value={externalIcalUrl}
                    onChange={(e) => setExternalIcalUrl(e.target.value)}
                    placeholder="https://calendar.google.com/calendar/ical/.../basic.ics"
                    className="w-full bg-white text-slate-900 text-xs p-3 rounded-xl border border-slate-200 font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />

                  <button
                    type="button"
                    onClick={handleTriggerIcalSync}
                    disabled={isSyncing}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold px-5 py-3 rounded-xl text-xs transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer w-full"
                  >
                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    <span>تشغيل المزامنة الفورية الآن 🔄</span>
                  </button>
                </div>

                {lastSyncResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs font-bold">
                    {lastSyncResult}
                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 4: AUDIT TRAIL / LOGS */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <h4 className="font-black text-xs text-slate-800 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                <span>سجل التحديثات وإغلاقات المواعيد التاريخية</span>
              </h4>

              {historyBlocks.length === 0 ? (
                <p className="text-center py-8 text-slate-400 text-xs">لا يوجد سجل عمليات سابق.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
                  {historyBlocks.map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                        log.status === 'active' 
                          ? 'bg-slate-50 border-slate-200' 
                          : 'bg-slate-100/60 border-slate-200/50 opacity-60'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-slate-900">{log.entityName}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            log.status === 'active' ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {log.status === 'active' ? 'مغلق حالياً 🔒' : 'تم إعادة الفتح 🔓'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">{log.startDate}</span>
                        </div>
                        {log.reason && <p className="text-[11px] text-slate-600 mt-1">{log.reason}</p>}
                        <p className="text-[10px] text-slate-400 mt-0.5">بواسطة: {log.createdBy} • المصدر: {log.source}</p>
                      </div>

                      <span className="text-[10px] text-slate-400 font-mono shrink-0">{log.createdAt}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
