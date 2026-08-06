import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { io, Socket } from 'socket.io-client';
import { 
  MessageSquare, X, Send, Bell, Volume2, VolumeX, MessageCircle, 
  ArrowLeft, ChevronLeft, ExternalLink, Headset, Loader2, User, Star 
} from 'lucide-react';

const CUSTOMER_POOL = [
  { name: 'أحمد محمد', avatar: 'أ' },
  { name: 'سارة خالد', avatar: 'س' },
  { name: 'عبد الله صالح', avatar: 'ع' },
  { name: 'محمد العتيبي', avatar: 'م' },
  { name: 'ريما عبد العزيز', avatar: 'ر' },
  { name: 'خالد الحربي', avatar: 'خ' }
];

const PASSIVE_MESSAGES = [
  'مرحباً، هل قاعتكم شاغرة يوم الجمعة القادم لحفلة عقد قران؟',
  'السلام عليكم، هل يمكن زيادة عدد الطاولات في القاعة إلى 400 طاولة؟',
  'بكم سعر باقة الخدمات الشاملة مع التصوير والضيافة؟',
  'أهلاً بك، هل تتوفر لديكم خصومات خاصة لحجوزات منتصف الأسبوع؟',
  'السلام عليكم، هل يمكننا المجيء اليوم لمعاينة القاعة وتجهيزات الصوت؟',
  'مرحباً، هل تتوفر مواقف كافية للمدعوين بجانب القاعة؟',
  'مساء الخير، هل تقدمون بوفيه عشاء مخصص للأطعمة الصحية والدايت؟'
];

const REPLY_POOL = [
  'رائع جداً! شكراً لك على الرد السريع والواضح.',
  'تمام، هل يجب دفع العربون كاملاً عبر المنصة لتأكيد هذا الحجز؟',
  'فهمت عليك. هل يمكنني الحصول على عقد إلكتروني موثق بمجرد الدفع؟',
  'ممتاز، سأقوم بالتنسيق مع العائلة وإكمال الحجز في أقرب وقت عبر المنصة.',
  'شكراً جزيلاً لتعاونكم وسرعة استجابتكم.',
  'جميل، هل الأسعار المعروضة شاملة لضريبة القيمة المضافة؟',
  'سعيد بالتواصل معكم، سأقوم بإتمام عملية الحجز والدفع الآن.'
];

function getFirstName(fullName: string | null): string {
  if (!fullName) return '';
  const trimmed = fullName.trim();
  const parts = trimmed.split(/\s+/);
  if (parts.length > 1) {
    if (parts[0] === 'عبد' && parts[1]) {
      return 'عبد ' + parts[1];
    }
    return parts[0];
  }
  return trimmed;
}

export default function ProviderRealtimeChatNotifier() {
  const [user, setUser] = useState<any>(null);
  const [isProvider, setIsProvider] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  
  const seenMessageIds = useRef<Set<number>>(new Set());
  const isFirstLoad = useRef(true);
  
  // Floating widget states
  const [showNotification, setShowNotification] = useState(false);
  const [latestMsg, setLatestMsg] = useState<any>(null);
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [replyText, setReplyText] = useState('');
  
  const [chats, setChats] = useState<any[]>([]);
  const [messages, setMessages] = useState<Record<number, any[]>>({});
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const adminMessagesEndRef = useRef<HTMLDivElement>(null);

  // Tab Choice for VIP providers: 'customers' or 'admin'
  const [activeTab, setActiveTab] = useState<'customers' | 'admin'>('customers');

  // Provider subscription cache-aside for direct support check
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
    try {
      const stored = localStorage.getItem('currentUser');
      const curr = stored ? JSON.parse(stored) : null;
      return getSubForUser(curr);
    } catch {
      return null;
    }
  });

  // Admin VIP direct support states
  const [adminSocket, setAdminSocket] = useState<Socket | null>(null);
  const [adminChatState, setAdminChatState] = useState<'initial' | 'waiting' | 'active' | 'ended'>('initial');
  const [adminCustomerName, setAdminCustomerName] = useState('');
  const [adminTopic, setAdminTopic] = useState('استفسارات وشكاوى');
  const [adminToastMessage, setAdminToastMessage] = useState<string | null>(null);
  const [adminChatId, setAdminChatId] = useState<string | null>(null);
  const [adminMessages, setAdminMessages] = useState<any[]>([]);
  const [adminInputValue, setAdminInputValue] = useState('');
  const [adminAgentName, setAdminAgentName] = useState<string | null>(null);
  const [adminQueuePosition, setAdminQueuePosition] = useState<number>(0);
  const [adminIsTyping, setAdminIsTyping] = useState(false);
  const [adminRating, setAdminRating] = useState(0);
  const [adminEmployeeRating, setAdminEmployeeRating] = useState(0);
  const [adminSatisfaction, setAdminSatisfaction] = useState('');
  const [adminIsResolved, setAdminIsResolved] = useState<boolean | null>(null);
  const [adminFeedbackSubmitted, setAdminFeedbackSubmitted] = useState(false);
  const [adminWorkingHours, setAdminWorkingHours] = useState<any>({
     'الأحد': { active: true, period1Start: '08:00', period1End: '12:00', period2Start: '16:00', period2End: '20:00' },
     'الإثنين': { active: true, period1Start: '08:00', period1End: '12:00', period2Start: '16:00', period2End: '20:00' },
     'الثلاثاء': { active: true, period1Start: '08:00', period1End: '12:00', period2Start: '16:00', period2End: '20:00' },
     'الأربعاء': { active: true, period1Start: '08:00', period1End: '12:00', period2Start: '16:00', period2End: '20:00' },
     'الخميس': { active: true, period1Start: '08:00', period1End: '12:00', period2Start: '16:00', period2End: '20:00' },
     'الجمعة': { active: false, period1Start: '16:00', period1End: '22:00', period2Start: '', period2End: '' },
     'السبت': { active: false, period1Start: '16:00', period1End: '22:00', period2Start: '', period2End: '' }
  });
  const [adminAlertMessage, setAdminAlertMessage] = useState('تنبيه: أوقات العمل من الساعة 8:00 صباحاً وحتى الساعة 4:00 عصراً');
  const [adminIsDisabled, setAdminIsDisabled] = useState(false);

  // Sync current user and check if provider
  useEffect(() => {
    const checkUser = () => {
      setTimeout(() => {
        try {
          const currentUserStr = localStorage.getItem('currentUser');
          if (currentUserStr) {
            const parsed = JSON.parse(currentUserStr);
            setUser(parsed);
            setAdminCustomerName(parsed.name || '');
            const email = (parsed.email || '').toLowerCase();
            const role = (parsed.role || '').toLowerCase();
            
            // STRICT CLIENT ISOLATION: Explicitly block anyone who is a customer, client, or guest
            const isClient = role.includes('customer') || role.includes('client') || role.includes('عميل');
            if (isClient) {
              setIsProvider(false);
              return;
            }

            const isUserProvider = role.includes('provider') || 
                                  role.includes('مزود') || 
                                  role.includes('موظف') || 
                                  role.includes('admin') || 
                                  role.includes('مدير') || 
                                  role.includes('مشرف') || 
                                  email === 'kaab909@gmail.com';
            
            setIsProvider(isUserProvider);
            setProviderSubscription(getSubForUser(parsed));
          } else {
            setUser(null);
            setIsProvider(false);
            setProviderSubscription(null);
          }
        } catch (e) {
          setIsProvider(false);
        }
      }, 0);
    };

    checkUser();
    window.addEventListener('storage', checkUser);
    window.addEventListener('user-logged-in', checkUser);
    window.addEventListener('currentUserUpdated', checkUser);
    window.addEventListener('subscriptionUpdated', checkUser);

    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('user-logged-in', checkUser);
      window.removeEventListener('currentUserUpdated', checkUser);
      window.removeEventListener('subscriptionUpdated', checkUser);
    };
  }, []);

  // Sync working hours and alerts for Admin VIP live chat
  useEffect(() => {
    if (isWidgetOpen && activeTab === 'admin') {
      const storedHours = localStorage.getItem('SUPPORT_WORKING_HOURS');
      if (storedHours) {
        try {
          setAdminWorkingHours(JSON.parse(storedHours));
        } catch (e) {}
      }
      const storedAlert = localStorage.getItem('SUPPORT_ALERT_MSG');
      if (storedAlert) {
        setAdminAlertMessage(storedAlert);
      }
    }
  }, [isWidgetOpen, activeTab]);

  // Sync Admin chat disabled status
  useEffect(() => {
    const handleSyncStatus = () => {
      setAdminIsDisabled(localStorage.getItem('DISABLE_CHAT_SYSTEM') === 'true');
    };
    window.addEventListener('chat-system-status-changed', handleSyncStatus);
    handleSyncStatus();
    return () => {
      window.removeEventListener('chat-system-status-changed', handleSyncStatus);
    };
  }, []);

  // Check if provider has VIP live chat support with the administration (based on packages or addon purchase)
  const isVipProvider = useMemo(() => {
    if (!user) return false;
    const role = (user.role || '').toLowerCase();
    
    // STRICT CLIENT ISOLATION: Explicitly block anyone who is a customer, client, or guest
    const isClient = role.includes('customer') || role.includes('client') || role.includes('عميل');
    if (isClient) return false;

    const isProvOrAdmin = role.includes('provider') || role.includes('agency') || role.includes('partner') || role.includes('مزود') || role.includes('مدير') || role.includes('مشرف') || role.includes('admin');
    if (!isProvOrAdmin) return false;
    
    // Admins always have access
    if (role.includes('admin') || role.includes('مدير') || role.includes('مشرف')) return true;

    // Check direct support status in subscription OR support addon
    const hasAddon = Array.isArray(providerSubscription?.addons) && providerSubscription.addons.includes('support');
    return !!providerSubscription?.hasSupport || hasAddon;
  }, [user, providerSubscription]);

  // Check working hours for Admin VIP Support
  const checkWorkingHoursStatus = () => {
    const arabicDays: Record<string, string> = {
      'Sunday': 'الأحد',
      'Monday': 'الإثنين',
      'Tuesday': 'الثلاثاء',
      'Wednesday': 'الأربعاء',
      'Thursday': 'الخميس',
      'Friday': 'الجمعة',
      'Saturday': 'السبت'
    };
    
    const now = new Date();
    const dayNameEn = now.toLocaleDateString('en-US', { weekday: 'long' });
    const dayNameAr = arabicDays[dayNameEn] || 'الأحد';
    const dayConfig = adminWorkingHours[dayNameAr];
    
    if (!dayConfig) return { isOutside: false, msg: '' };
    if (!dayConfig.active) {
      return { 
        isOutside: true, 
        msg: `عذراً، اليوم (${dayNameAr}) هو يوم إجازة رسمي لفريق الدعم والرد المباشر غير متاح حالياً.` 
      };
    }
    
    const pad = (num: number) => String(num).padStart(2, '0');
    const currentStr = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
    
    const inPeriod1 = dayConfig.period1Start && dayConfig.period1End && 
      (currentStr >= dayConfig.period1Start && currentStr <= dayConfig.period1End);
      
    const inPeriod2 = dayConfig.period2Start && dayConfig.period2End && 
      (currentStr >= dayConfig.period2Start && currentStr <= dayConfig.period2End);
      
    if (inPeriod1 || inPeriod2) {
      return { isOutside: false, msg: '' };
    }
    
    let activePeriods = '';
    if (dayConfig.period1Start && dayConfig.period1End) {
      activePeriods += `من ${dayConfig.period1Start} إلى ${dayConfig.period1End}`;
    }
    if (dayConfig.period2Start && dayConfig.period2End) {
      if (activePeriods) activePeriods += ' ومن ';
      activePeriods += `${dayConfig.period2Start} إلى ${dayConfig.period2End}`;
    }
    
    return { 
      isOutside: true, 
      msg: `تنبيه: أنت تتواصل معنا خارج أوقات الرد الفوري الآن. ساعات الدوام لليوم (${dayNameAr}) هي: ${activePeriods || 'غير مجدولة'}. يمكنك ترك رسالتك وسنرد فور بدء الدوام.` 
    };
  };

  // Sync Chats & Messages from local storage
  const syncLocalData = () => {
    setTimeout(() => {
      try {
        const storedChats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
        const storedMessages = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');
        
        // Determine active roles and names
        const currentUserStr = localStorage.getItem('currentUser');
        const parsedUser = currentUserStr ? JSON.parse(currentUserStr) : null;
        const currentUserName = parsedUser?.name || parsedUser?.customerName || '';
        const providerName = parsedUser?.name || parsedUser?.providerName || 'قاعة اللؤلؤة';
        const userRole = (parsedUser?.role || '').toLowerCase();
        const isUserProvider = userRole.includes('provider') || 
                              userRole.includes('مزود') || 
                              userRole.includes('موظف') || 
                              userRole.includes('admin') || 
                              userRole.includes('مدير') || 
                              (parsedUser?.email || '').toLowerCase() === 'kaab909@gmail.com';

        if (!isUserProvider) {
          // STRICT CLIENT ISOLATION: Do NOT sync or show any floating notifications to the client/customer
          setChats([]);
          setMessages({});
          setUnreadCount(0);
          setShowNotification(false);
          setLatestMsg(null);
          return;
        }

        // Detect and trigger notifications for any new messages
        Object.keys(storedMessages).forEach((cIdStr) => {
          const cId = Number(cIdStr);
          const chatMsgs = storedMessages[cId] || [];
          const assocChat = storedChats.find((c: any) => c.id === cId);
          if (!assocChat) return;

          chatMsgs.forEach((msg: any) => {
            if (!seenMessageIds.current.has(msg.id)) {
              seenMessageIds.current.add(msg.id);
              
              if (!isFirstLoad.current) {
                // If the user is a provider:
                if (isUserProvider) {
                  const matchesProvider = !assocChat.providerName || 
                    assocChat.providerName === providerName || 
                    assocChat.providerName.includes(providerName) || 
                    providerName.includes(assocChat.providerName);

                  if (matchesProvider && msg.senderType === 'عميل') {
                    // Trigger provider notification
                    setLatestMsg({
                      chatId: cId,
                      customerName: msg.senderName,
                      text: msg.text,
                      time: msg.time,
                      isForClient: false,
                      title: 'رسالة جديدة من عميل'
                    });
                    setShowNotification(true);
                    playSound('new');
                  }
                }
              }
            }
          });
        });

        if (isFirstLoad.current) {
          isFirstLoad.current = false;
        }

        // Determine the active provider name for local state filtering
        const localProviderName = user?.name || user?.providerName || 'قاعة اللؤلؤة';
        
        // Filter chats that belong to this provider
        const providerChats = storedChats.filter((c: any) => 
          !c.providerName || 
          c.providerName === localProviderName || 
          c.providerName.includes(localProviderName) || 
          localProviderName.includes(c.providerName)
        );

        setChats(providerChats);
        setMessages(storedMessages);

        // Recalculate unread messages count for this provider's chats only
        const totalUnread = providerChats.reduce((sum: number, c: any) => sum + (c.unread || 0), 0);
        setUnreadCount(totalUnread);
      } catch (e) {
        console.error('Error syncing local messages in notifier', e);
      }
    }, 0);
  };

  useEffect(() => {
    syncLocalData();
    window.addEventListener('service-chats-updated', syncLocalData);
    window.addEventListener('storage', syncLocalData);

    return () => {
      window.removeEventListener('service-chats-updated', syncLocalData);
      window.removeEventListener('storage', syncLocalData);
    };
  }, [user]); // Re-run sync when user shifts

  // Sound chime synthesizer using Web Audio API
  const playSound = (type: 'new' | 'reply' | 'admin' = 'new') => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      if (type === 'new') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
        gain.gain.setValueAtTime(0.04, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else if (type === 'reply') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(659.25, ctx.currentTime); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.08); // G5
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      } else if (type === 'admin') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(698.46, ctx.currentTime + 0.08); // F5
        osc.frequency.setValueAtTime(880.00, ctx.currentTime + 0.16); // A5
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {
      // AudioContext failed silently
    }
  };

  const showAdminToast = (text: string) => {
    setAdminToastMessage(text);
    playSound('admin');
    setTimeout(() => {
      setAdminToastMessage(null);
    }, 4000);
  };

  // Trigger customer reply to a provider message in an active chat (Simulated)
  const triggerCustomerReply = (chatId: number, customerName: string) => {
    try {
      const storedChats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
      const storedMessages = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');

      const chatIndex = storedChats.findIndex((c: any) => c.id === chatId);
      if (chatIndex === -1) return;

      const randomReply = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
      const timestamp = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newMsg = {
        id: Date.now(),
        senderName: customerName,
        senderType: 'عميل',
        text: randomReply,
        time: timestamp,
        isViolation: false,
        moderationStatus: 'passed'
      };

      storedMessages[chatId] = [...(storedMessages[chatId] || []), newMsg];
      
      storedChats[chatIndex] = {
        ...storedChats[chatIndex],
        lastMsg: randomReply,
        time: timestamp,
        unread: (storedChats[chatIndex].id === activeChatId && isWidgetOpen && activeTab === 'customers') ? 0 : (storedChats[chatIndex].unread || 0) + 1
      };

      localStorage.setItem('SERVICE_CHATS', JSON.stringify(storedChats));
      localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(storedMessages));

      // Trigger global event
      window.dispatchEvent(new Event('service-chats-updated'));
      window.dispatchEvent(new Event('storage'));

      // Show alert & sound
      setLatestMsg({
        chatId,
        customerName,
        text: randomReply,
        time: timestamp
      });
      setShowNotification(true);
      playSound('reply');

      // Auto hide notification
      setTimeout(() => {
        setShowNotification(false);
      }, 5000);

    } catch (e) {
      console.error('Error triggering customer reply', e);
    }
  };

  // Send message from the floating quick-reply widget
  const handleSendQuickReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || activeChatId === null) return;

    try {
      const storedChats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
      const storedMessages = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');

      const chatIndex = storedChats.findIndex((c: any) => c.id === activeChatId);
      if (chatIndex === -1) return;

      const providerName = user?.name || user?.providerName || 'مزود الخدمة';
      const timestamp = new Date().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit', hour12: true });

      const newMsg = {
        id: Date.now(),
        senderName: providerName,
        senderType: 'مزود خدمة',
        text: replyText,
        time: timestamp,
        isViolation: false,
        moderationStatus: 'passed'
      };

      storedMessages[activeChatId] = [...(storedMessages[activeChatId] || []), newMsg];
      
      storedChats[chatIndex] = {
        ...storedChats[chatIndex],
        lastMsg: replyText,
        time: timestamp,
        unread: 0
      };

      localStorage.setItem('SERVICE_CHATS', JSON.stringify(storedChats));
      localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(storedMessages));

      window.dispatchEvent(new Event('service-chats-updated'));
      window.dispatchEvent(new Event('storage'));

      setReplyText('');
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 50);

      // Trigger simulated reply from client in 2 seconds to make the UI interactive
      setTimeout(() => {
        triggerCustomerReply(activeChatId, storedChats[chatIndex].customerName);
      }, 2000);

    } catch (e) {
      console.error('Error sending quick reply', e);
    }
  };

  // Admin socket handling & start chat
  const handleStartAdminChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminCustomerName.trim()) return;
    
    let activeSocket = adminSocket;
    if (!activeSocket || !activeSocket.connected) {
       let partnerRole = 'customer';
       let hasSupport = 'false';
       try {
         if (user) {
           partnerRole = user.role || 'customer';
           if (providerSubscription) {
             hasSupport = providerSubscription.hasSupport ? 'true' : 'false';
           }
         }
       } catch {}

       activeSocket = io({
         query: {
           isLiveChat: 'true',
           partnerRole,
           hasSupport
         }
       });
       setAdminSocket(activeSocket);

       activeSocket.on("chat_queued", (data) => {
         setAdminChatId(data.chatId);
         setAdminQueuePosition(data.position);
         setAdminChatState('waiting');
         showAdminToast("📥 تم إدراجك في طابور الدعم والمحادثات المباشرة بنجاح!");
       });

       activeSocket.on("queue_update", (data) => {
         setAdminQueuePosition(data.position);
       });

       activeSocket.on("chat_started", (data) => {
         setAdminAgentName(data.agentName);
         setAdminChatState('active');
         showAdminToast(`🟢 اتصل الآن: الموظف ${getFirstName(data.agentName)} من الإدارة في خدمتك!`);
       });

       activeSocket.on("new_message", (msg) => {
         setAdminMessages(prev => [...prev, msg]);
         setAdminIsTyping(false);
         if (msg.senderType !== 'customer') {
           showAdminToast(`💬 رسالة من الإدارة: ${msg.text.substring(0, 30)}${msg.text.length > 30 ? '...' : ''}`);
         }
       });

       let typingTimeout: any;
       activeSocket.on("typing", () => {
         setAdminIsTyping(true);
         clearTimeout(typingTimeout);
         typingTimeout = setTimeout(() => setAdminIsTyping(false), 2000);
       });

       activeSocket.on("chat_ended", () => {
         setAdminChatState('ended');
         setAdminSocket(p => { p?.disconnect(); return null; });
         showAdminToast("🔴 تم إنهاء جلسة المحادثة من قبل الإدارة");
       });
    }

    activeSocket.emit("customer_start", { name: adminCustomerName, topic: adminTopic });
  };

  const handleSendAdminMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!adminInputValue.trim() || !adminSocket || !adminChatId) return;
    
    adminSocket.emit("send_message", {
      chatId: adminChatId,
      text: adminInputValue,
      senderType: 'customer'
    });
    setAdminInputValue('');
  };

  const handleAdminTyping = () => {
    if (adminSocket && adminChatId) {
      adminSocket.emit("typing", { chatId: adminChatId, senderType: 'customer' });
    }
  };

  const handleSubmitAdminFeedback = () => {
    setAdminFeedbackSubmitted(true);
  };

  // Scroll to bottom when opening specific customer chat
  useEffect(() => {
    if (isWidgetOpen && activeChatId && activeTab === 'customers') {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [isWidgetOpen, activeChatId, messages, activeTab]);

  // Scroll to bottom for admin messages
  useEffect(() => {
    if (isWidgetOpen && activeTab === 'admin' && adminChatState === 'active') {
      setTimeout(() => {
        adminMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 80);
    }
  }, [isWidgetOpen, adminMessages, adminIsTyping, adminChatState, activeTab]);

  // STRICT ISOLATION FROM CLIENTS: The client must never see any floating chat icons or notifications
  if (!isProvider) return null;

  const activeChat = chats.find(c => c.id === activeChatId);
  const activeChatMsgs = activeChatId !== null ? (messages[activeChatId] || []) : [];

  return (
    <div className="fixed bottom-20 lg:bottom-6 right-4 lg:right-6 z-[9999] font-sans" dir="rtl">
      
      {/* Toast Notification Alert when a customer message event occurs */}
      <AnimatePresence>
        {showNotification && latestMsg && !isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="mb-4 p-4 rounded-3xl shadow-2xl max-w-sm w-85 flex items-start gap-3.5 relative border select-none cursor-pointer bg-slate-900 border-slate-800 text-white"
            onClick={() => {
              setActiveChatId(latestMsg.chatId);
              setActiveTab('customers');
              setIsWidgetOpen(true);
              setShowNotification(false);
              // Clear unread for this chat
              try {
                const storedChats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
                const idx = storedChats.findIndex((c: any) => c.id === latestMsg.chatId);
                if (idx !== -1) {
                  storedChats[idx].unread = 0;
                  localStorage.setItem('SERVICE_CHATS', JSON.stringify(storedChats));
                  window.dispatchEvent(new Event('service-chats-updated'));
                }
              } catch(e){}
            }}
          >
            <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-sm shrink-0 shadow-inner">
              {latestMsg.customerName.charAt(0)}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center mb-0.5">
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border bg-amber-500/10 text-amber-400 border-amber-500/20">
                  {latestMsg.title || 'رسالة جديدة'}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">{latestMsg.time}</span>
              </div>
              <h4 className="text-xs font-black text-slate-100">
                {latestMsg.customerName}
              </h4>
              <p className="text-[11px] truncate font-semibold mt-1 leading-snug text-slate-300">
                {latestMsg.text}
              </p>
              
              <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-800">
                <button className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-3.5 py-1.5 rounded-xl hover:bg-amber-400 transition-all">
                  رد فوري الآن
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowNotification(false);
                  }}
                  className="text-[10px] text-slate-400 hover:text-white px-2 py-1.5 font-bold"
                >
                  تجاهل
                </button>
              </div>
            </div>
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setShowNotification(false);
              }}
              className="absolute top-3 left-3 hover:scale-110 transition-transform text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Instant Chat Floating Widget Popup */}
      <AnimatePresence>
        {isWidgetOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="mb-4 bg-white border border-slate-200 rounded-3xl shadow-2xl w-[350px] sm:w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[70vh] sm:max-h-[520px] flex flex-col overflow-hidden text-slate-850"
          >
            {/* Widget Header */}
            <div className="bg-slate-900 p-4 text-white flex justify-between items-center shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-slate-950 font-black text-xs">
                  {activeChat && activeTab === 'customers' ? activeChat.customerName.charAt(0) : <MessageSquare className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-xs tracking-tight">
                    {activeChat && activeTab === 'customers' ? `محادثة: ${activeChat.customerName}` : 'بوابة المحادثات والاتصال المباشر'}
                  </h3>
                  <p className="text-[9px] text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    بوابة الشركاء الفورية والمؤمنة
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Sound toggle */}
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                  title={soundEnabled ? 'كتم الصوت' : 'تفعيل صوت التنبيه'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                <button
                  onClick={() => setIsWidgetOpen(false)}
                  className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* TAB SELECTOR: Render ONLY if user is eligible for VIP support and not active inside a specific customer chat */}
            {isVipProvider && !activeChatId && (
              <div className="flex border-b border-slate-200 bg-slate-50 shrink-0">
                <button
                  onClick={() => setActiveTab('customers')}
                  className={`flex-1 py-3 text-xs font-black border-b-2 transition-all ${
                    activeTab === 'customers' 
                      ? 'border-indigo-600 text-indigo-600 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  محادثات العملاء الفورية 👥
                  {unreadCount > 0 && (
                    <span className="mr-1.5 bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded-full font-sans">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`flex-1 py-3 text-xs font-black border-b-2 transition-all ${
                    activeTab === 'admin' 
                      ? 'border-amber-500 text-amber-600 bg-white' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  شات الطوارئ مع الإدارة 👑
                </button>
              </div>
            )}

            {/* CONTENT ROUTING */}
            {activeTab === 'customers' ? (
              /* CUSTOMER CHAT SYSTEM */
              activeChatId !== null && activeChat ? (
                <>
                  {/* Sub-header to go back to list */}
                  <div className="p-2 border-b border-slate-150 bg-slate-50 flex justify-between items-center shrink-0">
                    <button
                      onClick={() => setActiveChatId(null)}
                      className="text-[10px] font-black text-slate-600 hover:text-slate-900 flex items-center gap-1 hover:bg-slate-200/50 px-2 py-1 rounded-lg transition-all"
                    >
                      <ArrowLeft className="w-3.5 h-3.5 transform rotate-180" /> العودة لقائمة العملاء
                    </button>
                    <a
                      href="/provider-messages"
                      className="text-[9px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2"
                    >
                      البوابة الكاملة <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  {/* Messages Panel */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/75 custom-scrollbar">
                    {activeChatMsgs.map((m: any) => {
                      const isSelf = m.senderType === 'مزود خدمة';
                      return (
                        <div key={m.id} className={`flex flex-col ${isSelf ? 'items-start' : 'items-end'}`}>
                          <span className="text-[8px] text-slate-400 mb-0.5 px-1 font-semibold">
                            {isSelf ? 'أنت' : activeChat.customerName}
                          </span>
                          <div className={`p-3 rounded-2xl text-[11px] leading-relaxed max-w-[85%] shadow-sm ${
                            isSelf ? 'bg-white text-slate-800 border border-slate-150 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none font-medium'
                          }`}>
                            {m.text}
                            <span className="block text-[8px] opacity-70 mt-1 text-left font-mono">
                              {m.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Reply Input Form */}
                  <div className="p-3 bg-white border-t border-slate-150 shrink-0">
                    <form onSubmit={handleSendQuickReply} className="flex gap-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        type="text"
                        placeholder="اكتب ردك السريع واللبق..."
                        className="flex-1 bg-slate-50 border border-slate-250 rounded-xl px-3.5 py-2 text-xs outline-none focus:border-indigo-500 transition-colors"
                      />
                      <button
                        type="submit"
                        disabled={!replyText.trim()}
                        className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white w-9 h-9 rounded-xl flex items-center justify-center shadow transition-all active:scale-95 shrink-0"
                      >
                        <Send className="w-4 h-4 transform rotate-180" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                /* CHATS LIST VIEW */
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="p-3 bg-slate-50 text-[10px] font-black text-slate-500 border-b border-slate-150 flex justify-between items-center shrink-0">
                    <span>الرسائل والطلبات المستلمة من عملائك</span>
                    <span className="font-mono bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                      {chats.length} عملاء
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {chats.map((c: any) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setActiveChatId(c.id);
                          // Clear unread
                          try {
                            const stored = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
                            const ix = stored.findIndex((ch: any) => ch.id === c.id);
                            if (ix !== -1) {
                              stored[ix].unread = 0;
                              localStorage.setItem('SERVICE_CHATS', JSON.stringify(stored));
                              window.dispatchEvent(new Event('service-chats-updated'));
                            }
                          } catch(e){}
                        }}
                        className="p-3.5 hover:bg-slate-50 cursor-pointer flex items-center gap-3 transition-colors relative"
                      >
                        <div className="w-9 h-9 bg-indigo-50 text-indigo-700 rounded-xl flex items-center justify-center font-black text-xs shrink-0">
                          {c.customerName.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h4 className="text-xs font-black text-slate-800 truncate">{c.customerName}</h4>
                            <span className="text-[9px] text-slate-400 font-bold shrink-0">{c.time}</span>
                          </div>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">{c.lastMsg}</p>
                        </div>
                        
                        {c.unread > 0 && (
                          <span className="bg-rose-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 shrink-0 text-center animate-pulse">
                            {c.unread}
                          </span>
                        )}
                      </div>
                    ))}

                    {chats.length === 0 && (
                      <div className="p-12 text-center text-slate-400">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 text-slate-200" />
                        <p className="text-xs font-bold">لا توجد محادثات عملاء حالياً</p>
                        <span className="text-[10px] text-slate-400 mt-1 block">سيظهر العميل هنا بمجرد مراسلتك.</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-3 bg-slate-50 border-t border-slate-150 text-center shrink-0">
                    <a
                      href="/provider-messages"
                      className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-all"
                    >
                      اذهب إلى بوابة الرسائل الكاملة للشركاء <ChevronLeft className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              )
            ) : (
              /* ADMIN VIP EMERGENCY LIVE CHAT SYSTEM */
              adminIsDisabled ? (
                /* OFF-HOURS / DISABLED SUPPORT APOLOGY */
                <div className="flex-1 p-6 flex flex-col bg-slate-900 justify-center text-right text-white relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full filter blur-2xl pointer-events-none" />
                  
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-amber-500/15 flex items-center justify-center text-amber-500 border border-amber-500/20 shrink-0">
                      <span className="text-xl">✨</span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-amber-500 text-sm">شريك ليلة المميّز 👑</h4>
                      <p className="text-[10px] text-slate-350 font-sans">فترة الصيانة المؤقتة للدعم الفوري</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-slate-200 leading-relaxed mb-4 font-medium">
                    نعتذر لشركائنا المميّزين: نظام المحادثات المباشرة غير متاح حالياً (خارج أوقات العمل الرسمية أو لأعمال صيانة مؤقتة).
                  </p>
                  
                  <div className="bg-slate-950 border border-amber-500/10 p-3 rounded-xl mb-4 text-right">
                    <p className="text-[11px] text-amber-400 font-bold leading-normal">
                      🛡️ لضمان عدم تعطل أعمالكم، تم توفير (أولوية قصوى - SLA 1h) استثنائية لتذاكركم المرفوعة الآن. يرجى فتح تذكرة دعم لإنجازها فوراً وتعويضكم عن توقف شات الدعم الفوري.
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('open-vip-ticket-modal'));
                    }}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black text-xs py-3 rounded-2xl transition-all shadow-lg text-center cursor-pointer flex items-center justify-center gap-2"
                  >
                    <span>فتح تذكرة دعم بأولوية قصوى 🚀</span>
                  </button>
                </div>
              ) : (
                /* ACTIVE OR INITIAL SUPPORT CHAT STAGE */
                <div className="flex-1 flex flex-col bg-slate-900 text-white min-h-0">
                  {adminToastMessage && (
                    <div className="bg-amber-500 text-white text-[11px] font-bold px-3 py-2 text-center flex items-center justify-between shadow-sm animate-bounce shrink-0 relative z-30">
                      <span>{adminToastMessage}</span>
                      <button onClick={() => setAdminToastMessage(null)} className="text-white opacity-80 hover:opacity-100 mr-2"><X className="w-3.5 h-3.5"/></button>
                    </div>
                  )}

                  {adminChatState !== 'ended' && (
                    <div className="shrink-0 flex flex-col text-right">
                      {adminAlertMessage && (
                        <div className="bg-amber-50 border-b border-amber-100 text-amber-900 text-[10px] font-bold px-3.5 py-2.5 flex items-start gap-1.5" dir="rtl">
                          <span className="text-amber-500 scale-115">⚠️</span>
                          <span className="leading-normal">{adminAlertMessage}</span>
                        </div>
                      )}
                      {checkWorkingHoursStatus().isOutside && (
                        <div className="bg-rose-50 border-b border-rose-100 text-rose-800 text-[10px] font-bold px-3.5 py-2.5 flex items-start gap-1.5" dir="rtl">
                          <span className="text-rose-500 scale-115">🕒</span>
                          <span className="leading-relaxed">{checkWorkingHoursStatus().msg}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {adminChatState === 'initial' && (
                    <div className="flex-1 p-5 flex flex-col bg-slate-950 justify-center text-right overflow-y-auto">
                      <div className="bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-800 text-center mb-4">
                        <User className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                        <h4 className="font-bold text-amber-500 text-xs">شات الطوارئ والدعم الفني المباشر للشركاء 👑</h4>
                        <p className="text-[10px] text-slate-400 mt-1 leading-normal">الدعم الفوري المتاح حصرياً للشركاء ومزودي الخدمات من الباقات المتقدمة.</p>
                      </div>
                      <form onSubmit={handleStartAdminChat} className="space-y-3.5" dir="rtl">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">اسم مزود الخدمة / ممثل الشريك</label>
                          <input required type="text" value={adminCustomerName} onChange={e => setAdminCustomerName(e.target.value)} placeholder="اسم مزود الخدمة أو الشريك الكريم..." className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 transition-colors shadow-sm font-medium animate-pulse" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 mb-1">موضوع بلاغ الطوارئ / الاستفسار العاجل</label>
                          <select 
                            value={adminTopic} 
                            onChange={e => setAdminTopic(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-amber-500 transition-colors shadow-sm cursor-pointer font-medium"
                          >
                            <option value="استفسارات وشكاوى">استفسار عام لمزود الخدمة</option>
                            <option value="مشاكل تقنية">بلاغ خلل فني طارئ بقاعة/خدمة</option>
                            <option value="الحجوزات والخدمات">مشكلة حجز / تواصل عاجل من عميل</option>
                            <option value="المطالبات المالية">تسوية مالية مستعجلة وطارئة</option>
                          </select>
                        </div>
                        <button type="submit" className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-black py-2.5 rounded-xl shadow-md transition-all flex items-center justify-center gap-2 text-xs">اتصل الآن بممثلي الإدارة 👑 <Send className="w-3.5 h-3.5 transform rotate-180"/></button>
                      </form>
                    </div>
                  )}

                  {adminChatState === 'waiting' && (
                    <div className="flex-1 p-6 flex flex-col items-center justify-center text-center bg-slate-950">
                      <Loader2 className="w-10 h-10 text-amber-500 animate-spin mb-4" />
                      <h4 className="font-bold text-white text-base">جاري الاتصال بمشرفي المنصة...</h4>
                      <div className="mt-4 bg-amber-500/10 border border-amber-500/20 text-amber-300 p-3 rounded-xl text-xs font-bold leading-normal w-full">
                        تنبيه: يتم توجيهك الآن للرد المباشر الخاص بشركائنا؛ يرجى الانتظار ورقمك في الطابور هو <span className="font-sans font-bold text-amber-500 text-sm px-1">{adminQueuePosition}</span>
                      </div>
                    </div>
                  )}

                  {adminChatState === 'active' && (
                    <>
                      <div className="flex-1 bg-slate-950 p-4 pt-6 overflow-y-auto space-y-4 custom-scrollbar relative border-t border-slate-850">
                        <div className="text-center text-[10px] text-slate-500 font-medium mb-4">تم بدء اتصال الدعم المباشر الفوري مع الإدارة: {getFirstName(adminAgentName)}</div>
                        {adminMessages.map((m, idx) => (
                          <div key={idx} className={`flex ${m.senderType === 'customer' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3 rounded-2xl text-xs shadow-sm max-w-[85%] ${m.senderType === 'customer' ? 'bg-amber-500 text-slate-950 rounded-tr-sm font-semibold' : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-sm'}`}>
                              {m.text}
                              <div className={`text-[9px] mt-1.5 text-left font-medium ${m.senderType === 'customer' ? 'text-slate-800' : 'text-slate-400'}`}>{m.time}</div>
                            </div>
                          </div>
                        ))}
                        {adminIsTyping && (
                          <div className="flex justify-start">
                            <div className="bg-slate-900 border border-slate-800 text-slate-400 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                            </div>
                          </div>
                        )}
                        <div ref={adminMessagesEndRef} />
                      </div>
                      <div className="p-3 bg-slate-900 border-t border-slate-850 shrink-0">
                        <form onSubmit={handleSendAdminMessage} className="flex gap-2">
                          <input value={adminInputValue} onChange={e => { setAdminInputValue(e.target.value); handleAdminTyping(); }} type="text" placeholder="اكتب رسالة الدعم العاجل..." className="flex-1 bg-slate-950 text-white border border-slate-800 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500 transition-colors" />
                          <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-950 w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"><Send className="w-5 h-5 transform rotate-180" /></button>
                        </form>
                      </div>
                    </>
                  )}

                  {adminChatState === 'ended' && (
                    <div className="flex-1 p-6 flex flex-col bg-slate-950 overflow-y-auto text-right">
                      {!adminFeedbackSubmitted ? (
                        <div className="space-y-6 animate-in fade-in duration-500">
                          <div className="text-center">
                            <h4 className="font-bold text-amber-500 text-sm">تقييم تجربة الدعم الفني</h4>
                            <p className="text-[10px] text-slate-400 mt-1">نسعد بمعرفة رأيك لتطوير منصة ليلة باستمرار</p>
                          </div>

                          <div className="space-y-4">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">تقييم التجربة الإجمالية</label>
                              <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button key={star} onClick={() => setAdminRating(star)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${adminRating >= star ? 'bg-amber-550/20 text-amber-500 scale-110 font-bold' : 'bg-slate-900 text-slate-600 hover:bg-slate-850'}`}>
                                    <Star className={`w-5 h-5 ${adminRating >= star ? 'fill-amber-500 text-amber-500' : 'text-slate-600'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">تقييم تعامل موظف الإدارة "{getFirstName(adminAgentName)}"</label>
                              <div className="flex justify-center gap-2">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <button key={star} onClick={() => setAdminEmployeeRating(star)} className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${adminEmployeeRating >= star ? 'bg-amber-550/20 text-amber-500 scale-110 font-bold' : 'bg-slate-900 text-slate-600 hover:bg-slate-850'}`}>
                                    <Star className={`w-5 h-5 ${adminEmployeeRating >= star ? 'fill-amber-500 text-amber-500' : 'text-slate-600'}`} />
                                  </button>
                                ))}
                              </div>
                            </div>

                            <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-2 uppercase">هل تم حل مشكلتك بالكامل؟</label>
                              <div className="flex gap-4">
                                <button onClick={() => setAdminIsResolved(true)} className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-xs ${adminIsResolved === true ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                                  نعم، تم الحل
                                </button>
                                <button onClick={() => setAdminIsResolved(false)} className={`flex-1 py-2 rounded-xl font-bold flex items-center justify-center gap-2 border transition-all text-xs ${adminIsResolved === false ? 'bg-rose-600 text-white border-rose-600 shadow-md' : 'bg-slate-900 text-slate-400 border-slate-800'}`}>
                                  لا، لم يحل بعد
                                </button>
                              </div>
                            </div>
                          </div>

                          <button 
                            disabled={!adminRating || !adminEmployeeRating || adminIsResolved === null}
                            onClick={handleSubmitAdminFeedback}
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 py-3 rounded-2xl font-black text-xs shadow-lg hover:from-amber-600 transition-all disabled:opacity-40"
                          >
                            إرسال التقييم للإدارة
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-center animate-in zoom-in-95 py-8">
                          <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-3">
                            <Send className="w-6 h-6 transform rotate-180" />
                          </div>
                          <h4 className="font-bold text-emerald-400 text-sm">شكراً لتقييمك الكريم!</h4>
                          <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">مساهمتك تساعدنا في تقديم وقياس جودة خدمات ممثلي الإدارة للشركاء.</p>
                          <button 
                            onClick={() => { 
                              setAdminChatState('initial'); 
                              setActiveTab('customers');
                              setAdminFeedbackSubmitted(false); 
                              setAdminMessages([]); 
                              setAdminRating(0); 
                              setAdminEmployeeRating(0); 
                              setAdminIsResolved(null);
                            }} 
                            className="mt-6 bg-amber-500 text-slate-950 px-6 py-2 rounded-xl font-black text-xs"
                          >
                            العودة لمحادثات العملاء
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Instant Chat Button */}
      {isProvider && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsWidgetOpen(!isWidgetOpen)}
          className="relative bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 w-14 h-14 rounded-full flex items-center justify-center shadow-2xl hover:shadow-amber-500/20 transition-all cursor-pointer focus:outline-none ring-4 ring-white border border-amber-600 shrink-0"
          title="بوابة المحادثات والاتصال المباشر للشركاء"
        >
          <MessageCircle className="w-7 h-7" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-6 h-6 bg-rose-600 text-white rounded-full border-2 border-white text-[10px] font-black flex items-center justify-center animate-bounce shadow-md font-sans">
              {unreadCount}
            </span>
          )}
          
          {/* Pulsing indicator loop if there are unread messages */}
          {unreadCount > 0 && (
            <span className="absolute inset-0 rounded-full bg-amber-500 -z-10 animate-ping opacity-25"></span>
          )}
        </motion.button>
      )}

    </div>
  );
}
