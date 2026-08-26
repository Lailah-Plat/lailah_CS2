import React, { useState, useMemo } from 'react';
import { 
  Layers, Search, Filter, Lock, Unlock, ShieldAlert, ShieldCheck, 
  Building2, Calendar as CalendarIcon, Clock, CheckCircle2, XCircle, 
  Eye, Download, FileSpreadsheet, AlertTriangle, Sparkles, RefreshCw, 
  MapPin, UserCheck, DollarSign, FileText, Sun, Moon, ArrowUpDown, ChevronDown
} from 'lucide-react';
import { BlockedDateEntry, ExternalBlockManagerModal } from '../ExternalBlockManagerModal';
import { formatBookingId, formatBlockedDateId } from '../../utils/idUtils';
import { convertDigits } from '../../utils/digitConverter';

interface MasterAvailabilityMatrixTabProps {
  userRole: string;
  isAdminUser: boolean;
  currentProviderName: string;
  halls: any[];
  setHalls?: React.Dispatch<React.SetStateAction<any[]>>;
  services: any[];
  setServices?: React.Dispatch<React.SetStateAction<any[]>>;
  bookings: any[];
  setBookings?: (bookings: any[]) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setViewingBooking?: (booking: any) => void;
  setIsBookingViewModalOpen?: (isOpen: boolean) => void;
  setInvoiceBookingToPrint?: (booking: any) => void;
}

export interface MasterMatrixRow {
  rowId: string;
  sourceType: 'platform_booking' | 'manual_block' | 'ical_sync' | 'admin_override';
  entityId: string | number;
  entityName: string;
  entityType: 'hall' | 'service';
  city: string;
  providerName: string;
  partnerTier?: string;
  dateStr: string;
  endDateStr?: string;
  period: 'صباحية' | 'مسائية' | 'يوم كامل' | 'كافة الفترات';
  statusLabel: string;
  statusCode: string;
  referenceId: string;
  customerName?: string;
  reasonOrDetails: string;
  amount?: number;
  platformCommission?: number;
  paymentStatus?: string;
  rawObject: any;
  isWeekend: boolean;
}

export const MasterAvailabilityMatrixTab: React.FC<MasterAvailabilityMatrixTabProps> = ({
  userRole,
  isAdminUser,
  currentProviderName,
  halls = [],
  setHalls,
  services = [],
  setServices,
  bookings = [],
  setBookings,
  showNotification,
  setViewingBooking,
  setIsBookingViewModalOpen,
  setInvoiceBookingToPrint
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedSourceType, setSelectedSourceType] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [filterWeekendOnly, setFilterWeekendOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc'>('date_desc');
  const [isExternalBlockModalOpen, setIsExternalBlockModalOpen] = useState(false);

  // Multi-tenancy filtering
  const effectiveHalls = useMemo(() => {
    if (isAdminUser || userRole === 'admin') return halls;
    return halls.filter(h => h.provider === currentProviderName || h.providerName === currentProviderName);
  }, [halls, isAdminUser, userRole, currentProviderName]);

  const effectiveServices = useMemo(() => {
    if (isAdminUser || userRole === 'admin') return services;
    return services.filter(s => s.provider === currentProviderName || s.providerName === currentProviderName);
  }, [services, isAdminUser, userRole, currentProviderName]);

  const effectiveBookings = useMemo(() => {
    if (isAdminUser || userRole === 'admin') return bookings;
    return bookings.filter(b => {
      const matchProvider = b.providerName === currentProviderName || b.provider === currentProviderName;
      const matchHall = effectiveHalls.some(h => String(h.id) === String(b.hallId));
      return matchProvider || matchHall;
    });
  }, [bookings, isAdminUser, userRole, currentProviderName, effectiveHalls]);

  // Aggregate Master Rows (Combining Bookings + Blocked Dates)
  const masterRows: MasterMatrixRow[] = useMemo(() => {
    const rows: MasterMatrixRow[] = [];

    // 1. Add Platform Bookings
    effectiveBookings.forEach((b: any) => {
      const bDate = b.startDate || b.date || '2026-09-01';
      const dObj = new Date(bDate);
      const dayOfWeek = dObj.getDay(); // 4 = Thu, 5 = Fri, 6 = Sat
      const isWeekend = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;

      const hallObj = effectiveHalls.find(h => String(h.id) === String(b.hallId));

      rows.push({
        rowId: `ROW-BKG-${b.id || bDate}`,
        sourceType: 'platform_booking',
        entityId: b.hallId || 1,
        entityName: b.itemName || hallObj?.name || 'قاعة منصة ليلة',
        entityType: 'hall',
        city: hallObj?.city || b.city || 'الرياض',
        providerName: b.providerName || hallObj?.provider || currentProviderName,
        partnerTier: hallObj?.tier || 'باقة الأعمال المتقدمة',
        dateStr: bDate,
        endDateStr: b.endDate || bDate,
        period: b.period || 'مسائية',
        statusLabel: b.status === 'مؤكد' ? '🟢 حجز مؤكد بالمنصة' : b.status === 'ملغي' ? '🔴 حجز ملغي' : '🟡 حجز معلق',
        statusCode: b.status || 'معلق',
        referenceId: formatBookingId(b.id || 1),
        customerName: b.customer || b.customerName || 'عميل المنصة',
        reasonOrDetails: `حجز مناسبة: ${b.eventType || 'حفل زفاف / مناسبة خاصة'}`,
        amount: b.amount || 0,
        platformCommission: b.commissionAmount || Math.round((b.amount || 0) * 0.10),
        paymentStatus: b.paymentStatus || 'غير مدفوع',
        rawObject: b,
        isWeekend
      });
    });

    // 2. Add Blocked Dates from Halls
    effectiveHalls.forEach((h: any) => {
      if (h.blockedDatesList && Array.isArray(h.blockedDatesList)) {
        h.blockedDatesList.forEach((blk: BlockedDateEntry) => {
          if (blk.status !== 'active') return; // only active blocks
          const dObj = new Date(blk.startDate);
          const dayOfWeek = dObj.getDay();
          const isWeekend = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;

          const isIcal = blk.source === 'ical_sync';
          const isAdminOverride = blk.source === 'admin_override';

          rows.push({
            rowId: `ROW-BLK-${blk.id}`,
            sourceType: isIcal ? 'ical_sync' : isAdminOverride ? 'admin_override' : 'manual_block',
            entityId: h.id,
            entityName: h.name,
            entityType: 'hall',
            city: h.city || 'الرياض',
            providerName: h.provider || h.providerName || currentProviderName,
            partnerTier: h.tier || 'باقة أساسية',
            dateStr: blk.startDate,
            endDateStr: blk.endDate,
            period: blk.period || 'يوم كامل',
            statusLabel: isIcal 
              ? '🔵 حظر خارجي متزامن (iCal)' 
              : isAdminOverride 
              ? '🟣 إغلاق إداري سيادي' 
              : '🔴 إغلاق وحظر يدوي',
            statusCode: blk.status,
            referenceId: blk.id || formatBlockedDateId(1),
            customerName: blk.blockType === 'external_booking' ? 'حجز مباشر خارجي' : '—',
            reasonOrDetails: blk.reason || (blk.blockType === 'maintenance' ? 'صيانة دورية وتجهيز' : 'حجز خارجي'),
            amount: 0,
            platformCommission: 0,
            paymentStatus: '—',
            rawObject: blk,
            isWeekend
          });
        });
      }
    });

    // 3. Add Blocked Dates from Services
    effectiveServices.forEach((s: any) => {
      if (s.blockedDatesList && Array.isArray(s.blockedDatesList)) {
        s.blockedDatesList.forEach((blk: BlockedDateEntry) => {
          if (blk.status !== 'active') return;
          const dObj = new Date(blk.startDate);
          const dayOfWeek = dObj.getDay();
          const isWeekend = dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6;

          rows.push({
            rowId: `ROW-SRV-BLK-${blk.id}`,
            sourceType: blk.source === 'ical_sync' ? 'ical_sync' : 'manual_block',
            entityId: s.id,
            entityName: s.title || s.name || 'خدمة مساندة',
            entityType: 'service',
            city: s.city || 'الرياض',
            providerName: s.provider || s.providerName || currentProviderName,
            dateStr: blk.startDate,
            endDateStr: blk.endDate,
            period: blk.period || 'يوم كامل',
            statusLabel: blk.source === 'ical_sync' ? '🔵 حظر خارجي متزامن (iCal)' : '🔴 إغلاق وحظر يدوي',
            statusCode: blk.status,
            referenceId: blk.id || formatBlockedDateId(1),
            customerName: '—',
            reasonOrDetails: blk.reason || 'إغلاق مؤقت للخدمة',
            amount: 0,
            platformCommission: 0,
            paymentStatus: '—',
            rawObject: blk,
            isWeekend
          });
        });
      }
    });

    // Sorting
    return rows.sort((a, b) => {
      if (sortBy === 'date_desc') {
        return new Date(b.dateStr).getTime() - new Date(a.dateStr).getTime();
      }
      if (sortBy === 'date_asc') {
        return new Date(a.dateStr).getTime() - new Date(b.dateStr).getTime();
      }
      if (sortBy === 'amount_desc') {
        return (b.amount || 0) - (a.amount || 0);
      }
      return 0;
    });
  }, [effectiveBookings, effectiveHalls, effectiveServices, currentProviderName, sortBy]);

  // Unique Cities & Providers for filters
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    masterRows.forEach(r => { if (r.city) set.add(r.city); });
    return Array.from(set);
  }, [masterRows]);

  const uniqueProviders = useMemo(() => {
    const set = new Set<string>();
    masterRows.forEach(r => { if (r.providerName) set.add(r.providerName); });
    return Array.from(set);
  }, [masterRows]);

  // Filtered Rows
  const filteredRows = useMemo(() => {
    return masterRows.filter(r => {
      if (selectedCity !== 'all' && r.city !== selectedCity) return false;
      if (selectedProvider !== 'all' && r.providerName !== selectedProvider) return false;
      if (selectedSourceType !== 'all' && r.sourceType !== selectedSourceType) return false;
      if (selectedPeriod !== 'all' && r.period !== selectedPeriod) return false;
      if (filterWeekendOnly && !r.isWeekend) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesEntity = r.entityName.toLowerCase().includes(q);
        const matchesRef = r.referenceId.toLowerCase().includes(q);
        const matchesCustomer = r.customerName?.toLowerCase().includes(q);
        const matchesProvider = r.providerName.toLowerCase().includes(q);
        const matchesReason = r.reasonOrDetails.toLowerCase().includes(q);
        if (!matchesEntity && !matchesRef && !matchesCustomer && !matchesProvider && !matchesReason) return false;
      }

      return true;
    });
  }, [masterRows, selectedCity, selectedProvider, selectedSourceType, selectedPeriod, filterWeekendOnly, searchQuery]);

  // Anti-Fraud Shadow Booking Alert Calculation
  const shadowBookingAlerts = useMemo(() => {
    const venueManualBlocks: { [venue: string]: { weekendCount: number; totalCount: number; provider: string } } = {};
    masterRows.forEach(r => {
      if (r.sourceType === 'manual_block') {
        if (!venueManualBlocks[r.entityName]) {
          venueManualBlocks[r.entityName] = { weekendCount: 0, totalCount: 0, provider: r.providerName };
        }
        venueManualBlocks[r.entityName].totalCount += 1;
        if (r.isWeekend) {
          venueManualBlocks[r.entityName].weekendCount += 1;
        }
      }
    });

    const suspiciousVenues = Object.entries(venueManualBlocks)
      .filter(([_, stats]) => stats.weekendCount >= 3 || stats.totalCount >= 5)
      .map(([venueName, stats]) => ({
        venueName,
        provider: stats.provider,
        weekendCount: stats.weekendCount,
        totalCount: stats.totalCount
      }));

    return suspiciousVenues;
  }, [masterRows]);

  // KPIs
  const totalOperations = masterRows.length;
  const platformBookingsCount = masterRows.filter(r => r.sourceType === 'platform_booking').length;
  const manualBlocksCount = masterRows.filter(r => r.sourceType === 'manual_block').length;
  const icalSyncsCount = masterRows.filter(r => r.sourceType === 'ical_sync').length;
  const totalFinancialVolume = masterRows.reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalPlatformCommissions = masterRows.reduce((acc, curr) => acc + (curr.platformCommission || 0), 0);

  // Sovereign Action: Force Unlock / Override Block
  const handleForceUnlock = (row: MasterMatrixRow) => {
    if (row.sourceType === 'platform_booking') {
      showNotification('warning', 'هذا السجل هو حجز منصة فعلي، يمكنك تعديل حالته من قسم تفاصيل الحجز.');
      return;
    }

    const blkId = row.referenceId;
    if (row.entityType === 'hall' && setHalls) {
      setHalls(prev => prev.map(h => {
        if (String(h.id) === String(row.entityId)) {
          const list = (h.blockedDatesList || []).map((b: any) => {
            if (b.id === blkId) {
              return { ...b, status: 'unblocked', unblockedBy: userRole === 'admin' ? 'الإدارة العامة (Force Override)' : currentProviderName };
            }
            return b;
          });
          return { ...h, blockedDatesList: list };
        }
        return h;
      }));
    } else if (row.entityType === 'service' && setServices) {
      setServices(prev => prev.map(s => {
        if (String(s.id) === String(row.entityId)) {
          const list = (s.blockedDatesList || []).map((b: any) => {
            if (b.id === blkId) {
              return { ...b, status: 'unblocked', unblockedBy: userRole === 'admin' ? 'الإدارة العامة (Force Override)' : currentProviderName };
            }
            return b;
          });
          return { ...s, blockedDatesList: list };
        }
        return s;
      }));
    }

    showNotification('success', `تم فك القفل الإداري الفوري للسجل (${blkId}) بنجاح وإعادة إتاحة التاريخ 🔓`);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['رقم السجل', 'المنشأة/الخدمة', 'النوع', 'المدينة', 'المزود', 'التاريخ', 'الفترة', 'الحالة', 'السبب/العميل', 'المبلغ', 'العمولة'];
    const rows = filteredRows.map(r => [
      r.referenceId,
      r.entityName,
      r.entityType === 'hall' ? 'قاعة' : 'خدمة مساندة',
      r.city,
      r.providerName,
      r.dateStr,
      r.period,
      r.statusLabel.replace(/[🟢🔴🟡🔵🟣]/g, '').trim(),
      r.reasonOrDetails,
      r.amount || 0,
      r.platformCommission || 0
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `lailah_master_availability_matrix_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showNotification('success', 'تم تصدير جدول الحجوزات والإغلاقات الشامل بصيغة CSV بنجاح 📊');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
      
      {/* Sovereign Header Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
              <Layers className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-white">جدول الحجوزات والإغلاقات المقفلة الشامل (Master Availability Matrix)</h3>
            <span className="px-2.5 py-0.5 bg-indigo-500/30 text-indigo-300 rounded-full text-xs font-black border border-indigo-400/30">
              {isAdminUser ? '👑 رؤية سيادية 360° لكافة الشركاء' : '💼 مصفوفة العمليات التشغيلية'}
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1 max-w-3xl leading-relaxed">
            مركز القيادة والتحكم الموحد لاستعراض كافة التواريخ المحجوزة والمغلقة (حجوزات المنصة المعتمدة، الإغلاقات اليدوية، حظورات iCal المتزامنة، والإغلاقات الإدارية) مع كاشف حجوزات الظل وفك القفل الفوري.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsExternalBlockModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-rose-600/20 transition-all hover:scale-105 cursor-pointer"
            title="فتح نافذة إدارة إغلاق المواعيد والتزامن الخارجي"
          >
            <Lock className="w-4 h-4" />
            <span>إغلاق موعد وتزامن iCal 🔒</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all hover:scale-105 shrink-0"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>تصدير تقرير الإشغال (CSV)</span>
          </button>
        </div>
      </div>

      {/* Sovereign KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">إجمالي السجلات المشغولة</span>
            <span className="text-2xl font-black text-slate-900 mt-0.5 block">{convertDigits(totalOperations)} سجل</span>
            <span className="text-[10px] text-slate-400">حجوزات وإغلاقات</span>
          </div>
          <div className="p-3 bg-slate-100 text-slate-700 rounded-2xl">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">حجوزات منصة ليلة المعتمدة</span>
            <span className="text-2xl font-black text-indigo-600 mt-0.5 block">{convertDigits(platformBookingsCount)} حجز</span>
            <span className="text-[10px] text-indigo-600 font-bold">عقود رسمية نشطة</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">إغلاقات يدوية ومباشرة</span>
            <span className="text-2xl font-black text-rose-600 mt-0.5 block">{convertDigits(manualBlocksCount)} إغلاق</span>
            <span className="text-[10px] text-rose-600 font-bold">صيانة / حجز مباشر</span>
          </div>
          <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
            <Lock className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-extrabold text-slate-500 block">حظورات تقويم خارجي (iCal)</span>
            <span className="text-2xl font-black text-amber-600 mt-0.5 block">{convertDigits(icalSyncsCount)} حظر</span>
            <span className="text-[10px] text-amber-600 font-bold">منع حجز مزدوج</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <RefreshCw className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Anti-Fraud & Shadow Booking Alert Box (خاص بالإدارة العامة) */}
      {isAdminUser && shadowBookingAlerts.length > 0 && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-amber-900 font-black text-xs">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
            <span>كاشف حجوزات الظل ومكافحة التهرب من العمولة (Anti-Fraud & Shadow Booking Monitor):</span>
          </div>
          <p className="text-xs text-amber-800 leading-relaxed">
            تم رصد قاعات تضع إغلاقات يدوية متكررة في عطلات نهاية الأسبوع (الخميس/الجمعة). يرجى مراجعة هذه المنشآت للتحقق من عدم وجود تعاقدات مباشرة خارج المنصة للتهرب من عمولة المنصة السيادية:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {shadowBookingAlerts.map((alert, idx) => (
              <div key={idx} className="p-2.5 bg-white rounded-xl border border-amber-200 text-xs flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">{alert.venueName}</span>
                  <span className="text-[10px] text-slate-400">الشريك: {alert.provider}</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-black">
                  {alert.weekendCount} إغلاق ذروة ⚠️
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Multi-Dimensional Filter Row */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          
          {/* City Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCity}
              onChange={e => setSelectedCity(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full cursor-pointer"
            >
              <option value="all">كافة المدن والمناطق</option>
              {uniqueCities.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Provider Filter */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedProvider}
              onChange={e => setSelectedProvider(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 outline-none w-full cursor-pointer"
            >
              <option value="all">كافة الشركاء والمزودين</option>
              {uniqueProviders.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* Source Type Filter */}
          <select
            value={selectedSourceType}
            onChange={e => setSelectedSourceType(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">كافة أنواع السجلات</option>
            <option value="platform_booking">🟢 حجوزات المنصة المعتمدة</option>
            <option value="manual_block">🔴 إغلاقات وحظورات يدوية</option>
            <option value="ical_sync">🔵 حظورات متزامنة مع iCal</option>
          </select>

          {/* Period Filter */}
          <select
            value={selectedPeriod}
            onChange={e => setSelectedPeriod(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-slate-700 outline-none cursor-pointer"
          >
            <option value="all">كافة الفترات الزمنية</option>
            <option value="صباحية">الفترة الصباحية (08:00 - 14:00)</option>
            <option value="مسائية">الفترة المسائية (16:00 - 23:00)</option>
            <option value="يوم كامل">كامل اليوم</option>
          </select>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="بحث بالرقم أو القاعة أو العميل..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-8 pl-3 py-1.5 text-xs font-medium text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>

        </div>

        {/* Quick Toggles */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer font-bold text-slate-700 select-none">
              <input
                type="checkbox"
                checked={filterWeekendOnly}
                onChange={e => setFilterWeekendOnly(e.target.checked)}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <span>عرض عطلات نهاية الأسبوع ومواسم الذروة فقط (الخميس/الجمعة/السبت) 🌟</span>
            </label>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-bold">
            <span>الترتيب:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 outline-none cursor-pointer"
            >
              <option value="date_desc">التاريخ (الأحدث أولاً)</option>
              <option value="date_asc">التاريخ (الأقدم أولاً)</option>
              <option value="amount_desc">الأعلى قيمة مالية</option>
            </select>
          </div>
        </div>
      </div>

      {/* ================= MASTER OPERATIONS MATRIX TABLE ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/70 flex items-center justify-between">
          <h4 className="text-sm font-black text-slate-800">
            مصفوفة العمليات التشغيلية المركزية ({filteredRows.length} سجل مطابق)
          </h4>
          <span className="text-xs text-slate-500 font-bold">
            تحديث لحظي لكافة الحجوزات والإغلاقات في المملكة
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
              <tr>
                <th className="p-3.5">المنشأة والشريك</th>
                <th className="p-3.5">المدينة</th>
                <th className="p-3.5">التاريخ والفترة</th>
                <th className="p-3.5">نوع السجل والحالة</th>
                <th className="p-3.5">المرجع / السبب / العميل</th>
                <th className="p-3.5">المؤشر المالي</th>
                <th className="p-3.5 text-center">التحكم السيادي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.map(row => (
                <tr key={row.rowId} className="hover:bg-slate-50/90 transition-colors">
                  
                  {/* Entity & Provider */}
                  <td className="p-3.5">
                    <span className="font-extrabold text-slate-900 block">{row.entityName}</span>
                    <span className="text-[10px] text-slate-400">{row.providerName}</span>
                  </td>

                  {/* City */}
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                      {row.city}
                    </span>
                  </td>

                  {/* Date & Shift */}
                  <td className="p-3.5">
                    <div className="font-bold text-slate-900 flex items-center gap-1">
                      <span>{row.dateStr}</span>
                      {row.isWeekend && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-100 text-amber-800 text-[9px] font-black">
                          ذروة
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 block">
                      {row.period === 'صباحية' && '☀️ الفترة الصباحية'}
                      {row.period === 'مسائية' && '🌙 الفترة المسائية'}
                      {row.period === 'يوم كامل' && '🚫 كامل اليوم'}
                    </span>
                  </td>

                  {/* Status & Tag */}
                  <td className="p-3.5">
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black inline-block ${
                      row.sourceType === 'platform_booking'
                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        : row.sourceType === 'ical_sync'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {row.statusLabel}
                    </span>
                  </td>

                  {/* Reference / Reason */}
                  <td className="p-3.5 max-w-[220px]">
                    <div className="font-mono font-bold text-slate-800">{row.referenceId}</div>
                    <div className="text-[11px] text-slate-600 truncate">{row.reasonOrDetails}</div>
                    {row.customerName && row.customerName !== '—' && (
                      <div className="text-[10px] text-slate-400">العميل: {row.customerName}</div>
                    )}
                  </td>

                  {/* Financial Snapshot */}
                  <td className="p-3.5">
                    {row.sourceType === 'platform_booking' ? (
                      <div>
                        <span className="font-black text-slate-900 block">{convertDigits((row.amount || 0).toLocaleString())} ر.س</span>
                        <span className="text-[10px] text-emerald-600 font-bold">
                          عمولة ليلة: {convertDigits((row.platformCommission || 0).toLocaleString())} ر.س
                        </span>
                      </div>
                    ) : (
                      <span className="text-slate-400 text-[10px]">إغلاق تشغيلي</span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="p-3.5 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {row.sourceType === 'platform_booking' ? (
                        <>
                          <button
                            onClick={() => {
                              if (setViewingBooking && setIsBookingViewModalOpen) {
                                setViewingBooking(row.rawObject);
                                setIsBookingViewModalOpen(true);
                              }
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 rounded-lg transition-colors"
                            title="معاينة تفاصيل الحجز"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {setInvoiceBookingToPrint && (
                            <button
                              onClick={() => setInvoiceBookingToPrint(row.rawObject)}
                              className="p-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-600 hover:text-emerald-600 rounded-lg transition-colors"
                              title="طباعة الفاتورة الضريبية"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => handleForceUnlock(row)}
                          className="px-2.5 py-1 bg-rose-50 hover:bg-emerald-50 text-rose-700 hover:text-emerald-700 border border-rose-200 hover:border-emerald-300 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shadow-xs"
                          title="فك القفل الإداري الفوري"
                        >
                          <Unlock className="w-3 h-3" />
                          <span>فك القفل</span>
                        </button>
                      )}
                    </div>
                  </td>

                </tr>
              ))}

              {filteredRows.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-bold text-xs">
                    لا توجد سجلات مطابقة لمعايير الفرز والتصفية
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* External Block & iCal Sync Manager Modal */}
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
        />
      )}

    </div>
  );
};
