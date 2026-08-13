import React, { useState } from 'react';
import { Calendar, Timer, Clock, History, X, HeadphonesIcon, Sparkles, MessageCircle, Send, ShieldCheck, Zap } from 'lucide-react';
import { formatSmartDate } from '../utils/dateUtils';

interface SupportManagementProps {
  userRole: string;
  supportTickets: any[];
  setSupportTickets: React.Dispatch<React.SetStateAction<any[]>>;
  currentProviderName: string;
  toggleCalendarType: () => void;
  calendarType: 'gregorian' | 'hijri';
  isCreateTicketModalOpen: boolean;
  setIsCreateTicketModalOpen: (open: boolean) => void;
  selectedTicket: any;
  setSelectedTicket: (ticket: any) => void;
  staffList: any[];
  activeTicketTimer: number | null;
  ticketMessages: any[];
  ticketReply: string;
  setTicketReply: (val: string) => void;
  handleSendReply: () => void;
  supportProviderForm: any;
  setSupportProviderForm: (val: any) => void;
  submitProviderTicket: () => void;
  showNotification: (type: 'success' | 'error' | 'warning' | 'info', message: string) => void;
}

export const SupportManagement: React.FC<SupportManagementProps> = ({
  userRole,
  supportTickets,
  setSupportTickets,
  currentProviderName,
  toggleCalendarType,
  calendarType,
  isCreateTicketModalOpen,
  setIsCreateTicketModalOpen,
  selectedTicket,
  setSelectedTicket,
  staffList,
  activeTicketTimer,
  ticketMessages,
  ticketReply,
  setTicketReply,
  handleSendReply,
  supportProviderForm,
  setSupportProviderForm,
  submitProviderTicket,
  showNotification,
}) => {
  const [isAiDrafting, setIsAiDrafting] = useState(false);
  const [whatsappTemplate, setWhatsappTemplate] = useState('');

  const visibleTickets = userRole === 'provider' 
    ? supportTickets.filter(t => t.customerName === currentProviderName) 
    : supportTickets;

  // Format serial number as SRV-26-XXXXXXXXXX
  const getTicketSerial = (ticket: any) => {
    if (ticket.serialNumber) return ticket.serialNumber;
    const numStr = String(ticket.id || 1).replace(/\D/g, '').padStart(10, '0');
    return `SRV-26-${numStr}`;
  };

  const generateAiCopilotReply = async () => {
    if (!selectedTicket) return;
    setIsAiDrafting(true);
    try {
      const res = await fetch('/api/ai/support-copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketSubject: selectedTicket.title,
          customerName: selectedTicket.customerName,
          ticketDetails: selectedTicket.description,
          category: selectedTicket.department
        })
      });
      const data = await res.json();
      if (data.success && data.data) {
        setTicketReply(data.data.suggestedReply);
        setWhatsappTemplate(data.data.whatsappTemplate);
        showNotification('success', '🤖 تم صياغة الرد الذكي وقالب الواتساب بواسطة مساعد الدعم الفني!');
      } else {
        showNotification('error', 'تعذر توليد الرد الذكي، حاول مجدداً.');
      }
    } catch (e) {
      showNotification('error', 'حدث خطأ في الاتصال بالذكاء الاصطناعي للدعم الفني.');
    } finally {
      setIsAiDrafting(false);
    }
  };

  const openWhatsAppDirect = () => {
    if (!selectedTicket) return;
    const textToShare = whatsappTemplate || `حياك الله أ/ ${selectedTicket.customerName} 🌸\nبخصوص طلبك رقم (${getTicketSerial(selectedTicket)}): تم معالجة التذكرة بنجاح عبر منصة ليلة.`;
    const encoded = encodeURIComponent(textToShare);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
    showNotification('info', '💬 تم فتح ميزة الربط المباشر مع WhatsApp لتزويد العميل بالتحديث.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 text-right font-sans" dir="rtl">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black text-slate-800">مركز المحادثات وتذاكر الدعم والربط مع WhatsApp</h2>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2.5 py-1 rounded-full border border-emerald-200">
              محدث بـ WhatsApp API & AI 🤖
            </span>
          </div>
          <p className="text-slate-500 text-xs mt-1">
            {userRole === 'provider' 
              ? 'تواصل المباشر مع فريق الدعم الفني وإدارة التذاكر والتراسل الفوري عبر الواتساب' 
              : 'إدارة التذاكر وتوليد الردود بـ الذكاء الاصطناعي والتواصل الفوري مع العملاء ومتابعة SLA'}
          </p>
        </div>
        <div className="flex gap-3 items-center flex-wrap">
          <button 
            onClick={toggleCalendarType}
            className="bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4 text-slate-500" />
            {calendarType === 'gregorian' ? 'التقويم الهجري' : 'التقويم الميلادي'}
          </button>
          {userRole === 'admin' ? (
            <>
              <div className="bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-100">
                <div className="text-[10px] text-emerald-700 font-bold">متوسط الاستجابة الأولى (FRT)</div>
                <div className="font-black text-base text-emerald-800">12 دقيقة ⚡</div>
              </div>
              <div className="bg-amber-50 px-3.5 py-2 rounded-xl border border-amber-100">
                <div className="text-[10px] text-amber-700 font-bold">التذاكر المفتوحة</div>
                <div className="font-black text-base text-amber-800">{visibleTickets.filter(t => t.status === 'مفتوحة').length}</div>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setIsCreateTicketModalOpen(true)} 
              className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl shadow-sm hover:bg-indigo-700 font-bold text-xs transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              إنشاء تذكرة دعم جديدة
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[650px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50/80 font-black text-slate-800 text-xs flex justify-between items-center shrink-0">
            <span>قائمة التذاكر التشغيلية ({visibleTickets.length})</span>
            <span className="text-[10px] text-slate-400 font-mono">صيغة الترقيم: SRV-26-XXXXXXXXXX</span>
          </div>
          <div className="overflow-y-auto flex-1 p-3 space-y-2.5">
            {visibleTickets.map(ticket => {
              const slaDate = new Date(ticket.slaDeadline);
              const isSlaBreached = slaDate.getTime() < Date.now();
              const isSlaWarning = slaDate.getTime() > Date.now() && slaDate.getTime() < Date.now() + 60 * 60 * 1000;
              const serial = getTicketSerial(ticket);

              return (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-right ${
                    selectedTicket?.id === ticket.id 
                      ? 'bg-indigo-50/80 border-indigo-300 shadow-2xs' 
                      : 'bg-white border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                        ticket.status === 'مخالفة الأولوية' 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : ticket.status === 'مفتوحة' 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {ticket.status}
                      </span>
                      {ticket.priority && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-extrabold ${
                          ticket.priority === 'أولوية قصوى' 
                            ? 'bg-rose-600 text-white animate-pulse' 
                            : ticket.priority === 'عالية جداً' 
                            ? 'bg-amber-400 text-slate-900' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      )}
                      {(isSlaBreached || isSlaWarning) && ticket.status !== 'مغلقة' && (
                        <span 
                          className={`text-[9px] px-1.5 py-0.5 rounded font-black text-white ${
                            isSlaBreached ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
                          }`} 
                          title="تنبيه وقت الاستجابة (SLA)"
                        >
                          {isSlaBreached ? 'SLA متعثر !' : 'SLA قريب'}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-400">
                      {serial}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs mb-1">{ticket.title}</h4>
                  <div className="text-[11px] text-slate-500 truncate mb-2">{ticket.description}</div>
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-600 font-semibold">بواسطة: {ticket.customerName}</span>
                    <span className={`px-2 py-0.5 rounded font-bold ${
                      ticket.userPlan === 'VIP' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ticket.userPlan || 'باقة معيارية'}
                    </span>
                  </div>
                </div>
              );
            })}
            {visibleTickets.length === 0 && <div className="text-center text-slate-400 py-16 text-xs">لا توجد تذاكر حالياً</div>}
          </div>
        </div>

        {/* Chat Window & AI Copilot */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {selectedTicket ? (
            <>
              {/* Header */}
              <div className="p-4 border-b border-slate-100 bg-slate-50/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-black text-base text-slate-800">
                      {selectedTicket.title}
                    </h3>
                    <span className="bg-indigo-100 text-indigo-700 text-[10px] font-mono font-black px-2 py-0.5 rounded-full border border-indigo-200">
                      {getTicketSerial(selectedTicket)}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap gap-3 items-center">
                    <span>القسم: <strong>{selectedTicket.department}</strong></span>
                    <div className="flex items-center gap-1.5">
                      <span>الموظف:</span>
                      {userRole === 'admin' ? (
                        <select 
                          value={selectedTicket.assignedAgent || ''} 
                          onChange={(e) => {
                            const newAgent = e.target.value;
                            setSupportTickets(supportTickets.map(t => t.id === selectedTicket.id ? {...t, assignedAgent: newAgent} : t));
                            showNotification('success', `تم تعيين التذكرة للموظف: ${newAgent}`);
                          }}
                          className="p-1 rounded border border-slate-200 text-xs outline-none bg-white font-bold text-blue-600 cursor-pointer"
                        >
                          <option value="">-- تحويل يدوي --</option>
                          {staffList.map((s: any, idx) => (
                            <option key={`ticket-handover-${s.id}-${idx}`} value={s.name}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span className="font-bold">{selectedTicket.assignedAgent || 'فريق الدعم الموحد'}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 text-[10px]">
                      <Timer className="w-3 h-3 text-indigo-500" />
                      <span>زمن المعالجة: {activeTicketTimer || 0} دقيقة</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={openWhatsAppDirect}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all shadow-2xs flex items-center gap-1 cursor-pointer"
                    title="تراسل مباشر وتزويد العميل بالتحديث عبر واتساب"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>

                  <button 
                    onClick={() => {
                      setSupportTickets(supportTickets.map(t => t.id === selectedTicket.id ? {...t, status: 'مغلقة'} : t));
                      showNotification('success', 'تم إغلاق التذكرة بنجاح');
                    }}
                    className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    إغلاق التذكرة
                  </button>
                </div>
              </div>

              {/* Messages Body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-slate-50/50">
                {ticketMessages.map(msg => {
                  const isMyMessage = userRole === 'provider' ? msg.senderType === 'عميل' : msg.senderType === 'موظف';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-slate-500 font-bold">{msg.senderName}</span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed ${
                        isMyMessage ? 'bg-indigo-600 text-white rounded-tr-none shadow-2xs' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-2xs'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions Footer */}
              <div className="p-4 border-t border-slate-100 bg-white shrink-0 space-y-3">
                {/* AI Copilot Quick Toolbar */}
                <div className="flex items-center justify-between bg-indigo-50/70 p-2 rounded-xl border border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600 animate-spin" />
                    <span className="text-[11px] font-bold text-indigo-900">مساعد الدعم الذكي (AI Copilot)</span>
                  </div>
                  <button
                    onClick={generateAiCopilotReply}
                    disabled={isAiDrafting}
                    className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-black transition-all flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <span>{isAiDrafting ? 'جاري الصياغة الذكية...' : '🤖 توليد رد احترافي بالذكاء الاصطناعي'}</span>
                  </button>
                </div>

                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={ticketReply}
                    onChange={e => setTicketReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                    placeholder="اكتب ردك هنا أو استخدم توليد الرد بالذكاء الاصطناعي..." 
                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-right text-xs"
                  />
                  <button 
                    onClick={handleSendReply} 
                    className="px-5 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer text-xs flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>إرسال الرد</span>
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
              <HeadphonesIcon className="w-16 h-16 mb-4 text-slate-300 animate-bounce" />
              <h4 className="font-bold text-slate-700 text-sm">لم يتم تحديد تذكرة دعم</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">اختر إحدى التذاكر من القائمة الجانبية لبدء المحادثة أو إنشاء قالب واتساب آلي.</p>
            </div>
          )}
        </div>
      </div>

      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 relative text-right font-sans" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-800">إنشاء تذكرة دعم فني جديدة</h2>
              </div>
              <button 
                onClick={() => setIsCreateTicketModalOpen(false)} 
                className="bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-200 shadow-2xs p-1.5 rounded-full transition-all duration-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">عنوان التذكرة</label>
                <input 
                  type="text" 
                  value={supportProviderForm.title || ''} 
                  onChange={e => setSupportProviderForm({...supportProviderForm, title: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-right" 
                  placeholder="مثال: استفسار بخصوص مستحقات الحجز SRV-26-0000000001" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">القسم المعني</label>
                <select 
                  value={supportProviderForm.department || ''} 
                  onChange={e => setSupportProviderForm({...supportProviderForm, department: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-right cursor-pointer"
                >
                  <option value="تقني">الدعم التقني والحلول البرمجية</option>
                  <option value="مالي">الإدارة المالية والعمولات</option>
                  <option value="اشتراكات">اشتراكات الباقات وخدمات التسويق</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">وصف المشكلة بالتفصيل</label>
                <textarea 
                  value={supportProviderForm.description || ''} 
                  onChange={e => setSupportProviderForm({...supportProviderForm, description: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none h-28 resize-none text-right" 
                  placeholder="اشرح المشكلة بالتفصيل..." 
                />
              </div>
              <button 
                onClick={submitProviderTicket} 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer text-xs shadow-xs"
              >
                إرسال التذكرة وحفظ الترقيم التسلسلي SRV-26
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

