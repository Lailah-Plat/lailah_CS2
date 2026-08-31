import React from 'react';
import { 
  AlertTriangle, 
  ArrowRight, 
  RotateCw, 
  ShieldAlert, 
  CheckCircle2 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface StockAlertsProps {
  alerts?: any[];
  onTriggerProcurement?: (sku: string) => void;
}

export const StockAlerts: React.FC<StockAlertsProps> = ({
  alerts = [
    { sku: 'INV-SKU-003', name: 'فواحات وبخور عود معطر فاخر', current: 8, min: 20, supplier: 'مؤسسة العود الملكي', urgency: 'high' },
    { sku: 'INV-SKU-002', name: 'مفارش طاولات حرير ملكي أوف وايت', current: 35, min: 50, supplier: 'مصنع المنسوجات الذهبية', urgency: 'medium' },
  ],
  onTriggerProcurement,
}) => {
  return (
    <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-amber-100 dark:bg-amber-900 text-amber-700 dark:text-amber-200 rounded-xl">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-amber-950 dark:text-amber-200">
              تنبيهات نقص المخزون وإعادة التوريد التلقائي ({alerts.length})
            </h4>
            <p className="text-[10px] text-amber-700 dark:text-amber-300">أصناف قاربت على النفاد قبل مواعيد المناسبات القادمة</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {alerts.map((alert, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/60 rounded-2xl flex items-center justify-between shadow-xs"
          >
            <div className="space-y-0.5">
              <span className="font-bold text-xs text-slate-800 dark:text-slate-200 block">{alert.name}</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>المتبقي: <strong className="text-rose-600 font-mono">{alert.current}</strong></span>
                <span>•</span>
                <span>الحد الأدنى: <strong className="font-mono">{alert.min}</strong></span>
              </div>
            </div>

            <button
              onClick={() => onTriggerProcurement && onTriggerProcurement(alert.sku)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-[10px] font-black flex items-center gap-1 transition-all cursor-pointer shadow-xs"
            >
              <RotateCw className="w-3 h-3" />
              <span>أمر شراء فوري</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
