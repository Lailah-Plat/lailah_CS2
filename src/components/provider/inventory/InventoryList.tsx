import React, { useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Plus, 
  Search, 
  Filter, 
  Boxes, 
  CheckCircle2, 
  RotateCw 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minThreshold: number;
  unit: string;
  unitCost: number;
  status: 'optimal' | 'low' | 'critical';
}

interface InventoryListProps {
  items?: InventoryItem[];
  onRestock?: (itemId: string) => void;
  onAddItem?: () => void;
}

export const InventoryList: React.FC<InventoryListProps> = ({
  items = [
    { id: 'INV-SKU-001', name: 'أطقم كاسات كريستال VIP', category: 'ضيافة وأواني', quantity: 240, minThreshold: 100, unit: 'طقم', unitCost: 45, status: 'optimal' },
    { id: 'INV-SKU-002', name: 'مفارش طاولات حرير ملكي أوف وايت', category: 'مفروشات وديكور', quantity: 35, minThreshold: 50, unit: 'قطعة', unitCost: 120, status: 'low' },
    { id: 'INV-SKU-003', name: 'فواحات وبخور عود معطر فاخر', category: 'مستهلكات معطرة', quantity: 8, minThreshold: 20, unit: 'عبوة', unitCost: 250, status: 'critical' },
    { id: 'INV-SKU-004', name: 'أجهزة ميكروفونات لاسلكية Shure', category: 'صوتيات وتقنية', quantity: 12, minThreshold: 6, unit: 'جهاز', unitCost: 800, status: 'optimal' },
    { id: 'INV-SKU-005', name: 'شموع إضاءة ليد إلكترونية آمنة', category: 'إضاءة وديكور', quantity: 150, minThreshold: 80, unit: 'قطعة', unitCost: 15, status: 'optimal' },
  ],
  onRestock,
  onAddItem,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  const filteredItems = items.filter((item) => {
    const matchesSearch = item.name.includes(searchTerm) || item.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'all' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      {/* Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Boxes className="w-4 h-4 text-indigo-600" />
            <span>سجل المخزون ومستلزمات القاعة ({filteredItems.length})</span>
          </h3>
          <p className="text-[10px] text-slate-400">إدارة العهد، المستهلكات، والتجهيزات اللوجستية</p>
        </div>

        <div className="flex items-center gap-2">
          {onAddItem && (
            <button
              onClick={onAddItem}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة صنف</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 absolute right-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="البحث باسم الصنف أو رمز SKU..."
            className="w-full text-xs font-bold pr-8 pl-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="text-xs font-bold px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
        >
          <option value="all">كافة التصنيفات</option>
          <option value="ضيافة وأواني">ضيافة وأواني</option>
          <option value="مفروشات وديكور">مفروشات وديكور</option>
          <option value="مستهلكات معطرة">مستهلكات معطرة</option>
          <option value="صوتيات وتقنية">صوتيات وتقنية</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-right text-xs">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="p-3 font-black">رمز SKU</th>
              <th className="p-3 font-black">اسم الصنف والتصنيف</th>
              <th className="p-3 font-black">الكمية المتوفرة</th>
              <th className="p-3 font-black">حد إعادة الطلب</th>
              <th className="p-3 font-black">تكلفة الوحدة</th>
              <th className="p-3 font-black text-center">حالة المخزون</th>
              <th className="p-3 font-black text-center">الإجراء</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredItems.map((item) => {
              const isLow = item.status === 'low';
              const isCritical = item.status === 'critical';

              return (
                <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">
                    {item.id}
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-slate-800 dark:text-slate-200 block">{item.name}</span>
                    <span className="text-[10px] text-slate-400 block">{item.category}</span>
                  </td>
                  <td className="p-3 font-mono font-black text-slate-800 dark:text-slate-200">
                    {item.quantity} {item.unit}
                  </td>
                  <td className="p-3 font-mono text-slate-500">
                    {item.minThreshold} {item.unit}
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                    {formatCurrency(item.unitCost)}
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      isCritical
                        ? 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                        : isLow
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-900'
                        : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                    }`}>
                      {isCritical ? 'حرج جداً' : isLow ? 'منخفض' : 'متوفر ومثالي'}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {(isLow || isCritical) && (
                      <button
                        onClick={() => onRestock && onRestock(item.id)}
                        className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 rounded-lg text-[10px] font-black flex items-center gap-1 mx-auto transition-all cursor-pointer"
                      >
                        <RotateCw className="w-3 h-3" />
                        <span>طلب توريد</span>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
