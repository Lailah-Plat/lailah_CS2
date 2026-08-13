import React, { useState, useEffect } from 'react';
import { Share2, Link, Copy, Check, Users, TrendingUp, DollarSign, Plus, Eye, Award, ExternalLink } from 'lucide-react';

interface AffiliateMarketingTabProps {
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  userRole?: string;
}

export function AffiliateMarketingTab({ showNotification, userRole = 'provider' }: AffiliateMarketingTabProps) {
  const [affiliateCodes, setAffiliateCodes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [recentConversions, setRecentConversions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New code modal
  const [showModal, setShowModal] = useState<boolean>(false);
  const [promoterName, setPromoterName] = useState<string>('');
  const [promoterType, setPromoterType] = useState<string>('influencer');
  const [code, setCode] = useState<string>('');
  const [discountPercentage, setDiscountPercentage] = useState<number>(10);
  const [commissionPercentage, setCommissionPercentage] = useState<number>(5);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchAffiliates = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/marketing/affiliates');
      if (res.ok) {
        const data = await res.json();
        setAffiliateCodes(data.affiliateCodes || []);
        setSummary(data.summary || null);
        setRecentConversions(data.recentConversions || []);
      }
    } catch (err) {
      console.error('Failed to load affiliate codes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAffiliates();
  }, []);

  const handleCopyLink = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showNotification('success', 'تم نسخ رابط الإحالة المخصص إلى المحافظ الحافظة!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateAffiliate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoterName || !code) {
      showNotification('error', 'يرجى إدخال اسم المسوق والرمز التسويقي');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/marketing/affiliates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          promoterName,
          promoterType,
          code,
          discountPercentage,
          commissionPercentage
        })
      });

      const data = await res.json();
      setIsSubmitting(false);

      if (data.success) {
        showNotification('success', 'تم إنشاء كود التسويق ورابط الإحالة وتفعيل تتبع العمولات بنجاح!');
        setShowModal(false);
        setPromoterName('');
        setCode('');
        fetchAffiliates();
      } else {
        showNotification('error', data.error || 'حدث خطأ في إنشاء كود التسويق');
      }
    } catch (err: any) {
      setIsSubmitting(false);
      showNotification('error', 'خطأ في الاتصال بالخادم');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-amber-200 text-xs font-bold border border-white/10">
            <Share2 className="w-3.5 h-3.5" />
            برنامج التسويق بالإحالة والعمولات المخصصة (Affiliate Codes & Links)
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-white leading-tight">
            توسيع نطاق المبيعات عبر الروابط المخصصة وتتبع العمولات الآلي
          </h2>
          <p className="text-amber-100/90 text-sm md:text-base font-medium">
            أنشئ أكواد خصم وروابط مخصصة للمؤثرين، الوكالات، أو الشركاء مع التتبع المباشر لعدد النقرات، عمليات التحويل، وعمولات المبيعات التلقائية.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => setShowModal(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black rounded-xl text-sm transition-all shadow-lg flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              إنشاء كود إحالة جديد
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>إجمالي النقرات</span>
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-2xl font-black text-slate-800">{summary.totalClicks}</p>
            <span className="text-xs text-slate-400 font-medium">نقرة على روابط الإحالة</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>الحجوزات المحققة</span>
              <TrendingUp className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-2xl font-black text-emerald-600">{summary.totalConversions}</p>
            <span className="text-xs text-emerald-600 font-medium">معدل تحويل {summary.conversionRate}</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>حجم المبيعات</span>
              <DollarSign className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-2xl font-black text-slate-800">{summary.totalSalesVolumeSAR.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
            <span className="text-xs text-slate-400 font-medium">عبر أكواد الخصم</span>
          </div>

          <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm space-y-1">
            <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
              <span>العمولات المستحقة</span>
              <Award className="w-4 h-4 text-purple-500" />
            </div>
            <p className="text-2xl font-black text-purple-600">{summary.totalCommissionsEarnedSAR.toLocaleString()} <span className="text-xs font-normal">ر.س</span></p>
            <span className="text-xs text-purple-600 font-medium">محتسبة آلياً بالمحفظة</span>
          </div>
        </div>
      )}

      {/* Codes Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link className="w-5 h-5 text-amber-500" />
            <h3 className="font-black text-slate-800 text-base">قائمة أكواد الإحالة والروابط المخصصة</h3>
          </div>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
            {affiliateCodes.length} كود نشط
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-medium">جاري تحميل أداء الحملات...</div>
        ) : affiliateCodes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-medium">لا توجد أكواد تسويق حالية. انقر على إنشاء كود جديد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-black uppercase border-b border-slate-100">
                <tr>
                  <th className="p-4">الرمز (Code)</th>
                  <th className="p-4">اسم المسوق / الجهة</th>
                  <th className="p-4 text-center">الخصم / العمولة</th>
                  <th className="p-4 text-center">النقرات</th>
                  <th className="p-4 text-center">الحجوزات</th>
                  <th className="p-4 text-center">إجمالي المبيعات</th>
                  <th className="p-4 text-center">عمولة المسوق</th>
                  <th className="p-4 text-center">رابط الإحالة المباشر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {affiliateCodes.map((aff) => (
                  <tr key={aff.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-black text-amber-600">
                      <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg border border-amber-200">
                        {aff.code}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-800">
                      {aff.promoterName}
                      <span className="block text-xs font-normal text-slate-400 mt-0.5">
                        {aff.promoterType === 'agency' ? 'وكالة تسويق' : aff.promoterType === 'influencer' ? 'مؤثر / صانع محتوى' : 'شريك إحالة'}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        خصم {aff.discountPercentage}%
                      </span>
                      <span className="block text-xs text-purple-700 font-bold mt-1">
                        عمولة {aff.commissionPercentage}%
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold">{aff.clicksCount}</td>
                    <td className="p-4 text-center font-bold text-emerald-600">{aff.conversionsCount}</td>
                    <td className="p-4 text-center font-bold text-slate-800">{aff.totalSalesVolume.toLocaleString()} ر.س</td>
                    <td className="p-4 text-center font-black text-purple-600">{aff.totalCommissionEarned.toLocaleString()} ر.س</td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleCopyLink(aff.refLink, aff.id)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        {copiedId === aff.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="text-emerald-600">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الرابط</span>
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal for Creating New Affiliate */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-black text-slate-800 text-lg">إضافة كود إحالة ورابط تسويقي جديد</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateAffiliate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المسوق / الجهة الإعلانية</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: شبكة تسويق الرياض أو المؤثرة مريم"
                  value={promoterName}
                  onChange={(e) => setPromoterName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">فئة المسوق</label>
                  <select
                    value={promoterType}
                    onChange={(e) => setPromoterType(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  >
                    <option value="influencer">مؤثر / صانع محتوى</option>
                    <option value="agency">وكالة تسويق</option>
                    <option value="partner">شريك / مزود قاعة</option>
                    <option value="employee">مسوق داخلي</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الرمز (Code)</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: VIP2026"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-amber-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">خصم العميل (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">عمولة المسوق (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={commissionPercentage}
                    onChange={(e) => setCommissionPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-black transition-colors cursor-pointer shadow-lg shadow-amber-500/20"
                >
                  {isSubmitting ? 'جاري الإنشاء...' : 'حفظ الكود وإنشاء الرابط'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
