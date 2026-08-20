import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Building2, Percent, TrendingUp, Wallet, ShieldCheck, 
  Clock, CheckCircle2, XCircle, ArrowUpRight, ArrowDownRight, 
  Filter, Award, DollarSign, RefreshCw, AlertCircle
} from 'lucide-react';

interface LiveKpiCockpitProps {
  myBookings: any[];
  myServiceRequests?: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onFilterClick?: (status: string) => void;
}

export const LiveKpiCockpit: React.FC<LiveKpiCockpitProps> = ({
  myBookings,
  myServiceRequests = [],
  showNotification,
  onFilterClick
}) => {
  const [settlementFilter, setSettlementFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // Calculate metrics
  const confirmedBookings = myBookings.filter(b => 
    ['مؤكد', 'مكتمل', 'موافق', 'مقبول', 'قيد التنفيذ', 'جاري التنفيذ'].includes(b.status)
  );

  const totalBookingRevenue = confirmedBookings.reduce((sum, b) => sum + (Number(b.price || b.amount || b.totalPrice || 0)), 0);
  const aov = confirmedBookings.length > 0 ? Math.round(totalBookingRevenue / confirmedBookings.length) : 0;

  // Occupancy rate calculation (booked nights / 30)
  const bookedNightsCount = confirmedBookings.length;
  const occupancyRate = Math.min(Math.round((bookedNightsCount / 30) * 100), 100);

  // Escrow balance (25% downpayments)
  const escrowBalance = Math.round(totalBookingRevenue * 0.25);

  // Pending settlements
  const initialSettlements = [
    { id: 'SET-26-001', bkgId: 'BKG-26-0000000012', clientName: 'فهد العتيبي', amount: 18500, date: '2026-08-14', status: 'pending' },
    { id: 'SET-26-002', bkgId: 'BKG-26-0000000018', clientName: 'م. سلمان القحطاني', amount: 24000, date: '2026-08-15', status: 'pending' },
    { id: 'SET-26-003', bkgId: 'SRV-26-0000000005', clientName: 'نورة الشمري', amount: 4500, date: '2026-08-16', status: 'approved' },
  ];

  const [settlements, setSettlements] = useState(initialSettlements);

  const handleApproveSettlement = (id: string, bkgId: string, amount: number) => {
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'approved' } : s));
    showNotification('success', `تمت الموافقة على تصفية الحجز (${bkgId}) وتحويل المبلغ الصافي (${(amount * 0.9).toLocaleString()} ر.س) إلى محفظتك.`);
  };

  const handleRejectSettlement = (id: string, bkgId: string) => {
    setSettlements(prev => prev.map(s => s.id === id ? { ...s, status: 'rejected' } : s));
    showNotification('warning', `تم تعليق تصفية الحجز (${bkgId}) لإجراء مراجعة إضافية مع العميل.`);
  };

  const filteredSettlements = settlements.filter(s => {
    if (settlementFilter === 'all') return true;
    return s.status === settlementFilter;
  });

  return (
    <div className="space-y-6">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* Card 1: Occupancy Rate */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all relative overflow-hidden"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
              <Percent className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
              <ArrowUpRight className="w-3 h-3" /> +12% مقارنة بالشهر السابق
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs text-slate-500 font-bold">معدل إشغال القاعات (30 يوماً)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black text-slate-900">{occupancyRate}%</span>
              <span className="text-xs text-slate-400 font-bold">({bookedNightsCount} ليلة محجوزة)</span>
            </div>

            {/* Gradient Progress Bar */}
            <div className="w-full h-2.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${occupancyRate}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Card 2: Average Order Value (AOV) */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
              <TrendingUp className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-indigo-50 text-indigo-700 font-bold px-2.5 py-1 rounded-full border border-indigo-200">
              شامل الباقات والخدمات
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs text-slate-500 font-bold">متوسط قيمة الحجز (AOV)</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black text-slate-900">{aov.toLocaleString()}</span>
              <span className="text-xs text-slate-500 font-bold">ر.س / حفل</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              محسوب من إجمالي {confirmedBookings.length} حجز مؤكد
            </p>
          </div>
        </motion.div>

        {/* Card 3: Escrow & Guarantees Balance */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-emerald-100/60 text-emerald-800 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
              محمي بحساب الضمان 🛡️
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs text-slate-500 font-bold">رصيد العرابين والضمان المالي</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black text-emerald-600">{escrowBalance.toLocaleString()}</span>
              <span className="text-xs text-emerald-700 font-bold">ر.س</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              يصرف تلقائياً لمحفظتك فور ختام المناسبة
            </p>
          </div>
        </motion.div>

        {/* Card 4: Pending Settlements Count */}
        <motion.div 
          whileHover={{ y: -3 }}
          className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex justify-between items-start">
            <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
              <Clock className="w-6 h-6" />
            </div>
            <span className="text-[10px] bg-purple-100 text-purple-700 font-bold px-2.5 py-1 rounded-full border border-purple-200">
              تصفية سريعة
            </span>
          </div>

          <div className="mt-4">
            <p className="text-xs text-slate-500 font-bold">التسويات المالية المعلقة</p>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl md:text-3xl font-black text-purple-900">
                {settlements.filter(s => s.status === 'pending').length}
              </span>
              <span className="text-xs text-purple-600 font-bold">طلبات بانتظار الاعتماد</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-2 font-medium">
              اكتملت مناسباتها وجاهزة للصرف
            </p>
          </div>
        </motion.div>

      </div>

      {/* Pending Settlements Filterable List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-indigo-600" />
              قائمة التسويات والطلبات الميدانية بانتظار القرار
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">
              اعتماد الفواتير والتسويات المالية بنقرة واحدة بعد المراجعة
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              onClick={() => setSettlementFilter('all')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                settlementFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              الكل
            </button>
            <button
              onClick={() => setSettlementFilter('pending')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                settlementFilter === 'pending' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              معلقة
            </button>
            <button
              onClick={() => setSettlementFilter('approved')}
              className={`px-3 py-1.5 rounded-xl transition-all cursor-pointer ${
                settlementFilter === 'approved' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              معتمدة
            </button>
          </div>
        </div>

        {/* List of settlements */}
        <div className="divide-y divide-slate-100">
          {filteredSettlements.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 font-bold">
              لا توجد تسويات مالية ضمن هذا المفهوم حالياً.
            </div>
          ) : (
            filteredSettlements.map((item) => (
              <div key={item.id} className="py-3.5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-700 font-mono text-xs font-black rounded-xl border border-indigo-100">
                    {item.bkgId}
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">{item.clientName}</h4>
                    <p className="text-xs text-slate-400 font-medium">تاريخ المناسبة: {item.date}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900">{item.amount.toLocaleString()} ر.س</span>
                    <span className="block text-[10px] text-slate-400 font-bold">الصافي بعد العمولة: {(item.amount * 0.9).toLocaleString()} ر.س</span>
                  </div>

                  {item.status === 'pending' ? (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleApproveSettlement(item.id, item.bkgId, item.amount)}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1 cursor-pointer shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> اعتماد الصرف
                      </button>
                      <button
                        onClick={() => handleRejectSettlement(item.id, item.bkgId)}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                      >
                        <XCircle className="w-3.5 h-3.5" /> تعليق
                      </button>
                    </div>
                  ) : (
                    <span className={`px-3 py-1 rounded-xl text-xs font-black ${
                      item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {item.status === 'approved' ? 'تمت الموافقة 🟢' : 'معلق للمراجعة 🔴'}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
