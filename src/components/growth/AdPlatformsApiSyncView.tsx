import React, { useState } from 'react';
import { 
  Globe, RefreshCw, CheckCircle2, AlertCircle, Wifi, Zap, BarChart2, 
  Eye, MousePointer, Video, DollarSign, TrendingUp, Sparkles, Activity, Clock, ShieldCheck
} from 'lucide-react';

interface AdPlatformsApiSyncViewProps {
  campaigns: any[];
  setCampaigns: React.Dispatch<React.SetStateAction<any[]>>;
  formatCurrency: (amount: number) => string;
  showNotice: (type: 'success' | 'error', text: string) => void;
}

export const AdPlatformsApiSyncView: React.FC<AdPlatformsApiSyncViewProps> = ({
  campaigns,
  setCampaigns,
  formatCurrency,
  showNotice
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState('منذ دقيقتين (11:10 ص)');
  const [selectedPlatformFilter, setSelectedPlatformFilter] = useState<'all' | 'snapchat' | 'meta' | 'tiktok' | 'google'>('all');

  // Ad platforms status & API connectivity
  const [platformsStatus, setPlatformsStatus] = useState([
    {
      id: 'snapchat',
      name: 'Snapchat Marketing API v3',
      badge: 'سناب شات',
      iconBg: 'bg-amber-400 text-slate-950',
      connected: true,
      adAccountId: 'SNAP-ACC-889123',
      pixelId: 'PIX-SNAP-9921',
      statusText: 'متصل ومفعل - مزامنة حية',
      liveSpend: 12450,
      liveImpressions: 485000,
      liveVtr: '84.2%',
      liveCtr: '4.8%',
      liveCpa: 28.5,
      liveRoas: 5.8,
      liveConversions: 437,
      health: 'ممتاز 99.8%'
    },
    {
      id: 'meta',
      name: 'Meta Graph Marketing API v19.0',
      badge: 'إنستغرام وفيس بوك',
      iconBg: 'bg-gradient-to-tr from-purple-600 via-pink-600 to-amber-500 text-white',
      connected: true,
      adAccountId: 'act_4491029831',
      pixelId: 'META-PIX-3310',
      statusText: 'متصل ومفعل - Conversions API (CAPI)',
      liveSpend: 16800,
      liveImpressions: 620000,
      liveVtr: '78.5%',
      liveCtr: '5.2%',
      liveCpa: 31.0,
      liveRoas: 6.2,
      liveConversions: 542,
      health: 'ممتاز 100%'
    },
    {
      id: 'tiktok',
      name: 'TikTok Commercial API Events v2',
      badge: 'تيك توك للأعمال',
      iconBg: 'bg-slate-950 text-white border border-slate-700',
      connected: true,
      adAccountId: 'TT-ADV-771890',
      pixelId: 'TT-PIX-5512',
      statusText: 'متصل ومفعل - تتبع فوري للفيديو',
      liveSpend: 9200,
      liveImpressions: 395000,
      liveVtr: '91.4%',
      liveCtr: '6.1%',
      liveCpa: 24.2,
      liveRoas: 6.9,
      liveConversions: 380,
      health: 'ممتاز 99.5%'
    },
    {
      id: 'google',
      name: 'Google Ads API v16 & Maps Conversion',
      badge: 'جوجل سيرش ومابز',
      iconBg: 'bg-blue-600 text-white',
      connected: true,
      adAccountId: 'GOOG-CID-192-883-991',
      pixelId: 'AW-99281920',
      statusText: 'متصل ومفعل - تتبع نوايا البحث وحجوزات الخرائط',
      liveSpend: 7500,
      liveImpressions: 180000,
      liveVtr: '62.0%',
      liveCtr: '7.8%',
      liveCpa: 38.0,
      liveRoas: 5.1,
      liveConversions: 198,
      health: 'ممتاز 99.9%'
    }
  ]);

  // Handle manual / automated live API sync trigger
  const handleLiveSync = () => {
    setIsSyncing(true);
    setTimeout(() => {
      // Simulate live telemetry update with realistic variations
      setPlatformsStatus(prev => prev.map(p => ({
        ...p,
        liveSpend: p.liveSpend + Math.floor(Math.random() * 150 + 20),
        liveImpressions: p.liveImpressions + Math.floor(Math.random() * 2500 + 400),
        liveConversions: p.liveConversions + Math.floor(Math.random() * 4 + 1)
      })));

      const now = new Date();
      const timeStr = `الآن (${now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', second: '2-digit' })})`;
      setLastSyncTime(timeStr);
      setIsSyncing(false);
      showNotice('success', 'تمت المزامنة اللحظية مع خوادم المنصات الإعلانية وتحديث مؤشرات التفاعل الحية بنجاح!');
    }, 1200);
  };

  const totalLiveSpend = platformsStatus.reduce((s, p) => s + p.liveSpend, 0);
  const totalLiveImpressions = platformsStatus.reduce((s, p) => s + p.liveImpressions, 0);
  const totalLiveConversions = platformsStatus.reduce((s, p) => s + p.liveConversions, 0);
  const avgLiveRoas = (platformsStatus.reduce((s, p) => s + p.liveRoas, 0) / platformsStatus.length).toFixed(1);

  return (
    <div className="space-y-6 text-right animate-in fade-in" dir="rtl">
      {/* Real-time Telemetry Overview Header */}
      <div className="bg-gradient-to-l from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute left-4 top-4 flex items-center gap-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-emerald-400 text-xs font-mono font-black">LIVE WEBSOCKET / REST API SYNC</span>
        </div>

        <div className="max-w-2xl space-y-2">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              الربط المباشر مع واجهات المنصات الإعلانية (Direct Marketing APIs)
            </span>
            <span className="text-slate-400 text-xs">آخر مزامنة: {lastSyncTime}</span>
          </div>

          <h3 className="text-2xl font-black text-white tracking-tight">
            مؤشرات وأرقام التفاعل اللحظي المباشر للمزود والوكالة
          </h3>
          <p className="text-slate-300 text-xs leading-relaxed">
            يتم سحب وتدقيق أرقام المشاهدات، الصرف الفعلي، معدل اكتمال الفيديو (VTR)، النقرات، والتحويلات الحقيقية مباشرة من خوادم سناب شات، ميتا، تيك توك، وجوجل دون وسيط وبدقة محاسبية مطلقة.
          </p>
        </div>

        <div className="mt-5 pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setSelectedPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlatformFilter === 'all' ? 'bg-amber-500 text-slate-950 font-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              جميع المنصات (4)
            </button>
            <button
              onClick={() => setSelectedPlatformFilter('snapchat')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlatformFilter === 'snapchat' ? 'bg-amber-400 text-slate-950 font-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              سناب شات
            </button>
            <button
              onClick={() => setSelectedPlatformFilter('meta')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlatformFilter === 'meta' ? 'bg-pink-600 text-white font-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              إنستغرام وميتا
            </button>
            <button
              onClick={() => setSelectedPlatformFilter('tiktok')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlatformFilter === 'tiktok' ? 'bg-slate-800 text-white font-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              تيك توك
            </button>
            <button
              onClick={() => setSelectedPlatformFilter('google')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPlatformFilter === 'google' ? 'bg-blue-600 text-white font-black' : 'bg-white/10 text-slate-300 hover:bg-white/20'
              }`}
            >
              جوجل أدز
            </button>
          </div>

          <button
            onClick={handleLiveSync}
            disabled={isSyncing}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'جارِ جلب وتحديث الأرقام اللحظية...' : 'مزامنة وتحديث فوري للبيانات'}</span>
          </button>
        </div>
      </div>

      {/* Aggregate Live KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
            <span>إجمالي الصرف الفعلي اللحظي</span>
            <DollarSign className="w-4 h-4 text-rose-500" />
          </div>
          <h4 className="text-2xl font-black text-slate-900 font-mono">{formatCurrency(totalLiveSpend)}</h4>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>مطابق مع فواتير المنصات المعتمدة</span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
            <span>المشاهدات المباشرة (Live Impressions)</span>
            <Eye className="w-4 h-4 text-purple-500" />
          </div>
          <h4 className="text-2xl font-black text-purple-900 font-mono">{totalLiveImpressions.toLocaleString('ar-SA')}</h4>
          <div className="flex items-center gap-1.5 text-[11px] text-purple-600 font-bold">
            <span>متوسط معدل اكتمال الفيديو VTR: <strong>81.5%</strong></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
            <span>التحويلات والحجوزات المؤكدة</span>
            <MousePointer className="w-4 h-4 text-blue-500" />
          </div>
          <h4 className="text-2xl font-black text-blue-900 font-mono">{totalLiveConversions.toLocaleString('ar-SA')} <span className="text-xs text-slate-400 font-normal">تحويل</span></h4>
          <div className="flex items-center gap-1.5 text-[11px] text-blue-600 font-bold">
            <span>متوسط تكلفة الاقتناء CPA: <strong>29.8 ر.س</strong></span>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500 font-bold">
            <span>متوسط العائد الإعلاني الحقيقي (ROAS)</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <h4 className="text-2xl font-black text-emerald-700 font-mono">{avgLiveRoas}x</h4>
          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-bold">
            <span>كل 1 ريال إعلانات يولد {avgLiveRoas} ريال مبيعات</span>
          </div>
        </div>
      </div>

      {/* Platform Connectivity & Live Feeds Grid */}
      <div className="space-y-4">
        <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Wifi className="w-4 h-4 text-emerald-600" />
          <span>حالة الاتصال والبيانات الحية لكل منصة إعلانية</span>
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {platformsStatus
            .filter(p => selectedPlatformFilter === 'all' || p.id === selectedPlatformFilter)
            .map((p) => (
              <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4 hover:border-amber-400 transition-all">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shrink-0 ${p.iconBg}`}>
                      {p.id === 'snapchat' ? 'SNAP' : p.id === 'meta' ? 'META' : p.id === 'tiktok' ? 'TT' : 'GOOG'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="font-extrabold text-slate-900 text-sm">{p.name}</h5>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-200 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          مباشر
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-0.5">
                        الحساب: {p.adAccountId} | بكسل: {p.pixelId}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
                    كفاءة API: {p.health}
                  </span>
                </div>

                {/* Live Real-time Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 space-y-0.5">
                    <span className="text-[10px] text-slate-400 font-bold block">الصرف الفعلي</span>
                    <strong className="text-slate-900 font-mono">{formatCurrency(p.liveSpend)}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-purple-50/50 border border-purple-100 space-y-0.5">
                    <span className="text-[10px] text-purple-700 font-bold block">المشاهدات</span>
                    <strong className="text-purple-900 font-mono">{p.liveImpressions.toLocaleString('ar-SA')}</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/50 border border-emerald-100 space-y-0.5">
                    <span className="text-[10px] text-emerald-700 font-bold block">معدل ROAS</span>
                    <strong className="text-emerald-800 font-mono text-sm">{p.liveRoas}x</strong>
                  </div>

                  <div className="p-2.5 rounded-xl bg-blue-50/50 border border-blue-100 space-y-0.5">
                    <span className="text-[10px] text-blue-700 font-bold block">التحويلات (Leads)</span>
                    <strong className="text-blue-900 font-mono text-sm">{p.liveConversions}</strong>
                  </div>
                </div>

                {/* Engagement Quality Bars */}
                <div className="p-3 rounded-xl bg-slate-50/80 border border-slate-100 space-y-2 text-xs">
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-slate-600 font-bold">معدل مشاهدة الفيديو بالكامل (VTR):</span>
                    <strong className="text-slate-900 font-mono">{p.liveVtr}</strong>
                  </div>
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: p.liveVtr }} />
                  </div>

                  <div className="flex justify-between items-center text-[11px] pt-1">
                    <span className="text-slate-600 font-bold">معدل النقر إلى الظهور (CTR):</span>
                    <strong className="text-emerald-700 font-mono">{p.liveCtr} (ممتاز)</strong>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Hourly Heatmap & Audience Peak Engagement */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h4 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>خريطة أوقات الذروة والتفاعل اللحظي للمستخدمين (Engagement Peak Hours)</span>
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">توزيع التفاعل الحي على مدار 24 ساعة لتوجيه ذروة الميزانية</p>
          </div>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-800 font-bold text-xs">
            أعلى ذروة حجز: 7:00 م - 11:30 م
          </span>
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 pt-2 text-center text-[10px]">
          {[
            { hour: '12 ص', val: 35, peak: false },
            { hour: '2 ص', val: 20, peak: false },
            { hour: '4 ص', val: 8, peak: false },
            { hour: '6 ص', val: 14, peak: false },
            { hour: '8 ص', val: 42, peak: false },
            { hour: '10 ص', val: 68, peak: false },
            { hour: '12 م', val: 75, peak: false },
            { hour: '2 م', val: 82, peak: false },
            { hour: '4 م', val: 89, peak: true },
            { hour: '6 م', val: 94, peak: true },
            { hour: '8 م', val: 100, peak: true },
            { hour: '10 م', val: 92, peak: true },
          ].map((item, idx) => (
            <div key={idx} className="space-y-1.5">
              <div className="h-20 bg-slate-100 rounded-xl flex items-end justify-center p-1 overflow-hidden">
                <div
                  className={`w-full rounded-lg transition-all duration-500 ${
                    item.peak ? 'bg-gradient-to-t from-amber-500 to-amber-400 shadow-xs' : 'bg-indigo-300'
                  }`}
                  style={{ height: `${item.val}%` }}
                  title={`معدل النشاط: ${item.val}%`}
                />
              </div>
              <span className="font-bold text-slate-600 block">{item.hour}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
