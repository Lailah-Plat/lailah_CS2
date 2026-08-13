import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  XCircle, 
  Film, 
  Sparkles, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Smartphone,
  ShieldCheck,
  Crown
} from 'lucide-react';

interface VideoStandards169PlayerProps {
  autoPlay?: boolean;
  className?: string;
  showTitle?: boolean;
}

export const VideoStandards169Player: React.FC<VideoStandards169PlayerProps> = ({
  autoPlay = true,
  className = '',
  showTitle = true
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(autoPlay);
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [progress, setProgress] = useState<number>(0);
  const [useHtml5Video, setUseHtml5Video] = useState<boolean>(true);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Simulation timer for fallback canvas/animation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !useHtml5Video) {
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + 1.5;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, useHtml5Video]);

  const handleVideoTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const currentProgress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setProgress(currentProgress);
    }
  };

  const handleVideoEnded = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    } else {
      setProgress(0);
    }
  };

  const togglePlay = () => {
    if (videoRef.current && useHtml5Video) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(() => {
          // If video file fails, switch to interactive simulated animation
          setUseHtml5Video(false);
        });
      }
    }
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
    setIsMuted(!isMuted);
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play();
    }
    setProgress(0);
    setIsPlaying(true);
  };

  // Determine current phase from progress (0-20% is Vertical Refused, 20-100% is Horizontal Approved)
  const isVerticalPhase = progress < 20;

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl ${className}`} dir="rtl">
      {/* Title Header */}
      {showTitle && (
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-extrabold text-white flex items-center gap-2">
                <span>الفيديو التوضيحي المعتمد لالتقاط الوسائط (16:9)</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-mono px-2 py-0.5 rounded-full border border-emerald-500/30">
                  APPROVED 16:9
                </span>
              </h4>
              <p className="text-[11px] text-slate-400">
                مشهد إرشادي يبين التعديل الفوري من الوضع العمودي المرفوض ❌ إلى الوضع الأفقي المعتمد ✅
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border flex items-center gap-1 ${
              isVerticalPhase 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' 
                : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 animate-pulse'
            }`}>
              {isVerticalPhase ? (
                <>
                  <XCircle className="w-3.5 h-3.5 text-rose-400" />
                  <span>00:01 - وضعية عمودية (مرفوض ❌)</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>00:04 - APPROVED 16:9 LANDSCAPE ✅</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Main Video Viewport */}
      <div className="relative w-full aspect-video bg-slate-950 flex items-center justify-center overflow-hidden group">
        
        {/* HTML5 Video Element (Attempts to load uploaded video file) */}
        <video
          ref={videoRef}
          src="/videos/media_guide_16_9.mp4"
          className={`w-full h-full object-contain ${useHtml5Video ? 'block' : 'hidden'}`}
          autoPlay={autoPlay}
          muted={isMuted}
          playsInline
          onTimeUpdate={handleVideoTimeUpdate}
          onEnded={handleVideoEnded}
          onError={() => {
            // Gracefully fallback to interactive visual player if MP4 file is not present
            setUseHtml5Video(false);
          }}
        />

        {/* Interactive Visual Animated Simulator (Fallback & High-Fidelity Representation) */}
        {!useHtml5Video && (
          <div className="relative w-full h-full bg-slate-900 flex items-center justify-center p-4 overflow-hidden select-none">
            {/* Background Studio Grid & Ambient Lighting */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.12)_0%,transparent_70%)] pointer-events-none"></div>
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:2rem_2rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>

            {/* Simulated Phone Frame with Smooth Rotation Transition */}
            <div 
              className={`relative transition-all duration-700 transform flex items-center justify-center ${
                isVerticalPhase 
                  ? 'w-40 h-64 rotate-0 scale-90' 
                  : 'w-[85%] max-w-xl aspect-video rotate-0 scale-100'
              }`}
            >
              {/* Phone Body Container */}
              <div className={`w-full h-full bg-slate-950 rounded-2xl p-2.5 border-4 transition-all duration-500 shadow-2xl relative flex flex-col justify-between overflow-hidden ${
                isVerticalPhase ? 'border-rose-500/80 shadow-rose-950/50' : 'border-emerald-500/80 shadow-emerald-950/50'
              }`}>
                
                {/* Screen Display Content */}
                <div className="relative w-full h-full rounded-xl overflow-hidden bg-slate-900 flex flex-col justify-between p-3">
                  
                  {/* Wedding Hall Background Image */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                    style={{ 
                      backgroundImage: `url('https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80')`,
                      filter: isVerticalPhase ? 'brightness(0.6) blur(1px)' : 'brightness(0.95)'
                    }}
                  ></div>

                  {/* Overlays according to video phase */}
                  {isVerticalPhase ? (
                    // PHASE 1: Vertical Disapproved State
                    <div className="relative z-10 w-full h-full flex flex-col items-center justify-center space-y-2 bg-slate-950/60 backdrop-blur-xs p-2 animate-pulse">
                      <div className="w-14 h-14 rounded-full bg-rose-500/20 border-2 border-rose-500 text-rose-500 flex items-center justify-center shadow-lg shadow-rose-900/50 animate-bounce">
                        <XCircle className="w-10 h-10 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-black text-rose-400 bg-slate-950/90 px-3 py-1 rounded-full border border-rose-500/40">
                        وضع رأسـي مرفوض ❌
                      </span>
                    </div>
                  ) : (
                    // PHASE 2: Horizontal Approved 16:9 State
                    <div className="relative z-10 w-full h-full flex flex-col justify-between p-2">
                      {/* Top Overlay Bar */}
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-lg border border-slate-700 text-slate-200 font-mono font-bold flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5 text-amber-400" />
                          <span>قاعة الاحتفالات الكبرى</span>
                        </span>
                        <span className="bg-emerald-500/20 backdrop-blur-md text-emerald-300 px-2 py-0.5 rounded-md border border-emerald-500/40 font-mono font-bold">
                          REC ● 16:9 HD
                        </span>
                      </div>

                      {/* Center Glowing Approval Badge (Matching uploaded video frame 00:04) */}
                      <div className="self-center bg-slate-950/85 backdrop-blur-md border-2 border-emerald-400 rounded-2xl px-5 py-3 flex items-center gap-3 shadow-2xl shadow-emerald-500/30 animate-in zoom-in duration-300">
                        <div className="w-10 h-10 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-lg font-black text-xl">
                          ✓
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-400 tracking-wider">
                            APPROVED
                          </div>
                          <div className="text-[11px] font-extrabold text-white">
                            16:9 LANDSCAPE
                          </div>
                        </div>
                      </div>

                      {/* Bottom Overlay Bar */}
                      <div className="flex justify-between items-center text-[10px] text-slate-300 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-lg border border-slate-800">
                        <span className="text-emerald-400 font-bold flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          تغطية أفقية شاملة 100%
                        </span>
                        <span className="font-mono text-slate-400">1280x720 (16:9)</span>
                      </div>
                    </div>
                  )}

                  {/* Corner Camera Notch & Lens Details */}
                  <div className="absolute top-1.5 left-1/2 -translate-x-1/2 w-12 h-2.5 bg-slate-950 rounded-full border border-slate-800 z-20"></div>
                </div>

              </div>
            </div>

            {/* Instruction Overlay Pill */}
            <div className="absolute bottom-3 right-3 bg-slate-950/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-800 text-[11px] text-slate-300 flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>قم بلف الجوال أفقياً عند تصوير القاعات للحصول على وسم الاعتماد 16:9</span>
            </div>
          </div>
        )}

        {/* Video Player Controls Bar */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity z-30">
          
          {/* Timeline Progress Bar */}
          <div className="relative w-full h-1.5 bg-slate-800 rounded-full overflow-hidden cursor-pointer">
            <div 
              className="absolute top-0 bottom-0 right-0 bg-gradient-to-l from-emerald-400 to-amber-400 transition-all duration-100"
              style={{ width: `${progress}%` }}
            ></div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={togglePlay}
                className="w-8 h-8 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center font-bold transition shadow cursor-pointer"
                title={isPlaying ? 'إيقاف مؤقت' : 'تشغيل'}
              >
                {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current mr-0.5" />}
              </button>

              <button
                type="button"
                onClick={handleRestart}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title="إعادة التشغيل من البداية"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={toggleMute}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
                title={isMuted ? 'تشغيل الصوت' : 'كتم الصوت'}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>

              <span className="text-[11px] font-mono text-slate-400 mr-2">
                00:0{Math.floor((progress / 100) * 9)} / 00:09
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                {useHtml5Video ? 'فيديو مباشر MP4' : 'محاكي بصري تفاعلي'}
              </span>
            </div>
          </div>

        </div>

      </div>

      {/* Video Feature Highlights Footer */}
      <div className="p-4 bg-slate-900 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
          <XCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-rose-300 text-[11px] font-extrabold">الوضع العمودي ❌:</strong>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              تظهر الصورة ضيقة جداً وتحدث حواف سوداء عريضة على أجهزة الكمبيوتر والتطبيقات.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2.5 p-2.5 bg-slate-950 rounded-xl border border-slate-800">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <strong className="block text-emerald-300 text-[11px] font-extrabold">الوضع الأفقي (16:9) ✅:</strong>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              تغطية كاملة بعرض الشاشة، إبراز الكوشة والديكورات بشعار <span className="text-emerald-400 font-bold">APPROVED 16:9 LANDSCAPE</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
