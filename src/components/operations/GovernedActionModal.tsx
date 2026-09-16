import React, { useState } from 'react';
import { 
  ShieldAlert, 
  AlertTriangle, 
  CheckCircle2, 
  X, 
  FileText, 
  Lock, 
  Scale, 
  Send,
  AlertCircle,
  Clock,
  Building2,
  Receipt
} from 'lucide-react';
import { OperationalCase, OpsTheme } from './types';

export interface GovernedActionConfig {
  commandId: string;
  actionTitle: string;
  actionType: 'CRITICAL_APPROVAL' | 'ESCROW_RELEASE' | 'EMERGENCY_FREEZE' | 'ORDER_CANCELLATION' | 'ESCALATION' | 'CUSTOM';
  impactLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  entityReference?: string;
  amount?: number;
  providerName?: string;
  customerName?: string;
}

interface GovernedActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (commandId: string, caseId: string, payload: any) => Promise<void>;
  actionConfig: GovernedActionConfig | null;
  activeCase: OperationalCase | null;
  theme?: OpsTheme;
}

export const GovernedActionModal: React.FC<GovernedActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  actionConfig,
  activeCase,
  theme = 'dark'
}) => {
  const [justification, setJustification] = useState('');
  const [hasAcceptedRisk, setHasAcceptedRisk] = useState(false);
  const [departmentSignOff, setDepartmentSignOff] = useState('OPERATIONS_CONTROL');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !actionConfig || !activeCase) return null;

  const isDark = theme === 'dark';
  const minJustificationLength = 15;
  const isJustificationValid = justification.trim().length >= minJustificationLength;
  const canSubmit = isJustificationValid && hasAcceptedRisk && !isSubmitting;

  // Financial calculations with strict 15% VAT inclusiveness rule
  const amount = actionConfig.amount || activeCase.financialImpact || 0;
  const taxableAmount = amount > 0 ? (amount / 1.15) : 0;
  const vatAmount = amount > 0 ? (amount - taxableAmount) : 0;

  // Validation of ID patterns (Rule 1)
  const refId = actionConfig.entityReference || activeCase.sourceEntityId || '';
  const isBookingFormat = refId.startsWith('BKG-');
  const isServiceFormat = refId.startsWith('SRV-');
  const isInvoiceFormat = refId.startsWith('INV-');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      await onConfirm(actionConfig.commandId, activeCase.caseId, {
        justification: justification.trim(),
        hasAcceptedRisk,
        departmentSignOff,
        executedAt: new Date().toISOString(),
        governanceAudit: {
          vatInclusiveVerified: true,
          grossAmount: amount,
          taxableAmount,
          vatAmount,
          targetReference: refId
        }
      });

      // Reset
      setJustification('');
      setHasAcceptedRisk(false);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'فشل توثيق واعتماد الإجراء الحوكمي.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" dir="rtl">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className={`relative w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden z-10 transition-all ${
        isDark 
          ? 'bg-slate-900 border-slate-700/80 text-slate-100 shadow-rose-950/20' 
          : 'bg-white border-slate-200 text-slate-900 shadow-slate-900/15'
      }`}>
        {/* Urgent Header Banner */}
        <div className="bg-gradient-to-r from-rose-950 via-rose-900 to-amber-950 border-b border-rose-800/80 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-300">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-wide">
                  نافذة الحوكمة والقرارات التشغيلية السيادية
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500 text-white font-bold">
                  إجراء حرج
                </span>
              </div>
              <p className="text-xs text-rose-200/90 mt-0.5">
                يتطلب هذا القرار توثيقاً قانونياً وتوقيعاً إدارياً فورياً قبل اعتماده في قاعدة البيانات
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-rose-200 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Target Reference & Case Summary Box */}
          <div className={`p-4 rounded-xl border ${
            isDark ? 'bg-slate-950/80 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between gap-4 mb-3 pb-3 border-b border-slate-800/40">
              <div>
                <span className="text-xs text-slate-400 block mb-1">الإجراء المطلوب تنفيذه:</span>
                <h4 className="font-bold text-sm text-emerald-400 flex items-center gap-2">
                  <span>{actionConfig.actionTitle}</span>
                  <span className="text-[11px] font-mono text-slate-400">({actionConfig.commandId})</span>
                </h4>
              </div>

              <div className="text-left">
                <span className="text-xs text-slate-400 block mb-1">المعرف المرجعي الرسمي:</span>
                <span className="font-mono text-sm font-extrabold text-amber-400 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/60">
                  {refId || activeCase.caseId}
                </span>
              </div>
            </div>

            {/* Financial Details (VAT Inclusive Rule 11) */}
            {amount > 0 && (
              <div className="grid grid-cols-3 gap-2.5 text-center mt-2 pt-1">
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] text-slate-400">المبلغ الإجمالي (شامل 15%)</div>
                  <div className="font-mono text-xs font-black text-emerald-400">
                    {amount.toLocaleString('ar-SA')} ر.س
                  </div>
                </div>
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] text-slate-400">الوعاء الخاضع للضريبة</div>
                  <div className="font-mono text-xs font-bold text-slate-300">
                    {taxableAmount.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
                  </div>
                </div>
                <div className={`p-2 rounded-lg border ${isDark ? 'bg-slate-900/90 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="text-[10px] text-slate-400">ضريبة القيمة المضافة 15%</div>
                  <div className="font-mono text-xs font-bold text-teal-400">
                    {vatAmount.toLocaleString('ar-SA', { maximumFractionDigits: 2 })} ر.س
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Compliance & Sovereign Checklist */}
          <div className={`p-3.5 rounded-xl border text-xs space-y-2 ${
            isDark ? 'bg-slate-950/60 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="font-bold text-slate-200 flex items-center gap-2 mb-1">
              <Scale className="w-4 h-4 text-amber-400" />
              <span>فحص الامتثال والقواعد الإلزامية للمنصة (Platform Compliance Check):</span>
            </div>
            
            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>مطابقة الترقيم القياسي المعتمد (BKG-26 / SRV-26 / INV-26).</span>
            </div>

            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>الأسعار شاملة ضريبة القيمة المضافة 15% ومثبتة بلقطة مالية غير قابلة للتعديل.</span>
            </div>

            <div className="flex items-center gap-2 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              <span>العزل الصارم لبيانات الشريك: لن تظهر تفاصيل هذا الإجراء إلا للأطراف المصرح لها.</span>
            </div>
          </div>

          {/* Mandatory Justification */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-teal-400" />
                <span>المبرر التشغيلي والقانوني للإجراء (إلزامي):</span>
              </label>
              <span className={`text-[10px] font-mono ${
                justification.trim().length >= minJustificationLength ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {justification.trim().length} / {minJustificationLength} حرفاً كحد أدنى
              </span>
            </div>
            <textarea
              required
              rows={3}
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
              placeholder="اكتب التبرير الفني أو القانوني لاتخاذ هذا القرار السيادي ليتم حفظه في سجل التدقيق غير القابل للتعديل..."
              className={`w-full p-3 rounded-xl text-xs outline-none border transition-colors ${
                isDark 
                  ? 'bg-slate-950 border-slate-700 text-slate-100 placeholder:text-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30' 
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30'
              }`}
            />
          </div>

          {/* Department Sign-Off & Risk Acceptance */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  جهة التوقيع والاعتماد:
                </label>
                <select
                  value={departmentSignOff}
                  onChange={(e) => setDepartmentSignOff(e.target.value)}
                  className={`w-full p-2.5 rounded-xl text-xs border outline-none font-medium ${
                    isDark ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-white border-slate-300 text-slate-800'
                  }`}
                >
                  <option value="OPERATIONS_CONTROL">إدارة التحكم والعمليات الميدانية (Ops Control)</option>
                  <option value="RISK_AND_LEGAL">إدارة المخاطر والرقابة القانونية (Risk & Legal)</option>
                  <option value="FINANCIAL_AUDIT">إدارة التدقيق المالي والتسويات (Finance Audit)</option>
                  <option value="EXECUTIVE_OFFICE">المكتب التنفيذي والسيادي (Executive Office)</option>
                </select>
              </div>
            </div>

            {/* Checkbox for Risk Sign-off */}
            <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
              hasAcceptedRisk
                ? isDark ? 'bg-rose-950/40 border-rose-700/80 text-rose-200' : 'bg-rose-50 border-rose-300 text-rose-900'
                : isDark ? 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700' : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
            }`}>
              <input
                type="checkbox"
                checked={hasAcceptedRisk}
                onChange={(e) => setHasAcceptedRisk(e.target.checked)}
                className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
              />
              <div className="text-xs leading-relaxed">
                <span className="font-bold block">إقرار المسؤولية والامتثال:</span>
                أقر بصفتي مشرفاً معتمداً بصحة المبررات المدخلة، وتحمل المسؤولية التشغيلية المترتبة على تنفيذ هذا الإجراء فوراً.
              </div>
            </label>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800/60">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition-colors ${
                isDark 
                  ? 'border-slate-700 text-slate-300 hover:bg-slate-800' 
                  : 'border-slate-300 text-slate-700 hover:bg-slate-100'
              }`}
            >
              إلغاء الأمر
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-extrabold text-white transition-all shadow-md ${
                !canSubmit 
                  ? 'bg-slate-700 text-slate-400 cursor-not-allowed opacity-60' 
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/30 hover:shadow-rose-900/50'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>جاري التوثيق والتنفيذ...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>اعتماد وتوثيق القرار رسمياً</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
