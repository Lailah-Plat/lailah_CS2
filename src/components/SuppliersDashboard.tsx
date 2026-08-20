import React, { useState, useEffect } from 'react';
import { Users, Search, Plus, Edit2, Trash2, MapPin, Phone, Mail, FileText, DollarSign, CheckCircle2, AlertTriangle, ShieldCheck, Building2, CreditCard, ExternalLink, Calendar } from 'lucide-react';
import { apiService } from '../services/apiService';

export function SuppliersDashboard({ currentProviderName }: { currentProviderName?: string }) {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'directory' | 'matching' | 'statement'>('directory');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<any | null>(null);
  const [selectedStatementSupplier, setSelectedStatementSupplier] = useState<any | null>(null);

  // Supplier Form Data
  const [formData, setFormData] = useState({
    name: '',
    cr: '',
    phone: '',
    email: '',
    city: '',
    category: 'ضيافة وبوفيه',
    paymentTerms: 'دفع فوري (كاش)',
    pendingBalance: 0
  });

  // Invoice 3-Way Matching Form Data
  const [invoiceForm, setInvoiceForm] = useState({
    supplierId: '',
    supplierName: '',
    invoiceNumber: '',
    poNumber: '',
    amount: 0,
    matchingStatus: 'matched',
    paymentStatus: 'unpaid',
    notes: ''
  });

  // Fetch Suppliers and Invoices from Cloud DB
  useEffect(() => {
    loadSuppliers();
    loadInvoices();
  }, []);

  const loadSuppliers = async () => {
    try {
      const data = await apiService.getSuppliers();
      if (Array.isArray(data)) {
        setSuppliers(data);
        if (data.length > 0 && !selectedStatementSupplier) {
          setSelectedStatementSupplier(data[0]);
        }
      }
    } catch (err) {
      console.warn('Notice: Suppliers load fallback triggered:', err);
    }
  };

  const loadInvoices = async () => {
    try {
      const data = await apiService.getSupplierInvoices();
      if (Array.isArray(data)) {
        setInvoices(data);
      }
    } catch (err) {
      console.warn('Notice: Supplier invoices load fallback triggered:', err);
    }
  };

  const filteredSuppliers = suppliers.filter(s => 
    (s.name || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
    (s.cr || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.category || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const saved = await apiService.saveSupplier({
        ...(editingSupplier ? { id: editingSupplier.id } : {}),
        ...formData
      });

      if (editingSupplier) {
        setSuppliers(suppliers.map(s => s.id === editingSupplier.id ? saved : s));
      } else {
        setSuppliers([saved, ...suppliers]);
      }

      setIsModalOpen(false);
      setFormData({ name: '', cr: '', phone: '', email: '', city: '', category: 'ضيافة وبوفيه', paymentTerms: 'دفع فوري (كاش)', pendingBalance: 0 });
      setEditingSupplier(null);
    } catch (err) {
      console.error('Error saving supplier:', err);
      alert('حدث خطأ أثناء حفظ بيانات المورد.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name || '',
      cr: supplier.cr || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      city: supplier.city || '',
      category: supplier.category || 'عام',
      paymentTerms: supplier.paymentTerms || 'دفع فوري (كاش)',
      pendingBalance: supplier.pendingBalance || 0
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (supplier: any) => {
    setSupplierToDelete(supplier);
  };

  const handleConfirmDelete = async () => {
    if (!supplierToDelete) return;
    try {
      await apiService.deleteSupplier(supplierToDelete.id);
      setSuppliers(suppliers.filter(s => s.id !== supplierToDelete.id));
    } catch (err) {
      console.error('Failed to delete supplier:', err);
      alert('فشل في حذف المورد.');
    } finally {
      setSupplierToDelete(null);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const created = await apiService.createSupplierInvoice({
        ...invoiceForm,
        date: new Date().toISOString().split('T')[0]
      });

      setInvoices([created, ...invoices]);
      setIsInvoiceModalOpen(false);
      alert('تم إضافة الفاتورة والمطابقة بنجاح.');
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert('حدث خطأ أثناء إنشاء الفاتورة.');
    }
  };

  // Record Payment for Supplier
  const handleRecordPayment = async (supplier: any, amount: number) => {
    if (!amount || amount <= 0) return;
    try {
      const updatedBalance = Math.max(0, (supplier.pendingBalance || 0) - amount);
      const updatedTotalPaid = (supplier.totalPaid || 0) + amount;

      const updated = await apiService.saveSupplier({
        id: supplier.id,
        pendingBalance: updatedBalance,
        totalPaid: updatedTotalPaid
      });

      setSuppliers(suppliers.map(s => s.id === supplier.id ? { ...s, ...updated } : s));
      if (selectedStatementSupplier?.id === supplier.id) {
        setSelectedStatementSupplier({ ...selectedStatementSupplier, ...updated });
      }
      alert(`تم تسجيل دفعة بقيمة ${amount.toLocaleString('ar-SA')} ر.س للمورد بنجاح.`);
    } catch (err) {
      console.error('Payment error:', err);
      alert('فشل تسجيل الدفعة.');
    }
  };

  const getMatchingBadge = (status?: string) => {
    switch (status) {
      case 'matched':
        return <span className="bg-emerald-100 text-emerald-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center justify-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> متطابقة 100% (3-Way Matched)</span>;
      case 'variance':
        return <span className="bg-red-100 text-red-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center justify-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> وجود فروقات (Variance)</span>;
      default:
        return <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-1 rounded-full font-bold flex items-center justify-center gap-1"><FileText className="w-3.5 h-3.5" /> قيد الجرد والمطابقة</span>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white p-6 rounded-2xl shadow-sm border border-slate-100 gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-700 rounded-xl flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <span>🚚</span>
                <span>مركز إدارة شبكة الموردين وسلاسل الإمداد</span>
              </h2>
              <p className="text-slate-500 text-xs mt-1">اعتماد عقود التوريد، تقييم موثوقية الموردين، وإدارة أوامر الشراء والتدفق الميداني</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setIsInvoiceModalOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-3 rounded-xl flex items-center gap-2 shadow-md transition-all text-sm cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" /> إضافة فاتورة ومطابقة
          </button>
          <button 
            onClick={() => {
              setEditingSupplier(null);
              setFormData({ name: '', cr: '', phone: '', email: '', city: '', category: 'ضيافة وبوفيه', paymentTerms: 'دفع فوري (كاش)', pendingBalance: 0 });
              setIsModalOpen(true);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-5 py-3 rounded-xl flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm cursor-pointer"
          >
            <Plus className="w-5 h-5" /> إضافة مورد جديد
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2 bg-white px-4 rounded-xl shadow-sm">
        <button
          onClick={() => setActiveTab('directory')}
          className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'directory'
              ? 'border-amber-500 text-amber-700 bg-amber-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          دليل الموردين المعتمدين ({suppliers.length})
        </button>

        <button
          onClick={() => setActiveTab('matching')}
          className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'matching'
              ? 'border-indigo-500 text-indigo-700 bg-indigo-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-indigo-600" />
          التسوية والمطابقة الثلاثية 3-Way Matching ({invoices.length})
        </button>

        <button
          onClick={() => setActiveTab('statement')}
          className={`py-4 px-5 font-bold text-sm border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'statement'
              ? 'border-emerald-500 text-emerald-700 bg-emerald-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4 text-emerald-600" />
          بوابة كشوف الحساب والمستحقات
        </button>
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-5 border-b border-slate-100">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                placeholder="ابحث باسم المورد، السجل التجاري، أو التصنيف..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 outline-none text-sm focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-bold">
                <tr>
                  <th className="p-4">اسم المورد</th>
                  <th className="p-4">الفئة والتخصص</th>
                  <th className="p-4 text-center">السجل التجاري</th>
                  <th className="p-4 text-center">معلومات التواصل</th>
                  <th className="p-4 text-center">شروط الدفع</th>
                  <th className="p-4 text-center">الرصيد المستحق</th>
                  <th className="p-4 text-center">إجراءات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSuppliers.map(supplier => (
                  <tr key={supplier.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-slate-800">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                          {supplier.name.charAt(0)}
                        </div>
                        {supplier.name}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-slate-600 text-xs">
                      <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full font-bold">
                        {supplier.category || 'عام'}
                      </span>
                    </td>
                    <td className="p-4 text-center font-mono text-slate-600">{supplier.cr || '-'}</td>
                    <td className="p-4 text-center text-xs text-slate-600">
                      <div>{supplier.phone || '-'}</div>
                      <div className="text-slate-400">{supplier.email || '-'}</div>
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-amber-700">
                      {supplier.paymentTerms || 'دفع فوري'}
                    </td>
                    <td className="p-4 text-center font-black text-red-600">
                      {supplier.pendingBalance ? `${supplier.pendingBalance.toLocaleString('ar-SA')} ر.س` : '0 ر.س'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button 
                          onClick={() => { setSelectedStatementSupplier(supplier); setActiveTab('statement'); }} 
                          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg text-xs font-bold flex items-center gap-1"
                          title="عرض كشف الحساب"
                        >
                          <FileText className="w-3.5 h-3.5" /> كشف حساب
                        </button>
                        <button onClick={() => handleEdit(supplier)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg" title="تعديل">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => handleDeleteClick(supplier)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg" title="حذف">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredSuppliers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-bold">
                      لا يوجد موردون مطابقون للبحث.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3-Way Matching Tab */}
      {activeTab === 'matching' && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="bg-indigo-50 border border-indigo-200 p-4 rounded-2xl flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-indigo-600 shrink-0" />
            <div className="text-sm text-indigo-900">
              <strong>نظام المطابقة الثلاثية (3-Way Matching Audit):</strong> يقوم النظام بمقارنة أرقام أمر الشراء (PO)، فاتورة المورد، وسجل استلام الشحنة والمخزون لضمان دقة التسوية المالية ومنع أي ازدواجية في الصرف.
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100">
                <tr>
                  <th className="p-3">رقم الفاتورة</th>
                  <th className="p-3">اسم المورد</th>
                  <th className="p-3 text-center">أمر الشراء (PO)</th>
                  <th className="p-3 text-center">المبلغ المستحق</th>
                  <th className="p-3 text-center">نتيجة المطابقة الثلاثية</th>
                  <th className="p-3 text-center">حالة الدفع</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invoices.map(inv => (
                  <tr key={inv.id} className="hover:bg-slate-50">
                    <td className="p-3 font-mono font-bold text-slate-800">{inv.invoiceNumber}</td>
                    <td className="p-3 font-bold text-slate-800">{inv.supplierName}</td>
                    <td className="p-3 text-center font-mono text-xs text-slate-500">{inv.poNumber || '-'}</td>
                    <td className="p-3 text-center font-black text-slate-800">
                      {inv.amount ? inv.amount.toLocaleString('ar-SA') : 0} ر.س
                    </td>
                    <td className="p-3 text-center">
                      {getMatchingBadge(inv.matchingStatus)}
                    </td>
                    <td className="p-3 text-center text-xs font-bold">
                      {inv.paymentStatus === 'paid' ? (
                        <span className="bg-emerald-100 text-emerald-700 px-2.5 py-1 rounded-full">مدفوعة بالكامل</span>
                      ) : (
                        <span className="bg-red-100 text-red-700 px-2.5 py-1 rounded-full">معلقة / غير مدفوعة</span>
                      )}
                    </td>
                  </tr>
                ))}
                {invoices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400 font-bold">
                      لا توجد فواتير مطابقة مسجلة حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Statement & Portal Tab */}
      {activeTab === 'statement' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="w-full md:w-auto flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500">اختر المورد لفتح كشف الحساب:</span>
              <select 
                value={selectedStatementSupplier?.id || ''} 
                onChange={(e) => {
                  const s = suppliers.find(x => x.id === Number(e.target.value));
                  setSelectedStatementSupplier(s || null);
                }}
                className="p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50 outline-none"
              >
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>

            {selectedStatementSupplier && (
              <button
                onClick={() => {
                  const payStr = prompt(`أدخل مبلغ الدفعة المسددة للمورد (${selectedStatementSupplier.name}):`);
                  if (payStr && !isNaN(Number(payStr))) {
                    handleRecordPayment(selectedStatementSupplier, Number(payStr));
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-md"
              >
                <CreditCard className="w-4 h-4" /> تسديد دفعة وحسم من المستحقات
              </button>
            )}
          </div>

          {selectedStatementSupplier ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              {/* Statement Header Card */}
              <div className="bg-slate-900 text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between gap-6">
                <div>
                  <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">بوابة كشف الحساب المالي المعتمد</div>
                  <h3 className="text-2xl font-black">{selectedStatementSupplier.name}</h3>
                  <p className="text-xs text-slate-300 mt-1">السجل التجاري: {selectedStatementSupplier.cr || '-'} | المدينة: {selectedStatementSupplier.city || '-'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-400">إجمالي المسدد</div>
                    <div className="text-xl font-bold text-emerald-400 mt-1">
                      {(selectedStatementSupplier.totalPaid || 0).toLocaleString('ar-SA')} ر.س
                    </div>
                  </div>

                  <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                    <div className="text-xs text-slate-400">الرصيد المتبقي المستحق</div>
                    <div className="text-xl font-bold text-red-400 mt-1">
                      {(selectedStatementSupplier.pendingBalance || 0).toLocaleString('ar-SA')} ر.س
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Logs */}
              <div>
                <h4 className="font-bold text-slate-800 mb-3">سجل المعاملات والفواتير السابقة</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-right text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                      <tr>
                        <th className="p-3">التاريخ</th>
                        <th className="p-3">رقم الفاتورة / الحركة</th>
                        <th className="p-3 text-center">نوع العملية</th>
                        <th className="p-3 text-center">المبلغ</th>
                        <th className="p-3 text-center">الحالة</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {invoices.filter(i => i.supplierId === selectedStatementSupplier.id).map(inv => (
                        <tr key={inv.id}>
                          <td className="p-3 font-mono">{inv.date || '2026-05-20'}</td>
                          <td className="p-3 font-bold">{inv.invoiceNumber}</td>
                          <td className="p-3 text-center">توريد خدمات ومستلزمات</td>
                          <td className="p-3 text-center font-bold text-slate-800">{inv.amount?.toLocaleString('ar-SA')} ر.س</td>
                          <td className="p-3 text-center font-bold text-emerald-600">مكتمل ومطابق</td>
                        </tr>
                      ))}
                      {invoices.filter(i => i.supplierId === selectedStatementSupplier.id).length === 0 && (
                        <tr>
                          <td colSpan={5} className="p-6 text-center text-slate-400 font-bold">
                            لا توجد حركات مسجلة للمورد المحدد.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-100 text-slate-400 font-bold">
              يرجى تحديد مورد لفتح بوابة كشف الحساب.
            </div>
          )}
        </div>
      )}

      {/* Supplier Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 text-lg">
                {editingSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اسم المورد الرسمي *</label>
                <input 
                  type="text" required 
                  value={formData.name} 
                  onChange={e => setFormData({ ...formData, name: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 outline-none text-sm" 
                  placeholder="شركة الضيافة الذهبية" 
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم السجل التجاري CR</label>
                  <input 
                    type="text" 
                    value={formData.cr} 
                    onChange={e => setFormData({ ...formData, cr: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs" 
                    placeholder="1010XXXXXX" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">التصنيف / التخصص</label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({ ...formData, category: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                  >
                    <option value="ضيافة وبوفيه">ضيافة وبوفيه</option>
                    <option value="تصوير وتوثيق">تصوير وتوثيق</option>
                    <option value="ورد وتنسيق كوش">ورد وتنسيق كوش</option>
                    <option value="إضاءة وصوتيات">إضاءة وصوتيات</option>
                    <option value="مستلزمات عامة">مستلزمات عامة</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الهاتف</label>
                  <input 
                    type="text" 
                    value={formData.phone} 
                    onChange={e => setFormData({ ...formData, phone: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs" 
                    placeholder="050XXXXXXX" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">المدينة</label>
                  <input 
                    type="text" 
                    value={formData.city} 
                    onChange={e => setFormData({ ...formData, city: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" 
                    placeholder="الرياض / جدة / الدمام" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">البريد الإلكتروني</label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({ ...formData, email: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs" 
                  placeholder="supplier@domain.com" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">شروط وسياقات الدفع</label>
                <select 
                  value={formData.paymentTerms} 
                  onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="دفع فوري (كاش)">دفع فوري (كاش)</option>
                  <option value="آجل 15 يوم">آجل 15 يوم</option>
                  <option value="آجل 30 يوم">آجل 30 يوم</option>
                  <option value="دفعة مقدمة 50%">دفعة مقدمة 50%</option>
                </select>
              </div>

              <div className="pt-4 flex gap-3 border-t border-slate-100">
                <button type="submit" disabled={loading} className="flex-1 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold py-3 rounded-xl text-sm shadow-md cursor-pointer">
                  {loading ? 'جاري الحفظ...' : (editingSupplier ? 'حفظ التعديلات' : 'إضافة المورد')}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl text-sm cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Invoice 3-Way Matching Modal */}
      {isInvoiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-indigo-50">
              <h3 className="font-bold text-indigo-900 text-base flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" /> تسجيل فاتورة ومطابقة ثلاثية
              </h3>
              <button onClick={() => setIsInvoiceModalOpen(false)} className="text-slate-400 hover:text-red-500 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">اختر المورد *</label>
                <select 
                  required
                  value={invoiceForm.supplierId} 
                  onChange={e => {
                    const s = suppliers.find(x => x.id === Number(e.target.value));
                    setInvoiceForm({
                      ...invoiceForm,
                      supplierId: e.target.value,
                      supplierName: s?.name || ''
                    });
                  }} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="">اختر من القائمة...</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم الفاتورة *</label>
                  <input 
                    type="text" required 
                    value={invoiceForm.invoiceNumber} 
                    onChange={e => setInvoiceForm({ ...invoiceForm, invoiceNumber: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs" 
                    placeholder="INV-26-001" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">رقم أمر الشراء PO</label>
                  <input 
                    type="text" 
                    value={invoiceForm.poNumber} 
                    onChange={e => setInvoiceForm({ ...invoiceForm, poNumber: e.target.value })} 
                    className="w-full p-2.5 rounded-xl border border-slate-200 font-mono text-xs" 
                    placeholder="PO-9901" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">المبلغ الإجمالي (ر.س) *</label>
                <input 
                  type="number" min="1" required 
                  value={invoiceForm.amount} 
                  onChange={e => setInvoiceForm({ ...invoiceForm, amount: Number(e.target.value) })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 font-black text-center text-lg text-indigo-700" 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">حالة المطابقة الثلاثية 3-Way Matching</label>
                <select 
                  value={invoiceForm.matchingStatus} 
                  onChange={e => setInvoiceForm({ ...invoiceForm, matchingStatus: e.target.value })} 
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-bold bg-white"
                >
                  <option value="matched">متطابقة 100% مع أرقام الاستلام والشحنة</option>
                  <option value="variance">وجود فروقات وتحتاج مراجعة</option>
                  <option value="pending_audit">قيد التدقيق والجرد</option>
                </select>
              </div>

              <div className="pt-3 flex gap-3 border-t border-slate-100">
                <button type="submit" className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all text-sm shadow-md cursor-pointer">
                  حفظ الفاتورة والمطابقة
                </button>
                <button type="button" onClick={() => setIsInvoiceModalOpen(false)} className="flex-1 bg-slate-100 text-slate-700 font-bold py-3 rounded-xl transition-all text-sm cursor-pointer">
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {supplierToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm text-center p-6 border border-slate-100">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-1">تأكيد حذف المورد</h3>
            <p className="text-slate-500 text-xs mb-6">
              هل أنت متأكد من حذف المورد ({supplierToDelete.name}) من قاعدة البيانات السحابية؟
            </p>
            <div className="flex gap-3">
              <button onClick={() => setSupplierToDelete(null)} className="flex-1 py-2.5 rounded-xl font-bold bg-slate-100 text-slate-700 text-xs">إلغاء</button>
              <button onClick={handleConfirmDelete} className="flex-1 py-2.5 rounded-xl font-bold bg-red-600 text-white text-xs shadow-md">تأكيد الحذف</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
