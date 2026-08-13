import React, { useState, useMemo } from 'react';
import { 
  Megaphone, TrendingUp, Sparkles, Percent, Eye, CheckCircle2, Clock, 
  AlertTriangle, Plus, Search, Building2, Tag, Filter, Layers, 
  BarChart3, ArrowUpRight, ShieldCheck, RefreshCw, X, ChevronRight,
  Send, HelpCircle, FileText, Check, AlertCircle, Play, DollarSign, CalendarDays,
  Wallet, Activity
} from 'lucide-react';
import { formatCurrency } from '../../utils/helpers';
import { ProviderMarketingWizard } from '../MarketingComponents';
import { AdRequestProviderWizard } from '../AdRequestProviderWizard';

interface ProviderGrowthCenterProps {
  currentProviderName: string;
  campaigns?: any[];
  setCampaigns?: React.Dispatch<React.SetStateAction<any[]>>;
  adRequests?: any[];
  setAdRequests?: React.Dispatch<React.SetStateAction<any[]>>;
  promotions?: any[];
  setPromotions?: React.Dispatch<React.SetStateAction<any[]>>;
  halls?: any[];
  services?: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function ProviderGrowthCenter({
  currentProviderName,
  campaigns = [],
  setCampaigns,
  adRequests = [],
  setAdRequests,
  promotions = [],
  setPromotions,
  halls = [],
  services = [],
  showNotification
}: ProviderGrowthCenterProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'campaigns' | 'ads' | 'coupons' | 'new_campaign'>('overview');

  // Filter campaigns for this provider
  const myCampaigns = useMemo(() => {
    return campaigns.filter((c: any) => 
      c.providerName === currentProviderName || c.provider === currentProviderName || !c.providerName
    );
  }, [campaigns, currentProviderName]);

  // Filter promotions/coupons for this provider with strict multi-tenancy isolation
  const myPromotions = useMemo(() => {
    return (promotions || []).filter((p: any) => 
      p.providerName === currentProviderName || 
      p.provider === currentProviderName || 
      (!p.providerName && currentProviderName)
    );
  }, [promotions, currentProviderName]);

  // Coupon dates state
  const todayISO = new Date().toISOString().split('T')[0];
  const defaultEndISO = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Smart Promotion Design Wizard Modal State
  const [isPromoWizardOpen, setIsPromoWizardOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [promoWizardStep, setPromoWizardStep] = useState(1);
  const [promoFormData, setPromoFormData] = useState<{
    id?: number | string;
    srvNumber?: string;
    name: string;
    promotionPattern: 'promo_code' | 'early_bird' | 'bundle' | 'closed_package';
    couponCode: string;
    usageLimit: number;
    commissionPolicy: 'CommissionOnDiscountedPrice' | 'CommissionOnOriginalPrice';
    type: 'percentage' | 'fixed' | 'free_service';
    value: number;
    freeServiceId?: number | string;
    maxFreeServiceValue?: number;
    applyTo: 'halls' | 'services';
    scopeType: 'AllProviderHalls' | 'SelectedHalls' | 'SelectedServices';
    targetIds: (string | number)[];
    conditions: {
      earlyBird?: number;
      seasonal?: { start: string; end: string };
      bundleCount?: number;
    };
    hasAdCampaign: boolean;
    startDate: string;
    endDate: string;
  }>({
    name: '',
    promotionPattern: 'promo_code',
    couponCode: '',
    usageLimit: 100,
    commissionPolicy: 'CommissionOnDiscountedPrice',
    type: 'percentage',
    value: 10,
    applyTo: 'halls',
    scopeType: 'AllProviderHalls',
    targetIds: [],
    conditions: {},
    hasAdCampaign: false,
    startDate: todayISO,
    endDate: defaultEndISO,
  });

  // Current logged in user object
  const currentUser = useMemo(() => {
    try {
      const userStr = localStorage.getItem('currentUser');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  }, []);

  // New Ad Request Form State
  const [showAdForm, setShowAdForm] = useState(false);

  // Filter ad requests for this provider
  const myAdRequests = useMemo(() => {
    return adRequests.filter((ad: any) => 
      ad.providerName === currentProviderName || ad.provider === currentProviderName || ad.advertiserName === currentProviderName || !ad.providerName
    );
  }, [adRequests, currentProviderName]);

  // Generate new standard SRV serial number
  const generateNewSrvNumber = () => {
    const year = '26';
    const randSeq = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    return `SRV-${year}-${randSeq}`;
  };

  // Open Smart Promotion Design Wizard Modal
  const handleOpenPromoWizard = (promoToEdit?: any) => {
    if (promoToEdit) {
      setEditingPromo(promoToEdit);
      setPromoFormData({
        id: promoToEdit.id,
        srvNumber: promoToEdit.srvNumber,
        name: promoToEdit.name || '',
        promotionPattern: promoToEdit.promotionPattern || 'promo_code',
        couponCode: promoToEdit.couponCode || promoToEdit.code || '',
        usageLimit: promoToEdit.maxUsage || promoToEdit.usageLimit || 100,
        commissionPolicy: promoToEdit.commissionPolicy || 'CommissionOnDiscountedPrice',
        type: promoToEdit.type || 'percentage',
        value: Number(promoToEdit.value || promoToEdit.discount || 10),
        freeServiceId: promoToEdit.freeServiceId,
        maxFreeServiceValue: promoToEdit.maxFreeServiceValue,
        applyTo: promoToEdit.applyTo || (promoToEdit.scopeType === 'SelectedServices' ? 'services' : 'halls'),
        scopeType: promoToEdit.scopeType || 'AllProviderHalls',
        targetIds: promoToEdit.targetIds || [],
        conditions: promoToEdit.conditions || {},
        hasAdCampaign: !!promoToEdit.hasAdCampaign,
        startDate: promoToEdit.startDate || todayISO,
        endDate: promoToEdit.endDate || defaultEndISO,
      });
    } else {
      setEditingPromo(null);
      setPromoFormData({
        name: '',
        promotionPattern: 'promo_code',
        couponCode: '',
        usageLimit: 100,
        commissionPolicy: 'CommissionOnDiscountedPrice',
        type: 'percentage',
        value: 10,
        applyTo: 'halls',
        scopeType: 'AllProviderHalls',
        targetIds: [],
        conditions: {},
        hasAdCampaign: false,
        startDate: todayISO,
        endDate: defaultEndISO,
      });
    }
    setPromoWizardStep(1);
    setIsPromoWizardOpen(true);
  };

  // Save/Submit Smart Promotion Request
  const handleSavePromoWizard = () => {
    if (!promoFormData.name.trim()) {
      showNotification('warning', 'يرجى كتابة اسم العرض الترويجي.');
      return;
    }

    if (promoFormData.promotionPattern === 'promo_code' && !promoFormData.couponCode.trim()) {
      showNotification('warning', 'يرجى تعبئة رمز الكود الترويجي (Promo Code).');
      return;
    }

    if (promoFormData.type !== 'free_service' && (!promoFormData.value || promoFormData.value <= 0)) {
      showNotification('warning', 'يرجى تحديد قيمة الخصم بشكل صحيح.');
      return;
    }

    if (promoFormData.type === 'free_service' && !promoFormData.freeServiceId) {
      showNotification('warning', 'يرجى اختيار الخدمة المجانية المضافة كهدية.');
      return;
    }

    if (promoFormData.endDate < promoFormData.startDate) {
      showNotification('warning', 'تاريخ نهاية الخصم يجب أن يكون مساوياً أو بعد تاريخ البداية!');
      return;
    }

    if ((promoFormData.scopeType === 'SelectedHalls' || promoFormData.scopeType === 'SelectedServices') && promoFormData.targetIds.length === 0) {
      showNotification('warning', 'حظر إرسال الطلب: يجب تحديد قاعة واحدة أو خدمة مساندة واحدة على الأقل عند اختيار النطاق المخصص!');
      return;
    }

    const srvNumber = editingPromo?.srvNumber || generateNewSrvNumber();
    const newPromo = {
      id: editingPromo?.id || Date.now(),
      srvNumber: srvNumber,
      name: promoFormData.name,
      couponCode: promoFormData.couponCode ? promoFormData.couponCode.toUpperCase() : undefined,
      promotionPattern: promoFormData.promotionPattern,
      type: promoFormData.type,
      value: promoFormData.value,
      freeServiceId: promoFormData.freeServiceId,
      maxFreeServiceValue: promoFormData.maxFreeServiceValue,
      commissionPolicy: promoFormData.commissionPolicy,
      applyTo: promoFormData.applyTo,
      scopeType: promoFormData.targetIds.length > 0 
        ? (promoFormData.applyTo === 'services' ? 'SelectedServices' : 'SelectedHalls')
        : 'AllProviderHalls',
      targetIds: promoFormData.targetIds,
      conditions: promoFormData.conditions,
      hasAdCampaign: promoFormData.hasAdCampaign,
      startDate: promoFormData.startDate,
      endDate: promoFormData.endDate,
      usageCount: editingPromo?.usageCount || 0,
      maxUsage: promoFormData.usageLimit || 100,
      providerName: currentProviderName,
      provider: currentProviderName,
      status: 'pending', // Re-submits or creates as pending admin approval
      adminNotes: undefined,
      createdAt: editingPromo?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (setPromotions) {
      setPromotions((prev: any[]) => {
        if (editingPromo) {
          return prev.map((p: any) => p.id === editingPromo.id ? newPromo : p);
        } else {
          return [newPromo, ...prev];
        }
      });
    }

    // Automatically trigger Sponsored Ad Request if requested
    if (promoFormData.hasAdCampaign && setAdRequests) {
      const adSrv = generateNewSrvNumber();
      const newAdReq = {
        id: Date.now() + 1,
        srvNumber: adSrv,
        title: `حملة إعلانية ممولة للعرض: ${promoFormData.name}`,
        providerName: currentProviderName,
        advertiserName: currentProviderName,
        promotionId: newPromo.id,
        budget: 500,
        startDate: promoFormData.startDate,
        endDate: promoFormData.endDate,
        status: 'pending',
        createdAt: new Date().toISOString()
      };
      setAdRequests((prev: any[]) => [newAdReq, ...prev]);
    }

    showNotification('success', editingPromo 
      ? `تم تحديث وإعادة تقديم طلب العرض الترويجي (${srvNumber}) إلى إدارة المنصة بنجاح!` 
      : `تم إرسال طلب العرض الترويجي جديد (${srvNumber}) عبر بوابة التصميم الذكية إلى إدارة المنصة للحياد والاعتماد!`
    );

    setIsPromoWizardOpen(false);
    setEditingPromo(null);
  };

  // Submit New Campaign Request via ProviderMarketingWizard
  const handleWizardCampaignSubmit = (wizardData: any) => {
    const newSrv = generateNewSrvNumber();
    const adBudget = Number(wizardData.adBudget) || 0;
    const agencyFee = Number(wizardData.agencyFee) || 0;
    const totalBudget = adBudget + agencyFee;

    const newCamp = {
      id: `CAMP-${Date.now()}`,
      srvNumber: newSrv,
      title: wizardData.title || `حملة ${wizardData.goalMetric || 'تسويقية'} - ${currentProviderName}`,
      providerName: currentProviderName,
      provider: currentProviderName,
      providerEmail: currentUser?.email || 'provider@layla.sa',
      providerPhone: currentUser?.phone || '0500000000',
      providerCity: currentUser?.city || currentUser?.address || 'الرياض',
      goalMetric: wizardData.goalMetric,
      targetAudience: wizardData.targetAudience,
      coreMessage: wizardData.coreMessage,
      channel: wizardData.channel,
      offer: wizardData.offer,
      followUpMethod: wizardData.followUpMethod,
      startDate: wizardData.startDate,
      endDate: wizardData.endDate,
      adBudget: adBudget,
      agencyFee: agencyFee,
      agencyNetProfit: agencyFee * 0.85,
      budget: totalBudget,
      spent: 0,
      status: 'قيد دراسة الوكالة',
      approvalStatus: 'SentToAgency',
      paymentStatus: wizardData.paymentStatus || 'غير مدفوع',
      createdAt: new Date().toISOString().split('T')[0],
      impressionsTarget: 50000,
      impressionsAchieved: 0,
      conversions: 0
    };

    if (setCampaigns) {
      setCampaigns(prev => [newCamp, ...prev]);
    }
    showNotification('success', `تم تقديم طلب الحملة التسويقية بنجاح برقم الطلب القياسي (${newSrv}). تحول الطلب مباشرة للوكالة التسويقية المعتمدة لدراسته وإعداد العرض الخطي والمالي (MPR).`);
    setActiveTab('campaigns');
  };

  // Submit New Internal Ad Request via AdRequestProviderWizard
  const handleAdWizardSubmit = (adData: any) => {
    const newSrv = generateNewSrvNumber();
    const newAd = {
      id: `AD-${Date.now()}`,
      srvNumber: newSrv,
      title: adData.title || `إعلان داخلي - ${adData.adLocation || 'المنصة'}`,
      providerName: adData.advertiserName || currentProviderName,
      provider: currentProviderName,
      advertiserName: adData.advertiserName || currentProviderName,
      advertiserPhone: adData.advertiserPhone || currentUser?.phone || '0500000000',
      advertiserEmail: adData.advertiserEmail || currentUser?.email || 'provider@layla.sa',
      advertiserAddress: adData.advertiserAddress || currentUser?.address || currentUser?.city || 'الرياض',
      adType: adData.adType || 'صورة (بنر)',
      adLocation: adData.adLocation || 'أعلى الصفحة الرئيسية',
      destinationUrl: adData.destinationUrl || '',
      adContent: adData.adContent || '',
      targetInterests: adData.targetInterests || '',
      targetLocations: adData.targetLocations || '',
      adBudget: Number(adData.adBudget) || 1000,
      budget: Number(adData.adBudget) || 1000,
      startDate: adData.startDate || new Date().toISOString().split('T')[0],
      endDate: adData.endDate || '',
      legalAttachments: adData.legalAttachments || '',
      status: 'قيد المراجعة',
      approvalStatus: 'Pending',
      paymentStatus: 'غير مدفوع',
      createdAt: new Date().toISOString().split('T')[0]
    };

    if (setAdRequests) {
      setAdRequests(prev => [newAd, ...prev]);
    }
    showNotification('success', `تم تقديم طلب الإعلان الداخلي بنجاح برقم الطلب القياسي (${newSrv})! تم تحويله لمركز الإدارة للمراجعة والاعتماد.`);
    setShowAdForm(false);
    setActiveTab('ads');
  };

  // Cancel Ad Request
  const handleCancelAdRequest = (adId: string | number) => {
    if (setAdRequests) {
      setAdRequests(prev => prev.map((a: any) => {
        if (String(a.id) === String(adId)) {
          return { ...a, status: 'ملغي', approvalStatus: 'Cancelled' };
        }
        return a;
      }));
    }
    showNotification('info', 'تم إلغاء طلب الإعلان الداخلي بنجاح.');
  };

  // Handle campaign cancellation with Refund Path
  const handleCancelCampaign = (campaignId: string, currentStatus: string, paymentStatus: string) => {
    if (paymentStatus === 'مدفوع' || paymentStatus === 'Paid') {
      // Refund path (RefundPending -> Refunded)
      const updated = myCampaigns.map((c: any) => {
        if (String(c.id) === String(campaignId)) {
          return {
            ...c,
            status: 'طلب استرداد',
            refundStatus: 'RefundPending',
            cancellationReason: 'طلب المزود إلغاء الحملة المسددة قبل بدء الترويج'
          };
        }
        return c;
      });
      if (setCampaigns) setCampaigns(updated);
      showNotification('info', 'تم تحويل طلب الإلغاء إلى مسار الاسترداد الموثق عبر بوابة السداد (RefundPending ➔ Refunded).');
    } else {
      // Cancelled before payment
      const updated = myCampaigns.map((c: any) => {
        if (String(c.id) === String(campaignId)) {
          return { ...c, status: 'ملغاة', approvalStatus: 'Cancelled' };
        }
        return c;
      });
      if (setCampaigns) setCampaigns(updated);
      showNotification('warning', 'تم إلغاء طلب الحملة قبل الدفع بنجاح.');
    }
  };

  // Metrics
  const totalBudget = myCampaigns.reduce((sum, c) => sum + (c.budget || 0), 0);
  const totalSpent = myCampaigns.reduce((sum, c) => sum + (c.spent || 0), 0);
  const activeCampaignsCount = myCampaigns.filter(c => c.status === 'نشطة' || c.status === 'Running').length;
  const pendingRequestsCount = myCampaigns.filter(c => c.status === 'قيد المراجعة' || c.status === 'Submitted' || c.status === 'Draft').length;

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Main Growth Center Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-amber-950 text-white p-6 rounded-3xl shadow-xl border border-amber-500/30 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full border border-amber-400/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              مركز النمو والتسويق للمزود (Provider Growth Center)
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-400/30">
              تتبع حي بالأرقام وشريط التقدم 📊
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">منظومة التسويق والإعلانات والنمو الذكي للمنشأة</h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            متابعة دقيقة لطلبات حملاتك التسويقية مع الوكالة المعتمدة، أشرطة التقدم الحية للميزانيات والمستهدفات، الكوبونات المخصصة لقاعاتك، والإعلانات المباشرة على المنصة.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('new_campaign')}
          className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 transition-all cursor-pointer flex items-center gap-2 shrink-0"
        >
          <Plus className="w-4 h-4" />
          طلب حملة تسويقية جديدة
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'overview'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          نظرة عامة ومؤشرات النمو
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'campaigns'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          طلبات وحملات التسويق ({myCampaigns.length})
        </button>

        <button
          onClick={() => setActiveTab('ads')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'ads'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Eye className="w-4 h-4" />
          الإعلانات الداخلية ({adRequests.length})
        </button>

        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === 'coupons'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Tag className="w-4 h-4" />
          الكوبونات والخصومات ({myPromotions.length})
        </button>

        <button
          onClick={() => setActiveTab('new_campaign')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 shrink-0 mr-auto ${
            activeTab === 'new_campaign'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
              : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Plus className="w-4 h-4" />
          معالج طلب حملة جديدة
        </button>
      </div>

      {/* SUB-TAB 1: OVERVIEW & GROWTH METRICS */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top 4 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                <span>إجمالي ميزانيات التسويق</span>
                <DollarSign className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatCurrency(totalBudget)}
              </div>
              <p className="text-[10px] text-slate-400 font-bold">مستثمرة في الحملات والإعلانات</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                <span>المبلغ المستهلك فعلياً</span>
                <TrendingUp className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="text-2xl font-black text-emerald-600 font-mono">
                {formatCurrency(totalSpent)}
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-emerald-500 h-full rounded-full transition-all"
                  style={{ width: `${totalBudget > 0 ? Math.min(100, (totalSpent / totalBudget) * 100) : 0}%` }}
                />
              </div>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                <span>الحملات النشطة</span>
                <Megaphone className="w-4 h-4 text-indigo-500" />
              </div>
              <div className="text-2xl font-black text-indigo-600 font-mono">
                {activeCampaignsCount} <span className="text-xs font-normal text-slate-400">حملة نشطة</span>
              </div>
              <p className="text-[10px] text-amber-600 font-bold">{pendingRequestsCount} طلبات قيد المراجعة والاعتماد</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-150 shadow-sm space-y-2">
              <div className="flex justify-between items-center text-slate-400 text-xs font-bold">
                <span>الكوبونات الفعالة</span>
                <Tag className="w-4 h-4 text-fuchsia-500" />
              </div>
              <div className="text-2xl font-black text-fuchsia-600 font-mono">
                {myPromotions.filter(c => c.status === 'نشط' || c.status === 'active').length} <span className="text-xs font-normal text-slate-400">كود خصم</span>
              </div>
              <p className="text-[10px] text-slate-400 font-bold">متاحة لحجوزات العملاء المباشرة</p>
            </div>
          </div>

          {/* Active Campaigns Progress Overview */}
          <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-800 text-base flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  أشرطة تقدم الحملات التسويقية الحية (Campaign Live Progress)
                </h3>
                <p className="text-xs text-slate-400 font-bold mt-0.5">متابعة دقيقة لنسبة استهلاك الميزانيات، وصول الجمهور، والأيام المتبقية للحملات</p>
              </div>
              <button 
                onClick={() => setActiveTab('campaigns')} 
                className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                عرض كافة التفاصيل ←
              </button>
            </div>

            {myCampaigns.length === 0 ? (
              <div className="text-center py-12 text-slate-400 space-y-3">
                <Megaphone className="w-10 h-10 mx-auto text-slate-300 animate-pulse" />
                <p className="text-xs font-bold">لا توجد حملات تسويقية مسجلة لمنشأتك حالياً.</p>
                <button
                  onClick={() => setActiveTab('new_campaign')}
                  className="px-4 py-2 bg-amber-500 text-slate-950 rounded-xl text-xs font-black hover:bg-amber-600 transition-all"
                >
                  طلب أول حملة تسويقية الآن
                </button>
              </div>
            ) : (
              <div className="space-y-5">
                {myCampaigns.map((camp: any) => {
                  const budgetProgress = camp.budget > 0 ? Math.min(100, Math.round(((camp.spent || 0) / camp.budget) * 100)) : 0;
                  const impressionsProgress = camp.impressionsTarget > 0 ? Math.min(100, Math.round(((camp.impressionsAchieved || 0) / camp.impressionsTarget) * 100)) : 45;
                  
                  return (
                    <div key={camp.id} className="p-4 bg-slate-50/60 rounded-2xl border border-slate-100 space-y-3">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                              {camp.srvNumber || camp.id}
                            </span>
                            <h4 className="font-extrabold text-slate-800 text-sm">{camp.title}</h4>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${
                              camp.status === 'نشطة' || camp.status === 'Running' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              camp.status === 'قيد المراجعة' || camp.status === 'Submitted' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                              camp.status === 'طلب استرداد' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {camp.status || 'نشطة'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-bold mt-1">
                            المستهدف: {camp.targetScope || 'جميع القاعات'} | القنوات: {Array.isArray(camp.channels) ? camp.channels.join('، ') : 'انستغرام وسناب شات'}
                          </p>
                        </div>

                        <div className="text-left font-mono text-xs">
                          <span className="text-slate-400 font-bold block text-[10px]">الميزانية / المصروف:</span>
                          <span className="font-black text-slate-800">{formatCurrency(camp.spent || 0)}</span> / <span className="text-slate-500">{formatCurrency(camp.budget)}</span>
                        </div>
                      </div>

                      {/* Progress Bars Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                        {/* Budget Consumption Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>استهلاك الميزانية المخصصة</span>
                            <span className="font-mono font-black text-amber-600">{budgetProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all duration-500 ${
                                budgetProgress > 85 ? 'bg-rose-500' : budgetProgress > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${budgetProgress}%` }}
                            />
                          </div>
                        </div>

                        {/* Audience Impressions Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-[10px] font-bold text-slate-500">
                            <span>هدف وصول الجمهور (Impressions Target)</span>
                            <span className="font-mono font-black text-indigo-600">{impressionsProgress}%</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                              style={{ width: `${impressionsProgress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: CAMPAIGN REQUESTS & PROGRESS */}
      {activeTab === 'campaigns' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                سجل وطلبات الحملات التسويقية للمنشأة (Campaign Ledger)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                تتبع حالة طلبات تسويق قاعاتك وخدماتك برقم الطلب القياسي (SRV-YY-XXXXXXXXXX)، ونسب التقدم، ومسارات السداد والإلغاء المعتمدة.
              </p>
            </div>
            <button
              onClick={() => setActiveTab('new_campaign')}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer flex items-center gap-1.5 shadow"
            >
              <Plus className="w-4 h-4" />
              طلب حملة جديدة
            </button>
          </div>

          {/* Campaigns Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black">
                <tr>
                  <th className="p-3">رقم الطلب القياسي</th>
                  <th className="p-3">عنوان الحملة والمستهدف</th>
                  <th className="p-3">الميزانية</th>
                  <th className="p-3 text-center">شريط تقدم الميزانية</th>
                  <th className="p-3">حالة السداد</th>
                  <th className="p-3 text-center">حالة الحملة</th>
                  <th className="p-3 text-center">الإجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {myCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-slate-400 font-bold">
                      لا توجد طلبات حملات حالياً. اضغط على "طلب حملة جديدة" للبدء.
                    </td>
                  </tr>
                ) : (
                  myCampaigns.map((camp: any) => {
                    const budgetProgress = camp.budget > 0 ? Math.min(100, Math.round(((camp.spent || 0) / camp.budget) * 100)) : 0;
                    return (
                      <tr key={camp.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="p-3 font-mono font-bold text-amber-700 bg-amber-50/30 rounded-lg">
                          {camp.srvNumber || `SRV-26-${String(camp.id || '').slice(-10)}`}
                        </td>
                        <td className="p-3">
                          <p className="font-extrabold text-slate-800">{camp.title}</p>
                          <p className="text-[10px] text-slate-400">{camp.targetScope || 'جميع القاعات'}</p>
                        </td>
                        <td className="p-3 font-mono font-bold text-slate-800">
                          {formatCurrency(camp.budget)}
                        </td>
                        <td className="p-3 text-center min-w-[140px]">
                          <div className="space-y-1">
                            <span className="text-[10px] font-mono font-bold text-slate-600 block">
                              {camp.spent || 0} / {camp.budget} ر.س ({budgetProgress}%)
                            </span>
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className="bg-amber-500 h-full rounded-full transition-all"
                                style={{ width: `${budgetProgress}%` }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            camp.paymentStatus === 'مدفوع' || camp.paymentStatus === 'Paid'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {camp.paymentStatus || 'غير مدفوع'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black inline-block ${
                            camp.status === 'نشطة' || camp.status === 'Running' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                            camp.status === 'قيد المراجعة' || camp.status === 'Submitted' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                            camp.status === 'طلب استرداد' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                            camp.status === 'ملغاة' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {camp.status || 'نشطة'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {camp.status !== 'ملغاة' && camp.status !== 'طلب استرداد' ? (
                            <button
                              onClick={() => handleCancelCampaign(camp.id, camp.status, camp.paymentStatus)}
                              className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-[10px] font-bold border border-rose-200 transition-all cursor-pointer"
                            >
                              إلغاء الطلب
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-400 font-bold">مكتمل الإجراء</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: INTERNAL ADS */}
      {activeTab === 'ads' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Eye className="w-5 h-5 text-indigo-500" />
                الإعلانات الداخلية المباشرة على منصة ليلة (Internal Banner Ads)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                احجز مواضع إعلانية ممتازة في أعلى الصفحة الرئيسية أو صفحات نتائج البحث لقاعاتك وخدماتك.
              </p>
            </div>
            <button
              onClick={() => setShowAdForm(!showAdForm)}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-2xl shadow-md hover:shadow-indigo-200 transition-all cursor-pointer flex items-center gap-2 shrink-0 active:scale-95"
            >
              {showAdForm ? (
                <>
                  <X className="w-4 h-4" />
                  إغلاق النموذج
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  طلب إعلان داخلي جديد
                </>
              )}
            </button>
          </div>

          {/* Admin Sync Notice Banner */}
          <div className="p-4 bg-gradient-to-r from-amber-50 to-indigo-50 rounded-2xl border border-amber-200/80 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-black text-slate-800">
                🔄 ربط مباشر مع "مركز النمو والتسويق للإدارة" (Admin Growth & Marketing Center)
              </p>
              <p className="text-slate-600 leading-relaxed">
                جميع طلبات الإعلانات الداخلية والحملات التسويقية التي تنشئها هنا تُحذى برقم طلب خدمة قياسي (<span className="font-mono font-bold text-amber-700">SRV-YY-XXXXXXXXXX</span>) وتنتقل فورياً إلى لوحة تحكم إدارة المنصة لمراجعتها وتدقيق الشروط والاعتماد والتفعيل المباشر.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 space-y-2 text-right">
              <span className="text-xs text-indigo-800 font-bold">موضِع الصفحة الرئيسية</span>
              <p className="text-xl font-black text-indigo-900 font-mono">Banner Slot #1</p>
              <p className="text-[11px] text-slate-500">أعلى معدل مشاهدة ونقرات من العملاء الباحثين عن قاعات.</p>
            </div>

            <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 space-y-2 text-right">
              <span className="text-xs text-emerald-800 font-bold">قياس خادمي معتمد</span>
              <p className="text-xl font-black text-emerald-900 font-mono">Deduplicated CTR</p>
              <p className="text-[11px] text-slate-500">فلترة آليّة للبوتات وتوثيق نقرات العملاء الحقيقيين فقط.</p>
            </div>

            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 space-y-2 text-right">
              <span className="text-xs text-amber-800 font-bold">حالة الطلبات الإعلانية</span>
              <p className="text-xl font-black text-amber-900 font-mono">{myAdRequests.length} إعلان</p>
              <p className="text-[11px] text-slate-500">متابعة الأداء الحي لطلبات الإعلانات المباشرة.</p>
            </div>
          </div>

          {/* New Ad Request Form Wizard */}
          {showAdForm && (
            <div className="mb-6">
              <AdRequestProviderWizard onSubmit={handleAdWizardSubmit} currentUserData={currentUser} />
            </div>
          )}

          {/* Ad Requests List */}
          <div className="space-y-4">
            <h4 className="font-black text-xs text-slate-800 flex items-center gap-2">
              <FileText className="w-4 h-4 text-indigo-600" />
              سجل الطلبات الإعلانية الداخلية لـ ({currentProviderName}):
            </h4>

            {myAdRequests.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100 text-slate-400 font-bold text-xs space-y-2">
                <p>لا توجد طلبات إعلانات داخلية مقدمة حالياً.</p>
                <p className="text-[11px] text-slate-400 font-normal">اضغط على زر "طلب إعلان داخلي جديد" بأعلى الصفحة لتقديم طلب وإرساله للإدارة.</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100/80 text-slate-700 font-black border-b border-slate-200">
                      <th className="p-3">رقم الطلب (SRV)</th>
                      <th className="p-3">العنوان والهدف</th>
                      <th className="p-3">موضِع الإعلان</th>
                      <th className="p-3">المدة والميزانية</th>
                      <th className="p-3">حالة الطلب لدى الإدارة</th>
                      <th className="p-3 text-center">الإجراء</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {myAdRequests.map((ad: any) => {
                      const status = ad.status || 'قيد المراجعة';
                      const isPending = status === 'قيد المراجعة' || status === 'Pending';
                      const isActive = status === 'نشطة' || status === 'نشط' || status === 'Approved';
                      const isCancelled = status === 'ملغي' || status === 'ملغية' || status === 'Cancelled';
                      const isRejected = status === 'مرفوض' || status === 'مرفوضة' || status === 'Rejected';

                      return (
                        <tr key={ad.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="p-3 font-mono font-bold text-amber-700 bg-amber-50/40 rounded-lg">
                            {ad.srvNumber || `SRV-26-${String(ad.id || '').slice(-10)}`}
                          </td>
                          <td className="p-3">
                            <p className="font-extrabold text-slate-800">{ad.title || ad.placement || 'إعلان بنر ممتاز'}</p>
                            {ad.targetScope && (
                              <p className="text-[10px] text-slate-500 font-medium">المستهدف: {ad.targetScope}</p>
                            )}
                          </td>
                          <td className="p-3 font-medium text-slate-600">
                            {ad.adLocation || ad.placement || 'أعلى الصفحة الرئيسية'}
                          </td>
                          <td className="p-3">
                            <p className="font-bold text-slate-800">{ad.duration || '14 يوم'}</p>
                            <p className="text-[10px] font-mono text-emerald-700 font-bold">{formatCurrency(ad.budget || ad.adBudget || 1500)}</p>
                          </td>
                          <td className="p-3">
                            {isPending && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-300 rounded-full text-[10px] font-black animate-pulse">
                                <Clock className="w-3 h-3 text-amber-600" />
                                قيد المراجعة لدى الإدارة
                              </span>
                            )}
                            {isActive && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-full text-[10px] font-black">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                نشط ومعتمد من الإدارة
                              </span>
                            )}
                            {isRejected && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-full text-[10px] font-black">
                                <AlertCircle className="w-3 h-3 text-rose-600" />
                                مرفوض من الإدارة
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 text-slate-600 border border-slate-300 rounded-full text-[10px] font-bold">
                                ملغي
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            {isPending && (
                              <button
                                onClick={() => handleCancelAdRequest(ad.id)}
                                className="px-2.5 py-1 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
                              >
                                إلغاء الطلب
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUB-TAB 4: COUPONS & DISCOUNTS */}
      {activeTab === 'coupons' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                <Tag className="w-5 h-5 text-fuchsia-500" />
                إدارة الكوبونات والخصومات الترويجية (Promotions & Concurrency Guard)
              </h3>
              <p className="text-xs text-slate-400 font-bold mt-1">
                تصميم وتخصيص العروض والخصومات الذكية لمنشأتك مع ضبط شروط الحجز المبكر وقفل الخصم المتزامن.
              </p>
            </div>
            <button
              onClick={() => handleOpenPromoWizard()}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs cursor-pointer transition-all shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 flex items-center gap-2 shrink-0"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              تصميم وإطلاق عرض ترويجي جديد (بوابة العروض الذكية) 🚀
            </button>
          </div>

          {/* Coupons & Promotions List Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-black">
                <tr>
                  <th className="p-3">رقم الطلب والكود</th>
                  <th className="p-3">النمط وقيمة الخصم</th>
                  <th className="p-3">النوع والنطاق والفترة</th>
                  <th className="p-3">سياسة العمولة</th>
                  <th className="p-3">الاستخدام والقفل</th>
                  <th className="p-3 text-center">حالة الاعتماد والتوجيهات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-sans">
                {myPromotions.length > 0 ? myPromotions.map((c: any) => {
                  const isRejected = c.status === 'rejected' || c.status === 'needs_revision';
                  const isActive = c.status === 'active' || c.status === 'نشط';
                  const isPending = c.status === 'pending' || c.status?.includes('مراجعة');

                  return (
                    <tr key={c.id || c.couponCode || c.code} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3">
                        <span className="font-mono font-black text-slate-900 bg-slate-100/80 px-2.5 py-1 rounded-lg inline-block">
                          {c.couponCode || c.code || c.name}
                        </span>
                        {(c.srvNumber || c.id) && (
                          <p className="text-[10px] font-mono text-indigo-600 font-bold mt-1">
                            {c.srvNumber || `SRV-26-${String(c.id).padStart(10, '0')}`}
                          </p>
                        )}
                      </td>
                      <td className="p-3">
                        <p className="font-mono text-emerald-600 font-black text-sm">
                          {c.type === 'free_service' ? 'خدمة مجانية 🎁' : c.type === 'percentage' ? `${c.value || c.discount}%` : `${c.value || c.discount} ر.س`}
                        </p>
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                          {c.promotionPattern === 'early_bird' ? 'خصم الحجز المبكر ⏳' :
                           c.promotionPattern === 'bundle' ? 'باقة مشتركة 📦' :
                           c.promotionPattern === 'closed_package' ? 'حجز مغلق 🔒' : 'كود خصم / كوبون 🎫'}
                        </span>
                      </td>
                      <td className="p-3 text-slate-600">
                        <p className="font-bold">{c.type === 'free_service' ? 'إضافة مجانية' : c.type === 'percentage' ? 'نسبة مئوية' : 'مبلغ مقطوع'}</p>
                        <p className="text-[10px] text-slate-500 font-medium mt-0.5">
                          {c.scopeType === 'AllProviderHalls' ? 'شامل لجميع القاعات' : 
                           c.scopeType === 'SelectedHalls' ? `قاعات مخصصة (${(c.targetIds || []).length})` :
                           c.scopeType === 'SelectedServices' ? `خدمات مخصصة (${(c.targetIds || []).length})` : 'شامل'}
                        </p>
                        <div className="flex items-center gap-1 text-[10px] text-indigo-700 font-mono font-bold mt-1 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 w-fit">
                          <CalendarDays className="w-3 h-3 text-indigo-500 shrink-0" />
                          <span>من: {c.startDate || '2026-08-08'}</span>
                          <span>إلى: {c.endDate || '2026-12-31'}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-600">
                        {c.commissionPolicy === 'CommissionOnDiscountedPrice' ? (
                          <span className="bg-emerald-50 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded border border-emerald-200 block w-fit">
                            بعد الخصم (مشاركة المنصة)
                          </span>
                        ) : c.commissionPolicy === 'CommissionOnOriginalPrice' ? (
                          <span className="bg-amber-50 text-amber-800 text-[10px] font-black px-2 py-0.5 rounded border border-amber-200 block w-fit">
                            قبل الخصم (تحمل المزود)
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">بانتظار تحديد الإدارة</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{c.usageCount || 0} / {c.maxUsage || 100} مرة</td>
                      <td className="p-3 text-center">
                        <div className="flex flex-col items-center gap-1.5 min-w-[180px]">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black inline-flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : isPending
                              ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
                              : 'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              isActive ? 'bg-emerald-500' : isPending ? 'bg-amber-500' : 'bg-rose-500'
                            }`} />
                            {isActive ? 'معتمد ومفعل (نشط تلقائياً)' : isPending ? 'قيد المراجعة والاعتماد' : 'مرفوض / يتطلب التعديل'}
                          </span>

                          <button
                            onClick={() => handleOpenPromoWizard(c)}
                            className="w-full py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-200 transition-all flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                            {isRejected ? 'تعديل الطلب عبر بوابة العروض وإعادة التقديم' : 'عرض / تعديل التفاصيل في البوابة'}
                          </button>

                          {/* Admin Rejection Notes */}
                          {isRejected && (c.adminNotes || c.rejectionReason) && (
                            <div className="bg-rose-50/80 p-2.5 rounded-xl border border-rose-200 text-right w-full mt-1 space-y-1 shadow-sm">
                              <p className="text-[10px] text-rose-900 font-bold flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                                <span>ملاحظات وتوجيهات الإدارة:</span>
                              </p>
                              <p className="text-[11px] text-slate-800 bg-white p-2 rounded-lg border border-rose-100 font-medium leading-relaxed">
                                "{c.adminNotes || c.rejectionReason}"
                              </p>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">لا توجد كوبونات أو خصومات مضافة لهذه المنشأة حالياً.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Featured Smart Promotion Portal Card */}
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-3xl border border-indigo-900 shadow-xl space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-black">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>بوابة تصميم العروض والخصومات الذكية (Smart Promotion Portal)</span>
                </div>
                <h4 className="text-lg font-black text-white">
                  صمم عروضاً ترويجية متعددة الأنماط بكل احترافية
                </h4>
                <p className="text-xs text-indigo-200 max-w-2xl leading-relaxed">
                  تسمح لك البوابة بالتحكم الكامل في الخصومات: اختيار الأكواد، خصم الحجز المبكر، باقات الخدمات المشتركة، الخدمة الهديّة، تحديد نطاق تطبيق الخصم، وتحديد خيار العمولة المفضل مع تفعيل قفل الخصومات المتزامن (Concurrency Guard).
                </p>
              </div>
              <button
                onClick={() => handleOpenPromoWizard()}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-2xl text-xs shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                فتح بوابة تصميم العروض الآن
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 5: NEW CAMPAIGN WIZARD */}
      {activeTab === 'new_campaign' && (
        <div className="py-4">
          <ProviderMarketingWizard onSubmit={handleWizardCampaignSubmit} currentUserData={currentUser} />
        </div>
      )}

      {/* SMART PROMOTION DESIGN WIZARD MODAL */}
      {isPromoWizardOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl overflow-hidden max-h-[92vh] flex flex-col dir-rtl">
            
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 relative shrink-0">
              <button 
                onClick={() => setIsPromoWizardOpen(false)}
                className="absolute left-5 top-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 rounded-2xl border border-amber-500/30 text-amber-400">
                  <Percent className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">
                    {editingPromo ? 'تعديل وتحديث العرض الترويجي' : 'بوابة تصميم العروض والخصومات الذكية'}
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5 font-medium">
                    خطوات تخصيص وتجهيز العرض الترويجي الذكي للمنشأة ({currentProviderName})
                  </p>
                </div>
              </div>

              {/* Step Progress Bar */}
              <div className="grid grid-cols-4 gap-2 mt-6">
                {[
                  { step: 1, label: 'الأساسيات والنمط' },
                  { step: 2, label: 'النطاق والهدف' },
                  { step: 3, label: 'الشروط والقيود' },
                  { step: 4, label: 'الجدولة والاعتماد' }
                ].map((s) => (
                  <div key={s.step} className="space-y-1">
                    <div className={`h-1.5 rounded-full transition-all ${
                      s.step === promoWizardStep
                        ? 'bg-amber-400 shadow-sm shadow-amber-400/50'
                        : s.step < promoWizardStep
                        ? 'bg-emerald-400'
                        : 'bg-white/15'
                    }`} />
                    <p className={`text-[10px] font-bold text-center truncate ${
                      s.step === promoWizardStep ? 'text-amber-300 font-black' : 'text-slate-400'
                    }`}>
                      {s.step}. {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-800">

              {/* STEP 1: BASICS & PATTERN */}
              {promoWizardStep === 1 && (
                <div className="space-y-5">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 space-y-1">
                      <p className="font-black">خطوة 1: حدد اسم العرض ونمطه التشغيلي</p>
                      <p className="text-indigo-800 font-medium">تتيح لك المنصة إنشاء أنواع مختلفة من العروض الذكية لتلبية تطلعات العملاء وزيادة معدل الحجوزات.</p>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-slate-800 block mb-1.5">اسم العرض الترويجي *</label>
                    <input
                      type="text"
                      placeholder="مثال: خصم الحجز المبكر لشتاء 2026، عرض اليوم الوطني، كوبون القاعة الكبرى..."
                      value={promoFormData.name}
                      onChange={(e) => setPromoFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full p-3 border border-slate-200 rounded-xl text-xs font-bold outline-none focus:border-indigo-500 bg-slate-50/50"
                    />
                  </div>

                  {/* Promotion Pattern Selection */}
                  <div>
                    <label className="text-xs font-black text-slate-800 block mb-2">اختر نمط العرض الترويجي *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { id: 'promo_code', title: 'كود خصم / كوبون 🎫', desc: 'رمز تركيبي مخصص يمكن للعملاء إدخاله عند إتمام عملية الحجز' },
                        { id: 'early_bird', title: 'خصم الحجز المبكر ⏳', desc: 'تطبيق الخصم تلقائياً عند الحجز المسبق قبل موعد المناسبة بمدة كافية' },
                        { id: 'bundle', title: 'باقة الخدمات المشتركة 📦', desc: 'خصم تلقائي عند حجز قاعة مع حد أدنى من الخدمات المساندة' },
                        { id: 'closed_package', title: 'باقة الحجز المغلق 🔒', desc: 'عرض خاص لترقية حزم المناسبات بأسعار تنافسية مقطوعة' }
                      ].map((pattern) => (
                        <div
                          key={pattern.id}
                          onClick={() => setPromoFormData(prev => ({ ...prev, promotionPattern: pattern.id as any }))}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                            promoFormData.promotionPattern === pattern.id
                              ? 'bg-amber-50/80 border-amber-500 ring-2 ring-amber-500/20 shadow-sm'
                              : 'bg-white border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-xs font-black text-slate-900">{pattern.title}</p>
                          <p className="text-[11px] text-slate-500 font-medium mt-1 leading-relaxed">{pattern.desc}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Coupon Code Input if promo_code pattern */}
                  {promoFormData.promotionPattern === 'promo_code' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-amber-50/40 p-4 rounded-2xl border border-amber-200">
                      <div>
                        <label className="text-xs font-black text-amber-950 block mb-1">رمز الكود الترويجي (Promo Code) *</label>
                        <input
                          type="text"
                          placeholder="مثال: HALL2026"
                          value={promoFormData.couponCode}
                          onChange={(e) => setPromoFormData(prev => ({ ...prev, couponCode: e.target.value.toUpperCase() }))}
                          className="w-full p-2.5 border border-amber-300 bg-white rounded-xl text-xs font-mono font-black outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-black text-amber-950 block mb-1">الحد الأقصى لاستخدامات الكود</label>
                        <input
                          type="number"
                          value={promoFormData.usageLimit}
                          onChange={(e) => setPromoFormData(prev => ({ ...prev, usageLimit: Number(e.target.value) }))}
                          className="w-full p-2.5 border border-amber-300 bg-white rounded-xl text-xs font-mono font-bold outline-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Commission Policy Preference */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <label className="text-xs font-black text-slate-800 block">
                      سياسة احتساب عمولة المنصة عند الخصم (Commission Policy Preference) *
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <label className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-start gap-2 ${
                        promoFormData.commissionPolicy === 'CommissionOnDiscountedPrice'
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="commissionPolicy"
                          checked={promoFormData.commissionPolicy === 'CommissionOnDiscountedPrice'}
                          onChange={() => setPromoFormData(prev => ({ ...prev, commissionPolicy: 'CommissionOnDiscountedPrice' }))}
                          className="accent-emerald-600 mt-0.5"
                        />
                        <div>
                          <span className="font-black block">بعد الخصم (مشاركة المنصة)</span>
                          <span className="text-[10px] text-slate-500 font-normal">تقتطع عمولة المنصة من المبلغ الصافي الفعلي بعد تطبيق الخصم.</span>
                        </div>
                      </label>

                      <label className={`p-3 rounded-xl border text-xs font-bold cursor-pointer transition-all flex items-start gap-2 ${
                        promoFormData.commissionPolicy === 'CommissionOnOriginalPrice'
                          ? 'bg-amber-50 border-amber-500 text-amber-950'
                          : 'bg-white border-slate-200 text-slate-600'
                      }`}>
                        <input
                          type="radio"
                          name="commissionPolicy"
                          checked={promoFormData.commissionPolicy === 'CommissionOnOriginalPrice'}
                          onChange={() => setPromoFormData(prev => ({ ...prev, commissionPolicy: 'CommissionOnOriginalPrice' }))}
                          className="accent-amber-600 mt-0.5"
                        />
                        <div>
                          <span className="font-black block">قبل الخصم (تحمل المزود)</span>
                          <span className="text-[10px] text-slate-500 font-normal">تقتطع عمولة المنصة من السعر الأصلي للخدمة قبل الخصم.</span>
                        </div>
                      </label>
                    </div>
                  </div>

                  {/* Discount Type & Value */}
                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-800 block">نوع ومقدار الخصم الممنوح *</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'percentage', label: 'نسبة مئوية (%)' },
                        { id: 'fixed', label: 'مبلغ ثابت (ر.س)' },
                        { id: 'free_service', label: 'خدمة مجانية 🎁' }
                      ].map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setPromoFormData(prev => ({ ...prev, type: t.id as any }))}
                          className={`py-2.5 px-3 rounded-xl border text-xs font-black transition-all cursor-pointer ${
                            promoFormData.type === t.id
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    {promoFormData.type !== 'free_service' ? (
                      <div className="pt-2">
                        <label className="text-[11px] font-bold text-slate-600 block mb-1">
                          {promoFormData.type === 'percentage' ? 'نسبة الخصم المئوية (مثال: 15)' : 'مبلغ الخصم بالريال (مثال: 500)'}
                        </label>
                        <input
                          type="number"
                          value={promoFormData.value}
                          onChange={(e) => setPromoFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                          className="w-full p-3 border border-slate-200 rounded-xl text-sm font-mono font-black outline-none bg-slate-50/50"
                        />
                      </div>
                    ) : (
                      <div className="space-y-3 bg-purple-50/60 p-4 rounded-2xl border border-purple-200">
                        <div>
                          <label className="text-xs font-black text-purple-950 block mb-1">اختر الخدمة المجانية المضافة كهدية مع الحجز *</label>
                          <select
                            value={promoFormData.freeServiceId || ''}
                            onChange={(e) => setPromoFormData(prev => ({ ...prev, freeServiceId: e.target.value }))}
                            className="w-full p-2.5 border border-purple-300 bg-white rounded-xl text-xs font-bold outline-none"
                          >
                            <option value="">-- اختر خدمة مساندة مجانية --</option>
                            {services.filter((s: any) => s.providerName === currentProviderName || !s.providerName).map((srv: any) => (
                              <option key={srv.id} value={srv.id}>
                                {srv.name} ({srv.price || 0} ر.س)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-purple-900 block mb-1">الحد الأقصى لتغطية الخدمة المجانية بالريال (اختياري)</label>
                          <input
                            type="number"
                            placeholder="مثال: 300 ر.س"
                            value={promoFormData.maxFreeServiceValue || ''}
                            onChange={(e) => setPromoFormData(prev => ({ ...prev, maxFreeServiceValue: Number(e.target.value) }))}
                            className="w-full p-2.5 border border-purple-300 bg-white rounded-xl text-xs font-mono outline-none"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* STEP 2: SCOPE & TARGET SELECTION */}
              {promoWizardStep === 2 && (
                <div className="space-y-5">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <TargetIcon className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 space-y-1">
                      <p className="font-black">خطوة 2: حدد نطاق سريان العرض الترويجي</p>
                      <p className="text-indigo-800 font-medium">يمكنك تطبيق العرض على جميع قاعات ومرافق منشأتك، أو اختصاره على قاعات أو خدمات محددة بعينها.</p>
                    </div>
                  </div>

                  {/* Scope Type Toggle */}
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setPromoFormData(prev => ({ ...prev, applyTo: 'halls', targetIds: [] }))}
                      className={`flex-1 py-3 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        promoFormData.applyTo === 'halls'
                          ? 'bg-amber-500 text-slate-950 border-amber-500 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-4 h-4" />
                      تطبيق على القاعات والمرافق
                    </button>

                    <button
                      type="button"
                      onClick={() => setPromoFormData(prev => ({ ...prev, applyTo: 'services', targetIds: [] }))}
                      className={`flex-1 py-3 px-4 rounded-2xl border text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                        promoFormData.applyTo === 'services'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <Tag className="w-4 h-4" />
                      تطبيق على الخدمات المساندة
                    </button>
                  </div>

                  {/* All vs Custom Toggle */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black text-slate-800">
                        {promoFormData.applyTo === 'halls' ? 'القاعات المشمولة بالعرض:' : 'الخدمات المساندة المشمولة بالعرض:'}
                      </p>
                      <button
                        type="button"
                        onClick={() => setPromoFormData(prev => ({ ...prev, targetIds: [] }))}
                        className={`text-[11px] font-bold px-3 py-1 rounded-lg border transition-all cursor-pointer ${
                          promoFormData.targetIds.length === 0
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {promoFormData.targetIds.length === 0 ? '✓ مجمع وشامل لكل العناصر' : 'تحديد الكل (تطبيق شامل)'}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto p-1">
                      {promoFormData.applyTo === 'halls' ? (
                        halls.filter((h: any) => h.providerName === currentProviderName || !h.providerName).map((hall: any) => {
                          const isSelected = promoFormData.targetIds.includes(hall.id);
                          return (
                            <div
                              key={hall.id}
                              onClick={() => {
                                setPromoFormData(prev => {
                                  const exists = prev.targetIds.includes(hall.id);
                                  return {
                                    ...prev,
                                    targetIds: exists ? prev.targetIds.filter(id => id !== hall.id) : [...prev.targetIds, hall.id]
                                  };
                                });
                              }}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-amber-50 border-amber-500 font-black text-amber-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={isSelected} readOnly className="accent-amber-500" />
                                <span className="truncate">{hall.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{formatCurrency(hall.price || hall.pricePerDay || 0)}</span>
                            </div>
                          );
                        })
                      ) : (
                        services.filter((s: any) => s.providerName === currentProviderName || !s.providerName).map((srv: any) => {
                          const isSelected = promoFormData.targetIds.includes(srv.id);
                          return (
                            <div
                              key={srv.id}
                              onClick={() => {
                                setPromoFormData(prev => {
                                  const exists = prev.targetIds.includes(srv.id);
                                  return {
                                    ...prev,
                                    targetIds: exists ? prev.targetIds.filter(id => id !== srv.id) : [...prev.targetIds, srv.id]
                                  };
                                });
                              }}
                              className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                                isSelected
                                  ? 'bg-purple-50 border-purple-500 font-black text-purple-950'
                                  : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input type="checkbox" checked={isSelected} readOnly className="accent-purple-500" />
                                <span className="truncate">{srv.name}</span>
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 font-bold">{formatCurrency(srv.price || 0)}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: SMART CONDITIONS & CONCURRENCY GUARD */}
              {promoWizardStep === 3 && (
                <div className="space-y-5">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 space-y-1">
                      <p className="font-black">خطوة 3: الشروط والأحكام الذكية وقفل الخصم المتزامن (Concurrency Guard)</p>
                      <p className="text-indigo-800 font-medium">قم بضبط شروط الاستفادة لتأمين حمايتك المالية وضمان الاستفادة الحقيقية دون أي تضارب تشغيلي.</p>
                    </div>
                  </div>

                  {/* Early Bird Condition */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!promoFormData.conditions?.earlyBird}
                        onChange={(e) => setPromoFormData(prev => ({
                          ...prev,
                          conditions: {
                            ...prev.conditions,
                            earlyBird: e.target.checked ? 30 : undefined
                          }
                        }))}
                        className="accent-indigo-600 w-4 h-4"
                      />
                      <span>اشتراط الحجز المبكر (Early Bird Booking Rule)</span>
                    </label>

                    {promoFormData.conditions?.earlyBird !== undefined && (
                      <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-600">الحد الأدنى للأيام قبل الموعد:</span>
                        <input
                          type="number"
                          value={promoFormData.conditions.earlyBird}
                          onChange={(e) => setPromoFormData(prev => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              earlyBird: Number(e.target.value)
                            }
                          }))}
                          className="p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold w-28 text-center bg-white"
                        />
                        <span className="text-xs font-bold text-slate-500">يوماً قبل تاريخ المناسبة</span>
                      </div>
                    )}
                  </div>

                  {/* Bundle Minimum Services Count */}
                  <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black text-slate-900 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!promoFormData.conditions?.bundleCount}
                        onChange={(e) => setPromoFormData(prev => ({
                          ...prev,
                          conditions: {
                            ...prev.conditions,
                            bundleCount: e.target.checked ? 2 : undefined
                          }
                        }))}
                        className="accent-purple-600 w-4 h-4"
                      />
                      <span>اشتراط حد أدنى من الخدمات المساندة المرفقة (Bundle Rule)</span>
                    </label>

                    {promoFormData.conditions?.bundleCount !== undefined && (
                      <div className="pt-2 border-t border-slate-200 flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-600">الحد الأدنى للخدمات المطلوبة:</span>
                        <input
                          type="number"
                          value={promoFormData.conditions.bundleCount}
                          onChange={(e) => setPromoFormData(prev => ({
                            ...prev,
                            conditions: {
                              ...prev.conditions,
                              bundleCount: Number(e.target.value)
                            }
                          }))}
                          className="p-2 border border-slate-300 rounded-xl text-xs font-mono font-bold w-28 text-center bg-white"
                        />
                        <span className="text-xs font-bold text-slate-500">خدمات مساندة مع القاعة</span>
                      </div>
                    )}
                  </div>

                  {/* Concurrency Guard Notice */}
                  <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-xs text-amber-950 space-y-1">
                    <p className="font-black flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      ميزة قفل الخصومات المتزامن (Concurrency Guard Active):
                    </p>
                    <p className="text-amber-900 font-medium leading-relaxed">
                      يضمن النظام تلقائياً عدم دموج الخصومات أو التضارب مع عروض أخرى مفعلة لمنع الخسائر المالية غير المحسوبة أثناء قيام العميل بالحجز عبر المنصة.
                    </p>
                  </div>
                </div>
              )}

              {/* STEP 4: SCHEDULING, SPONSORED ADS & DISCLAIMER */}
              {promoWizardStep === 4 && (
                <div className="space-y-5">
                  <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 flex items-start gap-3">
                    <CalendarDays className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="text-xs text-indigo-950 space-y-1">
                      <p className="font-black">خطوة 4: الفترة الزمنية والتسويق والإقرار المالي</p>
                      <p className="text-indigo-800 font-medium">حدد تاريخ تفعيل وانتهاء العرض، ويمكنك اختيار ربط العرض بحملة إعلانية ممولة للوصول السريع للعملاء.</p>
                    </div>
                  </div>

                  {/* Date Range Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="text-xs font-black text-slate-800 block mb-1">تاريخ بدء تفعيل الخصم *</label>
                      <input
                        type="date"
                        value={promoFormData.startDate}
                        onChange={(e) => setPromoFormData(prev => ({ ...prev, startDate: e.target.value }))}
                        className="w-full p-3 border border-slate-300 bg-white rounded-xl text-xs font-mono font-bold outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-slate-800 block mb-1">تاريخ انتهاء صلاحية الخصم *</label>
                      <input
                        type="date"
                        value={promoFormData.endDate}
                        onChange={(e) => setPromoFormData(prev => ({ ...prev, endDate: e.target.value }))}
                        className="w-full p-3 border border-slate-300 bg-white rounded-xl text-xs font-mono font-bold outline-none"
                      />
                    </div>
                  </div>

                  {/* Sponsored Ad Campaign Option */}
                  <label className="p-4 rounded-2xl border border-indigo-200 bg-indigo-50/60 flex items-start gap-3 cursor-pointer transition-all hover:bg-indigo-50">
                    <input
                      type="checkbox"
                      checked={promoFormData.hasAdCampaign}
                      onChange={(e) => setPromoFormData(prev => ({ ...prev, hasAdCampaign: e.target.checked }))}
                      className="accent-indigo-600 w-4 h-4 mt-0.5"
                    />
                    <div className="text-xs text-indigo-950 space-y-1">
                      <p className="font-black flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-indigo-600" />
                        طلب ربط العرض بحملة إعلانية ترويجية ممولة فورية (Ad Campaign)
                      </p>
                      <p className="text-indigo-800 font-medium leading-relaxed">
                        عند التفعيل، سيقوم النظام تلقائياً بإنشاء طلب إعلان ممتاز وتمريره إلى إدارة المنصة مع توليد رقم طلب خدمة قياسي (SRV) لربطه بصفحة العروض المميزة.
                      </p>
                    </div>
                  </label>

                  {/* Financial Responsibility Disclaimer */}
                  <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 text-xs text-rose-950 space-y-1.5">
                    <p className="font-black flex items-center gap-1.5 text-rose-900">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                      تنبيه مالي مهم ومسؤولية قانونية:
                    </p>
                    <p className="text-rose-900/90 font-medium leading-relaxed">
                      يتحمل مزود الخدمة التكلفة المالية الكاملة للخصم الممنوح للعملاء (ما لم يتم الاتفاق كتابياً مع إدارة المنصة على تقديم خصم مشترك)، وتخضع كافة العروض لمراجعة واعتماد الإدارة قبل ظهورها للعملاء.
                    </p>
                  </div>
                </div>
              )}

            </div>

            {/* Modal Footer Controls */}
            <div className="bg-slate-50 p-5 border-t border-slate-200 flex items-center justify-between shrink-0">
              {promoWizardStep > 1 ? (
                <button
                  type="button"
                  onClick={() => setPromoWizardStep(prev => prev - 1)}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-black rounded-xl text-xs transition-all cursor-pointer"
                >
                  السابق
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsPromoWizardOpen(false)}
                  className="px-5 py-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-600 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              )}

              {promoWizardStep < 4 ? (
                <button
                  type="button"
                  onClick={() => {
                    if (promoWizardStep === 1 && !promoFormData.name.trim()) {
                      showNotification('warning', 'يرجى كتابة اسم العرض الترويجي قبل الانتقال.');
                      return;
                    }
                    if (promoWizardStep === 1 && promoFormData.promotionPattern === 'promo_code' && !promoFormData.couponCode.trim()) {
                      showNotification('warning', 'يرجى تعبئة رمز الكود الترويجي.');
                      return;
                    }
                    setPromoWizardStep(prev => prev + 1);
                  }}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <span>التالي</span>
                  <ChevronRight className="w-4 h-4 rotate-180" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSavePromoWizard}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4 text-slate-950" />
                  {editingPromo ? 'تحديث وإعادة تقديم العرض للإدارة' : 'إرسال طلب العرض الترويجي للاعتماد'}
                </button>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

function TargetIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  );
}

