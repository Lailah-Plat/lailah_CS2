import React, { useState, useEffect, useMemo } from 'react';
import { safeSetLocalStorage } from '../../utils/safeStorage';
import { motion } from 'motion/react';
import { 
  TrendingUp, Activity, CreditCard, Wallet, 
  Building2, ArrowRightLeft, Award, Clock, ArrowUpRight, ArrowDownRight, 
  Percent, Megaphone, ChevronDown, ChevronUp, Star, Filter, 
  Eye, RefreshCw, AlertCircle, Calendar, Sparkles, Inbox,
  CheckSquare, Users2, ShieldAlert, CheckCircle2, Sliders, Search, 
  FileSpreadsheet, Download, Plus, AlertTriangle, Play, FileText, Check, Printer, X, Coffee, Lock, Package, MapPin,
  ChevronRight, ChevronLeft, List, LayoutGrid, Truck, Boxes, Trash, Edit, Info, UploadCloud, Loader2, Compass
} from 'lucide-react';
import { OperationsCenter } from './OperationsCenter';
import ProviderPayoutAndSubscriptionPanel from '../payment/ProviderPayoutAndSubscriptionPanel';
import { 
  ResponsiveContainer, ComposedChart, CartesianGrid, XAxis, YAxis, 
  Legend, Bar, Line, AreaChart, Area, Tooltip as RechartsTooltip
} from 'recharts';

interface ProviderDashboardProps {
  currentProviderName: string;
  currentUserName: string;
  providerSubscription: any;
  selectedDashboardYear: string;
  setSelectedDashboardYear: (v: string) => void;
  selectedDashboardMonth: string;
  setSelectedDashboardMonth: (v: string) => void;
  dashboardPeriod: string;
  setDashboardPeriod: (v: string) => void;
  yearlyPeriodType: string;
  setYearlyPeriodType: (v: string) => void;
  customStartDate: string;
  setCustomStartDate: (v: string) => void;
  customEndDate: string;
  setCustomEndDate: (v: string) => void;
  bookings: any[];
  setBookings: React.Dispatch<React.SetStateAction<any[]>>;
  supportServiceRequests: any[];
  campaigns: any[];
  customers: any[];
  halls: any[];
  activeSection: string;
  setActiveSection: (v: string) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderDashboard({
  currentProviderName,
  currentUserName,
  providerSubscription,
  selectedDashboardYear,
  setSelectedDashboardYear,
  selectedDashboardMonth,
  setSelectedDashboardMonth,
  dashboardPeriod,
  setDashboardPeriod,
  yearlyPeriodType,
  setYearlyPeriodType,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  bookings,
  supportServiceRequests,
  campaigns,
  customers,
  halls,
  activeSection,
  setActiveSection,
  showNotification,
}: ProviderDashboardProps) {

  const PROVIDER_STAFF = [
    { id: 'st-1', name: 'خالد الرويلي', role: 'مشرف تجهيز' },
    { id: 'st-2', name: 'أحمد السالم', role: 'منسق ضيافة' },
    { id: 'st-3', name: 'سارة العتيبي', role: 'مشرفة استقبال وقاعات' },
    { id: 'st-4', name: 'فهد المطيري', role: 'مهندس صوت وإضاءة' },
  ];

  const [activeSubTab, setActiveSubTab] = useState<'business_os' | 'ops_center' | 'stats' | 'growth'>('business_os');
  const [osTab, setOsTab] = useState<'overview' | 'profile' | 'catalog' | 'pricing' | 'availability' | 'bookings' | 'orders' | 'hybrid' | 'finance' | 'subscription' | 'reports' | 'marketing' | 'customers' | 'notifications' | 'inventory' | 'suppliers' | 'ops_center' | 'stats' | 'growth'>('overview');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [expandedDomains, setExpandedDomains] = useState<Record<string, boolean>>({
    operations: true,
    catalog: true,
    scheduling: true,
    finance: true,
    analytics: true
  });

  const [isOnboarded, setIsOnboarded] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  // Wizard state inputs
  const [wizBranchName, setWizBranchName] = useState('');
  const [wizBranchCity, setWizBranchCity] = useState('الرياض');
  const [wizBranchPhone, setWizBranchPhone] = useState('');
  const [wizBranchAddress, setWizBranchAddress] = useState('');

  const [wizVenueName, setWizVenueName] = useState('');
  const [wizVenueCapacity, setWizVenueCapacity] = useState('400');
  const [wizVenuePrice, setWizVenuePrice] = useState('15000');
  const [wizVenueCity, setWizVenueCity] = useState('الرياض');
  const [wizVenueDesc, setWizVenueDesc] = useState('');

  const [wizServiceName, setWizServiceName] = useState('');
  const [wizServiceCategory, setWizServiceCategory] = useState('ضيافة');
  const [wizServicePrice, setWizServicePrice] = useState('2000');
  const [wizServiceDesc, setWizServiceDesc] = useState('');

  const [wizBasePrice, setWizBasePrice] = useState('15000');
  const [wizWeekendPrice, setWizWeekendPrice] = useState('18500');

  const [wizWorkingHours, setWizWorkingHours] = useState('02:00 م - 02:00 ص');
  const [wizCapacityLimit, setWizCapacityLimit] = useState('500');

  const [uploadedDocs, setUploadedDocs] = useState<{ id: string; name: string; status: 'pending' | 'success' }[]>([
    { id: 'doc-1', name: 'السجل التجاري المعتمد (CR)', status: 'pending' },
    { id: 'doc-2', name: 'رخصة البلدية للمنشأة', status: 'pending' },
    { id: 'doc-3', name: 'تصريح شهادة الدفاع المدني', status: 'pending' }
  ]);
  const [isUploadingSim, setIsUploadingSim] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  // Business Profile states
  const [profileBranches, setProfileBranches] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_branches_${currentProviderName}`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'BR-26-00000001', name: 'فرع الرياض الرئيسي', city: 'الرياض', phone: '0551234567', address: 'طريق الملك فهد' },
      { id: 'BR-26-00000002', name: 'فرع شمال الرياض', city: 'الرياض', phone: '0559876543', address: 'حي الملقا' }
    ];
  });
  const [profileEmployees, setProfileEmployees] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_employees_${currentProviderName}`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'EMP-26-00000001', name: 'خالد الرويلي', role: 'مشرف تجهيز', branch: 'فرع الرياض الرئيسي', permissions: 'صلاحيات كاملة', status: 'نشط' },
      { id: 'EMP-26-00000002', name: 'أحمد السالم', role: 'منسق ضيافة', branch: 'فرع الرياض الرئيسي', permissions: 'تعديل الحجوزات فقط', status: 'نشط' },
      { id: 'EMP-26-00000003', name: 'سارة العتيبي', role: 'مشرفة استقبال وقاعات', branch: 'فرع شمال الرياض', permissions: 'استعراض الحجوزات فقط', status: 'نشط' },
      { id: 'EMP-26-00000004', name: 'فهد المطيري', role: 'مهندس صوت وإضاءة', branch: 'فرع شمال الرياض', permissions: 'محدودة للفرع', status: 'نشط' },
    ];
  });

  // Settings Management State (Domains: System, Operations, Finance)
  const [providerSettings, setProviderSettings] = useState<any>(() => {
    const stored = localStorage.getItem(`provider_settings_${currentProviderName}`);
    if (stored) return JSON.parse(stored);
    return {
      systemName: `نظام إدارة ${currentProviderName}`,
      language: 'ar',
      autoApproveServices: true,
      autoGenerateInvoices: true,
      workingHours: '02:00 م - 02:00 ص',
      capacityLimit: 500,
      vatRate: 15,
      bankName: 'البنك الأهلي السعودي',
      iban: 'SA9340000000123456789012',
      autoPayout: true,
      showProviderToCustomers: true
    };
  });

  // Settings Sub-Tabs
  const [settingsSubTab, setSettingsSubTab] = useState<'identity' | 'branches' | 'employees' | 'settings'>('identity');

  // Editing & Viewing States for Branches and Employees
  const [editingBranch, setEditingBranch] = useState<any>(null);
  const [viewingBranch, setViewingBranch] = useState<any>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [viewingEmployee, setViewingEmployee] = useState<any>(null);
  const [isEditBranchOpen, setIsEditBranchOpen] = useState(false);
  const [isViewBranchOpen, setIsViewBranchOpen] = useState(false);
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false);
  const [isViewEmployeeOpen, setIsViewEmployeeOpen] = useState(false);

  // Catalog state
  const [catalogHalls, setCatalogHalls] = useState<any[]>(() => {
    return (halls || []).filter(h => h.provider === currentProviderName).map(h => ({
      ...h,
      capacity: h.capacity || 400,
      policies: h.policies || 'لا يوجد سياسات مسجلة',
      photosCount: h.images?.length || 3
    }));
  });
  const [catalogServices, setCatalogServices] = useState<any[]>([
    { id: 'SER-01', name: 'بوفيه عشاء ملكي فاخر', category: 'ضيافة', price: 4500, status: 'نشط', desc: 'بوفيه عشاء مفتوح يشمل الأصناف الشرقية والغربية مع العصائر الطازجة والضيافة.' },
    { id: 'SER-02', name: 'تنسيق وديكور الكوشة الحديثة', category: 'ديكور', price: 3000, status: 'نشط', desc: 'تصميم كوشة فريدة مع تزيين الممر بورد طبيعي وإضاءة خافتة متناسقة.' },
    { id: 'SER-03', name: 'توثيق فوتوغرافي وفيديو احترافي', category: 'تصوير', price: 2500, status: 'نشط', desc: 'تغطية كاملة للحفل بكاميرتين سينمائيتين مع ألبوم صور فاخر رقمي ومطبوع.' },
    { id: 'SER-04', name: 'الضيافة الذهبية والقهوة الفاخرة', category: 'ضيافة', price: 1500, status: 'نشط', desc: 'طاقم ضيافة متميز يقدم القهوة والتمور والحلويات طيلة وقت الحفل.' }
  ]);
  const [catalogPackages, setCatalogPackages] = useState<any[]>([
    { id: 'PKG-01', name: 'الباقة الكبرى الملكية المتكاملة', venue: 'قاعة الأسطورة الكبرى', price: 22000, items: ['قاعة الأسطورة الكبرى', 'بوفيه عشاء ملكي فاخر', 'تنسيق وديكور الكوشة الحديثة', 'الضيافة الذهبية'], desc: 'عرض شامل يتضمن حجز قصر الأفراح مع الخدمات الأساسية بخصم 15%.' }
  ]);

  // Pricing Engine states
  const [pricingRules, setPricingRules] = useState<any[]>([
    { id: 'PR-26-00000001', name: 'السعر الأساسي', type: 'base', amount: 15000, appliesTo: 'جميع الأيام', status: 'نشط' },
    { id: 'PR-26-00000002', name: 'سعر عطلة نهاية الأسبوع', type: 'weekend', amount: 18500, appliesTo: 'الخميس والجمعة', status: 'نشط' },
    { id: 'PR-26-00000003', name: 'موسم الصيف والمناسبات الكبرى', type: 'seasonal', amount: 20000, appliesTo: 'من 1 يونيو حتى 30 سبتمبر', status: 'معطل' },
    { id: 'PR-26-00000004', name: 'خصم العروض الحصرية للأيام العادية', type: 'deal', amount: 13000, appliesTo: 'أيام الإثنين والثلاثاء', status: 'نشط' },
  ]);

  // Availability states
  const [availabilityWorkingHours, setAvailabilityWorkingHours] = useState('02:00 م - 02:00 ص');
  const [availabilityBlackoutDates, setAvailabilityBlackoutDates] = useState<string[]>(['2026-08-15', '2026-08-16']);
  const [availabilityMaintenanceDays, setAvailabilityMaintenanceDays] = useState<string[]>(['الأحد من كل أسبوع']);
  const [availabilityCapacityLimit, setAvailabilityCapacityLimit] = useState(500);

  // Marketing campaigns and coupons
  const [marketingCoupons, setMarketingCoupons] = useState<any[]>([
    { code: 'LAYLA10', discount: '10%', type: 'percentage', usageCount: 24, maxUsage: 100, status: 'نشط' },
    { code: 'WELCOME500', discount: '500 ر.س', type: 'fixed', usageCount: 12, maxUsage: 50, status: 'نشط' },
    { code: 'WINTER26', discount: '15%', type: 'percentage', usageCount: 0, maxUsage: 200, status: 'غير نشط' }
  ]);

  // Private customer notes & details
  const [customerProfiles, setCustomerProfiles] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem(`provider_customer_profiles_${currentProviderName}`);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [
      { id: 'CUST-01', name: 'فيصل السديري', bookingsCount: 3, totalSpend: 34500, phone: '0551234567', notes: 'يفضل التنسيق الخارجي مع بوفيه اللحوم والقهوة المرة.' },
      { id: 'CUST-02', name: 'سارة عبد الله', bookingsCount: 2, totalSpend: 28000, phone: '0567890123', notes: 'عميلة دقيقة جداً تهتم بالإضاءة وصوت الموسيقى الهادئة.' },
      { id: 'CUST-03', name: 'أروى العتيبي', bookingsCount: 1, totalSpend: 15000, phone: '0543210987', notes: 'عميلة باقة الأساسية تطلب مشرفين استقبال إضافيين دائماً.' }
    ];
  });

  // Save customerProfiles when updated
  useEffect(() => {
    try {
      localStorage.setItem(`provider_customer_profiles_${currentProviderName}`, JSON.stringify(customerProfiles));
    } catch {}
  }, [customerProfiles, currentProviderName]);

  // Live notification state
  const [liveNotifications, setLiveNotifications] = useState<any[]>([
    { id: 'NT-1', type: 'booking', text: 'تم إنشاء حجز جديد رقم BKG-26-0000000010 بقيمة 15,000 ر.س.', time: 'منذ دقيقة واحدة', unread: true },
    { id: 'NT-2', type: 'payment', text: 'تم إيداع دفعة سداد جديدة بقيمة 4,500 ر.س لمحفظتك.', time: 'منذ ١٠ دقائق', unread: true },
    { id: 'NT-3', type: 'payout', text: 'تمت الموافقة على تحويل مبلغ التسوية البنكية بقيمة 17,550 ر.س.', time: 'منذ ساعتين', unread: false },
    { id: 'NT-4', type: 'review', text: 'حصلت على تقييم جديد ممتاز (٥ نجوم) من العميل عمر القحطاني.', time: 'منذ يوم واحد', unread: false }
  ]);

  // --- INVENTORY & SUPPLIER SYSTEM STATES (BOS EXTENSION) ---
  const [inventoryItems, setInventoryItems] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_inventory_${currentProviderName}`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'ITM-26-0000000001', name: 'سجاد ملكي أحمر مذهب (VIP)', category: 'أثاث ومفروشات', total: 120, available: 85, inUse: 35, threshold: 20, branch: 'فرع الرياض الرئيسي', status: 'متوفر', statusColor: 'emerald', storageLoc: 'مستودع أ', custodian: 'خالد الرويلي', condition: 'ممتازة', desc: 'سجاد أحمر فاخر مهدب بخيوط مذهبة للممرات والمنصات الرئيسية.' },
      { id: 'ITM-26-0000000002', name: 'كراسي كلاسيك ذهبية مخملية', category: 'أثاث ومفروشات', total: 600, available: 450, inUse: 150, threshold: 100, branch: 'فرع الرياض الرئيسي', status: 'متوفر', statusColor: 'emerald', storageLoc: 'مستودع أ', custodian: 'خالد الرويلي', condition: 'ممتازة', desc: 'كراسي حديدية قوية مطلية باللون الذهبي المقاوم للخدش مغطاة بمخمل أحمر داكن.' },
      { id: 'ITM-26-0000000003', name: 'بوفيه ضيافة ستانلس ستيل متحرك', category: 'أدوات ضيافة وبوفيه', total: 10, available: 2, inUse: 8, threshold: 3, branch: 'فرع شمال الرياض', status: 'منخفض', statusColor: 'amber', storageLoc: 'مستودع ب', custodian: 'أحمد السالم', condition: 'جيدة', desc: 'طاولات بوفيه متحركة مع سخانات ستانلس ستيل وحافظات حرارية للوجبات الرئيسية.' },
      { id: 'ITM-26-0000000004', name: 'نظام سماعات لاسلكية Shure VIP', category: 'أجهزة إلكترونية وصوتيات', total: 8, available: 5, inUse: 3, threshold: 2, branch: 'فرع شمال الرياض', status: 'متوفر', statusColor: 'emerald', storageLoc: 'مستودع ب', custodian: 'أحمد السالم', condition: 'ممتازة', desc: 'ميكروفونات وسماعات احترافية لاسلكية عالية النقاوة لتغطية حية داخل الصالات.' },
      { id: 'ITM-26-0000000005', name: 'مباخر فخمة ذكية مذهبة', category: 'أدوات ضيافة وبوفيه', total: 30, available: 30, inUse: 0, threshold: 5, branch: 'فرع الرياض الرئيسي', status: 'متوفر', statusColor: 'emerald', storageLoc: 'مستودع أ', custodian: 'خالد الرويلي', condition: 'ممتازة', desc: 'مباخر تقليدية بتصميم نجدي مطلي بماء الذهب مجهزة بوحدات إشعال ذكي آمن.' },
      { id: 'ITM-26-0000000006', name: 'باقات ورد طبيعي هولندي عالي الجودة', category: 'مستلزمات مستهلكة', total: 50, available: 3, inUse: 47, threshold: 10, branch: 'فرع الرياض الرئيسي', status: 'منخفض', statusColor: 'amber', storageLoc: 'غرفة التنسيق', custodian: 'أحمد الشافعي', condition: 'ممتازة', desc: 'ورود طبيعية مستوردة لغايات التنسيق اللوجستي الفوري لممرات العرسان.' },
      { id: 'ITM-26-0000000007', name: 'أطقم مناديل مخملية مطرزة بشعار ليلة', category: 'مستلزمات مستهلكة', total: 1000, available: 0, inUse: 1000, threshold: 200, branch: 'فرع شمال الرياض', status: 'نفذت الكمية', statusColor: 'red', storageLoc: 'مستودع ب', custodian: 'سارة العتيبي', condition: 'جديدة', desc: 'علب وأطقم مناديل قماشية فاخرة تحمل التطريز الذهبي لعلامة ليلة التجارية.' }
    ];
  });

  const [suppliersData, setSuppliersData] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_suppliers_${currentProviderName}`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'SUP-26-00000001', name: 'شركة الضيافة الفاخرة المحدودة', category: 'ضيافة وبوفيه', contact: 'أبو فهد العتيبي', phone: '0501112223', contracts: 3, volume: '25,000 ر.س', rating: 4.9, compliance: 'معتمد رسمياً', statusColor: 'emerald', address: 'الرياض - طريق التخصصي', email: 'v-p-catering@layla.com', taxId: '310294829100003', iban: 'SA8240000000111122223333', duration: '12', cost: '120000' },
      { id: 'SUP-26-00000002', name: 'مؤسسة أنوار الإبداع للصوتيات والإضاءة', category: 'أجهزة إلكترونية وصوتيات', contact: 'م. كريم المصري', phone: '0542223334', contracts: 1, volume: '12,400 ر.س', rating: 4.7, compliance: 'معتمد رسمياً', statusColor: 'emerald', address: 'الرياض - حراج العليا', email: 'creative-light@layla.com', taxId: '310492850200003', iban: 'SA8240000000444455556666', duration: '24', cost: '80000' },
      { id: 'SUP-26-00000003', name: 'مزرعة زهور الربيع الفاخرة', category: 'مستلزمات مستهلكة', contact: 'أحمد الشافعي', phone: '0563334445', contracts: 2, volume: '8,500 ر.س', rating: 4.8, compliance: 'معتمد رسمياً', statusColor: 'emerald', address: 'جدة - طريق الحرمين', email: 'spring-flowers@layla.com', taxId: '310582910400003', iban: 'SA8240000000777788889999', duration: '12', cost: '45000' },
      { id: 'SUP-26-00000004', name: 'شركة الحلول الرقمية لبطاقات الدعوة', category: 'مستندات ومطبوعات', contact: 'خالد الحسن', phone: '0554445556', contracts: 0, volume: '0 ر.س', rating: 4.2, compliance: 'قيد المراجعة', statusColor: 'amber', address: 'الدمام - شارع المعارض', email: 'digital-inv@layla.com', taxId: '310928405800003', iban: 'SA8240000000101020203030', duration: '6', cost: '20000' }
    ];
  });

  const [supplyRequests, setSupplyRequests] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_supply_requests_${currentProviderName}`);
    if (stored) return JSON.parse(stored);
    return [
      { id: 'SRV-26-0000000001', supplier: 'شركة الضيافة الفاخرة المحدودة', item: 'تأمين طاقم ضيافة VIP إضافي لحفل عائلة الرويلي', qty: 1, branch: 'فرع الرياض الرئيسي', cost: 1500, status: 'مكتمل ومسلّم', date: '2026-07-15' },
      { id: 'SRV-26-0000000002', supplier: 'مزرعة زهور الربيع الفاخرة', item: 'توريد كوشة ورد طبيعي هولندي منسق', qty: 50, branch: 'فرع الرياض الرئيسي', cost: 3500, status: 'تحت التنفيذ', date: '2026-07-20' },
      { id: 'SRV-26-0000000003', supplier: 'مؤسسة أنوار الإبداع للصوتيات والإضاءة', item: 'تأجير نظام إضاءة متحركة ليزرية للممر', qty: 1, branch: 'فرع شمال الرياض', cost: 2000, status: 'تحت التنفيذ', date: '2026-07-22' }
    ];
  });

  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('all');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [supplierCategory, setSupplierCategory] = useState('all');

  const [showAddInventoryForm, setShowAddInventoryForm] = useState(false);
  const [showAddSupplierForm, setShowAddSupplierForm] = useState(false);
  const [showAddSupplyRequestForm, setShowAddSupplyRequestForm] = useState(false);

  // --- WIZARDS & MODALS FOR INVENTORY & SUPPLIERS ---
  // Inventory Wizard Inputs
  const [invWizStep, setInvWizStep] = useState(1);
  const [invWizName, setInvWizName] = useState('');
  const [invWizCategory, setInvWizCategory] = useState('أثاث ومفروشات');
  const [invWizDesc, setInvWizDesc] = useState('');
  const [invWizTotal, setInvWizTotal] = useState('50');
  const [invWizBranch, setInvWizBranch] = useState('فرع الرياض الرئيسي');
  const [invWizLocation, setInvWizLocation] = useState('مستودع أ');
  const [invWizThreshold, setInvWizThreshold] = useState('10');
  const [invWizCustodian, setInvWizCustodian] = useState('خالد الرويلي');
  const [invWizCondition, setInvWizCondition] = useState('ممتازة');

  // Supplier Wizard Inputs
  const [supWizStep, setSupWizStep] = useState(1);
  const [supWizName, setSupWizName] = useState('');
  const [supWizCategory, setSupWizCategory] = useState('ضيافة وبوفيه');
  const [supWizAddress, setSupWizAddress] = useState('الرياض - طريق الملك فهد');
  const [supWizContact, setSupWizContact] = useState('');
  const [supWizPhone, setSupWizPhone] = useState('');
  const [supWizEmail, setSupWizEmail] = useState('');
  const [supWizTaxId, setSupWizTaxId] = useState('');
  const [supWizIban, setSupWizIban] = useState('');
  const [supWizDuration, setSupWizDuration] = useState('12');
  const [supWizCost, setSupWizCost] = useState('50000');
  const [supWizCompliance, setSupWizCompliance] = useState('معتمد رسمياً');

  // Editing & Viewing States for Inventory and Suppliers
  const [editingInvItem, setEditingInvItem] = useState<any>(null);
  const [viewingInvItem, setViewingInvItem] = useState<any>(null);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [viewingSupplier, setViewingSupplier] = useState<any>(null);

  const [isEditInvOpen, setIsEditInvOpen] = useState(false);
  const [isViewInvOpen, setIsViewInvOpen] = useState(false);
  const [isEditSupplierOpen, setIsEditSupplierOpen] = useState(false);
  const [isViewSupplierOpen, setIsViewSupplierOpen] = useState(false);

  // New supply request inputs
  const [newReqSupplierId, setNewReqSupplierId] = useState('');
  const [newReqItem, setNewReqItem] = useState('');
  const [newReqQty, setNewReqQty] = useState('1');
  const [newReqCost, setNewReqCost] = useState('1000');
  const [newReqBranch, setNewReqBranch] = useState('فرع الرياض الرئيسي');

  // Business profile details
  const [profileBusinessName, setProfileBusinessName] = useState(currentProviderName);
  const [profileBusinessDesc, setProfileBusinessDesc] = useState('نقدم أرقى قاعات المناسبات الفاخرة مع تجهيزات متكاملة من الصوت، الإضاءة، والضيافة لتخليد ذكريات ليلتكم المميزة بأعلى معايير الإتقان.');
  const [profileBusinessCR, setProfileBusinessCR] = useState('1010765432');
  const [profileBusinessContact, setProfileBusinessContact] = useState('0551234567');

  // New Wizard and Profile fields
  const [isWizardForceOpen, setIsWizardForceOpen] = useState(false);
  const [profileEntityType, setProfileEntityType] = useState('شركة');
  const [profileRepresentativeEmail, setProfileRepresentativeEmail] = useState('contact@layla-venues.com');
  const [profileRepresentativePhone, setProfileRepresentativePhone] = useState('0551234567');
  const [profileLogo, setProfileLogo] = useState<string | null>(null);
  
  // Coordinates & Privacy Settings
  const [profileLat, setProfileLat] = useState('24.7618');
  const [profileLng, setProfileLng] = useState('46.6264');
  const [showProviderToCustomers, setShowProviderToCustomers] = useState(true);
  const [profileUsername, setProfileUsername] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  const [profileRegion, setProfileRegion] = useState('منطقة الرياض');
  const [profileCity, setProfileCity] = useState('الرياض');
  const [profileNationalAddress, setProfileNationalAddress] = useState('الملقا 4567، الرياض، المملكة العربية السعودية');
  const [profileMapLink, setProfileMapLink] = useState('https://maps.google.com/?q=24.7618,46.6264');
  
  const [wizVatStatus, setWizVatStatus] = useState('مسجل');
  const [wizTaxId, setWizTaxId] = useState('301234567800003');
  const [wizIban, setWizIban] = useState('SA9340000000123456789012');
  const [wizBankName, setWizBankName] = useState('البنك الأهلي السعودي');
  
  // Documents Checklist (Merged Step)
  const [wizDocCR, setWizDocCR] = useState<string | null>('cr_certificate_signed.pdf');
  const [wizDocVAT, setWizDocVAT] = useState<string | null>('vat_registration_approved.pdf');
  const [wizDocChamber, setWizDocChamber] = useState<string | null>('chamber_of_commerce_cert.pdf');
  const [wizDocCRChecked, setWizDocCRChecked] = useState(true);
  const [wizDocVATChecked, setWizDocVATChecked] = useState(true);
  const [wizDocChamberChecked, setWizDocChamberChecked] = useState(true);
  
  const [wizDeclarationAccepted, setWizDeclarationAccepted] = useState(false);

  // Logo upload with strict validation: <= 500KB, JPEG/PNG/WebP, dimensions <= 960x960
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      showNotification('warning', 'عفواً، صيغة الملف غير مدعومة. الصيغ المسموحة هي JPEG, PNG, WebP فقط.');
      return;
    }

    if (file.size > 500 * 1024) {
      showNotification('warning', 'عفواً، حجم صورة الشعار يتجاوز الحد الأقصى المسموح به (500 كيلوبايت).');
      return;
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      if (img.width > 960 || img.height > 960) {
        showNotification('warning', `أبعاد الشعار (${img.width}x${img.height} بكسل) تتجاوز الحد الأقصى المسموح به (960x960 بكسل).`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setProfileLogo(dataUrl);
        showNotification('success', 'تم رفع وتوثيق شعار المنشأة بنجاح بحفظ حقيقي!');
      };
      reader.readAsDataURL(file);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      showNotification('warning', 'تعذر قراءة ملف الصورة المختارة.');
    };
    img.src = objectUrl;
  };

  // Auto Location Detection & Google Maps Integration
  const handleAutoLocation = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      showNotification('info', 'جاري كشف موقعك الجغرافي الفعلي بواسطة خرائط Google واستشعار المكان...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude.toFixed(6);
          const lng = position.coords.longitude.toFixed(6);
          setProfileLat(lat);
          setProfileLng(lng);
          const link = `https://maps.google.com/?q=${lat},${lng}`;
          setProfileMapLink(link);
          setProfileNationalAddress(`حي الملقا - ${profileCity} (${lat}, ${lng})`);
          showNotification('success', `تم كشف إحداثيات موقعك الجغرافي (${lat}, ${lng}) وتوليد العنوان الوطني بالخرائط!`);
          setIsLocationModalOpen(true);
        },
        () => {
          const defaultLat = '24.7618';
          const defaultLng = '46.6264';
          setProfileLat(defaultLat);
          setProfileLng(defaultLng);
          setProfileMapLink(`https://maps.google.com/?q=${defaultLat},${defaultLng}`);
          setProfileNationalAddress(`الرياض، المملكة العربية السعودية (${defaultLat}, ${defaultLng})`);
          showNotification('warning', 'تم ضبط الإحداثيات الافتراضية للرياض (24.7618, 46.6264) وتوليد رابط خرائط Google.');
          setIsLocationModalOpen(true);
        },
        { timeout: 8000, enableHighAccuracy: true }
      );
    } else {
      showNotification('warning', 'متصفحك لا يدعم الخدمة الحركية لتحديد الموقع الجغرافي.');
    }
  };

  // Interactive Form Inputs for Layla ERP
  const [newBranchName, setNewBranchName] = useState('');
  const [newBranchCity, setNewBranchCity] = useState('الرياض');
  const [newBranchPhone, setNewBranchPhone] = useState('');
  const [newBranchAddress, setNewBranchAddress] = useState('');

  // Persist states to localStorage for strict multi-tenancy data isolation
  useEffect(() => {
    localStorage.setItem(`provider_inventory_${currentProviderName}`, JSON.stringify(inventoryItems));
  }, [inventoryItems, currentProviderName]);

  useEffect(() => {
    localStorage.setItem(`provider_suppliers_${currentProviderName}`, JSON.stringify(suppliersData));
  }, [suppliersData, currentProviderName]);

  useEffect(() => {
    localStorage.setItem(`provider_supply_requests_${currentProviderName}`, JSON.stringify(supplyRequests));
  }, [supplyRequests, currentProviderName]);

  useEffect(() => {
    localStorage.setItem(`provider_branches_${currentProviderName}`, JSON.stringify(profileBranches));
  }, [profileBranches, currentProviderName]);

  useEffect(() => {
    localStorage.setItem(`provider_employees_${currentProviderName}`, JSON.stringify(profileEmployees));
  }, [profileEmployees, currentProviderName]);

  useEffect(() => {
    localStorage.setItem(`provider_settings_${currentProviderName}`, JSON.stringify(providerSettings));
  }, [providerSettings, currentProviderName]);

  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpBranch, setNewEmpBranch] = useState('فرع الرياض الرئيسي');
  const [newEmpPerm, setNewEmpPerm] = useState('صلاحيات كاملة');

  const [newSerName, setNewSerName] = useState('');
  const [newSerCat, setNewSerCat] = useState('ضيافة');
  const [newSerPrice, setNewSerPrice] = useState('');
  const [newSerDesc, setNewSerDesc] = useState('');

  const [newRuleName, setNewRuleName] = useState('');
  const [newRuleType, setNewRuleType] = useState('weekend');
  const [newRuleAmount, setNewRuleAmount] = useState('');
  const [newRuleApplies, setNewRuleApplies] = useState('');

  const [newCouponCode, setNewCouponCode] = useState('');
  const [newCouponDiscount, setNewCouponDiscount] = useState('');
  const [newCouponType, setNewCouponType] = useState('percentage');

  const [newBlackoutDate, setNewBlackoutDate] = useState('');
  
  const [selectedCustIdForNote, setSelectedCustIdForNote] = useState('CUST-01');
  const [newCustNote, setNewCustNote] = useState('');

  const [selectedBkgIdForTimeline, setSelectedBkgIdForTimeline] = useState('');
  const [selectedBkgStatusForTimeline, setSelectedBkgStatusForTimeline] = useState('');

  // Brand Identity Wizard States
  const [identityWizStep, setIdentityWizStep] = useState(1);
  const [identityWizData, setIdentityWizData] = useState({
    businessName: profileBusinessName,
    crNumber: profileBusinessCR,
    vatNumber: '301234567800003',
    crExpiry: '2029-06-30',
    contactPhone: profileBusinessContact,
    officialEmail: 'info@laylaevents.com',
    website: 'https://laylaevents.com',
    twitter: '@layla_events',
    instagram: '@layla.events',
    description: profileBusinessDesc,
    slogan: 'ليلتكم الاستثنائية بلمسة ملكية',
    primaryColor: '#4f46e5',
    secondaryColor: '#f59e0b',
    logoSimUrl: '',
  });

  // Venue Addition Wizard States
  const [venueWizStep, setVenueWizStep] = useState(1);
  const [venueWizData, setVenueWizData] = useState({
    name: '',
    providerName: 'ليالينا للضيافة والاحتفالات',
    showProviderToCustomers: true,
    type: 'قصر أفراح',
    contactPhone: '0551234567',
    contactPhone2: '0557654321',
    description: 'قاعة مناسبات كبرى مصممة بأحدث الديكورات العصرية ومجهزة بكافة المرافق الفاخرة لتلائم المناسبات الكبرى وحفلات الزواج.',
    region: 'منطقة الرياض',
    city: 'الرياض',
    nationalAddress: '1234 الملقا، الرياض، المملكة العربية السعودية',
    addressDetails: 'طريق الملك سلمان بن عبدالعزيز، بجانب المجمع التجاري الكبير، مخرج ٤',
    capacity: '400',
    tablesCount: '50',
    chairsCount: '400',
    features: {
      ac: true,
      stage: true,
      ledScreens: false,
      soundSystem: true,
      brideRoom: true,
      parking: true,
    },
    basePrice: '15000',
    securityDeposit: '3000',
    refundPeriod: '14',
    morningPrice: '10000',
    eveningPrice: '15000',
    fullDayPrice: '22000',
    weekendPricingEnabled: true,
    increaseType: 'percentage', // 'percentage' | 'fixed'
    morningIncrease: '10',
    eveningIncrease: '15',
    fullDayIncrease: '12',
    pricingPattern: 'Hybrid', // 'Comprehensive' | 'Individual' | 'Hybrid'
    isTaxExempt: false,
    taxNumber: '301234567800003',
    additionalServicesBundle: 'باقة الضيافة المتكاملة (شامل طاقم تقديم ومفتشات جوال وبخور ممتاز)',
    venueRules: 'يمنع التدخين نهائياً داخل أروقة القاعة، يمنع إدخال الأطفال دون سن السابعة بدون مرافق، يلتزم المستأجر بإنهاء الحفل في الموعد المتفق عليه.',
    contractTerms: 'يلتزم الطرف الأول بتوفير القاعة نظيفة وجاهزة بالمرافق المذكورة، يلتزم الطرف الثاني بسداد مبلغ التأمين وتوقيع العقد النهائي قبل ٣ أيام من الحفل.',
    facilitiesAmenities: 'صالة طعام منفصلة، مصعد خاص لكبار السن والعروس، أجنحة عائلية واسعة، مطبخ تحضيري مجهز بالكامل.',
    cancellationPolicy: 'strict',
    fulfillmentPolicy: 'Hybrid Allowed', // 'Internal Only' | 'Internal Preferred' | 'Hybrid Allowed'
    images: [] as string[],
    closedPackages: [] as Array<{ id: string; name: string; price: string; services: string[]; desc: string }>,
    additionalServices: [] as Array<{ id: string; name: string; price: string; category: string; description: string }>,
    albumImages: [] as Array<{ name: string; size: number; dataUrl: string }>,
    civilDefenseCert: true,
    municipalityLicense: true,
    commercialRegister: true,
    taxCert: true,
    adminStatus: 'معلق بانتظار الاعتماد', // 'معتمدة من الإدارة' | 'معلقة بانتظار الاعتماد' | 'مرفوضة'
    providerStatus: 'نشط ومتاح للعملاء', // 'نشط ومتاح للعملاء' | 'مغلق مؤقتاً'
    pledgeAccuracy: false,
  });

  // State for package creation form inside wizard
  const [newPkgName, setNewPkgName] = useState('');
  const [newPkgPrice, setNewPkgPrice] = useState('');
  const [newPkgDesc, setNewPkgDesc] = useState('');
  const [newPkgServiceInput, setNewPkgServiceInput] = useState('');
  const [newPkgServices, setNewPkgServices] = useState<string[]>([]);

  // State for complementary service (addon) creation form inside wizard
  const [newAddonName, setNewAddonName] = useState('');
  const [newAddonPrice, setNewAddonPrice] = useState('');
  const [newAddonCategory, setNewAddonCategory] = useState('ضيافة');
  const [newAddonDesc, setNewAddonDesc] = useState('');

  // State for photo album synthesis animation inside wizard
  const [isSynthesizingAlbum, setIsSynthesizingAlbum] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState(0);
  const [synthesisStepText, setSynthesisStepText] = useState('');

  // Service Addition Wizard States
  const [serviceWizStep, setServiceWizStep] = useState(1);
  const [serviceWizRole, setServiceWizRole] = useState<'provider' | 'admin'>('provider');
  const [serviceWizData, setServiceWizData] = useState({
    name: '',
    category: 'ضيافة',
    provider: currentProviderName || 'ليالينا للضيافة والاحتفالات',
    desc: '',
    unitPrice: '150',
    unit: 'ساعة',
    dailyStock: '5',
    cancellationPeriod: '٤٨ ساعة قبل موعد الفعالية',
    coverageRegions: ['منطقة الرياض'] as string[],
    coverageCities: ['الرياض'] as string[],
    adminStatus: 'معلق بانتظار الاعتماد', // 'معلق بانتظار الاعتماد' | 'معتمد من الإدارة' | 'مرفوض'
    serviceStatus: 'نشط', // 'نشط' | 'غير نشط'
    terms: 'يلتزم العميل بتوفير متطلبات التشغيل المتفق عليها. تخضع عمليات الإلغاء لسياسة الاسترداد والمهلة المحددة.',
    images: [] as Array<{ name: string; size: number; preview: string; width?: number; height?: number }>,
    fulfillmentPolicy: 'Internal', // 'Internal' | 'Hybrid'
    dynamicWeekend: true,
    dynamicSeasonal: false,
    dynamicVolume: false,
  });

  const [providerPlan, setProviderPlan] = useState<'starter' | 'pro'>('starter');
  const [purchasedDynamicPricingAddon, setPurchasedDynamicPricingAddon] = useState(false);

  const hasDynamicPricingAccess = providerPlan === 'pro' || purchasedDynamicPricingAddon;

  const [catalogActiveInnerTab, setCatalogActiveInnerTab] = useState<'halls' | 'services' | 'packages'>('halls');
  const [reportsActiveInnerTab, setReportsActiveInnerTab] = useState<'financial' | 'operational' | 'branches'>('financial');

  // Pricing Dynamic Simulator inputs
  const [simBasePrice, setSimBasePrice] = useState('15000');
  const [simDayType, setSimDayType] = useState('weekend'); // 'weekday' | 'weekend'
  const [simSeason, setSimSeason] = useState('high'); // 'normal' | 'high'
  const [simDeals, setSimDeals] = useState('none'); // 'none' | 'promo'

  const [opsActiveTab, setOpsActiveTab] = useState<'live' | 'calendar' | 'tasks' | 'timeline'>('live');
  const [opsSearchQuery, setOpsSearchQuery] = useState('');
  const [opsStatusFilter, setOpsStatusFilter] = useState('all');

  // --- OPERATIONS CENTER STATE ---
  const [selectedPipelineNode, setSelectedPipelineNode] = useState<'events' | 'independent' | 'pending' | 'support' | 'payouts'>('events');
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-07-22');
  const [calendarMonth, setCalendarMonth] = useState<number>(7); // July
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [selectedTimelineCategory, setSelectedTimelineCategory] = useState<'all' | 'logistics' | 'finance' | 'system'>('all');
  
  // Custom manual timeline logging state
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

  // Staff roles dictionary for Staff Assignment Engine
  const STAFF_ROLES: Record<string, string[]> = {
    booking: ['Branch Manager', 'Reception', 'Supervisor'],
    order: ['Photography Team', 'Catering Team', 'Decor Team'],
    venue: ['Cleaning Team', 'Maintenance Team']
  };

  const [customTasks, setCustomTasks] = useState<Record<string, string[]>>(() => {
    try {
      const stored = localStorage.getItem(`provider_custom_tasks_${currentProviderName}`);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const saveCustomTasks = (nextTasks: typeof customTasks) => {
    setCustomTasks(nextTasks);
    localStorage.setItem(`provider_custom_tasks_${currentProviderName}`, JSON.stringify(nextTasks));
  };

  // Interactive withdrawal states
  const [payoutAmount, setPayoutAmount] = useState<string>('15000');
  const [isPayoutProcessing, setIsPayoutProcessing] = useState<boolean>(false);

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

  const [activeInvoice, setActiveInvoice] = useState<any>(null);

  // Dynamic Action states for BOS Dashboard
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
    { id: 'L-15', title: 'تنسيق الطاولات والشموع الرومانسية', type: 'service', hall: 'قاعة اللؤلؤة المصونة', branch: 'الفرع الرئيسي', manager: 'لمياء الحربي', status: 'مؤكد وجاهز', statusColor: 'emerald', time: '05:00 م' }
  ];

  // Escrow / Wallet withdrawal States
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

  const formatCurrency = (val: number) => typeof val === 'number' ? `${val.toLocaleString('ar-SA')} ر.س` : (val || '');

  // 1. Get halls owned by THIS provider
  const myHalls = halls.filter(h => h.provider === currentProviderName);
  const myHallNames = myHalls.map(h => h.name);
  const myBookings = bookings.filter(b => myHallNames.includes(b.hall));
  const mySupportRequests = (supportServiceRequests || []).filter(r => r.providerName === currentProviderName || r.provider === currentProviderName);

  const getDailyPerformanceData = () => {
    const result = [];
    const now = new Date();
    
    // Get provider's actual bookings
    const dailyBookings = myBookings;
    
    // Get provider's actual support requests
    const dailyRequests = mySupportRequests;
    
    const daysArabic = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateString = d.toISOString().split('T')[0];
      
      const dayBookings = dailyBookings.filter(b => (b.date || '').split('T')[0] === dateString || (b.createdAt || '').split('T')[0] === dateString);
      const bookingsCount = dayBookings.length;
      const bookingsSales = dayBookings.reduce((sum, b) => sum + (b.amount || b.price || b.totalPrice || 0), 0);
      
      const totalHallsCount = myHalls.length || 1;
      const hallOccupancyRate = Math.min(Math.round((bookingsCount / totalHallsCount) * 100), 100);

      const dayRequests = dailyRequests.filter(r => (r.date || '').split('T')[0] === dateString || (r.createdAt || '').split('T')[0] === dateString);
      const ordersCount = dayRequests.length;
      const ordersSales = dayRequests.reduce((sum, r) => sum + (r.price || r.amount || 0), 0);
      
      const serviceOccupancyRate = Math.min(Math.round((ordersCount / 5) * 100), 100);

      result.push({
        date: dateString,
        dayName: daysArabic[d.getDay()],
        bookingsCount,
        bookingsSales,
        hallOccupancyRate,
        ordersCount,
        ordersSales,
        serviceOccupancyRate
      });
    }

    return result;
  };

  const dailyPerfData = getDailyPerformanceData();

  // Filter helper specifically returning only values within chosen period and owned by this provider
  const isDateInPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    
    const parts = dateStr.split('T')[0].split('-');
    if (parts.length < 3) return false;
    const year = parts[0];
    const month = parts[1];
    
    const targetYear = selectedDashboardYear || '2026';
    const targetMonth = selectedDashboardMonth || '05';
    
    if (dashboardPeriod === 'monthly') {
      return year === targetYear && month === targetMonth;
    } else if (dashboardPeriod === 'yearly') {
      if (yearlyPeriodType === 'academic') {
        const prevYear = String(parseInt(targetYear) - 1);
        const startAcademic = `${prevYear}-09-01`;
        const endAcademic = `${targetYear}-08-31`;
        const currentDayStr = dateStr.split('T')[0];
        return currentDayStr >= startAcademic && currentDayStr <= endAcademic;
      } else if (yearlyPeriodType === 'zakat') {
        const prevYear = String(parseInt(targetYear) - 1);
        const startZakat = `${prevYear}-03-10`; 
        const endZakat = `${targetYear}-03-09`;
        const currentDayStr = dateStr.split('T')[0];
        return currentDayStr >= startZakat && currentDayStr <= endZakat;
      } else {
        return year === targetYear;
      }
    } else if (dashboardPeriod === 'all') {
      return true;
    } else if (dashboardPeriod === 'custom') {
      if (!customStartDate || !customEndDate) return true;
      return dateStr >= customStartDate && dateStr <= customEndDate;
    }
    return true;
  };

  const getMonthlyGrowthData = () => {
    const yearToUse = (dashboardPeriod === 'yearly' || dashboardPeriod === 'monthly') ? parseInt(selectedDashboardYear) : 2026;
    const monthsArabic = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    
    const data = monthsArabic.map((name, index) => {
      const monthNum = index + 1;
      const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
      
      const monthBookings = bookings.filter(b => {
        const parts = (b.date || '').split('-');
        if (parts.length >= 2) {
          const bYear = parseInt(parts[0]);
          const bMonth = parts[1];
          const matchesProvider = myHallNames.includes(b.hall);
          return bYear === yearToUse && bMonth === monthStr && matchesProvider;
        }
        return false;
      });
      
      return {
        name,
        count: monthBookings.length,
        revenue: monthBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0)
      };
    });

    return data.map((item, index) => {
      if (index === 0) {
        return { ...item, growthRate: 0 };
      }
      const prevCount = data[index - 1].count;
      const growthRate = prevCount > 0 ? Math.round(((item.count - prevCount) / prevCount) * 100) : 0;
      return { ...item, growthRate };
    });
  };

  const growthData = getMonthlyGrowthData();

  const getRevenueAndBookingsForDateRange = (start: string, end: string) => {
    const periodBookings = bookings.filter(b => {
      const matchesProvider = myHallNames.includes(b.hall);
      return b.date >= start && b.date <= end && matchesProvider;
    });
    const revenue = periodBookings.reduce((sum, b) => sum + (b.paymentStatus === 'مدفوع' ? b.amount : 0), 0);
    return { count: periodBookings.length, revenue };
  };

  const getRevenueAndBookingsForMonthYear = (monthStr: string, yearStr: string) => {
    const periodBookings = bookings.filter(b => {
      const parts = (b.date || '').split('-');
      if (parts.length >= 2) {
        const bYear = parts[0];
        const bMonth = parts[1];
        const matchesProvider = myHallNames.includes(b.hall);
        return bYear === yearStr && bMonth === monthStr && matchesProvider;
      }
      return false;
    });
    const revenue = periodBookings.reduce((sum, b) => sum + (b.paymentStatus === 'مدفوع' ? b.amount : 0), 0);
    return { count: periodBookings.length, revenue };
  };

  const getRevenueAndBookingsForYear = (yearStr: string) => {
    const periodBookings = bookings.filter(b => {
      const parts = (b.date || '').split('-');
      if (parts.length >= 1) {
        const bYear = parts[0];
        const matchesProvider = myHallNames.includes(b.hall);
        return bYear === yearStr && matchesProvider;
      }
      return false;
    });
    const revenue = periodBookings.reduce((sum, b) => sum + (b.paymentStatus === 'مدفوع' ? b.amount : 0), 0);
    return { count: periodBookings.length, revenue };
  };

  const getPeriodComparison = () => {
    let currentVal = { count: 0, revenue: 0 };
    let previousVal = { count: 0, revenue: 0 };
    let label = '';
    
    const targetYear = selectedDashboardYear || '2026';
    const targetMonth = selectedDashboardMonth || '05';

    if (dashboardPeriod === 'monthly') {
      const mNum = parseInt(targetMonth, 10);
      const yNum = parseInt(targetYear, 10);
      
      currentVal = getRevenueAndBookingsForMonthYear(targetMonth, targetYear);
      
      let prevMonth = mNum - 1;
      let prevYear = yNum;
      if (prevMonth === 0) {
        prevMonth = 12;
        prevYear = yNum - 1;
      }
      const prevMonthStr = prevMonth < 10 ? `0${prevMonth}` : `${prevMonth}`;
      const prevYearStr = String(prevYear);
      previousVal = getRevenueAndBookingsForMonthYear(prevMonthStr, prevYearStr);
      label = `مقارنة بالشهر السابق (شهر ${prevMonthStr} / ${prevYearStr})`;
      
    } else if (dashboardPeriod === 'yearly') {
      const yNum = parseInt(targetYear, 10);
      
      currentVal = getRevenueAndBookingsForYear(targetYear);
      
      const prevYearStr = String(yNum - 1);
      previousVal = getRevenueAndBookingsForYear(prevYearStr);
      label = `مقارنة بالسنة السابقة (${prevYearStr})`;
      
    } else if (dashboardPeriod === 'custom') {
      const start = customStartDate || '2026-05-01';
      const end = customEndDate || '2026-05-31';
      const dStart = new Date(start);
      const dEnd = new Date(end);
      
      const diffTime = Math.abs(dEnd.getTime() - dStart.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      currentVal = getRevenueAndBookingsForDateRange(start, end);
      
      const prevEnd = new Date(dStart.getTime() - (1000 * 60 * 60 * 24));
      const prevStart = new Date(prevEnd.getTime() - (diffDays * 1000 * 60 * 60 * 24));
      
      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];
      
      previousVal = getRevenueAndBookingsForDateRange(prevStartStr, prevEndStr);
      label = `الفترة السابقة (${prevStartStr} إلى ${prevEndStr})`;
      
    } else {
      const myProvBookings = bookings.filter(b => myHallNames.includes(b.hall));
      currentVal = {
        count: myProvBookings.length,
        revenue: myProvBookings.reduce((sum, b) => sum + (b.paymentStatus === 'مدفوع' ? b.amount : 0), 0)
      };
      previousVal = getRevenueAndBookingsForYear('2025');
      label = `مقارنة بسنة 2025 التأسيسية`;
    }
    
    const revGrowthRate = previousVal.revenue > 0 ? Math.round(((currentVal.revenue - previousVal.revenue) / previousVal.revenue) * 100) : 0;
    const countGrowthRate = previousVal.count > 0 ? Math.round(((currentVal.count - previousVal.count) / previousVal.count) * 100) : 0;
    
    return {
      currentRevenue: currentVal.revenue,
      previousRevenue: previousVal.revenue,
      revGrowthRate,
      currentCount: currentVal.count,
      previousCount: previousVal.count,
      countGrowthRate,
      label
    };
  };

  const getProfitComparisonChartData = () => {
    const targetYear = selectedDashboardYear || '2026';
    const targetMonth = selectedDashboardMonth || '05';
    
    if (dashboardPeriod === 'monthly') {
      const mNum = parseInt(targetMonth, 10);
      const yNum = parseInt(targetYear, 10);
      
      let prevMonth = mNum - 1;
      let prevYear = yNum;
      if (prevMonth === 0) { prevMonth = 12; prevYear = yNum - 1; }
      const prevMonthStr = prevMonth < 10 ? `0${prevMonth}` : `${prevMonth}`;
      
      const getWeeklyRevenue = (month: string, year: string) => {
        const mBookings = bookings.filter(b => {
          const p = (b.date || '').split('-');
          const matchesProvider = myHallNames.includes(b.hall);
          return p.length >= 2 && p[0] === year && p[1] === month && b.paymentStatus === 'مدفوع' && matchesProvider;
        });
        const w1 = mBookings.filter(b => parseInt((b.date || '').split('-')[2], 10) <= 7).reduce((sum, b) => sum + b.amount, 0);
        const w2 = mBookings.filter(b => { const d = parseInt((b.date || '').split('-')[2], 10); return d > 7 && d <= 14; }).reduce((sum, b) => sum + b.amount, 0);
        const w3 = mBookings.filter(b => { const d = parseInt((b.date || '').split('-')[2], 10); return d > 14 && d <= 21; }).reduce((sum, b) => sum + b.amount, 0);
        const w4 = mBookings.filter(b => parseInt((b.date || '').split('-')[2], 10) > 21).reduce((sum, b) => sum + b.amount, 0);
        return [w1, w2, w3, w4];
      };
      
      const currentWeeks = getWeeklyRevenue(targetMonth, targetYear);
      const prevWeeks = getWeeklyRevenue(prevMonthStr, String(prevYear));
      
      return [
        { name: 'الأسبوع 1', 'الفترة الحالية': currentWeeks[0], 'الفترة السابقة': prevWeeks[0] },
        { name: 'الأسبوع 2', 'الفترة الحالية': currentWeeks[1], 'الفترة السابقة': prevWeeks[1] },
        { name: 'الأسبوع 3', 'الفترة الحالية': currentWeeks[2], 'الفترة السابقة': prevWeeks[2] },
        { name: 'الأسبوع 4', 'الفترة الحالية': currentWeeks[3], 'الفترة السابقة': prevWeeks[3] }
      ];
    } else if (dashboardPeriod === 'yearly' || dashboardPeriod === 'all') {
      const targetYearStr = targetYear;
      const prevYearStr = String(parseInt(targetYearStr, 10) - 1);
      const monthsArabic = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
      
      return monthsArabic.map((name, index) => {
        const monthNum = index + 1;
        const monthStr = monthNum < 10 ? `0${monthNum}` : `${monthNum}`;
        
        const getMonthRev = (m: string, y: string) => {
          return bookings.filter(b => {
            const p = (b.date || '').split('-');
            const matchesProvider = myHallNames.includes(b.hall);
            return p.length >= 2 && p[0] === y && p[1] === m && b.paymentStatus === 'مدفوع' && matchesProvider;
          }).reduce((sum, b) => sum + b.amount, 0);
        };
        
        return {
          name,
          'الفترة الحالية': getMonthRev(monthStr, targetYearStr),
          'الفترة السابقة': getMonthRev(monthStr, prevYearStr)
        };
      });
    } else {
      const comp = getPeriodComparison();
      return [
        { name: 'بدء النطاق', 'الفترة الحالية': 0, 'الفترة السابقة': 0 },
        { name: 'إجمالي أرباح النطاق المتكامل', 'الفترة الحالية': comp.currentRevenue, 'الفترة السابقة': comp.previousRevenue },
        { name: 'نهاية النطاق', 'الفترة الحالية': comp.currentRevenue, 'الفترة السابقة': comp.previousRevenue }
      ];
    }
  };

  const filteredBookingsByPeriod = bookings.filter(b => isDateInPeriod(b.date));
  const filteredSupportRequestsByPeriod = supportServiceRequests.filter(s => isDateInPeriod(s.date));
  const filteredCampaignsByPeriod = campaigns.filter(c => isDateInPeriod(c.startDate));

  // Provider specific filters
  const filteredBookingsOverview = filteredBookingsByPeriod.filter(b => myHallNames.includes(b.hall));
  const mySupportRequestsPeriod = filteredSupportRequestsByPeriod.filter(r => r.providerName === currentProviderName);
  const myCampaignsData = filteredCampaignsByPeriod.filter((c: any) => c.providerName === currentProviderName); 

  // Calculate quick metrics for the period
  const totalRevenuePeriod = filteredBookingsOverview.reduce((sum, b) => sum + (b.paymentStatus === 'مدفوع' || b.paymentStatus === 'paid' ? b.totalPrice : 0), 0);
  const totalBookingsPeriod = filteredBookingsOverview.length;
  const totalSupportPeriod = mySupportRequestsPeriod.length;
  const totalCampaignsPeriod = myCampaignsData.length;

  const comp = getPeriodComparison();
  const compChartData = getProfitComparisonChartData();

  return (
    <div className="space-y-6 animate-in fade-in duration-300" dir="rtl">
      
      {/* Simulation Controller Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-3 text-right">
        <div className="flex items-center gap-2.5">
          <Sparkles className="w-5 h-5 text-amber-500 animate-spin shrink-0" />
          <div>
            <h4 className="text-xs font-black text-slate-800">أداة محاكاة اختبار المنصة الشاملة (ليلة ERP)</h4>
            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
              يمكنك التبديل الفوري بين <strong>معالج التهيئة التدريجي (Welcome Wizard)</strong> وبين <strong>لوحة تشغيل الأعمال الكاملة (BOS)</strong> لتجربة دورة حياة المزود بدقة.
            </p>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            onClick={() => {
              setIsOnboarded(false);
              setOnboardingStep(1);
              showNotification('info', 'تم تحويل الواجهة إلى معالج التهيئة التدريجي (المزود الجديد).');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${!isOnboarded ? 'bg-amber-500 text-slate-950 border border-amber-600 shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
          >
            📋 معالج التهيئة (جديد)
          </button>
          <button
            onClick={() => {
              setIsOnboarded(true);
              showNotification('success', 'تم تفعيل واجهة نظام تشغيل الأعمال الكاملة (BOS).');
            }}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black transition-all cursor-pointer ${isOnboarded ? 'bg-indigo-600 text-white border border-indigo-700 shadow-sm' : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'}`}
          >
            🚀 لوحة التحكم الكاملة (BOS)
          </button>
        </div>
      </div>



      {(!isOnboarded || isWizardForceOpen) ? (
        <div className="max-w-4xl mx-auto bg-white border border-slate-200 rounded-3xl p-6 shadow-lg text-right flex flex-col justify-between min-h-[640px] max-h-[640px] overflow-hidden relative" dir="rtl" id="layla-bos-wizard">
          {/* Wizard Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="space-y-0.5">
              <h2 className="text-base font-black text-indigo-950 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span>معالج تهيئة وإطلاق مركز العمليات (Layla BOS)</span>
              </h2>
              <p className="text-[11px] text-slate-400">تأسيس وضبط بيانات مزود الخدمة القانونية والتشغيلية</p>
            </div>
            <div className="flex items-center gap-2">
              {(() => {
                const isIndividual = profileEntityType === 'عمل حر' || profileEntityType === 'فرد';
                const totalStepsCount = isIndividual ? 5 : 6;
                return (
                  <span className="text-[10px] font-black text-indigo-900 bg-indigo-50 px-2.5 py-1 rounded-full font-mono">
                    الخطوة {onboardingStep} من {totalStepsCount}
                  </span>
                );
              })()}
              {isWizardForceOpen && (
                <button
                  onClick={() => setIsWizardForceOpen(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-lg transition-all cursor-pointer"
                  title="العودة للوحة التحكم"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Stepper Progress Bar */}
          {(() => {
            const isIndividual = profileEntityType === 'عمل حر' || profileEntityType === 'فرد';
            const stepsList = isIndividual ? [
              { id: 1, name: 'هوية المزود والخصوصية' },
              { id: 2, name: 'العنوان وخرائط Google' },
              { id: 3, name: 'المالية والوثائق' },
              { id: 4, name: 'التعهد والإقرار' },
              { id: 5, name: 'التحقق والجاهزية' }
            ] : [
              { id: 1, name: 'هوية المزود والخصوصية' },
              { id: 2, name: 'العنوان وخرائط Google' },
              { id: 3, name: 'المالية والوثائق' },
              { id: 4, name: 'الفرع الأول' },
              { id: 5, name: 'التعهد والإقرار' },
              { id: 6, name: 'التحقق والجاهزية' }
            ];

            return (
              <div className={`grid gap-1 md:gap-2 py-2 border-b border-slate-50 ${isIndividual ? 'grid-cols-5' : 'grid-cols-6'}`}>
                {stepsList.map((st) => (
                  <div key={st.id} className="space-y-1">
                    <div className={`h-1.5 rounded-full transition-all duration-300 ${onboardingStep >= st.id ? 'bg-indigo-600' : 'bg-slate-100'}`} />
                    <span className={`block text-[9px] font-black text-center truncate ${onboardingStep === st.id ? 'text-indigo-600 font-extrabold' : 'text-slate-400 font-medium'}`}>
                      {st.name}
                    </span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Step Content Area */}
          <div className="flex-1 py-4 overflow-y-auto max-h-[460px] pr-1" id="wizard-step-content">
            
            {/* Step 1: Provider Identity, Real Logo Upload, and Privacy Controls */}
            {onboardingStep === 1 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-500">أدخل الهوية التجارية والنوع القانوني لعلامتكم وشعارها الرسمي، مع ضبط إعدادات الخصوصية واسم المستخدم للعملاء.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Real Interactive Logo Upload with Instant Preview */}
                  <div 
                    className="provider-logo-upload-container md:col-span-1 aspect-square w-full max-w-[200px] mx-auto flex flex-col items-center justify-center p-2 border-2 border-dashed border-indigo-400 dark:border-indigo-400 hover:border-indigo-600 dark:hover:border-indigo-300 rounded-2xl bg-indigo-50/30 dark:bg-slate-800/90 hover:bg-indigo-50/60 transition-all cursor-pointer relative group overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(129,140,248,0.25)]" 
                    onClick={() => {
                      document.getElementById('wizard-logo-file-input')?.click();
                    }}
                  >
                    <input
                      type="file"
                      id="wizard-logo-file-input"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                    {profileLogo ? (
                      <div className="relative w-full h-full p-1.5 flex items-center justify-center animate-in fade-in duration-200">
                        {/* Floating Remove Button in top corner */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setProfileLogo(null);
                            const input = document.getElementById('wizard-logo-file-input') as HTMLInputElement;
                            if (input) input.value = '';
                            showNotification('info', 'تمت إزالة شعار المنشأة.');
                          }}
                          className="absolute top-2 left-2 z-20 text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded-lg border border-rose-400/80 shadow-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105"
                          title="إزالة الشعار"
                        >
                          <Trash className="w-3 h-3" />
                          <span>إزالة</span>
                        </button>

                        {/* Centered preview image */}
                        <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center border-2 border-indigo-500/80 shadow-sm group/img">
                          <img 
                            src={profileLogo} 
                            alt="معاينة شعار المزود" 
                            className="w-full h-full object-cover transition-transform group-hover/img:scale-105" 
                            referrerPolicy="no-referrer" 
                          />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <span className="text-[10px] font-black text-white bg-indigo-600/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow">تغيير الصورة</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-1.5 p-2 flex flex-col items-center justify-center">
                        <UploadCloud className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-black text-indigo-950 dark:text-indigo-200 block">رفع شعار المنشأة *</span>
                        <span className="text-[8px] text-slate-500 dark:text-slate-300 block leading-tight font-sans">
                          JPEG, PNG, WebP<br/>حجم أقصى 500KB (960x960)
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block">نوع الكيان القانوني *</label>
                      <select value={profileEntityType} onChange={(e) => setProfileEntityType(e.target.value)} className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-bold text-slate-700 outline-none focus:border-indigo-500">
                        <option value="شركة">شركة ذات مسؤولية محدودة (LLC)</option>
                        <option value="مؤسسة">مؤسسة فردية تجارية</option>
                        <option value="عمل حر">رائد أعمال / وثيقة العمل الحر</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block">اسم المنشأة التجاري الرسمي *</label>
                      <input type="text" value={profileBusinessName} onChange={(e) => setProfileBusinessName(e.target.value)} placeholder="اسم الشركة أو القاعة الرئيسي" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-black outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block">رقم السجل التجاري / الهوية *</label>
                      <input type="text" value={profileBusinessCR} onChange={(e) => setProfileBusinessCR(e.target.value)} placeholder="رقم السجل التجاري المكون من 10 أرقام" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-mono outline-none focus:border-indigo-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 block">رقم جوال الممثل المعتمد *</label>
                      <input type="text" value={profileRepresentativePhone} onChange={(e) => setProfileRepresentativePhone(e.target.value)} placeholder="05xxxxxxxx" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-mono outline-none focus:border-indigo-500" />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 block">البريد الإلكتروني الرسمي للتواصل والمخاطبات القانونية *</label>
                  <input type="email" value={profileRepresentativeEmail} onChange={(e) => setProfileRepresentativeEmail(e.target.value)} placeholder="example@brand.com" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-mono outline-none focus:border-indigo-500" />
                </div>

                {/* Privacy & Username Controls Section */}
                <div className="bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <span className="text-xs font-black text-indigo-950 block">خيار إظهار اسم المزود للعملاء في واجهة المنصة</span>
                      <span className="text-[9px] text-slate-500 block">عند التعطيل، يختفي الاسم التجاري الرسمي نهائياً من صفحات العملاء لحماية الخصوصية.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer shrink-0">
                      <input
                        type="checkbox"
                        checked={showProviderToCustomers}
                        onChange={(e) => setShowProviderToCustomers(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-indigo-100/60">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black text-indigo-900 block">اسم المستخدم / الاسم المستعار للعملاء (اختياري)</label>
                      <input
                        type="text"
                        value={profileUsername}
                        onChange={(e) => setProfileUsername(e.target.value)}
                        placeholder="مثال: شريك ليلة المميز"
                        className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-800 font-bold outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div className="bg-white/80 p-2 rounded-xl text-[9px] text-indigo-950 flex flex-col justify-center border border-indigo-100">
                      <span className="font-bold block">معاينة ظهور اسم المزود في صفحات العملاء:</span>
                      <span className="font-extrabold text-indigo-600 text-xs mt-0.5">
                        {showProviderToCustomers ? profileBusinessName : (profileUsername.trim() ? profileUsername : 'مزود خدمة معتمد')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Address, Coordinates & Google Maps Integration */}
            {onboardingStep === 2 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-500">العنوان الوطني المعتمد وموقع الإدارة التشغيلية، مع ربط واستخراج إحداثيات خطوط الطول والعرض لخرائط Google.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">المنطقة الجغرافية *</label>
                    <select value={profileRegion} onChange={(e) => setProfileRegion(e.target.value)} className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-bold text-slate-700 outline-none">
                      <option value="منطقة الرياض">منطقة الرياض</option>
                      <option value="منطقة مكة المكرمة">منطقة مكة المكرمة</option>
                      <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                      <option value="منطقة المدينة المنورة">منطقة المدينة المنورة</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">المدينة *</label>
                    <select value={profileCity} onChange={(e) => setProfileCity(e.target.value)} className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-bold text-slate-700 outline-none">
                      <option value="الرياض">الرياض</option>
                      <option value="جدة">جدة</option>
                      <option value="الدمام">الدمام</option>
                      <option value="الخبر">الخبر</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 block">تفاصيل العنوان الوطني للمنشأة *</label>
                  <input type="text" value={profileNationalAddress} onChange={(e) => setProfileNationalAddress(e.target.value)} placeholder="مثال: 1234 الملقا - الرياض، المملكة العربية السعودية" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 outline-none" />
                </div>

                {/* Coordinates & Google Maps Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">إحداثيات خط العرض (Latitude) *</label>
                    <input type="text" value={profileLat} onChange={(e) => setProfileLat(e.target.value)} placeholder="24.761800" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-mono text-slate-800 outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">إحداثيات خط الطول (Longitude) *</label>
                    <input type="text" value={profileLng} onChange={(e) => setProfileLng(e.target.value)} placeholder="46.626400" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-mono text-slate-800 outline-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 block">رابط خرائط Google للموقع الفعلي *</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleAutoLocation}
                      className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black cursor-pointer transition-all flex items-center gap-1.5 shrink-0 shadow-sm"
                    >
                      <MapPin className="w-3.5 h-3.5 text-amber-300" />
                      تحديد تلقائي للموقع (Google Maps GPS)
                    </button>
                    <input type="text" value={profileMapLink} onChange={(e) => setProfileMapLink(e.target.value)} placeholder="https://maps.google.com/?q=..." className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-mono outline-none flex-1" />
                  </div>
                </div>

                {/* Interactive Map Card Preview & Modal Launcher */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-indigo-950 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                      معاينة موضع التوطين الجغرافي على الخريطة
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(true)}
                      className="text-[9px] font-black text-indigo-600 hover:underline cursor-pointer"
                    >
                      فتح الخريطة المباشرة ↗
                    </button>
                  </div>
                  <div className="bg-slate-200 rounded-xl h-20 w-full relative overflow-hidden flex items-center justify-center border border-slate-300 shadow-inner">
                    <iframe
                      title="Google Map Preview"
                      width="100%"
                      height="100%"
                      src={`https://maps.google.com/maps?q=${profileLat || '24.7618'},${profileLng || '46.6264'}&z=14&output=embed`}
                      className="absolute inset-0 w-full h-full border-0 pointer-events-none opacity-80"
                    />
                    <div className="z-10 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-indigo-200 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-rose-600 animate-bounce" />
                      <span className="text-[10px] font-black text-indigo-950 font-mono">
                        {profileLat}, {profileLng} ({profileCity})
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Merged Tax, Bank & Legal Documents Checklist */}
            {onboardingStep === 3 && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-500">إعدادات التسجيل الضريبي، الحساب البنكي المعتمد، وقائمة التراخيص والوثائق الرسمية المدمجة لضمان التسويات الفورية.</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">الحالة الضريبية للمنشأة *</label>
                    <select value={wizVatStatus} onChange={(e) => setWizVatStatus(e.target.value)} className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-bold text-slate-700 outline-none">
                      <option value="مسجل">مسجل في ضريبة القيمة المضافة (خاضع للضريبة)</option>
                      <option value="غير مسجل">غير مسجل / معفى ضريبياً بموجب القانون</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">الرقم الضريبي الموحد (15 خانة) *</label>
                    <input type="text" value={wizTaxId} onChange={(e) => setWizTaxId(e.target.value)} disabled={wizVatStatus === 'غير مسجل'} placeholder="300000000000003" className="w-full p-2 border border-slate-200 bg-white disabled:bg-slate-50 disabled:text-slate-400 rounded-xl text-xs text-right text-slate-700 font-mono outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1 md:col-span-1">
                    <label className="text-[9px] font-black text-slate-400 block">البنك الشريك المعتمد *</label>
                    <select value={wizBankName} onChange={(e) => setWizBankName(e.target.value)} className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-bold text-slate-700 outline-none">
                      <option value="البنك الأهلي السعودي">البنك الأهلي السعودي (SNB)</option>
                      <option value="مصرف الراجحي">مصرف الراجحي (Al Rajhi)</option>
                      <option value="بنك الرياض">بنك الرياض (Riyadh Bank)</option>
                      <option value="مصرف الإنماء">مصرف الإنماء (Alinma Bank)</option>
                    </select>
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-[9px] font-black text-slate-400 block">رقم الحساب الدولي للآيبان (IBAN) *</label>
                    <input type="text" value={wizIban} onChange={(e) => setWizIban(e.target.value)} placeholder="SA0000000000000000000000" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-mono font-black uppercase outline-none" />
                  </div>
                </div>

                {/* Merged Checklist of Legal Documents & Licenses */}
                <div className="border border-slate-200 p-3 rounded-2xl bg-slate-50 space-y-2">
                  <span className="text-[10px] font-black text-indigo-950 block">قائمة تحقق الوثائق والتراخيص الرسمية المعتمدة (Legal Checklist)</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[
                      {
                        key: 'cr',
                        label: 'السجل التجاري / وثيقة العمل الحر',
                        checked: wizDocCRChecked,
                        setChecked: setWizDocCRChecked,
                        file: wizDocCR,
                        setFile: setWizDocCR,
                        docName: 'cr_document_verified.pdf'
                      },
                      {
                        key: 'vat',
                        label: 'شهادة التسجيل الضريبي',
                        checked: wizDocVATChecked,
                        setChecked: setWizDocVATChecked,
                        file: wizDocVAT,
                        setFile: setWizDocVAT,
                        docName: 'vat_cert_verified.pdf'
                      },
                      {
                        key: 'chamber',
                        label: 'شهادة الغرفة التجارية / التصنيف',
                        checked: wizDocChamberChecked,
                        setChecked: setWizDocChamberChecked,
                        file: wizDocChamber,
                        setFile: setWizDocChamber,
                        docName: 'chamber_membership.pdf'
                      }
                    ].map((item) => (
                      <div key={item.key} className="bg-white p-2.5 rounded-xl border border-slate-200 flex flex-col justify-between space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => item.setChecked(e.target.checked)}
                            className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                          />
                          <span className="text-[10px] font-black text-slate-800">{item.label}</span>
                        </label>
                        {item.file ? (
                          <div className="flex items-center justify-between text-[8px] bg-emerald-50 text-emerald-800 p-1.5 rounded-lg border border-emerald-100">
                            <span className="truncate font-mono">✓ {item.file}</span>
                            <button type="button" onClick={() => item.setFile(null)} className="text-red-500 hover:underline shrink-0">حذف</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              item.setFile(item.docName);
                              showNotification('success', `تم إرفاق ${item.label} بنجاح!`);
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[8px] font-black rounded-md transition-all cursor-pointer border border-indigo-100"
                          >
                            + إرفاق الملف
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 4 (Company) / Skipped for Freelancer/Individual: First Branch Setup */}
            {onboardingStep === 4 && (profileEntityType !== 'عمل حر' && profileEntityType !== 'فرد') && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-500">قم بتهيئة وتأسيس فرعك التشغيلي الأول كـ (Mini Business Unit) لإتاحة توطين الكوادر والبدء بالتشغيل.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">اسم الفرع الأول لعلامتك *</label>
                    <input type="text" value={wizBranchName} onChange={(e) => setWizBranchName(e.target.value)} placeholder="مثال: فرع الرياض الرئيسي" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">مدينة الفرع الرئيسي *</label>
                    <select value={wizBranchCity} onChange={(e) => setWizBranchCity(e.target.value)} className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-bold text-slate-700 outline-none">
                      <option value="الرياض">الرياض</option>
                      <option value="جدة">جدة</option>
                      <option value="الدمام">الدمام</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">هاتف وتواصل الفرع المباشر *</label>
                    <input type="text" value={wizBranchPhone} onChange={(e) => setWizBranchPhone(e.target.value)} placeholder="رقم الهاتف للفرع" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 font-mono outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 block">العنوان الميداني التفصيلي للفرع *</label>
                    <input type="text" value={wizBranchAddress} onChange={(e) => setWizBranchAddress(e.target.value)} placeholder="اسم الشارع أو المنطقة للوصول الميداني" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 block">ساعات العمل الرسمية للفرع *</label>
                  <input type="text" value={wizWorkingHours} onChange={(e) => setWizWorkingHours(e.target.value)} placeholder="مثال: 02:00 م - 02:00 ص" className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right text-slate-700 outline-none" />
                </div>
              </div>
            )}

            {/* Declaration & Terms Step (Step 5 for Companies / Step 4 for Individuals) */}
            {((onboardingStep === 5 && (profileEntityType !== 'عمل حر' && profileEntityType !== 'فرد')) ||
              (onboardingStep === 4 && (profileEntityType === 'عمل حر' || profileEntityType === 'فرد'))) && (
              <div className="space-y-3 animate-in fade-in duration-200">
                <p className="text-[11px] text-slate-500">يرجى قراءة والموافقة التامة على التعهد القانوني وشروط تفعيل واجهة نظام تشغيل ليلة لضمان جودة الخدمة وحماية الموارد.</p>
                <div className="border border-slate-200 p-3 rounded-xl bg-slate-50 text-[10px] text-slate-600 leading-relaxed max-h-44 overflow-y-auto text-right font-sans font-medium space-y-1.5">
                  <p><strong>١. دقة ومطابقة البيانات:</strong> يتعهد مزود الخدمة المسجل بأن كافة البيانات المدخلة في نظام تشغيل الأعمال صحيحة ومطابقة للواقع ومملوكة للمنشأة بموجب التراخيص الصالحة.</p>
                  <p><strong>٢. حظر تسريب وتداخل البيانات:</strong> يوافق المزود على الالتزام بالقوانين الصارمة لحماية بيانات العملاء والمستفيدين والخصوصية المعتمدة بالمنصة، وعدم استغلالها خارج أغراض الفوترة والخدمة.</p>
                  <p><strong>٣. المراقبة والجودة المسبقة:</strong> يقر المزود بأن جميع القاعات أو الخدمات الجديدة المدخلة مستقبلاً ستخضع للموافقة المسبقة والتدقيق من الإدارة قبل إتاحتها للعرض للجمهور لضمان أعلى مستويات الالتزام وموثوقية المعروض.</p>
                </div>
                <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                  <input type="checkbox" checked={wizDeclarationAccepted} onChange={(e) => setWizDeclarationAccepted(e.target.checked)} className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4.5 h-4.5 mt-0.5" />
                  <div>
                    <span className="block font-black text-indigo-950">أقر وأوافق وأتعهد بصفتي المفوض القانوني عن المنشأة بكافة الشروط المذكورة أعلاه *</span>
                    <span className="text-[9px] text-slate-400 block mt-0.5">يتعين عليك تفعيل هذا الخيار لتمكين الانتقال لخطوة الإطلاق الأخيرة.</span>
                  </div>
                </label>
              </div>
            )}

            {/* Launch & Completion Step (Step 6 for Companies / Step 5 for Individuals) */}
            {((onboardingStep === 6 && (profileEntityType !== 'عمل حر' && profileEntityType !== 'فرد')) ||
              (onboardingStep === 5 && (profileEntityType === 'عمل حر' || profileEntityType === 'فرد'))) && (
              <div className="text-center space-y-4 py-2 animate-in fade-in duration-200">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <Check className="w-6 h-6 stroke-[3]" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-sm font-black text-emerald-800">اكتمل تأسيس وتهيئة ملف المنشأة بنجاح!</h3>
                  <p className="text-[11px] text-slate-400">تم إعداد الملف القانوني الفوري وتأسيس الجاهزية لاستقبال المهام والحجوزات.</p>
                </div>
                
                {/* Visual Summary Receipt */}
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl text-right text-xs max-w-md mx-auto space-y-1.5 font-sans">
                  <span className="text-[9px] font-black text-indigo-900 block border-b pb-1">ملخص بطاقة تعريف المزود (BOS Profile Card)</span>
                  <div className="flex justify-between"><span className="font-bold text-slate-800">{profileBusinessName}</span><span className="text-slate-400">اسم المنشأة التجاري:</span></div>
                  <div className="flex justify-between">
                    <span className="font-bold text-indigo-600">
                      {showProviderToCustomers ? 'مرئي للعملاء' : (profileUsername ? `مخفي (الاسم المستعار: ${profileUsername})` : 'مخفي (مزود خدمة معتمد)')}
                    </span>
                    <span className="text-slate-400">حالة إظهار الاسم للعملاء:</span>
                  </div>
                  <div className="flex justify-between"><span className="font-mono text-slate-700">{profileBusinessCR}</span><span className="text-slate-400">السجل/رقم الكيان:</span></div>
                  <div className="flex justify-between"><span className="font-mono text-slate-800 font-bold">{profileLat}, {profileLng}</span><span className="text-slate-400">إحداثيات الموقع:</span></div>
                  <div className="flex justify-between"><span className="font-mono text-indigo-600 font-bold">{wizIban}</span><span className="text-slate-400">رقم الآيبان البنكي:</span></div>
                  {(profileEntityType !== 'عمل حر' && profileEntityType !== 'فرد') && (
                    <div className="flex justify-between"><span className="font-bold text-slate-800">فرع {wizBranchCity} - {wizBranchName || 'الرئيسي'}</span><span className="text-slate-400">الفرع النشط الأول:</span></div>
                  )}
                </div>
                
                <p className="text-[10px] text-slate-500 max-w-sm mx-auto">عند النقر على زر الإطلاق، سيتم تفعيل شاشة التشغيل الكاملة وحفظ البيانات في الوقت الحقيقي بموجب قواعد العزل التام.</p>
              </div>
            )}

          </div>

          {/* Wizard Footer */}
          <div className="flex items-center justify-between pt-3 border-t border-slate-100">
            <button
              type="button"
              disabled={onboardingStep === 1}
              onClick={() => setOnboardingStep(onboardingStep - 1)}
              className="px-4 py-2 border border-slate-200 disabled:opacity-40 disabled:pointer-events-none hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1"
            >
              <ChevronRight className="w-4 h-4" />
              <span>السابق</span>
            </button>

            {(() => {
              const isIndividual = profileEntityType === 'عمل حر' || profileEntityType === 'فرد';
              const lastStep = isIndividual ? 5 : 6;
              const isAtLastStep = onboardingStep === lastStep;

              if (!isAtLastStep) {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      if (onboardingStep === 1) {
                        if (!profileBusinessName || !profileBusinessCR) {
                          showNotification('warning', 'يرجى إدخال اسم المنشأة التجاري ورقم السجل التجاري/الهوية للمتابعة.');
                          return;
                        }
                      }
                      if (onboardingStep === 2) {
                        if (!profileNationalAddress || !profileMapLink) {
                          showNotification('warning', 'يرجى إدخال تفاصيل العنوان ورابط خرائط Google للفرع.');
                          return;
                        }
                      }
                      if (onboardingStep === 3) {
                        if (!wizIban || !wizBankName) {
                          showNotification('warning', 'يرجى إدخال بيانات البنك ورقم الآيبان بشكل صحيح.');
                          return;
                        }
                      }
                      if (onboardingStep === 4 && !isIndividual) {
                        if (!wizBranchName || !wizBranchAddress) {
                          showNotification('warning', 'يرجى تحديد اسم للفرع وعنوانه الميداني لتأسيسه بنجاح.');
                          return;
                        }
                        const newBrId = `BR-26-${String(profileBranches.length + 1).padStart(8, '0')}`;
                        const customBranch = {
                          id: newBrId,
                          name: wizBranchName,
                          city: wizBranchCity,
                          phone: wizBranchPhone || '0551234567',
                          address: wizBranchAddress
                        };
                        if (!profileBranches.some(b => b.name === wizBranchName)) {
                          const updated = [...profileBranches, customBranch];
                          setProfileBranches(updated);
                          localStorage.setItem(`provider_branches_${currentProviderName}`, JSON.stringify(updated));
                          showNotification('success', `تم تأسيس وتسجيل الفرع الجديد "${customBranch.name}" في المجموعة بالرقم ${newBrId}`);
                        }
                      }
                      if ((onboardingStep === 5 && !isIndividual) || (onboardingStep === 4 && isIndividual)) {
                        if (!wizDeclarationAccepted) {
                          showNotification('warning', 'يرجى قراءة التعهد والموافقة عليه للاستمرار.');
                          return;
                        }
                      }
                      setOnboardingStep(onboardingStep + 1);
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                  >
                    <span>حفظ ومتابعة</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                );
              } else {
                return (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOnboarded(true);
                      setIsWizardForceOpen(false);
                      setOnboardingStep(1);
                      // Save profile data & update providersData in localStorage
                      const settingsObj = {
                        ...providerSettings,
                        businessName: profileBusinessName,
                        entityType: profileEntityType,
                        crNumber: profileBusinessCR,
                        phone: profileRepresentativePhone,
                        email: profileRepresentativeEmail,
                        logo: profileLogo,
                        region: profileRegion,
                        city: profileCity,
                        nationalAddress: profileNationalAddress,
                        mapLink: profileMapLink,
                        latitude: profileLat,
                        longitude: profileLng,
                        showProviderToCustomers: showProviderToCustomers,
                        username: profileUsername,
                        vatStatus: wizVatStatus,
                        vatNumber: wizTaxId,
                        iban: wizIban,
                        bankName: wizBankName,
                      };
                      setProviderSettings(settingsObj);
                      localStorage.setItem(`provider_settings_${currentProviderName}`, JSON.stringify(settingsObj));

                      try {
                        const savedProvData = localStorage.getItem('providersData');
                        let provList = savedProvData ? JSON.parse(savedProvData) : [];
                        if (!Array.isArray(provList)) provList = [];
                        const idx = provList.findIndex((p: any) => p.name === currentProviderName || p.id === currentProviderName);
                        const updatedProv = {
                          id: currentProviderName,
                          name: profileBusinessName,
                          providerName: profileBusinessName,
                          showProviderToCustomers: showProviderToCustomers,
                          username: profileUsername,
                          logo: profileLogo,
                          latitude: profileLat,
                          longitude: profileLng,
                          city: profileCity,
                          region: profileRegion,
                          crNumber: profileBusinessCR,
                          phone: profileRepresentativePhone,
                          email: profileRepresentativeEmail,
                        };
                        if (idx >= 0) {
                          provList[idx] = { ...provList[idx], ...updatedProv };
                        } else {
                          provList.push(updatedProv);
                        }
                        safeSetLocalStorage('providersData', provList);
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('settingsUpdated'));
                      } catch (e) {}

                      showNotification('success', 'مبروك! تم إطلاق وتفعيل مركز القيادة ونظام تشغيل الأعمال الكامل (Layla BOS) بنجاح!');
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>تفعيل مركز العمليات الكامل ➔</span>
                  </button>
                );
              }
            })()}
          </div>
        </div>
      ) : (
            <div className="space-y-4 font-sans text-right pb-16 lg:pb-0" dir="rtl">
              {/* Mobile Quick Navigation Bar (شريط التنقل المباشر للجوال) */}
              <div className="lg:hidden bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-3.5 shadow-sm space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0">
                      <Sliders className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-black text-slate-800 dark:text-slate-100 truncate">
                        {profileBusinessName || 'لوحة قيادة المزود'}
                      </div>
                      <div className="text-[9px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1 mt-0.5">
                        <span>Layla BOS Mobile</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shrink-0 hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-sm"
                  >
                    <Sliders className="w-3.5 h-3.5 text-indigo-300" />
                    <span>{isMobileMenuOpen ? 'إغلاق القائمة' : 'جميع الأقسام'}</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {/* Quick Horizontal Scroll Pills on Mobile */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[10px] font-black -mx-1 px-1">
                  {[
                    { id: 'overview', label: 'الرئيسية', icon: Activity },
                    { id: 'ops_center', label: 'التشغيل', icon: Sliders },
                    { id: 'orders', label: 'الطلبات', icon: Inbox },
                    { id: 'bookings', label: 'الحجوزات', icon: CheckSquare },
                    { id: 'catalog', label: 'الكتالوج والقاعات', icon: Package },
                    { id: 'finance', label: 'المالية', icon: Wallet },
                    { id: 'profile', label: 'الهوية والفروع', icon: Building2 },
                  ].map((mTab) => {
                    const MIcon = mTab.icon;
                    const isCurrent = osTab === mTab.id;
                    return (
                      <button
                        key={mTab.id}
                        onClick={() => {
                          setOsTab(mTab.id as any);
                          setIsMobileMenuOpen(false);
                        }}
                        className={`px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer shrink-0 ${
                          isCurrent
                            ? 'bg-indigo-600 text-white shadow-xs font-black'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        <MIcon className="w-3.5 h-3.5" />
                        <span>{mTab.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Right Sidebar Menu: Grouped into Business Domains */}
                <div className={`lg:col-span-1 bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-3 h-fit lg:sticky lg:top-24 lg:max-h-[85vh] lg:overflow-y-auto scrollbar-none transition-all duration-300 ${isMobileMenuOpen ? 'block' : 'hidden lg:block'}`}>
              
              {/* Sidebar Header */}
              <div className="pb-3 border-b border-slate-100">
                <span className="text-[10px] font-black text-indigo-600 font-mono tracking-wider">BUSINESS OPERATING SYSTEM</span>
                <h4 className="text-sm font-black text-slate-800 mt-1 flex items-center gap-1.5 justify-end">
                  <span>نظام تشغيل الأعمال BOS</span>
                  <Sliders className="w-4 h-4 text-indigo-600" />
                </h4>
              </div>

              {/* Dynamic Instant Tab Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="بحث سريع في الأقسام..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full text-xs font-bold text-right p-2.5 pr-8 bg-slate-50 border border-slate-200/60 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all text-slate-700"
                  dir="rtl"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                {sidebarSearch && (
                  <button 
                    onClick={() => setSidebarSearch('')}
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold bg-slate-200/40 rounded-full w-4 h-4 flex items-center justify-center transition-all cursor-pointer"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Business Domains List */}
              <div className="space-y-3">
                {[
                  {
                    id: 'operations',
                    name: 'التشغيل والعمليات',
                    desc: 'مركز القيادة والفروع والطلبات والعهود والموردين',
                    icon: Sliders,
                    color: 'text-blue-600 bg-blue-50/50 border-blue-100',
                    tabs: [
                      { id: 'overview', name: 'مركز قيادة العمليات', desc: 'مؤشرات فورية ونشاط اليوم', icon: Activity, color: 'text-blue-500 bg-blue-50' },
                      { id: 'ops_center', name: 'مركز العمليات والتشغيل', desc: 'إدارة وتنسيق العمليات الميدانية والمهام والتقويم المباشر', icon: Sliders, color: 'text-indigo-600 bg-indigo-50' },
                      { id: 'profile', name: 'الهوية والفروع والكوادر', desc: 'إدارة الفروع والموظفين', icon: Building2, color: 'text-indigo-500 bg-indigo-50' },
                      { id: 'orders', name: 'طلبات الخدمات التكميلية', desc: 'الطلبات اللوجستية المستقلة', icon: Inbox, color: 'text-rose-500 bg-rose-50' },
                      { id: 'inventory', name: 'إدارة المخزون والعهود', desc: 'مراقبة المستلزمات والعهود الميدانية', icon: Boxes, color: 'text-emerald-500 bg-emerald-50' },
                      { id: 'suppliers', name: 'إدارة وشراكات الموردين', desc: 'عقود الموردين والخدمات والطلبات', icon: Truck, color: 'text-cyan-500 bg-cyan-50' },
                      { id: 'customers', name: 'سجلات وملاحظات العملاء', desc: 'الملفات الشخصية للمستفيدين', icon: Users2, color: 'text-orange-500 bg-orange-50' },
                      { id: 'notifications', name: 'مركز التنبيهات المباشرة', desc: 'إشعارات النظام والتحويلات', icon: ShieldAlert, color: 'text-red-500 bg-red-50' }
                    ]
                  },
                  {
                    id: 'catalog',
                    name: 'كتالوج الخدمات والقاعات',
                    desc: 'القاعات والباقات والسياسات والترويج',
                    icon: Package,
                    color: 'text-purple-600 bg-purple-50/50 border-purple-100',
                    tabs: [
                      { id: 'catalog', name: 'كتالوج الخدمات والقاعات', desc: 'القاعات، الخدمات والباقات', icon: Package, color: 'text-purple-500 bg-purple-50' },
                      { id: 'hybrid', name: 'المناسبات والسياسات', desc: 'منع الازدواجية والتكامل', icon: Sparkles, color: 'text-violet-500 bg-violet-50' },
                      { id: 'marketing', name: 'التسويق والكوبونات', desc: 'حملات ترويجية وأكواد خصم', icon: Megaphone, color: 'text-fuchsia-500 bg-fuchsia-50' }
                    ]
                  },
                  {
                    id: 'scheduling',
                    name: 'الجدولة والمواعيد',
                    desc: 'الحجوزات، المواعيد والإتاحة والتسعير',
                    icon: Calendar,
                    color: 'text-amber-600 bg-amber-50/50 border-amber-100',
                    tabs: [
                      { id: 'bookings', name: 'إدارة وتتبع الحجوزات', desc: 'حالة الحجز ودورة الحياة', icon: CheckSquare, color: 'text-teal-500 bg-teal-50' },
                      { id: 'availability', name: 'مواعيد العمل والإتاحة', desc: 'التعطيل والقدرة الاستيعابية', icon: Clock, color: 'text-amber-500 bg-amber-50' },
                      { id: 'pricing', name: 'محرك التسعير الذكي', desc: 'الأسعار الأساسية والموسمية', icon: CreditCard, color: 'text-emerald-500 bg-emerald-50' }
                    ]
                  },
                  {
                    id: 'finance',
                    name: 'المركز المالي',
                    desc: 'المحفظة والتسويات والاشتراك والفوترة',
                    icon: Wallet,
                    color: 'text-emerald-600 bg-emerald-50/50 border-emerald-100',
                    tabs: [
                      { id: 'finance', name: 'المركز المالي والمحفظة', desc: 'التسويات والأرباح والعمولات', icon: Wallet, color: 'text-cyan-500 bg-cyan-50' },
                      { id: 'subscription', name: 'اشتراك المنشأة والفوترة', desc: 'باقة الاشتراك والترقيات', icon: Award, color: 'text-yellow-600 bg-yellow-50' }
                    ]
                  },
                  {
                    id: 'analytics',
                    name: 'التحليلات والأداء',
                    desc: 'التقارير الشاملة وأداء الأعمال والنمو',
                    icon: TrendingUp,
                    color: 'text-sky-600 bg-sky-50/50 border-sky-100',
                    tabs: [
                      { id: 'reports', name: 'التقارير الشاملة والأداء', desc: 'تقارير تشغيلية ومالية بدقة', icon: FileSpreadsheet, color: 'text-sky-500 bg-sky-50' },
                      { id: 'stats', name: 'التحليلات والمؤشرات الفورية', desc: 'الأداء الفوري والنشاط ومستجدات الحملات', icon: Activity, color: 'text-purple-500 bg-purple-50' },
                      { id: 'growth', name: 'مؤشرات النمو والتراكم', desc: 'تحليل حركة الأرباح ونمو الحجوزات', icon: TrendingUp, color: 'text-emerald-500 bg-emerald-50' }
                    ]
                  }
                ].map((domain) => {
                  // Filter tabs in domain based on search query
                  const filteredTabs = domain.tabs.filter(t => 
                    sidebarSearch === '' || 
                    t.name.includes(sidebarSearch) || 
                    t.desc.includes(sidebarSearch) ||
                    domain.name.includes(sidebarSearch)
                  );

                  if (filteredTabs.length === 0) return null;

                  // Determine if this domain is active or contains the active subtab
                  const containsActiveTab = filteredTabs.some(t => t.id === osTab);
                  const isExpanded = sidebarSearch !== '' || expandedDomains[domain.id] !== false || containsActiveTab;
                  
                  const DomainIcon = domain.icon;

                  // Count unread notifications in this domain
                  let totalDomainNotifications = 0;
                  if (domain.id === 'operations') {
                    totalDomainNotifications = liveNotifications.filter(n => n.unread).length;
                  }

                  return (
                    <div 
                      key={domain.id} 
                      className={`border border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden transition-all duration-300 ${containsActiveTab ? 'ring-1 ring-indigo-500/20 shadow-sm' : ''}`}
                    >
                      {/* Domain Accordion Header */}
                      <button
                        onClick={() => setExpandedDomains(prev => ({ ...prev, [domain.id]: !prev[domain.id] }))}
                        className={`w-full flex items-center justify-between p-3 text-right bg-slate-50/50 hover:bg-slate-50 dark:bg-slate-900/10 dark:hover:bg-slate-900/30 transition-all border-b border-slate-100 dark:border-slate-800 cursor-pointer`}
                      >
                        <div className="flex items-center gap-2">
                          {totalDomainNotifications > 0 && (
                            <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full animate-pulse">
                              {totalDomainNotifications}
                            </span>
                          )}
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </div>

                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="text-right min-w-0">
                            <div className="text-xs font-black text-slate-800 dark:text-slate-100">{domain.name}</div>
                            <div className="text-[9px] text-slate-400 truncate mt-0.5 max-w-[150px]">{domain.desc}</div>
                          </div>
                          <div className={`p-1.5 rounded-lg shrink-0 ${domain.color} border`}>
                            <DomainIcon className="w-4 h-4" />
                          </div>
                        </div>
                      </button>

                      {/* Domain Subtabs List */}
                      {isExpanded && (
                        <div className="p-1.5 bg-white dark:bg-slate-950/20 space-y-1 transition-all">
                          {filteredTabs.map((tab) => {
                            const TabIcon = tab.icon;
                            const isSelected = osTab === tab.id;
                            const unreadNotificationsCount = tab.id === 'notifications' ? liveNotifications.filter(n => n.unread).length : 0;
                            return (
                              <button
                                key={tab.id}
                                onClick={() => {
                                  setOsTab(tab.id as any);
                                  setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center gap-3 p-2 rounded-xl text-right transition-all cursor-pointer ${isSelected ? 'bg-gradient-to-r from-indigo-50/80 to-blue-50/30 dark:from-indigo-950/40 dark:to-slate-900/20 border-r-4 border-indigo-600 shadow-xs' : 'hover:bg-slate-50/80 dark:hover:bg-slate-900/20 border-r-4 border-transparent text-slate-600 dark:text-slate-400'}`}
                              >
                                <div className={`p-1.5 rounded-lg shrink-0 ${tab.color}`}>
                                  <TabIcon className="w-3.5 h-3.5" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between">
                                    <div className={`text-[10px] font-black truncate ${isSelected ? 'text-indigo-950 dark:text-indigo-200 font-extrabold' : 'text-slate-700 dark:text-slate-300'}`}>{tab.name}</div>
                                    {unreadNotificationsCount > 0 && (
                                      <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                                        {unreadNotificationsCount}
                                      </span>
                                    )}
                                  </div>
                                  <div className="text-[8px] text-slate-400 truncate mt-0.5">{tab.desc}</div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>


            
            {/* Left Content Area: Active Domain view */}
            <div className="lg:col-span-3 space-y-6">
              
              {/* Domain 1: Business Overview */}
              {osTab === 'overview' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Command Center Title Banner */}
                  <div className="bg-gradient-to-l from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl relative overflow-hidden shadow-md text-right">
                    <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                      <div className="space-y-2 flex-1">
                        <span className="bg-indigo-500/80 text-white text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest font-mono">BOS OPERATING SYSTEM</span>
                        <h3 className="text-xl font-black">مركز قيادة عمليات المنشأة الموحد</h3>
                        <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
                          مرحباً بك مجدداً في نظام تشغيل الأعمال <span className="text-amber-400 font-extrabold">Layla BOS v2.6</span> لشركة <span className="text-yellow-400 font-extrabold">{profileBusinessName}</span>. إليك تحليل حي ومؤشرات عمليات المنشأة والمهام العاجلة بانتظار اتخاذ إجراء الآن.
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

                  {/* Unified Dashboard Grid: Financial Hub & Health Indicators (Right) & Action Center (Left) */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                    
                    {/* Right Column: Financial Overview Hub & Operational Health (lg:col-span-8) */}
                    <div className="lg:col-span-8 flex flex-col gap-6">
                      
                      {/* Financial Overview Hub (الرصيد الفوري والمركز المالي والسيولة للشركاء) */}
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
                            // Link supply requests to financial center
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

                          {/* Extra Layout info block for neat balance */}
                          <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100/40 text-right">
                            <p className="text-[9.5px] text-indigo-950 font-bold leading-relaxed">
                              💡 يمثل هذا المركز المالي التدفق النقدي والسيولة الفورية للمزود لعام ٢٠٢٦ م. يتم تحديث الرصيد وتدفقات الأرباح تلقائياً فورياً مع عزل تام عن بقية المزودين.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Operational Health & Service Quality Indicators (مؤشرات الصحة التشغيلية وجودة الخدمات للمزود) */}
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
                              <span className="font-mono text-indigo-600 font-bold">{profileEmployees.filter(e => e.status === 'نشط').length} موظفين</span>
                              <span className="text-slate-500">طاقم المناوبة النشط اليوم:</span>
                            </div>
                          </div>

                          {/* Low Inventory & Asset Alerts (Dynamic Linkage) */}
                          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 flex flex-col justify-between space-y-2.5">
                            <span className="text-[10px] font-black text-rose-900 block border-b border-rose-100/50 pb-1">مراقبة المخزون وإنذارات العهدة</span>
                            
                            {(() => {
                              const lowStockItems = inventoryItems.filter(item => item.available <= item.threshold);
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
                            { (actionBookingsCount > 0 ? 1 : 0) + (actionServiceCount > 0 ? 1 : 0) + (!actionRatingReplied ? 1 : 0) + (actionSettlementCount > 0 ? 1 : 0) + (!actionSubscriptionRenewed ? 1 : 0) + 1 } مهام عاجلة
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
                                  عرض
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Action 2: Service Request */}
                          {actionServiceCount > 0 && (
                            <div className="p-3 bg-slate-50 hover:bg-purple-50/20 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-2">
                              <div className="flex gap-2.5 justify-end items-start text-right">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[11px] font-black text-slate-800 block">طلب خدمات إضافية معلق</span>
                                  <p className="text-[9.5px] text-slate-400 mt-0.5">طلب "بوفيه عشاء ملكي فاخر" لقاعة الأسطورة بانتظار الإسناد.</p>
                                </div>
                                <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                                  <Inbox className="w-3.5 h-3.5" />
                                </div>
                              </div>
                              <div className="flex gap-2 justify-end">
                                <button
                                  onClick={() => {
                                    setActionServiceCount(0);
                                    showNotification('success', 'تم قبول طلب الخدمات الإضافية وإسناد طاقم العمل وتأكيد التجهيز اللوجستي!');
                                  }}
                                  className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[9px] font-black cursor-pointer transition-all min-h-[32px]"
                                >
                                  تأكيد وإسناد الطاقم
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
                                  <span className="text-[11px] font-black text-slate-800 block">تسوية مالية جاهزة للتحويل</span>
                                  <p className="text-[9.5px] text-slate-400 mt-0.5">مبلغ تسوية جاهز للإيداع الفوري بقيمة 12,000 ر.س.</p>
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

                  {/* 2. TODAY'S & TOMORROW'S OPERATIONS (تشغيل اليوم والعمليات اللوجستية) */}
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
                        let baseStyle = "text-[9px] font-black px-2.5 py-1 rounded-full text-center inline-block whitespace-nowrap ";
                        if (color === 'emerald') baseStyle += "bg-emerald-50 text-emerald-700 border border-emerald-200";
                        else if (color === 'blue') baseStyle += "bg-blue-50 text-blue-700 border border-blue-200";
                        else if (color === 'slate') baseStyle += "bg-slate-100 text-slate-700 border border-slate-200";
                        else if (color === 'purple') baseStyle += "bg-purple-50 text-purple-700 border border-purple-200";
                        else if (color === 'amber') baseStyle += "bg-amber-50 text-amber-700 border border-amber-200";
                        else if (color === 'red') baseStyle += "bg-rose-50 text-rose-700 border border-rose-200 animate-pulse";
                        else baseStyle += "bg-slate-100 text-slate-800";

                        return (
                          <div className="flex items-center justify-end gap-2">
                            {item.phoneAction && (
                              <button
                                onClick={() => showNotification('info', `جارٍ الاتصال التلقائي بـ ${item.manager} لتحديث حالة التوصيل للطلب ${item.id}...`)}
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
                                    <th className="p-3.5 text-right font-black">المشرف المسؤول</th>
                                    <th className="p-3.5 text-right font-black">التوقيت</th>
                                    <th className="p-3.5 text-left font-black">حالة التشغيل اللوجستي</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 bg-white">
                                  {currentItems.map((item) => (
                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="p-3.5 font-bold text-slate-400 font-mono">{item.id}</td>
                                      <td className="p-3.5 font-black text-slate-800">{item.title}</td>
                                      <td className="p-3.5">
                                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${
                                          item.type === 'event' 
                                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                            : 'bg-purple-50 text-purple-700 border border-purple-100'
                                        }`}>
                                          {item.type === 'event' ? 'مناسبة نشطة' : 'خدمة تكميلية'}
                                        </span>
                                      </td>
                                      <td className="p-3.5 text-slate-500 font-medium">
                                        {item.hall} <span className="text-[10px] text-slate-400">({item.branch})</span>
                                      </td>
                                      <td className="p-3.5 text-slate-600 font-bold">{item.manager}</td>
                                      <td className="p-3.5 text-slate-500 font-mono">{item.time}</td>
                                      <td className="p-3.5 text-left">
                                        {getStatusBadge(item.status, item.statusColor, item)}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            /* Render Grid (Grid Mode) */
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                              {currentItems.map((item) => (
                                <div key={item.id} className="p-4 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-slate-100 transition-all flex flex-col justify-between space-y-3 text-right">
                                  <div className="flex justify-between items-start gap-2">
                                    <span className="text-[10px] font-bold text-slate-400 font-mono">{item.id}</span>
                                    <span className={`px-2 py-0.5 rounded-md text-[8.5px] font-black ${
                                      item.type === 'event' 
                                        ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' 
                                        : 'bg-purple-50 text-purple-700 border border-purple-100'
                                    }`}>
                                      {item.type === 'event' ? 'مناسبة نشطة' : 'خدمة تكميلية'}
                                    </span>
                                  </div>

                                  <div className="space-y-1">
                                    <span className="text-xs font-black text-slate-800 block leading-tight">{item.title}</span>
                                    <span className="text-[10.5px] text-slate-500 block">{item.hall} ({item.branch})</span>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/40 flex justify-between items-center gap-2">
                                    <div className="text-right">
                                      <span className="text-[9px] text-slate-400 block">المشرف المسؤول</span>
                                      <span className="text-[10.5px] font-bold text-slate-700 block">{item.manager}</span>
                                    </div>
                                    <div className="text-left">
                                      <span className="text-[9px] text-slate-400 block">التوقيت</span>
                                      <span className="text-[10.5px] font-mono text-slate-700 block">{item.time}</span>
                                    </div>
                                  </div>

                                  <div className="pt-1 flex justify-end">
                                    {getStatusBadge(item.status, item.statusColor, item)}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Pagination Controls */}
                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            
                            {/* Previous page (RTL: ChevronRight/Left) */}
                            <button
                              onClick={() => setLogisticsPage(p => Math.max(1, p - 1))}
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
                              <span>صفحة {logisticsPage} من {totalPages}</span>
                              <span className="text-[10px] text-slate-400 mr-1.5">({totalItems} سجلات تشغيلية)</span>
                            </div>

                            {/* Next page */}
                            <button
                              onClick={() => setLogisticsPage(p => Math.min(totalPages, p + 1))}
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



                  {/* 4. BUSINESS HEALTH INDICATORS (مؤشرات جودة الأداء والسمعة) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">BUSINESS HEALTH & SATISFACTION</span>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-800">مؤشرات الصحة التشغيلية وجودة خدمات المنشأة</h3>
                        <Award className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {/* Ind 1 */}
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">معدل قبول الحجوزات</span>
                        <span className="text-xl font-black text-indigo-600 font-mono block">٩٨.٤٪</span>
                        <span className="text-[9px] text-emerald-600 block mt-1 font-bold">ممتاز (أعلى من متوسط الشركاء)</span>
                      </div>

                      {/* Ind 2 */}
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">معدل إلغاء الحجوزات</span>
                        <span className="text-xl font-black text-emerald-600 font-mono block">١.٢٪</span>
                        <span className="text-[9px] text-slate-400 block mt-1">منخفض ومستقر تماماً</span>
                      </div>

                      {/* Ind 3 */}
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">متوسط التقييم العام للعملاء</span>
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-xl font-black text-slate-800 font-mono">٤.٩ / ٥</span>
                          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                        </div>
                        <span className="text-[9px] text-slate-400 block mt-1">إجمالي التقييمات: 140 عميل سعيد</span>
                      </div>

                      {/* Ind 4 */}
                      <div className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100/60 text-right space-y-1">
                        <span className="text-[10px] font-bold text-slate-400 block">متوسط زمن الاستجابة والرد</span>
                        <span className="text-xl font-black text-purple-600 font-mono">٨ دقائق</span>
                        <span className="text-[9px] text-emerald-600 block mt-1 font-bold">أسرع من 95% من مقدمي الخدمة</span>
                      </div>
                    </div>
                  </div>

                  {/* 5. INTERACTIVE PERFORMANCE GRAPH (مخطط المبيعات الأسبوعي التفاعلي) */}
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
              )}

              {/* Domain 2: Business Profile */}
              {osTab === 'profile' && (
                <div className="space-y-6">
                  {/* Brand Identity Wizard (BOS-Style) */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm text-right space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="bg-indigo-50 text-indigo-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase font-mono">BOS Identity Engine v2.6</span>
                        <span className="text-xs text-slate-400">الخطوة {identityWizStep} من 4</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black text-slate-800">معالج ترخيص وتحديث الهوية التجارية للمنشأة</h3>
                        <Building2 className="w-5 h-5 text-indigo-600" />
                      </div>
                    </div>

                    {/* Step Indicator */}
                    <div className="grid grid-cols-4 gap-2 text-center text-[10px] font-black pb-2">
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 1 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ١. البيانات القانونية
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 2 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ٢. قنوات الاتصال
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 3 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ٣. الهوية والسمات
                      </div>
                      <div className={`p-2 rounded-xl transition-all ${identityWizStep === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-500'}`}>
                        ٤. المراجعة والاعتماد
                      </div>
                    </div>

                    {/* Step 1: Legal Info */}
                    {identityWizStep === 1 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-2xl text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                          يرجى مراجعة وتدقيق البيانات القانونية للمنشأة للتأكد من مطابقتها للسجلات الحكومية السعودية (وزارة التجارة وهيئة الزكاة والضريبة والجمارك).
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">اسم المنشأة التجاري الرسمي</label>
                            <input
                              type="text"
                              value={identityWizData.businessName}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, businessName: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right"
                              placeholder="مجموعة قاعات ليالينا للاحتفالات"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">رقم السجل التجاري (CR)</label>
                            <input
                              type="text"
                              value={identityWizData.crNumber}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, crNumber: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                              placeholder="1010XXXXXX"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">الرقم الضريبي الموحد (VAT)</label>
                            <input
                              type="text"
                              value={identityWizData.vatNumber}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, vatNumber: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                              placeholder="301234567800003"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">تاريخ انتهاء السجل التجاري</label>
                            <input
                              type="date"
                              value={identityWizData.crExpiry}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, crExpiry: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none text-right font-mono"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Contact Info */}
                    {identityWizStep === 2 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-2xl text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                          قنوات الاتصال المباشرة المعتمدة تتيح للعملاء ولإدارة منصة ليلة التواصل السريع معكم في أي شؤون لوجستية أو مالية معلقة.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">رقم الجوال المعتمد (Authorized Mobile)</label>
                            <input
                              type="text"
                              value={identityWizData.contactPhone}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, contactPhone: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="055XXXXXXX"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">البريد الإلكتروني الرسمي للمراسلات</label>
                            <input
                              type="email"
                              value={identityWizData.officialEmail}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, officialEmail: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="info@yourdomain.com"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">الموقع الإلكتروني</label>
                            <input
                              type="text"
                              value={identityWizData.website}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, website: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="https://..."
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">حساب المنصة X (تويتر)</label>
                            <input
                              type="text"
                              value={identityWizData.twitter}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, twitter: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="@username"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">حساب إنستغرام</label>
                            <input
                              type="text"
                              value={identityWizData.instagram}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, instagram: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right font-mono"
                              placeholder="@username"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Brand Stylings */}
                    {identityWizStep === 3 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-slate-50 p-3.5 rounded-2xl text-[11px] text-slate-600 leading-relaxed border border-slate-100">
                          حدد السلوجان والوصف التجاري العام والألوان المفضلة لشاشات الحجز الخاصة بك، لضمان مظهر متناسق واحترافي أمام عملائك.
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">الشعار اللفظي المعتمد (Slogan)</label>
                            <input
                              type="text"
                              value={identityWizData.slogan}
                              onChange={(e) => setIdentityWizData({ ...identityWizData, slogan: e.target.value })}
                              className="w-full text-xs font-bold border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right"
                              placeholder="ليلتكم الاستثنائية بلمسة ملكية"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 block">ألوان الهوية التجارية المعتمدة</label>
                            <div className="flex gap-4">
                              <div className="flex items-center gap-1.5 flex-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                <input
                                  type="color"
                                  value={identityWizData.primaryColor}
                                  onChange={(e) => setIdentityWizData({ ...identityWizData, primaryColor: e.target.value })}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                                />
                                <span className="text-[10px] font-bold text-slate-600">اللون الأساسي</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-1 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                <input
                                  type="color"
                                  value={identityWizData.secondaryColor}
                                  onChange={(e) => setIdentityWizData({ ...identityWizData, secondaryColor: e.target.value })}
                                  className="w-8 h-8 rounded-lg cursor-pointer border-0 bg-transparent"
                                />
                                <span className="text-[10px] font-bold text-slate-600">اللون الثانوي</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 block">الوصف التجاري التعريفي للخدمات والمزايا</label>
                          <textarea
                            value={identityWizData.description}
                            onChange={(e) => setIdentityWizData({ ...identityWizData, description: e.target.value })}
                            rows={3}
                            className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:border-indigo-500 outline-none text-right leading-relaxed"
                            placeholder="نقدم أرقى الخدمات للعروسين..."
                          />
                        </div>

                        {/* Real Interactive Logo Upload with Instant Preview */}
                        <div 
                          className="provider-logo-upload-container aspect-square w-full max-w-[200px] mx-auto flex flex-col items-center justify-center p-2 border-2 border-dashed border-indigo-400 dark:border-indigo-400 hover:border-indigo-600 dark:hover:border-indigo-300 rounded-2xl bg-indigo-50/30 dark:bg-slate-800/90 hover:bg-indigo-50/60 transition-all cursor-pointer relative group overflow-hidden shadow-sm dark:shadow-[0_0_15px_rgba(129,140,248,0.25)]"
                          onClick={() => document.getElementById('settings-logo-file-input')?.click()}
                        >
                          <input
                            type="file"
                            id="settings-logo-file-input"
                            accept="image/jpeg,image/jpg,image/png,image/webp"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          {profileLogo ? (
                            <div className="relative w-full h-full p-1.5 flex items-center justify-center animate-in fade-in duration-200">
                              {/* Floating Remove Button in top corner */}
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setProfileLogo(null);
                                  const input = document.getElementById('settings-logo-file-input') as HTMLInputElement;
                                  if (input) input.value = '';
                                  showNotification('info', 'تمت إزالة شعار المنشأة.');
                                }}
                                className="absolute top-2 left-2 z-20 text-[10px] font-black text-white bg-rose-600 hover:bg-rose-700 px-2 py-0.5 rounded-lg border border-rose-400/80 shadow-md transition-all flex items-center gap-1 cursor-pointer hover:scale-105"
                                title="إزالة الشعار"
                              >
                                <Trash className="w-3.5 h-3.5" />
                                <span>إزالة</span>
                              </button>

                              {/* Centered preview image */}
                              <div className="relative w-full h-full rounded-xl overflow-hidden flex items-center justify-center border-2 border-indigo-500/80 shadow-sm group/img">
                                <img 
                                  src={profileLogo} 
                                  alt="معاينة شعار المنشأة" 
                                  className="w-full h-full object-cover transition-transform group-hover/img:scale-105" 
                                  referrerPolicy="no-referrer" 
                                />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                                  <span className="text-[10px] font-black text-white bg-indigo-600/90 backdrop-blur-xs px-2.5 py-1 rounded-lg shadow">تغيير الصورة</span>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-1.5 p-2 text-center flex flex-col items-center justify-center">
                              <UploadCloud className="w-8 h-8 text-indigo-500 dark:text-indigo-400 mx-auto group-hover:scale-110 transition-transform" />
                              <span className="block text-[10px] font-black text-indigo-950 dark:text-indigo-200">رفع شعار المنشأة الرسمي (PNG, JPEG, WebP)</span>
                              <span className="block text-[8px] text-slate-500 dark:text-slate-300 font-sans">الحد الأقصى 500KB - أبعاد حتى 960x960 بكسل</span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 4: Review and Submit */}
                    {identityWizStep === 4 && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                        <div className="bg-emerald-50 text-emerald-800 p-3.5 rounded-2xl text-[11px] leading-relaxed border border-emerald-100">
                          ✓ جميع حقول البيانات القانونية والتشغيلية الموحدة مكتملة بنسبة ١٠٠٪ وبانتظام تام مع نظام تخطيط موارد المنشأة (ERP).
                        </div>

                        {/* ID Card Display */}
                        <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 text-white rounded-3xl p-6 relative overflow-hidden shadow-md border-t-4 border-amber-400">
                          <div className="absolute top-0 left-0 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
                          <div className="flex justify-between items-start relative z-10">
                            <div className="text-left font-mono">
                              <span className="text-[8px] tracking-widest text-slate-400 uppercase block font-sans">BOS ENROLLMENT ID</span>
                              <span className="text-xs font-black text-amber-300">CR-{identityWizData.crNumber}</span>
                            </div>
                            <div className="text-right space-y-1">
                              <span className="bg-amber-400 text-slate-900 text-[8px] font-black px-2 py-0.5 rounded-full">شريك معتمد</span>
                              <h4 className="text-base font-black">{identityWizData.businessName}</h4>
                              <p className="text-[10px] text-indigo-200 font-bold">{identityWizData.slogan}</p>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/10 text-right text-[10px] relative z-10">
                            <div>
                              <span className="text-slate-400 block">رقم الجوال المعتمد</span>
                              <span className="font-mono text-xs font-extrabold text-slate-200">{identityWizData.contactPhone}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">الرقم الضريبي الموحد</span>
                              <span className="font-mono text-xs font-extrabold text-slate-200">{identityWizData.vatNumber}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-slate-400 block">الوصف البانورامي للمنشأة</span>
                              <p className="text-slate-300 text-[10px] leading-relaxed mt-0.5">{identityWizData.description}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                      <div>
                        {identityWizStep > 1 && (
                          <button
                            onClick={() => setIdentityWizStep(identityWizStep - 1)}
                            className="px-4 py-2 text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl text-xs font-black cursor-pointer"
                          >
                            السابق
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {identityWizStep < 4 ? (
                          <button
                            onClick={() => {
                              if (identityWizStep === 1 && !identityWizData.businessName) {
                                showNotification('warning', 'يرجى إدخال اسم المنشأة التجاري أولاً.');
                                return;
                              }
                              setIdentityWizStep(identityWizStep + 1);
                            }}
                            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer"
                          >
                            التالي
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setProfileBusinessName(identityWizData.businessName);
                              setProfileBusinessCR(identityWizData.crNumber);
                              setProfileBusinessDesc(identityWizData.description);
                              setProfileBusinessContact(identityWizData.contactPhone);
                              setIdentityWizStep(1); // Reset
                              showNotification('success', 'تهانينا! تم تحديث واعتماد الهوية التجارية للمنشأة بالكامل في نظام تشغيل الأعمال ERP بنجاح.');
                            }}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md"
                          >
                            اعتماد وتحديث الهوية الموحدة
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Branches Management */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">BRANCHES MANAGEMENT</span>
                      <h3 className="text-sm font-black text-slate-800">إدارة الفروع المستقلة ({profileBranches.length})</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">معرف الفرع</th>
                            <th className="p-3 font-black">اسم الفرع</th>
                            <th className="p-3 font-black">المدينة</th>
                            <th className="p-3 font-black">رقم التواصل</th>
                            <th className="p-3 font-black">العنوان</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                          {profileBranches.map((br) => (
                            <tr key={br.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-500 font-bold">{br.id}</td>
                              <td className="p-3 font-extrabold text-slate-800">{br.name}</td>
                              <td className="p-3 text-slate-600">{br.city}</td>
                              <td className="p-3 font-mono text-slate-600">{br.phone}</td>
                              <td className="p-3 text-slate-500">{br.address}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Branch form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
                      <h4 className="text-xs font-black text-indigo-700">إضافة فرع مستقل جديد</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="اسم الفرع (مثل: فرع الرياض الغربي)"
                          value={newBranchName}
                          onChange={(e) => setNewBranchName(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <select
                          value={newBranchCity}
                          onChange={(e) => setNewBranchCity(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          <option value="الرياض">الرياض</option>
                          <option value="جدة">جدة</option>
                          <option value="الدمام">الدمام</option>
                          <option value="المدينة المنورة">المدينة المنورة</option>
                        </select>
                        <input
                          type="text"
                          placeholder="رقم هاتف الفرع"
                          value={newBranchPhone}
                          onChange={(e) => setNewBranchPhone(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                        />
                        <input
                          type="text"
                          placeholder="العنوان التفصيلي للفرع"
                          value={newBranchAddress}
                          onChange={(e) => setNewBranchAddress(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newBranchName || !newBranchPhone) {
                            showNotification('warning', 'يرجى كتابة اسم الفرع ورقم التواصل أولاً.');
                            return;
                          }
                          const newIdNum = profileBranches.length + 1;
                          const newBranch = {
                            id: `BR-26-${String(newIdNum).padStart(8, '0')}`,
                            name: newBranchName,
                            city: newBranchCity,
                            phone: newBranchPhone,
                            address: newBranchAddress || 'العنوان المسجل'
                          };
                          setProfileBranches([...profileBranches, newBranch]);
                          setNewBranchName('');
                          setNewBranchPhone('');
                          setNewBranchAddress('');
                          showNotification('success', `تم إضافة الفرع الجديد بنجاح بالمعرّف ${newBranch.id}`);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        حفظ وإنشاء الفرع بنظام ERP
                      </button>
                    </div>
                  </div>

                  {/* Employees Management */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">STAFF ACCESS CONTROL</span>
                      <h3 className="text-sm font-black text-slate-800">الكوادر التشغيلية والصلاحيات والمناوبة</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">معرّف الكادر</th>
                            <th className="p-3 font-black">الاسم</th>
                            <th className="p-3 font-black">الدور التشغيلي</th>
                            <th className="p-3 font-black">الفرع التابع له</th>
                            <th className="p-3 font-black">مستوى الصلاحية</th>
                            <th className="p-3 font-black">حالة المناوبة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                          {profileEmployees.map((emp) => (
                            <tr key={emp.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-500 font-bold">{emp.id}</td>
                              <td className="p-3 font-extrabold text-slate-800">{emp.name}</td>
                              <td className="p-3 text-slate-700">{emp.role}</td>
                              <td className="p-3 text-indigo-600 font-bold">{emp.branch}</td>
                              <td className="p-3 text-slate-500">
                                <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded text-[10px] font-black">
                                  {emp.permissions}
                                </span>
                              </td>
                              <td className="p-3">
                                <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-[10px] font-black">
                                  {emp.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Employee Form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
                      <h4 className="text-xs font-black text-indigo-700">إضافة موظف/مشرف لوجستي جديد في نظام ERP</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="اسم الموظف الثلاثي"
                          value={newEmpName}
                          onChange={(e) => setNewEmpName(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <input
                          type="text"
                          placeholder="الدور (مثل: مشرف تجهيز وإشراف)"
                          value={newEmpRole}
                          onChange={(e) => setNewEmpRole(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <select
                          value={newEmpBranch}
                          onChange={(e) => setNewEmpBranch(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          {profileBranches.map(br => (
                            <option key={br.id} value={br.name}>{br.name}</option>
                          ))}
                        </select>
                        <select
                          value={newEmpPerm}
                          onChange={(e) => setNewEmpPerm(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          <option value="صلاحيات كاملة">صلاحيات كاملة</option>
                          <option value="تعديل الحجوزات فقط">تعديل الحجوزات فقط</option>
                          <option value="استعراض الحجوزات فقط">استعراض الحجوزات فقط</option>
                          <option value="محدودة للفرع">محدودة للفرع</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (!newEmpName || !newEmpRole) {
                            showNotification('warning', 'يرجى تعبئة اسم الموظف ودوره اللوجستي.');
                            return;
                          }
                          const newEmpIdNum = profileEmployees.length + 1;
                          const newEmp = {
                            id: `EMP-26-${String(newEmpIdNum).padStart(8, '0')}`,
                            name: newEmpName,
                            role: newEmpRole,
                            branch: newEmpBranch,
                            permissions: newEmpPerm,
                            status: 'نشط'
                          };
                          setProfileEmployees([...profileEmployees, newEmp]);
                          setNewEmpName('');
                          setNewEmpRole('');
                          showNotification('success', `تم بنجاح ربط الموظف ${newEmp.name} بالفرع وتوليد المعرف الفريد ${newEmp.id}`);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        ربط الموظف بالفرع وتعيين الصلاحيات
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 3: Catalog Management */}
              {osTab === 'catalog' && (
                <div className="space-y-6">
                  {/* Catalog subtabs switcher */}
                  <div className="bg-slate-100 p-1 rounded-2xl flex gap-1 w-fit border border-slate-200/60">
                    <button
                      onClick={() => setCatalogActiveInnerTab('halls')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${catalogActiveInnerTab === 'halls' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      إدارة قاعات ومساحات المنشأة ({catalogHalls.length})
                    </button>
                    <button
                      onClick={() => setCatalogActiveInnerTab('services')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${catalogActiveInnerTab === 'services' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      الخدمات المستقلة والمساندة ({catalogServices.length})
                    </button>
                    <button
                      onClick={() => setCatalogActiveInnerTab('packages')}
                      className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${catalogActiveInnerTab === 'packages' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                      باقات المناسبات الجاهزة ({catalogPackages.length})
                    </button>
                  </div>

                  {/* Halls view */}
                  {catalogActiveInnerTab === 'halls' && (
                    <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 font-mono">VENUES & HALLS CATALOG</span>
                        <h3 className="text-sm font-black text-slate-800">قاعات المناسبات التابعة لمجموعة المنشأة</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {catalogHalls.map((h) => (
                          <div key={h.id} className="border border-slate-100 rounded-2xl p-4 hover:border-indigo-100 transition-all space-y-3">
                            <div className="flex justify-between items-start">
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${h.status === 'Pending Approval' || h.status === 'معلق بانتظار الاعتماد' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                                {h.status || 'معتمد'}
                              </span>
                              <h4 className="text-sm font-black text-slate-800">{h.name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 min-h-12 leading-relaxed">{h.description || 'لا يوجد وصف تفصيلي مسجل للقاعة.'}</p>
                            
                            {/* Real Image Album Preview if custom images are available */}
                            {h.albumImages && h.albumImages.length > 0 && (
                              <div className="space-y-1.5 pt-1">
                                <span className="text-[10px] text-slate-400 font-black block text-right">🖼️ ألبوم صور القاعة:</span>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {h.albumImages.slice(0, 4).map((img: any, idx: number) => (
                                    <div key={idx} className="relative rounded-lg overflow-hidden border border-slate-150 aspect-video">
                                      <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {idx === 3 && h.albumImages.length > 4 && (
                                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-black">
                                          +{h.albumImages.length - 4}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Real Packages Preview if available */}
                            {h.closedPackages && h.closedPackages.length > 0 && (
                              <div className="space-y-1.5 pt-1 bg-purple-50/20 p-2 rounded-xl border border-purple-100/50">
                                <span className="text-[9px] text-purple-700 font-black block text-right">📦 الباقات الشاملة والمغلقة المتاحة ({h.closedPackages.length}):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {h.closedPackages.map((pkg: any) => (
                                    <span key={pkg.id} className="bg-purple-100 text-purple-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-purple-200" title={pkg.desc}>
                                      {pkg.name} ({parseInt(pkg.price).toLocaleString()} ر.س)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Real Additional Services Preview if available */}
                            {h.additionalServices && h.additionalServices.length > 0 && (
                              <div className="space-y-1.5 pt-1 bg-indigo-50/20 p-2 rounded-xl border border-indigo-100/50">
                                <span className="text-[9px] text-indigo-700 font-black block text-right">⚙️ الخدمات التكميلية والمساندة التابعة ({h.additionalServices.length}):</span>
                                <div className="flex flex-wrap gap-1 justify-end">
                                  {h.additionalServices.map((addon: any) => (
                                    <span key={addon.id} className="bg-indigo-100 text-indigo-800 text-[9px] font-black px-2 py-0.5 rounded-md border border-indigo-200" title={addon.description}>
                                      {addon.name} ({parseInt(addon.price).toLocaleString()} ر.س)
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-50 text-center text-[10px] font-bold text-slate-500">
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="block text-slate-400">السعة الاستيعابية</span>
                                <span className="text-xs font-black text-slate-700 font-mono">{h.capacity || 400} فرد</span>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="block text-slate-400">السياسة اللوجستية</span>
                                <span className="text-xs font-black text-slate-700 truncate block">عامة</span>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg">
                                <span className="block text-slate-400">معرض الصور</span>
                                <span className="text-xs font-black text-indigo-600 font-mono">{h.photosCount || 3} صور</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Venue Addition Request Wizard (BOS-Style) */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-4 mt-4">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2 py-0.5 rounded-full uppercase font-mono">BOS Venue Engine v2.6</span>
                            <span className="text-xs text-slate-500">الخطوة {venueWizStep} من ٦</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-indigo-700">
                            <Plus className="w-4 h-4" />
                            <h4 className="text-xs font-black">معالج تقديم طلب إضافة قاعة/مساحة جديدة للمنشأة</h4>
                          </div>
                        </div>

                        {/* Step Progress Indicators */}
                        <div className="grid grid-cols-6 gap-1.5 text-center text-[9px] font-black pb-2">
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 1 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ١. الهوية والتعريف
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 2 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٢. العناوين والموقع *
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 3 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٣. السعة والضوابط *
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 4 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٤. الفترات والويكند
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 5 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٥. أنماط التسعير والتوثيق
                          </div>
                          <div className={`p-1.5 rounded-lg transition-all ${venueWizStep === 6 ? 'bg-indigo-600 text-white shadow-sm' : 'bg-white text-slate-500 border border-slate-100'}`}>
                            ٦. المراجعة والتقديم
                          </div>
                        </div>

                        {/* Step 1: Identification, Provider Name & Description */}
                        {venueWizStep === 1 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">اسم القاعة / المساحة التجاري *</label>
                                <input
                                  type="text"
                                  value={venueWizData.name}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, name: e.target.value })}
                                  placeholder="مثال: قاعة اللؤلؤة الكبرى الملكية"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تصنيف المنشأة *</label>
                                <select
                                  value={venueWizData.type}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, type: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                >
                                  <option value="قصر أفراح">قصر أفراح</option>
                                  <option value="قاعة فندقية خمس نجوم">قاعة فندقية خمس نجوم</option>
                                  <option value="استراحة فاخرة">استراحة فاخرة</option>
                                  <option value="منتجع ريفي">منتجع ريفي</option>
                                  <option value="مساحة خارجية مفتوحة">مساحة خارجية مفتوحة</option>
                                  <option value="مساحة مشتركة هجينة">مساحة مشتركة هجينة</option>
                                </select>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-indigo-900 block">اسم مزود الخدمة المسجل</label>
                                <input
                                  type="text"
                                  value={venueWizData.providerName}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, providerName: e.target.value })}
                                  placeholder="مثال: شركة ليالينا للمناسبات"
                                  className="w-full p-2.5 border border-indigo-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-indigo-950"
                                />
                              </div>
                              <div className="flex flex-col justify-center space-y-1.5 pt-2">
                                <span className="text-[10px] font-black text-indigo-900">خيارات عرض الهوية التجارية للعملاء</span>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-indigo-950">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.showProviderToCustomers}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, showProviderToCustomers: e.target.checked })}
                                    className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  إظهار اسم المزود للعملاء في واجهة الاستعراض والبحث العام
                                </label>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">جوال للتواصل (رئيسي) *</label>
                                <input
                                  type="text"
                                  value={venueWizData.contactPhone}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, contactPhone: e.target.value })}
                                  placeholder="055XXXXXXX"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">جوال للتواصل (إضافي / مكرر)</label>
                                <input
                                  type="text"
                                  value={venueWizData.contactPhone2}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, contactPhone2: e.target.value })}
                                  placeholder="055XXXXXXX"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">نبذة تعريفية (الوصف العام للمنشأة) *</label>
                              <textarea
                                value={venueWizData.description}
                                onChange={(e) => setVenueWizData({ ...venueWizData, description: e.target.value })}
                                rows={2.5}
                                placeholder="صف مزايا المنشأة وتجهيزاتها وتفاصيل الأناقة ومساحات الاستقبال الفخمة للعرائس..."
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 leading-relaxed font-sans"
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Step 2: Location, National Address & GPS Link */}
                        {venueWizStep === 2 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">المنطقة *</label>
                                <select
                                  value={venueWizData.region}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, region: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                >
                                  <option value="منطقة الرياض">منطقة الرياض</option>
                                  <option value="منطقة مكة المكرمة">منطقة مكة المكرمة</option>
                                  <option value="منطقة المدينة المنورة">منطقة المدينة المنورة</option>
                                  <option value="المنطقة الشرقية">المنطقة الشرقية</option>
                                  <option value="منطقة القصيم">منطقة القصيم</option>
                                  <option value="منطقة عسير">منطقة عسير</option>
                                  <option value="منطقة تبوك">منطقة تبوك</option>
                                </select>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">المدينة *</label>
                                <select
                                  value={venueWizData.city}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, city: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                >
                                  <option value="الرياض">الرياض</option>
                                  <option value="جدة">جدة</option>
                                  <option value="الدمام">الدمام</option>
                                  <option value="المدينة المنورة">المدينة المنورة</option>
                                  <option value="مكة المكرمة">مكة المكرمة</option>
                                  <option value="الخبر">الخبر</option>
                                  <option value="بريدة">بريدة</option>
                                  <option value="أبها">أبها</option>
                                </select>
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block flex items-center gap-1 justify-end">
                                <span>العنوان الوطني / الرابط الإحداثي الفوري للموقع (مثل خرائط Google Map)</span>
                                <MapPin className="w-3.5 h-3.5 text-red-500" />
                              </label>
                              <input
                                type="text"
                                value={venueWizData.nationalAddress}
                                onChange={(e) => setVenueWizData({ ...venueWizData, nationalAddress: e.target.value })}
                                placeholder="مثال: https://maps.google.com/?q=24.1234,46.5678 أو العنوان الوطني: الملقا 4567، الرياض"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-left font-mono font-bold text-slate-700"
                                dir="ltr"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">تفصيل العنوان ووصف المعالم القريبة</label>
                              <textarea
                                value={venueWizData.addressDetails}
                                onChange={(e) => setVenueWizData({ ...venueWizData, addressDetails: e.target.value })}
                                rows={2.5}
                                placeholder="مثال: تقاطع طريق الملك سلمان بن عبدالعزيز مع طريق أنس بن مالك، خلف صيدلية الدواء مباشرة، حي الملقا"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 font-bold"
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Step 3: Capacity, Amenities, Additional Packages & Rules */}
                        {venueWizStep === 3 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">سعة الاستيعاب (شخص) *</label>
                                <input
                                  type="number"
                                  value={venueWizData.capacity}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, capacity: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">عدد الطاولات المتاحة</label>
                                <input
                                  type="number"
                                  value={venueWizData.tablesCount}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, tablesCount: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">عدد الكراسي المتاحة</label>
                                <input
                                  type="number"
                                  value={venueWizData.chairsCount}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, chairsCount: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold"
                                />
                              </div>
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">مرافق المنشأة، الضوابط والضمانات التعاقدية</label>
                              <input
                                type="text"
                                value={venueWizData.facilitiesAmenities}
                                onChange={(e) => setVenueWizData({ ...venueWizData, facilitiesAmenities: e.target.value })}
                                placeholder="مثال: صالة طعام مستقلة، مصعد خاص، حراسة أمنية، ضمان سلامة الممتلكات الشخصية"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                              />
                            </div>

                            <div className="space-y-1">
                              <label className="text-[10px] font-black text-slate-500 block">باقة الخدمات الإضافية المتضمنة مع القاعة</label>
                              <input
                                type="text"
                                value={venueWizData.additionalServicesBundle}
                                onChange={(e) => setVenueWizData({ ...venueWizData, additionalServicesBundle: e.target.value })}
                                placeholder="مثال: باقة الضيافة الملكية المتكاملة مع طاقم الخدمة بالبخور الفاخر"
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                              />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">قواعد وضوابط المكان</label>
                                <textarea
                                  value={venueWizData.venueRules}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, venueRules: e.target.value })}
                                  rows={2}
                                  placeholder="أهم قواعد الحضور والتشغيل..."
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">شروط وأحكام العقد</label>
                                <textarea
                                  value={venueWizData.contractTerms}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, contractTerms: e.target.value })}
                                  rows={2}
                                  placeholder="الأحكام القانونية للفسخ والتأخير وسداد الدفعات..."
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700"
                                />
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 4: Pricing structure, Weekend surge & Taxes & Refund policies */}
                        {venueWizStep === 4 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="bg-slate-100 p-2.5 rounded-xl text-[10px] text-slate-700 leading-relaxed font-bold border border-slate-200">
                              ℹ️ يرجى إدخال أسعار التأجير التفصيلية لفترات اليوم المتاحة لديكم، وتحديد مبالغ التأمين وسياسات الإرجاع بدقة.
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تأجير: الفترة الصباحية (ر.س)</label>
                                <input
                                  type="number"
                                  value={venueWizData.morningPrice}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, morningPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تأجير: الفترة المسائية (ر.س)</label>
                                <input
                                  type="number"
                                  value={venueWizData.eveningPrice}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, eveningPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">تأجير: اليوم الكامل (ر.س)</label>
                                <input
                                  type="number"
                                  value={venueWizData.fullDayPrice}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, fullDayPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                            </div>

                            {/* Weekend Pricing Feature (Dynamic Weekend Multipliers) */}
                            <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-100 space-y-3">
                              <div className="flex items-center justify-between pb-1 border-b border-purple-100">
                                <span className="bg-purple-100 text-purple-700 text-[8px] font-black px-2 py-0.5 rounded-full uppercase font-mono">BOS Advanced Plan Feature</span>
                                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-purple-950">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.weekendPricingEnabled}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, weekendPricingEnabled: e.target.checked })}
                                    className="rounded border-purple-300 text-purple-600 focus:ring-purple-500"
                                  />
                                  تسعير عطلة نهاية الأسبوع (الويكند) ميزة تضاف حسب الباقة
                                </label>
                              </div>

                              {venueWizData.weekendPricingEnabled && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">نوع الزيادة للويكند</label>
                                      <select
                                        value={venueWizData.increaseType}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, increaseType: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-black text-purple-950"
                                      >
                                        <option value="percentage">نسبة مئوية (%)</option>
                                        <option value="fixed">مبلغ ثابت (ر.س)</option>
                                      </select>
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">الزيادة الصباحية</label>
                                      <input
                                        type="number"
                                        value={venueWizData.morningIncrease}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, morningIncrease: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-mono font-bold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">الزيادة المسائية</label>
                                      <input
                                        type="number"
                                        value={venueWizData.eveningIncrease}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, eveningIncrease: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-mono font-bold"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-purple-800 block">زيادة اليوم الكامل</label>
                                      <input
                                        type="number"
                                        value={venueWizData.fullDayIncrease}
                                        onChange={(e) => setVenueWizData({ ...venueWizData, fullDayIncrease: e.target.value })}
                                        className="w-full p-2 border border-purple-200 bg-white rounded-lg text-[11px] outline-none text-right font-mono font-bold"
                                      />
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </div>

                            {/* Taxes and Security Deposits */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">فترة استرجاع العميل (يوم) *</label>
                                <input
                                  type="number"
                                  value={venueWizData.refundPeriod}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, refundPeriod: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 block">مبلغ التأمين المسترد (ر.س) *</label>
                                <input
                                  type="number"
                                  value={venueWizData.securityDeposit}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, securityDeposit: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                />
                              </div>
                            </div>

                            <div className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100/50 flex flex-col md:flex-row items-center justify-between gap-3">
                              <div className="flex items-center gap-1.5 cursor-pointer text-xs font-black text-indigo-950">
                                <input
                                  type="checkbox"
                                  checked={venueWizData.isTaxExempt}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, isTaxExempt: e.target.checked })}
                                  className="rounded border-indigo-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                />
                                زر تبديل الإعفاء للتصريح الضريبي للمنشأة
                              </div>
                              {!venueWizData.isTaxExempt && (
                                <div className="w-full md:w-auto flex items-center gap-2">
                                  <span className="text-[10px] font-black text-slate-500 whitespace-nowrap">الرقم الضريبي للمنشأة (VAT):</span>
                                  <input
                                    type="text"
                                    value={venueWizData.taxNumber}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, taxNumber: e.target.value })}
                                    placeholder="30XXXXXXXXXXXXX"
                                    className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-center font-mono font-bold text-slate-800 w-44"
                                  />
                                </div>
                              )}
                            </div>
                          </motion.div>
                        )}

                        {/* Step 5: Pricing Patterns, Documents, Statuses & Legal Pledge */}
                        {venueWizStep === 5 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            {/* Pricing Pattern & Service Synthesis */}
                            <div className="space-y-1.5 bg-indigo-50/40 p-4 rounded-xl border border-indigo-100/50">
                              <label className="text-[11px] font-black text-indigo-950 block flex items-center gap-1 justify-end">
                                <span>أنماط التسعير وتوليف خدمات المنصة والتكامل المالي</span>
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                              </label>
                              <div className="grid grid-cols-1 gap-2.5 mt-2">
                                <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50/20 transition-all text-xs font-bold text-slate-800">
                                  <input
                                    type="radio"
                                    name="pricingPattern"
                                    checked={venueWizData.pricingPattern === 'Comprehensive'}
                                    onChange={() => setVenueWizData({ ...venueWizData, pricingPattern: 'Comprehensive' })}
                                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block font-black text-indigo-950">الباقات الشاملة والمغلقة</span>
                                    <span className="text-[10px] text-slate-400 font-medium">حزم تسعير متكاملة مغلقة تشمل المكان وكافة الخدمات بصفقة واحدة غير قابلة للتجزئة.</span>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50/20 transition-all text-xs font-bold text-slate-800">
                                  <input
                                    type="radio"
                                    name="pricingPattern"
                                    checked={venueWizData.pricingPattern === 'Individual'}
                                    onChange={() => setVenueWizData({ ...venueWizData, pricingPattern: 'Individual' })}
                                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block font-black text-indigo-950">الخدمات المنفردة الاختيارية</span>
                                    <span className="text-[10px] text-slate-400 font-medium">حجز القاعة كعنصر مجرد مع تمكين العميل من شراء واختيار خدمات إضافية منفردة حسب الحاجة.</span>
                                  </div>
                                </label>
                                <label className="flex items-center gap-3 bg-white p-3 rounded-xl border border-indigo-100 cursor-pointer hover:bg-indigo-50/20 transition-all text-xs font-bold text-slate-800">
                                  <input
                                    type="radio"
                                    name="pricingPattern"
                                    checked={venueWizData.pricingPattern === 'Hybrid'}
                                    onChange={() => setVenueWizData({ ...venueWizData, pricingPattern: 'Hybrid' })}
                                    className="text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  <div>
                                    <span className="block font-black text-indigo-950">الهجين وتفعيل الخدمات الخارجية</span>
                                    <span className="text-[10px] text-slate-400 font-medium">السماح بتمرير الخدمات الخارجية وتفعيل دمج شركاء المنصة المستقلين مع خدمات المكان العامة.</span>
                                  </div>
                                </label>
                              </div>
                            </div>

                            {/* Comprehensive closed packages inventory & creation */}
                            {venueWizData.pricingPattern === 'Comprehensive' && (
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }} 
                                animate={{ opacity: 1, height: 'auto' }} 
                                className="space-y-4 bg-purple-50/40 p-4 rounded-xl border border-purple-100"
                              >
                                <div className="flex items-center justify-between pb-2 border-b border-purple-100">
                                  <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase font-mono">BOS Package Inventory</span>
                                  <h4 className="text-xs font-black text-purple-950 flex items-center gap-1.5 justify-end">
                                    <span>مستودع الباقات المغلقة والجاهزة (الشاملة)</span>
                                    <Package className="w-4 h-4 text-purple-600" />
                                  </h4>
                                </div>

                                {/* Packages List */}
                                <div className="space-y-2">
                                  {venueWizData.closedPackages && venueWizData.closedPackages.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {venueWizData.closedPackages.map((pkg) => (
                                        <div key={pkg.id} className="bg-white p-3.5 rounded-xl border border-purple-100 hover:shadow-sm transition-all space-y-2 relative">
                                          <button 
                                            type="button"
                                            onClick={() => {
                                              setVenueWizData({
                                                ...venueWizData,
                                                closedPackages: venueWizData.closedPackages.filter(p => p.id !== pkg.id)
                                              });
                                              showNotification('info', `تم حذف الباقة: ${pkg.name}`);
                                            }}
                                            className="absolute top-3 left-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all cursor-pointer"
                                            title="حذف الباقة"
                                          >
                                            <X className="w-4 h-4" />
                                          </button>
                                          
                                          <div className="text-right pl-6">
                                            <span className="bg-purple-50 text-purple-700 text-[8px] font-black px-2 py-0.5 rounded-full font-mono">{pkg.id}</span>
                                            <h5 className="font-black text-purple-950 text-xs mt-1">{pkg.name}</h5>
                                            <span className="text-xs font-mono font-black text-emerald-600 block mt-0.5">{parseInt(pkg.price).toLocaleString()} ر.س</span>
                                            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans font-medium">{pkg.desc || 'لا يوجد وصف مضاف للباقة.'}</p>
                                          </div>
                                          
                                          {pkg.services && pkg.services.length > 0 && (
                                            <div className="pt-2 border-t border-slate-50 flex flex-wrap gap-1 justify-end">
                                              {pkg.services.map((ser, i) => (
                                                <span key={i} className="bg-slate-50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md border border-slate-100">
                                                  {ser}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="bg-white/50 p-6 rounded-xl border border-dashed border-purple-150 text-center space-y-1">
                                      <span className="block text-[11px] font-black text-purple-900">لا توجد باقات جاهزة في المستودع حالياً</span>
                                      <p className="text-[10px] text-slate-400 font-medium">قم بتدشين باقتك الأولى المغلقة عبر النموذج أدناه لتضمينها مع طلب القاعة.</p>
                                    </div>
                                  )}
                                </div>

                                {/* Add New Package Form */}
                                <div className="bg-white p-4 rounded-xl border border-purple-100 space-y-3 text-right">
                                  <span className="block text-[10px] font-black text-purple-950 border-b pb-1.5 mb-1 text-right">⚙️ إضافة باقة شاملة ومغلقة جديدة للمستودع</span>
                                  
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 block text-right">اسم الباقة الفريدة *</label>
                                      <input 
                                        type="text"
                                        value={newPkgName}
                                        onChange={(e) => setNewPkgName(e.target.value)}
                                        placeholder="مثال: باقة الأفراح الماسية المتكاملة"
                                        className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-800"
                                      />
                                    </div>
                                    <div className="space-y-1">
                                      <label className="text-[10px] font-black text-slate-500 block text-right">سعر الباقة الشاملة (ر.س) *</label>
                                      <input 
                                        type="number"
                                        value={newPkgPrice}
                                        onChange={(e) => setNewPkgPrice(e.target.value)}
                                        placeholder="مثال: 25000"
                                        className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                      />
                                    </div>
                                  </div>

                                  {/* Services/Features list tag input */}
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">الخدمات والمزايا المتضمنة مع الباقة *</label>
                                    <div className="flex gap-2">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          if (!newPkgServiceInput.trim()) return;
                                          if (newPkgServices.includes(newPkgServiceInput.trim())) {
                                            showNotification('warning', 'هذه الخدمة مضافة بالفعل.');
                                            return;
                                          }
                                          setNewPkgServices([...newPkgServices, newPkgServiceInput.trim()]);
                                          setNewPkgServiceInput('');
                                        }}
                                        className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black rounded-xl cursor-pointer"
                                      >
                                        أضف
                                      </button>
                                      <input 
                                        type="text"
                                        value={newPkgServiceInput}
                                        onChange={(e) => setNewPkgServiceInput(e.target.value)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (!newPkgServiceInput.trim()) return;
                                            setNewPkgServices([...newPkgServices, newPkgServiceInput.trim()]);
                                            setNewPkgServiceInput('');
                                          }
                                        }}
                                        placeholder="اكتب خدمة أو ميزة (مثل: بوفيه عشاء ملكي، تصوير فيديو، إلخ) ثم اضغط زر الإضافة"
                                        className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right text-slate-800 font-bold flex-1"
                                      />
                                    </div>

                                    {/* Pre-configured Quick Suggestions */}
                                    <div className="flex flex-wrap gap-1.5 justify-end pt-1">
                                      {['بوفيه عشاء مفتوح', 'كوشة وتنسيق ورود طبيعية', 'طاقم ضيافة نسائي VIP', 'تصوير فوتوغرافي وفيديو', 'تغطية دي جي وإضاءة متحركة', 'جناح لغرفة العروس'].map((suggestion) => (
                                        <button
                                          key={suggestion}
                                          type="button"
                                          onClick={() => {
                                            if (newPkgServices.includes(suggestion)) return;
                                            setNewPkgServices([...newPkgServices, suggestion]);
                                          }}
                                          className="text-[9px] font-black bg-slate-100 hover:bg-purple-50 text-slate-600 hover:text-purple-700 px-2.5 py-1 rounded-full border border-slate-200 cursor-pointer transition-all"
                                        >
                                          + {suggestion}
                                        </button>
                                      ))}
                                    </div>

                                    {/* Added Features Grid */}
                                    {newPkgServices.length > 0 && (
                                      <div className="flex flex-wrap gap-1.5 justify-end p-2 bg-slate-50 rounded-xl border border-slate-200/50 mt-1">
                                        {newPkgServices.map((ser, idx) => (
                                          <span key={idx} className="bg-purple-50 text-purple-700 text-[10px] font-black px-2.5 py-1 rounded-lg border border-purple-100/60 flex items-center gap-1.5">
                                            <button 
                                              type="button"
                                              onClick={() => setNewPkgServices(newPkgServices.filter((_, i) => i !== idx))}
                                              className="text-red-500 hover:text-red-700 font-black text-xs"
                                            >
                                              ×
                                            </button>
                                            <span>{ser}</span>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>

                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">وصف الباقة وشروط الاستفادة</label>
                                    <textarea 
                                      value={newPkgDesc}
                                      onChange={(e) => setNewPkgDesc(e.target.value)}
                                      rows={2}
                                      placeholder="اكتب تفاصيل إضافية عن شروط العرض، أو سياسة الإلغاء للباقة، أو مبررات الأسعار الشاملة لليلة المناسبة..."
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right text-slate-800"
                                    />
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (!newPkgName.trim()) {
                                        showNotification('warning', 'يرجى إدخال اسم الباقة.');
                                        return;
                                      }
                                      if (!newPkgPrice.trim()) {
                                        showNotification('warning', 'يرجى إدخال سعر الباقة.');
                                        return;
                                      }
                                      if (newPkgServices.length === 0) {
                                        showNotification('warning', 'يرجى إدخال ميزة أو خدمة واحدة متضمنة على الأقل.');
                                        return;
                                      }

                                      // Generate a package ID format like PKG-YY-00000001
                                      const currentYear = new Date().getFullYear().toString().slice(-2);
                                      const sequentialNum = String((venueWizData.closedPackages?.length || 0) + 1).padStart(8, '0');
                                      const pkgId = `PKG-${currentYear}-${sequentialNum}`;

                                      const newPkg = {
                                        id: pkgId,
                                        name: newPkgName.trim(),
                                        price: newPkgPrice.trim(),
                                        services: [...newPkgServices],
                                        desc: newPkgDesc.trim()
                                      };

                                      setVenueWizData({
                                        ...venueWizData,
                                        closedPackages: [...(venueWizData.closedPackages || []), newPkg]
                                      });

                                      // Reset fields
                                      setNewPkgName('');
                                      setNewPkgPrice('');
                                      setNewPkgDesc('');
                                      setNewPkgServices([]);
                                      setNewPkgServiceInput('');

                                      showNotification('success', `تم تدشين الباقة الشاملة "${newPkg.name}" وحفظها في مستودع المنشأة بالرقم ${newPkg.id}`);
                                    }}
                                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                  >
                                    <Plus className="w-4 h-4" />
                                    <span>إضافة الباقة وحفظها في مستودع المنشأة</span>
                                  </button>
                                </div>
                              </motion.div>
                            )}

                            {/* Complementary Addons (الخدمات الإضافية التكميلية للقاعة إن وجد) */}
                            <div className="space-y-4 bg-indigo-50/20 p-4 rounded-xl border border-indigo-100">
                              <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                                <span className="bg-indigo-100 text-indigo-700 text-[9px] font-black px-2.5 py-1 rounded-full uppercase font-mono">BOS Complementary Addons</span>
                                <h4 className="text-xs font-black text-indigo-950 flex items-center gap-1.5 justify-end">
                                  <span>الخدمات الإضافية التكميلية والمساندة التابعة للقاعة (إن وجد)</span>
                                  <Sliders className="w-4 h-4 text-indigo-600" />
                                </h4>
                              </div>

                              {/* Addons List */}
                              <div className="space-y-2">
                                {venueWizData.additionalServices && venueWizData.additionalServices.length > 0 ? (
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {venueWizData.additionalServices.map((addon) => (
                                      <div key={addon.id} className="bg-white p-3.5 rounded-xl border border-indigo-100 hover:shadow-sm transition-all space-y-2 relative">
                                        <button 
                                          type="button"
                                          onClick={() => {
                                            setVenueWizData({
                                              ...venueWizData,
                                              additionalServices: (venueWizData.additionalServices || []).filter(a => a.id !== addon.id)
                                            });
                                            showNotification('info', `تم حذف الخدمة التكميلية: ${addon.name}`);
                                          }}
                                          className="absolute top-3 left-3 text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-all cursor-pointer"
                                          title="حذف الخدمة"
                                        >
                                          <X className="w-4 h-4" />
                                        </button>
                                        
                                        <div className="text-right pl-6 font-sans">
                                          <div className="flex items-center justify-between">
                                            <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded-full font-mono">{addon.id}</span>
                                            <span className="bg-slate-100 text-slate-700 text-[8px] font-black px-2 py-0.5 rounded-full">{addon.category}</span>
                                          </div>
                                          <h5 className="font-black text-indigo-950 text-xs mt-1">{addon.name}</h5>
                                          <span className="text-xs font-mono font-black text-emerald-600 block mt-0.5">{parseInt(addon.price).toLocaleString()} ر.س</span>
                                          <p className="text-[10px] text-slate-400 mt-1 leading-relaxed font-sans font-medium">{addon.description || 'لا يوجد وصف مضاف للخدمة.'}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="bg-white/50 p-6 rounded-xl border border-dashed border-indigo-150 text-center space-y-1">
                                    <span className="block text-[11px] font-black text-indigo-900">لا توجد خدمات إضافية تكميلية تابعة للقاعة مضافة حالياً</span>
                                    <p className="text-[10px] text-slate-400 font-medium">يمكنك تدشين خدمات تكميلية اختيارية تابعة للمنشأة مباشرة (مثل الضيافة الإضافية، التصوير، كشافات ومؤثرات) من هنا.</p>
                                  </div>
                                )}
                              </div>

                              {/* Add New Addon Form */}
                              <div className="bg-white p-4 rounded-xl border border-indigo-100 space-y-3 text-right">
                                <span className="block text-[10px] font-black text-indigo-950 border-b pb-1.5 mb-1 text-right">⚙️ إضافة خدمة تكميلية ومساندة تابعة للمنشأة</span>
                                
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">اسم الخدمة التكميلية *</label>
                                    <input 
                                      type="text"
                                      value={newAddonName}
                                      onChange={(e) => setNewAddonName(e.target.value)}
                                      placeholder="مثال: طاقم تقديم قهوة وشاي VIP نسائي"
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">سعر الخدمة التكميلية (ر.س) *</label>
                                    <input 
                                      type="number"
                                      value={newAddonPrice}
                                      onChange={(e) => setNewAddonPrice(e.target.value)}
                                      placeholder="مثال: 1500"
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800"
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 block text-right">فئة الخدمة التكميلية *</label>
                                    <select
                                      value={newAddonCategory}
                                      onChange={(e) => setNewAddonCategory(e.target.value)}
                                      className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-700"
                                    >
                                      <option value="ضيافة">ضيافة وتأمين الأطعمة</option>
                                      <option value="تصوير">توثيق وتصوير فوتوغرافي/فيديو</option>
                                      <option value="ديكور">تنسيق ديكور وممرات وورود</option>
                                      <option value="إضاءة وصوت">أجهزة إضاءة ومؤثرات وصوتيات</option>
                                      <option value="أمن وحراسة">حراسة أمنية وتنظيم لوجستي</option>
                                      <option value="أخرى">خدمات أخرى تكميلية</option>
                                    </select>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[10px] font-black text-slate-500 block text-right">الوصف التفصيلي للخدمة ومميزاتها</label>
                                  <textarea 
                                    value={newAddonDesc}
                                    onChange={(e) => setNewAddonDesc(e.target.value)}
                                    rows={1.5}
                                    placeholder="صف تفاصيل الخدمة التكميلية (مثل: عدد طاقم الضيافة، الأدوات المستخدمة، الالتزام بالوقت...)"
                                    className="w-full p-2 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right text-slate-800"
                                  />
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    if (!newAddonName.trim()) {
                                      showNotification('warning', 'يرجى إدخال اسم الخدمة التكميلية.');
                                      return;
                                    }
                                    if (!newAddonPrice.trim()) {
                                      showNotification('warning', 'يرجى إدخال سعر الخدمة التكميلية.');
                                      return;
                                    }

                                    // Generate a service request ID format like SRV-YY-00000001
                                    const currentYear = new Date().getFullYear().toString().slice(-2);
                                    const sequentialNum = String(((venueWizData.additionalServices || []).length) + 1).padStart(8, '0');
                                    const addonId = `SRV-${currentYear}-${sequentialNum}`;

                                    const newAddon = {
                                      id: addonId,
                                      name: newAddonName.trim(),
                                      price: newAddonPrice.trim(),
                                      category: newAddonCategory,
                                      description: newAddonDesc.trim()
                                    };

                                    setVenueWizData({
                                      ...venueWizData,
                                      additionalServices: [...(venueWizData.additionalServices || []), newAddon]
                                    });

                                    // Reset addon fields
                                    setNewAddonName('');
                                    setNewAddonPrice('');
                                    setNewAddonDesc('');
                                    setNewAddonCategory('ضيافة');

                                    showNotification('success', `تم تدشين الخدمة التكميلية للقاعة "${newAddon.name}" بنجاح بالرمز ${newAddon.id}`);
                                  }}
                                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5"
                                >
                                  <Plus className="w-4 h-4" />
                                  <span>إضافة الخدمة التكميلية وتأكيد ربطها بالقاعة</span>
                                </button>
                              </div>
                            </div>

                            {/* Hall Photo Album (توليف وتدشين ألبوم الصور) */}
                            <div className="space-y-3 bg-white p-4 rounded-xl border border-slate-200">
                              <div className="flex items-center justify-between pb-1.5 border-b mb-2">
                                <span className="bg-indigo-50 text-indigo-700 text-[8px] font-black px-2 py-0.5 rounded-full font-mono">BOS Media Synthesis Engine</span>
                                <h4 className="text-[11px] font-black text-slate-800 flex items-center gap-1 justify-end">
                                  <span>تدشين وتوليف ألبوم صور القاعة الشامل</span>
                                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                                </h4>
                              </div>

                              <p className="text-[10px] text-slate-400 text-right leading-relaxed font-medium">
                                قم برفع مجموعة مميزة من صور القاعة لتمثيلها في العرض العام. يدعم صيغ <strong className="text-slate-600">PNG, JPG, WEBP</strong> بحد أقصى <strong className="text-slate-600">500KB للواحدة</strong>. يمكنك تحديد عدة صور معاً للرفع الفوري والتدشين بنقرة واحدة.
                              </p>

                              {/* Upload Dropzone */}
                              <div className="relative">
                                <input 
                                  type="file"
                                  id="venue-album-upload"
                                  multiple
                                  accept=".png, .jpg, .jpeg, .webp"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length === 0) return;

                                    const validFiles: File[] = [];
                                    const maxSizeBytes = 500 * 1024; // 500KB
                                    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

                                    for (const file of files) {
                                      const ext = file.name.split('.').pop()?.toLowerCase();
                                      const isAllowedExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
                                      const isAllowedType = allowedTypes.includes(file.type) || isAllowedExt;

                                      if (!isAllowedType) {
                                        showNotification('error', `ملف غير مدعوم: ${file.name}. يدعم فقط صيغ (PNG, JPG, WEBP).`);
                                        continue;
                                      }

                                      if (file.size > maxSizeBytes) {
                                        showNotification('error', `حجم الملف يتعدى 500KB: ${file.name} (الحجم: ${Math.round(file.size / 1024)}KB).`);
                                        continue;
                                      }

                                      validFiles.push(file);
                                    }

                                    if (validFiles.length === 0) return;

                                    setIsSynthesizingAlbum(true);
                                    setSynthesisProgress(0);
                                    setSynthesisStepText('بدء تشفير وتوليف ألبوم صور القاعة...');

                                    const steps = [
                                      { progress: 25, text: 'تحليل أبعاد الصور والتحقق من التراخيص الرقمية للترميز...' },
                                      { progress: 55, text: 'تقليص وضغط حجم الصور لتحسين سرعة تحميل العميل للحد الأقصى...' },
                                      { progress: 85, text: 'تشفير وحقن ألبوم الصور في مخزن الهوية السحابي التابع للمنصة...' },
                                      { progress: 100, text: 'تم توليف وتدشين ألبوم صور القاعة بنجاح في الوقت الحقيقي!' }
                                    ];

                                    let stepIdx = 0;
                                    const interval = setInterval(() => {
                                      if (stepIdx < steps.length) {
                                        setSynthesisProgress(steps[stepIdx].progress);
                                        setSynthesisStepText(steps[stepIdx].text);
                                        stepIdx++;
                                      } else {
                                        clearInterval(interval);
                                        
                                        let loadedCount = 0;
                                        const newImagesList: Array<{ name: string; size: number; dataUrl: string }> = [];

                                        validFiles.forEach((file) => {
                                          const reader = new FileReader();
                                          reader.onload = (event) => {
                                            if (event.target?.result) {
                                              newImagesList.push({
                                                name: file.name,
                                                size: file.size,
                                                dataUrl: event.target.result as string
                                              });
                                            }
                                            loadedCount++;
                                            if (loadedCount === validFiles.length) {
                                              setVenueWizData(prev => ({
                                                ...prev,
                                                albumImages: [...(prev.albumImages || []), ...newImagesList]
                                              }));
                                              setIsSynthesizingAlbum(false);
                                              showNotification('success', `تم توليف وتدشين عدد ${validFiles.length} صور في ألبوم القاعة بنجاح!`);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        });
                                      }
                                    }, 400);
                                  }}
                                  className="hidden"
                                />
                                <label 
                                  htmlFor="venue-album-upload"
                                  className="flex flex-col items-center justify-center border-2 border-dashed border-slate-200 hover:border-indigo-500 bg-slate-50/50 hover:bg-indigo-50/10 rounded-2xl p-6 text-center cursor-pointer transition-all space-y-2 group"
                                >
                                  <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-all">
                                    <Plus className="w-5 h-5" />
                                  </div>
                                  <span className="text-xs font-black text-slate-700">اضغط هنا لتحديد عدة صور معاً من جهازك</span>
                                  <span className="text-[9px] text-slate-400">يدعم تنسيق PNG, JPG, WEBP بحد أقصى 500KB لكل صورة</span>
                                </label>
                              </div>

                              {/* Loading/Synthesis Progress state */}
                              {isSynthesizingAlbum && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 bg-indigo-50/40 rounded-xl border border-indigo-100 space-y-2 text-right">
                                  <div className="flex justify-between items-center text-[10px] font-black text-indigo-950 font-mono">
                                    <span>{synthesisProgress}%</span>
                                    <span>{synthesisStepText}</span>
                                  </div>
                                  <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full transition-all duration-300" style={{ width: `${synthesisProgress}%` }}></div>
                                  </div>
                                </motion.div>
                              )}

                              {/* Album Preview Grid */}
                              {venueWizData.albumImages && venueWizData.albumImages.length > 0 && (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center text-[9px] font-black text-slate-400 px-1 pt-1">
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        setVenueWizData(prev => ({ ...prev, albumImages: [] }));
                                        showNotification('info', 'تم إفراغ ألبوم الصور بالكامل.');
                                      }}
                                      className="text-red-500 hover:underline"
                                    >
                                      إفراغ الألبوم
                                    </button>
                                    <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-mono text-[9px]">ألبوم الصور الملحق: {venueWizData.albumImages.length} صور</span>
                                  </div>
                                  
                                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                                    {venueWizData.albumImages.map((img, index) => (
                                      <div key={index} className="relative group rounded-xl overflow-hidden border border-slate-200/60 aspect-video bg-slate-50 shadow-sm">
                                        <img 
                                          src={img.dataUrl} 
                                          alt={img.name} 
                                          className="w-full h-full object-cover" 
                                          referrerPolicy="no-referrer"
                                        />
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-2">
                                          <div className="flex justify-between">
                                            <button 
                                              type="button"
                                              onClick={() => {
                                                setVenueWizData(prev => ({
                                                  ...prev,
                                                  albumImages: prev.albumImages.filter((_, idx) => idx !== index)
                                                }));
                                                showNotification('info', `تم حذف الصورة: ${img.name}`);
                                              }}
                                              className="p-1 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all cursor-pointer"
                                              title="حذف"
                                            >
                                              <X className="w-3 h-3" />
                                            </button>
                                            <span className="text-[8px] text-white font-mono bg-indigo-950/80 px-1 py-0.5 rounded-md">#{index + 1}</span>
                                          </div>
                                          <span className="text-[8px] text-white truncate text-right font-mono font-bold" title={img.name}>{Math.round(img.size / 1024)}KB</span>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Supporting Documents Checklists */}
                            <div className="space-y-1 bg-white p-3.5 rounded-xl border border-slate-200">
                              <span className="text-[11px] font-black text-indigo-950 block pb-1 border-b mb-2">تراخيص تشغيل المنشأة الميدانية (خاصة بالقاعة ومعزولة تماماً عن الوثائق القانونية الكلية للمزود)</span>
                              <div className="grid grid-cols-2 gap-3">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.commercialRegister}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, commercialRegister: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  السجل التجاري للمنشأة ساري
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.municipalityLicense}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, municipalityLicense: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  رخصة البلدية / أمانة المنطقة سارية
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.civilDefenseCert}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, civilDefenseCert: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  تصريح الدفاع المدني لسلامة المنشأة
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                                  <input
                                    type="checkbox"
                                    checked={venueWizData.taxCert}
                                    onChange={(e) => setVenueWizData({ ...venueWizData, taxCert: e.target.checked })}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                                  />
                                  شهادة التسجيل الضريبي المعتمدة
                                </label>
                              </div>
                            </div>

                            {/* Statuses (Admin Only vs. Provider State) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="space-y-1 bg-amber-50 p-3 rounded-xl border border-amber-200">
                                <label className="text-[10px] font-black text-amber-900 block">الحالة الإدارية (للإدارة فقط وهي أعلى من حالة المزود)</label>
                                <div className="flex items-center gap-1.5 text-xs font-black text-amber-700 font-mono mt-1">
                                  <Lock className="w-3.5 h-3.5 text-amber-600" />
                                  <span>{venueWizData.adminStatus}</span>
                                </div>
                                <p className="text-[9px] text-amber-700 mt-1 leading-relaxed">
                                  * خاضعة للحوكمة المسبقة ولا تظهر عامة للعملاء إلا بعد اعتماد الإدارة المباشر (قاعدة 6).
                                </p>
                              </div>
                              <div className="space-y-1 bg-white p-3 rounded-xl border border-slate-200">
                                <label className="text-[10px] font-black text-slate-500 block">الحالة التشغيلية للقاعة (للمزود)</label>
                                <select
                                  value={venueWizData.providerStatus}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, providerStatus: e.target.value })}
                                  className="w-full p-2 border border-slate-200 bg-white rounded-lg text-xs outline-none text-right font-black text-slate-700 mt-1"
                                >
                                  <option value="نشط ومتاح للعملاء">نشط ومتاح لاستلام طلبات الحجز للعملاء</option>
                                  <option value="مغلق مؤقتاً">مغلق مؤقتاً / تحت الصيانة الدورية</option>
                                </select>
                              </div>
                            </div>

                            {/* Pledge Accuracy */}
                            <div className="bg-emerald-50/60 p-3 rounded-xl border border-emerald-200">
                              <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-emerald-950">
                                <input
                                  type="checkbox"
                                  checked={venueWizData.pledgeAccuracy}
                                  onChange={(e) => setVenueWizData({ ...venueWizData, pledgeAccuracy: e.target.checked })}
                                  className="rounded border-emerald-300 text-emerald-600 focus:ring-emerald-500 w-4 h-4 mt-0.5"
                                />
                                <div>
                                  <span className="block font-black text-emerald-900">التعهد بصحة المعلومات وتحمل المسؤولية *</span>
                                  <span className="text-[10px] text-emerald-800 block mt-0.5 leading-relaxed font-sans font-medium">
                                    أقر بصفتي الممثل القانوني للمنشأة بأن جميع المعلومات والأسعار والتراخيص المدخلة صحيحة تماماً وتطابق أرض الواقع، وأتحمل كامل المسؤولية المدنية والنظامية في حال حدوث أي تعارض أو تضليل في البيانات للعملاء أو لإدارة منصة ليلة.
                                  </span>
                                </div>
                              </label>
                            </div>
                          </motion.div>
                        )}

                        {/* Step 6: Review & Confirm */}
                        {venueWizStep === 6 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="bg-amber-50 text-amber-900 p-3.5 rounded-xl text-[10px] leading-relaxed border border-amber-200 font-sans font-bold">
                              <strong>⚠️ إشعار حوكمة منصة ليلة (قاعدة 6):</strong> بموجب قوانين المنصة وقواعد اعتماد القاعات من قبل الإدارة، ستنضاف القاعة بحالة <strong>"معلق بانتظار الاعتماد - Pending Approval"</strong>. لن تظهر في الواجهة العامة للعملاء أو تندرج في نتائج البحث حتى يراجعها وتعتمدها الإدارة رسمياً.
                            </div>

                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs font-bold text-slate-700">
                              <div className="flex items-center gap-1 border-b pb-2">
                                <Sparkles className="w-4 h-4 text-indigo-600" />
                                <h5 className="text-slate-900 font-black text-xs">ملخص بطاقة المراجعة الفنية الشاملة للمنشأة الجديدة</h5>
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2.5 text-right text-[11px]">
                                <div className="border-b border-slate-100 pb-1.5">• الاسم التجاري للقاعة: <span className="text-slate-900 font-black">{venueWizData.name || 'لم يحدد'}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• تصنيف المنشأة: <span className="text-slate-900 font-black">{venueWizData.type}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• اسم مزود الخدمة: <span className="text-slate-900 font-black">{venueWizData.providerName} <span className="text-[9px] text-purple-600">({venueWizData.showProviderToCustomers ? 'مرئي للعميل' : 'مخفي'})</span></span></div>
                                <div className="border-b border-slate-100 pb-1.5">• هاتف التواصل: <span className="text-slate-900 font-mono font-black">{venueWizData.contactPhone} {venueWizData.contactPhone2 && ` / ${venueWizData.contactPhone2}`}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• المنطقة والمدينة: <span className="text-slate-900 font-black">{venueWizData.region}، {venueWizData.city}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• العنوان الوطني: <span className="text-slate-900 font-black text-[10px]">{venueWizData.nationalAddress || 'لم يحدد'}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• سعة الاستيعاب: <span className="text-slate-900 font-mono font-black">{venueWizData.capacity} شخص</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• مبلغ التأمين وفترة الاسترجاع: <span className="text-slate-900 font-black">{venueWizData.securityDeposit} ر.س / {venueWizData.refundPeriod} يوم</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• تسعير الفترات (صباحي / مسائي / يوم كامل): <span className="text-slate-900 font-mono font-black">{venueWizData.morningPrice} / {venueWizData.eveningPrice} / {venueWizData.fullDayPrice} ر.س</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• نمط التسعير وتوليف خدمات المنصة: <span className="text-indigo-700 font-black">{venueWizData.pricingPattern === 'Hybrid' ? 'الهجين وتفعيل الخدمات الخارجية' : venueWizData.pricingPattern === 'Comprehensive' ? 'الباقات الشاملة والمغلقة' : 'الخدمات المنفردة الاختيارية'}</span></div>
                                {venueWizData.pricingPattern === 'Comprehensive' && (
                                  <div className="col-span-1 md:col-span-2 border-b border-purple-100 pb-1.5 bg-purple-50/20 p-2 rounded-xl">
                                    <span className="text-purple-950 font-black">📦 باقات المستودع المرفقة ({venueWizData.closedPackages?.length || 0}):</span>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                      {venueWizData.closedPackages && venueWizData.closedPackages.length > 0 ? (
                                        venueWizData.closedPackages.map(pkg => (
                                          <span key={pkg.id} className="bg-purple-100 text-purple-800 text-[10px] font-black px-2 py-1 rounded-md border border-purple-200">
                                            {pkg.name} ({parseInt(pkg.price).toLocaleString()} ر.س)
                                          </span>
                                        ))
                                      ) : (
                                        <span className="text-red-500 font-medium">لا توجد باقات جاهزة مضافة!</span>
                                      )}
                                    </div>
                                  </div>
                                )}
                                <div className="col-span-1 md:col-span-2 border-b border-indigo-100 pb-1.5 bg-indigo-50/20 p-2 rounded-xl">
                                  <span className="text-indigo-950 font-black">🖼️ ألبوم صور القاعة المدشن ({venueWizData.albumImages?.length || 0} صور):</span>
                                  <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1">
                                    {venueWizData.albumImages && venueWizData.albumImages.length > 0 ? (
                                      venueWizData.albumImages.map((img, idx) => (
                                        <div key={idx} className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0">
                                          <img src={img.dataUrl} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        </div>
                                      ))
                                    ) : (
                                      <span className="text-slate-400 font-medium text-[10px]">لا توجد صور مضافة، سيتم استخدام المعرض الافتراضي.</span>
                                    )}
                                  </div>
                                </div>
                                <div className="border-b border-slate-100 pb-1.5">• الرقم الضريبي: <span className="text-slate-900 font-mono font-black">{venueWizData.isTaxExempt ? 'معفى من الضرائب بموجب التصريح' : venueWizData.taxNumber}</span></div>
                                <div className="border-b border-slate-100 pb-1.5">• باقة الخدمات الإضافية: <span className="text-slate-900 font-black">{venueWizData.additionalServicesBundle || 'لا يوجد'}</span></div>
                              </div>
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 text-[10px] text-slate-600 leading-relaxed font-medium">
                                • <strong>مرافق وضمانات المكان:</strong> {venueWizData.facilitiesAmenities} <br/>
                                • <strong>قواعد وضوابط المكان:</strong> {venueWizData.venueRules} <br/>
                                • <strong>شروط العقد وتفاصيل الضمانات التعاقدية:</strong> {venueWizData.contractTerms} <br/>
                                • <strong>التراخيص والوثائق المرفقة:</strong> {
                                  [
                                    venueWizData.commercialRegister && 'السجل التجاري',
                                    venueWizData.municipalityLicense && 'رخصة البلدية',
                                    venueWizData.civilDefenseCert && 'تصريح الدفاع المدني',
                                    venueWizData.taxCert && 'شهادة التسجيل الضريبي'
                                  ].filter(Boolean).join('، ') || 'لا يوجد'
                                }
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between items-center pt-3 border-t border-slate-200">
                          <div>
                            {venueWizStep > 1 && (
                              <button
                                type="button"
                                onClick={() => setVenueWizStep(venueWizStep - 1)}
                                className="px-3.5 py-1.5 text-slate-600 bg-white hover:bg-slate-100 rounded-lg text-xs font-black cursor-pointer border border-slate-200"
                              >
                                السابق
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 font-sans">
                            {venueWizStep < 6 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (venueWizStep === 1) {
                                    if (!venueWizData.name) {
                                      showNotification('warning', 'يرجى إدخال الاسم التجاري للقاعة أولاً.');
                                      return;
                                    }
                                    if (!venueWizData.contactPhone) {
                                      showNotification('warning', 'يرجى إدخال جوال للتواصل الرئيسي أولاً.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 2) {
                                    if (!venueWizData.region || !venueWizData.city) {
                                      showNotification('warning', 'حقول المنطقة والمدينة مطلوبة إجبارياً.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 3) {
                                    if (!venueWizData.capacity) {
                                      showNotification('warning', 'يرجى تحديد سعة الاستيعاب القصوى للقاعة.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 4) {
                                    if (!venueWizData.refundPeriod) {
                                      showNotification('warning', 'يرجى تحديد فترة استرجاع العميل باليوم.');
                                      return;
                                    }
                                    if (!venueWizData.securityDeposit) {
                                      showNotification('warning', 'يرجى تحديد مبلغ التأمين المسترد.');
                                      return;
                                    }
                                  }
                                  if (venueWizStep === 5) {
                                    if (!venueWizData.pledgeAccuracy) {
                                      showNotification('warning', 'يرجى الموافقة والتوقيع على صك التعهد بصحة المعلومات وتحمل المسؤولية للمتابعة.');
                                      return;
                                    }
                                  }
                                  setVenueWizStep(venueWizStep + 1);
                                }}
                                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-sm"
                              >
                                التالي
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newHallObj = {
                                    id: String(catalogHalls.length + 1),
                                    name: venueWizData.name,
                                    capacity: parseInt(venueWizData.capacity),
                                    description: `قاعة فاخرة من نوع ${venueWizData.type} في مدينة ${venueWizData.city}. تتبع للمزود ${venueWizData.providerName}. مهيئة بنمط تسعير وتوليف: ${venueWizData.pricingPattern}.`,
                                    status: 'معلق بانتظار الاعتماد', // Rule 6 pending state
                                    policies: `Fulfillment Policy: ${venueWizData.fulfillmentPolicy} | Cancellation: ${venueWizData.cancellationPolicy}`,
                                    photosCount: venueWizData.albumImages && venueWizData.albumImages.length > 0 ? venueWizData.albumImages.length : 3,
                                    closedPackages: venueWizData.pricingPattern === 'Comprehensive' ? venueWizData.closedPackages : [],
                                    additionalServices: venueWizData.additionalServices || [],
                                    albumImages: venueWizData.albumImages || []
                                  };

                                  setCatalogHalls([...catalogHalls, newHallObj]);
                                  setVenueWizStep(1); // Reset step
                                  setVenueWizData({
                                    name: '',
                                    providerName: 'ليالينا للضيافة والاحتفالات',
                                    showProviderToCustomers: true,
                                    type: 'قصر أفراح',
                                    contactPhone: '0551234567',
                                    contactPhone2: '0557654321',
                                    description: 'قاعة مناسبات كبرى مصممة بأحدث الديكورات العصرية ومجهزة بكافة المرافق الفاخرة لتلائم المناسبات الكبرى وحفلات الزواج.',
                                    region: 'منطقة الرياض',
                                    city: 'الرياض',
                                    nationalAddress: '1234 الملقا، الرياض، المملكة العربية السعودية',
                                    addressDetails: 'طريق الملك سلمان بن عبدالعزيز، بجانب المجمع التجاري الكبير، مخرج ٤',
                                    capacity: '400',
                                    tablesCount: '50',
                                    chairsCount: '400',
                                    features: {
                                      ac: true,
                                      stage: true,
                                      ledScreens: false,
                                      soundSystem: true,
                                      brideRoom: true,
                                      parking: true,
                                    },
                                    basePrice: '15000',
                                    securityDeposit: '3000',
                                    refundPeriod: '14',
                                    morningPrice: '10000',
                                    eveningPrice: '15000',
                                    fullDayPrice: '22000',
                                    weekendPricingEnabled: true,
                                    increaseType: 'percentage',
                                    morningIncrease: '10',
                                    eveningIncrease: '15',
                                    fullDayIncrease: '12',
                                    pricingPattern: 'Hybrid',
                                    isTaxExempt: false,
                                    taxNumber: '301234567800003',
                                    additionalServicesBundle: 'باقة الضيافة المتكاملة (شامل طاقم تقديم ومفتشات جوال وبخور ممتاز)',
                                    venueRules: 'يمنع التدخين نهائياً داخل أروقة القاعة، يمنع إدخال الأطفال دون سن السابعة بدون مرافق، يلتزم المستأجر بإنهاء الحفل في الموعد المتفق عليه.',
                                    contractTerms: 'يلتزم الطرف الأول بتوفير القاعة نظيفة وجاهزة بالمرافق المذكورة، يلتزم الطرف الثاني بسداد مبلغ التأمين وتوقيع العقد النهائي قبل ٣ أيام من الحفل.',
                                    facilitiesAmenities: 'صالة طعام منفصلة، مصعد خاص لكبار السن والعروس، أجنحة عائلية واسعة، مطبخ تحضيري مجهز بالكامل.',
                                    cancellationPolicy: 'strict',
                                    fulfillmentPolicy: 'Hybrid Allowed',
                                    images: [],
                                    closedPackages: [],
                                    additionalServices: [],
                                    albumImages: [],
                                    civilDefenseCert: true,
                                    municipalityLicense: true,
                                    commercialRegister: true,
                                    taxCert: true,
                                    adminStatus: 'معلق بانتظار الاعتماد',
                                    providerStatus: 'نشط ومتاح للعملاء',
                                    pledgeAccuracy: false,
                                  });

                                  showNotification('success', 'تم تقديم طلب إضافة القاعة بنجاح وبدء تشغيل محرك الاعتماد التلقائي! الحالة الحالية: (معلق بانتظار الاعتماد) بموجب شروط الجودة وقاعدة 6.');
                                }}
                                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black cursor-pointer shadow-md"
                              >
                                تقديم طلب الإضافة المعلق للإدارة
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Services view */}
                  {catalogActiveInnerTab === 'services' && (
                    <div className="space-y-6 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
                      {/* Subtab Header */}
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-100 gap-3">
                        <div>
                          <span className="text-[10px] font-black text-indigo-600 tracking-wider font-mono block mb-1">SUPPORTIVE & INDEPENDENT SERVICES CATALOG</span>
                          <h3 className="text-base font-black text-slate-800">كتالوج وإدارة الخدمات المستقلة والمساندة</h3>
                        </div>
                        <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl flex items-center gap-2">
                          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
                          <span className="text-[11px] font-bold text-slate-600">منظومة الخدمات اللامركزية النشطة</span>
                        </div>
                      </div>

                      {/* Service Grid Section */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        {catalogServices.map((ser) => {
                          // Try to handle parsed images or fallbacks
                          let serImages: any[] = [];
                          if (ser.images) {
                            if (Array.isArray(ser.images)) {
                              serImages = ser.images;
                            } else if (typeof ser.images === 'string') {
                              try { serImages = JSON.parse(ser.images); } catch(e) { serImages = []; }
                            }
                          }
                          const hasImages = serImages && serImages.length > 0;
                          const coverImage = hasImages ? (serImages[0].preview || serImages[0].dataUrl || serImages[0]) : null;

                          return (
                            <div key={ser.id} className="bg-white border border-slate-150 rounded-2xl overflow-hidden hover:border-purple-200 hover:shadow-md transition-all flex flex-col justify-between">
                              {/* Service Main Content Container */}
                              <div>
                                {coverImage ? (
                                  <div className="relative h-44 w-full bg-slate-900 overflow-hidden">
                                    <img src={coverImage} alt={ser.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                    <div className="absolute top-3 right-3 bg-white/95 backdrop-blur-sm px-2.5 py-1 rounded-xl shadow-sm text-[10px] font-black text-purple-700">
                                      {ser.category || 'عام'}
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-purple-900/80 backdrop-blur-sm px-2.5 py-1 rounded-xl text-[10px] font-mono text-white">
                                      {ser.id}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="h-32 bg-slate-50 border-b border-slate-100 flex items-center justify-center relative">
                                    <Coffee className="w-8 h-8 text-slate-300" />
                                    <div className="absolute top-3 right-3 bg-purple-100 px-2.5 py-1 rounded-xl text-[10px] font-black text-purple-700">
                                      {ser.category || 'عام'}
                                    </div>
                                    <div className="absolute bottom-3 left-3 bg-slate-100 px-2.5 py-1 rounded-xl text-[10px] font-mono text-slate-500">
                                      {ser.id}
                                    </div>
                                  </div>
                                )}

                                <div className="p-4 space-y-3">
                                  <div className="flex justify-between items-start gap-2">
                                    <h4 className="text-sm font-black text-slate-800 text-right leading-snug">{ser.name}</h4>
                                    <div className="flex flex-col items-end gap-1 shrink-0">
                                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                                        ser.status === 'Pending Approval' || ser.status === 'معلق بانتظار الاعتماد'
                                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                          : ser.status === 'مرفوض'
                                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      }`}>
                                        {ser.status || 'معتمد'}
                                      </span>
                                      {ser.serviceStatus && (
                                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                          ser.serviceStatus === 'نشط' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-100 text-slate-600'
                                        }`}>
                                          حالة المزود: {ser.serviceStatus}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  <p className="text-[11px] text-slate-500 leading-relaxed text-right line-clamp-2">
                                    {ser.desc || 'لا يوجد وصف مسجل للخدمة حالياً.'}
                                  </p>

                                  {/* Detailed Metadata Grid */}
                                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100 text-[10px] text-slate-600 bg-slate-50/50 p-2 rounded-xl">
                                    <div className="text-right">
                                      <span className="text-slate-400 block text-[9px]">المزود المسؤول</span>
                                      <span className="font-black text-slate-800 truncate block max-w-full" title={ser.provider || currentProviderName}>
                                        {ser.provider || currentProviderName}
                                      </span>
                                    </div>
                                    <div className="text-right border-r border-slate-150 pr-2">
                                      <span className="text-slate-400 block text-[9px]">الوحدة والمخزون</span>
                                      <span className="font-black text-slate-800 block">
                                        {ser.dailyStock || '5'} طلبات / {ser.unit || 'مناسبة'}
                                      </span>
                                    </div>
                                    <div className="text-right border-r border-slate-150 pr-2">
                                      <span className="text-slate-400 block text-[9px]">سياسة التنفيذ</span>
                                      <span className="font-black text-indigo-700 block">
                                        {ser.fulfillmentPolicy === 'Hybrid' ? 'هجين (Hybrid)' : 'داخلي (Internal)'}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Extra properties if available */}
                                  {(ser.coverageRegions || ser.cancellationPeriod) && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                      {ser.coverageRegions && (
                                        <span className="bg-purple-50 text-purple-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-purple-100">
                                          🌍 {Array.isArray(ser.coverageRegions) ? ser.coverageRegions.join('، ') : ser.coverageRegions}
                                        </span>
                                      )}
                                      {ser.cancellationPeriod && (
                                        <span className="bg-amber-50 text-amber-800 text-[9px] font-bold px-1.5 py-0.5 rounded border border-amber-100">
                                          ⏳ إلغاء مجاني: {ser.cancellationPeriod}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Price Footer */}
                              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center rounded-b-2xl">
                                <span className="text-[10px] text-slate-400 font-bold">سعر الوحدة القياسي</span>
                                <span className="font-mono text-purple-700 font-black text-xs">
                                  {formatCurrency(ser.price || ser.unitPrice || 0)} / {ser.unit || 'مرة'}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Independent Service Wizard (BOS-Style v2.6) */}
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 space-y-5 mt-6 shadow-sm">
                        
                        {/* Interactive Role Switcher at the top of the wizard to demonstrate Admin vs Provider rules */}
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-indigo-50/60 p-3 rounded-2xl border border-indigo-100 gap-3">
                          <div className="space-y-0.5">
                            <span className="text-indigo-900 font-black text-xs block">🛡️ محاكي التحكم والصلاحيات (BOS Access Switcher)</span>
                            <p className="text-[10px] text-indigo-700 leading-relaxed">
                              استخدم هذا الخيار للتبديل الفوري بين رتبة **مُزود الخدمة** و**الإدارة (Admin)** لمشاهدة ديناميكية وتأثير العزل والصلاحيات البرمجية على الحقول أدناه.
                            </p>
                          </div>
                          <div className="flex bg-white p-1 rounded-xl border border-indigo-150 shrink-0 shadow-sm">
                            <button
                              type="button"
                              onClick={() => {
                                setServiceWizRole('provider');
                                setServiceWizData(prev => ({ ...prev, provider: currentProviderName }));
                              }}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${serviceWizRole === 'provider' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              حساب المزود (مغلق الصلاحيات)
                            </button>
                            <button
                              type="button"
                              onClick={() => setServiceWizRole('admin')}
                              className={`px-3 py-1.5 rounded-lg text-[10px] font-black transition-all cursor-pointer ${serviceWizRole === 'admin' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                            >
                              حساب الإدارة (صلاحية تعديل واعتماد)
                            </button>
                          </div>
                        </div>

                        {/* Wizard Step Header */}
                        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                          <div className="flex items-center gap-2">
                            <span className="bg-purple-100 text-purple-700 text-[9px] font-black px-2.5 py-0.5 rounded-full uppercase font-mono tracking-wider shadow-sm">BOS supportive wizard v2.6</span>
                            <span className="text-[11px] font-black text-slate-500">الخطوة {serviceWizStep} من ٥</span>
                          </div>
                          <div className="flex items-center gap-2 text-purple-700">
                            <Plus className="w-4 h-4" />
                            <h4 className="text-xs font-black">معالج إدارة وإضافة الخدمات المستقلة والمساندة المتقدمة</h4>
                          </div>
                        </div>

                        {/* Step Progress Indicators */}
                        <div className="grid grid-cols-5 gap-1.5 text-center text-[9px] font-black pb-1">
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 1 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ١. الهوية والسياسة
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 2 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٢. التسعير والمخزون
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 3 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٣. التغطية والمهل
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 4 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٤. ألبوم الصور والشروط
                          </div>
                          <div className={`p-2 rounded-xl transition-all border ${serviceWizStep === 5 ? 'bg-purple-600 text-white border-purple-600 shadow-sm' : 'bg-white text-slate-500 border-slate-200/60'}`}>
                            ٥. المراجعة والاعتماد
                          </div>
                        </div>

                        {/* Step 1: Definition, Provider Name, Fulfillment Policy & Description */}
                        {serviceWizStep === 1 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {/* Service Name */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">اسم الخدمة المستقلة والمساندة المعروضة *</label>
                                <input
                                  type="text"
                                  value={serviceWizData.name}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, name: e.target.value })}
                                  placeholder="مثال: طاقم ضيافة نسائي VIP متكامل"
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-800 focus:border-purple-500 transition-all"
                                />
                              </div>

                              {/* Service Category */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">تصنيف فئة الخدمة الرئيسي *</label>
                                <select
                                  value={serviceWizData.category}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, category: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700 focus:border-purple-500 transition-all"
                                >
                                  <option value="ضيافة">ضيافة وتقديم بوفيهات ومشروبات</option>
                                  <option value="ديكور">ديكور وتنسيق كوش وزهور طبيعية</option>
                                  <option value="تصوير">توثيق وفوتوغرافيا وتغطية سينمائية</option>
                                  <option value="تنسيق">تجهيزات هندسة صوت وإضاءة وليزرات</option>
                                  <option value="أخرى">خدمات دعم ومساندة لوجستية أخرى</option>
                                </select>
                              </div>
                            </div>

                            {/* Provider Assignment Field (Dynamic based on Role Switcher) */}
                            <div className="bg-slate-100 p-4 rounded-2xl border border-slate-200 space-y-3">
                              <div className="flex justify-between items-center">
                                <span className="text-[9px] font-mono font-black text-slate-400">PROVIDER ASSIGNMENT ENGINE</span>
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${serviceWizRole === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                                  {serviceWizRole === 'admin' ? 'حساب الإدارة: وضع التعديل متاح' : 'حساب المزود: وضع القراءة فقط'}
                                </span>
                              </div>
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">المزود المالك والمشغل للخدمة *</label>
                                {serviceWizRole === 'admin' ? (
                                  <input
                                    type="text"
                                    value={serviceWizData.provider}
                                    onChange={(e) => setServiceWizData({ ...serviceWizData, provider: e.target.value })}
                                    className="w-full p-2.5 border border-emerald-300 bg-white rounded-xl text-xs outline-none text-right font-black text-slate-800 focus:border-emerald-500 transition-all"
                                    placeholder="أدخل اسم المزود مالك الخدمة (متاح فقط للإدارة)"
                                  />
                                ) : (
                                  <div className="w-full p-2.5 bg-slate-200/80 border border-slate-300 rounded-xl text-xs font-black text-slate-600 text-right cursor-not-allowed">
                                    {serviceWizData.provider}
                                  </div>
                                )}
                                <span className="text-[9px] text-slate-400 block text-right leading-relaxed">
                                  {serviceWizRole === 'admin' 
                                    ? 'ℹ️ بصفتك مديراً للنظام، يسمح لك بتعديل أو إعادة تخصيص هذه الخدمة لأي شريك/مزود خدمات مسجل بالمنصة.' 
                                    : 'ℹ️ بصفتك شريكاً ومزود خدمات، يتم قفل هذا الحقل تلقائياً على اسم الهوية المسجلة في ملفك التجاري.'}
                                </span>
                              </div>
                            </div>

                            {/* Fulfillment / Execution Policy Selector */}
                            <div className="space-y-2">
                              <label className="text-[11px] font-black text-slate-600 block text-right">سياسة التجهيز والتنفيذ اللوجستي (Fulfillment Policy) *</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <button
                                  type="button"
                                  onClick={() => setServiceWizData({ ...serviceWizData, fulfillmentPolicy: 'Internal' })}
                                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${serviceWizData.fulfillmentPolicy === 'Internal' ? 'bg-indigo-50/70 border-indigo-500 text-indigo-950 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${serviceWizData.fulfillmentPolicy === 'Internal' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 bg-white'}`}>
                                    {serviceWizData.fulfillmentPolicy === 'Internal' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-xs font-black block">تنفيذ داخلي مباشر (Internal Execution)</span>
                                    <span className="text-[10px] text-slate-500 block leading-relaxed">يتم تقديم وتنفيذ وتأمين الخدمة بالكامل عبر الطاقم الداخلي التابع للمنشأة ومواردها الخاصة.</span>
                                  </div>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setServiceWizData({ ...serviceWizData, fulfillmentPolicy: 'Hybrid' })}
                                  className={`p-3.5 rounded-2xl border text-right transition-all flex items-start gap-3 cursor-pointer ${serviceWizData.fulfillmentPolicy === 'Hybrid' ? 'bg-purple-50/70 border-purple-500 text-purple-950 shadow-sm' : 'bg-white border-slate-200 hover:border-slate-300'}`}
                                >
                                  <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${serviceWizData.fulfillmentPolicy === 'Hybrid' ? 'border-purple-600 bg-purple-600' : 'border-slate-300 bg-white'}`}>
                                    {serviceWizData.fulfillmentPolicy === 'Hybrid' && <div className="w-1.5 h-1.5 bg-white rounded-full"></div>}
                                  </div>
                                  <div className="space-y-1">
                                    <span className="text-xs font-black block">تنفيذ هجين وتعاقدي (Hybrid / External Partner)</span>
                                    <span className="text-[10px] text-slate-500 block leading-relaxed">تنفذ الخدمة أو تتكامل بالتعاقد الخارجي والتنسيق اللوجستي مع أطراف ومزودين فرعيين مستقلين.</span>
                                  </div>
                                </button>
                              </div>
                            </div>

                            {/* Service Description */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-black text-slate-600 block text-right">وصف الخدمة التجاري ومكونات الطلب بالتفصيل *</label>
                              <textarea
                                value={serviceWizData.desc}
                                onChange={(e) => setServiceWizData({ ...serviceWizData, desc: e.target.value })}
                                rows={3}
                                placeholder="صف بالتفصيل ما تحتويه الخدمة للعملاء، مثل الطاقم، جودة المكونات، الأدوات المستخدمة، والتجهيزات اللوجستية المصاحبة لتفادي أي خلاف قانوني..."
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 focus:border-purple-500 transition-all leading-relaxed"
                              />
                            </div>
                          </motion.div>
                        )}

                        {/* Step 2: Pricing, Units, Daily Stock, Total Standard Capacity & Dynamic Markup Simulator */}
                        {serviceWizStep === 2 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              {/* Unit Price */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">سعر الوحدة القياسي للخدمة (ر.س) *</label>
                                <input
                                  type="number"
                                  value={serviceWizData.unitPrice}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, unitPrice: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800 focus:border-purple-500 transition-all"
                                />
                              </div>

                              {/* Standard Unit */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">الوحدة القياسية للخدمة *</label>
                                <select
                                  value={serviceWizData.unit}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, unit: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold text-slate-700 focus:border-purple-500 transition-all"
                                >
                                  <option value="ساعة">لكل ساعة عمل</option>
                                  <option value="يوم / مناسبة">لكل مناسبة / ليلة كاملة</option>
                                  <option value="فرد / ضيف">لكل ضيف / فرد</option>
                                  <option value="قطعة">لكل قطعة واحدة</option>
                                  <option value="طقم">لكل طقم / طقم تشغيل متكامل</option>
                                </select>
                              </div>

                              {/* Daily Stock Quantity */}
                              <div className="space-y-1">
                                <label className="text-[11px] font-black text-slate-600 block text-right">كمية المخزون / سعة التجهيز اليومي القصوى *</label>
                                <input
                                  type="number"
                                  value={serviceWizData.dailyStock}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, dailyStock: e.target.value })}
                                  className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-bold text-slate-800 focus:border-purple-500 transition-all"
                                  placeholder="مثال: 5 طلبات يومياً كحد أقصى"
                                />
                              </div>
                            </div>

                            {/* Total Price & Revenue Calculation Display */}
                            <div className="bg-purple-950 text-white p-4 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-3">
                              <div className="text-right space-y-0.5">
                                <span className="text-[10px] text-purple-200 font-bold block">🧮 محتسب السعة والقيمة الكلية لمخزون الخدمة</span>
                                <p className="text-[11px] text-purple-300 leading-relaxed">
                                  يمثل هذا حاصل السعر الأساسي للوحدة مضروباً في كمية التشغيل/المخزون اليومي الأقصى المتوفر لديكم.
                                </p>
                              </div>
                              <div className="bg-white/10 px-4 py-2.5 rounded-xl border border-white/10 text-center shrink-0">
                                <span className="text-[9px] text-purple-200 block font-bold">السعر الإجمالي الأقصى اليومي للمخزون</span>
                                <span className="font-mono text-base font-black tracking-wide block mt-1">
                                  {((Number(serviceWizData.unitPrice) || 0) * (Number(serviceWizData.dailyStock) || 0)).toLocaleString()} ر.س
                                </span>
                              </div>
                            </div>

                             {/* Dynamic Pricing Policy Configuration */}
                             <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 relative overflow-hidden">
                               {!hasDynamicPricingAccess && (
                                 <div className="absolute inset-0 bg-slate-50/80 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center text-center p-4">
                                   <div className="bg-white p-4 rounded-2xl shadow-md border border-slate-100 max-w-sm space-y-2">
                                     <div className="bg-amber-50 text-amber-600 px-2.5 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1 mx-auto">
                                       <Lock className="w-3 h-3 text-amber-600" />
                                       <span>ميزة مقفلة - تتطلب ترقية الباقة</span>
                                     </div>
                                     <h6 className="text-xs font-black text-slate-800">محرك الأسعار الديناميكي والذكاء التشغيلي</h6>
                                     <p className="text-[10px] text-slate-500 leading-relaxed">
                                       هذه الميزة تتوفر حصرياً لمشتركي الباقة الاحترافية الملكية (Layla Pro ERP) أو من خلال شراء الملحق المستقل من مركز الاشتراكات.
                                     </p>
                                     <button
                                       type="button"
                                       onClick={() => {
                                         setOsTab('subscription');
                                         showNotification('info', 'تم توجيهك لمركز الاشتراكات لترقية الباقة أو شراء ملحق الأسعار الديناميكية.');
                                       }}
                                       className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shadow-sm mx-auto block"
                                     >
                                       الترقية أو الشراء الآن (تبدأ من 299 ر.س)
                                     </button>
                                   </div>
                                 </div>
                               )}
                               
                               <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                 <span className="text-[10px] font-mono text-purple-600 font-bold">DYNAMIC PRICING ENGINE</span>
                                 <h5 className="text-xs font-black text-slate-800">سياسات التسعير الديناميكي والذكاء التشغيلي</h5>
                               </div>
                               
                               <p className="text-[10px] text-slate-500 leading-relaxed text-right">
                                 قم بتفعيل قواعد التسعير الديناميكي المخصصة للخدمة. ستتعدل أسعارك تلقائياً على المنصة للمستأجر بناءً على ظروف وتوقيت حجز المناسبة:
                               </p>

                               <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                                 <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                                   <input
                                     type="checkbox"
                                     checked={serviceWizData.dynamicWeekend}
                                     onChange={(e) => setServiceWizData({ ...serviceWizData, dynamicWeekend: e.target.checked })}
                                     className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                     disabled={!hasDynamicPricingAccess}
                                   />
                                   <span className="text-right">
                                     <span className="font-black text-slate-800 block text-[11px] mb-0.5">زيادة الويكند (+15%)</span>
                                     <span className="text-[10px] text-slate-500 font-normal block leading-relaxed">تُطبق تلقائياً على الحجوزات أيام الخميس، الجمعة والسبت.</span>
                                   </span>
                                 </label>

                                 <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                                   <input
                                     type="checkbox"
                                     checked={serviceWizData.dynamicSeasonal}
                                     onChange={(e) => setServiceWizData({ ...serviceWizData, dynamicSeasonal: e.target.checked })}
                                     className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                     disabled={!hasDynamicPricingAccess}
                                   />
                                   <span className="text-right">
                                     <span className="font-black text-slate-800 block text-[11px] mb-0.5">زيادة المواسم (+25%)</span>
                                     <span className="text-[10px] text-slate-500 font-normal block leading-relaxed">تُطبق في مواسم الأعياد، رمضان، والمناسبات الوطنية.</span>
                                   </span>
                                 </label>

                                 <label className="flex items-start gap-2.5 cursor-pointer text-xs font-bold text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 hover:border-purple-300 transition-all">
                                   <input
                                     type="checkbox"
                                     checked={serviceWizData.dynamicVolume}
                                     onChange={(e) => setServiceWizData({ ...serviceWizData, dynamicVolume: e.target.checked })}
                                     className="rounded border-slate-300 text-purple-600 focus:ring-purple-500 mt-0.5"
                                     disabled={!hasDynamicPricingAccess}
                                   />
                                   <span className="text-right">
                                     <span className="font-black text-slate-800 block text-[11px] mb-0.5">خصم الكميات بالجملة (-10%)</span>
                                     <span className="text-[10px] text-slate-500 font-normal block leading-relaxed">يُطبق خصم تلقائي للعميل عند طلب 10 وحدات فما فوق.</span>
                                   </span>
                                 </label>
                               </div>

                               {/* Interactive Live Price Simulator */}
                               <div className="bg-slate-50 p-3 rounded-xl border border-slate-150 space-y-2 pt-3">
                                 <span className="text-[9px] font-black text-slate-400 block text-right uppercase tracking-wider">🔴 معالج المحاكاة الفورية للأسعار (BOS Real-time Simulator)</span>
                                 <div className="grid grid-cols-3 gap-2 text-center">
                                   <div className="bg-white p-2 rounded-lg border border-slate-200">
                                     <span className="text-[9px] text-slate-400 block font-bold">السعر العادي (وسط الأسبوع)</span>
                                     <span className="text-xs font-mono font-black text-slate-800">
                                       {formatCurrency(Number(serviceWizData.unitPrice) || 0)}
                                     </span>
                                   </div>
                                   <div className={`p-2 rounded-lg border transition-all ${serviceWizData.dynamicWeekend && hasDynamicPricingAccess ? 'bg-purple-50/50 border-purple-200' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
                                     <span className="text-[9px] text-purple-700 block font-bold">سعر نهاية الأسبوع (+15%)</span>
                                     <span className="text-xs font-mono font-black text-purple-800 block mt-0.5">
                                       {serviceWizData.dynamicWeekend && hasDynamicPricingAccess 
                                         ? formatCurrency(Math.round((Number(serviceWizData.unitPrice) || 0) * 1.15)) 
                                         : 'غير مفعل'}
                                     </span>
                                   </div>
                                   <div className={`p-2 rounded-lg border transition-all ${serviceWizData.dynamicSeasonal && hasDynamicPricingAccess ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-100/50 border-slate-200 opacity-60'}`}>
                                     <span className="text-[9px] text-amber-700 block font-bold">سعر المواسم والأعياد (+25%)</span>
                                     <span className="text-xs font-mono font-black text-amber-800 block mt-0.5">
                                       {serviceWizData.dynamicSeasonal && hasDynamicPricingAccess 
                                         ? formatCurrency(Math.round((Number(serviceWizData.unitPrice) || 0) * 1.25)) 
                                         : 'غير مفعل'}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                             </div>
                          </motion.div>
                        )}

                        {/* Step 3: Geographic Coverage Regions, Served Cities & Cancellation Period */}
                        {serviceWizStep === 3 && (() => {
                          const regionCitiesMap: Record<string, string[]> = {
                            'منطقة الرياض': ['الرياض', 'الخرج', 'الدرعية', 'المجمعة', 'الدوادمي'],
                            'منطقة مكة المكرمة': ['مكة المكرمة', 'جدة', 'الطائف', 'القنفذة', 'الليث'],
                            'منطقة المدينة المنورة': ['المدينة المنورة', 'ينبع', 'العلا', 'بدر', 'المهد'],
                            'المنطقة الشرقية': ['الدمام', 'الخبر', 'الأحساء', 'القطيف', 'الجبيل', 'حفر الباطن'],
                            'منطقة عسير': ['أبها', 'خميس مشيط', 'أحد رفيدة', 'محايل عسير', 'بيشة'],
                            'منطقة القصيم': ['بريدة', 'عنيزة', 'الرس', 'البكيرية', 'المذنب']
                          };

                          const availableCities = serviceWizData.coverageRegions.reduce<string[]>((acc, region) => {
                            if (regionCitiesMap[region]) {
                              acc.push(...regionCitiesMap[region]);
                            }
                            return acc;
                          }, []);

                          return (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Coverage Regions */}
                                <div className="space-y-2">
                                  <label className="text-[11px] font-black text-slate-600 block text-right flex items-center gap-1 justify-end">
                                    <span>مناطق التغطية الجغرافية المستهدفة بالمملكة *</span>
                                    <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                                  </label>
                                  <div className="grid grid-cols-2 gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                                    {Object.keys(regionCitiesMap).map(region => (
                                      <label key={region} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-purple-700 transition-all">
                                        <input
                                          type="checkbox"
                                          checked={serviceWizData.coverageRegions.includes(region)}
                                          onChange={(e) => {
                                            let updatedRegions = [...serviceWizData.coverageRegions];
                                            if (e.target.checked) {
                                              updatedRegions.push(region);
                                            } else {
                                              updatedRegions = updatedRegions.filter(r => r !== region);
                                            }
                                            
                                            // Dynamic city filtering to prevent orphaned checked cities
                                            const remainingCities = updatedRegions.reduce<string[]>((acc, r) => {
                                              if (regionCitiesMap[r]) acc.push(...regionCitiesMap[r]);
                                              return acc;
                                            }, []);
                                            const updatedCities = serviceWizData.coverageCities.filter(city => remainingCities.includes(city));

                                            setServiceWizData({ 
                                              ...serviceWizData, 
                                              coverageRegions: updatedRegions,
                                              coverageCities: updatedCities
                                            });
                                          }}
                                          className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                        />
                                        <span>{region}</span>
                                      </label>
                                    ))}
                                  </div>
                                </div>

                                {/* Served Cities */}
                                <div className="space-y-2">
                                  <label className="text-[11px] font-black text-slate-600 block text-right flex items-center gap-1 justify-end">
                                    <span>المدن المخدومة والمغطاة بالخدمة تفصيلياً *</span>
                                  </label>
                                  <div className="bg-white p-3 rounded-2xl border border-slate-200 min-h-[120px] flex flex-col justify-center">
                                    {availableCities.length > 0 ? (
                                      <div className="grid grid-cols-2 gap-2">
                                        {availableCities.map(city => (
                                          <label key={city} className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700 hover:text-purple-700 transition-all">
                                            <input
                                              type="checkbox"
                                              checked={serviceWizData.coverageCities.includes(city)}
                                              onChange={(e) => {
                                                let updatedCities = [...serviceWizData.coverageCities];
                                                if (e.target.checked) {
                                                  updatedCities.push(city);
                                                } else {
                                                  updatedCities = updatedCities.filter(c => c !== city);
                                                }
                                                setServiceWizData({ ...serviceWizData, coverageCities: updatedCities });
                                              }}
                                              className="rounded border-slate-300 text-purple-600 focus:ring-purple-500"
                                            />
                                            <span>{city}</span>
                                          </label>
                                        ))}
                                      </div>
                                    ) : (
                                      <p className="text-center text-[11px] text-slate-400 font-bold py-4">
                                        ⚠️ يرجى اختيار منطقة تغطية واحدة على الأقل من اليمين لتظهر المدن التابعة لها هنا.
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Cancellation Period Configuration */}
                              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 text-right">
                                <label className="text-[11px] font-black text-slate-600 block text-right">مدة ومهلة الإلغاء المجاني الممنوحة للعملاء (Cancellation Period) *</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {/* Presets Selector */}
                                  <div className="space-y-1 text-right">
                                    <label className="text-[10px] text-slate-400 block">اختر من الخيارات المقترحة:</label>
                                    <select
                                      onChange={(e) => {
                                        if (e.target.value) {
                                          setServiceWizData({ ...serviceWizData, cancellationPeriod: e.target.value });
                                        }
                                      }}
                                      className="w-full p-2.5 border border-slate-200 bg-slate-50/50 rounded-xl text-xs outline-none text-right font-bold text-slate-700 focus:border-purple-500 transition-all"
                                    >
                                      <option value="">-- اختر مهلة أو اكتبها يدوياً --</option>
                                      <option value="قبل ٢٤ ساعة من الفعالية">قبل ٢٤ ساعة من موعد الفعالية</option>
                                      <option value="قبل ٤٨ ساعة من الفعالية">قبل ٤٨ ساعة من موعد الفعالية</option>
                                      <option value="قبل ٣ أيام من الفعالية">قبل ٣ أيام من موعد الفعالية</option>
                                      <option value="قبل ٧ أيام من الفعالية">قبل ٧ أيام من موعد الفعالية</option>
                                      <option value="قبل ١٤ يوم من الفعالية">قبل ١٤ يوم من موعد الفعالية</option>
                                      <option value="غير مسترد بالكامل">غير مسترد نهائياً بالكامل (No Refund)</option>
                                    </select>
                                  </div>
                                  {/* Custom Text Input */}
                                  <div className="space-y-1 text-right">
                                    <label className="text-[10px] text-slate-400 block">أو حدد واكتب مهلتك الخاصة بالتفصيل:</label>
                                    <input
                                      type="text"
                                      value={serviceWizData.cancellationPeriod}
                                      onChange={(e) => setServiceWizData({ ...serviceWizData, cancellationPeriod: e.target.value })}
                                      placeholder="مثال: قبل ٣٦ ساعة، أو قبل ٥ أيام من الفعالية"
                                      className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-right font-bold text-slate-800 focus:border-indigo-500 transition-all"
                                    />
                                  </div>
                                </div>
                                <span className="text-[9px] text-slate-400 block text-right mt-1">
                                  * تضمن هذه السياسة حماية مستحقات مزود الخدمة من الإلغاءات المفاجئة والتعسفية من قِبل المستأجرين. يمكنك كتابة وتحديد أي مدة أو شروط إلغاء تفضلها.
                                </span>
                              </div>
                            </motion.div>
                          );
                        })()}

                        {/* Step 4: Photo Album Upload with Strict AGENTS.md Validations, Terms and Conditions & Provider Status */}
                        {serviceWizStep === 4 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            
                            {/* Photo Album drag & drop area */}
                            <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200">
                              <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                                <span className="text-[9px] font-mono font-black text-rose-500">MEDIA QUALITY RULES (AGENTS.MD)</span>
                                <h5 className="text-xs font-black text-slate-800">ألبوم صور الخدمة المساعدة المعتمد (الحد الأقصى 5 صور)</h5>
                              </div>
                              
                              <p className="text-[10px] text-slate-500 leading-relaxed text-right">
                                للالتزام الصارم بقوانين الجودة في منصة ليلة وقواعد صور **AGENTS.md**، يجب أن يتوافق أي ملف يتم رفعه مع الشروط أدناه:
                              </p>

                              {/* Visual Badges of constraints */}
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-[9px] font-black">
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-slate-600">
                                  الصيغ: JPEG, PNG, WebP
                                </div>
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-rose-700">
                                  الحجم الأقصى: 500KB
                                </div>
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-indigo-700">
                                  الحد الأدنى: 960x540 بكسل
                                </div>
                                <div className="bg-slate-50 border border-slate-150 p-1.5 rounded-lg text-purple-700">
                                  الحد الأقصى: 1280x720 بكسل
                                </div>
                              </div>

                              {/* Upload Dropzone */}
                              <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:bg-slate-50/50 hover:border-purple-300 transition-all relative">
                                <input
                                  type="file"
                                  id="service-images-upload"
                                  multiple
                                  accept=".jpg,.jpeg,.png,.webp"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    const files = Array.from(e.target.files || []);
                                    if (files.length === 0) return;

                                    if (serviceWizData.images.length + files.length > 5) {
                                      showNotification('error', 'الحد الأقصى المسموح به لألبوم صور الخدمة المساعدة هو 5 صور فقط.');
                                      return;
                                    }

                                    files.forEach(file => {
                                      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
                                      const ext = file.name.split('.').pop()?.toLowerCase();
                                      const isAllowedExt = ['png', 'jpg', 'jpeg', 'webp'].includes(ext || '');
                                      
                                      if (!allowedTypes.includes(file.type) && !isAllowedExt) {
                                        showNotification('error', `الملف ${file.name} غير مدعوم. يدعم فقط صيغ JPG, PNG, WEBP.`);
                                        return;
                                      }

                                      if (file.size > 500 * 1024) {
                                        showNotification('error', `تجاوز حجم الملف الحد المسموح به (500KB): ${file.name} (الحجم: ${Math.round(file.size / 1024)}KB).`);
                                        return;
                                      }

                                      const reader = new FileReader();
                                      reader.onload = (readerEvent) => {
                                        const dataUrl = readerEvent.target?.result as string;
                                        const img = new Image();
                                        img.onload = () => {
                                          const width = img.width;
                                          const height = img.height;

                                          if (width < 960 || width > 1280 || height < 540 || height > 720) {
                                            showNotification('error', `أبعاد الصورة غير مطابقة لقواعد المنصة: ${file.name} (${width}x${height}px). يجب أن تكون الأبعاد ما بين 960x540 و 1280x720 بكسل.`);
                                            return;
                                          }

                                          setServiceWizData(prev => ({
                                            ...prev,
                                            images: [...prev.images, { name: file.name, size: file.size, preview: dataUrl, width, height }]
                                          }));
                                          showNotification('success', `تم قبول الصورة ${file.name} ومطابقتها للشروط بنجاح (${width}x${height}px).`);
                                        };
                                        img.src = dataUrl;
                                      };
                                      reader.readAsDataURL(file);
                                    });
                                  }}
                                />
                                <span className="text-slate-400 font-bold text-xs block mb-1">قم بسحب وإفلات صور الخدمة هنا أو انقر للتصفح المباشر</span>
                                <span className="text-[10px] text-slate-400 font-mono block">يدعم فقط الصور المطابقة لسياسة الحجم والأبعاد (الحد الأقصى 5 صور)</span>
                              </div>

                              {/* Simulated Preloaded Compliant Mockup Images to ease demonstration */}
                              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-150 space-y-1.5 mt-2">
                                <span className="text-[10px] text-indigo-700 font-black block text-right">💡 أضف عينات صور جاهزة ومطابقة للمواصفات والأبعاد (لتسريع التجربة والتحقق):</span>
                                <div className="flex flex-wrap gap-2 justify-end">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (serviceWizData.images.length >= 5) {
                                        showNotification('warning', 'لقد وصلت للحد الأقصى 5 صور!');
                                        return;
                                      }
                                      const mockImg = {
                                        name: 'hospitality_premium.jpg',
                                        size: 245000,
                                        preview: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1280&h=720&fit=crop',
                                        width: 1280,
                                        height: 720
                                      };
                                      setServiceWizData(prev => ({ ...prev, images: [...prev.images, mockImg] }));
                                      showNotification('success', 'تم إلحاق صورة ضيافة عينة متوافقة بنسبة 16:9 مع الأبعاد والوزن!');
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 cursor-pointer shadow-sm"
                                  >
                                    + صورة بوفيه ضيافة (1280x720)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (serviceWizData.images.length >= 5) {
                                        showNotification('warning', 'لقد وصلت للحد الأقصى 5 صور!');
                                        return;
                                      }
                                      const mockImg = {
                                        name: 'wedding_decor.jpg',
                                        size: 312000,
                                        preview: 'https://images.unsplash.com/photo-1469371670807-013ccf25f16a?q=80&w=1280&h=720&fit=crop',
                                        width: 1280,
                                        height: 720
                                      };
                                      setServiceWizData(prev => ({ ...prev, images: [...prev.images, mockImg] }));
                                      showNotification('success', 'تم إلحاق صورة كوشة عينة متوافقة بنسبة 16:9 مع الأبعاد والوزن!');
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 cursor-pointer shadow-sm"
                                  >
                                    + صورة ديكور وكوشة (1280x720)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (serviceWizData.images.length >= 5) {
                                        showNotification('warning', 'لقد وصلت للحد الأقصى 5 صور!');
                                        return;
                                      }
                                      const mockImg = {
                                        name: 'pro_photography.jpg',
                                        size: 182000,
                                        preview: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1280&h=720&fit=crop',
                                        width: 1280,
                                        height: 720
                                      };
                                      setServiceWizData(prev => ({ ...prev, images: [...prev.images, mockImg] }));
                                      showNotification('success', 'تم إلحاق صورة تصوير عينة متوافقة بنسبة 16:9 مع الأبعاد والوزن!');
                                    }}
                                    className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-[9px] font-black text-slate-700 cursor-pointer shadow-sm"
                                  >
                                    + صورة كاميرا وتصوير (1280x720)
                                  </button>
                                </div>
                              </div>

                              {/* Thumbnail Previews with close button and dimensions tags */}
                              {serviceWizData.images.length > 0 && (
                                <div className="grid grid-cols-5 gap-2.5 pt-2">
                                  {serviceWizData.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-100 group shadow-sm">
                                      <img src={img.preview} alt={img.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                      {/* Specs tag overlay */}
                                      <div className="absolute inset-x-0 bottom-0 bg-slate-900/70 p-1 text-[7px] text-center text-white leading-none truncate font-mono">
                                        {img.width}x{img.height} | {Math.round(img.size / 1024)}KB
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setServiceWizData(prev => ({
                                            ...prev,
                                            images: prev.images.filter((_, i) => i !== idx)
                                          }));
                                          showNotification('info', `تم إزالة الصورة ${img.name} من الألبوم.`);
                                        }}
                                        className="absolute top-1 left-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow transition-all cursor-pointer"
                                        title="حذف الصورة"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Terms and Conditions */}
                            <div className="space-y-1">
                              <label className="text-[11px] font-black text-slate-600 block text-right">شروط وأحكام استخدام الخدمة وقوانين الحجز *</label>
                              <textarea
                                value={serviceWizData.terms}
                                onChange={(e) => setServiceWizData({ ...serviceWizData, terms: e.target.value })}
                                rows={2}
                                placeholder="أدخل هنا الشروط الإلزامية التي يوافق عليها العميل قبل الدفع، مثل متطلبات الطاقة، النظافة، أو التراخيص الأمنية..."
                                className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right text-slate-700 focus:border-purple-500 transition-all leading-relaxed font-bold"
                              />
                            </div>

                            {/* Service Status (Provider Control) */}
                            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 flex justify-between items-center">
                              <div className="text-right">
                                <span className="text-xs font-black text-slate-800 block">حالة الخدمة التشغيلية (خاص بالمزود) *</span>
                                <span className="text-[10px] text-slate-500 block">يتحكم المزود بتوافر الخدمة الفوري بالمنصة (نشطة أو غير نشطة مؤقتاً).</span>
                              </div>
                              <div>
                                <select
                                  value={serviceWizData.serviceStatus}
                                  onChange={(e) => setServiceWizData({ ...serviceWizData, serviceStatus: e.target.value })}
                                  className="p-2 border border-slate-200 bg-slate-50 rounded-xl text-xs font-bold outline-none text-right text-slate-700 focus:border-purple-500 cursor-pointer"
                                >
                                  <option value="نشط">نشطة ومتاحة للعملاء للطلب</option>
                                  <option value="غير نشط">غير نشطة (مغلقة مؤقتاً لأعمال التطوير)</option>
                                </select>
                              </div>
                            </div>

                          </motion.div>
                        )}

                        {/* Step 5: Complete Bento-Grid Review & Administrative Approval (Admin Role Only) */}
                        {serviceWizStep === 5 && (
                          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                            
                            {/* Governance Warning Badge */}
                            <div className="bg-amber-50 text-amber-900 p-4 rounded-2xl text-[11px] leading-relaxed border border-amber-200/70 space-y-1">
                              <div className="flex items-center gap-1.5 font-black text-amber-950">
                                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                                <span>⚠️ إشعار تدقيق وحوكمة الجودة بالمنصة (شروط الاعتماد):</span>
                              </div>
                              <p className="pr-5 font-bold">
                                بموجب شروط الجودة وقاعدة 6، لن تظهر أي خدمة مستقلة أو مساندة مضافة حديثاً للعموم أو في البحث العام للعملاء حتى تخضع لحالة **(معتمد من الإدارة)**.
                              </p>
                            </div>

                            {/* Bento Summary Sheet */}
                            <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 text-xs font-bold text-slate-700">
                              <div className="flex justify-between items-center border-b pb-2">
                                <span className="text-[9px] font-mono font-black text-slate-400">BOS INTEGRATED DATA SHEET</span>
                                <h5 className="text-sm font-black text-slate-800">بطاقة المراجعة الفنية الشاملة للخدمة</h5>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                                <div className="space-y-1.5">
                                  <div>• الاسم التجاري: <span className="text-slate-900 font-black">{serviceWizData.name || 'لم يحدد'}</span></div>
                                  <div>• الفئة والتصنيف: <span className="text-slate-900 font-black">{serviceWizData.category}</span></div>
                                  <div>• المزود المالك: <span className="text-indigo-700 font-black">{serviceWizData.provider}</span></div>
                                  <div>• سياسة التنفيذ: <span className="text-purple-700 font-black">{serviceWizData.fulfillmentPolicy === 'Hybrid' ? 'هجين (Co-fulfillment/Hybrid)' : 'داخلي بالكامل (Internal)'}</span></div>
                                  <div>• سعر الوحدة القياسي: <span className="text-slate-900 font-mono font-black">{serviceWizData.unitPrice} ر.س لكل {serviceWizData.unit}</span></div>
                                  <div>• مخزون السعة اليومي: <span className="text-slate-900 font-mono font-black">{serviceWizData.dailyStock} طلبات يومياً</span></div>
                                </div>

                                <div className="space-y-1.5 border-r border-slate-100 pr-4">
                                  <div>• القيمة المالية للمخزون: <span className="text-emerald-700 font-mono font-black">{((Number(serviceWizData.unitPrice) || 0) * (Number(serviceWizData.dailyStock) || 0)).toLocaleString()} ر.س</span></div>
                                  <div>• سياسة الإلغاء المجاني: <span className="text-amber-800 font-black">{serviceWizData.cancellationPeriod}</span></div>
                                  <div>• التغطية الجغرافية: <span className="text-slate-900 font-black">{serviceWizData.coverageRegions.join('، ') || 'لم تحدد'}</span></div>
                                  <div>• المدن المشمولة بالتغطية: <span className="text-indigo-700 font-black">{serviceWizData.coverageCities.join('، ') || 'لم تحدد'}</span></div>
                                  <div>• حالة الخدمة (المزود): <span className="text-slate-950 font-black">{serviceWizData.serviceStatus === 'نشط' ? 'نشطة ومتاحة للطلب' : 'غير نشطة مؤقتاً'}</span></div>
                                  <div>• ألبوم الصور المرفقة: <span className="text-purple-700 font-black font-mono">{serviceWizData.images.length} صور مضافة</span></div>
                                </div>
                              </div>

                              <div className="pt-2.5 border-t border-slate-100 space-y-1">
                                <span className="text-slate-500 block text-[10px] text-right">📄 شروط وأحكام الخدمة للعميل:</span>
                                <p className="text-[11px] text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-150 leading-relaxed font-normal text-right">
                                  {serviceWizData.terms || 'لا يوجد شروط مسجلة.'}
                                </p>
                              </div>
                            </div>

                            {/* ADMINISTRATIVE APPROVAL STATUS SECTION (Admin Role Only, Strict Compliance) */}
                            <div className="bg-indigo-950 text-white p-5 rounded-2xl border border-indigo-900 space-y-3">
                              <div className="flex justify-between items-center border-b border-indigo-900 pb-2">
                                <span className="text-[9px] font-mono font-black text-indigo-300">ADMINISTRATIVE STATUS CONTROL ENGINE</span>
                                <span className="text-[10px] bg-indigo-800 text-indigo-100 px-2.5 py-0.5 rounded-md font-black">حساب الإدارة والموافقة</span>
                              </div>

                              <p className="text-[10px] text-indigo-200 leading-relaxed text-right">
                                بموجب قوانين الاعتماد، فإن صلاحية تعيين واعتماد ونشر الخدمات المستقلة بشكل عام تنحصر فقط في **صلاحية الإدارة (Admin)**. 
                              </p>

                              <div className="space-y-1.5 text-right">
                                <label className="text-[11px] font-black text-indigo-100 block">تحديث الحالة الإدارية للخدمة (للإدارة فقط):</label>
                                {serviceWizRole === 'admin' ? (
                                  <select
                                    value={serviceWizData.adminStatus}
                                    onChange={(e) => setServiceWizData({ ...serviceWizData, adminStatus: e.target.value })}
                                    className="w-full p-2.5 border border-indigo-700 bg-indigo-900 text-white rounded-xl text-xs font-black outline-none text-right focus:border-indigo-500 cursor-pointer"
                                  >
                                    <option value="معلق بانتظار الاعتماد">معلق بانتظار الاعتماد (Pending Approval)</option>
                                    <option value="معتمد من الإدارة">معتمد من الإدارة ونشر للجمهور (Approved & Published)</option>
                                    <option value="مرفوض">مرفوض لعدم استيفاء شروط الجودة (Rejected)</option>
                                  </select>
                                ) : (
                                  <div className="w-full p-2.5 bg-indigo-900/60 border border-indigo-800 rounded-xl text-xs font-black text-indigo-200 text-right cursor-not-allowed">
                                    {serviceWizData.adminStatus} (مغلق لشركاء الخدمة - يتطلب مراجعة من الإدارة)
                                  </div>
                                )}
                                <span className="text-[9px] text-indigo-300 block text-right mt-1 leading-relaxed">
                                  {serviceWizRole === 'admin'
                                    ? '🟢 بصفتك مديراً للنظام، يمكنك تعيين الحالة كـ (معتمد) لتنشر فوراً للعملاء، أو (مرفوض) مع توضيح السبب.'
                                    : '🔒 لا يمتلك شريك الخدمة (المزود) الصلاحيات لتعديل هذا الحقل، وتظل الحالة معلقة لحين الموافقة الرسمية.'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        )}

                        {/* Wizard Navigation Footer */}
                        <div className="flex justify-between items-center pt-4 border-t border-slate-200 font-sans">
                          <div>
                            {serviceWizStep > 1 && (
                              <button
                                type="button"
                                onClick={() => setServiceWizStep(serviceWizStep - 1)}
                                className="px-4 py-2 text-slate-600 bg-white hover:bg-slate-100 rounded-xl text-xs font-black cursor-pointer border border-slate-250 transition-all flex items-center gap-1 shadow-sm"
                              >
                                السابق
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {serviceWizStep < 5 ? (
                              <button
                                type="button"
                                onClick={() => {
                                  if (serviceWizStep === 1 && !serviceWizData.name.trim()) {
                                    showNotification('warning', 'يرجى إدخال اسم الخدمة التجاري أولاً للمتابعة.');
                                    return;
                                  }
                                  if (serviceWizStep === 3 && serviceWizData.coverageRegions.length === 0) {
                                    showNotification('warning', 'يرجى اختيار منطقة تغطية واحدة على الأقل.');
                                    return;
                                  }
                                  if (serviceWizStep === 3 && serviceWizData.coverageCities.length === 0) {
                                    showNotification('warning', 'يرجى تحديد مدينة مخدومة واحدة على الأقل.');
                                    return;
                                  }
                                  setServiceWizStep(serviceWizStep + 1);
                                }}
                                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer transition-all shadow-md"
                              >
                                التالي
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const newIdNum = catalogServices.length + 1;
                                  const newId = `SER-26-${String(newIdNum).padStart(8, '0')}`;
                                  
                                  const newSerObj = {
                                    id: newId,
                                    name: serviceWizData.name,
                                    category: serviceWizData.category,
                                    provider: serviceWizData.provider,
                                    price: parseInt(serviceWizData.unitPrice),
                                    unitPrice: parseInt(serviceWizData.unitPrice),
                                    unit: serviceWizData.unit,
                                    dailyStock: parseInt(serviceWizData.dailyStock),
                                    cancellationPeriod: serviceWizData.cancellationPeriod,
                                    coverageRegions: serviceWizData.coverageRegions,
                                    coverageCities: serviceWizData.coverageCities,
                                    status: serviceWizData.adminStatus, // Rule 6
                                    serviceStatus: serviceWizData.serviceStatus,
                                    fulfillmentPolicy: serviceWizData.fulfillmentPolicy,
                                    terms: serviceWizData.terms,
                                    images: serviceWizData.images, // Array of images
                                    desc: serviceWizData.desc || 'خدمة مساندة جديدة خاضعة لشروط الجودة والمراجعة.'
                                  };

                                  setCatalogServices([...catalogServices, newSerObj]);
                                  setServiceWizStep(1); // Reset
                                  setServiceWizData({
                                    name: '',
                                    category: 'ضيافة',
                                    provider: currentProviderName || 'ليالينا للضيافة والاحتفالات',
                                    desc: '',
                                    unitPrice: '150',
                                    unit: 'ساعة',
                                    dailyStock: '5',
                                    cancellationPeriod: '٤٨ ساعة قبل موعد الفعالية',
                                    coverageRegions: ['منطقة الرياض'],
                                    coverageCities: ['الرياض'],
                                    adminStatus: 'معلق بانتظار الاعتماد',
                                    serviceStatus: 'نشط',
                                    terms: 'يلتزم العميل بتوفير متطلبات التشغيل المتفق عليها. تخضع عمليات الإلغاء لسياسة الاسترداد والمهلة المحددة.',
                                    images: [],
                                    fulfillmentPolicy: 'Internal',
                                    dynamicWeekend: true,
                                    dynamicSeasonal: false,
                                    dynamicVolume: false,
                                  });

                                  showNotification('success', `تم تسجيل تقديم الخدمة ${newId} بنجاح! الحالة الحالية: (${newSerObj.status}) بموجب شروط وقواعد الاعتماد والاعتماد المتعدد.`);
                                }}
                                className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-black cursor-pointer shadow-md transition-all flex items-center gap-1.5"
                              >
                                <Check className="w-4 h-4" />
                                تدشين وتقديم الخدمة للكتالوج
                              </button>
                            )}
                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                  {/* Packages view */}
                  {catalogActiveInnerTab === 'packages' && (
                    <div className="space-y-4 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
                      <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                        <span className="text-[10px] font-black text-slate-400 font-mono">READY PACKAGES</span>
                        <h3 className="text-sm font-black text-slate-800">باقات المناسبات الجاهزة والمجمّعة</h3>
                      </div>

                      <div className="grid grid-cols-1 gap-4">
                        {catalogPackages.map((pkg) => (
                          <div key={pkg.id} className="border border-slate-100 rounded-2xl p-4 hover:border-amber-100 transition-all space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="bg-amber-50 text-amber-700 text-[10px] font-black px-2.5 py-1 rounded-full border border-amber-200">باقة كبرى</span>
                              <h4 className="text-sm font-black text-slate-800">{pkg.name}</h4>
                            </div>
                            <p className="text-xs text-slate-500 leading-relaxed">{pkg.desc}</p>
                            
                            <div className="bg-slate-50 p-3 rounded-xl space-y-2">
                              <span className="text-[10px] font-black text-slate-400 block">المكونات المتضمنة بالباقة كلياً:</span>
                              <div className="flex flex-wrap gap-1.5">
                                {pkg.items.map((item: any, i: number) => (
                                  <span key={i} className="bg-white text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-100">
                                    ✓ {item}
                                  </span>
                                ))}
                              </div>
                            </div>

                            <div className="flex justify-between items-center pt-2 border-t border-slate-50 text-xs">
                              <span className="text-[10px] text-slate-400">القاعة الرئيسية: <strong className="text-slate-700">{pkg.venue}</strong></span>
                              <span className="font-mono text-amber-600 font-black text-sm">{formatCurrency(pkg.price)}</span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Add package form */}
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-4">
                        <h4 className="text-xs font-black text-amber-700">تجميع وتركيب باقة جديدة مخصصة للمناسبات</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <input
                            type="text"
                            placeholder="اسم الباقة الجاهزة (مثال: باقة العروس الفضية)"
                            id="new_pkg_name_input"
                            className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                          />
                          <select
                            id="new_pkg_venue_input"
                            className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                          >
                            <option value="قاعة الأسطورة الكبرى">قاعة الأسطورة الكبرى</option>
                            <option value="قاعة الملكية المذهلة">قاعة الملكية المذهلة</option>
                          </select>
                          <input
                            type="number"
                            placeholder="السعر الإجمالي للباقة (SAR)"
                            id="new_pkg_price_input"
                            className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                          />
                        </div>
                        <input
                          type="text"
                          placeholder="وصف مميزات وتفاصيل العرض الشامل للباقة"
                          id="new_pkg_desc_input"
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />

                        <button
                          onClick={() => {
                            const name = (document.getElementById('new_pkg_name_input') as HTMLInputElement)?.value;
                            const venue = (document.getElementById('new_pkg_venue_input') as HTMLSelectElement)?.value;
                            const price = (document.getElementById('new_pkg_price_input') as HTMLInputElement)?.value;
                            const desc = (document.getElementById('new_pkg_desc_input') as HTMLInputElement)?.value;

                            if (!name || !price) {
                              showNotification('warning', 'يرجى تحديد اسم الباقة وسعرها الإجمالي.');
                              return;
                            }

                            const newPkg = {
                              id: `PKG-${catalogPackages.length + 1}`,
                              name,
                              venue,
                              price: parseInt(price),
                              items: [venue, 'خدمة الضيافة والشاي', 'تصميم الكوشة الأساسية'],
                              desc: desc || 'باقة مجمعة من الكتالوج بخصم ترويجي حصرى.'
                            };

                            setCatalogPackages([...catalogPackages, newPkg]);
                            showNotification('success', `تم بناء وحفظ باقة المناسبات ${newPkg.name} بنجاح في نظام ERP وجاهزة للنشر.`);
                            
                            // Clear inputs
                            (document.getElementById('new_pkg_name_input') as HTMLInputElement).value = '';
                            (document.getElementById('new_pkg_price_input') as HTMLInputElement).value = '';
                            (document.getElementById('new_pkg_desc_input') as HTMLInputElement).value = '';
                          }}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                        >
                          إنشاء وتجميع باقة المناسبات
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Domain 4: Pricing Engine */}
              {osTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">DYNAMIC PRICING ENGINE</span>
                      <h3 className="text-sm font-black text-slate-800">ماتريكس محرك وحساب التسعير الذكي</h3>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed">
                      يدعم محرك الأسعار في منصة ليلة تعريف فئات تسعيرية مرنة (سعر الأساس، أسعار المواسم، أسعار نهاية الأسبوع للأيام المزدحمة، وأسعار عروض الأيام الهادئة). يطبق النظام السعر الأعلى تلقائياً وفقاً للتقويم المختار من العميل.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">معرّف القاعدة</th>
                            <th className="p-3 font-black">اسم فئة السعر</th>
                            <th className="p-3 font-black">نوع القاعدة</th>
                            <th className="p-3 font-black">القيمة التسعيرية</th>
                            <th className="p-3 font-black">فترة التطبيق</th>
                            <th className="p-3 font-black">الحالة</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                          {pricingRules.map((rule) => (
                            <tr key={rule.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono text-slate-500 font-bold">{rule.id}</td>
                              <td className="p-3 font-extrabold text-slate-800">{rule.name}</td>
                              <td className="p-3 font-bold text-slate-600">
                                {rule.type === 'base' ? 'سعر الأساس' : rule.type === 'weekend' ? 'نهاية الأسبوع' : rule.type === 'seasonal' ? 'موسمي' : 'عرض/خصم'}
                              </td>
                              <td className="p-3 font-mono text-indigo-600 font-black">{formatCurrency(rule.amount)}</td>
                              <td className="p-3 text-slate-500">{rule.appliesTo}</td>
                              <td className="p-3">
                                <button
                                  onClick={() => {
                                    const updated = pricingRules.map(r => r.id === rule.id ? { ...r, status: r.status === 'نشط' ? 'معطل' : 'نشط' } : r);
                                    setPricingRules(updated);
                                    showNotification('info', 'تم تعديل حالة تفعيل القاعدة بنجاح.');
                                  }}
                                  className={`px-2 py-0.5 rounded text-[10px] font-black cursor-pointer transition-all ${rule.status === 'نشط' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}
                                >
                                  {rule.status}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Pricing Rule Form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
                      <h4 className="text-xs font-black text-indigo-700">إضافة قاعدة تسعير مخصصة جديدة</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <input
                          type="text"
                          placeholder="اسم القاعدة (مثل: تسعيرة عيد الأضحى)"
                          value={newRuleName}
                          onChange={(e) => setNewRuleName(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <select
                          value={newRuleType}
                          onChange={(e) => setNewRuleType(e.target.value as any)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          <option value="weekend">سعر نهاية الأسبوع</option>
                          <option value="seasonal">سعر موسمي</option>
                          <option value="deal">عرض / خصم خاص</option>
                        </select>
                        <input
                          type="number"
                          placeholder="القيمة السعرية (SAR)"
                          value={newRuleAmount}
                          onChange={(e) => setNewRuleAmount(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                        />
                        <input
                          type="text"
                          placeholder="فترة التطبيق (مثل: أيام الأعياد)"
                          value={newRuleApplies}
                          onChange={(e) => setNewRuleApplies(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newRuleName || !newRuleAmount) {
                            showNotification('warning', 'يرجى كتابة اسم القاعدة والمبلغ المالي.');
                            return;
                          }
                          const newRuleIdNum = pricingRules.length + 1;
                          const newRule = {
                            id: `PR-26-${String(newRuleIdNum).padStart(8, '0')}`,
                            name: newRuleName,
                            type: newRuleType,
                            amount: parseInt(newRuleAmount),
                            appliesTo: newRuleApplies || 'جميع الأيام',
                            status: 'نشط'
                          };
                          setPricingRules([...pricingRules, newRule]);
                          setNewRuleName('');
                          setNewRuleAmount('');
                          setNewRuleApplies('');
                          showNotification('success', `تم حفظ وتفعيل قاعدة التسعير الديناميكي بالرقم التسلسلي ${newRule.id}`);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        حفظ وتفعيل القاعدة التسعيرية في النظام
                      </button>
                    </div>
                  </div>

                  {/* Dynamic Pricing Engine Simulator */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <h4 className="text-xs font-black text-slate-400 font-mono">PRICING SIMULATION TOOL</h4>
                    <h3 className="text-sm font-black text-slate-800">محاكي حساب التسعيرة الديناميكية الفورية للعملاء</h3>
                    <p className="text-[11px] text-slate-500">
                      اضبط المعايير التشغيلية أدناه لرؤية كيف يتفاعل نظام حسابات التسعير المدمج ويولد عرض السعر النهائي في ثوانٍ:
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 block">سعر حجز الأساس الأساسي</span>
                        <input
                          type="number"
                          value={simBasePrice}
                          onChange={(e) => setSimBasePrice(e.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right font-mono font-black"
                        />
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 block">طبيعة يوم المناسبة</span>
                        <select
                          value={simDayType}
                          onChange={(e) => setSimDayType(e.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right"
                        >
                          <option value="weekday">يوم عادي في وسط الأسبوع (سعر قياسي)</option>
                          <option value="weekend">يوم نهاية أسبوع (خميس/جمعة) (+٢٠٪)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 block">الموسمية والطلب</span>
                        <select
                          value={simSeason}
                          onChange={(e) => setSimSeason(e.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right"
                        >
                          <option value="normal">موسم عادي طبيعي</option>
                          <option value="high">موسم الأعياد والصيف (+٣٠٪)</option>
                        </select>
                      </div>

                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 block">العروض والخصومات</span>
                        <select
                          value={simDeals}
                          onChange={(e) => setSimDeals(e.target.value)}
                          className="w-full p-2 border border-slate-200 bg-white rounded-xl text-xs text-right"
                        >
                          <option value="none">بدون أي خصومات إضافية</option>
                          <option value="promo">خصم العضوية الحصرية (-١٠٪)</option>
                        </select>
                      </div>
                    </div>

                    <div className="bg-indigo-900 text-white p-4 rounded-2xl flex justify-between items-center">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-200 block">العرض الناتج المقترح للعميل بالريال السعودي:</span>
                        <span className="text-xs text-indigo-300">يخضع للضريبة المضافة VAT والرسوم اللوجستية</span>
                      </div>
                      <div className="text-left">
                        <span className="text-2xl font-black font-mono text-yellow-400 block">
                          {(() => {
                            let price = parseFloat(simBasePrice) || 0;
                            if (simDayType === 'weekend') price *= 1.2;
                            if (simSeason === 'high') price *= 1.3;
                            if (simDeals === 'promo') price *= 0.9;
                            return Math.round(price).toLocaleString('ar-SA');
                          })()}{' '}
                          ر.س
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 5: Availability Engine */}
              {osTab === 'availability' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">AVAILABILITY & LOCKOUT ENGINE</span>
                      <h3 className="text-sm font-black text-slate-800">محرك الجدولة التلقائية وإتاحة الحجوزات</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 block">ساعات استقبال وتجهيز المناسبات (المنشأة)</label>
                          <input
                            type="text"
                            value={availabilityWorkingHours}
                            onChange={(e) => setAvailabilityWorkingHours(e.target.value)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-right font-bold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-500 block">الحد الأقصى اليومي للمدعوين والسلامة</label>
                          <input
                            type="number"
                            value={availabilityCapacityLimit}
                            onChange={(e) => setAvailabilityCapacityLimit(parseInt(e.target.value) || 0)}
                            className="w-full p-2.5 border border-slate-200 rounded-xl text-xs outline-none text-right font-mono font-bold"
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <span className="text-xs font-black text-slate-800 block mb-2">أيام الصيانة الدورية المعتمدة بالنظام</span>
                          <div className="space-y-2">
                            {['الأحد من كل أسبوع', 'أيام الأعياد الرسمية'].map((day, i) => (
                              <div key={i} className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg text-xs font-bold text-slate-600 border border-slate-100">
                                <span>{day}</span>
                                <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded">صيانة مجدولة</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Blackout dates management */}
                    <div className="pt-4 border-t border-slate-50 space-y-3">
                      <h4 className="text-xs font-black text-slate-800">تواريخ الحظر والتعطيل الاستثنائي (Blackout Dates)</h4>
                      <p className="text-[11px] text-slate-400">أي تاريخ يتم حظره أدناه، لن يتمكن العملاء نهائياً من تحديده في تقويم الحجز بالواجهة العامة.</p>

                      <div className="flex flex-wrap gap-2">
                        {availabilityBlackoutDates.map((date, index) => (
                          <div key={index} className="bg-red-50 text-red-800 border border-red-100 px-3 py-1.5 rounded-xl text-xs font-black flex items-center gap-2">
                            <button
                              onClick={() => {
                                setAvailabilityBlackoutDates(availabilityBlackoutDates.filter(d => d !== date));
                                showNotification('info', `تم إلغاء الحظر وتفعيل الإتاحة للتاريخ ${date}`);
                              }}
                              className="text-red-500 hover:text-red-800 font-bold"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2 items-center bg-slate-50 p-3 rounded-2xl w-fit">
                        <input
                          type="date"
                          value={newBlackoutDate}
                          onChange={(e) => setNewBlackoutDate(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                        />
                        <button
                          onClick={() => {
                            if (!newBlackoutDate) {
                              showNotification('warning', 'يرجى تحديد التاريخ المراد تعطيله.');
                              return;
                            }
                            if (availabilityBlackoutDates.includes(newBlackoutDate)) {
                              showNotification('warning', 'هذا التاريخ معطل بالفعل في النظام.');
                              return;
                            }
                            setAvailabilityBlackoutDates([...availabilityBlackoutDates, newBlackoutDate]);
                            setNewBlackoutDate('');
                            showNotification('success', 'تم تعطيل التاريخ وحظره بنجاح من تقويمات الحجز.');
                          }}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer"
                        >
                          تعطيل تاريخ الحجز المختار
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 6: Booking Operations */}
              {osTab === 'bookings' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">TIMELINE BOOKING TRACKER</span>
                      <h3 className="text-sm font-black text-slate-800">لوحة تتبع دورة حياة الحجوزات (الجدول الزمني التفاعلي)</h3>
                    </div>

                    <p className="text-xs text-slate-500">
                      انقر على أي حجز أدناه لتغيير حالته اللوجستية الفورية وتتبع مؤشر التقدم التفاعلي (Timeline) لمراحل حجز قاعات الأفراح.
                    </p>

                    <div className="space-y-4">
                      {myBookings.map((b) => {
                        const isExpanded = selectedBkgIdForTimeline === b.id;
                        const currentStatus = b.status || b.paymentStatus || 'مؤكد';
                        return (
                          <div key={b.id} className="border border-slate-100 rounded-2xl p-4 space-y-3 hover:border-indigo-100 transition-all">
                            <div className="flex justify-between items-center cursor-pointer" onClick={() => setSelectedBkgIdForTimeline(isExpanded ? '' : b.id)}>
                              <div className="text-left">
                                <span className="bg-indigo-50 text-indigo-700 text-[10px] font-black px-2 py-0.5 rounded font-mono block mb-1">
                                  {b.id && b.id.startsWith('BKG-') ? b.id : `BKG-26-${String(b.id || b.index || 1).replace(/\D/g, '').padStart(10, '0')}`}
                                </span>
                                <span className="text-xs font-mono font-black text-indigo-600 block">{formatCurrency(b.amount || b.price)}</span>
                              </div>
                              <div className="text-right">
                                <h4 className="text-xs font-black text-slate-800">حجز القاعة للعميل: {b.customer || b.customerName || 'عميل منصة ليلة'}</h4>
                                <span className="text-[10px] text-slate-400 block mt-0.5">التاريخ المستهدف: {b.date} | قاعة: {b.hall}</span>
                              </div>
                            </div>

                            {/* Timeline Stepper */}
                            <div className="grid grid-cols-6 gap-1 pt-3 text-center border-t border-slate-50 text-[9px] font-black">
                              {[
                                { key: 'draft', label: '١. مسودة' },
                                { key: 'pending_payment', label: '٢. دفع معلق' },
                                { key: 'confirmed', label: '٣. معتمد' },
                                { key: 'preparing', label: '٤. تجهيز' },
                                { key: 'completed', label: '٥. منجز' },
                                { key: 'settled', label: '٦. مصفي' }
                              ].map((step, i) => {
                                const isActive = currentStatus.toLowerCase().includes(step.key) || (step.key === 'confirmed' && currentStatus === 'مؤكد');
                                return (
                                  <div key={i} className={`p-1.5 rounded-lg border ${isActive ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                                    {step.label}
                                  </div>
                                );
                              })}
                            </div>

                            {isExpanded && (
                              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3 mt-2 animate-fadeIn">
                                <div className="flex justify-between items-center text-xs">
                                  <span className="font-bold text-slate-500">تحديث الحالة اللوجستية يدوياً:</span>
                                  <select
                                    value={currentStatus}
                                    onChange={(e) => {
                                      const newStatus = e.target.value;
                                      const updatedBookings = myBookings.map(item => item.id === b.id ? { ...item, status: newStatus, paymentStatus: newStatus === 'مؤكد' ? 'مدفوع' : newStatus } : item);
                                      // Normally this triggers state update, let's inform user
                                      b.status = newStatus;
                                      b.paymentStatus = newStatus === 'مؤكد' ? 'مدفوع' : newStatus;
                                      showNotification('success', `تم تحديث حالة الحجز رقم ${b.id || 'المختار'} بنجاح إلى: ${newStatus}`);
                                      setSelectedBkgIdForTimeline('');
                                    }}
                                    className="p-1.5 border border-slate-200 bg-white rounded-lg text-[11px]"
                                  >
                                    <option value="draft">١. مسودة (Draft)</option>
                                    <option value="pending_payment">٢. دفع معلق (Pending Payment)</option>
                                    <option value="مؤكد">٣. معتمد ومؤكد (Confirmed)</option>
                                    <option value="preparing">٤. قيد التجهيز اللوجستي (Preparing)</option>
                                    <option value="completed">٥. منتهي ومكتمل الحفل (Completed)</option>
                                    <option value="settled">٦. تمت تصفية الأرباح (Settled)</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 7: Order Operations */}
              {osTab === 'orders' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">INDEPENDENT ORDERS HUB</span>
                      <h3 className="text-sm font-black text-slate-800">إدارة ومتابعة طلبات الخدمات التكميلية المستقلة</h3>
                    </div>

                    <p className="text-xs text-slate-500">
                      طلبات خدمات التجهيز، الضيافة، والتصوير التي يشتريها العميل كملحقات مستقلة يتم متابعة دورتها اللوجستية والتحضيرية هنا بمعزل عن حجز القاعة الرئيسي.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">رقم الطلب (Order ID)</th>
                            <th className="p-3 font-black">الخدمة والتصنيف</th>
                            <th className="p-3 font-black">المبلغ</th>
                            <th className="p-3 font-black">تاريخ التنفيذ</th>
                            <th className="p-3 font-black">الحالة واللوجستيات</th>
                            <th className="p-3 font-black text-center">الإجراء</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                          {mySupportRequests.map((r, i) => {
                            const uniqueOrderId = r.id || `SRV-26-0000000${i + 1}`;
                            return (
                              <tr key={i} className="hover:bg-slate-50/50">
                                <td className="p-3 font-mono font-bold text-slate-600">{uniqueOrderId}</td>
                                <td className="p-3">
                                  <div>
                                    <span className="font-extrabold text-slate-800 block">{r.serviceName}</span>
                                    <span className="text-[9px] text-slate-400 block">{r.category || 'تكميلي'}</span>
                                  </div>
                                </td>
                                <td className="p-3 font-mono text-slate-800 font-black">{formatCurrency(r.price || r.amount || 1500)}</td>
                                <td className="p-3 font-mono text-slate-500">{r.date || '٢٠٢٦/٠٧/٢٥'}</td>
                                <td className="p-3">
                                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${r.status === 'مكتمل' || r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                                    {r.status || 'جاهز للتسليم'}
                                  </span>
                                </td>
                                <td className="p-3 text-center">
                                  <button
                                    onClick={() => {
                                      r.status = 'مكتمل';
                                      showNotification('success', `تم تحديث حالة طلب الخدمة رقم ${uniqueOrderId} إلى مكتمل ومسلم للعميل بنجاح!`);
                                      setOsTab('orders'); // Force rerender
                                    }}
                                    className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black transition-all cursor-pointer"
                                  >
                                    تأكيد التسليم
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 8: Hybrid Occasions */}
              {osTab === 'hybrid' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">ANTI DE-DUPLICATION RULE CHECK</span>
                      <h3 className="text-sm font-black text-slate-800">قواعد منع الازدواجية البرمجية وتكامل الخدمات الهجينة</h3>
                    </div>

                    <div className="p-4 bg-emerald-50/70 text-emerald-900 border border-emerald-100 rounded-2xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
                      <div className="space-y-1">
                        <strong className="text-xs font-black block">درع حظر الازدواجية البرمجية (قاعدة 5):</strong>
                        <p className="text-[11px] leading-relaxed">
                          تنص سياسة منصة ليلة الصارمة على أنه: إذا كانت قاعتكم تقدم خدمات إضافية داخلية (مثل الضيافة أو التصوير أو الكوشة) تندرج تحت فئة معينة، فإن نظام الحجز الذكي للعميل يحظر تلقائياً اقتراح أو عرض أي مزودي خدمات خارجيين مستقلين من نفس تلك الفئة لضمان أولوية البيع والتنظيم لخدماتكم الأصلية وتفادي التعارض التشغيلي.
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                      <span className="text-[10px] font-black text-slate-400 block">محاكاة مطابقة تصنيف الخدمات وحظر الازدواجية:</span>
                      
                      <div className="divide-y divide-slate-100 text-xs">
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">محظور برمجياً ✓</span>
                          <span className="text-slate-700">بوفيه الضيافة الخارجي (تم كشف وجود بوفيه داخلي متاح للقاعة)</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">محظور برمجياً ✓</span>
                          <span className="text-slate-700">مصورة خارجية مستقلة (تم كشف وجود خدمة تصوير داخلية مضافة للقاعة)</span>
                        </div>
                        <div className="py-2.5 flex justify-between items-center">
                          <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded">مسموح لعدم توفر بديل</span>
                          <span className="text-slate-500">طاقم فرقة استعراضية موسيقية (لا يوجد لديك فرقة داخلية بالخدمات)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 9: Finance Center */}
              {osTab === 'finance' && (
                <div className="space-y-6">
                  {/* Ledger summary */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-300">رصيد المحفظة الإجمالي (الضمان)</span>
                      <p className="text-2xl font-black font-mono mt-1">{formatCurrency(25000)}</p>
                      <span className="text-[9px] text-indigo-300 block">يشمل الحجوزات قيد التنفيذ والضمان</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">الرصيد المتاح للسحب الفوري</span>
                      <p className="text-2xl font-black font-mono mt-1 text-emerald-600">{formatCurrency(15000)}</p>
                      <span className="text-[9px] text-slate-400 block">جاهز للتحويل للآيبان البنكي</span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-bold text-slate-400">العمولات المستحقة للمنصة</span>
                      <p className="text-2xl font-black font-mono mt-1 text-purple-600">{formatCurrency(2000)}</p>
                      <span className="text-[9px] text-slate-400 block">تقتطع تلقائياً بنسبة عمولة ثابتة 8%</span>
                    </div>
                  </div>

                  {/* Settlement Request Form */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <h3 className="text-sm font-black text-slate-800">طلب تسوية مالية وتحويل بنكي للحساب</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">المبلغ المراد سحبه بالريال (SAR)</label>
                        <input
                          type="number"
                          placeholder="مثال: 5000"
                          value={withdrawingAmount}
                          onChange={(e) => setWithdrawingAmount(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs text-right font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">رقم الحساب البنكي (IBAN)</label>
                        <input
                          type="text"
                          placeholder="SAxxxxxxxxxxxxxxxxxxxx"
                          value={withdrawIban}
                          onChange={(e) => setWithdrawIban(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs text-right font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 block">اسم صاحب الحساب البنكي</label>
                        <input
                          type="text"
                          placeholder="الاسم الثلاثي المسجل بالبنك"
                          value={withdrawHolder}
                          onChange={(e) => setWithdrawHolder(e.target.value)}
                          className="w-full p-2 border border-slate-200 rounded-xl text-xs text-right"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (!withdrawingAmount || !withdrawIban || !withdrawHolder) {
                          showNotification('warning', 'يرجى تعبئة كافة تفاصيل طلب التحويل المالي.');
                          return;
                        }
                        const amt = parseFloat(withdrawingAmount);
                        if (amt > 15000) {
                          showNotification('error', 'المبلغ المطلوب يتجاوز الرصيد المتاح للسحب حالياً.');
                          return;
                        }
                        const newIdNum = withdrawalRequests.length + 1;
                        const newReq = {
                          id: `REV-26-${String(newIdNum).padStart(10, '0')}`,
                          amount: amt,
                          iban: withdrawIban,
                          status: 'مقبول',
                          date: new Date().toISOString().split('T')[0]
                        };
                        saveWithdrawalRequests([newReq, ...withdrawalRequests]);
                        setWithdrawingAmount('');
                        setWithdrawIban('');
                        setWithdrawHolder('');
                        showNotification('success', `تم تسجيل طلب التسوية البنكية بالرقم المالي ${newReq.id} وتحويله للمراجعة الفورية!`);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      تأكيد وإرسال طلب التسوية والمقاصة
                    </button>
                  </div>

                  {/* Withdrawal ledger */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <h3 className="text-sm font-black text-slate-800">سجل طلبات التحويل والتسويات المالية السابقة</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">رقم التسوية (REV/EXP)</th>
                            <th className="p-3 font-black">مبلغ التحويل</th>
                            <th className="p-3 font-black">الحساب البنكي</th>
                            <th className="p-3 font-black">تاريخ الطلب</th>
                            <th className="p-3 font-black text-center">حالة الطلب</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                          {withdrawalRequests.map((req: any, idx: number) => {
                            const formattedRevId = req.id && req.id.startsWith('REV') ? req.id : `REV-26-000000000${idx + 1}`;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-3 font-mono font-bold text-indigo-600">{formattedRevId}</td>
                                <td className="p-3 font-mono text-slate-800 font-black">{formatCurrency(req.amount)}</td>
                                <td className="p-3 font-mono text-slate-500 truncate max-w-xs">{req.iban}</td>
                                <td className="p-3 font-mono text-slate-500">{req.date}</td>
                                <td className="p-3 text-center">
                                  <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">
                                    {req.status}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Provider Payout Account & Subscription Payment Panel */}
                  <div className="pt-4 border-t border-slate-100">
                    <ProviderPayoutAndSubscriptionPanel
                      providerId="prov-101"
                      providerName={currentProviderName}
                      showNotification={showNotification}
                    />
                  </div>
                </div>
              )}

              {/* Domain 10: Subscription Center */}
              {osTab === 'subscription' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">MEMBERSHIP & SUBSCRIPTION</span>
                      <h3 className="text-sm font-black text-slate-800">اشتراك المنشأة وباقة تشغيل ERP</h3>
                    </div>

                     <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white p-5 rounded-2xl relative overflow-hidden text-right space-y-3">
                      <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-radial from-white/10 to-transparent pointer-events-none"></div>
                      <span className="bg-yellow-400 text-slate-900 text-[10px] font-black px-2.5 py-0.5 rounded-full">الخطة النشطة</span>
                      {providerPlan === 'pro' ? (
                        <>
                          <h4 className="text-base font-black">الباقة الاحترافية الملكية (Layla Pro ERP)</h4>
                          <p className="text-xs text-indigo-100 leading-relaxed max-w-2xl">
                            تمنحك الباقة الاحترافية الملكية صلاحيات تشغيل ٢ فرع، و١٠ موظفين، ونظام محرك الأسعار الديناميكي، وميزة تجميع الباقات الجاهزة مع اقتطاع عمولة تشغيلية قدرها <strong className="text-yellow-400">8%</strong> فقط عن كل عملية حجز ناجحة عبر المنصة.
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="text-base font-black">الباقة المبتدئة (BOS Starter)</h4>
                          <p className="text-xs text-indigo-100 leading-relaxed max-w-2xl">
                            تمنحك الباقة المبتدئة صلاحيات تشغيل فرع واحد، و٣ موظفين، والكتالوج الأساسي. <strong className="text-yellow-300">لا تشتمل</strong> على نظام محرك الأسعار الديناميكي أو تجميع الباقات الجاهزة، مع عمولة تشغيلية قدرها <strong className="text-yellow-400">12%</strong> لكل حجز. يمكنك الترقية الآن أو شراء الميزة الإضافية بشكل منفصل.
                          </p>
                        </>
                      )}

                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-indigo-800 text-xs">
                        <div>
                          <span className="text-indigo-200 block text-[10px]">تاريخ انتهاء الفترة</span>
                          <span className="font-mono font-bold">٢٠٢٧-٠١-٠١</span>
                        </div>
                        <div>
                          <span className="text-indigo-200 block text-[10px]">مستوى العمولة</span>
                          <span className="font-mono font-bold">{providerPlan === 'pro' ? '8% ثابتة' : '12% أساسية'}</span>
                        </div>
                        <div>
                          <span className="text-indigo-200 block text-[10px]">سعر الاشتراك الشهري</span>
                          <span className="font-mono font-bold">{providerPlan === 'pro' ? '499 ر.س / شهر' : '199 ر.س / شهر'}</span>
                        </div>
                      </div>

                      <div className="pt-2 flex gap-2">
                        {providerPlan === 'starter' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setProviderPlan('pro');
                              showNotification('success', 'تهانينا! تم ترقية اشتراكك للباقة الاحترافية الملكية Layla Pro ERP بنجاح، وتم تفعيل كافة ميزات الذكاء التشغيلي.');
                            }}
                            className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-slate-900 rounded-xl text-xs font-black transition-all cursor-pointer shadow-sm"
                          >
                            الترقية الآن إلى الباقة الاحترافية الملكية (499 ر.س/شهر)
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setProviderPlan('starter');
                              showNotification('info', 'تم التبديل إلى الباقة المبتدئة BOS Starter بنجاح لتجربة واختبار الميزات المقفلة.');
                            }}
                            className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                          >
                            تراجع إلى الباقة المبتدئة (للاختبار والمحاكاة)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Bought feature tokens */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-black text-slate-800">شراء ميزات إضافية وتوسيع النظام (ERP Addons)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:border-indigo-200 transition-all">
                          <button
                            onClick={() => showNotification('success', 'تم شراء وترقية كود التثبيت! ستظهر القاعة كأول نتيجة بحث في مدينتك لمدة ٣٠ يوماً.')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                          >
                            شراء بـ 500 ر.س
                          </button>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-800 block">ترقية الظهور وتثبيت البحث (Featured Booster)</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">تثبيت القاعة في أعلى نتائج البحث للعملاء بمدينتك.</span>
                          </div>
                        </div>

                        <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:border-indigo-200 transition-all">
                          <button
                            onClick={() => showNotification('success', 'تم ترقية الباقة لفرع إضافي! يمكنك الآن إنشاء فرع ثالث في ملف الكوادر.')}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer"
                          >
                            شراء بـ 199 ر.س
                          </button>
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-800 block">ترخيص فرع إضافي بالنظام (Extra Branch Slot)</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">إضافة وترخيص فرع تشغيلي ثالث بكامل إعداداته.</span>
                          </div>
                        </div>

                        <div className="border border-slate-100 p-3 rounded-xl flex justify-between items-center hover:border-indigo-200 transition-all">
                          {hasDynamicPricingAccess ? (
                            <span className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-[10px] font-black border border-emerald-200 shrink-0">
                              مفعل ونشط
                            </span>
                          ) : (
                            <button
                              onClick={() => {
                                setPurchasedDynamicPricingAddon(true);
                                showNotification('success', 'تم شراء وتفعيل ملحق محرك التسعير الديناميكي والذكاء التشغيلي بنجاح!');
                              }}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[10px] font-black transition-all cursor-pointer shrink-0"
                            >
                              شراء بـ 299 ر.س
                            </button>
                          )}
                          <div className="text-right">
                            <span className="text-xs font-black text-slate-800 block">ملحق التسعير الديناميكي (Dynamic Pricing)</span>
                            <span className="text-[10px] text-slate-400 block mt-0.5">تفعيل قواعد تعديل الأسعار للمواسم والكميات لخدماتك.</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Unified invoice table with compliant ID: INV-YYXXXXXXXXXX */}
                    <div className="pt-4 border-t border-slate-50 space-y-3">
                      <h4 className="text-xs font-black text-slate-800">فواتير اشتراكات النظام المالي ERP (قالب الفاتورة الضريبية)</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-right text-xs">
                          <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                            <tr>
                              <th className="p-3 font-black">رقم الفاتورة الضريبية</th>
                              <th className="p-3 font-black">البيان والتفاصيل</th>
                              <th className="p-3 font-black">المبلغ الكلي</th>
                              <th className="p-3 font-black">ضريبة VAT 15%</th>
                              <th className="p-3 font-black text-center">حالة السداد</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 font-sans">
                            <tr>
                              <td className="p-3 font-mono font-black text-indigo-600">INV-260000000001</td>
                              <td className="p-3 text-slate-800">اشتراك منصة ليلة ERP - الباقة الاحترافية (شهر يوليو)</td>
                              <td className="p-3 font-mono text-slate-800 font-bold">{formatCurrency(499)}</td>
                              <td className="p-3 font-mono text-slate-500">{formatCurrency(74.85)}</td>
                              <td className="p-3 text-center">
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">
                                  مسددة بالكامل
                                </span>
                              </td>
                            </tr>
                            <tr>
                              <td className="p-3 font-mono font-black text-indigo-600">INV-260000000002</td>
                              <td className="p-3 text-slate-800">شراء كود ترويج وتثبيت البحث لشهر أغسطس</td>
                              <td className="p-3 font-mono text-slate-800 font-bold">{formatCurrency(500)}</td>
                              <td className="p-3 font-mono text-slate-500">{formatCurrency(75)}</td>
                              <td className="p-3 text-center">
                                <span className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded text-[10px] font-black">
                                  مسددة بالكامل
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 11: Reports */}
              {osTab === 'reports' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">ANALYTICAL REPORT ENGINE</span>
                      <h3 className="text-sm font-black text-slate-800">نظام استخراج وتحليل التقارير التشغيلية والمالية</h3>
                    </div>

                    {/* Report sub-selector */}
                    <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1.5 w-fit border border-slate-100">
                      <button
                        onClick={() => setReportsActiveInnerTab('financial')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${reportsActiveInnerTab === 'financial' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                      >
                        التقرير المالي وحساب الأرباح
                      </button>
                      <button
                        onClick={() => setReportsActiveInnerTab('operational')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${reportsActiveInnerTab === 'operational' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                      >
                        التقرير اللوجستي ومعدل التحضير
                      </button>
                      <button
                        onClick={() => setReportsActiveInnerTab('branches')}
                        className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${reportsActiveInnerTab === 'branches' ? 'bg-indigo-600 text-white' : 'text-slate-600'}`}
                      >
                        تقرير أداء الفروع والمقارنة
                      </button>
                    </div>

                    {reportsActiveInnerTab === 'financial' && (
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-black text-indigo-800 block">كشف تقرير الأرباح المجمّع للفترة المحددة:</span>
                        <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="font-mono text-slate-800 font-bold">{formatCurrency(135000)}</span>
                            <span className="text-slate-500">إجمالي حجم المبيعات الضريبية الكلية:</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="font-mono text-red-600 font-bold">-{formatCurrency(10800)}</span>
                            <span className="text-slate-500">مجموع عمولة منصة ليلة المستحقة (8%):</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-slate-200">
                            <span className="font-mono text-emerald-600 font-black text-sm">{formatCurrency(124200)}</span>
                            <span className="text-slate-800 font-black">صافي الأرباح الصافية القابلة للتحويل بنكياً:</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {reportsActiveInnerTab === 'operational' && (
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-black text-indigo-800 block">المؤشرات التشغيلية ونسب الإنجاز اللوجستي:</span>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">نسبة إنجاز تشيك لست التحضير</span>
                            <span className="text-base font-black text-indigo-600 block mt-1">94.5%</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">متوسط زمن التجهيز للمناسبة</span>
                            <span className="text-base font-black text-indigo-600 block mt-1">٣ ساعات قبل الموعد</span>
                          </div>
                          <div className="bg-slate-50 p-3 rounded-xl">
                            <span className="text-[10px] text-slate-400 block">معدل الإلغاء للمناسبات</span>
                            <span className="text-base font-black text-red-600 block mt-1">0.8% فقط</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {reportsActiveInnerTab === 'branches' && (
                      <div className="space-y-3 pt-2">
                        <span className="text-xs font-black text-indigo-800 block">حجم الإنتاجية وإيرادات الفروع بالمقارنة:</span>
                        <div className="space-y-3 font-sans">
                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                              <span>{formatCurrency(85000)} (٦٣٪)</span>
                              <span>فرع الرياض الرئيسي</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '63%' }}></div>
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                              <span>{formatCurrency(50000)} (٣٧٪)</span>
                              <span>فرع شمال الرياض</span>
                            </div>
                            <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                              <div className="bg-indigo-600 h-full rounded-full" style={{ width: '37%' }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Domain 12: Marketing */}
              {osTab === 'marketing' && (
                <div className="space-y-6">
                  {/* Coupon management */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">COUPONS & CAMPAIGNS</span>
                      <h3 className="text-sm font-black text-slate-800">إدارة الكوبونات وحملات الخصومات الترويجية</h3>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">كود الخصم</th>
                            <th className="p-3 font-black">القيمة</th>
                            <th className="p-3 font-black">النوع</th>
                            <th className="p-3 font-black">مرات الاستخدام</th>
                            <th className="p-3 font-black text-center">حالة الكوبون</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                          {marketingCoupons.map((c) => (
                            <tr key={c.code} className="hover:bg-slate-50/50">
                              <td className="p-3 font-mono font-black text-slate-800">{c.code}</td>
                              <td className="p-3 font-mono text-slate-700 font-bold">{c.discount}</td>
                              <td className="p-3 text-slate-600">{c.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ مقطوع'}</td>
                              <td className="p-3 font-mono text-slate-500">{c.usageCount} / {c.maxUsage} مرة</td>
                              <td className="p-3 text-center">
                                <button
                                  onClick={() => {
                                    const updated = marketingCoupons.map(item => item.code === c.code ? { ...item, status: item.status === 'نشط' ? 'غير نشط' : 'نشط' } : item);
                                    setMarketingCoupons(updated);
                                    showNotification('info', 'تم تعديل حالة الكوبون بنجاح بالنظام.');
                                  }}
                                  className={`px-2.5 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${c.status === 'نشط' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400'}`}
                                >
                                  {c.status}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add Coupon Form */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
                      <h4 className="text-xs font-black text-indigo-700">توليد كود ترويجي/كوبون جديد لحملات المنشأة</h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <input
                          type="text"
                          placeholder="رمز الكود (مثل: WEDDING26)"
                          value={newCouponCode}
                          onChange={(e) => setNewCouponCode(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono font-black"
                        />
                        <input
                          type="text"
                          placeholder="قيمة الخصم (مثل: 15% أو 1000)"
                          value={newCouponDiscount}
                          onChange={(e) => setNewCouponDiscount(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                        <select
                          value={newCouponType}
                          onChange={(e) => setNewCouponType(e.target.value as any)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          <option value="percentage">نسبة مئوية من قيمة الحجز</option>
                          <option value="fixed">مبلغ مقطوع بالريال السعودي</option>
                        </select>
                      </div>
                      <button
                        onClick={() => {
                          if (!newCouponCode || !newCouponDiscount) {
                            showNotification('warning', 'يرجى تعبئة رمز الكوبون وقيمته الترويجية.');
                            return;
                          }
                          const newCoupon = {
                            code: newCouponCode.toUpperCase(),
                            discount: newCouponDiscount,
                            type: newCouponType,
                            usageCount: 0,
                            maxUsage: 100,
                            status: 'نشط'
                          };
                          setMarketingCoupons([...marketingCoupons, newCoupon]);
                          setNewCouponCode('');
                          setNewCouponDiscount('');
                          showNotification('success', `تم توليد وحفظ الكود الترويجي ${newCoupon.code} بنجاح في نظام الكتالوجات!`);
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-4 h-4" />
                        حفظ ونشر الكوبون للعملاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 13: Customer Management */}
              {osTab === 'customers' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <span className="text-[10px] font-black text-slate-400 font-mono">LOYAL CUSTOMER LEDGER</span>
                      <h3 className="text-sm font-black text-slate-800">إدارة بيانات وملاحظات العملاء المستفيدين (CRM)</h3>
                    </div>

                    <p className="text-xs text-slate-500">
                      احتفظ ببيانات وملاحظات العملاء لتقديم خدمة حفل زفاف أو مناسبة مخصصة وعالية الدقة وبما يطابق تطلعات المستفيدين.
                    </p>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs">
                        <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                          <tr>
                            <th className="p-3 font-black">العميل</th>
                            <th className="p-3 font-black">رقم الاتصال</th>
                            <th className="p-3 font-black">عدد الحجوزات السابقة</th>
                            <th className="p-3 font-black">إجمالي الإنفاق بالريال</th>
                            <th className="p-3 font-black">الملاحظات التشغيلية والخاصة للعميل</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                          {customerProfiles.map((cust) => (
                            <tr key={cust.id} className="hover:bg-slate-50/50">
                              <td className="p-3 font-extrabold text-slate-800">{cust.name}</td>
                              <td className="p-3 font-mono text-slate-500">{cust.phone}</td>
                              <td className="p-3 font-mono text-slate-600 font-bold text-center">{cust.bookingsCount} مناسبات</td>
                              <td className="p-3 font-mono text-indigo-600 font-black">{formatCurrency(cust.totalSpend)}</td>
                              <td className="p-3 text-slate-500 leading-relaxed max-w-sm">{cust.notes}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Add CRM notes update */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3 mt-2">
                      <h4 className="text-xs font-black text-indigo-700">إضافة أو تحديث ملاحظات العميل الخاصة بالتحضير</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <select
                          value={selectedCustIdForNote}
                          onChange={(e) => setSelectedCustIdForNote(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        >
                          {customerProfiles.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                        <input
                          type="text"
                          placeholder="اكتب ملاحظة التجهيز (مثل: يفضل عصير الليمون والنعناع الطازج في الاستقبال)"
                          value={newCustNote}
                          onChange={(e) => setNewCustNote(e.target.value)}
                          className="p-2 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                      </div>
                      <button
                        onClick={() => {
                          if (!newCustNote) {
                            showNotification('warning', 'يرجى كتابة الملاحظة قبل الحفظ.');
                            return;
                          }
                          const updated = customerProfiles.map(c => c.id === selectedCustIdForNote ? { ...c, notes: c.notes + ' ' + newCustNote } : c);
                          setCustomerProfiles(updated);
                          setNewCustNote('');
                          showNotification('success', 'تم حفظ وتحديث كرت الملاحظات والمواصفات الخاصة بالعميل!');
                        }}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[11px] font-black transition-all cursor-pointer"
                      >
                        حفظ ملاحظات التحضير لكرت العميل
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 14: Notification Center */}
              {osTab === 'notifications' && (
                <div className="space-y-6">
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-50">
                      <button
                        onClick={() => {
                          const cleared = liveNotifications.map(n => ({ ...n, unread: false }));
                          setLiveNotifications(cleared);
                          showNotification('success', 'تم تحديد جميع الإشعارات الفورية كمقروءة.');
                        }}
                        className="text-xs text-indigo-600 font-bold hover:underline"
                      >
                        تحديد الكل كمقروء
                      </button>
                      <h3 className="text-sm font-black text-slate-800">سجل الأحداث والتنبيهات المباشرة للمنشأة</h3>
                    </div>

                    <div className="space-y-2">
                      {liveNotifications.map((n) => (
                        <div key={n.id} className={`p-4 rounded-2xl border transition-all flex items-start gap-3 text-right ${n.unread ? 'bg-indigo-50/50 border-indigo-100' : 'bg-slate-50/40 border-slate-100'}`}>
                          {n.unread && <div className="w-2 h-2 bg-indigo-600 rounded-full mt-1.5 shrink-0 animate-ping"></div>}
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-800 leading-relaxed">{n.text}</p>
                            <span className="text-[9px] text-slate-400 font-mono mt-1 block">{n.time}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Real-time test simulator trigger */}
                    <div className="pt-3 border-t border-slate-50 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-mono">SIMULATION PANEL</span>
                      <button
                        onClick={() => {
                          const newAlert = {
                            id: `NT-${Date.now()}`,
                            type: 'booking',
                            text: 'تم إنشاء حجز جديد رقم BKG-26-0000000015 بقيمة 18,500 ر.س ومطابق لقواعد عدم الازدواجية.',
                            time: 'الآن بالوقت الفعلي',
                            unread: true
                          };
                          setLiveNotifications([newAlert, ...liveNotifications]);
                          showNotification('info', 'تم استقبال إشعار حجز فوري فوري ومطابق في النظام!');
                        }}
                        className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer"
                      >
                        محاكاة استقبال تنبيه حجز فوري جديد
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Domain 15: Inventory and Asset Management */}
              {osTab === 'inventory' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-slate-400 block">إجمالي أصناف المخازن</span>
                      <div className="text-xl font-black text-slate-800">{inventoryItems.length} عِينة</div>
                      <span className="text-[9px] text-slate-400 block mt-1">موزعة على ٢ من الفروع النشطة</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-emerald-600 block">إجمالي الكميات المتوفرة</span>
                      <div className="text-xl font-black text-emerald-600">
                        {inventoryItems.reduce((sum, item) => sum + item.available, 0).toLocaleString()} وحدة
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">جاهزة للصرف والتحضير الفوري</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-indigo-600 block">عهد قيد الصرف والتشغيل</span>
                      <div className="text-xl font-black text-indigo-600">
                        {inventoryItems.reduce((sum, item) => sum + item.inUse, 0).toLocaleString()} وحدة
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">مسلمة للمشرفين في قاعات المناسبات</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-rose-600 block">تنبيهات نقص المخزون</span>
                      <div className="text-xl font-black text-rose-600">
                        {inventoryItems.filter(item => item.status === 'منخفض' || item.status === 'نفذت الكمية').length} أصناف
                      </div>
                      <span className="text-[9px] text-rose-400 block mt-1 animate-pulse font-bold">⚠️ تتطلب إعادة طلب من الموردين</span>
                    </div>
                  </div>

                  {/* Main Action Bar and Filter */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      
                      {/* Filter Controls */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="بحث باسم الصنف أو المعرّف..."
                          value={inventorySearch}
                          onChange={(e) => setInventorySearch(e.target.value)}
                          className="text-xs p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-right w-full sm:w-56"
                        />
                        <select
                          value={inventoryCategory}
                          onChange={(e) => setInventoryCategory(e.target.value)}
                          className="text-xs p-2.5 bg-slate-50 border border-slate-200/80 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-right w-full sm:w-44"
                        >
                          <option value="all">جميع الفئات</option>
                          <option value="أثاث ومفروشات">أثاث ومفروشات</option>
                          <option value="أدوات ضيافة وبوفيه">أدوات ضيافة وبوفيه</option>
                          <option value="أجهزة إلكترونية وصوتيات">أجهزة إلكترونية وصوتيات</option>
                          <option value="مستلزمات مستهلكة">مستلزمات مستهلكة</option>
                        </select>
                      </div>

                      {/* Add Button */}
                      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            setShowAddInventoryForm(!showAddInventoryForm);
                            setShowAddSupplierForm(false);
                            setShowAddSupplyRequestForm(false);
                          }}
                          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 animate-pulse"
                        >
                          <Plus className="w-4 h-4" />
                          <span>تسجيل صنف مخزون جديد</span>
                        </button>
                      </div>
                    </div>

                    {/* Quick Interactive Forms Container */}
                    {showAddInventoryForm && (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <button onClick={() => setShowAddInventoryForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                          <h4 className="text-xs font-black text-indigo-950">تأسيس صنف مخزون / عهدة جديد في النظام</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">اسم الصنف / العهدة</label>
                            <input
                              type="text"
                              value={invWizName}
                              onChange={(e) => setInvWizName(e.target.value)}
                              placeholder="مثال: سماعات لاسلكية إضافية"
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">الفئة التصنيفية</label>
                            <select
                              value={invWizCategory}
                              onChange={(e) => setInvWizCategory(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            >
                              <option value="أثاث ومفروشات">أثاث ومفروشات</option>
                              <option value="أدوات ضيافة وبوفيه">أدوات ضيافة وبوفيه</option>
                              <option value="أجهزة إلكترونية وصوتيات">أجهزة إلكترونية وصوتيات</option>
                              <option value="مستلزمات مستهلكة">مستلزمات مستهلكة</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">الكمية الإجمالية الابتدائية</label>
                            <input
                              type="number"
                              value={invWizTotal}
                              onChange={(e) => setInvWizTotal(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">الفرع المخصص</label>
                            <select
                              value={invWizBranch}
                              onChange={(e) => setInvWizBranch(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            >
                              <option value="فرع الرياض الرئيسي">فرع الرياض الرئيسي</option>
                              <option value="فرع شمال الرياض">فرع شمال الرياض</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">حد إعادة الطلب الآمن (Threshold)</label>
                            <input
                              type="number"
                              value={invWizThreshold}
                              onChange={(e) => setInvWizThreshold(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                            />
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              onClick={() => {
                                if (!invWizName || !invWizTotal) {
                                  showNotification('warning', 'يرجى تعبئة اسم الصنف وتحديد الكمية الابتدائية.');
                                  return;
                                }
                                const total = parseInt(invWizTotal) || 0;
                                const thresh = parseInt(invWizThreshold) || 0;
                                const nextIdNum = inventoryItems.length + 1;
                                const nextId = `ITM-26-${String(nextIdNum).padStart(10, '0')}`;
                                
                                const newItem = {
                                  id: nextId,
                                  name: invWizName,
                                  category: invWizCategory,
                                  total: total,
                                  available: total,
                                  inUse: 0,
                                  threshold: thresh,
                                  branch: invWizBranch,
                                  status: total > thresh ? 'متوفر' : total === 0 ? 'نفذت الكمية' : 'منخفض',
                                  statusColor: total > thresh ? 'emerald' : total === 0 ? 'red' : 'amber'
                                };

                                setInventoryItems([...inventoryItems, newItem]);
                                setShowAddInventoryForm(false);
                                setInvWizName('');
                                setInvWizTotal('50');
                                showNotification('success', `تم حفظ الصنف الجديد ${invWizName} بنجاح ومزامنته بـ BOS!`);
                              }}
                              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                            >
                              <span>تأكيد الإدخال والحفظ بالدفاتر</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stock Table List */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-xs">
                      <table className="w-full text-right text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3.5 text-right font-black">كود الصنف</th>
                            <th className="p-3.5 text-right font-black">اسم الصنف / العهد الميدانية</th>
                            <th className="p-3.5 text-right font-black">الفئة التصنيفية</th>
                            <th className="p-3.5 text-center font-black">الكمية الكلية</th>
                            <th className="p-3.5 text-center font-black">المتوفر بالمستودع</th>
                            <th className="p-3.5 text-center font-black">تحت الصرف والتشغيل</th>
                            <th className="p-3.5 text-right font-black">الفرع المرتبط</th>
                            <th className="p-3.5 text-center font-black">الحالة</th>
                            <th className="p-3.5 text-center font-black">جرد سريع / صرف عهدة</th>
                            <th className="p-3.5 text-left font-black">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {inventoryItems
                            .filter(item => {
                              const matchSearch = item.name.includes(inventorySearch) || item.id.includes(inventorySearch);
                              const matchCat = inventoryCategory === 'all' || item.category === inventoryCategory;
                              return matchSearch && matchCat;
                            })
                            .map((item) => (
                              <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 font-bold text-slate-400 font-mono">{item.id}</td>
                                <td className="p-3.5 font-black text-slate-800">{item.name}</td>
                                <td className="p-3.5 text-slate-500 font-medium">{item.category}</td>
                                <td className="p-3.5 text-center font-mono font-bold text-slate-700">{item.total}</td>
                                <td className="p-3.5 text-center font-mono font-black text-emerald-600">{item.available}</td>
                                <td className="p-3.5 text-center font-mono font-bold text-indigo-600">{item.inUse}</td>
                                <td className="p-3.5 text-slate-500">{item.branch}</td>
                                <td className="p-3.5 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                                    item.statusColor === 'emerald'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : item.statusColor === 'amber'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                                  }`}>
                                    {item.status}
                                  </span>
                                </td>
                                <td className="p-3.5 text-center space-x-1.5 space-x-reverse whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      // Quick plus-10 inventory adjustment
                                      const updated = inventoryItems.map(i => {
                                        if (i.id === item.id) {
                                          const newTot = i.total + 10;
                                          const newAv = i.available + 10;
                                          return {
                                            ...i,
                                            total: newTot,
                                            available: newAv,
                                            status: newTot > i.threshold ? 'متوفر' : 'منخفض',
                                            statusColor: newTot > i.threshold ? 'emerald' : 'amber'
                                          };
                                        }
                                        return i;
                                      });
                                      setInventoryItems(updated);
                                      showNotification('success', `تمت زيادة كمية الصنف ${item.name} بمقدار 10 وحدات بنجاح.`);
                                    }}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-[9px] font-black cursor-pointer transition-all inline-block min-h-[28px]"
                                    title="زيادة الكمية بـ 10 وحدات"
                                  >
                                    +١٠ مستودع 📦
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (item.available === 0) {
                                        showNotification('warning', 'عذراً، هذا الصنف غير متوفر بالمستودع حالياً لصرفه كعهدة.');
                                        return;
                                      }
                                      // Quick release custody to Event (releases 1 item)
                                      const updated = inventoryItems.map(i => {
                                        if (i.id === item.id) {
                                          const newAv = i.available - 1;
                                          const newIn = i.inUse + 1;
                                          return {
                                            ...i,
                                            available: newAv,
                                            inUse: newIn,
                                            status: newAv > i.threshold ? 'متوفر' : newAv === 0 ? 'نفذت الكمية' : 'منخفض',
                                            statusColor: newAv > i.threshold ? 'emerald' : newAv === 0 ? 'red' : 'amber'
                                          };
                                        }
                                        return i;
                                      });
                                      setInventoryItems(updated);
                                      showNotification('info', `تم صرف عهدة (1 وحدة) من ${item.name} وتوجيهها مع المشرف خالد الرويلي إلى صالة التجهيز.`);
                                    }}
                                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[9px] font-black cursor-pointer transition-all inline-block min-h-[28px]"
                                  >
                                    صرف عهدة 👤
                                  </button>
                                </td>
                                <td className="p-3.5 text-left space-x-1.5 space-x-reverse whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setViewingInvItem(item);
                                      setIsViewInvOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                                    title="عرض التفاصيل"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingInvItem(item);
                                      setIsEditInvOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                                    title="تعديل البيانات"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const confirmDelete = window.confirm(`هل أنت متأكد من رغبتك في حذف الصنف "${item.name}" من الدفاتر؟ لا يمكن التراجع.`);
                                      if (confirmDelete) {
                                        const updated = inventoryItems.filter(i => i.id !== item.id);
                                        setInventoryItems(updated);
                                        showNotification('error', `تم حذف الصنف ${item.name} من سجلات المستودع بنجاح.`);
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                                    title="حذف الصنف"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                  {/* Custody Assignment Rules Info Card */}
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl text-right space-y-2 relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-1/4 bg-radial from-emerald-500/10 to-transparent pointer-events-none"></div>
                    <h4 className="text-sm font-black text-emerald-400 flex items-center justify-end gap-1.5">
                      <span>إدارة العهد والتشغيل الميداني لليلة ERP</span>
                      <Boxes className="w-4 h-4" />
                    </h4>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
                      تعتبر كافة اللوازم والتجهيزات (كالسجاد الفاخر، الكراسي المذهبة، ومعدات الضيافة) عُهداً لوجستية تحت مسؤولية منسقي التشغيل والمشرفين. بمجرد صرف العهدة، تظهر مباشرة في حساب المشرف ويتم تتبع استلامها وإعادتها فور إتمام الحفل لتقليل الهدر وضمان الجودة الكاملة.
                    </p>
                  </div>
                </div>
              )}

              {/* Domain 16: Supplier and Vendor Management */}
              {osTab === 'suppliers' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-slate-400 block">الشركاء والموردين المعتمدين</span>
                      <div className="text-xl font-black text-slate-800">{suppliersData.length} شركات</div>
                      <span className="text-[9px] text-emerald-600 block mt-1">✓ خاضعين لاتفاقية مستوى الخدمة SLA</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-indigo-600 block">الطلبات الجارية والنشطة</span>
                      <div className="text-xl font-black text-indigo-600">
                        {supplyRequests.filter(r => r.status !== 'مكتمل ومسلّم').length} طلبات
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">تتبع لوجستي في الوقت الحقيقي</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-amber-600 block">إجمالي ميزانية عقود التوريد</span>
                      <div className="text-xl font-black text-amber-600">
                        {(supplyRequests.reduce((sum, r) => sum + r.cost, 0)).toLocaleString()} ر.س
                      </div>
                      <span className="text-[9px] text-slate-400 block mt-1">تمت تصفيتها بناءً على قواعد المنصة</span>
                    </div>
                    <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-1">
                      <span className="text-[10px] font-black text-emerald-600 block">معدل كفاءة التسليم الميداني</span>
                      <div className="text-xl font-black text-emerald-600">96.5%</div>
                      <span className="text-[9px] text-slate-400 block mt-1">مقاس بناءً على تقييمات التنسيق الفعلي</span>
                    </div>
                  </div>

                  {/* Suppliers List and Main Actions */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      
                      {/* Search and Filters */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        <input
                          type="text"
                          placeholder="بحث باسم الشريك أو الفئة..."
                          value={supplierSearch}
                          onChange={(e) => setSupplierSearch(e.target.value)}
                          className="text-xs p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-right w-full sm:w-56"
                        />
                        <select
                          value={supplierCategory}
                          onChange={(e) => setSupplierCategory(e.target.value)}
                          className="text-xs p-2.5 bg-slate-50 border border-slate-200/60 rounded-xl outline-none focus:bg-white focus:border-indigo-500 text-right w-full sm:w-44"
                        >
                          <option value="all">جميع فئات الخدمات</option>
                          <option value="ضيافة وبوفيه">ضيافة وبوفيه</option>
                          <option value="أجهزة إلكترونية وصوتيات">أجهزة إلكترونية وصوتيات</option>
                          <option value="مستلزمات مستهلكة">مستلزمات مستهلكة</option>
                          <option value="مستندات ومطبوعات">مستندات ومطبوعات</option>
                        </select>
                      </div>

                      {/* Add Supplier / Order Buttons */}
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                        <button
                          onClick={() => {
                            setShowAddSupplyRequestForm(!showAddSupplyRequestForm);
                            setShowAddSupplierForm(false);
                            setShowAddInventoryForm(false);
                          }}
                          className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 min-h-[38px] animate-pulse"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إنشاء طلب توريد / أمر شراء جديد</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowAddSupplierForm(!showAddSupplierForm);
                            setShowAddSupplyRequestForm(false);
                            setShowAddInventoryForm(false);
                          }}
                          className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 min-h-[38px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>تسجيل شريك توريد جديد</span>
                        </button>
                      </div>

                    </div>

                    {/* Interactive Form: Add Supplier */}
                    {showAddSupplierForm && (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <button onClick={() => setShowAddSupplierForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                          <h4 className="text-xs font-black text-indigo-950">تسجيل شريك توريد أو مقدم خدمات خارجي معتمد</h4>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">اسم الشركة / الاسم التجاري للمورد</label>
                            <input
                              type="text"
                              value={supWizName}
                              onChange={(e) => setSupWizName(e.target.value)}
                              placeholder="مثال: مطابخ الجزيرة للمأكولات الملكية"
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">فئة الخدمة الأساسية</label>
                            <select
                              value={supWizCategory}
                              onChange={(e) => setSupWizCategory(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            >
                              <option value="ضيافة وبوفيه">ضيافة وبوفيه</option>
                              <option value="أجهزة إلكترونية وصوتيات">أجهزة إلكترونية وصوتيات</option>
                              <option value="مستلزمات مستهلكة">مستلزمات مستهلكة</option>
                              <option value="مستندات ومطبوعات">مستندات ومطبوعات</option>
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">مسؤول التواصل لدى الشريك</label>
                            <input
                              type="text"
                              value={supWizContact}
                              onChange={(e) => setSupWizContact(e.target.value)}
                              placeholder="مثال: المهندس وائل محمد"
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">رقم الجوال الفعال للربط</label>
                            <input
                              type="text"
                              value={supWizPhone}
                              onChange={(e) => setSupWizPhone(e.target.value)}
                              placeholder="مثال: 0551112223"
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">حالة الامتثال والاعتماد</label>
                            <select
                              value={supWizCompliance}
                              onChange={(e) => setSupWizCompliance(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            >
                              <option value="معتمد رسمياً">معتمد رسمياً (Approved)</option>
                              <option value="قيد المراجعة">قيد المراجعة والتحقق (Pending Review)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex justify-end">
                          <button
                            onClick={() => {
                              if (!supWizName || !supWizPhone || !supWizContact) {
                                showNotification('warning', 'يرجى إدخال اسم الشركة، ومسؤول التواصل، ورقم جوال المورد.');
                                return;
                              }
                              const nextIdNum = suppliersData.length + 1;
                              const nextId = `SUP-${nextIdNum < 10 ? '0' : ''}${nextIdNum}`;

                              const newSup = {
                                id: nextId,
                                name: supWizName,
                                category: supWizCategory,
                                contact: supWizContact,
                                phone: supWizPhone,
                                contracts: 0,
                                volume: '0 ر.س',
                                rating: 5.0,
                                compliance: supWizCompliance,
                                statusColor: supWizCompliance === 'معتمد رسمياً' ? 'emerald' : 'amber'
                              };

                              setSuppliersData([...suppliersData, newSup]);
                              setShowAddSupplierForm(false);
                              setSupWizName('');
                              setSupWizPhone('');
                              setSupWizContact('');
                              showNotification('success', `تم تسجيل المورد ${supWizName} شريكاً معتمداً بالمنصة وتم تفعيل ملف الـ SLA الخاص به.`);
                            }}
                            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer min-h-[38px]"
                          >
                            حفظ وتسجيل ملف المورد بالدفاتر
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Interactive Form: Create Supply Request */}
                    {showAddSupplyRequestForm && (
                      <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 animate-in slide-in-from-top duration-300">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                          <button onClick={() => setShowAddSupplyRequestForm(false)} className="text-slate-400 hover:text-slate-600">
                            <X className="w-4 h-4" />
                          </button>
                          <h4 className="text-xs font-black text-indigo-950">إنشاء وتعميد أمر توريد / شراء خدمات لوجستية (SLA Order)</h4>
                        </div>
                        
                        {/* Information box on rules */}
                        <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-right space-y-1 text-[11px] text-amber-900 leading-relaxed">
                          <strong>💡 التوليد التلقائي لرموز مخرجات سلسلة التوريد (حسب قواعد ليلة):</strong>
                          <p>
                            سيقوم محرك ERP تلقائياً بتوليد رقم طلب الخدمة بالصيغة المعتمدة للمنصة: <span className="font-mono font-black">SRV-26-XXXXXXXXXX</span> (مثل رقم طلب خدمات متسلسل)، مع تسجيل مصروفات مالية بالرمز <span className="font-mono font-black">EXP-26-XXXXXXXXXX</span> لضمان دقة التقارير.
                          </p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">اختيار المورد المعتمد</label>
                            <select
                              value={newReqSupplierId}
                              onChange={(e) => setNewReqSupplierId(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            >
                              {suppliersData.map(sup => (
                                <option key={sup.id} value={sup.id}>{sup.name} ({sup.category})</option>
                              ))}
                            </select>
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">وصف الخدمة / الأصناف المطلوبة بدقة</label>
                            <input
                              type="text"
                              value={newReqItem}
                              onChange={(e) => setNewReqItem(e.target.value)}
                              placeholder="مثال: توريد زهور طبيعية لممر العرسان ومحيط الكوشة"
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">الكمية المطلوبة</label>
                            <input
                              type="number"
                              value={newReqQty}
                              onChange={(e) => setNewReqQty(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-right">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">التكلفة المالية المتفق عليها (ر.س)</label>
                            <input
                              type="number"
                              value={newReqCost}
                              onChange={(e) => setNewReqCost(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-600 block">الفرع المطلوب التوريد إليه</label>
                            <select
                              value={newReqBranch}
                              onChange={(e) => setNewReqBranch(e.target.value)}
                              className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                            >
                              <option value="فرع الرياض الرئيسي">فرع الرياض الرئيسي</option>
                              <option value="فرع شمال الرياض">فرع شمال الرياض</option>
                            </select>
                          </div>
                          <div className="flex items-end justify-end">
                            <button
                              onClick={() => {
                                if (!newReqItem || !newReqCost) {
                                  showNotification('warning', 'يرجى كتابة وصف الخدمة وتحديد التكلفة المالية لأمر التوريد.');
                                  return;
                                }
                                
                                const nextOrderNum = supplyRequests.length + 1;
                                // Zero pad next order number to 10 digits as per instructions
                                const paddedOrderNum = String(nextOrderNum).padStart(10, '0');
                                const generatedSrvId = `SRV-26-${paddedOrderNum}`;
                                const generatedExpId = `EXP-26-${paddedOrderNum}`;

                                const selectedSup = suppliersData.find(s => s.id === newReqSupplierId);
                                const costNum = parseFloat(newReqCost) || 0;

                                const newOrder = {
                                  id: generatedSrvId,
                                  supplier: selectedSup ? selectedSup.name : 'مورد معتمد',
                                  item: newReqItem,
                                  qty: parseInt(newReqQty) || 1,
                                  branch: newReqBranch,
                                  cost: costNum,
                                  status: 'تحت التنفيذ',
                                  date: '2026-07-21'
                                };

                                // Append to supply requests
                                setSupplyRequests([newOrder, ...supplyRequests]);

                                // Also add to notifications
                                const newAlert = {
                                  id: `NT-SUP-${Date.now()}`,
                                  type: 'payment',
                                  text: `تم إصدار أمر توريد معتمد برقم ${generatedSrvId} ومصروف مالي ${generatedExpId} بقيمة ${costNum.toLocaleString()} ر.س لشريكنا: ${selectedSup?.name}.`,
                                  time: 'الآن بالوقت الفعلي',
                                  unread: true
                                };
                                setLiveNotifications([newAlert, ...liveNotifications]);

                                // Clean up
                                setShowAddSupplyRequestForm(false);
                                setNewReqItem('');
                                setNewReqCost('1000');
                                showNotification('success', `تم توليد التعميد وتأكيده بنجاح! رقم طلب الخدمة: ${generatedSrvId} ورقم المصروف: ${generatedExpId}`);
                              }}
                              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 min-h-[38px]"
                            >
                              <span>توليد وتعميد أمر الشراء والـ SLA</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Suppliers Data Table */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-xs">
                      <table className="w-full text-right text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3.5 text-right font-black">كود المورد</th>
                            <th className="p-3.5 text-right font-black">اسم شريك التوريد</th>
                            <th className="p-3.5 text-right font-black">نوع التوريد / التخصص</th>
                            <th className="p-3.5 text-right font-black">مسؤول الاتصال والتواصل</th>
                            <th className="p-3.5 text-center font-black">العقود النشطة</th>
                            <th className="p-3.5 text-center font-black">حجم التوريد الشهري</th>
                            <th className="p-3.5 text-center font-black">تقييم الأداء</th>
                            <th className="p-3.5 text-center font-black">حالة الامتثال بالمنصة</th>
                            <th className="p-3.5 text-left font-black">العمليات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {suppliersData
                            .filter(sup => {
                              const matchSearch = sup.name.includes(supplierSearch) || sup.id.includes(supplierSearch);
                              const matchCat = supplierCategory === 'all' || sup.category === supplierCategory;
                              return matchSearch && matchCat;
                            })
                            .map((sup) => (
                              <tr key={sup.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-3.5 font-bold text-slate-400 font-mono">{sup.id}</td>
                                <td className="p-3.5 font-black text-slate-800">{sup.name}</td>
                                <td className="p-3.5 text-slate-500 font-medium">{sup.category}</td>
                                <td className="p-3.5">
                                  <div className="text-right">
                                    <span className="font-bold text-slate-700 block">{sup.contact}</span>
                                    <span className="font-mono text-[10px] text-slate-400 mt-0.5 block">{sup.phone}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 text-center font-mono font-bold text-slate-600">{sup.contracts} عقود</td>
                                <td className="p-3.5 text-center font-mono font-black text-slate-700">{sup.volume}</td>
                                <td className="p-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                                    <span className="font-mono font-black text-slate-700">{sup.rating}</span>
                                  </div>
                                </td>
                                <td className="p-3.5 text-center">
                                  <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                                    sup.compliance === 'معتمد رسمياً'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-amber-50 text-amber-700 border-amber-200'
                                  }`}>
                                    {sup.compliance}
                                  </span>
                                </td>
                                <td className="p-3.5 text-left space-x-1.5 space-x-reverse whitespace-nowrap">
                                  <button
                                    onClick={() => {
                                      setViewingSupplier(sup);
                                      setIsViewSupplierOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-indigo-600 bg-slate-50 hover:bg-indigo-50 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                                    title="عرض الملف والتراخيص"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingSupplier(sup);
                                      setIsEditSupplierOpen(true);
                                    }}
                                    className="p-1 text-slate-500 hover:text-amber-600 bg-slate-50 hover:bg-amber-50 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                                    title="تعديل ملف المورد"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      const confirmDelete = window.confirm(`هل أنت متأكد من إلغاء تعاقد وحذف المورد "${sup.name}"؟`);
                                      if (confirmDelete) {
                                        const updated = suppliersData.filter(s => s.id !== sup.id);
                                        setSuppliersData(updated);
                                        showNotification('error', `تم إلغاء تعاقد وحذف المورد ${sup.name} من النظام.`);
                                      }
                                    }}
                                    className="p-1 text-slate-500 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 rounded-lg inline-flex items-center justify-center transition-all cursor-pointer"
                                    title="حذف المورد"
                                  >
                                    <Trash className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                  </div>

                  {/* Supply Orders Log Table */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="border-b border-slate-50 pb-3 text-right">
                      <h4 className="text-xs font-black text-slate-800">سجل طلبات التوريد الميدانية وعقود الموردين (SLA Supply Orders Log)</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">تتبع عمليات توريد الخدمات المساندة المتوافقة مع معايير جودة ليلة</p>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100 shadow-xs">
                      <table className="w-full text-right text-xs border-collapse">
                        <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                          <tr>
                            <th className="p-3.5 text-right font-black">رقم طلب الخدمة الموحد</th>
                            <th className="p-3.5 text-right font-black">اسم الشريك المورد</th>
                            <th className="p-3.5 text-right font-black">وصف أصناف التوريد</th>
                            <th className="p-3.5 text-center font-black">الكمية</th>
                            <th className="p-3.5 text-right font-black">الفرع</th>
                            <th className="p-3.5 text-center font-black">التكلفة الإجمالية</th>
                            <th className="p-3.5 text-center font-black">التاريخ</th>
                            <th className="p-3.5 text-center font-black">حالة التوريد</th>
                            <th className="p-3.5 text-left font-black">الإجراء اللوجستي</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                          {supplyRequests.map((req) => (
                            <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3.5 font-bold text-slate-800 font-mono">{req.id}</td>
                              <td className="p-3.5 font-black text-slate-800">{req.supplier}</td>
                              <td className="p-3.5 text-slate-600 font-medium">{req.item}</td>
                              <td className="p-3.5 text-center font-mono font-bold text-slate-700">{req.qty}</td>
                              <td className="p-3.5 text-slate-500">{req.branch}</td>
                              <td className="p-3.5 text-center font-mono font-black text-slate-800">{req.cost.toLocaleString()} ر.س</td>
                              <td className="p-3.5 text-center font-mono text-slate-500">{req.date}</td>
                              <td className="p-3.5 text-center">
                                <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                                  req.status === 'مكتمل ومسلّم'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : req.status === 'تحت التنفيذ'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                }`}>
                                  {req.status}
                                </span>
                              </td>
                              <td className="p-3.5 text-left whitespace-nowrap">
                                {req.status !== 'مكتمل ومسلّم' && (
                                  <button
                                    onClick={() => {
                                      const updated = supplyRequests.map(r => r.id === req.id ? { ...r, status: 'مكتمل ومسلّم' } : r);
                                      setSupplyRequests(updated);
                                      showNotification('success', `تم تعيين طلب التوريد الموحد ${req.id} كمكتمل ومسَلّم للموقع بنجاح!`);
                                    }}
                                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[9px] font-black cursor-pointer transition-all inline-block min-h-[28px]"
                                  >
                                    تأكيد الاستلام الميداني ✓
                                  </button>
                                )}
                                {req.status === 'مكتمل ومسلّم' && (
                                  <span className="text-[10px] text-slate-400 font-bold">✓ مسلّم بالكامل للمنشأة</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                </div>
              )}


              {/* osTab === 'stats' -> Integrated Analytics and Stats View */}
              {osTab === 'stats' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                        {/* 1. Header with custom filters */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Activity className="w-6 h-6 text-indigo-500 animate-pulse" />
            لوحة الإحصائيات والأداء (مزود الخدمة)
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            متابعة تدفق الأرباح، الحجوزات، والطلبات الخاصة بـ <span className="font-bold text-indigo-600">({currentProviderName})</span> بالوقت الحقيقي.
          </p>
        </div>

        {/* Period Filter Panel */}
        <div className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100 w-full lg:w-auto">
          {/* Calendar Picker trigger */}
          <div className="flex rounded-xl bg-white p-1 shadow-sm border border-slate-100 shrink-0">
            <button
              onClick={() => setDashboardPeriod('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardPeriod === 'monthly' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              شهرياً
            </button>
            <button
              onClick={() => setDashboardPeriod('yearly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardPeriod === 'yearly' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              سنوياً
            </button>
            <button
              onClick={() => setDashboardPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardPeriod === 'custom' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              مخصّص
            </button>
            <button
              onClick={() => setDashboardPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${dashboardPeriod === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-500 hover:text-slate-800'}`}
            >
              تراكمي
            </button>
          </div>

          {/* Dynamic Select elements based on active period filter */}
          {dashboardPeriod === 'monthly' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <select 
                value={selectedDashboardYear} 
                onChange={(e) => setSelectedDashboardYear(e.target.value)}
                className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-amber-500"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <select 
                value={selectedDashboardMonth} 
                onChange={(e) => setSelectedDashboardMonth(e.target.value)}
                className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-amber-500"
              >
                <option value="01">يناير (01)</option>
                <option value="02">فبراير (02)</option>
                <option value="03">مارس (03)</option>
                <option value="04">أبريل (04)</option>
                <option value="05">مايو (05)</option>
                <option value="06">يونيو (06)</option>
                <option value="07">يوليو (07)</option>
                <option value="08">أغسطس (08)</option>
                <option value="09">سبتمبر (09)</option>
                <option value="10">أكتوبر (10)</option>
                <option value="11">نوفمبر (11)</option>
                <option value="12">ديسمبر (12)</option>
              </select>
            </div>
          )}

          {dashboardPeriod === 'yearly' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <select 
                value={selectedDashboardYear} 
                onChange={(e) => setSelectedDashboardYear(e.target.value)}
                className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-amber-500"
              >
                <option value="2026">2026</option>
                <option value="2025">2025</option>
              </select>
              <select 
                value={yearlyPeriodType} 
                onChange={(e) => setYearlyPeriodType(e.target.value)}
                className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none cursor-pointer focus:border-amber-500"
              >
                <option value="gregorian">سنة ميلادية</option>
                <option value="academic">سنة دراسية (سبتمبر - أغسطس)</option>
                <option value="zakat">سنة زكوية وهجرية (10 مارس)</option>
              </select>
            </div>
          )}

          {dashboardPeriod === 'custom' && (
            <div className="flex items-center gap-1.5 shrink-0">
              <input 
                type="date" 
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
              />
              <span className="text-slate-400 text-xs">إلى</span>
              <input 
                type="date" 
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="p-1 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-amber-500"
              />
            </div>
          )}
        </div>
      </div>

                  
      {/* 2. Visual KPI Banners Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Main Platform Revenue */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-emerald-500 transition-all cursor-pointer group">
          <div className="space-y-2 text-right">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider font-sans">الأرباح الصافية المحققة</span>
            <h3 className="text-2xl font-black text-slate-800 group-hover:text-emerald-600 transition-colors">
              {formatCurrency(totalRevenuePeriod)}
            </h3>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
              <span className="text-emerald-500 font-extrabold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> {comp.revGrowthRate}%
              </span>
              مقارنة بالفترة السابقة
            </p>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
            <Wallet className="w-6 h-6 animate-pulse" />
          </div>
        </div>

        {/* Card 2: Bookings quantity */}
        <div 
          onClick={() => setActiveSection('bookings')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-indigo-500 transition-all cursor-pointer group"
        >
          <div className="space-y-2 text-right">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider font-sans">عدد الحجوزات المستلمة</span>
            <h3 className="text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">
              {totalBookingsPeriod} حجز
            </h3>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
              <span className={comp.countGrowthRate >= 0 ? "text-emerald-500 font-extrabold" : "text-rose-500 font-extrabold"}>
                {comp.countGrowthRate}%
              </span>
              تغير في حجم العمليات
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Providers and institutions */}
        <div 
          onClick={() => setActiveSection('halls')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-purple-500 transition-all cursor-pointer group"
        >
          <div className="space-y-2 text-right">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider font-sans">إجمالي وحدات القاعات الخاصة بك</span>
            <h3 className="text-2xl font-black text-slate-800 group-hover:text-purple-600 transition-colors">
              {myHalls.length} قاعة معتمدة
            </h3>
            <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 justify-end">
              <Eye className="w-3 h-3" /> انقر للتحكم بالقاعات وتعديل الأسعار
            </p>
          </div>
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Campaigns or Marketing request */}
        <div 
          onClick={() => setActiveSection('marketing')}
          className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between hover:border-amber-500 transition-all cursor-pointer group"
        >
          <div className="space-y-2 text-right">
            <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider font-sans">الحملات التسويقية والطلب</span>
            <h3 className="text-2xl font-black text-slate-800 group-hover:text-amber-600 transition-colors">
              {totalCampaignsPeriod} طلب حملة
            </h3>
            <p className="text-[10px] text-slate-400 font-bold justify-end">
              تتبع حالة طلبات الحملات التسويقية الخاصة بك
            </p>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
        </div>
      </div>


                        {/* Daily Performance Summary Section using Recharts */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-6 text-right font-sans">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-4 border-b border-slate-50 gap-4">
          <div>
            <h3 className="text-base font-black text-slate-800 flex items-center gap-2 justify-end">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              التحليل البياني اليومي لأداء الحجوزات والخدمات (آخر 7 أيام)
            </h3>
            <p className="text-[11px] text-slate-400 mt-1 font-bold">
              متابعة فورية ومباشرة لمؤشرات المبيعات ونسب الإشغال والطلب اليومي للمنشأة الحالية فقط.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-2xl text-[10px] font-black text-slate-500 flex items-center gap-1.5 leading-none shrink-0" dir="rtl">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>تحديث فوري لبيانات المزود: {currentProviderName}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Halls & Bookings Performance Chart */}
          <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-black text-slate-400 font-mono">HALLS & BOOKINGS</span>
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-500" />
                أداء قاعات الأفراح وحركة الحجوزات
              </h4>
            </div>

            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyPerfData} margin={{ top: 10, right: 5, bottom: 0, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `${val.toLocaleString('en-US')}`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#10b981', fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'إجمالي المبيعات') return [`${value.toLocaleString('ar-SA')} ر.س`, name];
                      if (name === 'نسبة الإشغال') return [`${value}%`, name];
                      return [`${value} حجز`, name];
                    }}
                  />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  
                  <Area yAxisId="left" type="monotone" name="إجمالي المبيعات" dataKey="bookingsSales" fill="#ebf5ff" stroke="#3b82f6" strokeWidth={2} />
                  <Bar yAxisId="left" name="عدد الحجوزات" dataKey="bookingsCount" fill="#93c5fd" radius={[4, 4, 0, 0]} barSize={16} />
                  <Line yAxisId="right" type="monotone" name="نسبة الإشغال" dataKey="hallOccupancyRate" stroke="#10b981" strokeWidth={2.5} dot={{ fill: '#10b981', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Micro metrics card */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 block">إجمالي مبيعات الفترة</span>
                <span className="text-xs font-black text-slate-700 block font-mono">
                  {dailyPerfData.reduce((sum, r) => sum + r.bookingsSales, 0).toLocaleString('ar-SA')} ر.س
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 block">متوسط الإشغال اليومي</span>
                <span className="text-xs font-black text-emerald-600 block font-mono">
                  {Math.round(dailyPerfData.reduce((sum, r) => sum + r.hallOccupancyRate, 0) / dailyPerfData.length)}%
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 block">أعلى إنتاجية يومية</span>
                <span className="text-xs font-black text-blue-600 block font-mono">
                  {Math.max(...dailyPerfData.map(r => r.bookingsCount))} حجز/يوم
                </span>
              </div>
            </div>
          </div>

          {/* Support Services & Orders Performance Chart */}
          <div className="bg-slate-50/40 p-5 rounded-2xl border border-slate-100 space-y-4">
            <div className="flex justify-between items-center pb-1">
              <span className="text-[10px] font-black text-slate-400 font-mono">SERVICES & ORDERS</span>
              <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-500" />
                أداء الخدمات المساندة وطلبات الخدمة
              </h4>
            </div>

            <div className="h-64 w-full" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={dailyPerfData} margin={{ top: 10, right: 5, bottom: 0, left: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="dayName" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }} />
                  <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} tickFormatter={(val) => `${val.toLocaleString('en-US')}`} />
                  <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#a855f7', fontSize: 10 }} tickFormatter={(val) => `${val}%`} />
                  <RechartsTooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', direction: 'rtl' }}
                    formatter={(value: any, name: any) => {
                      if (name === 'مبيعات الخدمات') return [`${value.toLocaleString('ar-SA')} ر.س`, name];
                      if (name === 'معدل التشغيل') return [`${value}%`, name];
                      return [`${value} طلب`, name];
                    }}
                  />
                  <Legend verticalAlign="top" height={32} wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                  
                  <Area yAxisId="left" type="monotone" name="مبيعات الخدمات" dataKey="ordersSales" fill="#f3e8ff" stroke="#a855f7" strokeWidth={2} />
                  <Bar yAxisId="left" name="عدد الطلبات" dataKey="ordersCount" fill="#d8b4fe" radius={[4, 4, 0, 0]} barSize={16} />
                  <Line yAxisId="right" type="monotone" name="معدل التشغيل" dataKey="serviceOccupancyRate" stroke="#d946ef" strokeWidth={2.5} dot={{ fill: '#d946ef', r: 3 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Micro metrics card */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 block">إجمالي مبيعات الخدمات</span>
                <span className="text-xs font-black text-slate-700 block font-mono">
                  {dailyPerfData.reduce((sum, r) => sum + r.ordersSales, 0).toLocaleString('ar-SA')} ر.س
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 block">معدل تشغيل الخدمات</span>
                <span className="text-xs font-black text-fuchsia-600 block font-mono">
                  {Math.round(dailyPerfData.reduce((sum, r) => sum + r.serviceOccupancyRate, 0) / dailyPerfData.length)}%
                </span>
              </div>
              <div className="bg-white p-2 rounded-xl border border-slate-100 text-center space-y-0.5">
                <span className="text-[9px] font-bold text-slate-400 block">إجمالي طلبات الخدمات</span>
                <span className="text-xs font-black text-purple-600 block font-mono">
                  {dailyPerfData.reduce((sum, r) => sum + r.ordersCount, 0)} طلب
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Col: Latest bookings list */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                <div>
                  <h3 className="font-bold text-slate-800 text-base text-right">📋 آخر الحجوزات المستلمة لقاعاتك</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 text-right">سجل عمليات السداد والحجوزات الأخيرة المستلمة لقاعاتك المعتمدة.</p>
                </div>
                <button 
                  onClick={() => setActiveSection('bookings')}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black transition-all flex items-center gap-1"
                >
                  عرض سجل الكل ←
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-right text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
                    <tr>
                      <th className="p-3">رقم الحجز</th>
                      <th className="p-3">العميل</th>
                      <th className="p-3">القاعة</th>
                      <th className="p-3">التاريخ</th>
                      <th className="p-3">المبلغ</th>
                      <th className="p-3 text-left">الحالة</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-50 bg-white">
                    {myBookings.slice(0, 5).map((booking) => (
                      <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-500">{booking.id}</td>
                        <td className="p-3 font-black text-slate-800">{booking.clientName}</td>
                        <td className="p-3 text-slate-600">{booking.hallName}</td>
                        <td className="p-3 text-slate-500 font-mono">{booking.date}</td>
                        <td className="p-3 font-bold text-slate-700">{formatCurrency(booking.totalPrice)}</td>
                        <td className="p-3 text-left">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black inline-block ${
                            booking.status === 'معتمد' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            booking.status === 'معلق' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {booking.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                {/* Latest Bookings are in the card above */}
              </div>
              <div className="lg:col-span-1">
                              <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
              <div className="pb-2 border-b border-slate-50">
                <h3 className="font-bold text-slate-800 text-base text-right">🔊 حملاتك وعروضك النشطة</h3>
                <p className="text-[11px] text-slate-400 mt-0.5 text-right">حملات التسويق والإعلانات التي تم طلبها للمنشأة.</p>
              </div>

              <div className="space-y-3.5">
                {myCampaignsData.length === 0 ? (
                  <div className="text-center p-8 text-slate-400 font-bold text-xs animate-pulse">لا توجد حملات نشطة لمؤسستك في هذه الفترة.</div>
                ) : (
                  myCampaignsData.slice(0, 4).map((c: any) => (
                    <div key={c.id} className="p-3.5 bg-slate-50/60 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all flex items-start gap-3 justify-between">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                          <Megaphone className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 text-right">
                          <h4 className="text-xs font-bold text-slate-700 truncate">{c.title}</h4>
                          <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1 font-mono justify-end">
                            <span>الميزانية:</span>
                            <span className="font-bold text-slate-800">{formatCurrency(c.budget)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0 text-left">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[9px] font-black ${c.status === 'نشطة' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500'}`}>
                          {c.status || 'نشطة'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    )}


              {/* osTab === 'ops_center' -> Integrated Operations Center View */}
              {osTab === 'ops_center' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <OperationsCenter
                    currentProviderName={currentProviderName}
                    currentUserName={currentUserName}
                    myBookings={myBookings}
                    mySupportRequests={mySupportRequests}
                    showNotification={showNotification}
                  />
                </div>
              )}

              {/* osTab === 'growth' -> Integrated Growth Charts View */}
              {osTab === 'growth' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
              <div className="bg-gradient-to-br from-emerald-600 to-teal-500 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden text-right">
                <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <h4 className="text-xs font-bold text-emerald-100 uppercase tracking-wider">معدل نمو أرباح منشأتك</h4>
                <p className="text-3xl font-black mt-2">{formatCurrency(comp.currentRevenue)}</p>
                <div className="flex items-center gap-1.5 mt-3 text-xs bg-white/10 w-fit px-2.5 py-1 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-emerald-300" />
                  <span className="font-bold text-emerald-100">
                    {comp.revGrowthRate >= 0 ? '+' : ''}{comp.revGrowthRate}% مقارنة بالفترة السابقة
                  </span>
                </div>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-indigo-500 text-white p-5 rounded-2xl shadow-sm relative overflow-hidden text-right">
                <div className="absolute right-0 bottom-0 translate-x-1/4 translate-y-1/4 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none"></div>
                <h4 className="text-xs font-bold text-blue-100 uppercase tracking-wider">نمو عدد حجوزات قاعاتك</h4>
                <p className="text-3xl font-black mt-2">{comp.currentCount} حجز</p>
                <div className="flex items-center gap-1.5 mt-3 text-xs bg-white/10 w-fit px-2.5 py-1 rounded-xl">
                  <TrendingUp className="w-4 h-4 text-blue-300" />
                  <span className="font-bold text-blue-100">
                    {comp.countGrowthRate >= 0 ? '+' : ''}{comp.countGrowthRate}% بالمعيار الإجمالي
                  </span>
                </div>

                </div>                                <div className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm flex flex-col justify-between text-right">
                <div>
                  <h4 className="text-xs font-bold text-slate-400">معيار المقارنة النشط</h4>
                  <p className="text-sm font-extrabold text-slate-700 mt-1">{comp.label}</p>
                  <p className="text-xs text-slate-400 mt-1">تتم المقارنة تلقائياً بناء على الفترة الزمنية المحددة بالخيارات العليا.</p>
                </div>
                <div className="text-xs text-slate-600 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl font-bold w-full text-center mt-3">
                  تحليلات دقيقة لأداء قاعاتك بالوقت الحقيقي.
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Chart 1: MoM Growth rate */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-right font-sans">
                <div className="mb-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base justify-end">
                    <TrendingUp className="w-5 h-5 text-blue-500 animate-pulse" />
                    تحليل حركة حجوزات القاعات ونسب النمو MoM ({selectedDashboardYear})
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-sans">عدد الحجوزات الشهري مع منحنى نسب التغير MoM التراكمية لقاعاتك.</p>
                </div>

                <div className="h-80 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={growthData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                      <YAxis yAxisId="left" label={{ value: 'حجم الحجوزات', angle: -90, position: 'insideLeft', y: 10, style: { fill: '#3b82f6', fontSize: '11px', fontWeight: 'bold' } }} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'معدل النمو (%)', angle: 90, position: 'insideRight', y: 10, style: { fill: '#10b981', fontSize: '11px', fontWeight: 'bold' } }} axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(v) => `${v}%`} />
                      <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      <Bar yAxisId="left" name="عدد العمليات" dataKey="count" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={22} />
                      <Line yAxisId="right" name="معدل النمو (%)" type="monotone" dataKey="growthRate" stroke="#10b981" strokeWidth={3} dot={{ fill: '#10b981', r: 4 }} activeDot={{ r: 6 }} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Chart 2: Profit Trend comparison */}
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-right font-sans">
                <div className="mb-6">
                  <h4 className="font-bold text-slate-800 flex items-center gap-2 text-sm md:text-base justify-end">
                    <Activity className="w-5 h-5 text-indigo-500 animate-pulse" />
                    مقارنة صافي الأرباح والإيرادات للفترة الحالية vs السابقة
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 font-sans">تتبع حركة تدفق الإيرادات لتقييم كفاءة وموثوقية تشغيل عروضك.</p>
                </div>

                <div className="h-80 w-full" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={compChartData} margin={{ top: 10, right: 10, bottom: 0, left: 10 }}>
                      <defs>
                        <linearGradient id="colorCurrentPeriod" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorPrevPeriod" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#64748b" stopOpacity={0.2}/>
                          <stop offset="95%" stopColor="#64748b" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 11}} tickFormatter={(value) => `${value.toLocaleString()}`} />
                      <RechartsTooltip contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '12px' }} />
                      <Area type="monotone" name="الأرباح الحالية (SAR)" dataKey="الفترة الحالية" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCurrentPeriod)" />
                      <Area type="monotone" name="الأرباح السابقة (SAR)" dataKey="الفترة السابقة" stroke="#94a3b8" strokeWidth={2} fillOpacity={1} fill="url(#colorPrevPeriod)" strokeDasharray="4 4" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

            </div>
          </div>
        </div>
      )}

      {isViewSupplierOpen && viewingSupplier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-right space-y-4 font-sans">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <button 
                  onClick={() => {
                    setIsViewSupplierOpen(false);
                    setViewingSupplier(null);
                  }}
                  className="text-slate-400 hover:text-slate-600 font-bold text-lg bg-slate-100 hover:bg-slate-200 rounded-full w-7 h-7 flex items-center justify-center cursor-pointer transition-all"
                >
                  ×
                </button>
                <div className="text-right">
                        <h4 className="font-black text-slate-900 text-sm">الملف التعاقدي للشريك المورد</h4>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">{viewingSupplier.id}</p>
                      </div>
                    </div>

                    <div className="space-y-4 text-xs">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex justify-between items-start">
                          <span className={`px-2.5 py-1 rounded-full text-[9px] font-black border ${
                            viewingSupplier.compliance === 'معتمد رسمياً'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {viewingSupplier.compliance}
                          </span>
                          <div className="text-right">
                            <span className="text-slate-400 text-[10px] block">الاسم الرسمي لشريك الخدمات المكملة:</span>
                            <span className="font-black text-slate-800 text-sm block mt-0.5">{viewingSupplier.name}</span>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-right">
                        <div>
                          <span className="text-slate-400 text-[10px] block">نوع التخصّص والمجال الأساسي:</span>
                          <span className="font-bold text-slate-700 block mt-1">{viewingSupplier.category}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">رقم السجل التجاري / الضريبي:</span>
                          <span className="font-mono font-bold text-slate-700 block mt-1">{viewingSupplier.taxId || '310294829100003'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">مسؤول التنسيق المباشر:</span>
                          <span className="font-bold text-slate-700 block mt-1">{viewingSupplier.contact}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">رقم جوال الربط السريع:</span>
                          <span className="font-mono font-bold text-slate-700 block mt-1">{viewingSupplier.phone}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-[10px] block">العنوان الجغرافي المسجل:</span>
                          <span className="font-semibold text-slate-700 block mt-1">{viewingSupplier.address || 'الرياض - طريق التخصصي'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 text-[10px] block">رقم الحساب البنكي للتسويات (IBAN):</span>
                          <span className="font-mono font-bold text-slate-800 block mt-1 bg-slate-50 p-2 rounded-lg border border-slate-100 text-center text-[10px]">{viewingSupplier.iban || 'SA8240000000111122223333'}</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 grid grid-cols-2 gap-3 text-center">
                        <div className="border-l border-slate-200">
                          <span className="text-slate-400 text-[10px] block">حجم أوامر التوريد</span>
                          <span className="text-base font-black text-indigo-700 block mt-1 font-mono">{viewingSupplier.volume || '0 ر.س'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[10px] block">تقييم الالتزام SLA</span>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-base font-black text-slate-800 font-mono">{viewingSupplier.rating || 5.0} / ٥</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        setIsViewSupplierOpen(false);
                        setEditingSupplier(viewingSupplier);
                        setIsEditSupplierOpen(true);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      تعديل ملف الشريك
                    </button>
                    <button
                      onClick={() => {
                        setIsViewSupplierOpen(false);
                        setViewingSupplier(null);
                      }}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      إغلاق
                    </button>
                  </div>
                </div>
              </div>
            )}

            

{/* Edit Supplier Modal */}
            {isEditSupplierOpen && editingSupplier && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col justify-between animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 text-right space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                      <button 
                        onClick={() => {
                          setIsEditSupplierOpen(false);
                          setEditingSupplier(null);
                        }}
                        className="w-8 h-8 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full flex items-center justify-center transition-all cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="text-right">
                        <h4 className="font-black text-slate-900 text-sm">تعديل ملف الشريك المورد</h4>
                        <p className="text-[10px] text-slate-400 font-bold font-mono">{editingSupplier.id}</p>
                      </div>
                    </div>

                    <div className="space-y-3.5 text-xs">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 block">اسم شريك التوريد الرسمي *</label>
                        <input
                          type="text"
                          value={editingSupplier.name}
                          onChange={(e) => setEditingSupplier({ ...editingSupplier, name: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-bold"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-right">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 block">نوع التخصص والمجال</label>
                          <select
                            value={editingSupplier.category}
                            onChange={(e) => setEditingSupplier({ ...editingSupplier, category: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                          >
                            <option value="ضيافة وبوفيه">ضيافة وبوفيه</option>
                            <option value="أجهزة إلكترونية وصوتيات">أجهزة إلكترونية وصوتيات</option>
                            <option value="مستلزمات مستهلكة">مستلزمات مستهلكة</option>
                            <option value="مستندات ومطبوعات">مستندات ومطبوعات</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 block">حالة الامتثال والاعتماد بالمنصة</label>
                          <select
                            value={editingSupplier.compliance}
                            onChange={(e) => setEditingSupplier({ 
                              ...editingSupplier, 
                              compliance: e.target.value,
                              statusColor: e.target.value === 'معتمد رسمياً' ? 'emerald' : 'amber'
                            })}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                          >
                            <option value="معتمد رسمياً">معتمد رسمياً (Approved)</option>
                            <option value="قيد المراجعة">قيد المراجعة والتحقق (Pending Review)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-right">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 block">المسؤول المباشر للتواصل *</label>
                          <input
                            type="text"
                            value={editingSupplier.contact}
                            onChange={(e) => setEditingSupplier({ ...editingSupplier, contact: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 block">جوال التواصل الرئيسي *</label>
                          <input
                            type="text"
                            value={editingSupplier.phone}
                            onChange={(e) => setEditingSupplier({ ...editingSupplier, phone: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-right">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 block">الرقم الضريبي / السجل التجاري</label>
                          <input
                            type="text"
                            value={editingSupplier.taxId || ''}
                            onChange={(e) => setEditingSupplier({ ...editingSupplier, taxId: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black text-slate-600 block">الحساب البنكي (IBAN)</label>
                          <input
                            type="text"
                            value={editingSupplier.iban || ''}
                            onChange={(e) => setEditingSupplier({ ...editingSupplier, iban: e.target.value })}
                            className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right font-mono"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-600 block">العنوان والموقع التجاري</label>
                        <input
                          type="text"
                          value={editingSupplier.address || ''}
                          onChange={(e) => setEditingSupplier({ ...editingSupplier, address: e.target.value })}
                          className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-xs outline-none text-right"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-2 justify-end">
                    <button
                      onClick={() => {
                        if (!editingSupplier.name || !editingSupplier.contact || !editingSupplier.phone) {
                          showNotification('warning', 'يرجى إدخال اسم الشريك، ومسؤول التواصل، ورقم جوال المورد.');
                          return;
                        }
                        const updated = suppliersData.map(sup => sup.id === editingSupplier.id ? editingSupplier : sup);
                        setSuppliersData(updated);
                        setIsEditSupplierOpen(false);
                        setEditingSupplier(null);
                        showNotification('success', `تم تحديث ملف المورد "${editingSupplier.name}" وحفظ التعديلات بنجاح.`);
                      }}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      حفظ التغييرات
                    </button>
                    <button
                      onClick={() => {
                        setIsEditSupplierOpen(false);
                        setEditingSupplier(null);
                      }}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-black transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Google Maps Location Picker Modal */}
            {isLocationModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in dir-rtl">
                <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
                  {/* Modal Header */}
                  <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-indigo-600/30 border border-indigo-400/30 rounded-2xl text-indigo-400">
                        <MapPin className="w-6 h-6 animate-bounce" />
                      </div>
                      <div>
                        <h3 className="text-base font-black">تحديد الموقع الجغرافي على خرائط Google Maps</h3>
                        <p className="text-xs text-slate-400 font-sans mt-0.5">اختر موقع المنشأة بدقة لإظهاره لعملائك وتسهيل الوصول إليك</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsLocationModalOpen(false)}
                      className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-all cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 overflow-y-auto space-y-5 font-sans">
                    {/* Auto Detect Button & Quick Saudi Cities */}
                    <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                      <button
                        type="button"
                        onClick={handleAutoLocation}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center gap-2 shadow-sm transition-all cursor-pointer"
                      >
                        <Compass className="w-4 h-4 animate-spin" />
                        جلب موقعي الحالي عبر (GPS)
                      </button>

                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="text-slate-400 font-bold text-[11px]">مواقع سريعة:</span>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileLat('24.7618');
                            setProfileLng('46.6264');
                            setProfileCity('الرياض');
                            setProfileRegion('منطقة الرياض');
                            setProfileMapLink('https://maps.google.com/?q=24.7618,46.6264');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          الرياض
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileLat('21.5433');
                            setProfileLng('39.1728');
                            setProfileCity('جدة');
                            setProfileRegion('منطقة مكة المكرمة');
                            setProfileMapLink('https://maps.google.com/?q=21.5433,39.1728');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          جدة
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setProfileLat('26.4207');
                            setProfileLng('50.0888');
                            setProfileCity('الدمام');
                            setProfileRegion('المنطقة الشرقية');
                            setProfileMapLink('https://maps.google.com/?q=26.4207,50.0888');
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-700 text-[11px] font-bold cursor-pointer"
                        >
                          الدمام
                        </button>
                      </div>
                    </div>

                    {/* Interactive Google Map Embed */}
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 h-64 bg-slate-100 shadow-inner">
                      <iframe
                        title="Google Maps Location Preview"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        loading="lazy"
                        allowFullScreen
                        src={`https://maps.google.com/maps?q=${profileLat || '24.7618'},${profileLng || '46.6264'}&z=15&output=embed`}
                      />
                      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md text-white text-[11px] px-3 py-1.5 rounded-xl font-mono flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Lat: {profileLat}, Lng: {profileLng}</span>
                      </div>
                    </div>

                    {/* Coordinates Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">خط العرض (Latitude)</label>
                        <input
                          type="text"
                          value={profileLat}
                          onChange={(e) => {
                            setProfileLat(e.target.value);
                            setProfileMapLink(`https://maps.google.com/?q=${e.target.value},${profileLng}`);
                          }}
                          placeholder="مثال: 24.7618"
                          className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">خط الطول (Longitude)</label>
                        <input
                          type="text"
                          value={profileLng}
                          onChange={(e) => {
                            setProfileLng(e.target.value);
                            setProfileMapLink(`https://maps.google.com/?q=${profileLat},${e.target.value}`);
                          }}
                          placeholder="مثال: 46.6264"
                          className="w-full p-3 border border-slate-200 rounded-xl text-xs font-mono bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                        />
                      </div>
                    </div>

                    {/* Address Detail Input */}
                    <div>
                      <label className="block text-xs font-black text-slate-700 mb-1.5">العنوان الوطني المكتوب</label>
                      <input
                        type="text"
                        value={profileNationalAddress}
                        onChange={(e) => setProfileNationalAddress(e.target.value)}
                        placeholder="الحي، اسم الشارع، المدينة، المملكة العربية السعودية"
                        className="w-full p-3 border border-slate-200 rounded-xl text-xs bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-right"
                      />
                    </div>
                  </div>

                  {/* Modal Footer */}
                  <div className="p-4 bg-slate-50 border-t border-slate-100 flex gap-3 justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setIsLocationModalOpen(false);
                        showNotification('success', 'تم تثبيت وتحديث إحداثيات الموقع الجغرافي بنجاح.');
                      }}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      تأكيد وحفظ الموقع
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsLocationModalOpen(false)}
                      className="px-5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all cursor-pointer"
                    >
                      إلغاء
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Mobile Bottom Quick Action Dock for Providers (شريط التحكم السريع العائم للجوال) */}
            <div className="lg:hidden fixed bottom-3 left-3 right-3 z-40 bg-slate-950/95 text-white backdrop-blur-md rounded-2xl p-1.5 border border-slate-800 shadow-2xl flex items-center justify-between gap-1 dir-rtl font-sans">
              <button
                type="button"
                onClick={() => { setOsTab('overview'); setIsMobileMenuOpen(false); }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${osTab === 'overview' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'}`}
              >
                <Activity className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">الرئيسية</span>
              </button>

              <button
                type="button"
                onClick={() => { setOsTab('ops_center'); setIsMobileMenuOpen(false); }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${osTab === 'ops_center' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'}`}
              >
                <Sliders className="w-4 h-4 mb-0.5 text-indigo-300" />
                <span className="text-[9px]">التشغيل</span>
              </button>

              <button
                type="button"
                onClick={() => { setOsTab('orders'); setIsMobileMenuOpen(false); }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer relative min-h-[44px] ${osTab === 'orders' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'}`}
              >
                <Inbox className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">الطلبات</span>
                {liveNotifications.filter(n => n.unread).length > 0 && (
                  <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
                )}
              </button>

              <button
                type="button"
                onClick={() => { setOsTab('bookings'); setIsMobileMenuOpen(false); }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${osTab === 'bookings' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'}`}
              >
                <CheckSquare className="w-4 h-4 mb-0.5" />
                <span className="text-[9px]">الحجوزات</span>
              </button>

              <button
                type="button"
                onClick={() => { setOsTab('finance'); setIsMobileMenuOpen(false); }}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${osTab === 'finance' ? 'bg-indigo-600 text-white font-black' : 'text-slate-400 hover:text-white'}`}
              >
                <Wallet className="w-4 h-4 mb-0.5 text-emerald-400" />
                <span className="text-[9px]">المالية</span>
              </button>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all cursor-pointer min-h-[44px] ${isMobileMenuOpen ? 'bg-amber-500 text-slate-950 font-black' : 'text-slate-400 hover:text-white'}`}
              >
                <Sliders className="w-4 h-4 mb-0.5 text-amber-300" />
                <span className="text-[9px]">الأقسام</span>
              </button>
            </div>
          </div>
  );
}
