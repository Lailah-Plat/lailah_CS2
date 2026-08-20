import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutGrid, Crown, Theater, Armchair, Sliders, 
  Printer, Check, AlertTriangle, Users, Sparkles, Box
} from 'lucide-react';

interface FloorPlanBuilderProps {
  halls?: any[];
  showNotification?: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const FloorPlanBuilder: React.FC<FloorPlanBuilderProps> = ({
  halls = [],
  showNotification
}) => {
  const [selectedHall, setSelectedHall] = useState<string>(halls[0]?.name || 'قاعة الثريا الكبرى');
  const [layoutModel, setLayoutModel] = useState<'royal' | 'theater' | 'ushape' | 'banquet'>('royal');
  
  // Interactive Sliders
  const [tableCount, setTableCount] = useState<number>(24);
  const [seatsPerTable, setSeatsPerTable] = useState<number>(10);
  const [vipSeats, setVipSeats] = useState<number>(30);
  const [maxHallCapacity] = useState<number>(300);

  const totalCalculatedCapacity = (tableCount * seatsPerTable) + vipSeats;
  const isOverCapacity = totalCalculatedCapacity > maxHallCapacity;

  const handlePrintPlan = () => {
    if (showNotification) {
      showNotification('success', `جاري إصدار طباعة بطاقة المخطط الميداني للقاعة (${selectedHall}) مع كافة التوجيهات لطاقم التجهيز.`);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
      
      {/* Top Title & Print Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-amber-500 uppercase tracking-wider">360° Floor Plan Builder</span>
            <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-full font-bold">رسم ميداني تفاعلي</span>
          </div>
          <h3 className="text-lg font-black text-slate-900 mt-0.5">مخطط القاعة وتوزيع الطاولات الميداني</h3>
        </div>

        <button 
          onClick={handlePrintPlan}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer shadow-sm"
        >
          <Printer className="w-4 h-4 text-amber-400" />
          طباعة المخطط للطاقم الميداني
        </button>
      </div>

      {/* Seating Model Tabs */}
      <div className="space-y-3">
        <label className="text-xs font-black text-slate-700 uppercase tracking-wider block">
          نمط ورسم توزيع المقاعد:
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => setLayoutModel('royal')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
              layoutModel === 'royal' 
                ? 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-400/20' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-black">
              <Crown className="w-4 h-4 text-amber-600" />
              توزيع ملكي كلاسيك 👑
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">طاولات دائرية + كنب VIP للمناسبات الفاخرة</p>
          </button>

          <button
            onClick={() => setLayoutModel('theater')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
              layoutModel === 'theater' 
                ? 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-400/20' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-black">
              <Theater className="w-4 h-4 text-indigo-600" />
              مسرحي سينمائي 🎭
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">صفوف متدرجة للمؤتمرات والندوات</p>
          </button>

          <button
            onClick={() => setLayoutModel('ushape')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
              layoutModel === 'ushape' 
                ? 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-400/20' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-black">
              <Armchair className="w-4 h-4 text-purple-600" />
              هجين U-Shape 🛋️
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">جلسات دائرية وكنب محيط للمناسبات الخاصة</p>
          </button>

          <button
            onClick={() => setLayoutModel('banquet')}
            className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
              layoutModel === 'banquet' 
                ? 'bg-amber-50 border-amber-500 text-slate-900 shadow-sm ring-2 ring-amber-400/20' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-black">
              <LayoutGrid className="w-4 h-4 text-emerald-600" />
              طاولات مستطيلة 📐
            </div>
            <p className="text-[10px] text-slate-500 font-medium mt-1">مآدب العشاء والمناسبات الرسمية</p>
          </button>
        </div>
      </div>

      {/* Sliders & Capacity Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-slate-50 p-5 rounded-2xl border border-slate-200">
        
        {/* Slider 1: Table Count */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-black text-slate-700">
            <span>عدد الطاولات الرئيسي:</span>
            <span className="text-indigo-600 font-mono text-sm">{tableCount} طاولة</span>
          </div>
          <input 
            type="range" min="4" max="40" step="1" 
            value={tableCount} 
            onChange={(e) => setTableCount(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Slider 2: Seats per Table */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-black text-slate-700">
            <span>مقاعد كل طاولة:</span>
            <span className="text-indigo-600 font-mono text-sm">{seatsPerTable} مقعد/طاولة</span>
          </div>
          <input 
            type="range" min="4" max="14" step="1" 
            value={seatsPerTable} 
            onChange={(e) => setSeatsPerTable(Number(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Slider 3: VIP Seats */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs font-black text-slate-700">
            <span>مقاعد كنب الـ VIP الأمامية:</span>
            <span className="text-amber-600 font-mono text-sm">{vipSeats} مقعد</span>
          </div>
          <input 
            type="range" min="10" max="80" step="5" 
            value={vipSeats} 
            onChange={(e) => setVipSeats(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
        </div>

      </div>

      {/* Capacity Alert Banner */}
      <div className={`p-4 rounded-2xl flex items-center justify-between text-xs font-bold ${
        isOverCapacity 
          ? 'bg-rose-50 text-rose-800 border border-rose-200' 
          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
      }`}>
        <div className="flex items-center gap-2">
          {isOverCapacity ? <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" /> : <Users className="w-5 h-5 text-emerald-600 shrink-0" />}
          <span>
            {isOverCapacity 
              ? `تحذير السعة: المجموع المخطط (${totalCalculatedCapacity} ضيف) يتجاوز طاقة القاعة الاستيعابية القصوى (${maxHallCapacity} ضيف).`
              : `السعة الإجمالية المخططة: ${totalCalculatedCapacity} ضيف (ضمن الحدود المسموحة للقاعة حتى ${maxHallCapacity} ضيف).`
            }
          </span>
        </div>
        <span className="font-mono text-sm font-black">
          {totalCalculatedCapacity} / {maxHallCapacity}
        </span>
      </div>

      {/* Live 2D Stage Canvas Graphic */}
      <div className="bg-slate-900 rounded-3xl p-6 text-white space-y-6 relative overflow-hidden border border-slate-800">
        
        {/* Stage / Kosha Area Header */}
        <div className="w-full bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 text-center py-3 rounded-2xl font-black text-sm shadow-md uppercase tracking-wider flex items-center justify-center gap-2">
          <Crown className="w-4 h-4" />
          منطقة الكوشة والمسرح الرئيسي (Main Stage & Kosha Area)
          <Crown className="w-4 h-4" />
        </div>

        {/* Kosha Walkway / Zaffa Lane */}
        <div className="w-24 mx-auto bg-amber-400/20 border-x-2 border-dashed border-amber-400/40 text-amber-300 text-[10px] text-center py-6 font-mono font-bold uppercase">
          ممر الزفة الشرفي 👑
        </div>

        {/* VIP First Row Sofas */}
        <div className="bg-white/5 border border-white/10 p-3 rounded-2xl text-center space-y-2">
          <span className="text-amber-400 text-xs font-bold block">صف الجلسات الكلاسيكية كنب الـ VIP الأمامي ({vipSeats} مقعد)</span>
          <div className="flex justify-center gap-2 flex-wrap">
            {Array.from({ length: Math.min(vipSeats / 5, 8) }).map((_, i) => (
              <div key={i} className="px-3 py-1.5 bg-amber-500/20 text-amber-300 rounded-xl border border-amber-500/30 text-[10px] font-bold">
                🛋️ كنب VIP #{i + 1}
              </div>
            ))}
          </div>
        </div>

        {/* Guest Table Grid Representation */}
        <div className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-3">
          <span className="text-indigo-300 text-xs font-bold block text-center">شبكة الطاولات الرئيسية ({tableCount} طاولة × {seatsPerTable} مقاعد)</span>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-3">
            {Array.from({ length: Math.min(tableCount, 24) }).map((_, i) => (
              <div key={i} className="bg-indigo-950/80 border border-indigo-500/30 p-2.5 rounded-2xl text-center hover:border-amber-400 transition-all">
                <span className="text-amber-400 font-mono text-[10px] font-black block">طاولة #{i + 1}</span>
                <span className="text-[9px] text-slate-300 font-medium block">{seatsPerTable} مقاعد</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Zones: Audio Booth & Open Buffet */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="bg-indigo-900/40 border border-indigo-500/30 p-3 rounded-2xl text-center">
            <span className="text-indigo-300 text-xs font-bold block">🎧 كابينة التحكم بالصوت والدي جي</span>
            <span className="text-[10px] text-slate-400 block">موقع استراتيجي خلفي متصل بالمسرح</span>
          </div>

          <div className="bg-amber-900/40 border border-amber-500/30 p-3 rounded-2xl text-center">
            <span className="text-amber-300 text-xs font-bold block">🍽️ جناح البوفيه المفتوح والضيافة</span>
            <span className="text-[10px] text-slate-400 block">مدخل ومخرج مستقل لخدمة الضيوف سلسة</span>
          </div>
        </div>

      </div>

    </div>
  );
};
