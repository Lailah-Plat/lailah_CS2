import React from 'react';
import { ShieldAlert } from 'lucide-react';

export function ProviderHybridRules() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">ANTI DE-DUPLICATION RULE CHECK</span>
          <h3 className="text-sm font-black text-slate-800">قواعد منع الازدواجية البرمجية وتكامل الخدمات الهجينة</h3>
        </div>

        <div className="p-4 bg-emerald-50/70 text-emerald-900 border border-emerald-100 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <strong className="text-xs font-black block">درع حظر الازدواجية البرمجية (قاعدة 5):</strong>
            <p className="text-[11px] leading-relaxed">
              تنص سياسة منصة ليلة الصارمة على أنه: إذا كانت قاعتكم تقدم خدمات إضافية داخلية (مثل الضيافة أو التصوير أو الكوشة) تندرج تحت فئة معينة، فإن نظام الحجز الذكي للعميل يحظر تلقائياً اقتراح أو عرض أي مزودي خدمات خارجيين مستقلين من نفس تلك الفئة لضمان أولوية البيع والتنظيم لخدماتكم الأصلية وتفادي التعارض التشغيلي.
            </p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
          <span className="text-[10px] font-black text-slate-400 block">محاكاة مطابقة تصنيف الخدمات وحظر الازدواجية:</span>

          <div className="divide-y divide-slate-100 text-xs">
            <div className="py-2.5 flex justify-between items-center">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">محظور برمجياً ✓</span>
              <span className="text-slate-700">بوفيه الضيافة الخارجي (تم كشف وجود بوفيه داخلي متاح للقاعة)</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded">محظور برمجياً ✓</span>
              <span className="text-slate-700">مصورة خارجية مستقلة (تم كشف وجود خدمة تصوير داخلية مضافة للقاعة)</span>
            </div>
            <div className="py-2.5 flex justify-between items-center">
              <span className="bg-slate-100 text-slate-400 text-[10px] font-black px-2 py-0.5 rounded">مسموح لعدم توفر بديل</span>
              <span className="text-slate-500">طاقم فرقة استعراضية موسيقية (لا يوجد لديك فرقة داخلية بالخدمات)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
