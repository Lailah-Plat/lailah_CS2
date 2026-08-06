import React from 'react';
import { Users, Users2, Briefcase, ShieldCheck } from 'lucide-react';

interface UsersManagementMainProps {
  adminUsersSection: 'users' | 'customers' | 'providers' | 'provider_staff';
  setAdminUsersSection: (tab: 'users' | 'customers' | 'providers' | 'provider_staff') => void;
  children: React.ReactNode;
}

export const UsersManagementMain: React.FC<UsersManagementMainProps> = ({
  adminUsersSection,
  setAdminUsersSection,
  children
}) => {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Unified Top Navigation bar for Management Only */}
      <div className="bg-white/80 backdrop-blur border border-slate-100 p-4 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-500">قسم التحكم والإشراف للمدراء</span>
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mt-0.5">
            <Users className="w-5 h-5 text-amber-500" />
            منظومة إدارة مستخدمي المنصة الموحدة
          </h2>
        </div>

        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-2xl w-fit">
          <button 
            onClick={() => setAdminUsersSection('users')}
            className={`py-2 px-4 rounded-xl font-black text-xs text-center transition-all flex items-center gap-1.5 cursor-pointer ${
              adminUsersSection === 'users' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <Users2 className="w-3.5 h-3.5" />
            حسابات المنصة والـ OTP
          </button>
          <button 
            onClick={() => setAdminUsersSection('customers')}
            className={`py-2 px-4 rounded-xl font-black text-xs text-center transition-all flex items-center gap-1.5 cursor-pointer ${
              adminUsersSection === 'customers' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            العملاء ونظام الولاء
          </button>
          <button 
            onClick={() => setAdminUsersSection('providers')}
            className={`py-2 px-4 rounded-xl font-black text-xs text-center transition-all flex items-center gap-1.5 cursor-pointer ${
              adminUsersSection === 'providers' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" />
            إدارة الشركاء (المزودين المعتمدين)
          </button>
          <button 
            onClick={() => setAdminUsersSection('provider_staff')}
            className={`py-2 px-4 rounded-xl font-black text-xs text-center transition-all flex items-center gap-1.5 cursor-pointer ${
              adminUsersSection === 'provider_staff' 
                ? 'bg-amber-500 text-slate-950 shadow-md font-bold' 
                : 'text-slate-500 hover:text-slate-800 font-bold'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            عاملين وصلاحيات الشركاء
          </button>
        </div>
      </div>

      {/* Dynamic Display Panel */}
      <div className="animate-in fade-in-50 duration-300">
        {children}
      </div>
    </div>
  );
};
