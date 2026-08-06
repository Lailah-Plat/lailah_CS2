import React, { useState } from 'react';
import { Plus, Search, Eye, MousePointerClick, DollarSign, ExternalLink, Calendar, Filter, Megaphone, Trash2, ChevronDown, Edit } from 'lucide-react';

export interface AdInfo {
  id: number;
  advertiser: string;
  title: string;
  content: string;
  imageUrl: string;
  placement: string;
  startDate: string;
  endDate: string;
  value: number;
  views: number;
  clicks: number;
  status: 'فعّال' | 'منتهي' | 'قيد المعالجة' | 'بالانتظار';
  linkUrl?: string;
}

const mockAds: AdInfo[] = [
  {
    id: 1,
    advertiser: "مؤسسة روز للزهور",
    title: "خصم 20% على تنسيق القاعات",
    content: "احجز الآن واحصل على خصم 20% على باقات التنسيق الفاخرة للعروس.",
    imageUrl: "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&q=80",
    placement: "الإعلان العلوي الأول - الأيمن",
    startDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 10)).toISOString().split('T')[0],
    value: 5000,
    views: 12500,
    clicks: 450,
    status: 'فعّال',
    linkUrl: '#'
  },
  {
    id: 2,
    advertiser: "استوديو لحظات",
    title: "باقة التصوير السينمائي",
    content: "وثق أجمل لحظاتك مع باقات التصوير السينمائي بأحدث التقنيات.",
    imageUrl: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=800&q=80",
    placement: "الإعلان العلوي الثاني - الأوسط",
    startDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0],
    value: 3000,
    views: 11000,
    clicks: 300,
    status: 'فعّال',
    linkUrl: '#'
  },
  {
    id: 3,
    advertiser: "قصر الضيافة",
    title: "بوفيه مفتوح",
    content: "استمتع بأشهى الأطباق مع بوفيه مفتوح.",
    imageUrl: "https://images.unsplash.com/photo-1533174000273-e31b72aef8b6?w=800&q=80",
    placement: "الإعلان العلوي الثالث - الأيسر",
    startDate: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 20)).toISOString().split('T')[0],
    value: 4000,
    views: 15000,
    clicks: 500,
    status: 'فعّال',
    linkUrl: '#'
  },
  {
    id: 4,
    advertiser: "مؤسسة ليلة لخدمات للمناسبات",
    title: "باقة النخبة لتنظيم الأعراس",
    content: "دعنا نصنع لك ليلة العمر مع تنظيم متكامل واستثنائي لكل التفاصيل.",
    imageUrl: "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=800&q=80",
    placement: "البانر الرئيسي (الصفحة الرئيسية)",
    startDate: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString().split('T')[0],
    endDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0],
    value: 8000,
    views: 5200,
    clicks: 180,
    status: 'فعّال',
    linkUrl: '#'
  }
];

export function AdsManagement() {
  const [ads, setAds] = useState<AdInfo[]>(() => {
    try {
      const stored = localStorage.getItem('GLOBAL_ADS');
      if (stored) return JSON.parse(stored);
    } catch {}
    return mockAds;
  });

  const updateAds = (newAds: AdInfo[]) => {
    setAds(newAds);
    localStorage.setItem('GLOBAL_ADS', JSON.stringify(newAds));
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditingId, setIsEditingId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPlacement, setFilterPlacement] = useState('');
  
  const [formData, setFormData] = useState<Partial<AdInfo>>({
    status: 'قيد المعالجة',
    placement: 'الإعلان العلوي الأول - الأيمن',
    value: 0
  });

  const [previewAd, setPreviewAd] = useState<Partial<AdInfo> | null>(null);
  const [viewingAd, setViewingAd] = useState<AdInfo | null>(null);
  const [isMobilePreviewOpen, setIsMobilePreviewOpen] = useState(false);

  const placements = [
    'شريط الإعلان العلوي',
    'الإعلان العلوي الأول - الأيمن',
    'الإعلان العلوي الثاني - الأوسط',
    'الإعلان العلوي الثالث - الأيسر',
    'الإعلان السفلي الأول - الأيمن',
    'الإعلان السفلي الثاني - الأوسط',
    'الإعلان السفلي الثالث - الأيسر',
    'البانر الرئيسي (الصفحة الرئيسية)',
    'شريط الصفحة الرئيسية (قسم جديد)',
    'نتائج البحث (صفحة استكشاف)',
    'توصيات القاعات (داخل تفاصيل قاعة)',
    'نافذة منبثقة (عامة)'
  ];


  const handleEditClick = (ad: AdInfo) => {
    setFormData(ad);
    setPreviewAd(ad);
    setIsEditingId(ad.id);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newAdData = {
      advertiser: formData.advertiser || '',
      title: formData.title || '',
      content: formData.content || '',
      imageUrl: formData.imageUrl || '',
      linkUrl: formData.linkUrl || '#',
      placement: formData.placement || 'البانر الرئيسي',
      startDate: formData.startDate || '',
      endDate: formData.endDate || '',
      value: Number(formData.value) || 0,
      status: formData.status as AdInfo['status'] || 'قيد المعالجة',
    };

    if (isEditingId) {
       updateAds(ads.map(ad => ad.id === isEditingId ? { ...ad, ...newAdData } : ad));
    } else {
       const newAd: AdInfo = {
         ...newAdData,
         id: Date.now(),
         views: 0,
         clicks: 0
       };
       updateAds([newAd, ...ads]);
       
       window.dispatchEvent(new CustomEvent('add_finance_revenue', { 
         detail: { 
           title: 'عائد إعلان: ' + newAd.title, 
           type: 'أخرى', 
           total: newAd.value 
         } 
       }));
    }
    
    setIsModalOpen(false);
    setIsEditingId(null);
    setFormData({ status: 'قيد المعالجة', placement: 'البانر الرئيسي', value: 0 });
    setPreviewAd(null);
  };

  const filteredAds = ads.filter(ad => {
    const matchesSearch = ad.title.includes(searchQuery) || ad.advertiser.includes(searchQuery);
    const matchesStatus = filterStatus ? ad.status === filterStatus : true;
    const matchesPlacement = filterPlacement ? ad.placement === filterPlacement : true;
    return matchesSearch && matchesStatus && matchesPlacement;
  });

  const totalRevenue = ads.reduce((sum, ad) => sum + ad.value, 0);
  const activeAdsCount = ads.filter(ad => ad.status === 'فعّال').length;
  const totalViews = ads.reduce((sum, ad) => sum + ad.views, 0);
  const totalClicks = ads.reduce((sum, ad) => sum + ad.clicks, 0);

  return (
    <div className="flex flex-col xl:flex-row gap-6 relative items-start">
      <div className="flex-1 space-y-6 w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">إدارة الإعلانات</h2>
          <p className="text-slate-500 mt-1">متابعة مساحات الإعلان وقياس الأداء وإدارة الإيرادات.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          إضافة إعلان جديد
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-emerald-500 transition-colors">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shrink-0">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي الإيرادات</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalRevenue.toLocaleString()} ريال</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-blue-500 transition-colors">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shrink-0">
            <Megaphone className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">الإعلانات النشطة</p>
            <h3 className="text-2xl font-bold text-slate-800">{activeAdsCount}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-purple-500 transition-colors">
          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي المشاهدات</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalViews.toLocaleString()}</h3>
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4 hover:border-amber-500 transition-colors">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center shrink-0">
            <MousePointerClick className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm text-slate-500 font-medium">إجمالي النقرات</p>
            <h3 className="text-2xl font-bold text-slate-800">{totalClicks.toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-4 shrink-0 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="ابحث بعنوان الإعلان أو اسم الجهة..."
            className="w-full pl-3 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-slate-700 min-w-[150px]"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">جميع الحالات</option>
            <option value="فعّال">فعّال</option>
            <option value="قيد المعالجة">قيد المعالجة</option>
            <option value="بالانتظار">بالانتظار</option>
            <option value="منتهي">منتهي</option>
          </select>
          <select 
            className="px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-white text-slate-700 min-w-[150px]"
            value={filterPlacement}
            onChange={(e) => setFilterPlacement(e.target.value)}
          >
            <option value="">جميع المواقع</option>
            {placements.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      {/* Ads Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="p-4 font-bold">الإعلان</th>
                <th className="p-4 font-bold">الجهة المعلنة</th>
                <th className="p-4 font-bold">الموقع / التاريخ</th>
                <th className="p-4 font-bold">الأداء</th>
                <th className="p-4 font-bold">القيمة</th>
                <th className="p-4 font-bold">الحالة</th>
                <th className="p-4 font-bold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredAds.map(ad => (
                <tr key={ad.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      {ad.imageUrl ? (
                        <img src={ad.imageUrl} alt={ad.title} className="w-16 h-12 object-cover rounded-lg border border-slate-200" />
                      ) : (
                        <div className="w-16 h-12 bg-slate-100 rounded-lg border border-slate-200 flex items-center justify-center">
                           <Megaphone className="w-5 h-5 text-slate-400" />
                        </div>
                      )}
                      <div>
                        <h4 className="font-bold text-slate-800">{ad.title}</h4>
                        <p className="text-xs text-slate-500 truncate max-w-[200px]">{ad.content}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="font-medium text-slate-700">{ad.advertiser}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-bold text-slate-700 mb-1">{ad.placement}</div>
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {ad.startDate} - {ad.endDate}
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      <div className="text-xs text-slate-600 flex items-center justify-between w-20">
                         <span className="flex items-center gap-1"><Eye className="w-3 h-3 text-slate-400" /> مش.:</span>
                         <span className="font-bold">{ad.views}</span>
                      </div>
                      <div className="text-xs text-slate-600 flex items-center justify-between w-20">
                         <span className="flex items-center gap-1"><MousePointerClick className="w-3 h-3 text-slate-400" /> نقر:</span>
                         <span className="font-bold">{ad.clicks}</span>
                      </div>
                    </div>
                  </td>
                  <td className="p-4 font-bold text-amber-600">
                    {ad.value.toLocaleString()} ر.س
                  </td>
                  <td className="p-4">
                    <select
                      value={ad.status}
                      onChange={(e) => updateAds(ads.map(a => a.id === ad.id ? { ...a, status: e.target.value as AdInfo['status'] } : a))}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold outline-none border cursor-pointer appearance-none text-center ${
                        ad.status === 'فعّال' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                        ad.status === 'بالانتظار' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        ad.status === 'قيد المعالجة' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      <option value="فعّال" className="bg-white text-slate-800">فعّال</option>
                      <option value="قيد المعالجة" className="bg-white text-slate-800">قيد المعالجة</option>
                      <option value="بالانتظار" className="bg-white text-slate-800">بالانتظار</option>
                      <option value="منتهي" className="bg-white text-slate-800">منتهي</option>
                    </select>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                       <button 
                         onClick={() => setViewingAd(ad)} 
                         className="p-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                         title="عرض التفاصيل"
                       >
                         <Eye className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => handleEditClick(ad)} 
                         className="p-1.5 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors"
                         title="تعديل الإعلان"
                       >
                         <Edit className="w-4 h-4" />
                       </button>
                       <button 
                         onClick={() => {
                           if (window.confirm('هل أنت متأكد من حذف هذا الإعلان؟')) {
                             updateAds(ads.filter(a => a.id !== ad.id));
                           }
                         }} 
                         className="p-1.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                         title="حذف الإعلان"
                       >
                         <Trash2 className="w-4 h-4" />
                       </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAds.length === 0 && (
                 <tr>
                   <td colSpan={7} className="p-8 text-center text-slate-500">لا يوجد إعلانات مطابقة لخيارات البحث.</td>
                 </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add New Ad Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300 max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{isEditingId ? 'تعديل الإعلان' : 'إضافة إعلان جديد'}</h2>
              <button 
                onClick={() => {
                   setIsModalOpen(false);
                   setIsEditingId(null);
                   setFormData({ status: 'قيد المعالجة', placement: 'البانر الرئيسي (الصفحة الرئيسية)', value: 0 });
                   setPreviewAd(null);
                }}
                className="text-slate-400 hover:text-slate-700 bg-white p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">اسم الجهة المعلنة</label>
                  <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500" 
                    value={formData.advertiser || ''} onChange={e => { setFormData({...formData, advertiser: e.target.value}); setPreviewAd({...formData, advertiser: e.target.value}); }} 
                    placeholder="مثال: مطاعم الرومانسية" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">القيمة المالية (ريال)</label>
                  <input required type="number" min="0" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 bg-emerald-50 text-emerald-900 font-bold" 
                    value={formData.value || ''} onChange={e => { setFormData({...formData, value: Number(e.target.value)}); setPreviewAd({...formData, value: Number(e.target.value)}); }} 
                    placeholder="سيتم إضافتها للإيرادات تلقائياً" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">عنوان الإعلان (داخلي للتمييز)</label>
                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500" 
                  value={formData.title || ''} onChange={e => { setFormData({...formData, title: e.target.value}); setPreviewAd({...formData, title: e.target.value}); }} 
                  placeholder="عنوان الإعلان" />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">النص الظاهر للعملاء</label>
                <textarea rows={3} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 resize-none" 
                  value={formData.content || ''} onChange={e => { setFormData({...formData, content: e.target.value}); setPreviewAd({...formData, content: e.target.value}); }} 
                  placeholder="النص الذي سيظهر في موقع الإعلان..."></textarea>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رابط التوجيه عند النقر (URL)</label>
                <input required type="text" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-left" dir="ltr"
                  value={formData.linkUrl || ''} onChange={e => { setFormData({...formData, linkUrl: e.target.value}); setPreviewAd({...formData, linkUrl: e.target.value}); }} 
                  placeholder="https://..." />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">رابط صورة الإعلان (URL)</label>
                <input required type="url" className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:border-amber-500 text-left" dir="ltr"
                  value={formData.imageUrl || ''} onChange={e => { setFormData({...formData, imageUrl: e.target.value}); setPreviewAd({...formData, imageUrl: e.target.value}); }} 
                  placeholder="https://..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">مكان العرض</label>
                  <select required className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white focus:border-amber-500"
                    value={formData.placement} onChange={e => { setFormData({...formData, placement: e.target.value}); setPreviewAd({...formData, placement: e.target.value}); }} >
                    {placements.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ البدء</label>
                  <input required type="date" className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                    value={formData.startDate || ''} onChange={e => setFormData({...formData, startDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">تاريخ الانتهاء</label>
                  <input required type="date" className="w-full p-2.5 rounded-xl border border-slate-200 outline-none focus:border-amber-500"
                    value={formData.endDate || ''} onChange={e => setFormData({...formData, endDate: e.target.value})} />
                </div>
                <div className="md:col-span-3">
                   <label className="block text-sm font-bold text-slate-700 mb-2">الحالة الحالية</label>
                   <select required className="w-full p-2.5 rounded-xl border border-slate-200 outline-none bg-white focus:border-amber-500"
                    value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as AdInfo['status']})} >
                    <option value="فعّال">فعّال</option>
                    <option value="قيد المعالجة">قيد المعالجة</option>
                    <option value="بالانتظار">بالانتظار</option>
                    <option value="منتهي">منتهي</option>
                  </select>
                </div>
              </div>

            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
              <button 
                type="button" 
                onClick={() => {
                   setIsModalOpen(false);
                   setIsEditingId(null);
                   setFormData({ status: 'قيد المعالجة', placement: 'البانر الرئيسي (الصفحة الرئيسية)', value: 0 });
                   setPreviewAd(null);
                }}
                className="px-6 py-2.5 rounded-xl font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors"
              >
                إلغاء
              </button>
              <button 
                type="button"
                onClick={handleSubmit}
                className="px-6 py-2.5 rounded-xl font-bold bg-amber-500 text-slate-900 shadow-lg shadow-amber-500/30 hover:bg-amber-600 transition-colors"
              >
                {isEditingId ? 'حفظ التعديلات' : 'حفظ وإضافة للإيرادات'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div> {/* End of flex-1 main column */}

      {/* Sticky Mobile Preview Screen */}
      <div className="w-[320px] 2xl:w-[380px] shrink-0 sticky top-4 mb-4 mt-6 xl:mt-0 xl:fixed xl:left-8 xl:top-24 z-[100] hidden xl:flex flex-col items-center">
        <button 
          onClick={() => setIsMobilePreviewOpen(!isMobilePreviewOpen)} 
          className="font-bold text-blue-950 mb-3 flex items-center justify-between w-full bg-white p-4 rounded-2xl shadow-lg border border-slate-100 hover:bg-slate-50 transition-colors"
        >
          <span className="flex items-center gap-2"><Eye className="w-5 h-5"/> معاينة حية (موبايل)</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isMobilePreviewOpen ? 'rotate-180' : ''}`} />
        </button>
        {/* Phone Frame */}
        {isMobilePreviewOpen && (
        <div className="w-full h-[650px] bg-white rounded-[3rem] shadow-2xl border-[8px] border-slate-900 relative overflow-hidden flex flex-col pt-6 font-sans animate-in zoom-in slide-in-from-top-4 duration-300">
          {/* Notch */}
          <div className="w-32 h-6 bg-slate-900 absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-20"></div>
          
          <div className="flex-1 w-full relative">
            <iframe 
              src="/" 
              className="absolute inset-0 w-full h-full border-0 bg-white" 
              title="Live Mobile Preview"
            ></iframe>
          </div>
        </div>
        )}
      </div>

      {/* View Ad Details Modal */}
      {viewingAd && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm" onClick={() => setViewingAd(null)}>
           <div className="bg-white p-6 rounded-3xl max-w-xl w-full shadow-2xl animate-in zoom-in duration-300" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-800">تفاصيل الإعلان</h3>
                <button onClick={() => setViewingAd(null)} className="text-slate-400 hover:text-slate-700 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">✕</button>
              </div>
              <div className="space-y-4">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                   {viewingAd.imageUrl ? (
                     <img src={viewingAd.imageUrl} alt={viewingAd.title} className="w-24 h-24 object-cover rounded-xl border border-slate-200" />
                   ) : (
                     <div className="w-24 h-24 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center">
                        <Megaphone className="w-8 h-8 text-slate-400" />
                     </div>
                   )}
                   <div>
                     <h4 className="text-lg font-bold text-slate-800">{viewingAd.title}</h4>
                     <p className="text-sm text-slate-500">{viewingAd.advertiser}</p>
                   </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="block text-xs font-bold text-slate-500 mb-1">الموقع</span>
                     <span className="text-sm font-bold text-slate-800">{viewingAd.placement}</span>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="block text-xs font-bold text-slate-500 mb-1">الحالة</span>
                     <span className="text-sm font-bold text-slate-800">{viewingAd.status}</span>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="block text-xs font-bold text-slate-500 mb-1">التاريخ</span>
                     <span className="text-sm font-bold text-slate-800">{viewingAd.startDate} - {viewingAd.endDate}</span>
                   </div>
                   <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                     <span className="block text-xs font-bold text-slate-500 mb-1">القيمة المشحونة</span>
                     <span className="text-sm font-bold text-slate-800">{viewingAd.value.toLocaleString()} ر.س</span>
                   </div>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2">
                   <span className="block text-xs font-bold text-slate-500 mb-2">المحتوى النصي</span>
                   <p className="text-sm text-slate-700 leading-relaxed">{viewingAd.content || 'لا يوجد محتوى نصي'}</p>
                </div>
                {viewingAd.linkUrl && (
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mt-2 flex items-center justify-between">
                     <span className="text-xs font-bold text-slate-500">رابط الإعلان</span>
                     <a href={viewingAd.linkUrl} target="_blank" rel="noreferrer" className="text-sm font-bold text-blue-600 hover:underline flex items-center gap-1">
                       فتح الرابط <ExternalLink className="w-3 h-3" />
                     </a>
                  </div>
                )}
              </div>
              <div className="mt-8 flex justify-end">
                <button onClick={() => setViewingAd(null)} className="bg-slate-100 hover:bg-slate-200 px-6 py-2.5 rounded-xl font-bold text-slate-700 transition-colors">إغلاق</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}
