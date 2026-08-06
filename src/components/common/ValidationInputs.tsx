import React, { useState, ChangeEvent } from 'react';
import { 
  nationalIdRegex, 
  crNumberRegex, 
  taxNumberRegex, 
  saudiPhoneRegex, 
  passwordRegex,
  sanitizeSaudiPhone
} from '../../utils/validations';

interface BaseInputProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  className?: string;
  name?: string;
  disabled?: boolean;
}

export function NationalIdInput({ value, onChange, label = "رقم الهوية الوطنية / الإقامة", required, className, disabled, ...props }: BaseInputProps) {
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 10);
    e.target.value = val;
    onChange(e);
    
    if (val.length > 0 && !nationalIdRegex.test(val)) {
      setError('يجب أن يكون 10 أرقام ويبدأ بـ 1 أو 2');
    } else {
      setError('');
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>}
      <input 
        type="text" 
        value={value || ''} 
        onChange={handleChange} 
        placeholder="10 أرقام تبدأ بـ 1 أو 2" 
        dir="ltr"
        disabled={disabled}
        className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono disabled:bg-slate-50 disabled:text-slate-500"
        {...props}
      />
      {error && <span className="text-xs text-orange-500 font-medium">{error}</span>}
    </div>
  );
}

export function CrNumberInput({ value, onChange, label = "رقم السجل التجاري", required, className, disabled, ...props }: BaseInputProps) {
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 10);
    e.target.value = val;
    onChange(e);
    
    if (val.length > 0 && !crNumberRegex.test(val)) {
      setError('يجب أن يكون 10 أرقام فقط');
    } else {
      setError('');
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>}
      <input 
        type="text" 
        value={value || ''} 
        onChange={handleChange} 
        placeholder="10 أرقام" 
        dir="ltr"
        disabled={disabled}
        className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono disabled:bg-slate-50 disabled:text-slate-500"
        {...props}
      />
      {error && <span className="text-xs text-orange-500 font-medium">{error}</span>}
    </div>
  );
}

export function TaxNumberInput({ value, onChange, label = "الرقم الضريبي", required, className, disabled, ...props }: BaseInputProps) {
  const [error, setError] = useState('');

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 15);
    e.target.value = val;
    onChange(e);
    
    if (val.length > 0 && !taxNumberRegex.test(val)) {
      setError('يجب أن يكون 15 رقماً فقط');
    } else {
      setError('');
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>}
      <input 
        type="text" 
        value={value || ''} 
        onChange={handleChange} 
        placeholder="15 رقماً" 
        dir="ltr"
        disabled={disabled}
        className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono disabled:bg-slate-50 disabled:text-slate-500"
        {...props}
      />
      {error && <span className="text-xs text-orange-500 font-medium">{error}</span>}
    </div>
  );
}

export function PhoneInput({ value, onChange, label = "رقم الجوال", required, className, disabled, ...props }: BaseInputProps) {
  const [error, setError] = useState('');
  
  // قائمة رموز الدول الأكثر شيوعاً
  const countryCodes = [
    { code: '+966', name: '🇸🇦 السعودية', regex: /^05\d{8}$/ },
    { code: '+971', name: '🇦🇪 الإمارات', regex: /^\d{9}$/ },
    { code: '+965', name: '🇰🇼 الكويت', regex: /^\d{8}$/ },
    { code: '+974', name: '🇶🇦 قطر', regex: /^\d{8}$/ },
    { code: '+973', name: '🇧🇭 البحرين', regex: /^\d{8}$/ },
    { code: '+968', name: '🇴🇲 عمان', regex: /^\d{8}$/ },
    { code: '+20', name: '🇪🇬 مصر', regex: /^\d{10}$/ },
    { code: '+962', name: '🇯🇴 الأردن', regex: /^\d{9}$/ },
  ];

  // استخراج رمز الدولة والرقم من القيمة الحالية
  const getParts = (fullValue: string) => {
    if (!fullValue) return { prefix: '+966', number: '' };

    let clean = fullValue.trim();
    // إزالة تكرار بادئة +966 إذا كانت موجودة بأي شكل متكرر
    clean = clean.replace(/(\+?966)+/g, '+966');

    const sortedCodes = [...countryCodes].sort((a, b) => b.code.length - a.code.length);
    const foundCode = sortedCodes.find(c => clean.startsWith(c.code));
    
    if (foundCode) {
      let num = clean.substring(foundCode.code.length);
      if (foundCode.code === '+966') {
        if (num.startsWith('5')) {
          num = '0' + num;
        }
      }
      return { 
        prefix: foundCode.code, 
        number: num 
      };
    }
    
    if (clean.startsWith('05')) {
       return { prefix: '+966', number: clean };
    }
    
    if (clean.startsWith('5')) {
       return { prefix: '+966', number: '0' + clean };
    }

    return { prefix: '+966', number: clean.replace(/^\+966/, '') };
  };

  const { prefix, number } = getParts(value);

  const updatePhone = (newPrefix: string, newNumber: string) => {
    let cleanDigits = newNumber.replace(/\D/g, '');
    let finalPhoneValue = '';

    if (newPrefix === '+966') {
      if (cleanDigits.startsWith('9665')) {
        cleanDigits = '05' + cleanDigits.substring(4);
      } else if (cleanDigits.startsWith('966')) {
        cleanDigits = cleanDigits.substring(3);
        if (cleanDigits.startsWith('5')) cleanDigits = '0' + cleanDigits;
      } else if (cleanDigits.startsWith('5')) {
        cleanDigits = '0' + cleanDigits;
      }
      
      cleanDigits = cleanDigits.substring(0, 10);
      
      if (cleanDigits.length > 0) {
        if (cleanDigits.startsWith('05')) {
          finalPhoneValue = '+966' + cleanDigits.substring(1);
        } else {
          finalPhoneValue = '+966' + cleanDigits;
        }
      } else {
        finalPhoneValue = '';
      }
    } else {
      cleanDigits = cleanDigits.substring(0, 12);
      finalPhoneValue = cleanDigits ? newPrefix + cleanDigits : '';
    }

    const syntheticEvent = {
       target: {
         value: finalPhoneValue,
         name: (props as any).name || ''
       }
    } as unknown as ChangeEvent<HTMLInputElement>;

    onChange(syntheticEvent);

    if (newPrefix === '+966') {
      const isComplete = (cleanDigits.startsWith('05') && cleanDigits.length === 10);
      if (cleanDigits.length > 0 && !isComplete) {
        if (!cleanDigits.startsWith('05')) {
          setError('رقم الجوال يجب أن يبدأ بـ 05');
        } else {
          setError('رقم الجوال ناقص (يجب أن يتكون من 10 أرقام)');
        }
      } else {
        setError('');
      }
    } else {
      setError(cleanDigits.length >= 8 ? '' : 'رقم الجوال غير مكتمل لهذا البلد');
    }
  };

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && <label className="block text-sm font-medium text-slate-700">{label} {required && <span className="text-red-500">*</span>}</label>}
      <div className="flex gap-2 items-center">
        {/* حقل رمز الدولة المستقل */}
        <div className="relative shrink-0 w-32">
          <select 
            value={prefix || '+966'}
            onChange={(e) => updatePhone(e.target.value, number)}
            disabled={disabled}
            className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none bg-slate-50 text-sm font-bold appearance-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-70 disabled:bg-slate-100"
            dir="ltr"
          >
            {countryCodes.map(c => (
              <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
            ))}
          </select>
          <div className="absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
          </div>
        </div>

        {/* حقل رقم الجوال */}
        <div className="relative flex-1">
          <input 
            type="text" 
            value={number || ''} 
            onChange={(e) => updatePhone(prefix, e.target.value)} 
            placeholder={prefix === '+966' ? "05XXXXXXXX" : "رقم الجوال"} 
            dir="ltr"
            disabled={disabled}
            className={`w-full p-3 rounded-xl border ${error ? 'border-orange-500 focus:ring-orange-500/10' : 'border-slate-200 focus:border-amber-500'} focus:ring-4 focus:ring-amber-500/10 outline-none text-left font-mono transition-all disabled:bg-slate-50 disabled:text-slate-500 disabled:cursor-not-allowed`}
            {...props}
          />
        </div>

        {/* علامة الصح الخضراء خارج الحقول لتفادي التغطية */}
        {prefix === '+966' && number.length === 10 && !error && (
          <div className="shrink-0 text-emerald-500 animate-in zoom-in duration-300">
             <svg className="w-6 h-6 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
             </svg>
          </div>
        )}
      </div>
      {error && <span className="text-xs text-orange-500 font-medium px-1">{error}</span>}
      {!disabled && (
        <span className="text-[10px] text-slate-400 px-1 font-mono">
          {prefix === '+966' ? 'الصيغة للسعودية: 05XXXXXXXX' : 'أدخل رقم الجوال بدون رمز الدولة'}
        </span>
      )}
    </div>
  );
}

interface PasswordValidationProps {
  passwordValue: string;
  confirmValue: string;
  onPasswordChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onConfirmChange: (e: ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  label?: string;
  confirmLabel?: string;
}

export function PasswordValidationInputs({ 
  passwordValue, confirmValue, 
  onPasswordChange, onConfirmChange, 
  className,
  label = "كلمة المرور",
  confirmLabel = "تأكيد كلمة المرور"
}: PasswordValidationProps) {
  const [passError, setPassError] = useState('');
  const [confirmError, setConfirmError] = useState('');

  const getPasswordStrength = (pass: string) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 9) score++;
    if (/[a-z]/.test(pass)) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/\d/.test(pass)) score++;
    if (/[@$!%*?&()_+\-=[\]{};':"\\|,.<>/?~`]/.test(pass)) score++;
    return score;
  };

  const handlePassChange = (e: ChangeEvent<HTMLInputElement>) => {
    onPasswordChange(e);
    const val = e.target.value;
    if (val.length > 0 && !passwordRegex.test(val)) {
      setPassError('يجب أن تحتوي كلمة المرور على 9 خانات على الأقل، تتضمن حروفاً كبيرة وصغيرة، أرقاماً، ورموزاً.');
    } else {
      setPassError('');
    }
    
    if (confirmValue && val !== confirmValue) {
      setConfirmError('كلمات المرور غير متطابقة.');
    } else {
      setConfirmError('');
    }
  };

  const handleConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    onConfirmChange(e);
    if (e.target.value !== passwordValue) {
      setConfirmError('كلمات المرور غير متطابقة.');
    } else {
      setConfirmError('');
    }
  };

  const strengthScore = getPasswordStrength(passwordValue);
  
  let strengthLabel = 'ضعيف جداً';
  let strengthColor = 'bg-rose-500';
  let strengthBg = 'bg-rose-50';
  let strengthBorder = 'border-rose-100';
  let strengthTextColor = 'text-rose-600';
  let strengthPercent = 'w-1/5';

  if (strengthScore === 2) {
    strengthLabel = 'ضعيف';
    strengthColor = 'bg-orange-500';
    strengthBg = 'bg-orange-50';
    strengthBorder = 'border-orange-100';
    strengthTextColor = 'text-orange-600';
    strengthPercent = 'w-2/5';
  } else if (strengthScore === 3) {
    strengthLabel = 'متوسط';
    strengthColor = 'bg-amber-500';
    strengthBg = 'bg-amber-50';
    strengthBorder = 'border-amber-100';
    strengthTextColor = 'text-amber-600';
    strengthPercent = 'w-3/5';
  } else if (strengthScore === 4) {
    strengthLabel = 'جيد';
    strengthColor = 'bg-blue-500';
    strengthBg = 'bg-blue-50';
    strengthBorder = 'border-blue-100';
    strengthTextColor = 'text-blue-600';
    strengthPercent = 'w-4/5';
  } else if (strengthScore === 5) {
    strengthLabel = 'قوي جداً';
    strengthColor = 'bg-emerald-500';
    strengthBg = 'bg-emerald-50';
    strengthBorder = 'border-emerald-100';
    strengthTextColor = 'text-emerald-600';
    strengthPercent = 'w-full';
  }

  const checks = [
    { label: '9 خانات على الأقل', met: passwordValue.length >= 9 },
    { label: 'حرف صغير (a-z)', met: /[a-z]/.test(passwordValue) },
    { label: 'حرف كبير (A-Z)', met: /[A-Z]/.test(passwordValue) },
    { label: 'أرقام (0-9)', met: /\d/.test(passwordValue) },
    { label: 'رمز خاص (@$!%*?)', met: /[@$!%*?&()_+\-=[\]{};':"\\|,.<>/?~`]/.test(passwordValue) }
  ];

  return (
    <div className={`flex flex-col gap-4 ${className || ''}`}>
      <div className="flex flex-col gap-1">
        <label className="block text-sm font-medium text-slate-700">{label}</label>
        <input 
          type="password" 
          value={passwordValue || ''} 
          onChange={handlePassChange} 
          dir="ltr"
          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono"
        />
        
        {passwordValue && (
          <div className="mt-2 space-y-2 p-3 rounded-xl border transition-all" style={{ contentVisibility: 'auto' }}>
            <div className={`text-xs font-bold ${strengthTextColor} flex justify-between items-center`}>
              <span>مستوى أمان كلمة المرور: {strengthLabel}</span>
              <span className="font-mono">{strengthScore * 20}%</span>
            </div>
            
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full ${strengthColor} transition-all duration-300 ${strengthPercent}`} />
            </div>

            <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1">
              {checks.map((chk, idx) => (
                <div key={idx} className="flex items-center gap-1.5 text-[11px]">
                  {chk.met ? (
                    <span className="text-emerald-500 font-bold">✓</span>
                  ) : (
                    <span className="text-slate-300">•</span>
                  )}
                  <span className={chk.met ? 'text-emerald-700 font-medium' : 'text-slate-400'}>
                    {chk.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {passError && !passwordValue && (
          <span className="text-xs text-orange-500 font-medium">{passError}</span>
        )}
        {!passwordValue && (
          <span className="text-xs text-slate-400">
            يجب أن تحتوي على 8 خانات على الأقل، حروف إنجليزية كبيرة وصغيرة، أرقام، ورموز.
          </span>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label className="block text-sm font-medium text-slate-700">{confirmLabel}</label>
        <input 
          type="password" 
          value={confirmValue || ''} 
          onChange={handleConfirmChange} 
          dir="ltr"
          className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left font-mono"
        />
        {confirmError && <span className="text-xs text-red-500 font-medium">{confirmError}</span>}
      </div>
    </div>
  );
}
