import React, { useState } from 'react';
import { 
  Box, ArrowDownRight, RefreshCw, Send, CheckCircle2, 
  AlertTriangle, Truck, DollarSign, Package, Layers
} from 'lucide-react';

export interface InventoryItem {
  id: string;
  name: string;
  category: string;
  currentStock: number;
  minThreshold: number;
  unit: string;
  defaultSupplier: string;
  status: 'optimal' | 'low' | 'critical';
}

export const AutoStockProcurement: React.FC = () => {
  const [items, setItems] = useState<InventoryItem[]>([
    {
      id: 'inv-1',
      name: 'بخور والعود الملكي الفاخر',
      category: 'ضيافة واستقبال',
      currentStock: 4,
      minThreshold: 10,
      unit: 'كيلوجرام',
      defaultSupplier: 'مؤسسة العود العربي والشرقي',
      status: 'low'
    },
    {
      id: 'inv-2',
      name: 'قهوة سعودية خولانية فاخرة',
      category: 'مشروبات وضيافة',
      currentStock: 25,
      minThreshold: 15,
      unit: 'كيلوجرام',
      defaultSupplier: 'شركة مطاحن القهوة الذهبية',
      status: 'optimal'
    },
    {
      id: 'inv-3',
      name: 'مياه معدنية مصممة باسم المنشأة',
      category: 'استهلاكات عامة',
      currentStock: 150,
      minThreshold: 500,
      unit: 'عبوة',
      defaultSupplier: 'مصنع مياه الصفا الموحد',
      status: 'critical'
    },
    {
      id: 'inv-4',
      name: 'مجموعات الشوكولاتة والحلويات الترحيبية',
      category: 'ضيافة عالي الفخامة',
      currentStock: 12,
      minThreshold: 20,
      unit: 'صندوق',
      defaultSupplier: 'حلويات باتشي والشوكولاتة السويسرية',
      status: 'low'
    }
  ]);

  const triggerAutoPO = (itemId: string) => {
    alert('تم إصدار أمر توريد رقمي (Purchase Order) وتمريره للمورد المعتمد آلياً عبر المنصة!');
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
            <Box className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900">محرك الربط الآلي بين الحجوزات والمخزون والموردين (Auto-Procurement)</h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">خصم المستهلكات تلقائياً مع كل حجز وإصدار أوامر التوريد للموردين قبل النفاذ</p>
          </div>
        </div>

        <button
          onClick={() => alert('تمت مزامنة خصم المخزون مع كافة حجوزات القاعة وطلبات الخدمات المعتمدة!')}
          className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <RefreshCw className="w-4 h-4" /> إعادة مزامنة المخزون
        </button>
      </div>

      {/* Grid of Inventory Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map((item) => (
          <div 
            key={item.id}
            className={`p-5 rounded-2xl border transition-all text-right space-y-3 ${
              item.status === 'critical'
                ? 'bg-rose-50/70 border-rose-200'
                : item.status === 'low'
                  ? 'bg-amber-50/70 border-amber-200'
                  : 'bg-slate-50 border-slate-100'
            }`}
          >
            <div className="flex justify-between items-start gap-2">
              <h4 className="text-xs font-black text-slate-900">{item.name}</h4>
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${
                item.status === 'critical'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : item.status === 'low'
                    ? 'bg-amber-100 text-amber-800 border-amber-200'
                    : 'bg-emerald-100 text-emerald-800 border-emerald-200'
              }`}>
                {item.status === 'critical' ? 'نفاذ حرج 🛑' : item.status === 'low' ? 'منخفض ⚠️' : 'متوفر بوفيرة ✓'}
              </span>
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="text-xs text-slate-500 font-bold">المتبقي بالمخزن:</span>
              <span className="text-xl font-mono font-black text-slate-900">{item.currentStock} {item.unit}</span>
            </div>

            <div className="text-[10px] text-slate-500 font-bold bg-white p-2 rounded-xl border border-slate-100 space-y-1">
              <div>حد التوريد الآلي: <strong className="font-mono text-slate-800">{item.minThreshold} {item.unit}</strong></div>
              <div>المورد المعتمد: <strong className="text-indigo-600">{item.defaultSupplier}</strong></div>
            </div>

            {(item.status === 'low' || item.status === 'critical') && (
              <button
                onClick={() => triggerAutoPO(item.id)}
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <Truck className="w-3.5 h-3.5" /> إصدار أمر توريد رقمي (PO)
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
