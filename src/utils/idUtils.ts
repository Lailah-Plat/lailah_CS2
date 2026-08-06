/**
 * @file idUtils.ts
 * @description وحدة توليد وصياغة المعرفات والأرقام التسلسلية الموحدة لمنصة "ليلة".
 * تلتزم هذه الوحدة بدقة بقواعد النظام المعتمدة وتنسيقات الأرقام القياسية:
 * 1. رقم حجز القاعة: BKG-YY-XXXXXXXXXX
 * 2. رقم طلب الخدمة: SRV-YY-XXXXXXXXXX
 * 3. رقم الفاتورة: INV-YYXXXXXXXXXX (بدون واصلة بعد السنة)
 * 4. رقم الإيرادات المالية: REV-YY-XXXXXXXXXX
 * 5. رقم المصروفات المالية: EXP-YY-XXXXXXXXXX
 */

import { convertDigits } from './digitConverter';

/**
 * صياغة رقم طلب الخدمة المساندة وفق المعيار القياسي (SRV-YY-XXXXXXXXXX).
 * @param id المعرف الرقمي أو النصي الحالي
 * @returns المعرف المنسق بالصيغة SRV-YY-XXXXXXXXXX
 */
export const formatServiceRequestId = (id: number | string) => {
  // استخراج أخر رقمين من السنة الحالية (مثال: 26 لعام 2026)
  const yy = new Date().getFullYear().toString().slice(-2);
  // تنظيف المعرف من أي حروف غير رقمية
  const cleanId = typeof id === 'string' ? id.replace(/\D/g, '') : id;
  // محاذاة الرقم إلى 10 خانات بإضافة أصفار من اليسار
  const paddedId = String(cleanId || 1).padStart(10, '0');
  // إرجاع الرقم المنسق مع تحويل الأرقام إذا لزم الأمر
  return convertDigits(`SRV-${yy}-${paddedId}`);
};

/**
 * صياغة رقم حجز القاعة وفق المعيار القياسي (BKG-YY-XXXXXXXXXX).
 * @param id المعرف الرقمي أو النصي الحالي
 * @returns المعرف المنسق بالصيغة BKG-YY-XXXXXXXXXX
 */
export const formatBookingId = (id: number | string) => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const cleanId = typeof id === 'string' ? id.replace(/\D/g, '') : id;
  const paddedId = String(cleanId || 1).padStart(10, '0');
  return convertDigits(`BKG-${yy}-${paddedId}`);
};

/**
 * صياغة رقم الفاتورة الضريبية وفق المعيار القياسي (INV-YYXXXXXXXXXX - بدون واصلة بعد السنة).
 * @param id المعرف الرقمي أو النصي الحالي
 * @returns المعرف المنسق بالصيغة INV-YYXXXXXXXXXX
 */
export const formatInvoiceId = (id: number | string) => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const cleanId = typeof id === 'string' ? id.replace(/\D/g, '') : id;
  const paddedId = String(cleanId || 1).padStart(10, '0');
  return convertDigits(`INV-${yy}${paddedId}`);
};

/**
 * صياغة رقم الإيرادات المالية وفق المعيار القياسي (REV-YY-XXXXXXXXXX).
 * @param id المعرف الرقمي أو النصي الحالي
 * @returns المعرف المنسق بالصيغة REV-YY-XXXXXXXXXX
 */
export const formatRevenueId = (id: number | string) => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const cleanId = typeof id === 'string' ? id.replace(/\D/g, '') : id;
  const paddedId = String(cleanId || 1).padStart(10, '0');
  return convertDigits(`REV-${yy}-${paddedId}`);
};

/**
 * صياغة رقم المصروفات المالية وفق المعيار القياسي (EXP-YY-XXXXXXXXXX).
 * @param id المعرف الرقمي أو النصي الحالي
 * @returns المعرف المنسق بالصيغة EXP-YY-XXXXXXXXXX
 */
export const formatExpenseId = (id: number | string) => {
  const yy = new Date().getFullYear().toString().slice(-2);
  const cleanId = typeof id === 'string' ? id.replace(/\D/g, '') : id;
  const paddedId = String(cleanId || 1).padStart(10, '0');
  return convertDigits(`EXP-${yy}-${paddedId}`);
};

