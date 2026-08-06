/**
 * @file uploadValidator.ts
 * @description وحدة التحقق الموحد لرفع الصور ومقاطع الفيديو لمنصة "ليلة".
 * تتأكد هذه الوحدة من مطابقة أحجام وأبعاد وصيغ الملفات المرفوعة لاشتراطات المنصة.
 */

/**
 * واجهة نتيجة عملية التحقق من الملف
 */
export interface ValidationResult {
  /** هل الملف مقبول وصالح */
  valid: boolean;
  /** نص رسالة الخطأ أو التنبيه */
  error?: string;
  /** عرض الصورة/الفيديو بالبكسل */
  width?: number;
  /** ارتفاع الصورة/الفيديو بالبكسل */
  height?: number;
}

/**
 * التحقق من ملفات الصور (الحجم، الصيغة، والأبعاد):
 * - الصيغ: JPEG, PNG, WebP
 * - الحجم الأقصى: 500 كيلوبايت
 * - الأبعاد الدنيا: 960px × 540px
 * - النسبة المفضلة: 16:9
 * 
 * @param file ملف الصورة
 * @returns Promise يحتوي على نتيجة التحقق
 */
export const validateImageFile = (file: File): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    // 1. فحص صيغة الملف المرفوع
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      resolve({
        valid: false,
        error: 'صيغة الملف غير مدعومة! يسمح فقط بصيغ JPEG، PNG، WebP للصور.'
      });
      return;
    }

    // 2. فحص حجم الملف (الحد الأقصى 500 كيلوبايت)
    const maxSizeInBytes = 500 * 1024;
    if (file.size > maxSizeInBytes) {
      resolve({
        valid: false,
        error: `حجم الصورة يتجاوز الحد المسموح به (500 كيلوبايت). حجم الملف الحالي هو ${(file.size / 1024).toFixed(1)} كيلوبايت.`
      });
      return;
    }

    // 3. قراءة أبعاد الصورة هيدروليكياً عبر FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // التحقق من الأبعاد الدنيا (960x540px)
        if (width < 960 || height < 540) {
          resolve({
            valid: false,
            error: `أبعاد الصورة أقل من الحد الأدنى المسموح به (960px ✕ 540px). أبعاد صورتك الحالية هي (${width}px ✕ ${height}px).`
          });
          return;
        }

        // التحقق التقريبي من نسبة 16:9
        const ratio = width / height;
        const targetRatio = 16 / 9;
        const tolerance = 0.1;
        if (Math.abs(ratio - targetRatio) > tolerance) {
          resolve({
            valid: true, // قبول مع إظهار تنبيه تفضيلي
            width,
            height,
            error: `تنبيه: يفضل استخدام قياسات بنسبة عرض إلى ارتفاع (16:9) للحصول على أفضل دقة ظهور.`
          });
          return;
        }

        resolve({ valid: true, width, height });
      };
      img.onerror = () => {
        resolve({
          valid: false,
          error: 'فشل قراءة أبعاد الصورة المحددة. قد يكون الملف تالفاً.'
        });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};

/**
 * التحقق من ملفات الفيديو (الحجم، الصيغة، والأبعاد):
 * - الصيغة: MP4 فقط
 * - الحجم الأقصى: حسب إعدادات النظام (افتراضياً 10MB)
 * - الأبعاد القصوى: 1280px × 720px
 * 
 * @param file ملف الفيديو
 * @param maxVideoSizeMB الحد الأقصى المسموح به بالميجابايت
 * @returns Promise يحتوي على نتيجة التحقق
 */
export const validateVideoFile = (file: File, maxVideoSizeMB: number = 10): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    // 1. فحص نوع وامتداد الفيديو (MP4 حصراً)
    if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) {
      resolve({
        valid: false,
        error: 'صيغة الفيديو غير مدعومة! يسمح فقط بصيغة MP4 كخيار قياسي مستقر.'
      });
      return;
    }

    // 2. فحص حجم الفيديو
    const maxSizeInBytes = maxVideoSizeMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      resolve({
        valid: false,
        error: `حجم الفيديو يتجاوز الحد المسموح به في النظام (${maxVideoSizeMB} ميجابايت). حجم الملف الحالي هو ${(file.size / (1024 * 1024)).toFixed(1)} ميجابايت.`
      });
      return;
    }

    // 3. قراءة بيانات الفيديو وميتاباياناته
    const url = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;
    
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      const width = video.videoWidth;
      const height = video.videoHeight;

      // فحص الأبعاد القصوى للفيديو
      if (width > 1280 || height > 720) {
        resolve({
          valid: false,
          error: `أبعاد الفيديو أعلى من القياسات المسموح بها (أقصى قياس مسموح به هو عرض 1280px ✕ طول 720px نسبة 16:9). أبعاد صورتك الحالية هي (${width}px ✕ ${height}px).`
        });
        return;
      }

      resolve({ valid: true, width, height });
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        valid: false,
        error: 'فشل قراءة بيانات الفيديو المحددة. قد يكون الملف غير متوافق أو تالفاً.'
      });
    };
  });
};

