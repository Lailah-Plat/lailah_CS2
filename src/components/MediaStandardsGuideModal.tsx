import React, { useState, useEffect } from 'react';
import { 
  X, 
  Camera, 
  Sparkles, 
  Image as ImageIcon, 
  Film, 
  Sliders, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  UploadCloud, 
  RotateCcw, 
  Info, 
  Apple, 
  Smartphone, 
  Lock, 
  CheckSquare, 
  Maximize2, 
  Minimize2,
  HardDrive, 
  FileCode,
  ShieldCheck,
  Cpu,
  Sun,
  Compass,
  Crown,
  Landmark
} from 'lucide-react';

import { 
  IMAGE_RESOLUTION_PRESETS, 
  VIDEO_RESOLUTION_PRESETS, 
  getMediaSettingsConfig, 
  getPresetDimensions 
} from '../utils/uploadValidator.js';
import { VideoStandards169Player } from './common/VideoStandards169Player';

interface MediaStandardsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: 'guide' | 'inspector' | 'camera_setup' | 'video_demo';
  defaultTab?: 'guide' | 'inspector' | 'camera_setup' | 'video_demo';
  onImageSelected?: (file: File) => void;
}

export function MediaStandardsGuideModal({
  isOpen,
  onClose,
  initialTab,
  defaultTab = 'camera_setup',
  onImageSelected
}: MediaStandardsGuideModalProps) {
  const selectedTab = initialTab || defaultTab;
  const [activeTab, setActiveTab] = useState<'guide' | 'inspector' | 'camera_setup' | 'video_demo'>(selectedTab);
  const [simulatorMode, setSimulatorMode] = useState<'horizontal' | 'vertical'>('horizontal');
  const [isMaximized, setIsMaximized] = useState<boolean>(false);
  const [cameraPlatform, setCameraPlatform] = useState<'iphone' | 'android' | 'tips'>('tips');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab || defaultTab || 'camera_setup');
      setCameraPlatform('tips');
    }
  }, [isOpen, initialTab, defaultTab]);

  // Video feature flag from settings
  const [isProviderVideoEnabled, setIsProviderVideoEnabled] = useState<boolean>(() => {
    return localStorage.getItem('enable_provider_video_upload') === 'true';
  });

  useEffect(() => {
    const handleSettingsUpdate = () => {
      setIsProviderVideoEnabled(localStorage.getItem('enable_provider_video_upload') === 'true');
    };
    window.addEventListener('settingsUpdated', handleSettingsUpdate);
    return () => window.removeEventListener('settingsUpdated', handleSettingsUpdate);
  }, []);


  // Inspector Tool State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [inspecting, setInspecting] = useState<boolean>(false);
  const [inspectionResult, setInspectionResult] = useState<{
    width: number;
    height: number;
    sizeKB: number;
    sizeMB: number;
    isImage: boolean;
    isVideo: boolean;
    formatOk: boolean;
    sizeOk: boolean;
    dimOk: boolean;
    aspectOk: boolean;
    isTooSmall: boolean;
    isTooLarge: boolean;
    formatName: string;
  } | null>(null);

  // Checklist State
  const [checklist, setChecklist] = useState<boolean[]>([false, false, false, false, false]);

  if (!isOpen) return null;

  const handleFileInspect = (file: File) => {
    setSelectedFile(file);
    setInspecting(true);

    const mediaConfig = getMediaSettingsConfig();
    const minImg = getPresetDimensions(mediaConfig.imageMinDimId, IMAGE_RESOLUTION_PRESETS, '960x540');
    const maxImg = getPresetDimensions(mediaConfig.imageMaxDimId, IMAGE_RESOLUTION_PRESETS, '1280x720');
    const maxVid = getPresetDimensions(mediaConfig.videoMaxDimId, VIDEO_RESOLUTION_PRESETS, '960x540');

    const isImage = file.type.startsWith('image');
    const isVideo = file.type.startsWith('video');
    const sizeKB = file.size / 1024;
    const sizeMB = file.size / (1024 * 1024);

    let formatOk = false;
    let sizeOk = false;
    let formatName = file.type || 'غير معروف';

    if (isImage) {
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
      formatOk = validTypes.includes(file.type.toLowerCase());
      formatName = file.type.replace('image/', '').toUpperCase();
      sizeOk = sizeKB <= mediaConfig.imageMaxSizeKB;
    } else if (isVideo) {
      formatOk = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
      formatName = 'MP4';
      sizeOk = sizeMB <= mediaConfig.videoMaxSizeMB;
    }

    if (isImage) {
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(objectUrl);
        const w = img.width;
        const h = img.height;
        const ratio = w / h;

        // Dynamic Image rules: Min/Max from settings
        const dimOk = w >= minImg.width && h >= minImg.height && w <= maxImg.width && h <= maxImg.height;
        const aspectOk = ratio >= 1.6 && ratio <= 1.9;
        const isTooSmall = w < minImg.width || h < minImg.height;
        const isTooLarge = w > maxImg.width || h > maxImg.height;

        setInspectionResult({
          width: w,
          height: h,
          sizeKB: parseFloat(sizeKB.toFixed(1)),
          sizeMB: parseFloat(sizeMB.toFixed(2)),
          isImage: true,
          isVideo: false,
          formatOk,
          sizeOk,
          dimOk,
          aspectOk,
          isTooSmall,
          isTooLarge,
          formatName
        });
        setInspecting(false);
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setInspectionResult(null);
        setInspecting(false);
      };
      img.src = objectUrl;
    } else if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      const objectUrl = URL.createObjectURL(file);
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(objectUrl);
        const w = video.videoWidth;
        const h = video.videoHeight;
        const ratio = w / h;

        // Dynamic Video rules: Max from settings
        const dimOk = w <= maxVid.width && h <= maxVid.height;
        const aspectOk = ratio >= 1.6 && ratio <= 1.9;

        setInspectionResult({
          width: w,
          height: h,
          sizeKB: parseFloat(sizeKB.toFixed(1)),
          sizeMB: parseFloat(sizeMB.toFixed(2)),
          isImage: false,
          isVideo: true,
          formatOk,
          sizeOk,
          dimOk,
          aspectOk,
          isTooSmall: false,
          isTooLarge: w > maxVid.width || h > maxVid.height,
          formatName: 'MP4'
        });
        setInspecting(false);
      };

      video.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        setInspectionResult(null);
        setInspecting(false);
      };
      video.src = objectUrl;
    } else {
      setInspectionResult(null);
      setInspecting(false);
    }
  };

  const toggleChecklist = (index: number) => {
    const updated = [...checklist];
    updated[index] = !updated[index];
    setChecklist(updated);
  };

  const checkedCount = checklist.filter(Boolean).length;

  return (
    <div className={`fixed inset-0 z-[100] bg-slate-950/92 backdrop-blur-xl flex items-center justify-center ${isMaximized ? 'p-0' : 'p-2 sm:p-5'} overflow-y-auto animate-in fade-in duration-200`} dir="rtl">
      <div className={`bg-slate-900/95 border border-emerald-500/20 text-right overflow-hidden shadow-2xl shadow-emerald-950/50 flex flex-col transition-all duration-300 relative before:absolute before:inset-0 before:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] before:from-emerald-900/25 before:via-indigo-950/10 before:to-transparent before:pointer-events-none ${
        isMaximized 
          ? 'w-full h-full max-w-none max-h-none rounded-none border-0' 
          : 'w-full max-w-5xl max-h-[92vh] rounded-3xl'
      }`}>
        
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-4 sm:p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xl sm:text-2xl shadow-lg shrink-0">
              <Camera className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base sm:text-lg md:text-xl font-extrabold text-white">
                  دليل معايير واشتراطات وسائط القاعات والخدمات (16:9)
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  الأبعاد المعيارية: 16:9 أفقياً
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                المنصة الموحدة لضمان أقصى وضوح ومنع الحواف السوداء والضبابية لدى العملاء
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className="w-10 h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center border border-slate-700 transition cursor-pointer"
              title={isMaximized ? 'تصغير الشاشة' : 'توسيع وتكبير الشاشة'}
            >
              {isMaximized ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>

            <button
              onClick={onClose}
              className="w-10 h-10 rounded-2xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center border border-slate-700 transition cursor-pointer"
              title="إغلاق الدليل"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950 px-4 py-2 border-b border-slate-800 flex flex-wrap gap-2 shrink-0">
          <button
            onClick={() => setActiveTab('video_demo')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'video_demo'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Film className="w-4 h-4 text-emerald-400" />
            <span>🎥 الفيديو التوضيحي المعتمد (16:9)</span>
          </button>

          <button
            onClick={() => setActiveTab('camera_setup')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'camera_setup'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Camera className="w-4 h-4 text-emerald-400" />
            <span>نصائح وتكتيكات التصوير ودليل الجوال</span>
          </button>

          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>المواصفات والمعايير المعتمدة</span>
          </button>

          <button
            onClick={() => setActiveTab('inspector')}
            className={`px-4 py-2 rounded-xl text-xs font-black transition flex items-center gap-2 cursor-pointer ${
              activeTab === 'inspector'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>أداة الفحص المباشر (Live Inspector)</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-grow">

          {/* TAB 0: OFFICIAL DEMO VIDEO (16:9) */}
          {activeTab === 'video_demo' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 space-y-4 text-right">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <h3 className="text-lg font-black text-white flex items-center gap-2">
                      <Film className="w-5 h-5 text-emerald-400" />
                      <span>المقطع التوضيحي المعتمد لالتقاط الوسائط أفقياً (16:9)</span>
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 font-mono px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                        APPROVED 16:9 LANDSCAPE
                      </span>
                    </h3>
                    <p className="text-xs text-slate-400 mt-1">
                      يشرح هذا المقطع بوضوح التحول الفوري من مسك الجوال عمودياً المرفوض ❌ إلى وضعية المسك الأفقي المعتمدة ✅
                    </p>
                  </div>

                  <span className="text-xs bg-slate-900 border border-slate-800 text-slate-300 px-3 py-1.5 rounded-xl font-bold">
                    ⏱️ مدة المقطع: 9 ثوانٍ | دقة HD 16:9
                  </span>
                </div>

                {/* Integrated 16:9 Video Player */}
                <VideoStandards169Player autoPlay={true} showTitle={false} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-xs text-rose-400 font-extrabold block">1. التنبيه الأولي (00:01) ❌</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      التقاط الصور أو الفيديو بوضعية عمودية يمنح شارة الرفض الحمراء لظهور حواف سوداء وتصغير مساحة العرض.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-xs text-emerald-400 font-extrabold block">2. التدوير الأفقي (00:02) 📱</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      لف الهاتف الذكي أفقياً 90 درجة يفتح زاوية العرض الكاملة لكافة الطاولات والكوشة والديكورات العلوية.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-1">
                    <span className="text-xs text-amber-300 font-extrabold block">3. الشعار المعتمد (00:04) ✅</span>
                    <p className="text-[11px] text-slate-300 leading-relaxed">
                      الحصول على وسام اعتماد العرض <strong className="text-emerald-400">APPROVED 16:9 LANDSCAPE</strong> ومطابقة معايير المنصة.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 1: GUIDE & SPECIFICATIONS */}
          {activeTab === 'guide' && (
            <div className="space-y-6">
              
              {/* Header Hero Banner Section */}
              <section className="bg-slate-950/80 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-slate-800 relative overflow-hidden">
                <div className="absolute -left-10 -bottom-10 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -right-10 -top-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

                <div className="grid md:grid-cols-12 gap-8 items-center relative z-10">
                  <div className="md:col-span-7 space-y-4">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 text-sm font-bold border border-emerald-500/20">
                      <Sparkles className="w-4 h-4 text-emerald-400" />
                      <span>دليل جودة العرض والوضوح</span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-white leading-tight">
                      التقط صورك وفيديوهاتك <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-blue-400">أفقياً (16:9) بالدقة المعتمدة</span>
                    </h2>
                    <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
                      نضمن لك ظهور قاعتك بأفضل حلة وبدون تشوه أو ضبابية. نعتمد دقة حصرية لمنع الحواف السوداء، بحجم صور أقصاه 500KB وفيديو MP4 أقصاه 10MB لضمان سرعة تصفح فائقة للعملاء.
                    </p>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                        <ImageIcon className="w-5 h-5 text-emerald-400 shrink-0" />
                        <div>
                          <span className="block text-[11px] text-slate-400">أبعاد الصور المعتمدة</span>
                          <strong className="text-xs text-white">960x540 إلى 1280x720</strong>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex items-center gap-3">
                        <Film className="w-5 h-5 text-blue-400 shrink-0" />
                        <div>
                          <span className="block text-[11px] text-slate-400">أبعاد الفيديو الأقصى</span>
                          <strong className="text-xs text-white">960x540 (16:9)</strong>
                        </div>
                      </div>

                      <div className="bg-slate-900/90 p-3 rounded-2xl border border-slate-800 flex items-center gap-3 col-span-2 sm:col-span-1">
                        <HardDrive className="w-5 h-5 text-amber-400 shrink-0" />
                        <div>
                          <span className="block text-[11px] text-slate-400">سعة الملفات</span>
                          <strong className="text-xs text-white">500KB صور | 10MB فيديو</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 flex justify-center">
                    <div className="w-full max-w-sm bg-slate-900 border border-slate-800 p-5 rounded-3xl shadow-2xl relative">
                      <div className="text-center mb-3">
                        <span className="text-[11px] uppercase tracking-widest text-slate-400 font-bold">طريقة مسك الجوال</span>
                        <h3 className="text-base font-bold text-slate-100">امسك جوالك أفقياً (16:9)</h3>
                      </div>

                      <div className="flex justify-center items-center py-5 bg-slate-950/80 rounded-2xl border border-slate-800 relative">
                        <div className="w-48 h-28 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-2xl border-4 border-slate-600 relative flex items-center justify-center p-2 shadow-xl">
                          <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden relative flex flex-col justify-between p-2">
                            <div className="flex justify-between items-center text-[10px] text-emerald-400 font-mono font-bold">
                              <span>REC ● 16:9</span>
                              <span>HD 720p</span>
                            </div>
                            <div className="text-center py-1">
                              <Landmark className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                              <span className="block text-[10px] font-bold text-slate-200">1280x720 تغطية مثالية</span>
                            </div>
                            <div className="w-full h-1 bg-emerald-500 rounded-full"></div>
                          </div>
                          <div className="absolute left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-500"></div>
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-slate-900 border border-slate-500"></div>
                        </div>
                      </div>

                      <div className="mt-3 text-center">
                        <span className="inline-flex items-center gap-2 text-emerald-400 text-xs font-bold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                          تجاوب كامل مع شاشات الأجهزة
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Interactive Simulator Section */}
              <section className="space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
                      <Sliders className="w-4 h-4 text-emerald-400" />
                      <span>تجربة تفاعلية حية</span>
                    </div>
                    <h3 className="text-xl font-bold text-white">محاكي ظهور الوسائط على شاشة تطبيق العملاء</h3>
                    <p className="text-slate-400 text-xs mt-0.5">شاهد تأثير التقاط الوسائط بالأبعاد المعتمدة مقابل التصوير العمودي المرفوض</p>
                  </div>

                  <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-slate-800 self-start md:self-auto">
                    <button
                      type="button"
                      onClick={() => setSimulatorMode('horizontal')}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                        simulatorMode === 'horizontal'
                          ? 'bg-emerald-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4 rotate-90" />
                      <span>أفقي (16:9) - المعتمد</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSimulatorMode('vertical')}
                      className={`px-4 py-2 rounded-xl font-bold text-xs transition flex items-center gap-2 cursor-pointer ${
                        simulatorMode === 'vertical'
                          ? 'bg-red-600 text-white shadow-lg'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      <Smartphone className="w-4 h-4" />
                      <span>عمودي (مرفوض)</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-3xl p-5 md:p-6 border border-slate-800 grid md:grid-cols-12 gap-6 items-center">
                  <div className="md:col-span-7 flex justify-center">
                    <div className="w-full max-w-lg">
                      <div className="bg-slate-950 rounded-2xl border-2 border-slate-800 overflow-hidden shadow-2xl relative">
                        <div className="bg-slate-900 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400">
                          <span className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500"></span>
                            <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                            <span className="mr-2 text-slate-300 font-semibold">شاشة عرض تفاصيل القاعة</span>
                          </span>
                          <span className={`font-mono text-xs px-2 py-0.5 rounded border ${
                            simulatorMode === 'horizontal'
                              ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }`}>
                            {simulatorMode === 'horizontal' ? '16:9 أفقية مثالية' : 'مرفوض: وضع عمودي'}
                          </span>
                        </div>

                        <div className="relative w-full aspect-[16/9] bg-slate-950 flex items-center justify-center overflow-hidden transition-all duration-500">
                          {/* Black bars if vertical */}
                          <div 
                            className="absolute left-0 top-0 bottom-0 bg-black/90 border-r border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold transition-all duration-500 z-20"
                            style={{ width: simulatorMode === 'vertical' ? '28%' : '0%' }}
                          >
                            {simulatorMode === 'vertical' && <span className="hidden sm:inline rotate-90 opacity-80">فراغ أسود</span>}
                          </div>
                          <div 
                            className="absolute right-0 top-0 bottom-0 bg-black/90 border-l border-red-500/40 flex items-center justify-center text-red-400 text-xs font-bold transition-all duration-500 z-20"
                            style={{ width: simulatorMode === 'vertical' ? '28%' : '0%' }}
                          >
                            {simulatorMode === 'vertical' && <span className="hidden sm:inline -rotate-90 opacity-80">فراغ أسود</span>}
                          </div>

                          <div 
                            className="w-full h-full bg-cover bg-center transition-all duration-500 relative flex flex-col justify-between p-4"
                            style={{ backgroundImage: "url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80')" }}
                          >
                            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 inline-flex items-center gap-2 self-start">
                              <Crown className="w-3.5 h-3.5 text-amber-400" />
                              <span className="text-xs font-bold text-white">قاعة الاحتفالات الرئيسية</span>
                            </div>
                            <div className="bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 text-xs text-slate-300 self-end">
                              معاينة العرض 1280×720
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-5 space-y-4">
                    <div className={`p-4 rounded-2xl border text-xs space-y-2 ${
                      simulatorMode === 'horizontal'
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                      <div className="flex items-center gap-2 font-extrabold text-base">
                        {simulatorMode === 'horizontal' ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                            <span>تغطية ممتازة بدقة HD عالية!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                            <span>تنبيه! تصوير عمودي غير مقبول</span>
                          </>
                        )}
                      </div>
                      <p className={`text-xs leading-relaxed ${
                        simulatorMode === 'horizontal' ? 'text-emerald-200/90' : 'text-red-200/90'
                      }`}>
                        {simulatorMode === 'horizontal'
                          ? 'الصور بأبعاد بين (960×540) و (1280×720) توفر أعلى درجات الوضوح بدون غباش أو اقتطاع، وتملأ شاشة العميل بالكامل بالوضع الأفقي.'
                          : 'يُحدث التصوير العمودي فراغات سوداء جانبية عريضة ويقلل مساحة العرض المرئية للعملاء.'
                        }
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="font-bold text-xs text-slate-200">التقييم الفني المباشر:</h4>
                      
                      <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-300">مطابقة نسبة العرض (16:9)</span>
                          <span className={`font-bold flex items-center gap-1 ${
                            simulatorMode === 'horizontal' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {simulatorMode === 'horizontal' ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> متطابقة 100%</>
                            ) : (
                              <><XCircle className="w-3.5 h-3.5" /> غير متطابقة</>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-300">خلو الجوانب من الحواف السوداء</span>
                          <span className={`font-bold flex items-center gap-1 ${
                            simulatorMode === 'horizontal' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {simulatorMode === 'horizontal' ? (
                              <><CheckCircle2 className="w-3.5 h-3.5" /> خالية تماماً</>
                            ) : (
                              <><XCircle className="w-3.5 h-3.5" /> توجد حواف عريضة</>
                            )}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800">
                          <span className="text-slate-300">مستوى الوضوح والضبابية</span>
                          <span className={`font-bold flex items-center gap-1 ${
                            simulatorMode === 'horizontal' ? 'text-emerald-400' : 'text-red-400'
                          }`}>
                            {simulatorMode === 'horizontal' ? (
                              <><Sparkles className="w-3.5 h-3.5" /> دقة فائقة HD</>
                            ) : (
                              <><XCircle className="w-3.5 h-3.5" /> مساحة منخفضة</>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Detailed Specs Cards (Images & Videos) */}
              <div className="grid md:grid-cols-2 gap-5">
                
                {/* Images Specs Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 relative hover:border-emerald-500/40 transition">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">🖼️ أولاً: الصور (Images)</h4>
                        <span className="text-[11px] text-slate-400">اشتراطات صور الألبوم والخلفيات</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-[10px] font-black rounded-full border border-emerald-500/30">
                      16:9 أفقية
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                        الحد الأدنى للأبعاد (Min Res)
                      </span>
                      <span className="font-black text-emerald-400">960px عرض × 540px ارتفاع</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                        الحد الأقصى للأبعاد (Max Res)
                      </span>
                      <span className="font-black text-emerald-400">1280px عرض × 720px ارتفاع</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                        الحد الأقصى لحجم الملف
                      </span>
                      <span className="font-black text-white">500KB (كيلوبايت)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-emerald-400" />
                        الصيغ المدعومة
                      </span>
                      <span className="font-black text-amber-300">JPG / JPEG / PNG / WebP</span>
                    </div>
                  </div>

                  <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-[11px] text-red-300 leading-relaxed">
                    <strong className="block text-red-400 mb-0.5">⛔ أسباب الرفض الآلي للصور:</strong>
                    تُرفض أي صورة أبعادها أقل من 960×540px لمنع الضبابية، أو يزيد حجمها عن 500KB لضمان استقرار التحميل.
                  </div>
                </div>

                {/* Videos Specs Card */}
                <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4 relative hover:border-blue-500/40 transition">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                        <Film className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm">🎥 ثانياً: مقاطع الفيديو (Videos)</h4>
                        <span className="text-[11px] text-slate-400">اشتراطات الجولات والعروض الترويجية</span>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 bg-blue-500/20 text-blue-300 text-[10px] font-black rounded-full border border-blue-500/30">
                      MP4 حصرياً
                    </span>
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
                        الحد الأقصى للأبعاد (Max Res)
                      </span>
                      <span className="font-black text-blue-400">960px عرض × 540px ارتفاع</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                        الحد الأقصى لحجم الملف
                      </span>
                      <span className="font-black text-white">10MB (ميجابايت)</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <FileCode className="w-3.5 h-3.5 text-blue-400" />
                        الصيغة المعتمدة حصرياً
                      </span>
                      <span className="font-black text-emerald-400">MP4 فقط</span>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-400" />
                        حالة إتاحة الخدمة للمزودين
                      </span>
                      <span className={`font-black ${isProviderVideoEnabled ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {isProviderVideoEnabled ? 'مفعلة للمزودين' : 'مغلقة حالياً (حسب الإعدادات)'}
                      </span>
                    </div>
                  </div>

                  {!isProviderVideoEnabled ? (
                    <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-[11px] text-amber-300 leading-relaxed flex items-start gap-2">
                      <Lock className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-amber-300 mb-0.5 font-extrabold">🔒 سياسة إتاحة الفيديو للمزودين:</strong>
                        إضافة مقاطع الفيديو غير متاحة للمزودين في الوقت الحالي بصورة افتراضية. ويمكن للإدارة تفعيلها بلمسة زر من إعدادات النظام العامة في أي وقت.
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-[11px] text-emerald-300 leading-relaxed">
                      <strong className="block text-emerald-400 mb-0.5 font-extrabold">✅ ميزة رفع الفيديو مفعّلة:</strong>
                      يمكن للمزود رفع مقاطع فيديو MP4 بسعة حتى 10MB وأبعاد 960×540px.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: LIVE INSPECTOR TOOL */}
          {activeTab === 'inspector' && (
            <div className="space-y-6">
              
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-emerald-400" />
                      أداة فحص الأبعاد والرليوشن المباشرة للوسائط
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      اسحب صورة أو فيديو لاختبار العرض، الارتفاع، الحجم، والصيغة والتحقق فوريّاً من مطابقتها قبل الرفع
                    </p>
                  </div>

                  <span className="text-[10px] bg-slate-900 border border-slate-800 text-slate-400 px-3 py-1 rounded-full font-bold">
                    🛡️ فحص محلي آمن داخل المتصفح
                  </span>
                </div>

                {/* Dropzone */}
                <div className="border-2 border-dashed border-slate-700 hover:border-emerald-500 bg-slate-900/60 hover:bg-slate-900 transition-all rounded-2xl p-8 text-center cursor-pointer relative group">
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/jpg,video/mp4"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileInspect(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <div className="space-y-3 pointer-events-none">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-2xl mx-auto group-hover:scale-110 transition duration-300">
                      <UploadCloud className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-extrabold text-white">اضغط هنا لاختيار صورة أو فيديو للفحص المباشر</p>
                      <p className="text-xs text-slate-400 mt-1">الصور (JPG, PNG, WebP) | الفيديو (MP4)</p>
                    </div>
                  </div>
                </div>

                {/* Inspecting Spinner */}
                {inspecting && (
                  <div className="p-4 bg-slate-900 rounded-xl text-center text-xs text-slate-300 font-bold animate-pulse">
                    جاري فحص وقراءة هيدروليكيات أبعاد الملف...
                  </div>
                )}

                {/* Inspection Result Display */}
                {inspectionResult && selectedFile && !inspecting && (
                  <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 space-y-4 animate-in fade-in duration-300">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
                          {inspectionResult.isImage ? <ImageIcon className="w-5 h-5 text-emerald-400" /> : <Film className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-white text-sm">{selectedFile.name}</h5>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {inspectionResult.isImage ? `${inspectionResult.sizeKB} KB` : `${inspectionResult.sizeMB} MB`} | {inspectionResult.formatName}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setInspectionResult(null);
                        }}
                        className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 flex items-center gap-1 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>فحص ملف آخر</span>
                      </button>
                    </div>

                    {/* 4 Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      
                      {/* Aspect Ratio */}
                      <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                        inspectionResult.aspectOk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                        <span className="text-[10px] text-slate-400 block">نسبة الأبعاد (16:9)</span>
                        <div className="font-extrabold flex items-center gap-1">
                          {inspectionResult.aspectOk ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                          <span>{inspectionResult.aspectOk ? '16:9 أفقية معتمدة' : 'غير متوافقة (ليست 16:9)'}</span>
                        </div>
                      </div>

                      {/* Dimensions WxH */}
                      <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                        inspectionResult.dimOk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                        <span className="text-[10px] text-slate-400 block">الدقة والأبعاد (W×H)</span>
                        <div className="font-extrabold flex items-center gap-1">
                          {inspectionResult.dimOk ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-amber-400" />}
                          <span>{inspectionResult.width}×{inspectionResult.height}px</span>
                        </div>
                      </div>

                      {/* File Size */}
                      <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                        inspectionResult.sizeOk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                        <span className="text-[10px] text-slate-400 block">حجم الملف</span>
                        <div className="font-extrabold flex items-center gap-1">
                          {inspectionResult.sizeOk ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                          <span>
                            {inspectionResult.isImage 
                              ? `${inspectionResult.sizeKB} KB ${inspectionResult.sizeOk ? '(ضمن 500KB)' : '(يتجاوز 500KB)'}`
                              : `${inspectionResult.sizeMB} MB ${inspectionResult.sizeOk ? '(ضمن 10MB)' : '(يتجاوز 10MB)'}`
                            }
                          </span>
                        </div>
                      </div>

                      {/* Format */}
                      <div className={`p-3 rounded-xl border text-xs space-y-1 ${
                        inspectionResult.formatOk ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' : 'bg-red-500/10 border-red-500/30 text-red-300'
                      }`}>
                        <span className="text-[10px] text-slate-400 block">صيغة الملف</span>
                        <div className="font-extrabold flex items-center gap-1">
                          {inspectionResult.formatOk ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <XCircle className="w-4 h-4 text-red-400" />}
                          <span>{inspectionResult.formatName}</span>
                        </div>
                      </div>

                    </div>

                    {/* Verdict Banner */}
                    {inspectionResult.isVideo && !isProviderVideoEnabled ? (
                      <div className="p-3.5 bg-amber-500/15 border border-amber-500/40 rounded-xl text-amber-200 text-xs flex items-start gap-2.5">
                        <Lock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <strong className="font-extrabold block text-amber-300">🔒 خيار رفع الفيديو غير متاح حالياً للمزودين:</strong>
                          الملف مفحوص بنجاح، ولكن ميزة رفع الفيديوهات مغلقة حالياً حسب سياسة المنصة العامة. يمكن اعتماد الصور الفوتوغرافية فقط للمزودين.
                        </div>
                      </div>
                    ) : inspectionResult.formatOk && inspectionResult.sizeOk && inspectionResult.dimOk && inspectionResult.aspectOk ? (
                      <div className="p-3.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-emerald-200 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                          <div>
                            <strong className="font-extrabold text-sm block text-emerald-300">ممتاز! الملف مطابق 100% لكافة الاشتراطات والأبعاد القياسية</strong>
                            <p className="text-[11px] text-emerald-200/90">يمكنك رفعه بضمان جودة وضوح فائقة وسرعة تحميل متناهية للعملاء.</p>
                          </div>
                        </div>

                        {onImageSelected && inspectionResult.isImage && (
                          <button
                            onClick={() => {
                              onImageSelected(selectedFile);
                              onClose();
                            }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-md transition cursor-pointer shrink-0"
                          >
                            تأكيد واستخدام الملف
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="p-3.5 bg-red-500/20 border border-red-500/40 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
                        <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <strong className="font-extrabold block text-red-300">الملف غير متوافق تماماً مع الاشتراطات:</strong>
                          <ul className="list-disc list-inside text-[11px] space-y-0.5 opacity-90">
                            {!inspectionResult.formatOk && <li>الصيغة غير مدعومة (يجب استخدام JPG/PNG/WebP للصور أو MP4 للفيديو).</li>}
                            {!inspectionResult.sizeOk && <li>حجم الملف يتجاوز الحد المسموح (أقصاه 500KB للصور / 10MB للفيديو).</li>}
                            {inspectionResult.isTooSmall && <li>أبعاد الصورة أقل من الحد الأدنى (960×540px) مما يسبب ضبابية.</li>}
                            {inspectionResult.isTooLarge && inspectionResult.isImage && <li>أبعاد الصورة تتجاوز الحد الأقصى (1280×720px).</li>}
                            {!inspectionResult.aspectOk && <li>يرجى التقاط الملف بوضعية أفقية عريضة (16:9) لتجنب الفراغات السوداء.</li>}
                          </ul>
                        </div>
                      </div>
                    )}

                  </div>
                )}
              </div>

            </div>
          )}

          {/* TAB 3: SMARTPHONE CAMERA SETUP & VISUAL GUIDE */}
          {activeTab === 'camera_setup' && (
            <div className="space-y-6">
              
              {/* Platform Selector Header */}
              <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                    <Camera className="w-4 h-4 text-emerald-400" />
                    دليل ضبط كاميرا الجوال وتكتيكات التصوير الاحترافي (16:9)
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    اختر القسم المطلوب لمشاهدة التكتيكات والشرح المصور خطوة بخطوة
                  </p>
                </div>

                <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                  <button
                    onClick={() => setCameraPlatform('tips')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                      cameraPlatform === 'tips'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span>💡 نصائح وتكتيكات التصوير</span>
                  </button>
                  <button
                    onClick={() => setCameraPlatform('iphone')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                      cameraPlatform === 'iphone'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Apple className="w-4 h-4" />
                    <span>آيفون (iPhone)</span>
                  </button>
                  <button
                    onClick={() => setCameraPlatform('android')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-black transition flex items-center gap-1.5 cursor-pointer ${
                      cameraPlatform === 'android'
                        ? 'bg-emerald-500 text-slate-950 shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Smartphone className="w-4 h-4" />
                    <span>أندرويد (Android)</span>
                  </button>
                </div>
              </div>

              {/* 💡 PRO PHOTOGRAPHY TIPS */}
              {cameraPlatform === 'tips' && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in duration-200">
                  
                  {/* Tip 1: Ultra-Wide Lens */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                      <Maximize2 className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-white text-xs">1. استخدام العدسة العريضة (0.5x)</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      إذا كان جوالك يحتوي على عدسة فائقة الاتساع (0.5x Ultra-Wide)، استخدمها من زاوية مدخل القاعة لإبراز كامل المساحة والطاولات في لقطة واحدة ساحرة.
                    </p>
                  </div>

                  {/* Tip 2: Lighting */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center justify-center">
                      <Sun className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-white text-xs">2. تشغيل الإضاءة الكلية للقاعة</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      قبل البدء بالتصوير، قم بتشغيل كافة الثريات والكشافات العلوية والإضاءات المخفية. تجنب التصوير في الظلام لمنع ظهور التحبب والضبابية.
                    </p>
                  </div>

                  {/* Tip 3: Eye Level */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 flex items-center justify-center">
                      <Compass className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-white text-xs">3. التصوير من مستوى منتصف القاعة</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      قف في منتصف القاعة واجعل الكاميرا على ارتفاع صدرك (حوالي 1.4 إلى 1.5 متر). تجنب تمييل الكاميرا لأعلى أو لأسفل بشكل مائل.
                    </p>
                  </div>

                  {/* Tip 4: Stability */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <h5 className="font-extrabold text-white text-xs">4. التثبيت وعدم الاهتزاز</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      امسك الهاتف بكلتا يديك وضم مرفقيك لجسمك أثناء التقاط الصورة أو تحريك الفيديو ببطء شديد، أو استخدم حاملاً ثلاثياً (Tripod).
                    </p>
                  </div>

                </div>
              )}

              {/* 📱 IPHONE VISUAL GUIDE */}
              {cameraPlatform === 'iphone' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Step 1: Arrow Control */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">1</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 01</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">افتح تطبيق الكاميرا وسهم الخيارات</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          افتح الكاميرا واضغط سهم الخيارات <span className="text-emerald-400 font-bold">^</span> الموجود أعلى أو جانب الشاشة لإظهار شريط الإعدادات.
                        </p>
                      </div>

                      {/* UI Mockup Step 1 */}
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none relative overflow-hidden">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span className="text-emerald-400 font-bold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                            سهم الخيارات ^
                          </span>
                          <span>iOS Camera</span>
                        </div>
                        <div className="bg-slate-950 h-24 rounded-lg border border-slate-800/80 flex flex-col justify-between p-2 relative">
                          <div className="flex justify-center">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 text-[9px] font-black border border-emerald-500/50 animate-bounce">
                              ▲ اضغط هنا أولاً
                            </span>
                          </div>
                          <div className="flex justify-around text-[9px] text-slate-500 font-mono">
                            <span>صورة</span>
                            <span className="text-white font-bold bg-slate-800 px-1.5 py-0.5 rounded">PHOTO</span>
                            <span>فيديو</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: 16:9 Aspect Ratio */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">2</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 02</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">حوّل أبعاد الصورة من 4:3 إلى 16:9</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          في شريط الخيارات السفلي، اضغط زر النسبة الحالي (4:3) وقم بتحويله مباشرة إلى <strong className="text-emerald-300">16:9</strong>.
                        </p>
                      </div>

                      {/* UI Mockup Step 2 */}
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span>اختيار الأبعاد</span>
                          <span className="text-emerald-400 font-mono font-bold">16:9 RATIO</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex items-center justify-center gap-1.5 text-[10px]">
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-500 line-through">4:3</span>
                          <span className="px-2 py-1 rounded bg-slate-800 text-slate-500 line-through">1:1</span>
                          <span className="px-2.5 py-1 rounded bg-emerald-500 text-slate-950 font-black border border-emerald-400 shadow animate-pulse">
                            16:9 ✅
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Grid & Level */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">3</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 03</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">تفعيل الشبكة والميزان (Grid & Level)</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          اذهب لـ <span className="text-slate-200 font-bold">الإعدادات ⚙️ {'>'} الكاميرا</span> وقم بتفعيل خيار "الشبكة Grid" و "الميزان Level" لضمان استقامة الأفق.
                        </p>
                      </div>

                      {/* UI Mockup Step 3 */}
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span>إعدادات الكاميرا</span>
                          <span className="text-slate-300">⚙️ Settings</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 space-y-1 text-[10px]">
                          <div className="flex justify-between items-center text-slate-300">
                            <span>الشبكة (Grid)</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">مميّك [ON]</span>
                          </div>
                          <div className="flex justify-between items-center text-slate-300">
                            <span>الميزان (Level)</span>
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">مميّك [ON]</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Rotate Phone */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">4</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 04</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">التصوير بوضعية أفقية (Landscape)</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          اقلب الجوال <strong className="text-emerald-300">أفقياً (بالعرض)</strong> قبل الضغط على زر الالتقاط لتعبئة كافة شاشة العميل بدون أطراف سوداء.
                        </p>
                      </div>

                      {/* UI Mockup Step 4 */}
                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span>وضع المسك الصحيح</span>
                          <span className="text-emerald-400 font-bold">16:9 WIDE</span>
                        </div>
                        <div className="bg-slate-950 h-14 rounded-lg border border-emerald-500/40 flex items-center justify-center gap-2 text-emerald-300 font-black text-[11px] bg-emerald-500/10">
                          <RotateCcw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                          <span>امسك الجوال بالعرض 16:9 📱</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* 🤖 ANDROID VISUAL GUIDE */}
              {cameraPlatform === 'android' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    {/* Step 1: Ratio Button */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">1</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 01</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">اضغط زر أبعاد الكاميرا العلوي</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          في أعلى شاشتك بأجهزة سامسونج وأندرويد، انقر على أيقونة النسبة المكتوبة مثل <span className="text-amber-400 font-bold">3:4</span> أو <span className="text-amber-400 font-bold">9:16</span>.
                        </p>
                      </div>

                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span>أندرويد / سامسونج</span>
                          <span>Camera Bar</span>
                        </div>
                        <div className="bg-slate-950 h-20 rounded-lg border border-slate-800 flex items-center justify-around text-[10px] p-2">
                          <span className="px-2 py-1 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/40 animate-pulse">
                            [3:4] اضغط هنا
                          </span>
                          <span className="text-slate-600">⚙️</span>
                          <span className="text-slate-600">⚡</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Choose 16:9 */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">2</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 02</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">اختر النسبة العريضة 16:9</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          من قائمة الخيارات المنسدلة، حدد نسبة <strong className="text-emerald-300">16:9</strong> لفتح زاوية تصوير عريضة وشاملة.
                        </p>
                      </div>

                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span>قائمة النسب</span>
                          <span className="text-emerald-400 font-bold">16:9</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-center gap-1.5 text-[10px]">
                          <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded">3:4</span>
                          <span className="px-2 py-1 bg-slate-800 text-slate-500 rounded">1:1</span>
                          <span className="px-2.5 py-1 bg-emerald-500 text-slate-950 font-black rounded border border-emerald-400 shadow">
                            16:9 ✅
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Grid Lines */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">3</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 03</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">تفعيل خطوط الشبكة 3×3 (Grid Lines)</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          اضغط الترس ⚙️ بداخل الكاميرا قم بتمكين <span className="text-slate-200 font-bold">"خطوط الشبكة Grid lines"</span> لضبط اتزان الجدران والأعمدة.
                        </p>
                      </div>

                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span>ضبط الكاميرا</span>
                          <span className="text-slate-300">⚙️ Settings</span>
                        </div>
                        <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 flex justify-between items-center text-[10px] text-slate-300">
                          <span>خطوط الشبكة 3x3</span>
                          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">مميّك [ON]</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 4: Horizontal Hold */}
                    <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 space-y-3 flex flex-col justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 font-extrabold text-xs flex items-center justify-center">4</span>
                          <span className="text-[10px] text-slate-400 font-mono">STEP 04</span>
                        </div>
                        <h5 className="font-extrabold text-white text-xs">تدوير الهاتف والتقاط الصورة أفقياً</h5>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          امسك هاتفك الأندرويد بوضعية <strong className="text-emerald-300">أفقية كاملة</strong> ثم اضغط زر التصوير الكبير.
                        </p>
                      </div>

                      <div className="bg-slate-900 rounded-xl p-3 border border-slate-800 space-y-2 select-none">
                        <div className="flex justify-between items-center text-[10px] text-slate-400 border-b border-slate-800 pb-1.5">
                          <span>الالتقاط النهائى</span>
                          <span className="text-emerald-400 font-bold">LANDSCAPE</span>
                        </div>
                        <div className="bg-slate-950 h-14 rounded-lg border border-emerald-500/40 flex items-center justify-center gap-2 text-emerald-300 font-black text-[11px] bg-emerald-500/10">
                          <RotateCcw className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '4s' }} />
                          <span>التصوير بالاتجاه الأفقي 📷</span>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}

              {/* Interactive Camera Orientation Viewfinder Simulator */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <Film className="w-4 h-4 text-emerald-400" />
                      محاكي الكاميرا التفاعلي (مقارنة التصوير الأفقي 16:9 مقابل التصوير الرأسي 9:16)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      شاهد كيف تظهر صور القاعة داخل العرض المباشر للعميل حسب وضعية مسك الجوال
                    </p>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 shrink-0">
                    <button
                      onClick={() => setSimulatorMode('horizontal')}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                        simulatorMode === 'horizontal'
                          ? 'bg-emerald-500 text-slate-950 shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ✅ التصوير الأفقي (16:9)
                    </button>
                    <button
                      onClick={() => setSimulatorMode('vertical')}
                      className={`px-3 py-1 rounded-lg text-xs font-black transition cursor-pointer ${
                        simulatorMode === 'vertical'
                          ? 'bg-red-500 text-white shadow'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      ❌ التصوير الرأسي (9:16)
                    </button>
                  </div>
                </div>

                {/* Simulated Screen */}
                <div className="relative bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center p-4 min-h-[220px]">
                  {simulatorMode === 'horizontal' ? (
                    <div className="w-full max-w-2xl aspect-video bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-xl border-2 border-emerald-500/60 p-4 relative flex flex-col justify-between shadow-2xl overflow-hidden">
                      {/* Grid Lines Overlay */}
                      <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-25 border border-emerald-500/20">
                        <div className="border border-emerald-500/20"></div>
                        <div className="border border-emerald-500/20"></div>
                        <div className="border border-emerald-500/20"></div>
                        <div className="border border-emerald-500/20"></div>
                        <div className="border border-emerald-500/20 flex items-center justify-center">
                          <div className="w-8 h-0.5 bg-emerald-400/60"></div>
                        </div>
                        <div className="border border-emerald-500/20"></div>
                        <div className="border border-emerald-500/20"></div>
                        <div className="border border-emerald-500/20"></div>
                        <div className="border border-emerald-500/20"></div>
                      </div>

                      {/* Top Viewfinder UI */}
                      <div className="flex justify-between items-center text-[10px] text-white z-10 font-mono">
                        <span className="px-2 py-0.5 rounded bg-emerald-500 text-slate-950 font-black">16:9 WIDE APPROVED</span>
                        <span className="text-emerald-400">0.5x ULTRA-WIDE</span>
                        <span className="text-slate-300">HDR ACTIVE</span>
                      </div>

                      {/* Hall Content Center Illustration */}
                      <div className="text-center z-10 space-y-1 my-auto">
                        <h6 className="text-base font-black text-white drop-shadow-md">قاعة الأسطورة الملكية (تصوير أفقي عريض)</h6>
                        <p className="text-xs text-emerald-200 font-bold">تعبئة الشاشة بالكامل 100% بدون أي حواف سوداء أو فراغات</p>
                      </div>

                      {/* Bottom Viewfinder UI */}
                      <div className="flex justify-between items-center text-[10px] text-slate-300 z-10">
                        <span>4K / 60 FPS</span>
                        <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center">
                          <div className="w-6 h-6 rounded-full bg-white"></div>
                        </div>
                        <span className="text-emerald-400 font-bold">LEVEL: 0.0° (مستوٍ)</span>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full max-w-sm flex flex-col items-center gap-2">
                      <div className="w-44 aspect-[9/16] bg-slate-950 rounded-xl border-2 border-red-500/80 p-3 relative flex flex-col justify-between shadow-2xl overflow-hidden">
                        <div className="flex justify-between items-center text-[9px] text-white z-10 font-mono">
                          <span className="px-1.5 py-0.5 rounded bg-red-500 text-white font-black">9:16 VERTICAL</span>
                          <span className="text-red-400">ERR</span>
                        </div>

                        <div className="text-center z-10 space-y-1 my-auto">
                          <span className="text-xl">⚠️</span>
                          <p className="text-[10px] text-red-300 font-bold">تصوير رأسي خاطئ</p>
                        </div>

                        <div className="text-[9px] text-red-400 text-center font-bold">حواف سوداء عريضة</div>
                      </div>
                      <p className="text-xs text-red-300 font-bold text-center">
                        ⚠️ التصوير الرأسي يسبب اقتطاع الجدران وتظليل شاشات الكمبيوتر والأجهزة اللوحية بحواف سوداء كبيرة.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Pre-Upload Checklist */}
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="font-extrabold text-white text-sm flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-emerald-400" />
                      قائمة التدقيق لرفع وسائط القاعات والخدمات (16:9)
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      تأكد من تحقيق كافة البنود الـ 5 المعتمدة قبل نشر القاعة للعملاء
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-28 bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${(checkedCount / 5) * 100}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-black text-emerald-400 font-mono">{checkedCount} / 5</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {[
                    'الالتقاط بوضعية أفقية (16:9) بمسك الجوال بالعرض وليس بالطول.',
                    'دقة الصورة لا تقل عن 960x540px ولا تتجاوز 1280x720px (HD).',
                    'حجم الصورة أقل من 500KB وبإحدى الصيغ المعتمدة (JPG, PNG, WebP).',
                    'الفيديو بأبعاد لا تتجاوز 960x540px وحجمه أقصاه 10MB.',
                    'الفيديو بصيغة MP4 حصرياً لضمان التشغيل السلس عبر كافة المتصفحات.'
                  ].map((text, idx) => (
                    <label
                      key={idx}
                      onClick={() => toggleChecklist(idx)}
                      className="flex items-center gap-3 p-3 bg-slate-900 hover:bg-slate-850 rounded-xl border border-slate-800 cursor-pointer transition select-none text-xs text-slate-200"
                    >
                      <input
                        type="checkbox"
                        checked={checklist[idx]}
                        onChange={() => {}}
                        className="w-4 h-4 rounded text-emerald-500 border-slate-700 bg-slate-800 focus:ring-0 cursor-pointer"
                      />
                      <span className={checklist[idx] ? 'line-through text-slate-400' : 'font-medium'}>{text}</span>
                    </label>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 shrink-0 text-xs">
          <div className="text-slate-400 flex items-center gap-2">
            <Info className="w-4 h-4 text-emerald-400" />
            <span>نظام رقابة الوسائط محمي برمجياً لمنع ضبابية العرض والحفاظ على ثراء المحتوى</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-extrabold rounded-xl border border-slate-700 transition cursor-pointer"
          >
            إغلاق الدليل
          </button>
        </div>

      </div>
    </div>
  );
}

/**
 * Compact Trigger Component to embed in Hall/Service forms
 */
export function MediaStandardsGuideTrigger({
  onOpenGuide,
  onOpenInspector
}: {
  onOpenGuide: () => void;
  onOpenInspector: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-2.5 bg-gradient-to-r from-slate-900 via-slate-950 to-slate-900 rounded-2xl border border-emerald-500/30 text-xs my-2">
      <div className="flex items-center gap-2 flex-grow text-slate-200">
        <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400 font-extrabold text-xs">📷 16:9</span>
        <div>
          <span className="font-extrabold text-white block text-[11px]">معايير واشتراطات وسائط القاعات والخدمات:</span>
          <span className="text-[10px] text-slate-400">960x540 إلى 1280x720 | ≤ 500KB صور | أفقية (16:9)</span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onOpenGuide}
          className="px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-[11px] font-extrabold rounded-xl border border-emerald-500/40 transition flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>دليل المعايير</span>
        </button>

        <button
          type="button"
          onClick={onOpenInspector}
          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-extrabold rounded-xl border border-slate-700 transition flex items-center gap-1 cursor-pointer shadow-sm"
        >
          <Cpu className="w-3.5 h-3.5 text-emerald-400" />
          <span>أداة الفحص المباشر</span>
        </button>
      </div>
    </div>
  );
}
