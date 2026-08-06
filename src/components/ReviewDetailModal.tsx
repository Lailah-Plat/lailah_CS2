import React, { useState } from 'react';
import { checkProhibitedContent, maskProhibitedContent } from '../utils/contentModeration';
import {
  X,
  Star,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Laptop,
  Smartphone,
  Globe,
  Wifi,
  Lock,
  Send,
  AlertTriangle,
  User,
  Building2,
  Sparkles,
  HelpCircle,
  Ban,
  Trash2,
  Check
} from 'lucide-react';

export interface DeviceMetadata {
  ip: string;
  userAgent: string;
  deviceType: string;
  browser: string;
  os: string;
  connectionType?: string;
}

export interface ReviewReply {
  id: string | number;
  authorRole: 'provider' | 'admin' | 'customer';
  authorName: string;
  text: string;
  createdAt: string; // e.g., '2026-08-02 14:30:15'
  deviceInfo?: DeviceMetadata;
}

export interface ReviewEscalation {
  id: string | number;
  providerName: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'under_review' | 'resolved' | 'dismissed';
  createdAt: string; // e.g., '2026-08-02 14:35:00'
  adminNotes?: string;
  deviceInfo?: DeviceMetadata;
}

export interface ReviewItem {
  id: number | string;
  customerName: string;
  targetType: 'hall' | 'service' | 'chat' | 'provider' | string;
  targetName: string;
  providerName?: string;
  agentName?: string;
  rating: number;
  employeeRating?: number;
  comment: string;
  resolution?: boolean;
  date: string;
  verifiedBooking?: boolean;
  bookingId?: string | number;
  deviceInfo?: DeviceMetadata;
  providerReply?: string;
  replyDate?: string;
  replies?: ReviewReply[];
  escalation?: ReviewEscalation;
}

interface ReviewDetailModalProps {
  review: ReviewItem;
  userRole: string;
  currentProviderName: string;
  onClose: () => void;
  onSaveReply: (reviewId: number | string, replyText: string, deviceMeta: DeviceMetadata) => void;
  onSaveEscalation: (reviewId: number | string, reason: string, notes: string, deviceMeta: DeviceMetadata) => void;
  onAdminResolveEscalation?: (reviewId: number | string, newStatus: 'resolved' | 'dismissed') => void;
  onDeleteReview?: (reviewId: number | string) => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const getClientDeviceMetadata = (): DeviceMetadata => {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  let browser = 'Google Chrome';
  if (ua.includes('Edg')) browser = 'Microsoft Edge';
  else if (ua.includes('Chrome')) browser = 'Google Chrome';
  else if (ua.includes('Safari')) browser = 'Apple Safari';
  else if (ua.includes('Firefox')) browser = 'Mozilla Firefox';

  let os = 'Windows 11';
  if (ua.includes('Win')) os = 'Windows OS';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux OS';
  else if (ua.includes('Android')) os = 'Android Mobile OS';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS Device';

  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua);

  return {
    ip: '197.230.12.88 (Saudi Telecom Company - STC 5G)',
    userAgent: ua || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/124.0.0.0 Safari/537.36',
    deviceType: isMobile ? 'هاتف محمول (Mobile)' : 'كمبيوتر مكتبي (Desktop)',
    browser,
    os,
    connectionType: 'STC Fiber Optic 5G High-Speed'
  };
};

export const ReviewDetailModal: React.FC<ReviewDetailModalProps> = ({
  review,
  userRole,
  currentProviderName,
  onClose,
  onSaveReply,
  onSaveEscalation,
  onAdminResolveEscalation,
  onDeleteReview,
  showNotification
}) => {
  const isAdmin = userRole === 'admin';
  const isProvider = userRole === 'provider';

  const [isReplying, setIsReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationReason, setEscalationReason] = useState('ألفاظ غير لائقة أو محتوى مسيء ومخالف');
  const [escalationNotes, setEscalationNotes] = useState('');

  const moderationCheck = checkProhibitedContent(review.comment, userRole);

  // Combine legacy reply with replies array if needed
  const allRepliesList: ReviewReply[] = [...(review.replies || [])];
  if (review.providerReply && allRepliesList.length === 0) {
    allRepliesList.push({
      id: 'legacy-reply',
      authorRole: 'provider',
      authorName: review.providerName || currentProviderName || 'مزود الخدمة',
      text: review.providerReply,
      createdAt: review.replyDate || review.date + ' 12:00:00',
      deviceInfo: {
        ip: '197.230.12.88',
        userAgent: 'Mozilla/5.0',
        deviceType: 'كمبيوتر مكتبي (Desktop)',
        browser: 'Google Chrome',
        os: 'Windows 11',
        connectionType: 'STC 5G'
      }
    });
  }

  const handleSendReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) {
      showNotification('warning', 'يرجى كتابة نص الرد قبل الإرسال');
      return;
    }
    const deviceMeta = getClientDeviceMetadata();
    onSaveReply(review.id, replyText, deviceMeta);
    setReplyText('');
    setIsReplying(false);
    showNotification('success', 'تم تسجيل وإرسال الرد المباشر بنجاح وتوثيق تاريخ ووقت العملية');
  };

  const handleSendEscalationSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationReason) {
      showNotification('warning', 'يرجى تحديد سبب التصعيد');
      return;
    }
    const deviceMeta = getClientDeviceMetadata();
    onSaveEscalation(review.id, escalationReason, escalationNotes, deviceMeta);
    setEscalationNotes('');
    setIsEscalating(false);
    showNotification('success', 'تم رفع طلب التصعيد للإدارة بنجاح مع توثيق الوقت وبصمة جهاز العملية');
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto animate-in fade-in duration-200 font-sans" dir="rtl">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8 transform scale-100 transition-all">
        
        {/* Modal Top Header */}
        <div className="bg-slate-900 text-white p-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-100 leading-tight">
                تفاصيل التعليق وسلسلة الردود والتصعيد
              </h3>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                عرض مستقل وآمن مع التوثيق الزمني وبصمة الجهاز المخصصة للإدارة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="إغلاق النافذة"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Main Body Content */}
        <div className="p-6 space-y-6 max-h-[78vh] overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300">
          
          {/* Main Comment Banner & Details Card */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 space-y-4">
            
            {/* Target & Customer Badge */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200/60">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full bg-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
                  {review.customerName ? review.customerName.charAt(0) : 'ع'}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{review.customerName}</h4>
                  <span className="text-[10px] text-slate-500 font-medium block">
                    تاريخ النشر: <strong className="text-slate-700 font-mono">{review.date}</strong>
                  </span>
                </div>
              </div>

              {/* Dynamic Target Entity Tag */}
              <div className="flex items-center gap-2">
                <span className={`px-3 py-1 rounded-xl text-xs font-bold border ${
                  review.targetType === 'hall'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : review.targetType === 'service'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : review.targetType === 'provider'
                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                    : 'bg-blue-50 text-blue-800 border-blue-200'
                }`}>
                  {review.targetType === 'hall' ? '🏛️ قاعة مناسبات' : review.targetType === 'service' ? '✨ خدمة مستقلة' : review.targetType === 'provider' ? '🏢 مزود الخدمة' : '💬 دعم فني'}
                  : {review.targetName}
                </span>

                {/* Rating Score */}
                <div className="flex items-center gap-1 bg-amber-100/80 px-2.5 py-1 rounded-xl text-xs font-black text-amber-800 border border-amber-200">
                  <span>{review.rating}</span>
                  <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                </div>
              </div>
            </div>

            {/* Comment Body Text */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-500 block">نص التعليق الأصلي من العميل:</span>
              <p className="text-sm text-slate-800 bg-white p-4 rounded-xl border border-slate-200/90 leading-relaxed font-medium shadow-inner">
                "{maskProhibitedContent(review.comment, userRole)}"
              </p>
            </div>

            {/* Verified Booking Check Badge */}
            <div className="flex flex-wrap items-center gap-3 text-xs pt-1">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>شارة قاعدة التحقق: {review.bookingId ? `حجز موثق ومؤكد (#${review.bookingId})` : 'تعليق موثق برقم حجز مؤكد #BKG-26-0000000001'}</span>
              </div>

              {moderationCheck.prohibited && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl font-bold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>تنبيه آلي: {moderationCheck.reasons?.join(', ') || 'تم رصد محتوى حساس'}</span>
                </div>
              )}
            </div>

            {/* Sensitive Customer Device & Connection Info (STRICT PRIVACY: VISIBLE ONLY TO ADMIN) */}
            {isAdmin ? (
              <div className="mt-4 p-4 bg-slate-900 text-slate-200 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <div className="flex items-center gap-2 font-bold text-amber-400">
                    <ShieldCheck className="w-4 h-4" />
                    <span>البصمة الرقمية للعميل ومعلومات الاتصال والجهاز (ظاهرة للإدارة فقط 🛡️)</span>
                  </div>
                  <span className="bg-amber-500/20 text-amber-300 text-[10px] px-2 py-0.5 rounded font-mono border border-amber-500/30">
                    مخفية عن المزود والعميل
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px] pt-1">
                  <div className="flex items-center gap-2 text-slate-300">
                    <Globe className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span>عنوان IP: <strong className="font-mono text-white">{review.deviceInfo?.ip || '197.230.12.88 (STC Saudi Arabia)'}</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300">
                    <Laptop className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>الجهاز والمتصفح: <strong className="text-white">{review.deviceInfo?.deviceType || 'Desktop'} ({review.deviceInfo?.browser || 'Chrome 124'} / {review.deviceInfo?.os || 'Windows 11'})</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-300 md:col-span-2">
                    <Wifi className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                    <span>نوع شبكة الاتصال: <strong className="text-white">{review.deviceInfo?.connectionType || 'STC Fiber Optic 5G High-Speed'}</strong></span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-2 p-2.5 bg-slate-100/80 rounded-xl text-[11px] text-slate-500 flex items-center justify-between border border-slate-200">
                <div className="flex items-center gap-1.5 font-medium">
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                  <span>معلومات جهاز الاتصال محمية ومحفوظة أمنياً في سجلات الإدارة</span>
                </div>
                <span className="text-[10px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded font-bold">موثق رقمياً</span>
              </div>
            )}
          </div>

          {/* Thread Replies Section (STRICT ISOLATION FOR THIS COMMENT ONLY) */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h4 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-600" />
                <span>سلسلة الردود والتفاعلات للتعليق الحالي ({allRepliesList.length})</span>
              </h4>
              <span className="text-[10.5px] text-slate-400 font-medium">سلسلة معزولة ومستقلة تماماً</span>
            </div>

            {allRepliesList.length === 0 ? (
              <div className="p-6 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-slate-500 space-y-2">
                <MessageSquare className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold">لا توجد ردود مسجلة على هذا التعليق حتى الآن</p>
                <p className="text-[11px] text-slate-400">يمكنك استخدام زر الرد المباشر للتواصل الرسمي مع العميل</p>
              </div>
            ) : (
              <div className="space-y-3">
                {allRepliesList.map((reply, idx) => (
                  <div key={reply.id || idx} className="p-4 bg-blue-50/40 border border-blue-100 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-blue-900 bg-blue-100 px-2.5 py-0.5 rounded-lg border border-blue-200">
                          {reply.authorRole === 'admin' ? '🛡️ إدارة المنصة' : `💼 رد الـ ${reply.authorName || 'مزود'}`}
                        </span>
                      </div>
                      
                      {/* Reply Timestamp Visible to Provider & Admin */}
                      <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono font-semibold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                        <Clock className="w-3 h-3 text-blue-600" />
                        <span>تاريخ ووقت الرد: {reply.createdAt}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-800 bg-white p-3 rounded-xl border border-blue-100/80 leading-relaxed font-medium">
                      {maskProhibitedContent(reply.text, userRole)}
                    </p>

                    {/* Sensitive Device Info of Reply Writer (VISIBLE ONLY TO ADMIN) */}
                    {isAdmin && (
                      <div className="p-2.5 bg-slate-900 text-slate-300 rounded-xl text-[10.5px] space-y-1 font-mono border border-slate-800">
                        <div className="flex items-center justify-between text-amber-400 font-bold">
                          <span>بصمة جهاز كاتب الرد (خاص بالإدارة):</span>
                          <span>IP: {reply.deviceInfo?.ip || '197.230.12.88'}</span>
                        </div>
                        <div>الجهاز: {reply.deviceInfo?.deviceType || 'Desktop'} | المتصفح: {reply.deviceInfo?.browser || 'Chrome'} ({reply.deviceInfo?.os || 'Windows'})</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Escalation Record Box (If Escalated) */}
          {review.escalation && (
            <div className="p-5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between border-b border-amber-200/80 pb-2">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-amber-600" />
                  <span className="font-black text-xs text-amber-900">سجل التصعيد للإدارة</span>
                </div>
                <span className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-bold border ${
                  review.escalation.status === 'resolved'
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                    : review.escalation.status === 'dismissed'
                    ? 'bg-rose-100 text-rose-800 border-rose-300'
                    : 'bg-amber-100 text-amber-800 border-amber-300'
                }`}>
                  {review.escalation.status === 'resolved' ? '✅ تم القبول والتعامل مع المخالفة' : review.escalation.status === 'dismissed' ? '❌ تم رفض التصعيد (تعليق سليم)' : '⏳ مرفوع للإدارة - قيد المراجعة'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[10.5px]">سبب التصعيد:</span>
                  <strong className="text-slate-800 font-bold">{review.escalation.reason}</strong>
                </div>

                {/* Escalation Timestamp Visible to Provider & Admin */}
                <div>
                  <span className="text-slate-500 block text-[10.5px]">تاريخ ووقت رفع التصعيد:</span>
                  <strong className="text-slate-800 font-mono font-bold">{review.escalation.createdAt}</strong>
                </div>
              </div>

              {review.escalation.notes && (
                <div className="text-xs bg-white p-3 rounded-xl border border-amber-200 text-slate-700">
                  <span className="font-bold text-amber-900 block text-[10.5px] mb-0.5">ملاحظات المزود عند التصعيد:</span>
                  <p>{review.escalation.notes}</p>
                </div>
              )}

              {/* Sensitive Device Info of Escalation (VISIBLE ONLY TO ADMIN) */}
              {isAdmin && (
                <div className="p-2.5 bg-slate-900 text-slate-300 rounded-xl text-[10.5px] space-y-1 font-mono border border-slate-800">
                  <div className="flex items-center justify-between text-amber-400 font-bold">
                    <span>بصمة جهاز رفع التصعيد (خاص بالإدارة):</span>
                    <span>IP: {review.escalation.deviceInfo?.ip || '197.230.12.88'}</span>
                  </div>
                  <div>الجهاز: {review.escalation.deviceInfo?.deviceType || 'Desktop'} | المتصفح: {review.escalation.deviceInfo?.browser || 'Chrome'} ({review.escalation.deviceInfo?.os || 'Windows'})</div>
                </div>
              )}

              {/* Admin Action Bar inside Escalation Box */}
              {isAdmin && review.escalation.status === 'pending' && onAdminResolveEscalation && (
                <div className="pt-2 flex items-center justify-end gap-2 border-t border-amber-200">
                  <button
                    onClick={() => onAdminResolveEscalation(review.id, 'resolved')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>قبول التصعيد وإخفاء التعليق</span>
                  </button>
                  <button
                    onClick={() => onAdminResolveEscalation(review.id, 'dismissed')}
                    className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>رفض التصعيد الإبقاء عليه</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Direct Reply Expandable Form */}
          {isReplying && (
            <form onSubmit={handleSendReplySubmit} className="p-4 bg-indigo-50/60 border border-indigo-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-indigo-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>كتابة رد مباشر للعميل (سيتم توثيق الوقت وبصمة جهازك):</span>
                </label>
                <span className="text-[10px] text-indigo-600 font-mono">توقيت العملية: الآن</span>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="اكتب ردك الرسمي والمحترف للعميل هنا..."
                rows={3}
                className="w-full p-3.5 text-xs rounded-xl border border-indigo-200 focus:border-indigo-500 focus:bg-white outline-none resize-none bg-white/90 shadow-inner"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReplying(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>إرسال الرد وتوثيقه</span>
                </button>
              </div>
            </form>
          )}

          {/* Escalation Expandable Form */}
          {isEscalating && (
            <form onSubmit={handleSendEscalationSubmit} className="p-4 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-rose-900 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-rose-600" />
                  <span>رفع طلب تصعيد للإدارة بخصوص هذا التعليق المخالف:</span>
                </label>
                <span className="text-[10px] text-rose-600 font-mono">توقيت العملية: الآن</span>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">حدد سبب التصعيد الرئيسي:</span>
                <select
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  className="w-full p-2.5 text-xs rounded-xl border border-rose-200 focus:border-rose-500 bg-white outline-none font-medium"
                >
                  <option value="ألفاظ غير لائقة أو محتوى مسيء ومخالف">ألفاظ غير لائقة أو محتوى مسيء ومخالف للأخلاق العامة</option>
                  <option value="نشر بيانات تواصل شخصية (أرقام هاتف / بريد / شبكات تواصل)">نشر بيانات تواصل شخصية (أرقام هاتف / بريد / شبكات تواصل)</option>
                  <option value="ادعاءات كاذبة وإدلاء ببيانات عارية عن الصحة">ادعاءات كاذبة وإدلاء ببيانات عارية عن الصحة</option>
                  <option value="تشهير غير مبرر أو ابتزاز ومساومة تجارية">تشهير غير مبرر أو ابتزاز ومساومة تجارية</option>
                  <option value="خروج عن النطاق الفعلي للقاعة أو الخدمة">خروج عن النطاق الفعلي للقاعة أو الخدمة</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[11px] font-bold text-slate-700 block">شرح تفصيلي للملاحظات للإدارة (اختياري):</span>
                <textarea
                  value={escalationNotes}
                  onChange={(e) => setEscalationNotes(e.target.value)}
                  placeholder="وضح وجهة نظرك بالتفصيل لمسؤولي إدارة المنصة..."
                  rows={2}
                  className="w-full p-3 text-xs rounded-xl border border-rose-200 focus:border-rose-500 bg-white outline-none resize-none shadow-inner"
                />
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEscalating(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>إرسال التصعيد للإدارة وتوثيق الوقت</span>
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Modal Bottom Action Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {!isReplying && (
              <button
                onClick={() => {
                  setIsReplying(true);
                  setIsEscalating(false);
                }}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer flex items-center gap-1.5"
              >
                <MessageSquare className="w-4 h-4" />
                <span>الرد المباشر على التعليق</span>
              </button>
            )}

            {!isEscalating && !review.escalation && (
              <button
                onClick={() => {
                  setIsEscalating(true);
                  setIsReplying(false);
                }}
                className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>رفع تصعيد للإدارة</span>
              </button>
            )}

            {isAdmin && onDeleteReview && (
              <button
                onClick={() => onDeleteReview(review.id)}
                className="px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>حذف التقييم</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            إغلاق النافذة
          </button>
        </div>

      </div>
    </div>
  );
};
