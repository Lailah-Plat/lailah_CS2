import React, { useState, useEffect } from 'react';
import { 
  Clock, Shield, Save, RefreshCw, AlertTriangle, History, 
  CheckCircle2, Sun, Moon, Calendar, UserCheck, Timer, Info
} from 'lucide-react';

interface RegulatoryPeriodsTabProps {
  showNotification: (type: 'success' | 'error' | 'info', message: string) => void;
}

export const RegulatoryPeriodsTab: React.FC<RegulatoryPeriodsTabProps> = ({ showNotification }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Regulatory Timing State
  const [version, setVersion] = useState(1);
  const [updatedAt, setUpdatedAt] = useState<string>('');
  const [morningStart, setMorningStart] = useState('07:00');
  const [morningEnd, setMorningEnd] = useState('15:00');
  const [morningLabel, setMorningLabel] = useState('الفترة الصباحية');
  
  const [eveningStart, setEveningStart] = useState('16:00');
  const [eveningEnd, setEveningEnd] = useState('02:00');
  const [eveningLabel, setEveningLabel] = useState('الفترة المسائية');

  // Sovereign Deadlines State
  const [providerResponseHours, setProviderResponseHours] = useState(24);
  const [customerPaymentHours, setCustomerPaymentHours] = useState(2);
  const [holdDurationMinutes, setHoldDurationMinutes] = useState(15);
  const [cancellationCutoffHours, setCancellationCutoffHours] = useState(48);

  // Update change form
  const [reason, setReason] = useState('');
  const [effectiveFrom, setEffectiveFrom] = useState('');

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/booking/regulatory-periods');
      const data = await res.json();
      if (data.success && data.config) {
        const c = data.config;
        setVersion(c.version || 1);
        setUpdatedAt(c.updatedAt || '');
        if (c.morning) {
          setMorningStart(c.morning.startTime || '07:00');
          setMorningEnd(c.morning.endTime || '15:00');
          setMorningLabel(c.morning.displayNameAr || c.morning.labelAr || 'الفترة الصباحية');
        }
        if (c.evening) {
          setEveningStart(c.evening.startTime || '16:00');
          setEveningEnd(c.evening.endTime || '02:00');
          setEveningLabel(c.evening.displayNameAr || c.evening.labelAr || 'الفترة المسائية');
        }
        if (c.deadlines) {
          setProviderResponseHours(c.deadlines.sovereignProviderResponseDeadlineHours || c.deadlines.providerResponseHours || 24);
          setCustomerPaymentHours(c.deadlines.customerPaymentDeadlines?.APPROVAL_BEFORE_PAYMENT || c.deadlines.customerPaymentHours || 2);
          setHoldDurationMinutes(c.deadlines.holdTtlMinutes || c.deadlines.holdDurationMinutes || 15);
          setCancellationCutoffHours(c.deadlines.cancellationCutoffHours || 48);
        }
      }
    } catch (err: any) {
      showNotification('error', `فشل تحميل الإعدادات التنظيمية السيادية: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const fetchAudit = async () => {
    try {
      setLoadingAudit(true);
      const res = await fetch('/api/booking/regulatory-periods/audit-history?limit=20');
      const data = await res.json();
      if (data.success) {
        setAuditLogs(data.logs || []);
      }
    } catch (err: any) {
      console.error('Error fetching regulatory audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchConfig();
    fetchAudit();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      showNotification('error', 'يرجى كتابة سبب التعديل التنظيمي لتوثيقه في سجل الرقابة السيادية.');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        morning: {
          startTime: morningStart,
          endTime: morningEnd,
          labelAr: morningLabel
        },
        evening: {
          startTime: eveningStart,
          endTime: eveningEnd,
          labelAr: eveningLabel
        },
        deadlines: {
          providerResponseHours: Number(providerResponseHours),
          customerPaymentHours: Number(customerPaymentHours),
          holdDurationMinutes: Number(holdDurationMinutes),
          cancellationCutoffHours: Number(cancellationCutoffHours)
        },
        reason: reason.trim(),
        effectiveFrom: effectiveFrom || undefined
      };

      const res = await fetch('/api/booking/regulatory-periods', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': '1',
          'x-user-name': 'Admin Supervisor'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        showNotification('success', '✅ تم حفظ الأوقات والمهل التنظيمية السيادية بنجاح (تسري على العمليات المستقبلية فقط دون المساس بالحجوزات التاريخية).');
        setReason('');
        setEffectiveFrom('');
        fetchConfig();
        fetchAudit();
      } else {
        showNotification('error', data.error || 'فشل حفظ الإعدادات التنظيمية');
      }
    } catch (err: any) {
      showNotification('error', `حدث خطأ أثناء الحفظ: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200" dir="rtl">
      {/* Sovereign Governance Banner */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border border-amber-500/30 rounded-2xl p-5 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-amber-500/20 text-amber-700 rounded-xl">
            <Shield className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-bold text-slate-900">
                الأوقات والمهل التنظيمية السيادية (Sovereign Regulatory Periods & Deadlines)
              </h3>
              <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2.5 py-0.5 rounded-full border border-amber-200 font-mono">
                الإصدار v{version}
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-4xl">
              <strong>قاعدة سيادية ملزمة:</strong> تملك الإدارة الحق الكامل في تحديد وتعديل الأوقات المرجعية للفترات والمهل الزمنية في أي وقت من خلال إعدادات الأمان، 
              على أن تؤثر التعديلات على <strong>العرض والتنظيم والعمليات المستقبلية فقط</strong>، 
              ولا تغير الحجوزات التاريخية أو العقود القائمة بأثر رجعي استناداً للقطة التنظيمية المثبتة (<code className="bg-slate-200 px-1 py-0.5 rounded text-[10px] font-mono">periodSnapshot</code>).
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="lg:col-span-2 space-y-6">
          {/* Periods Timing */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                توقيت الفترات المرجعية للصالات والخدمات (Morning & Evening Periods)
              </h4>
              <button
                type="button"
                onClick={fetchConfig}
                disabled={loading}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                تحديث
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Morning Period */}
              <div className="p-4 rounded-xl bg-amber-50/50 border border-amber-200/70 space-y-3">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                  <Sun className="w-4 h-4 text-amber-600" />
                  الفترة الصباحية (Morning Period)
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">المسمى التنظيمي:</label>
                    <input
                      type="text"
                      value={morningLabel}
                      onChange={(e) => setMorningLabel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">وقت البدء التنظيمي:</label>
                      <input
                        type="time"
                        value={morningStart}
                        onChange={(e) => setMorningStart(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">وقت الانتهاء التنظيمي:</label>
                      <input
                        type="time"
                        value={morningEnd}
                        onChange={(e) => setMorningEnd(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-amber-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Evening Period */}
              <div className="p-4 rounded-xl bg-indigo-50/50 border border-indigo-200/70 space-y-3">
                <div className="flex items-center gap-2 text-indigo-800 font-bold text-xs">
                  <Moon className="w-4 h-4 text-indigo-600" />
                  الفترة المسائية (Evening Period)
                </div>
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">المسمى التنظيمي:</label>
                    <input
                      type="text"
                      value={eveningLabel}
                      onChange={(e) => setEveningLabel(e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">وقت البدء التنظيمي:</label>
                      <input
                        type="time"
                        value={eveningStart}
                        onChange={(e) => setEveningStart(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">وقت الانتهاء التنظيمي:</label>
                      <input
                        type="time"
                        value={eveningEnd}
                        onChange={(e) => setEveningEnd(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sovereign Deadlines & SLA */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Timer className="w-4 h-4 text-emerald-600" />
              المهل الزمنية وقواعد الانتهاء التلقائي (Sovereign Deadlines & Expirations)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  مهلة استجابة المزود (ساعات):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="168"
                    value={providerResponseHours}
                    onChange={(e) => setProviderResponseHours(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">ساعة (الافتراضي: 24 ساعة)</span>
                </div>
                <p className="text-[10px] text-slate-500">ينتهي الطلب تلقائياً إذا لم يستجب المزود بالقبول أو الرفض خلال هذه المهلة.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  مهلة دفع العميل بعد القبول (ساعات):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="72"
                    value={customerPaymentHours}
                    onChange={(e) => setCustomerPaymentHours(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">ساعة (الافتراضي: 2 ساعة)</span>
                </div>
                <p className="text-[10px] text-slate-500">تفتح فترة السداد للعميل بعد موافقة المزود، ويُلغى الحجز في حال عدم السداد في الوقت المحدد.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  مدة القفل المؤقت للحجز (دقائق):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="5"
                    max="60"
                    value={holdDurationMinutes}
                    onChange={(e) => setHoldDurationMinutes(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">دقيقة (الافتراضي: 15 دقيقة)</span>
                </div>
                <p className="text-[10px] text-slate-500">مدة تجميد التاريخ والفترة لمنع الحجز المزدوج أثناء إنهاء العميل لعملية الدفع.</p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                <label className="block text-xs font-bold text-slate-800">
                  الحد الأدنى لطلب الإلغاء قبل المناسبة (ساعات):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    max="720"
                    value={cancellationCutoffHours}
                    onChange={(e) => setCancellationCutoffHours(Number(e.target.value))}
                    className="w-24 bg-white border border-slate-300 rounded-lg px-3 py-1.5 text-xs font-bold text-slate-800 text-center outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="text-xs text-slate-500">ساعة (الافتراضي: 48 ساعة)</span>
                </div>
                <p className="text-[10px] text-slate-500">الحد الفاصل لإمكانية طلب إلغاء الحجز من العميل قبل موعد بدء المناسبة.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Change Audit & Save Action Column */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
            <h4 className="text-sm font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-amber-600" />
              توثيق التعديل السيادي (Sovereign Audit)
            </h4>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  سبب التعديل التنظيمي <span className="text-rose-500">*</span>:
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="مثال: تعديل مواعيد الفترة المسائية لتتوافق مع توقيت الصيف أو قرارات تنظيمية جديدة..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تاريخ بدء السريان (اختياري):
                </label>
                <input
                  type="date"
                  value={effectiveFrom}
                  onChange={(e) => setEffectiveFrom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none focus:ring-2 focus:ring-amber-500"
                />
                <span className="text-[10px] text-slate-500 block mt-1">إذا تُرِك فارغاً، يسري فوراً على العمليات المستقبلية.</span>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving || loading}
                  className="w-full py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  حفظ وتطبيق التعديل السيادي
                </button>
              </div>
            </div>
          </div>

          {/* Audit History mini panel */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h5 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5 text-slate-500" />
                سجل التعديلات السابقة (Audit History)
              </h5>
              <button
                type="button"
                onClick={fetchAudit}
                className="text-[10px] text-slate-500 hover:text-slate-800"
              >
                تحديث
              </button>
            </div>

            {loadingAudit ? (
              <div className="py-6 text-center text-xs text-slate-400">جاري تحميل السجل...</div>
            ) : auditLogs.length === 0 ? (
              <div className="py-4 text-center text-xs text-slate-400">لا توجد تعديلات سابقة مسجلة.</div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {auditLogs.map((log, idx) => (
                  <div key={log.id || idx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 text-[11px] space-y-1">
                    <div className="flex items-center justify-between font-bold text-slate-700">
                      <span>إصدار v{log.version}</span>
                      <span className="text-[10px] text-slate-400">{log.createdAt ? new Date(log.createdAt).toLocaleString('ar-SA') : ''}</span>
                    </div>
                    <p className="text-slate-600 text-[10px]">{log.reason || 'تعديل إعدادات سيادية'}</p>
                    <div className="text-[9px] text-slate-400 flex items-center justify-between pt-1 border-t border-slate-200/60">
                      <span>بواسطة: {log.actorName || 'Admin'}</span>
                      <span>سارٍ من: {log.effectiveFrom ? String(log.effectiveFrom).split('T')[0] : 'فوري'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
