import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { User, Mail, Phone, Lock, CheckCircle2, RotateCcw, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { PhoneInput } from '../components/common/ValidationInputs';

// Password Strength Utility Function
const getPasswordStrength = (pass: string) => {
  let score = 0;
  if (!pass) return { score, label: 'فارغ', color: 'bg-slate-200', textClass: 'text-slate-400', checks: { length: false, hasUpper: false, hasLower: false, hasNumber: false, hasSpecial: false } };
  
  const checks = {
    length: pass.length >= 9,
    hasUpper: /[A-Z]/.test(pass),
    hasLower: /[a-z]/.test(pass),
    hasNumber: /[0-9]/.test(pass),
    hasSpecial: /[^A-Za-z0-9]/.test(pass)
  };

  if (checks.length) score += 1;
  if (checks.hasUpper) score += 1;
  if (checks.hasLower) score += 1;
  if (checks.hasNumber) score += 1;
  if (checks.hasSpecial) score += 1;

  let label = 'ضعيف جداً';
  let color = 'bg-red-500';
  let textClass = 'text-red-500';

  if (score === 1) {
    label = 'ضعيف';
    color = 'bg-red-400';
    textClass = 'text-red-400';
  } else if (score === 2) {
    label = 'مقبول';
    color = 'bg-orange-400';
    textClass = 'text-orange-400';
  } else if (score === 3) {
    label = 'متوسط';
    color = 'bg-amber-400';
    textClass = 'text-amber-500';
  } else if (score === 4) {
    label = 'قوي';
    color = 'bg-teal-500';
    textClass = 'text-teal-600';
  } else if (score === 5) {
    label = 'قوي جداً';
    color = 'bg-emerald-500';
    textClass = 'text-emerald-600';
  }

  return {
    score,
    label,
    color,
    textClass,
    checks
  };
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const [role] = useState<'عميل'>('عميل');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    pledgeCorrectness: false,
    readPrivacy: false,
    readTerms: false
  });

  // Password eye toggle states (Press-and-Hold for PC & Mobile/Tablet)
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [otpEnabled, setOtpEnabled] = useState({ email: false, sms: false });
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(240);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  React.useEffect(() => {
    try {
      const securitySettings = localStorage.getItem('SECURITY_SETTINGS');
      if (securitySettings) {
        const parsed = JSON.parse(securitySettings);
        setOtpEnabled({
          email: !!parsed.isEmailOtpEnabled,
          sms: !!parsed.isSmsOtpEnabled
        });
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    let timer: any;
    if (showOtpModal && countdown > 0) {
      timer = setInterval(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [showOtpModal, countdown]);

  const isPasswordSecure = getPasswordStrength(form.password).score >= 4;

  const isFormValid = 
    form.name.trim() !== '' && 
    form.email.trim() !== '' && 
    form.phone.trim() !== '' && 
    form.password.trim() !== '' && 
    isPasswordSecure &&
    form.confirmPassword === form.password &&
    form.pledgeCorrectness && 
    form.readPrivacy && 
    form.readTerms;

  const [rememberMe, setRememberMe] = useState(false);

  const handleSocialRegister = async (provider: 'Google' | 'Apple') => {
    const fallbackEmail = provider === 'Google' ? 'kaab909@gmail.com' : 'apple-user@lylah.sa';
    const fallbackName = provider === 'Google' ? 'كعب العرابي' : 'مستخدم آبل';

    try {
      const res = await fetch('/api/auth/social-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: fallbackEmail,
          name: fallbackName,
          provider
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ أثناء الدخول بالحساب الخارجي');
        return;
      }

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      localStorage.setItem('currentUser', JSON.stringify(data.user));
      localStorage.setItem('IS_AUTHENTICATED', 'true');
      
      // Navigate to complete-profile page
      navigate('/complete-profile');
    } catch (err) {
      console.error(err);
      alert('حدث خطأ بالاتصال بالخادم');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid) return;

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'حدث خطأ أثناء التسجيل');
        return;
      }

      if (data.requireOtp) {
        setOtpEnabled(data.otpEnabled);
        setShowOtpModal(true);
        setCountdown(240);
      } else {
        finalizeRegistration(data.user);
      }
    } catch (err) {
       console.error(err);
       alert('حدث خطأ بالاتصال بالخادم');
    }
  };

  const finalizeRegistration = (user?: any) => {
    const defaultAvatar = 'https://i.pravatar.cc/150?img=12';
    const userAvatar = user?.image || user?.avatarUrl || user?.avatar || user?.imagePreview || defaultAvatar;
    const newUser = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: 'عميل',
      address: '',
      bio: '',
      ...(user || {}),
      image: userAvatar,
      avatar: userAvatar,
      avatarUrl: userAvatar,
      imagePreview: userAvatar
    };
    
    // Force role to client
    newUser.role = 'عميل';
    
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    localStorage.setItem('IS_AUTHENTICATED', 'true');

    if (rememberMe) {
      localStorage.setItem('REMEMBERED_EMAIL', form.email);
    } else {
      localStorage.removeItem('REMEMBERED_EMAIL');
    }
    
    // Redirect unified default registering customers to complete profile page
    navigate('/complete-profile');
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) value = value.slice(-1);
    const newOtp = [...otpInputs];
    newOtp[index] = value;
    setOtpInputs(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpInputs[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerifyOtp = async () => {
    const code = otpInputs.join('');
    if (code.length === 6) {
      try {
        const res = await fetch('/api/auth/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: form.email, otp: code })
        });
        const data = await res.json();
        if (!res.ok) {
           alert(data.error || 'كود التحقق خاطئ');
           return;
        }
        setShowOtpModal(false);
        finalizeRegistration(data.user);
      } catch (err) {
        alert('حدث خطأ أثناء التحقق');
      }
    }
  };

  const getOtpMessage = () => {
    if (otpEnabled.email && otpEnabled.sms) return "تم إرسال رمز التحقق إلى بريدك الإلكتروني ورقم جوالك";
    if (otpEnabled.email) return "تم إرسال رمز التحقق إلى بريدك الإلكتروني";
    if (otpEnabled.sms) return "تم إرسال رمز التحقق إلى رقم جوالك";
    return "";
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <main className="flex-grow flex items-center justify-center py-12 px-4 relative">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-100 max-w-xl w-full overflow-hidden">
          <div className="bg-blue-950 p-8 text-center text-white">
            <h1 className="text-3xl font-bold mb-2">إنشاء حساب جديد</h1>
            <p className="text-blue-200">مرحباً بك في منصة ليلة لخدمات المناسبات</p>
          </div>
          
          <form onSubmit={handleRegister} className="p-8 space-y-6">
            {/* Social Registration */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => handleSocialRegister('Google')}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.74 14.9 1 12 1 7.24 1 3.23 3.73 1.34 7.72l3.8 2.95C6.01 7.21 8.78 5.04 12 5.04z" />
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.46h6.44c-.28 1.47-1.11 2.72-2.35 3.56l3.66 2.84c2.14-1.97 3.74-4.87 3.74-8.51z" />
                  <path fill="#FBBC05" d="M5.14 10.67c-.24-.72-.38-1.5-.38-2.31s.14-1.59.38-2.31L1.34 3.1c-.86 1.72-1.34 3.65-1.34 5.7s.48 3.98 1.34 5.7l3.8-2.83z" />
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.04.7-2.37 1.11-4.3 1.11-3.22 0-5.99-2.17-6.96-5.08l-3.8 2.95C3.23 20.27 7.24 23 12 23z" />
                </svg>
                <span>Google</span>
              </button>
              <button
                type="button"
                onClick={() => handleSocialRegister('Apple')}
                className="flex items-center justify-center gap-2 py-3 px-4 border border-slate-200 rounded-xl hover:bg-slate-50 text-sm font-bold text-slate-700 transition-colors shadow-sm cursor-pointer"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.74-1.2 1.88-1.05 3 .11 1.08 2.22.64 3-.44z"/>
                </svg>
                <span>Apple</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-xs text-slate-400 font-bold">أو سجّل عبر البيانات التقليدية</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">الاسم الكامل <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="text" value={form.name || ''} onChange={e => setForm({...form, name: e.target.value})} className="w-full pl-3 pr-10 py-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none" placeholder="الاسم الرباعي" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">البريد الإلكتروني <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input required type="email" value={form.email || ''} onChange={e => setForm({...form, email: e.target.value})} className="w-full pl-3 pr-10 py-3 text-left rounded-xl border border-slate-200 focus:border-amber-500 outline-none" dir="ltr" placeholder="example@mail.com" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">رقم الجوال <span className="text-red-500">*</span></label>
                <PhoneInput 
                  value={form.phone || ''} 
                  onChange={e => setForm({...form, phone: e.target.value})} 
                  className="w-full"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">كلمة المرور <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    required 
                    type={showPassword ? "text" : "password"} 
                    value={form.password || ''} 
                    onChange={e => setForm({...form, password: e.target.value})} 
                    className="w-full pl-12 pr-10 py-3 text-left rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono" 
                    dir="ltr" 
                    placeholder="********" 
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onMouseUp={() => setShowPassword(false)}
                    onMouseLeave={() => setShowPassword(false)}
                    onTouchStart={(e) => { e.preventDefault(); setShowPassword(true); }}
                    onTouchEnd={() => setShowPassword(false)}
                    onTouchCancel={() => setShowPassword(false)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1.5 rounded-lg active:bg-slate-50 cursor-pointer"
                    title="اضغط مستمراً لإظهار كلمة المرور"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Meter & Checklist */}
                {form.password && (
                  <div className="mt-3 space-y-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-150 animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-right">
                      <span className="text-xs font-bold text-slate-500">قوة كلمة المرور:</span>
                      <span className={`text-xs font-black ${getPasswordStrength(form.password).textClass}`}>
                        {getPasswordStrength(form.password).label}
                      </span>
                    </div>

                    {/* Progress Bar segments */}
                    <div className="grid grid-cols-5 gap-1.5">
                      {[1, 2, 3, 4, 5].map((step) => {
                        const strength = getPasswordStrength(form.password);
                        const isActive = strength.score >= step;
                        return (
                          <div 
                            key={step} 
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              isActive ? strength.color : 'bg-slate-200'
                            }`}
                          />
                        );
                      })}
                    </div>

                    {/* Requirements checklist */}
                    <div className="pt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2 border-t border-slate-200/60 text-xs text-right">
                      <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          getPasswordStrength(form.password).checks.length ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className="text-[10px] font-bold">✓</span>
                        </div>
                        <span className={getPasswordStrength(form.password).checks.length ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          9 خانات على الأقل
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          getPasswordStrength(form.password).checks.hasUpper ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className="text-[10px] font-bold">✓</span>
                        </div>
                        <span className={getPasswordStrength(form.password).checks.hasUpper ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          حرف كبير واحد (A-Z)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          getPasswordStrength(form.password).checks.hasLower ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className="text-[10px] font-bold">✓</span>
                        </div>
                        <span className={getPasswordStrength(form.password).checks.hasLower ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          حرف صغير واحد (a-z)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-row-reverse justify-end">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          getPasswordStrength(form.password).checks.hasNumber ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className="text-[10px] font-bold">✓</span>
                        </div>
                        <span className={getPasswordStrength(form.password).checks.hasNumber ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          رقم واحد على الأقل (0-9)
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-row-reverse justify-end sm:col-span-2">
                        <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          getPasswordStrength(form.password).checks.hasSpecial ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'
                        }`}>
                          <span className="text-[10px] font-bold">✓</span>
                        </div>
                        <span className={getPasswordStrength(form.password).checks.hasSpecial ? 'text-emerald-700 font-bold' : 'text-slate-500'}>
                          رمز خاص واحد على الأقل (!@#$%^&*)
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">تأكيد كلمة المرور <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <input 
                    required 
                    type={showConfirmPassword ? "text" : "password"} 
                    value={form.confirmPassword || ''} 
                    onChange={e => setForm({...form, confirmPassword: e.target.value})} 
                    className="w-full pl-12 pr-10 py-3 text-left rounded-xl border border-slate-200 focus:border-amber-500 outline-none font-mono" 
                    dir="ltr" 
                    placeholder="********" 
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); setShowConfirmPassword(true); }}
                    onMouseUp={() => setShowConfirmPassword(false)}
                    onMouseLeave={() => setShowConfirmPassword(false)}
                    onTouchStart={(e) => { e.preventDefault(); setShowConfirmPassword(true); }}
                    onTouchEnd={() => setShowConfirmPassword(false)}
                    onTouchCancel={() => setShowConfirmPassword(false)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none p-1.5 rounded-lg active:bg-slate-50 cursor-pointer"
                    title="اضغط مستمراً لإظهار كلمة المرور"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && (
                  <p className="text-xs text-red-600 mt-1.5 font-bold text-right">⚠️ كلمتا المرور غير متطابقتين</p>
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.pledgeCorrectness} onChange={e => setForm({...form, pledgeCorrectness: e.target.checked})} className="mt-1 w-4 h-4 accent-amber-500 rounded border-gray-300" />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">أتعهد بصحة جميع البيانات المدخلة وبأنني مسؤول عنها بشكل كامل.</span>
              </label>
              
              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.readPrivacy} onChange={e => setForm({...form, readPrivacy: e.target.checked})} className="mt-1 w-4 h-4 accent-amber-500 rounded border-gray-300" />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">لقد قرأت <a href="/privacy" className="text-blue-600 hover:text-amber-500 underline">سياسة الخصوصية</a> وأوافق عليها.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group">
                <input type="checkbox" checked={form.readTerms} onChange={e => setForm({...form, readTerms: e.target.checked})} className="mt-1 w-4 h-4 accent-amber-500 rounded border-gray-300" />
                <span className="text-sm text-slate-600 group-hover:text-slate-900 transition-colors">لقد قرأت <a href="/terms" className="text-blue-600 hover:text-amber-500 underline">الشروط والأحكام</a> وأوافق عليها.</span>
              </label>

              <label className="flex items-start gap-3 cursor-pointer group bg-amber-50/50 p-2 rounded-lg border border-amber-100">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="mt-1 w-4 h-4 accent-amber-500 rounded border-gray-300" />
                <span className="text-sm text-amber-800 font-medium">حفظ بياناتي لتسهيل عملية الدخول لاحقاً</span>
              </label>
            </div>

            {form.password && !isPasswordSecure && (
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200/80 text-xs text-amber-800 font-bold space-y-1 text-right leading-relaxed animate-in fade-in duration-200">
                <p className="flex items-center gap-1.5 flex-row-reverse justify-end">
                  <span>⚠️ كلمة المرور الحالية ضعيفة. يرجى تلبية 4 شروط على الأقل من المعايير أعلاه لتفعيل التسجيل.</span>
                </p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={!isFormValid}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex justify-center items-center gap-2 ${
                isFormValid 
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-900 shadow-lg shadow-amber-500/20 cursor-pointer' 
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              <CheckCircle2 className="w-6 h-6" /> تسجيل حساب جديد
            </button>
          </form>
        </div>

        {/* OTP Modal */}
        {showOtpModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-blue-950/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-blue-50 text-blue-950 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-bold text-slate-800 mb-2">كود التحقق (OTP)</h3>
                <p className="text-slate-500">{getOtpMessage()}</p>
              </div>

              <div className="flex justify-center gap-2 mb-8" dir="ltr">
                {otpInputs.map((digit, index) => (
                  <input
                    key={index}
                    ref={el => { if (el) inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={e => handleOtpChange(index, e.target.value)}
                    onKeyDown={e => handleKeyDown(index, e)}
                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl border border-slate-200 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  />
                ))}
              </div>

              <button 
                onClick={handleVerifyOtp}
                disabled={otpInputs.join('').length < 6}
                className="w-full bg-blue-950 hover:bg-blue-900 text-white font-bold py-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4 flex items-center justify-center gap-2"
              >
                تأكيد الكود <ArrowRight className="w-5 h-5 rotate-180" />
              </button>

              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-slate-500 text-sm">
                    إعادة إرسال الكود خلال <strong className="text-amber-500">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</strong>
                  </p>
                ) : (
                  <button onClick={() => setCountdown(240)} className="text-blue-600 hover:text-blue-800 font-bold text-sm flex items-center justify-center gap-1 mx-auto transition-colors">
                    <RotateCcw className="w-4 h-4" /> إعادة إرسال الكود
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
