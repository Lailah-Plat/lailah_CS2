import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Headset, User, MessageSquare, AlertTriangle, Ban, Sparkles, MapPin, Building } from 'lucide-react';

const checkMessageForViolation = (text: string) => {
  const normalizedText = text.replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString());
  const phoneRegex = /(?:[0-9][\s-]*){7,}/;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const socialKeywords = [
    '@', 'سناب', 'سناب شات', 'snap', 'snapchat', 'انستا', 'انستقرام', 'انستغرام', 
    'insta', 'instagram', 'واتس', 'واتساب', 'whatsapp', 'تويتر', 'twitter', 
    'فيسبوك', 'facebook', 'تيك توك', 'tiktok', 'تليجرام', 'telegram', 'رابط خارجي'
  ];
  const badWords = [
    'سب', 'شتم', 'قذر', 'حمار', 'كلب', 'محتال', 'سرقة', 'كذاب', 'نصاب', 'غش', 
    'تلاعب', 'غبي', 'حيوان', 'حرامي', 'اللعنة', 'لعنة', 'تفؤ', 'تفو', 'حقير', 
    'سخيف', 'زفت', 'نصابة', 'سرق', 'كذابة'
  ];

  if (phoneRegex.test(normalizedText)) {
    return { isViolation: true, type: 'رقم هاتف / تواصل مباشر' };
  }
  if (emailRegex.test(text)) {
    return { isViolation: true, type: 'بريد إلكتروني خارجي' };
  }
  for (const kw of socialKeywords) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      return { isViolation: true, type: 'حساب تواصل خارجي أو رابط منصة' };
    }
  }
  for (const word of badWords) {
    if (text.toLowerCase().includes(word.toLowerCase())) {
      return { isViolation: true, type: 'ألفاظ مسيئة أو غير لائقة' };
    }
  }
  
  return { isViolation: false, type: '' };
};

export default function ProviderChatModal({ isOpen, onClose, providerName, hallName }: { isOpen: boolean; onClose: () => void; providerName: string; hallName: string; }) {
  const [messages, setMessages] = useState<any[]>([]);
  const [chatId, setChatId] = useState<number | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [providerHours, setProviderHours] = useState<any>(null);
  const [providerAlert, setProviderAlert] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load provider's halls and services
  const getProviderHallsAndServices = () => {
    let hallsList: any[] = [];
    let servicesList: any[] = [];
    try {
      const rawHalls = localStorage.getItem('PLATFORM_HALLS_V4') || localStorage.getItem('PLATFORM_HALLS');
      if (rawHalls) hallsList = JSON.parse(rawHalls);
    } catch(e){}
    try {
      const rawServices = localStorage.getItem('PLATFORM_SERVICES_V4') || localStorage.getItem('PLATFORM_SERVICES');
      if (rawServices) servicesList = JSON.parse(rawServices);
    } catch(e){}
    
    // Normalize provider name for match
    const norm = (name: string) => (name || '').trim().toLowerCase();
    const pNorm = norm(providerName);
    
    const matchedHalls = hallsList.filter((h: any) => {
      const hProv = norm(h.providerName || h.provider || '');
      return hProv === pNorm || hProv.includes(pNorm) || pNorm.includes(hProv);
    });
    
    const matchedServices = servicesList.filter((s: any) => {
      const sProv = norm(s.providerName || s.provider || '');
      return sProv === pNorm || sProv.includes(pNorm) || pNorm.includes(sProv);
    });
    
    return { halls: matchedHalls, services: matchedServices };
  };

  const handleSelectItem = (item: any, type: 'hall' | 'service') => {
    // Build the selection message text
    const typeLabel = type === 'hall' ? 'القاعة' : 'الخدمة المساندة';
    const regionText = item.region || 'المنطقة الغربية';
    const cityText = item.city || 'جدة';
    const selectionText = `📍 أود الاستفسار بخصوص ${typeLabel}: "${item.name}"\nالمنطقة: ${regionText} • المدينة: ${cityText}`;

    // Set in the input field (draft pre-fill) without auto-sending
    setInputValue(selectionText);
  };

  useEffect(() => {
    if (!isOpen) return;
    
    // Load alert message
    const msgKey = `PROVIDER_ALERT_MSG_${providerName}`;
    const savedMsg = localStorage.getItem(msgKey);
    if (savedMsg) {
      setProviderAlert(savedMsg);
    } else {
      setProviderAlert(`مرحباً بكم في صفحة المحادثة المباشرة لـ ${providerName}. نسعد بخدمتكم والإجابة على استفساراتكم خلال أوقات العمل الرسمية.`);
    }

    // Load working hours
    const hrsKey = `PROVIDER_WORKING_HOURS_${providerName}`;
    const savedHrs = localStorage.getItem(hrsKey);
    if (savedHrs) {
      try {
        setProviderHours(JSON.parse(savedHrs));
      } catch (e) {
        setProviderHours(null);
      }
    } else {
      setProviderHours(null);
    }
  }, [isOpen, providerName]);

  const checkProviderWorkingHoursStatus = () => {
    const hours = providerHours || {
       'الأحد': { active: true, period1Start: '09:00', period1End: '13:00', period2Start: '17:00', period2End: '21:00' },
       'الإثنين': { active: true, period1Start: '09:00', period1End: '13:00', period2Start: '17:00', period2End: '21:00' },
       'الثلاثاء': { active: true, period1Start: '09:00', period1End: '13:00', period2Start: '17:00', period2End: '21:00' },
       'الأربعاء': { active: true, period1Start: '09:00', period1End: '13:00', period2Start: '17:00', period2End: '21:00' },
       'الخميس': { active: true, period1Start: '09:00', period1End: '13:00', period2Start: '17:00', period2End: '21:00' },
       'الجمعة': { active: true, period1Start: '16:00', period1End: '22:00', period2Start: '', period2End: '' },
       'السبت': { active: true, period1Start: '16:00', period1End: '22:00', period2Start: '', period2End: '' }
    };

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
    const dayConfig = hours[dayNameAr];
    
    if (!dayConfig) return { isOutside: false, msg: '' };
    if (!dayConfig.active) {
      return { 
        isOutside: true, 
        msg: `عذراً، اليوم (${dayNameAr}) هو يوم إجازة رسمي لمزود الخدمة والرد المباشر قد يكون متأخراً.` 
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
      if (activePeriods) activePeriods += ' • ';
      activePeriods += `من ${dayConfig.period2Start} إلى ${dayConfig.period2End}`;
    }
    
    return {
      isOutside: true,
      msg: `تنبيه: أنت تراسل المزود خارج ساعات عمله الرسمية (${activePeriods || 'غير متوفرة حالياً'}). قد يتم الرد عليك لاحقاً.`
    };
  };

  const workingStatus = checkProviderWorkingHoursStatus();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    // Load currentUser
    const currentUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('currentUser') || '{}');
      } catch (e) {
        return {};
      }
    })();
    const customerName = currentUser.name || 'عميل';

    if (hallName) {
      let rawHallsList: any[] = [];
      let rawServicesList: any[] = [];
      try {
        const rawHalls = localStorage.getItem('PLATFORM_HALLS_V4') || localStorage.getItem('PLATFORM_HALLS');
        if (rawHalls) rawHallsList = JSON.parse(rawHalls);
      } catch(e){}
      try {
        const rawServices = localStorage.getItem('PLATFORM_SERVICES_V4') || localStorage.getItem('PLATFORM_SERVICES');
        if (rawServices) rawServicesList = JSON.parse(rawServices);
      } catch(e){}

      const normalizeArabic = (str: string) => {
        return str
          .replace(/[أإآا]/g, 'ا')
          .replace(/[ةه]/g, 'ه')
          .replace(/[ىي]/g, 'ي')
          .trim()
          .toLowerCase();
      };
      const normalizedHallName = normalizeArabic(hallName || '');
      
      // Try to find in services first to verify if it is a support service
      let matchedItem = rawServicesList.find(s => normalizeArabic(s.name || '') === normalizedHallName);
      let isService = !!matchedItem;
      
      if (!matchedItem) {
        matchedItem = rawHallsList.find(h => normalizeArabic(h.name || '') === normalizedHallName);
      }
      
      if (!matchedItem) {
        matchedItem = rawServicesList.find(s => normalizeArabic(s.name || '').includes(normalizedHallName) || normalizedHallName.includes(normalizeArabic(s.name || '')));
        if (matchedItem) isService = true;
      }
      if (!matchedItem) {
        matchedItem = rawHallsList.find(h => normalizeArabic(h.name || '').includes(normalizedHallName) || normalizedHallName.includes(normalizeArabic(h.name || '')));
      }

      const typeLabel = isService ? 'الخدمة المساندة' : 'القاعة';
      const regionText = matchedItem?.region || 'المنطقة الغربية';
      const cityText = matchedItem?.city || 'جدة';
      const contextText = `📍 أود الاستفسار بخصوص ${typeLabel}: "${hallName}"\nالمنطقة: ${regionText} • المدينة: ${cityText}`;
      setInputValue(contextText);
    }

    const syncWithGlobalChats = () => {
      let chats: any[] = [];
      let msgs: Record<number, any[]> = {};

      try {
        chats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
        msgs = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');
      } catch(e) {}

      // If they are empty, initialize default ones
      if (chats.length === 0) {
        chats = [
          { id: 101, providerName: 'شركة أطياف', customerName: 'أحمد محمد', lastMsg: 'ممكن رقم للتواصل الخارجي؟', time: '10:30 ص', status: 'violation', unread: 1 },
          { id: 102, providerName: 'قاعة اللؤلؤة', customerName: 'سارة خالد', lastMsg: 'بكم السعر؟', time: '09:15 ص', status: 'normal', unread: 0 },
          { id: 103, providerName: 'قاعة المها', customerName: 'عبد الله صالح', lastMsg: 'هل يتوفر موقف سيارات مجاني؟', time: 'أمس', status: 'normal', unread: 0 }
        ];
        msgs = {
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
        localStorage.setItem('SERVICE_CHATS', JSON.stringify(chats));
        localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(msgs));
      }

      // Find chat for this provider/service & current customer
      let activeChat = chats.find(c => 
        (c.providerName === providerName || c.providerName.includes(providerName) || providerName.includes(c.providerName)) && 
        c.customerName === customerName
      );

      if (!activeChat) {
        const newId = Date.now();
        const welcomeText = `مرحباً بك! كيف يمكننا مساعدتك بخصوص ${hallName || 'القاعة أو الخدمة'}؟`;

        activeChat = {
          id: newId,
          providerName: providerName,
          customerName: customerName,
          lastMsg: welcomeText,
          time: new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'}),
          status: 'normal',
          unread: 0
        };
        chats.push(activeChat);
        msgs[newId] = [
          {
            id: 1,
            senderName: providerName,
            senderType: 'مزود خدمة',
            text: welcomeText,
            time: new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit'}),
            isViolation: false,
            moderationStatus: 'passed'
          }
        ];

        localStorage.setItem('SERVICE_CHATS', JSON.stringify(chats));
        localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(msgs));
        window.dispatchEvent(new Event('service-chats-updated'));
      }

      setChatId(activeChat.id);
      
      const globalMsgs = msgs[activeChat.id] || [];
      const componentMsgs = globalMsgs.map((gm: any) => {
        let isBlocked = gm.isViolation && (gm.moderationStatus === 'pending' || gm.moderationStatus === 'blocked');
        return {
          id: gm.id,
          text: isBlocked ? '⚠️ *** تم حجب هذه الرسالة وتوقيفها لمخالفتها شروط النشر والمراسلة بالمنصة (يُمنع تبادل وسائل الاتصال والبريد الإلكتروني والشتائم) ***' : gm.text,
          senderType: gm.senderType === 'عميل' ? 'customer' : 'provider',
          time: gm.time,
          isBlocked: isBlocked
        };
      });

      setMessages(componentMsgs);
    };

    syncWithGlobalChats();

    window.addEventListener('service-chats-updated', syncWithGlobalChats);
    window.addEventListener('storage', syncWithGlobalChats);
    return () => {
      window.removeEventListener('service-chats-updated', syncWithGlobalChats);
      window.removeEventListener('storage', syncWithGlobalChats);
    };
  }, [isOpen, providerName, hallName]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !chatId) return;

    let chats: any[] = [];
    let msgs: Record<number, any[]> = {};
    try {
      chats = JSON.parse(localStorage.getItem('SERVICE_CHATS') || '[]');
      msgs = JSON.parse(localStorage.getItem('SERVICE_CHAT_MESSAGES') || '{}');
    } catch(e) {}

    const currentUser = (() => {
      try {
        return JSON.parse(localStorage.getItem('currentUser') || '{}');
      } catch (e) {
        return {};
      }
    })();
    const customerName = currentUser.name || 'عميل';

    const violationCheck = checkMessageForViolation(inputValue);
    const hasViolation = violationCheck.isViolation;

    const newGlobalMsg = {
      id: Date.now(),
      senderName: customerName,
      senderType: 'عميل',
      text: inputValue,
      time: new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit', hour12: true}),
      isViolation: hasViolation,
      violationType: violationCheck.type || '',
      moderationStatus: hasViolation ? 'pending' : 'passed'
    };

    msgs[chatId] = [...(msgs[chatId] || []), newGlobalMsg];

    chats = chats.map(c => {
      if (c.id === chatId) {
        return {
          ...c,
          lastMsg: inputValue,
          time: new Date().toLocaleTimeString('ar-SA', {hour: '2-digit', minute:'2-digit', hour12: true}),
          status: hasViolation ? 'violation' : (c.status === 'violation' ? 'violation' : 'normal'),
          unread: c.unread + 1
        };
      }
      return c;
    });

    localStorage.setItem('SERVICE_CHATS', JSON.stringify(chats));
    localStorage.setItem('SERVICE_CHAT_MESSAGES', JSON.stringify(msgs));

    window.dispatchEvent(new Event('service-chats-updated'));
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" dir="rtl">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col h-[500px] relative border border-slate-100">
        <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-4 text-white flex justify-between items-center shadow-md z-10 shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-black text-lg text-white">
               {providerName.charAt(0)}
             </div>
             <div>
               <h3 className="font-bold text-sm tracking-tight">{providerName}</h3>
               <p className="text-[10px] text-amber-100 font-medium">مزود الخدمة لـ {hallName}</p>
             </div>
          </div>
          <button 
            onClick={onClose} 
            className="bg-white/20 hover:bg-white/35 text-white p-1.5 rounded-full transition-all duration-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 bg-slate-50 p-4 overflow-y-auto space-y-4 custom-scrollbar relative">
          {/* رسالة التنبيه المخصصة للمزود وحالة أوقات العمل الخاصة به */}
          {(providerAlert || workingStatus.isOutside) && (
            <div className="bg-amber-50/95 border border-amber-200/80 rounded-2xl p-3.5 text-xs text-slate-800 leading-relaxed shadow-sm space-y-2.5 animate-in fade-in duration-300">
               {providerAlert && (
                 <div className="flex items-start gap-2">
                    <MessageSquare className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div className="flex-1">
                       <span className="text-amber-800 font-extrabold block text-[10px] uppercase tracking-wide mb-0.5">تنبيه مزود الخدمة:</span>
                       <p className="font-semibold text-slate-700">{providerAlert}</p>
                    </div>
                 </div>
               )}
               {workingStatus.isOutside && (
                 <div className="flex items-start gap-2 border-t border-amber-200/50 pt-2">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                       <span className="font-extrabold text-rose-800 block text-[10px] uppercase tracking-wide mb-0.5">خارج أوقات العمل المفضلة:</span>
                       <p className="font-semibold text-rose-700">{workingStatus.msg}</p>
                    </div>
                 </div>
               )}
            </div>
          )}

          {messages.map((m) => {
            if (m.text === '[REQUEST_SELECT_HALL_OR_SERVICE]') {
              const { halls, services } = getProviderHallsAndServices();
              return (
                <div key={m.id} className="flex flex-col items-start w-full my-2 animate-in slide-in-from-bottom-2 duration-300">
                  <span className="text-[9px] text-slate-400 mb-0.5 px-1 font-semibold">
                    {providerName}
                  </span>
                  <div className="bg-gradient-to-br from-indigo-50 to-slate-50 border border-indigo-100 rounded-2xl p-4 shadow-md w-full max-w-[90%] text-right font-sans">
                    <div className="flex items-center gap-2 mb-2 text-indigo-700">
                      <Sparkles className="w-4 h-4" />
                      <h4 className="text-xs font-black">طلب تحديد القاعة أو الخدمة</h4>
                    </div>
                    <p className="text-[11px] text-slate-600 font-semibold mb-3 leading-relaxed">
                      أهلاً بك! لتوفير الخدمة الأمثل لك، يرجى تحديد القاعة أو الخدمة المساندة التي تود الاستفسار عنها من القائمة أدناه:
                    </p>

                    <div className="space-y-2 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
                      {halls.map((h: any) => (
                        <button
                          key={h.id}
                          onClick={() => handleSelectItem(h, 'hall')}
                          className="w-full text-right p-2.5 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-150 transition-all flex justify-between items-center group shadow-sm cursor-pointer"
                        >
                          <div className="min-w-0 flex-1 pl-2">
                            <span className="text-[8px] bg-amber-100 text-amber-850 px-1.5 py-0.5 rounded-md font-bold ml-1.5 inline-block">قاعة</span>
                            <span className="text-[11px] font-extrabold text-slate-800 truncate">{h.name}</span>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                              📍 {h.region || 'المنطقة'} • {h.city || 'المدينة'}
                            </div>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                            اختيار
                          </span>
                        </button>
                      ))}

                      {services.map((s: any) => (
                        <button
                          key={s.id}
                          onClick={() => handleSelectItem(s, 'service')}
                          className="w-full text-right p-2.5 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-150 transition-all flex justify-between items-center group shadow-sm cursor-pointer"
                        >
                          <div className="min-w-0 flex-1 pl-2">
                            <span className="text-[8px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded-md font-bold ml-1.5 inline-block">خدمة</span>
                            <span className="text-[11px] font-extrabold text-slate-800 truncate">{s.name}</span>
                            <div className="text-[9px] text-slate-400 mt-0.5 font-semibold">
                              📍 {s.region || 'المنطقة الغربية'} • {s.city || 'جدة'}
                            </div>
                          </div>
                          <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-2.5 py-1 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all shrink-0">
                            اختيار
                          </span>
                        </button>
                      ))}

                      {halls.length === 0 && services.length === 0 && (
                        <p className="text-[10px] text-slate-400 text-center py-4 font-bold">لا تتوفر قاعات أو خدمات مضافة حالياً لهذا المزود</p>
                      )}
                    </div>
                    <div className="text-[8px] mt-2.5 text-slate-400 text-left font-bold">{m.time}</div>
                  </div>
                </div>
              );
            }

            return (
              <div key={m.id} className={`flex flex-col ${m.senderType === 'customer' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[9px] text-slate-400 mb-0.5 px-1 font-semibold">
                    {m.senderType === 'customer' ? 'أنت (العميل)' : providerName}
                  </span>
                  <div className={`p-3 rounded-2xl text-xs shadow-sm max-w-[85%] leading-relaxed ${
                    m.senderType === 'customer' 
                      ? (m.isBlocked ? 'bg-rose-50 border border-rose-200 text-rose-700 rounded-tr-none' : 'bg-amber-550 text-white rounded-tr-none font-medium bg-amber-500') 
                      : (m.isBlocked ? 'bg-rose-50 border border-rose-200 text-rose-700 rounded-tl-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none')
                  }`}>
                      {m.text}
                      <div className={`text-[8px] mt-1 text-left font-medium ${m.senderType === 'customer' && !m.isBlocked ? 'text-amber-100' : 'text-slate-400'}`}>{m.time}</div>
                  </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>
        
        <div className="p-3 bg-white border-t border-slate-100 shrink-0">
          <form onSubmit={handleSendMessage} className="flex gap-2">
             <input 
               value={inputValue} 
               onChange={e => setInputValue(e.target.value)} 
               type="text" 
               placeholder="اكتب رسالتك للمزود..." 
               className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-amber-500 focus:bg-white transition-colors" 
             />
             <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white w-11 h-11 rounded-xl flex items-center justify-center shadow-md transition-transform active:scale-95 shrink-0"><Send className="w-4 h-4 rtl:-scale-x-100" /></button>
          </form>
        </div>
      </div>
    </div>
  );
}
