import React, { useState } from 'react';
import { 
  MessageSquare, Mail, Bell, Check, Power, Send, ShieldCheck, 
  Clock, AlertCircle, Sparkles, CheckCircle2, Sliders, Smartphone, Copy
} from 'lucide-react';

interface CampaignNotificationManagerProps {
  showNotice: (type: 'success' | 'error', text: string) => void;
  campaigns: any[];
}

export const CampaignNotificationManager: React.FC<CampaignNotificationManagerProps> = ({
  showNotice,
  campaigns
}) => {
  // WhatsApp Toggle: Enabled / Disabled by choice
  const [isWhatsAppEnabled, setIsWhatsAppEnabled] = useState<boolean>(() => {
    try {
      const sysSettings = localStorage.getItem('SYSTEM_NOTIFICATION_SETTINGS');
      if (sysSettings) {
        const parsed = JSON.parse(sysSettings);
        if (typeof parsed.whatsAppCampaignApprovalEnabled === 'boolean') {
          return parsed.whatsAppCampaignApprovalEnabled;
        }
      }
    } catch {
      // fallback
    }
    const saved = localStorage.getItem('LAILAH_MKT_WHATSAPP_ENABLED');
    return saved !== null ? saved === 'true' : true;
  });

  // Email Notification: Default Mandatory (Always True)
  const isEmailEnabled = true;

  const [whatsappSenderNumber, setWhatsappSenderNumber] = useState('+966 50 882 1920');
  const [testPhoneNumber, setTestPhoneNumber] = useState('+966 55 123 4567');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('approval_request');

  // Logs of sent notifications
  const [notificationLogs, setNotificationLogs] = useState([
    {
      id: 1,
      recipient: 'شركة أطياف لتنظيم المعارض',
      phone: '+966 50 112 4433',
      email: 'marketing@atyaf-events.sa',
      channel: 'واتساب + بريد إلكتروني',
      event: 'طلب اعتماد حملة صيف 2026',
      status: 'تم التسليم والمشاهدة',
      timestamp: 'اليوم، 10:45 ص',
      deliveredWhatsapp: true,
      deliveredEmail: true
    },
    {
      id: 2,
      recipient: 'قاعة اللؤلؤة الكبرى',
      phone: '+966 55 998 7766',
      email: 'gm@luluahall.com',
      channel: 'بريد إلكتروني فقط (الواتساب معطل)',
      event: 'إشعار إطلاق وبدء البث المباشر',
      status: 'تم الإرسال للبريد بنجاح',
      timestamp: 'أمس، 04:20 م',
      deliveredWhatsapp: false,
      deliveredEmail: true
    }
  ]);

  const handleToggleWhatsApp = (enabled: boolean) => {
    setIsWhatsAppEnabled(enabled);
    localStorage.setItem('LAILAH_MKT_WHATSAPP_ENABLED', String(enabled));
    try {
      const sysSettings = localStorage.getItem('SYSTEM_NOTIFICATION_SETTINGS');
      const parsed = sysSettings ? JSON.parse(sysSettings) : {};
      parsed.whatsAppCampaignApprovalEnabled = enabled;
      localStorage.setItem('SYSTEM_NOTIFICATION_SETTINGS', JSON.stringify(parsed));
    } catch (e) {
      console.error(e);
    }
    showNotice(
      'success',
      enabled 
        ? 'تم تفعيل إشعارات الواتساب الآلية لاعتماد الحملات بنجاح!' 
        : 'تم تعطيل إشعارات الواتساب (سيبقى البريد الإلكتروني مفعلاً كخيار افتراضي إلزامياً).'
    );
  };

  const handleSendTestNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhoneNumber.trim()) {
      showNotice('error', 'يرجى إدخال رقم هاتف صحيح لإرسال الإشعار التجريبي.');
      return;
    }

    setIsSendingTest(true);
    setTimeout(() => {
      const newLog = {
        id: Date.now(),
        recipient: 'شريك تجريبي (مزود خدمة)',
        phone: testPhoneNumber,
        email: 'partner@example.com',
        channel: isWhatsAppEnabled ? 'واتساب + بريد إلكتروني' : 'بريد إلكتروني فقط (الواتساب معطل)',
        event: selectedTemplate === 'approval_request' ? 'طلب اعتماد حملة إعلانية' : 'إشعار بدء البث المباشر للنتائج',
        status: isWhatsAppEnabled ? 'تم الإرسال عبر WhatsApp Cloud API والبريد' : 'تم الإرسال عبر خادم البريد فقط',
        timestamp: 'الآن',
        deliveredWhatsapp: isWhatsAppEnabled,
        deliveredEmail: true
      };

      setNotificationLogs(prev => [newLog, ...prev]);
      setIsSendingTest(false);
      showNotice('success', `تم إرسال الإشعار التجريبي بنجاح إلى ${testPhoneNumber} والبريد الإلكتروني!`);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-right animate-in fade-in" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-l from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white border border-slate-800 shadow-xl space-y-3">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black border border-emerald-500/30 flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            أتمتة إشعارات الواتساب والبريد الإلكتروني لاعتماد الحملات
          </span>
          <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold">
            WhatsApp Cloud API + SMTP Relay
          </span>
        </div>

        <h3 className="text-xl md:text-2xl font-black text-white">
          إدارة قنوات التنبيه الفوري للمزود والوكالة
        </h3>
        <p className="text-slate-300 text-xs max-w-3xl leading-relaxed">
          إشعار الشريك فور نقل بطاقة الحملة إلى مرحلة <strong>"بانتظار موافقة المزود"</strong> مع زر موافقة فوري بضغطة واحدة، أو إشعاره ببدء البث المباشر للميزانية.
        </p>
      </div>

      {/* Toggles Control Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Notification Card (WITH TOGGLE) */}
        <div className={`p-5 rounded-2xl border transition-all space-y-4 ${
          isWhatsAppEnabled 
            ? 'bg-emerald-50/40 border-emerald-300 shadow-xs' 
            : 'bg-slate-50 border-slate-200 opacity-80'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-xl shadow-xs">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-base">إشعارات الواتساب (WhatsApp)</h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    isWhatsAppEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {isWhatsAppEnabled ? 'مفعّل حالياً' : 'مُعطّل'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  إرسال رسائل تفاعلية فورية للأرقام المعتمدة مع أزرار الموافقة المباشرة
                </p>
              </div>
            </div>

            {/* Toggle Switch */}
            <button
              onClick={() => handleToggleWhatsApp(!isWhatsAppEnabled)}
              className={`p-1.5 rounded-xl flex items-center gap-2 text-xs font-black transition-all cursor-pointer ${
                isWhatsAppEnabled 
                  ? 'bg-emerald-600 text-white shadow-xs' 
                  : 'bg-slate-300 text-slate-700 hover:bg-slate-400'
              }`}
            >
              <Power className="w-4 h-4" />
              <span>{isWhatsAppEnabled ? 'تعطيل' : 'تفعيل'}</span>
            </button>
          </div>

          <div className="pt-2 border-t border-emerald-200/60 text-xs space-y-2 text-slate-700">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-bold">رقم مرسل الوكالة المعتمد:</span>
              <span className="font-mono font-black text-emerald-800">{whatsappSenderNumber}</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-bold">بوابة الإرسال:</span>
              <span className="font-mono text-slate-700">Meta WhatsApp Cloud API v18.0</span>
            </div>
          </div>
        </div>

        {/* Email Notification Card (MANDATORY / DEFAULT) */}
        <div className="p-5 rounded-2xl bg-indigo-50/40 border border-indigo-200 shadow-xs space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-xs">
                <Mail className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-slate-900 text-base">إشعارات البريد الإلكتروني (Email)</h4>
                  <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                    افتراضي وإلزامي (Default)
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  تصل الفواتير وعروض الحملات وتأكيدات الدفع رسمياً عبر البريد المعتمد
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-indigo-100 text-indigo-800 text-xs font-black flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-indigo-600" />
              <span>مفعّل دائماً</span>
            </div>
          </div>

          <div className="pt-2 border-t border-indigo-200/60 text-xs space-y-2 text-slate-700">
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-bold">خادم الإرسال المعتمد:</span>
              <span className="font-mono font-black text-indigo-900">noreply@lailah.sa (DKIM & SPF Verified)</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="text-slate-500 font-bold">قوالب البريد:</span>
              <span className="text-slate-700">HTML responsive متوافق مع كافة الأجهزة</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Notification Simulator */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <h4 className="text-base font-black text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Send className="w-4 h-4 text-amber-500" />
          <span>محاكي إرسال إشعار تجريبي للشريك</span>
        </h4>

        <form onSubmit={handleSendTestNotification} className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">نوع الإشعار والقالب *</label>
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
            >
              <option value="approval_request">طلب اعتماد ميزانية وعرض حملة</option>
              <option value="campaign_launched">إشعار إطلاق الحملة وبدء البث المباشر</option>
              <option value="weekly_report">إرسال التقرير الأسبوعي والعائد ROAS</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">رقم الهاتف التجريبي *</label>
            <input
              type="text"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
              placeholder="+966 50 123 4567"
              className="w-full p-2.5 rounded-xl border border-slate-200 font-mono"
              required
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={isSendingTest}
              className="w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingTest ? 'جارِ الإرسال...' : 'إرسال إشعار تجريبي الآن'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Notification Dispatch History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-500" />
            <span>سجل الإشعارات المرسلة تلقائياً (Automated Notification Logs)</span>
          </h4>
          <span className="text-xs text-slate-500 font-bold">{notificationLogs.length} إشعار موثق</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-600 font-black">
              <tr>
                <th className="p-3">المستلم والجهة</th>
                <th className="p-3">القنوات المستخدمة</th>
                <th className="p-3">الحدث والإشعار</th>
                <th className="p-3">الحالة والتأكيد</th>
                <th className="p-3">التوقيت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-800 font-medium">
              {notificationLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3">
                    <strong className="block text-slate-900">{log.recipient}</strong>
                    <span className="text-[11px] text-slate-500 font-mono">{log.phone}</span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      log.deliveredWhatsapp ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                    }`}>
                      {log.channel}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-700">{log.event}</td>
                  <td className="p-3">
                    <span className="text-emerald-700 font-bold flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      {log.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500 font-mono">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
