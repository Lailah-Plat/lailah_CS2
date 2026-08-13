/**
 * @file uploadValidator.ts
 * @description وحدة التحقق الموحد لرفع الصور ومقاطع الفيديو لمنصة "ليلة".
 * تتأكد هذه الوحدة من مطابقة أحجام وأبعاد وصيغ الملفات المرفوعة لاشتراطات المنصة الديناميكية.
 */

export interface MediaPreset {
  id: string;
  label: string;
  width: number;
  height: number;
}

/**
 * قائمة دقة وأبعاد الصور المعيارية
 */
export const IMAGE_RESOLUTION_PRESETS: MediaPreset[] = [
  { id: '426x240', label: 'منخفضة الدقة جدا (SD) - 426 × 240 بكسل', width: 426, height: 240 },
  { id: '960x540', label: 'منخفضة الدقة (SD2) - 960 × 540 بكسل', width: 960, height: 540 },
  { id: '1280x720', label: 'عالية الوضوح (HD) - 1280 × 720 بكسل', width: 1280, height: 720 },
  { id: '1366x768', label: 'عالية الوضوح2 (HD2) - 1366 × 768 بكسل', width: 1366, height: 768 },
  { id: '1600x900', label: 'عالية الوضوح3 (HD3) - 1600 × 900 بكسل', width: 1600, height: 900 },
  { id: '1920x1080', label: 'عالية الوضوح الكامل (Full HD) - 1920 × 1080 بكسل', width: 1920, height: 1080 },
  { id: '2560x1440', label: 'فائق الوضوح (2K / QHD) - 2560 × 1440 بكسل', width: 2560, height: 1440 },
  { id: '3840x2160', label: 'فائق الوضوح أكثر (4K UHD) - 3840 × 2160 بكسل', width: 3840, height: 2160 },
  { id: '4096x2304', label: 'فائق الوضوح أكثر2 (4K UHD2) - 4096 × 2304 بكسل', width: 4096, height: 2304 },
  { id: '7680x4320', label: 'عالي الوضوح جداً (8K UHD) - 7680 × 4320 بكسل', width: 7680, height: 4320 },
];

/**
 * قائمة دقة وأبعاد الفيديوهات المعيارية
 */
export const VIDEO_RESOLUTION_PRESETS: MediaPreset[] = [
  { id: '426x240', label: 'منخفضة الدقة (SD) - 426 × 240 بكسل', width: 426, height: 240 },
  { id: '960x540', label: 'منخفضة الدقة (SD2) - 960 × 540 بكسل', width: 960, height: 540 },
  { id: '1280x720', label: 'عالية الوضوح (HD) - 1280 × 720 بكسل', width: 1280, height: 720 },
  { id: '1920x1080', label: 'عالية الوضوح الكامل (Full HD) - 1920 × 1080 بكسل', width: 1920, height: 1080 },
  { id: '2560x1440', label: 'فائق الوضوح (2K / QHD) - 2560 × 1440 بكسل', width: 2560, height: 1440 },
  { id: '3840x2160', label: 'فائق الوضوح (4K UHD) - 3840 × 2160 بكسل', width: 3840, height: 2160 },
  { id: '7680x4320', label: 'عالي الوضوح جداً (8K UHD) - 7680 × 4320 بكسل', width: 7680, height: 4320 },
];

export interface MediaSettingsConfig {
  imageMaxSizeKB: number;
  videoMaxSizeMB: number;
  imageMinDimId: string;
  imageMaxDimId: string;
  videoMaxDimId: string;
  // 1. الضغط والتحويل التلقائي وتوليد المصغرات
  enableAutoCompression: boolean;
  outputFormat: 'webp' | 'jpeg' | 'auto';
  enableThumbnails: boolean;
  thumbnailWidth: number;
  thumbnailHeight: number;
  // 2. حصص مساحة التخزين بحسب الباقات (بالميجابايت)
  basicTierQuotaMB: number;
  advancedTierQuotaMB: number;
  proTierQuotaMB: number;
  planStorageQuotas: Record<string, number>;
  // 3. الفحص الذكي للوسائط بالذكاء الاصطناعي
  enableAiQualityCheck: boolean;
  enableAiWatermarkCheck: boolean;
  enableAiContactDetection: boolean;
  aiStrictnessLevel: 'moderate' | 'high' | 'strict';
}

/**
 * قراءة إعدادات وسياسات الوسائط الحالية المخصصة من النظام أو التخزين المحلي
 */
export function getMediaSettingsConfig(): MediaSettingsConfig {
  const imageMaxSizeKB = Number(localStorage.getItem('media_image_max_size_kb') || '500');
  const videoMaxSizeMB = Number(localStorage.getItem('media_video_max_size_mb') || '10');
  const imageMinDimId = localStorage.getItem('media_image_min_dim_id') || '960x540';
  const imageMaxDimId = localStorage.getItem('media_image_max_dim_id') || '1280x720';
  const videoMaxDimId = localStorage.getItem('media_video_max_dim_id') || '960x540';

  const enableAutoCompression = localStorage.getItem('media_enable_auto_compression') !== 'false';
  const outputFormat = (localStorage.getItem('media_output_format') || 'webp') as 'webp' | 'jpeg' | 'auto';
  const enableThumbnails = localStorage.getItem('media_enable_thumbnails') !== 'false';
  const thumbnailWidth = Number(localStorage.getItem('media_thumbnail_width') || '400');
  const thumbnailHeight = Number(localStorage.getItem('media_thumbnail_height') || '225');

  const basicTierQuotaMB = Number(localStorage.getItem('media_quota_basic_mb') || '20');
  const advancedTierQuotaMB = Number(localStorage.getItem('media_quota_advanced_mb') || '60');
  const proTierQuotaMB = Number(localStorage.getItem('media_quota_pro_mb') || '150');

  let planStorageQuotas: Record<string, number> = {};
  try {
    const rawQuotas = localStorage.getItem('media_plan_storage_quotas');
    if (rawQuotas) {
      planStorageQuotas = JSON.parse(rawQuotas);
    }
  } catch (e) {
    planStorageQuotas = {};
  }

  const enableAiQualityCheck = localStorage.getItem('media_ai_quality_check') !== 'false';
  const enableAiWatermarkCheck = localStorage.getItem('media_ai_watermark_check') !== 'false';
  const enableAiContactDetection = localStorage.getItem('media_ai_contact_detection') !== 'false';
  const aiStrictnessLevel = (localStorage.getItem('media_ai_strictness') || 'high') as 'moderate' | 'high' | 'strict';

  return {
    imageMaxSizeKB: isNaN(imageMaxSizeKB) || imageMaxSizeKB <= 0 ? 500 : imageMaxSizeKB,
    videoMaxSizeMB: isNaN(videoMaxSizeMB) || videoMaxSizeMB <= 0 ? 10 : videoMaxSizeMB,
    imageMinDimId,
    imageMaxDimId,
    videoMaxDimId,
    enableAutoCompression,
    outputFormat,
    enableThumbnails,
    thumbnailWidth,
    thumbnailHeight,
    basicTierQuotaMB: isNaN(basicTierQuotaMB) ? 20 : basicTierQuotaMB,
    advancedTierQuotaMB: isNaN(advancedTierQuotaMB) ? 60 : advancedTierQuotaMB,
    proTierQuotaMB: isNaN(proTierQuotaMB) ? 150 : proTierQuotaMB,
    planStorageQuotas,
    enableAiQualityCheck,
    enableAiWatermarkCheck,
    enableAiContactDetection,
    aiStrictnessLevel
  };
}

export function getPresetDimensions(presetId: string, presets: MediaPreset[], defaultPresetId: string): MediaPreset {
  const found = presets.find(p => p.id === presetId);
  if (found) return found;
  return presets.find(p => p.id === defaultPresetId) || presets[0];
}

/**
 * واجهة نتيجة فحص الذكاء الاصطناعي للوسائط
 */
export interface AiInspectionResult {
  score: number; // 0 - 100
  qualityStatus: 'excellent' | 'good' | 'acceptable' | 'needs_improvement';
  isBlurry: boolean;
  blurPercentage: number;
  isLowLight: boolean;
  lightingScore: number; // 0 - 100
  hasExternalContactInfo: boolean;
  detectedContactDetails?: string[];
  hasWatermark: boolean;
  watermarkDetails?: string;
  recommendation: string;
  passedSafety: boolean;
}

/**
 * محاكة فحص الذكاء الاصطناعي للوسائط والجودة والأمان
 */
export const simulateAiMediaInspection = (fileOrUrl: File | string, isService: boolean = false): Promise<AiInspectionResult> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const config = getMediaSettingsConfig();
      // محاكاة نتيجة ذكية تفاعلية موثوقة
      const name = typeof fileOrUrl === 'string' ? fileOrUrl : fileOrUrl.name;
      const lowerName = name.toLowerCase();

      let isBlurry = false;
      let blurPercentage = 8;
      let isLowLight = false;
      let lightingScore = 92;
      let hasExternalContactInfo = false;
      let detectedContactDetails: string[] = [];
      let hasWatermark = false;
      let watermarkDetails = '';

      if (lowerName.includes('blur') || lowerName.includes('dark')) {
        isBlurry = true;
        blurPercentage = 38;
        isLowLight = true;
        lightingScore = 45;
      }

      if (lowerName.includes('contact') || lowerName.includes('phone') || lowerName.includes('logo')) {
        hasExternalContactInfo = true;
        detectedContactDetails = ['رقم جوال خارج المنصة (05xxxxxxx)', 'رابط واتساب خارجي'];
      }

      if (lowerName.includes('watermark') || lowerName.includes('stock')) {
        hasWatermark = true;
        watermarkDetails = 'علامة مائية غير مرخصة لموقع تجاري خارجي';
      }

      let score = 95;
      if (isBlurry) score -= 25;
      if (isLowLight) score -= 15;
      if (hasExternalContactInfo && config.enableAiContactDetection) score -= 35;
      if (hasWatermark && config.enableAiWatermarkCheck) score -= 20;

      let qualityStatus: 'excellent' | 'good' | 'acceptable' | 'needs_improvement' = 'excellent';
      if (score >= 90) qualityStatus = 'excellent';
      else if (score >= 75) qualityStatus = 'good';
      else if (score >= 60) qualityStatus = 'acceptable';
      else qualityStatus = 'needs_improvement';

      const itemTypeLabel = isService ? 'خدمة مستقلة' : 'قاعة/منشأة';

      let recommendation = `الصورة ممتازة لـ ${itemTypeLabel} وتلبي كافة المعايير القياسية لمنصة ليلة.`;
      if (hasExternalContactInfo) {
        recommendation = `رصد الذكاء الاصطناعي وجود وسائل تواصل خارجية أو أرقام على صورة الـ ${itemTypeLabel}. يرجى إزالتها لضمان الموثوقية وعدم مخالفة الشروط.`;
      } else if (hasWatermark) {
        recommendation = `توجد علامة مائية غير مرخصة على الصورة. يوصى برفع صورة خالية من العلامات المائية.`;
      } else if (isBlurry || isLowLight) {
        recommendation = `توجد نسبة ضبابية أو إضاءة منخفضة. يُفضل رفع صورة ذات إضاءة أعلى للحصول على تقييم أداء أفضل.`;
      }

      const passedSafety = !(hasExternalContactInfo && config.enableAiContactDetection);

      resolve({
        score: Math.max(10, score),
        qualityStatus,
        isBlurry,
        blurPercentage,
        isLowLight,
        lightingScore,
        hasExternalContactInfo,
        detectedContactDetails,
        hasWatermark,
        watermarkDetails,
        recommendation,
        passedSafety
      });
    }, 400);
  });
};

/**
 * توليد نسخة مصغرة خفيفة (Thumbnail) للواجهة الرئيسية متناسبة بنسبة 16:9
 */
export const generateImageThumbnail = (file: File): Promise<{ blob: Blob; url: string; width: number; height: number; sizeKB: number }> => {
  return new Promise((resolve, reject) => {
    const config = getMediaSettingsConfig();
    const targetW = config.thumbnailWidth || 400;
    const targetH = config.thumbnailHeight || 225;

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject('فشل إنشاء سياق الرسم للنسخة المصغرة');
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'medium';

      // رسم الصورة كاملة بدون اقتصاص أجزاء مع تحجيم متناسب
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, targetW, targetH);

      const mimeType = config.outputFormat === 'jpeg' ? 'image/jpeg' : 'image/webp';
      canvas.toBlob((blob) => {
        if (!blob) {
          reject('فشل معالجة الصورة المصغرة');
          return;
        }
        const thumbUrl = URL.createObjectURL(blob);
        const sizeKB = Math.round((blob.size / 1024) * 10) / 10;
        resolve({
          blob,
          url: thumbUrl,
          width: targetW,
          height: targetH,
          sizeKB
        });
      }, mimeType, 0.80);
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject('فشل تحميل الصورة للتصغير');
    };
  });
};

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
 * التحقق الصارم من ملفات الصور (الحجم، الصيغة، والأبعاد بناء على الإعدادات الديناميكية):
 * - الصيغ: JPEG, PNG, WebP
 * - الحجم الأقصى: حسب الإعداد المخصص (كيلوبايت)
 * - الأبعاد الدنيا والقصوى: حسب الإعدادات المخصصة
 * 
 * @param file ملف الصورة
 * @returns Promise يحتوي على نتيجة التحقق
 */
export const validateImageFile = (file: File): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    const config = getMediaSettingsConfig();
    const minPreset = getPresetDimensions(config.imageMinDimId, IMAGE_RESOLUTION_PRESETS, '960x540');
    const maxPreset = getPresetDimensions(config.imageMaxDimId, IMAGE_RESOLUTION_PRESETS, '1280x720');

    // 1. فحص صيغة الملف المرفوع
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      resolve({
        valid: false,
        error: 'صيغة الملف غير مدعومة! يسمح فقط بصيغ JPEG، PNG، WebP للصور.'
      });
      return;
    }

    // 2. فحص حجم الملف بناءً على الحد المحدد بـ KB
    const maxSizeInBytes = config.imageMaxSizeKB * 1024;
    if (file.size > maxSizeInBytes) {
      const currentKB = (file.size / 1024).toFixed(1);
      resolve({
        valid: false,
        error: `حجم الصورة يتجاوز الحد المسموح به (${config.imageMaxSizeKB} كيلوبايت). حجم الملف الحالي هو ${currentKB} كيلوبايت.`
      });
      return;
    }

    // 3. قراءة أبعاد الصورة عبر FileReader
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const width = img.width;
        const height = img.height;

        // التحقق الصارم من الأبعاد الدنيا
        if (width < minPreset.width || height < minPreset.height) {
          const labelClean = minPreset.label.split('-')[0].trim();
          resolve({
            valid: false,
            error: `أبعاد الصورة أقل من الحد الأدنى المعتمد في المنصة (${minPreset.width}px ✕ ${minPreset.height}px - ${labelClean}). أبعاد صورتك الحالية هي (${width}px ✕ ${height}px).`
          });
          return;
        }

        // التحقق الصارم من الأبعاد القصوى
        if (width > maxPreset.width || height > maxPreset.height) {
          const labelClean = maxPreset.label.split('-')[0].trim();
          resolve({
            valid: false,
            error: `أبعاد الصورة تتجاوز الحد الأقصى المعتمد في المنصة (${maxPreset.width}px ✕ ${maxPreset.height}px - ${labelClean}). أبعاد صورتك الحالية هي (${width}px ✕ ${height}px).`
          });
          return;
        }

        // التحقق التقريبي من نسبة 16:9 للتوجيه التفضيلي
        const ratio = width / height;
        const targetRatio = 16 / 9;
        const tolerance = 0.15;
        if (Math.abs(ratio - targetRatio) > tolerance) {
          resolve({
            valid: true, // قبول مع إظهار تنبيه تفضيلي
            width,
            height,
            error: `تنبيه: يفضل استخدام قياسات بنسبة عرض إلى ارتفاع (16:9) للحصول على أفضل دقة ظهور بدون اقتطاع.`
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
 * التحقق الصارم من ملفات الفيديو (الحجم، الصيغة، والأبعاد بناء على الإعدادات الديناميكية):
 * - الصيغة: MP4 فقط
 * - الحجم الأقصى: حسب إعدادات النظام بالميجابايت
 * - الأبعاد القصوى: حسب أبعاد الفيديو المعتمدة في النظام
 * 
 * @param file ملف الفيديو
 * @param maxVideoSizeMBOverride الحد الأقصى الاختياري بالميجابايت
 * @returns Promise يحتوي على نتيجة التحقق
 */
export const validateVideoFile = (file: File, maxVideoSizeMBOverride?: number): Promise<ValidationResult> => {
  return new Promise((resolve) => {
    const config = getMediaSettingsConfig();
    const effectiveMaxMB = maxVideoSizeMBOverride && maxVideoSizeMBOverride > 0 ? maxVideoSizeMBOverride : config.videoMaxSizeMB;
    const maxVideoPreset = getPresetDimensions(config.videoMaxDimId, VIDEO_RESOLUTION_PRESETS, '960x540');

    // 1. فحص نوع وامتداد الفيديو (MP4 حصراً)
    if (file.type !== 'video/mp4' && !file.name.toLowerCase().endsWith('.mp4')) {
      resolve({
        valid: false,
        error: 'صيغة الفيديو غير مدعومة! يسمح فقط بصيغة MP4 كخيار قياسي مستقر.'
      });
      return;
    }

    // 2. فحص حجم الفيديو
    const maxSizeInBytes = effectiveMaxMB * 1024 * 1024;
    if (file.size > maxSizeInBytes) {
      const currentMB = (file.size / (1024 * 1024)).toFixed(1);
      resolve({
        valid: false,
        error: `حجم الفيديو يتجاوز الحد المسموح به في النظام (${effectiveMaxMB} ميجابايت). حجم الملف الحالي هو ${currentMB} ميجابايت.`
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

      // فحص الأبعاد القصوى للفيديو بناءً على الإعداد المعتمد
      if (width > maxVideoPreset.width || height > maxVideoPreset.height) {
        const labelClean = maxVideoPreset.label.split('-')[0].trim();
        resolve({
          valid: false,
          error: `أبعاد الفيديو أعلى من القياسات المسموح بها في النظام (أقصى قياس مسموح به هو عرض ${maxVideoPreset.width}px ✕ طول ${maxVideoPreset.height}px - ${labelClean}). أبعاد مقطعك الحالية هي (${width}px ✕ ${height}px).`
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

export interface StorageAnalyticsBreakdown {
  totalUsedMB: number;
  totalQuotaMB: number;
  usedPercentage: number;
  hallPhotosCount: number;
  hallPhotosSizeMB: number;
  servicePhotosCount: number;
  servicePhotosSizeMB: number;
  videoClipsCount: number;
  videoClipsSizeMB: number;
  thumbnailsCount: number;
  thumbnailsSizeMB: number;
  remainingMB: number;
  tierName: string;
}

export function getQuotaForPlan(planNameOrId?: string | number, fallbackMB: number = 60): number {
  if (!planNameOrId) return fallbackMB;
  const config = getMediaSettingsConfig();
  const key = String(planNameOrId).trim();

  if (config.planStorageQuotas && config.planStorageQuotas[key] !== undefined) {
    return config.planStorageQuotas[key];
  }

  if (config.planStorageQuotas) {
    for (const [k, v] of Object.entries(config.planStorageQuotas)) {
      if (k.toLowerCase() === key.toLowerCase() || k.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(k.toLowerCase())) {
        return v;
      }
    }
  }

  if (key.includes('أساسية') || key.includes('basic') || key === '1') {
    return config.basicTierQuotaMB;
  }
  if (key.includes('متقدمة') || key.includes('advanced') || key.includes('business') || key === '2') {
    return config.advancedTierQuotaMB;
  }
  if (key.includes('احترافية') || key.includes('pro') || key.includes('VIP') || key === '3') {
    return config.proTierQuotaMB;
  }

  return fallbackMB;
}

/**
 * حساب إحصائيات استهلاك مساحة التخزين السحابية للمزود أو النظام ككل
 */
export function calculateStorageAnalytics(params?: {
  hallCount?: number;
  photosPerHall?: number;
  serviceCount?: number;
  photosPerService?: number;
  videoCount?: number;
  tier?: 'basic' | 'advanced' | 'pro';
}): StorageAnalyticsBreakdown {
  const config = getMediaSettingsConfig();
  
  const hallCount = params?.hallCount ?? 3;
  const photosPerHall = params?.photosPerHall ?? 12; // 12 صورة لكل قاعة
  const serviceCount = params?.serviceCount ?? 4;
  const photosPerService = params?.photosPerService ?? 8; // 8 صور لكل خدمة مستقلة
  const videoCount = params?.videoCount ?? 2; // مقطعين فيديو
  const tier = params?.tier ?? 'advanced';

  const totalHallPhotos = hallCount * photosPerHall;
  const totalServicePhotos = serviceCount * photosPerService;
  const totalThumbnails = totalHallPhotos + totalServicePhotos;

  // الأحجام التقديرية الواقعية بالـ MB بناءً على الضغط المحسّن
  const hallPhotosSizeMB = Math.round((totalHallPhotos * 0.28) * 100) / 100; // 280KB للصورة
  const servicePhotosSizeMB = Math.round((totalServicePhotos * 0.22) * 100) / 100; // 220KB للخدمة
  const videoClipsSizeMB = Math.round((videoCount * 4.8) * 100) / 100; // 4.8MB للفيديو
  const thumbnailsSizeMB = Math.round((totalThumbnails * 0.025) * 100) / 100; // 25KB للمصغرة

  const totalUsedMB = Math.round((hallPhotosSizeMB + servicePhotosSizeMB + videoClipsSizeMB + thumbnailsSizeMB) * 100) / 100;

  let totalQuotaMB = config.advancedTierQuotaMB;
  let tierName = 'الباقة المتقدمة';

  if (tier === 'basic') {
    totalQuotaMB = config.basicTierQuotaMB;
    tierName = 'الباقة الأساسية';
  } else if (tier === 'pro') {
    totalQuotaMB = config.proTierQuotaMB;
    tierName = 'الباقة الاحترافية VIP';
  }

  const usedPercentage = Math.min(100, Math.round((totalUsedMB / totalQuotaMB) * 100));
  const remainingMB = Math.max(0, Math.round((totalQuotaMB - totalUsedMB) * 100) / 100);

  return {
    totalUsedMB,
    totalQuotaMB,
    usedPercentage,
    hallPhotosCount: totalHallPhotos,
    hallPhotosSizeMB,
    servicePhotosCount: totalServicePhotos,
    servicePhotosSizeMB,
    videoClipsCount: videoCount,
    videoClipsSizeMB,
    thumbnailsCount: totalThumbnails,
    thumbnailsSizeMB,
    remainingMB,
    tierName
  };
}


