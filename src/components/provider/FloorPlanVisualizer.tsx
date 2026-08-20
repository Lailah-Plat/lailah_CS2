import React, { useState } from 'react';
import { 
  LayoutGrid, Plus, Trash2, Move, Share2, Printer, Check, 
  Layers, Users, Sparkles, Box, Info, Shield
} from 'lucide-react';

export interface LayoutElement {
  id: string;
  type: 'round_table' | 'rect_table' | 'stage' | 'buffet' | 'reception' | 'vip_lounge';
  label: string;
  capacity: number;
  x: number; // percentage or px
  y: number;
}

export const FloorPlanVisualizer: React.FC = () => {
  const [elements, setElements] = useState<LayoutElement[]>([
    { id: 'el-1', type: 'stage', label: 'المسرح والكوشة الملكية', capacity: 0, x: 40, y: 5 },
    { id: 'el-2', type: 'round_table', label: 'طاولة 01 (VIP)', capacity: 10, x: 20, y: 30 },
    { id: 'el-3', type: 'round_table', label: 'طاولة 02 (VIP)', capacity: 10, x: 60, y: 30 },
    { id: 'el-4', type: 'round_table', label: 'طاولة 03 (عائلة)', capacity: 10, x: 15, y: 55 },
    { id: 'el-5', type: 'round_table', label: 'طاولة 04 (عائلة)', capacity: 10, x: 65, y: 55 },
    { id: 'el-6', type: 'buffet', label: 'جناح بوفيه الطعام المباشر', capacity: 0, x: 40, y: 80 },
    { id: 'el-7', type: 'reception', label: 'منصة الاستقبال والترحيب', capacity: 0, x: 80, y: 85 }
  ]);

  const [selectedType, setSelectedType] = useState<LayoutElement['type']>('round_table');

  const addElement = () => {
    const newId = `el-${Date.now()}`;
    const labelsMap: Record<LayoutElement['type'], string> = {
      round_table: `طاولة دائرية ${elements.filter(e => e.type === 'round_table').length + 1}`,
      rect_table: `طاولة مستطيلة ${elements.filter(e => e.type === 'rect_table').length + 1}`,
      stage: 'منصة المسرح والكوشة',
      buffet: 'منطقة البوفيه المباشر',
      reception: 'بوابة الاستقبال',
      vip_lounge: 'قسم كبار الشخصيات'
    };

    const capacityMap: Record<LayoutElement['type'], number> = {
      round_table: 10,
      rect_table: 8,
      stage: 0,
      buffet: 0,
      reception: 0,
      vip_lounge: 15
    };

    const newElement: LayoutElement = {
      id: newId,
      type: selectedType,
      label: labelsMap[selectedType],
      capacity: capacityMap[selectedType],
      x: Math.floor(20 + Math.random() * 50),
      y: Math.floor(20 + Math.random() * 50)
    };

    setElements(prev => [...prev, newElement]);
  };

  const removeElement = (id: string) => {
    setElements(prev => prev.filter(e => e.id !== id));
  };

  const totalSeats = elements.reduce((acc, curr) => acc + curr.capacity, 0);
  const totalTables = elements.filter(e => e.type === 'round_table' || e.type === 'rect_table').length;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" dir="rtl">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-purple-50 text-purple-600 border border-purple-100">
            <LayoutGrid className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900">مصمم مخطط الطاولات وتوزيع المقاعد (2D Floor Plan & Seating)</h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">تخطيط مساحة القاعة، توزيع الطاولات والمقاعد ومشاركتها مع العميل والمدخل</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => alert('تم توليد رابط مشاركة المخطط التفاعلي مع العميل بنجاح!')}
            className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer border border-indigo-200"
          >
            <Share2 className="w-4 h-4" /> مشاركة الرابط مع العميل
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer className="w-4 h-4" /> طباعة المخطط
          </button>
        </div>
      </div>

      {/* Control Panel & Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
          <span className="text-xs text-slate-500 font-bold block">إجمالي عدد الطاولات</span>
          <span className="text-2xl font-mono font-black text-slate-900">{totalTables} طاولات</span>
        </div>

        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 space-y-2">
          <span className="text-xs text-emerald-700 font-bold block">إجمالي المقاعد المتاحة</span>
          <span className="text-2xl font-mono font-black text-emerald-800">{totalSeats} مقعداً</span>
        </div>

        <div className="md:col-span-2 bg-indigo-50/70 p-4 rounded-2xl border border-indigo-100 flex items-center justify-between gap-3">
          <div className="space-y-1">
            <span className="text-xs font-black text-indigo-950 block">إضافة عنصر جديد للمخطط:</span>
            <div className="flex items-center gap-2">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="text-xs font-bold text-slate-800 p-2 bg-white border border-slate-200 rounded-xl outline-none"
              >
                <option value="round_table">طاولة دائرية (10 مقاعد)</option>
                <option value="rect_table">طاولة مستطيلة (8 مقاعد)</option>
                <option value="stage">المسرح والكوشة</option>
                <option value="buffet">منطقة البوفيه</option>
                <option value="vip_lounge">جناح VIP</option>
                <option value="reception">منصة الاستقبال</option>
              </select>
              <button
                onClick={addElement}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> إضافة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2D Canvas Area */}
      <div className="relative w-full h-[450px] bg-slate-900 rounded-3xl border-2 border-slate-800 overflow-hidden shadow-inner p-4 flex flex-col justify-between">
        {/* Grid lines overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-40 pointer-events-none"></div>

        {/* Rendered Elements */}
        {elements.map((el) => (
          <div
            key={el.id}
            style={{ left: `${el.x}%`, top: `${el.y}%` }}
            className={`absolute p-3 rounded-2xl shadow-lg border transition-all cursor-move flex flex-col items-center justify-center text-center group ${
              el.type === 'stage'
                ? 'bg-amber-500 text-slate-950 font-black border-amber-300 w-52 h-16'
                : el.type === 'buffet'
                  ? 'bg-indigo-600 text-white font-bold border-indigo-400 w-48 h-14'
                  : el.type === 'vip_lounge'
                    ? 'bg-purple-600 text-white font-bold border-purple-400 w-44 h-14'
                    : 'bg-white text-slate-900 font-bold border-slate-200 w-32 h-20'
            }`}
          >
            <span className="text-[11px] font-black">{el.label}</span>
            {el.capacity > 0 && (
              <span className="text-[10px] opacity-80 mt-0.5 font-mono">({el.capacity} مقاعد)</span>
            )}

            {/* Remove Icon on hover */}
            <button
              onClick={() => removeElement(el.id)}
              className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-rose-600 text-white hidden group-hover:flex items-center justify-center text-[10px] cursor-pointer shadow-md"
              title="حذف العنصر"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          </div>
        ))}

        {/* Canvas Footer */}
        <div className="relative z-10 flex justify-between items-center text-[11px] text-slate-400 font-mono font-bold bg-slate-950/80 p-3 rounded-2xl border border-slate-800">
          <span>LAYOUT CANVAS 2D - LAYLA VENUE SYSTEM</span>
          <span>SCALE: 1:100 | GRID ACCURACY: FULL</span>
        </div>
      </div>
    </div>
  );
};
