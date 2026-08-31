import React, { useState, useEffect, useMemo } from 'react';
import { safeSetLocalStorage } from '../../utils/safeStorage';
import { apiService } from '../../services/apiService';
import { motion, AnimatePresence } from 'motion/react';
import { 
  TrendingUp, Activity, CreditCard, Wallet, 
  Building2, ArrowRightLeft, Award, Clock, ArrowUpRight, ArrowDownRight, 
  Percent, Megaphone, ChevronDown, ChevronUp, Star, Filter, 
  Eye, RefreshCw, AlertCircle, Calendar, Sparkles, Inbox,
  CheckSquare, Users2, ShieldAlert, CheckCircle2, Sliders, Search, 
  FileSpreadsheet, Download, Plus, AlertTriangle, Play, FileText, Check, Printer, X, Coffee, Lock, Package, MapPin,
  ChevronRight, ChevronLeft, List, LayoutGrid, Truck, Boxes, Trash, Edit, Info, UploadCloud, Loader2, Compass, Camera,
  QrCode, ClipboardList, Grid3X3, FileCheck2, ShoppingCart
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';

// Domain Components
import { ProviderWorkspaceShell } from './layout/ProviderWorkspaceShell';
import { ProviderOverviewDomain } from './overview/ProviderOverviewDomain';
import { ProviderProfileDomain } from './profile/ProviderProfileDomain';
import { ProviderCatalogDomain } from './catalog/ProviderCatalogDomain';
import { ProviderPricingEngine } from './pricing/ProviderPricingEngine';
import { ProviderAvailabilityEngine } from './pricing/ProviderAvailabilityEngine';
import { ProviderBookingsTimeline } from './bookings/ProviderBookingsTimeline';
import { ProviderOrdersHub } from './services/ProviderOrdersHub';
import { ProviderHybridRules } from './pricing/ProviderHybridRules';
import { ProviderFinanceCenter } from './finance/ProviderFinanceCenter';
import { ProviderSubscriptionCenter } from './subscriptions/ProviderSubscriptionCenter';
import { ProviderReports } from './analytics/ProviderReports';
import { ProviderGrowthCenter } from './ProviderGrowthCenter';
import { FloorPlanVisualizer } from './FloorPlanVisualizer';
import { OperationsCenter } from './OperationsCenter';
import { EventRunSheet } from './EventRunSheet';
import { GuestGateQR } from './GuestGateQR';
import { PostEventQualityHub } from './PostEventQualityHub';
import { MilestoneContracts } from './MilestoneContracts';
import { AutoStockProcurement } from './AutoStockProcurement';
import { ProviderInventory } from './inventory/ProviderInventory';
import { ProviderVendors } from './vendors/ProviderVendors';
import { ProviderEmployees } from './employees/ProviderEmployees';
import { MediaStandardsGuideModal } from '../MediaStandardsGuideModal';
import { entitlementService } from '../../services/entitlementService';

export interface ProviderWorkspaceProps {
  currentProviderName: string;
  currentUserName?: string;
  providerSubscription?: any;
  selectedDashboardYear?: string;
  setSelectedDashboardYear?: (v: string) => void;
  selectedDashboardMonth?: string;
  setSelectedDashboardMonth?: (v: string) => void;
  dashboardPeriod?: string;
  setDashboardPeriod?: (v: string) => void;
  yearlyPeriodType?: string;
  setYearlyPeriodType?: (v: string) => void;
  customStartDate?: string;
  setCustomStartDate?: (v: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (v: string) => void;
  bookings?: any[];
  setBookings?: React.Dispatch<React.SetStateAction<any[]>>;
  supportServiceRequests?: any[];
  campaigns?: any[];
  setCampaigns?: React.Dispatch<React.SetStateAction<any[]>>;
  adRequests?: any[];
  setAdRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  services?: any[];
  customers?: any[];
  halls?: any[];
  activeSection?: string;
  setActiveSection?: (v: string) => void;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderWorkspace({
  currentProviderName = 'قاعة اللؤلؤة',
  currentUserName = 'مدير المنشأة',
  providerSubscription,
  selectedDashboardYear = '2026',
  setSelectedDashboardYear = () => {},
  selectedDashboardMonth = 'all',
  setSelectedDashboardMonth = () => {},
  dashboardPeriod = 'all',
  setDashboardPeriod = () => {},
  yearlyPeriodType = 'annual',
  setYearlyPeriodType = () => {},
  customStartDate = '',
  setCustomStartDate = () => {},
  customEndDate = '',
  setCustomEndDate = () => {},
  bookings = [],
  setBookings = () => {},
  supportServiceRequests = [],
  campaigns = [],
  setCampaigns,
  adRequests = [],
  setAdRequests,
  services = [],
  customers = [],
  halls = [],
  activeSection = 'overview',
  setActiveSection = () => {},
  showNotification = (type, message) => console.log(type, message),
}: ProviderWorkspaceProps) {
  // Navigation & Workspace State
  const [osTab, setOsTab] = useState<string>('overview');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Sync with activeSection if supplied
  useEffect(() => {
    if (activeSection) {
      if (activeSection === 'marketing') setOsTab('marketing');
      else if (activeSection === 'bookings') setOsTab('bookings');
      else if (activeSection === 'orders') setOsTab('orders');
      else if (activeSection === 'halls' || activeSection === 'catalog') setOsTab('catalog');
      else if (activeSection === 'finance') setOsTab('finance');
      else if (activeSection === 'inventory') setOsTab('inventory');
      else if (activeSection === 'suppliers' || activeSection === 'vendors') setOsTab('suppliers');
      else if (activeSection === 'customers' || activeSection === 'profile') setOsTab('profile');
      else if (activeSection === 'subscriptions') setOsTab('subscription');
      else if (activeSection === 'overview' || activeSection === 'cockpit') setOsTab('overview');
      else setOsTab(activeSection);
    }
  }, [activeSection]);

  // Onboarding Wizard State
  const [isOnboarded, setIsOnboarded] = useState<boolean>(() => {
    try {
      return localStorage.getItem(`provider_onboarded_${currentProviderName}`) === 'true';
    } catch {
      return false;
    }
  });
  const [isWizardForceOpen, setIsWizardForceOpen] = useState(false);
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
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [
      { id: 'BR-26-00000001', name: 'فرع الرياض الرئيسي', city: 'الرياض', phone: '0551234567', address: 'طريق الملك فهد' },
      { id: 'BR-26-00000002', name: 'فرع شمال الرياض', city: 'الرياض', phone: '0559876543', address: 'حي الملقا' }
    ];
  });

  const [profileEmployees, setProfileEmployees] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_employees_${currentProviderName}`);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [
      { id: 'EMP-26-00000001', name: 'خالد الرويلي', role: 'مشرف تجهيز', branch: 'فرع الرياض الرئيسي', permissions: 'إدارة تشغيلية كاملة', status: 'نشط' },
      { id: 'EMP-26-00000002', name: 'أحمد السالم', role: 'منسق ضيافة', branch: 'فرع الرياض الرئيسي', permissions: 'متابعة تجهيز العمليات', status: 'نشط' },
      { id: 'EMP-26-00000003', name: 'سارة العتيبي', role: 'مشرفة استقبال وقاعات', branch: 'فرع شمال الرياض', permissions: 'استعراض الحجوزات فقط', status: 'نشط' },
      { id: 'EMP-26-00000004', name: 'فهد المطيري', role: 'مهندس صوت وإضاءة', branch: 'فرع شمال الرياض', permissions: 'محدودة للفرع', status: 'نشط' },
    ];
  });

  // Profile Identity & Registration Form Fields
  const [profileBusinessName, setProfileBusinessName] = useState(() => {
    return localStorage.getItem(`provider_name_${currentProviderName}`) || currentProviderName;
  });
  const [profileBusinessCR, setProfileBusinessCR] = useState('1010998877');
  const [profileBusinessContact, setProfileBusinessContact] = useState('0551234567');
  const [profileBusinessDesc, setProfileBusinessDesc] = useState('منشأة متخصصة في توفير أفخم قاعات وصالات المناسبات الكبرى وتجهيزات الضيافة المتكاملة.');
  const [profileRepresentativeName, setProfileRepresentativeName] = useState(currentUserName);
  const [profileRepresentativeEmail, setProfileRepresentativeEmail] = useState('info@lailah-partner.sa');
  const [profileRepresentativePhone, setProfileRepresentativePhone] = useState('0551234567');
  const [profileEntityType, setProfileEntityType] = useState('شركة تجارية مسجلة');
  const [profileCity, setProfileCity] = useState('الرياض');
  const [profileRegion, setProfileRegion] = useState('منطقة الرياض');
  const [profileDistrict, setProfileDistrict] = useState('حي الملقا');
  const [profileNationalAddress, setProfileNationalAddress] = useState('7420 طريق الملك فهد، الرياض 13524');
  const [profileMapLink, setProfileMapLink] = useState('https://maps.google.com/?q=24.7136,46.6753');
  const [profileLogo, setProfileLogo] = useState('');
  const [showProviderToCustomers, setShowProviderToCustomers] = useState(true);
  const [profileUsername, setProfileUsername] = useState('lailah_provider');
  const [wizVatStatus, setWizVatStatus] = useState('registered');
  const [wizTaxId, setWizTaxId] = useState('310294829100003');
  const [wizIban, setWizIban] = useState('SA9340000000123456789012');
  const [wizBankName, setWizBankName] = useState('البنك الأهلي السعودي');
  const [wizBankAccountHolder, setWizBankAccountHolder] = useState(currentProviderName);
  const [withdrawIban, setWithdrawIban] = useState('SA9340000000123456789012');

  // Plan & Entitlements (Backend-Driven Single Source of Truth)
  const [entitlementVersion, setEntitlementVersion] = useState(0);

  useEffect(() => {
    const handleEntitlementUpdate = () => {
      setEntitlementVersion(v => v + 1);
    };
    window.addEventListener('entitlementUpdated', handleEntitlementUpdate);
    return () => window.removeEventListener('entitlementUpdated', handleEntitlementUpdate);
  }, []);

  const dynamicPricingResolution = entitlementService.resolve(currentProviderName, 'dynamic_pricing');
  const hasDynamicPricingAccess = dynamicPricingResolution.isEntitled;

  // Track provider plan from backend/entitlement state
  const [providerPlan, setProviderPlan] = useState<'starter' | 'pro'>(() => {
    return hasDynamicPricingAccess ? 'pro' : 'starter';
  });

  const setPurchasedDynamicPricingAddon = (val: boolean) => {
    if (val) {
      entitlementService.activateAddon(currentProviderName, 'dynamic_pricing', {
        amount: 299,
        action: 'purchase_addon'
      });
      setEntitlementVersion(v => v + 1);
    }
  };

  // Catalog State
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

  // Media Guide State
  const [isMediaGuideOpen, setIsMediaGuideOpen] = useState(false);

  // Live Notifications State
  const [liveNotifications, setLiveNotifications] = useState<any[]>([
    { id: 'NT-1', type: 'booking', text: 'تم إنشاء حجز جديد رقم BKG-26-0000000010 بقيمة 15,000 ر.س.', time: 'منذ دقيقة واحدة', unread: true },
    { id: 'NT-2', type: 'payment', text: 'تم إيداع دفعة سداد جديدة بقيمة 4,500 ر.س لمحفظتك.', time: 'منذ ١٠ دقائق', unread: true },
    { id: 'NT-3', type: 'payout', text: 'تمت الموافقة على تحويل مبلغ التسوية البنكية بقيمة 17,550 ر.س.', time: 'منذ ساعتين', unread: false },
    { id: 'NT-4', type: 'review', text: 'حصلت على تقييم جديد ممتاز (٥ نجوم) من العميل عمر القحطاني.', time: 'منذ يوم واحد', unread: false }
  ]);

  // Inventory & Suppliers Data
  const [inventoryItems, setInventoryItems] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_inventory_${currentProviderName}`);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [
      { id: 'ITM-26-0000000001', name: 'سجاد ملكي أحمر مذهب (VIP)', category: 'أثاث ومفروشات', total: 120, available: 85, inUse: 35, threshold: 20, branch: 'فرع الرياض الرئيسي', status: 'متوفر', statusColor: 'emerald', storageLoc: 'مستودع أ', custodian: 'خالد الرويلي', condition: 'ممتازة', desc: 'سجاد أحمر فاخر مهدب بخيوط مذهبة للممرات والمنصات الرئيسية.' },
      { id: 'ITM-26-0000000002', name: 'كراسي كلاسيك ذهبية مخملية', category: 'أثاث ومفروشات', total: 600, available: 450, inUse: 150, threshold: 100, branch: 'فرع الرياض الرئيسي', status: 'متوفر', statusColor: 'emerald', storageLoc: 'مستودع أ', custodian: 'خالد الرويلي', condition: 'ممتازة', desc: 'كراسي حديدية قوية مطلية باللون الذهبي المقاوم للخدش مغطاة بمخمل أحمر داكن.' },
      { id: 'ITM-26-0000000003', name: 'بوفيه ضيافة ستانلس ستيل متحرك', category: 'أدوات ضيافة وبوفيه', total: 10, available: 2, inUse: 8, threshold: 3, branch: 'فرع شمال الرياض', status: 'منخفض', statusColor: 'amber', storageLoc: 'مستودع ب', custodian: 'أحمد السالم', condition: 'جيدة', desc: 'طاولات بوفيه متحركة مع سخانات ستانلس ستيل وحافظات حرارية للوجبات الرئيسية.' },
      { id: 'ITM-26-0000000004', name: 'نظام سماعات لاسلكية Shure VIP', category: 'أجهزة إلكترونية وصوتيات', total: 8, available: 5, inUse: 3, threshold: 2, branch: 'فرع شمال الرياض', status: 'متوفر', statusColor: 'emerald', storageLoc: 'مستودع ب', custodian: 'أحمد السالم', condition: 'ممتازة', desc: 'ميكروفونات وسماعات احترافية لاسلكية عالية النقاوة لتغطية حية داخل الصالات.' },
    ];
  });

  const [supplyRequests, setSupplyRequests] = useState<any[]>(() => {
    const stored = localStorage.getItem(`provider_supply_requests_${currentProviderName}`);
    if (stored) {
      try { return JSON.parse(stored); } catch {}
    }
    return [
      { id: 'PO-26-00000001', supplier: 'شركة الضيافة الفاخرة المحدودة', items: 'تموين قهوة وشاي وتمور فاخرة', cost: 3500, date: '2026-07-20', status: 'معتمد' },
      { id: 'PO-26-00000002', supplier: 'مزرعة زهور الربيع الفاخرة', items: 'شحنة ورود طبيعية هولندية', cost: 1800, date: '2026-07-22', status: 'قيد التوريد' },
    ];
  });

  // Strict multi-tenancy filtering: Bookings & Support Service Requests for this provider
  const myBookings = useMemo(() => {
    const provNameLower = (currentProviderName || '').trim().toLowerCase();
    return (bookings || []).filter((b: any) => {
      const bProv = (b.provider || b.providerName || b.hallProvider || '').trim().toLowerCase();
      return bProv === provNameLower || bProv.includes(provNameLower) || provNameLower.includes(bProv);
    });
  }, [bookings, currentProviderName]);

  const mySupportRequests = useMemo(() => {
    const provNameLower = (currentProviderName || '').trim().toLowerCase();
    return (supportServiceRequests || []).filter((r: any) => {
      const rProv = (r.provider || r.providerName || '').trim().toLowerCase();
      return rProv === provNameLower || rProv.includes(provNameLower) || provNameLower.includes(rProv);
    });
  }, [supportServiceRequests, currentProviderName]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setProfileLogo(result);
        showNotification('success', 'تم رفع شعار المنشأة بنجاح.');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulateDocUpload = () => {
    setIsUploadingSim(true);
    setUploadProgress(10);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsUploadingSim(false);
          setUploadedDocs((docs) => docs.map((d) => ({ ...d, status: 'success' })));
          showNotification('success', 'تم رفع وتدقيق المستندات الرسمية بنجاح 100%!');
          return 100;
        }
        return prev + 30;
      });
    }, 400);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50" dir="rtl">
      {/* Media Standards Guide Modal */}
      <MediaStandardsGuideModal
        isOpen={isMediaGuideOpen}
        onClose={() => setIsMediaGuideOpen(false)}
      />

      {/* Onboarding Wizard Modal if not completed or force opened */}
      <AnimatePresence>
        {(!isOnboarded || isWizardForceOpen) ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
          >
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-3xl w-full shadow-2xl space-y-6 my-auto text-right font-sans">
              {/* Wizard Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                {isWizardForceOpen && (
                  <button
                    type="button"
                    onClick={() => setIsWizardForceOpen(false)}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                <div className="text-right">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-wider">
                    STEP {onboardingStep} OF 4
                  </span>
                  <h3 className="text-lg font-black text-slate-800 dark:text-slate-100">
                    معالج تهيئة وتشغيل مساحة عمل المزود (Workspace Setup Wizard)
                  </h3>
                </div>
              </div>

              {/* Wizard Steps Indicator */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { num: 1, label: 'بيانات الفرع' },
                  { num: 2, label: 'القاعات والخدمات' },
                  { num: 3, label: 'الأسعار والسياسات' },
                  { num: 4, label: 'المستندات والاعتماد' },
                ].map((s) => (
                  <div 
                    key={s.num}
                    className={`p-2.5 rounded-2xl border text-center transition-all ${
                      onboardingStep === s.num
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 text-indigo-600 dark:text-indigo-300 font-black'
                        : onboardingStep > s.num
                        ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-500 text-emerald-600 dark:text-emerald-300'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700 text-slate-400'
                    }`}
                  >
                    <span className="text-xs">{s.label}</span>
                  </div>
                ))}
              </div>

              {/* Step 1: Branch Details */}
              {onboardingStep === 1 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200">
                    أدخل بيانات الفرع التشغيلي الأول لمنشأتك لبدء ربطه بالحجوزات والكوادر الميدانية.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم الفرع *</label>
                      <input
                        type="text"
                        value={wizBranchName}
                        onChange={(e) => setWizBranchName(e.target.value)}
                        placeholder="مثال: فرع الرياض الرئيسي"
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">المدينة *</label>
                      <input
                        type="text"
                        value={wizBranchCity}
                        onChange={(e) => setWizBranchCity(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">رقم هاتف الفرع *</label>
                      <input
                        type="text"
                        value={wizBranchPhone}
                        onChange={(e) => setWizBranchPhone(e.target.value)}
                        placeholder="05XXXXXXXX"
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">العنوان الوطني</label>
                      <input
                        type="text"
                        value={wizBranchAddress}
                        onChange={(e) => setWizBranchAddress(e.target.value)}
                        placeholder="طريق الملك فهد، حي الملقا"
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Halls & Services */}
              {onboardingStep === 2 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200">
                    أضف قاعتك الرئيسية أو باقتك لتظهر في مساحة العمل فورياً.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">اسم القاعة أو الصالة *</label>
                      <input
                        type="text"
                        value={wizVenueName}
                        onChange={(e) => setWizVenueName(e.target.value)}
                        placeholder="مثال: قاعة اللؤلؤة الكبرى"
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">السعة القصوى (أفراد)</label>
                      <input
                        type="number"
                        value={wizVenueCapacity}
                        onChange={(e) => setWizVenueCapacity(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">السعر المرجعي (شامل الضريبة ر.س)</label>
                      <input
                        type="number"
                        value={wizVenuePrice}
                        onChange={(e) => setWizVenuePrice(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">خدمة تكميلية إضافية</label>
                      <input
                        type="text"
                        value={wizServiceName}
                        onChange={(e) => setWizServiceName(e.target.value)}
                        placeholder="مثال: بوفيه عشاء ملكي فاخر"
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Pricing & Bank Info */}
              {onboardingStep === 3 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200">
                    حدد قواعد التسعير والحساب البنكي لتحويل المستحقات وعربين الضمان المالي.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">السعر الأساسي للأيام العادية (ر.س)</label>
                      <input
                        type="number"
                        value={wizBasePrice}
                        onChange={(e) => setWizBasePrice(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">سعر نهاية الأسبوع (الخميس والجمعة)</label>
                      <input
                        type="number"
                        value={wizWeekendPrice}
                        onChange={(e) => setWizWeekendPrice(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">الآيبان البنكي للسحب والتحويل (IBAN)</label>
                      <input
                        type="text"
                        value={wizIban}
                        onChange={(e) => {
                          setWizIban(e.target.value);
                          setWithdrawIban(e.target.value);
                        }}
                        className="w-full text-xs font-mono font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">ساعات العمل والتشغيل اليومية</label>
                      <input
                        type="text"
                        value={wizWorkingHours}
                        onChange={(e) => setWizWorkingHours(e.target.value)}
                        className="w-full text-xs font-bold p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-100"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Documents & Final Launch */}
              {onboardingStep === 4 && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <div className="p-4 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl text-xs text-indigo-900 dark:text-indigo-200">
                    رفع الوثائق الرسمية للمنشأة لضمان الامتثال والاعتماد السيادي للمنصة.
                  </div>
                  <div className="space-y-2">
                    {uploadedDocs.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200/60 dark:border-slate-700">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{doc.name}</span>
                        </div>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full ${
                          doc.status === 'success' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300'
                        }`}>
                          {doc.status === 'success' ? 'تم الرفع والاعتماد' : 'بانتظار الرفع'}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSimulateDocUpload}
                      disabled={isUploadingSim}
                      className="w-full py-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      {isUploadingSim ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
                          <span>جاري رفع وتدقيق المستندات ({uploadProgress}%)...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-4 h-4 text-indigo-600" />
                          <span>رفع واعتماد المستندات الرسمية فورياً 📄</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Wizard Footer Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                {onboardingStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((s) => s - 1)}
                    className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span>السابق</span>
                  </button>
                ) : <div />}

                {onboardingStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setOnboardingStep((s) => s + 1)}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 shadow-md shadow-indigo-600/20"
                  >
                    <span>التالي</span>
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOnboarded(true);
                      setIsWizardForceOpen(false);
                      try {
                        localStorage.setItem(`provider_onboarded_${currentProviderName}`, 'true');
                        window.dispatchEvent(new Event('storage'));
                        window.dispatchEvent(new Event('settingsUpdated'));
                        window.dispatchEvent(new Event('providerDataSynced'));
                      } catch {}
                      showNotification('success', 'مبروك! تم إطلاق وتفعيل مساحة عمل المزود الموحدة بنجاح!');
                    }}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Sparkles className="w-4 h-4 text-yellow-300" />
                    <span>إطلاق مساحة عمل المزود الموحدة 🚀</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Main Workspace Layout Shell */}
      <ProviderWorkspaceShell
        osTab={osTab}
        setOsTab={setOsTab}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        currentProviderName={currentProviderName}
        profileBusinessName={profileBusinessName}
        profileLogo={profileLogo}
        providerPlan={providerPlan}
        liveNotifications={liveNotifications}
        onOpenWizard={() => {
          setIsWizardForceOpen(true);
          setOnboardingStep(1);
        }}
      >
        {/* Domain 1: Business Overview */}
        {osTab === 'overview' && (
          <ProviderOverviewDomain
            currentProviderName={currentProviderName}
            currentUserName={currentUserName}
            profileBusinessName={profileBusinessName}
            profileLogo={profileLogo || ''}
            setIsWizardForceOpen={setIsWizardForceOpen}
            setOnboardingStep={setOnboardingStep}
            setOsTab={(tab) => setOsTab(tab as any)}
            wizIban={wizIban}
            withdrawIban={withdrawIban}
            halls={catalogHalls}
            catalogServices={catalogServices}
            wizWeekendPrice={wizWeekendPrice}
            wizWorkingHours={wizWorkingHours}
            uploadedDocs={uploadedDocs}
            bookings={myBookings}
            supportServiceRequests={mySupportRequests}
            showNotification={showNotification}
            supplyRequests={supplyRequests}
            inventoryItems={inventoryItems}
            profileEmployees={profileEmployees}
          />
        )}

        {/* Domain 2: Business Profile & Staff */}
        {osTab === 'profile' && (
          <ProviderProfileDomain
            profileBusinessName={profileBusinessName}
            setProfileBusinessName={setProfileBusinessName}
            profileBusinessCR={profileBusinessCR}
            setProfileBusinessCR={setProfileBusinessCR}
            profileBusinessContact={profileBusinessContact}
            setProfileBusinessContact={setProfileBusinessContact}
            profileBusinessDesc={profileBusinessDesc}
            setProfileBusinessDesc={setProfileBusinessDesc}
            profileRepresentativeName={profileRepresentativeName}
            setProfileRepresentativeName={setProfileRepresentativeName}
            profileRepresentativeEmail={profileRepresentativeEmail}
            setProfileRepresentativeEmail={setProfileRepresentativeEmail}
            profileRepresentativePhone={profileRepresentativePhone}
            setProfileRepresentativePhone={setProfileRepresentativePhone}
            profileEntityType={profileEntityType}
            setProfileEntityType={setProfileEntityType}
            profileCity={profileCity}
            setProfileCity={setProfileCity}
            profileRegion={profileRegion}
            setProfileRegion={setProfileRegion}
            profileDistrict={profileDistrict}
            setProfileDistrict={setProfileDistrict}
            profileNationalAddress={profileNationalAddress}
            setProfileNationalAddress={setProfileNationalAddress}
            profileMapLink={profileMapLink}
            setProfileMapLink={setProfileMapLink}
            profileLogo={profileLogo}
            setProfileLogo={setProfileLogo}
            showProviderToCustomers={showProviderToCustomers}
            setShowProviderToCustomers={setShowProviderToCustomers}
            profileUsername={profileUsername}
            setProfileUsername={setProfileUsername}
            wizVatStatus={wizVatStatus}
            setWizVatStatus={setWizVatStatus}
            wizTaxId={wizTaxId}
            setWizTaxId={setWizTaxId}
            wizIban={wizIban}
            setWizIban={setWizIban}
            wizBankName={wizBankName}
            setWizBankName={setWizBankName}
            wizBankAccountHolder={wizBankAccountHolder}
            setWizBankAccountHolder={setWizBankAccountHolder}
            profileBranches={profileBranches}
            setProfileBranches={setProfileBranches}
            profileEmployees={profileEmployees}
            setProfileEmployees={setProfileEmployees}
            handleLogoUpload={handleLogoUpload}
            showNotification={showNotification}
          />
        )}

        {/* Domain 3: Catalog Management */}
        {osTab === 'catalog' && (
          <ProviderCatalogDomain
            catalogHalls={catalogHalls}
            setCatalogHalls={setCatalogHalls}
            catalogServices={catalogServices}
            setCatalogServices={setCatalogServices}
            catalogPackages={catalogPackages}
            setCatalogPackages={setCatalogPackages}
            showNotification={showNotification}
            setIsMediaGuideOpen={setIsMediaGuideOpen}
            showProviderToCustomers={showProviderToCustomers}
            setOsTab={setOsTab}
            currentProviderName={currentProviderName}
            hasDynamicPricingAccess={hasDynamicPricingAccess}
            formatCurrency={formatCurrency}
          />
        )}

        {/* Domain 4: Pricing Engine */}
        {osTab === 'pricing' && (
          <ProviderPricingEngine
            showNotification={showNotification}
          />
        )}

        {/* Domain 5: Availability Engine */}
        {osTab === 'availability' && (
          <ProviderAvailabilityEngine
            showNotification={showNotification}
          />
        )}

        {/* Domain 6: Booking Operations */}
        {osTab === 'bookings' && (
          <ProviderBookingsTimeline
            myBookings={myBookings}
            showNotification={showNotification}
          />
        )}

        {/* Domain 7: Order Operations */}
        {osTab === 'orders' && (
          <ProviderOrdersHub
            mySupportRequests={mySupportRequests}
            showNotification={showNotification}
            onRefresh={() => setOsTab('orders')}
          />
        )}

        {/* Domain 8: Hybrid Occasions */}
        {osTab === 'hybrid' && (
          <ProviderHybridRules />
        )}

        {/* Domain 9: Finance Center */}
        {osTab === 'finance' && (
          <ProviderFinanceCenter
            currentProviderName={currentProviderName}
            showNotification={showNotification}
          />
        )}

        {/* Domain 10: Subscription Center */}
        {osTab === 'subscription' && (
          <ProviderSubscriptionCenter
            providerPlan={providerPlan}
            setProviderPlan={setProviderPlan}
            hasDynamicPricingAccess={hasDynamicPricingAccess}
            setPurchasedDynamicPricingAddon={setPurchasedDynamicPricingAddon}
            showNotification={showNotification}
          />
        )}

        {/* Domain 11: Reports & Logs */}
        {osTab === 'reports' && (
          <ProviderReports currentProviderName={currentProviderName} />
        )}

        {/* Domain 12: Growth & Marketing Center */}
        {osTab === 'marketing' && (
          <ProviderGrowthCenter
            currentProviderName={currentProviderName}
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            adRequests={adRequests}
            setAdRequests={setAdRequests}
            halls={catalogHalls}
            services={catalogServices}
            showNotification={showNotification}
          />
        )}

        {/* Domain 13: 360 Floor Plan & Seating */}
        {osTab === 'floorplan' && (
          <FloorPlanVisualizer
            currentProviderName={currentProviderName}
            providerSubscription={providerSubscription}
            halls={catalogHalls}
            bookings={myBookings}
            showNotification={showNotification}
          />
        )}

        {/* Domain 14: Operations Center & Dispatch */}
        {osTab === 'ops_center' && (
          <OperationsCenter
            currentProviderName={currentProviderName}
            currentUserName={currentUserName}
            myBookings={myBookings}
            mySupportRequests={mySupportRequests}
            providerSubscription={providerSubscription}
            showNotification={showNotification}
          />
        )}

        {/* Domain 15: Event Run Sheet */}
        {osTab === 'runsheet' && (
          <EventRunSheet
            bookings={myBookings}
          />
        )}

        {/* Domain 16: Guest Gate QR */}
        {osTab === 'guestgate' && (
          <GuestGateQR
            hallCapacity={500}
          />
        )}

        {/* Domain 17: Post Event Quality */}
        {osTab === 'quality' && (
          <PostEventQualityHub />
        )}

        {/* Domain 18: Milestone Contracts */}
        {osTab === 'contracts' && (
          <MilestoneContracts />
        )}

        {/* Domain 19: Procurement */}
        {osTab === 'procurement' && (
          <AutoStockProcurement />
        )}

        {/* Domain 20: Field Inventory Management */}
        {osTab === 'inventory' && (
          <ProviderInventory
            showNotification={showNotification}
          />
        )}

        {/* Domain 21: Suppliers & Vendors */}
        {(osTab === 'suppliers' || osTab === 'vendors') && (
          <ProviderVendors
            showNotification={showNotification}
          />
        )}

        {/* Domain 22: Field Staff & Employees */}
        {(osTab === 'employees' || osTab === 'staff') && (
          <ProviderEmployees
            showNotification={showNotification}
          />
        )}

        {/* Domain 23: Live Notifications & Chat */}
        {osTab === 'notifications' && (
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/60 dark:border-slate-800 shadow-sm space-y-4 text-right">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-[10px] font-black text-indigo-600 font-mono">LIVE FEED & MESSAGES</span>
              <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">سجل التنبيهات والرسائل المباشرة</h3>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {liveNotifications.map((notif) => (
                <div key={notif.id} className="py-3 flex items-center justify-between">
                  <div className="text-left">
                    <span className="text-[10px] text-slate-400 font-mono">{notif.time}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{notif.text}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-indigo-600" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </ProviderWorkspaceShell>
    </div>
  );
}

export default ProviderWorkspace;
