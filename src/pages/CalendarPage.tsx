import React, { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { AdBanner } from '../components/AdBanner';
import { 
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Sparkles, MapPin, 
  Search, Star, Users, Send, Trash2, X, Bot, MessageSquare, Loader2, 
  Filter, Navigation, ShieldCheck, Flame, Tag, Layers, ArrowRight, Info
} from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek } from 'date-fns';
import { arSA } from 'date-fns/locale';
import { getFullDateInfo, CalendarType } from '../utils/dateUtils';
import { useCalendar } from '../context/CalendarContext';
import { halls, getStoredHalls } from '../data/mockData';
import { Link } from 'react-router-dom';

export default function CalendarPage() {
  const [hallsList, setHallsList] = useState(() => getStoredHalls());

  useEffect(() => {
    const handleHallsUpdate = () => {
      setHallsList(getStoredHalls());
    };
    window.addEventListener('storage', handleHallsUpdate);
    window.addEventListener('settingsUpdated', handleHallsUpdate);
    window.addEventListener('hallsUpdated', handleHallsUpdate);
    return () => {
      window.removeEventListener('storage', handleHallsUpdate);
      window.removeEventListener('settingsUpdated', handleHallsUpdate);
      window.removeEventListener('hallsUpdated', handleHallsUpdate);
    };
  }, []);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { calendarType, setCalendarType } = useCalendar();
  const [aiAssistantOpen, setAiAssistantOpen] = useState(true);

  // Client Filters
  const [selectedCity, setSelectedCity] = useState<string>('الكل');
  const [selectedCategory, setSelectedCategory] = useState<string>('الكل');
  const [isGpsActive, setIsGpsActive] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);

  interface ChatMessage {
    id: string;
    role: 'user' | 'model';
    content: string;
    timestamp?: Date;
  }

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem('CALENDAR_AI_CHAT');
      return saved ? JSON.parse(saved) : [
        { 
          id: 'msg-start', 
          role: 'model', 
          content: 'أهلاً بك! أنا مساعدك الذكي للتقويم في منصة ليلة 🌟.\nأستطيع مساعدتك في العثور على أفضل القاعات والخدمات في جميع مدن المملكة، وتنسيق المواعيد حسب ميزانيتك وعدد الحضور، ومقارنة التواريخ الهجرية والميلادية.\n\nبماذا يمكنني مساعدتك اليوم؟' 
        }
      ];
    } catch {
      return [
        { id: 'msg-start', role: 'model', content: 'أهلاً بك! أنا مساعدك الذكي للتقويم في منصة ليلة 🌟.' }
      ];
    }
  });

  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isAiLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    const updatedMessages = [...chatMessages, userMsg];
    setChatMessages(updatedMessages);
    localStorage.setItem('CALENDAR_AI_CHAT', JSON.stringify(updatedMessages));
    setChatInput('');
    setIsAiLoading(true);

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      });

      const data = await response.json();
      
      const aiMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        role: 'model',
        content: data.text || "عذراً لم أستطع توليد استجابة حالياً.",
        timestamp: new Date()
      };

      const finalMessages = [...updatedMessages, aiMsg];
      setChatMessages(finalMessages);
      localStorage.setItem('CALENDAR_AI_CHAT', JSON.stringify(finalMessages));
    } catch (err) {
      console.error(err);
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now() + 2}`,
        role: 'model',
        content: "عذراً، حدث خطأ أثناء الاتصال بالمساعد الذكي للتقويم. يرجى التحقق من اتصالك بالإنترنت والمحاولة مجدداً.",
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  const clearChat = () => {
    const defaultChat: ChatMessage[] = [
      { 
        id: 'msg-start', 
        role: 'model', 
        content: 'أهلاً بك! أنا مساعدك الذكي للتقويم في منصة ليلة 🌟.\nأستطيع مساعدتك في العثور على أفضل القاعات والخدمات في جميع مدن المملكة، وتنسيق المواعيد حسب ميزانيتك وعدد الحضور، ومقارنة التواريخ الهجرية والميلادية.\n\nبماذا يمكنني مساعدتك اليوم؟' 
      }
    ];
    setChatMessages(defaultChat);
    localStorage.setItem('CALENDAR_AI_CHAT', JSON.stringify(defaultChat));
  };

  const handleGpsToggle = () => {
    if (isGpsActive) {
      setIsGpsActive(false);
      return;
    }

    setGpsLoading(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setGpsLoading(false);
          setIsGpsActive(true);
          setSelectedCity('الرياض'); // Default nearby center
        },
        () => {
          setGpsLoading(false);
          alert('تعذر تحديد الموقع الجغرافي. يمكنك اختيار المدينة يدوياً من قائمة المدن.');
        }
      );
    } else {
      setGpsLoading(false);
      alert('خدمة تحديد الموقع غير مدعومة في متصفحك.');
    }
  };

  const handleDateSelect = async (day: Date) => {
    setSelectedDate(day);
    
    const dInfo = getFullDateInfo(day);
    const gregStr = format(day, 'yyyy-MM-dd');
    const hijriStr = dInfo.hijri.full;
    const dayName = format(day, 'EEEE', { locale: arSA });

    let cityFilterPrompt = selectedCity !== 'الكل' ? ` في مدينة ${selectedCity}` : '';
    let categoryFilterPrompt = selectedCategory !== 'الكل' ? ` لفئة ${selectedCategory}` : '';

    const promptMessage = `مرحباً! اخترت تاريخ ${dayName} (${gregStr} م / ${hijriStr} هـ)${cityFilterPrompt}${categoryFilterPrompt} 📅. ما هي القاعات والخيارات المتاحة والفرص المميزة في هذا اليوم؟ ✨`;
    
    await handleSendMessage(promptMessage);
  };

  // Helper to determine date indicator density
  const getDateInsight = (day: Date) => {
    const dayOfWeek = day.getDay(); // 0=Sun, 4=Thu, 5=Fri, 6=Sat
    const dateNum = day.getDate();

    if (dayOfWeek === 4 || dayOfWeek === 5) {
      return {
        type: 'high_demand',
        label: 'إقبال مرتفع 🔥',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
        dotColor: 'bg-amber-500'
      };
    } else if (dateNum % 5 === 0) {
      return {
        type: 'special_offer',
        label: 'عروض موسمية 💎',
        badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
        dotColor: 'bg-purple-500'
      };
    }
    return {
      type: 'high_availability',
      label: 'وفرة خيارات 🟢',
      badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
      dotColor: 'bg-emerald-500'
    };
  };

  const availableHalls = useMemo(() => {
    return hallsList.filter(hall => {
      // City filter
      if (selectedCity !== 'الكل' && hall.city !== selectedCity) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'الكل') {
        if (selectedCategory === 'قاعات فخمة' && hall.price < 15000) return false;
        if (selectedCategory === 'استراحات وشاليهات' && hall.price > 8000) return false;
      }

      return true;
    });
  }, [hallsList, selectedCity, selectedCategory]);

  const headerDateInfo = getFullDateInfo(currentDate);

  const nextMonth = () => {
    if (calendarType === 'gregorian') {
      setCurrentDate(addMonths(currentDate, 1));
    } else {
      const next = new Date(currentDate);
      next.setDate(next.getDate() + 30);
      setCurrentDate(next);
    }
  };

  const prevMonth = () => {
    if (calendarType === 'gregorian') {
      setCurrentDate(subMonths(currentDate, 1));
    } else {
      const prev = new Date(currentDate);
      prev.setDate(prev.getDate() - 30);
      setCurrentDate(prev);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex flex-col" dir="rtl">
      <Header />
      <AdBanner placement="شريط الإعلان العلوي" layout="banner" className="border-none" />
      <main className="flex-grow max-w-7xl mx-auto px-4 md:px-6 w-full py-8">
        
        {/* Title & Introduction */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-blue-950 flex items-center gap-2 border-r-4 border-amber-500 pr-3">
              <CalendarIcon className="w-7 h-7 text-amber-500 inline" />
              التقويم الذكي لمناسبة ليلة
            </h1>
            <p className="text-xs md:text-sm text-slate-500 pr-4 mt-1">
              مكشاف الوفرة والتخطيط الذكي للمناسبات عبر جميع القاعات والخدمات بالمملكة. اختر أي يوم لاستكشاف الخيارات المتاحة فوراً.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs font-bold shrink-0">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>جميع التواريخ مفتوحة للاستكشاف والطلب الحقيقي</span>
          </div>
        </div>

        {/* Global Smart Filters & GPS Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 p-4 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            
            {/* GPS & City Selectors */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={handleGpsToggle}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isGpsActive 
                    ? 'bg-blue-950 text-white border-blue-950 shadow-sm' 
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {gpsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-amber-500" />
                ) : (
                  <Navigation className={`w-4 h-4 ${isGpsActive ? 'text-amber-400' : 'text-blue-900'}`} />
                )}
                <span>{isGpsActive ? 'الموقع الجغرافي (نشط)' : 'تحديد الأقرب GPS'}</span>
              </button>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <MapPin className="w-4 h-4 text-amber-500" />
                <span>المدينة:</span>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="bg-transparent font-black text-blue-950 focus:outline-none cursor-pointer"
                >
                  <option value="الكل">جميع مدن المملكة (الكل)</option>
                  <option value="الرياض">الرياض</option>
                  <option value="جدة">جدة</option>
                  <option value="الدمام">الدمام</option>
                  <option value="مكة المكرمة">مكة المكرمة</option>
                  <option value="المدينة المنورة">المدينة المنورة</option>
                  <option value="الخبر">الخبر</option>
                  <option value="الطائف">الطائف</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700">
                <Layers className="w-4 h-4 text-purple-500" />
                <span>الفئة:</span>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-transparent font-black text-blue-950 focus:outline-none cursor-pointer"
                >
                  <option value="الكل">جميع الخيارات والخدمات</option>
                  <option value="قاعات فخمة">قاعات كبرى وفخمة</option>
                  <option value="استراحات وشاليهات">استراحات وشاليهات</option>
                </select>
              </div>
            </div>

          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Calendar Area */}
          <div className="lg:w-2/3 space-y-6">

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5 md:p-7">
              
              {/* Calendar Header */}
              <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100 flex-wrap">
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-blue-950 flex items-center gap-2">
                    {calendarType === 'gregorian' ? (
                      <>
                        <span>{format(currentDate, "MMMM yyyy", { locale: arSA })}</span>
                        <span className="text-amber-600 text-sm font-bold">({headerDateInfo.hijri.monthName} {headerDateInfo.hijri.year})</span>
                      </>
                    ) : (
                      <>
                        <span>{headerDateInfo.hijri.monthName} {headerDateInfo.hijri.year}</span>
                        <span className="text-amber-600 text-sm font-bold">({format(currentDate, "MMMM yyyy", { locale: arSA })})</span>
                      </>
                    )}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                    انقر على أي يوم لاستكشاف القاعات والخدمات المتاحة فوراً
                  </p>
                </div>

                <div className="flex items-center gap-2.5 flex-wrap">
                  {/* Hijri/Gregorian Toggle */}
                  <div className="flex bg-slate-100 rounded-xl p-1 border border-slate-200 gap-1 items-center">
                    <button 
                      onClick={() => setCalendarType('gregorian')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${calendarType === 'gregorian' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      ميلادي
                    </button>
                    <button 
                      onClick={() => setCalendarType('hijri')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${calendarType === 'hijri' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:bg-slate-200'}`}
                    >
                      هجري
                    </button>
                  </div>

                  {/* Navigation Arrows */}
                  <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-xl border border-slate-200">
                    <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-xs rounded-lg transition-all text-slate-700 cursor-pointer" title="الشهر السابق">
                      <ChevronRight className="w-5 h-5" />
                    </button>
                    <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-xs rounded-lg transition-all text-slate-700 cursor-pointer" title="الشهر التالي">
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Days of week */}
              <div className="grid grid-cols-7 gap-2 mb-3 text-center">
                {['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'].map((day) => (
                  <div key={day} className="text-xs font-black text-slate-400 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-2 md:gap-3" key={calendarType}>
                {(() => {
                  const monthStart = startOfMonth(currentDate);
                  const start = startOfWeek(monthStart);
                  const end = endOfWeek(endOfMonth(currentDate));
                  const gridDays = eachDayOfInterval({ start, end });
                  
                  return gridDays.map((day) => {
                    const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                    const dInfo = getFullDateInfo(day);
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const insight = getDateInsight(day);
                    
                    return (
                      <div 
                        key={day.toString()}
                        onClick={() => handleDateSelect(day)}
                        className={`relative aspect-square flex flex-col items-center justify-center rounded-2xl cursor-pointer transition-all border p-1 ${
                          isSelected ? 'bg-blue-950 text-white border-blue-950 shadow-md transform scale-105 z-10' :
                          !isCurrentMonth ? 'text-slate-300 border-slate-50 opacity-30' :
                          isToday(day) ? 'bg-amber-50 text-amber-900 border-2 border-amber-500 font-bold shadow-xs' :
                          'bg-slate-50/70 text-slate-800 border-slate-100 hover:bg-amber-100/60 hover:text-amber-900 hover:border-amber-300'
                        }`}
                      >
                        <div className="flex flex-col items-center leading-none">
                           <span className="text-base md:text-xl font-black">
                             {calendarType === 'gregorian' ? dInfo.gregorian.day : dInfo.hijri.day}
                           </span>
                           <span className={`text-[10px] font-bold mt-1 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`}>
                             {calendarType === 'gregorian' ? dInfo.hijri.day : dInfo.gregorian.day}
                           </span>
                        </div>
                        
                        {/* Status Density Indicators */}
                        {isCurrentMonth && (
                          <div className="absolute bottom-1.5 flex items-center gap-1">
                            <span className={`w-1.5 h-1.5 rounded-full ${insight.dotColor}`}></span>
                          </div>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>

              {/* Smart Demand Legend */}
              <div className="flex flex-wrap items-center justify-between gap-4 mt-6 p-3.5 bg-slate-50/90 rounded-2xl text-xs border border-slate-200/80">
                <span className="font-extrabold text-slate-700">دليل وفرة المواعيد:</span>
                <div className="flex items-center gap-4 flex-wrap text-slate-600 font-bold">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                    <span>وفرة خيارات عالية 🟢</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                    <span>طلب مرتفع وخيارات شائعة 🔥</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                    <span>مواسم وعروض خاصة 💎</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Smart Insight Box */}
            <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl p-4 shadow-sm border border-blue-800 flex items-start gap-3">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl border border-amber-500/30 shrink-0 mt-0.5">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-xs space-y-1">
                <h4 className="font-black text-amber-300">ملاحظة ذكية للتخطيط للمناسبات:</h4>
                <p className="text-slate-200 leading-relaxed">
                  التقويم العام يوضح توفر الخدمات على مستوى كافة المنشآت والمزودين المعتمدين في المملكة. يمكنك اختيار أي يوم لعرض القاعات والخدمات المتاحة للحجز المباشر فيه، أو تحديد مدينتك للحصول على أدق نتائج.
                </p>
              </div>
            </div>

          </div>

          {/* Sidebar / AI Assistant & Selected Date Results */}
          <div className="lg:w-1/3 space-y-6">
            
            {/* AI Assistant Module */}
            {aiAssistantOpen ? (
              <div className="bg-gradient-to-b from-blue-950 to-blue-900 rounded-3xl shadow-lg border border-blue-900 overflow-hidden text-white flex flex-col h-[520px] relative">
                {/* Background Glow */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 pointer-events-none"></div>

                {/* Header */}
                <div className="p-3.5 bg-blue-950/90 backdrop-blur-md border-b border-white/10 flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-amber-500/20 text-amber-400 rounded-xl flex items-center justify-center border border-amber-500/30">
                      <Sparkles className="w-4 h-4 animate-pulse" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-amber-400 flex items-center gap-1 leading-none">
                        مساعد ليلة الذكي للتقويم
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping"></span>
                      </h3>
                      <span className="text-[10px] text-blue-200 mt-0.5 block">مستشار التخطيط التفاعلي</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button 
                      onClick={clearChat}
                      title="مسح المحادثة"
                      className="p-1 text-blue-200 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => setAiAssistantOpen(false)}
                      title="تصغير المساعد"
                      className="p-1 text-blue-200 hover:text-white hover:bg-white/5 rounded-lg transition-colors cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Message list */}
                <div className="flex-1 overflow-y-auto p-3.5 space-y-3 flex flex-col relative z-10">
                  {chatMessages.map((msg) => (
                    <div 
                      key={msg.id}
                      className={`flex gap-2 max-w-[88%] ${msg.role === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}
                    >
                      {msg.role !== 'user' && (
                        <div className="w-7 h-7 rounded-lg bg-blue-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-amber-400">
                          <Bot className="w-3.5 h-3.5" />
                        </div>
                      )}
                      <div 
                        className={`p-2.5 rounded-2xl text-[11px] leading-relaxed whitespace-pre-wrap ${
                          msg.role === 'user' 
                            ? 'bg-amber-500 text-blue-950 font-bold rounded-tl-none shadow-sm' 
                            : 'bg-white/10 text-slate-100 border border-white/5 rounded-tr-none'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))}

                  {isAiLoading && (
                    <div className="flex gap-2 self-start items-center">
                      <div className="w-7 h-7 rounded-lg bg-blue-900 border border-white/10 flex items-center justify-center flex-shrink-0 text-amber-400">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      </div>
                      <div className="bg-white/5 text-blue-100/60 text-[11px] px-3 py-1.5 rounded-2xl rounded-tr-none border border-white/5 animate-pulse">
                        جاري تحليل التاريخ واقتراح أفضل القاعات...
                      </div>
                    </div>
                  )}
                </div>

                {/* Suggestions chips */}
                <div className="px-3 py-2 bg-blue-950/40 border-t border-white/5 flex gap-1.5 overflow-x-auto relative z-10 [scrollbar-width:none]">
                  {[
                    "قاعات بالرياض لـ 300 شخص 🤵",
                    "استراحة بجدة 🏊",
                    "عروض نهاية الأسبوع 💎"
                  ].map((suggestion, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(suggestion)}
                      disabled={isAiLoading}
                      className="flex-shrink-0 bg-white/5 hover:bg-amber-500 hover:text-blue-950 border border-white/10 disabled:opacity-40 text-[10px] px-2.5 py-1 rounded-full text-blue-100 transition-colors cursor-pointer"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>

                {/* Footer input form */}
                <div className="p-2.5 bg-blue-950 border-t border-white/10 relative z-10 flex gap-2">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSendMessage(chatInput);
                      }
                    }}
                    disabled={isAiLoading}
                    placeholder="اسأل المساعد عن تواريخ وأسعار..."
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white placeholder-blue-300/40 focus:outline-none focus:border-amber-500 disabled:opacity-50"
                  />
                  <button 
                    onClick={() => handleSendMessage(chatInput)}
                    disabled={isAiLoading || !chatInput.trim()}
                    className="w-8 h-8 bg-amber-500 hover:bg-amber-400 text-blue-950 disabled:opacity-40 transition-all rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5 transform rotate-180" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-gradient-to-b from-blue-950 to-blue-900 rounded-3xl shadow-md p-5 text-white relative overflow-hidden">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center text-amber-400">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold">مساعد ليلة الذكي</h3>
                      <p className="text-[11px] text-blue-200">استشِر الذكاء الاصطناعي لاختيار تاريخك الأنسب</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setAiAssistantOpen(true)}
                    className="bg-amber-500 hover:bg-amber-400 text-blue-950 font-extrabold text-xs px-3 py-1.5 rounded-xl transition-colors shadow-xs cursor-pointer"
                  >
                    فتح المحادثة
                  </button>
                </div>
              </div>
            )}

            {/* Selected Date Details & Available Options */}
            {selectedDate && (
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200/90 p-5">
                
                {/* Header Date Info */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-amber-50 text-amber-700 rounded-2xl flex flex-col items-center justify-center border border-amber-200/80 shrink-0">
                      <span className="text-lg font-black leading-none">
                        {calendarType === 'gregorian' ? format(selectedDate, 'd') : getFullDateInfo(selectedDate).hijri.day}
                      </span>
                      <span className="text-[9px] font-bold text-amber-800 mt-0.5">
                        {calendarType === 'gregorian' ? getFullDateInfo(selectedDate).hijri.day : format(selectedDate, 'd')}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-slate-900">
                        {format(selectedDate, 'EEEE', { locale: arSA })}
                      </h4>
                      <p className="text-[11px] text-slate-500 flex items-center gap-1 flex-wrap mt-0.5">
                        <span>{format(selectedDate, 'd MMMM yyyy', { locale: arSA })} م</span>
                        <span>•</span>
                        <span className="font-bold text-amber-700">{getFullDateInfo(selectedDate).hijri.full} هـ</span>
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-black border ${getDateInsight(selectedDate).badgeColor}`}>
                    {getDateInsight(selectedDate).label}
                  </span>
                </div>

                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-extrabold text-xs text-blue-950">
                    الخيارات المتاحة ({availableHalls.length} منشأة):
                  </h5>
                  <span className="text-[10px] text-slate-400">تأكيد حجز مباشر</span>
                </div>

                <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
                  {availableHalls.length > 0 ? (
                    availableHalls.map(hall => (
                      <Link 
                        key={hall.id} 
                        to={`/hall/${hall.id}`} 
                        className="group flex items-center gap-3 p-2.5 bg-slate-50/80 hover:bg-slate-100/80 rounded-2xl transition-all border border-slate-200/60"
                      >
                        <img src={hall.image} alt={hall.name} className="w-14 h-14 rounded-xl object-cover shadow-xs group-hover:scale-105 transition-transform shrink-0" />
                        <div className="flex-grow min-w-0">
                          <h6 className="font-bold text-xs text-slate-900 truncate">{hall.name}</h6>
                          <p className="text-[10px] text-slate-500 mb-1 flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-amber-600" /> {hall.city}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 flex items-center gap-0.5">
                              <Users className="w-3 h-3 text-slate-400" /> {hall.capacity}
                            </span>
                            <span className="text-[10px] font-black text-amber-700">
                              {hall.price} ر.س
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <div className="flex items-center gap-1 text-amber-500">
                            <span className="text-xs font-bold">{hall.rating}</span>
                            <Star className="w-3 h-3 fill-amber-400" />
                          </div>
                          <span className="text-[9px] font-black px-2 py-0.5 rounded-full text-emerald-700 bg-emerald-50 border border-emerald-200">
                            متاح للحجز
                          </span>
                        </div>
                      </Link>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                      <p className="text-slate-500 text-xs font-bold">لا توجد نتائج تطابق الفلتر الحالي</p>
                      <button 
                        onClick={() => { setSelectedCity('الكل'); setSelectedCategory('الكل'); }}
                        className="mt-2 text-amber-600 text-xs font-black hover:underline cursor-pointer"
                      >
                        إعادة ضبط الفلاتر
                      </button>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
