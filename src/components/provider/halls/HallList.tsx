import React from 'react';
import { 
  Building2, 
  MapPin, 
  Users, 
  Sparkles, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';
import { formatCurrency } from '../../../utils/helpers';

interface HallListProps {
  halls: any[];
  onAddHall?: () => void;
  onEditHall?: (hall: any) => void;
  onDeleteHall?: (hallId: string) => void;
  onViewHall?: (hall: any) => void;
}

export const HallList: React.FC<HallListProps> = ({
  halls = [],
  onAddHall,
  onEditHall,
  onDeleteHall,
  onViewHall,
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span>قاعات ومرافق المنشأة ({halls.length})</span>
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">إدارة تفاصيل القاعات، السعة الاستيعابية، والتسعير المعتمد</p>
        </div>

        {onAddHall && (
          <button
            onClick={onAddHall}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة قاعة جديدة</span>
          </button>
        )}
      </div>

      {halls.length === 0 ? (
        <div className="p-8 text-center bg-white dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-3xl space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950 text-indigo-600 flex items-center justify-center mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-xs font-black text-slate-800 dark:text-slate-200">لم يتم إضافة أي قاعة حتى الآن</h4>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">أضف قاعتك الأولى ليتمكن العملاء من استعراضها وحجزها عبر المنصة.</p>
          </div>
          {onAddHall && (
            <button
              onClick={onAddHall}
              className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black inline-flex items-center gap-1.5 shadow-xs cursor-pointer hover:bg-indigo-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>إضافة قاعة الآن</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {halls.map((hall) => {
            const isApproved = hall.status === 'approved' || hall.status === 'active' || !hall.status;
            return (
              <div
                key={hall.id}
                className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="relative aspect-video bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  {hall.image || (hall.images && hall.images[0]) ? (
                    <img
                      src={hall.image || hall.images[0]}
                      alt={hall.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}

                  <span className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black border backdrop-blur-xs ${
                    isApproved
                      ? 'bg-emerald-500/90 text-white border-emerald-400'
                      : 'bg-amber-500/90 text-white border-amber-400'
                  }`}>
                    {isApproved ? 'معتمدة ونشطة' : 'بانتظار اعتماد الإدارة'}
                  </span>

                  <span className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-black/60 text-white backdrop-blur-xs">
                    {hall.city || 'الرياض'}
                  </span>
                </div>

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 truncate">
                      {hall.name}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {hall.description || 'قاعة مناسبات مجهزة بأحدث التجهيزات الفاخرة.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-indigo-500" />
                      <span>السعة: {hall.capacity || '400'} فرد</span>
                    </div>
                    <div className="flex items-center gap-1.5 justify-end">
                      <span className="text-emerald-600 font-black">
                        {formatCurrency(Number(hall.price || hall.basePrice || 15000))}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                    {onEditHall && (
                      <button
                        onClick={() => onEditHall(hall)}
                        className="flex-1 py-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>تعديل</span>
                      </button>
                    )}
                    {onDeleteHall && (
                      <button
                        onClick={() => onDeleteHall(hall.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 rounded-xl transition-all cursor-pointer"
                        title="حذف القاعة"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
