import React from 'react';
import { Lock, Sparkles } from 'lucide-react';

interface LockScreenProps {
  featureName: string;
  onUpgradeClick: () => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({ featureName, onUpgradeClick }) => {
  return (
    <div id="lock_screen_container" className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-white rounded-3xl border border-slate-100 shadow-sm animate-in fade-in duration-500">
      <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mb-6 border border-amber-500/20">
        <Lock className="w-8 h-8 text-amber-500 animate-bounce" />
      </div>
      <h3 className="text-xl font-extrabold text-slate-800 mb-2">هذه الميزة غير مفعلة في باقتك الحالية</h3>
      <p className="text-slate-500 text-sm max-w-md mb-6 leading-relaxed">
        إن ميزة {featureName} تدرج ضمن الميزات المتقدمة وتتطلب الترقية للباقة الأعلى 
        (باقة الأعمال أو الباقة الاحترافية) أو الاشتراك فيها كميزة إضافية مفردة.
      </p>
      <button
        id="lock_screen_upgrade_btn"
        onClick={onUpgradeClick}
        className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-6 py-3 rounded-2xl flex items-center gap-2 shadow-lg shadow-amber-500/30 transition-all hover:scale-105"
      >
        <Sparkles className="w-5 h-5 text-slate-900" />
        ترقية الباقة أو تفعيل المحتوى الآن
      </button>
    </div>
  );
};
