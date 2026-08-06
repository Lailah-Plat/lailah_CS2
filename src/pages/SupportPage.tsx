import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { 
  MessageSquare, Plus, Search, Send, History, User, Clock, LifeBuoy, 
  ShieldAlert, CheckCircle2, X, ChevronLeft, Calendar, AlertCircle, Wrench, RefreshCw
} from 'lucide-react';

export default function SupportPage() {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const getSubForUser = (userObj: any) => {
    let provName = '';
    if (userObj && (userObj.role === 'provider' || userObj.role === 'Provider' || userObj.role === 'مزود') && userObj.name) {
      provName = userObj.name;
    }
    const key = provName ? `provider_subscription_${provName}` : 'provider_subscription';
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  };

  const [providerSubscription, setProviderSubscription] = useState<any>(() => {
    return getSubForUser(user);
  });

  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<any | null>(null);
  const [ticketMessages, setTicketMessages] = useState<any[]>([]);
  const [ticketReply, setTicketReply] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  // New ticket form state
  const [newTicketForm, setNewTicketForm] = useState({
    title: '',
    description: '',
    department: 'تقني'
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Sync user and subscription changes
  useEffect(() => {
    const syncUser = () => {
      let loggedInUser = null;
      try {
        const saved = localStorage.getItem('currentUser');
        loggedInUser = saved ? JSON.parse(saved) : null;
        setUser(loggedInUser);
      } catch {}
      try {
        setProviderSubscription(getSubForUser(loggedInUser));
      } catch {}
    };
    window.addEventListener('storage', syncUser);
    window.addEventListener('user-logged-in', syncUser);
    return () => {
      window.removeEventListener('storage', syncUser);
      window.removeEventListener('user-logged-in', syncUser);
    };
  }, []);

  // Fetch tickets
  const fetchTickets = () => {
    setLoading(true);
    fetch('/api/support/tickets')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          // If admin, show all. If user is customer or provider, filter where they are the owner
          if (user) {
            const role = (user.role || '').toLowerCase();
            const isAdmin = role.includes('admin') || role.includes('مدير') || role.includes('مشرف');
            if (isAdmin) {
              setTickets(data);
            } else {
              // Match by name or other identifier
              const nameLower = (user.name || '').toLowerCase();
              const filtered = data.filter((t: any) => 
                (t.customerName || '').toLowerCase() === nameLower
              );
              setTickets(filtered);
            }
          } else {
            setTickets([]);
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  // Fetch messages when selected ticket changes
  useEffect(() => {
    if (selectedTicket) {
      fetch(`/api/support/tickets/${selectedTicket.id}/messages`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setTicketMessages(data);
          }
        })
        .catch(() => {});
    } else {
      setTicketMessages([]);
    }
  }, [selectedTicket]);

  // Automatically scroll chat window to bottom
  useEffect(() => {
    if (chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ticketMessages]);

  const handleSendReply = async () => {
    if (!ticketReply.trim() || !selectedTicket || !user) return;
    const replyText = ticketReply;
    setTicketReply('');

    try {
      const isProvider = (user.role || '').toLowerCase().includes('provider') || (user.role || '').toLowerCase().includes('مزود');
      const isAdmin = (user.role || '').toLowerCase().includes('admin') || (user.role || '').toLowerCase().includes('مدير') || (user.role || '').toLowerCase().includes('مشرف');
      
      const senderType = isAdmin ? 'موظف' : 'عميل';

      const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: replyText,
          senderName: user?.name || 'مستخدم النظام',
          senderType: senderType
        })
      });

      if (res.ok) {
        // Reload messages
        const data = await res.json();
        if (data.reply) {
          setTicketMessages(prev => [...prev, data.reply]);
        }
        // Refresh ticket catalog to update status
        fetch('/api/support/tickets')
          .then(r => r.json())
          .then(ticketList => {
            if (Array.isArray(ticketList)) {
              const role = (user.role || '').toLowerCase();
              const isAdminUser = role.includes('admin') || role.includes('مدير') || role.includes('مشرف');
              const filtered = isAdminUser ? ticketList : ticketList.filter((t: any) => (t.customerName || '').toLowerCase() === (user.name || '').toLowerCase());
              setTickets(filtered);
              const updated = ticketList.find(t => t.id === selectedTicket.id);
              if (updated) setSelectedTicket(updated);
            }
          });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicketForm.title.trim() || !newTicketForm.description.trim() || !user) {
      setErrorMsg('فضلاً، أكمل جميع حقول التذكرة');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const isProvider = (user.role || '').toLowerCase().includes('provider') || (user.role || '').toLowerCase().includes('مزود');
      let plan = 'الأساسية';
      if (isProvider) {
        plan = providerSubscription?.packageName || 'الاحترافية';
      } else {
        plan = 'عميل';
      }

      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTicketForm.title,
          description: newTicketForm.description,
          department: newTicketForm.department,
          userPlan: plan,
          customerName: user.name || 'مستخدم النظام'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setIsCreateModalOpen(false);
        setNewTicketForm({ title: '', description: '', department: 'تقني' });
        fetchTickets();
        if (data.ticket) {
          setSelectedTicket(data.ticket);
        }
      } else {
        setErrorMsg('حدث خطأ أثناء إرسال طلبك. يرجى المحاولة لاحقاً.');
      }
    } catch {
      setErrorMsg('نعتذر، حدث تعثر بالاتصال بالخادم.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTickets = tickets.filter(t => 
    (t.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.department || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-10 mt-6 animate-in fade-in duration-300">
        
        {/* Breadcrumb / Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
              <span className="hover:text-blue-950 cursor-pointer" onClick={() => window.location.href = '/'}>الرئيسية</span>
              <ChevronLeft className="w-3 h-3" />
              <span className="font-semibold text-amber-500">مركز الدعم والتذاكر</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
              <LifeBuoy className="w-8 h-8 text-amber-500" />
              حقيبة الدعم الفني والمساعدة
            </h1>
            <p className="text-slate-500 text-sm mt-1">تواصل مع موظفي الدعم التقني والمالي لمساعدتك في حال وجود أي إشكالات، وسيكون الرد خلال 24 ساعة نرجو التحلي بالصبر، ونسعى لخدمة أفضل</p>
          </div>
          
          {user && (
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-extrabold text-sm rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>إنشاء تذكرة دعم جديدة</span>
            </button>
          )}
        </div>

        {/* Not Logged In banner */}
        {!user ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center max-w-2xl mx-auto my-12 shadow-sm">
            <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500 border border-amber-200">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-950 mb-2">يتطلب تسجيل الدخول</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-md mx-auto">
              لرؤية تذاكر الدعم السابقة وتتبع طلباتك أو لإنشاء تذكرة فنية مخصصة، يرجى تسجيل الدخول لحسابك أولاً.
            </p>
            <button 
              onClick={() => {
                // Open login modal via custom header trigger
                const buttons = document.getElementsByTagName('button');
                for (let i = 0; i < buttons.length; i++) {
                  if (buttons[i].textContent?.includes('تسجيل الدخول')) {
                    buttons[i].click();
                    break;
                  }
                }
              }}
              className="px-8 py-3 bg-blue-950 text-white font-extrabold text-sm rounded-xl hover:bg-blue-900 transition-all shadow-md active:scale-95"
            >
              متابعة لتسجيل الدخول
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Left/Right structural separation: list column */}
            <div className="lg:col-span-1 bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[650px]">
              
              {/* Search ticket bar */}
              <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm">التذاكر الخاصة بك ({filteredTickets.length})</span>
                  <button 
                    onClick={fetchTickets}
                    className="p-1 rounded bg-white hover:bg-slate-100 text-slate-500 hover:text-blue-950 border border-slate-200"
                    title="تحديث القائمة"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="ابحث برقم التذكرة أو الموضوع..."
                    className="w-full pr-10 pl-3 py-2 bg-white text-slate-800 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-amber-500 outline-none"
                  />
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                </div>
              </div>

              {/* Scrollable list content */}
              <div className="overflow-y-auto flex-grow p-3 space-y-3 bg-slate-50/50">
                {filteredTickets.map(ticket => {
                  const isSelected = selectedTicket?.id === ticket.id;
                  const isSlaBreached = ticket.slaDeadline ? new Date(ticket.slaDeadline).getTime() < Date.now() : false;
                  
                  return (
                    <div
                      key={ticket.id}
                      id={`ticket-${ticket.id}`}
                      onClick={() => setSelectedTicket(ticket)}
                      className={`p-4 rounded-2xl cursor-pointer border text-right transition-all duration-200 active:scale-98 ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 shadow-sm' 
                          : 'bg-white border-slate-200/60 hover:border-slate-300 shadow-[0_1px_3px_rgba(0,0,0,0.02)]'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                            ticket.status === 'مغلقة' ? 'bg-slate-100 text-slate-600' :
                            ticket.status === 'مفتوحة' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {ticket.status}
                          </span>
                          {ticket.priority && (
                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                              ticket.priority === 'أولوية قصوى' ? 'bg-rose-600 text-white animate-pulse' :
                              ticket.priority === 'عالية' || ticket.priority === 'عالية جداً' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {ticket.priority}
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('ar-SA') : ''}
                        </span>
                      </div>

                      <h4 className="font-extrabold text-slate-900 text-xs sm:text-sm mb-1 line-clamp-1">{ticket.title}</h4>
                      <p className="text-slate-500 text-xs mb-3 line-clamp-2 leading-relaxed">{ticket.description}</p>
                      
                      <div className="flex justify-between items-center text-[10px] border-t border-slate-100/70 pt-2 bg-transparent">
                        <span className="text-slate-400">القسم: <strong className="text-slate-700">{ticket.department}</strong></span>
                        <span className="text-slate-400">رقم: <strong className="text-slate-700 font-mono">{ticket.id}</strong></span>
                      </div>
                    </div>
                  );
                })}
                
                {filteredTickets.length === 0 && (
                  <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                    <MessageSquare className="w-10 h-10 mb-2 text-slate-300" />
                    <p className="text-xs">لا توجد سجلات تذاكر دعم متاحة</p>
                  </div>
                )}
              </div>
            </div>

            {/* Conversation view columns */}
            <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
              {selectedTicket ? (
                <>
                  {/* Selected Header */}
                  <div className="p-4 border-b border-slate-100 bg-slate-50 shrink-0 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-base sm:text-lg text-slate-900">{selectedTicket.title}</h3>
                        <span className="text-xs font-mono text-slate-400 bg-slate-200/50 px-2 py-0.5 rounded-md">#{selectedTicket.id}</span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>القسم: <strong className="text-slate-800 font-medium">{selectedTicket.department}</strong></span>
                        <span>•</span>
                        <span>الموظف المعين: <strong className="text-slate-800 font-medium">{selectedTicket.assignedAgent || 'جاري التعيين...'}</strong></span>
                      </div>
                    </div>
                    {selectedTicket.status !== 'مغلقة' && (
                      <button
                        onClick={async () => {
                          // Change status locally first or make API
                          try {
                            const res = await fetch(`/api/support/tickets/${selectedTicket.id}/reply`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({
                                message: 'تم إغلاق التذكرة من قبل العميل',
                                senderName: user.name || 'العميل',
                                senderType: 'عميل'
                              })
                            });
                            if (res.ok) {
                              fetchTickets();
                              setSelectedTicket(prev => prev ? { ...prev, status: 'مغلقة' } : null);
                            }
                          } catch {}
                        }}
                        className="px-3 py-1.5 border border-slate-200 hover:bg-red-50 hover:text-red-600 transition-all font-bold text-xs rounded-xl"
                      >
                        إغلاق التذكرة ✔
                      </button>
                    )}
                  </div>

                  {/* Messages flow */}
                  <div className="flex-grow overflow-y-auto p-6 space-y-4 bg-slate-50/20">
                    
                    {/* Initial issue specification card */}
                    <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl mb-6">
                      <div className="flex items-center gap-2 mb-2 text-amber-600 font-semibold text-xs">
                        <AlertCircle className="w-4 h-4" />
                        <span>تفاصيل المشكلة المرفوعة في التذكرة الرئيسية:</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-sans">{selectedTicket.description}</p>
                    </div>

                    {ticketMessages.map(msg => {
                      const isMe = (msg.senderName || '').toLowerCase() === (user?.name || '').toLowerCase() || msg.senderType === 'عميل';
                      return (
                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-start' : 'items-end'}`}>
                          <div className="flex items-center gap-2 mb-1 pl-1">
                            <span className="text-[10px] font-extrabold text-slate-800">{msg.senderName}</span>
                            <span className="text-[9px] text-slate-400 font-mono">
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </span>
                          </div>
                          <div className={`p-3.5 rounded-2xl max-w-[85%] text-xs leading-relaxed font-sans ${
                            isMe 
                              ? 'bg-blue-950 text-white rounded-tl-none' 
                              : 'bg-white border border-slate-200 text-slate-800 rounded-tr-none shadow-sm'
                          }`}>
                            {msg.message}
                          </div>
                        </div>
                      );
                    })}
                    <div ref={chatBottomRef} />
                  </div>

                  {/* Reply text entry bar */}
                  <div className="p-4 border-t border-slate-100 bg-white bg-gradient-to-r shrink-0">
                    {selectedTicket.status === 'مغلقة' ? (
                      <div className="text-center py-2 text-slate-400 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold">
                        تم إغلاق هذه التذكرة. لا يمكن إرسال ردود إضافية.
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={ticketReply}
                          onChange={e => setTicketReply(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && handleSendReply()}
                          placeholder="اكتب ردك وملاحظاتك المفصّلة هنا للتمكن المباشر من خدمتك..."
                          className="flex-1 px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 focus:bg-white outline-none text-slate-800 transition-all font-sans"
                        />
                        <button
                          onClick={handleSendReply}
                          disabled={!ticketReply.trim()}
                          className="px-5 py-3 bg-blue-950 hover:bg-blue-900 disabled:bg-slate-200 text-white font-black text-xs rounded-2xl transition-colors cursor-pointer flex items-center gap-2"
                        >
                          <Send className="w-3.5 h-3.5 transform rotate-180" />
                          <span>إرسال</span>
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-300">
                    <LifeBuoy className="w-8 h-8" />
                  </div>
                  <h4 className="font-extrabold text-slate-800 text-sm mb-1">لم يتم اختيار أي تذكرة</h4>
                  <p className="text-xs text-slate-500 max-w-sm">من فضلك اختر تذكرة من القائمة اليمنى لمتابعة تقدمها والمراسلة مع فريق الدعم الفني، أو قم بإنشاء تذكرة جديدة.</p>
                </div>
              )}
            </div>

          </div>
        )}

      </main>

      {/* CREATE TICKET MODAL */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 relative" dir="rtl">
            
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-lg font-extrabold text-slate-900">فتح تذكرة دعم مخصصة</h2>
              <button 
                onClick={() => setIsCreateModalOpen(false)} 
                className="bg-white hover:bg-slate-100 text-slate-400 hover:text-red-500 border border-slate-200 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-right">
              {errorMsg && (
                <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-center gap-2 font-bold">
                  <ShieldAlert className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">عنوان التذكرة التوضيحي <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={newTicketForm.title}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: مشكلة في تسجيل الدخول أو تحديث السعر..."
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 focus:bg-white outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">القسم المعني بالتذكرة <span className="text-red-500">*</span></label>
                <select
                  value={newTicketForm.department}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 focus:bg-white outline-none"
                >
                  <option value="تقني">دعم تقني وفني (مشاكل تقارير أو عرض أو قاعات)</option>
                  <option value="مالي">دعم مالي ومحاسبي (مشاكل حجز أو عمولات أو سداد)</option>
                  <option value="إداري">دعم إداري وتنظيمي (تعديل عقود أو باقات واشتراكات)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">وصف دقيق للمشكلة والطلب <span className="text-red-500">*</span></label>
                <textarea
                  required
                  rows={4}
                  value={newTicketForm.description}
                  onChange={e => setNewTicketForm(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="سرد تفاصيل الخطأ أو الطلب، والخطوات اللازمة لإعادة محاكاته حتى يتمكن الفريق الفني من إنجازه في أسرع وقت..."
                  className="w-full px-4 py-3 text-xs bg-slate-50 border border-slate-200 rounded-2xl focus:border-amber-500 focus:bg-white outline-none leading-relaxed font-sans"
                />
              </div>

              <div className="pt-3 flex gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 disabled:from-slate-300 disabled:to-slate-300 text-slate-900 font-extrabold text-xs rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer"
                >
                  {isSubmitting ? 'جاري الإرسال البطيء...' : 'إرسال التذكرة فوراً 🚀'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
