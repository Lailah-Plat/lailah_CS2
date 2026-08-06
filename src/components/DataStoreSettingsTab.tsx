import React, { useState, useEffect } from 'react';
import { 
  Database, PlusCircle, Trash, Edit3, Check, X, RotateCcw, Search, 
  MapPin, Layers, Briefcase, CreditCard, Sparkles, CheckCircle,
  Megaphone, Target, Coins, FileText, GraduationCap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DataStoreSettingsTabProps {
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

interface DropdownCollection {
  id: string;
  name: string;
  description: string;
  icon: any;
  color: string;
  defaultValues: string[];
  localStorageKey: string;
}

export default function DataStoreSettingsTab({ showNotification }: DataStoreSettingsTabProps) {
  // Define metadata about customizable lists of items
  const collections: DropdownCollection[] = [
    {
      id: 'cities',
      name: 'قائمة المدن',
      description: 'المدن المتاحة في سجلات عناوين القاعات والمرافق والشركاء.',
      icon: MapPin,
      color: 'from-blue-500 to-indigo-600',
      defaultValues: [
        'الرياض', 'الخرج', 'الدرعية',
        'مكة', 'جدة', 'الطائف', 'مكة المكرمة',
        'المدينة المنورة', 'ينبع', 'بدر',
        'الدمام', 'الخبر', 'الظهران', 'الجبيل',
        'بريدة', 'عنيزة', 'الرس',
        'حائل', 'بقعاء', 'الشنان',
        'أبها', 'خميس مشيط', 'أحد رفيدة',
        'تبوك', 'ضباء', 'الوجه',
        'سكاكا', 'القريات', 'دومة الجندل',
        'جيزان', 'صبيا', 'أبو عريش',
        'نجران', 'شرورة',
        'الباحة', 'بلجرشي',
        'عرعر', 'رفحاء', 'طريف'
      ],
      localStorageKey: 'SYSTEM_DATastore_cities'
    },
    {
      id: 'regions',
      name: 'قائمة المناطق الجغرافية',
      description: 'مناطق التغطية الجغرافية الرئسية لفلترة وتصنيف المنشآت.',
      icon: MapPin,
      color: 'from-purple-500 to-pink-500',
      defaultValues: [
        'الرياض',
        'مكة المكرمة',
        'المدينة المنورة',
        'المنطقة الشرقية',
        'القصيم',
        'حائل',
        'عسير',
        'تبوك',
        'الجوف',
        'جيزان',
        'نجران',
        'الباحة',
        'الحدود الشمالية'
      ],
      localStorageKey: 'SYSTEM_DATastore_regions'
    },
    {
      id: 'hallCategories',
      name: 'تصنيفات القاعات والمرافق',
      description: 'التصنيفات المتاحة للقاعات والمنتجعات والشاليهات في نموذج الإضافة.',
      icon: Layers,
      color: 'from-amber-500 to-orange-500',
      defaultValues: ['قاعة أفراح', 'استراحة قسم', 'استراحة قسمين', 'شاليه', 'منتجع', 'متنزه', 'مخيم', 'قاعة اجتماع', 'أخرى'],
      localStorageKey: 'SYSTEM_DATastore_hallCategories'
    },
    {
      id: 'serviceCategories',
      name: 'تصنيفات الخدمات اللوجستية',
      description: 'التصنيفات المتوفرة للخدمات الإضافية والضيافة والتصوير والديكور.',
      icon: Sparkles,
      color: 'from-emerald-500 to-teal-500',
      defaultValues: ['ضيافة', 'تصوير', 'دي جي', 'بوفيه مفتوح', 'تنسيق ورد', 'عشاء وحفلات', 'تنظيم حشود'],
      localStorageKey: 'SYSTEM_DATastore_serviceCategories'
    },
    {
      id: 'employeeRoles',
      name: 'الأدوار والمهام الوظيفية',
      description: 'المسميات والأدوار المتاحة للموظفين ومعدي الحفلات في صفحة الصلاحيات والموارد البشرية.',
      icon: Briefcase,
      color: 'from-slate-600 to-slate-800',
      defaultValues: ['المدير العام (Admin)', 'المحاسب المالي', 'مدير التسويق والتطوير', 'مشرف قاعة الحفلات', 'منسق الحفلات والدعم اللوجستي'],
      localStorageKey: 'SYSTEM_DATastore_employeeRoles'
    },
    {
      id: 'paymentMethods',
      name: 'طرق وقنوات الدفع المعتمدة',
      description: 'قنوات الدفع التي يتم تخصيصها وقبولها في الفواتير والمعاملات المالية.',
      icon: CreditCard,
      color: 'from-cyan-500 to-blue-600',
      defaultValues: ['مدى (mada)', 'Apple Pay', 'stc pay', 'تمارا (tamara)', 'حوالة بنكية'],
      localStorageKey: 'SYSTEM_DATastore_paymentMethods'
    },
    {
      id: 'units',
      name: 'الوحدات بموردي ومزودي الخدمات',
      description: 'الوحدات القياسية لإدارة الخدمات اللوجستية والمساندة كوجبة أو فرد أو ساعة.',
      icon: Layers,
      color: 'from-green-55c to-emerald-500',
      defaultValues: ['مرة واحدة', 'شخص', 'ساعة', 'يوم', 'حزمة', 'وجبة', 'كيلو'],
      localStorageKey: 'SYSTEM_DATastore_units'
    },
    {
      id: 'revenueTypes',
      name: 'أنواع الإيرادات المالية',
      description: 'بنود تصنيف الإيرادات وعائد مبيعات وحجوزات الأقسام المختلفة.',
      icon: Coins,
      color: 'from-teal-500 to-cyan-500',
      defaultValues: ['اشتراك', 'عمولة', 'خدمة إضافية', 'أخرى'],
      localStorageKey: 'SYSTEM_DATastore_revenueTypes'
    },
    {
      id: 'expenseCategories',
      name: 'تصنيفات المصروفات المالية',
      description: 'تصنيف المصروفات والمدفوعات والمشتريات وتكاليف التشغيل.',
      icon: FileText,
      color: 'from-rose-500 to-orange-600',
      defaultValues: ['رواتب', 'تسويق', 'خدمات', 'استضافة', 'تبرعات', 'أخرى'],
      localStorageKey: 'SYSTEM_DATastore_expenseCategories'
    },
    {
      id: 'marketingGoals',
      name: 'أهداف الحملات التسويقية',
      description: 'الأهداف الاستراتيجية المحددة في طلبات تمويل الحملات الإعلانية.',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      defaultValues: ['حجوزات مباشرة', 'جمع بيانات عملاء محتملين (Leads)', 'زيادة الوعي بالمنشأة'],
      localStorageKey: 'SYSTEM_DATastore_marketingGoals'
    },
    {
      id: 'customerFollowups',
      name: 'آليات متابعة العملاء',
      description: 'أدوات فرز وقنوات تتبع واستلام معلومات العملاء المستهدفين.',
      icon: CheckCircle,
      color: 'from-indigo-500 to-blue-600',
      defaultValues: ['الواتساب', 'اتصال هاتفي', 'حجز تلقائي من المنصة'],
      localStorageKey: 'SYSTEM_DATastore_customerFollowups'
    },
    {
      id: 'adTypes',
      name: 'أنواع وقوالب الإعلانات',
      description: 'قوالب وصيغ الإعلانات الداخلية المصرح بنشرها في المنصة.',
      icon: Megaphone,
      color: 'from-purple-500 to-indigo-700',
      defaultValues: ['صورة (بنر)', 'نصي', 'فيديو قصير'],
      localStorageKey: 'SYSTEM_DATastore_adTypes'
    },
    {
      id: 'adLocations',
      name: 'مواقع مساحات الإعلان',
      description: 'أماكن ومواقع ومحاور ظهور الإعلانات الممولة والتطبيقية بالصفحات.',
      icon: MapPin,
      color: 'from-fuchsia-500 to-pink-600',
      defaultValues: [
        'أعلى الصفحة الرئيسية', 
        'شريط جانبي في قائمة الخدمات', 
        'أسفل تفاصيل الحجز', 
        'نافذة منبثقة (Popup)',
        'شريط الإعلانات العلوي - يمين',
        'شريط الإعلانات العلوي - وسط',
        'شريط الإعلانات العلوي - يسار',
        'شريط الإعلانات السفلي - يمين',
        'شريط الإعلانات السفلي - وسط',
        'شريط الإعلانات السفلي - يسار'
      ],
      localStorageKey: 'SYSTEM_DATastore_adLocations'
    },
    {
      id: 'departments',
      name: 'الأقسام الإدارية والوظيفية',
      description: 'أقسام وهياكل الموارد البشرية لتنظيم الموظفين والصلاحيات بالمنظومة.',
      icon: Briefcase,
      color: 'from-slate-700 to-slate-900',
      defaultValues: ['الإدارة', 'المالية', 'التقنية', 'العمليات'],
      localStorageKey: 'SYSTEM_DATastore_departments'
    },
    {
      id: 'qualifications',
      name: 'المؤهلات العلمية للموظفين',
      description: 'المستويات الأكاديمية والمؤهلات المطلوبة لملف المسمى الوظيفي للموظف.',
      icon: GraduationCap,
      color: 'from-sky-550 to-blue-600',
      defaultValues: ['ثانوي', 'دبلوم', 'بكالوريوس', 'ماجستير', 'دكتوراه'],
      localStorageKey: 'SYSTEM_DATastore_qualifications'
    }
  ];

  const [activeCollectionId, setActiveCollectionId] = useState<string>('cities');
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [lists, setLists] = useState<Record<string, string[]>>({});
  const [newItemValue, setNewItemValue] = useState<string>('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Initial loading from cloud database
  useEffect(() => {
    const fetchLists = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/system/configs');
        const data = await res.json();
        
        if (data.success && data.configs) {
          const loadedLists: Record<string, string[]> = {};
          
          for (const col of collections) {
            const dbVal = data.configs[col.localStorageKey];
            if (dbVal && Array.isArray(dbVal)) {
              loadedLists[col.id] = dbVal;
              try {
                localStorage.setItem(col.localStorageKey, JSON.stringify(dbVal));
              } catch (e) {}
            } else {
              // If not present in DB, initialize it with default values on the cloud database
              loadedLists[col.id] = [...col.defaultValues];
              await fetch('/api/system/configs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ key: col.localStorageKey, value: col.defaultValues })
              });
            }
          }
          setLists(loadedLists);
        } else {
          // Fail-safe default loader
          const loadedLists: Record<string, string[]> = {};
          collections.forEach(col => {
            loadedLists[col.id] = [...col.defaultValues];
          });
          setLists(loadedLists);
        }
      } catch (e) {
        console.error("Failed to load configs from external database, using in-memory fallbacks:", e);
        const loadedLists: Record<string, string[]> = {};
        collections.forEach(col => {
          loadedLists[col.id] = [...col.defaultValues];
        });
        setLists(loadedLists);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLists();
  }, []);

  // Sync to external cloud database and local storage
  const saveList = async (id: string, updatedList: string[]) => {
    const col = collections.find(c => c.id === id);
    if (col) {
      try {
        localStorage.setItem(col.localStorageKey, JSON.stringify(updatedList));
      } catch (e) {
        console.error("Error setting localStorage:", e);
      }

      window.dispatchEvent(new CustomEvent('datastoreUpdated', { detail: { id, list: updatedList } }));
      window.dispatchEvent(new Event('datastoreUpdated'));

      try {
        await fetch('/api/system/configs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            key: col.localStorageKey,
            value: updatedList
          })
        });
      } catch (err) {
        console.error("Error saving data store list to cloud database:", err);
        showNotification('error', 'فشل الحفظ الفوري في قاعدة البيانات السحابية');
      }
    }
  };



  const getActiveList = (): string[] => {
    return lists[activeCollectionId] || [];
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemValue.trim()) {
      showNotification('error', 'الرجاء إدخال قيمة صحيحة ومكتملة');
      return;
    }

    const currentList = getActiveList();
    if (currentList.map(item => item.trim()).includes(newItemValue.trim())) {
      showNotification('error', 'هذه القيمة موجودة بالفعل في القائمة المحددة');
      return;
    }

    const updatedList = [...currentList, newItemValue.trim()];
    const updatedLists = { ...lists, [activeCollectionId]: updatedList };
    setLists(updatedLists);
    saveList(activeCollectionId, updatedList);
    setNewItemValue('');
    showNotification('success', 'تمت إضافة العنصر الجديد بنجاح! 🎉');
  };

  const handleDeleteItem = (indexToDelete: number) => {
    const currentList = getActiveList();
    const updatedList = currentList.filter((_, idx) => idx !== indexToDelete);
    const updatedLists = { ...lists, [activeCollectionId]: updatedList };
    setLists(updatedLists);
    saveList(activeCollectionId, updatedList);
    
    if (editingIndex === indexToDelete) {
      setEditingIndex(null);
    }
    setDeleteConfirmIndex(null);
    showNotification('success', 'تم حذف العنصر بنجاح من القائمة المنسدلة');
  };

  const startEditing = (idx: number, val: string) => {
    setEditingIndex(idx);
    setEditingValue(val);
    setDeleteConfirmIndex(null); // Cancel deletion mode if editing starts
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditingValue('');
  };

  const saveEditing = (idx: number) => {
    if (!editingValue.trim()) {
      showNotification('error', 'الرجاء إدخال قيمة صحيحة ومكتملة');
      return;
    }

    const currentList = getActiveList();
    if (currentList[idx] === editingValue.trim()) {
      setEditingIndex(null);
      return;
    }

    if (currentList.filter((_, i) => i !== idx).map(item => item.trim()).includes(editingValue.trim())) {
      showNotification('error', 'هذه القيمة مستخدمة بالفعل في عنصر آخر بالقائمة');
      return;
    }

    const updatedList = [...currentList];
    updatedList[idx] = editingValue.trim();
    const updatedLists = { ...lists, [activeCollectionId]: updatedList };
    setLists(updatedLists);
    saveList(activeCollectionId, updatedList);
    setNewItemValue('');
    setEditingIndex(null);
    showNotification('success', 'تم تعديل القيمة بنجاح');
  };

  const restoreToDefaults = () => {
    const activeCol = collections.find(c => c.id === activeCollectionId);
    if (activeCol) {
      const updatedLists = { ...lists, [activeCollectionId]: [...activeCol.defaultValues] };
      setLists(updatedLists);
      saveList(activeCollectionId, [...activeCol.defaultValues]);
      setEditingIndex(null);
      setDeleteConfirmIndex(null);
      setShowRestoreConfirm(false);
      showNotification('success', 'تمت استعادة القيم الافتراضية بنجاح 🔄');
    }
  };

  const activeCol = collections.find(c => c.id === activeCollectionId);
  if (!activeCol) return null;

  const ActiveIcon = activeCol.icon;

  const filteredItems = getActiveList().filter(item => 
    item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center font-sans">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-slate-500 text-sm font-bold">جاري جلب القوائم والمزامنة مع قاعدة البيانات السحابية... ☁️</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-right" dir="rtl">
      <div>
        <h3 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2 font-sans pb-2 border-b border-slate-100">
          <Database className="w-5 h-5 text-amber-500" />
          مخزن بيانات القوائم المنسدلة 🗃️
          <span className="mr-auto text-[10px] bg-emerald-55/60 text-emerald-700 px-2.5 py-1 border border-emerald-200 rounded-full font-bold flex items-center gap-1.5 font-sans">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></span>
            متزامن بالكامل مع السحاب (External Cloud DB)
          </span>
        </h3>
        <p className="text-slate-500 text-xs mt-1 leading-relaxed">
          يتيح لك هذا المعمل تهيئة وتعديل القيم المصدرية لكافة الخيارات المتاحة للمستخدمين، مزودي القاعات، المنسقين والعملاء. أي تعديل يتم حفظه هنا فمن شأنه التحكم الفوري بقوائم إدخال وتصفية المنظومة.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Hand: Selection of Collections */}
        <div className="lg:col-span-4 space-y-2">
          <span className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">الجداول المنسدلة المتوفرة</span>
          {collections.map(col => {
            const ColIcon = col.icon;
            const itemsCount = lists[col.id]?.length || 0;
            return (
              <button
                key={col.id}
                onClick={() => {
                  setActiveCollectionId(col.id);
                  setNewItemValue('');
                  setEditingIndex(null);
                  setDeleteConfirmIndex(null);
                  setSearchQuery('');
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border text-right transition-all font-sans cursor-pointer ${
                  activeCollectionId === col.id
                    ? 'bg-gradient-to-l from-slate-900 to-slate-800 border-slate-900 text-white shadow-md shadow-slate-900/10 scale-[1.02]'
                    : 'bg-white border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl border ${
                    activeCollectionId === col.id 
                      ? 'bg-slate-700/50 border-slate-600 text-amber-400' 
                      : 'bg-slate-50 border-slate-100 text-slate-500'
                  }`}>
                    <ColIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="block font-bold text-[13px]">{col.name}</span>
                    <span className={`block text-[10px] mt-0.5 line-clamp-1 ${activeCollectionId === col.id ? 'text-slate-300' : 'text-slate-400'}`}>
                      {col.description}
                    </span>
                  </div>
                </div>
                <span className={`text-[11px] font-bold font-sans px-2 py-0.5 rounded-full ${
                  activeCollectionId === col.id 
                    ? 'bg-amber-400 text-slate-950 font-extrabold' 
                    : 'bg-slate-100 text-slate-600'
                }`}>
                  {itemsCount}
                </span>
              </button>
            );
          })}
        </div>

        {/* Right Hand: Selected Dynamic Value Manager */}
        <div className="lg:col-span-8 bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm flex flex-col min-h-[500px]">
          {/* Header */}
          <div className="p-6 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-900 text-white rounded-2xl">
                <ActiveIcon className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-800 text-[15px]">{activeCol.name}</h4>
                <p className="text-slate-500 text-[11px] mt-0.5">{activeCol.description}</p>
              </div>
            </div>

            {!showRestoreConfirm ? (
              <button 
                onClick={() => {
                  setShowRestoreConfirm(true);
                  setDeleteConfirmIndex(null);
                }}
                className="text-xs text-rose-600 font-bold hover:text-rose-700 hover:bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-100 transition-all font-sans flex items-center gap-2 self-start md:self-auto cursor-pointer"
                title="استعادة القيم الافتراضية المحددة مسبقاً"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                استعادة الافتراضي
              </button>
            ) : (
              <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-xl animate-in fade-in zoom-in-95 duration-150">
                <span className="text-[11px] text-rose-700 font-bold">تأكيد استعادة الافتراضي؟</span>
                <button 
                  onClick={restoreToDefaults}
                  className="text-[10px] bg-rose-600 hover:bg-rose-700 text-white font-extrabold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  نعم
                </button>
                <button 
                  onClick={() => setShowRestoreConfirm(false)}
                  className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  تراجع
                </button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6 flex-1 flex flex-col">
            {/* Form to insert new option */}
            <form onSubmit={handleAddItem} className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex gap-3 items-center">
              <div className="flex-1 relative">
                <input 
                  type="text"
                  value={newItemValue}
                  onChange={e => setNewItemValue(e.target.value)}
                  placeholder={`إضافة خيار جديد إلى ${activeCol.name}...`}
                  maxLength={50}
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 outline-none bg-white transition-all font-medium font-sans"
                />
              </div>
              <button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white hover:text-amber-300 font-bold px-5 py-3 rounded-xl flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap text-xs shadow-md shadow-slate-900/15 font-sans"
              >
                <PlusCircle className="w-4 h-4 text-amber-400" />
                إضافة للقائمة
              </button>
            </form>

            <div className="space-y-4 flex-1 flex flex-col">
              {/* Search filter for dropdown list options */}
              <div className="relative">
                <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-400">
                  <Search className="w-4 h-4" />
                </span>
                <input 
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن خيار مضاف في القائمة الحالية..."
                  className="w-full pr-10 pl-4 py-2.5 text-xs rounded-xl border border-slate-150 outline-none focus:border-slate-400 font-sans font-medium"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute inset-y-0 left-3 flex items-center text-slate-400 hover:text-slate-600">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Options lists view */}
              <div className="flex-1 max-h-[300px] overflow-y-auto border border-slate-100 rounded-2xl p-2 bg-slate-50/50 space-y-1.5">
                <AnimatePresence mode="popLayout">
                  {filteredItems.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-xs font-sans">
                      لا توجد خيارات مطابقة أو القائمة فارغة حالياً.
                    </div>
                  ) : (
                    filteredItems.map((item, index) => {
                      // We need the original index to perform state updates correctly
                      const originalIndex = getActiveList().indexOf(item);
                      const isEditing = editingIndex === originalIndex;
                      const isConfirmingDelete = deleteConfirmIndex === originalIndex;

                      return (
                        <motion.div 
                          key={`${item}-${originalIndex}`}
                          layout
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                            isEditing 
                              ? 'bg-amber-50/50 border-amber-200 shadow-sm ring-2 ring-amber-500/15'
                              : isConfirmingDelete
                                ? 'bg-rose-50/70 border-rose-200 shadow-sm ring-2 ring-rose-500/15'
                                : 'bg-white border-slate-100 hover:border-slate-205 shadow-sm'
                          }`}
                        >
                          <div className="flex-1 flex items-center gap-2">
                            <span className="text-slate-300 text-xs font-mono select-none w-5">#{originalIndex + 1}</span>
                            
                            {isEditing ? (
                              <input 
                                type="text"
                                value={editingValue}
                                onChange={e => setEditingValue(e.target.value)}
                                className="flex-1 text-xs p-1.5 rounded-lg border border-amber-305 focus:border-amber-500 outline-none bg-white font-medium font-sans max-w-md"
                                autoFocus
                              />
                            ) : isConfirmingDelete ? (
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-rose-700 text-xs font-sans">تأكيد حذف خيار "{item}"؟</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-slate-800 text-xs font-sans">{item}</span>
                            )}
                          </div>

                          <div className="flex items-center gap-1">
                            {isEditing ? (
                              <>
                                <button 
                                  onClick={() => saveEditing(originalIndex)}
                                  className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg transition-colors cursor-pointer"
                                  title="حفظ التعديل"
                                >
                                  <Check className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={cancelEditing}
                                  className="p-1.5 bg-slate-100 text-slate-500 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                                  title="إلغاء وتراجع"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </>
                            ) : isConfirmingDelete ? (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleDeleteItem(originalIndex)}
                                  className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                                >
                                  حذف نهائي
                                </button>
                                <button
                                  onClick={() => setDeleteConfirmIndex(null)}
                                  className="px-2.5 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[10px] rounded-lg transition-all cursor-pointer"
                                >
                                  إلغاء
                                </button>
                              </div>
                            ) : (
                              <>
                                <button 
                                  onClick={() => startEditing(originalIndex, item)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                  title="تعديل هذا الخيار"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    setDeleteConfirmIndex(originalIndex);
                                    setShowRestoreConfirm(false);
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                  title="حذف هذا الخيار"
                                >
                                  <Trash className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 font-sans flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>تحديثات مخزن البيانات فورية وتنعكس ديناميكياً على النماذج وقوائم الفرز بالموقع لضمان اتساق قواعد البيانات.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
