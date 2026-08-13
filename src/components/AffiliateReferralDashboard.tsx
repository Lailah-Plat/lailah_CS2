import React, { useState } from 'react';
import { 
  Share2, Link, Copy, Check, Users, TrendingUp, DollarSign, Plus, Eye, Award, ExternalLink, 
  BarChart2, Gift, CheckCircle2, ArrowUpRight, Search, Filter, Download, Zap
} from 'lucide-react';

interface AffiliateReferralDashboardProps {
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export interface TrackingLink {
  id: string; // e.g. MKT-26-0000000001
  partnerName: string;
  partnerType: 'influencer' | 'agency' | 'partner_provider';
  promoCode: string;
  trackingUrl: string;
  commissionType: 'percentage' | 'fixed';
  commissionValue: number; // e.g. 5% or 100 SAR
  discountPercentage: number; // e.g. 10%
  clicksCount: number;
  conversionsCount: number; // bookings count
  totalRevenueGenerated: number; // SAR
  totalCommissionEarned: number; // SAR
  status: 'active' | 'paused' | 'expired';
}

const INITIAL_LINKS: TrackingLink[] = [
  {
    id: 'MKT-26-0000000001',
    partnerName: 'سارة الدوسري (Snapchat Influencer)',
    partnerType: 'influencer',
    promoCode: 'LAYLA2026',
    trackingUrl: 'https://laylah.app/halls?ref=MKT-26-0000000001&utm_source=snapchat',
    commissionType: 'percentage',
    commissionValue: 5,
    discountPercentage: 10,
    clicksCount: 14250,
    conversionsCount: 42,
    totalRevenueGenerated: 184000,
    totalCommissionEarned: 9200,
    status: 'active'
  },
  {
    id: 'MKT-26-0000000002',
    partnerName: 'وكالة الأفق الرقمي للتسويق',
    partnerType: 'agency',
    promoCode: 'OFOQ15',
    trackingUrl: 'https://laylah.app/halls?ref=MKT-26-0000000002&utm_source=google_ads',
    commissionType: 'fixed',
    commissionValue: 250,
    discountPercentage: 15,
    clicksCount: 22100,
    conversionsCount: 68,
    totalRevenueGenerated: 295000,
    totalCommissionEarned: 1700,
    status: 'active'
  },
  {
    id: 'MKT-26-0000000003',
    partnerName: 'شبكة قصور الرياض للضيافة',
    partnerType: 'partner_provider',
    promoCode: 'RIYADH10',
    trackingUrl: 'https://laylah.app/halls?ref=MKT-26-0000000003&utm_source=partner_referral',
    commissionType: 'percentage',
    commissionValue: 3,
    discountPercentage: 10,
    clicksCount: 6500,
    conversionsCount: 18,
    totalRevenueGenerated: 98000,
    totalCommissionEarned: 2940,
    status: 'active'
  }
];

export function AffiliateReferralDashboard({ showNotification = () => {} }: AffiliateReferralDashboardProps) {
  const [trackingLinks, setTrackingLinks] = useState<TrackingLink[]>(INITIAL_LINKS);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New Link Modal State
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);
  const [partnerName, setPartnerName] = useState<string>('');
  const [partnerType, setPartnerType] = useState<'influencer' | 'agency' | 'partner_provider'>('influencer');
  const [promoCode, setPromoCode] = useState<string>('');
  const [commissionType, setCommissionType] = useState<'percentage' | 'fixed'>('percentage');
  const [commissionValue, setCommissionValue] = useState<number>(5);
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [utmSource, setUtmSource] = useState<string>('snapchat');

  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showNotification('success', 'تم نسخ رابط التتبع والتسويق المخصص إلى الحافظة بنجاح!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateTrackingLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!partnerName || !promoCode) {
      showNotification('error', 'يرجى إدخال اسم المسوق والرمز الترويجي');
      return;
    }

    const nextIdNum = trackingLinks.length + 1;
    const newId = `MKT-26-${String(nextIdNum).padStart(10, '0')}`;
    const generatedUrl = `https://laylah.app/halls?ref=${newId}&utm_source=${utmSource}`;

    const newLink: TrackingLink = {
      id: newId,
      partnerName,
      partnerType,
      promoCode: promoCode.toUpperCase(),
      trackingUrl: generatedUrl,
      commissionType,
      commissionValue: Number(commissionValue),
      discountPercentage: Number(discountPercentage),
      clicksCount: 0,
      conversionsCount: 0,
      totalRevenueGenerated: 0,
      totalCommissionEarned: 0,
      status: 'active'
    };

    setTrackingLinks([newLink, ...trackingLinks]);
    showNotification('success', `تم إنشاء رابط التتبع MKT-26-${String(nextIdNum).padStart(10, '0')} وتخصيص كود الخصم ${promoCode.toUpperCase()} بنجاح!`);
    setShowCreateModal(false);
    setPartnerName('');
    setPromoCode('');
  };

  // Metrics
  const totalRevenue = trackingLinks.reduce((acc, curr) => acc + curr.totalRevenueGenerated, 0);
  const totalCommissions = trackingLinks.reduce((acc, curr) => acc + curr.totalCommissionEarned, 0);
  const totalClicks = trackingLinks.reduce((acc, curr) => acc + curr.clicksCount, 0);
  const totalConversions = trackingLinks.reduce((acc, curr) => acc + curr.conversionsCount, 0);

  return (
    <div className="space-y-6 text-right" dir="rtl">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden border border-amber-800/40">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
              <Share2 className="w-4 h-4 text-amber-400" />
              لوحة حملات التسويق بالإحالة والعمولات (Affiliate & Referral Dashboard)
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              إدارة روابط التتبع واحتساب العمولات الآلية 🔗
            </h2>
            <p className="text-slate-300 text-xs md:text-sm max-w-2xl leading-relaxed">
              إنشاء وتخصيص روابط تتبع التسويق الرقمي للمشاهير والوكالات الإعلانية، متابعة الحجوزات المكتملة عبر الروابط، واحتساب العمولات المالية بدقة متناهية.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-lg hover:shadow-amber-500/30 transition-all flex items-center gap-2 shrink-0 active:scale-95"
          >
            <Plus className="w-5 h-5" />
            إنشاء رابط تتبع وكود تسويقي جديد
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500">إجمالي مبيعات روابط التتبع</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {totalRevenue.toLocaleString()} <span className="text-xs text-slate-500">ر.س</span>
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold">مبيعات موثقة ومحتسبة</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500">إجمالي العمولات المستحقة للمسوقين</p>
          <h3 className="text-2xl font-black text-amber-600 dark:text-amber-400">
            {totalCommissions.toLocaleString()} <span className="text-xs text-slate-500">ر.س</span>
          </h3>
          <p className="text-[10px] text-amber-600 font-bold">جاهزة للصرف والمستندات REV</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500">إجمالي النقرات (Clicks)</p>
          <h3 className="text-2xl font-black text-slate-900 dark:text-white">
            {totalClicks.toLocaleString()} <span className="text-xs text-slate-500">نقرة</span>
          </h3>
          <p className="text-[10px] text-indigo-600 font-bold">تتبع لحظي عبر UTM</p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200 dark:border-slate-800 shadow-sm space-y-1">
          <p className="text-xs font-bold text-slate-500">الحجوزات الناجحة والمكتملة</p>
          <h3 className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {totalConversions} <span className="text-xs text-slate-500">حجز</span>
          </h3>
          <p className="text-[10px] text-emerald-600 font-bold">نسبة التحويل 4.8%</p>
        </div>
      </div>

      {/* Active Tracking Links Table */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base">
              قائمة روابط التتبع النشطة والعمولات المرتبطة 📋
            </h3>
            <p className="text-xs text-slate-500">سجل المعرفات التسلسلية MKT-26 وكود التخفيض لكل حملة</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-bold border-b border-slate-200 dark:border-slate-700">
                <th className="p-3.5 rounded-r-2xl">المعرف الرقمي</th>
                <th className="p-3.5">اسم المسوق / الجهة</th>
                <th className="p-3.5">الرمز الترويجي</th>
                <th className="p-3.5">صيغة العمولة</th>
                <th className="p-3.5 text-center">النقرات</th>
                <th className="p-3.5 text-center">الحجوزات</th>
                <th className="p-3.5">المبيعات المحققة</th>
                <th className="p-3.5 font-black text-amber-600">العمولة المستحقة</th>
                <th className="p-3.5 text-left rounded-l-2xl">رابط التتبع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
              {trackingLinks.map(link => (
                <tr key={link.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-800 dark:text-slate-200">{link.id}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{link.partnerName}</td>
                  <td className="p-3.5">
                    <span className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 font-mono font-black rounded-lg border border-amber-200/50">
                      {link.promoCode} ({link.discountPercentage}% خصم)
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-600 dark:text-slate-300 font-bold">
                    {link.commissionType === 'percentage' ? `${link.commissionValue}% من قيمة الحجز` : `${link.commissionValue} ر.س عن كل حجز`}
                  </td>
                  <td className="p-3.5 text-center font-bold text-slate-700 dark:text-slate-300">{link.clicksCount.toLocaleString()}</td>
                  <td className="p-3.5 text-center font-black text-emerald-600">{link.conversionsCount}</td>
                  <td className="p-3.5 font-bold text-slate-900 dark:text-white">{link.totalRevenueGenerated.toLocaleString()} ر.س</td>
                  <td className="p-3.5 font-black text-amber-600 dark:text-amber-400">{link.totalCommissionEarned.toLocaleString()} ر.س</td>
                  <td className="p-3.5 text-left">
                    <button
                      onClick={() => handleCopyLink(link.trackingUrl, link.id)}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950 dark:hover:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1.5"
                    >
                      {copiedId === link.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === link.id ? 'تم النسخ' : 'نسخ رابط التتبع'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in-95 duration-150 text-right" dir="rtl">
            
            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-extrabold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Share2 className="w-5 h-5 text-amber-500" />
                إنشاء رابط تتبع وكود تسويق جديد (MKT-26)
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateTrackingLink} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">اسم المسوق أو الجهة الشريكة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عبدالله الراجحي (مؤثر) أو وكالة التسويق"
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">نوع الشريك:</label>
                  <select
                    value={partnerType}
                    onChange={(e) => setPartnerType(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="influencer">مؤثر مشاهير (Influencer)</option>
                    <option value="agency">وكالة تسويقية (Marketing Agency)</option>
                    <option value="partner_provider">مُزود شريك (Referral Partner)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">الرمز الترويجي للعملاء:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: PROMO2026"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold font-mono uppercase"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">خصم العميل (%):</label>
                  <input
                    type="number"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">نوع العمولة:</label>
                  <select
                    value={commissionType}
                    onChange={(e) => setCommissionType(e.target.value as any)}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  >
                    <option value="percentage">نسبة مئوية (%)</option>
                    <option value="fixed">مبلغ ثابت (SAR)</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 dark:text-slate-300">قيمة العمولة:</label>
                  <input
                    type="number"
                    value={commissionValue}
                    onChange={(e) => setCommissionValue(Number(e.target.value))}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300">مصدر الحملة (UTM Source):</label>
                <input
                  type="text"
                  value={utmSource}
                  onChange={(e) => setUtmSource(e.target.value)}
                  placeholder="snapchat, instagram, google_ads"
                  className="w-full p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all"
                >
                  حفظ وإنشاء رابط التتبع
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl"
                >
                  إلغاء
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
