import React, { useState } from 'react';
import { 
  Zap, MessageSquare, Send, CheckCircle2, AlertTriangle, 
  Smartphone, Clock, RefreshCw, Sliders, ShieldCheck, 
  ArrowUpRight, Heart, Gift, Star, Bell, Play, Check, Eye 
} from 'lucide-react';

interface SmartAutomationRetargetingTabProps {
  currentUser?: any;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function SmartAutomationRetargetingTab({
  currentUser,
  showNotification
}: SmartAutomationRetargetingTabProps) {
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<string>('WF-01');
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>('0501234567');
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);

  // Workflows data
  const [workflows, setWorkflows] = useState([
    {
      id: 'WF-01',
      title: 'استعادة الحجوزات غير المكتملة (Abandoned Bookings)',
      trigger: 'توقف العميل في خطوة الدفع لأكثر من ساعتين دون إتمام السداد',
      channels: 'WhatsApp + SMS',
      incentive: 'خصم إضافي 5% صالح لمدة 12 ساعة فقط',
      conversionRate: '28.4%',
      recoveredCount: 142,
      recoveredRevenue: 2840000,
      active: true,
      icon: Clock,
      whatsappTemplate: 'مرحباً {اسم_العميل} 🌸، لاحظنا أنك بدأت حجز {اسم_القاعة} في تاريخ {التاريخ} ولم تكمل خطوة الدفع. جهزنا لك خصماً خاصاً بنسبة 5% بكود (COMEBACK5) صالح لمدة 12 ساعة لتأكيد الحجز فورياً بعقد رقمي موثق:\nhttps://laylah.app/checkout/resume'
    },
    {
      id: 'WF-02',
      title: 'تذكير الذكرى السنوية للزواج (Anniversary Retention)',
      trigger: 'قبل 14 يوماً من تاريخ الزواج السنوي المسجل بالنظام',
      channels: 'WhatsApp',
      incentive: 'خصم حصري 15% على باقات العشاء والمناسبات الخاصة',
      conversionRate: '41.2%',
      recoveredCount: 88,
      recoveredRevenue: 792000,
      active: true,
      icon: Heart,
      whatsappTemplate: 'كل عام وأنتم بألف خير وسعادة يا {اسم_العميل} بمناسبة قرب ذكرى زواجكم المبارك 🎉! يسعدنا في منصة ليلة تقديم باقة عشاء رومانسي فاخر مع خصم 15% حصرياً لكم:\nhttps://laylah.app/anniversary-specials'
    },
    {
      id: 'WF-03',
      title: 'إعادة تنشيط العملاء المنقطعين (Dormant Reactivation)',
      trigger: 'مرور 6 أشهر كاملة على آخر حجز دون أي نشاط في الحساب',
      channels: 'SMS + Push Notification',
      incentive: 'كوبون رصيد 200 ر.س يودع فورياً في محفظة العميل',
      conversionRate: '16.8%',
      recoveredCount: 65,
      recoveredRevenue: 975000,
      active: true,
      icon: RefreshCw,
      whatsappTemplate: 'اشتقنا لك يا {اسم_العميل}! أضفنا رصيداً بقيمة 200 ر.س في محفظتك الإلكترونية بمنصة ليلة بمناسبة العروض الجديدة، استخدمه لحجز أي قاعة أو خدمة:\nhttps://laylah.app/wallet'
    },
    {
      id: 'WF-04',
      title: 'متابعة ما بعد المناسبة والتقييم (Post-Event Review)',
      trigger: 'صباح اليوم التالي بعد انتهاء الحفل مباشرة (الساعة 10:00 صباحاً)',
      channels: 'WhatsApp',
      incentive: '500 نقطة ولاء تضاف للمحفظة فور إتمام التقييم',
      conversionRate: '78.5%',
      recoveredCount: 310,
      recoveredRevenue: 0,
      active: true,
      icon: Star,
      whatsappTemplate: 'حمداً لله على تمام الفرح ومبارك لكم يا {اسم_العميل} 💍! نأمل أن ليلتكم في {اسم_القاعة} كانت استثنائية كما تمنيتم. نرجو منكم تقييم تجربتكم في دقيقة واحدة للحصول على 500 نقطة مكافأة:\nhttps://laylah.app/review'
    }
  ]);

  const selectedWorkflow = workflows.find(w => w.id === selectedWorkflowId) || workflows[0];

  const handleToggleWorkflow = (id: string) => {
    setWorkflows(prev => prev.map(w => w.id === id ? { ...w, active: !w.active } : w));
    if (showNotification) {
      showNotification('info', 'تم تحديث حالة تفعيل مسار الأتمتة الذكي.');
    }
  };

  const handleSendTestMessage = () => {
    if (!testPhoneNumber) {
      if (showNotification) showNotification('warning', 'يرجى إدخال رقم الهاتف التجريبي.');
      return;
    }
    setIsSendingTest(true);
    setTimeout(() => {
      setIsSendingTest(false);
      if (showNotification) {
        showNotification('success', `📱 تم إرسال رسالة الواتساب التجريبية بنجاح إلى (${testPhoneNumber})!`);
      }
    }, 500);
  };

  const totalRecoveredCount = workflows.reduce((s, w) => s + w.recoveredCount, 0);
  const totalRecoveredRev = workflows.reduce((s, w) => s + w.recoveredRevenue, 0);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-indigo-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-black mb-2 border border-indigo-400/30">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>محرك الأتمتة الذكية واستعادة الإيرادات المفقودة (Revenue Recovery)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              أتمتة الرسائل واستعادة الحجوزات (Smart Retargeting) 🔄
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              معالجة السلات المتروكة والحجوزات غير المكتملة عبر رسائل واتساب ورسائل نصية آلية مخصصة تعيد جذب العملاء وترفع معدلات التحويل دون أي تدخل بشري.
            </p>
          </div>
        </div>
      </div>

      {/* Top 3 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">الحجوزات المستعادة كلياً</p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-0.5">{totalRecoveredCount} حجز مكتمل</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0 border border-indigo-100">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">الإيرادات المحمية من الضياع</p>
            <p className="text-2xl font-black text-indigo-900 font-mono mt-0.5">{totalRecoveredRev.toLocaleString()} ر.س</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">متوسط معدل الاستجابة والتحويل</p>
            <p className="text-2xl font-black text-amber-800 font-mono mt-0.5">38.6%</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Workflows List */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Zap className="w-4 h-4 text-indigo-600" />
                <span>قواعد ومسارات الأتمتة المجدولة (Automated Workflows)</span>
              </h3>
              <span className="text-xs text-slate-500 font-bold">
                {workflows.filter(w => w.active).length} مسار نشط
              </span>
            </div>

            <div className="space-y-3">
              {workflows.map(wf => {
                const isSelected = wf.id === selectedWorkflowId;
                const IconComponent = wf.icon;
                return (
                  <div
                    key={wf.id}
                    onClick={() => setSelectedWorkflowId(wf.id)}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                      isSelected 
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-sm' 
                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'}`}>
                          <IconComponent className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-slate-900 text-xs sm:text-sm">{wf.title}</h4>
                          <p className="text-[11px] text-slate-500 font-medium mt-0.5">{wf.trigger}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${wf.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {wf.active ? 'مفعل 🟢' : 'معطل ⚪'}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleWorkflow(wf.id);
                          }}
                          className="text-xs text-slate-400 hover:text-indigo-600 font-bold cursor-pointer"
                        >
                          تبديل
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-medium">قناة الإرسال:</span>
                        <span className="font-bold text-slate-800">{wf.channels}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">العرض التحفيزي:</span>
                        <span className="font-bold text-indigo-700">{wf.incentive}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">معدل التحويل (CR):</span>
                        <span className="font-black text-emerald-600 font-mono">{wf.conversionRate}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: WhatsApp Interactive Simulator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-emerald-600" />
                <span>محاكي رسائل الواتساب التفاعلية (Live Preview)</span>
              </h3>
            </div>

            {/* Mobile Phone Mockup */}
            <div className="bg-slate-900 p-4 rounded-3xl border-4 border-slate-800 shadow-xl max-w-sm mx-auto">
              <div className="bg-[#0b141a] rounded-2xl overflow-hidden text-right font-sans text-xs">
                {/* WhatsApp Top Header */}
                <div className="bg-[#202c33] p-3 flex items-center gap-2.5 text-white border-b border-slate-700/50">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs shrink-0">
                    ليلة
                  </div>
                  <div>
                    <p className="font-black text-xs text-white">منصة ليلة | Laylah Platform</p>
                    <p className="text-[10px] text-emerald-400 font-medium">حساب تجاري موثق 🟢</p>
                  </div>
                </div>

                {/* Chat Bubble Area */}
                <div className="p-3 bg-[#0b141a] space-y-2 min-h-[220px] flex flex-col justify-end">
                  <div className="bg-[#005c4b] text-white p-3 rounded-2xl rounded-tr-none shadow-md space-y-1.5 leading-relaxed text-[11px]">
                    <p className="whitespace-pre-line">{selectedWorkflow.whatsappTemplate}</p>
                    <div className="text-[9px] text-emerald-200 text-left dir-ltr font-mono">
                      10:14 AM • تم التسليم ✔️✔️
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sandbox Testing Tool */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <label className="text-xs font-bold text-slate-700 block">اختبار الإرسال التجريبي (Sandbox Test):</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="05XXXXXXXX"
                  value={testPhoneNumber}
                  onChange={e => setTestPhoneNumber(e.target.value)}
                  className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold outline-none dir-ltr text-left"
                />
                <button
                  onClick={handleSendTestMessage}
                  disabled={isSendingTest}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
                  <span>{isSendingTest ? 'جاري الإرسال...' : 'إرسال تجربة'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
