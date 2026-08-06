import React, { useState, ChangeEvent, useEffect } from 'react';
import { saudiBankCodes, sanitizeIban } from '../../utils/validations';

interface IbanInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  className?: string;
}

export default function IbanInput({ value, onChange, error, className }: IbanInputProps) {
  const [bankName, setBankName] = useState<string>('');
  const [bankWarning, setBankWarning] = useState<string>('');

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const sanitized = sanitizeIban(e.target.value);
    onChange(sanitized);
  };

  useEffect(() => {
    const cleanIban = (value || '').replace(/\s+/g, '').toUpperCase();
    
    if (cleanIban.length >= 8) {
      // الرمز البنكي يبدأ من الخانة الخامسة حتى الثامنة
      const bankCode = cleanIban.substring(4, 8);
      const name = saudiBankCodes[bankCode];
      
      if (name) {
        setBankName(name);
        setBankWarning('');
      } else {
        setBankName('');
        // نظهر التحذير إذا أدخل 8 حروف على الأقل ولم يتعرف على البنك
        setBankWarning('تنبيه: رمز البنك غير معروف، يرجى التأكد من صحة الآيبان.');
      }
    } else {
      setBankName('');
      setBankWarning('');
    }
  }, [value]);

  return (
    <div className={`flex flex-col gap-2 ${className || ''}`}>
      <label className="text-sm font-bold text-slate-700">رقم الآيبان (IBAN)</label>
      <input
        type="text"
        dir="ltr"
        className={`w-full p-3 rounded-xl border outline-none text-left font-mono transition-colors focus:ring-2 ${
          error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500/20'
        }`}
        placeholder="SA00 0000 0000 0000 0000 0000"
        value={value || ''}
        onChange={handleInputChange}
      />
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      {bankWarning && !error && <span className="text-xs text-orange-500 font-medium">{bankWarning}</span>}

      <div className="mt-2">
        <label className="text-sm font-bold text-slate-700 mb-2 block">اسم البنك (تلقائي)</label>
        <input
          type="text"
          readOnly
          className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 outline-none cursor-not-allowed"
          placeholder="سيتم التعرف على البنك تلقائياً"
          value={bankName}
        />
      </div>
    </div>
  );
}
