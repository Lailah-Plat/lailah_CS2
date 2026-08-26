import React, { useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Lock, Unlock, Plus, Search, Filter, 
  RefreshCw, AlertCircle, CheckCircle2, Clock, ShieldCheck, 
  Trash2, Pencil, Sparkles, Building2, Briefcase, Eye, ChevronRight, 
  ChevronLeft, FileText, Download, ShieldAlert, Sun, Moon, Info, X
} from 'lucide-react';
import { BlockedDateEntry, ExternalBlockManagerModal } from '../ExternalBlockManagerModal';
import { formatBlockedDateId } from '../../utils/idUtils';
import { convertDigits } from '../../utils/digitConverter';

interface DayStatusInfo {
  morningStatus: 'available' | 'booked_platform' | 'blocked_manual' | 'blocked_ical';
  eveningStatus: 'available' | 'booked_platform' | 'blocked_manual' | 'blocked_ical';
  blocks: BlockedDateEntry[];
  bookings: any[];
  hasFullBlock: boolean;
  hasPartialBlock: boolean;
}

interface CurrentBlockedDatesTabProps {
  userRole: string;
  currentProviderName: string;
  halls: any[];
  setHalls?: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices?: React.Dispatch<React.SetStateAction<any[]>>;
  bookings?: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onNavigateToSync?: () => void;
}

export const CurrentBlockedDatesTab: React.FC<CurrentBlockedDatesTabProps> = ({
  userRole,
  currentProviderName,
  halls = [],
  setHalls,
  services = [],
  setServices,
  bookings = [],
  showNotification,
  onNavigateToSync
}) => {
  // View mode: 'calendar' or 'table'
  const [viewMode, setViewMode] = useState<'calendar' | 'table'>('calendar');

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntityType, setFilterEntityType] = useState<'all' | 'hall' | 'service'>('all');
  const [filterEntityId, setFilterEntityId] = useState<string>('all');
  const [filterBlockType, setFilterBlockType] = useState<string>('all');
  const [filterPeriod, setFilterPeriod] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'unblocked'>('active');

  // Calendar Date State
  const [calendarDate, setCalendarDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedDayDetail, setSelectedDayDetail] = useState<{
    dateStr: string;
    dayObj: any;
    blocks: BlockedDateEntry[];
    bookings: any[];
  } | null>(null);

  // Quick Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<BlockedDateEntry | null>(null);

  // Form states for Add/Edit
  const [formEntityType, setFormEntityType] = useState<'hall' | 'service'>('hall');
  const [formEntityId, setFormEntityId] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formEndDate, setFormEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [formPeriod, setFormPeriod] = useState<'صباحية' | 'مسائية' | 'يوم كامل' | 'كافة الفترات'>('يوم كامل');
  const [formBlockType, setFormBlockType] = useState<'external_booking' | 'maintenance' | 'capacity_limit' | 'other'>('maintenance');
  const [formReason, setFormReason] = useState<string>('');
  const [formConfidentialNotes, setFormConfidentialNotes] = useState<string>('');

  // Strict Multi-tenancy filtering
  const availableHalls = useMemo(() => {
    if (userRole === 'admin') return halls;
    return halls.filter(h => h.provider === currentProviderName || h.providerName === currentProviderName);
  }, [halls, userRole, currentProviderName]);

  const availableServices = useMemo(() => {
    if (userRole === 'admin') return services;
    return services.filter(s => s.provider === currentProviderName || s.providerName === currentProviderName);
  }, [services, userRole, currentProviderName]);

  // Aggregate all Blocked Dates
  const allBlockedEntries = useMemo(() => {
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

    return list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [availableHalls, availableServices]);

  // KPIs
  const activeBlocks = useMemo(() => allBlockedEntries.filter(b => b.status === 'active'), [allBlockedEntries]);
  const maintenanceCount = useMemo(() => activeBlocks.filter(b => b.blockType === 'maintenance').length, [activeBlocks]);
  const directBookingCount = useMemo(() => activeBlocks.filter(b => b.blockType === 'external_booking').length, [activeBlocks]);
  const icalSyncCount = useMemo(() => activeBlocks.filter(b => b.source === 'ical_sync').length, [activeBlocks]);

  // Filtered Blocks for Table
  const filteredBlocks = useMemo(() => {
    return allBlockedEntries.filter(b => {
      if (filterStatus !== 'all' && b.status !== filterStatus) return false;
      if (filterEntityType !== 'all' && b.entityType !== filterEntityType) return false;
      if (filterEntityId !== 'all' && String(b.entityId) !== filterEntityId) return false;
      if (filterBlockType !== 'all' && b.blockType !== filterBlockType) return false;
      if (filterPeriod !== 'all' && b.period !== filterPeriod) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = b.entityName?.toLowerCase().includes(q);
        const matchesReason = b.reason?.toLowerCase().includes(q);
        const matchesId = b.id?.toLowerCase().includes(q);
        const matchesProvider = b.providerName?.toLowerCase().includes(q);
        if (!matchesName && !matchesReason && !matchesId && !matchesProvider) return false;
      }

      return true;
    });
  }, [allBlockedEntries, filterStatus, filterEntityType, filterEntityId, filterBlockType, filterPeriod, searchQuery]);

  // Calendar Helpers
  const year = calendarDate.getFullYear();
  const month = calendarDate.getMonth();
  
  const monthNames = [
    'يناير (محرم/صفر)', 'فبراير (صفر/ربيع الأول)', 'مارس (ربيع الأول/الثاني)', 
    'أبريل (ربيع الثاني/جمادى الأولى)', 'مايو (جمادى الأولى/الثانية)', 'يونيو (جمادى الثانية/رجب)',
    'يوليو (رجب/شعبان)', 'أغسطس (شعبان/رمضان)', 'سبتمبر (رمضان/شوال)', 
    'أكتوبر (شوال/ذو القعدة)', 'نوفمبر (ذو القعدة/ذو الحجة)', 'ديسمبر (ذو الحجة/محرم)'
  ];

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday

  const prevMonth = () => setCalendarDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(year, month + 1, 1));
  const goToToday = () => {
    const d = new Date();
    setCalendarDate(new Date(d.getFullYear(), d.getMonth(), 1));
  };

  // Get status for a specific calendar date (YYYY-MM-DD)
  const getDayStatus = (dateStr: string): DayStatusInfo => {
    // Filter blocks active on this date for the selected entity filter
    const matchedBlocks = activeBlocks.filter(b => {
      if (filterEntityId !== 'all' && String(b.entityId) !== filterEntityId) return false;
      return dateStr >= b.startDate && dateStr <= b.endDate;
    });

    // Check platform bookings on this date
    const matchedBookings = bookings.filter(b => {
      if (b.status === 'ملغي') return false;
      if (filterEntityId !== 'all' && String(b.hallId) !== filterEntityId) return false;
      const bDate = b.startDate || b.date;
      return bDate === dateStr;
    });

    let morningStatus: 'available' | 'booked_platform' | 'blocked_manual' | 'blocked_ical' = 'available';
    let eveningStatus: 'available' | 'booked_platform' | 'blocked_manual' | 'blocked_ical' = 'available';

    // Check blocks
    matchedBlocks.forEach(b => {
      const isIcal = b.source === 'ical_sync';
      const blockStatus = isIcal ? 'blocked_ical' : 'blocked_manual';

      if (b.period === 'صباحية') {
        morningStatus = blockStatus;
      } else if (b.period === 'مسائية') {
        eveningStatus = blockStatus;
      } else {
        morningStatus = blockStatus;
        eveningStatus = blockStatus;
      }
    });

    // Check platform bookings
    matchedBookings.forEach(b => {
      if (b.period === 'صباحية' || b.period === 'صباحي') {
        morningStatus = 'booked_platform';
      } else if (b.period === 'مسائية' || b.period === 'مسائي') {
        eveningStatus = 'booked_platform';
      } else {
        morningStatus = 'booked_platform';
        eveningStatus = 'booked_platform';
      }
    });

    return {
      morningStatus,
      eveningStatus,
      blocks: matchedBlocks,
      bookings: matchedBookings,
      hasFullBlock: (morningStatus !== 'available' && eveningStatus !== 'available'),
      hasPartialBlock: (morningStatus !== 'available' || eveningStatus !== 'available')
    };
  };

  // Handle Form Submit (Add or Edit)
  const handleSaveBlock = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formEntityId) {
      showNotification('error', 'يرجى اختيار القاعة أو الخدمة أولاً.');
      return;
    }
    if (!formStartDate) {
      showNotification('error', 'يرجى تحديد تاريخ البداية.');
      return;
    }

    const targetEntity = formEntityType === 'hall'
      ? availableHalls.find(h => String(h.id) === String(formEntityId))
      : availableServices.find(s => String(s.id) === String(formEntityId));

    if (!targetEntity) {
      showNotification('error', 'المنشأة أو الخدمة المحددة غير موجودة.');
      return;
    }

    const blockId = editingBlock ? editingBlock.id : formatBlockedDateId(Date.now());
    const finalReason = formReason || (formBlockType === 'maintenance' ? 'أعمال صيانة دورية وتجهيز' : 'حجز مباشر خارجي');

    const newEntry: BlockedDateEntry = {
      id: blockId,
      entityId: formEntityId,
      entityType: formEntityType,
      entityName: targetEntity.name || targetEntity.title || 'منشأة / خدمة',
      providerName: targetEntity.provider || targetEntity.providerName || currentProviderName,
      startDate: formStartDate,
      endDate: formEndDate || formStartDate,
      period: formPeriod,
      blockType: formBlockType,
      reason: finalReason,
      source: editingBlock ? editingBlock.source : 'manual',
      status: 'active',
      createdAt: editingBlock ? editingBlock.createdAt : new Date().toLocaleString('ar-SA'),
      createdBy: userRole === 'admin' ? 'الإدارة العامة' : currentProviderName
    };

    if (formEntityType === 'hall' && setHalls) {
      setHalls(prev => prev.map((h: any) => {
        if (String(h.id) === String(formEntityId)) {
          let list = (h.blockedDatesList || []).filter((b: any) => b.id !== blockId);
          list = [newEntry, ...list];
          const existingDates = h.bookedDates || [];
          return {
            ...h,
            blockedDatesList: list,
            bookedDates: Array.from(new Set([...existingDates, formStartDate, formEndDate]))
          };
        }
        return h;
      }));
    } else if (formEntityType === 'service' && setServices) {
      setServices(prev => prev.map((s: any) => {
        if (String(s.id) === String(formEntityId)) {
          let list = (s.blockedDatesList || []).filter((b: any) => b.id !== blockId);
          list = [newEntry, ...list];
          const existingDates = s.blockedDates || [];
          return {
            ...s,
            blockedDatesList: list,
            blockedDates: Array.from(new Set([...existingDates, formStartDate, formEndDate]))
          };
        }
        return s;
      }));
    }

    showNotification('success', editingBlock ? 'تم تحديث بيانات الإغلاق بنجاح 🔒' : 'تم إغلاق وحظر التاريخ والفترة بنجاح وتحديث التقويم 🔒');
    setIsAddModalOpen(false);
    setEditingBlock(null);
  };

  // Handle Unblock Action
  const handleUnblock = (block: BlockedDateEntry) => {
    const updatedEntry: BlockedDateEntry = {
      ...block,
      status: 'unblocked',
      unblockedAt: new Date().toLocaleString('ar-SA'),
      unblockedBy: userRole === 'admin' ? 'الإدارة العامة' : currentProviderName
    };

    if (block.entityType === 'hall' && setHalls) {
      setHalls(prev => prev.map((h: any) => {
        if (String(h.id) === String(block.entityId)) {
          const list = (h.blockedDatesList || []).map((b: any) => b.id === block.id ? updatedEntry : b);
          return { ...h, blockedDatesList: list };
        }
        return h;
      }));
    } else if (block.entityType === 'service' && setServices) {
      setServices(prev => prev.map((s: any) => {
        if (String(s.id) === String(block.entityId)) {
          const list = (s.blockedDatesList || []).map((b: any) => b.id === block.id ? updatedEntry : b);
          return { ...s, blockedDatesList: list };
        }
        return s;
      }));
    }

    showNotification('success', `تم فك حظر التاريخ (${block.startDate}) بنجاح وإعادة إتاحته في تقويم المنصة 🔓`);
    if (selectedDayDetail) {
      setSelectedDayDetail(null);
    }
  };

  // Quick Block from Day Click
  const handleQuickDayBlock = (dateStr: string, periodType: 'صباحية' | 'مسائية' | 'يوم كامل') => {
    const defaultId = filterEntityId !== 'all' ? filterEntityId : availableHalls[0]?.id;
    if (!defaultId) {
      showNotification('error', 'يرجى اختيار قاعة أولاً لإتمام الإغلاق السريع.');
      return;
    }
    setFormEntityType('hall');
    setFormEntityId(String(defaultId));
    setFormStartDate(dateStr);
    setFormEndDate(dateStr);
    setFormPeriod(periodType);
    setFormBlockType('maintenance');
    setFormReason('إغلاق سريع من التقويم');
    setEditingBlock(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
      
      {/* Top Banner & Control Bar */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-rose-50 text-rose-600 rounded-xl border border-rose-100">
              <Lock className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-slate-900">إدارة التواريخ المغلقة حالياً (Current Blocked Dates)</h3>
            <span className="px-2.5 py-0.5 bg-rose-100 text-rose-800 rounded-full text-xs font-black">
              {activeBlocks.length} تاريخ مغلق نشط
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl leading-relaxed">
            يستعرض هذا القسم جميع التواريخ المغلقة تلقائياً عبر التقويم الخارجي أو المضافة يدوياً (كحجوزات خارجية مباشرة، أو أعمال صيانة، أو استنفاد طاقة). التفاصيل والملاحظات هنا <strong>حصرية وسرية للمزود والإدارة العامة فقط</strong> وتظهر للعملاء كـ "محجوز / غير متاح" فقط.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5 text-rose-600" />
              <span>تقويم الفترات والأيام</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-indigo-600" />
              <span>جدول السجلات</span>
            </button>
          </div>

          <button
            onClick={() => {
              setEditingBlock(null);
              setFormEntityType('hall');
              setFormEntityId(String(availableHalls[0]?.id || ''));
              setFormStartDate(new Date().toISOString().split('T')[0]);
              setFormEndDate(new Date().toISOString().split('T')[0]);
              setFormPeriod('يوم كامل');
              setFormBlockType('maintenance');
              setFormReason('');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/20 transition-all hover:scale-105"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة إغلاق / حظر جديد</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">إجمالي التواريخ المغلقة</span>
            <span className="text-2xl font-black text-rose-600 mt-0.5 block">{convertDigits(activeBlocks.length)} إغلاق</span>
            <span className="text-[10px] text-slate-400">نشط في التقويم</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">إغلاقات الصيانة والتجهيز</span>
            <span className="text-2xl font-black text-amber-600 mt-0.5 block">{convertDigits(maintenanceCount)} فترة</span>
            <span className="text-[10px] text-amber-600 font-bold">مجدولة دورياً</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">حجوزات مباشرة خارجية</span>
            <span className="text-2xl font-black text-indigo-600 mt-0.5 block">{convertDigits(directBookingCount)} حجز</span>
            <span className="text-[10px] text-indigo-600 font-bold">كاش أو هاتفياً</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <Building2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">متزامن مع تقويم خارجي (iCal)</span>
            <span className="text-2xl font-black text-emerald-600 mt-0.5 block">{convertDigits(icalSyncCount)} حدث</span>
            <span className="text-[10px] text-emerald-600 font-bold">Google / Apple Cal</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          {/* Entity Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterEntityId}
              onChange={e => setFilterEntityId(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="all">كافة القاعات والخدمات ({availableHalls.length + availableServices.length})</option>
              <optgroup label="القاعات والمنشآت">
                {availableHalls.map(h => (
                  <option key={h.id} value={String(h.id)}>قاعة: {h.name}</option>
                ))}
              </optgroup>
              <optgroup label="الخدمات المساندة">
                {availableServices.map(s => (
                  <option key={s.id} value={String(s.id)}>خدمة: {s.title || s.name}</option>
                ))}
              </optgroup>
            </select>
          </div>

          {/* Period Filter */}
          <select
            value={filterPeriod}
            onChange={e => setFilterPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">كافة الفترات</option>
            <option value="صباحية">الفترة الصباحية (08:00 - 14:00)</option>
            <option value="مسائية">الفترة المسائية (16:00 - 23:00)</option>
            <option value="يوم كامل">يوم كامل (كلا الفترتين)</option>
          </select>

          {/* Block Type Filter */}
          <select
            value={filterBlockType}
            onChange={e => setFilterBlockType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">كافة أسباب الإغلاق</option>
            <option value="maintenance">صيانة دورية وتجهيز</option>
            <option value="external_booking">حجز مباشر خارج المنصة</option>
            <option value="capacity_limit">استنفاد الطاقة الاستيعابية</option>
            <option value="other">مناسبة خاصة / أخرى</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="بحث بالسبب أو المنشأة..."
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-rose-500 focus:bg-white"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
        </div>
      </div>

      {/* ================= CALENDAR VIEW (تقويم الفترات والأيام) ================= */}
      {viewMode === 'calendar' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          {/* Calendar Header */}
          <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={prevMonth}
                className="p-2 hover:bg-white rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-xs"
                title="الشهر السابق"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <h4 className="text-base font-black text-slate-800 min-w-[200px] text-center">
                {monthNames[month]} {convertDigits(year)}
              </h4>
              <button
                onClick={nextMonth}
                className="p-2 hover:bg-white rounded-xl border border-slate-200 text-slate-600 transition-colors shadow-xs"
                title="الشهر التالي"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={goToToday}
                className="px-3 py-1 bg-white hover:bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 transition-colors"
              >
                اليوم
              </button>
            </div>

            {/* Legend / دليل الألوان */}
            <div className="flex flex-wrap items-center gap-3 text-[11px] font-bold">
              <span className="flex items-center gap-1 text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
                فترة متاحة
              </span>
              <span className="flex items-center gap-1 text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
                إغلاق يدوي/صيانة
              </span>
              <span className="flex items-center gap-1 text-indigo-700">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block"></span>
                حجز مؤكد بالمنصة
              </span>
              <span className="flex items-center gap-1 text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
                مزامنة iCal
              </span>
            </div>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/60 text-center text-xs font-extrabold text-slate-600 py-2.5">
            <div>الأحد</div>
            <div>الإثنين</div>
            <div>الثلاثاء</div>
            <div>الأربعاء</div>
            <div>الخميس</div>
            <div className="text-amber-700">الجمعة (ذروة)</div>
            <div className="text-amber-700">السبت (ذروة)</div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-200">
            {/* Empty offset days */}
            {Array.from({ length: firstDayIndex }).map((_, idx) => (
              <div key={`empty-${idx}`} className="bg-slate-50/50 min-h-[110px] p-2 opacity-30"></div>
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNum = idx + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const dayStatus = getDayStatus(dateStr);
              const isToday = new Date().toISOString().split('T')[0] === dateStr;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDayDetail({
                    dateStr,
                    dayObj: dayStatus,
                    blocks: dayStatus.blocks,
                    bookings: dayStatus.bookings
                  })}
                  className={`bg-white min-h-[115px] p-2.5 transition-all hover:bg-slate-50 cursor-pointer flex flex-col justify-between group relative ${
                    isToday ? 'ring-2 ring-rose-500 ring-inset bg-rose-50/20' : ''
                  }`}
                >
                  {/* Top Day Number & Badge */}
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-black rounded-full w-6 h-6 flex items-center justify-center ${
                      isToday ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-800 group-hover:text-rose-600'
                    }`}>
                      {convertDigits(dayNum)}
                    </span>
                    {dayStatus.blocks.length > 0 && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 font-black flex items-center gap-0.5">
                        <Lock className="w-2.5 h-2.5" />
                        {dayStatus.blocks.length}
                      </span>
                    )}
                  </div>

                  {/* Shifts Indicators (الفترة الصباحية والمسائية) */}
                  <div className="space-y-1 my-auto">
                    {/* Morning Shift */}
                    <div className={`flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded-md border text-right font-bold transition-all ${
                      dayStatus.morningStatus === 'available'
                        ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                        : dayStatus.morningStatus === 'booked_platform'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : dayStatus.morningStatus === 'blocked_ical'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Sun className="w-2.5 h-2.5 text-amber-500" />
                        <span>صباحية</span>
                      </span>
                      <span className="text-[9px]">
                        {dayStatus.morningStatus === 'available' && 'متاح 🟢'}
                        {dayStatus.morningStatus === 'booked_platform' && 'حجز 🔵'}
                        {dayStatus.morningStatus === 'blocked_ical' && 'iCal 🟠'}
                        {dayStatus.morningStatus === 'blocked_manual' && 'مغلق 🔴'}
                      </span>
                    </div>

                    {/* Evening Shift */}
                    <div className={`flex items-center justify-between text-[10px] px-1.5 py-0.5 rounded-md border text-right font-bold transition-all ${
                      dayStatus.eveningStatus === 'available'
                        ? 'bg-emerald-50/70 text-emerald-800 border-emerald-200'
                        : dayStatus.eveningStatus === 'booked_platform'
                        ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                        : dayStatus.eveningStatus === 'blocked_ical'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-rose-50 text-rose-800 border-rose-200'
                    }`}>
                      <span className="flex items-center gap-1">
                        <Moon className="w-2.5 h-2.5 text-indigo-500" />
                        <span>مسائية</span>
                      </span>
                      <span className="text-[9px]">
                        {dayStatus.eveningStatus === 'available' && 'متاح 🟢'}
                        {dayStatus.eveningStatus === 'booked_platform' && 'حجز 🔵'}
                        {dayStatus.eveningStatus === 'blocked_ical' && 'iCal 🟠'}
                        {dayStatus.eveningStatus === 'blocked_manual' && 'مغلق 🔴'}
                      </span>
                    </div>
                  </div>

                  {/* Bottom Quick Action hint */}
                  <div className="text-[9px] text-slate-400 group-hover:text-slate-600 text-center font-medium pt-1">
                    انقر للإدارة ⚡
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= TABLE VIEW OF ALL BLOCKS ================= */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <h4 className="text-sm font-black text-slate-800">سجل التواريخ والفترات المغلقة النشطة ({filteredBlocks.length})</h4>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">🔒 كافة الأسباب سرية ومحجوبة عن العملاء</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-100/75 text-slate-700 font-black border-b border-slate-200">
                <tr>
                  <th className="p-3.5">رقم السجل</th>
                  <th className="p-3.5">المنشأة / الخدمة</th>
                  <th className="p-3.5">نطاق التواريخ</th>
                  <th className="p-3.5">الفترة المحظورة</th>
                  <th className="p-3.5">نوع الإغلاق والسبب</th>
                  <th className="p-3.5">المصدر</th>
                  <th className="p-3.5">الحالة</th>
                  <th className="p-3.5 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBlocks.map(block => (
                  <tr key={block.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-800">{block.id}</td>
                    <td className="p-3.5">
                      <span className="font-extrabold text-slate-900 block">{block.entityName}</span>
                      <span className="text-[10px] text-slate-400">{block.providerName || currentProviderName}</span>
                    </td>
                    <td className="p-3.5">
                      <div className="font-bold text-slate-800">{block.startDate}</div>
                      {block.endDate !== block.startDate && (
                        <div className="text-[10px] text-slate-500">إلى {block.endDate}</div>
                      )}
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black border ${
                        block.period === 'صباحية'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : block.period === 'مسائية'
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                          : 'bg-rose-50 text-rose-800 border-rose-200'
                      }`}>
                        {block.period}
                      </span>
                    </td>
                    <td className="p-3.5 max-w-[220px]">
                      <div className="font-bold text-slate-800 truncate">{block.reason || 'إغلاق مؤقت'}</div>
                      <div className="text-[10px] text-slate-400">
                        {block.blockType === 'maintenance' && '🔧 صيانة وتجهيز'}
                        {block.blockType === 'external_booking' && '📞 حجز خارجي مباشر'}
                        {block.blockType === 'capacity_limit' && '👥 استنفاد طاقة'}
                        {block.blockType === 'other' && '🔒 مناسبة خاصة'}
                      </div>
                    </td>
                    <td className="p-3.5">
                      <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                        {block.source === 'ical_sync' ? '🔄 مزامنة iCal' : '👤 إضافة يدوية'}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                        block.status === 'active'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {block.status === 'active' ? '🔴 محظور حالياً' : '⚪ مفكوك الحظر'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center">
                      {block.status === 'active' ? (
                        <button
                          onClick={() => handleUnblock(block)}
                          className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold transition-all flex items-center gap-1 mx-auto shadow-xs"
                          title="فك الحظر وإعادة إتاحة التاريخ للعملاء"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>فك الحظر</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-bold">متاح للعملاء</span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredBlocks.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold text-xs">
                      لا توجد تواريخ مغلقة مطابقة لشروط البحث
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= DAY DETAILS DRAWER / MODAL ================= */}
      {selectedDayDetail && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden text-right">
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarIcon className="w-5 h-5 text-rose-400" />
                <h4 className="font-bold text-base">إدارة حالة يوم: {selectedDayDetail.dateStr}</h4>
              </div>
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Quick status preview */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1">
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    الفترة الصباحية (08:00 - 14:00)
                  </span>
                  <span className="text-sm font-black text-slate-900 block">
                    {selectedDayDetail.dayObj.morningStatus === 'available' && '🟢 متاحة للحجز'}
                    {selectedDayDetail.dayObj.morningStatus === 'booked_platform' && '🔵 محجوزة بالمنصة'}
                    {selectedDayDetail.dayObj.morningStatus === 'blocked_ical' && '🟠 متزامنة مع iCal'}
                    {selectedDayDetail.dayObj.morningStatus === 'blocked_manual' && '🔴 مغلقة يدوياً'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-500 block mb-1 flex items-center gap-1">
                    <Moon className="w-3.5 h-3.5 text-indigo-500" />
                    الفترة المسائية (16:00 - 23:00)
                  </span>
                  <span className="text-sm font-black text-slate-900 block">
                    {selectedDayDetail.dayObj.eveningStatus === 'available' && '🟢 متاحة للحجز'}
                    {selectedDayDetail.dayObj.eveningStatus === 'booked_platform' && '🔵 محجوزة بالمنصة'}
                    {selectedDayDetail.dayObj.eveningStatus === 'blocked_ical' && '🟠 متزامنة مع iCal'}
                    {selectedDayDetail.dayObj.eveningStatus === 'blocked_manual' && '🔴 مغلقة يدوياً'}
                  </span>
                </div>
              </div>

              {/* Active Blocks on this day */}
              <div>
                <h5 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-rose-600" />
                  سجلات الحظر النشطة في هذا اليوم ({selectedDayDetail.blocks.length})
                </h5>
                {selectedDayDetail.blocks.length > 0 ? (
                  <div className="space-y-2">
                    {selectedDayDetail.blocks.map(b => (
                      <div key={b.id} className="p-3 rounded-xl bg-rose-50/50 border border-rose-200 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-xs text-rose-900">{b.entityName}</span>
                            <span className="px-2 py-0.5 rounded bg-rose-200 text-rose-900 text-[10px] font-black">
                              فترة: {b.period}
                            </span>
                          </div>
                          <p className="text-xs text-rose-700 mt-1">السبب: {b.reason}</p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">🔒 سري للمزود والإدارة</span>
                        </div>

                        <button
                          onClick={() => handleUnblock(b)}
                          className="px-3 py-1.5 bg-white hover:bg-emerald-600 hover:text-white text-emerald-700 border border-emerald-300 rounded-xl text-xs font-bold transition-all flex items-center gap-1 shrink-0 shadow-xs"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                          <span>فك الحظر</span>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center">
                    لا توجد إغلاقات يدوية أو حظورات خارجية مسجلة في هذا اليوم.
                  </p>
                )}
              </div>

              {/* Quick Block Actions */}
              <div className="pt-3 border-t border-slate-100">
                <h5 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-rose-600" />
                  إجراءات الإغلاق السريع لهذا اليوم
                </h5>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleQuickDayBlock(selectedDayDetail.dateStr, 'صباحية')}
                    className="p-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold transition-all text-center"
                  >
                    حظر الصباحية فقط ☀️
                  </button>
                  <button
                    onClick={() => handleQuickDayBlock(selectedDayDetail.dateStr, 'مسائية')}
                    className="p-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 rounded-xl text-xs font-bold transition-all text-center"
                  >
                    حظر المسائية فقط 🌙
                  </button>
                  <button
                    onClick={() => handleQuickDayBlock(selectedDayDetail.dateStr, 'يوم كامل')}
                    className="p-2.5 bg-rose-50 hover:bg-rose-100 text-rose-900 border border-rose-200 rounded-xl text-xs font-bold transition-all text-center"
                  >
                    حظر كامل اليوم 🚫
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedDayDetail(null)}
                className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= EXTERNAL BLOCK & ICAL SYNC MANAGER MODAL ================= */}
      {isAddModalOpen && (
        <ExternalBlockManagerModal
          userRole={userRole}
          currentProviderName={currentProviderName}
          halls={halls}
          setHalls={setHalls || (() => {})}
          services={services}
          setServices={setServices || (() => {})}
          showNotification={showNotification}
          onClose={() => {
            setIsAddModalOpen(false);
            setEditingBlock(null);
          }}
          defaultEntityId={formEntityId || availableHalls[0]?.id || availableServices[0]?.id}
          defaultEntityType={formEntityType}
        />
      )}

    </div>
  );
};
