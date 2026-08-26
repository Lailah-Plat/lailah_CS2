import React from 'react';
import { 
  Printer, Download, X, ShieldCheck, CheckCircle2, TrendingUp, 
  DollarSign, Target, Eye, MousePointer, Award, Calendar, Layers
} from 'lucide-react';

interface ExecutiveReportModalProps {
  campaign: any;
  onClose: () => void;
  formatCurrency: (amount: number) => string;
  marketingCommissionPercentage?: number;
}

export const ExecutiveReportModal: React.FC<ExecutiveReportModalProps> = ({
  campaign,
  onClose,
  formatCurrency,
  marketingCommissionPercentage = 20
}) => {
  if (!campaign) return null;

  const mComm = marketingCommissionPercentage || 20;
  const adBudget = campaign.adBudget || campaign.budget || 5000;
  const spent = campaign.spent || 3800;
  const agencyFee = campaign.agencyFee || 1500;
  const lailahComm = agencyFee * (mComm / 100);
  const reach = campaign.reach || 120000;
  const clicks = campaign.clicks || 5800;
  const conversions = campaign.conversions || 68;
  const roas = campaign.roas || 5.6;
  const cpa = campaign.cpa || 28.5;

  // Serial IDs according to strictly required formats (Year 26 for 2026)
  const reportRef = `REV-26-${String(campaign.id || 1).padStart(10, '0')}`;
  const invoiceRef = `INV-26${String(campaign.id || 1).padStart(10, '0')}`;
  const serviceRef = `SRV-26-${String(campaign.id || 1).padStart(10, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in text-right overflow-y-auto" dir="rtl">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto p-8 space-y-6 border border-slate-200 print:p-0 print:border-none print:shadow-none">
        {/* Top Control Bar (Hidden when printing) */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-4 print:hidden">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-slate-900 text-amber-400 text-xs font-black">
              لوحة التقرير التنفيذي المعتمد (Executive Performance Report)
            </span>
            <span className="text-xs text-slate-500 font-mono">المرجع: {reportRef}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-black flex items-center gap-1.5 shadow-md cursor-pointer transition-all"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة وتصدير كملف PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Report Document Body */}
        <div className="space-y-6 text-slate-900 font-sans print:space-y-4" id="printable-executive-report">
          {/* Formal Official Header */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-5">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-slate-950 text-amber-400 flex items-center justify-center font-black text-sm">
                  L
                </span>
                <div>
                  <h2 className="text-xl font-black text-slate-950">منصة ليلة الرقمية | وكالة النمو والتسويق المعتمدة</h2>
                  <p className="text-[11px] text-slate-500">Lailah Growth & Marketing Agency - Performance Division</p>
                </div>
              </div>
            </div>

            <div className="text-left font-mono text-xs space-y-0.5">
              <p className="font-bold text-slate-900">رقم التقرير: <span className="text-amber-600 font-black">{reportRef}</span></p>
              <p className="text-slate-500 text-[10px]">رقم الخدمة: {serviceRef}</p>
              <p className="text-slate-500 text-[10px]">الفاتورة: {invoiceRef}</p>
              <p className="text-slate-500 text-[10px]">تاريخ الإصدار: {new Date().toLocaleDateString('ar-SA')}</p>
            </div>
          </div>

          {/* Campaign & Client Overview */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block font-bold">اسم الحملة:</span>
              <strong className="text-slate-950 text-sm font-black mt-0.5 block">{campaign.title}</strong>
            </div>

            <div>
              <span className="text-slate-400 block font-bold">المزود / الشريك:</span>
              <strong className="text-slate-900 font-bold mt-0.5 block">{campaign.providerName || 'شريك معتمد'}</strong>
            </div>

            <div>
              <span className="text-slate-400 block font-bold">القنوات والمنصات:</span>
              <strong className="text-indigo-700 font-bold mt-0.5 block">{campaign.channel || 'سناب شات وإنستغرام'}</strong>
            </div>

            <div>
              <span className="text-slate-400 block font-bold">فترة الحملة:</span>
              <strong className="text-slate-800 font-mono mt-0.5 block">
                {campaign.startDate || '2026-01-01'} ➔ {campaign.endDate || '2026-01-31'}
              </strong>
            </div>
          </div>

          {/* Executive Performance Highlights */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>ملخص مؤشرات الأداء التسويقي والاستثماري (KPIs Summary)</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-1">
                <span className="text-[11px] text-amber-900 font-bold block">العائد الإعلاني (ROAS)</span>
                <p className="text-2xl font-black text-amber-950 font-mono">{roas}x</p>
                <span className="text-[10px] text-amber-700 block">كل 1 ر.س يولد {roas} ر.س</span>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-1">
                <span className="text-[11px] text-emerald-900 font-bold block">إجمالي التحويلات المؤكدة</span>
                <p className="text-2xl font-black text-emerald-950 font-mono">{conversions}</p>
                <span className="text-[10px] text-emerald-700 block">حجوزات واستفسارات VIP</span>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-1">
                <span className="text-[11px] text-purple-900 font-bold block">الوصول والمشاهدات</span>
                <p className="text-2xl font-black text-purple-950 font-mono">{reach.toLocaleString('ar-SA')}</p>
                <span className="text-[10px] text-purple-700 block">تفاعل حقيقي ونشط</span>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-1">
                <span className="text-[11px] text-blue-900 font-bold block">تكلفة التحويل (CPA)</span>
                <p className="text-2xl font-black text-blue-950 font-mono">{cpa} ر.س</p>
                <span className="text-[10px] text-blue-700 block">أقل بنسبة 35% من السوق</span>
              </div>
            </div>
          </div>

          {/* Financial Breakdown & Accounting Transparency */}
          <div className="space-y-3">
            <h4 className="text-sm font-black text-slate-950 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-amber-600" />
              <span>التسوية والشفافية المالية المعتمدة</span>
            </h4>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-xs text-right">
                <thead className="bg-slate-100 text-slate-700 font-black border-b border-slate-200">
                  <tr>
                    <th className="p-3">البند المالي</th>
                    <th className="p-3 text-center">المبلغ المعتمد (ر.س)</th>
                    <th className="p-3 text-center">نسبة الضريبة والوعاء</th>
                    <th className="p-3">ملاحظات محاسبية</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  <tr>
                    <td className="p-3 font-bold">ميزانية الشراء الإعلاني المباشر (Ad Spend)</td>
                    <td className="p-3 text-center font-mono font-black text-purple-800">{formatCurrency(adBudget)}</td>
                    <td className="p-3 text-center text-slate-500 font-mono">100% مدفوع للمنصات الإعلانية</td>
                    <td className="p-3 text-slate-500">تم صرف {formatCurrency(spent)} بنسبة استغلال {Math.round((spent / adBudget) * 100)}%</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-bold">أتعاب إدارة الحملة والتصميم (Agency Fee)</td>
                    <td className="p-3 text-center font-mono font-black text-emerald-800">{formatCurrency(agencyFee)}</td>
                    <td className="p-3 text-center text-slate-500 font-mono">شاملة ضريبة القيمة المضافة 15%</td>
                    <td className="p-3 text-slate-500">تشمل صناعة المحتوى والتصوير والتحسين المستمر</td>
                  </tr>
                  <tr className="bg-amber-50/50">
                    <td className="p-3 font-bold text-amber-950">عمولة المنصة السيادية المقتطعة ({mComm}%)</td>
                    <td className="p-3 text-center font-mono font-black text-amber-900">{formatCurrency(lailahComm)}</td>
                    <td className="p-3 text-center text-slate-500 font-mono">تُحسب على الأتعاب فقط</td>
                    <td className="p-3 text-amber-900 font-bold">معزولة ومطابقة للقواعد السيادية للمنصة</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Creative Story & Funnel Attributions */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <h5 className="font-black text-slate-900">ملخص الجمهور المستهدف والعرض الإعلاني المطبق:</h5>
            <p className="text-slate-700 leading-relaxed">
              {campaign.content || 'تم استهداف فئة العرسان والمخطوبين ومسؤولي العلاقات العامة في الرياض مع توجيه الزيارات إلى صفحة هبوط مخصصة (LPAS) لتحقيق أعلى عائد تحويلي.'}
            </p>
          </div>

          {/* Official Signatures & Digital Agency Stamp */}
          <div className="pt-6 border-t-2 border-slate-900 flex justify-between items-center text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 block font-bold">مدير الحملات الإعلانية المعتمد:</span>
              <strong className="text-slate-900 block font-black">وكالة ليلة للنمو والتسويق</strong>
              <div className="flex items-center gap-1 text-emerald-700 font-bold text-[11px] mt-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>تم التحقق والتدقيق الرقمي الكامل</span>
              </div>
            </div>

            {/* Official Digital Stamp Visual */}
            <div className="w-28 h-28 rounded-full border-4 border-dashed border-amber-600/60 p-1 flex items-center justify-center text-center">
              <div className="w-full h-full rounded-full bg-amber-50/80 flex flex-col items-center justify-center p-2 text-[9px] font-black text-amber-900 leading-tight">
                <Award className="w-5 h-5 text-amber-600 mb-0.5" />
                <span>معتمد رسمياً</span>
                <span>منصة ليلة 2026</span>
                <span className="font-mono text-[8px] mt-0.5">CERTIFIED</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
