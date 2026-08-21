import React, { useState, useEffect, useRef } from "react";
import {
  Bell,
  User,
  Menu,
  X,
  ChevronDown,
  Sun,
  Moon,
  LogIn,
  LayoutDashboard,
  Building2,
  ClipboardList,
  Receipt,
  Heart,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  LogOut,
  Settings,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Info,
  ArrowLeft,
  ChevronLeft,
  Eye,
  Megaphone,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { providers } from "../data/mockData";
import LoginModal from "./LoginModal";
import FavoriteCompareManager from "./FavoriteCompareManager";
import { useTheme } from "../context/ThemeContext";
import { getActiveProviderCapabilities, getPlanCapabilities } from "../utils/capabilityEngine";
import { AdBanner } from "./AdBanner";

export default function Header() {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => localStorage.getItem("IS_AUTHENTICATED") === "true",
  );
  const [userRole, setUserRole] = useState<
    "admin" | "provider" | "agency" | "customer"
  >(() => {
    try {
      const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const email = (user.email || "").toLowerCase();
      let role = (user.role || "").toLowerCase();

      // Dynamic hotfix for kaab909@gmail.com developer session
      if (
        email === "kaab909@gmail.com" &&
        role !== "provider" &&
        role !== "مزود"
      ) {
        role = "provider";
        user.role = "مزود";
        localStorage.setItem("currentUser", JSON.stringify(user));
      }

      // First check for explicit administrative roles
      if (
        role.includes("admin") ||
        role.includes("مدير") ||
        role.includes("مشرف")
      )
        return "admin";

      // Check in mock providers by email as a fallback/verification
      const isMockProvider = providers.find(
        (p) => p.email.toLowerCase() === email,
      );
      if (isMockProvider) {
        if (isMockProvider.role === "agency") return "agency";
        return "provider";
      }

      if (
        role.includes("provider") ||
        role.includes("مزود") ||
        role.includes("موظف") ||
        role.includes("خدمة")
      )
        return "provider";
      if (role.includes("agency") || role.includes("تسويق")) return "agency";
      return "customer";
    } catch {
      return "customer";
    }
  });
  const [platformData, setPlatformData] = useState<any>({});
  const location = useLocation();
  const navigate = useNavigate();

  // Client notifications system state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [pendingApprovalsStats, setPendingApprovalsStats] = useState<{
    hallsCount: number;
    servicesCount: number;
    providersCount: number;
    total: number;
  }>({ hallsCount: 0, servicesCount: 0, providersCount: 0, total: 0 });
  const [isPendingBannerDismissed, setIsPendingBannerDismissed] = useState(false);
  const [notifications, setNotifications] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem("CLIENT_NOTIFICATIONS");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          const seen = new Set();
          return parsed.filter((n: any) => {
            if (!n || !n.id) return false;
            if (seen.has(n.id)) return false;
            seen.add(n.id);
            return true;
          });
        }
      }
    } catch (e) {}
    return [
      {
        id: "1",
        title: "بوابة ليلة - الحساب والولاء 🎁",
        body: "أهلاً بك في منصة ليلة! تم تفعيل حسابك كعميل مميز للاستفادة من الميزات والعروض الحصرية.",
        time: "منذ دقيقة",
        isRead: false,
        type: "info",
      },
      {
        id: "2",
        title: "تأكيد الحجز والعقد 💖",
        body: "تم استلام عربون حجز قاعة ليلة العمر وتأكيد التاريخ بنجاح، العقد متاح الآن في صفحة حجوزاتي.",
        time: "منذ ساعتين",
        isRead: false,
        type: "booking",
      },
      {
        id: "3",
        title: "طلب الخدمات المساندة 📸",
        body: "تلقيت عرضاً جديداً وبأسعار منافسة لتصوير الحفلة وتنسيق باقات تقديم الورد من مزود الخدمة المعتمد.",
        time: "أمس",
        isRead: true,
        type: "service",
      },
    ];
  });

  // Persist notifications on change
  useEffect(() => {
    localStorage.setItem("CLIENT_NOTIFICATIONS", JSON.stringify(notifications));
  }, [notifications]);

  // Client real-time provider chat replies & internal mail tracker
  const processedClientMsgIdsRef = useRef<Set<number>>(new Set());
  const processedClientMailIdsRef = useRef<Set<string>>(new Set());

  // Dynamic Top Alert Banner updates
  const updateDynamicAlerts = async () => {
    try {
      const currentUserStr = localStorage.getItem("currentUser");
      if (!currentUserStr) {
        setAlerts([]);
        return;
      }
      const currentUser = JSON.parse(currentUserStr);
      const customerName = currentUser.name || '';
      const emailLower = (currentUser.email || '').toLowerCase();
      
      const newAlerts: any[] = [];
      
      if (userRole === 'admin') {
        const headers: Record<string, string> = {
          'x-user-role': 'admin',
          'x-user-name': encodeURIComponent(customerName)
        };
        
        let rawHalls: any[] = [];
        try {
          const resHalls = await fetch('/api/bookings/halls', { headers });
          if (resHalls.ok) rawHalls = await resHalls.json();
          else rawHalls = JSON.parse(localStorage.getItem('ais_halls_v2') || '[]');
        } catch (e) {
          rawHalls = JSON.parse(localStorage.getItem('ais_halls_v2') || '[]');
        }

        const pendingHalls = rawHalls.filter((h: any) => 
          h.status === 'pending' || 
          h.status === 'بانتظار الموافقة' || 
          h.status === 'waiting_approval'
        );
        
        if (pendingHalls.length > 0) {
          newAlerts.push({
            id: 'alert_pending_halls',
            type: 'warning',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `⚠️ إشعار إداري: هناك ${pendingHalls.length} طلب قاعة/مرفق جديد معلق بانتظار الموافقة والاعتماد المالي.`,
            actionLabel: 'انتقال للقرار',
            actionUrl: '/dashboard?tab=halls'
          });
        }
        
        let rawServices: any[] = [];
        try {
          const resServices = await fetch('/api/bookings/services', { headers });
          if (resServices.ok) rawServices = await resServices.json();
          else rawServices = JSON.parse(localStorage.getItem('ais_event_services_v2') || '[]');
        } catch (e) {
          rawServices = JSON.parse(localStorage.getItem('ais_event_services_v2') || '[]');
        }

        const pendingServices = rawServices.filter((s: any) => 
          s.status === 'pending' || 
          s.status === 'بانتظار الموافقة' || 
          s.adminStatus === 'pending' || 
          s.adminStatus === 'بانتظار الموافقة'
        );
        
        if (pendingServices.length > 0) {
          newAlerts.push({
            id: 'alert_pending_services',
            type: 'warning',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `📢 تنبيه مركزي: تم تسجيل ${pendingServices.length} خدمة مساندة جديدة معلقة تتطلب التدقيق والمطابقة القياسية.`,
            actionLabel: 'مراجعة الخدمات المساندة',
            actionUrl: '/dashboard?tab=services'
          });
        }
        
        let rawMails: any[] = [];
        try {
          const resConfigs = await fetch('/api/system/configs');
          if (resConfigs.ok) {
            const data = await resConfigs.json();
            if (data.success && data.configs && data.configs.PLATFORM_MAIL_MESSAGES) {
              rawMails = data.configs.PLATFORM_MAIL_MESSAGES;
            } else {
              rawMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
            }
          } else {
            rawMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
          }
        } catch (e) {
          rawMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
        }

        const unreadAdminMails = rawMails.filter((m: any) => 
          (m.recipient === 'الإدارة' || m.recipient === 'الإدارة العامة') && 
          !m.isReadByAdmin
        );
        
        if (unreadAdminMails.length > 0) {
          newAlerts.push({
            id: 'alert_unread_admin_mails',
            type: 'info',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `📬 بريد المنصة: هناك ${unreadAdminMails.length} رسالة جديدة من شركاء الخدمة بانتظار المتابعة والرد.`,
            actionLabel: 'صندوق الوارد',
            actionUrl: '/dashboard?tab=messages'
          });
        }

        // Support Tickets & Disputes Alert for Admin
        let rawTickets: any[] = [];
        try {
          const resTickets = await fetch('/api/support/tickets', { headers });
          if (resTickets.ok) {
            const data = await resTickets.json();
            rawTickets = data.tickets || (Array.isArray(data) ? data : []);
          } else {
            rawTickets = JSON.parse(localStorage.getItem('SUPPORT_TICKETS_V2') || '[]');
          }
        } catch (e) {
          rawTickets = JSON.parse(localStorage.getItem('SUPPORT_TICKETS_V2') || '[]');
        }

        const pendingTickets = rawTickets.filter((t: any) => 
          t.status === 'open' || t.status === 'مفتوحة' || t.status === 'pending' || t.status === 'قيد الانتظار' || t.category === 'dispute'
        );

        if (pendingTickets.length > 0) {
          newAlerts.push({
            id: 'alert_pending_tickets',
            type: 'warning',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `🎫 الدعم والنزاعات: هناك ${pendingTickets.length} تذكرة دعم أو شكوى نزاع مفتوحة بانتظار معالجة الإدارة.`,
            actionLabel: 'إدارة التذاكر والنزاعات',
            actionUrl: '/dashboard?tab=support'
          });
        }

        // Pending Withdrawals & Financial Requests Alert for Admin
        let pendingWithdrawalsCount = 0;
        try {
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('provider_withdrawals_') || key === 'PLATFORM_WITHDRAW_REQUESTS')) {
              const items = JSON.parse(localStorage.getItem(key) || '[]');
              if (Array.isArray(items)) {
                pendingWithdrawalsCount += items.filter((w: any) => w.status === 'معلق' || w.status === 'pending').length;
              }
            }
          }
        } catch (e) {}

        if (pendingWithdrawalsCount > 0) {
          newAlerts.push({
            id: 'alert_pending_withdrawals',
            type: 'warning',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `💸 المالية والتسويات: يوجد ${pendingWithdrawalsCount} طلب سحب أرباح للمزودين معلق يتطلب التدقيق والتحويل البنكي.`,
            actionLabel: 'إدارة التسويات المالية',
            actionUrl: '/dashboard?tab=finance'
          });
        }

        // Pending Compliance Documents & Provider Verification Alert for Admin
        let pendingDocsCount = 0;
        try {
          const storedProviders = JSON.parse(localStorage.getItem('ais_providers_v2') || '[]');
          if (Array.isArray(storedProviders)) {
            pendingDocsCount = storedProviders.filter((p: any) => 
              p.verificationStatus === 'pending' || p.status === 'قيد المراجعة' || p.documentsStatus === 'pending'
            ).length;
          }
        } catch (e) {}

        if (pendingDocsCount > 0) {
          newAlerts.push({
            id: 'alert_pending_provider_docs',
            type: 'info',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `📋 امتثال الشركاء: هناك ${pendingDocsCount} شركاء جدد قاموا برفع السجل التجاري والوثائق بانتظار المطابقة.`,
            actionLabel: 'مراجعة الشركاء',
            actionUrl: '/dashboard?tab=partners'
          });
        }

        // Force Majeure & Emergency Claims Alert for Admin
        let pendingForceMajeureCount = 0;
        try {
          const forceMajeureList = JSON.parse(localStorage.getItem('force_majeure_requests') || '[]');
          if (Array.isArray(forceMajeureList)) {
            pendingForceMajeureCount = forceMajeureList.filter((f: any) => f.status === 'pending' || f.status === 'قيد الدراسة' || f.status === 'قيد المراجعة').length;
          }
        } catch (e) {}

        if (pendingForceMajeureCount > 0) {
          newAlerts.push({
            id: 'alert_pending_force_majeure',
            type: 'warning',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `🚨 القوة القاهرة والظروف الطارئة: هناك ${pendingForceMajeureCount} طلب إلغاء طارئ بحاجة للبت السيادي المالي من الإدارة.`,
            actionLabel: 'معالجة القوة القاهرة',
            actionUrl: '/dashboard?tab=bookings'
          });
        }

        // High-Value Transactions Alert for Admin (> 50,000 SAR)
        let highValuePendingBookings = 0;
        try {
          const storedBookings = JSON.parse(localStorage.getItem('ais_bookings_v2') || '[]');
          if (Array.isArray(storedBookings)) {
            highValuePendingBookings = storedBookings.filter((b: any) => 
              ((b.totalAmount && b.totalAmount >= 50000) || (b.totalPrice && b.totalPrice >= 50000) || (b.amount && b.amount >= 50000)) &&
              (b.status === 'pending' || b.status === 'مؤكد جزئياً' || b.paymentStatus === 'موقوف بالمحفظة')
            ).length;
          }
        } catch (e) {}

        if (highValuePendingBookings > 0) {
          newAlerts.push({
            id: 'alert_high_value_bookings',
            type: 'info',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `💎 المعاملات الكبرى: تم رصد ${highValuePendingBookings} معاملات حجز كبرى (تتجاوز 50,000 ر.س) تحت الرقابة والتدقيق المالي المباشر.`,
            actionLabel: 'المركز المالي والحسابات',
            actionUrl: '/dashboard?tab=finance'
          });
        }

        const totalPendingApprovals = pendingHalls.length + pendingServices.length + pendingDocsCount;
        setPendingApprovalsStats({
          hallsCount: pendingHalls.length,
          servicesCount: pendingServices.length,
          providersCount: pendingDocsCount,
          total: totalPendingApprovals,
        });

        if (totalPendingApprovals > 0) {
          newAlerts.push({
            id: 'alert_total_pending_facility_approvals',
            type: 'warning',
            isSovereignOperationalAlert: true,
            nonDisableable: true,
            message: `⚡ سرعة الاستجابة التشغيلية: يوجد ${totalPendingApprovals} طلبات اعتماد معلقة للمنشآت والقاعات بانتظار المعالجة والبت المباشر (${pendingHalls.length} قاعات، ${pendingServices.length} خدمات، ${pendingDocsCount} شركاء).`,
            actionLabel: 'معالجة والبت في الطلبات',
            actionUrl: '/dashboard?tab=partner_requests'
          });
        }
      } else if (userRole === 'provider') {
        const headers: Record<string, string> = {
          'x-user-role': 'provider',
          'x-user-name': encodeURIComponent(customerName)
        };

        let rawHalls: any[] = [];
        try {
          const resHalls = await fetch('/api/bookings/halls', { headers });
          if (resHalls.ok) rawHalls = await resHalls.json();
          else rawHalls = JSON.parse(localStorage.getItem('ais_halls_v2') || '[]');
        } catch (e) {
          rawHalls = JSON.parse(localStorage.getItem('ais_halls_v2') || '[]');
        }

        const myHalls = rawHalls.filter((h: any) => h.provider === customerName || String(h.providerId) === String(currentUser.id));
        
        const approvedHalls = myHalls.filter((h: any) => h.status === 'active' || h.status === 'مفعل' || h.status === 'approved');
        const pendingHalls = myHalls.filter((h: any) => h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.status === 'waiting_approval');
        
        if (approvedHalls.length > 0 && localStorage.getItem(`alert_shown_approved_${customerName}`) !== 'true') {
          newAlerts.push({
            id: 'alert_provider_approved_halls',
            type: 'success',
            message: `🎉 تهانينا! تم قبول واعتماد منشآتك (${approvedHalls.map((h: any) => h.name).join('، ')}) بنجاح وهي معروضة للعملاء الآن.`,
            actionLabel: 'رؤية المنشأة',
            actionUrl: '/provider-dashboard',
            onDismiss: () => {
              localStorage.setItem(`alert_shown_approved_${customerName}`, 'true');
            }
          });
        }

        if (pendingHalls.length > 0) {
          newAlerts.push({
            id: 'alert_provider_pending_halls',
            type: 'warning',
            message: `⏳ قيد المعالجة: قاعاتك (${pendingHalls.map((h: any) => h.name).join('، ')}) بانتظار موافقة الإدارة والاعتماد النهائي الفني.`,
            actionLabel: 'تفاصيل القاعات',
            actionUrl: '/halls-services-portal'
          });
        }
        
        let rawMails: any[] = [];
        try {
          const resConfigs = await fetch('/api/system/configs');
          if (resConfigs.ok) {
            const data = await resConfigs.json();
            if (data.success && data.configs && data.configs.PLATFORM_MAIL_MESSAGES) {
              rawMails = data.configs.PLATFORM_MAIL_MESSAGES;
            } else {
              rawMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
            }
          } else {
            rawMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
          }
        } catch (e) {
          rawMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
        }

        const unreadProviderMails = rawMails.filter((m: any) => 
          (m.recipient && (m.recipient.toLowerCase() === emailLower || m.recipient === customerName)) && 
          !m.isReadByProvider
        );
        
        if (unreadProviderMails.length > 0) {
          newAlerts.push({
            id: 'alert_unread_provider_mails',
            type: 'info',
            message: `📧 رسالة إدارية: لديك رسائل وإرشادات عمل جديدة صادرة من إدارة المنصة إليك.`,
            actionLabel: 'صندوق الوارد المالي',
            actionUrl: '/provider-dashboard'
          });
        }
      }
      
      setAlerts(newAlerts);
    } catch (e) {
      console.error('Error updating alerts in Header', e);
    }
  };

  useEffect(() => {
    // 1. Initialize processed sets with existing message and mail IDs on mount
    try {
      const initialMsgs = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');
      Object.keys(initialMsgs).forEach(chatId => {
        const msgs = initialMsgs[chatId] || [];
        msgs.forEach((m: any) => {
          if (m.id) {
            processedClientMsgIdsRef.current.add(m.id);
          }
        });
      });
    } catch (e) {}

    try {
      const initialMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
      initialMails.forEach((m: any) => {
        if (m.id) {
          processedClientMailIdsRef.current.add(m.id);
        }
      });
    } catch (e) {}

    const checkNewRepliesAndMails = async () => {
      try {
        const currentUserStr = localStorage.getItem("currentUser");
        if (!currentUserStr) return;
        const currentUser = JSON.parse(currentUserStr);
        const customerName = currentUser.name || '';
        const currentUserEmail = (currentUser.email || '').toLowerCase();
        if (!customerName) return;

        let hasNew = false;
        const newNotifications: any[] = [];

        // Check new chat replies
        const storedChats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
        const storedMessages = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');

        Object.keys(storedMessages).forEach(chatIdStr => {
          const chatId = Number(chatIdStr);
          const msgs = storedMessages[chatId] || [];
          const chat = storedChats.find((c: any) => c.id === chatId);
          if (!chat || chat.customerName !== customerName) return;

          msgs.forEach((m: any) => {
            if (!m.id || processedClientMsgIdsRef.current.has(m.id)) return;

            processedClientMsgIdsRef.current.add(m.id);

            // If the message is a reply from the provider
            if (m.senderType === 'مزود خدمة') {
              hasNew = true;
              newNotifications.push({
                id: 'notif_rep_' + m.id + '_' + Math.floor(Math.random() * 1000),
                title: `💬 رد جديد من ${chat.providerName}`,
                body: m.text,
                time: "الآن",
                isRead: false,
                type: "service"
              });
            }
          });
        });

        // Check new internal mail messages
        let storedMails: any[] = [];
        try {
          const resConfigs = await fetch('/api/system/configs');
          if (resConfigs.ok) {
            const data = await resConfigs.json();
            if (data.success && data.configs && data.configs.PLATFORM_MAIL_MESSAGES) {
              storedMails = data.configs.PLATFORM_MAIL_MESSAGES;
            } else {
              storedMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
            }
          } else {
            storedMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
          }
        } catch (e) {
          storedMails = JSON.parse(localStorage.getItem('PLATFORM_MAIL_MESSAGES') || '[]');
        }

        storedMails.forEach((m: any) => {
          if (!m.id || processedClientMailIdsRef.current.has(m.id)) return;

          processedClientMailIdsRef.current.add(m.id);

          // We notify the recipient only if they are the currently logged-in user
          const isRecipient = m.recipient && (
            m.recipient.toLowerCase() === currentUserEmail ||
            m.recipient === customerName ||
            ((m.recipient === 'الإدارة' || m.recipient === 'الإدارة العامة') && userRole === 'admin')
          );

          if (isRecipient && !m.deletedByProvider) {
            hasNew = true;
            newNotifications.push({
              id: 'notif_mail_' + m.id + '_' + Math.floor(Math.random() * 1000),
              title: `📧 بريد وارد جديد من ${m.sender}`,
              body: m.subject,
              time: "الآن",
              isRead: false,
              type: "mail"
            });
          }
        });

        if (hasNew && newNotifications.length > 0) {
          setNotifications(prev => [...newNotifications, ...prev]);
        }
      } catch (e) {
        console.error('Error tracking new replies or mails in Header', e);
      }
    };

    const triggerAllUpdates = () => {
      checkNewRepliesAndMails();
      updateDynamicAlerts();
    };

    window.addEventListener('service-chats-updated', triggerAllUpdates);
    window.addEventListener('mailMessagesUpdated', triggerAllUpdates);
    window.addEventListener('storage', triggerAllUpdates);
    window.addEventListener('settingsUpdated', triggerAllUpdates);
    window.addEventListener('hallsUpdated', triggerAllUpdates);
    window.addEventListener('servicesUpdated', triggerAllUpdates);
    window.addEventListener('support-tickets-updated', triggerAllUpdates);
    window.addEventListener('withdrawals-updated', triggerAllUpdates);
    window.addEventListener('documents-updated', triggerAllUpdates);
    window.addEventListener('bookingsUpdated', triggerAllUpdates);
    window.addEventListener('finance-updated', triggerAllUpdates);

    triggerAllUpdates();

    return () => {
      window.removeEventListener('service-chats-updated', triggerAllUpdates);
      window.removeEventListener('mailMessagesUpdated', triggerAllUpdates);
      window.removeEventListener('storage', triggerAllUpdates);
      window.removeEventListener('settingsUpdated', triggerAllUpdates);
      window.removeEventListener('hallsUpdated', triggerAllUpdates);
      window.removeEventListener('servicesUpdated', triggerAllUpdates);
      window.removeEventListener('support-tickets-updated', triggerAllUpdates);
      window.removeEventListener('withdrawals-updated', triggerAllUpdates);
      window.removeEventListener('documents-updated', triggerAllUpdates);
      window.removeEventListener('bookingsUpdated', triggerAllUpdates);
      window.removeEventListener('finance-updated', triggerAllUpdates);
    };
  }, [userRole]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const [hasAdvancedDashboard, setHasAdvancedDashboard] =
    useState<boolean>(() => getActiveProviderCapabilities().hasAdvancedPortal);

  const checkHasAdvancedDashboard = (): boolean => {
    return hasAdvancedDashboard;
  };

  // Synchronize and query database / storage to detect subscription status
  useEffect(() => {
    const syncSubStatus = async () => {
      try {
        const capabilities = getActiveProviderCapabilities();
        let hasAccess = capabilities.hasAdvancedPortal;

        const currentUserStr = localStorage.getItem("currentUser");
        if (currentUserStr) {
          const user = JSON.parse(currentUserStr);
          // Real-time Database Check to ensure exact sync
          if (user.id) {
            const response = await fetch(
              `/api/subscriptions/provider/${user.id}`,
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.subscription && data.subscription.status === "active") {
                const dbCap = getPlanCapabilities(data.subscription.planName);
                if (dbCap.hasAdvancedPortal) {
                  hasAccess = true;
                }
              }
            }
          }
        }
        setHasAdvancedDashboard(hasAccess);
      } catch (err) {
        console.warn("Error verifying live subscription from database:", err);
      }
    };

    syncSubStatus();
    window.addEventListener("storage", syncSubStatus);
    window.addEventListener("subscriptionUpdated", syncSubStatus);
    window.addEventListener("currentUserUpdated", syncSubStatus);
    return () => {
      window.removeEventListener("storage", syncSubStatus);
      window.removeEventListener("subscriptionUpdated", syncSubStatus);
      window.removeEventListener("currentUserUpdated", syncSubStatus);
    };
  }, [isAuthenticated, isUserMenuOpen]);

  // Sync auth state on mount and when storage changes
  useEffect(() => {
    const syncAuth = () => {
      const isAuth = localStorage.getItem("IS_AUTHENTICATED") === "true";
      setIsAuthenticated(isAuth);

      try {
        const user = JSON.parse(localStorage.getItem("currentUser") || "{}");
        const email = (user.email || "").toLowerCase();
        let role = (user.role || "").toLowerCase();

        // Dynamic hotfix for kaab909@gmail.com developer session
        if (
          email === "kaab909@gmail.com" &&
          role !== "provider" &&
          role !== "مزود"
        ) {
          role = "provider";
          user.role = "مزود";
          localStorage.setItem("currentUser", JSON.stringify(user));
        }

        let normalized: "admin" | "provider" | "agency" | "customer" =
          "customer";

        if (
          role.includes("admin") ||
          role.includes("مدير") ||
          role.includes("مشرف")
        ) {
          normalized = "admin";
        } else {
          const isMockProvider = providers.find(
            (p) => p.email.toLowerCase() === email,
          );
          if (isMockProvider) {
            normalized =
              isMockProvider.role === "agency" ? "agency" : "provider";
          } else if (
            role.includes("provider") ||
            role.includes("مزود") ||
            role.includes("موظف") ||
            role.includes("خدمة")
          ) {
            normalized = "provider";
          } else if (role.includes("agency") || role.includes("تسويق")) {
            normalized = "agency";
          }
        }
        setUserRole(normalized);
      } catch {
        setUserRole("customer");
      }
    };

    syncAuth();
    window.addEventListener("storage", syncAuth);
    window.addEventListener("currentUserUpdated", syncAuth);
    return () => {
      window.removeEventListener("storage", syncAuth);
      window.removeEventListener("currentUserUpdated", syncAuth);
    };
  }, []);

  // Synchronize avatar and user info with active database API GET /api/users
  useEffect(() => {
    const fetchLatestUserAvatarAndData = async () => {
      try {
        const storedStr = localStorage.getItem("currentUser");
        if (!storedStr) return;
        const user = JSON.parse(storedStr);
        const email = (user.email || "").toLowerCase();
        if (!email) return;

        const res = await fetch("/api/users");
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.verified)) {
            const dbUser = data.verified.find(
              (u: any) => (u.email || "").toLowerCase() === email,
            );
            if (dbUser) {
              const freshImg =
                dbUser.image || dbUser.avatarUrl || dbUser.avatar;
              const currentLocalImg =
                user.image ||
                user.avatar ||
                user.avatarUrl ||
                user.imagePreview;
              if (freshImg && freshImg !== currentLocalImg) {
                console.log(
                  "Synchronized user avatar from database:",
                  freshImg,
                );
                const updatedUser = {
                  ...user,
                  image: freshImg,
                  avatarUrl: freshImg,
                  avatar: freshImg,
                  imagePreview: freshImg,
                  name: dbUser.name || user.name,
                  phone: dbUser.phone || user.phone,
                  region: dbUser.region || user.region,
                  city: dbUser.city || user.city,
                  iban: dbUser.iban || user.iban,
                  dbId: dbUser.id,
                };
                localStorage.setItem(
                  "currentUser",
                  JSON.stringify(updatedUser),
                );
                window.dispatchEvent(new Event("currentUserUpdated"));
              }
            }
          }
        }
      } catch (err) {
        console.warn(
          "Failed to synchronize user avatar with GET /api/users:",
          err,
        );
      }
    };

    fetchLatestUserAvatarAndData();
    window.addEventListener("currentUserUpdated", fetchLatestUserAvatarAndData);
    window.addEventListener("usersUpdated", fetchLatestUserAvatarAndData);
    window.addEventListener("storage", fetchLatestUserAvatarAndData);
    return () => {
      window.removeEventListener(
        "currentUserUpdated",
        fetchLatestUserAvatarAndData,
      );
      window.removeEventListener("usersUpdated", fetchLatestUserAvatarAndData);
      window.removeEventListener("storage", fetchLatestUserAvatarAndData);
    };
  }, []);

  useEffect(() => {
    const fetchPlatformDataFromDB = async () => {
      try {
        const res = await fetch(`/api/system/configs?_t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.configs) {
            // Get existing stored PLATFORM_DATA as a base to avoid losing custom properties
            let existingData: any = {};
            try {
              const platformStored = localStorage.getItem("PLATFORM_DATA");
              if (platformStored) {
                existingData = JSON.parse(platformStored);
              }
            } catch {}

            let logoUrl = existingData.logoUrl || "";
            let faviconUrl = existingData.faviconUrl || "";
            let coverUrl = existingData.coverUrl || "";
            let platformName = existingData.platformName || "منصة ليلة";
            let platformSlogan = existingData.platformSlogan || "لحجز قاعات الأفراح والأستراحات والشاليهات والخدمات المساندة";

            // 1. Merge from PLATFORM_DATA if it exists in DB
            const platformConfig = data.configs.PLATFORM_DATA;
            if (platformConfig) {
              const parsed = typeof platformConfig === "string" ? JSON.parse(platformConfig) : platformConfig;
              logoUrl = parsed.logoUrl || logoUrl;
              faviconUrl = parsed.faviconUrl || faviconUrl;
              coverUrl = parsed.coverUrl || coverUrl;
              platformName = parsed.platformName || platformName;
              platformSlogan = parsed.platformSlogan || platformSlogan;
            }

            // 2. Fallback or merge from SYSTEM_GENERAL_SETTINGS if present
            const systemSettings = data.configs.SYSTEM_GENERAL_SETTINGS;
            if (systemSettings) {
              const parsedSettings =
                typeof systemSettings === "string"
                  ? JSON.parse(systemSettings)
                  : systemSettings;
              logoUrl = logoUrl || parsedSettings.logoUrl || parsedSettings.platformLogo || parsedSettings.logo || "";
              faviconUrl = faviconUrl || parsedSettings.faviconUrl || "";
              coverUrl = coverUrl || parsedSettings.coverUrl || "";
              platformName = platformName === "منصة ليلة" ? (parsedSettings.platformName || parsedSettings.name || platformName) : platformName;
              platformSlogan = platformSlogan.includes("لحجز") ? (parsedSettings.platformSlogan || parsedSettings.slogan || platformSlogan) : platformSlogan;
            }

            // Keep any other custom properties from existingData
            const mergedData = { 
              ...existingData, 
              logoUrl, 
              faviconUrl, 
              coverUrl, 
              platformName, 
              platformSlogan 
            };
            
            const isDifferent = JSON.stringify(mergedData) !== JSON.stringify(existingData);
            setPlatformData(mergedData);
            if (isDifferent) {
              localStorage.setItem("PLATFORM_DATA", JSON.stringify(mergedData));
              window.dispatchEvent(new Event('settingsUpdated'));
            }
            return;
          }
        }
      } catch (err) {
        console.warn(
          "Failed to fetch platform configuration from database, using localStorage fallback:",
          err,
        );
      }

      // Fallback to localStorage if API fails or is not available yet
      try {
        const platformStored = localStorage.getItem("PLATFORM_DATA");
        if (platformStored) {
          setPlatformData(JSON.parse(platformStored));
        }
      } catch {}
    };

    fetchPlatformDataFromDB();

    const handleSettingsUpdate = () => {
      fetchPlatformDataFromDB();
    };

    window.addEventListener("settingsUpdated", handleSettingsUpdate);
    window.addEventListener("storage", fetchPlatformDataFromDB);
    return () => {
      window.removeEventListener("settingsUpdated", handleSettingsUpdate);
      window.removeEventListener("storage", fetchPlatformDataFromDB);
    };
  }, []);

  const handleLoginSuccess = (user: any) => {
    setIsLoginModalOpen(false);
    localStorage.setItem("IS_AUTHENTICATED", "true");
    localStorage.setItem("currentUser", JSON.stringify(user));
    setIsAuthenticated(true);

    const email = (user.email || "").toLowerCase();
    const rawRole = (user.role || "").toLowerCase();
    let normalizedRole: "admin" | "provider" | "agency" | "customer" =
      "customer";

    if (
      rawRole.includes("admin") ||
      rawRole.includes("مدير") ||
      rawRole.includes("مشرف")
    ) {
      normalizedRole = "admin";
    } else {
      const isMockProvider = providers.find(
        (p) => p.email.toLowerCase() === email,
      );
      if (isMockProvider) {
        normalizedRole =
          isMockProvider.role === "agency" ? "agency" : "provider";
      } else if (
        rawRole.includes("provider") ||
        rawRole.includes("مزود") ||
        rawRole.includes("موظف") ||
        rawRole.includes("خدمة")
      ) {
        normalizedRole = "provider";
      } else if (rawRole.includes("agency") || rawRole.includes("تسويق")) {
        normalizedRole = "agency";
      }
    }

    setUserRole(normalizedRole);

    // Do not redirect to dashboard, but reload the page to refresh authentication state and stay on the current page.
    setTimeout(() => {
      window.location.reload();
    }, 50);
  };

  const handleLogout = () => {
    localStorage.removeItem("IS_AUTHENTICATED");
    localStorage.removeItem("currentUser");
    localStorage.removeItem("authToken");
    setIsAuthenticated(false);
    navigate("/");
  };

  const navLinks = [
    { name: "الرئيسية", path: "/" },
    { name: "استكشف", path: "/explore" },
    { name: "الخريطة التفاعلية", path: "/map" },
    { name: "حاسبة الميزانية", path: "/budget-planner" },
    { name: "العروض والباقات", path: "/offers" },
    { name: "التقويم الذكي", path: "/calendar" },
    { name: "الخدمات", path: "/services" },
    { name: "من نحن", path: "/about" },
    { name: "اتصل بنا", path: "/contact" },
  ];

  return (
    <>
      {/* 🚨 Operational Approvals Notification Top Bar for Admin */}
      {userRole === 'admin' && pendingApprovalsStats.total > 0 && !isPendingBannerDismissed && (
        <div className="bg-gradient-to-r from-rose-950 via-amber-950 to-slate-950 text-white px-4 py-2.5 border-b border-rose-500/40 shadow-xl flex items-center justify-between gap-3 text-xs sm:text-sm font-sans relative z-50 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="p-1.5 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 shrink-0">
              <AlertTriangle className="w-4.5 h-4.5 text-rose-400 animate-bounce" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-black text-rose-300 bg-rose-500/20 px-2.5 py-0.5 rounded-lg border border-rose-400/30 text-[11px] shadow-2xs">
                ⚡ تنبيه الاستجابة التشغيلية العاجلة
              </span>
              <span className="text-slate-200 font-bold">
                يوجد <span className="font-mono font-black text-amber-400 text-sm px-2 py-0.5 bg-amber-500/20 rounded-md border border-amber-400/30">{pendingApprovalsStats.total}</span> طلبات اعتماد منشآت وقاعات معلقة بانتظار معالجة الإدارة:
              </span>
              <span className="text-slate-300 text-xs font-mono font-medium hidden md:inline">
                ({pendingApprovalsStats.hallsCount} قاعات ومرافق • {pendingApprovalsStats.servicesCount} خدمات مساندة • {pendingApprovalsStats.providersCount} وثائق شركاء)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/dashboard?tab=partner_requests')}
              className="px-3.5 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95 whitespace-nowrap"
            >
              <span>معالجة والبت في الطلبات ({pendingApprovalsStats.total})</span>
              <ArrowLeft className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setIsPendingBannerDismissed(true)}
              className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all cursor-pointer"
              title="إخفاء التنبيه المؤقت"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Top Premium Ad Banner */}
      <AdBanner placement="شريط الهيدر الإعلاني المصغر" layout="announcement" />

      {/* Header / Navbar */}
      <header className="bg-blue-950 text-white sticky top-0 z-50 shadow-md w-full">
        <div className="w-full px-4 md:px-8 lg:px-10">
          <div className="flex items-center justify-between min-h-[100px] py-2">
            {/* Right: Logo & Text */}
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <div className="flex items-center justify-center shrink-0">
                {platformData.logoUrl ? (
                  <img
                    src={platformData.logoUrl}
                    alt="Logo"
                    className="w-[100px] h-[100px] object-contain shrink-0 bg-transparent rounded-xl p-0"
                  />
                ) : (
                  <div className="w-[100px] h-[100px] bg-amber-500 rounded-full flex items-center justify-center text-blue-950 font-bold text-5xl shadow-lg shrink-0">
                    ل
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <span className="text-3xl font-bold tracking-wide">
                  {platformData.platformName || "منصة ليلة"}
                </span>
                <span className="text-xs text-amber-400 hidden lg:block max-w-[200px] leading-snug mt-1">
                  {platformData.platformSlogan ||
                    "لحجز قاعات الأفراح والأستراحات والشاليهات والخدمات المساندة"}
                </span>
              </div>
            </Link>

            {/* Middle: Nav Links (Desktop) */}
            <nav className="hidden xl:flex items-center gap-3 2xl:gap-5 transition-transform duration-300 hover:scale-[1.02] origin-center mx-6">
              {navLinks.map((link, index) => (
                <div key={link.name} className="relative group">
                  <Link
                    to={link.path!}
                    className={`text-sm font-medium transition-colors hover:text-amber-500 pb-1 border-b-2 whitespace-nowrap flex items-center gap-1 ${
                      location.pathname === link.path
                        ? "text-amber-500 border-amber-500"
                        : "text-slate-200 border-transparent hover:border-amber-500"
                    }`}
                  >
                    {link.name}
                  </Link>
                </div>
              ))}
            </nav>

            {/* Left: Auth / User Area */}
            <div className="hidden xl:flex items-center gap-3 shrink-0">
              {!isAuthenticated && (
                <button
                  onClick={toggleTheme}
                  className="p-2 rounded-xl text-slate-200 hover:text-amber-500 hover:bg-white/5 transition-all"
                  title={
                    theme === "dark"
                      ? "تبديل للوضع النهاري"
                      : "تبديل للوضع الليلي"
                  }
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </button>
              )}

              {isAuthenticated ? (
                <div className="flex flex-col items-end gap-2 shrink-0">
                  {/* Top row: Theme Toggle & Notifications Bell */}
                  <div className="flex items-center gap-3">
                    {/* Theme Toggle */}
                    <button
                      onClick={toggleTheme}
                      className="p-2 rounded-xl text-slate-200 hover:text-amber-500 hover:bg-white/5 transition-all"
                      title={
                        theme === "dark"
                          ? "تبديل للوضع النهاري"
                          : "تبديل للوضع الليلي"
                      }
                    >
                      {theme === "dark" ? (
                        <Sun className="w-5 h-5" />
                      ) : (
                        <Moon className="w-5 h-5" />
                      )}
                    </button>

                    {/* Notifications Bell */}
                    <div className="relative">
                      <button
                        onClick={() => {
                          setIsNotificationsOpen(!isNotificationsOpen);
                          setIsUserMenuOpen(false);
                        }}
                        className={`relative hover:scale-105 transition-all cursor-pointer p-1.5 hover:bg-white/5 rounded-xl block ${
                          alerts.length > 0 
                            ? "text-amber-400 hover:text-amber-300 ring-2 ring-amber-500/30 animate-pulse" 
                            : "text-slate-200 hover:text-white"
                        }`}
                      >
                        <Bell className="w-6 h-6" />
                        {unreadCount > 0 ? (
                          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-blue-950 text-[10px] font-black rounded-full border-2 border-blue-950 flex items-center justify-center animate-bounce shadow">
                            {unreadCount}
                            <span className="absolute -inset-0.5 rounded-full bg-orange-500/50 animate-ping pointer-events-none"></span>
                          </span>
                        ) : alerts.length > 0 ? (
                          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-500 rounded-full border-2 border-blue-950 flex items-center justify-center shadow animate-pulse">
                            <span className="absolute -inset-1 rounded-full bg-amber-500/40 animate-ping pointer-events-none"></span>
                          </span>
                        ) : null}
                      </button>

                      {isNotificationsOpen && (
                        <>
                          <div
                            className="fixed inset-0 z-40"
                            onClick={() => setIsNotificationsOpen(false)}
                          ></div>
                          <div
                            className="absolute left-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 text-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                            dir="rtl"
                          >
                            <div className="p-4 bg-blue-950 text-white flex justify-between items-center border-b border-blue-900">
                              <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping"></span>
                                <span className="font-extrabold text-xs">
                                  التنبيهات والإشعارات ({unreadCount})
                                </span>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => {
                                    setNotifications((prev) =>
                                      prev.map((n) => ({ ...n, isRead: true })),
                                    );
                                  }}
                                  className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-1 rounded font-bold transition-all cursor-pointer"
                                >
                                  قراءة الكل
                                </button>
                                <button
                                  onClick={() => {
                                    setNotifications([]);
                                  }}
                                  className="text-[10px] text-red-355 hover:text-red-200 font-bold px-1 cursor-pointer"
                                >
                                  حذف الكل
                                </button>
                              </div>
                            </div>

                            <div className="divide-y divide-slate-100 max-h-85 overflow-y-auto">
                              {/* 1. Intelligent Dynamic Alerts */}
                              {alerts.length > 0 && (
                                <div className="bg-amber-500/5 divide-y divide-amber-100/40 border-b border-amber-100/50">
                                  {alerts.map((alert) => (
                                    <div
                                      key={alert.id}
                                      className={`p-4 transition-all flex flex-col gap-2.5 relative border-r-4 ${
                                        alert.type === 'warning'
                                          ? 'border-amber-500 bg-amber-500/[0.03]'
                                          : alert.type === 'success'
                                          ? 'border-emerald-500 bg-emerald-500/[0.03]'
                                          : 'border-blue-500 bg-blue-500/[0.03]'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-start gap-2 text-right">
                                          <span className="shrink-0 mt-0.5 flex items-center justify-center">
                                            {alert.type === 'warning' ? (
                                              <AlertTriangle className="w-4 h-4 text-amber-500 animate-pulse" />
                                            ) : alert.type === 'success' ? (
                                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                                            ) : (
                                              <Info className="w-4 h-4 text-blue-500" />
                                            )}
                                          </span>
                                          <div>
                                            <span className="text-[10px] font-black tracking-wider uppercase block text-amber-600 mb-0.5">
                                              تنبيه ذكي عاجل
                                            </span>
                                            <p className="text-xs font-bold text-slate-800 leading-relaxed">
                                              {alert.message}
                                            </p>
                                          </div>
                                        </div>
                                        <button
                                          onClick={() => {
                                            if (alert.onDismiss) alert.onDismiss();
                                            setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                                          }}
                                          className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all cursor-pointer animate-pulse"
                                          title="إغلاق التنبيه"
                                        >
                                          <X className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                      {alert.actionLabel && alert.actionUrl && (
                                        <div className="flex justify-end">
                                          <button
                                            onClick={() => {
                                              navigate(alert.actionUrl);
                                              setIsNotificationsOpen(false);
                                              if (alert.onDismiss) alert.onDismiss();
                                            }}
                                            className="px-3 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[10px] font-black transition-all cursor-pointer shadow hover:shadow-md"
                                          >
                                            {alert.actionLabel}
                                          </button>
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}

                              {/* 2. Standard Notifications */}
                              {notifications.length === 0 && alerts.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center">
                                  <Bell className="w-8 h-8 text-slate-200 mb-2" />
                                  <p className="text-xs font-bold text-slate-700">
                                    صندوق الإشعارات فارغ
                                  </p>
                                  <span className="text-[10px] text-slate-400 mt-1">
                                    لا توجد لديك تنبيهات معلقة حالياً.
                                  </span>
                                </div>
                              ) : (
                                notifications.map((notif) => (
                                  <div
                                    key={notif.id}
                                    onClick={() => {
                                      setNotifications((prev) =>
                                        prev.map((n) =>
                                          n.id === notif.id
                                            ? { ...n, isRead: true }
                                            : n,
                                        ),
                                      );
                                    }}
                                    className={`p-4 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 text-right ${!notif.isRead ? "bg-amber-500/5 font-medium" : "opacity-85"}`}
                                  >
                                    <div className="mt-1.5 shrink-0">
                                      <span
                                        className={`w-2 h-2 rounded-full block ${!notif.isRead ? "bg-amber-500 animate-pulse" : "bg-slate-200"}`}
                                      ></span>
                                    </div>
                                    <div className="flex-grow">
                                      <div className="flex justify-between items-baseline mb-0.5">
                                        <h5 className="text-xs font-black text-slate-900">
                                          {notif.title}
                                        </h5>
                                        <span className="text-[9px] text-slate-400 font-mono font-bold shrink-0">
                                          {notif.time}
                                        </span>
                                      </div>
                                      <p className="text-xs text-slate-500 leading-relaxed mt-1">
                                        {notif.body}
                                      </p>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* User Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => {
                        // Sync role right before opening to ensure no stale state
                        try {
                          const user = JSON.parse(
                            localStorage.getItem("currentUser") || "{}",
                          );
                          const email = (user.email || "").toLowerCase();
                          const role = (user.role || "").toLowerCase();
                          let normalized:
                            "admin" | "provider" | "agency" | "customer" =
                            "customer";

                          if (
                            role.includes("admin") ||
                            role.includes("مدير") ||
                            role.includes("مشرف")
                          ) {
                            normalized = "admin";
                          } else {
                            const isMockProvider = providers.find(
                              (p) => p.email.toLowerCase() === email,
                            );
                            if (isMockProvider) {
                              normalized =
                                isMockProvider.role === "agency"
                                  ? "agency"
                                  : "provider";
                            } else if (
                              role.includes("provider") ||
                              role.includes("مزود") ||
                              role.includes("موظف") ||
                              role.includes("خدمة")
                            ) {
                              normalized = "provider";
                            } else if (
                              role.includes("agency") ||
                              role.includes("تسويق")
                            ) {
                              normalized = "agency";
                            }
                          }
                          setUserRole(normalized);
                        } catch (e) {}
                        setIsUserMenuOpen(!isUserMenuOpen);
                      }}
                      className="flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-amber-500/30 px-3.5 py-1.5 rounded-full transition-all duration-300 focus:outline-none select-none cursor-pointer"
                    >
                      {/* Avatar */}
                      <div className="w-8 h-8 rounded-full bg-slate-200 ring-2 ring-amber-500/80 flex items-center justify-center overflow-hidden shrink-0 transition-transform duration-300 hover:scale-105">
                        {(() => {
                          try {
                            const user = JSON.parse(
                              localStorage.getItem("currentUser") || "{}",
                            );
                            const avatarUrl =
                              user.image ||
                              user.avatar ||
                              user.imagePreview ||
                              user.avatarUrl;
                            if (avatarUrl) {
                              return (
                                <img
                                  src={avatarUrl}
                                  referrerPolicy="no-referrer"
                                  className="w-full h-full object-cover"
                                  alt="User Avatar"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              );
                            }
                          } catch (e) {}
                          return <User className="w-5 h-5 text-slate-600" />;
                        })()}
                      </div>

                      {/* Name & Role Badge (Desktop) */}
                      <div className="hidden lg:flex flex-col text-right">
                        <span className="text-xs font-bold text-slate-100 max-w-[120px] truncate leading-none">
                          {(() => {
                            try {
                              const user = JSON.parse(
                                localStorage.getItem("currentUser") || "{}",
                              );
                              return (
                                user.name || user.username || "مستخدم المنصة"
                              );
                            } catch (e) {
                              return "مستخدم المنصة";
                            }
                          })()}
                        </span>
                        {userRole === "admin" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-300 bg-blue-900/90 px-2 py-0.5 rounded-full border border-blue-600/60 shadow-sm mt-1">
                            <ShieldCheck className="w-2.5 h-2.5 text-amber-300" /> المشرف العام 🛡️
                          </span>
                        )}
                        {userRole === "provider" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-amber-300 bg-indigo-950/90 px-2 py-0.5 rounded-full border border-indigo-600/60 shadow-sm mt-1">
                            <Building2 className="w-2.5 h-2.5 text-amber-400" /> مزود خدمة 💼
                          </span>
                        )}
                        {userRole === "agency" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-black text-pink-200 bg-fuchsia-950/90 px-2 py-0.5 rounded-full border border-fuchsia-600/60 shadow-sm mt-1">
                            <Megaphone className="w-2.5 h-2.5 text-pink-300" /> جهة تسويق 📢
                          </span>
                        )}
                        {userRole === "customer" && (
                          <span className="inline-flex items-center gap-1 text-[9px] font-extrabold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-500/40 mt-1">
                            ✨ عميل المنصة
                          </span>
                        )}
                      </div>

                      <ChevronDown
                        className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-300 ${isUserMenuOpen ? "rotate-180 text-amber-500" : ""}`}
                      />
                    </button>

                    {isUserMenuOpen && (
                      <>
                        {/* Transparent full screen backdrop overlay to close menu instantly on click away */}
                        <div
                          className="fixed inset-0 z-40"
                          onClick={() => setIsUserMenuOpen(false)}
                        ></div>

                        <div
                          className="absolute left-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-3 text-slate-800 z-50 animate-in fade-in slide-in-from-top-2 duration-200"
                          dir="rtl"
                        >
                          {/* User Header Info */}
                          <div className="px-4 py-3 border-b border-slate-100 mb-2">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                              أهلاً بك
                            </p>
                            <p className="text-sm font-black text-blue-950 truncate mt-0.5">
                              {(() => {
                                try {
                                  const user = JSON.parse(
                                    localStorage.getItem("currentUser") || "{}",
                                  );
                                  return (
                                    user.name ||
                                    user.username ||
                                    "مستخدم المنصة"
                                  );
                                } catch (e) {
                                  return "مستخدم المنصة";
                                }
                              })()}
                            </p>
                            <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                              {(() => {
                                try {
                                  const user = JSON.parse(
                                    localStorage.getItem("currentUser") || "{}",
                                  );
                                  return user.email || "";
                                } catch (e) {
                                  return "";
                                }
                              })()}
                            </p>
                            <div className="mt-2">
                              {userRole === "admin" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gradient-to-r from-blue-900 to-indigo-900 text-amber-300 text-[10px] font-black border border-blue-700/60 shadow-sm">
                                  <ShieldCheck className="w-3.5 h-3.5 text-amber-300" /> المشرف العام (Admin) 🛡️
                                </span>
                              )}
                              {userRole === "provider" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-900 text-[10px] font-black border border-indigo-200 shadow-sm">
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600" /> شريك مزود خدمة 💼
                                </span>
                              )}
                              {userRole === "agency" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-fuchsia-50 text-fuchsia-900 text-[10px] font-black border border-fuchsia-200 shadow-sm">
                                  <Megaphone className="w-3.5 h-3.5 text-fuchsia-600" /> جهة تسويق معتمدة 📢
                                </span>
                              )}
                              {userRole === "customer" && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 text-[10px] font-black border border-emerald-200 shadow-sm">
                                  ✨ عميل المنصة
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 1. ADMIN USER PORTAL OPTIONS */}
                          {userRole === "admin" && (
                            <>
                              {/* Prominent Admin Control Dashboard Link */}
                              <div className="px-3 pb-2.5 border-b border-slate-100 mb-2">
                                <Link
                                  to="/dashboard"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-blue-900 via-indigo-900 to-blue-950 text-white shadow-md border border-blue-700 hover:from-blue-800 hover:to-indigo-800 transition-all group"
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="p-2 bg-amber-500 text-slate-950 rounded-lg shrink-0 group-hover:scale-105 transition-transform shadow">
                                      <ShieldCheck className="w-4 h-4" />
                                    </div>
                                    <div className="text-right">
                                      <div className="text-xs font-black text-white flex items-center gap-1">
                                        <span>لوحة تحكم الإدارة</span>
                                        <span className="text-[9px] bg-amber-400 text-blue-950 px-1.5 py-0.2 rounded font-black">Admin</span>
                                      </div>
                                      <div className="text-[9px] text-blue-200 mt-0.5 font-medium">الرقابة السيادية والاعتمادات</div>
                                    </div>
                                  </div>
                                  <ChevronLeft className="w-4 h-4 text-amber-400 group-hover:-translate-x-1 transition-transform shrink-0" />
                                </Link>
                              </div>

                              {/* Provider Portals Preview Section for Admin */}
                              <div className="px-3 pb-2 space-y-1 border-b border-slate-100 mb-2">
                                <p className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <Eye className="w-3 h-3 text-indigo-500" />
                                  <span>معاينة بوابات المزودين:</span>
                                </p>
                                <Link
                                  to="/provider-dashboard"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-bold text-amber-950 bg-amber-50/80 hover:bg-amber-100 rounded-lg transition-all border border-amber-200"
                                >
                                  <LayoutDashboard className="w-3.5 h-3.5 text-amber-600" />
                                  <span>لوحة تحكم المزود الموحدة</span>
                                </Link>
                                <Link
                                  to="/provider-dashboard?tab=halls"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200"
                                >
                                  <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>إدارة القاعات والخدمات</span>
                                </Link>
                                <Link
                                  to="/provider-dashboard?tab=bookings"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg transition-all border border-slate-200"
                                >
                                  <ClipboardList className="w-3.5 h-3.5 text-slate-600" />
                                  <span>إدارة الحجوزات والطلبات</span>
                                </Link>
                                <Link
                                  to="/provider-messages"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-2.5 px-2.5 py-1.5 text-xs font-bold text-indigo-950 bg-indigo-50/70 hover:bg-indigo-100 rounded-lg transition-all border border-indigo-200"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                                  <span>محادثات العملاء</span>
                                </Link>
                              </div>

                              {/* Customer & common links for admin */}
                              <div className="px-2 space-y-0.5">
                                <Link
                                  to="/bookings"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                  <Receipt className="w-4 h-4 text-slate-400" />
                                  <span>حجوزاتي المعتمدة</span>
                                </Link>
                                <Link
                                  to="/favorites"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-650 hover:text-rose-800 hover:bg-rose-50/50 rounded-lg transition-all"
                                >
                                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                  <span>القاعات المفضلة (مفضلتي)</span>
                                </Link>
                                <Link
                                  to="/profile"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                  <User className="w-4 h-4 text-slate-400" />
                                  <span>الملف الشخصي والحساب</span>
                                </Link>
                                <Link
                                  to="/support"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50/30 rounded-lg transition-all"
                                >
                                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                                  <span>مركز الدعم والتذاكر</span>
                                </Link>
                              </div>
                            </>
                          )}

                          {/* 2. PROVIDER USER PORTAL OPTIONS (STRICT ISOLATION - NO ADMIN LINKS) */}
                          {userRole === "provider" && (
                            <>
                              <div className="px-3 pb-2 space-y-1 border-b border-slate-100 mb-2">
                                <p className="px-1 text-[9px] font-black text-indigo-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <Building2 className="w-3 h-3 text-indigo-600" />
                                  <span>بوابات الشريك المزود:</span>
                                </p>
                                <Link
                                  to="/provider-dashboard"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-black text-amber-950 bg-amber-400 hover:bg-amber-500 rounded-xl transition-all border border-amber-500 shadow-sm"
                                >
                                  <div className="w-7 h-7 bg-amber-950 rounded-lg flex items-center justify-center text-amber-400 shrink-0">
                                    <LayoutDashboard className="w-4 h-4" />
                                  </div>
                                  <span>لوحة تحكم المزود الموحدة</span>
                                </Link>
                                <Link
                                  to="/provider-dashboard?tab=halls"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-black text-indigo-950 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200"
                                >
                                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
                                    <Building2 className="w-4 h-4" />
                                  </div>
                                  <span>إدارة القاعات والخدمات</span>
                                </Link>
                                <Link
                                  to="/provider-dashboard?tab=bookings"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-black text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl transition-all border border-slate-200"
                                >
                                  <div className="w-7 h-7 bg-slate-600 rounded-lg flex items-center justify-center text-white shrink-0">
                                    <ClipboardList className="w-4 h-4" />
                                  </div>
                                  <span>إدارة الحجوزات والطلبات</span>
                                </Link>
                                <Link
                                  to="/provider-messages"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-black text-indigo-950 bg-indigo-50/80 hover:bg-indigo-100 rounded-xl transition-all border border-indigo-200"
                                >
                                  <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center text-white shrink-0">
                                    <MessageSquare className="w-4 h-4" />
                                  </div>
                                  <span>محادثات العملاء</span>
                                </Link>
                              </div>

                              <div className="px-2 space-y-0.5">
                                <Link
                                  to="/favorites"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-650 hover:text-rose-800 hover:bg-rose-50/50 rounded-lg transition-all"
                                >
                                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                  <span>القاعات المفضلة (مفضلتي)</span>
                                </Link>
                                <Link
                                  to="/profile"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                  <User className="w-4 h-4 text-slate-400" />
                                  <span>الملف الشخصي والحساب</span>
                                </Link>
                                <Link
                                  to="/support"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50/30 rounded-lg transition-all"
                                >
                                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                                  <span>مركز الدعم والتذاكر</span>
                                </Link>
                              </div>
                            </>
                          )}

                          {/* 3. AGENCY USER PORTAL OPTIONS */}
                          {userRole === "agency" && (
                            <>
                              <div className="px-3 pb-2 space-y-1 border-b border-slate-100 mb-2">
                                <p className="px-1 text-[9px] font-black text-fuchsia-600 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                  <Megaphone className="w-3 h-3 text-fuchsia-600" />
                                  <span>بوابة التسويق المعتمدة:</span>
                                </p>
                                <Link
                                  to="/dashboard"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2.5 text-xs font-black text-fuchsia-950 bg-fuchsia-50 hover:bg-fuchsia-100 rounded-xl transition-all border border-fuchsia-200"
                                >
                                  <div className="w-7 h-7 bg-fuchsia-600 rounded-lg flex items-center justify-center text-white shrink-0">
                                    <Megaphone className="w-4 h-4" />
                                  </div>
                                  <span>لوحة جهة التسويق</span>
                                </Link>
                              </div>
                              <div className="px-2 space-y-0.5">
                                <Link
                                  to="/favorites"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-650 hover:text-rose-800 hover:bg-rose-50/50 rounded-lg transition-all"
                                >
                                  <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                  <span>القاعات المفضلة (مفضلتي)</span>
                                </Link>
                                <Link
                                  to="/profile"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 rounded-lg"
                                >
                                  <User className="w-4 h-4 text-slate-400" />
                                  <span>الملف الشخصي والحساب</span>
                                </Link>
                                <Link
                                  to="/support"
                                  onClick={() => setIsUserMenuOpen(false)}
                                  className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50/30 rounded-lg transition-all"
                                >
                                  <HelpCircle className="w-4 h-4 text-indigo-500" />
                                  <span>مركز الدعم والتذاكر</span>
                                </Link>
                              </div>
                            </>
                          )}

                          {/* 4. CUSTOMER USER OPTIONS (STRICT ISOLATION - NO PROVIDER/ADMIN LINKS) */}
                          {userRole === "customer" && (
                            <div className="px-2 space-y-0.5">
                              <p className="px-2 text-[9px] font-black text-slate-400 uppercase tracking-wider mb-1">خدمات العميل:</p>
                              <Link
                                to="/bookings"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-750 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-all"
                              >
                                <Receipt className="w-4 h-4 text-slate-400" />
                                <span>حجوزاتي المعتمدة</span>
                              </Link>

                              <Link
                                to="/favorites"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-rose-650 hover:text-rose-800 hover:bg-rose-50/50 rounded-lg transition-all"
                              >
                                <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                                <span>القاعات المفضلة</span>
                              </Link>

                              <Link
                                to="/bookings?tab=services"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-750 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-all"
                              >
                                <Sparkles className="w-4 h-4 text-slate-400" />
                                <span>طلبات خدمات المناسبات</span>
                              </Link>

                              <Link
                                to="/profile"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-slate-750 hover:text-amber-600 hover:bg-slate-50 rounded-lg transition-all"
                              >
                                <User className="w-4 h-4 text-slate-400" />
                                <span>الملف الشخصي والحساب</span>
                              </Link>

                              <Link
                                to="/support"
                                onClick={() => setIsUserMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-xs font-bold text-indigo-650 hover:text-indigo-800 hover:bg-indigo-50/30 rounded-lg transition-all"
                              >
                                <HelpCircle className="w-4 h-4 text-indigo-500" />
                                <span>مركز الدعم والتذاكر</span>
                              </Link>
                            </div>
                          )}

                          <hr className="my-2 border-slate-100" />
                          <div className="px-2">
                            <button
                              onClick={() => {
                                handleLogout();
                                setIsUserMenuOpen(false);
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-650 hover:text-red-800 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                            >
                              <LogOut className="w-4 h-4 text-red-500" />
                              <span>تسجيل الخروج</span>
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="group relative flex flex-row items-center justify-center w-11 h-11 hover:w-36 rounded-full bg-slate-950/65 border-2 border-amber-500/40 hover:border-amber-400 text-amber-500 hover:text-slate-950 hover:bg-amber-500 transition-all duration-500 ease-out shadow-md hover:shadow-lg hover:shadow-amber-500/30 whitespace-nowrap overflow-hidden p-2.5"
                  title="تسجيل الدخول"
                >
                  {/* Icon - on the left (RTL) */}
                  <LogIn className="w-5 h-5 transition-transform duration-500 group-hover:rotate-12 shrink-0" />

                  {/* Text - on the left in LTR context, but inside RTL alignment we want it to flow naturally. */}
                  <span className="max-w-0 group-hover:max-w-xs opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out text-xs font-bold font-sans tracking-wide pr-0 group-hover:pr-2 select-none overflow-hidden text-right">
                    تسجيل الدخول
                  </span>
                </button>
              )}
            </div>

            {/* Mobile/Tablet Controls Area */}
            <div className="xl:hidden flex items-center gap-2.5 shrink-0">
              {/* Theme Toggle (Mobile) */}
              <button
                onClick={toggleTheme}
                className="p-1.5 rounded-xl text-slate-200 hover:text-amber-500 hover:bg-white/5 transition-all cursor-pointer"
                title={theme === "dark" ? "الوضع النهاري" : "الوضع الليلي"}
              >
                {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Notifications Bell (Mobile) */}
              {isAuthenticated && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setIsNotificationsOpen(!isNotificationsOpen);
                      setIsMenuOpen(false); // Close main menu if notifications are clicked
                    }}
                    className={`relative p-1.5 hover:bg-white/5 rounded-xl block cursor-pointer transition-all ${
                      alerts.length > 0 
                        ? "text-amber-400 ring-2 ring-amber-500/30 animate-pulse" 
                        : "text-slate-200 hover:text-white"
                    }`}
                    title="التنبيهات"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 ? (
                      <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-orange-500 text-blue-950 text-[10px] font-black rounded-full border border-blue-950 flex items-center justify-center animate-bounce shadow">
                        {unreadCount}
                        <span className="absolute -inset-0.5 rounded-full bg-orange-500/50 animate-ping pointer-events-none"></span>
                      </span>
                    ) : alerts.length > 0 ? (
                      <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-500 rounded-full border border-blue-950 flex items-center justify-center shadow animate-pulse">
                        <span className="absolute -inset-1 rounded-full bg-amber-500/40 animate-ping pointer-events-none"></span>
                      </span>
                    ) : null}
                  </button>

                  {isNotificationsOpen && (
                    <>
                      <div
                        className="fixed inset-0 z-40 bg-black/10"
                        onClick={() => setIsNotificationsOpen(false)}
                      ></div>
                      <div
                        className="absolute left-[-60px] sm:left-[-120px] mt-3 w-[290px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 text-slate-800 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150"
                        dir="rtl"
                      >
                        <div className="p-3.5 bg-blue-950 text-white flex justify-between items-center border-b border-blue-900">
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                            <span className="font-extrabold text-xs">
                              التنبيهات ({unreadCount})
                            </span>
                          </div>
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => {
                                // Close notifications
                                setNotifications((prev) =>
                                  prev.map((n) => ({ ...n, isRead: true })),
                                );
                              }}
                              className="text-[9px] bg-white/10 hover:bg-white/20 px-1.5 py-1 rounded font-bold transition-all cursor-pointer"
                            >
                              قراءة الكل
                            </button>
                            <button
                              onClick={() => {
                                setNotifications([]);
                              }}
                              className="text-[9px] text-red-300 hover:text-red-200 font-bold px-1 cursor-pointer"
                            >
                              حذف الكل
                            </button>
                          </div>
                        </div>

                        <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                          {/* 1. Intelligent Dynamic Alerts (Mobile) */}
                          {alerts.length > 0 && (
                            <div className="bg-amber-500/5 divide-y divide-amber-100/40 border-b border-amber-100/50">
                              {alerts.map((alert) => (
                                <div
                                  key={alert.id}
                                  className={`p-3 transition-all flex flex-col gap-2 relative border-r-4 ${
                                    alert.type === 'warning'
                                      ? 'border-amber-500 bg-amber-500/[0.03]'
                                      : alert.type === 'success'
                                      ? 'border-emerald-500 bg-emerald-500/[0.03]'
                                      : 'border-blue-500 bg-blue-500/[0.03]'
                                  }`}
                                >
                                  <div className="flex justify-between items-start gap-2">
                                    <div className="flex items-start gap-2 text-right">
                                      <span className="shrink-0 mt-0.5 flex items-center justify-center">
                                        {alert.type === 'warning' ? (
                                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                                        ) : alert.type === 'success' ? (
                                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                                        ) : (
                                          <Info className="w-3.5 h-3.5 text-blue-500" />
                                        )}
                                      </span>
                                      <div>
                                        <span className="text-[9px] font-black tracking-wider uppercase block text-amber-600 mb-0.5">
                                          تنبيه ذكي عاجل
                                        </span>
                                        <p className="text-[11px] font-bold text-slate-800 leading-relaxed">
                                          {alert.message}
                                        </p>
                                      </div>
                                    </div>
                                    <button
                                      onClick={() => {
                                        if (alert.onDismiss) alert.onDismiss();
                                        setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
                                      }}
                                      className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded transition-all cursor-pointer animate-pulse"
                                      title="إغلاق التنبيه"
                                    >
                                      <X className="w-3 h-3" />
                                    </button>
                                  </div>
                                  {alert.actionLabel && alert.actionUrl && (
                                    <div className="flex justify-end">
                                      <button
                                        onClick={() => {
                                          navigate(alert.actionUrl);
                                          setIsNotificationsOpen(false);
                                          if (alert.onDismiss) alert.onDismiss();
                                        }}
                                        className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-[9px] font-black transition-all cursor-pointer shadow hover:shadow-md"
                                      >
                                        {alert.actionLabel}
                                      </button>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* 2. Standard Notifications (Mobile) */}
                          {notifications.length === 0 && alerts.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 flex flex-col items-center justify-center">
                              <Bell className="w-6 h-6 text-slate-200 mb-1.5" />
                              <p className="text-xs font-bold text-slate-700">
                                صندوق الإشعارات فارغ
                              </p>
                              <span className="text-[9px] text-slate-400 mt-0.5">
                                لا توجد لديك تنبيهات معلقة حالياً.
                              </span>
                            </div>
                          ) : (
                            notifications.map((notif) => (
                              <div
                                key={notif.id}
                                onClick={() => {
                                  setNotifications((prev) =>
                                    prev.map((n) =>
                                      n.id === notif.id ? { ...n, isRead: true } : n
                                    )
                                  );
                                }}
                                className={`p-3 hover:bg-slate-50 transition-colors cursor-pointer flex gap-2 text-right ${!notif.isRead ? "bg-amber-500/5 font-medium" : "opacity-85"}`}
                              >
                                <div className="mt-1 shrink-0">
                                  <span
                                    className={`w-1.5 h-1.5 rounded-full block ${!notif.isRead ? "bg-amber-500 animate-pulse" : "bg-slate-200"}`}
                                  ></span>
                                </div>
                                <div className="flex-grow">
                                  <div className="flex justify-between items-baseline mb-0.5">
                                    <h5 className="text-[11px] font-black text-slate-900 leading-snug">
                                      {notif.title}
                                    </h5>
                                    <span className="text-[8px] text-slate-400 font-mono font-bold shrink-0 pr-1">
                                      {notif.time}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                                    {notif.body}
                                  </p>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Login Button (Mobile if not logged in) */}
              {!isAuthenticated && (
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-2.5 py-1.5 rounded-xl text-[10px] transition-all cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>دخول</span>
                </button>
              )}

              {/* Hamburger Menu Button */}
              <button
                className="text-slate-200 p-1.5 hover:bg-white/5 rounded-xl transition-all cursor-pointer"
                onClick={() => {
                  setIsMenuOpen(!isMenuOpen);
                  setIsNotificationsOpen(false); // Close notifications if opening menu
                }}
                title={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="xl:hidden bg-blue-900 border-t border-blue-800">
            <div className="px-4 pt-4 pb-2 flex items-center justify-between border-b border-blue-800/50 mb-2">
              <span className="text-sm font-medium text-slate-300">
                المظهر والوضع
              </span>
              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-xl text-amber-400 hover:bg-white/10 transition-all border border-amber-500/20"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-5 h-5" /> نهاري
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5" /> ليلي
                    </>
                  )}
                </button>
              </div>
            </div>
            <div className="px-4 pt-2 pb-6 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path!}
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-white hover:text-amber-400 hover:bg-blue-800"
                >
                  {link.name}
                </Link>
              ))}

              {isAuthenticated && (
                <div className="pt-4 mt-4 border-t border-blue-800/60 space-y-2">
                  {/* User Profile Summary in Mobile Menu */}
                  <div className="px-3 py-2.5 bg-white/5 rounded-xl border border-white/10 mb-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 ring-2 ring-amber-500/80 flex items-center justify-center overflow-hidden shrink-0">
                      {(() => {
                        try {
                          const user = JSON.parse(
                            localStorage.getItem("currentUser") || "{}",
                          );
                          const avatarUrl =
                            user.image ||
                            user.avatar ||
                            user.avatarUrl ||
                            user.imagePreview;
                          if (avatarUrl) {
                            return (
                              <img
                                src={avatarUrl}
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                                alt="User Avatar"
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            );
                          }
                        } catch (e) {}
                        return <User className="w-6 h-6 text-slate-600" />;
                      })()}
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-sm font-black text-slate-100">
                        {(() => {
                          try {
                            const user = JSON.parse(
                              localStorage.getItem("currentUser") || "{}",
                            );
                            return (
                              user.name || user.username || "مستخدم المنصة"
                            );
                          } catch (e) {
                            return "مستخدم المنصة";
                          }
                        })()}
                      </span>
                      <span className="text-[10px] font-medium text-amber-400 mt-0.5">
                        {userRole === "admin"
                          ? "المشرف العام (Admin) 🛡️"
                          : userRole === "provider"
                            ? "شريك مزود خدمة 💼"
                            : userRole === "agency"
                              ? "جهة تسويق معتمدة 📢"
                              : "✨ عميل المنصة"}
                      </span>
                    </div>
                  </div>

                  {/* ADMIN USER MOBILE */}
                  {userRole === "admin" && (
                    <div className="space-y-2 mb-3">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-black text-slate-950 bg-gradient-to-r from-amber-400 to-amber-500 border border-amber-600 shadow-md"
                      >
                        <ShieldCheck className="w-5 h-5 text-blue-950" />
                        <div className="flex flex-col text-right">
                          <span>لوحة تحكم الإدارة</span>
                          <span className="text-[10px] font-medium text-blue-950/80">الرقابة السيادية والاعتمادات</span>
                        </div>
                      </Link>

                      <div className="bg-white/5 p-2 rounded-xl border border-white/10 space-y-1">
                        <p className="px-2 text-[10px] font-bold text-amber-400/90 mb-1">معاينة بوابات المزودين:</p>
                        <Link
                          to="/provider-dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <LayoutDashboard className="w-4 h-4 text-amber-400" />
                          <span>لوحة تحكم المزود الموحدة</span>
                        </Link>
                        <Link
                          to="/provider-dashboard?tab=halls"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <Building2 className="w-4 h-4 text-indigo-400" />
                          <span>إدارة القاعات والخدمات</span>
                        </Link>
                        <Link
                          to="/provider-dashboard?tab=bookings"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <ClipboardList className="w-4 h-4 text-slate-400" />
                          <span>إدارة الحجوزات والطلبات</span>
                        </Link>
                        <Link
                          to="/provider-messages"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-bold text-slate-200 hover:bg-white/10"
                        >
                          <MessageSquare className="w-4 h-4 text-indigo-400" />
                          <span>محادثات العملاء</span>
                        </Link>
                      </div>

                      <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                        <Link
                          to="/bookings"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                        >
                          <Receipt className="w-4.5 h-4.5 text-slate-400" />
                          <span>حجوزاتي المعتمدة</span>
                        </Link>
                        <Link
                          to="/favorites"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-350 font-bold hover:bg-rose-500/10"
                        >
                          <Heart className="w-4.5 h-4.5 text-rose-400 fill-rose-400" />
                          <span>القاعات المفضلة (مفضلتي)</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                        >
                          <User className="w-4.5 h-4.5 text-slate-400" />
                          <span>الملف الشخصي والحساب</span>
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 font-bold hover:bg-white/5"
                        >
                          <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
                          <span>مركز الدعم والتذاكر</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* PROVIDER USER MOBILE (STRICT ISOLATION) */}
                  {userRole === "provider" && (
                    <div className="space-y-2 mb-3">
                      <div className="bg-white/5 p-2 rounded-xl border border-white/10 space-y-1">
                        <p className="px-2 text-[10px] font-bold text-amber-400 mb-1">بوابات الشريك المزود:</p>
                        <Link
                          to="/provider-dashboard"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-black text-amber-950 bg-amber-400 border border-amber-500"
                        >
                          <LayoutDashboard className="w-5 h-5 text-amber-950" />
                          <span>لوحة تحكم المزود الموحدة</span>
                        </Link>
                        <Link
                          to="/provider-dashboard?tab=halls"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-100 bg-indigo-900/50 border border-indigo-500/30"
                        >
                          <Building2 className="w-5 h-5 text-indigo-400" />
                          <span>إدارة القاعات والخدمات</span>
                        </Link>
                        <Link
                          to="/provider-dashboard?tab=bookings"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-slate-100 bg-slate-850 border border-slate-700/60"
                        >
                          <ClipboardList className="w-5 h-5 text-slate-400" />
                          <span>إدارة الحجوزات والطلبات</span>
                        </Link>
                        <Link
                          to="/provider-messages"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-indigo-100 bg-indigo-900/50 border border-indigo-550/30"
                        >
                          <MessageSquare className="w-5 h-5 text-indigo-400" />
                          <span>محادثات العملاء</span>
                        </Link>
                      </div>

                      <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                        <Link
                          to="/favorites"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-350 font-bold hover:bg-rose-500/10"
                        >
                          <Heart className="w-4.5 h-4.5 text-rose-400 fill-rose-400" />
                          <span>القاعات المفضلة (مفضلتي)</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                        >
                          <User className="w-4.5 h-4.5 text-slate-400" />
                          <span>الملف الشخصي والحساب</span>
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 font-bold hover:bg-white/5"
                        >
                          <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
                          <span>مركز الدعم والتذاكر</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* AGENCY USER MOBILE */}
                  {userRole === "agency" && (
                    <div className="space-y-2 mb-3">
                      <Link
                        to="/dashboard"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold text-fuchsia-950 bg-fuchsia-300 border border-fuchsia-400"
                      >
                        <Megaphone className="w-5 h-5 text-fuchsia-950" />
                        <span>لوحة جهة التسويق</span>
                      </Link>
                      <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5">
                        <Link
                          to="/favorites"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-350 font-bold hover:bg-rose-500/10"
                        >
                          <Heart className="w-4.5 h-4.5 text-rose-400 fill-rose-400" />
                          <span>القاعات المفضلة (مفضلتي)</span>
                        </Link>
                        <Link
                          to="/profile"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5"
                        >
                          <User className="w-4.5 h-4.5 text-slate-400" />
                          <span>الملف الشخصي والحساب</span>
                        </Link>
                        <Link
                          to="/support"
                          onClick={() => setIsMenuOpen(false)}
                          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 font-bold hover:bg-white/5"
                        >
                          <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
                          <span>مركز الدعم والتذاكر</span>
                        </Link>
                      </div>
                    </div>
                  )}

                  {/* CUSTOMER USER MOBILE (STRICT ISOLATION) */}
                  {userRole === "customer" && (
                    <div className="space-y-1 bg-white/5 p-2 rounded-xl border border-white/5 mb-3">
                      <p className="px-2 text-[10px] font-bold text-amber-400/80 mb-1">خدمات العميل:</p>
                      <Link
                        to="/bookings"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5 hover:text-amber-400 transition-all"
                      >
                        <Receipt className="w-4.5 h-4.5 text-slate-400" />
                        <span>حجوزاتي المعتمدة</span>
                      </Link>

                      <Link
                        to="/favorites"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-rose-350 font-bold hover:bg-rose-500/10 transition-all"
                      >
                        <Heart className="w-4.5 h-4.5 text-rose-400 fill-rose-400" />
                        <span>القاعات المفضلة</span>
                      </Link>

                      <Link
                        to="/bookings?tab=services"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5 hover:text-amber-400 transition-all"
                      >
                        <Sparkles className="w-4.5 h-4.5 text-slate-400" />
                        <span>طلبات خدمات المناسبات</span>
                      </Link>

                      <Link
                        to="/profile"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-slate-200 hover:bg-white/5 hover:text-amber-400 transition-all"
                      >
                        <User className="w-4.5 h-4.5 text-slate-400" />
                        <span>الملف الشخصي والحساب</span>
                      </Link>

                      <Link
                        to="/support"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-indigo-300 font-bold hover:bg-white/5 hover:text-indigo-200 transition-all"
                      >
                        <HelpCircle className="w-4.5 h-4.5 text-indigo-400" />
                        <span>مركز الدعم والتذاكر</span>
                      </Link>
                    </div>
                  )}

                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-bold text-red-400 hover:bg-red-500/10 rounded-xl transition-all cursor-pointer"
                  >
                    <LogOut className="w-4.5 h-4.5 text-red-400" />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}

              {!isAuthenticated && (
                <div className="flex flex-col gap-2 mt-4">
                  <button
                    onClick={() => setIsLoginModalOpen(true)}
                    className="w-full bg-orange-500 text-white px-4 py-3 rounded-xl font-bold"
                  >
                    تسجيل الدخول
                  </button>
                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="w-full text-center border-2 border-orange-500 text-orange-500 px-4 py-2.5 rounded-xl font-bold"
                  >
                    تسجيل حساب جديد
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <FavoriteCompareManager />
    </>
  );
}
