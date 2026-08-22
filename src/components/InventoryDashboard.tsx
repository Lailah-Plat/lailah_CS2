import React, { useState, useEffect } from 'react';
import { Package, Search, Plus, Filter, FileText, ArrowUp, ArrowDown, Edit2, Trash2, Users, AlertTriangle, QrCode, ShieldAlert, History, CheckCircle2, Wrench, Ban, RefreshCw, DollarSign } from 'lucide-react';
import { ItemQrCodeButton } from './ItemQrCodeButton';
import { apiService } from '../services/apiService';

export function InventoryDashboard({ inventory = [], setInventory, currentProviderName }: { inventory?: any[], setInventory?: (items: any[]) => void, currentProviderName?: string }) {
  const [localInventory, setLocalInventory] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'alerts' | 'audit'>('items');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortOption, setSortOption] = useState<'newest' | 'oldest' | 'price_desc' | 'price_asc'>('newest');
  
  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [isAuditModalOpen, setIsAuditModalOpen] = useState(false);
  const [selectedAuditItem, setSelectedAuditItem] = useState<any>(null);
  const [damageForm, setDamageForm] = useState({
    damagedQuantity: 1,
    reason: 'تلف أثناء المناسبة',
    notes: '',
    performedBy: currentProviderName || 'مدير المخزون'
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);
  const [isAddingNewSupplier, setIsAddingNewSupplier] = useState(false);
  const [suppliersList, setSuppliersList] = useState<string[]>([]);
  
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    itemType: 'general',
    operationalStatus: 'active',
    totalQuantity: 100,
    currentStock: 100,
    reorderLevel: 15,
    unit: 'قطعة',
    cost: 0,
    supplier: '',
    notes: ''
  });

  const currentInventory = setInventory ? inventory : localInventory;

  const updateInventoryState = (items: any[]) => {
    if (setInventory) {
      setInventory(items);
    } else {
      setLocalInventory(items);
    }
  };

  // Load Inventory & Logs from Cloud DB
  useEffect(() => {
    loadInventoryData();
    loadAuditLogs();
    loadSuppliersList();
  }, []);

  const loadInventoryData = async () => {
    try {
      const data = await apiService.getInventory();
      if (Array.isArray(data) && data.length > 0) {
        updateInventoryState(data);
      }
    } catch (err: any) {
      console.warn('تنبيه: تعذر تحميل المخزون من السحابة مباشرة، يتم استخدام البيانات المحلية المتاحة:', err.message || err);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const logs = await apiService.getInventoryLogs();
      if (Array.isArray(logs)) {
        setAuditLogs(logs);
      }
    } catch (err: any) {
      console.warn('تنبيه: تعذر تحميل سجلات حركة المخزون من السحابة، يتم استخدام السجلات المحلية:', err.message || err);
    }
  };

  const loadSuppliersList = async () => {
    try {
      const data = await apiService.getSuppliers();
      if (Array.isArray(data) && data.length > 0) {
        const names = Array.from(new Set(data.map((s: any) => s.name).filter(Boolean)));
        setSuppliersList(names as string[]);
      }
    } catch (err: any) {
      console.warn('تنبيه: تعذر تحميل قائمة الموردين من السحابة، يتم استخدام الموردين المحليين:', err.message || err);
    }
  };

  const formatDateToDDMMYYYY = (dateVal: any): string => {
    if (!dateVal) return '-';
    try {
      const str = String(dateVal).trim();
      if (/^\d{2}\/\d{2}\/\d{4}$/.test(str)) return str;
      const date = new Date(str);
      if (!isNaN(date.getTime())) {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      }
      return str;
    } catch {
      return String(dateVal);
    }
  };

  const cleanCSVField = (val: any) => {
    if (val === null || val === undefined) return '';
    let str = String(val).trim().replace(/"/g, '""');
    if (str.includes(',') || str.includes(';') || str.includes('"') || str.includes('\n')) {
      return `"${str}"`;
    }
    return str;
  };

  const handleExportInventory = () => {
    if (!filteredAndSortedInventory || filteredAndSortedInventory.length === 0) {
      alert('لا توجد بيانات لتصديرها!');
      return;
    }

    const headers = ['رمز الصنف (SKU)', 'اسم الصنف', 'نوع الصنف', 'الحالة التشغيلية', 'المخزون الحالي', 'المحجوز', 'التالف', 'حد إعادت الطلب', 'التكلفة ر.س', 'المورد', 'آخر تحديث'];
    
    const rows = filteredAndSortedInventory.map(item => [
      item.sku || '-',
      item.name || '-',
      getItemTypeLabel(item.itemType),
      getStatusLabel(item.operationalStatus),
      item.currentStock || '0',
      item.reservedQuantity || '0',
      item.damagedQuantity || '0',
      item.reorderLevel || '0',
      (item.cost || 0).toFixed(2),
      item.supplier || '-',
      formatDateToDDMMYYYY(item.lastUpdated)
    ].map(cleanCSVField));

    const csvContent = "\uFEFF" + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `تقرير_المخزون_والأصول_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getItemTypeLabel = (type?: string) => {
    switch (type) {
      case 'rental': return 'معاوضة وتأجير (كراسي/طاولات)';
      case 'sale': return 'بيع واستهلاك (مشروبات/حلويات)';
      case 'staff': return 'طاقم وفريق عمل (صبابين/عمال)';
      default: return 'صنف عام';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'active': return 'نشط ومتاح';
      case 'maintenance': return 'قيد الصيانة';
      case 'out_of_service': return 'خارج الخدمة';
      case 'retired': return 'مستبعد نهائياً';
      default: return 'نشط';
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <span className="bg-emerald-100 text-emerald-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> نشط</span>;
      case 'maintenance':
        return <span className="bg-amber-100 text-amber-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Wrench className="w-3 h-3" /> صيانة</span>;
      case 'out_of_service':
        return <span className="bg-red-100 text-red-700 text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Ban className="w-3 h-3" /> خارج الخدمة</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 text-xs px-2.5 py-1 rounded-full font-bold">نشط</span>;
    }
  };

  const handleSort = (items: typeof currentInventory) => {
    return [...items].sort((a, b) => {
      switch (sortOption) {
        case 'newest': return new Date(b.lastUpdated || 0).getTime() - new Date(a.lastUpdated || 0).getTime();
        case 'oldest': return new Date(a.lastUpdated || 0).getTime() - new Date(b.lastUpdated || 0).getTime();
        case 'price_desc': return (b.cost || 0) - (a.cost || 0);
        case 'price_asc': return (a.cost || 0) - (b.cost || 0);
        default: return 0;
      }
    });
  };

  const filteredAndSortedInventory = handleSort(currentInventory.filter(item => {
    const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (item.sku || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || item.itemType === filterType;
    const matchesStatus = filterStatus === 'all' || item.operationalStatus === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  }));

  const lowStockItems = currentInventory.filter(i => (i.currentStock || 0) <= (i.reorderLevel || 0));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const saved = await apiService.saveInventoryItem({
        ...(editingItem ? { id: editingItem.id } : {}),
        ...formData,
        supplier: formData.supplier || 'مورد عام'
      });

      if (editingItem) {
        updateInventoryState(currentInventory.map(item => item.id === editingItem.id ? saved : item));
      } else {
        updateInventoryState([saved, ...currentInventory]);
      }

      setIsModalOpen(false);
      setIsAddingNewSupplier(false);
    } catch (err) {
      console.error('Error saving inventory item to DB:', err);
      alert('حدث خطأ أثناء حفظ الصنف في قاعدة البيانات.');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      sku: item.sku || '',
      itemType: item.itemType || 'general',
      operationalStatus: item.operationalStatus || 'active',
      totalQuantity: item.totalQuantity || 100,
      currentStock: item.currentStock || 0,
      reorderLevel: item.reorderLevel || 10,
      unit: item.unit || 'قطعة',
      cost: item.cost || 0,
      supplier: item.supplier || '',
      notes: item.notes || ''
    });
    setIsAddingNewSupplier(false);
    setIsModalOpen(true);
  };

  const handleDeleteClick = (item: any) => {
    setItemToDelete(item);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await apiService.deleteInventoryItem(itemToDelete.id);
      updateInventoryState(currentInventory.filter(i => i.id !== itemToDelete.id));
    } catch (err) {
      console.error('Failed to delete item from DB:', err);
      alert('فشل في حذف الصنف من قاعدة البيانات.');
    } finally {
      setItemToDelete(null);
    }
  };

  // Handle Recording Damage / Variance Audit
  const handleOpenAuditModal = (item: any) => {
    setSelectedAuditItem(item);
    setDamageForm({
      damagedQuantity: 1,
      reason: 'تلف أثناء المناسبة',
      notes: '',
      performedBy: currentProviderName || 'مشرف المخزون'
    });
    setIsAuditModalOpen(true);
  };

  const handleConfirmDamageAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAuditItem) return;

    const qty = Number(damageForm.damagedQuantity);
    const costImpact = qty * (selectedAuditItem.cost || 0);

    try {
      // 1. Log in DB
      const newLog = await apiService.createInventoryLog({
        inventoryItemId: selectedAuditItem.id,
        itemName: selectedAuditItem.name,
        type: 'damage',
        quantityChanged: qty,
        reason: `${damageForm.reason} - ${damageForm.notes}`,
        costImpact: costImpact,
        performedBy: damageForm.performedBy,
        providerName: currentProviderName || selectedAuditItem.supplier
      });

      // 2. Update item quantities in DB
      const newDamagedTotal = (selectedAuditItem.damagedQuantity || 0) + qty;
      const newStock = Math.max(0, (selectedAuditItem.currentStock || 0) - qty);

      const updatedItem = await apiService.saveInventoryItem({
        id: selectedAuditItem.id,
        damagedQuantity: newDamagedTotal,
        currentStock: newStock
      });

      // Update state
      updateInventoryState(currentInventory.map(i => i.id === selectedAuditItem.id ? { ...i, ...updatedItem } : i));
      setAuditLogs([newLog, ...auditLogs]);

      alert(`تم تسجيل التلفيات بنجاح. الأثر المالي: -${costImpact.toLocaleString('ar-SA')} ر.س`);
      setIsAuditModalOpen(false);
    } catch (err) {
      console.error('Error logging inventory damage audit:', err);
      alert('حدث خطأ أثناء حفظ سجل التلفيات.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 text-amber-700 rounded-xl flex items-center justify-center font-bold">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>📦</span>
                <span>منظومة إدارة الأصول والمخزون والمستلزمات</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">تتبع التجهيزات والمعدات، ضبط حركات العهد، ومراقبة مستويات الإهلاك والجاهزية</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={handleExportInventory}
            className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer text-sm"
          >
            <ArrowUp className="w-4 h-4" /> تصدير CSV
          </button>
          <button 
            onClick={() => {
              setEditingItem(null);
              setFormData({
                name: '', sku: '', itemType: 'general', operationalStatus: 'active',
                totalQuantity: 100, currentStock: 100, reorderLevel: 15, unit: 'قطعة', cost: 0, supplier: '', notes: ''
              });
              setIsAddingNewSupplier(false);
              setIsModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer text-sm"
          >
            <Plus className="w-5 h-5" />
            إضافة صنف / أصل جديد
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('items')}
          className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'items'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          سجل المخزون والأصول ({currentInventory.length})
        </button>

        <button
          onClick={() => setActiveTab('alerts')}
          className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'alerts'
              ? 'border-red-500 text-red-700 bg-red-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-red-500" />
          تنبيهات إعادة الطلب ({lowStockItems.length})
          {lowStockItems.length > 0 && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'audit'
              ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-indigo-500" />
          إدارة التلفيات وتدقيق الجرد ({auditLogs.length})
        </button>
      </div>

      {/* Overview Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">إجمالي الأصناف والأصول</div>
            <div className="text-2xl font-black text-slate-800 mt-1">{currentInventory.length}</div>
          </div>
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <Package className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">أصناف تحت الحد الأدنى</div>
            <div className="text-2xl font-black text-red-600 mt-1">{lowStockItems.length}</div>
          </div>
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">إجمالي التلفيات المسجلة</div>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {currentInventory.reduce((acc, i) => acc + (i.damagedQuantity || 0), 0)}
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500 font-bold">القيمة التقديرية للمخزون</div>
            <div className="text-2xl font-black text-emerald-600 mt-1">
              {currentInventory.reduce((acc, i) => acc + ((i.currentStock || 0) * (i.cost || 0)), 0).toLocaleString('ar-SA')} <span className="text-xs">ر.س</span>
            </div>
          </div>
          <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          {/* Controls Bar */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50">
            <div className="relative w-full md:w-80">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث برقم الصنف SKU أو الاسم..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-sm bg-white"
              />
            </div>

            <div className="flex flex-wrap gap-3 w-full md:w-auto">
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
              >
                <option value="all">كل تصنيفات الأصناف</option>
                <option value="rental">معاوضة وتأجير (كراسي/طاولات)</option>
                <option value="sale">بيع واستهلاك (مشروبات/حلويات)</option>
                <option value="staff">طاقم عمل (صبابين/عمال)</option>
                <option value="general">عام</option>
              </select>

              <select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
              >
                <option value="all">كل الحالات التشغيلية</option>
                <option value="active">نشط ومتاح</option>
                <option value="maintenance">قيد الصيانة</option>
                <option value="out_of_service">خارج الخدمة</option>
              </select>

              <select 
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 bg-white outline-none"
              >
                <option value="newest">الأحدث تحديثاً</option>
                <option value="oldest">الأقدم تحديثاً</option>
                <option value="price_desc">التكلفة (الأعلى أولاً)</option>
                <option value="price_asc">التكلفة (الأقل أولاً)</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
                <tr>
                  <th className="p-4">رمز الصنف / الاسم</th>
                  <th className="p-4">نوع الفئة</th>
                  <th className="p-4 text-center">المخزون الحالي</th>
                  <th className="p-4 text-center">التكلفة</th>
                  <th className="p-4 text-center">الحالة التشغيلية</th>
                  <th className="p-4 text-center">المورد</th>
                  <th className="p-4 text-center">QR / باركود</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredAndSortedInventory.map(item => {
                  const isLow = (item.currentStock || 0) <= (item.reorderLevel || 0);
                  return (
                    <tr key={item.id} className={`hover:bg-slate-50 transition-colors ${isLow ? 'bg-red-50/30' : ''}`}>
                      <td className="p-4">
                        <div className="font-bold text-slate-800">{item.name}</div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">{item.sku || `SKU-${item.id}`}</div>
                      </td>
                      <td className="p-4 font-medium text-slate-600 text-xs">
                        {getItemTypeLabel(item.itemType)}
                      </td>
                      <td className="p-4 text-center font-bold">
                        <span className={`font-mono text-base ${isLow ? 'text-red-600 font-black' : 'text-slate-800'}`}>
                          {item.currentStock || 0}
                        </span>
                        <span className="text-xs text-slate-400 mr-1">{item.unit || 'قطعة'}</span>
                      </td>
                      <td className="p-4 text-center font-bold text-emerald-600">
                        {item.cost ? `${item.cost} ر.س` : '-'}
                      </td>
                      <td className="p-4 text-center">
                        {getStatusBadge(item.operationalStatus)}
                      </td>
                      <td className="p-4 text-center font-medium text-slate-600 text-xs">
                        {item.supplier || '-'}
                      </td>
                      <td className="p-4 text-center">
                        <ItemQrCodeButton item={item} />
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleOpenAuditModal(item)}
                            className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                            title="تسجيل تلفيات أو فقدان"
                          >
                            <ShieldAlert className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="تعديل الصنف"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteClick(item)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                            title="حذف الصنف"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredAndSortedInventory.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد أصناف مطابقة للبحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reorder Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
            <div className="text-sm text-amber-900">
              <strong>التنبيهات الآلية لإعادة الطلب:</strong> تظهر هنا الأصناف التي وصلت إلى الحد الأدنى المخزن أو تقل عنه لتفادي الانقطاع المفاجئ أثناء الفعاليات.
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {lowStockItems.map(item => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-2 h-full bg-red-500"></div>
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-mono font-bold text-slate-400">{item.sku}</span>
                    <span className="bg-red-100 text-red-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      مخزون منخفض جداً
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg mb-1">{item.name}</h4>
                  <p className="text-xs text-slate-500 mb-4">المورد: {item.supplier || 'غير محدد'}</p>

                  <div className="bg-slate-50 p-3 rounded-xl grid grid-cols-2 gap-2 text-center text-xs mb-4">
                    <div>
                      <div className="text-slate-400">المتبقي حالياً</div>
                      <div className="font-black text-red-600 text-base">{item.currentStock} {item.unit}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">حد إعادة الطلب</div>
                      <div className="font-bold text-slate-700 text-base">{item.reorderLevel} {item.unit}</div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleEdit(item)}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> إعادة طلب وشراء كميات جديدة
                </button>
              </div>
            ))}
            {lowStockItems.length === 0 && (
              <div className="col-span-full bg-white p-12 text-center rounded-2xl border border-slate-100">
                <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800 text-lg">المخزون بوضع ممتازة</h3>
                <p className="text-slate-500 text-sm mt-1">جميع الأصناف والأصول متوفرة أعلى من الحدود الأدنى المحددة.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit & Damage Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-bold text-slate-800 text-lg">سجل مطابقة الجرد والتلفيات</h3>
              <p className="text-xs text-slate-500 mt-1">تتبع كافة الحركات الخاصة بالتلفيات، العجز، وتسويات المخزون والأصول.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">الصنف</th>
                  <th className="p-3">نوع الحركة</th>
                  <th className="p-3 text-center">الكمية التالفة</th>
                  <th className="p-3 text-center">السبب والمعاينة</th>
                  <th className="p-3 text-center">الأثر المالي</th>
                  <th className="p-3 text-center">المشرف المسؤول</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-800">{log.itemName}</td>
                    <td className="p-3 text-xs">
                      <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full font-bold">
                        تلفيات وجرد
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-red-600 font-mono">-{log.quantityChanged}</td>
                    <td className="p-3 text-center text-slate-600 text-xs">{log.reason}</td>
                    <td className="p-3 text-center font-bold text-red-600">
                      -{log.costImpact ? log.costImpact.toLocaleString('ar-SA') : 0} ر.س
                    </td>
                    <td className="p-3 text-center text-slate-500 text-xs">{log.performedBy || 'مدير النظام'}</td>
                  </tr>
                ))}
                {auditLogs.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد سجلات تلفيات حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingItem ? 'تعديل بيانات الصنف / الأصل' : 'إضافة صنف أو أصل جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم الصنف / الأصل *</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-sm focus:border-amber-500" 
                  placeholder="مثال: طاولات دائرية VIP" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">تصنيف الحركة</label>
                  <select 
                    value={formData.itemType} 
                    onChange={e => setFormData({ ...formData, itemType: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="rental">معاوضة وتأجير (كراسي/طاولات)</option>
                    <option value="sale">بيع واستهلاك (مشروبات/حلويات)</option>
                    <option value="staff">طاقم وفريق عمل (صبابين/عمال)</option>
                    <option value="general">عام</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الحالة التشغيلية</label>
                  <select 
                    value={formData.operationalStatus} 
                    onChange={e => setFormData({ ...formData, operationalStatus: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="active">نشط ومتاح</option>
                    <option value="maintenance">قيد الصيانة</option>
                    <option value="out_of_service">خارج الخدمة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رمز الصنف SKU</label>
                  <input 
                    type="text" 
                    value={formData.sku} 
                    onChange={e => setFormData({ ...formData, sku: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs" 
                    placeholder="SKU-101" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">الوحدة</label>
                  <input 
                    type="text" 
                    value={formData.unit} 
                    onChange={e => setFormData({ ...formData, unit: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" 
                    placeholder="قطعة / طقم / عامل" 
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المخزون الحالي</label>
                  <input 
                    type="number" min="0" required 
                    value={formData.currentStock} 
                    onChange={e => setFormData({ ...formData, currentStock: Number(e.target.value) })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-center text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">حد إعادة الطلب</label>
                  <input 
                    type="number" min="0" required 
                    value={formData.reorderLevel} 
                    onChange={e => setFormData({ ...formData, reorderLevel: Number(e.target.value) })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-center text-sm text-red-600" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التكلفة (ر.س)</label>
                  <input 
                    type="number" min="0" 
                    value={formData.cost} 
                    onChange={e => setFormData({ ...formData, cost: Number(e.target.value) })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-center text-sm text-emerald-600" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد</label>
                <input 
                  type="text" 
                  value={formData.supplier} 
                  onChange={e => setFormData({ ...formData, supplier: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" 
                  placeholder="اختر أو اكتب اسم المورد..." 
                />
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="submit" className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl transition-all text-sm shadow-md cursor-pointer">
                  {editingItem ? 'حفظ التعديلات' : 'إضافة إلى المخزون'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Damage Audit Modal */}
      {isAuditModalOpen && selectedAuditItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-red-50">
              <div className="flex items-center gap-2 text-red-700">
                <ShieldAlert className="w-5 h-5" />
                <h3 className="font-bold text-base">تسجيل تلفيات أو فقدان بالجرد</h3>
              </div>
              <button onClick={() => setIsAuditModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleConfirmDamageAudit} className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl">
                <div className="text-xs text-slate-400">الصنف المحدد</div>
                <div className="font-bold text-slate-800 text-base">{selectedAuditItem.name}</div>
                <div className="text-xs text-slate-500 mt-1">المتبقي بالمخزون: {selectedAuditItem.currentStock} {selectedAuditItem.unit}</div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الكمية التالفة / المفقودة *</label>
                <input 
                  type="number" min="1" max={selectedAuditItem.currentStock || 999} required 
                  value={damageForm.damagedQuantity} 
                  onChange={e => setDamageForm({ ...damageForm, damagedQuantity: Number(e.target.value) })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-bold text-center text-lg text-red-600" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">سبب التلف أو الفقدان</label>
                <select 
                  value={damageForm.reason} 
                  onChange={e => setDamageForm({ ...damageForm, reason: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="تلف أثناء المناسبة">تلف أثناء المناسبة</option>
                  <option value="كسر أو عطل فني">كسر أو عطل فني</option>
                  <option value="فقدان / سرقة">فقدان / سرقة</option>
                  <option value="انتهاء الصلاحية">انتهاء الصلاحية</option>
                  <option value="تأثر بالظروف الجوية">تأثر بالظروف الجوية</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظات إضافية</label>
                <textarea 
                  rows={2} 
                  value={damageForm.notes} 
                  onChange={e => setDamageForm({ ...damageForm, notes: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs outline-none" 
                  placeholder="اكتب تفاصيل الإثبات أو التقرير الميداني..." 
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-xl text-xs text-amber-800 font-bold flex justify-between items-center">
                <span>الأثر المالي المتوقع:</span>
                <span className="text-red-600 font-mono text-sm">
                  -{(damageForm.damagedQuantity * (selectedAuditItem.cost || 0)).toLocaleString('ar-SA')} ر.س
                </span>
              </div>

              <div className="pt-3 flex gap-3">
                <button type="submit" className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-md cursor-pointer">
                  تأكيد خصم التلفيات
                </button>
                <button type="button" onClick={() => setIsAuditModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-6 border border-slate-100">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">تأكيد حذف الصنف</h3>
            <p className="text-slate-500 text-xs mb-6">
              هل أنت متأكد من حذف ({itemToDelete.name}) من قاعدة البيانات السحابية؟
            </p>
            <div className="flex gap-3">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 text-xs">إلغاء</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2.5 rounded-xl font-bold bg-red-600 text-white text-xs shadow-md">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
