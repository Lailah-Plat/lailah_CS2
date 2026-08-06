import React, { useState, useEffect, useRef } from 'react';
import { safeSetLocalStorage } from '../../utils/safeStorage';
import { 
  MessageSquare, Headset, Clock, Mail, ShieldAlert, AlertTriangle, Ban, Send, 
  Trash2, Info, Plus, Inbox, FileText, Settings, Paperclip, UploadCloud, AlertCircle, RefreshCw, Crown, X, Sparkles
} from 'lucide-react';

export const MessagesSection = (props: any) => {
  const {
    userRole,
    serviceChats,
    currentProviderName,
    messagesTab,
    setMessagesTab,
    currentUser,
    activeServiceChat,
    setActiveServiceChat,
    setServiceChats,
    serviceViolationWarning,
    setServiceViolationWarning,
    serviceChatMessages,
    setServiceChatMessages,
    showNotification,
    playMessageSound,
    setProviderChatMessage,
    providerChatMessage,
    handleProviderSendMessage,
    setAgentStatus,
    agentStatus,
    activeSupportChat,
    setActiveSupportChat,
    setSupportMessages,
    supportMessages,
    setLiveChatQueue,
    liveChatQueue,
    setChatMessageText,
    chatMessageText,
    setSupportAlertMsg,
    supportAlertMsg,
    setWorkingHours,
    workingHours,
    setMailIsComposing,
    mailIsComposing,
    setMailSelectedId,
    mailSelectedId,
    setMailEditingId,
    mailEditingId,
    setMailDraftId,
    mailDraftId,
    setMailComposeSubject,
    mailComposeSubject,
    setMailComposeTo,
    mailComposeTo,
    setAdminMailComposeSelected,
    adminMailComposeSelected,
    setMailComposeAttachments,
    mailComposeAttachments,
    setMailComposeBody,
    mailComposeBody,
    setMailActiveFolder,
    mailActiveFolder,
    setMailMessages,
    mailMessages,
    setNotifications,
    notifications,
    setAdminMailFilterPackage,
    adminMailFilterPackage,
    setAdminMailFilterType,
    adminMailFilterType,
    setAdminMailFilterCategory,
    adminMailFilterCategory,
    setAdminMailFilterRegion,
    adminMailFilterRegion,
    setAdminMailFilterCity,
    adminMailFilterCity,
    setAdminMailDropdownOpen,
    adminMailDropdownOpen,
    setAdminMailDropdownSearch,
    adminMailDropdownSearch,
    setIsMailSoundEnabled,
    isMailSoundEnabled,
    playMessageAlertSound,
    setMailInboxCleanupDays,
    mailInboxCleanupDays,
    setMailSentCleanupDays,
    mailSentCleanupDays,
    setMailSignature,
    mailSignature,
    setMailAssignedFilter,
    mailAssignedFilter,
    setMailEditSubject,
    mailEditSubject,
    setMailEditBody,
    mailEditBody,
    unreadMailCount,
    socket,
    halls,
    services,
    providers,
    filteredRecipients,
    runMailAutoCleanup,
    currentUserName,
    staffList
  } = props;

  // The original renderMessages inner function body converted to a component
  const visibleChats = userRole === 'provider' 
      ? serviceChats.filter(c => c.providerName === currentProviderName) 
      : serviceChats;

    return (
      <div className="space-y-6 animate-in fade-in duration-500">
        {/* Messages Header & Tab Switching */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-xl font-bold text-slate-800">مركز المراسلة والتحكم بالمنصة</h2>
            <p className="text-xs text-slate-500 mt-1">
              {userRole === 'provider' 
                ? 'إدارة محادثات العملاء النشطة وتخصيص أوقات العمل ورسالة التنبيه التي تظهر للعملاء بشكل منفرد.'
                : 'مراقبة وحوكمة المحادثات والتحقق الآلي من وسائل الدفع الخارجي، أو إدارة طابور الدعم الفني المباشر وساعات الدوام.'}
            </p>
          </div>
          
          {(userRole === 'admin' || userRole === 'provider') && (
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200 shadow-inner">
              <button
                onClick={() => setMessagesTab('service')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  messagesTab === 'service' 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-indigo-600 hover:bg-slate-100'
                }`}
              >
                <MessageSquare className="w-4 h-4 shadow-sm" />
                {userRole === 'provider' ? 'محادثات العملاء' : 'مراقبة الشركاء'}
              </button>
              
              {userRole === 'admin' && (
                <button
                  onClick={() => setMessagesTab('support')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                    messagesTab === 'support' 
                      ? 'bg-blue-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-100'
                  }`}
                >
                  <Headset className="w-4 h-4 shadow-sm" />
                  طابور الدعم الفني
                </button>
              )}
              
              <button
                onClick={() => setMessagesTab('working_hours')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
                  messagesTab === 'working_hours' 
                    ? 'bg-amber-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-amber-600 hover:bg-slate-100'
                }`}
              >
                <Clock className="w-4 h-4 shadow-sm" />
                {userRole === 'provider' ? 'أوقات الدوام والتنبيهات الخاصة بي' : 'ساعات العمل'}
              </button>

              <button
                onClick={() => setMessagesTab('mail')}
                className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative ${
                  messagesTab === 'mail' 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'text-slate-600 hover:text-purple-600 hover:bg-slate-100'
                }`}
              >
                <Mail className="w-4 h-4 shadow-sm" />
                البريد الإلكتروني للشركاء
                {unreadMailCount > 0 && (
                  <span className="absolute -top-1 -left-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                  </span>
                )}
              </button>

              {userRole === 'admin' && (
                <button
                  onClick={() => setMessagesTab('complaints')}
                  className={`px-4 py-2 text-xs font-black rounded-lg transition-all flex items-center gap-1.5 cursor-pointer relative ${
                    messagesTab === 'complaints' 
                      ? 'bg-rose-600 text-white shadow-sm' 
                      : 'text-slate-600 hover:text-rose-600 hover:bg-slate-100'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 shadow-sm text-white/90" />
                  تصعيد شكاوى الشركاء
                </button>
              )}
            </div>
          )}
        </div>

        {/* Messages Content */}
        {messagesTab === 'service' ? (
          <div className="h-[calc(100vh-225px)] min-h-[500px] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            {/* Chats List Sidebar */}
            <div className="w-1/3 border-l border-slate-200 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-200 bg-white shadow-sm shrink-0">
                <h2 className="font-extrabold text-slate-800 text-sm mb-1">
                  {userRole === 'provider' ? 'محادثات الشركاء وعملائك' : 'مراقبة والتحقق من محادثات الشركاء'}
                </h2>
                <p className="text-[10px] text-slate-500 font-medium">الرسائل المتبادلة بين المزودين والعملاء لتجنب المعاملات الخارجية والشتائم</p>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {visibleChats.map(c => (
                  <div 
                    key={c.id} 
                    onClick={() => {
                      setActiveServiceChat(c.id);
                      setServiceChats(prev => prev.map(ch => ch.id === c.id ? { ...ch, unread: 0 } : ch));
                    }} 
                    className={`p-4 border-b border-slate-100 cursor-pointer transition-all relative flex flex-col gap-2 ${
                      activeServiceChat === c.id 
                        ? 'bg-indigo-50/70 border-r-4 border-r-indigo-600 shadow-sm' 
                        : 'hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col gap-1 flex-1">
                        <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5 flex-wrap">
                          {userRole === 'provider' ? (
                            <span className="bg-slate-200 text-slate-800 px-2 py-0.5 rounded text-[10px]">العميل: {c.customerName}</span>
                          ) : (
                            <>
                              <span className="text-slate-900 font-bold">{c.providerName}</span>
                              <span className="text-[10px] text-slate-400 font-mono">↔</span>
                              <span className="text-slate-600 text-xs font-semibold">{c.customerName}</span>
                            </>
                          )}
                        </div>
                        
                        {c.unread > 0 && (
                          <span className="absolute top-4 left-4 bg-indigo-600 text-white rounded-full text-[9px] font-bold w-4 h-4 flex items-center justify-center">
                            {c.unread}
                          </span>
                        )}

                        {userRole === 'admin' && (serviceChatMessages[c.id] || []).some(m => m.isViolation && m.moderationStatus === 'pending') && (
                          <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit mt-1 border border-amber-100/80 animate-pulse">
                            <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> معلق للمراقبة
                          </span>
                        )}
                        
                        {userRole === 'admin' && (serviceChatMessages[c.id] || []).some(m => m.isViolation && m.moderationStatus === 'blocked') && (
                          <span className="text-[9px] font-medium text-red-500 bg-red-50 px-2.5 py-1 rounded-lg flex items-center gap-1 w-fit mt-1 border border-red-100/80">
                            <Ban className="w-3.5 h-3.5 shrink-0" /> تم حجب رسائل
                          </span>
                        )}
                      </div>
                      <span className="text-[9px] text-slate-400 whitespace-nowrap">{c.time}</span>
                    </div>
                    <p className="text-xs text-slate-500 truncate font-normal leading-normal">{c.lastMsg}</p>
                  </div>
                ))}
                
                {visibleChats.length === 0 && (
                  <div className="p-8 text-center text-slate-400 text-xs font-medium">
                    لا توجد محادثات متوفرة حالياً لمزود الخدمة الخاص بك.
                  </div>
                )}
              </div>
            </div>

            {/* Chat Box Panel */}
            <div className="w-2/3 flex flex-col bg-slate-50 relative">
              {activeServiceChat ? (
                <>
                  <div className="p-4 bg-white border-b border-slate-200 z-10 shadow-sm flex justify-between items-center shrink-0">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                        <MessageSquare className="w-4 h-4" />
                      </div>
                      <div>
                        {userRole === 'provider' ? (
                          <>
                            <h3 className="font-extrabold text-slate-800 text-xs">
                              محادثة كـ مزود مع: {serviceChats.find(c => c.id === activeServiceChat)?.customerName}
                            </h3>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                              <span className="text-[10px] text-slate-500">محادثة آمنة مفروزة ومراقبة ذكياً</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <h3 className="font-extrabold text-slate-900 text-xs text-right">مراقبة محادثة رقم #{activeServiceChat}</h3>
                            <p className="text-[10px] text-slate-500 mt-0.5 text-right font-sans">
                              بين المزود <strong className="text-slate-805 font-bold">{serviceChats.find(c => c.id === activeServiceChat)?.providerName}</strong> والعميل <strong className="text-slate-805 font-bold">{serviceChats.find(c => c.id === activeServiceChat)?.customerName}</strong>
                            </p>
                          </>
                        )}
                      </div>
                    </div>

                    {userRole === 'admin' && (serviceChatMessages[activeServiceChat] || []).some(m => m.isViolation && m.moderationStatus === 'pending') && (
                      <span className="text-[10px] bg-amber-50 text-amber-850 px-2.5 py-1.5 rounded-xl border border-amber-200 font-bold flex items-center gap-1.5 animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> بانتظار اتخاذ قرار
                      </span>
                    )}
                  </div>

                  {serviceViolationWarning && (
                    <div className="bg-amber-50 border-b border-amber-200 text-amber-805 p-3 text-xs font-bold flex items-start gap-2.5 shadow-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="flex-1 leading-relaxed text-right">{serviceViolationWarning}</div>
                      <button onClick={() => setServiceViolationWarning(null)} className="text-slate-400 hover:text-amber-850 text-xs font-bold bg-white px-2 py-0.5 rounded border border-amber-100 cursor-pointer">إغلاق</button>
                    </div>
                  )}

                  {/* Messages list */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                    {(serviceChatMessages[activeServiceChat] || []).map(m => {
                      const isSentByProvider = m.senderType === 'مزود خدمة' || m.senderType === 'provider' || m.senderType === 'مزود';
                      let shownText = m.text;
                      let isPendingBlock = m.isViolation && m.moderationStatus === 'pending';
                      let isPermanentlyBlocked = m.isViolation && m.moderationStatus === 'blocked';

                      if (userRole === 'provider') {
                        if (isPendingBlock || isPermanentlyBlocked) {
                          shownText = "⚠️ *** تم حجب هذه الرسالة وتوقيفها لمخالفتها شروط النشر والمراسلة بالمنصة (يُمنع تبادل وسائل الاتصال والبريد الإلكتروني والشتائم) ***";
                        }
                      }

                      return (
                        <div key={m.id} className={`flex flex-col ${isSentByProvider ? 'items-start' : 'items-end'}`}>
                          <span className="text-[10px] text-slate-500 mb-0.5 font-medium">
                            {m.senderName} ({m.senderType})
                          </span>
                          
                          <div className={`p-3.5 rounded-2xl max-w-[70%] text-xs shadow-sm relative ${
                            isSentByProvider 
                              ? 'bg-indigo-600 text-white rounded-tl-sm' 
                              : 'bg-white border border-slate-200 text-slate-700 rounded-tr-sm'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap text-right">{shownText}</p>
                            
                            {userRole === 'admin' && m.isViolation && (
                              <div className="mt-2 text-[9px] border-t border-indigo-200/30 pt-1.5 flex flex-wrap items-center gap-1.5">
                                <span className="font-semibold text-red-650 flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> رصد نظام الحجب الآلي: اشتباه تبادل جهات اتصال
                                </span>
                                {m.moderationStatus === 'pending' ? (
                                  <div className="flex gap-1.5">
                                    <button 
                                      onClick={() => {
                                        setServiceChatMessages(prev => ({
                                          ...prev,
                                          [activeServiceChat]: (prev[activeServiceChat] || []).map(msg => msg.id === m.id ? { ...msg, moderationStatus: 'passed' } : msg)
                                        }));
                                        showNotification('success', 'تم تمرير الرسالة والموافقة عليها بنجاح');
                                      }}
                                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                                    >
                                      تمرير وموافقة
                                    </button>
                                    <button 
                                      onClick={() => {
                                        setServiceChatMessages(prev => ({
                                          ...prev,
                                          [activeServiceChat]: (prev[activeServiceChat] || []).map(msg => msg.id === m.id ? { ...msg, moderationStatus: 'blocked' } : msg)
                                        }));
                                        showNotification('error', 'تم حجب الرسالة نهائياً ومنع ظهورها');
                                      }}
                                      className="bg-red-500 hover:bg-red-600 text-white font-bold px-2 py-0.5 rounded text-[10px] cursor-pointer"
                                    >
                                      تأكيد الحجب
                                    </button>
                                  </div>
                                ) : (
                                  <span className={`font-bold px-2 py-0.5 rounded text-[9px] ${
                                    m.moderationStatus === 'passed' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                  }`}>
                                    {m.moderationStatus === 'passed' ? 'مرت وموافقة' : 'محجوبة نهائياً'}
                                  </span>
                                )}
                              </div>
                            )}

                            <div className={`text-[9px] mt-1 text-right font-medium ${isSentByProvider ? 'text-indigo-200' : 'text-slate-400'}`}>
                              {m.time}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Message Input Controls */}
                  <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                    {userRole === 'admin' ? (
                      <div className="flex gap-2 w-full justify-between items-center bg-slate-50 p-2.5 border border-slate-200 rounded-xl">
                        <span className="text-[11px] text-slate-500 font-bold shrink-0 text-xs">توجيه الكنترول:</span>
                        <input 
                          type="text"
                          id="simulationDirectAdminMsg"
                          placeholder="إرسال رسالة تنبيه إدارية للطرفين بنسخة تحذيرية حمراء..."
                          className="flex-1 bg-white border border-slate-200 rounded-xl p-2 text-xs outline-none focus:border-indigo-500 mx-2"
                        />
                        <button 
                          onClick={() => {
                            const input = document.getElementById('simulationDirectAdminMsg') as HTMLInputElement;
                            if (!input || !input.value.trim()) return;
                            const text = `⚠️ تنبيه رسمي من إدارة المنصة: ${input.value}`;
                            playMessageSound(false);
                            const newMessage = {
                              id: Date.now(),
                              senderType: 'إدارة المنصة',
                              senderName: 'التحكم العام الكنترول',
                              text: text,
                              time: 'الآن',
                              isViolation: false,
                              moderationStatus: 'passed'
                            };
                            setServiceChatMessages(prev => ({
                              ...prev,
                              [activeServiceChat]: [...(prev[activeServiceChat] || []), newMessage]
                            }));
                            input.value = '';
                            showNotification('success', 'تم إرسال التنبيه الإداري العام');
                          }}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-black cursor-pointer"
                        >
                          إرسال التوجيه
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2.5 w-full">
                        {userRole === 'provider' && (
                          <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1">
                            <span className="text-[10px] text-slate-400 font-bold">إجراءات سريعة:</span>
                            <button
                              onClick={() => {
                                handleProviderSendMessage('[REQUEST_SELECT_HALL_OR_SERVICE]');
                                showNotification('success', 'تم إرسال طلب تحديد القاعة أو الخدمة للعميل بنجاح');
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-[10px] font-black transition-all cursor-pointer shadow-sm border border-indigo-100/50"
                            >
                              <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                              طلب تحديد القاعة أو الخدمة من العميل
                            </button>
                          </div>
                        )}
                        <div className="flex gap-2 w-full">
                          <input 
                            type="text" 
                            value={providerChatMessage}
                            onChange={e => setProviderChatMessage(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleProviderSendMessage()}
                            placeholder="اكتب رسالتك للعميل (تُمنع وسائل التواصل الخارجي)..." 
                            className="flex-1 p-3 rounded-xl border border-slate-200 focus:border-indigo-500 outline-none text-xs text-slate-800"
                          />
                          <button onClick={() => handleProviderSendMessage()} className="px-6 py-3 bg-indigo-650 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors text-xs cursor-pointer">
                             إرسال
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 z-10 text-center">
                  <MessageSquare className="w-12 h-12 mb-2 opacity-20" />
                  <p className="font-extrabold text-sm text-slate-700">لم يتم اختيار حوار نشط لدعم العملاء</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs">انقر على أي محادثة في القائمة الجانبية لمتابعة الرسائل وتبادلات الشركاء وحل النزاعات فوراً.</p>
                </div>
              )}
            </div>
          </div>
        ) : messagesTab === 'support' ? (
          /* TAB 2: TECHNICAL SUPPORT CHATS */
          <div className="h-[calc(100vh-220px)] flex bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden relative">
            {/* Conversations Queue Sidebar */}
            <div className="w-1/3 border-l border-slate-200 flex flex-col bg-slate-50/50">
              <div className="p-4 border-b border-slate-200 bg-white">
                 <div className="flex justify-between items-start mb-2">
                     <h2 className="font-extrabold text-slate-800 text-sm mb-2">طابور خدمة العملاء</h2>
                     <select 
                       value={agentStatus}
                       onChange={(e) => {
                         const val = e.target.value as 'online'|'busy'|'offline';
                         setAgentStatus(val);
                       }}
                       className={`text-[9px] font-bold px-2 py-1 flex items-center gap-1 rounded-full outline-none border cursor-pointer
                          ${agentStatus === 'online' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 
                            agentStatus === 'busy' ? 'bg-amber-50 text-amber-600 border-amber-200' : 
                            'bg-slate-100 text-slate-500 border-slate-200'}`}
                     >
                        <option value="offline">غير متصل</option>
                        <option value="online">متصل (متاح)</option>
                        <option value="busy">مشغول</option>
                     </select>
                 </div>
                 <p className="text-[10px] text-slate-500 font-medium">العملاء الذين ينتظرون الدعم والمحادثات النشطة</p>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {liveChatQueue.map(c => (
                  <div 
                    key={c.id} 
                    onClick={()=>{
                      setActiveSupportChat(c.id);
                      setSupportMessages(prev => ({
                        ...prev,
                        [c.id]: c.messages || prev[c.id] || []
                      }));
                    }} 
                    className={`p-4 border-b border-slate-100 cursor-pointer transition-colors relative flex flex-col gap-2 ${
                      activeSupportChat === c.id ? 'bg-blue-50 border-r-4 border-r-blue-600 shadow-sm' : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="font-bold text-xs text-slate-800">{c.customerName || 'عميل منتظر'}</div>
                      {c.status === 'waiting' && <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0"><Clock className="w-3 h-3"/> في الانتظار</span>}
                      {c.status === 'active' && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1 shrink-0 font-medium">نشط</span>}
                    </div>

                    <div className="flex flex-wrap gap-1 items-center">
                       {c.department && (
                          <span className="text-[8px] font-bold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100">
                             {c.department}
                          </span>
                       )}
                       {c.topic && (
                          <span className="text-[8px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                             {c.topic}
                          </span>
                       )}
                       {!c.topic && c.subject && (
                          <span className="text-[8px] font-medium bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">
                             {c.subject}
                          </span>
                       )}
                       {(c.assignedStaff || c.agentName) && (
                          <span className="text-[8px] font-bold bg-emerald-50 text-emerald-600 px-1.5 py-0.5 rounded">
                             الموظف: {c.assignedStaff || c.agentName}
                          </span>
                       )}
                    </div>

                    {c.lastMsg && (
                      <p className="text-[10px] text-slate-400 line-clamp-1 italic">{c.lastMsg}</p>
                    )}
                  </div>
                ))}
                
                {liveChatQueue.length === 0 && (
                   <div className="p-6 text-center text-slate-400 text-xs font-medium">لا يوجد عملاء حالياً</div>
                )}
              </div>
            </div>

            {/* Support Messages Panel */}
            <div className="w-2/3 flex flex-col bg-slate-50 relative">
              {activeSupportChat ? (
                <>
                  <div className="p-4 bg-white border-b border-slate-200 z-10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-3 shrink-0" dir="rtl">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <h2 className="font-extrabold text-slate-800 text-xs">{liveChatQueue.find(c => c.id === activeSupportChat)?.customerName}</h2>
                          {liveChatQueue.find(c => c.id === activeSupportChat)?.department && (
                            <span className="text-[8px] font-bold px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded">
                              {liveChatQueue.find(c => c.id === activeSupportChat)?.department}
                            </span>
                          )}
                          {liveChatQueue.find(c => c.id === activeSupportChat)?.topic && (
                            <span className="text-[8px] font-medium px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
                              الموضوع: {liveChatQueue.find(c => c.id === activeSupportChat)?.topic}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-[9px] font-bold text-slate-400">القسم المختص:</span>
                      <select 
                        value={liveChatQueue.find(c => c.id === activeSupportChat)?.department || 'عام'} 
                        onChange={(e) => {
                           const newDept = e.target.value;
                           if (socket && activeSupportChat) {
                             socket.emit("update_department", { chatId: activeSupportChat, department: newDept });
                           }
                           setLiveChatQueue(prev => prev.map(c => c.id === activeSupportChat ? { ...c, department: newDept } : c));
                           showNotification('info', `تم تحويل القسم المختص إلى: ${newDept}`);
                        }}
                        className="text-[9px] font-bold bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none text-slate-700 cursor-pointer hover:bg-slate-100"
                      >
                         <option value="عام">دعم عام (عام)</option>
                         <option value="دعم فني">دعم فني</option>
                         <option value="دعم إداري">دعم إداري</option>
                         <option value="دعم مالي">دعم مالي</option>
                      </select>

                      <span className="text-[9px] font-bold text-slate-400">الموظف:</span>
                      <select 
                        value={liveChatQueue.find(c => c.id === activeSupportChat)?.assignedStaff || liveChatQueue.find(c => c.id === activeSupportChat)?.agentName || ''} 
                        onChange={(e) => {
                           const newStaff = e.target.value;
                           if (!newStaff) return;
                           if (socket && activeSupportChat) {
                              socket.emit("transfer_chat", { chatId: activeSupportChat, agentName: newStaff });
                           }
                           setLiveChatQueue(prev => prev.map(c => 
                              c.id === activeSupportChat 
                                 ? { ...c, assignedStaff: newStaff, agentName: newStaff, status: 'active' } 
                                 : c
                           ));
                           showNotification('success', `تم إعادة تعيين الحوار للموظف: ${newStaff}`);
                        }}
                        className="text-[9px] font-bold bg-slate-50 border border-slate-200 rounded px-1.5 py-1 outline-none text-slate-700 cursor-pointer hover:bg-slate-100"
                      >
                         <option value="">-- اختر موظف --</option>
                         <option value="سارة محمد">سارة محمد (إداري)</option>
                         <option value="أحمد سعيد">أحمد سعيد (إداري)</option>
                         <option value="عبد الله صالح">عبد الله صالح (تقني)</option>
                         <option value="خالد عبد العزيز">خالد عبد العزيز (مالي)</option>
                         <option value="يوسف علي">يوسف علي (عام)</option>
                      </select>

                      {liveChatQueue.find(c => c.id === activeSupportChat)?.status === 'waiting' ? (
                         <button 
                           onClick={() => {
                             if (socket && activeSupportChat) {
                               socket.emit("agent_accept", activeSupportChat);
                             }
                             setLiveChatQueue(prev => prev.map(c => c.id === activeSupportChat ? { ...c, status: 'active', assignedStaff: 'أنت (المدير)' } : c));
                             showNotification('success', 'تم استلام المحادثة والانتقال لوضع الرد النشط');
                           }} 
                           className="px-2.5 py-1 bg-blue-600 text-white rounded text-[9px] font-bold hover:bg-blue-700 transition-colors cursor-pointer"
                         >
                           استلام
                         </button>
                      ) : (
                         <button 
                           onClick={() => {
                             if (socket && activeSupportChat) {
                               socket.emit("end_chat", activeSupportChat);
                             }
                             setLiveChatQueue(prev => prev.filter(c => c.id !== activeSupportChat));
                             setActiveSupportChat(null);
                             showNotification('info', 'تم إنهاء المحادثة بنجاح وتحديث الطابور');
                           }} 
                           className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded text-[9px] font-bold hover:bg-slate-200 transition-colors flex items-center gap-0.5 cursor-pointer"
                         >
                           <X className="w-3 h-3"/> إنهاء
                         </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 z-10 custom-scrollbar" dir="rtl">
                    {(supportMessages[activeSupportChat]||[]).map((m, idx) => {
                      const isAgentMsg = m.senderType === 'agent' || m.senderType === 'مزود خدمة';
                      return (
                        <div key={idx} className={`flex flex-col ${isAgentMsg ? 'items-start' : 'items-end'}`}>
                          <span className="text-[10px] text-slate-400 mb-0.5">${m.senderName}</span>
                          <div className={`p-3 rounded-2xl max-w-[70%] text-xs shadow-sm ${
                            isAgentMsg ? 'bg-blue-600 text-white rounded-tl-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tr-none'
                          }`}>
                            <p className="leading-relaxed whitespace-pre-wrap text-right">${m.text}</p>
                            <div className={`text-[9px] mt-1 text-right font-medium ${isAgentMsg ? 'text-blue-200' : 'text-slate-400'}`}>
                              ${m.time}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="p-4 bg-white border-t border-slate-200 flex gap-3 z-10 items-center shadow-sm shrink-0" dir="rtl">
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!chatMessageText.trim() || !activeSupportChat) return;

                        const timeNow = new Date().toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
                        const newMessage = {
                          id: Date.now(),
                          senderType: 'agent',
                          senderName: 'الدعم العام المباشر',
                          text: chatMessageText,
                          time: timeNow
                        };

                        setSupportMessages(prev => ({
                          ...prev,
                          [activeSupportChat]: [...(prev[activeSupportChat] || []), newMessage]
                        }));

                        setLiveChatQueue(prev => prev.map(c => 
                          c.id === activeSupportChat 
                            ? { ...c, lastMsg: chatMessageText, time: 'الآن', status: 'active', assignedStaff: 'أنت (المدير)' } 
                            : c
                        ));

                        if (socket && activeSupportChat && activeSupportChat.startsWith("chat_")) {
                          socket.emit("send_message", {
                            chatId: activeSupportChat,
                            text: chatMessageText,
                            senderType: 'agent'
                          });
                        }
                        setChatMessageText('');
                        showNotification('success', 'تم إرسال رد الإدارة المباشر للعميل الافتراضي');
                      }} 
                      className="flex-1 flex gap-3"
                    >
                      <input 
                        value={chatMessageText} 
                        onChange={e => setChatMessageText(e.target.value)} 
                        placeholder="اكتب رد الدعم الإداري والمالي الفوري هنا..." 
                        className="flex-1 border border-slate-200 bg-slate-50 focus:bg-white rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-xs text-slate-800 text-right" 
                      />
                      <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white p-2.5 rounded-xl shadow-md transition-transform flex items-center justify-center cursor-pointer">
                        <Send className="w-4 h-4 rtl:-scale-x-100 ml-1"/>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 z-10 text-center">
                  <Headset className="w-12 h-12 mb-2 opacity-20 text-blue-505" />
                  <p className="font-extrabold text-sm text-slate-800">لم يتم اختيار محادثة نشطة</p>
                  <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium">الرجاء اختيار أحد العملاء في طابور الانتظار للتعامل مع المشاكل الفورية والتراخيص المعلقة.</p>
                </div>
              )}
            </div>
          </div>
        ) : messagesTab === 'complaints' ? (
          /* TAB: ESCALATED CUSTOMER COMPLAINTS FROM PARTNERS */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative overflow-y-auto max-h-[calc(100vh-220px)] animate-in fade-in duration-300">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
               <div>
                 <h2 className="text-sm font-bold text-slate-800">شكاوى وتصعيدات الشركاء ضد العملاء</h2>
                 <p className="text-xs text-slate-500 mt-0.5 font-medium">مراجعة المحاضر الرسمية للشكاوى المقدمة من مزودي الخدمات والشركاء ضد سلوكيات بعض العملاء.</p>
               </div>
               <button 
                 onClick={() => {
                   window.dispatchEvent(new Event('customer-complaints-updated'));
                   showNotification('success', 'تم تحديث قائمة الشكاوى المتلقاة من الشركاء');
                 }}
                 className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-750 text-xs rounded-xl font-bold transition-all cursor-pointer"
               >
                 إعادة تحميل الشكاوى
               </button>
            </div>

            <div className="space-y-4">
              {(() => {
                const complaints = (() => {
                  try {
                    return JSON.parse(localStorage.getItem('CUSTOMER_COMPLAINTS') || '[]');
                  } catch (e) {
                    return [];
                  }
                })();

                if (complaints.length === 0) {
                  return (
                    <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                      🛡️ لا توجد شكاوى أو تصعيدات نشطة مقدمة ضد العملاء حالياً من قبل الشركاء.
                    </div>
                  );
                }

                return complaints.map((cmp: any) => (
                  <div key={cmp.id} className="p-5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all relative flex flex-col md:flex-row justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-100">
                          {cmp.complaintId || `CMP-${cmp.id}`}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100">
                          بواسطة المزود: {cmp.providerName}
                        </span>
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          ضد العميل: {cmp.customerName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {cmp.timestamp}
                        </span>
                      </div>

                      <div className="space-y-1">
                        <h4 className="text-xs font-extrabold text-slate-800">سبب الشكوى: <span className="text-rose-600">"{cmp.reason}"</span></h4>
                        <p className="text-xs text-slate-600 leading-relaxed bg-white p-3 rounded-xl border border-slate-150 font-medium">
                          {cmp.details}
                        </p>
                      </div>

                      {cmp.lastMsgContext && (
                        <div className="text-[11px] text-slate-450 bg-slate-100 p-2.5 rounded-lg font-mono">
                          السياق الأخير: "{cmp.lastMsgContext}"
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col justify-between items-end gap-3 shrink-0">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold ${
                        cmp.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {cmp.status === 'resolved' ? 'تمت معالجة البلاغ' : 'تحت التدقيق الإداري'}
                      </span>

                      <div className="flex flex-wrap gap-2 justify-end">
                        {cmp.status !== 'resolved' && (
                          <button
                            onClick={() => {
                              const updated = complaints.map((c: any) => c.id === cmp.id ? { ...c, status: 'resolved' } : c);
                              localStorage.setItem('CUSTOMER_COMPLAINTS', JSON.stringify(updated));
                              window.dispatchEvent(new Event('customer-complaints-updated'));
                              showNotification('success', 'تم تسجيل تسوية البلاغ وحل النزاع الإداري بنجاح!');
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                          >
                            تسوية وتأكيد حل النزاع
                          </button>
                        )}
                        <button
                          onClick={() => {
                            showNotification('error', `🛡️ تم تطبيق الحجب والحظر التأديبي المؤقت على العميل (${cmp.customerName}) لمنع المراسلة العشوائية.`);
                            const updated = complaints.map((c: any) => c.id === cmp.id ? { ...c, status: 'resolved' } : c);
                            localStorage.setItem('CUSTOMER_COMPLAINTS', JSON.stringify(updated));
                            window.dispatchEvent(new Event('customer-complaints-updated'));
                          }}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          تأديب وحجب حساب العميل
                        </button>
                        <button
                          onClick={() => {
                            const updated = complaints.filter((c: any) => c.id !== cmp.id);
                            localStorage.setItem('CUSTOMER_COMPLAINTS', JSON.stringify(updated));
                            window.dispatchEvent(new Event('customer-complaints-updated'));
                            showNotification('info', 'تم تجاهل وأرشفة محضر الشكوى بنجاح.');
                          }}
                          className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 transition-all cursor-pointer"
                          title="حذف البلاغ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        ) : messagesTab === 'working_hours' ? (
          /* TAB 3: WORKING HOURS CONFIGURATION */
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden relative overflow-y-auto max-h-[calc(100vh-220px)] animate-in fade-in duration-300">
             <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-100">
                <div>
                  <h2 className="text-sm font-bold text-slate-800">
                    {userRole === 'provider' ? `أوقات وساعات العمل والرد الخاص بـ (${currentProviderName})` : 'أوقات وساعات العمل (ساعات الرد الفوري للرد الإداري)'}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {userRole === 'provider' ? 'تحديد ساعات وفترات ردك على المراسلات الخاصة بعملائك بمصداقية.' : 'تحديد الفترات الزمنية لدعم العملاء وتواجد الموظفين خلف الأجهزة للمنصة.'}
                  </p>
                </div>
                <button 
                  onClick={() => {
                     if (userRole === 'provider' && currentProviderName) {
                       localStorage.setItem(`PROVIDER_WORKING_HOURS_${currentProviderName}`, JSON.stringify(workingHours));
                       localStorage.setItem(`PROVIDER_ALERT_MSG_${currentProviderName}`, supportAlertMsg);
                       window.dispatchEvent(new Event('service-chats-updated'));
                       showNotification('success', 'تم حفظ أوقات الدوام ورسالة التنبيه المخصصة لخدماتك ومحادثات عملائك بنجاح!');
                     } else {
                       localStorage.setItem('SUPPORT_WORKING_HOURS', JSON.stringify(workingHours));
                       localStorage.setItem('SUPPORT_ALERT_MSG', supportAlertMsg);
                       window.dispatchEvent(new Event('service-chats-updated'));
                       showNotification('success', 'تم حفظ وتعميم أوقات العمل وحظر التنبيهات الإدارية تلقائياً للمنصة');
                     }
                  }} 
                  className="bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold px-4 py-2 rounded-xl text-xs transition-colors shadow-sm cursor-pointer"
                >
                   حفظ التغييرات
                </button>
             </div>
             
             {/* Permanent Warning Message Section */}
             <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                 <label className="block text-xs font-bold text-amber-900 mb-1.5">
                   {userRole === 'provider' ? 'رسالة التنبيه الخاصة بك لعملائك عند فتح المحادثة:' : 'الرسالة التنبيهية الدائمة للعملاء عند فتح المحادثة المباشرة العامة:'}
                 </label>
                 <p className="text-[11px] text-amber-700 mb-2.5 leading-relaxed font-medium">
                   {userRole === 'provider' 
                     ? 'تظهر هذه الرسالة لعملائك بمجرد فتحهم للمحادثة الخاصة بصفحة صالاتك أو خدماتك ترحيباً بهم بمصداقية.' 
                     : 'تظهر هذه الرسالة بشكل دائم ومميز للعملاء بمجرد فتحهم للمحادثة العائمة بهدف إرشادهم بساعات العمل أو الدوام الرسمي للمنصة.'}
                 </p>
                 <textarea
                    value={supportAlertMsg}
                    onChange={(e) => setSupportAlertMsg(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-3 text-xs outline-none focus:border-amber-500 text-slate-800 font-medium h-16 resize-none shadow-sm font-sans text-right"
                    placeholder="مثال: تنبيه: أوقات العمل من الساعة 9:00 صباحاً وحتى الساعة 5:00 مساءً"
                 />
             </div>

             <div className="space-y-4 font-sans text-sm">
                {['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => {
                   const config = (workingHours as any)[day] || { active: true, period1Start: '08:00', period1End: '14:00', period2Start: '16:00', period2End: '22:00' };
                   return (
                      <div key={day} className={`flex flex-col sm:flex-row sm:items-center gap-4 p-4 rounded-xl border transition-colors ${config.active ? 'bg-slate-50 border-slate-200' : 'bg-slate-50/50 border-slate-100 opacity-60'}`}>
                         <div className="flex items-center gap-3 w-40">
                            <label className="relative inline-flex items-center cursor-pointer">
                               <input 
                                 type="checkbox" 
                                 checked={config.active} 
                                 onChange={(e) => setWorkingHours({...workingHours, [day]: {...config, active: e.target.checked}})} 
                                 className="sr-only peer" 
                               />
                               <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                            </label>
                            <span className={`font-bold text-xs w-20 text-right ${config.active ? 'text-slate-800' : 'text-slate-400'}`}>{day}</span>
                         </div>
                         {config.active ? (
                            <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-4">
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-550 w-20 font-medium text-right">الفترة 1:</span>
                                  <input type="time" value={config.period1Start} onChange={(e) => setWorkingHours({...workingHours, [day]: {...config, period1Start: e.target.value}})} className="p-1.5 border border-slate-200 rounded-lg text-xs flex-1 outline-none focus:border-amber-500 bg-white" />
                                  <span className="text-slate-400 text-xs">إلى</span>
                                  <input type="time" value={config.period1End} onChange={(e) => setWorkingHours({...workingHours, [day]: {...config, period1End: e.target.value}})} className="p-1.5 border border-slate-200 rounded-lg text-xs flex-1 outline-none focus:border-amber-500 bg-white" />
                               </div>
                               <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-slate-550 w-20 font-medium text-right">الفترة 2:</span>
                                  <input type="time" value={config.period2Start} onChange={(e) => setWorkingHours({...workingHours, [day]: {...config, period2Start: e.target.value}})} className="p-1.5 border border-slate-200 rounded-lg text-xs flex-1 outline-none focus:border-amber-500 bg-white" />
                                  <span className="text-slate-400 text-xs">إلى</span>
                                  <input type="time" value={config.period2End} onChange={(e) => setWorkingHours({...workingHours, [day]: {...config, period2End: e.target.value}})} className="p-1.5 border border-slate-200 rounded-lg text-xs flex-1 outline-none focus:border-amber-500 bg-white" />
                               </div>
                            </div>
                         ) : (
                            <div className="flex-1 flex items-center justify-center sm:justify-start text-slate-400 text-xs font-medium pr-2 text-right">
                               يوم إجازة رسمي (تغلق فيه المحادثات الفورية وتتحول إلى ردود مبرمجة)
                            </div>
                         )}
                      </div>
                   );
                })}
             </div>
             <div className="mt-6 bg-blue-50 text-blue-800 p-4 rounded-xl text-xs border border-blue-105 flex items-start gap-3">
               <Info className="w-4 h-4 shrink-0 mt-0.5" />
               <div className="text-right">
                  <p className="font-bold mb-1">الردود الافتراضية الذكية خارج ساعات الدوام الرسمية للأمان والمصداقية:</p>
                  <p>رصد النظام التلقائي للمراسلات: سيتم طمأنة العميل تلقائياً بوجود فريق من منسقي قاعات ومزودي المنصة في فترات الدوام الرسمية لتقديم الدعم الفوري وتغطية المشاكل.</p>
               </div>
             </div>
           </div>
         ) : messagesTab === 'mail' ? (
          /* TAB 4: EMAIL / MAILBOX DIRECT INTERACTIVE SECTION */
          <div className="bg-slate-50 rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col md:flex-row h-[75vh] min-h-[550px] animate-in fade-in duration-300">
            {/* Sidebar Folder Navigation */}
            <div className="w-full md:w-64 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between shrink-0" dir="rtl">
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => {
                    setMailIsComposing(true);
                    setMailSelectedId(null);
                    setMailEditingId(null);
                    setMailDraftId(null);
                    setMailComposeSubject('');
                    setMailComposeTo('');
                    setAdminMailComposeSelected([]);
                    setMailComposeAttachments([]);
                    setMailComposeBody(mailSignature ? `\n\n___________________\n${mailSignature}` : '');
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-extrabold py-3 px-4 rounded-xl text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>رسالة جديدة</span>
                </button>

                <button
                  onClick={() => {
                    setMailActiveFolder('inbox');
                    setMailIsComposing(false);
                    setMailSelectedId(null);
                    setMailEditingId(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mailActiveFolder === 'inbox' && !mailIsComposing
                      ? 'bg-slate-800 text-amber-400 border-r-4 border-r-amber-500'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Inbox className="w-4 h-4" />
                    <span>البريد الوارد</span>
                  </div>
                  <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans font-black">{unreadMailCount}</span>
                </button>

                <button
                  onClick={() => {
                    setMailActiveFolder('sent');
                    setMailIsComposing(false);
                    setMailSelectedId(null);
                    setMailEditingId(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mailActiveFolder === 'sent' && !mailIsComposing
                      ? 'bg-slate-800 text-amber-400 border-r-4 border-r-amber-500'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Send className="w-4 h-4" />
                    <span>البريد الصادر</span>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setMailActiveFolder('drafts');
                    setMailIsComposing(false);
                    setMailSelectedId(null);
                    setMailEditingId(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mailActiveFolder === 'drafts' && !mailIsComposing
                      ? 'bg-slate-800 text-amber-400 border-r-4 border-r-amber-500'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4" />
                    <span>المسودات</span>
                  </div>
                  <span className="bg-amber-550/15 text-amber-400 text-[10px] px-2 py-0.5 rounded-full font-mono font-bold">
                    {mailMessages.filter(msg => {
                      if (userRole === 'admin') {
                        return msg.isDraft && msg.sender === 'الإدارة' && !msg.deletedByAdmin;
                      } else {
                        return msg.isDraft && msg.sender === currentProviderName;
                      }
                    }).length}
                  </span>
                </button>
                <button
                  onClick={() => {
                    setMailActiveFolder('trash');
                    setMailIsComposing(false);
                    setMailSelectedId(null);
                    setMailEditingId(null);
                  }}
                  className={`w-full flex items-center justify-between p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mailActiveFolder === 'trash' && !mailIsComposing
                      ? 'bg-slate-800 text-amber-400 border-r-4 border-r-amber-500'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Trash2 className="w-4 h-4" />
                    <span>سلة المحذوفات</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">30 يوماً</span>
                </button>

                <button
                  onClick={() => {
                    setMailActiveFolder('settings');
                    setMailIsComposing(false);
                    setMailSelectedId(null);
                    setMailEditingId(null);
                  }}
                  className={`w-full flex items-center gap-2.5 p-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    mailActiveFolder === 'settings' && !mailIsComposing
                      ? 'bg-slate-800 text-amber-400 border-r-4 border-r-amber-500'
                      : 'text-slate-300 hover:bg-slate-800/50'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>إعدادات البريد الإلكتروني</span>
                </button>
              </div>

              {/* Sidebar bottom guide */}
              <div className="pt-4 border-t border-slate-800 text-slate-500 text-[10px] font-medium leading-relaxed space-y-1">
                <p>💡 نظام بريد ليلة لتبادل الوثائق والتنسيق المالي الموثق.</p>
                <p>🛡️ خاضع لشروط الحوكمة والأرشفة الأمنية التلقائية للمنصة.</p>
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 bg-white flex flex-col min-w-0" dir="rtl">
              {mailIsComposing ? (
                /* COMPOSE FORM VIEW */
                <div className="flex-1 p-6 flex flex-col overflow-y-auto">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4 shrink-0">
                    <h3 className="font-extrabold text-slate-800 text-base">إنشاء رسالة جديدة (البريد الداخلي الشريك)</h3>
                    <button
                      type="button"
                      onClick={() => setMailIsComposing(false)}
                      className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <form
                    onSubmit={(e: React.FormEvent) => {
                      e.preventDefault();
                      if (userRole === 'admin') {
                        if (adminMailComposeSelected.length === 0) {
                          showNotification('error', 'يرجى اختيار مستلم واحد على الأقل!');
                          return;
                        }
                      } else {
                        if (!mailComposeTo) {
                          showNotification('error', 'يرجى اختيار مستلم الرسالة!');
                          return;
                        }
                      }
                      if (!mailComposeSubject.trim()) {
                        showNotification('error', 'يرجى كتابة موضوع الرسالة!');
                        return;
                      }
                      if (!mailComposeBody.trim()) {
                        showNotification('error', 'يرجى كتابة نص الرسالة!');
                        return;
                      }

                      const recipients = userRole === 'admin' ? adminMailComposeSelected : [mailComposeTo];

                      const newMails = recipients.map((rec, index) => ({
                        id: 'mail_' + (Date.now() + index),
                        sender: userRole === 'admin' ? 'الإدارة' : currentProviderName,
                        recipient: rec,
                        subject: mailComposeSubject,
                        body: mailComposeBody,
                        createdAt: new Date().toISOString(),
                        attachments: mailComposeAttachments,
                        isReadByAdmin: userRole === 'admin',
                        isReadByProvider: userRole === 'provider',
                        deletedByAdmin: false,
                        deletedByProvider: false,
                        deletedAt: null
                      }));

                      setMailMessages(prev => {
                        const filtered = prev.filter(m => m.id !== mailDraftId);
                        return [...newMails, ...filtered];
                      });
                      setMailDraftId(null);

                      // Push dynamic notifications as well
                      const newNotifs = recipients.map((rec, index) => ({
                        id: 'notif_' + (Date.now() + index),
                        title: userRole === 'admin' ? `📨 بريد إداري جديد` : `📨 بريد وارد جديد من شريك`,
                        body: userRole === 'admin' 
                          ? `أرسلت الإدارة بريداً رسمياً بعنوان "${mailComposeSubject}". يرجى المراجعة والرد.` 
                          : `وصل بريد جديد من الشريك "${currentProviderName}" بعنوان "${mailComposeSubject}".`,
                        createdAt: new Date().toISOString(),
                        type: 'mail',
                        severity: 'medium',
                        recipientRole: userRole === 'admin' ? 'provider' : 'admin',
                        recipientName: userRole === 'admin' ? rec : undefined,
                        isRead: false
                      }));
                      setNotifications(prev => [...newNotifs, ...prev]);

                      setMailIsComposing(false);
                      // Clear selections for next use
                      setAdminMailComposeSelected([]);
                      setMailComposeTo('');
                      setMailComposeSubject('');
                      setMailComposeBody('');
                      showNotification('success', userRole === 'admin' ? `تم إرسال الرسالة إلى ${recipients.length} شريك بنجاح!` : 'تم إرسال الرسالة إلى صندوق البريد بنجاح!');
                    }}
                    className="space-y-4 flex-1 flex flex-col min-h-0"
                  >
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-2 flex justify-between items-center">
                        <span>الطرف المستلم: *</span>
                        {userRole === 'admin' && (
                          <span className="text-[10px] text-purple-700 font-extrabold bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                            تم تحديد {adminMailComposeSelected.length} شريك
                          </span>
                        )}
                      </label>
                      {userRole === 'admin' ? (
                        <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                          {/* Filters Grid */}
                          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
                            {/* Filter 1: Package */}
                            <div className="space-y-1">
                              <select
                                value={adminMailFilterPackage}
                                onChange={(e) => {
                                  setAdminMailFilterPackage(e.target.value);
                                  setAdminMailComposeSelected([]); 
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[11px] text-slate-700 font-black outline-none cursor-pointer focus:border-purple-500"
                              >
                                <option value="">كل الباقات</option>
                                <option value="الباقة الأساسية">الباقة الأساسية</option>
                                <option value="باقة الأعمال">باقة الأعمال</option>
                                <option value="الباقة الاحترافية">الباقة الاحترافية</option>
                              </select>
                            </div>

                            {/* Filter 2: Type */}
                            <div className="space-y-1">
                              <select
                                value={adminMailFilterType}
                                onChange={(e) => {
                                  setAdminMailFilterType(e.target.value);
                                  setAdminMailComposeSelected([]);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[11px] text-slate-700 font-black outline-none cursor-pointer focus:border-purple-500"
                              >
                                <option value="">كل الأنواع</option>
                                <option value="منشأة">منشأة</option>
                                <option value="فرد">فرد</option>
                              </select>
                            </div>

                            {/* Filter 3: Category */}
                            <div className="space-y-1">
                              <select
                                value={adminMailFilterCategory}
                                onChange={(e) => {
                                  setAdminMailFilterCategory(e.target.value);
                                  setAdminMailComposeSelected([]);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[11px] text-slate-700 font-black outline-none cursor-pointer focus:border-purple-500"
                              >
                                <option value="">كل الخدمات</option>
                                {Array.from(new Set([
                                  ...(halls || []).map((h: any) => h.category),
                                  ...(services || []).map((s: any) => s.category)
                                ])).filter(Boolean).map((cat: string) => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>

                            {/* Filter 4: Region */}
                            <div className="space-y-1">
                              <select
                                value={adminMailFilterRegion}
                                onChange={(e) => {
                                  setAdminMailFilterRegion(e.target.value);
                                  setAdminMailFilterCity('');
                                  setAdminMailComposeSelected([]);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[11px] text-slate-700 font-black outline-none cursor-pointer focus:border-purple-500"
                              >
                                <option value="">كل المناطق</option>
                                {Array.from(new Set((providers || []).map((p: any) => p.region))).filter(Boolean).map((reg: string) => (
                                  <option key={reg} value={reg}>{reg}</option>
                                ))}
                              </select>
                            </div>

                            {/* Filter 5: City */}
                            <div className="space-y-1">
                              <select
                                value={adminMailFilterCity}
                                onChange={(e) => {
                                  setAdminMailFilterCity(e.target.value);
                                  setAdminMailComposeSelected([]);
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-[11px] text-slate-700 font-black outline-none cursor-pointer focus:border-purple-500"
                              >
                                <option value="">كل المدن</option>
                                {Array.from(new Set(
                                  (providers || [])
                                    .filter((p: any) => !adminMailFilterRegion || p.region === adminMailFilterRegion)
                                    .map((p: any) => p.city)
                                )).filter(Boolean).map((city: string) => (
                                  <option key={city} value={city}>{city}</option>
                                ))}
                              </select>
                            </div>
                          </div>

                          {/* Select All / Clear Row - Moved inside dropdown or kept contextually */}
                          <div className="flex justify-between items-center py-1 mt-1 border-t border-dashed border-slate-200">
                            <span className="text-[11px] text-slate-500 font-bold">
                              المستلمين المطابقين للتصفية: <span className="text-purple-600 font-black">{filteredRecipients.length}</span> مزود
                            </span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  const allMatchedNames = filteredRecipients.map((r: any) => r.name);
                                  setAdminMailComposeSelected(allMatchedNames);
                                }}
                                className="bg-purple-650 hover:bg-purple-700 text-white px-3 py-1 rounded-lg text-[10px] font-black transition-colors cursor-pointer"
                              >
                                ✓ تحديد الكل المصفى
                              </button>
                              <button
                                type="button"
                                onClick={() => setAdminMailComposeSelected([])}
                                className="bg-slate-200 hover:bg-slate-350 text-slate-755 px-3 py-1 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                              >
                                × إلغاء التحديد
                              </button>
                            </div>
                          </div>

                          {/* Searchable Dropdown for Providers matching filter */}
                          <div className="relative mt-2" dir="rtl">
                            {/* Dropdown Toggle Button */}
                            <button
                              type="button"
                              onClick={() => setAdminMailDropdownOpen(prev => !prev)}
                              className="w-full flex items-center justify-between bg-white border border-slate-200 hover:border-purple-300 rounded-xl p-3 text-xs text-slate-800 font-bold transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                            >
                              <div className="flex items-center gap-2 truncate">
                                <span className="text-purple-600 font-sans text-sm">👥</span>
                                <span className="text-right">
                                  {adminMailComposeSelected.length === 0
                                    ? 'اضغط هنا لفتح قائمة الشركاء وبدء وتخصيص الاختيار...'
                                    : `تم تحديد (${adminMailComposeSelected.length}) شريك: ${
                                        adminMailComposeSelected.slice(0, 3).join('، ')
                                      }${adminMailComposeSelected.length > 3 ? ' ... إلخ' : ''}`}
                                </span>
                              </div>
                              <span className="text-slate-400 font-mono text-[10px] mr-2">
                                {adminMailDropdownOpen ? '▲' : '▼'}
                              </span>
                            </button>

                            {/* Dropdown Menu Overlay / Backdrop to close */}
                            {adminMailDropdownOpen && (
                              <div 
                                className="fixed inset-0 z-40 bg-transparent/5" 
                                onClick={() => setAdminMailDropdownOpen(false)}
                              />
                            )}

                            {/* Dropdown Options List Panel */}
                            {adminMailDropdownOpen && (
                              <div className="absolute left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in duration-150">
                                {/* Search input in Dropdown */}
                                <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center gap-2">
                                  <span className="text-slate-400 text-xs">🔍</span>
                                  <input
                                    type="text"
                                    value={adminMailDropdownSearch}
                                    onChange={(e) => setAdminMailDropdownSearch(e.target.value)}
                                    placeholder="ابحث باسم الشريك أو الباقة أو المدينة أو نوع الخدمة..."
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-750 outline-none focus:border-purple-500 font-bold text-right"
                                    onClick={(e) => e.stopPropagation()} 
                                  />
                                  {adminMailDropdownSearch && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAdminMailDropdownSearch('');
                                      }}
                                      className="text-purple-600 hover:text-purple-800 text-xs font-bold px-1.5 cursor-pointer shrink-0"
                                    >
                                      مسح
                                    </button>
                                  )}
                                </div>

                                {/* Options Scrollable Container */}
                                <div className="max-h-[220px] overflow-y-auto divide-y divide-slate-100 font-sans">
                                  {(() => {
                                    const searchLower = adminMailDropdownSearch.trim().toLowerCase();
                                    const matchingOptions = filteredRecipients.filter((prov: any) => {
                                      if (!searchLower) return true;
                                      return (
                                        prov.name.toLowerCase().includes(searchLower) ||
                                        (prov.packageName && prov.packageName.toLowerCase().includes(searchLower)) ||
                                        (prov.city && prov.city.toLowerCase().includes(searchLower)) ||
                                        (prov.type && prov.type.toLowerCase().includes(searchLower))
                                      );
                                    });

                                    if (matchingOptions.length === 0) {
                                      return (
                                        <div className="p-4 text-center text-xs text-slate-400 font-medium select-none">
                                          {filteredRecipients.length === 0 
                                            ? 'لا يوجد مستلمون مطابقون لتصفية البيانات الحالية!' 
                                            : 'لا توجد نتائج مطابقة لبحثك داخل هذه التصفية!'}
                                        </div>
                                      );
                                    }

                                    return matchingOptions.map((prov: any) => {
                                      const isChecked = adminMailComposeSelected.includes(prov.name);
                                      return (
                                        <div
                                          key={prov.id}
                                          onClick={(e) => {
                                            if (isChecked) {
                                              setAdminMailComposeSelected(prev => prev.filter(n => n !== prov.name));
                                            } else {
                                              setAdminMailComposeSelected(prev => [...prev, prov.name]);
                                            }
                                          }}
                                          className={`flex items-center gap-3 p-2.5 hover:bg-slate-50 transition-colors cursor-pointer select-none ${
                                            isChecked ? 'bg-purple-50/70' : ''
                                          }`}
                                        >
                                          {/* Checkbox strictly on the right of the name (since RTL, right side is start of row) */}
                                          <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => {}} // Controlled by outer div click
                                            className="accent-purple-600 cursor-pointer w-4 h-4 shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                          />
                                          <div className="flex-1 min-w-0 text-right">
                                            <p className="text-[11px] font-black text-slate-800 truncate">{prov.name}</p>
                                            <p className="text-[9px] text-slate-400 font-medium truncate">
                                              {prov.packageName} • {prov.city} • {prov.type}
                                            </p>
                                          </div>
                                        </div>
                                      );
                                    });
                                  })()}
                                </div>

                                {/* Dropdown Footer / Stats & Quick Toggle */}
                                <div className="p-2 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-bold">
                                  <span>نتائج التصفية والبحث: {filteredRecipients.length} شريك</span>
                                  <div className="flex gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const searchLower = adminMailDropdownSearch.trim().toLowerCase();
                                        const matchingOptions = filteredRecipients.filter((prov: any) => {
                                          if (!searchLower) return true;
                                          return (
                                            prov.name.toLowerCase().includes(searchLower) ||
                                            (prov.packageName && prov.packageName.toLowerCase().includes(searchLower)) ||
                                            (prov.city && prov.city.toLowerCase().includes(searchLower)) ||
                                            (prov.type && prov.type.toLowerCase().includes(searchLower))
                                          );
                                        });
                                        const matchingNames = matchingOptions.map((r: any) => r.name);
                                        setAdminMailComposeSelected(prev => {
                                          const next = [...prev];
                                          matchingNames.forEach(name => {
                                            if (!next.includes(name)) next.push(name);
                                          });
                                          return next;
                                        });
                                      }}
                                      className="bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-[9px] font-black transition-colors cursor-pointer"
                                    >
                                      ✓ تحديد نتائج البحث
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAdminMailDropdownOpen(false);
                                      }}
                                      className="bg-slate-200 hover:bg-slate-350 text-slate-755 px-2.5 py-1 rounded text-[9px] font-bold transition-colors cursor-pointer"
                                    >
                                      إغلاق القائمة
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <input
                          type="text"
                          value="الإدارة العليا (مدير النظام)"
                          disabled
                          className="w-full bg-slate-100 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-500 font-bold outline-none font-sans"
                        />
                      )}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">الموضوع (العنوان):</label>
                      <input
                        type="text"
                        placeholder="اكتب عنواناً واضحاً لمحتوى الرسالة..."
                        value={mailComposeSubject}
                        onChange={(e) => setMailComposeSubject(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 outline-none focus:border-amber-500 font-bold"
                        required
                      />
                    </div>

                    <div className="flex-1 flex flex-col min-h-[150px]">
                      <label className="block text-xs font-bold text-slate-700 mb-1">نص ومضمون الرسالة الموثقة:</label>
                      <textarea
                        placeholder="اكتب تفاصيل المراسلة والقرارات والطلبات الرسمية هنا بالتفصيل..."
                        value={mailComposeBody}
                        onChange={(e) => setMailComposeBody(e.target.value)}
                        className="w-full flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-amber-500 resize-none font-sans font-medium leading-relaxed"
                        required
                      />
                    </div>

                    {/* Simulated File Upload Drag/Drop Section */}
                    <div className="bg-slate-50/50 border-2 border-dashed border-slate-200 rounded-2xl p-4">
                      <span className="block text-xs font-bold text-slate-700 mb-2 border-r-2 border-amber-500 pr-2">إرفاق ملفات / وثائق ثبوتية:</span>
                      <div className="flex flex-wrap gap-2 mb-3">
                        {mailComposeAttachments.map((att, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-amber-500/10 text-amber-805 px-3 py-1.5 rounded-lg text-xs font-bold border border-amber-500/20 shadow-sm">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span>{att.name} ({att.size})</span>
                            <button
                              type="button"
                              onClick={() => {
                                setMailComposeAttachments(prev => prev.filter((_, i) => i !== idx));
                              }}
                              className="text-red-550 hover:text-red-700 font-bold text-base transition-colors ml-1 cursor-pointer"
                            >
                              &times;
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const simulatedFiles = [
                              { name: 'عقد_التشغيل_المحدث_ليلة_2026.pdf', size: '2.1 MB', type: 'pdf' },
                              { name: 'رخصة_الدفاع_المدني_سارية.jpg', size: '940 KB', type: 'jpg' },
                              { name: 'السجل_التجاري_المصدق_الشركاء.png', size: '1.2 MB', type: 'png' },
                              { name: 'كشف_الحساب_البنكي_التفصيلي.pdf', size: '750 KB', type: 'pdf' }
                            ];
                            // Pick random
                            const randFile = simulatedFiles[Math.floor(Math.random() * simulatedFiles.length)];
                            if (mailComposeAttachments.some(f => f.name === randFile.name)) {
                              showNotification('error', 'تم إرفاق هذا المستند بالفعل!');
                              return;
                            }
                            setMailComposeAttachments(prev => [...prev, randFile]);
                            showNotification('success', `تم إرفاق المستند بنجاح: ${randFile.name}`);
                          }}
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 border border-slate-200/50 cursor-pointer"
                        >
                          <UploadCloud className="w-4 h-4 text-slate-500" />
                          إرفاق وثيقة ثبوتية عشوائية
                        </button>
                        <span className="text-[10px] text-slate-400 self-center leading-relaxed font-medium">اختر لإرفاق مستندات وعقود للتحميل المباشر للشركاء للمصداقية.</span>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end shrink-0 pt-2 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setMailIsComposing(false)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                      >
                        إلغاء والعودة
                      </button>
                      
                      <button
                        type="button"
                        onClick={() => {
                          const isUserAdmin = userRole === 'admin';
                          const recipients = isUserAdmin ? adminMailComposeSelected : [mailComposeTo];
                          
                          const draftId = mailDraftId || 'draft_' + Date.now();
                          
                          const draftMsg = {
                            id: draftId,
                            sender: isUserAdmin ? 'الإدارة' : currentProviderName,
                            recipient: isUserAdmin ? (recipients.length > 0 ? recipients[0] : '') : 'الإدارة',
                            subject: mailComposeSubject || 'مسودة غير معنونة',
                            body: mailComposeBody,
                            createdAt: new Date().toISOString(),
                            attachments: mailComposeAttachments,
                            isReadByAdmin: true,
                            isReadByProvider: true,
                            deletedByAdmin: false,
                            deletedByProvider: false,
                            isDraft: true
                          };

                          setMailMessages(prev => {
                            const clean = prev.filter(m => m.id !== draftId);
                            return [draftMsg, ...clean];
                          });

                          setMailIsComposing(false);
                          setMailDraftId(null);
                          setAdminMailComposeSelected([]);
                          setMailComposeTo('');
                          setMailComposeSubject('');
                          setMailComposeBody('');
                          showNotification('success', '💾 تم حفظ المسودة بنجاح! يمكنك مراجعتها وتعديلها في أي وقت من علامة تبويب المسودات.');
                        }}
                        className="bg-amber-150 hover:bg-amber-200 text-amber-900 border border-amber-300 px-5 py-2.5 rounded-xl text-xs font-black transition flex items-center gap-1 cursor-pointer"
                      >
                        💾 حفظ كمسودة
                      </button>

                      <button
                        type="submit"
                        className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-2.5 rounded-xl text-xs font-bold transition shadow-md cursor-pointer"
                      >
                        إرسال الآن 🚀
                      </button>
                    </div>
                  </form>
                </div>
              ) : mailActiveFolder === 'settings' ? (
                /* SETTINGS / CLEANUP CONFIG VIEW */
                <div className="flex-1 p-6 flex flex-col overflow-y-auto bg-slate-50/30">
                  <div className="pb-3 border-b border-slate-100 mb-6">
                    <h3 className="font-extrabold text-slate-800 text-base flex items-center gap-2">
                      <Settings className="w-5 h-5 text-purple-600 animate-spin" />
                      إعدادات البريد الإلكتروني والمراسلات
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">خصص تفضيلات التنبيهات ونظام الحذف والأرشفة التلقائية لرسائل البريد للشركاء والإدارة.</p>
                  </div>

                  <div className="space-y-6 max-w-2xl">
                    {/* NEW SECTION: Audio Alerts Configuration */}
                    <div className="bg-white p-5 rounded-2xl border border-purple-100 shadow-3xs space-y-4">
                      <h4 className="text-xs font-black text-purple-950 flex items-center gap-2 border-b border-purple-50 pb-2">
                        <span>🔊 التنبيهات الصوتية للمراسلات الفورية والبريد الداخلي</span>
                      </h4>
                      <div className="flex items-center justify-between gap-4">
                        <div className="space-y-1">
                          <p className="text-xs font-bold text-slate-800">تفعيل التنبيه الصوتي للبريد الإلكتروني الداخلي</p>
                          <p className="text-[10px] text-slate-500 leading-relaxed">تشغيل نغمة رنين ثنائية الطبقة ذكية ومميزة فور استلام أي بريد رسمي جديد من الشركاء أو الإدارة.</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const nextState = !isMailSoundEnabled;
                            setIsMailSoundEnabled(nextState);
                            if (nextState) {
                              playMessageAlertSound(); 
                              showNotification('success', '🔊 تم تفعيل جرس تنبيه البريد الإلكتروني الداخلي بنجاح');
                            } else {
                              showNotification('info', '🔇 تم كتم صوت تنبيهات البريد الإلكتروني');
                            }
                          }}
                          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isMailSoundEnabled ? 'bg-purple-600' : 'bg-slate-200'
                          }`}
                        >
                          <span
                            aria-hidden="true"
                            className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isMailSoundEnabled ? '-translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* ARCHIVE AND AUTOMATIC CLEANUP SECTION */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm space-y-6">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-2 border-b border-slate-150 pb-2">
                        <span>📥 إعدادات الأرشفة والمسح التلقائي للرسائل</span>
                      </h4>

                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3 text-amber-800">
                        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                        <div className="text-xs leading-relaxed font-medium">
                          <p className="font-bold mb-1">اللوائح القياسية لحوكمة رسائل المنصة:</p>
                          <p>تخضع جميع سلال المحذوفات للإتلاف الجبري بعد مرور 30 يوماً من تاريخ الحذف الإداري. بإمكانك تخصيص فترات منخفضة لتلقي وتنظيف صندوقي البريد الوارد والصادر الأقدم لتسهيل الحساب المالي بمصداقية عالية.</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 shadow-inner">
                          <label className="block text-xs font-bold text-slate-700 mb-2">مدة الحذف التلقائي لرسائل صندوق الوارد (بالأيام):</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={mailInboxCleanupDays}
                              onChange={(e) => setMailInboxCleanupDays(Math.max(1, Number(e.target.value)))}
                              className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-black w-24 text-center outline-none focus:border-amber-500"
                            />
                            <span className="text-xs text-slate-550 font-bold">يوم</span>
                          </div>
                          <span className="block text-[10px] text-slate-455 mt-2 font-medium">سيقوم النظام فوراً بالمسح الدوري التلقائي للرسائل الواردة التي مضى عليها هذه المدة.</span>
                        </div>

                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 shadow-inner">
                          <label className="block text-xs font-bold text-slate-700 mb-2">مدة الحذف التلقائي لرسائل صندوق الصادر (بالأيام):</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              min="1"
                              max="365"
                              value={mailSentCleanupDays}
                              onChange={(e) => setMailSentCleanupDays(Math.max(1, Number(e.target.value)))}
                              className="bg-white border border-slate-200 rounded-lg p-2 text-xs font-black w-24 text-center outline-none focus:border-amber-500"
                            />
                            <span className="text-xs text-slate-550 font-bold">يوم</span>
                          </div>
                          <span className="block text-[10px] text-slate-455 mt-2 font-medium">سيقوم النظام فوراً بالمسح الدوري التلقائي للرسائل الصادرة المرسلة قبل هذا السقف.</span>
                        </div>

                        {/* Auto Signature Section */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-250 shadow-inner col-span-1 md:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <span>✍️ التوقيع التلقائي للبريد الداخلي (المستخدم الحالي):</span>
                            <span className="text-[10px] bg-slate-200/60 text-slate-500 font-normal px-2 py-0.5 rounded">يضاف آلياً</span>
                          </label>
                          <textarea
                            placeholder="اكتب اسمك، مسمّاك الوظيفي، وتفاصيل الاتصال ليتم إدراجهم تلقائياً في نهاية كل رسالة جديدة أو رد..."
                            value={mailSignature}
                            onChange={(e) => setMailSignature(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-black outline-none h-24 resize-none font-sans focus:border-purple-500 leading-relaxed text-right"
                          />
                          <span className="block text-[10px] text-slate-455 mt-2 font-medium">خطابك سيحمل هذا التوقيع تلقائياً في الأسفل، مما يضفي طابعاً رسمياً على كرسائلك ومراسلاتك داخل المنصة.</span>
                        </div>
                      </div>

                      <div className="border-t border-slate-150 pt-4 flex gap-3 items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
                          <span className="text-xs text-slate-500 font-bold">جدولة التنظيف التلقائي مستمرة بأمان.</span>
                        </div>
                        
                        <button
                          type="button"
                          onClick={runMailAutoCleanup}
                          className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2.5 rounded-xl text-xs font-black transition-all shadow-md cursor-pointer flex items-center gap-2"
                        >
                          <RefreshCw className="w-4 h-4" />
                          فحص وتشغيل الحذف التلقائي الآن
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* MAIL DIRECTORY split layout: Left is Mail list, Right is Detail view */
                <div className="flex-1 flex flex-col md:flex-row min-h-0">
                  {/* Message List Pane */}
                  <div className="w-full md:w-1/2 border-l border-slate-200 flex flex-col min-h-0 bg-slate-50/50">
                    <div className="p-4 border-b border-slate-200 bg-white shadow-sm shrink-0 flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-slate-800 text-sm">
                          {mailActiveFolder === 'inbox' 
                            ? 'صندوق البريد الوارد' 
                            : mailActiveFolder === 'sent' 
                            ? 'صندوق البريد الصادر' 
                            : mailActiveFolder === 'drafts'
                            ? 'المسودات المحفوظة'
                            : 'سلة المحذوفات الإدارية'}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-medium">
                          {mailActiveFolder === 'inbox' 
                            ? 'الرسائل الواردة إليك للتنسيق والوثائق الرسمية' 
                            : mailActiveFolder === 'sent' 
                            ? 'الرسائل الصادرة والموجهة لشركاء منصة ليلة' 
                            : mailActiveFolder === 'drafts'
                            ? 'المسودات والرسائل غير المكتملة المحفوظة للمتابعة'
                            : 'سلة الإتلاف والرسائل المستبعدة مؤقتاً'}
                        </p>
                      </div>
                      <span className="bg-slate-100 text-slate-700 text-xs font-black px-2.5 py-1 rounded-lg">
                        {(() => {
                          const folderMails = mailMessages.filter(msg => {
                            let pass = false;
                            if (mailActiveFolder === 'inbox') {
                              if (userRole === 'admin') {
                                pass = msg.recipient === 'الإدارة' && !msg.deletedByAdmin && !msg.isDraft;
                              } else {
                                pass = msg.recipient === currentProviderName && !msg.isDraft;
                              }
                            } else if (mailActiveFolder === 'sent') {
                              if (userRole === 'admin') {
                                pass = msg.sender === 'الإدارة' && !msg.deletedByAdmin && !msg.isDraft;
                              } else {
                                pass = msg.sender === currentProviderName && !msg.isDraft;
                              }
                            } else if (mailActiveFolder === 'drafts') {
                              if (userRole === 'admin') {
                                pass = msg.sender === 'الإدارة' && !msg.deletedByAdmin && msg.isDraft;
                              } else {
                                pass = msg.sender === currentProviderName && msg.isDraft;
                              }
                            } else {
                              pass = msg.deletedByAdmin === true && !msg.isDraft;
                            }

                            if (!pass) return false;

                            // Apply admin routing filters
                            if (userRole === 'admin') {
                              if (mailAssignedFilter === 'mine') {
                                  return msg.assignedTo === currentUserName;
                              } else if (mailAssignedFilter === 'unassigned') {
                                return !msg.assignedTo;
                              } else if (mailAssignedFilter.startsWith('staff_')) {
                                const targetStaff = mailAssignedFilter.replace('staff_', '');
                                return msg.assignedTo === targetStaff;
                              }
                            }
                            return true;
                          });
                          return folderMails.length;
                        })()} رسالة
                      </span>
                    </div>

                    {/* لوحة فلترة ومتابعة توجيه الموظفين (فقط للمشرف المالي والإداري) */}
                    {userRole === 'admin' && (
                      <div className="px-4 py-3 border-b border-slate-200/60 bg-white shrink-0 flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-500 block">شريط فلترة توجيه البريد وبث المسؤوليات:</span>
                        <div className="flex flex-wrap gap-1.5 items-center">
                          <button
                            type="button"
                            onClick={() => setMailAssignedFilter('all')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                              mailAssignedFilter === 'all' 
                                ? 'bg-amber-500 text-slate-900 shadow-3xs' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            الكل
                          </button>
                          <button
                            type="button"
                            onClick={() => setMailAssignedFilter('mine')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all flex items-center gap-1 ${
                              mailAssignedFilter === 'mine' 
                                ? 'bg-slate-900 text-white shadow-3xs' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                            title={`الموجه لـ: ${currentUserName}`}
                          >
                            <span>موجه لي 🧑‍💼</span>
                            {mailMessages.filter(m => m.recipient === 'الإدارة' && !m.deletedByAdmin && m.assignedTo === currentUserName).length > 0 && (
                              <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></span>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setMailAssignedFilter('unassigned')}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-black transition-all ${
                              mailAssignedFilter === 'unassigned' 
                                ? 'bg-slate-900 text-white shadow-3xs' 
                                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            }`}
                          >
                            غير موجه 📥
                          </button>
                          
                          <select
                            value={mailAssignedFilter.startsWith('staff_') ? mailAssignedFilter : 'all'}
                            onChange={(e) => setMailAssignedFilter(e.target.value)}
                            className="flex-1 min-w-[130px] bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black p-1 text-slate-750 focus:outline-none"
                          >
                            <option value="all">🔍 فلترة باسم موظف طاقم الإدارة...</option>
                            {staffList.map((emp: any, idx) => (
                              <option key={`staff-opt-${emp.id}-${idx}`} value={`staff_${emp.name}`}>{emp.name} ({emp.role})</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    )}

                    {/* Infinite Scrollable Message Items */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
                      {(() => {
                        const folderMails = mailMessages.filter(msg => {
                          let pass = false;
                          if (mailActiveFolder === 'inbox') {
                            if (userRole === 'admin') {
                              pass = msg.recipient === 'الإدارة' && !msg.deletedByAdmin && !msg.isDraft;
                            } else {
                              pass = msg.recipient === currentProviderName && !msg.isDraft;
                            }
                          } else if (mailActiveFolder === 'sent') {
                            if (userRole === 'admin') {
                              pass = msg.sender === 'الإدارة' && !msg.deletedByAdmin && !msg.isDraft;
                            } else {
                              pass = msg.sender === currentProviderName && !msg.isDraft;
                            }
                          } else if (mailActiveFolder === 'drafts') {
                            if (userRole === 'admin') {
                              pass = msg.sender === 'الإدارة' && !msg.deletedByAdmin && msg.isDraft;
                            } else {
                              pass = msg.sender === currentProviderName && msg.isDraft;
                            }
                          } else {
                            pass = msg.deletedByAdmin === true && !msg.isDraft;
                          }

                          if (!pass) return false;

                          // Apply admin routing filters
                          if (userRole === 'admin') {
                            if (mailAssignedFilter === 'mine') {
                              return msg.assignedTo === currentUserName;
                            } else if (mailAssignedFilter === 'unassigned') {
                              return !msg.assignedTo;
                            } else if (mailAssignedFilter.startsWith('staff_')) {
                              const targetStaff = mailAssignedFilter.replace('staff_', '');
                              return msg.assignedTo === targetStaff;
                            }
                          }
                          return true;
                        });

                        if (folderMails.length === 0) {
                          return (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-white rounded-xl border border-slate-100 p-6 shadow-3xs">
                              <Mail className="w-10 h-10 stroke-1 opacity-25 text-slate-500 mb-2" />
                              <span className="text-xs font-bold text-slate-800">صندوق البريد فارغ تماماً</span>
                              <span className="text-[10px] text-slate-400 mt-1">لا توجد رسائل مسجلة في هذا التبويب حالياً.</span>
                            </div>
                          );
                        }

                        return folderMails.map((msg) => {
                          const isUnread = userRole === 'admin' 
                            ? (msg.recipient === 'الإدارة' && !msg.isReadByAdmin)
                            : (msg.recipient === currentProviderName && !msg.isReadByProvider);
                          
                          const isActive = mailSelectedId === msg.id;

                          return (
                            <div
                              key={msg.id}
                              onClick={() => {
                                if (mailActiveFolder === 'drafts') {
                                  setMailDraftId(msg.id);
                                  setMailComposeSubject(msg.subject || '');
                                  setMailComposeBody(msg.body || '');
                                  setMailComposeAttachments(msg.attachments || []);
                                  if (userRole === 'admin') {
                                    setAdminMailComposeSelected(msg.recipient ? [msg.recipient] : []);
                                  } else {
                                    setMailComposeTo(msg.recipient || '');
                                  }
                                  setMailIsComposing(true);
                                  setMailSelectedId(null);
                                  showNotification('info', '✏️ جاري تحميل المسودة لإكمال الكتابة وإرسالها...');
                                  return;
                                }

                                setMailSelectedId(msg.id);
                                setMailEditingId(null);
                                // Mark as read
                                setMailMessages(prev => prev.map(m => {
                                  if (m.id === msg.id) {
                                    return {
                                      ...m,
                                      isReadByAdmin: userRole === 'admin' ? true : m.isReadByAdmin,
                                      isReadByProvider: userRole === 'provider' ? true : m.isReadByProvider
                                    };
                                  }
                                  return m;
                                }));
                              }}
                              className={`p-4 rounded-xl border transition-all cursor-pointer relative flex flex-col gap-1.5 ${
                                isActive 
                                  ? 'bg-amber-500/10 border-amber-500 shadow-sm' 
                                  : 'bg-white hover:bg-slate-50 border-slate-200/75 shadow-sm'
                              }`}
                            >
                              {isUnread && (
                                <span className="absolute top-4 right-3 w-2 h-2 rounded-full bg-red-650 animate-pulse"></span>
                              )}
                              
                              <div className="flex justify-between items-start gap-2 pl-2">
                                <span className={`text-xs text-slate-805 truncate font-black ${isUnread ? 'pr-3 font-extrabold' : ''}`}>
                                  {mailActiveFolder === 'inbox' 
                                    ? `من: ${msg.sender}` 
                                    : mailActiveFolder === 'drafts'
                                    ? `📝 مسودة مبرمجة إلى: ${msg.recipient || 'لا يوجد مستلم بعد'}`
                                    : `إلى: ${msg.recipient}`}
                                </span>
                                <span className="text-[10px] text-slate-400 font-mono flex-shrink-0">
                                  {new Date(msg.createdAt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                                </span>
                              </div>

                              <h5 className={`text-xs text-slate-800 truncate ${isUnread ? 'font-black text-slate-900' : 'font-bold'}`}>
                                {msg.subject}
                              </h5>
                              
                              <p className="text-[11px] text-slate-505 line-clamp-2 leading-relaxed">
                                {msg.body}
                              </p>

                              {msg.attachments && msg.attachments.length > 0 && (
                                <div className="flex items-center gap-1.5 mt-1">
                                  <Paperclip className="w-3 h-3 text-slate-450" />
                                  <span className="text-[9px] text-slate-400 font-medium font-sans">
                                    {msg.attachments.length} مرفقات ({msg.attachments.map((a: any) => a.name).join(', ')})
                                  </span>
                                </div>
                              )}

                              {userRole === 'admin' && msg.assignedTo && (
                                <div className="self-start mt-1.5 px-2 py-0.5 bg-slate-900 text-amber-400 rounded-md text-[9px] font-black flex items-center gap-1 shadow-sm">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                                  المكلف بالمتابعة: {msg.assignedTo}
                                </div>
                              )}
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>

                  {/* Message Detail View Pane (Right / Side) */}
                  <div className="flex-1 bg-white flex flex-col min-h-0 p-5 overflow-y-auto">
                    {(() => {
                      const selectedMsg = mailMessages.find(m => m.id === mailSelectedId);

                      if (!selectedMsg) {
                        return (
                          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center py-20">
                            <Mail className="w-12 h-12 mb-3 opacity-20 text-amber-550" />
                            <p className="font-extrabold text-sm text-slate-800">قراءة الرسائل والوثائق الرسمية</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-xs font-medium">اختر أي رسالة من القائمة لعرض كامل تفاصيلها، إيصالات المرفقات، والرد أو التعديل الفوري.</p>
                          </div>
                        );
                      }

                      const creationTime = new Date(selectedMsg.createdAt);
                      const isLess24Hours = (Date.now() - creationTime.getTime()) < 24 * 60 * 60 * 1000;

                      return (
                        <div className="space-y-5 animate-in fade-in duration-200">
                          {/* Heading & Metadata */}
                          <div className="pb-3 border-b border-slate-100">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="text-sm font-black text-slate-900 leading-relaxed">
                                {selectedMsg.subject}
                              </h3>
                              <div className="flex gap-1.5 flex-shrink-0">
                                {/* Reply (only allowed for Provider to reply and Admin to reply) */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setMailIsComposing(true);
                                    setMailComposeTo(selectedMsg.sender === 'الإدارة' ? 'الإدارة' : selectedMsg.sender);
                                    setMailComposeSubject(`رد: ${selectedMsg.subject}`);
                                    setMailComposeBody(`\n\n\n---------- المراسلة الأصلية ----------\nمن: ${selectedMsg.sender}\nالتاريخ: ${new Date(selectedMsg.createdAt).toLocaleString('ar-SA')}\n\n${selectedMsg.body}`);
                                    setMailComposeAttachments([]);
                                  }}
                                  className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-black transition cursor-pointer"
                                  title="الرد على الرسالة"
                                >
                                  رد ✉️
                                </button>

                                {/* Admin Edit Section -> only allowed for ADMIN and message <= 24 hours */}
                                {userRole === 'admin' && selectedMsg.sender === 'الإدارة' && isLess24Hours && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMailEditingId(selectedMsg.id);
                                      setMailEditSubject(selectedMsg.subject);
                                      setMailEditBody(selectedMsg.body);
                                    }}
                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-black border border-blue-200 transition cursor-pointer"
                                    title="تعديل الرسالة (متاح أول 24 ساعة فقط)"
                                  >
                                    تعديل
                                  </button>
                                )}

                                {/* Admin Deletion Sec -> only allowed for ADMIN. Moves to Trash first. */}
                                {userRole === 'admin' && (
                                  <>
                                    {!selectedMsg.deletedByAdmin ? (
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMailMessages(prev => prev.map(m => m.id === selectedMsg.id ? { ...m, deletedByAdmin: true, deletedAt: new Date().toISOString() } : m));
                                          setMailSelectedId(null);
                                          showNotification('success', 'تم نقل الرسالة لسلة المحذوفات بنجاح. سيتم التخلص منها نهائياً بعد 30 يوماً.');
                                        }}
                                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition shrink-0 cursor-pointer"
                                        title="نقل إلى سلة المحذوفات"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    ) : (
                                      <>
                                        {/* Restore Option & Delete Permanently */}
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMailMessages(prev => prev.map(m => m.id === selectedMsg.id ? { ...m, deletedByAdmin: false, deletedAt: null } : m));
                                            setMailSelectedId(null);
                                            showNotification('success', 'تمت استعادة الرسالة بنجاح إلى صندوق البريد المناسب!');
                                          }}
                                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 rounded-lg text-xs font-black border border-emerald-200 transition cursor-pointer"
                                          title="استعادة الرسالة"
                                        >
                                          استعادة 🔄
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setMailMessages(prev => prev.filter(m => m.id !== selectedMsg.id));
                                            setMailSelectedId(null);
                                            showNotification('success', 'تم حذف الرسالة نهائياً من قاعدة البيانات بنجاح!');
                                          }}
                                          className="p-1.5 text-red-600 hover:bg-red-100 rounded-lg transition cursor-pointer"
                                          title="حذف نهائي فوري"
                                        >
                                          حذف نهائي
                                        </button>
                                      </>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-slate-500 font-medium font-sans">
                              <span>من: <strong className="text-slate-800 font-bold">{selectedMsg.sender}</strong></span>
                              <span>المرسل إليه: <strong className="text-slate-800 font-bold">{selectedMsg.recipient}</strong></span>
                              <span>التاريخ: <strong className="text-slate-800 font-semibold font-mono">{new Date(selectedMsg.createdAt).toLocaleString('ar-SA')}</strong></span>
                              {selectedMsg.sender === 'الإدارة' && !isLess24Hours && (
                                <span className="text-slate-400">🕒 مضى أكثر من 24 ساعة (مقيدة للتعديل)</span>
                              )}
                            </div>

                            {/* لوحة توجيه وإسناد المراسلة الإدارية لموظفي الإدارة */}
                            {userRole === 'admin' && (
                              <div className="mt-3.5 bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
                                  <div className="flex flex-col">
                                    <span className="text-[11px] font-black text-slate-800">نظام توجيه البريد الذكي لإدارة المنصة</span>
                                    <span className="text-[10px] text-slate-500 font-medium">
                                      {selectedMsg.assignedTo 
                                        ? `مُوجهة بانتظار المتابعة من الموظف: ${selectedMsg.assignedTo}` 
                                        : 'لم يتم توجيه هذه المراسلة لأي موظف إداري بعد.'}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 min-w-[220px]">
                                  <select
                                    value={selectedMsg.assignedTo || ''}
                                    onChange={(e) => {
                                      const staffName = e.target.value;
                                      setMailMessages(prev => prev.map(m => {
                                        if (m.id === selectedMsg.id) {
                                          return { ...m, assignedTo: staffName || undefined };
                                        }
                                        return m;
                                      }));

                                      if (staffName) {
                                        showNotification('success', `تم توجيه البريد بنجاح للموظف: ${staffName}`);
                                        
                                        // Push a custom notification for the assigned staff member
                                        const assignedNotif = {
                                          id: 'notif_' + Date.now(),
                                          title: '📬 تم توجيه رسالة بريد إلكتروني إليك',
                                          body: `قام المشرف بتوجيه البريد المعنون "${selectedMsg.subject}" لتتولى متابعتها والرد فوراً.`,
                                          createdAt: new Date().toISOString(),
                                          type: 'mail',
                                          severity: 'medium',
                                          recipientRole: 'admin',
                                          recipientName: staffName, // Target staff gets it
                                          isRead: false
                                        };
                                        setNotifications(prev => [assignedNotif, ...prev]);
                                      } else {
                                        showNotification('success', 'تم تعديل البريد كغير موجه');
                                      }
                                    }}
                                    className="w-full bg-white border border-slate-250 rounded-lg p-1.5 text-[11px] font-black shadow-3xs outline-none focus:border-amber-500 text-slate-800 cursor-pointer"
                                  >
                                    <option value="">-- اضغط لإسناد وتوجيه الموظف --</option>
                                    {staffList.map((emp: any, idx) => (
                                      <option key={`reservation-staff-${emp.id}-${idx}`} value={emp.name}>
                                        {emp.name} ({emp.role})
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Editable Form Block inline for ADMIN */}
                          {mailEditingId === selectedMsg.id ? (
                            <form
                              onSubmit={(e) => {
                                e.preventDefault();
                                if (!mailEditSubject.trim() || !mailEditBody.trim()) {
                                  showNotification('error', 'يرجى ملء جميع الخانات للتعديل!');
                                  return;
                                }
                                setMailMessages(prev => prev.map(m => {
                                  if (m.id === selectedMsg.id) {
                                    return {
                                      ...m,
                                      subject: mailEditSubject,
                                      body: mailEditBody
                                    };
                                  }
                                  return m;
                                }));
                                setMailEditingId(null);
                                showNotification('success', 'تم حفظ وتوثيق تعديلات الرسالة الإدارية بنجاح!');
                              }}
                              className="bg-amber-50 border border-amber-200 p-4 rounded-xl space-y-3 animate-in zoom-in-95 shrink-0"
                            >
                              <span className="block text-xs font-black text-amber-900">وضع تعديل الرسالة الإدارية (ضمن 24 ساعة):</span>
                              
                              <div>
                                <label className="block text-[10px] font-bold text-slate-650 mb-1">الموضوع المعدل:</label>
                                <input
                                  type="text"
                                  value={mailEditSubject}
                                  onChange={(e) => setMailEditSubject(e.target.value)}
                                  className="w-full bg-white border border-amber-200 rounded-lg p-2 text-xs font-bold outline-none text-slate-800"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold text-slate-650 mb-1">المحتوى المعدل للرسالة:</label>
                                <textarea
                                  value={mailEditBody}
                                  onChange={(e) => setMailEditBody(e.target.value)}
                                  className="w-full h-40 bg-white border border-amber-200 rounded-lg p-2.5 text-xs font-medium outline-none text-slate-800 font-sans leading-relaxed resize-none"
                                />
                              </div>

                              <div className="flex gap-2 justify-end">
                                <button
                                  type="button"
                                  onClick={() => setMailEditingId(null)}
                                  className="px-3 py-1.5 bg-slate-200/85 hover:bg-slate-200 text-slate-705 rounded-lg text-xs font-bold transition cursor-pointer"
                                >
                                  إلغاء التعديل
                                </button>
                                <button
                                  type="submit"
                                  className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-900 rounded-lg text-xs font-black transition cursor-pointer"
                                >
                                  حفظ التغييرات 💾
                                </button>
                              </div>
                            </form>
                          ) : (
                            /* Regular Message Body Display */
                            <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100 text-xs text-slate-800 leading-relaxed font-sans font-medium whitespace-pre-wrap max-h-[300px] overflow-y-auto">
                              {selectedMsg.body}
                            </div>
                          )}

                          {/* Interactive Subscription Approval Card for Admins */}
                          {selectedMsg.isSubscriptionApprovalRequest && (
                            <div className="mt-4 p-4 rounded-2xl border bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border-blue-200 shadow-3xs animate-in fade-in slide-in-from-bottom-2 duration-300 antialiased text-right" dir="rtl">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-blue-500/10 text-blue-700 rounded-xl">
                                  <Crown className="w-5 h-5 animate-pulse" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-xs font-black text-slate-900">طلب ترقية باقة اشتراك معلق (تحويل مالي للتدقيق)</h4>
                                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                                    يرجى التحقق من صحة وقيمة إيصال التحويل البنكي المرفق أسفل الرسالة قبل الاعتماد. عند تفعيل الطلب، سيتم ترقية حساب المزود تلقائياً وإدراجه ضمن إيرادات المنصة فوراً.
                                  </p>
                                  
                                  {/* Render Attachments Receipt Preview Immediately */}
                                  {selectedMsg.attachments && selectedMsg.attachments[0]?.receiptPreview && (
                                    <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden bg-white max-w-xs relative group shadow-3xs">
                                      <img 
                                        src={selectedMsg.attachments[0].receiptPreview} 
                                        alt="إيصال الحوالة" 
                                        className="w-full max-h-48 object-contain cursor-zoom-in group-hover:scale-102 transition-all p-2"
                                        onClick={() => {
                                          const win = window.open();
                                          if (win) {
                                            win.document.write(`<img src="${selectedMsg.attachments[0].receiptPreview}" style="max-width:100%; height:auto; display:block; margin:20px auto;" />`);
                                          } else {
                                            showNotification('success', 'لقد قمنا بتكبير مستند إيصال الحوالة أمامك.');
                                          }
                                        }}
                                      />
                                      <div className="absolute bottom-2 right-2 bg-slate-900/70 text-white text-[9px] px-2 py-0.5 rounded-full font-bold">إيصال التحويل البنكي المرفق</div>
                                    </div>
                                  )}

                                  <div className="mt-4 flex flex-wrap gap-2">
                                    {selectedMsg.approvalStatus === 'pending' ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Approve flow!
                                            const updatedMails = mailMessages.map(m => {
                                              if (m.id === selectedMsg.id) {
                                                return { ...m, approvalStatus: 'approved' };
                                              }
                                              return m;
                                            });
                                            setMailMessages(updatedMails);
                                            localStorage.setItem('PLATFORM_MAIL_MESSAGES', JSON.stringify(updatedMails));
                                            
                                            // Set active subscription for the provider
                                            const planId = selectedMsg.upgradeDetails?.planId || 'pro';
                                            const pName = selectedMsg.upgradeDetails?.packageName || 'الباقة الذهبية';
                                            const cycle = selectedMsg.upgradeDetails?.billingCycle || 'monthly';
                                            const price = selectedMsg.upgradeDetails?.price || 1000;
                                            const provName = selectedMsg.upgradeDetails?.currentProviderName || selectedMsg.sender;

                                            const newSub = { 
                                              planId: planId, 
                                              packageName: pName,
                                              packageName_display: pName,
                                              includesInventory: true,
                                              includesSuppliers: true,
                                              canExportFinancials: true,
                                              hasSupport: true,
                                              includesGrowthCharts: true,
                                              includesFinancialForecast: true,
                                              includesPartialPayment: true,
                                              includesAdvancedStats: true,
                                              includesFullManagement: true,
                                              includesAdvancedProviderDashboard: true,
                                              hallsLimit: 10,
                                              servicesLimit: 10,
                                              staffSeatsLimit: 10,
                                              billingCycle: cycle,
                                              price: price,
                                              commissionRate: 0.15,
                                              startDate: new Date().toISOString()
                                            };
                                            
                                            localStorage.setItem(`provider_subscription_${provName}`, JSON.stringify(newSub));
                                            localStorage.setItem('provider_subscription', JSON.stringify(newSub));
                                            
                                            // Reset pending state keys
                                            localStorage.removeItem(`pending_sub_request_${provName}`);
                                            localStorage.removeItem('pending_subscription_under_review');
                                            
                                            // Upgrade actual customer role to 'مزود'
                                            const storedUser = localStorage.getItem('currentUser');
                                            if (storedUser) {
                                              try {
                                                const parsedUser = JSON.parse(storedUser);
                                                if (parsedUser.name === provName) {
                                                  parsedUser.role = 'مزود';
                                                  localStorage.setItem('currentUser', JSON.stringify(parsedUser));
                                                }
                                              } catch {}
                                            }

                                            // Sync to providersData
                                            try {
                                              const savedProviders = localStorage.getItem('providersData');
                                              if (savedProviders) {
                                                const list = JSON.parse(savedProviders);
                                                const item = list.find((p: any) => p.name === provName);
                                                if (item) {
                                                  item.packageName = pName;
                                                  item.packageDuration = cycle;
                                                  safeSetLocalStorage('providersData', list);
                                                }
                                              }
                                            } catch (e) {}

                                            // Add fee to Platform Revenues!
                                            const storedRevenues = localStorage.getItem('PLATFORM_REVENUES');
                                            let revenuesList = [];
                                            if (storedRevenues) {
                                              try { revenuesList = JSON.parse(storedRevenues); } catch(e) {}
                                            }
                                            const vatAmount = price - (price / 1.15);
                                            const baseAmount = price / 1.15;
                                            const newRevId = 'RV-SUB-' + Math.floor(Math.random() * 10000);
                                            
                                            revenuesList.unshift({
                                              id: newRevId,
                                              date: new Date().toISOString().split('T')[0],
                                              title: `اشتراك باقة ${pName} - ${provName}`,
                                              type: 'اشتراك',
                                              amount: Number(baseAmount.toFixed(2)),
                                              vat: Number(vatAmount.toFixed(2)),
                                              total: Number(price),
                                              provider: provName
                                            });
                                            localStorage.setItem('PLATFORM_REVENUES', JSON.stringify(revenuesList));

                                            // Send confirmation email back to provider
                                            const replyMailId = 'mail_reply_sub_' + Date.now();
                                            const confirmationMail = {
                                              id: replyMailId,
                                              sender: "الإدارة",
                                              recipient: provName,
                                              subject: `✓ تم اعتماد وتفعيل باقتك: ${pName} بنجاح!`,
                                              body: `السلام عليكم ورحمة الله وبركاته،\n\nنهنئكم بأنه تم اعتماد حوالتكم البنكية والتحقق من إيصال الدفع بنجاح.\nتم تفعيل اشتراكك وإتاحة كامل ميزات باقة "${pName}" على حسابكم كـشريك لـمنصة ليلة التفاعلية.\n\nنتمنى لكم مزيداً من النجاح والأرباح والمناسبات اللامعة.\n\nتقبلوا أطيب التحيات.\nإدارة الحسابات والتدقيق المالي - منصة ليلة لخدمات المناسبات والضيافة.`,
                                              createdAt: new Date().toISOString(),
                                              isReadByAdmin: true,
                                              isReadByProvider: false,
                                              deletedByAdmin: false,
                                              deletedByProvider: false,
                                              isSubscriptionApprovalResult: true,
                                              resultType: 'approved'
                                            };
                                            updatedMails.unshift(confirmationMail);
                                            localStorage.setItem('PLATFORM_MAIL_MESSAGES', JSON.stringify(updatedMails));
                                            setMailMessages(updatedMails);

                                            // Create notification for the user
                                            const userNotifs = localStorage.getItem('app_notifications') || '[]';
                                            let userNotifList = [];
                                            try { userNotifList = JSON.parse(userNotifs); } catch(e) {}
                                            userNotifList.unshift({
                                              id: 'notif_sub_ok_' + Date.now(),
                                              title: '✓ تم تفعيل اشتراكك البنكي',
                                              body: `باقة "${pName}" نشطة الآن! نتمنى لك تجربة موفقة.`,
                                              createdAt: new Date().toISOString(),
                                              type: 'system',
                                              severity: 'high',
                                              recipientName: provName,
                                              isRead: false
                                            });
                                            localStorage.setItem('app_notifications', JSON.stringify(userNotifList));

                                            window.dispatchEvent(new Event('subscriptionUpdated'));
                                            window.dispatchEvent(new Event('mailMessagesUpdated'));
                                            window.dispatchEvent(new Event('notificationsUpdated'));
                                            window.dispatchEvent(new Event('financeUpdated'));

                                            showNotification('success', `تم تفعيل باقة "${pName}" بنجاح للشريك وإدراج المبلغ ${price} ر.س في الإيرادات!`);
                                          }}
                                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                                        >
                                          الموافقة واعتماد التحويل المالي ورقماً في الإيرادات ✓
                                        </button>
                                        
                                        <button
                                          type="button"
                                          onClick={() => {
                                            // Reject flow!
                                            const updatedMails = mailMessages.map(m => {
                                              if (m.id === selectedMsg.id) {
                                                return { ...m, approvalStatus: 'rejected' };
                                              }
                                              return m;
                                            });
                                            setMailMessages(updatedMails);
                                            localStorage.setItem('PLATFORM_MAIL_MESSAGES', JSON.stringify(updatedMails));
                                            
                                            const provName = selectedMsg.upgradeDetails?.currentProviderName || selectedMsg.sender;
                                            const pName = selectedMsg.upgradeDetails?.packageName || 'الباقة';

                                            localStorage.removeItem(`pending_sub_request_${provName}`);
                                            localStorage.removeItem('pending_subscription_under_review');

                                            // Send reply back to provider
                                            const replyMailId = 'mail_reply_sub_' + Date.now();
                                            const rejectionMail = {
                                              id: replyMailId,
                                              sender: "الإدارة",
                                              recipient: provName,
                                              subject: `❌ تعذر تفعيل باقة اشتراكك: ${pName}`,
                                              body: `السلام عليكم ورحمة الله وبركاته،\n\nنود إفادتكم بأنه بعد التدقيق المالي، تعذر تأكيد عملية التحويل البنكي المرفقة لطلبكم.\nيرجى التحقق من عملية التحويل وتحميل صورة واضحة لإيصال الدفع عبر ملفكم الشخصي ليتسنى لنا تفعيله بشكل سليم.\n\nشاكرين اهتمامكم وتفهمكم العام.\nقسم التدقيق والتحصيل المالي - منصة ليلة لخدمات المناسبات.`,
                                              createdAt: new Date().toISOString(),
                                              isReadByAdmin: true,
                                              isReadByProvider: false,
                                              deletedByAdmin: false,
                                              deletedByProvider: false,
                                              isSubscriptionApprovalResult: true,
                                              resultType: 'rejected'
                                            };
                                            updatedMails.unshift(rejectionMail);
                                            localStorage.setItem('PLATFORM_MAIL_MESSAGES', JSON.stringify(updatedMails));
                                            setMailMessages(updatedMails);

                                            window.dispatchEvent(new Event('subscriptionUpdated'));
                                            window.dispatchEvent(new Event('mailMessagesUpdated'));

                                            showNotification('error', `تعذر التحقق من الحوالة وتم رفض طلب تفعيل باقة "${pName}" وإرسال إشعار للشريك بذلك.`);
                                          }}
                                          className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-3xs"
                                        >
                                          رفض الحوالة وإلغاء الطلب ❌
                                        </button>
                                      </>
                                    ) : (
                                      <div className={`text-xs font-black px-3.5 py-1.5 rounded-xl ${
                                        selectedMsg.approvalStatus === 'approved' 
                                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                                          : 'bg-rose-100 text-rose-700 border border-rose-200'
                                      }`}>
                                        {selectedMsg.approvalStatus === 'approved' 
                                          ? '✓ تم اعتماد التحويل المالي بنجاح، الباقة نشطة حالياً وتم تسجيل الدفعة في قائمة الإيرادات للشركة' 
                                          : '❌ تم رفض الطلب وأرسل اعتراض للشريك لإعادة التدقيق من جديد'}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Message Attachments Section */}
                          {selectedMsg.attachments && selectedMsg.attachments.length > 0 && (
                            <div className="border-t border-slate-100 pt-4">
                              <span className="block text-xs font-bold text-slate-800 mb-2 border-r-2 border-amber-500 pr-2">المرفقات والوثائق العقاقير والتعميدات:</span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {selectedMsg.attachments.map((att: any, idx: number) => (
                                  <div
                                    key={idx}
                                    onClick={() => {
                                      showNotification('success', `جاري تحميل المستند الموثق: ${att.name}...`);
                                      try {
                                        const link = document.createElement('a');
                                        link.href = att.receiptPreview || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60';
                                        link.download = att.name || 'إيصال_تحويل.png';
                                        link.target = '_blank';
                                        link.rel = 'noopener noreferrer';
                                        document.body.appendChild(link);
                                        link.click();
                                        document.body.removeChild(link);
                                      } catch (err) {
                                        console.error("Failed to download attachment:", err);
                                        window.open(att.receiptPreview || 'https://images.unsplash.com/photo-1554415707-6e8cfc93fe23?w=500&auto=format&fit=crop&q=60', '_blank');
                                      }
                                    }}
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-amber-50/50 hover:border-amber-300 transition-all flex items-center justify-between cursor-pointer shadow-3xs"
                                  >
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <Paperclip className="w-4 h-4 text-slate-400 shrink-0" />
                                      <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 truncate" title={att.name}>{att.name}</p>
                                        <p className="text-[10px] text-slate-400 font-mono mt-0.5">{att.size} • {att.type.toUpperCase()}</p>
                                      </div>
                                    </div>
                                    <span className="text-[10px] text-amber-600 font-extrabold shrink-0 hover:underline">تحميل 📥</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Dynamic Simulator Panel */}
        <div className="bg-slate-900 text-slate-100 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-10 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl animate-pulse">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">لوحة محاكاة وتجربة النظام (العملاء الافتراضيين)</h3>
                <p className="text-xs text-slate-400">استخدم هذه اللوحة لتجربة التنبيهات الصوتية، الفحص التلقائي للرسائل والمخالفات، وتصنيفات الدعم الفني.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 font-mono text-[10px] text-indigo-300 bg-indigo-950/50 px-3 py-1.5 rounded-full border border-indigo-900/40">
              <span>SIMULATION_ENGINE_ONLINE</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            {/* Simulator Column A: Partner Chats */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-300 block mb-3 border-r-2 border-indigo-500 pr-2">محاكاة إرسال رسائل كعميل (محادثات الشركاء):</span>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">اختر المحادثة النشطة حالياً للمحاكاة:</label>
                  <select 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 outline-none focus:border-indigo-500"
                    onChange={(e) => setActiveServiceChat(Number(e.target.value))}
                    value={activeServiceChat || ''}
                  >
                    {serviceChats.map(c => (
                      <option key={c.id} value={c.id}>
                        المزود: {c.providerName} ↔ العميل الافتراضي: {c.customerName}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <span className="block text-xs text-slate-400">انقر لإرسال رسائل اختبار سريعة كعميل:</span>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <button 
                      onClick={() => {
                        const activeChatObj = serviceChats.find(c => c.id === activeServiceChat);
                        if (!activeChatObj) {
                          showNotification('error', 'الرجاء اختيار أو تحديد محادثة نشطة أولاً!');
                          return;
                        }
                        const text = "السلام عليكم، هل بالإمكان التنسيق في أسعار وميزات الحجز؟";
                        
                        playMessageSound(false);
                        const newMessage = {
                          id: Date.now(),
                          senderType: 'عميل',
                          senderName: activeChatObj.customerName,
                          text: text,
                          time: 'الآن',
                          isViolation: false,
                          moderationStatus: 'passed'
                        };

                        setServiceChatMessages(prev => ({
                          ...prev,
                          [activeChatObj.id]: [...(prev[activeChatObj.id] || []), newMessage]
                        }));
                        setServiceChats(prev => prev.map(c => c.id === activeChatObj.id ? { ...c, lastMsg: text, time: 'الآن', unread: 1 } : c));
                        showNotification('success', `محاكاة: أرسل ${activeChatObj.customerName} رسالة سليمة`);
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded border border-slate-800 hover:border-slate-700 transition cursor-pointer"
                    >
                      ✉️ رسالة سليمة (آمنة)
                    </button>

                    <button 
                      onClick={() => {
                        const activeChatObj = serviceChats.find(c => c.id === activeServiceChat);
                        if (!activeChatObj) {
                          showNotification('error', 'الرجاء اختيار أو تحديد محادثة نشطة أولاً!');
                          return;
                        }
                        const text = "تواصل معي على جوالي 0553429810 للتنسيق الخارجي";
                        
                        playMessageSound(true);
                        const newMessage = {
                          id: Date.now(),
                          senderType: 'عميل',
                          senderName: activeChatObj.customerName,
                          text: text,
                          time: 'الآن',
                          isViolation: true,
                          violationType: 'رقم هاتف / تواصل مباشر',
                          moderationStatus: 'pending'
                        };

                        setServiceChatMessages(prev => ({
                          ...prev,
                          [activeChatObj.id]: [...(prev[activeChatObj.id] || []), newMessage]
                        }));
                        setServiceChats(prev => prev.map(c => c.id === activeChatObj.id ? { ...c, lastMsg: text, time: 'الآن', status: 'violation', unread: 1 } : c));
                        showNotification('error', 'محاكاة مخالفة: تم رصد محاولة مشاركة رقم هاتف للاتصال الخارجي!');
                      }}
                      className="bg-slate-900 hover:bg-slate-800 text-rose-455 p-2 rounded border border-slate-800 hover:border-slate-705 transition cursor-pointer"
                    >
                      ⚠️ هاتف (مخالفة/حجب)
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Simulator Column B: Support Requests */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <span className="text-xs font-bold text-slate-300 block mb-3 border-r-2 border-indigo-500 pr-2">محاكاة وإنشاء طلبات دعم فني جديدة كعميل:</span>
              
              <div className="space-y-3">
                <span className="block text-xs text-slate-400">انقر لإنشاء تذكرة دعم فني جديدة في طابور الدعم:</span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <button 
                    onClick={() => {
                      const newId = String(Date.now());
                      const customerName = "زياد الحربي";
                      const text = "لدي مشكلة في استرجاع مبلغ التأمين الخاص بحجز القاعة وإلغائه";
                      const newChat = {
                        id: newId,
                        customerName: customerName,
                        subject: "استفسارات وشكاوى: عام",
                        status: "waiting",
                        assignedStaff: "",
                        lastMsg: text,
                        time: "الآن",
                        unread: 1
                      };
                      setLiveChatQueue(prev => [newChat, ...prev]);
                      setSupportMessages(prev => ({
                        ...prev,
                        [newId]: [{ id: 1, senderName: customerName, senderType: 'customer', text: text, time: 'الآن', isViolation: false, moderationStatus: 'passed' }]
                      }));
                      setActiveSupportChat(newId);
                      showNotification('success', 'تم بدء محادثة استفسارات عامة جديدة');
                    }}
                    className="bg-indigo-950/40 text-indigo-300 p-2 rounded border border-indigo-900/30 hover:bg-indigo-950/60 text-right font-medium transition cursor-pointer"
                  >
                    💌 استفسارات وشكاوى: عام
                  </button>
                </div>
              </div>

              {activeSupportChat && (
                <div className="mt-3 pt-3 border-t border-slate-800 flex gap-2">
                  <input 
                    id="simulationSupportDirectMsg"
                    type="text"
                    placeholder="إرسال رسالة رد كعميل في المحادثة النشطة للإدارة..."
                    className="flex-1 bg-slate-900 border border-slate-800 rounded p-1.5 text-[11px] text-slate-100 outline-none focus:border-indigo-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.currentTarget as HTMLInputElement).value;
                        if (!val.trim()) return;
                        
                        const chatObj = liveChatQueue.find(c => c.id === activeSupportChat);
                        if (!chatObj) return;

                        playMessageSound(false);
                        const newMessage = {
                          id: Date.now(),
                          senderName: chatObj.customerName,
                          senderType: 'customer',
                          text: val,
                          time: 'الآن',
                          isViolation: false,
                          moderationStatus: 'passed'
                        };

                        setSupportMessages(prev => ({
                          ...prev,
                          [activeSupportChat]: [...(prev[activeSupportChat] || []), newMessage]
                        }));
                        setLiveChatQueue(prev => prev.map(c => c.id === activeSupportChat ? { ...c, lastMsg: val, time: 'الآن', unread: c.unread + 1 } : c));
                        
                        (e.currentTarget as HTMLInputElement).value = '';
                        showNotification('success', `تم الرد بنجاح كعميل: ${val}`);
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      const input = document.getElementById('simulationSupportDirectMsg') as HTMLInputElement;
                      if (!input || !input.value.trim()) return;
                      const val = input.value;
                      
                      const chatObj = liveChatQueue.find(c => c.id === activeSupportChat);
                      if (!chatObj) return;

                      playMessageSound(false);
                      const newMessage = {
                        id: Date.now(),
                        senderName: chatObj.customerName,
                        senderType: 'customer',
                        text: val,
                        time: 'الآن',
                        isViolation: false,
                        moderationStatus: 'passed'
                      };

                      setSupportMessages(prev => ({
                        ...prev,
                        [activeSupportChat]: [...(prev[activeSupportChat] || []), newMessage]
                      }));
                      setLiveChatQueue(prev => prev.map(c => c.id === activeSupportChat ? { ...c, lastMsg: val, time: 'الآن', unread: c.unread + 1 } : c));
                      
                      input.value = '';
                      showNotification('success', `تم الرد بنجاح كعميل: ${val}`);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded text-[11px] font-bold cursor-pointer"
                  >
                    أرسل كعميل
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  
};
