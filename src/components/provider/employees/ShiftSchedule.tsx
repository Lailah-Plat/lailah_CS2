import React from 'react';
import { 
  Calendar, 
  Clock, 
  UserCheck, 
  CheckCircle2 
} from 'lucide-react';

interface ShiftScheduleProps {
  shifts?: any[];
}

export const ShiftSchedule: React.FC<ShiftScheduleProps> = ({
  shifts = [
    { eventDate: '2026-08-30', hall: 'قاعة الأسطورة الملكية', shift: 'الفترة المسائية (4:00 م - 2:00 ص)', lead: 'تركي الفيصل', teamSize: '8 أفراد', status: 'مؤكد وجاهز' },
    { eventDate: '2026-08-31', hall: 'القاعة الماسية', shift: 'الفترة الصباحية (9:00 ص - 3:00 م)', lead: 'سارة العتيبي', teamSize: '5 أفراد', status: 'مؤكد وجاهز' },
  ],
}) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h4 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            <span>جدول المناوبات والورديات الميدانية ({shifts.length})</span>
          </h4>
          <p className="text-[10px] text-slate-400">توزيع الكوادر حسب تواريخ المناسبات والحجوزات</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {shifts.map((shift, idx) => (
          <div
            key={idx}
            className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-slate-800 dark:text-slate-200">{shift.eventDate}</span>
                <span className="text-xs font-black text-indigo-600 dark:text-indigo-400">• {shift.hall}</span>
              </div>
              <p className="text-[11px] text-slate-500 font-bold">{shift.shift}</p>
            </div>

            <div className="flex items-center gap-3 text-xs font-bold">
              <div className="text-right">
                <span className="text-[10px] text-slate-400 block">المشرف الميداني:</span>
                <span className="text-slate-800 dark:text-slate-200">{shift.lead} ({shift.teamSize})</span>
              </div>
              <span className="px-2.5 py-1 rounded-xl text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {shift.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
