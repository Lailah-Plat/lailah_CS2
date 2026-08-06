/**
 * @file safeStorage.ts
 * @description وحدة التخزين الآمن المحلي (Safe LocalStorage Utility) لمنصة "ليلة".
 * تقوم بتنظيف وتجريد النصوص والبيانات الضخمة قبل التخزين لتفادي أخطاء وتجاوز المساحة المتاحة (QuotaExceededError).
 */

/**
 * تنظيف الكائن الممرر وتجريد الوسائط والنصوص ذات الأحجام الضخمة (مثل Base64 ومعاينات الصور والملفات)
 * @param obj الكائن أو المصفوفة المراد تنظيفها
 * @returns الكائن بعد إزالة القيم الضخمة
 */
export function stripLargeDataUrls(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(item => stripLargeDataUrls(item));
  } else if (obj !== null && typeof obj === 'object') {
    const copy: any = {};
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'string' && (v.startsWith('data:') || v.length > 50000)) {
        // تجريد نصوص Base64 الضخمة ومعاينات الملفات الحساسة والتراخيص
        if (
          k.toLowerCase().includes('file') || 
          k.toLowerCase().includes('preview') || 
          k.toLowerCase().includes('image') || 
          k.toLowerCase().includes('cr') || 
          k.toLowerCase().includes('vat') || 
          k.toLowerCase().includes('iban') ||
          k.toLowerCase().includes('pdf') ||
          v.startsWith('data:')
        ) {
          copy[k] = ''; // استبدال بنص فارغ لتوفير المساحة
        } else {
          // اقتطاع النصوص غير الصور المفرطة الحجم إذا تجاوزت 50 كيلوبايت
          copy[k] = v.substring(0, 1000);
        }
      } else if (typeof v === 'object' && v !== null) {
        copy[k] = stripLargeDataUrls(v);
      } else {
        copy[k] = v;
      }
    }
    return copy;
  }
  return obj;
}

/**
 * حفظ آمن للقيم في LocalStorage مع آلية معالجة التجاوز وتفريغ المساحة الاحتياطي
 * @param key مفتاح التخزين
 * @param value القيمة المراد حفظها (نص أو كائن)
 * @returns boolean نجاح عملية الحفظ
 */
export function safeSetLocalStorage(key: string, value: any): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return false;

  try {
    const serialized = typeof value === 'string' ? value : JSON.stringify(value);
    localStorage.setItem(key, serialized);
    return true;
  } catch (err) {
    console.warn(`[safeSetLocalStorage] فشل المحاولة الأولى للحفظ في المفتاح "${key}"، جاري معالجة حمولة البيانات...`, err);

    // المحاولة 1: تجريد ملفات Base64 وتفريغ العناصر الزائدة في المصفوفات
    try {
      if (typeof value === 'object' && value !== null) {
        let cleaned = stripLargeDataUrls(value);
        if (Array.isArray(cleaned) && cleaned.length > 30) {
          cleaned = cleaned.slice(0, 30);
        }
        const cleanedStr = JSON.stringify(cleaned);
        localStorage.setItem(key, cleanedStr);
        console.info(`[safeSetLocalStorage] تم الحفظ بنجاح بعد تحسين البيانات للمفتاح "${key}".`);
        return true;
      }
    } catch (err2) {
      console.warn(`[safeSetLocalStorage] فشل محاولة تنظيف حمولة البيانات للمفتاح "${key}".`, err2);
    }

    // المحاولة 2: مسح المفاتيح المؤقتة والمسودات القديمة من التخزين لتحرير المساحة
    try {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (
          k && 
          k !== key && 
          (k.startsWith('temp_') || k.startsWith('draft_') || k.includes('ACTIVITY') || k.includes('LOG') || k.includes('CACHE'))
        ) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      // إعادة محاولة الحفظ بعد تفريغ المساحة
      let finalVal = typeof value === 'object' && value !== null ? stripLargeDataUrls(value) : value;
      if (Array.isArray(finalVal) && finalVal.length > 20) {
        finalVal = finalVal.slice(0, 20);
      }
      const finalStr = typeof finalVal === 'string' ? finalVal : JSON.stringify(finalVal);
      localStorage.setItem(key, finalStr);
      return true;
    } catch (err3) {
      // المحاولة 3: اقتطاع شديد للمصفوفة
      try {
        if (Array.isArray(value)) {
          const ultraTrimmed = stripLargeDataUrls(value.slice(0, 10));
          localStorage.setItem(key, JSON.stringify(ultraTrimmed));
          return true;
        }
      } catch (err4) {
        // تجاهل
      }
      console.warn(`[safeSetLocalStorage] تعذر حل خطأ المساحة للمفتاح "${key}".`);
      return false;
    }
  }
}

/**
 * استرجاع آمن للقيم من LocalStorage مع دعم القيمة الافتراضية
 * @template T نوع البيانات المتوقع
 * @param key مفتاح التخزين
 * @param fallback القيمة الافتراضية في حال عدم وجود المفتاح أو حدوث خطأ
 * @returns البيانات المسترجعة أو القيمة الافتراضية
 */
export function safeGetLocalStorage<T = any>(key: string, fallback: T): T {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') return fallback;
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    return JSON.parse(item) as T;
  } catch (err) {
    console.warn(`[safeGetLocalStorage] خطأ في قراءة القيمة للمفتاح "${key}"`, err);
    return fallback;
  }
}

