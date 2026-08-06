import React, { useState, useEffect } from 'react';
import { 
  ShieldAlert, ShieldCheck, CheckCircle2, XCircle, Clock, 
  History, AlertTriangle, UserCheck, RefreshCw, Trash2, Eye, FileText, Lock, MessageSquare, Send, Paperclip, CornerUpLeft, MessageCircle
} from 'lucide-react';

interface SensitiveDataApprovalsPanelProps {
  showNotification: (type: 'success' | 'error' | 'info' | 'warning', message: string) => void;
}

const FIELD_LABELS: Record<string, string> = {
  commercialRecord: 'رقم السجل التجاري',
  cr: 'رقم السجل التجاري',
  vatNumber: 'الرقم الضريبي VAT',
  vatRecord: 'الرقم الضريبي',
  iban: 'رقم الحساب البنكي (IBAN)',
  bankName: 'اسم البنك',
  nationalId: 'رقم الهوية الوطنية / الإقامة',
  phone: 'رقم الجوال المسجل',
  email: 'البريد الإلكتروني الرسمي',
  name: 'الاسم الرسمي للمنشأة / المزود',
  officialName: 'الاسم التجاري الرسمي',
  nationalAddress: 'العنوان الوطني',
  addressDetails: 'تفاصيل العنوان الوطني',
  providerType: 'نوع المزود (فرد / منشأة)',
  avatarUrl: 'الصورة الشخصية / الشعار',
  image: 'شعار المنشأة',
  crFile: 'شهادة السجل التجاري',
  vatFile: 'شهادة القيمة المضافة',
  ibanFile: 'شهادة/خطاب الحساب البنكي'
};

export default function SensitiveDataApprovalsPanel({ showNotification }: SensitiveDataApprovalsPanelProps) {
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'needs_revision'>('all');
  const [loading, setLoading] = useState(true);
  
  // Rejection & Revision Modals State
  const [rejectionModalId, setRejectionModalId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [revisionModalId, setRevisionModalId] = useState<string | null>(null);
  const [revisionNoteText, setRevisionNoteText] = useState('');
  
  // Note inputs state per card
  const [newNoteTexts, setNewNoteTexts] = useState<Record<string, string>>({});
  const [attachedFiles, setAttachedFiles] = useState<Record<string, string[]>>({});

  const [retentionDays, setRetentionDays] = useState(365);
  const [submittingId, setSubmittingId] = useState<string | null>(null);

  const fetchPendingData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users/pending-profile-updates');
      const data = await res.json();
      if (data.success) {
        setPendingUpdates(data.pendingUpdates || []);
      }
    } catch (err) {
      console.error('Failed to fetch pending profile updates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingData();
  }, []);

  const handleApprove = async (id: string) => {
    setSubmittingId(id);
    try {
      const res = await fetch(`/api/users/pending-profile-updates/${id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewedBy: 'الإدارة العامة' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'تم اعتماد التحديث وأرشفة البيانات القديمة بنجاح');
        fetchPendingData();
      } else {
        showNotification('error', data.error || 'فشل اعتماد طلب التحديث');
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ أثناء التواصل مع السيرفر: ' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectionModalId) return;
    setSubmittingId(rejectionModalId);
    try {
      const res = await fetch(`/api/users/pending-profile-updates/${rejectionModalId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rejectionReason, reviewedBy: 'الإدارة العامة' })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('info', 'تم رفض طلب تعديل البيانات الحساسة');
        setRejectionModalId(null);
        setRejectionReason('');
        fetchPendingData();
      } else {
        showNotification('error', data.error || 'فشل رفض الطلب');
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ أثناء التواصل مع السيرفر: ' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleRequestRevision = async () => {
    if (!revisionModalId) return;
    setSubmittingId(revisionModalId);
    try {
      const res = await fetch(`/api/users/pending-profile-updates/${revisionModalId}/request-revision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          noteText: revisionNoteText,
          reviewedBy: 'الإدارة العامة (قسم الاعتمادات)',
          attachments: attachedFiles[revisionModalId] || []
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('warning', 'تم إرجاع الطلب للمستفيد بنجاح وتفعيل حالة "بانتظار مرفقات إضافية / تعديل الإدارة"');
        setRevisionModalId(null);
        setRevisionNoteText('');
        fetchPendingData();
      } else {
        showNotification('error', data.error || 'فشل إرجاع الطلب');
      }
    } catch (err: any) {
      showNotification('error', 'حدث خطأ: ' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  const handleSendNote = async (updateId: string) => {
    const text = newNoteTexts[updateId];
    if (!text || !text.trim()) return;

    try {
      const res = await fetch(`/api/users/pending-profile-updates/${updateId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sender: 'الإدارة العامة (قسم الاعتمادات)',
          senderRole: 'admin',
          attachments: attachedFiles[updateId] || []
        })
      });
      const data = await res.json();
      if (data.success) {
        showNotification('success', 'تم إرسال الملاحظة والمرفق إلى صندوق المحادثة المتبادل مع المزود');
        setNewNoteTexts(prev => ({ ...prev, [updateId]: '' }));
        setAttachedFiles(prev => ({ ...prev, [updateId]: [] }));
        fetchPendingData();
      }
    } catch (err: any) {
      showNotification('error', 'فشل إرسال الملاحظة: ' + err.message);
    }
  };

  const handleAttachMockDoc = (updateId: string) => {
    const mockFileNames = [
      'صورة_شهادة_الآيبان_البنكي_الرسمية.pdf',
      'صورة_شهادة_السجل_التجاري_المحدثة.png',
      'خطاب_تفويض_التوقيع_البنكي.pdf'
    ];
    const picked = mockFileNames[Math.floor(Math.random() * mockFileNames.length)];
    setAttachedFiles(prev => ({
      ...prev,
      [updateId]: [...(prev[updateId] || []), picked]
    }));
    showNotification('info', `تم إرفاق الملف: ${picked}`);
  };

  const handleCleanupHistory = async () => {
    try {
      const res = await fetch('/api/users/profile-history/cleanup', { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        showNotification('success', data.message || 'تم تنظيف السجلات المنتهية الصلاحية بنجاح');
      }
    } catch (err: any) {
      showNotification('error', 'خطأ في تنظيف السجلات: ' + err.message);
    }
  };

  const filteredUpdates = pendingUpdates.filter(item => {
    if (statusFilter === 'pending') return item.status === 'pending';
    if (statusFilter === 'needs_revision') return item.status === 'needs_revision';
    return true;
  });

  return (
    <div id="sensitive-data-approvals-panel" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center border border-amber-500/30 shrink-0">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-amber-300 flex items-center gap-2">
                مركز اعتماد تعديلات البيانات الحساسة وحوكمة المرفقات
              </h3>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                مراجعة وتأكيد أو إرجاع طلبات تعديل البيانات الحساسة (الآيبان، السجل التجاري، الرقم الضريبي) مع صندوق ملاحظات متبادل للمرفقات.
              </p>
            </div>
          </div>
          <button
            onClick={fetchPendingData}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-xs px-3.5 py-2 rounded-xl transition-all border border-slate-700 font-bold shrink-0 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            تحديث القائمة
          </button>
        </div>
      </div>

      {/* Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'all' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            جميع الطلبات ({pendingUpdates.length})
          </button>
          <button
            onClick={() => setStatusFilter('pending')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'pending' ? 'bg-amber-500 text-slate-900 shadow-sm' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            ⏳ بانتظار الاعتماد ({pendingUpdates.filter(i => i.status === 'pending').length})
          </button>
          <button
            onClick={() => setStatusFilter('needs_revision')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              statusFilter === 'needs_revision' ? 'bg-purple-600 text-white shadow-sm' : 'bg-purple-50 text-purple-800 hover:bg-purple-100'
            }`}
          >
            🔄 بانتظار مرفقات إضافية / تعديل الإدارة ({pendingUpdates.filter(i => i.status === 'needs_revision').length})
          </button>
        </div>
      </div>

      {/* Main List */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-bold">جاري تحميل طلبات تعديل البيانات الحساسة والمرفقات...</p>
          </div>
        ) : filteredUpdates.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-200 p-6">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
            <h4 className="font-bold text-slate-800 text-sm">لا توجد طلبات تعديل معلقة حالياً</h4>
            <p className="text-xs text-slate-400 mt-1">جميع البيانات الحساسة مطابقة وموثقة في النظام.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredUpdates.map((item) => {
              const changes = item.requestedChanges || {};
              const current = item.currentValues || {};
              const fields = item.sensitiveFieldsChanged || Object.keys(changes);
              const notes = Array.isArray(item.notesThread) ? item.notesThread : [];

              return (
                <div key={item.id} className="border border-slate-200 rounded-2xl p-5 bg-white hover:border-slate-300 transition-all shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center font-bold text-indigo-700 text-sm border border-indigo-100">
                        {item.userName ? item.userName.charAt(0) : 'U'}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h5 className="font-bold text-slate-800 text-sm">{item.userName || 'مستخدم'}</h5>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            item.status === 'needs_revision' ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}>
                            {item.status === 'needs_revision' ? '🔄 بانتظار مرفقات إضافية / تعديل الإدارة' : '⏳ بانتظار الاعتماد'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-0.5">{item.userEmail} | الصفة: {item.requestedByRole}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <span>📅 تاريخ الطلب: {new Date(item.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                  </div>

                  {/* Fields Comparison Table */}
                  <div className="overflow-x-auto border border-slate-100 rounded-xl">
                    <table className="w-full text-right text-xs">
                      <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                        <tr>
                          <th className="p-3">الحقل الحساس</th>
                          <th className="p-3">القيمة الحالية بالمنصة</th>
                          <th className="p-3">القيمة الجديدة المطلوبة</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {fields.map((fieldKey: string) => (
                          <tr key={fieldKey} className="hover:bg-amber-50/20">
                            <td className="p-3 font-bold text-slate-800">
                              {FIELD_LABELS[fieldKey] || fieldKey}
                            </td>
                            <td className="p-3 text-slate-500 font-mono bg-rose-50/30">
                              {current[fieldKey] ? String(current[fieldKey]) : <span className="text-slate-300">غير مسجل / فارغ</span>}
                            </td>
                            <td className="p-3 text-emerald-700 font-bold font-mono bg-emerald-50/40">
                              {changes[fieldKey] ? String(changes[fieldKey]) : <span className="text-slate-300">-</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mutual Notes / Comments Thread Box */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <h6 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                        <MessageCircle className="w-4 h-4 text-purple-600" />
                        صندوق الملاحظات المتبادل والمرفقات الرسمية (Mutual Notes & Attachments Thread)
                      </h6>
                      <span className="text-[10px] text-slate-400 font-mono">{notes.length} رسالة / ملاحظة</span>
                    </div>

                    {notes.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-2">لا توجد ملاحظات سابقة على هذا الطلب.</p>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                        {notes.map((n: any, idx: number) => (
                          <div key={idx} className={`p-2.5 rounded-xl text-xs border ${
                            n.senderRole === 'admin' ? 'bg-purple-50/70 border-purple-200 text-purple-950 mr-4' : 'bg-white border-slate-200 text-slate-800 ml-4'
                          }`}>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-[11px]">{n.sender}</span>
                              <span className="text-[9px] text-slate-400 font-mono">{new Date(n.createdAt).toLocaleString('ar-SA')}</span>
                            </div>
                            <p className="text-xs leading-relaxed">{n.text}</p>
                            {n.attachments && n.attachments.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {n.attachments.map((att: string, aIdx: number) => (
                                  <span key={aIdx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-purple-200 text-purple-700 rounded-lg text-[10px] font-mono">
                                    <Paperclip className="w-3 h-3" />
                                    {att}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add note / reply controls */}
                    <div className="pt-2 flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="اكتب ملاحظة أو توجيه للمزود/العميل هنا..."
                        value={newNoteTexts[item.id] || ''}
                        onChange={(e) => setNewNoteTexts({ ...newNoteTexts, [item.id]: e.target.value })}
                        className="flex-1 p-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-purple-500"
                      />
                      <button
                        onClick={() => handleAttachMockDoc(item.id)}
                        className="px-3 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0"
                        title="إرفاق صورة شهادة أو مستند"
                      >
                        <Paperclip className="w-3.5 h-3.5" />
                        إرفاق شهادة
                      </button>
                      <button
                        onClick={() => handleSendNote(item.id)}
                        className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-xs"
                      >
                        <Send className="w-3.5 h-3.5" />
                        إرسال الملاحظة
                      </button>
                    </div>

                    {attachedFiles[item.id] && attachedFiles[item.id].length > 0 && (
                      <div className="flex gap-2 items-center text-[10px] text-purple-700 font-bold bg-purple-50 p-2 rounded-lg">
                        <span>المرفقات الجاهزة للإرسال:</span>
                        {attachedFiles[item.id].map((f, i) => (
                          <span key={i} className="bg-white px-2 py-0.5 rounded border border-purple-200 font-mono">{f}</span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setRevisionModalId(item.id);
                        setRevisionNoteText('يرجى إرفاق صورة رسمية حديثة لشهادة الآيبان البنكي الصادرة من البنك المعتمد وتوضيح السجل التجاري لإنهاء المطابقة.');
                      }}
                      disabled={submittingId === item.id}
                      className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 border border-purple-200"
                    >
                      <CornerUpLeft className="w-4 h-4 text-purple-600" />
                      إرجاع للمستفيد (طلب مرفقات)
                    </button>
                    <button
                      onClick={() => setRejectionModalId(item.id)}
                      disabled={submittingId === item.id}
                      className="px-4 py-2 bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-600 rounded-xl font-bold text-xs transition-colors flex items-center gap-1.5 border border-slate-200"
                    >
                      <XCircle className="w-4 h-4" />
                      رفض نهائي
                    </button>
                    <button
                      onClick={() => handleApprove(item.id)}
                      disabled={submittingId === item.id}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {submittingId === item.id ? 'جاري الاعتماد...' : 'اعتماد وتأريج النسخة القديمة'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historical Data Retention Policy */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center border border-indigo-200">
              <History className="w-5 h-5 text-indigo-600" />
            </div>
            <div>
              <h4 className="font-bold text-slate-800 text-base">سياسة الاحتفاظ بالسجلات التاريخية للتأريج والتدقيق</h4>
              <p className="text-xs text-slate-500">مدة حفظ بيانات الملفات الشخصية القديمة والتغييرات السابقة تلقائياً في قاعدة البيانات السحابية</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleCleanupHistory}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold border border-slate-300 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-slate-500" />
              تنظيف السجلات المنتهية
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold text-slate-700 mb-2">مدة الاحتفاظ بالسجلات التاريخية (بالأيام)</label>
            <select
              value={retentionDays}
              onChange={(e) => setRetentionDays(Number(e.target.value))}
              className="w-full p-2.5 bg-white border border-slate-300 rounded-lg text-xs font-bold outline-none focus:border-amber-500"
            >
              <option value={30}>30 يوم (شهر واحد)</option>
              <option value={90}>90 يوم (ثلاثة أشهر)</option>
              <option value={180}>180 يوم (ستة أشهر)</option>
              <option value={365}>365 يوم (سنة كاملة - موصى به)</option>
              <option value={730}>730 يوم (سنتان)</option>
            </select>
          </div>
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 col-span-2 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-slate-800 block">حالة أرشفة السجلات الحالية</span>
              <span className="text-[11px] text-slate-500 mt-1 block">يتم توثيق كافة تغييرات الآيبان والسجلات والأسماء مع تاريخ الموافقة واسم المشرف المسند.</span>
            </div>
            <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">أرشيف آمن 🔒</span>
          </div>
        </div>
      </div>

      {/* Revision Modal */}
      {revisionModalId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200 text-right">
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <CornerUpLeft className="w-5 h-5 text-purple-600" />
              <span>إرجاع الطلب للمستفيد مع تحديد المرفقات المطلوبة</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              سيتم تغيير حالة الطلب إلى <strong className="text-purple-700">"بانتظار مرفقات إضافية / تعديل الإدارة"</strong> وتأطير الملاحظات المتبادلة.
            </p>
            <textarea
              value={revisionNoteText}
              onChange={(e) => setRevisionNoteText(e.target.value)}
              placeholder="اكتب تفاصيل المرفقات أو التعديلات المطلوبة من المستفيد (مثل: صورة الآيبان، السجل)..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-purple-500 min-h-[100px]"
            ></textarea>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRevisionModalId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleRequestRevision}
                disabled={!revisionNoteText.trim()}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
              >
                تأكيد الإرجاع وطلب المرفقات
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Reason Modal */}
      {rejectionModalId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in duration-200 text-right">
            <h4 className="font-bold text-slate-800 text-base flex items-center gap-2">
              <XCircle className="w-5 h-5 text-red-500" />
              <span>سبب رفض طلب تحديث البيانات الحساسة</span>
            </h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              يرجى كتابة سبب عدم اعتماد التغييرات المطلوبة لكي يتم إرسال إشعاره بالرفض للمزود/العميل.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="مثال: عدم وضوح شهادة السجل التجاري المرفقة أو عدم مطابقة رقم الآيبان لاسم المنشأة..."
              className="w-full p-3 border border-slate-300 rounded-xl text-xs outline-none focus:border-amber-500 min-h-[100px]"
            ></textarea>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRejectionModalId(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleReject}
                disabled={!rejectionReason.trim()}
                className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs shadow-sm disabled:opacity-50"
              >
                تأكيد الرفض
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
