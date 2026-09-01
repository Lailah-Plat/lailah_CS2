import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Store, ShoppingBag, Plus, Minus, Check, Sparkles, 
  Tag, ShieldCheck, ChevronLeft, ArrowRight, Utensils,
  Wine, Armchair, Coffee, Package, Info, Calculator, Layers
} from 'lucide-react';
import {
  DynamicStoreCategory,
  getStoredCategories,
  checkBookingPostOrderEligibility
} from '../data/storeCategoriesConfig';

export interface VenueProductItem {
  id: string;
  name: string;
  category: string;
  unit: string;
  price: number; // VAT-Inclusive (شامل الضريبة)
  minQuantity: number;
  maxQuantity?: number;
  stock: number;
  description?: string;
  icon?: string;
}

export interface VenueServiceItem {
  id: string;
  name: string;
  price: number; // VAT-Inclusive (شامل الضريبة)
  desc?: string;
  category?: string;
}

export interface SelectedProductCart {
  [productId: string]: number; // quantity
}

export interface VenueProductsStoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  venueName: string;
  venueId?: string | number;
  eventDate?: string;
  isPostBooking?: boolean;
  hallBasePrice: number;
  periodName?: string;
  servicesList: VenueServiceItem[];
  selectedServices: string[];
  onToggleService: (serviceId: string) => void;
  productsList?: VenueProductItem[];
  selectedProducts: SelectedProductCart;
  onChangeProductQuantity: (productId: string, newQty: number) => void;
  onConfirmAndSave?: () => void;
}

export const DEFAULT_VENUE_PRODUCTS: VenueProductItem[] = [
  {
    id: 'prod-dinner-vip',
    name: 'صينية عشاء VIP (لحم حاشي ومندي فاخر مع مقبلات)',
    category: 'dinner',
    unit: 'صينية (تكفي 5 ضيوف)',
    price: 120,
    minQuantity: 1,
    maxQuantity: 50,
    stock: 45,
    description: 'إعاشة عشاء متكاملة تشمل الأرز، اللحم الطازج، السلطات، والمقبلات الحارة والباردة.',
    icon: '🍽️'
  },
  {
    id: 'prod-soft-drinks-30',
    name: 'كرتون مشروبات غازية متنوعة (30 علبة مبردة)',
    category: 'beverages',
    unit: 'كرتون (30 عبوة)',
    price: 40,
    minQuantity: 1,
    maxQuantity: 40,
    stock: 80,
    description: 'تشكيلة مبردة من المشروبات الغازية المتنوعة جاهزة للتقديم في الحفل.',
    icon: '🥤'
  },
  {
    id: 'prod-mineral-water-40',
    name: 'كرتون مياه شرب نقية مبردة (40 عبوة 330 مل)',
    category: 'beverages',
    unit: 'كرتون (40 عبوة)',
    price: 18,
    minQuantity: 1,
    maxQuantity: 50,
    stock: 150,
    description: 'مياه شرب نقية معبأة ومبردة مناسبة لضيافة قاعات الاحتفالات.',
    icon: '💧'
  },
  {
    id: 'prod-royal-dates-tray',
    name: 'صينية تمور ملكية محشوة بالمكسرات واللوز',
    category: 'hospitality',
    unit: 'صينية كريستال ضخمة VIP',
    price: 1500,
    minQuantity: 1,
    maxQuantity: 15,
    stock: 25,
    description: 'صينية فاخرة من التمور السكرية والمجدول المحشوة بالفستق والكاجو مع رشة هيل وزعفران.',
    icon: '🌴'
  },
  {
    id: 'prod-extra-table-round',
    name: 'طاولة دائرية إضافية مجهزة مع المفرش والسنتربيس',
    category: 'furniture',
    unit: 'طاولة',
    price: 60,
    minQuantity: 1,
    maxQuantity: 20,
    stock: 30,
    description: 'طاولة استقبال أو عشاء قطر 180 سم مع مفرش ساتان مطرز وتنسيق سنتربيس وردي أنيق.',
    icon: '🪑'
  },
  {
    id: 'prod-extra-chair-napoleon',
    name: 'كرسي نابليون / شيفاري فاخر مذهب',
    category: 'furniture',
    unit: 'كرسي',
    price: 12,
    minQuantity: 1,
    maxQuantity: 100,
    stock: 200,
    description: 'كرسي بتصميم ملكي فاخر مذهب مريح ومبطن بأعلى معايير الفخامة.',
    icon: '🪑'
  },
  {
    id: 'prod-saudi-coffee-thermos',
    name: 'دلة قهوة سعودية ملكية مع الهيل والزعفران',
    category: 'hospitality',
    unit: 'دلة VIP حراري',
    price: 45,
    minQuantity: 1,
    maxQuantity: 30,
    stock: 50,
    description: 'قهوة شقراء ممتازة معدة طازجة مع تمر خلاص فاخر وطحينة وحافظة حرارية أنيقة.',
    icon: '☕'
  },
  {
    id: 'prod-incense-burner-set',
    name: 'مبخرة ملكية فاخرة مع عود مروكي طبيعي فاخر',
    category: 'supplies',
    unit: 'طقم مبخرة كامل',
    price: 85,
    minQuantity: 1,
    maxQuantity: 20,
    stock: 35,
    description: 'طقم تبخير متكامل للصالات ومداخل الضيوف برائحة عود مروكي أصيلة تدوم طوال الحفل.',
    icon: '💨'
  }
];

export function VenueProductsStoreModal({
  isOpen,
  onClose,
  venueName,
  venueId,
  eventDate,
  isPostBooking,
  hallBasePrice = 15000,
  periodName = 'فترة مسائي',
  servicesList = [],
  selectedServices = [],
  onToggleService,
  productsList = DEFAULT_VENUE_PRODUCTS,
  selectedProducts = {},
  onChangeProductQuantity,
  onConfirmAndSave
}: VenueProductsStoreModalProps) {
  const [activeTab, setActiveTab] = useState<'products' | 'services' | 'financial'>('products');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Financial Calculations (15% VAT-Inclusive)
  const productsPrice = productsList.reduce((acc, item) => {
    const qty = selectedProducts[item.id] || 0;
    return acc + (qty * item.price);
  }, 0);

  const servicesPrice = servicesList
    .filter(s => selectedServices.includes(s.id))
    .reduce((acc, s) => acc + s.price, 0);

  const grandTotal = hallBasePrice + productsPrice + servicesPrice;
  const taxableAmount = Math.round((grandTotal / 1.15) * 100) / 100;
  const vatAmount = Math.round((grandTotal - taxableAmount) * 100) / 100;

  const totalSelectedProductsCount = Object.values(selectedProducts).reduce((a, b) => a + b, 0);
  const totalStoreOnlyPrice = productsPrice + servicesPrice;

  // Post-Booking Check & Deadlines
  const postBookingEligibility = useMemo(() => {
    if (!eventDate) {
      return { isAllowed: true, daysRemaining: 30, deadlineDays: 3, isPerishableProofRequired: true, formattedDeadlineDate: '' };
    }
    return checkBookingPostOrderEligibility(eventDate, venueId ? String(venueId) : undefined);
  }, [eventDate, venueId]);

  if (!isOpen) return null;

  const [dynamicCategories, setDynamicCategories] = useState<DynamicStoreCategory[]>(() => {
    return getStoredCategories();
  });

  useEffect(() => {
    const handleCategorySync = () => {
      setDynamicCategories(getStoredCategories());
    };
    window.addEventListener('storeCategoriesUpdated', handleCategorySync);
    window.addEventListener('storage', handleCategorySync);
    return () => {
      window.removeEventListener('storeCategoriesUpdated', handleCategorySync);
      window.removeEventListener('storage', handleCategorySync);
    };
  }, []);

  // Filter products by category
  const filteredProducts = productsList.filter(p => {
    if (selectedCategory === 'all') return true;
    return p.category === selectedCategory;
  });

  const categories = [
    { id: 'all', label: 'كافة المنتجات', icon: Package },
    ...dynamicCategories.map(c => ({
      id: c.key,
      label: c.label,
      icon: Tag
    }))
  ];

  const handleSaveAndClose = () => {
    if (onConfirmAndSave) {
      onConfirmAndSave();
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-sm animate-fadeIn">
      <div 
        className="bg-white rounded-3xl w-full max-w-6xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[94vh] sm:h-[90vh] max-h-[820px] text-slate-800 relative"
        dir="rtl"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 1. TOP MODAL HEADER (Fixed) */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white border-b border-slate-200/80 flex items-center justify-between gap-3 shrink-0">
          
          {/* Right Header Title & Venue Name */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 shadow-xs shrink-0">
              <Store className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg md:text-xl font-black text-slate-900 truncate">
                  متجر مستلزمات وإضافات المكان
                </h2>
                <span className="hidden sm:inline-flex bg-amber-50 text-amber-700 border border-amber-300 text-[11px] px-2.5 py-0.5 rounded-full font-bold shrink-0">
                  Venue Store & Add-ons
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-500 truncate font-medium">
                مستلزمات خاصة وحصرية بـ <strong className="text-slate-800 font-bold">{venueName}</strong>
              </p>
            </div>
          </div>

          {/* Left Badges & Close Button */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden md:flex bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs px-3 py-1 rounded-full font-bold items-center gap-1.5 shadow-2xs">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>شامل 15% ضريبة ZATCA</span>
            </div>
            
            <button
              onClick={onClose}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer"
              title="إغلاق النافذة"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. SUB-TABS NAVIGATION BAR (Fixed) */}
        <div className="px-4 sm:px-6 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 overflow-x-auto shrink-0 scrollbar-none">
          
          {/* Main Navigation Sub-Tabs */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={() => setActiveTab('products')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'products'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5 text-amber-400" />
              <span>مستلزمات المتجر ({productsList.length})</span>
              {totalSelectedProductsCount > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {totalSelectedProductsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('services')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'services'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>خدمات المكان ({servicesList.length})</span>
              {selectedServices.length > 0 && (
                <span className="bg-purple-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {selectedServices.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('financial')}
              className={`py-1.5 px-3 sm:px-4 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                activeTab === 'financial'
                  ? 'bg-slate-950 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
              }`}
            >
              <Tag className="w-3.5 h-3.5 text-emerald-500" />
              <span>التفكيك المالي</span>
            </button>
          </div>

          {/* Mini Store Cart Label */}
          <div className="flex items-center gap-1.5 shrink-0 text-xs">
            <span className="hidden sm:inline text-slate-500 font-bold">سلة المتجر:</span>
            <span className="font-black text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-xl whitespace-nowrap text-xs sm:text-sm">
              {totalStoreOnlyPrice.toLocaleString()} ر.س
            </span>
          </div>
        </div>

        {/* Post-Booking Status / Deadline Banner */}
        {eventDate && (
          <div className={`px-4 sm:px-6 py-2 border-b text-xs flex items-center justify-between gap-2 shrink-0 ${
            postBookingEligibility.isAllowed
              ? 'bg-emerald-50/90 border-emerald-200 text-emerald-950'
              : 'bg-rose-50/90 border-rose-200 text-rose-950'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base">{postBookingEligibility.isAllowed ? '🗓️' : '🔒'}</span>
              <span className="font-bold">
                {postBookingEligibility.isAllowed
                  ? `مستلزمات المتجر متاحة للطلب: يمكنك إضافة أو تعديل مستلزمات حتى ${postBookingEligibility.deadlineDays} أيام قبل موعد المناسبة.`
                  : postBookingEligibility.reason}
              </span>
            </div>
            {postBookingEligibility.isAllowed && postBookingEligibility.formattedDeadlineDate && (
              <span className="hidden md:inline-block font-mono font-black text-emerald-800 bg-emerald-100/70 border border-emerald-300 px-2 py-0.5 rounded-md text-[11px]">
                آخر موعد للطلب: {postBookingEligibility.formattedDeadlineDate}
              </span>
            )}
          </div>
        )}

        {/* 3. DEDICATED CATEGORY FILTER BAR (FIXED OUTSIDE PRODUCTS SCROLL CONTAINER) */}
        {activeTab === 'products' && (
          <div className="px-4 sm:px-6 py-2.5 bg-white border-b border-slate-200/90 flex items-center gap-2 overflow-x-auto shrink-0 shadow-2xs scrollbar-none">
            <span className="text-[11px] font-black text-slate-400 pl-1 shrink-0 hidden md:inline">
              تصنيف المنتجات:
            </span>
            {categories.map((cat) => {
              const isCatActive = selectedCategory === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`whitespace-nowrap px-3 sm:px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 cursor-pointer ${
                    isCatActive
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs ring-1 ring-amber-400'
                      : 'bg-slate-100/90 hover:bg-slate-200/80 text-slate-700 border border-slate-200/60'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* 4. MODAL BODY (TWO PANELS: SCROLLABLE MAIN CONTENT + FINANCIAL SIDEBAR) */}
        <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-0">
          
          {/* RIGHT / MAIN CONTENT AREA (8 Cols on Desktop) */}
          <div className="lg:col-span-8 p-3 sm:p-4 md:p-5 overflow-y-auto flex flex-col border-b lg:border-b-0 lg:border-l border-slate-200 bg-slate-50/40">
            
            {/* TAB 1: PRODUCTS STORE VIEW (4 Cards visible at a glance in 2x2 grid) */}
            {activeTab === 'products' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
                {filteredProducts.map((item) => {
                  const currentQty = selectedProducts[item.id] || 0;
                  const isSelected = currentQty > 0;
                  const itemTotal = currentQty * item.price;

                  return (
                    <div
                      key={item.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 bg-white ${
                        isSelected
                          ? 'border-amber-500 shadow-sm ring-1 ring-amber-400/40 bg-amber-50/10'
                          : 'border-slate-200 hover:border-slate-300 hover:shadow-2xs'
                      }`}
                    >
                      {/* Top Badges (Unit & Stock) */}
                      <div className="flex items-center justify-between gap-2">
                        <span className="bg-slate-100 text-slate-700 text-[11px] px-2 py-0.5 rounded-lg font-bold border border-slate-200 flex items-center gap-1">
                          <span>{item.icon}</span>
                          <span>{item.unit}</span>
                        </span>

                        {/* Stock Badge */}
                        <span className={`text-[10px] sm:text-[11px] px-2 py-0.5 rounded-lg font-bold border ${
                          item.stock > 10 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-rose-50 text-rose-700 border-rose-200'
                        }`}>
                          المخزون: {item.stock}
                        </span>
                      </div>

                      {/* Title and Description */}
                      <div>
                        <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                          {item.name}
                        </h4>
                        {item.description && (
                          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed line-clamp-2">
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Price & Quantity Controls */}
                      <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-slate-100">
                        
                        {/* Unit Price */}
                        <div>
                          <div className="text-sm sm:text-base font-black text-slate-900">
                            {item.price} <span className="text-[11px] font-medium text-slate-500">ر.س / {item.unit.split(' ')[0]}</span>
                          </div>
                          <span className="text-[9px] text-emerald-600 font-bold block">
                            شامل 15% ضريبة
                          </span>
                        </div>

                        {/* [-] Qty [+] Controller (Large Touch Targets >= 44px on Mobile) */}
                        <div className="flex items-center bg-slate-100 rounded-xl border border-slate-200 p-0.5 sm:p-1">
                          <button
                            type="button"
                            onClick={() => {
                              const newQty = Math.max(0, currentQty - 1);
                              onChangeProductQuantity(item.id, newQty);
                            }}
                            disabled={currentQty === 0}
                            className={`w-8 h-8 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center font-black transition-colors cursor-pointer ${
                              currentQty > 0
                                ? 'bg-white hover:bg-rose-500 hover:text-white text-slate-700 shadow-2xs'
                                : 'text-slate-300 cursor-not-allowed'
                            }`}
                            title="إنقاص الكمية"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>

                          <span className="w-8 sm:w-7 text-center font-black text-xs sm:text-sm text-slate-900">
                            {currentQty}
                          </span>

                          <button
                            type="button"
                            onClick={() => {
                              const nextQty = currentQty === 0 ? item.minQuantity : currentQty + 1;
                              const cappedQty = Math.min(item.stock, item.maxQuantity || item.stock, nextQty);
                              onChangeProductQuantity(item.id, cappedQty);
                            }}
                            disabled={currentQty >= item.stock}
                            className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center font-black transition-colors shadow-2xs cursor-pointer"
                            title="زيادة الكمية"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Subtotal Line */}
                      <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">
                          {isSelected 
                            ? `المجموع (${currentQty} × ${item.price}):` 
                            : 'المجموع للبند:'
                          }
                        </span>
                        <span className={`font-black ${isSelected ? 'text-amber-600' : 'text-slate-400'}`}>
                          {itemTotal.toLocaleString()} ر.س
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: EXTRA SERVICES VIEW */}
            {activeTab === 'services' && (
              <div className="space-y-3.5">
                <div className="bg-purple-50 border border-purple-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-purple-900">
                  <Sparkles className="w-5 h-5 text-purple-600 shrink-0" />
                  <span>
                    الخدمات الإضافية المجهزة من كادر مزود القاعة مباشرة، وتُضاف لتفاصيل الحجز والعقد الرسمي.
                  </span>
                </div>

                {servicesList.length === 0 ? (
                  <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-xs">
                    لا توجد خدمات مساندة إضافية محددة حالياً لهذه القاعة.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {servicesList.map((srv) => {
                      const isChecked = selectedServices.includes(srv.id);

                      return (
                        <div
                          key={srv.id}
                          onClick={() => onToggleService(srv.id)}
                          className={`p-3.5 sm:p-4 rounded-2xl border cursor-pointer transition-all flex items-start justify-between gap-3 bg-white ${
                            isChecked
                              ? 'border-purple-500 ring-1 ring-purple-400 shadow-xs bg-purple-50/30'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                              isChecked ? 'bg-purple-600 text-white font-black' : 'border border-slate-300 text-transparent'
                            }`}>
                              <Check className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="text-xs sm:text-sm font-black text-slate-900">{srv.name}</h4>
                              {srv.desc && (
                                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                  {srv.desc}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="text-left shrink-0">
                            <div className="text-sm sm:text-base font-black text-slate-900">
                              {srv.price.toLocaleString()} <span className="text-[11px] font-normal text-slate-500">ر.س</span>
                            </div>
                            <span className="text-[9px] text-emerald-600 block font-bold">شامل 15% VAT</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: FINANCIAL BREAKDOWN VIEW */}
            {activeTab === 'financial' && (
              <div className="space-y-3.5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center gap-3 text-xs text-emerald-900">
                  <Calculator className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    الامتثال الكامل لمتطلبات هيئة الزكاة والضريبة والجمارك (ZATCA) بالأسعار الشاملة لضريبة القيمة المضافة.
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 space-y-3 text-xs sm:text-sm shadow-2xs">
                  <h4 className="font-black text-slate-900 border-b border-slate-200 pb-2">
                    جدول التفكيك المحاسبي للحجز والمنتجات
                  </h4>

                  <div className="flex justify-between text-slate-600">
                    <span>إيجار القاعة ({periodName}):</span>
                    <span className="font-bold text-slate-900">{hallBasePrice.toLocaleString()} ر.س</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>إجمالي منتجات المتجر ({totalSelectedProductsCount} صنف):</span>
                    <span className="font-bold text-slate-900">{productsPrice.toLocaleString()} ر.س</span>
                  </div>

                  <div className="flex justify-between text-slate-600">
                    <span>إجمالي الخدمات المساندة ({selectedServices.length} خدمة):</span>
                    <span className="font-bold text-slate-900">{servicesPrice.toLocaleString()} ر.س</span>
                  </div>

                  <div className="pt-3 border-t border-slate-200 space-y-2">
                    <div className="flex justify-between text-slate-600">
                      <span>الوعاء الخاضع للضريبة (قبل 15% VAT):</span>
                      <span className="font-bold">{taxableAmount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between text-slate-600">
                      <span>ضريبة القيمة المضافة (15%):</span>
                      <span className="font-bold text-emerald-600">{vatAmount.toLocaleString()} ر.س</span>
                    </div>
                    <div className="flex justify-between text-sm sm:text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                      <span>الإجمالي النهائي المستحق:</span>
                      <span className="text-amber-600">{grandTotal.toLocaleString()} ر.س</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* LEFT / STICKY FINANCIAL SUMMARY SIDEBAR (4 Cols on Desktop) */}
          <div className="lg:col-span-4 p-4 sm:p-5 bg-slate-50 flex flex-col justify-between gap-4 overflow-y-auto border-t lg:border-t-0 border-slate-200">
            
            <div className="space-y-3.5">
              
              {/* Sidebar Header */}
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <Tag className="w-4 h-4 text-amber-500" />
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                    تفاصيل وقيمة الحجز
                  </h3>
                </div>
                <span className="bg-slate-200 text-slate-700 text-[11px] px-2 py-0.5 rounded-md font-bold">
                  {periodName}
                </span>
              </div>

              {/* Line Items List */}
              <div className="space-y-2 text-xs max-h-44 sm:max-h-52 overflow-y-auto pr-1">
                
                {/* Hall Rent Base */}
                <div className="flex items-center justify-between font-bold text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>إيجار القاعة ({periodName})</span>
                  </div>
                  <span>{hallBasePrice.toLocaleString()} ر.س</span>
                </div>

                {/* Selected Products Items */}
                {Object.entries(selectedProducts).map(([prodId, qty]) => {
                  if (qty <= 0) return null;
                  const p = productsList.find(item => item.id === prodId);
                  if (!p) return null;

                  return (
                    <div key={prodId} className="flex items-center justify-between text-slate-700 font-medium text-[11px]">
                      <div className="flex items-center gap-1.5 truncate pr-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                        <span className="truncate">{p.name} ({qty})</span>
                      </div>
                      <span className="font-bold shrink-0 text-slate-900">{(qty * p.price).toLocaleString()} ر.س</span>
                    </div>
                  );
                })}

                {/* Selected Services Items */}
                {selectedServices.map(srvId => {
                  const s = servicesList.find(item => item.id === srvId);
                  if (!s) return null;

                  return (
                    <div key={srvId} className="flex items-center justify-between text-purple-800 font-medium text-[11px]">
                      <div className="flex items-center gap-1.5 truncate pr-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500 shrink-0"></span>
                        <span className="truncate">{s.name}</span>
                      </div>
                      <span className="font-bold shrink-0">{s.price.toLocaleString()} ر.س</span>
                    </div>
                  );
                })}

              </div>

              {/* Tax Breakdown Container */}
              <div className="bg-white rounded-2xl p-3.5 border border-slate-200 shadow-2xs space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>المجموع قبل الضريبة:</span>
                  <span className="font-bold text-slate-700">{taxableAmount.toLocaleString()} ر.س</span>
                </div>

                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>ضريبة القيمة المضافة (15%):</span>
                  <span className="font-bold text-slate-700">{vatAmount.toLocaleString()} ر.س</span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-black text-slate-900 text-xs sm:text-sm">الإجمالي شامل الضريبة:</span>
                  <span className="font-black text-amber-600 text-base sm:text-lg">
                    {grandTotal.toLocaleString()} <span className="text-xs font-normal">ر.س</span>
                  </span>
                </div>
              </div>

            </div>

            {/* Bottom Actions Buttons */}
            <div className="space-y-2 pt-2 border-t border-slate-200 shrink-0">
              <button
                type="button"
                onClick={handleSaveAndClose}
                className="w-full py-3 sm:py-3.5 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-2xl shadow-md hover:shadow-lg transition-all text-xs sm:text-sm flex items-center justify-center gap-2 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>حفظ واعتماد الحساب ({grandTotal.toLocaleString()} ر.س)</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-1.5 text-center text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
              >
                إغلاق النافذة
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
