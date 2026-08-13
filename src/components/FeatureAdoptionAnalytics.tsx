import React, { useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import { 
  Sparkles, TrendingUp, Users, CheckCircle2, Sliders, ShieldCheck, 
  MessageCircle, CreditCard, Send, Award, HelpCircle, Layers, Building2, Zap
} from 'lucide-react';

interface FeatureAdoptionAnalyticsProps {
  showNotification?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const ADOPTION_TREND_DATA = [
  { month: 'يناير', smartPricing: 45, eWallet: 60, eContracts: 65, addons: 40, liveChat: 80 },
  { month: 'فبراير', smartPricing: 52, eWallet: 68, eContracts: 72, addons: 45, liveChat: 85 },
  { month: 'مارس', smartPricing: 60, eWallet: 74, eContracts: 80, addons: 52, liveChat: 89 },
  { month: 'أبريل', smartPricing: 68, eWallet: 80, eContracts: 85, addons: 58, liveChat: 91 },
  { month: 'مايو', smartPricing: 74, eWallet: 83, eContracts: 88, addons: 61, liveChat: 94 },
  { month: 'يونيو', smartPricing: 78, eWallet: 86, eContracts: 92, addons: 65, liveChat: 96 },
];

const TIER_ADOPTION_DATA = [
  { tier: 'الباقة الأساسية', smartPricing: 40, eWallet: 70, eContracts: 85, addons: 35 },
  { tier: 'الباقة المتقدمة', smartPricing: 80, eWallet: 90, eContracts: 95, addons: 75 },
  { tier: 'الباقة الاحترافية VIP', smartPricing: 98, eWallet: 99, eContracts: 100, addons: 92 },
];

const PROVIDER_FEATURE_LIST = [
  { id: '1', name: 'قاعة ليلة الملكية للاحتفالات', tier: 'VIP', smartPricing: true, eWallet: true, eContracts: true, addons: true, chat: true, score: 100 },
  { id: '2', name: 'مجمع قاعات اللؤلؤة الكبرى', tier: 'المتقدمة', smartPricing: true, eWallet: true, eContracts: true, addons: false, chat: true, score: 80 },
  { id: '3', name: 'مؤسسة الماس للضيافة والتنظيم', tier: 'المتقدمة', smartPricing: false, eWallet: true, eContracts: true, addons: true, chat: true, score: 80 },
  { id: '4', name: 'قاعة الأسطورة بالرياض', tier: 'الأساسية', smartPricing: false, eWallet: true, eContracts: true, addons: false, chat: true, score: 60 },
  { id: '5', name: 'شركة النجوم للصوتيات والإضاءة', tier: 'الأساسية', smartPricing: false, eWallet: false, eContracts: true, addons: false, chat: true, score: 40 },
];

export function FeatureAdoptionAnalytics({ showNotification = () => {} }: FeatureAdoptionAnalyticsProps) {
  const [selectedFeature, setSelectedFeature] = useState<string>('all');
  const [isSendingNudge, setIsSendingNudge] = useState<boolean>(false);

  const handleSendNudgeCampaign = (providerName?: string) => {
    setIsSendingNudge(true);
    setTimeout(() => {
      setIsSendingNudge(false);
      showNotification('success', providerName 
        ? `تم إرسال إشعار توجيهي مخصص لـ ${providerName} لتفعيل المزايا المتبقية!` 
        : 'تم إرسال حملة حث المزايا التفاعلية لجميع المزودين غير المفعلين بنجاح!');
    }, 700);
  };

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-indigo-800/40">
        <div className="relative z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            تحليلات استخدام وتفعيل المزايا البرمجية (Feature Adoption Analytics)
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
            مؤشرات إقبال المزودين على المزايا الذكية 📈
          </h2>
          <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
            قياس معدلات تبني الشركاء لتقنيات المنصة مثل التسعير الذكي، المحفظة الرقمية، العقود الإلكترونية الموثقة، الشات المباشر، وباقات الخدمات الإضافية.
          </p>
        </div>
      </div>

      {/* Feature KPI Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">التسعير الذكي</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Zap className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-black text-indigo-600">78.4%</h3>
          <p className="text-[10px] text-emerald-600 font-bold">+12% هذا الشهر</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">المحفظة الرقمية</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><CreditCard className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-black text-emerald-600">86.2%</h3>
          <p className="text-[10px] text-emerald-600 font-bold">+8% هذا الشهر</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">العقود الإلكترونية</span>
            <div className="p-2 bg-purple-50 text-purple-600 rounded-xl"><ShieldCheck className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-black text-purple-600">91.5%</h3>
          <p className="text-[10px] text-emerald-600 font-bold">+5% هذا الشهر</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الخدمات الإضافية</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl"><Layers className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-black text-amber-600">64.8%</h3>
          <p className="text-[10px] text-amber-600 font-bold">بانتظار التوسّع</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">الشات المباشر</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl"><MessageCircle className="w-4 h-4" /></div>
          </div>
          <h3 className="text-2xl font-black text-blue-600">95.1%</h3>
          <p className="text-[10px] text-emerald-600 font-bold">نشط ومباشر دائمًا</p>
        </div>

      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Adoption Trend Line Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                مسار نمو تفعيل المزايا خلال 6 أشهر 📈
              </h3>
              <p className="text-xs text-slate-500">نسب الإقبال المئوية عبر الزمن لكل ميزة</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ADOPTION_TREND_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Line type="monotone" dataKey="smartPricing" name="التسعير الذكي" stroke="#6366f1" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="eWallet" name="المحفظة الرقمية" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="eContracts" name="العقود الإلكترونية" stroke="#a855f7" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="addons" name="الخدمات الإضافية" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Adoption by Tier Bar Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
                مقارنة الاستخدام حسب باقة اشتراك المزود 📊
              </h3>
              <p className="text-xs text-slate-500">التوزيع النسبي لتفعيل المزايا حسب فئة الشريك</p>
            </div>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={TIER_ADOPTION_DATA} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="tier" tick={{ fontSize: 11 }} />
                <YAxis unit="%" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '1rem', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Bar dataKey="smartPricing" name="التسعير الذكي" fill="#6366f1" radius={[8, 8, 0, 0]} />
                <Bar dataKey="eWallet" name="المحفظة" fill="#10b981" radius={[8, 8, 0, 0]} />
                <Bar dataKey="eContracts" name="العقود" fill="#a855f7" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Provider Feature Adoption Ledger & Action Push */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              سجل تفاصيل تفعيل المزايا لشركاء المنصة 🏢
            </h3>
            <p className="text-xs text-slate-500">جدول متابعة المزودين وإمكانية تحفيزهم بنقرة واحدة لتفعيل المزايا المتبقية</p>
          </div>

          <button
            onClick={() => handleSendNudgeCampaign()}
            disabled={isSendingNudge}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2"
          >
            <Send className="w-3.5 h-3.5" />
            إرسال إشعار حث المزايا لجميع الشركاء غير المفعلين
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5 rounded-r-2xl">المزود / المنشأة</th>
                <th className="p-3.5">باقة الاشتراك</th>
                <th className="p-3.5 text-center">التسعير الذكي</th>
                <th className="p-3.5 text-center">المحفظة</th>
                <th className="p-3.5 text-center">العقود</th>
                <th className="p-3.5 text-center">الخدمات الإضافية</th>
                <th className="p-3.5 text-center">مؤشر الجاهزية</th>
                <th className="p-3.5 text-left rounded-l-2xl">إجراء توجيهي</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {PROVIDER_FEATURE_LIST.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-indigo-500 shrink-0" /> {p.name}
                  </td>
                  <td className="p-3.5 font-semibold text-slate-600 dark:text-slate-300">{p.tier}</td>
                  <td className="p-3.5 text-center">
                    {p.smartPricing ? <span className="text-emerald-500 font-bold">✓ مفعل</span> : <span className="text-slate-300 font-bold">✕ معطل</span>}
                  </td>
                  <td className="p-3.5 text-center">
                    {p.eWallet ? <span className="text-emerald-500 font-bold">✓ مفعل</span> : <span className="text-slate-300 font-bold">✕ معطل</span>}
                  </td>
                  <td className="p-3.5 text-center">
                    {p.eContracts ? <span className="text-emerald-500 font-bold">✓ مفعل</span> : <span className="text-slate-300 font-bold">✕ معطل</span>}
                  </td>
                  <td className="p-3.5 text-center">
                    {p.addons ? <span className="text-emerald-500 font-bold">✓ مفعل</span> : <span className="text-slate-300 font-bold">✕ معطل</span>}
                  </td>
                  <td className="p-3.5 text-center font-black text-indigo-600 dark:text-indigo-400">
                    {p.score}%
                  </td>
                  <td className="p-3.5 text-left">
                    <button
                      onClick={() => handleSendNudgeCampaign(p.name)}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-[11px] font-bold rounded-lg transition-all"
                    >
                      حث على التفعيل
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
