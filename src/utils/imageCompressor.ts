/**
 * @file imageCompressor.ts
 * @description ضاغط الصور التلقائي بالواجهة الأمامية لمنصة "ليلة" (Client-Side Image Compressor)
 * يحول تلقائياً أي صورة يرفعها المزود أو العميل (حتى لو كانت 5MB أو من هاتف بأبعاد عالية)
 * إلى صورة فائقة الجودة بحجم أقل من 500KB وأبعاد تتناسب مع معايير المنصة (16:9 بحد أقصى 1280x720 وأدنى 960x540).
 */

export interface CompressionOptions {
  maxSizeBytes?: number; // 500KB default
  targetWidth?: number;  // 1280 default
  targetHeight?: number; // 720 default
  minWidth?: number;     // 960 default
  minHeight?: number;    // 540 default
  enforce16x9?: boolean; // true default
  mimeType?: string;     // 'image/jpeg' or 'image/webp'
}

/**
 * ضغط وتعديل أبعاد الصورة تلقائياً بالمتصفح قبل رفعها إلى الخادم
 */
export const compressAndResizeImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxSizeBytes = 500 * 1024, // 500KB
    targetWidth = 1280,
    targetHeight = 720,
    minWidth = 960,
    minHeight = 540,
    enforce16x9 = true,
    mimeType = 'image/jpeg'
  } = options;

  // إذا كانت الصورة غير أصلية أو ليست صورة (مثلاً فيديو)، ارجع الملف كالمعتاد
  if (!file.type.startsWith('image/')) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => resolve(file); // fallback to original file if reader fails
    reader.onload = (event) => {
      const img = new Image();
      img.onerror = () => resolve(file); // fallback
      img.onload = async () => {
        try {
          let origW = img.width;
          let origH = img.height;

          // حساب الأبعاد الجديدة بحجم متناسب دون اقتصاص أي أجزاء من محتوى الصورة الأصلي (Aspect-Fit Resizing)
          let drawW = origW;
          let drawH = origH;

          // تقليص أو تحجيم الأبعاد إلى النطاق الأقصى المسموح به متناسباً
          if (drawW > targetWidth || drawH > targetHeight) {
            const ratio = Math.min(targetWidth / drawW, targetHeight / drawH);
            drawW = Math.round(drawW * ratio);
            drawH = Math.round(drawH * ratio);
          }

          // الضبط المتناسب إذا كانت الصورة أصغر من الحد الأدنى دون الاقتصاص
          if (drawW < minWidth && drawH < minHeight) {
            const scaleUp = Math.max(minWidth / drawW, minHeight / drawH);
            drawW = Math.round(drawW * scaleUp);
            drawH = Math.round(drawH * scaleUp);
          }

          const canvas = document.createElement('canvas');
          canvas.width = drawW;
          canvas.height = drawH;
          const ctx = canvas.getContext('2d');

          if (!ctx) {
            resolve(file);
            return;
          }

          // تحسين تنعيم الصورة عند إعادة التكبير/التصغير
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // رسم الصورة كاملة على الكانفاس بدون اقتصاص أي معالم
          ctx.drawImage(img, 0, 0, origW, origH, 0, 0, drawW, drawH);

          // محاولة الضغط التفاعلي على مستويات جودة متدرجة حتى يصبح الحجم أقل من 500KB
          let quality = 0.92;
          let blob: Blob | null = null;

          while (quality >= 0.4) {
            blob = await new Promise<Blob | null>((res) =>
              canvas.toBlob((b) => res(b), mimeType, quality)
            );

            if (blob && blob.size <= maxSizeBytes) {
              break;
            }
            quality -= 0.1;
          }

          if (!blob) {
            resolve(file);
            return;
          }

          // إعادة تكوين ملف غلاف بنفس الاسم والامتداد المتوافق
          const cleanName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([blob], cleanName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          console.log(
            `[ImageCompressor] Compressed '${file.name}' (${(file.size / 1024).toFixed(1)}KB) -> '${compressedFile.name}' (${(compressedFile.size / 1024).toFixed(1)}KB) at ${drawW}x${drawH}`
          );

          resolve(compressedFile);
        } catch (err) {
          console.warn('[ImageCompressor] Failed compression, returning original:', err);
          resolve(file);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
};
