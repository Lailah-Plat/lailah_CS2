/**
 * @file contentModeration.ts
 * @description وحدة الإشراف والفلترة التلقائية للمحتوى (Content Moderation & Masking Utility) لمنصة "ليلة".
 * تقوم بفحص وحجب وسائل التواصل الخارجي (أرقام الهواتف، البريد الإلكتروني، الحسابات) والألفاظ المخالفة،
 * مع استثناء حساب الإدارة العليا (Admin) لتمكينهم من الاطلاع على النص الأصلي الكامل لدواعي الرقابة والتحقيق.
 */

/**
 * قائمة الكلمات والألفاظ النابية والمخالفة لسياسات المنصة
 */
export const PROFANITY_WORDS = [
  'خراء', 'زق', 'كلب', 'حمار', 'حقير', 'سافل', 'قذر', 'طيز', 'كس', 'زب', 'شرموط', 'شرموطة',
  'عرصة', 'غبي', 'احمق', 'أحمق', 'عاهرة', 'حيوان', 'واطي', 'وسخ', 'تفه', 'انعل', 'يلعن', 'اللعنة',
  'fuck', 'shit', 'bitch', 'asshole', 'bastard', 'crap', 'dick', 'pussy', 'slut', 'whore'
];

/**
 * واجهة نتيجة فحص المحتوى المخالف
 */
export interface ModerationCheckResult {
  /** هل يحتوي النص على مخالفة */
  prohibited: boolean;
  /** أسباب وحيثيات المخالفة المرصودة */
  reasons: string[];
  /** النص بعد إخفاء وحجب الكلمات والأرقام المخالفة */
  maskedText: string;
}

/**
 * فحص النص الممرر ورصد أي أرقام هواتف أو بريد إلكتروني أو روابط اجتماعية أو ألفاظ بذيئة
 * @param text النص المراد فحصه
 * @param userRole رتبة المستخدم الحالي
 * @returns ModerationCheckResult نتيجة الفحص المفصلة
 */
export const checkProhibitedContent = (text: string, userRole?: string): ModerationCheckResult => {
  if (!text) return { prohibited: false, reasons: [], maskedText: '' };

  const reasons: string[] = [];
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  const phoneRegex = /(?:\+?966|0)?5\d{8}|\b05\d{8}\b|\+?\d{9,15}/g;
  const socialRegex = /(?:@|facebook|instagram|twitter|snapchat|tiktok|linkedin|whatsapp|واتساب|سناب|تيك\s*توك|انستقرام|تلجرام)[\w.]*/gi;

  if (emailRegex.test(text)) {
    reasons.push('بريد إلكتروني شخصي');
  }
  if (phoneRegex.test(text)) {
    reasons.push('رقم جوال/هاتف تواصل مباشر');
  }
  if (socialRegex.test(text)) {
    reasons.push('معرف تواصل أونلاين/تواصل اجتماعي');
  }

  for (const word of PROFANITY_WORDS) {
    if (!word) continue;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(escaped, 'gi');
    if (wordRegex.test(text)) {
      if (!reasons.includes('ألفاظ غير لائقة ومخالفة')) {
        reasons.push('ألفاظ غير لائقة ومخالفة');
      }
      break;
    }
  }

  const maskedText = maskProhibitedContent(text, userRole);

  return {
    prohibited: reasons.length > 0,
    reasons,
    maskedText
  };
};

/**
 * حجب واستبدال البيانات والمصطلحات المخالفة بنجوم (***)
 * استثناء الإدارة (userRole === 'admin') حيث يتم إرجاع النص الأصلي كاملاً بدون حجب.
 * @param text النص المراد معالجته
 * @param userRole رتبة المستخدم النشط
 * @returns النص بعد الحجب والتنقية
 */
export const maskProhibitedContent = (text: string, userRole?: string): string => {
  if (!text) return '';

  // استثناء الإدارة العليا: إظهار النص الكامل بدواعي الرقابة والتحكم
  if (userRole === 'admin') {
    return text;
  }

  let sanitized = text;

  // 1. حجب عناوين البريد الإلكتروني
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi;
  sanitized = sanitized.replace(emailRegex, '***@***.***');

  // 2. حجب أرقام الهواتف والجوالات
  const phoneRegex = /(?:\+?966|0)?5\d{8}|\b05\d{8}\b|\+?\d{9,15}/g;
  sanitized = sanitized.replace(phoneRegex, '***');

  // 3. حجب الحسابات والروابط الخارجية
  const socialRegex = /(?:@|facebook|instagram|twitter|snapchat|tiktok|linkedin|whatsapp|واتساب|سناب|تيك\s*توك|انستقرام|تلجرام)[\w.]*/gi;
  sanitized = sanitized.replace(socialRegex, '***');

  // 4. حجب الألفاظ النابية والكلمات غير اللائقة
  for (const word of PROFANITY_WORDS) {
    if (!word) continue;
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const wordRegex = new RegExp(escaped, 'gi');
    sanitized = sanitized.replace(wordRegex, '***');
  }

  return sanitized;
};

