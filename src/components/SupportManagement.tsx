import React from 'react';
import { Calendar, Timer, Clock, History, X, HeadphonesIcon } from 'lucide-react';
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
  const visibleTickets = userRole === 'provider' 
    ? supportTickets.filter(t => t.customerName === currentProviderName) 
    : supportTickets;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-7xl mx-auto pb-10 text-right" dir="rtl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">نظام الدعم الفني والتذاكر</h2>
          <p className="text-slate-500 mt-1">
            {userRole === 'provider' 
              ? 'تواصل مع فريق الدعم الفني لحل مشاكلك واستفساراتك' 
              : 'إدارة التذاكر والتواصل مع العملاء ومتابعة مؤشرات أداء الـ SLA'}
          </p>
        </div>
        <div className="flex gap-4 items-center">
          <button 
            onClick={toggleCalendarType}
            className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 flex items-center gap-2 transition-all cursor-pointer"
          >
            <Calendar className="w-4 h-4" />
            {calendarType === 'gregorian' ? 'التحويل للهجري' : 'التحويل للميلادي'}
          </button>
          {userRole === 'admin' ? (
            <>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <div className="text-xs text-slate-500">متوسط زمن الاستجابة الأول (FRT)</div>
                <div className="font-bold text-lg text-emerald-600">45 دقيقة</div>
              </div>
              <div className="bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-100">
                <div className="text-xs text-slate-500">إجمالي التذاكر المفتوحة</div>
                <div className="font-bold text-lg text-amber-600">{visibleTickets.filter(t => t.status === 'مفتوحة').length}</div>
              </div>
            </>
          ) : (
            <button 
              onClick={() => setIsCreateTicketModalOpen(true)} 
              className="bg-indigo-600 text-white px-4 py-2 rounded-xl shadow-sm hover:bg-indigo-700 font-bold transition-colors cursor-pointer"
            >
              إنشاء تذكرة دعم
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-800 shrink-0">
            قائمة التذاكر
          </div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {visibleTickets.map(ticket => {
              const slaDate = new Date(ticket.slaDeadline);
              const isSlaBreached = slaDate.getTime() < Date.now();
              const isSlaWarning = slaDate.getTime() > Date.now() && slaDate.getTime() < Date.now() + 60 * 60 * 1000;
              return (
                <div 
                  key={ticket.id} 
                  onClick={() => setSelectedTicket(ticket)}
                  className={`p-4 rounded-xl cursor-pointer border transition-all ${
                    selectedTicket?.id === ticket.id 
                      ? 'bg-indigo-50 border-indigo-200' 
                      : 'bg-white border-slate-100 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-xs px-2 py-1 rounded-md font-bold ${
                        ticket.status === 'مخالفة الأولوية' 
                          ? 'bg-red-100 text-red-700' 
                          : ticket.status === 'مفتوحة' 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {ticket.status}
                      </span>
                      {ticket.priority && (
                        <span className={`text-[10px] px-2 py-1 rounded-md font-bold ${
                          ticket.priority === 'أولوية قصوى' 
                            ? 'bg-rose-600 text-white animate-pulse' 
                            : ticket.priority === 'عالية جداً' 
                            ? 'bg-amber-400 text-slate-900 font-extrabold' 
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {ticket.priority}
                        </span>
                      )}
                      {(isSlaBreached || isSlaWarning) && ticket.status !== 'مغلقة' && (
                        <span 
                          className={`text-[10px] px-2 py-1 rounded-md font-bold text-white ${
                            isSlaBreached ? 'bg-red-600 animate-pulse' : 'bg-orange-500'
                          }`} 
                          title="تنبيه وقت الاستجابة (SLA)"
                        >
                          {isSlaBreached ? 'SLA متعثر !' : 'SLA قريب'}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500">
                      {new Date(ticket.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm mb-1">{ticket.title}</h4>
                  <div className="text-xs text-slate-500 truncate mb-3">{ticket.description}</div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-600 font-medium">بواسطة: {ticket.customerName}</span>
                    <span className={`px-2 py-0.5 rounded ${
                      ticket.userPlan === 'VIP' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {ticket.userPlan}
                    </span>
                  </div>
                </div>
              );
            })}
            {visibleTickets.length === 0 && <div className="text-center text-slate-500 mt-10">لا توجد تذاكر حالياً</div>}
          </div>
        </div>

        {/* Chat Window */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[600px]">
          {selectedTicket ? (
            <>
              <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center shrink-0">
                <div>
                  <h3 className="font-bold text-lg text-slate-800">
                    {selectedTicket.title}{' '}
                    <span className="text-sm font-normal text-slate-500 ml-2">({selectedTicket.id})</span>
                  </h3>
                  <div className="text-sm text-slate-600 mt-1 flex flex-wrap gap-4">
                    <span>القسم: {selectedTicket.department}</span>
                    <div className="flex items-center gap-2">
                      <span>الموظف المعين:</span>
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
                        <span className="font-bold">{selectedTicket.assignedAgent || 'غير محدد'}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                      <Timer className="w-3 h-3 text-indigo-500" />
                      <span>وقت الإنجاز حتى الآن: {activeTicketTimer || 0} دقيقة</span>
                    </div>

                    <span className={`${new Date(selectedTicket.slaDeadline).getTime() < Date.now() ? 'text-red-650' : 'text-amber-600'} flex items-center gap-1 font-bold`}>
                      <Clock className="w-3 h-3" />
                      SLA: {formatSmartDate(selectedTicket.slaDeadline, calendarType)}
                    </span>
                    {selectedTicket.responseTime && (
                      <span className="text-emerald-650 flex items-center gap-1 font-bold italic bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                        <History className="w-3 h-3" />
                        سرعة الرد: {selectedTicket.responseTime} دقيقة
                      </span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setSupportTickets(supportTickets.map(t => t.id === selectedTicket.id ? {...t, status: 'مغلقة'} : t));
                    showNotification('success', 'تم إغلاق التذكرة بنجاح');
                  }}
                  className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-705 cursor-pointer"
                >
                  إغلاق التذكرة
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                {ticketMessages.map(msg => {
                  const isMyMessage = userRole === 'provider' ? msg.senderType === 'عميل' : msg.senderType === 'موظف';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isMyMessage ? 'items-end' : 'items-start'}`}>
                      <div className="flex items-end gap-2 mb-1">
                        <span className="text-xs text-slate-500">{msg.senderName}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(msg.createdAt).toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'})}
                        </span>
                      </div>
                      <div className={`p-4 rounded-2xl max-w-[80%] ${
                        isMyMessage ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-sm'
                      }`}>
                        {msg.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 border-t border-slate-100 bg-white shrink-0">
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={ticketReply}
                    onChange={e => setTicketReply(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                    placeholder="اكتب ردك هنا..." 
                    className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-right"
                  />
                  <button 
                    onClick={handleSendReply} 
                    className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors cursor-pointer"
                  >
                    إرسال
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <HeadphonesIcon className="w-16 h-16 mb-4 text-slate-300" />
              <p>اختر تذكرة من القائمة لعرض المحادثة والرد</p>
            </div>
          )}
        </div>
      </div>

      {isCreateTicketModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden animate-in zoom-in-95 duration-200 relative text-right" dir="rtl">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">تذكرة دعم فني جديدة</h2>
              <button 
                onClick={() => setIsCreateTicketModalOpen(false)} 
                className="absolute top-4 xl:top-6 left-4 xl:left-6 z-[60] bg-white text-slate-400 hover:text-red-500 hover:bg-red-50 border border-slate-100 shadow-sm p-2 rounded-full transition-all duration-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-705 mb-1">عنوان التذكرة</label>
                <input 
                  type="text" 
                  value={supportProviderForm.title || ''} 
                  onChange={e => setSupportProviderForm({...supportProviderForm, title: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-right" 
                  placeholder="مثال: مشكلة في استلاف المستحقات" 
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-705 mb-1">القسم المعني</label>
                <select 
                  value={supportProviderForm.department || ''} 
                  onChange={e => setSupportProviderForm({...supportProviderForm, department: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none bg-white text-right cursor-pointer"
                >
                  <option value="تقني">الدعم التقني</option>
                  <option value="مالي">الإدارة المالية</option>
                  <option value="اشتراكات">الاشتراكات</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-705 mb-1">وصف المشكلة بالتفصيل</label>
                <textarea 
                  value={supportProviderForm.description || ''} 
                  onChange={e => setSupportProviderForm({...supportProviderForm, description: e.target.value})} 
                  className="w-full p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none h-32 resize-none text-right" 
                  placeholder="اشرح المشكلة بالتفصيل وموعد حدوثها..." 
                />
              </div>
              <button 
                onClick={submitProviderTicket} 
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-colors cursor-pointer"
              >
                إرسال التذكرة للإدارة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
