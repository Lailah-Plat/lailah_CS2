/**
 * @file validations.ts
 * @description وحدة التحقق القواعدي والدسومات (Validations & Schemas) الخاصة ببيانات المستخدمين والشركاء لمنصة "ليلة".
 * تشمل قواعد التحقق من أرقام الجوالات السعودية، الآيبان (IBAN)، الهوية الوطنية، السجل التجاري، الرقم الضريبي، وكلمات المرور.
 */

import { z } from 'zod';

/**
 * دليل أكواد وشفرات البنوك السعودية المقترنة برقم الآيبان (IBAN)
 */
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

/** التعبير النمطي للتحقق من رقم الهوية الوطنية أو الإقامة (10 أرقام تبدأ بـ 1 أو 2) */
export const nationalIdRegex = /^[12]\d{9}$/;

/** التعبير النمطي للتحقق من رقم السجل التجاري (10 أرقام) */
export const crNumberRegex = /^\d{10}$/;

/** التعبير النمطي للتحقق من الرقم الضريبي (15 رقماً) */
export const taxNumberRegex = /^\d{15}$/;

/** التعبير النمطي للتحقق من أرقام الجوالات السعودية */
export const saudiPhoneRegex = /^(\+9665|05)\d{8}$/;

/**
 * وظيفة لتنظيف وتوحيد صيغة رقم الجوال السعودي ومنع تكرار الرموز الدولية
 * تحويل الصيغ المختلفة (05x, 9665x, +9665x) إلى الصيغة الدولية الموحدة +9665xxxxxxxx
 * @param phone رقم الجوال الممرر
 * @returns الرقم المنظف بالصيغة القياسية الدولية
 */
export const sanitizeSaudiPhone = (phone: string): string => {
  if (!phone) return '';  
  
  // 1. إزالة جميع الرموز غير الرقمية (ما عدا + في البداية)
  let clean = phone.replace(/[^\d+]/g, '');
  
  // معالجة وإرجاع الصيغة الدولية الموحدة +9665xxxxxxxx
  if (clean.startsWith('009665')) {
    clean = '+9665' + clean.substring(6);
  } else if (clean.startsWith('9665')) {
    clean = '+9665' + clean.substring(4);
  } else if (clean.startsWith('+9665')) {
    // تركها كما هي
  } else if (clean.startsWith('05')) {
    clean = '+9665' + clean.substring(2);
  } else if (clean.startsWith('5')) {
    clean = '+9665' + clean.substring(1);
  } else if (clean.startsWith('+05')) {
    clean = '+9665' + clean.substring(3);
  }
  
  return clean;
};

/** التعبير النمطي للتحقق من قوة كلمة المرور (9 خانات، حرف كبير، حرف صغير، رقم، ورمز خاص) */
export const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{9,}$/;

/**
 * التحقق من سلامة صيغة رقم الحساب البنكي الدولي (آيبان سعودي)
 * @param iban رقم الآيبان
 * @returns boolean صحة صيغة الآيبان
 */
export const isIbanFormatValid = (iban: string): boolean => {
  const cleanIban = iban.replace(/\s+/g, '').toUpperCase();
  return /^SA\d{22}$/.test(cleanIban);
};

/**
 * وظيفة لتطهير رقم الآيبان (IBAN) ومنع تكرار بادئة SA
 * وضبط المسافات بين المجموعات الرقمية (كل 4 أرقام)
 * @param iban رقم الآيبان الممرر
 * @returns رقم الآيبان المنسق
 */
export const sanitizeIban = (iban: string): string => {
  if (!iban) return '';
  
  // 1. تحويل لحروف كبيرة وإزالة المسافات وأي رموز غير مرغوب فيها ما عدا A-Z و 0-9
  let clean = iban.toUpperCase().replace(/[^A-Z0-9]/g, '');
  
  // 2. معالجة تكرار "SA" في البداية
  clean = clean.replace(/^(SA)+/g, 'SA');
  
  // 3. التأكد من وجود البادئة SA
  if (!clean.startsWith('SA')) {
    clean = 'SA' + clean;
  }
  
  // 4. قص النص ليناسب طول الآيبان السعودي (SA + 22 رقم = 24 حرف كحد أقصى)
  const prefix = 'SA';
  const digitsOnly = clean.substring(2).replace(/[^0-9]/g, '');
  clean = prefix + digitsOnly.substring(0, 22);

  // 5. التنسيق الجمالي: مسافة كل 4 خانات
  return clean.match(/.{1,4}/g)?.join(' ') || clean;
};

/**
 * مخطط Zod للتحقق من وثائق الهوية والبيانات الرسمية والمالية للمزودين
 */
export const identitySchema = z.object({
  nationalId: z.string().regex(nationalIdRegex, "رقم الهوية/الإقامة يجب أن يتكون من 10 أرقام ويبدأ بـ 1 أو 2."),
  crNumber: z.string().regex(crNumberRegex, "رقم السجل التجاري يجب أن يتكون من 10 أرقام فقط."),
  taxNumber: z.string().regex(taxNumberRegex, "الرقم الضريبي يجب أن يتكون من 15 رقماً فقط."),
  phoneNumber: z.string().regex(saudiPhoneRegex, "رقم الجوال يجب أن يبدأ بـ 05 أو +9665 ومتبوعاً بـ 8 أرقام."),
  
  iban: z.string().refine(
    (val) => isIbanFormatValid(val),
    { message: "صيغة الآيبان غير صحيحة، يجب أن يبدأ بـ SA ويليه 22 رقماً." }
  )
});

/**
 * مخطط Zod للتحقق من كلمة المرور وتأكيدها
 */
export const passwordSchema = z.object({
  password: z.string().regex(passwordRegex, "كلمة المرور يجب أن تحتوي على 9 خانات على الأقل، حروف كبيرة وصغيرة، أرقام، ورموز خاصة."),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة.",
  path: ["confirmPassword"]
});

/**
 * مخطط Zod الكامل لتسجيل حساب جديد
 */
export const registerSchema = z.object({
  phoneNumber: z.string().regex(saudiPhoneRegex, "رقم الجوال يجب أن يبدأ بـ 05 أو +9665 ومتبوعاً بـ 8 أرقام."),
  password: z.string().regex(passwordRegex, "كلمة المرور يجب أن تحتوي على 9 خانات على الأقل، حروف كبيرة وصغيرة، أرقام، ورموز خاصة."),
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "كلمات المرور غير متطابقة.",
  path: ["confirmPassword"]
});

