import React, { useState } from 'react';
import {
  Eye, X, Shield, FileText, CheckCircle2, Lock, Users, Sparkles,
  Smartphone, Monitor, HelpCircle, Layers, Sliders
} from 'lucide-react';

export interface LegalLivePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentData?: {
    documentType: string;
    title: string;
    subtitle?: string;
    introText?: string;
    version: string;
    sections: any[];
  };
  faqsData?: any[];
  targetType: 'TERMS_AND_CONDITIONS' | 'PRIVACY_POLICY' | 'ABOUT_US' | 'FAQ';
}

export default function LegalLivePreviewModal({
  isOpen,
  onClose,
  documentData,
  faqsData = [],
  targetType
}: LegalLivePreviewModalProps) {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'mobile'>('desktop');
  const [simulatedRole, setSimulatedRole] = useState<'GUEST' | 'CUSTOMER' | 'PROVIDER_BASIC' | 'PROVIDER_PRO'>('CUSTOMER');

  if (!isOpen) return null;

  // Compute simulated capabilities
  const simulatedCapabilities: string[] = [];
  if (simulatedRole === 'CUSTOMER') {
    simulatedCapabilities.push('booking_policy.instant_confirmation', 'booking_policy.payment_before_approval');
  } else if (simulatedRole === 'PROVIDER_BASIC') {
    simulatedCapabilities.push('booking_policy.approval_before_payment');
  } else if (simulatedRole === 'PROVIDER_PRO') {
    simulatedCapabilities.push(
      'booking_policy.instant_confirmation',
      'booking_policy.authorize_then_capture',
      'booking_policy.custom_deadline',
      'pricing.dynamic_surge',
      'pricing.weekend_differential',
      'venue.addon_store'
    );
  }

  // Filter sections by capability & active status
  const visibleSections = (documentData?.sections || []).filter(sec => {
    if (!sec.isActive) return false;
    if (!sec.requiredCapability) return true;
    return simulatedCapabilities.includes(sec.requiredCapability);
  });

  // Filter FAQs by audience & capability
  const visibleFaqs = faqsData.filter(faq => {
    if (!faq.isActive) return false;
    if (simulatedRole === 'GUEST' && faq.audience !== 'ALL') return false;
    if (simulatedRole === 'CUSTOMER' && !['ALL', 'CUSTOMER'].includes(faq.audience)) return false;
    if ((simulatedRole === 'PROVIDER_BASIC' || simulatedRole === 'PROVIDER_PRO') && !['ALL', 'PROVIDER'].includes(faq.audience)) return false;
    if (faq.requiredCapability && !simulatedCapabilities.includes(faq.requiredCapability)) return false;
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4" dir="rtl">
      <div className="bg-slate-100 rounded-3xl w-full max-w-5xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Control Bar */}
        <div className="bg-white p-4 border-b border-slate-200 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <span>معاينة حية للمحتوى (Live Experience Simulator)</span>
                <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  {documentData?.version ? `v${documentData.version}` : 'تفاعلي'}
                </span>
              </h5>
              <p className="text-[11px] text-slate-500">
                اختبر ظهور البنود والأسئلة المشروطة بالقدرات بحسب شخصية المستخدم المستعرض.
              </p>
            </div>
          </div>

          {/* Simulation Controls */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Role Simulation Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <span className="text-[10px] font-bold text-slate-500 px-1.5">معاينة كـ:</span>
              {[
                { id: 'GUEST', label: 'زائر عام' },
                { id: 'CUSTOMER', label: 'عميل مسجل' },
                { id: 'PROVIDER_BASIC', label: 'مزود (أساسي)' },
                { id: 'PROVIDER_PRO', label: 'مزود (احترافي)' }
              ].map(role => (
                <button
                  key={role.id}
                  onClick={() => setSimulatedRole(role.id as any)}
                  className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                    simulatedRole === role.id ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {/* Device Mode Selector */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                onClick={() => setDeviceMode('desktop')}
                className={`p-1.5 rounded-lg transition ${
                  deviceMode === 'desktop' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
                title="عرض الكمبيوتر"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setDeviceMode('mobile')}
                className={`p-1.5 rounded-lg transition ${
                  deviceMode === 'mobile' ? 'bg-white text-slate-800 shadow-xs' : 'text-slate-500'
                }`}
                title="عرض الجوال"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-800 flex items-center justify-center transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Simulation Viewport */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center bg-slate-200/50">
          <div
            className={`bg-white rounded-3xl shadow-lg border border-slate-200 transition-all duration-300 p-6 sm:p-8 space-y-6 ${
              deviceMode === 'mobile' ? 'w-full max-w-sm min-h-[600px]' : 'w-full max-w-3xl'
            }`}
          >
            {/* Header Banner in Platform style */}
            <div className="text-center space-y-2 border-b border-slate-100 pb-6">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200 mb-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>منصة ليلة للمناسبات والاحتفالات</span>
              </div>

              <h1 className="text-xl sm:text-2xl font-black text-slate-900">
                {targetType === 'FAQ' ? 'الأسئلة الشائعة ومركز المساعدة' : (documentData?.title || 'وثيقة الشروط والسياسات')}
              </h1>

              {documentData?.subtitle && (
                <p className="text-xs sm:text-sm font-bold text-slate-600">
                  {documentData.subtitle}
                </p>
              )}

              {documentData?.introText && (
                <p className="text-xs text-slate-500 max-w-xl mx-auto leading-relaxed pt-2">
                  {documentData.introText}
                </p>
              )}
            </div>

            {/* Document Sections View */}
            {targetType !== 'FAQ' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-bold text-slate-500">
                  <span>الأقسام الظاهرة لهذه الرتبة: ({visibleSections.length} من أصل {documentData?.sections?.length || 0})</span>
                  <span className="text-amber-600">الإصدار v{documentData?.version || '1.0'}</span>
                </div>

                <div className="space-y-4">
                  {visibleSections.map((sec, idx) => (
                    <div
                      key={sec.id || idx}
                      className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-xs hover:border-amber-300 transition space-y-2"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-amber-100 text-amber-800 text-xs font-black flex items-center justify-center">
                          {idx + 1}
                        </span>
                        <h3 className="text-sm font-black text-slate-900">{sec.title}</h3>
                        {sec.requiredCapability && (
                          <span className="text-[10px] font-mono bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200 mr-auto">
                            قدرة: {sec.requiredCapability}
                          </span>
                        )}
                      </div>

                      <div
                        className="text-xs text-slate-600 leading-relaxed prose prose-amber max-w-none pt-1"
                        dangerouslySetInnerHTML={{ __html: sec.content }}
                      />
                    </div>
                  ))}

                  {visibleSections.length === 0 && (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl text-xs text-slate-400">
                      لا توجد بنود موجهة لهذه الرتبة بموجب شروط القدرات الحالية.
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* FAQs View */}
            {targetType === 'FAQ' && (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-500">
                  الأسئلة المطابقة لهذه الرتبة: ({visibleFaqs.length} سؤال)
                </div>

                <div className="space-y-3">
                  {visibleFaqs.map((faq, idx) => (
                    <div
                      key={faq.id || idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2"
                    >
                      <h4 className="text-xs font-black text-slate-900 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-500" />
                        <span>{faq.question}</span>
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed pr-6">
                        {faq.answer}
                      </p>
                    </div>
                  ))}

                  {visibleFaqs.length === 0 && (
                    <div className="text-center p-8 bg-slate-50 rounded-2xl text-xs text-slate-400">
                      لا توجد أسئلة شائعة مطابقة لهذه الرتبة.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-white border-t border-slate-200 p-4 flex justify-between items-center">
          <div className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>المعاينة تطابق الواجهة النهائية للعملاء والشركاء بشكل مباشر</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
          >
            إغلاق المعاينة
          </button>
        </div>
      </div>
    </div>
  );
}
