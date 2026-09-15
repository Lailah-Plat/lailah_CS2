import React, { useEffect, useState } from 'react';
import { X, CheckCircle2, Clock, AlertTriangle, ShieldCheck, CreditCard, RefreshCw } from 'lucide-react';
import { apiService } from '../../services/apiService';

interface LifecycleTimelineModalProps {
  isOpen: boolean;
  onClose: () => void;
  aggregateType: 'Booking' | 'SupportServiceRequest';
  aggregateId: number | string;
  referenceNumber?: string;
}

export const LifecycleTimelineModal: React.FC<LifecycleTimelineModalProps> = ({
  isOpen,
  onClose,
  aggregateType,
  aggregateId,
  referenceNumber
}) => {
  const [loading, setLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (isOpen && aggregateId) {
      fetchTimeline();
    }
  }, [isOpen, aggregateId]);

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const endpoint = aggregateType === 'Booking' 
        ? `/api/bookings/${aggregateId}/timeline`
        : `/api/bookings/support-requests/${aggregateId}/timeline`;
      const res = await apiService.get(endpoint);
      if (res && res.success) {
        setAuditLogs(res.auditLogs || []);
        setEvents(res.events || []);
      }
    } catch (err) {
      console.error('Failed to load timeline:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div 
        id="lifecycle-timeline-dialog"
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800">
                سجل التدقيق ودورة الحياة (Lifecycle Audit Trail)
              </h3>
              <p className="text-xs text-slate-500">
                {aggregateType === 'Booking' ? 'حجز رقم' : 'طلب خدمة رقم'}: <span className="font-mono font-bold text-slate-700">{referenceNumber || aggregateId}</span>
              </p>
            </div>
          </div>
          <button
            id="close-timeline-modal-btn"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <span className="text-sm">جاري تحميل سجل التدقيق والأحداث...</span>
            </div>
          ) : auditLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <ShieldCheck className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="text-sm">لا توجد سجلات تدقيق مسجلة لهذا الطلب بعد.</p>
            </div>
          ) : (
            <div className="relative border-r-2 border-slate-200 pr-6 space-y-6 mr-3">
              {auditLogs.map((log, index) => {
                const isFinal = log.toState === 'CONFIRMED' || log.toState === 'COMPLETED';
                const isCancelled = log.toState === 'CANCELLED' || log.toState === 'REJECTED' || log.toState === 'EXPIRED';

                return (
                  <div key={log.id || index} className="relative group">
                    {/* Timeline Node Icon */}
                    <div className={`absolute -right-[31px] top-1 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                      isFinal 
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-600'
                        : isCancelled
                        ? 'bg-red-50 border-red-500 text-red-600'
                        : 'bg-amber-50 border-amber-500 text-amber-600'
                    }`}>
                      {isFinal ? (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      ) : isCancelled ? (
                        <AlertTriangle className="w-3.5 h-3.5" />
                      ) : (
                        <Clock className="w-3.5 h-3.5" />
                      )}
                    </div>

                    {/* Timeline Card */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 transition-all hover:bg-white hover:shadow-xs">
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-800">
                            {log.action}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-md bg-slate-200/70 text-slate-700 font-mono">
                            {log.fromState} ➔ {log.toState}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(log.timestamp).toLocaleString('ar-SA')}
                        </span>
                      </div>

                      {log.reason && (
                        <p className="text-xs text-slate-600 mb-2">
                          <span className="font-medium text-slate-700">السبب/الملاحظة:</span> {log.reason}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/50">
                        <span>المنفذ: <strong className="text-slate-700">{log.actorRole || 'نظامي'}</strong> {log.actorId ? `(#${log.actorId})` : ''}</span>
                        {log.metadata && log.metadata !== '{}' && (
                          <span className="text-slate-400 font-mono text-[10px]">
                            {log.metadata.length > 50 ? `${log.metadata.substring(0, 50)}...` : log.metadata}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex justify-end">
          <button
            id="close-timeline-footer-btn"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-sm font-semibold rounded-xl transition-colors"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
