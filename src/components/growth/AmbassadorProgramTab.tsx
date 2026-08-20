import React, { useState } from 'react';
import { 
  Crown, Share2, Copy, Check, Gift, Sparkles, 
  TrendingUp, Users, DollarSign, Wallet, ArrowUpRight, 
  Award, ShieldCheck, CheckCircle2, MessageCircle, Sliders, ChevronRight
} from 'lucide-react';

interface AmbassadorProgramTabProps {
  currentUser?: any;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function AmbassadorProgramTab({
  currentUser,
  showNotification
}: AmbassadorProgramTabProps) {
  const [copiedLink, setCopiedLink] = useState(false);
  const [kFactor, setKFactor] = useState(1.38);
  const [referrerReward, setReferrerReward] = useState(250);
  const [friendDiscountPct, setFriendDiscountPct] = useState(5);
  const [minBookingAmount, setMinBookingAmount] = useState(5000);
  const [showAdminGuardrails, setShowAdminGuardrails] = useState(false);

  const ambassadorCode = 'LAYLAH-VIP-77';
  const referralLink = `https://laylah.app/register?ref=${ambassadorCode}`;

  // Leaderboard data
  const ambassadorsLeaderboard = [
    {
      rank: 1,
      name: 'عبدالعزيز السبيعي',
      badge: '👑 سفير ماسي (Diamond)',
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      totalInvited: 42,
      completedBookings: 31,
      totalEarned: 7750,
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'
    },
    {
      rank: 2,
      name: 'نورة بنت مساعد آل سعود',
      badge: '🥇 سفير ذهبي (Gold)',
      badgeColor: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      totalInvited: 36,
      completedBookings: 24,
      totalEarned: 6000,
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&auto=format&fit=crop&q=80'
    },
    {
      rank: 3,
      name: 'م. طارق العمري',
      badge: '🥈 سفير فضي (Silver)',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      totalInvited: 25,
      completedBookings: 18,
      totalEarned: 4500,
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&auto=format&fit=crop&q=80'
    },
    {
      rank: 4,
      name: 'هيفاء القحطاني',
      badge: '🥈 سفير فضي (Silver)',
      badgeColor: 'bg-slate-100 text-slate-800 border-slate-300',
      totalInvited: 19,
      completedBookings: 14,
      totalEarned: 3500,
      avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=100&auto=format&fit=crop&q=80'
    }
  ];

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopiedLink(true);
    if (showNotification) {
      showNotification('success', '📋 تم نسخ رابط الدعوة الخاص بالسفير بنجاح!');
    }
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(`أهلاً بك! استخدم كود خصم سفراء ليلة (${ambassadorCode}) للحصول على خصم فوري 5% على حجز قاعتك أو مناسبتك عبر منصة ليلة:\n${referralLink}`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  const handleSaveGuardrails = () => {
    setShowAdminGuardrails(false);
    if (showNotification) {
      showNotification('success', '⚡ تم تحديث اشتراطات ومكافآت برنامج السفراء الإدارية بنجاح!');
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 p-6 sm:p-8 rounded-3xl border border-amber-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-black mb-2 border border-amber-400/30">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>محرك التسويق الشفهي التشاركي ومضاعف الانتشار (K-Factor)</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              برنامج سفراء ليلة والمكافآت التشاركية (Laylah Ambassadors) 👑
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              تحويل العملاء والشركاء الراضين إلى سفراء ناشطين عبر نموذج الحوافز المزدوج (Pay-for-Performance)، ومكافآت نقدية مباشرة في المحفظة عند كل حجز ناجح.
            </p>
          </div>
          <button
            onClick={() => setShowAdminGuardrails(true)}
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-bold rounded-2xl text-xs sm:text-sm border border-white/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-amber-400" />
            <span>ضبط اشتراطات المكافآت (الإدارة)</span>
          </button>
        </div>
      </div>

      {/* Top 4 Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: K-Factor */}
        <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 p-5 rounded-3xl border border-amber-500/30 shadow-sm">
          <div className="flex items-center justify-between text-amber-800 text-xs font-bold mb-2">
            <span>مؤشر الانتشار الفيروسي (K-Factor)</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-950 font-mono">
            {kFactor}x <span className="text-xs font-bold text-emerald-600">(حلقة نمو ذاتي فائقة)</span>
          </div>
          <p className="text-[10px] text-slate-500 mt-2 font-medium">كل 100 عميل يجلبون 138 عميل جديد مجاناً</p>
        </div>

        {/* Card 2: Active Ambassadors */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>إجمالي السفراء المعتمدين</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-slate-800 font-mono">
            184 <span className="text-xs text-slate-500 font-bold">سفير نشط</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">+24 سفير جديد هذا الشهر</p>
        </div>

        {/* Card 3: Completed Bookings */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>حجوزات تمت عبر السفراء</span>
            <Users className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 font-mono">
            492 <span className="text-xs text-slate-500 font-bold">حجز مؤكد</span>
          </div>
          <p className="text-[10px] text-emerald-600 mt-2 font-medium">بقيمة مبيعات 7.4 مليون ر.س</p>
        </div>

        {/* Card 4: Total Cashback Distributed */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold mb-2">
            <span>المكافآت الموزعة بالمحافظ</span>
            <Wallet className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-indigo-900 font-mono">
            123,000 <span className="text-xs text-slate-500 font-bold">ر.س</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-2 font-medium">كاشباك مباشر مستحق للصرف</p>
        </div>
      </div>

      {/* Dual Incentive Model Box & Sharing Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Dual Incentive Visual Model */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-black text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
            <Gift className="w-4 h-4 text-amber-500" />
            <span>نموذج المكافآت التشاركية المزدوج (Dual-Sided Incentive)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Side 1: Referrer */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-200/80 text-amber-900 flex items-center justify-center font-black text-xs">
                  1
                </div>
                <span className="font-black text-xs text-amber-950">مكافأة السفير (الداعي):</span>
              </div>
              <div className="text-xl font-black text-amber-900 font-mono">
                {referrerReward} ر.س <span className="text-xs font-bold">كاشباك فوري</span>
              </div>
              <p className="text-[11px] text-amber-800/90 leading-relaxed font-medium">
                تودع تلقائياً في المحفظة الإلكترونية فور إتمام وتأكيد حجز القاعة أو الخدمة من قبل الصديق.
              </p>
            </div>

            {/* Side 2: Friend */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-200/80 text-emerald-900 flex items-center justify-center font-black text-xs">
                  2
                </div>
                <span className="font-black text-xs text-emerald-950">خصم الصديق (المدعو):</span>
              </div>
              <div className="text-xl font-black text-emerald-900 font-mono">
                خصم {friendDiscountPct}% <span className="text-xs font-bold">مباشر</span>
              </div>
              <p className="text-[11px] text-emerald-800/90 leading-relaxed font-medium">
                يُطبق تلقائياً على فاتورة الحجز الإلكتروني عند إدخال كود الإحالة أو الشراء عبر الرابط المباشر.
              </p>
            </div>
          </div>

          {/* Quick Sharing Tool */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700">رابط الدعوة الخاص بالسفير:</span>
              <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                كود: {ambassadorCode}
              </span>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={referralLink}
                className="flex-1 p-2.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-700 outline-none dir-ltr text-left"
              />
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'تم النسخ' : 'نسخ'}</span>
              </button>
            </div>

            <button
              onClick={handleWhatsAppShare}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              <MessageCircle className="w-4 h-4" />
              <span>مشاركة سريعة عبر الواتساب بنقرة واحدة</span>
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="lg:col-span-6 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm">لوحة شرف السفراء والمتصدرين (Leaderboard)</h3>
                <p className="text-xs text-slate-500">ترتيب السفراء الأكثر تأثيراً وإحالة للحجوزات</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {ambassadorsLeaderboard.map((amb) => (
              <div
                key={amb.rank}
                className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/70 hover:bg-slate-100/80 transition-all flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-mono font-black text-xs shrink-0">
                    {amb.rank}
                  </div>
                  <img
                    src={amb.avatar}
                    alt={amb.name}
                    className="w-10 h-10 rounded-xl object-cover border border-slate-200"
                  />
                  <div>
                    <h4 className="font-black text-xs text-slate-900">{amb.name}</h4>
                    <span className={`inline-block text-[10px] font-black px-2 py-0.5 rounded-md border mt-0.5 ${amb.badgeColor}`}>
                      {amb.badge}
                    </span>
                  </div>
                </div>

                <div className="text-left">
                  <p className="text-xs font-black text-emerald-700 font-mono">
                    +{amb.totalEarned.toLocaleString()} ر.س
                  </p>
                  <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                    {amb.completedBookings} حجز مكتمل
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Admin Guardrails Modal */}
      {showAdminGuardrails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-right font-sans" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
                <span>الاشتراطات والضوابط المحاسبية لبرنامج السفراء</span>
              </h3>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">مكافأة السفير الداعي (ر.س في المحفظة):</label>
                <input
                  type="number"
                  value={referrerReward}
                  onChange={e => setReferrerReward(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نسبة خصم الصديق الجديد (%):</label>
                <input
                  type="number"
                  value={friendDiscountPct}
                  onChange={e => setFriendDiscountPct(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">الحد الأدنى لقيمة الحجز لاستحقاق المكافأة (ر.س):</label>
                <input
                  type="number"
                  value={minBookingAmount}
                  onChange={e => setMinBookingAmount(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 font-bold font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAdminGuardrails(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSaveGuardrails}
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md"
              >
                حفظ التعديلات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
