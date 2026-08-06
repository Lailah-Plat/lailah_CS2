/**
 * @file helpers.ts
 * @description وحدة الدوال المساعدة العامة وتنسيق العملات وأرقام التسلسل القياسية لمنصة "ليلة".
 * تلتزم بدليل القواعد السيادي لتوليد أرقام الحجوزات والطلبات والفواتير والإيرادات والمصروفات.
 */

/**
 * تنسيق المبالغ المالية وصياغتها بالريال السعودي (ر.س)
 * @param amount المبلغ المالي المراد تنسيقه
 * @returns النص المنسق (مثال: 1,500.00 ر.س)
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س`;
}

/**
 * جلب تصنيف وتنسيق وألوان شارة الحالة التشغيلية (Tailwind CSS)
 * @param status حالة السجل أو الحجز
 * @returns كائن يحتوى على أصناف الخلفية والنص والترجمة العربية للحالة
 */
export function getStatusColor(status: string): { bg: string; text: string; label: string } {
  switch (status?.toLowerCase()) {
    case 'confirmed':
    case 'paid':
    case 'active':
    case 'approved':
      return { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', label: 'مؤكد/مدفوع' };
    case 'pending':
    case 'partial':
    case 'draft':
      return { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', label: 'قيد الانتظار/جزئي' };
    case 'cancelled':
    case 'rejected':
    case 'expired':
      return { bg: 'bg-rose-50 border-rose-200', text: 'text-rose-700', label: 'ملغي/مرفوض' };
    default:
      return { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-700', label: status || 'غير محدد' };
  }
}

/**
 * إكمال الأرقام بأصفار على اليسار لتلبية خانات التسلسل
 * @param num الرقم
 * @param size عدد الخانات الكلي
 * @returns الرقم بصيغة نصية مكتملة بالأصفار
 */
function padZero(num: number, size: number): string {
  let s = num.toString();
  while (s.length < size) s = "0" + s;
  return s;
}

/**
 * توليد رقم حجز القاعات القياسي (BKG-YY-XXXXXXXXXX)
 * @param sequence رقم التسلسل السنوي (يبدأ من 1 كل عام)
 * @param year أرقام السنة (مثال: 26 لعام 2026)
 * @returns رقم الحجز القياسي (مثال: BKG-26-0000000001)
 */
export function generateBookingNumber(sequence: number, year: number = 26): string {
  const yy = padZero(year, 2);
  const seqStr = padZero(sequence, 10);
  return `BKG-${yy}-${seqStr}`;
}

/**
 * توليد رقم طلبات الخدمات القياسي (SRV-YY-XXXXXXXXXX)
 * @param sequence رقم التسلسل السنوي (يبدأ من 1 كل عام)
 * @param year أرقام السنة (مثال: 26 لعام 2026)
 * @returns رقم الطلب القياسي (مثال: SRV-26-0000000001)
 */
export function generateServiceRequestNumber(sequence: number, year: number = 26): string {
  const yy = padZero(year, 2);
  const seqStr = padZero(sequence, 10);
  return `SRV-${yy}-${seqStr}`;
}

/**
 * توليد رقم الفاتورة الصادرة من المنصة (INV-YYXXXXXXXXXX - بدون واصلة بعد السنة)
 * @param sequence رقم التسلسل السنوي (يبدأ من 1 كل عام)
 * @param year أرقام السنة (مثال: 26 لعام 2026)
 * @returns رقم الفاتورة القياسي (مثال: INV-260000000001)
 */
export function generateInvoiceNumber(sequence: number, year: number = 26): string {
  const yy = padZero(year, 2);
  const seqStr = padZero(sequence, 10);
  return `INV-${yy}${seqStr}`;
}

/**
 * توليد رقم الإيرادات المالية (REV-YY-XXXXXXXXXX)
 * @param sequence رقم التسلسل السنوي (يبدأ من 1 كل عام)
 * @param year أرقام السنة (مثال: 26 لعام 2026)
 * @returns رقم الإيراد القياسي (مثال: REV-26-0000000001)
 */
export function generateRevenueNumber(sequence: number, year: number = 26): string {
  const yy = padZero(year, 2);
  const seqStr = padZero(sequence, 10);
  return `REV-${yy}-${seqStr}`;
}

/**
 * توليد رقم المصروفات المالية (EXP-YY-XXXXXXXXXX)
 * @param sequence رقم التسلسل السنوي (يبدأ من 1 كل عام)
 * @param year أرقام السنة (مثال: 26 لعام 2026)
 * @returns رقم المصروف القياسي (مثال: EXP-26-0000000001)
 */
export function generateExpenseNumber(sequence: number, year: number = 26): string {
  const yy = padZero(year, 2);
  const seqStr = padZero(sequence, 10);
  return `EXP-${yy}-${seqStr}`;
}

