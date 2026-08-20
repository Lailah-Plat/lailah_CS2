import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, 
  Search, 
  Pencil, 
  Power, 
  Trash2, 
  Award, 
  Settings, 
  History, 
  Sparkles, 
  TrendingUp, 
  TrendingDown,
  Gift, 
  CheckCircle2, 
  CreditCard, 
  RefreshCw, 
  Star, 
  ArrowUpRight, 
  ArrowDownLeft,
  Users,
  Info
} from 'lucide-react';

export interface Customer {
  id: string | number;
  name: string;
  idNumber: string;
  expiryDate: string;
  phone: string;
  email: string;
  taxNumber?: string;
  iban?: string;
  region?: string;
  city?: string;
  nationalAddress?: string;
  extraAddress?: string;
  status: string;
  pledge?: boolean;
  approvalDate?: string;
  points?: number;
  image?: string;
  imagePreview?: string | null;
  isDbUser?: boolean;
  dbId?: number;
}

interface CustomersManagementProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  systemUsers: any[];
  setSystemUsers: React.Dispatch<React.SetStateAction<any[]>>;
  customersSearchQuery: string;
  setCustomersSearchQuery: (query: string) => void;
  customersFilterStatus: string;
  setCustomersFilterStatus: (status: string) => void;
  setIsCustomerModalOpen: (isOpen: boolean) => void;
  setCustomerForm: React.Dispatch<React.SetStateAction<any>>;
  setEditingItem: (item: any) => void;
  setDeleteData: React.Dispatch<React.SetStateAction<any>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  loyaltyCustomSettings?: any;
  setLoyaltyCustomSettings?: (settings: any) => void;
  mode?: 'users_only' | 'loyalty_only';
}

export const CustomersManagement: React.FC<CustomersManagementProps> = ({
  customers,
  setCustomers,
  systemUsers,
  setSystemUsers,
  customersSearchQuery,
  setCustomersSearchQuery,
  customersFilterStatus,
  setCustomersFilterStatus,
  setIsCustomerModalOpen,
  setCustomerForm,
  setEditingItem,
  setDeleteData,
  showNotification,
  loyaltyCustomSettings,
  setLoyaltyCustomSettings,
  mode,
}) => {
  // Sub-tabs state: 'directory' | 'dashboard' | 'transactions' | 'settings' | 'redis'
  const [activeTab, setActiveTab] = useState<'directory' | 'dashboard' | 'transactions' | 'settings' | 'redis'>(
    mode === 'loyalty_only' ? 'dashboard' : 'directory'
  );

  useEffect(() => {
    if (mode === 'users_only' && activeTab !== 'directory') {
      setActiveTab('directory');
    } else if (mode === 'loyalty_only' && activeTab === 'directory') {
      setActiveTab('dashboard');
    }
  }, [mode, activeTab]);

  // Redis monitor state
  const [redisStats, setRedisStats] = useState<any>(null);
  const [isLoadingRedis, setIsLoadingRedis] = useState(false);

  useEffect(() => {
    let interval: any;
    if (activeTab === 'redis') {
      const fetchStats = async () => {
        try {
          const res = await fetch('/api/users/redis/stats');
          const data = await res.json();
          if (data.success) {
            setRedisStats(data);
          }
        } catch (err) {
          console.error("Error fetching Redis stats:", err);
        }
      };

      fetchStats();
      interval = setInterval(fetchStats, 2000); // Fast interval for realtime monitor feel
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab]);

  const handleFlushRedis = async () => {
    setIsLoadingRedis(true);
    try {
      const res = await fetch('/api/users/redis/flush', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'تم مسح وتفريغ كاش Redis بالكامل بنجاح!');
        // Refresh immediately
        const resStats = await fetch('/api/users/redis/stats');
        const dataStats = await resStats.json();
        if (dataStats.success) {
          setRedisStats(dataStats);
        }
      }
    } catch (err) {
      console.error("Error flushing Redis:", err);
      showNotification('error', 'فشل تفريغ ذاكرة كاش Redis.');
    } finally {
      setIsLoadingRedis(false);
    }
  };

  // Parse custom settings or fallback to standard system values
  const currentSettings = useMemo(() => {
    return loyaltyCustomSettings || {
      pointsPerSAR: 1,
      pointValueSAR: 0.05,
      welcomeBonus: 50,
      referralBonus: 100,
      minRedeemPoints: 100,
      pointsExpiryDays: 365
    };
  }, [loyaltyCustomSettings]);

  // Combined active customers list
  const combinedCustomers = useMemo(() => {
    const dbCustomersMap = new Map<string, Customer>();
    
    // Static / state customers
    customers.forEach(c => {
      if (c.email) {
        const matchedDbUser = systemUsers.find(u => u.email && u.email.toLowerCase().trim() === c.email.toLowerCase().trim());
        const finalPoints = matchedDbUser ? (matchedDbUser.points !== undefined && matchedDbUser.points !== null ? matchedDbUser.points : c.points) : c.points;
        dbCustomersMap.set(c.email.toLowerCase(), {
          ...c,
          points: finalPoints
        });
      }
    });

    // Database customers
    systemUsers.filter(u => u.role === 'عميل' || u.role === 'Client').forEach((u, i) => {
      const emailLower = u.email ? u.email.toLowerCase() : '';
      if (emailLower && !dbCustomersMap.has(emailLower)) {
        dbCustomersMap.set(emailLower, {
          id: `db_${u.id}`,
          name: u.name,
          idNumber: u.idNumber || '10203040' + (50 + i), 
          expiryDate: '2028-12-30',
          phone: u.phone || '055xxxxxxx',
          email: u.email,
          taxNumber: '',
          iban: '',
          region: u.region || 'الرياض',
          city: u.city || 'الرياض',
          nationalAddress: 'غير محدد',
          extraAddress: '',
          status: u.status === 'نشط' ? 'مفعل' : 'موقوف',
          pledge: true,
          approvalDate: u.createdAt || new Date().toISOString(),
          points: (u.points !== undefined && u.points !== null) ? u.points : (currentSettings.welcomeBonus || 0),
          image: '',
          isDbUser: true,
          dbId: u.id
        });
      }
    });

    return Array.from(dbCustomersMap.values());
  }, [customers, systemUsers, currentSettings]);

  // Loyalty Transaction log (persisted in localStorage)
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<any[]>(() => {
    try {
      const stored = localStorage.getItem('LAYLAH_LOYALTY_TXS');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    
    // Initial realistic loyalty transaction logs conforming to YY serial formats (LOY-YY-XXXXXXXXXX)
    return [
      {
        id: 'LOY-26-0000000001',
        customerName: 'أحمد محمود العتيبي',
        customerEmail: 'ahmed.otaibi@example.com',
        type: 'earn',
        points: 250,
        equivalentSAR: 12.5,
        reason: 'مكافأة ترحيبية عند إنشاء الحساب',
        date: '2026-05-12T14:30:00Z',
        status: 'مكتمل'
      },
      {
        id: 'LOY-26-0000000002',
        customerName: 'سارة عبد الرحمن الشهري',
        customerEmail: 'sara.shehri@example.com',
        type: 'earn',
        points: 400,
        equivalentSAR: 20.0,
        reason: 'نقاط مكتسبة من حجز قاعة العرين للأفراح',
        date: '2026-06-02T18:15:00Z',
        status: 'مكتمل'
      },
      {
        id: 'LOY-26-0000000003',
        customerName: 'محمد فيصل الحربي',
        customerEmail: 'mohammad.harbi@example.com',
        type: 'redeem',
        points: -100,
        equivalentSAR: -5.00,
        reason: 'استبدال نقاط كخصم مباشر على حجز باقة الموردين المساندة',
        date: '2026-06-18T11:00:00Z',
        status: 'مكتمل'
      },
      {
        id: 'LOY-26-0000000004',
        customerName: 'خالد عبدالله السديري',
        customerEmail: 'khaled.sudairy@example.com',
        type: 'earn',
        points: 120,
        equivalentSAR: 6.0,
        reason: 'مكافأة نظام الإحالة ودعوة صديق للانضمام',
        date: '2026-07-01T09:45:00Z',
        status: 'مكتمل'
      },
      {
        id: 'LOY-26-0000000005',
        customerName: 'هند محمد القحطاني',
        customerEmail: 'hind.qahtani@example.com',
        type: 'earn',
        points: 50,
        equivalentSAR: 2.5,
        reason: 'مكافأة كتابة تقييم ومراجعة تفصيلية لقاعة الأوركيد',
        date: '2026-07-10T20:20:00Z',
        status: 'مكتمل'
      }
    ];
  });

  // Save transactions to localStorage
  useEffect(() => {
    localStorage.setItem('LAYLAH_LOYALTY_TXS', JSON.stringify(loyaltyTransactions));
  }, [loyaltyTransactions]);

  // Card simulator selected customer state
  const [selectedCustomerIdForCard, setSelectedCustomerIdForCard] = useState<string | number>('');
  
  // Set default selected customer for card simulator
  useEffect(() => {
    if (combinedCustomers.length > 0 && !selectedCustomerIdForCard) {
      setSelectedCustomerIdForCard(combinedCustomers[0].id);
    }
  }, [combinedCustomers, selectedCustomerIdForCard]);

  // Selected customer object for membership card
  const selectedCustomerObj = useMemo(() => {
    return combinedCustomers.find(c => c.id === selectedCustomerIdForCard) || combinedCustomers[0];
  }, [combinedCustomers, selectedCustomerIdForCard]);

  // Manual point adjustments form state
  const [manualPointsForm, setManualPointsForm] = useState({
    customerId: '',
    points: 100,
    actionType: 'add' as 'add' | 'deduct',
    presetReason: 'تسوية يدوية للرصيد',
    customReason: ''
  });

  // Settings form state
  const [settingsForm, setSettingsForm] = useState({
    pointsPerSAR: currentSettings.pointsPerSAR,
    pointValueSAR: currentSettings.pointValueSAR,
    welcomeBonus: currentSettings.welcomeBonus,
    referralBonus: currentSettings.referralBonus,
    minRedeemPoints: currentSettings.minRedeemPoints,
    pointsExpiryDays: currentSettings.pointsExpiryDays
  });

  // Sync settings form with outer state if it updates
  useEffect(() => {
    setSettingsForm({
      pointsPerSAR: currentSettings.pointsPerSAR,
      pointValueSAR: currentSettings.pointValueSAR,
      welcomeBonus: currentSettings.welcomeBonus,
      referralBonus: currentSettings.referralBonus,
      minRedeemPoints: currentSettings.minRedeemPoints,
      pointsExpiryDays: currentSettings.pointsExpiryDays
    });
  }, [currentSettings]);

  // Directory filter & search
  const filteredCustomers = useMemo(() => {
    return combinedCustomers.filter(c => {
      const matchSearch = (c.name || '').includes(customersSearchQuery) || 
                          (c.idNumber || '').includes(customersSearchQuery) || 
                          (c.phone || '').includes(customersSearchQuery);
      const matchStatus = customersFilterStatus ? c.status === customersFilterStatus : true;
      return matchSearch && matchStatus;
    });
  }, [combinedCustomers, customersSearchQuery, customersFilterStatus]);

  // Loyalty calculations for dashboard
  const loyaltyKPIs = useMemo(() => {
    const totalPoints = combinedCustomers.reduce((sum, c) => sum + (c.points || 0), 0);
    const totalSARVal = totalPoints * currentSettings.pointValueSAR;
    const avgPoints = combinedCustomers.length > 0 ? Math.round(totalPoints / combinedCustomers.length) : 0;
    
    // Find top customer
    let topCustomerName = 'لا يوجد';
    let maxPts = -1;
    combinedCustomers.forEach(c => {
      if ((c.points || 0) > maxPts) {
        maxPts = c.points || 0;
        topCustomerName = c.name;
      }
    });

    // Counts of membership tiers
    let silverCount = 0;
    let goldCount = 0;
    let platinumCount = 0;
    combinedCustomers.forEach(c => {
      const pts = c.points || 0;
      if (pts >= 1500) platinumCount++;
      else if (pts >= 500) goldCount++;
      else silverCount++;
    });

    return {
      totalPoints,
      totalSARVal,
      avgPoints,
      topCustomerName,
      topCustomerPoints: maxPts > -1 ? maxPts : 0,
      silverCount,
      goldCount,
      platinumCount
    };
  }, [combinedCustomers, currentSettings]);

  // Handle manual points submission
  const handleManualPointsSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetCustId = manualPointsForm.customerId || selectedCustomerIdForCard;
    if (!targetCustId) {
      showNotification('error', 'الرجاء اختيار العميل أولاً.');
      return;
    }

    const customerObj = combinedCustomers.find(c => c.id === targetCustId);
    if (!customerObj) {
      showNotification('error', 'العميل المختار غير موجود.');
      return;
    }

    const pointsAmount = Math.abs(manualPointsForm.points);
    const finalPointsDiff = manualPointsForm.actionType === 'add' ? pointsAmount : -pointsAmount;
    const currentPoints = customerObj.points || 0;

    if (manualPointsForm.actionType === 'deduct' && currentPoints < pointsAmount) {
      showNotification('error', `لا يمكن خصم نقاط أكثر من رصيد العميل الحالي (${currentPoints} نقطة).`);
      return;
    }

    // Determine final reason
    const finalReason = manualPointsForm.presetReason === 'أخرى' 
      ? (manualPointsForm.customReason || 'تعديل رصيد يدوي مخصص') 
      : manualPointsForm.presetReason;

    // Upate points inside appropriate state
    if (customerObj.isDbUser) {
      const newPoints = (customerObj.points || 0) + finalPointsDiff;
      // Persist to backend database (which also invalidates the Redis cache key!)
      fetch(`/api/users/${customerObj.dbId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ points: newPoints })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          // Snappily re-fetch users to keep everything perfectly synchronized
          fetch('/api/users')
            .then(r => r.json())
            .then(uData => {
              if (uData.success) {
                setSystemUsers(uData.verified || []);
              }
            })
            .catch(err => console.error("Error syncing users after points update:", err));
        }
      })
      .catch(err => {
        console.error("Error persisting user points:", err);
      });

      // Database User: Update systemUsers state instantly for optimistic UI rendering
      const updatedUsers = systemUsers.map(u => {
        if (u.id === customerObj.dbId) {
          return { ...u, points: newPoints };
        }
        return u;
      });
      setSystemUsers(updatedUsers);
    } else {
      // Static customer: Update customers state
      const updatedCustomers = customers.map(cust => {
        if (cust.id === customerObj.id) {
          return { ...cust, points: (cust.points || 0) + finalPointsDiff };
        }
        return cust;
      });
      setCustomers(updatedCustomers);
    }

    // Add record to the Transaction ledger following sequential formatting rules
    const yearSuffix = new Date().getFullYear().toString().slice(-2);
    const nextSeqNum = String(loyaltyTransactions.length + 1).padStart(10, '0');
    const newTxId = `LOY-${yearSuffix}-${nextSeqNum}`;

    const newTx = {
      id: newTxId,
      customerName: customerObj.name,
      customerEmail: customerObj.email,
      type: manualPointsForm.actionType === 'add' ? 'earn' : 'redeem',
      points: finalPointsDiff,
      equivalentSAR: finalPointsDiff * currentSettings.pointValueSAR,
      reason: finalReason,
      date: new Date().toISOString(),
      status: 'مكتمل'
    };

    setLoyaltyTransactions([newTx, ...loyaltyTransactions]);
    showNotification('success', `تم ${manualPointsForm.actionType === 'add' ? 'منح' : 'خصم'} ${pointsAmount} نقطة للعميل ${customerObj.name} بنجاح.`);
    
    // Reset manual form points & reasons
    setManualPointsForm(prev => ({
      ...prev,
      points: 100,
      customReason: ''
    }));
  };

  // Handle saving the core settings rules
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    if (setLoyaltyCustomSettings) {
      setLoyaltyCustomSettings({
        pointsPerSAR: Number(settingsForm.pointsPerSAR),
        pointValueSAR: Number(settingsForm.pointValueSAR),
        welcomeBonus: Number(settingsForm.welcomeBonus),
        referralBonus: Number(settingsForm.referralBonus),
        minRedeemPoints: Number(settingsForm.minRedeemPoints),
        pointsExpiryDays: Number(settingsForm.pointsExpiryDays)
      });
      showNotification('success', 'تم حفظ وتحديث قواعد برنامج الولاء الموحد بنجاح ومزامنتها.');
    } else {
      showNotification('error', 'محرك المزامنة الخارجي غير متوفر حالياً.');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Page Title & Main Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Award className="w-7 h-7 text-amber-500" />
            {mode === 'users_only' ? 'إدارة حسابات العملاء' : 'مركز إدارة علاقات العملاء والولاء (CRM)'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {mode === 'users_only' 
              ? 'إدارة الحسابات النشطة للعملاء (إضافة، تعديل، حظر، حذف، وعرض التفاصيل).' 
              : 'متابعة حسابات العملاء، سجل الحجوزات، التحقق من الهويات، ونقاط ومستويات الولاء'}
          </p>
        </div>
        
        {/* Sub Navigation Horizontal Tabs */}
        {mode !== 'users_only' && (
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/50">
            {mode !== 'loyalty_only' && (
              <button 
                onClick={() => setActiveTab('directory')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'directory' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <Users className="w-4 h-4" />
                دليل العملاء
              </button>
            )}
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'dashboard' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Sparkles className="w-4 h-4 text-amber-500" />
              لوحة الولاء والبطاقات
            </button>
            <button 
              onClick={() => setActiveTab('transactions')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'transactions' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <History className="w-4 h-4" />
              سجل العمليات
            </button>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'settings' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              <Settings className="w-4 h-4" />
              قواعد النقاط
            </button>
            {mode !== 'loyalty_only' && (
              <button 
                onClick={() => setActiveTab('redis')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${activeTab === 'redis' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
              >
                <RefreshCw className={`w-4 h-4 ${activeTab === 'redis' ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
                مراقب الـ Redis والفهرسة
              </button>
            )}
          </div>
        )}
      </div>

      {/* RENDER SECTION 1: Customer Directory */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-black text-slate-800">قائمة وبيانات المشتركين والعملاء</h3>
            <button 
              onClick={() => { 
                setEditingItem(null); 
                setCustomerForm({ 
                  name: '', idNumber: '', expiryDate: '', phone: '', email: '', 
                  taxNumber: '', iban: '', region: '', city: '', nationalAddress: '', extraAddress: '', 
                  status: 'مفعل', pledge: false, points: 0, imageFile: null, imagePreview: null, 
                  password: '', confirmPassword: '' 
                }); 
                setIsCustomerModalOpen(true); 
              }}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md shadow-amber-500/10 transition-all hover:scale-102 cursor-pointer text-xs"
            >
              <Plus className="w-4 h-4" /> إضافة عميل جديد
            </button>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col gap-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="بحث بالاسم، الهوية/السجل، أو رقم الجوال..." 
                  className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-xs" 
                  value={customersSearchQuery} 
                  onChange={e => setCustomersSearchQuery(e.target.value)} 
                />
              </div>
              <select 
                className="p-3 rounded-xl border border-slate-200 bg-white min-w-[180px] outline-none text-xs" 
                value={customersFilterStatus || ''} 
                onChange={e => setCustomersFilterStatus(e.target.value)}
              >
                <option value="">جميع الحالات</option>
                <option value="مفعل">نشط / مفعل</option>
                <option value="موقوف">موقوف</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">الاسم</th>
                    <th className="px-6 py-4">الهوية / السجل</th>
                    <th className="px-6 py-4">الجوال</th>
                    <th className="px-6 py-4">البريد الإلكتروني</th>
                    <th className="px-6 py-4">مستوى العضوية</th>
                    <th className="px-6 py-4">نقاط الولاء</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">لا توجد بيانات عملاء مطابقة للبحث حالياً</td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => {
                      const pts = c.points || 0;
                      let levelText = 'فضية';
                      let levelColor = 'bg-slate-100 text-slate-700 border-slate-200';
                      if (pts >= 1500) {
                        levelText = 'بلاتينية VIP';
                        levelColor = 'bg-indigo-50 text-indigo-700 border-indigo-200 font-bold';
                      } else if (pts >= 500) {
                        levelText = 'ذهبية';
                        levelColor = 'bg-amber-50 text-amber-700 border-amber-200 font-bold';
                      }

                      return (
                        <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800">
                            <div className="flex items-center gap-3">
                              {c.image || (c as any).avatarUrl || (c as any).avatar || (c as any).imagePreview ? (
                                <img 
                                  src={c.image || (c as any).avatarUrl || (c as any).avatar || (c as any).imagePreview} 
                                  alt={c.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-9 h-9 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center font-bold text-xs shrink-0 select-none">
                                  {(() => {
                                    const parts = (c.name || '').trim().split(/\s+/).filter(Boolean);
                                    if (parts.length >= 2) {
                                      return (parts[0].charAt(0) + parts[1].charAt(0));
                                    }
                                    return parts[0] ? parts[0].charAt(0) : '';
                                  })()}
                                </div>
                              )}
                              <span>{c.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 font-mono text-xs">{c.idNumber}</td>
                          <td className="px-6 py-4 font-mono text-xs">{c.phone}</td>
                          <td className="px-6 py-4 font-mono text-xs">{c.email}</td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] border ${levelColor}`}>
                              🏆 {levelText}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-full font-bold font-mono text-xs">
                              ⭐ {pts} نقطة
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${(c.status as string) === 'مفعل' || (c.status as string) === 'نشط' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-center gap-1.5">
                              {mode !== 'users_only' && (
                                <button 
                                  onClick={() => {
                                    setSelectedCustomerIdForCard(c.id);
                                    setActiveTab('dashboard');
                                  }}
                                  className="text-amber-600 hover:text-amber-800 p-1.5 bg-amber-50 hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                                  title="عرض بطاقة الولاء والتحكم السريع بنقاط العميل"
                                >
                                  <Sparkles className="w-4 h-4" />
                                </button>
                              )}
                              <button 
                                onClick={() => {
                                  setEditingItem(c);
                                  setCustomerForm({
                                    ...c,
                                    password: '',
                                    confirmPassword: '',
                                    imageFile: null,
                                    imagePreview: c.image || null
                                  });
                                  setIsCustomerModalOpen(true);
                                }}
                                className="text-blue-600 hover:text-blue-800 p-1.5 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors" 
                                title="تعديل ملف العميل"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={async () => {
                                  const currentStatus = c.status as string;
                                  const newStatus = currentStatus === 'مفعل' || currentStatus === 'نشط' ? 'موقوف' : 'نشط';
                                  if (c.isDbUser) {
                                    try {
                                      const res = await fetch(`/api/users/${c.dbId}`, {
                                        method: 'PUT',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ status: newStatus === 'نشط' ? 'نشط' : 'موقوف' })
                                      });
                                      const d = await res.json();
                                      if (d.success) {
                                        showNotification('success', 'تم تعديل حالة العميل بنجاح.');
                                        // reload list
                                        const resUsers = await fetch('/api/users');
                                        const uData = await resUsers.json();
                                        if (uData.success) {
                                          setSystemUsers(uData.verified || []);
                                        }
                                      }
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  } else {
                                    setCustomers(customers.map(cust => cust.id === c.id ? {...cust, status: newStatus as any} : cust));
                                    showNotification('success', 'تم تعديل حالة العميل بنجاح محلياً.');
                                  }
                                }}
                                className={`p-1.5 rounded-lg cursor-pointer transition-colors ${(c.status as string) === 'مفعل' || (c.status as string) === 'نشط' ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-green-500 bg-green-50 hover:bg-green-100'}`}
                                title={(c.status as string) === 'مفعل' || (c.status as string) === 'نشط' ? 'إيقاف حساب العميل' : 'تفعيل حساب العميل'}
                              >
                                <Power className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => {
                                  if (c.isDbUser) {
                                    setDeleteData({
                                      id: c.dbId,
                                      type: 'platform_users',
                                      name: c.name,
                                      isPending: false
                                    } as any);
                                  } else {
                                    setDeleteData({ id: c.id, type: 'customers', name: c.name });
                                  }
                                }}
                                className="text-red-600 hover:text-red-800 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors" 
                                title="حذف العميل"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER SECTION 2: Loyalty Dashboard & membership card simulator */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          
          {/* Dashboard KPIs Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-amber-500"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-1">إجمالي النقاط النشطة</p>
                  <h3 className="text-2xl font-black text-slate-800 font-mono">{loyaltyKPIs.totalPoints.toLocaleString()} <span className="text-xs text-slate-500 font-normal">نقطة</span></h3>
                </div>
                <div className="p-2.5 bg-amber-50 rounded-xl">
                  <Star className="w-5 h-5 text-amber-500" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">موزعة لجميع عملاء المنصة النشطين</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-emerald-500"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-1">القيمة النقدية المقابلة</p>
                  <h3 className="text-2xl font-black text-slate-800 font-mono">{loyaltyKPIs.totalSARVal.toFixed(2)} <span className="text-xs text-slate-500 font-normal">ر.س</span></h3>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl">
                  <TrendingUp className="w-5 h-5 text-emerald-500" />
                </div>
              </div>
              <p className="text-[10px] text-emerald-600 font-bold">بمعدل {currentSettings.pointValueSAR} ر.س لكل نقطة مستبدلة</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-indigo-500"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-1">متوسط رصيد العميل</p>
                  <h3 className="text-2xl font-black text-slate-800 font-mono">{loyaltyKPIs.avgPoints} <span className="text-xs text-slate-500 font-normal">نقطة</span></h3>
                </div>
                <div className="p-2.5 bg-indigo-50 rounded-xl">
                  <Users className="w-5 h-5 text-indigo-500" />
                </div>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">لكل عميل مسجل بنظام الولاء المكامل</p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-1 rounded-r-2xl h-full bg-purple-500"></div>
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-slate-500 text-xs font-semibold mb-1">نخبة العملاء (Platinum/Gold)</p>
                  <h3 className="text-2xl font-black text-slate-800 font-mono">{loyaltyKPIs.platinumCount + loyaltyKPIs.goldCount} <span className="text-xs text-slate-500 font-normal">عميل مميز</span></h3>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl">
                  <Award className="w-5 h-5 text-purple-500" />
                </div>
              </div>
              <p className="text-[10px] text-purple-600 font-bold">{loyaltyKPIs.platinumCount} بلاتيني و {loyaltyKPIs.goldCount} ذهبي</p>
            </div>

          </div>

          {/* Interactive Simulator and Actions Forms */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left: Card Simulator Panel (7/12 cols) */}
            <div className="lg:col-span-7 bg-slate-900 rounded-3xl p-6 text-white border border-slate-850 shadow-xl flex flex-col justify-between min-h-[460px] relative overflow-hidden">
              
              {/* Star Background accents */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full filter blur-3xl -z-10"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/5 rounded-full filter blur-3xl -z-10"></div>

              {/* Selector on top */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4 z-10">
                <div>
                  <h4 className="font-black text-base text-amber-400 flex items-center gap-1.5">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    محاكي بطاقة العضوية الرقمية (VIP)
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">شاهد كيف تظهر بطاقة الولاء والمستوى للعميل في واجهته الشخصية.</p>
                </div>
                
                <select 
                  className="bg-slate-800 text-white border border-slate-700 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-400 font-semibold"
                  value={selectedCustomerIdForCard}
                  onChange={(e) => setSelectedCustomerIdForCard(e.target.value)}
                >
                  {combinedCustomers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (⭐ {c.points || 0} ن)</option>
                  ))}
                </select>
              </div>

              {/* Actual loyalty card mockup preview */}
              {selectedCustomerObj ? (
                <div className="my-6 flex flex-col gap-6">
                  {/* The Physical Card mockup container */}
                  {(() => {
                    const pts = selectedCustomerObj.points || 0;
                    let cardBg = 'from-slate-800 via-slate-700 to-slate-900 border-slate-600/50 shadow-slate-950/45';
                    let levelName = 'العضوية الفضية';
                    let badgeBg = 'bg-slate-500/20 text-slate-300 border-slate-500/30';
                    let starColor = 'text-slate-400';
                    let nextLimit = 500;
                    let nextLevel = 'العضوية الذهبية';

                    if (pts >= 1500) {
                      cardBg = 'from-indigo-950 via-slate-900 to-slate-950 border-indigo-500/30 shadow-indigo-950/30';
                      levelName = 'العضوية البلاتينية VIP';
                      badgeBg = 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 font-black animate-pulse';
                      starColor = 'text-indigo-400';
                      nextLimit = 1500;
                      nextLevel = 'نخبة بلاتينيوم VIP';
                    } else if (pts >= 500) {
                      cardBg = 'from-amber-950 via-slate-900 to-amber-950 border-amber-500/30 shadow-amber-950/20';
                      levelName = 'العضوية الذهبية الفاخرة';
                      badgeBg = 'bg-amber-500/20 text-amber-300 border-amber-500/30 font-bold';
                      starColor = 'text-amber-400';
                      nextLimit = 1500;
                      nextLevel = 'العضوية البلاتينية VIP';
                    }

                    const progressPercentage = Math.min((pts / nextLimit) * 100, 100);

                    return (
                      <div className="space-y-6">
                        {/* Dynamic Premium VIP Card */}
                        <div className={`w-full bg-gradient-to-br ${cardBg} border p-6 rounded-2xl shadow-xl relative overflow-hidden transition-all duration-500 hover:scale-[1.02]`}>
                          
                          {/* Card chip & contactless logo */}
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-7 bg-gradient-to-r from-amber-400 to-amber-500/75 rounded-md border border-amber-300/40 relative overflow-hidden">
                                <div className="absolute inset-0 grid grid-cols-3 divide-x divide-slate-900/10 divide-y divide-slate-900/10 opacity-70">
                                  <div></div><div></div><div></div><div></div><div></div><div></div>
                                </div>
                              </div>
                              <span className="text-[10px] font-black tracking-widest text-white/60">LAYLAH CLUB</span>
                            </div>
                            <span className={`text-[10px] px-3 py-1 rounded-full border ${badgeBg}`}>
                              🏆 {levelName}
                            </span>
                          </div>

                          {/* Customer info & points */}
                          <div className="flex justify-between items-end mt-8">
                            <div className="space-y-1">
                              <p className="text-[9px] text-white/50 uppercase tracking-wider">اسم حامل البطاقة</p>
                              <h5 className="font-bold text-base tracking-wide text-white">{selectedCustomerObj.name}</h5>
                              <p className="font-mono text-xs text-white/40 mt-1">LOY-{new Date().getFullYear().toString().slice(-2)}-{String(selectedCustomerObj.idNumber).slice(0, 8)}</p>
                            </div>
                            
                            <div className="text-left">
                              <p className="text-[9px] text-white/50 text-left">الرصيد النشط</p>
                              <div className="flex items-center gap-1.5 text-amber-400 font-black text-2xl font-mono mt-0.5">
                                <Star className={`w-5 h-5 fill-current ${starColor}`} />
                                {pts} <span className="text-xs text-white/60 font-medium">نقطة</span>
                              </div>
                            </div>
                          </div>

                          {/* Card decorative line pattern and Barcode */}
                          <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4">
                            <div className="flex flex-col gap-1">
                              <p className="text-[8px] text-white/40">القيمة المالية المعادلة</p>
                              <span className="text-xs font-bold text-emerald-400 font-mono">{(pts * currentSettings.pointValueSAR).toFixed(2)} ر.س</span>
                            </div>
                            
                            {/* Barcode representation */}
                            <div className="bg-white/95 p-1 rounded-md flex flex-col items-center">
                              <div className="flex items-center h-5 w-24 gap-[1px]">
                                {[1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 4, 1, 2, 3, 1, 1].map((w, index) => (
                                  <div key={index} className="bg-slate-900 h-full" style={{ width: `${w}px` }}></div>
                                ))}
                              </div>
                            </div>
                          </div>

                        </div>

                        {/* Tier Progression Bar */}
                        <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700">
                          <div className="flex justify-between items-center text-xs mb-2">
                            <span className="text-slate-400 font-medium">المستوى والترقية</span>
                            {pts >= 1500 ? (
                              <span className="text-indigo-400 font-bold">وصلت لأعلى عضوية بلاتينية ممتازة!</span>
                            ) : (
                              <span className="text-slate-300 font-medium">
                                متبقي <strong className="text-amber-400 font-mono">{nextLimit - pts} نقطة</strong> للترقية إلى <strong>{nextLevel}</strong>
                              </span>
                            )}
                          </div>
                          
                          <div className="w-full bg-slate-700 h-2.5 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-amber-500 to-amber-300 transition-all duration-1000" 
                              style={{ width: `${progressPercentage}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between text-[9px] text-slate-500 mt-2 font-mono">
                            <span>0 ن</span>
                            <span>{nextLimit} ن</span>
                          </div>
                        </div>

                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="my-12 text-center text-slate-400">الرجاء اختيار عميل لعرض المحاكي</div>
              )}

              {/* Bottom stats tip */}
              <div className="bg-slate-800/50 p-3 rounded-xl flex items-start gap-2 border border-slate-700/50">
                <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <p className="text-[10px] text-slate-300 leading-relaxed">
                  يتم احتساب مستويات العضويات ديناميكياً بناءً على إجمالي نقاط العميل: 
                  <strong> الفضية (0-499) </strong>، 
                  <strong> الذهبية (500-1499) </strong>، 
                  <strong> والبلاتينية (1500+) </strong>. يحصل أعضاء الفئات الأعلى على عروض تسويقية حصرية وخصومات تلقائية.
                </p>
              </div>

            </div>

            {/* Right: Quick Manual Point Award Form (5/12 cols) */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col justify-between min-h-[460px]">
              <div>
                <div className="border-b border-slate-100 pb-3 mb-4">
                  <h4 className="font-black text-slate-800 flex items-center gap-1.5 text-sm">
                    <Gift className="w-5 h-5 text-emerald-500" />
                    إجراء حركة يدوية للمكافآت
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">منح نقاط ترويجية أو تسوية أو خصم نقاط يدوياً لعميل معين.</p>
                </div>

                <form onSubmit={handleManualPointsSubmit} className="space-y-4 text-xs text-slate-700">
                  
                  {/* Select Customer */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">العميل المستهدف</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white"
                      value={manualPointsForm.customerId}
                      onChange={(e) => setManualPointsForm({...manualPointsForm, customerId: e.target.value})}
                      required
                    >
                      <option value="">-- اختر عميل من القائمة --</option>
                      {combinedCustomers.map(c => (
                        <option key={c.id} value={c.id}>{c.name} (الهوية: {c.idNumber})</option>
                      ))}
                    </select>
                  </div>

                  {/* Transaction Type */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">نوع الحركة</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setManualPointsForm({...manualPointsForm, actionType: 'add'})}
                        className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${manualPointsForm.actionType === 'add' ? 'border-emerald-500 bg-emerald-50 text-emerald-800' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        منح وإيداع نقاط
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => setManualPointsForm({...manualPointsForm, actionType: 'deduct'})}
                        className={`p-3 rounded-xl border text-center font-bold flex items-center justify-center gap-1 cursor-pointer transition-all ${manualPointsForm.actionType === 'deduct' ? 'border-rose-500 bg-rose-50 text-rose-800' : 'border-slate-200 hover:bg-slate-50'}`}
                      >
                        <ArrowDownLeft className="w-4 h-4" />
                        خصم واسترداد نقاط
                      </button>
                    </div>
                  </div>

                  {/* Points amount */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">عدد النقاط</label>
                    <input 
                      type="number" 
                      min={1}
                      max={10000}
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono text-xs"
                      value={manualPointsForm.points}
                      onChange={(e) => setManualPointsForm({...manualPointsForm, points: Number(e.target.value)})}
                      required
                    />
                  </div>

                  {/* Predefined Reasons */}
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">سبب أو بيان العملية</label>
                    <select 
                      className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-white"
                      value={manualPointsForm.presetReason}
                      onChange={(e) => setManualPointsForm({...manualPointsForm, presetReason: e.target.value})}
                      required
                    >
                      <option value="هدية ترحيبية بالمنصة">هدية ترحيبية بالمنصة</option>
                      <option value="مكافأة كتابة تقييم لقاعة أو خدمة">مكافأة كتابة تقييم لقاعة أو خدمة</option>
                      <option value="تعويض عن إلغاء حجز أو خدمة مساندة">تعويض عن إلغاء حجز أو خدمة مساندة</option>
                      <option value="مكافأة نظام الإحالة ودعوة الأصدقاء">مكافأة نظام الإحالة ودعوة الأصدقاء</option>
                      <option value="مكافأة المشاركة في الاستبيان السنوي">مكافأة المشاركة في الاستبيان السنوي</option>
                      <option value="تسوية يدوية للرصيد">تسوية يدوية للرصيد</option>
                      <option value="أخرى">أخرى (أدخل السبب أدناه)</option>
                    </select>
                  </div>

                  {/* Custom Reason Text Input (only show if presetReason is 'أخرى') */}
                  {manualPointsForm.presetReason === 'أخرى' && (
                    <div className="animate-in slide-in-from-top-2 duration-200">
                      <label className="block font-bold text-slate-700 mb-1">السبب المخصص بالتفصيل</label>
                      <input 
                        type="text" 
                        placeholder="أدخل سبب منح أو خصم النقاط بالتفصيل..."
                        className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                        value={manualPointsForm.customReason}
                        onChange={(e) => setManualPointsForm({...manualPointsForm, customReason: e.target.value})}
                        required
                      />
                    </div>
                  )}

                  {/* Calculation Preview info */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">القيمة المالية المقدرة للحركة:</span>
                    <strong className={manualPointsForm.actionType === 'add' ? 'text-emerald-600 font-mono' : 'text-rose-600 font-mono'}>
                      {manualPointsForm.actionType === 'add' ? '+' : '-'}
                      {(manualPointsForm.points * currentSettings.pointValueSAR).toFixed(2)} ر.س
                    </strong>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 px-4 rounded-xl font-bold bg-amber-500 hover:bg-amber-600 text-slate-950 transition-all hover:scale-102 cursor-pointer shadow-md shadow-amber-500/10 flex items-center justify-center gap-1 text-xs"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    تنفيذ الحركة وتحديث المحفظة
                  </button>

                </form>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* RENDER SECTION 3: Transaction logs */}
      {activeTab === 'transactions' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-black text-slate-800">سجل المعاملات وعمليات ترحيل النقاط</h3>
              <p className="text-xs text-slate-400 mt-0.5">تفاصيل العمليات المكتملة لبرنامج الولاء الموحد.</p>
            </div>
            
            {/* Action tool */}
            <button 
              onClick={() => {
                const csvData = loyaltyTransactions.map(tx => `${tx.id},${tx.customerName},${tx.type === 'earn' ? 'كسب' : 'استرداد'},${tx.points},${tx.reason},${tx.date}`).join('\n');
                const blob = new Blob([`\ufeffID,العميل,النوع,النقاط,البيان,التاريخ\n${csvData}`], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement("a");
                link.setAttribute("href", url);
                link.setAttribute("download", `loyalty-transactions-${new Date().toISOString().slice(0,10)}.csv`);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                showNotification('success', 'تم تصدير سجل الولاء بتنسيق CSV بنجاح.');
              }}
              className="px-4 py-2 text-xs font-bold border border-slate-200 hover:bg-slate-50 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer text-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              تصدير سجل المعاملات (CSV)
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-500 font-bold text-xs border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-4">رقم الحركة التسلسلي</th>
                    <th className="px-6 py-4">العميل</th>
                    <th className="px-6 py-4">النوع</th>
                    <th className="px-6 py-4">النقاط</th>
                    <th className="px-6 py-4">القيمة بالريال</th>
                    <th className="px-6 py-4">بيان العملية / السبب</th>
                    <th className="px-6 py-4">التاريخ والوقت</th>
                    <th className="px-6 py-4">حالة القيد</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700 text-xs">
                  {loyaltyTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">لا يوجد أي حركات مسجلة حالياً</td>
                    </tr>
                  ) : (
                    loyaltyTransactions.map((tx) => (
                      <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 font-mono font-bold text-slate-900">{tx.id}</td>
                        <td className="px-6 py-4 font-semibold text-slate-800">
                          <div>
                            <p className="font-semibold">{tx.customerName}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tx.type === 'earn' ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-800 rounded-full font-bold">
                              <ArrowUpRight className="w-3.5 h-3.5" />
                              منح / كسب
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 text-rose-800 rounded-full font-bold">
                              <ArrowDownLeft className="w-3.5 h-3.5" />
                              استهلاك / خصم
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold">
                          <span className={tx.points > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {tx.points > 0 ? `+${tx.points}` : tx.points}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-slate-600">
                          {tx.equivalentSAR > 0 ? `+${tx.equivalentSAR.toFixed(2)}` : tx.equivalentSAR.toFixed(2)} ر.س
                        </td>
                        <td className="px-6 py-4 text-slate-600 max-w-xs truncate" title={tx.reason}>{tx.reason}</td>
                        <td className="px-6 py-4 font-mono text-slate-400">{new Date(tx.date).toLocaleString('ar-SA')}</td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            {tx.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* RENDER SECTION 4: Loyalty settings configuration */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-black text-slate-800">إعدادات وقواعد برنامج الولاء المكامل</h3>
            <p className="text-xs text-slate-400 mt-0.5">اضبط معدلات حساب النقاط، القيم النقدية، حوافز التسجيل، وفترة الصلاحية للعملاء.</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
            <form onSubmit={handleSaveSettings} className="space-y-6 text-xs text-slate-700">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Points earned per SAR */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-amber-500" />
                    <label className="font-bold text-slate-800 text-sm">معدل كسب النقاط (لكل 1 ريال)</label>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">حدد عدد النقاط التي يكتسبها العميل مقابل كل ريال سعودي يتم إنفاقه في حجز القاعات أو الخدمات المساندة.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      type="number" 
                      className="w-24 p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono text-sm"
                      value={settingsForm.pointsPerSAR}
                      onChange={(e) => setSettingsForm({...settingsForm, pointsPerSAR: Number(e.target.value)})}
                      required
                    />
                    <span className="font-bold text-slate-600">نقاط مقابل كل ريال</span>
                  </div>
                </div>

                {/* Point monetary value */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                    <label className="font-bold text-slate-800 text-sm">القيمة المالية للنقطة بالريال</label>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">القيمة المالية بالريال لكل نقطة ولاء نشطة عند رغبة العميل في استبدال نقاطه للحصول على خصومات على حجوزاته.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      type="number" 
                      step="0.001"
                      className="w-24 p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono text-sm"
                      value={settingsForm.pointValueSAR}
                      onChange={(e) => setSettingsForm({...settingsForm, pointValueSAR: Number(e.target.value)})}
                      required
                    />
                    <span className="font-bold text-slate-600">ريال سعودي لكل نقطة مستبدلة</span>
                  </div>
                </div>

                {/* Welcome Bonus */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Gift className="w-5 h-5 text-indigo-500" />
                    <label className="font-bold text-slate-800 text-sm">مكافأة الترحيب عند الانضمام</label>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">النقاط المجانية الممنوحة تلقائياً للعملاء الجدد فور تسجيلهم بنجاح على منصة ليلة لبناء علاقة فورية.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      type="number" 
                      className="w-24 p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono text-sm"
                      value={settingsForm.welcomeBonus}
                      onChange={(e) => setSettingsForm({...settingsForm, welcomeBonus: Number(e.target.value)})}
                      required
                    />
                    <span className="font-bold text-slate-600">نقطة كهدية انضمام ترحيبية</span>
                  </div>
                </div>

                {/* Referral Bonus */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-500" />
                    <label className="font-bold text-slate-800 text-sm">مكافأة إحالة صديق (Referral)</label>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">النقاط الإضافية الممنوحة للعميل عند استخدام كود الإحالة الخاص به لتبادل الخدمات وجلب عملاء حقيقيين للمنصة.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      type="number" 
                      className="w-24 p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono text-sm"
                      value={settingsForm.referralBonus}
                      onChange={(e) => setSettingsForm({...settingsForm, referralBonus: Number(e.target.value)})}
                      required
                    />
                    <span className="font-bold text-slate-600">نقطة عند إكمال المدعو أول حجز</span>
                  </div>
                </div>

                {/* Min redeem points */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="w-5 h-5 text-rose-500" />
                    <label className="font-bold text-slate-800 text-sm">الحد الأدنى لاستبدال النقاط</label>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">أقل رصيد نقاط يجب أن يتجاوزه العميل ليتمكن من بدء استخدام الخصومات المكتسبة من النقاط على الفاتورة.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      type="number" 
                      className="w-24 p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono text-sm"
                      value={settingsForm.minRedeemPoints}
                      onChange={(e) => setSettingsForm({...settingsForm, minRedeemPoints: Number(e.target.value)})}
                      required
                    />
                    <span className="font-bold text-slate-600">نقطة كحد أدنى للاسترداد</span>
                  </div>
                </div>

                {/* Points expiry */}
                <div className="bg-slate-50/50 p-5 rounded-2xl border border-slate-100 space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="w-5 h-5 text-sky-500" />
                    <label className="font-bold text-slate-800 text-sm">صلاحية نقاط الولاء (باليوم)</label>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal">الفترة الزمنية القصوى لصلاحية النقاط قبل إعدامها من محفظة العميل لعدم استهلاكها وتنشيط دورة الاستهلاك.</p>
                  <div className="flex items-center gap-3 mt-4">
                    <input 
                      type="number" 
                      className="w-24 p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 font-mono text-sm"
                      value={settingsForm.pointsExpiryDays}
                      onChange={(e) => setSettingsForm({...settingsForm, pointsExpiryDays: Number(e.target.value)})}
                      required
                    />
                    <span className="font-bold text-slate-600">يوم كحد أقصى لصلاحية النقاط</span>
                  </div>
                </div>

              </div>

              <div className="border-t border-slate-100 pt-5 flex justify-end">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-8 py-3.5 rounded-xl shadow-lg shadow-amber-500/10 hover:scale-102 transition-all cursor-pointer text-xs"
                >
                  حفظ وتطبيق إعدادات الولاء والمزامنة التلقائية
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* RENDER SECTION 5: Redis & Indexing Monitor */}
      {activeTab === 'redis' && (
        <div className="space-y-6">
          <div className="bg-slate-900 text-slate-100 p-6 rounded-3xl shadow-xl border border-slate-800 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 border-b border-slate-800 pb-5 text-right">
              <div className="space-y-1">
                <div className="flex items-center gap-2 justify-end md:justify-start md:flex-row-reverse">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    مراقب الأداء ومكافحة تضخم البيانات المليونية
                  </h3>
                </div>
                <p className="text-slate-400 text-xs">
                  نظام محاكاة متكامل لذاكرة كاش Redis ونظام الفهرسة (Indexing) المعتمد في بنية قاعدة البيانات لتسريع الاستعلامات لأعداد عملاء مليونية.
                </p>
              </div>
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleFlushRedis}
                  disabled={isLoadingRedis}
                  className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  إفراغ الكاش (Flush Redis)
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const res = await fetch('/api/users/redis/stats');
                    const data = await res.json();
                    if (data.success) {
                      setRedisStats(data);
                      showNotification('info', 'تم تحديث مؤشرات الأداء بنجاح.');
                    }
                  }}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  تحديث المؤشرات
                </button>
              </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-right">
              
              {/* Hit Rate Card */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-3">
                <span className="text-slate-500 text-xs font-medium block">معدل نجاح الكاش (Hit Rate)</span>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-black font-mono text-emerald-400">
                    {redisStats?.stats 
                      ? (redisStats.stats.hits + redisStats.stats.misses === 0 
                        ? '0.0%' 
                        : ((redisStats.stats.hits / (redisStats.stats.hits + redisStats.stats.misses)) * 100).toFixed(1) + '%')
                      : '0.0%'
                    }
                  </span>
                  <Award className="w-6 h-6 text-emerald-500" />
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-emerald-400 h-full transition-all duration-500" 
                    style={{ 
                      width: redisStats?.stats && (redisStats.stats.hits + redisStats.stats.misses > 0) 
                        ? `${(redisStats.stats.hits / (redisStats.stats.hits + redisStats.stats.misses)) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>

              {/* Cache Hits / Misses */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-3">
                <span className="text-slate-500 text-xs font-medium block">عمليات القراءة (Reads)</span>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      <span>HIT: <strong className="font-mono text-white text-sm">{redisStats?.stats?.hits || 0}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      <span>MISS: <strong className="font-mono text-white text-sm">{redisStats?.stats?.misses || 0}</strong></span>
                    </div>
                  </div>
                  <TrendingUp className="w-6 h-6 text-sky-400" />
                </div>
              </div>

              {/* Redis Key Size */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-3">
                <span className="text-slate-500 text-xs font-medium block">المفاتيح النشطة بكاش Redis</span>
                <div className="flex items-baseline justify-between">
                  <div className="space-y-0.5">
                    <span className="text-2xl font-black font-mono text-amber-400">{redisStats?.stats?.size || 0}</span>
                    <span className="text-[10px] text-slate-500 block">مفتاح في الذاكرة حالياً</span>
                  </div>
                  <Gift className="w-6 h-6 text-amber-500" />
                </div>
              </div>

              {/* Database Index Status */}
              <div className="bg-slate-950/60 p-5 rounded-2xl border border-slate-850 space-y-3">
                <span className="text-slate-500 text-xs font-medium block">حالة فهرسة الجداول (Indexes)</span>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold">مفعلة (Active)</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block">فهارس على: email, role, points, status</span>
                  </div>
                  <Star className="w-6 h-6 text-amber-400 fill-amber-400" />
                </div>
              </div>

            </div>

            {/* Active Keys & Terminal Logs layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-right">
              
              {/* Active Redis Keys */}
              <div className="bg-slate-950/40 p-5 rounded-2xl border border-slate-850 space-y-3">
                <h4 className="text-sm font-bold text-slate-200 flex items-center justify-between border-b border-slate-850 pb-3">
                  <span className="text-slate-500 text-[10px] font-sans">إجمالي المفاتيح: {redisStats?.stats?.size || 0}</span>
                  <span className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-amber-400" />
                    المفاتيح النشطة (Active Keys)
                  </span>
                </h4>
                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                  {redisStats?.keys && redisStats.keys.length > 0 ? (
                    redisStats.keys.map((key: string, idx: number) => (
                      <div key={idx} className="flex justify-between items-center bg-slate-900/60 px-3 py-2 rounded-xl border border-slate-850 text-xs font-mono">
                        <span className="text-slate-500 text-[10px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800/50">TTL 300s</span>
                        <span className="text-amber-400">{key}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-slate-500 py-10 text-xs">
                      لا توجد مفاتيح نشطة حالياً في كاش Redis.
                      <p className="text-[10px] text-slate-600 mt-1">تصفّح "دليل العملاء" لتوليد استعلامات تلقائية تنشط الكاش!</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Realtime Terminal logs */}
              <div className="lg:col-span-2 bg-black p-5 rounded-2xl border border-slate-850 space-y-3 font-mono">
                <div className="flex justify-between items-center border-b border-slate-850 pb-3">
                  <span className="text-[10px] text-slate-500">منفذ الاتصال الداخلي: localhost:6379</span>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                    سجل عمليات Redis المباشر (Realtime Engine Logs)
                  </h4>
                </div>
                <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar text-xs">
                  {redisStats?.logs && redisStats.logs.length > 0 ? (
                    redisStats.logs.map((log: any, idx: number) => {
                      let typeColor = 'text-sky-400 bg-sky-950/40 border-sky-900/40';
                      if (log.type === 'HIT') typeColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/40';
                      if (log.type === 'MISS') typeColor = 'text-rose-400 bg-rose-950/40 border-rose-900/40';
                      if (log.type === 'DEL') typeColor = 'text-amber-400 bg-amber-950/40 border-amber-900/40';
                      if (log.type === 'FLUSH') typeColor = 'text-purple-400 bg-purple-950/40 border-purple-900/40';

                      return (
                        <div key={log.id || idx} className="bg-slate-900/40 p-2.5 rounded-xl border border-slate-900 flex flex-col md:flex-row gap-2 md:items-center text-[11px] leading-relaxed text-right md:justify-end">
                          {log.key !== '*' && (
                            <span className="text-[10px] text-slate-400 bg-slate-950 px-1.5 py-0.5 rounded font-mono border border-slate-850 md:order-1">key: {log.key}</span>
                          )}
                          <span className="text-slate-300 font-sans flex-1 md:order-2">{log.message}</span>
                          <span className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase shrink-0 text-center w-14 ${typeColor} md:order-3`}>{log.type}</span>
                          <span className="text-slate-500 shrink-0 font-sans md:order-4">[{log.timestamp}]</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center text-slate-600 py-10 text-xs">
                      بانتظار حدوث عمليات استعلام أو تحديث نقاط لتسجيل السجلات في الوقت الفعلي...
                    </div>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
};
