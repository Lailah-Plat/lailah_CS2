import React, { useState } from 'react';
import { formatCurrency } from '../../../utils/helpers';

interface ProviderReportsProps {
  currentProviderName: string;
}

export function ProviderReports({ currentProviderName: _currentProviderName }: ProviderReportsProps) {
  const [reportsActiveInnerTab, setReportsActiveInnerTab] = useState<'financial' | 'operational' | 'branches'>('financial');

  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">ANALYTICAL REPORT ENGINE</span>
          <h3 className="text-sm font-black text-slate-800">نظام استخراج وتحليل التقارير التشغيلية والمالية</h3>
        </div>

        {/* Report sub-selector */}
        <div className="bg-slate-50 p-1.5 rounded-2xl flex gap-1.5 w-fit border border-slate-100">
          <button
            onClick={() => setReportsActiveInnerTab('financial')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              reportsActiveInnerTab === 'financial' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            التقرير المالي وحساب الأرباح
          </button>
          <button
            onClick={() => setReportsActiveInnerTab('operational')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              reportsActiveInnerTab === 'operational' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            التقرير اللوجستي ومعدل التحضير
          </button>
          <button
            onClick={() => setReportsActiveInnerTab('branches')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
              reportsActiveInnerTab === 'branches' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            تقرير أداء الفروع والمقارنة
          </button>
        </div>

        {reportsActiveInnerTab === 'financial' && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-black text-indigo-800 block">كشف تقرير الأرباح المجمّع للفترة المحددة:</span>
            <div className="bg-slate-50 p-4 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="font-mono text-slate-800 font-bold">{formatCurrency(135000)}</span>
                <span className="text-slate-500">إجمالي حجم المبيعات الضريبية الكلية:</span>
              </div>
              <div className="flex justify-between">
                <span className="font-mono text-red-600 font-bold">-{formatCurrency(10800)}</span>
                <span className="text-slate-500">مجموع عمولة منصة ليلة المستحقة (8%):</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200">
                <span className="font-mono text-emerald-600 font-black text-sm">{formatCurrency(124200)}</span>
                <span className="text-slate-800 font-black">صافي الأرباح الصافية القابلة للتحويل بنكياً:</span>
              </div>
            </div>
          </div>
        )}

        {reportsActiveInnerTab === 'operational' && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-black text-indigo-800 block">المؤشرات التشغيلية ونسب الإنجاز اللوجستي:</span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block">نسبة إنجاز تشيك لست التحضير</span>
                <span className="text-base font-black text-indigo-600 block mt-1">94.5%</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block">متوسط زمن التجهيز للمناسبة</span>
                <span className="text-base font-black text-indigo-600 block mt-1">٣ ساعات قبل الموعد</span>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl">
                <span className="text-[10px] text-slate-400 block">معدل الإلغاء للمناسبات</span>
                <span className="text-base font-black text-red-600 block mt-1">0.8% فقط</span>
              </div>
            </div>
          </div>
        )}

        {reportsActiveInnerTab === 'branches' && (
          <div className="space-y-3 pt-2">
            <span className="text-xs font-black text-indigo-800 block">حجم الإنتاجية وإيرادات الفروع بالمقارنة:</span>
            <div className="space-y-3 font-sans">
              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>{formatCurrency(85000)} (٦٣٪)</span>
                  <span>فرع الرياض الرئيسي</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '63%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-slate-600 mb-1">
                  <span>{formatCurrency(50000)} (٣٧٪)</span>
                  <span>فرع شمال الرياض</span>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: '37%' }}></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
