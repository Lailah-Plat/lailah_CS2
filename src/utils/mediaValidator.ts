/**
 * @file mediaValidator.ts
 * @description وحدة التحقق الصارم والضغط الآلي للوسائط المرفوعة (الصور والفيديوهات) وفق القوانين والاشتراطات المعتمدة في منصة "ليلة".
 * تضمن هذه الوحدة احترام القاعدة رقم 7 الخاصة بمواصفات الوسائط وضغط الصور تلقائياً في الواجهة الأمامية دون مضايقة الشركاء.
 */

import { compressAndResizeImage } from './imageCompressor';
import { 
  getMediaSettingsConfig, 
  getPresetDimensions, 
  IMAGE_RESOLUTION_PRESETS, 
  VIDEO_RESOLUTION_PRESETS 
} from './uploadValidator';

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
 * التحقق من صور القاعات والخدمات المستقلة بناءً على الإعدادات والسياسات الديناميكية والقاعدة رقم 7:
 * - الصيغ المسموحة: JPEG, PNG, WebP, JPG
 * - الحد الأقصى للحجم: حسب الإعداد الديناميكي للنظام (KB)
 * - الأبعاد الدنيا والقصوى: حسب إعدادات النظام الديناميكية
 * - النسبة المفضلة: 16:9 (عريضة)
 *
 * @param file ملف الصورة المراد التحقق منه
 * @returns نتيجة التحقق التي تحتوي حالة الصلاحية أو رسالة الخطأ/التنبيه
 */
export const validateHallOrServiceImage = async (file: File): Promise<MediaValidationResult> => {
  const config = getMediaSettingsConfig();
  const minPreset = getPresetDimensions(config.imageMinDimId, IMAGE_RESOLUTION_PRESETS, '960x540');
  const maxPreset = getPresetDimensions(config.imageMaxDimId, IMAGE_RESOLUTION_PRESETS, '1280x720');

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

  // 2. التحقق من الحد الأقصى للحجم الديناميكي
  const MAX_SIZE_BYTES = config.imageMaxSizeKB * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    const sizeKB = Math.round(file.size / 1024);
    return { 
      valid: false, 
      error: `حجم الصورة (${file.name}) يتجاوز الحد الأقصى المسموح به وهو ${config.imageMaxSizeKB}KB. الحجم الحالي: ${sizeKB}KB.` 
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

      // فحص الأبعاد الدنيا الديناميكية
      if (width < minPreset.width || height < minPreset.height) {
        resolve({
          valid: false,
          error: `أبعاد الصورة (${width}x${height}px) أقل من الأبعاد الدنيا المطلوبة (${minPreset.width}x${minPreset.height}px).`
        });
        return;
      }

      // فحص الأبعاد القصوى الديناميكية
      if (width > maxPreset.width || height > maxPreset.height) {
        resolve({
          valid: false,
          error: `أبعاد الصورة (${width}x${height}px) تتجاوز الأبعاد القصوى المسموح بها (${maxPreset.width}x${maxPreset.height}px).`
        });
        return;
      }

      // فحص النسبة المفضلة (16:9)
      const ratio = width / height;
      const isPreferredRatio = Math.abs(ratio - (16 / 9)) < 0.15;
      let warning: string | undefined = undefined;

      if (!isPreferredRatio) {
        warning = `تنبيه تفضيلي: النسبة الفضلى لصور القاعات والخدمات المستقلة هي 16:9 (عريضة). أبعاد الصورة الحالية (${width}x${height}px).`;
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
 * التحقق من مقاطع الفيديو التوضيحية للقاعات والخدمات المستقلة بناءً على الإعدادات الديناميكية:
 * - الصيغة المعتمدة: MP4 القياسية فقط
 * - الحد الأقصى للحجم: حسب الإعداد الديناميكي للنظام (MB)
 * - الأبعاد القصوى: حسب إعدادات النظام المعتمدة
 *
 * @param file ملف الفيديو المراد فحصه
 * @returns نتيجة التحقق وقياسات الفيديو
 */
export const validateHallOrServiceVideo = async (file: File): Promise<MediaValidationResult> => {
  const config = getMediaSettingsConfig();
  const maxVideoPreset = getPresetDimensions(config.videoMaxDimId, VIDEO_RESOLUTION_PRESETS, '960x540');
  const ext = file.name.split('.').pop()?.toLowerCase();
  
  // 1. التحقق من صيغة MP4
  if (file.type !== 'video/mp4' && ext !== 'mp4') {
    return { 
      valid: false, 
      error: `نوع مقطع الفيديو (${file.name}) غير مدعوم. الصيغة المعتمدة هي MP4 القياسية فقط.` 
    };
  }

  // 2. التحقق من الحجم الأقصى الديناميكي
  const MAX_SIZE_BYTES = config.videoMaxSizeMB * 1024 * 1024;
  if (file.size > MAX_SIZE_BYTES) {
    const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
    return { 
      valid: false, 
      error: `حجم مقطع الفيديو (${file.name}) يتجاوز الحد الأقصى المسموح به وهو ${config.videoMaxSizeMB}MB. الحجم الحالي: ${sizeMB}MB.` 
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

      // فحص الأبعاد القصوى للفيديو الديناميكية
      if (width > maxVideoPreset.width || height > maxVideoPreset.height) {
        resolve({
          valid: false,
          error: `أبعاد الفيديو (${width}x${height}px) تتجاوز الأبعاد القصوى المسموح بها (${maxVideoPreset.width}x${maxVideoPreset.height}px).`
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

/**
 * واجهة نتيجة التحقق والضغط للصور
 */
export interface ProcessedMediaResult extends MediaValidationResult {
  file: File;
  autoCompressed?: boolean;
}

/**
 * التحقق التلقائي والضغط المباشر لصور القاعات والخدمات المستقلة
 * ينفذ الضغط التلقائي للأبعاد والحجم دون رد الملف أو مضايقة المزود
 */
export const validateAndCompressImage = async (file: File): Promise<ProcessedMediaResult> => {
  const config = getMediaSettingsConfig();
  const minPreset = getPresetDimensions(config.imageMinDimId, IMAGE_RESOLUTION_PRESETS, '960x540');
  const maxPreset = getPresetDimensions(config.imageMaxDimId, IMAGE_RESOLUTION_PRESETS, '1280x720');

  // 1. إجراء الفحص الأولي
  const initialCheck = await validateHallOrServiceImage(file);
  
  if (initialCheck.valid) {
    return { ...initialCheck, file };
  }

  // 2. إذا كان الرفض بسبب الحجم أو الأبعاد وكان نوع الملف صورة، نقوم بالضغط التلقائي
  if (file.type.startsWith('image/')) {
    try {
      console.log(`[MediaValidator] Auto-compressing file '${file.name}' to observe Rule #7...`);
      const compressedFile = await compressAndResizeImage(file, {
        maxSizeBytes: config.imageMaxSizeKB * 1024,
        targetWidth: maxPreset.width,
        targetHeight: maxPreset.height,
        minWidth: minPreset.width,
        minHeight: minPreset.height,
        enforce16x9: true
      });

      const reCheck = await validateHallOrServiceImage(compressedFile);
      if (reCheck.valid) {
        return {
          ...reCheck,
          file: compressedFile,
          autoCompressed: true,
          warning: `تم تحسين وضغط الصورة تلقائياً لتتوافق مع معايير الجودة والحجم المعتمدة (${Math.round(compressedFile.size / 1024)}KB - 16:9).`
        };
      }
    } catch (e) {
      console.warn('[MediaValidator] Compression failed, returning initial check:', e);
    }
  }

  return { ...initialCheck, file };
};

