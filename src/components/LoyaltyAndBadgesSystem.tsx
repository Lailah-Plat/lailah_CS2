import React, { useState } from 'react';
import { 
  Gift, Award, ShieldCheck, Sparkles, Star, Zap, CheckCircle2, 
  Crown, ArrowLeft, RefreshCw, Ticket, Percent, Coins 
} from 'lucide-react';

interface LoyaltyAndBadgesSystemProps {
  userRole?: string;
  customerId?: string;
  providerId?: string;
  providerName?: string;
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export function LoyaltyAndBadgesSystem({
  userRole = 'customer',
  customerId = 'CUST-101',
  providerId = 'PROV-202',
  providerName = 'القاعة الملكية للمناسبات',
  showNotification
}: LoyaltyAndBadgesSystemProps) {
  const [activeTab, setActiveTab] = useState<'loyalty_points' | 'provider_badges'>('loyalty_points');
  
  // Loyalty Points State
  const [pointsBalance, setPointsBalance] = useState(480);
  const [redeemedCoupons, setRedeemedCoupons] = useState<any[]>([
    { id: 'COUP-26-001', code: 'LAYLAH-GOLD10', discountSAR: 50, pointsUsed: 500, expiryDate: '2026-12-31', isUsed: false }
  ]);

  // Provider Badges State
  const [providerBadges, setProviderBadges] = useState([
    { id: 'top_seller', title: 'المنشأة الأكثر مبيعاً 🏆', subtitle: 'أعلى نسبة حجز مؤكدة في الرياض', isActive: true, category: 'sales' },
    { id: 'vip_partner', title: 'شريك مميز VIP ⭐', subtitle: 'باقة VIP مع ضمان الاستجابة الفائقة', isActive: true, category: 'tier' },
    { id: 'zero_cancellation', title: 'وسام الجودة والالتزام 100% 🛡️', subtitle: 'صفر حالات إلغاء للحجوزات المؤكدة', isActive: true, category: 'quality' },
    { id: 'fast_response', title: 'شعار الاستجابة الفائقة ⚡', subtitle: 'متوسط زمن استجابة الاستفسارات أقل من 12 دقيقة', isActive: true, category: 'speed' }
  ]);

  const handleRedeemPoints = (pointsToRedeem: number, discountValueSAR: number) => {
    if (pointsBalance < pointsToRedeem) {
      showNotification('error', `رصيد نقاطك الحالي (${pointsBalance} نقطة) لا يكفي للاستبدال!`);
      return;
    }
    const newCoupon = {
      id: `COUP-26-${Math.floor(100 + Math.random() * 900)}`,
      code: `LAYLAH-${discountValueSAR}OFF-${Math.floor(1000 + Math.random() * 9000)}`,
      discountSAR: discountValueSAR,
      pointsUsed: pointsToRedeem,
      expiryDate: '2026-12-31',
      isUsed: false
    };
    setPointsBalance(prev => prev - pointsToRedeem);
    setRedeemedCoupons([newCoupon, ...redeemedCoupons]);
    showNotification('success', `🎉 تم استبدال ${pointsToRedeem} نقطة بنجاح واستخراج كوبون خصم بمبلغ ${discountValueSAR} ريال!`);
  };

  return (
    <div className="space-y-6 font-sans text-right animate-in fade-in duration-300" dir="rtl">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-amber-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-amber-500/20 text-amber-300 text-[10px] font-black px-3 py-1 rounded-full border border-amber-500/30">
              نظام الولاء والمكافآت وشعارات التميز المعتمدة 🎁
            </span>
            <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-black px-3 py-1 rounded-full border border-emerald-500/30">
              محدث بـ 2026 Engine
            </span>
          </div>
          <h2 className="text-2xl font-black text-white">برنامج الولاء وتصنيفات التميز (Laylah Loyalty & Badges)</h2>
          <p className="text-slate-300 text-xs mt-1 max-w-2xl leading-relaxed">
            محرك المكافآت الذكي الذي يمنح العملاء نقاطاً استبدالية عن كل حجز، ويمنح المنشآت الشريكة الأوسمة المعتمدة بناءً على جودة الخدمة والمبيعات.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-slate-700/80 gap-1 shrink-0">
          <button
            onClick={() => setActiveTab('loyalty_points')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'loyalty_points' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>نقاط ولاء العملاء ({pointsBalance} نقطة)</span>
          </button>

          <button
            onClick={() => setActiveTab('provider_badges')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'provider_badges' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-300 hover:text-white'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>شعارات وأوسمة التميز ({providerBadges.length})</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Customer Loyalty Points Engine */}
      {activeTab === 'loyalty_points' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Balance Card */}
          <div className="bg-gradient-to-br from-amber-50 via-orange-50 to-amber-100/50 p-6 rounded-3xl border border-amber-200 shadow-xs space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-black text-amber-900">رصيد النقاط الحالي</span>
              <span className="bg-amber-200/80 text-amber-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full border border-amber-300">
                المستوى الذهبي 🥇
              </span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-slate-900 font-mono">{pointsBalance}</span>
              <span className="text-xs font-bold text-slate-600">نقطة ولاء</span>
            </div>

            <div className="text-xs text-amber-900 font-bold bg-amber-100/60 p-3 rounded-2xl border border-amber-200">
              💡 تعادل خصماً بقيمة <strong>{Math.floor(pointsBalance / 10)} ريال</strong> في حجزك القادم!
            </div>

            <div className="space-y-2 pt-2 border-t border-amber-200/60 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>معدل الاكتساب:</span>
                <span className="font-bold">1 نقطة لكل 10 ر.س</span>
              </div>
              <div className="flex justify-between">
                <span>المستوى القادم (الماسي 💎):</span>
                <span className="font-bold">متبقي 20 نقطة</span>
              </div>
            </div>
          </div>

          {/* Redemption Coupons Panel */}
          <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-5">
            <h3 className="font-black text-slate-800 text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-amber-500" />
              <span>خيارات استبدال النقاط لكوبونات خصم مباشرة</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Option 1 */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 transition-all bg-slate-50/50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-slate-800 block">خصم 25 ريال</span>
                  <span className="text-[10px] text-slate-500 block">مقابل استبدال 250 نقطة ولاء</span>
                </div>
                <button
                  onClick={() => handleRedeemPoints(250, 25)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                >
                  استبدال 🎯
                </button>
              </div>

              {/* Option 2 */}
              <div className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 transition-all bg-slate-50/50 flex justify-between items-center">
                <div>
                  <span className="text-xs font-black text-slate-800 block">خصم 50 ريال</span>
                  <span className="text-[10px] text-slate-500 block">مقابل استبدال 500 نقطة ولاء</span>
                </div>
                <button
                  onClick={() => handleRedeemPoints(500, 50)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-2xs"
                >
                  استبدال 🎯
                </button>
              </div>

            </div>

            {/* Redeemed Coupons Table */}
            <div className="pt-4 border-t border-slate-100">
              <h4 className="font-bold text-xs text-slate-700 mb-3">الكوبونات المستبدلة النشطة:</h4>
              <div className="space-y-2">
                {redeemedCoupons.map(coupon => (
                  <div key={coupon.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-emerald-600" />
                      <div>
                        <span className="font-mono font-black text-slate-800 block">{coupon.code}</span>
                        <span className="text-[10px] text-slate-500">خصمبقيمة {coupon.discountSAR} ر.س | ينتهي {coupon.expiryDate}</span>
                      </div>
                    </div>
                    <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
                      جاهز للاستخدام ✅
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Provider Distinction Badges & Quality Seals */}
      {activeTab === 'provider_badges' && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-6">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-black text-slate-800 text-base">أوسمة وشعارات تميز المنشأة ({providerName})</h3>
              <p className="text-slate-500 text-xs mt-0.5">تظهر هذه الأوسمة المعتمدة تلقائياً في نتائج البحث وبطاقات الحجز للعملاء لزيادة الثقة والمبيعات.</p>
            </div>
            <span className="bg-indigo-100 text-indigo-800 text-xs font-black px-3 py-1 rounded-full border border-indigo-200">
              4 أوسمة نشطة ✨
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {providerBadges.map(badge => (
              <div key={badge.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 transition-all flex items-start gap-4 shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-xl shrink-0">
                  {badge.title.slice(-2)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-slate-800 text-sm">{badge.title}</h4>
                    <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black px-2 py-0.5 rounded border border-emerald-200">
                      معتمد رسمياً
                    </span>
                  </div>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{badge.subtitle}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
