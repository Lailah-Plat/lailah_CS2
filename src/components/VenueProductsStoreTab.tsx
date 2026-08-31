import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ShoppingBag, Plus, Sparkles, Search, Filter, 
  Eye, EyeOff, Edit, Trash2, Check, Package, Utensils, 
  Wine, Armchair, Users, Info, ChevronDown, 
  Layers, ShieldCheck, Tag, ArrowRight,
  Boxes, RefreshCw, Image as ImageIcon, CheckCircle2,
  Clock, Building2, Store, AlertTriangle, Copy, SlidersHorizontal, Lock
} from 'lucide-react';
import { StoreProductItem } from './modals/VenueStoreManagerModal';
import { entitlementService, EntitlementResolution } from '../services/entitlementService';
import {
  DynamicStoreCategory,
  getStoredCategories
} from '../data/storeCategoriesConfig';

interface VenueProductsStoreTabProps {
  userRole: string;
  currentProviderName: string;
  currentProviderId?: string;
  halls: any[];
  setHalls?: React.Dispatch<React.SetStateAction<any[]>>;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  formatCurrency?: (val: number) => string;
}

const DEFAULT_PRESET_PRODUCTS: StoreProductItem[] = [
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

export function VenueProductsStoreTab({
  userRole,
  currentProviderName,
  currentProviderId,
  halls,
  setHalls,
  showNotification,
  formatCurrency = (val: number) => `${val} ر.س`
}: VenueProductsStoreTabProps) {
  // Strict multi-tenancy isolation for scoped halls
  const scopedHalls = useMemo(() => {
    if (userRole === 'provider') {
      return (halls || []).filter((h: any) => {
        const hProviderName = (h.providerName || h.provider || '').trim().toLowerCase();
        const hProviderId = h.providerId ? String(h.providerId) : '';
        const curName = (currentProviderName || '').trim().toLowerCase();
        const curId = currentProviderId ? String(currentProviderId) : '';
        return (
          (curName && hProviderName === curName) ||
          (curId && hProviderId === curId)
        );
      });
    }
    return halls || [];
  }, [halls, userRole, currentProviderName, currentProviderId]);

  // Entitlement state
  const [entitlement, setEntitlement] = useState<EntitlementResolution>(() => 
    entitlementService.resolve(currentProviderId || currentProviderName || 'provider', 'mini_products_store')
  );

  useEffect(() => {
    const check = () => {
      const res = entitlementService.resolve(currentProviderId || currentProviderName || 'provider', 'mini_products_store');
      setEntitlement(res);
    };
    check();
    window.addEventListener('entitlementUpdated', check);
    window.addEventListener('storage', check);
    return () => {
      window.removeEventListener('entitlementUpdated', check);
      window.removeEventListener('storage', check);
    };
  }, [currentProviderId, currentProviderName, userRole]);

  // Hall selection filter: 'all' or specific hall id
  const [selectedHallId, setSelectedHallId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');

  // Dynamic Categories from Sovereign Settings
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

  // Load all products aggregated from scoped halls + localStorage
  const [productsVersion, setProductsVersion] = useState(0);

  // Helper to load products for a specific hall
  const getHallProducts = (hall: any): StoreProductItem[] => {
    if (!hall) return [];
    const storageKey = `hall_store_products_${hall.id}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {}
    }
    if (hall.productsList && Array.isArray(hall.productsList) && hall.productsList.length > 0) {
      return hall.productsList;
    }
    // Return default initial list
    return DEFAULT_PRESET_PRODUCTS.map(p => ({ ...p, hallId: hall.id }));
  };

  // Compile all products across scoped halls only
  const allProducts = useMemo(() => {
    const list: (StoreProductItem & { hallName: string; hallCity?: string })[] = [];
    scopedHalls.forEach(hall => {
      const hallProds = getHallProducts(hall);
      hallProds.forEach(p => {
        list.push({
          ...p,
          hallId: hall.id,
          hallName: hall.name || 'قاعة غير محددة',
          hallCity: hall.city || hall.region
        });
      });
    });
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scopedHalls, productsVersion]);

  // Persist products for a specific hall
  const persistHallProducts = (hallId: string | number, updatedProds: StoreProductItem[]) => {
    try {
      localStorage.setItem(`hall_store_products_${hallId}`, JSON.stringify(updatedProds));
      if (setHalls) {
        setHalls(prev => prev.map(h => h.id === hallId ? { ...h, productsList: updatedProds } : h));
      }
      setProductsVersion(v => v + 1);
    } catch (e) {
      console.error('Failed to persist hall products', e);
    }
  };

  // Add / Edit Modal State
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProductItem | null>(null);
  const [formHallId, setFormHallId] = useState<string | number>(scopedHalls[0]?.id || '');
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

  // Quick instant activation helper for provider
  const handleInstantActivateStoreAddon = () => {
    const success = entitlementService.activateAddon(currentProviderName || 'provider', 'mini_products_store', {
      fee: 120,
      period: 'monthly',
      activationDate: new Date().toISOString()
    });
    if (success) {
      showNotification('success', 'تم تفعيل ميزة متجر المنتجات والمستلزمات المصغر بنجاح كإضافة مستقلة (120 ر.س/شهر)!');
      setProductsVersion(v => v + 1);
    } else {
      showNotification('error', 'تعذر تفعيل الميزة. يرجى المحاولة من تبويب الاشتراكات.');
    }
  };

  // Toggle single product status
  const handleToggleStatus = (item: StoreProductItem & { hallName: string }) => {
    if (!entitlement.isEntitled && userRole === 'provider') {
      showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لتعديل حالة المنتجات.');
      return;
    }
    const hallId = item.hallId;
    if (!hallId) return;
    const currentProds = getHallProducts(scopedHalls.find(h => h.id === hallId));
    const nextStatus: 'active' | 'paused' = item.status === 'active' ? 'paused' : 'active';
    const updated = currentProds.map(p => p.id === item.id ? { ...p, status: nextStatus } : p);
    persistHallProducts(hallId, updated);
    showNotification('info', `تم تحديث حالة الظهور إلى: ${nextStatus === 'active' ? 'نشط ومعروض' : 'موقوف مؤقتاً'}`);
  };

  // Delete product
  const handleDeleteProduct = (item: StoreProductItem & { hallName: string }) => {
    if (!entitlement.isEntitled && userRole === 'provider') {
      showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لحذف المنتجات.');
      return;
    }
    const hallId = item.hallId;
    if (!hallId) return;
    const currentProds = getHallProducts(scopedHalls.find(h => h.id === hallId));
    const updated = currentProds.filter(p => p.id !== item.id);
    persistHallProducts(hallId, updated);
    showNotification('success', 'تم حذف المنتج من متجر القاعة بنجاح.');
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    if (!entitlement.isEntitled && userRole === 'provider') {
      showNotification('warning', 'يرجى تفعيل ميزة متجر المنتجات والمستلزمات المصغر لإضافة منتجات جديدة.');
      return;
    }
    setEditingProduct(null);
    setFormHallId(selectedHallId !== 'all' ? selectedHallId : (scopedHalls[0]?.id || ''));
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

  // Open Edit Modal
  const handleOpenEdit = (item: StoreProductItem & { hallName: string }) => {
    if (!entitlement.isEntitled && userRole === 'provider') {
      showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لتعديل المنتجات.');
      return;
    }
    setEditingProduct(item);
    setFormHallId(item.hallId || scopedHalls[0]?.id || '');
    setFormData({ ...item });
    setIsProductFormOpen(true);
  };

  // Save product form
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!entitlement.isEntitled && userRole === 'provider') {
      showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لحفظ التغييرات.');
      return;
    }
    if (!formData.name?.trim()) {
      showNotification('error', 'يرجى إدخال اسم المنتج.');
      return;
    }
    const targetHallId = formHallId || scopedHalls[0]?.id;
    if (!targetHallId) {
      showNotification('error', 'يرجى اختيار القاعة التابع لها المنتج.');
      return;
    }

    const currentProds = getHallProducts(scopedHalls.find(h => h.id === targetHallId));

    if (editingProduct) {
      // Update existing
      const updated = currentProds.map(p => {
        if (p.id === editingProduct.id) {
          return {
            ...p,
            ...formData,
            hallId: targetHallId,
            price: Number(formData.price || 0),
            costPrice: Number(formData.costPrice || 0),
            stock: Number(formData.stock || 0),
            minQuantity: Number(formData.minQuantity || 1),
            maxQuantity: Number(formData.maxQuantity || 50)
          } as StoreProductItem;
        }
        return p;
      });
      persistHallProducts(targetHallId, updated);
      showNotification('success', 'تم تعديل بيانات المنتج بنجاح.');
    } else {
      // Add new
      const newProd: StoreProductItem = {
        id: `prod_${Date.now()}`,
        hallId: targetHallId,
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
      persistHallProducts(targetHallId, [newProd, ...currentProds]);
      showNotification('success', 'تم إضافة المنتج إلى متجر القاعة بنجاح.');
    }

    setIsProductFormOpen(false);
  };

  // Re-seed preset template for selected hall or all halls
  const handleLoadPresetsForHall = () => {
    if (!entitlement.isEntitled && userRole === 'provider') {
      showNotification('warning', 'يتطلب تفعيل ميزة متجر المنتجات والمستلزمات المصغر لاستيراد القوالب.');
      return;
    }
    if (selectedHallId !== 'all') {
      const target = scopedHalls.find(h => String(h.id) === String(selectedHallId));
      if (target) {
        const seeded = DEFAULT_PRESET_PRODUCTS.map(p => ({
          ...p,
          hallId: target.id,
          id: `prod_${Math.random().toString(36).substr(2, 9)}`
        }));
        persistHallProducts(target.id, seeded);
        showNotification('success', `تم استيراد قوالب المنتجات لقاعة (${target.name}) بنجاح.`);
      }
    } else {
      scopedHalls.forEach(h => {
        const seeded = DEFAULT_PRESET_PRODUCTS.map(p => ({
          ...p,
          hallId: h.id,
          id: `prod_${Math.random().toString(36).substr(2, 9)}`
        }));
        persistHallProducts(h.id, seeded);
      });
      showNotification('success', 'تم استيراد قوالب المنتجات لكافة القاعات بنجاح.');
    }
  };

  // Filter products
  const filteredProducts = useMemo(() => {
    return allProducts.filter(p => {
      // Hall filter
      if (selectedHallId !== 'all' && String(p.hallId) !== String(selectedHallId)) {
        return false;
      }
      // Category filter
      if (selectedCategory !== 'all' && p.category !== selectedCategory) {
        return false;
      }
      // Status filter
      if (statusFilter !== 'all') {
        if (statusFilter === 'active' && p.status !== 'active') return false;
        if (statusFilter === 'paused' && p.status !== 'paused') return false;
        if (statusFilter === 'low_stock' && p.stock > 10) return false;
      }
      // Item Type filter
      if (itemTypeFilter !== 'all' && p.itemType !== itemTypeFilter) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchSku = p.sku?.toLowerCase().includes(q);
        const matchDesc = p.description?.toLowerCase().includes(q);
        const matchHall = p.hallName?.toLowerCase().includes(q);
        if (!matchName && !matchSku && !matchDesc && !matchHall) return false;
      }
      return true;
    });
  }, [allProducts, selectedHallId, selectedCategory, statusFilter, itemTypeFilter, searchQuery]);

  // Key KPI calculations
  const totalProductsCount = allProducts.length;
  const activeProductsCount = allProducts.filter(p => p.status === 'active').length;
  const lowStockCount = allProducts.filter(p => p.stock <= 10).length;
  const totalUnitsInStock = allProducts.reduce((acc, p) => acc + (p.stock || 0), 0);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Banner / Store Orientation */}
      <div className="bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4 relative z-10">
          <div className="w-14 h-14 rounded-2xl bg-black/35 backdrop-blur-xs border border-white/20 flex items-center justify-center text-amber-300 shadow-inner shrink-0">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white drop-shadow-xs">
                إدارة متجر المنتجات والمستلزمات المصغر 🛍️
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-black bg-black/40 text-amber-300 border border-white/15 backdrop-blur-xs">
                {selectedHallId === 'all' ? `كافة القاعات (${scopedHalls.length})` : scopedHalls.find(h => String(h.id) === String(selectedHallId))?.name || 'قاعة محددة'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100/90 font-medium mt-1">
              إدارة وتجهيز المواد الاستهلاكية، المشروبات، صواني العشاء، والأثاث التكميلي الخاص بكل منشأة وقاعة
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto justify-end relative z-10 shrink-0">
          <button
            type="button"
            onClick={handleOpenCreate}
            className={`px-4 py-3 font-black text-xs sm:text-sm rounded-2xl transition-all shadow-md flex items-center gap-2 cursor-pointer active:scale-95 border ${
              entitlement.isEntitled
                ? 'bg-slate-950 hover:bg-slate-900 text-amber-400 border-amber-400/30'
                : 'bg-black/40 hover:bg-black/50 text-amber-200 border-amber-300/30'
            }`}
            title={entitlement.isEntitled ? 'إضافة منتج جديد' : 'ميزة مقفلة في الباقة الحالية'}
          >
            {entitlement.isEntitled ? <Plus className="w-4 h-4" /> : <Lock className="w-4 h-4 text-amber-300" />}
            <span>{entitlement.isEntitled ? '+ إضافة منتج جديد' : 'إضافة منتج (مغلق 🔒)'}</span>
          </button>
          <button
            type="button"
            onClick={handleLoadPresetsForHall}
            className={`px-3.5 py-3 font-black text-xs rounded-2xl transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer active:scale-95 border backdrop-blur-xs ${
              entitlement.isEntitled
                ? 'bg-white/20 hover:bg-white/30 text-white border-white/25'
                : 'bg-white/10 hover:bg-white/20 text-white/70 border-white/15'
            }`}
            title={entitlement.isEntitled ? 'استيراد التشكيلة المعيارية المقترحة' : 'ميزة مقفلة في الباقة الحالية'}
          >
            {entitlement.isEntitled ? <Sparkles className="w-3.5 h-3.5 text-amber-300" /> : <Lock className="w-3.5 h-3.5 text-white/60" />}
            <span>قوالب معتمدة</span>
          </button>
        </div>
      </div>

      {/* Entitlement Status & Commercial Governance Banner */}
      {userRole === 'provider' && (
        <div className={`p-4 sm:p-5 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-2xs ${
          entitlement.isEntitled
            ? 'bg-emerald-50/80 border-emerald-200/90 text-emerald-950'
            : 'bg-gradient-to-r from-amber-50 to-orange-50/80 border-amber-300 text-amber-950'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl mt-0.5 shrink-0 ${
              entitlement.isEntitled ? 'bg-emerald-500 text-white shadow-sm' : 'bg-amber-500 text-slate-950 shadow-sm'
            }`}>
              {entitlement.isEntitled ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-extrabold text-sm">
                  {entitlement.isEntitled 
                    ? 'ميزة متجر المنتجات والمستلزمات المصغر مفعلة بنجاح' 
                    : 'ميزة متجر المنتجات والمستلزمات المصغر غير مفعلة في باقتك الحالية'}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  entitlement.isEntitled 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-200 text-amber-900 border border-amber-300'
                }`}>
                  {entitlement.isEntitled 
                    ? (entitlement.source === 'plan' ? `مشمولة بالباقة: ${entitlement.planName || 'الاحترافية'}` : entitlement.source === 'admin_grant' ? 'منح إداري مباشر' : 'إضافة نشطة (Add-on)')
                    : 'ميزة تجارية مدفوعة (120 ر.س/شهر)'}
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                {entitlement.isEntitled
                  ? 'يمكنك إضافة وتحديث المنتجات والمستلزمات وربطها بالمخزون، وستظهر للعملاء تلقائياً أثناء حجز القاعات المعنية مع الحفاظ على تسعير شامل لضريبة 15%.'
                  : 'متجر المنتجات والمستلزمات المصغر ميزة مستقلة تمكنك من بيع الضيافة، المشروبات، الأثاث، ومستلزمات القاعة مباشرة لعملائك مع تتبع المخزون والربط التشغيلي الكامل.'}
              </p>
            </div>
          </div>

          {!entitlement.isEntitled && (
            <div className="flex items-center gap-2 w-full md:w-auto justify-end shrink-0">
              <button
                type="button"
                onClick={handleInstantActivateStoreAddon}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95 border border-amber-600/30 whitespace-nowrap"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>تفعيل الميزة الآن (120 ر.س / شهرياً)</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Card 1: Total Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">إجمالي أصناف المتجر</span>
            <Package className="w-4 h-4 text-amber-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 font-mono">{totalProductsCount}</span>
            <span className="text-xs font-bold text-slate-400">صنف مسجل</span>
          </div>
        </div>

        {/* Card 2: Active Products */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">أصناف نشطة ومتاحة للعملاء</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-600 font-mono">{activeProductsCount}</span>
            <span className="text-xs font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              معروض بالحجز
            </span>
          </div>
        </div>

        {/* Card 3: Total Stock Units */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">إجمالي رصيد المخزون التقديري</span>
            <Boxes className="w-4 h-4 text-blue-500" />
          </div>
          <div className="flex items-baseline justify-between mt-2">
            <span className="text-2xl sm:text-3xl font-black text-blue-600 font-mono">{totalUnitsInStock}</span>
            <span className="text-xs font-bold text-slate-400">وحدة متوفرة</span>
          </div>
        </div>

        {/* Card 4: Tax & Sovereign Status */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-bold">الرقابة الضريبية والقانونية</span>
            <ShieldCheck className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex items-center gap-1.5 mt-2 text-amber-900 font-black text-xs sm:text-sm">
            <span>🛡️ شامل ضريبة 15% (VAT)</span>
          </div>
        </div>
      </div>

      {/* Main Filter & Hall Selector Panel */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/90 shadow-xs space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5">
          {/* Hall Selector (Drop-down) */}
          <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-200 shrink-0">
            <Building2 className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
            <span className="text-xs font-black text-slate-700 shrink-0">تصفية حسب القاعة:</span>
            <select
              value={selectedHallId}
              onChange={e => setSelectedHallId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-black text-slate-800 outline-none focus:border-amber-500 cursor-pointer min-w-[160px]"
            >
              <option value="all">🏢 كافة القاعات والمنشآت ({scopedHalls.length})</option>
              {scopedHalls.map(hall => (
                <option key={hall.id} value={hall.id}>
                  {hall.name} ({hall.city || hall.region || 'الرئيسية'})
                </option>
              ))}
            </select>
          </div>

          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="🔍 البحث بالاسم، رمز SKU، القاعة، أو الوصف..."
              className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none text-xs font-bold text-slate-800 placeholder:text-slate-400 bg-slate-50/50 focus:bg-white transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
              >
                مسح
              </button>
            )}
          </div>

          {/* Status & ItemType Selectors */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none bg-white focus:border-amber-500 cursor-pointer"
            >
              <option value="all">كل الحالات</option>
              <option value="active">نشط ومعروض</option>
              <option value="paused">موقوف مؤقتاً</option>
              <option value="low_stock">منخفض المخزون (&le; 10)</option>
            </select>

            <select
              value={itemTypeFilter}
              onChange={e => setItemTypeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 outline-none bg-white focus:border-amber-500 cursor-pointer"
            >
              <option value="all">كافة الأنواع</option>
              <option value="consumable">مستهلكات وضيافة ☕</option>
              <option value="asset">أصول وتجهيزات 🪑</option>
            </select>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs font-bold pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={() => setSelectedCategory('all')}
            className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-amber-500 text-slate-950 font-black shadow-xs'
                : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
            }`}
          >
            <Layers className={`w-3.5 h-3.5 ${selectedCategory === 'all' ? 'text-slate-950' : 'text-slate-500'}`} />
            <span>كافة التصنيفات</span>
          </button>

          {dynamicCategories.map(cat => {
            const isSelected = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3.5 py-2 rounded-xl transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
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

      {/* Products Grid Area */}
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
              onClick={handleLoadPresetsForHall}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
            >
              استيراد القوالب
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((prod) => {
            const isActive = prod.status === 'active';
            return (
              <div
                key={`${prod.hallId}_${prod.id}`}
                className={`bg-white rounded-3xl border p-5 transition-all flex flex-col justify-between shadow-2xs hover:shadow-md ${
                  isActive ? 'border-slate-200/90' : 'border-slate-200/50 opacity-60 bg-slate-50/50'
                }`}
              >
                <div>
                  {/* Top Badge & Hall Name */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-amber-100/80 text-amber-900 border border-amber-200/90 flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-amber-700 shrink-0" />
                      <span>{prod.hallName}</span>
                    </span>

                    {isActive ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        معروض للعملاء
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-600 border border-slate-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        موقوف
                      </span>
                    )}
                  </div>

                  {/* Thumbnail & Product Details */}
                  <div className="flex items-start gap-3 mt-2">
                    {prod.image ? (
                      <img
                        src={prod.image}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-150 shrink-0 shadow-2xs"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
                        <Store className="w-7 h-7" />
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        {prod.itemType === 'asset' ? (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            أصل 🪑
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200">
                            مستهلك ☕
                          </span>
                        )}
                        {prod.sku && (
                          <span className="text-[9px] font-mono text-slate-400">
                            #{prod.sku}
                          </span>
                        )}
                      </div>
                      <h4 className="text-sm font-black text-slate-900 leading-snug line-clamp-1">
                        {prod.name}
                      </h4>
                      {prod.description && (
                        <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-relaxed">
                          {prod.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Stock & Unit Specs */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3.5 text-[10px] font-bold">
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/60">
                      الوحدة: {prod.unit}
                    </span>
                    <span className={`px-2 py-0.5 rounded-lg border font-mono ${
                      prod.stock <= 10 
                        ? 'bg-rose-50 text-rose-800 border-rose-200 font-black' 
                        : 'bg-amber-100/70 text-amber-900 border-amber-300 font-black'
                    }`}>
                      المخزون: {prod.stock}
                    </span>
                    <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200/60 font-mono">
                      الطلب: {prod.minQuantity}-{prod.maxQuantity}
                    </span>
                  </div>

                  {/* Periods */}
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] font-bold text-slate-500">
                    <Clock className="w-3 h-3 text-slate-400 shrink-0" />
                    <span>الفترات:</span>
                    <div className="flex items-center gap-1 flex-wrap">
                      {prod.periods.includes('morning') && (
                        <span className="bg-amber-50 text-amber-800 px-1 py-0.2 rounded border border-amber-200 text-[9px]">صباحية</span>
                      )}
                      {prod.periods.includes('night') && (
                        <span className="bg-purple-50 text-purple-800 px-1 py-0.2 rounded border border-purple-200 text-[9px]">مسائية</span>
                      )}
                      {prod.periods.includes('fullday') && (
                        <span className="bg-blue-50 text-blue-800 px-1 py-0.2 rounded border border-blue-200 text-[9px]">يوم كامل</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Footer Price & Action buttons */}
                <div className="pt-3.5 mt-3.5 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div>
                    <div className="flex items-baseline gap-1">
                      <span className="text-base sm:text-lg font-black text-slate-900 font-mono">
                        {formatCurrency(prod.price)}
                      </span>
                    </div>
                    <span className="text-[9px] font-black text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded">
                      (شامل الضريبة 15%)
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(prod)}
                      className={`p-2 rounded-xl border transition-all cursor-pointer ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                          : 'bg-slate-100 text-slate-500 border-slate-200 hover:bg-slate-200'
                      }`}
                      title={isActive ? 'إيقاف الظهور مؤقتاً' : 'تفعيل وإظهار للعملاء'}
                    >
                      {isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(prod)}
                      className="p-2 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-all cursor-pointer"
                      title="تعديل بيانات المنتج"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(prod)}
                      className="p-2 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 transition-all cursor-pointer"
                      title="حذف المنتج من المتجر"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
                    {editingProduct ? <Edit className="w-4 h-4" /> : <Plus className="w-5 h-5" />}
                  </div>
                  <div>
                    <h4 className="font-black text-sm sm:text-base">
                      {editingProduct ? 'تعديل منتج في متجر القاعة' : 'إضافة منتج / مستلزم جديد للمتجر'}
                    </h4>
                    <p className="text-[11px] text-amber-100">
                      تجهيز المستلزمات والمواد الاستهلاكية المرتبطة بالقاعة
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsProductFormOpen(false)}
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

              {/* Form Body */}
              <form onSubmit={handleFormSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs font-bold text-slate-700">
                {/* Hall Selection & Category */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1 text-slate-800">القاعة / المنشأة التابع لها <span className="text-rose-500">*</span></label>
                    <select
                      value={formHallId}
                      onChange={e => setFormHallId(e.target.value)}
                      required
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-white cursor-pointer"
                    >
                      {scopedHalls.map(h => (
                        <option key={h.id} value={h.id}>
                          {h.name} ({h.city || h.region || 'الرئيسية'})
                        </option>
                      ))}
                    </select>
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

                {/* Name & Unit */}
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
                </div>

                {/* Pricing & Stock */}
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
                    <label className="block mb-1 text-slate-800">نوع الصنف (المخزون)</label>
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

                {/* Image URL & SKU */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block mb-1 text-slate-800">رابط صورة المنتج (اختياري)</label>
                    <input
                      type="url"
                      value={formData.image || ''}
                      onChange={e => setFormData({ ...formData, image: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full p-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50/50 focus:bg-white font-mono text-[11px]"
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
                            onChange={e => {
                              const current = formData.periods || [];
                              if (e.target.checked) {
                                setFormData({ ...formData, periods: [...current, p.id as any] });
                              } else {
                                setFormData({ ...formData, periods: current.filter(x => x !== p.id) });
                              }
                            }}
                          />
                          <span>{p.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-150">
                  <button
                    type="button"
                    onClick={() => setIsProductFormOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-black shadow-md cursor-pointer flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingProduct ? 'حفظ التعديلات' : 'إضافة المنتج'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
