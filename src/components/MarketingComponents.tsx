import React, { useState, useEffect } from 'react';
import { 
  Megaphone, Plus, Search, MessageSquare, Mail, Share2, Bell, Eye, Pencil, 
  CheckCircle2, FileText, Target, CalendarDays, Wallet, Banknote, Activity, 
  X, ShieldCheck, Percent, Power, Trash2, Users, Send, AlertCircle, XCircle,
  ArrowRight, ArrowLeft, ChevronRight, ChevronLeft, MoveRight, MoveLeft,
  Sparkles, ExternalLink, Copy, Check, BarChart2, TrendingUp, Layers, 
  Filter, Clock, Globe, Sliders, Download, RefreshCw, Smartphone, Monitor,
  SlidersHorizontal, CheckSquare, Printer, Wand2, Wifi, Zap
} from 'lucide-react';
import { getLPASPages } from '../data/lpasData';
import { AdRequestProviderWizard, AdRequestsTable } from './AdRequestProviderWizard';
import { AdPlatformsApiSyncView } from './growth/AdPlatformsApiSyncView';
import { CampaignNotificationManager } from './growth/CampaignNotificationManager';
import { AiCopywritingStudioModal } from './growth/AiCopywritingStudioModal';
import { ExecutiveReportModal } from './growth/ExecutiveReportModal';
export { AdRequestProviderWizard, AdRequestsTable };

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount || 0);
};

export const AgencyMarketingView = ({ campaigns = [], setCampaigns, setActiveTab, marketingCommissionPercentage = 20 }: any) => {
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'kanban' | 'master' | 'expenses' | 'lpas_link' | 'agreements' | 'api_integrations' | 'notifications' | 'ai_copywriter'>('kanban');
  const mComm = marketingCommissionPercentage || 20;

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterChannel, setFilterChannel] = useState('all');
  const [filterProvider, setFilterProvider] = useState('all');
  const [filterStage, setFilterStage] = useState('all');

  // Drag and Drop state
  const [draggedCardId, setDraggedCardId] = useState<number | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Modals state
  const [selectedCampaignForDetails, setSelectedCampaignForDetails] = useState<any | null>(null);
  const [selectedCampaignForEdit, setSelectedCampaignForEdit] = useState<any | null>(null);
  const [selectedCampaignForExecutiveReport, setSelectedCampaignForExecutiveReport] = useState<any | null>(null);
  const [isAiCopywriterOpen, setIsAiCopywriterOpen] = useState(false);
  const [isNewCampaignModalOpen, setIsNewCampaignModalOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState<string | null>(null);

  // Expense form state
  const [expenseCampaignId, setExpenseCampaignId] = useState<number | string>('');
  const [expenseAmount, setExpenseAmount] = useState<number | string>('');
  const [expensePlatform, setExpensePlatform] = useState('سناب شات');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseRef, setExpenseRef] = useState('');
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const lpasPages = getLPASPages ? getLPASPages() : [];

  // 5 Canonical Kanban Stages
  const KANBAN_STAGES = [
    { 
      id: 'تحت التجهيز والتصميم', 
      label: '1. تحت التجهيز والتصميم', 
      shortLabel: 'تجهيز وتصميم', 
      desc: 'إعداد المحتوى الإعلاني، تحديد الجمهور، وربط صفحات الهبوط',
      color: 'border-indigo-400 text-indigo-700 bg-indigo-50/50', 
      badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' 
    },
    { 
      id: 'بانتظار موافقة المزود', 
      label: '2. بانتظار موافقة المزود', 
      shortLabel: 'موافقة المزود', 
      desc: 'مراجعة الميزانية والعرض الإعلاني مع الشريك/المزود',
      color: 'border-amber-400 text-amber-700 bg-amber-50/50', 
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' 
    },
    { 
      id: 'تمت الجدولة والإطلاق', 
      label: '3. تمت الجدولة والإطلاق', 
      shortLabel: 'جدولة وإطلاق', 
      desc: 'تهيئة مدراء الإعلانات، بكسل التتبع، وجدولة البث',
      color: 'border-blue-400 text-blue-700 bg-blue-50/50', 
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    { 
      id: 'بث مباشر وتتبع النتائج', 
      label: '4. بث مباشر وتتبع النتائج', 
      shortLabel: 'بث مباشر (Live)', 
      desc: 'حملات نشطة ومباشرة مع تتبع معدل التحويل والعائد ROAS',
      color: 'border-emerald-400 text-emerald-700 bg-emerald-50/50', 
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' 
    },
    { 
      id: 'مكتملة ومؤرشفة', 
      label: '5. مكتملة ومؤرشفة', 
      shortLabel: 'مكتملة ومؤرشفة', 
      desc: 'انتهاء فترة البث، مطابقة المصروفات، وتصدير التقارير النهائية',
      color: 'border-slate-300 text-slate-700 bg-slate-50/50', 
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-200' 
    }
  ];

  // Helper function to normalize workflow status
  const getNormalizedStage = (c: any) => {
    const ws = c.workflowStatus || '';
    if (ws.includes('تجهيز') || ws === 'تحت التجهيز') return 'تحت التجهيز والتصميم';
    if (ws.includes('موافقة') || ws === 'بانتظار موافقة العميل') return 'بانتظار موافقة المزود';
    if (ws.includes('جدولة') || ws === 'تمت الجدولة') return 'تمت الجدولة والإطلاق';
    if (ws.includes('مباشر') || ws.includes('نتائج') || ws === 'نشطة') return 'بث مباشر وتتبع النتائج';
    if (ws.includes('مكتمل') || ws === 'مكتملة') return 'مكتملة ومؤرشفة';
    return 'تحت التجهيز والتصميم';
  };

  // Metrics Calculations
  const totalBudget = campaigns.reduce((sum: number, c: any) => sum + (c.adBudget || c.budget || 0), 0);
  const totalSpent = campaigns.reduce((sum: number, c: any) => sum + (c.spent || 0), 0);
  const availableBudget = Math.max(0, totalBudget - totalSpent);
  const totalAgencyFees = campaigns.reduce((sum: number, c: any) => sum + (c.agencyFee || 0), 0);
  const lailahCommission = totalAgencyFees * (mComm / 100);
  const agencyNetProfit = totalAgencyFees - lailahCommission;
  const activeCampaigns = campaigns.filter((c: any) => c.status === 'نشطة' || getNormalizedStage(c) === 'بث مباشر وتتبع النتائج').length;
  const totalReach = campaigns.reduce((sum: number, c: any) => sum + (c.reach || 0), 0);
  const totalConversions = campaigns.reduce((sum: number, c: any) => sum + (c.conversions || 0), 0);
  const avgRoas = campaigns.length ? (campaigns.reduce((sum: number, c: any) => sum + (c.roas || 4.5), 0) / campaigns.length).toFixed(1) : '5.2';

  // Providers list for filtering
  const uniqueProviders = Array.from(new Set(campaigns.map((c: any) => c.providerName).filter(Boolean)));

  // Filtered campaigns for Kanban / Master sheet
  const filteredCampaigns = campaigns.filter((c: any) => {
    const stage = getNormalizedStage(c);
    const matchesSearch = !searchQuery.trim() || 
      (c.title && c.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.providerName && c.providerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (c.channel && c.channel.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesChannel = filterChannel === 'all' || (c.channel && c.channel.includes(filterChannel)) || (c.type && c.type.includes(filterChannel));
    const matchesProvider = filterProvider === 'all' || c.providerName === filterProvider;
    const matchesStage = filterStage === 'all' || stage === filterStage;
    return matchesSearch && matchesChannel && matchesProvider && matchesStage;
  });

  // Action: Move card to target stage
  const handleMoveCard = (campaignId: number, targetStage: string) => {
    setCampaigns((prev: any[]) => {
      return prev.map((c: any) => {
        if (c.id === campaignId) {
          const newStatus = (targetStage === 'مكتملة ومؤرشفة') ? 'مكتملة' : 'نشطة';
          return {
            ...c,
            workflowStatus: targetStage,
            status: newStatus,
            lastMovedAt: new Date().toISOString()
          };
        }
        return c;
      });
    });

    const targetStageObj = KANBAN_STAGES.find(s => s.id === targetStage);
    showNotice('success', `تم نقل الحملة بنجاح إلى مرحلة: ${targetStageObj?.shortLabel || targetStage}`);
  };

  // Action: Move card Forward
  const handleMoveNext = (c: any) => {
    const currentStage = getNormalizedStage(c);
    const currentIndex = KANBAN_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex < KANBAN_STAGES.length - 1) {
      const nextStage = KANBAN_STAGES[currentIndex + 1].id;
      handleMoveCard(c.id, nextStage);
    }
  };

  // Action: Move card Backward
  const handleMovePrev = (c: any) => {
    const currentStage = getNormalizedStage(c);
    const currentIndex = KANBAN_STAGES.findIndex(s => s.id === currentStage);
    if (currentIndex > 0) {
      const prevStage = KANBAN_STAGES[currentIndex - 1].id;
      handleMoveCard(c.id, prevStage);
    }
  };

  const showNotice = (type: 'success' | 'error', text: string) => {
    setNotificationMsg({ type, text });
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // Action: Log Expense
  const handleLogExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(expenseAmount);
    if (!expenseCampaignId || isNaN(amountNum) || amountNum <= 0) {
      showNotice('error', 'يرجى اختيار الحملة وتحديد مبلغ صرف صحيح.');
      return;
    }

    const targetCamp = campaigns.find((c: any) => c.id === Number(expenseCampaignId));
    if (!targetCamp) {
      showNotice('error', 'الحملة المحددة غير موجودة.');
      return;
    }

    const currentSpent = targetCamp.spent || 0;
    const campBudget = targetCamp.adBudget || targetCamp.budget || 0;
    const newSpent = currentSpent + amountNum;

    const newExpenseRecord = {
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      amount: amountNum,
      platform: expensePlatform,
      description: expenseDescription.trim() || `مصروف إعلاني على ${expensePlatform}`,
      reference: expenseRef.trim() || `EXP-${Date.now().toString().slice(-6)}`
    };

    setCampaigns((prev: any[]) => prev.map((c: any) => {
      if (c.id === Number(expenseCampaignId)) {
        const history = c.expensesHistory || [];
        return {
          ...c,
          spent: newSpent,
          expensesHistory: [newExpenseRecord, ...history]
        };
      }
      return c;
    }));

    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseRef('');
    showNotice('success', `تم تسجيل المصروف بقيمة ${formatCurrency(amountNum)} للحملة بنجاح.`);
  };

  // Action: Copy LPAS Campaign Link
  const handleCopyLpasLink = (slug: string, campaignId: number) => {
    const link = `${window.location.origin}/landing/${slug}?utm_source=lailah_agency&utm_campaign=cmp_${campaignId}&utm_medium=paid_media`;
    navigator.clipboard.writeText(link);
    setCopiedLink(`${slug}-${campaignId}`);
    setTimeout(() => setCopiedLink(null), 2500);
    showNotice('success', 'تم نسخ رابط الحملة وتتبع التحويلات بنجاح!');
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner / Agency Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute -left-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black border border-amber-500/30 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              وكالة ليلة الرقمية المعتمدة (Certified Growth Agency)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/30">
              عمولة سيادية {mComm}% على الأتعاب فقط
            </span>
          </div>
          <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <span>لوحة إدارة الحملات وسير العمل (Kanban Engine)</span>
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
            التحكم الشامل في بث الحملات الإعلانية، سير العمل التفاعلي، تدفق الميزانيات، وتتبع العائد على الإنفاق بالربط مع محرك صفحات الهبوط LPAS.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
          <button
            onClick={() => setIsAiCopywriterOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer grow lg:grow-0"
          >
            <Wand2 className="w-4 h-4 text-amber-300" />
            <span>مولّد النصوص الذكي 🪄</span>
          </button>
          <button
            onClick={() => setIsNewCampaignModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all shadow-md hover:shadow-amber-500/20 flex items-center justify-center gap-2 cursor-pointer grow lg:grow-0"
          >
            <Plus className="w-4 h-4" />
            <span>إطلاق حملة وكالة جديدة</span>
          </button>
          <button
            onClick={() => setActiveSubTab('expenses')}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all border border-white/15 flex items-center justify-center gap-2 cursor-pointer"
          >
            <Banknote className="w-4 h-4 text-emerald-400" />
            <span>تسجيل صرف مباشر</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border transition-all animate-in fade-in slide-in-from-top-2 ${
          notificationMsg.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-200' 
            : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2.5">
            {notificationMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-xs sm:text-sm font-bold">{notificationMsg.text}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex items-center space-x-1 space-x-reverse border-b border-slate-200 overflow-x-auto no-scrollbar pb-1 bg-white p-2 rounded-2xl shadow-xs">
        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'kanban' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('kanban')}
        >
          <Layers className="w-4 h-4" />
          <span>سير العمل التفاعلي (Kanban)</span>
          <span className="px-1.5 py-0.5 rounded-full bg-slate-900/10 text-[10px] font-black">{campaigns.length}</span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'overview' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('overview')}
        >
          <BarChart2 className="w-4 h-4" />
          <span>المؤشرات والنظرة العامة</span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'api_integrations' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('api_integrations')}
        >
          <Zap className="w-4 h-4 text-indigo-600" />
          <span>الربط البرمجي للمنصات (Live APIs)</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'notifications' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('notifications')}
        >
          <Bell className="w-4 h-4" />
          <span>أتمتة الإشعارات (WhatsApp & Email)</span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'ai_copywriter' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('ai_copywriter')}
        >
          <Wand2 className="w-4 h-4 text-purple-600" />
          <span>مولّد الإعلانات والنصوص 🪄</span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'master' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('master')}
        >
          <FileText className="w-4 h-4" />
          <span>الجدول الموحد (Master Sheet)</span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'expenses' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('expenses')}
        >
          <Banknote className="w-4 h-4" />
          <span>المصروفات والميزانيات</span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'lpas_link' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('lpas_link')}
        >
          <Target className="w-4 h-4" />
          <span>محرك صفحات الهبوط (LPAS)</span>
        </button>

        <button
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
            activeSubTab === 'agreements' 
              ? 'bg-amber-500 text-slate-950 shadow-xs' 
              : 'text-slate-600 hover:bg-slate-100'
          }`}
          onClick={() => setActiveSubTab('agreements')}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>اتفاقية الوكالة والعمولة ({mComm}%)</span>
        </button>
      </div>

      {/* 1. OVERVIEW SUB-TAB */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6 animate-in fade-in">
          {/* Main KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:border-amber-400 transition-all">
              <div className="w-12 h-12 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                <Megaphone className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">الحملات النشطة / الحية</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{activeCampaigns} <span className="text-xs font-bold text-slate-400">حملة</span></h3>
                <p className="text-[10px] text-emerald-600 font-bold mt-0.5">من أصل {campaigns.length} حملة مسجلة</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:border-purple-400 transition-all">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">الميزانية الإعلانية المباشرة</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(totalBudget)}</h3>
                <p className="text-[10px] text-purple-600 font-bold mt-0.5">تم صرف: {formatCurrency(totalSpent)}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:border-emerald-400 transition-all">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                <Banknote className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">أتعاب الوكالة الصافية</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{formatCurrency(agencyNetProfit)}</h3>
                <p className="text-[10px] text-amber-600 font-bold mt-0.5">عمولة ليلة: {formatCurrency(lailahCommission)}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200/80 flex items-center gap-4 hover:border-blue-400 transition-all">
              <div className="w-12 h-12 bg-blue-500/10 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-bold">متوسط العائد الإعلاني (ROAS)</p>
                <h3 className="text-2xl font-black text-slate-900 mt-0.5">{avgRoas}x</h3>
                <p className="text-[10px] text-blue-600 font-bold mt-0.5">{totalConversions.toLocaleString('ar-SA')} تحويل مؤكد</p>
              </div>
            </div>
          </div>

          {/* Quick Channels & LPAS Attribution Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-xs border border-slate-200/80 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-500" />
                  <span>توزيع القنوات الإعلانية المعتمدة والأداء</span>
                </h3>
                <span className="text-xs text-slate-400 font-bold">معدل التحويل ومتوسط CPA</span>
              </div>

              <div className="space-y-3">
                {[
                  { channel: 'سناب شات (Snapchat Ads & Filters)', budget: 15000, spent: 12200, roas: '5.2x', cpa: '32 ر.س', color: 'bg-amber-400' },
                  { channel: 'تيك توك وإنستغرام (Shorts & Reels)', budget: 18000, spent: 9500, roas: '6.4x', cpa: '28 ر.س', color: 'bg-rose-500' },
                  { channel: 'جوجل سيرش ومابز (Google Search & Maps)', budget: 8000, spent: 6500, roas: '4.8x', cpa: '42 ر.س', color: 'bg-blue-500' },
                  { channel: 'بوابة رسائل SMS والمؤثرين', budget: 14000, spent: 11000, roas: '7.1x', cpa: '24 ر.س', color: 'bg-emerald-500' },
                ].map((item, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="space-y-1">
                      <span className="text-xs font-extrabold text-slate-800">{item.channel}</span>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-medium">
                        <span>الميزانية: <strong className="text-slate-800">{formatCurrency(item.budget)}</strong></span>
                        <span>تم صرف: <strong className="text-rose-600">{formatCurrency(item.spent)}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold">ROAS {item.roas}</span>
                      <span className="px-2 py-1 rounded-lg bg-blue-100 text-blue-800 font-bold">CPA {item.cpa}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-6 rounded-2xl text-white shadow-md border border-indigo-900/50 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-black text-white">محرك صفحات الهبوط (LPAS)</h4>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed mb-4">
                  توجيه حركة الزوار المدفوعة إلى صفحات هبوط مخصصة وموجهة حسب المدينة والفئة لرفع معدل التحويل (Conversion Rate).
                </p>
                <div className="p-3 rounded-xl bg-white/10 border border-white/10 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>الصفحات المتاحة:</span>
                    <strong className="text-white">{lpasPages.length} صفحة</strong>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>معدل التحويل المستهدف:</span>
                    <strong className="text-amber-300">12% - 18%</strong>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveSubTab('lpas_link')}
                className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>استعراض وربط صفحات الهبوط</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. KANBAN SUB-TAB (CORE REQUIREMENT) */}
      {activeSubTab === 'kanban' && (
        <div className="space-y-4 animate-in fade-in">
          {/* Kanban Filter and Search Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row justify-between items-stretch md:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث باسم الحملة، المزود، أو القناة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={filterProvider}
                onChange={(e) => setFilterProvider(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-hidden focus:border-amber-500"
              >
                <option value="all">جميع المزودين</option>
                {uniqueProviders.map((p: any, idx) => (
                  <option key={idx} value={p}>{p}</option>
                ))}
              </select>

              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-hidden focus:border-amber-500"
              >
                <option value="all">جميع القنوات</option>
                <option value="سناب شات">سناب شات</option>
                <option value="تيك توك">تيك توك وإنستغرام</option>
                <option value="Google">جوجل سيرش ومابز</option>
                <option value="SMS">رسائل SMS</option>
              </select>

              <select
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:outline-hidden focus:border-amber-500"
              >
                <option value="all">جميع المراحل (5)</option>
                {KANBAN_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.shortLabel}</option>
                ))}
              </select>

              {(searchQuery || filterProvider !== 'all' || filterChannel !== 'all' || filterStage !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setFilterProvider('all');
                    setFilterChannel('all');
                    setFilterStage('all');
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>إعادة تعيين</span>
                </button>
              )}
            </div>
          </div>

          {/* Kanban Columns Grid with Drag & Drop & Action Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-start overflow-x-auto pb-4 pt-1">
            {KANBAN_STAGES.map((stage, stageIndex) => {
              const stageCampaigns = filteredCampaigns.filter((c: any) => getNormalizedStage(c) === stage.id);
              const isDragOver = dragOverColumn === stage.id;

              return (
                <div
                  key={stage.id}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColumn(stage.id);
                  }}
                  onDragLeave={() => setDragOverColumn(null)}
                  onDrop={(e) => {
                    e.preventDefault();
                    const cid = Number(e.dataTransfer.getData('text/plain') || draggedCardId);
                    if (cid) {
                      handleMoveCard(cid, stage.id);
                    }
                    setDragOverColumn(null);
                    setDraggedCardId(null);
                  }}
                  className={`rounded-2xl border transition-all duration-200 flex flex-col min-h-[580px] ${
                    isDragOver 
                      ? 'bg-amber-50/70 border-amber-400 ring-2 ring-amber-400/50 shadow-md' 
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  {/* Column Header */}
                  <div className={`p-3.5 rounded-t-2xl border-b bg-white ${stage.color} flex flex-col gap-1`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-black text-xs sm:text-sm flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-current"></span>
                        <span>{stage.label}</span>
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-[11px] font-black ${stage.badgeColor}`}>
                        {stageCampaigns.length}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 line-clamp-1">{stage.desc}</p>
                  </div>

                  {/* Column Body / Cards List */}
                  <div className="p-2.5 space-y-3 flex-1 overflow-y-auto max-h-[640px] no-scrollbar">
                    {stageCampaigns.length === 0 ? (
                      <div className="py-12 px-4 text-center border border-dashed border-slate-200 rounded-xl bg-white/50">
                        <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2 opacity-50" />
                        <p className="text-xs text-slate-400 font-medium">لا توجد بطاقات في هذه المرحلة</p>
                        <p className="text-[10px] text-slate-400 mt-1">اسحب أي بطاقة هنا أو انقلها مباشرة</p>
                      </div>
                    ) : (
                      stageCampaigns.map((c: any) => {
                        const campBudget = c.adBudget || c.budget || 0;
                        const campSpent = c.spent || 0;
                        const spendPct = campBudget > 0 ? Math.min(100, Math.round((campSpent / campBudget) * 100)) : 0;
                        const isDragging = draggedCardId === c.id;

                        return (
                          <div
                            key={c.id}
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData('text/plain', String(c.id));
                              setDraggedCardId(c.id);
                            }}
                            onDragEnd={() => setDraggedCardId(null)}
                            className={`bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs hover:shadow-md transition-all duration-200 space-y-3 cursor-grab active:cursor-grabbing hover:border-amber-400 ${
                              isDragging ? 'opacity-40 scale-95' : 'opacity-100'
                            }`}
                          >
                            {/* Card Top: Provider & Channel */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60 block truncate max-w-[170px]">
                                  {c.providerName || 'مزود خدمة معتمد'}
                                </span>
                                <h4 className="font-black text-slate-900 text-xs sm:text-sm line-clamp-1 mt-1 leading-snug">
                                  {c.title}
                                </h4>
                              </div>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold shrink-0">
                                {c.channel || c.type || 'متعدد'}
                              </span>
                            </div>

                            {/* Core Message / Content Excerpt */}
                            {c.content && (
                              <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {c.content}
                              </p>
                            )}

                            {/* Budget Progress Bar */}
                            <div className="space-y-1 pt-1">
                              <div className="flex justify-between items-center text-[10px] font-bold">
                                <span className="text-slate-500">الصرف: <strong className="text-slate-900">{formatCurrency(campSpent)}</strong></span>
                                <span className="text-purple-700">الميزانية: {formatCurrency(campBudget)}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div
                                  className={`h-full transition-all duration-500 ${
                                    spendPct > 90 ? 'bg-rose-500' : spendPct > 60 ? 'bg-amber-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${spendPct}%` }}
                                />
                              </div>
                            </div>

                            {/* Performance metrics pill */}
                            <div className="grid grid-cols-3 gap-1 pt-1 text-center text-[10px]">
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span className="text-slate-400 block">CPA</span>
                                <strong className="text-slate-800 font-mono">{c.cpa || 30} ر.س</strong>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span className="text-slate-400 block">ROAS</span>
                                <strong className="text-emerald-700 font-mono">{c.roas || 4.5}x</strong>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-100">
                                <span className="text-slate-400 block">تحويلات</span>
                                <strong className="text-blue-700 font-mono">{c.conversions || 0}</strong>
                              </div>
                            </div>

                            {/* LPAS Page Link Badge */}
                            {c.lpasPageSlug && (
                              <div className="flex items-center justify-between gap-1 p-1.5 bg-indigo-50/70 border border-indigo-100 rounded-xl text-[10px]">
                                <span className="text-indigo-900 font-bold truncate flex items-center gap-1">
                                  <Target className="w-3 h-3 text-indigo-600 shrink-0" />
                                  <span>{c.lpasPageSlug}</span>
                                </span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCopyLpasLink(c.lpasPageSlug, c.id);
                                  }}
                                  className="text-indigo-600 hover:text-indigo-800 px-1.5 py-0.5 rounded-md hover:bg-indigo-100 font-bold shrink-0 cursor-pointer flex items-center gap-1"
                                >
                                  {copiedLink === `${c.lpasPageSlug}-${c.id}` ? (
                                    <Check className="w-3 h-3 text-emerald-600" />
                                  ) : (
                                    <Copy className="w-3 h-3" />
                                  )}
                                  <span>{copiedLink === `${c.lpasPageSlug}-${c.id}` ? 'تم النسخ' : 'نسخ الرابط'}</span>
                                </button>
                              </div>
                            )}

                            {/* Action Buttons: Move Next, Move Prev, Stage Dropdown, Quick View */}
                            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
                              {/* Direct Forward / Backward Buttons */}
                              <div className="flex items-center gap-1.5">
                                {stageIndex > 0 && (
                                  <button
                                    onClick={() => handleMovePrev(c)}
                                    title="نقل للمرحلة السابقة"
                                    className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer"
                                  >
                                    <ArrowRight className="w-3 h-3" />
                                    <span>السابق</span>
                                  </button>
                                )}

                                {stageIndex < KANBAN_STAGES.length - 1 ? (
                                  <button
                                    onClick={() => handleMoveNext(c)}
                                    className="flex-1 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-[11px] font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                                  >
                                    <span>نقل للعمود التالي</span>
                                    <ArrowLeft className="w-3.5 h-3.5" />
                                  </button>
                                ) : (
                                  <span className="flex-1 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 text-[10px] font-black text-center border border-emerald-200">
                                    مكتملة بنجاح ✅
                                  </span>
                                )}

                                <button
                                  onClick={() => setSelectedCampaignForExecutiveReport(c)}
                                  title="تقرير أداء تنفيذي PDF"
                                  className="p-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 transition-colors cursor-pointer border border-purple-200/60"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                </button>

                                <button
                                  onClick={() => setSelectedCampaignForDetails(c)}
                                  title="عرض كامل التفاصيل"
                                  className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              </div>

                              {/* Direct Column Jump Selector */}
                              <div className="flex items-center gap-1.5 text-[10px]">
                                <span className="text-slate-400 shrink-0 font-bold">المرحلة:</span>
                                <select
                                  value={stage.id}
                                  onChange={(e) => handleMoveCard(c.id, e.target.value)}
                                  className="w-full p-1 rounded-lg border border-slate-200 text-[10px] font-bold text-slate-700 bg-white focus:outline-hidden focus:border-amber-500"
                                >
                                  {KANBAN_STAGES.map((st) => (
                                    <option key={st.id} value={st.id}>
                                      {st.shortLabel}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. MASTER SHEET SUB-TAB */}
      {activeSubTab === 'master' && (
        <div className="space-y-4 animate-in fade-in">
          <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="بحث في الجدول الموحد..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-3 pr-10 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div className="text-xs text-slate-500 font-bold shrink-0">
              إجمالي السجلات: <span className="text-slate-900 font-black">{filteredCampaigns.length}</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">العميل (مزود الخدمة)</th>
                    <th className="p-3.5">اسم الحملة والقناة</th>
                    <th className="p-3.5">الميزانية الإعلانية</th>
                    <th className="p-3.5">ما تم صرفه</th>
                    <th className="p-3.5">أتعاب الوكالة</th>
                    <th className="p-3.5">عمولة ليلة ({mComm}%)</th>
                    <th className="p-3.5">ROAS</th>
                    <th className="p-3.5">مرحلة سير العمل</th>
                    <th className="p-3.5 text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCampaigns.map((c: any) => {
                    const currentStage = getNormalizedStage(c);
                    const campBudget = c.adBudget || c.budget || 0;
                    const campSpent = c.spent || 0;
                    const fee = c.agencyFee || 0;
                    const comm = fee * (mComm / 100);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-bold text-slate-900">{c.providerName || 'مزود خدمة معتمد'}</td>
                        <td className="p-3.5">
                          <div className="font-extrabold text-slate-800">{c.title}</div>
                          <span className="text-[10px] text-slate-500">{c.channel || 'متعدد'}</span>
                        </td>
                        <td className="p-3.5 font-mono text-purple-700 font-bold">{formatCurrency(campBudget)}</td>
                        <td className="p-3.5 font-mono text-rose-600 font-bold">{formatCurrency(campSpent)}</td>
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">{formatCurrency(fee)}</td>
                        <td className="p-3.5 font-mono text-amber-700 font-bold">{formatCurrency(comm)}</td>
                        <td className="p-3.5 font-mono font-black text-slate-800">{c.roas || 4.5}x</td>
                        <td className="p-3.5">
                          <select
                            value={currentStage}
                            onChange={(e) => handleMoveCard(c.id, e.target.value)}
                            className="p-1.5 rounded-lg border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                          >
                            {KANBAN_STAGES.map((st) => (
                              <option key={st.id} value={st.id}>{st.shortLabel}</option>
                            ))}
                          </select>
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedCampaignForExecutiveReport(c)}
                              className="p-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 cursor-pointer border border-purple-200/60"
                              title="تقرير تنفيذي PDF"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setSelectedCampaignForDetails(c)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                              title="عرض التفاصيل"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                setExpenseCampaignId(c.id);
                                setActiveSubTab('expenses');
                              }}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 cursor-pointer"
                              title="تسجيل صرف"
                            >
                              <Banknote className="w-3.5 h-3.5" />
                            </button>
                          </div>
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

      {/* 4. EXPENSES & MEDIA SPEND SUB-TAB */}
      {activeSubTab === 'expenses' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
          {/* Expense Logging Form */}
          <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Banknote className="w-5 h-5 text-emerald-600" />
                <span>تسجيل المصروفات الإعلانية المباشرة</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">يتم خصم هذه المبالغ حصرياً من ميزانية البث الإعلاني للحملة.</p>
            </div>

            <form onSubmit={handleLogExpense} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">اختر الحملة المستهدفة *</label>
                <select
                  value={expenseCampaignId}
                  onChange={(e) => setExpenseCampaignId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-hidden focus:border-amber-500"
                  required
                >
                  <option value="" disabled>اختر الحملة...</option>
                  {campaigns.map((c: any) => {
                    const rem = Math.max(0, (c.adBudget || c.budget || 0) - (c.spent || 0));
                    return (
                      <option key={c.id} value={c.id}>
                        {c.title} ({c.providerName}) - متبقي {formatCurrency(rem)}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">مبلغ الصرف (ر.س) *</label>
                <input
                  type="number"
                  min="1"
                  placeholder="مثال: 1500"
                  value={expenseAmount}
                  onChange={(e) => setExpenseAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-mono text-sm"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">المنصة / القناة الإعلانية *</label>
                <select
                  value={expensePlatform}
                  onChange={(e) => setExpensePlatform(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-slate-800 focus:outline-hidden focus:border-amber-500"
                >
                  <option value="سناب شات">سناب شات (Snap Ads)</option>
                  <option value="تيك توك">تيك توك (TikTok Ads)</option>
                  <option value="إنستغرام وميتا">إنستغرام وفيس بوك (Meta)</option>
                  <option value="جوجل أدز">جوجل سيرش ومابز (Google Ads)</option>
                  <option value="بوابة رسائل SMS">بوابة رسائل SMS المعتمدة</option>
                  <option value="شبكة المؤثرين">شبكة المؤثرين وصناع المحتوى</option>
                  <option value="إنتاج وتصوير">إنتاج محتوى وتصوير</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">رقم المرجع / الفاتورة (Invoice Ref)</label>
                <input
                  type="text"
                  placeholder="مثال: SNAP-INV-88912"
                  value={expenseRef}
                  onChange={(e) => setExpenseRef(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1.5">البيان والتفاصيل</label>
                <textarea
                  rows={2}
                  placeholder="مثال: إعلانات فيديو تفاعلية لاستهداف العرسان بالرياض..."
                  value={expenseDescription}
                  onChange={(e) => setExpenseDescription(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>تسجيل وخصم المصروف</span>
              </button>
            </form>
          </div>

          {/* Real-time Expense Audit Log */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900">سجل العمليات والمصروفات الإعلانية</h3>
                <p className="text-xs text-slate-500 mt-0.5">توثيق شامل لكافة القيود والمصروفات المرتبطة بالحملات</p>
              </div>
              <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 text-xs font-mono font-bold">
                إجمالي المصروفات: {formatCurrency(totalSpent)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead className="bg-slate-50 text-slate-600 font-extrabold border-b border-slate-200">
                  <tr>
                    <th className="p-3">التاريخ</th>
                    <th className="p-3">الحملة / المزود</th>
                    <th className="p-3">المنصة</th>
                    <th className="p-3">البيان</th>
                    <th className="p-3">المبلغ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {campaigns.flatMap((c: any) => (c.expensesHistory || []).map((exp: any) => ({ ...exp, campTitle: c.title, provider: c.providerName }))).length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400 font-medium">
                        لا توجد عمليات صرف مسجلة حالياً
                      </td>
                    </tr>
                  ) : (
                    campaigns.flatMap((c: any) => (c.expensesHistory || []).map((exp: any) => ({ ...exp, campTitle: c.title, provider: c.providerName }))).map((exp: any) => (
                      <tr key={exp.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-mono text-slate-500">{exp.date}</td>
                        <td className="p-3">
                          <strong className="text-slate-800 block">{exp.campTitle}</strong>
                          <span className="text-[10px] text-slate-400">{exp.provider}</span>
                        </td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {exp.platform}
                          </span>
                        </td>
                        <td className="p-3 text-slate-600">{exp.description}</td>
                        <td className="p-3 font-mono text-rose-600 font-bold">{formatCurrency(exp.amount)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 5. LPAS LINK & ATTRIBUTION SUB-TAB */}
      {activeSubTab === 'lpas_link' && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/90 space-y-4">
            <div>
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-indigo-600" />
                <span>محرك صفحات الهبوط الاستهدافية (LPAS Growth Studio)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                ربط الحملات التسويقية مع صفحات هبوط سريعة الاستجابة ومحسنة لمعدلات التحويل (CRO) مع وسوم التتبع UTM.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
              {lpasPages.map((page) => (
                <div key={page.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3 flex flex-col justify-between hover:border-indigo-400 transition-all">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                        {page.targetCityNameAr || 'الرياض'} - {page.targetCategoryNameAr || 'قاعات'}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">/{page.slug}</span>
                    </div>
                    <h4 className="font-extrabold text-slate-900 text-sm">{page.title}</h4>
                    <p className="text-xs text-slate-500 line-clamp-2">{page.heroHeadline}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-200/80 flex items-center gap-2">
                    <button
                      onClick={() => handleCopyLpasLink(page.slug, 1)}
                      className="flex-1 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>نسخ رابط التتبع UTM</span>
                    </button>
                    <a
                      href={`/landing/${page.slug}?utm_source=lailah_agency_preview`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
                      title="معاينة الصفحة"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. AGREEMENTS & SOVEREIGN COMMISSION SUB-TAB */}
      {activeSubTab === 'agreements' && (
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200/90 p-6 space-y-6 text-right animate-in fade-in">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">عقود واتفاقيات الوكالة الرقمية المعتمدة</h3>
              <p className="text-xs text-slate-500 mt-0.5">شروط الشراكة والاستحقاقات المالية وعمولة منصة ليلة المحددة في النظام</p>
            </div>
            <span className="bg-amber-100 text-amber-900 font-black text-xs px-3.5 py-1.5 rounded-full border border-amber-200">
              اتفاقية سارية المفعول ✅
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-400 font-bold">اسم الوكالة المشغلة:</span>
              <p className="font-extrabold text-slate-900 text-sm">وكالة ليلة المعتمدة للتسويق وإدارة الحملات</p>
            </div>
            <div className="p-4 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-1">
              <span className="text-xs text-amber-900 font-bold">نسبة عمولة ليلة من أتعاب الوكالة:</span>
              <p className="font-black text-amber-700 text-base font-mono">{mComm}% ({mComm * 100} BPS) - محددة بالإعدادات المالية</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="text-xs text-slate-400 font-bold">اتفاقية مستوى الخدمة (SLA):</span>
              <p className="font-extrabold text-slate-900 text-sm">إصدار العرض خلال 24 ساعة / إطلاق خلال 48 ساعة</p>
            </div>
          </div>

          <div className="p-5 bg-amber-50/40 rounded-2xl border border-amber-200 text-xs leading-relaxed text-slate-800 space-y-3">
            <h4 className="font-black text-amber-950 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              <span>الضوابط السيادية لحفظ الحقوق وتوثيق اللقطات المالية ومسار الاسترداد</span>
            </h4>
            <ul className="list-disc list-inside space-y-2 text-slate-700">
              <li>يتم توثيق لقطة اتفاقية العقد الحالية (AgreementSnapshot) في قاعدة البيانات فور اعتماد أي حملة جديدة لمنع تأثر العقود الجارية بأي تحديثات مستقبلية لنسب العمولة.</li>
              <li>عمولة منصة ليلة تُقتطع حصرياً من أتعاب الوكالة (Agency Fee) ولا تُحسب إطلاقاً على ميزانية الشراء الإعلامي للبث المباشر (Ad Budget).</li>
              <li><strong>مسار الاسترداد (Refund Path):</strong> عند طلب إلغاء حملة تم سدادها وقبل بدء تشغيلها، تتحول تلقائياً إلى مسار استرداد موثق عبر بوابة السداد (`RefundPending` ➔ `Refunded`). أما إذا ألغيت بعد بدء التشغيل والإنفاق، فتكون ملغاة بدون استرداد (No Refund).</li>
            </ul>
          </div>
        </div>
      )}

      {/* 7. LIVE AD APIS SYNC SUB-TAB */}
      {activeSubTab === 'api_integrations' && (
        <div className="animate-in fade-in">
          <AdPlatformsApiSyncView
            campaigns={campaigns}
            setCampaigns={setCampaigns}
            formatCurrency={formatCurrency}
            showNotice={showNotice}
          />
        </div>
      )}

      {/* 8. AUTOMATED NOTIFICATIONS SUB-TAB */}
      {activeSubTab === 'notifications' && (
        <div className="animate-in fade-in">
          <CampaignNotificationManager
            showNotice={showNotice}
            campaigns={campaigns}
          />
        </div>
      )}

      {/* 9. AI COPYWRITER & AD STUDIO SUB-TAB */}
      {activeSubTab === 'ai_copywriter' && (
        <div className="bg-white rounded-3xl shadow-xs border border-slate-200/90 p-6 space-y-6 text-right animate-in fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-xs font-black">
                  مولّد النصوص الذكي (Under Agency & Admin Oversight)
                </span>
              </div>
              <h3 className="text-xl font-black text-slate-900">استوديو توليد النصوص والإعلانات التفاعلي بالذكاء الاصطناعي</h3>
              <p className="text-xs text-slate-500 mt-1">توليد نصوص إعلانية محكمة وجذابة مع سجل تدقيق وموافقة الإدارة والوكالة لتجنب أي أخطاء أو تجاوزات.</p>
            </div>
            <button
              onClick={() => setIsAiCopywriterOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Wand2 className="w-4 h-4 text-amber-300" />
              <span>فتح استوديو التوليد والموافقة</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">1</div>
              <h4 className="font-black text-slate-900 text-sm">صياغة موجهة للجمهور السعودي</h4>
              <p className="text-xs text-slate-600 leading-relaxed">توليد نصوص متوافقة مع اللهجة والأسلوب التسويقي لقاعات المناسبات، المؤتمرات، وحفلات الزفاف.</p>
            </div>
            <div className="p-5 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">2</div>
              <h4 className="font-black text-slate-900 text-sm">رقابة وحوكمة الوكالة والإدارة</h4>
              <p className="text-xs text-slate-600 leading-relaxed">كل نص يتم توليده يدخل مسار المراجعة والتدقيق، ولا يتم تطبيقه إلا بعد الموافقة الرسمية.</p>
            </div>
            <div className="p-5 rounded-2xl bg-amber-50/50 border border-amber-100 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">3</div>
              <h4 className="font-black text-slate-900 text-sm">تطبيق فوري وتصدير للقنوات</h4>
              <p className="text-xs text-slate-600 leading-relaxed">إمكانية ربط النص مباشرة بالحملات النشطة في سير العمل (Kanban) أو صفحات الهبوط LPAS.</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Campaign Full Details */}
      {selectedCampaignForDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 text-right border border-slate-100">
            <div className="flex justify-between items-start border-b border-slate-100 pb-4">
              <div>
                <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-800 text-xs font-black">
                  {selectedCampaignForDetails.providerName || 'مزود خدمة معتمد'}
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1.5">{selectedCampaignForDetails.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCampaignForDetails(null)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block">الميزانية الإعلانية</span>
                <strong className="text-purple-700 text-sm font-mono">{formatCurrency(selectedCampaignForDetails.adBudget || selectedCampaignForDetails.budget || 0)}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block">ما تم صرفه</span>
                <strong className="text-rose-600 text-sm font-mono">{formatCurrency(selectedCampaignForDetails.spent || 0)}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block">أتعاب الوكالة</span>
                <strong className="text-emerald-700 text-sm font-mono">{formatCurrency(selectedCampaignForDetails.agencyFee || 0)}</strong>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <span className="text-slate-400 block">ROAS التقديري</span>
                <strong className="text-slate-900 text-sm font-mono">{selectedCampaignForDetails.roas || 4.5}x</strong>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-700">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                <strong className="text-slate-900 block">الجمهور المستهدف والقنوات:</strong>
                <p className="text-slate-600">{selectedCampaignForDetails.targetAudience || 'العملاء النشطين والعائلات'}</p>
                <p className="text-indigo-600 font-bold mt-1">القنوات: {selectedCampaignForDetails.channel || 'متعدد'}</p>
              </div>

              {selectedCampaignForDetails.content && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100 space-y-1">
                  <strong className="text-slate-900 block">نص ومحتوى الإعلان:</strong>
                  <p className="text-slate-600 leading-relaxed">{selectedCampaignForDetails.content}</p>
                </div>
              )}
            </div>

            {/* Quick Actions in Modal */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-bold">تغيير المرحلة:</span>
                <select
                  value={getNormalizedStage(selectedCampaignForDetails)}
                  onChange={(e) => {
                    handleMoveCard(selectedCampaignForDetails.id, e.target.value);
                    setSelectedCampaignForDetails({ ...selectedCampaignForDetails, workflowStatus: e.target.value });
                  }}
                  className="p-2 rounded-xl border border-slate-200 font-bold text-slate-800"
                >
                  {KANBAN_STAGES.map((st) => (
                    <option key={st.id} value={st.id}>{st.shortLabel}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedCampaignForExecutiveReport(selectedCampaignForDetails)}
                  className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Printer className="w-4 h-4" />
                  <span>تصدير تقرير تنفيذي PDF</span>
                </button>

                <button
                  onClick={() => setSelectedCampaignForDetails(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 cursor-pointer"
                >
                  إغلاق
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: New Agency Campaign */}
      {isNewCampaignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5 text-right border border-slate-100">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-amber-500" />
                <span>إطلاق حملة وكالة جديدة</span>
              </h3>
              <button
                onClick={() => setIsNewCampaignModalOpen(false)}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const fd = new FormData(form);
                const title = fd.get('title') as string;
                const providerName = fd.get('providerName') as string;
                const channel = fd.get('channel') as string;
                const targetAudience = fd.get('targetAudience') as string;
                const adBudget = Number(fd.get('adBudget')) || 3000;
                const agencyFee = Number(fd.get('agencyFee')) || 1000;
                const lpasPageSlug = fd.get('lpasPageSlug') as string;
                const content = fd.get('content') as string;

                const newCamp = {
                  id: Date.now(),
                  title,
                  providerName,
                  channel,
                  type: channel,
                  targetAudience,
                  adBudget,
                  budget: adBudget,
                  agencyFee,
                  agencyNetProfit: agencyFee * (1 - mComm / 100),
                  spent: 0,
                  reach: 10000,
                  clicks: 1200,
                  conversions: 40,
                  cpa: 30,
                  roas: 5.0,
                  status: 'نشطة',
                  workflowStatus: 'تحت التجهيز والتصميم',
                  startDate: new Date().toISOString().split('T')[0],
                  endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
                  content,
                  lpasPageSlug,
                  expensesHistory: []
                };

                setCampaigns((prev: any[]) => [newCamp, ...prev]);
                setIsNewCampaignModalOpen(false);
                showNotice('success', 'تم إنشاء وإدراج الحملة الجديدة في مرحلة التجهيز بنجاح!');
              }}
              className="space-y-4 text-xs"
            >
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان الحملة *</label>
                <input
                  type="text"
                  name="title"
                  required
                  placeholder="مثال: حملة صيف 2026 لقاعات الرياض"
                  className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">اسم المزود / العميل *</label>
                  <input
                    type="text"
                    name="providerName"
                    required
                    placeholder="مثال: شركة أطياف لتنظيم المعارض"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">القناة الإعلانية الرئيسية *</label>
                  <select
                    name="channel"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden focus:border-amber-500 font-bold"
                  >
                    <option value="سناب شات وإنستغرام">سناب شات وإنستغرام</option>
                    <option value="تيك توك وإنستغرام">تيك توك وإنستغرام</option>
                    <option value="Google Search & Maps">جوجل سيرش ومابز</option>
                    <option value="رسائل SMS وشبكة المؤثرين">رسائل SMS والمؤثرين</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">ميزانية الإعلانات المباشرة (ر.س) *</label>
                  <input
                    type="number"
                    name="adBudget"
                    defaultValue={5000}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">أتعاب الوكالة (ر.س) *</label>
                  <input
                    type="number"
                    name="agencyFee"
                    defaultValue={1500}
                    required
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الجمهور المستهدف</label>
                <input
                  type="text"
                  name="targetAudience"
                  placeholder="مثال: العرسان الجدد والشركات بالرياض"
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">ربط صفحة هبوط LPAS</label>
                <select
                  name="lpasPageSlug"
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50"
                >
                  <option value="">بدون ربط (صفحة عامة)</option>
                  {lpasPages.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.title} (/{p.slug})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الرسالة والعرض الإعلاني</label>
                <textarea
                  name="content"
                  rows={2}
                  placeholder="مثال: احجز الآن واحصل على خصم 20% وضيافة VIP مجانية..."
                  className="w-full p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewCampaignModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black cursor-pointer shadow-md"
                >
                  حفظ وإطلاق
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI Copywriting & Ad Studio */}
      <AiCopywritingStudioModal
        isOpen={isAiCopywriterOpen}
        onClose={() => setIsAiCopywriterOpen(false)}
        showNotice={showNotice}
        onApplyCopy={(text, title) => {
          setNotificationMsg({ type: 'success', text: `تم اعتماد وتطبيق النص الإعلاني: "${title}" بنجاح!` });
        }}
      />

      {/* MODAL: Executive Report PDF */}
      {selectedCampaignForExecutiveReport && (
        <ExecutiveReportModal
          campaign={selectedCampaignForExecutiveReport}
          onClose={() => setSelectedCampaignForExecutiveReport(null)}
          formatCurrency={formatCurrency}
          marketingCommissionPercentage={mComm}
        />
      )}
    </div>
  );
};

export const ProviderMarketingWizard = ({ onSubmit }: any) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '', goalMetric: '', targetAudience: '',
    coreMessage: '', channel: '', offer: '',
    followUpMethod: '', startDate: '', endDate: '',
    adBudget: 0, agencyFee: 0
  });

  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [payWithWallet, setPayWithWallet] = useState<boolean>(true);
  const [isLoadingWallet, setIsLoadingWallet] = useState<boolean>(false);

  useEffect(() => {
    let active = true;
    const fetchWallet = async () => {
      try {
        setIsLoadingWallet(true);
        const userStr = localStorage.getItem('currentUser');
        const currentUser = userStr ? JSON.parse(userStr) : null;
        if (!currentUser) return;
        
        const res = await fetch(`/api/finance/stats?role=provider&provider=${encodeURIComponent(currentUser.id || '')}`);
        if (res.ok) {
          const data = await res.json();
          if (active && data && data.wallet) {
            setWalletBalance(data.wallet.balance || 0);
          }
        }
      } catch (err) {
        console.error('Error fetching wallet in wizard:', err);
      } finally {
        if (active) setIsLoadingWallet(false);
      }
    };
    fetchWallet();
    return () => { active = false; };
  }, [step]); // re-fetch when step changes to ensure fresh balance in step 5

  const handleNext = () => setStep(prev => prev + 1);
  const handlePrev = () => setStep(prev => prev - 1);

  return (
    <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100 max-w-4xl mx-auto relative">
      <div className="bg-gradient-to-l from-slate-900 to-slate-800 p-8 text-white relative text-right">
        <h2 className="text-2xl font-bold mb-2">طلب حملة تسويقية جديدة</h2>
        <p className="text-slate-305">دعنا نخطط لحملتك في 6 خطوات بسيطة واستراتيجية.</p>
        
        {/* Progress Steps */}
        <div className="flex gap-2 mt-8 flex-row-reverse">
           {[1,2,3,4,5,6].map(s => (
             <div key={s} className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-amber-505' : 'bg-slate-700'}`}></div>
           ))}
        </div>
      </div>

      <div className="p-8 text-right">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-slate-800">1. الهدف والجمهور (مرحلة الوعي)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">ما هو الهدف الرئيسي (القياس)؟</label>
                 <select className="w-full p-3 rounded-xl border border-slate-200 text-right" value={formData.goalMetric} onChange={e => setFormData({...formData, goalMetric: e.target.value})}>
                   <option value="">اختر...</option>
                   {(() => {
                     try {
                       const stored = localStorage.getItem('SYSTEM_DATastore_marketingGoals');
                       return stored ? JSON.parse(stored) as string[] : ['حجوزات مباشرة', 'جمع بيانات عملاء محتملين (Leads)', 'زيادة الوعي بالمنشأة'];
                     } catch {
                       return ['حجوزات مباشرة', 'جمع بيانات عملاء محتملين (Leads)', 'زيادة الوعي بالمنشأة'];
                     }
                   })().map(goal => (
                     <option key={goal} value={goal}>{goal}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">شريحة الجمهور المستهدف</label>
                 <input type="text" className="w-full p-3 rounded-xl border border-slate-200 text-right" placeholder="مثال: العرسان الجدد، الشركات، الخ" value={formData.targetAudience} onChange={e => setFormData({...formData, targetAudience: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-slate-850">2. الرسالة والقناة (مرحلة التفاعل)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">الرسالة الأساسية (ما يميزك)</label>
                 <textarea className="w-full p-3 rounded-xl border border-slate-200 h-24 text-right" placeholder="..." value={formData.coreMessage} onChange={e => setFormData({...formData, coreMessage: e.target.value})}></textarea>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">القنوات التسويقية المفضلة</label>
                 <input type="text" className="w-full p-3 rounded-xl border border-slate-200 text-right" placeholder="مثال: انستقرام، تيك توك، جوجل، الخ" value={formData.channel} onChange={e => setFormData({...formData, channel: e.target.value})} />
               </div>
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-705 mb-2">هل يوجد عرض جذاب (Offer)؟</label>
                 <input type="text" className="w-full p-3 rounded-xl border border-slate-200 text-right" placeholder="مثال: خصم 20% للحجز المبكر" value={formData.offer} onChange={e => setFormData({...formData, offer: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-slate-800">3. المتابعة والتوقيت</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="md:col-span-2">
                 <label className="block text-sm font-medium text-slate-707 mb-2">آلية متابعة العملاء المحتملين (Follow-up)</label>
                 <select className="w-full p-3 rounded-xl border border-slate-202 text-right" value={formData.followUpMethod} onChange={e => setFormData({...formData, followUpMethod: e.target.value})}>
                   <option value="">اختر...</option>
                   {(() => {
                     try {
                       const stored = localStorage.getItem('SYSTEM_DATastore_customerFollowups');
                       return stored ? JSON.parse(stored) as string[] : ['الواتساب', 'اتصال هاتفي', 'حجز تلقائي من المنصة'];
                     } catch {
                       return ['الواتساب', 'اتصال هاتفي', 'حجز تلقائي من المنصة'];
                     }
                   })().map(method => (
                     <option key={method} value={method}>{method}</option>
                   ))}
                 </select>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-707 mb-2">تاريخ البداية</label>
                 <input type="date" className="w-full p-3 rounded-xl border border-slate-200" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-707 mb-2">تاريخ النهاية</label>
                 <input type="date" className="w-full p-3 rounded-xl border border-slate-200" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} />
               </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in">
            <h3 className="text-xl font-bold text-slate-800">4. الميزانية والتكاليف</h3>
            <p className="text-sm text-slate-500 border-b pb-4 mb-4">حدد الميزانية المرصودة للحملة الترويجية. النظام يفصل بين ميزانية الإعلان الفعلي وأتعاب وكالة التسويق.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">ميزانية الإعلانات (Ad Budget)</label>
                 <div className="relative">
                   <input type="number" min="0" className="w-full p-3 rounded-xl border border-slate-200 pr-12 text-right" value={formData.adBudget || ''} onChange={e => setFormData({...formData, adBudget: Number(e.target.value)})} />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">ر.س</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">تُصرف حصرياً على منصات الإعلانات</p>
               </div>
               <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">أتعاب وكالة التسويق (Agency Fee)</label>
                 <div className="relative">
                   <input type="number" min="0" className="w-full p-3 rounded-xl border border-slate-200 pr-12 text-right" value={formData.agencyFee || ''} onChange={e => setFormData({...formData, agencyFee: Number(e.target.value)})} />
                   <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">ر.س</span>
                 </div>
                 <p className="text-xs text-slate-500 mt-2">مقابل إدارة الحملة وإنشاء المحتوى</p>
               </div>
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-6 animate-in fade-in py-6 max-w-lg mx-auto text-right font-sans" dir="rtl">
            <div className="text-center">
              <Wallet className="w-16 h-16 text-amber-500 mx-auto mb-2" />
              <h3 className="text-2xl font-bold text-slate-800">الدفع وملخص الحملة</h3>
              <p className="text-xs text-slate-500 mt-1">يرجى تحديد طريقة التمويل ومراجعة تكاليف الحملة التسويقية</p>
            </div>

            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 space-y-3">
               <div className="flex justify-between border-b border-slate-200/60 pb-2.5">
                 <span className="text-slate-500 text-sm">ميزانية الإعلانات (للبث):</span>
                 <span className="font-bold text-slate-800 font-mono">{formatCurrency(formData.adBudget)}</span>
               </div>
               <div className="flex justify-between border-b border-slate-200/60 pb-2.5">
                 <span className="text-slate-500 text-sm">أتعاب إدارة الوكالة:</span>
                 <span className="font-bold text-slate-800 font-mono">{formatCurrency(formData.agencyFee)}</span>
               </div>
               <div className="flex justify-between pt-1">
                 <span className="text-base font-bold text-slate-800">التكلفة الإجمالية للحملة:</span>
                 <span className="text-base font-bold text-amber-600 font-mono">{formatCurrency(formData.adBudget + formData.agencyFee)}</span>
               </div>
            </div>

            {/* Smart Wallet funding section */}
            <div className="bg-white border border-slate-100 shadow-sm p-6 rounded-2xl space-y-4">
               <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                 <span className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><Banknote className="w-4 h-4" /></span>
                 طريقة سداد وتمويل الحملة
               </h4>

               <div className="grid grid-cols-2 gap-3">
                 <button 
                   type="button"
                   onClick={() => setPayWithWallet(true)}
                   className={`p-4 rounded-xl border text-right space-y-1 transition-all ${
                     payWithWallet 
                       ? 'border-amber-500 bg-amber-50/20 shadow-sm' 
                       : 'border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   <p className="font-bold text-xs text-slate-800">المحفظة الذكية 💳</p>
                   <p className="text-[10px] text-slate-400">سداد فوري ومباشر من رصيد الأرباح</p>
                 </button>
                 <button 
                   type="button"
                   onClick={() => setPayWithWallet(false)}
                   className={`p-4 rounded-xl border text-right space-y-1 transition-all ${
                     !payWithWallet 
                       ? 'border-amber-500 bg-amber-50/20 shadow-sm' 
                       : 'border-slate-200 hover:bg-slate-50'
                   }`}
                 >
                   <p className="font-bold text-xs text-slate-800">بطاقة ائتمانية / بوابة الدفع</p>
                   <p className="text-[10px] text-slate-400">الدفع عبر بطاقات مدى وفيزا وماستركارد</p>
                 </button>
               </div>

               {payWithWallet && (
                 <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex justify-between items-center">
                    <div>
                      <p className="text-slate-400 text-[10px] font-bold">رصيد محفظتك الذكية المتوفر:</p>
                      {isLoadingWallet ? (
                        <p className="text-xs text-slate-500 font-bold">جاري جلب الرصيد...</p>
                      ) : (
                        <p className={`text-base font-black font-mono ${walletBalance >= (formData.adBudget + formData.agencyFee) ? 'text-emerald-600' : 'text-red-500'}`}>
                          {formatCurrency(walletBalance)}
                        </p>
                      )}
                    </div>
                    {walletBalance >= (formData.adBudget + formData.agencyFee) ? (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] px-2.5 py-1 rounded-full font-bold">رصيد كافٍ ✅</span>
                    ) : (
                      <span className="bg-red-50 text-red-700 text-[10px] px-2.5 py-1 rounded-full font-bold">رصيد غير كافٍ ⚠️</span>
                    )}
                 </div>
               )}

               {payWithWallet && walletBalance < (formData.adBudget + formData.agencyFee) && !isLoadingWallet && (
                 <div className="bg-red-50 p-3.5 rounded-xl border border-red-100 text-red-700 text-[11px] leading-relaxed font-bold">
                   ⚠️ رصيد المحفظة الذكية المتاح ({formatCurrency(walletBalance)}) لا يكفي لتغطية تكلفة الحملة الإجمالية ({formatCurrency(formData.adBudget + formData.agencyFee)}). يرجى شحن محفظتك أو الدفع الفوري عبر بطاقة ائتمانية.
                 </div>
               )}
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="space-y-6 animate-in fade-in text-center py-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-slate-800 mb-2">تم رفع طلب الحملة والدفع بنجاح!</h3>
            <p className="text-slate-600 max-w-md mx-auto font-sans leading-relaxed">سيقوم فريق التسويق بمراجعة الحملة والبدء بتجهيز المحتوى. ستتمكن من مراجعة المحتوى في (نافذة اعتماد المحتوى) قبل إطلاق الحملة.</p>
          </div>
        )}

      </div>
      
      <div className="bg-slate-50 p-4 border-t border-slate-100 flex justify-between">
         {step > 1 && step < 6 ? (
           <button onClick={handlePrev} className="px-6 py-2 rounded-xl font-medium text-slate-655 hover:bg-slate-200">رجوع</button>
         ) : <div />}
         
         {step < 5 ? (
           <button onClick={handleNext} className="px-6 py-2 rounded-xl font-bold text-slate-900 bg-amber-500 hover:bg-amber-600">التالي</button>
         ) : step === 5 ? (
           <button 
             onClick={() => {
               onSubmit({ ...formData, payWithWallet });
               handleNext();
             }} 
             disabled={payWithWallet && walletBalance < (formData.adBudget + formData.agencyFee)}
             className="px-6 py-2 rounded-xl font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-xl flex items-center gap-2 disabled:opacity-40 disabled:pointer-events-none"
           >
             <Banknote className="w-5 h-5" />
             {payWithWallet ? 'تمويل من المحفظة والاعتماد' : 'الدفع الفوري والاعتماد'}
           </button>
         ) : (
           <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-xl font-bold text-slate-900 bg-amber-505 hover:bg-amber-600">إنهاء</button>
         )}
      </div>
    </div>
  );
};

export const PromotionsManagement = ({ 
  promotions = [], 
  setPromotions, 
  halls = [], 
  services = [], 
  userRole = 'provider', 
  providerName = '',
  providers = [],
  onOpenAdCampaignWizard,
  showNotification = () => {}
}: any) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(1);
  const [editingPromotion, setEditingPromotion] = useState<any>(null);
  const [viewingPromotion, setViewingPromotion] = useState<any>(null);

  const [retargetingPromotion, setRetargetingPromotion] = useState<any>(null);
  const [selectedRetargetHallId, setSelectedRetargetHallId] = useState<string>('');
  const [favoritesCount, setFavoritesCount] = useState<number | null>(null);
  const [isCountingFavorites, setIsCountingFavorites] = useState<boolean>(false);
  const [retargetMessage, setRetargetMessage] = useState<string>('');
  const [isSendingRetarget, setIsSendingRetarget] = useState<boolean>(false);

  useEffect(() => {
    if (!selectedRetargetHallId) {
      setFavoritesCount(null);
      return;
    }
    let active = true;
    const fetchCount = async () => {
      try {
        setIsCountingFavorites(true);
        const res = await fetch(`/api/marketing/favorites-count/${selectedRetargetHallId}`, {
          headers: {
            'x-user-role': userRole,
            'x-user-id': '1'
          }
        });
        if (res.ok) {
          const data = await res.json();
          if (active) setFavoritesCount(data.count);
        }
      } catch (err) {
        console.error('Error fetching favorites count:', err);
      } finally {
        if (active) setIsCountingFavorites(false);
      }
    };
    fetchCount();
    return () => { active = false; };
  }, [selectedRetargetHallId, userRole]);

  useEffect(() => {
    if (retargetingPromotion) {
      const discountText = retargetingPromotion.type === 'percentage' 
        ? `خصم خاص بقيمة ${retargetingPromotion.value}%` 
        : retargetingPromotion.type === 'fixed' 
        ? `خصم خاص بقيمة ${retargetingPromotion.value} ر.س` 
        : `عرض خدمة مجانية مميزة`;
      setRetargetMessage(`مرحباً، يسعدنا تقديم ${discountText} على قاعتك المفضلة كعرض حصري ومؤقت لعملاء قائمة المفضلة المتميزين! احجز مناسبتك الآن ودع الباقي علينا.`);
      
      // Auto-select a hall
      if (retargetingPromotion.targetIds && retargetingPromotion.targetIds.length > 0) {
        setSelectedRetargetHallId(String(retargetingPromotion.targetIds[0]));
      } else {
        // If empty, find any hall belonging to this provider, or default to first hall
        const providerHalls = halls.filter((h: any) => h.providerName === providerName || !providerName);
        if (providerHalls.length > 0) {
          setSelectedRetargetHallId(String(providerHalls[0].id));
        } else if (halls.length > 0) {
          setSelectedRetargetHallId(String(halls[0].id));
        } else {
          setSelectedRetargetHallId('');
        }
      }
    } else {
      setSelectedRetargetHallId('');
      setRetargetMessage('');
      setFavoritesCount(null);
    }
  }, [retargetingPromotion, halls, providerName]);
  
  const [formData, setFormData] = useState<any>({
    name: '',
    type: 'percentage',
    value: 0,
    applyTo: 'halls',
    targetIds: [],
    status: 'pending',
    startDate: '',
    endDate: '',
    conditions: {},
    providerName: '',
    freeServiceId: undefined,
    maxFreeServiceValue: undefined,
    promotionPattern: 'promo_code',
    couponCode: '',
    usageLimit: '',
    createdAt: new Date().toISOString()
  });

  const isAdmin = userRole === 'admin';
  
  const myPromotions = isAdmin 
    ? promotions 
    : promotions.filter((p: any) => p.providerName === providerName);

  const stats = {
    active: myPromotions.filter((p: any) => p.status === 'active').length,
    pending: myPromotions.filter((p: any) => p.status === 'pending').length,
    bookingsWithOffers: myPromotions.length > 0 ? Math.round(myPromotions.length * 4 + 2) : 0
  };

  const openCreateModal = () => {
    setEditingPromotion(null);
    setFormData({
      name: '',
      type: 'percentage',
      value: 0,
      applyTo: 'halls',
      targetIds: [],
      status: isAdmin ? 'active' : 'pending',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      conditions: {},
      providerName: isAdmin ? 'المنصة' : (providerName || ''),
      freeServiceId: undefined,
      maxFreeServiceValue: undefined,
      promotionPattern: 'promo_code',
      couponCode: '',
      usageLimit: '',
      createdAt: new Date().toISOString()
    });
    setActiveStep(1);
    setIsModalOpen(true);
  };

  const openEditModal = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingPromotion(p);
    setFormData({
      ...p,
      conditions: p.conditions || {},
      promotionPattern: p.promotionPattern || 'promo_code',
      couponCode: p.couponCode || '',
      usageLimit: p.usageLimit || ''
    });
    setActiveStep(1);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    if (editingPromotion) {
      // Edit mode
      const updatedPromotions = promotions.map((p: any) => {
        if (p.id === editingPromotion.id) {
          return {
            ...p,
            ...formData,
            status: isAdmin ? formData.status : 'pending',
            createdAt: p.createdAt || new Date().toISOString()
          };
        }
        return p;
      });
      setPromotions(updatedPromotions);
      showNotification('success', isAdmin ? 'تم تعديل العرض الترويجي بنجاح!' : 'تم تعديل العرض الترويجي وإعادة إرساله للمراجعة للموافقة.');
    } else {
      // Create mode
      const newPromotion = {
        ...formData,
        id: Date.now(),
        status: isAdmin ? 'active' : 'pending',
        providerName: isAdmin ? (formData.providerName || 'المنصة') : (providerName || 'المنصة'),
        createdAt: new Date().toISOString()
      };
      setPromotions([newPromotion, ...promotions]);
      showNotification('success', isAdmin ? 'تم إنشاء وتفعيل العرض الترويجي بنجاح!' : 'تم تقديم طلب العرض بنجاح وبانتظار اعتماد الإدارة.');
    }

    setIsModalOpen(false);
    setEditingPromotion(null);
  };

  const handleDelete = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const id = p.id;
    const isApprovedOrStarted = p.status === 'active' || p.status === 'cancellation_requested' || p.status === 'cancelled' || p.status === 'expired' || (p.startDate && new Date(p.startDate) <= new Date());
    
    if (!isAdmin && isApprovedOrStarted) {
      showNotification('error', 'يُمنع حذف العروض المعتمدة أو التي بدأت للحفاظ على توثيق العقود، وتقتصر صلاحية الحذف النهائي على إدارة منصة ليلة.');
      return;
    }

    if (window.confirm('هل أنت متأكد من حذف هذا العرض نهائياً؟')) {
      setPromotions(promotions.filter((item: any) => item.id !== id));
      showNotification('success', 'تم حذف العرض الترويجي بنجاح.');
      if (viewingPromotion?.id === id) {
        setViewingPromotion(null);
      }
    }
  };

  const handleCancelOffer = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const isBeforeApprovalOrStart = p.status === 'pending' || p.status === 'rejected' || (p.startDate && new Date(p.startDate) > new Date());

    if (isBeforeApprovalOrStart) {
      setPromotions(promotions.map((item: any) => 
        item.id === p.id ? { ...item, status: 'cancelled', cancelledAt: new Date().toISOString() } : item
      ));
      showNotification('info', 'تم إلغاء العرض الترويجي بشكل مباشر بنجاح.');
      if (viewingPromotion?.id === p.id) {
        setViewingPromotion((prev: any) => ({ ...prev, status: 'cancelled' }));
      }
    } else {
      setPromotions(promotions.map((item: any) => 
        item.id === p.id ? { ...item, status: 'cancellation_requested', cancellationRequestedAt: new Date().toISOString() } : item
      ));
      showNotification('warning', 'تم رفع طلب إلغاء العرض لإدارة منصة ليلة بانتظار الموافقة لحماية حقوق العملاء الذين حجزوا أثناء فترة العرض.');
      if (viewingPromotion?.id === p.id) {
        setViewingPromotion((prev: any) => ({ ...prev, status: 'cancellation_requested' }));
      }
    }
  };

  const handleApproveCancellation = (id: number) => {
    setPromotions(promotions.map((p: any) => p.id === id ? { ...p, status: 'cancelled', cancelledByAdminAt: new Date().toISOString() } : p));
    showNotification('success', 'تمت الموافقة على طلب إلغاء العرض الترويجي وتحويل حالته إلى ملغي.');
    if (viewingPromotion?.id === id) {
      setViewingPromotion((prev: any) => ({ ...prev, status: 'cancelled' }));
    }
  };

  const handleRejectCancellation = (id: number) => {
    setPromotions(promotions.map((p: any) => p.id === id ? { ...p, status: 'active', cancellationRejectedAt: new Date().toISOString() } : p));
    showNotification('info', 'تم رفض طلب إلغاء العرض وإعادة تفعيله كعرض نشط.');
    if (viewingPromotion?.id === id) {
      setViewingPromotion((prev: any) => ({ ...prev, status: 'active' }));
    }
  };

  const handleToggleStatus = (p: any, e: React.MouseEvent) => {
    e.stopPropagation();
    const newStatus = p.status === 'active' ? 'expired' : 'active';
    setPromotions(promotions.map((item: any) => 
      item.id === p.id ? { ...item, status: newStatus } : item
    ));
    showNotification('success', newStatus === 'active' ? 'تم تنشيط العرض بنجاح.' : 'تم إيقاف تفعيل العرض.');
  };

  const [approvingPromotion, setApprovingPromotion] = useState<any>(null);
  const [chosenPolicy, setChosenPolicy] = useState<'CommissionOnDiscountedPrice' | 'CommissionOnOriginalPrice'>('CommissionOnDiscountedPrice');
  const [approvedDiscountValue, setApprovedDiscountValue] = useState<number>(0);
  const [adminRejectionNotes, setAdminRejectionNotes] = useState<string>('');

  const handleApprove = (id: number, approvedValue?: number, policySelection: 'CommissionOnDiscountedPrice' | 'CommissionOnOriginalPrice' = 'CommissionOnDiscountedPrice') => {
    setPromotions(promotions.map((p: any) => {
      if (p.id === id) {
        return { 
          ...p, 
          status: 'active',
          value: approvedValue !== undefined ? approvedValue : p.value,
          commissionPolicy: policySelection,
          platformParticipatesInDiscount: policySelection === 'CommissionOnDiscountedPrice',
          approvedAt: new Date().toISOString(),
          approvedBy: 'الإدارة (Admin)'
        };
      }
      return p;
    }));
    showNotification('success', `تم اعتماد العرض الترويجي وتطبيق سياسة (${policySelection === 'CommissionOnDiscountedPrice' ? 'العمولة بعد الخصم' : 'العمولة قبل الخصم'}) بنجاح!`);
    if (viewingPromotion?.id === id) {
      setViewingPromotion((prev: any) => ({
        ...prev,
        status: 'active',
        value: approvedValue !== undefined ? approvedValue : prev.value,
        commissionPolicy: policySelection,
        platformParticipatesInDiscount: policySelection === 'CommissionOnDiscountedPrice'
      }));
    }
  };

  const handleReject = (id: number, notes?: string) => {
    const finalNotes = notes || 'تم رفض الطلب وتوجيه الملاحظات للمزود لإعادة التعديل والتقديم.';
    setPromotions(promotions.map((p: any) => p.id === id ? { 
      ...p, 
      status: 'rejected',
      adminNotes: finalNotes,
      rejectedAt: new Date().toISOString()
    } : p));
    showNotification('warning', 'تم رفض طلب العرض الترويجي وتوجيه الملاحظات للمزود بنجاح.');
    if (viewingPromotion?.id === id) {
      setViewingPromotion((prev: any) => ({ ...prev, status: 'rejected', adminNotes: finalNotes }));
    }
  };

  const getTargetItemNames = (p: any) => {
    if (!p.targetIds || p.targetIds.length === 0) {
      return 'شامل لجميع العناصر';
    }
    const items = p.applyTo === 'halls' ? halls : services;
    const names = p.targetIds.map((id: number) => {
      const found = items.find((i: any) => i.id === id);
      return found ? found.name : `عنصر #${id}`;
    });
    return names.join('، ');
  };

  const formatCurrencyLocal = (amount: number) => {
    return new Intl.NumberFormat('ar-SA', { style: 'currency', currency: 'SAR' }).format(amount);
  };

  return (
    <div className="space-y-6 text-right">
      {/* Concurrency Guard & Dynamic Discount Engine Banner */}
      <div className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white p-5 rounded-3xl shadow-lg border border-emerald-500/30 flex flex-col md:flex-row justify-between items-center gap-4 text-right font-sans" dir="rtl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-0.5 rounded-full border border-emerald-400/30">
              قفل الخصومات المتزامن (Concurrency Guard)
            </span>
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-3 py-0.5 rounded-full border border-amber-400/30">
              تطبيق تلقائي في محرك الحجوزات ⚡
            </span>
          </div>
          <h3 className="font-black text-base text-white">محرك العروض والخصومات الذكية (Automated Promotions & Concurrency Engine)</h3>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            يتم حجز حصة الخصم مؤقتاً عند الـ Checkout بحالة <span className="font-mono text-emerald-300 font-bold">Reserved</span> مع قفل المدى الزمني (<span className="font-mono text-amber-300 font-bold">expiresAt</span>)، ثم تثبيتها كـ <span className="font-mono text-teal-300 font-bold">Redeemed</span> فور تأكيد الدفع والـ Webhook. تُحتسب عمولة المنصة بناءً على سياسة التسعير المحددة (السعر الأصلي vs السعر بعد الخصم).
          </p>
        </div>
      </div>

      {/* KPIs Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-sans">
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-end gap-4 hover:border-emerald-500 transition-all duration-200">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold">العروض النشطة</p>
            <h3 className="text-2xl font-black text-slate-850">{stats.active}</h3>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-end gap-4 hover:border-indigo-500 transition-all duration-200">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold">حجوزات استخدمت عروضاً</p>
            <h3 className="text-2xl font-black text-slate-850">{stats.bookingsWithOffers}</h3>
          </div>
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0 border border-indigo-100">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-150 shadow-sm flex items-center justify-end gap-4 hover:border-amber-500 transition-all duration-200">
          <div className="text-right">
            <p className="text-xs text-slate-400 font-bold">قيد المراجعة</p>
            <h3 className="text-2xl font-black text-slate-850">{stats.pending}</h3>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0 border border-amber-100">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mt-8 flex-row-reverse text-right">
        <button 
          onClick={openCreateModal}
          className="bg-slate-900 text-white font-bold px-8 py-4 rounded-2xl flex items-center gap-2 shadow-xl shadow-slate-900/25 hover:scale-105 hover:bg-slate-800 transition-all font-sans cursor-pointer self-stretch md:self-auto justify-center"
        >
          <Plus className="w-5 h-5 text-amber-500" /> إنشاء عرض جديد
        </button>
        <div>
          <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2 justify-end">
             🎟️ طلبات العروض والخصومات الذكية
          </h2>
          <p className="text-slate-500 text-sm mt-1">
             {isAdmin 
              ? 'متابعة وفحص واعتماد طلبات العروض الترويجية والخصومات لزيادة المبيعات.' 
              : 'قم بإنشاء وتعديل العروض الترويجية الذكية لإدارة نمو أعمالك.'}
          </p>
        </div>
      </div>

      {/* Promotions Table */}
      <div className="bg-white rounded-3xl border border-slate-150 shadow-sm overflow-hidden mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-right table-auto whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-150 font-sans">
              <tr>
                <th className="p-5">تفاصيل العرض</th>
                <th className="p-5">النوع</th>
                <th className="p-5">القيمة</th>
                <th className="p-5">النطاق المطبق</th>
                <th className="p-5">شروط العرض</th>
                <th className="p-5 text-center">تاريخ الانتهاء</th>
                <th className="p-5 text-center">الحالة</th>
                <th className="p-5">الحملة الإعلانية</th>
                <th className="p-5 text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-sans text-xs">
              {myPromotions.length > 0 ? myPromotions.map((p: any) => (
                <tr key={p.id} className="hover:bg-slate-50/75 transition-colors group cursor-pointer" onClick={() => setViewingPromotion(p)}>
                  <td className="p-5">
                    <div className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">{p.name}</div>
                    <div className="flex items-center gap-1.5 justify-end mt-1.5 flex-wrap">
                      {(!p.promotionPattern || p.promotionPattern === 'promo_code') && (
                        <span className="text-[9px] font-black bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          🎫 كود: {p.couponCode || 'LILATALAM'}
                        </span>
                      )}
                      {p.promotionPattern === 'early_bird' && (
                        <span className="text-[9px] font-black bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          ⏳ خصم حجز مبكر ({p.conditions?.earlyBird || 60} يوم)
                        </span>
                      )}
                      {p.promotionPattern === 'bundle' && (
                        <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-250 px-2 py-0.5 rounded-md flex items-center gap-1">
                          📦 باقة خدمات ({p.conditions?.bundleCount || 3} عناصر)
                        </span>
                      )}
                      {p.promotionPattern === 'closed_package' && (
                        <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                          🔒 باقة حجز مغلق
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400 font-bold font-mono">
                         #{String(p.id || '').slice(-6)}
                      </span>
                    </div>
                    {isAdmin && (
                      <div className="mt-2 flex items-center justify-end gap-1 bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg w-fit text-[10px] font-bold border border-slate-200 mr-auto">
                         بواسطة: {p.providerName || 'المنصة'}
                      </div>
                    )}
                  </td>
                  <td className="p-5">
                    <span className="font-bold text-slate-705">
                      {p.type === 'percentage' && 'نسبة مئوية'}
                      {p.type === 'fixed' && 'مبلغ ثابت'}
                      {p.type === 'free_service' && 'خدمة مجانية'}
                    </span>
                  </td>
                  <td className="p-5">
                    <span className="px-3 py-1.5 bg-blue-50/80 text-blue-700 rounded-xl text-xs font-black flex items-center gap-1 border border-blue-100 w-fit">
                       {p.type === 'percentage' && <Percent className="w-3 h-3" />}
                       {p.type === 'percentage' ? `${p.value}%` : p.type === 'fixed' ? `${p.value?.toLocaleString()} ر.س` : 'خدمة مجانية'}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-slate-700">
                       {p.applyTo === 'halls' ? 'القاعات والمرافق' : 'الخدمات المساندة'}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-end gap-1 max-w-[180px] truncate" title={getTargetItemNames(p)}>
                       <Target className="w-3.5 h-3.5 text-indigo-505" /> {p.targetIds?.length === 0 ? 'شامل لجميع العناصر' : getTargetItemNames(p)}
                    </div>
                  </td>
                  <td className="p-5">
                    <div className="flex flex-wrap gap-1 max-w-[200px] justify-end">
                       {p.conditions?.earlyBird && (
                          <span className="text-[10px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-amber-100">
                             قبل {p.conditions.earlyBird} يوم
                          </span>
                       )}
                       {p.conditions?.seasonal && (
                          <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-blue-100">
                             موسمي
                          </span>
                       )}
                       {p.conditions?.bundleCount && (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg flex items-center gap-1 border border-emerald-100">
                             أكثر من {p.conditions.bundleCount} خدمات
                          </span>
                       )}
                       {!p.conditions?.earlyBird && !p.conditions?.seasonal && !p.conditions?.bundleCount && (
                          <span className="text-[10px] text-slate-400 italic">بدون قيود</span>
                       )}
                    </div>
                  </td>
                  <td className="p-5 text-slate-600 font-mono text-center font-bold">{p.endDate || 'مفتوح'}</td>
                  <td className="p-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black border flex items-center justify-center gap-1.5 mx-auto w-fit ${
                      p.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm shadow-emerald-100' :
                      p.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200 shadow-sm shadow-amber-100' :
                      p.status === 'cancellation_requested' ? 'bg-rose-50 text-rose-700 border-rose-200 shadow-sm shadow-rose-100 animate-pulse' :
                      p.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200 shadow-sm shadow-red-100' :
                      p.status === 'cancelled' ? 'bg-slate-100 text-slate-500 border-slate-200 line-through' :
                      'bg-slate-100 text-slate-600 border-slate-200'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        p.status === 'active' ? 'bg-emerald-500' : 
                        p.status === 'pending' ? 'bg-amber-500 animate-ping' :
                        p.status === 'cancellation_requested' ? 'bg-rose-500 animate-ping' :
                        p.status === 'rejected' ? 'bg-red-500' : 'bg-slate-400'
                      }`} />
                      {p.status === 'active' ? 'نشط ومفعل' : 
                       p.status === 'pending' ? 'قيد المراجعة' :
                       p.status === 'cancellation_requested' ? 'قيد طلب الإلغاء' :
                       p.status === 'rejected' ? 'مرفوض' : 
                       p.status === 'cancelled' ? 'ملغي' : 'منتهي الصلاحية'}
                    </span>
                  </td>
                  <td className="p-5">
                    {p.hasAdCampaign ? (
                      <span className="bg-purple-50 text-purple-750 px-2 py-0.5 rounded-lg text-[10px] font-bold border border-purple-200 flex items-center gap-1 w-fit animate-pulse">
                         <Megaphone className="w-3 h-3 text-purple-500" /> حملة نشطة
                      </span>
                    ) : (
                      <span className="text-slate-300 text-[10px]">لا توجد حملة</span>
                    )}
                  </td>
                  <td className="p-5" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-center gap-1.5">
                       {/* 1. View Details */}
                       <button 
                         onClick={() => setViewingPromotion(p)}
                         className="p-1.5 bg-slate-50 text-slate-600 rounded-xl hover:bg-slate-150 transition-all border border-slate-200 cursor-pointer"
                         title="عرض التفاصيل"
                       >
                         <Eye className="w-3.5 h-3.5" />
                       </button>

                       {/* Admin Approval for Pending Requests */}
                       {isAdmin && p.status === 'pending' && (
                         <>
                           <button 
                             onClick={() => {
                               setApprovingPromotion(p);
                               setApprovedDiscountValue(p.value);
                               setChosenPolicy(p.commissionPolicy || 'CommissionOnDiscountedPrice');
                             }} 
                             className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200 cursor-pointer" 
                             title="موافقة واعتماد الطلب"
                           >
                             <CheckCircle2 className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={() => handleReject(p.id)} 
                             className="p-1.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 transition-all border border-red-200 cursor-pointer" 
                             title="رفض الطلب"
                           >
                             <X className="w-3.5 h-3.5" />
                           </button>
                         </>
                       )}

                       {/* Admin Handling for Cancellation Requests */}
                       {isAdmin && p.status === 'cancellation_requested' && (
                         <>
                           <button 
                             onClick={() => handleApproveCancellation(p.id)} 
                             className="p-1.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 transition-all border border-emerald-200 cursor-pointer" 
                             title="الموافقة على طلب الإلغاء"
                           >
                             <CheckCircle2 className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={() => handleRejectCancellation(p.id)} 
                             className="p-1.5 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-all border border-amber-200 cursor-pointer" 
                             title="رفض طلب الإلغاء واستمرار العرض"
                           >
                             <XCircle className="w-3.5 h-3.5" />
                           </button>
                         </>
                       )}

                       {/* 2. Edit option (Locked after approval) */}
                       {(isAdmin || p.status === 'pending' || p.status === 'rejected') ? (
                         <button 
                           onClick={(e) => openEditModal(p, e)} 
                           className="p-1.5 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-105 border border-blue-200 transition-all cursor-pointer" 
                           title="تعديل العرض"
                         >
                           <Pencil className="w-3.5 h-3.5" />
                         </button>
                       ) : (
                         <button 
                           disabled
                           onClick={(e) => {
                             e.stopPropagation();
                             showNotification('warning', 'محظور التعديل لحماية عقود العروض المعتمدة والنشطة.');
                           }}
                           className="p-1.5 bg-slate-100 text-slate-300 rounded-xl border border-slate-200 cursor-not-allowed" 
                           title="محظور التعديل لحماية عقود العروض المعتمدة"
                         >
                           <Pencil className="w-3.5 h-3.5" />
                         </button>
                       )}

                       {/* 3. Smart Retargeting */}
                       {(p.status === 'pending' || p.status === 'active') ? (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             setRetargetingPromotion(p);
                           }} 
                           className="p-1.5 bg-indigo-50 text-indigo-700 rounded-xl hover:bg-indigo-100 hover:text-indigo-900 border border-indigo-200 transition-all cursor-pointer" 
                           title="إعادة استهداف المهتمين (قوائم المفضلة)"
                         >
                           <Users className="w-3.5 h-3.5" />
                         </button>
                       ) : (
                         <button 
                           disabled
                           className="p-1.5 bg-slate-100 text-slate-300 rounded-xl border border-slate-200 cursor-not-allowed" 
                           title="إعادة الاستهداف غير متاحة للعروض الملغاة أو المنتهية"
                         >
                           <Users className="w-3.5 h-3.5" />
                         </button>
                       )}

                       {/* 4. Cancel Offer / Request Cancellation Button */}
                       {(p.status === 'pending' || p.status === 'active') && (
                         <button 
                           onClick={(e) => handleCancelOffer(p, e)} 
                           className="p-1.5 bg-rose-50 text-rose-700 rounded-xl hover:bg-rose-100 transition-all border border-rose-200 cursor-pointer" 
                           title={p.status === 'pending' || (p.startDate && new Date(p.startDate) > new Date()) ? 'إلغاء العرض الترويجي' : 'تقديم طلب إلغاء لإدارة المنصة'}
                         >
                           <XCircle className="w-3.5 h-3.5" />
                         </button>
                       )}

                       {/* Power active/toggle switch */}
                       {p.status === 'active' && (
                         <button 
                           onClick={(e) => handleToggleStatus(p, e)} 
                           className="p-1.5 bg-amber-50 text-amber-700 rounded-xl hover:bg-amber-100 transition-all border border-amber-200 cursor-pointer" 
                           title="تعطيل مؤقت / إيقاف"
                         >
                           <Power className="w-3.5 h-3.5" />
                         </button>
                       )}

                       {/* 5. Delete option (Locked if approved or started) */}
                       {(isAdmin || p.status === 'pending') ? (
                         <button 
                           onClick={(e) => handleDelete(p, e)} 
                           className="p-1.5 bg-slate-100 text-slate-500 rounded-xl hover:bg-red-50 hover:text-red-700 hover:border-red-200 transition-all border border-slate-200 cursor-pointer" 
                           title="حذف العرض"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       ) : (
                         <button 
                           onClick={(e) => {
                             e.stopPropagation();
                             showNotification('error', 'يُمنع حذف العروض المعتمدة أو التي بدأت للحفاظ على توثيق العقود، وتقتصر صلاحية الحذف النهائي على إدارة منصة ليلة.');
                           }}
                           className="p-1.5 bg-slate-100 text-slate-300 rounded-xl border border-slate-200 cursor-not-allowed" 
                           title="يُمنع حذف العروض المعتمدة أو التي بدأت"
                         >
                           <Trash2 className="w-3.5 h-3.5" />
                         </button>
                       )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={9} className="p-20 text-center text-slate-400 font-bold italic">لا توجد طلبات عروض مضافة حالياً.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* VIEW DETAILS OVERLAY MODAL */}
      {viewingPromotion && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden font-sans relative text-right">
            {/* Header */}
            <div className="bg-slate-900 text-white p-6 relative">
              <button 
                onClick={() => setViewingPromotion(null)} 
                className="absolute top-4 left-4 bg-white/10 text-white hover:text-red-400 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 justify-end text-right">
                <div>
                  <h3 className="font-black text-lg">{viewingPromotion.name}</h3>
                  <p className="text-slate-400 text-xs font-mono">معرف الطلب: #{viewingPromotion.id}</p>
                </div>
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-slate-950 shadow-lg shadow-amber-500/20 shrink-0">
                  <Percent className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Details body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              <div className="grid grid-cols-2 gap-4 text-right">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">الجهة المالكة للعرض</span>
                  <span className="text-xs font-black text-slate-800">{viewingPromotion.providerName || 'المنصة'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">حالة العرض الترويجي</span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black mt-0.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      viewingPromotion.status === 'active' ? 'bg-emerald-500' :
                      viewingPromotion.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    {viewingPromotion.status === 'active' && 'نشط ومفعل حالياً'}
                    {viewingPromotion.status === 'pending' && 'قيد المراجعة والاعتماد'}
                    {viewingPromotion.status === 'rejected' && 'طلب مرفوض'}
                    {viewingPromotion.status === 'expired' && 'منتهي الصلاحية'}
                  </span>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60 font-sans">
                <div className="flex justify-between items-center mb-2 flex-row-reverse text-right">
                  <span className="text-xs font-bold text-indigo-800">قيمة الخصم ونوعية العرض</span>
                  <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-md font-black">
                    {viewingPromotion.type === 'percentage' ? 'نسبة مئوية' : viewingPromotion.type === 'fixed' ? 'مبلغ ثابت' : 'خدمة مجانية'}
                  </span>
                </div>
                <div className="text-2xl font-black text-indigo-950 text-right">
                  {viewingPromotion.type === 'percentage' && `${viewingPromotion.value}% خصم`}
                  {viewingPromotion.type === 'fixed' && `${viewingPromotion.value?.toLocaleString()} ريال سعودي`}
                  {viewingPromotion.type === 'free_service' && 'إضافة خدمة مجانية مصاحبة'}
                </div>
              </div>

              <div className="space-y-2.5 text-right">
                <h4 className="text-xs font-black text-slate-705 border-r-2 border-slate-450 pr-2">النطاقات والشمولية المحددة</h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs leading-relaxed text-slate-700 font-bold text-right">
                  {getTargetItemNames(viewingPromotion)}
                </div>
              </div>

              <div className="space-y-2.5">
                <h4 className="text-xs font-black text-slate-705 border-r-2 border-slate-450 pr-2 text-right">شروط ومحفزات الاستحقاق الذكي</h4>
                <div className="grid grid-cols-1 gap-2">
                  {viewingPromotion.conditions?.earlyBird && (
                    <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 text-xs text-amber-900 flex items-center justify-between flex-row-reverse">
                      <span className="font-bold">معدل الحجز المبكر مطلوب</span>
                      <span className="font-black font-mono">قبل {viewingPromotion.conditions.earlyBird} يوم</span>
                    </div>
                  )}
                  {viewingPromotion.conditions?.seasonal && (
                    <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs text-blue-900 flex items-center justify-between flex-row-reverse">
                      <span className="font-bold">محدد بموسم أو تاريخ نافذة</span>
                      <span className="font-black font-mono">{viewingPromotion.conditions.seasonal.start} إلى {viewingPromotion.conditions.seasonal.end}</span>
                    </div>
                  )}
                  {viewingPromotion.conditions?.bundleCount && (
                    <div className="bg-emerald-50/50 p-3 rounded-xl border border-emerald-100 text-xs text-emerald-900 flex items-center justify-between flex-row-reverse">
                      <span className="font-bold">مستوى حزمة السلة</span>
                      <span className="font-black font-mono">عند حجز {viewingPromotion.conditions.bundleCount} خدمات مساندة</span>
                    </div>
                  )}
                  {!viewingPromotion.conditions?.earlyBird && !viewingPromotion.conditions?.seasonal && !viewingPromotion.conditions?.bundleCount && (
                    <div className="text-center p-4 bg-slate-50 text-slate-400 rounded-xl italic text-xs">لا توجد محفزات أو شروط، مطبق بشكل فوري ومباشر!</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs font-mono text-right">
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">يبدأ العمل به</span>
                  <span className="font-bold text-slate-800">{viewingPromotion.startDate || 'تاريخ فوري'}</span>
                </div>
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">تنتهي صلاحيته</span>
                  <span className="font-bold text-slate-800">{viewingPromotion.endDate || 'بدون نهاية'}</span>
                </div>
              </div>

              {viewingPromotion.hasAdCampaign && (
                <div className="p-3 bg-purple-50 rounded-2xl border border-purple-100 text-xs text-purple-900 flex items-center gap-2 justify-end text-right">
                  <span className="font-bold">مرتبط بحملة ترويجية إلكترونية مفعلة لزيادة الانتشار.</span>
                  <Megaphone className="w-4 h-4 text-purple-650 shrink-0" />
                </div>
              )}
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              {isAdmin && viewingPromotion.status === 'pending' ? (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={() => {
                      const pToApprove = viewingPromotion;
                      setViewingPromotion(null);
                      setApprovingPromotion(pToApprove);
                      setApprovedDiscountValue(pToApprove.value);
                      setChosenPolicy(pToApprove.commissionPolicy || 'CommissionOnDiscountedPrice');
                      setAdminRejectionNotes(pToApprove.adminNotes || '');
                    }} 
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 transition-all shadow-md text-xs cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    موافقة واعتماد الطلب وتحديد سياسة العمولة
                  </button>
                  <button 
                    onClick={() => {
                      handleReject(viewingPromotion.id);
                      setViewingPromotion(null);
                    }} 
                    className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-md text-xs cursor-pointer"
                  >
                    رفض الطلب
                  </button>
                </div>
              ) : (
                <div className="flex justify-end gap-2 w-full">
                  {(isAdmin || viewingPromotion.status === 'pending' || viewingPromotion.status === 'rejected') && (
                    <button 
                      onClick={(e) => {
                        setViewingPromotion(null);
                        openEditModal(viewingPromotion, e);
                      }}
                      className="px-6 py-2.5 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-105 border border-blue-200 transition-all text-xs cursor-pointer"
                    >
                      تعديل العرض
                    </button>
                  )}
                  <button 
                    onClick={() => setViewingPromotion(null)} 
                    className="px-6 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-black transition-all text-xs cursor-pointer"
                  >
                    إغلاق
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ADMIN APPROVAL & FINANCIAL POLICY MODAL */}
      {approvingPromotion && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-100 font-sans text-right" dir="rtl">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-l from-emerald-900 via-slate-900 to-slate-900 text-white flex items-start justify-between rounded-t-3xl border-b border-emerald-800">
              <button 
                onClick={() => setApprovingPromotion(null)} 
                className="p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <div>
                <div className="flex items-center gap-2 justify-end mb-1">
                  <span className="px-2.5 py-0.5 bg-emerald-500/30 text-emerald-300 rounded-full text-[10px] font-mono font-black border border-emerald-400/30">
                    {approvingPromotion.srvNumber || `SRV-26-${String(approvingPromotion.id).padStart(10, '0')}`}
                  </span>
                  <span className="px-2.5 py-0.5 bg-amber-500/30 text-amber-300 rounded-full text-[10px] font-black border border-amber-400/30">
                    طلب كود خصم معلق
                  </span>
                </div>
                <h3 className="font-black text-xl text-white">اعتماد العرض الترويجي وتحديد سياسة العمولة</h3>
                <p className="text-emerald-200/80 text-xs mt-1 font-medium">
                  مراجعة طلب المزود: <span className="font-bold text-white">{approvingPromotion.providerName}</span> لكود الخصم ({approvingPromotion.couponCode || 'LILATALAM'})
                </p>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Summary card */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold">كود الخصم المطلوب:</span>
                  <span className="font-mono font-black text-slate-800 bg-white px-2.5 py-1 rounded-lg border border-slate-200 inline-block text-sm">
                    {approvingPromotion.couponCode || approvingPromotion.name}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-0.5 font-bold">قيمة الخصم المطلوبة:</span>
                  <span className="font-mono font-black text-emerald-600 text-sm">
                    {approvingPromotion.type === 'percentage' ? `${approvingPromotion.value}% خصم` : `${approvingPromotion.value} ر.س`}
                  </span>
                </div>
              </div>

              {/* Adjust value input */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-700">تأكيد أو تعديل قيمة الخصم المعتمدة للعميل:</label>
                <input 
                  type="number"
                  value={approvedDiscountValue}
                  onChange={(e) => setApprovedDiscountValue(Number(e.target.value) || 0)}
                  className="w-full p-3 rounded-xl border border-slate-200 font-mono font-black text-emerald-700 bg-white outline-none focus:border-emerald-500 text-sm text-right"
                />
              </div>

              {/* Policy Selector */}
              <div className="space-y-3">
                <label className="block text-xs font-black text-slate-900 flex items-center justify-end gap-1.5">
                  تحديد سياسة مشاركة المنصة في الخصم (Platform Commission Policy)
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                </label>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Option 1: CommissionOnDiscountedPrice */}
                  <div 
                    onClick={() => setChosenPolicy('CommissionOnDiscountedPrice')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      chosenPolicy === 'CommissionOnDiscountedPrice'
                        ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        chosenPolicy === 'CommissionOnDiscountedPrice' ? 'border-emerald-600 bg-emerald-600 text-white' : 'border-slate-300'
                      }`}>
                        {chosenPolicy === 'CommissionOnDiscountedPrice' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="text-right flex-1">
                        <span className="text-xs font-black text-emerald-900 block mb-1">
                          العمولة بعد الخصم (مشاركة المنصة)
                        </span>
                        <p className="text-[11px] text-emerald-800/80 leading-relaxed font-medium">
                          تُحسب عمولة ليلة من السعر الصافي بعد الخصم. تشارك المنصة في دعم المبيعات وتحمل جزء من الخصم من عمولتها.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Option 2: CommissionOnOriginalPrice */}
                  <div 
                    onClick={() => setChosenPolicy('CommissionOnOriginalPrice')}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative ${
                      chosenPolicy === 'CommissionOnOriginalPrice'
                        ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3 flex-row-reverse">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                        chosenPolicy === 'CommissionOnOriginalPrice' ? 'border-amber-600 bg-amber-600 text-white' : 'border-slate-300'
                      }`}>
                        {chosenPolicy === 'CommissionOnOriginalPrice' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                      </div>
                      <div className="text-right flex-1">
                        <span className="text-xs font-black text-amber-900 block mb-1">
                          العمولة قبل الخصم (تحمل المزود)
                        </span>
                        <p className="text-[11px] text-amber-800/80 leading-relaxed font-medium">
                          تُحسب عمولة ليلة من السعر الأصلي قبل الخصم. لا تشارك المنصة في الخصم، ويتحمل المزود تكلفة الخصم كاملاً.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Interactive Financial Simulation Card */}
              <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-2">
                  <span className="text-amber-400 font-mono font-black">نسبة عمولة ليلة المفترضة: 10%</span>
                  <span className="font-black text-slate-200">📊 محاكاة حية للأثر المالي على حجز افتراضي (10,000 ر.س)</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="text-slate-400 font-bold border-b border-slate-800">
                      <tr>
                        <th className="p-2">البند المالي</th>
                        <th className="p-2 text-emerald-400">سياسة العمولة بعد الخصم</th>
                        <th className="p-2 text-amber-400">سياسة العمولة قبل الخصم</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono font-bold text-[11px]">
                      <tr>
                        <td className="p-2 text-slate-300 font-sans">المبلغ المدفوع من العميل</td>
                        <td className="p-2 text-emerald-300">9,000 ر.س</td>
                        <td className="p-2 text-amber-300">9,000 ر.س</td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-300 font-sans">عمولة منصة ليلة (10%)</td>
                        <td className="p-2 text-emerald-400 font-black">900 ر.س <span className="text-[9px] text-slate-400 font-sans font-normal">(من 9,000)</span></td>
                        <td className="p-2 text-amber-400 font-black">1,000 ر.س <span className="text-[9px] text-slate-400 font-sans font-normal">(من 10,000)</span></td>
                      </tr>
                      <tr>
                        <td className="p-2 text-slate-300 font-sans">مستحق المزود الصافي</td>
                        <td className="p-2 text-emerald-300 font-black">8,100 ر.س</td>
                        <td className="p-2 text-amber-300 font-black">8,000 ر.س</td>
                      </tr>
                      <tr className="bg-slate-800/40 font-sans text-[10px]">
                        <td className="p-2 text-slate-400">حصة مشاركة المنصة في الخصم</td>
                        <td className="p-2 text-emerald-300 font-bold">تتحمل المنصة 100 ر.س من الخصم</td>
                        <td className="p-2 text-amber-300 font-bold">تتحمل 0 ر.س (المزود يتحمل 1,000)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

              {/* Admin Notes / Rejection Directives Box */}
              <div className="p-4 bg-rose-50/60 rounded-2xl border border-rose-200/80 space-y-2">
                <label className="block text-xs font-black text-rose-900 flex items-center justify-end gap-1.5">
                  ملاحظات وتوجيهات الإدارة للمزود (تظهر للمزود عند الرفض أو التعديل):
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                </label>
                <textarea 
                  rows={2}
                  placeholder="مثال: يرجى تعديل تاريخ بداية العرض لتكون بعد أسبوعين من تاريخ اليوم، أو تعديل قيمة الخصم لتصبح 10% كحد أقصى لضمان الهامش المالي..."
                  value={adminRejectionNotes}
                  onChange={(e) => setAdminRejectionNotes(e.target.value)}
                  className="w-full p-3 rounded-xl border border-rose-200 bg-white font-sans text-xs text-slate-800 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 text-right"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-6 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 rounded-b-3xl">
              <button 
                onClick={() => setApprovingPromotion(null)}
                className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold transition-all text-xs cursor-pointer"
              >
                إلغاء
              </button>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    handleReject(approvingPromotion.id, adminRejectionNotes);
                    setApprovingPromotion(null);
                  }}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all shadow text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <XCircle className="w-4 h-4 text-white" />
                  رفض الطلب وإرسال الملاحظات للمزود
                </button>

                <button 
                  onClick={() => {
                    handleApprove(approvingPromotion.id, approvedDiscountValue, chosenPolicy);
                    setApprovingPromotion(null);
                  }}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black transition-all shadow-lg text-xs cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  تأكيد اعتماد الكود والسياسة المالية
                </button>
              </div>
            </div>
          </div>
        )}
      {retargetingPromotion && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200/60 overflow-hidden font-sans relative text-right" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-l from-indigo-900 to-slate-900 text-white p-6 relative">
              <button 
                onClick={() => setRetargetingPromotion(null)} 
                className="absolute top-4 left-4 bg-white/10 text-white hover:text-red-400 hover:bg-white/20 p-2 rounded-full transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-3 justify-start text-right">
                <div className="w-10 h-10 bg-indigo-500 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-lg">إعادة الاستهداف الذكي للمهتمين</h3>
                  <p className="text-slate-400 text-xs">تحويل اهتمام العملاء (المفضلة) إلى حجوزات مؤكدة</p>
                </div>
              </div>
            </div>

            {/* Details body */}
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto no-scrollbar">
              <p className="text-slate-600 text-xs leading-relaxed">
                يقوم هذا المحرك الذكي برصد وحصر كافة العملاء الذين أضافوا القاعة إلى <strong>قائمة المفضلة</strong>، ثم إرسال العرض الترويجي الحالي إليهم مباشرة عبر قنوات التواصل لتحفيزهم على الحجز الفوري.
              </p>

              {/* Select Hall */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">اختر القاعة المستهدفة لإعادة الاستهداف:</label>
                <select 
                  value={selectedRetargetHallId} 
                  onChange={(e) => setSelectedRetargetHallId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- اختر قاعة --</option>
                  {halls.filter((h: any) => !providerName || h.providerName === providerName).map((h: any) => (
                    <option key={h.id} value={h.id}>{h.name}</option>
                  ))}
                </select>
              </div>

              {/* Favorites Count Indicator */}
              {selectedRetargetHallId && (
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100/60 flex items-center justify-between text-right">
                  <div>
                    <span className="text-[10px] text-indigo-800 font-bold block mb-1">العملاء المهتمين (في المفضلة)</span>
                    {isCountingFavorites ? (
                      <span className="text-xs font-black text-slate-500 animate-pulse">جاري الحساب والرصد...</span>
                    ) : (
                      <span className="text-base font-black text-indigo-950 font-mono">
                        {favoritesCount !== null ? `${favoritesCount} عميل مهتم` : '0 عملاء'}
                      </span>
                    )}
                  </div>
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                    <Target className="w-5 h-5" />
                  </div>
                </div>
              )}

              {/* Message text area */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-700 block">نص الرسالة والإشعار الموجه للعملاء المهتمين:</label>
                <textarea 
                  rows={4}
                  value={retargetMessage}
                  onChange={(e) => setRetargetMessage(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs leading-relaxed text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="اكتب نصاً مخصصاً لجذب العميل وإقناعه..."
                />
              </div>
            </div>

            {/* Actions Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
              <button 
                onClick={() => setRetargetingPromotion(null)} 
                className="px-5 py-2.5 bg-slate-200 text-slate-700 hover:bg-slate-300 rounded-xl font-black transition-all text-xs cursor-pointer"
              >
                إلغاء
              </button>
              <button 
                disabled={isSendingRetarget || !selectedRetargetHallId || favoritesCount === 0}
                onClick={async () => {
                  try {
                    setIsSendingRetarget(true);
                    const response = await fetch('/api/marketing/retarget-favorites', {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        'x-user-role': userRole,
                        'x-user-id': '1'
                      },
                      body: JSON.stringify({
                        hallId: selectedRetargetHallId,
                        promotionId: retargetingPromotion.id,
                        customMessage: retargetMessage
                      })
                    });
                    
                    if (!response.ok) {
                      const errData = await response.json();
                      throw new Error(errData.error || 'فشل إرسال حملة إعادة الاستهداف');
                    }
                    
                    const data = await response.json();
                    showNotification('success', data.message || 'تم إرسال العرض والخصم لجميع العملاء المهتمين بنجاح!');
                    setRetargetingPromotion(null);
                  } catch (err: any) {
                    showNotification('error', err.message || 'حدث خطأ أثناء معالجة الحملة');
                  } finally {
                    setIsSendingRetarget(false);
                  }
                }}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                {isSendingRetarget ? 'جاري إطلاق الحملة...' : 'إطلاق حملة الاستهداف الفوري 🚀'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE & EDIT MODAL WIZARD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-305">
          <div className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-500 border border-slate-200/50 font-sans relative">
            {/* Modal Header */}
            <div className="bg-gradient-to-l from-slate-900 to-slate-800 p-6 md:p-8 text-white relative text-right">
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingPromotion(null);
                }} 
                className="absolute top-4 left-4 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4 justify-end">
                 <div>
                    <h2 className="text-xl font-black">{editingPromotion ? 'تعديل وتحديث العرض الترويجي' : 'بوابة تصميم العروض والخصومات'}</h2>
                    <p className="text-slate-400 text-xs font-medium">خطوات تخصيص وتجهيز العرض الترويجي الذكي للعملاء</p>
                 </div>
                 <div className="w-10 h-10 bg-amber-500 text-slate-950 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
                    <Percent className="w-5 h-5" />
                 </div>
              </div>
              
              {/* Stepper */}
              <div className="flex gap-2 mt-6 flex-row-reverse">
                 {[
                   { id: 1, label: 'الأساسيات' },
                   { id: 2, label: 'النطاق' },
                   { id: 3, label: 'الشروط' },
                   { id: 4, label: 'الجدولة والانتشار' }
                 ].map(s => (
                   <div key={s.id} className="flex-1 space-y-1.5 text-right font-sans">
                      <div className={`h-1.5 rounded-full transition-all duration-500 ${activeStep >= s.id ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)]' : 'bg-white/10'}`}></div>
                      <span className={`text-[10px] font-black uppercase tracking-wider ${activeStep >= s.id ? 'text-amber-500' : 'text-slate-500'}`}>{s.label}</span>
                   </div>
                 ))}
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 md:p-8 max-h-[55vh] overflow-y-auto no-scrollbar bg-slate-50/50 text-right">
              {activeStep === 1 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-right font-sans">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 justify-end">
                       التفاصيل الأساسية للعرض <div className="w-1.5 h-6 bg-blue-500 rounded-full"></div>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 mr-3.5">حدد اسماً جذاباً ونوع الخصم الذي ترغب بتقديمه لعملائك.</p>
                  </div>

                  <div className="space-y-5">
                    <div className="group">
                      <label className="block text-xs font-black text-slate-700 mb-2 group-focus-within:text-blue-600 transition-colors">اسم العرض الترويجي</label>
                      <input 
                        type="text" 
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثل: عرض اليوم الوطني، خصم الشتاء، إلخ..." 
                        className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 focus:bg-white bg-white outline-none transition-all shadow-sm font-medium text-sm text-right"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-705 mb-2">نوع ومسار العرض الترويجي (Promotion Path)</label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {[
                          { id: 'promo_code', label: 'كود خصم / كوبون 🎫', sub: 'أكواد وكوبونات مخصصة', icon: Percent, iconColor: 'text-amber-500' },
                          { id: 'early_bird', label: 'خصم الحجز المبكر ⏳', sub: 'خصم تلقائي للحجز المسبق', icon: CalendarDays, iconColor: 'text-indigo-500' },
                          { id: 'bundle', label: 'باقة الخدمات المشتركة 📦', sub: 'خصم دمج قاعة مع خدمات', icon: Plus, iconColor: 'text-emerald-500' },
                          { id: 'closed_package', label: 'باقة الحجز المغلق 🔒', sub: 'خصم نمط الباقة المغلقة', icon: ShieldCheck, iconColor: 'text-blue-500' }
                        ].map((pattern) => (
                          <button
                            key={pattern.id}
                            type="button"
                            onClick={() => {
                              const updatedCond = { ...formData.conditions };
                              if (pattern.id === 'early_bird') {
                                updatedCond.earlyBird = 60; // Default 60 days as requested
                                updatedCond.seasonal = undefined;
                                updatedCond.bundleCount = undefined;
                              } else if (pattern.id === 'bundle') {
                                updatedCond.bundleCount = 3;
                                updatedCond.earlyBird = undefined;
                                updatedCond.seasonal = undefined;
                              } else if (pattern.id === 'closed_package') {
                                updatedCond.bundleCount = undefined;
                                updatedCond.earlyBird = undefined;
                                updatedCond.seasonal = undefined;
                              }
                              setFormData({ 
                                ...formData, 
                                promotionPattern: pattern.id,
                                conditions: updatedCond
                              });
                            }}
                            className={`p-3 rounded-2xl border-2 text-right transition-all flex flex-col justify-between gap-1 cursor-pointer min-h-[100px] ${
                              formData.promotionPattern === pattern.id 
                                ? 'border-amber-500 bg-amber-50/20 text-slate-900 shadow-sm' 
                                : 'border-slate-100 bg-white hover:border-slate-200 text-slate-500'
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="w-5 h-5 rounded-md bg-slate-50 flex items-center justify-center shrink-0">
                                <Percent className="w-3 h-3 text-slate-400" />
                              </span>
                              <input 
                                type="radio" 
                                checked={formData.promotionPattern === pattern.id}
                                onChange={() => {}} // Controlled via button click
                                className="accent-amber-500 cursor-pointer"
                              />
                            </div>
                            <div className="mt-1">
                              <div className="text-[10px] font-black leading-tight">{pattern.label}</div>
                              <div className="text-[8px] opacity-75 mt-0.5 leading-tight">{pattern.sub}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {formData.promotionPattern === 'promo_code' && (
                      <div className="grid grid-cols-2 gap-3 p-4 bg-amber-50/20 rounded-2xl border border-amber-100/50 animate-in zoom-in-95 duration-200">
                        <div className="group text-right">
                          <label className="block text-xs font-black text-amber-900 mb-1">رمز الكوبون (Promo Code)</label>
                          <input 
                            type="text" 
                            placeholder="مثال: COU-10"
                            value={formData.couponCode || ''}
                            onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
                            className="w-full p-2.5 rounded-lg border border-amber-200 focus:border-amber-500 bg-white font-mono font-black text-center text-sm"
                          />
                        </div>
                        <div className="group text-right">
                          <label className="block text-xs font-black text-amber-900 mb-1">الحد الأقصى للاستخدام</label>
                          <input 
                            type="number" 
                            placeholder="مثال: 100 مرة"
                            value={formData.usageLimit || ''}
                            onChange={(e) => setFormData({ ...formData, usageLimit: parseInt(e.target.value) || '' })}
                            className="w-full p-2.5 rounded-lg border border-amber-200 focus:border-amber-500 bg-white font-bold text-center text-sm"
                          />
                        </div>
                      </div>
                    )}

                    {/* Commission Calculation Policy */}
                    <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100/80 space-y-2 text-right">
                      <label className="block text-xs font-black text-emerald-950">سياسة احتساب عمولة المنصة عند الخصم (Commission Policy)</label>
                      <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                        حدد القاعدة المحاسبية لاقتطاع عمولة منصة ليلة من الحجوزات المستفيدة من هذا العرض:
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
                        <label className={`p-3 rounded-xl border text-right cursor-pointer flex items-start gap-2 transition-all ${
                          formData.commissionPolicy !== 'CommissionOnOriginalPrice' 
                            ? 'bg-white border-emerald-500 shadow-sm text-emerald-950 font-bold' 
                            : 'bg-white/60 border-slate-200 text-slate-600'
                        }`}>
                          <input 
                            type="radio" 
                            name="commissionPolicy"
                            checked={formData.commissionPolicy !== 'CommissionOnOriginalPrice'}
                            onChange={() => setFormData({ ...formData, commissionPolicy: 'CommissionOnDiscountedPrice' })}
                            className="mt-0.5 accent-emerald-600 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black block">بعد الخصم (CommissionOnDiscounted)</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">تُقتطع عمولة ليلة من المبلغ الصافي الفعلي بعد الخصم</span>
                          </div>
                        </label>

                        <label className={`p-3 rounded-xl border text-right cursor-pointer flex items-start gap-2 transition-all ${
                          formData.commissionPolicy === 'CommissionOnOriginalPrice' 
                            ? 'bg-white border-emerald-500 shadow-sm text-emerald-950 font-bold' 
                            : 'bg-white/60 border-slate-200 text-slate-600'
                        }`}>
                          <input 
                            type="radio" 
                            name="commissionPolicy"
                            checked={formData.commissionPolicy === 'CommissionOnOriginalPrice'}
                            onChange={() => setFormData({ ...formData, commissionPolicy: 'CommissionOnOriginalPrice' })}
                            className="mt-0.5 accent-emerald-600 cursor-pointer"
                          />
                          <div>
                            <span className="text-xs font-black block">قبل الخصم (CommissionOnOriginal)</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">تُقتطع عمولة ليلة من السعر الأساسي للخدمة قبل الخصم</span>
                          </div>
                        </label>
                      </div>
                    </div>

                    {isAdmin && (
                      <div className="group">
                        <label className="block text-xs font-black text-slate-700 mb-2 font-sans">الجهة المقدمة (صاحب العرض)</label>
                        <select
                          value={formData.providerName}
                          onChange={(e) => setFormData({ ...formData, providerName: e.target.value })}
                          className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 bg-white outline-none font-bold text-slate-700 transition-all text-sm appearance-none text-right cursor-pointer"
                        >
                          <option value="المنصة">المنصة (عرض منصة ليلة العام)</option>
                          {providers.map((p: any) => (
                            <option key={p.id} value={p.name}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                       <label className="block text-xs font-black text-slate-700 mb-3 font-sans">نوع الخصم المستهدف</label>
                       <div className="grid grid-cols-3 gap-3">
                         {[
                           { id: 'percentage', label: 'نسبة مئوية', sub: '-% من السعر', icon: Percent },
                           { id: 'fixed', label: 'مبلغ ثابت', sub: 'مبلغ مقطوع', icon: Wallet },
                           { id: 'free_service', label: 'خدمة مجانية', sub: 'إضافة مجانية', icon: Plus }
                         ].map((type) => (
                           <button 
                             key={type.id}
                             type="button"
                             onClick={() => setFormData({ ...formData, type: type.id as any, value: 0 })}
                             className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all relative group cursor-pointer ${
                               formData.type === type.id 
                                ? `border-indigo-500 bg-indigo-50/50 text-indigo-700 shadow-md scale-[1.03] z-10` 
                                : 'border-white bg-white hover:border-slate-200 text-slate-500 shadow-sm'
                             }`}
                           >
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                               formData.type === type.id ? `bg-indigo-550 text-white` : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                             }`}>
                               <type.icon className="w-4 h-4" />
                             </div>
                             <div className="text-center">
                               <div className="text-xs font-black">{type.label}</div>
                               <div className="text-[9px] opacity-65 font-bold mt-0.5">{type.sub}</div>
                             </div>
                             {formData.type === type.id && (
                               <div className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-indigo-500 text-white rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                                 <CheckCircle2 className="w-3 h-3" />
                               </div>
                             )}
                           </button>
                         ))}
                       </div>
                    </div>

                    {formData.type !== 'free_service' ? (
                      <div className="animate-in zoom-in-95 duration-300">
                        <label className="block text-xs font-black text-slate-700 mb-2">قيمة الخصم المطلوبة</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={formData.value || ''}
                            onChange={(e) => setFormData({ ...formData, value: parseInt(e.target.value) || 0 })}
                            className="w-full p-4 rounded-xl border-2 border-slate-100 focus:border-blue-500 outline-none transition-all font-black text-xl text-center bg-white font-mono" 
                            placeholder="0"
                          />
                          <span className={`absolute left-6 top-1/2 -translate-y-1/2 text-lg font-black ${formData.type === 'percentage' ? 'text-blue-500' : 'text-emerald-500'}`}>
                             {formData.type === 'percentage' ? '%' : 'ر.س'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 animate-in zoom-in-95 duration-300 text-right">
                        <div className="grid grid-cols-1 gap-4 font-sans">
                           <div>
                              <label className="block text-xs font-black text-slate-700 mb-2">اختر الخدمة المجانية المضافة كهدية</label>
                              <select 
                                className="w-full p-4 rounded-xl border-2 border-slate-100 outline-none bg-white font-bold text-slate-700 appearance-none text-sm text-right cursor-pointer"
                                onChange={(e) => setFormData({ ...formData, freeServiceId: parseInt(e.target.value) })}
                                value={formData.freeServiceId || ''}
                              >
                                <option value="">اختر من قائمة خدماتك المتاحة...</option>
                                {(isAdmin 
                                  ? services 
                                  : services.filter((s:any) => s.provider === providerName)
                                ).map((s:any) => (
                                  <option key={s.id} value={s.id}>{s.name} ({s.provider})</option>
                                ))}
                              </select>
                           </div>
                           <div>
                              <label className="block text-xs font-black text-slate-700 mb-2 text-purple-600">الحد الأقصى لتغطية الخدمة (اختياري)</label>
                              <div className="relative">
                                <input 
                                  type="number" 
                                  placeholder="مثال: الخدمة مشمولة حتى 1000 ريال مجهود"
                                  className="w-full p-4 rounded-xl border-2 border-slate-100 outline-none bg-white font-bold text-sm text-center font-mono text-right" 
                                  value={formData.maxFreeServiceValue || ''}
                                  onChange={(e) => setFormData({ ...formData, maxFreeServiceValue: parseInt(e.target.value) || undefined })}
                                />
                                <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">ر.س</span>
                              </div>
                           </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {activeStep === 2 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-right">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 justify-end">
                       النطاق والهدف (Scope) <div className="w-1.5 h-6 bg-purple-500 rounded-full"></div>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 mr-3.5">حدد العناصر التي يشملها هذا العرض وتوزيع الخصم.</p>
                  </div>

                  <div className="space-y-6">
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 flex-row-reverse">
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, applyTo: 'halls', targetIds: []})}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
                          formData.applyTo === 'halls' ? 'bg-white text-purple-700 shadow-md border border-purple-100 scale-[1.02]' : 'text-slate-500'
                        }`}
                      >
                         القاعات والمرافق
                      </button>
                      <button 
                        type="button"
                        onClick={() => setFormData({...formData, applyTo: 'services', targetIds: []})}
                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-all cursor-pointer ${
                          formData.applyTo === 'services' ? 'bg-white text-purple-705 shadow-md border border-purple-100 scale-[1.02]' : 'text-slate-505'
                        }`}
                      >
                         الخدمات المساندة
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center px-1 flex-row-reverse">
                         <label className="text-xs font-black text-slate-700">اختر الوحدات المشمولة بالخصم:</label>
                         <button 
                           type="button"
                           onClick={() => setFormData({...formData, targetIds: []})}
                           className="text-[10px] bg-slate-205 text-slate-750 px-3 py-1 rounded-full font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                         >
                           تطبيق تلقائي على الكل (شامل)
                         </button>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto no-scrollbar p-1">
                        {(formData.applyTo === 'halls' 
                          ? halls.filter((h: any) => isAdmin || !formData.providerName || h.provider === formData.providerName || h.providerName === providerName) 
                          : services.filter((s:any) => isAdmin || s.provider === providerName || s.provider === formData.providerName)
                        ).map((item: any) => {
                          const isSelected = formData.targetIds?.includes(item.id);
                          return (
                            <button 
                              key={item.id}
                              type="button"
                              onClick={() => {
                                 const current = formData.targetIds || [];
                                 if (isSelected) {
                                   setFormData({ ...formData, targetIds: current.filter((id:any) => id !== item.id) });
                                 } else {
                                   setFormData({ ...formData, targetIds: [...current, item.id] });
                                 }
                              }}
                              className={`p-3 rounded-xl border text-right transition-all group flex items-center justify-between cursor-pointer ${
                                isSelected ? 'border-purple-600 bg-purple-50/55' : 'border-slate-100 bg-white hover:border-slate-250 hover:bg-slate-50'
                              }`}
                            >
                               <span className="text-[10px] font-mono font-bold text-slate-500">{(item.price || item.basePrice || 0).toLocaleString()} ر.س</span>
                               <div className="flex items-center gap-2">
                                 <div>
                                    <div className={`text-xs font-bold ${isSelected ? 'text-purple-950 text-right font-black' : 'text-slate-800 text-right'}`}>{item.name}</div>
                                    <div className="text-[9px] text-slate-400 font-medium font-sans text-right">{item.location || item.category || 'مرفق ترويجي'}</div>
                                 </div>
                                 <div className={`w-5 h-5 rounded flex items-center justify-center transition-colors ${isSelected ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-300'}`}>
                                    <Plus className={`w-3 h-3 transition-transform ${isSelected ? 'rotate-45' : ''}`} />
                                 </div>
                               </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-right">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 justify-end">
                       محرك الشروط الذكية (Conditions) <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 mr-3.5">تحكم بذكاء في توقيت وتفعيل العرض بناءً على معايير محددة.</p>
                  </div>

                  <div className="space-y-3 font-sans">
                    {/* Early Bird */}
                    <div className={`p-4 rounded-2xl border transition-all ${!!formData.conditions?.earlyBird ? 'border-amber-500 bg-amber-50/20' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                       <label className="flex items-center gap-3 cursor-pointer justify-between">
                          <input 
                            type="checkbox" 
                            checked={!!formData.conditions?.earlyBird}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              conditions: { ...formData.conditions, earlyBird: e.target.checked ? 30 : undefined } 
                            })}
                            className="w-5 h-5 rounded accent-amber-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 text-right mr-3">
                             <span className="font-black text-slate-805 text-sm block">شرط الحجز المبكر</span>
                             <p className="text-[10px] text-slate-505 font-medium mt-0.5">يتم تفعيل الخصم للعملاء الذين يحجزون قبل موعد المناسبة بمدة كافية.</p>
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${!!formData.conditions?.earlyBird ? 'bg-amber-505 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             <CalendarDays className="w-4 h-4" />
                          </div>
                       </label>
                       {formData.conditions?.earlyBird && (
                         <div className="mt-3 flex items-center gap-3 justify-end pl-11 animate-in slide-in-from-top-2 duration-200 font-sans">
                           <span className="text-xs font-bold text-slate-600">يوم قبل الفعالية</span>
                           <input 
                             type="number" 
                             value={formData.conditions.earlyBird}
                             onChange={(e) => setFormData({
                               ...formData,
                               conditions: { ...formData.conditions, earlyBird: parseInt(e.target.value) || 0 }
                             })}
                             className="w-20 p-2 rounded-lg border border-amber-250 outline-none focus:border-amber-500 bg-white font-black text-center text-amber-808 text-sm font-mono"
                           />
                           <span className="text-xs font-bold text-slate-600">يتطلب حجزاً مسبقاً بما لا يقل عن</span>
                         </div>
                       )}
                    </div>

                    {/* Seasonal */}
                    <div className={`p-4 rounded-2xl border transition-all ${!!formData.conditions?.seasonal ? 'border-indigo-500 bg-indigo-50/20' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                       <label className="flex items-center gap-3 cursor-pointer justify-between">
                          <input 
                            type="checkbox" 
                            checked={!!formData.conditions?.seasonal}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              conditions: { ...formData.conditions, seasonal: e.target.checked ? { start: '', end: '' } : undefined } 
                            })}
                            className="w-5 h-5 rounded accent-indigo-500 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 text-right mr-3">
                             <span className="font-black text-slate-800 text-sm block">تطبيق بموسم محدد (فترة عطلات ومناسبات)</span>
                             <p className="text-[10px] text-slate-505 font-medium mt-0.5">حصر الخصومات بمناسبات أعياد ومواسم وطنية محددة.</p>
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${!!formData.conditions?.seasonal ? 'bg-indigo-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             <Activity className="w-4 h-4" />
                          </div>
                       </label>
                       {formData.conditions?.seasonal && (
                         <div className="mt-3 grid grid-cols-2 gap-3 pl-11 animate-in slide-in-from-top-2 duration-200 text-right">
                           <div className="group">
                             <label className="block text-[10px] font-black text-indigo-700 mb-1">تاريخ نهاية الموسم</label>
                             <input 
                               type="date" 
                               className="w-full p-2.5 rounded-lg border border-indigo-150 outline-none focus:border-indigo-500 text-xs font-bold bg-white text-right" 
                               value={formData.conditions.seasonal.end}
                               onChange={(e) => setFormData({
                                 ...formData,
                                 conditions: { ...formData.conditions, seasonal: { ...formData.conditions!.seasonal!, end: e.target.value } }
                               })}
                             />
                           </div>
                           <div className="group">
                             <label className="block text-[10px] font-black text-indigo-700 mb-1">تاريخ بداية الموسم</label>
                             <input 
                               type="date" 
                               className="w-full p-2.5 rounded-lg border border-indigo-155 outline-none focus:border-indigo-505 text-xs font-bold bg-white text-right" 
                               value={formData.conditions.seasonal.start}
                               onChange={(e) => setFormData({
                                 ...formData,
                                 conditions: { ...formData.conditions, seasonal: { ...formData.conditions!.seasonal!, start: e.target.value } }
                                })}
                             />
                           </div>
                         </div>
                       )}
                    </div>

                    {/* Bundle count */}
                    <div className={`p-4 rounded-2xl border transition-all ${!!formData.conditions?.bundleCount ? 'border-emerald-500 bg-emerald-50/20' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                       <label className="flex items-center gap-3 cursor-pointer justify-between">
                          <input 
                            type="checkbox" 
                            checked={!!formData.conditions?.bundleCount}
                            onChange={(e) => setFormData({ 
                              ...formData, 
                              conditions: { ...formData.conditions, bundleCount: e.target.checked ? 3 : undefined } 
                            })}
                            className="w-5 h-5 rounded accent-emerald-550 cursor-pointer shrink-0"
                          />
                          <div className="flex-1 text-right mr-3">
                             <span className="font-black text-slate-805 text-sm block">شرط القيمة وحجم حزمة الخدمات</span>
                             <p className="text-[10px] text-slate-500 font-medium mt-0.5">تفعيل الخصم حصرياً عند حجز خدمات متعددة ومرافق معاً بالطلب.</p>
                          </div>
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0 ${!!formData.conditions?.bundleCount ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                             <Plus className="w-4 h-4" />
                          </div>
                       </label>
                       {formData.conditions?.bundleCount && (
                         <div className="mt-3 flex items-center gap-3 justify-end pl-11 animate-in slide-in-from-top-2 duration-200 font-sans">
                           <span className="text-xs font-bold text-slate-600">خدمات مساندة ومرافق منوعة</span>
                           <input 
                             type="number" 
                             value={formData.conditions.bundleCount}
                             onChange={(e) => setFormData({
                               ...formData,
                               conditions: { ...formData.conditions, bundleCount: parseInt(e.target.value) || 0 }
                             })}
                             className="w-20 p-2 rounded-lg border border-emerald-250 outline-none focus:border-emerald-500 bg-white font-black text-center text-emerald-808 text-sm font-mono"
                           />
                           <span className="text-xs font-bold text-slate-600">عند اختيار حد أدنى</span>
                         </div>
                       )}
                    </div>
                  </div>
                </div>
              )}

              {activeStep === 4 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500 text-right">
                  <div>
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 justify-end">
                       الجدولة التاريخية ومراجعة النشر <div className="w-1.5 h-6 bg-emerald-500 rounded-full"></div>
                    </h3>
                    <p className="text-slate-500 text-xs mt-1 mr-3.5">مراجعة ختامية وجدولة تاريخ صلاحية الاستحقاق والمطابقة للعرض الترويجي.</p>
                  </div>

                  <div className="space-y-5">
                    <div className="bg-white p-5 rounded-2xl border border-slate-150 shadow-sm relative overflow-hidden group">
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-indigo-500"></div>
                        <div className="flex items-start gap-3 flex-row-reverse text-right">
                           <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center shrink-0 border border-indigo-100 font-bold">
                              <Megaphone className="w-5 h-5" />
                           </div>
                           <div className="flex-1 font-sans">
                              <h4 className="text-sm font-black text-slate-850 mb-1">طلب ربط حملة إعلانية ترويجية؟</h4>
                              <p className="text-[11px] text-slate-500 leading-relaxed font-bold">
                                 إذا أردت ميزة ظهور عرضك في صدارة صفحات المنصة السريعة لزيادة المبيعات والانتشار، يمكنك تفعيل الحملة الفورية من هنا.
                              </p>
                              <div className="mt-3 flex items-center justify-end">
                                <label className="flex items-center gap-2 text-xs font-black text-slate-705 cursor-pointer">
                                  ربطه بحملة إعلانية ممولة فورية لصاحب العرض
                                  <input 
                                    type="checkbox"
                                    checked={!!formData.hasAdCampaign}
                                    onChange={(e) => setFormData({ ...formData, hasAdCampaign: e.target.checked })}
                                    className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                                  />
                                </label>
                              </div>
                           </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-705 mr-1.5 font-sans">تاريخ انتهاء الفعالية وصلاحيته</label>
                        <div className="relative">
                          <input 
                            type="date" 
                            className="w-full p-3.5 pr-10 rounded-xl border border-slate-200 outline-none font-bold text-slate-808 bg-white text-xs text-right" 
                            value={formData.endDate}
                            onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                          />
                          <CalendarDays className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-xs font-black text-slate-705 mr-1.5 font-sans">تاريخ بدء تفعيل الخصم</label>
                        <div className="relative">
                          <input 
                            type="date" 
                            className="w-full p-3.5 pr-10 rounded-xl border border-slate-200 outline-none font-bold text-slate-808 bg-white text-xs text-right" 
                            value={formData.startDate}
                            onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                          />
                          <CalendarDays className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3 text-right flex-row-reverse font-sans">
                       <Wallet className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                       <div className="flex-1">
                          <h5 className="font-black text-red-800 text-[10px] mb-0.5 uppercase">تنبيه مالي مهم ومسؤولية</h5>
                          <p className="text-[10px] text-red-700 leading-relaxed font-bold opacity-85">
                             يتحمل الشريك ومزود الخدمة المسؤولية الكاملة عن تغطية قيمة العرض والخصومات المقدمة، ولا تضمن المنصة فارق القيمة.
                          </p>
                       </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-6 md:p-8 bg-white border-t border-slate-100 flex justify-between items-center bg-slate-50/20">
               {activeStep > 1 ? (
                 <button 
                  type="button"
                  onClick={() => setActiveStep(activeStep - 1)} 
                  className="px-6 py-2.5 rounded-xl font-black text-slate-600 bg-white border border-slate-202 hover:bg-slate-50 transition-all text-xs cursor-pointer"
                 >
                   السابق
                 </button>
               ) : <div />}

               <div className="flex items-center gap-2">
                  <button 
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingPromotion(null);
                    }}
                    className="px-6 py-2.5 rounded-xl font-bold text-slate-400 hover:text-red-500 transition-colors text-xs cursor-pointer"
                  >
                    إلغاء
                  </button>
                  {activeStep < 4 ? (
                    <button 
                      type="button"
                      onClick={() => setActiveStep(activeStep + 1)}
                      disabled={activeStep === 1 && !formData.name}
                      className="px-8 py-3 bg-slate-900 text-white rounded-xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 disabled:opacity-30 disabled:pointer-events-none text-xs cursor-pointer"
                    >
                      التالي
                    </button>
                  ) : (
                    <button 
                      type="button"
                      onClick={handleCreate}
                      className="px-8 py-3 bg-emerald-600 text-white rounded-xl font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2 text-xs cursor-pointer"
                    >
                      <ShieldCheck className="w-4 h-4" /> {editingPromotion ? 'تحديث وتعديل العرض' : 'إرسال طلب العرض'}
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
