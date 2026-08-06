import React, { useState, useEffect } from 'react';
import { 
  Activity, Calendar, CheckSquare, Clock, Search, Sparkles, Coffee, Eye, 
  Check, FileText, ArrowRightLeft, ShieldAlert, CheckCircle2, AlertTriangle, 
  RefreshCw, Users2, X, Printer, Plus, Wallet, Lock, MapPin, ChevronRight, ChevronLeft,
  Trash, Info, Edit, Box, Trash2, Inbox
} from 'lucide-react';

interface OperationsCenterProps {
  currentProviderName: string;
  currentUserName: string;
  myBookings: any[];
  mySupportRequests: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function OperationsCenter({
  currentProviderName,
  currentUserName,
  myBookings: initialBookings,
  mySupportRequests: initialSupportRequests,
  showNotification
}: OperationsCenterProps) {
  // Helpers to ensure strict, standardized ID formatting
  const formatBkgId = (id: any) => {
    if (!id) return '';
    const idStr = String(id);
    if (idStr.startsWith('BKG-')) {
      const parts = idStr.split('-');
      if (parts.length === 3 && parts[2].length === 10) return idStr;
      const cleanNum = idStr.replace(/\D/g, '');
      return `BKG-26-${cleanNum.padStart(10, '0')}`;
    }
    const cleanNum = idStr.replace(/\D/g, '');
    return `BKG-26-${cleanNum.padStart(10, '0')}`;
  };

  const formatInvoiceId = (id: any) => {
    if (!id) return '';
    const idStr = String(id);
    if (idStr.startsWith('INV-')) {
      const cleanNum = idStr.replace(/\D/g, '');
      return `INV-26${cleanNum.padStart(10, '0')}`;
    }
    const cleanNum = idStr.replace(/\D/g, '');
    return `INV-26${cleanNum.padStart(10, '0')}`;
  };

  // Local state for interactive data
  const [localBookings, setLocalBookings] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`provider_bookings_ops_${currentProviderName}`);
      return stored ? JSON.parse(stored) : initialBookings;
    } catch {
      return initialBookings;
    }
  });

  const [localSupportRequests, setLocalSupportRequests] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`provider_support_ops_${currentProviderName}`);
      return stored ? JSON.parse(stored) : initialSupportRequests;
    } catch {
      return initialSupportRequests;
    }
  });

  const saveBookings = (next: any[]) => {
    setLocalBookings(next);
    localStorage.setItem(`provider_bookings_ops_${currentProviderName}`, JSON.stringify(next));
  };

  const saveSupportRequests = (next: any[]) => {
    setLocalSupportRequests(next);
    localStorage.setItem(`provider_support_ops_${currentProviderName}`, JSON.stringify(next));
  };

  // Synchronize if initial changes
  useEffect(() => {
    const storedB = localStorage.getItem(`provider_bookings_ops_${currentProviderName}`);
    if (!storedB) {
      setLocalBookings(initialBookings);
    }
  }, [initialBookings, currentProviderName]);

  useEffect(() => {
    const storedS = localStorage.getItem(`provider_support_ops_${currentProviderName}`);
    if (!storedS) {
      setLocalSupportRequests(initialSupportRequests);
    }
  }, [initialSupportRequests, currentProviderName]);

  // Sub-tabs State
  const [opsActiveTab, setOpsActiveTab] = useState<'live' | 'calendar' | 'tasks' | 'timeline'>('live');
  const [opsSearchQuery, setOpsSearchQuery] = useState('');
  
  // Pipeline node selection
  const [selectedPipelineNode, setSelectedPipelineNode] = useState<'events' | 'independent' | 'pending' | 'support' | 'payouts'>('events');

  // Calendar State
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-07-22');
  const [calendarMonth, setCalendarMonth] = useState<number>(7); // July
  const [calendarYear, setCalendarYear] = useState<number>(2026);

  // Timeline State
  const [selectedTimelineCategory, setSelectedTimelineCategory] = useState<'all' | 'logistics' | 'finance' | 'system'>('all');
  const [timelineLogs, setTimelineLogs] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`provider_timeline_logs_${currentProviderName}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 'log-1', text: 'تم إسناد فريق النظافة لتجهيز القاعة الكبرى لحفل عائلة الرويلي', category: 'logistics', time: 'اليوم، 10:30 ص', user: 'خالد الرويلي' },
      { id: 'log-2', text: 'قام أحمد السالم بإنشاء وتأكيد قائمة بوفيه الضيافة للطلب #SRV-26-0000000001', category: 'logistics', time: 'اليوم، 09:15 ص', user: 'أحمد السالم' },
      { id: 'log-3', text: 'تم استلام دفعة سداد جديدة بقيمة 4,500 ر.س (الدفعة الأولى لطلب الضيافة)', category: 'finance', time: 'اليوم، 08:00 ص', user: 'بوابة الدفع' },
      { id: 'log-4', text: 'تسوية مالية جديدة جاهزة للصرف لحساب المزود البنكي بقيمة 15,000 ر.س', category: 'finance', time: 'أمس، 11:45 م', user: 'النظام المالي' },
      { id: 'log-5', text: 'تم إسناد فهد المطيري للتحقق من سلامة الأجهزة الصوتية واللايتينج بفرع الرياض', category: 'logistics', time: 'أمس، 04:20 م', user: 'النظام الآلي' },
      { id: 'log-6', text: 'تم مراجعة وتدقيق رخصة البلدية المجددة بنجاح من قبل إدارة المنصة', category: 'system', time: 'قبل يومين، 02:10 م', user: 'الإدارة' }
    ];
  });

  const saveTimelineLogs = (nextLogs: any[]) => {
    setTimelineLogs(nextLogs);
    localStorage.setItem(`provider_timeline_logs_${currentProviderName}`, JSON.stringify(nextLogs));
  };

  // Staff Assignment state
  const STAFF_ROLES: Record<string, string[]> = {
    booking: ['Branch Manager', 'Reception', 'Supervisor'],
    order: ['Photography Team', 'Catering Team', 'Decor Team'],
    venue: ['Cleaning Team', 'Maintenance Team']
  };

  const PROVIDER_STAFF = [
    { id: 'st-1', name: 'خالد الرويلي', role: 'مشرف تجهيز' },
    { id: 'st-2', name: 'أحمد السالم', role: 'منسق ضيافة' },
    { id: 'st-3', name: 'سارة العتيبي', role: 'مشرفة استقبال وقاعات' },
    { id: 'st-4', name: 'فهد المطيري', role: 'مهندس صوت وإضاءة' },
  ];

  const [assignedStaff, setAssignedStaff] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(`provider_assigned_staff_${currentProviderName}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const saveAssignedStaff = (newStaff: typeof assignedStaff) => {
    setAssignedStaff(newStaff);
    localStorage.setItem(`provider_assigned_staff_${currentProviderName}`, JSON.stringify(newStaff));
  };

  const [checklists, setChecklists] = useState<Record<string, { clean: boolean; food: boolean; sound: boolean; photo: boolean }>>(() => {
    try {
      const stored = localStorage.getItem(`provider_checklists_${currentProviderName}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const saveChecklists = (newChecklists: typeof checklists) => {
    setChecklists(newChecklists);
    localStorage.setItem(`provider_checklists_${currentProviderName}`, JSON.stringify(newChecklists));
  };

  const [serviceStatuses, setServiceStatuses] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem(`provider_service_statuses_${currentProviderName}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const saveServiceStatuses = (newStatuses: typeof serviceStatuses) => {
    setServiceStatuses(newStatuses);
    localStorage.setItem(`provider_service_statuses_${currentProviderName}`, JSON.stringify(newStatuses));
  };

  // Custom Tasks State
  const [customTasks, setCustomTasks] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`provider_custom_tasks_list_${currentProviderName}`);
      return stored ? JSON.parse(stored) : [
        { id: 'task-101', title: 'تنظيف وتلميع الثريات الكريستالية قبل الحفل', category: 'venue', assignedRole: 'Cleaning Team', status: 'pending', date: '2026-07-22' },
        { id: 'task-102', title: 'تأمين تغطية تصوير إضافية لمدخل النساء والزفة', category: 'order', assignedRole: 'Photography Team', status: 'completed', date: '2026-07-22' },
        { id: 'task-103', title: 'التشغيل الفني والتأكد من هندسة الصوت واللايتينج', category: 'booking', assignedRole: 'Supervisor', status: 'pending', date: '2026-07-23' }
      ];
    } catch {
      return [];
    }
  });

  const saveCustomTasks = (next: any[]) => {
    setCustomTasks(next);
    localStorage.setItem(`provider_custom_tasks_list_${currentProviderName}`, JSON.stringify(next));
  };

  // Task form inputs
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<'booking' | 'order' | 'venue'>('venue');
  const [newTaskRole, setNewTaskRole] = useState('Cleaning Team');
  const [newTaskDate, setNewTaskDate] = useState('2026-07-22');

  // Financial Settle state
  const [withdrawingAmount, setWithdrawingAmount] = useState('');
  const [withdrawIban, setWithdrawIban] = useState('');
  const [withdrawHolder, setWithdrawHolder] = useState('');
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`provider_withdrawals_${currentProviderName}`);
      return stored ? JSON.parse(stored) : [
        { id: 'W-01', amount: 15000, iban: 'SA1234567890123456789012', status: 'مقبول', date: '2026-06-15' },
        { id: 'W-02', amount: 8000, iban: 'SA1234567890123456789012', status: 'مقبول', date: '2026-07-02' }
      ];
    } catch {
      return [];
    }
  });

  const saveWithdrawalRequests = (newRequests: any[]) => {
    setWithdrawalRequests(newRequests);
    localStorage.setItem(`provider_withdrawals_${currentProviderName}`, JSON.stringify(newRequests));
  };

  const [activeInvoice, setActiveInvoice] = useState<any>(null);

  // New Timeline Logger inputs
  const [newLogText, setNewLogText] = useState('');
  const [newLogCategory, setNewLogCategory] = useState<'logistics' | 'finance' | 'system'>('logistics');

  const formatCurrency = (val: number) => typeof val === 'number' ? `${val.toLocaleString('ar-SA')} ر.س` : (val || '0 ر.س');

  // Handlers
  const handleAddLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) {
      showNotification('warning', 'الرجاء كتابة نص الحدث اللوجستي قبل التسجيل.');
      return;
    }
    const logId = `log-${Date.now()}`;
    const newLog = {
      id: logId,
      text: newLogText,
      category: newLogCategory,
      time: 'الآن',
      user: currentUserName || 'المزود'
    };
    saveTimelineLogs([newLog, ...timelineLogs]);
    setNewLogText('');
    showNotification('success', 'تم تسجيل الحدث التشغيلي الجديد بنجاح في خط الزمن.');
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) {
      showNotification('warning', 'الرجاء إدخال وصف المهمة.');
      return;
    }
    const taskId = `task-${Date.now()}`;
    const newTask = {
      id: taskId,
      title: newTaskTitle,
      category: newTaskCategory,
      assignedRole: newTaskRole,
      status: 'pending',
      date: newTaskDate
    };
    saveCustomTasks([newTask, ...customTasks]);
    setNewTaskTitle('');
    showNotification('success', 'تم إنشاء المهمة اللوجستية وإسنادها لجروب العمل بنجاح.');

    // Auto prepend to log
    const newLog = {
      id: `log-task-${Date.now()}`,
      text: `تم إنشاء مهمة جديدة: "${newTaskTitle}" وإسنادها إلى ${newTaskRole}`,
      category: 'logistics',
      time: 'الآن',
      user: currentUserName || 'المزود'
    };
    saveTimelineLogs([newLog, ...timelineLogs]);
  };

  const handleToggleTask = (taskId: string) => {
    const next = customTasks.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === 'completed' ? 'pending' : 'completed';
        if (nextStatus === 'completed') {
          showNotification('success', 'تم إنجاز المهمة بنجاح وتأكيد انتهاء العمل عليها.');
        }
        return { ...t, status: nextStatus };
      }
      return t;
    });
    saveCustomTasks(next);
  };

  const handleDeleteTask = (taskId: string) => {
    const next = customTasks.filter(t => t.id !== taskId);
    saveCustomTasks(next);
    showNotification('info', 'تم حذف المهمة بنجاح.');
  };

  // Pipeline Filter Counts
  const todayDateStr = '2026-07-22';
  const myTodayEvents = localBookings.filter(b => {
    const bDate = (b.date || b.createdAt || '').split('T')[0];
    return bDate === todayDateStr && (b.status === 'مقبول' || b.status === 'نشط' || !b.status);
  });
  
  const myIndependentRequests = localSupportRequests.filter(r => !r.bookingId);
  const myPendingBookings = localBookings.filter(b => b.status === 'معلق' || b.status === 'بانتظار الموافقة');
  
  const myPendingExecutionServices = localSupportRequests.filter(r => {
    const status = serviceStatuses[r.id] || r.status || 'طلب جديد';
    return status !== 'مكتمل';
  });

  const totalEscrowAmount = localBookings.reduce((sum, b) => sum + (b.amount || b.price || b.totalPrice || 0) * 0.85, 0);

  // Search filter
  const applySearch = (items: any[], fields: string[]) => {
    if (!opsSearchQuery) return items;
    return items.filter(item => {
      return fields.some(field => {
        const val = item[field];
        return val && String(val).toLowerCase().includes(opsSearchQuery.toLowerCase());
      });
    });
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Ops Header Sub-tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm gap-4">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
          <button
            onClick={() => setOpsActiveTab('live')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 ${
              opsActiveTab === 'live' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Activity className="w-4 h-4 text-indigo-500" />
            العمليات النشطة اليوم
          </button>
          <button
            onClick={() => setOpsActiveTab('calendar')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 ${
              opsActiveTab === 'calendar' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-600" />
            تقويم الفعاليات
          </button>
          <button
            onClick={() => setOpsActiveTab('tasks')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 ${
              opsActiveTab === 'tasks' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-amber-500" />
            المهام وإسناد الموظفين
          </button>
          <button
            onClick={() => setOpsActiveTab('timeline')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap shrink-0 ${
              opsActiveTab === 'timeline' 
                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-emerald-500" />
            سجل العمليات (Timeline)
          </button>
        </div>

        {/* Quick Search */}
        <div className="relative w-full md:w-72 shrink-0">
          <Search className="absolute right-3.5 top-2.5 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="البحث التشغيلي السريع..."
            value={opsSearchQuery}
            onChange={(e) => setOpsSearchQuery(e.target.value)}
            className="w-full text-xs font-bold text-right pr-10 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
        </div>
      </div>

      {/* ==================== TAB 1: LIVE OPERATIONS ==================== */}
      {opsActiveTab === 'live' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-indigo-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-sm">
            <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 bg-indigo-500/20 text-indigo-200 px-3 py-1 rounded-full text-[10px] font-black">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  شاشة العمليات والتشغيل المباشر اليومية
                </div>
                <h3 className="text-xl font-black">مركز العمليات النشطة اليوم - {todayDateStr}</h3>
                <p className="text-xs text-indigo-200/90 max-w-2xl leading-relaxed">
                  احصل على نظرة شمولية سريعة لجميع أنشطة اليوم. تنقل بين طبقات العمليات المترابطة بالتسلسل اللوجستي الميداني للموقع والخدمات، لضمان أعلى مستوى من الجودة والتحضير.
                </p>
              </div>
              <div className="bg-white/10 p-3.5 rounded-2xl text-right backdrop-blur-sm border border-white/10 shrink-0">
                <span className="text-[10px] text-indigo-200 font-bold block">إجمالي الضمان المالي بالمنصة</span>
                <span className="text-xl font-mono font-black text-emerald-300">{formatCurrency(totalEscrowAmount)}</span>
              </div>
            </div>
          </div>

          {/* Interactive Pipeline Nodes (Replacing Table) */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { id: 'events', count: myTodayEvents.length, label: 'مناسبات اليوم', color: 'indigo', icon: Activity, desc: 'حفلات نشطة مجهزة' },
              { id: 'independent', count: myIndependentRequests.length, label: 'طلبات مستقلة', color: 'purple', icon: Box, desc: 'خدمات إضافية مباشرة' },
              { id: 'pending', count: myPendingBookings.length, label: 'تحتاج تأكيد فوري', color: 'amber', icon: AlertTriangle, desc: 'حجوزات بانتظار الموافقة' },
              { id: 'support', count: myPendingExecutionServices.length, label: 'بانتظار التنفيذ', color: 'rose', icon: CheckSquare, desc: 'خدمات تكميلية لم تنتهِ' },
              { id: 'payouts', count: withdrawalRequests.filter(r => r.status === 'معلق').length || 1, label: 'تسوية جاهزة', color: 'emerald', icon: Wallet, desc: 'مستحقات وأرصدة متاحة' },
            ].map((node, idx) => {
              const Icon = node.icon;
              const isActive = selectedPipelineNode === node.id;
              
              const borderColors: Record<string, string> = {
                indigo: 'border-indigo-200 hover:border-indigo-400',
                purple: 'border-purple-200 hover:border-purple-400',
                amber: 'border-amber-200 hover:border-amber-400',
                rose: 'border-rose-200 hover:border-rose-400',
                emerald: 'border-emerald-200 hover:border-emerald-400'
              };

              const bgColors: Record<string, string> = {
                indigo: 'bg-indigo-50 text-indigo-700',
                purple: 'bg-purple-50 text-purple-700',
                amber: 'bg-amber-50 text-amber-700',
                rose: 'bg-rose-50 text-rose-700',
                emerald: 'bg-emerald-50 text-emerald-700'
              };

              return (
                <button
                  key={node.id}
                  onClick={() => setSelectedPipelineNode(node.id as any)}
                  className={`relative p-4 rounded-2xl border text-right transition-all flex flex-col justify-between h-28 cursor-pointer ${
                    isActive 
                      ? 'bg-white border-2 border-indigo-600 shadow-md scale-102 z-10' 
                      : 'bg-white shadow-xs ' + borderColors[node.color]
                  }`}
                >
                  <div className="flex justify-between items-start w-full">
                    <span className={`w-8 h-8 rounded-xl flex items-center justify-center ${bgColors[node.color]}`}>
                      <Icon className="w-4 h-4 stroke-[2.5]" />
                    </span>
                    <span className="text-xl font-black font-mono text-slate-800">{node.count}</span>
                  </div>
                  <div>
                    <span className="text-xs font-black text-slate-800 block">{node.label}</span>
                    <span className="text-[9px] text-slate-400 font-bold block mt-0.5">{node.desc}</span>
                  </div>
                  
                  {/* Visual Connection Arrow */}
                  {idx < 4 && (
                    <div className="hidden md:flex absolute -left-2.5 top-1/2 -translate-y-1/2 z-20 bg-white border border-slate-100 rounded-full w-5 h-5 items-center justify-center shadow-xs">
                      <span className="text-slate-400 text-[10px] font-bold">←</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Pipeline Details Card */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-100 mb-6">
              <h4 className="text-sm font-black text-indigo-950 flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                تفاصيل القائمة النشطة: {
                  selectedPipelineNode === 'events' ? 'مناسبات اليوم الفعالة ومؤشرات القاعات' :
                  selectedPipelineNode === 'independent' ? 'طلبات مبيعات الخدمات المستقلة' :
                  selectedPipelineNode === 'pending' ? 'الحجوزات المعلقة بانتظار القرار' :
                  selectedPipelineNode === 'support' ? 'الخدمات المساندة الجاري تجهيزها' :
                  'المركز المالي، المحفظة ومستحقات السحب'
                }
              </h4>
              <span className="text-xs text-slate-400 font-bold">تحديث فوري تلقائي</span>
            </div>

            {/* Sub-View Content */}
            {selectedPipelineNode === 'events' && (
              <div className="grid grid-cols-1 gap-6">
                {applySearch(myTodayEvents, ['hall', 'customerName', 'id']).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold">لا توجد مناسبات نشطة اليوم تطابق معايير البحث والفلترة.</div>
                ) : (
                  applySearch(myTodayEvents, ['hall', 'customerName', 'id']).map((b) => {
                    const cl = checklists[b.id] || { clean: false, food: false, sound: false, photo: false };
                    const progress = (cl.clean ? 1 : 0) + (cl.food ? 1 : 0) + (cl.sound ? 1 : 0) + (cl.photo ? 1 : 0);
                    const currentStaffName = assignedStaff[b.id] || '';

                    const toggleChecklistItem = (bookingId: string, item: 'clean' | 'food' | 'sound' | 'photo') => {
                      const nextItem = { ...cl, [item]: !cl[item] };
                      const updated = { ...checklists, [bookingId]: nextItem };
                      saveChecklists(updated);
                      showNotification('success', 'تم تحديث حالة المهمة اللوجستية للقاعة بنجاح.');
                    };

                    return (
                      <div key={b.id} className="bg-slate-50/60 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all p-5 flex flex-col md:flex-row gap-6 divide-y md:divide-y-0 md:divide-x md:divide-x-reverse divide-slate-100 text-right">
                        
                        {/* Event details */}
                        <div className="md:w-1/3 space-y-4 flex flex-col justify-between">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-black">
                                {formatBkgId(b.id)}
                              </span>
                              <span className="text-[10px] font-bold text-slate-400 font-mono">
                                {b.date || b.createdAt}
                              </span>
                            </div>
                            <h4 className="text-sm font-black text-slate-800">{b.hall}</h4>
                            <p className="text-xs text-slate-500 font-bold">
                              العميل: <span className="text-slate-800 font-black">{b.customerName}</span> <span className="text-[10px] font-mono">({b.customerPhone})</span>
                            </p>
                          </div>

                          {/* Supervisor Assignment (Part of Staff Assignment Engine) */}
                          <div className="space-y-2 pt-3 border-t border-slate-100">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-bold text-slate-400">المشرف الميداني المخصص:</span>
                              <span className="text-[11px] font-black text-indigo-600">
                                {currentStaffName ? currentStaffName : 'بانتظار التعيين'}
                              </span>
                            </div>
                            <select
                              value={currentStaffName}
                              onChange={(e) => {
                                const nextStaff = { ...assignedStaff, [b.id]: e.target.value };
                                saveAssignedStaff(nextStaff);
                                showNotification('success', `تم إسناد الإشراف الميداني للمشرف: ${e.target.value}`);
                              }}
                              className="w-full text-xs font-bold text-right p-2.5 border border-slate-200 rounded-xl focus:border-indigo-500 outline-none bg-white"
                            >
                              <option value="">-- اختر المشرف الميداني --</option>
                              {PROVIDER_STAFF.map(st => (
                                <option key={st.id} value={st.name}>{st.name} ({st.role})</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        {/* Checklist preparation */}
                        <div className="md:w-2/3 flex flex-col justify-between space-y-4 pt-4 md:pt-0 md:pr-6">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black text-slate-400">نسبة جاهزية اللوجستيات:</span>
                              <span className="text-xs font-black text-slate-800">{Math.round((progress / 4) * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-300" 
                                style={{ width: `${(progress / 4) * 100}%` }}
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              onClick={() => toggleChecklistItem(b.id, 'clean')}
                              className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                                cl.clean 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-extrabold' 
                                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <span className="text-xs">نظافة وتجهيز القاعة</span>
                              <Sparkles className={`w-4 h-4 ${cl.clean ? 'text-emerald-500' : 'text-slate-300'}`} />
                            </button>

                            <button
                              onClick={() => toggleChecklistItem(b.id, 'food')}
                              className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                                cl.food 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-extrabold' 
                                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <span className="text-xs">خدمات الضيافة والتغذية</span>
                              <Coffee className={`w-4 h-4 ${cl.food ? 'text-emerald-500' : 'text-slate-300'}`} />
                            </button>

                            <button
                              onClick={() => toggleChecklistItem(b.id, 'sound')}
                              className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                                cl.sound 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-extrabold' 
                                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <span className="text-xs">أنظمة الصوت والإضاءة</span>
                              <Activity className={`w-4 h-4 ${cl.sound ? 'text-emerald-500' : 'text-slate-300'}`} />
                            </button>

                            <button
                              onClick={() => toggleChecklistItem(b.id, 'photo')}
                              className={`p-3 rounded-xl border text-right transition-all flex items-center justify-between ${
                                cl.photo 
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800 font-extrabold' 
                                  : 'bg-white border-slate-100 text-slate-500 hover:border-slate-200'
                              }`}
                            >
                              <span className="text-xs">التنسيق والتوثيق والكوشة</span>
                              <Eye className={`w-4 h-4 ${cl.photo ? 'text-emerald-500' : 'text-slate-300'}`} />
                            </button>
                          </div>

                          <div className="flex justify-between items-center pt-3 border-t border-slate-100 text-xs">
                            <span className="text-slate-400 font-bold">الضريبة الصافية: <span className="font-mono text-slate-800 font-black">{formatCurrency(b.amount || b.price || b.totalPrice)}</span></span>
                            <button
                              onClick={() => setActiveInvoice(b)}
                              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black transition-all flex items-center gap-1.5"
                            >
                              <FileText className="w-3 h-3 text-indigo-500" />
                              عرض الفاتورة الضريبية
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {selectedPipelineNode === 'independent' && (
              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-4 font-black">رقم الخدمة والبيان</th>
                      <th className="p-4 font-black">العميل والمستلم</th>
                      <th className="p-4 font-black">السعر الإجمالي</th>
                      <th className="p-4 font-black text-center">حالة التجهيز الميداني</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {applySearch(myIndependentRequests, ['serviceName', 'customerName', 'id']).length === 0 ? (
                      <tr>
                        <td colSpan={4} className="text-center p-8 text-slate-400 font-bold">لا توجد طلبات مستقلة تطابق معايير البحث حالياً.</td>
                      </tr>
                    ) : (
                      applySearch(myIndependentRequests, ['serviceName', 'customerName', 'id']).map((r) => {
                        const status = serviceStatuses[r.id] || r.status || 'طلب جديد';
                        return (
                          <tr key={r.id} className="hover:bg-slate-50/40 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <span className="font-black text-slate-800 block text-xs">{r.serviceName}</span>
                                <span className="text-[9px] font-mono text-indigo-600 bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 rounded font-black">SRV-26-0000000{r.id}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 block mt-0.5">{r.category || 'تجهيزات مساندة'}</span>
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-700 block">{r.customerName}</span>
                              <span className="text-[10px] text-slate-400 block font-mono">{r.customerPhone}</span>
                            </td>
                            <td className="p-4 font-mono font-bold text-slate-800">
                              {formatCurrency(r.price || r.amount)}
                            </td>
                            <td className="p-4">
                              <div className="flex items-center justify-center gap-1">
                                {['طلب جديد', 'قيد التجهيز', 'جاهز للتوصيل', 'مكتمل'].map((st) => (
                                  <button
                                    key={st}
                                    onClick={() => {
                                      const updated = { ...serviceStatuses, [r.id]: st };
                                      saveServiceStatuses(updated);
                                      showNotification('success', `تم تحديث حالة طلب الخدمة المساندة إلى (${st}) بنجاح.`);
                                    }}
                                    className={`px-2 py-1 rounded-lg text-[10px] font-black transition-all ${
                                      status === st 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                  >
                                    {st}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {selectedPipelineNode === 'pending' && (
              <div className="space-y-4">
                {applySearch(myPendingBookings, ['hall', 'customerName']).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold">لا توجد حجوزات معلقة بانتظار الموافقة في منشأتك حالياً.</div>
                ) : (
                  applySearch(myPendingBookings, ['hall', 'customerName']).map((b) => (
                    <div key={b.id} className="bg-amber-50/40 border border-amber-200 rounded-2xl p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-black text-amber-800 bg-amber-100/80 px-2.5 py-0.5 rounded-full">بانتظار تأكيدك اللوجستي والمالي</span>
                          <span className="text-[10px] text-slate-400 font-mono font-bold">{formatBkgId(b.id)}</span>
                        </div>
                        <h4 className="text-sm font-black text-slate-800">{b.hall}</h4>
                        <p className="text-xs text-slate-500">
                          العميل: <span className="font-bold text-slate-800">{b.customerName}</span> | تاريخ الحفل المقترح: <span className="font-mono text-indigo-700 font-black">{b.date || b.createdAt}</span>
                        </p>
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button
                          onClick={() => {
                            const updated = localBookings.map(bk => bk.id === b.id ? { ...bk, status: 'مقبول' } : bk);
                            saveBookings(updated);
                            showNotification('success', 'تم قبول وتأكيد حفل العميل بنجاح. تم إصدار الفاتورة الضريبية وحظر التواريخ المتداخلة.');
                          }}
                          className="flex-1 md:flex-none px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                          الموافقة وتأكيد الحجز
                        </button>
                        <button
                          onClick={() => {
                            const updated = localBookings.map(bk => bk.id === b.id ? { ...bk, status: 'مرفوض' } : bk);
                            saveBookings(updated);
                            showNotification('warning', 'تم رفض الطلب وإبلاغ العميل مع فك حظر التواريخ.');
                          }}
                          className="flex-1 md:flex-none px-4 py-2.5 bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                          رفض الطلب
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {selectedPipelineNode === 'support' && (
              <div className="space-y-4">
                {applySearch(myPendingExecutionServices, ['serviceName', 'customerName']).length === 0 ? (
                  <div className="text-center py-12 text-slate-400 font-bold">جميع الخدمات المساندة والطلبات مكتملة ومسلمة بنجاح!</div>
                ) : (
                  applySearch(myPendingExecutionServices, ['serviceName', 'customerName']).map((r) => {
                    const status = serviceStatuses[r.id] || r.status || 'طلب جديد';
                    return (
                      <div key={r.id} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center text-right">
                        <div className="space-y-1">
                          <span className="text-xs font-black text-slate-800 block">{r.serviceName}</span>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            العميل: {r.customerName} • الجوال: <span className="font-mono">{r.customerPhone}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            status === 'مكتمل' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                          }`}>
                            {status}
                          </span>
                          <button
                            onClick={() => {
                              const updated = { ...serviceStatuses, [r.id]: 'مكتمل' };
                              saveServiceStatuses(updated);
                              showNotification('success', 'تم تحديث الخدمة لـ (مكتمل). تم إخطار العميل فورياً.');
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[10px] font-black cursor-pointer"
                          >
                            تعيين كمكتمل ✓
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {selectedPipelineNode === 'payouts' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Financial Wallet cards */}
                  <div className="lg:col-span-1 space-y-4">
                    <div className="bg-indigo-50/40 p-5 rounded-2xl border border-indigo-100 space-y-2 text-right">
                      <div className="w-10 h-10 bg-indigo-500 text-white rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-indigo-900 font-black block">إجمالي الضمان المالي الموقوف (Split-Escrow)</span>
                      <h4 className="text-xl font-black text-slate-800 font-mono">{formatCurrency(totalEscrowAmount)}</h4>
                      <p className="text-[9px] text-indigo-700/80 font-bold leading-normal">
                        يحتجز هذا الرصيد بالضمان كأمان للعملاء، ويتحرر تلقائياً فور انتهاء وتأكيد مناسباتهم.
                      </p>
                    </div>

                    <div className="bg-emerald-50/50 p-5 rounded-2xl border border-emerald-100 space-y-2 text-right">
                      <div className="w-10 h-10 bg-emerald-500 text-white rounded-xl flex items-center justify-center">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] text-emerald-900 font-black block">الرصيد المتاح للسحب المباشر الفوري</span>
                      <h4 className="text-xl font-black text-emerald-700 font-mono">
                        {formatCurrency(24500 - withdrawalRequests.reduce((sum, r) => r.status === 'مقبول' || r.status === 'معلق' ? sum + r.amount : sum, 0))}
                      </h4>
                      <p className="text-[9px] text-emerald-800/80 font-bold leading-normal">
                        متاح للترحيل التلقائي المباشر للآيبان البنكي لشركتكم.
                      </p>
                    </div>
                  </div>

                  {/* Transfer Form */}
                  <div className="lg:col-span-2 bg-slate-50/60 p-5 rounded-2xl border border-slate-100 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-black text-slate-800">طلب سحب وتسوية أرباح فورية لحسابكم</h4>
                      <p className="text-[10px] text-slate-400 mt-1 font-bold">تتم تسوية وسداد الحوالات البنكية بحد أقصى ٢٤ ساعة عمل.</p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 text-right">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">المبلغ المطلوب سحبه (ر.س):</label>
                          <input
                            type="number"
                            placeholder="مثال: 5000"
                            value={withdrawingAmount}
                            onChange={(e) => setWithdrawingAmount(e.target.value)}
                            className="w-full text-xs font-bold text-right p-2.5 border border-slate-200 rounded-xl bg-white focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-bold text-slate-400">اسم المستفيد بالكامل:</label>
                          <input
                            type="text"
                            placeholder="مؤسسة الفخامة لتجهيز الحفلات"
                            value={withdrawHolder}
                            onChange={(e) => setWithdrawHolder(e.target.value)}
                            className="w-full text-xs font-bold text-right p-2.5 border border-slate-200 rounded-xl bg-white focus:border-indigo-500 outline-none"
                          />
                        </div>
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400">رقم الحساب البنكي الآيبان (IBAN):</label>
                          <input
                            type="text"
                            placeholder="SAxx xxxx xxxx xxxx"
                            value={withdrawIban}
                            onChange={(e) => setWithdrawIban(e.target.value)}
                            className="w-full text-xs font-bold text-left p-2.5 border border-slate-200 rounded-xl bg-white focus:border-indigo-500 outline-none"
                            dir="ltr"
                          />
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const amt = parseFloat(withdrawingAmount);
                        const available = 24500 - withdrawalRequests.reduce((sum, r) => r.status === 'مقبول' || r.status === 'معلق' ? sum + r.amount : sum, 0);
                        if (!amt || amt <= 0) {
                          showNotification('error', 'الرجاء إدخال مبلغ تحويل صحيح أكبر من الصفر.');
                          return;
                        }
                        if (amt > available) {
                          showNotification('error', 'عذراً! لا يمكن سحب مبلغ يتجاوز الرصيد الحالي المتاح.');
                          return;
                        }
                        if (!withdrawIban.toLowerCase().startsWith('sa') || withdrawIban.length < 15) {
                          showNotification('error', 'الرجاء إدخال رقم آيبان سعودي صحيح يبدأ بـ SA.');
                          return;
                        }
                        const newReq = {
                          id: `W-0${withdrawalRequests.length + 1}`,
                          amount: amt,
                          iban: withdrawIban,
                          status: 'معلق',
                          date: new Date().toISOString().split('T')[0]
                        };
                        saveWithdrawalRequests([newReq, ...withdrawalRequests]);
                        setWithdrawingAmount('');
                        showNotification('success', 'تم استلام طلب تسوية الأرباح وإرساله للتكامل البنكي الفوري بنجاح.');
                      }}
                      className="mt-5 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" /> تأكيد طلب السداد وإصدار الحوالة البنكية
                    </button>
                  </div>
                </div>

                {/* Withdrawal log ledger */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black text-slate-800">سجل المعاملات ودفتر التحويلات المالية للمؤسسة</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                        <tr>
                          <th className="p-3 font-bold">رقم المعاملة</th>
                          <th className="p-3 font-bold">المبلغ المستلم</th>
                          <th className="p-3 font-bold">الآيبان المحول له</th>
                          <th className="p-3 font-bold">التاريخ</th>
                          <th className="p-3 font-bold">حالة الحوالة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {withdrawalRequests.map((req) => (
                          <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                            <td className="p-3 font-mono text-slate-400 font-bold">REV-26-0000000{req.id}</td>
                            <td className="p-3 font-mono font-bold text-slate-800">{formatCurrency(req.amount)}</td>
                            <td className="p-3 font-mono text-slate-500">{req.iban}</td>
                            <td className="p-3 font-mono text-slate-400">{req.date}</td>
                            <td className="p-3">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black border ${req.status === 'مقبول' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                                <span className={`w-1 h-1 rounded-full ${req.status === 'مقبول' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                {req.status === 'مقبول' ? 'تم تحويل المستحقات' : 'قيد التدقيق والتحويل'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ==================== TAB 2: INTERACTIVE CALENDAR ==================== */}
      {opsActiveTab === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar Day Grid */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-50">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    if (calendarMonth === 1) {
                      setCalendarMonth(12);
                      setCalendarYear(calendarYear - 1);
                    } else {
                      setCalendarMonth(calendarMonth - 1);
                    }
                  }}
                  className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <span className="text-xs font-black text-slate-800 font-mono">
                  {calendarMonth === 7 ? 'يوليو' : calendarMonth === 8 ? 'أغسطس' : calendarMonth === 6 ? 'يونيو' : 'شهر ' + calendarMonth} {calendarYear}
                </span>
                <button 
                  onClick={() => {
                    if (calendarMonth === 12) {
                      setCalendarMonth(1);
                      setCalendarYear(calendarYear + 1);
                    } else {
                      setCalendarMonth(calendarMonth + 1);
                    }
                  }}
                  className="p-2 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
              <h3 className="text-sm font-black text-slate-800">أجندة مناسبات قاعاتك</h3>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 pb-2 border-b border-slate-100">
              <span>أحد</span>
              <span>إثنين</span>
              <span>ثلاثاء</span>
              <span>أربعاء</span>
              <span>خميس</span>
              <span>جمعة</span>
              <span>سبت</span>
            </div>

            <div className="grid grid-cols-7 gap-2">
              {/* Dummy padding days for July 2026 starting on Wednesday (3 dummy days) */}
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={`empty-${i}`} className="h-14 bg-slate-50/40 rounded-xl"></div>
              ))}

              {Array.from({ length: 31 }).map((_, i) => {
                const dayNum = i + 1;
                const formattedDay = dayNum < 10 ? `0${dayNum}` : `${dayNum}`;
                const dateStr = `${calendarYear}-0${calendarMonth}-${formattedDay}`;
                
                // Check if there is an event today
                const hasEvent = localBookings.some(b => (b.date || '').split('T')[0] === dateStr);
                const hasCustomTask = customTasks.some(t => t.date === dateStr);
                const isSelected = selectedCalendarDate === dateStr;

                return (
                  <button
                    key={`day-${dayNum}`}
                    onClick={() => setSelectedCalendarDate(dateStr)}
                    className={`h-14 rounded-2xl flex flex-col justify-between p-2 text-right transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                        : 'bg-white border-slate-100 hover:border-indigo-200 text-slate-700'
                    }`}
                  >
                    <span className="text-xs font-black font-mono">{dayNum}</span>
                    <div className="flex gap-1.5 justify-end">
                      {hasEvent && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-emerald-300' : 'bg-indigo-600'}`} />
                      )}
                      {hasCustomTask && (
                        <span className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-amber-300' : 'bg-amber-500'}`} />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Details Side Block */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col justify-between">
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[10px] text-slate-400 font-bold block">التاريخ المختار بالأجندة</span>
                <h4 className="text-sm font-black text-slate-800 font-mono mt-0.5">{selectedCalendarDate}</h4>
              </div>

              {/* Scheduled Events details */}
              <div className="space-y-3">
                <span className="text-[10px] text-slate-400 font-black block">الحفلات والمهام المجدولة اليوم:</span>

                {(() => {
                  const eventsOnDay = localBookings.filter(b => (b.date || '').split('T')[0] === selectedCalendarDate);
                  const tasksOnDay = customTasks.filter(t => t.date === selectedCalendarDate);

                  if (eventsOnDay.length === 0 && tasksOnDay.length === 0) {
                    return (
                      <div className="text-center py-8 text-slate-400 font-bold text-xs space-y-2">
                        <Inbox className="w-8 h-8 text-slate-300 mx-auto" />
                        <p>لا توجد مناسبات أو مهام لوجستية مجدولة لتاريخ هذا اليوم.</p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                      {eventsOnDay.map((e) => (
                        <div key={e.id} className="p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl space-y-1">
                          <span className="text-[9px] bg-indigo-100 text-indigo-700 px-1.5 py-0.2 rounded font-black">حفل زفاف</span>
                          <h5 className="text-xs font-black text-slate-800">{e.hall}</h5>
                          <p className="text-[10px] text-slate-400 font-bold">العميل: {e.customerName}</p>
                        </div>
                      ))}
                      {tasksOnDay.map((t) => (
                        <div key={t.id} className="p-3 bg-amber-50/50 border border-amber-100 rounded-xl space-y-1">
                          <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.2 rounded font-black">مهمة عمل: {t.assignedRole}</span>
                          <h5 className="text-xs font-bold text-slate-800">{t.title}</h5>
                          <p className="text-[10px] text-slate-400 font-bold">الحالة: {t.status === 'completed' ? 'منتهية' : 'قيد العمل'}</p>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            </div>

            <button
              onClick={() => {
                setOpsActiveTab('tasks');
                setNewTaskDate(selectedCalendarDate);
                showNotification('info', `تم ضبط تاريخ المهمة الجديدة ليكون ${selectedCalendarDate}`);
              }}
              className="mt-6 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" /> جدولة مهمة جديدة لهذا اليوم
            </button>
          </div>
        </div>
      )}

      {/* ==================== TAB 3: TASKS & STAFF ASSIGNMENT ENGINE ==================== */}
      {opsActiveTab === 'tasks' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Staff Assignment list */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-800">محرك توزيع العمل وإسناد فرق الموظفين (Staff Assignment Engine)</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed font-bold">
                وزع العمل وسرّع وتيرة التحضير الميداني عبر إسناد فرق العمل والتخصصات المناسبة (Photography Team, Catering Team, Cleaning Team, Supervisor, etc.) للمهام اللوجستية النشطة.
              </p>
            </div>

            {/* List of active tasks needing assignment */}
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <span className="text-xs font-black text-indigo-950">قائمة المهام اللوجستية المستمرة</span>
                <span className="text-[10px] font-mono font-bold text-slate-400">العدد الكلي: {customTasks.length}</span>
              </div>

              {applySearch(customTasks, ['title', 'assignedRole']).length === 0 ? (
                <div className="text-center py-12 text-slate-400 font-bold">لا توجد مهام نشطة تطابق معايير البحث.</div>
              ) : (
                applySearch(customTasks, ['title', 'assignedRole']).map((task) => (
                  <div 
                    key={task.id} 
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${
                      task.status === 'completed' 
                        ? 'bg-slate-50/70 border-slate-100 opacity-70' 
                        : 'bg-white border-slate-100 hover:border-indigo-100'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                          task.category === 'booking' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          task.category === 'order' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                          'bg-amber-50 text-amber-700 border border-amber-100'
                        }`}>
                          {task.category === 'booking' ? 'إدارة القاعة' : task.category === 'order' ? 'خدمات الضيافة' : 'تحضير المكان'}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold">مجدول لتاريخ: <span className="font-mono">{task.date}</span></span>
                      </div>
                      <h4 className={`text-xs font-black ${task.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-800'}`}>{task.title}</h4>
                      
                      {/* Interactive assigned role badge */}
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold">
                        <span>الفريق المسند:</span>
                        <span className="text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md font-black">
                          {task.assignedRole}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <button
                        onClick={() => handleToggleTask(task.id)}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                          task.status === 'completed'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        {task.status === 'completed' ? 'مكتملة ✓' : 'تحديد كمكتمل'}
                      </button>
                      <button
                        onClick={() => handleDeleteTask(task.id)}
                        className="p-2 border border-rose-100 text-rose-500 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Form to add new task & assign team */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col justify-between">
            <form onSubmit={handleAddTask} className="space-y-4">
              <div className="pb-2 border-b border-slate-50">
                <h3 className="text-xs font-black text-slate-800">إضافة مهمة لوجستية جديدة</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">أنشئ مهمة تحضيرية وأسندها فورياً لطاقم العمل المعين.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 block">وصف المهمة المطلوبة *</label>
                <input
                  type="text"
                  placeholder="مثال: تنظيف وتجهيز صالة المداخل الرئيسية"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full text-xs font-bold text-right p-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 block">التصنيف اللوجستي للمهمة</label>
                <select
                  value={newTaskCategory}
                  onChange={(e) => {
                    const nextCat = e.target.value as any;
                    setNewTaskCategory(nextCat);
                    setNewTaskRole(STAFF_ROLES[nextCat][0]);
                  }}
                  className="w-full text-xs font-bold text-right p-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none"
                >
                  <option value="venue">تحضير القاعة (Venue)</option>
                  <option value="order">طلبات الخدمات (Order)</option>
                  <option value="booking">إدارة الحجز (Booking)</option>
                </select>
              </div>

              {/* Assignment Selector mapped to STAFF_ROLES rules */}
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 block">الفريق أو التخصص المسند للمهمة</label>
                <select
                  value={newTaskRole}
                  onChange={(e) => setNewTaskRole(e.target.value)}
                  className="w-full text-xs font-bold text-right p-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none"
                >
                  {STAFF_ROLES[newTaskCategory].map(role => (
                    <option key={role} value={role}>{role}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 block">تاريخ التجهيز الميداني</label>
                <input
                  type="date"
                  value={newTaskDate}
                  onChange={(e) => setNewTaskDate(e.target.value)}
                  className="w-full text-xs font-mono font-bold text-center p-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer mt-4"
              >
                <Plus className="w-4 h-4" /> حفظ المهمة وتوزيع العمل
              </button>
            </form>

            {/* Quick staff directory widget */}
            <div className="pt-4 border-t border-slate-50 mt-6 text-right space-y-2">
              <span className="text-[10px] text-slate-400 font-black block">دليل موظفي منشأتك المتاحين الآن:</span>
              <div className="grid grid-cols-2 gap-2">
                {PROVIDER_STAFF.map(st => (
                  <div key={st.id} className="p-2 bg-slate-50 border border-slate-100 rounded-lg text-right">
                    <span className="text-[10px] font-black text-slate-700 block">{st.name}</span>
                    <span className="text-[9px] text-slate-400 font-bold block">{st.role}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==================== TAB 4: ACTIVITY TIMELINE ==================== */}
      {opsActiveTab === 'timeline' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Chronological timeline rendering */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-2 border-b border-slate-50">
              <h3 className="text-base font-black text-slate-800">خط الزمن اللوجستي والتشغيلي المباشر (Activity Timeline)</h3>
              
              {/* Category Filter */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                {['all', 'logistics', 'finance', 'system'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedTimelineCategory(cat as any)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all whitespace-nowrap cursor-pointer ${
                      selectedTimelineCategory === cat 
                        ? 'bg-white text-slate-800 shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {cat === 'all' ? 'الكل' : cat === 'logistics' ? 'اللوجستيات' : cat === 'finance' ? 'المالية' : 'النظام'}
                  </button>
                ))}
              </div>
            </div>

            {/* Timeline flow */}
            <div className="relative border-r border-indigo-100 pr-5 space-y-6 text-right">
              {timelineLogs
                .filter(l => selectedTimelineCategory === 'all' || l.category === selectedTimelineCategory)
                .map((log) => {
                  let badgeColor = 'bg-blue-50 text-blue-700 border-blue-100';
                  let iconBg = 'bg-indigo-50 text-indigo-600';
                  let displayCategory = 'لوجستيات';
                  
                  if (log.category === 'finance') {
                    badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-100';
                    iconBg = 'bg-emerald-50 text-emerald-600';
                    displayCategory = 'المالية';
                  } else if (log.category === 'system') {
                    badgeColor = 'bg-purple-50 text-purple-700 border-purple-100';
                    iconBg = 'bg-purple-50 text-purple-600';
                    displayCategory = 'النظام';
                  }

                  return (
                    <div key={log.id} className="relative space-y-1.5 group">
                      {/* Circular icon node indicator */}
                      <span className="absolute -right-[27px] top-1 w-3.5 h-3.5 rounded-full bg-indigo-600 border-2 border-white shadow-xs group-hover:scale-110 transition-transform" />
                      
                      <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold">
                        <span className="font-mono">{log.time}</span>
                        <div className="flex items-center gap-1.5">
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black border ${badgeColor}`}>
                            {displayCategory}
                          </span>
                          <span className="text-slate-500">بواسطة: {log.user || 'المشرف'}</span>
                        </div>
                      </div>
                      <p className="text-xs font-black text-slate-700 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-50/80">
                        {log.text}
                      </p>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Custom Operations Logger form */}
          <div className="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right flex flex-col justify-between">
            <form onSubmit={handleAddLog} className="space-y-4">
              <div className="pb-2 border-b border-slate-50">
                <h3 className="text-xs font-black text-slate-800">أداة تسجيل الأحداث اليدوية (Operations Logger)</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-bold">دوّن أحداث التجهيز الميداني المباشر لتُسجل فوراً في سجل تتبع جودة القاعة والمنصة.</p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 block">الحدث اللوجستي أو الملاحظة الميدانية *</label>
                <textarea
                  rows={4}
                  placeholder="مثال: تم الانتهاء من تشييد مسرح الكوشة وتوصيل الورد الطبيعي بنجاح."
                  value={newLogText}
                  onChange={(e) => setNewLogText(e.target.value)}
                  className="w-full text-xs font-bold text-right p-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none resize-none leading-relaxed"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 block">فئة التسجيل</label>
                <select
                  value={newLogCategory}
                  onChange={(e) => setNewLogCategory(e.target.value as any)}
                  className="w-full text-xs font-bold text-right p-3 border border-slate-200 rounded-xl bg-slate-50 focus:border-indigo-500 outline-none"
                >
                  <option value="logistics">لوجستيات وتجهيز (Logistics)</option>
                  <option value="finance">مدفوعات مالية ومصروفات (Finance)</option>
                  <option value="system">النظام والبلدية (System)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer mt-4"
              >
                <Plus className="w-4 h-4" /> تسجيل الحدث في خط الزمن المباشر
              </button>
            </form>

            {/* Simulated Live status panel */}
            <div className="pt-4 border-t border-slate-50 mt-6 space-y-2 text-right">
              <span className="text-[10px] text-slate-400 font-black block">مؤشر الفحص الذاتي للوائح البلدية والدفاع المدني:</span>
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center justify-between">
                <span className="text-[10px] font-black text-emerald-950">صالح ومعتمد (مطابق للمواصفات القياسية)</span>
                <Check className="w-4 h-4 text-emerald-500 stroke-[3]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Simplified Printable Invoice Modal */}
      {activeInvoice && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-right space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                <button 
                  onClick={() => setActiveInvoice(null)}
                  className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-all cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="text-right">
                  <h4 className="font-black text-slate-800 text-sm">الفاتورة الضريبية المبسطة</h4>
                  <p className="text-[10px] text-slate-400 font-bold font-mono">{formatInvoiceId(activeInvoice.id)}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block">رقم حجز ليلى:</span>
                  <span className="font-mono font-bold text-slate-800">{formatBkgId(activeInvoice.id)}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">تاريخ الإصدار:</span>
                  <span className="font-mono font-bold text-slate-800">{activeInvoice.date || activeInvoice.createdAt || '2026-07-21'}</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-slate-50">
                  <span className="text-slate-400 block">العميل المستفيد:</span>
                  <span className="font-bold text-slate-800 block">{activeInvoice.customerName}</span>
                  <span className="text-[10px] text-slate-400 block font-mono">{activeInvoice.customerPhone}</span>
                </div>
              </div>

              <div className="border border-slate-100 rounded-2xl overflow-hidden mt-4">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-3 font-bold">الوصف</th>
                      <th className="p-3 font-bold text-left">المبلغ الخاضع للضريبة</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-50">
                      <td className="p-3">
                        <span className="font-bold text-slate-800">{activeInvoice.hall}</span>
                        <span className="text-[10px] text-slate-400 block mt-0.5">حجز كامل شامل تجهيز الضيافة والموقع</span>
                      </td>
                      <td className="p-3 text-left font-mono font-bold text-slate-700">
                        {formatCurrency((activeInvoice.amount || activeInvoice.price || activeInvoice.totalPrice) * 0.85)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/40 text-slate-500 text-[11px]">
                      <td className="p-3">المجموع الفرعي (Subtotal):</td>
                      <td className="p-3 text-left font-mono">
                        {formatCurrency((activeInvoice.amount || activeInvoice.price || activeInvoice.totalPrice) * 0.85)}
                      </td>
                    </tr>
                    <tr className="bg-slate-50/40 text-slate-500 text-[11px] border-b border-slate-100">
                      <td className="p-3">ضريبة القيمة المضافة مبررة (VAT 15%):</td>
                      <td className="p-3 text-left font-mono">
                        {formatCurrency((activeInvoice.amount || activeInvoice.price || activeInvoice.totalPrice) * 0.15)}
                      </td>
                    </tr>
                    <tr className="bg-indigo-50/30 text-slate-900 font-extrabold">
                      <td className="p-3 text-sm text-indigo-900 font-black">الإجمالي الكلي (Total):</td>
                      <td className="p-3 text-left text-sm font-mono text-indigo-900 font-black">
                        {formatCurrency(activeInvoice.amount || activeInvoice.price || activeInvoice.totalPrice)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* ZATCA QR Compliant wrapper */}
              <div className="flex items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 mt-4">
                <div className="w-16 h-16 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0 p-1">
                  <div className="grid grid-cols-5 gap-0.5 w-full h-full opacity-80">
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-100"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                    <div className="bg-slate-900 rounded-sm"></div>
                  </div>
                </div>
                <div className="min-w-0 flex-1 text-right">
                  <span className="text-[10px] font-black text-slate-500 block">ZATCA QR Code compliant</span>
                  <span className="text-[9px] text-slate-400 block mt-1">تخضع الفاتورة لشروط هيئة الزكاة والضريبة والجمارك بالمملكة العربية السعودية لعام 2026 م.</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> طباعة إيصال الفاتورة
              </button>
              <button
                onClick={() => setActiveInvoice(null)}
                className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer"
              >
                إغلاق
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
