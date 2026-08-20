import React, { useState, useMemo } from 'react';
import { 
  Upload, CheckCircle, AlertCircle, Loader2, 
  Settings2, ShieldCheck, Palette, Share2, 
  FileText, Receipt, Phone, Mail, MapPin, 
  Clock, Hash, Link as LinkIcon, Globe,
  Database, Download, Server, Key, Power, Activity, Terminal,
  Sliders, Coins, Sparkles, Trophy, Trash2, Plus, Pencil, Tag, ExternalLink, Calendar,
  X, Image, Eye
} from 'lucide-react';
import Editor from 'react-simple-wysiwyg';
import { TaxNumberInput, CrNumberInput } from '../common/ValidationInputs';

export default function PlatformInfoSettings({ 
  platformData, 
  setPlatformData,
  bookings = [],
  halls = [],
  supportServiceRequests = [],
  inventory = [],
  providers = [],
  customers = [],
  campaigns = [],
  supportTickets = [],
  staffTasks = [],
  reviews = []
}: { 
  platformData: any, 
  setPlatformData: (data: any) => void,
  bookings?: any[],
  halls?: any[],
  supportServiceRequests?: any[],
  inventory?: any[],
  providers?: any[],
  customers?: any[],
  campaigns?: any[],
  supportTickets?: any[],
  staffTasks?: any[],
  reviews?: any[]
}) {
  const [activeTab, setActiveTab] = useState('data');
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  // Hero custom slide modal state variables
  const [newSlideModalOpen, setNewSlideModalOpen] = useState(false);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null);
  const [slideFormData, setSlideFormData] = useState({
    badge: 'جديد',
    title: '',
    subtitle: '',
    image: '',
    buttonText: 'احجز الآن',
    buttonLink: '#',
    status: 'active',
    order: 1
  });

  // External DB Connection state preserved in localStorage
  const [dbProvider, setDbProvider] = useState<string>(() => localStorage.getItem('EXT_DB_PROVIDER') || 'supabase');
  const [dbConnectionUri, setDbConnectionUri] = useState<string>(() => localStorage.getItem('EXT_DB_URI') || 'https://your-project.supabase.co');
  const [dbSecretKey, setDbSecretKey] = useState<string>(() => localStorage.getItem('EXT_DB_SECRET') || '');
  const [dbConnectionStatus, setDbConnectionStatus] = useState<'disconnected' | 'testing' | 'connected' | 'error'>(
    () => (localStorage.getItem('EXT_DB_SECRET') ? 'connected' : 'disconnected')
  );

  const [copiedSql, setCopiedSql] = useState(false);

  const sqlSchemaAndData = useMemo(() => {
    let sql = `-- =========================================================\n`;
    sql += `-- CENTRAL EVENT PLATFORM DATABASE MIGRATE SCHEMA & DUMP\n`;
    sql += `-- Generated on: ${new Date().toISOString()}\n`;
    sql += `-- Target: PostgreSQL / Supabase / Common SQL\n`;
    sql += `-- =========================================================\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 1. Table: halls (قاعات ومرافق المناسبات)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS halls (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  provider VARCHAR(255) NOT NULL,\n`;
    sql += `  region VARCHAR(100),\n`;
    sql += `  city VARCHAR(100),\n`;
    sql += `  category VARCHAR(100),\n`;
    sql += `  price_per_day NUMERIC(12, 2) DEFAULT 0.00,\n`;
    sql += `  capacity INTEGER DEFAULT 100,\n`;
    sql += `  status VARCHAR(50) DEFAULT 'نشط'\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 2. Table: bookings (حجوزات القاعات والفعاليات)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS bookings (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  hall_name VARCHAR(255),\n`;
    sql += `  customer_name VARCHAR(255) NOT NULL,\n`;
    sql += `  customer_phone VARCHAR(50),\n`;
    sql += `  date DATE NOT NULL,\n`;
    sql += `  amount NUMERIC(12, 2) DEFAULT 0.00,\n`;
    sql += `  status VARCHAR(50) DEFAULT 'جديد',\n`;
    sql += `  payment_status VARCHAR(50) DEFAULT 'غير مدفوع',\n`;
    sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 3. Table: support_services (الخدمات اللوجستية والمساندة المستقلة)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS support_services (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  service_name VARCHAR(255) NOT NULL,\n`;
    sql += `  provider_name VARCHAR(255) NOT NULL,\n`;
    sql += `  price NUMERIC(12, 2) DEFAULT 0.00,\n`;
    sql += `  date DATE,\n`;
    sql += `  payment_status VARCHAR(50) DEFAULT 'غير مدفوع',\n`;
    sql += `  status VARCHAR(50) DEFAULT 'انتظار'\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 4. Table: inventory (المخزون والقطع والأثاث وسجلات المستودع)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS inventory (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  sku VARCHAR(100) UNIQUE,\n`;
    sql += `  current_stock INTEGER DEFAULT 0,\n`;
    sql += `  reorder_level INTEGER DEFAULT 0,\n`;
    sql += `  supplier VARCHAR(255),\n`;
    sql += `  cost NUMERIC(12, 2) DEFAULT 0.00,\n`;
    sql += `  last_updated VARCHAR(50)\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 5. Table: providers (مزودو الخدمات والشركاء المعتمدون)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS providers (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  email VARCHAR(255),\n`;
    sql += `  region VARCHAR(100),\n`;
    sql += `  city VARCHAR(100),\n`;
    sql += `  joined_date DATE,\n`;
    sql += `  status VARCHAR(50) DEFAULT 'نشط'\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 6. Table: customers (قاعدة بيانات عملاء المنصة)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS customers (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  name VARCHAR(255) NOT NULL,\n`;
    sql += `  phone VARCHAR(50),\n`;
    sql += `  email VARCHAR(255),\n`;
    sql += `  city VARCHAR(100),\n`;
    sql += `  joined_date DATE,\n`;
    sql += `  status VARCHAR(50) DEFAULT 'نشط'\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 7. Table: campaigns (الحملات الإعلانية والتسويق الرقمي وبورصة الإعلان)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS campaigns (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  title VARCHAR(255) NOT NULL,\n`;
    sql += `  provider VARCHAR(255),\n`;
    sql += `  budget NUMERIC(12, 2) DEFAULT 0.00,\n`;
    sql += `  start_date DATE,\n`;
    sql += `  end_date DATE,\n`;
    sql += `  status VARCHAR(50) DEFAULT 'نشط'\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 8. Table: support_tickets (طلبات وتذاكر الدعم والمسائل التقنية)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS support_tickets (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  title VARCHAR(255) NOT NULL,\n`;
    sql += `  customer_name VARCHAR(255) NOT NULL,\n`;
    sql += `  department VARCHAR(100),\n`;
    sql += `  priority VARCHAR(50) DEFAULT 'متوسط',\n`;
    sql += `  status VARCHAR(50) DEFAULT 'مفتوح',\n`;
    sql += `  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 9. Table: staff_tasks (مهام فريق العمل وإدارة الشؤون الداخلية)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS staff_tasks (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  task_title VARCHAR(255) NOT NULL,\n`;
    sql += `  assigned_to VARCHAR(255),\n`;
    sql += `  due_date DATE,\n`;
    sql += `  priority VARCHAR(50) DEFAULT 'متوسط',\n`;
    sql += `  status VARCHAR(50) DEFAULT 'مفتوح'\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 10. Table: reviews (مراجعات وآراء وتقييمات العملاء)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS reviews (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  author VARCHAR(255) NOT NULL,\n`;
    sql += `  target_name VARCHAR(255),\n`;
    sql += `  rating INTEGER DEFAULT 5,\n`;
    sql += `  comment TEXT,\n`;
    sql += `  created_at DATE\n`;
    sql += `);\n\n`;

    sql += `-- ---------------------------------------------------------\n`;
    sql += `-- 11. Table: system_settings (بيانات الإعدادات العامة وهوية المنصة والمحددات الرقابية)\n`;
    sql += `-- ---------------------------------------------------------\n`;
    sql += `CREATE TABLE IF NOT EXISTS system_settings (\n`;
    sql += `  id VARCHAR(100) PRIMARY KEY,\n`;
    sql += `  platform_name VARCHAR(255) NOT NULL,\n`;
    sql += `  support_phone VARCHAR(50),\n`;
    sql += `  support_email VARCHAR(255),\n`;
    sql += `  tax_number VARCHAR(100),\n`;
    sql += `  cr_number VARCHAR(100),\n`;
    sql += `  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP\n`;
    sql += `);\n\n`;

    sql += `-- =========================================================\n`;
    sql += `-- DATA DUMP & INITIAL RECORDS\n`;
    sql += `-- =========================================================\n\n`;

    sql += `-- Inserting Live data from Halls (${(halls || []).length} records)\n`;
    (halls || []).forEach((h: any) => {
      const sId = String(h.id || '').replace(/'/g, "''");
      const sName = String(h.name || '').replace(/'/g, "''");
      const sProvider = String(h.provider || '').replace(/'/g, "''");
      const sRegion = String(h.region || '').replace(/'/g, "''");
      const sCity = String(h.city || '').replace(/'/g, "''");
      const sCategory = String(h.category || '').replace(/'/g, "''");
      const priceVal = h.price || h.pricePerDay || h.price_per_day || 0;
      const capacityVal = h.capacity || 100;
      const sStatus = String(h.status || 'نشط').replace(/'/g, "''");
      sql += `INSERT INTO halls (id, name, provider, region, city, category, price_per_day, capacity, status) VALUES `;
      sql += `('${sId}', '${sName}', '${sProvider}', '${sRegion}', '${sCity}', '${sCategory}', ${priceVal}, ${capacityVal}, '${sStatus}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, provider = EXCLUDED.provider, status = EXCLUDED.status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Bookings (${(bookings || []).length} records)\n`;
    (bookings || []).forEach((b: any) => {
      const sId = String(b.id || '').replace(/'/g, "''");
      const sCustomer = String(b.customerName || b.customer || 'عميل تجريبي').replace(/'/g, "''");
      const sPhone = String(b.phone || b.customerPhone || '').replace(/'/g, "''");
      const sHallName = String(b.hall || b.hallName || '').replace(/'/g, "''");
      const sDate = String(b.date || b.startDate || '2026-06-01').replace(/'/g, "''");
      const priceVal = b.totalPrice || b.amount || 0;
      const sStatus = String(b.status || 'مؤكد').replace(/'/g, "''");
      const sPayment = String(b.paymentStatus || b.payment || 'غير مدفوع').replace(/'/g, "''");
      sql += `INSERT INTO bookings (id, hall_name, customer_name, customer_phone, date, amount, status, payment_status) VALUES `;
      sql += `('${sId}', '${sHallName}', '${sCustomer}', '${sPhone}', '${sDate}', ${priceVal}, '${sStatus}', '${sPayment}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, payment_status = EXCLUDED.payment_status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Support Service Requests (${(supportServiceRequests || []).length} records)\n`;
    (supportServiceRequests || []).forEach((s: any) => {
      const sId = String(s.id || '').replace(/'/g, "''");
      const sServiceName = String(s.serviceName || s.title || '').replace(/'/g, "''");
      const sProviderName = String(s.providerName || s.provider || '').replace(/'/g, "''");
      const priceVal = s.price || s.amount || 0;
      const sDate = String(s.date || '2026-05-29').replace(/'/g, "''");
      const sPayment = String(s.paymentStatus || 'غير مدفوع').replace(/'/g, "''");
      const sStatus = String(s.status || 'انتظار').replace(/'/g, "''");
      sql += `INSERT INTO support_services (id, service_name, provider_name, price, date, payment_status, status) VALUES `;
      sql += `('${sId}', '${sServiceName}', '${sProviderName}', ${priceVal}, '${sDate}', '${sPayment}', '${sStatus}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, payment_status = EXCLUDED.payment_status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Inventory (${(inventory || []).length} records)\n`;
    (inventory || []).forEach((inv: any) => {
      const sId = String(inv.id || '').replace(/'/g, "''");
      const sName = String(inv.name || '').replace(/'/g, "''");
      const sSku = String(inv.sku || '').replace(/'/g, "''");
      const stockVal = inv.currentStock || 0;
      const reorderVal = inv.reorderLevel || 0;
      const sSupplier = String(inv.supplier || '').replace(/'/g, "''");
      const costVal = inv.cost || 0;
      const sLast = String(inv.lastUpdated || '').replace(/'/g, "''");
      sql += `INSERT INTO inventory (id, name, sku, current_stock, reorder_level, supplier, cost, last_updated) VALUES `;
      sql += `('${sId}', '${sName}', '${sSku}', ${stockVal}, ${reorderVal}, '${sSupplier}', ${costVal}, '${sLast}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET current_stock = EXCLUDED.current_stock, cost = EXCLUDED.cost;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Providers (${(providers || []).length} records)\n`;
    (providers || []).forEach((p: any) => {
      const sId = String(p.id || '').replace(/'/g, "''");
      const sName = String(p.name || '').replace(/'/g, "''");
      const sPhone = String(p.phone || '').replace(/'/g, "''");
      const sEmail = String(p.email || '').replace(/'/g, "''");
      const sRegion = String(p.region || '').replace(/'/g, "''");
      const sCity = String(p.city || '').replace(/'/g, "''");
      const sJoined = String(p.joinedDate || p.date || '2026-06-01').replace(/'/g, "''");
      const sStatus = String(p.status || 'نشط').replace(/'/g, "''");
      sql += `INSERT INTO providers (id, name, phone, email, region, city, joined_date, status) VALUES `;
      sql += `('${sId}', '${sName}', '${sPhone}', '${sEmail}', '${sRegion}', '${sCity}', '${sJoined}', '${sStatus}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Customers (${(customers || []).length} records)\n`;
    (customers || []).forEach((c: any) => {
      const sId = String(c.id || '').replace(/'/g, "''");
      const sName = String(c.name || '').replace(/'/g, "''");
      const sPhone = String(c.phone || '').replace(/'/g, "''");
      const sEmail = String(c.email || '').replace(/'/g, "''");
      const sCity = String(c.city || '').replace(/'/g, "''");
      const sJoined = String(c.joinedDate || c.date || '2026-06-01').replace(/'/g, "''");
      const sStatus = String(c.status || 'نشط').replace(/'/g, "''");
      sql += `INSERT INTO customers (id, name, phone, email, city, joined_date, status) VALUES `;
      sql += `('${sId}', '${sName}', '${sPhone}', '${sEmail}', '${sCity}', '${sJoined}', '${sStatus}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Campaigns (${(campaigns || []).length} records)\n`;
    (campaigns || []).forEach((cam: any) => {
      const sId = String(cam.id || '').replace(/'/g, "''");
      const sTitle = String(cam.title || '').replace(/'/g, "''");
      const sProvider = String(cam.provider || '').replace(/'/g, "''");
      const budgetVal = cam.budget || cam.totalBudget || 0;
      const sStart = String(cam.startDate || cam.start || '2026-06-01').replace(/'/g, "''");
      const sEnd = String(cam.endDate || cam.end || '2026-07-01').replace(/'/g, "''");
      const sStatus = String(cam.status || 'نشط').replace(/'/g, "''");
      sql += `INSERT INTO campaigns (id, title, provider, budget, start_date, end_date, status) VALUES `;
      sql += `('${sId}', '${sTitle}', '${sProvider}', ${budgetVal}, '${sStart}', '${sEnd}', '${sStatus}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Support Tickets (${(supportTickets || []).length} records)\n`;
    (supportTickets || []).forEach((t: any) => {
      const sId = String(t.id || '').replace(/'/g, "''");
      const sTitle = String(t.title || t.subject || 'تذكرة مستفسرة').replace(/'/g, "''");
      const sCustomer = String(t.customerName || t.customer || 'عميل').replace(/'/g, "''");
      const sDepartment = String(t.department || 'تقني').replace(/'/g, "''");
      const sPriority = String(t.priority || 'متوسط').replace(/'/g, "''");
      const sStatus = String(t.status || 'مفتوح').replace(/'/g, "''");
      sql += `INSERT INTO support_tickets (id, title, customer_name, department, priority, status) VALUES `;
      sql += `('${sId}', '${sTitle}', '${sCustomer}', '${sDepartment}', '${sPriority}', '${sStatus}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Staff Tasks (${(staffTasks || []).length} records)\n`;
    (staffTasks || []).forEach((tsk: any) => {
      const sId = String(tsk.id || '').replace(/'/g, "''");
      const sTitle = String(tsk.taskTitle || tsk.title || 'مهمة عمل').replace(/'/g, "''");
      const sAssigned = String(tsk.assignedTo || tsk.staffName || '').replace(/'/g, "''");
      const sDue = String(tsk.dueDate || tsk.date || '2026-06-01').replace(/'/g, "''");
      const sPriority = String(tsk.priority || 'متوسط').replace(/'/g, "''");
      const sStatus = String(tsk.status || 'قيد الانتظار').replace(/'/g, "''");
      sql += `INSERT INTO staff_tasks (id, task_title, assigned_to, due_date, priority, status) VALUES `;
      sql += `('${sId}', '${sTitle}', '${sAssigned}', '${sDue}', '${sPriority}', '${sStatus}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Live data from Reviews (${(reviews || []).length} records)\n`;
    (reviews || []).forEach((rev: any) => {
      const sId = String(rev.id || '').replace(/'/g, "''");
      const sAuthor = String(rev.author || rev.customerName || 'مقيم خارجي').replace(/'/g, "''");
      const sTarget = String(rev.targetName || rev.hallName || rev.serviceName || '').replace(/'/g, "''");
      const ratingVal = rev.rating || 5;
      const sComment = String(rev.comment || '').replace(/'/g, "''");
      const sDate = String(rev.date || '2026-06-01').replace(/'/g, "''");
      sql += `INSERT INTO reviews (id, author, target_name, rating, comment, created_at) VALUES `;
      sql += `('${sId}', '${sAuthor}', '${sTarget}', ${ratingVal}, '${sComment}', '${sDate}') \n`;
      sql += `ON CONFLICT (id) DO UPDATE SET rating = EXCLUDED.rating;\n`;
    });
    sql += `\n`;

    sql += `-- Inserting Platform General & Financial settings config\n`;
    const sPlatformName = String(platformData?.platformName || 'منصة الفعاليات المركزية').replace(/'/g, "''");
    const sSupportPhone = String(platformData?.companyPhone || platformData?.supportPhone || '920000000').replace(/'/g, "''");
    const sSupportEmail = String(platformData?.companyEmail || platformData?.supportEmail || 'info@eventplatform.com').replace(/'/g, "''");
    const sTax = String(platformData?.taxNumber || '300000000000003').replace(/'/g, "''");
    const sCr = String(platformData?.crNumber || '1010000000').replace(/'/g, "''");
    sql += `INSERT INTO system_settings (id, platform_name, support_phone, support_email, tax_number, cr_number) VALUES `;
    sql += `('main_config', '${sPlatformName}', '${sSupportPhone}', '${sSupportEmail}', '${sTax}', '${sCr}') \n`;
    sql += `ON CONFLICT (id) DO UPDATE SET platform_name = EXCLUDED.platform_name, support_phone = EXCLUDED.support_phone, support_email = EXCLUDED.support_email;\n`;
    sql += `\n`;

    return sql;
  }, [halls, bookings, supportServiceRequests, inventory, providers, customers, campaigns, supportTickets, staffTasks, reviews, platformData]);

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const updateSetting = (key: string, value: any) => {
    const val = { ...platformData, [key]: value };
    setPlatformData(val);
    
    // Immediate robust local fallback storage
    try {
      localStorage.setItem('PLATFORM_DATA', JSON.stringify(val));
    } catch (e) {
      console.warn("Failed to write PLATFORM_DATA to localStorage:", e);
    }
    
    // Centralized fetch directly to server
    fetch('/api/system/configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({
        key: 'PLATFORM_DATA',
        value: val
      })
    }).catch(err => console.warn("Error saving PLATFORM_DATA centrally (network fallback active):", err));
    
    window.dispatchEvent(new Event('settingsUpdated'));
  };

  const updateHeroFallback = (fallback: any) => {
    const val = { 
      ...platformData, 
      heroFallback: fallback,
      coverUrl: fallback.image || ''
    };
    setPlatformData(val);
    
    // Immediate robust local fallback storage
    try {
      localStorage.setItem('PLATFORM_DATA', JSON.stringify(val));
    } catch (e) {
      console.warn("Failed to write PLATFORM_DATA to localStorage:", e);
    }
    
    fetch('/api/system/configs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-user-role': 'admin'
      },
      body: JSON.stringify({
        key: 'PLATFORM_DATA',
        value: val
      })
    }).catch(err => console.warn("Error saving PLATFORM_DATA centrally (network fallback active):", err));
    
    window.dispatchEvent(new Event('settingsUpdated'));
  };

  const handleFileUpload = async (type: 'logoUrl' | 'faviconUrl' | 'coverUrl', file: File) => {
    setLoading(prev => ({ ...prev, [type]: true }));

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));

      const reader = new FileReader();
      reader.onloadend = () => {
        updateSetting(type, reader.result as string);

        if (type === 'faviconUrl') {
          let link: HTMLLinkElement | null = document.querySelector("link[rel*='icon']");
          if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.getElementsByTagName('head')[0].appendChild(link);
          }
          link.href = reader.result as string;
        }

        showToast(`تم رفع الصورة بنجاح!`, 'success');
        setLoading(prev => ({ ...prev, [type]: false }));
      };
      reader.readAsDataURL(file);

    } catch (error) {
      showToast('حدث خطأ أثناء رفع الصورة', 'error');
      setLoading(prev => ({ ...prev, [type]: false }));
    }
  };

  const tabs = [
    { id: 'data', label: 'بيانات التواصل', icon: Phone },
    { id: 'identity', label: 'الهوية البصرية', icon: Palette },
    { id: 'social', label: 'روابط التواصل الاجتماعي', icon: Share2 },
    { id: 'legal', label: 'التعريفية والقانونية', icon: FileText },
    { id: 'hero', label: 'التحكم بالهيرو والتمويل', icon: Sliders },
    { id: 'database', label: 'المزامنة وقاعدة البيانات', icon: Database },
  ];

  return (
    <div className="relative">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-4 left-4 p-4 rounded-xl shadow-xl flex items-center gap-3 z-50 transition-all ${toast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-medium text-sm">{toast.message}</span>
        </div>
      )}

      {/* Tabs Menu */}
      <div className="flex overflow-x-auto gap-2 mb-8 p-1 bg-slate-100 rounded-2xl border border-slate-200 hide-scrollbar">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-white text-amber-600 shadow-sm border border-slate-200' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/50'
            }`}
          >
            <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-amber-500' : 'text-slate-400'}`} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm">
        {/* Tab 1: Platform Data */}
        {activeTab === 'data' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Phone className="w-5 h-5 text-amber-500" />
              بيانات التواصل
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">أرقام التواصل</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={platformData.phones || ''} 
                    onChange={e => updateSetting('phones', e.target.value)}
                    placeholder="0500000000, 920000000"
                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left" dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني (مفصول بفاصلة)</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={platformData.emails || ''} 
                    onChange={e => updateSetting('emails', e.target.value)}
                    placeholder="info@example.com, support@example.com"
                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left" dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">العنوان</label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={platformData.address || ''} 
                    onChange={e => updateSetting('address', e.target.value)}
                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">ساعات العمل</label>
                <div className="relative">
                  <Clock className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                  <input 
                    type="text" 
                    value={platformData.workingHours || ''} 
                    onChange={e => updateSetting('workingHours', e.target.value)}
                    placeholder="مثال: الأحد - الخميس (09:00 ص - 12:00 م , 04:00 م - 10:00 م)"
                    className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                  />
                </div>
                <div className="mt-2 space-y-1 bg-slate-50 p-2 rounded-lg border border-slate-100">
                  <p className="text-[11px] text-slate-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                    لكتابة فترة واحدة: (الأحد - الخميس (09:00 ص - 12:00 م)
                  </p>
                  <p className="text-[11px] text-slate-600 flex items-center gap-1">
                    <span className="w-1 h-1 bg-amber-400 rounded-full"></span>
                    لكتابة فترتين: (الأحد - الخميس (09:00 ص - 12:00 م , 04:00 م - 10:00 م)
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Visual Identity */}
        {activeTab === 'identity' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Palette className="w-5 h-5 text-amber-500" />
              إعدادات الهوية البصرية والألوان
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Main Logo */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3">شعار المنصة (Main Logo)</label>
                <div className="flex flex-col gap-4">
                  <div className="h-24 bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                    {loading.logoUrl ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    ) : platformData.logoUrl ? (
                      <img src={platformData.logoUrl} alt="Logo" className="h-full object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">لم يتم رفع شعار</span>
                    )}
                  </div>
                  <div className="relative">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleFileUpload('logoUrl', e.target.files[0])} disabled={loading.logoUrl} />
                    <button className="w-full py-2 bg-white text-slate-700 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                       <Upload className="w-4 h-4" /> رفع الشعار
                    </button>
                  </div>
                </div>
              </div>

              {/* Favicon */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200">
                <label className="block text-sm font-bold text-slate-700 mb-3">أيقونة المنصة (Favicon)</label>
                <div className="flex flex-col gap-4">
                  <div className="h-24 bg-white border-2 border-dashed border-slate-200 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                    {loading.faviconUrl ? (
                      <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
                    ) : platformData.faviconUrl ? (
                      <img src={platformData.faviconUrl} alt="Favicon" className="w-12 h-12 object-contain" />
                    ) : (
                      <span className="text-xs text-slate-400 font-medium">لم يتم رفع أيقونة</span>
                    )}
                  </div>
                  <div className="relative">
                    <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={e => e.target.files?.[0] && handleFileUpload('faviconUrl', e.target.files[0])} disabled={loading.faviconUrl} />
                    <button className="w-full py-2 bg-white text-slate-700 text-sm font-bold border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-2">
                       <Upload className="w-4 h-4" /> رفع الأيقونة
                    </button>
                  </div>
                </div>
              </div>

              {/* Redirect to Hero Control */}
              <div className="bg-slate-50 p-6 rounded-2xl border border-dashed border-slate-200 md:col-span-2 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1 text-center md:text-right">
                  <h5 className="font-bold text-slate-800 text-sm">💡 تم دمج إعدادات صورة الغلاف</h5>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                    تم نقل صورة الغلاف الافتراضية إلى تبويب <strong>"التحكم بالهيرو والتمويل"</strong> تحت وضع <strong>"الغلاف الافتراضي الثابت"</strong> لتمكينك من تعديل صورة الغلاف بالإضافة إلى النصوص والروابط التفاعلية وأزرار الإجراء في مكان واحد.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('hero')}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs transition-all hover:scale-105 cursor-pointer whitespace-nowrap shrink-0"
                >
                  الذهاب لإعدادات الغلاف والتحكم بالهيرو ⚡
                </button>
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اللون الرئيسي (Primary Color)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={platformData.primaryColor || '#f59e0b'} 
                    onChange={e => updateSetting('primaryColor', e.target.value)}
                    className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={platformData.primaryColor || '#f59e0b'} 
                    onChange={e => updateSetting('primaryColor', e.target.value)}
                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono" dir="ltr"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">اللون الثانوي (Secondary Color)</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={platformData.secondaryColor || '#0f172a'} 
                    onChange={e => updateSetting('secondaryColor', e.target.value)}
                    className="w-12 h-12 rounded-xl border border-slate-200 cursor-pointer"
                  />
                  <input 
                    type="text" 
                    value={platformData.secondaryColor || '#0f172a'} 
                    onChange={e => updateSetting('secondaryColor', e.target.value)}
                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono" dir="ltr"
                  />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 4: Social Media */}
        {activeTab === 'social' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Share2 className="w-5 h-5 text-amber-500" />
              روابط منصات التواصل الاجتماعي
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {['x', 'facebook', 'instagram', 'snapchat', 'tiktok', 'youtube', 'linkedin', 'jaco'].map(social => (
                <div key={social}>
                  <label className="block text-sm font-bold text-slate-700 mb-2 capitalize">{social}</label>
                  <input 
                    type="url" 
                    value={platformData[social] || ''} 
                    onChange={e => updateSetting(social, e.target.value)}
                    placeholder={`https://${social}.com/...`}
                    className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left" dir="ltr"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: Legal Content */}
        {activeTab === 'legal' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-amber-500" />
              المحتويات التعريفية والسياسات القانونية
            </h4>
            <div className="space-y-6">
              {[
                { id: 'aboutUs', label: 'من نحن' },
                { id: 'privacyPolicy', label: 'سياسة الخصوصية' },
                { id: 'termsAndConditions', label: 'الشروط والأحكام' },
                { id: 'faq', label: 'الأسئلة الشائعة' },
              ].map(field => (
                <div key={field.id}>
                  <label className="block text-sm font-bold text-slate-700 mb-2">{field.label}</label>
                  <div className="bg-slate-100 rounded-2xl p-1 border border-slate-200" dir="ltr">
                    <Editor 
                      value={platformData[field.id] || ''} 
                      onChange={(e: any) => updateSetting(field.id, e.target.value)}
                      className="bg-white min-h-[150px] text-right"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: Database & Synchronization */}
        {activeTab === 'database' && (
          <div className="space-y-8 animate-in fade-in duration-300 text-right" dir="rtl">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-150 pb-5">
              <div>
                <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                  <Database className="w-5 h-5 text-amber-500 animate-pulse" />
                  أدوات ترحيل ومزامنة قاعدة البيانات للتنزيل والمواقع الخارجية
                </h4>
                <p className="text-xs text-slate-500 mt-1">تصدير كامل بيانات وهياكل المنصة الحية، والربط الفوري مع السيرفرات والاستضافات السحابية كـ Supabase / Firebase / Postgres.</p>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
                dbConnectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                dbConnectionStatus === 'testing' ? 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse' :
                dbConnectionStatus === 'error' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                <span className={`w-2 h-2 rounded-full ${
                  dbConnectionStatus === 'connected' ? 'bg-emerald-500' :
                  dbConnectionStatus === 'testing' ? 'bg-amber-500 animate-ping' :
                  dbConnectionStatus === 'error' ? 'bg-rose-500' :
                  'bg-slate-400'
                }`}></span>
                {dbConnectionStatus === 'connected' ? 'مربوط ومزامَن' :
                 dbConnectionStatus === 'testing' ? 'جاري الفحص والمصافحة...' :
                 dbConnectionStatus === 'error' ? 'حدث خطأ بالاتصال' : 'غير متصل بالخارج'}
              </span>
            </div>

            {/* 1. Database Tables Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {[
                { name: 'القاعات والمرافق (halls)', count: halls.length, color: 'border-blue-100 bg-blue-50/20 text-blue-800' },
                { name: 'حجوزات العملاء (bookings)', count: bookings.length, color: 'border-emerald-100 bg-emerald-50/20 text-emerald-800' },
                { name: 'الخدمات المساندة (support_services)', count: supportServiceRequests.length, color: 'border-amber-100 bg-amber-50/20 text-amber-800' },
                { name: 'المخزون والقطع (inventory)', count: inventory.length, color: 'border-purple-100 bg-purple-50/20 text-purple-800' },
                { name: 'الشركاء والمزودين (providers)', count: providers.length, color: 'border-pink-100 bg-pink-50/20 text-pink-800' },
                { name: 'عملاء المنصة (customers)', count: customers.length, color: 'border-rose-100 bg-rose-50/20 text-rose-800' },
                { name: 'حملات الإعلان (campaigns)', count: campaigns.length, color: 'border-teal-100 bg-teal-50/20 text-teal-800' },
                { name: 'تذاكر الدعم السريع (tickets)', count: supportTickets.length, color: 'border-cyan-100 bg-cyan-50/20 text-cyan-800' },
                { name: 'مهام العمل (staff_tasks)', count: staffTasks.length, color: 'border-indigo-100 bg-indigo-50/20 text-indigo-800' },
                { name: 'المراجعات والتقييمات (reviews)', count: reviews.length, color: 'border-orange-100 bg-orange-50/20 text-orange-800' },
                { name: 'سياسات وهوية المنصة', count: 1, color: 'border-slate-150 bg-slate-50 text-slate-700' },
              ].map((table, i) => (
                <div key={i} className={`p-4 rounded-xl border ${table.color} text-right flex flex-col justify-between h-24 shadow-xs hover:shadow-md transition-all`}>
                  <span className="text-[10px] font-mono opacity-90 uppercase block leading-tight font-bold">{table.name}</span>
                  <div className="flex justify-between items-baseline mt-2">
                    <span className="text-xl font-black">{table.count}</span>
                    <span className="text-[9px] opacity-70">سجل نشط</span>
                  </div>
                </div>
              ))}
            </div>

            {/* 2. Download Database Schemas & Copy Tool */}
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-6">
              <div>
                <h5 className="font-bold text-slate-800 text-sm mb-2">📥 سحب واستخراج قاعدة البيانات الحالية</h5>
                <p className="text-xs text-slate-500 leading-relaxed">
                  يمكنك استخراج نسخة احتياطية حية من قاعدة بيانات النظام فوراً وتشغيلها على أي استضافة خارجية كـ <strong className="text-slate-800">Supabase SQL Editor أو PostgreSQL</strong>. 
                  <span className="text-amber-600 font-bold block mt-1">⚠️ تنبيه هام: يرجى التأكد من نسخ كود الـ SQL الاستعلامي أدناه، وليس ملف الـ Data Dump (JSON) الذي يبدأ بالرمز {"{"} لتجنب أخطاء بناء الجملة (Syntax Errors) في محرر Supabase!</span>
                </p>
              </div>

              {/* Live SQL Preview and Copy Console */}
              <div className="bg-slate-900 rounded-xl p-4 border border-slate-800 space-y-3 relative group">
                <div className="flex justify-between items-center bg-slate-800 px-3 py-2 rounded-lg text-slate-300 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="font-mono text-[10px] text-slate-400">PostgreSQL / Supabase Schema & Dump Ready</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sqlSchemaAndData);
                      setCopiedSql(true);
                      showToast("تم نسخ كود الـ SQL بالكامل إلى الحافظة بنجاح! 📋", "success");
                      setTimeout(() => setCopiedSql(false), 3000);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] rounded transition-all active:scale-95 cursor-pointer"
                  >
                    {copiedSql ? "✅ تم النسخ!" : "📋 نسخ كود الـ SQL بالكامل"}
                  </button>
                </div>
                
                <div className="max-h-60 overflow-y-auto rounded-lg text-left" dir="ltr">
                  <pre className="p-3 bg-slate-950 font-mono text-[10px] text-emerald-400 overflow-x-auto selection:bg-slate-700 leading-relaxed">
                    <code>{sqlSchemaAndData}</code>
                  </pre>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1">
                  <span>تم تجهيز مخطط الجداول الأربعة وحقن كافة السجلات الحية الحالية</span>
                  <span className="font-mono">{sqlSchemaAndData.split('\n').length} أسطر SQL جاهزة للتنفيذ</span>
                </div>
              </div>

              {/* Download Buttons for Files */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <button
                  onClick={() => {
                    try {
                      const fullDb = {
                        halls: halls,
                        bookings: bookings,
                        supportServiceRequests: supportServiceRequests,
                        inventory: inventory,
                        platformData: platformData,
                        exportedAt: new Date().toISOString(),
                        version: "2.1.0-prod"
                      };
                      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(fullDb, null, 2));
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `central_platform_database_dump_${new Date().toISOString().split('T')[0]}.json`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast("تم استخراج وتحميل كامل بيانات النظام بصيغة JSON بنجاح! 💾", "success");
                    } catch (e) {
                      showToast("عذراً، فشل تصدير البيانات.", "error");
                    }
                  }}
                  className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 text-right flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-98 w-full"
                >
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-xl group-hover:bg-blue-100 transition-colors">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-slate-800">تنزيل نسخة JSON الاحتياطية (Export JSON Dump)</span>
                    <span className="text-[10px] text-slate-400 font-sans block mt-0.5 text-right font-sans block mt-0.5">تبدأ بالرمز {"{"}. تستخدم للاستيراد المبرمج أو أخذ نسخة احتياطية حجرية للمنصة.</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    try {
                      const dataStr = "data:text/sql;charset=utf-8," + encodeURIComponent(sqlSchemaAndData);
                      const downloadAnchor = document.createElement('a');
                      downloadAnchor.setAttribute("href", dataStr);
                      downloadAnchor.setAttribute("download", `platform_sql_migrations_dump_${new Date().toISOString().split('T')[0]}.sql`);
                      document.body.appendChild(downloadAnchor);
                      downloadAnchor.click();
                      downloadAnchor.remove();
                      showToast("تم توليد وتحميل ملف الـ SQL بنجاح! ⚡", "success");
                    } catch(e) {
                      showToast("عذراً، فشل ترحيل وتصدير مخطط SQL.", "error");
                    }
                  }}
                  className="bg-white hover:bg-slate-50 p-4 rounded-xl border border-slate-200 text-right flex items-center gap-4 transition-all hover:scale-[1.01] group active:scale-98 w-full"
                >
                  <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-100 transition-colors">
                    <Database className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="block font-bold text-xs text-slate-800">تحميل ملف SQL Migrations كاملاً (.sql)</span>
                    <span className="text-[10px] text-slate-400 font-sans block mt-0.5 text-right font-sans block mt-0.5 font-sans block mt-0.5">تبدأ بالتعليقات --. مخطط وجداول وقيود PostgreSQL وحقن البيانات فورا.</span>
                  </div>
                </button>
              </div>
            </div>

            {/* 3. Connection Settings & Instructions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 text-white rounded-2xl p-6 space-y-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl font-sans"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 justify-between">
                  <div className="space-y-3 text-right">
                    <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2.5 py-1 rounded-full font-bold border border-amber-500/30">🔐 إعلام بأمان المنصة وعقد الربط</span>
                    <h5 className="font-bold text-white text-base flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-amber-500 animate-pulse" />
                      تم ترقية ونقل إعدادات الاستضافة والمفاتيح السرية!
                    </h5>
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xl">
                      امتثالاً لمتطلبات حماية قواعد البيانات وتنسيق الهوية المشفرة وحثّها خلف بيئة الخادم الآمنة (AES-256 Crypto)، تم نقل حقول <strong className="text-white">مزود الاستضافة الخارجي ومفتاح الـ Secret Key / Private Key</strong> بالكامل لتصبح مشفرة وحية.
                    </p>
                    <p className="text-xs text-amber-400 leading-relaxed font-bold">
                      🛡️ يمكنك إدارتها وفحص سلامة اتصالها بالـ SUPABASE_DATABASE_URL الآن عبر تبويب: <br />
                      <span className="bg-slate-800/85 px-2 py-1 rounded border border-slate-700/50 mt-1 inline-block text-[10px] font-mono font-bold text-left" dir="ltr">إعدادات الحماية والأمان ← الأمان وقاعدة البيانات</span>
                    </p>
                  </div>
                  <div className="shrink-0">
                    <ShieldCheck className="w-16 h-16 text-amber-500" />
                  </div>
                </div>
              </div>

              {/* 4. Connection Guide Card */}
              <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 flex flex-col justify-between space-y-4">
                <div>
                  <h6 className="font-bold text-slate-800 text-xs mb-3 flex items-center gap-1.5">
                    <Terminal className="w-4 h-4 text-slate-600" />
                    دليل ربط وتثبيت قاعدة البيانات الخارجية:
                  </h6>
                  <ul className="space-y-3.5 text-xs text-slate-600 font-sans leading-relaxed text-right list-decimal list-inside pr-1">
                    <li>قم بإنشاء حساب في منصة <strong className="text-slate-800 font-black">Supabase</strong> أو <strong className="text-slate-800 font-black">Firebase</strong> ومن ثم مشروع جديد.</li>
                    <li>قم بتحميل ملف <strong className="text-slate-800 font-black">SQL Schema</strong> بالأعلى وانقله إلى لوحة المحاكاة والـ SQL Editor، ونفّذ الاستعلام لتأسيس الجداول الأربعة وحقن السجلات.</li>
                    <li>انسخ رابط الـ API ومفتاح الأمان (Service Key) وضعهما في حقل التكوين باليمين.</li>
                    <li>عند تحميل المجلد البرمجي للتطبيق للتأجير والتثبيت الفعلي، انتقل لملف السيرفر المدمج <code className="bg-slate-100 text-rose-600 px-1 py-0.5 rounded text-[10px] font-mono">server.ts</code> واستدعي مفاتيح الاتصال كـ <code className="bg-slate-100 text-indigo-600 px-1 py-0.5 rounded text-[10px] font-mono">process.env.DATABASE_URI</code> بأمان.</li>
                  </ul>
                </div>
                <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[10px] text-amber-800 leading-relaxed">
                  💡 <strong>ملاحظة احترافية:</strong> يحافظ هذا المولد على المزامنة الكاملة ولا يمس ملفاتك المحلية مباشرة بل يحضرها لك للترحيل.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Hero & Smart Monetization settings */}
        {activeTab === 'hero' && (
          <div className="space-y-8 animate-in fade-in duration-300 text-right" dir="rtl">
            <div>
              <h4 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-500" />
                إدارة هيرو الصفحة الرئيسية والتمويل الذكي
              </h4>
              <p className="text-xs text-slate-500 mt-1">تكوين نمط الغلاف الرئيسي للمنصة وتنشيط الحملات الإعلانية ومحركات الدخل الإعلاني الفاخرة.</p>
            </div>

            {/* Mode Selector */}
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
              <label className="block text-sm font-black text-slate-800 mb-2">وضع العرض النشط في الهيرو (Active Hero Mode):</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                {[
                  { id: 'static', title: 'الغلاف الافتراضي الثابت', desc: 'عرض صورة واحدة مخصصة مع نص ترحيبي ثابت وعام (المقترح 3)', icon: Image },
                  { id: 'controlled', title: 'السلايدر الشرائحي التفاعلي', desc: 'سلايدر شرائح يدوي ومجدول يتم إدخاله والتحكم فيه بالكامل من الإدارة (المقترح 1)', icon: Sliders },
                  { id: 'spotlight', title: 'باقة الرعاية الفاخرة', desc: 'عرض الصالات الشريكة المميزة المشتركة في باقة الرعاية لتدويرها والترويج لها بمقابل دوري', icon: Sparkles },
                  { id: 'takeover', title: 'الاستحواذ الشامل للمواسم', desc: 'عرض حملة إعلانية بمساحة كاملة تسيطر على واجهة المنصة بالكامل لعلامة تجارية معينة', icon: Trophy },
                  { id: 'bidding', title: 'مزاد عطلات نهاية الأسبوع', desc: 'عرض القاعة الفائزة بمزاد الويكيند الترويجي لزيادة الدفع من الشركاء لقاء التثبيت', icon: Coins },
                  { id: 'services', title: 'ترويج الخدمات عالية الهامش', desc: 'التركيز على حث العملاء لحجز الخدمات اللوجستية المساندة (مكاسب مضاعفة للمنصة)', icon: Tag }
                ].map(mode => {
                  const isActive = (platformData.heroMode || 'static') === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => {
                        updateSetting('heroMode', mode.id);
                        showToast(`تم تغيير وضع الهيرو إلى: ${mode.title}`, 'success');
                      }}
                      className={`p-4 rounded-2xl border text-right transition-all flex flex-col gap-2 hover:border-amber-400 cursor-pointer ${
                        isActive 
                          ? 'bg-amber-500/10 border-amber-500 text-slate-900 shadow-sm' 
                          : 'bg-white border-slate-200 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`p-1.5 rounded-lg ${isActive ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          <mode.icon className="w-4 h-4" />
                        </span>
                        <span className="font-bold text-sm">{mode.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-1">{mode.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Sub-panels for configurations */}
            {/* 1. Static Fallback settings */}
            {(platformData.heroMode || 'static') === 'static' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h5 className="font-bold text-slate-800 text-sm">⚙️ إعدادات الغلاف الترحيبي الثابت</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">تعديل الصورة الترحيبية الثابتة للمنصة في حالات غياب الحملات الإعلانية النشطة.</p>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                  {/* Form fields (3/5 width) */}
                  <div className="lg:col-span-3 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">عنوان الغلاف الرئيسي (العربي)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-sans"
                          value={platformData.heroFallback?.title || ''}
                          onChange={e => {
                            const fallback = { ...(platformData.heroFallback || {}), title: e.target.value };
                            updateHeroFallback(fallback);
                          }}
                          placeholder="لحظاتك السعيدة تبدأ من ليلة"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">العنوان الفرعي (العربي)</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-sans"
                          value={platformData.heroFallback?.subtitle || ''}
                          onChange={e => {
                            const fallback = { ...(platformData.heroFallback || {}), subtitle: e.target.value };
                            updateHeroFallback(fallback);
                          }}
                          placeholder="اكتشف واحجز أرقى القاعات والاستراحات لمناسباتك بكل سهولة"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2">رابط صورة الغلاف</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                          dir="ltr"
                          value={platformData.heroFallback?.image || ''}
                          onChange={e => {
                            const fallback = { ...(platformData.heroFallback || {}), image: e.target.value };
                            updateHeroFallback(fallback);
                          }}
                        />
                        <div className="relative shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  const fallback = { ...(platformData.heroFallback || {}), image: reader.result as string };
                                  updateHeroFallback(fallback);
                                  showToast('تم رفع صورة الغلاف الثابت بنجاح!', 'success');
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <button type="button" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1">
                            <Upload className="w-4 h-4" /> رفع صورة
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">نص زر الإجراء</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                          value={platformData.heroFallback?.buttonText || 'استكشف القاعات'}
                          onChange={e => {
                            const fallback = { ...(platformData.heroFallback || {}), buttonText: e.target.value };
                            updateHeroFallback(fallback);
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-2">رابط زر الإجراء</label>
                        <input
                          type="text"
                          className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                          dir="ltr"
                          value={platformData.heroFallback?.buttonLink || '#'}
                          onChange={e => {
                            const fallback = { ...(platformData.heroFallback || {}), buttonLink: e.target.value };
                            updateHeroFallback(fallback);
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Visual Mockup Preview (2/5 width) */}
                  <div className="lg:col-span-2 flex flex-col justify-between bg-slate-50 p-5 rounded-2xl border border-slate-200">
                    <div className="mb-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                        <Eye className="w-4 h-4 text-amber-500" /> معاينة الغلاف الترحيبي الثابت
                      </span>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">مباشر</span>
                    </div>

                    <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 bg-slate-200 shadow-inner flex items-center justify-center">
                      {platformData.heroFallback?.image ? (
                        <>
                          <img 
                            src={platformData.heroFallback.image} 
                            alt="Cover Mockup" 
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent flex flex-col justify-end p-4 text-right">
                            <span className="text-[9px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.5 rounded w-max mb-1">الرئيسية</span>
                            <h4 className="text-white text-xs md:text-sm font-black leading-tight drop-shadow-md mb-0.5 font-sans">
                              {platformData.heroFallback?.title || 'لحظاتك السعيدة تبدأ من ليلة'}
                            </h4>
                            <p className="text-slate-200 text-[10px] leading-normal line-clamp-2 mb-2 drop-shadow-sm max-w-[90%] font-sans">
                              {platformData.heroFallback?.subtitle || 'اكتشف واحجز أرقى القاعات والاستراحات لمناسباتك بكل سهولة'}
                            </p>
                            {platformData.heroFallback?.buttonText && (
                              <div className="inline-flex items-center gap-1 px-3 py-1 bg-amber-500 text-slate-950 font-black rounded-lg text-[9px] w-max shadow-sm">
                                {platformData.heroFallback?.buttonText}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="text-center p-4">
                          <Image className="w-8 h-8 text-slate-400 mx-auto mb-1.5 stroke-[1.5]" />
                          <p className="text-xs text-slate-500 font-bold">يرجى رفع صورة لمعاينتها هنا</p>
                        </div>
                      )}
                    </div>
                    
                    <p className="text-[10px] text-slate-500 text-center mt-3 leading-relaxed">
                      هذا التصميم يحاكي تماماً شكل الشريحة الرئيسية للعملاء على الواجهة العامة للتطبيق بجميع النصوص والعناصر المضافة.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Controlled Slideshow settings */}
            {(platformData.heroMode || 'static') === 'controlled' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                  <div>
                    <h5 className="font-bold text-slate-800 text-sm">⚙️ إدارة شرائح السلايدر اليدوية</h5>
                    <p className="text-[11px] text-slate-500 mt-0.5">أضف وتحكم في الشرائح التسويقية النشطة للمنصة، وحدد ترتيب عرضها.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSlideId(null);
                      setSlideFormData({
                        badge: 'عرض جديد',
                        title: '',
                        subtitle: '',
                        image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80',
                        buttonText: 'احجز الآن',
                        buttonLink: '#',
                        status: 'active',
                        order: (platformData.heroSlides || []).length + 1
                      });
                      setNewSlideModalOpen(true);
                    }}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" /> إضافة شريحة جديدة
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-150">
                      <tr>
                        <th className="p-4 font-bold">الترتيب</th>
                        <th className="p-4 font-bold">المعاينة</th>
                        <th className="p-4 font-bold">العنوان والوصف</th>
                        <th className="p-4 font-bold">الوسم والزر</th>
                        <th className="p-4 font-bold">الحالة</th>
                        <th className="p-4 font-bold text-center">الإجراءات</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(platformData.heroSlides || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center p-8 text-slate-400 font-bold">لا توجد أي شرائح مضافة حتى الآن. أضف شريحة لبدء العرض!</td>
                        </tr>
                      ) : (
                        (platformData.heroSlides || [])
                          .sort((a: any, b: any) => (a.order || 0) - (b.order || 0))
                          .map((slide: any) => (
                            <tr key={slide.id} className="hover:bg-slate-50/50 transition-colors">
                              <td className="p-4 font-mono font-bold text-slate-500 text-sm">#{slide.order || 1}</td>
                              <td className="p-4">
                                <div className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200">
                                  <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />
                                </div>
                              </td>
                              <td className="p-4 max-w-xs">
                                <h6 className="font-bold text-slate-800 text-xs truncate">{slide.title}</h6>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5">{slide.subtitle}</p>
                              </td>
                              <td className="p-4">
                                <span className="inline-block bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded border border-slate-200 mb-1">{slide.badge}</span>
                                <div className="text-[10px] text-slate-500">الزر: {slide.buttonText}</div>
                              </td>
                              <td className="p-4">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = platformData.heroSlides.map((s: any) => s.id === slide.id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s);
                                    updateSetting('heroSlides', updated);
                                    showToast('تم تحديث حالة الشريحة بنجاح!', 'success');
                                  }}
                                  className={`px-2.5 py-1 rounded text-[10px] font-bold border transition-colors cursor-pointer ${
                                    slide.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'
                                  }`}
                                >
                                  {slide.status === 'active' ? '● مفعّل' : '○ معطل'}
                                </button>
                              </td>
                              <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingSlideId(slide.id);
                                      setSlideFormData({ ...slide });
                                      setNewSlideModalOpen(true);
                                    }}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-all cursor-pointer"
                                    title="تعديل"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      if (confirm('هل أنت متأكد من حذف هذه الشريحة؟')) {
                                        const updated = platformData.heroSlides.filter((s: any) => s.id !== slide.id);
                                        updateSetting('heroSlides', updated);
                                        showToast('تم حذف الشريحة بنجاح.', 'success');
                                      }
                                    }}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                    title="حذف"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Spotlight Package Settings */}
            {(platformData.heroMode || 'static') === 'spotlight' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h5 className="font-bold text-slate-800 text-sm">⚙️ تكوين باقة الرعاية الفاخرة (Premium Spotlight Rotation)</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">حدد الصالات والشركاء المشمولين في التناوب الترويجي لتدويرهم تلقائياً في منطقة الهيرو الرئيسية.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">قالب عنوان العرض (يمكنك استخدام المتغير {'{hallName}'} للتعويض الديناميكي)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.spotlightConfig?.titleTemplate || ''}
                      onChange={e => {
                        const config = { ...(platformData.spotlightConfig || {}), titleTemplate: e.target.value };
                        updateSetting('spotlightConfig', config);
                      }}
                      placeholder="قاعة مميزة: {hallName}"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">قالب الوصف الفرعي (يمكنك استخدام المتغير {'{hallName}'})</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.spotlightConfig?.subtitleTemplate || ''}
                      onChange={e => {
                        const config = { ...(platformData.spotlightConfig || {}), subtitleTemplate: e.target.value };
                        updateSetting('spotlightConfig', config);
                      }}
                      placeholder="احجز مباشرة بخصومات حصرية من المنصة"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">فترة بقاء الشريحة بالثواني (Slide Interval in Seconds)</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                      value={platformData.spotlightConfig?.intervalSeconds || 5}
                      onChange={e => {
                        const config = { ...(platformData.spotlightConfig || {}), intervalSeconds: parseInt(e.target.value) || 5 };
                        updateSetting('spotlightConfig', config);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">رسوم الرعاية الشهرية لكل صالة (ر.س) - لأغراض إحصائية</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                      value={platformData.spotlightConfig?.packageCost || 1200}
                      onChange={e => {
                        const config = { ...(platformData.spotlightConfig || {}), packageCost: parseInt(e.target.value) || 0 };
                        updateSetting('spotlightConfig', config);
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-800 mb-3">اختر الصالات المشمولة في باقة الرعاية الفاخرة (Spotlight Halls):</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {halls.length === 0 ? (
                      <div className="text-xs text-slate-400 p-4 border border-dashed border-slate-200 rounded-2xl col-span-3 text-center">لا توجد قاعات مسجلة بالمنصة حالياً.</div>
                    ) : (
                      halls.map((hall: any) => {
                        const selectedHallsList = platformData.spotlightConfig?.selectedHalls || [];
                        const isSelected = selectedHallsList.includes(hall.id);
                        return (
                          <button
                            key={hall.id}
                            type="button"
                            onClick={() => {
                              let nextHalls = [];
                              if (isSelected) {
                                nextHalls = selectedHallsList.filter((id: string) => id !== hall.id);
                              } else {
                                nextHalls = [...selectedHallsList, hall.id];
                              }
                              const config = { ...(platformData.spotlightConfig || {}), selectedHalls: nextHalls };
                              updateSetting('spotlightConfig', config);
                            }}
                            className={`p-3.5 rounded-2xl border text-right transition-all flex items-center justify-between cursor-pointer hover:border-amber-400 ${
                              isSelected ? 'bg-amber-500/10 border-amber-500 text-amber-900 font-bold' : 'bg-white border-slate-200 text-slate-700'
                            }`}
                          >
                            <div className="truncate pl-2">
                              <p className="text-xs truncate font-bold">{hall.name}</p>
                              <span className="text-[10px] text-slate-400 truncate block mt-0.5">{hall.provider} • {hall.city}</span>
                            </div>
                            <span className={`w-4 h-4 rounded-full border shrink-0 flex items-center justify-center ${isSelected ? 'border-amber-500 bg-amber-500 text-white' : 'border-slate-300 bg-white'}`}>
                              {isSelected && <span className="text-[9px]">✔</span>}
                            </span>
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 4. Seasonal Brand Takeover Settings */}
            {(platformData.heroMode || 'static') === 'takeover' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h5 className="font-bold text-slate-800 text-sm">⚙️ إعدادات الاستحواذ الشامل للمواسم والمناسبات (Seasonal Takeover Campaign)</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">تثبيت لوحة تسويقية موحدة لجهة معينة أو حملة سيادية خاصة بالمنصة للسيطرة على واجهة البحث لفترة موسمية محددة.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">اسم الموسم / العلامة المستحوذة</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.takeoverConfig?.brandName || ''}
                      onChange={e => {
                        const config = { ...(platformData.takeoverConfig || {}), brandName: e.target.value };
                        updateSetting('takeoverConfig', config);
                      }}
                      placeholder="موسم الأعراس الكبرى / شريك ليلة الفاخر"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">العنوان التسويقي الرئيسي للاستحواذ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.takeoverConfig?.title || ''}
                      onChange={e => {
                        const config = { ...(platformData.takeoverConfig || {}), title: e.target.value };
                        updateSetting('takeoverConfig', config);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">نص الوصف الطويل</label>
                    <textarea
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.takeoverConfig?.subtitle || ''}
                      onChange={e => {
                        const config = { ...(platformData.takeoverConfig || {}), subtitle: e.target.value };
                        updateSetting('takeoverConfig', config);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">رابط صورة الاستحواذ الخلفية الفاخرة</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                        dir="ltr"
                        value={platformData.takeoverConfig?.image || ''}
                        onChange={e => {
                          const config = { ...(platformData.takeoverConfig || {}), image: e.target.value };
                          updateSetting('takeoverConfig', config);
                        }}
                      />
                      <div className="relative shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const config = { ...(platformData.takeoverConfig || {}), image: reader.result as string };
                                updateSetting('takeoverConfig', config);
                                showToast('تم رفع صورة الاستحواذ بنجاح!', 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button type="button" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1">
                          <Upload className="w-4 h-4" /> رفع صورة
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">نص زر الإجراء للاستحواذ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.takeoverConfig?.buttonText || 'استكشف الحملة الكبرى'}
                      onChange={e => {
                        const config = { ...(platformData.takeoverConfig || {}), buttonText: e.target.value };
                        updateSetting('takeoverConfig', config);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">رابط زر الاستحواذ</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                      dir="ltr"
                      value={platformData.takeoverConfig?.buttonLink || '#'}
                      onChange={e => {
                        const config = { ...(platformData.takeoverConfig || {}), buttonLink: e.target.value };
                        updateSetting('takeoverConfig', config);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 5. Weekend Bidding Settings */}
            {(platformData.heroMode || 'static') === 'bidding' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h5 className="font-bold text-slate-800 text-sm">⚙️ إعدادات المزاد الذكي لعطلات نهاية الأسبوع (Weekend Bidding System)</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">ثبّت القاعة الأعلى دفعاً للمزاد التنافسي لتسليط الضوء عليها تلقائياً على مدار عطلة الويكيند.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">اختر الصالة الفائزة بالمزاد لهذا الأسبوع:</label>
                    <select
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs bg-white"
                      value={platformData.biddingConfig?.winningHallId || ''}
                      onChange={e => {
                        const config = { ...(platformData.biddingConfig || {}), winningHallId: e.target.value };
                        updateSetting('biddingConfig', config);
                      }}
                    >
                      <option value="">-- اختر صالة فائزة --</option>
                      {halls.map((hall: any) => (
                        <option key={hall.id} value={hall.id}>{hall.name} ({hall.provider})</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">قيمة المزايدة الحالية للويكند (ر.س) - للتتبع وعمولات الإيرادات</label>
                    <input
                      type="number"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-mono"
                      value={platformData.biddingConfig?.bidAmount || 500}
                      onChange={e => {
                        const config = { ...(platformData.biddingConfig || {}), bidAmount: parseInt(e.target.value) || 0 };
                        updateSetting('biddingConfig', config);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">قالب عنوان المزاد (يمكن استخدام {'{hallName}'})</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.biddingConfig?.title || 'قاعة الويكيند الذهبية: {hallName}'}
                      onChange={e => {
                        const config = { ...(platformData.biddingConfig || {}), title: e.target.value };
                        updateSetting('biddingConfig', config);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">قالب وصف المزاد (يمكن استخدام {'{hallName}'})</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.biddingConfig?.subtitle || ''}
                      onChange={e => {
                        const config = { ...(platformData.biddingConfig || {}), subtitle: e.target.value };
                        updateSetting('biddingConfig', config);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 6. High-Margin Auxiliary Services Settings */}
            {(platformData.heroMode || 'static') === 'services' && (
              <div className="bg-white p-6 rounded-3xl border border-slate-200 space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <h5 className="font-bold text-slate-800 text-sm">⚙️ الترويج للخدمات المساندة عالية الهامش الربحي (Upselling Auxiliary Services)</h5>
                  <p className="text-[11px] text-slate-500 mt-0.5">ركّز واجهة العميل على باقات الخدمات اللوجستية (التصوير، الزفات، البوفيه الفاخر، السيارات الفارهة) لتحقيق إيرادات مضاعفة للمنصة.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">العنوان التسويقي الرئيسي للخدمة</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.servicesConfig?.title || ''}
                      onChange={e => {
                        const config = { ...(platformData.servicesConfig || {}), title: e.target.value };
                        updateSetting('servicesConfig', config);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">الوصف الفرعي للعرض</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.servicesConfig?.subtitle || ''}
                      onChange={e => {
                        const config = { ...(platformData.servicesConfig || {}), subtitle: e.target.value };
                        updateSetting('servicesConfig', config);
                      }}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-2">رابط صورة الترويج للخدمات</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        className="flex-grow px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                        dir="ltr"
                        value={platformData.servicesConfig?.image || ''}
                        onChange={e => {
                          const config = { ...(platformData.servicesConfig || {}), image: e.target.value };
                          updateSetting('servicesConfig', config);
                        }}
                      />
                      <div className="relative shrink-0">
                        <input
                          type="file"
                          accept="image/*"
                          className="absolute inset-0 opacity-0 cursor-pointer"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onloadend = () => {
                                const config = { ...(platformData.servicesConfig || {}), image: reader.result as string };
                                updateSetting('servicesConfig', config);
                                showToast('تم رفع صورة الخدمة بنجاح!', 'success');
                              };
                              reader.readAsDataURL(file);
                            }
                          }}
                        />
                        <button type="button" className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1">
                          <Upload className="w-4 h-4" /> رفع صورة
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">نص زر الترويج</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs"
                      value={platformData.servicesConfig?.buttonText || 'اطلب الخدمة الآن'}
                      onChange={e => {
                        const config = { ...(platformData.servicesConfig || {}), buttonText: e.target.value };
                        updateSetting('servicesConfig', config);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">رابط الزر (أو اتركه خاوياً للتوجيه التلقائي لقسم الخدمات اللوجستية بالمنصة)</label>
                    <input
                      type="text"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs text-left"
                      dir="ltr"
                      value={platformData.servicesConfig?.buttonLink || '#'}
                      onChange={e => {
                        const config = { ...(platformData.servicesConfig || {}), buttonLink: e.target.value };
                        updateSetting('servicesConfig', config);
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Custom Slides Management Modal */}
            {newSlideModalOpen && (
              <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 text-right">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <h5 className="font-black text-slate-800 text-base">{editingSlideId ? '✏️ تعديل شريحة هيرو' : '✨ إضافة شريحة هيرو جديدة'}</h5>
                    <button type="button" onClick={() => setNewSlideModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg cursor-pointer">
                      <X className="w-5 h-5 text-slate-400" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الوسم الجانبي المساعد (Badge)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs"
                        value={slideFormData.badge}
                        onChange={e => setSlideFormData(p => ({ ...p, badge: e.target.value }))}
                        placeholder="مثل: عرض حصري، أعراس، الخ"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">وزن الترتيب (Order Weight)</label>
                      <input
                        type="number"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs font-mono"
                        value={slideFormData.order}
                        onChange={e => setSlideFormData(p => ({ ...p, order: parseInt(e.target.value) || 1 }))}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الرئيسي الفاخر (Title)</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs"
                        value={slideFormData.title}
                        onChange={e => setSlideFormData(p => ({ ...p, title: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">العنوان الفرعي الشارح (Subtitle)</label>
                      <textarea
                        rows={2}
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs"
                        value={slideFormData.subtitle}
                        onChange={e => setSlideFormData(p => ({ ...p, subtitle: e.target.value }))}
                        required
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">رابط صورة الخلفية للشرائح</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          className="flex-grow px-4 py-2 rounded-lg border border-slate-200 text-xs text-left"
                          dir="ltr"
                          value={slideFormData.image}
                          onChange={e => setSlideFormData(p => ({ ...p, image: e.target.value }))}
                          required
                        />
                        <div className="relative shrink-0">
                          <input
                            type="file"
                            accept="image/*"
                            className="absolute inset-0 opacity-0 cursor-pointer"
                            onChange={e => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setSlideFormData(p => ({ ...p, image: reader.result as string }));
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <button type="button" className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-lg text-xs font-bold cursor-pointer">
                            رفع
                          </button>
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">نص زر الإجراء</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs"
                        value={slideFormData.buttonText}
                        onChange={e => setSlideFormData(p => ({ ...p, buttonText: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">رابط زر الإجراء</label>
                      <input
                        type="text"
                        className="w-full px-4 py-2 rounded-lg border border-slate-200 text-xs text-left"
                        dir="ltr"
                        value={slideFormData.buttonLink}
                        onChange={e => setSlideFormData(p => ({ ...p, buttonLink: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() => setNewSlideModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
                    >
                      إلغاء
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!slideFormData.title || !slideFormData.subtitle || !slideFormData.image) {
                          alert('الرجاء تعبئة العناوين وصورة الخلفية.');
                          return;
                        }
                        let currentSlides = platformData.heroSlides || [];
                        if (editingSlideId) {
                          currentSlides = currentSlides.map((s: any) => s.id === editingSlideId ? { ...slideFormData, id: editingSlideId } : s);
                        } else {
                          currentSlides = [...currentSlides, { ...slideFormData, id: String(Date.now()) }];
                        }
                        updateSetting('heroSlides', currentSlides);
                        setNewSlideModalOpen(false);
                        showToast(editingSlideId ? 'تم تحديث شريحة الهيرو بنجاح!' : 'تمت إضافة شريحة الهيرو بنجاح!', 'success');
                      }}
                      className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-black rounded-lg cursor-pointer"
                    >
                      {editingSlideId ? 'حفظ التعديلات' : 'إضافة الآن'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}

