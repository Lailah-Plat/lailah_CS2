import React from 'react';
import { Loader2 } from 'lucide-react';

interface PageLoadingFallbackProps {
  message?: string;
}

export const PageLoadingFallback: React.FC<PageLoadingFallbackProps> = ({
  message = 'جاري تحميل الصفحة...'
}) => {
  return (
    <div 
      className="min-h-[70vh] w-full flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-200" 
      dir="rtl"
    >
      <div className="relative mb-4 flex items-center justify-center">
        {/* Ambient Ring */}
        <div className="w-16 h-16 rounded-full border-4 border-slate-100 border-t-indigo-600 animate-spin" />
        {/* Center Accent Icon */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Loader2 className="w-6 h-6 text-indigo-600 animate-spin" />
        </div>
      </div>
      
      <h3 className="text-base font-bold text-slate-800 mb-1 font-sans tracking-tight">
        {message}
      </h3>
      <p className="text-xs text-slate-400 font-medium">
        منصة ليلة | إدارة وحجوزات الفعاليات والمناسبات
      </p>
    </div>
  );
};

export default PageLoadingFallback;
