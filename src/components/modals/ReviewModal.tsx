import React, { useState, useEffect, useMemo } from 'react';
import { Star, X, CheckCircle, ShieldAlert, Sparkles, Building2, Store, Award } from 'lucide-react';
import { isProviderNameVisible, getDisplayedProviderName } from '../../data/mockData';

export interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType?: 'hall' | 'service' | 'provider';
  allowedTargetTypes?: ('hall' | 'service' | 'provider')[];
  targetId?: number | string;
  targetName?: string;
  providerName?: string;
  onSubmitReview: (reviewData: {
    targetType: 'hall' | 'service' | 'provider';
    targetId: number | string;
    targetName: string;
    providerName?: string;
    customerName?: string;
    rating: number;
    comment: string;
  }) => Promise<boolean> | boolean;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  targetType: initialTargetType = 'hall',
  allowedTargetTypes,
  targetId: initialTargetId = '',
  targetName: initialTargetName = '',
  providerName: initialProviderName = '',
  onSubmitReview
}) => {
  const isProviderVisible = useMemo(() => {
    if (!initialProviderName) return false;
    return isProviderNameVisible(initialProviderName);
  }, [initialProviderName]);

  const displayedProviderName = useMemo(() => {
    if (!initialProviderName) return '';
    return isProviderVisible ? initialProviderName : getDisplayedProviderName(initialProviderName);
  }, [initialProviderName, isProviderVisible]);

  // Determine effective allowed target types so halls don't show services & services don't show halls
  const effectiveAllowedTypes = useMemo(() => {
    let baseTypes: ('hall' | 'service' | 'provider')[];
    if (allowedTargetTypes && allowedTargetTypes.length > 0) {
      baseTypes = allowedTargetTypes;
    } else {
      if (initialTargetType === 'hall') {
        baseTypes = ['hall', 'provider'];
      } else if (initialTargetType === 'service') {
        baseTypes = ['service', 'provider'];
      } else {
        baseTypes = ['provider'];
      }
    }

    // If provider name is hidden by provider settings, exclude provider evaluation or mask it
    if (!isProviderVisible) {
      baseTypes = baseTypes.filter(t => t !== 'provider');
    }

    // Ensure at least initialTargetType or first baseType exists
    if (baseTypes.length === 0) {
      baseTypes = [initialTargetType === 'provider' ? 'hall' : initialTargetType];
    }

    return baseTypes;
  }, [allowedTargetTypes, initialTargetType, isProviderVisible]);

  const [selectedTargetType, setSelectedTargetType] = useState<'hall' | 'service' | 'provider'>(initialTargetType);
  const [rating, setRating] = useState<number>(5);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [customerName, setCustomerName] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      const defaultType = effectiveAllowedTypes.includes(initialTargetType) 
        ? initialTargetType 
        : effectiveAllowedTypes[0];
      setSelectedTargetType(defaultType);
      setRating(5);
      setComment('');
      setIsSubmitting(false);
    }
  }, [isOpen, initialTargetType, effectiveAllowedTypes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;

    setIsSubmitting(true);
    const success = await onSubmitReview({
      targetType: selectedTargetType,
      targetId: initialTargetId || `target-${Date.now()}`,
      targetName: initialTargetName || (selectedTargetType === 'provider' ? (displayedProviderName || 'مزود الخدمة') : 'الخدمة المختارة'),
      providerName: initialProviderName,
      customerName: customerName.trim() || undefined,
      rating,
      comment
    });

    setIsSubmitting(false);
    if (success) {
      onClose();
    }
  };

  const getRatingLabel = (r: number) => {
    switch (r) {
      case 5: return 'ممتاز جداً 🌟🌟🌟🌟🌟';
      case 4: return 'جيد جداً ⭐⭐⭐⭐';
      case 3: return 'جيد ⭐⭐⭐';
      case 2: return 'مقبول ⭐⭐';
      case 1: return 'ضعيف ⭐';
      default: return '';
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200" dir="rtl">
      <div className="bg-white rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Header decoration */}
        <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-amber-400 via-indigo-500 to-emerald-400"></div>

        <button 
          onClick={onClose}
          className="absolute top-5 left-5 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">تقييم ومشاركة التجربة</h3>
            <p className="text-xs text-slate-500 mt-0.5">رأيك يساهم في رفع جودة الخدمات ومساعدة العملاء الآخرين</p>
          </div>
        </div>

        {/* Target Type Selector - Only display options allowed in current context */}
        {effectiveAllowedTypes.length > 1 && (
          <div className="mb-5 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <label className="block text-[11px] font-bold text-slate-500 mb-1.5 px-1">اختر مجال التقييم:</label>
            <div className={`grid grid-cols-${effectiveAllowedTypes.length} gap-2`}>
              {effectiveAllowedTypes.includes('hall') && (
                <button
                  type="button"
                  onClick={() => setSelectedTargetType('hall')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    selectedTargetType === 'hall' 
                      ? 'bg-amber-500 text-slate-900 shadow-md font-extrabold' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Building2 className="w-4 h-4" />
                  <span>تقييم القاعة</span>
                </button>
              )}

              {effectiveAllowedTypes.includes('service') && (
                <button
                  type="button"
                  onClick={() => setSelectedTargetType('service')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    selectedTargetType === 'service' 
                      ? 'bg-emerald-600 text-white shadow-md font-extrabold' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Store className="w-4 h-4" />
                  <span>خدمة مستقلة</span>
                </button>
              )}

              {effectiveAllowedTypes.includes('provider') && (
                <button
                  type="button"
                  onClick={() => setSelectedTargetType('provider')}
                  className={`p-2.5 rounded-xl text-xs font-bold transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    selectedTargetType === 'provider' 
                      ? 'bg-purple-600 text-white shadow-md font-extrabold' 
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }`}
                >
                  <Award className="w-4 h-4" />
                  <span>تقييم المزود</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info card */}
        {(initialTargetName || displayedProviderName) && (
          <div className="mb-5 p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-500 block text-[10px]">الموضوع التقييمي الحالي:</span>
              <span className="font-extrabold text-indigo-950 text-sm">
                {selectedTargetType === 'provider' 
                  ? (displayedProviderName || initialTargetName) 
                  : (initialTargetName || displayedProviderName)}
              </span>
            </div>
            {displayedProviderName && isProviderVisible && selectedTargetType !== 'provider' && (
              <span className="text-[10px] bg-white/80 px-2 py-1 rounded-lg text-slate-600 font-bold border border-indigo-100">
                المزود: {displayedProviderName}
              </span>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Star Rating picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-2">تقييمك بالنجوم:</label>
            <div className="flex items-center justify-center gap-2 bg-slate-50 py-3 rounded-2xl border border-slate-200/80">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="p-1 transition-transform hover:scale-125 focus:outline-none cursor-pointer"
                >
                  <Star 
                    className={`w-8 h-8 transition-colors ${
                      star <= (hoverRating || rating) 
                        ? 'fill-amber-400 text-amber-400 drop-shadow-sm' 
                        : 'fill-slate-200 text-slate-200'
                    }`} 
                  />
                </button>
              ))}
            </div>
            <p className="text-center text-xs font-bold text-amber-600 mt-2">
              {getRatingLabel(hoverRating || rating)}
            </p>
          </div>

          {/* Customer Name Optional */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اسمك (اختياري):</label>
            <input
              type="text"
              placeholder="مثال: عبدالمجيد العتيبي"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Comment */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">ملاحظاتك وانطباعك المباشر:</label>
            <textarea
              required
              rows={3}
              placeholder="اكتب انطباعك التجريبي بوضوح... (يُمنع كتابة أرقام الهواتف أو البريد الإلكتروني للحفاظ على خصوصية التقييم)"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>يتم فحص التقييمات آلياً للتأكد من خلوها من بيانات التواصل والمحتوى غير اللائق قبل النشر النهائي.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl text-xs transition-colors cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !comment.trim()}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-900 font-extrabold rounded-2xl text-xs transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSubmitting ? 'جاري الإرسال...' : 'إرسال التقييم الآن'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
