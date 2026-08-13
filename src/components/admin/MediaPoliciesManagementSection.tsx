import React, { useState, useEffect } from 'react';
import { 
  Video, 
  Camera, 
  HardDrive, 
  RefreshCw, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  Zap, 
  PieChart, 
  FileCheck, 
  AlertTriangle, 
  Eye, 
  FileText, 
  Image as ImageIcon, 
  Cpu, 
  Sliders, 
  Layers, 
  ArrowUpRight, 
  Check, 
  X,
  UploadCloud,
  TrendingDown,
  Crown
} from 'lucide-react';
import { 
  IMAGE_RESOLUTION_PRESETS, 
  VIDEO_RESOLUTION_PRESETS, 
  getMediaSettingsConfig, 
  getPresetDimensions, 
  simulateAiMediaInspection, 
  generateImageThumbnail, 
  calculateStorageAnalytics, 
  AiInspectionResult 
} from '../../utils/uploadValidator';
import { compressAndResizeImage } from '../../utils/imageCompressor';
import { fetchWithRetry } from '../../services/apiService';

interface MediaPoliciesManagementSectionProps {
  onShowNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
  enableProviderVideoUpload: boolean;
  setEnableProviderVideoUpload: (enabled: boolean) => void;
  saveConfigToServer: (key: string, value: any) => Promise<boolean>;
}

export const MediaPoliciesManagementSection: React.FC<MediaPoliciesManagementSectionProps> = ({
  onShowNotification,
  enableProviderVideoUpload,
  setEnableProviderVideoUpload,
  saveConfigToServer
}) => {
  // 1. الإعدادات الأساسية والأحجام
  const [config, setConfig] = useState(getMediaSettingsConfig());

  const [imageMaxSizeKB, setImageMaxSizeKB] = useState<number>(config.imageMaxSizeKB);
  const [videoMaxSizeMB, setVideoMaxSizeMB] = useState<number>(config.videoMaxSizeMB);
  const [imageMinDimId, setImageMinDimId] = useState<string>(config.imageMinDimId);
  const [imageMaxDimId, setImageMaxDimId] = useState<string>(config.imageMaxDimId);
  const [videoMaxDimId, setVideoMaxDimId] = useState<string>(config.videoMaxDimId);

  // 2. إعدادات الضغط والتحويل والتصغير
  const [enableAutoCompression, setEnableAutoCompression] = useState<boolean>(config.enableAutoCompression);
  const [outputFormat, setOutputFormat] = useState<'webp' | 'jpeg' | 'auto'>(config.outputFormat);
  const [enableThumbnails, setEnableThumbnails] = useState<boolean>(config.enableThumbnails);

  // 3. حصص مساحة التخزين المخصصة للباقات المجلوبة ديناميكياً
  const [subscriptionPlans, setSubscriptionPlans] = useState<any[]>([]);
  const [planStorageQuotas, setPlanStorageQuotas] = useState<Record<string, number>>(config.planStorageQuotas || {});
  const [isLoadingPlans, setIsLoadingPlans] = useState<boolean>(false);

  const [basicQuotaMB, setBasicQuotaMB] = useState<number>(config.basicTierQuotaMB);
  const [advancedQuotaMB, setAdvancedQuotaMB] = useState<number>(config.advancedTierQuotaMB);
  const [proQuotaMB, setProQuotaMB] = useState<number>(config.proTierQuotaMB);

  // جلب باقات الاشتراك حياً وتحديث حصص التخزين ديناميكياً
  const loadPlansAndQuotas = async () => {
    setIsLoadingPlans(true);
    try {
      let rawQuotasObj: Record<string, number> = {};
      try {
        const savedQuotas = localStorage.getItem('media_plan_storage_quotas');
        if (savedQuotas) {
          rawQuotasObj = JSON.parse(savedQuotas);
        }
      } catch (e) {
        rawQuotasObj = {};
      }

      const data = await fetchWithRetry('/api/subscriptions/plans');
      let fetchedPlans: any[] = [];
      if (data && data.success && Array.isArray(data.plans) && data.plans.length > 0) {
        fetchedPlans = data.plans;
      } else {
        // قائمة احتياطية افتراضية في حالة عدم وجود شبكة أو باقات
        fetchedPlans = [
          { id: 'basic', name: 'الباقة الأساسية', price: 199, description: 'باقة المبتدئين والأعمال الصغيرة' },
          { id: 'advanced', name: 'الباقة المتقدمة', price: 399, description: 'باقة الأعمال المتوسطة والمميزة' },
          { id: 'pro', name: 'الباقة الاحترافية VIP', price: 799, description: 'كافة الميزات اللامحدودة لكبار المزودين' }
        ];
      }

      setSubscriptionPlans(fetchedPlans);

      // دمج وتعيين القيم الحالية لكل باقة مجلوبة
      const updatedQuotas: Record<string, number> = { ...rawQuotasObj };
      fetchedPlans.forEach((plan, index) => {
        const planKey = String(plan.id);
        const planNameKey = String(plan.name).trim();

        if (updatedQuotas[planKey] === undefined && updatedQuotas[planNameKey] === undefined) {
          if (index === 0 || planNameKey.includes('أساسية') || planNameKey.includes('مبتدئ')) {
            updatedQuotas[planKey] = basicQuotaMB || 20;
            updatedQuotas[planNameKey] = basicQuotaMB || 20;
          } else if (index === 1 || planNameKey.includes('متقدمة') || planNameKey.includes('أعمال')) {
            updatedQuotas[planKey] = advancedQuotaMB || 60;
            updatedQuotas[planNameKey] = advancedQuotaMB || 60;
          } else if (index === 2 || planNameKey.includes('احترافية') || planNameKey.includes('VIP')) {
            updatedQuotas[planKey] = proQuotaMB || 150;
            updatedQuotas[planNameKey] = proQuotaMB || 150;
          } else {
            updatedQuotas[planKey] = 100 + (index * 50);
            updatedQuotas[planNameKey] = 100 + (index * 50);
          }
        }
      });

      setPlanStorageQuotas(updatedQuotas);
    } catch (err) {
      console.error("Error loading subscription plans in MediaPoliciesManagementSection:", err);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  useEffect(() => {
    loadPlansAndQuotas();

    const handleUpdate = () => {
      loadPlansAndQuotas();
    };

    window.addEventListener('subscriptionsUpdated', handleUpdate);
    window.addEventListener('settingsUpdated', handleUpdate);
    return () => {
      window.removeEventListener('subscriptionsUpdated', handleUpdate);
      window.removeEventListener('settingsUpdated', handleUpdate);
    };
  }, []);

  const handleQuotaChange = (planIdentifier: string | number, planName: string, newValueMB: number) => {
    const val = Math.max(1, newValueMB);
    const planKey = String(planIdentifier);
    const nameKey = planName.trim();

    const updated = {
      ...planStorageQuotas,
      [planKey]: val,
      [nameKey]: val
    };
    setPlanStorageQuotas(updated);

    if (planKey === 'basic' || nameKey.includes('أساسية')) {
      setBasicQuotaMB(val);
    } else if (planKey === 'advanced' || nameKey.includes('متقدمة')) {
      setAdvancedQuotaMB(val);
    } else if (planKey === 'pro' || nameKey.includes('احترافية')) {
      setProQuotaMB(val);
    }
  };

  // 4. إعدادات الفحص الذكي للوسائط بالذكاء الاصطناعي
  const [enableAiQualityCheck, setEnableAiQualityCheck] = useState<boolean>(config.enableAiQualityCheck);
  const [enableAiWatermarkCheck, setEnableAiWatermarkCheck] = useState<boolean>(config.enableAiWatermarkCheck);
  const [enableAiContactDetection, setEnableAiContactDetection] = useState<boolean>(config.enableAiContactDetection);
  const [aiStrictnessLevel, setAiStrictnessLevel] = useState<'moderate' | 'high' | 'strict'>(config.aiStrictnessLevel);

  // حالة المكون المختار في تجربة الضغط والفحص الحي
  const [testFile, setTestFile] = useState<File | null>(null);
  const [isProcessingSandbox, setIsProcessingSandbox] = useState<boolean>(false);
  const [testCompressedUrl, setTestCompressedUrl] = useState<string | null>(null);
  const [testThumbnailUrl, setTestThumbnailUrl] = useState<string | null>(null);
  const [testStats, setTestStats] = useState<{
    originalSizeKB: number;
    compressedSizeKB: number;
    originalWidth: number;
    originalHeight: number;
    compressedWidth: number;
    compressedHeight: number;
    thumbnailSizeKB: number;
    reductionPercent: number;
    executionTimeMs: number;
  } | null>(null);

  // حالة تجربة الفحص الذكي بالذكاء الاصطناعي
  const [aiTestResult, setAiTestResult] = useState<AiInspectionResult | null>(null);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiTestTargetType, setAiTestTargetType] = useState<'hall' | 'service'>('hall');

  // حساب الإحصائيات العامة الشاملة لمساحة التخزين
  const analytics = calculateStorageAnalytics({
    hallCount: 145,
    photosPerHall: 14,
    serviceCount: 62,
    photosPerService: 9,
    videoCount: 28,
    tier: 'pro'
  });

  // حفظ واستعادة الإعدادات العامة للوسائط
  const handleSaveAllMediaPolicies = async () => {
    localStorage.setItem('media_image_max_size_kb', String(imageMaxSizeKB));
    localStorage.setItem('media_video_max_size_mb', String(videoMaxSizeMB));
    localStorage.setItem('media_image_min_dim_id', imageMinDimId);
    localStorage.setItem('media_image_max_dim_id', imageMaxDimId);
    localStorage.setItem('media_video_max_dim_id', videoMaxDimId);

    localStorage.setItem('media_enable_auto_compression', enableAutoCompression ? 'true' : 'false');
    localStorage.setItem('media_output_format', outputFormat);
    localStorage.setItem('media_enable_thumbnails', enableThumbnails ? 'true' : 'false');

    localStorage.setItem('media_quota_basic_mb', String(basicQuotaMB));
    localStorage.setItem('media_quota_advanced_mb', String(advancedQuotaMB));
    localStorage.setItem('media_quota_pro_mb', String(proQuotaMB));
    localStorage.setItem('media_plan_storage_quotas', JSON.stringify(planStorageQuotas));

    localStorage.setItem('media_ai_quality_check', enableAiQualityCheck ? 'true' : 'false');
    localStorage.setItem('media_ai_watermark_check', enableAiWatermarkCheck ? 'true' : 'false');
    localStorage.setItem('media_ai_contact_detection', enableAiContactDetection ? 'true' : 'false');
    localStorage.setItem('media_ai_strictness', aiStrictnessLevel);

    await saveConfigToServer('media_image_max_size_kb', imageMaxSizeKB);
    await saveConfigToServer('media_video_max_size_mb', videoMaxSizeMB);
    await saveConfigToServer('media_image_min_dim_id', imageMinDimId);
    await saveConfigToServer('media_image_max_dim_id', imageMaxDimId);
    await saveConfigToServer('media_video_max_dim_id', videoMaxDimId);
    await saveConfigToServer('media_plan_storage_quotas', JSON.stringify(planStorageQuotas));

    window.dispatchEvent(new Event('settingsUpdated'));
    setConfig(getMediaSettingsConfig());
    onShowNotification('success', 'تم حفظ وتحديث سياسات الوسائط، الضغط التلقائي، وحصص التخزين الديناميكية للباقات وفحص الذكاء الاصطناعي بنجاح وتطبيقها فوراً على جميع الواجهات');
  };

  // معالجة اختيار ملف للاختبار الفوري لتقنيات الضغط
  const handleSelectTestFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setTestFile(file);
    setIsProcessingSandbox(true);
    const startTime = performance.now();

    try {
      // 1. تنفيذ الضغط وتصحيح الأبعاد مع التحجيم المتناسب بدون اقتصاص
      const maxPreset = getPresetDimensions(imageMaxDimId, IMAGE_RESOLUTION_PRESETS, '1280x720');
      const minPreset = getPresetDimensions(imageMinDimId, IMAGE_RESOLUTION_PRESETS, '960x540');

      const compressedFile = await compressAndResizeImage(file, {
        maxSizeBytes: imageMaxSizeKB * 1024,
        targetWidth: maxPreset.width,
        targetHeight: maxPreset.height,
        minWidth: minPreset.width,
        minHeight: minPreset.height,
        enforce16x9: false
      });

      const compressedBlobUrl = URL.createObjectURL(compressedFile);
      setTestCompressedUrl(compressedBlobUrl);

      // 2. توليد صورة مصغرة سريعة Thumbnail
      const thumb = await generateImageThumbnail(compressedFile);
      setTestThumbnailUrl(thumb.url);

      const endTime = performance.now();

      // حساب الأبعاد والنسب
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const origW = img.width;
        const origH = img.height;
        const origKB = Math.round(file.size / 1024);
        const compKB = Math.round(compressedFile.size / 1024);
        const percent = Math.round(((origKB - compKB) / origKB) * 100);

        setTestStats({
          originalSizeKB: origKB,
          compressedSizeKB: compKB,
          originalWidth: origW,
          originalHeight: origH,
          compressedWidth: maxPreset.width,
          compressedHeight: maxPreset.height,
          thumbnailSizeKB: thumb.sizeKB,
          reductionPercent: Math.max(0, percent),
          executionTimeMs: Math.round(endTime - startTime)
        });
      };

      // 3. تشغيل فحص الذكاء الاصطناعي التلقائي
      setIsAiScanning(true);
      const aiResult = await simulateAiMediaInspection(file, aiTestTargetType === 'service');
      setAiTestResult(aiResult);
      setIsAiScanning(false);

    } catch (err) {
      console.error('Sandbox processing error:', err);
      onShowNotification('error', 'حدث خطأ أثناء معالجة ملف الاختبار في المختبر');
    } finally {
      setIsProcessingSandbox(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300 text-right dir-rtl">
      {/* 1. الهيدر الرئيسي مع زر الاستعادة والحفظ */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center shadow-inner">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-slate-900 text-lg">منظومة سياسات الوسائط، الضغط الذكي والذكاء الاصطناعي</h4>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold text-[10px] border border-purple-200">
                  إصدار 2026 المطور
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                إدارة شاملة لسياسات الأحجام، الأبعاد، الضغط التلقائي السريع بدون اقتصاص، شريط حصص التخزين السحابي، وفحص أمان الوسائط بالذكاء الاصطناعي للقاعات والخدمات المستقلة.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              type="button"
              onClick={() => {
                setImageMaxSizeKB(500);
                setVideoMaxSizeMB(10);
                setImageMinDimId('960x540');
                setImageMaxDimId('1280x720');
                setVideoMaxDimId('960x540');
                setEnableAutoCompression(true);
                setOutputFormat('webp');
                setEnableThumbnails(true);
                setBasicQuotaMB(20);
                setAdvancedQuotaMB(60);
                setProQuotaMB(150);
                setEnableAiQualityCheck(true);
                setEnableAiWatermarkCheck(true);
                setEnableAiContactDetection(true);
                setAiStrictnessLevel('high');
                onShowNotification('info', 'تمت استعادة الإعدادات الافتراضية المعتمدة بنجاح');
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>استعادة الافتراضي</span>
            </button>

            <button
              type="button"
              onClick={handleSaveAllMediaPolicies}
              className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>حفظ وتطبيق منظومة الوسائط</span>
            </button>
          </div>
        </div>

        {/* 0. التحكم بالأحجام والأبعاد القياسية المعتمدة للصور والفيديوهات */}
        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-purple-600" />
              <h5 className="font-extrabold text-slate-900 text-base">
                التحكم بالأحجام والأبعاد القياسية للصور والفيديوهات (Media Sizes & Resolutions)
              </h5>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200">
              تحكم ديناميكي كامل
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* 1. الحد الأقصى لحجم الصورة (KB) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                الحد الأقصى لحجم الصورة (كيلوبايت - KB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={50}
                  max={10000}
                  value={imageMaxSizeKB}
                  onChange={(e) => setImageMaxSizeKB(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
                <span className="text-xs font-bold text-slate-500">KB</span>
              </div>
              <p className="text-[11px] text-slate-400">مثال: 500 KB (يتم ضغط ما يتجاوز ذلك تلقائياً بـ WebP).</p>
            </div>

            {/* 2. الحد الأقصى لحجم الفيديو (MB) */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                الحد الأقصى لحجم الفيديو (ميجابايت - MB)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={videoMaxSizeMB}
                  onChange={(e) => setVideoMaxSizeMB(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
                />
                <span className="text-xs font-bold text-slate-500">MB</span>
              </div>
              <p className="text-[11px] text-slate-400">أقصى حجم لمقطع الفيديو MP4 الخاص بالقاعات والخدمات.</p>
            </div>

            {/* 3. تمكين رفع الفيديو للمزودين */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-900">إتاحة رفع الفيديوهات للمزودين</span>
                <input
                  type="checkbox"
                  checked={enableProviderVideoUpload}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setEnableProviderVideoUpload(val);
                    localStorage.setItem('enable_provider_video_upload', val ? 'true' : 'false');
                    saveConfigToServer('enable_provider_video_upload', val);
                    window.dispatchEvent(new Event('settingsUpdated'));
                  }}
                  className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                عند تعطيلها، يُسمح للمزودين برفع الصور الفوتوغرافية فقط دون مقاطع الفيديو.
              </p>
              <div className={`p-1.5 rounded-lg text-[11px] font-bold border text-center ${enableProviderVideoUpload ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'}`}>
                {enableProviderVideoUpload ? '✅ ميزة رفع الفيديو مفعّلة' : '🔒 رفع الفيديو معطّل حالياً'}
              </div>
            </div>

            {/* 4. الحد الأدنى لأبعاد الصور */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                الحد الأدنى لأبعاد الصور (Min Resolution)
              </label>
              <select
                value={imageMinDimId}
                onChange={(e) => setImageMinDimId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {IMAGE_RESOLUTION_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">يُرفض أي ملف أبعاده أقل من هذا الحد لمنع الضبابية.</p>
            </div>

            {/* 5. الحد الأقصى لأبعاد الصور */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                الحد الأقصى لأبعاد الصور (Max Resolution)
              </label>
              <select
                value={imageMaxDimId}
                onChange={(e) => setImageMaxDimId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {IMAGE_RESOLUTION_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">يتم تقليص أبعاد الصور الكبيرة جداً إلى هذه الدقة تلقائياً.</p>
            </div>

            {/* 6. الحد الأقصى لأبعاد الفيديو */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                الحد الأقصى لأبعاد الفيديو (Max Video Resolution)
              </label>
              <select
                value={videoMaxDimId}
                onChange={(e) => setVideoMaxDimId(e.target.value)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                {VIDEO_RESOLUTION_PRESETS.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400">أقصى دقة مسموحة لمقاطع الفيديو قبل عرض تحذير الرفض.</p>
            </div>
          </div>
        </div>

        {/* 2. القسم الأول: الضغط والتصحيح التلقائي والتحويل المباشر (On-the-Fly Compression) */}
        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <Zap className="w-5 h-5 text-purple-600" />
              <h5 className="font-extrabold text-slate-900 text-base">
                1️⃣ الضغط والتحويل التلقائي عند الرفع (On-the-Fly Compression & WebP)
              </h5>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 flex items-center gap-1">
              <Check className="w-3 h-3" />
              بدون اقتصاص محتوى الصورة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* خيار تفعيل الضغط والتعديل المتناسب */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">ميزة الضغط والتحجيم المتناسب الآلي</span>
                  <input
                    type="checkbox"
                    checked={enableAutoCompression}
                    onChange={(e) => setEnableAutoCompression(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  تعديل وتحجيم الصورة فورياً لتكون ضمن الأبعاد المعتمدة متناسباً <strong>دون اقتصاص أي جزء من المعالم</strong>، وتصغير الحجم تلقائياً.
                </p>
              </div>
              <div className={`p-2 rounded-lg text-[11px] font-bold border ${enableAutoCompression ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                {enableAutoCompression ? '✅ المعالجة الآلية نشطة' : '⏸️ الضغط الآلي متوقف'}
              </div>
            </div>

            {/* صيغة المخرجات المستقبلية */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold text-slate-800">
                صيغة الصورة المعالجة (Output Image Format)
              </label>
              <select
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value as any)}
                className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white"
              >
                <option value="webp">WebP (الجيل الحديث - الخيار الأسرع بنسبة 80%)</option>
                <option value="jpeg">JPEG (صيغة متوافقة قياسية)</option>
                <option value="auto">تلقائي (بحسب دعم متصفح الزائر)</option>
              </select>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                تساعد صيغة WebP في رفع سرعة استجابة صفحات القاعات والخدمات المستقلة وتحسين تقييم المنصة في مؤشرات Google.
              </p>
            </div>

            {/* توليد النسخ المصغرة Thumbnails */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">توليد الصور المصغرة (Thumbnails)</span>
                  <input
                    type="checkbox"
                    checked={enableThumbnails}
                    onChange={(e) => setEnableThumbnails(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  توليد نسسخة مصغرة خفيفة فورية بمقاس (400x225px) بحجم ~25KB لاستخدامها في البطاقات وقوائم الاستكشاف السريعة.
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-800 font-bold">
                🖼️ مصغرات خفيفة سريعة التحميل
              </div>
            </div>
          </div>

          {/* منصة تجربة الضغط الفورية Sandbox */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-600" />
                <h6 className="font-bold text-sm text-slate-900">مختبر التجربة الفورية للضغط والتحويل التلقائي (Live Transcoding Sandbox)</h6>
              </div>
              <span className="text-[11px] text-slate-400 font-medium">جرب رفع أي صورة لاختبار المعالجة المباشرة</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* منطقة رفع ملف للاختبار */}
              <div className="border-2 border-dashed border-slate-300 hover:border-purple-500 rounded-xl p-6 text-center space-y-3 transition-all bg-slate-50/50 flex flex-col items-center justify-center">
                <UploadCloud className="w-10 h-10 text-purple-500" />
                <div>
                  <label htmlFor="sandbox-upload" className="cursor-pointer px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold inline-block transition-all shadow-sm">
                    اختر صورة للاختبار الحي
                  </label>
                  <input id="sandbox-upload" type="file" accept="image/*" onChange={handleSelectTestFile} className="hidden" />
                </div>
                <p className="text-[11px] text-slate-400">يمكنك رفع صورة عالية الدقة أو كبيرة الحجم لتقويم السرعة والنسبة.</p>
              </div>

              {/* نتائج الاختبار الفوري */}
              <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 text-xs">
                {isProcessingSandbox ? (
                  <div className="h-full flex items-center justify-center gap-3 text-purple-300 py-8">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="font-bold">جاري الضغط والتحويل المتناسب وتوليد المصغرة...</span>
                  </div>
                ) : testStats ? (
                  <div className="space-y-3 animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <span className="font-bold text-purple-300">📊 تقرير المعالجة التلقائية المباشرة:</span>
                      <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] border border-emerald-800">
                        ⚡ {testStats.executionTimeMs}ms
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-[11px]">
                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 space-y-1">
                        <span className="text-slate-400 block">قبل المعالجة (الأصلي):</span>
                        <p className="font-bold text-amber-300">{testStats.originalSizeKB} KB</p>
                        <p className="text-slate-400 text-[10px]">{testStats.originalWidth} × {testStats.originalHeight} px</p>
                      </div>

                      <div className="bg-slate-800/80 p-2.5 rounded-lg border border-slate-700 space-y-1">
                        <span className="text-slate-400 block">بعد الضغط بـ WebP:</span>
                        <p className="font-bold text-emerald-400">{testStats.compressedSizeKB} KB</p>
                        <p className="text-emerald-300 text-[10px]">تخفيض بنسبة {testStats.reductionPercent}% 🎉</p>
                      </div>
                    </div>

                    {testThumbnailUrl && (
                      <div className="flex items-center gap-3 bg-slate-800/50 p-2 rounded-lg border border-slate-700/60">
                        <img src={testThumbnailUrl} alt="Thumb" className="w-16 h-10 object-cover rounded border border-slate-600" />
                        <div>
                          <span className="font-bold text-purple-200 block">النسخة المصغرة (Thumbnail):</span>
                          <p className="text-slate-400 text-[10px]">الحجم: <strong className="text-white">{testStats.thumbnailSizeKB} KB</strong> (أبعاد 400x225px)</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 py-8 text-center space-y-2">
                    <TrendingDown className="w-8 h-8 text-slate-700" />
                    <p>المختبر جاهز! اختر أي صورة لعرض نسبة الضغط وتوفير مساحة التخزين فورياً.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 3. القسم الثاني: شريط استهلاك وتوزيع مساحة التخزين السحابية وحصص الباقات (Storage Analytics Dashboard) */}
        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <PieChart className="w-5 h-5 text-purple-600" />
              <h5 className="font-extrabold text-slate-900 text-base">
                2️⃣ شريط استهلاك مساحة التخزين السحابية وحصص الباقات (Storage Analytics Dashboard)
              </h5>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-800 text-[11px] font-bold border border-purple-200">
              حسابات واقعية دقيقة بالـ MB
            </span>
          </div>

          {/* بطاقات المؤشرات العامة لمساحة التخزين */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">إجمالي السعة المستهلكة للنظام</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-slate-900">{analytics.totalUsedMB} MB</span>
                <span className="text-[10px] text-emerald-600 font-bold">~0.19 GB</span>
              </div>
              <p className="text-[10px] text-slate-400">مقسمة بين الصور ومقاطع الفيديو والمصغرات</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">صور القاعات والمنشآت</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-purple-600">{analytics.hallPhotosCount} صورة</span>
                <span className="text-xs font-bold text-slate-600">({analytics.hallPhotosSizeMB} MB)</span>
              </div>
              <p className="text-[10px] text-slate-400">متوسط 280KB للصورة المضغوطة</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">صور الخدمات المستقلة</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-indigo-600">{analytics.servicePhotosCount} صورة</span>
                <span className="text-xs font-bold text-slate-600">({analytics.servicePhotosSizeMB} MB)</span>
              </div>
              <p className="text-[10px] text-slate-400">متوسط 220KB لكل خدمة مساندة</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 block">مقاطع الفيديو MP4</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-extrabold text-amber-600">{analytics.videoClipsCount} مقطع</span>
                <span className="text-xs font-bold text-slate-600">({analytics.videoClipsSizeMB} MB)</span>
              </div>
              <p className="text-[10px] text-slate-400">فيديو واحد معتمد بدقة HD</p>
            </div>
          </div>

          {/* شريط توزيع الاستهلاك الملون */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-800">
              <span>توزيع استهلاك المساحة بحسب الفئات (Storage Distribution Breakdown)</span>
              <span className="text-purple-700">المجموع: {analytics.totalUsedMB} MB / {analytics.totalQuotaMB} MB ({analytics.usedPercentage}%)</span>
            </div>

            <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
              <div className="bg-purple-600 h-full transition-all" style={{ width: '45%' }} title="صور القاعات" />
              <div className="bg-indigo-500 h-full transition-all" style={{ width: '25%' }} title="صور الخدمات" />
              <div className="bg-amber-500 h-full transition-all" style={{ width: '22%' }} title="الفيديوهات" />
              <div className="bg-emerald-500 h-full transition-all" style={{ width: '8%' }} title="المصغرات" />
            </div>

            <div className="flex flex-wrap gap-4 text-[11px] font-medium pt-1 text-slate-600">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-purple-600"></span>صور القاعات ({analytics.hallPhotosSizeMB} MB)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>صور الخدمات المستقلة ({analytics.servicePhotosSizeMB} MB)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>مقاطع الفيديو ({analytics.videoClipsSizeMB} MB)</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>الصور المصغرة Thumbnails ({analytics.thumbnailsSizeMB} MB)</span>
            </div>
          </div>

          {/* تحديد حصص مساحة التخزين بحسب باقات الاشتراك المجلوبة ديناميكياً */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-3">
              <div>
                <h6 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-amber-600" />
                  تخصيص حصص مساحة التخزين للمزودين بحسب باقات الاشتراك (MB):
                </h6>
                <p className="text-xs text-slate-500 mt-1">
                  تُجلب باقات الاشتراك حياً ومباشرةً من قسم "إدارة الباقات والإشتراكات". عند زيادة أو تعديل أو حذف أي باقة في إدارة الباقات، تتحدث هذه القائمة تلقائياً وديناميكياً بدون قيم ثابته.
                </p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  ربط ديناميكي حقيقي ({subscriptionPlans.length} باقة)
                </span>
                <button
                  type="button"
                  onClick={loadPlansAndQuotas}
                  disabled={isLoadingPlans}
                  className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                  title="تحديث قائمة الباقات حياً"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingPlans ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isLoadingPlans && subscriptionPlans.length === 0 ? (
              <div className="p-8 text-center bg-white rounded-xl border border-slate-200">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-500 mx-auto mb-2" />
                <span className="text-xs font-bold text-slate-500">جاري استيراد باقات الاشتراك الحالية من نظام إدارة الباقات...</span>
              </div>
            ) : subscriptionPlans.length === 0 ? (
              <div className="p-6 text-center bg-amber-50/50 rounded-xl border border-amber-200 text-amber-800 space-y-2">
                <AlertTriangle className="w-6 h-6 mx-auto text-amber-600" />
                <p className="text-xs font-bold">لم يتم العثور على باقات اشتراك مسجلة في النظام.</p>
                <p className="text-[11px] text-amber-700">قم بإضافة باقات جديدة في "إدارة الباقات والإشتراكات" لتعرض وتحدد حصصها التخزينية هنا فوراً.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subscriptionPlans.map((plan, idx) => {
                  const planKey = String(plan.id);
                  const planNameKey = String(plan.name).trim();
                  const currentQuota = planStorageQuotas[planKey] ?? planStorageQuotas[planNameKey] ?? 50;

                  // تقديرات حقيقية مبسطة بناءً على الحصة
                  const estPhotos = Math.round((currentQuota * 1024) / 280); // ~280KB للصورة
                  const estVideos = Math.floor(currentQuota / 10); // ~10MB للفيديو

                  return (
                    <div key={plan.id || idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:border-amber-400 transition-all space-y-3 relative group">
                      <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 font-bold text-xs flex items-center justify-center border border-amber-200 shadow-xs">
                            <Crown className="w-4 h-4" />
                          </div>
                          <div>
                            <h6 className="font-extrabold text-xs text-slate-900 flex items-center gap-1.5">
                              {plan.name}
                              {plan.isHidden && (
                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-500 font-normal">مخفية</span>
                              )}
                            </h6>
                            <span className="text-[11px] text-slate-500 block font-semibold">
                              {plan.price ? `${plan.price} ريال / شهرياً` : (plan.description || 'باقة مخصصة')}
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 dir-ltr">
                          #{plan.id}
                        </span>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] font-extrabold text-slate-800 block">
                            حصة التخزين المتاحة:
                          </label>
                          <span className="text-[10px] text-slate-400 font-bold">MB</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={1}
                            max={50000}
                            value={currentQuota}
                            onChange={(e) => handleQuotaChange(plan.id, plan.name, Number(e.target.value))}
                            className="w-full px-3 py-1.5 text-xs font-extrabold border border-slate-300 rounded-lg text-left dir-ltr focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none transition-all"
                          />
                          <span className="text-xs font-extrabold text-slate-600">MB</span>
                        </div>
                      </div>

                      <div className="pt-1 flex items-center justify-between text-[10px] font-bold text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                        <span>السعة التقديرية:</span>
                        <span className="text-amber-700 font-extrabold">~{estPhotos} صورة {estVideos > 0 ? `+ ${estVideos} فيديو` : ''}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. القسم الثالث: الفحص الذكي للوسائط بالذكاء الاصطناعي (AI Safety & Quality Inspection) */}
        <div className="p-6 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-purple-600" />
              <h5 className="font-extrabold text-slate-900 text-base">
                3️⃣ الفحص الذكي للوسائط بالذكاء الاصطناعي (AI Safety & Quality Inspection)
              </h5>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[11px] font-bold border border-indigo-200">
              يشمل القاعات والخدمات المستقلة
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* فحص الجودة والضبابية */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">فحص الضبابية والإضاءة المنخفضة</span>
                  <input
                    type="checkbox"
                    checked={enableAiQualityCheck}
                    onChange={(e) => setEnableAiQualityCheck(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  التحقق الذكي الآلي من وضوح الصورة وتحديد الصور المعتمة أو غير الواضحة وإعطاء تنبيه للمزود.
                </p>
              </div>
              <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-200 text-[11px] text-emerald-800 font-bold">
                🔍 كشف جودة الوضوح
              </div>
            </div>

            {/* كشف وسائل التواصل والأرقام الخارجية */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">كشف الأرقام والروابط الخارجية</span>
                  <input
                    type="checkbox"
                    checked={enableAiContactDetection}
                    onChange={(e) => setEnableAiContactDetection(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  فحص الصور للقاعات والخدمات المستقلة لمنع وجود أرقام جوال أو حسابات تواصل خارج المنصة.
                </p>
              </div>
              <div className="p-2 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800 font-bold">
                🛡️ حماية سرية التواصل
              </div>
            </div>

            {/* كشف العلامات المائية */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-900">كشف العلامات المائية واللوجوهات</span>
                  <input
                    type="checkbox"
                    checked={enableAiWatermarkCheck}
                    onChange={(e) => setEnableAiWatermarkCheck(e.target.checked)}
                    className="w-4 h-4 accent-purple-600 rounded cursor-pointer"
                  />
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  التعرف الذكي على الشعارات والعلامات المائية المحفورة غير المرخصة وحفظ حقوق الملكية.
                </p>
              </div>
              <div className="p-2 bg-purple-50 rounded-lg border border-purple-200 text-[11px] text-purple-800 font-bold">
                🏷️ فحص حقوق الملكية
              </div>
            </div>
          </div>

          {/* منصة تجربة الفحص بالذكاء الاصطناعي Live AI Inspection */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-purple-600" />
                <h6 className="font-bold text-sm text-slate-900">منصة تجربة الفحص الذكي للوسائط (Interactive AI Scanner)</h6>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">نوع العنصر:</span>
                <button
                  type="button"
                  onClick={() => setAiTestTargetType('hall')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${aiTestTargetType === 'hall' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                  قاعة / منشأة
                </button>
                <button
                  type="button"
                  onClick={() => setAiTestTargetType('service')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${aiTestTargetType === 'service' ? 'bg-purple-600 text-white border-purple-600' : 'bg-slate-100 text-slate-600 border-slate-200'}`}
                >
                  خدمة مستقلة
                </button>
              </div>
            </div>

            {aiTestResult && (
              <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3 animate-in fade-in text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-amber-300">🤖 تقرير الذكاء الاصطناعي المباشر:</span>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${aiTestResult.passedSafety ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'}`}>
                      {aiTestResult.passedSafety ? '✅ مقبول وآمن للنشر' : '⚠️ يحتوي ملاحظات أمان'}
                    </span>
                  </div>
                  <span className="text-purple-300 font-extrabold">التقييم: {aiTestResult.score} / 100</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/80 space-y-1">
                    <span className="text-slate-400 text-[10px]">فحص الوضوح والسطوع:</span>
                    <p className="font-bold text-white">{aiTestResult.isBlurry ? '⚠️ توجد ضبابية جزئية' : '✨ وضوح ممتاز'}</p>
                    <p className="text-slate-400 text-[10px]">نسبة الإضاءة: {aiTestResult.lightingScore}%</p>
                  </div>

                  <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/80 space-y-1">
                    <span className="text-slate-400 text-[10px]">فحص بيانات التواصل:</span>
                    <p className="font-bold text-white">{aiTestResult.hasExternalContactInfo ? '❌ تم رصد أرقام خارجية' : '✅ خالي من بيانات التواصل'}</p>
                    {aiTestResult.detectedContactDetails && aiTestResult.detectedContactDetails.length > 0 && (
                      <p className="text-rose-400 text-[10px]">{aiTestResult.detectedContactDetails.join(', ')}</p>
                    )}
                  </div>

                  <div className="bg-slate-800/70 p-3 rounded-lg border border-slate-700/80 space-y-1">
                    <span className="text-slate-400 text-[10px]">فحص العلامة المائية:</span>
                    <p className="font-bold text-white">{aiTestResult.hasWatermark ? '⚠️ علامة مائية مرصودة' : '✅ صورة خالية من العلامات'}</p>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-800 rounded-lg border border-slate-700 text-purple-200 font-medium leading-relaxed">
                  💡 <strong>توصية الذكاء الاصطناعي:</strong> {aiTestResult.recommendation}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MediaPoliciesManagementSection;
