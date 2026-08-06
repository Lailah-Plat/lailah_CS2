import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, Save, CheckCircle2, ShieldCheck, RefreshCw, Key, ShieldAlert, Camera, MapPin, Building, FileText, Trash2, AlertCircle } from 'lucide-react';
import { PhoneInput, NationalIdInput, PasswordValidationInputs } from './common/ValidationInputs';
import { nationalIdRegex, saudiPhoneRegex, sanitizeSaudiPhone } from '../utils/validations';

interface StaffProfilePageProps {
  currentUser: any;
  setCurrentUser: (user: any) => void;
  staffList: any[];
  setStaffList?: (list: any[]) => void;
  showNotification?: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

export function StaffProfilePage({
  currentUser,
  setCurrentUser,
  staffList,
  setStaffList,
  showNotification
}: StaffProfilePageProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    idNumber: '',
    imagePreview: '',
    address: '',
    region: '',
    city: '',
    bio: '',
    dbId: undefined as number | undefined,
    id: undefined as number | undefined,
  });

  const [emailError, setEmailError] = useState('');
  const [idNumberError, setIdNumberError] = useState('');

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  useEffect(() => {
    if (currentUser) {
      const avatarSrc = currentUser.image || currentUser.avatarUrl || currentUser.avatar || currentUser.imagePreview || '';
      setForm({
        name: currentUser.name || currentUser.fullName || 'مستخدم النظام',
        email: currentUser.email || '',
        phone: currentUser.phone || '',
        role: currentUser.role || currentUser.jobTitle || 'إداري النظام',
        idNumber: currentUser.idNumber || currentUser.nationalId || '',
        imagePreview: avatarSrc,
        address: currentUser.address || currentUser.addressDetails || '',
        region: currentUser.region || '',
        city: currentUser.city || '',
        bio: currentUser.bio || '',
        dbId: currentUser.dbId || currentUser.id,
        id: currentUser.id || currentUser.dbId,
      });
      setEmailError('');
      setIdNumberError('');
    }
  }, [currentUser]);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setForm(prev => ({ ...prev, email: val }));
    if (val.trim() && !emailRegex.test(val.trim())) {
      setEmailError('صيغة البريد الإلكتروني غير صحيحة (مثال: user@domain.com)');
    } else {
      setEmailError('');
    }
  };

  const handleIdNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 10);
    setForm(prev => ({ ...prev, idNumber: val }));
    if (val.length > 0 && !nationalIdRegex.test(val)) {
      setIdNumberError('رقم الهوية/الإقامة يجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2');
    } else {
      setIdNumberError('');
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1024 * 1024) {
        if (showNotification) showNotification('error', 'حجم الصورة يتجاوز 1 ميجابايت.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        setForm(prev => ({ ...prev, imagePreview: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Check required fields
    if (!form.name.trim()) {
      if (showNotification) showNotification('error', 'يرجى إدخال الاسم الكامل.');
      return;
    }

    // 2. Email Validation Rule
    if (!form.email || !emailRegex.test(form.email.trim())) {
      setEmailError('صيغة البريد الإلكتروني غير صحيحة (مثال: user@domain.com)');
      if (showNotification) {
        showNotification('error', 'يرجى إدخال بريد إلكتروني صحيح بصيغة متوافقة (مثل: user@domain.com).');
      }
      return;
    }

    // 3. Phone Validation Rule
    const cleanPhone = form.phone ? form.phone.trim() : '';
    const digitsOnly = cleanPhone.replace(/[^\d]/g, '');
    if (!cleanPhone || digitsOnly.length < 8) {
      if (showNotification) {
        showNotification('error', 'يرجى إدخال رقم جوال صحيح مكتمل.');
      }
      return;
    }

    // 4. National ID / Resident ID Validation Rule (if provided)
    if (form.idNumber && form.idNumber.trim() !== '') {
      if (!nationalIdRegex.test(form.idNumber.trim())) {
        setIdNumberError('رقم الهوية الوطنية أو الإقامة يجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2');
        if (showNotification) {
          showNotification('error', 'رقم الهوية الوطنية أو الإقامة يجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2.');
        }
        return;
      }
    }

    setIsSaving(true);
    try {
      const sanitizedPhone = sanitizeSaudiPhone(form.phone);

      // 1. Prepare updated user object
      const updatedUser = {
        ...currentUser,
        name: form.name.trim(),
        fullName: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: sanitizedPhone || form.phone,
        role: form.role,
        idNumber: form.idNumber,
        nationalId: form.idNumber,
        imagePreview: form.imagePreview,
        image: form.imagePreview,
        avatar: form.imagePreview,
        avatarUrl: form.imagePreview,
        address: form.address,
        addressDetails: form.address,
        region: form.region,
        city: form.city,
        bio: form.bio,
      };

      // 2. Persist to localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      // 3. Update in staffList if matching
      if (staffList && setStaffList) {
        const updatedList = staffList.map((s: any) => {
          if (s.id === form.id || s.email === currentUser?.email) {
            return {
              ...s,
              name: form.name.trim(),
              fullName: form.name.trim(),
              email: form.email.trim().toLowerCase(),
              phone: sanitizedPhone || form.phone,
              idNumber: form.idNumber,
              image: form.imagePreview,
              avatarUrl: form.imagePreview,
              avatar: form.imagePreview,
              imagePreview: form.imagePreview,
            };
          }
          return s;
        });
        setStaffList(updatedList);
        localStorage.setItem('STAFF_LIST', JSON.stringify(updatedList));
      }

      // 4. Update via API if dbId/id is present
      const targetId = form.dbId || form.id;
      if (targetId) {
        const response = await fetch(`/api/users/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            fullName: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            phone: sanitizedPhone || form.phone,
            idNumber: form.idNumber,
            role: form.role,
            avatarUrl: form.imagePreview,
            image: form.imagePreview,
          }),
        });
        if (!response.ok) {
          console.warn('API sync returned non-OK status');
        }
      }

      window.dispatchEvent(new Event('currentUserUpdated'));
      window.dispatchEvent(new Event('usersUpdated'));
      window.dispatchEvent(new Event('storage'));

      if (showNotification) {
        showNotification('success', 'تم تحديث البيانات الشخصية والتحقق منها بنجاح.');
      }
    } catch (err) {
      console.error('Error saving staff profile:', err);
      if (showNotification) {
        showNotification('error', 'حدث خطأ غير متوقع أثناء حفظ البيانات.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    const { currentPassword, newPassword, confirmPassword } = passwordForm;

    if (!currentPassword || !newPassword || !confirmPassword) {
      if (showNotification) {
        showNotification('error', 'يرجى ملء جميع حقول كلمة المرور.');
      }
      return;
    }

    if (newPassword.length < 6) {
      if (showNotification) {
        showNotification('error', 'يجب أن تتكون كلمة المرور الجديدة من 6 خانات على الأقل.');
      }
      return;
    }

    if (newPassword !== confirmPassword) {
      if (showNotification) {
        showNotification('error', 'تأكيد كلمة المرور الجديدة غير متطابق.');
      }
      return;
    }

    setIsSavingPassword(true);
    try {
      // Direct API update for password if dbId/id is present
      const targetId = form.dbId || form.id;
      if (targetId) {
        const response = await fetch(`/api/users/${targetId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            password: newPassword,
            currentPassword: currentPassword,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success === false) {
            if (showNotification) {
              showNotification('error', data.error || 'فشل تحديث كلمة المرور. يرجى التحقق من كلمة المرور الحالية.');
            }
            setIsSavingPassword(false);
            return;
          }
        }
      }

      // Update in localStorage as well (encrypted or raw depending on design)
      const updatedUser = {
        ...currentUser,
        password: newPassword,
      };
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      setCurrentUser(updatedUser);

      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      if (showNotification) {
        showNotification('success', 'تم تغيير كلمة المرور بنجاح.');
      }
    } catch (err) {
      console.error('Error changing password:', err);
      if (showNotification) {
        showNotification('error', 'حدث خطأ أثناء الاتصال بالخادم لتحديث كلمة المرور.');
      }
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Hidden File Input for Avatar */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleAvatarChange}
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
      />

      {/* Visual Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 relative overflow-hidden shadow-md">
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="relative flex flex-col md:flex-row items-center gap-6 text-right">
          {/* Avatar Upload Container */}
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <div className="w-24 h-24 rounded-full bg-amber-500 flex items-center justify-center font-black text-4xl text-blue-950 shadow-inner overflow-hidden border-4 border-amber-400/40 relative">
              {form.imagePreview ? (
                <img
                  src={form.imagePreview}
                  alt="صورة الملف الشخصي"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span>{form.name ? form.name.charAt(0) : 'م'}</span>
              )}
              {/* Overlay on Hover */}
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-amber-300 text-[10px] font-bold gap-1">
                <Camera className="w-5 h-5" />
                <span>تغيير الصورة</span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
              className="absolute bottom-0 left-0 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded-full shadow-md transition-transform hover:scale-110"
              title="رفع صورة شخصية"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-grow space-y-2 text-center md:text-right">
            <h1 className="text-2xl md:text-3xl font-black flex items-center justify-center md:justify-start gap-3">
              <span>{form.name}</span>
              <span className="text-xs font-bold text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
                إدارة بياناتي
              </span>
            </h1>
            <p className="text-slate-300 text-sm flex items-center justify-center md:justify-start gap-2 flex-wrap">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>{form.role}</span>
              {form.idNumber && (
                <>
                  <span>•</span>
                  <span>الهوية/رقم الموظف: {form.idNumber}</span>
                </>
              )}
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl text-xs font-semibold">
            حساب نظام معتمد 🛡️
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Right Section: Core Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-right">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <User className="w-5 h-5 text-amber-500" /> تعديل وإدارة البيانات الشخصية
            </h3>

            <form onSubmit={handleSaveProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">الاسم الكامل <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={form.name}
                      onChange={e => setForm({ ...form, name: e.target.value })}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-sm font-bold"
                      placeholder="أدخل اسمك الكامل"
                      required
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="email"
                      dir="ltr"
                      value={form.email}
                      onChange={handleEmailChange}
                      className={`w-full pl-3 pr-10 py-3 text-left rounded-xl border outline-none transition-all text-sm font-medium ${
                        emailError ? 'border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-red-500' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500'
                      }`}
                      placeholder="username@domain.com"
                      required
                    />
                  </div>
                  {emailError && (
                    <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{emailError}</span>
                    </p>
                  )}
                </div>

                <div className="md:col-span-1">
                  <PhoneInput
                    label="رقم الجوال"
                    value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    required
                    className="w-full"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-sm font-bold text-slate-700 mb-2">المسمى الوظيفي / الصفة</label>
                  <div className="relative">
                    <Building className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={form.role}
                      onChange={e => setForm({ ...form, role: e.target.value })}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-sm"
                      placeholder="مثال: مدير النظام / إداري"
                    />
                  </div>
                </div>

                <div className="md:col-span-1">
                  <NationalIdInput
                    label="رقم الهوية الوطنية / الإقامة"
                    value={form.idNumber}
                    onChange={e => {
                      const val = e.target.value;
                      setForm({ ...form, idNumber: val });
                      if (val.length > 0 && !nationalIdRegex.test(val)) {
                        setIdNumberError('يجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2');
                      } else {
                        setIdNumberError('');
                      }
                    }}
                  />
                  {idNumberError && (
                    <p className="text-xs text-red-500 font-medium mt-1 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{idNumberError}</span>
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-slate-700 mb-2">العنوان الوطني / السكن</label>
                  <div className="relative">
                    <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      type="text"
                      value={form.address}
                      onChange={e => setForm({ ...form, address: e.target.value })}
                      className="w-full p-3 pr-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none transition-all text-sm"
                      placeholder="الرياض، المملكة العربية السعودية"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-300 text-slate-950 font-black rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                  <span>حفظ التعديلات والبيانات</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Left Section: Password Update */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 text-right">
            <h3 className="text-base font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Key className="w-5 h-5 text-amber-500" /> تغيير كلمة المرور
            </h3>

            <form onSubmit={handleSavePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">كلمة المرور الحالية</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={passwordForm.currentPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    className="w-full p-2.5 pl-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm font-mono"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={passwordForm.newPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full p-2.5 pl-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm font-mono"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1.5">تأكيد كلمة المرور الجديدة</label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    dir="ltr"
                    value={passwordForm.confirmPassword}
                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full p-2.5 pl-10 rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm font-mono"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingPassword}
                className="w-full mt-2 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-amber-400 font-bold rounded-xl transition-all shadow flex items-center justify-center gap-2 text-xs cursor-pointer"
              >
                {isSavingPassword ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>تحديث كلمة المرور</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
