import React from 'react';
import { ShieldCheck, Star, CheckCircle2, Headset, Lock } from 'lucide-react';

export const HomeTrustGuaranteesBar: React.FC = () => {
  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 mb-8">
      <div className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 divide-y lg:divide-y-0 lg:divide-x lg:divide-x-reverse divide-slate-100">
          
          {/* Feature 1: مزودون معتمدون */}
          <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
              <ShieldCheck className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-base font-black text-blue-950 mb-1">مزودون معتمدون</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">جميع القاعات والمزودين معتمدون من منصة ليلة</p>
          </div>

          {/* Feature 2: جودة مضمونة */}
          <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
              <Star className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-base font-black text-blue-950 mb-1">جودة مضمونة</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">معايير جودة عالية وتجارب ممتازة لضيوفك</p>
          </div>

          {/* Feature 3: أسعار شفافة */}
          <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
              <CheckCircle2 className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-base font-black text-blue-950 mb-1">أسعار شفافة</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">أسعار واضحة شاملة الضريبة (15%)</p>
          </div>

          {/* Feature 4: دعم على مدار الساعة */}
          <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
              <Headset className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-base font-black text-blue-950 mb-1">دعم على مدار الساعة</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">فريق دعم جاهز لمساعدتك 24/7</p>
          </div>

          {/* Feature 5: حجز آمن وسريع */}
          <div className="flex flex-col items-center text-center px-3 pt-4 lg:pt-0">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center mb-3 shadow-xs">
              <Lock className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-base font-black text-blue-950 mb-1">حجز آمن وسريع</h4>
            <p className="text-xs text-slate-500 leading-relaxed font-medium">حجز فوري وآمن في خطوات بسيطة</p>
          </div>

        </div>
      </div>
    </div>
  );
};
