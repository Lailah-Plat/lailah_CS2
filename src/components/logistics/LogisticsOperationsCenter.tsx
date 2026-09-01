import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Truck,
  PackageCheck,
  Clock,
  MapPin,
  Users,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Plus,
  CheckCircle2,
  Calendar,
  Phone,
  MessageCircle,
  FileSpreadsheet,
  Layers,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  X,
  SlidersHorizontal,
  Compass,
  Check,
  Building,
  ClipboardCheck,
  Wrench,
  Camera,
  Music,
  Coffee,
  Info,
  DollarSign,
  Share2,
  Eye,
  RefreshCw,
  ExternalLink,
  Award,
  Zap,
  Lock,
  UserPlus,
  HelpCircle,
  QrCode,
  Crown
} from 'lucide-react';
import { formatServiceRequestId, formatBookingId } from '../../utils/idUtils';

export interface LogisticsItem {
  id: string;
  name: string;
  category: 'audio' | 'lighting' | 'hospitality' | 'decor' | 'photography' | 'other';
  quantity: number;
  unit: string;
  barcode?: string;
  status: 'in_warehouse' | 'checked_out' | 'on_site_verified' | 'returned_intact' | 'damage_reported';
  notes?: string;
  damageDetails?: {
    description: string;
    estimatedCost: number;
    responsibleParty: 'customer' | 'crew' | 'venue' | 'wear_tear';
    photoUrl?: string;
    loggedAt: string;
  };
}

export interface CrewMemberAssignment {
  roleTitle: string; // المشرف الميداني, فني صوتيات, فني إضاءة, صباب قهوة, مصور فوتوغرافي, سائق نقل
  name: string;
  phone?: string;
  isRegisteredStaff?: boolean;
  staffId?: string | number;
  avatar?: string;
  dutyStatus: 'assigned' | 'en_route' | 'on_site' | 'completed';
  checkInTime?: string;
}

export interface LogisticsDispatchTask {
  id: string;
  serviceRequestId?: number | string;
  bookingId?: number | string;
  serviceName: string;
  customerName: string;
  customerPhone?: string;
  venueName: string;
  venueCity: string;
  venueAddress?: string;
  eventDate: string; // YYYY-MM-DD
  eventStartTime: string; // HH:mm (e.g. 19:00)
  targetSetupTime: string; // HH:mm (e.g. 16:30)
  currentStage: 'packing' | 'dispatch' | 'staging' | 'ready_check' | 'live_exec' | 'teardown' | 'completed';
  stageTimestamps: {
    packingAt?: string;
    dispatchAt?: string;
    stagingAt?: string;
    readyCheckAt?: string;
    liveExecAt?: string;
    teardownAt?: string;
    completedAt?: string;
  };
  crew: CrewMemberAssignment[];
  equipment: LogisticsItem[];
  dressCodeUniform: string;
  specialInstructions?: string;
  etaMinutes?: number;
  distanceKm?: number;
  priority: 'normal' | 'high' | 'urgent';
  providerName: string;
  providerId?: string;
  createdAt: string;
}

interface LogisticsOperationsCenterProps {
  userRole: string;
  currentProviderName: string;
  currentProviderId?: string;
  currentUserName: string;
  providerSubscription?: any;
  supportServiceRequests?: any[];
  setSupportServiceRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  providerStaffList?: any[];
  setProviderStaffList?: React.Dispatch<React.SetStateAction<any[]>>;
  bookings?: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  formatCurrency?: (val: number) => string;
  setActiveTab?: (tab: string) => void;
  handleBuyStaffSlot?: (count: number) => void;
}

export const STAGES_FLOW = [
  { id: 'packing', label: '1. التجهيز والتحضير', shortLabel: 'التجهيز', icon: Layers, desc: 'تجهيز المعدات والأدوات بالمستودع' },
  { id: 'dispatch', label: '2. الانطلاق والنقل', shortLabel: 'الانطلاق', icon: Truck, desc: 'تحميل الشاحنات وانطلاق الفريق' },
  { id: 'staging', label: '3. الوصول والتركيب', shortLabel: 'التركيب', icon: Wrench, desc: 'الوصول للقاعة وتنسيق الموقع' },
  { id: 'ready_check', label: '4. فحص الجاهزية', shortLabel: 'الجاهزية', icon: ClipboardCheck, desc: 'فحص نهائي وتأكيد الجاهزية 100%' },
  { id: 'live_exec', label: '5. التشغيل الحي', shortLabel: 'التشغيل', icon: Sparkles, desc: 'بدء الفعالية وتقديم الخدمة المباشرة' },
  { id: 'teardown', label: '6. الفك والإخلاء', shortLabel: 'الإخلاء', icon: PackageCheck, desc: 'فك المعدات والجرد والعودة للمستودع' },
];

export const getLogisticsStorageKey = (providerName: string) => `LOGISTICS_DISPATCH_TASKS_V2_${(providerName || '').replace(/\s+/g, '_')}`;

export const getDefaultLogisticsTasks = (currentProviderName: string, currentProviderId?: string): LogisticsDispatchTask[] => {
  const today = new Date().toISOString().split('T')[0];
  return [
    {
      id: 'DSP-26-0000000001',
      serviceRequestId: 101,
      serviceName: 'بوفيه الضيافة الملكية المتكامل والقهوة العربية',
      customerName: 'الأستاذ عبد العزيز الشمري',
      customerPhone: '0551234567',
      venueName: 'قاعة اللؤلؤة الكبرى للمناسبات',
      venueCity: 'الرياض',
      venueAddress: 'طريق الملك فهد، حي النخيل',
      eventDate: today,
      eventStartTime: '19:30',
      targetSetupTime: '17:00',
      currentStage: 'staging',
      stageTimestamps: {
        packingAt: '14:30',
        dispatchAt: '15:15',
        stagingAt: '16:05'
      },
      crew: [
        { roleTitle: 'المشرف الميداني العام', name: 'أحمد السعيد', phone: '0541122334', isRegisteredStaff: true, dutyStatus: 'on_site', checkInTime: '16:05' },
        { roleTitle: 'كبير صبابي القهوة', name: 'سالم الدوسري', phone: '0559988776', isRegisteredStaff: false, dutyStatus: 'on_site', checkInTime: '16:10' },
        { roleTitle: 'طاقم الضيافة (4 أفراد)', name: 'طاقم النخبة 1', isRegisteredStaff: false, dutyStatus: 'on_site' },
        { roleTitle: 'سائق شاحنة التوريد', name: 'عمر القرني', phone: '0503344556', isRegisteredStaff: true, dutyStatus: 'on_site' }
      ],
      equipment: [
        { id: 'EQ-01', name: 'أطقم دلال القهوة التراثية المذهبة (12 دلة)', category: 'hospitality', quantity: 12, unit: 'حبة', barcode: 'BAR-DL-001', status: 'on_site_verified' },
        { id: 'EQ-02', name: 'فناجيل كريستال فاخرة وصواني تقديم', category: 'hospitality', quantity: 150, unit: 'حبة', status: 'on_site_verified' },
        { id: 'EQ-03', name: 'سخانات بوفيه ستانلس ستيل ملكية', category: 'hospitality', quantity: 8, unit: 'جهاز', status: 'on_site_verified' },
        { id: 'EQ-04', name: 'طاولات تقديم متحركة قابلة للطي', category: 'decor', quantity: 4, unit: 'طاولة', status: 'checked_out' }
      ],
      dressCodeUniform: 'الثوب السعودي الرسمي + السديري المذهب وشارة اللوجو المعتمدة',
      specialInstructions: 'التنسيق مع مشرف القاعة فور الوصول، وتقديم القهوة ابتداءً من الساعة 18:30 في مجلس الرجال.',
      etaMinutes: 0,
      distanceKm: 14.5,
      priority: 'urgent',
      providerName: currentProviderName,
      providerId: currentProviderId,
      createdAt: new Date().toISOString()
    },
    {
      id: 'DSP-26-0000000002',
      serviceRequestId: 102,
      serviceName: 'هندسة الإضاءة الذكية ومؤثرات الليزر والضباب',
      customerName: 'د. سارة الهاشم',
      customerPhone: '0507654321',
      venueName: 'قصر التاج الملكي',
      venueCity: 'الرياض',
      venueAddress: 'حي الملقا، شارع الأمير أنس',
      eventDate: today,
      eventStartTime: '20:30',
      targetSetupTime: '17:30',
      currentStage: 'dispatch',
      stageTimestamps: {
        packingAt: '15:00',
        dispatchAt: '16:20'
      },
      crew: [
        { roleTitle: 'مهندس الإضاءة والتحكم', name: 'م. فهد العنزي', phone: '0567788990', isRegisteredStaff: true, dutyStatus: 'en_route' },
        { roleTitle: 'فني تركيب أجهزة الليزر', name: 'خالد المطيري', phone: '0533344112', isRegisteredStaff: false, dutyStatus: 'en_route' },
        { roleTitle: 'مساعد فني', name: 'طارق الزهراني', isRegisteredStaff: false, dutyStatus: 'en_route' }
      ],
      equipment: [
        { id: 'EQ-10', name: 'وحدات رأس متحرك Moving Head Beam 230W', category: 'lighting', quantity: 8, unit: 'جهاز', barcode: 'BAR-LT-010', status: 'checked_out' },
        { id: 'EQ-11', name: 'أجهزة ليزر جرافيكس متعددة الألوان 5W', category: 'lighting', quantity: 2, unit: 'جهاز', barcode: 'BAR-LT-011', status: 'checked_out' },
        { id: 'EQ-12', name: 'ماكينة ضباب أرضي Low Fog مع ثلج جاف', category: 'lighting', quantity: 2, unit: 'جهاز', status: 'checked_out' },
        { id: 'EQ-13', name: 'وحدة تحكم DMX KingKong 1024', category: 'audio', quantity: 1, unit: 'جهاز', barcode: 'BAR-MX-001', status: 'checked_out' }
      ],
      dressCodeUniform: 'تيشيرت أسود تكتيكي مريح مع شارة هوية المزود الرسمية',
      specialInstructions: 'اختبار مؤثرات الزفة قبل دخول العروس بنصف ساعة، والتأكد من تمديدات الأمان الكهربائية.',
      etaMinutes: 25,
      distanceKm: 21.0,
      priority: 'high',
      providerName: currentProviderName,
      providerId: currentProviderId,
      createdAt: new Date().toISOString()
    },
    {
      id: 'DSP-26-0000000003',
      serviceRequestId: 103,
      serviceName: 'التوثيق الفوتوغرافي والفيديو السينمائي مع طائرة درون',
      customerName: 'المهندس رائد العتيبي',
      customerPhone: '0543322110',
      venueName: 'منتجع واحة اليمامة',
      venueCity: 'الدرعية',
      venueAddress: 'طريق الملك خالد، الدرعية التاريخية',
      eventDate: today,
      eventStartTime: '21:00',
      targetSetupTime: '18:30',
      currentStage: 'packing',
      stageTimestamps: {
        packingAt: '15:45'
      },
      crew: [
        { roleTitle: 'المصور السينمائي الرئيسي', name: 'ياسر القحطاني', phone: '0598877665', isRegisteredStaff: true, dutyStatus: 'assigned' },
        { roleTitle: 'طيار درون مرخص', name: 'بندر الشهري', phone: '0561122998', isRegisteredStaff: true, dutyStatus: 'assigned' },
        { roleTitle: 'مصورة فوتوغرافية (قسم النساء)', name: 'نورة السالم', phone: '0554433221', isRegisteredStaff: false, dutyStatus: 'assigned' }
      ],
      equipment: [
        { id: 'EQ-20', name: 'كاميرا سينمائية Sony FX6 + عدسات Prime', category: 'photography', quantity: 2, unit: 'طقم', barcode: 'BAR-CAM-001', status: 'in_warehouse' },
        { id: 'EQ-21', name: 'طائرة درون DJI Mavic 3 Pro Cine', category: 'photography', quantity: 1, unit: 'طائرة', barcode: 'BAR-DRN-001', status: 'in_warehouse' },
        { id: 'EQ-22', name: 'مانع اهتزاز Gimbal DJI RS3 Pro', category: 'photography', quantity: 2, unit: 'جهاز', status: 'in_warehouse' },
        { id: 'EQ-23', name: 'أطقم إضاءة محمولة Aputure 600d + Softbox', category: 'lighting', quantity: 3, unit: 'طقم', status: 'in_warehouse' }
      ],
      dressCodeUniform: 'بدلة سمارت كاجوال سوداء أنيقة مع حزام أدوات الكاميرا المعتمد',
      specialInstructions: 'التركيز على لقطات استقبال كبار الشخصيات، وتفريغ بطاقات الذاكرة فوراً على قرص صلب احتياطي.',
      etaMinutes: 45,
      distanceKm: 32.0,
      priority: 'normal',
      providerName: currentProviderName,
      providerId: currentProviderId,
      createdAt: new Date().toISOString()
    }
  ];
};

export const getIncompleteLogisticsCount = (providerName: string, providerId?: string, userRole: string = 'provider'): number => {
  try {
    const key = getLogisticsStorageKey(providerName);
    const saved = localStorage.getItem(key);
    const tasks: LogisticsDispatchTask[] = saved ? JSON.parse(saved) : getDefaultLogisticsTasks(providerName, providerId);
    
    const providerTasks = tasks.filter(t => {
      if (userRole === 'admin') return true;
      const matchesName = t.providerName === providerName || !t.providerName;
      const matchesId = !providerId || !t.providerId || String(t.providerId) === String(providerId);
      return matchesName || matchesId;
    });

    return providerTasks.filter(t => t.currentStage !== 'completed').length;
  } catch (e) {
    return 0;
  }
};

export const LogisticsOperationsCenter: React.FC<LogisticsOperationsCenterProps> = ({
  userRole,
  currentProviderName,
  currentProviderId,
  currentUserName,
  providerSubscription,
  supportServiceRequests = [],
  setSupportServiceRequests,
  providerStaffList = [],
  setProviderStaffList,
  bookings = [],
  showNotification,
  formatCurrency = (val) => `${val.toLocaleString('ar-SA')} ر.س`,
  setActiveTab,
  handleBuyStaffSlot
}) => {
  // 1. Initial Storage & Seed Tasks for this provider
  const STORAGE_KEY = useMemo(() => getLogisticsStorageKey(currentProviderName), [currentProviderName]);

  const defaultInitialTasks: LogisticsDispatchTask[] = useMemo(() => {
    return getDefaultLogisticsTasks(currentProviderName, currentProviderId);
  }, [currentProviderName, currentProviderId]);

  const [tasks, setTasks] = useState<LogisticsDispatchTask[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load logistics tasks', e);
    }
    return defaultInitialTasks;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
      window.dispatchEvent(new Event('logisticsTasksUpdated'));
    } catch (e) {
      console.error('Failed to save logistics tasks', e);
    }
  }, [tasks, STORAGE_KEY]);

  // Current filter & search states
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [activeSubView, setActiveSubView] = useState<'pipeline' | 'radar' | 'equipment' | 'crews'>('pipeline');

  // Selected item modals
  const [selectedTask, setSelectedTask] = useState<LogisticsDispatchTask | null>(null);
  const [isDutyCardOpen, setIsDutyCardOpen] = useState(false);
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);
  const [isDamageReportModalOpen, setIsDamageReportModalOpen] = useState(false);
  const [selectedEquipmentForDamage, setSelectedEquipmentForDamage] = useState<{ task: LogisticsDispatchTask; item: LogisticsItem } | null>(null);

  // Motivational banner visibility
  const [isUpsellBannerDismissed, setIsUpsellBannerDismissed] = useState(() => {
    return localStorage.getItem('DISMISS_LOGISTICS_UPSELL_BANNER') === 'true';
  });

  // Filtered tasks by provider (Strict Multi-Tenancy)
  const providerTasks = useMemo(() => {
    return tasks.filter(t => {
      if (userRole === 'admin') return true;
      const matchesName = t.providerName === currentProviderName || !t.providerName;
      const matchesId = !currentProviderId || !t.providerId || String(t.providerId) === String(currentProviderId);
      return matchesName || matchesId;
    });
  }, [tasks, userRole, currentProviderName, currentProviderId]);

  const filteredTasks = useMemo(() => {
    return providerTasks.filter(t => {
      const matchesSearch = !searchQuery ||
        t.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.venueName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.id.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStage = stageFilter === 'all' || t.currentStage === stageFilter;
      const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;

      return matchesSearch && matchesStage && matchesPriority;
    });
  }, [providerTasks, searchQuery, stageFilter, priorityFilter]);

  // KPIs
  const stats = useMemo(() => {
    const total = providerTasks.length;
    const active = providerTasks.filter(t => ['packing', 'dispatch', 'staging', 'ready_check', 'live_exec'].includes(t.currentStage)).length;
    const completed = providerTasks.filter(t => t.currentStage === 'completed' || t.currentStage === 'teardown').length;
    const urgent = providerTasks.filter(t => t.priority === 'urgent' && t.currentStage !== 'completed').length;
    const totalCrewAssigned = providerTasks.reduce((acc, t) => acc + t.crew.length, 0);
    const totalEquipmentDeployed = providerTasks.reduce((acc, t) => acc + t.equipment.filter(e => e.status !== 'returned_intact').length, 0);

    return { total, active, completed, urgent, totalCrewAssigned, totalEquipmentDeployed };
  }, [providerTasks]);

  // Provider staff seats calculation
  const staffSeatsCount = useMemo(() => {
    const rawLimit = providerSubscription?.staffSeatsLimit;
    if (rawLimit === 'unlimited') return 999;
    return Number(rawLimit || 0) + Number(providerSubscription?.purchasedStaffSlots || 0);
  }, [providerSubscription]);

  const registeredStaffAvailable = useMemo(() => {
    return providerStaffList || [];
  }, [providerStaffList]);

  // Advance stage handler
  const handleAdvanceStage = (taskId: string) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;

      const stageIndex = STAGES_FLOW.findIndex(s => s.id === t.currentStage);
      if (stageIndex >= STAGES_FLOW.length - 1) {
        return {
          ...t,
          currentStage: 'completed',
          stageTimestamps: {
            ...t.stageTimestamps,
            completedAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
          }
        };
      }

      const nextStage = STAGES_FLOW[stageIndex + 1].id as LogisticsDispatchTask['currentStage'];
      const timestampKey = `${nextStage}At` as keyof LogisticsDispatchTask['stageTimestamps'];

      return {
        ...t,
        currentStage: nextStage,
        stageTimestamps: {
          ...t.stageTimestamps,
          [timestampKey]: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
        }
      };
    }));

    showNotification('success', '🚀 تم تحديث مرحلة التشغيل اللوجستية بنجاح.');
  };

  // Toggle Equipment Status
  const handleUpdateEquipmentStatus = (taskId: string, equipmentId: string, newStatus: LogisticsItem['status']) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      return {
        ...t,
        equipment: t.equipment.map(e => {
          if (e.id !== equipmentId) return e;
          return { ...e, status: newStatus };
        })
      };
    }));

    showNotification('info', `تم تحديث حالة المعدة إلى: ${getEquipmentStatusBadge(newStatus).text}`);
  };

  // Crew Check-in
  const handleCrewCheckIn = (taskId: string, memberIndex: number) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t;
      const updatedCrew = [...t.crew];
      updatedCrew[memberIndex] = {
        ...updatedCrew[memberIndex],
        dutyStatus: 'on_site',
        checkInTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      };
      return { ...t, crew: updatedCrew };
    }));

    showNotification('success', '📍 تم تأكيد الوصول الميداني وتسجيل الحضور للطاقم بنجاح.');
  };

  // Save Damage Report
  const [damageForm, setDamageForm] = useState({
    description: '',
    estimatedCost: 250,
    responsibleParty: 'customer' as const
  });

  const handleSaveDamageReport = () => {
    if (!selectedEquipmentForDamage) return;
    const { task, item } = selectedEquipmentForDamage;

    setTasks(prev => prev.map(t => {
      if (t.id !== task.id) return t;
      return {
        ...t,
        equipment: t.equipment.map(e => {
          if (e.id !== item.id) return e;
          return {
            ...e,
            status: 'damage_reported',
            damageDetails: {
              description: damageForm.description || 'تلف أثناء التشغيل الميداني',
              estimatedCost: damageForm.estimatedCost,
              responsibleParty: damageForm.responsibleParty,
              loggedAt: new Date().toLocaleString('ar-SA')
            }
          };
        })
      };
    }));

    showNotification('warning', '⚠️ تم تسجيل محضر التلفيات وحفظ التكلفة التقديرية بنجاح.');
    setIsDamageReportModalOpen(false);
    setSelectedEquipmentForDamage(null);
  };

  // Helper status badges
  function getEquipmentStatusBadge(status: LogisticsItem['status']) {
    switch (status) {
      case 'in_warehouse':
        return { text: 'في المستودع', color: 'bg-slate-100 text-slate-700 border-slate-200' };
      case 'checked_out':
        return { text: 'تم التحميل والنقل', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'on_site_verified':
        return { text: 'تم الفحص بالقاعة', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'returned_intact':
        return { text: 'تم الإرجاع سليم', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'damage_reported':
        return { text: 'تالف / مفقود ⚠️', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { text: status, color: 'bg-slate-100 text-slate-600' };
    }
  }

  // Calculate live readiness urgency
  function getTaskUrgencyBadge(task: LogisticsDispatchTask) {
    if (task.currentStage === 'completed') {
      return { text: 'مكتمل بنجاح', color: 'bg-slate-100 text-slate-600 border-slate-200', icon: CheckCircle2 };
    }
    if (task.currentStage === 'ready_check' || task.currentStage === 'live_exec') {
      return { text: 'جاهزية مؤكدة 100%', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: Sparkles };
    }
    if (task.priority === 'urgent') {
      return { text: 'توقيت حرج - يلزم التسريع', color: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse', icon: AlertTriangle };
    }
    return { text: 'وفق الجدول المعتمد', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock };
  }

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* 🌟 1. Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="p-2.5 bg-purple-100 text-purple-700 rounded-2xl">
              <Truck className="w-6 h-6" />
            </span>
            <div>
              <h2 className="text-xl lg:text-2xl font-black text-slate-900 flex items-center gap-2">
                <span>مركز العمليات اللوجستية للخدمات</span>
                <span className="text-xs px-2.5 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-full border border-amber-200">
                  Logistics Operations
                </span>
              </h2>
              <p className="text-slate-500 text-xs mt-0.5">
                إدارة دورة حياة الخدمات الميدانية، مناوبات الكوادر، حركة العُهد والمعدات، والرادار الزمني الحي
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsNewTaskModalOpen(true)}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-amber-500/20 transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إنشاء مهمة تشغيل لوجستية</span>
          </button>
        </div>
      </div>

      {/* 🚀 2. Motivational & Upsell Promotional Banner */}
      {!isUpsellBannerDismissed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="relative overflow-hidden bg-gradient-to-r from-purple-950 via-indigo-950 to-slate-900 rounded-3xl p-6 text-white border border-purple-800/40 shadow-xl"
        >
          {/* Background Ambient Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-3xl">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-extrabold text-[11px] flex items-center gap-1 shadow-xs">
                  <Zap className="w-3 h-3 fill-slate-950" />
                  أتمتة العمليات الميدانية التشاركية
                </span>
                <span className="text-xs text-purple-200 font-medium">
                  {staffSeatsCount > 0 ? `لديك ${staffSeatsCount} مقاعد كوادر مفعلة` : 'تعمل حالياً بالنمط الإجرائي الميداني'}
                </span>
              </div>

              <h3 className="text-lg lg:text-xl font-black text-white tracking-tight">
                هل ترغب في تمكين مشرفيك وفنييك من التحديث الميداني الذاتي عبر هواتفهم؟ 📱
              </h3>

              <p className="text-purple-200/90 text-xs leading-relaxed">
                مركز اللوجستيات يتيح لك إدارة كافة الإجراءات والمعدات والمناوبات مجاناً بمرونة تامة. ولأتمتة التشغيل، يمكنك ربط حسابات ميدانية فورية لمشرفيك لتأكيد الحضور الجغرافي، توقيع محاضر الجاهزية، ورفع صور الفحص مباشرة من القاعة عبر تفعيل مقاعد الكوادر (Staff Seats).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('PROVIDER_SUBSCRIPTION_ACTIVE_SUBTAB', 'addons');
                  localStorage.setItem('PROVIDER_SUBSCRIPTION_HIGHLIGHT_ADDON', 'provider_staff');
                  window.dispatchEvent(new CustomEvent('changeProviderSubTab', { detail: 'addons' }));
                  if (setActiveTab) {
                    setActiveTab('subscriptions');
                  }
                  if (showNotification) {
                    showNotification('info', 'تم التوجيه إلى مركز الباقات وسوق القدرات لشراء مقاعد الكوادر الإضافية أو ترقية الباقة.');
                  }
                }}
                className="px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105 active:scale-95 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>ترقية / شراء مقاعد كوادر إضافية</span>
              </button>

              {setActiveTab && (
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('provider_staff');
                    if (showNotification) {
                      showNotification('info', 'تم التوجيه إلى إدارة شؤون موظفي وعاملي الشركاء (إدارة العاملين والصلاحيات).');
                    }
                  }}
                  className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 transition-all active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <Users className="w-4 h-4 text-purple-300" />
                  <span>إدارة الكوادر والصلاحيات</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setIsUpsellBannerDismissed(true);
                  localStorage.setItem('DISMISS_LOGISTICS_UPSELL_BANNER', 'true');
                }}
                className="p-2.5 rounded-2xl text-purple-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                title="إخفاء التنبيه"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* 📊 3. Operational KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">مهام التشغيل النشطة اليوم</span>
            <span className="text-2xl font-black text-slate-900 block">{stats.active}</span>
            <span className="text-[10px] text-purple-600 font-bold">من إجمالي {stats.total} فعاليات</span>
          </div>
          <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">الكوادر الميدانية المعينة</span>
            <span className="text-2xl font-black text-indigo-600 block">{stats.totalCrewAssigned}</span>
            <span className="text-[10px] text-emerald-600 font-bold">مشرفين، فنيين وصبابين</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">العُهد والمعدات قيد التشغيل</span>
            <span className="text-2xl font-black text-amber-600 block">{stats.totalEquipmentDeployed}</span>
            <span className="text-[10px] text-slate-500 font-bold">أجهزة وأطقم ضيافة</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400">معدل الانضباط والجاهزية</span>
            <span className="text-2xl font-black text-emerald-600 block">100%</span>
            <span className="text-[10px] text-emerald-700 font-bold">التزام زمني قياسي</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 🧭 4. Sub-view Tabs & Filter Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Main Pillars Nav */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveSubView('pipeline')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeSubView === 'pipeline'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>مسار دورة حياة التشغيل (Pipeline)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('radar')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeSubView === 'radar'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-4 h-4" />
              <span>رادار التوقيت والوصول الحي (Live ETA)</span>
              {stats.urgent > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px]">
                  {stats.urgent}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('equipment')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeSubView === 'equipment'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <PackageCheck className="w-4 h-4" />
              <span>العُهد ومحاضر الاستلام والتلف</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubView('crews')}
              className={`px-4 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                activeSubView === 'crews'
                  ? 'bg-purple-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>الكوادر ومناوبات الميدان</span>
            </button>
          </div>

          {/* Search Box */}
          <div className="relative flex-1 md:max-w-xs">
            <input
              type="text"
              placeholder="ابحث بالخدمة، العميل، أو القاعة..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-purple-500 bg-slate-50/50 outline-none text-xs"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3 pointer-events-none" />
          </div>
        </div>

        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-bold ml-1">تصفية المرحلة:</span>
          <button
            type="button"
            onClick={() => setStageFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              stageFilter === 'all' ? 'bg-purple-100 text-purple-800' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            الكل ({providerTasks.length})
          </button>
          {STAGES_FLOW.map(s => {
            const count = providerTasks.filter(t => t.currentStage === s.id).length;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => setStageFilter(s.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  stageFilter === s.id ? 'bg-purple-900 text-white shadow-xs' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <s.icon className="w-3.5 h-3.5" />
                <span>{s.shortLabel}</span>
                <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 🚀 5. SUB-VIEWS RENDERING */}

      {/* ─── A. Pipeline View (مسار العمليات والمراحل الست) ─── */}
      {activeSubView === 'pipeline' && (
        <div className="space-y-6">
          {filteredTasks.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 flex flex-col items-center justify-center">
              <Truck className="w-16 h-16 text-slate-300 mb-3 animate-pulse" />
              <h4 className="text-base font-bold text-slate-700">لا توجد مهام تشغيلية مطابقة للبحث</h4>
              <p className="text-xs text-slate-400 mt-1">يمكنك إنشاء مهمة جديدة أو تغيير فلاتر التصفية أعلاه.</p>
            </div>
          ) : (
            filteredTasks.map(task => {
              const urgency = getTaskUrgencyBadge(task);
              const currentStageIndex = STAGES_FLOW.findIndex(s => s.id === task.currentStage);
              const isCompleted = task.currentStage === 'completed';

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all space-y-5 p-6"
                >
                  {/* Top Bar: IDs, Service Name, Urgency Badge */}
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs bg-purple-50 text-purple-800 px-2.5 py-1 rounded-lg border border-purple-100">
                          {task.id}
                        </span>
                        {task.serviceRequestId && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            طلب: #{formatServiceRequestId(Number(task.serviceRequestId))}
                          </span>
                        )}
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold border flex items-center gap-1.5 ${urgency.color}`}>
                          <urgency.icon className="w-3.5 h-3.5" />
                          <span>{urgency.text}</span>
                        </span>
                      </div>

                      <h3 className="text-base lg:text-lg font-black text-slate-900">
                        {task.serviceName}
                      </h3>
                    </div>

                    {/* Venue & Customer Quick Info */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Building className="w-4 h-4 text-purple-600" />
                        <span className="font-bold text-slate-800">{task.venueName}</span>
                        <span className="text-slate-400">({task.venueCity})</span>
                      </div>

                      <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                        <Users className="w-4 h-4 text-indigo-600" />
                        <span className="font-bold text-slate-800">{task.customerName}</span>
                        {task.customerPhone && (
                          <a href={`tel:${task.customerPhone}`} className="text-purple-600 hover:underline flex items-center gap-0.5 font-mono">
                            <Phone className="w-3 h-3" />
                            {task.customerPhone}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 🪜 6-Stage Interactive Stepper */}
                  <div className="py-2">
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-2 relative">
                      {STAGES_FLOW.map((stage, idx) => {
                        const isDone = currentStageIndex > idx || isCompleted;
                        const isCurrent = currentStageIndex === idx && !isCompleted;
                        const timestampKey = `${stage.id}At` as keyof LogisticsDispatchTask['stageTimestamps'];
                        const timeRecorded = task.stageTimestamps[timestampKey];

                        return (
                          <div
                            key={stage.id}
                            className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between space-y-2 ${
                              isCurrent
                                ? 'bg-purple-900 text-white border-purple-700 shadow-md ring-2 ring-purple-500/20'
                                : isDone
                                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                                : 'bg-slate-50 text-slate-400 border-slate-100 opacity-60'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold">
                                {stage.shortLabel}
                              </span>
                              {isDone ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              ) : isCurrent ? (
                                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                              ) : (
                                <span className="text-[10px] opacity-40">#{idx + 1}</span>
                              )}
                            </div>

                            <div className="text-[10px] leading-tight">
                              {timeRecorded ? (
                                <span className="font-mono font-bold block opacity-90">
                                  ⏰ {timeRecorded}
                                </span>
                              ) : (
                                <span className="opacity-75 block">{stage.desc}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Operational Details Grid (Crews, Equipment, Notes) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
                    {/* Assigned Crew Summary */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-purple-600" />
                          طاقم التشغيل المعين ({task.crew.length})
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTask(task);
                            setIsDutyCardOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-800 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
                        >
                          <Share2 className="w-3 h-3" />
                          بطاقة المهمة
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {task.crew.slice(0, 3).map((c, i) => (
                          <div key={i} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-slate-100">
                            <div>
                              <span className="font-bold text-slate-800">{c.name}</span>
                              <span className="text-slate-400 block text-[10px]">{c.roleTitle}</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              c.dutyStatus === 'on_site' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.dutyStatus === 'on_site' ? 'وصل للموقع' : 'قيد الحركة'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Equipment Checklist Summary */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <PackageCheck className="w-4 h-4 text-indigo-600" />
                          العُهد والمعدات ({task.equipment.length})
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {task.equipment.filter(e => e.status === 'on_site_verified').length} / {task.equipment.length} مفحوصة
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        {task.equipment.slice(0, 3).map((eq, i) => {
                          const eqBadge = getEquipmentStatusBadge(eq.status);
                          return (
                            <div key={i} className="flex items-center justify-between text-[11px] bg-white p-2 rounded-xl border border-slate-100">
                              <span className="font-bold text-slate-700 truncate max-w-[140px]">{eq.name}</span>
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${eqBadge.color}`}>
                                {eqBadge.text}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Readiness Schedule & Timing */}
                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5 flex flex-col justify-between">
                      <div className="space-y-2">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          التوقيت وموعد الجاهزية
                        </span>

                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <span className="text-slate-400 block text-[10px]">موعد بدء الحفل</span>
                            <span className="font-bold font-mono text-slate-800">{task.eventStartTime}</span>
                          </div>
                          <div className="bg-white p-2 rounded-xl border border-slate-100">
                            <span className="text-slate-400 block text-[10px]">مستهدف الجاهزية</span>
                            <span className="font-bold font-mono text-purple-700">{task.targetSetupTime}</span>
                          </div>
                        </div>

                        {task.dressCodeUniform && (
                          <div className="text-[10px] text-slate-500 bg-amber-50/70 p-2 rounded-xl border border-amber-100">
                            <strong>الزي المعتمد:</strong> {task.dressCodeUniform}
                          </div>
                        )}
                      </div>

                      {/* Advance Stage CTA */}
                      <div className="pt-2">
                        {!isCompleted ? (
                          <button
                            type="button"
                            onClick={() => handleAdvanceStage(task.id)}
                            className="w-full py-2.5 rounded-xl bg-purple-900 hover:bg-purple-950 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                          >
                            <span>الانتقال للمرحلة التالية: {STAGES_FLOW[Math.min(currentStageIndex + 1, STAGES_FLOW.length - 1)].shortLabel}</span>
                            <ChevronLeft className="w-4 h-4" />
                          </button>
                        ) : (
                          <div className="w-full py-2 rounded-xl bg-emerald-100 text-emerald-800 font-extrabold text-xs text-center border border-emerald-200">
                            ✅ اكتملت المهمة بنجاح وجردت العهد
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ─── B. Radar & Live ETA View (رادار التوقيت والوصول الحي) ─── */}
      {activeSubView === 'radar' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-purple-950 text-white p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-purple-500/20 text-purple-300 rounded-xl">
                    <Compass className="w-5 h-5 animate-spin" />
                  </span>
                  <h3 className="text-lg font-black text-white">رادار التوقيت والجاهزية اللحظية (Live Dispatch Radar)</h3>
                </div>
                <p className="text-xs text-purple-200">
                  مراقبة حية للمسافات، أوقات الذروة المرورية، والعد التنازلي لمستهدف الجاهزية قبل انطلاق الفعالية
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-2xl border border-white/15 text-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-mono">تحديث لحظي مباشر (Real-Time ETA)</span>
              </div>
            </div>
          </div>

          {/* Radar Tasks Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTasks.map(task => {
              const urgency = getTaskUrgencyBadge(task);
              const isSetupComplete = ['ready_check', 'live_exec', 'completed'].includes(task.currentStage);

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                      <span className="font-mono text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md">
                        {task.id}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${urgency.color}`}>
                        {urgency.text}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-black text-slate-900 text-sm">{task.serviceName}</h4>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-purple-600" />
                        <span>{task.venueName} - {task.venueCity}</span>
                      </p>
                    </div>

                    {/* ETA Metric Box */}
                    <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">وقت الوصول المتوقع (ETA):</span>
                        <span className="font-mono font-bold text-amber-400">
                          {task.etaMinutes === 0 ? 'وصل للموقع ✅' : `${task.etaMinutes} دقيقة متبقية`}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400">المسافة من المستودع:</span>
                        <span className="font-mono text-slate-300">{task.distanceKm} كم</span>
                      </div>
                      <div className="flex items-center justify-between text-xs border-t border-slate-800 pt-2">
                        <span className="text-slate-400">مستهدف الجاهزية:</span>
                        <span className="font-mono font-bold text-purple-300">{task.targetSetupTime}</span>
                      </div>
                    </div>

                    {/* Current Stage Indicator */}
                    <div className="text-xs bg-purple-50 p-2.5 rounded-xl border border-purple-100 text-purple-900 flex items-center justify-between">
                      <span className="font-bold">المرحلة الحالية:</span>
                      <span className="font-bold">{STAGES_FLOW.find(s => s.id === task.currentStage)?.label || task.currentStage}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDutyCardOpen(true);
                      }}
                      className="flex-1 py-2 rounded-xl bg-purple-100 hover:bg-purple-200 text-purple-900 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>عرض الخريطة والمهمة</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAdvanceStage(task.id)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
                      title="تقديم المرحلة"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── C. Equipment & Damage Log View (العُهد والمعدات والمحاضر) ─── */}
      {activeSubView === 'equipment' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <PackageCheck className="w-5 h-5 text-indigo-600" />
                  <span>محاضر استلام وتسليم العُهد الميدانية (Equipment Check-in/Check-out)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  مطابقة الأصول، الأجهزة، والأواني الفاخرة عند الخروج من المستودع وتوثيق التالف والمفقود
                </p>
              </div>
            </div>

            {/* Equipment Lists Grouped by Task */}
            <div className="space-y-6">
              {filteredTasks.map(task => (
                <div key={task.id} className="border border-slate-200 rounded-2xl overflow-hidden">
                  <div className="bg-slate-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200">
                    <div>
                      <span className="font-bold text-slate-900 text-sm">{task.serviceName}</span>
                      <span className="text-xs text-slate-500 block">
                        القاعة: {task.venueName} | المهمة: {task.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-600">
                        إجمالي المواد: {task.equipment.length}
                      </span>
                    </div>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {task.equipment.map(item => {
                      const badge = getEquipmentStatusBadge(item.status);
                      return (
                        <div key={item.id} className="p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 text-xs">{item.name}</span>
                              {item.barcode && (
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <QrCode className="w-3 h-3" />
                                  {item.barcode}
                                </span>
                              )}
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                                {badge.text}
                              </span>
                            </div>

                            <div className="text-[11px] text-slate-500 flex items-center gap-3">
                              <span>الكمية: <strong>{item.quantity} {item.unit}</strong></span>
                              <span>الفئة: {item.category}</span>
                            </div>

                            {item.damageDetails && (
                              <div className="mt-2 p-2.5 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-[11px] space-y-1">
                                <div className="font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                  <span>محضر تلف مسجل:</span>
                                </div>
                                <p>{item.damageDetails.description}</p>
                                <div className="text-[10px] text-rose-700 flex items-center gap-3">
                                  <span>التكلفة التقديرية: {formatCurrency(item.damageDetails.estimatedCost)}</span>
                                  <span>الجهة المسؤولة: {item.damageDetails.responsibleParty === 'customer' ? 'العميل' : 'استهلاك تشغيلي'}</span>
                                  <span>التاريخ: {item.damageDetails.loggedAt}</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Quick Status Control Buttons */}
                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleUpdateEquipmentStatus(task.id, item.id, 'checked_out')}
                              className="px-2.5 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              خروج للنقل
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateEquipmentStatus(task.id, item.id, 'on_site_verified')}
                              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              تأكيد بالقاعة
                            </button>

                            <button
                              type="button"
                              onClick={() => handleUpdateEquipmentStatus(task.id, item.id, 'returned_intact')}
                              className="px-2.5 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              إرجاع سليم للمستودع
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEquipmentForDamage({ task, item });
                                setIsDamageReportModalOpen(true);
                              }}
                              className="px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <AlertCircle className="w-3 h-3" />
                              تسجيل تلف / مفقود
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── D. Field Crews & Shift Dispatch View (الكوادر والمناوبات) ─── */}
      {activeSubView === 'crews' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-600" />
                  <span>إدارة الكوادر الميدانية ومناوبات التشغيل (Field Crews & Shift Dispatch)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  جدولة وتوزيع المشرفين والفنيين والصبابين على مواقع الفعاليات بجدول زمني محكم
                </p>
              </div>
            </div>

            {/* Crew Cards by Event */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTasks.map(task => (
                <div key={task.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-200 space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{task.serviceName}</h4>
                      <span className="text-xs text-purple-700 font-semibold">{task.venueName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsDutyCardOpen(true);
                      }}
                      className="px-3 py-1.5 rounded-xl bg-purple-900 text-white font-bold text-[11px] flex items-center gap-1 hover:bg-purple-950 transition-colors cursor-pointer"
                    >
                      <Share2 className="w-3 h-3" />
                      مشاركة بطاقة المهمة
                    </button>
                  </div>

                  <div className="space-y-2">
                    {task.crew.map((member, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 font-black flex items-center justify-center text-xs">
                            {member.name.slice(0, 2)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-slate-900 text-xs">{member.name}</span>
                              {member.isRegisteredStaff ? (
                                <span className="px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[9px] font-bold">
                                  حساب مسجل
                                </span>
                              ) : (
                                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[9px]">
                                  طاقم موسمي
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400 block">{member.roleTitle}</span>
                            {member.phone && (
                              <span className="text-[10px] text-purple-600 font-mono block">{member.phone}</span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {member.dutyStatus === 'on_site' ? (
                            <div className="text-right">
                              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                حاضر بالموقع
                              </span>
                              {member.checkInTime && (
                                <span className="text-[9px] text-slate-400 font-mono block mt-0.5">
                                  {member.checkInTime}
                                </span>
                              )}
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleCrewCheckIn(task.id, idx)}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-[11px] border border-purple-200 transition-colors cursor-pointer"
                            >
                              تسجيل وصول 📍
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 📋 6. DIGITAL DUTY CARD MODAL (بطاقة المهمة الذكية) */}
      <AnimatePresence>
        {isDutyCardOpen && selectedTask && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-2xl w-full p-6 text-right space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-800 font-bold text-xs">
                    بطاقة المهمة الميدانية الرقمية (Duty Card)
                  </span>
                  <h3 className="text-lg font-black text-slate-900 mt-1">{selectedTask.serviceName}</h3>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDutyCardOpen(false)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Event Coordinates */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">القاعة / الوجهة:</span>
                  <strong className="text-slate-800 block mt-0.5">{selectedTask.venueName}</strong>
                  <span className="text-slate-500 text-[11px] block">{selectedTask.venueAddress || selectedTask.venueCity}</span>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">التوقيت والجاهزية:</span>
                  <strong className="text-purple-700 block mt-0.5">مستهدف الجاهزية: {selectedTask.targetSetupTime}</strong>
                  <span className="text-slate-500 text-[11px] block">بدء الفعالية: {selectedTask.eventStartTime}</span>
                </div>
              </div>

              {/* Special Instructions & Uniform */}
              <div className="space-y-3 text-xs">
                {selectedTask.dressCodeUniform && (
                  <div className="bg-amber-50 p-3.5 rounded-2xl border border-amber-200 text-amber-900">
                    <strong className="block font-bold mb-1">👔 الزي الرسمي والمظهر المعتمد:</strong>
                    <p className="leading-relaxed">{selectedTask.dressCodeUniform}</p>
                  </div>
                )}

                {selectedTask.specialInstructions && (
                  <div className="bg-indigo-50 p-3.5 rounded-2xl border border-indigo-200 text-indigo-900">
                    <strong className="block font-bold mb-1">📌 تعليمات العميل وإدارة المكان:</strong>
                    <p className="leading-relaxed">{selectedTask.specialInstructions}</p>
                  </div>
                )}
              </div>

              {/* Crew List on Card */}
              <div className="space-y-2">
                <span className="font-bold text-slate-800 text-xs block">طاقم المهمة المعين:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedTask.crew.map((c, idx) => (
                    <div key={idx} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-slate-900 block">{c.name}</strong>
                        <span className="text-slate-400 text-[10px]">{c.roleTitle}</span>
                      </div>
                      {c.phone && <span className="font-mono text-[10px] text-purple-600">{c.phone}</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const text = `📋 بطاقة مهمة ميدانية:\nالخدمة: ${selectedTask.serviceName}\nالموقع: ${selectedTask.venueName}\nالجاهزية المطلوبة: ${selectedTask.targetSetupTime}\nالزي: ${selectedTask.dressCodeUniform}`;
                    navigator.clipboard.writeText(text);
                    showNotification('success', 'تم نسخ ملخص المهمة لمشاركته عبر الواتساب.');
                  }}
                  className="flex-1 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-sm transition-all"
                >
                  <Share2 className="w-4 h-4" />
                  <span>نسخ ملخص المهمة للواتساب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDutyCardOpen(false)}
                  className="px-6 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ⚠️ 7. DAMAGE LOG MODAL (محضر التلفيات والمفقودات) */}
      <AnimatePresence>
        {isDamageReportModalOpen && selectedEquipmentForDamage && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl max-w-lg w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-rose-100 text-rose-700 rounded-xl">
                    <AlertTriangle className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-black text-slate-900 text-base">محضر توثيق تالف أو مفقود</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{selectedEquipmentForDamage.item.name}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDamageReportModalOpen(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">وصف الضرر أو الفقد بالتفصيل:</label>
                  <textarea
                    rows={3}
                    placeholder="اكتب تفاصيل التلف، كسر العدسة، أو فقد الصواني..."
                    value={damageForm.description}
                    onChange={e => setDamageForm({ ...damageForm, description: e.target.value })}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">التكلفة التقديرية (ر.س):</label>
                    <input
                      type="number"
                      value={damageForm.estimatedCost}
                      onChange={e => setDamageForm({ ...damageForm, estimatedCost: Number(e.target.value) })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">الجهة المسؤولة:</label>
                    <select
                      value={damageForm.responsibleParty}
                      onChange={e => setDamageForm({ ...damageForm, responsibleParty: e.target.value as any })}
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-rose-500 outline-none text-xs"
                    >
                      <option value="customer">العميل (يخصم من التأمين)</option>
                      <option value="crew">طاقم التشغيل (إهمال)</option>
                      <option value="venue">إدارة المكان / القاعة</option>
                      <option value="wear_tear">استهلاك طبيعي</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleSaveDamageReport}
                  className="flex-1 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs cursor-pointer shadow-md transition-all"
                >
                  اعتماد المحضر وتوثيق التلف
                </button>

                <button
                  type="button"
                  onClick={() => setIsDamageReportModalOpen(false)}
                  className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ➕ 8. NEW DISPATCH TASK MODAL (إنشاء مهمة جديدة) */}
      <AnimatePresence>
        {isNewTaskModalOpen && (
          <CreateNewDispatchTaskModal
            currentProviderName={currentProviderName}
            currentProviderId={currentProviderId}
            supportServiceRequests={supportServiceRequests}
            providerStaffList={providerStaffList}
            onClose={() => setIsNewTaskModalOpen(false)}
            onSave={(newTask) => {
              setTasks(prev => [newTask, ...prev]);
              showNotification('success', '✨ تم إنشاء مهمة التشغيل اللوجستية بنجاح.');
              setIsNewTaskModalOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Modal for creating new dispatch task ───
interface CreateTaskModalProps {
  currentProviderName: string;
  currentProviderId?: string;
  supportServiceRequests: any[];
  providerStaffList: any[];
  onClose: () => void;
  onSave: (task: LogisticsDispatchTask) => void;
}

const CreateNewDispatchTaskModal: React.FC<CreateTaskModalProps> = ({
  currentProviderName,
  currentProviderId,
  supportServiceRequests = [],
  providerStaffList = [],
  onClose,
  onSave
}) => {
  const today = new Date().toISOString().split('T')[0];
  const [form, setForm] = useState({
    serviceName: '',
    customerName: '',
    customerPhone: '',
    venueName: '',
    venueCity: 'الرياض',
    venueAddress: '',
    eventDate: today,
    eventStartTime: '20:00',
    targetSetupTime: '17:00',
    priority: 'normal' as const,
    supervisorName: '',
    supervisorPhone: '',
    dressCodeUniform: 'الزي الموحد الرسمي للمنشأة',
    specialInstructions: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.serviceName || !form.venueName || !form.customerName) {
      alert('يرجى تعبئة الحقول الأساسية: الخدمة، القاعة، واسم العميل');
      return;
    }

    const newTask: LogisticsDispatchTask = {
      id: `DSP-26-${String(Date.now()).slice(-8)}`,
      serviceName: form.serviceName,
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      venueName: form.venueName,
      venueCity: form.venueCity,
      venueAddress: form.venueAddress,
      eventDate: form.eventDate,
      eventStartTime: form.eventStartTime,
      targetSetupTime: form.targetSetupTime,
      currentStage: 'packing',
      stageTimestamps: {
        packingAt: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })
      },
      crew: [
        {
          roleTitle: 'المشرف الميداني',
          name: form.supervisorName || 'مشرف معتمد',
          phone: form.supervisorPhone,
          dutyStatus: 'assigned',
          isRegisteredStaff: providerStaffList.some(s => s.name === form.supervisorName)
        }
      ],
      equipment: [
        { id: `EQ-${Date.now()}-1`, name: 'حقيبة التجهيز والتشغيل الأساسية', category: 'other', quantity: 1, unit: 'طقم', status: 'in_warehouse' }
      ],
      dressCodeUniform: form.dressCodeUniform,
      specialInstructions: form.specialInstructions,
      priority: form.priority,
      etaMinutes: 30,
      distanceKm: 18,
      providerName: currentProviderName,
      providerId: currentProviderId,
      createdAt: new Date().toISOString()
    };

    onSave(newTask);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white rounded-3xl max-w-xl w-full p-6 text-right space-y-5 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
              <Plus className="w-5 h-5" />
            </span>
            <h3 className="font-black text-slate-900 text-base">إنشاء مهمة تشغيل لوجستية جديدة</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">اسم الخدمة أو الباقة المساندة *</label>
            <input
              type="text"
              required
              placeholder="مثال: بوفيه فاخر والضيافة، إضاءة ليزر، تصوير..."
              value={form.serviceName}
              onChange={e => setForm({ ...form, serviceName: e.target.value })}
              className="w-full p-3 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم العميل *</label>
              <input
                type="text"
                required
                placeholder="اسم العميل"
                value={form.customerName}
                onChange={e => setForm({ ...form, customerName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">جوال العميل</label>
              <input
                type="tel"
                placeholder="05XXXXXXXX"
                value={form.customerPhone}
                onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none font-mono text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">اسم القاعة أو الموقع *</label>
              <input
                type="text"
                required
                placeholder="اسم القاعة / الفندق"
                value={form.venueName}
                onChange={e => setForm({ ...form, venueName: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">المدينة</label>
              <input
                type="text"
                value={form.venueCity}
                onChange={e => setForm({ ...form, venueCity: e.target.value })}
                className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-purple-500 outline-none text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">تاريخ الفعالية</label>
              <input
                type="date"
                value={form.eventDate}
                onChange={e => setForm({ ...form, eventDate: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">مستهدف الجاهزية</label>
              <input
                type="time"
                value={form.targetSetupTime}
                onChange={e => setForm({ ...form, targetSetupTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none font-mono text-xs"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">بدء الحفل</label>
              <input
                type="time"
                value={form.eventStartTime}
                onChange={e => setForm({ ...form, eventStartTime: e.target.value })}
                className="w-full p-2 rounded-xl border border-slate-200 outline-none font-mono text-xs"
              />
            </div>
          </div>

          {/* Supervisor Selection (Hybrid: manual or from staff seats) */}
          <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 space-y-2">
            <span className="font-bold text-purple-900 block">تعيين المشرف الميداني المسؤول:</span>
            {providerStaffList.length > 0 ? (
              <div>
                <select
                  value={form.supervisorName}
                  onChange={e => {
                    const selected = providerStaffList.find(s => s.name === e.target.value);
                    setForm({
                      ...form,
                      supervisorName: e.target.value,
                      supervisorPhone: selected?.phone || form.supervisorPhone
                    });
                  }}
                  className="w-full p-2.5 rounded-xl border border-purple-200 bg-white outline-none text-xs"
                >
                  <option value="">-- اختر من قائمة موظفي الكوتا المسجلين --</option>
                  {providerStaffList.map((s, i) => (
                    <option key={i} value={s.name}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="اسم المشرف"
                  value={form.supervisorName}
                  onChange={e => setForm({ ...form, supervisorName: e.target.value })}
                  className="w-full p-2 rounded-xl border border-purple-200 bg-white outline-none text-xs"
                />
                <input
                  type="tel"
                  placeholder="رقم جوال المشرف"
                  value={form.supervisorPhone}
                  onChange={e => setForm({ ...form, supervisorPhone: e.target.value })}
                  className="w-full p-2 rounded-xl border border-purple-200 bg-white outline-none font-mono text-xs"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-3 border-t border-slate-100">
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs cursor-pointer shadow-md transition-all"
            >
              حفظ وبدء مرحلة التجهيز بالمستودع
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};
