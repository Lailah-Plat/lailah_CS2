import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, ShieldAlert, Send, Search, User, Clock, CheckCircle, 
  AlertTriangle, ShieldCheck, ArrowRight, Ban, MessageCircle, FileText, 
  ChevronLeft, Trash2, Shield, AlertCircle
} from 'lucide-react';

export default function ProviderMessagesPage() {
  const [user, setUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem('currentUser');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [providerName, setProviderName] = useState<string>('');
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<number, any[]>>({});
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [replyText, setReplyText] = useState('');
  const [isComplaintModalOpen, setIsComplaintModalOpen] = useState(false);
  const [complaintTarget, setComplaintTarget] = useState<any | null>(null);
  
  // Complaint Form State
  const [complaintForm, setComplaintForm] = useState({
    reason: 'تبادل أرقام اتصال أو روابط خارجية',
    details: ''
  });

  const [notification, setNotification] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync and fetch user and chats on load
  useEffect(() => {
    const handleStorageChange = () => {
      try {
        const savedUser = localStorage.getItem('currentUser');
        const parsedUser = savedUser ? JSON.parse(savedUser) : null;
        setUser(parsedUser);

        if (parsedUser) {
          const name = parsedUser.name || parsedUser.providerName || '';
          setProviderName(name);
        }
      } catch (e) {
        console.error("Error reading currentUser", e);
      }
    };

    handleStorageChange();
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('user-logged-in', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('user-logged-in', handleStorageChange);
    };
  }, []);

  // Sync Chats and Messages
  const syncChats = () => {
    if (!providerName) return;

    try {
      let storedChats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
      let storedMessages = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');

      // If empty, seed some default demo chats
      if (storedChats.length === 0) {
        storedChats = [
          { id: 101, providerName: 'شركة أطياف', customerName: 'أحمد محمد', lastMsg: 'ممكن رقم للتواصل الخارجي؟', time: '10:30 ص', status: 'violation', unread: 1 },
          { id: 102, providerName: 'قاعة اللؤلؤة', customerName: 'سارة خالد', lastMsg: 'بكم السعر؟', time: '09:15 ص', status: 'normal', unread: 0 },
          { id: 103, providerName: 'قاعة المها', customerName: 'عبد الله صالح', lastMsg: 'هل يتوفر موقف سيارات مجاني؟', time: 'أمس', status: 'normal', unread: 0 }
        ];
        storedMessages = {
          101: [
            { id: 1, senderName: 'أحمد محمد', senderType: 'عميل', text: 'السلام عليكم، ممكن رقم للتواصل الخارجي؟', time: '10:29 ص', isViolation: true, violationType: 'رقم هاتف / وسيلة اتصال خارجية', moderationStatus: 'pending' },
            { id: 2, senderName: 'شركة أطياف', senderType: 'مزود خدمة', text: 'أهلاً بك، نعم تفضل 0555555555', time: '10:30 ص', isViolation: true, violationType: 'رقم هاتف / وسيلة اتصال خارجية', moderationStatus: 'pending' }
          ],
          102: [
            { id: 1, senderName: 'سارة خالد', senderType: 'عميل', text: 'بكم السعر لليوم الكامل؟', time: '09:10 ص', isViolation: false, moderationStatus: 'passed' },
            { id: 2, senderName: 'قاعة اللؤلؤة', senderType: 'مزود خدمة', text: 'بـ 15,000 ريال مع كافة التجهيزات', time: '09:15 ص', isViolation: false, moderationStatus: 'passed' }
          ],
          103: [
            { id: 1, senderName: 'عبد الله صالح', senderType: 'عميل', text: 'مرحباً، هل القاعة تدعم ميزات الإضاءة الخاصة بالمسرح؟', time: 'أمس', isViolation: false, moderationStatus: 'passed' },
            { id: 2, senderName: 'قاعة المها', senderType: 'مزود خدمة', text: 'نعم بالتأكيد، ولدينا قسم خاص للتحكم في الإضاءات والصوتيات.', time: 'أمس', isViolation: false, moderationStatus: 'passed' },
            { id: 3, senderName: 'عبد الله صالح', senderType: 'عميل', text: 'رائع جداً، وهل يتوفر موقف سيارات مجاني للمدعوين؟', time: 'أمس', isViolation: false, moderationStatus: 'passed' }
          ]
        };
        localStorage.setItem('SERVICE_CHATS', JSON.stringify(storedChats));
        localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(storedMessages));
      }

      // Filter chats that belong to this provider
      let providerChats = storedChats.filter((c: any) => 
        c.providerName === providerName || 
        c.providerName.includes(providerName) || 
        providerName.includes(c.providerName)
      );

      // If this provider doesn't have any chats, dynamically adopt the default chats so they have a fully working demo instantly!
      if (providerChats.length === 0 && storedChats.length > 0) {
        const adaptedChats = storedChats.map((c: any) => ({
          ...c,
          providerName: providerName
        }));
        storedChats = adaptedChats;
        localStorage.setItem('SERVICE_CHATS', JSON.stringify(storedChats));
        
        // Update provider messages to match the active provider name
        const updatedMsgs = { ...storedMessages };
        Object.keys(updatedMsgs).forEach((key) => {
          const numKey = Number(key);
          updatedMsgs[numKey] = (updatedMsgs[numKey] || []).map((m: any) => {
            if (m.senderType === 'مزود خدمة') {
              return { ...m, senderName: providerName };
            }
            return m;
          });
        });
        localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(updatedMsgs));
        storedMessages = updatedMsgs;
        providerChats = adaptedChats;
      }

      setChats(providerChats);
      setMessages(storedMessages);

      // If we don't have an active chat and there are chats, default to the first one
      if (activeChatId === null && providerChats.length > 0) {
        setActiveChatId(providerChats[0].id);
      }
    } catch (e) {
      console.error("Error syncing chats", e);
    }
  };

  useEffect(() => {
    syncChats();
    window.addEventListener('service-chats-updated', syncChats);
    window.addEventListener('storage', syncChats);

    return () => {
      window.removeEventListener('service-chats-updated', syncChats);
      window.removeEventListener('storage', syncChats);
    };
  }, [providerName]);

  // Scroll to bottom on message updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeChatId, messages]);

  const showNotification = (type: 'success' | 'error' | 'info', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const playChime = (isViolation = false) => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (isViolation) {
        // Red alert dissonance
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(330, ctx.currentTime);
        osc.frequency.setValueAtTime(220, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // High-quality positive chime
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16); // G5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      }
    } catch (e) {}
  };

  // Handle message violation checking
  const checkMessageForViolation = (text: string) => {
    const phonePattern = /(05\d{8})|(\+?966\s*5\d{8})|(\b5\d{8}\b)/g;
    const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    const badWords = ['كلب', 'حمار', 'غبي', 'نصاب', 'حرامي', 'سرقة', 'كذاب', 'وسخ', 'تفو'];
    
    if (phonePattern.test(text)) {
      return { isViolation: true, type: 'رقم هاتف / وسيلة اتصال خارجية' };
    }
    if (emailPattern.test(text)) {
      return { isViolation: true, type: 'بريد إلكتروني خارجي' };
    }
    for (const word of badWords) {
      if (text.includes(word)) {
        return { isViolation: true, type: 'ألفاظ غير لائقة أو إساءة' };
      }
    }
    return { isViolation: false, type: '' };
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || activeChatId === null) return;

    try {
      let storedChats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
      let storedMessages = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');

      const violationCheck = checkMessageForViolation(replyText);
      const hasViolation = violationCheck.isViolation;

      const newMsg = {
        id: Date.now(),
        senderName: providerName,
        senderType: 'مزود خدمة',
        text: replyText,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }),
        isViolation: hasViolation,
        violationType: violationCheck.type,
        moderationStatus: hasViolation ? 'pending' : 'passed'
      };

      storedMessages[activeChatId] = [...(storedMessages[activeChatId] || []), newMsg];

      storedChats = storedChats.map((c: any) => {
        if (c.id === activeChatId) {
          return {
            ...c,
            lastMsg: replyText,
            time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }),
            status: hasViolation ? 'violation' : (c.status === 'violation' ? 'violation' : 'normal'),
            unread: 0
          };
        }
        return c;
      });

      localStorage.setItem('SERVICE_CHATS', JSON.stringify(storedChats));
      localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(storedMessages));

      // Dispatch global sync event
      window.dispatchEvent(new Event('service-chats-updated'));

      setReplyText('');
      playChime(hasViolation);

      if (hasViolation) {
        showNotification('error', `⚠️ تنبيه: تم رصد مخالفة شروط المراسلة في ردك (${violationCheck.type}) وسيخضع للمراجعة.`);
      } else {
        showNotification('success', 'تم إرسال ردك إلى العميل بنجاح.');
      }
    } catch (e) {
      console.error("Error sending message", e);
      showNotification('error', 'فشل في إرسال الرسالة، يرجى المحاولة لاحقاً.');
    }
  };

  // Escalation / Complaint submission against Customer
  const openComplaintModal = (chat: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setComplaintTarget(chat);
    setComplaintForm({
      reason: 'تبادل أرقام اتصال أو روابط خارجية',
      details: ''
    });
    setIsComplaintModalOpen(true);
  };

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintTarget) return;

    if (!complaintForm.details.trim()) {
      showNotification('error', 'يرجى كتابة تفاصيل الشكوى للتصعيد للإدارة.');
      return;
    }

    try {
      // Load current complaints or start fresh
      const currentComplaints = JSON.parse(localStorage.getItem('CUSTOMER_COMPLAINTS') || '[]');
      
      // Compute formatted complaint number
      // Format Rules: CMP-YY-XXXXXXXX
      const currentYearShort = String(new Date().getFullYear()).substring(2);
      const yearComplaintsCount = currentComplaints.filter((c: any) => c.complaintId?.includes(`-${currentYearShort}-`)).length;
      const serialNumber = String(yearComplaintsCount + 1).padStart(8, '0');
      const complaintId = `CMP-${currentYearShort}-${serialNumber}`;

      const newComplaint = {
        complaintId,
        id: Date.now(),
        providerName: providerName,
        customerName: complaintTarget.customerName,
        chatId: complaintTarget.id,
        reason: complaintForm.reason,
        details: complaintForm.details,
        status: 'pending', // pending, investigated, resolved
        timestamp: new Date().toLocaleString('ar-SA'),
        lastMsgContext: complaintTarget.lastMsg
      };

      currentComplaints.unshift(newComplaint);
      localStorage.setItem('CUSTOMER_COMPLAINTS', JSON.stringify(currentComplaints));

      // Also append a visual system notification inside the chat log to prove it
      let storedMessages = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');
      const systemNotice = {
        id: Date.now() + 1,
        senderName: 'إدارة المنصة',
        senderType: 'نظام',
        text: `🛡️ [إشعار نظام]: قام مزود الخدمة بتصعيد شكوى رسمية للإدارة برقم (${complaintId}) بخصوص: "${complaintForm.reason}". جاري تدقيق المحادثة واتخاذ الإجراء اللازم بحق الحساب المخالف.`,
        time: new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true }),
        isSystem: true
      };
      storedMessages[complaintTarget.id] = [...(storedMessages[complaintTarget.id] || []), systemNotice];
      localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(storedMessages));

      // Dispatch events
      window.dispatchEvent(new Event('service-chats-updated'));
      window.dispatchEvent(new Event('customer-complaints-updated'));

      setIsComplaintModalOpen(false);
      setComplaintTarget(null);
      playChime(true);
      showNotification('success', `🛡️ تم تصعيد الشكوى للإدارة بنجاح برقم ${complaintId}. جاري التدقيق الفوري للحساب.`);
    } catch (e) {
      console.error("Error submitting complaint", e);
      showNotification('error', 'حدث خطأ أثناء تقديم الشكوى، يرجى المحاولة مجدداً.');
    }
  };

  // Filtered chats based on search
  const filteredChats = chats.filter(c => 
    c.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.lastMsg || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeChatMsgs = activeChatId !== null ? (messages[activeChatId] || []) : [];

  // Unauthorized screen
  const isAuthorized = user && (user.role === 'provider' || user.role === 'Provider' || user.role === 'مزود' || user.role === 'admin' || user.role === 'Admin');

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl">
        <Header />
        <main className="flex-1 flex items-center justify-center p-6 md:p-12">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center"
          >
            <div className="w-16 h-16 bg-rose-50 border border-rose-100 rounded-full flex items-center justify-center text-rose-500 mx-auto mb-6">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-3">دخول غير مصرح به</h2>
            <p className="text-sm text-slate-500 leading-relaxed mb-8">
              عذراً! هذه البوابة مخصصة حصرياً لمزودي الخدمة المسجلين والشركاء المعتمدين في المنصة لمتابعة استفسارات ومحادثات العملاء والرد عليها وتصعيد الشكاوى للإدارة.
            </p>
            <div className="space-y-3">
              <a 
                href="/"
                className="block w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl text-sm transition-all shadow-md hover:shadow-lg"
              >
                العودة للصفحة الرئيسية
              </a>
            </div>
          </motion.div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans relative" dir="rtl">
      <Header />

      {/* Global Toast Notification */}
      <AnimatePresence>
        {notification && (
          <motion.div 
            initial={{ opacity: 0, y: -50, x: '50%' }}
            animate={{ opacity: 1, y: 0, x: '50%' }}
            exit={{ opacity: 0, y: -20, x: '50%' }}
            style={{ right: '50%' }}
            className="fixed top-24 z-[9999] -translate-x-1/2 max-w-md w-full bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-start gap-3 select-none"
          >
            <div className="mt-0.5 shrink-0">
              {notification.type === 'success' ? (
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
              ) : notification.type === 'error' ? (
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              ) : (
                <AlertCircle className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div className="flex-1 text-xs font-semibold leading-relaxed">
              {notification.message}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 flex flex-col gap-6">
        
        {/* Banner/Header Block */}
        <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0">
              <MessageSquare className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-extrabold px-2.5 py-1 rounded-lg border border-indigo-100 uppercase tracking-wider">بوابة الشركاء والمزودين</span>
                <span className="flex items-center gap-1.5 text-emerald-600 text-[10px] font-bold bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  نظام الرد الفوري متصل
                </span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-slate-800 mt-2">بوابة الرسائل ومتابعة محادثات العملاء</h1>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                مرحباً بك، <strong className="text-slate-800 font-bold">{providerName}</strong>. من هنا يمكنك مراسلة عملائك وتلقي طلباتهم مباشرةً وتصعيد السلوكيات الخاطئة لإدارة المنصة بكبسة زر.
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-center">
              <span className="block text-[9px] text-slate-400 font-black uppercase mb-1">المحادثات النشطة</span>
              <strong className="text-base font-black text-slate-800">{chats.length}</strong>
            </div>
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl px-4 py-3 text-center">
              <span className="block text-[9px] text-slate-400 font-black uppercase mb-1">الردود غير المقروءة</span>
              <strong className="text-base font-black text-indigo-600">{chats.reduce((acc, c) => acc + (c.unread || 0), 0)}</strong>
            </div>
          </div>
        </div>

        {/* Content Panel Split */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-280px)] min-h-[600px] overflow-hidden">
          
          {/* Chat Sidebar List (4 cols) */}
          <div className="lg:col-span-4 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
            
            {/* Search Input */}
            <div className="p-4 border-b border-slate-200 shrink-0">
              <div className="relative">
                <input 
                  type="text"
                  placeholder="ابحث عن عميل أو محتوى الرسالة..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl pr-10 pl-4 py-3 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                />
                <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5" />
              </div>
            </div>

            {/* Chats List Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar divide-y divide-slate-100">
              {filteredChats.map(c => {
                const isActive = c.id === activeChatId;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setActiveChatId(c.id);
                      // Reset unread locally
                      setChats(prev => prev.map(ch => ch.id === c.id ? { ...ch, unread: 0 } : ch));
                    }}
                    className={`p-4 cursor-pointer transition-all flex items-start gap-3.5 relative hover:bg-slate-50/50 ${
                      isActive ? 'bg-indigo-50/50 border-r-4 border-r-indigo-600' : ''
                    }`}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold shrink-0 text-sm shadow-sm">
                      {c.customerName.charAt(0)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <h4 className="font-bold text-xs text-slate-800 truncate">{c.customerName}</h4>
                        <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{c.time}</span>
                      </div>
                      <p className="text-xs text-slate-500 truncate font-normal">{c.lastMsg}</p>
                      
                      {/* System / Violation Tags */}
                      {c.status === 'violation' && (
                        <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-50 text-rose-600 border border-rose-100">
                          <AlertTriangle className="w-3 h-3" /> يحتوي رسائل مريبة
                        </span>
                      )}
                    </div>

                    {/* Left Actions/Unread Area */}
                    <div className="flex flex-col items-end justify-between self-stretch shrink-0">
                      {c.unread > 0 && (
                        <span className="bg-indigo-600 text-white rounded-full text-[9px] font-bold px-1.5 py-0.5 min-w-[16px] text-center">
                          {c.unread}
                        </span>
                      )}
                      
                      {/* Complaint Action Icon */}
                      <button
                        onClick={(e) => openComplaintModal(c, e)}
                        title="تصعيد شكوى رسمية ضده للإدارة"
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition-all cursor-pointer mt-auto"
                      >
                        <ShieldAlert className="w-4.5 h-4.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {filteredChats.length === 0 && (
                <div className="p-12 text-center text-slate-400 text-xs font-semibold">
                  لا توجد محادثات مطابقة لخيارات البحث.
                </div>
              )}
            </div>
          </div>

          {/* Chat Pane (8 cols) */}
          <div className="lg:col-span-8 bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden h-full">
            {activeChat ? (
              <>
                {/* Chat Pane Header */}
                <div className="p-4 border-b border-slate-200 bg-white flex justify-between items-center shrink-0 z-10 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center font-bold text-indigo-700">
                      {activeChat.customerName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">{activeChat.customerName}</h3>
                      <p className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 mt-0.5">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                        العميل متصل الآن بالمنظومة
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Big Escalation Button */}
                    <button
                      onClick={() => openComplaintModal(activeChat)}
                      className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-black transition-all border border-rose-100 flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-4 h-4 text-rose-600" />
                      تصعيد شكوى للإدارة
                    </button>
                  </div>
                </div>

                {/* Messages Panel Container */}
                <div className="flex-1 bg-slate-50/50 p-6 overflow-y-auto space-y-4 custom-scrollbar relative">
                  <div className="bg-slate-200/50 border border-slate-300/40 rounded-2xl p-4 text-center max-w-md mx-auto text-[11px] text-slate-600 font-medium mb-4 select-none leading-relaxed">
                    💬 هذه المحادثة خاضعة للمراقبة التلقائية للسلامة وحفظ الحقوق والعمولات المالية. يُمنع إرسال أي وسائل دفع أو اتصال خارجي.
                  </div>

                  {activeChatMsgs.map((m: any) => {
                    const isSelf = m.senderName === providerName;
                    const isSystem = m.isSystem || m.senderType === 'نظام';
                    const isBlocked = m.isViolation && (m.moderationStatus === 'pending' || m.moderationStatus === 'blocked');

                    if (isSystem) {
                      return (
                        <div key={m.id} className="flex justify-center max-w-xl mx-auto my-3 animate-in fade-in duration-300">
                          <div className="bg-amber-50 text-amber-800 border border-amber-200 rounded-2xl p-3 text-xs leading-relaxed font-semibold shadow-sm flex gap-2">
                            <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>{m.text}</div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div key={m.id} className={`flex flex-col ${isSelf ? 'items-start' : 'items-end'} animate-in fade-in duration-200`}>
                        <span className="text-[9px] text-slate-400 mb-0.5 px-1.5 font-bold">
                          {isSelf ? 'أنت (مزود الخدمة)' : m.senderName}
                        </span>
                        
                        <div className={`p-3.5 rounded-2xl text-xs shadow-sm max-w-[80%] leading-relaxed ${
                          isSelf 
                            ? (isBlocked ? 'bg-rose-50 border border-rose-200 text-rose-600 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none font-medium')
                            : (isBlocked ? 'bg-rose-50 border border-rose-200 text-rose-600 rounded-tr-none' : 'bg-indigo-600 text-white rounded-tr-none font-semibold')
                        }`}>
                          {isBlocked ? (
                            <span className="italic flex items-center gap-1 text-rose-700">
                              <Ban className="w-4 h-4 shrink-0" />
                              تم حجب هذه الرسالة وتوقيفها لمخالفتها شروط النشر والمراسلة بالمنصة.
                            </span>
                          ) : (
                            m.text
                          )}
                          <div className={`text-[8.5px] mt-1.5 text-left font-mono ${isSelf && !isBlocked ? 'text-slate-400' : 'text-indigo-150 text-white/80'}`}>
                            {m.time}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Reply Input Form */}
                <div className="p-4 bg-white border-t border-slate-200 shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2.5">
                    <input 
                      type="text"
                      value={replyText}
                      onChange={e => setReplyText(e.target.value)}
                      placeholder="اكتب ردك للعميل هنا..."
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3.5 text-xs outline-none focus:border-indigo-500 focus:bg-white transition-all font-semibold"
                    />
                    <button
                      type="submit"
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 rounded-2xl flex items-center justify-center shadow-md transition-all active:scale-95 shrink-0"
                    >
                      <Send className="w-4 h-4 rtl:-scale-x-100" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none bg-slate-50/50">
                <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-full flex items-center justify-center text-indigo-500 mb-4 shadow-sm">
                  <MessageCircle className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">لم يتم تحديد أي محادثة</h3>
                <p className="text-xs text-slate-400 max-w-xs mt-1.5 leading-relaxed font-semibold">
                  الرجاء اختيار أحد محادثات العملاء من القائمة الجانبية لمشاهدة تفاصيل الدردشة وإرسال الردود.
                </p>
              </div>
            )}
          </div>
        </div>

      </main>

      {/* Escalation/Complaint Dialog/Modal */}
      <AnimatePresence>
        {isComplaintModalOpen && complaintTarget && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200 font-sans" dir="rtl">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl border border-slate-100 relative"
            >
              <div className="flex items-center gap-3.5 text-rose-600 mb-5 select-none">
                <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100/50">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">تصعيد شكوى للإدارة ضد العميل</h3>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">تقديم بلاغ رسمي مرفق بنسخة من المحادثة التلقائية</p>
                </div>
              </div>

              <form onSubmit={handleComplaintSubmit} className="space-y-4">
                
                {/* Target Customer Info */}
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-3">
                  <div className="w-8 h-8 bg-indigo-100 text-indigo-700 rounded-lg flex items-center justify-center text-xs font-bold">
                    {complaintTarget.customerName.charAt(0)}
                  </div>
                  <div>
                    <span className="block text-[9px] text-slate-400 font-black uppercase">العميل المُشتكى عليه</span>
                    <strong className="text-xs text-slate-850 font-bold">{complaintTarget.customerName}</strong>
                  </div>
                </div>

                {/* Complaint Reason Category */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">سبب التصعيد الرئيسي</label>
                  <select
                    value={complaintForm.reason}
                    onChange={e => setComplaintForm(prev => ({ ...prev, reason: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-bold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all cursor-pointer"
                  >
                    <option value="تبادل أرقام اتصال أو روابط خارجية">تبادل أرقام اتصال أو روابط خارجية</option>
                    <option value="سلوك غير لائق أو لغة غير محترمة">سلوك غير لائق أو لغة غير محترمة</option>
                    <option value="محاولة الاحتيال أو التهرب من العمولات">محاولة الاحتيال أو التهرب من العمولات</option>
                    <option value="عدم الالتزام بمواعيد الحجوزات أو الشروط">عدم الالتزام بمواعيد الحجوزات أو الشروط</option>
                    <option value="أخرى">أخرى (توضيح بالتفصيل بالأسفل)</option>
                  </select>
                </div>

                {/* Complaint Details */}
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">تفاصيل وسياق الشكوى</label>
                  <textarea
                    rows={4}
                    value={complaintForm.details}
                    onChange={e => setComplaintForm(prev => ({ ...prev, details: e.target.value }))}
                    placeholder="يرجى كتابة تفاصيل واضحة لتمكين فريق إدارة وحوكمة المنصة من مراجعة سجلات المحادثات وتطبيق الإجراءات (مثال: العميل يصر على الدفع والاتصال الخارجي ويرفض إكمال الحجز في المنصة...)"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-semibold text-slate-700 outline-none focus:border-indigo-500 focus:bg-white transition-all resize-none leading-relaxed placeholder:text-slate-400"
                  ></textarea>
                </div>

                {/* Form Buttons */}
                <div className="flex gap-3 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsComplaintModalOpen(false);
                      setComplaintTarget(null);
                    }}
                    className="px-4.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
                  >
                    إلغاء الإجراء
                  </button>
                  <button
                    type="submit"
                    className="px-4.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <ShieldAlert className="w-4 h-4" />
                    تقديم تصعيد للإدارة
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
