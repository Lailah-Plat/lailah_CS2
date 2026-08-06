import React, { useState } from 'react';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  Calendar, 
  Percent, 
  Power, 
  Check, 
  X, 
  Play, 
  FileText, 
  Sparkles, 
  UserPlus, 
  CreditCard, 
  CalendarDays, 
  Briefcase,
  AlertCircle
} from 'lucide-react';
import { DiscountOffer } from '../../utils/discounts';

interface DiscountsManagementProps {
  discounts: DiscountOffer[];
  onSaveDiscounts: (discounts: DiscountOffer[]) => void;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export const DiscountsManagement: React.FC<DiscountsManagementProps> = ({
  discounts,
  onSaveDiscounts,
  showNotification
}) => {
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTrigger, setFilterTrigger] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Form Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<DiscountOffer | null>(null);
  const [formState, setFormState] = useState<Omit<DiscountOffer, 'usageCount' | 'totalSavings'>>({
    id: '',
    code: '',
    name: '',
    type: 'percentage',
    value: 0,
    triggerType: 'on_hall_booking',
    startDate: '2026-05-20',
    endDate: '2026-12-31',
    status: 'active'
  });

  // Sandbox Triggers State
  const [sandboxAmount, setSandboxAmount] = useState<number>(500);
  const [sandboxBulkCount, setSandboxBulkCount] = useState<number>(3); // For bulk booking test
  const [sandboxLog, setSandboxLog] = useState<{ id: string; msg: string; type: 'success' | 'info' | 'error', date: string }[]>([]);
  const [sandboxInvoice, setSandboxInvoice] = useState<{
    original: number;
    discounted: number;
    savings: number;
    appliedCode?: string;
    triggerApplied?: string;
  } | null>(null);

  // Filter logic
  const filteredDiscounts = discounts.filter(d => {
    const matchesSearch = d.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTrigger = filterTrigger === 'all' ? true : d.triggerType === filterTrigger;
    const matchesStatus = filterStatus === 'all' ? true : d.status === filterStatus;
    return matchesSearch && matchesTrigger && matchesStatus;
  });

  // Toggle Discount Status (Active / Inactive)
  const handleToggleStatus = (id: string) => {
    const updated = discounts.map(d => {
      if (d.id === id) {
        const nextStatus = d.status === 'active' ? 'inactive' : 'active';
        showNotification(
          'info', 
          `تم ${nextStatus === 'active' ? 'تفعيل' : 'تعطيل'} الخصم "${d.name}" بنجاح.`
        );
        return { ...d, status: nextStatus as 'active' | 'inactive' };
      }
      return d;
    });
    onSaveDiscounts(updated);
  };

  // Delete Discount
  const handleDelete = (id: string) => {
    const updated = discounts.filter(d => d.id !== id);
    onSaveDiscounts(updated);
    showNotification('success', 'تم حذف الخصم بنجاح من قائمة عروض وجهات المنصة.');
  };

  // Edit Initiator
  const startEdit = (discount: DiscountOffer) => {
    setEditingDiscount(discount);
    setFormState({
      id: discount.id,
      code: discount.code,
      name: discount.name,
      type: discount.type,
      value: discount.value,
      triggerType: discount.triggerType,
      startDate: discount.startDate,
      endDate: discount.endDate,
      status: discount.status
    });
    setIsModalOpen(true);
  };

  // Open Blank Form
  const startCreate = () => {
    setEditingDiscount(null);
    setFormState({
      id: `disc-${Date.now()}`,
      code: '',
      name: '',
      type: 'percentage',
      value: 10,
      triggerType: 'on_hall_booking',
      startDate: '2026-05-20',
      endDate: '2026-06-20',
      status: 'active'
    });
    setIsModalOpen(true);
  };

  // Submit Form (Save / Create)
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formState.code || !formState.name || formState.value <= 0) {
      showNotification('error', 'يرجى مراجعة وتعبئة الحقول بشكل صحيح.');
      return;
    }

    // Capitalize code
    const preparedForm = {
      ...formState,
      code: formState.code.toUpperCase().trim()
    };

    if (editingDiscount) {
      const updated = discounts.map(d => d.id === editingDiscount.id ? {
        ...d,
        ...preparedForm
      } : d);
      onSaveDiscounts(updated);
      showNotification('success', 'تم حفظ التعديلات وحفظ الخصم بالكامل.');
    } else {
      const newDiscount: DiscountOffer = {
        ...preparedForm,
        usageCount: 0,
        totalSavings: 0
      };
      onSaveDiscounts([newDiscount, ...discounts]);
      showNotification('success', 'تم استحداث كود خصم ترويجي جديد وتدشينه بالمنصة.');
    }
    setIsModalOpen(false);
  };

  // Human Readable Triggers converter
  const getTriggerLabel = (type: string) => {
    switch (type) {
      case 'on_registration': return 'عند تسجيل عميل جديد';
      case 'on_subscription': return 'عند ترقية أو الاشتراك بالباقات للشركاء';
      case 'on_hall_booking': return 'عند حجز قاعة أو مساحة عمل ومؤتمر';
      case 'on_service_request': return 'عند طلب الخدمات المساندة الإضافية';
      case 'on_hall_booking_promo': return 'عند حجز قاعات اجتماعات في فترة ترويجية معينة';
      case 'on_service_request_promo': return 'عند طلب خدمات إضافية في فترة ترويجية معينة';
      default: return type;
    }
  };

  // Interactive Sandbox Simulator handler
  const triggerSandboxSimulation = (triggerType: DiscountOffer['triggerType']) => {
    // Current simulated date is 2026-05-20 as per local system context
    const simDateStr = '2026-05-20';
    
    // Find first active promo matching this trigger Type valid now
    const eligibleDiscounts = discounts.filter(d => {
      // Check status
      if (d.status !== 'active') return false;
      if (d.triggerType !== triggerType) return false;
      
      const start = new Date(d.startDate);
      const end = new Date(d.endDate);
      const current = new Date(simDateStr);
      return current >= start && current <= end;
    });

    if (eligibleDiscounts.length === 0) {
      showNotification('warning', `المحاكي المالي: لا توجد عروض خصومات نشطة أو صالحة حالياً للمحفز ${getTriggerLabel(triggerType)} بتاريخ اليوم 20-05-2026.`);
      setSandboxInvoice(null);
      return;
    }

    // Pick top discount
    const discount = eligibleDiscounts[0];

    // Compute original amount based on simulated triggers
    let original = sandboxAmount;
    if (triggerType === 'on_subscription') {
      original = 399; // Default Pro Subscription price for simulation
    } else if (triggerType === 'on_registration') {
      original = 50; // Welcome signup token / credit representing the test
    }

    // If bulk booking
    if ((triggerType === 'on_hall_booking' || triggerType === 'on_hall_booking_promo') && sandboxBulkCount > 1) {
      original = original * sandboxBulkCount;
    }

    // Calculations
    let savings = 0;
    if (discount.type === 'percentage') {
      savings = (original * discount.value) / 100;
    } else if (discount.type === 'fixed') {
      savings = Math.min(discount.value, original);
    } else if (discount.type === 'bonus_balance') {
      savings = discount.value;
    }

    const discounted = original - savings;

    // Show simulated breakdown
    setSandboxInvoice({
      original,
      discounted,
      savings,
      appliedCode: discount.code,
      triggerApplied: triggerType
    });

    // Update parent discount statistics
    const updatedDiscounts = discounts.map(d => {
      if (d.id === discount.id) {
        return {
          ...d,
          usageCount: d.usageCount + 1,
          totalSavings: d.totalSavings + savings
        };
      }
      return d;
    });

    onSaveDiscounts(updatedDiscounts);

    // Add log
    const dateStr = new Date().toLocaleTimeString('ar-EG');
    const displayMsg = `تطبيق المحامي التفاعلي بنجاح: خصم [${discount.code}] للحدث (${getTriggerLabel(triggerType)}) - التوفير: ${savings.toFixed(2)} ر.س (السعر النهائي: ${discounted.toFixed(2)} ر.س).`;
    
    setSandboxLog(prev => [
      { id: Date.now().toString(), msg: displayMsg, type: 'success', date: dateStr },
      ...prev
    ]);

    showNotification('success', `محاكاة المحفز تمت بنجاح! تم تطبيق الخصم (${discount.code}) بقيمة ${savings.toFixed(2)} ر.س وتعديل صافي الإيرادات فورياً.`);
  };

  return (
    <div className="space-y-8 text-right" dir="rtl">
      
      {/* Intro Banner */}
      <div className="bg-gradient-to-r from-amber-500/5 to-amber-500/10 p-6 rounded-2xl border border-amber-500/20 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-600 animate-pulse" />
              نظام إدارة الخصومات والعروض والائتمان المباشر
            </h3>
            <p className="text-slate-600 text-xs mt-2 leading-relaxed">
              تتحكم هذه اللوحة الخاصة بالإدارة في تقديم أكواد الخصم، الخصومات المباشرة، والأرصدة الإضافية للعملاء لزيادة مبيعات المنصة والاحتفاظ بالمنتفعين.
              <span className="text-red-500 font-extrabold mr-1 block sm:inline">ملاحظة محاسبية: يتم تطبيق هذه الخصومات مباشرة في توازن (Gross vs Net) لخفض الإيراد الإجمالي والوصول إلى صافي الإيرادات الخاضع للتقييم الضريبي والزكوي والربحي.</span>
            </p>
          </div>
          <div>
            <button
              onClick={startCreate}
              className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-5 py-3 rounded-xl flex items-center gap-2 transition-all hover:scale-105 shadow-md shadow-amber-500/10 text-xs"
            >
              <Plus className="w-4 h-4" /> استحداث عرض / كود خصم
            </button>
          </div>
        </div>
      </div>

      {/* Grid: Search, Filters & Main list */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
          
          {/* Custom Search field */}
          <div className="relative w-full lg:w-1/3">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="ابحث باسم الخصم أو برمز الكود..." 
              className="w-full pl-4 pr-11 py-2.5 rounded-xl border border-slate-200 outline-none text-xs focus:border-amber-500 bg-slate-50 transition-colors"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)} 
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">فلترة المحفز:</span>
              <select 
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                value={filterTrigger}
                onChange={e => setFilterTrigger(e.target.value)}
              >
                <option value="all">كل المحفزات</option>
                <option value="on_registration">عند التسجيل</option>
                <option value="on_subscription">ترقية واشتراك الباقات</option>
                <option value="on_hall_booking">حجز قاعات ومكاتب</option>
                <option value="on_service_request">طلب خدمات مساندة</option>
                <option value="on_hall_booking_promo">حجز قاعة فترة ترويجية</option>
                <option value="on_service_request_promo">خدمة فترة ترويجية</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-slate-500">حالة الخصم:</span>
              <select 
                className="p-2.5 rounded-xl border border-slate-200 bg-white text-xs outline-none"
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
              >
                <option value="all">الكل</option>
                <option value="active">مفعل</option>
                <option value="inactive">معطل</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table representation */}
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="p-4 font-bold">العرض والرمز الكودي</th>
                <th className="p-4 font-bold">نمط ومقدار الخصم</th>
                <th className="p-4 font-bold">المحفز المبرمج بالنظام</th>
                <th className="p-4 font-bold">تاريخ السريان والانتهاء</th>
                <th className="p-4 font-bold text-center">مرات للاستخدام</th>
                <th className="p-4 font-bold">الوفورات المحققة (المخصوم)</th>
                <th className="p-4 font-bold text-center">الحالة</th>
                <th className="p-4 font-bold text-center">الإجراءات والسحب من الذاكرة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredDiscounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                    لا تتوفر خصومات نشطة تفي بمعايير البحث الحالية.
                  </td>
                </tr>
              ) : (
                filteredDiscounts.map(d => (
                  <tr key={d.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-800 text-sm">{d.name}</div>
                      <div className="inline-block mt-1 px-2.5 py-0.5 bg-amber-100 text-amber-800 rounded font-mono font-bold tracking-wider">{d.code}</div>
                    </td>
                    <td className="p-4">
                      {d.type === 'percentage' ? (
                        <span className="font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">نسبة {d.value}%</span>
                      ) : d.type === 'fixed' ? (
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">خصم {d.value} ر.س</span>
                      ) : (
                        <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">رصيد بونص {d.value} ر.س</span>
                      )}
                    </td>
                    <td className="p-4 font-medium text-slate-600">
                      {getTriggerLabel(d.triggerType)}
                    </td>
                    <td className="p-4 font-mono text-slate-500">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{d.startDate}</span>
                        <span className="text-slate-300">|</span>
                        <span>{d.endDate}</span>
                      </div>
                    </td>
                    <td className="p-4 text-center font-bold text-slate-800">
                      {d.usageCount}
                    </td>
                    <td className="p-4 font-semibold text-emerald-600 font-mono">
                      {(d.totalSavings || 0).toFixed(2)} ر.س
                    </td>
                    <td className="p-4 text-center">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-bold ${
                        d.status === 'active' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-rose-100 text-rose-700'
                      }`}>
                        {d.status === 'active' ? 'نشط ومفعل' : 'موقوف مؤقتاً'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => handleToggleStatus(d.id)}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            d.status === 'active' 
                              ? 'border-rose-200 text-rose-600 hover:bg-rose-50' 
                              : 'border-green-200 text-green-600 hover:bg-green-50'
                          }`}
                          title={d.status === 'active' ? 'تعطيل' : 'تفعيل'}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => startEdit(d)}
                          className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                          title="تعديل كامل البيانات"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(d.id)}
                          className="p-1.5 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors"
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

      {/* Sandbox Triggers Simulator */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h4 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <Play className="w-4 h-4 fill-amber-400 animate-pulse text-amber-400" />
              بيئة المحاكاة التفاعلية والاختبار الفوري للتوجيهات (Interactive Sandbox Simulator)
            </h4>
            <p className="text-slate-400 text-xs mt-1">بصفتك مديراً للنظام، قم بمحاكاة إجراءات العملاء لتطبيق نموذج (Gross vs Net) وحساب الوفورات والتقارير الفورية.</p>
          </div>
          <div className="bg-amber-400/10 text-amber-400 text-[10px] font-bold px-3 py-1 rounded-full border border-amber-400/20">
            تاريخ المحاكاة: 20-05-2026
          </div>
        </div>

        {/* Configuration input factors for simulation */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <label className="text-xs text-slate-400 block font-bold">ضبط قيمة العملية الافتراضية (ر.س):</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-center font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
              value={sandboxAmount}
              onChange={e => setSandboxAmount(Math.max(1, parseFloat(e.target.value) || 0))} 
            />
            <span className="text-[10px] text-slate-500 leading-relaxed block">تنطبق هذه الرسوم كرسوم أولية أساسية قبل الخصم، على حجز القاعات أو تقديم الخدمة الإضافية.</span>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 space-y-3">
            <label className="text-xs text-slate-400 block font-bold">عدد القاعات / الخدمات المحجوزة معاً:</label>
            <input 
              type="number" 
              className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-center font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
              value={sandboxBulkCount}
              onChange={e => setSandboxBulkCount(Math.max(1, parseInt(e.target.value) || 0))} 
            />
            <span className="text-[10px] text-slate-500 leading-relaxed block">يستخدم لمحاكاة حجز أكثر من قاعة أو عدة خدمات مساندة لبرمجة الخصومات المركبة.</span>
          </div>

          <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/80 flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-400 block font-bold">ميزان التأثير المالي السريع:</span>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">أي تشغيل لمحفز أدناه سيزيد من إجمالي الخصومات المستهلكة في قاعدة البيانات فورياً، مما يُحدث تأثيراً مباشراً في الفواتير وصافي الإيرادات.</p>
            </div>
            
            {/* Live sandbox trigger stats calculation */}
            <div className="flex justify-between items-center bg-slate-950 p-2 rounded-lg mt-2 text-xs">
              <span className="text-slate-400 font-bold">إجمالي خصم المنصة:</span>
              <span className="text-red-400 font-mono font-black">{discounts.reduce((sum, d) => sum + (d.totalSavings || 0), 0).toFixed(2)} ر.س</span>
            </div>
          </div>
        </div>

        {/* Buttons to click and simulate triggers */}
        <div>
          <span className="text-xs font-bold text-slate-400 block mb-3">اختر الحدث الذي ترغب بمحاكاته فورياً:</span>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <button
              onClick={() => triggerSandboxSimulation('on_registration')}
              className="bg-slate-950 hover:bg-amber-500 hover:text-slate-900 border border-slate-800 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <UserPlus className="w-5 h-5 text-amber-400 group-hover:text-slate-950" />
              <span className="text-[11px] font-bold">تسجيل عميل جديد</span>
            </button>

            <button
              onClick={() => triggerSandboxSimulation('on_subscription')}
              className="bg-slate-950 hover:bg-amber-500 hover:text-slate-900 border border-slate-800 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <CreditCard className="w-5 h-5 text-amber-400 group-hover:text-slate-950" />
              <span className="text-[11px] font-bold">ترقية باقة الشركاء</span>
            </button>

            <button
              onClick={() => triggerSandboxSimulation('on_hall_booking')}
              className="bg-slate-950 hover:bg-amber-500 hover:text-slate-900 border border-slate-800 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <CalendarDays className="w-5 h-5 text-amber-400 group-hover:text-slate-950" />
              <span className="text-[11px] font-bold">حجز قاعة فردية / متعددة</span>
            </button>

            <button
              onClick={() => triggerSandboxSimulation('on_service_request')}
              className="bg-slate-950 hover:bg-amber-500 hover:text-slate-900 border border-slate-800 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Briefcase className="w-5 h-5 text-amber-400 group-hover:text-slate-950" />
              <span className="text-[11px] font-bold">طلب خدمة مساندة</span>
            </button>

            <button
              onClick={() => triggerSandboxSimulation('on_hall_booking_promo')}
              className="bg-slate-950 hover:bg-amber-500 hover:text-slate-900 border border-slate-800 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Calendar className="w-5 h-5 text-amber-400 group-hover:text-slate-950 animate-bounce" />
              <span className="text-[11px] font-bold">حجز قاعة فترة ترويجية</span>
            </button>

            <button
              onClick={() => triggerSandboxSimulation('on_service_request_promo')}
              className="bg-slate-950 hover:bg-amber-500 hover:text-slate-900 border border-slate-800 rounded-xl p-3 text-center transition-all flex flex-col items-center justify-center gap-2 group"
            >
              <Sparkles className="w-5 h-5 text-amber-400 group-hover:text-slate-950" />
              <span className="text-[11px] font-bold">خدمة فترة ترويجية</span>
            </button>
          </div>
        </div>

        {/* Invoice Simulator response breakdown */}
        {sandboxInvoice && (
          <div className="bg-slate-950 border border-slate-800 p-5 rounded-2xl animate-in fade-in duration-300">
            <h5 className="text-xs font-bold text-slate-400 mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-400" />
              نموذج الفاتورة الضريبية والمحاكاة الفورية للفواتير وسجلات الربط المالي (Gross to Net Breakdown):
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-slate-900 rounded-xl">
                <span className="text-[10px] text-slate-500 block">الإيراد الإجمالي للعملية (Gross)</span>
                <span className="text-lg font-mono font-bold text-slate-300">{sandboxInvoice.original.toFixed(2)} ر.س</span>
              </div>
              <div className="p-3 bg-red-950/40 border border-red-900/30 rounded-xl">
                <span className="text-[10px] text-red-400 block font-bold">كود الخصم المطبق</span>
                <span className="text-sm font-mono font-black text-rose-400 block mt-0.5">{sandboxInvoice.appliedCode}</span>
              </div>
              <div className="p-3 bg-amber-950/40 border border-amber-900/30 rounded-xl">
                <span className="text-[10px] text-amber-400 block font-bold">أثر تخفيض الإيرادات (المنح المباشر)</span>
                <span className="text-lg font-mono font-black text-amber-400">-{sandboxInvoice.savings.toFixed(2)} ر.س</span>
              </div>
              <div className="p-3 bg-emerald-950/40 border border-emerald-900/30 rounded-xl">
                <span className="text-[10px] text-emerald-400 block font-bold">صافي الإيراد الفعلي للعملية (Net)</span>
                <span className="text-lg font-mono font-black text-emerald-400">{sandboxInvoice.discounted.toFixed(2)} ر.s</span>
              </div>
            </div>
          </div>
        )}

        {/* Recent sandbox trigger logs */}
        {sandboxLog.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-400 block">سجلات الأحداث الفورية بالمحاكي:</span>
            <div className="max-h-28 overflow-y-auto bg-slate-950 p-3 rounded-lg text-[10px] space-y-1.5 font-mono text-slate-400 divide-y divide-slate-900">
              {sandboxLog.map(log => (
                <div key={log.id} className="pt-1.5 flex justify-between items-center">
                  <span className="text-emerald-400 font-extrabold">{log.msg}</span>
                  <span className="text-slate-500">{log.date}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal: Add or Edit Discount */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-slate-50 p-5 border-b border-slate-100 flex justify-between items-center">
              <span className="font-bold text-slate-800">
                {editingDiscount ? `تعديل كود خصم: ${editingDiscount.code}` : 'استحداث كود خصم أو عرض من المنصة'}
              </span>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الرمز الكودي للترويج (بالإنجليزي):</label>
                  <input 
                    type="text" 
                    placeholder="مثال: WELCOME30" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 font-mono font-bold"
                    value={formState.code}
                    onChange={e => setFormState(prev => ({ ...prev, code: e.target.value }))}
                    disabled={!!editingDiscount}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">اسم العرض / المناسبة الترويجية:</label>
                  <input 
                    type="text" 
                    placeholder="مثال: خصم افتتاح الصيف" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500"
                    value={formState.name}
                    onChange={e => setFormState(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">طريقة الحساب مالي كخصم:</label>
                  <select 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white"
                    value={formState.type}
                    onChange={e => setFormState(prev => ({ ...prev, type: e.target.value as any }))}
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (ر.س)</option>
                    <option value="bonus_balance">رصيد إضافي وهدية</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">المقدار الترويجي:</label>
                  <input 
                    type="number" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 font-mono"
                    value={formState.value || ''}
                    onChange={e => setFormState(prev => ({ ...prev, value: Math.max(0, parseFloat(e.target.value) || 0) }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">الحالة الأولية بالمنصة:</label>
                  <select 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white font-medium"
                    value={formState.status}
                    onChange={e => setFormState(prev => ({ ...prev, status: e.target.value as any }))}
                  >
                    <option value="active">نشط وساري</option>
                    <option value="inactive">معطل مؤقتاً</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-500 block mb-1">مرتبط بمحفز النظام (تطبيق تلقائي):</label>
                <select 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none bg-white text-slate-700"
                  value={formState.triggerType}
                  onChange={e => setFormState(prev => ({ ...prev, triggerType: e.target.value as any }))}
                >
                  <option value="on_registration">تسجيل عميل جديد (كود ترحيبي)</option>
                  <option value="on_subscription">المزودين وترقية باقات الشركاء</option>
                  <option value="on_hall_booking">حجز قاعات ومساحات ومكاتب</option>
                  <option value="on_service_request">طلب الخدمات المساندة الإضافية</option>
                  <option value="on_hall_booking_promo">فترة ترويجية مخصصة لحجز قاعات</option>
                  <option value="on_service_request_promo">فترة ترويجية مخصصة للخدمات المساندة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">بداية فاعلية العرض وصلاحه:</label>
                  <input 
                    type="date" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 font-mono"
                    value={formState.startDate}
                    onChange={e => setFormState(prev => ({ ...prev, startDate: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 block mb-1">نهاية وبطلان صلاحه:</label>
                  <input 
                    type="date" 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none focus:border-amber-500 font-mono"
                    value={formState.endDate}
                    onChange={e => setFormState(prev => ({ ...prev, endDate: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {/* Warnings and Info flags */}
              <div className="bg-amber-50 border border-amber-100 p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-amber-800 leading-relaxed font-medium">
                  أي تعديل على الكود أو مقدار الخصم في فترات نشطة محاسبياً سيؤثر تباعاً في عمليات الفوترة وتوازن صافي الإيرادات بالصفحة الرئيسية للإدارة المالية العامة والضرائب ومطالبات هيئة الزكاة.
                </p>
              </div>

              <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
                <button
                  type="submit"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold px-6 py-2.5 rounded-xl text-xs transition-colors"
                >
                  حفظ العرض والترقبة بالمنصة
                </button>
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 rounded-xl text-xs border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold transition-colors"
                >
                  إلغاء التغيير
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};
