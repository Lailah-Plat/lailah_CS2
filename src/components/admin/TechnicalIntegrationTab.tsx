import React, { useState, useEffect, useMemo } from 'react';
import { 
  Code2, 
  Key, 
  Globe, 
  Send, 
  Terminal, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Copy, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  Layers, 
  Zap, 
  FileText, 
  Lock, 
  Server, 
  Check, 
  ArrowUpRight, 
  Cpu, 
  Sliders, 
  Radio, 
  Webhook, 
  Play, 
  ExternalLink,
  BookOpen,
  Smartphone,
  MessageSquare,
  Sparkles,
  Database,
  Building,
  Shield,
  Activity,
  Search,
  Filter,
  Trash2,
  Plus,
  Compass,
  MapPin,
  Clock,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Download,
  AlertTriangle,
  BadgeCheck,
  Hash
} from 'lucide-react';

interface TechnicalIntegrationTabProps {
  showNotification?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  [key: string]: any;
}

export const TechnicalIntegrationTab: React.FC<TechnicalIntegrationTabProps> = ({ showNotification }) => {
  // Main Subtabs matching user specification
  const [subTab, setSubTab] = useState<
    'api_keys' | 'webhooks' | 'sovereign_gov' | 'sms_whatsapp' | 'google_maps' | 'live_logs'
  >('api_keys');

  // 1. API Keys & Scopes State
  const [apiKeys, setApiKeys] = useState(() => {
    try {
      const saved = localStorage.getItem('PLATFORM_TECH_API_KEYS');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      productionPublicKey: 'pk_live_laylah_98234871923847192847',
      productionSecretKey: 'sk_live_laylah_983247982347982374982734982734',
      sandboxPublicKey: 'pk_test_laylah_11223344556677889900',
      sandboxSecretKey: 'sk_test_laylah_99887766554433221100',
      rateLimitPerMinute: 300,
      ipWhitelist: '178.62.204.112\n185.199.108.153',
      enableApiKeyAuth: true,
      requireSignatureHeader: true,
      createdAt: '2026-01-15T08:30:00Z',
      lastUsedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString()
    };
  });

  // Granular Scopes Config
  const [scopesConfig, setScopesConfig] = useState<Record<string, { read: boolean; write: boolean; execute: boolean }>>(() => {
    try {
      const saved = localStorage.getItem('PLATFORM_API_SCOPES');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      'bookings': { read: true, write: true, execute: true },
      'zatca_invoicing': { read: true, write: true, execute: true },
      'financial_entries': { read: true, write: false, execute: true },
      'sms_notifications': { read: true, write: true, execute: true },
      'identity_verification': { read: true, write: false, execute: true },
      'halls_services': { read: true, write: true, execute: false },
    };
  });

  const [showSecretKey, setShowSecretKey] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // 2. Webhooks & Event Streams State
  const [webhooks, setWebhooks] = useState(() => {
    try {
      const saved = localStorage.getItem('PLATFORM_TECH_WEBHOOKS');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [
      {
        id: 'wh_1',
        name: 'إشعارات تأكيد وانعقاد الحجوزات (Booking Events)',
        url: 'https://api.partner-system.sa/webhooks/laylah-bookings',
        events: ['booking.created', 'booking.paid', 'booking.confirmed'],
        status: 'active',
        secret: 'whsec_893247928374982374ae812c',
        lastDeliveryStatus: 'success',
        lastStatusCode: 200,
        lastLatencyMs: 98,
        lastDeliveryTime: new Date(Date.now() - 1000 * 60 * 12).toISOString()
      },
      {
        id: 'wh_2',
        name: 'إشعارات التسويات وفك الضمان المالي (Escrow Release)',
        url: 'https://erp.finance-hub.com/api/v1/laylah-settlements',
        events: ['payment.paid', 'refund.processed', 'zatca.invoice_issued'],
        status: 'active',
        secret: 'whsec_983274982374982734bc7719',
        lastDeliveryStatus: 'success',
        lastStatusCode: 200,
        lastLatencyMs: 145,
        lastDeliveryTime: new Date(Date.now() - 1000 * 60 * 38).toISOString()
      },
      {
        id: 'wh_3',
        name: 'إشعار طلبات الخدمات المساندة الفورية (Independent Services)',
        url: 'https://dispatch.services-hub.sa/hooks/incoming',
        events: ['booking.created', 'refund.processed'],
        status: 'active',
        secret: 'whsec_112233445566778899fa0021',
        lastDeliveryStatus: 'success',
        lastStatusCode: 200,
        lastLatencyMs: 112,
        lastDeliveryTime: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      }
    ];
  });

  const [testingWebhookId, setTestingWebhookId] = useState<string | null>(null);
  const [webhookSimResult, setWebhookSimResult] = useState<any | null>(null);
  const [selectedEventType, setSelectedEventType] = useState<'booking.created' | 'payment.paid' | 'zatca.invoice_issued' | 'refund.processed'>('booking.created');
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhook, setNewWebhook] = useState({
    name: '',
    url: '',
    events: ['booking.created', 'payment.paid']
  });

  // 3. Sovereign & Gov Integrations (ZATCA, Nafath, Wathq, Shamous, SPL)
  const [sovereignConfig, setSovereignConfig] = useState(() => {
    let mergedData: any = {};
    try {
      const savedPlatformData = localStorage.getItem('PLATFORM_DATA');
      if (savedPlatformData) {
        const pd = JSON.parse(savedPlatformData);
        mergedData = {
          nafathEnabled: pd.nafathEnabled ?? true,
          nafathMode: pd.nafathMode || 'sandbox',
          nafathClientId: pd.nafathClientId || 'sa.gov.iam.lailah.client',
          nafathSecretKey: pd.nafathSecretKey || 'nfth_sec_99384729384729384729',
          wathqEnabled: pd.wathqEnabled ?? true,
          wathqMode: pd.wathqMode || 'sandbox',
          wathqApiKey: pd.wathqApiKey || 'wathq_live_key_982374982374982374',
          shamousEnabled: pd.shamousEnabled ?? true,
          shamousMode: pd.shamousMode || 'sandbox',
          shamousEstablishmentCode: pd.shamousEstablishmentCode || 'SHM-SA-90112',
          shamousToken: pd.shamousToken || 'shm_tok_9948271039482910',
          shamousAutoSync: pd.shamousAutoSync ?? true,
        };
      }
    } catch (e) {}

    try {
      const saved = localStorage.getItem('PLATFORM_SOVEREIGN_CONFIG');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          ...mergedData,
          // Guarantee backward & forward compatibility for field aliases
          nafathAppId: parsed.nafathAppId || mergedData.nafathClientId || 'LAYLAH-NAFATH-APP-0941',
          nafathApiKey: parsed.nafathApiKey || mergedData.nafathSecretKey || 'nfth_live_sec_99384729384729384729',
          nafathClientId: mergedData.nafathClientId || parsed.nafathAppId || 'sa.gov.iam.lailah.client',
          nafathSecretKey: mergedData.nafathSecretKey || parsed.nafathApiKey || 'nfth_live_sec_99384729384729384729',
          shamousEstablishmentCode: parsed.shamousEstablishmentCode || mergedData.shamousEstablishmentCode || 'SHM-SA-90112',
          shamousToken: parsed.shamousToken || mergedData.shamousToken || 'shm_tok_9948271039482910',
          shamousAutoSync: parsed.shamousAutoSync ?? mergedData.shamousAutoSync ?? true,
          shamousSecuritySector: parsed.shamousSecuritySector || 'قاعات الأفراح والاحتفالات والمرافق السياحية',
          shamousMode: parsed.shamousMode || mergedData.shamousMode || 'sandbox',
          shamousEnabled: parsed.shamousEnabled ?? mergedData.shamousEnabled ?? true,
        };
      }
    } catch (e) {}

    return {
      // ZATCA
      zatcaEnabled: true,
      zatcaEnvironment: 'production', // sandbox | simulation | production
      taxRegistrationNumber: '310123456700003',
      egsUuid: 'c52086e3-2e09-417c-a496-981249b6f849',
      csidSecret: 'sec_zatca_csid_prod_9923847298374',
      csidExpiryDate: '2027-12-31',
      autoClearanceB2B: true,
      autoReportingB2C: true,
      enableCryptoStamp: true,
      zatcaStatus: 'compliant', // compliant | pending | error
      
      // Nafath SSO
      nafathEnabled: mergedData.nafathEnabled ?? true,
      nafathMode: mergedData.nafathMode || 'sandbox',
      nafathAppId: 'LAYLAH-NAFATH-APP-0941',
      nafathClientId: mergedData.nafathClientId || 'sa.gov.iam.lailah.client',
      nafathApiKey: 'nfth_live_sec_99384729384729384729',
      nafathSecretKey: mergedData.nafathSecretKey || 'nfth_sec_99384729384729384729',
      nafathServiceDomain: 'iam.gov.sa',
      requireNafathForProviders: true,
      requireNafathForHighValueBookings: true,
      nafathStatus: 'connected',

      // Wathq
      wathqEnabled: mergedData.wathqEnabled ?? true,
      wathqMode: mergedData.wathqMode || 'sandbox',
      wathqApiKey: mergedData.wathqApiKey || 'wathq_live_key_982374982374982374',
      autoVerifyCommercialRegister: true,
      autoVerifyBaladyLicense: true,
      autoVerifyCivilDefense: true,
      wathqStatus: 'connected',

      // Shamous Security System
      shamousEnabled: mergedData.shamousEnabled ?? true,
      shamousMode: mergedData.shamousMode || 'sandbox',
      shamousEstablishmentCode: mergedData.shamousEstablishmentCode || 'SHM-SA-90112',
      shamousToken: mergedData.shamousToken || 'shm_tok_9948271039482910',
      shamousAutoSync: mergedData.shamousAutoSync ?? true,
      shamousSecuritySector: 'قاعات الأفراح والاحتفالات والمرافق السياحية',
      shamousStatus: 'connected',

      // SPL National Address
      splEnabled: true,
      splMode: 'sandbox',
      splApiKey: 'spl_live_api_982374982374982374',
      autoValidatePostalCode: true,
      autoFormatShortAddress: true,
      splStatus: 'connected'
    };
  });

  const [isTestingGovService, setIsTestingGovService] = useState<string | null>(null);
  const [govTestResult, setGovTestResult] = useState<any | null>(null);
  const [govFilter, setGovFilter] = useState<'all' | 'enabled' | 'disabled'>('all');
  const [govSearchQuery, setGovSearchQuery] = useState('');

  // 4. SMS & WhatsApp Gateways Config
  const [messagingConfig, setMessagingConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('PLATFORM_TECH_MESSAGING');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      smsProvider: 'unifonic', // unifonic | taqnyat | mobily_ws | twilio
      smsSenderName: 'LAYLAH',
      cstLicenseNumber: 'CST-LIC-2026-98412',
      smsApiKey: 'uni_live_app_982349823749823749823',
      smsApiSecret: 'uni_sec_9938472983749823749823',
      
      // WhatsApp Cloud API
      whatsAppProvider: 'meta_cloud_api',
      whatsAppPhoneId: '109823479238472',
      whatsAppBusinessId: 'waba_983274982374982',
      whatsAppAccessToken: 'EAAOx928374928374982374829374892374892374829374892374',
      autoSendOtp: true,
      autoSendBookingPdf: true,
      autoSendZatcaInvoice: true,
      autoSendLocationMap: true,
      status: 'active'
    };
  });

  const [isTestingMessageGateway, setIsTestingMessageGateway] = useState(false);
  const [testPhoneNumber, setTestPhoneNumber] = useState('0501234567');
  const [messageTestResult, setMessageTestResult] = useState<any | null>(null);

  // 5. Google Maps Platform Config
  const [googleMapsConfig, setGoogleMapsConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('PLATFORM_GOOGLE_MAPS_CONFIG');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return {
      apiKey: 'AIzaSyD9832479823749823749823749823749823',
      enablePlacesAutocomplete: true,
      enableGeocoding: true,
      enableDirectionsAndRouting: true,
      enableDistanceMatrix: true,
      defaultMapCenter: { lat: 24.7136, lng: 46.6753, city: 'الرياض' },
      mapId: 'laylah_luxury_map_dark_v2',
      status: 'connected',
      monthlyQuotaUsed: '14,280 / 100,000 req'
    };
  });

  // 6. Live API Logs State
  const [apiLogs, setApiLogs] = useState(() => {
    return [
      { id: 'log_1', method: 'POST', endpoint: '/api/zatca/generate-invoice', statusCode: 200, latencyMs: 104, ip: '178.62.204.112', timestamp: new Date(Date.now() - 1000 * 25).toISOString(), traceId: 'trc_98234a' },
      { id: 'log_2', method: 'POST', endpoint: '/api/bookings/create', statusCode: 201, latencyMs: 142, ip: '185.199.108.153', timestamp: new Date(Date.now() - 1000 * 80).toISOString(), traceId: 'trc_11209b' },
      { id: 'log_3', method: 'GET', endpoint: '/api/halls/search', statusCode: 200, latencyMs: 64, ip: '212.138.10.44', timestamp: new Date(Date.now() - 1000 * 140).toISOString(), traceId: 'trc_88341c' },
      { id: 'log_4', method: 'POST', endpoint: '/api/notifications/whatsapp-send', statusCode: 200, latencyMs: 188, ip: '178.62.204.112', timestamp: new Date(Date.now() - 1000 * 220).toISOString(), traceId: 'trc_77312d' },
      { id: 'log_5', method: 'POST', endpoint: '/api/auth/nafath-verify', statusCode: 200, latencyMs: 230, ip: '95.184.45.12', timestamp: new Date(Date.now() - 1000 * 310).toISOString(), traceId: 'trc_55410e' },
      { id: 'log_6', method: 'GET', endpoint: '/api/maps/places-autocomplete', statusCode: 200, latencyMs: 48, ip: '185.199.108.153', timestamp: new Date(Date.now() - 1000 * 420).toISOString(), traceId: 'trc_44190f' },
      { id: 'log_7', method: 'POST', endpoint: '/api/webhooks/dispatch', statusCode: 200, latencyMs: 92, ip: '178.62.204.112', timestamp: new Date(Date.now() - 1000 * 560).toISOString(), traceId: 'trc_33912g' }
    ];
  });

  const [logSearchQuery, setLogSearchQuery] = useState('');
  const [logStatusFilter, setLogStatusFilter] = useState<'all' | '2xx' | '4xx' | '5xx'>('all');
  const [isRefreshingLogs, setIsRefreshingLogs] = useState(false);

  const notify = (type: 'success' | 'error' | 'info' | 'warning', msg: string) => {
    if (showNotification) {
      showNotification(type, msg);
    }
  };

  const copyToClipboard = (text: string, keyName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(keyName);
    notify('success', 'تم نسخ المفتاح بنجاح إلى الحافظة 📋');
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // Handlers for Saves
  const handleSaveApiKeys = () => {
    localStorage.setItem('PLATFORM_TECH_API_KEYS', JSON.stringify(apiKeys));
    localStorage.setItem('PLATFORM_API_SCOPES', JSON.stringify(scopesConfig));
    notify('success', 'تم حفظ وتشفير مفاتيح وصلاحيات الـ API بنجاح 🔐');
  };

  const handleRegenerateApiKey = (type: 'live' | 'sandbox') => {
    const prefix = type === 'live' ? 'sk_live_laylah_' : 'sk_test_laylah_';
    const rand = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const newKey = prefix + rand;
    
    if (type === 'live') {
      setApiKeys((prev: any) => ({ ...prev, productionSecretKey: newKey, createdAt: new Date().toISOString() }));
    } else {
      setApiKeys((prev: any) => ({ ...prev, sandboxSecretKey: newKey }));
    }
    notify('warning', `تمت إعادة توليد مفتاح الـ Secret Key للبيئة ${type === 'live' ? 'الحية' : 'التجريبية'} ⚡`);
  };

  const handleTriggerWebhookTest = (wh: any) => {
    setTestingWebhookId(wh.id);
    setWebhookSimResult(null);

    setTimeout(() => {
      setTestingWebhookId(null);
      const samplePayloads: Record<string, any> = {
        'booking.created': {
          event: 'booking.created',
          bookingId: 'BKG-26-0000000001',
          hallId: 'hall_101',
          hallName: 'قاعة قصر الرياض الملكي',
          customer: { id: 'cust_901', name: 'سارة الدوسري', phone: '+966501234567' },
          totalAmountSar: 35000,
          depositPaid: 10500,
          eventDate: '2026-10-15',
          timestamp: new Date().toISOString()
        },
        'payment.paid': {
          event: 'payment.paid',
          bookingId: 'BKG-26-0000000001',
          invoiceNumber: 'INV-260000000001',
          amountPaidSar: 35000,
          paymentGateway: 'Moyasar (Mada/ApplePay)',
          settlementStatus: 'held_in_escrow',
          timestamp: new Date().toISOString()
        },
        'zatca.invoice_issued': {
          event: 'zatca.invoice_issued',
          invoiceNumber: 'INV-260000000001',
          taxAmountSar: 4565.22,
          zatcaStatus: 'CLEARED_AND_REPORTED',
          cryptographicStamp: 'SHA256withECDSA: 4a8f9c2d1e0b5a7...',
          timestamp: new Date().toISOString()
        },
        'refund.processed': {
          event: 'refund.processed',
          bookingId: 'BKG-26-0000000001',
          refundNumber: 'EXP-26-0000000001',
          refundAmountSar: 10500,
          reason: 'إلغاء مبكر ضمن نافذة الإرجاع الآمن',
          timestamp: new Date().toISOString()
        }
      };

      const payload = samplePayloads[selectedEventType] || samplePayloads['booking.created'];

      setWebhookSimResult({
        webhookId: wh.id,
        url: wh.url,
        eventType: selectedEventType,
        statusCode: 200,
        responseTimeMs: Math.floor(Math.random() * 40) + 85,
        signingSignature: 'sha256=' + Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join(''),
        timestamp: new Date().toISOString(),
        payloadSent: payload,
        responseHeaders: {
          'server': 'nginx/1.24.0',
          'content-type': 'application/json; charset=utf-8',
          'x-ratelimit-remaining': '299'
        },
        responseBody: {
          success: true,
          message: 'Event received and HMAC SHA256 signature verified successfully.'
        }
      });
      notify('success', `تم إرسال حدث ${selectedEventType} التجريبي بنجاح إلى: ${wh.name} (200 OK) ⚡`);
    }, 1100);
  };

  const handleTestGovService = (service: 'zatca' | 'nafath' | 'wathq' | 'shamous' | 'spl') => {
    setIsTestingGovService(service);
    setGovTestResult(null);

    setTimeout(() => {
      setIsTestingGovService(null);
      if (service === 'zatca') {
        setGovTestResult({
          service: 'هيئة الزكاة والضريبة والجمارك (ZATCA Fatoora Phase 2)',
          success: true,
          details: {
            environment: sovereignConfig.zatcaEnvironment,
            taxNumber: sovereignConfig.taxRegistrationNumber,
            egsUuid: sovereignConfig.egsUuid,
            csidValidation: 'Valid - Signed by ZATCA CA',
            csidExpiry: sovereignConfig.csidExpiryDate,
            cryptographicStampAlgorithm: 'ECDSA with secp256k1',
            qrCodeValidation: 'Compliant with ZATCA Phase 2 specs (TLV Base64)',
            status: 'REPORTED_AND_ACCEPTED (200 OK)'
          }
        });
        notify('success', 'تم التحقق من مطابقة معايير ZATCA Fatoora Phase 2 بنجاح 🏛️');
      } else if (service === 'nafath') {
        setGovTestResult({
          service: 'النفاذ الوطني الموحد (Nafath IAM SSO)',
          success: true,
          details: {
            mode: sovereignConfig.nafathMode === 'live' ? 'Live Production SSO' : 'Developer Sandbox Environment',
            clientId: sovereignConfig.nafathClientId || sovereignConfig.nafathAppId,
            serviceDomain: sovereignConfig.nafathServiceDomain,
            apiGatewayStatus: 'Connected (HTTPS TLS 1.3)',
            biometricVerification: 'Ready for 2FA Push Authorization',
            lastHeartbeat: new Date().toLocaleTimeString('ar-SA')
          }
        });
        notify('success', 'تم التحقق من جاهزية بوابات النفاذ الوطني الموحد 🛡️');
      } else if (service === 'wathq') {
        setGovTestResult({
          service: 'منصة واثق للتحقق من السجلات والتراخيص (Wathq Verification API)',
          success: true,
          details: {
            mode: sovereignConfig.wathqMode === 'live' ? 'Live Production' : 'Sandbox Environment',
            apiKeyConfigured: !!sovereignConfig.wathqApiKey,
            commercialRegisterLookup: 'ACTIVE (سجلات الشركات والمؤسسات متزامنة مع وزارة التجارة)',
            baladyLicenseSync: 'ACTIVE (الرخص البلدية وقدرات الصالات)',
            civilDefenseCompliance: 'ACTIVE (شهادات السلامة والوقاية)',
            responseTime: '86ms'
          }
        });
        notify('success', 'تم اختبار الاتصال اللحظي مع واجهات منصة واثق 📜');
      } else if (service === 'shamous') {
        setGovTestResult({
          service: 'نظام شموس الأمني الموحد (Shamous Security Integration API)',
          success: true,
          details: {
            establishmentCode: sovereignConfig.shamousEstablishmentCode || 'SHM-SA-90112',
            mode: sovereignConfig.shamousMode === 'live' ? 'Live Production Security Network' : 'Developer Sandbox Gateway',
            tokenStatus: 'VERIFIED (SHA-256 HMAC Active)',
            securitySector: sovereignConfig.shamousSecuritySector || 'قاعات الأفراح والاحتفالات والمرافق السياحية',
            autoSyncPolicy: sovereignConfig.shamousAutoSync ? 'Real-time Event Dispatch (إرسال فوري لحظي)' : 'Manual Review Queue (مراجعة واعتماد يدوي)',
            hospitalityRegisterSync: 'ONLINE (جاهز لرفع سجلات النزلاء ومناسبات القاعات)',
            connectionStatus: '200 OK - Secure SSL TLS 1.3 Tunnel Established',
            lastPingTimestamp: new Date().toISOString()
          }
        });
        notify('success', 'تم اختبار الاتصال والتكامل الأمني مع نظام شموس بنجاح (200 OK) 🏢');
      } else if (service === 'spl') {
        setGovTestResult({
          service: 'العنوان الوطني سبل (Saudi Post SPL)',
          success: true,
          details: {
            mode: sovereignConfig.splMode === 'live' ? 'Live Production' : 'Sandbox Environment',
            postalValidation: 'PASSED (تحديد الرمز البريدي والرقم الإضافي)',
            shortAddressLookup: 'ACTIVE (مثال: RRRD2934)',
            geocodingAccuracy: 'Exact Building Match (100%)'
          }
        });
        notify('success', 'تم التحقق من الربط مع العنوان الوطني سبل 🗺️');
      }
    }, 1200);
  };

  const handleTestMessageGateway = () => {
    setIsTestingMessageGateway(true);
    setMessageTestResult(null);

    setTimeout(() => {
      setIsTestingMessageGateway(false);
      setMessageTestResult({
        success: true,
        phone: testPhoneNumber,
        smsProvider: messagingConfig.smsProvider,
        smsSenderId: messagingConfig.smsSenderName,
        cstLicense: messagingConfig.cstLicenseNumber,
        whatsAppStatus: 'Delivered (Cloud API Template: booking_confirmation_v2)',
        dispatchedAt: new Date().toISOString(),
        costSar: 0.18
      });
      notify('success', `تم إرسال رسالة تجريبية بنجاح إلى ${testPhoneNumber} عبر SMS و WhatsApp 📱`);
    }, 1300);
  };

  const handleRefreshLogs = () => {
    setIsRefreshingLogs(true);
    setTimeout(() => {
      setIsRefreshingLogs(false);
      const newEntry = {
        id: `log_${Date.now()}`,
        method: 'GET',
        endpoint: '/api/system/health',
        statusCode: 200,
        latencyMs: Math.floor(Math.random() * 50) + 40,
        ip: '178.62.204.112',
        timestamp: new Date().toISOString(),
        traceId: 'trc_' + Math.random().toString(36).substring(2, 8)
      };
      setApiLogs([newEntry, ...apiLogs.slice(0, 15)]);
      notify('info', 'تم تحديث سجلات الاستدعاءات اللحظية ⚡');
    }, 600);
  };

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return apiLogs.filter(log => {
      const matchSearch = log.endpoint.toLowerCase().includes(logSearchQuery.toLowerCase()) ||
                          log.ip.includes(logSearchQuery) ||
                          log.method.toLowerCase().includes(logSearchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (logStatusFilter === '2xx') return log.statusCode >= 200 && log.statusCode < 300;
      if (logStatusFilter === '4xx') return log.statusCode >= 400 && log.statusCode < 500;
      if (logStatusFilter === '5xx') return log.statusCode >= 500;
      return true;
    });
  }, [apiLogs, logSearchQuery, logStatusFilter]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right font-sans" dir="rtl">
      
      {/* Top Banner & Integration Metrics Hub */}
      <div className="bg-gradient-to-l from-slate-900 via-indigo-950 to-slate-900 text-white p-7 rounded-3xl shadow-xl border border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-xl">
              <Code2 className="w-5 h-5" />
            </span>
            <span className="text-xs bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-3 py-0.5 rounded-full font-mono font-bold">
              Integration & Gateway Engine v3.1
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">الربط التقني (Technical Integrations)</h2>
          <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
            المنصة المركزية لإدارة مفاتيح الـ REST APIs، أحداث الـ Webhooks، الربط الحكومي والسيادي (ZATCA, Nafath, Wathq, SPL)، بوابات الرسائل وواتساب، خرائط Google Maps، وسجلات التشخيص الحي.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-stretch md:self-auto justify-end">
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold text-slate-200">البوابات: 100% Operational</span>
          </div>
          <div className="bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-slate-800 flex items-center gap-2">
            <Activity className="w-4 h-4 text-indigo-400" />
            <span className="text-xs font-mono font-bold text-slate-200">الاستجابة: ~112ms</span>
          </div>
        </div>
      </div>

      {/* Integration Metrics Hub Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">مفاتيح API النشطة</span>
            <strong className="text-lg font-black text-slate-800 font-mono">4 مفاتيح</strong>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <Webhook className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">نقاط Webhook المعتمدة</span>
            <strong className="text-lg font-black text-slate-800 font-mono">{webhooks.length} نقاط</strong>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">مطابقة ZATCA المرحلة 2</span>
            <strong className="text-sm font-black text-emerald-600">معتمد 100% ✅</strong>
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[11px] text-slate-400 font-bold block">Google Maps & SPL</span>
            <strong className="text-sm font-black text-blue-600">متصل ونشط 🟢</strong>
          </div>
        </div>
      </div>

      {/* Six Main Subtabs Navigation */}
      <div className="flex flex-wrap bg-slate-100 p-1.5 rounded-2xl w-full gap-1 border border-slate-200">
        {[
          { id: 'api_keys', label: 'مفاتيح الـ API والصلاحيات', icon: <Key className="w-4 h-4" /> },
          { id: 'webhooks', label: 'الخطافات الشبكية (Webhooks)', icon: <Webhook className="w-4 h-4" /> },
          { id: 'sovereign_gov', label: 'الربط الحكومي والسيادي', icon: <Building className="w-4 h-4" /> },
          { id: 'sms_whatsapp', label: 'بوابات الرسائل وواتساب', icon: <MessageSquare className="w-4 h-4" /> },
          { id: 'google_maps', label: 'خرائط Google Maps Platform', icon: <Globe className="w-4 h-4" /> },
          { id: 'live_logs', label: 'سجلات الـ API والتشخيص الحي', icon: <Terminal className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id as any)}
            className={`flex-1 py-3 px-3 text-xs font-bold rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-2 whitespace-nowrap ${
              subTab === t.id 
                ? 'bg-white text-indigo-900 shadow-sm font-black border border-slate-200' 
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            {t.icon}
            <span>{t.label}</span>
          </button>
        ))}
      </div>

      {/* ========================================================================= */}
      {/* 1. API KEYS & SCOPES TAB */}
      {/* ========================================================================= */}
      {subTab === 'api_keys' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* Live Production Keys */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">مفاتيح الإنتاج الحي (Live Production Environment)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تُستخدم هذه المفاتيح في البيئة الحية لتنفيذ الطلبات ومعالجة الدفع وإصدار الفواتير الرسمية.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                  بيئة حية (Live Production) 🟢
                </span>
                <button
                  onClick={() => handleRegenerateApiKey('live')}
                  className="text-xs text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 font-bold px-3 py-1 rounded-xl transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة توليد المفتاح السري</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 font-mono text-xs">
              <div>
                <div className="flex justify-between items-center mb-1.5 font-sans">
                  <label className="text-slate-700 font-bold">المفتاح العام (Publishable API Key):</label>
                  <span className="text-[11px] text-slate-400">صالح لجميع استدعاءات الواجهة</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={apiKeys.productionPublicKey} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-left outline-none font-bold" 
                    dir="ltr"
                  />
                  <button
                    onClick={() => copyToClipboard(apiKeys.productionPublicKey, 'prod_pub')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedKey === 'prod_pub' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'prod_pub' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5 font-sans">
                  <label className="text-slate-700 font-bold">المفتاح السري (Secret Key - تشفير عالي وسري للغاية):</label>
                  <span className="text-[11px] text-rose-500 font-bold">لا تشارك هذا المفتاح إطلاقاً</span>
                </div>
                <div className="flex items-center gap-2">
                  <input 
                    type={showSecretKey['prod_sec'] ? 'text' : 'password'} 
                    readOnly 
                    value={apiKeys.productionSecretKey} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-left outline-none font-bold" 
                    dir="ltr"
                  />
                  <button
                    onClick={() => setShowSecretKey(prev => ({ ...prev, prod_sec: !prev['prod_sec'] }))}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                    title={showSecretKey['prod_sec'] ? 'إخفاء' : 'إظهار'}
                  >
                    {showSecretKey['prod_sec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKeys.productionSecretKey, 'prod_sec')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedKey === 'prod_sec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'prod_sec' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sandbox Environment Keys */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Terminal className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">مفاتيح البيئة التجريبية (Sandbox Environment)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تُستخدم لاختبار الربط والتحقق من الاستجابات بدون التأثير على الحسابات المالية الحقيقية.</p>
                </div>
              </div>
              <span className="text-xs bg-amber-100 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200">
                بيئة تجريبية (Sandbox) 🟡
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 font-mono text-xs">
              <div>
                <label className="block text-slate-700 font-bold font-sans mb-1.5">المفتاح العام التجريبي (Sandbox Public Key):</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    readOnly 
                    value={apiKeys.sandboxPublicKey} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-left outline-none font-bold" 
                    dir="ltr"
                  />
                  <button
                    onClick={() => copyToClipboard(apiKeys.sandboxPublicKey, 'sand_pub')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedKey === 'sand_pub' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'sand_pub' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-bold font-sans mb-1.5">المفتاح السري التجريبي (Sandbox Secret Key):</label>
                <div className="flex items-center gap-2">
                  <input 
                    type={showSecretKey['sand_sec'] ? 'text' : 'password'} 
                    readOnly 
                    value={apiKeys.sandboxSecretKey} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono text-left outline-none font-bold" 
                    dir="ltr"
                  />
                  <button
                    onClick={() => setShowSecretKey(prev => ({ ...prev, sand_sec: !prev['sand_sec'] }))}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0"
                  >
                    {showSecretKey['sand_sec'] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => copyToClipboard(apiKeys.sandboxSecretKey, 'sand_sec')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedKey === 'sand_sec' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedKey === 'sand_sec' ? 'تم النسخ' : 'نسخ'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Granular Scopes & Permissions */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-5 h-5 text-indigo-600" />
              <span>تحديد وتخصيص صلاحيات مفاتيح الـ API (API Scopes & Permissions)</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <th className="p-3 rounded-r-xl">النطاق والخدمة (Scope Resource)</th>
                    <th className="p-3 text-center">صلاحية القراءة (Read)</th>
                    <th className="p-3 text-center">صلاحية الكتابة والتعديل (Write)</th>
                    <th className="p-3 text-center rounded-l-xl">صلاحية التنفيذ والمزامنة (Execute)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { key: 'bookings', label: 'حجوزات القاعات والخدمات (Bookings & Orders)', desc: 'قراءة تفاصيل الحجوزات، تحديث الحالات، وإلغاء الحجز.' },
                    { key: 'zatca_invoicing', label: 'الفوترة الإلكترونية والضرائب (ZATCA Invoicing)', desc: 'إصدار الفواتير المشفرة INV-26XXXXXXXXXX والتحقق من الأختام.' },
                    { key: 'financial_entries', label: 'القيود المالية والتسويات (Financial Revenue & Exp)', desc: 'استعلام وتوليد قيود الإيرادات REV والمصروفات EXP.' },
                    { key: 'sms_notifications', label: 'إرسال الإشعارات والرسائل (SMS & WhatsApp)', desc: 'إطلاق رسائل التأكيد ورموز التحقق OTP وتنبيهات الحجوزات.' },
                    { key: 'identity_verification', label: 'التحقق الرقمي والهويات (Nafath & Wathq)', desc: 'الاستعلام عن هويات الموفرين والسجلات التجارية والرخص.' },
                    { key: 'halls_services', label: 'كتالوج الصالات والخدمات (Halls & Addons)', desc: 'استعلام وتحديث بيانات وأسعار القاعات والخدمات المساندة.' },
                  ].map(item => (
                    <tr key={item.key} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-3">
                        <strong className="text-slate-800 block text-xs">{item.label}</strong>
                        <span className="text-[11px] text-slate-400">{item.desc}</span>
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={scopesConfig[item.key]?.read ?? true} 
                          onChange={e => setScopesConfig({
                            ...scopesConfig,
                            [item.key]: { ...scopesConfig[item.key], read: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={scopesConfig[item.key]?.write ?? false} 
                          onChange={e => setScopesConfig({
                            ...scopesConfig,
                            [item.key]: { ...scopesConfig[item.key], write: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </td>
                      <td className="p-3 text-center">
                        <input 
                          type="checkbox" 
                          checked={scopesConfig[item.key]?.execute ?? false} 
                          onChange={e => setScopesConfig({
                            ...scopesConfig,
                            [item.key]: { ...scopesConfig[item.key], execute: e.target.checked }
                          })}
                          className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Rate Limiting & Whitelist */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs pt-4 border-t border-slate-100">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">معدل الطلبات في الدقيقة (Rate Limit Per Minute):</label>
                <input 
                  type="number" 
                  value={apiKeys.rateLimitPerMinute} 
                  onChange={e => setApiKeys({ ...apiKeys, rateLimitPerMinute: parseInt(e.target.value) || 60 })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 font-mono"
                />
                <p className="text-[11px] text-slate-400 leading-relaxed">يتم إرجاع كود HTTP 429 عند تجاوز الحد لحماية خوادم المنصة من الإغراق.</p>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">عناوين الـ IP الموثوقة (IP Whitelist - سطر لكل عنوان):</label>
                <textarea 
                  value={apiKeys.ipWhitelist} 
                  onChange={e => setApiKeys({ ...apiKeys, ipWhitelist: e.target.value })} 
                  rows={2}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold text-slate-800 text-xs"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveApiKeys}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-3 rounded-2xl text-xs transition-all shadow-md shadow-indigo-600/20 cursor-pointer flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>حفظ وتطبيق إعدادات وصلاحيات الـ API 💾</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. WEBHOOKS & EVENT STREAMS TAB */}
      {/* ========================================================================= */}
      {subTab === 'webhooks' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-indigo-600" />
                  <span>نقاط استقبال الـ Webhooks المسجلة (Registered Webhook Endpoints)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ترسل المنصة إشعارات فورية مشفرة بتوقيع HMAC-SHA256 للأنظمة الخارجية عند وقوع أحداث العمليات.</p>
              </div>

              <button
                onClick={() => setShowAddWebhook(!showAddWebhook)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <span>{showAddWebhook ? 'إلغاء الإضافة' : '+ إضافة نقطة Webhook جديدة'}</span>
              </button>
            </div>

            {/* Add Webhook Form */}
            {showAddWebhook && (
              <div className="p-5 bg-indigo-50/60 rounded-2xl border border-indigo-100 space-y-4 animate-in fade-in duration-200">
                <h4 className="font-bold text-slate-800 text-xs">إضافة نقطة Webhook جديدة:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">اسم المعرّف / النظام المستقبل:</label>
                    <input 
                      type="text" 
                      placeholder="مثال: نظام تخطيط الموارد ERP"
                      value={newWebhook.name}
                      onChange={e => setNewWebhook({ ...newWebhook, name: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">رابط الـ Webhook (Endpoint URL):</label>
                    <input 
                      type="url" 
                      placeholder="https://erp.domain.com/webhooks/laylah"
                      value={newWebhook.url}
                      onChange={e => setNewWebhook({ ...newWebhook, url: e.target.value })}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-mono text-left"
                      dir="ltr"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setShowAddWebhook(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button
                    onClick={() => {
                      if (!newWebhook.name || !newWebhook.url) {
                        notify('error', 'يرجى كتابة الاسم ورابط الـ Webhook كاملاً');
                        return;
                      }
                      const created = {
                        id: `wh_${Date.now()}`,
                        name: newWebhook.name,
                        url: newWebhook.url,
                        events: newWebhook.events,
                        status: 'active',
                        secret: `whsec_${Math.random().toString(36).substring(2, 15)}`,
                        lastDeliveryStatus: 'success',
                        lastStatusCode: 200,
                        lastLatencyMs: 110,
                        lastDeliveryTime: new Date().toISOString()
                      };
                      const updated = [created, ...webhooks];
                      setWebhooks(updated);
                      localStorage.setItem('PLATFORM_TECH_WEBHOOKS', JSON.stringify(updated));
                      setShowAddWebhook(false);
                      setNewWebhook({ name: '', url: '', events: ['booking.created', 'payment.paid'] });
                      notify('success', 'تم تسجيل وتفعيل نقطة الـ Webhook بنجاح ⚡');
                    }}
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    حفظ وتفعيل النقطة
                  </button>
                </div>
              </div>
            )}

            {/* List of Webhooks */}
            <div className="space-y-4">
              {webhooks.map(wh => (
                <div key={wh.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 hover:border-indigo-300 transition-all space-y-3">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2.5">
                      <span className={`w-3 h-3 rounded-full ${wh.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
                      <strong className="text-slate-800 text-sm font-bold">{wh.name}</strong>
                      <div className="flex flex-wrap gap-1">
                        {wh.events.map((ev, i) => (
                          <span key={i} className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md font-mono font-bold">
                            {ev}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleTriggerWebhookTest(wh)}
                        disabled={testingWebhookId === wh.id}
                        className="bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-indigo-700 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all cursor-pointer"
                      >
                        {testingWebhookId === wh.id ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span>جاري إرسال الحدث...</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            <span>إرسال تجريبي (Ping) 🚀</span>
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => {
                          const updated = webhooks.filter(item => item.id !== wh.id);
                          setWebhooks(updated);
                          localStorage.setItem('PLATFORM_TECH_WEBHOOKS', JSON.stringify(updated));
                          notify('info', 'تم حذف نقطة الـ Webhook.');
                        }}
                        className="text-rose-500 hover:text-rose-700 p-1 text-xs font-bold"
                        title="حذف النقطة"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-between gap-2 text-xs font-mono text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100" dir="ltr">
                    <span className="text-left truncate max-w-lg font-bold">{wh.url}</span>
                    <div className="flex items-center gap-3 text-[11px] font-sans">
                      <span className="text-slate-400">Signing Secret: <code className="text-indigo-600 font-mono font-bold">{wh.secret.substring(0, 10)}...</code></span>
                      <span className="text-emerald-600 font-bold">HTTP {wh.lastStatusCode} ({wh.lastLatencyMs}ms)</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Live Ping Dispatcher Tool */}
            <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                <span>أداة المحاكاة الحية للأحداث (Live Ping Dispatcher):</span>
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-xs">
                <span className="font-bold text-slate-600">اختر نوع الحدث للمحاكاة:</span>
                {[
                  { id: 'booking.created', label: 'إنشاء حجز جديد (booking.created)' },
                  { id: 'payment.paid', label: 'دفع ناجح وضمان (payment.paid)' },
                  { id: 'zatca.invoice_issued', label: 'إصدار فاتورة ضريبية (zatca.invoice_issued)' },
                  { id: 'refund.processed', label: 'استرداد مالي (refund.processed)' },
                ].map(item => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedEventType(item.id as any)}
                    className={`px-3 py-1.5 rounded-xl font-mono text-[11px] font-bold cursor-pointer transition-all ${
                      selectedEventType === item.id 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Webhook Result Output */}
            {webhookSimResult && (
              <div className="p-4 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800 space-y-3 animate-in fade-in font-mono text-xs" dir="ltr">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                    <span>[HTTP 200 OK] Webhook Event Dispatched Successfully</span>
                  </div>
                  <span className="text-[11px] text-slate-400">Latency: {webhookSimResult.responseTimeMs}ms</span>
                </div>
                <div className="text-[11px] text-indigo-300">
                  <strong>X-Laylah-Signature (HMAC-SHA256):</strong> {webhookSimResult.signingSignature}
                </div>
                <pre className="text-amber-300 overflow-x-auto text-[11px] max-h-48 bg-slate-950 p-3 rounded-xl">
                  {JSON.stringify(webhookSimResult.payloadSent, null, 2)}
                </pre>
              </div>
            )}

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. SOVEREIGN & GOV INTEGRATIONS TAB */}
      {/* ========================================================================= */}
      {subTab === 'sovereign_gov' && (() => {
        const activeCount = [
          sovereignConfig.zatcaEnabled,
          sovereignConfig.nafathEnabled,
          sovereignConfig.wathqEnabled,
          sovereignConfig.shamousEnabled,
          sovereignConfig.splEnabled
        ].filter(Boolean).length;

        const handleToggleAll = (enable: boolean) => {
          setSovereignConfig({
            ...sovereignConfig,
            zatcaEnabled: enable,
            nafathEnabled: enable,
            wathqEnabled: enable,
            shamousEnabled: enable,
            splEnabled: enable
          });
          notify(enable ? 'success' : 'info', enable ? 'تم تفعيل جميع المنظومات والخدمات السيادية ⚡' : 'تم تعطيل جميع المنظومات مؤقتاً ⚪');
        };

        const shouldShowCard = (enabled: boolean, searchTerms: string[]) => {
          if (govFilter === 'enabled' && !enabled) return false;
          if (govFilter === 'disabled' && enabled) return false;
          if (!govSearchQuery.trim()) return true;
          const q = govSearchQuery.toLowerCase();
          return searchTerms.some(term => term.toLowerCase().includes(q));
        };

        return (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Header & Overview Stats Bar */}
            <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden">
              <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
              <div className="absolute -right-10 -top-10 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="space-y-2 max-w-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black tracking-tight">الربط مع المنظومات والخدمات السيادية والحكومية</h2>
                      <p className="text-xs text-slate-300 mt-0.5">البوابات والواجهات الرقمية المعتمدة في المملكة العربية السعودية للامتثال التنظيمي والتحقق اللحظي.</p>
                    </div>
                  </div>
                </div>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full lg:w-auto">
                  <div className="bg-white/10 backdrop-blur-md border border-white/10 p-3 rounded-2xl text-center">
                    <span className="text-[11px] text-slate-300 block">إجمالي المنظومات</span>
                    <span className="text-lg font-black text-white">5 منظومات</span>
                  </div>
                  <div className="bg-emerald-500/20 backdrop-blur-md border border-emerald-500/30 p-3 rounded-2xl text-center">
                    <span className="text-[11px] text-emerald-300 block">المنظومات المفعلة</span>
                    <span className="text-lg font-black text-emerald-400">{activeCount} / 5 نشطة</span>
                  </div>
                  <div className="bg-indigo-500/20 backdrop-blur-md border border-indigo-500/30 p-3 rounded-2xl text-center col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-indigo-200 block">نسبة الامتثال الرقمي</span>
                    <span className="text-lg font-black text-indigo-300">{Math.round((activeCount / 5) * 100)}% متطابقة</span>
                  </div>
                </div>
              </div>

              {/* Quick Filter & Global Actions */}
              <div className="relative z-10 flex flex-wrap justify-between items-center gap-3 pt-6 mt-6 border-t border-slate-700/60">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-300">تصفية العرض:</span>
                  <div className="flex bg-slate-950/60 p-1 rounded-xl border border-slate-700/50">
                    <button
                      onClick={() => setGovFilter('all')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        govFilter === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      الكل (5)
                    </button>
                    <button
                      onClick={() => setGovFilter('enabled')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        govFilter === 'enabled' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      المفعلة ({activeCount})
                    </button>
                    <button
                      onClick={() => setGovFilter('disabled')}
                      className={`px-3 py-1 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        govFilter === 'disabled' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      المعطلة ({5 - activeCount})
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="بحث في الخدمات الحكومية..."
                      value={govSearchQuery}
                      onChange={e => setGovSearchQuery(e.target.value)}
                      className="bg-slate-950/60 border border-slate-700/50 text-white placeholder-slate-400 text-xs rounded-xl pr-9 pl-3 py-1.5 outline-none focus:border-indigo-500 w-48 sm:w-60"
                    />
                  </div>
                  <button
                    onClick={() => handleToggleAll(true)}
                    className="bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    تفعيل الكل ⚡
                  </button>
                  <button
                    onClick={() => handleToggleAll(false)}
                    className="bg-slate-800 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 border border-slate-700 text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer"
                  >
                    تعطيل الكل ⚪
                  </button>
                </div>
              </div>
            </div>

            {/* List of Sovereign Services (5 Services with Independent Toggles) */}
            <div className="space-y-6">

              {/* 1. ZATCA Fatoora Phase 2 */}
              {shouldShowCard(!!sovereignConfig.zatcaEnabled, ['zatca', 'زكاة', 'ضريبة', 'فاتورة', 'جمارك', 'fatoora']) && (
                <div className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm p-6 space-y-6 ${
                  sovereignConfig.zatcaEnabled ? 'border-emerald-200/80 ring-1 ring-emerald-500/10' : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                        sovereignConfig.zatcaEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <ShieldCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-base">هيئة الزكاة والضريبة والجمارك (ZATCA Fatoora Phase 2)</h3>
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">المرحلة الثانية</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">توليد الأختام المشفرة (Cryptographic Stamps) وتخليص الفواتير الضريبية لحظياً وفق كود INV-26XXXXXXXXXX.</p>
                      </div>
                    </div>
                    
                    {/* Independent Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        sovereignConfig.zatcaEnabled 
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200' 
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}>
                        {sovereignConfig.zatcaEnabled ? 'مفعلة ومتصلة ⚡' : 'معطلة مؤقتاً ⚪'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!sovereignConfig.zatcaEnabled}
                          onChange={(e) => setSovereignConfig({ ...sovereignConfig, zatcaEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                      </label>
                    </div>
                  </div>

                  {sovereignConfig.zatcaEnabled ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">بيئة الربط المعتمدة (ZATCA Environment):</label>
                          <select
                            value={sovereignConfig.zatcaEnvironment}
                            onChange={e => setSovereignConfig({ ...sovereignConfig, zatcaEnvironment: e.target.value })}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                          >
                            <option value="production">🚀 الإنتاج الحي (Live Production Core)</option>
                            <option value="simulation">⚙️ محاكاة الهيئة (Simulation Pre-prod)</option>
                            <option value="sandbox">🧪 بيئة المطورين والتجربة (Developer Sandbox)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">الرقم الضريبي للمنشأة (Tax Identification Number - 15 رقم):</label>
                          <input 
                            type="text" 
                            value={sovereignConfig.taxRegistrationNumber} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, taxRegistrationNumber: e.target.value })} 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">معرف وحدة الحل البرمجي (EGS Solution Unit UUID):</label>
                          <input 
                            type="text" 
                            value={sovereignConfig.egsUuid} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, egsUuid: e.target.value })} 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left text-[11px]"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">رمز CSID السري وشهادة الاعتماد الرقمي:</label>
                          <input 
                            type="password" 
                            value={sovereignConfig.csidSecret} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, csidSecret: e.target.value })} 
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <input 
                            type="checkbox" 
                            checked={!!sovereignConfig.autoClearanceB2B} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, autoClearanceB2B: e.target.checked })} 
                            className="rounded text-emerald-600"
                          />
                          <span>تخليص فواتير B2B لحظياً مع الهيئة (Clearance API)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <input 
                            type="checkbox" 
                            checked={!!sovereignConfig.autoReportingB2C} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, autoReportingB2C: e.target.checked })} 
                            className="rounded text-emerald-600"
                          />
                          <span>إشعار فواتير B2C المبسطة (Reporting API)</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <input 
                            type="checkbox" 
                            checked={!!sovereignConfig.enableCryptoStamp} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, enableCryptoStamp: e.target.checked })} 
                            className="rounded text-emerald-600"
                          />
                          <span>توليد الأختام الرقمية المشفرة (ECDSA Stamp)</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span>تم تعطيل الربط مع ZATCA مؤقتاً. لن يتم إرسال طلبات التخليص أو التقرير اللحظي حتى إعادة التفعيل.</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => handleTestGovService('zatca')}
                      disabled={isTestingGovService === 'zatca'}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                    >
                      {isTestingGovService === 'zatca' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري اختبار شهادة المطابقة ZATCA...</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          <span>فحص وتخليص فاتورة تجريبية مع ZATCA 🏛️</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">شهادة CSID صالحة حتى: {sovereignConfig.csidExpiryDate}</span>
                  </div>
                </div>
              )}

              {/* 2. Nafath IAM SSO Section */}
              {shouldShowCard(!!sovereignConfig.nafathEnabled, ['nafath', 'نفاذ', 'هوية', 'iam', 'sso', 'تحقق']) && (
                <div className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm p-6 space-y-6 ${
                  sovereignConfig.nafathEnabled ? 'border-indigo-200/80 ring-1 ring-indigo-500/10' : 'border-slate-200 bg-slate-50/60 opacity-80'
                }`}>
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center font-bold ${
                        sovereignConfig.nafathEnabled ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-200 text-slate-500'
                      }`}>
                        <BadgeCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-slate-800 text-base">النفاذ الوطني الموحد (Nafath IAM SSO)</h3>
                          <span className="text-[11px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">بوابة الهوية الوطنية</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">التحقق الرقمي اللحظي من هويات مزودي القاعات والعملاء عبر تطبيق نفاذ لضمان الهوية الرسمية وتوثيق العقود.</p>
                      </div>
                    </div>
                    
                    {/* Independent Toggle Switch */}
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
                        sovereignConfig.nafathEnabled 
                          ? 'bg-indigo-100 text-indigo-800 border-indigo-200' 
                          : 'bg-slate-200 text-slate-600 border-slate-300'
                      }`}>
                        {sovereignConfig.nafathEnabled ? 'مفعلة ومتصلة ⚡' : 'معطلة مؤقتاً ⚪'}
                      </span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!sovereignConfig.nafathEnabled}
                          onChange={(e) => setSovereignConfig({ ...sovereignConfig, nafathEnabled: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                      </label>
                    </div>
                  </div>

                  {sovereignConfig.nafathEnabled ? (
                    <div className="space-y-4 animate-in fade-in">
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-sans">
                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">بيئة الاتصال (Mode):</label>
                          <select
                            value={sovereignConfig.nafathMode || 'sandbox'}
                            onChange={e => setSovereignConfig({ ...sovereignConfig, nafathMode: e.target.value })}
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800"
                          >
                            <option value="sandbox">🧪 بيئة الاختبار (Nafath Sandbox)</option>
                            <option value="live">🚀 بيئة الإنتاج الحية (Nafath Live)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">معرف التطبيق / العميل (App Client ID):</label>
                          <input 
                            type="text" 
                            value={sovereignConfig.nafathClientId || sovereignConfig.nafathAppId || ''} 
                            onChange={e => setSovereignConfig({ 
                              ...sovereignConfig, 
                              nafathClientId: e.target.value,
                              nafathAppId: e.target.value 
                            })} 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">مفتاح الربط المشفر (API Secret / Key):</label>
                          <input 
                            type="password" 
                            value={sovereignConfig.nafathSecretKey || sovereignConfig.nafathApiKey || ''} 
                            onChange={e => setSovereignConfig({ 
                              ...sovereignConfig, 
                              nafathSecretKey: e.target.value,
                              nafathApiKey: e.target.value 
                            })} 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left"
                            dir="ltr"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="block font-bold text-slate-700">نطاق البوابة المعتمد (Nafath Domain):</label>
                          <input 
                            type="text" 
                            value={sovereignConfig.nafathServiceDomain || 'iam.gov.sa'} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, nafathServiceDomain: e.target.value })} 
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold"
                            dir="ltr"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-xs">
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <input 
                            type="checkbox" 
                            checked={!!sovereignConfig.requireNafathForProviders} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, requireNafathForProviders: e.target.checked })} 
                            className="rounded text-indigo-600"
                          />
                          <span>إلزام مزودي القاعات والخدمات بتوثيق نفاذ قبل النشر والاعتماد</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                          <input 
                            type="checkbox" 
                            checked={!!sovereignConfig.requireNafathForHighValueBookings} 
                            onChange={e => setSovereignConfig({ ...sovereignConfig, requireNafathForHighValueBookings: e.target.checked })} 
                            className="rounded text-indigo-600"
                          />
                          <span>طلب مصادقة نفاذ اللحظية 2FA للحجوزات والعقود المليونية</span>
                        </label>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-100 rounded-2xl text-xs text-slate-500 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-slate-400" />
                      <span>تم تعطيل المصادقة عبر نفاذ مؤقتاً. يمكن للمستخدمين التسجيل بالطرق الاعتيادية.</span>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={() => handleTestGovService('nafath')}
                      disabled={isTestingGovService === 'nafath'}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-600/20"
                    >
                      {isTestingGovService === 'nafath' ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>جاري اختبار بوابات نفاذ...</span>
                        </>
                      ) : (
                        <>
                          <BadgeCheck className="w-4 h-4" />
                          <span>اختبار الاستجابة اللحظية لبوابة نفاذ 🛡️</span>
                        </>
                      )}
                    </button>
                    <span className="text-[11px] text-slate-400">بروتوكول OIDC / OAuth2.0 المعتمد</span>
                  </div>
                </div>
              )}

              {/* Grid for Wathq, Shamous & SPL */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* 3. Wathq CR & Balady API */}
                {shouldShowCard(!!sovereignConfig.wathqEnabled, ['wathq', 'واثق', 'سجل', 'تجاري', 'بلدي', 'دفاع مدني']) && (
                  <div className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm p-6 space-y-4 flex flex-col justify-between ${
                    sovereignConfig.wathqEnabled ? 'border-purple-200/80 ring-1 ring-purple-500/10' : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            sovereignConfig.wathqEnabled ? 'bg-purple-50 text-purple-600' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">منصة واثق (Wathq CR API)</h4>
                            <p className="text-[11px] text-slate-400">التحقق الفوري من السجلات ورخص بلدي.</p>
                          </div>
                        </div>
                        
                        {/* Independent Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!sovereignConfig.wathqEnabled}
                            onChange={(e) => setSovereignConfig({ ...sovereignConfig, wathqEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                        </label>
                      </div>

                      {sovereignConfig.wathqEnabled ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="block font-bold text-slate-700 text-[11px]">البيئة:</label>
                              <select
                                value={sovereignConfig.wathqMode || 'sandbox'}
                                onChange={e => setSovereignConfig({ ...sovereignConfig, wathqMode: e.target.value })}
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-800 text-xs"
                              >
                                <option value="sandbox">Sandbox 🧪</option>
                                <option value="live">Live 🚀</option>
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="block font-bold text-slate-700 text-[11px]">مفتاح الربط API Key:</label>
                              <input 
                                type="password" 
                                value={sovereignConfig.wathqApiKey || ''} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, wathqApiKey: e.target.value })} 
                                placeholder="wathq_key_xxx"
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left text-xs"
                                dir="ltr"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                              <input 
                                type="checkbox" 
                                checked={!!sovereignConfig.autoVerifyCommercialRegister} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, autoVerifyCommercialRegister: e.target.checked })} 
                                className="rounded text-purple-600"
                              />
                              <span>تدقيق السجل التجاري مع وزارة التجارة</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                              <input 
                                type="checkbox" 
                                checked={!!sovereignConfig.autoVerifyBaladyLicense} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, autoVerifyBaladyLicense: e.target.checked })} 
                                className="rounded text-purple-600"
                              />
                              <span>مطابقة رخص بلدي وقدرات الاستيعاب</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                              <input 
                                type="checkbox" 
                                checked={!!sovereignConfig.autoVerifyCivilDefense} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, autoVerifyCivilDefense: e.target.checked })} 
                                className="rounded text-purple-600"
                              />
                              <span>فحص سلامة الدفاع المدني للمنشآت</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                          <span>الخدمة معطلة مؤقتاً.</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleTestGovService('wathq')}
                      disabled={isTestingGovService === 'wathq'}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm mt-2"
                    >
                      {isTestingGovService === 'wathq' ? 'جاري فحص واثق...' : 'اختبار الاتصال بمنصة واثق 📜'}
                    </button>
                  </div>
                )}

                {/* 4. Shamous Security System */}
                {shouldShowCard(!!sovereignConfig.shamousEnabled, ['shamous', 'شموس', 'أمني', 'داخلية', 'أمن', 'نزلاء']) && (
                  <div className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm p-6 space-y-4 flex flex-col justify-between ${
                    sovereignConfig.shamousEnabled ? 'border-amber-200/80 ring-1 ring-amber-500/10' : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            sovereignConfig.shamousEnabled ? 'bg-amber-50 text-amber-600' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">نظام شموس الأمني (Shamous API)</h4>
                            <p className="text-[11px] text-slate-400">الرفع التلقائي لبيانات الحجوزات والمناسبات.</p>
                          </div>
                        </div>
                        
                        {/* Independent Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!sovereignConfig.shamousEnabled}
                            onChange={(e) => setSovereignConfig({ ...sovereignConfig, shamousEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-600"></div>
                        </label>
                      </div>

                      {sovereignConfig.shamousEnabled ? (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="space-y-1">
                              <label className="block font-bold text-slate-700 text-[11px]">رمز المنشأة بنظام شموس:</label>
                              <input 
                                type="text" 
                                value={sovereignConfig.shamousEstablishmentCode || ''} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, shamousEstablishmentCode: e.target.value })} 
                                placeholder="SHM-SA-90112"
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left text-xs font-bold"
                                dir="ltr"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="block font-bold text-slate-700 text-[11px]">رمز التوثيق Token:</label>
                              <input 
                                type="password" 
                                value={sovereignConfig.shamousToken || ''} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, shamousToken: e.target.value })} 
                                placeholder="shm_tok_xxx"
                                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left text-xs"
                                dir="ltr"
                              />
                            </div>
                          </div>

                          <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                            <div className="space-y-1">
                              <label className="block font-bold text-slate-700 text-[11px]">سياسة المزامنة والإرسال الأمني:</label>
                              <select
                                value={sovereignConfig.shamousAutoSync ? 'true' : 'false'}
                                onChange={e => setSovereignConfig({ ...sovereignConfig, shamousAutoSync: e.target.value === 'true' })}
                                className="w-full p-2 bg-white border border-slate-200 rounded-lg outline-none font-bold text-slate-800 text-xs"
                              >
                                <option value="true">⚡ إرسال تلقائي فوري لحظة تأكيد الحجز</option>
                                <option value="false">📝 مراجعة يدوية قبل الرفع لشموس</option>
                              </select>
                            </div>
                            <div className="text-[11px] text-amber-800 font-bold bg-amber-50 p-2 rounded-lg border border-amber-200/60">
                              قطاع: {sovereignConfig.shamousSecuritySector || 'قاعات الأفراح والاحتفالات والمرافق'}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                          <span>الخدمة معطلة مؤقتاً.</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleTestGovService('shamous')}
                      disabled={isTestingGovService === 'shamous'}
                      className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm mt-2"
                    >
                      {isTestingGovService === 'shamous' ? 'جاري فحص الاتصال بشموس...' : 'اختبار التكامل مع نظام شموس 🏢'}
                    </button>
                  </div>
                )}

                {/* 5. SPL National Address */}
                {shouldShowCard(!!sovereignConfig.splEnabled, ['spl', 'عنوان', 'وطني', 'بريد', 'سعودي', 'post', 'address']) && (
                  <div className={`bg-white rounded-3xl border transition-all duration-200 shadow-sm p-6 space-y-4 flex flex-col justify-between ${
                    sovereignConfig.splEnabled ? 'border-blue-200/80 ring-1 ring-blue-500/10' : 'border-slate-200 bg-slate-50/60 opacity-80'
                  }`}>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                            sovereignConfig.splEnabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <MapPin className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-800 text-sm">العنوان الوطني سبل (Saudi Post)</h4>
                            <p className="text-[11px] text-slate-400">مطابقة الرموز البريدية وتدقيق العناوين.</p>
                          </div>
                        </div>
                        
                        {/* Independent Toggle Switch */}
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            checked={!!sovereignConfig.splEnabled}
                            onChange={(e) => setSovereignConfig({ ...sovereignConfig, splEnabled: e.target.checked })}
                            className="sr-only peer"
                          />
                          <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                      </div>

                      {sovereignConfig.splEnabled ? (
                        <div className="space-y-3">
                          <div className="space-y-1 text-xs">
                            <label className="block font-bold text-slate-700 text-[11px]">مفتاح الربط (SPL API Key):</label>
                            <input 
                              type="password" 
                              value={sovereignConfig.splApiKey || ''} 
                              onChange={e => setSovereignConfig({ ...sovereignConfig, splApiKey: e.target.value })} 
                              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left text-xs"
                              dir="ltr"
                            />
                          </div>

                          <div className="space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200/70">
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                              <input 
                                type="checkbox" 
                                checked={!!sovereignConfig.autoValidatePostalCode} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, autoValidatePostalCode: e.target.checked })} 
                                className="rounded text-blue-600"
                              />
                              <span>التحقق من صحة العنوان الوطني المختصر (Short Address)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-700">
                              <input 
                                type="checkbox" 
                                checked={!!sovereignConfig.autoFormatShortAddress} 
                                onChange={e => setSovereignConfig({ ...sovereignConfig, autoFormatShortAddress: e.target.checked })} 
                                className="rounded text-blue-600"
                              />
                              <span>توليد إحداثيات GPS تلقائياً بناءً على الرمز</span>
                            </label>
                          </div>
                        </div>
                      ) : (
                        <div className="p-3 bg-slate-100 rounded-xl text-xs text-slate-500 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-400" />
                          <span>الخدمة معطلة مؤقتاً.</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleTestGovService('spl')}
                      disabled={isTestingGovService === 'spl'}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs transition-all cursor-pointer shadow-sm mt-2"
                    >
                      {isTestingGovService === 'spl' ? 'جاري فحص العنوان الوطني...' : 'اختبار الربط مع العنوان الوطني 🗺️'}
                    </button>
                  </div>
                )}

              </div>

            </div>

            {/* Gov Test Result Display Console */}
            {govTestResult && (
              <div className="p-6 bg-slate-900 text-slate-100 rounded-3xl border border-slate-800 space-y-3 animate-in fade-in font-mono text-xs shadow-xl" dir="ltr">
                <div className="flex items-center justify-between text-emerald-400 font-bold border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>[GOVERNMENT INTEGRATION RESPONSE: 200 OK] {govTestResult.service}</span>
                  </div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-500/30">
                    STATUS: VERIFIED & COMPLIANT
                  </span>
                </div>
                <pre className="text-amber-300 overflow-x-auto text-[11px] bg-slate-950 p-4 rounded-2xl border border-slate-800/80 leading-relaxed">
                  {JSON.stringify(govTestResult.details, null, 2)}
                </pre>
              </div>
            )}

            {/* Bottom Unified Save & Sync Bar */}
            <div className="sticky bottom-4 z-20 bg-white/90 backdrop-blur-md border border-slate-200 shadow-xl p-4 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>يتم حفظ ومزامنة حالة كل منظومة سيادية وحكومية بشكل مستقل وفوري.</span>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('PLATFORM_SOVEREIGN_CONFIG', JSON.stringify(sovereignConfig));
                  
                  // Sync sovereign settings into platform data for unified architecture
                  try {
                    const currentPlatformData = JSON.parse(localStorage.getItem('PLATFORM_DATA') || '{}');
                    const updatedPlatformData = {
                      ...currentPlatformData,
                      zatcaEnabled: sovereignConfig.zatcaEnabled,
                      nafathEnabled: sovereignConfig.nafathEnabled,
                      nafathMode: sovereignConfig.nafathMode,
                      nafathClientId: sovereignConfig.nafathClientId || sovereignConfig.nafathAppId,
                      nafathSecretKey: sovereignConfig.nafathSecretKey || sovereignConfig.nafathApiKey,
                      wathqEnabled: sovereignConfig.wathqEnabled,
                      wathqMode: sovereignConfig.wathqMode,
                      wathqApiKey: sovereignConfig.wathqApiKey,
                      shamousEnabled: sovereignConfig.shamousEnabled,
                      shamousEstablishmentCode: sovereignConfig.shamousEstablishmentCode,
                      shamousToken: sovereignConfig.shamousToken,
                      shamousAutoSync: sovereignConfig.shamousAutoSync,
                      splEnabled: sovereignConfig.splEnabled
                    };
                    localStorage.setItem('PLATFORM_DATA', JSON.stringify(updatedPlatformData));
                    window.dispatchEvent(new Event('settingsUpdated'));
                  } catch (e) {}

                  notify('success', 'تم حفظ وتوحيد جميع إعدادات المنظومات والخدمات السيادية والحكومية (ZATCA / Nafath / Wathq / Shamous / SPL) 💾');
                }}
                className="w-full sm:w-auto bg-slate-900 hover:bg-slate-800 text-white font-bold px-7 py-3 rounded-2xl text-xs cursor-pointer transition-all shadow-md flex items-center justify-center gap-2"
              >
                <span>حفظ ومزامنة إعدادات المنظومات السيادية والحكومية الموحدة 💾</span>
              </button>
            </div>

          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 4. SMS & WHATSAPP GATEWAYS TAB */}
      {/* ========================================================================= */}
      {subTab === 'sms_whatsapp' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          {/* SMS Gateways */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Smartphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">بوابات الرسائل النصية القصيرة (SMS Gateways Provider)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">ربط مزودي الرسائل المعتمدين محلياً مع اسم المرسل المرخص من هيئة الاتصالات والفضاء والتقنية (CST).</p>
                </div>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-800 font-bold px-3 py-1 rounded-full border border-indigo-200">
                مرخص CST: {messagingConfig.cstLicenseNumber} 📡
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">مزود خدمة الرسائل المعتمد:</label>
                <select
                  value={messagingConfig.smsProvider}
                  onChange={e => setMessagingConfig({ ...messagingConfig, smsProvider: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold"
                >
                  <option value="unifonic">Unifonic (يونيفونيك المعتمد)</option>
                  <option value="taqnyat">Taqnyat (تقنيات السعودية)</option>
                  <option value="mobily_ws">Mobily WS (موبايلي للأعمال)</option>
                  <option value="twilio">Twilio SMS Global</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">اسم المرسل المعتمد من هيئة الاتصالات (Sender ID):</label>
                <input 
                  type="text" 
                  value={messagingConfig.smsSenderName} 
                  onChange={e => setMessagingConfig({ ...messagingConfig, smsSenderName: e.target.value })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-center"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">مفتاح الـ API للرسائل (SMS App Key):</label>
                <input 
                  type="password" 
                  value={messagingConfig.smsApiKey} 
                  onChange={e => setMessagingConfig({ ...messagingConfig, smsApiKey: e.target.value })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Cloud API */}
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">واتساب للأعمال (WhatsApp Cloud API - Meta Verified)</h3>
                  <p className="text-xs text-slate-400 mt-0.5">إرسال ملفات الفواتير الضريبية ZATCA، تذاكر الحجز، وروابط المواقع للعملاء فورياً عبر قوالب معتمدة.</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full border border-emerald-200">
                Green Badge Verified 🟢
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
              <div className="space-y-2">
                <label className="block font-bold text-slate-700">معرف رقم الهاتف (Phone Number ID):</label>
                <input 
                  type="text" 
                  value={messagingConfig.whatsAppPhoneId} 
                  onChange={e => setMessagingConfig({ ...messagingConfig, whatsAppPhoneId: e.target.value })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">معرف حساب الأعمال (WABA Business ID):</label>
                <input 
                  type="text" 
                  value={messagingConfig.whatsAppBusinessId} 
                  onChange={e => setMessagingConfig({ ...messagingConfig, whatsAppBusinessId: e.target.value })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">رمز الوصول الدائم (System User Token):</label>
                <input 
                  type="password" 
                  value={messagingConfig.whatsAppAccessToken} 
                  onChange={e => setMessagingConfig({ ...messagingConfig, whatsAppAccessToken: e.target.value })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left"
                  dir="ltr"
                />
              </div>
            </div>

            {/* Test Message Box */}
            <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">إرسال رسالة تجريبية وفحص البوابة المباشرة:</h4>
              <div className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="tel" 
                  value={testPhoneNumber} 
                  onChange={e => setTestPhoneNumber(e.target.value)} 
                  placeholder="0501234567"
                  className="p-2.5 bg-white border border-slate-200 rounded-xl outline-none font-mono text-center text-xs font-bold w-full sm:w-60"
                  dir="ltr"
                />
                <button
                  onClick={handleTestMessageGateway}
                  disabled={isTestingMessageGateway}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-emerald-600/20"
                >
                  {isTestingMessageGateway ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>جاري إرسال الرسائل...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>إرسال تجريبي عبر SMS & WhatsApp 📱</span>
                    </>
                  )}
                </button>
              </div>

              {messageTestResult && (
                <div className="p-3 bg-white rounded-xl border border-emerald-200 text-emerald-800 text-xs font-mono" dir="ltr">
                  <strong>[SUCCESS] Message Sent:</strong> {JSON.stringify(messageTestResult)}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('PLATFORM_TECH_MESSAGING', JSON.stringify(messagingConfig));
                  notify('success', 'تم حفظ إعدادات الرسائل النصية و WhatsApp Cloud API 💾');
                }}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-2xl text-xs cursor-pointer transition-all shadow-md"
              >
                حفظ إعدادات بوابات الرسائل وواتساب 💾
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. GOOGLE MAPS PLATFORM TAB */}
      {/* ========================================================================= */}
      {subTab === 'google_maps' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-base">خرائط Google Maps Platform & Places API</h3>
                  <p className="text-xs text-slate-400 mt-0.5">تكوين واجهات الخرائط للإكمال التلقائي لعناوين القاعات، وحساب المسارات وأوقات وصول الضيوف التقديرية.</p>
                </div>
              </div>
              <span className="text-xs bg-blue-100 text-blue-800 font-bold px-3 py-1 rounded-full border border-blue-200">
                استهلاك الحصة: {googleMapsConfig.monthlyQuotaUsed} 🗺️
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-sans">
              <div className="space-y-2 md:col-span-2">
                <label className="block font-bold text-slate-700">مفتاح واجهات برمجة خرائط جوجل (Google Maps API Key):</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={googleMapsConfig.apiKey} 
                    onChange={e => setGoogleMapsConfig({ ...googleMapsConfig, apiKey: e.target.value })} 
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold text-slate-800"
                    dir="ltr"
                  />
                  <button
                    onClick={() => copyToClipboard(googleMapsConfig.apiKey, 'gmaps_key')}
                    className="p-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all cursor-pointer shrink-0 flex items-center gap-1 font-sans font-bold"
                  >
                    {copiedKey === 'gmaps_key' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                    <span>نسخ</span>
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">معرف تنسيق الخريطة (Map Styling ID):</label>
                <input 
                  type="text" 
                  value={googleMapsConfig.mapId} 
                  onChange={e => setGoogleMapsConfig({ ...googleMapsConfig, mapId: e.target.value })} 
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-mono text-left font-bold"
                  dir="ltr"
                />
              </div>

              <div className="space-y-2">
                <label className="block font-bold text-slate-700">مركز الخريطة الافتراضي:</label>
                <input 
                  type="text" 
                  value="الرياض (Lat: 24.7136, Lng: 46.6753)" 
                  readOnly
                  className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none font-bold text-slate-700"
                />
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
              <h4 className="font-bold text-slate-800 text-xs">الخدمات المفعلة على خرائط المنصة:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <label className="flex items-center gap-2.5 font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={googleMapsConfig.enablePlacesAutocomplete} 
                    onChange={e => setGoogleMapsConfig({ ...googleMapsConfig, enablePlacesAutocomplete: e.target.checked })} 
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>الإكمال التلقائي لأسماء الأحياء والمعالم (Places Autocomplete)</span>
                </label>
                <label className="flex items-center gap-2.5 font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={googleMapsConfig.enableDirectionsAndRouting} 
                    onChange={e => setGoogleMapsConfig({ ...googleMapsConfig, enableDirectionsAndRouting: e.target.checked })} 
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>حساب مسارات وتوجيه الضيوف والمدعوين (Directions & Routing)</span>
                </label>
                <label className="flex items-center gap-2.5 font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={googleMapsConfig.enableGeocoding} 
                    onChange={e => setGoogleMapsConfig({ ...googleMapsConfig, enableGeocoding: e.target.checked })} 
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>تحويل الإحداثيات الجغرافية إلى عناوين نصية (Reverse Geocoding)</span>
                </label>
                <label className="flex items-center gap-2.5 font-bold text-slate-700 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={googleMapsConfig.enableDistanceMatrix} 
                    onChange={e => setGoogleMapsConfig({ ...googleMapsConfig, enableDistanceMatrix: e.target.checked })} 
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>مصفوفة المسافات وتقدير زمن الوصول (Distance Matrix ETA)</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => {
                  localStorage.setItem('PLATFORM_GOOGLE_MAPS_CONFIG', JSON.stringify(googleMapsConfig));
                  notify('success', 'تم حفظ إعدادات خرائط Google Maps Platform 🗺️');
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-2xl text-xs cursor-pointer transition-all shadow-md shadow-blue-600/20"
              >
                حفظ إعدادات خرائط جوجل 💾
              </button>
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LIVE API LOGS & DIAGNOSTICS TAB */}
      {/* ========================================================================= */}
      {subTab === 'live_logs' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                  <Terminal className="w-5 h-5 text-indigo-600" />
                  <span>سجلات الاستدعاءات والتشخيص الحي (Live API Logs & Traffic)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">مراقبة حية لكافة الطلبات الواردة والصادرة عبر الـ REST API وسرعة المعالجة وأكواد الاستجابة.</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRefreshLogs}
                  disabled={isRefreshingLogs}
                  className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer border border-indigo-200"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingLogs ? 'animate-spin' : ''}`} />
                  <span>تحديث لحظي للسجلات ⚡</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute right-3 top-3 text-slate-400" />
                <input 
                  type="text" 
                  value={logSearchQuery} 
                  onChange={e => setLogSearchQuery(e.target.value)} 
                  placeholder="ابحث بالمسار (Endpoint) أو عنوان الـ IP أو الطريقة..."
                  className="w-full pr-9 pl-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {[
                  { id: 'all', label: 'الكل (All)' },
                  { id: '2xx', label: '2xx (نجاح)' },
                  { id: '4xx', label: '4xx (أخطاء عميل)' },
                  { id: '5xx', label: '5xx (أخطاء خادم)' },
                ].map(flt => (
                  <button
                    key={flt.id}
                    onClick={() => setLogStatusFilter(flt.id as any)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      logStatusFilter === flt.id 
                        ? 'bg-white text-slate-800 shadow-sm font-black' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {flt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Logs Table */}
            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-right text-xs font-mono">
                <thead>
                  <tr className="bg-slate-900 text-slate-300 font-bold border-b border-slate-800">
                    <th className="p-3 text-center">Method</th>
                    <th className="p-3">Endpoint</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Latency</th>
                    <th className="p-3 text-center">Client IP</th>
                    <th className="p-3 text-center font-sans">الوقت والختم الزمني</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                          log.method === 'GET' ? 'bg-blue-100 text-blue-800' :
                          log.method === 'POST' ? 'bg-emerald-100 text-emerald-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800" dir="ltr">
                        {log.endpoint}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full font-bold text-[11px] ${
                          log.statusCode >= 200 && log.statusCode < 300 ? 'bg-emerald-100 text-emerald-800' :
                          log.statusCode >= 400 && log.statusCode < 500 ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {log.statusCode} OK
                        </span>
                      </td>
                      <td className="p-3 text-center font-bold text-slate-600">
                        {log.latencyMs}ms
                      </td>
                      <td className="p-3 text-center text-slate-500 font-mono text-[11px]" dir="ltr">
                        {log.ip}
                      </td>
                      <td className="p-3 text-center font-sans text-slate-500 text-[11px]">
                        {new Date(log.timestamp).toLocaleTimeString('ar-SA')}
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
  );
};

export default TechnicalIntegrationTab;
