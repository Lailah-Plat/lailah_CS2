import React, { useState } from 'react';
import { 
  QrCode, UserCheck, Users, ShieldAlert, Sparkles, Search, 
  CheckCircle2, BellRing, ArrowUpRight, Smartphone, MapPin, BadgeCheck
} from 'lucide-react';

export interface CheckedGuest {
  id: string;
  ticketCode: string;
  guestName: string;
  category: 'VIP' | 'Regular' | 'Family';
  tableNo: string;
  checkInTime: string;
  isVip: boolean;
}

export interface GuestGateQRProps {
  hallCapacity?: number;
  maxGuests?: number;
}

export const GuestGateQR: React.FC<GuestGateQRProps> = ({
  hallCapacity = 350
}) => {
  const [searchInput, setSearchInput] = useState('');
  const [lastCheckInAlert, setLastCheckInAlert] = useState<CheckedGuest | null>({
    id: 'gst-101',
    ticketCode: 'BKG-26-0000000001-GST101',
    guestName: 'الشيخ عبدالرحمن بن سلمان آل سعود',
    category: 'VIP',
    tableNo: 'طاولة الملكي (Table 01)',
    checkInTime: '06:15 PM',
    isVip: true
  });

  const [guestList, setGuestList] = useState<CheckedGuest[]>([
    {
      id: 'gst-101',
      ticketCode: 'BKG-26-0000000001-GST101',
      guestName: 'الشيخ عبدالرحمن بن سلمان آل سعود',
      category: 'VIP',
      tableNo: 'طاولة الملكي (Table 01)',
      checkInTime: '06:15 PM',
      isVip: true
    },
    {
      id: 'gst-102',
      ticketCode: 'BKG-26-0000000001-GST102',
      guestName: 'سعود بن محمد الدوسري',
      category: 'Family',
      tableNo: 'طاولة العائلة (Table 04)',
      checkInTime: '06:10 PM',
      isVip: false
    },
    {
      id: 'gst-103',
      ticketCode: 'BKG-26-0000000001-GST103',
      guestName: 'د. خالد بن إبراهيم القحطاني',
      category: 'VIP',
      tableNo: 'طاولة كبار الشخصيات (Table 02)',
      checkInTime: '06:05 PM',
      isVip: true
    },
    {
      id: 'gst-104',
      ticketCode: 'BKG-26-0000000001-GST104',
      guestName: 'عبدالعزيز بن فهد المطيري',
      category: 'Regular',
      tableNo: 'طاولة 08',
      checkInTime: '05:50 PM',
      isVip: false
    }
  ]);

  const [totalEnteredCount, setTotalEnteredCount] = useState<number>(215);

  const handleSimulateScan = () => {
    const isVipNew = Math.random() > 0.5;
    const newGuest: CheckedGuest = {
      id: `gst-${Date.now()}`,
      ticketCode: searchInput || `BKG-26-0000000001-GST${Math.floor(100 + Math.random() * 800)}`,
      guestName: searchInput ? searchInput : (isVipNew ? 'معالي المستشار طارق بن زياد' : 'سلطان بن عبيد الشمري'),
      category: isVipNew ? 'VIP' : 'Regular',
      tableNo: isVipNew ? 'طاولة المنصة الرئيسية (Table VIP)' : `طاولة ${Math.floor(1 + Math.random() * 15)}`,
      checkInTime: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
      isVip: isVipNew
    };

    setGuestList(prev => [newGuest, ...prev]);
    setTotalEnteredCount(prev => prev + 1);
    setLastCheckInAlert(newGuest);
    setSearchInput('');
  };

  const occupancyRatio = Math.round((totalEnteredCount / hallCapacity) * 100);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" dir="rtl">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <QrCode className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900">شاشة الاستقبال وبوابة الحضور السريعة (Guest Gate & QR Check-in)</h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">مسح تذاكر الضيوف، العداد المباشر لحضور القاعة، وإشعارات وصول كبار الشخصيات</p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs font-black bg-slate-900 text-white px-3.5 py-2 rounded-2xl">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>GATE ACTIVE: FRONT ENTRANCE #1</span>
        </div>
      </div>

      {/* Capacity & Occupancy Meter */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 rounded-2xl text-white space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-300">عداد الحضور الفعلي الآن</span>
            <Users className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-emerald-400">{totalEnteredCount}</span>
            <span className="text-xs text-slate-400 font-bold">من أصل {hallCapacity} ضيف مدعو</span>
          </div>
          <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
            <div className="bg-emerald-400 h-full rounded-full transition-all duration-300" style={{ width: `${occupancyRatio}%` }}></div>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl text-indigo-950 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-indigo-900">
            <span>نسبة إشغال المقاعد والقاعة</span>
            <UserCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-3xl font-mono font-black text-indigo-700">{occupancyRatio}%</div>
          <p className="text-[11px] font-bold text-indigo-600">الطاقة الاستيعابية آمنة ومريحة</p>
        </div>

        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl text-amber-950 space-y-2">
          <div className="flex justify-between items-center text-xs font-bold text-amber-900">
            <span>حضور كبار الشخصيات (VIP)</span>
            <Sparkles className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-3xl font-mono font-black text-amber-700">
            {guestList.filter(g => g.isVip).length} ضيوف
          </div>
          <p className="text-[11px] font-bold text-amber-700">تم تجهيز الضيافة الملكية في طاولة المنصة</p>
        </div>
      </div>

      {/* Instant VIP Arrival Banner */}
      {lastCheckInAlert && lastCheckInAlert.isVip && (
        <div className="p-4 bg-amber-500/10 border-2 border-amber-400 rounded-2xl flex justify-between items-center flex-wrap gap-3 animate-in fade-in zoom-in duration-200">
          <div className="flex items-center gap-3">
            <span className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black animate-bounce shadow-md">
              <BellRing className="w-5 h-5" />
            </span>
            <div>
              <span className="text-[10px] font-black text-amber-800 bg-amber-200 px-2.5 py-0.5 rounded-full block w-fit mb-0.5">
                تنبيه حرج: وصول ضيف رفيع المستوى (VIP Alert)
              </span>
              <h4 className="text-sm font-black text-amber-950">{lastCheckInAlert.guestName}</h4>
              <p className="text-xs font-bold text-amber-800">
                التأطير: {lastCheckInAlert.tableNo} | توقيت الدخول: {lastCheckInAlert.checkInTime}
              </p>
            </div>
          </div>

          <button 
            onClick={() => setLastCheckInAlert(null)}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-xs"
          >
            تأكيد إشعار المشرف
          </button>
        </div>
      )}

      {/* QR Scanner & Manual Lookup Box */}
      <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
        <h4 className="text-xs font-black text-slate-800 flex items-center gap-2">
          <QrCode className="w-4 h-4 text-indigo-600" />
          <span>المسح الضوئي للتذكرة أو البحث برقم الدعوة / الاسم</span>
        </h4>

        <div className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="ادخل رقم التذكرة QR أو اسم الضيف..."
            className="flex-1 text-xs font-bold text-right p-3.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:border-indigo-500 shadow-xs"
          />
          <button
            onClick={handleSimulateScan}
            className="px-5 py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <CheckCircle2 className="w-4 h-4" /> تأكيد دخول الضيف
          </button>
        </div>
      </div>

      {/* Guest Check-in Log Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-800">سجل الدخول المباشر (Recent Entry Log)</h4>
        
        <div className="border border-slate-100 rounded-2xl overflow-hidden">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 font-black text-slate-700">
              <tr>
                <th className="p-3">رمز التذكرة</th>
                <th className="p-3">اسم الضيف</th>
                <th className="p-3">التصنيف</th>
                <th className="p-3">الطاولة المخصصة</th>
                <th className="p-3">وقت الدخول</th>
                <th className="p-3">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-bold">
              {guestList.map(g => (
                <tr key={g.id} className={g.isVip ? 'bg-amber-50/40' : 'hover:bg-slate-50'}>
                  <td className="p-3 font-mono text-indigo-600">{g.ticketCode}</td>
                  <td className="p-3 font-black text-slate-900">{g.guestName}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black border ${
                      g.isVip 
                        ? 'bg-amber-100 text-amber-800 border-amber-200' 
                        : 'bg-indigo-50 text-indigo-700 border-indigo-100'
                    }`}>
                      {g.category}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700">{g.tableNo}</td>
                  <td className="p-3 font-mono text-slate-500">{g.checkInTime}</td>
                  <td className="p-3 text-emerald-600 font-black flex items-center gap-1">
                    <BadgeCheck className="w-4 h-4" /> تم الدخول
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
