import React, { useState } from 'react';
import { 
  Users, CheckCircle2, Star, Send, Search, Filter, 
  MapPin, Plus, DollarSign, Eye, ShieldCheck, X, 
  Calendar, Camera, Sparkles, Instagram, TrendingUp, Tag 
} from 'lucide-react';

interface InfluencerNetworkTabProps {
  halls?: any[];
  services?: any[];
  providers?: any[];
  currentUser?: any;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export function InfluencerNetworkTab({
  halls = [],
  services = [],
  providers = [],
  currentUser,
  showNotification
}: InfluencerNetworkTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCity, setSelectedCity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddCreatorModal, setShowAddCreatorModal] = useState(false);
  const [selectedCreatorForInvite, setSelectedCreatorForInvite] = useState<any>(null);

  // Invite Form State
  const [inviteHallOrService, setInviteHallOrService] = useState('');
  const [inviteDate, setInviteDate] = useState('2026-09-01');
  const [inviteBudget, setInviteBudget] = useState(3500);
  const [inviteFocusPoints, setInviteFocusPoints] = useState('تغطية سناب شات وإنستغرام ريلز للمدخل الرئيسي وبوفيه الضيافة الفاخر');

  // New Creator Form State
  const [newCreatorName, setNewCreatorName] = useState('');
  const [newCreatorHandle, setNewCreatorHandle] = useState('@');
  const [newCreatorCity, setNewCreatorCity] = useState('الرياض');
  const [newCreatorFollowers, setNewCreatorFollowers] = useState('250K');
  const [newCreatorEngagement, setNewCreatorEngagement] = useState('4.8%');
  const [newCreatorPromoCode, setNewCreatorPromoCode] = useState('CREATOR2026');
  const [newCreatorDiscountPct, setNewCreatorDiscountPct] = useState(10);
  const [newCreatorCommissionPct, setNewCreatorCommissionPct] = useState(5);
  const [newCreatorCoverageFee, setNewCreatorCoverageFee] = useState(3000);
  const [newCreatorSpecialty, setNewCreatorSpecialty] = useState('تغطيات أعراس وقاعات فاخرة');

  // Creators Data
  const [creators, setCreators] = useState([
    {
      id: 'CR-01',
      name: 'سارة العبدالله (تغطيات نجد)',
      handle: '@sarah_weddings',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      city: 'الرياض',
      platform: 'Snapchat & Instagram',
      followers: '450K',
      engagementRate: '5.2%',
      promoCode: 'SARAH26',
      discountPct: 10,
      commissionPct: 5,
      coverageFee: 4000,
      specialty: 'تغطيات أعراس وفنادق فاخرة',
      attributedBookings: 34,
      totalRevenue: 680000,
      verified: true,
      rating: 4.9
    },
    {
      id: 'CR-02',
      name: 'فيصل الغامدي (عين الحفل)',
      handle: '@faisal_events',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      city: 'جدة',
      platform: 'TikTok & Instagram',
      followers: '320K',
      engagementRate: '6.8%',
      promoCode: 'FAISAL26',
      discountPct: 10,
      commissionPct: 4,
      coverageFee: 3500,
      specialty: 'فيديوهات ريلز وسيناريوهات تفاعلية',
      attributedBookings: 28,
      totalRevenue: 490000,
      verified: true,
      rating: 4.8
    },
    {
      id: 'CR-03',
      name: 'نوف الشمري (عرايس الشرقية)',
      handle: '@nouf_bridal',
      avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      city: 'الدمام والخبر',
      platform: 'Snapchat',
      followers: '190K',
      engagementRate: '4.9%',
      promoCode: 'NOUF26',
      discountPct: 8,
      commissionPct: 5,
      coverageFee: 2800,
      specialty: 'كوشات وتفاصيل فساتين وضيافة',
      attributedBookings: 19,
      totalRevenue: 340000,
      verified: true,
      rating: 4.9
    },
    {
      id: 'CR-04',
      name: 'خالد المطيري (عدسة المناسبات)',
      handle: '@khaled_lens',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      city: 'الرياض',
      platform: 'TikTok & Snapchat',
      followers: '510K',
      engagementRate: '5.9%',
      promoCode: 'KHALED26',
      discountPct: 10,
      commissionPct: 6,
      coverageFee: 4500,
      specialty: 'توثيق سينمائي بالطائرات الدرون',
      attributedBookings: 42,
      totalRevenue: 820000,
      verified: true,
      rating: 5.0
    }
  ]);

  const filteredCreators = creators.filter(c => {
    const matchSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.handle.toLowerCase().includes(searchTerm.toLowerCase()) || 
                        c.promoCode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCity = selectedCity === 'all' || c.city.includes(selectedCity);
    const matchCat = selectedCategory === 'all' || c.specialty.includes(selectedCategory);
    return matchSearch && matchCity && matchCat;
  });

  const totalBookings = creators.reduce((s, c) => s + c.attributedBookings, 0);
  const totalRevenue = creators.reduce((s, c) => s + c.totalRevenue, 0);

  const handleOpenInvite = (creator: any) => {
    setSelectedCreatorForInvite(creator);
    setShowInviteModal(true);
  };

  const handleSendInvite = () => {
    if (!inviteHallOrService) {
      if (showNotification) showNotification('warning', 'يرجى تحديد القاعة أو الفعالية المستهدفة بالتغطية.');
      return;
    }
    setShowInviteModal(false);
    if (showNotification) {
      showNotification('success', `📩 تم إرسال دعوة التغطية الرسمية إلى (${selectedCreatorForInvite?.name}) بنجاح.`);
    }
  };

  const handleAddCreator = () => {
    if (!newCreatorName || !newCreatorPromoCode) {
      if (showNotification) showNotification('warning', 'يرجى إدخال اسم المؤثر وكود الخصم المخصص.');
      return;
    }

    const newCreator = {
      id: `CR-0${creators.length + 1}`,
      name: newCreatorName,
      handle: newCreatorHandle.startsWith('@') ? newCreatorHandle : `@${newCreatorHandle}`,
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
      city: newCreatorCity,
      platform: 'Snapchat & Instagram',
      followers: newCreatorFollowers,
      engagementRate: newCreatorEngagement,
      promoCode: newCreatorPromoCode.toUpperCase(),
      discountPct: Number(newCreatorDiscountPct) || 10,
      commissionPct: Number(newCreatorCommissionPct) || 5,
      coverageFee: Number(newCreatorCoverageFee) || 3000,
      specialty: newCreatorSpecialty,
      attributedBookings: 0,
      totalRevenue: 0,
      verified: true,
      rating: 5.0
    };

    setCreators([newCreator, ...creators]);
    setShowAddCreatorModal(false);
    if (showNotification) {
      showNotification('success', `✨ تم اعتماد وتسجيل صانع المحتوى (${newCreatorName}) وتوليد كود الخصم (${newCreator.promoCode}) بنجاح!`);
    }
  };

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 p-6 sm:p-8 rounded-3xl border border-purple-500/30 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 text-xs font-black mb-2 border border-purple-400/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>شبكة المؤثرين وصناع المحتوى المعتمدين والموثقين</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              شبكة المؤثرين وتغطيات المناسبات (Creators Network) 📸
            </h2>
            <p className="text-slate-300 text-xs md:text-sm mt-1 max-w-2xl leading-relaxed">
              إدارة احترافية للشراكات مع نخبة مشاهير ومصوري الأعراس في المملكة، مع تتبع رقمي كامل للحجوزات والمبيعات الناتجة عن كل تغطية عبر أكواد الخصم وروابط الإحالة المباشرة.
            </p>
          </div>
          <button
            onClick={() => setShowAddCreatorModal(true)}
            className="px-5 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-2xl text-xs sm:text-sm shadow-lg shadow-amber-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة صانع محتوى / مؤثر جديد</span>
          </button>
        </div>
      </div>

      {/* Top 3 KPI Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0 border border-purple-100">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">صناع المحتوى النشطين بالشبكة</p>
            <p className="text-2xl font-black text-slate-800 font-mono mt-0.5">{creators.length} مؤثر معتمد</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">إجمالي الحجوزات المحققة من المؤثرين</p>
            <p className="text-2xl font-black text-emerald-700 font-mono mt-0.5">{totalBookings} حجز مؤكد</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-bold">إجمالي المبيعات الناتجة (Attributed Revenue)</p>
            <p className="text-2xl font-black text-amber-700 font-mono mt-0.5">{totalRevenue.toLocaleString()} ر.س</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
          <input
            type="text"
            placeholder="بحث بالاسم، الحساب، أو كود الخصم..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pr-9 pl-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <select
            value={selectedCity}
            onChange={e => setSelectedCity(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">📍 جميع المدن</option>
            <option value="الرياض">الرياض</option>
            <option value="جدة">جدة</option>
            <option value="الدمام">الدمام والخبر</option>
          </select>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 outline-none"
          >
            <option value="all">🏷️ كافة التخصصات</option>
            <option value="قاعات">تغطيات قاعات وفنادق</option>
            <option value="كوشات">كوشات وضيافة</option>
            <option value="سينمائي">توثيق سينمائي</option>
          </select>
        </div>
      </div>

      {/* Creator Profile Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredCreators.map(creator => (
          <div 
            key={creator.id} 
            className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm hover:border-purple-300 transition-all space-y-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <img
                    src={creator.avatar}
                    alt={creator.name}
                    className="w-14 h-14 rounded-2xl object-cover border-2 border-purple-200 shadow-sm"
                  />
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-black text-slate-900 text-sm">{creator.name}</h4>
                      {creator.verified && (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100" />
                      )}
                    </div>
                    <p className="text-xs font-mono text-purple-700 font-bold">{creator.handle}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                      <span className="flex items-center gap-0.5"><MapPin className="w-3 h-3 text-slate-400" /> {creator.city}</span>
                      <span>•</span>
                      <span className="text-slate-600 font-medium">{creator.specialty}</span>
                    </div>
                  </div>
                </div>

                <div className="text-left bg-slate-50 p-2 rounded-xl border border-slate-100">
                  <p className="text-[10px] text-slate-400 font-bold">المتابعين</p>
                  <p className="text-xs font-black text-slate-800 font-mono">{creator.followers}</p>
                  <p className="text-[10px] text-emerald-600 font-bold mt-0.5">تفاعل: {creator.engagementRate}</p>
                </div>
              </div>

              {/* Financial & Promo Code Details */}
              <div className="grid grid-cols-3 gap-2 mt-4 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">كود الخصم:</span>
                  <span className="font-mono font-black text-purple-900 bg-purple-100/70 px-2 py-0.5 rounded-lg inline-block mt-0.5">
                    {creator.promoCode} (-{creator.discountPct}%)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">أتعاب التغطية:</span>
                  <span className="font-mono font-bold text-slate-800 inline-block mt-0.5">
                    {creator.coverageFee.toLocaleString()} ر.س
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-bold">عمولة المؤثر:</span>
                  <span className="font-mono font-black text-amber-700 inline-block mt-0.5">
                    {creator.commissionPct}% من الحجز
                  </span>
                </div>
              </div>

              {/* Performance record */}
              <div className="flex items-center justify-between text-xs pt-3 mt-2 border-t border-slate-100 text-slate-600">
                <span>الحجوزات المحققة: <strong className="text-slate-900 font-mono">{creator.attributedBookings}</strong> حجز</span>
                <span>المبيعات: <strong className="text-emerald-700 font-mono font-bold">{creator.totalRevenue.toLocaleString()} ر.س</strong></span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleOpenInvite(creator)}
                className="flex-1 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>إرسال دعوة تغطية ميدانية</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-right font-sans" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-purple-600" />
                  <span>دعوة تغطية ميدانية للمؤثر ({selectedCreatorForInvite?.name})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{selectedCreatorForInvite?.handle} • أتعاب التغطية القياسية: {selectedCreatorForInvite?.coverageFee} ر.س</p>
              </div>
              <button onClick={() => setShowInviteModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">القاعة أو الفعالية المراد تغطيتها:</label>
                <select
                  value={inviteHallOrService}
                  onChange={e => setInviteHallOrService(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold outline-none focus:border-purple-500"
                >
                  <option value="">اختر القاعة أو الفعالية...</option>
                  {halls.map((h: any) => (
                    <option key={h.id || h.name} value={h.name || h.title}>{h.name || h.title} - {h.city || 'الرياض'}</option>
                  ))}
                  <option value="قصر الفخامة الكبرى للمناسبات">قصر الفخامة الكبرى للمناسبات</option>
                  <option value="قاعة ليلة الشرق الفاخرة">قاعة ليلة الشرق الفاخرة</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">تاريخ المعاينة والتصوير:</label>
                  <input
                    type="date"
                    value={inviteDate}
                    onChange={e => setInviteDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الميزانية المرصودة (ر.س):</label>
                  <input
                    type="number"
                    value={inviteBudget}
                    onChange={e => setInviteBudget(Number(e.target.value))}
                    className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-bold font-mono outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">تفاصيل ونقاط التركيز المطلوبة:</label>
                <textarea
                  rows={3}
                  value={inviteFocusPoints}
                  onChange={e => setInviteFocusPoints(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl bg-slate-50 text-xs font-medium outline-none leading-relaxed"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowInviteModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleSendInvite}
                className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 text-white font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Send className="w-4 h-4" />
                <span>إرسال الدعوة للمؤثر</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Creator Modal */}
      {showAddCreatorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-right font-sans" dir="rtl">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-600" />
                <span>إضافة صانع محتوى جديد لشبكة ليلة</span>
              </h3>
              <button onClick={() => setShowAddCreatorModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم المؤثر الكامل:</label>
                <input
                  type="text"
                  placeholder="مثال: ريم العتيبي"
                  value={newCreatorName}
                  onChange={e => setNewCreatorName(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">اسم الحساب (Handle):</label>
                <input
                  type="text"
                  placeholder="@reem_events"
                  value={newCreatorHandle}
                  onChange={e => setNewCreatorHandle(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-mono font-bold outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">المدينة:</label>
                <select
                  value={newCreatorCity}
                  onChange={e => setNewCreatorCity(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold outline-none"
                >
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام والخبر">الدمام والخبر</option>
                  <option value="مكة المكرمة">مكة المكرمة</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عدد المتابعين التقديري:</label>
                <input
                  type="text"
                  placeholder="مثال: 300K"
                  value={newCreatorFollowers}
                  onChange={e => setNewCreatorFollowers(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold outline-none font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">كود الخصم المخصص:</label>
                <input
                  type="text"
                  placeholder="REEM26"
                  value={newCreatorPromoCode}
                  onChange={e => setNewCreatorPromoCode(e.target.value.toUpperCase())}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-mono font-black text-purple-900 outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">نسبة خصم العميل (%):</label>
                <input
                  type="number"
                  value={newCreatorDiscountPct}
                  onChange={e => setNewCreatorDiscountPct(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold font-mono outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">عمولة المؤثر من الحجز (%):</label>
                <input
                  type="number"
                  value={newCreatorCommissionPct}
                  onChange={e => setNewCreatorCommissionPct(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold font-mono outline-none text-amber-700"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">أتعاب التغطية الميدانية (ر.س):</label>
                <input
                  type="number"
                  value={newCreatorCoverageFee}
                  onChange={e => setNewCreatorCoverageFee(Number(e.target.value))}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 text-xs font-bold font-mono outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowAddCreatorModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddCreator}
                className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-slate-950 font-black rounded-xl text-xs cursor-pointer shadow-md flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>حفظ وتفعيل المؤثر بالشبكة</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
