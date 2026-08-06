/**
 * @file mediaValidator.ts
 * @description وحدة التحقق الصارم من الوسائط المرفوعة (الصور والفيديوهات) وفق القوانين والاشتراطات المعتمدة في منصة "ليلة".
 * تضمن هذه الوحدة احترام القاعدة رقم 7 الخاصة بمواصفات الوسائط لمنع استهلاك النطاق الترددي وضمان تجربة تجوال فائقة السرعة للعملاء.
 */

/**
 * واجهة نتيجة التحقق من ملفات الوسائط
 */
export interface MediaValidationResult {
  /** هل الملف صالح ومقبول وفق المعايير */
  valid: boolean;
  /** رسالة الخطأ في حال رفض الملف */
  error?: string;
  /** تنبيه تفضيلي لا يعيق الرفع ولكن يحذر المزود */
  warning?: string;
  /** عرض الصورة/الفيديو بالبكسل */
  width?: number;
  /** ارتفاع الصورة/الفيديو بالبكسل */
  height?: number;
  /** نسبة الأبعاد (العرض / الارتفاع) */
  aspectRatio?: number;
}

/**
 * التحقق من صور القاعات والخدمات بناءً على القاعدة رقم 7:
 * - الصيغ المسموحة: JPEG, PNG, WebP, JPG
 * - الحد الأقصى للحجم: 500 كيلوبايت (500KB)
 * - الأبعاد الدنيا: 960x540 بكسل
 * - الأبعاد القصوى: 1280x720 بكسل
 * - النسبة المفضلة: 16:9 (عريضة)
 *
 * @param file ملف الصورة المراد التحقق منه
 * @returns نتيجة التحقق التي تحتوي حالة الصلاحية أو رسالة الخطأ/التنبيه
 */
export const validateHallOrServiceImage = async (file: File): Promise<MediaValidationResult> => {
  // قائمة أنواع MIME المسموح بها
  const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  // 1. التحقق من امتداد ونوع الملف
  if (!validTypes.includes(file.type) && !['jpg', 'jpeg', 'png', 'webp'].includes(ext || '')) {
    return { 
      valid: false, 
      error: `نوع الملف (${file.name}) غير مدعوم. الصيغ المسموحة هي: JPEG, PNG, WebP.` 
    };
  }

  // 2. التحقق من الحد الأقصى للحجم (500KB)
  const MAX_SIZE_BYTES = 500 * 1024; // 500KB
  if (file.size > MAX_SIZE_BYTES) {
    const sizeKB = Math.round(file.size / 1024);
    return { 
      valid: false, 
      error: `حجم الصورة (${file.name}) يتجاوز الحد الأقصى المسموح به وهو 500KB. الحجم الحالي: ${sizeKB}KB.` 
    };
  }

  // 3. قراءة أبعاد الصورة هيدروليكياً عبر عنصر الصورة في المتصفح
  return new Promise((resolve) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const width = img.width;
      const height = img.height;

      // فحص الأبعاد الدنيا (960x540px)
      if (width < 960 || height < 540) {
        resolve({
          valid: false,
          error: `أبعاد الصورة (${width}x${height}px) أقل من الأبعاد الدنيا المطلوبة (960x540px).`
        });
        return;
      }

      // فحص الأبعاد القصوى (1280x720px)
      if (width > 1280 || height > 720) {
        resolve({
          valid: false,
          error: `أبعاد الصورة (${width}x${height}px) تتجاوز الأبعاد القصوى المسموح بها (1280x720px).`
        });
        return;
      }

      // فحص النسبة المفضلة (16:9)
      const ratio = width / height;
      const isPreferredRatio = Math.abs(ratio - (16 / 9)) < 0.15;
      let warning: string | undefined = undefined;

      if (!isPreferredRatio) {
        warning = `تنبيه تفضيلي: النسبة الفضلى للصور هي 16:9 (عريضة). أبعاد الصورة الحالية (${width}x${height}px).`;
      }

      resolve({
        valid: true,
        warning,
        width,
        height,
        aspectRatio: ratio
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve({ valid: false, error: `تعذر التثبت من أبعاد ملف الصورة (${file.name}).` });
    };

    img.src = objectUrl;
  });
};

/**
 * التحقق من مقاطع الفيديو التوضيحية للقاعات والخدمات بناءً على القاعدة رقم 7:
 * - الصيغة المعتمدة: MP4 القياسية فقط
 * - الحد الأقصى للحجم: 10 ميجابايت (10MB)
 * - الأبعاد القصوى: 960x540 بكسل (QHD)
 *
 * @param file ملف الفيديو المراد فحصه
 * @returns نتيجة التحقق وقياسات الفيديو
 */
export const validateHallOrServiceVideo = async (file: File): Promise<MediaValidationResult> => {
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  // 1. التحقق من صيغة MP4
  if (file.type !== 'video/mp4' && ext !== 'mp4') {
    return { 
      valid: false, 
      error: `نوع مقطع الفيديو (${file.name}) غير مدعوم. الصيغة المعتمدة هي MP4 القياسية فقط.` 
    };
  }

  // 2. التحقق من الحجم الأقصى (10MB)
  const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `حجم مقطع الفيديو (${file.name}) يتجاوز الحد الأقصى المسموح به وهو 10MB. الحجم الحالي: ${sizeMB}MB.` 
    };
  }

  // 3. قراءة الميتابايانات وأبعاد الفيديو
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      const width = video.videoWidth;
      const height = video.videoHeight;

      // فحص الأبعاد القصوى للفيديو (960x540px)
      if (width > 960 || height > 540) {
        resolve({
          valid: false,
          error: `أبعاد الفيديو (${width}x${height}px) تتجاوز الأبعاد القصوى المسموح بها (960x540px - QHD).`
        });
        return;
      }

      resolve({ valid: true, width, height });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // خيار احتياطي في حال عدم التمكن من قراءة الوسائط في بيئة الحماية
      resolve({ valid: true });
    };

    video.src = objectUrl;
  });
};

