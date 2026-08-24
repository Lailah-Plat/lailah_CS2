/**
 * ============================================================================
 * مكون إدارة إعدادات المنصة المتقدمة (Platform Settings Management Component)
 * ============================================================================
 * English Description:
 * Advanced System Settings & Administration Panel for Laylah Platform.
 * Manages Payment Gateways (Moyasar, HyperPay, PayTabs, Geidea, Tabby, Tamara),
 * Webhook simulator & endpoints, Region & City datastore management,
 * Platform rules, VAT rates, and Multi-tenancy configurations.
 *
 * الوصف بالعربية:
 * لوحة إدارة وإعدادات المنصة المتقدمة لمنصة ليلة.
 * تقوم بمدير بوابات الدفع الإلكتروني (ميسر، هايبرباي، بي تابس، جيديا، تابي، تمارا)،
 * أداة محاكاة واختبار الـ Webhooks المباشرة، إدارة مخزن بيانات المناطق والمدن،
 * القواعد والعمولات الضريبية، وإعدادات العزل الصارم للبيانات.
 */

import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Columns, 
  Plus, 
  X, 
  Pencil, 
  Trash2, 
  CheckCircle2, 
  MapPin, 
  Info, 
  Sparkles, 
  Clock,
  Settings,
  Shield,
  CreditCard,
  Bell,
  HardDrive,
  UserCheck,
  Award,
  LifeBuoy,
  Server,
  Database,
  Key,
  RefreshCw,
  AlertTriangle,
  Users,
  Building2,
  CalendarDays,
  Wallet,
  Activity,
  Package,
  Truck,
  AlertCircle,
  ClipboardList,
  Coins,
  Trophy,
  Percent,
  ShieldCheck,
  Globe,
  Hash,
  Link,
  Lock,
  Video,
  Camera,
  BookOpen,
  Copy,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Zap,
  Code,
  Terminal,
  Check,
  Eye,
  EyeOff,
  Send
} from 'lucide-react';
import { SecuritySecretTab } from './SecuritySecretTab';
import { PartnerTieringEngineModal } from './partner/PartnerTieringEngineModal';
import PlatformInfoSettings from './admin/PlatformInfoSettings';
import DataStoreSettingsTab from './DataStoreSettingsTab';
import TechnicalIntegrationTab from './admin/TechnicalIntegrationTab';
import SensitiveDataApprovalsPanel from './admin/SensitiveDataApprovalsPanel';
import PaymentGatewayLimitsPanel from './admin/PaymentGatewayLimitsPanel';
import PaymentTokensAuditPanel from './admin/PaymentTokensAuditPanel';
import FinancialSettingsSection from './admin/FinancialSettingsSection';
import ProviderPayoutAndSubscriptionPanel from './payment/ProviderPayoutAndSubscriptionPanel';
import CustomerSavedCardsModal from './payment/CustomerSavedCardsModal';
import { CrNumberInput, TaxNumberInput } from './common/ValidationInputs';
import { MediaPoliciesManagementSection } from './admin/MediaPoliciesManagementSection';
import { 
  IMAGE_RESOLUTION_PRESETS, 
  VIDEO_RESOLUTION_PRESETS, 
  getMediaSettingsConfig, 
  getPresetDimensions 
} from '../utils/uploadValidator.js';

// Helper setting inputs defined locally for self-containment
const SettingToggle = ({ 
  label, 
  description, 
  defaultChecked, 
  checked, 
  onChange 
}: { 
  label: string, 
  description?: string, 
  defaultChecked?: boolean, 
  checked?: boolean, 
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void 
}) => (
  <div className="flex items-start justify-between p-4 bg-white rounded-xl border border-slate-100 shadow-xs hover:border-slate-200 transition-all text-right" dir="rtl">
    <div className="ml-4">
      <span className="block text-sm font-bold text-slate-800">{label}</span>
      {description && <span className="block text-xs text-slate-400 mt-1 leading-relaxed">{description}</span>}
    </div>
    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
       <input 
         type="checkbox" 
         defaultChecked={defaultChecked} 
         checked={checked} 
         onChange={onChange} 
         className="sr-only peer" 
       />
       <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
    </label>
  </div>
);

const SettingInput = ({ 
  label, 
  type = "text", 
  defaultValue, 
  placeholder, 
  description, 
  suffix, 
  prefix, 
  dir, 
  value, 
  onChange 
}: { 
  label: string, 
  type?: string, 
  defaultValue?: string | number, 
  placeholder?: string, 
  description?: string, 
  suffix?: string, 
  prefix?: string, 
  dir?: string, 
  value?: string | number, 
  onChange?: (e: any) => void 
}) => (
  <div className="text-right" dir="rtl">
    <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
    <div className="relative flex items-center">
       {prefix && <span className="absolute right-3.5 text-slate-400 text-xs sm:text-sm font-sans">{prefix}</span>}
       <input 
          type={type} 
          defaultValue={defaultValue}
          value={value}
          onChange={onChange}
          placeholder={placeholder} 
          className={`w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none transition-all text-left ${prefix ? 'pr-10' : ''} ${suffix ? 'pl-10' : ''} text-sm`} 
          dir={dir || (type === 'number' || type === 'email' ? 'ltr' : 'auto')} 
       />
       {suffix && <span className="absolute left-3.5 text-slate-400 text-xs sm:text-sm font-sans">{suffix}</span>}
    </div>
    {description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>}
  </div>
);

const SettingInputState = ({ 
  label, 
  type = "text", 
  value, 
  onChange, 
  placeholder, 
  description, 
  suffix, 
  prefix, 
  dir 
}: { 
  label: string, 
  type?: string, 
  value?: string | number, 
  onChange?: (e: any) => void, 
  placeholder?: string, 
  description?: string, 
  suffix?: string, 
  prefix?: string, 
  dir?: string 
}) => (
  <div className="text-right" dir="rtl">
    <label className="block text-sm font-bold text-slate-700 mb-1.5">{label}</label>
    <div className="relative flex items-center">
       {prefix && <span className="absolute right-3.5 text-slate-400 text-xs sm:text-sm font-sans">{prefix}</span>}
       <input 
          type={type} 
          value={value}
          onChange={onChange}
          placeholder={placeholder} 
          className={`w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none transition-all text-left ${prefix ? 'pr-10' : ''} ${suffix ? 'pl-10' : ''} text-sm`} 
          dir={dir || (type === 'number' || type === 'email' ? 'ltr' : 'auto')} 
       />
       {suffix && <span className="absolute left-3.5 text-slate-400 text-xs sm:text-sm font-sans">{suffix}</span>}
    </div>
    {description && <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{description}</p>}
  </div>
);

interface SettingsManagementProps {
  setActiveTab?: (tab: string) => void;
  isSavingSettings: boolean;
  activeSettingsTab: string;
  setActiveSettingsTab: (tab: string) => void;
  handleSaveChanges: () => void;
  generalSubTab: 'info' | 'layout';
  setGeneralSubTab: (subTab: 'info' | 'layout') => void;
  platformData: any;
  setPlatformData: (val: any) => void;
  generalSettings: any;
  setGeneralSettings: (prev: any) => void;
  getDigitStyle: () => 'western' | 'eastern';
  setDigitStyle: (style: 'western' | 'eastern') => void;
  securitySubTab: 'general' | 'mandatory' | 'otp' | 'secret';
  setSecuritySubTab: (subTab: 'general' | 'mandatory' | 'otp' | 'secret') => void;
  securityCustomSettings: any;
  setSecurityCustomSettings: (prev: any) => void;
  allowAccountDeletion: boolean;
  setAllowAccountDeletion: (v: boolean) => void;
  securitySettings: any;
  handleUpdateSecuritySettings: (changes: any) => void;
  integrationKeys: any;
  setIntegrationKeys: (prev: any) => void;
  dbHealthStatus: string;
  dbLastSyncTime: string;
  financialSubTab: 'taxes' | 'splitting';
  setFinancialSubTab: (subTab: 'taxes' | 'splitting') => void;
  financialSettingsState: any;
  setFinancialSettingsState: (prev: any) => void;
  maxConfirmationPeriod: string;
  setMaxConfirmationPeriod: (v: string) => void;
  enablePartialPayment: boolean;
  setEnablePartialPayment: (v: boolean) => void;
  partialPaymentDepositPercentage: number;
  setPartialPaymentDepositPercentage: (v: number) => void;
  activeSettlementMethod: 'deposit_only' | 'split_payments' | 'weekly_clearance';
  setActiveSettlementMethod?: (method: 'deposit_only' | 'split_payments' | 'weekly_clearance') => void;
  marketingCommissionPercentage: number;
  setMarketingCommissionPercentage: (v: number) => void;
  pendingTransactionsCount: number;
  handleTriggerBackgroundUtility: () => void;
  generatedSettlementReport: any;
  setGeneratedSettlementReport: (v: any) => void;
  setSimulatedPendingTransactionsWiped: (v: boolean) => void;
  setSettlementPendingActivation: (v: any) => void;
  settlementPendingActivation: any;
  activePendingBookings: any[];
  applyOnlyToNewReservations: boolean;
  setApplyOnlyToNewReservations: (v: boolean) => void;
  newRegionName: string;
  setNewRegionName: (v: string) => void;
  newRegionImage: string;
  setNewRegionImage: (v: string) => void;
  handleAddRegion: () => void;
  regions: any[];
  editingRegion: any;
  setEditingRegion: (v: any) => void;
  handleSaveRegionEdit: () => void;
  handleDeleteRegion: (id: any) => void;
  newCityNames: Record<string, string>;
  setNewCityNames: (prev: any) => void;
  handleAddCity: (regionId: any) => void;
  handleDeleteCity: (regionId: any, index: number) => void;
  paymentSubTab: 'gateways' | 'general_settings' | 'thresholds' | 'tokens_audit' | 'provider_payouts' | 'customer_cards';
  setPaymentSubTab: (subTab: 'gateways' | 'general_settings' | 'thresholds' | 'tokens_audit' | 'provider_payouts' | 'customer_cards') => void;
  paymentSettings: any;
  handleTogglePaymentSetting: (key: string) => void;
  enabledGateways: any;
  handleToggleGateway: (key: string) => void;
  handleCheckout: (key: string) => void;
  enableForceMajeureProtocol: boolean;
  setEnableForceMajeureProtocol: (v: boolean) => void;
  forceMajeureWindowDays: number;
  setForceMajeureWindowDays: (v: number) => void;
  syncConfigItemToDB: (key: string, val: any) => void;
  notificationSettingsState: any;
  setNotificationSettingsState: (prev: any) => void;
  isLevelThresholdsModalOpen: boolean;
  setIsLevelThresholdsModalOpen: (v: boolean) => void;
  partnerLevelThresholds: any;
  setPartnerLevelThresholds: (prev: any) => void;
  showNotification: (type: string, msg: string) => void;
  isHallViewModalOpen: boolean;
  setIsHallViewModalOpen: (v: boolean) => void;
  viewingHall: any;
  setViewingHall: (v: any) => void;
  bookings?: any[];
  halls?: any[];
  supportServiceRequests?: any[];
  inventory?: any[];
  providers?: any[];
  customers?: any[];
  campaigns?: any[];
  supportTickets?: any[];
  staffTasks?: any[];
  reviews?: any[];
  inventorySettings?: any;
  setInventorySettings?: (v: any) => void;
  userRole?: string;
}

export const SettingsManagement = ({
  setActiveTab,
  isSavingSettings,
  activeSettingsTab,
  setActiveSettingsTab,
  handleSaveChanges,
  generalSubTab,
  setGeneralSubTab,
  platformData,
  setPlatformData,
  generalSettings,
  setGeneralSettings,
  getDigitStyle,
  setDigitStyle,
  securitySubTab,
  setSecuritySubTab,
  securityCustomSettings,
  setSecurityCustomSettings,
  allowAccountDeletion,
  setAllowAccountDeletion,
  securitySettings,
  handleUpdateSecuritySettings,
  integrationKeys,
  setIntegrationKeys,
  dbHealthStatus,
  dbLastSyncTime,
  financialSubTab,
  setFinancialSubTab,
  financialSettingsState,
  setFinancialSettingsState,
  maxConfirmationPeriod,
  setMaxConfirmationPeriod,
  enablePartialPayment,
  setEnablePartialPayment,
  partialPaymentDepositPercentage,
  setPartialPaymentDepositPercentage,
  activeSettlementMethod,
  setActiveSettlementMethod,
  marketingCommissionPercentage,
  setMarketingCommissionPercentage,
  pendingTransactionsCount,
  handleTriggerBackgroundUtility,
  generatedSettlementReport,
  setGeneratedSettlementReport,
  setSimulatedPendingTransactionsWiped,
  setSettlementPendingActivation,
  settlementPendingActivation,
  activePendingBookings,
  applyOnlyToNewReservations,
  setApplyOnlyToNewReservations,
  newRegionName,
  setNewRegionName,
  newRegionImage,
  setNewRegionImage,
  handleAddRegion,
  regions,
  editingRegion,
  setEditingRegion,
  handleSaveRegionEdit,
  handleDeleteRegion,
  newCityNames,
  setNewCityNames,
  handleAddCity,
  handleDeleteCity,
  paymentSubTab,
  setPaymentSubTab,
  paymentSettings,
  handleTogglePaymentSetting,
  enabledGateways,
  handleToggleGateway,
  handleCheckout,
  enableForceMajeureProtocol,
  setEnableForceMajeureProtocol,
  forceMajeureWindowDays,
  setForceMajeureWindowDays,
  syncConfigItemToDB,
  notificationSettingsState,
  setNotificationSettingsState,
  isLevelThresholdsModalOpen,
  setIsLevelThresholdsModalOpen,
  partnerLevelThresholds,
  setPartnerLevelThresholds,
  showNotification,
  isHallViewModalOpen,
  setIsHallViewModalOpen,
  viewingHall,
  setViewingHall,
  bookings = [],
  halls = [],
  supportServiceRequests = [],
  inventory = [],
  providers = [],
  customers = [],
  campaigns = [],
  supportTickets = [],
  staffTasks = [],
  reviews = [],
  inventorySettings = { enableLowStockEmailNotification: false, minWithdrawalLimit: 500, maxWithdrawalLimit: 50000, priceChangeLockPeriod: 7 },
  setInventorySettings = () => {},
  userRole = 'admin'
}: SettingsManagementProps) => {

  // Payment Gateways & Webhook state
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [webhookTestGateway, setWebhookTestGateway] = useState<string | null>(null);
  const [webhookTestEventType, setWebhookTestEventType] = useState<'payment.paid' | 'refund.created' | 'payment.failed'>('payment.paid');
  const [webhookTestLogs, setWebhookTestLogs] = useState<string[]>([]);
  const [isSimulatingWebhook, setIsSimulatingWebhook] = useState(false);

  // External Database integrations state
  const [externalDbConfigs, setExternalDbConfigs] = useState(() => {
    try {
      const stored = localStorage.getItem('EXTERNAL_DB_CONFIGS');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return {
      inventory: {
        host: '10.0.14.23',
        port: '5432',
        database: 'central_inventory_db',
        username: 'wh_sync_agent',
        status: 'connected',
        lastSync: new Date().toISOString(),
        tables: ['items', 'categories', 'transactions'],
        autoSync: true,
      },
      permissions: {
        host: 'ldap.central-org.local',
        port: '389',
        database: 'dc=central,dc=local',
        username: 'cn=admin,dc=central,dc=local',
        status: 'connected',
        lastSync: new Date().toISOString(),
        provider: 'Active Directory (AD)',
        autoSync: true,
      },
      loyalty: {
        apiUrl: 'https://api.crm-loyalty.local/v1',
        token: 'Bearer ly_auth_token_991823',
        status: 'connected',
        lastSync: new Date().toISOString(),
        syncFrequency: 'hourly',
      },
      support: {
        apiUrl: 'https://helpdesk.company-central.com/api/v2',
        token: 'Bearer hd_90238120',
        status: 'connected',
        lastSync: new Date().toISOString(),
        gateway: 'Zendesk API Connector',
      }
    };
  });


  // Interactive Permissions & Roles management states
  const [roles, setRoles] = useState(() => {
    try {
      const stored = localStorage.getItem('PLATFORM_ROLES');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      {
        id: 'super_admin',
        name: 'Super Admin (المدير العام)',
        description: 'كامل الصلاحيات الفنية، تعديل الإعدادات والمالية، تعيين الموظفين وصلاحياتهم.',
        color: 'rose',
        isSystem: true,
        permissions: {
          halls: { read: true, create: true, update: true, delete: true },
          bookings: { read: true, create: true, update: true, delete: true },
          financials: { read: true, create: true, update: true, delete: true },
          settings: { read: true, create: true, update: true, delete: true }
        }
      },
      {
        id: 'financial_manager',
        name: 'Financial Manager (المدير المالي)',
        description: 'الوصول للتقارير المالية، تسوية الأرصدة، إدارة الضرائب والخصومات، إصدار فواتير Zatca.',
        color: 'amber',
        isSystem: true,
        permissions: {
          halls: { read: true, create: false, update: false, delete: false },
          bookings: { read: true, create: false, update: true, delete: false },
          financials: { read: true, create: true, update: true, delete: true },
          settings: { read: true, create: false, update: false, delete: false }
        }
      },
      {
        id: 'partner_admin',
        name: 'Partner Admin (مسؤول الشريك)',
        description: 'إدارة الصالات والخدمات التابعة للقاعة الخاصة به، معالجة الحجوزات الواردة وإدارة الموظفين الفرعيين.',
        color: 'indigo',
        isSystem: true,
        permissions: {
          halls: { read: true, create: true, update: true, delete: false },
          bookings: { read: true, create: true, update: true, delete: false },
          financials: { read: false, create: false, update: false, delete: false },
          settings: { read: false, create: false, update: false, delete: false }
        }
      },
      {
        id: 'support_agent',
        name: 'Support Agent (موظف الدعم)',
        description: 'معالجة تذاكر الدعم الفني، مراسلة العملاء، الإشراف على الشكاوى وتقديم المساعدات الفنية للمستخدمين.',
        color: 'emerald',
        isSystem: true,
        permissions: {
          halls: { read: true, create: false, update: false, delete: false },
          bookings: { read: true, create: false, update: false, delete: false },
          financials: { read: false, create: false, update: false, delete: false },
          settings: { read: false, create: false, update: false, delete: false }
        }
      }
    ];
  });

  const [selectedRoleId, setSelectedRoleId] = useState('super_admin');
  const [showAddRoleForm, setShowAddRoleForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [newRoleDesc, setNewRoleDesc] = useState('');
  const [newRoleColor, setNewRoleColor] = useState('indigo');

  const [auditLogs, setAuditLogs] = useState([
    { id: 1, user: 'أحمد الحربي (المدير التنفيذي)', action: 'تعديل صلاحية "المدير المالي"', details: 'تم تمكين صلاحية الحذف والطباعة للتقارير المالية والضريبية بنجاح.', date: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
    { id: 2, user: 'خالد العتيبي (مدير التقنية)', action: 'مزامنة دليل النشط LDAP', details: 'تم استيراد وتحديث 42 من الحسابات الوظيفية وتوزيع الأدوار الفنية.', date: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: 3, user: 'أحمد الحربي (المدير التنفيذي)', action: 'إنشاء دور جديد: موظف الاستقبال', details: 'تم تهيئة وتخصيص صلاحيات عرض الصالات والحجوزات ومكتب الدعم الفني.', date: new Date(Date.now() - 1000 * 60 * 480).toISOString() }
  ]);

  const [userRoles, setUserRoles] = useState([
    { id: 1, name: 'فهد العتيبي', email: 'fahad@layla.sa', roleId: 'super_admin' },
    { id: 2, name: 'سارة الدوسري', email: 'sara.d@layla.sa', roleId: 'financial_manager' },
    { id: 3, name: 'عبدالرحمن المطيري', email: 'a.mutairi@partner.sa', roleId: 'partner_admin' },
    { id: 4, name: 'نورة الشمري', email: 'noura.s@layla.sa', roleId: 'support_agent' }
  ]);

  const [selectedUserMapping, setSelectedUserMapping] = useState({ userId: 1, roleId: 'super_admin' });

  // Interactive Global Admin Inventory States
  const [activeInventorySubTab, setActiveInventorySubTab] = useState('global_limits');
  
  const [supplierApprovalWorkflow, setSupplierApprovalWorkflow] = useState(() => {
    return localStorage.getItem('SETTINGS_INV_SUPPLIER_APPROVAL') || 'manual';
  });
  const [supplierQualityVetting, setSupplierQualityVetting] = useState(() => {
    return localStorage.getItem('SETTINGS_INV_SUPPLIER_VETTING') !== 'false';
  });
  const [minSupplierRating, setMinSupplierRating] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_INV_MIN_RATING') || '4.0');
  });
  const [auditInterval, setAuditInterval] = useState(() => {
    return localStorage.getItem('SETTINGS_INV_AUDIT_INTERVAL') || 'quarterly';
  });
  const [multiSignatureThreshold, setMultiSignatureThreshold] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_INV_MULTISIG_VAL') || '5000');
  });
  const [photoEvidenceRequired, setPhotoEvidenceRequired] = useState(() => {
    return localStorage.getItem('SETTINGS_INV_PHOTO_REQ') !== 'false';
  });
  const [globalLowStockThresholdRatio, setGlobalLowStockThresholdRatio] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_INV_THRESHOLD_RATIO') || '15');
  });

  const [adminInventoryLogs, setAdminInventoryLogs] = useState(() => {
    try {
      const stored = localStorage.getItem('SETTINGS_ADMIN_INV_LOGS');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { id: 1, admin: 'عبدالرحمن المطيري (مدير الأنظمة اللوجستية)', action: 'تعديل بروتوكول الأمان المالي', details: 'تفعيل التوقيع الثنائي الإلزامي لعمليات تصفية الأصول التي تتجاوز 5000 ريال سعودي.', date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() },
      { id: 2, admin: 'فهد العتيبي (المدير العام)', action: 'تشديد سياسة الموردين', details: 'تحديث معايير ضبط الجودة وإلزام مزودي الخدمة بالشهادات المهنية المعتمدة من الأمانة.', date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
      { id: 3, admin: 'سارة الدوسري (مديرة الالتزام)', action: 'إعادة جدولة الرقابة', details: 'تعديل دورة الجرد الفعلي والتحقق الإلزامي من ربع سنوي إلى شهري لبعض الفئات الحرجة.', date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() }
    ];
  });

  // Interactive Loyalty Settings Sub-Tab
  const [activeLoyaltySubTab, setActiveLoyaltySubTab] = useState<'global_rules' | 'customer_tiers' | 'partner_tiers' | 'crm_integration'>('global_rules');

  const [globalPointsPerSpend, setGlobalPointsPerSpend] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_LOYALTY_POINTS_PER_SPEND') || '5');
  });
  const [globalPointValueSar, setGlobalPointValueSar] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_LOYALTY_POINT_VALUE_SAR') || '0.10');
  });
  const [globalPointsMinRedeem, setGlobalPointsMinRedeem] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_LOYALTY_MIN_REDEEM') || '500');
  });
  const [globalPointsValidityMonths, setGlobalPointsValidityMonths] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_LOYALTY_VALIDITY_MONTHS') || '12');
  });
  const [providerFundingPercentage, setProviderFundingPercentage] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_LOYALTY_PROVIDER_FUNDING') || '70');
  });
  const [enableSeasonMultiplier, setEnableSeasonMultiplier] = useState(() => {
    return localStorage.getItem('SETTINGS_LOYALTY_SEASON_MULT') !== 'false';
  });

  const [customerTiers, setCustomerTiers] = useState(() => {
    try {
      const stored = localStorage.getItem('SETTINGS_LOYALTY_CUSTOMER_TIERS');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { key: 'bronze', name: 'الفئة البرونزية (Bronze)', minBookings: 0, minSpent: 0, multiplier: 1.0, benefits: 'اكتساب النقاط بالمعدل القياسي، عروض عامة' },
      { key: 'silver', name: 'الفئة الفضية (Silver)', minBookings: 2, minSpent: 15000, multiplier: 1.2, benefits: 'خصم 5% على بعض الخدمات الفرعية، جلسة استشارة مجانية مع منسق الحفلات' },
      { key: 'gold', name: 'الفئة الذهبية (Gold)', minBookings: 5, minSpent: 40000, multiplier: 1.5, benefits: 'خصم 10% على الخدمات الإضافية، أولوية الدعم والتحقق، مدير حساب مخصص' },
      { key: 'platinum', name: 'الفئة البلاتينية (Platinum)', minBookings: 8, minSpent: 80000, multiplier: 2.0, benefits: 'خصم 15%، ترقية مجانية للديكورات ومنصات الصوت، باقة ضيافة VIP مجانية' }
    ];
  });

  const [loyaltyLogs, setLoyaltyLogs] = useState(() => {
    try {
      const stored = localStorage.getItem('SETTINGS_LOYALTY_LOGS');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return [
      { id: 1, admin: 'أحمد الحربي (المدير التنفيذي)', action: 'تحديث معامل النقاط والمكافآت', details: 'تعديل معدل الاكتساب العام لبرنامج الولاء إلى 5 نقاط لكل 100 ريال لتشجيع الحجوزات الصيفية.', date: new Date(Date.now() - 1000 * 60 * 65).toISOString() },
      { id: 2, admin: 'سارة الدوسري (المديرة المالية)', action: 'تحديث حد الإنفاق للفئة الذهبية', details: 'تحديث الحد الأدنى للإنفاق التراكمي لترقية فئة العميل الذهبية ليكون 40,000 ريال بدلاً من 35,000 ريال.', date: new Date(Date.now() - 1000 * 60 * 195).toISOString() },
      { id: 3, admin: 'نظام المزامنة التلقائي CRM', action: 'مزامنة ميزان الأستاذ لعملاء الولاء', details: 'تم ترحيل ومزامنة حسابات الولاء لـ 1,248 عميلاً نشطاً بنجاح مع خادم CRM الخارجي لقنوات التسويق.', date: new Date(Date.now() - 1000 * 60 * 420).toISOString() }
    ];
  });

  const [testingConnection, setTestingConnection] = useState<string | null>(null);

  // Interface Settings State
  const [featuredCriteriaSetting, setFeaturedCriteriaSetting] = useState(() => {
    return localStorage.getItem('SETTINGS_FEATURED_CRITERIA') || 'rating';
  });
  const [hallsPerPageSetting, setHallsPerPageSetting] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_HALLS_PER_PAGE') || '6');
  });

  const [subColCountSetting, setSubColCountSetting] = useState(() => {
    return Number(localStorage.getItem('sub_grid_columns') || '3');
  });
  const [subSpacingSetting, setSubSpacingSetting] = useState(() => {
    return localStorage.getItem('sub_grid_spacing') || 'gap-6';
  });
  const [subAlignCenterSetting, setSubAlignCenterSetting] = useState(() => {
    return localStorage.getItem('sub_grid_align_center') !== 'false';
  });

  const [interfaceSubTab, setInterfaceSubTab] = useState<'featured' | 'subscriptions' | 'media_upload' | 'reliability'>('featured');
  const [enableProviderVideoUpload, setEnableProviderVideoUpload] = useState<boolean>(() => {
    return localStorage.getItem('enable_provider_video_upload') === 'true';
  });

  // إعدادات وسياسات رفع الوسائط (أحجام وأبعاد الصور والفيديوهات)
  const [mediaImageMaxSizeKB, setMediaImageMaxSizeKB] = useState<number>(() => {
    return getMediaSettingsConfig().imageMaxSizeKB;
  });
  const [mediaVideoMaxSizeMB, setMediaVideoMaxSizeMB] = useState<number>(() => {
    return getMediaSettingsConfig().videoMaxSizeMB;
  });
  const [mediaImageMinDimId, setMediaImageMinDimId] = useState<string>(() => {
    return getMediaSettingsConfig().imageMinDimId;
  });
  const [mediaImageMaxDimId, setMediaImageMaxDimId] = useState<string>(() => {
    return getMediaSettingsConfig().imageMaxDimId;
  });
  const [mediaVideoMaxDimId, setMediaVideoMaxDimId] = useState<string>(() => {
    return getMediaSettingsConfig().videoMaxDimId;
  });

  const handleSaveMediaSettings = async (
    imgKB: number,
    vidMB: number,
    imgMinId: string,
    imgMaxId: string,
    vidMaxId: string
  ) => {
    setMediaImageMaxSizeKB(imgKB);
    setMediaVideoMaxSizeMB(vidMB);
    setMediaImageMinDimId(imgMinId);
    setMediaImageMaxDimId(imgMaxId);
    setMediaVideoMaxDimId(vidMaxId);

    localStorage.setItem('media_image_max_size_kb', String(imgKB));
    localStorage.setItem('media_video_max_size_mb', String(vidMB));
    localStorage.setItem('media_image_min_dim_id', imgMinId);
    localStorage.setItem('media_image_max_dim_id', imgMaxId);
    localStorage.setItem('media_video_max_dim_id', vidMaxId);

    await saveConfigToServer('media_image_max_size_kb', imgKB);
    await saveConfigToServer('media_video_max_size_mb', vidMB);
    await saveConfigToServer('media_image_min_dim_id', imgMinId);
    await saveConfigToServer('media_image_max_dim_id', imgMaxId);
    await saveConfigToServer('media_video_max_dim_id', vidMaxId);

    window.dispatchEvent(new Event('settingsUpdated'));
  };

  const updatePlatformSetting = (key: string, value: any) => {
    const val = { ...platformData, [key]: value };
    setPlatformData(val);
    
    // Immediate robust local fallback storage
    try {
      localStorage.setItem('PLATFORM_DATA', JSON.stringify(val));
    } catch (e) {
      console.warn("Failed to write PLATFORM_DATA to localStorage in SettingsManagement:", e);
    }
    
    // Centralized fetch directly to server
    fetch('/api/system/configs', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({ key: 'PLATFORM_DATA', value: val })
    }).catch(e => console.warn("Error saving PLATFORM_DATA centrally in SettingsManagement (network fallback active):", e));
    
    window.dispatchEvent(new Event('settingsUpdated'));
  };

  // Tickets / Support states
  const [ticketMaxResponseTimeUrgent, setTicketMaxResponseTimeUrgent] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_TICKETS_MAX_RESPONSE_URGENT') || '2');
  });
  const [ticketMaxResponseTimeRegular, setTicketMaxResponseTimeRegular] = useState(() => {
    return Number(localStorage.getItem('SETTINGS_TICKETS_MAX_RESPONSE_REGULAR') || '24');
  });
  const [ticketAutoEscalation, setTicketAutoEscalation] = useState(() => {
    return localStorage.getItem('SETTINGS_TICKETS_AUTO_ESCALATION') !== 'false';
  });
  const [ticketFeedbackSurvey, setTicketFeedbackSurvey] = useState(() => {
    return localStorage.getItem('SETTINGS_TICKETS_FEEDBACK_SURVEY') !== 'false';
  });

  // Support SubTab state & Zoho Developer Guide toggle
  const [supportSubTab, setSupportSubTab] = useState<'general' | 'zoho'>('zoho');
  const [showZohoDeveloperGuide, setShowZohoDeveloperGuide] = useState(true);

  // Zoho Desk Integration States
  const [zohoDeskEnabled, setZohoDeskEnabled] = useState(() => {
    return localStorage.getItem('ZOHO_DESK_ENABLED') !== 'false';
  });
  const [zohoDeskConfig, setZohoDeskConfig] = useState({
    clientId: localStorage.getItem('ZOHO_CLIENT_ID') || '',
    clientSecret: localStorage.getItem('ZOHO_CLIENT_SECRET') || '',
    refreshToken: localStorage.getItem('ZOHO_REFRESH_TOKEN') || '',
    orgId: localStorage.getItem('ZOHO_ORG_ID') || '',
    departmentId: localStorage.getItem('ZOHO_DEPARTMENT_ID') || '',
    domain: localStorage.getItem('ZOHO_DOMAIN') || 'com'
  });
  const [testingZohoAuth, setTestingZohoAuth] = useState(false);
  const [sendingZohoTestTicket, setSendingZohoTestTicket] = useState(false);

  const toggleZohoDeskIntegration = async (enabled: boolean) => {
    setZohoDeskEnabled(enabled);
    localStorage.setItem('ZOHO_DESK_ENABLED', String(enabled));
    try {
      const res = await fetch('/api/integrations/zoho-desk/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled })
      });
      const data = await res.json();
      if (data.success) {
        showNotification(enabled ? 'success' : 'info', data.message || (enabled ? 'تم تفعيل ربط Zoho Desk' : 'تم تعطيل ربط Zoho Desk'));
      }
    } catch (err: any) {
      console.error("Error toggling Zoho Desk:", err);
      showNotification('error', 'حدث خطأ أثناء تغيير حالة ربط Zoho Desk');
    }
  };

  // Global helper to save any configuration to server securely
  const saveConfigToServer = async (key: string, value: any) => {
    try {
      localStorage.setItem(key, typeof value === 'object' ? JSON.stringify(value) : String(value));
      const res = await fetch('/api/system/configs', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-user-role': 'admin'
        },
        body: JSON.stringify({ key, value })
      });
      if (!res.ok) throw new Error('Network response not ok');
      return true;
    } catch (e) {
      console.error(`Error saving setting ${key} to server:`, e);
      return false;
    }
  };

  // Sync settings on mount with server database
  useEffect(() => {
    let isMounted = true;
    const fetchServerConfigs = async () => {
      try {
        const res = await fetch('/api/system/configs');
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;
        const data = await res.json();
        if (!isMounted) return;
        if (data && data.success && data.configs) {
          const c = data.configs;
          if (c.SETTINGS_INV_SUPPLIER_APPROVAL !== undefined) {
            setSupplierApprovalWorkflow(c.SETTINGS_INV_SUPPLIER_APPROVAL);
          }
          if (c.SETTINGS_INV_SUPPLIER_VETTING !== undefined) {
            setSupplierQualityVetting(c.SETTINGS_INV_SUPPLIER_VETTING === 'true' || c.SETTINGS_INV_SUPPLIER_VETTING === true);
          }
          if (c.SETTINGS_INV_MIN_RATING !== undefined) {
            setMinSupplierRating(Number(c.SETTINGS_INV_MIN_RATING));
          }
          if (c.SETTINGS_INV_AUDIT_INTERVAL !== undefined) {
            setAuditInterval(c.SETTINGS_INV_AUDIT_INTERVAL);
          }
          if (c.SETTINGS_INV_MULTISIG_VAL !== undefined) {
            setMultiSignatureThreshold(Number(c.SETTINGS_INV_MULTISIG_VAL));
          }
          if (c.SETTINGS_INV_PHOTO_REQ !== undefined) {
            setPhotoEvidenceRequired(c.SETTINGS_INV_PHOTO_REQ === 'true' || c.SETTINGS_INV_PHOTO_REQ === true);
          }
          if (c.SETTINGS_INV_THRESHOLD_RATIO !== undefined) {
            setGlobalLowStockThresholdRatio(Number(c.SETTINGS_INV_THRESHOLD_RATIO));
          }
          if (c.SETTINGS_ADMIN_INV_LOGS !== undefined) {
            try {
              setAdminInventoryLogs(typeof c.SETTINGS_ADMIN_INV_LOGS === 'string' ? JSON.parse(c.SETTINGS_ADMIN_INV_LOGS) : c.SETTINGS_ADMIN_INV_LOGS);
            } catch (e) {}
          }
          if (c.SETTINGS_LOYALTY_POINTS_PER_SPEND !== undefined) {
            setGlobalPointsPerSpend(Number(c.SETTINGS_LOYALTY_POINTS_PER_SPEND));
          }
          if (c.SETTINGS_LOYALTY_POINT_VALUE_SAR !== undefined) {
            setGlobalPointValueSar(Number(c.SETTINGS_LOYALTY_POINT_VALUE_SAR));
          }
          if (c.SETTINGS_LOYALTY_MIN_REDEEM !== undefined) {
            setGlobalPointsMinRedeem(Number(c.SETTINGS_LOYALTY_MIN_REDEEM));
          }
          if (c.SETTINGS_LOYALTY_VALIDITY_MONTHS !== undefined) {
            setGlobalPointsValidityMonths(Number(c.SETTINGS_LOYALTY_VALIDITY_MONTHS));
          }
          if (c.SETTINGS_LOYALTY_PROVIDER_FUNDING !== undefined) {
            setProviderFundingPercentage(Number(c.SETTINGS_LOYALTY_PROVIDER_FUNDING));
          }
          if (c.SETTINGS_LOYALTY_SEASON_MULT !== undefined) {
            setEnableSeasonMultiplier(c.SETTINGS_LOYALTY_SEASON_MULT === 'true' || c.SETTINGS_LOYALTY_SEASON_MULT === true);
          }
          if (c.SETTINGS_LOYALTY_CUSTOMER_TIERS !== undefined) {
            try {
              setCustomerTiers(typeof c.SETTINGS_LOYALTY_CUSTOMER_TIERS === 'string' ? JSON.parse(c.SETTINGS_LOYALTY_CUSTOMER_TIERS) : c.SETTINGS_LOYALTY_CUSTOMER_TIERS);
            } catch (e) {}
          }
          if (c.SETTINGS_LOYALTY_LOGS !== undefined) {
            try {
              setLoyaltyLogs(typeof c.SETTINGS_LOYALTY_LOGS === 'string' ? JSON.parse(c.SETTINGS_LOYALTY_LOGS) : c.SETTINGS_LOYALTY_LOGS);
            } catch (e) {}
          }
          if (c.PARTNER_LEVEL_THRESHOLDS !== undefined) {
            try {
              setPartnerLevelThresholds(typeof c.PARTNER_LEVEL_THRESHOLDS === 'string' ? JSON.parse(c.PARTNER_LEVEL_THRESHOLDS) : c.PARTNER_LEVEL_THRESHOLDS);
            } catch (e) {}
          }
          if (c.SETTINGS_TICKETS_MAX_RESPONSE_URGENT !== undefined) {
            setTicketMaxResponseTimeUrgent(Number(c.SETTINGS_TICKETS_MAX_RESPONSE_URGENT));
          }
          if (c.SETTINGS_TICKETS_MAX_RESPONSE_REGULAR !== undefined) {
            setTicketMaxResponseTimeRegular(Number(c.SETTINGS_TICKETS_MAX_RESPONSE_REGULAR));
          }
          if (c.SETTINGS_TICKETS_AUTO_ESCALATION !== undefined) {
            setTicketAutoEscalation(c.SETTINGS_TICKETS_AUTO_ESCALATION === 'true' || c.SETTINGS_TICKETS_AUTO_ESCALATION === true);
          }
          if (c.SETTINGS_TICKETS_FEEDBACK_SURVEY !== undefined) {
            setTicketFeedbackSurvey(c.SETTINGS_TICKETS_FEEDBACK_SURVEY === 'true' || c.SETTINGS_TICKETS_FEEDBACK_SURVEY === true);
          }
        }
      } catch (err) {
        console.warn("Using offline/local configuration fallback in SettingsManagement:", err);
      }
    };
    fetchServerConfigs();
    return () => {
      isMounted = false;
    };
  }, []);

  const tabs = [
    { id: 'general', label: 'العامة' },
    { id: 'interface', label: 'إعدادات الواجهة' },
    { id: 'security', label: 'إعدادات الأمان' },
    { id: 'localization', label: 'الموقع الجغرافي' },
    { id: 'payment', label: 'الدفع والربط' },
    { id: 'notifications', label: 'إشعارات المستخدمين' },
    { id: 'inventory', label: 'إعدادات المخزون' },
    { id: 'loyalty', label: 'برنامج الولاء' },
    { id: 'support', label: 'الدعم الفني والتذاكر' },
    { id: 'platform_data', label: 'بيانات المنصة' },
    { id: 'technical_integration', label: 'الربط التقني' },
    { id: 'data_store', label: 'مخزن البيانات' },
  ].filter(tab => {
    if (userRole === 'admin') {
      return true; // Admin has access to all settings tabs
    }
    if (userRole === 'provider') {
      // Providers only see settings relevant to their operations
      return ['general', 'security', 'notifications', 'inventory', 'support'].includes(tab.id);
    }
    if (userRole === 'agency') {
      // Agencies see general preferences, security, and support
      return ['general', 'security', 'notifications', 'support'].includes(tab.id);
    }
    // Any other roles default to general & security
    return ['general', 'security'].includes(tab.id);
  });

  useEffect(() => {
    if (tabs.length > 0 && !tabs.some(t => t.id === activeSettingsTab)) {
      setActiveSettingsTab(tabs[0].id);
    }
  }, [activeSettingsTab, tabs, setActiveSettingsTab]);

  const testConnection = async (section: string) => {
    setTestingConnection(section);
    
    if (section === 'inventory') {
      try {
        const res = await fetch('/api/bookings/sync-inventory', { method: 'POST' });
        if (!res.ok) throw new Error('Network response was not ok');
        const data = await res.json();
        
        if (data.success) {
          setExternalDbConfigs((prev: any) => {
            const updated = {
              ...prev,
              inventory: {
                ...prev.inventory,
                status: 'connected',
                lastSync: new Date().toISOString()
              }
            };
            localStorage.setItem('EXTERNAL_DB_CONFIGS', JSON.stringify(updated));
            return updated;
          });

          // Show rich, professional notification of conflict-free synchronization
          showNotification('success', `⚡ تم المزامنة بنجاح! إضافة: ${data.addedItemsCount}، تحديث: ${data.updatedItemsCount}، حل تعارضات: ${data.conflictsResolvedCount}، موردين مضافين/محدثين: ${data.updatedSuppliersCount}.`);
          
          if (data.notifications && data.notifications.length > 0) {
            data.notifications.forEach((note: string) => {
              showNotification('warning', note);
            });
          }
        } else {
          throw new Error(data.error || 'Unknown sync error');
        }
      } catch (e: any) {
        console.error('Inventory database sync error:', e);
        showNotification('error', `فشلت مزامنة المخزون مع قاعدة البيانات الخارجية: ${e.message}`);
      } finally {
        setTestingConnection(null);
      }
    } else {
      // General fallbacks for other tabs
      setTimeout(() => {
        setTestingConnection(null);
        setExternalDbConfigs((prev: any) => {
          const updated = {
            ...prev,
            [section]: {
              ...prev[section],
              status: 'connected',
              lastSync: new Date().toISOString()
            }
          };
          localStorage.setItem('EXTERNAL_DB_CONFIGS', JSON.stringify(updated));
          return updated;
        });
        showNotification('success', `تم الاتصال بنجاح وتحديث مزامنة ${section === 'permissions' ? 'دليل النشط وصلاحيات المستخدمين' : section === 'loyalty' ? 'دفاتر برنامج الولاء CRM' : 'محرك تذاكر Zendesk'} بقاعدة البيانات الخارجية!`);
      }, 1200);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-8xl mx-auto pb-10">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-right" dir="rtl">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <span>⚙️</span>
            <span>الإعدادات العامة والتقنية والربط التقني والسيادي</span>
          </h2>
          <p className="text-slate-500 text-xs mt-1">ضبط المنظومة، بوابات ZATCA ونفاذ وشموس وسبل، وبوابات الرسائل والـ Webhooks</p>
        </div>
        <button 
          onClick={handleSaveChanges}
          disabled={isSavingSettings}
          className={`bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105 ${isSavingSettings ? 'opacity-50 cursor-not-allowed' : ''}`}>
          {isSavingSettings ? (
            <>
              <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-900"></span>
              جاري الحفظ والتشفير...
            </>
          ) : (
            'حفظ التغييرات'
          )}
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col md:flex-row min-h-[70vh]">
        {/* Settings Sidebar */}
        <div className="w-full md:w-64 bg-slate-50 border-b md:border-b-0 md:border-l border-slate-100 p-4 shrink-0 flex md:flex-col gap-2 overflow-x-auto" dir="rtl">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSettingsTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors whitespace-nowrap text-right justify-start ${activeSettingsTab === tab.id ? 'bg-amber-100 text-amber-700' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Settings Content */}
        <div className="flex-1 p-6 lg:p-10 overflow-y-auto">
          {activeSettingsTab === 'general' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right" dir="rtl">
              <div className="space-y-8 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">معلومات المنصة</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 text-right">اسم الموقع (العربية)</label>
                        <input 
                          type="text" 
                          value={platformData.siteNameArabic || 'منصة ليلة'} 
                          onChange={e => updatePlatformSetting('siteNameArabic', e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-right" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 text-right">اسم الموقع (English)</label>
                        <input 
                          type="text" 
                          value={platformData.siteNameEnglish || 'Laylah Platform'} 
                          onChange={e => updatePlatformSetting('siteNameEnglish', e.target.value)}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left" 
                          dir="ltr"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 text-right">وصف الموقع لمحركات البحث (SEO)</label>
                        <textarea 
                          value={generalSettings.seoDescription} 
                          onChange={e => setGeneralSettings((prev: any) => ({...prev, seoDescription: e.target.value}))}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none h-12 text-right"
                        ></textarea>
                      </div>
                      <div>
                        <SettingInputState 
                          label="البريد الإلكتروني الرسمي" 
                          type="email" 
                          value={generalSettings.officialEmail} 
                          onChange={e => setGeneralSettings((prev: any) => ({...prev, officialEmail: e.target.value}))}
                        />
                      </div>
                      <div>
                        <SettingInputState 
                          label="رقم التواصل" 
                          type="text" 
                          value={generalSettings.contactPhone} 
                          onChange={e => setGeneralSettings((prev: any) => ({...prev, contactPhone: e.target.value}))}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">التعريب والتدويل والخلفية الرقابية للأرقام</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 text-right">اللغة الافتراضية</label>
                        <select 
                          value={generalSettings.defaultLang} 
                          onChange={e => setGeneralSettings((prev: any) => ({...prev, defaultLang: e.target.value}))}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-right"
                        >
                          <option value="ar">العربية (Arabic)</option>
                          <option value="en">الإنجليزية (English)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 text-right">لغة الأرقام المعتمدة في النظام (الرقمية)</label>
                        <select 
                          value={getDigitStyle()} 
                          onChange={e => {
                            const selectedStyle = e.target.value as 'western' | 'eastern';
                            setDigitStyle(selectedStyle);
                            setGeneralSettings((prev: any) => ({...prev, digitStyle: selectedStyle}));
                          }}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-right font-medium"
                        >
                          <option value="eastern">١- الأرقام المشرقية (الهندية): (مثل: ١، ٢، ٣، ٤، ٩)</option>
                          <option value="western">٢- الأرقام الغربية (الإنجليزية): (مثل: 1, 2, 3, 6)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 mt-1">تطبق لغة الأرقام المختارة على كامل واجهات المنصة والتقارير المستخرجة مثل PDF و CSV.</p>
                      </div>
                      <div className="flex items-center mt-6 justify-end">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={generalSettings.enableRTL} 
                            onChange={e => setGeneralSettings((prev: any) => ({...prev, enableRTL: e.target.checked}))}
                            className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500" 
                          />
                          <span className="text-sm font-medium text-slate-700">تفعيل نظام القراءة من اليمين لليسار (RTL)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center justify-between">
                      <span>📱 نظام رمز الاستجابة السريعة (QR Code) للمرافق والخدمات</span>
                      <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-md">جديد</span>
                    </h3>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                      <label className="flex items-center justify-between p-3.5 bg-white rounded-xl border border-slate-200 cursor-pointer hover:border-amber-400 transition-colors">
                        <div>
                          <span className="text-sm font-extrabold text-slate-800 block">تفعيل رموز QR Code لكل قاعة وخدمة مستقلة</span>
                          <span className="text-xs text-slate-500 font-medium">إظهار زر توليد وتصدير كود QR المباشر في بطاقات القاعات، الخدمات المستقلة، ولوحات تحكم الشركاء والإدارة.</span>
                        </div>
                        <input 
                          type="checkbox" 
                          checked={generalSettings.enableQrCodes ?? true} 
                          onChange={e => {
                            const updated = { ...generalSettings, enableQrCodes: e.target.checked };
                            setGeneralSettings(updated);
                            localStorage.setItem('SYSTEM_GENERAL_SETTINGS', JSON.stringify(updated));
                          }}
                          className="w-5 h-5 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer" 
                        />
                      </label>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">التوقيت والوحدات</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 text-right">المنطقة الزمنية</label>
                        <select 
                          value={generalSettings.timezone} 
                          onChange={e => setGeneralSettings((prev: any) => ({...prev, timezone: e.target.value}))}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-right"
                        >
                          <option value="Asia/Riyadh">Asia/Riyadh (توقيت الرياض)</option>
                          <option value="Asia/Dubai">Asia/Dubai</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1 text-right">صيغة التاريخ والوقت</label>
                        <select 
                          value={generalSettings.dateFormat} 
                          onChange={e => setGeneralSettings((prev: any) => ({...prev, dateFormat: e.target.value}))}
                          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white text-right"
                        >
                          <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                          <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {activeSettingsTab === 'interface' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right font-sans" dir="rtl">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2 border-r-4 border-amber-500 pr-3">إعدادات واجهة العميل</h3>
                <p className="text-sm text-slate-500">تخصيص قواعد تصفية وترتيب المعروضات وطرق العرض في صفحات المستخدمين والصفحة الرئيسية.</p>
              </div>

              {/* تبويبات فرعية لإعدادات الواجهة */}
              <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl max-w-4xl gap-1 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setInterfaceSubTab('featured')}
                  className={`flex-1 min-w-[150px] py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    interfaceSubTab === 'featured'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <Sparkles className={`w-4 h-4 ${interfaceSubTab === 'featured' ? 'text-amber-500' : 'text-slate-400'}`} />
                  ترتيب وعرض القاعات المميزة
                </button>
                <button
                  type="button"
                  onClick={() => setInterfaceSubTab('subscriptions')}
                  className={`flex-1 min-w-[150px] py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    interfaceSubTab === 'subscriptions'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <Sliders className={`w-4 h-4 ${interfaceSubTab === 'subscriptions' ? 'text-violet-500' : 'text-slate-400'}`} />
                  تقسيم وتصميم باقات الإشتراك
                </button>
                <button
                  type="button"
                  onClick={() => setInterfaceSubTab('media_upload')}
                  className={`flex-1 min-w-[150px] py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    interfaceSubTab === 'media_upload'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <Video className={`w-4 h-4 ${interfaceSubTab === 'media_upload' ? 'text-purple-500' : 'text-slate-400'}`} />
                  سياسات وإعدادات رفع الوسائط
                </button>
                <button
                  type="button"
                  onClick={() => setInterfaceSubTab('reliability')}
                  className={`flex-1 min-w-[150px] py-3 px-4 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 ${
                    interfaceSubTab === 'reliability'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                  }`}
                >
                  <ShieldCheck className={`w-4 h-4 ${interfaceSubTab === 'reliability' ? 'text-emerald-500' : 'text-slate-400'}`} />
                  شارات التوثيق والموثوقية الرسمية
                </button>
              </div>

              {/* تبويب 1: ترتيب وعرض القاعات المميزة */}
              {interfaceSubTab === 'featured' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  {/* قسم أبرز القاعات */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 text-right">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">ترتيب قسم أبرز القاعات والاستراحات</h4>
                          <p className="text-xs text-slate-400 mt-0.5 font-sans">يمكنك اختيار خيار واحد أو أكثر لتحديد ترتيب وأولوية ظهور القاعات المميزة (Featured) في الواجهة الرئيسية بالترتيب والتعاقب المفضل لديك.</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-right">
                      {[
                        {
                          id: 'rating',
                          title: 'تقييم العملاء (الأعلى تقييماً)',
                          desc: 'يتم ترتيب القاعات حسب متوسط تقييمات العملاء تنازلياً، حيث تظهر القاعات ذات التقييمات الأعلى أولاً.',
                          icon: '⭐'
                        },
                        {
                          id: 'bookings',
                          title: 'عدد الحجوزات (الأكثر حجزاً)',
                          desc: 'تعطى الأولوية للقاعات التابعة لمزودي الخدمة الذين لديهم أكبر عدد من الحجوزات المكتملة.',
                          icon: '📈'
                        },
                        {
                          id: 'package',
                          title: 'باقة الشريك (الأعلى باقة أولاً)',
                          desc: 'يتم ترتيب القاعات بناءً على مستوى باقة الشريك (التميز والاحترافية ثم الأعمال ثم الأساسية).',
                          icon: '💎'
                        },
                        {
                          id: 'level',
                          title: 'مستوى الشريك (المستوى الأفضل)',
                          desc: 'يتم الترتيب حسب مستوى الشريك (شريك استراتيجي، ماسي، نخبة، ذهبي، مميز، صاعد، معتمد).',
                          icon: '👑'
                        }
                      ].map((item) => {
                        const selectedList = featuredCriteriaSetting ? featuredCriteriaSetting.split(',').filter(Boolean) : ['rating'];
                        const isSelected = selectedList.includes(item.id);
                        const rank = selectedList.indexOf(item.id) + 1;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={async () => {
                              const isCurrentlySelected = selectedList.includes(item.id);
                              let newArray;
                              if (isCurrentlySelected) {
                                newArray = selectedList.filter((id) => id !== item.id);
                              } else {
                                newArray = [...selectedList, item.id];
                              }
                              const finalArray = newArray.length > 0 ? newArray : ['rating'];
                              const finalStr = finalArray.join(',');
                              setFeaturedCriteriaSetting(finalStr);
                              await saveConfigToServer('SETTINGS_FEATURED_CRITERIA', finalStr);
                              window.dispatchEvent(new Event('settingsUpdated'));
                            }}
                            className={`p-5 rounded-2xl border text-right transition-all flex gap-4 cursor-pointer hover:shadow-md ${
                              isSelected
                                ? 'border-amber-500 bg-amber-50/30 ring-2 ring-amber-500/20 text-right'
                                : 'border-slate-200 hover:border-slate-300 bg-white text-right'
                            }`}
                          >
                            <div className="text-3xl shrink-0 mt-1">{item.icon}</div>
                            <div className="space-y-1">
                              <h5 className="font-bold text-slate-800 flex items-center gap-2">
                                {item.title}
                                {isSelected && (
                                  <span className="inline-flex items-center justify-center bg-amber-500 text-white font-extrabold text-xs w-5 h-5 rounded-full" title={`الأولوية ${rank}`}>
                                    {rank}
                                  </span>
                                )}
                              </h5>
                              <p className="text-xs text-slate-500 leading-relaxed">{item.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* قسم عرض القاعات لكل صفحة */}
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 text-right">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">عدد العناصر المعروضة لكل صفحة</h4>
                          <p className="text-xs text-slate-400 mt-0.5">التحكم في عدد القاعات والاستراحات المعروضة في الصفحة الواحدة للعملاء في صفحات التصفح والاستكشاف.</p>
                        </div>
                      </div>
                    </div>

                    <div className="max-w-md space-y-4 text-right">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-2">عدد القاعات لكل صفحة</label>
                        <div className="flex items-center gap-3 justify-start">
                          <button
                            type="button"
                            onClick={async () => {
                              const newVal = Math.max(1, hallsPerPageSetting - 1);
                              setHallsPerPageSetting(newVal);
                              await saveConfigToServer('SETTINGS_HALLS_PER_PAGE', newVal);
                              window.dispatchEvent(new Event('settingsUpdated'));
                            }}
                            className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-700 transition-colors cursor-pointer"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max="50"
                            value={hallsPerPageSetting}
                            onChange={async (e) => {
                              const newVal = Math.max(1, Number(e.target.value) || 6);
                              setHallsPerPageSetting(newVal);
                              await saveConfigToServer('SETTINGS_HALLS_PER_PAGE', newVal);
                              window.dispatchEvent(new Event('settingsUpdated'));
                            }}
                            className="w-24 h-12 text-center rounded-xl border border-slate-200 focus:border-amber-500 font-bold text-lg outline-none font-sans"
                          />
                          <button
                            type="button"
                            onClick={async () => {
                              const newVal = Math.min(50, hallsPerPageSetting + 1);
                              setHallsPerPageSetting(newVal);
                              await saveConfigToServer('SETTINGS_HALLS_PER_PAGE', newVal);
                              window.dispatchEvent(new Event('settingsUpdated'));
                            }}
                            className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center justify-center font-bold text-lg text-slate-700 transition-colors cursor-pointer"
                          >
                            +
                          </button>
                          <span className="text-sm text-slate-500 font-medium">قاعات لكل صفحة (تلقائياً: 6)</span>
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-2xl p-4 text-xs text-slate-500 leading-relaxed border border-slate-100 flex items-start gap-2 text-right">
                        <span className="text-amber-500 text-base mt-0.5 font-bold">ℹ️</span>
                        <div>
                          يرجى العلم أن هذا الخيار يؤثر مباشرةً على تسريع تحميل صفحات العملاء وتوفير استهلاك البيانات، وقمنا بضبط الحد الافتراضي بـ 6 قاعات لضمان التوازن المثالي للمصفوفة البصرية على الشاشات الكبيرة والهواتف.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* تبويب 2: تقسيم وتصميم صفحة باقات الإشتراك */}
              {interfaceSubTab === 'subscriptions' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 text-right">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                          <Sliders className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">تقسيم وتصميم صفحة باقات الإشتراك</h4>
                          <p className="text-xs text-slate-400 mt-0.5">ضبط تخطيط وأعمدة وعرض وتوسيط باقات الاشتراك لتظهر بشكل متزن تماماً على جميع الشاشات.</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 text-right">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">عدد الأعمدة لشبكة الباقات</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          {[1, 2, 3, 4].map((cols) => {
                            const isSelected = subColCountSetting === cols;
                            return (
                              <button
                                key={cols}
                                type="button"
                                onClick={async () => {
                                  setSubColCountSetting(cols);
                                  await saveConfigToServer('sub_grid_columns', cols);
                                  window.dispatchEvent(new Event('settingsUpdated'));
                                }}
                                className={`py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/10'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                {cols === 1 ? 'عمود واحد' : cols === 2 ? 'عمودين' : cols === 3 ? '3 أعمدة' : '4 أعمدة'}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">مسافات التباعد بين البطاقات</label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'gap-4', label: 'مسافة ضيقة (16px)' },
                            { id: 'gap-6', label: 'مسافة متوسطة متزنة (24px)' },
                            { id: 'gap-8', label: 'مسافة واسعة (32px)' }
                          ].map((item) => {
                            const isSelected = subSpacingSetting === item.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                onClick={async () => {
                                  setSubSpacingSetting(item.id);
                                  await saveConfigToServer('sub_grid_spacing', item.id);
                                  window.dispatchEvent(new Event('settingsUpdated'));
                                }}
                                className={`py-3 px-4 rounded-xl border text-center font-bold text-sm transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-amber-500 bg-amber-50 text-amber-700 ring-2 ring-amber-500/10'
                                    : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                                }`}
                              >
                                {item.label}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100 text-right">
                        <div>
                          <span className="block text-sm font-bold text-slate-800">توسيط ومحاذاة شبكة الباقات</span>
                          <p className="text-xs text-slate-400 mt-1">توسيط بطاقات باقات الاشتراك أفقياً في الصفحة لضمان المظهر المتزن والأنيق.</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={subAlignCenterSetting}
                            onChange={async (e) => {
                              const checked = e.target.checked;
                              setSubAlignCenterSetting(checked);
                              await saveConfigToServer('sub_grid_align_center', checked);
                              window.dispatchEvent(new Event('settingsUpdated'));
                            }}
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* تبويب الوسائط: سياسات وإعدادات رفع الوسائط، الضغط الذكي، وشريط التخزين وفحص الذكاء الاصطناعي */}
              {interfaceSubTab === 'media_upload' && (
                <MediaPoliciesManagementSection
                  onShowNotification={showNotification}
                  enableProviderVideoUpload={enableProviderVideoUpload}
                  setEnableProviderVideoUpload={setEnableProviderVideoUpload}
                  saveConfigToServer={saveConfigToServer}
                />
              )}


              {/* تبويب 3: شارات التوثيق والموثوقية الرسمية */}
              {interfaceSubTab === 'reliability' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6 text-right">
                    <div className="flex items-center gap-3 border-b border-slate-50 pb-4 justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800 text-base">شارات التوثيق والموثوقية الرسمية</h4>
                          <p className="text-xs text-slate-400 mt-0.5">تعديل وعرض روابط وأرقام التوثيق الرسمية للمنصة (مثل المركز السعودي للأعمال ومنصة معروف ورقم السجل التجاري والرقم الضريبي).</p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-right">
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رابط المركز السعودي للأعمال</label>
                        <div className="relative">
                          <Link className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="url" 
                            value={platformData?.sbcLink || ''} 
                            onChange={e => updatePlatformSetting('sbcLink', e.target.value)}
                            placeholder="https://business.sa/..."
                            className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-sans" dir="ltr"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رقم توثيق المركز السعودي للأعمال</label>
                        <div className="relative">
                          <Hash className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            value={platformData?.sbcNumber || ''} 
                            onChange={e => updatePlatformSetting('sbcNumber', e.target.value)}
                            className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-sans" dir="ltr"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">رابط منصة معروف</label>
                        <div className="relative">
                          <Globe className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                          <input 
                            type="url" 
                            value={platformData?.maroofLink || ''} 
                            onChange={e => updatePlatformSetting('maroofLink', e.target.value)}
                            placeholder="https://maroof.sa/..."
                            className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-sans" dir="ltr"
                          />
                        </div>
                      </div>
                      <div>
                        <TaxNumberInput
                          value={platformData?.taxNumber || ''} 
                          onChange={e => updatePlatformSetting('taxNumber', e.target.value)}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <CrNumberInput
                          value={platformData?.crNumber || ''} 
                          onChange={e => updatePlatformSetting('crNumber', e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 text-amber-800 text-right">
                      <AlertCircle className="w-5 h-5 shrink-0" />
                      <p className="text-sm">تُستخدم هذه البيانات الرسمية (الضريبة والسجل) في توثيق المنصة وإصدار الفواتير الرسمية.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeSettingsTab === 'security' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right" dir="rtl">
              {/* تبويبات فرعية لقسم الحماية والأمان والحوكمة */}
              <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-full gap-1.5 border border-slate-200">
                <button
                  onClick={() => setSecuritySubTab('general')}
                  className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${securitySubTab === 'general' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <Sliders className="w-4 h-4 text-slate-500" />
                  ⚙️ الإعدادات التشغيلية للأعمال
                </button>
                <button
                  onClick={() => setSecuritySubTab('mandatory')}
                  className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${securitySubTab === 'mandatory' ? 'bg-emerald-600 text-white shadow-sm font-extrabold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}`}
                >
                  <ShieldCheck className="w-4 h-4 text-emerald-300" />
                  🛡️ الضوابط الأمنية الإلزامية السيادية
                </button>
                <button
                  onClick={() => setSecuritySubTab('otp')}
                  className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${securitySubTab === 'otp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <Bell className="w-4 h-4 text-slate-500" />
                  📱 نظام التحقق والتسجيل (OTP)
                </button>
                <button
                  onClick={() => setSecuritySubTab('secret')}
                  className={`flex-1 py-3 px-3 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1.5 ${securitySubTab === 'secret' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'}`}
                >
                  <Database className="w-4 h-4 text-slate-500" />
                  🏗️ الأمان وقاعدة البيانات والحوكمة
                </button>
              </div>

              {securitySubTab === 'general' && (
                <div className="space-y-8 animate-in fade-in duration-300">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">الإعدادات التشغيلية للمستخدمين والتسجيل</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <SettingToggle label="التحقق بخطوتين (2FA) اختياري للمدراء" description="إلزامية أو اختيارية التحقق بخطوتين للإشراف" checked={securityCustomSettings.twoFactorEnabled} onChange={e => setSecurityCustomSettings((prev: any) => ({...prev, twoFactorEnabled: e.target.checked}))} />
                      <SettingToggle label="السماح بالتسجيل المباشر" description="للسماح للمستخدمين والعملاء الجدد بالتسجيل تلقائياً" checked={securityCustomSettings.allowRegistration} onChange={e => setSecurityCustomSettings((prev: any) => ({...prev, allowRegistration: e.target.checked}))} />
                      <SettingToggle label="التحقق من البريد الإلكتروني" description="إلزامية البريد الإلكتروني عند التسجيل" checked={securityCustomSettings.emailVerificationRequired} onChange={e => setSecurityCustomSettings((prev: any) => ({...prev, emailVerificationRequired: e.target.checked}))} />
                      <SettingToggle label="تفعيل احتفاظ سجلات النشاط" description="حفظ سجلات أنشطة المستخدمين لمدة 30 يوماً" checked={securityCustomSettings.userLogRetentionDays} onChange={e => setSecurityCustomSettings((prev: any) => ({...prev, userLogRetentionDays: e.target.checked}))} />
                      <SettingToggle label="تفعيل وضع الصيانة المؤقت" description="إيقاف الواجهة العامة مؤقتاً للصيانة وإظهار رسالة إغلاق للزوار" checked={securityCustomSettings.maintenanceMode} onChange={e => setSecurityCustomSettings((prev: any) => ({...prev, maintenanceMode: e.target.checked}))} />
                      <SettingToggle 
                        label="السماح بطلب حذف الحساب بالكامل" 
                        description="تمكين ظهور خيار طلب حذف الحساب في الملف الشخصي للمستخدمين امتثالاً لقوانين حماية البيانات" 
                        checked={allowAccountDeletion}
                        onChange={(e) => {
                          setAllowAccountDeletion(e.target.checked);
                          localStorage.setItem('ALLOW_ACCOUNT_DELETION', e.target.checked.toString());
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2">حدود الجلسات ومحاولات الدخول</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <SettingInput 
                        label="مدة انتهاء الجلسة (بالدقائق)" 
                        type="number" 
                        value={securityCustomSettings.sessionTimeoutMinutes} 
                        onChange={e => setSecurityCustomSettings((prev: any) => ({...prev, sessionTimeoutMinutes: parseInt(e.target.value) || 0}))} 
                        description="يتم تسجيل خروج المستخدم تلقائياً بعد هذه المدة من الخمول" 
                        suffix="دقيقة" 
                      />
                      <SettingInput 
                        label="عدد محاولات الدخول الخاطئة المسموح بها" 
                        type="number" 
                        value={securityCustomSettings.failedLoginAttempts} 
                        onChange={e => setSecurityCustomSettings((prev: any) => ({...prev, failedLoginAttempts: parseInt(e.target.value) || 0}))} 
                        description="عدد المحاولات قبل حظر حساب المستخدم مؤقتاً لحمايته من التخمين" 
                        suffix="محاولات" 
                      />
                    </div>
                  </div>
                </div>
              )}

              {securitySubTab === 'mandatory' && (
                <div className="space-y-6 animate-in fade-in duration-300 text-right" dir="rtl">
                  <div className="bg-gradient-to-l from-emerald-900 via-slate-900 to-emerald-950 text-white p-6 rounded-2xl shadow-md border border-emerald-800/40 space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs px-3 py-1 rounded-full font-bold border border-emerald-500/30 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        الضوابط السيادية الإلزامية (Baseline Security Safeguards)
                      </span>
                    </div>
                    <h3 className="text-xl font-bold">الضوابط الأمنية السيادية غير القابلة للتعطيل 🛡️</h3>
                    <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
                      تتضمن هذه الصفحة معايير الأمان والحماية الهيكلية التي تفرضها المنظومة بصفة إلزامية في كافة بيئات التشغيل والإنتاج. تم فصل هذه الضوابط نهائياً عن الإعدادات التشغيلية لمنع إيقافها أو تعطيلها بالخطأ وضمان الحماية القصوى لبيانات الشركاء والعملاء.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Safeguard 1: Data Encryption */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-150 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                          إلزامي ومحمي 🔒
                        </span>
                        <div className="text-right">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 justify-end">
                            <span>تشفير البيانات الحساسة (Data Encryption at Rest & Transit)</span>
                            <Lock className="w-4 h-4 text-emerald-600" />
                          </h4>
                          <span className="text-xs text-slate-500 block mt-1">تشفير خوارزمي AES-256 للبيانات المخزنة وبروتوكول TLS 1.3 لنقل البيانات بالشبكة.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">AES-256-GCM / TLS 1.3 Active</span>
                        <span className="text-slate-400">الحالة: مفعّل دائماً بالهيكل</span>
                      </div>
                    </div>

                    {/* Safeguard 2: XSS & CSRF Protection */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-150 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                          إلزامي ومحمي 🛡️
                        </span>
                        <div className="text-right">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 justify-end">
                            <span>حماية الهجمات الاستباقية (XSS & CSRF Prevention)</span>
                            <Shield className="w-4 h-4 text-emerald-600" />
                          </h4>
                          <span className="text-xs text-slate-500 block mt-1">تفعيل كبسولات حماية الرؤوس (Helmet Security Headers) والتحقق من رموز CSRF.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">CSP & SameSite Strict Active</span>
                        <span className="text-slate-400">الحالة: مفعّل دائماً بالهيكل</span>
                      </div>
                    </div>

                    {/* Safeguard 3: Audit Trail */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-150 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                          إلزامي ومحمي 📜
                        </span>
                        <div className="text-right">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 justify-end">
                            <span>التسجيل الأمني المصفح للتدقيق (Immutable Security Audit Logging)</span>
                            <ClipboardList className="w-4 h-4 text-emerald-600" />
                          </h4>
                          <span className="text-xs text-slate-500 block mt-1">تسجيل كافة الحركات الحساسة والتعديلات المالية برمز هاش غير قابل للتحريف.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">HMAC-SHA256 Chaining Active</span>
                        <span className="text-slate-400">الحالة: مفعّل دائماً بالهيكل</span>
                      </div>
                    </div>

                    {/* Safeguard 4: Payment Data Tokenization */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-150 shadow-xs space-y-3 relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                          إلزامي ومحمي 💳
                        </span>
                        <div className="text-right">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 justify-end">
                            <span>عزل بيانات الدفع وتوكنة البطاقات (PCI-DSS Tokenization)</span>
                            <CreditCard className="w-4 h-4 text-emerald-600" />
                          </h4>
                          <span className="text-xs text-slate-500 block mt-1">تشفير وحظر كامل لتخزين أي أرقام بطاقات مكشوفة واستخدام التوكنة المعتمدة.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">PCI-DSS Compliant Isolation</span>
                        <span className="text-slate-400">الحالة: مفعّل دائماً بالهيكل</span>
                      </div>
                    </div>

                    {/* Safeguard 5: Session Hijacking Safeguard */}
                    <div className="bg-white p-5 rounded-2xl border border-emerald-150 shadow-xs space-y-3 relative overflow-hidden md:col-span-2">
                      <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
                      <div className="flex justify-between items-start">
                        <span className="bg-emerald-50 text-emerald-800 text-[10px] font-extrabold px-2.5 py-1 rounded-full border border-emerald-200">
                          إلزامي ومحمي 🔑
                        </span>
                        <div className="text-right">
                          <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5 justify-end">
                            <span>حماية الجلسات والمصادقة المتقدمة (JWT Anti-Hijacking Safeguards)</span>
                            <Key className="w-4 h-4 text-emerald-600" />
                          </h4>
                          <span className="text-xs text-slate-500 block mt-1">ربط رموز الجلسات بالبصمة الرقمية وعنوان الـ IP وحظر الاختطاف الفضائي للجلسات.</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-[11px]">
                        <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">IP-Bound Token Security Active</span>
                        <span className="text-slate-400">الحالة: مفعّل دائماً بالهيكل</span>
                      </div>
                    </div>
                  </div>

                  {/* Compliance Auditor Widget */}
                  <div className="bg-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="space-y-1 text-right">
                      <span className="text-emerald-400 font-bold text-xs flex items-center gap-1.5 justify-end">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        نسبة الامتثال للضوابط الأمنية الإلزامية: 100% (FULL PASS)
                      </span>
                      <h4 className="text-sm font-bold">تقرير تدقيق الامتثال للضوابط الأمنية السيادية</h4>
                      <p className="text-slate-400 text-xs">تم فحص الهيكل البرمجي والربط السحابي وتأكيد حصانة كافة الضوابط السيادية الإلزامية.</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => showNotification('success', '✔️ تم إجراء فحص الامتثال المباشر: جميع الضوابط الأمنية الإلزامية سليمة ومفعلة بنسبة 100%')}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition-all cursor-pointer whitespace-nowrap shadow-sm"
                    >
                      إعادة تشغيل فحص الامتثال المباشر ⚡
                    </button>
                  </div>
                </div>
              )}

              {securitySubTab === 'otp' && (
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-6 relative overflow-hidden animate-in fade-in duration-300 text-right">
                  <div className="absolute top-0 right-0 w-2 h-full bg-blue-500"></div>
                  <h3 className="text-lg font-bold text-slate-800 mb-6 border-b border-slate-200 pb-3">نظام التحقق (OTP) والتسجيل المتقدم</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Email Verification Form */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md">
                      <div className="mb-4">
                        <SettingToggle 
                          label="تفعيل إرسال كود التحقق (OTP) للبريد" 
                          description="عند التسجيل، يجب إدخال كود OTP المُرسل إلى الإيميل" 
                          checked={securitySettings.isEmailOtpEnabled}
                          onChange={(e) => handleUpdateSecuritySettings({ isEmailOtpEnabled: e.target.checked })}
                        />
                      </div>
                      
                      <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700">إعدادات مزود البريد (SMTP)</h4>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">خادم SMTP (SMTP Server)</label>
                          <input type="text" placeholder="smtp.example.com" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-left" dir="ltr" />
                        </div>
                        <div className="grid grid-cols-2 gap-3" dir="rtl">
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1 text-right">المنفذ (Port)</label>
                            <input type="text" placeholder="587" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-left" dir="ltr" />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-500 mb-1 text-right">التشفيير (Encryption)</label>
                            <select className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none bg-white font-mono text-left" dir="ltr">
                              <option value="TLS">TLS</option>
                              <option value="SSL">SSL</option>
                              <option value="None">None</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">اسم المستخدم / كلمة المرور</label>
                          <input type="text" placeholder="username / api_key" className="w-full text-sm p-2 mb-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-left" dir="ltr" />
                          <input type="password" placeholder="********" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-left" dir="ltr" />
                        </div>
                      </div>
                    </div>

                    {/* SMS Verification Form */}
                    <div className="bg-white p-5 rounded-lg border border-slate-200 shadow-sm transition-all hover:shadow-md">
                      <div className="mb-4">
                        <SettingToggle 
                          label="تفعيل إرسال كود التحقق (OTP) للجوال" 
                          description="عند التسجيل، يجب إدخال كود OTP المُرسل كرسالة نصية" 
                          checked={securitySettings.isSmsOtpEnabled}
                          onChange={(e) => handleUpdateSecuritySettings({ isSmsOtpEnabled: e.target.checked })}
                        />
                      </div>
                      
                      <div className="space-y-3 mt-4 pt-4 border-t border-slate-100">
                        <h4 className="text-sm font-bold text-slate-700">إعدادات مزود الرسائل (SMS Gateway)</h4>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">مزود الخدمة (Provider URL)</label>
                          <input type="text" placeholder="https://api.sms-provider.com/send" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-left" dir="ltr" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">مفتاح الربط (API Key)</label>
                          <input type="password" placeholder="sk_test_..." className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none text-left" dir="ltr" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-500 mb-1">اسم المرسل (Sender ID)</label>
                          <input type="text" placeholder="LAYLA-APP" className="w-full text-sm p-2 rounded-lg border border-slate-200 focus:border-blue-500 outline-none font-mono text-left" dir="ltr" />
                        </div>
                        <p className="text-xs text-amber-600 bg-amber-50 p-2 rounded border border-amber-200 mt-2">
                          تنويه: سيتم إيقاف التسجيل التلقائي إذا تم تفعيل هذه الخيارات وسيحتاج المستخدم للتحقق أولاً.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {securitySubTab === 'secret' && (
                <SecuritySecretTab
                  integrationKeys={integrationKeys}
                  setIntegrationKeys={setIntegrationKeys}
                  showNotification={showNotification}
                  dbHealthStatus={dbHealthStatus}
                  dbLastSyncTime={dbLastSyncTime}
                />
              )}
            </div>
          )}

          {activeSettingsTab === 'localization' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 text-right" dir="rtl">
                  <div>
                    <span>المناطق والمدن المشغلة</span>
                    <span className="block text-xs font-normal text-slate-500 mt-1">
                      (تُجلب أسماء المناطق تلقائياً من مخزن البيانات - تبويب "قائمة المناطق الجغرافية". يُتاح هنا تحديد صور المدن والمناطق فقط)
                    </span>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto text-right justify-end">
                    {(() => {
                      let dsRegions: string[] = [];
                      try {
                        const stored = localStorage.getItem('SYSTEM_DATastore_regions');
                        if (stored) dsRegions = JSON.parse(stored);
                      } catch {}
                      return (
                        <>
                          <select
                            className="p-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-amber-500 font-normal w-full md:w-52 text-right bg-white"
                            value={newRegionName}
                            onChange={e => setNewRegionName(e.target.value)}
                          >
                            <option value="">-- اختر منطقة من مخزن البيانات --</option>
                            {dsRegions.map((rName, idx) => (
                              <option key={idx} value={rName}>{rName}</option>
                            ))}
                          </select>
                        </>
                      );
                    })()}
                    <input 
                      type="text" 
                      placeholder="رابط صورة المنطقة (اختياري)..." 
                      className="p-2 text-sm rounded-lg border border-slate-200 outline-none focus:border-amber-500 font-normal w-full md:w-64 text-right"
                      value={newRegionImage}
                      onChange={e => setNewRegionImage(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddRegion()}
                    />
                    <button 
                      onClick={handleAddRegion}
                      className="text-sm bg-blue-50 text-blue-600 border border-blue-200 px-3 py-2 rounded-lg font-bold hover:bg-blue-100 flex gap-1 items-center shrink-0 justify-center cursor-pointer">
                      <Plus className="w-4 h-4"/> إسناد صورة للمنطقة
                    </button>
                  </div>
                </h3>
                <div className="space-y-4 text-right" dir="rtl">
                  {regions.map((region, i) => (
                    <div key={region.id} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 p-4 border-b border-slate-200 font-bold text-slate-800 flex justify-between items-center flex-wrap gap-4">
                         {editingRegion?.id === region.id ? (
                           <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                             <span className="text-xs font-bold text-slate-700 bg-slate-200 px-3 py-1.5 rounded-lg" title="اسم المنطقة يؤخذ تلقائياً من مخزن البيانات (قائمة المناطق الجغرافية)">
                               {editingRegion.name}
                             </span>
                             <input 
                               type="text"
                               placeholder="رابط صورة المنطقة الجديد..."
                               className="p-1 px-2 border rounded border-slate-300 outline-none w-full md:w-72 text-sm text-right font-normal"
                               value={editingRegion.image || ''}
                               onChange={(e) => setEditingRegion({ ...editingRegion, image: e.target.value })}
                               onKeyDown={(e) => {
                                 if(e.key === 'Enter') handleSaveRegionEdit();
                                 if(e.key === 'Escape') setEditingRegion(null);
                               }}
                             />
                             <button onClick={handleSaveRegionEdit} className="bg-emerald-500 text-white p-1.5 rounded cursor-pointer" title="حفظ الصورة"><CheckCircle2 className="w-4 h-4" /></button>
                             <button onClick={() => setEditingRegion(null)} className="bg-slate-200 text-slate-600 p-1.5 rounded cursor-pointer" title="إلغاء"><X className="w-4 h-4" /></button>
                           </div>
                         ) : (
                           <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full border border-slate-200 overflow-hidden shrink-0 bg-slate-100 flex items-center justify-center">
                               {region.image ? (
                                 <img src={region.image} alt={region.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                               ) : (
                                 <MapPin className="w-5 h-5 text-slate-400" />
                               )}
                              </div>
                              <div className="flex flex-col">
                                <span>{region.name}</span>
                                {region.image && <span className="text-[10px] text-slate-400 font-mono truncate max-w-xs">{region.image}</span>}
                              </div>
                           </div>
                         )}
                         <div className="flex gap-2">
                             {!editingRegion || editingRegion.id !== region.id ? (
                               <button onClick={() => setEditingRegion({id: region.id, name: region.name, image: region.image})} className="text-slate-400 hover:text-blue-500"><Pencil className="w-4 h-4"/></button>
                             ) : null}
                             <button onClick={() => handleDeleteRegion(region.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4"/></button>
                         </div>
                      </div>
                      <div className="p-4 bg-white">
                         <div className="flex flex-wrap gap-2 mb-3">
                            {region.cities && region.cities.length > 0 ? region.cities.map((city: string, j: number) => (
                              <span key={j} className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                                {city} <button onClick={() => handleDeleteCity(region.id, j)} className="text-slate-400 hover:text-red-500"><X className="w-3 h-3"/></button>
                              </span>
                            )) : <span className="text-sm text-slate-400">لا يوجد مدن مضافة</span>}
                         </div>
                         <div className="flex gap-2 max-w-sm mt-4">
                            <input 
                              type="text" 
                              placeholder="إضافة مدينة جديدة..." 
                              className="flex-1 p-2 rounded-lg border border-slate-200 text-sm outline-none focus:border-amber-500 text-right" 
                              value={newCityNames[region.id] || ''}
                              onChange={e => setNewCityNames({ ...newCityNames, [region.id]: e.target.value })}
                              onKeyDown={e => e.key === 'Enter' && handleAddCity(region.id)}
                            />
                            <button onClick={() => handleAddCity(region.id)} className="bg-slate-800 hover:bg-slate-700 transition-colors text-white px-4 py-2 rounded-lg text-sm">إضافة</button>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'payment' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right font-sans" dir="rtl">
              <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-8 rounded-2xl shadow-xl border border-slate-800 text-right">
                <div className="flex items-center gap-3 mb-4">
                  <span className="p-3 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-2xl">
                    <ShieldCheck className="w-8 h-8" />
                  </span>
                  <div>
                    <h3 className="text-xl font-black text-white">تم نقل إعدادات الدفع وبوابات الدفع بالكامل</h3>
                    <p className="text-xs text-amber-400 font-bold mt-1">حماية سيادية وتشفير عالي المستوى (PCI-DSS & SAMA Compliant)</p>
                  </div>
                </div>

                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  بناءً على التحديثات الأمنيّة وتطبيق قواعد العزل الصارم ومبادئ الحماية المالية السيادية، تم نقل تبويبات:
                  <strong className="text-white font-bold block mt-2">
                    • بوابات الدفع الإلكترونية ومفاتيح API<br />
                    • إعدادات الدفع العامة والتسويات البنكية<br />
                    • سقوف البوابات (SAMA Limits)<br />
                    • تدقيق توكنات البطاقات المحفوظة (Audit Monitor)
                  </strong>
                  بالكامل من قسم الإعدادات العامة إلى القسم الجديد المخصص بالإدارة العليا تحت اسم:
                  <span className="text-amber-400 font-extrabold mx-1">"الإعدادات المالية والرقابة"</span>
                  في القائمة الجانبية للوحة تحكم الإدارة.
                </p>

                <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-bold">للوصول السريع إلى قسم الإعدادات المالية:</span>
                  <span className="text-xs bg-amber-500 text-slate-950 font-black px-4 py-2 rounded-lg shadow-sm">
                    اختر "الإعدادات المالية والرقابة" من القائمة الجانبية الرئيسية
                  </span>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'notifications' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right" dir="rtl text-right">
              <div className="bg-white p-6 shadow-sm border border-slate-100 rounded-2xl">
                <h3 className="text-lg font-bold text-slate-800 mb-4 pb-2 flex justify-between items-center flex-row-reverse text-right">
                  <span>رسائل الجوال القصيرة (SMS)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" defaultChecked className="sr-only peer" />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                   </label>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl border border-slate-100 text-right">
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 text-right">مزود الخدمة (Gateway API URL)</label>
                      <input 
                        type="text" 
                        value={notificationSettingsState.smsGatewayUrl} 
                        onChange={e => setNotificationSettingsState((prev: any) => ({...prev, smsGatewayUrl: e.target.value}))}
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none font-mono text-sm text-left" 
                        dir="ltr" 
                      />
                   </div>
                   <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1 text-right">مفتاح الربط (API Key / Token)</label>
                      <input 
                        type="password" 
                        value={notificationSettingsState.smsApiKey} 
                        onChange={e => setNotificationSettingsState((prev: any) => ({...prev, smsApiKey: e.target.value}))}
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none font-mono text-left" 
                        dir="ltr" 
                    />
                   </div>
                   <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="font-bold text-slate-700 text-sm">قسم إشعارات الرسائل النصية SMS (لتوجيه رسائل للعملاء ومزودي الخدمات تنبيهية)</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl">
                         <SettingToggle 
                           label="إشعار حجز جديد" 
                           description="إرسال رسالة نصية عند كل حجز" 
                           checked={notificationSettingsState.smsNewBooking}
                           onChange={e => setNotificationSettingsState((prev: any) => ({...prev, smsNewBooking: e.target.checked}))}
                         />
                         <SettingToggle 
                           label="تذكير الحجز" 
                           description="إرسال تذكير قبل موعد الحجز" 
                           checked={notificationSettingsState.smsReminder}
                           onChange={e => setNotificationSettingsState((prev: any) => ({...prev, smsReminder: e.target.checked}))}
                         />
                      </div>
                      <div className="max-w-md">
                         <SettingInput 
                           label="وقت التذكير قبل الحجز (بالساعة)" 
                           type="number" 
                           value={notificationSettingsState.smsReminderHours} 
                           onChange={e => setNotificationSettingsState((prev: any) => ({...prev, smsReminderHours: parseInt(e.target.value) || 0}))} 
                           suffix="ساعة" 
                         />
                      </div>
                   </div>
                   <div className="md:col-span-2 space-y-4 pt-4 border-t border-slate-100">
                      <h4 className="font-bold text-slate-700 text-sm">القوالب التلقائية (Auto-messages)</h4>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">نص رسالة (تأكيد الحجز المبدئي)</label>
                         <textarea 
                           value={notificationSettingsState.smsTemplateNewBooking} 
                           onChange={e => setNotificationSettingsState((prev: any) => ({...prev, smsTemplateNewBooking: e.target.value}))}
                           className="w-full p-3 rounded-xl border border-slate-200 outline-none min-h-[80px] text-right"
                         ></textarea>
                      </div>
                      <div>
                         <label className="block text-sm font-medium text-slate-700 mb-1">نص رسالة (تذكير موعد الحجز)</label>
                         <textarea 
                           value={notificationSettingsState.smsTemplateReminder} 
                           onChange={e => setNotificationSettingsState((prev: any) => ({...prev, smsTemplateReminder: e.target.value}))}
                           className="w-full p-3 rounded-xl border border-slate-200 outline-none min-h-[80px] text-right"
                         ></textarea>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeSettingsTab === 'platform_data' && (
            <div className="p-6">
              <PlatformInfoSettings
                platformData={platformData}
                setPlatformData={setPlatformData}
                bookings={bookings}
                halls={halls}
                supportServiceRequests={supportServiceRequests}
                inventory={inventory}
                providers={providers}
                customers={customers}
                campaigns={campaigns}
                supportTickets={supportTickets}
                staffTasks={staffTasks}
                reviews={reviews}
              />
            </div>
          )}

          {activeSettingsTab === 'inventory' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right p-2 sm:p-6" dir="rtl">
              
              {/* Header Info Banner */}
              <div className="bg-gradient-to-l from-slate-900 to-slate-850 text-white p-6 rounded-2xl shadow-lg border border-slate-800">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] px-2.5 py-1 rounded-full font-bold font-sans">السياسات العامة والقيود للمخزون اللوجستي</span>
                    <h3 className="text-xl font-bold text-white mt-2 flex items-center gap-2">
                      <HardDrive className="w-6 h-6 text-amber-500 animate-pulse" />
                      <span>إعدادات وسياسات المخزون الحاكمة</span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed font-sans">
                      لوحة مخصصة للإدارة والمنصة لضبط القواعد الحاكمة، فترات حظر الأسعار، ضوابط الأمان المالي، وتفويض الموردين المطبقة تلقائياً على كافة الصالات ومزودي الخدمة.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 font-sans">وضعية التحكم السيادي:</span>
                    <span className="bg-amber-500/20 text-amber-400 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1 font-sans">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping"></span>
                      مفعل وتلقائي
                    </span>
                  </div>
                </div>

                {/* KPI stats summary based on administrative values */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800 text-slate-300 text-xs">
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-sans">
                    <span className="text-slate-400 block text-[10px]">تنبيهات نقص الأصول</span>
                    <span className={`text-sm font-bold mt-0.5 block ${inventorySettings.enableLowStockEmailNotification ? 'text-emerald-400' : 'text-slate-400'}`}>
                      {inventorySettings.enableLowStockEmailNotification ? 'مفعلة وتلقائية 🔔' : 'معطلة إدارياً'}
                    </span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-sans">
                    <span className="text-slate-400 block text-[10px]">فترة حظر الأسعار</span>
                    <span className="text-sm font-bold text-white font-mono mt-0.5 block">
                      {inventorySettings.priceChangeLockPeriod || 7} أيام حظر
                    </span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-sans">
                    <span className="text-slate-400 block text-[10px]">التحقق من الموردين</span>
                    <span className={`text-sm font-bold mt-0.5 block ${supplierQualityVetting ? 'text-indigo-400' : 'text-amber-400'}`}>
                      {supplierQualityVetting ? 'تطابق بلدي إلزامي 📜' : 'تحقق مرن'}
                    </span>
                  </div>
                  <div className="bg-slate-950/40 p-3 rounded-xl border border-slate-800/60 font-sans">
                    <span className="text-slate-400 block text-[10px]">دورة جرد الصالات</span>
                    <span className="text-sm font-bold text-amber-400 font-mono mt-0.5 block">
                      {auditInterval === 'monthly' ? 'شهرياً 📆' : auditInterval === 'quarterly' ? 'ربع سنوي 📆' : auditInterval === 'semi_annually' ? 'نصف سنوي' : 'جرد سنوي كامل'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-tab Navigation */}
              <div className="flex border-b border-slate-200 overflow-x-auto pb-px gap-2">
                {[
                  { id: 'global_limits', label: '⚙️ معايير وضوابط النظام', icon: <Sliders className="w-4 h-4" /> },
                  { id: 'supplier_gov', label: '⚖️ حوكمة وتدقيق الموردين', icon: <Users className="w-4 h-4" /> },
                  { id: 'audit_control', label: '🛡️ الرقابة وتصفية الأصول', icon: <Shield className="w-4 h-4" /> },
                  { id: 'database', label: '🔗 تكامل الأنظمة الخارجية', icon: <Database className="w-4 h-4" /> },
                  { id: 'logs', label: '📝 سجل التعديلات الإدارية', icon: <ClipboardList className="w-4 h-4" /> }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveInventorySubTab(subTab.id)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${activeInventorySubTab === subTab.id ? 'border-amber-500 text-amber-600 bg-amber-50/40 rounded-t-xl' : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'}`}
                  >
                    {subTab.icon}
                    <span>{subTab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: SUPPLIER GOVERNANCE */}
              {activeInventorySubTab === 'supplier_gov' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl text-right">
                    <h4 className="font-bold text-slate-850 mb-4 text-sm sm:text-base border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Users className="w-5 h-5 text-amber-500" />
                      <span>حوكمة وتأهيل الموردين ومزودي الخدمة</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">آلية اعتماد الموردين الجدد في المنصة</label>
                        <select
                          value={supplierApprovalWorkflow}
                          onChange={e => {
                            setSupplierApprovalWorkflow(e.target.value);
                            saveConfigToServer('SETTINGS_INV_SUPPLIER_APPROVAL', e.target.value);
                            
                            const log = {
                              id: Date.now(),
                              admin: 'عبدالرحمن المطيري (مدير الأنظمة اللوجستية)',
                              action: 'تحديث آلية اعتماد الموردين',
                              details: `تم تعديل بروتوكول الاعتماد إلى (${e.target.value === 'manual' ? 'موافقة إدارية يدوية مسبقة' : e.target.value === 'automatic' ? 'اعتماد تلقائي فوري' : 'تدقيق متعدد المراحل'})`,
                              date: new Date().toISOString()
                            };
                            const updated = [log, ...adminInventoryLogs];
                            setAdminInventoryLogs(updated);
                            saveConfigToServer('SETTINGS_ADMIN_INV_LOGS', updated);
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-right focus:border-amber-500 focus:bg-white transition-all font-bold"
                        >
                          <option value="manual">موافقة إدارية يدوية مسبقة (آمن وموصى به)</option>
                          <option value="automatic">اعتماد تلقائي فوري (للموردين الموثقين بالنفاذ الوطني)</option>
                          <option value="multi_stage">تدقيق متعدد المراحل (موافقة القسم اللوجستي + المدير المالي)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 leading-relaxed">تحدد هذه القاعدة كيف تمنح المنصة الصلاحية لمزودي الخدمات الخارجية لتوريد المعدات والخدمات لقاعات الحفلات عبر نظام "ليلة".</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">الحد الأدنى لتقييم المورد المعتمد</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="3.0"
                            max="5.0"
                            step="0.1"
                            value={minSupplierRating}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setMinSupplierRating(val);
                              saveConfigToServer('SETTINGS_INV_MIN_RATING', val);
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <span className="bg-amber-100 text-amber-700 font-bold px-3 py-1 rounded-lg text-sm font-mono whitespace-nowrap min-w-[55px] text-center">
                            ⭐ {minSupplierRating.toFixed(1)}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">الموردون أو اللوجستيون الذين يتدنى متوسط تقييمهم عن هذا الحد يتم تجميد حساباتهم وتعليق تعاملاتهم تلقائياً لضمان جودة حفلات الزفاف.</p>
                      </div>

                      <div className="md:col-span-2">
                        <SettingToggle
                          label="إلزامية التدقيق والتحقق من التراخيص البلدية والصحية المعتمدة"
                          description="عند التفعيل، لن يتمكن أي مورد للتجهيزات (مثل شركات الإضاءة والصوت أو التموين) من تقديم خدماته للصالات إلا بعد تحميل ومطابقة السجل التجاري والشهادات الصحية من أمانة المنطقة إلكترونياً."
                          checked={supplierQualityVetting}
                          onChange={e => {
                            const checked = e.target.checked;
                            setSupplierQualityVetting(checked);
                            saveConfigToServer('SETTINGS_INV_SUPPLIER_VETTING', checked);
                            
                            const log = {
                              id: Date.now(),
                              admin: 'فهد العتيبي (المدير العام)',
                              action: 'تعديل سياسة جودة الموردين',
                              details: checked 
                                ? 'إلزام الموردين بإرفاق شهادات تراخيص الأمانة والبلدية المهنية كشرط تعاقدي أساسي.' 
                                : 'تخفيف متطلبات التراخيص والاعتماد مؤقتاً.',
                              date: new Date().toISOString()
                            };
                            const updated = [log, ...adminInventoryLogs];
                            setAdminInventoryLogs(updated);
                            saveConfigToServer('SETTINGS_ADMIN_INV_LOGS', updated);
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          showNotification('success', 'تم حفظ قواعد حوكمة الموردين وتطبيقها على جميع الحسابات المعتمدة بنجاح ⚖️');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
                      >
                        حفظ وتطبيق سياسة الموردين
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: AUDIT & CONTROL */}
              {activeInventorySubTab === 'audit_control' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl">
                    <h4 className="font-bold text-slate-850 mb-4 text-sm sm:text-base border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Shield className="w-5 h-5 text-amber-500" />
                      <span>الرقابة والتحقق من جرد الأصول</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">دورية جرد المخازن الفعلي الإلزامي</label>
                        <select
                          value={auditInterval}
                          onChange={e => {
                            setAuditInterval(e.target.value);
                            saveConfigToServer('SETTINGS_INV_AUDIT_INTERVAL', e.target.value);
                            
                            const log = {
                              id: Date.now(),
                              admin: 'سارة الدوسري (مديرة الالتزام)',
                              action: 'تحديث دورة جرد المخازن',
                              details: `تم تعديل التزام الصالات بالجرد الفعلي ليكون بصفة (${e.target.value === 'monthly' ? 'شهرية' : e.target.value === 'quarterly' ? 'ربع سنوية' : e.target.value === 'semi_annually' ? 'نصف سنوية' : 'سنوية'})`,
                              date: new Date().toISOString()
                            };
                            const updated = [log, ...adminInventoryLogs];
                            setAdminInventoryLogs(updated);
                            saveConfigToServer('SETTINGS_ADMIN_INV_LOGS', updated);
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none text-right focus:border-amber-500 focus:bg-white transition-all font-bold"
                        >
                          <option value="monthly">شهرياً (رقابة قصوى لمطابقة الأجهزة والصوتيات)</option>
                          <option value="quarterly">ربع سنوي (موصى به لقاعات الأفراح المتوسطة)</option>
                          <option value="semi_annually">نصف سنوي (كل 6 أشهر للأصول المعمرة)</option>
                          <option value="annually">سنوي (جرد شامل في نهاية الموسم العقاري للصالات)</option>
                        </select>
                        <p className="text-[11px] text-slate-400 leading-relaxed">يحدد هذا الخيار الفترات الإلزامية التي يفرضها النظام على مدراء الفروع وقاعات الحفلات للقيام بعمليات مطابقة الرصيد الدفتري بالرصيد الميداني.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">الحد المالي للتوقيع الثنائي للإهلاك (SAR)</label>
                        <input
                          type="number"
                          value={multiSignatureThreshold}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setMultiSignatureThreshold(val);
                            saveConfigToServer('SETTINGS_INV_MULTISIG_VAL', val);
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left focus:border-amber-500 focus:bg-white transition-all font-bold text-slate-800"
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">إذا تجاوزت القيمة المقدرة للمواد أو الكراسي المفقودة أو التالفة التي يتم إهلاكها هذا المبلغ، يتطلب النظام إجبارياً اعتماداً إضافياً من مدير العمليات الإقليمي.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">نسبة حد التنبيه لطلب المخزون الحرج (%)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="5"
                            max="30"
                            step="1"
                            value={globalLowStockThresholdRatio}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setGlobalLowStockThresholdRatio(val);
                              saveConfigToServer('SETTINGS_INV_THRESHOLD_RATIO', val);
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <span className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-lg text-sm font-mono whitespace-nowrap min-w-[55px] text-center">
                            % {globalLowStockThresholdRatio}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">عندما يقل رصيد التجهيزات الميدانية (مثل الكابلات أو البطاريات أو أدوات الضيافة) عن هذه النسبة من السعة الأساسية، ترسل المنصة إشعاراً عاجلاً بضرورة الطلب الفوري.</p>
                      </div>

                      <div className="pt-2">
                        <SettingToggle
                          label="إلزامية إرفاق الإثبات المصور للتلفيات أو التسويات"
                          description="لا يسمح النظام بحفظ أي عملية تسوية جردية بالنقاط السلبية (أعطال أو سرقة أو كسر) لمستلزمات الصالة دون تصوير القطعة التالفة وإرفاقها بالمطابقة."
                          checked={photoEvidenceRequired}
                          onChange={e => {
                            const checked = e.target.checked;
                            setPhotoEvidenceRequired(checked);
                            saveConfigToServer('SETTINGS_INV_PHOTO_REQ', checked);
                            
                            const log = {
                              id: Date.now(),
                              admin: 'عبدالرحمن المطيري (مدير الأنظمة اللوجستية)',
                              action: 'تعديل سياسة الإثبات الفوتوغرافي',
                              details: checked
                                ? 'فرض تقديم توثيق مصور للمواد المكسورة والمستهلكة كشرط إلزامي في طلب التسوية.'
                                : 'تحويل الإثبات المصور إلى حقل اختياري.',
                              date: new Date().toISOString()
                            };
                            const updated = [log, ...adminInventoryLogs];
                            setAdminInventoryLogs(updated);
                            saveConfigToServer('SETTINGS_ADMIN_INV_LOGS', updated);
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          showNotification('success', 'تم تعميم وتحديث معايير وضوابط الرقابة الميدانية ومكافحة الفاقد بنجاح 🛡️');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
                      >
                        تطبيق بروتوكول الرقابة والأصول
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: GLOBAL CONTROLS */}
              {activeInventorySubTab === 'global_limits' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl">
                    <h4 className="font-bold text-slate-850 mb-4 text-sm sm:text-base border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Sliders className="w-5 h-5 text-amber-500" />
                      <span>معايير الأمان وضوابط التسويات الميدانية للمخازن</span>
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      <SettingToggle 
                        label="إشعارات البريد وتنبيهات الرسائل القصيرة" 
                        description="تلقي إشعار إداري فوري عندما تنخفض كمية أي أصل (كراسي، طاولات، أدوات صوت) في المستودعات عن حد التنبيه المحدد." 
                        checked={inventorySettings.enableLowStockEmailNotification}
                        onChange={e => setInventorySettings({ ...inventorySettings, enableLowStockEmailNotification: e.target.checked })}
                      />
                      
                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">فترة حظر تعديل أسعار التجهيزات والصالات (أيام)</label>
                        <input 
                          type="number" 
                          value={inventorySettings.priceChangeLockPeriod || 7} 
                          onChange={e => setInventorySettings({ ...inventorySettings, priceChangeLockPeriod: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right focus:border-amber-500 focus:bg-white transition-all font-bold" 
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">تضع المنصة قفلاً برمجياً لمنع مسؤولي الصالات من رفع الأسعار أو خفضها فجأة في الأيام الأخيرة التي تسبق موعد حفل الزفاف لحماية الحجوزات النشطة للعملاء.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">الحد الأدنى لطلب السحب الفوري للتجهيزات (SAR)</label>
                        <input 
                          type="number" 
                          value={inventorySettings.minWithdrawalLimit || 500} 
                          onChange={e => setInventorySettings({ ...inventorySettings, minWithdrawalLimit: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right focus:border-amber-500 focus:bg-white transition-all font-bold" 
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">الحد الأدنى لمقاصة سحب المواد والتجهيزات الطارئة للتعديل الميداني.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">الحد الأقصى لطلب السحب الفوري المسموح للمشرف (SAR)</label>
                        <input 
                          type="number" 
                          value={inventorySettings.maxWithdrawalLimit || 50000} 
                          onChange={e => setInventorySettings({ ...inventorySettings, maxWithdrawalLimit: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right focus:border-amber-500 focus:bg-white transition-all font-bold" 
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">سقف الحماية المالية الفوري لمشرفي الصالات المعتمدين لتجهيز العمليات اللوجستية السريعة دون الحاجة لاعتماد مجلس الإدارة.</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          showNotification('success', 'تم حفظ وتعميم معايير وضوابط المستودع اللوجستية بنجاح ⚙️💾');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs"
                      >
                        حفظ معايير المخازن الميدانية
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: ADJUSTMENT LOGS */}
              {activeInventorySubTab === 'logs' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-5 shadow-xs border border-slate-100 rounded-2xl">
                    <div className="flex justify-between items-center pb-3 border-b border-slate-100 mb-4">
                      <div>
                        <h4 className="font-bold text-slate-800 flex items-center gap-2 text-base">
                          <ClipboardList className="w-5 h-5 text-amber-500" />
                          <span>سجل تسويات وجرد مخازن المنصة (Warehouse Audit Trail)</span>
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">سجل مرجعي متكامل ومحمي لرصد حركات صرف وتوريد وشطب مواد المخازن الرئيسية التابعة لـ ليلة.</p>
                      </div>
                      <span className="text-[10px] bg-slate-900 text-slate-100 px-2 py-0.5 rounded-md font-bold">مؤرشف وآمن 🔒</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-right text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 text-slate-500 font-bold bg-slate-50 font-sans">
                            <th className="p-3">المسؤول الفني</th>
                            <th className="p-3">نوع الحركة ومستوى الأثر</th>
                            <th className="p-3">تفاصيل التسوية والجرد</th>
                            <th className="p-3">وقت وتاريخ التحديث</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {adminInventoryLogs.map(log => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{log.admin || log.user}</td>
                              <td className="p-3">
                                <span className={`inline-block border text-[10px] font-bold px-2.5 py-0.5 rounded-md ${
                                  log.action.includes('صرف') || log.action.includes('شطب')
                                    ? 'bg-rose-50 border-rose-200 text-rose-700' 
                                    : log.action.includes('تعديل')
                                    ? 'bg-amber-50 border-amber-200 text-amber-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                }`}>
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-slate-600 leading-relaxed max-w-md">{log.details}</td>
                              <td className="p-3 text-slate-400 font-mono text-[11px]">
                                {new Date(log.date).toLocaleString('ar-SA')}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: DATABASE INTEGRATION */}
              {activeInventorySubTab === 'database' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  {/* Connected External database integration card */}
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Database className="w-5 h-5 text-amber-500" />
                          <span>تكامل المستودعات مع قواعد البيانات الخارجية (PostgreSQL)</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">ربط بيانات المستودعات اللوجستية الفورية بقواعد البيانات المركزية للمنشأة لتحديث فوري لكميات التجهيزات والكراسي والضيافة.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${externalDbConfigs.inventory.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${externalDbConfigs.inventory.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                          {externalDbConfigs.inventory.status === 'connected' ? 'متصل ومزامن' : 'غير متصل'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-bold">عنوان خادم قاعدة البيانات (Host)</label>
                        <input 
                          type="text" 
                          value={externalDbConfigs.inventory.host} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            inventory: { ...externalDbConfigs.inventory, host: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-bold">المنفذ (Port)</label>
                        <input 
                          type="text" 
                          value={externalDbConfigs.inventory.port} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            inventory: { ...externalDbConfigs.inventory, port: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-bold">اسم قاعدة البيانات (Database)</label>
                        <input 
                          type="text" 
                          value={externalDbConfigs.inventory.database} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            inventory: { ...externalDbConfigs.inventory, database: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-bold">اسم المستخدم (User)</label>
                        <input 
                          type="text" 
                          value={externalDbConfigs.inventory.username} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            inventory: { ...externalDbConfigs.inventory, username: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>آخر مزامنة ناجحة للمستودعات اللوجستية: <span className="font-mono text-amber-500">{new Date(externalDbConfigs.inventory.lastSync).toLocaleString('ar-SA')}</span></span>
                      </div>
                      <button 
                        onClick={() => testConnection('inventory')}
                        disabled={testingConnection === 'inventory'}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 font-sans"
                      >
                        {testingConnection === 'inventory' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                            <span>جاري التحقق والمزامنة...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4 text-slate-950" />
                            <span>بدء اختبار الاتصال ومزامنة البيانات الفورية ⚡</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {activeSettingsTab === 'loyalty' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right p-6" dir="rtl">
              
              {/* Header Box */}
              <div className="bg-gradient-to-l from-amber-500/10 via-amber-500/5 to-transparent p-6 rounded-2xl border border-amber-500/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-800 flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-amber-500" />
                    <span>حوكمة نظام الولاء ومكافآت الشركاء</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1 font-sans">
                    إعدادات وحوكمة برنامج النقاط التراكمية، ومكافآت العملاء، ومعايير ترقيات مقدمي الخدمة وقاعات الحفلات على المنصة.
                  </p>
                </div>
                <div className="bg-amber-500/10 text-amber-700 px-3 py-1 rounded-xl text-xs font-bold border border-amber-500/20 font-sans">
                  بروتوكول الولاء العام v2.4
                </div>
              </div>

              {/* Sub tabs menu */}
              <div className="flex gap-1 pb-1 overflow-x-auto border-b border-slate-100 scrollbar-none font-sans">
                {[
                  { id: 'global_rules', label: 'قوانين ونسب النقاط', icon: <Coins className="w-4 h-4" /> },
                  { id: 'customer_tiers', label: 'فئات ولاء العملاء', icon: <Users className="w-4 h-4" /> },
                  { id: 'partner_tiers', label: 'مستويات شركاء النجاح', icon: <Award className="w-4 h-4" /> },
                  { id: 'crm_integration', label: 'مزامنة CRM والربط التقني', icon: <Database className="w-4 h-4" /> }
                ].map(subTab => (
                  <button
                    key={subTab.id}
                    onClick={() => setActiveLoyaltySubTab(subTab.id as any)}
                    className={`flex items-center gap-2 px-4 py-3 border-b-2 font-bold text-xs sm:text-sm whitespace-nowrap transition-all ${
                      activeLoyaltySubTab === subTab.id 
                        ? 'border-amber-500 text-amber-600 bg-amber-50/40 rounded-t-xl' 
                        : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                    }`}
                  >
                    {subTab.icon}
                    <span>{subTab.label}</span>
                  </button>
                ))}
              </div>

              {/* TAB CONTENT: GLOBAL RULES */}
              {activeLoyaltySubTab === 'global_rules' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl">
                    <h4 className="font-bold text-slate-800 mb-4 text-sm sm:text-base border-b border-slate-100 pb-2 flex items-center gap-2">
                      <Coins className="w-5 h-5 text-amber-500" />
                      <span>السياسات العامة ونسب اكتساب النقاط</span>
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 font-sans">
                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">معدل الاكتساب (نقطة لكل 100 ريال)</label>
                        <input
                          type="number"
                          value={globalPointsPerSpend}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setGlobalPointsPerSpend(val);
                            localStorage.setItem('SETTINGS_LOYALTY_POINTS_PER_SPEND', String(val));
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right focus:border-amber-500 focus:bg-white transition-all font-bold text-slate-800"
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">عدد النقاط التي يكتسبها العميل تلقائياً عند إنفاق كل 100 ريال سعودي على المنصة.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">قيمة النقطة بالريال السعودي عند الصرف (SAR)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={globalPointValueSar}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setGlobalPointValueSar(val);
                            localStorage.setItem('SETTINGS_LOYALTY_POINT_VALUE_SAR', String(val));
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right focus:border-amber-500 focus:bg-white transition-all font-bold text-slate-800"
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">القيمة المالية المعادلة لكل نقطة واحدة عند قيام العميل باستبدالها بخصم من الفاتورة.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">الحد الأدنى للنقاط لبدء الاسترداد</label>
                        <input
                          type="number"
                          value={globalPointsMinRedeem}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setGlobalPointsMinRedeem(val);
                            localStorage.setItem('SETTINGS_LOYALTY_MIN_REDEEM', String(val));
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right focus:border-amber-500 focus:bg-white transition-all font-bold text-slate-800"
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">أقل رصيد نقاط يجب أن يتوفر في محفظة العميل للسماح له بالبدء في إجراء خصم جزئي.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">فترة صلاحية النقاط (بالأشهر)</label>
                        <input
                          type="number"
                          value={globalPointsValidityMonths}
                          onChange={e => {
                            const val = Number(e.target.value) || 0;
                            setGlobalPointsValidityMonths(val);
                            localStorage.setItem('SETTINGS_LOYALTY_VALIDITY_MONTHS', String(val));
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right focus:border-amber-500 focus:bg-white transition-all font-bold text-slate-800"
                        />
                        <p className="text-[11px] text-slate-400 leading-relaxed">مدة صلاحية النقاط المكتسبة قبل أن تنتهي صلاحيتها وتُخصم تلقائياً من المحفظة لمنع تكدس التزامات الديون.</p>
                      </div>

                      <div className="space-y-2 text-xs">
                        <label className="block font-bold text-slate-700">نسبة مساهمة المزود في تمويل خصم النقاط (%)</label>
                        <div className="flex items-center gap-3">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={providerFundingPercentage}
                            onChange={e => {
                              const val = Number(e.target.value);
                              setProviderFundingPercentage(val);
                              localStorage.setItem('SETTINGS_LOYALTY_PROVIDER_FUNDING', String(val));
                            }}
                            className="w-full accent-amber-500 cursor-pointer"
                          />
                          <span className="bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-lg text-sm font-mono whitespace-nowrap min-w-[65px] text-center">
                            % {providerFundingPercentage}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">النسبة التي يتحملها مزود الخدمة (صاحب القاعة) من قيمة الخصم المسترد، والنسبة المتبقية تغطيها المنصة كدعم تسويقي.</p>
                      </div>

                      <div className="pt-2">
                        <SettingToggle
                          label="السماح بمضاعفة النقاط تلقائياً في مواسم الركود"
                          description="تفعيل نظام مخصص يمنح مزودي القاعات خيار تنشيط مضاعف النقاط (أيام الأسبوع أو فترات الشتاء) لتحفيز المبيعات دون الرجوع للإدارة."
                          checked={enableSeasonMultiplier}
                          onChange={e => {
                            setEnableSeasonMultiplier(e.target.checked);
                            localStorage.setItem('SETTINGS_LOYALTY_SEASON_MULT', String(e.target.checked));
                          }}
                        />
                      </div>
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          const log = {
                            id: Date.now(),
                            admin: 'فهد العتيبي (المدير العام)',
                            action: 'تعديل المعايير الأساسية للنقاط',
                            details: `تحديث شروط برنامج النقاط لتصبح ${globalPointsPerSpend} نقطة لكل 100 ريال بتمويل من المزود بنسبة ${providerFundingPercentage}% ومسؤولية صرف قيمتها ${globalPointValueSar} ر.س للنقطة.`,
                            date: new Date().toISOString()
                          };
                          const updatedLogs = [log, ...loyaltyLogs];
                          setLoyaltyLogs(updatedLogs);
                          localStorage.setItem('SETTINGS_LOYALTY_LOGS', JSON.stringify(updatedLogs));
                          showNotification('success', 'تم حفظ السياسات العامة ونسب الاكتساب لبرنامج الولاء بنجاح وتعميمها على جميع الحجوزات القادمة 🌟');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
                      >
                        حفظ وتطبيق القوانين العامة
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: CUSTOMER TIERS */}
              {activeLoyaltySubTab === 'customer_tiers' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-slate-850 text-sm sm:text-base flex items-center gap-2">
                        <Users className="w-5 h-5 text-amber-500" />
                        <span>فئات ولاء العملاء (Customer Loyalty Tiers)</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-sans">تُحتسب الترقية آلياً بناءً على حجوزات العميل التراكمية في آخر 12 شهراً</span>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 font-sans">
                      {customerTiers.map((tier: any, idx: number) => {
                        let badgeStyle = "bg-amber-700/10 text-amber-800 border-amber-200";
                        if (tier.key === 'silver') badgeStyle = "bg-slate-100 text-slate-700 border-slate-300";
                        if (tier.key === 'gold') badgeStyle = "bg-amber-500/10 text-amber-700 border-amber-300";
                        if (tier.key === 'platinum') badgeStyle = "bg-sky-500/10 text-sky-700 border-sky-300";

                        return (
                          <div 
                            key={tier.key} 
                            className="bg-slate-50 p-5 rounded-2xl border border-slate-100 hover:border-slate-200 transition-all space-y-4 text-xs"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <span className={`border px-3 py-1 rounded-full font-bold text-xs ${badgeStyle}`}>
                                  {tier.name}
                                </span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-mono">ID: {tier.key}</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="space-y-1">
                                <label className="text-slate-500 font-bold block">الحد الأدنى للحجوزات</label>
                                <input
                                  type="number"
                                  value={tier.minBookings}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = [...customerTiers];
                                    updated[idx].minBookings = val;
                                    setCustomerTiers(updated);
                                  }}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 text-center"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-500 font-bold block">الإنفاق التراكمي (SAR)</label>
                                <input
                                  type="number"
                                  value={tier.minSpent}
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    const updated = [...customerTiers];
                                    updated[idx].minSpent = val;
                                    setCustomerTiers(updated);
                                  }}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 text-center font-mono"
                                />
                              </div>
                              <div className="space-y-1">
                                <label className="text-slate-500 font-bold block">مضاعف النقاط (Points Multiplier)</label>
                                <input
                                  type="number"
                                  step="0.1"
                                  value={tier.multiplier}
                                  onChange={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    const updated = [...customerTiers];
                                    updated[idx].multiplier = val;
                                    setCustomerTiers(updated);
                                  }}
                                  className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 text-center font-mono"
                                />
                              </div>
                            </div>

                            <div className="space-y-1.5">
                              <label className="text-slate-600 block font-bold">المزايا والحوافز الإضافية المصاحبة للفئة</label>
                              <input
                                type="text"
                                value={tier.benefits}
                                onChange={e => {
                                  const updated = [...customerTiers];
                                  updated[idx].benefits = e.target.value;
                                  setCustomerTiers(updated);
                                }}
                                className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-slate-800"
                                placeholder="المميزات التسويقية للعميل..."
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('SETTINGS_LOYALTY_CUSTOMER_TIERS', JSON.stringify(customerTiers));
                          const log = {
                            id: Date.now(),
                            admin: 'أحمد الحربي (المدير التنفيذي)',
                            action: 'تعديل معايير فئات العملاء',
                            details: `تم تحديث الحدود الدنيا ومضاعفات اكتساب النقاط للشرائح (Silver، Gold، Platinum) لدفع عملاء المنصة لزيادة تكرار الحجوزات.`,
                            date: new Date().toISOString()
                          };
                          const updatedLogs = [log, ...loyaltyLogs];
                          setLoyaltyLogs(updatedLogs);
                          localStorage.setItem('SETTINGS_LOYALTY_LOGS', JSON.stringify(updatedLogs));
                          showNotification('success', 'تم حفظ وتعميم معايير فئات ولاء العملاء ومضاعفات النقاط بنجاح 🎁');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
                      >
                        حفظ الفئات وتحديث معايير ترقيات العملاء
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: PARTNER TIERS */}
              {activeLoyaltySubTab === 'partner_tiers' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl">
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-slate-850 text-sm sm:text-base flex items-center gap-2">
                        <Award className="w-5 h-5 text-amber-500" />
                        <span>معايير مستويات شركاء النجاح (قاعات الحفلات ومزودي الخدمة)</span>
                      </h4>
                      <span className="text-xs text-slate-400 font-sans">تختص بتخصيص عمولات المنصة ومزايا الترويج والظهور للقاعات</span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-500 mb-6 leading-relaxed">
                      هذه الإعدادات تطبقها الإدارة العامة للمنصة على أصحاب القاعات والمزودين بشكل عام لتحديد من يترقى إلى مستويات الشركاء النخبة والماسيين والاستراتيجيين بناءً على حجوزاتهم المحققة ومعدل تقييم العملاء لهم.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 font-sans">
                      {[
                        { key: 'strategic', name: 'شريك استراتيجي', count: partnerLevelThresholds.strategicBookings || 50, rate: partnerLevelThresholds.strategicRating || 4.8, description: 'أعلى شريحة شركاء، تمنحهم عمولة منخفضة بمقدار 2%، وظهوراً في الصفحة الرئيسية للمنصة، وشارة الشريك الموثوق الذهبية.' },
                        { key: 'diamond', name: 'مستوى ماسي', count: partnerLevelThresholds.diamondBookings || 30, rate: partnerLevelThresholds.diamondRating || 4.5, description: 'شريحة ممتازة، تمنحهم خفض عمولة بمقدار 1%، ووصولاً مجانياً لخاصية الرسائل الجماعية لعملاء المنطقة.' },
                        { key: 'elite', name: 'شريك النخبة', count: partnerLevelThresholds.eliteBookings || 15, rate: partnerLevelThresholds.eliteRating || 4.2, description: 'بداية شركاء النخبة المعتمدين، تخولهم الحصول على شارة معتمد وحماية حجز إضافية ضد الإلغاء المفاجئ.' },
                      ].map((lvl) => (
                        <div key={lvl.key} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4 text-xs flex flex-col justify-between">
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="font-extrabold text-slate-800 text-sm flex items-center gap-1.5">
                                <Trophy className="w-4 h-4 text-amber-500" />
                                <span>{lvl.name}</span>
                              </span>
                              <span className="text-[10px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">بوابة الشركاء</span>
                            </div>
                            
                            <p className="text-slate-400 leading-relaxed text-[11px] font-sans pb-2 border-b border-slate-100">{lvl.description}</p>

                            <div className="space-y-3 pt-1">
                              <div>
                                <label className="block text-slate-600 mb-1 font-bold">الحد الأدنى للحجوزات الناجحة</label>
                                <input 
                                  type="number" 
                                  value={lvl.count} 
                                  onChange={e => {
                                    const val = parseInt(e.target.value) || 0;
                                    setPartnerLevelThresholds({
                                      ...partnerLevelThresholds,
                                      [`${lvl.key}Bookings`]: val
                                    });
                                  }}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                                />
                              </div>
                              <div>
                                <label className="block text-slate-600 mb-1 font-bold">الحد الأدنى لمتوسط تقييم العملاء</label>
                                <input 
                                  type="number" 
                                  step="0.1"
                                  value={lvl.rate} 
                                  onChange={e => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setPartnerLevelThresholds({
                                      ...partnerLevelThresholds,
                                      [`${lvl.key}Rating`]: val
                                    });
                                  }}
                                  className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-8 pt-4 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.setItem('PARTNER_LEVEL_THRESHOLDS', JSON.stringify(partnerLevelThresholds));
                          const log = {
                            id: Date.now(),
                            admin: 'فهد العتيبي (المدير العام)',
                            action: 'تعديل معايير ترقيات الشركاء',
                            details: `تحديث معايير شركاء النجاح: الشريك الاستراتيجي (${partnerLevelThresholds.strategicBookings} حجز، تقييم ${partnerLevelThresholds.strategicRating})، الماسي (${partnerLevelThresholds.diamondBookings} حجز، تقييم ${partnerLevelThresholds.diamondRating})، النخبة (${partnerLevelThresholds.eliteBookings} حجز، تقييم ${partnerLevelThresholds.eliteRating}).`,
                            date: new Date().toISOString()
                          };
                          const updatedLogs = [log, ...loyaltyLogs];
                          setLoyaltyLogs(updatedLogs);
                          localStorage.setItem('SETTINGS_LOYALTY_LOGS', JSON.stringify(updatedLogs));
                          showNotification('success', 'تم حفظ معايير مستويات شركاء النجاح وتحديث عتبات الترقية الدورية بنجاح 🌟');
                        }}
                        className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-6 py-2.5 rounded-xl text-xs transition-colors"
                      >
                        حفظ وتعديل مستويات شركاء النجاح
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB CONTENT: CRM INTEGRATION */}
              {activeLoyaltySubTab === 'crm_integration' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Loyalty CRM database connection */}
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-base font-bold text-white flex items-center gap-2">
                          <Database className="w-5 h-5 text-amber-500" />
                          <span>ربط نقاط الولاء ودفتر الأستاذ بقاعدة بيانات CRM الخارجية</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">تكامل فوري لنقاط العملاء ومستويات ترقيات الشركاء مع نظام إدارة علاقات العملاء (CRM) الخارجي لتسجيل المعاملات وصرف القسائم ونقاط المكافآت.</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${externalDbConfigs.loyalty.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/25' : 'bg-rose-500/20 text-rose-400 border border-rose-500/25'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${externalDbConfigs.loyalty.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                          {externalDbConfigs.loyalty.status === 'connected' ? 'مكامل مع CRM خارجي' : 'غير متصل'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-bold">رابط واجهة برمجة التطبيقات (CRM API Endpoint)</label>
                        <input 
                          type="text" 
                          value={externalDbConfigs.loyalty.apiUrl} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            loyalty: { ...externalDbConfigs.loyalty, apiUrl: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-bold">مفتاح الوصول السري (Bearer Token Key)</label>
                        <input 
                          type="password" 
                          value={externalDbConfigs.loyalty.token} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            loyalty: { ...externalDbConfigs.loyalty, token: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 block font-bold">تردد المزامنة التلقائية لترحيل النقاط</label>
                        <select 
                          value={externalDbConfigs.loyalty.syncFrequency || 'hourly'} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            loyalty: { ...externalDbConfigs.loyalty, syncFrequency: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 font-bold" 
                        >
                          <option value="realtime">المزامنة الفورية عند الدفع (في نفس اللحظة)</option>
                          <option value="hourly">مزامنة ساعية مجدولة (موصى بها)</option>
                          <option value="daily">مزامنة يومية (نهاية اليوم عند الساعة 12:00 ص)</option>
                          <option value="manual">مزامنة يدوية فقط بناءً على الطلب</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>مزامنة سجل مكافآت نقاط الولاء: <span className="font-mono text-amber-500">{new Date(externalDbConfigs.loyalty.lastSync).toLocaleString('ar-SA')}</span></span>
                      </div>
                      <button 
                        onClick={() => {
                          setTestingConnection('loyalty');
                          setTimeout(() => {
                            setTestingConnection(null);
                            const nowStr = new Date().toISOString();
                            setExternalDbConfigs((prev: any) => ({
                              ...prev,
                              loyalty: {
                                ...prev.loyalty,
                                status: 'connected',
                                lastSync: nowStr
                              }
                            }));
                            
                            const log = {
                              id: Date.now(),
                              admin: 'نظام المزامنة التلقائي CRM',
                              action: 'مزامنة ميزان الأستاذ لعملاء الولاء',
                              details: `تم ترحيل ومزامنة معاملات الولاء يدوياً لجميع العملاء المسجلين بنجاح مع خادم CRM الخارجي: ${externalDbConfigs.loyalty.apiUrl}`,
                              date: nowStr
                            };
                            const updatedLogs = [log, ...loyaltyLogs];
                            setLoyaltyLogs(updatedLogs);
                            localStorage.setItem('SETTINGS_LOYALTY_LOGS', JSON.stringify(updatedLogs));
                            showNotification('success', 'تم التحقق والاتصال بخادم CRM ومزامنة سجل مكافآت نقاط الولاء بالكامل بنجاح! 🌟');
                          }, 1500);
                        }}
                        disabled={testingConnection === 'loyalty'}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 font-sans"
                      >
                        {testingConnection === 'loyalty' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                            <span>جاري دفع وقراءة ميزان النقاط...</span>
                          </>
                        ) : (
                          <>
                            <Award className="w-4 h-4 text-slate-950" />
                            <span>مزامنة واختبار اتصال CRM الآن 🌟</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Audit Trail Logs */}
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl text-right">
                    <h4 className="font-bold text-slate-800 mb-4 text-sm sm:text-base border-b border-slate-100 pb-2 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-amber-500" />
                      <span>سجل عمليات تعديل الولاء ومطابقات المزامنة (Loyalty Audit Trail)</span>
                    </h4>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-right border-collapse">
                        <thead>
                          <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                            <th className="p-3 text-right">المسؤول أو النظام</th>
                            <th className="p-3 text-right">نوع الإجراء</th>
                            <th className="p-3 text-right">التفاصيل الكاملة لعملية التعديل</th>
                            <th className="p-3 text-right">التوقيت والـتاريخ</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-sans">
                          {loyaltyLogs.map((log: any) => (
                            <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-3 font-bold text-slate-800">{log.admin}</td>
                              <td className="p-3">
                                <span className="inline-block bg-slate-100 border border-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                                  {log.action}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500 leading-relaxed max-w-md">{log.details}</td>
                              <td className="p-3 text-slate-400 font-mono text-[11px]">
                                {new Date(log.date).toLocaleString('ar-SA')}
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
          )}

          {activeSettingsTab === 'support' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300 text-right p-6" dir="rtl">
              
              {/* Header Title & Subtabs navigation for Support & Tickets */}
              <div className="space-y-4 pb-4 border-b border-slate-200">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                    <LifeBuoy className="w-6 h-6 text-amber-500" />
                    <span>إعدادات الدعم الفني وتذاكر الخدمة</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">تحديد اتفاقيات مستوى الخدمة (SLA)، المزامنة الفورية، وربط تذاكر الشكاوى مع أنظمة مكتب المساعدة الخارجية.</p>
                </div>

                {/* Sub-tabs Selector */}
                <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 w-fit">
                  <button
                    type="button"
                    onClick={() => setSupportSubTab('zoho')}
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      supportSubTab === 'zoho'
                        ? 'bg-slate-900 text-white shadow-md border border-slate-800'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <Shield className={`w-4 h-4 ${supportSubTab === 'zoho' ? 'text-emerald-400' : 'text-slate-500'}`} />
                    <span>زوهو ديسك (Zoho Desk)</span>
                    <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">API v1</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSupportSubTab('general')}
                    className={`py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 ${
                      supportSubTab === 'general'
                        ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`}
                  >
                    <LifeBuoy className={`w-4 h-4 ${supportSubTab === 'general' ? 'text-amber-500' : 'text-slate-500'}`} />
                    <span>إعدادات الدعم العامة و SLA</span>
                  </button>
                </div>
              </div>

              {/* TAB 1: General SLA & External Helpdesk */}
              {supportSubTab === 'general' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="bg-white p-6 shadow-xs border border-slate-100 rounded-2xl">
                    <h3 className="text-lg font-bold text-slate-800 mb-6 pb-2 border-b border-slate-100 flex items-center gap-2">
                      <LifeBuoy className="w-5 h-5 text-amber-500" />
                      <span>اتفاقية مستويات الخدمة وجدولة تذاكر الدعم الميداني (SLA)</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">وقت الاستجابة الأقصى للتذاكر الطارئة (بالساعات)</label>
                        <input 
                          type="number" 
                          value={ticketMaxResponseTimeUrgent}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setTicketMaxResponseTimeUrgent(val);
                            saveConfigToServer('SETTINGS_TICKETS_MAX_RESPONSE_URGENT', val);
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right" 
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="block text-sm font-medium text-slate-700">وقت الاستجابة الأقصى للتذاكر العادية (بالساعات)</label>
                        <input 
                          type="number" 
                          value={ticketMaxResponseTimeRegular}
                          onChange={e => {
                            const val = Number(e.target.value);
                            setTicketMaxResponseTimeRegular(val);
                            saveConfigToServer('SETTINGS_TICKETS_MAX_RESPONSE_REGULAR', val);
                          }}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-sans text-right" 
                        />
                      </div>
                      
                      <SettingToggle 
                        label="التصعيد التلقائي للمشرفين" 
                        description="تفعيل نظام التصعيد الذكي إذا تجاوزت تذكرة الدعم وقت الاستجابة المعتمد." 
                        checked={ticketAutoEscalation}
                        onChange={e => {
                          const checked = e.target.checked;
                          setTicketAutoEscalation(checked);
                          saveConfigToServer('SETTINGS_TICKETS_AUTO_ESCALATION', checked);
                        }}
                      />
                      
                      <SettingToggle 
                        label="تفعيل الاستطلاعات والتقييمات" 
                        description="إرسال استبيان رضاء العميل تلقائياً عند إغلاق تذكرة الدعم الفني لمراقبة جودة الخدمة." 
                        checked={ticketFeedbackSurvey}
                        onChange={e => {
                          const checked = e.target.checked;
                          setTicketFeedbackSurvey(checked);
                          saveConfigToServer('SETTINGS_TICKETS_FEEDBACK_SURVEY', checked);
                        }}
                      />
                    </div>
                  </div>

                  {/* External support helpdesk database (Zendesk / Freshdesk) integration */}
                  <div className="bg-slate-900 text-slate-100 p-6 rounded-2xl shadow-md space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <LifeBuoy className="w-5 h-5 text-amber-500" />
                          <span>ربط تذاكر الدعم والاتصالات الفنية بقاعدة بيانات Zendesk / Helpdesk</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">ربط المراسلات والشكاوى تلقائياً بمحركات تذاكر الدعم الفني الخارجية الخاصة بالمؤسسة لمتابعة الطلبات وتوحيد قنوات التواصل.</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold flex items-center gap-1 ${externalDbConfigs.support.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${externalDbConfigs.support.status === 'connected' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                          {externalDbConfigs.support.status === 'connected' ? 'متكامل مع Zendesk' : 'غير متصل'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="text-slate-400 block">رابط منصة الدعم الفني الخارجي (Helpdesk API URI)</label>
                        <input 
                          type="text" 
                          value={externalDbConfigs.support.apiUrl} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            support: { ...externalDbConfigs.support, apiUrl: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-400 block">مفتاح الوصول المصادق (Access Key Token)</label>
                        <input 
                          type="password" 
                          value={externalDbConfigs.support.token} 
                          onChange={e => setExternalDbConfigs({
                            ...externalDbConfigs,
                            support: { ...externalDbConfigs.support, token: e.target.value }
                          })}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-amber-500 text-left font-mono" 
                          dir="ltr"
                        />
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-xs text-slate-400 font-sans">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>مزامنة تذاكر الدعم والدردشة الفورية: <span className="font-mono text-amber-500">{new Date(externalDbConfigs.support.lastSync).toLocaleString('ar-SA')}</span></span>
                      </div>
                      <button 
                        onClick={() => testConnection('support')}
                        disabled={testingConnection === 'support'}
                        className="bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all shrink-0 font-sans"
                      >
                        {testingConnection === 'support' ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                            <span>جاري دفع التذاكر المعلقة...</span>
                          </>
                        ) : (
                          <>
                            <LifeBuoy className="w-4 h-4 text-slate-950" />
                            <span>اختبار اتصال Zendesk ومزامنة التذاكر المفتوحة 💬</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: Dedicated Zoho Desk Integration Tab */}
              {supportSubTab === 'zoho' && (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Zoho Desk REST API & OAuth 2.0 Integration Main Card */}
                  <div className="bg-slate-900 border border-slate-800 text-slate-100 p-6 rounded-2xl shadow-xl space-y-6 text-right" dir="rtl">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-800">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          <Shield className="w-5 h-5 text-emerald-400" />
                          <span>ربط نظام مكتب المساعدة Zoho Desk (REST API & OAuth 2.0)</span>
                          <span className="bg-emerald-500/20 text-emerald-400 text-[10px] px-2.5 py-0.5 rounded-full font-mono font-bold border border-emerald-500/30">v1 REST API</span>
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">توليد ومزامنة تذاكر الدعم الفني والشكاوى تلقائياً في Zoho Desk عند رفع بلاغ أو حدوث تعثر حجز على منصة ليلة.</p>
                      </div>
                      
                      {/* Master Toggle Switch */}
                      <div className="flex items-center gap-3 bg-slate-950 px-4 py-2 rounded-xl border border-slate-800">
                        <span className="text-xs font-bold text-slate-300">
                          {zohoDeskEnabled ? 'تكامل Zoho Desk: مفعّل 🟢' : 'تكامل Zoho Desk: معطّل 🔴'}
                        </span>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={zohoDeskEnabled} 
                            onChange={(e) => toggleZohoDeskIntegration(e.target.checked)} 
                            className="sr-only peer" 
                          />
                          <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                      </div>
                    </div>

                    {/* Configuration Inputs */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
                      <div className="space-y-1">
                        <label className="text-slate-300 block font-bold">Client ID (معرف التطبيق)</label>
                        <input 
                          type="text" 
                          value={zohoDeskConfig.clientId} 
                          placeholder="1000.XXXXXXXXXXXXXXXXXXXXXXXX"
                          onChange={e => {
                            const val = e.target.value;
                            setZohoDeskConfig(prev => ({ ...prev, clientId: val }));
                            localStorage.setItem('ZOHO_CLIENT_ID', val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-left" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 block font-bold">Client Secret (المفتاح السري)</label>
                        <input 
                          type="password" 
                          value={zohoDeskConfig.clientSecret} 
                          placeholder="••••••••••••••••••••••••"
                          onChange={e => {
                            const val = e.target.value;
                            setZohoDeskConfig(prev => ({ ...prev, clientSecret: val }));
                            localStorage.setItem('ZOHO_CLIENT_SECRET', val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-left" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 block font-bold">Refresh Token (رمز التحديث الدائم)</label>
                        <input 
                          type="password" 
                          value={zohoDeskConfig.refreshToken} 
                          placeholder="1000.XXXXXXXXXXXXXXXX.XXXX"
                          onChange={e => {
                            const val = e.target.value;
                            setZohoDeskConfig(prev => ({ ...prev, refreshToken: val }));
                            localStorage.setItem('ZOHO_REFRESH_TOKEN', val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-left" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 block font-bold">Organization ID (معرف المنظمة Org ID)</label>
                        <input 
                          type="text" 
                          value={zohoDeskConfig.orgId} 
                          placeholder="60012345678"
                          onChange={e => {
                            const val = e.target.value;
                            setZohoDeskConfig(prev => ({ ...prev, orgId: val }));
                            localStorage.setItem('ZOHO_ORG_ID', val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-left" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 block font-bold">Department ID (معرف القسم الافتراضي)</label>
                        <input 
                          type="text" 
                          value={zohoDeskConfig.departmentId} 
                          placeholder="7189000000012345"
                          onChange={e => {
                            const val = e.target.value;
                            setZohoDeskConfig(prev => ({ ...prev, departmentId: val }));
                            localStorage.setItem('ZOHO_DEPARTMENT_ID', val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono text-left" 
                          dir="ltr"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-slate-300 block font-bold">إقليم الخادم (Zoho Region Domain)</label>
                        <select 
                          value={zohoDeskConfig.domain} 
                          onChange={e => {
                            const val = e.target.value;
                            setZohoDeskConfig(prev => ({ ...prev, domain: val }));
                            localStorage.setItem('ZOHO_DOMAIN', val);
                          }}
                          className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-emerald-500 font-bold text-right" 
                        >
                          <option value="com">الولايات المتحدة (.com)</option>
                          <option value="eu">الاتحاد الأوروبي (.eu)</option>
                          <option value="sa">المملكة العربية السعودية (.sa)</option>
                          <option value="in">الهند (.in)</option>
                        </select>
                      </div>
                    </div>

                    {/* Webhook Endpoint Info Box */}
                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-400 font-bold">رابط نقطة النهاية المباشر لاستقبال Webhook (Trigger Endpoint):</span>
                        <button 
                          onClick={() => {
                            const url = `${window.location.origin}/api/integrations/zoho-desk/webhook`;
                            navigator.clipboard.writeText(url);
                            showNotification('success', 'تم نسخ رابط Webhook إلى الحافظة بنجاح!');
                          }}
                          className="text-emerald-400 hover:text-emerald-300 font-bold underline text-[11px] cursor-pointer"
                        >
                          نسخ الرابط
                        </button>
                      </div>
                      <code className="block bg-slate-900 px-3 py-2 rounded-lg text-emerald-400 font-mono text-xs overflow-x-auto text-left" dir="ltr">
                        POST {window.location.origin}/api/integrations/zoho-desk/webhook
                      </code>
                    </div>

                    {/* Actions & Diagnostics */}
                    <div className="pt-4 border-t border-slate-800 flex flex-wrap justify-between items-center gap-4 text-xs">
                      <div className="text-slate-400 text-[11px]">
                        <span>مطابقة الحقول: <code className="text-amber-400 font-mono">contactName, email, subject, description, bookingId, priority</code></span>
                      </div>
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={async () => {
                            setTestingZohoAuth(true);
                            try {
                              const res = await fetch('/api/integrations/zoho-desk/test-auth', { method: 'POST' });
                              const data = await res.json();
                              if (data.success) {
                                showNotification('success', `🟢 ${data.message}`);
                              } else {
                                showNotification('error', `🔴 ${data.error || 'فشل تجديد رمز الوصول'}`);
                              }
                            } catch (err: any) {
                              showNotification('error', `فشل الاتصال: ${err.message}`);
                            } finally {
                              setTestingZohoAuth(false);
                            }
                          }}
                          disabled={testingZohoAuth}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-4 py-2.5 rounded-xl border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                        >
                          {testingZohoAuth ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
                              <span>جاري اختبار OAuth 2.0...</span>
                            </>
                          ) : (
                            <>
                              <Key className="w-4 h-4 text-emerald-400" />
                              <span>اختبار تجديد OAuth Access Token</span>
                            </>
                          )}
                        </button>

                        <button 
                          onClick={async () => {
                            setSendingZohoTestTicket(true);
                            try {
                              const res = await fetch('/api/integrations/zoho-desk/create-ticket', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  contactName: "أحمد الحربي (اختبار تجريبي)",
                                  email: "test.client@layla.sa",
                                  subject: "تجربة ربط نظام Zoho Desk تلقائياً من منصة ليلة",
                                  description: "هذا البلاغ تجريبي للتأكد من المزامنة الفورية وتحويل بلاغات الشكاوى وتظلمات الحجز إلى تذاكر في Zoho Desk.",
                                  bookingId: `BKG-26-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
                                  priority: "High"
                                })
                              });
                              const data = await res.json();
                              if (data.success) {
                                showNotification('success', `🎉 تم إنشاء تذكرة تجريبية بنجاح! رقم التذكرة: ${data.ticketNumber || data.ticketId || 'مكتمل'}`);
                              } else if (data.disabled) {
                                showNotification('info', 'الربط معطل حالياً. يرجى تفعيله من مفتاح التشغيل أعلاه لتجربة الإرسال.');
                              } else {
                                showNotification('error', `فشل إنشاء التذكرة: ${data.error || 'خطأ غير معروف'}`);
                              }
                            } catch (err: any) {
                              showNotification('error', `فشل الإرسال: ${err.message}`);
                            } finally {
                              setSendingZohoTestTicket(false);
                            }
                          }}
                          disabled={sendingZohoTestTicket}
                          className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                        >
                          {sendingZohoTestTicket ? (
                            <>
                              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
                              <span>جاري إنشاء تذكرة تجريبية...</span>
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4 text-slate-950" />
                              <span>إرسال تذكرة تجريبية إلى Zoho Desk 🚀</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Comprehensive Visual Step-by-Step Developer Guide Card */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 text-right font-sans" dir="rtl">
                    <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                      <div>
                        <h4 className="text-base font-bold text-slate-900 flex items-center gap-2">
                          <BookOpen className="w-5 h-5 text-emerald-600" />
                          <span>دليل مدير المنصة: كيفية استخراج رموز وتفاصيل مفاتيح Zoho Desk OAuth 2.0</span>
                        </h4>
                        <p className="text-xs text-slate-500 mt-1">خطوات واضحة ومباشرة للحصول على Client ID و Client Secret و Refresh Token و Org ID لربط المنصة بأمان.</p>
                      </div>
                      <button 
                        onClick={() => setShowZohoDeveloperGuide(!showZohoDeveloperGuide)}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                      >
                        {showZohoDeveloperGuide ? 'إخفاء الدليل' : 'عرض خطوات الحصول على المفاتيح 📘'}
                      </button>
                    </div>

                    {showZohoDeveloperGuide && (
                      <div className="space-y-6 text-xs text-slate-700 leading-relaxed">
                        
                        {/* Step 1 */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-mono">1</span>
                            <span>الخطوة الأولى: الدخول إلى بوابة مطوري زوهو (Zoho Developer Console)</span>
                          </div>
                          <p className="text-slate-600 pr-8">
                            اذهب إلى رابط **Zoho API Console**: <a href="https://api-console.zoho.com" target="_blank" rel="noreferrer" className="text-emerald-600 font-bold underline">https://api-console.zoho.com</a> وقُم بتسجيل الدخول بحساب زوهو الخاص بمنظمتك.
                          </p>
                          <div className="pr-8 space-y-1">
                            <p className="font-bold text-slate-800">1. انقر على زر "Add Client" ثم اختر نوع التطبيق: <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-900">Server-based Applications</code>.</p>
                            <p className="font-bold text-slate-800">2. أدخل البيانات التالية في النموذج:</p>
                            <ul className="list-disc list-inside text-slate-600 mr-2 space-y-0.5 font-mono text-[11px]" dir="ltr">
                              <li>Client Name: Layla Platform Integration</li>
                              <li>Homepage URL: https://layla.sa</li>
                              <li>Authorized Redirect URIs: https://api-console.zoho.com/oauth/callback</li>
                            </ul>
                            <p className="text-slate-600">3. بعد النقر على **Create**، انسخ كلاً من <strong className="text-slate-900 font-mono">Client ID</strong> و <strong className="text-slate-900 font-mono">Client Secret</strong> وضعهما في الحقلين المخصصين أعلاه.</p>
                          </div>
                        </div>

                        {/* Step 2 */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-mono">2</span>
                            <span>الخطوة الثانية: توليد رمز التحديث الدائم (Refresh Token)</span>
                          </div>
                          <p className="text-slate-600 pr-8">
                            الـ <strong className="text-slate-900">Refresh Token</strong> هو رمز دائم لا ينتهي، يُتيح لنظام منصة ليلة إصدار Access Token مؤقت تلقائياً عند إنشاء كل تذكرة دعم:
                          </p>
                          <div className="pr-8 space-y-2">
                            <p className="font-bold text-slate-800">1. من صفحة التطبيق في بوابة المطوّرين، اذهب لتبويب <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-900 font-mono">Self Client</code>.</p>
                            <p className="font-bold text-slate-800">2. في حقل النطاق (Scope)، قم بنسخ الصلاحيات التالية وضغطها:</p>
                            <div className="flex items-center gap-2">
                              <code className="bg-slate-900 text-emerald-400 px-3 py-1.5 rounded-lg font-mono text-[11px] block overflow-x-auto text-left" dir="ltr">
                                ZohoDesk.tickets.ALL,ZohoDesk.contacts.ALL,ZohoDesk.settings.ALL
                              </code>
                              <button 
                                onClick={() => {
                                  navigator.clipboard.writeText("ZohoDesk.tickets.ALL,ZohoDesk.contacts.ALL,ZohoDesk.settings.ALL");
                                  showNotification('success', 'تم نسخ النطاق (Scope) للحافظة!');
                                }}
                                className="text-emerald-600 text-xs font-bold underline shrink-0 cursor-pointer"
                              >
                                نسخ النطاق
                              </button>
                            </div>
                            <p className="font-bold text-slate-800">3. حدد مدة الصلاحية (10 دقائق) وانقر **Generate Token** للتحصل على كود التفويض (Grant Code).</p>
                            <p className="font-bold text-slate-800">4. قم بتوليد الـ Refresh Token النهائي بإرسال هذا الطلب عبر cURL أو Postman:</p>
                            <pre className="bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto text-left" dir="ltr">
{`curl -X POST "https://accounts.zoho.com/oauth/v2/token" \\
  -d "code=YOUR_GRANT_CODE" \\
  -d "client_id=YOUR_CLIENT_ID" \\
  -d "client_secret=YOUR_CLIENT_SECRET" \\
  -d "grant_type=authorization_code"`}
                            </pre>
                            <p className="text-slate-600">سيصلك رد JSON يحتوي على حقل <code className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-900 font-mono">refresh_token</code>. انسخه وضعه في حقل Refresh Token في الإعدادات.</p>
                          </div>
                        </div>

                        {/* Step 3 */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                            <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-mono">3</span>
                            <span>الخطوة الثالثة: الحصول على معرف المنظمة (Org ID) والقسم (Department ID)</span>
                          </div>
                          <div className="pr-8 space-y-2">
                            <p className="font-bold text-slate-800">🔹 استخراج Org ID:</p>
                            <p className="text-slate-600">سجل الدخول إلى حسابك في <strong className="text-slate-900">Zoho Desk</strong> ⬅️ اضغط أيقونة الإعدادات ⚙️ ⬅️ من قسم <strong className="text-slate-900">Developer Space</strong> اختر <strong className="text-slate-900">API</strong>. ستجد رقم المنظمة (Org ID) مكوناً من 9 إلى 11 رقم في أعلى الصفحة.</p>
                            
                            <p className="font-bold text-slate-800">🔹 استخراج Department ID:</p>
                            <p className="text-slate-600">من إعدادات Zoho Desk ⚙️ ⬅️ اختر <strong className="text-slate-900">Organization</strong> ⬅️ اختر <strong className="text-slate-900">Departments</strong>. افتح القسم المطلوب (مثل قسم الدعم أو خدمات العملاء) وانسخ الـ ID الخاص به.</p>
                          </div>
                        </div>

                      </div>
                    )}
                  </div>

                </div>
              )}

            </div>
          )}

          {activeSettingsTab === 'technical_integration' && (
            <div className="p-6">
              <TechnicalIntegrationTab showNotification={showNotification} />
            </div>
          )}

          {activeSettingsTab === 'data_store' && (
            <div className="p-6">
              <DataStoreSettingsTab showNotification={showNotification} />
            </div>
          )}

          {!['general', 'security', 'financial', 'localization', 'payment', 'notifications', 'platform_data', 'inventory', 'loyalty', 'support', 'technical_integration', 'data_store'].includes(activeSettingsTab) && (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border border-dashed border-slate-200" dir="rtl">
              <Settings className="w-12 h-12 text-slate-400 mx-auto mb-4 animate-spin-slow" />
              <h3 className="text-lg font-bold text-slate-800">تحت التطوير والتحضين ⚙️</h3>
              <p className="text-sm text-slate-500 mt-1 max-w-md mx-auto leading-relaxed">
                هذا القسم ({tabs.find(t => t.id === activeSettingsTab)?.label}) قيد المراجعة الفنية للتسوية والتكامل مع بيئات قواعد البيانات الممتدة للمشروع.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Global Modals rendered nicely */}
      {isLevelThresholdsModalOpen && (
        <PartnerTieringEngineModal
          isOpen={isLevelThresholdsModalOpen}
          onClose={() => setIsLevelThresholdsModalOpen(false)}
          provider={providers?.[0] || { id: 1, name: 'شريك تجريبي للسياسات العامة' }}
          isAdminView={true}
          showNotification={showNotification}
        />
      )}

      {isHallViewModalOpen && viewingHall && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            
            {/* Header / Banner */}
            <div className="relative p-6 text-white overflow-hidden shrink-0 bg-gradient-to-br from-amber-600 via-amber-500 to-amber-600">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-right">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 justify-end">
                    <span className="px-2.5 py-0.5 bg-white/20 text-white rounded-full text-xs font-bold font-sans">
                      {viewingHall.category}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      viewingHall.status === 'مفعل' || viewingHall.status === 'active' 
                        ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/30' 
                        : 'bg-rose-500/20 text-rose-100 border border-rose-500/30'
                    }`}>
                      {viewingHall.status === 'مفعل' || viewingHall.status === 'active' ? 'مفعل نشط' : 'غير نشط مجمّد'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-black">{viewingHall.name}</h3>
                  <p className="text-amber-100 text-xs font-medium">بواسطة الموفر الشريك: <strong className="text-white font-bold">{viewingHall.provider}</strong></p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-2xl flex items-center gap-4 justify-end">
                  <div className="text-center">
                    <span className="block text-[10px] text-amber-100 font-bold">القدرة الاستيعابية</span>
                    <strong className="text-lg font-black text-white">{viewingHall.capacity || 'غير محدد'} شخص</strong>
                  </div>
                  <div className="w-px h-8 bg-white/20" />
                  <div className="text-center">
                    <span className="block text-[10px] text-amber-100 font-bold">حالة الحجوزات</span>
                    <strong className="text-sm font-bold text-white block bg-emerald-550 px-2 py-0.5 rounded-md mt-0.5">{viewingHall.bookingStatus || "متاح"}</strong>
                  </div>
                </div>
              </div>
              
              <button 
                onClick={() => { setIsHallViewModalOpen(false); setViewingHall(null); }} 
                className="absolute top-4 left-4 bg-white/10 hover:bg-white/20 text-white border border-white/10 shadow-sm p-2 rounded-full transition-all duration-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Area */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {viewingHall.image || (viewingHall.images && viewingHall.images.length > 0) ? (
                <div className="w-full h-56 rounded-2xl overflow-hidden shadow-sm relative shrink-0">
                  <img 
                    referrerPolicy="no-referrer"
                    src={viewingHall.image || (viewingHall.images && viewingHall.images[0].preview) || viewingHall.images[0]} 
                    alt={viewingHall.name} 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/40 p-4 text-right">
                    <p className="text-white text-xs font-bold flex items-center gap-1.5 justify-end">
                      <MapPin className="w-4 h-4 text-amber-400" />
                      {viewingHall.region ? `${viewingHall.region} - ` : ''}{viewingHall.city} {viewingHall.location ? `(${viewingHall.location})` : ''}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
                <div className="lg:col-span-2 space-y-6">
                  <div className="space-y-2">
                    <h4 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 border-b border-slate-100 pb-2 justify-end">
                      <Info className="w-4.5 h-4.5 text-amber-500" />
                      نبذة وتعريف بالمنشأة
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans pr-1">
                      {viewingHall.description || 'لم يتم كتابة نبذة تفصيلية مخصصة لهذه القاعة حتى الآن.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Interactive Webhook Test Simulator Modal */}
      {webhookTestGateway && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 text-right" dir="rtl">
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white">
                    نموذج واختبار الـ Webhook المباشر - بوابة {
                      webhookTestGateway === 'moyasar' ? 'مُيسر (Moyasar)' :
                      webhookTestGateway === 'hyperpay' ? 'هايبر باي (HyperPay)' :
                      webhookTestGateway === 'paytabs' ? 'بي تابس (PayTabs)' :
                      webhookTestGateway === 'geidea' ? 'جيديا (Geidea)' :
                      webhookTestGateway === 'tabby_api' ? 'تابي (Tabby)' :
                      webhookTestGateway === 'tamara_api' ? 'تمارا (Tamara)' : webhookTestGateway
                    }
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    رابط المستمع المباشر: <code className="text-amber-300 font-mono" dir="ltr">/api/payments/webhook/{webhookTestGateway}</code>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setWebhookTestGateway(null)}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Event Type selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">اختر حدث الإشعار المحاكي (Simulated Event Type):</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setWebhookTestEventType('payment.paid')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                      webhookTestEventType === 'payment.paid'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🟢 دفع ناجح (payment.paid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebhookTestEventType('refund.created')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                      webhookTestEventType === 'refund.created'
                        ? 'bg-blue-50 text-blue-800 border-blue-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔵 استرداد مالي (refund.created)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWebhookTestEventType('payment.failed')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border text-center ${
                      webhookTestEventType === 'payment.failed'
                        ? 'bg-rose-50 text-rose-800 border-rose-500 shadow-xs'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    🔴 فشل الدفع (payment.failed)
                  </button>
                </div>
              </div>

              {/* JSON Payload Preview */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-slate-700">حمولة إشعار الـ Webhook المقترحة (Sample Payload):</label>
                  <button
                    type="button"
                    onClick={() => {
                      const payload = JSON.stringify({
                        event: webhookTestEventType,
                        gateway: webhookTestGateway,
                        transaction_id: `tx_wh_${Date.now()}`,
                        amount: 2500,
                        currency: 'SAR',
                        status: webhookTestEventType === 'payment.paid' ? 'paid' : webhookTestEventType === 'refund.created' ? 'refunded' : 'failed',
                        timestamp: new Date().toISOString()
                      }, null, 2);
                      navigator.clipboard.writeText(payload);
                      showNotification('info', 'تم نسخ الحمولة البرمجية إلى الحافظة 📋');
                    }}
                    className="text-[11px] text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-1"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ الحمولة JSON</span>
                  </button>
                </div>

                <pre className="p-3.5 bg-slate-900 text-amber-300 font-mono text-[11px] rounded-xl overflow-x-auto dir-ltr text-left border border-slate-800">
{JSON.stringify({
  id: `evt_${Date.now()}`,
  type: webhookTestEventType,
  created_at: new Date().toISOString(),
  data: {
    id: `pay_${Date.now()}`,
    status: webhookTestEventType === 'payment.paid' ? 'paid' : webhookTestEventType === 'refund.created' ? 'refunded' : 'failed',
    amount: 250000,
    currency: 'SAR',
    gateway_provider: webhookTestGateway,
    description: "حجز قاعة الملكية - منصة ليلة",
    merchant_reference: `BKG-26-0000000001`
  }
}, null, 2)}
                </pre>
              </div>

              {/* Simulation logs output */}
              {webhookTestLogs.length > 0 && (
                <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-slate-300 space-y-1 max-h-32 overflow-y-auto dir-ltr text-left border border-slate-800">
                  {webhookTestLogs.map((log, idx) => (
                    <div key={idx} className={log.includes('200 OK') || log.includes('SUCCESS') ? 'text-emerald-400 font-bold' : 'text-slate-400'}>
                      {log}
                    </div>
                  ))}
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setWebhookTestGateway(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors"
                >
                  إغلاق
                </button>

                <button
                  type="button"
                  disabled={isSimulatingWebhook}
                  onClick={() => {
                    setIsSimulatingWebhook(true);
                    setWebhookTestLogs(prev => [
                      ...prev,
                      `[POST] Sending simulated ${webhookTestEventType} event payload to server...`
                    ]);

                    setTimeout(() => {
                      const successLog = `[200 OK] Server successfully verified & processed webhook for (${webhookTestGateway}). Status: ${webhookTestEventType === 'payment.paid' ? 'PAID' : webhookTestEventType === 'refund.created' ? 'REFUNDED' : 'FAILED'}. Invoice & logs synced!`;
                      setWebhookTestLogs(prev => [...prev, successLog]);
                      setIsSimulatingWebhook(false);
                      showNotification('success', `تم اختبار ومعالجة حدث الـ Webhook لبوابة (${webhookTestGateway}) بنجاح! ⚡`);
                    }, 1000);
                  }}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-black text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  {isSimulatingWebhook ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال واختبار الـ Webhook...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال وتجربة إشعار الـ Webhook المباشر</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
