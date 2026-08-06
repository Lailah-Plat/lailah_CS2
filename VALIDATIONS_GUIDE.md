# دليل التحقق من المدخلات (Validations & Masking Guide)

هذا الدليل يوضح قواعد التحقق وتنسيق الإدخال (Input Masking) التي تم إعدادها لمنصة "ليلة" (الواجهة الأمامية والخلفية)، بناءً على المعايير الصارمة المطلوبة المطلوبة.

تم استخدام مكتبة **Zod** لإدارة الـ Schemas، نظراً للتكامل السلس مع TypeScript و React Hook Form.

## 1. Zod Schemas (Frontend & Backend)

الملف: \`src/utils/validations.ts\`

يحتوي هذا الملف على جميع التعابير النمطية (Regex) والتدقيقات (Validations) اللازمة للنماذج:

\`\`\`typescript
import { z } from 'zod';

export const saudiBankCodes: Record<string, string> = {
  "8000": "مصرف الراجحي",
  "1000": "البنك الأهلي السعودي (SNB)",
  "1500": "بنك البلاد",
  "2000": "بنك الرياض",
  "3000": "البنك العربي الوطني",
  "4500": "ساب (البنك السعودي الأول)",
  "5500": "البنك السعودي الفرنسي",
  "6500": "البنك السعودي للاستثمار",
  "5000": "بنك الجزيرة",
  "0500": "مصرف الإنماء"
};

// --- قواعد Regex ---
export const nationalIdRegex = /^[12]\\d{9}$/;
export const crNumberRegex = /^\\d{10}$/;
export const taxNumberRegex = /^\\d{15}$/;
export const saudiPhoneRegex = /^05\\d{8}$/;
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$/;

// --- Zod Schemas ---
export const identitySchema = z.object({
  nationalId: z.string().regex(nationalIdRegex, "رقم الهوية/الإقامة يجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2."),
  crNumber: z.string().regex(crNumberRegex, "رقم السجل التجاري يجب أن يتكون من 10 أرقام فقط."),
  taxNumber: z.string().regex(taxNumberRegex, "الرقم الضريبي يجب أن يتكون من 15 رقماً فقط."),
  phoneNumber: z.string().regex(saudiPhoneRegex, "رقم الجوال يجب أن يتكون من 10 أرقام ويبدأ بـ 05."),
  
  iban: z.string().refine(
    (val) => {
      const cleanIban = val.replace(/\\s+/g, '').toUpperCase();
      return /^SA\\d{22}$/.test(cleanIban);
    },
    { message: "صيغة الآيبان غير صحيحة، يجب أن يبدأ بـ SA ويليه 22 رقماً." }
  )
});

export const passwordSchema = z.object({
  password: z.string().regex(passwordRegex, "كلمة المرور يجب أن تحتوي على 8 خانات على الأقل، تتضمن حروفاً كبيرة وصغيرة، أرقاماً، ورموزاً."),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة.",
  path: ["confirmPassword"]
});
\`\`\`

---

## 2. نظام التحقق وتنسيق الحساب البنكي (IBAN & Bank Auto-detection)

يعمل حقل IBAN بشكل ديناميكي لتنسيق النص بمسافات كل 4 أحرف واستخراج رمز البنك لتعبئة اسم الحقل بشكل آلي، مع عرض رسالة تحذيرية في حال استخدام رمز غير صحيح بدون منع الإرسال.

الملف: \`src/components/common/IbanInput.tsx\`

\`\`\`tsx
import React, { useState, ChangeEvent, useEffect } from 'react';
import { saudiBankCodes } from '../../utils/validations';

interface IbanInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string; // أخطاء Zod
}

export default function IbanInput({ value, onChange, error }: IbanInputProps) {
  const [bankName, setBankName] = useState<string>('');
  const [bankWarning, setBankWarning] = useState<string>('');

  const formatIban = (input: string) => {
    // إزالة جميع المسافات وتحويل الأحرف إلى الإنجليزية الكبيرة
    const cleanInput = input.replace(/\\s+/g, '').toUpperCase();
    
    // التقسيم إلى كتل من 4 أحرف (SAXX YYYY ZZZZ MMMM NNNN PPPP)
    const parts = cleanInput.match(/.{1,4}/g);
    return parts ? parts.join(' ') : cleanInput;
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatIban(e.target.value);
    
    // الطول الأقصى للآيبان السعودي بدون مسافات هو 24 حرف
    if (formatted.replace(/\\s+/g, '').length <= 24) {
      onChange(formatted);
    }
  };

  useEffect(() => {
    const cleanIban = value.replace(/\\s+/g, '').toUpperCase();
    
    // إذا وصل المستخدم للرقم الثامن فهذا يعني أنه أدخل رمز البنك (من الخانة 5 لـ 8)
    if (cleanIban.length >= 8) {
      const bankCode = cleanIban.substring(4, 8);
      const name = saudiBankCodes[bankCode];
      
      if (name) {
        setBankName(name);
        setBankWarning('');
      } else {
        setBankName('');
        setBankWarning('تنبيه: رمز البنك غير معروف، يرجى التأكد من صحة الآيبان.');
      }
    } else {
      setBankName('');
      setBankWarning('');
    }
  }, [value]);

  return (
    <div className="flex flex-col gap-2">
      <label className="text-sm font-bold text-slate-700">رقم الآيبان (IBAN)</label>
      <input
        type="text"
        dir="ltr"
        className={\`w-full p-3 rounded-xl border outline-none text-left font-mono transition-colors focus:ring-2 \${
          error ? 'border-red-500 focus:ring-red-500/20' : 'border-slate-200 focus:border-amber-500 focus:ring-amber-500/20'
        }\`}
        placeholder="SA00 0000 0000 0000 0000 0000"
        value={value}
        onChange={handleInputChange}
      />
      
      {/* عرض الأخطاء الإلزامية */}
      {error && <span className="text-xs text-red-500 font-medium">{error}</span>}
      
      {/* عرض تحذير البنك المخصص كتحذير برتقالي (Non-blocking) */}
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
\`\`\`

## 3. حقل إدخال كلمة المرور مع الإرشادات

\`\`\`tsx
// واجهة مقترحة لحقل كلمة المرور داخل نموذج
<div className="flex flex-col gap-2 mb-4">
  <label className="text-sm font-bold text-slate-700">كلمة المرور</label>
  <input 
      type="password"
      dir="ltr"
      className="w-full p-3 rounded-xl border border-slate-200 focus:border-amber-500 outline-none text-left"
      {...register('password')}
  />
  <span className="text-xs text-slate-500">
    يجب أن تحتوي كلمة المرور على 8 خانات على الأقل، تتضمن حروفاً كبيرة وصغيرة، أرقاماً، ورموزاً (@$!%*?&).
  </span>
  {errors.password && <span className="text-xs text-red-500">{errors.password.message}</span>}
</div>
\`\`\`
