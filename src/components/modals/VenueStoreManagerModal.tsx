import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Store, ShoppingBag, Plus, Sparkles, Search, Filter, 
  Eye, EyeOff, Edit, Trash2, Check, Package, Utensils, 
  Wine, Armchair, Users, Flame, Info, ChevronDown, 
  Layers, AlertTriangle, ShieldCheck, Tag, ArrowRight,
  Boxes, RefreshCw, Upload, Image as ImageIcon, CheckCircle2,
  Clock, Lock
} from 'lucide-react';
import { entitlementService, EntitlementResolution } from '../../services/entitlementService';
import {
  DynamicStoreCategory,
  getStoredCategories,
  POST_BOOKING_DEADLINE_OPTIONS,
  getSovereignPostBookingConfig,
  getProviderVenuePostBookingSettings,
  saveProviderVenuePostBookingSetting,
  ProviderVenuePostBookingSetting
} from '../../data/storeCategoriesConfig';

export interface StoreProductItem {
  id: string;
  hallId?: string | number;
  name: string;
  category: string;
  unit: string;
  price: number; // شامل الضريبة 15%
  costPrice?: number;
  stock: number;
  minQuantity: number;
  maxQuantity: number;
  description: string;
  image?: string;
  sku?: string;
  status: 'active' | 'paused' | 'low_stock';
  periods: ('morning' | 'night' | 'fullday')[];
  itemType: 'consumable' | 'asset'; // مستهلكات أو أصول وتجهيزات
}

interface VenueStoreManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  hall: any;
  onSaveProducts?: (hallId: string | number, products: StoreProductItem[]) => void;
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

const DEFAULT_HALL_PRODUCTS: StoreProductItem[] = [
  {
    id: 'prod-dinner-vip',
    name: 'صينية عشاء VIP (لحم حاشي ومندي فاخر مع مقبلات)',
    category: 'hospitality',
    unit: 'صينية (تكفي 5 ضيوف)',
    price: 120,
    costPrice: 85,
    stock: 45,
    minQuantity: 1,
    maxQuantity: 50,
    description: 'إعاشة عشاء متكاملة تشمل الأرز، اللحم الطازج، السلطات، والمقبلات الحارة والباردة.',
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
    sku: 'DIN-VIP-01',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'consumable'
  },
  {
    id: 'prod-drinks-carton',
    name: 'كرتون مشروبات غازية مشكلة (30 عبوة باردة)',
    category: 'beverages',
    unit: 'كرتون (30 عبوة)',
    price: 65,
    costPrice: 42,
    stock: 200,
    minQuantity: 1,
    maxQuantity: 100,
    description: 'تشكيلة متنوعة من المشروبات الغازية المبردة (بيبسي، سفن آب، ميرندا، كولا).',
    image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=500&auto=format&fit=crop&q=60',
    sku: 'BEV-SODA-30',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'consumable'
  },
  {
    id: 'prod-water-carton',
    name: 'كرتون مياه شرب نقية مبردة (40 عبوة 200 مل)',
    category: 'beverages',
    unit: 'كرتون (40 عبوة)',
    price: 25,
    costPrice: 15,
    stock: 350,
    minQuantity: 2,
    maxQuantity: 200,
    description: 'مياه شرب وطنية معبأة ومبردة عالية الجودة في عبوات صغيرة ملائمة للضيافة.',
    image: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=500&auto=format&fit=crop&q=60',
    sku: 'BEV-WTR-40',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'consumable'
  },
  {
    id: 'prod-dates-tray',
    name: 'صينية تمور ملكية فاخرة (سكري القصيم مفتل مع الطحينة)',
    category: 'hospitality',
    unit: 'صينية (3 كجم)',
    price: 90,
    costPrice: 55,
    stock: 60,
    minQuantity: 1,
    maxQuantity: 30,
    description: 'تمور سكري فاخرة منتقاة بعناية تقدم مع صوص الطحينة السمسم ودبس التمر الفاخر.',
    image: 'https://images.unsplash.com/photo-1596704017254-9b121068fb31?w=500&auto=format&fit=crop&q=60',
    sku: 'HSP-DATE-01',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'consumable'
  },
  {
    id: 'prod-extra-table',
    name: 'طاولة دائرية إضافية مجهزة بمفرش ساتان و10 كراسي',
    category: 'furniture',
    unit: 'طقم طاولة + 10 كراسي',
    price: 150,
    costPrice: 40,
    stock: 25,
    minQuantity: 1,
    maxQuantity: 15,
    description: 'طاولة ضيافة دائرية قطر 180 سم مغطاة بمفرش قماش فاخر مع 10 كراسي مبطنة ومريحة.',
    image: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=500&auto=format&fit=crop&q=60',
    sku: 'FURN-TBL-10',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'asset'
  },
  {
    id: 'prod-napoleon-chairs',
    name: 'طقم كراسي نابليون كريستال شفافة (10 كراسي VIP)',
    category: 'furniture',
    unit: 'طقم (10 كراسي)',
    price: 180,
    costPrice: 50,
    stock: 40,
    minQuantity: 1,
    maxQuantity: 20,
    description: 'كراسي نابليون كريستال ذات تصميم أرستقراطي حديث ومقاوم للخدش لإضفاء لمسة فخامة.',
    image: 'https://images.unsplash.com/photo-1506898667547-42e22a46e125?w=500&auto=format&fit=crop&q=60',
    sku: 'FURN-CHR-10',
    status: 'active',
    periods: ['night', 'fullday'],
    itemType: 'asset'
  },
  {
    id: 'prod-coffee-dallah',
    name: 'دلة قهوة سعودية بالهيل والزعفران مع طقم فناجين مذهب',
    category: 'hospitality',
    unit: 'دلة كبيرة (تكفي 20 فنجان)',
    price: 45,
    costPrice: 20,
    stock: 80,
    minQuantity: 1,
    maxQuantity: 40,
    description: 'قهوة شقراء ممتازة محوجة بالهيل الطبيعي والزعفران السوبر نقيل تقدم ساخنة.',
    image: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=500&auto=format&fit=crop&q=60',
    sku: 'HSP-COF-01',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'consumable'
  },
  {
    id: 'prod-oud-burner',
    name: 'طقم مبخرة ملكية مع عود مروكي طبيعي محسن ومسكن للضيوف',
    category: 'perfumes',
    unit: 'طقم ضيافة وتبخير',
    price: 220,
    costPrice: 120,
    stock: 15,
    minQuantity: 1,
    maxQuantity: 5,
    description: 'استقبال ضيوف فندقي بتبخير القاعة بدهن العود المروكي الفاخر ورش المرشات العطرية.',
    image: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=500&auto=format&fit=crop&q=60',
    sku: 'PRF-OUD-01',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'consumable'
  }
];

export function VenueStoreManagerModal({
  isOpen,
  onClose,
  hall,
  onSaveProducts,
  showNotification
}: VenueStoreManagerModalProps) {
  // Storage key based on hall id
  const storageKey = useMemo(() => `hall_store_products_${hall?.id || 'default'}`, [hall?.id]);

  // Provider identifier & Entitlement
  const providerKey = useMemo(() => {
    return hall?.providerId || hall?.providerName || hall?.provider || 'provider';
  }, [hall]);

  const [entitlement, setEntitlement] = useState<EntitlementResolution>(() => 
    entitlementService.resolve(providerKey, 'mini_products_store')
  );

  useEffect(() => {
    const check = () => {
      const res = entitlementService.resolve(providerKey, 'mini_products_store');
      setEntitlement(res);
    };
    check();
    window.addEventListener('entitlementUpdated', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('entitlementUpdated', check);
      window.removeEventListener('storage', check);
    };
  }, [providerKey]);

  const handleInstantActivateStoreAddon = () => {
    const success = entitlementService.activateAddon(providerKey, 'mini_products_store', {
      fee: 120,
      period: 'monthly',
      activationDate: new Date().toISOString()
    });
    if (success) {
      if (showNotification) showNotification('success', 'تم تفعيل ميزة متجر المنتجات والمستلزمات المصغر بنجاح كإضافة مستقلة (120 ر.س/شهر)!');
    }
  };

  // Load products from localStorage or hall.productsList or defaults
  const [products, setProducts] = useState<StoreProductItem[]>(() => {
    if (!hall) return DEFAULT_HALL_PRODUCTS;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.error('Error parsing stored products', e);
      }
    }
    if (hall.productsList && Array.isArray(hall.productsList) && hall.productsList.length > 0) {
      return hall.productsList;
    }
    return DEFAULT_HALL_PRODUCTS.map(p => ({ ...p, hallId: hall.id }));
  });

  // Re-sync when hall changes
  useEffect(() => {
    if (hall) {
      const stored = localStorage.getItem(`hall_store_products_${hall.id}`);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setProducts(parsed);
            return;
          }
        } catch (e) {}
      }
      if (hall.productsList && Array.isArray(hall.productsList) && hall.productsList.length > 0) {
        setProducts(hall.productsList);
      } else {
        setProducts(DEFAULT_HALL_PRODUCTS.map(p => ({ ...p, hallId: hall.id })));
      }
    }
  }, [hall?.id, storageKey]);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Dynamic Store Categories
  const [dynamicCategories, setDynamicCategories] = useState<DynamicStoreCategory[]>(() => {
    return getStoredCategories();
  });

  // Post-Booking Venue Settings & Sovereign Status
  const [sovereignConfig, setSovereignConfig] = useState(() => getSovereignPostBookingConfig());
  const [venuePostBookingSetting, setVenuePostBookingSetting] = useState<ProviderVenuePostBookingSetting>(() => {
    const venueIdStr = String(hall?.id || 'default');
    const all = getProviderVenuePostBookingSettings();
    return all[venueIdStr] || {
      venueId: venueIdStr,
      enabled: true,
      deadlineDays: 3,
      autoCloseOnDeadline: true,
      proofRequiredForPerishableRefund: true
    };
  });

  const [showSettingsDrawer, setShowSettingsDrawer] = useState(false);

  useEffect(() => {
    const handleCategorySync = () => {
      setDynamicCategories(getStoredCategories());
      setSovereignConfig(getSovereignPostBookingConfig());
      const venueIdStr = String(hall?.id || 'default');
      const all = getProviderVenuePostBookingSettings();
      if (all[venueIdStr]) {
        setVenuePostBookingSetting(all[venueIdStr]);
      }
    };
    window.addEventListener('storeCategoriesUpdated', handleCategorySync);
    window.addEventListener('postBookingConfigUpdated', handleCategorySync);
    window.addEventListener('storage', handleCategorySync);
    return () => {
      window.removeEventListener('storeCategoriesUpdated', handleCategorySync);
      window.removeEventListener('postBookingConfigUpdated', handleCategorySync);
      window.removeEventListener('storage', handleCategorySync);
    };
  }, [hall?.id]);

  const handleUpdateVenuePostBooking = (updates: Partial<ProviderVenuePostBookingSetting>) => {
    const updated = { ...venuePostBookingSetting, ...updates };
    setVenuePostBookingSetting(updated);
    saveProviderVenuePostBookingSetting(updated);
    if (showNotification) {
      showNotification('success', 'تم حفظ إعدادات ومهلة الطلبات اللاحقة لهذا المكان بنجاح');
    }
  };

  // Add / Edit Product Modal state
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<StoreProductItem>>({
    name: '',
    category: 'hospitality',
    unit: 'صينية (تكفي 5 ضيوف)',
    price: 100,
    costPrice: 60,
    stock: 50,
    minQuantity: 1,
    maxQuantity: 50,
    description: '',
    image: '',
    sku: '',
    status: 'active',
    periods: ['morning', 'night', 'fullday'],
    itemType: 'consumable'
  });

  // Persist products
  const handleSaveAll = (updatedProducts: StoreProductItem[]) => {
    setProducts(updatedProducts);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updatedProducts));
      if (onSaveProducts && hall?.id) {
        onSaveProducts(hall.id, updatedProducts);
      }
    } catch (e) {
      console.error('Failed to persist products', e);
    }
  };

  // Toggle status (Active / Paused)
  const handleToggleStatus = (prodId: string) => {
    if (!entitlement.isEntitled) {
      if (showNotification) showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لتعديل حالة المنتجات.');
      return;
    }
    const updated = products.map(p => {
      if (p.id === prodId) {
        const nextStatus: 'active' | 'paused' = p.status === 'active' ? 'paused' : 'active';
        return { ...p, status: nextStatus };
      }
      return p;
    });
    handleSaveAll(updated);
    if (showNotification) {
      showNotification('info', 'تم تحديث حالة ظهور المنتج بنجاح.');
    }
  };

  // Delete product
  const handleDeleteProduct = (prodId: string) => {
    if (!entitlement.isEntitled) {
      if (showNotification) showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لحذف المنتجات.');
      return;
    }
    const updated = products.filter(p => p.id !== prodId);
    handleSaveAll(updated);
    if (showNotification) {
      showNotification('success', 'تم حذف المنتج من متجر القاعة بنجاح.');
    }
  };

  // Open Edit Form
  const handleOpenEdit = (prod: StoreProductItem) => {
    if (!entitlement.isEntitled) {
      if (showNotification) showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لتعديل المنتجات.');
      return;
    }
    setEditingProductId(prod.id);
    setFormData({ ...prod });
    setIsProductFormOpen(true);
  };

  // Open Create Form
  const handleOpenCreate = () => {
    if (!entitlement.isEntitled) {
      if (showNotification) showNotification('warning', 'يرجى تفعيل ميزة متجر المنتجات والمستلزمات المصغر لإضافة منتجات جديدة.');
      return;
    }
    setEditingProductId(null);
    setFormData({
      name: '',
      category: 'hospitality',
      unit: 'حبة',
      price: 50,
      costPrice: 30,
      stock: 20,
      minQuantity: 1,
      maxQuantity: 20,
      description: '',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
      sku: `SKU-${Date.now().toString().slice(-4)}`,
      status: 'active',
      periods: ['morning', 'night', 'fullday'],
      itemType: 'consumable'
    });
    setIsProductFormOpen(true);
  };

  // Save product from form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entitlement.isEntitled) {
      if (showNotification) showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لحفظ التغييرات.');
      return;
    }
    if (!formData.name?.trim()) {
      if (showNotification) showNotification('error', 'يرجى كتابة اسم المنتج أو المستلزم.');
      return;
    }

    if (editingProductId) {
      // Update
      const updated = products.map(p => {
        if (p.id === editingProductId) {
          return {
            ...p,
            ...formData,
            price: Number(formData.price || 0),
            costPrice: Number(formData.costPrice || 0),
            stock: Number(formData.stock || 0),
            minQuantity: Number(formData.minQuantity || 1),
            maxQuantity: Number(formData.maxQuantity || 50)
          } as StoreProductItem;
        }
        return p;
      });
      handleSaveAll(updated);
      if (showNotification) showNotification('success', 'تم تحديث بيانات المنتج بنجاح.');
    } else {
      // Create new
      const newProd: StoreProductItem = {
        id: `prod_${Date.now()}`,
        hallId: hall?.id,
        name: formData.name.trim(),
        category: formData.category || 'hospitality',
        unit: formData.unit || 'حبة',
        price: Number(formData.price || 0),
        costPrice: Number(formData.costPrice || 0),
        stock: Number(formData.stock || 0),
        minQuantity: Number(formData.minQuantity || 1),
        maxQuantity: Number(formData.maxQuantity || 50),
        description: formData.description || '',
        image: formData.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?w=500&auto=format&fit=crop&q=60',
        sku: formData.sku || `SKU-${Date.now().toString().slice(-4)}`,
        status: (formData.status as any) || 'active',
        periods: formData.periods && formData.periods.length > 0 ? formData.periods : ['morning', 'night', 'fullday'],
        itemType: formData.itemType || 'consumable'
      };
      handleSaveAll([newProd, ...products]);
      if (showNotification) showNotification('success', 'تم إضافة المنتج الجديد إلى متجر القاعة بنجاح.');
    }

    setIsProductFormOpen(false);
  };

  // Load Preset Templates
  const handleLoadPresets = () => {
    if (!entitlement.isEntitled) {
      if (showNotification) showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لاستيراد القوالب.');
      return;
    }
    const freshDefaults = DEFAULT_HALL_PRODUCTS.map(p => ({ ...p, hallId: hall?.id, id: `prod_${Math.random().toString(36).substr(2, 9)}` }));
    handleSaveAll(freshDefaults);
    if (showNotification) showNotification('success', 'تم استيراد قوالب مستلزمات الضيافة القياسية بنجاح.');
  };

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Category filter
      if (selectedCategory !== 'all') {
        if (selectedCategory === 'beverages' && p.category !== 'beverages') return false;
        if (selectedCategory === 'hospitality' && p.category !== 'hospitality') return false;
        if (selectedCategory === 'furniture' && p.category !== 'furniture') return false;
        if (selectedCategory === 'logistics' && p.category !== 'logistics') return false;
        if (selectedCategory === 'perfumes' && p.category !== 'perfumes') return false;
        if (selectedCategory === 'general' && p.category !== 'general') return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && p.status !== 'active') return false;
        if (statusFilter === 'paused' && p.status !== 'paused') return false;
        if (statusFilter === 'low_stock' && p.stock > 10) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchDesc) return false;
      }
      return true;
    });
  }, [products, selectedCategory, statusFilter, searchQuery]);

  // Statistics
  const activeCount = useMemo(() => products.filter(p => p.status === 'active').length, [products]);
  const totalStockCount = useMemo(() => products.reduce((acc, p) => acc + (p.stock || 0), 0), [products]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/75 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200">
      <div 
        dir="rtl"
        className="bg-white rounded-3xl shadow-2xl border border-slate-200/80 w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] relative text-right font-sans"
      >
        {/* Modal Header with Amber Gradient */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 px-5 sm:px-7 py-4 sm:py-5 flex items-center justify-between text-white relative shrink-0 shadow-md">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-2xl bg-black/35 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shadow-inner">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white drop-shadow-xs">
                  إدارة متجر المستلزمات والمنتجات المصغر
                </h3>
                <span className="px-3 py-0.5 rounded-full text-xs font-black bg-black/40 text-amber-300 border border-white/15 backdrop-blur-xs">
                  {hall?.name || 'قاعة غير محددة'}
                </span>
              </div>
              <p className="text-xs sm:text-[13px] text-amber-100/90 font-medium mt-0.5">
                إضافة وتخصيص مستلزمات الضيافة، المشروبات، الأثاث، والمخزون المعروضة للعملاء أثناء حجز هذه القاعة
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white/15 hover:bg-white/25 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 active:scale-95"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Entitlement Banner */}
        <div className={`px-5 py-3 border-b flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs shrink-0 ${
          entitlement.isEntitled
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg shrink-0 ${entitlement.isEntitled ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950'}`}>
              {entitlement.isEntitled ? <ShieldCheck className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-xs">
                  {entitlement.isEntitled 
                    ? 'الميزة مفعلة رسمياً' 
                    : 'ميزة متجر المنتجات والمستلزمات المصغر غير مفعلة في اشتراك هذا المزود'}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  entitlement.isEntitled 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-200 text-amber-900 border border-amber-300'
                }`}>
                  {entitlement.isEntitled 
                    ? (entitlement.source === 'plan' ? `باقة: ${entitlement.planName || 'الاحترافية'}` : entitlement.source === 'admin_grant' ? 'منح إداري' : 'إضافة نشطة')
                    : 'إضافة تجارية مدفوعة (120 ر.س/شهر)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 mt-0.5">
                {entitlement.isEntitled
                  ? 'المنتجات والمستلزمات المعروضة مرتبطة بالمخزون وتظهر للعميل في واجهة الحجز مع احتساب ضريبة 15%.'
                  : 'تفعيل الميزة يتيح إضافة منتجات جديدة، تعديل الأسعار، وإدارة المخزون المعروض لحجوزات القاعة.'}
              </p>
            </div>
          </div>

          {!entitlement.isEntitled && (
            <button
              type="button"
              onClick={handleInstantActivateStoreAddon}
              className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-600/30 whitespace-nowrap self-end sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>تفعيل الميزة الآن</span>
            </button>
          )}
        </div>

        {/* Top KPI Cards Row */}
        <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200/80 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 shrink-0">
          {/* Card 1: Total Products */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">إجمالي المنتجات</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900 font-mono">{products.length}</span>
              <span className="text-xs font-bold text-slate-400">مستلزم</span>
            </div>
          </div>

          {/* Card 2: Active for customers */}
          <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">المنتجات النشطة للعملاء</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-xl sm:text-2xl font-black text-emerald-600 font-mono">{activeCount}</span>
              <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                متاح للشراء
              </span>
            </div>
          </div>

          {/* Card 3: Post-Booking Deadline Settings Card */}
          <div 
            onClick={() => setShowSettingsDrawer(true)}
            className="bg-white p-3.5 sm:p-4 rounded-2xl border border-amber-200/90 hover:border-amber-400 shadow-2xs flex flex-col justify-between cursor-pointer group transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>الطلبات اللاحقة والمهلة</span>
              </span>
              <span className="text-[10px] font-black text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded group-hover:bg-amber-100 transition-colors">
                تعديل ⚙️
              </span>
            </div>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-sm sm:text-base font-black text-amber-900">
                {venuePostBookingSetting.enabled ? `${venuePostBookingSetting.deadlineDays} أيام قبل الحفل` : 'موقوفة'}
              </span>
              <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-full ${
                venuePostBookingSetting.enabled && sovereignConfig.enabled 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {sovereignConfig.enabled ? (venuePostBookingSetting.enabled ? 'مفعل' : 'مغلق') : 'معطل سيادياً'}
              </span>
            </div>
          </div>

          {/* Card 4: Main Action Buttons */}
          <div className="flex items-center gap-2 col-span-2 lg:col-span-1 justify-end">
            <button
              type="button"
              onClick={handleOpenCreate}
              className={`flex-1 font-black text-xs sm:text-sm px-3.5 py-3 rounded-2xl transition-all shadow-sm flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 border ${
                entitlement.isEntitled
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-400'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700 border-slate-300'
              }`}
              title={entitlement.isEntitled ? 'إضافة منتج جديد' : 'ميزة مقفلة - انقر للتفعيل'}
            >
              {entitlement.isEntitled ? <Plus className="w-4 h-4" /> : <Lock className="w-3.5 h-3.5 text-amber-700" />}
              <span>{entitlement.isEntitled ? '+ إضافة منتج جديد' : 'إضافة منتج (مغلق 🔒)'}</span>
            </button>
            <button
              type="button"
              onClick={handleLoadPresets}
              className={`font-black text-xs px-3 py-3 rounded-2xl transition-all shadow-2xs flex items-center justify-center gap-1 cursor-pointer active:scale-95 shrink-0 border ${
                entitlement.isEntitled
                  ? 'bg-white hover:bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-500 border-slate-200'
              }`}
              title={entitlement.isEntitled ? 'استيراد التشكيلة القياسية المقترحة' : 'ميزة مقفلة - انقر للتفعيل'}
            >
              {entitlement.isEntitled ? <Sparkles className="w-3.5 h-3.5 text-amber-600" /> : <Lock className="w-3 h-3 text-slate-400" />}
              <span className="hidden sm:inline">✨ قوالب جاهزة</span>
            </button>
          </div>
        </div>

        {/* Search & Categories Bar */}
        <div className="p-4 sm:p-5 bg-white border-b border-slate-150 space-y-3.5 shrink-0">
          {/* Search Input and Status Filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="🔍 البحث بالاسم، رمز SKU، أو الوصف..."
                className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-xs font-bold text-slate-800 placeholder:text-slate-400 transition-all bg-slate-50/40 focus:bg-white"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  مسح
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none bg-white focus:border-amber-500 cursor-pointer"
              >
                <option value="all">كل الحالات ({products.length})</option>
                <option value="active">نشط ومعروض ({activeCount})</option>
                <option value="paused">موقوف مؤقتاً ({products.length - activeCount})</option>
                <option value="low_stock">منخفض المخزون (أقل من 10)</option>
              </select>
            </div>
          </div>

          {/* Categories Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold select-none">
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
              }`}
            >
              <Layers className={`w-3.5 h-3.5 ${selectedCategory === 'all' ? 'text-slate-950' : 'text-slate-500'}`} />
              <span>كافة الأصناف</span>
            </button>

            {dynamicCategories.map(cat => {
              const isSelected = selectedCategory === cat.key;
              return (
                <button
                  key={cat.key}
                  type="button"
                  onClick={() => setSelectedCategory(cat.key)}
                  className={`px-4 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                      : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
                  }`}
                >
                  <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-slate-950' : 'text-slate-500'}`} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Product Cards Grid Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/50">
          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center max-w-md mx-auto my-8 space-y-4">
              <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-3xl flex items-center justify-center mx-auto border border-amber-200">
                <Store className="w-8 h-8" />
              </div>
              <div>
                <h4 className="text-base font-extrabold text-slate-800">لا توجد منتجات مطابقة لخيارات البحث</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  يمكنك إضافة منتج جديد أو استيراد القوالب القياسية المعتمدة لمستلزمات الضيافة.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleOpenCreate}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-xs cursor-pointer"
                >
                  + إضافة منتج جديد
                </button>
                <button
                  type="button"
                  onClick={handleLoadPresets}
                  className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  استيراد القوالب
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProducts.map((prod) => {
                const isActive = prod.status === 'active';
                return (
                  <div
                    key={prod.id}
                    className={`bg-white rounded-2xl border p-4.5 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${
                      isActive ? 'border-slate-200/90' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
                    }`}
                  >
                    <div>
                      {/* Top status & thumbnail row */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {isActive ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                نشط ومعروض
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                موقوف مؤقتاً
                              </span>
                            )}

                            {prod.itemType === 'asset' ? (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                                أصل وتجهيزات 🪑
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                                مستهلكات وضيافة ☕
                              </span>
                            )}

                            {prod.sku && (
                              <span className="text-[10px] font-mono text-slate-400">
                                #{prod.sku}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
                            {prod.name}
                          </h4>
                          {prod.description && (
                            <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                              {prod.description}
                            </p>
                          )}
                        </div>

                        {/* Thumbnail */}
                        {prod.image ? (
                          <img
                            src={prod.image}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border border-slate-150 shrink-0 shadow-2xs"
                          />
                        ) : (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 shrink-0">
                            <Store className="w-7 h-7" />
                          </div>
                        )}
                      </div>

                      {/* Specs & Stock Badges Row */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-3.5 text-[11px] font-bold">
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60">
                          الوحدة: {prod.unit}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg border font-mono ${
                          prod.stock <= 10 
                            ? 'bg-rose-50 text-rose-800 border-rose-200 font-extrabold' 
                            : 'bg-amber-100/70 text-amber-900 border-amber-300/80 font-extrabold'
                        }`}>
                          المخزون: {prod.stock}
                        </span>
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200/60 font-mono">
                          الطلب: {prod.minQuantity} - {prod.maxQuantity}
                        </span>
                      </div>

                      {/* Periods Row */}
                      <div className="flex items-center gap-1.5 mt-2.5 text-[10px] font-bold text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>الفترات:</span>
                        <div className="flex items-center gap-1 flex-wrap">
                          {prod.periods.includes('morning') && (
                            <span className="bg-amber-50 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">صباحية</span>
                          )}
                          {prod.periods.includes('night') && (
                            <span className="bg-purple-50 text-purple-800 px-1.5 py-0.5 rounded border border-purple-200">مسائية</span>
                          )}
                          {prod.periods.includes('fullday') && (
                            <span className="bg-blue-50 text-blue-800 px-1.5 py-0.5 rounded border border-blue-200">يوم كامل</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Card Footer */}
                    <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                      {/* Price display with 15% VAT tag */}
                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-lg sm:text-xl font-black text-slate-900 font-mono">
                            {prod.price}
                          </span>
                          <span className="text-xs font-bold text-slate-700">ر.س</span>
                        </div>
                        <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                          (شامل الضريبة 15%)
                        </span>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(prod.id)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                          }`}
                          title={isActive ? 'إيقاف الظهور مؤقتاً' : 'تفعيل وإظهار للعملاء'}
                        >
                          {isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(prod)}
                          className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                          title="تعديل بيانات المنتج"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                          title="حذف المنتج من المتجر"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="p-4 sm:p-5 bg-white border-t border-slate-200/90 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <p className="text-[11px] font-bold text-slate-500 leading-relaxed text-center sm:text-right">
            * تندرج جميع المشتريات والمستلزمات تلقائياً تحت الفاتورة الضريبية المعتمدة للحجز وعقد الإيجار.
          </p>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-7 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-xs sm:text-sm transition-all cursor-pointer shadow-sm active:scale-95"
            >
              إغلاق
            </button>
          </div>
        </div>

        {/* Add / Edit Sub-Modal Form */}
        <AnimatePresence>
          {isProductFormOpen && (
            <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
                dir="rtl"
              >
                {/* Form Header */}
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 sm:p-5 text-white flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-black/30 flex items-center justify-center text-amber-300">
                      {editingProductId ? <Edit className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                    </div>
                    <div>
                      <h4 className="font-black text-sm sm:text-base">
                        {editingProductId ? 'تعديل منتج في متجر القاعة' : 'إضافة منتج / مستلزم جديد للقاعة'}
                      </h4>
                      <p className="text-[11px] text-amber-100">
                        {hall?.name}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsProductFormOpen(false)}
                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-bold text-slate-700">
                  {/* Name & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block mb-1 text-slate-800">اسم المنتج / المستلزم <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.name || ''}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="مثال: صينية عشاء VIP، كرتون مياه..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-800">التصنيف <span className="text-rose-500">*</span></label>
                      <select
                        value={formData.category || (dynamicCategories[0]?.key ?? 'hospitality')}
                        onChange={e => setFormData({ ...formData, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white cursor-pointer"
                      >
                        {dynamicCategories.map(cat => (
                          <option key={cat.key} value={cat.key}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Unit & SKU */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block mb-1 text-slate-800">وحدة البيع / العبوة <span className="text-rose-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={formData.unit || ''}
                        onChange={e => setFormData({ ...formData, unit: e.target.value })}
                        placeholder="مثال: صينية (تكفي 5 ضيوف)، كرتون (30 عبوة)..."
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50/50 focus:bg-white"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-800">رمز المنتج SKU</label>
                      <input
                        type="text"
                        value={formData.sku || ''}
                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                        placeholder="مثال: DIN-VIP-01"
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50/50 focus:bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Pricing and Stock */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 bg-amber-500/5 p-3.5 rounded-2xl border border-amber-500/15">
                    <div>
                      <label className="block mb-1 text-amber-950 font-black">السعر شامل الضريبة 15% (ر.س) <span className="text-rose-500">*</span></label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.price ?? 0}
                        onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-amber-300 focus:border-amber-600 outline-none bg-white font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-800">سعر التكلفة التقديري (ر.س)</label>
                      <input
                        type="number"
                        min={0}
                        value={formData.costPrice ?? 0}
                        onChange={e => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-800">الكمية في المخزون <span className="text-rose-500">*</span></label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={formData.stock ?? 0}
                        onChange={e => setFormData({ ...formData, stock: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Min / Max Quantities & Item Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block mb-1 text-slate-800">الحد الأدنى للطلب</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.minQuantity ?? 1}
                        onChange={e => setFormData({ ...formData, minQuantity: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-800">الحد الأقصى للطلب</label>
                      <input
                        type="number"
                        min={1}
                        value={formData.maxQuantity ?? 50}
                        onChange={e => setFormData({ ...formData, maxQuantity: Number(e.target.value) })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block mb-1 text-slate-800">نوع الصنف (إدارة المخزون)</label>
                      <select
                        value={formData.itemType || 'consumable'}
                        onChange={e => setFormData({ ...formData, itemType: e.target.value as any })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white"
                      >
                        <option value="consumable">مستهلكات وضيافة (ينقص بالطلب)</option>
                        <option value="asset">أصل وتجهيزات (يعاد للمستودع)</option>
                      </select>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block mb-1 text-slate-800">وصف المنتج ومكوناته للعميل</label>
                    <textarea
                      rows={2}
                      value={formData.description || ''}
                      onChange={e => setFormData({ ...formData, description: e.target.value })}
                      placeholder="تفاصيل التقديم، المكونات، وطريقة التجهيز..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50/50 focus:bg-white resize-none"
                    />
                  </div>

                  {/* Image URL */}
                  <div>
                    <label className="block mb-1 text-slate-800">رابط صورة المنتج (اختياري)</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={formData.image || ''}
                        onChange={e => setFormData({ ...formData, image: e.target.value })}
                        placeholder="https://images.unsplash.com/..."
                        className="flex-1 p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50/50 focus:bg-white font-mono text-[11px]"
                      />
                    </div>
                  </div>

                  {/* Available Periods */}
                  <div>
                    <label className="block mb-1 text-slate-800">الفترات المتاح فيها طلب هذا المنتج</label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { id: 'morning', label: 'الفترة الصباحية ☀️' },
                        { id: 'night', label: 'الفترة المسائية 🌙' },
                        { id: 'fullday', label: 'اليوم بالكامل 📅' }
                      ].map(p => {
                        const isChecked = (formData.periods || []).includes(p.id as any);
                        return (
                          <label
                            key={p.id}
                            className={`p-2 rounded-xl border text-center cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-amber-50 border-amber-300 text-amber-900 font-extrabold'
                                : 'bg-slate-50 border-slate-200 text-slate-500'
                            }`}
                          >
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={isChecked}
                              onChange={() => {
                                const current = formData.periods || [];
                                if (isChecked) {
                                  setFormData({ ...formData, periods: current.filter(x => x !== p.id) });
                                } else {
                                  setFormData({ ...formData, periods: [...current, p.id as any] });
                                }
                              }}
                            />
                            <span>{p.label}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Form Action Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-150">
                    <button
                      type="button"
                      onClick={() => setIsProductFormOpen(false)}
                      className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 font-bold"
                    >
                      إلغاء
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-sm"
                    >
                      {editingProductId ? 'حفظ التعديلات' : 'إضافة المنتج للمتجر'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Post-Booking Settings Modal */}
        <AnimatePresence>
          {showSettingsDrawer && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-[99999]">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 flex flex-col"
              >
                {/* Header */}
                <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-base">إعدادات الطلبات اللاحقة والمهل الذكية</h3>
                      <p className="text-[11px] text-slate-300">تحديد المهلة القصوى المسموحة للعميل لطلب مستلزمات إضافية قبل المناسبة</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowSettingsDrawer(false)}
                    className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-5">
                  {/* Sovereign Alert if disabled globally */}
                  {!sovereignConfig.enabled && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-start gap-2.5">
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-bold block">ملاحظة سيادية هامة:</span>
                        <span className="text-[11px]">تم تعطيل الطلبات اللاحقة لمتجر المستلزمات سيادياً من قِبل إدارة المنصة لجميع القاعات حالياً.</span>
                      </div>
                    </div>
                  )}

                  {/* Toggle Enable for this hall */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-xs text-slate-800 block">تفعيل الطلبات اللاحقة لهذا المكان</span>
                      <span className="text-[11px] text-slate-500">تمكين العميل من إضافة أصناف من المتجر بعد إتمام الحجز</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={venuePostBookingSetting.enabled}
                        onChange={(e) => handleUpdateVenuePostBooking({ enabled: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                    </label>
                  </div>

                  {/* Deadline Dropdown */}
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      المهلة القصوى للطلب قبل موعد المناسبة:
                    </label>
                    <select
                      value={venuePostBookingSetting.deadlineDays}
                      disabled={!venuePostBookingSetting.enabled}
                      onChange={(e) => handleUpdateVenuePostBooking({ deadlineDays: parseInt(e.target.value) || 3 })}
                      className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-xs font-bold text-slate-800 bg-white cursor-pointer disabled:bg-slate-100 disabled:text-slate-400"
                    >
                      <optgroup label="المدى القريب (استراحات / شاليهات / مناسبات سريعة)">
                        {POST_BOOKING_DEADLINE_OPTIONS.filter(o => o.category === 'short').map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="المدى المتوسط (قاعات متوسطة / مناسبات مجدولة)">
                        {POST_BOOKING_DEADLINE_OPTIONS.filter(o => o.category === 'medium').map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                      <optgroup label="المدى البعيد (قصور أفراح كبرى / تجهيزات ضخمة)">
                        {POST_BOOKING_DEADLINE_OPTIONS.filter(o => o.category === 'long').map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </optgroup>
                    </select>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      * يغلق النظام تلقائياً إمكانية الطلب للعميل عند الوصول إلى هذه المهلة لتفادي الإرباك اللوجستي.
                    </p>
                  </div>

                  {/* Refund & Proof Policy Notice */}
                  <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2 text-amber-950">
                    <div className="flex items-center gap-2 font-bold text-xs text-amber-900">
                      <ShieldCheck className="w-4 h-4 text-amber-600" />
                      <span>ضوابط استرداد المستلزمات عند إلغاء الحجز:</span>
                    </div>
                    <ul className="text-[11px] text-amber-800 space-y-1 list-disc pr-4 leading-relaxed">
                      <li><strong>الأصناف العامة والقابلة لإعادة الاستخدام:</strong> تسترد كاملة للعميل وفق سياسة الإلغاء المعتمدة.</li>
                      <li><strong>المنتجات الاستهلاكية والتجهيزية المخصصة (بوفيهات، ذبائح، زهور):</strong> لا تخصم قيمتها إلا بشرط تقديم المزود لإثبات بدء التجهيز الفعلي لحماية حقوق الطرفين.</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowSettingsDrawer(false)}
                    className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs"
                  >
                    حفظ وإغلاق
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default VenueStoreManagerModal;
