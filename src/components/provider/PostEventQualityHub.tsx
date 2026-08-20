import React, { useState } from 'react';
import { 
  Star, HeartPulse, ThumbsUp, MessageCircle, Send, Award, 
  TrendingUp, CheckCircle2, BarChart2, Sparkles, AlertCircle
} from 'lucide-react';

export interface ClientFeedback {
  id: string;
  bookingId: string;
  customerName: string;
  eventName: string;
  eventDate: string;
  overallRating: number; // 1-5
  npsScore: number; // 1-10
  ratings: {
    cleanliness: number;
    staff: number;
    audioVisual: number;
    catering: number;
  };
  comment: string;
  sentiment: 'positive' | 'neutral' | 'negative';
}

export const PostEventQualityHub: React.FC = () => {
  const [feedbacks] = useState<ClientFeedback[]>([
    {
      id: 'fb-1',
      bookingId: 'BKG-26-0000000001',
      customerName: 'عبدالله الدوسري',
      eventName: 'حفل زفاف عائلة الدوسري',
      eventDate: '2026-08-10',
      overallRating: 5,
      npsScore: 10,
      ratings: { cleanliness: 5, staff: 5, audioVisual: 5, catering: 4.8 },
      comment: 'تنظيم مبهر ومستوى ضيافة ملكي راقي، أود أن أشكر الطاقم الميداني على الاحترافية العالية.',
      sentiment: 'positive'
    },
    {
      id: 'fb-2',
      bookingId: 'BKG-26-0000000002',
      customerName: 'سارة الشمري',
      eventName: 'مؤتمر ومعرض التقنية الفاخرة',
      eventDate: '2026-08-05',
      overallRating: 4.8,
      npsScore: 9,
      ratings: { cleanliness: 5, staff: 4.8, audioVisual: 4.7, catering: 5 },
      comment: 'الشاشات الجدارية والنظام الصوتي كان ممتازاً جداً للمؤتمر، تجربة رائعة سنكررها بالتأكيد.',
      sentiment: 'positive'
    }
  ]);

  const npsAverage = 9.5;
  const overallAverage = 4.9;

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-6 text-right" dir="rtl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-2xl bg-rose-50 text-rose-600 border border-rose-100">
            <Award className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-base font-black text-slate-900">مركز تقييم الجودة وتجربة العميل (Post-Event Quality & Feedback Hub)</h3>
            <p className="text-xs text-slate-500 font-bold mt-0.5">استبيانات فورية تلقائية بعد الحفل، مؤشرات رضا العملاء (NPS)، وتحليلات الأداء</p>
          </div>
        </div>

        <button
          onClick={() => alert('تم إرسال روابط استبيان التقييم التلقائي عبر الرسائل للعملاء الجدد!')}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
        >
          <Send className="w-4 h-4" /> إرسال استبيانات جديدة
        </button>
      </div>

      {/* NPS Analytics Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-r from-rose-900 to-indigo-950 p-5 rounded-2xl text-white space-y-2">
          <span className="text-xs text-rose-200 font-bold block">مؤشر صافي التوصية (NPS)</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-mono font-black text-amber-400">{npsAverage}</span>
            <span className="text-xs text-slate-300 font-bold">/ 10 (ممتاز جداً)</span>
          </div>
        </div>

        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-2">
          <span className="text-xs text-slate-500 font-bold block">متوسط التقييم العام</span>
          <div className="flex items-center gap-1 text-amber-500 font-black text-2xl font-mono">
            <span>{overallAverage}</span>
            <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
          </div>
        </div>

        <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-100 space-y-2">
          <span className="text-xs text-emerald-700 font-bold block">مستوى النظافة والتعقيم</span>
          <div className="text-2xl font-mono font-black text-emerald-800">5.0 / 5.0</div>
        </div>

        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 space-y-2">
          <span className="text-xs text-indigo-700 font-bold block">احترافية طاقم العمل</span>
          <div className="text-2xl font-mono font-black text-indigo-800">4.9 / 5.0</div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-3">
        <h4 className="text-xs font-black text-slate-800">أحدث تقييمات العملاء والآراء (Client Reviews)</h4>

        <div className="space-y-3">
          {feedbacks.map((fb) => (
            <div key={fb.id} className="p-4 rounded-2xl bg-slate-50/70 border border-slate-200 space-y-3 text-right">
              <div className="flex justify-between items-start flex-wrap gap-2">
                <div>
                  <h5 className="text-xs font-black text-slate-900">{fb.customerName} - <span className="text-indigo-600">{fb.eventName}</span></h5>
                  <span className="text-[10px] text-slate-400 font-mono">رقم الحجز: {fb.bookingId} | تاريخ الفعالية: {fb.eventDate}</span>
                </div>

                <div className="flex items-center gap-1 text-amber-500 font-black text-xs bg-white px-3 py-1 rounded-xl border border-slate-200">
                  <span>{fb.overallRating}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                </div>
              </div>

              <p className="text-xs text-slate-700 font-bold bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                "{fb.comment}"
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
