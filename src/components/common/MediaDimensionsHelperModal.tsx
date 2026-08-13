import React from 'react';
import { 
  X, Image as ImageIcon, Video, Smartphone, CheckCircle2, 
  AlertTriangle, ArrowLeftRight, Monitor, Sparkles, HelpCircle, FileText
} from 'lucide-react';
import { VideoStandards169Player } from './VideoStandards169Player';

interface MediaDimensionsHelperModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaType?: 'image' | 'video' | 'both';
}

export const MediaDimensionsHelperModal: React.FC<MediaDimensionsHelperModalProps> = ({
  isOpen,
  onClose,
  mediaType = 'both'
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200">
      <div 
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl text-right relative space-y-6 my-8 font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-150 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <span>دليل وإرشادات تصوير ورفع الوسائط للمنصة</span>
                <span className="text-[10px] bg-amber-500/10 text-amber-600 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-500/20">
                  معيار 16:9 📱
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                دليل توعوي لضمان ظهور القاعات والخدمات بأعلى جودة وسرعة تصفح فائقة عبر شبكات الجوال
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Video Showcase Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-emerald-500" />
              <span>المقطع التوضيحي المعتمد (16:9 Landscape Video)</span>
            </h4>
            <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
              00:09 Sec
            </span>
          </div>
          <VideoStandards169Player autoPlay={false} showTitle={false} />
        </div>

        {/* Core Educational Guide: Horizontal vs Vertical Capture */}
        <div className="bg-gradient-to-br from-amber-500/5 via-indigo-500/5 to-emerald-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>القاعدة الذهبية: التصوير بالجوال أفقياً (Landscape) وليس رأسياً (Portrait)</span>
            </span>
            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 rounded-full">
              توجيه هام للمزودين
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Correct: Horizontal / Landscape */}
            <div className="bg-emerald-50/80 dark:bg-emerald-950/30 border-2 border-emerald-500/40 rounded-xl p-4 space-y-2 text-right relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>التصوير الأفقـي (صح ✔️)</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-emerald-700 bg-emerald-100 dark:bg-emerald-900 px-2 py-0.5 rounded">
                  16:9 Landscape
                </span>
              </div>
              <div className="w-full h-24 bg-emerald-100/60 dark:bg-emerald-900/40 rounded-lg border border-emerald-300/50 flex flex-col items-center justify-center relative">
                <div className="w-16 h-10 border-2 border-emerald-600 rounded flex items-center justify-center bg-white/80 shadow-sm">
                  <ArrowLeftRight className="w-4 h-4 text-emerald-700" />
                </div>
                <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 mt-1">
                  امسك الجوال بالعرض
                </span>
              </div>
              <p className="text-[10px] text-emerald-900 dark:text-emerald-200 leading-relaxed font-medium">
                يغطي عرض كروت القاعات والخدمات بالكامل على متصفحات الجوال والكمبيوتر بدون حواف سوداء وبأبهى حلة.
              </p>
            </div>

            {/* Wrong: Vertical / Portrait */}
            <div className="bg-rose-50/80 dark:bg-rose-950/30 border-2 border-rose-300/40 rounded-xl p-4 space-y-2 text-right relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-rose-800 dark:text-rose-300 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>التصوير الرأسـي (مرفوض ❌)</span>
                </span>
                <span className="text-[9px] font-mono font-bold text-rose-700 bg-rose-100 dark:bg-rose-900 px-2 py-0.5 rounded">
                  9:16 Portrait
                </span>
              </div>
              <div className="w-full h-24 bg-rose-100/60 dark:bg-rose-900/40 rounded-lg border border-rose-300/50 flex flex-col items-center justify-center relative">
                <div className="w-8 h-14 border-2 border-rose-500 rounded flex items-center justify-center bg-white/80 shadow-sm">
                  <Smartphone className="w-4 h-4 text-rose-700" />
                </div>
                <span className="text-[9px] font-bold text-rose-800 dark:text-rose-300 mt-1">
                  الجوال بالطول يترك فراغات
                </span>
              </div>
              <p className="text-[10px] text-rose-900 dark:text-rose-200 leading-relaxed font-medium">
                يتسبب بظهور حواف سوداء جانبية ويكون المشهد مجتزءاً وغير مريح لبصر العميل أثناء اختيار القاعة.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Requirements Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Image Specs */}
          {(mediaType === 'image' || mediaType === 'both') && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <ImageIcon className="w-4 h-4 text-amber-500" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">شروط واشتراطات الصور 🖼️</h4>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>الصيغ المدعومة:</strong> JPEG, JPG, PNG, WebP</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>الحجم الأقصى للصورة:</strong> 500KB (كيلوبايت) لحماية سرعة التصفح</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>النسبة المفضلة:</strong> 16:9 (عريضة)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>الأبعاد الدنيا:</strong> 960 × 540 بكسل</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  <span><strong>الأبعاد القصوى:</strong> 1280 × 720 بكسل (QHD)</span>
                </li>
              </ul>
            </div>
          )}

          {/* Video Specs */}
          {(mediaType === 'video' || mediaType === 'both') && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700 pb-2">
                <Video className="w-4 h-4 text-indigo-500" />
                <h4 className="text-xs font-black text-slate-900 dark:text-white">شروط واشتراطات الفيديو 🎥</h4>
              </div>
              <ul className="space-y-2 text-[11px] text-slate-600 dark:text-slate-300">
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>الصيغة المعتمدة:</strong> MP4 قياسي لضمان التوافق</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>الحجم الأقصى للفيديو:</strong> 10MB (ميجابايت)</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>الدقة والأبعاد:</strong> 960 × 540 بكسل أفقياً</span>
                </li>
                <li className="flex items-start gap-1.5">
                  <span className="text-indigo-500 font-bold">•</span>
                  <span><strong>مدة المقطع المقترحة:</strong> من 15 إلى 45 ثانية لمشهد بانورامي سريع</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        {/* Compression Tip */}
        <div className="bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 p-3.5 rounded-xl text-[11px] text-amber-900 dark:text-amber-200 flex items-center gap-3">
          <HelpCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <p className="leading-relaxed">
            <strong>نصيحة تقليل الحجم:</strong> إذا تجاوزت الصورة 500KB، يمكنك ضغطها بسهولة عبر تطبيق محرر الصور في جوالك أو عبر أدوات الضغط المجانية مثل TinyPNG قبل رفعها.
          </p>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-bold text-xs px-6 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            فهمت الإرشادات والمتابعة
          </button>
        </div>
      </div>
    </div>
  );
};
