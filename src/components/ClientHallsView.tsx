import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Building2, Plus, Layers, Search, Filter, Eye, Pencil, Trash2, 
  Settings2, Star, BadgePercent, Clock, AlertTriangle, Ban, 
  CheckCircle2, ChevronLeft, ChevronRight, MapPin, Phone, Mail, 
  User, ShieldCheck, HelpCircle, X, Sparkles, Table, List, LayoutGrid,
  RefreshCw, Power
} from 'lucide-react';
import { PricingPatternBadge, HallStatusBadges, HallOccupancyProgressBar } from './HallCardAddons';
import { ItemQrCodeButton } from './common/ItemQrCodeModal';

interface ClientHallsViewProps {
  userRole: string;
  currentProviderName: string;
  currentUserName: string;
  providerSubscription: any;
  halls: any[];
  setHalls: React.Dispatch<React.SetStateAction<any[]>>;
  regions: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  setEditingItem: React.Dispatch<React.SetStateAction<any>>;
  setHallForm: React.Dispatch<React.SetStateAction<any>>;
  setIsHallModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  providers: any[];
  setDeleteData: React.Dispatch<React.SetStateAction<any>>;
  toggleHallStatus: (h: any) => Promise<void>;
  setViewingHall: React.Dispatch<React.SetStateAction<any>>;
  setIsHallViewModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isHallViewModalOpen: boolean;
  viewingHall: any;
}

// Global utility helpers duplicated from App.tsx to remain self-contained
const renderPriceWithTax = (amount: number, isVatEnabled: boolean, className: string = "font-bold text-slate-800") => {
  return (
    <div className={className} dir="rtl">
      <span>{amount.toLocaleString('ar-SA')} ر.س</span>
      {isVatEnabled && <span className="text-[10px] text-emerald-600 font-bold mr-1">(شامل ضريبة القيمة المضافة)</span>}
    </div>
  );
};

const renderStars = (rating: number = 0, count: number = 0) => {
  const starsArray = [];
  const floorRating = Math.floor(rating);
  for (let i = 1; i <= 5; i++) {
    starsArray.push(
      <Star
        key={i}
        className={`w-3.5 h-3.5 ${
          i <= floorRating
            ? "fill-amber-400 text-amber-400"
            : "text-slate-200 fill-slate-100"
        }`}
      />
    );
  }
  return (
    <div className="flex items-center gap-1">
      <div className="flex items-center">{starsArray}</div>
      {count > 0 && <span className="text-[10px] text-slate-400 font-normal">({count})</span>}
    </div>
  );
};

export function ClientHallsView({
  userRole,
  currentProviderName,
  currentUserName,
  providerSubscription,
  halls,
  setHalls,
  regions,
  showNotification,
  setEditingItem,
  setHallForm,
  setIsHallModalOpen,
  providers,
  setDeleteData,
  toggleHallStatus,
  setViewingHall,
  setIsHallViewModalOpen,
  isHallViewModalOpen,
  viewingHall
}: ClientHallsViewProps) {
  // Local filter states
  const [hallCategories, setHallCategories] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('SYSTEM_DATastore_hallCategories');
      if (stored) return JSON.parse(stored);
    } catch (e) {}
    return ['قاعة أفراح', 'استراحة قسم', 'استراحة قسمين', 'شاليه', 'منتجع', 'متنزه', 'مخيم', 'قاعة اجتماع', 'أخرى'];
  });

  useEffect(() => {
    const syncCats = () => {
      try {
        const stored = localStorage.getItem('SYSTEM_DATastore_hallCategories');
        if (stored) setHallCategories(JSON.parse(stored));
      } catch (e) {}
    };
    window.addEventListener('settingsUpdated', syncCats);
    return () => window.removeEventListener('settingsUpdated', syncCats);
  }, []);

  const [hallsSearchQuery, setHallsSearchQuery] = useState('');
  const [hallsFilterRegion, setHallsFilterRegion] = useState('');
  const [hallsFilterCity, setHallsFilterCity] = useState('');
  const [hallsFilterProvider, setHallsFilterProvider] = useState('');
  const [hallsFilterCategory, setHallsFilterCategory] = useState('');
  const [hallsFilterStatus, setHallsFilterStatus] = useState('');
  const [hallsSortBy, setHallsSortBy] = useState('newest');
  const [hallsCurrentPage, setHallsCurrentPage] = useState(1);
  const [hallsPageSize, setHallsPageSize] = useState<number>(() => Number(localStorage.getItem('SETTINGS_HALLS_PER_PAGE') || '6'));

  useEffect(() => {
    setHallsCurrentPage(1);
  }, [hallsSearchQuery, hallsFilterRegion, hallsFilterCity, hallsFilterProvider, hallsFilterCategory, hallsFilterStatus, hallsSortBy]);

  // Local helper states
  const [hallsViewMode, setHallsViewMode] = useState<'table' | 'list' | 'grid'>('grid');
  const [managingHall, setManagingHall] = useState<any>(null);
  const [isHallServicesModalOpen, setIsHallServicesModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

  const formatCurrency = (val: number) => typeof val === 'number' ? `${val.toLocaleString('ar-SA')} ر.س` : (val || '');

  // Local calculation logic for halls list sorting and paging
  let filteredHalls = (halls || []).filter((h: any) => {
    if (userRole === "provider" && h.provider !== currentProviderName) return false;
    if (userRole !== "admin" && userRole !== "provider") {
      if (h.status === 'pending' || h.status === 'بانتظار الموافقة' || h.status === 'pending_approval' || h.adminStatus === 'pending') {
        return false;
      }
    }
    const matchSearch = (h.name || '').includes(hallsSearchQuery) || (h.provider || '').includes(hallsSearchQuery) || (h.city || '').includes(hallsSearchQuery) || (h.facilities || "").includes(hallsSearchQuery) || (h.contractTerms || "").includes(hallsSearchQuery);
    const matchRegion = hallsFilterRegion ? h.region === hallsFilterRegion : true;
    const matchCity = hallsFilterCity ? h.city === hallsFilterCity : true;
    const matchProvider = hallsFilterProvider ? h.provider === hallsFilterProvider : true;
    const matchCategory = hallsFilterCategory ? h.category === hallsFilterCategory : true;
    const matchStatus = hallsFilterStatus ? (
      hallsFilterStatus === "مفعل" ? (h.status === "مفعل" || h.status === "active") :
      hallsFilterStatus === "موقوف" ? (h.status === "موقوف" || h.status === "inactive" || h.status === "غير مفعل") :
      h.status === hallsFilterStatus
    ) : true;
    return matchSearch && matchRegion && matchCity && matchProvider && matchCategory && matchStatus;
  });

  if (hallsSortBy === "priceDesc") {
    filteredHalls.sort((a: any, b: any) => b.nightPrice - a.nightPrice);
  } else if (hallsSortBy === "priceAsc") {
    filteredHalls.sort((a: any, b: any) => a.nightPrice - b.nightPrice);
  } else {
    filteredHalls.sort((a: any, b: any) => b.id - a.id);
  }

  const hallsPerPage = hallsPageSize;
  const hallsTotalPages = Math.ceil(filteredHalls.length / hallsPerPage) || 1;
  const paginatedHalls = filteredHalls.slice((hallsCurrentPage - 1) * hallsPerPage, hallsCurrentPage * hallsPerPage);

  const hideHeader = false;

  // Render function contents
  return (
    <div className="space-y-6">

      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          {!hideHeader ? (
            <h2 className="text-2xl font-bold text-slate-800">إدارة القاعات والمنشآت</h2>
          ) : (
            <div>
              <h3 className="text-lg font-black text-slate-800">القاعات والمنشآت الحالية</h3>
              <p className="text-slate-400 text-xs mt-0.5">إجمالي المنشآت النشطة المسجلة باسمك</p>
            </div>
          )}
          <button
            onClick={() => {
              if (userRole === 'provider') {
                const myHallsCount = halls.filter(h => h.provider === currentProviderName).length;
                const hallsLimit = providerSubscription?.hallsLimit;
                if (hallsLimit !== undefined && hallsLimit !== null && hallsLimit !== '' && hallsLimit !== 'unlimited') {
                  const additionalHalls = Number(providerSubscription?.additionalHalls || 0);
                  const effectiveHallsLimit = Number(hallsLimit) + additionalHalls;
                  if (myHallsCount >= effectiveHallsLimit) {
                    showNotification('error', `لقد وصلت للحد الأقصى لعدد القاعات/المنشآت المسموح بها في باقتك الحالية مع الميزات الإضافية (${effectiveHallsLimit} منشأة). يُرجى ترقية الباقة أو شراء ميزات إضافية.`);
                    return;
                  }
                }
              }
              setEditingItem(null);
              setHallForm({
                name: "",
                category: "قاعة أفراح",
                description: "",
                providerType: "منشأة",
                crNumber: "",
                crExpiryDate: "",
                phone: "",
                email: "",
                taxNumber: "",
                region: "",
                city: "",
                nationalAddress: "",
                extraAddress: "",
                capacity: "",
                nightPrice: 0,
                morningPrice: 0,
                fullDayPrice: 0,
                status: "مفعل",
                bookingStatus: "متاح",
                facilities: "",
                rules: "",
                contractTerms: "",
                pledge: false,
                images: [],
                crFile: null,
                ibanFile: null,
                vatFile: null,
                hostName: currentUserName,
                provider: userRole === 'provider' ? currentProviderName : "",
                extraServicesList: []
              });
              setIsHallModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
          >
            <Plus className="w-5 h-5" /> إضافة منشأة
          </button>
        </div>

        {/* بطاقات إحصائيات القاعات والمنشآت المبتكرة */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" dir="rtl">
          {/* إجمالي المرافق */}
          <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 border border-slate-200/60 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-slate-500">إجمالي المرافق</span>
              <span className="block text-3xl font-black text-slate-800 animate-in fade-in">
                {userRole === 'provider' 
                  ? halls.filter(h => h.provider === currentProviderName).length 
                  : halls.length}
              </span>
              <span className="block text-[10px] text-slate-400">
                {userRole === 'provider' ? 'المرافق التابعة لك كشريك' : 'شامل القاعات والمرافق بالمنصة'}
              </span>
            </div>
            <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center border border-slate-200 shadow-sm">
              <Layers className="w-6 h-6" />
            </div>
          </div>

          {/* المنشآت النشطة */}
          <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-100/30 border border-emerald-150 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-emerald-700">المنشآت النشطة</span>
              <span className="block text-3xl font-black text-emerald-800 animate-in fade-in">
                {(userRole === 'provider' 
                  ? halls.filter(h => h.provider === currentProviderName)
                  : halls).filter(h => (h.status === 'مفعل' || h.status === 'active') && (h.bookingStatus === 'متاح' || !h.bookingStatus || h.bookingStatus === 'available')).length}
              </span>
              <span className="block text-[10px] text-emerald-600 font-medium">المفعلة إدارياً وبحالة متاح للحجز</span>
            </div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center border border-emerald-100 shadow-sm">
              <CheckCircle2 className="w-6 h-6" />
            </div>
          </div>

          {/* المنشآت متوقفة / صيانة */}
          <div className="bg-gradient-to-br from-amber-50/50 to-amber-100/30 border border-amber-150 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-amber-700">متوقفة / تحت الصيانة</span>
              <span className="block text-3xl font-black text-amber-800 animate-in fade-in">
                {(userRole === 'provider' 
                  ? halls.filter(h => h.provider === currentProviderName)
                  : halls).filter(h => !(h.status === 'مفعل' || h.status === 'active') || h.bookingStatus === 'صيانة' || h.bookingStatus === 'موقوفة' || h.bookingStatus === 'موقوف').length}
              </span>
              <span className="block text-[10px] text-amber-600 font-medium">تحت الصيانة، الموقوفة أو غير المفعلة</span>
            </div>
            <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center border border-amber-100 shadow-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>

          {/* المنشآت المحظورة إدارياً */}
          <div className="bg-gradient-to-br from-rose-50/55 to-rose-100/35 border border-rose-150 p-5 rounded-2xl flex items-center justify-between shadow-sm">
            <div className="space-y-1">
              <span className="block text-xs font-bold text-rose-700">المحظورة إدارياً</span>
              <span className="block text-3xl font-black text-rose-800 animate-in fade-in">
                {(userRole === 'provider' 
                  ? halls.filter(h => h.provider === currentProviderName)
                  : halls).filter(h => !(h.status === 'مفعل' || h.status === 'active')).length}
              </span>
              <span className="block text-[10px] text-rose-600 font-medium">غير المفعلة من الإدارة العامة</span>
            </div>
            <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center border border-rose-100 shadow-sm">
              <Ban className="w-6 h-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col gap-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="بحث بالاسم، المزود، المدينة، المرافق أو الشروط..."
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none"
                value={hallsSearchQuery}
                onChange={(e) => setHallsSearchQuery(e.target.value)}
              />
            </div>
            <select
              className="p-3 rounded-xl border border-slate-200 bg-white min-w-[150px] outline-none"
              value={hallsSortBy}
              onChange={(e) => setHallsSortBy(e.target.value)}
            >
              <option value="newest">ترتيب: الأحدث</option>
              <option value="priceDesc">السعر: الأعلى أولاً</option>
              <option value="priceAsc">السعر: الأقل أولاً</option>
            </select>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            <select
              className="p-3 rounded-xl border border-slate-200 bg-white outline-none text-sm"
              value={hallsFilterCategory}
              onChange={(e) => setHallsFilterCategory(e.target.value)}
            >
              <option value="">كل التصنيفات</option>
              {hallCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            <select
              className="p-3 rounded-xl border border-slate-200 bg-white outline-none text-sm"
              value={hallsFilterRegion}
              onChange={(e) => {
                setHallsFilterRegion(e.target.value);
                setHallsFilterCity("");
              }}
            >
              <option value="">كل المناطق</option>
              {regions.map((r) => (
                <option value={r.name} key={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
            <select
              className="p-3 rounded-xl border border-slate-200 bg-white outline-none text-sm"
              value={hallsFilterCity}
              onChange={(e) => setHallsFilterCity(e.target.value)}
            >
              <option value="">كل المدن</option>
              {regions
                .find((r) => r.name === hallsFilterRegion)
                ?.cities.map((c) => (
                  <option value={c} key={c}>
                    {c}
                  </option>
                ))}
            </select>
            <select
              className="p-3 rounded-xl border border-slate-200 bg-white outline-none text-sm"
              value={hallsFilterProvider}
              onChange={(e) => setHallsFilterProvider(e.target.value)}
            >
              <option value="">كل المزودين</option>
              <option value="شركة أطياف لتنظيم المعارض">شركة أطياف لتنظيم المعارض</option>
              <option value="سالم الدوسري">سالم الدوسري</option>
            </select>
            <select
              className="p-3 rounded-xl border border-slate-200 bg-white outline-none text-sm"
              value={hallsFilterStatus}
              onChange={(e) => setHallsFilterStatus(e.target.value)}
            >
              <option value="">كل الحالات</option>
              <option value="مفعل">مفعل</option>
              <option value="موقوف">موقوف</option>
              <option value="بانتظار الموافقة">بانتظار الموافقة</option>
            </select>
            <button
              className="p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100 transition-colors text-sm font-medium flex justify-center items-center gap-2"
              onClick={() => {
                setHallsSearchQuery("");
                setHallsFilterRegion("");
                setHallsFilterCity("");
                setHallsFilterProvider("");
                setHallsFilterCategory("");
                setHallsFilterStatus("");
                setHallsSortBy("newest");
              }}
            >
              <Filter className="w-4 h-4" /> مسح التصفية
            </button>
          </div>
        </div>

        {/* View Switcher and Rows per page Container */}
        <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-slate-200 gap-3">
          <div className="text-xs text-slate-500 font-medium font-sans">
             عرض {filteredHalls.length} منشأة مكتشفة
          </div>
          <div className="flex items-center gap-4">
            {/* Page Size Selector */}
            <div className="flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">عدد الصفوف:</span>
              <select
                value={hallsPageSize}
                onChange={(e) => {
                  setHallsPageSize(Number(e.target.value));
                  setHallsCurrentPage(1);
                }}
                className="bg-transparent text-slate-750 font-bold text-xs outline-none cursor-pointer focus:ring-0 border-none p-0 pr-1"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
              <button
                type="button"
                onClick={() => setHallsViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${hallsViewMode === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="عرض جدولي"
              >
                <Table className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setHallsViewMode('list')}
                className={`p-1.5 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${hallsViewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="عرض قائمة"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setHallsViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-black flex items-center justify-center transition-all cursor-pointer ${hallsViewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                title="عرض شبكي"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {hallsViewMode === 'table' ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-right whitespace-nowrap">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-500">
                  <tr>
                    <th className="p-4 font-medium w-12 text-center">#</th>
                    <th className="p-4 font-medium">اسم المنشأة</th>
                    <th className="p-4 font-medium">التصنيف</th>
                    <th className="p-4 font-medium">التقييم</th>
                    <th className="p-4 font-medium">المزود</th>
                    <th className="p-4 font-medium">المدينة</th>
                    <th className="p-4 font-medium">الاستيعاب</th>
                    <th className="p-4 font-medium">الحالة</th>
                    <th className="p-4 font-medium">حالة الحجز</th>
                    <th className="p-4 font-medium">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {paginatedHalls.map((h: any, index: number) => (
                    <tr className="hover:bg-slate-50 transition-colors" key={h.id}>
                      <td className="p-4 text-center font-medium text-slate-500">
                        {(hallsCurrentPage - 1) * hallsPerPage + index + 1}
                      </td>
                      <td className="p-4 font-bold text-slate-800">{h.name}</td>
                      <td className="p-4">
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
                          {h.category}
                        </span>
                      </td>
                      <td className="p-4">{renderStars(h.rating, h.reviewsCount)}</td>
                      <td className="p-4 text-slate-600">{h.provider}</td>
                      <td className="p-4 text-slate-600">{h.city}</td>
                      <td className="p-4 text-slate-600">{h.capacity} شخص</td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            (h.status === "مفعل" || h.status === "active") ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                          }`}
                        >
                          {(h.status === "مفعل" || h.status === "active") ? "مفعل" : "غير مفعل"}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold border ${
                            (!h.bookingStatus || h.bookingStatus === "متاح")
                              ? "bg-emerald-50 text-emerald-700 border-emerald-250"
                              : h.bookingStatus === "صيانة"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {h.bookingStatus || "متاح"}
                        </span>
                      </td>
                      <td className="p-4 flex gap-2 items-center">
                        <ItemQrCodeButton
                          item={{ id: h.id, name: h.name, type: 'hall', provider: h.provider, city: h.city, image: h.images?.[0] }}
                          variant="table"
                        />
                        <button
                          onClick={() => {
                            setViewingHall(h);
                            setIsHallViewModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setManagingHall(h);
                            setIsHallServicesModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors"
                          title="إدارة الخدمات"
                        >
                          <Settings2 className="w-4 h-4" />
                        </button>
                        <button
                          title={`تبديل حالة الحجز (${h.bookingStatus || "متاح"})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus: Record<string, string> = { "متاح": "صيانة", "صيانة": "موقوفة", "موقوفة": "متاح", "محجوز": "متاح" };
                            const currentStatus = h.bookingStatus || "متاح";
                            const newStatus = nextStatus[currentStatus];
                            const updated = halls.map((hall: any) =>
                              hall.id === h.id ? { ...hall, bookingStatus: newStatus } : hall
                            );
                            setHalls(updated);
                          }}
                          className={`p-2 rounded-xl font-bold transition-all border flex items-center shadow-sm ${
                            (!h.bookingStatus || h.bookingStatus === "متاح")
                              ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200"
                              : h.bookingStatus === "صيانة"
                              ? "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-200"
                              : "bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-200"
                          }`}
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(h);
                            setHallForm({
                              name: h.name || "",
                              category: h.category || "قاعة أفراح",
                              description: h.description || "",
                              providerType: h.providerType || "منشأة",
                              crNumber: h.crNumber || "",
                              crExpiryDate: h.crExpiryDate || "",
                              phone: h.phone || "",
                              email: h.email || "",
                              taxNumber: h.taxNumber || "",
                              region: h.region || "",
                              city: h.city || "",
                              nationalAddress: h.nationalAddress || "",
                              extraAddress: h.extraAddress || "",
                              capacity: h.capacity || "",
                              nightPrice: h.nightPrice || 0,
                              morningPrice: h.morningPrice || 0,
                              fullDayPrice: h.fullDayPrice || 0,
                              status: h.status || "مفعل",
                              bookingStatus: h.bookingStatus || "متاح",
                              facilities: h.facilities || "",
                              rules: h.rules || "",
                              contractTerms: h.contractTerms || "",
                              pledge: h.pledge || false,
                              images: h.images || [],
                              image: h.image || "",
                              features: h.features || [],
                              location: h.location || "",
                              extraServicesList: h.extraServicesList || [],
                              reviews: h.reviews || [],
                              availableDays: h.availableDays || [],
                              featured: h.featured || false,
                              crFile: h.crFile || null,
                              ibanFile: h.ibanFile || null,
                              vatFile: h.vatFile || null,
                              hostName: h.hostName || currentUserName,
                              provider: h.provider || ""
                            });
                            setIsHallModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition-colors"
                          title="تعديل"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setManagingHall(h);
                            setIsAddServiceModalOpen(true);
                          }}
                          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                          title="إضافة خدمة إضافية"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          className={`p-2 rounded-xl transition-colors ${
                            (h.status === "مفعل" || h.status === "active") ? "text-green-600 hover:bg-green-50" : "text-slate-400 hover:bg-slate-100"
                          }`}
                          title={(h.status === "مفعل" || h.status === "active") ? "إيقاف المنشأة" : "تفعيل المنشأة"}
                          onClick={() => toggleHallStatus(h)}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteData({ id: h.id, type: "halls", name: h.name })}
                          className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {hallsTotalPages > 1 && (
              <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50">
                <span className="text-sm text-slate-500 font-medium font-sans">
                  عرض {(hallsCurrentPage - 1) * hallsPerPage + 1} إلى{" "}
                  {Math.min(hallsCurrentPage * hallsPerPage, filteredHalls.length)} من {filteredHalls.length} منشأة
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={hallsCurrentPage === 1}
                    onClick={() => setHallsCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    السابق
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hallsTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        onClick={() => setHallsCurrentPage(page)}
                        key={page}
                        className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors cursor-pointer ${
                          hallsCurrentPage === page ? "bg-amber-500 text-white shadow-sm font-sans" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-sans"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={hallsCurrentPage === hallsTotalPages}
                    onClick={() => setHallsCurrentPage((prev) => Math.min(prev + 1, hallsTotalPages))}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : hallsViewMode === 'list' ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5 space-y-4">
              {paginatedHalls.map((h: any) => {
                const imgUrl = h.image || (h.images && h.images.length > 0 ? (h.images[0].preview || h.images[0]) : '');
                return (
                  <div key={h.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row gap-5 p-4 group">
                    {/* Horizontal Image */}
                    <div className="relative w-full md:w-56 h-40 bg-slate-900 rounded-xl overflow-hidden shrink-0">
                      {imgUrl ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={imgUrl} 
                          alt={h.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                          <Layers className="w-10 h-10 text-slate-300 mb-1" />
                          <span className="text-[10px]">لا تتوفر صورة توضيحية</span>
                        </div>
                      )}
                      
                      {/* Status Badges */}
                      <HallStatusBadges status={h.status} bookingStatus={h.bookingStatus} />

                      {/* Pricing Pattern Badge (Top Left) */}
                      <div className="absolute top-2 left-2 z-25">
                        <PricingPatternBadge bookingType={h.bookingType} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-start gap-4">
                          <div className="space-y-0.5">
                            <h4 className="font-extrabold text-slate-800 text-base group-hover:text-amber-600 transition-colors flex items-center gap-2">
                              {h.name}
                              <span className="text-xs font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{h.category}</span>
                            </h4>
                            
                            {/* Monthly Occupancy Progress Bar */}
                            <HallOccupancyProgressBar hall={h} />

                            <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                              <span>بواسطة:</span>
                              {h.provider ? (
                                <Link 
                                  to={`/provider-profile/${encodeURIComponent(h.provider)}`}
                                  className="text-amber-600 hover:text-amber-700 font-bold hover:underline transition-all inline-flex items-center gap-1"
                                >
                                  <span>{h.provider}</span>
                                  <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded-full border border-amber-200">💎 شريك معتمد</span>
                                </Link>
                              ) : (
                                <span>غير محدد</span>
                              )}
                            </p>
                          </div>
                          <div className="text-left">
                            {h.nightPrice !== undefined && h.nightPrice > 0 && (
                              <div className="text-lg font-black text-amber-600 font-mono">
                                {formatCurrency(h.nightPrice)} / ليلة
                              </div>
                            )}
                            <div className="flex items-center text-amber-500 gap-0.5 justify-end" dir="ltr">
                              <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-400" />
                              <span className="text-xs font-bold">{h.rating || '4.5'}</span>
                              <span className="text-[10px] text-slate-400">({h.reviewsCount || '10'})</span>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-xs text-slate-505 line-clamp-2 leading-relaxed min-h-[2.5rem]">{h.description || 'لا يوجد وصف مضاف لمميزات هذه القاعة بشكل تفصيلي حالياً.'}</p>
                        
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 pt-1">
                          <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">المدينة: <strong className="text-slate-700">{h.city}</strong></span>
                          <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">الاستيعاب: <strong className="text-slate-700">{h.capacity ? `${h.capacity} شخص` : 'غير محدد'}</strong></span>
                          {h.region && <span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md">المنطقة: <strong className="text-slate-700">{h.region}</strong></span>}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 justify-end">
                        <ItemQrCodeButton
                          item={{ id: h.id, name: h.name, type: 'hall', provider: h.provider, city: h.city, image: h.images?.[0] }}
                          variant="default"
                        />
                        <button
                          onClick={() => {
                            setViewingHall(h);
                            setIsHallViewModalOpen(true);
                          }}
                          className="p-1.5 px-2.5 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg flex items-center gap-1 transition-all border border-slate-100 cursor-pointer"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                        <button
                          onClick={() => {
                            setManagingHall(h);
                            setIsHallServicesModalOpen(true);
                          }}
                          className="p-1.5 px-2.5 text-xs bg-purple-50 hover:bg-purple-100/80 text-purple-600 rounded-lg flex items-center gap-1 transition-all border border-purple-100 cursor-pointer"
                          title="إدارة الخدمات"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>الخدمات</span>
                        </button>
                        <button
                          title={`تبديل حالة الحجز (${h.bookingStatus || "متاح"})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus: Record<string, string> = { "متاح": "صيانة", "صيانة": "موقوفة", "موقوفة": "متاح", "محجوز": "متاح" };
                            const currentStatus = h.bookingStatus || "متاح";
                            const newStatus = nextStatus[currentStatus];
                            const updated = halls.map((hall: any) =>
                              hall.id === h.id ? { ...hall, bookingStatus: newStatus } : hall
                            );
                            setHalls(updated);
                          }}
                          className={`p-1.5 px-2.5 text-xs rounded-lg transition-all border flex items-center gap-1 cursor-pointer ${
                            (!h.bookingStatus || h.bookingStatus === "متاح")
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : h.bookingStatus === "صيانة"
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              : "bg-rose-50 text-rose-750 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>الحجز</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(h);
                            setHallForm({
                              name: h.name || "",
                              category: h.category || "قاعة أفراح",
                              description: h.description || "",
                              providerType: h.providerType || "منشأة",
                              crNumber: h.crNumber || "",
                              crExpiryDate: h.crExpiryDate || "",
                              phone: h.phone || "",
                              email: h.email || "",
                              taxNumber: h.taxNumber || "",
                              region: h.region || "",
                              city: h.city || "",
                              nationalAddress: h.nationalAddress || "",
                              extraAddress: h.extraAddress || "",
                              capacity: h.capacity || "",
                              nightPrice: h.nightPrice || 0,
                              morningPrice: h.morningPrice || 0,
                              fullDayPrice: h.fullDayPrice || 0,
                              status: h.status || "مفعل",
                              bookingStatus: h.bookingStatus || "متاح",
                              facilities: h.facilities || "",
                              rules: h.rules || "",
                              contractTerms: h.contractTerms || "",
                              pledge: h.pledge || false,
                              images: h.images || [],
                              image: h.image || "",
                              features: h.features || [],
                              location: h.location || "",
                              extraServicesList: h.extraServicesList || [],
                              reviews: h.reviews || [],
                              availableDays: h.availableDays || [],
                              featured: h.featured || false,
                              crFile: h.crFile || null,
                              ibanFile: h.ibanFile || null,
                              vatFile: h.vatFile || null,
                              hostName: h.hostName || currentUserName,
                              provider: h.provider || ""
                            });
                            setIsHallModalOpen(true);
                          }}
                          className="p-1.5 px-2.5 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-150 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          title="تعديل"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => {
                            setManagingHall(h);
                            setIsAddServiceModalOpen(true);
                          }}
                          className="p-1.5 px-2.5 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1 transition-all border border-blue-100 cursor-pointer"
                          title="إضافة خدمة إضافية"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة خدمة</span>
                        </button>
                        <button
                          className={`p-1.5 text-xs rounded-lg transition-colors border cursor-pointer ${
                            (h.status === "مفعل" || h.status === "active") ? "text-green-600 hover:bg-green-50 border-green-100" : "text-slate-400 hover:bg-slate-100 border-slate-100"
                          }`}
                          title={(h.status === "مفعل" || h.status === "active") ? "إيقاف المنشأة" : "تفعيل المنشأة"}
                          onClick={() => toggleHallStatus(h)}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteData({ id: h.id, type: "halls", name: h.name })}
                          className="p-1.5 text-xs bg-red-50 hover:bg-red-100/80 text-red-600 rounded-lg flex items-center gap-1 transition-all border border-red-100 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hallsTotalPages > 1 && (
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
                <span className="text-sm text-slate-500 font-medium font-sans">
                  عرض {(hallsCurrentPage - 1) * hallsPerPage + 1} إلى{" "}
                  {Math.min(hallsCurrentPage * hallsPerPage, filteredHalls.length)} من {filteredHalls.length} منشأة
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={hallsCurrentPage === 1}
                    onClick={() => setHallsCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    السابق
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hallsTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        onClick={() => setHallsCurrentPage(page)}
                        key={page}
                        className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors cursor-pointer ${
                          hallsCurrentPage === page ? "bg-amber-500 text-white shadow-sm font-sans" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-sans"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={hallsCurrentPage === hallsTotalPages}
                    onClick={() => setHallsCurrentPage((prev) => Math.min(prev + 1, hallsTotalPages))}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedHalls.map((h: any) => {
                const imgUrl = h.image || (h.images && h.images.length > 0 ? (h.images[0].preview || h.images[0]) : '');
                return (
                  <div key={h.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group h-full">
                    {/* Image */}
                    <div className="relative h-48 bg-slate-900 overflow-hidden">
                      {imgUrl ? (
                        <img 
                          referrerPolicy="no-referrer"
                          src={imgUrl} 
                          alt={h.name} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 bg-slate-100">
                          <Layers className="w-12 h-12 text-slate-300 mb-2" />
                          <span className="text-xs">لا تتوفر صورة توضيحية</span>
                        </div>
                      )}
                      
                      {/* Price Tag */}
                      {h.nightPrice !== undefined && h.nightPrice > 0 && (
                        <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-xs text-white px-3 py-1.5 rounded-lg text-xs font-bold font-mono">
                          {formatCurrency(h.nightPrice)} / ليلة
                        </div>
                      )}

                      {/* Status Badges */}
                      <HallStatusBadges status={h.status} bookingStatus={h.bookingStatus} />

                      {/* Pricing Pattern Badge (Top Left) */}
                      <div className="absolute top-3 left-3 z-25">
                        <PricingPatternBadge bookingType={h.bookingType} />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between items-start gap-1">
                          <h4 className="font-bold text-slate-800 text-base line-clamp-1 group-hover:text-amber-600 transition-colors">{h.name}</h4>
                          <div className="shrink-0 flex items-center text-amber-500 gap-0.5 animate-in fade-in" dir="ltr">
                            <Star className="w-4 h-4 fill-amber-500 text-amber-400" />
                            <span className="text-xs font-bold">{h.rating || '4.5'}</span>
                            <span className="text-[10px] text-slate-400">({h.reviewsCount || '10'})</span>
                          </div>
                        </div>

                        <div className="text-xs text-slate-500 space-y-1">
                          <div className="flex justify-between">
                            <span>التصنيف:</span>
                            <span className="font-medium text-slate-700">{h.category}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>المدينة / المنطقة:</span>
                            <span className="font-medium text-slate-700">{h.city} {h.region ? `/ ${h.region}` : ''}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>الاستيعاب:</span>
                            <span className="font-medium text-slate-700">{h.capacity ? `${h.capacity} شخص` : 'غير محدد'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>المزود:</span>
                            <span className="font-medium text-slate-700 max-w-[150px] truncate">{h.provider}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions aligned beautifully */}
                      <div className="pt-3 border-t border-slate-100 flex flex-wrap gap-1.5 justify-end">
                        <ItemQrCodeButton
                          item={{ id: h.id, name: h.name, type: 'hall', provider: h.provider, city: h.city, image: h.images?.[0] }}
                          variant="default"
                        />
                        <button
                          onClick={() => {
                            setViewingHall(h);
                            setIsHallViewModalOpen(true);
                          }}
                          className="p-1 px-2 text-xs bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg flex items-center gap-1 transition-all border border-slate-100 cursor-pointer"
                          title="عرض التفاصيل"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>عرض</span>
                        </button>
                        <button
                          onClick={() => {
                            setManagingHall(h);
                            setIsHallServicesModalOpen(true);
                          }}
                          className="p-1 px-2 text-xs bg-purple-50 hover:bg-purple-100/80 text-purple-600 rounded-lg flex items-center gap-1 transition-all border border-purple-100 cursor-pointer"
                          title="إدارة الخدمات"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>الخدمات</span>
                        </button>
                        <button
                          title={`تبديل حالة الحجز (${h.bookingStatus || "متاح"})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const nextStatus: Record<string, string> = { "متاح": "صيانة", "صيانة": "موقوفة", "موقوفة": "متاح", "محجوز": "متاح" };
                            const currentStatus = h.bookingStatus || "متاح";
                            const newStatus = nextStatus[currentStatus];
                            const updated = halls.map((hall: any) =>
                              hall.id === h.id ? { ...hall, bookingStatus: newStatus } : hall
                            );
                            setHalls(updated);
                          }}
                          className={`p-1 px-2 text-xs rounded-lg transition-all border flex items-center gap-1 cursor-pointer ${
                            (!h.bookingStatus || h.bookingStatus === "متاح")
                              ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              : h.bookingStatus === "صيانة"
                              ? "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100"
                              : "bg-rose-50 text-rose-750 border-rose-200 hover:bg-rose-100"
                          }`}
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>الحجز</span>
                        </button>
                        <button
                          onClick={() => {
                            setEditingItem(h);
                            setHallForm({
                              name: h.name || "",
                              category: h.category || "قاعة أفراح",
                              description: h.description || "",
                              providerType: h.providerType || "منشأة",
                              crNumber: h.crNumber || "",
                              crExpiryDate: h.crExpiryDate || "",
                              phone: h.phone || "",
                              email: h.email || "",
                              taxNumber: h.taxNumber || "",
                              region: h.region || "",
                              city: h.city || "",
                              nationalAddress: h.nationalAddress || "",
                              extraAddress: h.extraAddress || "",
                              capacity: h.capacity || "",
                              nightPrice: h.nightPrice || 0,
                              morningPrice: h.morningPrice || 0,
                              fullDayPrice: h.fullDayPrice || 0,
                              status: h.status || "مفعل",
                              bookingStatus: h.bookingStatus || "متاح",
                              facilities: h.facilities || "",
                              rules: h.rules || "",
                              contractTerms: h.contractTerms || "",
                              pledge: h.pledge || false,
                              images: h.images || [],
                              image: h.image || "",
                              features: h.features || [],
                              location: h.location || "",
                              extraServicesList: h.extraServicesList || [],
                              reviews: h.reviews || [],
                              availableDays: h.availableDays || [],
                              featured: h.featured || false,
                              crFile: h.crFile || null,
                              ibanFile: h.ibanFile || null,
                              vatFile: h.vatFile || null,
                              hostName: h.hostName || currentUserName,
                              provider: h.provider || ""
                            });
                            setIsHallModalOpen(true);
                          }}
                          className="p-1 px-2 text-xs bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-150 rounded-lg flex items-center gap-1 transition-all cursor-pointer"
                          title="تعديل"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                          <span>تعديل</span>
                        </button>
                        <button
                          onClick={() => {
                            setManagingHall(h);
                            setIsAddServiceModalOpen(true);
                          }}
                          className="p-1 px-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg flex items-center gap-1 transition-all border border-blue-100 cursor-pointer"
                          title="إضافة خدمة إضافية"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>إضافة خدمة</span>
                        </button>
                        <button
                          className={`p-1 px-2 text-xs rounded-lg transition-colors border cursor-pointer ${
                            (h.status === "مفعل" || h.status === "active") ? "text-green-600 hover:bg-green-50 border-green-100" : "text-slate-400 hover:bg-slate-100 border-slate-100"
                          }`}
                          title={(h.status === "مفعل" || h.status === "active") ? "إيقاف المنشأة" : "تفعيل المنشأة"}
                          onClick={() => toggleHallStatus(h)}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setDeleteData({ id: h.id, type: "halls", name: h.name })}
                          className="p-1 px-2 text-xs bg-red-50 hover:bg-red-100 text-red-600 rounded-lg flex items-center gap-1 transition-all border border-red-100 cursor-pointer"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {hallsTotalPages > 1 && (
              <div className="p-4 rounded-xl border border-slate-200 flex items-center justify-between bg-white shadow-xs">
                <span className="text-sm text-slate-500 font-medium font-sans">
                  عرض {(hallsCurrentPage - 1) * hallsPerPage + 1} إلى{" "}
                  {Math.min(hallsCurrentPage * hallsPerPage, filteredHalls.length)} من {filteredHalls.length} منشأة
                </span>
                <div className="flex gap-2">
                  <button
                    disabled={hallsCurrentPage === 1}
                    onClick={() => setHallsCurrentPage((prev) => Math.max(prev - 1, 1))}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    السابق
                  </button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: hallsTotalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        onClick={() => setHallsCurrentPage(page)}
                        key={page}
                        className={`w-8 h-8 rounded-lg text-sm font-bold flex items-center justify-center transition-colors cursor-pointer ${
                          hallsCurrentPage === page ? "bg-amber-500 text-white shadow-sm font-sans" : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-sans"
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    disabled={hallsCurrentPage === hallsTotalPages}
                    onClick={() => setHallsCurrentPage((prev) => Math.min(prev + 1, hallsTotalPages))}
                    className="px-4 py-2 rounded-xl text-sm font-bold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  >
                    التالي
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
}
