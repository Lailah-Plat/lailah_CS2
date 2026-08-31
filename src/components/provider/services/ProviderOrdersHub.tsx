import React from 'react';
import { formatCurrency } from '../../../utils/helpers';

interface ProviderOrdersHubProps {
  mySupportRequests: any[];
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
  onRefresh?: () => void;
}

export function ProviderOrdersHub({
  mySupportRequests,
  showNotification,
  onRefresh,
}: ProviderOrdersHubProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm text-right space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-50">
          <span className="text-[10px] font-black text-slate-400 font-mono">INDEPENDENT ORDERS HUB</span>
          <h3 className="text-sm font-black text-slate-800">إدارة ومتابعة طلبات الخدمات التكميلية المستقلة</h3>
        </div>

        <p className="text-xs text-slate-500">
          طلبات خدمات التجهيز، الضيافة، والتصوير التي يشتريها العميل كملحقات مستقلة يتم متابعة دورتها اللوجستية والتحضيرية هنا بمعزل عن حجز القاعة الرئيسي.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead className="bg-slate-50 text-slate-500 border-b border-slate-100">
              <tr>
                <th className="p-3 font-black">رقم الطلب (Order ID)</th>
                <th className="p-3 font-black">الخدمة والتصنيف</th>
                <th className="p-3 font-black">المبلغ</th>
                <th className="p-3 font-black">تاريخ التنفيذ</th>
                <th className="p-3 font-black">الحالة واللوجستيات</th>
                <th className="p-3 font-black text-center">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 font-sans">
              {mySupportRequests.map((r, i) => {
                const uniqueOrderId = r.id || `SRV-26-0000000${i + 1}`;
                return (
                  <tr key={i} className="hover:bg-slate-50/50">
                    <td className="p-3 font-mono font-bold text-slate-600">{uniqueOrderId}</td>
                    <td className="p-3">
                      <div>
                        <span className="font-extrabold text-slate-800 block">{r.serviceName}</span>
                        <span className="text-[9px] text-slate-400 block">{r.category || 'تكميلي'}</span>
                      </div>
                    </td>
                    <td className="p-3 font-mono text-slate-800 font-black">{formatCurrency(r.price || r.amount || 1500)}</td>
                    <td className="p-3 font-mono text-slate-500">{r.date || '٢٠٢٦/٠٧/٢٥'}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${r.status === 'مكتمل' || r.status === 'Completed' ? 'bg-emerald-50 text-emerald-700' : 'bg-purple-50 text-purple-700'}`}>
                        {r.status || 'جاهز للتسليم'}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => {
                          r.status = 'مكتمل';
                          showNotification('success', `تم تحديث حالة طلب الخدمة رقم ${uniqueOrderId} إلى مكتمل ومسلم للعميل بنجاح!`);
                          if (onRefresh) onRefresh();
                        }}
                        className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-black transition-all cursor-pointer"
                      >
                        تأكيد التسليم
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
