import React, { useState } from 'react';
import { 
  Users, 
  UserCheck, 
  Phone, 
  ShieldCheck, 
  Plus, 
  Search, 
  Calendar 
} from 'lucide-react';

interface StaffMember {
  id: string;
  name: string;
  role: string;
  phone: string;
  branch: string;
  assignedEventsCount: number;
  status: 'active' | 'on_leave';
}

interface StaffListProps {
  staff?: StaffMember[];
  onAddStaff?: () => void;
}

export const StaffList: React.FC<StaffListProps> = ({
  staff = [
    { id: 'STF-01', name: 'تركي الفيصل', role: 'مدير تشغيل القاعة والفعاليات', phone: '0501112233', branch: 'فرع الرياض الرئيسي', assignedEventsCount: 8, status: 'active' },
    { id: 'STF-02', name: 'سارة العتيبي', role: 'مشرفة الضيافة واستقبال VIP', phone: '0552223344', branch: 'فرع الرياض الرئيسي', assignedEventsCount: 12, status: 'active' },
    { id: 'STF-03', name: 'محمد الصالح', role: 'مهندس صوتيات وإضاءة مسرحية', phone: '0543334455', branch: 'فرع الرياض الرئيسي', assignedEventsCount: 6, status: 'active' },
    { id: 'STF-04', name: 'فهد المطيري', role: 'مشرف أمن وسلامة ومسؤول بوابات', phone: '0564445566', branch: 'فرع الرياض الرئيسي', assignedEventsCount: 10, status: 'active' },
  ],
  onAddStaff,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStaff = staff.filter((s) =>
    s.name.includes(searchTerm) || s.role.includes(searchTerm)
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="text-xs font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>فريق العمل والكوادر التشغيلية ({filteredStaff.length})</span>
          </h3>
          <p className="text-[10px] text-slate-400">إدارة المشرفين، طواقم الضيافة، والمهندسين الميدانيين</p>
        </div>

        {onAddStaff && (
          <button
            onClick={onAddStaff}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة موظف</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filteredStaff.map((member) => (
          <div
            key={member.id}
            className="p-4 bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400">{member.id}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                {member.status === 'active' ? 'نشط في الميدان' : 'في إجازة'}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">{member.name}</h4>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold block mt-0.5">{member.role}</span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
              <span className="text-slate-400 text-[10px] font-mono">{member.phone}</span>
              <span className="text-indigo-600 dark:text-indigo-400 text-[10px] font-bold">
                {member.assignedEventsCount} مناسبات مسندة
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
