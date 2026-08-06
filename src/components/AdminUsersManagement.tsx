import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';

interface AdminUsersManagementProps {
  systemUsers: any[];
  pendingUsers: any[];
  isLoadingUsers: boolean;
  setEditingPlatformUser: (u: any) => void;
  setPlatformUserForm: (u: any) => void;
  setIsPlatformUserModalOpen: (open: boolean) => void;
  setDeleteData: (data: any) => void;
}

export function AdminUsersManagement({
  systemUsers,
  pendingUsers,
  isLoadingUsers,
  setEditingPlatformUser,
  setPlatformUserForm,
  setIsPlatformUserModalOpen,
  setDeleteData,
}: AdminUsersManagementProps) {
  const [usersActiveTab, setUsersActiveTab] = useState<'customers' | 'providers' | 'inactive'>('customers');

  return (
    <div id="admin-users-management-wrapper" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">حسابات المنصة والمسؤولين</h2>
          <p className="text-slate-500 text-xs mt-1">عرض حسابات العملاء والمزودين النشطين وغير المفعلين مع كود OTP المرتبط بها</p>
        </div>
        <button 
          onClick={() => {
            setEditingPlatformUser(null);
            setPlatformUserForm({
              name: '',
              email: '',
              phone: '',
              role: 'عميل',
              status: 'نشط',
              isPending: false,
              otp_code: '',
              region: 'الرياض',
              city: 'الرياض'
            });
            setIsPlatformUserModalOpen(true);
          }}
          className="flex items-center gap-2 bg-indigo-950 hover:bg-indigo-900 text-white px-4 py-2.5 rounded-xl transition-all shadow-sm font-bold text-xs cursor-pointer focus:outline-none"
        >
          <Plus className="w-4 h-4" /> إضافة مستخدم يدوي
        </button>
      </div>

      {isLoadingUsers ? (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex bg-slate-100 p-1 rounded-xl w-full max-w-md mx-auto sm:mx-0">
            <button 
              onClick={() => setUsersActiveTab('customers')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${usersActiveTab === 'customers' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              العملاء
            </button>
            <button 
              onClick={() => setUsersActiveTab('providers')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${usersActiveTab === 'providers' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              المزودين
            </button>
            <button 
              onClick={() => setUsersActiveTab('inactive')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${usersActiveTab === 'inactive' ? 'bg-white text-indigo-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
            >
              غير المفعلين والمعلقين
            </button>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-right">
                <thead className="bg-slate-50 text-slate-500 font-medium text-xs">
                  <tr>
                    <th className="px-6 py-4">الاسم</th>
                    <th className="px-6 py-4">البريد الإلكتروني</th>
                    <th className="px-6 py-4">رقم الجوال</th>
                    <th className="px-6 py-4">الدور</th>
                    <th className="px-6 py-4">الحالة</th>
                    <th className="px-6 py-4">تاريخ التسجيل</th>
                    {usersActiveTab === 'inactive' && <th className="px-6 py-4">كود OTP</th>}
                    <th className="px-6 py-4 text-center">الإجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {(() => {
                      let displayedUsers: any[] = [];
                      if (usersActiveTab === 'customers') {
                        displayedUsers = systemUsers.filter(u => u.role === 'عميل' && u.status === 'نشط');
                      } else if (usersActiveTab === 'providers') {
                        displayedUsers = systemUsers.filter(u => u.role !== 'عميل' && u.role !== 'Admin' && u.status === 'نشط');
                      } else {
                        displayedUsers = [
                          ...systemUsers.filter(u => u.status !== 'نشط' && u.role !== 'Admin').map(u => ({...u, isPending: false})),
                          ...pendingUsers.map(u => ({...u, isPending: true, status: 'معلق'}))
                        ];
                      }

                      if (displayedUsers.length === 0) {
                        return (
                          <tr>
                            <td colSpan={usersActiveTab === 'inactive' ? 8 : 7} className="px-6 py-8 text-center text-slate-400 font-semibold">
                              لا يوجد بيانات لعرضها
                            </td>
                          </tr>
                        );
                      }

                      return displayedUsers.map(u => (
                        <tr key={u.id + (u.isPending ? '_pending' : '')} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-800 text-xs">
                            <div className="flex items-center gap-2.5">
                              {u.image || u.avatarUrl || u.avatar || u.imagePreview ? (
                                <img 
                                  src={u.image || u.avatarUrl || u.avatar || u.imagePreview} 
                                  alt={u.name} 
                                  referrerPolicy="no-referrer"
                                  className="w-7 h-7 rounded-full object-cover border border-slate-200 shadow-sm shrink-0"
                                  onError={(e) => {
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center justify-center font-bold text-[10px] shrink-0 select-none">
                                  {(() => {
                                    const parts = (u.name || '').trim().split(/\s+/).filter(Boolean);
                                    if (parts.length >= 2) {
                                      return (parts[0].charAt(0) + parts[1].charAt(0));
                                    }
                                    return parts[0] ? parts[0].charAt(0) : '';
                                  })()}
                                </div>
                              )}
                              <span>{u.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">{u.email}</td>
                          <td className="px-6 py-4 text-xs font-mono">{u.phone || 'غير محدد'}</td>
                          <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700">
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium ${u.status === 'نشط' ? 'bg-emerald-100 text-emerald-800' : u.status === 'معلق' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                              {u.status || 'نشط'}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-xs font-mono">
                            {u.createdAt ? new Date(u.createdAt).toLocaleDateString('ar-EG') : '-'}
                          </td>
                          {usersActiveTab === 'inactive' && (
                            <td className="px-6 py-4 font-mono font-bold tracking-widest text-xs text-indigo-900">
                              {u.otp_code || '-'}
                            </td>
                          )}
                          <td className="px-6 py-4 flex justify-center gap-2">
                            <button 
                              onClick={() => {
                                setEditingPlatformUser(u);
                                setPlatformUserForm({
                                  name: u.name || '',
                                  email: u.email || '',
                                  phone: u.phone || '',
                                  role: u.role || 'عميل',
                                  status: u.status || 'نشط',
                                  isPending: !!u.isPending,
                                  otp_code: u.otp_code || '',
                                  region: u.region || 'الرياض',
                                  city: u.city || 'الرياض'
                                });
                                setIsPlatformUserModalOpen(true);
                              }}
                              className="text-blue-600 hover:text-blue-800 p-1 bg-blue-50 hover:bg-blue-100 rounded-lg cursor-pointer transition-colors" 
                              title="تعديل"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => {
                                setDeleteData({
                                  id: u.id,
                                  type: 'platform_users',
                                  name: u.name,
                                  isPending: !!u.isPending
                                } as any);
                              }} 
                              className="text-red-600 hover:text-red-800 p-1 bg-red-50 hover:bg-red-100 rounded-lg cursor-pointer transition-colors" 
                              title="حذف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ));
                    })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
